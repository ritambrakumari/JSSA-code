import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }));
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));

    const user = await User.findOne({ phone: '6006189745' });
    if (!user) {
      console.log('No user found with phone 6006189745');
      process.exit();
    }
    
    const emp = await Employee.findOne({ userId: user._id });
    if (!emp) {
      console.log('No employee found for user with phone 6006189745');
      process.exit();
    }
    console.log(`Found Employee: ${emp.name}, Phone: ${user.phone}, Wallet Balance: ${emp.walletBalance}`);

    const txs = await Transaction.find({ 
      employeeId: emp._id, 
      type: { $nin: ['CREDIT_COMMISSION', 'CREDIT_LEAD'] } 
    }).sort({ createdAt: 1 });

    let calculatedBalance = 0;
    console.log(`\nFound ${txs.length} wallet transactions:`);
    for (let tx of txs) {
      console.log(`[${tx.createdAt.toISOString()}] ${tx.type} | ${tx.status} | Amount: ${tx.amount} | Remarks: ${tx.remarks}`);
      if (tx.status === 'SUCCESS') {
        if (tx.type.startsWith('CREDIT')) calculatedBalance += tx.amount;
        else if (tx.type.startsWith('DEBIT')) calculatedBalance -= tx.amount;
      }
    }

    console.log(`\nCalculated Balance from Transactions: ${calculatedBalance}`);
    console.log(`Actual Wallet Balance: ${emp.walletBalance}`);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
});
