"use client";

import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { TruckPopup } from "./TruckPopup";
import type { TruckerMapData } from "@/types/database";

interface TruckMarkerProps {
  trucker: TruckerMapData;
  onChatClick: (truckerId: string) => void;
  onCallClick: (phone: string) => void;
}

const truckIcon = L.divIcon({
  className: "",
  html: `<div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="white">
      <path d="M0 0h24v24H0V0z" fill="none"/>
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

export function TruckMarker({
  trucker,
  onChatClick,
  onCallClick,
}: TruckMarkerProps) {
  return (
    <Marker
      position={[trucker.latitude, trucker.longitude]}
      icon={truckIcon}
    >
      <Popup>
        <TruckPopup
          trucker={trucker}
          onChatClick={onChatClick}
          onCallClick={onCallClick}
        />
      </Popup>
    </Marker>
  );
}
