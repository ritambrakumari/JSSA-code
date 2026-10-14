import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './models/Employee.js';
import JobPosting from './models/JobPosting.js';
import User from './models/User.js';
import Block from './models/Block.js';
import Panchayat from './models/Panchayat.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function relink() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Get all employees
    const employees = await Employee.find().populate('jobPostingId');
    console.log(`Scanning ${employees.length} employees...`);

    let linksFound = 0;
    let repaired = 0;

    for (const emp of employees) {
      // --- DATA REPAIR ---
      let currentPost = emp.jobPostingId?.post?.en || emp.designation || "";
      let currentRole = emp.role;

      if (!currentRole) {
        if (currentPost.toLowerCase().includes("district manager")) currentRole = "DM";
        else if (currentPost.toLowerCase().includes("block supervisor")) currentRole = "BS";
        else if (currentPost.toLowerCase().includes("panchayat executive")) currentRole = "PE";
        
        if (currentRole) {
            emp.role = currentRole;
            emp.designation = currentPost;
            repaired++;
        }
      }

      const myRole = (emp.role || "").toUpperCase();
      const isBS = myRole === 'BS';
      const isPE = myRole === 'PE';

      let manager = null;

      if (isPE && emp.workingBlock) {
        // Find BS in same block
        manager = await Employee.findOne({
          role: { $in: ['BS', 'Block Supervisor'] },
          workingBlock: emp.workingBlock,
          isZoneLocked: true,
          _id: { $ne: emp._id }
        });
        if (manager) console.log(`🔗 Found BS manager ${manager.name} for PE ${emp.name}`);
      } else if (isBS && emp.workingDistrict) {
        // Find DM in same district
        manager = await Employee.findOne({
          role: { $in: ['DM', 'District Manager'] },
          workingDistrict: emp.workingDistrict,
          isZoneLocked: true,
          _id: { $ne: emp._id }
        });
        if (manager) console.log(`🔗 Found DM manager ${manager.name} for BS ${emp.name}`);
      }

      if (manager) {
        if (String(emp.reportingTo) !== String(manager.userId)) {
            emp.reportingTo = manager.userId;
            await emp.save();
            linksFound++;
        }
      }
    }

    console.log(`\nResults:`);
    console.log(`- Data Repaired: ${repaired}`);
    console.log(`- New Links Created: ${linksFound}`);
    console.log(`\nRelinking complete! Please refresh the dashboard.`);
    process.exit(0);
  } catch (error) {
    console.error("Relink failed:", error);
    process.exit(1);
  }
}

relink();
