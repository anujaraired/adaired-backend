"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const order_controller_1 = require("../controllers/order.controller");
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const router = express_1.default.Router();
router.post("/create", authMiddleware_1.default, order_controller_1.createOrder);
router.post("/stripe-webhook", express_1.default.raw({ type: "application/json" }), order_controller_1.stripeWebhook);
router.get("/getOrders", authMiddleware_1.default, order_controller_1.getOrders);
router.patch("/updateOrder", authMiddleware_1.default, order_controller_1.updateOrder);
router.delete("/deleteOrder", authMiddleware_1.default, order_controller_1.deleteOrder);
router.get("/getUserOrders", authMiddleware_1.default, order_controller_1.getOrdersByUserId);
router.get("/stats", authMiddleware_1.default, order_controller_1.getOrderStats);
router.get("/sales-report", authMiddleware_1.default, order_controller_1.getSalesReport);
exports.default = router;
