import app from "./app";
import { config } from "./config/index";
import logger from "./config/logger";
import { connectDB, disconnectDB } from "./db/db";

let server: any

// Server start function is defined as an asynchronous function that attempts to start the Express server on the specified port from the configuration. 
const serverStart = async () => {
    try {
        await connectDB(); // Connect to the database before starting the server
        server = app.listen(config.port, () => {
            logger.info(`http://localhost:${config.port}`)
        });
    } catch (error: any) {
        logger.error('Error starting server:', error);
    }
}

// Graceful shutdown handler function
const handleShutdown = async (signal: string) => {
    logger.info(`\nReceived ${signal}. Starting graceful shutdown...`);

    // 1. Force kill fallback timeout (stops process if stuck)
    const forceExitTimeout = setTimeout(() => {
        logger.error("Forced shutdown executed: cleanup took too long.");
        process.exit(1);
    }, 10000); // 10 seconds

    if (server) {
        logger.info("Stopping HTTP server from accepting new requests...");
        
        // 2. Stop accepting new connections and finish active ones
        server.close(async (err: any) => {
            if (err) {
                logger.error("Error while closing HTTP server:", err);
                process.exit(1);
            }
            logger.info("HTTP server closed.");

            try {
                // 3. PLACEHOLDER: Disconnect databases/queues here if needed
                // await db.disconnect(); 
                await disconnectDB();
                logger.info("Database connections closed successfully.");

                clearTimeout(forceExitTimeout);
                logger.info("Graceful shutdown completed successfully.");
                process.exit(0);
            } catch (cleanupError) {
                logger.error("Error during database/resource cleanup:", cleanupError);
                process.exit(1);
            }
        });
    } else {
        process.exit(0);
    }
};

// Listen for termination signals to trigger graceful shutdown
process.on('SIGINT', () => handleShutdown('SIGINT')); // Handled by cloud hosts/containers
process.on('SIGTERM', () => handleShutdown('SIGTERM'));  // Handled by Ctrl+C in terminal

// Start the server
serverStart();