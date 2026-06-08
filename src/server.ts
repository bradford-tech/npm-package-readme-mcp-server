import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { getPackageInfo } from './tools/get-package-info.js';
import { getPackageReadme } from './tools/get-package-readme.js';
import { searchPackages } from './tools/search-packages.js';
import { PackageReadmeMcpError } from './types/index.js';
import { logger } from './utils/logger.js';

function mapErrorCode(code: string): ErrorCode {
  switch (code) {
    case 'PACKAGE_NOT_FOUND':
    case 'VERSION_NOT_FOUND':
      return ErrorCode.InvalidRequest;
    case 'INVALID_PACKAGE_NAME':
    case 'INVALID_VERSION':
    case 'INVALID_SEARCH_QUERY':
    case 'INVALID_LIMIT':
    case 'INVALID_SCORE':
      return ErrorCode.InvalidParams;
    default:
      return ErrorCode.InternalError;
  }
}

function rethrowAsMcpError(error: unknown, toolName: string): never {
  if (error instanceof PackageReadmeMcpError) {
    throw new McpError(mapErrorCode(error.code), error.message, error.details);
  }
  if (error instanceof McpError) {
    throw error;
  }
  throw new McpError(
    ErrorCode.InternalError,
    `Internal error in ${toolName}: ${error instanceof Error ? error.message : String(error)}`,
  );
}

function jsonContent(result: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

export class PackageReadmeMcpServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer({
      name: 'package-readme-mcp',
      version: '1.0.0',
    });

    this.registerTools();
  }

  private registerTools(): void {
    this.server.registerTool(
      'get_readme_from_npm',
      {
        description: 'Get package README and usage examples from npm registry',
        inputSchema: {
          package_name: z.string().describe('The name of the npm package'),
          version: z
            .string()
            .default('latest')
            .describe('The version of the package'),
          include_examples: z
            .boolean()
            .default(true)
            .describe('Whether to include usage examples'),
        },
      },
      async (args) => {
        try {
          const result = await getPackageReadme(args);
          return jsonContent(result);
        } catch (error) {
          logger.error('Tool execution failed: get_readme_from_npm', {
            error,
            args,
          });
          rethrowAsMcpError(error, 'get_readme_from_npm');
        }
      },
    );

    this.server.registerTool(
      'get_package_info_from_npm',
      {
        description:
          'Get package basic information and dependencies from npm registry',
        inputSchema: {
          package_name: z.string().describe('The name of the npm package'),
          include_dependencies: z
            .boolean()
            .default(true)
            .describe('Whether to include dependencies'),
          include_dev_dependencies: z
            .boolean()
            .default(false)
            .describe('Whether to include development dependencies'),
        },
      },
      async (args) => {
        try {
          const result = await getPackageInfo(args);
          return jsonContent(result);
        } catch (error) {
          logger.error('Tool execution failed: get_package_info_from_npm', {
            error,
            args,
          });
          rethrowAsMcpError(error, 'get_package_info_from_npm');
        }
      },
    );

    this.server.registerTool(
      'search_packages_from_npm',
      {
        description: 'Search for packages in npm registry',
        inputSchema: {
          query: z.string().describe('The search query'),
          limit: z
            .number()
            .int()
            .min(1)
            .max(250)
            .default(20)
            .describe('Maximum number of results to return'),
          quality: z
            .number()
            .min(0)
            .max(1)
            .optional()
            .describe('Minimum quality score (0-1)'),
          popularity: z
            .number()
            .min(0)
            .max(1)
            .optional()
            .describe('Minimum popularity score (0-1)'),
        },
      },
      async (args) => {
        try {
          const result = await searchPackages(args);
          return jsonContent(result);
        } catch (error) {
          logger.error('Tool execution failed: search_packages_from_npm', {
            error,
            args,
          });
          rethrowAsMcpError(error, 'search_packages_from_npm');
        }
      },
    );
  }

  async run(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
    } catch (error) {
      logger.error('Failed to start server transport', { error });
      throw error;
    }
  }

  async stop(): Promise<void> {
    await this.server.close();
  }
}

export default PackageReadmeMcpServer;
