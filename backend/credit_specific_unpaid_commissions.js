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

const TARGET_PHONE = "9079918126";
const EXECUTE = false; // 100% READ ONLY

async function fixSpecificMissingCommissionsFast() {
  console.log(`Starting FAST mode check for Target Phone: ${TARGET_PHONE}`);
  const startTime = Date.now();
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const targetUser = await User.findOne({ phone: TARGET_PHONE }).lean();
    if (!targetUser) {
      console.log(`No user found with phone ${TARGET_PHONE}`);
      process.exit(0);
    }
    
    // 1. Fetch Configs
    const systemConfig = await SystemConfig.findOne().lean();
    const fallbackCommissions = systemConfig?.commissions || { PE: 50, BS: 100, DM: 150 };
    
    const goalConfigsList = await GoalConfig.find().lean();
    const goalConfigs = {};
    goalConfigsList.forEach(gc => {
      goalConfigs[gc.role] = gc;
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 2. Fetch everything into memory for lightning speed
    console.log(`Loading data for current month (from ${startOfMonth.toISOString()})...`);
    const allEmployees = await Employee.find().lean();
    const allTransactions = await Transaction.find({ 
      userId: targetUser._id, 
      type: 'CREDIT_COMMISSION',
      createdAt: { $gte: startOfMonth }
    }).lean();
    
    const allCards = await Card.find({ createdAt: { $gte: startOfMonth } }).populate('issuedBy').lean();

    // Create lookup maps
    const empByUserId = new Map();
    allEmployees.forEach(e => {
      if (e.userId) empByUserId.set(e.userId.toString(), e);
    });

    // Create a Set of card IDs that the target user has ALREADY been paid for
    const paidCardIds = new Set();
    allTransactions.forEach(tx => {
      if (tx.remarks) {
        // e.g. "Hierarchy commission from PE card issuance (JSSA-2026-0001)"
        const match = tx.remarks.match(/(JSSA-\d{4}-\d+)/);
        if (match && match[1]) {
          paidCardIds.add(match[1]);
        }
      }
    });

    let missingCountForTarget = 0;
    let totalMissingAmountForTarget = 0;

    console.log(`Processing ${allCards.length} cards instantly...`);

    for (const card of allCards) {
      if (!card.issuedBy) continue;
      
      const issuerUserId = card.issuedBy._id.toString();
      const issuer = empByUserId.get(issuerUserId);
      if (!issuer) continue;

      const issuerRole = issuer.role || 'PE';
      let currentEmp = issuer;
      let currentParentId = issuer.reportingTo ? issuer.reportingTo.toString() : null;
      let depth = 0;
      const processedRoles = new Set([issuerRole]);
      const hierarchyOrder = ['PE', 'BS', 'DM', 'ZC', 'RM'];

      while (depth < 5 && processedRoles.size < hierarchyOrder.length) {
        let parentEmployee = null;
        
        if (currentParentId) {
          parentEmployee = empByUserId.get(currentParentId);
        }
        
        if (!parentEmployee) {
          const currentRoleIdx = hierarchyOrder.indexOf(currentEmp.role || 'PE');
          for (let i = currentRoleIdx + 1; i < hierarchyOrder.length; i++) {
            const targetRole = hierarchyOrder[i];
            if (processedRoles.has(targetRole)) continue;

            // In-memory geographic lookup
            let foundFallback = allEmployees.find(emp => {
              if (emp.role !== targetRole || emp.isZoneLocked !== true) return false;
              
              if (targetRole === 'BS' && issuer.workingBlock && emp.workingBlock) {
                return emp.workingBlock.toString() === issuer.workingBlock.toString();
              } else if (targetRole === 'DM' && issuer.workingDistrict && emp.workingDistrict) {
                const myDist = issuer.workingDistrict.toString().split('/')[0].trim().toLowerCase();
                const theirDist = emp.workingDistrict.toString().toLowerCase();
                return theirDist.startsWith(myDist);
              } else if (targetRole === 'ZC' && issuer.workingDistrict && emp.workingDistrict) {
                const myDist = issuer.workingDistrict.toString().split('/')[0].trim().toLowerCase();
                const theirDists = emp.workingDistrict.toString().toLowerCase().split(',').map(d=>d.trim());
                return theirDists.some(d => d.startsWith(myDist));
              } else if (targetRole === 'RM' && issuer.workingState && emp.workingState) {
                const myState = issuer.workingState.toString().split('/')[0].trim().toLowerCase();
                const theirState = emp.workingState.toString().toLowerCase();
                return theirState.startsWith(myState);
              }
              return false;
            });

            if (foundFallback) {
              parentEmployee = foundFallback;
              break;
            }
          }
        }

        if (!parentEmployee) break;

        const pRole = parentEmployee.role;
        if (pRole && ['BS', 'DM', 'ZC', 'RM'].includes(pRole) && !processedRoles.has(pRole)) {
          
          // Is this our target user?
          if (parentEmployee.userId.toString() === targetUser._id.toString()) {
            
            // Check if they got paid using our in-memory SET
            if (!paidCardIds.has(card.cardId)) {
              
              // Missing payment! Calculate what they should get
              const pGoalConfig = goalConfigs[pRole];
              let expectedCommission = 0;

              if (pGoalConfig && pGoalConfig.layeredCommissions && pGoalConfig.layeredCommissions.length > 0) {
                const roleMapping = { 'PE': 'Panchayat Executive', 'BS': 'Block Supervisor', 'DM': 'District Manager', 'ZC': 'Zonal Coordinator', 'RM': 'Regional Manager' };
                const targetRoleStr = roleMapping[issuerRole] || issuerRole;
                
                const layeredItem = pGoalConfig.layeredCommissions.find(l => 
                  (l.roleName || "").toLowerCase() === targetRoleStr.toLowerCase() || 
                  (l.roleName || "").toUpperCase() === issuerRole.toUpperCase()
                );
                
                if (layeredItem && layeredItem.commission > 0) {
                  expectedCommission = layeredItem.commission;
                } else {
                  expectedCommission = pGoalConfig.individualCommission || (fallbackCommissions[pRole] || 0);
                }
              } else {
                 expectedCommission = pGoalConfig?.individualCommission || (fallbackCommissions[pRole] || 0);
              }

              if (expectedCommission > 0) {
                missingCountForTarget++;
                totalMissingAmountForTarget += expectedCommission;
              }
            }
          }
          processedRoles.add(pRole);
        }
        
        currentEmp = parentEmployee;
        currentParentId = parentEmployee.reportingTo ? parentEmployee.reportingTo.toString() : null;
        depth++;
      }
    }
    
    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n========================================`);
    console.log(` SUMMARY FOR RM (${TARGET_PHONE})`);
    console.log(`========================================`);
    console.log(`Total Missed Cards: ${missingCountForTarget}`);
    console.log(`Total Pending Amount: ₹${totalMissingAmountForTarget}`);
    console.log(`========================================`);
    console.log(`Done in ${timeTaken} seconds!`);

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

fixSpecificMissingCommissionsFast();
