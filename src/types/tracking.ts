export type CarrierId = 'fedex' | 'ups' | 'usps' | 'dhl' | 'unknown';

export interface CarrierInfo {
  id: CarrierId;
  name: string;
  color: string;
  bgColor: string;
  badgeBg: string;
  badgeText: string;
  accentHex: string;
  website: string;
  logoIcon: string;
}

export type StatusCategory =
  | 'label_created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception';

export interface Checkpoint {
  id: string;
  sequence: number;
  timestamp: string;
  location: string;
  city: string;
  stateCountry: string;
  latitude: number;
  longitude: number;
  status: StatusCategory;
  statusTitle: string;
  details: string;
  facilityType: 'origin' | 'sorting_hub' | 'transit_facility' | 'delivery_station' | 'destination';
  weatherAlert?: {
    severity: 'minor' | 'moderate' | 'severe';
    condition: string;
    description: string;
  };
}

export interface PackageData {
  trackingNumber: string;
  carrier: CarrierInfo;
  origin: {
    city: string;
    stateCountry: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    city: string;
    stateCountry: string;
    latitude: number;
    longitude: number;
  };
  currentStatus: StatusCategory;
  currentStatusTitle: string;
  statusMessage: string;
  estimatedDelivery: string;
  shippingService: string;
  weight?: string;
  pieces?: number;
  progressPercent: number; // 0 to 100
  isDelivered: boolean;
  lastUpdated: string;
  checkpoints: Checkpoint[];
}

export interface SavedPackage {
  trackingNumber: string;
  carrierId: CarrierId;
  carrierName: string;
  statusTitle: string;
  originCity: string;
  destCity: string;
  lastChecked: string;
  isDelivered: boolean;
}
