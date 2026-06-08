import { CacheEntry, CacheOptions } from '../types/index.js';
import { logger } from '../utils/logger.js';

interface SizedEntry<T> extends CacheEntry<T> {
  size: number;
}

export class MemoryCache {
  private cache = new Map<string, SizedEntry<unknown>>();
  private currentSize = 0;
  private readonly defaultTtl: number;
  private readonly maxSize: number;
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(options: CacheOptions = {}) {
    this.defaultTtl = options.ttl ?? 3600 * 1000; // 1 hour default in milliseconds
    this.maxSize = options.maxSize ?? 104857600; // 100MB default

    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  set(key: string, value: unknown, ttl?: number): void {
    const actualTtl = ttl ?? this.defaultTtl;
    const timestamp = Date.now();
    const entrySize = estimateEntrySize(key, value);

    const entry: SizedEntry<unknown> = {
      data: value,
      timestamp,
      ttl: actualTtl,
      size: entrySize,
    };

    // Drop the prior version of this key first, so we account for the
    // overwrite delta correctly (and don't evict ourselves).
    this.removeEntry(key);

    // Evict in a loop: one round may not free enough for a large entry.
    while (this.cache.size > 0 && this.currentSize + entrySize > this.maxSize) {
      if (!this.evictLeastRecentlyUsed()) {
        break;
      }
    }

    this.cache.set(key, entry);
    this.currentSize += entrySize;
    logger.debug(`Cache set: ${key} (TTL: ${actualTtl}ms)`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- T narrows the unknown stored value at the call site.
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as SizedEntry<T> | undefined;

    if (!entry) {
      logger.debug(`Cache miss: ${key}`);
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.removeEntry(key);
      logger.debug(`Cache expired: ${key}`);
      return null;
    }

    // Update timestamp for LRU
    entry.timestamp = now;
    logger.debug(`Cache hit: ${key}`);
    return entry.data;
  }

  delete(key: string): boolean {
    const removed = this.removeEntry(key);
    if (removed) {
      logger.debug(`Cache deleted: ${key}`);
    }
    return removed;
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
    logger.info('Cache cleared');
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.removeEntry(key);
      return false;
    }

    return true;
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): { size: number; memoryUsage: number; hitRate: number } {
    return {
      size: this.cache.size,
      memoryUsage: this.currentSize,
      hitRate: 0, // TODO: Implement hit rate tracking
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.removeEntry(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.debug(`Cache cleanup: removed ${expiredCount} expired entries`);
    }
  }

  private evictLeastRecentlyUsed(): boolean {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey !== null) {
      this.removeEntry(oldestKey);
      logger.debug(`Cache LRU eviction: ${oldestKey}`);
      return true;
    }
    return false;
  }

  private removeEntry(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    this.currentSize -= entry.size;
    this.cache.delete(key);
    return true;
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
    this.currentSize = 0;
    logger.info('Cache destroyed');
  }
}

function estimateEntrySize(key: string, value: unknown): number {
  // Rough estimation: key + JSON-serialized data + metadata overhead.
  const keySize = key.length * 2; // UTF-16
  let dataSize: number;
  try {
    dataSize = JSON.stringify(value).length * 2;
  } catch {
    dataSize = 0; // value contains a cycle; cache it anyway with size 0.
  }
  const metadataSize = 32; // timestamp + ttl + size + object overhead
  return keySize + dataSize + metadataSize;
}

// Create cache key helpers
export const createCacheKey = {
  packageInfo: (packageName: string): string => `pkg_info:${packageName}`,

  packageReadme: (packageName: string, version: string): string =>
    `pkg_readme:${packageName}:${version}`,

  searchResults: (
    query: string,
    limit: number,
    quality?: number,
    popularity?: number,
  ): string => {
    const queryHash = Buffer.from(query).toString('base64');
    const params = [queryHash, limit.toString()];
    if (quality !== undefined) {
      params.push(`q:${quality}`);
    }
    if (popularity !== undefined) {
      params.push(`p:${popularity}`);
    }
    return `search:${params.join(':')}`;
  },

  downloadStats: (packageName: string, period: string): string =>
    `stats:${packageName}:${period}:${new Date().toISOString().split('T')[0]}`, // Include date for daily invalidation
};

// Global cache instance. CACHE_TTL is interpreted as seconds (matches README).
const ttlSeconds = Number(process.env.CACHE_TTL);
export const cache = new MemoryCache(
  Number.isFinite(ttlSeconds) && ttlSeconds > 0
    ? { ttl: ttlSeconds * 1000 }
    : {},
);
