"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const blog_model_1 = __importDefault(require("../models/blog.model"));
// Schedule a cron job to run every minute to check for blogs to publish
const scheduleBlogs = () => {
    const task = node_cron_1.default.schedule("* * * * *", async () => {
        try {
            const now = new Date();
            // Find blogs that are scheduled and their publish date is in the past
            const blogsToPublish = await blog_model_1.default.find({
                status: "scheduled",
                scheduledPublishDate: { $lte: now },
            });
            // Update each blog to "publish" status
            for (const blog of blogsToPublish) {
                await blog_model_1.default.findByIdAndUpdate(blog._id, {
                    status: "publish",
                    scheduledPublishDate: null,
                }, { new: true });
                console.log(`Blog "${blog.postTitle}" published successfully.`);
            }
        }
        catch (error) {
            console.error("Error in scheduled blog publishing:", error.message);
        }
    }, {
        scheduled: true,
        timezone: "UTC",
    });
    // Start the cron job
    task.start();
    console.log("Blog scheduling cron job started.");
};
// Start the cron job when the server starts
scheduleBlogs();
exports.default = scheduleBlogs;
