import * as dotenv from "dotenv";
import serverless from "serverless-http";
import app from "../src/app";
import { connectDB } from "../src/database/connectDB";

dotenv.config();

let isConnected = false;
const handler = serverless(app);

export default async function vercelHandler(req: any, res: any) {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return handler(req, res);
}
