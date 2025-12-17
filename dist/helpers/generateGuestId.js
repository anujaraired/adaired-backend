"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUserId = generateUserId;
const uuid_1 = require("uuid");
function generateUserId() {
    const randomString = (0, uuid_1.v4)().split("-")[0];
    const customId = `guest-${randomString}`;
    return customId;
}
