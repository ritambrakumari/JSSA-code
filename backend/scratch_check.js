import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: 'd:/JSSA-main/backend/.env' });

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
    
    const akshat = await User.findOne({ name: /Akshat Tiwari/i });
    if (akshat) {
      const akshatTxs = await Transaction.find({ 
        userId: akshat._id, 
        type: { $in: ['CREDIT_COMMISSION', 'CREDIT_LEAD'] },
        status: 'SUCCESS'
      });
      const akshatTotal = akshatTxs.reduce((sum, tx) => sum + tx.amount, 0);
      
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const akshatMonthTotal = akshatTxs.filter(tx => tx.createdAt >= startOfMonth).reduce((sum, tx) => sum + tx.amount, 0);
      
      console.log('Akshat Tiwari Total Earnings:', akshatTotal, 'Month:', akshatMonthTotal);
    }
    
    const aakash = await User.findOne({ name: /Aakash Kumar/i });
    if (aakash) {
      const aakashTxs = await Transaction.find({ 
        userId: aakash._id, 
        type: { $in: ['CREDIT_COMMISSION', 'CREDIT_LEAD'] },
        status: 'SUCCESS'
      });
      const aakashTotal = aakashTxs.reduce((sum, tx) => sum + tx.amount, 0);
      
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const aakashMonthTotal = aakashTxs.filter(tx => tx.createdAt >= startOfMonth).reduce((sum, tx) => sum + tx.amount, 0);
      
      console.log('Aakash Kumar Total Earnings:', aakashTotal, 'Month:', aakashMonthTotal);
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

check();
