import { PackageData } from '../types/tracking';
import { fetchLivePackageTracking, getApiSettings } from './liveTrackingService';
import { getCachedPackage } from './apiCache';

/**
 * Main tracking fetcher function.
 * Processes live package tracking data from carrier APIs with 5-minute caching.
 */
export async function fetchPackageTracking(
  trackingNumber: string,
  forceRefresh: boolean = false
): Promise<PackageData> {
  const cleanNum = trackingNumber.trim().toUpperCase().replace(/\s+/g, '');

  // Check 5-minute cache before making any external API calls
  if (!forceRefresh) {
    const cached = getCachedPackage(cleanNum);
    if (cached) {
      return cached;
    }
  }

  const apiSettings = getApiSettings();

  if (!apiSettings.apiKey) {
    throw new Error(
      '17TRACK API Key (17token) is required. Please click the Settings gear icon or enter your key to enable live package tracking.'
    );
  }

  return await fetchLivePackageTracking(cleanNum, apiSettings, { forceRefresh });
}
