import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

// ==========================================
// CONFIGURATION
// ==========================================
// 1. Purana Email jo abhi "Created By" me dikh raha hai
const OLD_EMAIL = '9068182247sanjay@gmail.com'; 

// 2. Naya Email aur Phone jo aap update karna chahte hain
const NEW_EMAIL = 'ajaysuryawashimyohar996@gmail.com';
const NEW_PHONE = '9068182247';
// ==========================================

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to DB');
    const db = mongoose.connection.db;

    // Pehle us User ko dhoondhte hain jisko update karna hai
    const userToUpdate = await db.collection('users').findOne({ email: OLD_EMAIL });

    if (!userToUpdate) {
      console.log(`\n[ERROR] User with old email ${OLD_EMAIL} not found!`);
      process.exit(1);
    }

    // Check karte hain ki kya naya phone kisi aur user ke paas toh nahi hai
    const existingPhone = await db.collection('users').findOne({ phone: NEW_PHONE });
    if (existingPhone && existingPhone._id.toString() !== userToUpdate._id.toString()) {
      console.log(`\n[WARNING] The phone number ${NEW_PHONE} is already assigned to another user!`);
      process.exit(1);
    }

    // Check karte hain ki kya naya email kisi aur user ke paas toh nahi hai
    const existingEmail = await db.collection('users').findOne({ email: NEW_EMAIL });
    if (existingEmail && existingEmail._id.toString() !== userToUpdate._id.toString()) {
      console.log(`\n[WARNING] The email ${NEW_EMAIL} is already assigned to another user!`);
      process.exit(1);
    }

    // Ab User ko update karte hain
    const result = await db.collection('users').updateOne(
      { _id: userToUpdate._id },
      { $set: { phone: NEW_PHONE, email: NEW_EMAIL } }
    );

    if (result.modifiedCount > 0) {
      console.log(`\n[SUCCESS] Successfully updated user account!`);
      console.log(`New Email: ${NEW_EMAIL}`);
      console.log(`New Phone: ${NEW_PHONE}`);
    } else {
      console.log(`\n[INFO] No changes made. Maybe the details are already updated?`);
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('[ERROR] Database operation failed:', err);
    process.exit(1);
  });
