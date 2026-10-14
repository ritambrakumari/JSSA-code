import SupportContact from '../models/SupportContact.js';
import Employee from '../models/Employee.js';

// @route   GET /api/support
// @desc    Get all support contacts
// @access  Admin/Superadmin/Staff
export const getAllSupportContacts = async (req, res) => {
  try {
    const contacts = await SupportContact.find().sort({ state: 1 });
    res.json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @route   POST /api/support/bulk
// @desc    Bulk Add/Update support contacts
// @access  Admin/Superadmin/Staff
export const bulkUpdateSupportContacts = async (req, res) => {
  try {
    // Array of { state, mobile, timing }
    const { contacts } = req.body;

    if (!Array.isArray(contacts)) {
      return res.status(400).json({ success: false, error: 'Invalid data format' });
    }

    // Process each contact
    for (const contact of contacts) {
      const { state, mobile, timing } = contact;
      if (!state || !mobile || !timing) continue;

      const cleanState = state.split(' / ')[0].trim().toUpperCase();

      // Find if state already exists
      let supportEntry = await SupportContact.findOne({ state: cleanState });

      if (supportEntry) {
        // Add to existing contacts if not already there (by mobile)
        const exists = supportEntry.contacts.find(c => c.mobile === mobile);
        if (!exists) {
          supportEntry.contacts.push({ mobile, timing });
          await supportEntry.save();
        }
      } else {
        // Create new
        await SupportContact.create({
          state: cleanState,
          contacts: [{ mobile, timing }]
        });
      }
    }

    res.json({ success: true, message: 'Support contacts added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @route   DELETE /api/support/:stateId/contact/:contactId
// @desc    Delete a specific contact from a state
// @access  Admin/Superadmin/Staff
export const deleteSupportContact = async (req, res) => {
  try {
    const { stateId, contactId } = req.params;

    const supportEntry = await SupportContact.findById(stateId);
    if (!supportEntry) {
      return res.status(404).json({ success: false, error: 'State not found' });
    }

    supportEntry.contacts = supportEntry.contacts.filter(c => c._id.toString() !== contactId);
    
    if (supportEntry.contacts.length === 0) {
      // If no contacts left, delete the state entry completely
      await SupportContact.findByIdAndDelete(stateId);
    } else {
      await supportEntry.save();
    }

    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @route   PUT /api/support/:stateId/contact/:contactId
// @desc    Edit a specific contact
// @access  Admin/Superadmin/Staff
export const editSupportContact = async (req, res) => {
  try {
    const { stateId, contactId } = req.params;
    const { mobile, timing, state } = req.body;

    const supportEntry = await SupportContact.findById(stateId);
    if (!supportEntry) {
      return res.status(404).json({ success: false, error: 'State not found' });
    }

    const contact = supportEntry.contacts.id(contactId);
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    if (state) {
      const cleanState = state.split(' / ')[0].trim().toUpperCase();
      if (cleanState !== supportEntry.state) {
        // State has changed, move contact to new state document
        const contactObj = contact.toObject();
        if (mobile) contactObj.mobile = mobile;
        if (timing) contactObj.timing = timing;
        delete contactObj._id; // Generate new ID in new document

        // Remove from old document
        supportEntry.contacts.pull(contactId);
        
        // Find or create new document
        let newSupportEntry = await SupportContact.findOne({ state: cleanState });
        if (!newSupportEntry) {
          newSupportEntry = new SupportContact({ state: cleanState, contacts: [] });
        }
        newSupportEntry.contacts.push(contactObj);
        
        await newSupportEntry.save();
        
        // If old document has no contacts left, we could optionally delete it, but saving is fine
        if (supportEntry.contacts.length === 0) {
          await SupportContact.findByIdAndDelete(stateId);
        } else {
          await supportEntry.save();
        }

        return res.json({ success: true, message: 'Contact moved and updated successfully' });
      }
    }

    if (mobile) contact.mobile = mobile;
    if (timing) contact.timing = timing;
    
    await supportEntry.save();

    res.json({ success: true, message: 'Contact updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @route   GET /api/support/my-state
// @desc    Get support contacts for the logged-in employee's working state
// @access  Employee
export const getMyStateSupport = async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.json({ success: true, data: null });
    }

    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee || !employee.workingState) {
      return res.json({ success: true, data: null });
    }

    const cleanState = employee.workingState.split(' / ')[0].trim().toUpperCase();
    
    const supportEntry = await SupportContact.findOne({ state: cleanState });
    
    res.json({ success: true, data: supportEntry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
