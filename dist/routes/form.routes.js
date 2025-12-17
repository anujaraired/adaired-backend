"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const form_controller_1 = require("../controllers/form.controller");
const field_controller_1 = require("../controllers/field.controller");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const router = express_1.default.Router();
router.post("/create-form", authMiddleware_1.default, form_controller_1.createForm);
router.get("/read-form", form_controller_1.readForm);
router.patch("/update-form", authMiddleware_1.default, form_controller_1.updateForm);
router.delete("/delete-form", authMiddleware_1.default, form_controller_1.deleteForm);
router.post("/create-field", authMiddleware_1.default, field_controller_1.createField);
router.get("/read-fields", field_controller_1.readFields);
router.patch("/update-field", authMiddleware_1.default, field_controller_1.updateField);
router.delete("/delete-field", authMiddleware_1.default, field_controller_1.deleteField);
exports.default = router;
