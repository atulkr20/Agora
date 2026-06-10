import rateLimit from 'express-rate-limit';
import { config } from '../config/index';
import logger from '../config/logger';
const skipOperationalRoutes = (req) => {
    return req.method === 'OPTIONS' || req.path === '/health' || req.path === '/dbCheck';
};
const buildRateLimiter = ({ windowMs, maxRequests, message, skipSuccessfulRequests = false, }) => rateLimit({
    windowMs,
    limit: maxRequests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip: skipOperationalRoutes,
    handler: (req, res, _next, options) => {
        logger.warn(`Rate limit exceeded for IP ${req.ip} on ${req.method} ${req.originalUrl}`);
        res.status(options.statusCode).json({
            success: false,
            message,
            retryAfterSeconds: Math.ceil(windowMs / 1000),
        });
    },
});
export const rateLimiterMiddleware = buildRateLimiter({
    windowMs: config.rateLimitWindowMs,
    maxRequests: config.rateLimitMaxRequests,
    message: 'Too many requests from this client. Please try again later.',
});
export const authRateLimiterMiddleware = buildRateLimiter({
    windowMs: config.authRateLimitWindowMs,
    maxRequests: config.authRateLimitMaxRequests,
    message: 'Too many authentication attempts. Please try again later.',
    skipSuccessfulRequests: true,
});
export { buildRateLimiter };
//# sourceMappingURL=ratelimiter.middleware.js.map