# @bradford-tech/npm-package-readme-mcp-server

An MCP server that exposes npm registry data — package READMEs, metadata, and search — to MCP-compatible AI clients.

> This is a maintained fork of [`naoto24kawa/npm-package-readme-mcp-server`](https://github.com/naoto24kawa/npm-package-readme-mcp-server), republished under the `@bradford-tech` scope after the original was removed from GitHub and npm. No functional changes from the upstream `0.1.4` release.

## Install

```bash
npm install -g @bradford-tech/npm-package-readme-mcp-server
```

Also works with `pnpm add -g`, `yarn global add`, or via `npx` (no install needed).

## Configure your MCP client

Add the server to your client's MCP configuration:

```json
{
  "mcpServers": {
    "npm-package-readme": {
      "command": "npm-package-readme-mcp-server"
    }
  }
}
```

Or run on demand with `npx`:

```json
{
  "mcpServers": {
    "npm-package-readme": {
      "command": "npx",
      "args": ["-y", "@bradford-tech/npm-package-readme-mcp-server"]
    }
  }
}
```

## Tools

The server exposes three tools to the connected client.

### `get_readme_from_npm`

Fetches a package's README and extracts usage examples. Reads from the npm registry first, falls back to the linked GitHub repository.

| Parameter          | Type    | Default    | Description                                                |
| ------------------ | ------- | ---------- | ---------------------------------------------------------- |
| `package_name`     | string  | —          | The npm package name (required).                           |
| `version`          | string  | `"latest"` | Specific version or dist-tag.                              |
| `include_examples` | boolean | `true`     | Parse and return usage examples extracted from the README. |

Example call:

```json
{ "package_name": "react", "version": "18.2.0" }
```

### `get_package_info_from_npm`

Returns package metadata and download statistics for the latest version.

| Parameter                  | Type    | Default | Description                      |
| -------------------------- | ------- | ------- | -------------------------------- |
| `package_name`             | string  | —       | The npm package name (required). |
| `include_dependencies`     | boolean | `true`  | Include runtime dependencies.    |
| `include_dev_dependencies` | boolean | `false` | Include dev dependencies.        |

Example call:

```json
{ "package_name": "express", "include_dependencies": true }
```

### `search_packages_from_npm`

Searches the npm registry.

| Parameter    | Type   | Default | Description                    |
| ------------ | ------ | ------- | ------------------------------ |
| `query`      | string | —       | Search text (required).        |
| `limit`      | number | `20`    | Max results, 1–250.            |
| `quality`    | number | —       | Minimum quality score, 0–1.    |
| `popularity` | number | —       | Minimum popularity score, 0–1. |

Example call:

```json
{ "query": "testing framework", "limit": 10 }
```

## How package data is fetched

- Package metadata and READMEs come from `registry.npmjs.org`.
- If the registry response has no README, the server resolves the `repository` field and fetches the README from the GitHub API.
- Download statistics come from `api.npmjs.org/downloads`.
- Responses are cached in memory (default TTL: 1 hour; search results: 10 minutes).

GitHub anonymous API requests are rate-limited to 60/hour. The server logs a warning when no token is available but still works for low-volume use.

## Requirements

- Node.js >= 18

## Contributing

Issues and pull requests welcome at [bradford-tech/npm-package-readme-mcp-server](https://github.com/bradford-tech/npm-package-readme-mcp-server). See [`README.dev.md`](./README.dev.md) for the developer setup.

## License

MIT. See [`LICENSE`](./LICENSE).
