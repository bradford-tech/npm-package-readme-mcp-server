import { RepositoryInfo } from '../types/index.js';
export declare class GitHubApiClient {
    private readonly baseUrl;
    private readonly token?;
    private readonly timeout;
    constructor(token?: string, timeout?: number);
    getReadme(owner: string, repo: string): Promise<string>;
    parseRepositoryUrl(repositoryUrl: string): {
        owner: string;
        repo: string;
    } | null;
    getReadmeFromRepository(repository: RepositoryInfo): Promise<string | null>;
    isRateLimited(): boolean;
    getRateLimitStatus(): {
        limit: number;
        remaining: number;
        resetTime: number;
    } | null;
}
export declare const githubApi: GitHubApiClient;
//# sourceMappingURL=github-api.d.ts.map