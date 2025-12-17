"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserRoleType = exports.checkPermission = void 0;
const error_1 = require("../middlewares/error");
const user_model_1 = __importDefault(require("../models/user.model"));
const role_model_1 = __importDefault(require("../models/role.model"));
const mongoose_1 = require("mongoose");
const rolePermissionsCache = new Map();
const checkPermission = async (userId, entity, action) => {
    try {
        const user = await user_model_1.default.findById(userId).populate("role");
        if (!user)
            throw new error_1.CustomError(404, "User not found");
        // Admin has all permissions
        if (user.isAdmin)
            return true;
        // Check if user has customer role
        const isCustomer = user?.role?.name === "customer";
        // Customers can only create tickets (action 0) by default
        if (isCustomer && entity === "tickets" && action === 0)
            return true;
        // For non-customers, check role permissions
        if (!user.role || !mongoose_1.Types.ObjectId.isValid(user.role._id)) {
            throw new error_1.CustomError(403, "Invalid role configuration");
        }
        const rolePermissions = await getRolePermissions(user.role._id);
        return rolePermissions.some((role) => role.module === entity && role.permissions.includes(action));
    }
    catch (error) {
        console.error("Permission check failed:", error);
        throw new error_1.CustomError(403, "Access denied");
    }
};
exports.checkPermission = checkPermission;
const getRolePermissions = async (roleId) => {
    if (rolePermissionsCache.has(roleId)) {
        return rolePermissionsCache.get(roleId);
    }
    const roleInfo = await role_model_1.default.findById(roleId);
    if (!roleInfo)
        throw new error_1.CustomError(404, "Role not found");
    rolePermissionsCache.set(roleId, roleInfo.permissions);
    return roleInfo.permissions;
};
const getUserRoleType = async (userId) => {
    const user = await user_model_1.default.findById(userId).populate("role");
    if (!user)
        throw new error_1.CustomError(404, "User not found");
    if (user.isAdmin)
        return "admin";
    if (user.role?.name.toLocaleLowerCase().includes("customer"))
        return "customer";
    return "support";
};
exports.getUserRoleType = getUserRoleType;
