"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";

export default function Home() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
    } else if (profile) {
      router.replace(
        profile.role === "trucker"
          ? "/trucker/dashboard"
          : "/company/dashboard"
      );
    }
  }, [user, profile, isLoading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
