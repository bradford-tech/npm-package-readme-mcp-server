import { logger } from '../utils/logger.js';
import { validatePackageName } from '../utils/validators.js';
import { cache, createCacheKey } from '../services/cache.js';
import { npmRegistry } from '../services/npm-registry.js';
export async function getPackageInfo(params) {
    const { package_name, include_dependencies = true, include_dev_dependencies = false } = params;
    logger.info(`Fetching package info: ${package_name}`);
    validatePackageName(package_name);
    const cacheKey = createCacheKey.packageInfo(package_name, 'latest');
    const cached = cache.get(cacheKey);
    if (cached) {
        logger.debug(`Cache hit for package info: ${package_name}`);
        return cached;
    }
    try {
        logger.debug(`Checking package existence: ${package_name}`);
        const packageExists = await npmRegistry.packageExists(package_name);
        if (!packageExists) {
            logger.warn(`Package not found: ${package_name}`);
            return {
                package_name,
                latest_version: 'unknown',
                description: 'Package not found',
                author: 'Unknown',
                license: 'Unknown',
                keywords: [],
                download_stats: {
                    last_day: 0,
                    last_week: 0,
                    last_month: 0,
                },
                exists: false,
            };
        }
        logger.debug(`Package exists: ${package_name}`);
        const packageInfo = await npmRegistry.getPackageInfo(package_name);
        const latestVersion = packageInfo['dist-tags'].latest;
        const versionInfo = packageInfo.versions[latestVersion];
        if (!versionInfo) {
            throw new Error(`Latest version ${latestVersion} not found for package ${package_name}`);
        }
        const downloadStats = await npmRegistry.getAllDownloadStats(package_name);
        let authorString = 'Unknown';
        if (versionInfo.author) {
            if (typeof versionInfo.author === 'string') {
                authorString = versionInfo.author;
            }
            else {
                authorString = versionInfo.author.name;
                if (versionInfo.author.email) {
                    authorString += ` <${versionInfo.author.email}>`;
                }
            }
        }
        else if (packageInfo.author) {
            if (typeof packageInfo.author === 'string') {
                authorString = packageInfo.author;
            }
            else {
                authorString = packageInfo.author.name;
                if (packageInfo.author.email) {
                    authorString += ` <${packageInfo.author.email}>`;
                }
            }
        }
        let repository;
        const repoInfo = versionInfo.repository || packageInfo.repository;
        if (repoInfo) {
            repository = {
                type: repoInfo.type,
                url: repoInfo.url,
                directory: repoInfo.directory || undefined,
            };
        }
        let dependencies;
        let devDependencies;
        if (include_dependencies && versionInfo.dependencies) {
            dependencies = versionInfo.dependencies;
        }
        if (include_dev_dependencies && versionInfo.devDependencies) {
            devDependencies = versionInfo.devDependencies;
        }
        const response = {
            package_name,
            latest_version: latestVersion,
            description: versionInfo.description || packageInfo.description || 'No description available',
            author: authorString,
            license: versionInfo.license || packageInfo.license || 'Unknown',
            keywords: versionInfo.keywords || packageInfo.keywords || [],
            dependencies: dependencies || undefined,
            dev_dependencies: devDependencies || undefined,
            download_stats: downloadStats,
            repository: repository || undefined,
            exists: true,
        };
        cache.set(cacheKey, response);
        logger.info(`Successfully fetched package info: ${package_name}@${latestVersion}`);
        return response;
    }
    catch (error) {
        logger.error(`Failed to fetch package info: ${package_name}`, { error });
        throw error;
    }
}
//# sourceMappingURL=get-package-info.js.map