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

const UPDATE_DATABASE = false; // Only report, do not credit amounts automatically

async function calculateAllDifferences() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const now = new Date();
    // Get data starting from the PREVIOUS month (e.g. 1st June instead of 1st July)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const systemConfig = await SystemConfig.findOne().lean();
    const fallbackCommissions = systemConfig?.commissions || { PE: 50, BS: 100, DM: 150 };
    
    // Fetch all goal configs and create a map
    const goalConfigs = await GoalConfig.find().lean();
    const goalConfigMap = {};
    goalConfigs.forEach(c => goalConfigMap[c.role] = c);

    const allCards = await Card.find({ createdAt: { $gte: startOfMonth } }).populate('issuedBy').lean();
    const allEmployees = await Employee.find().lean();
    
    const empByUserId = new Map();
    const allUsers = await User.find().lean();
    const userById = new Map();
    
    allUsers.forEach(u => userById.set(u._id.toString(), u));
    allEmployees.forEach(e => {
      if (e.userId) empByUserId.set(e.userId.toString(), e);
    });

    const allTransactions = await Transaction.find({
      type: 'CREDIT_COMMISSION',
      createdAt: { $gte: startOfMonth }
    }).lean();

    const txByUserId = new Map();
    allTransactions.forEach(tx => {
      if (!tx.userId) return;
      const uid = tx.userId.toString();
      if (!txByUserId.has(uid)) txByUserId.set(uid, []);
      txByUserId.get(uid).push(tx);
    });

    // We only care about DM, BS
    const targetRoles = ['DM', 'BS'];
    const targetEmployees = allEmployees.filter(e => targetRoles.includes(e.role));

    console.log(`Found ${targetEmployees.length} employees with target roles.`);
    console.log(`Starting calculation... This might take a moment.\n`);

    const differencesList = [];

    for (const targetEmp of targetEmployees) {
      if (!targetEmp.userId) continue;

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
      let expectedEarnings = 0;
      const breakdown = {};
      const goalConfig = goalConfigMap[targetRole];
      let rmCommissionRate = goalConfig?.individualCommission || fallbackCommissions[targetEmp.role] || 10;

      for (const card of allCards) {
        if (!card.issuedBy) continue;
        const issuerUserId = card.issuedBy._id.toString();
        const issuer = empByUserId.get(issuerUserId);
        if (!issuer) continue;

        if (matchLogic(issuer)) {
          totalScopeCards++;

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

          let isSelf = (issuerUserId === targetEmp.userId.toString());
          const breakdownKey = isSelf ? 'SELF' : issuerRole;
          if (!breakdown[breakdownKey]) {
            breakdown[breakdownKey] = { count: 0, amount: 0, rate: cardCommission };
          }
          breakdown[breakdownKey].count++;
          breakdown[breakdownKey].amount += cardCommission;

          expectedEarnings += cardCommission;
        }
      }

      const txList = txByUserId.get(targetEmp.userId.toString()) || [];
      let totalActualEarnings = 0;
      txList.forEach(tx => {
        totalActualEarnings += (tx.amount || 0);
      });

      const missingEarnings = expectedEarnings - totalActualEarnings;
      const totalTransactionsCount = txList.length;
      const missingCardCount = totalScopeCards - totalTransactionsCount;

      if (missingEarnings !== 0 || missingCardCount !== 0) {
        
        // --- CREDIT MISSING EARNINGS TO DATABASE ---
        if (UPDATE_DATABASE && missingEarnings > 0) {
          // 1. Add amount to Employee's salaryWallet
          await Employee.updateOne(
            { _id: targetEmp._id },
            { $inc: { salaryWallet: missingEarnings } }
          );

          // 2. Create proper Transaction record
          await Transaction.create({
            userId: targetEmp.userId,
            employeeId: targetEmp._id,
            amount: missingEarnings,
            type: "CREDIT_COMMISSION",
            status: "SUCCESS",
            remarks: `System adjustment for missing ${targetRole} hierarchy commissions (${missingCardCount} missing cards)`,
          });
        }

        const user = userById.get(targetEmp.userId.toString());
        differencesList.push({
          name: targetEmp.name,
          phone: user ? user.phone : 'N/A',
          role: targetRole,
          scope: targetScopeStr,
          expectedEarnings,
          actualEarnings: totalActualEarnings,
          missingEarnings,
          expectedCards: totalScopeCards,
          actualTx: totalTransactionsCount,
          missingCards: missingCardCount,
          breakdown
        });
      }
    }

    if (differencesList.length > 0) {
      console.log(`\n======================================================`);
      console.log(`Found ${differencesList.length} employees with commission differences:`);
      console.log(`======================================================\n`);
      
      // Better formatting instead of console.table
      differencesList.forEach((d, i) => {
        console.log(`[${i + 1}] ${d.name} (${d.role}) | Phone: ${d.phone}`);
        console.log(`    Scope      : ${d.scope}`);
        console.log(`    Missing    : ₹${d.missingEarnings} (${d.missingCards} missing cards)`);
        console.log(`    --- Earnings Breakdown ---`);
        console.log(`    Total Actual   : ₹${d.actualEarnings} (${d.actualTx} txns)`);
        console.log(`    Total Expected : ₹${d.expectedEarnings} (${d.expectedCards} cards)`);
        if (Object.keys(d.breakdown).length > 0) {
            for (const [roleKey, data] of Object.entries(d.breakdown)) {
               console.log(`       -> ${roleKey.padEnd(4)} : ${data.count.toString().padEnd(3)} cards x ₹${data.rate.toString().padEnd(3)} = ₹${data.amount}`);
            }
        }
        console.log(`    ======================================`);
        console.log(`    => PAYABLE AMOUNT : ₹${d.missingEarnings}`);
        console.log(`------------------------------------------------------`);
      });

    } else {
      console.log(`\nAll good! No differences found for any RM/ZC/DM/BS.`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

calculateAllDifferences();
