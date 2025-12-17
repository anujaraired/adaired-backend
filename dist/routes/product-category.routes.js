"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const product_category_controller_1 = require("../controllers/product-category.controller");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const validator_1 = require("../helpers/validator");
const router = express_1.default.Router();
router.post("/create-category", authMiddleware_1.default, validator_1.validateProductCreateCategory, product_category_controller_1.createCategory);
router.get("/read-category", product_category_controller_1.readCategories);
router.patch("/update-category", authMiddleware_1.default, validator_1.validateProductUpdateCategory, product_category_controller_1.updateCategory);
router.delete("/delete-category", authMiddleware_1.default, product_category_controller_1.deleteCategory);
exports.default = router;
