"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mail_controller_1 = require("../controllers/mail.controller");
const router = (0, express_1.Router)();
const he = "dsfsf";
const check = () => {
    console.log("fsdmfdsf");
};
router.post("/send", mail_controller_1.sendMail);
exports.default = router;
