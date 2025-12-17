"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const product_controller_1 = require("../controllers/product.controller");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const validator_1 = require("../helpers/validator");
const router = express_1.default.Router();
router.post("/create-product", authMiddleware_1.default, validator_1.validateCreateProduct, product_controller_1.createProduct);
router.patch("/update-product", authMiddleware_1.default, validator_1.validateUpdateProduct, product_controller_1.updateProduct);
router.get("/read-product", product_controller_1.readProducts);
router.delete("/delete-product", authMiddleware_1.default, product_controller_1.deleteProduct);
router.post("/duplicate-product", authMiddleware_1.default, product_controller_1.duplicateProduct);
exports.default = router;
