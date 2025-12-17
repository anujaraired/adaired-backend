"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteField = exports.updateField = exports.readFields = exports.createField = void 0;
const field_model_1 = __importDefault(require("../models/field.model"));
const form_model_1 = __importDefault(require("../models/form.model")); // Imported to update forms when deleting fields
const error_1 = require("../middlewares/error");
const authHelper_1 = require("../helpers/authHelper");
// ***************************************
// ********** Create Field ***************
// ***************************************
const createField = async (req, res, next) => {
    try {
        const { body, userId } = req;
        const { name, label, inputType, inputMinLength, inputMaxLength, inputPlaceholder, inputValidationPattern, inputRequired, customClassName, multipleOptions, } = body;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "fields", 0);
        if (!permissionCheck) {
            throw new error_1.CustomError(403, "Unauthorized");
        }
        // Validate required fields
        if (!name || !label || !inputType) {
            throw new error_1.CustomError(400, "Name, Label, and Input Type are required");
        }
        const field = await field_model_1.default.create({
            name,
            label,
            inputType,
            inputMinLength: inputMinLength || null,
            inputMaxLength: inputMaxLength || null,
            inputPlaceholder: inputPlaceholder || null,
            inputValidationPattern: inputValidationPattern || null,
            inputRequired: inputRequired || false,
            customClassName: customClassName || null,
            multipleOptions: multipleOptions || [],
        });
        res.status(201).json({
            success: true,
            message: "Field created successfully",
            field,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message || "Error creating field"));
    }
};
exports.createField = createField;
// ***************************************
// ********** Read Fields ****************
// ***************************************
const readFields = async (req, res, next) => {
    try {
        const fields = await field_model_1.default.find().sort({ createdAt: -1 }).lean();
        res.json({
            success: true,
            message: "Fields retrieved successfully",
            fields,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, "Error reading fields"));
    }
};
exports.readFields = readFields;
// ***************************************
// ********** Update Field ***************
// ***************************************
const updateField = async (req, res, next) => {
    try {
        const { userId, body, query } = req;
        const { fieldId } = query;
        const { name, label, inputType, inputMinLength, inputMaxLength, inputPlaceholder, inputValidationPattern, inputRequired, customClassName, multipleOptions, } = body;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "fields", 2);
        if (!permissionCheck) {
            throw new error_1.CustomError(403, "Unauthorized");
        }
        if (!fieldId) {
            throw new error_1.CustomError(400, "Missing required parameter: fieldId");
        }
        const updatedField = await field_model_1.default.findByIdAndUpdate(fieldId, {
            name,
            label,
            inputType,
            inputMinLength: inputMinLength || null,
            inputMaxLength: inputMaxLength || null,
            inputPlaceholder: inputPlaceholder || null,
            inputValidationPattern: inputValidationPattern || null,
            inputRequired: inputRequired || false,
            customClassName: customClassName || null,
            multipleOptions: multipleOptions || [],
        }, { new: true });
        if (!updatedField) {
            throw new error_1.CustomError(404, "Field not found");
        }
        res.status(200).json({
            success: true,
            message: "Field updated successfully",
            field: updatedField,
        });
    }
    catch (error) {
        next(error instanceof error_1.CustomError
            ? error
            : new error_1.CustomError(500, "Error updating field"));
    }
};
exports.updateField = updateField;
// ***************************************
// ********** Delete Field ***************
// ***************************************
const deleteField = async (req, res, next) => {
    try {
        const { userId, query } = req;
        const { fieldId } = query;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "fields", 3);
        if (!permissionCheck) {
            throw new error_1.CustomError(403, "Unauthorized");
        }
        if (!fieldId) {
            throw new error_1.CustomError(400, "Missing required parameter: fieldId");
        }
        const field = await field_model_1.default.findByIdAndDelete(fieldId);
        if (!field) {
            throw new error_1.CustomError(404, "Field not found");
        }
        // Remove field references from all forms
        await form_model_1.default.updateMany({ "fields.field": fieldId }, { $pull: { fields: { field: fieldId } } });
        res.status(200).json({
            success: true,
            message: "Field deleted successfully",
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, "Error deleting field"));
    }
};
exports.deleteField = deleteField;
