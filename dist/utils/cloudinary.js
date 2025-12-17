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
// Cloudinary Configuration
try {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}
catch (configError) {
    console.error("Cloudinary configuration error:", configError);
    throw new error_1.CustomError(500, "Cloudinary configuration failed");
}
// Create a dedicated folder in Cloudinary for ticket attachments
const TICKET_ATTACHMENTS_FOLDER = "ticket_attachments";
// ********** Ticket Attachments Functions **********
/**
 * Uploads multiple files to Cloudinary in the ticket attachments folder
 * @param files Array of files to upload
 * @returns Array of uploaded attachments
 */
const uploadTicketAttachments = async (files) => {
    try {
        const uploadPromises = files.map((file) => {
            return new Promise((resolve, reject) => {
                const isSvg = file.mimetype === "image/svg+xml";
                const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                    folder: TICKET_ATTACHMENTS_FOLDER,
                    resource_type: isSvg ? "image" : "auto",
                }, (error, result) => {
                    if (error) {
                        reject(new error_1.CustomError(500, `Failed to upload ${file.originalname}: ${error.message}`));
                    }
                    else if (result) {
                        resolve({ ...result });
                    }
                    else {
                        reject(new error_1.CustomError(500, `Upload failed for ${file.originalname}`));
                    }
                });
                uploadStream.end(file.buffer);
            });
        });
        const results = await Promise.allSettled(uploadPromises);
        const successfulUploads = results
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value);
        const failedUploads = results
            .filter((result) => result.status === "rejected")
            .map((result) => result.reason);
        if (failedUploads.length > 0) {
            console.error("Failed uploads:", failedUploads);
            throw new error_1.CustomError(400, `Failed to upload ${failedUploads.length} files`);
        }
        // Format the successful uploads into ticket attachments
        const attachments = successfulUploads.map((upload) => ({
            url: upload.secure_url,
            publicId: upload.public_id,
            fileName: upload.original_filename || "file",
            fileType: upload.resource_type,
            fileSize: upload.bytes,
            uploadedAt: new Date(upload.created_at),
        }));
        return attachments;
    }
    catch (error) {
        console.error("Error uploading ticket attachments:", error);
        throw new error_1.CustomError(error.statusCode || 500, error.message || "Failed to upload ticket attachments");
    }
};
exports.uploadTicketAttachments = uploadTicketAttachments;
/**
 * Deletes ticket attachments from Cloudinary
 * @param publicIds Array of public IDs to delete
 */
const deleteTicketAttachments = async (publicIds) => {
    try {
        if (!publicIds || publicIds.length === 0)
            return;
        // Cloudinary allows deleting multiple files at once
        const result = await cloudinary_1.v2.api.delete_resources(publicIds);
        // Check for errors in deletion
        const failedDeletions = Object.entries(result.deleted)
            .filter(([_, value]) => value !== "deleted")
            .map(([publicId]) => publicId);
        if (failedDeletions.length > 0) {
            console.error("Failed to delete attachments:", failedDeletions);
            throw new error_1.CustomError(500, `Failed to delete ${failedDeletions.length} attachments`);
        }
        return result;
    }
    catch (error) {
        console.error("Error deleting ticket attachments:", error);
        throw new error_1.CustomError(error.statusCode || 500, error.message || "Failed to delete ticket attachments");
    }
};
exports.deleteTicketAttachments = deleteTicketAttachments;
// ********** Existing Cloudinary Functions **********
// ********** Upload images to Cloudinary **********
const uploadImages = async (files) => {
    try {
        const uploadPromises = files.map((file) => {
            return new Promise((resolve, reject) => {
                const isSvg = file.mimetype === "image/svg+xml";
                const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                    resource_type: isSvg ? "image" : "auto",
                }, (error, result) => {
                    if (error) {
                        reject({ error, file: file.originalname });
                    }
                    else if (result) {
                        resolve({ ...result });
                    }
                    else {
                        reject({
                            error: new Error("Upload failed"),
                            file: file.originalname,
                        });
                    }
                });
                uploadStream.end(file.buffer);
            });
        });
        const results = await Promise.allSettled(uploadPromises);
        const successfulUploads = results
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value);
        const failedUploads = results
            .filter((result) => result.status === "rejected")
            .map((result) => result.reason);
        if (failedUploads.length > 0) {
            console.error("Failed uploads:", failedUploads);
        }
        // Function to fetch all images with retry logic
        async function fetchAllImagesWithRetry(maxRetries = 5, delayMs = 1000) {
            // If no successful uploads, just fetch once
            if (successfulUploads.length === 0) {
                let allImages = [];
                let nextCursor = undefined;
                do {
                    const response = await cloudinary_1.v2.search
                        .expression("resource_type:image")
                        .max_results(500)
                        .next_cursor(nextCursor)
                        .sort_by("created_at", "desc")
                        .execute()
                        .catch((error) => {
                        console.error("Error fetching images:", error);
                        return { resources: [], next_cursor: undefined };
                    });
                    allImages = allImages.concat(response.resources);
                    nextCursor = response.next_cursor;
                } while (nextCursor);
                return allImages;
            }
            // Retry logic for when there are new uploads
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                let allImages = [];
                let nextCursor = undefined;
                do {
                    const response = await cloudinary_1.v2.search
                        .expression("resource_type:image")
                        .max_results(500)
                        .next_cursor(nextCursor)
                        .sort_by("created_at", "desc")
                        .execute()
                        .catch((error) => {
                        console.error(`Fetch attempt ${attempt} failed:`, error);
                        return { resources: [], next_cursor: undefined };
                    });
                    allImages = allImages.concat(response.resources);
                    nextCursor = response.next_cursor;
                } while (nextCursor);
                // Verify all successful uploads are present
                const allUploadsPresent = successfulUploads.every((upload) => allImages.some((img) => img.public_id === upload.public_id));
                if (allUploadsPresent) {
                    return allImages;
                }
                console.log(`Attempt ${attempt}/${maxRetries}: Waiting for new uploads to index...`);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
            // If we reach here, retries failed - fetch one last time and return what we have
            console.warn("Max retries reached - returning available images");
            let allImages = [];
            let nextCursor = undefined;
            do {
                const response = await cloudinary_1.v2.search
                    .expression("resource_type:image")
                    .max_results(500)
                    .next_cursor(nextCursor)
                    .sort_by("created_at", "desc")
                    .execute();
                allImages = allImages.concat(response.resources);
                nextCursor = response.next_cursor;
            } while (nextCursor);
            return allImages;
        }
        const allImages = await fetchAllImagesWithRetry();
        return {
            successfulUploads,
            failedUploads,
            allImages,
        };
    }
    catch (error) {
        throw new error_1.CustomError(500, "Image upload failed: " + error);
    }
};
exports.uploadImages = uploadImages;
// *********** Fetch Image By Public ID **********
const fetchImageByPublicId = async (public_id) => {
    try {
        const result = await cloudinary_1.v2.search
            .expression(`public_id:${public_id}`)
            .execute();
        return result;
    }
    catch (error) {
        console.error("Error fetching image by public ID:", error);
        throw new error_1.CustomError(500, "Failed to fetch image by public ID");
    }
};
exports.fetchImageByPublicId = fetchImageByPublicId;
// ********** Fetch All images from Cloudinary with Pagination **********
const fetchImagesInFolder = async (fileType = "all") => {
    try {
        let resources = [];
        let nextCursor = undefined;
        // Constructing the search expression based on the fileType parameter
        let expression = `folder:""`;
        if (fileType === "svg") {
            expression += ` AND resource_type:image AND format:svg`;
        }
        else if (fileType === "non-svg") {
            expression += ` AND resource_type:image AND NOT format:svg`;
        }
        do {
            const { resources: batch, next_cursor } = await cloudinary_1.v2.search
                .expression(expression)
                .sort_by("created_at", "desc")
                .max_results(50)
                .with_field("context")
                .next_cursor(nextCursor)
                .execute();
            resources = resources.concat(batch);
            nextCursor = next_cursor;
        } while (nextCursor);
        return resources;
    }
    catch (error) {
        throw new error_1.CustomError(error?.error?.http_code, error.error.message || "Failed to fetch images from Cloudinary");
    }
};
exports.fetchImagesInFolder = fetchImagesInFolder;
// ********** Delete image from Cloudinary **********
const deleteImage = async (public_id) => {
    try {
        const result = await cloudinary_1.v2.uploader.destroy(public_id);
        if (result.result !== "ok") {
            throw new Error(`Failed to delete image with public ID: ${public_id}`);
        }
        return result;
    }
    catch (error) {
        throw new error_1.CustomError(500, `Failed to delete image: ${error}`);
    }
};
exports.deleteImage = deleteImage;
// ********** Edit image info from Cloudinary **********
const editImageInfo = async (public_id, caption, alt) => {
    try {
        const updateOptions = {};
        if (caption) {
            updateOptions.context = { caption: caption };
        }
        if (alt) {
            updateOptions.context = { ...updateOptions.context, alt: alt };
        }
        const result = await cloudinary_1.v2.uploader.explicit(public_id, {
            type: "upload",
            ...updateOptions,
        });
        return result;
    }
    catch (error) {
        console.error("Error editing image info:", error);
        throw new error_1.CustomError(500, `Failed to edit image info: ${error}`);
    }
};
exports.editImageInfo = editImageInfo;
// ********** Get Cloudinary Storage Usage ***********
const getCloudinaryStorageUsage = async () => {
    try {
        const response = await cloudinary_1.v2.api.usage();
        return response;
    }
    catch (error) {
        throw new error_1.CustomError(500, `Failed to fetch Cloudinary storage usage info: ${error}`);
    }
};
exports.getCloudinaryStorageUsage = getCloudinaryStorageUsage;
