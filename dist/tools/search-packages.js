import { logger } from '../utils/logger.js';
import { validateSearchQuery, validateLimit, validateScore } from '../utils/validators.js';
import { cache, createCacheKey } from '../services/cache.js';
import { npmRegistry } from '../services/npm-registry.js';
export async function searchPackages(params) {
    const { query, limit = 20, quality, popularity } = params;
    logger.info(`Searching packages: "${query}" (limit: ${limit})`);
    validateSearchQuery(query);
    validateLimit(limit);
    if (quality !== undefined) {
        validateScore(quality, 'Quality');
    }
    if (popularity !== undefined) {
        validateScore(popularity, 'Popularity');
    }
    const cacheKey = createCacheKey.searchResults(query, limit, quality, popularity);
    const cached = cache.get(cacheKey);
    if (cached) {
        logger.debug(`Cache hit for search: "${query}"`);
        return cached;
    }
    try {
        const searchResults = await npmRegistry.searchPackages(query, limit, quality, popularity);
        const packages = searchResults.objects.map(obj => {
            const pkg = obj.package;
            const score = obj.score;
            let authorName = 'Unknown';
            if (pkg.author) {
                authorName = pkg.author.name;
            }
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
        let filteredPackages = packages;
        if (quality !== undefined) {
            filteredPackages = filteredPackages.filter(pkg => pkg.score.detail.quality >= quality);
        }
        if (popularity !== undefined) {
            filteredPackages = filteredPackages.filter(pkg => pkg.score.detail.popularity >= popularity);
        }
        const response = {
            query,
            total: filteredPackages.length,
            packages: filteredPackages,
        };
        cache.set(cacheKey, response, 600000);
        logger.info(`Successfully searched packages: "${query}", found ${response.total} results`);
        return response;
    }
    catch (error) {
        logger.error(`Failed to search packages: "${query}"`, { error });
        throw error;
    }
}
//# sourceMappingURL=search-packages.js.map