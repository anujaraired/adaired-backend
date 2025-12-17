"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BASE_DOMAIN = void 0;
// src/utils/globals.ts
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables (only needed if not already loaded elsewhere)
dotenv_1.default.config();
// Define BASE_DOMAIN globally
exports.BASE_DOMAIN = process.env.NODE_ENV === "production"
    ? process.env.LIVE_DOMAIN || "https://www.adaired.com"
    : process.env.LOCAL_DOMAIN || "http://localhost:3001";
