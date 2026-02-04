"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { Shipment, ShipmentStatus } from "@/types/database";

interface ShipmentCardProps {
  shipment: Shipment;
}

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

export function ShipmentCard({ shipment }: ShipmentCardProps) {
  const pickupDateFormatted = new Date(
    shipment.pickup_date
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/company/shipments/${shipment.id}`}>
      <div className="rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md active:bg-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {shipment.title}
            </h3>
            <p className="mt-1 text-xs text-gray-500 truncate">
              {shipment.pickup_address}
            </p>
          </div>
          <Badge variant={statusVariant[shipment.status]}>
            {statusLabel[shipment.status]}
          </Badge>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
              />
            </svg>
            <span>{shipment.pallet_count} pallets</span>
          </div>
          <div className="flex items-center gap-1">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
              />
            </svg>
            <span>{pickupDateFormatted}</span>
          </div>
          {shipment.budget_min !== null && shipment.budget_max !== null && (
            <div className="flex items-center gap-1">
              <span className="font-medium text-green-700">
                ${shipment.budget_min} - ${shipment.budget_max}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
