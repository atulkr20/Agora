import { Db, MongoClient, ServerApiVersion } from "mongodb";
import { config } from "../config";
import logger from "../config/logger";

const DEFAULT_MONGO_URI = "mongodb://localhost:27017/auth-service";
const MONGO_URI = getMongoURI();

let client: MongoClient | null = null;
let connectionPromise: Promise<MongoClient> | null = null;

function getMongoURI(): string {
    if (!config.mongoURI || config.mongoURI === "undefined") {
        return DEFAULT_MONGO_URI;
    }

    return config.mongoURI;
}

function getSafeMongoURI(uri: string): string {
    try {
        const parsedURI = new URL(uri);

        if (parsedURI.username || parsedURI.password) {
            parsedURI.username = "***";
            parsedURI.password = "***";
        }

        return parsedURI.toString();
    } catch {
        return "configured MongoDB URI";
    }
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function createClient(): MongoClient {
    return new MongoClient(MONGO_URI, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: false,
            deprecationErrors: true,
        },
        maxPoolSize: 5,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 30000,
    });
}

export async function connectDB(): Promise<MongoClient> {
    if (client) {
        return client;
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    connectionPromise = (async () => {
        const mongoClient = createClient();

        try {
            await mongoClient.connect();
            await mongoClient.db().admin().command({ ping: 1 });

            client = mongoClient;
            logger.info(`MongoDB connected: ${getSafeMongoURI(MONGO_URI)}`);

            return mongoClient;
        } catch (error) {
            await mongoClient.close().catch(() => undefined);
            logger.error(`MongoDB connection failed: ${getErrorMessage(error)}`);
            throw error;
        } finally {
            connectionPromise = null;
        }
    })();

    return connectionPromise;
}

export async function getDB(databaseName?: string): Promise<Db> {
    const mongoClient = await connectDB();
    return mongoClient.db(databaseName);
}

export async function disconnectDB(): Promise<void> {
    if (!client) {
        return;
    }

    try {
        await client.close();
        client = null;
        logger.info("MongoDB disconnected");
    } catch (error) {
        logger.error(`MongoDB disconnect failed: ${getErrorMessage(error)}`);
        throw error;
    }
}
