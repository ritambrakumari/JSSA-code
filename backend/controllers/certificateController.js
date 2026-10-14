import AssignedCertificate from '../models/AssignedCertificate.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import CertificateConfig from '../models/CertificateConfig.js';
import Card from '../models/Card.js';
import GoalConfig from '../models/GoalConfig.js';

// Get Auto-Assign Certificate Config
export const getCertificateConfig = async (req, res) => {
    try {
        let config = await CertificateConfig.findOne();
        if (!config) {
            config = await CertificateConfig.create({});
        }
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Auto-Assign Certificate Config
export const updateCertificateConfig = async (req, res) => {
    try {
        const { 
            globalExcellenceEnabled, 
            statePerformerEnabled, 
            targetAchievedEnabled, 
            partialPerformanceEnabled, 
            minCardsThresholdForPerformance,
            autoAssignCronEnabled
        } = req.body;

        let config = await CertificateConfig.findOne();
        if (!config) {
            config = new CertificateConfig();
        }

        if (typeof globalExcellenceEnabled === 'boolean') config.globalExcellenceEnabled = globalExcellenceEnabled;
        if (typeof statePerformerEnabled === 'boolean') config.statePerformerEnabled = statePerformerEnabled;
        if (typeof targetAchievedEnabled === 'boolean') config.targetAchievedEnabled = targetAchievedEnabled;
        if (typeof partialPerformanceEnabled === 'boolean') config.partialPerformanceEnabled = partialPerformanceEnabled;
        if (typeof autoAssignCronEnabled === 'boolean') config.autoAssignCronEnabled = autoAssignCronEnabled;
        if (minCardsThresholdForPerformance !== undefined) {
            config.minCardsThresholdForPerformance = Number(minCardsThresholdForPerformance);
        }
        config.updatedBy = req.user ? req.user.id : null;

        await config.save();
        res.status(200).json({ success: true, message: 'Certificate configuration updated successfully', data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Internal Engine Helper: Process Auto-Assignment for a given Month & Year
export const processAutoAssignmentEngine = async (targetMonth, targetYear, adminUserId = null) => {
    let config = await CertificateConfig.findOne();
    if (!config) {
        config = await CertificateConfig.create({});
    }

    const month = Number(targetMonth);
    const year = Number(targetYear);

    const startDate = new Date(year, month - 1, 1, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch Card Creation stats aggregated by issuedBy User
    const cardCounts = await Card.aggregate([
        { 
            $match: { 
                createdAt: { $gte: startDate, $lte: endDate },
                issuedBy: { $exists: true, $ne: null }
            } 
        },
        { $group: { _id: "$issuedBy", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    if (!cardCounts || cardCounts.length === 0) {
        return {
            success: true,
            message: `No card creations found for ${month}/${year}`,
            assignedCount: 0,
            details: []
        };
    }

    // Get Employee mappings
    const userIds = cardCounts.map(c => c._id);
    const employees = await Employee.find({ 
        $or: [
            { userId: { $in: userIds } },
            { _id: { $in: userIds } }
        ]
    }).lean();
    const employeeMap = {};
    employees.forEach(emp => {
        if (emp.userId) employeeMap[emp.userId.toString()] = emp;
        employeeMap[emp._id.toString()] = emp;
    });

    // Fetch GoalConfig for role targets
    const goalConfigs = await GoalConfig.find().lean();
    const goalTargetMap = {};
    goalConfigs.forEach(g => {
        goalTargetMap[g.role] = g.monthlyCardTarget || 0;
    });

    // Combine data
    const employeeStats = [];
    for (let c of cardCounts) {
        const emp = employeeMap[c._id.toString()];
        if (!emp) continue;

        const role = emp.role || emp.designation || "";

        // Explicitly exclude ZC (Zonal Coordinator) and RM (Regional Manager) from auto-assignment
        const isZC = /ZC|Zonal Coordinator/i.test(role);
        const isRM = /RM|Regional Manager/i.test(role);
        if (isZC || isRM) {
            continue;
        }

        // Allow ONLY DM (District Manager), BS (Block Supervisor), and PE (Panchayat Executive)
        const isDM = /DM|District Manager/i.test(role);
        const isBS = /BS|Block Supervisor/i.test(role);
        const isPE = /PE|Panchayat Executive/i.test(role);
        if (!isDM && !isBS && !isPE) {
            continue;
        }

        const roleKey = isDM ? "DM" : isBS ? "BS" : "PE";
        const targetCount = goalTargetMap[roleKey] || emp.monthlyCardTarget || (isDM ? 300 : isBS ? 150 : 50);
        const cardsCount = c.count;
        const achievementPercentage = targetCount > 0 ? Math.round((cardsCount / targetCount) * 100) : 100;
        const state = emp.workingState || emp.state || "Delhi";

        employeeStats.push({
            employee: emp,
            employeeId: emp._id,
            cardsCount,
            targetCount,
            achievementPercentage,
            state
        });
    }

    const createdCertificates = [];

    // Rule 1: Global Top Performer (Employee Excellence)
    if (config.globalExcellenceEnabled && employeeStats.length > 0) {
        const topEmp = employeeStats[0]; // Sorted by count descending
        const templateId = 'employee';

        const existing = await AssignedCertificate.findOne({
            employeeId: topEmp.employeeId,
            templateId,
            month,
            year
        });

        if (!existing) {
            const cert = new AssignedCertificate({
                employeeId: topEmp.employeeId,
                templateId,
                issueDate: endDate,
                assignedBy: adminUserId,
                assignmentType: 'auto_global',
                month,
                year,
                cardsCount: topEmp.cardsCount,
                targetCount: topEmp.targetCount,
                achievementPercentage: topEmp.achievementPercentage,
                state: topEmp.state
            });
            await cert.save();
            createdCertificates.push(cert);
        }
    }

    // Rule 2: State Wise Top Performer (Best State Performer)
    if (config.statePerformerEnabled && employeeStats.length > 0) {
        const stateGroups = {};
        employeeStats.forEach(stat => {
            if (!stateGroups[stat.state]) stateGroups[stat.state] = [];
            stateGroups[stat.state].push(stat);
        });

        for (let stateName in stateGroups) {
            const topStateEmp = stateGroups[stateName][0];
            const templateId = 'employee-best-state';

            const existing = await AssignedCertificate.findOne({
                employeeId: topStateEmp.employeeId,
                templateId,
                month,
                year
            });

            if (!existing) {
                const cert = new AssignedCertificate({
                    employeeId: topStateEmp.employeeId,
                    templateId,
                    issueDate: endDate,
                    assignedBy: adminUserId,
                    assignmentType: 'auto_state',
                    month,
                    year,
                    cardsCount: topStateEmp.cardsCount,
                    targetCount: topStateEmp.targetCount,
                    achievementPercentage: topStateEmp.achievementPercentage,
                    state: stateName
                });
                await cert.save();
                createdCertificates.push(cert);
            }
        }
    }

    // Rule 3: 100% Target Achieved (Outstanding Performance)
    if (config.targetAchievedEnabled) {
        const qualifiers = employeeStats.filter(s => s.achievementPercentage >= 100 && s.cardsCount > 0);
        for (let stat of qualifiers) {
            const templateId = 'employee-outstanding';

            const existing = await AssignedCertificate.findOne({
                employeeId: stat.employeeId,
                templateId,
                month,
                year
            });

            if (!existing) {
                const cert = new AssignedCertificate({
                    employeeId: stat.employeeId,
                    templateId,
                    issueDate: endDate,
                    assignedBy: adminUserId,
                    assignmentType: 'auto_target',
                    month,
                    year,
                    cardsCount: stat.cardsCount,
                    targetCount: stat.targetCount,
                    achievementPercentage: stat.achievementPercentage,
                    state: stat.state
                });
                await cert.save();
                createdCertificates.push(cert);
            }
        }
    }

    // Rule 4: Partial Target / Min Threshold (Performance)
    if (config.partialPerformanceEnabled) {
        const threshold = config.minCardsThresholdForPerformance || 50;
        const qualifiers = employeeStats.filter(s => s.cardsCount >= threshold && s.achievementPercentage < 100);
        for (let stat of qualifiers) {
            const templateId = 'employee-performance';

            const existing = await AssignedCertificate.findOne({
                employeeId: stat.employeeId,
                templateId,
                month,
                year
            });

            if (!existing) {
                const cert = new AssignedCertificate({
                    employeeId: stat.employeeId,
                    templateId,
                    issueDate: endDate,
                    assignedBy: adminUserId,
                    assignmentType: 'auto_performance',
                    month,
                    year,
                    cardsCount: stat.cardsCount,
                    targetCount: stat.targetCount,
                    achievementPercentage: stat.achievementPercentage,
                    state: stat.state
                });
                await cert.save();
                createdCertificates.push(cert);
            }
        }
    }

    return {
        success: true,
        message: `Auto-assignment completed for ${month}/${year}`,
        assignedCount: createdCertificates.length,
        data: createdCertificates
    };
};

// Controller endpoint to manually trigger auto-assignment for a given month/year
export const triggerAutoAssignCertificates = async (req, res) => {
    try {
        const { month, year } = req.body;
        if (!month || !year) {
            return res.status(400).json({ success: false, message: 'Please specify month and year' });
        }

        const result = await processAutoAssignmentEngine(month, year, req.user ? req.user.id : null);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Controller endpoint to fetch auto-assigned certificates history
export const getAutoAssignedHistory = async (req, res) => {
    try {
        const { month, year } = req.query;
        const query = {
            assignmentType: { $in: ['auto_global', 'auto_state', 'auto_target', 'auto_performance'] }
        };

        if (month) query.month = Number(month);
        if (year) query.year = Number(year);

        const certificates = await AssignedCertificate.find(query)
            .sort({ createdAt: -1 })
            .populate({
                path: 'employeeId',
                select: 'name role designation district state workingState workingDistrict userId mobile mobileNumber phone',
                populate: { path: 'userId', select: 'name mobile phone email username' }
            })
            .populate('assignedBy', 'name');

        res.status(200).json({ success: true, data: certificates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Assign a certificate to an RM
export const assignCertificate = async (req, res) => {
    try {
        const { employeeId, templateId, templateIds, issueDate } = req.body;
        const assignedBy = req.user.id;

        if (templateIds && Array.isArray(templateIds) && templateIds.length > 0) {
            const certs = templateIds.map(id => ({
                employeeId,
                templateId: id,
                issueDate,
                assignedBy
            }));
            const inserted = await AssignedCertificate.insertMany(certs);
            return res.status(201).json({ success: true, message: 'Certificates assigned successfully', data: inserted });
        } else if (templateId) {
            const cert = new AssignedCertificate({
                employeeId,
                templateId,
                issueDate,
                assignedBy
            });
            await cert.save();
            return res.status(201).json({ success: true, message: 'Certificate assigned successfully', data: cert });
        } else {
            return res.status(400).json({ success: false, message: 'Please provide templateId or templateIds' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Edit an assigned certificate
export const updateAssignedCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const { templateId, issueDate } = req.body;

        const updatedCert = await AssignedCertificate.findByIdAndUpdate(
            id,
            { templateId, issueDate },
            { new: true }
        );

        if (!updatedCert) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        res.status(200).json({ success: true, message: 'Certificate updated successfully', data: updatedCert });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete an assigned certificate
export const deleteAssignedCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCert = await AssignedCertificate.findByIdAndDelete(id);

        if (!deletedCert) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        res.status(200).json({ success: true, message: 'Certificate deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get assigned certificates for a specific RM (Admin View)
export const getAssignedCertificatesByEmployee = async (req, res) => {
    try {
        const { id } = req.params; // employeeId
        const certificates = await AssignedCertificate.find({ employeeId: id }).sort({ issueDate: -1 }).populate('assignedBy', 'name');
        res.status(200).json({ success: true, data: certificates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get my certificates (RM View)
export const getMyCertificates = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find employee by userId
        const employee = await Employee.findOne({ userId });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee profile not found' });
        }

        const certificates = await AssignedCertificate.find({ employeeId: employee._id }).sort({ issueDate: -1 });
        res.status(200).json({ success: true, data: certificates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all RMs for assignment
export const getRMs = async (req, res) => {
    try {
        // Fetch users with role 'employee'
        const employeeUsers = await User.find({ role: 'employee' }).select('_id');
        const userIds = employeeUsers.map(u => u._id);

        // Fetch employees with designation/role RM or ZC
        let rms = await Employee.find({
            userId: { $in: userIds },
            $or: [
                { designation: { $regex: /RM|ZC/i } },
                { role: { $regex: /RM|ZC/i } },
                { designation: { $regex: /Regional Manager|Zonal Coordinator/i } },
                { role: { $regex: /Regional Manager|Zonal Coordinator/i } }
            ]
        }).select('name role designation district state workingState workingDistrict userId').lean();

        // Fetch assigned certificates count for each RM
        for (let rm of rms) {
            rm.assignedCount = await AssignedCertificate.countDocuments({ employeeId: rm._id });
        }

        res.status(200).json({ success: true, data: rms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Bulk Delete Assigned Certificates
export const bulkDeleteAssignedCertificates = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide an array of certificate IDs to delete' });
        }

        const result = await AssignedCertificate.deleteMany({ _id: { $in: ids } });
        res.status(200).json({
            success: true,
            message: `${result.deletedCount} certificates deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
