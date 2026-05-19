import jwt from "jsonwebtoken";
import crypto from "crypto";
import argon2 from "argon2";

import { config } from "../config";

type AccessTokenPayload = {
    userId: string;
    role: string;
};

//  Access Token 
export const generateAccessToken = (payload: AccessTokenPayload): string => {
    return jwt.sign(payload, config.accessTokenSecret, {
        expiresIn: Math.floor(config.accessTokenTtlMs / 1000), // seconds mein
    });
};

export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, config.accessTokenSecret) as AccessTokenPayload & {
        iat: number;
        exp: number;
    };
};

//  Refresh Token 
/**
 * Raw refresh token — 64 random bytes, hex encoded.
 * Cookie mein store hoga: "<refreshTokenId>.<rawToken>"
 */
export const generateRefreshToken = (): string => {
    return crypto.randomBytes(64).toString("hex");
};

/**
 * UUID — session ko DB mein fast lookup karne ke liye index pe use hoga.
 * Bina iske poora sessions collection scan karna padta.
 */
export const generateRefreshTokenId = (): string => {
    return crypto.randomUUID();
};

export const hashRefreshToken = async (token: string): Promise<string> => {
    return argon2.hash(token);
};

export const verifyRefreshTokenHash = async (
    rawToken: string,
    hash: string
): Promise<boolean> => {
    return argon2.verify(hash, rawToken);
};

/**
 * Cookie value encode/decode helpers.
 * Format stored in cookie: "<id>.<rawToken>"
 */
export const encodeRefreshTokenCookie = (id: string, rawToken: string): string => {
    return `${id}.${rawToken}`;
};

export const decodeRefreshTokenCookie = (
    cookieValue: string
): { refreshTokenId: string; rawToken: string } | null => {
    const dotIndex = cookieValue.indexOf(".");
    if (dotIndex === -1) return null;

    const refreshTokenId = cookieValue.substring(0, dotIndex);
    const rawToken = cookieValue.substring(dotIndex + 1);

    if (!refreshTokenId || !rawToken) return null;
    return { refreshTokenId, rawToken };
};