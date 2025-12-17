"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBlog = exports.updateBlog = exports.readBlog = exports.newBlog = void 0;
const blog_model_1 = __importDefault(require("../models/blog.model"));
const error_1 = require("../middlewares/error");
const authHelper_1 = require("../helpers/authHelper");
const slugify_1 = __importDefault(require("slugify"));
const validateInput_1 = require("../utils/validateInput");
const blog_category_model_1 = __importDefault(require("../models/blog-category.model"));
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const seo_schema_model_1 = require("../models/seo-schema.model");
// ************************************************************************** //
// ********** Create New Blog *********************************************** //
// ************************************************************************** //
const newBlog = async (req, res, next) => {
    try {
        const { userId, body } = req;
        const { postTitle, slug, category, postDescription, scheduledPublishDate } = body;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "blogs", 0);
        if (!permissionCheck) {
            throw new error_1.CustomError(403, "Insufficient permissions to create blog");
        }
        // Validate user input
        if (!(0, validateInput_1.validateInput)(req, res)) {
            return;
        }
        // Sanitize inputs
        const sanitizedPostTitle = (0, sanitize_html_1.default)(postTitle);
        const sanitizedPostDescription = (0, sanitize_html_1.default)(postDescription);
        // Check if category exists (if provided)
        if (category) {
            const categoryExists = await blog_category_model_1.default.findById(category);
            if (!categoryExists) {
                throw new error_1.CustomError(400, "Invalid category ID");
            }
        }
        // Validate scheduledPublishDate if status is "scheduled"
        if (body.status === "scheduled" && !scheduledPublishDate) {
            throw new error_1.CustomError(400, "Scheduled publish date is required when status is set to 'scheduled'");
        }
        // Validate scheduledPublishDate if provided
        if (scheduledPublishDate) {
            const publishDate = new Date(scheduledPublishDate);
            if (isNaN(publishDate.getTime()) || publishDate <= new Date()) {
                throw new error_1.CustomError(400, "Scheduled publish date must be a valid future date");
            }
        }
        // Check for existing blog by title or slug
        const generatedSlug = (0, slugify_1.default)(slug || sanitizedPostTitle, { lower: true });
        const existingBlog = await blog_model_1.default.findOne({
            $or: [
                { postTitle: { $regex: new RegExp(`^${sanitizedPostTitle}$`, "i") } },
                { slug: generatedSlug },
            ],
        });
        if (existingBlog) {
            throw new error_1.CustomError(400, existingBlog.postTitle.toLowerCase() ===
                sanitizedPostTitle.toLowerCase()
                ? "Blog with this title already exists"
                : "Blog with this slug already exists");
        }
        // Create new blog
        const newBlogData = {
            ...body,
            postTitle: sanitizedPostTitle,
            postDescription: sanitizedPostDescription,
            slug: generatedSlug,
            blogAuthor: userId,
            updatedBy: userId,
            category: category || null,
            status: scheduledPublishDate ? "scheduled" : body.status || "draft",
            scheduledPublishDate: scheduledPublishDate
                ? new Date(scheduledPublishDate)
                : null,
        };
        const newBlog = await blog_model_1.default.create(newBlogData);
        // Update blog category if provided
        if (category) {
            await blog_category_model_1.default.findByIdAndUpdate(category, { $push: { blogs: newBlog._id } }, { new: true });
        }
        res.status(201).json({
            success: true,
            message: "Blog created successfully",
            data: newBlog,
        });
    }
    catch (error) {
        if (error.message.includes("required") || error.message.includes("empty")) {
            next(new error_1.CustomError(400, error.message));
        }
        else {
            next(new error_1.CustomError(error.status || 500, error.message));
        }
    }
};
exports.newBlog = newBlog;
// ************************************************************************** //
// ********** Retrieve Blog (single, all, or category-wise blogs) *********** //
// ************************************************************************** //
const readBlog = async (req, res, next) => {
    try {
        const { id, slug, category, status, limit, skip = 0 } = req.query;
        // Build query with type safety
        const query = {};
        if (id && typeof id === "string") {
            query._id = id;
        }
        else if (slug && typeof slug === "string") {
            query.slug = slug;
        }
        else if (status && typeof status === "string") {
            query.status = status;
        }
        if (category && typeof category === "string") {
            const categoryExists = await blog_category_model_1.default.findById(category);
            if (!categoryExists) {
                throw new error_1.CustomError(400, "Invalid category ID");
            }
            query.category = category;
        }
        // Convert limit and skip to numbers
        const numericLimit = limit ? parseInt(limit) : undefined;
        const numericSkip = parseInt(skip);
        // Execute query with pagination
        const queryBuilder = blog_model_1.default.find(query)
            .populate({
            path: "blogAuthor",
            select: "-__v -cart -wishlist -orderHistory",
        })
            .populate({
            path: "category",
            select: "name image",
        })
            .sort({ createdAt: -1 })
            .lean();
        // Apply limit if provided
        if (numericLimit) {
            queryBuilder.limit(numericLimit);
        }
        // Always apply skip
        queryBuilder.skip(numericSkip);
        const blogs = await queryBuilder.exec();
        res.status(200).json({
            success: true,
            message: "Blogs fetched successfully",
            data: blogs,
        });
    }
    catch (error) {
        next(new error_1.CustomError(error.status || 500, error.message));
    }
};
exports.readBlog = readBlog;
// ************************************************************************** //
// ********** Update a Blog ************************************************* //
// ************************************************************************** //
const updateBlog = async (req, res, next) => {
    try {
        const { userId, query, body } = req;
        const { id } = query;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "blogs", 2);
        if (!permissionCheck) {
            throw new error_1.CustomError(403, "Insufficient permissions to update blog");
        }
        // Validate input
        if (!(0, validateInput_1.validateInput)(req, res)) {
            return;
        }
        // Check if blog exists
        const blog = await blog_model_1.default.findById(id);
        if (!blog) {
            throw new error_1.CustomError(404, "Blog not found");
        }
        // Sanitize inputs
        const sanitizedPostTitle = body.postTitle
            ? (0, sanitize_html_1.default)(body.postTitle)
            : blog.postTitle;
        const sanitizedPostDescription = body.postDescription
            ? (0, sanitize_html_1.default)(body.postDescription)
            : blog.postDescription;
        // Check if category exists (if provided)
        if (body.category) {
            const categoryExists = await blog_category_model_1.default.findById(body.category);
            if (!categoryExists) {
                throw new error_1.CustomError(400, "Invalid category ID");
            }
        }
        // Validate scheduledPublishDate if status is "scheduled"
        if (body.status === "scheduled" && !body.scheduledPublishDate) {
            throw new error_1.CustomError(400, "Scheduled publish date is required when status is set to 'scheduled'");
        }
        // Validate scheduledPublishDate if provided
        if (body.scheduledPublishDate) {
            const publishDate = new Date(body.scheduledPublishDate);
            if (isNaN(publishDate.getTime()) || publishDate <= new Date()) {
                throw new error_1.CustomError(400, "Scheduled publish date must be a valid future date");
            }
        }
        // Check for duplicate title or slug (excluding current blog)
        if (body.postTitle || body.slug) {
            const generatedSlug = (0, slugify_1.default)(body.slug || sanitizedPostTitle, {
                lower: true,
            });
            const existingBlog = await blog_model_1.default.findOne({
                $or: [
                    {
                        postTitle: {
                            $regex: new RegExp(`^${sanitizedPostTitle}$`, "i"),
                        },
                    },
                    { slug: generatedSlug },
                ],
                _id: { $ne: id },
            });
            if (existingBlog) {
                throw new error_1.CustomError(400, existingBlog.postTitle.toLowerCase() ===
                    sanitizedPostTitle.toLowerCase()
                    ? "Blog with this title already exists"
                    : "Blog with this slug already exists");
            }
            body.slug = generatedSlug;
        }
        // Update category if changed
        if (body.category && body.category !== blog.category?.toString()) {
            // Remove blog from old category
            if (blog.category) {
                await blog_category_model_1.default.findByIdAndUpdate(blog.category, { $pull: { blogs: blog._id } }, { new: true });
            }
            // Add blog to new category
            await blog_category_model_1.default.findByIdAndUpdate(body.category, { $push: { blogs: blog._id } }, { new: true });
        }
        // Update seo.lastModified if SEO fields are present
        if ((0, seo_schema_model_1.hasSeoFields)(body)) {
            body.seo = {
                ...body.seo,
                lastModified: Date.now(),
            };
        }
        // Update blog
        const updatedBlog = await blog_model_1.default.findByIdAndUpdate(id, {
            ...body,
            postTitle: sanitizedPostTitle,
            postDescription: sanitizedPostDescription,
            updatedBy: userId,
            status: body.scheduledPublishDate
                ? "scheduled"
                : body.status || blog.status,
            scheduledPublishDate: body.scheduledPublishDate
                ? new Date(body.scheduledPublishDate)
                : blog.scheduledPublishDate,
        }, { new: true });
        if (!updatedBlog) {
            throw new error_1.CustomError(404, "Blog not found");
        }
        res.status(200).json({
            success: true,
            message: "Blog updated successfully",
            data: updatedBlog,
        });
    }
    catch (error) {
        if (error.message.includes("required") || error.message.includes("empty")) {
            next(new error_1.CustomError(400, error.message));
        }
        else {
            next(new error_1.CustomError(error.status || 500, error.message));
        }
    }
};
exports.updateBlog = updateBlog;
// ************************************************************************** //
// ********** Delete a Blog ************************************************* //
// ************************************************************************** //
const deleteBlog = async (req, res, next) => {
    try {
        const { userId, query } = req;
        const { id } = query;
        // Check permissions
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "blogs", 3);
        if (!permissionCheck) {
            throw new error_1.CustomError(403, "Insufficient permissions to delete blog");
        }
        // Check if blog exists and delete it
        const blog = await blog_model_1.default.findByIdAndDelete(id);
        if (!blog) {
            throw new error_1.CustomError(404, "Blog not found");
        }
        // Remove blog from its category if assigned
        if (blog.category) {
            await blog_category_model_1.default.findByIdAndUpdate(blog.category, { $pull: { blogs: blog._id } }, { new: true });
        }
        res.status(200).json({
            success: true,
            message: "Blog deleted successfully",
            data: null,
        });
    }
    catch (error) {
        next(new error_1.CustomError(error.status || 500, error.message));
    }
};
exports.deleteBlog = deleteBlog;
