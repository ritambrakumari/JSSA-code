import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Employee from './models/Employee.js';
import JobPosting from './models/JobPosting.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

const designations = [
  { en: "District Manager", hi: "जिला प्रबंधक" },
  { en: "Block Supervisor", hi: "ब्लॉक पर्यवेक्षक" },
  { en: "Panchayat Executive", hi: "पंचायत कार्यकारी" }
];

const testEmployees = [
  { name: "DM Manual", email: "dm_test@jssa.com", phone: "9200000001", post: "District Manager", role: "DM" },
  { name: "BS Manual", email: "bs_test@jssa.com", phone: "9200000002", post: "Block Supervisor", role: "BS" },
  { name: "PE Manual", email: "pe_test@jssa.com", phone: "9200000003", post: "Panchayat Executive", role: "PE" },
  
  // Adding 6 more to make it 9 as requested
  { name: "DM Test 2", email: "dm2_test@jssa.com", phone: "9200000004", post: "District Manager", role: "DM" },
  { name: "BS Test 2", email: "bs2_test@jssa.com", phone: "9200000005", post: "Block Supervisor", role: "BS" },
  { name: "PE Test 2", email: "pe2_test@jssa.com", phone: "9200000006", post: "Panchayat Executive", role: "PE" },
  { name: "DM Test 3", email: "dm3_test@jssa.com", phone: "9200000007", post: "District Manager", role: "DM" },
  { name: "BS Test 3", email: "bs3_test@jssa.com", phone: "9200000008", post: "Block Supervisor", role: "BS" },
  { name: "PE Test 3", email: "pe3_test@jssa.com", phone: "9200000009", post: "Panchayat Executive", role: "PE" },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Cleanup: Remove all old test accounts including Alpha/Beta/Gamma
    const cleanupEmails = [
      "dm_test@jssa.com", "bs_test@jssa.com", "pe_test@jssa.com",
      "dm2_test@jssa.com", "bs2_test@jssa.com", "pe2_test@jssa.com",
      "dm3_test@jssa.com", "bs3_test@jssa.com", "pe3_test@jssa.com",
      "dm_alpha@jssa.com", "bs_alpha@jssa.com", "pe_alpha@jssa.com",
      "dm_beta@jssa.com", "bs_beta@jssa.com", "pe_beta@jssa.com",
      "dm_gamma@jssa.com", "bs_gamma@jssa.com", "pe_gamma@jssa.com"
    ];
    
    const existingUsers = await User.find({ email: { $in: cleanupEmails } });
    const existingUserIds = existingUsers.map(u => u._id);
    
    await Employee.deleteMany({ userId: { $in: existingUserIds } });
    await User.deleteMany({ email: { $in: cleanupEmails } });
    console.log("Cleanup complete. Ready for manual linking test.");

    const adminUser = await User.findOne({ role: "admin" });
    const adminId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();

    // 2. Create 9 Accounts (UNLINKED & UNLOCKED)
    for (const emp of testEmployees) {
      const des = designations.find(d => d.en === emp.post);
      let job = await JobPosting.findOne({ "post.en": emp.post });
      if (!job) {
        job = await JobPosting.create({
          advtNo: `MANUAL-TEST-${emp.post.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`,
          title: `Manual Test ${emp.post}`,
          post: { en: des.en, hi: des.hi },
          date: new Date().toISOString(),
          income: { en: "15k - 25k", hi: "15000 - 25000" },
          incomeMin: 15000,
          incomeMax: 25000,
          location: { en: "Manual", hi: "मैनुअल" },
          createdBy: adminId,
          lastDate: "2025-12-31",
          applicationOpeningDate: "2024-01-01",
          ageLimit: { en: "18-40 Years", hi: "18-40 वर्ष" },
          ageAsOn: "2024-01-01"
        });
      }

      const hashedPassword = await bcrypt.hash("password123", 10);
      const user = await User.create({
        email: emp.email,
        phone: emp.phone,
        password: hashedPassword,
        role: "employee",
        isPhoneVerified: true
      });

      await Employee.create({
        userId: user._id,
        name: emp.name,
        phone: emp.phone,
        fatherName: "Manual Test Father",
        dob: new Date("1995-01-01"),
        designation: emp.post,
        role: emp.role,
        jobPostingId: job._id,
        isZoneLocked: false, // Set to false so you can lock manually
        status: "Active",
        onboardingComplete: true,
        createdBy: adminId,
        reportingTo: null // NO LINKING
      });

      console.log(`Created (Unlinked): ${emp.name}`);
    }

    console.log("✅ 9 Manual test accounts created. No linking performed.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
