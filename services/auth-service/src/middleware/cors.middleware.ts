import cors from 'cors';
import { config } from '../config/index';


export const corsMiddleware = cors({
    origin: config.allowed_origins.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
    ]
})