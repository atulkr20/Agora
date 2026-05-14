import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

import express from 'express';
import { cpuUsage } from 'node:process';

import { config } from './config/index.js';

const app = express();

// Middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));


app.get("/", (_req, res) => {
    res.status(201).json({
        success: true,
        message: "Welcome to Auth Service health check endpoint",
        time: new Date().toISOString(),
        cpuUsage: cpuUsage(),
        environment: config.environment
    })
})

export default app;

