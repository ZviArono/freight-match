"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import type { Shipment } from "@/types/database";

export function useShipments(filters?: {
  status?: string;
  limit?: number;
}) {
  const { user, profile } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchShipments = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    let query = supabase.from("shipments").select("*");

    // Companies see their own shipments; truckers see posted ones
    if (profile?.role === "company") {
      query = query.eq("company_id", user.id);
    } else {
      query = query.eq("status", "posted");
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    query = query
      .order("created_at", { ascending: false })
      .limit(filters?.limit ?? 50);

    const { data } = await query;
    setShipments(data ?? []);
    setIsLoading(false);
  }, [user, profile, filters?.status, filters?.limit]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  return { shipments, isLoading, refetch: fetchShipments };
}

export function useShipment(shipmentId: string) {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("shipments")
        .select("*")
        .eq("id", shipmentId)
        .single();
      setShipment(data);
      setIsLoading(false);
    }
    load();
  }, [shipmentId]);

  return { shipment, isLoading };
}
