"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyCart = exports.deleteProduct = exports.updateCart = exports.getUserCart = exports.syncOrAddToCart = void 0;
const cartModel_1 = __importDefault(require("../models/cartModel"));
const product_model_1 = __importDefault(require("../models/product.model"));
const orderModel_1 = __importDefault(require("../models/orderModel"));
const authHelper_1 = require("../helpers/authHelper");
const user_model_1 = __importDefault(require("../models/user.model"));
const error_1 = require("../middlewares/error");
const mongoose_1 = require("mongoose");
// Helper function to validate cart items
const validateCartItems = async (products) => {
    const productIds = products.map((item) => item.product._id);
    const existingProducts = await product_model_1.default.find({ _id: { $in: productIds } });
    // Create a map for quick lookup
    const productMap = new Map(existingProducts.map((product) => [product._id.toString(), product]));
    for (const item of products) {
        if (!productMap.has(item.product._id.toString())) {
            throw new error_1.CustomError(404, `Product with ID ${item.product._id} not found.`);
        }
    }
};
// Helper function to handle free products
const handleFreeProducts = async (userId, products) => {
    const productIds = products.map((item) => item.product._id);
    const existingProducts = await product_model_1.default.find({ _id: { $in: productIds } });
    // Create a map for quick lookup
    const productMap = new Map(existingProducts.map((product) => [product._id.toString(), product]));
    const freeProductIds = existingProducts
        .filter((product) => product.isFreeProduct)
        .map((product) => product._id.toString());
    if (freeProductIds.length > 0) {
        const [existingCart, existingOrders] = await Promise.all([
            cartModel_1.default.findOne({ userId }),
            orderModel_1.default.find({
                userId,
                "products.product": { $in: freeProductIds },
                paymentStatus: "Paid",
            }),
        ]);
        // Check if free products are already in the cart
        if (existingCart) {
            const cartProductIds = existingCart.products.map((item) => item.product._id.toString());
            for (const productId of freeProductIds) {
                if (cartProductIds.includes(productId)) {
                    const product = productMap.get(productId);
                    throw new error_1.CustomError(400, `You cannot add the free product (${product?.name}) to the cart more than once.`);
                }
            }
        }
        // Check if free products have already been purchased
        if (existingOrders.length > 0) {
            for (const order of existingOrders) {
                for (const productId of freeProductIds) {
                    if (order.products.some((item) => item.product._id.toString() === productId)) {
                        const product = productMap.get(productId);
                        throw new error_1.CustomError(400, `You have already purchased the free product (${product?.name}).`);
                    }
                }
            }
        }
    }
};
// Helper function to recalculate cart totals
const recalculateCartTotals = (cart) => {
    cart.totalQuantity = cart.products.length;
    cart.totalPrice = cart.products.reduce((acc, product) => acc + product.totalPrice, 0);
};
// *********************************************************
// ***** Add Product to Cart / Sync Cart with Frontend *****
// *********************************************************
const syncOrAddToCart = async (req, res, next) => {
    try {
        const { userId, body } = req;
        const { products } = body;
        if (!products || products.length === 0) {
            return next(new error_1.CustomError(400, "Cart cannot be empty."));
        }
        // Validate cart items and handle free products in parallel
        await Promise.all([
            validateCartItems(products),
            handleFreeProducts(new mongoose_1.Types.ObjectId(userId), products),
        ]);
        // Find the user's cart or create one if it doesn't exist
        let cart = await cartModel_1.default.findOne({ userId });
        if (!cart) {
            cart = new cartModel_1.default({
                userId,
                products: [],
                totalQuantity: 0,
                totalPrice: 0,
            });
            // Update the user's cart reference
            await user_model_1.default.findByIdAndUpdate(userId, { cart: cart._id });
        }
        // Add items to the cart
        for (const item of products) {
            cart.products.push(item);
        }
        // Recalculate total quantity and price
        recalculateCartTotals(cart);
        // Save the cart
        await cart.save();
        // Populate the product field in the cart
        const populatedCart = await cartModel_1.default.findById(cart._id).populate({
            path: "products.product",
        });
        if (!populatedCart) {
            return next(new error_1.CustomError(404, "Cart not found after population."));
        }
        res.status(200).json({
            message: "Product added successfully",
            cart: populatedCart,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.syncOrAddToCart = syncOrAddToCart;
// ***************************************
// ********* Get Cart for a User *********
// ***************************************
const getUserCart = async (req, res, next) => {
    try {
        const { userId } = req;
        const { customerId } = req.query;
        // Check Permission
        if (customerId) {
            const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "carts", 2);
            if (!permissionCheck) {
                return next(new error_1.CustomError(403, "Permission denied"));
            }
        }
        // Fetch cart based on customerId or all carts
        const targetUserId = customerId ? customerId : userId;
        const cart = await cartModel_1.default.findOne({ userId: targetUserId }).populate({
            path: "products.product",
            populate: {
                path: "subCategory",
                select: "name",
            },
        });
        if (!cart || (customerId && cart.userId.toString() !== customerId)) {
            return res.status(404).json({ message: "Cart not found for this user." });
        }
        return res.status(200).json({
            message: "Cart data fetched successfully",
            cart,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.getUserCart = getUserCart;
// ***************************************
// ********* Update Cart Product *********
// ***************************************
const updateCart = async (req, res, next) => {
    try {
        const { userId } = req;
        const { cartItemId, ...updateFields } = req.body;
        if (!cartItemId) {
            return next(new error_1.CustomError(400, "Product entry ID is required."));
        }
        // Find the user's cart
        const cart = await cartModel_1.default.findOne({ userId });
        if (!cart) {
            return next(new error_1.CustomError(404, "Cart not found."));
        }
        // Find the specific product entry by its unique ID
        const productIndex = cart.products.findIndex((p) => p._id.toString() === cartItemId);
        if (productIndex === -1) {
            return next(new error_1.CustomError(404, "Product entry not found in cart."));
        }
        // Capture original product data for comparison
        const originalProduct = { ...cart.products[productIndex].toObject() };
        delete originalProduct._id;
        // Update the product fields
        const product = cart.products[productIndex];
        const updatedProduct = { ...product.toObject() };
        let hasChanges = false;
        Object.keys(updateFields).forEach((key) => {
            if (key in product && updateFields[key] !== undefined) {
                updatedProduct[key] = updateFields[key];
                if (originalProduct[key] !== updateFields[key]) {
                    hasChanges = true;
                }
            }
        });
        // If no changes detected, return early
        if (!hasChanges) {
            const populatedCart = await cartModel_1.default.findById(cart._id).populate({
                path: "products.product",
            });
            if (!populatedCart) {
                return next(new error_1.CustomError(404, "Cart not found after population."));
            }
            return res.status(200).json({
                message: "No changes in cart data",
                cart: populatedCart,
            });
        }
        // Apply updates to the cart product
        Object.keys(updatedProduct).forEach((key) => {
            if (key in product && updatedProduct[key] !== undefined) {
                product[key] = updatedProduct[key];
            }
        });
        // Recalculate total quantity and total price
        recalculateCartTotals(cart);
        // Save the updated cart
        await cart.save();
        // Populate the product field in the cart
        const populatedCart = await cartModel_1.default.findById(cart._id).populate({
            path: "products.product",
        });
        if (!populatedCart) {
            return next(new error_1.CustomError(404, "Cart not found after population."));
        }
        res.status(200).json({
            message: "Cart updated successfully",
            cart: populatedCart,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.updateCart = updateCart;
// ***************************************
// ***** Remove Product from Cart ********
// ***************************************
const deleteProduct = async (req, res, next) => {
    try {
        const { userId } = req;
        const { cartItemId } = req.query;
        if (!cartItemId) {
            return next(new error_1.CustomError(400, "Product entry ID is required."));
        }
        // Check if the cart exists
        const cart = await cartModel_1.default.findOne({ userId: userId });
        if (!cart) {
            return next(new error_1.CustomError(404, "Cart not found."));
        }
        // Find the product to remove
        const productIndex = cart.products.findIndex((p) => p._id.toString() === cartItemId.toString());
        if (productIndex === -1) {
            return next(new error_1.CustomError(404, "Product entry not found in cart."));
        }
        // Remove the product from the cart
        cart.products.splice(productIndex, 1);
        // Recalculate total quantity and total price
        recalculateCartTotals(cart);
        // Save the updated cart
        await cart.save();
        // Populate the product field in the cart
        const populatedCart = await cartModel_1.default.findById(cart._id).populate({
            path: "products.product",
        });
        if (!populatedCart) {
            return next(new error_1.CustomError(404, "Cart not found after population."));
        }
        res.status(200).json({
            message: "Product removed from cart",
            cart: populatedCart,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.deleteProduct = deleteProduct;
// ***************************************
// ************ Empty Cart ***************
// ***************************************
const emptyCart = async (req, res, next) => {
    try {
        const { userId } = req;
        const { customerId } = req.query;
        // Check Permission
        if (customerId) {
            const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "carts", 3);
            if (!permissionCheck) {
                return next(new error_1.CustomError(403, "Permission denied"));
            }
        }
        // Fetch cart based on customerId or all carts
        const query = customerId ? { userId: customerId } : {};
        const cart = await cartModel_1.default.findOne(query);
        if (!cart || (customerId && cart.userId.toString() !== customerId)) {
            return next(new error_1.CustomError(404, "Cart not found"));
        }
        cart.products = [];
        cart.totalQuantity = 0;
        cart.totalPrice = 0;
        await cart.save();
        // Find the user and clear the cart reference
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return next(new error_1.CustomError(404, "User not found"));
        }
        user.cart = null;
        // Save the updated user
        await user.save();
        res.status(200).json({ message: "Cart cleared successfully", cart });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.emptyCart = emptyCart;
