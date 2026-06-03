import { logger } from '../utils/logger.js';
import { handleApiError, handleHttpError, withRetry } from '../utils/error-handler.js';
import { VersionNotFoundError, } from '../types/index.js';
export class NpmRegistryClient {
    constructor(timeout) {
        this.baseUrl = 'https://registry.npmjs.org';
        this.searchUrl = 'https://registry.npmjs.org/-/v1/search';
        this.downloadsUrl = 'https://api.npmjs.org/downloads';
        this.timeout = timeout || 30000;
    }
    async packageExists(packageName) {
        try {
            await this.getPackageInfo(packageName);
            return true;
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('404')) {
                return false;
            }
            throw error;
        }
    }
    async getPackageInfo(packageName) {
        const url = `${this.baseUrl}/${encodeURIComponent(packageName)}`;
        return withRetry(async () => {
            logger.debug(`Fetching package info: ${packageName}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            try {
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'package-readme-mcp/1.0.0',
                    },
                });
                if (!response.ok) {
                    handleHttpError(response.status, response, `npm registry for package ${packageName}`);
                }
                const data = await response.json();
                logger.debug(`Successfully fetched package info: ${packageName}`);
                return data;
            }
            catch (error) {
                if (error.name === 'AbortError') {
                    handleApiError(new Error('Request timeout'), `npm registry for package ${packageName}`);
                }
                handleApiError(error, `npm registry for package ${packageName}`);
            }
            finally {
                clearTimeout(timeoutId);
            }
        }, 3, 1000, `npm registry getPackageInfo(${packageName})`);
    }
    async getVersionInfo(packageName, version) {
        const packageInfo = await this.getPackageInfo(packageName);
        let actualVersion = version;
        if (version === 'latest' || packageInfo['dist-tags'][version]) {
            actualVersion = packageInfo['dist-tags'][version] || packageInfo['dist-tags'].latest;
        }
        const versionInfo = packageInfo.versions[actualVersion];
        if (!versionInfo) {
            throw new VersionNotFoundError(packageName, version);
        }
        return versionInfo;
    }
    async searchPackages(query, limit = 20, quality, popularity) {
        const params = new URLSearchParams({
            text: query,
            size: limit.toString(),
        });
        if (quality !== undefined) {
            params.append('quality', quality.toString());
        }
        if (popularity !== undefined) {
            params.append('popularity', popularity.toString());
        }
        const url = `${this.searchUrl}?${params.toString()}`;
        return withRetry(async () => {
            logger.debug(`Searching packages: ${query} (limit: ${limit})`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            try {
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'package-readme-mcp/1.0.0',
                    },
                });
                if (!response.ok) {
                    handleHttpError(response.status, response, `npm search for query ${query}`);
                }
                const data = await response.json();
                logger.debug(`Successfully searched packages: ${query}, found ${data.total} results`);
                return data;
            }
            catch (error) {
                if (error.name === 'AbortError') {
                    handleApiError(new Error('Request timeout'), `npm search for query ${query}`);
                }
                handleApiError(error, `npm search for query ${query}`);
            }
            finally {
                clearTimeout(timeoutId);
            }
        }, 3, 1000, `npm registry searchPackages(${query})`);
    }
    async getDownloadStats(packageName, period) {
        const url = `${this.downloadsUrl}/point/${period}/${encodeURIComponent(packageName)}`;
        return withRetry(async () => {
            logger.debug(`Fetching download stats: ${packageName} (${period})`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            try {
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'package-readme-mcp/1.0.0',
                    },
                });
                if (!response.ok) {
                    if (response.status === 404) {
                        return {
                            downloads: 0,
                            start: new Date().toISOString().split('T')[0],
                            end: new Date().toISOString().split('T')[0],
                            package: packageName,
                        };
                    }
                    handleHttpError(response.status, response, `npm downloads for package ${packageName}`);
                }
                const data = await response.json();
                logger.debug(`Successfully fetched download stats: ${packageName} (${period})`);
                return data;
            }
            catch (error) {
                if (error.name === 'AbortError') {
                    handleApiError(new Error('Request timeout'), `npm downloads for package ${packageName}`);
                }
                handleApiError(error, `npm downloads for package ${packageName}`);
            }
            finally {
                clearTimeout(timeoutId);
            }
        }, 3, 1000, `npm registry getDownloadStats(${packageName}, ${period})`);
    }
    async getAllDownloadStats(packageName) {
        try {
            const [dayStats, weekStats, monthStats] = await Promise.all([
                this.getDownloadStats(packageName, 'last-day'),
                this.getDownloadStats(packageName, 'last-week'),
                this.getDownloadStats(packageName, 'last-month'),
            ]);
            return {
                last_day: dayStats.downloads,
                last_week: weekStats.downloads,
                last_month: monthStats.downloads,
            };
        }
        catch (error) {
            logger.warn(`Failed to fetch download stats for ${packageName}, using zeros`, { error });
            return {
                last_day: 0,
                last_week: 0,
                last_month: 0,
            };
        }
    }
}
export const npmRegistry = new NpmRegistryClient();
//# sourceMappingURL=npm-registry.js.map