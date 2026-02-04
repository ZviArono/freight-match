"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { LocationPicker } from "@/components/map/LocationPicker";
import { createClient } from "@/lib/supabase/client";
import type { TruckerAvailability } from "@/types/database";
import type { LocationWithAddress } from "@/types/map";

const vehicleTypeOptions = [
  { value: "", label: "Select vehicle type" },
  { value: "box_truck", label: "Box Truck" },
  { value: "flatbed", label: "Flatbed" },
  { value: "refrigerated", label: "Refrigerated" },
  { value: "dry_van", label: "Dry Van" },
  { value: "step_deck", label: "Step Deck" },
  { value: "sprinter", label: "Sprinter Van" },
  { value: "semi_trailer", label: "Semi Trailer" },
];

export default function AvailabilityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [availability, setAvailability] =
    useState<TruckerAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [currentLocation, setCurrentLocation] =
    useState<LocationWithAddress | null>(null);
  const [destination, setDestination] =
    useState<LocationWithAddress | null>(null);
  const [vehicleType, setVehicleType] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [palletCapacity, setPalletCapacity] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    async function loadAvailability() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("trucker_availability")
          .select("*")
          .eq("trucker_id", user!.id)
          .single();

        if (data) {
          setAvailability(data as TruckerAvailability);
          setVehicleType(data.vehicle_type || "");
          setPalletCapacity(data.available_pallets || 0);
          setAvailableFrom(data.available_from || "");
          setAvailableUntil(data.available_until || "");

          if (data.current_address) {
            setCurrentLocation({
              lat: 0,
              lng: 0,
              address: data.current_address,
            });
          }
          if (data.destination_address) {
            setDestination({
              lat: 0,
              lng: 0,
              address: data.destination_address,
            });
          }
        }
      } catch (err) {
        console.error("Error loading availability:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAvailability();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc(
        "upsert_trucker_availability",
        {
          p_current_lat: currentLocation?.lat ?? null,
          p_current_lng: currentLocation?.lng ?? null,
          p_current_address: currentLocation?.address ?? null,
          p_destination_lat: destination?.lat ?? null,
          p_destination_lng: destination?.lng ?? null,
          p_destination_address: destination?.address ?? null,
          p_vehicle_type: vehicleType || null,
          p_available_from: availableFrom || null,
          p_available_until: availableUntil || null,
          p_available_pallets: palletCapacity,
        }
      );

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      setSuccessMessage("Availability updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save availability."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="Availability" />
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Availability" />
      <main className="mx-auto max-w-lg px-4 py-4 space-y-4 pb-24">
        {error && (
          <div
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}
        {successMessage && (
          <div
            className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
            role="status"
          >
            {successMessage}
          </div>
        )}

        {/* Current Status */}
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Current Status
            </h3>
            <span
              className={[
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                availability?.is_available
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600",
              ].join(" ")}
            >
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  availability?.is_available
                    ? "bg-green-600"
                    : "bg-gray-400",
                ].join(" ")}
              />
              {availability?.is_available ? "Available" : "Unavailable"}
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Toggle availability from the dashboard. Your location is tracked
            automatically while available.
          </p>
        </Card>

        {/* Current Location */}
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Current Location
          </h3>
          <LocationPicker
            value={currentLocation}
            onChange={setCurrentLocation}
            placeholder="Click the map to set your current location"
          />
        </Card>

        {/* Destination */}
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Preferred Destination (optional)
          </h3>
          <LocationPicker
            value={destination}
            onChange={setDestination}
            placeholder="Click the map to set your preferred destination"
          />
        </Card>

        {/* Vehicle Type */}
        <Card>
          <Select
            label="Vehicle Type"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            options={vehicleTypeOptions}
          />
        </Card>

        {/* Availability Dates */}
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Availability Period
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Available From"
              type="date"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
            />
            <Input
              label="Available Until"
              type="date"
              value={availableUntil}
              onChange={(e) => setAvailableUntil(e.target.value)}
            />
          </div>
        </Card>

        {/* Pallet Capacity */}
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Pallet Capacity
          </h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                setPalletCapacity(Math.max(0, palletCapacity - 1))
              }
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-300 text-xl font-bold transition hover:bg-gray-50 active:bg-gray-100 min-h-[44px]"
              aria-label="Decrease pallet capacity"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <p className="text-3xl font-bold text-blue-600">
                {palletCapacity}
              </p>
              <p className="text-xs text-gray-500">pallets</p>
            </div>
            <button
              onClick={() => setPalletCapacity(palletCapacity + 1)}
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-300 text-xl font-bold transition hover:bg-gray-50 active:bg-gray-100 min-h-[44px]"
              aria-label="Increase pallet capacity"
            >
              +
            </button>
          </div>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          isLoading={isSaving}
          fullWidth
          size="lg"
        >
          Save Availability
        </Button>
      </main>
    </>
  );
}
