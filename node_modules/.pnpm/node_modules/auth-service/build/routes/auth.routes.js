import express from 'express';
import { isAdminMiddleware } from '../middleware/isAdmin.middleware';
import { authRateLimiterMiddleware } from '../middleware/ratelimiter.middleware';
const authRouter = express.Router();
authRouter.route("/register").post(authRateLimiterMiddleware);
authRouter.route("/login").post(authRateLimiterMiddleware);
authRouter.route("/me").get();
authRouter.route("/logout").post();
authRouter.route("/logoutAll").post();
authRouter.route("/refresh").post();
authRouter.route("/forgotPassword").post(authRateLimiterMiddleware);
authRouter.route("/changePassword").post(authRateLimiterMiddleware);
authRouter.route("/getMe").get();
authRouter.route("/admin/getAllUsers").get(isAdminMiddleware);
authRouter.route("/admin/blockUser").post(isAdminMiddleware);
export default authRouter;
//# sourceMappingURL=auth.routes.js.map