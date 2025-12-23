import mongoose from "mongoose";

type MongoOptions = mongoose.ConnectOptions & {
  maxPoolSize?: number;
};

const DEFAULT_OPTIONS: MongoOptions = {
  autoIndex: process.env.NODE_ENV === "development",
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 30000,
  retryWrites: true,
  appName: "Backend_v2",
  bufferCommands: false, // 🔥 CRITICAL FIX
};

// Global cache (works across lambda re-use)
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

export const connectDB = async (): Promise<typeof mongoose> => {
  if (global.mongooseCache.conn) {
    return global.mongooseCache.conn;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("❌ MONGODB_URI not defined");
  }

  if (!global.mongooseCache.promise) {
    global.mongooseCache.promise = mongoose.connect(
      process.env.MONGODB_URI,
      DEFAULT_OPTIONS
    );
  }

  global.mongooseCache.conn = await global.mongooseCache.promise;
  return global.mongooseCache.conn;
};
