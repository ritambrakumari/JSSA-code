import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import User from './models/User.js';
import Employee from './models/Employee.js';

const fixBalance = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const phone = '7667102207';
    
    const user = await User.findOne({ phone });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    const employee = await Employee.findOne({ userId: user._id });
    if (!employee) {
      console.log('Employee not found');
      process.exit(1);
    }

    // Set balance exactly to 600
    employee.walletBalance = 600;
    await employee.save();

    console.log(`Balance fixed! New walletBalance is ₹${employee.walletBalance}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixBalance();
