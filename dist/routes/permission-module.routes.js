"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validator_1 = require("../helpers/validator");
const permission_module_controller_1 = require("../controllers/permission-module.controller");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const router = express_1.default.Router();
router.post("/create", authMiddleware_1.default, validator_1.validatePermissionModuleCreate, permission_module_controller_1.createModule);
router.get("/find", permission_module_controller_1.findModules);
router.patch("/update", authMiddleware_1.default, validator_1.validatePermissionModuleUpdate, permission_module_controller_1.updateModule);
router.delete("/delete", authMiddleware_1.default, permission_module_controller_1.deleteModule);
exports.default = router;
