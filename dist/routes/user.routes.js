"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const user_controller_1 = require("../controllers/user.controller");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
router.get("/find", authMiddleware_1.default, user_controller_1.findUser);
router.patch("/update", authMiddleware_1.default, user_controller_1.updateUser);
router.delete("/delete", authMiddleware_1.default, user_controller_1.killUser);
router.get("/me", authMiddleware_1.default, user_controller_1.getCurrentUser);
exports.default = router;
