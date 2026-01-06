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
// Create the Order schema
const OrderSchema = new mongoose_1.Schema({
    orderNumber: { type: String, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    products: [
        {
            product: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            wordCount: { type: Number, min: 100 },
            quantity: { type: Number, required: true, min: 1 },
            additionalInfo: { type: String },
            totalPrice: { type: Number, required: true },
            addedAt: { type: Date, default: Date.now },
        },
    ],
    totalQuantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    couponDiscount: { type: Number, default: 0 },
    finalPrice: { type: Number, required: true },
    couponId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Coupon", default: null },
    paymentId: { type: String, default: null },
    invoiceId: { type: String },
    zohoInvoiceId: { type: String },
    paymentUrl: { type: String, default: null },
    status: {
        type: String,
        enum: ["Pending", "Processing", "Confirmed", "Completed", "Cancelled"],
        default: "Pending",
    },
    paymentStatus: {
        type: String,
        enum: ["Unpaid", "Paid", "Refunded", "Failed"],
        default: "Unpaid",
    },
    paymentMethod: {
        type: String,
        enum: ["Razorpay", "Stripe"],
        required: true,
    },
    paymentDate: { type: Date },
}, {
    timestamps: true,
});
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ userId: 1 });
OrderSchema.index({ paymentId: 1 });
OrderSchema.index({ invoiceId: 1 });
OrderSchema.index({ zohoInvoiceId: 1 });
const Order = mongoose_1.default.model("Order", OrderSchema);
exports.default = Order;
