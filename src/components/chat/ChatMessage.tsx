"use client";

import React from "react";
import type { MessageWithSender } from "@/hooks/useChat";
import { formatTime, formatCurrency, cn } from "@/lib/utils";

interface ChatMessageProps {
  message: MessageWithSender;
  isOwn: boolean;
}

export function ChatMessage({ message, isOwn }: ChatMessageProps) {
  const senderName = message.sender?.display_name || "Unknown";

  // System messages: centered, small gray text
  if (message.message_type === "system") {
    return (
      <div className="flex justify-center py-2">
        <p className="text-xs text-gray-400 text-center max-w-[80%]">
          {message.content}
        </p>
      </div>
    );
  }

  // Negotiation action messages: special card styling
  if (message.message_type === "negotiation_action") {
    return (
      <div className="flex justify-center py-2">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 max-w-[85%]">
          <div className="flex items-center gap-2 justify-center">
            <span className="text-sm text-yellow-800 font-medium">
              {message.content}
            </span>
            {/* Attempt to parse a price from the content */}
            {extractPrice(message.content) !== null && (
              <span className="inline-flex items-center rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-semibold text-yellow-900">
                {formatCurrency(extractPrice(message.content)!)}
              </span>
            )}
          </div>
          <p className="text-xs text-yellow-600 text-center mt-1">
            {formatTime(message.created_at)}
          </p>
        </div>
      </div>
    );
  }

  // Regular text messages
  return (
    <div
      className={cn(
        "flex flex-col gap-1 max-w-[80%]",
        isOwn ? "self-end items-end" : "self-start items-start"
      )}
    >
      {/* Sender name for non-own messages */}
      {!isOwn && (
        <span className="text-xs text-gray-500 px-3 font-medium">
          {senderName}
        </span>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          "rounded-2xl px-4 py-2.5 break-words",
          isOwn
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-gray-100 text-gray-900 rounded-bl-md"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>

      {/* Timestamp */}
      <span
        className={cn(
          "text-[11px] px-1",
          isOwn ? "text-gray-400" : "text-gray-400"
        )}
      >
        {formatTime(message.created_at)}
      </span>
    </div>
  );
}

/**
 * Attempt to extract a numeric price from message content.
 * Matches patterns like "$1,234.56" or "1234.56" within the text.
 */
function extractPrice(content: string): number | null {
  const match = content.match(/\$?([\d,]+\.?\d*)/);
  if (!match) return null;
  const price = parseFloat(match[1].replace(/,/g, ""));
  return isNaN(price) ? null : price;
}
