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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const seo_schema_model_1 = __importDefault(require("./seo-schema.model"));
const caseStudySchema = new mongoose_1.Schema({
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Case_Study_Category",
        default: null,
        index: true,
    },
    name: {
        type: String,
        required: [true, "Case study name is required"],
        trim: true,
    },
    slug: {
        type: String,
        default: null,
        unique: true,
        sparse: true,
        trim: true,
    },
    colorScheme: {
        type: String,
        required: [true, "Color scheme is required"],
        trim: true,
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "inactive",
        required: [true, "Status is required"],
    },
    bodyData: {
        type: [mongoose_1.Schema.Types.Mixed],
        default: [],
    },
    seo: {
        type: seo_schema_model_1.default,
        required: [true, "SEO data is required"],
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
}, { timestamps: true });
const CaseStudyModel = mongoose_1.default.model("Case_Study", caseStudySchema);
exports.default = CaseStudyModel;
