"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { NegotiationPanel } from "@/components/negotiation/NegotiationPanel";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Spinner } from "@/components/ui/Spinner";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [showNegotiation, setShowNegotiation] = useState(false);

  const negotiationId = params.negotiationId as string;

  if (authLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-50">
        <p className="text-gray-500">Please sign in to view this chat.</p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 safe-top">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center rounded-lg p-2 min-h-[44px] min-w-[44px] text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Go back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div className="flex-1">
          <h1 className="text-base font-semibold text-gray-900">
            Negotiation Chat
          </h1>
        </div>

        {/* Toggle negotiation panel */}
        <button
          onClick={() => setShowNegotiation(!showNegotiation)}
          className={[
            "flex items-center justify-center rounded-lg p-2 min-h-[44px] min-w-[44px] transition-colors",
            showNegotiation
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:bg-gray-100 active:bg-gray-200",
          ].join(" ")}
          aria-label={
            showNegotiation
              ? "Hide negotiation details"
              : "Show negotiation details"
          }
          aria-expanded={showNegotiation}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </header>

      {/* Collapsible negotiation panel */}
      {showNegotiation && (
        <div className="border-b border-gray-200 bg-gray-50 overflow-y-auto max-h-[60vh]">
          <div className="p-4">
            <NegotiationPanel negotiationId={negotiationId} />
          </div>
        </div>
      )}

      {/* Chat window fills remaining space */}
      <ChatWindow negotiationId={negotiationId} />
    </div>
  );
}
