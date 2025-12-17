"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketPriority = exports.TicketStatus = void 0;
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["OPEN"] = "open";
    TicketStatus["IN_PROGRESS"] = "in progress";
    TicketStatus["RESOLVED"] = "resolved";
    TicketStatus["CLOSED"] = "closed";
    TicketStatus["REOPENED"] = "reopened";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
var TicketPriority;
(function (TicketPriority) {
    TicketPriority["LOW"] = "low";
    TicketPriority["MEDIUM"] = "medium";
    TicketPriority["HIGH"] = "high";
    TicketPriority["URGENT"] = "urgent";
})(TicketPriority || (exports.TicketPriority = TicketPriority = {}));
