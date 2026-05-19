import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

import express from 'express';
import morgan from 'morgan';
import { cpuUsage } from 'node:process';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import requestIp from 'request-ip';

import { config } from './config/index';
import logger from './config/logger';
import { corsMiddleware } from './middleware/cors.middleware';
import { rateLimiterMiddleware } from './middleware/ratelimiter.middleware';
import authRoutes from './apiRoutes';

const app = express();

// Trust proxy settings for correct client IP detection when behind a proxy
app.set('trust proxy', config.trustProxy);

// Middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(helmet());
app.use(cookieParser()); // for parsing cookies in incoming requests
app.use(requestIp.mw()); // for attaching client IP to request object (req.clientIp)

// CORS configuration - allowing requests from specific origins
app.use(corsMiddleware);

// HTTP request logger  development environment
app.use(
    morgan(
        (tokens, req, res) => {
            if (req.url === "/favicon.ico") {
                return null; // Skip logging for favicon requests
            }
            return `${tokens.method?.(req, res)} ${tokens.url?.(req, res)} ${tokens.status?.(req, res)}`;
        },
        {
            stream: {
                write: (message: string) => {
                    logger.http(message.trim());
                },
            },
        },
    )
)

// Health check endpoint to verify server is running and provide basic info
app.get("/health", (_req, res) => {
    res.status(201).json({
        success: true,
        message: "Welcome to Auth Service health check endpoint",
        time: new Date().toISOString(),
        cpuUsage: cpuUsage(),
        environment: config.environment
    })
})

// Database health check endpoint
app.get("/dbCheck", async (_req, res) => {
    try {
        const { connectDB } = await import('./db/db.js');
        await connectDB();
        res.status(200).json({
            success: true,
            message: "Database connection is healthy"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database connection check failed"
        });
    }
});

// API routes
app.use("/api", rateLimiterMiddleware, authRoutes);

export default app;

