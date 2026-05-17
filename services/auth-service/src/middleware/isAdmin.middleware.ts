import { NextFunction, Request, Response } from 'express';
import logger from '../config/logger';
import { Role } from '../model/auth.model';


export const isAdminMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    try {

        const user = (req as any).user;
        (req as any).user = user; // Ensure req.user is typed correctly

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
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : 'Unknown middleware error';

        logger.error(`isAdminMiddleware failed: ${message}`);

        res.status(500).json({
            success: false,
            message: 'Unable to verify admin access right now.',
        });
    }
};
