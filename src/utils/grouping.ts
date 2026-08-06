import { Checkpoint, LocationGroup } from '../types/tracking';

/**
 * Normalizes location key for grouping (e.g. "ARCADIA, CA, USA" -> "arcadia, ca, usa")
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
 * Groups consecutive checkpoints that occur at the same location.
 */
export function groupCheckpointsByLocation(checkpoints: Checkpoint[]): LocationGroup[] {
  if (!checkpoints || checkpoints.length === 0) {
    return [];
  }

  const groups: LocationGroup[] = [];
  let currentGroup: LocationGroup | null = null;

  checkpoints.forEach((cp) => {
    const locKey = getLocationKey(cp);

    if (!currentGroup || currentGroup.locationKey !== locKey) {
      // Start a new location group
      currentGroup = {
        id: `loc-group-${locKey}-${groups.length + 1}`,
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
      // Add checkpoint to current group
      currentGroup.checkpoints.push(cp);
      currentGroup.latestCheckpoint = cp;
      if (cp.weatherAlert) {
        currentGroup.hasWeatherAlert = true;
      }
      // Prefer destination/delivery facility types if present
      if (cp.facilityType === 'destination' || cp.facilityType === 'delivery_station') {
        currentGroup.facilityType = cp.facilityType;
      }
    }
  });

  return groups;
}
