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

async function getUnpaid() {
  console.log("Checking for unpaid hierarchy commissions (Geographic Fallback)...");
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const cards = await Card.find().populate('issuedBy');
    let missingCount = 0;
    const unpaidMap = new Map(); // Keep track by employee

    for (const card of cards) {
      if (!card.issuedBy) continue;
      
      const issuer = await Employee.findOne({ userId: card.issuedBy._id });
      if (!issuer) continue;

      const issuerRole = issuer.role || 'PE';
      let currentEmp = issuer;
      let currentParentId = issuer.reportingTo;
      let depth = 0;
      const processedRoles = new Set([issuerRole]);
      const hierarchyOrder = ['PE', 'BS', 'DM', 'ZC', 'RM'];

      while (depth < 5 && processedRoles.size < hierarchyOrder.length) {
        let parentEmployee = null;
        if (currentParentId) {
          parentEmployee = await Employee.findOne({ userId: currentParentId });
        }
        
        if (!parentEmployee) {
          const currentRoleIdx = hierarchyOrder.indexOf(currentEmp.role || 'PE');
          for (let i = currentRoleIdx + 1; i < hierarchyOrder.length; i++) {
            const targetRole = hierarchyOrder[i];
            if (processedRoles.has(targetRole)) continue;

            let query = { role: targetRole, isZoneLocked: true };
            let isValidLocation = false;

            if (targetRole === 'BS' && currentEmp.workingBlock) {
              query.workingBlock = currentEmp.workingBlock;
              isValidLocation = true;
            } else if (targetRole === 'DM' && currentEmp.workingDistrict) {
              const distName = currentEmp.workingDistrict.toString().split('/')[0].trim();
              const safeDist = distName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              query.workingDistrict = { $regex: new RegExp(`^${safeDist}`, 'i') };
              isValidLocation = true;
            } else if (targetRole === 'ZC' && currentEmp.workingDistrict) {
              const distName = currentEmp.workingDistrict.toString().split('/')[0].trim();
              const safeDist = distName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              query.workingDistrict = { $regex: new RegExp(`(^|,\\s*)${safeDist}`, 'i') };
              isValidLocation = true;
            } else if (targetRole === 'RM' && currentEmp.workingState) {
              const stateName = currentEmp.workingState.toString().split('/')[0].trim();
              const safeState = stateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              query.workingState = { $regex: new RegExp(`^${safeState}`, 'i') };
              isValidLocation = true;
            }

            if (isValidLocation) {
              parentEmployee = await Employee.findOne(query);
              if (parentEmployee) break;
            }
          }
        }

        if (!parentEmployee) break;

        const pRole = parentEmployee.role;
        if (pRole && ['BS', 'DM', 'ZC', 'RM'].includes(pRole) && !processedRoles.has(pRole)) {
          // Verify if they got paid
          const existingTx = await Transaction.findOne({
            userId: parentEmployee.userId,
            type: 'CREDIT_COMMISSION',
            remarks: { $regex: card.cardId }
          });

          if (!existingTx) {
            console.log(`[UNPAID] Card ID: ${card.cardId} | Issuer: ${issuer.name} (${issuerRole}) -> Missing for: ${parentEmployee.name} (${pRole})`);
            missingCount++;
            
            const empKey = `${parentEmployee.name} (${pRole})`;
            unpaidMap.set(empKey, (unpaidMap.get(empKey) || 0) + 1);
          }
          processedRoles.add(pRole);
        }
        
        currentEmp = parentEmployee;
        currentParentId = parentEmployee.reportingTo;
        depth++;
      }
    }
    
    console.log(`\n--- SUMMARY ---`);
    console.log(`Total Unpaid Card Links: ${missingCount}`);
    console.log(`\nMissing Count By Employee:`);
    for (const [emp, count] of unpaidMap.entries()) {
      console.log(`- ${emp}: Missed ${count} commissions`);
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

getUnpaid();
