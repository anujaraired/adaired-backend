"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const static_pages_seo_controller_1 = require("../controllers/static-pages-seo.controller");
const router = express_1.default.Router();
router.post("/create", authMiddleware_1.default, static_pages_seo_controller_1.createPageSEO);
router.patch("/update", authMiddleware_1.default, static_pages_seo_controller_1.updatePageSEO);
router.get("/read/:pageName", static_pages_seo_controller_1.getPageSEOByName); // Public endpoint for frontend
router.get("/read", authMiddleware_1.default, static_pages_seo_controller_1.getAllPageSEO);
router.delete("/delete", authMiddleware_1.default, static_pages_seo_controller_1.deletePageSEO);
exports.default = router;
