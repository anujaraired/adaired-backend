"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const blog_controller_1 = require("../controllers/blog.controller");
const express_1 = __importDefault(require("express"));
const validator_1 = require("../helpers/validator");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const router = express_1.default.Router();
router.post("/create", authMiddleware_1.default, validator_1.validateBlog, blog_controller_1.newBlog);
router.get("/read", blog_controller_1.readBlog);
router.patch("/update", authMiddleware_1.default, validator_1.validateUpdateBlog, blog_controller_1.updateBlog);
router.delete("/delete", authMiddleware_1.default, blog_controller_1.deleteBlog);
exports.default = router;
