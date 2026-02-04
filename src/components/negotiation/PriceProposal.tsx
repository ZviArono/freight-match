"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

interface PriceProposalProps {
  onSubmit: (price: number) => void;
  isLoading: boolean;
  currentPrice: number | null;
}

export function PriceProposal({
  onSubmit,
  isLoading,
  currentPrice,
}: PriceProposalProps) {
  const [priceInput, setPriceInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const parsedPrice = parseFloat(priceInput);
  const isValidPrice = !isNaN(parsedPrice) && parsedPrice > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!priceInput.trim()) {
      setValidationError("Please enter a price");
      return;
    }

    if (!isValidPrice) {
      setValidationError("Price must be greater than $0");
      return;
    }

    onSubmit(parsedPrice);
    setPriceInput("");
  }

  const buttonLabel = currentPrice !== null ? "Counter Offer" : "Propose Price";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {currentPrice !== null && (
        <p className="text-sm text-gray-500">
          Current price: <span className="font-medium text-gray-900">{formatCurrency(currentPrice)}</span>
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label
          htmlFor="price-input"
          className="text-sm font-medium text-gray-700"
        >
          Your Price
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
            $
          </span>
          <input
            id="price-input"
            type="number"
            step="0.01"
            min="0.01"
            value={priceInput}
            onChange={(e) => {
              setPriceInput(e.target.value);
              setValidationError(null);
            }}
            placeholder="0.00"
            className={[
              "w-full rounded-lg border pl-7 pr-3 py-2 text-sm transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
              validationError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400",
            ].join(" ")}
            aria-invalid={validationError ? true : undefined}
            aria-describedby={
              validationError ? "price-input-error" : undefined
            }
            disabled={isLoading}
          />
        </div>
        {validationError && (
          <p
            id="price-input-error"
            className="text-sm text-red-600"
            role="alert"
          >
            {validationError}
          </p>
        )}
      </div>

      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
        disabled={!priceInput.trim() || isLoading}
      >
        {buttonLabel}
      </Button>
    </form>
  );
}
