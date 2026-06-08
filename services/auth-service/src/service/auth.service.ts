import argon2 from "argon2";
import { ObjectId } from "mongodb";

import { ECollectionName, EDBName } from "../db/collection.schema";
import { IUser, ISession, Role } from "../model/auth.model";
import {
    generateAccessToken,
    generateRefreshToken,
    generateRefreshTokenId,
    hashRefreshToken,
    verifyRefreshTokenHash,
    encodeRefreshTokenCookie,
    decodeRefreshTokenCookie,
} from "../utils/token";
import { getCollection } from "../db/db";
import { generateUsername } from "../utils/generateUsername";
import { config } from "../config";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//  Helpers 

/**
 * Naya refresh token + session banata hai aur encoded cookie value return karta hai.
 * Register, Login, aur Refresh teen jagah use hota hai — DRY rakhne ke liye.
 */
const createSession = async ({
    userId,
    eventType,
    ipAddress,
    userAgent,
    sessionColl,
}: {
    userId: ObjectId;
    eventType: string;
    ipAddress?: string;
    userAgent?: string;
    sessionColl: Awaited<ReturnType<typeof getCollection<ISession>>>;
}): Promise<{ refreshTokenCookieValue: string }> => {
    const rawRefreshToken = generateRefreshToken();
    const refreshTokenId = generateRefreshTokenId();
    const refreshTokenHash = await hashRefreshToken(rawRefreshToken);

    const sessionPayload: Omit<ISession, "_id"> = {
        userId,
        eventType,
        refreshTokenHash,
        refreshTokenId,
        ipAddress,
        userAgent,
        isRevoked: false,
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + config.refreshTokenTtlMs), // 7 days
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await sessionColl.insertOne(sessionPayload as ISession);

    return {
        refreshTokenCookieValue: encodeRefreshTokenCookie(refreshTokenId, rawRefreshToken),
    };
};

//  Register 
type RegisterPayload = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    ipAddress?: string;
    userAgent?: string;
};

export const registerService = async ({
    email,
    password,
    firstName,
    lastName,
    phoneNumber,
    ipAddress,
    userAgent,
}: RegisterPayload) => {
    // Normalize
    email = email?.toLowerCase().trim();
    firstName = firstName?.trim();
    lastName = lastName?.trim();

    // Validation
    if (!email || !password || !firstName || !lastName || !phoneNumber) {
        throw new Error("All fields are required");
    }
    if (!emailRegex.test(email)) {
        throw new Error("Invalid email format. Example: user@domain.com");
    }
    if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
    }

    const userColl = await getCollection<IUser>(ECollectionName.USERS, EDBName.AUTH_SERVICE);
    const sessionColl = await getCollection<ISession>(ECollectionName.SESSIONS, EDBName.AUTH_SERVICE);

    // Unique username generate karo
    let username = generateUsername(firstName, lastName);
    while (await userColl.findOne({ username })) {
        username = generateUsername(firstName, lastName);
    }

    // Email duplicate check
    if (await userColl.findOne({ email })) {
        throw new Error("Email already registered");
    }

    const hashedPassword = await argon2.hash(password);

    const newUser: Omit<IUser, "_id"> = {
        firstName,
        lastName,
        email,
        phoneNumber,
        username,
        password: hashedPassword,
        role: Role.USER,
        isBlocked: false,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await userColl.insertOne(newUser as IUser);
    const userId = result.insertedId;

    const accessToken = generateAccessToken({
        userId: userId.toString(),
        role: Role.USER,
    });

    const { refreshTokenCookieValue } = await createSession({
        userId,
        eventType: "Register",
        ipAddress,
        userAgent,
        sessionColl,
    });

    const { password: _pwd, ...safeUser } = newUser;

    return {
        user: { _id: userId, ...safeUser },
        accessToken,
        refreshTokenCookieValue,
    };
};

//  Login 
type LoginPayload = {
    email?: string;
    password: string;
    phoneNumber?: string;
    ipAddress?: string;
    userAgent?: string;
};

export const loginService = async ({
    email,
    phoneNumber,
    password,
    ipAddress,
    userAgent,
}: LoginPayload) => {
    email = email?.toLowerCase().trim();

    if (!password) throw new Error("Password is required");
    if (!email && !phoneNumber) throw new Error("Either email or phone number is required");
    if (email) {
        email = email.toLowerCase().trim();

        if (!emailRegex.test(email)) {
            throw new Error("Invalid email format");
        }
    }

    const userColl = await getCollection<IUser>(ECollectionName.USERS, EDBName.AUTH_SERVICE);
    const sessionColl = await getCollection<ISession>(ECollectionName.SESSIONS, EDBName.AUTH_SERVICE);

    const query = email
        ? { email }
        : { phoneNumber };

    const user = await userColl.findOne(query);
    if (!user) throw new Error("Invalid credentials");
    if (user.isBlocked) throw new Error("Account is blocked");

    const passwordValid = await argon2.verify(user.password, password);
    if (!passwordValid) throw new Error("Invalid credentials");

    const accessToken = generateAccessToken({
        userId: user._id.toString(),
        role: user.role || Role.USER,
    });

    const { refreshTokenCookieValue } = await createSession({
        userId: new ObjectId(user._id),
        eventType: "Login",
        ipAddress,
        userAgent,
        sessionColl,
    });

    await userColl.updateOne(
        { _id: new ObjectId(user._id) },
        { $set: { lastLoginAt: new Date(), updatedAt: new Date() } }
    );

    const { password: _pwd, ...safeUser } = user as any;

    return {
        user: safeUser,
        accessToken,
        refreshTokenCookieValue,
    };
};

//  Refresh Token (with Rotation) 
type RefreshPayload = {
    refreshTokenCookieValue: string;
    ipAddress?: string;
    userAgent?: string;
};

export const refreshTokenService = async ({
    refreshTokenCookieValue,
    ipAddress,
    userAgent,
}: RefreshPayload) => {
    // Cookie decode karo
    const decoded = decodeRefreshTokenCookie(refreshTokenCookieValue);
    if (!decoded) throw new Error("Invalid refresh token");

    const { refreshTokenId, rawToken } = decoded;

    const sessionColl = await getCollection<ISession>(ECollectionName.SESSIONS, EDBName.AUTH_SERVICE);
    const userColl = await getCollection<IUser>(ECollectionName.USERS, EDBName.AUTH_SERVICE);

    // refreshTokenId se session dhundho (indexed — fast O(1) lookup)
    const session = await sessionColl.findOne({ refreshTokenId });

    if (!session) throw new Error("Session not found");
    if (session.isRevoked) throw new Error("Session has been revoked");
    if (session.expiresAt < new Date()) throw new Error("Refresh token expired");

    // Hash verify karo (argon2 slow hai — but security ke liye zaroori)
    const tokenValid = await verifyRefreshTokenHash(rawToken, session.refreshTokenHash);
    if (!tokenValid) throw new Error("Invalid refresh token");

    // User fetch karo
    const user = await userColl.findOne({ _id: new ObjectId(session.userId) });
    if (!user) throw new Error("User not found");
    if (user.isBlocked) throw new Error("Account is blocked");

    // ── Token Rotation ──
    // Step 1: Purana session revoke karo
    await sessionColl.updateOne(
        { _id: session._id },
        {
            $set: {
                isRevoked: true,
                revokedAt: new Date(),
                updatedAt: new Date(),
                eventType: "Rotated",
            },
        }
    );

    // Step 2: Naya access token
    const newAccessToken = generateAccessToken({
        userId: user._id.toString(),
        role: user.role,
    });

    // Step 3: Naya session + refresh token
    const { refreshTokenCookieValue: newRefreshTokenCookieValue } = await createSession({
        userId: new ObjectId(user._id),
        eventType: "Refresh",
        ipAddress,
        userAgent,
        sessionColl,
    });

    return {
        accessToken: newAccessToken,
        refreshTokenCookieValue: newRefreshTokenCookieValue,
    };
};

//  Logout 
type LogoutPayload = {
    refreshTokenCookieValue: string;
};

export const logoutService = async ({ refreshTokenCookieValue }: LogoutPayload) => {
    const decoded = decodeRefreshTokenCookie(refreshTokenCookieValue);
    if (!decoded) throw new Error("Invalid refresh token");

    const { refreshTokenId, rawToken } = decoded;

    const sessionColl = await getCollection<ISession>(ECollectionName.SESSIONS, EDBName.AUTH_SERVICE);

    const session = await sessionColl.findOne({ refreshTokenId });

    // Session na mile ya already revoked — silently succeed (idempotent logout)
    if (!session || session.isRevoked) return;

    // Token verify karo — doosre user ka session revoke na ho jaye
    const tokenValid = await verifyRefreshTokenHash(rawToken, session.refreshTokenHash);
    if (!tokenValid) throw new Error("Invalid refresh token");

    await sessionColl.updateOne(
        { _id: session._id },
        {
            $set: {
                isRevoked: true,
                revokedAt: new Date(),
                updatedAt: new Date(),
                eventType: "Logout",
            },
        }
    );
};

//  Logout All 
type LogoutAllPayload = {
    userId: string;
};

export const logoutAllService = async ({ userId }: LogoutAllPayload) => {
    const sessionColl = await getCollection<ISession>(ECollectionName.SESSIONS, EDBName.AUTH_SERVICE);

    // Is user ke saare active sessions ek saath revoke karo
    await sessionColl.updateMany(
        {
            userId: new ObjectId(userId),
            isRevoked: false,
        },
        {
            $set: {
                isRevoked: true,
                revokedAt: new Date(),
                updatedAt: new Date(),
                eventType: "LogoutAll",
            },
        }
    );
};

// get Me 
type GetMePayload = {
    userId: string;
};

export const getMeService = async ({ userId }: GetMePayload) => {

    const userColl = await getCollection<IUser>(
        ECollectionName.USERS,
        EDBName.AUTH_SERVICE,
    );

    const userProfile = await userColl.aggregate([
        {
            $match: {
                _id: new ObjectId(userId),
            },
        },
        {
            $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                username: 1,
                email: 1,
                role: 1,
                lastLoginAt: 1,
            },
        },
    ]).toArray();

    return userProfile[0];
};

// update Me
type UpdateMePayload = {
    userId: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    username?: string;
}

export const updateMeService = async ({
    userId,
    firstName,
    lastName,
    phoneNumber,
    username,
}: UpdateMePayload) => {

    const userColl = await getCollection<IUser>(
        ECollectionName.USERS,
        EDBName.AUTH_SERVICE
    );

    const update: Partial<IUser> = {};

    if (firstName !== undefined)
        update.firstName = firstName.trim();

    if (lastName !== undefined)
        update.lastName = lastName.trim();

    if (phoneNumber !== undefined)
        update.phoneNumber = phoneNumber;

    if (username !== undefined)
        update.username = username.trim();

    if (Object.keys(update).length === 0) {
        throw new Error("No fields to update");
    }

    const updatedUser = await userColl.findOneAndUpdate(
        {
            _id: new ObjectId(userId),
        },
        {
            $set: {
                ...update,
                updatedAt: new Date(),
            },
        },
        {
            returnDocument: "after",
        }
    );

    if (!updatedUser) {
        throw new Error("User not found");
    }

    const { password: _pwd, ...safeUser } = updatedUser;

    return safeUser;
};

// get all users (Admin)
export const adminGetAllUsersService = async () => {
    const userColl = await getCollection<IUser>(
        ECollectionName.USERS,
        EDBName.AUTH_SERVICE
    )

    const userInfo = await userColl.aggregate([
        {
            $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
                role: 1,
                isBlocked: 1,
                lastLoginAt: 1,
            }
        }
    ]).toArray();

    return userInfo;
}

// admin block user
export const adminBlockUserService = async (userId: string) => {
    const userColl = await getCollection<IUser>(
        ECollectionName.USERS,
        EDBName.AUTH_SERVICE
    )

    const existingUser = await userColl.findOne({ _id: new ObjectId(userId) });

    if (!existingUser) {
        throw new Error("User not found");
    }

    await userColl.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { isBlocked: true } }
    );

}

export const changePasswordService = async (userId: string, oldPassword: string, newPassword: string): Promise<void> => {

    if (oldPassword === newPassword) {
        throw new Error("Old password and new password cannot be same");
    }

    const userColl = await getCollection<IUser>(
        ECollectionName.USERS,
        EDBName.AUTH_SERVICE
    );

    const user = await userColl.findOne({ _id: new ObjectId(userId) });

    if (!user) {
        throw new Error("User not found");
    }

    const passwordValid = await argon2.verify(user.password, oldPassword);

    if (!passwordValid) {
        throw new Error("Invalid credentials");
    }

    const hashedPassword = await argon2.hash(newPassword);

    await userColl.updateOne(
        { _id: new ObjectId(userId) },
        {
            $set: {
                password: hashedPassword,
                updatedAt: new Date()
            }
        }
    )
}

/**
 flow 
 user -> FP -> emailEntered -> verify -> then fill new password --> change password 
 */

export const forgotPasswordService = async (email: string, newPassword: string): Promise<void> => {
    const userColl = await getCollection<IUser>(
        ECollectionName.USERS,
        EDBName.AUTH_SERVICE
    )

    const correctEmail = await userColl.findOne({ email })

    if (!correctEmail) {
        throw new Error("User not found by this email Id,Please Register First")
    }

    const hashedNewPassword = await argon2.hash(newPassword);

    await userColl.updateOne(
        { _id: correctEmail._id },
        {
            $set: {
                password: hashedNewPassword,
                updatedAt: new Date()
            }
        }
    )
}