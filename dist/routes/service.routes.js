"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const service_controller_1 = require("../controllers/service.controller");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const validator_1 = require("../helpers/validator");
const router = express_1.default.Router();
router.post("/createService", authMiddleware_1.default, validator_1.ValidateCreateService, service_controller_1.createService);
router.get("/getServices/:identifier?", service_controller_1.readServices);
router.put("/updateService/:id", authMiddleware_1.default, validator_1.ValidateUpdateService, service_controller_1.updateService);
router.delete("/deleteService/:id", authMiddleware_1.default, service_controller_1.deleteService);
router.post("/duplicateService/:id", authMiddleware_1.default, service_controller_1.duplicateService);
exports.default = router;
