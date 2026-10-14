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

const EXECUTE = process.argv.includes('--execute');

async function fixCommissions() {
  console.log(`Starting Retroactive Commission Fix in ${EXECUTE ? 'EXECUTE' : 'DRY-RUN'} mode...`);
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to Database.");

    // Fetch all SystemConfigs and GoalConfigs
    const systemConfig = await SystemConfig.findOne();
    const fallbackCommissions = systemConfig?.commissions || { PE: 50, BS: 100, DM: 150 };
    
    const goalConfigsList = await GoalConfig.find();
    const goalConfigs = {};
    goalConfigsList.forEach(gc => {
      goalConfigs[gc.role] = gc;
    });

    // We look for transactions related to card commissions
    const transactions = await Transaction.find({
      type: 'CREDIT_COMMISSION',
      remarks: { $regex: /card issuance/i }
    }).populate('employeeId');

    console.log(`Found ${transactions.length} potential commission transactions.`);

    let totalOverpaid = 0;
    let totalUnderpaid = 0;
    let fixedCount = 0;

    for (const tx of transactions) {
      if (!tx.employeeId) continue;
      const employee = tx.employeeId;
      const pRole = employee.role || 'PE';
      
      let expectedCommission = 0;
      let isIssuer = tx.remarks.startsWith('Commission for card issuance');
      let isHierarchy = tx.remarks.startsWith('Hierarchy commission from');

      if (isIssuer) {
        // Direct issuer commission
        expectedCommission = goalConfigs[pRole]?.individualCommission || (fallbackCommissions[pRole] || 0);
      } else if (isHierarchy) {
        // Hierarchy commission
        // Extract issuer role from remarks: e.g., "Hierarchy commission from PE card issuance"
        const match = tx.remarks.match(/Hierarchy commission from ([A-Z]+) card issuance/);
        const issuerRole = match ? match[1] : null;

        if (issuerRole) {
          const pGoalConfig = goalConfigs[pRole];
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
        }
      }

      // If we couldn't figure out the expected commission safely, skip
      if (expectedCommission === 0 && tx.amount > 0) {
        console.log(`[WARN] Could not determine expected commission for tx ${tx._id}, skipping.`);
        continue;
      }

      if (tx.amount !== expectedCommission) {
        const difference = tx.amount - expectedCommission; // Positive means overpaid, negative means underpaid
        
        console.log(`[FIX NEEDED] Tx ${tx._id} | Employee: ${employee.name} (${pRole}) | Original Amount: ${tx.amount} | Expected: ${expectedCommission} | Diff: ${difference}`);
        
        if (difference > 0) {
          totalOverpaid += difference;
        } else {
          totalUnderpaid += Math.abs(difference);
        }
        fixedCount++;

        if (EXECUTE) {
          // Fix Transaction Amount
          tx.amount = expectedCommission;
          await tx.save();

          // Fix Employee Wallet
          employee.salaryWallet = (employee.salaryWallet || 0) - difference;
          await employee.save();
          console.log(`  -> Applied fix to DB.`);
        }
      }
    }

    console.log(`\n--- SUMMARY ---`);
    console.log(`Transactions needing fix: ${fixedCount}`);
    console.log(`Total Overpaid Amount to Recover: ₹${totalOverpaid}`);
    console.log(`Total Underpaid Amount to Add: ₹${totalUnderpaid}`);
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

fixCommissions();
