"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.duplicateRole = exports.deleteRole = exports.findRoles = exports.updateRole = exports.createRole = void 0;
const role_model_1 = __importDefault(require("../models/role.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const error_1 = require("../middlewares/error");
const validateInput_1 = require("../utils/validateInput");
const authHelper_1 = require("../helpers/authHelper");
const mongoose_1 = __importDefault(require("mongoose"));
// ***************************************
// ********** Create Role ****************
// ***************************************
const createRole = async (req, res, next) => {
    try {
        const { userId, body } = req;
        const { name } = body;
        if (!(await (0, authHelper_1.checkPermission)(userId, "roles", 0)))
            throw new error_1.CustomError(403, "Permission denied");
        // Validate user input
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        // Create new role
        const createdRole = await role_model_1.default.create({
            name: name.toLowerCase(),
            ...body,
        });
        res.status(201).json({
            message: "Role created successfully",
            data: createdRole,
        });
    }
    catch (error) {
        if (error.code === 11000) {
            // Duplicate key error from the case-insensitive unique index
            throw new error_1.CustomError(400, "Role name already exists");
        }
        next(new error_1.CustomError(500, error.message));
    }
};
exports.createRole = createRole;
// ***************************************
// ********** Read Roles *****************
// ***************************************
const findRoles = async (req, res, next) => {
    try {
        const { userId } = req;
        const { identifier } = req.query;
        if (!(await (0, authHelper_1.checkPermission)(userId, "roles", 1)))
            throw new error_1.CustomError(403, "Permission denied");
        if (identifier) {
            const role = await role_model_1.default.findById(identifier)
                .populate("users", "_id name image")
                .lean();
            res.status(200).json({
                message: "Role fetched successfully",
                data: role,
            });
        }
        else {
            const roles = await role_model_1.default.find()
                .populate("users", "_id name image")
                .lean();
            res.status(200).json({
                message: "Roles fetched successfully",
                data: roles,
            });
        }
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.findRoles = findRoles;
// ***************************************
// ********** Update Roles ***************
// ***************************************
const updateRole = async (req, res, next) => {
    try {
        const { userId, body } = req;
        const roleId = req.query.identifier;
        if (!roleId)
            throw new error_1.CustomError(400, "Role ID is required");
        if (!(await (0, authHelper_1.checkPermission)(userId, "roles", 2)))
            throw new error_1.CustomError(403, "Permission denied");
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        // Prepare update data based on schema
        const updateData = {};
        if (body.name)
            updateData.name = body.name;
        if (body.description)
            updateData.description = body.description;
        if (typeof body.status === "boolean")
            updateData.status = body.status;
        if (body.permissions)
            updateData.permissions = body.permissions;
        // If no changes provided, return early
        if (Object.keys(updateData).length === 0) {
            return res.status(200).json({
                message: "No changes provided",
            });
        }
        // Single DB call to update the role
        const updatedRole = await role_model_1.default.findOneAndUpdate({ _id: roleId }, { $set: updateData }, { new: true, runValidators: true });
        if (!updatedRole) {
            throw new error_1.CustomError(404, "Role not found");
        }
        return res.status(200).json({
            message: "Role updated successfully",
            data: updatedRole,
        });
    }
    catch (error) {
        if (error.code === 11000) {
            // Duplicate key error from the case-insensitive unique index
            throw new error_1.CustomError(400, "Role name already exists");
        }
        next(new error_1.CustomError(500, error.message));
    }
};
exports.updateRole = updateRole;
// ***************************************
// ********** Delete Roles ***************
// ***************************************
const deleteRole = async (req, res, next) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { userId } = req;
        const roleId = req.query.identifier;
        if (!roleId)
            throw new error_1.CustomError(400, "Role ID is required");
        if (!(await (0, authHelper_1.checkPermission)(userId, "roles", 3)))
            throw new error_1.CustomError(403, "Permission denied");
        // Delete the role within the transaction
        const role = await role_model_1.default.findByIdAndDelete(roleId, { session });
        if (!role) {
            await session.abortTransaction();
            throw new error_1.CustomError(404, "Role not found");
        }
        // Update users who had this role
        await user_model_1.default.updateMany({ role: roleId }, { $set: { role: null } }, { session });
        // Commit the transaction
        await session.commitTransaction();
        // Convert to plain object to avoid circular references
        const rolePlain = role.toObject();
        res.status(200).json({
            message: "Role deleted successfully",
            data: rolePlain,
        });
    }
    catch (error) {
        // Only abort transaction here if it hasn’t been committed
        await session.abortTransaction();
        next(new error_1.CustomError(error.statusCode || 500, error.message || "Internal Server Error"));
    }
    finally {
        session.endSession();
    }
};
exports.deleteRole = deleteRole;
// ***************************************
// ********** Duplicate Role *************
// ***************************************
const duplicateRole = async (req, res, next) => {
    try {
        const { userId } = req;
        const roleId = req.query.identifier;
        if (!roleId)
            throw new error_1.CustomError(400, "Role ID is required");
        // Check permission to create roles
        if (!(await (0, authHelper_1.checkPermission)(userId, "roles", 0)))
            throw new error_1.CustomError(403, "Permission denied");
        // Fetch the existing role
        const originalRole = await role_model_1.default.findById(roleId).lean();
        if (!originalRole) {
            throw new error_1.CustomError(404, "Role not found");
        }
        // Prepare the duplicated role data
        const { name, description, status, permissions } = originalRole;
        let newName = `${name} - Copy`;
        // Ensure the new name is unique (case-insensitive)
        let counter = 1;
        while (await role_model_1.default.findOne({
            name: { $regex: new RegExp(`^${newName}$`, "i") },
        })) {
            newName = `${name} - Copy ${counter}`;
            counter++;
        }
        const duplicateData = {
            name: newName,
            description,
            status,
            permissions,
        };
        // Create the duplicated role
        const duplicatedRole = await role_model_1.default.create(duplicateData);
        res.status(201).json({
            message: "Role duplicated successfully",
            data: duplicatedRole,
        });
    }
    catch (error) {
        if (error.code === 11000) {
            // Shouldn't happen due to name uniqueness check, but included for safety
            throw new error_1.CustomError(400, "Role name conflict occurred");
        }
        next(new error_1.CustomError(500, error.message));
    }
};
exports.duplicateRole = duplicateRole;
