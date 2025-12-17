"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteForm = exports.updateForm = exports.readForm = exports.createForm = void 0;
const form_model_1 = __importDefault(require("../models/form.model"));
const error_1 = require("../middlewares/error");
const authHelper_1 = require("../helpers/authHelper");
// ***************************************
// ********** Create New Form ************
// ***************************************
const createForm = async (req, res, next) => {
    try {
        const { body, userId } = req;
        let { title, fields } = body;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "custom-forms", 0);
        if (!permissionCheck) {
            throw new error_1.CustomError(403, "Unauthorized");
        }
        // Validate and assign field order
        fields = fields.map((field, index) => ({
            field: field.field,
            fieldOrder: field.fieldOrder || index + 1,
        }));
        const form = await form_model_1.default.create({
            title,
            fields,
            createdBy: userId,
        });
        const populatedForm = await form_model_1.default.findById(form._id)
            .populate("createdBy updatedBy", "name email role isAdmin")
            .populate("fields.field");
        res.status(201).json({
            success: true,
            message: "Form created successfully",
            form: populatedForm,
        });
    }
    catch (error) {
        if (error instanceof error_1.CustomError) {
            next(new error_1.CustomError(500, "Error creating form"));
        }
    }
};
exports.createForm = createForm;
// ***************************************
// ********** Read Form ******************
// ***************************************
const readForm = async (req, res, next) => {
    try {
        const { formId, ...queryParams } = req.query;
        const filter = { ...queryParams };
        if (formId) {
            const form = await form_model_1.default.findById(formId)
                .populate("createdBy updatedBy", "name email role isAdmin")
                .populate("fields.field")
                .lean();
            if (!form) {
                throw new error_1.CustomError(404, "Form not found");
            }
            res.json({ success: true, form });
        }
        else {
            const forms = await form_model_1.default.find(filter)
                .populate("createdBy updatedBy", "name email role isAdmin")
                .populate("fields.field")
                .sort({ createdAt: -1 })
                .lean();
            res.json({
                success: true,
                message: "Forms retrieved successfully",
                forms,
            });
        }
    }
    catch (error) {
        console.error("Error reading form:", error);
        next(new error_1.CustomError(500, "Error reading form"));
    }
};
exports.readForm = readForm;
// ***************************************
// ********** Update Form ****************
// ***************************************
const updateForm = async (req, res, next) => {
    try {
        const { userId, body, query } = req;
        const { formId } = query;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "custom-forms", 2);
        if (!permissionCheck) {
            throw new error_1.CustomError(403, "Unauthorized");
        }
        if (!formId) {
            return next(new error_1.CustomError(400, "Missing required query parameter: formId"));
        }
        // Handle status toggle if provided
        if (body.status !== undefined &&
            !["active", "inactive"].includes(body.status)) {
            throw new error_1.CustomError(400, "Invalid status value. Use 'active' or 'inactive'");
        }
        // Update field orders if provided
        if (body.fields) {
            body.fields = body.fields.map((field, index) => ({
                field: field.field,
                fieldOrder: field.fieldOrder || index + 1,
            }));
        }
        const updatedForm = await form_model_1.default.findByIdAndUpdate(formId, body, {
            new: true,
        });
        if (!updatedForm) {
            return next(new error_1.CustomError(404, "Form not found"));
        }
        const populatedForm = await form_model_1.default.findById(updatedForm._id)
            .populate("createdBy updatedBy", "name email role isAdmin")
            .populate("fields.field");
        res.status(200).json({
            success: true,
            message: "Form updated successfully",
            form: populatedForm,
        });
    }
    catch (error) {
        next(error instanceof error_1.CustomError
            ? error
            : new error_1.CustomError(500, "Error updating form"));
    }
};
exports.updateForm = updateForm;
// ***************************************
// ********** Delete Form ****************
// ***************************************
const deleteForm = async (req, res, next) => {
    try {
        const { userId, body, query } = req;
        const { formId } = query;
        const { formIds } = body;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "custom-forms", 3);
        if (!permissionCheck) {
            throw new error_1.CustomError(403, "Unauthorized");
        }
        if (formIds && Array.isArray(formIds) && formIds.length > 0) {
            // Bulk delete
            const result = await form_model_1.default.deleteMany({ _id: { $in: formIds } });
            if (result.deletedCount === 0) {
                throw new error_1.CustomError(404, "No forms found to delete");
            }
            res.status(200).json({
                message: `${result.deletedCount} form(s) deleted successfully`,
            });
        }
        else if (formId) {
            // Single delete
            const form = await form_model_1.default.findByIdAndDelete(formId);
            if (!form) {
                throw new error_1.CustomError(404, "Form not found");
            }
            res.status(200).json({
                success: true,
                message: "Form deleted successfully",
            });
        }
        else {
            throw new error_1.CustomError(400, "Missing required parameter: formId or formIds");
        }
    }
    catch (error) {
        next(new error_1.CustomError(500, "Error deleting form"));
    }
};
exports.deleteForm = deleteForm;
