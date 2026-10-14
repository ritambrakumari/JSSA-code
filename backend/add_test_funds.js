import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import User from './models/User.js';
import Employee from './models/Employee.js';
import Transaction from './models/Transaction.js';

const addFunds = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const email = 'test_dm@test.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log('User not found:', email);
      process.exit(1);
    }

    const employee = await Employee.findOne({ userId: user._id });
    if (!employee) {
      console.log('Employee profile not found for user:', email);
      process.exit(1);
    }

    const amountToAdd = 50000;
    
    // Add to wallet
    employee.salaryWallet = (employee.salaryWallet || 0) + amountToAdd;
    await employee.save();

    // Create a transaction
    const tx = new Transaction({
      userId: user._id,
      amount: amountToAdd,
      type: 'CREDIT_COMMISSION',
      status: 'SUCCESS',
      remarks: 'Test script: Added commission for testing withdrawals'
    });
    await tx.save();

    console.log(`Successfully added ₹${amountToAdd} to ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error adding funds:', error);
    process.exit(1);
  }
};

addFunds();
