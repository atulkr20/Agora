import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

import express from 'express';
import { cpuUsage } from 'node:process';

import { config } from './config/index';

const app = express();

// Middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));


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
app.get("/db-check", async (_req, res) => {
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

export default app;

