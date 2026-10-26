import type { PackageData } from '../types/tracking';

/**
 * Default cache Time-To-Live: 5 minutes (300,000 ms).
 * "there is no reason to make same api calls more frequently"
 */
export const API_CACHE_TTL_MS = 5 * 60 * 1000;

export const API_CACHE_STORAGE_KEY = 'track_pkg_api_cache_v1';
export const GENERIC_API_CACHE_STORAGE_KEY = 'track_pkg_generic_api_cache_v1';
const MAX_CACHE_ENTRIES = 50;

export interface CacheEntry<T> {
  data: T;
  timestamp: number; // Unix timestamp (ms) when cached
  expiresAt: number; // Unix timestamp (ms) when entry expires
}

export interface CacheMetadata {
  cachedAt: number;
  expiresAt: number;
  ageMs: number;
  remainingMs: number;
  isExpired: boolean;
}

// In-memory cache layer for ultra-fast access
const memoryPackageCache = new Map<string, CacheEntry<PackageData>>();
const memoryGenericCache = new Map<string, CacheEntry<any>>();

/**
 * Standardize tracking number as cache key: trimmed, uppercase, no whitespace.
 */
export function normalizeTrackingKey(trackingNumber: string): string {
  if (!trackingNumber) return '';
  return trackingNumber.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Read the persistent localStorage cache map safely.
 */
function readPersistentPackageCache(): Record<string, CacheEntry<PackageData>> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }

  try {
    const raw = localStorage.getItem(API_CACHE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to parse persistent package cache from localStorage:', err);
  }
  return {};
}

/**
 * Write persistent cache to localStorage safely, pruning expired items.
 */
function writePersistentPackageCache(cache: Record<string, CacheEntry<PackageData>>): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const now = Date.now();
    const cleanEntries: [string, CacheEntry<PackageData>][] = [];

    for (const [key, entry] of Object.entries(cache)) {
      if (entry && entry.expiresAt > now) {
        cleanEntries.push([key, entry]);
      }
    }

    // Sort by timestamp desc and enforce maximum entry count
    cleanEntries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    const trimmed = Object.fromEntries(cleanEntries.slice(0, MAX_CACHE_ENTRIES));

    localStorage.setItem(API_CACHE_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to write package cache to localStorage (quota exceeded?):', err);
  }
}

/**
 * Retrieve cached PackageData for a given tracking number if less than 5 minutes old.
 * Returns null if not cached or if the 5-minute TTL has elapsed.
 */
export function getCachedPackage(trackingNumber: string): PackageData | null {
  const key = normalizeTrackingKey(trackingNumber);
  if (!key) return null;

  const now = Date.now();

  // 1. Check in-memory cache first
  const memoryEntry = memoryPackageCache.get(key);
  if (memoryEntry) {
    if (now < memoryEntry.expiresAt) {
      return {
        ...memoryEntry.data,
        isFromCache: true,
        cachedAt: memoryEntry.timestamp,
      };
    } else {
      memoryPackageCache.delete(key);
    }
  }

  // 2. Check localStorage persistent cache
  const persistent = readPersistentPackageCache();
  const diskEntry = persistent[key];
  if (diskEntry) {
    if (now < diskEntry.expiresAt) {
      // Repopulate in-memory cache
      memoryPackageCache.set(key, diskEntry);
      return {
        ...diskEntry.data,
        isFromCache: true,
        cachedAt: diskEntry.timestamp,
      };
    } else {
      // Clean up expired entry
      delete persistent[key];
      writePersistentPackageCache(persistent);
    }
  }

  return null;
}

/**
 * Store PackageData in cache with 5-minute TTL (or custom TTL).
 */
export function setCachedPackage(
  trackingNumber: string,
  data: PackageData,
  ttlMs: number = API_CACHE_TTL_MS
): void {
  const key = normalizeTrackingKey(trackingNumber);
  if (!key || !data) return;

  const now = Date.now();
  const expiresAt = now + ttlMs;

  // Clean data copy (strip runtime cache flags before storage)
  const cleanData: PackageData = {
    ...data,
    isFromCache: false,
    cachedAt: now,
  };

  const entry: CacheEntry<PackageData> = {
    data: cleanData,
    timestamp: now,
    expiresAt,
  };

  // 1. Update in-memory cache
  memoryPackageCache.set(key, entry);

  // 2. Update persistent localStorage
  const persistent = readPersistentPackageCache();
  persistent[key] = entry;
  writePersistentPackageCache(persistent);
}

/**
 * Invalidate cached package for a given tracking number (e.g. on manual refresh).
 */
export function removeCachedPackage(trackingNumber: string): void {
  const key = normalizeTrackingKey(trackingNumber);
  if (!key) return;

  memoryPackageCache.delete(key);

  const persistent = readPersistentPackageCache();
  if (persistent[key]) {
    delete persistent[key];
    writePersistentPackageCache(persistent);
  }
}

/**
 * Clear all cached packages (in-memory and localStorage).
 */
export function clearAllPackageCache(): void {
  memoryPackageCache.clear();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(API_CACHE_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Failed to clear package cache from localStorage:', err);
  }
}

/**
 * Get cache entry metadata (age, remaining time, expiration) for UI display.
 */
export function getPackageCacheMeta(trackingNumber: string): CacheMetadata | null {
  const key = normalizeTrackingKey(trackingNumber);
  if (!key) return null;

  const now = Date.now();
  let entry = memoryPackageCache.get(key);

  if (!entry) {
    const persistent = readPersistentPackageCache();
    entry = persistent[key];
  }

  if (!entry) return null;

  const remainingMs = Math.max(0, entry.expiresAt - now);
  const ageMs = Math.max(0, now - entry.timestamp);

  return {
    cachedAt: entry.timestamp,
    expiresAt: entry.expiresAt,
    ageMs,
    remainingMs,
    isExpired: now >= entry.expiresAt,
  };
}

/**
 * Generic API caching utilities for arbitrary HTTP/JSON responses (5 min TTL).
 */
export function getCachedApi<T>(key: string): T | null {
  if (!key) return null;
  const now = Date.now();

  const mem = memoryGenericCache.get(key);
  if (mem) {
    if (now < mem.expiresAt) {
      return mem.data as T;
    }
    memoryGenericCache.delete(key);
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(`${GENERIC_API_CACHE_STORAGE_KEY}_${key}`);
      if (raw) {
        const parsed = JSON.parse(raw) as CacheEntry<T>;
        if (parsed && now < parsed.expiresAt) {
          memoryGenericCache.set(key, parsed);
          return parsed.data;
        } else {
          localStorage.removeItem(`${GENERIC_API_CACHE_STORAGE_KEY}_${key}`);
        }
      }
    } catch {}
  }

  return null;
}

export function setCachedApi<T>(key: string, data: T, ttlMs: number = API_CACHE_TTL_MS): void {
  if (!key || data === undefined) return;
  const now = Date.now();
  const entry: CacheEntry<T> = {
    data,
    timestamp: now,
    expiresAt: now + ttlMs,
  };

  memoryGenericCache.set(key, entry);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(`${GENERIC_API_CACHE_STORAGE_KEY}_${key}`, JSON.stringify(entry));
    } catch {}
  }
}
