export interface UsageExample {
    title: string;
    description?: string | undefined;
    code: string;
    language: string;
}
export interface InstallationInfo {
    command: string;
    alternatives?: string[];
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
export interface GetPackageReadmeParams {
    package_name: string;
    version?: string;
    include_examples?: boolean;
}
export interface GetPackageInfoParams {
    package_name: string;
    include_dependencies?: boolean;
    include_dev_dependencies?: boolean;
}
export interface SearchPackagesParams {
    query: string;
    limit?: number;
    quality?: number;
    popularity?: number;
}
export interface PackageReadmeResponse {
    package_name: string;
    version: string;
    description: string;
    readme_content: string;
    usage_examples: UsageExample[];
    installation: InstallationInfo;
    basic_info: PackageBasicInfo;
    repository?: RepositoryInfo | undefined;
    exists: boolean;
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
    exists: boolean;
}
export interface SearchPackagesResponse {
    query: string;
    total: number;
    packages: PackageSearchResult[];
}
export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}
export interface CacheOptions {
    ttl?: number;
    maxSize?: number;
}
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
    bugs?: string | {
        url: string;
    };
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
    bugs?: string | {
        url: string;
    };
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
export declare class PackageReadmeMcpError extends Error {
    code: string;
    statusCode?: number | undefined;
    details?: unknown | undefined;
    constructor(message: string, code: string, statusCode?: number | undefined, details?: unknown | undefined);
}
export declare class PackageNotFoundError extends PackageReadmeMcpError {
    constructor(packageName: string);
}
export declare class VersionNotFoundError extends PackageReadmeMcpError {
    constructor(packageName: string, version: string);
}
export declare class RateLimitError extends PackageReadmeMcpError {
    constructor(service: string, retryAfter?: number);
}
export declare class NetworkError extends PackageReadmeMcpError {
    constructor(message: string, originalError?: Error);
}
//# sourceMappingURL=index.d.ts.map