import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/jssa";

async function createSuperAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const email = "superadmin@jssabhiyan.com";
    const password = "JSSA@Super#2025"; // Change this after first login

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("SuperAdmin already exists. Updating role to superadmin...");
      existingUser.role = "superadmin";
      await existingUser.save();
      console.log("Updated successfully.");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({
        email,
        password: hashedPassword,
        role: "superadmin",
        restrictionType: "anywhere"
      });
      console.log(`SuperAdmin created successfully!`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error creating SuperAdmin:", error);
    process.exit(1);
  }
}

createSuperAdmin();
