import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './models/Employee.js';
import JobPosting from './models/JobPosting.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const employees = await Employee.find().populate('jobPostingId').populate('workingBlock');
    console.log(`Total Employees: ${employees.length}`);

    employees.forEach(e => {
        const role = e.role || (e.jobPostingId?.post?.en?.includes('District Manager') ? 'DM' : (e.jobPostingId?.post?.en?.includes('Block Supervisor') ? 'BS' : 'PE'));
        console.log(`- ${e.name} | Role: ${role} | District: ${e.workingDistrict} | Block: ${e.workingBlock?.name || 'N/A'} | Locked: ${e.isZoneLocked} | ReportsTo: ${e.reportingTo}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Check failed:", error);
    process.exit(1);
  }
}

check();
