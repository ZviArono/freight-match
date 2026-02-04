"use client";

import React from "react";
import type { TruckerMapData } from "@/types/database";

interface TruckPopupProps {
  trucker: TruckerMapData;
  onChatClick: (truckerId: string) => void;
  onCallClick: (phone: string) => void;
}

export function TruckPopup({
  trucker,
  onChatClick,
  onCallClick,
}: TruckPopupProps) {
  return (
    <div className="flex min-w-[200px] flex-col gap-2 p-1">
      <div className="flex items-center gap-2">
        {trucker.avatar_url ? (
          <img
            src={trucker.avatar_url}
            alt={trucker.display_name}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
            {trucker.display_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {trucker.display_name}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-xs text-gray-600">
        <p>
          <span className="font-medium">{trucker.available_pallets}</span>{" "}
          pallets available
        </p>
        <p>
          <span className="font-medium">
            {trucker.distance_km.toFixed(1)}
          </span>{" "}
          km away
        </p>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onChatClick(trucker.trucker_id)}
          className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 min-h-[44px]"
        >
          Chat
        </button>
        {trucker.phone ? (
          <a
            href={`tel:${trucker.phone}`}
            onClick={() => onCallClick(trucker.phone!)}
            className="flex flex-1 items-center justify-center rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 min-h-[44px]"
          >
            Call
          </a>
        ) : (
          <button
            disabled
            className="flex-1 rounded-lg bg-gray-300 px-3 py-2 text-sm font-medium text-gray-500 min-h-[44px] cursor-not-allowed"
          >
            No phone
          </button>
        )}
      </div>
    </div>
  );
}
