"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { LocationWithAddress } from "@/types/map";

const LocationPicker = dynamic(
  () =>
    import("@/components/map/LocationPicker").then((mod) => mod.LocationPicker),
  { ssr: false }
);

interface ShipmentFormProps {
  onSuccess: () => void;
}

export function ShipmentForm({ onSuccess }: ShipmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [palletCount, setPalletCount] = useState<number>(1);
  const [boxCount, setBoxCount] = useState<number>(0);
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [pickupLocation, setPickupLocation] =
    useState<LocationWithAddress | null>(null);
  const [dropoffLocation, setDropoffLocation] =
    useState<LocationWithAddress | null>(null);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTimeStart, setPickupTimeStart] = useState("");
  const [pickupTimeEnd, setPickupTimeEnd] = useState("");
  const [deliveryDeadline, setDeliveryDeadline] = useState("");
  const [budgetMin, setBudgetMin] = useState<number | "">("");
  const [budgetMax, setBudgetMax] = useState<number | "">("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!pickupLocation) {
      setError("Please select a pickup location on the map.");
      return;
    }
    if (!dropoffLocation) {
      setError("Please select a dropoff location on the map.");
      return;
    }
    if (!pickupDate) {
      setError("Pickup date is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("create_shipment", {
        p_title: title.trim(),
        p_description: description.trim() || null,
        p_pallet_count: palletCount,
        p_box_count: boxCount,
        p_weight_kg: weightKg === "" ? null : weightKg,
        p_pickup_lat: pickupLocation.lat,
        p_pickup_lng: pickupLocation.lng,
        p_pickup_address: pickupLocation.address,
        p_dropoff_lat: dropoffLocation.lat,
        p_dropoff_lng: dropoffLocation.lng,
        p_dropoff_address: dropoffLocation.address,
        p_pickup_date: pickupDate,
        p_pickup_time_start: pickupTimeStart || null,
        p_pickup_time_end: pickupTimeEnd || null,
        p_delivery_deadline: deliveryDeadline || null,
        p_budget_min: budgetMin === "" ? null : budgetMin,
        p_budget_max: budgetMax === "" ? null : budgetMax,
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g., Electronics shipment to Boston"
        required
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details about the shipment..."
          rows={3}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 hover:border-gray-400"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Pallets"
          type="number"
          value={palletCount}
          onChange={(e) => setPalletCount(parseInt(e.target.value) || 0)}
          min={0}
        />
        <Input
          label="Boxes"
          type="number"
          value={boxCount}
          onChange={(e) => setBoxCount(parseInt(e.target.value) || 0)}
          min={0}
        />
        <Input
          label="Weight (kg)"
          type="number"
          value={weightKg}
          onChange={(e) =>
            setWeightKg(e.target.value ? parseFloat(e.target.value) : "")
          }
          min={0}
          placeholder="Optional"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Pickup Location
        </label>
        <LocationPicker
          value={pickupLocation}
          onChange={setPickupLocation}
          placeholder="Click to set pickup location"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Dropoff Location
        </label>
        <LocationPicker
          value={dropoffLocation}
          onChange={setDropoffLocation}
          placeholder="Click to set dropoff location"
        />
      </div>

      <Input
        label="Pickup Date"
        type="date"
        value={pickupDate}
        onChange={(e) => setPickupDate(e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Pickup Start Time"
          type="time"
          value={pickupTimeStart}
          onChange={(e) => setPickupTimeStart(e.target.value)}
        />
        <Input
          label="Pickup End Time"
          type="time"
          value={pickupTimeEnd}
          onChange={(e) => setPickupTimeEnd(e.target.value)}
        />
      </div>

      <Input
        label="Delivery Deadline"
        type="datetime-local"
        value={deliveryDeadline}
        onChange={(e) => setDeliveryDeadline(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Min Budget"
          type="number"
          value={budgetMin}
          onChange={(e) =>
            setBudgetMin(e.target.value ? parseFloat(e.target.value) : "")
          }
          min={0}
          step={0.01}
          placeholder="Optional"
        />
        <Input
          label="Max Budget"
          type="number"
          value={budgetMax}
          onChange={(e) =>
            setBudgetMax(e.target.value ? parseFloat(e.target.value) : "")
          }
          min={0}
          step={0.01}
          placeholder="Optional"
        />
      </div>

      <Button
        type="submit"
        isLoading={isSubmitting}
        fullWidth
        size="lg"
      >
        Create Shipment
      </Button>
    </form>
  );
}
