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
import Card from "./models/Card.js";
import User from "./models/User.js";

async function debugCardCommission() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find the most recent card created by a PE
    const cards = await Card.find().sort({ createdAt: -1 }).limit(10).populate('issuedBy');
    
    for (const card of cards) {
      if (!card.issuedBy) continue;
      
      const issuer = await Employee.findOne({ userId: card.issuedBy._id });
      if (!issuer) continue;

      if (issuer.role === 'PE') {
        console.log(`\n=== Found Recent Card by PE ===`);
        console.log(`Card ID: ${card.cardId}`);
        console.log(`Issuer: ${issuer.name} (PE) - reportingTo: ${issuer.reportingTo}`);
        
        let currentParentId = issuer.reportingTo;
        let depth = 0;
        
        while (currentParentId && depth < 5) {
          const parent = await Employee.findOne({ userId: currentParentId });
          if (!parent) break;
          
          console.log(`\n  [Level ${depth+1}] Parent: ${parent.name} (${parent.role}) - reportingTo: ${parent.reportingTo}`);
          
          const pGoalConfig = await GoalConfig.findOne({ role: parent.role });
          console.log(`    GoalConfig found: ${!!pGoalConfig}`);
          if (pGoalConfig) {
             console.log(`    Individual Commission: ${pGoalConfig.individualCommission}`);
             console.log(`    Layered Commissions: ${JSON.stringify(pGoalConfig.layeredCommissions)}`);
          }

          // Simulate logic
          let pCommission = 0;
          if (pGoalConfig && pGoalConfig.layeredCommissions && pGoalConfig.layeredCommissions.length > 0) {
              const roleMapping = { 'PE': 'Panchayat Executive', 'BS': 'Block Supervisor', 'DM': 'District Manager', 'ZC': 'Zonal Coordinator', 'RM': 'Regional Manager' };
              const targetRoleStr = roleMapping[issuer.role] || issuer.role;
              
              const layeredItem = pGoalConfig.layeredCommissions.find(l => 
                (l.roleName || "").toLowerCase() === targetRoleStr.toLowerCase() || 
                (l.roleName || "").toUpperCase() === issuer.role.toUpperCase()
              );
              
              if (layeredItem && layeredItem.commission > 0) {
                pCommission = layeredItem.commission;
                console.log(`    -> Matched Layered Commission: ${pCommission}`);
              } else {
                pCommission = pGoalConfig.individualCommission || 0;
                console.log(`    -> Fallback to Individual Commission: ${pCommission}`);
              }
          } else {
              pCommission = pGoalConfig?.individualCommission || 0;
              console.log(`    -> No Layered. Using Individual Commission: ${pCommission}`);
          }

          // Check Transaction
          const tx = await Transaction.findOne({ userId: parent.userId, remarks: { $regex: card.cardId } });
          console.log(`    Transaction Created? ${!!tx} (Amount: ${tx?.amount})`);

          currentParentId = parent.reportingTo;
          depth++;
        }
        break; // Just need one example
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

debugCardCommission();
