"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.duplicateService = exports.deleteService = exports.updateService = exports.readServices = exports.createService = void 0;
const serviceModel_1 = __importDefault(require("../models/serviceModel"));
const error_1 = require("../middlewares/error");
const slugify_1 = __importDefault(require("slugify"));
const authHelper_1 = require("../helpers/authHelper");
const express_validator_1 = require("express-validator");
// ********** Create Service **********
const createService = async (req, res, next) => {
    try {
        const { userId, body } = req;
        const { slug, canonicalLink } = body;
        // Check Permission
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "services", 0);
        if (!permissionCheck) {
            return res.status(403).json({ message: "Permission denied" });
        }
        // Validate user input
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Invalid input",
                errors: errors.array(),
            });
        }
        // Check if Slug is already in use
        const existingService = await serviceModel_1.default.findOne({
            slug: (0, slugify_1.default)(slug, { lower: true }),
        });
        if (existingService) {
            throw new error_1.CustomError(400, "Service with this slug already exists");
        }
        // Save service
        const serviceData = {
            ...body,
            canonicalLink: "https://www.adaired.com/services/" +
                (0, slugify_1.default)(canonicalLink, { lower: true }),
            slug: (0, slugify_1.default)(slug, { lower: true }),
        };
        const service = await serviceModel_1.default.create(serviceData);
        // Update Parent Service if created service is a child service
        if (body.parentService) {
            await serviceModel_1.default.findByIdAndUpdate(body.parentService, {
                $push: {
                    childServices: {
                        childServiceId: service._id,
                        childServiceName: service.serviceName,
                        childServiceSlug: service.slug,
                    },
                },
            }, { new: true });
        }
        res.status(201).json({
            message: "Service created successfully",
            data: service,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createService = createService;
// ********** Read Services **********
const readServices = async (req, res, next) => {
    const { identifier } = req.params;
    try {
        let service;
        if (identifier) {
            // Check if the identifier is a valid MongoDB ObjectId
            if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
                service = await serviceModel_1.default.findById(identifier).lean();
            }
            else {
                service = await serviceModel_1.default.findOne({ slug: identifier }).lean();
            }
            if (!service) {
                return next(new error_1.CustomError(404, "Service not found!"));
            }
            return res.status(200).json(service);
        }
        else {
            // If no identifier is provided, return all services
            const services = await serviceModel_1.default.find().lean();
            return res.status(200).json(services);
        }
    }
    catch (error) {
        return next(error);
    }
};
exports.readServices = readServices;
// ********** Update Service **********
const updateService = async (req, res, next) => {
    try {
        const { userId, body } = req;
        const { id } = req.params;
        // Check Permission
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "services", 2);
        if (!permissionCheck) {
            return res.status(403).json({ message: "Permission denied" });
        }
        // Validate user input
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Invalid input",
                errors: errors.array(),
            });
        }
        // Check if Slug is already in use
        if (body.slug) {
            const existingService = await serviceModel_1.default.findOne({
                slug: (0, slugify_1.default)(body.slug, { lower: true }),
                _id: { $ne: id }, // Exclude the current service from the check
            });
            if (existingService) {
                throw new error_1.CustomError(400, "Service with this slug already exists");
            }
        }
        // Prepare update data
        const updateData = {
            ...body,
            slug: body.slug ? (0, slugify_1.default)(body.slug, { lower: true }) : undefined,
            canonicalLink: body.canonicalLink
                ? "https://www.adaired.com/services/" +
                    (0, slugify_1.default)(body.canonicalLink, { lower: true })
                : undefined,
        };
        // Remove undefined fields from updateData
        Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);
        // Find the current service
        const currentService = await serviceModel_1.default.findById(id);
        if (!currentService) {
            return next(new error_1.CustomError(404, "Service not found!"));
        }
        // Update parent service if changed
        if (body.parentService &&
            body.parentService !== currentService.parentService) {
            // Remove from old parent
            if (currentService.parentService) {
                await serviceModel_1.default.findByIdAndUpdate(currentService.parentService, { $pull: { childServices: { childServiceId: id } } }, { new: true });
            }
            // Add to new parent
            await serviceModel_1.default.findByIdAndUpdate(body.parentService, {
                $push: {
                    childServices: {
                        childServiceId: id,
                        childServiceName: body.serviceName || currentService.serviceName,
                        childServiceSlug: body.slug
                            ? (0, slugify_1.default)(body.slug, { lower: true })
                            : currentService.slug,
                    },
                },
            }, { new: true });
        }
        // Update service
        const updatedService = await serviceModel_1.default.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });
        if (!updatedService) {
            return next(new error_1.CustomError(404, "Service not found!"));
        }
        res.status(200).json({
            message: "Service updated successfully",
            data: updatedService,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateService = updateService;
// ********** Delete Service **********
const deleteService = async (req, res, next) => {
    try {
        const { userId } = req;
        const { id } = req.params;
        // Check Permission
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "services", 3);
        if (!permissionCheck)
            return;
        // Delete service
        const deletedService = await serviceModel_1.default.findByIdAndDelete(id);
        // Remove service from parent's array
        if (deletedService.parentService) {
            const parentService = await serviceModel_1.default.findByIdAndUpdate(deletedService.parentService, { $pull: { childServices: { childServiceId: id } } }, { new: true });
        }
        if (!deletedService) {
            return next(new error_1.CustomError(404, "Service not found!"));
        }
        res.status(200).json({
            message: "Service deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteService = deleteService;
// ********** Duplicate Service **********
const duplicateService = async (req, res, next) => {
    try {
        const { userId } = req;
        const { id } = req.params;
        // Check Permission
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "services", 1);
        if (!permissionCheck) {
            return res.status(403).json({ message: "Permission denied" });
        }
        // Find the existing service
        const existingService = await serviceModel_1.default.findById(id);
        if (!existingService) {
            return next(new error_1.CustomError(404, "Service not found!"));
        }
        // Prepare new service data
        const duplicateData = {
            ...existingService.toObject(),
            _id: undefined,
            serviceName: `${existingService.serviceName}-copy`,
            slug: `${existingService.slug}-copy`,
            canonicalLink: `https://www.adaired.com/services/${(0, slugify_1.default)(`${existingService.serviceName}-copy`, { lower: true })}`,
        };
        // Create the duplicate service
        const duplicatedService = await serviceModel_1.default.create(duplicateData);
        // If the service has a parent, add to parent's child services
        if (existingService.parentService) {
            await serviceModel_1.default.findByIdAndUpdate(existingService.parentService, {
                $push: {
                    childServices: {
                        childServiceId: duplicatedService._id,
                        childServiceName: duplicatedService.serviceName,
                        childServiceSlug: duplicatedService.slug,
                    },
                },
            }, { new: true });
        }
        res.status(201).json({
            message: "Service duplicated successfully",
            data: duplicatedService,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.duplicateService = duplicateService;
