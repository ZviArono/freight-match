"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import type { Shipment } from "@/types/database";

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await supabase
        .from("shipments")
        .select("*")
        .eq("company_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setShipments(data ?? []);
      setIsLoading(false);
    }
    load();
  }, [user]);

  const stats = {
    total: shipments.length,
    posted: shipments.filter((s) => s.status === "posted").length,
    booked: shipments.filter((s) => s.status === "booked").length,
    inTransit: shipments.filter((s) => s.status === "in_transit").length,
  };

  const statusVariant = (status: string) => {
    const map: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
      draft: "default",
      posted: "info",
      negotiating: "warning",
      booked: "success",
      in_transit: "warning",
      delivered: "success",
      cancelled: "danger",
    };
    return map[status] ?? "default";
  };

  return (
    <>
      <Header title="Dashboard" />
      <main className="mx-auto max-w-lg px-4 py-6">
        {/* Quick Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <Card className="!p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">{stats.posted}</p>
            <p className="text-xs text-gray-500">Active Posts</p>
          </Card>
          <Card className="!p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.booked}</p>
            <p className="text-xs text-gray-500">Booked</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <Link
            href="/company/shipments/new"
            className="flex h-12 items-center justify-center rounded-lg bg-primary-600 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            + New Shipment
          </Link>
          <Link
            href="/company/map"
            className="flex h-12 items-center justify-center rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            View Map
          </Link>
        </div>

        {/* Recent Shipments */}
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Recent Shipments
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : shipments.length === 0 ? (
          <Card>
            <p className="text-center text-sm text-gray-500">
              No shipments yet. Create your first one!
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {shipments.map((shipment) => (
              <Link key={shipment.id} href={`/company/shipments/${shipment.id}`}>
                <Card className="transition hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {shipment.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {shipment.pallet_count} pallets &middot;{" "}
                        {shipment.pickup_address}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(shipment.pickup_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={statusVariant(shipment.status)}>
                      {shipment.status.replace("_", " ")}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
