import { ObjectId } from "mongodb";

export enum Role {
    USER = "USER",
    ADMIN = "ADMIN"
}
export interface IUser {
    _id: ObjectId;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    role: Role;
    isBlocked: boolean;
    phoneNumber?: string;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ISession {
    _id: ObjectId;
    userId: ObjectId;

    /**
     * Login | Register | Refresh | Logout
     */
    eventType: string;

    /**
     * Argon2 hash of the raw refresh token stored in cookie.
     * Direct string compare nahi hoga — argon2.verify() use hoga.
     */
    refreshTokenHash: string;

    /**
     * UUID jo hum raw refresh token ke saath cookie mein encode karte hain.
     * Format: "<refreshTokenId>.<rawToken>"
     *
     * Kyun chahiye?
     * - DB mein sirf hash store hai, seedha find nahi ho sakta.
     * - refreshTokenId se pehle session dhundho (fast O(1) indexed lookup),
     *   phir argon2.verify() se hash validate karo.
     * - Bina id ke poore collection ka scan karna padta.
     */
    refreshTokenId: string;

    ipAddress?: string;
    userAgent?: string;

    /**
     * true hone par token invalid — logout / rotation / logoutAll ke baad set hota hai.
     */
    isRevoked: boolean;

    lastUsedAt?: Date; // session ke last use hone ka time — login, refresh, logout sab update karenge
    revokedAt?: Date; // token revoke hone ka time — logout ya refresh ke baad set hoga
    expiresAt: Date; // token expire hone ka time — session create karte waqt set hoga, refresh ke baad update hoga
    createdAt: Date;
    updatedAt: Date;
}