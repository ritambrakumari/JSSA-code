// One-time script: creates (or updates) a REAL administrative staff login
// (User account + AdministrativeStaff profile) with a properly bcrypt-hashed
// password, so login works even when NODE_ENV=production (where the dev-only
// bypass login is disabled).
//
// Usage (run from the backend folder, with your local .env present):
//   node create_real_admin.js

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";
import AdministrativeStaff from "./models/AdministrativeStaff.js";
import JobRole from "./models/JobRole.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const ADMIN_EMAIL = "admin@jssabhiyan.com";
const ADMIN_PASSWORD = "JSSA@Admin#2025";
const ADMIN_ROLE = "staff"; // Administrative Staff
const STAFF_NAME = "Staff";
const JOB_TITLE = "Administrator";

async function run() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI not found in .env — aborting.");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // 1. Create or update the User (login) account
  let user = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

  if (user) {
    user.password = hashedPassword;
    user.role = ADMIN_ROLE;
    user.isPasswordSet = true;
    await user.save();
    console.log(`Updated existing user ${ADMIN_EMAIL} -> role=${ADMIN_ROLE}, password reset.`);
  } else {
    user = await User.create({
      email: ADMIN_EMAIL.toLowerCase(),
      password: hashedPassword,
      role: ADMIN_ROLE,
      isPasswordSet: true,
      name: STAFF_NAME,
    });
    console.log(`Created new user: ${ADMIN_EMAIL} with role=${ADMIN_ROLE}`);
  }

  // 2. Make sure a JobRole exists to attach to the staff profile
  let jobRole = await JobRole.findOne({ jobTitle: JOB_TITLE });
  if (!jobRole) {
    jobRole = await JobRole.create({
      jobTitle: JOB_TITLE,
      termsConditions: "Accepted",
      permissions: [],
      status: "Active",
      createdBy: user._id,
    });
    console.log(`Created JobRole: ${JOB_TITLE}`);
  }

  // 3. Create or update the AdministrativeStaff profile linked to this user
  let staff = await AdministrativeStaff.findOne({ userId: user._id });
  if (staff) {
    staff.name = STAFF_NAME;
    staff.jobRoleId = jobRole._id;
    staff.status = "Active";
    staff.accountStatus = "Active";
    staff.onboardingComplete = true;
    await staff.save();
    console.log("Updated existing AdministrativeStaff profile.");
  } else {
    await AdministrativeStaff.create({
      userId: user._id,
      name: STAFF_NAME,
      jobRoleId: jobRole._id,
      status: "Active",
      accountStatus: "Active",
      onboardingComplete: true,
      createdBy: user._id,
    });
    console.log("Created AdministrativeStaff profile.");
  }

  console.log("Done. You can now log in with:");
  console.log(`  Email: ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  Role: Administrative Staff`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Error creating admin:", err);
  process.exit(1);
});
