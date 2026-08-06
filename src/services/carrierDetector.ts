import { CarrierId, CarrierInfo } from '../types/tracking';

export const CARRIERS: Record<CarrierId, CarrierInfo> = {
  ups: {
    id: 'ups',
    name: 'UPS',
    color: 'from-amber-600 to-amber-700',
    bgColor: 'bg-amber-950/40 border-amber-500/30',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-400 border-amber-500/30',
    accentHex: '#f59e0b',
    website: 'https://www.ups.com/track',
    logoIcon: '🚚',
  },
  fedex: {
    id: 'fedex',
    name: 'FedEx',
    color: 'from-purple-600 to-indigo-600',
    bgColor: 'bg-purple-950/40 border-purple-500/30',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-400 border-purple-500/30',
    accentHex: '#8b5cf6',
    website: 'https://www.fedex.com/fedextrack/',
    logoIcon: '📦',
  },
  usps: {
    id: 'usps',
    name: 'USPS',
    color: 'from-blue-600 to-cyan-600',
    bgColor: 'bg-blue-950/40 border-blue-500/30',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-400 border-blue-500/30',
    accentHex: '#3b82f6',
    website: 'https://tools.usps.com/go/TrackConfirmAction_input',
    logoIcon: '📬',
  },
  dhl: {
    id: 'dhl',
    name: 'DHL Express',
    color: 'from-yellow-500 to-red-600',
    bgColor: 'bg-yellow-950/40 border-yellow-500/30',
    badgeBg: 'bg-yellow-500/20',
    badgeText: 'text-yellow-400 border-yellow-500/30',
    accentHex: '#eab308',
    website: 'https://www.dhl.com/en/express/tracking.html',
    logoIcon: '✈️',
  },
  unknown: {
    id: 'unknown',
    name: 'Auto-Detecting',
    color: 'from-slate-600 to-slate-700',
    bgColor: 'bg-slate-900 border-slate-700',
    badgeBg: 'bg-slate-800',
    badgeText: 'text-slate-400 border-slate-700',
    accentHex: '#64748b',
    website: '#',
    logoIcon: '🔎',
  },
};

export interface SampleTracking {
  trackingNumber: string;
  carrierId: CarrierId;
  label: string;
  description: string;
}

export const SAMPLE_TRACKING_NUMBERS: SampleTracking[] = [
  {
    trackingNumber: '875278203409',
    carrierId: 'fedex',
    label: 'Your FedEx Package (875278203409)',
    description: 'FedEx Home Delivery: Left Arcadia, CA origin facility',
  },
  {
    trackingNumber: '1Z9999999999999999',
    carrierId: 'ups',
    label: 'UPS Ground Express',
    description: 'In Transit: Louisville Hub -> Chicago IL',
  },
  {
    trackingNumber: '9400100000000000000000',
    carrierId: 'usps',
    label: 'USPS Priority Mail',
    description: 'Delivered: Jersey City NDC -> New York NY',
  },
  {
    trackingNumber: '1234567890',
    carrierId: 'dhl',
    label: 'DHL Express Worldwide',
    description: 'In Transit: Frankfurt Germany -> New York JFK',
  },
];

/**
 * Detect carrier based on standard tracking number regular expressions.
 */
export function detectCarrier(rawTrackingNumber: string): CarrierInfo {
  const tracking = rawTrackingNumber.trim().toUpperCase().replace(/\s+/g, '');

  if (!tracking) return CARRIERS.unknown;

  if (/^1Z[A-Z0-9]{16}$/i.test(tracking) || /^T\d{10}$/i.test(tracking)) {
    return CARRIERS.ups;
  }

  if (
    /^(94|92|93|95|70|23)\d{18,20}$/.test(tracking) ||
    /^[A-Z]{2}\d{9}US$/i.test(tracking) ||
    /^\d{20,22}$/.test(tracking)
  ) {
    return CARRIERS.usps;
  }

  if (
    /^\d{12}$/.test(tracking) ||
    /^\d{15}$/.test(tracking) ||
    /^\d{20}$/.test(tracking) ||
    /^\d{14}$/.test(tracking) ||
    /^\d{22}$/.test(tracking)
  ) {
    return CARRIERS.fedex;
  }

  if (
    /^\d{10}$/.test(tracking) ||
    /^(JJD|GM|LX|RX|JD)\d{10,18}$/i.test(tracking) ||
    /^\d{11}$/.test(tracking)
  ) {
    return CARRIERS.dhl;
  }

  if (tracking.startsWith('1Z')) return CARRIERS.ups;
  if (tracking.length === 12 || tracking.length === 15) return CARRIERS.fedex;
  if (tracking.length === 22 || tracking.length === 20) return CARRIERS.usps;
  if (tracking.length === 10) return CARRIERS.dhl;

  return CARRIERS.unknown;
}
