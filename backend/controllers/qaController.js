import QuestionAnswer from "../models/QuestionAnswer.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";

/**
 * Employee: Ask a new question
 */
export const askQuestion = async (req, res) => {
  try {
    const { subject, question } = req.body;
    const userId = req.user.id;

    const employee = await Employee.findOne({ userId });
    
    const newQA = new QuestionAnswer({
      userId,
      employeeId: employee?._id,
      subject,
      question,
      status: 'pending'
    });

    await newQA.save();

    res.status(201).json({
      success: true,
      message: "Question submitted successfully",
      data: newQA
    });
  } catch (error) {
    console.error("Ask Question Error:", error);
    res.status(500).json({ success: false, message: "Failed to submit question" });
  }
};

/**
 * Employee: Get my questions
 */
export const getMyQuestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const questions = await QuestionAnswer.find({ userId })
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit));

    const total = await QuestionAnswer.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: questions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get My Questions Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch questions" });
  }
};

/**
 * Admin: Get all questions
 */
export const getAllQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 15, status, search, startDate, endDate, designation } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const matchQuery = {};
    if (status && status !== 'all') {
      matchQuery.status = status;
    }

    if (search && search.trim()) {
      matchQuery.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { question: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.createdAt.$lte = end;
      }
    }

    // Dynamic collection names from models to avoid hardcoding issues
    const employeeColl = Employee.collection.name;
    const userColl = User.collection.name;

    let pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: employeeColl,
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      { $unwind: { path: '$employeeData', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: userColl,
          localField: 'userId',
          foreignField: '_id',
          as: 'userData'
        }
      },
      { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } }
    ];

    // Apply designation filter BEFORE count and limit
    if (designation && designation !== 'all') {
      // Map frontend labels to backend role codes for robust matching
      const roleMap = {
        'DISTRICT MANAGER': 'DM',
        'BLOCK SUPERVISOR': 'BS',
        'PANCHAYAT EXECUTIVE': 'PE',
        'REGIONAL MANAGER': 'RM',
        'ZONAL COORDINATOR': 'ZC'
      };
      
      const shortCode = roleMap[designation.toUpperCase()];
      const searchRegex = new RegExp(`^${designation}`, 'i'); // Starts with designation

      const matchConditions = [
        { 'employeeData.designation': { $regex: searchRegex } }
      ];

      if (shortCode) {
        matchConditions.push({ 'employeeData.role': shortCode });
      }

      // Special case for Block Supervisor matching "Block Supervisor Cum..."
      if (designation === 'BLOCK SUPERVISOR') {
        matchConditions.push({ 'employeeData.role': 'BS' });
      }
      
      pipeline.push({
        $match: { $or: matchConditions }
      });
    }

    // Accurate total count based on filtered pipeline
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await QuestionAnswer.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Sorting and Pagination
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const rawQuestions = await QuestionAnswer.aggregate(pipeline);

    // Map back to expected structure
    const questions = rawQuestions.map(q => ({
      ...q,
      employeeId: q.employeeData,
      userId: q.userData
    }));

    res.status(200).json({
      success: true,
      data: questions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Aggregation Error:", error);
    res.status(500).json({ success: false, message: "Server error during filtering" });
  }
};

/**
 * RM: Get questions for RM's state
 */
export const getRMQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 15, status, search, startDate, endDate, designation } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.user.id;

    const rmEmployee = await Employee.findOne({ userId });
    if (!rmEmployee || !rmEmployee.workingState) {
      return res.status(403).json({ success: false, message: "RM working state not found" });
    }

    if (rmEmployee.role !== 'RM' && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: "Only RM can access this resource" });
    }

    // Clean state name for flexible matching
    const cleanRmState = rmEmployee.workingState.split(" / ")[0].trim();

    const matchQuery = {};
    if (status && status !== 'all') {
      matchQuery.status = status;
    }

    if (search && search.trim()) {
      matchQuery.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { question: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.createdAt.$lte = end;
      }
    }

    const employeeColl = Employee.collection.name;
    const userColl = User.collection.name;

    let pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: employeeColl,
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      { $unwind: { path: '$employeeData', preserveNullAndEmptyArrays: true } }
    ];

    // Debugging: Log the pipeline results before state matching
    const debugResults = await QuestionAnswer.aggregate(pipeline);
    import('fs').then(fs => {
      fs.writeFileSync('C:/Users/DELL/.gemini/antigravity-ide/brain/aca16afd-a45b-43ec-95b2-6eb321947b2d/scratch/qa_debug.json', JSON.stringify({
        rmState: cleanRmState,
        results: debugResults.map(r => ({
          subject: r.subject,
          empId: r.employeeId,
          workingState: r.employeeData?.workingState,
          state: r.employeeData?.state
        }))
      }, null, 2));
    });

    // Apply the RM state match
    pipeline.push({
      $match: {
        $or: [
          { 'employeeData.workingState': { $regex: new RegExp(`^${cleanRmState}`, 'i') } },
          { 'employeeData.state': { $regex: new RegExp(`^${cleanRmState}`, 'i') } }
        ]
      }
    });

    pipeline.push({
      $lookup: {
          from: userColl,
          localField: 'userId',
          foreignField: '_id',
          as: 'userData'
        }
      },
      { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } }
    );

    if (designation && designation !== 'all') {
      const roleMap = {
        'DISTRICT MANAGER': 'DM',
        'BLOCK SUPERVISOR': 'BS',
        'PANCHAYAT EXECUTIVE': 'PE',
        'REGIONAL MANAGER': 'RM',
        'ZONAL COORDINATOR': 'ZC'
      };
      
      const shortCode = roleMap[designation.toUpperCase()];
      const searchRegex = new RegExp(`^${designation}`, 'i'); 

      const matchConditions = [
        { 'employeeData.designation': { $regex: searchRegex } }
      ];

      if (shortCode) {
        matchConditions.push({ 'employeeData.role': shortCode });
      }

      if (designation === 'BLOCK SUPERVISOR') {
        matchConditions.push({ 'employeeData.role': 'BS' });
      }
      
      pipeline.push({
        $match: { $or: matchConditions }
      });
    }

    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await QuestionAnswer.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const rawQuestions = await QuestionAnswer.aggregate(pipeline);

    const questions = rawQuestions.map(q => ({
      ...q,
      employeeId: q.employeeData,
      userId: q.userData
    }));

    res.status(200).json({
      success: true,
      data: questions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Aggregation Error (RM):", error);
    res.status(500).json({ success: false, message: "Server error during filtering" });
  }
};

/**
 * Admin: Answer a question
 */
export const answerQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;
    const adminId = req.user.id;

    const qa = await QuestionAnswer.findById(id);
    if (!qa) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    qa.answer = answer;
    qa.status = 'answered';
    qa.answeredBy = adminId;
    qa.answeredAt = new Date();

    await qa.save();

    res.status(200).json({
      success: true,
      message: "Answered successfully",
      data: qa
    });
  } catch (error) {
    console.error("Answer Question Error:", error);
    res.status(500).json({ success: false, message: "Failed to submit answer" });
  }
};

/**
 * Delete Question
 */
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    await QuestionAnswer.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};
