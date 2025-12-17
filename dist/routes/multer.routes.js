"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multerMiddleware_1 = require("../middlewares/multerMiddleware");
const error_1 = require("../middlewares/error");
const cloudinary_1 = require("../utils/cloudinary");
const router = express_1.default.Router();
// Endpoint to upload files
router.post("/upload", multerMiddleware_1.upload.array("files"), async (req, res, next) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            throw new error_1.CustomError(400, "No files uploaded");
        }
        const results = await (0, cloudinary_1.uploadImages)(files);
        res.status(200).json({
            message: "Files uploaded successfully",
            data: results,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
});
// Route to get uploaded media
router.get("/getUploadedMedia", async (req, res, next) => {
    const { fileType } = req.query; // Extract fileType from query
    try {
        // Call the fetchImagesInFolder function with the new fileType parameter
        const results = await (0, cloudinary_1.fetchImagesInFolder)(fileType);
        res.status(200).json({
            message: "Files fetched successfully",
            data: results,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
});
// Route to get image by public ID
router.get("/getImageByPublicId", async (req, res, next) => {
    const { public_id } = req.query;
    try {
        const result = await (0, cloudinary_1.fetchImageByPublicId)(public_id);
        res.status(200).json({
            message: "Image fetched successfully",
            data: result.resources[0],
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
});
// Route to delete file by public ID
router.delete("/deleteFile", async (req, res, next) => {
    const { public_id } = req.query;
    try {
        const result = await (0, cloudinary_1.deleteImage)(public_id);
        if (result.result === "ok") {
            res.json({
                message: "Image deleted successfully",
            });
        }
        else {
            throw new error_1.CustomError(500, "Failed to delete image from Cloudinary");
        }
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
});
// Route to edit image metadata
router.put("/editImage", async (req, res, next) => {
    const { public_id } = req.query;
    const { caption, alt } = req.body;
    try {
        const result = await (0, cloudinary_1.editImageInfo)(public_id, caption, alt);
        res.status(200).json({
            message: "Image metadata updated successfully",
            data: result,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
});
// Route to get cloudinary usage information
router.get("/get-usage", async (req, res, next) => {
    try {
        const result = await (0, cloudinary_1.getCloudinaryStorageUsage)();
        res.status(200).json({
            message: "Cloudinary usage updated successfully",
            data: result,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
});
exports.default = router;
