"use client";

import React from "react";
import type { NegotiationEvent } from "@/types/database";
import { formatCurrency, formatRelativeTime, cn } from "@/lib/utils";

interface NegotiationHistoryProps {
  events: NegotiationEvent[];
}

const EVENT_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; dotColor: string }
> = {
  propose: {
    label: "Price Proposed",
    color: "text-blue-700",
    dotColor: "bg-blue-500",
  },
  counter: {
    label: "Counter Offer",
    color: "text-yellow-700",
    dotColor: "bg-yellow-500",
  },
  counter_offer: {
    label: "Counter Offer",
    color: "text-yellow-700",
    dotColor: "bg-yellow-500",
  },
  accept: {
    label: "Offer Accepted",
    color: "text-green-700",
    dotColor: "bg-green-500",
  },
  reject: {
    label: "Offer Rejected",
    color: "text-red-700",
    dotColor: "bg-red-500",
  },
  initiate: {
    label: "Negotiation Started",
    color: "text-gray-700",
    dotColor: "bg-gray-400",
  },
  expire: {
    label: "Expired",
    color: "text-gray-500",
    dotColor: "bg-gray-400",
  },
  cancel: {
    label: "Cancelled",
    color: "text-gray-500",
    dotColor: "bg-gray-400",
  },
};

function getEventConfig(eventType: string) {
  return (
    EVENT_TYPE_CONFIG[eventType] || {
      label: eventType,
      color: "text-gray-700",
      dotColor: "bg-gray-400",
    }
  );
}

export function NegotiationHistory({ events }: NegotiationHistoryProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No negotiation activity yet.
      </p>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-4">
        {events.map((event, idx) => {
          const config = getEventConfig(event.event_type);
          const isLast = idx === events.length - 1;

          return (
            <li key={event.id} className="relative pb-4">
              {/* Connecting line */}
              {!isLast && (
                <span
                  className="absolute left-[9px] top-5 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}

              <div className="relative flex items-start gap-3">
                {/* Colored dot */}
                <div
                  className={cn(
                    "mt-1 h-[18px] w-[18px] flex-shrink-0 rounded-full border-2 border-white ring-2 ring-gray-100",
                    config.dotColor
                  )}
                  aria-hidden="true"
                />

                {/* Event content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium leading-tight",
                      config.color
                    )}
                  >
                    {config.label}
                  </p>

                  {event.price !== null && event.price !== undefined && (
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {formatCurrency(event.price)}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatRelativeTime(event.created_at)}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
