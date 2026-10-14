import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from '../models/Employee.js';
import '../models/User.js';
import '../models/JobPosting.js'; // Register JobPosting model

dotenv.config({ path: 'd:/JSSA-main/backend/.env' });

async function rebuildGlobalHierarchy() {
  console.log("♻️ REBUILDING GLOBAL HIERARCHY...");
  try {
    const employees = await Employee.find({ isZoneLocked: true }).populate("jobPostingId");

    // Normalize helper for robust state/district comparison
    const norm = (s) => {
      if (s == null || s === '') return '';
      const t = String(s).trim().toLowerCase();
      const primary = t.split('/')[0].trim();
      return primary.replace(/\s+/g, ' ');
    };

    // Reset all reportingTo
    for (const emp of employees) {
      emp.reportingTo = null;
    }

    // Classify by role
    const pms = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "PM" || post.includes("project manager");
    });

    const dms = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "DM" || post.includes("district manager");
    });

    const zcs = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "ZC" || post.includes("zonal coordinator");
    });

    const rms = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "RM" || post.includes("regional manager");
    });

    const bss = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "BS" || post.includes("block supervisor");
    });

    const pes = employees.filter(e => {
      const role = (e.role || "").toUpperCase();
      const post = (e.jobPostingId?.post?.en || e.designation || "").toLowerCase();
      return role === "PE" || post.includes("panchayat executive");
    });

    // RM reports to PM (All RMs report to the single global PM, since PM is Pan India)
    const globalPM = pms[0];
    for (const rm of rms) {
      if (globalPM) rm.reportingTo = globalPM.userId;
    }

    // ZC reports to RM (or falls back to PM)
    for (const zc of zcs) {
      const myState = zc.workingState;
      const rm = rms.find(r => r.workingState && norm(r.workingState) === norm(myState));
      if (rm) {
        zc.reportingTo = rm.userId;
      } else {
        if (globalPM) zc.reportingTo = globalPM.userId;
      }
    }

    // DM reports to ZC or RM (or falls back to PM)
    for (const dm of dms) {
      const myDistrict = dm.workingDistrict;
      const zc = zcs.find(z => {
        if (!z.workingDistrict) return false;
        const zcDistricts = z.workingDistrict.split(',').map(d => norm(d));
        return zcDistricts.includes(norm(myDistrict));
      });
      if (zc) {
        dm.reportingTo = zc.userId;
      } else {
        const myState = dm.workingState;
        const rm = rms.find(r => r.workingState && norm(r.workingState) === norm(myState));
        if (rm) {
          dm.reportingTo = rm.userId;
        } else {
          if (globalPM) dm.reportingTo = globalPM.userId;
        }
      }
    }

    // BS reports to DM or ZC
    for (const bs of bss) {
      const myBlockId = bs.workingBlock ? bs.workingBlock.toString() : null;
      const myDistrict = bs.workingDistrict;

      const dm = dms.find(d => {
        if (!d.workingDistrict || norm(d.workingDistrict) !== norm(myDistrict)) return false;
        if (d.isAllBlocksAssigned) return true;
        if (d.workingBlocks && d.workingBlocks.some(bId => bId.toString() === myBlockId)) return true;
        return false;
      });

      if (dm) {
        bs.reportingTo = dm.userId;
      } else {
        const zc = zcs.find(z => {
          if (!z.workingDistrict) return false;
          const zcDistricts = z.workingDistrict.split(',').map(d => norm(d));
          return zcDistricts.includes(norm(myDistrict));
        });
        if (zc) bs.reportingTo = zc.userId;
      }
    }

    // PE reports to BS or DM
    for (const pe of pes) {
      const myPanchayatId = pe.workingPanchayat ? pe.workingPanchayat.toString() : null;
      const myBlockId = pe.workingBlock ? pe.workingBlock.toString() : null;
      const myDistrict = pe.workingDistrict;

      const bs = bss.find(b => {
        if (!b.workingBlock || b.workingBlock.toString() !== myBlockId) return false;
        if (b.isAllPanchayatsAssigned) return true;
        if (b.workingPanchayats && b.workingPanchayats.some(pId => pId.toString() === myPanchayatId)) return true;
        return false;
      });

      if (bs) {
        pe.reportingTo = bs.userId;
      } else {
        const dm = dms.find(d => {
          if (!d.workingDistrict || norm(d.workingDistrict) !== norm(myDistrict)) return false;
          if (d.isAllBlocksAssigned) return true;
          if (d.workingBlocks && d.workingBlocks.some(bId => bId.toString() === myBlockId)) return true;
          return false;
        });
        if (dm) pe.reportingTo = dm.userId;
      }
    }

    // Save all modified employee structures
    for (const emp of employees) {
      await Employee.updateOne({ _id: emp._id }, { $set: { reportingTo: emp.reportingTo } });
    }
    console.log("✅ GLOBAL HIERARCHY ALIGNMENT COMPLETE!");
  } catch (err) {
    console.error("❌ Failed to rebuild global hierarchy:", err);
  }
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    await rebuildGlobalHierarchy();

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();
