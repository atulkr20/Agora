import app from "./app.js";
import { config } from "./config/index.js";

let server: any

// Server start function is defined as an asynchronous function that attempts to start the Express server on the specified port from the configuration. 
const serverStart = async () => {
    try {
       server =  app.listen(config.port, () => {
            console.log(`http://localhost:${config.port}`)
        })
    } catch (error: any) {
        console.error('Error starting server:', error);
    }
}

// Graceful shutdown handler function
const handleShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

    // 1. Force kill fallback timeout (stops process if stuck)
    const forceExitTimeout = setTimeout(() => {
        console.error("Forced shutdown executed: cleanup took too long.");
        process.exit(1);
    }, 10000); // 10 seconds

    if (server) {
        console.log("Stopping HTTP server from accepting new requests...");
        
        // 2. Stop accepting new connections and finish active ones
        server.close(async (err: any) => {
            if (err) {
                console.error("Error while closing HTTP server:", err);
                process.exit(1);
            }
            console.log("HTTP server closed.");

            try {
                // 3. PLACEHOLDER: Disconnect databases/queues here if needed
                // await db.disconnect(); 

                clearTimeout(forceExitTimeout);
                console.log("Graceful shutdown completed successfully.");
                process.exit(0);
            } catch (cleanupError) {
                console.error("Error during database/resource cleanup:", cleanupError);
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