"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validator_1 = require("../helpers/validator");
const role_controller_1 = require("../controllers/role.controller");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const router = express_1.default.Router();
router.post("/create", authMiddleware_1.default, validator_1.validateRole, role_controller_1.createRole);
router.get("/find", authMiddleware_1.default, role_controller_1.findRoles);
router.patch("/update", authMiddleware_1.default, validator_1.validateUpdateRole, role_controller_1.updateRole);
router.delete("/delete", authMiddleware_1.default, role_controller_1.deleteRole);
router.post("/duplicate", authMiddleware_1.default, role_controller_1.duplicateRole);
exports.default = router;
