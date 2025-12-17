"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ticket_controller_1 = require("../controllers/ticket.controller");
const validator_1 = require("../helpers/validator");
const multer_1 = __importDefault(require("multer"));
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post("/create", authMiddleware_1.default, upload.array("attachments"), validator_1.validateCreateTicket, ticket_controller_1.createTicket);
router.get("/read", authMiddleware_1.default, ticket_controller_1.getTickets);
router.get("/stats", authMiddleware_1.default, ticket_controller_1.getTicketStats);
router.patch("/update", upload.array("attachments"), authMiddleware_1.default, ticket_controller_1.updateTicket);
router.delete("/delete", authMiddleware_1.default, ticket_controller_1.deleteTicket);
exports.default = router;
