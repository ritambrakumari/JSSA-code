import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Block from '../models/Block.js';
import Panchayat from '../models/Panchayat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function cleanup() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected successfully.");

        console.log("Fetching all blocks...");
        const allBlocks = await Block.find().sort({ createdAt: 1 });
        const seen = new Map();
        const toDelete = [];
        let mergedPanchCount = 0;

        for (const block of allBlocks) {
            const key = `${block.state}|${block.district}|${block.name}`.toLowerCase().trim();
            if (seen.has(key)) {
                const primaryId = seen.get(key);
                toDelete.push(block._id);
                // Move all panchayats from this duplicate block to the primary one
                const result = await Panchayat.updateMany({ block: block._id }, { block: primaryId });
                mergedPanchCount += result.modifiedCount;
            } else {
                seen.set(key, block._id);
            }
        }

        if (toDelete.length > 0) {
            console.log(`Deleting ${toDelete.length} duplicate blocks...`);
            await Block.deleteMany({ _id: { $in: toDelete } });
        }

        console.log("Fetching all panchayats...");
        const allPanchayats = await Panchayat.find().sort({ createdAt: 1 });
        const seenPanch = new Map();
        const panchToDelete = [];

        for (const panch of allPanchayats) {
            const key = `${panch.block}|${panch.name}`.toLowerCase().trim();
            if (seenPanch.has(key)) {
                panchToDelete.push(panch._id);
            } else {
                seenPanch.set(key, panch._id);
            }
        }

        if (panchToDelete.length > 0) {
            console.log(`Deleting ${panchToDelete.length} duplicate panchayats...`);
            await Panchayat.deleteMany({ _id: { $in: panchToDelete } });
        }

        console.log("Cleanup Report:");
        console.log(`- Duplicate Blocks Deleted: ${toDelete.length}`);
        console.log(`- Duplicate Panchayats Deleted: ${panchToDelete.length}`);
        console.log(`- Panchayats Re-linked: ${mergedPanchCount}`);

        process.exit(0);
    } catch (err) {
        console.error("Cleanup failed:", err);
        process.exit(1);
    }
}

cleanup();
