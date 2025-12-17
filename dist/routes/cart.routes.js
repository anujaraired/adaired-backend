"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const cart_controller_1 = require("../controllers/cart.controller");
const router = express_1.default.Router();
router.post("/add-product-or-sync-cart", authMiddleware_1.default, cart_controller_1.syncOrAddToCart);
router.get("/get-user-cart", authMiddleware_1.default, cart_controller_1.getUserCart);
router.patch("/update-cart", authMiddleware_1.default, cart_controller_1.updateCart);
router.delete("/delete-product", authMiddleware_1.default, cart_controller_1.deleteProduct);
router.delete("/empty-cart", authMiddleware_1.default, cart_controller_1.emptyCart);
exports.default = router;
