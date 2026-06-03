# npm-package-readme-mcp-server

[![npm version](https://img.shields.io/npm/v/npm-package-readme-mcp-server)](https://www.npmjs.com/package/npm-package-readme-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/npm-package-readme-mcp-server)](https://www.npmjs.com/package/npm-package-readme-mcp-server)
[![GitHub stars](https://img.shields.io/github/stars/naoto24kawa/npm-package-readme-mcp-server)](https://github.com/naoto24kawa/npm-package-readme-mcp-server)
[![GitHub issues](https://img.shields.io/github/issues/naoto24kawa/npm-package-readme-mcp-server)](https://github.com/naoto24kawa/npm-package-readme-mcp-server/issues)
[![license](https://img.shields.io/npm/l/npm-package-readme-mcp-server)](https://github.com/naoto24kawa/npm-package-readme-mcp-server/blob/main/LICENSE)

An MCP server that retrieves README files and usage information for npm packages from the official npm registry.

## Features

- **get_package_readme**: Retrieve README and usage examples for npm packages
- **get_package_info**: Get basic information and dependencies for npm packages  
- **search_packages**: Search for npm packages

## Installation

```bash
npm install -g npm-package-readme-mcp-server
```

## Setup

Add the following to your MCP client configuration file:

```json
{
  "mcpServers": {
    "npm-package-readme": {
      "command": "npm-package-readme-mcp-server"
    }
  }
}
```

Alternative using npx:

```json
{
  "mcpServers": {
    "npm-package-readme": {
      "command": "npx",
      "args": ["npm-package-readme-mcp-server"]
    }
  }
}
```

## Usage

### Get Package README

```
get_package_readme({ "package_name": "react" })
```

### Get Package Information

```
get_package_info({ "package_name": "express" })
```

### Search Packages

```
search_packages({ "query": "testing framework", "limit": 10 })
```

## Environment Variables

- `LOG_LEVEL`: Log level (ERROR, WARN, INFO, DEBUG)
- `CACHE_TTL`: Cache expiration time (seconds)
- `REQUEST_TIMEOUT`: Request timeout (milliseconds)
- `GITHUB_TOKEN`: GitHub API token (optional, to avoid rate limits)
