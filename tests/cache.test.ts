import { describe, test, expect, afterEach } from 'vitest';
import { MemoryCache, createCacheKey } from '../src/services/cache.js';

function makeCache(maxSize?: number): MemoryCache {
  const cache = new MemoryCache(maxSize === undefined ? {} : { maxSize });
  cleanup.push(cache);
  return cache;
}

const cleanup: MemoryCache[] = [];

afterEach(() => {
  while (cleanup.length > 0) {
    cleanup.pop()?.destroy();
  }
});

describe('MemoryCache size accounting', () => {
  test('memoryUsage is 0 for an empty cache', () => {
    const cache = makeCache();
    expect(cache.getStats().memoryUsage).toBe(0);
  });

  test('memoryUsage grows when entries are added', () => {
    const cache = makeCache();
    cache.set('a', { value: 'hello' });
    const after = cache.getStats().memoryUsage;
    expect(after).toBeGreaterThan(0);
  });

  test('memoryUsage decreases after delete', () => {
    const cache = makeCache();
    cache.set('a', 'small');
    cache.set('b', 'second');
    const before = cache.getStats().memoryUsage;
    cache.delete('a');
    expect(cache.getStats().memoryUsage).toBeLessThan(before);
  });

  test('memoryUsage returns to 0 after clear', () => {
    const cache = makeCache();
    cache.set('a', 'x');
    cache.set('b', 'y');
    cache.clear();
    expect(cache.getStats().memoryUsage).toBe(0);
  });

  test('overwriting a key does not double-count', () => {
    const cache = makeCache();
    cache.set('a', 'first');
    const after1 = cache.getStats().memoryUsage;
    cache.set('a', 'first');
    expect(cache.getStats().memoryUsage).toBe(after1);
  });
});

describe('MemoryCache eviction', () => {
  test('stays at or below maxSize after many large inserts', () => {
    // 1KB cap, each entry roughly 300 bytes (200-char value × 2 bytes + key + metadata).
    const cache = makeCache(1000);
    for (let i = 0; i < 20; i++) {
      cache.set(`key-${i}`, 'x'.repeat(200));
    }
    expect(cache.getStats().memoryUsage).toBeLessThanOrEqual(1000);
  });

  test('keeps the most recently used entries when evicting', () => {
    const cache = makeCache(1000);
    for (let i = 0; i < 10; i++) {
      cache.set(`key-${i}`, 'x'.repeat(200));
    }
    // The earliest insertions should be gone.
    expect(cache.has('key-0')).toBe(false);
    // The latest insertion must survive.
    expect(cache.has('key-9')).toBe(true);
  });
});

describe('createCacheKey.packageInfo', () => {
  test('produces stable key without redundant version literal', () => {
    // The tool always queries the latest version; the cache key
    // should not require callers to pass a version they don't have.
    expect(createCacheKey.packageInfo('lodash')).toBe('pkg_info:lodash');
    expect(createCacheKey.packageInfo('@types/node')).toBe('pkg_info:@types/node');
  });
});
