import express from 'express';

import { isAdminMiddleware } from '../middleware/isAdmin.middleware';
import { authRateLimiterMiddleware, rateLimiterMiddleware } from '../middleware/ratelimiter.middleware';
import { login, logout, logoutAll, refresh, register } from '../controller/auth.controller';

const authRouter = express.Router();

// Public routes
authRouter.route("/register").post(authRateLimiterMiddleware, register);
authRouter.route("/login").post(authRateLimiterMiddleware, login);

// protected routes
// authRouter.route("/me").get()
// authRouter.route("/updateMe").put() // here user updare his profile, like all there details

// session management routes
authRouter.route("/logout").post(rateLimiterMiddleware, logout);
authRouter.route("/logoutAll").post(rateLimiterMiddleware, logoutAll);
authRouter.route("/refresh").post(rateLimiterMiddleware, refresh)

// password management routes
authRouter.route("/forgotPassword").post(rateLimiterMiddleware)
authRouter.route("/changePassword").post(rateLimiterMiddleware)

// user profile routes
// authRouter.route("/getMe").get()

// Admin routes
authRouter.route("/admin/getAllUsers").get(isAdminMiddleware)
authRouter.route("/admin/blockUser").post(isAdminMiddleware)

export default authRouter;
