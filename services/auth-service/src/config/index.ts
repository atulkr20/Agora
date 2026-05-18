import dotenv from 'dotenv'
dotenv.config()

// the use of Object.freeze ensures that the config object cannot be modified at runtime, providing immutability and preventing accidental changes to configuration values.
export const config = Object.freeze({
    port: Number(process.env.PORT) || 3000,
    environment: String(process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    trustProxy: process.env.TRUST_PROXY === 'true', // Convert to boolean, default is false

    mongoURI: String(process.env.MONGO_URI) || 'mongodb://localhost:27017/auth-service',
    mongoDbName: String(process.env.MONGO_DB_NAME) || 'auth-service-db',
    allowed_origins: String(process.env.ALLOWED_ORIGINS) || "http://localhost:4000, http://localhost:4001",

    // token settings
    accessTokenSecret: String(process.env.ACCESS_TOKEN_SECRET) || 'change-me-access-secret',
    refreshTokenSecret: String(process.env.REFRESH_TOKEN_SECRET) || 'change-me-refresh-secret',
    accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS) || 15 * 60, // 15 minutes
    refreshTokenTtlSeconds: Number(process.env.REFRESH_TOKEN_TTL_SECONDS) || 7 * 24 * 60 * 60, // 7 days
    refreshCookieName: String(process.env.REFRESH_COOKIE_NAME) || 'refresh_token',

    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs

    authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000, // 10 minutes
    authRateLimitMaxRequests: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 10 // limit each IP to 10 authentication attempts per windowMs
})
