import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '../config';
import { IUser } from "../model/auth.model";
import { ECollectionName, EDBName } from "../db/collection.schema"
import logger from '../config/logger';
import { getCollection } from '../db/db';
import { ObjectId } from 'mongodb';

export const userAuthenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            res.status(401).json(
                {
                    success: false,
                    message: "Unauthorized: No token provided"
                }
            )
            return;
        }

        const decoded = jwt.verify(token, config.accessTokenSecret) as { userId: string };

        const userColl = await getCollection<IUser>(
            ECollectionName.USERS,
            EDBName.AUTH_SERVICE,
        )

        const currentUser = await userColl.findOne(
            {
                _id: new ObjectId(decoded.userId)
            }
        )

        if (!currentUser) {
            res.status(401).json(
                {
                    success: false,
                    message: "The user associated with this token does not exist"
                }
            )
            return;
        }

        (req as any).user = currentUser;
        next();

    } catch (error: any) {
        logger.error("Error in user authentication middleware: ", error.message);

        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json(
                {
                    success: false,
                    message: "Invalid token"
                }
            )
            return;
        }

        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json(
                {
                    success: false,
                    message: "Token expired"
                }
            )
            return;
        }

        res.status(500).json(
            {
                success: false,
                message: "Authentication failed"
            }
        )
        return;
    }
}