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

const deductFunds = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const phone = '7667102207';
    const amountToDeduct = 1500;

    // Find the user by phone number
    const user = await User.findOne({ phone });

    if (!user) {
      console.log('User not found with phone:', phone);
      process.exit(1);
    }

    // Find the employee profile linked to the user
    const employee = await Employee.findOne({ userId: user._id });
    if (!employee) {
      console.log('Employee profile not found for user:', phone);
      process.exit(1);
    }

    // Check current balance
    console.log(`Current walletBalance: ${employee.walletBalance}`);

    // Deduct 1500
    if (employee.walletBalance < amountToDeduct) {
      console.log(`Warning: walletBalance (${employee.walletBalance}) is less than ${amountToDeduct}. Setting to 0.`);
      employee.walletBalance = 0;
    } else {
      employee.walletBalance -= amountToDeduct;
    }

    await employee.save();
    
    // Create a transaction record just to be safe
    const tx = new Transaction({
      userId: user._id,
      amount: amountToDeduct,
      type: 'DEBIT_SYSTEM',
      status: 'SUCCESS',
      remarks: 'Diduction'
    });
    await tx.save();

    console.log(`Successfully deducted ₹${amountToDeduct}. New walletBalance is ₹${employee.walletBalance}`);
    
    // Disconnect and exit
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error deducting funds:', error);
    process.exit(1);
  }
};

deductFunds();
