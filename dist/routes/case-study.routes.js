"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const case_study_controller_1 = require("../controllers/case-study.controller");
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const validator_1 = require("../helpers/validator");
const router = express_1.default.Router();
router.post("/create", authMiddleware_1.default, validator_1.validateCaseStudy, case_study_controller_1.createCaseStudy);
router.get("/read", case_study_controller_1.getCaseStudy);
router.get("/read/:id", case_study_controller_1.getSingleCaseStudy);
router.put("/update", authMiddleware_1.default, validator_1.validateUpdateCaseStudy, case_study_controller_1.updateCaseStudy);
router.delete("/delete", authMiddleware_1.default, validator_1.validateDeleteCaseStudy, case_study_controller_1.deleteCaseStudy);
exports.default = router;
