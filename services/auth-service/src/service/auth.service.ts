import argon2 from "argon2";
import { ObjectId } from "mongodb";

import {
    ECollectionName,
    EDBName,
} from "../db/collection.schema";

import {
    IUser,
    ISession,
    Role
} from "../model/auth.model";

import {
    generateAccessToken,
    generateRefreshToken,
    generateRefreshTokenId,
    hashRefreshToken
} from "../utils/token";

import { getCollection } from "../db/db";
import { generateUsername } from "../utils/generateUsername";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterPayload = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    ipAddress?: string;
    userAgent?: string;
};

export const registerService = async ({
    email,
    password,
    firstName,
    lastName,
    ipAddress,
    userAgent
}: RegisterPayload) => {

    // normalize
    email = email?.toLowerCase().trim();
    firstName = firstName?.trim();
    lastName = lastName?.trim();

    // validation
    if (
        !email ||
        !password ||
        !firstName ||
        !lastName
    ) {
        throw new Error("All fields are required");
    }

    if (!emailRegex.test(email)) {
        throw new Error("Invalid email format");
    }

    if (password.length < 6) {
        throw new Error(
            "Password must be at least 6 characters"
        );
    }

    // collections
    const userColl = await getCollection<IUser>(
        ECollectionName.USERS,
        EDBName.AUTH_SERVICE
    );

    const sessionColl = await getCollection<ISession>(
        ECollectionName.SESSIONS,
        EDBName.AUTH_SERVICE
    );

    // generate username
    let username = generateUsername(
        firstName,
        lastName
    );

    // avoid duplicate username
    let usernameExists = await userColl.findOne({
        username
    });

    while (usernameExists) {

        username = generateUsername(
            firstName,
            lastName
        );

        usernameExists = await userColl.findOne({
            username
        });
    }

    // check existing email
    const emailExists = await userColl.findOne({
        email
    });

    if (emailExists) {
        throw new Error("Email already exists");
    }

    // hash password
    const hashedPassword = await argon2.hash(
        password
    );

    // create user
    const newUser: Omit<IUser, "_id"> = {

        email,
        username,
        firstName,
        lastName,
        password: hashedPassword,
        role: Role.USER,
        isBlocked: false,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const result = await userColl.insertOne(
        newUser as IUser
    );

    const userId = result.insertedId;

    // access token
    const accessToken = generateAccessToken({
        userId: userId.toString(),
        role: Role.USER
    });

    // refresh token
    const refreshToken =
        generateRefreshToken();

    const refreshTokenId =
        generateRefreshTokenId();

    const refreshTokenHash =
        await hashRefreshToken(refreshToken);

    // save session
    const sessionPayload:
        Omit<ISession, "_id"> = {

        userId: new ObjectId(userId),
        Evetntype: "Register",
        
        refreshTokenHash,
        refreshTokenId,

        ipAddress,
        userAgent,

        isRevoked: false,

        lastUsedAt: new Date(),

        expiresAt: new Date(
            Date.now() +
            1000 * 60 * 60 * 24 * 7
        ),

        createdAt: new Date(),
        updatedAt: new Date()
    };

    await sessionColl.insertOne(
        sessionPayload as ISession
    );

    // remove password
    const {
        password: _password,
        ...safeUser
    } = newUser;

    return {

        user: {
            _id: userId,
            ...safeUser
        },

        accessToken,
        refreshToken
    };
};