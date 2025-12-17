"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Global connection check
let isConnected = false;
const DEFAULT_OPTIONS = {
    autoIndex: process.env.NODE_ENV === "development",
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 30000,
    serverSelectionTimeoutMS: 5000,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    retryReads: true,
    appName: "Backend_v2",
};
/**
 * Safely connects to MongoDB with production-ready settings
 */
const connectDB = async () => {
    if (isConnected) {
        console.log("🔄 Using existing MongoDB connection");
        return;
    }
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI environment variable not configured");
    }
    try {
        console.time("🔗 MongoDB connection time");
        await mongoose_1.default.connect(process.env.MONGODB_URI, DEFAULT_OPTIONS);
        isConnected = true;
        console.timeEnd("🔗 MongoDB connection time");
        // Event listeners for connection health
        mongoose_1.default.connection.on("connected", () => {
            console.log("📈 MongoDB connection active");
        });
        mongoose_1.default.connection.on("error", (err) => {
            console.error("❌ MongoDB connection error:", err);
            isConnected = false;
        });
        mongoose_1.default.connection.on("disconnected", () => {
            console.log("⚠️ MongoDB disconnected");
            isConnected = false;
        });
    }
    catch (error) {
        console.error("🔥 MongoDB connection failed:", error);
        throw error;
    }
};
exports.connectDB = connectDB;
/**
 * Gracefully closes the MongoDB connection
 */
const closeDB = async () => {
    if (isConnected) {
        await mongoose_1.default.disconnect();
        isConnected = false;
        console.log("🛑 MongoDB connection closed");
    }
};
exports.closeDB = closeDB;
