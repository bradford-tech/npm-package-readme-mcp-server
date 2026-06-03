import { logger } from '../utils/logger.js';
export class ReadmeParser {
    parseUsageExamples(readmeContent, includeExamples = true) {
        if (!includeExamples || !readmeContent) {
            return [];
        }
        try {
            const examples = [];
            const sections = this.extractUsageSections(readmeContent);
            for (const section of sections) {
                const sectionExamples = this.extractCodeBlocksFromSection(section);
                examples.push(...sectionExamples);
            }
            const uniqueExamples = this.deduplicateExamples(examples);
            const limitedExamples = uniqueExamples.slice(0, 10);
            logger.debug(`Extracted ${limitedExamples.length} usage examples from README`);
            return limitedExamples;
        }
        catch (error) {
            logger.warn('Failed to parse usage examples from README', { error });
            return [];
        }
    }
    extractUsageSections(content) {
        const sections = [];
        const lines = content.split('\n');
        let currentSection = [];
        let inUsageSection = false;
        let sectionLevel = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const isHeader = /^#{1,6}\s/.test(line);
            if (isHeader) {
                const level = (line.match(/^#+/) || [''])[0].length;
                const isUsageHeader = this.isUsageHeader(line);
                if (isUsageHeader) {
                    if (currentSection.length > 0) {
                        sections.push(currentSection.join('\n'));
                    }
                    currentSection = [line];
                    inUsageSection = true;
                    sectionLevel = level;
                }
                else if (inUsageSection && level <= sectionLevel) {
                    if (currentSection.length > 0) {
                        sections.push(currentSection.join('\n'));
                    }
                    currentSection = [];
                    inUsageSection = false;
                }
                else if (inUsageSection) {
                    currentSection.push(line);
                }
            }
            else if (inUsageSection) {
                currentSection.push(line);
            }
        }
        if (currentSection.length > 0) {
            sections.push(currentSection.join('\n'));
        }
        return sections;
    }
    isUsageHeader(line) {
        return ReadmeParser.USAGE_SECTION_PATTERNS.some(pattern => {
            pattern.lastIndex = 0;
            return pattern.test(line);
        });
    }
    extractCodeBlocksFromSection(section) {
        const examples = [];
        const codeBlockRegex = new RegExp(ReadmeParser.CODE_BLOCK_PATTERN.source, 'g');
        let match;
        while ((match = codeBlockRegex.exec(section)) !== null) {
            const [, language = 'text', code] = match;
            const cleanCode = code.trim();
            if (cleanCode.length === 0) {
                continue;
            }
            const title = this.generateExampleTitle(cleanCode, language);
            const description = this.extractExampleDescription(section, match.index);
            examples.push({
                title,
                description: description || undefined,
                code: cleanCode,
                language: this.normalizeLanguage(language),
            });
        }
        return examples;
    }
    generateExampleTitle(code, language) {
        const firstLine = code.split('\n')[0].trim();
        if (language === 'bash' || language === 'shell' || language === 'sh') {
            if (firstLine.includes('npm install') || firstLine.includes('yarn add') || firstLine.includes('pnpm add')) {
                return 'Installation';
            }
            return 'Command Line Usage';
        }
        if (language === 'javascript' || language === 'js') {
            if (firstLine.includes('require(') || firstLine.includes('import ')) {
                return 'Basic Usage';
            }
            if (code.includes('const') && code.includes('=')) {
                return 'Basic Example';
            }
            return 'JavaScript Example';
        }
        if (language === 'typescript' || language === 'ts') {
            return 'TypeScript Example';
        }
        if (language === 'json') {
            if (code.includes('"scripts"') || code.includes('"dependencies"')) {
                return 'Package Configuration';
            }
            return 'Configuration';
        }
        if (language === 'yaml' || language === 'yml') {
            return 'Configuration';
        }
        return 'Code Example';
    }
    extractExampleDescription(section, codeBlockIndex) {
        const beforeCodeBlock = section.substring(0, codeBlockIndex);
        const lines = beforeCodeBlock.split('\n').reverse();
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length === 0 || trimmed.startsWith('#')) {
                continue;
            }
            if (trimmed.length > 10 && trimmed.length < 200 && !this.looksLikeCode(trimmed)) {
                return trimmed.replace(/^[*-]\s*/, '');
            }
            break;
        }
        return undefined;
    }
    looksLikeCode(text) {
        const codeIndicators = [
            /^\s*[{}[\]();,]/,
            /[{}[\]();,]\s*$/,
            /^\s*(const|let|var|function|class|import|export|require)\s+/,
            /^\s*\$/,
            /^\s*\/\//,
            /^\s*#/,
        ];
        return codeIndicators.some(pattern => pattern.test(text));
    }
    normalizeLanguage(language) {
        const normalized = language.toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'sh': 'bash',
            'shell': 'bash',
            'yml': 'yaml',
            'md': 'markdown',
        };
        return languageMap[normalized] || normalized;
    }
    deduplicateExamples(examples) {
        const seen = new Set();
        const unique = [];
        for (const example of examples) {
            const codeHash = example.code.replace(/\s+/g, ' ').trim();
            if (!seen.has(codeHash)) {
                seen.add(codeHash);
                unique.push(example);
            }
        }
        return unique;
    }
    cleanMarkdown(content) {
        try {
            let cleaned = content;
            cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_match, altText) => {
                return altText && altText.length > 3 ? altText : '';
            });
            cleaned = cleaned.replace(/\[([^\]]+)\]\((?!https?:\/\/)([^)]+)\)/g, '$1');
            cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
            cleaned = cleaned.trim();
            return cleaned;
        }
        catch (error) {
            logger.warn('Failed to clean markdown content', { error });
            return content;
        }
    }
    extractDescription(content) {
        try {
            const lines = content.split('\n');
            let foundDescription = false;
            let description = '';
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.length === 0 || trimmed.startsWith('#')) {
                    if (foundDescription && description.length > 0) {
                        break;
                    }
                    continue;
                }
                if (trimmed.startsWith('![') || trimmed.startsWith('[![')) {
                    continue;
                }
                if (trimmed.length > 20) {
                    if (!foundDescription) {
                        description = trimmed;
                        foundDescription = true;
                    }
                    else {
                        if (description.length + trimmed.length < 300) {
                            description += ' ' + trimmed;
                        }
                        else {
                            break;
                        }
                    }
                }
            }
            return description || 'No description available';
        }
        catch (error) {
            logger.warn('Failed to extract description from README', { error });
            return 'No description available';
        }
    }
}
ReadmeParser.USAGE_SECTION_PATTERNS = [
    /^#{1,6}\s*(usage|use|using|how to use|getting started|quick start|examples?|basic usage)\s*$/gim,
    /^usage:?\s*$/gim,
    /^examples?:?\s*$/gim,
];
ReadmeParser.CODE_BLOCK_PATTERN = /```(\w+)?\n([\s\S]*?)```/g;
export const readmeParser = new ReadmeParser();
//# sourceMappingURL=readme-parser.js.map