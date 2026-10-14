import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

import Employee from "./models/Employee.js";
import Transaction from "./models/Transaction.js";
import Card from "./models/Card.js";
import User from "./models/User.js";

const TARGET_PHONE = "9079918126";

async function analyzeAnjanaCards() {
  console.log(`Analyzing cards for RM Phone: ${TARGET_PHONE}`);
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const targetUser = await User.findOne({ phone: TARGET_PHONE }).lean();
    if (!targetUser) return console.log("User not found");
    
    const targetEmp = await Employee.findOne({ userId: targetUser._id }).lean();
    console.log(`Target Employee: ${targetEmp.name}, State: ${targetEmp.workingState}`);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    console.log(`Filtering data from: ${startOfMonth.toISOString()}`);

    const allCards = await Card.find({ createdAt: { $gte: startOfMonth } }).populate('issuedBy').lean();
    const allEmployees = await Employee.find().lean();
    const allTransactions = await Transaction.find({ 
      userId: targetUser._id, 
      type: 'CREDIT_COMMISSION',
      createdAt: { $gte: startOfMonth }
    }).lean();

    const empByUserId = new Map();
    allEmployees.forEach(e => {
      if (e.userId) empByUserId.set(e.userId.toString(), e);
    });

    const paidCardIds = new Set();
    allTransactions.forEach(tx => {
      if (tx.remarks) {
        const match = tx.remarks.match(/(JSSA-\d{4}-\d+)/);
        if (match && match[1]) paidCardIds.add(match[1]);
      }
    });

    console.log(`Total transactions found for RM: ${allTransactions.length}`);
    console.log(`Total unique cards paid to RM: ${paidCardIds.size}`);

    const targetState = targetEmp.workingState.split('/')[0].trim().toLowerCase();

    let stateMatchCount = 0;
    let unpaidButStateMatch = [];

    for (const card of allCards) {
      if (!card.issuedBy) continue;
      const issuerUserId = card.issuedBy._id.toString();
      const issuer = empByUserId.get(issuerUserId);
      if (!issuer || !issuer.workingState) continue;

      const issuerState = issuer.workingState.split('/')[0].trim().toLowerCase();
      
      // If the card was issued by someone in Rajasthan
      if (issuerState === targetState) {
        stateMatchCount++;
        if (!paidCardIds.has(card.cardId)) {
          unpaidButStateMatch.push(card);
        }
      }
    }

    console.log(`\nCards issued by employees in ${targetState}: ${stateMatchCount}`);
    console.log(`Of those, cards NOT paid to RM: ${unpaidButStateMatch.length}`);

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

analyzeAnjanaCards();
