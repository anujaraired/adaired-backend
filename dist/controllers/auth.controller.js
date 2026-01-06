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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyUser = exports.sendVerificationEmail = exports.resetPassword = exports.forgotPassword = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const globals_1 = require("../utils/globals");
const user_model_1 = __importDefault(require("../models/user.model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const error_1 = require("../middlewares/error");
const cartModel_1 = __importDefault(require("../models/cartModel"));
const mailer_1 = require("../utils/mailer");
const validateInput_1 = require("../utils/validateInput");
const role_model_1 = __importDefault(require("../models/role.model"));
const crypto_1 = __importDefault(require("crypto"));
// Token generation utilities
const generateAccessToken = (userId) => jsonwebtoken_1.default.sign({ _id: userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
});
const generateRefreshToken = (userId) => jsonwebtoken_1.default.sign({ _id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "30d",
});
// Utility to generate random secure password
const generateRandomPassword = () => {
    return crypto_1.default.randomBytes(16).toString("hex");
};
// ***************************************
// ********** Register User **************
// ***************************************
const register = async (req, res, next) => {
    try {
        const { image, name, email, password, role, contact, status, googleId } = req.body;
        // Validate user input
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        // Check if required fields are present
        if (!name || !email) {
            throw new error_1.CustomError(400, "Name and Email are required");
        }
        // Check for existing user with lean for speed
        if (await user_model_1.default.findOne({
            $or: [{ email }, { userName: email.split("@")[0].toLowerCase() }],
        }).lean()) {
            throw new error_1.CustomError(400, "User with this email or username already exists");
        }
        // Handle password for Google and regular users
        let hashedPassword;
        let randomPassword;
        if (googleId) {
            // For Google users, generate a random secure password
            randomPassword = generateRandomPassword();
            hashedPassword = await bcrypt_1.default.hash(randomPassword, 10);
        }
        else if (password) {
            // For regular users, use provided password
            hashedPassword = await bcrypt_1.default.hash(password, 10);
        }
        else {
            throw new error_1.CustomError(400, "Password or Google ID required");
        }
        // Create user with all fields in one go
        const user = new user_model_1.default({
            name,
            email: email.toLowerCase(),
            userName: email.split("@")[0].toLowerCase(),
            ...(image && { image }),
            ...(hashedPassword && { password: hashedPassword }),
            ...(contact && { contact }),
            ...(status && { status }),
            ...(googleId && { googleId }),
            isVerifiedUser: googleId ? true : false,
        });
        // Set admin status for first user
        const userCount = await user_model_1.default.countDocuments();
        if (userCount === 0) {
            user.isAdmin = true;
            user.role = null;
        }
        else {
            // Assign role: Use provided role or default to "Customer"
            let assignedRoleId = role;
            if (!role) {
                const defaultRole = await role_model_1.default.findOne({ name: "customer" }).lean();
                if (!defaultRole) {
                    throw new error_1.CustomError(404, "Default Customer role not found");
                }
                assignedRoleId = defaultRole._id;
            }
            const roleDoc = await role_model_1.default.findById(assignedRoleId);
            if (!roleDoc) {
                throw new error_1.CustomError(404, "Role not found");
            }
            user.role = roleDoc._id;
            roleDoc.users.push(user._id);
            await roleDoc.save();
        }
        // Create cart and assign in one operation
        const cart = new cartModel_1.default({
            userId: user._id,
            products: [],
            totalQuantity: 0,
            totalPrice: 0,
        });
        user.cart = cart._id;
        // Generate tokens
        const accessToken = generateAccessToken(user._id.toString());
        const refreshToken = generateRefreshToken(user._id.toString());
        user.refreshToken = refreshToken;
        // Save user and cart in parallel
        await Promise.all([user.save(), cart.save()]);
        // Handle email sending based on registration type
        if (googleId && randomPassword) {
            // Send email with random password for Google users
            (0, mailer_1.sendEmail)(user.email, "Your Account Password", `<p>Hi ${user.name},</p><p>Your account has been created using Google authentication.</p><p>You can also login using your username or email with this password: <strong>${randomPassword}</strong></p><p>Please store this password securely.</p>`).catch((err) => console.error("Email sending failed:", err));
        }
        else {
            // Send verification email for regular users
            sendVerificationEmail(user._id.toString()).catch((err) => console.error("Email sending failed:", err));
        }
        res.status(201).json({
            message: "User registered successfully",
            accessToken,
            refreshToken,
            user,
        });
    }
    catch (error) {
        next(new error_1.CustomError(500, error.message));
    }
};
exports.register = register;
// ***************************************
// ************* Login User **************
// ***************************************
// const login = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { identifier, password, googleId } = req.body;
//     // Validate user input
//     if (!validateInput(req, res)) return;
//     // Fetch user with password and lean for speed
//     let user;
//     if (googleId) {
//       // Google login
//       user = await User.findOne({ googleId }).select("+password").lean();
//       if (!user) {
//         throw new CustomError(400, "User with this Google ID does not exist.");
//       }
//     } else {
//       // Email/username login
//       if (!identifier || !password) {
//         throw new CustomError(400, "Identifier and password are required.");
//       }
//       user = await User.findOne({
//         $or: [{ email: identifier }, { userName: identifier }],
//       })
//         .select("+password")
//         .lean();
//       if (!user) {
//         throw new CustomError(
//           400,
//           "User with this email or username does not exist."
//         );
//       }
//       // Verify password
//       if (!user.password || !(await bcrypt.compare(password, user.password))) {
//         throw new CustomError(401, "Incorrect Password!");
//       }
//     }
//     // Generate tokens
//     const accessToken = generateAccessToken(user._id.toString());
//     const refreshToken =
//       user.refreshToken &&
//       jwt.verify(user.refreshToken, process.env.JWT_REFRESH_SECRET as string)
//         ? user.refreshToken
//         : generateRefreshToken(user._id.toString());
//     // Update refresh token if necessary (minimal DB write)
//     if (refreshToken !== user.refreshToken) {
//       await User.updateOne({ _id: user._id }, { refreshToken });
//     }
//     // Fetch user data with role in one query
//     const userData = await User.findById(user._id)
//       .populate("role", "name permissions")
//       .lean();
//     // Extract expiresAt from JWT
//     const decodedToken = jwt.decode(accessToken) as JwtPayload;
//     if (!decodedToken.exp) throw new Error("Token has no expiration");
//     const expiresAt = new Date(decodedToken.exp * 1000);
//     res.status(200).json({
//       message: "Login successful",
//       accessToken,
//       refreshToken,
//       user: userData,
//       expiresAt: expiresAt,
//     });
//   } catch (error) {
//     next(
//       error instanceof CustomError
//         ? error
//         : new CustomError(500, "Login failed")
//     );
//   }
// };
// const login = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { identifier, password, googleId } = req.body;
//     // Validate user input
//     if (!validateInput(req, res)) return;
//     // Fetch user with password and role
//     let user;
//     if (googleId) {
//       user = await User.findOne({ googleId })
//         .select("+password")
//         .populate("role", "name permissions")
//         .lean();
//       if (!user) {
//         throw new CustomError(400, "User with this Google ID does not exist.");
//       }
//     } else {
//       if (!identifier || !password) {
//         throw new CustomError(400, "Identifier and password are required.");
//       }
//       user = await User.findOne({
//         $or: [
//           { email: identifier.trim().toLowerCase() },
//           { userName: identifier.trim().toLowerCase() },
//         ],
//       })
//         .select("+password")
//         .populate("role", "name permissions")
//         .lean();
//       if (!user) {
//         throw new CustomError(
//           400,
//           "User with this email or username does not exist."
//         );
//       }
//       // Verify password
//       if (!user.password || !(await bcrypt.compare(password, user.password))) {
//         throw new CustomError(401, "Incorrect Password!");
//       }
//     }
//     // Generate tokens
//     const accessToken = generateAccessToken(user._id.toString());
//     let refreshToken = null;
//     if (user.refreshToken) {
//       try {
//         const verified = jwt.verify(
//           user.refreshToken,
//           process.env.JWT_REFRESH_SECRET as string
//         );
//         refreshToken = user.refreshToken;
//       } catch (error) {
//         console.error("jwt.verify error:", error);
//         refreshToken = generateRefreshToken(user._id.toString());
//       }
//     } else {
//       refreshToken = generateRefreshToken(user._id.toString());
//     }
//     // Update refresh token if necessary
//     if (refreshToken !== user.refreshToken) {
//       try {
//         await User.updateOne({ _id: user._id }, { refreshToken });
//       } catch (error) {
//         console.error("Failed to update refresh token:", error);
//         throw new CustomError(500, "Failed to update refresh token");
//       }
//     }
//     // Extract expiresAt from JWT
//     const decodedToken = jwt.decode(accessToken) as JwtPayload;
//     if (!decodedToken.exp) throw new Error("Token has no expiration");
//     const expiresAt = new Date(decodedToken.exp * 1000);
//     res.status(200).json({
//       message: "Login successful",
//       accessToken,
//       refreshToken,
//       user,
//       expiresAt,
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     next(
//       error instanceof CustomError
//         ? error
//         : new CustomError(500, "Login failed")
//     );
//   }
// };
// import jwt, { TokenExpiredError, JwtPayload } from "jsonwebtoken";
const login = async (req, res, next) => {
    try {
        const { identifier, password, googleId } = req.body;
        // Validate user input
        if (!(0, validateInput_1.validateInput)(req, res))
            return;
        // Fetch user with password and role
        let user;
        if (googleId) {
            user = await user_model_1.default.findOne({ googleId })
                .select("+password +refreshToken")
                .populate("role", "name permissions")
                .lean();
            if (!user) {
                throw new error_1.CustomError(400, "User with this Google ID does not exist.");
            }
        }
        else {
            if (!identifier || !password) {
                throw new error_1.CustomError(400, "Identifier and password are required.");
            }
            user = await user_model_1.default.findOne({
                $or: [
                    { email: identifier.trim().toLowerCase() },
                    { userName: identifier.trim().toLowerCase() },
                ],
            })
                .select("+password +refreshToken")
                .populate("role", "name permissions")
                .lean();
            if (!user) {
                throw new error_1.CustomError(400, "User with this email or username does not exist.");
            }
            // Verify password
            if (!user.password || !(await bcrypt_1.default.compare(password, user.password))) {
                throw new error_1.CustomError(401, "Incorrect Password!");
            }
        }
        // Generate access token
        const accessToken = generateAccessToken(user._id.toString());
        let refreshToken = user.refreshToken;
        // Handle refresh token validation
        const jwtSecret = process.env.JWT_REFRESH_SECRET;
        let refreshTokenValid = false;
        if (refreshToken) {
            try {
                jsonwebtoken_1.default.verify(refreshToken, jwtSecret);
                refreshTokenValid = true;
            }
            catch (err) {
                if (err instanceof jsonwebtoken_1.TokenExpiredError) {
                    console.warn("Refresh token expired, generating a new one.");
                }
                else {
                    console.warn("Invalid refresh token:", err.message);
                }
                // In both cases, generate a new one
                refreshToken = generateRefreshToken(user._id.toString());
            }
        }
        else {
            // If no token exists, create one
            refreshToken = generateRefreshToken(user._id.toString());
        }
        // Update refresh token in DB if changed
        if (!refreshTokenValid || refreshToken !== user.refreshToken) {
            try {
                await user_model_1.default.updateOne({ _id: user._id }, { refreshToken });
            }
            catch (err) {
                console.error("Failed to update refresh token:", err);
                throw new error_1.CustomError(500, "Failed to update refresh token");
            }
        }
        // Decode access token to extract expiry time
        const decodedToken = jsonwebtoken_1.default.decode(accessToken);
        if (!decodedToken.exp)
            throw new Error("Token has no expiration");
        const expiresAt = new Date(decodedToken.exp * 1000);
        res.status(200).json({
            message: "Login successful",
            accessToken,
            refreshToken,
            user,
            expiresAt,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        next(error instanceof error_1.CustomError
            ? error
            : new error_1.CustomError(500, "Login failed"));
    }
};
exports.login = login;
// ***************************************
// ********** Refresh Token **************
// ***************************************
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new error_1.CustomError(401, "No token provided");
        }
        // Verify the refresh token
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await user_model_1.default.findById(decoded._id).select("refreshToken").lean();
        if (!user || user.refreshToken !== refreshToken) {
            throw new error_1.CustomError(401, "Invalid refresh token");
        }
        // Generate new tokens
        const newAccessToken = generateAccessToken(user._id.toString());
        const newRefreshToken = generateRefreshToken(user._id.toString());
        // Update refresh token in one operation
        await user_model_1.default.updateOne({ _id: user._id }, { refreshToken: newRefreshToken });
        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    }
    catch (error) {
        next(error instanceof error_1.CustomError
            ? error
            : new error_1.CustomError(500, "Token refresh failed"));
    }
};
exports.refreshToken = refreshToken;
// ***************************************
// ************ Logout User **************
// ***************************************
const logout = async (req, res, next) => {
    try {
        const { userId } = req;
        // Clear refresh token in one update
        await user_model_1.default.updateOne({ _id: userId }, { refreshToken: null });
        res.status(200).json({ message: "User logged out successfully" });
    }
    catch (error) {
        next(error instanceof error_1.CustomError
            ? error
            : new error_1.CustomError(500, "Logout failed"));
    }
};
exports.logout = logout;
// ***************************************
// ********** Forgot Password ************
// ***************************************
const forgotPassword = async (req, res, next) => {
    try {
        const { identifier } = req.body;
        const user = await user_model_1.default.findOne({
            $or: [{ email: identifier }, { userName: identifier }],
        })
            .select("name email")
            .lean();
        if (!user) {
            throw new error_1.CustomError(404, "User not found");
        }
        const resetToken = jsonwebtoken_1.default.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "10m" } // Token expires in 10 minutes
        );
        const resetLink = `${globals_1.BASE_DOMAIN}/auth/reset-password?token=${resetToken}`;
        // Send email asynchronously
        (0, mailer_1.sendEmail)(user.email, "Password Reset", `<p>Hi ${user.name},</p><p>Please click the link below to reset your password:</p><a href="${resetLink}">Reset Password</a>`).catch((err) => console.error("Email sending failed:", err));
        res.status(200).json({ message: "Password reset link sent successfully" });
    }
    catch (error) {
        next(error instanceof error_1.CustomError
            ? error
            : new error_1.CustomError(500, "Password reset failed"));
    }
};
exports.forgotPassword = forgotPassword;
// ***************************************
// ********** Reset Password *************
// ***************************************
const resetPassword = async (req, res, next) => {
    try {
        const { userId } = req;
        const { currentPassword, newPassword, resetToken } = req.body;
        let user;
        if (userId) {
            // Logged-in user resetting password
            user = await user_model_1.default.findById(userId).select("+password");
            if (!user)
                throw new error_1.CustomError(404, "User not found");
            if (!currentPassword ||
                !(await bcrypt_1.default.compare(currentPassword, user.password))) {
                throw new error_1.CustomError(400, "Current password is incorrect");
            }
            // Check if newPassword is the same as currentPassword
            if (await bcrypt_1.default.compare(newPassword, user.password)) {
                throw new error_1.CustomError(400, "New password cannot be the same as the current password");
            }
        }
        else if (resetToken) {
            // Reset via token
            const decoded = jsonwebtoken_1.default.verify(resetToken, process.env.JWT_SECRET);
            user = await user_model_1.default.findOne({ email: decoded.email });
            if (!user)
                throw new error_1.CustomError(404, "User not found");
        }
        else {
            throw new error_1.CustomError(400, "Missing userId or resetToken");
        }
        // Hash new password
        user.password = await bcrypt_1.default.hash(newPassword, 10);
        user.refreshToken = null; // Invalidate refresh token
        await user.save();
        res.status(200).json({ message: "Password reset successfully" });
    }
    catch (error) {
        next(error instanceof error_1.CustomError
            ? error
            : new error_1.CustomError(500, "Password reset failed"));
    }
};
exports.resetPassword = resetPassword;
// ***************************************
// ****** Send Verification Email ********
// ***************************************
const sendVerificationEmail = async (userId) => {
    const user = await user_model_1.default.findById(userId)
        .select("name email isVerifiedUser")
        .lean();
    if (!user)
        throw new error_1.CustomError(404, "User not found");
    if (user.isVerifiedUser)
        throw new error_1.CustomError(400, "User already verified");
    const verificationToken = jsonwebtoken_1.default.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: "10m",
    });
    const verificationLink = `${globals_1.BASE_DOMAIN}/auth/verify?token=${verificationToken}`;
    await (0, mailer_1.sendEmail)(user.email, "Verify Your Email", `<p>Hi ${user.name},</p><p>Please verify your email by clicking the link below:</p><a href="${verificationLink}">Verify Email</a><p>This link will expire in 10 minutes.</p>`);
};
exports.sendVerificationEmail = sendVerificationEmail;
// ***************************************
// *********** Verify Email **************
// ***************************************
const verifyUser = async (req, res, next) => {
    try {
        const { token } = req.query;
        if (!token)
            throw new error_1.CustomError(400, "Verification token required");
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await user_model_1.default.findOne({ email: decoded.email });
        if (!user)
            throw new error_1.CustomError(404, "User not found");
        if (user.isVerifiedUser)
            throw new error_1.CustomError(400, "User already verified");
        user.isVerifiedUser = true;
        await user.save();
        res.status(200).json({
            message: "User verified successfully. You can now close this tab.",
        });
    }
    catch (error) {
        if (error instanceof Error && error.name === "TokenExpiredError") {
            next(new error_1.CustomError(400, "Verification token has expired."));
        }
        else if (error instanceof Error) {
            next(new error_1.CustomError(500, error.message));
        }
    }
};
exports.verifyUser = verifyUser;
