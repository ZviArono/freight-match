"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { MapContainer } from "@/components/map/MapContainer";
import { TruckMarker } from "@/components/map/TruckMarker";
import { useTruckerLocations } from "@/hooks/useTruckerLocations";
import type { MapBounds } from "@/types/map";

export default function CompanyMapPage() {
  const router = useRouter();
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const { truckers, isLoading } = useTruckerLocations(bounds);

  const handleBoundsChange = useCallback((newBounds: MapBounds) => {
    setBounds(newBounds);
  }, []);

  const handleChatClick = useCallback(
    (truckerId: string) => {
      router.push(`/chat/new?trucker_id=${truckerId}`);
    },
    [router]
  );

  const handleCallClick = useCallback((phone: string) => {
    // tel: link handled natively by the anchor in TruckPopup
  }, []);

  return (
    <>
      <Header title="Find Carriers" />
      <main className="relative" style={{ height: "calc(100vh - 56px - 64px)" }}>
        {isLoading && (
          <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2">
            <div className="rounded-full bg-white px-4 py-2 text-xs font-medium text-gray-600 shadow-md">
              Loading carriers...
            </div>
          </div>
        )}

        <MapContainer
          onBoundsChange={handleBoundsChange}
          className="h-full w-full"
        >
          {truckers.map((trucker) => (
            <TruckMarker
              key={trucker.trucker_id}
              trucker={trucker}
              onChatClick={handleChatClick}
              onCallClick={handleCallClick}
            />
          ))}
        </MapContainer>

        {truckers.length > 0 && (
          <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
            <div className="rounded-full bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-md">
              {truckers.length} carrier{truckers.length !== 1 ? "s" : ""}{" "}
              nearby
            </div>
          </div>
        )}
      </main>
    </>
  );
}
