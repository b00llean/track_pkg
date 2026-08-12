import { Checkpoint, PackageData, StatusCategory, TrackingApiSettings } from '../types/tracking';
import { CARRIERS, detectCarrier } from './carrierDetector';
import { geocodeLocation } from './geocoding';

const SETTINGS_STORAGE_KEY = 'track_pkg_api_settings_v1';

export function isPlaceholderKey(key: string): boolean {
  if (!key) return true;
  const k = key.toLowerCase().trim();
  return (
    k === 'your_17track_key_here' ||
    k === 'your_17track_api_key_here' ||
    k === 'your_api_key_here' ||
    k === '17track_key_here' ||
    k === 'your_17token_here' ||
    k === 'xxxxxxxx' ||
    k.startsWith('your_') ||
    k.startsWith('enter_') ||
    k.startsWith('paste_') ||
    k.startsWith('change_me') ||
    k.includes('key_here') ||
    k.includes('token_here')
  );
}

export function getApiSettings(): TrackingApiSettings {
  const envVarCandidates = [
    import.meta.env.VITE_17TRACK_API_KEY,
    import.meta.env.VITE_17TRACK_TOKEN,
    import.meta.env.VITE_17TOKEN,
    (import.meta.env as any)['17TRACK_API_KEY'],
    (import.meta.env as any)['TRACK17_API_KEY'],
    (window as any).__ENV__?.VITE_17TRACK_API_KEY,
    (window as any).__ENV__?.['17TRACK_API_KEY'],
    (window as any).__ENV__?.VITE_17TRACK_TOKEN,
  ];

  let envKey = '';
  for (const candidate of envVarCandidates) {
    if (candidate && typeof candidate === 'string') {
      const clean = candidate.trim().replace(/^["']|["']$/g, '');
      if (clean && !isPlaceholderKey(clean)) {
        envKey = clean;
        break;
      }
    }
  }

  let storedKey = '';
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const k = (parsed.apiKey || '').trim().replace(/^["']|["']$/g, '');
      if (k && !isPlaceholderKey(k)) {
        storedKey = k;
      }
    }
  } catch (e) {
    console.warn('Error reading tracking API settings:', e);
  }

  // Prioritize environment variable first, then stored key
  const effectiveKey = envKey || storedKey;

  return {
    mode: 'live',
    provider: '17track',
    apiKey: effectiveKey,
    autoGeocode: true,
  };
}


export function saveApiSettings(settings: TrackingApiSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Error saving tracking API settings:', e);
  }
}

/**
 * Normalize raw status strings into internal StatusCategory enum
 */
function normalizeStatusCategory(rawStatus: string): StatusCategory {
  const s = rawStatus.toLowerCase();
  if (s.includes('delivered') || s.includes('signed') || s.includes('completed') || s.includes('left at door')) return 'delivered';
  if (s.includes('out for delivery') || s.includes('on vehicle') || s.includes('delivery today') || s.includes('courier')) return 'out_for_delivery';
  if (s.includes('transit') || s.includes('departed') || s.includes('arrived') || s.includes('facility') || s.includes('hub') || s.includes('location')) return 'in_transit';
  if (s.includes('picked up') || s.includes('accepted') || s.includes('origin scan') || s.includes('collected')) return 'picked_up';
  if (s.includes('label') || s.includes('info received') || s.includes('created') || s.includes('shipment information')) return 'label_created';
  if (s.includes('exception') || s.includes('failed') || s.includes('held') || s.includes('delay') || s.includes('return')) return 'exception';
  return 'in_transit';
}

function inferFacilityType(index: number, total: number, status: StatusCategory): Checkpoint['facilityType'] {
  if (index === 0) return 'origin';
  if (index === total - 1) return status === 'delivered' ? 'destination' : 'delivery_station';
  if (status === 'picked_up' || index === 1) return 'sorting_hub';
  if (status === 'out_for_delivery') return 'delivery_station';
  return 'transit_facility';
}

function calculateProgress(status: StatusCategory, checkpointsCount: number): number {
  switch (status) {
    case 'label_created': return 15;
    case 'picked_up': return 35;
    case 'in_transit': return Math.min(40 + checkpointsCount * 10, 85);
    case 'out_for_delivery': return 92;
    case 'delivered': return 100;
    case 'exception': return 50;
    default: return 50;
  }
}

export async function post17TrackApi(path: string, apiKey: string, payload: any): Promise<Response> {
  const endpoints = [
    `/api/17track${path}`,
    `https://api.17track.net${path}`,
    `https://corsproxy.io/?${encodeURIComponent('https://api.17track.net' + path)}`,
  ];

  let lastError: any = null;
  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '17token': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (response.status !== 404 && response.status !== 502) {
        return response;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Network error: Unable to connect to 17TRACK API.');
}

/**
 * Fetch live package tracking details from 17TRACK API (v2.2)
 */
export async function fetchLivePackageTracking(
  trackingNumber: string,
  settings: TrackingApiSettings
): Promise<PackageData> {
  const cleanNum = trackingNumber.trim().toUpperCase().replace(/\s+/g, '');
  const currentSettings = getApiSettings();
  const apiKey = (settings && settings.apiKey && !isPlaceholderKey(settings.apiKey)) ? settings.apiKey : currentSettings.apiKey;

  if (!apiKey || isPlaceholderKey(apiKey)) {
    throw new Error('17TRACK API Key (17token) is required. Please enter your API key to view live tracking.');
  }

  const detectedCarrierId = detectCarrier(cleanNum).id;

  const carrierMap: Record<string, number> = {
    usps: 21051,
    fedex: 100001,
    ups: 100003,
    dhl: 100002,
  };
  const carrierCode17 = carrierMap[detectedCarrierId];

  // Step 1: Query 17TRACK /gettrackinfo API endpoint
  const queryPayload = carrierCode17 ? [{ number: cleanNum, carrier: carrierCode17 }] : [{ number: cleanNum }];
  let response = await post17TrackApi('/track/v2.2/gettrackinfo', apiKey, queryPayload);

  if (!response.ok) {
    throw new Error(`17TRACK API HTTP Error ${response.status}: ${response.statusText}`);
  }

  let json = await response.json();

  // If error is authentication/unauthorized
  if (json.code === 401 || json.code === 403) {
    throw new Error('Invalid 17TRACK API Key (17token). Please verify your key in Settings.');
  }

  // Check if item needs to be registered first on 17TRACK
  let trackItem = json.data?.accepted?.[0] || json.data?.items?.[0];
  const notFoundInAccepted = !trackItem || (json.data?.rejected && json.data.rejected.length > 0);

  if (notFoundInAccepted || !trackItem?.track) {
    // Automatically Register tracking number on 17TRACK
    try {
      const regPayload = carrierCode17 ? [{ number: cleanNum, carrier: carrierCode17 }] : [{ number: cleanNum }];
      const regResponse = await post17TrackApi('/track/v2.2/register', apiKey, regPayload);

      if (regResponse.ok) {
        const regJson = await regResponse.json();
        const rejection = regJson.data?.rejected?.[0];
        
        if (rejection && rejection.error) {
          const errCode = rejection.error.code;
          const errMsg = rejection.error.message || '';
          
          if (errCode === -18019823 || errMsg.toLowerCase().includes('usps') || errMsg.toLowerCase().includes('policy restrictions')) {
            throw new Error(
              `17TRACK API Policy Restriction for USPS: 17TRACK API (v2.2) restricts automated registration for package ${cleanNum} due to carrier API policy limits. Please check tracking directly on USPS.com or import your tracking text below.`
            );
          }
        }

        // Wait briefly for 17TRACK network sync
        await new Promise((r) => setTimeout(r, 1200));

        // Re-query /gettrackinfo
        const retryResponse = await post17TrackApi('/track/v2.2/gettrackinfo', apiKey, queryPayload);

        if (retryResponse.ok) {
          json = await retryResponse.json();
          trackItem = json.data?.accepted?.[0] || json.data?.items?.[0];
        }
      }
    } catch (regErr: any) {
      if (regErr.message && regErr.message.includes('17TRACK API Policy Restriction')) {
        throw regErr;
      }
      console.warn('17TRACK registration attempt notice:', regErr);
    }
  }

  if (!trackItem) {
    const rejectedItem = json.data?.rejected?.[0];
    if (rejectedItem && rejectedItem.error) {
      const errCode = rejectedItem.error.code;
      const errMsg = rejectedItem.error.message || '';
      if (errCode === -18019823 || errMsg.toLowerCase().includes('usps') || errMsg.toLowerCase().includes('policy restrictions')) {
        throw new Error(
          `17TRACK API Policy Restriction for USPS: 17TRACK API (v2.2) restricts automated registration for package ${cleanNum} due to carrier API policy limits. Please check tracking directly on USPS.com or import your tracking text below.`
        );
      }
    }

    throw new Error(
      `Package ${cleanNum} was not found on 17TRACK or has not yet been scanned by carrier. Please verify the tracking number.`
    );
  }

  const trackDetails = trackItem.track_info || trackItem.track || {};
  const provider = trackDetails.tracking?.providers?.[0];
  const events = provider?.events || trackDetails.z1 || trackDetails.z0 || trackDetails.events || [];

  const shippingInfo = trackDetails.shipping_info || {};
  const shipperCity = shippingInfo.shipper_address?.city ? `${shippingInfo.shipper_address.city}, ${shippingInfo.shipper_address.state || ''}` : null;
  const recipientCity = shippingInfo.recipient_address?.city ? `${shippingInfo.recipient_address.city}, ${shippingInfo.recipient_address.state || ''}` : null;

  const miscInfo = trackDetails.misc_info || {};
  const serviceName = miscInfo.service_type || trackDetails.b || `${CARRIERS[detectedCarrierId]?.name || 'Express'} Shipping`;
  const packageWeight = miscInfo.weight_raw || 'Live Carrier Parcel';

  const estDateObj = trackDetails.time_metrics?.estimated_delivery_date;
  let estimatedDelivery = 'Pending carrier update';
  if (estDateObj?.from) {
    try {
      const d = new Date(estDateObj.from);
      if (!isNaN(d.getTime())) {
        estimatedDelivery = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      } else {
        estimatedDelivery = String(estDateObj.from);
      }
    } catch {
      estimatedDelivery = String(estDateObj.from);
    }
  }

  if (!events || events.length === 0) {
    const currentStatusText = trackDetails.latest_status?.status || 'Shipment Information Received';
    const locCoords = await geocodeLocation(shipperCity || 'Origin Transit Facility');

    const singleCp: Checkpoint = {
      id: `cp-live-${cleanNum}-1`,
      sequence: 1,
      timestamp: new Date().toLocaleDateString() + ' - Recently Scanned',
      location: shipperCity || 'Origin Sorting Facility',
      city: shipperCity || 'Origin Facility',
      stateCountry: 'Carrier Network',
      latitude: locCoords[0],
      longitude: locCoords[1],
      status: 'label_created',
      statusTitle: currentStatusText,
      details: 'Shipping details received electronically by carrier. Package in initial processing stage.',
      facilityType: 'origin',
    };

    const carrierObj = CARRIERS[detectedCarrierId] || CARRIERS.fedex;
    const rawPieces = parseInt(miscInfo.pieces || '1', 10);
    const safePieces = isNaN(rawPieces) || rawPieces < 1 ? 1 : rawPieces;

    return {
      trackingNumber: cleanNum,
      carrier: carrierObj,
      origin: { city: shipperCity || 'Origin Hub', stateCountry: 'Origin Location', latitude: locCoords[0], longitude: locCoords[1] },
      destination: { city: recipientCity || 'Destination Hub', stateCountry: 'Destination Area', latitude: locCoords[0] + 2, longitude: locCoords[1] + 2 },
      currentStatus: 'label_created',
      currentStatusTitle: currentStatusText,
      statusMessage: 'Shipment info received by carrier network.',
      estimatedDelivery: estimatedDelivery,
      shippingService: serviceName,
      weight: packageWeight,
      pieces: safePieces,
      progressPercent: 20,
      isDelivered: false,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Live 17TRACK',
      checkpoints: [singleCp],
    };
  }

  // Parse raw events array (reverse chronologically if needed so earliest event is index 0)
  // 17TRACK events array has latest event at index 0, so reverse it for journey timeline
  const chronologicalEvents = [...events].reverse();

  const rawCheckpoints = chronologicalEvents.map((ev: any) => {
    let dateStr = ev.time_iso || ev.a || ev.time || '';
    if (dateStr) {
      try {
        const d = new Date(dateStr);
        dateStr = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ' - ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } catch {
        dateStr = ev.time_raw ? `${ev.time_raw.date} ${ev.time_raw.time || ''}` : dateStr;
      }
    }
    return {
      timestamp: dateStr || 'Scanned',
      location: ev.location || ev.c || ev.z || 'Carrier Hub',
      description: ev.description || ev.z || ev.status || 'Package update recorded',
      status: ev.stage || ev.sub_status || ev.status || 'in_transit',
    };
  });

  const total = rawCheckpoints.length;
  const hydratedCheckpoints: Checkpoint[] = [];

  for (let idx = 0; idx < rawCheckpoints.length; idx++) {
    const raw = rawCheckpoints[idx];
    const statusCat = normalizeStatusCategory(raw.status || raw.description);
    
    let locString = raw.location && raw.location.trim() !== '' ? raw.location.trim() : '';
    if (!locString || locString.toUpperCase() === 'US' || locString.toUpperCase() === 'UNITED STATES' || locString === 'Carrier Hub') {
      if (idx === 0 && shipperCity) {
        locString = shipperCity;
      } else if (hydratedCheckpoints.length > 0) {
        locString = hydratedCheckpoints[hydratedCheckpoints.length - 1].location;
      } else if (shipperCity) {
        locString = shipperCity;
      } else {
        locString = 'Origin Sorting Facility';
      }
    }

    const coords = await geocodeLocation(locString);
    const parts = locString.split(',');
    const city = parts[0]?.trim() || locString;
    const stateCountry = parts.slice(1).join(',').trim() || 'Carrier Network';

    hydratedCheckpoints.push({
      id: `live-cp-${cleanNum}-${idx + 1}`,
      sequence: idx + 1,
      timestamp: raw.timestamp,
      location: locString,
      city: city,
      stateCountry: stateCountry,
      latitude: coords[0],
      longitude: coords[1],
      status: statusCat,
      statusTitle: raw.description.length > 55 ? raw.description.substring(0, 55) + '...' : raw.description,
      details: raw.description,
      facilityType: inferFacilityType(idx, total, statusCat),
    });
  }

  const latestCp = hydratedCheckpoints[hydratedCheckpoints.length - 1];
  const originCp = hydratedCheckpoints[0];
  const destCp = hydratedCheckpoints[hydratedCheckpoints.length - 1];

  // Resolve origin and destination coordinates
  const originCoords = shipperCity ? await geocodeLocation(shipperCity) : [originCp.latitude, originCp.longitude];
  const destCoords = recipientCity ? await geocodeLocation(recipientCity) : [destCp.latitude, destCp.longitude];

  const overallStatus = latestCp.status;
  const carrierObj = CARRIERS[detectedCarrierId] || CARRIERS.fedex;

  const rawFinalPieces = parseInt(miscInfo.pieces || '1', 10);
  const safeFinalPieces = isNaN(rawFinalPieces) || rawFinalPieces < 1 ? 1 : rawFinalPieces;

  return {
    trackingNumber: cleanNum,
    carrier: carrierObj,
    origin: {
      city: shipperCity || originCp.city,
      stateCountry: shipperCity ? '' : originCp.stateCountry,
      latitude: originCoords[0],
      longitude: originCoords[1],
    },
    destination: {
      city: recipientCity || destCp.city,
      stateCountry: recipientCity ? '' : destCp.stateCountry,
      latitude: destCoords[0],
      longitude: destCoords[1],
    },
    currentStatus: overallStatus,
    currentStatusTitle: latestCp.statusTitle,
    statusMessage: latestCp.details,
    estimatedDelivery: estimatedDelivery,
    shippingService: serviceName,
    weight: packageWeight,
    pieces: safeFinalPieces,
    progressPercent: calculateProgress(overallStatus, hydratedCheckpoints.length),
    isDelivered: overallStatus === 'delivered',
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Live 17TRACK',
    checkpoints: hydratedCheckpoints,
  };

}
