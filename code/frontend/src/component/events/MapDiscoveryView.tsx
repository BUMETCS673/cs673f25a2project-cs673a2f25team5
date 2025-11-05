/*

 AI-generated code: 80% (tool: Codex - GPT-5, userLocation, locationError, locationStatus, geocodeStatus, geocodeError, points, selectedEventId, isMapReady, mapboxToken, viewState, hasAppliedUserLocation, hasCenteredOnEvents, mapRef, markerRegistryRef, markerHandlersRef, useEffect, load, renderStatusBadge, syncHandler, nextHandler  ) 
 
 Human code: 20% (functions: MapDiscoveryView, MapDiscoveryViewProps) 

 No framework-generated code.

*/

"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import MapboxMap, { Marker, NavigationControl } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import type { EventResponse } from "@/types/eventTypes";
import { getPublicMapboxToken } from "@/component/map/getPublicMapboxToken";
import { decodeEventLocation } from "@/helpers/locationCodec";

type Coordinates = {
  longitude: number;
  latitude: number;
};

type EventPoint = EventResponse & {
  coordinates: Coordinates;
  distanceKm: number | null;
  locationLabel: string;
};

type MapDiscoveryViewProps = {
  events: EventResponse[];
};

type AsyncStatus = "idle" | "loading" | "success" | "error";

const DEFAULT_CENTER: Coordinates = {
  longitude: -98.5795,
  latitude: 39.8283,
};

const DEFAULT_ZOOM = 3.25;
const NEARBY_LIMIT = 12;
const MAX_DISTANCE_KM = 150;

const geocodeCache = new Map<string, Coordinates>();

type DistanceNode = {
  event: EventPoint;
  distance: number;
};

class MinDistanceHeap {
  #heap: DistanceNode[];

  constructor() {
    this.#heap = [];
  }

  push(node: DistanceNode) {
    this.#heap.push(node);
    this.#siftUp(this.#heap.length - 1);
  }

  pop(): DistanceNode | undefined {
    if (this.#heap.length === 0) {
      return undefined;
    }
    const root = this.#heap[0];
    const last = this.#heap.pop();
    if (last && this.#heap.length > 0) {
      this.#heap[0] = last;
      this.#siftDown(0);
    }
    return root;
  }

  get size(): number {
    return this.#heap.length;
  }

  #siftUp(index: number) {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.#heap[parent].distance <= this.#heap[current].distance) {
        break;
      }
      this.#swap(parent, current);
      current = parent;
    }
  }

  #siftDown(index: number) {
    let current = index;
    const length = this.#heap.length;
    while (true) {
      const left = current * 2 + 1;
      const right = left + 1;
      let smallest = current;

      if (
        left < length &&
        this.#heap[left].distance < this.#heap[smallest].distance
      ) {
        smallest = left;
      }

      if (
        right < length &&
        this.#heap[right].distance < this.#heap[smallest].distance
      ) {
        smallest = right;
      }

      if (smallest === current) {
        break;
      }

      this.#swap(current, smallest);
      current = smallest;
    }
  }

  #swap(a: number, b: number) {
    const temp = this.#heap[a];
    this.#heap[a] = this.#heap[b];
    this.#heap[b] = temp;
  }
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Time to be announced";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDistance(distanceKm: number | null): string {
  if (distanceKm == null) {
    return "Distance unavailable";
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

function toLngLat(coordinates: Coordinates): mapboxgl.LngLatLike {
  return {
    lng: coordinates.longitude,
    lat: coordinates.latitude,
  };
}

function haversineDistance(a: Coordinates, b: Coordinates): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const aCalc =
    sinLat * sinLat + sinLon * sinLon * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(aCalc), Math.sqrt(1 - aCalc));
  return R * c;
}

// Pick nearest events via a Dijkstra-style min-heap traversal so we avoid
// sorting the entire collection when only the closest few are needed.
function selectNearestEvents(
  origin: Coordinates | null,
  events: EventPoint[],
  limit: number,
): EventPoint[] {
  if (!events.length) {
    return [];
  }

  if (!origin) {
    return events.slice(0, limit).map((event) => ({
      ...event,
      distanceKm: event.distanceKm ?? null,
    }));
  }

  const heap = new MinDistanceHeap();
  for (const event of events) {
    const distance = haversineDistance(origin, event.coordinates);
    heap.push({ event, distance });
  }

  const result: EventPoint[] = [];
  while (heap.size > 0 && result.length < limit) {
    const next = heap.pop();
    if (!next) {
      break;
    }

    if (next.distance > MAX_DISTANCE_KM && result.length > 0) {
      continue;
    }

    result.push({
      ...next.event,
      distanceKm: next.distance,
    });
  }

  if (!result.length) {
    return events.slice(0, limit).map((event) => ({
      ...event,
      distanceKm: null,
    }));
  }

  return result;
}

async function geocodeLocation(
  location: string,
  token: string,
  signal: AbortSignal,
): Promise<Coordinates | null> {
  if (geocodeCache.has(location)) {
    return geocodeCache.get(location) ?? null;
  }

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json`,
  );
  url.searchParams.set("limit", "1");
  url.searchParams.set("access_token", token);

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    throw new Error(`Geocoding failed (${response.status})`);
  }

  const data = (await response.json()) as {
    features?: { center?: [number, number] }[];
  };
  const coordinates = data.features?.[0]?.center;

  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  const point: Coordinates = {
    longitude: coordinates[0],
    latitude: coordinates[1],
  };

  geocodeCache.set(location, point);
  return point;
}

export function MapDiscoveryView({ events }: MapDiscoveryViewProps) {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<AsyncStatus>("idle");

  const [geocodeStatus, setGeocodeStatus] = useState<AsyncStatus>("idle");
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const [points, setPoints] = useState<EventPoint[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const mapboxToken = useMemo(() => getPublicMapboxToken(), []);

  const [viewState, setViewState] = useState({
    longitude: DEFAULT_CENTER.longitude,
    latitude: DEFAULT_CENTER.latitude,
    zoom: DEFAULT_ZOOM,
    pitch: 0,
    bearing: 0,
  });

  const hasAppliedUserLocation = useRef(false);
  const hasCenteredOnEvents = useRef(false);
  const mapRef = useRef<MapRef | null>(null);
  const markerRegistryRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const markerHandlersRef = useRef<Map<string, (event: MouseEvent) => void>>(
    new Map(),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!("geolocation" in navigator)) {
      setLocationStatus("error");
      setLocationError("Geolocation is not supported on this device.");
      return;
    }

    setLocationStatus("loading");
    const timeoutId = window.setTimeout(() => {
      setLocationStatus("loading");
    }, 0);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timeoutId);
        const coords = {
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
        };
        setUserLocation(coords);
        setLocationStatus("success");
        setLocationError(null);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        setLocationStatus("error");
        setLocationError(
          error.message || "Unable to access your current location.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60_000,
      },
    );
  }, []);

  useEffect(() => {
    if (!mapboxToken) {
      setGeocodeStatus("error");
      setGeocodeError(
        "Missing Mapbox token. Add NEXT_PUBLIC_MAPBOX_TOKEN to enable discovery maps.",
      );
      setPoints([]);
      return;
    }

    let cancelled = false;
    const controllers: AbortController[] = [];

    const load = async () => {
      setGeocodeStatus("loading");
      setGeocodeError(null);

      try {
        const resolved: EventPoint[] = [];
        for (const event of events) {
          const decoded = decodeEventLocation(event.event_location);
          const locationLabel =
            decoded?.address ??
            event.event_location ??
            "Location to be announced";

          if (!event.event_location || !event.event_location.trim()) {
            continue;
          }

          if (!locationLabel) {
            continue;
          }

          let coordinates: Coordinates | null = null;
          if (
            decoded?.longitude != null &&
            decoded?.latitude != null &&
            Number.isFinite(decoded.longitude) &&
            Number.isFinite(decoded.latitude)
          ) {
            coordinates = {
              longitude: decoded.longitude,
              latitude: decoded.latitude,
            };
          } else if (geocodeCache.has(locationLabel)) {
            coordinates = geocodeCache.get(locationLabel) ?? null;
          } else {
            const controller = new AbortController();
            controllers.push(controller);
            try {
              coordinates = await geocodeLocation(
                locationLabel,
                mapboxToken,
                controller.signal,
              );
            } catch (error) {
              if (controller.signal.aborted) {
                return;
              }
              throw error;
            }
          }

          if (!coordinates) {
            continue;
          }

          resolved.push({
            ...event,
            coordinates,
            distanceKm: null,
            locationLabel,
          });
          geocodeCache.set(locationLabel, coordinates);
        }

        if (cancelled) {
          return;
        }

        setPoints(resolved);
        setGeocodeStatus("success");
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "We could not locate nearby events.";
        setGeocodeStatus("error");
        setGeocodeError(message);
        setPoints([]);
      }
    };

    void load();

    return () => {
      cancelled = true;
      for (const controller of controllers) {
        controller.abort();
      }
    };
  }, [events, mapboxToken]);

  const nearbyPoints = useMemo(() => {
    return selectNearestEvents(userLocation, points, NEARBY_LIMIT);
  }, [points, userLocation]);

  useEffect(() => {
    if (!nearbyPoints.length) {
      setSelectedEventId(null);
      return;
    }

    setSelectedEventId((current) => {
      if (current && nearbyPoints.some((item) => item.event_id === current)) {
        return current;
      }
      return nearbyPoints[0]?.event_id ?? null;
    });
  }, [nearbyPoints]);

  useEffect(() => {
    if (userLocation && !hasAppliedUserLocation.current) {
      setViewState((previous) => ({
        ...previous,
        longitude: userLocation.longitude,
        latitude: userLocation.latitude,
        zoom: 12,
      }));
      hasAppliedUserLocation.current = true;
    }
  }, [userLocation]);

  useEffect(() => {
    if (
      hasAppliedUserLocation.current ||
      hasCenteredOnEvents.current ||
      !nearbyPoints.length
    ) {
      return;
    }

    const first = nearbyPoints[0];
    setViewState((previous) => ({
      ...previous,
      longitude: first.coordinates.longitude,
      latitude: first.coordinates.latitude,
      zoom: 11,
    }));
    hasCenteredOnEvents.current = true;
  }, [nearbyPoints]);

  const selectedEvent = useMemo(() => {
    return (
      nearbyPoints.find((event) => event.event_id === selectedEventId) ?? null
    );
  }, [nearbyPoints, selectedEventId]);
  const selectedEventLocationLabel = useMemo(() => {
    if (!selectedEvent) {
      return "Location to be announced";
    }
    return (
      selectedEvent.locationLabel ??
      decodeEventLocation(selectedEvent.event_location)?.address ??
      "Location to be announced"
    );
  }, [selectedEvent]);

  const renderStatusBadge = (status: AsyncStatus, message: ReactNode) => {
    if (status !== "loading") {
      return null;
    }
    return (
      <div className="pointer-events-none absolute left-1/2 top-6 z-20 -translate-x-1/2 rounded-full border border-amber-300/60 bg-white/80 px-4 py-2 text-xs font-medium text-amber-700 shadow-lg backdrop-blur-md dark:border-amber-400/20 dark:bg-neutral-900/70 dark:text-amber-200">
        {message}
      </div>
    );
  };

  const drawerBaseClasses =
    "rounded-3xl border border-neutral-200/60 bg-white/95 p-6 shadow-xl shadow-amber-500/10 backdrop-blur-sm transition-all duration-300 ease-out dark:border-white/10 dark:bg-neutral-900/85 dark:shadow-neutral-900/40";

  useEffect(() => {
    if (!isMapReady || !mapRef.current) {
      return;
    }

    const map = mapRef.current.getMap();
    const resize = () => {
      map.resize();
    };

    resize();
    window.addEventListener("resize", resize);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        resize();
      });
      observer.observe(map.getContainer());
    }

    return () => {
      window.removeEventListener("resize", resize);
      observer?.disconnect();
    };
  }, [isMapReady]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) {
      return;
    }

    const map = mapRef.current.getMap();
    const registry = markerRegistryRef.current;
    const handlers = markerHandlersRef.current;
    const remaining = new Set(registry.keys());

    for (const event of nearbyPoints) {
      const id = event.event_id;
      remaining.delete(id);
      const locationLabel =
        event.locationLabel ??
        decodeEventLocation(event.event_location)?.address ??
        "Location to be announced";

      const lngLat = toLngLat(event.coordinates);

      const syncHandler = (marker: mapboxgl.Marker) => {
        const element = marker.getElement();
        const previousHandler = handlers.get(id);
        if (previousHandler) {
          element.removeEventListener("click", previousHandler);
        }
        const nextHandler = (nativeEvent: MouseEvent) => {
          nativeEvent.preventDefault();
          nativeEvent.stopPropagation();
          setSelectedEventId(id);
          setViewState((previous) => ({
            ...previous,
            longitude: event.coordinates.longitude,
            latitude: event.coordinates.latitude,
          }));
        };
        element.addEventListener("click", nextHandler);
        handlers.set(id, nextHandler);
        element.setAttribute("title", locationLabel);
        element.style.cursor = "pointer";
      };

      let marker = registry.get(id);
      if (!marker) {
        marker = new mapboxgl.Marker({
          color: event.event_id === selectedEventId ? "#f59e0b" : "#111827",
          anchor: "bottom",
        })
          .setLngLat(lngLat)
          .addTo(map);
        registry.set(id, marker);
      } else {
        marker.setLngLat(lngLat);
      }

      syncHandler(marker);

      if (typeof marker.setPitchAlignment === "function") {
        marker.setPitchAlignment("map");
      }
      if (typeof marker.setRotationAlignment === "function") {
        marker.setRotationAlignment("map");
      }
    }

    for (const staleId of remaining) {
      const marker = registry.get(staleId);
      const handler = handlers.get(staleId);
      if (marker && handler) {
        marker.getElement().removeEventListener("click", handler);
      }
      marker?.remove();
      registry.delete(staleId);
      handlers.delete(staleId);
    }
  }, [isMapReady, nearbyPoints, selectedEventId]);

  useEffect(() => {
    const registry = markerRegistryRef.current;
    const handlers = markerHandlersRef.current;
    return () => {
      for (const [id, marker] of registry) {
        const handler = handlers.get(id);
        if (handler) {
          marker.getElement().removeEventListener("click", handler);
        }
        marker.remove();
      }
      registry.clear();
      handlers.clear();
    };
  }, []);

  if (!mapboxToken) {
    return (
      <section className="rounded-3xl border border-amber-200/60 bg-amber-50/50 p-8 text-sm text-amber-700 shadow-inner dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
        Add your Mapbox token to the environment variables to enable the
        discovery map experience.
      </section>
    );
  }

  return (
    <section className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
        <div className="group relative h-[48rem] w-full overflow-hidden rounded-3xl border border-neutral-200/50 bg-white shadow-xl shadow-amber-500/10 dark:border-white/10 dark:bg-neutral-950 sm:h-[26rem] md:h-[28rem] lg:h-[30rem] xl:h-[32rem]">
          {renderStatusBadge(locationStatus, "Locating you…")}
          {renderStatusBadge(geocodeStatus, "Loading nearby events…")}
          {locationStatus === "error" && locationError ? (
            <div className="pointer-events-none absolute left-5 top-5 z-20 rounded-2xl border border-red-200/70 bg-white/95 px-4 py-3 text-xs text-red-600 shadow-lg dark:border-red-500/20 dark:bg-neutral-900/85 dark:text-red-300">
              {locationError}
            </div>
          ) : null}
          {geocodeStatus === "error" && geocodeError ? (
            <div className="pointer-events-none absolute left-5 bottom-5 z-20 rounded-2xl border border-red-200/70 bg-white/95 px-4 py-3 text-xs text-red-600 shadow-lg dark:border-red-500/20 dark:bg-neutral-900/85 dark:text-red-300">
              {geocodeError}
            </div>
          ) : null}

          <MapboxMap
            mapboxAccessToken={mapboxToken}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            longitude={viewState.longitude}
            latitude={viewState.latitude}
            zoom={viewState.zoom}
            // pitch={viewState.pitch}
            // bearing={viewState.bearing}
            ref={mapRef}
            onMove={(moveEvent) => {
              setViewState((previous) => ({
                ...previous,
                ...moveEvent.viewState,
              }));
            }}
            onLoad={() => {
              mapRef.current?.getMap().resize();
              setIsMapReady(true);
            }}
            attributionControl={true}
            style={{ width: "100%", height: "100%" }}
            initialViewState={{
              longitude: viewState.longitude,
              latitude: viewState.latitude,
              zoom: viewState.zoom,
            }}
            scrollZoom={true}
            doubleClickZoom={false}
            touchZoomRotate={false}
            keyboard={false}
            dragRotate={false}
            boxZoom={false}
          >
            <NavigationControl position="bottom-right" showCompass={false} />

            {userLocation ? (
              <Marker
                longitude={userLocation.longitude}
                latitude={userLocation.latitude}
                anchor="center"
              >
                <div className="relative flex h-10 w-10 items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-amber-500/15 blur-md" />
                  <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-white bg-amber-500 text-[10px] font-semibold text-white shadow-lg shadow-amber-500/40">
                    You
                  </span>
                </div>
              </Marker>
            ) : null}
          </MapboxMap>
        </div>

        <div className="relative">
          <div
            className={`${drawerBaseClasses} mx-auto max-w-xl divide-y divide-neutral-200/60 lg:mx-0 lg:max-w-none lg:divide-y-0 lg:shadow-2xl lg:transition-none lg:dark:divide-white/5`}
          >
            {selectedEvent ? (
              <div className="flex flex-col gap-5">
                <header className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-500/90">
                      Nearby spotlight
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                      {selectedEvent.event_name}
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-neutral-200/70 bg-white/80 px-3 py-1 text-xs font-medium text-neutral-500 transition hover:border-amber-400 hover:text-neutral-800 dark:border-white/10 dark:bg-neutral-800/80 dark:text-neutral-300 dark:hover:border-amber-400/50"
                    onClick={() => setSelectedEventId(null)}
                  >
                    Close
                  </button>
                </header>

                <dl className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
                  <div className="flex justify-between gap-3">
                    <dt className="font-medium text-neutral-500 dark:text-neutral-400">
                      Starts
                    </dt>
                    <dd className="text-right">
                      {formatDateTime(selectedEvent.event_datetime)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-medium text-neutral-500 dark:text-neutral-400">
                      Ends
                    </dt>
                    <dd className="text-right">
                      {formatDateTime(selectedEvent.event_endtime)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-medium text-neutral-500 dark:text-neutral-400">
                      Location
                    </dt>
                    <dd className="text-right">{selectedEventLocationLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-medium text-neutral-500 dark:text-neutral-400">
                      Distance
                    </dt>
                    <dd className="text-right">
                      {formatDistance(selectedEvent.distanceKm)}
                    </dd>
                  </div>
                </dl>

                {selectedEvent.picture_url ? (
                  <div className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-neutral-100/70 dark:border-white/10 dark:bg-neutral-800/70">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedEvent.picture_url}
                      alt={selectedEvent.event_name}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                ) : null}

                {selectedEvent.description ? (
                  <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {selectedEvent.description}
                  </p>
                ) : null}

                <Link
                  href={`/events/${selectedEvent.event_id}`}
                  className="inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/40 transition hover:bg-amber-600 focus:outline-none focus-visible:ring focus-visible:ring-amber-300 dark:hover:bg-amber-400 dark:focus-visible:ring-amber-500"
                >
                  View full event
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                <p className="font-medium text-neutral-700 dark:text-neutral-200">
                  Tap a pin to spotlight its details.
                </p>
                <p className="max-w-xs">
                  Use the map to explore what&apos;s happening nearby. Swipe the
                  list or the map to jump between experiences.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
