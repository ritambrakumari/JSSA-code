import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

import Employee from "./models/Employee.js";
import User from "./models/User.js";
import Card from "./models/Card.js";
import Transaction from "./models/Transaction.js";

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);

  const praveen = await Employee.findOne({ name: /Praveen Kumar Soni/i }).lean();
  if (!praveen) {
    console.log("Not found");
    process.exit();
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Check transactions
  const txs = await Transaction.find({
    userId: praveen.userId,
    type: 'CREDIT_COMMISSION',
    createdAt: { $gte: startOfMonth }
  }).lean();

  let actualEarnings = 0;
  txs.forEach(t => actualEarnings += t.amount);

  // 2. Check cards in his district
  let targetScopeStr = praveen.workingDistrict.split('/')[0].trim().toLowerCase();

  const allCards = await Card.find({ createdAt: { $gte: startOfMonth } }).populate('issuedBy').lean();
  let totalScopeCards = 0;

  allCards.forEach(card => {
    if (!card.issuedBy) return;
    const issuerDist = card.issuedBy.workingDistrict;
    if (issuerDist && issuerDist.toString().toLowerCase().startsWith(targetScopeStr)) {
      totalScopeCards++;
    }
  });

  console.log("Praveen's Scope String:", `"${targetScopeStr}"`);
  console.log("Total Cards in Scope (Geography):", totalScopeCards);
  console.log("Total Transactions Found:", txs.length);
  console.log("Total Actual Earnings:", actualEarnings);

  process.exit();
}

check();
