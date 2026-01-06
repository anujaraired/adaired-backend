"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
if (!global.mongooseCache) {
    global.mongooseCache = { conn: null, promise: null };
}
async function connectDB() {
    if (global.mongooseCache.conn) {
        console.log("🟢 MongoDB: using cached connection");
        return global.mongooseCache.conn;
    }
    if (!process.env.MONGODB_URI) {
        console.error("❌ MongoDB: MONGODB_URI missing");
        throw new Error("MONGODB_URI not defined");
    }
    if (!global.mongooseCache.promise) {
        console.log("🟡 MongoDB: creating new connection...");
        global.mongooseCache.promise = mongoose_1.default.connect(process.env.MONGODB_URI, {
            bufferCommands: false, // 🔥 critical
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });
    }
    try {
        console.time("⏱ MongoDB connected in");
        global.mongooseCache.conn = await global.mongooseCache.promise;
        console.timeEnd("⏱ MongoDB connected in");
        console.log("✅ MongoDB: connected successfully");
        return global.mongooseCache.conn;
    }
    catch (error) {
        console.error("🔥 MongoDB connection FAILED", error);
        global.mongooseCache.promise = null;
        throw error;
    }
}
