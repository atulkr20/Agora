import jwt from "jsonwebtoken";
import crypto from "crypto";
import argon2 from "argon2";

import { config } from "../config";

type AccessTokenPayload = {
    userId: string;
    role: string;
};

export const generateAccessToken = (
    payload: AccessTokenPayload
) => {
    return jwt.sign(
        payload,
        config.accessTokenSecret,
        {
            expiresIn: "15m"
        }
    );
};

export const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString("hex");
};

export const generateRefreshTokenId = () => {
    return crypto.randomUUID();
};

export const hashRefreshToken = async (
    refreshToken: string
) => {
    return await argon2.hash(refreshToken);
};

export const verifyAccessToken = (
    token: string
) => {
    return jwt.verify(
        token,
        config.accessTokenSecret
    );
};