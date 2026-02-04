export type UserRole = "company" | "trucker";

export type ShipmentStatus =
  | "draft"
  | "posted"
  | "negotiating"
  | "booked"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type NegotiationStatus =
  | "initiated"
  | "proposed"
  | "counter_offered"
  | "accepted"
  | "rejected"
  | "expired"
  | "cancelled";

export type MessageType = "text" | "negotiation_action" | "system";

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string;
  company_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  pallet_count: number;
  box_count: number;
  weight_kg: number | null;
  pickup_location: string; // WKB hex from PostGIS
  pickup_address: string;
  dropoff_location: string;
  dropoff_address: string;
  pickup_date: string;
  pickup_time_start: string | null;
  pickup_time_end: string | null;
  delivery_deadline: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: ShipmentStatus;
  assigned_trucker_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TruckerAvailability {
  id: string;
  trucker_id: string;
  is_available: boolean;
  current_location: string | null;
  current_address: string | null;
  destination_location: string | null;
  destination_address: string | null;
  available_pallets: number;
  vehicle_type: string | null;
  available_from: string | null;
  available_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface TruckerLocation {
  trucker_id: string;
  location: string;
  heading: number | null;
  speed_kmh: number | null;
  accuracy_meters: number | null;
  last_updated: string;
}

export interface Negotiation {
  id: string;
  shipment_id: string;
  company_id: string;
  trucker_id: string;
  status: NegotiationStatus;
  current_price: number | null;
  proposed_by: string | null;
  expires_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface NegotiationEvent {
  id: string;
  negotiation_id: string;
  event_type: string;
  from_status: NegotiationStatus;
  to_status: NegotiationStatus;
  price: number | null;
  actor_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Message {
  id: string;
  negotiation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  negotiation_event_id: string | null;
  is_read: boolean;
  created_at: string;
}

// RPC return types
export interface TruckerMapData {
  trucker_id: string;
  display_name: string;
  phone: string | null;
  avatar_url: string | null;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed_kmh: number | null;
  available_pallets: number;
  is_available: boolean;
  last_updated: string;
  distance_km: number;
}
