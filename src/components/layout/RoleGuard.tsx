"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";
import type { UserRole } from "@/types/database";

export function RoleGuard({
  allowedRole,
  children,
}: {
  allowedRole: UserRole;
  children: React.ReactNode;
}) {
  const { profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!profile) {
      router.replace("/login");
    } else if (profile.role !== allowedRole) {
      router.replace("/dashboard");
    }
  }, [profile, isLoading, allowedRole, router]);

  if (isLoading || !profile || profile.role !== allowedRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
