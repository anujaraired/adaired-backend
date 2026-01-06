"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const CouponSchema = new mongoose_1.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    },
    couponApplicableOn: {
        type: String,
        enum: ["allProducts", "specificProducts", "productCategories"],
        required: true,
    },
    couponType: {
        type: String,
        enum: ["amountBased", "quantityBased"],
        required: true,
    },
    discountType: {
        type: String,
        enum: ["percentage", "flat"],
        required: true,
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function (value) {
                if (this.discountType === "percentage") {
                    return value <= 100;
                }
                return true;
            },
            message: "Percentage discount must be ≤ 100",
        },
    },
    minOrderAmount: {
        type: Number,
        default: 1,
        min: 1,
    },
    maxDiscountAmount: {
        type: Number,
        default: Infinity,
    },
    specificProducts: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Product" }],
        default: [],
    },
    productCategories: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Product_Category" }],
        default: [],
    },
    minQuantity: {
        type: Number,
        default: 1,
        min: 1,
    },
    maxQuantity: {
        type: Number,
        default: null,
    },
    maxWordCount: {
        type: Number,
        default: null,
    },
    usageLimitPerUser: {
        type: Number,
        default: Infinity,
    },
    totalUsageLimit: {
        type: Number,
        default: Infinity,
    },
    usedCount: {
        type: Number,
        default: 0,
    },
    userUsage: [
        {
            userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
            usageCount: { type: Number, default: 0 },
        },
    ],
    status: {
        type: String,
        default: "Active",
    },
    expiresAt: {
        type: Date,
        default: null,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
}, { timestamps: true });
// Universal validation (works for both create & update)
CouponSchema.pre("save", function (next) {
    // Validate productCategories
    if (this.couponApplicableOn === "productCategories" && this.productCategories.length === 0) {
        return next(new Error("At least one product category is required"));
    }
    if (this.couponApplicableOn !== "productCategories" && this.productCategories.length > 0) {
        return next(new Error("Product categories must be empty for non-category coupons"));
    }
    // Validate specificProducts
    if (this.couponApplicableOn === "specificProducts" && this.specificProducts.length === 0) {
        return next(new Error("At least one product is required"));
    }
    if (this.couponApplicableOn !== "specificProducts" && this.specificProducts.length > 0) {
        return next(new Error("Specific products must be empty for non-product-specific coupons"));
    }
    next();
});
CouponSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.default = mongoose_1.default.model("Coupon", CouponSchema);
