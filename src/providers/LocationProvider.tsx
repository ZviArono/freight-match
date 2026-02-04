"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { createClient } from "@/lib/supabase/client";

interface LocationContextValue {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  error: string | null;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}

interface LocationProviderProps {
  isAvailable: boolean;
  children: React.ReactNode;
}

export function LocationProvider({
  isAvailable,
  children,
}: LocationProviderProps) {
  const geo = useGeolocation();
  const supabaseRef = useRef(createClient());
  const channelRef = useRef<ReturnType<
    typeof supabaseRef.current.channel
  > | null>(null);
  const broadcastIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const persistIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const broadcastLocation = useCallback(() => {
    if (
      !channelRef.current ||
      geo.latitude === null ||
      geo.longitude === null ||
      !isAvailable
    ) {
      return;
    }

    channelRef.current.send({
      type: "broadcast",
      event: "location_update",
      payload: {
        trucker_id: "", // Will be filled by server
        lat: geo.latitude,
        lng: geo.longitude,
        heading: geo.heading,
        speed: geo.speed
          ? Math.round(geo.speed * 3.6)
          : null, // m/s to km/h
      },
    });
  }, [geo.latitude, geo.longitude, geo.heading, geo.speed, isAvailable]);

  const persistLocation = useCallback(async () => {
    if (
      geo.latitude === null ||
      geo.longitude === null ||
      !isAvailable
    ) {
      return;
    }

    try {
      await supabaseRef.current.rpc("update_trucker_location", {
        p_lat: geo.latitude,
        p_lng: geo.longitude,
        p_heading: geo.heading,
        p_speed_kmh: geo.speed
          ? Math.round(geo.speed * 3.6)
          : null,
        p_accuracy: geo.accuracy,
      });
    } catch (err) {
      console.error("Error persisting location:", err);
    }
  }, [
    geo.latitude,
    geo.longitude,
    geo.heading,
    geo.speed,
    geo.accuracy,
    isAvailable,
  ]);

  // Set up broadcast channel and intervals
  useEffect(() => {
    if (!geo.isTracking || !isAvailable) return;

    const supabase = supabaseRef.current;
    const channel = supabase.channel("map:locations");
    channel.subscribe();
    channelRef.current = channel;

    // Broadcast every 5 seconds
    broadcastIntervalRef.current = setInterval(broadcastLocation, 5000);

    // Persist to DB every 60 seconds
    persistIntervalRef.current = setInterval(persistLocation, 60000);

    // Persist immediately on start
    persistLocation();

    return () => {
      if (broadcastIntervalRef.current) {
        clearInterval(broadcastIntervalRef.current);
        broadcastIntervalRef.current = null;
      }
      if (persistIntervalRef.current) {
        clearInterval(persistIntervalRef.current);
        persistIntervalRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [
    geo.isTracking,
    isAvailable,
    broadcastLocation,
    persistLocation,
  ]);

  return (
    <LocationContext.Provider value={geo}>
      {children}
    </LocationContext.Provider>
  );
}
