"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCloudinaryStorageUsage = exports.editImageInfo = exports.deleteImage = exports.fetchImagesInFolder = exports.fetchImageByPublicId = exports.uploadImages = exports.deleteTicketAttachments = exports.uploadTicketAttachments = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const cloudinary_1 = require("cloudinary");
const error_1 = require("../middlewares/error");
dotenv_1.default.config();
/* --------------------------------------------------
   Cloudinary Config
-------------------------------------------------- */
try {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}
catch (error) {
    console.error("Cloudinary configuration error:", error);
    throw new error_1.CustomError(500, "Cloudinary configuration failed");
}
const TICKET_ATTACHMENTS_FOLDER = "ticket_attachments";
/* --------------------------------------------------
   Ticket Attachments Upload
-------------------------------------------------- */
const uploadTicketAttachments = async (files) => {
    try {
        const uploadPromises = files.map((file) => new Promise((resolve, reject) => {
            const isSvg = file.mimetype === "image/svg+xml";
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder: TICKET_ATTACHMENTS_FOLDER,
                resource_type: isSvg ? "image" : "auto",
            }, (error, result) => {
                if (error) {
                    reject(new error_1.CustomError(500, `Failed to upload ${file.originalname}: ${error.message}`));
                }
                else if (result) {
                    resolve(result);
                }
                else {
                    reject(new error_1.CustomError(500, `Upload failed for ${file.originalname}`));
                }
            });
            uploadStream.end(file.buffer);
        }));
        const results = await Promise.allSettled(uploadPromises);
        const successfulUploads = results
            .filter((r) => r.status === "fulfilled")
            .map((r) => r.value);
        const failedUploads = results
            .filter((r) => r.status === "rejected")
            .map((r) => r.reason);
        if (failedUploads.length > 0) {
            throw new error_1.CustomError(400, `Failed to upload ${failedUploads.length} files`);
        }
        return successfulUploads.map((upload) => ({
            url: upload.secure_url,
            publicId: upload.public_id,
            fileName: upload.original_filename || "file",
            fileType: upload.resource_type,
            fileSize: upload.bytes,
            uploadedAt: new Date(upload.created_at),
        }));
    }
    catch (error) {
        throw new error_1.CustomError(error.statusCode || 500, error.message || "Failed to upload ticket attachments");
    }
};
exports.uploadTicketAttachments = uploadTicketAttachments;
/* --------------------------------------------------
   Delete Ticket Attachments
-------------------------------------------------- */
const deleteTicketAttachments = async (publicIds) => {
    if (!publicIds.length)
        return;
    try {
        const result = await cloudinary_1.v2.api.delete_resources(publicIds);
        const failed = Object.entries(result.deleted)
            .filter(([_, status]) => status !== "deleted")
            .map(([id]) => id);
        if (failed.length) {
            throw new error_1.CustomError(500, `Failed to delete ${failed.length} attachments`);
        }
        return result;
    }
    catch (error) {
        throw new error_1.CustomError(error.statusCode || 500, error.message || "Failed to delete ticket attachments");
    }
};
exports.deleteTicketAttachments = deleteTicketAttachments;
/* --------------------------------------------------
   Upload Images
-------------------------------------------------- */
const uploadImages = async (files) => {
    try {
        const uploadPromises = files.map((file) => new Promise((resolve, reject) => {
            const isSvg = file.mimetype === "image/svg+xml";
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({ resource_type: isSvg ? "image" : "auto" }, (error, result) => {
                if (error)
                    reject(error);
                else if (result)
                    resolve(result);
                else
                    reject(new Error("Upload failed"));
            });
            uploadStream.end(file.buffer);
        }));
        const results = await Promise.allSettled(uploadPromises);
        const successfulUploads = results
            .filter((r) => r.status === "fulfilled")
            .map((r) => r.value);
        let allImages = [];
        let nextCursor;
        do {
            const response = (await cloudinary_1.v2.search
                .expression("resource_type:image")
                .sort_by("created_at", "desc")
                .max_results(500)
                .next_cursor(nextCursor)
                .execute());
            allImages = allImages.concat(response.resources);
            nextCursor = response.next_cursor;
        } while (nextCursor);
        return { successfulUploads, allImages };
    }
    catch (error) {
        throw new error_1.CustomError(500, "Image upload failed");
    }
};
exports.uploadImages = uploadImages;
/* --------------------------------------------------
   Fetch Image By Public ID
-------------------------------------------------- */
const fetchImageByPublicId = async (publicId) => {
    try {
        return await cloudinary_1.v2.search
            .expression(`public_id:${publicId}`)
            .execute();
    }
    catch {
        throw new error_1.CustomError(500, "Failed to fetch image by public ID");
    }
};
exports.fetchImageByPublicId = fetchImageByPublicId;
/* --------------------------------------------------
   Fetch Images in Folder
-------------------------------------------------- */
const fetchImagesInFolder = async (fileType = "all") => {
    let resources = [];
    let nextCursor;
    let expression = "resource_type:image";
    if (fileType === "svg")
        expression += " AND format:svg";
    if (fileType === "non-svg")
        expression += " AND NOT format:svg";
    do {
        const response = (await cloudinary_1.v2.search
            .expression(expression)
            .sort_by("created_at", "desc")
            .max_results(50)
            .next_cursor(nextCursor)
            .execute());
        resources = resources.concat(response.resources);
        nextCursor = response.next_cursor;
    } while (nextCursor);
    return resources;
};
exports.fetchImagesInFolder = fetchImagesInFolder;
/* --------------------------------------------------
   Delete Image
-------------------------------------------------- */
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary_1.v2.uploader.destroy(publicId);
        if (result.result !== "ok") {
            throw new Error("Delete failed");
        }
        return result;
    }
    catch {
        throw new error_1.CustomError(500, "Failed to delete image");
    }
};
exports.deleteImage = deleteImage;
/* --------------------------------------------------
   Edit Image Info
-------------------------------------------------- */
const editImageInfo = async (publicId, caption, alt) => {
    const context = {};
    if (caption)
        context.caption = caption;
    if (alt)
        context.alt = alt;
    try {
        return await cloudinary_1.v2.uploader.explicit(publicId, {
            type: "upload",
            context,
        });
    }
    catch {
        throw new error_1.CustomError(500, "Failed to edit image info");
    }
};
exports.editImageInfo = editImageInfo;
/* --------------------------------------------------
   Cloudinary Usage
-------------------------------------------------- */
const getCloudinaryStorageUsage = async () => {
    try {
        return await cloudinary_1.v2.api.usage();
    }
    catch {
        throw new error_1.CustomError(500, "Failed to fetch storage usage");
    }
};
exports.getCloudinaryStorageUsage = getCloudinaryStorageUsage;
