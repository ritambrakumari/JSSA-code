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
import GoalConfig from "./models/GoalConfig.js";
import SystemConfig from "./models/SystemConfig.js";
//9079918126
// 9691259642
//60061 89745
const TARGET_PHONE = "9079918126";

async function calculateDifference() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const targetUser = await User.findOne({ phone: TARGET_PHONE }).lean();
    if (!targetUser) return console.log("User not found");

    const targetEmp = await Employee.findOne({ userId: targetUser._id }).lean();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get RM commission rate
    const systemConfig = await SystemConfig.findOne().lean();
    const fallbackCommissions = systemConfig?.commissions || { PE: 50, BS: 100, DM: 150 };
    const goalConfig = await GoalConfig.findOne({ role: targetEmp.role }).lean();
    let rmCommissionRate = goalConfig?.individualCommission || fallbackCommissions[targetEmp.role] || 10; // Defaulting to 10 if not found

    // Get All Cards issued in their state this month
    const allCards = await Card.find({ createdAt: { $gte: startOfMonth } }).populate('issuedBy').lean();
    const allEmployees = await Employee.find().lean();

    const empByUserId = new Map();
    allEmployees.forEach(e => {
      if (e.userId) empByUserId.set(e.userId.toString(), e);
    });

    const targetRole = targetEmp.role;
    let targetScopeStr = "";
    let matchLogic = () => false;

    if (targetRole === 'RM' && targetEmp.workingState) {
      targetScopeStr = targetEmp.workingState.split('/')[0].trim().toLowerCase();
      matchLogic = (issuer) => issuer.workingState && issuer.workingState.split('/')[0].trim().toLowerCase() === targetScopeStr;
    } else if (targetRole === 'ZC' && targetEmp.workingDistrict) {
      const zcDists = targetEmp.workingDistrict.toString().toLowerCase().split(',').map(d => d.trim().split('/')[0].trim());
      targetScopeStr = zcDists.join(', ');
      matchLogic = (issuer) => issuer.workingDistrict && zcDists.some(d => issuer.workingDistrict.toString().toLowerCase().startsWith(d));
    } else if (targetRole === 'DM' && targetEmp.workingDistrict) {
      targetScopeStr = targetEmp.workingDistrict.split('/')[0].trim().toLowerCase();
      matchLogic = (issuer) => issuer.workingDistrict && issuer.workingDistrict.toString().toLowerCase().startsWith(targetScopeStr);
    } else if (targetRole === 'BS' && targetEmp.workingBlock) {
      targetScopeStr = targetEmp.workingBlock.toString().toLowerCase();
      matchLogic = (issuer) => issuer.workingBlock && issuer.workingBlock.toString().toLowerCase() === targetScopeStr;
    } else {
      matchLogic = (issuer) => issuer.userId.toString() === targetEmp.userId.toString();
      targetScopeStr = "Self";
    }

    let totalScopeCards = 0;
    let selfCreatedCards = 0;
    let expectedEarnings = 0;

    // To track breakdown: { 'PE': { count: 5, amount: 50 }, ... }
    const breakdown = {};

    for (const card of allCards) {
      if (!card.issuedBy) continue;
      const issuerUserId = card.issuedBy._id.toString();
      const issuer = empByUserId.get(issuerUserId);
      if (!issuer) continue;

      let isSelf = (issuerUserId === targetEmp.userId.toString());
      if (isSelf) {
        selfCreatedCards++;
      }

      if (matchLogic(issuer)) {
        totalScopeCards++;

        // Calculate exact commission for this card based on issuer role
        const issuerRole = issuer.role || 'PE';
        let cardCommission = 0;

        if (goalConfig && goalConfig.layeredCommissions && goalConfig.layeredCommissions.length > 0) {
          const roleMapping = { 'PE': 'Panchayat Executive', 'BS': 'Block Supervisor', 'DM': 'District Manager', 'ZC': 'Zonal Coordinator', 'RM': 'Regional Manager' };
          const targetRoleStr = roleMapping[issuerRole] || issuerRole;

          const layeredItem = goalConfig.layeredCommissions.find(l =>
            (l.roleName || "").toLowerCase() === targetRoleStr.toLowerCase() ||
            (l.roleName || "").toUpperCase() === issuerRole.toUpperCase()
          );

          if (layeredItem && layeredItem.commission > 0) {
            cardCommission = layeredItem.commission;
          } else {
            cardCommission = goalConfig.individualCommission || (fallbackCommissions[targetEmp.role] || 10);
          }
        } else {
          cardCommission = goalConfig?.individualCommission || (fallbackCommissions[targetEmp.role] || 10);
        }

        // Use 'SELF' as key if the ZC/RM created it themselves
        const breakdownKey = isSelf ? 'SELF' : issuerRole;
        if (!breakdown[breakdownKey]) {
          breakdown[breakdownKey] = { count: 0, amount: 0, rate: cardCommission };
        }
        breakdown[breakdownKey].count++;
        breakdown[breakdownKey].amount += cardCommission;

        expectedEarnings += cardCommission;
      }
    }

    // Get All Transactions for RM this month
    const allTransactions = await Transaction.find({
      userId: targetUser._id,
      type: 'CREDIT_COMMISSION',
      createdAt: { $gte: startOfMonth }
    }).lean();

    let totalActualEarnings = 0;
    allTransactions.forEach(tx => {
      totalActualEarnings += (tx.amount || 0);
    });

    const totalTransactionsCount = allTransactions.length;
    const missingEarnings = expectedEarnings - totalActualEarnings;
    const missingCardCount = totalScopeCards - totalTransactionsCount;

    console.log(`\n==============================================`);
    console.log(`   DIFFERENCE REPORT FOR ${targetEmp.name} (${targetRole}) `);
    console.log(`   Scope: ${targetScopeStr}`);
    console.log(`   Month starting from: ${startOfMonth.toISOString()}`);
    console.log(`==============================================`);
    console.log(`Base (Individual) Commission : ₹${rmCommissionRate}`);
    console.log(`----------------------------------------------`);
    console.log(`0. Self-Created Cards    : ${selfCreatedCards} cards`);
    console.log(`1. Total Cards in Scope  : ${totalScopeCards} cards`);
    console.log(`2. Total Transactions    : ${totalTransactionsCount} transactions`);
    console.log(`3. Difference in Cards   : ${missingCardCount} cards`);
    console.log(`----------------------------------------------`);
    console.log(`--- EXPECTED EARNINGS BREAKDOWN ---`);
    for (const [role, data] of Object.entries(breakdown)) {
      console.log(`   > ${role.padEnd(4)} Cards: ${data.count.toString().padEnd(3)} x ₹${data.rate.toString().padEnd(3)} = ₹${data.amount}`);
    }
    console.log(`----------------------------------------------`);
    console.log(`4. Total Expected Earnings: ₹${expectedEarnings}`);
    console.log(`5. Actual Earnings        : ₹${totalActualEarnings}`);
    console.log(`----------------------------------------------`);
    console.log(`PENDING/MISSING EARNINGS  : ₹${missingEarnings}`);
    console.log(`==============================================\n`);

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

calculateDifference();
