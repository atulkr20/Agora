import winston from 'winston'
import { config } from './index';

// 1. Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
}

// 2. Create a function to determine the log level based on the environment
const level = () => {
    const env = config.environment || 'development'
    const isDevelopment = env === 'development'
    return isDevelopment ? 'debug' : 'warn'
}

// 3. Add colors for log levels
winston.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'white',
    http: 'white',
    debug: 'grey'
})

// 4. Create a format for the logs
const format = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.level}: ${info.message}`,
    ),
)

// 5. Define transports for the logger
const transport = [
    new winston.transports.Console(),
    new winston.transports.File({
        filename: "logs/error.log",
        level: "error",
    }),
    new winston.transports.File({
        filename: "logs/all.log"
    })
];

// 6. Create the logger
const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports: transport,
})

export default logger;
