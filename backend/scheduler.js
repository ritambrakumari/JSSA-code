import cron from "node-cron";
import CreatePaper from "./models/CreatePaper.js";
import Attempt from "./models/Attempt.js";
import Application from "./models/Application.js";
import { sendExamPassSMS } from "./utils/smsService.js";

/**
 * Scheduled task to send result SMS at 11:00 AM daily
 * for exams whose resultDate is today.
 */
export const initScheduledSms = () => {
  // Cron schedule: 0 11 * * * (At 11:00 AM every day)
  // For testing or based on user's "morning 11 pm" (likely 11 AM)
  cron.schedule("0 11 * * *", async () => {
    console.log("🕒 [Cron] Starting scheduled result SMS task at 11:00 AM...");
    
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // 1. Find tests that are scheduled to show result today and NOT shown instantly
      const tests = await CreatePaper.find({
        resultDate: today,
        showResult: false // If true, they already got instant SMS
      });

      console.log(`🕒 [Cron] Found ${tests.length} tests scheduled for result declaration today (${today}).`);

      for (const test of tests) {
        // 2. Find all successful attempts for this test
        const attempts = await Attempt.find({
          testId: test._id,
          score: { $gte: test.passingMarks || 0 }
        }).populate("applicationId");

        console.log(`🕒 [Cron] Test "${test.title}": Found ${attempts.length} passing candidates.`);

        for (const attempt of attempts) {
          const application = attempt.applicationId;
          if (application && application.mobile) {
            console.log(`🕒 [Cron] Sending result SMS to ${application.candidateName} (${application.mobile})`);
            
            await sendExamPassSMS(
              application.mobile,
              application.applicationNumber,
              attempt.score,
              test.mouStartDate || "N/A",
              test.mouEndDate || "N/A"
            ).catch(err => console.error(`❌ [Cron] Failed to send SMS to ${application.mobile}:`, err));
          }
        }
      }
      
      console.log("🕒 [Cron] Scheduled result SMS task completed.");
    } catch (error) {
      console.error("❌ [Cron] Error in scheduled result SMS task:", error);
    }
  });
};

/**
 * Scheduled task to automatically escalate pending claims
 * that have passed their 7-day stage deadline.
 */
import Claim from "./models/Claim.js";
import Employee from "./models/Employee.js";

export const initClaimEscalationCron = () => {
  // Run daily at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("🕒 [Cron] Starting claim auto-escalation task...");
    
    try {
      const pendingClaims = await Claim.find({
        status: "pending",
        stageDeadline: { $lt: new Date() },
        currentStage: { $ne: "ADMIN" } 
      }).populate('card');

      console.log(`🕒 [Cron] Found ${pendingClaims.length} claims past deadline.`);

      for (const claim of pendingClaims) {
        if (!claim.card || claim.currentStage === "COMPLETED") continue;
        
        const issuerEmployee = await Employee.findOne({ userId: claim.card.issuedBy });
        
        let routeState = claim.card.state || "";
        let routeDistrict = claim.card.district || "";
        let routeBlock = claim.card.block || null;
        let routePanchayat = claim.card.villageCity || null;

        if (issuerEmployee) {
          routeState = issuerEmployee.workingState || routeState;
          routeDistrict = issuerEmployee.workingDistrict || routeDistrict;
          routeBlock = issuerEmployee.workingBlock || null;
          routePanchayat = issuerEmployee.workingPanchayat || null;
        }

        const hierarchyOrder = ["PE", "BS", "DM", "ZC", "RM", "ADMIN"];
        let startIdx = hierarchyOrder.indexOf(claim.currentStage) + 1;
        if (startIdx <= 0) startIdx = hierarchyOrder.indexOf("ADMIN");

        let nextStage = "ADMIN";

        for (let i = startIdx; i < hierarchyOrder.length - 1; i++) {
          const targetRole = hierarchyOrder[i];
          let query = { role: targetRole, status: "Active" };
          let isValidLocation = false;

          if (targetRole === 'PE' && routePanchayat) {
             query.$or = [
                 { workingPanchayat: routePanchayat },
                 { workingPanchayats: routePanchayat }
             ];
             isValidLocation = true;
          } else if (targetRole === 'BS' && routeBlock) {
             query.$and = [
               { workingBlock: routeBlock },
               { $or: [
                   { isAllPanchayatsAssigned: true },
                   { workingPanchayats: routePanchayat || null }
                 ]
               }
             ];
             if (!routePanchayat) {
                query = { role: 'BS', status: 'Active', workingBlock: routeBlock };
             }
             isValidLocation = true;
          } else if (targetRole === 'DM' && routeDistrict) {
             const distName = routeDistrict.toString().split('/')[0].trim();
             const safeDist = distName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
             
             if (routeBlock) {
                query.$and = [
                  { workingDistrict: { $regex: new RegExp(`^${safeDist}`, 'i') } },
                  { $or: [
                      { isAllBlocksAssigned: true },
                      { workingBlocks: routeBlock || null }
                    ]
                  }
                ];
             } else {
                query = { role: 'DM', status: 'Active', workingDistrict: { $regex: new RegExp(`^${safeDist}`, 'i') } };
             }
             isValidLocation = true;
          } else if (targetRole === 'ZC' && routeDistrict) {
             const distName = routeDistrict.toString().split('/')[0].trim();
             const safeDist = distName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
             query.workingDistrict = { $regex: new RegExp(`(^|,\\s*)${safeDist}`, 'i') };
             isValidLocation = true;
          } else if (targetRole === 'RM' && routeState) {
             const stateName = routeState.toString().split('/')[0].trim();
             const safeState = stateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
             query.workingState = { $regex: new RegExp(`^${safeState}`, 'i') };
             isValidLocation = true;
          }

          if (isValidLocation) {
             const foundEmp = await Employee.findOne(query);
             if (foundEmp) {
                 nextStage = targetRole;
                 break;
             }
          }
        }

        // Add history record for bypass
        claim.approvalHistory.push({
          role: claim.currentStage,
          status: "bypassed_due_to_inactivity",
          remark: "Automatically forwarded to next stage due to 7-day inactivity.",
          date: Date.now()
        });

        claim.currentStage = nextStage;
        claim.stageDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await claim.save();
      }
      
      console.log("🕒 [Cron] Claim auto-escalation completed.");
    } catch (error) {
      console.error("❌ [Cron] Error in claim auto-escalation task:", error);
    }
  });
};

/**
 * Scheduled task to automatically assign certificates on 1st of every month
 * for the preceding month based on card creation and target achievements.
 */
import { processAutoAssignmentEngine } from "./controllers/certificateController.js";

export const initCertificateAutoAssignCron = () => {
  // Cron schedule: 0 0 1 * * (At 00:00 AM on the 1st day of every month)
  cron.schedule("0 0 1 * *", async () => {
    console.log("🕒 [Cron] Starting monthly Certificate Auto-Assignment task...");
    try {
      const now = new Date();
      // Calculate previous month and year
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonth = prevDate.getMonth() + 1;
      const prevYear = prevDate.getFullYear();

      console.log(`🕒 [Cron] Evaluating certificate auto-assignment for Month: ${prevMonth}/${prevYear}`);
      const result = await processAutoAssignmentEngine(prevMonth, prevYear);
      console.log("🕒 [Cron] Certificate auto-assignment task completed:", result.message);
    } catch (error) {
      console.error("❌ [Cron] Error in Certificate Auto-Assignment task:", error);
    }
  });
};
