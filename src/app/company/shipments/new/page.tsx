"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ShipmentForm } from "@/components/shipment/ShipmentForm";

export default function NewShipmentPage() {
  const router = useRouter();

  return (
    <>
      <Header title="New Shipment" />
      <main className="mx-auto max-w-lg pb-8">
        <ShipmentForm onSuccess={() => router.push("/company/shipments")} />
      </main>
    </>
  );
}
