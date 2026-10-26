import { Checkpoint, LocationGroup } from '../types/tracking';

/**
 * Utility functions for date parsing, geospatial distance validation,
 * and transit duration calculation across map and timeline components.
 */

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

// US State standard/daylight timezone offsets (approximate UTC offset in hours)
const US_STATE_TZ_OFFSETS: Record<string, number> = {
  ak: -8,
  hi: -10,
  wa: -7,
  or: -7,
  ca: -7,
  nv: -7,
  az: -7,
  id: -6,
  mt: -6,
  wy: -6,
  ut: -6,
  co: -6,
  nm: -6,
  nd: -5,
  sd: -5,
  ne: -5,
  ks: -5,
  ok: -5,
  tx: -5,
  mn: -5,
  ia: -5,
  mo: -5,
  ar: -5,
  la: -5,
  wi: -5,
  il: -5,
  ms: -5,
  al: -5,
  tn: -5,
  mi: -4,
  in: -4,
  oh: -4,
  ky: -4,
  ga: -4,
  fl: -4,
  sc: -4,
  nc: -4,
  va: -4,
  wv: -4,
  md: -4,
  de: -4,
  pa: -4,
  nj: -4,
  ny: -4,
  ct: -4,
  ri: -4,
  ma: -4,
  vt: -4,
  nh: -4,
  me: -4,
  dc: -4,
};

/**
 * Calculate great-circle distance (in km) between two lat/lng points using the Haversine formula.
 */
export function calculateHaversineDistanceKm(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Infer approximate UTC timezone offset (in hours) from checkpoint metadata or coordinates.
 */
function inferTimezoneOffsetHours(cp?: Partial<Checkpoint>): number | null {
  if (!cp) return null;

  // 1. Check explicit ISO offset (e.g. "2026-10-23T04:00:00-08:00")
  if (cp.timeIso) {
    const tzMatch = cp.timeIso.match(/([+-])(\d{2}):?(\d{2})$/);
    if (tzMatch) {
      const sign = tzMatch[1] === '-' ? -1 : 1;
      return sign * (parseInt(tzMatch[2], 10) + parseInt(tzMatch[3], 10) / 60);
    }
    if (cp.timeIso.endsWith('Z')) return 0;
  }

  // 2. Check location / stateCountry strings
  const loc = `${cp.city || ''} ${cp.stateCountry || ''} ${cp.location || ''}`.toLowerCase();
  if (loc.includes('hong kong') || loc.includes('china') || loc.includes('shenzhen') || loc.includes('shanghai') || loc.includes('taiwan')) {
    return 8;
  }
  if (loc.includes('japan') || loc.includes('tokyo') || loc.includes('korea') || loc.includes('incheon')) {
    return 9;
  }
  if (loc.includes('germany') || loc.includes('frankfurt') || loc.includes('leipzig') || loc.includes('cologne')) {
    return 2;
  }
  if (loc.includes('uk') || loc.includes('united kingdom') || loc.includes('london')) {
    return 1;
  }
  if (loc.includes('anchorage') || loc.includes('alaska')) {
    return -8;
  }
  if (loc.includes('louisville') || loc.includes('kentucky')) {
    return -4;
  }

  const parts = (cp.location || cp.stateCountry || '').split(',').map((p) => p.trim().toLowerCase());
  for (const part of parts) {
    if (part.length === 2 && US_STATE_TZ_OFFSETS[part] !== undefined) {
      return US_STATE_TZ_OFFSETS[part];
    }
  }

  // 3. Fallback to longitude-based solar timezone approximation
  if (typeof cp.longitude === 'number' && !isNaN(cp.longitude)) {
    return Math.round(cp.longitude / 15);
  }

  return null;
}

/**
 * Parse a wall-clock date/time string into timezone-neutral epoch milliseconds (treating components as UTC).
 */
function parseWallClockMs(str?: string, fallbackYear?: number): number | null {
  if (!str) return null;
  const s = str.trim();
  if (!s || s.toLowerCase() === 'scanned') return null;

  // Format 1: ISO-like "2026-10-23T04:00:00..." or "2026-10-23 04:00:00"
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const hour = parseInt(isoMatch[4], 10);
    const min = parseInt(isoMatch[5], 10);
    const sec = isoMatch[6] ? parseInt(isoMatch[6], 10) : 0;
    return Date.UTC(year, month, day, hour, min, sec);
  }

  // Format 2: Display string "Oct 23 - 04:00 AM" or "Aug 06, 2026 - 02:21 AM"
  const displayMatch = s.match(
    /([A-Za-z]{3})[a-z]*\s+(\d{1,2})(?:,?\s*(\d{4}))?[\s\-]+(\d{1,2}):(\d{2})\s*(AM|PM)?/i
  );
  if (displayMatch) {
    const monthIdx = MONTH_MAP[displayMatch[1].toLowerCase().slice(0, 3)];
    if (monthIdx !== undefined) {
      const day = parseInt(displayMatch[2], 10);
      const year = displayMatch[3] ? parseInt(displayMatch[3], 10) : fallbackYear || new Date().getFullYear();
      let hour = parseInt(displayMatch[4], 10);
      const min = parseInt(displayMatch[5], 10);
      const ampm = displayMatch[6]?.toUpperCase();
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      return Date.UTC(year, monthIdx, day, hour, min, 0);
    }
  }

  // Format 3: Fallback generic Date parse
  const cleaned = s.replace('-', '').trim();
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d.getTime();
}

/**
 * Parse true UTC epoch milliseconds from a Checkpoint or timestamp string.
 */
function parseUtcEpochMs(cp: Partial<Checkpoint>, fallbackYear?: number): number | null {
  if (cp.timeUtc) {
    const ms = Date.parse(cp.timeUtc);
    if (!isNaN(ms)) return ms;
  }
  if (cp.timeIso) {
    const ms = Date.parse(cp.timeIso);
    if (!isNaN(ms)) return ms;
  }
  if (cp.timestamp) {
    const cleaned = cp.timestamp.replace('-', '').trim();
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) {
      if (fallbackYear && d.getFullYear() === 2001) {
        d.setFullYear(fallbackYear);
      }
      return d.getTime();
    }
  }
  return null;
}

function isLocationGroup(item: unknown): item is LocationGroup {
  return Boolean(item && typeof item === 'object' && 'checkpoints' in item && 'latestCheckpoint' in item);
}

function toCheckpointObject(item: string | Checkpoint | LocationGroup, isDeparture: boolean): Partial<Checkpoint> {
  if (typeof item === 'string') {
    return { timestamp: item };
  }
  if (isLocationGroup(item)) {
    if (isDeparture) {
      // Prefer the latest explicit departure scan at the origin facility if present
      for (let i = item.checkpoints.length - 1; i >= 0; i--) {
        const cp = item.checkpoints[i];
        const text = `${cp.statusTitle || ''} ${cp.details || ''}`.toLowerCase();
        if (text.includes('departed') || text.includes('left')) {
          return cp;
        }
      }
      return item.latestCheckpoint;
    } else {
      // Prefer the earliest arrival/physical scan at the destination facility
      for (let i = 0; i < item.checkpoints.length; i++) {
        const cp = item.checkpoints[i];
        const text = `${cp.statusTitle || ''} ${cp.details || ''}`.toLowerCase();
        if (text.includes('arrived') || text.includes('delivered') || text.includes('picked up')) {
          return cp;
        }
      }
      return item.checkpoints[0] || item.latestCheckpoint;
    }
  }
  return item;
}

function formatDurationMs(diffMs: number): string {
  const totalMins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h transit` : `${days}d transit`;
  } else if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m transit`;
  } else if (hours > 0) {
    return `${hours}h transit`;
  } else if (mins > 0) {
    return `${mins}m transit`;
  }
  return 'In transit';
}

/**
 * Calculates accurate transit duration between two checkpoints or location groups.
 * Accounts for cross-timezone flights and corrects carrier hub timezone anomalies
 * (e.g., when a departure scan is logged in destination hub time rather than local facility time)
 * by validating against the physical great-circle distance between hubs.
 */
export function calculateTransitDuration(
  from: string | Checkpoint | LocationGroup,
  to: string | Checkpoint | LocationGroup
): string {
  try {
    const cp1 = toCheckpointObject(from, true);
    const cp2 = toCheckpointObject(to, false);

    // Extract reference year if available from rawTimestamp or timeIso
    const yearMatch = (cp2.rawTimestamp || cp2.timeIso || cp1.rawTimestamp || cp1.timeIso || '').match(/^(\d{4})/);
    const refYear = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

    // Calculate physical great-circle distance between the two facilities
    const distanceKm = calculateHaversineDistanceKm(cp1.latitude, cp1.longitude, cp2.latitude, cp2.longitude);

    // Maximum realistic average facility-to-facility speed of air/ground cargo is ~950 km/h (~590 mph).
    // Any duration shorter than this over long distances (>100 km) is physically impossible
    // and indicates a timezone tagging discrepancy on one of the scans.
    const minPhysicalMs =
      distanceKm > 100 ? (distanceKm / 950) * 3600 * 1000 : 60 * 1000;

    const utcMs1 = parseUtcEpochMs(cp1, refYear);
    const utcMs2 = parseUtcEpochMs(cp2, refYear);
    const utcDiffMs = utcMs1 !== null && utcMs2 !== null ? utcMs2 - utcMs1 : null;

    const rawMs1 = parseWallClockMs(cp1.rawTimestamp || cp1.timestamp, refYear);
    const rawMs2 = parseWallClockMs(cp2.rawTimestamp || cp2.timestamp, refYear);
    const rawDiffMs = rawMs1 !== null && rawMs2 !== null ? rawMs2 - rawMs1 : null;

    // 1. Primary: Timezone-aware UTC difference if physically possible
    if (utcDiffMs !== null && utcDiffMs >= minPhysicalMs) {
      return formatDurationMs(utcDiffMs);
    }

    // 2. Secondary: Same-timezone wall-clock difference if physically possible
    // Handles carrier hub scans (such as UPS Anchorage -> Louisville Worldport) where
    // the departure scan is recorded in the destination hub's timezone (-04:00) rather than local time (-08:00).
    if (rawDiffMs !== null && rawDiffMs >= minPhysicalMs) {
      return formatDurationMs(rawDiffMs);
    }

    // 3. Tertiary: If timestamps were pre-shifted into browser local time (legacy cache or imported text),
    // restore the timezone offset delta between origin and destination facilities.
    const tz1 = inferTimezoneOffsetHours(cp1);
    const tz2 = inferTimezoneOffsetHours(cp2);
    if (tz1 !== null && tz2 !== null && tz1 !== tz2) {
      const tzDeltaMs = Math.abs(tz2 - tz1) * 3600 * 1000;
      const baseDiff = utcDiffMs !== null && utcDiffMs > 0 ? utcDiffMs : rawDiffMs !== null && rawDiffMs > 0 ? rawDiffMs : null;
      if (baseDiff !== null && baseDiff + tzDeltaMs >= minPhysicalMs) {
        return formatDurationMs(baseDiff + tzDeltaMs);
      }
    }

    // 4. Fallback: If both positive diffs exist but distance coordinates weren't available or had minor variance
    if (utcDiffMs !== null && utcDiffMs > 0 && distanceKm <= 100) {
      return formatDurationMs(utcDiffMs);
    }
    if (rawDiffMs !== null && rawDiffMs > 0 && distanceKm <= 100) {
      return formatDurationMs(rawDiffMs);
    }

    // 5. Fallback for non-zero diffs when no coordinates are present
    const bestPositive = Math.max(utcDiffMs ?? 0, rawDiffMs ?? 0);
    if (bestPositive > 0) {
      return formatDurationMs(bestPositive);
    }

    if (utcDiffMs !== null && utcDiffMs !== 0 && distanceKm === 0) {
      return formatDurationMs(Math.abs(utcDiffMs));
    }
  } catch (e) {
    console.warn('Duration parse error:', e);
  }
  return 'In transit';
}

