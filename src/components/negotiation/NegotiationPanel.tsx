"use client";

import React from "react";
import { useNegotiation } from "@/hooks/useNegotiation";
import { getStatusLabel, getStatusColor } from "@/types/negotiation";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { NegotiationActions } from "./NegotiationActions";
import { NegotiationHistory } from "./NegotiationHistory";
import { formatCurrency, cn } from "@/lib/utils";

interface NegotiationPanelProps {
  negotiationId: string;
}

export function NegotiationPanel({ negotiationId }: NegotiationPanelProps) {
  const {
    negotiation,
    events,
    availableActions,
    isProposer,
    propose,
    accept,
    reject,
    isLoading,
    error,
  } = useNegotiation(negotiationId);

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="py-8">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error loading negotiation</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </Card>
    );
  }

  if (!negotiation) {
    return (
      <Card className="py-8">
        <p className="text-center text-gray-500">Negotiation not found.</p>
      </Card>
    );
  }

  const statusLabel = getStatusLabel(negotiation.status);
  const statusColor = getStatusColor(negotiation.status);

  return (
    <div className="space-y-4">
      {/* Status and Price */}
      <Card>
        <div className="space-y-4">
          {/* Status badge */}
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                statusColor
              )}
            >
              {statusLabel}
            </span>

            {isProposer && (
              <span className="text-xs text-gray-400">
                Waiting for response
              </span>
            )}
          </div>

          {/* Current price */}
          {negotiation.current_price !== null && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500 mb-1">Current Price</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(negotiation.current_price)}
              </p>
            </div>
          )}

          {negotiation.current_price === null && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500">No price proposed yet</p>
            </div>
          )}

          {/* Who proposed last */}
          {negotiation.proposed_by && (
            <p className="text-xs text-gray-400 text-center">
              {isProposer ? "You proposed this price" : "Proposed by the other party"}
            </p>
          )}
        </div>
      </Card>

      {/* Actions */}
      <Card>
        <NegotiationActions
          availableActions={availableActions}
          currentPrice={negotiation.current_price}
          onPropose={propose}
          onAccept={accept}
          onReject={reject}
          isLoading={isLoading}
        />

        {availableActions.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">
            No actions available for this negotiation.
          </p>
        )}
      </Card>

      {/* Event History */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Activity</h3>
        <NegotiationHistory events={events} />
      </Card>
    </div>
  );
}
