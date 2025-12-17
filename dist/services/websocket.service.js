"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWebSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const ticket_model_1 = __importDefault(require("../models/ticket.model"));
const error_1 = require("../middlewares/error");
const authHelper_1 = require("../helpers/authHelper");
const mongoose_1 = require("mongoose");
// Rate limiter for WebSocket messages
const rateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    points: 10, // 10 messages
    duration: 60, // per minute
});
// Initialize WebSocket server
const initializeWebSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.ALLOWED_ORIGINS?.split(",") || [
                "https://rwf4p3bf-3000.inc1.devtunnels.ms",
                "https://dashboard-adaired.vercel.app",
                "https://ad-admin-five.vercel.app",
                "https://www.adaired.com",
                "https://adaired.com",
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:3002",
                "http://localhost:3003",
                "http://localhost:3004",
            ],
            credentials: true,
        },
    });
    // Middleware for JWT authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token?.split(" ")[1];
            if (!token)
                throw new error_1.CustomError(401, "Authentication token missing");
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            // Validate user exists
            const userType = await (0, authHelper_1.getUserRoleType)(decoded.userId);
            if (!userType)
                throw new error_1.CustomError(401, "Invalid user");
            next();
        }
        catch (error) {
            next(new error_1.CustomError(401, "Authentication failed"));
        }
    });
    // Connection handler
    io.on("connection", (socket) => {
        console.log(`User ${socket.userId} connected`);
        // Join ticket room
        socket.on("joinTicket", async ({ ticketId }) => {
            try {
                // Validate ticket access
                const hasAccess = await validateTicketAccess(socket.userId, ticketId);
                if (!hasAccess) {
                    socket.emit("error", { message: "Access denied to this ticket" });
                    return;
                }
                socket.join(ticketId);
                socket.emit("joinedTicket", { ticketId });
                console.log(`User ${socket.userId} joined ticket ${ticketId}`);
            }
            catch (error) {
                socket.emit("error", { message: error.message });
            }
        });
        // Handle new message
        socket.on("sendMessage", async ({ ticketId, message, attachments }) => {
            try {
                // Rate limiting
                await rateLimiter.consume(socket.userId);
                // Validate input
                if (!message.trim())
                    throw new error_1.CustomError(400, "Message cannot be empty");
                // Validate ticket access
                const hasAccess = await validateTicketAccess(socket.userId, ticketId);
                if (!hasAccess)
                    throw new error_1.CustomError(403, "Access denied");
                // Save message to database
                const ticket = await ticket_model_1.default.findById(ticketId);
                if (!ticket)
                    throw new error_1.CustomError(404, "Ticket not found");
                const newMessage = {
                    sender: new mongoose_1.Types.ObjectId(socket.userId),
                    message,
                    attachments: attachments || [],
                    readBy: [new mongoose_1.Types.ObjectId(socket.userId)],
                };
                ticket.messages.push(newMessage);
                await ticket.save();
                // Broadcast message to ticket room
                io.to(ticketId).emit("newMessage", {
                    ticketId,
                    message: newMessage,
                });
            }
            catch (error) {
                socket.emit("error", { message: error.message });
            }
        });
        // Handle typing indicator
        socket.on("typing", ({ ticketId }) => {
            socket.to(ticketId).emit("userTyping", { userId: socket.userId, ticketId });
        });
        // Handle stop typing
        socket.on("stopTyping", ({ ticketId }) => {
            socket.to(ticketId).emit("userStoppedTyping", { userId: socket.userId, ticketId });
        });
        // Handle message read
        socket.on("readMessage", async ({ ticketId, messageId }) => {
            try {
                const ticket = await ticket_model_1.default.findById(ticketId);
                if (!ticket)
                    throw new error_1.CustomError(404, "Ticket not found");
                const message = ticket.messages.find((msg) => msg._id.toString() === messageId);
                if (!message)
                    throw new error_1.CustomError(404, "Message not found");
                if (!message.readBy.some((id) => id.equals(new mongoose_1.Types.ObjectId(socket.userId)))) {
                    message.readBy.push(new mongoose_1.Types.ObjectId(socket.userId));
                    await ticket.save();
                }
                io.to(ticketId).emit("messageRead", { ticketId, messageId, userId: socket.userId });
            }
            catch (error) {
                socket.emit("error", { message: error.message });
            }
        });
        // Handle ticket updates (status, priority, assignment)
        socket.on("updateTicket", async ({ ticketId, updates }) => {
            try {
                const ticket = await ticket_model_1.default.findById(ticketId);
                if (!ticket)
                    throw new error_1.CustomError(404, "Ticket not found");
                const hasUpdatePermission = await (0, authHelper_1.checkPermission)(socket.userId, "tickets", 2);
                const isAdmin = (await (0, authHelper_1.getUserRoleType)(socket.userId)) === "admin";
                if (!hasUpdatePermission && !isAdmin)
                    throw new error_1.CustomError(403, "No permission to update ticket");
                if (updates.status)
                    ticket.status = updates.status;
                if (updates.priority)
                    ticket.priority = updates.priority;
                if (updates.assignedTo)
                    ticket.assignedTo = new mongoose_1.Types.ObjectId(updates.assignedTo);
                await ticket.save();
                io.to(ticketId).emit("ticketUpdated", { ticketId, updates });
            }
            catch (error) {
                socket.emit("error", { message: error.message });
            }
        });
        // Handle disconnection
        socket.on("disconnect", () => {
            console.log(`User ${socket.userId} disconnected`);
        });
    });
};
exports.initializeWebSocket = initializeWebSocket;
// Validate ticket access
async function validateTicketAccess(userId, ticketId) {
    const ticket = await ticket_model_1.default.findById(ticketId);
    if (!ticket)
        return false;
    const userType = await (0, authHelper_1.getUserRoleType)(userId);
    const isAdmin = userType === "admin";
    const hasTicketAccess = await (0, authHelper_1.checkPermission)(userId, "tickets", 1);
    const isCustomer = ticket.customer?.equals(userId);
    const isAssigned = ticket.assignedTo?.equals(userId);
    return isAdmin || hasTicketAccess || isCustomer || isAssigned;
}
