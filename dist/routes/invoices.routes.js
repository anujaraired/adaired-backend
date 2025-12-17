"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const invoice_controller_1 = require("../controllers/invoice.controller");
const router = express_1.default.Router();
// Admin routes (require permissions)
router.get("/getInvoices", authMiddleware_1.default, invoice_controller_1.getInvoices);
router.patch("/updateInvoice", authMiddleware_1.default, invoice_controller_1.updateInvoice);
router.delete("/deleteInvoice", authMiddleware_1.default, invoice_controller_1.deleteInvoice);
router.get("/stats", authMiddleware_1.default, invoice_controller_1.getInvoiceStats);
router.get("/download", invoice_controller_1.downloadInvoicePDF);
// User routes
router.get("/getUserInvoices", authMiddleware_1.default, invoice_controller_1.getInvoicesByUserId);
exports.default = router;
