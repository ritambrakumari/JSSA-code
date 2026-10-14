import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Employee from './models/Employee.js';
import JobPosting from './models/JobPosting.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function setup() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Delete existing test employees and their users
    const testNames = [/DM/i, /BS/i, /PE/i];
    const employeesToDelete = await Employee.find({ name: { $in: testNames } });
    const userIdsToDelete = employeesToDelete.map(e => e.userId);

    await Employee.deleteMany({ _id: { $in: employeesToDelete.map(e => e._id) } });
    await User.deleteMany({ _id: { $in: userIdsToDelete } });
    console.log(`Deleted ${employeesToDelete.length} existing test accounts.`);

    // 2. Find Job Postings
    const dmPost = await JobPosting.findOne({ "post.en": /District Manager/i });
    const bsPost = await JobPosting.findOne({ "post.en": /Block Supervisor/i });
    const pePost = await JobPosting.findOne({ "post.en": /Panchayat Executive/i });

    if (!dmPost || !bsPost || !pePost) {
      console.error("Required JobPostings not found! DM:", !!dmPost, "BS:", !!bsPost, "PE:", !!pePost);
      process.exit(1);
    }

    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
        console.error("Admin user not found for createdBy field");
        process.exit(1);
    }

    // 3. Create 3 of each
    const createAccounts = async (prefix, post, count) => {
      for (let i = 1; i <= count; i++) {
        const phone = `9${(prefix === 'DM' ? 1111111 : (prefix === 'BS' ? 2222222 : 3333333))}0${i}`; // Exactly 10 digits
        const email = `${prefix.toLowerCase()}${i}@test.com`;
        const hashedPassword = await bcrypt.hash("password123", 10);
        
        const user = await User.create({
          phone: phone,
          email: email,
          password: hashedPassword,
          role: "employee"
        });

        await Employee.create({
          userId: user._id,
          name: `${prefix} ${i}`,
          fatherName: "Test Father",
          dob: new Date("1990-01-01"),
          jobPostingId: post._id,
          role: prefix,
          designation: post.post.en,
          createdBy: adminUser._id,
          onboardingComplete: true
        });
        console.log(`Created ${prefix} ${i} | Phone: ${phone} | Pass: password123`);
      }
    };

    await createAccounts("DM", dmPost, 3);
    await createAccounts("BS", bsPost, 3);
    await createAccounts("PE", pePost, 3);

    console.log("\nSetup complete! Created 9 fresh accounts.");
    process.exit(0);
  } catch (error) {
    console.error("Setup failed:", error);
    process.exit(1);
  }
}

setup();
