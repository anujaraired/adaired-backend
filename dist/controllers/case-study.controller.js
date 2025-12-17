"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCaseStudy = exports.updateCaseStudy = exports.getCaseStudy = exports.createCaseStudy = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const case_study_model_1 = __importDefault(require("../models/case-study.model"));
const error_1 = require("../middlewares/error");
const authHelper_1 = require("../helpers/authHelper");
const validateInput_1 = require("../utils/validateInput");
const slugify_1 = __importDefault(require("slugify"));
const case_study_category_model_1 = __importDefault(require("../models/case-study-category.model"));
// **************************************************************************
// ********** Create New Case Study  ****************************************
// **************************************************************************
const createCaseStudy = async (req, res, next) => {
    try {
        const { userId, body } = req;
        const { name, slug, category } = body;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "case-studies", 0);
        if (!permissionCheck)
            return;
        // Validate user input
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        // Check if category exists
        const newSlug = (0, slugify_1.default)(slug || name, { lower: true });
        const existingCaseStudy = await case_study_model_1.default.findOne({
            $or: [
                { name: { $regex: new RegExp("^" + name + "$", "i") } },
                { slug: newSlug },
            ],
        });
        if (existingCaseStudy) {
            return next(new error_1.CustomError(400, existingCaseStudy.name.toLowerCase() === name.toLowerCase()
                ? "Case study with this name already exists"
                : "Case study with this slug already exists"));
        }
        // Create new case study
        const newCaseStudy = {
            ...body,
            slug: (0, slugify_1.default)(slug || name, { lower: true }),
            category: category,
            createdBy: userId,
            updatedBy: userId,
        };
        const caseStudy = await case_study_model_1.default.create(newCaseStudy);
        // Update category if provided
        if (category) {
            await case_study_category_model_1.default.findByIdAndUpdate(category, { $addToSet: { caseStudies: caseStudy._id } }, { new: true });
        }
        // Populate references
        const populatedCaseStudy = await case_study_model_1.default.findById(caseStudy._id)
            .populate("category", "name slug")
            .populate("createdBy", "image name email")
            .populate("updatedBy", "image name email")
            .lean();
        res.status(201).json({
            success: true,
            message: "Case study created successfully",
            data: populatedCaseStudy,
        });
    }
    catch (error) {
        // Handle validation errors
        if (error.message.includes("required") || error.message.includes("empty")) {
            next(new error_1.CustomError(400, error.message));
        }
        else {
            next(new error_1.CustomError(500, error.message));
        }
    }
};
exports.createCaseStudy = createCaseStudy;
// **************************************************************************
// ********** Retrieve Case Study *******************************************
// **************************************************************************
const getCaseStudy = async (req, res, next) => {
    try {
        const { query } = req;
        const { id, slug, includeInactive } = query;
        const queryObject = {};
        if (id && !(0, mongoose_1.isValidObjectId)(id)) {
            return next(new error_1.CustomError(400, "Invalid case study ID"));
        }
        if (slug && typeof slug !== "string") {
            return next(new error_1.CustomError(400, "Invalid slug format"));
        }
        if (id) {
            queryObject._id = id;
        }
        else if (slug) {
            queryObject.slug = (0, slugify_1.default)(slug, { lower: true });
        }
        if (includeInactive !== "true") {
            queryObject.status = "active";
        }
        let caseStudies;
        let message = "Case studies retrieved successfully";
        if (id || slug) {
            const caseStudy = await case_study_model_1.default.findOne(queryObject)
                .populate("category", "name slug")
                .populate("createdBy", "image name email")
                .populate("updatedBy", "image name email")
                .lean();
            if (!caseStudy) {
                return next(new error_1.CustomError(404, "Case study not found with provided ID or slug"));
            }
            caseStudies = caseStudy;
            message = "Case study retrieved successfully";
        }
        else {
            caseStudies = await case_study_model_1.default.find(queryObject)
                .populate("category", "name slug")
                .populate("createdBy", "image name email")
                .populate("updatedBy", "image name email")
                .lean();
        }
        res.status(200).json({
            success: true,
            message,
            data: id || slug ? caseStudies : caseStudies,
        });
    }
    catch (error) {
        console.error("Error retrieving case studies:", error.message);
        if (error.message.includes("required") || error.message.includes("empty")) {
            next(new error_1.CustomError(400, error.message));
        }
        else {
            next(new error_1.CustomError(500, error.message || "Internal server error"));
        }
    }
};
exports.getCaseStudy = getCaseStudy;
// **************************************************************************
// ********** Update Case Study by ID ***************************************
// **************************************************************************
const updateCaseStudy = async (req, res, next) => {
    try {
        const { userId, body } = req;
        const { id, name, slug, category, colorScheme, status, bodyData, seo } = body;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "case-studies", 2);
        if (!permissionCheck)
            return;
        // Validate user input
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        // Check if case study exists
        const caseStudy = await case_study_model_1.default.findById(id);
        if (!caseStudy) {
            return next(new error_1.CustomError(404, "Case study not found"));
        }
        // Check for duplicate name or slug
        const newSlug = (0, slugify_1.default)(slug || name || caseStudy.name, { lower: true });
        if (name !== caseStudy.name || newSlug !== caseStudy.slug) {
            const existingCaseStudy = await case_study_category_model_1.default.findOne({
                $or: [
                    {
                        name: {
                            $regex: new RegExp("^" + (name || caseStudy.name) + "$", "i"),
                        },
                    },
                    { slug: newSlug },
                ],
                _id: { $ne: id },
            });
            if (existingCaseStudy) {
                return next(new error_1.CustomError(400, existingCaseStudy.name.toLowerCase() ===
                    (name || caseStudy.name).toLowerCase()
                    ? "Case study with this name already exists"
                    : "Case study with this slug already exists"));
            }
        }
        // Update category relationships
        if (category && category !== caseStudy.category?.toString()) {
            // Remove from old category
            if (caseStudy.category) {
                await case_study_category_model_1.default.findByIdAndUpdate(caseStudy.category, { $pull: { caseStudies: id } }, { new: true });
            }
            // Add to new category
            await case_study_category_model_1.default.findByIdAndUpdate(category, { $addToSet: { caseStudies: id } }, { new: true });
        }
        // Build update object
        const updateData = {
            ...(name && { name }),
            ...(slug && { slug: newSlug }),
            ...(category && { category }),
            ...(colorScheme && { colorScheme }),
            ...(status && { status }),
            ...(bodyData && { bodyData }),
            ...(seo && { seo }),
            updatedBy: userId
                ? new mongoose_1.default.Types.ObjectId(userId)
                : caseStudy.updatedBy,
        };
        // Update case study
        const updatedCaseStudy = await case_study_model_1.default.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        })
            .populate("category", "name slug")
            .populate("createdBy", "image name email")
            .populate("updatedBy", "image name email")
            .lean();
        if (!updatedCaseStudy) {
            return next(new error_1.CustomError(404, "Failed to update case study"));
        }
        res.status(200).json({
            success: true,
            message: "Case study updated successfully",
            data: updatedCaseStudy,
        });
    }
    catch (error) {
        if (error.message.includes("required") || error.message.includes("empty")) {
            next(new error_1.CustomError(400, error.message));
        }
        else {
            next(new error_1.CustomError(500, error.message));
        }
    }
};
exports.updateCaseStudy = updateCaseStudy;
// **************************************************************************
// ********** Delete a Case Study by ID *************************************
// **************************************************************************
const deleteCaseStudy = async (req, res, next) => {
    try {
        const { userId, query } = req;
        const { id } = query;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "case-studies", 3);
        if (!permissionCheck)
            return;
        // Check if case study exists
        const caseStudy = await case_study_model_1.default.findById(id);
        if (!caseStudy) {
            return next(new error_1.CustomError(404, "Case study not found"));
        }
        // Remove from category
        if (caseStudy.category && case_study_category_model_1.default) {
            await case_study_category_model_1.default.findByIdAndUpdate(caseStudy.category, { $pull: { caseStudies: id } }, { new: true });
        }
        // Delete case study
        await case_study_model_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "Case study deleted successfully",
            data: null,
        });
    }
    catch (error) {
        if (error.message.includes("required") || error.message.includes("empty")) {
            next(new error_1.CustomError(400, error.message));
        }
        else {
            next(new error_1.CustomError(500, error.message));
        }
    }
};
exports.deleteCaseStudy = deleteCaseStudy;
