import mongoose from "mongoose";
import Card from "../models/Card.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Transaction from "../models/Transaction.js";
import SystemConfig from "../models/SystemConfig.js";
import bcrypt from "bcryptjs";
import AdministrativeStaff from "../models/AdministrativeStaff.js";
import GoalConfig from "../models/GoalConfig.js";
import * as XLSX from 'xlsx';

export const cardController = {
  // Create a new card and an associated cardHolder user
  createCard: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const cardData = req.body;
      const { mobileNumber, dob, cardholderName } = cardData;

      // 1. Fetch System Config (Robustness Stage 5)
      let config = await SystemConfig.findOne().session(session);
      if (!config) {
        // Fallback to defaults if not configured
        config = { cardPrice: 150, commissions: { PE: 50, BS: 100, DM: 150 } };
      }

      const CARD_PRICE = cardData.cardType === "Old Card" ? 0 : config.cardPrice;
      const employee = await Employee.findOne({ userId: req.user.id }).session(session);
      const staff = await AdministrativeStaff.findOne({ userId: req.user.id }).session(session);

      // Permission and Balance check
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        // If employee role
        if (req.user.role === 'employee') {
          if (!employee || (employee.walletBalance || 0) < CARD_PRICE) {
            await session.abortTransaction();
            return res.status(400).json({
              success: false,
              error: `Insufficient wallet balance. You need ₹${CARD_PRICE} to issue a card. Current balance: ₹${employee?.walletBalance || 0}`
            });
          }
        }
        // If staff role, we might not deduct from wallet if not requested, 
        // but for now let's assume they might need balance too or it's free for them to issue?
        // Usually staff doesn't pay from wallet, they just issue.
      }

      // 2. Check if Aadhaar already exists
      const existingCard = await Card.findOne({ aadhaarNumber: cardData.aadhaarNumber }).session(session);
      if (existingCard) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: "Card with this Aadhaar already exists." });
      }

      // 3. Manage User Account for CardHolder
      let user = await User.findOne({ phone: mobileNumber }).session(session);

      if (user && user.role !== 'cardHolder') {
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: "This mobile number is already registered to an Employee/Staff/Applicant and cannot be used for a card." });
      }

      if (!user) {
        const formattedDob = new Date(dob).toLocaleDateString('en-GB').replace(/\//g, '');
        const hashedPassword = await bcrypt.hash(formattedDob, 10);

        user = (await User.create([{
          phone: mobileNumber,
          email: cardData.email ? cardData.email.toLowerCase() : null,
          password: hashedPassword,
          role: "cardHolder"
        }], { session }))[0];
      } else if (cardData.email && !user.email) {
        // If user exists but has no email, update it
        user.email = cardData.email.toLowerCase();
        await user.save({ session });
      }

      // 4. Generate Unique Card ID
      const count = await Card.countDocuments().session(session);
      const cardId = `JSSA-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

      // 5. Save Card
      const newCard = new Card({
        ...cardData,
        cardId,
        issuedBy: req.user.id,
        cardHolderUser: user._id,
        location: cardData.location || undefined
      });
      await newCard.save({ session });

      // 6. Wallet Deduction & Transaction Log (Only for New Cards)
      if (cardData.cardType !== "Old Card") {
        if (req.user.role === 'employee' && employee) {
          await Employee.findByIdAndUpdate(
            employee._id,
            { $inc: { walletBalance: -CARD_PRICE } },
            { session }
          );

          await Transaction.create([{
            userId: req.user.id,
            employeeId: employee._id,
            amount: CARD_PRICE,
            type: 'DEBIT_CARD_ISSUE',
            status: 'SUCCESS',
            remarks: `Issued card to ${cardholderName} (${cardId})`
          }], { session });

          // 7. Salary Distribution (Multi-Level Hierarchy Credit)
          // a. Credit the issuer (PE usually)
          const issuerRole = employee.role || 'PE';

          // Fetch GoalConfig for the issuer
          const issuerGoalConfig = await GoalConfig.findOne({ role: issuerRole }).session(session);
          const issuerCommission = issuerGoalConfig?.individualCommission || (config.commissions[issuerRole] || 0);

          if (issuerCommission > 0) {
            await Employee.findByIdAndUpdate(
              employee._id,
              { $inc: { salaryWallet: issuerCommission } },
              { session }
            );
            await Transaction.create([{
              userId: req.user.id,
              employeeId: employee._id,
              amount: issuerCommission,
              type: 'CREDIT_COMMISSION',
              status: 'SUCCESS',
              remarks: `Commission for card issuance (${cardId})`
            }], { session });
          }

          // b. Traverse Upwards for Senior Commissions (BS, DM, and Staff)
          let currentEmp = employee;
          let currentParentId = employee.reportingTo;
          let depth = 0;
          const processedRoles = new Set([issuerRole]);
          const hierarchyOrder = ['PE', 'BS', 'DM', 'ZC', 'RM'];

          while (depth < 5 && processedRoles.size < hierarchyOrder.length) { // Safety depth limit
            let parentEmployee = null;
            
            // Strictly use robust location-based mapping to bypass manual reportingTo errors
            const currentRoleIdx = hierarchyOrder.indexOf(currentEmp.role || 'PE');
            
            // Try to find the next available senior role by location
            for (let i = currentRoleIdx + 1; i < hierarchyOrder.length; i++) {
              const targetRole = hierarchyOrder[i];
              if (processedRoles.has(targetRole)) continue;

              let query = { role: targetRole, isZoneLocked: true };
              let isValidLocation = false;

              if (targetRole === 'BS' && employee.workingBlock) {
                query.$and = [
                  { workingBlock: employee.workingBlock },
                  { $or: [
                      { isAllPanchayatsAssigned: true },
                      { workingPanchayats: employee.workingPanchayat || null }
                    ]
                  }
                ];
                // Fallback to strict block match if panchayat is empty (robustness)
                if (!employee.workingPanchayat) {
                   query = { role: 'BS', isZoneLocked: true, workingBlock: employee.workingBlock };
                }
                isValidLocation = true;
              } else if (targetRole === 'DM' && employee.workingDistrict) {
                const distName = employee.workingDistrict.toString().split('/')[0].trim();
                const safeDist = distName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                query.$and = [
                  { workingDistrict: { $regex: new RegExp(`^${safeDist}`, 'i') } },
                  { $or: [
                      { isAllBlocksAssigned: true },
                      { workingBlocks: employee.workingBlock || null }
                    ]
                  }
                ];
                // Fallback to strict district match if block array is empty (robustness)
                if (!employee.workingBlock) {
                   query = { role: 'DM', isZoneLocked: true, workingDistrict: { $regex: new RegExp(`^${safeDist}`, 'i') } };
                }
                isValidLocation = true;
              } else if (targetRole === 'ZC' && employee.workingDistrict) {
                const distName = employee.workingDistrict.toString().split('/')[0].trim();
                const safeDist = distName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                query.workingDistrict = { $regex: new RegExp(`(^|,\\s*)${safeDist}`, 'i') };
                isValidLocation = true;
              } else if (targetRole === 'RM' && employee.workingState) {
                const stateName = employee.workingState.toString().split('/')[0].trim();
                const safeState = stateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                query.workingState = { $regex: new RegExp(`^${safeState}`, 'i') };
                isValidLocation = true;
              }

              if (isValidLocation) {
                parentEmployee = await Employee.findOne(query).session(session);
                if (parentEmployee) {
                  break; // Found the next strictly geographic senior!
                }
              }
            }

            if (!parentEmployee) break;

            const pRole = parentEmployee.role;
            if (pRole && ['BS', 'DM', 'ZC', 'RM'].includes(pRole) && !processedRoles.has(pRole)) {

              const pGoalConfig = await GoalConfig.findOne({ role: pRole }).session(session);

              let pCommission = 0;
              if (pGoalConfig && pGoalConfig.layeredCommissions && pGoalConfig.layeredCommissions.length > 0) {
                const roleMapping = { 'PE': 'Panchayat Executive', 'BS': 'Block Supervisor', 'DM': 'District Manager', 'ZC': 'Zonal Coordinator', 'RM': 'Regional Manager' };
                const targetRoleStr = roleMapping[issuerRole] || issuerRole;

                const layeredItem = pGoalConfig.layeredCommissions.find(l =>
                  (l.roleName || "").toLowerCase() === targetRoleStr.toLowerCase() ||
                  (l.roleName || "").toUpperCase() === issuerRole.toUpperCase()
                );

                if (layeredItem && layeredItem.commission > 0) {
                  pCommission = layeredItem.commission;
                } else {
                  // Fallback to their individual commission or old system config
                  pCommission = pGoalConfig.individualCommission || (config.commissions[pRole] || 0);
                }
              } else {
                pCommission = pGoalConfig?.individualCommission || (config.commissions[pRole] || 0);
              }

              if (pCommission > 0) {
                await Employee.findByIdAndUpdate(
                  parentEmployee._id,
                  { $inc: { salaryWallet: pCommission } },
                  { session }
                );
                await Transaction.create([{
                  userId: parentEmployee.userId,
                  employeeId: parentEmployee._id,
                  amount: pCommission,
                  type: 'CREDIT_COMMISSION',
                  status: 'SUCCESS',
                  remarks: `Hierarchy commission from ${employee.role} card issuance (${cardId})`
                }], { session });
                processedRoles.add(pRole);
              }
            }
            currentEmp = parentEmployee;
            currentParentId = parentEmployee.reportingTo;
            depth++;
          }
        }

        // 8. Global Staff Commission Logic: ALL staff with active commissions get credited
        const activeStaffs = await AdministrativeStaff.find({
          "cardCommission.enabled": true,
          "cardCommission.amountPerCard": { $gt: 0 }
        }).session(session);

        for (const staffMember of activeStaffs) {
          // Skip if the staff member is already the issuer (handled above in req.user.role === 'staff')
          // to avoid double payment if the staff themselves created the card
          if (req.user.role === 'staff' && req.user.id.toString() === staffMember.userId.toString()) {
            continue;
          }

          const amount = staffMember.cardCommission.amountPerCard;
          await AdministrativeStaff.findByIdAndUpdate(
            staffMember._id,
            { $inc: { salaryWallet: amount, totalCardEarnings: amount } },
            { session }
          );

          await Transaction.create([{
            userId: staffMember.userId,
            staffId: staffMember._id,
            amount: amount,
            type: 'CREDIT_COMMISSION',
            status: 'SUCCESS',
            remarks: `Global staff commission for card ${cardId}`,
            metadata: { cardId, issuedBy: req.user.id }
          }], { session });
        }

        // 9. Single Staff Issuer Logic (if the staff themselves created it, they get paid here)
        if (req.user.role === 'staff' && staff) {
          if (staff.cardCommission && staff.cardCommission.enabled && staff.cardCommission.amountPerCard > 0) {
            const amount = staff.cardCommission.amountPerCard;
            await AdministrativeStaff.findByIdAndUpdate(
              staff._id,
              { $inc: { salaryWallet: amount, totalCardEarnings: amount } },
              { session }
            );

            await Transaction.create([{
              userId: req.user.id,
              staffId: staff._id,
              amount: amount,
              type: 'CREDIT_COMMISSION',
              status: 'SUCCESS',
              remarks: `Direct staff card commission for ${cardId}`,
              metadata: { cardId, cardholderName }
            }], { session });
          }
        }
      }

      await session.commitTransaction();
      res.status(201).json({
        success: true,
        message: "Card created successfully and balance/salary processed.",
        data: newCard
      });

    } catch (error) {
      await session.abortTransaction();
      console.error("Create Card Error:", error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      session.endSession();
    }
  },

  // Get list of cards (for Employee/Admin)
  getAllCards: async (req, res) => {
    try {
      const { search, role, cardType, state, district, block, panchayat, dateRange, startDate, endDate, page = 1, limit = 10 } = req.query;
      const query = {};

      if (cardType && cardType !== "all") {
        query.cardType = cardType;
      }

      if (dateRange && dateRange !== "all") {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        if (dateRange === "today") {
          query.createdAt = { $gte: startOfDay };
        } else if (dateRange === "yesterday") {
          const startOfYesterday = new Date(startOfDay);
          startOfYesterday.setDate(startOfYesterday.getDate() - 1);
          const endOfYesterday = new Date(startOfDay);
          endOfYesterday.setMilliseconds(endOfYesterday.getMilliseconds() - 1);
          query.createdAt = { $gte: startOfYesterday, $lte: endOfYesterday };
        } else if (dateRange === "last7days") {
          const last7Days = new Date(startOfDay);
          last7Days.setDate(last7Days.getDate() - 6);
          query.createdAt = { $gte: last7Days };
        } else if (dateRange === "last30days") {
          const last30Days = new Date(startOfDay);
          last30Days.setDate(last30Days.getDate() - 29);
          query.createdAt = { $gte: last30Days };
        } else if (dateRange === "thisMonth") {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          query.createdAt = { $gte: startOfMonth };
        } else if (dateRange === "pastMonth") {
          const startOfPastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endOfPastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          query.createdAt = { $gte: startOfPastMonth, $lt: endOfPastMonth };
        } else if (dateRange === "custom_date" && startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt = { $gte: start, $lte: end };
        }
      }

      if (search) {
        query.$or = [
          { cardholderName: { $regex: search, $options: "i" } },
          { cardId: { $regex: search, $options: "i" } },
          { mobileNumber: { $regex: search, $options: "i" } },
          { aadhaarNumber: { $regex: search, $options: "i" } }
        ];
      }

      // Filter by State and District directly on Card document
      if (state && state !== "all") {
        const primaryState = state.split('/')[0].trim();
        query.state = { $regex: new RegExp(`^${primaryState}`, 'i') };
      }
      if (district && district !== "all") {
        const primaryDistrict = district.split('/')[0].trim();
        query.district = { $regex: new RegExp(`^${primaryDistrict}`, 'i') };
      }

      // Restrict visibility for employees and staff
      let viewAll = false;
      if (req.user.role === 'admin' || req.user.role === 'superadmin') {
        viewAll = true;
      } else if (req.user.role === 'staff') {
        const staff = await AdministrativeStaff.findOne({ userId: req.user.id }).populate('jobRoleId');
        if (staff && staff.jobRoleId && staff.jobRoleId.permissions) {
          const perms = staff.jobRoleId.permissions.map(p => p.toLowerCase().replace(/([A-Z])/g, "_$1").trim());
          if (
            perms.some(p => p === 'wallet' || p === 'card management' || p === 'card_management' || p === 'cardholdermanagement' || p === 'cardholder_management') ||
            staff.jobRoleId.permissions.some(p => p.toLowerCase() === 'wallet' || p.toLowerCase() === 'card management' || p.toLowerCase() === 'cardholder management')
          ) {
            viewAll = true;
          }
        }
      }

      if (!viewAll) {
        query.issuedBy = new mongoose.Types.ObjectId(req.user.id);
      }

      // Base aggregation pipeline
      const pipeline = [
        { $match: query }
      ];

      // Add issuer relation to filter by Issuer Role if explicitly requested
      const needsEmployeeJoin = (role && role !== "all");
      
      if (needsEmployeeJoin) {
        pipeline.push({
          $lookup: {
            from: "employees",
            localField: "issuedBy",
            foreignField: "userId",
            as: "issuerEmp"
          }
        });
        
        pipeline.push({ $unwind: { path: "$issuerEmp", preserveNullAndEmptyArrays: true } });
        
        if (role && role !== "all") {
          pipeline.push({ $match: { "issuerEmp.role": role.toUpperCase() } });
        }
      }
      // Count total after filters
      let total = 0;
      if (needsEmployeeJoin) {
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await Card.aggregate(countPipeline);
        total = countResult.length > 0 ? countResult[0].total : 0;
      } else {
        total = await Card.countDocuments(query);
      }

      // Add sorting, skip, limit
      const skip = (page - 1) * limit;
      pipeline.push({ $sort: { createdAt: -1 } });
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: parseInt(limit) });

      console.time("getAllCards - Pipeline Execution");
      // Run pipeline
      const aggCards = await Card.aggregate(pipeline);
      console.timeEnd("getAllCards - Pipeline Execution");

      console.time("getAllCards - Populate");
      // Populate 'issuedBy' using Mongoose populate
      const cards = await Card.populate(aggCards, { path: "issuedBy", select: "email phone role" });
      console.timeEnd("getAllCards - Populate");

      // Batch fetch issuer details in 3 parallel queries instead of N+1 loop queries
      const issuerUserIds = [...new Set(cards.map(c => c.issuedBy?._id?.toString()).filter(Boolean))];

      let employeeMap = {};
      let staffMap = {};
      let userMap = {};

      if (issuerUserIds.length > 0) {
        const [employees, staffMembers, users] = await Promise.all([
          Employee.find({ userId: { $in: issuerUserIds } }).select("userId name designation role"),
          AdministrativeStaff.find({ userId: { $in: issuerUserIds } }).select("userId name role"),
          User.find({ _id: { $in: issuerUserIds } }).select("name role email phone")
        ]);

        employees.forEach(e => { if (e.userId) employeeMap[e.userId.toString()] = e; });
        staffMembers.forEach(s => { if (s.userId) staffMap[s.userId.toString()] = s; });
        users.forEach(u => { userMap[u._id.toString()] = u; });
      }

      const enrichedCards = cards.map((card) => {
        const cardObj = card.toObject ? card.toObject() : { ...card };
        if (cardObj.issuedBy && cardObj.issuedBy._id) {
          const uId = cardObj.issuedBy._id.toString();
          const emp = employeeMap[uId];
          if (emp) {
            cardObj.issuedBy.name = emp.name;
            cardObj.issuedBy.designation = emp.designation || emp.role || "Employee";
          } else {
            const st = staffMap[uId];
            if (st) {
              cardObj.issuedBy.name = st.name;
              cardObj.issuedBy.designation = st.role || "Staff";
            } else {
              const us = userMap[uId];
              cardObj.issuedBy.name = us?.name || "Admin";
              cardObj.issuedBy.designation = us?.role || "Administrator";
            }
          }
        }
        return cardObj;
      });

      res.json({
        success: true,
        data: {
          cards: enrichedCards,
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get all cards for the logged-in cardHolder
  getMyCard: async (req, res) => {
    try {
      let projection = {};
      if (req.query.basic === 'true') {
         projection = { photo: 0 }; // Exclude heavy base64 photo for forms
      }
      const cards = await Card.find({ cardHolderUser: req.user.id }, projection).populate("issuedBy", "email phone role");
      if (!cards || cards.length === 0) {
        return res.status(404).json({ success: false, error: "No cards found for this user." });
      }

      const cardsArr = await Promise.all(cards.map(async (card) => {
        const cardObj = card.toObject();
        if (card.issuedBy) {
          const employee = await Employee.findOne({ userId: card.issuedBy._id });
          if (employee) {
            cardObj.issuedBy.name = employee.name;
          }
        }
        return cardObj;
      }));

      res.json({ success: true, data: cardsArr });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get card details by ID (for Admin/Employee)
  getCardById: async (req, res) => {
    try {
      const card = await Card.findById(req.params.id).populate("issuedBy", "email");
      if (!card) return res.status(404).json({ success: false, error: "Card not found." });
      res.json({ success: true, data: card });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update card details
  updateCard: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const cardId = req.params.id;
      const updateData = req.body;

      const card = await Card.findById(cardId).session(session);
      if (!card) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, error: "Card not found." });
      }

      // Authorization check: only admin, superadmin, or the employee who issued the card can edit it
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        if (card.issuedBy.toString() !== req.user.id.toString()) {
          await session.abortTransaction();
          return res.status(403).json({ success: false, error: "You are not authorized to edit this card." });
        }
      }

      // Update associated User model if mobileNumber or email changes
      if (card.cardHolderUser) {
        const userUpdates = {};
        let needsUserUpdate = false;

        if (updateData.mobileNumber) {
          const existingUser = await User.findOne({ phone: updateData.mobileNumber }).session(session);
          if (existingUser && existingUser.role !== 'cardHolder') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, error: "This mobile number belongs to an Employee/Staff and cannot be used for a card. Please update it to a valid cardholder number." });
          }
          if (updateData.mobileNumber !== card.mobileNumber) {
            if (existingUser && existingUser._id.toString() !== card.cardHolderUser.toString()) {
              // Switch ownership of this card to the existing user
              updateData.cardHolderUser = existingUser._id;
            } else {
              userUpdates.phone = updateData.mobileNumber;
              needsUserUpdate = true;
            }
          }
        }

        if (updateData.email && updateData.email !== card.email) {
          userUpdates.email = updateData.email;
          needsUserUpdate = true;
        }

        if (needsUserUpdate) {
          const targetUserId = updateData.cardHolderUser || card.cardHolderUser;
          await User.findByIdAndUpdate(targetUserId, { $set: userUpdates }, { session });
        }
      }

      const updatedCard = await Card.findByIdAndUpdate(
        cardId,
        { $set: updateData },
        { new: true, runValidators: true, session }
      );

      await session.commitTransaction();
      res.json({
        success: true,
        message: "Card and user login details updated successfully",
        data: updatedCard
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Update Card Error:", error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      session.endSession();
    }
  },

  exportCardsCSV: async (req, res) => {
    try {
      const { search, role, state, district, block, panchayat, dateRange } = req.query;
      const query = {};

      if (dateRange && dateRange !== "all") {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        if (dateRange === "today") {
          query.createdAt = { $gte: startOfDay };
        } else if (dateRange === "yesterday") {
          const startOfYesterday = new Date(startOfDay);
          startOfYesterday.setDate(startOfYesterday.getDate() - 1);
          const endOfYesterday = new Date(startOfDay);
          endOfYesterday.setMilliseconds(endOfYesterday.getMilliseconds() - 1);
          query.createdAt = { $gte: startOfYesterday, $lte: endOfYesterday };
        } else if (dateRange === "last7days") {
          const last7Days = new Date(startOfDay);
          last7Days.setDate(last7Days.getDate() - 6);
          query.createdAt = { $gte: last7Days };
        } else if (dateRange === "last30days") {
          const last30Days = new Date(startOfDay);
          last30Days.setDate(last30Days.getDate() - 29);
          query.createdAt = { $gte: last30Days };
        } else if (dateRange === "thisMonth") {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          query.createdAt = { $gte: startOfMonth };
        }
      }

      if (search) {
        query.$or = [
          { cardholderName: { $regex: search, $options: "i" } },
          { cardId: { $regex: search, $options: "i" } },
          { mobileNumber: { $regex: search, $options: "i" } },
          { aadhaarNumber: { $regex: search, $options: "i" } }
        ];
      }

      if (role && role !== "all") {
        const matchingEmployees = await Employee.find({ role: role.toUpperCase() }).select('userId');
        const userIds = matchingEmployees.map(emp => emp.userId);
        query.issuedBy = { $in: userIds };
      }

      // Filter by Issuer's Location instead of Cardholder's Location to match Team Targets
      if ((state && state !== "all") || (district && district !== "all") || (block && block !== "all") || (panchayat && panchayat !== "all")) {
        let empMatch = {};
        if (state && state !== "all") {
            const primaryState = state.split('/')[0].trim();
            empMatch.workingState = { $regex: new RegExp(`^${primaryState}`, 'i') };
        }
        if (district && district !== "all") {
            const primaryDistrict = district.split('/')[0].trim();
            empMatch.workingDistrict = { $regex: new RegExp(`^${primaryDistrict}`, 'i') };
        }        
        if (block && block !== "all") {
            const Block = mongoose.models.Block || mongoose.model("Block");
            const matchedBlocks = await Block.find({ name: { $regex: new RegExp(`^${block}$`, "i") } }).select("_id");
            empMatch.workingBlock = { $in: matchedBlocks.map(b => b._id) };
        }
        if (panchayat && panchayat !== "all") {
            const Panchayat = mongoose.models.Panchayat || mongoose.model("Panchayat");
            const matchedPanchayats = await Panchayat.find({ name: { $regex: new RegExp(`^${panchayat}$`, "i") } }).select("_id");
            empMatch.workingPanchayat = { $in: matchedPanchayats.map(p => p._id) };
        }
        
        const matchingEmployees = await Employee.find(empMatch).select('userId');
        const userIdsFromLoc = matchingEmployees.map(emp => emp.userId);
        
        if (query.issuedBy && query.issuedBy.$in) {
            const existingIds = query.issuedBy.$in.map(id => id.toString());
            query.issuedBy.$in = userIdsFromLoc.filter(id => id && existingIds.includes(id.toString()));
        } else {
            query.issuedBy = { $in: userIdsFromLoc };
        }
      }

      let viewAll = false;
      if (req.user.role === 'admin' || req.user.role === 'superadmin') {
        viewAll = true;
      } else if (req.user.role === 'staff') {
        const staff = await AdministrativeStaff.findOne({ userId: req.user.id }).populate('jobRoleId');
        if (staff && staff.jobRoleId && staff.jobRoleId.permissions) {
          const perms = staff.jobRoleId.permissions.map(p => p.toLowerCase().replace(/([A-Z])/g, "_$1").trim());
          if (
            perms.some(p => p === 'wallet' || p === 'card management' || p === 'card_management') ||
            staff.jobRoleId.permissions.some(p => p.toLowerCase() === 'wallet' || p.toLowerCase() === 'card management')
          ) {
            viewAll = true;
          }
        }
      }

      if (!viewAll) {
        if (query.issuedBy && query.issuedBy.$in && !query.issuedBy.$in.some(id => id.toString() === req.user.id.toString())) {
            query.issuedBy = null;
        } else {
            query.issuedBy = req.user.id;
        }
      }

      const cards = await Card.find(query).populate("issuedBy", "email phone role").sort({ createdAt: -1 });

      const exportData = await Promise.all(cards.map(async (card) => {
        let issuedByRole = "ADMIN";
        let issuedByName = "ADMIN";
        if (card.issuedBy) {
          const employee = await Employee.findOne({ userId: card.issuedBy._id });
          if (employee) {
            issuedByRole = employee.role || "EMPLOYEE";
            issuedByName = employee.name || "N/A";
          }
        }
        return {
          "Card ID": card.cardId || "N/A",
          "Cardholder Name": card.cardholderName || "N/A",
          "Mobile": card.mobileNumber || "N/A",
          "Aadhaar": card.aadhaarNumber || "N/A",
          "State": card.state || "N/A",
          "District": card.district || "N/A",
          "Block": card.block || "N/A",
          "Panchayat": card.villageCity || "N/A",
          "Status": card.status || "N/A",
          "Issued By (Name)": issuedByName,
          "Issued By (Role)": issuedByRole,
          "Created At": card.createdAt ? new Date(card.createdAt).toLocaleDateString() : "N/A"
        };
      }));

      if (exportData.length === 0) {
        exportData.push({ "Message": "No data found matching the filters." });
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      const colWidths = [
        { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 },
        { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
        { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Cards");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      res.setHeader("Content-Disposition", 'attachment; filename="cards_list.xlsx"');
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      return res.send(buffer);
    } catch (error) {
      console.error("Export Cards Error:", error);
      res.status(500).json({ success: false, error: 'Internal server error during export' });
    }
  },

  getFilterCounts: async (req, res) => {
    try {
      const { role, state, district, block } = req.query;
      
      const matchQuery = {};
      if (state && state !== "all") matchQuery.state = { $regex: new RegExp(`^${state}`, 'i') };
      if (district && district !== "all") matchQuery.district = { $regex: new RegExp(`^${district}$`, 'i') };
      if (block && block !== "all") matchQuery.block = { $regex: new RegExp(`^${block}$`, 'i') };

      // Restrict visibility for employees and staff
      let viewAll = false;
      if (req.user.role === 'admin' || req.user.role === 'superadmin') {
        viewAll = true;
      } else if (req.user.role === 'staff') {
        const staff = await AdministrativeStaff.findOne({ userId: req.user.id }).populate('jobRoleId');
        if (staff && staff.jobRoleId && staff.jobRoleId.permissions) {
          const perms = staff.jobRoleId.permissions.map(p => p.toLowerCase().replace(/([A-Z])/g, "_$1").trim());
          if (
            perms.some(p => p === 'wallet' || p === 'card management' || p === 'card_management') ||
            staff.jobRoleId.permissions.some(p => p.toLowerCase() === 'wallet' || p.toLowerCase() === 'card management')
          ) {
            viewAll = true;
          }
        }
      }

      if (!viewAll) {
        matchQuery.issuedBy = new mongoose.Types.ObjectId(req.user.id);
      }

      const pipelineBase = [
        { $match: matchQuery }
      ];

      // Add issuer relation to filter by Role internally
      if (role && role !== "all") {
        pipelineBase.push({
          $lookup: {
            from: "employees",
            localField: "issuedBy",
            foreignField: "userId",
            as: "issuerEmp"
          }
        });
        pipelineBase.push({ $unwind: "$issuerEmp" });
        pipelineBase.push({ $match: { "issuerEmp.role": role.toUpperCase() } });
      }

      const stateFacet = [
        { $group: { _id: "$state", count: { $sum: 1 } } },
        { $match: { _id: { $ne: null, $ne: "" } } }
      ];

      const districtFacet = [
        { $group: { _id: "$district", count: { $sum: 1 } } },
        { $match: { _id: { $ne: null, $ne: "" } } }
      ];

      const blockFacet = [
        { $group: { _id: "$block", count: { $sum: 1 } } },
        { $match: { _id: { $ne: null, $ne: "" } } }
      ];

      const panchayatFacet = [
        { $group: { _id: "$villageCity", count: { $sum: 1 } } },
        { $match: { _id: { $ne: null, $ne: "" } } }
      ];

      console.time("getFilterCounts - Pipeline Execution");
      const results = await Card.aggregate([
        ...pipelineBase,
        {
          $facet: {
            states: stateFacet,
            districts: districtFacet,
            blocks: blockFacet,
            panchayats: panchayatFacet
          }
        }
      ]);
      console.timeEnd("getFilterCounts - Pipeline Execution");

      const formatCounts = (arr) => {
        const formatted = {};
        arr.forEach(item => { formatted[item._id] = item.count; });
        return formatted;
      };

      const filterCounts = {
        states: formatCounts(results[0].states),
        districts: formatCounts(results[0].districts),
        blocks: formatCounts(results[0].blocks),
        panchayats: formatCounts(results[0].panchayats)
      };

      res.json({ success: true, data: filterCounts });
    } catch (error) {
      console.error("Get Card Filter Counts Error:", error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  },

  checkDuplicate: async (req, res) => {
    try {
      const { mobileNumber, email, excludeCardId } = req.body;
      
      if (!mobileNumber && !email) {
        return res.status(400).json({ success: false, error: "Please provide mobileNumber or email to check." });
      }

      // Check User collection globally
      let excludeUserId = null;
      if (excludeCardId) {
        const currentCard = await Card.findById(excludeCardId).populate('cardHolderUser');
        if (currentCard && currentCard.cardHolderUser) {
          if (currentCard.cardHolderUser.role === 'cardHolder') {
            excludeUserId = currentCard.cardHolderUser._id;
          }
        }
      }

      const userQuery = {};
      if (mobileNumber) {
        userQuery.phone = mobileNumber;
      } else if (email) {
        userQuery.email = email.toLowerCase();
      }

      if (excludeUserId) {
        userQuery._id = { $ne: excludeUserId };
      }

      const existingUser = await User.findOne(userQuery);

      if (existingUser) {
        if (email) {
          return res.json({
            success: true,
            duplicate: true,
            field: "email",
            message: "This email address is already registered to an account."
          });
        }

        if (existingUser.role !== 'cardHolder') {
          return res.json({
            success: true,
            duplicate: true,
            field: "mobileNumber",
            message: "This mobile number is already registered to an Employee/Staff/Applicant."
          });
        } else {
          // It's a card holder! Let them proceed, but send info back.
          // Try to fetch the real name from one of their existing cards since User model might not have it.
          let actualName = existingUser.name;
          if (!actualName) {
            const linkedCard = await Card.findOne({ cardHolderUser: existingUser._id });
            if (linkedCard && linkedCard.cardholderName) {
              actualName = linkedCard.cardholderName;
            }
          }

          return res.json({
            success: true,
            duplicate: false,
            isExistingCardHolder: true,
            userDetails: {
              name: actualName || "Card Holder",
              role: existingUser.role,
              phone: existingUser.phone,
              email: existingUser.email
            }
          });
        }
      }

      // Fallback: Check if there's a Card with this number (just in case the User object is missing)
      const query = {};
      if (mobileNumber) {
        query.mobileNumber = mobileNumber;
      } else if (email) {
        query.email = email;
      }

      if (excludeCardId) {
        query._id = { $ne: excludeCardId };
      }

      const existingCard = await Card.findOne(query);

      if (existingCard) {
        return res.json({
          success: true,
          duplicate: false,
          isExistingCardHolder: true,
          userDetails: {
            name: existingCard.cardholderName,
            role: "cardHolder",
            phone: existingCard.mobileNumber,
            email: existingCard.email
          }
        });
      }

      res.json({ success: true, duplicate: false, isExistingCardHolder: false });
    } catch (error) {
      console.error("Check Duplicate Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Admin Manual Card Creation (Zero Wallet Deduction & Zero Commission Payout)
  adminCreateCard: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const cardData = req.body;
      const { mobileNumber, dob, cardholderName, aadhaarNumber, cardCreatedDate } = cardData;

      if (!aadhaarNumber || !mobileNumber || !cardholderName || !dob) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: "Required fields missing." });
      }

      // Check if Aadhaar already exists
      const existingCard = await Card.findOne({ aadhaarNumber }).session(session);
      if (existingCard) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: "Card with this Aadhaar already exists." });
      }

      // Check if email already belongs to another user
      if (cardData.email && cardData.email.trim()) {
        const cleanEmail = cardData.email.trim().toLowerCase();
        const existingEmailUser = await User.findOne({
          email: cleanEmail,
          phone: { $ne: mobileNumber }
        }).session(session);

        if (existingEmailUser) {
          await session.abortTransaction();
          return res.status(400).json({ success: false, error: "This email address is already registered to another account." });
        }
      }

      // Check or create CardHolder user
      let user = await User.findOne({ phone: mobileNumber }).session(session);

      if (user && user.role !== 'cardHolder') {
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: "This mobile number is registered to an Employee/Staff/Applicant and cannot be used for a card." });
      }

      if (!user) {
        const formattedDob = new Date(dob).toLocaleDateString('en-GB').replace(/\//g, '');
        const hashedPassword = await bcrypt.hash(formattedDob, 10);

        user = (await User.create([{
          phone: mobileNumber,
          email: cardData.email ? cardData.email.toLowerCase() : null,
          password: hashedPassword,
          role: "cardHolder"
        }], { session }))[0];
      } else if (cardData.email && !user.email) {
        user.email = cardData.email.toLowerCase();
        await user.save({ session });
      }

      // Generate Unique Card ID
      const count = await Card.countDocuments().session(session);
      const cardId = `JSSA-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

      // Save Card with cardCreatedDate
      const newCard = new Card({
        ...cardData,
        cardId,
        issuedBy: req.user.id,
        cardHolderUser: user._id,
        cardCreatedDate: cardCreatedDate ? new Date(cardCreatedDate) : new Date(),
        location: cardData.location || undefined
      });

      await newCard.save({ session });

      await session.commitTransaction();
      res.status(201).json({
        success: true,
        message: "Manual Card created successfully (No wallet deduction or commission processed).",
        data: newCard
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Admin Create Card Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to create manual card" });
    } finally {
      session.endSession();
    }
  },

  // Admin Update Card
  adminUpdateCard: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (updateData.cardCreatedDate) {
        updateData.cardCreatedDate = new Date(updateData.cardCreatedDate);
      }

      const card = await Card.findById(id);
      if (!card) {
        return res.status(404).json({ success: false, error: "Card not found" });
      }

      // If mobile or email updated, sync linked User account
      if (card.cardHolderUser) {
        const user = await User.findById(card.cardHolderUser);
        if (user) {
          if (updateData.mobileNumber && updateData.mobileNumber !== user.phone) {
            user.phone = updateData.mobileNumber;
          }
          if (updateData.email && updateData.email !== user.email) {
            user.email = updateData.email.toLowerCase();
          }
          await user.save();
        }
      }

      Object.assign(card, updateData);
      card.updatedAt = new Date();
      await card.save();

      res.json({
        success: true,
        message: "Card details updated successfully",
        data: card
      });
    } catch (error) {
      console.error("Admin Update Card Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to update card" });
    }
  },

  // Admin Delete Card
  adminDeleteCard: async (req, res) => {
    try {
      const { id } = req.params;
      const card = await Card.findById(id);
      if (!card) {
        return res.status(404).json({ success: false, error: "Card not found" });
      }

      // Check if user has other cards
      if (card.cardHolderUser) {
        const otherCardsCount = await Card.countDocuments({ cardHolderUser: card.cardHolderUser, _id: { $ne: id } });
        if (otherCardsCount === 0) {
          // Clean up orphaned cardHolder user account
          await User.findByIdAndDelete(card.cardHolderUser);
        }
      }

      await Card.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Cardholder card deleted successfully"
      });
    } catch (error) {
      console.error("Admin Delete Card Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to delete card" });
    }
  }
};

