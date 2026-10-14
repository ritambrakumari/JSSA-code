import Training from '../models/Training.js';
import User from '../models/User.js';
import AdministrativeStaff from '../models/AdministrativeStaff.js';

// Create Training
export const createTraining = async (req, res) => {
    try {
        const { title, embedLink, postType } = req.body;
        const uploadedBy = req.user.id;
        
        // Determine model type based on role
        const uploadedByModel = req.user.role === 'staff' ? 'AdministrativeStaff' : 'User';

        const training = new Training({
            title,
            embedLink,
            postType,
            uploadedBy,
            uploadedByModel
        });

        await training.save();
        res.status(201).json({ success: true, message: 'Training added successfully', data: training });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Trainings (Role based)
export const getTrainings = async (req, res) => {
    try {
        const { role, id } = req.user;
        let query = {};

        if (role === 'staff') {
            // Staff sees only their uploads
            query = { uploadedBy: id };
        } else if (role === 'admin' || role === 'superadmin' || role === 'employee') {
            // Admin/Employee sees all
            query = {};
        }

        const trainings = await Training.find(query).sort({ createdAt: -1 });

        // Robust manual population
        const populatedTrainings = await Promise.all(trainings.map(async (t) => {
            const doc = t.toObject();
            let uploaderName = "System Admin";

            try {
                if (t.uploadedByModel === 'AdministrativeStaff') {
                    // Try to find in AdministrativeStaff profile
                    const staffProfile = await AdministrativeStaff.findOne({ userId: t.uploadedBy }).select('name');
                    if (staffProfile) {
                        uploaderName = staffProfile.name;
                    } else {
                        // Fallback to User if profile not found
                        const user = await User.findById(t.uploadedBy).select('name');
                        uploaderName = user?.name || "Administrative Staff";
                    }
                } else {
                    // Try to find in User model (for admins)
                    const user = await User.findById(t.uploadedBy).select('name role');
                    if (user) {
                        if (user.role === 'staff') {
                            // Even if model was set to 'User', if it's a staff member, check profile
                            const staffProfile = await AdministrativeStaff.findOne({ userId: t.uploadedBy }).select('name');
                            uploaderName = staffProfile?.name || user.name || "Administrative Staff";
                        } else {
                            uploaderName = user.name || (user.role === 'admin' ? "System Admin" : "User");
                        }
                    }
                }
            } catch (err) {
                console.error("Population error for training:", err);
            }

            doc.uploadedBy = { name: uploaderName };
            return doc;
        }));

        res.status(200).json({ success: true, data: populatedTrainings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Training
export const deleteTraining = async (req, res) => {
    try {
        const { id } = req.params;
        const training = await Training.findById(id);

        if (!training) {
            return res.status(404).json({ success: false, message: 'Training not found' });
        }

        // Only owner or admin can delete
        if (training.uploadedBy.toString() !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await Training.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Training deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
