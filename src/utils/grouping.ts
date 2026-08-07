import { Checkpoint, LocationGroup } from '../types/tracking';

/**
 * Normalizes location key for grouping checkpoints occurring at the same geographical location.
 * Converts strings to lowercase and formats as "city|stateCountry" or raw location string.
 * Example: "ARCADIA, CA, USA" -> "arcadia|ca, usa"
 */
export function getLocationKey(cp: Checkpoint): string {
  const city = (cp.city || '').trim().toLowerCase();
  const stateCountry = (cp.stateCountry || '').trim().toLowerCase();
  if (city || stateCountry) {
    return `${city}|${stateCountry}`;
  }
  return (cp.location || '').trim().toLowerCase();
}

/**
 * Sanitizes location keys for safe HTML DOM element ID generation.
 * Replaces non-alphanumeric characters with underscores to prevent selector breaks.
 */
function sanitizeIdString(key: string): string {
  return key.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').toLowerCase();
}

/**
 * Groups consecutive checkpoints occurring at the same location hub.
 * Reduces visual clutter on maps and timelines by consolidating repeated facility events.
 */
export function groupCheckpointsByLocation(checkpoints: Checkpoint[]): LocationGroup[] {
  if (!checkpoints || checkpoints.length === 0) {
    return [];
  }

  const groups: LocationGroup[] = [];
  let currentGroup: LocationGroup | null = null;

  checkpoints.forEach((cp) => {
    const locKey = getLocationKey(cp);
    const safeIdKey = sanitizeIdString(locKey);

    if (!currentGroup || currentGroup.locationKey !== locKey) {
      // Create new location group if location differs from current group
      currentGroup = {
        id: `loc-group-${safeIdKey}-${groups.length + 1}`,
        locationKey: locKey,
        city: cp.city || cp.location || 'Unknown Location',
        stateCountry: cp.stateCountry || '',
        locationName: cp.location || cp.city || 'Facility',
        latitude: cp.latitude,
        longitude: cp.longitude,
        checkpoints: [cp],
        latestCheckpoint: cp,
        facilityType: cp.facilityType,
        hasWeatherAlert: Boolean(cp.weatherAlert),
      };
      groups.push(currentGroup);
    } else {
      // Append checkpoint to existing location group
      currentGroup.checkpoints.push(cp);
      currentGroup.latestCheckpoint = cp;
      if (cp.weatherAlert) {
        currentGroup.hasWeatherAlert = true;
      }
      // Escalate facilityType priority if destination or delivery station status is reached
      if (cp.facilityType === 'destination' || cp.facilityType === 'delivery_station') {
        currentGroup.facilityType = cp.facilityType;
      }
    }
  });

  return groups;
}
