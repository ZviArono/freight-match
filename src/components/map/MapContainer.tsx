"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { LatLng, MapBounds } from "@/types/map";

interface MapContainerProps {
  center?: LatLng;
  zoom?: number;
  className?: string;
  onBoundsChange?: (bounds: MapBounds) => void;
  children?: React.ReactNode;
}

const DynamicMap = dynamic(() => import("./DynamicMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl bg-gray-100">
      <div className="h-full w-full animate-pulse rounded-xl bg-gray-200" />
    </div>
  ),
});

export function MapContainer({
  center,
  zoom,
  className,
  onBoundsChange,
  children,
}: MapContainerProps) {
  return (
    <DynamicMap
      center={center}
      zoom={zoom}
      className={className}
      onBoundsChange={onBoundsChange}
    >
      {children}
    </DynamicMap>
  );
}
