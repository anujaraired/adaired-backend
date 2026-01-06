"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ticket_types_1 = require("../types/ticket.types");
const TicketAttachmentSchema = new mongoose_1.Schema({
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
});
const TicketMessageSchema = new mongoose_1.Schema({
    sender: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    attachments: [TicketAttachmentSchema],
    readBy: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });
const TicketSchema = new mongoose_1.Schema({
    ticketId: { type: String, unique: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: {
        type: String,
        enum: Object.values(ticket_types_1.TicketStatus),
        default: ticket_types_1.TicketStatus.OPEN,
    },
    priority: {
        type: String,
        enum: Object.values(ticket_types_1.TicketPriority),
        default: ticket_types_1.TicketPriority.MEDIUM,
    },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    messages: [TicketMessageSchema],
    metadata: {
        createdBy: {
            type: String,
            enum: ["customer", "support", "admin"],
            required: true,
        },
        createdForCustomer: { type: Boolean, required: true },
        supportCreatedAsCustomer: { type: Boolean },
    },
    closedAt: { type: Date },
    closedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
// Add static method to generate ticket ID
TicketSchema.statics.generateTicketId = async function () {
    const prefix = "ADTKT-";
    // Find the highest existing ticketId
    const lastTicket = await this.findOne({}, { ticketId: 1 })
        .sort({ ticketId: -1 })
        .lean();
    let nextNum = 1;
    if (lastTicket?.ticketId) {
        const lastNum = parseInt(lastTicket.ticketId.replace(prefix, ""), 10);
        if (!isNaN(lastNum)) {
            nextNum = lastNum + 1;
        }
    }
    return `${prefix}${nextNum.toString().padStart(2, "0")}`;
};
// Pre-save hook to set ticketId
TicketSchema.pre("save", async function (next) {
    if (!this.isNew || this.ticketId)
        return next();
    try {
        this.ticketId = await this.constructor.generateTicketId();
        next();
    }
    catch (err) {
        next(err);
    }
});
// Indexes
TicketSchema.index({ status: 1 });
TicketSchema.index({ priority: 1 });
TicketSchema.index({ createdBy: 1 });
TicketSchema.index({ assignedTo: 1 });
TicketSchema.index({ customer: 1 });
TicketSchema.index({ "metadata.createdBy": 1 });
TicketSchema.index({ "metadata.createdForCustomer": 1 });
const TicketModel = mongoose_1.default.model("Ticket", TicketSchema);
exports.default = TicketModel;
