import Claim from "../models/Claim.js";
import Card from "../models/Card.js";
import Employee from "../models/Employee.js";
import path from "path";
import fs from "fs";

export const submitClaim = async (req, res) => {
  try {
    const {
      cardId, cardHolderName, relation, healthCardNumber,
      mobileNumber, email, aadhaarNumber, panNumber,
      bankName, accountNumber, ifscCode, branch,
      address, totalMedicalExpenses, title, description
    } = req.body;

    const userId = req.user.id;

    if (!cardId) {
      return res.status(400).json({ success: false, message: "Card selection is required" });
    }

    // --- 3-MONTH COOLDOWN RULE (Card-Level) ---
    // Check is now per-card, not per-user.
    // If a user has multiple cards, they can claim on a different card even if one card has an active claim.
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentActiveClaim = await Claim.findOne({
      card: cardId,             // Card-level check
      isDeleted: false,
      status: { $ne: 'rejected' },
      createdAt: { $gt: threeMonthsAgo }
    });

    if (recentActiveClaim) {
      return res.status(400).json({ 
        success: false, 
        message: "A claim for this specific card was already submitted within the last 3 months. Please wait before submitting another claim for this card." 
      });
    }
    // --------------------------------------------

    const requiredDocs = [
      'healthCardCopy', 'aadhaarFront', 'aadhaarBack', 'panFront',
      'bankPassbook', 'doctorReport', 'consultationFeeBill', 'claimForm',
      'dischargeSummary', 'hospitalBills', 'diagnosticReports', 'labBills',
      'pharmacyBills', 'passportPhotos'
    ];
    for (let doc of requiredDocs) {
      if (!req.files || !req.files[doc]) {
        return res.status(400).json({ success: false, message: `Mandatory document missing: ${doc}` });
      }
    }

    // Helper to get path
    const getPath = (fieldname) => {
      if (req.files && req.files[fieldname] && req.files[fieldname][0]) {
        return `/api/files/claims/${req.files[fieldname][0].filename}`;
      }
      return "";
    };

    // Helper to get path array
    const getPathsArray = (fieldname) => {
      if (req.files && req.files[fieldname]) {
        return req.files[fieldname].map(file => `/api/files/claims/${file.filename}`);
      }
      return [];
    };

    const documents = {
      healthCardCopy: getPath('healthCardCopy'),
      aadhaarFront: getPath('aadhaarFront'),
      aadhaarBack: getPath('aadhaarBack'),
      panFront: getPath('panFront'),
      claimForm: getPath('claimForm'),
      bankPassbook: getPath('bankPassbook'),
      doctorReport: getPath('doctorReport'),
      consultationFeeBill: getPath('consultationFeeBill'),
      dischargeSummary: getPath('dischargeSummary'),
      hospitalBills: getPath('hospitalBills'),
      diagnosticReports: getPath('diagnosticReports'),
      labBills: getPath('labBills'),
      pharmacyBills: getPath('pharmacyBills'),
      firCopy: getPath('firCopy'),
      passportPhotos: getPathsArray('passportPhotos')
    };

    // Legacy support
    const evidencePath = getPath('evidence') || getPath('doctorReport');

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: "Selected card not found" });
    }

    // Determine routing location based on the Employee who issued the card
    const issuerEmployee = await Employee.findOne({ userId: card.issuedBy });

    let routeState = card.state || "";
    let routeDistrict = card.district || "";
    let routeBlock = null;
    let routePanchayat = null;

    if (issuerEmployee) {
      routeState = issuerEmployee.workingState || routeState;
      routeDistrict = issuerEmployee.workingDistrict || routeDistrict;
      routeBlock = issuerEmployee.workingBlock || null;
      routePanchayat = issuerEmployee.workingPanchayat || null;
    }

    let startingStage = "ADMIN";
    const hierarchyOrder = ["PE", "BS", "DM", "ZC", "RM", "ADMIN"];

    // Start checking from the issuer's role. If not found, start from PE
    let currentRoleIdx = issuerEmployee ? hierarchyOrder.indexOf(issuerEmployee.role) : 0;
    if (currentRoleIdx === -1) currentRoleIdx = 0;

    for (let i = currentRoleIdx; i < hierarchyOrder.length - 1; i++) {
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
          {
            $or: [
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
            {
              $or: [
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
          startingStage = targetRole;
          break;
        }
      }
    }

    // Check if this card has a previous 'paid' claim
    const previousPaidClaim = await Claim.findOne({
      card: cardId,
      payoutStatus: "paid"
    });
    const isRepeated = !!previousPaidClaim;

    const newClaim = new Claim({
      userId,
      card: cardId,
      cardHolderName,
      relation,
      healthCardNumber,
      mobileNumber,
      email,
      aadhaarNumber,
      panNumber,
      bankDetails: {
        bankName,
        accountNumber,
        ifscCode,
        branch
      },
      address,
      totalMedicalExpenses: Number(totalMedicalExpenses) || 0,
      documents,
      title: title || "Medical Claim",
      description: description || "Medical Claim for " + cardHolderName,
      evidence: evidencePath,
      currentStage: startingStage,
      stageDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      isRepeatedClaim: isRepeated
    });

    await newClaim.save();

    res.status(201).json({
      success: true,
      message: "Claim submitted successfully",
      data: newClaim,
    });
  } catch (error) {
    console.error("Submit Claim Error:", error);
    res.status(500).json({ success: false, message: "Server error during claim submission" });
  }
};

export const reApplyClaim = async (req, res) => {
  try {
    const claimId = req.params.id;
    const {
      cardHolderName, relation, healthCardNumber,
      mobileNumber, email, aadhaarNumber, panNumber,
      bankName, accountNumber, ifscCode, branch,
      address, totalMedicalExpenses, title, description,
      cardholderNote
    } = req.body;

    const userId = req.user.id;

    const claim = await Claim.findOne({ _id: claimId, userId });
    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    if (claim.status !== 'rejected') {
      return res.status(400).json({ success: false, message: "Only rejected claims can be re-applied" });
    }

    // --- 3-MONTH COOLDOWN RULE (Card-Level) for Re-Apply ---
    // Check if another NON-rejected active claim already exists on the same card
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentActiveClaim = await Claim.findOne({
      card: claim.card,            // Same card
      _id: { $ne: claimId },       // Exclude the current (rejected) claim being re-applied
      isDeleted: false,
      status: { $ne: 'rejected' },
      createdAt: { $gt: threeMonthsAgo }
    });

    if (recentActiveClaim) {
      return res.status(400).json({
        success: false,
        message: "Another active claim for this card was already submitted within the last 3 months. Please wait before re-submitting."
      });
    }
    // --------------------------------------------------------

    // Helper to get path or fallback to existing document
    const getPath = (fieldname, existingPath) => {
      if (req.files && req.files[fieldname] && req.files[fieldname][0]) {
        return `/api/files/claims/${req.files[fieldname][0].filename}`;
      }
      return existingPath;
    };

    const getPathsArray = (fieldname, existingPaths) => {
      let paths = Array.isArray(existingPaths) ? existingPaths : (existingPaths ? [existingPaths] : []);
      if (req.files && req.files[fieldname]) {
        const newPaths = req.files[fieldname].map(file => `/api/files/claims/${file.filename}`);
        paths = [...paths, ...newPaths];
      }
      return paths;
    };

    const documents = {
      healthCardCopy: getPath('healthCardCopy', claim.documents?.healthCardCopy),
      aadhaarFront: getPath('aadhaarFront', claim.documents?.aadhaarFront),
      aadhaarBack: getPath('aadhaarBack', claim.documents?.aadhaarBack),
      panFront: getPath('panFront', claim.documents?.panFront),
      claimForm: getPath('claimForm', claim.documents?.claimForm),
      bankPassbook: getPath('bankPassbook', claim.documents?.bankPassbook),
      doctorReport: getPath('doctorReport', claim.documents?.doctorReport),
      consultationFeeBill: getPath('consultationFeeBill', claim.documents?.consultationFeeBill),
      dischargeSummary: getPath('dischargeSummary', claim.documents?.dischargeSummary),
      hospitalBills: getPath('hospitalBills', claim.documents?.hospitalBills),
      diagnosticReports: getPath('diagnosticReports', claim.documents?.diagnosticReports),
      labBills: getPath('labBills', claim.documents?.labBills),
      pharmacyBills: getPath('pharmacyBills', claim.documents?.pharmacyBills),
      firCopy: getPath('firCopy', claim.documents?.firCopy),
      passportPhotos: getPathsArray('passportPhotos', claim.documents?.passportPhotos)
    };

    // Legacy support
    const evidencePath = getPath('evidence', claim.evidence) || getPath('doctorReport', claim.documents?.doctorReport);

    const card = await Card.findById(claim.card);
    if (!card) {
      return res.status(404).json({ success: false, message: "Associated card not found" });
    }

    // Determine routing location
    let routeDistrict = card.district || "";
    let routeState = card.state || "";

    const issuerEmployee = await Employee.findOne({ userId: card.issuedBy });
    if (issuerEmployee) {
      routeDistrict = issuerEmployee.workingDistrict || routeDistrict;
      routeState = issuerEmployee.workingState || routeState;
    }

    let startingStage = "ADMIN";
    const dm = await Employee.findOne({ role: "DM", workingDistrict: new RegExp(`^${routeDistrict}$`, 'i'), workingState: new RegExp(`^${routeState}$`, 'i'), status: "Active" });
    if (dm) { startingStage = "DM"; } else {
      const zc = await Employee.findOne({ role: "ZC", workingDistrict: new RegExp(`^${routeDistrict}$`, 'i'), workingState: new RegExp(`^${routeState}$`, 'i'), status: "Active" });
      if (zc) { startingStage = "ZC"; } else {
        const rm = await Employee.findOne({ role: "RM", workingState: new RegExp(`^${routeState}$`, 'i'), status: "Active" });
        if (rm) { startingStage = "RM"; }
      }
    }

    // Update fields
    claim.cardHolderName = cardHolderName || claim.cardHolderName;
    claim.relation = relation || claim.relation;
    claim.healthCardNumber = healthCardNumber || claim.healthCardNumber;
    claim.mobileNumber = mobileNumber || claim.mobileNumber;
    claim.email = email || claim.email;
    claim.aadhaarNumber = aadhaarNumber || claim.aadhaarNumber;
    claim.panNumber = panNumber || claim.panNumber;

    if (!claim.bankDetails) claim.bankDetails = {};
    claim.bankDetails.bankName = bankName || claim.bankDetails.bankName;
    claim.bankDetails.accountNumber = accountNumber || claim.bankDetails.accountNumber;
    claim.bankDetails.ifscCode = ifscCode || claim.bankDetails.ifscCode;
    claim.bankDetails.branch = branch || claim.bankDetails.branch;

    claim.address = address || claim.address;
    claim.totalMedicalExpenses = Number(totalMedicalExpenses) || claim.totalMedicalExpenses;
    claim.title = title || claim.title;
    claim.description = description || claim.description;

    claim.documents = documents;
    claim.evidence = evidencePath;

    // Reset status & stage
    claim.status = "pending";
    claim.currentStage = startingStage;

    // Add tracking history
    claim.approvalHistory.push({
      role: "CARDHOLDER",
      status: "resubmitted",
      remark: cardholderNote || "Claim resubmitted with corrections.",
      date: new Date()
    });

    await claim.save();

    res.status(200).json({
      success: true,
      message: "Claim re-applied successfully",
      data: claim,
    });
  } catch (error) {
    console.error("Re-Apply Claim Error:", error);
    res.status(500).json({ success: false, message: "Server error during claim re-application" });
  }
};

export const getMyClaims = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    let query = { userId };

    if (search) {
      query.$or = [
        { cardHolderName: { $regex: search, $options: 'i' } },
        { healthCardNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const total = await Claim.countDocuments(query);
    const claims = await Claim.find(query)
      .populate("card", "cardholderName cardId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: claims,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get My Claims Error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching claims" });
  }
};

export const getClaimById = async (req, res) => {
  try {
    const claimId = req.params.id;
    const userId = req.user.id;

    // Check if user is trying to access their own claim
    const claim = await Claim.findOne({ _id: claimId, userId }).populate('card');

    if (!claim) {
      // If not found, check if it exists but belongs to someone else (security check)
      const exists = await Claim.findById(claimId);
      if (exists && req.user.role !== 'cardHolder') {
        // Only allow staff/admin/employees to fetch other's claims if needed, but for now we restrict to owner
        return res.status(403).json({ success: false, message: "You don't have permission to view this claim" });
      }
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    res.status(200).json({
      success: true,
      data: claim
    });
  } catch (error) {
    console.error("Get Claim By ID Error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching claim details" });
  }
};

export const getAllClaims = async (req, res) => {
  try {
    let query = {};
    let emp = null;

    if (req.user.role === 'employee') {
      emp = await Employee.findOne({ userId: req.user.id });
      if (!emp) return res.status(403).json({ success: false, message: "Employee details not found" });

      if (["PE", "BS", "DM", "ZC", "RM"].includes(emp.role)) {
        // We will fetch all claims and filter by geographic region below
        query = {};
      } else {
        return res.status(403).json({ success: false, message: "Unauthorized role for claims" });
      }
    }

    const claims = await Claim.find(query)
      .populate("userId", "name email phone role")
      .populate({
        path: "card",
        populate: {
          path: "issuedBy",
          select: "name email phone role"
        }
      })
      .sort({ createdAt: -1 });

    let enrichedClaims = claims.map((claim) => {
      const claimObj = claim.toObject();
      if (claim.card) {
        claimObj.memberName = claim.card.cardholderName;
      } else if (claim.userId && claim.userId.name) {
        claimObj.memberName = claim.userId.name;
      }
      return claimObj;
    });

    if (req.user.role === 'employee' && emp) {
      const filteredClaims = [];
      for (const c of enrichedClaims) {
        if (!c.card) continue;

        // If this employee previously processed this claim, always show it
        if (c.approvalHistory && c.approvalHistory.some(h => h.processedBy?.toString() === emp._id.toString())) {
          filteredClaims.push(c);
          continue;
        }

        let routeState = c.card.state || "";
        let routeDistrict = c.card.district || "";
        let routeBlock = c.card.block || null;
        let routePanchayat = c.card.villageCity || null;

        const issuerEmployee = await Employee.findOne({ userId: c.card.issuedBy });
        if (issuerEmployee) {
          routeState = issuerEmployee.workingState || routeState;
          routeDistrict = issuerEmployee.workingDistrict || routeDistrict;
          routeBlock = issuerEmployee.workingBlock || routeBlock;
          routePanchayat = issuerEmployee.workingPanchayat || routePanchayat;
        }

        const safeRouteState = (routeState.split("/")[0] || routeState).trim().toLowerCase();
        const safeRouteDistrict = (routeDistrict.split("/")[0] || routeDistrict).trim().toLowerCase();
        const empState = (emp.workingState || "").toLowerCase();
        const empDist = (emp.workingDistrict || "").toLowerCase();

        let isVisible = false;

        if (emp.role === "RM" && empState.includes(safeRouteState)) {
          isVisible = true;
        } else if (emp.role === "ZC" && empDist.includes(safeRouteDistrict)) {
          isVisible = true;
        } else if (emp.role === "DM" && empState.includes(safeRouteState) && empDist.includes(safeRouteDistrict)) {
          // Strictly, DM can check blocks, but current logic allowed DM to see all claims in district. We'll keep that for backward compatibility.
          isVisible = true;
        } else if (emp.role === "BS") {
          // BS checks block
          if (emp.workingBlock && routeBlock && emp.workingBlock.toString() === routeBlock.toString()) {
            isVisible = true;
          }
        } else if (emp.role === "PE") {
          // PE checks panchayat
          if (emp.workingPanchayat && routePanchayat && emp.workingPanchayat.toString() === routePanchayat.toString()) {
            isVisible = true;
          } else if (emp.workingPanchayats && routePanchayat && emp.workingPanchayats.some(p => p.toString() === routePanchayat.toString())) {
            isVisible = true;
          }
        }

        if (isVisible) {
          filteredClaims.push(c);
        }
      }
      enrichedClaims = filteredClaims;
    }
    // Apply location filters in memory
    const reqState = req.query.state;
    const reqDistrict = req.query.district;
    const reqBlock = req.query.block;
    const reqPanchayat = req.query.panchayat;

    if (reqState || reqDistrict || reqBlock || reqPanchayat) {
      const filteredLocationClaims = [];

      for (const c of enrichedClaims) {
        if (!c.card) continue;

        let routeState = c.card.state || "";
        let routeDistrict = c.card.district || "";
        let routeBlock = c.card.block || null;
        let routePanchayat = c.card.villageCity || null;

        // NOTE: We deliberately DO NOT override the card's native location with the issuer employee's location here,
        // so that the UI filter accurately reflects the cardholder's actual residential state.

        const safeRouteState = (routeState.split("/")[0] || routeState).trim().toLowerCase();
        const safeRouteDistrict = (routeDistrict.split("/")[0] || routeDistrict).trim().toLowerCase();
        const safeRouteBlock = (routeBlock?.toString().split("/")[0] || routeBlock?.toString() || "").trim().toLowerCase();
        const safeRoutePanchayat = (routePanchayat?.toString().split("/")[0] || routePanchayat?.toString() || "").trim().toLowerCase();

        let isMatch = true;

        const cleanReqState = reqState ? reqState.split("/")[0].trim().toLowerCase() : null;
        const cleanReqDistrict = reqDistrict ? reqDistrict.split("/")[0].trim().toLowerCase() : null;
        const cleanReqBlock = reqBlock ? reqBlock.split("/")[0].trim().toLowerCase() : null;
        const cleanReqPanchayat = reqPanchayat ? reqPanchayat.split("/")[0].trim().toLowerCase() : null;

        if (cleanReqState && safeRouteState !== cleanReqState) isMatch = false;
        if (cleanReqDistrict && safeRouteDistrict !== cleanReqDistrict) isMatch = false;
        if (cleanReqBlock && safeRouteBlock !== cleanReqBlock) isMatch = false;
        if (cleanReqPanchayat && safeRoutePanchayat !== cleanReqPanchayat) isMatch = false;

        // console.log(`Claim ID: ${c._id}, routeState: ${routeState}, safeRouteState: ${safeRouteState}, cleanReqState: ${cleanReqState}, isMatch: ${isMatch}`);

        if (isMatch) {
          filteredLocationClaims.push(c);
        }
      }
      enrichedClaims = filteredLocationClaims;
    }

    // Apply search filter in memory
    const search = req.query.search || "";
    if (search) {
      const lowerSearch = search.toLowerCase();
      enrichedClaims = enrichedClaims.filter(c => {
        return (c.title && c.title.toLowerCase().includes(lowerSearch)) ||
          (c.cardHolderName && c.cardHolderName.toLowerCase().includes(lowerSearch)) ||
          (c.healthCardNumber && c.healthCardNumber.includes(search)) ||
          (c.userId?.phone && c.userId?.phone?.includes(search));
      });
    }

    // Apply status filter in memory
    const filter = req.query.filter || "ALL";
    if (filter !== "ALL") {
      enrichedClaims = enrichedClaims.filter(c => {
        if (filter === "PENDING_DM") return c.status === "pending" && c.currentStage === "DM";
        if (filter === "PENDING_RM") return c.status === "pending" && c.currentStage === "RM";
        if (filter === "PENDING_ZC") return c.status === "pending" && c.currentStage === "ZC";
        if (filter === "PENDING_PAY") return c.status === "pending" && c.currentStage === "ADMIN" && c.payoutStatus !== "paid";
        if (filter === "PAID") return c.payoutStatus === "paid";
        if (filter === "REJECTED") return c.status === "rejected";
        if (filter === "REPEATED") return c.isRepeatedClaim === true;
        return true;
      });
    }

    // Apply pagination in memory
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = enrichedClaims.length;
    const paginatedClaims = enrichedClaims.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: paginatedClaims,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get All Claims Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching all claims" });
  }
};

export const updateClaimStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemark, remark } = req.body;

    const normalizedStatus = status.toLowerCase();
    if (!["approved", "rejected"].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const claim = await Claim.findById(id).populate('card');
    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    const isRejected = normalizedStatus === "rejected";
    let roleName = "ADMIN";
    let employeeId = null;

    if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ userId: req.user.id });
      if (emp) {
        roleName = emp.role;
        employeeId = emp._id;
      }
    } else if (req.user.role === 'staff' || req.user.role === 'superadmin') {
      roleName = "ADMIN";
    }

    const finalRemark = remark || adminRemark || "";

    // Add to history
    claim.approvalHistory.push({
      role: roleName,
      status: status,
      remark: finalRemark,
      processedBy: employeeId,
      date: Date.now()
    });

    if (isRejected) {
      claim.status = "rejected";
      claim.adminRemark = finalRemark; // Show reason to the cardholder regardless of who rejected
    } else {
      if (roleName === "ADMIN") {
        claim.status = "approved";
        claim.currentStage = "COMPLETED";
        claim.adminRemark = finalRemark;
      } else {
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
        let startIdx = hierarchyOrder.indexOf(roleName) + 1;
        if (startIdx <= 0) startIdx = hierarchyOrder.indexOf("ADMIN"); // Fallback

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
              {
                $or: [
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
                {
                  $or: [
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

        claim.currentStage = nextStage;
        claim.stageDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
    }

    await claim.save();

    res.status(200).json({
      success: true,
      message: `Claim ${status} successfully`,
      data: claim,
    });
  } catch (error) {
    console.error("Update Claim Status Error:", error);
    res.status(500).json({ success: false, message: "Server error updating claim status" });
  }
};

export const approveAmount = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (amount === undefined || amount < 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const claim = await Claim.findById(id);
    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    claim.approvedAmount = amount;
    await claim.save();

    res.status(200).json({
      success: true,
      message: "Approved amount updated successfully",
      data: claim
    });
  } catch (error) {
    console.error("Approve Amount Error:", error);
    res.status(500).json({ success: false, message: "Server error updating approved amount" });
  }
};

export const payClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { method, adminRemark } = req.body;
    const paymentProof = req.file;

    const claim = await Claim.findById(id).populate('card');
    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    if (claim.payoutStatus === "paid") {
      return res.status(400).json({ success: false, message: "Claim is already paid" });
    }

    if (claim.approvedAmount <= 0) {
      return res.status(400).json({ success: false, message: "Approved amount must be greater than zero to pay" });
    }

    let payoutId = `MANUAL-${Date.now()}`;

    // Simulate Razorpay if method is razorpay (since we don't have the actual integration code here, we will mock it just like withdrawals usually do or call real razorpay if available)
    if (method === "razorpay") {
      payoutId = `rzp_payout_${Date.now()}`;
      // In a real scenario, we'd use Razorpay SDK here using claim.bankDetails
    }

    claim.payoutStatus = "paid";
    claim.payoutId = payoutId;
    claim.payoutDate = new Date();
    claim.status = "approved";
    claim.currentStage = "COMPLETED";

    if (adminRemark) {
      claim.adminRemark = adminRemark;
    }

    if (paymentProof) {
      claim.paymentSlipUrl = `/uploads/claims/${paymentProof.filename}`;
    }

    // Add to history to show payout
    claim.approvalHistory.push({
      role: "ADMIN",
      status: "approved", // or 'paid'
      remark: `Payment Processed (${method}): ${adminRemark || ''}`,
      processedBy: req.user?.id ? null : null, // Assuming admin might not be Employee model
      date: Date.now()
    });

    await claim.save();

    res.status(200).json({
      success: true,
      message: "Claim paid successfully",
      data: claim
    });

  } catch (error) {
    console.error("Pay Claim Error:", error);
    res.status(500).json({ success: false, message: "Server error processing claim payment" });
  }
};

// Soft Delete Claim by Admin
export const deleteClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: "Reason is required to delete a claim" });
    }

    const claim = await Claim.findById(id);
    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    claim.isDeleted = true;
    claim.deletedReason = reason;
    claim.status = "rejected"; // To halt further processing
    claim.currentStage = "COMPLETED"; // To remove from queues

    // Add to history
    claim.approvalHistory.push({
      role: "ADMIN",
      status: "Rejected",
      remark: `DELETED BY ADMIN: ${reason}`,
      processedBy: req.user?.id ? req.user.id : null,
      date: Date.now()
    });

    await claim.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Claim deleted successfully"
    });

  } catch (error) {
    console.error("Delete Claim Error:", error);
    res.status(500).json({ success: false, message: "Server error deleting claim" });
  }
};
