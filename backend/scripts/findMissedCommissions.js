import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Employee from '../models/Employee.js';
import Card from '../models/Card.js';
import Transaction from '../models/Transaction.js';
import GoalConfig from '../models/GoalConfig.js';

async function findMissedCommissions() {
  try {
    console.log("⏳ Connecting to Database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected Successfully!\n");

    const dms = await Employee.find({ role: 'DM', isZoneLocked: true });
    const dmConfig = await GoalConfig.findOne({ role: 'DM' });
    
    // Fetch expected commissions from GoalConfig (Fallback 30 for BS, 10 for PE if not found)
    const bsToDmCommission = dmConfig?.layeredCommissions?.find(l => (l.roleName || "").toLowerCase() === 'block supervisor')?.commission || 30;
    const peToDmCommission = dmConfig?.layeredCommissions?.find(l => (l.roleName || "").toLowerCase() === 'panchayat executive')?.commission || 10;

    let totalMissedAcrossSystem = 0;
    const report = [];

    console.log(`🔍 Scanning for missed commissions across ${dms.length} DMs...\n`);

    const chunkSize = 50;
    let processed = 0;

    for (let i = 0; i < dms.length; i += chunkSize) {
      const chunk = dms.slice(i, i + chunkSize);
      
      await Promise.all(chunk.map(async (dm) => {
        if (!dm.workingDistrict) return;
        
        const distName = dm.workingDistrict.toString().split('/')[0].trim();
        const safeDist = distName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const districtRegex = new RegExp(`^${safeDist}`, 'i');

        const subordinates = await Employee.find({
          role: { $in: ['BS', 'PE'] },
          workingDistrict: districtRegex
        });

        if (subordinates.length === 0) return;

        const dmTransactions = await Transaction.find({
          employeeId: dm._id,
          type: 'CREDIT_COMMISSION'
        }).select('remarks').lean();

        const subIds = subordinates.map(s => s._id);
        const allCards = await Card.find({ issuedBy: { $in: subIds } }).select('_id issuedBy').lean();

        for (const sub of subordinates) {
          const cards = allCards.filter(c => c.issuedBy.toString() === sub._id.toString());
          
          for (const card of cards) {
            const tx = dmTransactions.find(t => t.remarks && t.remarks.includes(card._id.toString()));

            if (!tx) {
              const expectedAmount = sub.role === 'BS' ? bsToDmCommission : peToDmCommission;
              totalMissedAcrossSystem += expectedAmount;
              
              report.push({
                DM_Name: dm.name,
                DM_District: distName,
                Issuer_Name: sub.name,
                Issuer_Role: sub.role,
                Card_ID: card._id.toString(),
                Missed_Amount: `₹${expectedAmount}`
              });
            }
          }
        }
      }));

      processed += chunk.length;
      console.log(`[${processed}/${dms.length}] DMs processed rapidly...`);
    }

    console.log("=========================================");
    console.log("📊 MISSED COMMISSION REPORT");
    console.log("=========================================");
    if (report.length > 0) {
      console.table(report);
      console.log(`\n💰 Total Missed Amount to be Credited: ₹${totalMissedAcrossSystem}`);
    } else {
      console.log("✅ No missed commissions found! Everything is perfectly distributed.");
    }
    console.log("=========================================\n");

  } catch (error) {
    console.error("❌ Error running script:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

findMissedCommissions();
