import { NpmPackageInfo, NpmVersionInfo, NpmSearchResponse, NpmDownloadStats } from '../types/index.js';
export declare class NpmRegistryClient {
    private readonly baseUrl;
    private readonly searchUrl;
    private readonly downloadsUrl;
    private readonly timeout;
    constructor(timeout?: number);
    packageExists(packageName: string): Promise<boolean>;
    getPackageInfo(packageName: string): Promise<NpmPackageInfo>;
    getVersionInfo(packageName: string, version: string): Promise<NpmVersionInfo>;
    searchPackages(query: string, limit?: number, quality?: number, popularity?: number): Promise<NpmSearchResponse>;
    getDownloadStats(packageName: string, period: 'last-day' | 'last-week' | 'last-month'): Promise<NpmDownloadStats>;
    getAllDownloadStats(packageName: string): Promise<{
        last_day: number;
        last_week: number;
        last_month: number;
    }>;
}
export declare const npmRegistry: NpmRegistryClient;
//# sourceMappingURL=npm-registry.d.ts.map