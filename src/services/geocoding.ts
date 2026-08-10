// Known US State Centroids for precise state-level fallback positioning
const US_STATE_CENTROIDS: Record<string, [number, number]> = {
  al: [32.806671, -86.79113],
  ak: [61.370716, -152.404419],
  az: [34.048927, -111.093731],
  ar: [34.969704, -92.373123],
  ca: [36.778261, -119.417932],
  co: [39.550051, -105.782067],
  ct: [41.603221, -73.087749],
  de: [38.910832, -75.52767],
  fl: [27.664827, -81.515754],
  ga: [32.165622, -82.900075],
  hi: [19.898682, -155.665857],
  id: [44.068202, -114.742041],
  il: [40.633125, -89.398528],
  in: [40.267194, -86.134902],
  ia: [41.878003, -93.097702],
  ks: [38.5266, -96.726486],
  ky: [37.839333, -84.270018],
  la: [31.244823, -92.145024],
  me: [45.253783, -69.445469],
  md: [39.045755, -76.641271],
  ma: [42.407211, -71.382437],
  mi: [44.314844, -85.602364],
  mn: [46.729553, -94.6859],
  ms: [32.741646, -89.678696],
  mo: [37.964253, -91.831833],
  mt: [46.879682, -110.362566],
  ne: [41.492537, -99.901813],
  nv: [38.80261, -116.419389],
  nh: [43.193852, -71.572395],
  nj: [40.058324, -74.405661],
  nm: [34.51994, -105.87009],
  ny: [40.7128, -74.006],
  nc: [35.759573, -79.0193],
  nd: [47.551493, -101.002012],
  oh: [40.417287, -82.907123],
  ok: [35.565342, -96.928917],
  or: [43.804133, -120.554201],
  pa: [41.203322, -77.194525],
  ri: [41.580095, -71.477429],
  sc: [33.836081, -81.163725],
  sd: [43.969515, -99.901813],
  tn: [35.517491, -86.580447],
  tx: [31.968599, -99.901813],
  ut: [39.32098, -111.093731],
  vt: [44.558803, -72.577841],
  va: [37.431573, -78.656894],
  wa: [47.751074, -120.740135],
  wv: [38.597626, -80.454903],
  wi: [43.784439, -88.787868],
  wy: [43.075968, -107.290284],
  dc: [38.9072, -77.0369],
};

// Known major logistics hubs dictionary for instant offline resolution
const KNOWN_LOGISTICS_HUBS: Record<string, [number, number]> = {
  // California
  'arcadia, ca': [34.1397, -118.0353],
  'arcadia': [34.1397, -118.0353],
  'barstow, ca': [34.8958, -117.0173],
  'barstow': [34.8958, -117.0173],
  'los angeles, ca': [34.0522, -118.2437],
  'oakland, ca': [37.8044, -122.2712],
  'san francisco, ca': [37.7749, -122.4194],
  'san diego, ca': [32.7157, -117.1611],
  'sacramento, ca': [38.5816, -121.4944],
  'san jose, ca': [37.3382, -121.8863],
  'fresno, ca': [36.7468, -119.7726],
  'ontario, ca': [34.0633, -117.6509],
  'fontana, ca': [34.0922, -117.4350],
  'industry, ca': [34.0197, -117.9587],
  'bloomington, ca': [34.0703, -117.3962],
  'commerce, ca': [34.0006, -118.1598],
  'rialto, ca': [34.1064, -117.3703],

  // Arizona
  'joseph city, az': [34.9575, -110.3340],
  'joseph city': [34.9575, -110.3340],
  'phoenix, az': [33.4484, -112.0740],
  'tucson, az': [32.2226, -110.9747],
  'flagstaff, az': [35.1983, -111.6513],
  'kingman, az': [35.1894, -114.0530],
  'winslow, az': [35.0242, -110.6974],
  'holbrook, az': [34.9022, -110.1585],

  // New Mexico
  'albuquerque, nm': [35.0844, -106.6504],
  'gallup, nm': [35.5281, -108.7426],
  'tucumcari, nm': [35.1717, -103.7250],
  'santa fe, nm': [35.6870, -105.9378],

  // Texas
  'dallas, tx': [32.7767, -96.7970],
  'fort worth, tx': [32.7555, -97.3308],
  'houston, tx': [29.7604, -95.3698],
  'san antonio, tx': [29.4241, -98.4936],
  'austin, tx': [30.2672, -97.7431],
  'el paso, tx': [31.7619, -106.4850],
  'amarillo, tx': [35.2220, -101.8313],
  'lubbock, tx': [33.5779, -101.8552],

  // Virginia
  'ashburn, va': [39.0438, -77.4874],
  'ashburn': [39.0438, -77.4874],
  'dulles, va': [38.9531, -77.4565],
  'richmond, va': [37.5407, -77.4360],
  'roanoke, va': [37.2710, -79.9414],
  'norfolk, va': [36.8508, -76.2859],
  'alexandria, va': [38.8048, -77.0469],

  // Kentucky & Tennessee
  'louisville, ky': [38.1743, -85.7360], // UPS Worldport
  'memphis, tn': [35.1495, -90.0490], // FedEx Superhub
  'nashville, tn': [36.1627, -86.7816],
  'knoxville, tn': [35.9606, -83.9207],

  // Midwest
  'chicago, il': [41.8781, -87.6298],
  'des plaines, il': [42.0334, -87.8834],
  'indianapolis, in': [39.7684, -86.1581], // FedEx National Hub
  'cincinnati, oh': [39.1031, -84.5120], // DHL Americas Hub
  'columbus, oh': [39.9612, -82.9988],
  'st. louis, mo': [38.6270, -90.1994],
  'kansas city, mo': [39.0997, -94.5786],

  // East Coast
  'new york, ny': [40.7128, -74.0060],
  'newark, nj': [40.7357, -74.1724],
  'jersey city, nj': [40.7178, -74.0431],
  'philadelphia, pa': [39.9526, -75.1652],
  'pittsburgh, pa': [40.4406, -79.9959],
  'washington, dc': [38.9072, -77.0369],
  'atlanta, ga': [33.7490, -84.3880],
  'charlotte, nc': [35.2271, -80.8431],
  'miami, fl': [25.7617, -80.1918],
  'orlando, fl': [28.5383, -81.3792],

  // West & Northwest
  'denver, co': [39.7392, -104.9903],
  'salt lake city, ut': [40.7608, -111.8910],
  'seattle, wa': [47.6062, -122.3321],
  'portland, or': [45.5152, -122.6784],
  'anchorage, ak': [61.2181, -149.9003],

  // International DHL & Global Hubs
  'frankfurt, germany': [50.1109, 8.6821],
  'leipzig, germany': [51.3397, 12.3731],
  'hong kong': [22.3193, 114.1694],
  'tokyo, japan': [35.6762, 139.6503],
  'london, uk': [51.5074, -0.1278],
};

const geocodeCache = new Map<string, [number, number]>();

/**
 * Clean raw location string into a normalized lookup key
 */
function normalizeLocationString(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b(us|usa|united states)\b/gi, '')
    .replace(/\b\d{5}(-\d{4})?\b/g, '') // remove zip codes
    .replace(/[^\w\s,]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Extract US state code from normalized location string if present
 */
function extractStateCode(str: string): string | null {
  const parts = str.split(',').map((p) => p.trim().toLowerCase());
  for (const part of parts) {
    if (part.length === 2 && US_STATE_CENTROIDS[part]) {
      return part;
    }
  }
  const words = str.toLowerCase().split(/\s+/);
  for (const word of words) {
    if (word.length === 2 && US_STATE_CENTROIDS[word]) {
      return word;
    }
  }
  return null;
}

/**
 * Resolve location text to [latitude, longitude]
 */
export async function geocodeLocation(locationStr: string): Promise<[number, number]> {
  if (!locationStr || locationStr.trim() === '' || locationStr.trim().toUpperCase() === 'US') {
    return [39.8283, -98.5795]; // Geographical center of US
  }

  const rawLower = locationStr.trim().toLowerCase();
  const normalized = normalizeLocationString(locationStr);

  // 1. Check static logistics hubs lookup table
  for (const [key, coords] of Object.entries(KNOWN_LOGISTICS_HUBS)) {
    if (rawLower.includes(key) || normalized.includes(key)) {
      return coords;
    }
  }

  // 2. Check cache
  if (geocodeCache.has(normalized)) {
    return geocodeCache.get(normalized)!;
  }

  // 3. Try OpenStreetMap Nominatim Geocoding via local proxy / direct
  const searchQueries = [
    locationStr,
    normalized,
  ];

  for (const query of searchQueries) {
    if (!query) continue;
    try {
      const proxyUrl = `/api/nominatim/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const directUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

      let response: Response | null = null;
      try {
        response = await fetch(proxyUrl);
      } catch {
        response = await fetch(directUrl, { headers: { 'User-Agent': 'TrackPkgVisualizer/1.0' } });
      }

      if (response && response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          geocodeCache.set(normalized, coords);
          return coords;
        }
      }
    } catch (err) {
      console.warn(`Geocoding fetch error for "${query}":`, err);
    }
  }

  // 4. US State Centroid fallback if city not resolved
  const stateCode = extractStateCode(locationStr);
  if (stateCode && US_STATE_CENTROIDS[stateCode]) {
    const coords = US_STATE_CENTROIDS[stateCode];
    geocodeCache.set(normalized, coords);
    return coords;
  }

  // 5. Regional Hash Fallback (kept strictly in US bounding box)
  let hash = 0;
  for (let i = 0; i < locationStr.length; i++) {
    hash = locationStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = 33.0 + (Math.abs(hash) % 120) / 10.0;
  const lng = -118.0 + (Math.abs(hash >> 2) % 400) / 10.0;
  const fallbackCoords: [number, number] = [lat, lng];
  geocodeCache.set(normalized, fallbackCoords);
  return fallbackCoords;
}

