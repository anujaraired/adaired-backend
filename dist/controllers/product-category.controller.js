"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.readCategories = exports.createCategory = void 0;
const product_category_model_1 = __importDefault(require("../models/product-category.model"));
const error_1 = require("../middlewares/error");
const slugify_1 = __importDefault(require("slugify"));
const authHelper_1 = require("../helpers/authHelper");
const validateInput_1 = require("../utils/validateInput");
const mongoose_1 = require("mongoose");
// **************************************************************************
// ********** Create New Category *******************************************
// **************************************************************************
const createCategory = async (req, res, next) => {
    try {
        const { userId, body } = req;
        const { name, slug, parentCategory } = body;
        // Check Permission
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "products", 0);
        if (!permissionCheck)
            return;
        // Validate user input
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        // Check for existing category by name or slug
        const existingCategory = await product_category_model_1.default.findOne({
            $or: [
                { name: { $regex: new RegExp("^" + name + "$", "i") } },
                {
                    slug: (0, slugify_1.default)(slug || name, { lower: true }),
                },
            ],
        });
        if (existingCategory) {
            throw new error_1.CustomError(400, existingCategory.name === name
                ? "Category with this name already exists"
                : "Category with this slug already exists");
        }
        // Create new category
        const newCategoryData = {
            ...body,
            slug: (0, slugify_1.default)(slug || name, { lower: true }),
            createdBy: userId,
            updatedBy: userId,
        };
        const newCategory = await product_category_model_1.default.create(newCategoryData);
        // Update parent's subcategories if applicable
        if (parentCategory) {
            await product_category_model_1.default.findByIdAndUpdate(parentCategory, {
                $addToSet: { subCategories: newCategory._id },
            });
        }
        // Populate parent category for response
        const newCategoryLean = await product_category_model_1.default.findById(newCategory._id)
            .populate("parentCategory", "name slug")
            .lean();
        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: newCategoryLean,
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
exports.createCategory = createCategory;
// **************************************************************************
// ********** Retrieve categories (single, all, or category-wise) ***********
// **************************************************************************
const readCategories = async (req, res, next) => {
    try {
        const { id, slug, status, parentCategory, includeProducts, includeSubcategoryProducts, includeSubCategories, } = req.query;
        // If no ID or slug is provided → return all categories
        if (!id && !slug) {
            const query = {};
            if (status)
                query.status = status;
            if (parentCategory)
                query.parentCategory = parentCategory;
            const categories = await product_category_model_1.default.find(query)
                .populate("parentCategory", "name slug")
                .sort({ createdAt: -1 })
                .lean();
            return res.status(200).json({
                message: "All categories",
                data: categories,
            });
        }
        // Identifier (slug or id)
        const identifier = id || slug;
        const pipeline = [];
        // Match by ID or slug
        if (identifier && typeof identifier === "string") {
            if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
                pipeline.push({
                    $match: { _id: new mongoose_1.Types.ObjectId(identifier) },
                });
            }
            else {
                pipeline.push({
                    $match: { slug: identifier },
                });
            }
        }
        // Populate subCategories
        if (includeSubCategories === "true") {
            pipeline.push({
                $lookup: {
                    from: "product_categories",
                    localField: "subCategories",
                    foreignField: "_id",
                    as: "subCategories",
                },
            });
            // If requested, populate products inside subCategories
            if (includeSubcategoryProducts === "true") {
                pipeline.push({ $unwind: "$subCategories" }, {
                    $lookup: {
                        from: "products",
                        localField: "subCategories.products",
                        foreignField: "_id",
                        as: "subCategories.products",
                    },
                }, {
                    $group: {
                        _id: "$_id",
                        subCategories: { $push: "$subCategories" },
                        root: { $first: "$$ROOT" },
                    },
                }, {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: ["$root", { subCategories: "$subCategories" }],
                        },
                    },
                });
            }
        }
        // Populate products of this category
        if (includeProducts === "true") {
            pipeline.push({
                $lookup: {
                    from: "products",
                    localField: "products",
                    foreignField: "_id",
                    as: "products",
                },
            });
        }
        // Populate parent category
        pipeline.push({
            $lookup: {
                from: "product_categories",
                localField: "parentCategory",
                foreignField: "_id",
                as: "parentCategory",
            },
        });
        pipeline.push({
            $unwind: {
                path: "$parentCategory",
                preserveNullAndEmptyArrays: true,
            },
        });
        // Execute query
        const result = await product_category_model_1.default.aggregate(pipeline);
        if (!result || result.length === 0) {
            return next(new error_1.CustomError(404, "Category not found!"));
        }
        return res.status(200).json({
            message: "Categories retrieved successfully",
            data: result[0],
        });
    }
    catch (error) {
        return next(new error_1.CustomError(500, error.message));
    }
};
exports.readCategories = readCategories;
// **************************************************************************
// ********** Update a category by ID (query parameter) *********************
// **************************************************************************
const updateCategory = async (req, res, next) => {
    try {
        const { userId, query, body } = req;
        const { id } = query;
        // Check Permission
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "products", 2);
        if (!permissionCheck)
            return;
        // Validate input
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        // Check if category exists
        const category = await product_category_model_1.default.findById(id);
        if (!category) {
            throw new error_1.CustomError(404, "Category not found");
        }
        // Check if the category exists
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        // Check for duplicate name or slug (excluding current category)
        if (body.name || body.slug) {
            const existingCategory = await product_category_model_1.default.findOne({
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
                    ? "Category with this name already exists"
                    : "Category with this slug already exists");
            }
        }
        // If parent category is changing, update the old and new categories
        if (body.parentCategory &&
            body.parentCategory !== category.parentCategory?.toString()) {
            // Remove from old parent's subCategories
            if (category.parentCategory) {
                await product_category_model_1.default.findByIdAndUpdate(category.parentCategory, {
                    $pull: { subCategories: category._id },
                }, { new: true });
            }
            // Add to new parent's subCategories
            await product_category_model_1.default.findByIdAndUpdate(body.parentCategory, {
                $addToSet: { subCategories: category._id },
            });
        }
        body.updatedBy = userId;
        // Update category
        const updatedCategory = await product_category_model_1.default.findByIdAndUpdate(id, {
            ...body,
            updatedBy: userId,
            slug: body.slug && (0, slugify_1.default)(body.slug, { lower: true }),
        }, { new: true, runValidators: true }).populate("parentCategory", "name slug");
        if (!updatedCategory) {
            throw new error_1.CustomError(404, "Category not found");
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
exports.updateCategory = updateCategory;
// **************************************************************************
// ********** Delete a category by ID (query parameter) *********************
// **************************************************************************
const deleteCategory = async (req, res, next) => {
    try {
        const { userId, query } = req;
        const { id } = query;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "products", 3);
        if (!permissionCheck)
            return;
        // Check if category exists
        const category = await product_category_model_1.default.findById(id);
        if (!category) {
            throw new error_1.CustomError(404, "Category not found");
        }
        // Check if category has subcategories
        if (category.subCategories.length > 0) {
            throw new error_1.CustomError(400, "Cannot delete category with subcategories. Delete subcategories first.");
        }
        // Remove from parent's subCategories if applicable
        if (category.parentCategory) {
            await product_category_model_1.default.findByIdAndUpdate(category.parentCategory, {
                $pull: { subCategories: category._id },
            });
        }
        // Delete category
        await product_category_model_1.default.findByIdAndDelete(id);
        res.status(200).json({
            message: "Category deleted successfully",
            data: null,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.deleteCategory = deleteCategory;
