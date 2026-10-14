import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  createMeeting, 
  joinMeeting, 
  leaveMeeting,
  endMeeting, 
  getActiveMeetings, 
  getMeetingHistory,
  getScheduledMeetings,
  inviteEmployees,
  getInvitations,
  updateInvitationStatus,
  searchEmployees,
  deleteMeetings,
  updateMeeting,
  updateMeetingSettings,
  addMeetingPoint,
  deleteMeetingPoint,
  updateObservations,
  uploadAttachment,
  broadcastMeetingReminder
} from "../controllers/meetingController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Multer Configuration for Meeting Attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/meetings';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `meeting-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit
});

// All routes are protected
router.use(authenticate);

router.post("/create", createMeeting);
router.get("/join/:roomId", joinMeeting);
router.put("/leave/:roomId", leaveMeeting);
router.put("/end/:roomId", endMeeting);
router.get("/history", getMeetingHistory);
router.get("/scheduled", getScheduledMeetings);
router.post("/invite", inviteEmployees);
router.get("/invitations", getInvitations);
router.post("/invitation/status", updateInvitationStatus);
router.get("/search-employees", searchEmployees);
router.put("/update/:roomId", updateMeeting);
router.put("/update-settings/:roomId", updateMeetingSettings);

// Meeting Audit & Points Routes
router.post("/:meetingId/points", addMeetingPoint);
router.delete("/:meetingId/points/:pointId", deleteMeetingPoint);
router.put("/:meetingId/observations", updateObservations);
router.post("/:meetingId/attachments", upload.single('file'), uploadAttachment);

// Admin only routes
router.get("/admin/active", authorize(["admin", "superadmin", "staff"]), getActiveMeetings);
router.post("/admin/delete", authorize(["admin", "superadmin", "staff"]), deleteMeetings);
router.post("/broadcast-reminder", authorize(["admin", "superadmin", "staff"]), broadcastMeetingReminder);

export default router;
