import {
  afterEach,
  beforeEach,
  describe,
  expect,
  type MockInstance,
  test,
  vi,
} from 'vitest';
import { cache } from '../src/services/cache.js';
import { NpmRegistryClient } from '../src/services/npm-registry.js';
import { getPackageInfo } from '../src/tools/get-package-info.js';
import { getPackageReadme } from '../src/tools/get-package-readme.js';
import {
  PackageNotFoundError,
  VersionNotFoundError,
} from '../src/types/index.js';

const STUB_PACKAGE_INFO = {
  _id: 'real',
  _rev: '1',
  name: 'real',
  description: 'real package',
  'dist-tags': { latest: '1.0.0' },
  versions: {
    '1.0.0': {
      name: 'real',
      version: '1.0.0',
      description: 'real package',
      dist: {
        integrity: '',
        shasum: '',
        tarball: '',
        fileCount: 0,
        unpackedSize: 0,
      },
    },
  },
  time: { created: '2020-01-01', modified: '2020-01-01' },
  maintainers: [],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('PackageNotFoundError', () => {
  test('message contains the actual package name', () => {
    const err = new PackageNotFoundError('lodash');
    expect(err.message).toBe("Package 'lodash' not found");
    expect(err.code).toBe('PACKAGE_NOT_FOUND');
    expect(err.statusCode).toBe(404);
  });

  test('scoped names round-trip without mangling', () => {
    const err = new PackageNotFoundError('@types/node');
    expect(err.message).toContain('@types/node');
  });
});

describe('NpmRegistryClient.packageExists', () => {
  let fetchSpy: MockInstance<typeof fetch>;
  let client: NpmRegistryClient;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    client = new NpmRegistryClient();
    cache.clear();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  test('returns false when npm returns 404', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('not found', { status: 404 }));
    await expect(
      client.packageExists('definitely-not-a-real-package'),
    ).resolves.toBe(false);
  });

  test('returns true when the package resolves', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(STUB_PACKAGE_INFO));
    await expect(client.packageExists('real')).resolves.toBe(true);
  });
});

describe('getPackageReadme', () => {
  let fetchSpy: MockInstance<typeof fetch>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    cache.clear();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  test('returns exists:false when the package is not found', async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve(new Response('not found', { status: 404 })),
    );
    const result = await getPackageReadme({
      package_name: 'definitely-not-real-xyz',
    });
    expect(result.exists).toBe(false);
    expect(result.package_name).toBe('definitely-not-real-xyz');
  });

  test('propagates non-404 errors instead of masking them as exists:false', async () => {
    // 401 is not retried by withRetry; it bubbles up directly.
    fetchSpy.mockImplementation(() =>
      Promise.resolve(new Response('unauthorized', { status: 401 })),
    );
    await expect(
      getPackageReadme({ package_name: 'whatever' }),
    ).rejects.toThrow(/401|HTTP error/i);
  });

  test('returns exists:false when the requested version is missing', async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve(jsonResponse(STUB_PACKAGE_INFO)),
    );
    const result = await getPackageReadme({
      package_name: 'real',
      version: '99.99.99',
    });
    expect(result.exists).toBe(false);
  });

  test('installation.command is a complete `npm install` invocation (success path)', async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve(jsonResponse(STUB_PACKAGE_INFO)),
    );
    const result = await getPackageReadme({ package_name: 'real' });
    expect(result.installation.command).toBe('npm install real');
  });

  test('installation.command is a complete `npm install` invocation (not-found path)', async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve(new Response('not found', { status: 404 })),
    );
    const result = await getPackageReadme({ package_name: 'gone' });
    expect(result.installation.command).toBe('npm install gone');
  });
});

describe('getPackageInfo', () => {
  let fetchSpy: MockInstance<typeof fetch>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    cache.clear();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  test('returns exists:false on 404', async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve(new Response('not found', { status: 404 })),
    );
    const result = await getPackageInfo({ package_name: 'nope-not-real' });
    expect(result.exists).toBe(false);
  });

  test('propagates non-404 errors', async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve(new Response('unauthorized', { status: 401 })),
    );
    await expect(
      getPackageInfo({ package_name: 'whatever' }),
    ).rejects.toThrow();
  });
});

describe('VersionNotFoundError', () => {
  test('message names both package and version, with code and status', () => {
    const err = new VersionNotFoundError('react', '99.0.0');
    expect(err.message).toBe("Version '99.0.0' of package 'react' not found");
    expect(err.code).toBe('VERSION_NOT_FOUND');
    expect(err.statusCode).toBe(404);
  });
});

describe('5xx retry behavior', () => {
  let fetchSpy: MockInstance<typeof fetch>;
  let client: NpmRegistryClient;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    client = new NpmRegistryClient();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    fetchSpy.mockRestore();
  });

  test('retries 5xx, surfaces NetworkError, does not mask as exists:false', async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve(new Response('boom', { status: 503 })),
    );

    const pending: Promise<unknown> = client.getPackageInfo('whatever').then(
      () => 'resolved',
      (err: unknown) => err,
    );

    // withRetry: 4 attempts (1 + 3 retries) with 1s, 2s, 4s backoff = 7s total.
    await vi.advanceTimersByTimeAsync(8000);

    const result = await pending;
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toMatch(/server error|503/i);
    // fetch called exactly 4 times (initial + 3 retries)
    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });
});
