import { logger } from '../utils/logger.js';
import { validateSearchQuery, validateLimit, validateScore } from '../utils/validators.js';
import { cache, createCacheKey } from '../services/cache.js';
import { npmRegistry } from '../services/npm-registry.js';
import {
  SearchPackagesParams,
  SearchPackagesResponse,
  PackageSearchResult,
} from '../types/index.js';

export async function searchPackages(params: SearchPackagesParams): Promise<SearchPackagesResponse> {
  const { 
    query, 
    limit = 20, 
    quality, 
    popularity 
  } = params;

  logger.info(`Searching packages: "${query}" (limit: ${limit})`);

  // Validate inputs
  validateSearchQuery(query);
  validateLimit(limit);
  
  if (quality !== undefined) {
    validateScore(quality, 'Quality');
  }
  
  if (popularity !== undefined) {
    validateScore(popularity, 'Popularity');
  }

  // Check cache first
  const cacheKey = createCacheKey.searchResults(query, limit, quality, popularity);
  const cached = cache.get<SearchPackagesResponse>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for search: "${query}"`);
    return cached;
  }

  try {
    // Search packages using npm registry
    const searchResults = await npmRegistry.searchPackages(query, limit, quality, popularity);
    
    // Transform results to our format
    const packages: PackageSearchResult[] = searchResults.objects.map(obj => {
      const pkg = obj.package;
      const score = obj.score;
      
      // Extract author name
      let authorName = 'Unknown';
      if (pkg.author) {
        authorName = pkg.author.name;
      }

      // Extract maintainer names
      const maintainers = pkg.maintainers.map(maintainer => maintainer.username);

      return {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description || 'No description available',
        keywords: pkg.keywords || [],
        author: authorName,
        publisher: pkg.publisher.username,
        maintainers,
        score: {
          final: score.final,
          detail: {
            quality: score.detail.quality,
            popularity: score.detail.popularity,
            maintenance: score.detail.maintenance,
          },
        },
        searchScore: obj.searchScore,
      };
    });

    // Filter results based on quality and popularity if specified
    let filteredPackages = packages;
    
    if (quality !== undefined) {
      filteredPackages = filteredPackages.filter(pkg => pkg.score.detail.quality >= quality);
    }
    
    if (popularity !== undefined) {
      filteredPackages = filteredPackages.filter(pkg => pkg.score.detail.popularity >= popularity);
    }

    // Create response
    const response: SearchPackagesResponse = {
      query,
      total: filteredPackages.length,
      packages: filteredPackages,
    };

    // Cache the response (shorter TTL for search results)
    cache.set(cacheKey, response, 600000); // 10 minutes

    logger.info(`Successfully searched packages: "${query}", found ${response.total} results`);
    return response;

  } catch (error) {
    logger.error(`Failed to search packages: "${query}"`, { error });
    throw error;
  }
}