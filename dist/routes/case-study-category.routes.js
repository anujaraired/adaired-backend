"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const case_study_category_controller_1 = require("../controllers/case-study-category.controller");
const express_1 = __importDefault(require("express"));
const validator_1 = require("../helpers/validator");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const router = express_1.default.Router();
router.post("/create", authMiddleware_1.default, validator_1.validateCaseStudyCategory, case_study_category_controller_1.newCaseStudyCategory);
router.get("/read", case_study_category_controller_1.getCaseStudyCategories);
router.patch("/update", authMiddleware_1.default, validator_1.validateUpdateCaseStudyCategory, case_study_category_controller_1.updateCaseStudyCategory);
router.delete("/delete", authMiddleware_1.default, case_study_category_controller_1.deleteCaseStudyCategory);
exports.default = router;
