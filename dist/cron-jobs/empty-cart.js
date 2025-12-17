"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runEmptyExpiredCartsNow = exports.emptyCartJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const cartModel_1 = __importDefault(require("../models/cartModel"));
const emptyExpiredCarts = async () => {
    try {
        const expirationTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const cartsToEmpty = await cartModel_1.default.find({
            $or: [
                { createdAt: { $lt: expirationTime } },
                { updatedAt: { $lt: expirationTime } }
            ],
            'products.0': { $exists: true }
        });
        for (const cart of cartsToEmpty) {
            cart.products = [];
            cart.totalQuantity = 0;
            cart.totalPrice = 0;
            await cart.save();
            console.log(`Emptied cart ${cart._id}`);
        }
        if (cartsToEmpty.length > 0) {
            console.log(`Emptied ${cartsToEmpty.length} expired carts`);
        }
    }
    catch (error) {
        console.error('Error emptying expired carts:', error);
        // Optional: Add retry logic or alert admins
    }
};
exports.emptyCartJob = node_cron_1.default.schedule('0 * * * *', emptyExpiredCarts, {
    scheduled: false
});
exports.runEmptyExpiredCartsNow = emptyExpiredCarts;
