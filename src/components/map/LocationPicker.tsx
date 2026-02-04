"use client";

import React, { useCallback, useState } from "react";
import { Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapContainer } from "./MapContainer";
import type { LocationWithAddress } from "@/types/map";

interface LocationPickerProps {
  value: LocationWithAddress | null;
  onChange: (location: LocationWithAddress) => void;
  placeholder?: string;
}

const markerIcon = L.divIcon({
  className: "",
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
    <path fill="#2563eb" d="M12 0C7.31 0 3.5 3.81 3.5 8.5C3.5 14.88 12 24 12 24s8.5-9.12 8.5-15.5C20.5 3.81 16.69 0 12 0z"/>
    <circle fill="white" cx="12" cy="8.5" r="3.5"/>
  </svg>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

function ClickHandler({
  value,
  onChange,
}: {
  value: LocationWithAddress | null;
  onChange: (location: LocationWithAddress) => void;
}) {
  const [isGeocoding, setIsGeocoding] = useState(false);

  useMapEvents({
    click: async (e) => {
      if (isGeocoding) return;
      setIsGeocoding(true);
      const { lat, lng } = e.latlng;
      const address = await reverseGeocode(lat, lng);
      onChange({ lat, lng, address });
      setIsGeocoding(false);
    },
  });

  return value ? (
    <Marker
      position={[value.lat, value.lng]}
      icon={markerIcon}
      draggable
      eventHandlers={{
        dragend: async (e) => {
          const marker = e.target as L.Marker;
          const pos = marker.getLatLng();
          const address = await reverseGeocode(pos.lat, pos.lng);
          onChange({ lat: pos.lat, lng: pos.lng, address });
        },
      }}
    />
  ) : null;
}

export function LocationPicker({
  value,
  onChange,
  placeholder = "Click on the map to select a location",
}: LocationPickerProps) {
  const center = value
    ? { lat: value.lat, lng: value.lng }
    : undefined;

  return (
    <div className="flex flex-col gap-2">
      <div className="h-48 overflow-hidden rounded-xl border border-gray-300">
        <MapContainer center={center} zoom={value ? 14 : 10}>
          <ClickHandler value={value} onChange={onChange} />
        </MapContainer>
      </div>
      <p className="text-sm text-gray-500">
        {value ? value.address : placeholder}
      </p>
    </div>
  );
}
