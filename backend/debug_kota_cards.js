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

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);

  const startOfMonth = new Date(2026, 5, 1); // 1st June

  // Find Anita
  const anita = await Employee.findOne({ name: /ANITA SHAKYAWAL/i }).lean();
  
  if (!anita) {
    console.log("Anita not found");
    process.exit();
  }

  const allEmployees = await Employee.find().lean();
  const empByUserId = new Map();
  allEmployees.forEach(e => {
    if (e.userId) empByUserId.set(e.userId.toString(), e);
  });

  const allCards = await Card.find({ createdAt: { $gte: startOfMonth } }).populate('issuedBy').lean();
  
  let targetScopeStr = anita.workingDistrict.split('/')[0].trim().toLowerCase();
  
  console.log(`Searching cards for Issuer District starting with: "${targetScopeStr}"`);
  
  let count = 0;
  allCards.forEach(card => {
    if (!card.issuedBy) return;
    const issuerUserId = card.issuedBy._id.toString();
    const issuer = empByUserId.get(issuerUserId);
    
    if (issuer && issuer.workingDistrict && issuer.workingDistrict.toString().toLowerCase().startsWith(targetScopeStr)) {
      count++;
      console.log(`[Card ${count}] ID: ${card.cardId || card._id}`);
      console.log(`   -> Issuer Name: ${issuer.name}`);
      console.log(`   -> Issuer Working District: ${issuer.workingDistrict}`);
      console.log(`   -> CARD's Printed District: ${card.district || 'N/A'}`);
    }
  });

  process.exit();
}

check();
