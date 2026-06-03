import { logger } from '../utils/logger.js';
export class MemoryCache {
    constructor(options = {}) {
        this.cache = new Map();
        this.defaultTtl = options.ttl || 3600 * 1000;
        this.maxSize = options.maxSize || 104857600;
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }
    set(key, value, ttl) {
        const actualTtl = ttl || this.defaultTtl;
        const timestamp = Date.now();
        const entry = {
            data: value,
            timestamp,
            ttl: actualTtl,
        };
        if (this.wouldExceedMaxSize(key, entry)) {
            this.evictLeastRecentlyUsed();
        }
        this.cache.set(key, entry);
        logger.debug(`Cache set: ${key} (TTL: ${actualTtl}ms)`);
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            logger.debug(`Cache miss: ${key}`);
            return null;
        }
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            logger.debug(`Cache expired: ${key}`);
            return null;
        }
        entry.timestamp = now;
        logger.debug(`Cache hit: ${key}`);
        return entry.data;
    }
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            logger.debug(`Cache deleted: ${key}`);
        }
        return deleted;
    }
    clear() {
        this.cache.clear();
        logger.info('Cache cleared');
    }
    has(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return false;
        }
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    size() {
        return this.cache.size;
    }
    getStats() {
        const memoryUsage = this.estimateMemoryUsage();
        return {
            size: this.cache.size,
            memoryUsage,
            hitRate: 0,
        };
    }
    cleanup() {
        const now = Date.now();
        let expiredCount = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
                expiredCount++;
            }
        }
        if (expiredCount > 0) {
            logger.debug(`Cache cleanup: removed ${expiredCount} expired entries`);
        }
    }
    wouldExceedMaxSize(key, entry) {
        const currentSize = this.estimateMemoryUsage();
        const entrySize = this.estimateEntrySize(key, entry);
        return currentSize + entrySize > this.maxSize;
    }
    evictLeastRecentlyUsed() {
        let oldestKey = null;
        let oldestTimestamp = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
            logger.debug(`Cache LRU eviction: ${oldestKey}`);
        }
    }
    estimateMemoryUsage() {
        let totalSize = 0;
        for (const [key, entry] of this.cache.entries()) {
            totalSize += this.estimateEntrySize(key, entry);
        }
        return totalSize;
    }
    estimateEntrySize(key, entry) {
        const keySize = key.length * 2;
        const dataSize = JSON.stringify(entry.data).length * 2;
        const metadataSize = 24;
        return keySize + dataSize + metadataSize;
    }
    destroy() {
        clearInterval(this.cleanupInterval);
        this.cache.clear();
        logger.info('Cache destroyed');
    }
}
export const createCacheKey = {
    packageInfo: (packageName, version) => `pkg_info:${packageName}:${version}`,
    packageReadme: (packageName, version) => `pkg_readme:${packageName}:${version}`,
    searchResults: (query, limit, quality, popularity) => {
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
    downloadStats: (packageName, period) => `stats:${packageName}:${period}:${new Date().toISOString().split('T')[0]}`,
};
export const cache = new MemoryCache();
//# sourceMappingURL=cache.js.map