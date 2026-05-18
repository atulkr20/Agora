import express from "express"

import authRouter from "./routes/auth.routes";

const apiRoutes = express.Router()

apiRoutes.use("/auth", authRouter)

export default apiRoutes
