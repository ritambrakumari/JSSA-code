import mongoose from "mongoose";
import Card from "./models/Card.js";
import dotenv from "dotenv";
dotenv.config();

const getTestLogins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find a few cards with emails that are linked
    const cards = await Card.find({ email: { $in: ["jk@gmail.com", "jiliqaver@mailinator.com"] } });
    
    console.log("--- Test Card Holder Logins ---\n");
    for (const card of cards) {
      const d = new Date(card.dob);
      const password = `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
      console.log(`Email: ${card.email}`);
      console.log(`Mobile: ${card.mobileNumber}`);
      console.log(`Password (DOB): ${password}`);
      console.log("------------------------");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

getTestLogins();
