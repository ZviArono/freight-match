"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { createClient } from "@/lib/supabase/client";
import type { Shipment } from "@/types/database";

function JobCard({ shipment }: { shipment: Shipment }) {
  const pickupDateFormatted = new Date(
    shipment.pickup_date
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/trucker/jobs/${shipment.id}`}>
      <div className="rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md active:bg-gray-50">
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex-1 text-sm font-semibold text-gray-900 truncate">
            {shipment.title}
          </h3>
          <Badge variant="info">
            {shipment.pallet_count} pallets
          </Badge>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {/* Pickup */}
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
              <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
            </div>
            <p className="text-xs text-gray-600 truncate">
              {shipment.pickup_address}
            </p>
          </div>
          {/* Dropoff */}
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
              <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
            </div>
            <p className="text-xs text-gray-600 truncate">
              {shipment.dropoff_address}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg
              className="h-4 w-4"
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
          {shipment.budget_min !== null &&
            shipment.budget_max !== null && (
              <span className="text-sm font-semibold text-green-700">
                ${shipment.budget_min} - ${shipment.budget_max}
              </span>
            )}
        </div>
      </div>
    </Link>
  );
}

export default function TruckerJobsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("shipments")
          .select("*")
          .eq("status", "posted")
          .order("pickup_date", { ascending: true });

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        setShipments((data as Shipment[]) || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load jobs."
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobs();
  }, []);

  return (
    <>
      <Header title="Available Jobs" />
      <main className="mx-auto max-w-lg px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : shipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              className="mb-4 h-16 w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"
              />
            </svg>
            <p className="text-sm text-gray-500">
              No available jobs right now.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Check back later for new shipment postings.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {shipments.map((shipment) => (
              <JobCard key={shipment.id} shipment={shipment} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
