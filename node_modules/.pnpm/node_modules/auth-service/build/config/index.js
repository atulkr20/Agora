import dotenv from 'dotenv';
dotenv.config();
export const config = Object.freeze({
    port: Number(process.env.PORT) || 3000,
    environment: String(process.env.NODE_ENV) || 'development',
    trustProxy: process.env.TRUST_PROXY === 'true',
    mongoURI: String(process.env.MONGO_URI) || 'mongodb://localhost:27017/auth-service',
    allowed_origins: String(process.env.ALLOWED_ORIGINS) || "http://localhost:4000, http://localhost:4001",
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000,
    authRateLimitMaxRequests: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 10
});
//# sourceMappingURL=index.js.map