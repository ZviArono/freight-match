"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TruckerMapData } from "@/types/database";
import type { MapBounds, TruckerBroadcast } from "@/types/map";

interface UseTruckerLocationsResult {
  truckers: TruckerMapData[];
  isLoading: boolean;
}

export function useTruckerLocations(
  bounds: MapBounds | null
): UseTruckerLocationsResult {
  const [truckers, setTruckers] = useState<TruckerMapData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseRef = useRef(createClient());

  const fetchTruckers = useCallback(async (b: MapBounds) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabaseRef.current.rpc(
        "get_truckers_in_bounds",
        {
          p_south: b.south,
          p_west: b.west,
          p_north: b.north,
          p_east: b.east,
        }
      );

      if (error) {
        console.error("Error fetching truckers:", error);
        return;
      }

      if (data) {
        setTruckers(data as TruckerMapData[]);
      }
    } catch (err) {
      console.error("Error fetching truckers:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced fetch when bounds change
  useEffect(() => {
    if (!bounds) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchTruckers(bounds);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [bounds, fetchTruckers]);

  // Subscribe to realtime broadcast
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase.channel("map:locations");

    channel
      .on("broadcast", { event: "location_update" }, (payload) => {
        const broadcast = payload.payload as TruckerBroadcast;

        setTruckers((prev) => {
          const existing = prev.findIndex(
            (t) => t.trucker_id === broadcast.trucker_id
          );

          if (existing !== -1) {
            const updated = [...prev];
            updated[existing] = {
              ...updated[existing],
              latitude: broadcast.lat,
              longitude: broadcast.lng,
              heading: broadcast.heading,
              speed_kmh: broadcast.speed,
              last_updated: new Date().toISOString(),
            };
            return updated;
          }

          return prev;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { truckers, isLoading };
}
