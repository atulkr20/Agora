import { Request, Response } from "express";

import { registerService } from "../service/auth.service";

export const register = async (
    req: Request,
    res: Response
) => {
    try {

        const {
            email,
            password,
            firstName,
            lastName
        } = req.body;

        const result = await registerService({
            email,
            password,
            firstName,
            lastName,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"]
        });

        // access token cookie
        res.cookie(
            "accessToken",
            result.accessToken,
            {
                httpOnly: true,
                secure:
                    process.env.NODE_ENV ===
                    "production",

                sameSite: "strict",

                maxAge:
                    1000 * 60 * 15
            }
        );

        // refresh token cookie
        res.cookie(
            "refreshToken",
            result.refreshToken,
            {
                httpOnly: true,
                secure:
                    process.env.NODE_ENV ===
                    "production",

                sameSite: "strict",

                maxAge:
                    1000 * 60 * 60 * 24 * 7
            }
        );

        return res.status(201).json({
            success: true,
            message:
                "User registered successfully",

            data: {
                user: result.user,
                accessToken:
                    result.accessToken,
                refreshToken:
                    result.refreshToken
            }
        });

    } catch (error: any) {

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Something went wrong"
        });
    }
};