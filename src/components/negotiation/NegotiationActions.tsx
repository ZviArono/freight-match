"use client";

import React, { useState } from "react";
import type { NegotiationAction } from "@/types/negotiation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PriceProposal } from "./PriceProposal";
import { formatCurrency } from "@/lib/utils";

interface NegotiationActionsProps {
  availableActions: NegotiationAction[];
  currentPrice: number | null;
  onPropose: (price: number) => void;
  onAccept: () => void;
  onReject: () => void;
  isLoading: boolean;
}

export function NegotiationActions({
  availableActions,
  currentPrice,
  onPropose,
  onAccept,
  onReject,
  isLoading,
}: NegotiationActionsProps) {
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const canPropose = availableActions.includes("propose");
  const canAccept = availableActions.includes("accept");
  const canReject = availableActions.includes("reject");

  if (availableActions.length === 0) {
    return null;
  }

  function handleRejectConfirm() {
    setShowRejectConfirm(false);
    onReject();
  }

  return (
    <div className="space-y-4">
      {/* Price proposal form */}
      {canPropose && (
        <PriceProposal
          onSubmit={onPropose}
          isLoading={isLoading}
          currentPrice={currentPrice}
        />
      )}

      {/* Accept and Reject buttons */}
      {(canAccept || canReject) && (
        <div className="flex gap-3">
          {canAccept && currentPrice !== null && (
            <Button
              variant="primary"
              fullWidth
              isLoading={isLoading}
              onClick={onAccept}
              className="bg-green-600 hover:bg-green-700 active:bg-green-800 focus-visible:ring-green-500 min-h-[44px]"
            >
              Accept {formatCurrency(currentPrice)}
            </Button>
          )}

          {canReject && (
            <Button
              variant="danger"
              fullWidth={!canAccept}
              isLoading={isLoading}
              onClick={() => setShowRejectConfirm(true)}
              className="min-h-[44px]"
            >
              Reject
            </Button>
          )}
        </div>
      )}

      {/* Reject confirmation modal */}
      <Modal
        isOpen={showRejectConfirm}
        onClose={() => setShowRejectConfirm(false)}
        title="Reject Offer"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to reject this offer? This action cannot be
            undone and the negotiation will be closed.
          </p>

          {currentPrice !== null && (
            <p className="text-sm text-gray-700">
              Current offer:{" "}
              <span className="font-semibold">{formatCurrency(currentPrice)}</span>
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowRejectConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              isLoading={isLoading}
              onClick={handleRejectConfirm}
            >
              Yes, Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
