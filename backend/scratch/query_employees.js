import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const employees = await Employee.find({}).populate('userId', 'email phone');
    console.log(`Total Employees in DB: ${employees.length}`);

    console.log("\n--- ZONAL COORDINATORS (ZC) ---");
    const zcs = employees.filter(e => (e.role || "").toUpperCase() === "ZC");
    for (const zc of zcs) {
      console.log({
        id: zc._id,
        userId: zc.userId?._id,
        name: zc.name,
        role: zc.role,
        designation: zc.designation,
        workingState: zc.workingState,
        workingDistrict: zc.workingDistrict,
        isZoneLocked: zc.isZoneLocked,
        reportingTo: zc.reportingTo
      });
    }

    console.log("\n--- DISTRICT MANAGERS (DM) ---");
    const dms = employees.filter(e => (e.role || "").toUpperCase() === "DM");
    for (const dm of dms) {
      console.log({
        id: dm._id,
        userId: dm.userId?._id,
        name: dm.name,
        role: dm.role,
        designation: dm.designation,
        workingState: dm.workingState,
        workingDistrict: dm.workingDistrict,
        isZoneLocked: dm.isZoneLocked,
        reportingTo: dm.reportingTo
      });
    }

    console.log("\n--- REGIONAL MANAGERS (RM) ---");
    const rms = employees.filter(e => (e.role || "").toUpperCase() === "RM");
    for (const rm of rms) {
      console.log({
        id: rm._id,
        userId: rm.userId?._id,
        name: rm.name,
        role: rm.role,
        designation: rm.designation,
        workingState: rm.workingState,
        workingDistrict: rm.workingDistrict,
        isZoneLocked: rm.isZoneLocked,
        reportingTo: rm.reportingTo
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
