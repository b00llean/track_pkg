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

/**
 * Represents a geographical hub grouping multiple package journey checkpoints occurring at the same location.
 */
export interface LocationGroup {
  id: string;
  locationKey: string;
  city: string;
  stateCountry: string;
  locationName: string;
  latitude: number;
  longitude: number;
  checkpoints: Checkpoint[];
  latestCheckpoint: Checkpoint;
  facilityType: Checkpoint['facilityType'];
  hasWeatherAlert: boolean;
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

export interface RecentTrackedPackage {
  trackingNumber: string;
  carrierId: CarrierId;
  carrierName: string;
  logoIcon: string;
}

export const DEFAULT_RECENT_PACKAGES: RecentTrackedPackage[] = [
  {
    trackingNumber: '1ZWA87086770381418',
    carrierId: 'ups',
    carrierName: 'UPS',
    logoIcon: '🚚',
  },
  {
    trackingNumber: '875278203409',
    carrierId: 'fedex',
    carrierName: 'FedEx',
    logoIcon: '📦',
  },
  {
    trackingNumber: '9400100000000000000000',
    carrierId: 'usps',
    carrierName: 'USPS',
    logoIcon: '📬',
  },
  {
    trackingNumber: '4711928340',
    carrierId: 'dhl',
    carrierName: 'DHL Express',
    logoIcon: '✈️',
  },
];

export type ApiProviderId = '17track' | 'ship24' | 'easypost' | 'custom_proxy';

export interface TrackingApiSettings {
  mode: 'live' | 'demo';
  provider: ApiProviderId;
  apiKey: string;
  customEndpoint?: string;
  autoGeocode: boolean;
}

