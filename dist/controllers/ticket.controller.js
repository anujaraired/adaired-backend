"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTicket = exports.updateTicket = exports.getTicketStats = exports.getTickets = exports.createTicket = void 0;
const ticket_model_1 = __importDefault(require("../models/ticket.model"));
const error_1 = require("../middlewares/error");
const cloudinary_1 = require("../utils/cloudinary");
const ticket_types_1 = require("../types/ticket.types");
const authHelper_1 = require("../helpers/authHelper");
const user_model_1 = __importDefault(require("../models/user.model"));
const validateInput_1 = require("../utils/validateInput");
// Shared permission validator
const validateTicketPermissions = async (userId, ticketId, action) => {
    const ticket = await ticket_model_1.default.findById(ticketId);
    if (!ticket)
        throw new error_1.CustomError(404, "Ticket not found");
    const userType = await (0, authHelper_1.getUserRoleType)(userId);
    const isAdmin = userType === "admin";
    const hasUpdatePermission = await (0, authHelper_1.checkPermission)(userId, "tickets", 2);
    const isAssigned = ticket.assignedTo?.equals(userId);
    const isCustomer = ticket.customer.equals(userId);
    // Permission matrix
    const permissions = {
        update: isAdmin || hasUpdatePermission,
        message: isAdmin || hasUpdatePermission || isAssigned || isCustomer,
        close: isAdmin || hasUpdatePermission,
        delete: isAdmin || (await (0, authHelper_1.checkPermission)(userId, "tickets", 3)),
    };
    if (!permissions[action]) {
        const errorMessages = {
            update: "Only admin or users with update permission can modify tickets",
            message: "Only admin, users with update permission, or assigned agent can message tickets",
            close: "Only admin or users with update permission can close tickets",
            delete: "Only admin or users with delete permission can remove tickets",
        };
        throw new error_1.CustomError(403, errorMessages[action]);
    }
    return { ticket, isAdmin, hasUpdatePermission, isAssigned, isCustomer };
};
// *********************************************************
// ******************* Create New Ticket *******************
// *********************************************************
const createTicket = async (req, res, next) => {
    try {
        // Validate user input
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        const { userId, body, files } = req;
        const { subject, status, description, priority, customer, assignedTo } = body;
        const user = await user_model_1.default.findById(userId).populate("role");
        if (!user)
            throw new error_1.CustomError(404, "User not found");
        // Determine user type
        const userType = await (0, authHelper_1.getUserRoleType)(userId);
        const isCustomer = userType === "customer";
        const isAdmin = userType === "admin";
        // ALL users can create tickets, but with different rules:
        // 1. Customers can only create tickets for themselves
        if (isCustomer) {
            if (customer && customer !== userId) {
                throw new error_1.CustomError(403, "Customers cannot create tickets for others");
            }
            if (assignedTo) {
                throw new error_1.CustomError(403, "Customers cannot assign tickets");
            }
        }
        // 2. Support users without create permission create as customers
        const hasTicketCreatePermission = await (0, authHelper_1.checkPermission)(userId, "tickets", 0);
        const isSupportCreatingAsCustomer = userType === "support" && !hasTicketCreatePermission;
        if (isSupportCreatingAsCustomer) {
            if (customer || assignedTo) {
                throw new error_1.CustomError(403, "Support without create permission must create ticket as customers");
            }
        }
        // 3. Support users with create permission can specify customers/assignees
        if (userType === "support" && hasTicketCreatePermission) {
            if (customer && customer !== userId) {
                const canCreateForOthers = await (0, authHelper_1.checkPermission)(userId, "tickets", 4);
                if (!canCreateForOthers) {
                    throw new error_1.CustomError(403, "You don't have permission to create tickets for others");
                }
            }
        }
        // Handle attachments
        const attachments = files && Array.isArray(files) ? await (0, cloudinary_1.uploadTicketAttachments)(files) : [];
        // Determine assignment and customer
        let finalAssignedTo = assignedTo;
        let finalCustomer = customer || userId;
        // Auto-assignment rules:
        if (isCustomer || isSupportCreatingAsCustomer) {
            // Customer tickets or support creating as customer -> assign to admin
            const defaultAdmin = await user_model_1.default.findOne({ isAdmin: true }).sort({
                createdAt: 1,
            });
            if (!defaultAdmin)
                throw new error_1.CustomError(404, "No admin available for assignment");
            finalAssignedTo = defaultAdmin._id;
        }
        else if (!assignedTo) {
            // Default to creator if no assignment specified
            finalAssignedTo = userId;
        }
        const newTicket = await ticket_model_1.default.create({
            subject,
            description,
            status: status || ticket_types_1.TicketStatus.OPEN,
            priority: priority || ticket_types_1.TicketPriority.MEDIUM,
            createdBy: userId,
            assignedTo: finalAssignedTo,
            customer: finalCustomer,
            messages: [
                {
                    sender: userId,
                    message: description,
                    attachments,
                },
            ],
            metadata: {
                createdBy: isSupportCreatingAsCustomer ? "customer" : userType,
                createdForCustomer: !!customer && customer !== userId,
                supportCreatedAsCustomer: isSupportCreatingAsCustomer,
            },
        });
        const populatedTicket = await ticket_model_1.default.findById(newTicket._id)
            .populate("createdBy", "image name email")
            .populate("assignedTo", "image name email")
            .populate("customer", "image name email");
        res.status(201).json({
            success: true,
            message: "Ticket created successfully",
            data: populatedTicket,
        });
    }
    catch (error) {
        if (error.code === 11000 && error.keyPattern?.ticketId) {
            // Handle duplicate ticketId error by retrying
            return (0, exports.createTicket)(req, res, next);
        }
        next(new error_1.CustomError(500, error.message));
    }
};
exports.createTicket = createTicket;
// *********************************************************
// ********************** Read Tickets *********************
// *********************************************************
const getTickets = async (req, res, next) => {
    try {
        const { userId } = req;
        const { id, status, priority, assignedTo, customer, ticketId, page, limit, } = req.query;
        // Permission check
        const hasReadPermission = await (0, authHelper_1.checkPermission)(userId, "tickets", 1).catch(() => false);
        const userType = await (0, authHelper_1.getUserRoleType)(userId);
        const isAdmin = userType === "admin";
        const filter = {};
        // Customers and end support users can only see their own tickets or tickets assigned to them
        if (!hasReadPermission && !isAdmin) {
            filter.$or = [
                { createdBy: userId },
                { customer: userId },
                { assignedTo: userId },
            ];
        }
        if (status)
            filter.status = status;
        if (priority)
            filter.priority = priority;
        if (assignedTo)
            filter.assignedTo = assignedTo;
        if (customer)
            filter.customer = customer;
        if (ticketId)
            filter.ticketId = ticketId;
        if (id)
            filter._id = id;
        // Pagination
        const skip = (Number(page) - 1) * Number(limit);
        const limitNumber = Number(limit);
        // Fetch data
        const [tickets, total] = await Promise.all([
            ticket_model_1.default.find(filter)
                .populate("createdBy", "image name email")
                .populate("assignedTo", "image name email")
                .populate("customer", "image name email")
                .populate("messages.sender", "image name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber),
            ticket_model_1.default.countDocuments(filter),
        ]);
        res.status(200).json({
            success: true,
            message: "Tickets fetched successfully",
            data: tickets,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message || "Failed to fetch tickets"));
    }
};
exports.getTickets = getTickets;
// *********************************************************
// ********************* Ticket Stats **********************
// *********************************************************
const getTicketStats = async (req, res, next) => {
    try {
        const { userId } = req;
        // Get user type and basic permissions
        const userType = await (0, authHelper_1.getUserRoleType)(userId);
        const isAdmin = userType === "admin";
        const isSupport = userType === "support";
        const isCustomer = userType === "customer";
        const hasStatsPermission = await (0, authHelper_1.checkPermission)(userId, "tickets", 1);
        // Common base for all responses
        const response = {
            success: true,
            data: {
                role: userType,
                stats: {
                // Will be populated below
                },
            },
        };
        if (isAdmin || hasStatsPermission) {
            // Admin/Manager Stats
            const [total, open, resolved, closed, assignedToMe] = await Promise.all([
                ticket_model_1.default.countDocuments(),
                ticket_model_1.default.countDocuments({ status: ticket_types_1.TicketStatus.OPEN }),
                ticket_model_1.default.countDocuments({ status: ticket_types_1.TicketStatus.RESOLVED }),
                ticket_model_1.default.countDocuments({ status: ticket_types_1.TicketStatus.CLOSED }),
                ticket_model_1.default.countDocuments({ assignedTo: userId }),
            ]);
            response.data.stats = {
                total,
                open,
                closed,
                resolved,
                assignedToMe,
            };
        }
        else if (isSupport) {
            // Support Agent Stats
            const [assigned, pending, delivered] = await Promise.all([
                ticket_model_1.default.countDocuments({ assignedTo: userId }),
                ticket_model_1.default.countDocuments({
                    assignedTo: userId,
                    status: { $ne: "closed" },
                }),
                ticket_model_1.default.countDocuments({
                    assignedTo: userId,
                    status: "closed",
                }),
            ]);
            const efficiency = assigned > 0 ? Math.round((delivered / assigned) * 100) : 0;
            response.data.stats = {
                total: assigned,
                open: pending,
                closed: delivered,
                efficiency,
            };
        }
        else if (isCustomer) {
            // Customer Stats
            const [total, open, closed, reopened] = await Promise.all([
                ticket_model_1.default.countDocuments({ customer: userId }),
                ticket_model_1.default.countDocuments({
                    customer: userId,
                    status: ticket_types_1.TicketStatus.OPEN,
                }),
                ticket_model_1.default.countDocuments({
                    customer: userId,
                    status: ticket_types_1.TicketStatus.CLOSED,
                }),
                ticket_model_1.default.countDocuments({
                    customer: userId,
                    status: ticket_types_1.TicketStatus.REOPENED,
                }),
            ]);
            response.data.stats = {
                total,
                open,
                closed,
                reopened,
            };
        }
        else {
            throw new error_1.CustomError(403, "You don't have permission to view statistics");
        }
        res.status(200).json(response);
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.getTicketStats = getTicketStats;
// *********************************************************
// ********************* Update Ticket *********************
// *********************************************************
const updateTicket = async (req, res, next) => {
    try {
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        const { userId, body, files } = req;
        const { id } = req.query;
        const { message, status, priority, assignedTo } = body;
        // Validate permissions based on action type
        const action = status === ticket_types_1.TicketStatus.CLOSED ? "close" : message ? "message" : "update";
        const { isAdmin, isAssigned, isCustomer, hasUpdatePermission } = await validateTicketPermissions(userId, id, action);
        const updates = {};
        const updateOperations = {};
        // Handle status changes (including closing)
        if (status) {
            if (!isAdmin && !hasUpdatePermission) {
                throw new error_1.CustomError(403, "Only admin or support with update permission can change status");
            }
            updates.status = status;
            if (status === ticket_types_1.TicketStatus.CLOSED) {
                updates.closedAt = new Date();
                updates.closedBy = userId;
            }
        }
        // Handle field updates (only for admin/support with permission)
        if (priority || assignedTo) {
            if (!isAdmin && !hasUpdatePermission) {
                throw new error_1.CustomError(403, "Only admin or support with update permission can modify ticket fields");
            }
            if (priority)
                updates.priority = priority;
            if (assignedTo)
                updates.assignedTo = assignedTo;
        }
        // Handle message additions (allowed for assigned support even without update permission)
        if (message) {
            // Use validator's returned values
            if (!isAdmin && !hasUpdatePermission && !isAssigned && !isCustomer) {
                throw new error_1.CustomError(403, "Only ticket participants can message this ticket");
            }
            const attachments = files && Array.isArray(files)
                ? await (0, cloudinary_1.uploadTicketAttachments)(files)
                : [];
            updateOperations.$push = {
                messages: {
                    sender: userId,
                    message,
                    attachments,
                },
            };
        }
        // Apply updates
        if (Object.keys(updates).length > 0) {
            updateOperations.$set = updates;
        }
        const updatedTicket = await ticket_model_1.default.findByIdAndUpdate(id, updateOperations, { new: true })
            .populate("createdBy", "image name email")
            .populate("assignedTo", "image name email")
            .populate("customer", "image name email")
            .populate("messages.sender", "image name email");
        res.status(200).json({
            success: true,
            message: "Ticket updated successfully",
            data: updatedTicket,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.updateTicket = updateTicket;
// *********************************************************
// ********************* Delete Ticket *********************
// *********************************************************
const deleteTicket = async (req, res, next) => {
    try {
        const { userId } = req;
        const { id } = req.query;
        // Validate delete permission
        const { ticket } = await validateTicketPermissions(userId, id, "delete");
        // Delete attachments from Cloudinary
        const attachmentPublicIds = ticket.messages.flatMap((msg) => msg.attachments.map((att) => att.publicId));
        if (attachmentPublicIds.length > 0) {
            await (0, cloudinary_1.deleteTicketAttachments)(attachmentPublicIds);
        }
        await ticket_model_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "Ticket deleted successfully",
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.deleteTicket = deleteTicket;
