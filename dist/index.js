#!/usr/bin/env node
import { logger } from './utils/logger.js';
import { cache } from './services/cache.js';
import PackageReadmeMcpServer from './server.js';
async function main() {
    let server = null;
    try {
        logger.info('Initializing package-readme-mcp server');
        server = new PackageReadmeMcpServer();
        await server.run();
    }
    catch (error) {
        logger.error('Failed to start server', { error });
        process.exit(1);
    }
    const handleShutdown = async (signal) => {
        logger.info(`Received ${signal}, shutting down gracefully`);
        try {
            if (server) {
                await server.stop();
            }
            cache.destroy();
            logger.info('Server shutdown complete');
            process.exit(0);
        }
        catch (error) {
            logger.error('Error during shutdown', { error });
            process.exit(1);
        }
    };
    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught exception', { error });
        process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled rejection', { reason, promise });
        process.exit(1);
    });
}
main().catch((error) => {
    logger.error('Failed to start application', { error });
    process.exit(1);
});
//# sourceMappingURL=index.js.map