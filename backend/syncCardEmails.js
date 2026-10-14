import mongoose from "mongoose";
import User from "./models/User.js";
import Card from "./models/Card.js";
import dotenv from "dotenv";
dotenv.config();

const syncCardEmails = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB. Starting email sync for existing card holders...");

    const cards = await Card.find({ email: { $exists: true, $ne: "" }, cardHolderUser: { $exists: true } });
    let updatedCount = 0;
    let skippedDuplicateCount = 0;
    let skippedAlreadyLinkedCount = 0;

    for (const card of cards) {
      const email = card.email.toLowerCase().trim();
      
      const cardUser = await User.findById(card.cardHolderUser);
      if (!cardUser) continue;

      if (cardUser.email === email) {
        skippedAlreadyLinkedCount++;
        continue;
      }

      // Check if this email is already used by another user (like an Employee)
      const existingUserWithEmail = await User.findOne({ email });
      
      if (existingUserWithEmail) {
        // Email is already taken by someone else
        skippedDuplicateCount++;
      } else {
        // Safe to link
        cardUser.email = email;
        await cardUser.save();
        updatedCount++;
        console.log(`Linked email ${email} to CardHolder ${cardUser.phone}`);
      }
    }

    console.log("\n--- Sync Summary ---");
    console.log(`Total Cards with email: ${cards.length}`);
    console.log(`Successfully linked emails: ${updatedCount}`);
    console.log(`Skipped (Email already linked): ${skippedAlreadyLinkedCount}`);
    console.log(`Skipped (Email taken by another User/Employee): ${skippedDuplicateCount}`);

    process.exit(0);
  } catch (error) {
    console.error("Error during sync:", error);
    process.exit(1);
  }
};

syncCardEmails();
