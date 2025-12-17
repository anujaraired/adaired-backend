"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTicketPermissions = void 0;
const error_1 = require("../middlewares/error");
const ticket_model_1 = __importDefault(require("../models/ticket.model"));
const authHelper_1 = require("./authHelper");
const validateTicketPermissions = async (userId, ticketId, action) => {
    const ticket = await ticket_model_1.default.findById(ticketId);
    if (!ticket) {
        throw new error_1.CustomError(404, "Ticket not found");
    }
    const userType = await (0, authHelper_1.getUserRoleType)(userId);
    const isAdmin = userType === "admin";
    const isCustomer = userType === "customer";
    const isAssigned = ticket.assignedTo?.toString() === userId;
    const hasUpdatePermission = await (0, authHelper_1.checkPermission)(userId, "tickets", 2).catch(() => false);
    if (action === "update" || action === "close") {
        if (!isAdmin && !isAssigned && !hasUpdatePermission) {
            throw new error_1.CustomError(403, "You don't have permission to perform this action");
        }
    }
    else if (action === "message") {
        const isParticipant = ticket.participants.some((p) => p.toString() === userId);
        if (!isAdmin && !isAssigned && !isCustomer && !isParticipant) {
            throw new error_1.CustomError(403, "You don't have permission to message in this ticket");
        }
    }
    return {
        isAdmin,
        isAssigned,
        isCustomer,
        hasUpdatePermission,
    };
};
exports.validateTicketPermissions = validateTicketPermissions;
