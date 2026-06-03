export interface UsageExample {
  title: string;
  description?: string | undefined;
  code: string;
  language: string; // 'javascript', 'typescript', 'bash', etc.
}

export interface InstallationInfo {
  command: string; // "install package-name"
  alternatives?: string[]; // 他のパッケージマネージャーでのインストール方法
}

export interface AuthorInfo {
  name: string;
  email?: string;
  url?: string;
}

export interface RepositoryInfo {
  type: string;
  url: string;
  directory?: string | undefined;
}

export interface PackageBasicInfo {
  name: string;
  version: string;
  description: string;
  main?: string | undefined;
  types?: string | undefined;
  homepage?: string | undefined;
  bugs?: string | undefined;
  license: string;
  author: string | AuthorInfo;
  contributors?: AuthorInfo[] | undefined;
  keywords: string[];
}

export interface DownloadStats {
  last_day: number;
  last_week: number;
  last_month: number;
}

export interface PackageSearchResult {
  name: string;
  version: string;
  description: string;
  keywords: string[];
  author: string;
  publisher: string;
  maintainers: string[];
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
  searchScore: number;
}

// Tool Parameters
export interface GetPackageReadmeParams {
  package_name: string;    // Package name (required)
  version?: string;        // Version specification (optional, default: "latest")
  include_examples?: boolean; // Whether to include examples (optional, default: true)
}

export interface GetPackageInfoParams {
  package_name: string;
  include_dependencies?: boolean; // Whether to include dependencies (default: true)
  include_dev_dependencies?: boolean; // 開発依存関係を含めるか（デフォルト: false）
}

export interface SearchPackagesParams {
  query: string;          // 検索クエリ
  limit?: number;         // 結果の上限数（デフォルト: 20）
  quality?: number;       // 品質スコアの最小値（0-1）
  popularity?: number;    // 人気度スコアの最小値（0-1）
}

// Tool Responses
export interface PackageReadmeResponse {
  package_name: string;
  version: string;
  description: string;
  readme_content: string;
  usage_examples: UsageExample[];
  installation: InstallationInfo;
  basic_info: PackageBasicInfo;
  repository?: RepositoryInfo | undefined;
  exists: boolean; // パッケージが存在するか
}

export interface PackageInfoResponse {
  package_name: string;
  latest_version: string;
  description: string;
  author: string;
  license: string;
  keywords: string[];
  dependencies?: Record<string, string> | undefined;
  dev_dependencies?: Record<string, string> | undefined;
  download_stats: DownloadStats;
  repository?: RepositoryInfo | undefined;
  exists: boolean; // パッケージが存在するか
}

export interface SearchPackagesResponse {
  query: string;
  total: number;
  packages: PackageSearchResult[];
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

// npm Registry API Types
export interface NpmPackageInfo {
  _id: string;
  _rev: string;
  name: string;
  description: string;
  'dist-tags': {
    latest: string;
    [tag: string]: string;
  };
  versions: {
    [version: string]: NpmVersionInfo;
  };
  time: {
    created: string;
    modified: string;
    [version: string]: string;
  };
  maintainers: {
    name: string;
    email: string;
  }[];
  author?: AuthorInfo;
  repository?: RepositoryInfo;
  homepage?: string;
  bugs?: string | { url: string };
  license?: string;
  keywords?: string[];
  readme?: string;
  readmeFilename?: string;
}

export interface NpmVersionInfo {
  name: string;
  version: string;
  description: string;
  main?: string;
  types?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  bundledDependencies?: string[];
  author?: string | AuthorInfo;
  contributors?: AuthorInfo[];
  maintainers?: AuthorInfo[];
  repository?: RepositoryInfo;
  homepage?: string;
  bugs?: string | { url: string };
  license?: string;
  keywords?: string[];
  engines?: Record<string, string>;
  os?: string[];
  cpu?: string[];
  dist: {
    integrity: string;
    shasum: string;
    tarball: string;
    fileCount: number;
    unpackedSize: number;
  };
  _hasShrinkwrap?: boolean;
}

export interface NpmSearchResponse {
  objects: {
    package: {
      name: string;
      scope: string;
      version: string;
      description: string;
      keywords: string[];
      date: string;
      links: {
        npm: string;
        homepage?: string;
        repository?: string;
        bugs?: string;
      };
      author?: {
        name: string;
        email?: string;
        username?: string;
      };
      publisher: {
        username: string;
        email: string;
      };
      maintainers: {
        username: string;
        email: string;
      }[];
    };
    score: {
      final: number;
      detail: {
        quality: number;
        popularity: number;
        maintenance: number;
      };
    };
    searchScore: number;
  }[];
  total: number;
  time: string;
}

export interface NpmDownloadStats {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

// GitHub API Types
export interface GitHubReadmeResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content: string;
  encoding: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

// Error Types
export class PackageReadmeMcpError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'PackageReadmeMcpError';
  }
}

export class PackageNotFoundError extends PackageReadmeMcpError {
  constructor(packageName: string) {
    super(`Package '${packageName}' not found`, 'PACKAGE_NOT_FOUND', 404);
  }
}

export class VersionNotFoundError extends PackageReadmeMcpError {
  constructor(packageName: string, version: string) {
    super(`Version '${version}' of package '${packageName}' not found`, 'VERSION_NOT_FOUND', 404);
  }
}

export class RateLimitError extends PackageReadmeMcpError {
  constructor(service: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${service}`, 'RATE_LIMIT_EXCEEDED', 429, { retryAfter });
  }
}

export class NetworkError extends PackageReadmeMcpError {
  constructor(message: string, originalError?: Error) {
    super(`Network error: ${message}`, 'NETWORK_ERROR', undefined, originalError);
  }
}