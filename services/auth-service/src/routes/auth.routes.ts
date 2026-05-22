import express from 'express';

import { isAdminMiddleware } from '../middleware/isAdmin.middleware';
import { authRateLimiterMiddleware, rateLimiterMiddleware } from '../middleware/ratelimiter.middleware';
import {
    adminGetAllUsers,
    getMe,
    login,
    logout,
    logoutAll,
    refresh,
    register,
    updateMe
} from '../controller/auth.controller';
import { userAuthenticate } from '../middleware/authenticate.middleware';

const authRouter = express.Router();

// Public routes
authRouter.route("/register").post(authRateLimiterMiddleware, register);
authRouter.route("/login").post(authRateLimiterMiddleware, login);

// protected routes

// user profile routes
authRouter.route("/getMe").get(rateLimiterMiddleware, userAuthenticate, getMe);
authRouter.route("/updateMe").put(rateLimiterMiddleware, userAuthenticate, updateMe);

// session management routes
authRouter.route("/logout").post(rateLimiterMiddleware, userAuthenticate, logout);
authRouter.route("/logoutAll").post(rateLimiterMiddleware, userAuthenticate, logoutAll);
authRouter.route("/refresh").post(rateLimiterMiddleware, userAuthenticate, refresh)

// password management routes
authRouter.route("/forgotPassword").post(rateLimiterMiddleware)
authRouter.route("/changePassword").post(rateLimiterMiddleware, userAuthenticate)

// Admin routes
authRouter.route("/admin/getAllUsers").get(isAdminMiddleware, adminGetAllUsers);
authRouter.route("/admin/blockUser").post(isAdminMiddleware)

export default authRouter;
