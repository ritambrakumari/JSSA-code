import Meeting from "../models/Meeting.js";
import { createVideoSDKRoom, generateVideoSDKToken, terminateVideoSDKRoom } from "../utils/videoSDK.js";
import User from "../models/User.js";
import MeetingInvitation from "../models/MeetingInvitation.js";
import Employee from "../models/Employee.js";
import AdministrativeStaff from "../models/AdministrativeStaff.js";
import { sendMeetingInvitationEmail, sendMeetingReminderEmail } from "../utils/emailService.js";
import { sendMeetingSMS } from "../utils/smsService.js";
import BroadcastJob from "../models/BroadcastJob.js";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to send meeting invitation emails via Background Job
 */
const triggerMeetingEmails = async (participantUserIds, meeting, senderId) => {
  try {
    if (!participantUserIds || participantUserIds.length === 0) return null;

    // 1. Create a Broadcast Job for tracking
    const job = await BroadcastJob.create({
      meetingId: meeting._id,
      jobType: "meeting",
      title: `Meeting: ${meeting.title}`,
      totalCandidates: participantUserIds.length,
      candidateIds: participantUserIds, // Note: BroadcastJob schema expects Application IDs usually, but here we use User IDs
      channels: { sms: true, email: false },
      createdBy: senderId,
      status: "processing"
    });

    // 2. Start the background process (don't await)
    runMeetingBroadcastJob(job._id, meeting, senderId).catch(err =>
      console.error("Meeting Broadcast Job Error:", err)
    );

    return job;
  } catch (error) {
    console.error("Trigger Meeting Emails Error:", error);
    return null;
  }
};

/**
 * Background worker for Meeting Invitations
 */
const runMeetingBroadcastJob = async (jobId, meeting, senderId) => {
  try {
    const job = await BroadcastJob.findById(jobId);
    if (!job) return;

    job.status = "processing";
    await job.save();

    // 1. Get Sender Name
    let senderName = "JSSA Host";
    const staff = await AdministrativeStaff.findOne({ userId: senderId });
    if (staff) {
      senderName = staff.name;
    } else {
      const emp = await Employee.findOne({ userId: senderId });
      if (emp) senderName = emp.name;
    }

    // 2. Get Participant Details (User + Employee)
    const participants = await User.find({ _id: { $in: job.candidateIds } }).select('email phone');
    const employeeData = await Employee.find({ userId: { $in: job.candidateIds } }).select('name userId');

    let sent = 0;
    for (const p of participants) {
      // Check for pause/cancel
      let currentStatus = await BroadcastJob.findById(jobId).select("status");
      if (!currentStatus || currentStatus.status === "cancelled" || currentStatus.status === "failed") return;

      while (currentStatus.status === "paused") {
        await sleep(2000);
        currentStatus = await BroadcastJob.findById(jobId).select("status");
        if (!currentStatus || currentStatus.status === "cancelled") return;
      }

      const emp = employeeData.find(e => e.userId.toString() === p._id.toString());
      const participantName = emp?.name || "Employee";

      try {
        let emailOk = false;
        let smsOk = false;

        // A. Send Email (Disabled as per request)
        // if (p.email) {
        //   try {
        //     await sendMeetingInvitationEmail({
        //       to: p.email,
        //       participantName,
        //       title: meeting.title,
        //       type: meeting.type,
        //       scheduledFor: meeting.scheduledFor,
        //       senderName
        //     });
        //     emailOk = true;
        //   } catch (e) { console.error("Email fail:", e.message); }
        // }

        // B. Send SMS
        if (p.phone) {
          try {
            await sendMeetingSMS(p.phone, participantName);
            smsOk = true;
          } catch (e) { console.error("SMS fail:", e.message); }
        }

        // Update individual and combined counts
        const updateData = {};
        if (emailOk) updateData.$inc = { emailSentCount: 1 };
        if (smsOk) updateData.$inc = { ...updateData.$inc, smsSentCount: 1 };

        // Final candidate process count
        sent++;
        updateData.sentCount = sent;

        await BroadcastJob.findByIdAndUpdate(jobId, updateData);
      } catch (err) {
        console.error(`Error sending notification to ${p._id}:`, err.message);
      }

      // Small delay between candidates (300ms) to avoid rate limits
      await sleep(300);
    }

    job.status = "completed";
    job.completedAt = new Date();
    await job.save();
    console.log(`✅ Meeting Broadcast Job ${jobId} completed. Sent: ${sent}`);
  } catch (error) {
    console.error("Meeting Broadcast Job Fatal Error:", error);
    await BroadcastJob.findByIdAndUpdate(jobId, { status: "failed" });
  }
};

/**
 * Create a new meeting
 */
export const createMeeting = async (req, res) => {
  try {
    const { title, type, scheduledFor, invitedParticipants, settings, duration, platform, externalUrl } = req.body;
    const hostId = req.user.id;
    const userRole = req.user.role;

    // Employees are now allowed to create meetings (Zone locked in UI/search)
    // No role block needed.

    let roomId;
    if (platform === "gmeet" || platform === "youtube") {
      if (!externalUrl) {
        return res.status(400).json({ success: false, message: `${platform === 'gmeet' ? 'Google Meet' : 'YouTube Live'} URL is required` });
      }
      // Generate a local tracking ID for GMeet/YouTube
      roomId = `${platform}-${Math.random().toString(36).substring(2, 12)}`;
    } else {
      // 1. Create room on VideoSDK
      roomId = await createVideoSDKRoom();
    }

    // 2. Save meeting in DB
    const meeting = new Meeting({
      title: title || (platform === "gmeet" ? "Google Meet Session" : "Internal Meeting"),
      host: hostId,
      roomId,
      type: type || "instant",
      platform: platform || "internal",
      externalUrl: (platform === "gmeet" || platform === "youtube") ? externalUrl : null,
      scheduledFor: type === "scheduled" ? scheduledFor : null,
      invitedParticipants: invitedParticipants || [],
      duration: duration || 0,
      settings: settings || {
        micEnabled: true,
        cameraEnabled: true,
        screenShareEnabled: true,
        chatEnabled: true
      }
    });

    await meeting.save();

    // 3. Create invitations if participants provided
    if (invitedParticipants && invitedParticipants.length > 0) {
      const invitations = invitedParticipants.map(recipientId => ({
        meetingId: meeting._id,
        senderId: hostId,
        recipientId,
        message: `Join ${title || 'Meeting'}`
      }));
      await MeetingInvitation.insertMany(invitations);
    }

    // 4. Generate token for the host
    const token = generateVideoSDKToken(roomId);

    // Send emails to invited participants
    let broadcastJobId = null;
    if (invitedParticipants && invitedParticipants.length > 0) {
      const job = await triggerMeetingEmails(invitedParticipants, meeting, hostId);
      broadcastJobId = job?._id;
    }

    res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      data: {
        meetingId: meeting._id,
        roomId: meeting.roomId,
        token,
        title: meeting.title,
        broadcastJobId
      }
    });
  } catch (error) {
    console.error("Create Meeting Error:", error);
    res.status(500).json({ success: false, message: "Failed to create meeting", error: error.message });
  }
};

/**
 * Invite employees to an active meeting
 */
export const inviteEmployees = async (req, res) => {
  try {
    const { meetingId, employeeUserIds } = req.body;
    const senderId = req.user.id;

    let meeting;
    if (meetingId.match(/^[0-9a-fA-F]{24}$/)) {
      meeting = await Meeting.findById(meetingId);
    } else {
      meeting = await Meeting.findOne({ roomId: meetingId, status: 'active' });
    }

    if (!meeting || meeting.status !== 'active') {
      return res.status(404).json({ success: false, message: "Meeting not found or ended" });
    }

    const invitations = employeeUserIds.map(recipientId => ({
      meetingId: meeting._id,
      senderId,
      recipientId,
      message: `Join ${meeting.title}`
    }));

    // Filter out existing invitations to avoid duplicates
    const existing = await MeetingInvitation.find({ meetingId: meeting._id, recipientId: { $in: employeeUserIds } });
    const existingIds = existing.map(i => i.recipientId.toString());
    const newInvitations = invitations.filter(i => !existingIds.includes(i.recipientId.toString()));

    if (newInvitations.length > 0) {
      await MeetingInvitation.insertMany(newInvitations);

      // Update meeting's invitedParticipants list
      employeeUserIds.forEach(id => {
        if (!meeting.invitedParticipants.includes(id)) {
          meeting.invitedParticipants.push(id);
        }
      });
      await meeting.save();

      // Send emails to new participants
      const newUserIds = newInvitations.map(i => i.recipientId);
      let broadcastJobId = null;
      if (newUserIds.length > 0) {
        const job = await triggerMeetingEmails(newUserIds, meeting, senderId);
        broadcastJobId = job?._id;
      }

      return res.status(200).json({ success: true, message: "Invitations sent successfully", broadcastJobId });
    }
  } catch (error) {
    console.error("Invite Error:", error);
    res.status(500).json({ success: false, message: "Failed to send invitations" });
  }
};

/**
 * Get pending invitations for logged in user
 */
export const getInvitations = async (req, res) => {
  try {
    const userId = req.user.id;
    const invitations = await MeetingInvitation.find({
      recipientId: userId,
      status: { $in: ['pending', 'accepted'] }
    })
      .populate('senderId', 'name email')
      .populate({
        path: 'meetingId',
        match: { status: 'active' }
      })
      .sort('-createdAt');

    // Filter out invitations for meetings that are no longer active
    const activeInvitations = invitations.filter(inv => inv.meetingId);

    res.status(200).json({ success: true, data: activeInvitations });
  } catch (error) {
    console.error("Get Invitations Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch invitations" });
  }
};

/**
 * Update invitation status
 */
export const updateInvitationStatus = async (req, res) => {
  try {
    const { invitationId, status } = req.body;
    const userId = req.user.id;

    const invitation = await MeetingInvitation.findOne({ _id: invitationId, recipientId: userId });
    if (!invitation) {
      return res.status(404).json({ success: false, message: "Invitation not found" });
    }

    invitation.status = status;
    await invitation.save();

    res.status(200).json({ success: true, message: `Invitation ${status}` });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ success: false, message: "Failed to update invitation status" });
  }
};

/**
 * Update meeting settings (Host Only)
 */
export const updateMeetingSettings = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { settings } = req.body;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ roomId });

    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    if (meeting.host.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Only the host can change settings" });
    }

    meeting.settings = { ...meeting.settings, ...settings };
    await meeting.save();

    res.status(200).json({ success: true, data: meeting.settings });
  } catch (error) {
    console.error("Update Settings Error:", error);
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
};

/**
 * Search employees to invite (limited to team or district context for security/relevance)
 */
export const searchEmployees = async (req, res) => {
  try {
    const { query, startDate, endDate, state, district, block, panchayat } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const filter = {
      status: 'Active',
      onboardingComplete: true,
      userId: { $ne: userId }
    };

    if (query && query.trim()) {
      filter.name = { $regex: query.trim(), $options: 'i' };
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (state) {
      const cleanState = state.split(' / ')[0].trim();
      filter.workingState = { $regex: new RegExp(`^${cleanState}`, 'i') };
    }
    if (district) {
      const cleanDistrict = district.split(' / ')[0].trim();
      filter.workingDistrict = { $regex: new RegExp(`^${cleanDistrict}`, 'i') };
    }
    if (block) {
      if (!filter.$and) filter.$and = [];
      filter.$and.push({ $or: [{ workingBlock: block }, { workingBlocks: block }] });
    }
    if (panchayat) {
      if (!filter.$and) filter.$and = [];
      filter.$and.push({ $or: [{ workingPanchayat: panchayat }, { workingPanchayats: panchayat }] });
    }

    // Privileged roles (Staff, Admin, SuperAdmin) can search globally across all employees
    if (userRole === "staff" || userRole === "admin" || userRole === "superadmin") {
      const results = await Employee.find(filter)
        .select('name userId role designation workingState workingDistrict post photo');

      return res.status(200).json({ success: true, data: results });
    }

    // Standard employee roles follow strict zone and hierarchical locks
    const me = await Employee.findOne({ userId })
      .populate('workingBlock')
      .populate('workingBlocks');
      
    if (!me) return res.status(404).json({ success: false, message: "Profile not found" });

    // 1. Initial State Filter (Safety net)
    if (me.workingState) {
      filter.workingState = { $regex: new RegExp(`^${me.workingState.split(' / ')[0]}`, 'i') };
    }

    // 2. Strict Subordinate Logic Setup
    const myRole = (me.role || "").toUpperCase();
    const myDesignation = (me.jobPostingId?.post?.en || me.designation || "").toLowerCase();
    
    let normalizedRole = myRole;
    if (myDesignation.includes('project manager')) normalizedRole = 'PM';
    else if (myDesignation.includes('regional')) normalizedRole = 'RM';
    else if (myDesignation.includes('zonal')) normalizedRole = 'ZC';
    else if (myDesignation.includes('district manager')) normalizedRole = 'DM';
    else if (myDesignation.includes('block supervisor')) normalizedRole = 'BS';
    else if (myDesignation.includes('panchayat')) normalizedRole = 'PE';

    // Build the $and query for role-based strict filtering
    if (!filter.$and) filter.$and = [];
    const splitArr = (str) => (str || "").split(',').map(s => s.trim()).filter(Boolean);

    if (normalizedRole === 'PM' || normalizedRole === 'RM') {
      // Can see ZC, DM, BS, PE in their assigned states
      filter.$and.push({ role: { $in: ['ZC', 'DM', 'BS', 'PE'] } });
    } else if (normalizedRole === 'ZC') {
      // Can see DM, BS, PE strictly in assigned districts
      const zcDistricts = splitArr(me.workingDistrict);
      filter.$and.push({ role: { $in: ['DM', 'BS', 'PE'] } });
      const districtConditions = zcDistricts.map(d => ({ workingDistrict: { $regex: new RegExp(d.split(' / ')[0], 'i') } }));
      if (districtConditions.length > 0) {
        filter.$and.push({ $or: districtConditions });
      } else {
        filter.$and.push({ _id: null }); // Fallback if no districts
      }
    } else if (normalizedRole === 'DM') {
      // Can see BS, PE strictly in assigned district
      filter.$and.push({ role: { $in: ['BS', 'PE'] } });
      const dmDistrict = (me.workingDistrict || "").split(' / ')[0].trim();
      if (dmDistrict) {
        filter.$and.push({ workingDistrict: { $regex: new RegExp(dmDistrict, 'i') } });
      } else {
        filter.$and.push({ _id: null });
      }
    } else if (normalizedRole === 'BS') {
      // Can see PE strictly in assigned block(s)
      filter.$and.push({ role: 'PE' });
      const bsBlockIds = [];
      if (me.workingBlock?._id) bsBlockIds.push(me.workingBlock._id);
      if (me.workingBlocks?.length > 0) bsBlockIds.push(...me.workingBlocks.map(b => b._id));
      
      if (bsBlockIds.length > 0) {
         filter.$and.push({ $or: [ { workingBlock: { $in: bsBlockIds } }, { workingBlocks: { $in: bsBlockIds } } ] });
      } else {
         filter.$and.push({ _id: null });
      }
    } else {
       // PE or Unknown role -> cannot invite anyone
       filter.$and.push({ _id: null });
    }

    let results = await Employee.find(filter)
      .select('name userId role designation workingState workingDistrict post photo');

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Search Employees Error:", error);
    res.status(500).json({ success: false, message: "Search failed" });
  }
};

/**
 * Get meeting details & token for joining
 */
export const joinMeeting = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ roomId, status: "active" });

    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found or already ended" });
    }

    // 1. If user is HOST and meeting hasn't started yet, start it now
    if (meeting.host && meeting.host.toString() === userId.toString() && !meeting.startTime) {
      meeting.startTime = new Date();
    }

    // 2. Update active participants (prevent duplicates)
    const isAlreadyJoined = meeting.activeParticipants.some(p => p.toString() === userId.toString());
    if (!isAlreadyJoined) {
      meeting.activeParticipants.push(userId);
    }

    await meeting.save();

    // Also mark invitation as accepted if it exists
    await MeetingInvitation.findOneAndUpdate(
      { meetingId: meeting._id, recipientId: userId, status: 'pending' },
      { status: 'accepted' }
    );

    const token = generateVideoSDKToken(roomId);

    res.status(200).json({
      success: true,
      data: {
        meetingId: meeting._id,
        roomId: meeting.roomId,
        token,
        title: meeting.title,
        hostId: meeting.host,
        platform: meeting.platform,
        externalUrl: meeting.externalUrl,
        invitedParticipants: meeting.invitedParticipants || [],
        settings: meeting.settings || {
          micEnabled: true,
          cameraEnabled: true,
          screenShareEnabled: true,
          chatEnabled: true
        },
        startTime: meeting.startTime,
        duration: meeting.duration
      }
    });
  } catch (error) {
    console.error("Join Meeting Error:", error);
    res.status(500).json({ success: false, message: "Failed to join meeting" });
  }
};

/**
 * Leave a meeting
 */
export const leaveMeeting = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ roomId, status: "active" });
    if (meeting) {
      meeting.activeParticipants = meeting.activeParticipants.filter(
        p => p.toString() !== userId.toString()
      );

      // Auto-End: If no one is left in the meeting, end it formally
      if (meeting.activeParticipants.length === 0) {
        meeting.status = "ended";
        meeting.endTime = new Date();
        if (meeting.recordingStatus === 'started') {
          meeting.recordingStatus = 'completed';
        }
        await terminateVideoSDKRoom(roomId);
      }

      await meeting.save();
    }

    res.status(200).json({ success: true, message: "Left meeting" });
  } catch (error) {
    console.error("Leave Meeting Error:", error);
    res.status(500).json({ success: false, message: "Failed to leave meeting" });
  }
};

/**
 * End a meeting
 */
export const endMeeting = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ roomId });

    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    // Only host or Admin can end meeting
    const isHost = meeting.host && meeting.host.toString() === userId;
    const isAdmin = req.user.role === "admin" || req.user.role === "superadmin" || req.user.role === "staff";

    if (!isHost && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized to end this meeting" });
    }

    meeting.status = "ended";
    meeting.endTime = new Date();
    // If recording was active, mark it as completed/processing
    if (meeting.recordingStatus === 'started') {
      meeting.recordingStatus = 'completed';
    }

    await meeting.save();

    // 3. Force terminate room on VideoSDK for all participants
    await terminateVideoSDKRoom(roomId);

    // Mark all pending invitations for this meeting as ignored
    await MeetingInvitation.updateMany(
      { meetingId: meeting._id, status: 'pending' },
      { status: 'ignored' }
    );

    res.status(200).json({ success: true, message: "Meeting ended successfully" });
  } catch (error) {
    console.error("End Meeting Error:", error);
    res.status(500).json({ success: false, message: "Failed to end meeting" });
  }
};

/**
 * Add a key point to the meeting history
 */
export const addMeetingPoint = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    // Only host or authorized personnel can add points
    meeting.meetingPoints.push({
      text,
      addedBy: userId
    });

    await meeting.save();
    res.status(200).json({ success: true, message: "Point added", data: meeting.meetingPoints });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add point" });
  }
};

/**
 * Delete a meeting point
 */
export const deleteMeetingPoint = async (req, res) => {
  try {
    const { meetingId, pointId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    meeting.meetingPoints = meeting.meetingPoints.filter(p => p._id.toString() !== pointId);
    await meeting.save();
    res.status(200).json({ success: true, message: "Point deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete point" });
  }
};

/**
 * Update general observations/POC
 */
export const updateObservations = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { observations } = req.body;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    meeting.observations = observations;
    await meeting.save();
    res.status(200).json({ success: true, message: "Observations updated", data: meeting.observations });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update observations" });
  }
};

/**
 * Upload attachment to meeting
 */
export const uploadAttachment = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });

    const fileUrl = `/uploads/meetings/${req.file.filename}`;

    meeting.attachments.push({
      name: req.body.name || req.file.originalname,
      url: fileUrl,
      fileType: req.file.mimetype,
      uploadedBy: userId
    });

    await meeting.save();
    res.status(200).json({ success: true, message: "File uploaded successfully", data: meeting.attachments });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
};

/**
 * Get all active meetings (Admin only)
 */
export const getActiveMeetings = async (req, res) => {
  try {
    const { page: qPage, limit: qLimit, startDate, endDate, platform, status, search } = req.query;
    const page = parseInt(qPage) || 1;
    const limit = parseInt(qLimit) || 15;
    const skip = (page - 1) * limit;

    const query = {};

    // 1. Search Logic (Room ID, Title, or Host Name)
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };

      // Need to find hosts first if searching by host name
      const hostUsers = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      }).select('_id');
      const hostIds = hostUsers.map(u => u._id);

      query.$or = [
        { title: searchRegex },
        { roomId: searchRegex },
        { host: { $in: hostIds } }
      ];
    }

    // 2. Status Filtering
    if (status && status !== 'all') {
      query.status = status;
    }
    // No more default 24h restriction. Return everything so pagination works for history.

    // 3. Date Range Filtering
    if (startDate || endDate) {
      if (!query.createdAt) query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // 4. Platform Filtering
    if (platform && platform !== 'all') {
      query.platform = platform;
    }

    const total = await Meeting.countDocuments(query);
    const meetings = await Meeting.find(query)
      .populate("host", "name email phone role")
      .populate("activeParticipants", "name email phone role")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    // Enhance host and participant info
    const enhancedMeetings = await Promise.all(meetings.map(async (m) => {
      const meeting = m.toObject();

      // 1. Enhance Host Info
      if (meeting.host) {
        if (!meeting.host.name) {
          const employee = await Employee.findOne({ userId: meeting.host._id || meeting.host });
          if (employee) {
            meeting.host.name = employee.name;
            meeting.host.employeeId = employee.employeeId || "EMP";
          } else {
            // Fallback for Admin/Staff hosts who don't have Employee records
            meeting.host.name = meeting.host.email?.split('@')[0] || meeting.host.phone || "Unknown";
            meeting.host.employeeId = "ADMIN";
          }
        }
      }

      // 2. Enhance Active Participants Info
      if (meeting.activeParticipants && meeting.activeParticipants.length > 0) {
        meeting.activeParticipants = await Promise.all(meeting.activeParticipants.map(async (p) => {
          if (!p.name) {
            const emp = await Employee.findOne({ userId: p._id || p }).select('name');
            if (emp) {
              p.name = emp.name;
            } else {
              p.name = p.email?.split('@')[0] || p.phone || "User";
            }
          }
          return p;
        }));
      }

      return meeting;
    }));

    res.status(200).json({
      success: true,
      data: enhancedMeetings,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get Active Meetings Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch active meetings" });
  }
};

/**
 * Delete meetings (Admin only)
 */
export const deleteMeetings = async (req, res) => {
  try {
    const { meetingIds } = req.body; // Array of meeting IDs

    if (!meetingIds || !Array.isArray(meetingIds) || meetingIds.length === 0) {
      return res.status(400).json({ success: false, message: "No meeting IDs provided" });
    }

    // 1. Delete associated invitations
    await MeetingInvitation.deleteMany({ meetingId: { $in: meetingIds } });

    // 2. Delete meetings
    await Meeting.deleteMany({ _id: { $in: meetingIds } });

    res.status(200).json({ success: true, message: `${meetingIds.length} meeting(s) deleted successfully` });
  } catch (error) {
    console.error("Delete Meetings Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete meetings" });
  }
};

/**
 * Get meeting history
 */
export const getMeetingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, platform } = req.query;

    const query = {
      $or: [
        { host: userId },
        { activeParticipants: userId },
        { invitedParticipants: userId }
      ]
    };

    // 1. Date Range Filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // 2. Platform Filtering
    if (platform && platform !== 'all') {
      query.platform = platform;
    }

    const meetings = await Meeting.find(query)
      .populate("host", "name email phone")
      .sort("-createdAt")
      .limit(20);

    // Enhance host info
    const enhancedMeetings = await Promise.all(meetings.map(async (m) => {
      const meeting = m.toObject();
      if (meeting.host && !meeting.host.name) {
        const employee = await Employee.findOne({ userId: meeting.host._id || meeting.host }).select('name');
        if (employee) {
          meeting.host.name = employee.name;
        } else {
          meeting.host.name = meeting.host.email?.split('@')[0] || meeting.host.phone || "Unknown";
        }
      }
      return meeting;
    }));

    res.status(200).json({ success: true, data: enhancedMeetings });
  } catch (error) {
    console.error("Get History Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
};

/**
 * Get upcoming scheduled meetings
 */
export const getScheduledMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const meetings = await Meeting.find({
      type: "scheduled",
      status: "active",
      scheduledFor: { $gte: now },
      $or: [
        { host: userId },
        { invitedParticipants: userId }
      ]
    })
      .populate("host", "name")
      .sort("scheduledFor");

    res.status(200).json({ success: true, data: meetings });
  } catch (error) {
    console.error("Get Scheduled Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch scheduled meetings" });
  }
};


/**
 * Update meeting details (like title)
 */
export const updateMeeting = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    // Only host can update
    if (meeting.host.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Only the host can update meeting details" });
    }

    meeting.title = title;
    await meeting.save();

    res.status(200).json({ success: true, message: "Meeting updated successfully", data: meeting });
  } catch (error) {
    console.error("Update Meeting Error:", error);
    res.status(500).json({ success: false, message: "Failed to update meeting" });
  }
};
/**
 * Broadcast Meeting Reminder to non-joined participants
 */
export const broadcastMeetingReminder = async (req, res) => {
  try {
    const { meetingId, channels } = req.body;
    const senderId = req.user.id;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    // 1. Identify participants who haven't joined yet
    const invitedIds = meeting.invitedParticipants.map(id => id.toString());
    const joinedIds = meeting.activeParticipants.map(id => id.toString());
    const absenteeIds = invitedIds.filter(id => !joinedIds.includes(id));

    if (absenteeIds.length === 0) {
      return res.status(400).json({ success: false, message: "All invited participants have already joined" });
    }

    // 2. Create a Broadcast Job for tracking
    const job = await BroadcastJob.create({
      meetingId: meeting._id,
      jobType: "meeting_reminder",
      title: `Reminder: ${meeting.title}`,
      totalCandidates: absenteeIds.length,
      candidateIds: absenteeIds,
      channels: {
        sms: channels.includes('sms'),
        email: channels.includes('email')
      },
      createdBy: senderId,
      status: "processing"
    });

    // 3. Start the background process
    runMeetingReminderJob(job._id, meeting, senderId).catch(err =>
      console.error("Meeting Reminder Job Error:", err)
    );

    res.json({
      success: true,
      message: "Broadcast initiated successfully",
      jobId: job._id
    });

  } catch (error) {
    console.error("Broadcast Reminder Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Background worker for Meeting Reminders
 */
const runMeetingReminderJob = async (jobId, meeting, senderId) => {
  try {
    const job = await BroadcastJob.findById(jobId);
    if (!job) return;

    // Get Sender Name
    let senderName = "JSSA Host";
    const staff = await AdministrativeStaff.findOne({ userId: senderId });
    if (staff) senderName = staff.name;
    else {
      const emp = await Employee.findOne({ userId: senderId });
      if (emp) senderName = emp.name;
    }

    const participants = await User.find({ _id: { $in: job.candidateIds } }).select('email phone');
    const employeeData = await Employee.find({ userId: { $in: job.candidateIds } }).select('name userId');

    let sent = 0;
    for (const p of participants) {
      let currentStatus = await BroadcastJob.findById(jobId).select("status");
      if (!currentStatus || currentStatus.status === "cancelled") return;

      while (currentStatus.status === "paused") {
        await sleep(2000);
        currentStatus = await BroadcastJob.findById(jobId).select("status");
        if (!currentStatus || currentStatus.status === "cancelled") return;
      }

      const emp = employeeData.find(e => e.userId.toString() === p._id.toString());
      const participantName = emp?.name || "Employee";

      try {
        const updates = { $inc: {} };
        // A. Send Email
        if (job.channels.email && p.email) {
          await sendMeetingReminderEmail({
            to: p.email,
            participantName,
            title: meeting.title,
            type: meeting.platform,
            scheduledFor: meeting.startTime || meeting.scheduledFor,
            senderName
          });
          updates.$inc.emailSentCount = 1;
        }

        // B. Send SMS
        if (job.channels.sms && p.phone) {
          await sendMeetingSMS(p.phone, participantName);
          updates.$inc.smsSentCount = 1;
        }

        sent++;
        updates.sentCount = sent;
        await BroadcastJob.findByIdAndUpdate(jobId, updates);

        // Anti-spam delay
        await sleep(300);

      } catch (e) {
        console.error(`Failed to send reminder to ${p.email || p.phone}:`, e.message);
      }
    }

    await BroadcastJob.findByIdAndUpdate(jobId, { status: "completed", completedAt: new Date() });

  } catch (error) {
    console.error("Background Reminder Job Error:", error);
    await BroadcastJob.findByIdAndUpdate(jobId, { status: "failed" });
  }
};
