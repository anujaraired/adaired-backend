import * as dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./database/connectDB";

dotenv.config();

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Local server running on http://localhost:${PORT}`);
  });
}

start();
