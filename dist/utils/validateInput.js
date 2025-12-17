"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInput = void 0;
const express_validator_1 = require("express-validator");
const validateInput = (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array(),
        });
        return false;
    }
    return true;
};
exports.validateInput = validateInput;
