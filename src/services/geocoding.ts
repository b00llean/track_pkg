// Known major logistics hubs dictionary for instant offline resolution
const KNOWN_LOGISTICS_HUBS: Record<string, [number, number]> = {
  // UPS Hubs
  'louisville, ky': [38.1743, -85.736], // UPS Worldport
  'chicago, il': [41.8781, -87.6298],
  'dallas, tx': [32.7767, -96.797],
  'atlanta, ga': [33.749, -84.388],
  'seattle, wa': [47.6062, -122.3321],
  'new york, ny': [40.7128, -74.006],
  'los angeles, ca': [34.0522, -118.2437],
  'denver, co': [39.7392, -104.9903],
  'miami, fl': [25.7617, -80.1918],

  // FedEx Hubs
  'memphis, tn': [35.1495, -90.049], // FedEx Superhub
  'indianapolis, in': [39.7684, -86.1581], // FedEx National Hub
  'newark, nj': [40.7357, -74.1724],
  'oakland, ca': [37.8044, -122.2712],
  'anchorage, ak': [61.2181, -149.9003],

  // USPS Hubs
  'jersey city, nj': [40.7178, -74.0431], // Jersey City NDC
  'washington, dc': [38.9072, -77.0369],
  'des plaines, il': [42.0334, -87.8834],

  // International DHL Hubs
  'frankfurt, germany': [50.1109, 8.6821], // DHL European Hub
  'leipzig, germany': [51.3397, 12.3731],
  'hong kong': [22.3193, 114.1694],
  'cincinnati, oh': [39.1031, -84.512], // DHL Americas Hub
};

const geocodeCache = new Map<string, [number, number]>();

/**
 * Resolve location text to [latitude, longitude]
 */
export async function geocodeLocation(locationStr: string): Promise<[number, number]> {
  const normalized = locationStr.trim().toLowerCase();

  // Check static lookup table first
  for (const [key, coords] of Object.entries(KNOWN_LOGISTICS_HUBS)) {
    if (normalized.includes(key)) {
      return coords;
    }
  }

  // Check cache
  if (geocodeCache.has(normalized)) {
    return geocodeCache.get(normalized)!;
  }

  // Live Nominatim Geocoding API fallback
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationStr)}&limit=1`,
      { headers: { 'User-Agent': 'TrackPkgVisualizer/1.0' } }
    );
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        geocodeCache.set(normalized, coords);
        return coords;
      }
    }
  } catch (err) {
    console.warn('Geocoding API unavailable, using fallback calculation:', err);
  }

  // Deterministic fallback generator if API fails
  let hash = 0;
  for (let i = 0; i < locationStr.length; i++) {
    hash = locationStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = 35.0 + ((hash % 150) / 10.0);
  const lng = -100.0 + (((hash >> 2) % 350) / 10.0);
  return [lat, lng];
}
