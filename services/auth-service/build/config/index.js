import dotenv from 'dotenv';
dotenv.config();
export const config = Object.freeze({
    port: Number(process.env.PORT) || 3000,
    environment: String(process.env.NODE_ENV) || 'development',
    mongoURI: String(process.env.MONGO_URI) || 'mongodb://localhost:27017/auth-service',
});
//# sourceMappingURL=index.js.map