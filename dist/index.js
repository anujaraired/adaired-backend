"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const connectDB_1 = require("./database/connectDB");
const error_1 = require("./middlewares/error");
const seedRoles_1 = require("./scripts/seedRoles");
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
// Routers Import
const multer_routes_1 = __importDefault(require("./routes/multer.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const role_routes_1 = __importDefault(require("./routes/role.routes"));
const permission_module_routes_1 = __importDefault(require("./routes/permission-module.routes"));
const blog_routes_1 = __importDefault(require("./routes/blog.routes"));
const blog_category_routes_1 = __importDefault(require("./routes/blog-category.routes"));
const case_study_routes_1 = __importDefault(require("./routes/case-study.routes"));
const case_study_category_routes_1 = __importDefault(require("./routes/case-study-category.routes"));
const service_routes_1 = __importDefault(require("./routes/service.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const form_routes_1 = __importDefault(require("./routes/form.routes"));
const product_category_routes_1 = __importDefault(require("./routes/product-category.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const coupon_routes_1 = __importDefault(require("./routes/coupon.routes"));
const ticket_routes_1 = __importDefault(require("./routes/ticket.routes"));
const invoices_routes_1 = __importDefault(require("./routes/invoices.routes"));
const static_pages_seo_routes_1 = __importDefault(require("./routes/static-pages-seo.routes"));
const mail_routes_1 = __importDefault(require("./routes/mail.routes"));
const empty_cart_1 = require("./cron-jobs/empty-cart");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
const basePath = "/api/v2";
// CORS Middleware
const allowedOrigins = [
    "https://rwf4p3bf-3000.inc1.devtunnels.ms",
    "https://dashboard-adaired.vercel.app",
    "https://ad-admin-five.vercel.app",
    "https://www.adaired.com",
    "https://adaired.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
];
// ========================
// 🛡️ Security Middleware
// ========================
app.use((0, helmet_1.default)()); // Security headers
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || allowedOrigins,
    credentials: true,
    maxAge: 86400, // 24h CORS preflight cache
}));
// ========================
// ⚡ Performance Optimizations
// ========================
app.use((req, res, next) => {
    if (req.originalUrl === "/api/v2/orders/stripe-webhook") {
        // Skip JSON parsing for Stripe webhook
        next();
    }
    else {
        express_1.default.json()(req, res, next);
    }
});
app.use(express_1.default.urlencoded({ extended: false }));
// Ping Endpoint (minimal response)
app.get(`${basePath}/ping`, (req, res) => {
    res.send("pong 🏓");
});
app.use(`${basePath}/multer`, multer_routes_1.default);
app.use(`${basePath}/auth`, auth_routes_1.default);
app.use(`${basePath}/user`, user_routes_1.default);
app.use(`${basePath}/role`, role_routes_1.default);
app.use(`${basePath}/permission-module`, permission_module_routes_1.default);
app.use(`${basePath}/blog`, blog_routes_1.default);
app.use(`${basePath}/blog-category`, blog_category_routes_1.default);
app.use(`${basePath}/case-study`, case_study_routes_1.default);
app.use(`${basePath}/case-study/category`, case_study_category_routes_1.default);
app.use(`${basePath}/service`, service_routes_1.default);
app.use(`${basePath}/product`, product_routes_1.default);
app.use(`${basePath}/product/form`, form_routes_1.default);
app.use(`${basePath}/product/category`, product_category_routes_1.default);
app.use(`${basePath}/cart`, cart_routes_1.default);
app.use(`${basePath}/orders`, order_routes_1.default);
app.use(`${basePath}/coupons`, coupon_routes_1.default);
app.use(`${basePath}/tickets`, ticket_routes_1.default);
app.use(`${basePath}/invoices`, invoices_routes_1.default);
app.use(`${basePath}/page-seo`, static_pages_seo_routes_1.default);
app.use(`${basePath}/mail`, mail_routes_1.default);
// Static files and View Engine
app.use("/static", express_1.default.static(path_1.default.join(__dirname + "static")));
app.set("view engine", "ejs");
app.set("views", path_1.default.join(__dirname, "views"));
// Root Route
app.get(`${basePath}/`, (req, res) => {
    res.render("index");
});
// ========================
// 🛑 Error Handling
// ========================
app.use(error_1.errorHandler);
// ========================
// ⏱️ Startup & Shutdown
// ========================
// const startServer = async () => {
//   try {
//     console.log("🔧 Initializing MongoDB connection...");
//     // Connect to DB first
//     await connectDB();
//     // Seed roles during startup if enabled
//     if (process.env.SEED_ON_STARTUP === "true") {
//       await seedRoles();
//     }
//     // Start server
//     const server = app.listen(PORT, () => {
//       console.log(`🚀 Server running on port ${PORT}`);
//     });
//     // Start background jobs
//     emptyCartJob.start();
//     scheduleBlogs();
//     console.log("⏱️ Cron jobs initialized");
//     return server;
//   } catch (error) {
//     console.error("🔥 Failed to start server:", error);
//     process.exit(1);
//   }
// };
app.listen(PORT, async () => {
    try {
        console.log("🔧 Initializing MongoDB connection...");
        await (0, connectDB_1.connectDB)();
        // Seed roles during startup if enabled
        if (process.env.SEED_ON_STARTUP === "true") {
            await (0, seedRoles_1.seedRoles)();
        }
        console.log(`🚀 Server running on port ${PORT}`);
    }
    catch (error) {
        console.error("🔥 Failed to start server:", error);
        process.exit(1);
    }
});
// Graceful shutdown
const shutdown = async () => {
    console.log("\n🛑 Graceful shutdown initiated...");
    try {
        empty_cart_1.emptyCartJob.stop();
        await (0, connectDB_1.closeDB)();
        console.log("✅ Server shutdown complete");
        process.exit(0);
    }
    catch (err) {
        console.error("❌ Graceful shutdown failed:", err);
        process.exit(1);
    }
};
// process.on("SIGINT", shutdown); // Ctrl+C
// process.on("SIGTERM", shutdown); // Kubernetes/Docker stop
// Start the server
