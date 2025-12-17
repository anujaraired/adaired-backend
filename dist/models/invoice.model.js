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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Create the Invoice schema
const InvoiceSchema = new mongoose_1.Schema({
    invoiceNumber: { type: String, required: true, unique: true },
    orderId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Order", required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    totalAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ["Unpaid", "Paid", "Overdue", "Cancelled"],
        default: "Unpaid",
    },
    dueDate: { type: Date, required: true },
    issuedDate: { type: Date, default: Date.now },
    paymentMethod: {
        type: String,
        enum: ["Razorpay", "Stripe", "Manual"],
        required: true,
    },
    paymentId: { type: String, default: null },
    zohoInvoiceId: { type: String, default: null },
}, {
    timestamps: true,
});
InvoiceSchema.index({ orderId: 1 });
InvoiceSchema.index({ userId: 1 });
InvoiceSchema.index({ paymentId: 1 });
InvoiceSchema.index({ zohoInvoiceId: 1 });
const Invoice = mongoose_1.default.model("Invoice", InvoiceSchema);
exports.default = Invoice;
