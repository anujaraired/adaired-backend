// import * as dotenv from "dotenv";
// import serverless from "serverless-http";
// import app from "../src/app";
// import { connectDB } from "../src/database/connectDB";

// dotenv.config();

// let isConnected = false;
// const handler = serverless(app);

// export default async function vercelHandler(req: any, res: any) {
//   if (!isConnected) {
//     await connectDB();
//     isConnected = true;
//   }
//   return handler(req, res);
// }

import serverless from "serverless-http";
import app from "../src/app";
import { connectDB } from "../src/database/connectDB";

const handler = serverless(app);

export default async function handlerFn(req: any, res: any) {
  console.log("➡️ Request:", req.method, req.url);

  console.log("🔧 Initializing MongoDB connection...");
  await connectDB();
  console.log("✅ MongoDB ready");

  return handler(req, res);
}
