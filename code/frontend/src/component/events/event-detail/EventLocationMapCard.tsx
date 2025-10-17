"use client";

import { getPublicMapboxToken } from "@/component/map/getPublicMapboxToken";
import * as React from "react";
import Map from "react-map-gl/mapbox";

type Coordinates = {
  longitude: number;
  latitude: number;
};

type EventLocationMapCardProps = {
  location: string | null | undefined;
};

type GeocodeFeature = {
  center?: [number, number];
  place_name?: string;
  text?: string;
};

type GeocodeResponse = {
  features?: GeocodeFeature[];
};

export function EventLocationMapCard({ location }: EventLocationMapCardProps) {
  const mapboxToken = getPublicMapboxToken();

  const [coordinates, setCoordinates] = React.useState<Coordinates | null>(
    null,
  );
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!location || !mapboxToken) {
      setCoordinates(null);
      setStatus(location ? "error" : "idle");
      setErrorMessage(
        mapboxToken
          ? "Location is not available for this event yet."
          : "Mapbox token missing. Add it to view event maps.",
      );
      return;
    }

    const controller = new AbortController();
    const fetchCoordinates = async () => {
      try {
        setStatus("loading");
        setErrorMessage(null);

        const url = new URL(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json`,
        );
        url.searchParams.set("limit", "1");
        url.searchParams.set("access_token", mapboxToken);

        const response = await fetch(url.toString(), {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Geocoding failed with status ${response.status}`);
        }

        const data = (await response.json()) as GeocodeResponse;
        const feature = data.features?.[0];
        const center = feature?.center;

        if (!center || center.length < 2) {
          throw new Error("No coordinates found for this location.");
        }

        setCoordinates({
          longitude: center[0],
          latitude: center[1],
        });
        setStatus("success");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "We could not load the map for this location.";
        setErrorMessage(message);
        setStatus("error");
      }
    };

    void fetchCoordinates();

    return () => controller.abort();
  }, [location, mapboxToken]);

  return (
    <section className="space-y-4 rounded-3xl border border-neutral-200/70 bg-white/85 p-6 shadow-lg shadow-amber-100/30 dark:border-white/10 dark:bg-neutral-900/60 dark:shadow-neutral-900/40">
      <header>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Event location
        </h3>
        <p className="text-xs uppercase tracking-[0.26em] text-neutral-500 dark:text-neutral-400">
          {location ?? "To be announced"}
        </p>
      </header>

      {status === "loading" ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-amber-200/60 bg-amber-50/40 text-sm text-neutral-500 dark:border-amber-400/20 dark:bg-neutral-900/40 dark:text-neutral-400">
          Searching for this venue…
        </div>
      ) : null}

      {status === "error" && errorMessage ? (
        <div className="rounded-3xl border border-amber-200/60 bg-amber-50/50 px-4 py-6 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {errorMessage}
        </div>
      ) : null}

      {status === "success" && coordinates && mapboxToken ? (
        <Map
          mapboxAccessToken={mapboxToken}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          initialViewState={{
            longitude: coordinates.longitude,
            latitude: coordinates.latitude,
            zoom: 13,
            pitch: 0,
            bearing: 0,
            fitBoundsOptions: {
              padding: 100,
              maxZoom: 15,
              minZoom: 13,
            },
          }}
          reuseMaps
        ></Map>
      ) : null}
    </section>
  );
}
