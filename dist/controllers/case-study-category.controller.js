"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCaseStudyCategory = exports.updateCaseStudyCategory = exports.getCaseStudyCategories = exports.newCaseStudyCategory = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const case_study_category_model_1 = __importDefault(require("../models/case-study-category.model"));
const error_1 = require("../middlewares/error");
const authHelper_1 = require("../helpers/authHelper");
const validateInput_1 = require("../utils/validateInput");
const slugify_1 = __importDefault(require("slugify"));
// **************************************************************************
// ********** Create New Case Study Category *********************************
// **************************************************************************
const newCaseStudyCategory = async (req, res, next) => {
    try {
        const { userId, body } = req;
        const { name, slug, canonicalLink, parentCategory } = body;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "case-study-categories", 0);
        if (!permissionCheck)
            return;
        // Validate user input
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        // Check for existing category by name or slug
        const existingCategory = await case_study_category_model_1.default.findOne({
            $or: [
                { name: { $regex: new RegExp("^" + name + "$", "i") } },
                {
                    slug: (0, slugify_1.default)(slug || name, { lower: true }),
                },
            ],
        });
        if (existingCategory) {
            throw new error_1.CustomError(400, existingCategory.name === name
                ? "Case study category with this name already exists"
                : "Case study category with this slug already exists");
        }
        // Create new case study category
        const newCategoryData = {
            ...body,
            slug: (0, slugify_1.default)(slug || name, { lower: true }),
            createdBy: userId,
            updatedBy: userId,
        };
        const newCategory = await case_study_category_model_1.default.create(newCategoryData);
        // Update parent's subcategories if applicable
        if (parentCategory) {
            await case_study_category_model_1.default.findByIdAndUpdate(parentCategory, {
                $addToSet: { subCategories: newCategory._id },
            });
        }
        res.status(201).json({
            message: "New Category created successfully",
            data: newCategory,
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
exports.newCaseStudyCategory = newCaseStudyCategory;
// **************************************************************************
// ********** Retrieve Case Study Categories (single, all, or category-wise case studies) *****
// **************************************************************************
const getCaseStudyCategories = async (req, res, next) => {
    try {
        const { id, slug, status, parentCategory, includeCaseStudies } = req.query;
        // Build query
        const query = {};
        if (id) {
            query._id = id;
        }
        else if (slug) {
            query.slug = slug;
        }
        if (status) {
            query.status = status;
        }
        if (parentCategory) {
            query.parentCategory = parentCategory;
        }
        // Populate case studies if requested
        const populateOptions = includeCaseStudies === "true" ? [{ path: "caseStudies" }] : [];
        // Execute query
        const categories = await case_study_category_model_1.default.find(query)
            .populate(populateOptions)
            .populate({
            path: "parentCategory",
            select: "name slug",
        })
            .lean();
        res.status(200).json({
            message: "Categories retrieved successfully",
            data: categories,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.getCaseStudyCategories = getCaseStudyCategories;
// **************************************************************************
// ********** Update a Case Study Category by ID (query parameter) ***********
// **************************************************************************
const updateCaseStudyCategory = async (req, res, next) => {
    try {
        const { userId, query, body } = req;
        const { id } = query;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "case-study-categories", 2);
        if (!permissionCheck)
            return;
        // Validate input
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        // Check if category exists
        const category = await case_study_category_model_1.default.findById(id);
        if (!category) {
            throw new error_1.CustomError(404, "Case study category not found");
        }
        // Check for duplicate name or slug (excluding current category)
        if (body.name || body.slug) {
            const existingCategory = await case_study_category_model_1.default.findOne({
                $or: [
                    {
                        name: {
                            $regex: new RegExp("^" + body.name + "$", "i"),
                        },
                    },
                    {
                        slug: (0, slugify_1.default)(body.slug || body.name, {
                            lower: true,
                        }),
                    },
                ],
                _id: { $ne: id },
            });
            if (existingCategory) {
                throw new error_1.CustomError(400, existingCategory.name === body.name
                    ? "Case study category with this name already exists"
                    : "Case study category with this slug already exists");
            }
        }
        // Update parentCategory's subCategories if changed
        if (body.parentCategory &&
            body.parentCategory !== category.parentCategory?.toString()) {
            // Remove from old parent's subCategories
            if (category.parentCategory) {
                await case_study_category_model_1.default.findByIdAndUpdate(category.parentCategory, {
                    $pull: { subCategories: category._id },
                });
            }
            // Add to new parent's subCategories
            await case_study_category_model_1.default.findByIdAndUpdate(body.parentCategory, {
                $addToSet: { subCategories: category._id },
            });
        }
        // Update case study category
        const updatedCategory = await case_study_category_model_1.default.findByIdAndUpdate(id, {
            ...body,
            updatedBy: userId,
            slug: body.slug && (0, slugify_1.default)(body.slug, { lower: true }),
        }, { new: true, runValidators: true });
        if (!updatedCategory) {
            throw new error_1.CustomError(404, "Case study category not found");
        }
        res.status(200).json({
            message: "Category updated successfully",
            data: updatedCategory,
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
exports.updateCaseStudyCategory = updateCaseStudyCategory;
// **************************************************************************
// ********** Delete a Case Study Category by ID (query parameter) ***********
// **************************************************************************
const deleteCaseStudyCategory = async (req, res, next) => {
    try {
        const { userId, query } = req;
        const { id } = query;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "case-study-categories", 3);
        if (!permissionCheck)
            return;
        // Validate ID
        if (!id || !mongoose_1.default.isValidObjectId(id)) {
            throw new error_1.CustomError(400, "Valid case study category ID is required");
        }
        // Check if category exists
        const category = await case_study_category_model_1.default.findById(id);
        if (!category) {
            throw new error_1.CustomError(404, "Case study category not found");
        }
        // Check if category has subcategories
        if (category.subCategories.length > 0) {
            throw new error_1.CustomError(400, "Cannot delete case study category with subcategories. Delete subcategories first.");
        }
        // Remove from parent's subCategories if applicable
        if (category.parentCategory) {
            await case_study_category_model_1.default.findByIdAndUpdate(category.parentCategory, {
                $pull: { subCategories: category._id },
            });
        }
        // Delete case study category
        await case_study_category_model_1.default.findByIdAndDelete(id);
        res.status(200).json({
            message: "Category deleted successfully",
            data: null,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.deleteCaseStudyCategory = deleteCaseStudyCategory;
