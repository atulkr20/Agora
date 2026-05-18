import { ObjectId } from "mongodb";

export enum Role{
    USER = "USER",
    ADMIN = "ADMIN"
}

export interface IUser {
    _id: ObjectId;
    email: string;
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
    refreshTokenHash: string; // hashed version of the refresh token
    ipAddress?: string; // like :- "192.168.1.1"
    userAgent?: string; //like :- chrome, mobile, etc.
    isRevoked: boolean;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

