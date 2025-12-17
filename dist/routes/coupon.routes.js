"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const coupon_controller_1 = require("../controllers/coupon.controller");
const coupon_controller_2 = require("../controllers/coupon.controller");
const router = express_1.default.Router();
router.post("/apply", coupon_controller_2.calculateCouponDiscount);
router.post("/create", authMiddleware_1.default, coupon_controller_1.createCoupon);
router.patch("/update", authMiddleware_1.default, coupon_controller_1.updateCoupon);
router.get("/read", authMiddleware_1.default, coupon_controller_1.getCoupons);
router.get("/usageStats", authMiddleware_1.default, coupon_controller_1.getCouponStats);
router.delete("/delete", authMiddleware_1.default, coupon_controller_1.deleteCoupon);
exports.default = router;
