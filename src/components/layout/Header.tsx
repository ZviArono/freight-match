"use client";

import { useAuth } from "@/providers/AuthProvider";

export function Header({ title }: { title: string }) {
  const { profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-between px-4">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {profile?.display_name}
          </span>
          <button
            onClick={signOut}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
