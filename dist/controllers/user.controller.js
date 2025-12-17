"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.killUser = exports.updateUser = exports.findUser = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const error_1 = require("../middlewares/error");
const validateInput_1 = require("../utils/validateInput");
const authHelper_1 = require("../helpers/authHelper");
const cartModel_1 = __importDefault(require("../models/cartModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const role_model_1 = __importDefault(require("../models/role.model"));
// ***************************************
// ************ Find User ****************
// ***************************************
const findUser = async (req, res, next) => {
    try {
        const { userId } = req;
        const identifier = req.query.identifier;
        // Check permission early (assumes userId is string)
        if (!(await (0, authHelper_1.checkPermission)(userId, "users", 1))) {
            throw new error_1.CustomError(403, "Permission denied");
        }
        let result;
        if (identifier) {
            result = await user_model_1.default.findById(identifier).populate("role").lean();
            if (!result)
                throw new error_1.CustomError(404, "User not found");
        }
        else {
            result = await user_model_1.default.find().populate("role").lean();
            if (result.length === 0)
                throw new error_1.CustomError(404, "No users found");
        }
        res.status(200).json({ data: result });
    }
    catch (error) {
        next(error instanceof error_1.CustomError
            ? error
            : new error_1.CustomError(500, "Failed to fetch users"));
    }
};
exports.findUser = findUser;
// ***************************************
// ************ Update User **************
// ***************************************
const updateUser = async (req, res, next) => {
    try {
        const { userId, body } = req;
        const identifier = req.query.identifier;
        // Validate target ID (use userId if identifier is not provided)
        const targetId = identifier || userId;
        if (!targetId) {
            throw new error_1.CustomError(400, "User ID is required");
        }
        // Convert to strings for consistency (assuming userId might be ObjectId)
        const userIdStr = userId.toString();
        const targetIdStr = targetId.toString();
        // Prevent password updates (fast check)
        if ("password" in body) {
            throw new error_1.CustomError(403, "Password updates are not allowed through this endpoint");
        }
        // Step 1: Check if the requesting user is an admin
        const requestingUser = await user_model_1.default.findById(userIdStr)
            .select("isAdmin")
            .lean();
        if (!requestingUser) {
            throw new error_1.CustomError(404, "Requesting user not found");
        }
        // Prepare update data
        const updateData = {};
        let allowedFields;
        if (requestingUser.isAdmin) {
            // Admins can update any field except password
            allowedFields = Object.keys(user_model_1.default.schema.paths).filter((field) => field !== "password" && field !== "__v");
        }
        else {
            // Step 2: If not admin, check permissions
            const hasPermission = await (0, authHelper_1.checkPermission)(userIdStr, "users", 2);
            if (hasPermission) {
                // Users with permission can update any field except password
                allowedFields = Object.keys(user_model_1.default.schema.paths).filter((field) => field !== "password" && field !== "__v");
            }
            else {
                // Step 3: If no permissions, allow self-update with limited fields
                allowedFields = ["name", "userName", "contact", "image"];
                if (userIdStr !== targetIdStr) {
                    throw new error_1.CustomError(403, "You can only update your own account");
                }
            }
        }
        // Filter body to allowed fields only
        Object.keys(body).forEach((key) => {
            if (allowedFields.includes(key)) {
                updateData[key] = body[key];
            }
        });
        // If no valid fields provided, return early
        if (Object.keys(updateData).length === 0) {
            throw new error_1.CustomError(400, "No valid fields provided for update");
        }
        // Validate input
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        // Handle rare role update case with transaction
        if ("role" in body) {
            const session = await mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const roleDoc = await role_model_1.default.findById(body.role).session(session).lean();
                if (!roleDoc) {
                    throw new error_1.CustomError(404, "Role not found");
                }
                const users = roleDoc.users || [];
                if (!users.some((id) => id.toString() === targetIdStr)) {
                    users.push(new mongoose_1.default.Types.ObjectId(targetIdStr));
                    await role_model_1.default.updateOne({ _id: body.role }, { $set: { users } }, { session });
                }
                updateData.role = body.role;
                const updatedUser = await user_model_1.default.findByIdAndUpdate(targetIdStr, { $set: updateData }, { new: true, runValidators: true, lean: true, session });
                if (!updatedUser) {
                    throw new error_1.CustomError(404, "User not found");
                }
                await session.commitTransaction();
                res.status(200).json({
                    message: "User updated successfully",
                    data: updatedUser,
                });
            }
            catch (error) {
                await session.abortTransaction();
                throw error;
            }
            finally {
                session.endSession();
            }
        }
        else {
            // Common case: no role update, no transaction
            const updatedUser = await user_model_1.default.findByIdAndUpdate(targetIdStr, { $set: updateData }, { new: true, runValidators: true, lean: true });
            if (!updatedUser) {
                throw new error_1.CustomError(404, "User not found");
            }
            res.status(200).json({
                message: "User updated successfully",
                data: updatedUser,
            });
        }
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.updateUser = updateUser;
// ***************************************
// ************ Kill User ****************
// ***************************************
const killUser = async (req, res, next) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { userId } = req;
        const identifier = req.query.identifier;
        // Validate input early
        if (!identifier) {
            throw new error_1.CustomError(400, "User ID is required");
        }
        // Ensure consistent type for comparison
        const userIdStr = userId.toString();
        const targetIdStr = identifier;
        // Check permission
        if (!(await (0, authHelper_1.checkPermission)(userIdStr, "users", 3))) {
            throw new error_1.CustomError(403, "Permission denied");
        }
        // Prevent self-deletion
        if (userIdStr === targetIdStr) {
            throw new error_1.CustomError(403, "You cannot delete your own account");
        }
        // Delete user within transaction
        const killedUser = await user_model_1.default.findByIdAndDelete(targetIdStr)
            .session(session)
            .lean();
        if (!killedUser) {
            throw new error_1.CustomError(404, "User not found");
        }
        // Delete associated cart within transaction
        const cartResult = await cartModel_1.default.deleteOne({ userId: targetIdStr }).session(session);
        if (cartResult.deletedCount === 0) {
            console.warn(`No cart found for user ${targetIdStr}`);
        }
        // Commit transaction
        await session.commitTransaction();
        res.status(200).json({
            message: "User and associated cart deleted successfully",
            data: killedUser,
        });
    }
    catch (error) {
        await session.abortTransaction();
        next(error instanceof error_1.CustomError
            ? error
            : new error_1.CustomError(500, "Failed to delete user"));
    }
    finally {
        session.endSession();
    }
};
exports.killUser = killUser;
// ***************************************
// ********* Get Current User ************
// ***************************************
const getCurrentUser = async (req, res, next) => {
    try {
        const { userId } = req;
        const user = await user_model_1.default.findById(userId)
            .populate("role", "name permissions")
            .lean();
        if (!user) {
            throw new error_1.CustomError(404, "User not found");
        }
        res.status(200).json({ data: user });
    }
    catch (error) {
        next(error instanceof error_1.CustomError
            ? error
            : new error_1.CustomError(500, "Failed to fetch user"));
    }
};
exports.getCurrentUser = getCurrentUser;
