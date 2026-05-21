import { Request, Response } from "express";

// Importing services
import {
    loginService,
    registerService,
    refreshTokenService,
    logoutService,
    logoutAllService,
    getMeService,
    updateMeService,
    adminGetAllUsersService,
} from "../service/auth.service";

import logger from "../config/logger";
import { config } from "../config";

//  Cookie Config - secure, httpOnly, sameSite, maxAge
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
};

const setAuthCookies = (
    res: Response,
    accessToken: string,
    refreshTokenCookieValue: string
) => {
    res.cookie("accessToken", accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: config.accessTokenTtlMs, // 15 min
    });

    res.cookie("refreshToken", refreshTokenCookieValue, {
        ...COOKIE_OPTIONS,
        maxAge: config.refreshTokenTtlMs, // 7 days
    });
};

const clearAuthCookies = (res: Response) => {
    res.clearCookie("accessToken", COOKIE_OPTIONS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
};

//  Register 
export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, firstName, lastName, phoneNumber } = req.body;

        const result = await registerService({
            firstName,
            lastName,
            email,
            password,
            phoneNumber,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        setAuthCookies(res, result.accessToken, result.refreshTokenCookieValue);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: result.user,
                accessToken: result.accessToken,
            },
        });
    } catch (error: any) {
        logger.error("Register error:", error.message);

        // Validation errors (email exists, weak password, etc.) → 400
        return res.status(400).json({
            success: false,
            message: error.message || "Registration failed",
        });
    }
};

//  Login 
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password, phoneNumber } = req.body;

        if (!email && !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Either email or phone number is required",
            });
        }

        const result = await loginService({
            email,
            password,
            phoneNumber,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        setAuthCookies(res, result.accessToken, result.refreshTokenCookieValue);

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            data: {
                user: result.user,
                accessToken: result.accessToken,
            },
        });
    } catch (error: any) {
        logger.error("Login error:", error.message);

        return res.status(401).json({
            success: false,
            message: error.message || "Login failed",
        });
    }
};

//  Refresh Token 
export const refresh = async (req: Request, res: Response) => {
    try {
        // Cookie se refresh token lo
        const refreshTokenCookieValue = req.cookies?.refreshToken;

        if (!refreshTokenCookieValue) {
            return res.status(401).json({
                success: false,
                message: "Refresh token not found",
            });
        }

        const result = await refreshTokenService({
            refreshTokenCookieValue,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        // Naye tokens set karo (rotation complete)
        setAuthCookies(res, result.accessToken, result.refreshTokenCookieValue);

        return res.status(200).json({
            success: true,
            message: "Tokens refreshed",
            data: {
                accessToken: result.accessToken,
            },
        });
    } catch (error: any) {
        logger.error("Refresh error:", error.message);

        // Token revoked / expired / invalid — cookies clear karo
        clearAuthCookies(res);

        return res.status(401).json({
            success: false,
            message: error.message || "Invalid or expired refresh token",
        });
    }
};

//  Logout 
export const logout = async (req: Request, res: Response) => {
    try {
        const refreshTokenCookieValue = req.cookies?.refreshToken;

        if (refreshTokenCookieValue) {
            await logoutService({ refreshTokenCookieValue });
        }

        clearAuthCookies(res);

        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error: any) {
        logger.error("Logout error:", error.message);

        // Logout mein bhi cookies clear karo, chahe kuch fail ho
        clearAuthCookies(res);

        return res.status(400).json({
            success: false,
            message: error.message || "Logout failed",
        });
    }
};

//  Logout All 
/**
 * Ye route protected hai — authMiddleware pehle chalega jo req.user set karega.
 * Saare devices se logout.
 */
export const logoutAll = async (req: Request, res: Response) => {
    try {
        // req.user authMiddleware set karta hai
        const userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        await logoutAllService({ userId });

        clearAuthCookies(res);

        return res.status(200).json({
            success: true,
            message: "Logged out from all devices",
        });
    } catch (error: any) {
        logger.error("LogoutAll error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to logout from all devices",
        });
    }
};

// getMe 
export const getMe = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        const profile = await getMeService(
            {
                userId: user._id.toString(),
            }
        )

        return res.status(200).json({
            success: true,
            message: "User profile fetched successfully",
            data: {
                user: profile,
            },
        });

    } catch (error: any) {
        logger.error("GetMe error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch user profile",
        });
    }
}

// updateMe 
export const updateMe = async (req: Request, res: Response) => {
    try {

        const user = (req as any).user;

        // Jo fields update karne hain, unko req.body se lo
        const { firstName, lastName, phoneNumber, username } = req.body;

        // Update service call karo jo DB mein update karegi
        const updatedProfile = await updateMeService(
            {
                userId: user._id.toString(),
                firstName,
                lastName,
                phoneNumber,
                username,
            }
        )

        return res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            data: {
                user: updatedProfile,
            },
        });

    } catch (error: any) {
        logger.error("UpdateMe error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to update user profile",
        });
    }
}

// admin getAllUsers
export const adminGetAllUsers = async (_req: Request, res: Response) => {
    try {
        // Admin middleware se admin check ho chuka hoga, toh bas users fetch karlo
        const users = await adminGetAllUsersService();

        return res.status(200).json({
            success: true,
            message: "All users fetched successfully",
            data: {
                users,
            },
        });
    } catch (error: any) {
        logger.error("Admin GetAllUsers error:", error.message);

        return res.status(500).json(
            {
                success: false,
                message: "Failed to fetch users",
            }
        )
    }
}