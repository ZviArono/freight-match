import type { NegotiationStatus } from "./database";

export const NEGOTIATION_STATUS = {
  INITIATED: "initiated",
  PROPOSED: "proposed",
  COUNTER_OFFERED: "counter_offered",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
} as const;

export const TERMINAL_STATES: NegotiationStatus[] = [
  "accepted",
  "rejected",
  "expired",
  "cancelled",
];

export type NegotiationAction = "propose" | "accept" | "reject";

export function getAvailableActions(
  status: NegotiationStatus,
  isProposer: boolean
): NegotiationAction[] {
  if (TERMINAL_STATES.includes(status)) return [];

  if (status === "initiated") {
    return ["propose", "reject"];
  }

  if (isProposer) {
    // You proposed last — you can only wait or reject
    return ["reject"];
  }

  // You received the last proposal — you can accept, counter, or reject
  return ["propose", "accept", "reject"];
}

export function getStatusLabel(status: NegotiationStatus): string {
  const labels: Record<NegotiationStatus, string> = {
    initiated: "Started",
    proposed: "Offer Sent",
    counter_offered: "Counter-Offer",
    accepted: "Accepted",
    rejected: "Rejected",
    expired: "Expired",
    cancelled: "Cancelled",
  };
  return labels[status];
}

export function getStatusColor(status: NegotiationStatus): string {
  const colors: Record<NegotiationStatus, string> = {
    initiated: "bg-gray-100 text-gray-800",
    proposed: "bg-blue-100 text-blue-800",
    counter_offered: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    expired: "bg-gray-100 text-gray-500",
    cancelled: "bg-gray-100 text-gray-500",
  };
  return colors[status];
}
