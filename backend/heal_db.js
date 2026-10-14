import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: "./.env" });

const MONGODB_URI = process.env.MONGODB_URI;
console.log("URI:", MONGODB_URI);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("DB Connected!");

  // Define schemas inline or fetch from mongoose.model since they might not be registered yet
  const User = mongoose.model("User", new mongoose.Schema({
    email: String,
    role: String
  }));

  const JobPosting = mongoose.model("JobPosting", new mongoose.Schema({
    title: String,
    post: {
      en: String,
      hi: String
    }
  }));

  const Application = mongoose.model("Application", new mongoose.Schema({
    candidateName: String,
    createdBy: mongoose.Schema.Types.ObjectId,
    jobPostingId: { type: mongoose.Schema.Types.ObjectId, ref: "JobPosting" },
    mouStatus: String,
    post: String
  }));

  const Employee = mongoose.model("Employee", new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    role: String,
    designation: String,
    jobPostingId: mongoose.Schema.Types.ObjectId
  }));

  console.log("🛠️ RUNNING DB RECONCILIATION & SELF-HEALING HOOK...");
  const paidApps = await Application.find({ mouStatus: "paid" }).populate("jobPostingId");
  console.log(`Found ${paidApps.length} paid MOU applications.`);

  let healedCount = 0;
  for (const app of paidApps) {
    const employee = await Employee.findOne({ userId: app.createdBy });
    if (employee) {
      const postCodeMap = {
        "District Manager": "DM",
        "Block Supervisor": "BS",
        "Panchayat Executive": "PE",
        "Block Supervisor cum Panchayat Executive": "BS"
      };

      const postName = app.jobPostingId?.post?.en || app.post || "District Manager";
      const expectedRole = postCodeMap[postName] || "DM";

      const isMismatch =
        employee.designation !== postName ||
        employee.role !== expectedRole ||
        (employee.jobPostingId && app.jobPostingId && employee.jobPostingId.toString() !== app.jobPostingId._id.toString());

      if (isMismatch) {
        console.log(`🔧 Reconciling mismatch for Employee: ${employee.name}`);
        console.log(`   - Old Post: "${employee.designation}" -> New: "${postName}"`);
        console.log(`   - Old Role: "${employee.role}" -> New: "${expectedRole}"`);

        employee.designation = postName;
        employee.role = expectedRole;
        employee.jobPostingId = app.jobPostingId._id;

        await employee.save();
        healedCount++;
      }
    }
  }
  console.log(`✅ Finished. Reconciled and aligned ${healedCount} employee records.`);

  // Output healed state for Akshat Tiwari
  const user = await User.findOne({ email: "akshat8047@gmail.com" });
  if (user) {
    const employee = await Employee.findOne({ userId: user._id }).populate("jobPostingId");
    if (employee) {
      fs.writeFileSync("../debug_akshat_after.json", JSON.stringify({
        name: employee.name,
        role: employee.role,
        designation: employee.designation,
        jobPostingId: employee.jobPostingId ? {
          _id: employee.jobPostingId._id,
          title: employee.jobPostingId.title
        } : null
      }, null, 2));
      console.log("✅ Verification check written to debug_akshat_after.json");
    }
  }

  await mongoose.disconnect();
  console.log("DB Disconnected!");
}

run().catch(console.error);
