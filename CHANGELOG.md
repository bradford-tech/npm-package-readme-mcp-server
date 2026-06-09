# Changelog

## [0.2.0](https://github.com/bradford-tech/npm-package-readme-mcp-server/compare/npm-package-readme-mcp-server-v0.1.6...npm-package-readme-mcp-server-v0.2.0) (2026-06-09)


### ⚠ BREAKING CHANGES

* **server:** prompts/list and resources/list now return MethodNotFound rather than empty arrays. McpServer advertises capabilities only for handlers that are registered, and this server registers neither prompts nor resources. Spec-compliant clients should not call methods for unadvertised capabilities, so most clients will be unaffected; any client relying on the previous empty-array responses must check the server's advertised capabilities first.

### Code Refactoring

* **server:** migrate to McpServer high-level API ([c127187](https://github.com/bradford-tech/npm-package-readme-mcp-server/commit/c127187a0466998d653baa69c772e6031bbcddf5))

## [0.1.6](https://github.com/bradford-tech/npm-package-readme-mcp-server/compare/npm-package-readme-mcp-server-v0.1.5...npm-package-readme-mcp-server-v0.1.6) (2026-06-08)


### Bug Fixes

* **cache:** enforce maxSize via incremental size tracking ([6a41fdb](https://github.com/bradford-tech/npm-package-readme-mcp-server/commit/6a41fdb9ed7deaed1aeaab6a1eac1090101a3f6b))
* **tools:** emit full "npm install" command instead of bare "install" ([5dcf381](https://github.com/bradford-tech/npm-package-readme-mcp-server/commit/5dcf381cd7d1a803be824a21fbc1b2691573fc56))

## [0.1.5](https://github.com/bradford-tech/npm-package-readme-mcp-server/compare/npm-package-readme-mcp-server-v0.1.4...npm-package-readme-mcp-server-v0.1.5) (2026-06-07)


### Bug Fixes

* **config:** honor CACHE_TTL, REQUEST_TIMEOUT, GITHUB_TOKEN env vars ([4c358d4](https://github.com/bradford-tech/npm-package-readme-mcp-server/commit/4c358d41d0a61d9bfd8a2cd3c35c8004c037d3ce))
* **errors:** distinguish package-not-found from other failures ([1ab79ae](https://github.com/bradford-tech/npm-package-readme-mcp-server/commit/1ab79ae7b17ccec18b4d031d91948f0cd0b5b2fe))
* **logger:** write to stderr and honor LOG_LEVEL ([f8ffaa0](https://github.com/bradford-tech/npm-package-readme-mcp-server/commit/f8ffaa0a3373dab75078258fa2ca0065eb9fc816))
* **validators:** correct two input edge cases ([2c2831f](https://github.com/bradford-tech/npm-package-readme-mcp-server/commit/2c2831f66cfe7db20b3c65958a77ce771fd1cade))
