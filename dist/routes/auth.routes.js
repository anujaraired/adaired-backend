"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validator_1 = require("../helpers/validator");
const auth_controller_1 = require("../controllers/auth.controller");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const router = express_1.default.Router();
router.post("/register", validator_1.validateRegister, auth_controller_1.register);
router.post("/login", validator_1.validateLogin, auth_controller_1.login);
router.post("/refresh-token", auth_controller_1.refreshToken);
router.post("/logout", authMiddleware_1.default, auth_controller_1.logout);
router.post("/forgot-password", auth_controller_1.forgotPassword);
router.patch("/reset-password", auth_controller_1.resetPassword);
router.post("/send-verification-email", auth_controller_1.sendVerificationEmail);
router.get("/verify-user", auth_controller_1.verifyUser);
exports.default = router;
