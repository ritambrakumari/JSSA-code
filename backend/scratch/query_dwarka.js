import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';
import '../models/User.js'; // Register User model

dotenv.config({ path: 'd:/JSSA-main/backend/.env' });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const employees = await Employee.find({
      workingDistrict: { $regex: /dwarka/i }
    }).populate('userId', 'email phone');

    console.log(`Found ${employees.length} employees for Dwarka:`);
    for (const emp of employees) {
      console.log({
        id: emp._id,
        name: emp.name,
        role: emp.role,
        designation: emp.designation,
        workingState: emp.workingState,
        workingDistrict: emp.workingDistrict,
        isZoneLocked: emp.isZoneLocked,
        reportingTo: emp.reportingTo
      });
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();
