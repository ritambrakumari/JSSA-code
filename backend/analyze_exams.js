const mongoose = require('mongoose');
require('dotenv').config();

const CreatePaper = require('./models/CreatePaper');
const Attempt = require('./models/Attempt');
const Application = require('./models/Application');

async function analyze() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jssa');
  
  const allExams = await CreatePaper.find({ assignedStudents: { $not: { $size: 0 } } }).lean();
  console.log("Total Exams with students:", allExams.length);
  
  const now = new Date();
  let activeExams = 0;
  let expiredExams = 0;
  
  let totalAssignedToActive = new Set();
  
  allExams.forEach(exam => {
    const endOfDate = exam.endDate ? new Date(exam.endDate) : null;
    if (endOfDate) endOfDate.setHours(23, 59, 59, 999);
    const isExpired = endOfDate && endOfDate < now;
    
    if (isExpired) {
      expiredExams++;
    } else {
      activeExams++;
      (exam.assignedStudents || []).forEach(id => totalAssignedToActive.add(id.toString()));
    }
  });
  
  console.log(`Active Exams: ${activeExams}`);
  console.log(`Expired Exams: ${expiredExams}`);
  console.log(`Unique Students assigned to Active Exams: ${totalAssignedToActive.size}`);
  
  process.exit();
}

analyze().catch(console.error);
