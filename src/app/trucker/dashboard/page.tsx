"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import type { TruckerAvailability } from "@/types/database";

export default function TruckerDashboard() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<TruckerAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await supabase
        .from("trucker_availability")
        .select("*")
        .eq("trucker_id", user!.id)
        .single();
      setAvailability(data);
      setIsLoading(false);
    }
    load();
  }, [user]);

  async function toggleAvailability() {
    if (!user) return;
    setIsToggling(true);
    const newStatus = !availability?.is_available;

    const payload = {
      trucker_id: user.id,
      is_available: newStatus,
      available_pallets: availability?.available_pallets ?? 0,
    };

    const { data, error } = await supabase
      .from("trucker_availability")
      .upsert(payload, { onConflict: "trucker_id" })
      .select()
      .single();

    if (!error && data) {
      setAvailability(data);
    }
    setIsToggling(false);
  }

  async function updateCapacity(pallets: number) {
    if (!user) return;
    const { data } = await supabase
      .from("trucker_availability")
      .upsert(
        {
          trucker_id: user.id,
          is_available: availability?.is_available ?? false,
          available_pallets: pallets,
        },
        { onConflict: "trucker_id" }
      )
      .select()
      .single();
    if (data) setAvailability(data);
  }

  if (isLoading) {
    return (
      <>
        <Header title="Dashboard" />
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Dashboard" />
      <main className="mx-auto max-w-lg px-4 py-6">
        {/* Availability Toggle */}
        <Card className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Availability Status
              </p>
              <p className="text-xs text-gray-500">
                {availability?.is_available
                  ? "You are visible to shippers"
                  : "You are hidden from shippers"}
              </p>
            </div>
            <button
              onClick={toggleAvailability}
              disabled={isToggling}
              className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors ${
                availability?.is_available
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
                  availability?.is_available
                    ? "translate-x-7"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Capacity */}
        <Card className="mb-4">
          <p className="mb-2 text-sm font-semibold text-gray-900">
            Available Capacity
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                updateCapacity(
                  Math.max(0, (availability?.available_pallets ?? 0) - 1)
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-lg font-bold text-gray-700 transition hover:bg-gray-50"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-primary-600">
                {availability?.available_pallets ?? 0}
              </p>
              <p className="text-xs text-gray-500">pallets</p>
            </div>
            <button
              onClick={() =>
                updateCapacity((availability?.available_pallets ?? 0) + 1)
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-lg font-bold text-gray-700 transition hover:bg-gray-50"
            >
              +
            </button>
          </div>
        </Card>

        {/* Quick Stats */}
        <Card>
          <p className="mb-3 text-sm font-semibold text-gray-900">Status</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Current Location</span>
              <span className="text-gray-900">
                {availability?.current_address ?? "Not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Destination</span>
              <span className="text-gray-900">
                {availability?.destination_address ?? "Not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Vehicle</span>
              <span className="text-gray-900">
                {availability?.vehicle_type ?? "Not specified"}
              </span>
            </div>
          </div>
        </Card>
      </main>
    </>
  );
}
