import { ObjectId } from "mongodb";

export enum Role{
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
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ISession {
    _id: ObjectId;
    userId: ObjectId;
    Evetntype: string; // like :- login, logout, passwordChange, etc.
    refreshTokenHash: string; // hashed version of the refresh token
    refreshTokenId: string;
    ipAddress?: string; // like :- "192.168.1.1"
    userAgent?: string; //like :- chrome, mobile, etc.
    isRevoked: boolean; // whether the session is revoked
    lastUsedAt?: Date; // when the refresh token was last used
    revokedAt?: Date; // when the session was revoked
    expiresAt: Date; // when the refresh token expires
    createdAt: Date;
    updatedAt: Date;
}
