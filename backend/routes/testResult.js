import express from 'express';
import { authenticate as auth } from '../middleware/auth.js';
import Attempt from '../models/Attempt.js';
import Application from '../models/Application.js';

const router = express.Router();

// @route   GET api/test-result
// @desc    Get test results (list only, basic info)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only show personal results
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    }

    // Only show results for COMPLETED exams (where endTime exists)
    const completedQuery = { ...query, endTime: { $exists: true } };

    const attempts = await Attempt.find(completedQuery)
       .select('_id testId applicationId userId score startTime endTime createdAt')
       .populate({
         path: 'testId',
         select: '_id title type difficulty totalMarks passingMarks duration'
       })
       .populate({
         path: 'applicationId',
         select: 'candidateName mobile applicationNumber district'
       })
       .sort({ createdAt: -1 });

    if (!attempts || attempts.length === 0) {
      return res.json([]);
    }

    const testResults = attempts.map((attempt) => {
      const test = attempt.testId || {};
      const app = attempt.applicationId || {};
      const totalMarks = test.totalMarks || 100;
      const score = attempt.score || 0;
      const passingMarks = test.passingMarks || 0;

      return {
        id: attempt._id,
        testId: test._id, // Added this field for frontend filtering
        student: app.candidateName || 'N/A',
        applicationNumber: app.applicationNumber || 'N/A',
        mobile: app.mobile || 'N/A',
        district: app.district || 'N/A',
        testTitle: test.title || 'Deleted Test',
        type: test.type || 'General',
        difficulty: test.difficulty || 'Mixed',
        score: score,
        totalMarks: totalMarks,
        pct: Math.round((score / totalMarks) * 100),
        status: score >= passingMarks ? 'pass' : 'fail',
        completedAt: attempt.endTime || attempt.createdAt,
      };
    });

    res.json(testResults);
  } catch (err) {
    console.error('Test Result List Error:', err.message);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

// @route   GET api/test-result/:id
// @desc    Get specific test result details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
       .populate('testId')
       .populate({
         path: 'applicationId',
         select: 'candidateName mobile email district higherEducation applicationNumber fatherName dob gender category aadhar pan address state block panchayat pincode board marks markPercentage photo signature'
       })
       .populate({
         path: 'userId',
         select: 'phone email'
       });

    if (!attempt) {
      return res.status(404).json({ error: 'Result not found' });
    }

    // Role-based check: applicants can only see their own results
    if (req.user.role !== 'admin' && attempt.userId?._id?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const test = attempt.testId || {};
    const app = attempt.applicationId || {};
    const user = attempt.userId || {};
    const totalMarks = test.totalMarks || 100;
    const score = attempt.score || 0;
    const passingMarks = test.passingMarks || 0;

    const resultDetails = {
      id: attempt._id,
      student: app.candidateName || 'N/A',
      applicationNumber: app.applicationNumber || 'N/A',
      mobile: app.mobile || user.phone || 'N/A',
      email: app.email || user.email || 'N/A',
      district: app.district || 'N/A',
      education: app.higherEducation || 'N/A',
      testTitle: test.title || 'Deleted Test',
      type: test.type || 'General',
      difficulty: test.difficulty || 'Mixed',
      score: score,
      totalMarks: totalMarks,
      pct: Math.round((score / totalMarks) * 100),
      duration: test.duration || 0,
      timeTaken: attempt.endTime ? Math.round((new Date(attempt.endTime) - new Date(attempt.startTime)) / 60000) : 0,
      status: score >= passingMarks ? 'pass' : 'fail',
      completedAt: attempt.endTime || attempt.createdAt,
      applicationDetails: app, // Include full application info in details
      testDetails: test, // Include full test config in details
      answers: attempt.answers || [], // If attempt model stores individual answers
    };

    res.json(resultDetails);
  } catch (err) {
    console.error('Test Result Details Error:', err.message);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

export default router;
