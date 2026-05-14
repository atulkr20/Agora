import app from "./app";
import { config } from "./config/index.js";
import logger from "./config/logger.js";
import { connectDB, disconnectDB } from "./db/db.js";
let server;
const serverStart = async () => {
    try {
        await connectDB();
        server = app.listen(config.port, () => {
            logger.info(`http://localhost:${config.port}`);
        });
    }
    catch (error) {
        logger.error('Error starting server:', error);
    }
};
const handleShutdown = async (signal) => {
    logger.info(`\nReceived ${signal}. Starting graceful shutdown...`);
    const forceExitTimeout = setTimeout(() => {
        logger.error("Forced shutdown executed: cleanup took too long.");
        process.exit(1);
    }, 10000);
    if (server) {
        logger.info("Stopping HTTP server from accepting new requests...");
        server.close(async (err) => {
            if (err) {
                logger.error("Error while closing HTTP server:", err);
                process.exit(1);
            }
            logger.info("HTTP server closed.");
            try {
                await disconnectDB();
                logger.info("Database connections closed successfully.");
                clearTimeout(forceExitTimeout);
                logger.info("Graceful shutdown completed successfully.");
                process.exit(0);
            }
            catch (cleanupError) {
                logger.error("Error during database/resource cleanup:", cleanupError);
                process.exit(1);
            }
        });
    }
    else {
        process.exit(0);
    }
};
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
serverStart();
//# sourceMappingURL=server.js.map