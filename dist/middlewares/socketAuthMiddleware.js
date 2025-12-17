"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySocketToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_1 = require("./error");
const verifySocketToken = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            throw new error_1.CustomError(401, "No token provided");
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        socket.data.userId = decoded._id;
        next();
    }
    catch (error) {
        next(new error_1.CustomError(401, "Invalid or expired token"));
    }
};
exports.verifySocketToken = verifySocketToken;
