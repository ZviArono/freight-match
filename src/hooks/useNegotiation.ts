"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import type { Negotiation, NegotiationEvent } from "@/types/database";
import {
  getAvailableActions,
  type NegotiationAction,
} from "@/types/negotiation";

interface UseNegotiationReturn {
  negotiation: Negotiation | null;
  events: NegotiationEvent[];
  availableActions: NegotiationAction[];
  isProposer: boolean;
  propose: (price: number) => Promise<void>;
  accept: () => Promise<void>;
  reject: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useNegotiation(negotiationId: string): UseNegotiationReturn {
  const { user } = useAuth();
  const supabase = createClient();

  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [events, setEvents] = useState<NegotiationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial negotiation data and events
  useEffect(() => {
    if (!negotiationId) return;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const [negotiationResult, eventsResult] = await Promise.all([
          supabase
            .from("negotiations")
            .select("*")
            .eq("id", negotiationId)
            .single(),
          supabase
            .from("negotiation_events")
            .select("*")
            .eq("negotiation_id", negotiationId)
            .order("created_at", { ascending: true }),
        ]);

        if (negotiationResult.error) {
          throw new Error(negotiationResult.error.message);
        }

        if (eventsResult.error) {
          throw new Error(eventsResult.error.message);
        }

        setNegotiation(negotiationResult.data);
        setEvents(eventsResult.data || []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load negotiation";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [negotiationId]);

  // Subscribe to realtime updates on the negotiation row
  useEffect(() => {
    if (!negotiationId) return;

    const channel = supabase
      .channel(`negotiation-${negotiationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "negotiations",
          filter: `id=eq.${negotiationId}`,
        },
        (payload) => {
          setNegotiation(payload.new as Negotiation);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "negotiation_events",
          filter: `negotiation_id=eq.${negotiationId}`,
        },
        (payload) => {
          setEvents((prev) => [...prev, payload.new as NegotiationEvent]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [negotiationId]);

  const isProposer = useMemo(() => {
    if (!negotiation || !user) return false;
    return negotiation.proposed_by === user.id;
  }, [negotiation, user]);

  const availableActions = useMemo(() => {
    if (!negotiation || !user) return [];
    return getAvailableActions(negotiation.status, isProposer);
  }, [negotiation, user, isProposer]);

  const propose = useCallback(
    async (price: number) => {
      if (!user || !negotiationId) return;
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc("propose_price", {
          p_negotiation_id: negotiationId,
          p_price: price,
          p_actor_id: user.id,
        });

        if (rpcError) {
          throw new Error(rpcError.message);
        }

        const result = data as { success: boolean; error?: string };
        if (!result.success) {
          throw new Error(result.error || "Failed to propose price");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to propose price";
        setError(message);
        throw err;
      }
    },
    [negotiationId, user, supabase]
  );

  const accept = useCallback(async () => {
    if (!user || !negotiationId || !negotiation) return;
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc("accept_offer", {
        p_negotiation_id: negotiationId,
        p_actor_id: user.id,
        p_expected_price: negotiation.current_price,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || "Failed to accept offer");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to accept offer";
      setError(message);
      throw err;
    }
  }, [negotiationId, negotiation, user, supabase]);

  const reject = useCallback(async () => {
    if (!user || !negotiationId) return;
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc("reject_offer", {
        p_negotiation_id: negotiationId,
        p_actor_id: user.id,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || "Failed to reject offer");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reject offer";
      setError(message);
      throw err;
    }
  }, [negotiationId, user, supabase]);

  return {
    negotiation,
    events,
    availableActions,
    isProposer,
    propose,
    accept,
    reject,
    isLoading,
    error,
  };
}
