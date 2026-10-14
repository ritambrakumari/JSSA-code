import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const updateApp = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB:", mongoose.connection.name);

    const Application = mongoose.model("Application", new mongoose.Schema({}, { strict: false }));
    
    // Application ID from URL: 69e9df39d90ad031c5512080
    // Target user ID from Screenshot: 6a0472885fed9eee5617b249
    const appId = "69e9df39d90ad031c5512080";
    const userId = "6a0472885fed9eee5617b249";

    const result = await Application.updateOne(
      { _id: new mongoose.Types.ObjectId(appId) },
      { $set: { createdBy: new mongoose.Types.ObjectId(userId) } }
    );

    console.log("Update result:", result);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

updateApp();
