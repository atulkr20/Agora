import dotenv from 'dotenv'
dotenv.config()

// the use of Object.freeze ensures that the config object cannot be modified at runtime, providing immutability and preventing accidental changes to configuration values.
export const config = Object.freeze({
    port: Number(process.env.PORT) || 3000,
    environment: String(process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',

    mongoURI: String(process.env.MONGO_URI) || 'mongodb://localhost:27017/auth-service',
})
