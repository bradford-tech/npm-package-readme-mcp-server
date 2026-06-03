import { CacheOptions } from '../types/index.js';
export declare class MemoryCache {
    private cache;
    private readonly defaultTtl;
    private readonly maxSize;
    private readonly cleanupInterval;
    constructor(options?: CacheOptions);
    set<T>(key: string, value: T, ttl?: number): void;
    get<T>(key: string): T | null;
    delete(key: string): boolean;
    clear(): void;
    has(key: string): boolean;
    size(): number;
    getStats(): {
        size: number;
        memoryUsage: number;
        hitRate: number;
    };
    private cleanup;
    private wouldExceedMaxSize;
    private evictLeastRecentlyUsed;
    private estimateMemoryUsage;
    private estimateEntrySize;
    destroy(): void;
}
export declare const createCacheKey: {
    packageInfo: (packageName: string, version: string) => string;
    packageReadme: (packageName: string, version: string) => string;
    searchResults: (query: string, limit: number, quality?: number, popularity?: number) => string;
    downloadStats: (packageName: string, period: string) => string;
};
export declare const cache: MemoryCache;
//# sourceMappingURL=cache.d.ts.map