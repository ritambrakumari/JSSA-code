import express from 'express';
import Block from '../models/Block.js';
import Panchayat from '../models/Panchayat.js';
import District from '../models/District.js';
import { authenticate } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Employee from '../models/Employee.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();






// Read states and districts from frontend data dynamically
const getBilingualStateAndDistrict = (cleanState, cleanDistrict) => {
    try {
        const statesPath = path.resolve(__dirname, '../../frontend/src/data/states.json');
        const districtsPath = path.resolve(__dirname, '../../frontend/src/data/district.json');

        let stateKey = cleanState;
        let districtKey = cleanDistrict;

        if (fs.existsSync(statesPath)) {
            const statesData = JSON.parse(fs.readFileSync(statesPath, 'utf8'));
            const matchedState = statesData.find(s => s.split(' / ')[0].trim().toLowerCase() === cleanState.toLowerCase());
            if (matchedState) stateKey = matchedState;
        }

        if (fs.existsSync(districtsPath)) {
            const districtsData = JSON.parse(fs.readFileSync(districtsPath, 'utf8'));
            const stateList = districtsData[stateKey] || [];
            const matchedDist = stateList.find(d => d.split(' / ')[0].trim().toLowerCase() === cleanDistrict.toLowerCase());
            if (matchedDist) districtKey = matchedDist;
        }

        return { stateKey, districtKey };
    } catch (err) {
        console.error("Error reading bilingual mappings:", err);
        return { stateKey: cleanState, districtKey: cleanDistrict };
    }
};

// Helper to compile robust, bilingual-aware, casing-insensitive regular expressions with phonetic vowel and spacing flexibility
const makeRobustRegex = (term) => {
    if (!term) return null;
    let clean = term.includes(' / ') ? term.split(' / ')[0] : term;
    clean = clean.trim();

    // Escape special regex characters except we will handle space/hyphen/vowels specially
    let escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 1. Replace o, oo, u with [ou]+ to allow Devbhoomi <-> Devbhumi, etc.
    escaped = escaped.replace(/(?:oo|o|u)+/gi, '[ou]+');

    // 2. Replace e, ee, i, y with [eiy]+ to allow seekim <-> sikkim, etc.
    escaped = escaped.replace(/(?:ee|e|i|y)+/gi, '[eiy]+');

    // 3. Replace aa, a with a+ to allow Banas Kantha <-> Banaskantha, etc.
    escaped = escaped.replace(/(?:aa|a)+/gi, 'a+');

    // 4. Handle spacing/hyphen flexibility (make spaces/hyphens/underscores optional)
    escaped = escaped.replace(/[\s_-]+/g, '[\\s_-]*');

    return new RegExp(`^${escaped}(?:\\s*/.*)?$`, 'i');
};

// Default seeding completely disabled to prevent any default blocks/panchayats in DB


// --- STATS ROUTE ---
router.get('/stats', async (req, res) => {
    try {
        const { state, district } = req.query;
        let query = {};
        if (state) query.state = { $regex: makeRobustRegex(state) };
        if (district) query.district = { $regex: makeRobustRegex(district) };

        // Use Promise.all to fetch counts in parallel
        const [panchayatCount, blockCount, distinctDistricts, distinctStates] = await Promise.all([
            Panchayat.countDocuments(query),
            Block.countDocuments(query),
            Panchayat.distinct("district", query),
            Panchayat.distinct("state", query)
        ]);

        res.json({
            success: true,
            data: {
                states: distinctStates.length,
                districts: distinctDistricts.length,
                blocks: blockCount,
                panchayats: panchayatCount
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all distinct states
router.get('/states', async (req, res) => {
    try {
        const states = await Panchayat.distinct("state");
        res.json({ success: true, data: states.sort() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- DISTRICT ROUTES ---

// Get custom districts for a state
router.get('/districts', async (req, res) => {
    try {
        const { state } = req.query;
        let query = {};
        if (state) query.state = { $regex: makeRobustRegex(state) };
        const districts = await District.find(query).sort({ name: 1 });
        // Return array of district objects
        res.json({ success: true, data: districts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin & RM: Create custom District
router.post('/districts', authenticate, async (req, res) => {
    try {
        let isAuthorized = false;
        if (['admin', 'superadmin', 'staff'].includes(req.user.role)) {
            isAuthorized = true;
        } else if (req.user.role === 'employee') {
            const emp = await Employee.findOne({ userId: req.user.id });
            if (emp && (emp.role === 'RM' || emp.role === 'ZC')) isAuthorized = true;
        }

        if (!isAuthorized) return res.status(403).json({ error: 'Access denied: Only RM, ZC, or Admin can perform this action' });

        const { state, name, nameHi } = req.body;
        const district = new District({ state, name, nameHi });
        await district.save();
        res.status(201).json({ success: true, data: district });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- BLOCK ROUTES ---

// Get all blocks (public/user side with filters)
router.get('/blocks', async (req, res) => {
    try {
        const { state, district, page = 1, limit = 13, all, search } = req.query;
        let query = {};
        if (state) query.state = { $regex: makeRobustRegex(state) };
        if (district) query.district = { $regex: makeRobustRegex(district) };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { nameHi: { $regex: search, $options: 'i' } }
            ];
        }


        if (all === 'true') {
            const blocks = await Block.find(query).sort({ name: 1 });
            return res.json(blocks);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Block.countDocuments(query);
        const blocks = await Block.find(query).sort({ name: 1 }).skip(skip).limit(parseInt(limit));

        res.json({
            data: blocks,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin & RM: Create Block
router.post('/blocks', authenticate, async (req, res) => {
    try {
        let isAuthorized = false;
        if (['admin', 'superadmin', 'staff'].includes(req.user.role)) {
            isAuthorized = true;
        } else if (req.user.role === 'employee') {
            const emp = await Employee.findOne({ userId: req.user.id });
            if (emp && (emp.role === 'RM' || emp.role === 'ZC')) isAuthorized = true;
        }

        if (!isAuthorized) return res.status(403).json({ error: 'Access denied: Only RM, ZC, or Admin can perform this action' });
        const { state, district, name, nameHi } = req.body;
        const block = new Block({ state, district, name, nameHi });
        await block.save();
        res.status(201).json(block);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin: Bulk Create Blocks
router.post('/blocks/bulk', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
        const blocks = req.body; // Expecting array
        if (!Array.isArray(blocks)) return res.status(400).json({ error: 'Expected an array of blocks' });

        const result = await Block.insertMany(blocks, { ordered: false });
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin: Update Block
router.put('/blocks/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
        const block = await Block.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(block);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin: Delete Block
router.delete('/blocks/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
        await Block.findByIdAndDelete(req.params.id);
        await Panchayat.deleteMany({ block: req.params.id });
        res.json({ message: 'Block and associated Panchayats deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Bulk Delete Blocks
router.delete('/blocks-bulk', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
        const { ids } = req.body;
        if (!Array.isArray(ids)) return res.status(400).json({ error: 'Expected an array of ids' });

        await Block.deleteMany({ _id: { $in: ids } });
        await Panchayat.deleteMany({ block: { $in: ids } });
        res.json({ message: 'Selected blocks and associated Panchayats deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Bulk Sync Blocks & Panchayats (Unified 4-column CSV)
router.post('/sync-bulk', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
        const rows = req.body; // Expecting array of { state, district, blockName, name (panchayat), nameHi }

        if (!Array.isArray(rows)) return res.status(400).json({ error: 'Expected an array of location data' });

        let blockCount = 0;
        let panchayatCount = 0;

        // Cache block IDs in memory to avoid repeated lookups for the same block in the loop
        const blockCache = new Map();

        // 1. Fetch all unique block combinations from this batch to minimize queries
        const blockCombos = new Set();
        rows.forEach(r => {
            if (r.state && r.district && r.blockName) {
                // Keep original casing for search but use lowercase key for blockCombos set to avoid internal duplicates in batch
                blockCombos.add(`${r.state.trim()}|${r.district.trim()}|${r.blockName.trim()}`.toLowerCase());
            }
        });

        // 2. Load existing blocks into cache. We use regex for case-insensitive search.
        const existingBlocks = await Block.find({
            $or: Array.from(blockCombos).map(combo => {
                const [s, d, n] = combo.split('|');
                return {
                    state: { $regex: makeRobustRegex(s) },
                    district: { $regex: makeRobustRegex(d) },
                    name: { $regex: makeRobustRegex(n) }
                };
            })
        });

        existingBlocks.forEach(b => {
            const key = `${b.state}|${b.district}|${b.name}`.toLowerCase();
            // If multiple exist, we just cache the first one found
            if (!blockCache.has(key)) blockCache.set(key, b._id);
        });

        // 3. Process each row
        const panchayatBatch = [];

        for (const row of rows) {
            const { state, district, blockName, blockNameHi, name: panchayatName, nameHi: panchayatNameHi } = row;
            if (!state || !district || !blockName || !panchayatName) continue;

            const blockKey = `${state}|${district}|${blockName}`.toLowerCase();
            let blockId = blockCache.get(blockKey);

            if (!blockId) {
                // If block doesn't exist even in current session's new blocks
                const block = new Block({ state, district, name: blockName, nameHi: blockNameHi });
                await block.save(); // Still need to save blocks one by one to get IDs, but much fewer than panchayats
                blockCount++;
                blockId = block._id;
                blockCache.set(blockKey, blockId);
            }

            panchayatBatch.push({
                state,
                district,
                block: blockId,
                name: panchayatName,
                nameHi: panchayatNameHi || panchayatName // Fallback
            });
        }

        // 4. Bulk Upsert Panchayats (Use insertMany with ordered: false to skip duplicates)
        if (panchayatBatch.length > 0) {
            try {
                // We use insertMany for speed. To handle existing ones, we'd need bulkWrite, 
                // but usually syncing implies adding new ones.
                const result = await Panchayat.insertMany(panchayatBatch, { ordered: false });
                panchayatCount = result.length;
            } catch (err) {
                // insertMany throws if some fail (e.g. duplicates), but ordered:false ensures others are saved
                panchayatCount = err.insertedDocs ? err.insertedDocs.length : 0;
            }
        }

        res.json({
            message: "Sync completed",
            stats: {
                blockCount,
                panchayatCount
            }
        });
    } catch (err) {
        console.error("Sync bulk error:", err);
        res.status(400).json({ error: err.message });
    }
});

// Admin: Deduplicate Data (Cleanup Route)
router.post('/deduplicate', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

        console.log("Starting deduplication...");
        const allBlocks = await Block.find().sort({ createdAt: 1 });
        const seen = new Map();
        const toDelete = [];
        const mergedPanchayats = [];

        for (const block of allBlocks) {
            const key = `${block.state}|${block.district}|${block.name}`.toLowerCase().trim();
            if (seen.has(key)) {
                const primaryId = seen.get(key);
                toDelete.push(block._id);
                // Move all panchayats from this block to the primary one
                const result = await Panchayat.updateMany({ block: block._id }, { block: primaryId });
                mergedPanchayats.push({ from: block._id, to: primaryId, count: result.modifiedCount });
            } else {
                seen.set(key, block._id);
            }
        }

        if (toDelete.length > 0) {
            await Block.deleteMany({ _id: { $in: toDelete } });
        }

        // Now deduplicate panchayats within each block
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
            await Panchayat.deleteMany({ _id: { $in: panchToDelete } });
        }

        res.json({
            success: true,
            message: "Deduplication completed",
            stats: {
                blocksDeleted: toDelete.length,
                panchayatsDeleted: panchToDelete.length,
                merges: mergedPanchayats
            }
        });
    } catch (err) {
        console.error("Deduplication error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Bulk Delete by State
router.delete('/delete-by-state', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
        const { state } = req.body;
        if (!state) return res.status(400).json({ error: 'State is required' });

        const [panchayatResult, blockResult] = await Promise.all([
            Panchayat.deleteMany({ state }),
            Block.deleteMany({ state })
        ]);

        res.json({
            success: true,
            message: `Deleted all locations for ${state}`,
            data: {
                panchayatsDeleted: panchayatResult.deletedCount,
                blocksDeleted: blockResult.deletedCount
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PANCHAYAT ROUTES ---

// Get panchayats (with optional pagination and filters)
router.get('/panchayats', async (req, res) => {
    try {
        const { blockId, state, district, page = 1, limit = 50, all = false, search } = req.query;
        let query = {};
        if (blockId) query.block = blockId;
        if (state) query.state = { $regex: makeRobustRegex(state) };
        if (district) query.district = { $regex: makeRobustRegex(district) };
        if (search) {
            const matchingBlocks = await Block.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { nameHi: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const blockIds = matchingBlocks.map(b => b._id);

            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { nameHi: { $regex: search, $options: 'i' } },
                { district: { $regex: search, $options: 'i' } },
                { block: { $in: blockIds } }
            ];
        }

        if (all === 'true') {
            const panchayats = await Panchayat.find(query).populate('block').sort({ name: 1 });
            return res.json(panchayats);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Panchayat.countDocuments(query);
        const panchayats = await Panchayat.find(query)
            .populate('block')
            .sort({ name: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            data: panchayats,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin & RM: Create Panchayat
router.post('/panchayats', authenticate, async (req, res) => {
    try {
        let isAuthorized = false;
        if (['admin', 'superadmin', 'staff'].includes(req.user.role)) {
            isAuthorized = true;
        } else if (req.user.role === 'employee') {
            const emp = await Employee.findOne({ userId: req.user.id });
            if (emp && (emp.role === 'RM' || emp.role === 'ZC')) isAuthorized = true;
        }

        if (!isAuthorized) return res.status(403).json({ error: 'Access denied: Only RM, ZC, or Admin can perform this action' });
        const { state, district, block, name, nameHi } = req.body;
        const panchayat = new Panchayat({ state, district, block, name, nameHi });
        await panchayat.save();
        res.status(201).json(panchayat);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin: Bulk Create Panchayats
router.post('/panchayats/bulk', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
        const panchayats = req.body; // Expecting array
        if (!Array.isArray(panchayats)) return res.status(400).json({ error: 'Expected an array' });

        const result = await Panchayat.insertMany(panchayats, { ordered: false });
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin: Update Panchayat
router.put('/panchayats/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
        const panchayat = await Panchayat.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(panchayat);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin: Delete Panchayat
router.delete('/panchayats/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
        await Panchayat.findByIdAndDelete(req.params.id);
        res.json({ message: 'Panchayat deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Bulk Delete Panchayats
router.delete('/panchayats-bulk', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
        const { ids } = req.body;
        if (!Array.isArray(ids)) return res.status(400).json({ error: 'Expected an array of ids' });

        await Panchayat.deleteMany({ _id: { $in: ids } });
        res.json({ message: 'Selected panchayats deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
