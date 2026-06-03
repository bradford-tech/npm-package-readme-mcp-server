export declare function handleApiError(error: unknown, context: string): never;
export declare function handleHttpError(status: number, response: Response, context: string): never;
export declare function withRetry<T>(fn: () => Promise<T>, maxRetries?: number, baseDelay?: number, context?: string): Promise<T>;
//# sourceMappingURL=error-handler.d.ts.map