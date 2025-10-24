/*

 AI-generated code:  100% (tool: Codex - GPT-5, modified and adapted, functions: Coordinates, EventLocationPickerMapProps, DEFAULT_CENTER, DEFAULT_ZOOM, EventLocationPickerMap, mapboxStyles) 

 Human code: 0% 

 No framework-generated code.

*/
"use client";

import * as React from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

import mapboxStyles from "@/component/map/GeoCoder.module.css";

type Coordinates = {
  longitude: number;
  latitude: number;
};

type EventLocationPickerMapProps = {
  mapboxToken: string | undefined;
  coordinates: Coordinates | null;
  onLocationSelect: (payload: {
    placeName: string | null;
    coordinates: Coordinates | null;
  }) => void;
};

const DEFAULT_CENTER: [number, number] = [-98.5795, 39.8283];
const DEFAULT_ZOOM = 3.25;

export function EventLocationPickerMap({
  mapboxToken,
  coordinates,
  onLocationSelect,
}: EventLocationPickerMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const markerRef = React.useRef<mapboxgl.Marker | null>(null);
  const geocoderRef = React.useRef<MapboxGeocoder | null>(null);

  const setMarker = React.useCallback((next: Coordinates | null) => {
    markerRef.current?.remove();
    markerRef.current = null;
    if (!mapRef.current || !next) {
      return;
    }
    markerRef.current = new mapboxgl.Marker({ color: "#5c1354" })
      .setLngLat([next.longitude, next.latitude])
      .addTo(mapRef.current);
  }, []);

  React.useEffect(() => {
    if (!mapboxToken || !containerRef.current || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    const startCenter: [number, number] = coordinates
      ? [coordinates.longitude, coordinates.latitude]
      : DEFAULT_CENTER;
    const startZoom = coordinates ? 12 : DEFAULT_ZOOM;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: startCenter,
      zoom: startZoom,
    });
    mapRef.current = map;

    setMarker(coordinates);

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxToken,
      mapboxgl: mapboxgl as unknown as typeof import("mapbox-gl"),
      marker: false,
      placeholder: "Search for a venue or address",
    });
    geocoderRef.current = geocoder;

    const handleResult = (event: { result?: MapboxGeocoder.Result }) => {
      const placeName = event.result?.place_name ?? event.result?.text ?? null;
      const resultCenter = event.result?.center;
      const geometryCenter =
        event.result?.geometry?.type === "Point"
          ? event.result.geometry.coordinates
          : null;
      const center = resultCenter ?? geometryCenter;

      if (!center || center.length < 2) {
        setMarker(null);
        onLocationSelect({ placeName, coordinates: null });
        return;
      }

      const nextCoordinates = {
        longitude: center[0],
        latitude: center[1],
      };

      setMarker(nextCoordinates);
      onLocationSelect({ placeName, coordinates: nextCoordinates });

      map.flyTo({
        center: [center[0], center[1]],
        zoom: 14,
        duration: 800,
        essential: true,
      });
    };

    geocoder.on("result", handleResult);
    map.addControl(geocoder, "top-left");
    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    return () => {
      geocoder.off("result", handleResult);
      markerRef.current?.remove();
      map.remove();
      geocoderRef.current = null;
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [coordinates, mapboxToken, onLocationSelect, setMarker]);

  React.useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (!coordinates) {
      setMarker(null);
      return;
    }

    setMarker(coordinates);
    mapRef.current.flyTo({
      center: [coordinates.longitude, coordinates.latitude],
      zoom: 13,
      duration: 800,
      essential: true,
    });
  }, [coordinates, setMarker]);

  if (!mapboxToken) {
    return (
      <div className="rounded-3xl border border-amber-200/60 bg-white/70 p-6 text-sm text-amber-700 shadow-inner dark:border-amber-500/20 dark:bg-neutral-900/60 dark:text-amber-200">
        Add your Mapbox token in the environment configuration to enable the
        location picker.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-neutral-200/60 bg-white/90 shadow-lg shadow-amber-500/10 dark:border-white/10 dark:bg-neutral-900/70">
      <div className=" border-neutral-200/60 bg-gradient-to-r from-amber-200/60 via-white to-purple-200/60 px-6 py-4 dark:border-white/10 dark:from-amber-500/10 dark:via-transparent dark:to-purple-500/10">
        <div className="text-sm font-semibold uppercase tracking-[0.28em] text-neutral-600 dark:text-neutral-300">
          Pin the venue
        </div>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Search for the venue or drop a pin to save it with your event.
        </p>
      </div>

      <div ref={containerRef} className={mapboxStyles.mapCard} />
    </div>
  );
}
