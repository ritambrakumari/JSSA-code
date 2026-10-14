import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './models/Employee.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function reset() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const result = await Employee.updateMany(
      {},
      {
        $set: {
          isZoneLocked: false,
          reportingTo: null,
          workingState: null,
          workingDistrict: null,
          workingBlock: null,
          workingPanchayat: null
        }
      }
    );

    console.log(`Successfully reset ${result.modifiedCount} employee records.`);
    process.exit(0);
  } catch (error) {
    console.error("Reset failed:", error);
    process.exit(1);
  }
}

reset();
