import { logger } from '../utils/logger.js';
import { validatePackageName, validateVersion } from '../utils/validators.js';
import { cache, createCacheKey } from '../services/cache.js';
import { npmRegistry } from '../services/npm-registry.js';
import { githubApi } from '../services/github-api.js';
import { readmeParser } from '../services/readme-parser.js';
import {
  GetPackageReadmeParams,
  PackageReadmeResponse,
  InstallationInfo,
  PackageBasicInfo,
  RepositoryInfo,
} from '../types/index.js';

export async function getPackageReadme(params: GetPackageReadmeParams): Promise<PackageReadmeResponse> {
  const { package_name, version = 'latest', include_examples = true } = params;

  logger.info(`Fetching package README: ${package_name}@${version}`);

  // Validate inputs
  validatePackageName(package_name);
  if (version !== 'latest') {
    validateVersion(version);
  }

  // Check cache first
  const cacheKey = createCacheKey.packageReadme(package_name, version);
  const cached = cache.get<PackageReadmeResponse>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for package README: ${package_name}@${version}`);
    return cached;
  }

  try {
    // Get package info from npm registry directly
    let packageInfo;
    let versionInfo;
    
    try {
      logger.debug(`Getting package info for: ${package_name}`);
      packageInfo = await npmRegistry.getPackageInfo(package_name);
      versionInfo = await npmRegistry.getVersionInfo(package_name, version);
    } catch (error) {
      // If package not found, return a response indicating non-existence
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

    // Get actual version string (in case we requested 'latest')
    const actualVersion = versionInfo.version;

    // Try to get README content
    let readmeContent = '';
    let readmeSource = 'none';

    // First, try to get README from npm registry
    if (packageInfo.readme) {
      readmeContent = packageInfo.readme;
      readmeSource = 'npm';
      logger.debug(`Got README from npm registry: ${package_name}`);
    }
    // If no README in npm registry, try GitHub as fallback
    else if (versionInfo.repository) {
      const githubReadme = await githubApi.getReadmeFromRepository(versionInfo.repository);
      if (githubReadme) {
        readmeContent = githubReadme;
        readmeSource = 'github';
        logger.debug(`Got README from GitHub: ${package_name}`);
      }
    }

    // Clean and process README content
    const cleanedReadme = readmeParser.cleanMarkdown(readmeContent);
    
    // Extract usage examples
    const usageExamples = readmeParser.parseUsageExamples(readmeContent, include_examples);

    // Create installation info
    const installation: InstallationInfo = {
      command: `install ${package_name}`,
      alternatives: [`yarn add ${package_name}`, `pnpm add ${package_name}`],
    };

    // Create basic info
    const basicInfo: PackageBasicInfo = {
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

    // Create repository info
    let repository: RepositoryInfo | undefined;
    if (versionInfo.repository) {
      repository = {
        type: versionInfo.repository.type,
        url: versionInfo.repository.url,
        directory: versionInfo.repository.directory || undefined,
      };
    }

    // Create response
    const response: PackageReadmeResponse = {
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

    // Cache the response
    cache.set(cacheKey, response);

    logger.info(`Successfully fetched package README: ${package_name}@${actualVersion} (README source: ${readmeSource})`);
    return response;

  } catch (error) {
    logger.error(`Failed to fetch package README: ${package_name}@${version}`, { error });
    throw error;
  }
}