import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const BlockSchema = new mongoose.Schema({
    state: String,
    district: String,
    name: String,
    nameHi: String
});
const Block = mongoose.models.Block || mongoose.model('Block', BlockSchema);

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");
    
    const count = await Block.countDocuments();
    console.log("Total Blocks in DB:", count);

    // Fetch distinct states and districts in DB
    const states = await Block.distinct('state');
    const districts = await Block.distinct('district');
    console.log("Distinct States in DB:", states);
    console.log("Distinct Districts in DB:", districts);

    const blocks = await Block.find({
        $or: [
            { state: /guj/i },
            { district: /dwa/i }
        ]
    });
    console.log("Found matching blocks:", JSON.stringify(blocks, null, 2));
    await mongoose.disconnect();
}
run().catch(console.error);
