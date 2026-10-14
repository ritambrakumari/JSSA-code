import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load backend .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import Attendance from "../models/Attendance.js";

async function run() {
  try {
    console.log("Connecting to database...", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully!");

    // Fetch the 10 most recent attendance records
    const records = await Attendance.find().sort({ createdAt: -1 }).limit(10);
    console.log("Found records:", JSON.stringify(records, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error executing script:", error);
  }
}

run();
