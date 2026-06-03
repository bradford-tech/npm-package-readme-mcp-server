import { logger } from '../utils/logger.js';
import { validatePackageName, validateVersion } from '../utils/validators.js';
import { cache, createCacheKey } from '../services/cache.js';
import { npmRegistry } from '../services/npm-registry.js';
import { githubApi } from '../services/github-api.js';
import { readmeParser } from '../services/readme-parser.js';
export async function getPackageReadme(params) {
    const { package_name, version = 'latest', include_examples = true } = params;
    logger.info(`Fetching package README: ${package_name}@${version}`);
    validatePackageName(package_name);
    if (version !== 'latest') {
        validateVersion(version);
    }
    const cacheKey = createCacheKey.packageReadme(package_name, version);
    const cached = cache.get(cacheKey);
    if (cached) {
        logger.debug(`Cache hit for package README: ${package_name}@${version}`);
        return cached;
    }
    try {
        let packageInfo;
        let versionInfo;
        try {
            logger.debug(`Getting package info for: ${package_name}`);
            packageInfo = await npmRegistry.getPackageInfo(package_name);
            versionInfo = await npmRegistry.getVersionInfo(package_name, version);
        }
        catch (error) {
            logger.debug(`Package not found: ${package_name}`);
            return {
                package_name,
                version: version || 'latest',
                description: 'Package not found',
                readme_content: '',
                usage_examples: [],
                installation: {
                    command: `install ${package_name}`,
                    alternatives: [`yarn add ${package_name}`, `pnpm add ${package_name}`],
                },
                basic_info: {
                    name: package_name,
                    version: version || 'latest',
                    description: 'Package not found',
                    license: 'Unknown',
                    author: 'Unknown',
                    keywords: [],
                },
                exists: false,
            };
        }
        logger.debug(`Package info retrieved for: ${package_name}`);
        const actualVersion = versionInfo.version;
        let readmeContent = '';
        let readmeSource = 'none';
        if (packageInfo.readme) {
            readmeContent = packageInfo.readme;
            readmeSource = 'npm';
            logger.debug(`Got README from npm registry: ${package_name}`);
        }
        else if (versionInfo.repository) {
            const githubReadme = await githubApi.getReadmeFromRepository(versionInfo.repository);
            if (githubReadme) {
                readmeContent = githubReadme;
                readmeSource = 'github';
                logger.debug(`Got README from GitHub: ${package_name}`);
            }
        }
        const cleanedReadme = readmeParser.cleanMarkdown(readmeContent);
        const usageExamples = readmeParser.parseUsageExamples(readmeContent, include_examples);
        const installation = {
            command: `install ${package_name}`,
            alternatives: [`yarn add ${package_name}`, `pnpm add ${package_name}`],
        };
        const basicInfo = {
            name: versionInfo.name,
            version: actualVersion,
            description: versionInfo.description || packageInfo.description || 'No description available',
            main: versionInfo.main || undefined,
            types: versionInfo.types || undefined,
            homepage: versionInfo.homepage || packageInfo.homepage || undefined,
            bugs: typeof versionInfo.bugs === 'string' ? versionInfo.bugs : versionInfo.bugs?.url || undefined,
            license: versionInfo.license || packageInfo.license || 'Unknown',
            author: versionInfo.author || packageInfo.author || 'Unknown',
            contributors: versionInfo.contributors || undefined,
            keywords: versionInfo.keywords || packageInfo.keywords || [],
        };
        let repository;
        if (versionInfo.repository) {
            repository = {
                type: versionInfo.repository.type,
                url: versionInfo.repository.url,
                directory: versionInfo.repository.directory || undefined,
            };
        }
        const response = {
            package_name,
            version: actualVersion,
            description: basicInfo.description,
            readme_content: cleanedReadme,
            usage_examples: usageExamples,
            installation,
            basic_info: basicInfo,
            repository: repository || undefined,
            exists: true,
        };
        cache.set(cacheKey, response);
        logger.info(`Successfully fetched package README: ${package_name}@${actualVersion} (README source: ${readmeSource})`);
        return response;
    }
    catch (error) {
        logger.error(`Failed to fetch package README: ${package_name}@${version}`, { error });
        throw error;
    }
}
//# sourceMappingURL=get-package-readme.js.map