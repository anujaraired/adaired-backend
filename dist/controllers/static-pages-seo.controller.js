"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePageSEO = exports.getAllPageSEO = exports.getPageSEOByName = exports.updatePageSEO = exports.createPageSEO = void 0;
const static_pages_seo_model_1 = __importDefault(require("../models/static-pages-seo.model"));
const error_1 = require("../middlewares/error");
const authHelper_1 = require("../helpers/authHelper");
const validateInput_1 = require("../utils/validateInput");
// Helper function to calculate Flesch Reading Ease score (simplified)
const calculateFleschScore = (text) => {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const syllables = text.replace(/[^aeiouy]/gi, "").length;
    if (words === 0 || sentences === 0)
        return 0;
    return Math.max(0, 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words));
};
// Helper function to calculate SEO score and suggestions
const calculateSEOScore = (seoData, content = "") => {
    let score = 0;
    const suggestions = [];
    // Title length (50-60 chars optimal)
    const titleLength = seoData.title.length;
    if (titleLength >= 50 && titleLength <= 60) {
        score += 10;
    }
    else if (titleLength >= 40 && titleLength <= 70) {
        score += 5;
    }
    else {
        suggestions.push(`Title length (${titleLength} chars) should be 50-60 characters.`);
    }
    // Meta description length (120-160 chars optimal)
    const descLength = seoData.metaDescription.length;
    if (descLength >= 120 && descLength <= 160) {
        score += 10;
    }
    else if (descLength >= 80 && descLength <= 200) {
        score += 5;
    }
    else {
        suggestions.push(`Meta description length (${descLength} chars) should be 120-160 characters.`);
    }
    // Keyword in title
    const keywordInTitle = seoData.title
        .toLowerCase()
        .includes(seoData.targetKeyword.toLowerCase());
    if (keywordInTitle) {
        score += 10;
    }
    else {
        suggestions.push("Include the target keyword in the title.");
    }
    // Keyword in meta description
    const keywordInDesc = seoData.metaDescription
        .toLowerCase()
        .includes(seoData.targetKeyword.toLowerCase());
    if (keywordInDesc) {
        score += 10;
    }
    else {
        suggestions.push("Include the target keyword in the meta description.");
    }
    // Keyword density in content (0.5-2.5% optimal)
    let keywordDensity = 0;
    if (content) {
        const words = content.split(/\s+/).length;
        const keywordCount = (content.match(new RegExp(seoData.targetKeyword, "gi")) || []).length;
        keywordDensity = (keywordCount / words) * 100;
        if (keywordDensity >= 0.5 && keywordDensity <= 2.5) {
            score += 10;
        }
        else if (keywordDensity > 0) {
            score += 5;
        }
        else {
            suggestions.push(`Keyword density (${keywordDensity.toFixed(2)}%) should be 0.5-2.5%.`);
        }
    }
    else {
        suggestions.push("Provide page content to analyze keyword density.");
    }
    // Readability (Flesch score 60-70 optimal)
    const fleschScore = calculateFleschScore(seoData.metaDescription);
    if (fleschScore >= 60 && fleschScore <= 70) {
        score += 10;
    }
    else if (fleschScore >= 50 && fleschScore <= 80) {
        score += 5;
    }
    else {
        suggestions.push(`Meta description readability (Flesch: ${fleschScore.toFixed(2)}) should be 60-70. Simplify the text.`);
    }
    // Canonical URL
    if (seoData.canonicalUrl) {
        score += 5;
    }
    else {
        suggestions.push("Add a canonical URL to avoid duplicate content issues.");
    }
    // OG Tags
    if (seoData.ogTitle && seoData.ogDescription && seoData.ogImage) {
        score += 5;
    }
    else {
        suggestions.push("Add Open Graph tags (og:title, og:description, og:image).");
    }
    return { score, suggestions };
};
// Create SEO Metadata
const createPageSEO = async (req, res, next) => {
    try {
        const { userId, body } = req;
        // Check permission
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "pageSEO", 0);
        if (!permissionCheck) {
            throw new error_1.CustomError(403, "Permission denied");
        }
        // Validate input
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        const newSEO = new static_pages_seo_model_1.default({
            ...body,
            createdBy: userId,
            updatedBy: userId,
        });
        await newSEO.save();
        // Calculate SEO score
        const { score, suggestions } = calculateSEOScore(newSEO, body.content || "");
        res.status(201).json({
            success: true,
            message: "SEO metadata created successfully",
            data: newSEO,
            seoScore: score,
            suggestions,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.createPageSEO = createPageSEO;
// Update SEO Metadata
const updatePageSEO = async (req, res, next) => {
    try {
        const { userId, body } = req;
        const { id } = req.query;
        if (!id) {
            throw new error_1.CustomError(400, "Page SEO ID is required");
        }
        // Check permission
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "pageSEO", 2);
        if (!permissionCheck) {
            throw new error_1.CustomError(403, "Permission denied");
        }
        const existingSEO = await static_pages_seo_model_1.default.findById(id);
        if (!existingSEO) {
            throw new error_1.CustomError(404, "SEO metadata not found");
        }
        const updates = {
            ...body,
            updatedBy: userId,
        };
        const updatedSEO = await static_pages_seo_model_1.default.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });
        // Calculate SEO score
        const { score, suggestions } = calculateSEOScore(updatedSEO, body.content || "");
        res.status(200).json({
            success: true,
            message: "SEO metadata updated successfully",
            data: updatedSEO,
            seoScore: score,
            suggestions,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.updatePageSEO = updatePageSEO;
// Get SEO Metadata by Page Name
const getPageSEOByName = async (req, res, next) => {
    try {
        const { pageName } = req.params;
        const seoData = await static_pages_seo_model_1.default.findOne({ pageName });
        if (!seoData) {
            throw new error_1.CustomError(404, `SEO metadata for page "${pageName}" not found`);
        }
        // Calculate SEO score (optional content can be passed for analysis)
        const { score, suggestions } = calculateSEOScore(seoData, req.body.content || "");
        res.status(200).json({
            success: true,
            message: "SEO metadata fetched successfully",
            data: seoData,
            seoScore: score,
            suggestions,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.getPageSEOByName = getPageSEOByName;
// Get All SEO Metadata
const getAllPageSEO = async (req, res, next) => {
    try {
        const { userId } = req;
        // Check permission
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "pageSEO", 1);
        if (!permissionCheck) {
            throw new error_1.CustomError(403, "Permission denied");
        }
        const seoData = await static_pages_seo_model_1.default.find()
            .populate("createdBy", "_id name email")
            .populate("updatedBy", "_id name email");
        res.status(200).json({
            success: true,
            message: "SEO metadata fetched successfully",
            data: seoData,
            count: seoData.length,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.getAllPageSEO = getAllPageSEO;
// Delete SEO Metadata
const deletePageSEO = async (req, res, next) => {
    try {
        const { userId } = req;
        const { id } = req.query;
        // Check permission
        const permissionCheck = await (0, authHelper_1.checkPermission)(userId, "pageSEO", 3);
        if (!permissionCheck) {
            throw new error_1.CustomError(403, "Permission denied");
        }
        const seoData = await static_pages_seo_model_1.default.findByIdAndDelete(id);
        if (!seoData) {
            throw new error_1.CustomError(404, "SEO metadata not found");
        }
        res.status(200).json({
            success: true,
            message: "SEO metadata deleted successfully",
            data: seoData,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.deletePageSEO = deletePageSEO;
