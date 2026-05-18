import express from 'express';

import { isAdminMiddleware } from '../middleware/isAdmin.middleware';
import { authRateLimiterMiddleware } from '../middleware/ratelimiter.middleware';

const authRouter = express.Router();

// Public routes
authRouter.route("/register").post(authRateLimiterMiddleware)
authRouter.route("/login").post(authRateLimiterMiddleware)

// protected routes
authRouter.route("/me").get()
authRouter.route("/updateMe").put() // here user updare his profile, like all there details

// session management routes
authRouter.route("/logout").post()
authRouter.route("/logoutAll").post()
authRouter.route("/refresh").post()

// password management routes
authRouter.route("/forgotPassword").post(authRateLimiterMiddleware)
authRouter.route("/changePassword").post(authRateLimiterMiddleware)

// user profile routes
authRouter.route("/getMe").get()

// Admin routes
authRouter.route("/admin/getAllUsers").get(isAdminMiddleware)
authRouter.route("/admin/blockUser").post(isAdminMiddleware)

export default authRouter;
