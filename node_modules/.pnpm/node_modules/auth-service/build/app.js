import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);
import express from 'express';
import morgan from 'morgan';
import { cpuUsage } from 'node:process';
import { config } from './config/index';
import logger from './config/logger';
import authRoutes from './apiRoutes';
import helmet from 'helmet';
import { corsMiddleware } from './middleware/cors.middleware';
import { rateLimiterMiddleware } from './middleware/ratelimiter.middleware';
const app = express();
app.set('trust proxy', config.trustProxy);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(helmet());
app.use(corsMiddleware);
app.use(morgan((tokens, req, res) => {
    if (req.url === "/favicon.ico") {
        return null;
    }
    return `${tokens.method?.(req, res)} ${tokens.url?.(req, res)} ${tokens.status?.(req, res)}`;
}, {
    stream: {
        write: (message) => {
            logger.http(message.trim());
        },
    },
}));
app.get("/health", (_req, res) => {
    res.status(201).json({
        success: true,
        message: "Welcome to Auth Service health check endpoint",
        time: new Date().toISOString(),
        cpuUsage: cpuUsage(),
        environment: config.environment
    });
});
app.get("/dbCheck", async (_req, res) => {
    try {
        const { connectDB } = await import('./db/db.js');
        await connectDB();
        res.status(200).json({
            success: true,
            message: "Database connection is healthy"
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Database connection check failed"
        });
    }
});
app.use("/api", rateLimiterMiddleware, authRoutes);
export default app;
//# sourceMappingURL=app.js.map