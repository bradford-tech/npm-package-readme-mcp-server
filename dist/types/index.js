export class PackageReadmeMcpError extends Error {
    constructor(message, code, statusCode, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'PackageReadmeMcpError';
    }
}
export class PackageNotFoundError extends PackageReadmeMcpError {
    constructor(packageName) {
        super(`Package '${packageName}' not found`, 'PACKAGE_NOT_FOUND', 404);
    }
}
export class VersionNotFoundError extends PackageReadmeMcpError {
    constructor(packageName, version) {
        super(`Version '${version}' of package '${packageName}' not found`, 'VERSION_NOT_FOUND', 404);
    }
}
export class RateLimitError extends PackageReadmeMcpError {
    constructor(service, retryAfter) {
        super(`Rate limit exceeded for ${service}`, 'RATE_LIMIT_EXCEEDED', 429, { retryAfter });
    }
}
export class NetworkError extends PackageReadmeMcpError {
    constructor(message, originalError) {
        super(`Network error: ${message}`, 'NETWORK_ERROR', undefined, originalError);
    }
}
//# sourceMappingURL=index.js.map