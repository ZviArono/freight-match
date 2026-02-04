"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { MapContainer } from "@/components/map/MapContainer";
import { createClient } from "@/lib/supabase/client";
import type {
  Shipment,
  ShipmentStatus,
  Negotiation,
} from "@/types/database";

const statusVariant: Record<
  ShipmentStatus,
  "default" | "success" | "warning" | "danger" | "info"
> = {
  draft: "default",
  posted: "info",
  negotiating: "warning",
  booked: "success",
  in_transit: "info",
  delivered: "success",
  cancelled: "danger",
};

const statusLabel: Record<ShipmentStatus, string> = {
  draft: "Draft",
  posted: "Posted",
  negotiating: "Negotiating",
  booked: "Booked",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function ShipmentDetailMap({ shipment }: { shipment: Shipment }) {
  // Parse pickup/dropoff coordinates from WKB or use placeholder
  // The coordinates would typically be decoded server-side into lat/lng
  // For display purposes, we center on the pickup address area
  return (
    <div className="h-48 overflow-hidden rounded-xl">
      <MapContainer zoom={11} />
    </div>
  );
}

export default function ShipmentDetailPage() {
  const params = useParams();
  const shipmentId = params.id as string;

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShipment() {
      try {
        const supabase = createClient();

        const { data, error: fetchError } = await supabase
          .from("shipments")
          .select("*")
          .eq("id", shipmentId)
          .single();

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        setShipment(data as Shipment);

        // Fetch negotiations if status warrants it
        if (
          data.status === "posted" ||
          data.status === "negotiating"
        ) {
          const { data: negData } = await supabase
            .from("negotiations")
            .select("*")
            .eq("shipment_id", shipmentId)
            .order("created_at", { ascending: false });

          if (negData) {
            setNegotiations(negData as Negotiation[]);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load shipment."
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchShipment();
  }, [shipmentId]);

  if (isLoading) {
    return (
      <>
        <Header title="Shipment" />
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  if (error || !shipment) {
    return (
      <>
        <Header title="Shipment" />
        <div className="p-4">
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error || "Shipment not found."}
          </div>
        </div>
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
      <Header title="Shipment Details" />
      <main className="mx-auto max-w-lg px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* Title and Status */}
          <Card>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {shipment.title}
              </h2>
              <Badge variant={statusVariant[shipment.status]}>
                {statusLabel[shipment.status]}
              </Badge>
            </div>
            {shipment.description && (
              <p className="mt-2 text-sm text-gray-600">
                {shipment.description}
              </p>
            )}
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

          {/* Route */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Route
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
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
              <div className="ml-3 border-l-2 border-dashed border-gray-200 py-1" />
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                  <div className="h-2 w-2 rounded-full bg-red-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Dropoff
                  </p>
                  <p className="text-sm text-gray-900">
                    {shipment.dropoff_address}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Map */}
          <Card className="p-0 overflow-hidden">
            <ShipmentDetailMap shipment={shipment} />
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
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                Budget
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

          {/* Negotiations */}
          {(shipment.status === "posted" ||
            shipment.status === "negotiating") && (
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                Negotiations
              </h3>
              {negotiations.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No negotiations yet. Find carriers on the map.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {negotiations.map((neg) => (
                    <Link
                      key={neg.id}
                      href={`/chat/${neg.id}`}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Negotiation
                        </p>
                        <p className="text-xs text-gray-500">
                          {neg.current_price
                            ? `$${neg.current_price}`
                            : "No price yet"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          neg.status === "accepted"
                            ? "success"
                            : neg.status === "rejected"
                            ? "danger"
                            : "info"
                        }
                      >
                        {neg.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Find Carriers Button */}
          {(shipment.status === "posted" ||
            shipment.status === "negotiating") && (
            <Link href="/map">
              <Button fullWidth size="lg">
                Find Carriers
              </Button>
            </Link>
          )}
        </div>
      </main>
    </>
  );
}
