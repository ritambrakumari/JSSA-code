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
import GoalConfig from "./models/GoalConfig.js";
import SystemConfig from "./models/SystemConfig.js";

async function checkAll() {
  await mongoose.connect(process.env.MONGODB_URI);

  const now = new Date();
  // Get data starting from the PREVIOUS month (1st June onwards)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  console.log(`Analyzing data for ALL DMs & BSs from: ${startOfMonth.toISOString()}\n`);

  // Configs
  const systemConfig = await SystemConfig.findOne().lean();
  const fallbackCommissions = systemConfig?.commissions || { PE: 50, BS: 100, DM: 150 };
  const goalConfigsList = await GoalConfig.find().lean();
  
  const goalConfigs = {};
  goalConfigsList.forEach(gc => {
    goalConfigs[gc.role] = gc;
  });

  // Load all employees and users
  const allEmployees = await Employee.find().lean();
  const empByUserId = new Map();
  allEmployees.forEach(e => {
    if (e.userId) empByUserId.set(e.userId.toString(), e);
  });

  const allUsers = await User.find().lean();
  const userById = new Map();
  allUsers.forEach(u => userById.set(u._id.toString(), u));

  // Load all transactions for commissions
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

  // Load all cards
  const allCards = await Card.find({ createdAt: { $gte: startOfMonth } }).populate('issuedBy').lean();

  // Filter only DMs and BSs
  const targetRoles = ['DM', 'BS'];
  const targetEmployees = allEmployees.filter(e => targetRoles.includes(e.role));

  const differencesList = [];

  for (const targetEmp of targetEmployees) {
    if (!targetEmp.userId) continue;

    const targetRole = targetEmp.role;
    let targetScopeStr = "";
    let matchLogic = () => false;

    // Helper to clean and extract the English name from "English / Hindi" format
    const getCleanLoc = (loc) => loc ? loc.toString().split('/')[0].trim().toLowerCase() : "";

    const empState = getCleanLoc(targetEmp.workingState);
    const empDistrict = getCleanLoc(targetEmp.workingDistrict);
    const empBlock = getCleanLoc(targetEmp.workingBlock);

    if (targetRole === 'DM' && empDistrict) {
      targetScopeStr = `${empDistrict} (${empState})`;
      matchLogic = (issuer) => {
        const iState = getCleanLoc(issuer.workingState);
        const iDist = getCleanLoc(issuer.workingDistrict);
        const iRole = issuer.role || 'PE';
        const isSelf = issuer.userId && targetEmp.userId && (issuer.userId.toString() === targetEmp.userId.toString());
        
        // DM only gets commission from PE, BS, or their own (SELF) cards
        if (iRole !== 'PE' && iRole !== 'BS' && !isSelf) return false;

        // Both State and District must match
        return (iState === empState) && (iDist.startsWith(empDistrict));
      };
    } else if (targetRole === 'BS' && empBlock) {
      targetScopeStr = `${empBlock} (${empDistrict}, ${empState})`;
      matchLogic = (issuer) => {
        const iState = getCleanLoc(issuer.workingState);
        const iDist = getCleanLoc(issuer.workingDistrict);
        const iBlock = getCleanLoc(issuer.workingBlock);
        const iRole = issuer.role || 'PE';
        const isSelf = issuer.userId && targetEmp.userId && (issuer.userId.toString() === targetEmp.userId.toString());

        // BS only gets commission from PE, or their own (SELF) cards
        if (iRole !== 'PE' && !isSelf) return false;

        // State, District, AND Block must all match
        return (iState === empState) && (iDist.startsWith(empDistrict)) && (iBlock === empBlock);
      };
    } else {
      continue;
    }

    const txs = txByUserId.get(targetEmp.userId.toString()) || [];
    let totalActualEarnings = 0;
    txs.forEach(t => totalActualEarnings += t.amount);

    let totalScopeCards = 0;
    let expectedEarnings = 0;
    const breakdown = {};
    const goalConfig = goalConfigs[targetRole];

    for (const card of allCards) {
      if (!card.issuedBy) continue;
      const issuerUserId = card.issuedBy._id.toString();
      const issuer = empByUserId.get(issuerUserId);
      if (!issuer) continue;

      if (matchLogic(issuer)) {
        totalScopeCards++;

        const issuerRole = issuer.role || 'PE';
        let cardCommission = goalConfig?.individualCommission || fallbackCommissions[targetEmp.role] || 10;
        
        if (goalConfig && goalConfig.layeredCommissions && goalConfig.layeredCommissions.length > 0) {
          const roleMapping = { 'PE': 'Panchayat Executive', 'BS': 'Block Supervisor', 'DM': 'District Manager', 'ZC': 'Zonal Coordinator', 'RM': 'Regional Manager' };
          const targetRoleStr = roleMapping[issuerRole] || issuerRole;

          const layeredItem = goalConfig.layeredCommissions.find(l =>
            (l.roleName || "").toLowerCase() === targetRoleStr.toLowerCase() ||
            (l.roleName || "").toUpperCase() === issuerRole.toUpperCase()
          );

          if (layeredItem && layeredItem.commission > 0) {
            cardCommission = layeredItem.commission;
          }
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

    const missingEarnings = expectedEarnings - totalActualEarnings;

      if (missingEarnings > 0) {
      const user = userById.get(targetEmp.userId.toString());
      differencesList.push({
        employeeId: targetEmp._id,
        userId: targetEmp.userId,
        name: targetEmp.name,
        phone: user ? user.phone : 'N/A',
        role: targetRole,
        scope: targetScopeStr,
        expectedEarnings,
        actualEarnings: totalActualEarnings,
        missingEarnings,
        expectedCards: totalScopeCards,
        actualTx: txs.length,
        breakdown
      });
    }
  }

  if (differencesList.length > 0) {
    console.log(`\n======================================================`);
    console.log(`Found ${differencesList.length} DM/BS with missing commissions:`);
    console.log(`======================================================\n`);
    
    for (let i = 0; i < differencesList.length; i++) {
      const d = differencesList[i];
      console.log(`[${i + 1}] ${d.name} (${d.role}) | Phone: ${d.phone}`);
      console.log(`    Scope      : ${d.scope}`);
      console.log(`    Missing    : ₹${d.missingEarnings}`);
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
      
      // Credit to Wallet
      await Employee.findByIdAndUpdate(d.employeeId, { $inc: { walletBalance: d.missingEarnings } });
      
      // Create Transaction Record
      await Transaction.create({
        userId: d.userId,
        employeeId: d.employeeId,
        amount: d.missingEarnings,
        type: "CREDIT_COMMISSION",
        status: "SUCCESS",
        remarks: "Pending Team Commission Cleared by JSSA Management",
      });
      
      console.log(`✅ ₹${d.missingEarnings} credited successfully to ${d.name}'s wallet.`);
    }
  } else {
    console.log("No missing commissions found for any DM or BS.");
  }

  console.log("\n(Script Execution Complete - All pending credits processed.)");
  process.exit();
}

checkAll();
