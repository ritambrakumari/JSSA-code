import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

import Employee from "./models/Employee.js";
import User from "./models/User.js";

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const praveen = await Employee.findOne({ name: /Praveen Kumar Soni/i }).lean();
  if (praveen) {
    console.log("Found Employee:", praveen.name, "| Role:", praveen.role, "| District:", praveen.workingDistrict);
    const user = await User.findById(praveen.userId).lean();
    console.log("User Phone:", user?.phone);
  } else {
    console.log("Praveen Kumar Soni not found in DB");
  }
  process.exit();
}
check();
