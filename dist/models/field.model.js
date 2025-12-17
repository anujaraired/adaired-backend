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
const OptionSchema = new mongoose_1.Schema({
    value: { type: String, required: true },
    name: { type: String, required: true },
});
const FieldSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    label: { type: String, required: true },
    inputType: { type: String, required: true, default: "Text" },
    inputMinLength: { type: Number, default: null },
    inputMaxLength: { type: Number, default: null },
    inputPlaceholder: { type: String, default: null },
    inputValidationPattern: { type: String, default: null },
    inputRequired: { type: Boolean, default: false },
    customClassName: { type: String, default: null },
    multipleOptions: [OptionSchema],
}, { timestamps: true });
const FieldModel = mongoose_1.default.model("ProductFormField", FieldSchema);
exports.default = FieldModel;
