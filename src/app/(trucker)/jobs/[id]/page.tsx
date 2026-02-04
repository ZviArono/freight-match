"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { MapContainer } from "@/components/map/MapContainer";
import type { Shipment, Profile } from "@/types/database";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [company, setCompany] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: s, error: fetchError } = await supabase
          .from("shipments")
          .select("*")
          .eq("id", params.id as string)
          .single();

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        setShipment(s as Shipment);

        if (s) {
          const { data: c } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", s.company_id)
            .single();
          setCompany(c as Profile | null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load job."
        );
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [params.id]);

  async function startNegotiation() {
    if (!user || !shipment) return;
    setIsStarting(true);

    try {
      const supabase = createClient();

      // Check if negotiation already exists
      const { data: existing } = await supabase
        .from("negotiations")
        .select("id")
        .eq("shipment_id", shipment.id)
        .eq("trucker_id", user.id)
        .single();

      if (existing) {
        router.push(`/chat/${existing.id}`);
        return;
      }

      // Create new negotiation
      const { data: neg, error: negError } = await supabase
        .from("negotiations")
        .insert({
          shipment_id: shipment.id,
          company_id: shipment.company_id,
          trucker_id: user.id,
          status: "initiated",
        })
        .select()
        .single();

      if (negError) {
        setError(negError.message);
        setIsStarting(false);
        return;
      }

      router.push(`/chat/${neg.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start negotiation."
      );
      setIsStarting(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <Header title="Job Details" />
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  if (error || !shipment) {
    return (
      <>
        <Header title="Job Details" />
        <main className="mx-auto max-w-lg px-4 py-6">
          <Card>
            <p className="text-center text-sm text-red-600">
              {error || "Job not found"}
            </p>
          </Card>
        </main>
      </>
    );
  }

  const pickupDateFormatted = new Date(
    shipment.pickup_date
  ).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="flex h-14 items-center px-4">
          <button
            onClick={() => router.back()}
            className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            Job Details
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-4">
        {/* Title and Status */}
        <Card>
          <div className="flex items-start justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              {shipment.title}
            </h2>
            <Badge variant="info">{shipment.status}</Badge>
          </div>
          {shipment.description && (
            <p className="mt-2 text-sm text-gray-600">
              {shipment.description}
            </p>
          )}
        </Card>

        {/* Route */}
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Route
          </h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                <div className="h-2 w-2 rounded-full bg-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Pickup
                </p>
                <p className="text-sm text-gray-900">
                  {shipment.pickup_address}
                </p>
              </div>
            </div>
            <div className="ml-2.5 h-4 border-l-2 border-dashed border-gray-300" />
            <div className="flex items-start gap-2">
              <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <div className="h-2 w-2 rounded-full bg-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Drop-off
                </p>
                <p className="text-sm text-gray-900">
                  {shipment.dropoff_address}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Map */}
        <Card className="overflow-hidden p-0">
          <div className="h-48">
            <MapContainer zoom={11} />
          </div>
        </Card>

        {/* Cargo Details */}
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Cargo Details
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {shipment.pallet_count}
              </p>
              <p className="text-xs text-gray-500">Pallets</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {shipment.box_count}
              </p>
              <p className="text-xs text-gray-500">Boxes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {shipment.weight_kg ?? "--"}
              </p>
              <p className="text-xs text-gray-500">kg</p>
            </div>
          </div>
        </Card>

        {/* Schedule */}
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Schedule
          </h3>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Pickup Date</span>
              <span className="font-medium text-gray-900">
                {pickupDateFormatted}
              </span>
            </div>
            {shipment.pickup_time_start && (
              <div className="flex justify-between">
                <span className="text-gray-500">Pickup Window</span>
                <span className="font-medium text-gray-900">
                  {shipment.pickup_time_start}
                  {shipment.pickup_time_end &&
                    ` - ${shipment.pickup_time_end}`}
                </span>
              </div>
            )}
            {shipment.delivery_deadline && (
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery Deadline</span>
                <span className="font-medium text-gray-900">
                  {new Date(
                    shipment.delivery_deadline
                  ).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Budget */}
        {(shipment.budget_min !== null ||
          shipment.budget_max !== null) && (
          <Card>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              Budget Range
            </h3>
            <p className="text-lg font-bold text-green-700">
              {shipment.budget_min !== null && `$${shipment.budget_min}`}
              {shipment.budget_min !== null &&
                shipment.budget_max !== null &&
                " - "}
              {shipment.budget_max !== null && `$${shipment.budget_max}`}
            </p>
          </Card>
        )}

        {/* Company Info */}
        {company && (
          <Card>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              Shipper
            </h3>
            <p className="text-sm text-gray-900">
              {company.display_name}
            </p>
            {company.company_name && (
              <p className="text-xs text-gray-500">
                {company.company_name}
              </p>
            )}
          </Card>
        )}

        {/* Make Offer Button */}
        {shipment.status === "posted" && (
          <Button
            onClick={startNegotiation}
            isLoading={isStarting}
            fullWidth
            size="lg"
          >
            Make an Offer
          </Button>
        )}
      </main>
    </>
  );
}
