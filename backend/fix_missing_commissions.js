import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

import Employee from "./models/Employee.js";
import Transaction from "./models/Transaction.js";
import GoalConfig from "./models/GoalConfig.js";
import SystemConfig from "./models/SystemConfig.js";
import Card from "./models/Card.js";
import User from "./models/User.js";

const EXECUTE = process.argv.includes('--execute');

async function fixMissingCommissions() {
  console.log(`Starting Missing Commission Fix in ${EXECUTE ? 'EXECUTE' : 'DRY-RUN'} mode...`);
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to Database.");

    const systemConfig = await SystemConfig.findOne();
    const fallbackCommissions = systemConfig?.commissions || { PE: 50, BS: 100, DM: 150 };
    
    const goalConfigsList = await GoalConfig.find();
    const goalConfigs = {};
    goalConfigsList.forEach(gc => {
      goalConfigs[gc.role] = gc;
    });

    const cards = await Card.find().populate('issuedBy');
    console.log(`Found ${cards.length} cards to verify.`);

    let missingCount = 0;
    let totalMissingAmount = 0;

    for (const card of cards) {
      if (!card.issuedBy) continue;
      
      const issuer = await Employee.findOne({ userId: card.issuedBy._id });
      if (!issuer) continue;

      const issuerRole = issuer.role || 'PE';
      let currentParentId = issuer.reportingTo;
      let depth = 0;
      const processedRoles = new Set([issuerRole]);

      while (currentParentId && depth < 5) {
        const parentEmployee = await Employee.findOne({ userId: currentParentId });
        if (!parentEmployee) break;

        const pRole = parentEmployee.role;
        if (pRole && ['BS', 'DM', 'ZC', 'RM'].includes(pRole) && !processedRoles.has(pRole)) {
          
          // Check if this senior already got paid for this card
          const existingTx = await Transaction.findOne({
            userId: parentEmployee.userId,
            type: 'CREDIT_COMMISSION',
            remarks: { $regex: card.cardId }
          });

          if (!existingTx) {
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
              console.log(`[MISSING PAYMENT] Employee: ${parentEmployee.name} (${pRole}) missed commission for Card ${card.cardId} issued by ${issuerRole}. Amount owed: ${expectedCommission}`);
              
              missingCount++;
              totalMissingAmount += expectedCommission;

              if (EXECUTE) {
                await Employee.findByIdAndUpdate(
                  parentEmployee._id,
                  { $inc: { salaryWallet: expectedCommission } }
                );

                await Transaction.create({
                  userId: parentEmployee.userId,
                  employeeId: parentEmployee._id,
                  amount: expectedCommission,
                  type: 'CREDIT_COMMISSION',
                  status: 'SUCCESS',
                  remarks: `Hierarchy commission from ${issuerRole} card issuance (${card.cardId}) - RETROACTIVE FIX`
                });
                console.log(`  -> Payment applied successfully.`);
              }
            }
          }
          
          processedRoles.add(pRole);
        }
        currentParentId = parentEmployee.reportingTo;
        depth++;
      }
    }

    console.log(`\n--- SUMMARY ---`);
    console.log(`Total missing payments found: ${missingCount}`);
    console.log(`Total Amount to Credit: ₹${totalMissingAmount}`);
    if (!EXECUTE) {
      console.log(`\nNOTE: This was a DRY-RUN. Run the script with --execute to apply changes to the database.`);
    } else {
      console.log(`\nSUCCESS: Changes have been successfully applied to the database.`);
    }

  } catch (error) {
    console.error("Script Error:", error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

fixMissingCommissions();
