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
const UserSchema = new mongoose_1.Schema({
    image: { type: String, default: null },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    userName: { type: String },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: { type: String, default: null },
    contact: { type: String, default: null },
    isAdmin: { type: Boolean, default: false },
    role: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Role",
        default: null,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    orderHistory: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Order" }],
        default: [],
    },
    cart: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Cart",
        default: null,
    },
    wishlist: {
        type: [
            {
                productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product" },
                dateAdded: { type: Date, default: Date.now },
            },
        ],
        default: [],
    },
    status: {
        type: String,
        default: "Active",
    },
    isVerifiedUser: {
        type: Boolean,
        default: false,
    },
    refreshToken: {
        type: String,
        default: null,
    },
}, { timestamps: true });
const User = mongoose_1.default.model("User", UserSchema);
exports.default = User;
