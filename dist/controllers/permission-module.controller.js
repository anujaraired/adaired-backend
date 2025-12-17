"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteModule = exports.updateModule = exports.findModules = exports.createModule = void 0;
const permission_modules_model_1 = __importDefault(require("../models/permission-modules.model"));
const authHelper_1 = require("../helpers/authHelper");
const error_1 = require("../middlewares/error");
const validateInput_1 = require("../utils/validateInput");
// ***************************************
// ********** Create Module **************
// ***************************************
const createModule = async (req, res, next) => {
    try {
        const { userId, body } = req;
        if (!(await (0, authHelper_1.checkPermission)(userId, "Permission_Modules", 0)))
            throw new error_1.CustomError(403, "Permission denied");
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        const createdModule = await permission_modules_model_1.default.create(body);
        res.status(201).json({
            message: "Module created successfully",
            data: createdModule,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.createModule = createModule;
// ***************************************
// ********** Find Modules ***************
// ***************************************
const findModules = async (req, res, next) => {
    try {
        const { userId } = req;
        const { identifier } = req.query;
        let modules;
        if (identifier) {
            const idString = identifier.toString();
            if (idString.match(/^[0-9a-fA-F]{24}$/)) {
                modules = await permission_modules_model_1.default.findById(identifier).lean();
            }
            else {
                modules = await permission_modules_model_1.default.findOne({ name: identifier }).lean();
            }
        }
        else {
            modules = await permission_modules_model_1.default.find().lean();
        }
        res.status(200).json({
            message: "Modules fetched successfully",
            data: modules,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.findModules = findModules;
// ***************************************
// ********** Update Module **************
// ***************************************
const updateModule = async (req, res, next) => {
    try {
        const { userId } = req;
        const { id } = req.query;
        if (!(await (0, authHelper_1.checkPermission)(userId, "Permission_Modules", 2)))
            throw new error_1.CustomError(403, "Permission denied");
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        const updatedModule = await permission_modules_model_1.default.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedModule)
            throw new error_1.CustomError(404, "Module not found");
        res.status(200).json({
            message: "Module updated successfully",
            data: updatedModule,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.updateModule = updateModule;
// ***************************************
// ********** Delete Module **************
// ***************************************
const deleteModule = async (req, res, next) => {
    try {
        const { userId } = req;
        const { id } = req.query;
        if (!(await (0, authHelper_1.checkPermission)(userId, "Permission_Modules", 3)))
            throw new error_1.CustomError(403, "Permission denied");
        const deletedModule = await permission_modules_model_1.default.findByIdAndDelete(id);
        if (!deletedModule)
            throw new error_1.CustomError(404, "Module not found");
        res.status(200).json({
            message: "Module deleted successfully",
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.deleteModule = deleteModule;
