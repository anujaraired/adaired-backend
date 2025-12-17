"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDeleteCaseStudy = exports.validateUpdateCaseStudy = exports.validateCaseStudy = exports.validateUpdateCaseStudyCategory = exports.validateCaseStudyCategory = exports.validateUpdateTicket = exports.validateCreateTicket = exports.validateProductUpdateCategory = exports.validateProductCreateCategory = exports.validateUpdateProduct = exports.validateCreateProduct = exports.validateCaseStudyUpdateCategory = exports.ValidateUpdateService = exports.ValidateCreateService = exports.validateBlogCategoryUpdate = exports.validateBlogCategoryCreate = exports.validateUpdateBlog = exports.validateBlog = exports.validatePermissionModuleUpdate = exports.validatePermissionModuleCreate = exports.validateRoleId = exports.validateUpdateRole = exports.validateRole = exports.validateLogin = exports.validateRegister = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const express_validator_1 = require("express-validator");
const ticket_types_1 = require("../types/ticket.types");
// ********** User and Authentication ***********
exports.validateRegister = [
    (0, express_validator_1.check)("name", "Name is required").isString().trim(),
    (0, express_validator_1.check)("email", "Email is required")
        .isEmail()
        .withMessage("Please enter a valid email")
        .normalizeEmail({
        gmail_remove_dots: true,
    })
        .trim(),
    (0, express_validator_1.check)("password")
        .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    })
        .withMessage("Password must be at least 8 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 special character")
        .optional(),
    (0, express_validator_1.check)("contact")
        .optional()
        .custom((value) => {
        if (!value)
            return true;
        const phonePattern = /^\+?[1-9]\d{6,14}$/;
        return phonePattern.test(value);
    })
        .withMessage("Contact must be a valid phone number"),
    (0, express_validator_1.check)("status").optional(),
];
exports.validateLogin = [
    (0, express_validator_1.body)().custom((value, { req }) => {
        if (!req.body.googleId) {
            if (!req.body.identifier) {
                throw new Error("Email or Username is required");
            }
            if (!req.body.password) {
                throw new Error("Password is required");
            }
        }
        return true;
    }),
    (0, express_validator_1.check)("identifier")
        .optional()
        .custom((value) => {
        if (value) {
            const isEmail = /\S+@\S+\.\S+/.test(value);
            const isUsername = /^[a-zA-Z0-9._-]{3,20}$/.test(value);
            if (!isEmail && !isUsername) {
                throw new Error("Identifier must be a valid email or username");
            }
        }
        return true;
    }),
    (0, express_validator_1.check)("rememberMe").optional().isBoolean(),
];
// ********** Roles **********
exports.validateRole = [
    (0, express_validator_1.check)("name", "Role name is required").notEmpty().isString().trim(),
    (0, express_validator_1.check)("description").optional().isString().trim(),
    (0, express_validator_1.check)("status").optional().isBoolean().default(true),
    (0, express_validator_1.check)("permissions").isArray().optional(),
];
exports.validateUpdateRole = [
    (0, express_validator_1.check)("name", "Role name is required")
        .optional()
        .notEmpty()
        .isString()
        .trim(),
    (0, express_validator_1.check)("description").optional().isString().trim(),
    (0, express_validator_1.check)("status").optional().isBoolean(),
    (0, express_validator_1.check)("permissions").optional().isArray(),
];
exports.validateRoleId = [
    (0, express_validator_1.check)("roleId", "Role ID is required")
        .optional()
        .notEmpty()
        .isMongoId()
        .withMessage("Please enter a valid role ID"),
];
exports.validatePermissionModuleCreate = [
    (0, express_validator_1.check)("name", "Module name is required").notEmpty().isString().trim(),
    (0, express_validator_1.check)("value", "Module value is required").notEmpty().isString().trim(),
    (0, express_validator_1.check)("status").optional().isBoolean().default(true),
];
exports.validatePermissionModuleUpdate = [
    (0, express_validator_1.check)("name").optional().isString().trim(),
    (0, express_validator_1.check)("value").optional().isString().trim(),
    (0, express_validator_1.check)("status").optional().isBoolean().default(true),
];
// ***********************************************************************************************************************************************************
// ******************************************************************* Blogs *********************************************************************************
// ***********************************************************************************************************************************************************
exports.validateBlog = [
    (0, express_validator_1.check)("seo.metaTitle", "SEO meta title is required")
        .notEmpty()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.metaDescription", "SEO meta description is required")
        .notEmpty()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.canonicalLink", "SEO canonical link is required")
        .notEmpty()
        .isString()
        .trim()
        .withMessage("Canonical link must be a valid string (URL or slug)"),
    (0, express_validator_1.check)("seo.focusKeyword", "SEO focus keyword is required")
        .notEmpty()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.keywords", "SEO keywords must be an array of strings")
        .optional()
        .isArray()
        .custom((value) => {
        return value.every((keyword) => typeof keyword === "string" && keyword.trim().length > 0);
    })
        .withMessage("Each keyword must be a non-empty string"),
    (0, express_validator_1.check)("seo.openGraph.title", "Open Graph title must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.openGraph.description", "Open Graph description must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.openGraph.image")
        .if((value) => value !== undefined && value !== null && value !== "")
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .withMessage("Open Graph image must be a valid URL")
        .trim(),
    (0, express_validator_1.check)("seo.openGraph.type", "Open Graph type must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.openGraph.url", "Open Graph URL must be a valid URL")
        .optional()
        .trim(),
    (0, express_validator_1.check)("seo.openGraph.siteName", "Open Graph site name must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.twitterCard.cardType", "Twitter card type must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.twitterCard.site", "Twitter card site must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.twitterCard.creator", "Twitter card creator must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.twitterCard.title", "Twitter card title must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.twitterCard.description", "Twitter card description must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.twitterCard.image", "Twitter card image must be a valid URL")
        .if((value) => value !== undefined && value !== null && value !== "")
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .trim(),
    (0, express_validator_1.check)("seo.robotsText", "SEO robots text is required")
        .notEmpty()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.schemaOrg", "SEO schema.org must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.bodyScript", "SEO body script must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.headerScript", "SEO header script must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.footerScript", "SEO footer script must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.priority", "SEO priority must be a number between 0 and 1")
        .optional()
        .isFloat({ min: 0, max: 1 }),
    (0, express_validator_1.check)("seo.changeFrequency", "SEO change frequency must be valid")
        .optional()
        .isIn([
        "always",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "never",
    ]),
    (0, express_validator_1.check)("seo.redirect.type", "SEO redirect type must be '301', '302', or null")
        .optional()
        .isIn(["301", "302", null]),
    (0, express_validator_1.check)("seo.redirect.url", "SEO redirect URL must be a valid URL")
        .if((value) => value !== undefined && value !== null && value !== "")
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .trim(),
    // Blog Fields
    (0, express_validator_1.check)("category", "Category must be a valid MongoDB ID")
        .optional()
        .isMongoId(),
    (0, express_validator_1.check)("featuredImage", "Featured image must be a valid URL")
        .notEmpty()
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .trim(),
    (0, express_validator_1.check)("postTitle", "Post title is required").notEmpty().isString().trim(),
    (0, express_validator_1.check)("postDescription", "Post description is required")
        .notEmpty()
        .isString(),
    (0, express_validator_1.check)("slug", "Slug must be a valid string").optional().isString().trim(),
    (0, express_validator_1.check)("tags", "Tags must be an array of strings")
        .optional()
        .isArray()
        .custom((value) => {
        return value.every((tag) => typeof tag === "string" && tag.trim().length > 0);
    })
        .withMessage("Each tag must be a non-empty string"),
    (0, express_validator_1.check)("blogAuthor", "Blog author must be a valid MongoDB ID")
        .optional()
        .isMongoId(),
    (0, express_validator_1.check)("status", "Status must be either 'publish' , 'draft' or 'scheduled")
        .optional()
        .isIn(["publish", "draft", "scheduled"]),
];
exports.validateUpdateBlog = [
    (0, express_validator_1.check)("seo.metaTitle", "SEO meta title must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.metaDescription", "SEO meta description must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.canonicalLink", "SEO canonical link must be a valid string")
        .optional()
        .isString()
        .trim()
        .withMessage("Canonical link must be a valid string (URL or slug)"),
    (0, express_validator_1.check)("seo.focusKeyword", "SEO focus keyword must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.keywords", "SEO keywords must be an array of strings")
        .optional()
        .isArray()
        .custom((value) => {
        return value.every((keyword) => typeof keyword === "string" && keyword.trim().length > 0);
    })
        .withMessage("Each keyword must be a non-empty string"),
    (0, express_validator_1.check)("seo.openGraph.title", "Open Graph title must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.openGraph.description", "Open Graph description must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.openGraph.image")
        .if((value) => value !== undefined && value !== null && value !== "")
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .withMessage("Open Graph image must be a valid URL")
        .trim(),
    (0, express_validator_1.check)("seo.openGraph.type", "Open Graph type must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.openGraph.url", "Open Graph URL must be a valid URL")
        .if((value) => value !== undefined && value !== null && value !== "")
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .trim(),
    (0, express_validator_1.check)("seo.openGraph.siteName", "Open Graph site name must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.twitterCard.cardType", "Twitter card type must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.twitterCard.site", "Twitter card site must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.twitterCard.creator", "Twitter card creator must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.twitterCard.title", "Twitter card title must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.twitterCard.description", "Twitter card description must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.twitterCard.image", "Twitter card image must be a valid URL")
        .if((value) => value !== undefined && value !== null && value !== "")
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .trim(),
    (0, express_validator_1.check)("seo.robotsText", "SEO robots text must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.schemaOrg", "SEO schema.org must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.bodyScript", "SEO body script must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.headerScript", "SEO header script must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.footerScript", "SEO footer script must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("seo.priority", "SEO priority must be a number between 0 and 1")
        .optional()
        .isFloat({ min: 0, max: 1 }),
    (0, express_validator_1.check)("seo.changeFrequency", "SEO change frequency must be valid")
        .optional()
        .isIn([
        "always",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "never",
    ]),
    (0, express_validator_1.check)("seo.redirect.type", "SEO redirect type must be '301', '302', or null")
        .optional()
        .isIn(["301", "302", null]),
    (0, express_validator_1.check)("seo.redirect.url", "SEO redirect URL must be a valid URL")
        .if((value) => value !== undefined && value !== null && value !== "")
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .trim(),
    // Blog Fields
    (0, express_validator_1.check)("category", "Category must be a valid MongoDB ID")
        .optional()
        .isMongoId(),
    (0, express_validator_1.check)("featuredImage", "Featured image must be a valid URL")
        .optional()
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .trim(),
    (0, express_validator_1.check)("postTitle", "Post title must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("postDescription", "Post description must be a string")
        .optional()
        .isString(),
    (0, express_validator_1.check)("slug", "Slug must be a valid string").optional().isString().trim(),
    (0, express_validator_1.check)("tags", "Tags must be an array of strings")
        .optional()
        .isArray()
        .custom((value) => {
        return value.every((tag) => typeof tag === "string" && tag.trim().length > 0);
    })
        .withMessage("Each tag must be a non-empty string"),
    (0, express_validator_1.check)("blogAuthor", "Blog author must be a valid MongoDB ID")
        .optional()
        .isMongoId(),
    (0, express_validator_1.check)("updatedBy", "Updated by must be a valid MongoDB ID")
        .optional()
        .isMongoId(),
    (0, express_validator_1.check)("status", "Status must be either 'publish' , 'draft' or 'scheduled")
        .optional()
        .isIn(["publish", "draft", "scheduled"]),
];
// ******************** Blog Categories ********************
exports.validateBlogCategoryCreate = [
    // parentCategory: Optional, must be a valid MongoDB ObjectID
    (0, express_validator_1.check)("parentCategory").optional(),
    // subCategories: Optional, must be an array of valid MongoDB ObjectIDs
    (0, express_validator_1.check)("subCategories")
        .optional()
        .isArray()
        .withMessage("Subcategories must be an array")
        .custom((value) => {
        if (value.length > 0) {
            return value.every((id) => mongoose_1.default.isValidObjectId(id));
        }
        return true;
    })
        .withMessage("All subcategory IDs must be valid MongoDB ObjectIDs"),
    (0, express_validator_1.check)("image").optional().trim(),
    // name: Required, string, max 100 characters, unique (handled by Mongoose)
    (0, express_validator_1.check)("name")
        .notEmpty()
        .withMessage("Name is required")
        .isString()
        .withMessage("Name must be a string")
        .isLength({ max: 100 })
        .withMessage("Name must not exceed 100 characters")
        .trim()
        .escape(),
    // slug: Required, string, max 100 characters, URL-friendly, unique (handled by Mongoose)
    (0, express_validator_1.check)("slug")
        .notEmpty()
        .withMessage("Slug is required")
        .isString()
        .withMessage("Slug must be a string")
        .isLength({ max: 100 })
        .withMessage("Slug must not exceed 100 characters")
        .trim()
        .toLowerCase(),
    // status: Optional, must be 'publish' or 'draft'
    (0, express_validator_1.check)("status")
        .optional()
        .isIn(["active", "inactive"])
        .withMessage("Status must be either 'active' or 'inactive'"),
];
exports.validateBlogCategoryUpdate = [
    // id: Required, must be a valid MongoDB ObjectID
    (0, express_validator_1.check)("id")
        .notEmpty()
        .withMessage("Category ID is required")
        .isMongoId()
        .withMessage("Category ID must be a valid MongoDB ObjectID"),
    // parentCategory: Optional, must be a valid MongoDB ObjectID
    (0, express_validator_1.check)("parentCategory").optional(),
    // subCategories: Optional, must be an array of valid MongoDB ObjectIDs
    (0, express_validator_1.check)("subCategories")
        .optional()
        .isArray()
        .withMessage("Subcategories must be an array")
        .custom((value) => {
        if (value.length > 0) {
            return value.every((id) => mongoose_1.default.isValidObjectId(id));
        }
        return true;
    })
        .withMessage("All subcategory IDs must be valid MongoDB ObjectIDs"),
    // image: Optional, must be a valid URL if provided
    (0, express_validator_1.check)("image")
        .optional()
        .isURL()
        .withMessage("Image must be a valid URL")
        .trim(),
    // name: Optional, string, max 100 characters
    (0, express_validator_1.check)("name")
        .optional()
        .isString()
        .withMessage("Name must be a string")
        .isLength({ max: 100 })
        .withMessage("Name must not exceed 100 characters")
        .trim()
        .escape(),
    // slug: Optional, string, max 100 characters, URL-friendly
    (0, express_validator_1.check)("slug")
        .optional()
        .isString()
        .withMessage("Slug must be a string")
        .isLength({ max: 100 })
        .withMessage("Slug must not exceed 100 characters")
        .trim()
        .toLowerCase(),
    // status: Optional, must be 'publish' or 'draft'
    (0, express_validator_1.check)("status")
        .optional()
        .isIn(["publish", "draft"])
        .withMessage("Status must be either 'publish' or 'draft'"),
    // blogs: Optional, must be an array of valid MongoDB ObjectIDs
    (0, express_validator_1.check)("blogs")
        .optional()
        .isArray()
        .withMessage("Blogs must be an array")
        .custom((value) => {
        if (value.length > 0) {
            return value.every((id) => mongoose_1.default.isValidObjectId(id));
        }
        return true;
    })
        .withMessage("All blog IDs must be valid MongoDB ObjectIDs"),
    // metaTitle: Optional, string, max 60 characters
    (0, express_validator_1.check)("metaTitle")
        .optional()
        .isString()
        .withMessage("Meta title must be a string")
        .isLength({ max: 60 })
        .withMessage("Meta title must not exceed 60 characters")
        .trim()
        .escape(),
    // metaDescription: Optional, string, max 160 characters
    (0, express_validator_1.check)("metaDescription")
        .optional()
        .isString()
        .withMessage("Meta description must be a string")
        .isLength({ max: 160 })
        .withMessage("Meta description must not exceed 160 characters")
        .trim()
        .escape(),
    // canonicalLink: Optional, must be a valid URL if provided
    (0, express_validator_1.check)("canonicalLink").optional().trim(),
    // updatedBy: Optional, must be a valid MongoDB ObjectID
    (0, express_validator_1.check)("updatedBy")
        .optional()
        .isMongoId()
        .withMessage("Updated by must be a valid MongoDB ObjectID"),
];
//  ********** Sevice Pages **********
exports.ValidateCreateService = [
    (0, express_validator_1.check)("metaTitle", "Meta Title is required").isString().trim(),
    (0, express_validator_1.check)("metaDescription", "Meta Description is required").isString().trim(),
    (0, express_validator_1.check)("canonicalLink", "Canonical Link is required").isString().trim(),
    (0, express_validator_1.check)("openGraphImage").optional().isString().trim(),
    (0, express_validator_1.check)("robotsText").optional().isString().trim(),
    (0, express_validator_1.check)("focusKeyword", "Focus Keyword is required").isString().trim(),
    (0, express_validator_1.check)("serviceName", "Service Name is required").isString().trim(),
    (0, express_validator_1.check)("slug", "Slug is required").isString().trim(),
    (0, express_validator_1.check)("colorScheme", "Color Scheme is requied").isString().trim(),
    (0, express_validator_1.check)("parentService").optional().isMongoId(),
    (0, express_validator_1.check)("status", "Status is required").isIn(["publish", "draft"]),
    (0, express_validator_1.check)("childServices").optional().isArray(),
    (0, express_validator_1.check)("childServices.*").isMongoId(),
    (0, express_validator_1.check)("bodyData").optional().isArray(),
    (0, express_validator_1.check)("bodyData.*").isObject(),
];
exports.ValidateUpdateService = [
    (0, express_validator_1.check)("metaTitle")
        .optional()
        .isString()
        .withMessage("Meta Title must be a string")
        .notEmpty()
        .withMessage("Meta Title cannot be empty")
        .trim(),
    (0, express_validator_1.check)("metaDescription")
        .optional()
        .isString()
        .withMessage("Meta Description must be a string")
        .notEmpty()
        .withMessage("Meta Description cannot be empty")
        .trim(),
    (0, express_validator_1.check)("canonicalLink")
        .optional()
        .isString()
        .withMessage("Canonical Link must be a string")
        .notEmpty()
        .withMessage("Canonical Link cannot be empty")
        .trim(),
    (0, express_validator_1.check)("openGraphImage")
        .optional()
        .isString()
        .withMessage("Open Graph Image must be a string")
        .trim(),
    (0, express_validator_1.check)("robotsText")
        .optional()
        .isString()
        .withMessage("Robots Text must be a string")
        .trim(),
    (0, express_validator_1.check)("focusKeyword")
        .optional()
        .isString()
        .withMessage("Focus Keyword must be a string")
        .notEmpty()
        .withMessage("Focus Keyword cannot be empty")
        .trim(),
    (0, express_validator_1.check)("serviceName")
        .optional()
        .isString()
        .withMessage("Service Name must be a string")
        .notEmpty()
        .withMessage("Service Name cannot be empty")
        .trim(),
    (0, express_validator_1.check)("slug")
        .optional()
        .isString()
        .withMessage("Slug must be a string")
        .notEmpty()
        .withMessage("Slug cannot be empty")
        .trim(),
    (0, express_validator_1.check)("colorScheme", "Color Scheme is required")
        .optional()
        .isString()
        .withMessage("Color Scheme must be a string")
        .notEmpty()
        .withMessage("Color Scheme cannot be empty")
        .trim(),
    (0, express_validator_1.check)("parentService")
        .optional()
        .isMongoId()
        .withMessage("Parent Service must be a valid Mongo ID"),
    (0, express_validator_1.check)("status")
        .optional()
        .isIn(["publish", "draft"])
        .withMessage("Status must be either 'publish' or 'draft'"),
    (0, express_validator_1.check)("childServices")
        .optional()
        .isArray()
        .withMessage("Child Services must be an array"),
    (0, express_validator_1.check)("childServices.*")
        .optional()
        .isMongoId()
        .withMessage("Each Child Service must be a valid Mongo ID"),
    (0, express_validator_1.check)("bodyData")
        .optional()
        .isArray()
        .withMessage("Body Data must be an array"),
    (0, express_validator_1.check)("bodyData.*")
        .optional()
        .isObject()
        .withMessage("Each Body Data entry must be an object"),
];
// ********** Case Studies **********
exports.validateCaseStudyUpdateCategory = [
    (0, express_validator_1.check)("categoryName", "Category name is required")
        .optional()
        .notEmpty()
        .isString()
        .trim(),
    (0, express_validator_1.check)("categorySlug", "Category slug is required")
        .optional()
        .notEmpty()
        .isString()
        .trim(),
    (0, express_validator_1.check)("technologies")
        .optional()
        .isArray()
        .withMessage("Technologies must be an array"),
    (0, express_validator_1.check)("technologies.*.icon", "Technology icon is required")
        .optional()
        .if((value, { req }) => req.body.technologies && req.body.technologies.length > 0)
        .notEmpty()
        .isString()
        .trim(),
    (0, express_validator_1.check)("technologies.*.name", "Technology name is required")
        .optional()
        .if((value, { req }) => req.body.technologies && req.body.technologies.length > 0)
        .notEmpty()
        .isString()
        .trim(),
    (0, express_validator_1.check)("caseStudies")
        .optional()
        .isArray()
        .withMessage("Case studies must be an array"),
    (0, express_validator_1.check)("caseStudies.*.caseStudyId", "Case study ID must be a valid Mongo ID")
        .optional()
        .if((value, { req }) => req.body.caseStudies && req.body.caseStudies.length > 0)
        .isMongoId(),
    (0, express_validator_1.check)("status", "Status must be a boolean").optional().isBoolean(),
];
// ************** Products *********************
exports.validateCreateProduct = [
    (0, express_validator_1.check)("featuredImage")
        .isString()
        .withMessage("Featured image URL is required")
        .notEmpty()
        .withMessage("Featured image URL should not be empty"),
    (0, express_validator_1.check)("name")
        .isString()
        .withMessage("Product name is required")
        .notEmpty()
        .withMessage("Product name should not be empty"),
    (0, express_validator_1.check)("description")
        .isString()
        .withMessage("Description is required")
        .optional(),
    (0, express_validator_1.check)("category")
        .isMongoId()
        .withMessage("Invalid category ID format")
        .notEmpty()
        .withMessage("Category is required"),
    (0, express_validator_1.check)("subCategory")
        .optional()
        .isMongoId()
        .withMessage("Invalid subCategory ID format")
        .notEmpty()
        .withMessage("Sub-Category is required"),
    (0, express_validator_1.check)("slug")
        .optional()
        .isString()
        .withMessage("Slug should be a string")
        .isLength({ max: 100 })
        .withMessage("Slug should not exceed 100 characters"),
    (0, express_validator_1.check)("pricePerUnit")
        .isNumeric()
        .withMessage("Price must be a number")
        .notEmpty()
        .withMessage("Price is required")
        .custom((value) => value >= 0)
        .withMessage("Price must be greater than or equal to 0"),
    (0, express_validator_1.check)("pricingType")
        .optional()
        .isIn(["perWord", "perPost", "perReview", "perMonth", "perQuantity"])
        .withMessage("Pricing type must be one of 'perWord', 'perPost', 'perReview', 'perMonth' or 'perQuantity'"),
    (0, express_validator_1.check)("stock")
        .optional()
        .isNumeric()
        .isInt()
        .withMessage("Stock must be an integer")
        .custom((value) => value >= 0)
        .withMessage("Stock must be greater than or equal to 0"),
    (0, express_validator_1.check)("images")
        .optional()
        .isArray()
        .withMessage("Images should be an array of strings"),
    (0, express_validator_1.check)("tags")
        .optional()
        .isArray()
        .withMessage("Tags should be an array of strings"),
    (0, express_validator_1.check)("priority")
        .optional()
        .isInt()
        .withMessage("Priority must be an integer"),
    (0, express_validator_1.check)("keywords")
        .optional()
        .isArray()
        .withMessage("Keywords should be an array of strings"),
    (0, express_validator_1.check)("formId").optional().isMongoId().withMessage("Invalid form ID format"),
    (0, express_validator_1.check)("metaTitle")
        .optional()
        .isString()
        .withMessage("Meta title should be a string"),
    (0, express_validator_1.check)("metaDescription")
        .optional()
        .isString()
        .withMessage("Meta description should be a string"),
    (0, express_validator_1.check)("canonicalLink")
        .optional()
        .isString()
        .withMessage("Canonical link should be a string"),
    (0, express_validator_1.check)("status")
        .optional()
        .isIn(["active", "inactive", "archived", "out of stock"])
        .withMessage("Status must be one of active, inactive, archived, or out of stock"),
    (0, express_validator_1.check)("isFeatured")
        .optional()
        .isBoolean()
        .withMessage("isFeatured must be a boolean"),
];
exports.validateUpdateProduct = [
    (0, express_validator_1.check)("featuredImage")
        .optional()
        .isString()
        .withMessage("Featured image URL must be a string")
        .notEmpty()
        .withMessage("Featured image URL should not be empty"),
    (0, express_validator_1.check)("name")
        .optional()
        .isString()
        .withMessage("Product name must be a string")
        .notEmpty()
        .withMessage("Product name should not be empty"),
    (0, express_validator_1.check)("description")
        .optional()
        .isString()
        .withMessage("Description must be a string")
        .notEmpty()
        .withMessage("Description should not be empty"),
    (0, express_validator_1.check)("userId").optional().isMongoId().withMessage("Invalid user ID format"),
    (0, express_validator_1.check)("formId").optional().isMongoId().withMessage("Invalid form ID format"),
    (0, express_validator_1.check)("category")
        .optional()
        .isMongoId()
        .withMessage("Invalid category ID format"),
    (0, express_validator_1.check)("subCategory")
        .optional()
        .isMongoId()
        .withMessage("Invalid subCategory ID format"),
    (0, express_validator_1.check)("slug")
        .optional()
        .isString()
        .withMessage("Slug should be a string")
        .isLength({ max: 100 })
        .withMessage("Slug should not exceed 100 characters"),
    (0, express_validator_1.check)("price")
        .optional()
        .isNumeric()
        .withMessage("Price must be a number")
        .custom((value) => value >= 0)
        .withMessage("Price must be greater than or equal to 0"),
    (0, express_validator_1.check)("quantity")
        .optional()
        .isNumeric()
        .withMessage("Quantity unit must be a number"),
    (0, express_validator_1.check)("pricingType")
        .optional()
        .isIn(["perWord", "perPost", "perReview", "perMonth", "perQuantity"])
        .withMessage("Pricing type must be one of 'perWord', 'perPost', 'perReview', 'perMonth' or 'perQuantity'"),
    (0, express_validator_1.check)("stock")
        .optional()
        .isInt()
        .withMessage("Stock must be an integer")
        .custom((value) => value >= 0)
        .withMessage("Stock must be greater than or equal to 0"),
    (0, express_validator_1.check)("images")
        .optional()
        .isArray()
        .withMessage("Images should be an array of strings"),
    (0, express_validator_1.check)("tags")
        .optional()
        .isArray()
        .withMessage("Tags should be an array of strings"),
    (0, express_validator_1.check)("priority")
        .optional()
        .isInt()
        .withMessage("Priority must be an integer"),
    (0, express_validator_1.check)("keywords")
        .optional()
        .isArray()
        .withMessage("Keywords should be an array of strings"),
    (0, express_validator_1.check)("status")
        .optional()
        .isIn(["active", "inactive", "archived", "out of stock"])
        .withMessage("Status must be one of active, inactive, archived, or out of stock"),
    (0, express_validator_1.check)("isFeatured")
        .optional()
        .isBoolean()
        .withMessage("isFeatured must be a boolean"),
];
exports.validateProductCreateCategory = [
    // parentCategory: Optional, must be a valid MongoDB ObjectID
    (0, express_validator_1.check)("parentCategory").optional(),
    // subCategories: Optional, must be an array of valid MongoDB ObjectIDs
    (0, express_validator_1.check)("subCategories")
        .optional()
        .isArray()
        .withMessage("Subcategories must be an array")
        .custom((value) => {
        if (value.length > 0) {
            return value.every((id) => mongoose_1.default.isValidObjectId(id));
        }
        return true;
    })
        .withMessage("All subcategory IDs must be valid MongoDB ObjectIDs"),
    (0, express_validator_1.check)("image").optional().trim(),
    // name: Required, string, max 100 characters, unique (handled by Mongoose)
    (0, express_validator_1.check)("name")
        .notEmpty()
        .withMessage("Name is required")
        .isString()
        .withMessage("Name must be a string")
        .isLength({ max: 100 })
        .withMessage("Name must not exceed 100 characters")
        .trim()
        .escape(),
    // slug: Required, string, max 100 characters, URL-friendly, unique (handled by Mongoose)
    (0, express_validator_1.check)("slug")
        .notEmpty()
        .withMessage("Slug is required")
        .isString()
        .withMessage("Slug must be a string")
        .isLength({ max: 100 })
        .withMessage("Slug must not exceed 100 characters")
        .trim()
        .toLowerCase(),
    // status: Optional, must be 'publish' or 'draft'
    (0, express_validator_1.check)("status")
        .optional()
        .isIn(["active", "inactive"])
        .withMessage("Status must be either 'active' or 'inactive'"),
];
exports.validateProductUpdateCategory = [
    (0, express_validator_1.check)("name")
        .optional()
        .isString()
        .withMessage("Category name is required")
        .notEmpty()
        .withMessage("Category name should not be empty"),
    (0, express_validator_1.check)("description")
        .optional()
        .isString()
        .withMessage("Description should be a string"),
    (0, express_validator_1.check)("parentCategory")
        .optional({ nullable: true })
        .isMongoId()
        .withMessage("Invalid parent category ID format"),
    (0, express_validator_1.check)("children")
        .optional()
        .isArray()
        .withMessage("Children should be an array of category IDs")
        .custom((value) => value.every((v) => mongoose_1.default.Types.ObjectId.isValid(v)))
        .withMessage("Each child category ID should be a valid ObjectId"),
    (0, express_validator_1.check)("products")
        .optional()
        .isArray()
        .withMessage("Products should be an array of product IDs")
        .custom((value) => value.every((v) => mongoose_1.default.Types.ObjectId.isValid(v)))
        .withMessage("Each product ID should be a valid ObjectId"),
    (0, express_validator_1.check)("slug")
        .optional()
        .isString()
        .withMessage("Slug should be a string")
        .isLength({ max: 100 })
        .withMessage("Slug should not exceed 100 characters"),
    (0, express_validator_1.check)("image")
        .optional()
        .isString()
        .withMessage("Image URL should be a string"),
    (0, express_validator_1.check)("metaTitle")
        .optional()
        .isString()
        .withMessage("Meta title should be a string"),
    (0, express_validator_1.check)("metaDescription")
        .optional()
        .isString()
        .withMessage("Meta description should be a string"),
    (0, express_validator_1.check)("canonicalLink")
        .optional()
        .isString()
        .withMessage("Canonical link should be a string"),
    (0, express_validator_1.check)("status")
        .optional()
        .isIn(["active", "inactive"])
        .withMessage("Status must be one of 'active' or 'inactive'"),
    (0, express_validator_1.check)("createdBy")
        .optional()
        .isMongoId()
        .withMessage("Invalid user ID format"),
    (0, express_validator_1.check)("updatedBy")
        .optional()
        .isMongoId()
        .withMessage("Invalid user ID format"),
];
// ******************** Tickets ********************
exports.validateCreateTicket = [
    (0, express_validator_1.body)("subject")
        .trim()
        .notEmpty()
        .withMessage("Subject is required")
        .isLength({ max: 100 })
        .withMessage("Subject must be less than 100 characters"),
    (0, express_validator_1.body)("description")
        .trim()
        .notEmpty()
        .withMessage("Description is required")
        .isLength({ max: 2000 })
        .withMessage("Description must be less than 2000 characters"),
    (0, express_validator_1.body)("priority")
        .optional()
        .isIn(Object.values(ticket_types_1.TicketPriority))
        .withMessage(`Priority must be one of: ${Object.values(ticket_types_1.TicketPriority).join(", ")}`),
    (0, express_validator_1.body)("customer").optional().isMongoId().withMessage("Invalid customer ID"),
    (0, express_validator_1.body)("assignedTo")
        .optional()
        .isMongoId()
        .withMessage("Invalid assigned user ID"),
];
exports.validateUpdateTicket = [
    (0, express_validator_1.body)("message")
        .if((0, express_validator_1.body)("message").exists())
        .trim()
        .notEmpty()
        .withMessage("Message cannot be empty if provided")
        .isLength({ max: 5000 })
        .withMessage("Message must be less than 5000 characters"),
    (0, express_validator_1.body)("status")
        .optional()
        .isIn(Object.values(ticket_types_1.TicketStatus))
        .withMessage(`Status must be one of: ${Object.values(ticket_types_1.TicketStatus).join(", ")}`),
    (0, express_validator_1.body)("priority")
        .optional()
        .isIn(Object.values(ticket_types_1.TicketPriority))
        .withMessage(`Priority must be one of: ${Object.values(ticket_types_1.TicketPriority).join(", ")}`),
];
// ******************** Case Studies ********************
exports.validateCaseStudyCategory = [
    (0, express_validator_1.check)("name", "Category name is required").notEmpty().isString().trim(),
    (0, express_validator_1.check)("slug", "Slug must be a valid string").optional().isString().trim(),
    (0, express_validator_1.check)("image", "Image must be a valid URL")
        .optional()
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .trim(),
    (0, express_validator_1.check)("parentCategory", "Parent category must be a valid MongoDB ID").optional(),
    (0, express_validator_1.check)("status", "Status must be either 'active' or 'inactive'")
        .optional()
        .isIn(["active", "inactive"]),
    (0, express_validator_1.check)("createdBy", "Created by must be a valid MongoDB ID")
        .optional()
        .isMongoId(),
];
exports.validateUpdateCaseStudyCategory = [
    (0, express_validator_1.check)("name", "Category name must be a string").optional().isString().trim(),
    (0, express_validator_1.check)("slug", "Slug must be a valid string").optional().isString().trim(),
    (0, express_validator_1.check)("metaTitle", "Meta title must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("metaDescription", "Meta description must be a string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("canonicalLink", "Canonical link must be a valid URL")
        .optional()
        .trim(),
    (0, express_validator_1.check)("image", "Image must be a valid URL")
        .optional()
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .trim(),
    (0, express_validator_1.check)("tags", "Tags must be an array of strings")
        .optional()
        .isArray()
        .custom((value) => {
        return value.every((tag) => typeof tag === "string" && tag.trim().length > 0);
    })
        .withMessage("Each tag must be a non-empty string"),
    (0, express_validator_1.check)("parentCategory", "Parent category must be a valid MongoDB ID").optional(),
    (0, express_validator_1.check)("status", "Status must be either 'active' or 'inactive'")
        .optional()
        .isIn(["active", "inactive"]),
    (0, express_validator_1.check)("updatedBy", "Updated by must be a valid MongoDB ID")
        .optional()
        .isMongoId(),
];
exports.validateCaseStudy = [
    // Case Study fields
    (0, express_validator_1.check)("name", "Case study name is required").notEmpty().isString().trim(),
    (0, express_validator_1.check)("slug", "Slug must be a valid string").optional().isString().trim(),
    (0, express_validator_1.check)("category", "Category must be a valid MongoDB ID")
        .optional()
        .isString(),
    (0, express_validator_1.check)("colorScheme", "Color scheme is required").notEmpty().isString().trim(),
    (0, express_validator_1.check)("status", "Status must be either 'active' or 'inactive'")
        .optional()
        .isIn(["active", "inactive"]),
    (0, express_validator_1.check)("bodyData", "Body data must be an array").optional().isArray(),
    (0, express_validator_1.check)("createdBy", "Created by must be a valid MongoDB ID").optional(),
    (0, express_validator_1.check)("updatedBy", "Updated by must be a valid MongoDB ID").optional(),
    // SEO fields
    (0, express_validator_1.body)("seo.metaTitle", "SEO meta title is required")
        .notEmpty()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.metaDescription", "SEO meta description is required")
        .notEmpty()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.canonicalLink", "SEO canonical link must be a valid string")
        .notEmpty()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.focusKeyword", "SEO focus keyword is required")
        .notEmpty()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.keywords", "SEO keywords must be an array of strings")
        .optional()
        .isArray()
        .custom((value) => {
        return value.every((keyword) => typeof keyword === "string" && keyword.trim().length > 0);
    })
        .withMessage("Each SEO keyword must be a non-empty string"),
    (0, express_validator_1.body)("seo.openGraph.title", "Open Graph title must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.openGraph.description", "Open Graph description must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.openGraph.image", "Open Graph image must be a valid URL")
        .optional()
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .trim(),
    (0, express_validator_1.body)("seo.openGraph.type", "Open Graph type must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.openGraph.url", "Open Graph URL must be a valid URL")
        .optional()
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .trim(),
    (0, express_validator_1.body)("seo.openGraph.siteName", "Open Graph site name must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.twitterCard.cardType", "Twitter card type must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.twitterCard.site", "Twitter card site must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.twitterCard.creator", "Twitter card creator must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.twitterCard.title", "Twitter card title must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.twitterCard.description", "Twitter card description must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.twitterCard.image", "Twitter card image must be a valid URL")
        .optional()
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .trim(),
    (0, express_validator_1.body)("seo.robotsText", "SEO robots text is required")
        .notEmpty()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.schemaOrg", "SEO schema.org must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.bodyScript", "SEO body script must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.headerScript", "SEO header script must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.footerScript", "SEO footer script must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.priority", "SEO priority must be a number between 0 and 1")
        .optional()
        .isFloat({ min: 0, max: 1 }),
    (0, express_validator_1.body)("seo.changeFrequency", "SEO change frequency must be a valid value")
        .optional()
        .isIn([
        "always",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "never",
    ]),
    (0, express_validator_1.body)("seo.lastModified", "SEO last modified must be a valid date")
        .optional()
        .isISO8601()
        .toDate(),
    (0, express_validator_1.body)("seo.redirect.type", "SEO redirect type must be '301', '302', or null")
        .optional()
        .isIn(["301", "302", null]),
    (0, express_validator_1.body)("seo.redirect.url", "SEO redirect URL must be a valid string")
        .optional()
        .isString()
        .trim(),
];
exports.validateUpdateCaseStudy = [
    // Case Study fields
    (0, express_validator_1.check)("id", "Case study ID is required").notEmpty().isMongoId(),
    (0, express_validator_1.check)("name", "Case study name must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("slug", "Slug must be a valid string").optional().isString().trim(),
    (0, express_validator_1.check)("category", "Category must be a valid MongoDB ID").optional(),
    (0, express_validator_1.check)("colorScheme", "Color scheme must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.check)("status", "Status must be either 'active' or 'inactive'")
        .optional()
        .isIn(["active", "inactive"]),
    (0, express_validator_1.check)("bodyData", "Body data must be an array").optional().isArray(),
    (0, express_validator_1.check)("updatedBy", "Updated by must be a valid MongoDB ID").optional(),
    // SEO fields (all optional for updates)
    (0, express_validator_1.body)("seo.metaTitle", "SEO meta title must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.metaDescription", "SEO meta description must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.canonicalLink", "SEO canonical link must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.focusKeyword", "SEO focus keyword must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.keywords", "SEO keywords must be an array of strings")
        .optional()
        .isArray()
        .custom((value) => {
        return value.every((keyword) => typeof keyword === "string" && keyword.trim().length > 0);
    })
        .withMessage("Each SEO keyword must be a non-empty string"),
    (0, express_validator_1.body)("seo.openGraph.title", "Open Graph title must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.openGraph.description", "Open Graph description must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.openGraph.image", "Open Graph image must be a valid URL")
        .optional()
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .trim(),
    (0, express_validator_1.body)("seo.openGraph.type", "Open Graph type must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.openGraph.url", "Open Graph URL must be a valid URL")
        .optional()
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .trim(),
    (0, express_validator_1.body)("seo.openGraph.siteName", "Open Graph site name must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.twitterCard.cardType", "Twitter card type must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.twitterCard.site", "Twitter card site must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.twitterCard.creator", "Twitter card creator must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.twitterCard.title", "Twitter card title must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.twitterCard.description", "Twitter card description must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.twitterCard.image", "Twitter card image must be a valid URL")
        .optional()
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .trim(),
    (0, express_validator_1.body)("seo.robotsText", "SEO robots text must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.schemaOrg", "SEO schema.org must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.bodyScript", "SEO body script must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.headerScript", "SEO header script must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.footerScript", "SEO footer script must be a valid string")
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.body)("seo.priority", "SEO priority must be a number between 0 and 1")
        .optional()
        .isFloat({ min: 0, max: 1 }),
    (0, express_validator_1.body)("seo.changeFrequency", "SEO change frequency must be a valid value")
        .optional()
        .isIn([
        "always",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "never",
    ]),
    (0, express_validator_1.body)("seo.lastModified", "SEO last modified must be a valid date")
        .optional()
        .isISO8601()
        .toDate(),
    (0, express_validator_1.body)("seo.redirect.type", "SEO redirect type must be '301', '302', or null")
        .optional()
        .isIn(["301", "302", null]),
    (0, express_validator_1.body)("seo.redirect.url", "SEO redirect URL must be a valid string")
        .optional()
        .isString()
        .trim(),
];
exports.validateDeleteCaseStudy = [
    (0, express_validator_1.query)("id", "Case study ID is required").notEmpty().isMongoId(),
];
