# Developer guide

Local development setup for `@bradford-tech/npm-package-readme-mcp-server`.

## Requirements

- Node.js >= 18
- npm (or your package manager of choice)

## Setup

```bash
git clone https://github.com/bradford-tech/npm-package-readme-mcp-server.git
cd npm-package-readme-mcp-server
npm install
```

## Scripts

| Script              | Description                                        |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Run the server directly from TypeScript via `tsx`. |
| `npm run build`     | Compile TypeScript to `dist/`.                     |
| `npm start`         | Run the built server from `dist/`.                 |
| `npm run typecheck` | Type-check without emitting.                       |
| `npm run lint`      | Lint the project with ESLint.                      |
| `npm run format`    | Check formatting with Prettier.                    |
| `npm run fix`       | Apply Prettier + ESLint autofixes.                 |
| `npm test`          | Run the Vitest test suite.                         |

## Project layout

```
src/
├── index.ts                  Entry point — wires signal handlers and starts the server.
├── server.ts                 MCP server class, tool definitions, and request handlers.
├── services/
│   ├── cache.ts              In-memory LRU cache with TTL.
│   ├── github-api.ts         GitHub REST client for README fallback.
│   ├── npm-registry.ts       npm registry client (info, search, downloads).
│   └── readme-parser.ts      Markdown parsing — extracts usage examples.
├── tools/
│   ├── get-package-info.ts   Implements `get_package_info_from_npm`.
│   ├── get-package-readme.ts Implements `get_readme_from_npm`.
│   └── search-packages.ts    Implements `search_packages_from_npm`.
├── types/
│   └── index.ts              Shared interfaces and error classes.
└── utils/
    ├── error-handler.ts      `withRetry`, HTTP error mapping.
    ├── logger.ts             Logger (disabled for MCP stdio compatibility — see below).
    └── validators.ts         Input validators with detailed error messages.
tests/
└── validation.test.ts        Validator unit tests.
```

## Manual smoke test

The server speaks JSON-RPC over stdio. After building, list the available tools:

```bash
npm run build
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js
```

You should see a JSON response listing `get_readme_from_npm`, `get_package_info_from_npm`, and `search_packages_from_npm`.

## Logger note

`src/utils/logger.ts` is intentionally a no-op. Writing to stdout or stderr corrupts the JSON-RPC stream MCP clients read. If you need temporary debugging, write to a file instead of using `console.log`.

## Architecture notes

- **Caching.** The cache is in-process, with a default TTL of 1 hour (search responses get 10 minutes). It uses approximate byte sizing and evicts least-recently-used entries above 100 MB. Cache keys live in `src/services/cache.ts` under `createCacheKey`.
- **Retries.** `withRetry` in `src/utils/error-handler.ts` wraps every outbound HTTP call. It backs off exponentially on network errors and 5xx responses, and honors `Retry-After` on 429.
- **README fallback.** `get_readme_from_npm` first reads the `readme` field from the npm registry response. If empty, it parses the `repository` URL (supports `https://`, `git+https://`, `git://`, and `git@` forms) and fetches `/repos/{owner}/{repo}/readme` from GitHub.
- **GitHub rate limits.** Anonymous GitHub requests are capped at 60/hour. The `GitHubApiClient` accepts a token in its constructor but is currently exported without one (`new GitHubApiClient()`); wiring this to an environment variable is a reasonable contribution.

## Pre-release checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run build` produces a clean `dist/`
- [ ] Bump `version` in `package.json`
- [ ] Update README if user-facing behavior changed
- [ ] `npm publish` (the `prepublishOnly` hook will rebuild)

## Contributing

1. Open an issue describing the change before significant work.
2. Keep validators and error messages consistent with the existing style — concrete suggestions, no jargon.
3. Add Jest tests for new validators or parsers.
4. Run `npm run typecheck && npm run lint && npm test` before opening a PR.
