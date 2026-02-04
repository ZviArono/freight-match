"use client";

import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng, MapBounds } from "@/types/map";

interface DynamicMapProps {
  center?: LatLng;
  zoom?: number;
  className?: string;
  onBoundsChange?: (bounds: MapBounds) => void;
  children?: React.ReactNode;
}

function MapEventHandler({
  onBoundsChange,
}: {
  onBoundsChange?: (bounds: MapBounds) => void;
}) {
  const map = useMap();

  useMapEvents({
    moveend: () => {
      if (!onBoundsChange) return;
      const bounds = map.getBounds();
      onBoundsChange({
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast(),
      });
    },
    zoomend: () => {
      if (!onBoundsChange) return;
      const bounds = map.getBounds();
      onBoundsChange({
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast(),
      });
    },
  });

  return null;
}

function MapCenterUpdater({ center }: { center?: LatLng }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);

  return null;
}

const DEFAULT_CENTER: LatLng = { lat: 40.7128, lng: -74.006 };
const DEFAULT_ZOOM = 12;

export default function DynamicMap({
  center,
  zoom,
  className = "",
  onBoundsChange,
  children,
}: DynamicMapProps) {
  const mapCenter = center || DEFAULT_CENTER;

  return (
    <MapContainer
      center={[mapCenter.lat, mapCenter.lng]}
      zoom={zoom || DEFAULT_ZOOM}
      className={[
        "h-full w-full rounded-xl",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEventHandler onBoundsChange={onBoundsChange} />
      <MapCenterUpdater center={center} />
      {children}
    </MapContainer>
  );
}
