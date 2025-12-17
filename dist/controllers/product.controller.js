"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.duplicateProduct = exports.deleteProduct = exports.updateProduct = exports.readProducts = exports.createProduct = void 0;
const product_model_1 = __importDefault(require("../models/product.model"));
const error_1 = require("../middlewares/error");
const slugify_1 = __importDefault(require("slugify"));
const authHelper_1 = require("../helpers/authHelper");
const mongoose_1 = require("mongoose");
const product_category_model_1 = __importDefault(require("../models/product-category.model"));
const validateInput_1 = require("../utils/validateInput");
// Helper function to check if a slug is unique
const isSlugUnique = async (slug, excludeProductId) => {
    const query = { slug };
    if (excludeProductId) {
        query._id = { $ne: excludeProductId };
    }
    const existingProduct = await product_model_1.default.findOne(query);
    return !existingProduct;
};
// Helper function to fetch product by ID or slug
const fetchProduct = async (identifier) => {
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
        return await product_model_1.default.findById(identifier);
    }
    else {
        return await product_model_1.default.findOne({ slug: identifier });
    }
};
// Helper function to update product in categories
const updateProductInCategories = async (productId, oldCategoryId, oldSubCategoryIds, newCategoryId, newSubCategoryIds) => {
    const updates = [];
    // Remove product from old category
    if (oldCategoryId) {
        updates.push(product_category_model_1.default.updateOne({ _id: oldCategoryId }, { $pull: { products: productId } }));
    }
    // Remove product from old subcategories
    if (oldSubCategoryIds && oldSubCategoryIds.length > 0) {
        updates.push(product_category_model_1.default.updateMany({ _id: { $in: oldSubCategoryIds } }, { $pull: { products: productId } }));
    }
    // Add product to new category
    if (newCategoryId) {
        updates.push(product_category_model_1.default.updateOne({ _id: newCategoryId }, { $push: { products: productId } }));
    }
    // Add product to new subcategories
    if (newSubCategoryIds && newSubCategoryIds.length > 0) {
        updates.push(product_category_model_1.default.updateMany({ _id: { $in: newSubCategoryIds } }, { $push: { products: productId } }));
    }
    // Execute all updates in parallel
    await Promise.all(updates);
};
// ***************************************
// ********** Create Product **************
// ***************************************
const createProduct = async (req, res, next) => {
    try {
        const { userId, body } = req;
        // Check Permission
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "products", 0);
        if (!permissionCheck) {
            throw new error_1.CustomError(403, "Permission denied");
        }
        // Validate user input
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        const { slug, name, subCategory, category } = body;
        // Ensure category is provided
        if (!category) {
            throw new error_1.CustomError(400, "Category is required");
        }
        // If slug is not provided, generate one from the name
        const slugToUse = slug
            ? (0, slugify_1.default)(slug, { lower: true })
            : (0, slugify_1.default)(name, { lower: true });
        // Check if the slug is unique
        if (!(await isSlugUnique(slugToUse))) {
            throw new error_1.CustomError(400, "Slug already in use");
        }
        // Handle subCategory as an array
        let subCategoryIds = [];
        let parentCategories = [];
        if (subCategory) {
            const subCategoryInput = Array.isArray(subCategory)
                ? subCategory
                : [subCategory];
            for (const subCatId of subCategoryInput) {
                const subcategory = await product_category_model_1.default.findById(subCatId);
                if (!subcategory) {
                    throw new error_1.CustomError(404, `Subcategory ${subCatId} not found`);
                }
                const parentCat = await product_category_model_1.default.findById(subcategory.parentCategory);
                if (!parentCat) {
                    throw new error_1.CustomError(404, `Parent category for subcategory ${subCatId} not found`);
                }
                subCategoryIds.push(new mongoose_1.Types.ObjectId(subCatId));
                if (!parentCategories.some((id) => id.equals(parentCat._id))) {
                    parentCategories.push(parentCat._id);
                }
            }
            // Validate provided category matches one of the parent categories
            const categoryId = new mongoose_1.Types.ObjectId(category);
            if (!parentCategories.some((id) => id.equals(categoryId))) {
                throw new error_1.CustomError(400, "Category must be a parent of at least one subcategory");
            }
        }
        // Create the product
        const newProduct = {
            ...body,
            category,
            subCategory: subCategoryIds.map((id) => id.toString()),
            slug: slugToUse,
            createdBy: body.userId || userId,
        };
        const createdProduct = await product_model_1.default.create(newProduct);
        // Update product-category relationships
        await updateProductInCategories(createdProduct._id, null, null, createdProduct.category, subCategoryIds.length > 0 ? subCategoryIds : null);
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: createdProduct,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.createProduct = createProduct;
// ***************************************
// ********** Read Product ****************
// ***************************************
const readProducts = async (req, res, next) => {
    const { id, ...queryParams } = req.query;
    const filter = { ...queryParams };
    try {
        if (id) {
            const product = await product_model_1.default.findById(id)
                .populate("createdBy category subCategory")
                .lean();
            if (!id) {
                throw new error_1.CustomError(404, "Product not found");
            }
            return res.status(200).json({
                success: true,
                message: "Product fetched successfully",
                data: product,
            });
        }
        else {
            const products = await product_model_1.default.find(filter)
                .populate("createdBy category subCategory")
                .sort({ createdAt: -1 })
                .lean();
            return res.status(200).json({
                success: true,
                message: "Product fetched successfully",
                data: products,
            });
        }
    }
    catch (error) {
        return next(new error_1.CustomError(500, error.message));
    }
};
exports.readProducts = readProducts;
// ***************************************
// ********** Update Product **************
// ***************************************
const updateProduct = async (req, res, next) => {
    try {
        const { userId, body } = req;
        const { query } = req.query;
        // Check Permission
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "products", 2);
        if (!permissionCheck) {
            throw new error_1.CustomError(403, "Permission denied");
        }
        // Validate user input
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        const idString = query.toString();
        const product = await fetchProduct(idString);
        if (!product) {
            throw new error_1.CustomError(404, "Product not found!");
        }
        if (body.slug && body.slug !== product.slug) {
            const slugToUse = (0, slugify_1.default)(body.slug, { lower: true });
            if (!(await isSlugUnique(slugToUse, product._id.toString()))) {
                throw new error_1.CustomError(400, "Slug already in use");
            }
            body.slug = slugToUse;
        }
        // Handle subCategory array update
        let newSubCategoryIds = [];
        let parentCategories = [];
        if (body.subCategory) {
            const subCategoryInput = Array.isArray(body.subCategory)
                ? body.subCategory
                : [body.subCategory];
            for (const subCatId of subCategoryInput) {
                const subcategory = await product_category_model_1.default.findById(subCatId);
                if (!subcategory) {
                    throw new error_1.CustomError(404, `Subcategory ${subCatId} not found`);
                }
                const parentCat = await product_category_model_1.default.findById(subcategory.parentCategory);
                if (!parentCat) {
                    throw new error_1.CustomError(404, `Parent category for subcategory ${subCatId} not found`);
                }
                newSubCategoryIds.push(new mongoose_1.Types.ObjectId(subCatId));
                if (!parentCategories.some((id) => id.equals(parentCat._id))) {
                    parentCategories.push(parentCat._id);
                }
            }
            // If category is provided, ensure it matches one of the parent categories
            if (body.category) {
                const categoryId = new mongoose_1.Types.ObjectId(body.category);
                if (!parentCategories.some((id) => id.equals(categoryId))) {
                    throw new error_1.CustomError(400, "Provided category must be a parent of at least one subcategory");
                }
            }
            else {
                // If no category provided, use existing or first parent category
                body.category = product.category;
            }
        }
        // Update product in categories if subCategory or category is changing
        const oldSubCategoryIds = product.subCategory
            ? product.subCategory.map((id) => new mongoose_1.Types.ObjectId(id))
            : [];
        if (body.category?.toString() !== product.category?.toString() ||
            JSON.stringify(oldSubCategoryIds) !== JSON.stringify(newSubCategoryIds)) {
            await updateProductInCategories(product._id, product.category, oldSubCategoryIds, body.category || product.category, newSubCategoryIds.length > 0 ? newSubCategoryIds : null);
            if (newSubCategoryIds.length > 0) {
                body.subCategory = newSubCategoryIds.map((id) => id.toString());
            }
        }
        // Update the product
        body.updatedBy = userId;
        const updatedProduct = await product_model_1.default.findByIdAndUpdate(product._id, { $set: body }, { new: true });
        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.updateProduct = updateProduct;
// ***************************************
// ********** Delete Product **************
// ***************************************
const deleteProduct = async (req, res, next) => {
    try {
        const { userId } = req;
        const { query } = req.query;
        // Check Permission
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "products", 3);
        if (!permissionCheck) {
            throw new error_1.CustomError(403, "Permission denied");
        }
        const idString = query.toString();
        const product = await fetchProduct(idString);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        // Remove product from categories
        const oldSubCategoryIds = product.subCategory
            ? product.subCategory.map((id) => new mongoose_1.Types.ObjectId(id))
            : [];
        await updateProductInCategories(product._id, product.category, oldSubCategoryIds, null, null);
        // Delete the product
        await product_model_1.default.findByIdAndDelete(product._id);
        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            data: null,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.deleteProduct = deleteProduct;
// ***************************************
// ********** Duplicate Product ***********
// ***************************************
const duplicateProduct = async (req, res, next) => {
    try {
        const { userId } = req;
        const { query } = req.query;
        // Check Permission
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "products", 0);
        if (!permissionCheck) {
            throw new error_1.CustomError(403, "Permission denied");
        }
        const idString = query.toString();
        const product = await fetchProduct(idString);
        if (!product) {
            throw new error_1.CustomError(404, "Product not found");
        }
        const subCategoryIds = product.subCategory
            ? product.subCategory.map((id) => new mongoose_1.Types.ObjectId(id))
            : [];
        // Prepare the duplicated product data
        const duplicatedProductData = {
            ...product.toObject(),
            _id: new mongoose_1.Types.ObjectId(),
            name: `${product.name} (Copy)`,
            slug: `${product.slug}-copy-${Date.now()}`,
            subCategory: subCategoryIds.map((id) => id.toString()),
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userId,
            updatedBy: null,
        };
        // Create the duplicated product
        const duplicatedProduct = await product_model_1.default.create(duplicatedProductData);
        await updateProductInCategories(duplicatedProduct._id, null, null, product.category, subCategoryIds.length > 0 ? subCategoryIds : null);
        res.status(201).json({
            success: true,
            message: "Product duplicated successfully",
            data: duplicatedProduct,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.duplicateProduct = duplicateProduct;
