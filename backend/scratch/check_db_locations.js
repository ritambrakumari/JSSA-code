import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Block from '../models/Block.js';
import Panchayat from '../models/Panchayat.js';

dotenv.config();

async function checkDB() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully.");

    const totalBlocks = await Block.countDocuments();
    const totalPanchayats = await Panchayat.countDocuments();
    console.log(`Total Blocks in DB: ${totalBlocks}`);
    console.log(`Total Panchayats in DB: ${totalPanchayats}`);

    const uniqueStates = await Block.distinct('state');
    console.log("Unique States in Block collection:", uniqueStates);

    if (uniqueStates.length > 0) {
      for (const state of uniqueStates) {
        const districts = await Block.distinct('district', { state });
        console.log(`Districts in state "${state}":`, districts);
        for (const dist of districts) {
          const blocks = await Block.find({ state, district: dist }).limit(5);
          console.log(`Sample Blocks in "${state}" -> "${dist}":`, blocks.map(b => b.name));
        }
      }
    }

  } catch (error) {
    console.error("Error checking database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

checkDB();
