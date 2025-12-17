"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedRoles = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const role_model_1 = __importDefault(require("../models/role.model"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
const seedRoles = async () => {
    try {
        // Check if the Customer role already exists
        const customerRole = await role_model_1.default.findOne({ name: "customer" }).lean();
        if (!customerRole) {
            await role_model_1.default.create({
                name: "customer",
                description: "Default role for customers",
                status: true,
                permissions: [],
                users: [],
            });
            console.log("Customer role created successfully");
        }
        else {
            console.log("Customer role already exists");
        }
    }
    catch (error) {
        console.error("Error seeding roles:", error);
        throw error;
    }
};
exports.seedRoles = seedRoles;
// Execute seeding if run as a standalone script
if (require.main === module) {
    const runSeed = async () => {
        try {
            await mongoose_1.default.connect(process.env.MONGODB_URI);
            console.log("Connected to MongoDB");
            await (0, exports.seedRoles)();
            console.log("Seeding completed");
        }
        catch (error) {
            console.error("Seeding failed:", error);
        }
        finally {
            await mongoose_1.default.disconnect();
            console.log("Disconnected from MongoDB");
        }
    };
    runSeed();
}
exports.default = exports.seedRoles;
