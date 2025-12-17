"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = formatDate;
const dayjs_1 = __importDefault(require("dayjs"));
function formatDate(date, format = 'DD MMM, YYYY') {
    if (!date)
        return '';
    return (0, dayjs_1.default)(date).format(format);
}
