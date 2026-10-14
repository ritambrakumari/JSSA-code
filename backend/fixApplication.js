import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

// ==========================================
// CONFIGURATION
// ==========================================
const APPLICATION_NUMBER = '231409792'; 
const CORRECT_USER_EMAIL = 'ajaysuryawashimyohar996@gmail.com';
// ==========================================

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to DB');
    const db = mongoose.connection.db;

    // 1. Find the CORRECT User account
    const correctUser = await db.collection('users').findOne({ email: CORRECT_USER_EMAIL });

    if (!correctUser) {
      console.log(`\n[ERROR] User with email ${CORRECT_USER_EMAIL} not found!`);
      process.exit(1);
    }
    console.log(`\n[INFO] Found Correct User: ${correctUser.email} (ID: ${correctUser._id})`);

    // 2. Find the Application
    const application = await db.collection('applications').findOne({ applicationNumber: APPLICATION_NUMBER });

    if (!application) {
      console.log(`\n[ERROR] Application number ${APPLICATION_NUMBER} not found!`);
      process.exit(1);
    }
    console.log(`[INFO] Found Application for candidate: ${application.candidateName}`);

    // 3. Update the Application's createdBy field to point to the correct user
    const result = await db.collection('applications').updateOne(
      { _id: application._id },
      { $set: { createdBy: correctUser._id } }
    );

    if (result.modifiedCount > 0) {
      console.log(`\n[SUCCESS] Successfully linked Application to the correct User!`);
      console.log(`Ab jab yeh user login karega, toh usko apni application sahi se dikhai degi.`);
    } else {
      console.log(`\n[INFO] No changes made. Application pehle se hi is user se linked hai.`);
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('[ERROR] Database operation failed:', err);
    process.exit(1);
  });
