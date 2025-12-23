import mongoose from "mongoose";

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

export async function connectDB(): Promise<typeof mongoose> {
  if (global.mongooseCache.conn) {
    return global.mongooseCache.conn;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI not defined");
  }

  if (!global.mongooseCache.promise) {
    global.mongooseCache.promise = mongoose.connect(
      process.env.MONGODB_URI,
      {
        bufferCommands: false, // 🔥 MOST IMPORTANT
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      }
    );
  }

  global.mongooseCache.conn = await global.mongooseCache.promise;
  return global.mongooseCache.conn;
}
