import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Block from '../models/Block.js';
import Panchayat from '../models/Panchayat.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';

dotenv.config();

const STATE = "TEST STATE / परीक्षण राज्य";
const DISTRICT = "TEST DISTRICT / परीक्षण जिला";
const PASSWORD = await bcrypt.hash("123456", 10);

const testUsers = [
  { phone: "9999999991", email: "test_rm@test.com", name: "TEST_RM", role: "RM", post: "Regional Manager", workingState: STATE, state: STATE },
  { phone: "9999999992", email: "test_dm@test.com", name: "TEST_DM", role: "DM", post: "District Manager", state: STATE },
  { phone: "9999999993", email: "test_bs@test.com", name: "TEST_BS", role: "BS", post: "Block Supervisor", state: STATE },
  { phone: "9999999994", email: "test_pe@test.com", name: "TEST_PE", role: "PE", post: "Panchayat Executive", state: STATE },
];

async function seedTestHierarchy() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully.");

    // 1. Create Block
    let testBlock = await Block.findOne({ state: STATE, district: DISTRICT, name: "TEST BLOCK" });
    if (!testBlock) {
      testBlock = new Block({
        state: STATE,
        district: DISTRICT,
        name: "TEST BLOCK"
      });
      await testBlock.save();
      console.log("Created TEST BLOCK");
    } else {
      console.log("TEST BLOCK already exists");
    }

    // 2. Create Panchayat
    let testPanchayat = await Panchayat.findOne({ state: STATE, district: DISTRICT, block: testBlock._id, name: "TEST PANCHAYAT" });
    if (!testPanchayat) {
      testPanchayat = new Panchayat({
        state: STATE,
        district: DISTRICT,
        block: testBlock._id,
        name: "TEST PANCHAYAT"
      });
      await testPanchayat.save();
      console.log("Created TEST PANCHAYAT");
    } else {
      console.log("TEST PANCHAYAT already exists");
    }

    // 3. Create Users and Employees
    for (const tu of testUsers) {
      let user = await User.findOne({ name: tu.name });
      if (!user) {
        user = new User({
          phone: tu.phone,
          email: tu.email,
          password: PASSWORD,
          role: "employee",
          name: tu.name
        });
        await user.save();
        console.log(`Created User: ${tu.name}`);
      } else {
        user.email = tu.email;
        await user.save();
        console.log(`Updated User with email: ${tu.name}`);
      }

      let emp = await Employee.findOne({ userId: user._id });
      if (!emp) {
        emp = new Employee({
          userId: user._id,
          name: tu.name,
          fatherName: "Test Father",
          dob: new Date("1990-01-01"),
          role: tu.role,
          designation: tu.post,
          createdBy: user._id, // self-created for simplicity
          status: "Active",
          workingState: tu.workingState || null,
          state: tu.state || null,
          onboardingComplete: true
        });
        await emp.save();
        console.log(`Created Employee: ${tu.name}`);
      } else {
        emp.onboardingComplete = true;
        emp.state = tu.state || null;
        await emp.save();
        console.log(`Updated Employee onboarding status & state: ${tu.name}`);
      }
    }

    console.log("\n=========================");
    console.log("SEEDING COMPLETED!");
    console.log("TEST_RM Login: test_rm@test.com / 123456");
    console.log("TEST_DM Login: test_dm@test.com / 123456");
    console.log("TEST_BS Login: test_bs@test.com / 123456");
    console.log("TEST_PE Login: test_pe@test.com / 123456");
    console.log("=========================\n");

  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

seedTestHierarchy();
