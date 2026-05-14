import winston from 'winston';
import { config } from './index';
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};
const level = () => {
    const env = config.environment || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};
winston.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'white',
    http: 'white',
    debug: 'grey'
});
const format = winston.format.combine(winston.format.colorize({ all: true }), winston.format.printf((info) => `${info.level}: ${info.message}`));
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
const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports: transport,
});
export default logger;
//# sourceMappingURL=logger.js.map