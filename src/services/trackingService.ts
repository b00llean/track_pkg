import { PackageData } from '../types/tracking';
import { fetchLivePackageTracking, getApiSettings } from './liveTrackingService';

/**
 * Main tracking fetcher function.
 * Processes 100% live package tracking data from carrier APIs.
 */
export async function fetchPackageTracking(trackingNumber: string): Promise<PackageData> {
  const cleanNum = trackingNumber.trim().toUpperCase().replace(/\s+/g, '');
  const apiSettings = getApiSettings();

  if (!apiSettings.apiKey) {
    throw new Error(
      '17TRACK API Key (17token) is required. Please click the Settings gear icon or enter your key to enable live package tracking.'
    );
  }

  return await fetchLivePackageTracking(cleanNum, apiSettings);
}
