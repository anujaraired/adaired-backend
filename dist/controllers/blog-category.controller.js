"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBlogCategory = exports.updateBlogCategory = exports.getBlogCategories = exports.newBlogCategory = void 0;
const blog_category_model_1 = __importDefault(require("../models/blog-category.model"));
const error_1 = require("../middlewares/error");
const authHelper_1 = require("../helpers/authHelper");
const validateInput_1 = require("../utils/validateInput");
const slugify_1 = __importDefault(require("slugify"));
// **************************************************************************
// ********** Create New Category *******************************************
// **************************************************************************
const newBlogCategory = async (req, res, next) => {
    try {
        const { userId, body } = req;
        const { name, slug, parentCategory } = body;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "blogs", 0);
        if (!permissionCheck)
            return;
        // Validate user input
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        // Check for existing category by name or slug
        const existingCategory = await blog_category_model_1.default.findOne({
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
        let newCategory = await blog_category_model_1.default.create(newCategoryData);
        // Update parent's subcategories if applicable
        if (parentCategory) {
            await blog_category_model_1.default.findByIdAndUpdate(parentCategory, {
                $addToSet: { subCategories: newCategory._id },
            });
        }
        // Populate parent category for response
        const newCategoryLean = await blog_category_model_1.default
            .findById(newCategory._id)
            .populate("parentCategory", "name slug")
            .lean();
        res.status(201).json({
            message: "New blog category created successfully",
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
exports.newBlogCategory = newBlogCategory;
// **************************************************************************
// ********** Retrieve categories (single, all, or category-wise blogs) *****
// **************************************************************************
const getBlogCategories = async (req, res, next) => {
    try {
        const { id, slug, status, parentCategory, includeBlogs } = req.query;
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
        // Populate blogs if requested
        const populateOptions = includeBlogs === "true" ? [{ path: "blogs" }] : [];
        // Execute query
        const categories = await blog_category_model_1.default.find(query)
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
exports.getBlogCategories = getBlogCategories;
// **************************************************************************
// ********** Update a category by ID (query parameter) *********************
// **************************************************************************
const updateBlogCategory = async (req, res, next) => {
    try {
        const { userId, query, body } = req;
        const { id } = query;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "blog", 2);
        if (!permissionCheck)
            return;
        // Validate input
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        // Check if category exists
        const category = await blog_category_model_1.default.findById(id);
        if (!category) {
            throw new error_1.CustomError(404, "Category not found");
        }
        // Check for duplicate name or slug (excluding current category)
        if (body.name || body.slug) {
            const existingCategory = await blog_category_model_1.default.findOne({
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
        // Update parentCategory's subCategories if changed
        if (body.parentCategory &&
            body.parentCategory !== category.parentCategory?.toString()) {
            // Remove from old parent's subCategories
            if (category.parentCategory) {
                await blog_category_model_1.default.findByIdAndUpdate(category.parentCategory, {
                    $pull: { subCategories: category._id },
                });
            }
            // Add to new parent's subCategories
            await blog_category_model_1.default.findByIdAndUpdate(body.parentCategory, {
                $addToSet: { subCategories: category._id },
            });
        }
        // Update category
        const updatedCategory = await blog_category_model_1.default.findByIdAndUpdate(id, {
            ...body,
            updatedBy: userId,
            slug: body.slug && (0, slugify_1.default)(body.slug, { lower: true }),
        }, { new: true, runValidators: true });
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
exports.updateBlogCategory = updateBlogCategory;
// **************************************************************************
// ********** Delete a category by ID (query parameter) *********************
// **************************************************************************
const deleteBlogCategory = async (req, res, next) => {
    try {
        const { userId, query } = req;
        const { id } = query;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "blog-categories", 3);
        if (!permissionCheck)
            return;
        // Check if category exists
        const category = await blog_category_model_1.default.findById(id);
        if (!category) {
            throw new error_1.CustomError(404, "Category not found");
        }
        // Check if category has subcategories
        if (category.subCategories.length > 0) {
            throw new error_1.CustomError(400, "Cannot delete category with subcategories. Delete subcategories first.");
        }
        // Remove from parent's subCategories if applicable
        if (category.parentCategory) {
            await blog_category_model_1.default.findByIdAndUpdate(category.parentCategory, {
                $pull: { subCategories: category._id },
            });
        }
        // Delete category
        await blog_category_model_1.default.findByIdAndDelete(id);
        res.status(200).json({
            message: "Category deleted successfully",
            data: null,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.deleteBlogCategory = deleteBlogCategory;
