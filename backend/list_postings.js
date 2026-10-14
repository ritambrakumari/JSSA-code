import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("DB Connected!");

  const JobPosting = mongoose.model("JobPosting", new mongoose.Schema({
    title: String,
    post: {
      en: String,
      hi: String
    }
  }));

  const postings = await JobPosting.find({});
  console.log("Job Postings in DB:");
  postings.forEach(p => {
    console.log(`- ID: ${p._id}, Title: "${p.title}", Post EN: "${p.post?.en}", Post HI: "${p.post?.hi}"`);
  });

  const Employee = mongoose.model("Employee", new mongoose.Schema({
    name: String,
    designation: String,
    role: String
  }));

  const avadhesh = await Employee.findOne({ name: /avadh/i });
  console.log("Avadhesh in DB:", avadhesh);

  await mongoose.disconnect();
}

run().catch(console.error);
