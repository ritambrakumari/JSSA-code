import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

import Employee from "./models/Employee.js";

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);

  const dms = await Employee.find({ role: 'DM', workingDistrict: /raebareli/i }).select('name userId isAllBlocksAssigned workingBlocks');
  console.log("DMs in Raebareli:", dms);

  const bs = await Employee.find({ role: 'BS', workingDistrict: /raebareli/i }).select('name reportingTo');
  console.log("BSs in Raebareli:", bs);

  process.exit(0);
}

check();
