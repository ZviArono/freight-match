export interface LatLng {
  lat: number;
  lng: number;
}

export interface LocationWithAddress extends LatLng {
  address: string;
}

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface TruckerBroadcast {
  trucker_id: string;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
}
