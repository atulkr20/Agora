import logger from '../config/logger';
import { Role } from '../model/auth.model';
export const isAdminMiddleware = (req, res, next) => {
    try {
        const user = req.user;
        req.user = user;
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
            return;
        }
        if (user.role !== Role.ADMIN) {
            res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.',
            });
            return;
        }
        next();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown middleware error';
        logger.error(`isAdminMiddleware failed: ${message}`);
        res.status(500).json({
            success: false,
            message: 'Unable to verify admin access right now.',
        });
    }
};
//# sourceMappingURL=isAdmin.middleware.js.map