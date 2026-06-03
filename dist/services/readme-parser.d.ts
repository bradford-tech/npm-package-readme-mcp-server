import { UsageExample } from '../types/index.js';
export declare class ReadmeParser {
    private static readonly USAGE_SECTION_PATTERNS;
    private static readonly CODE_BLOCK_PATTERN;
    parseUsageExamples(readmeContent: string, includeExamples?: boolean): UsageExample[];
    private extractUsageSections;
    private isUsageHeader;
    private extractCodeBlocksFromSection;
    private generateExampleTitle;
    private extractExampleDescription;
    private looksLikeCode;
    private normalizeLanguage;
    private deduplicateExamples;
    cleanMarkdown(content: string): string;
    extractDescription(content: string): string;
}
export declare const readmeParser: ReadmeParser;
//# sourceMappingURL=readme-parser.d.ts.map