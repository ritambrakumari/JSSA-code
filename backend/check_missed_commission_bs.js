import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define Schemas manually to avoid importing all server dependencies
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model("User", userSchema);

const employeeSchema = new mongoose.Schema({}, { strict: false });
const Employee = mongoose.models.Employee || mongoose.model("Employee", employeeSchema);

const cardSchema = new mongoose.Schema({}, { strict: false });
const Card = mongoose.models.Card || mongoose.model("Card", cardSchema);

const transactionSchema = new mongoose.Schema({}, { strict: false });
const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

const goalConfigSchema = new mongoose.Schema({}, { strict: false });
const GoalConfig = mongoose.models.GoalConfig || mongoose.model("GoalConfig", goalConfigSchema);

const systemConfigSchema = new mongoose.Schema({}, { strict: false });
const SystemConfig = mongoose.models.SystemConfig || mongoose.model("SystemConfig", systemConfigSchema);

// ==========================================
// CONFIGURATION
// ==========================================
// Set to TRUE to actually credit the money and create transactions
// Set to FALSE to only see the report (Dry-Run)
const EXECUTE = true;
// ==========================================

async function checkAllBSMissedCommissions() {
  try {
    console.log(`Starting GLOBAL Script in ${EXECUTE ? 'EXECUTE (CREDIT)' : 'DRY-RUN (REPORT)'} mode...`);
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected Successfully.\n");

    // Fetch Goal Config for BS Commission amount
    const bsConfig = await GoalConfig.findOne({ role: "BS" });
    const sysConfig = await SystemConfig.findOne();

    let expectedCommission = 0;
    if (bsConfig && bsConfig.layeredCommissions) {
      const peLayer = bsConfig.layeredCommissions.find(l => (l.roleName || "").toLowerCase().includes("panchayat"));
      if (peLayer && peLayer.commission > 0) {
        expectedCommission = peLayer.commission;
      }
    }
    if (expectedCommission === 0) {
      expectedCommission = sysConfig?.commissions?.BS || 100; // Fallback
    }
    console.log(`💰 Expected Commission per PE Card: ₹${expectedCommission}\n`);

    console.log("Fetching all Block Supervisors (BS)...");
    const allBS = await Employee.find({ role: "BS", status: "Active" });
    console.log(`Found ${allBS.length} Active BS in the system.\n`);

    let globalMissedCards = [];
    let globalMissedAmount = 0;
    let totalCardsChecked = 0;
    let processedBSCount = 0;

    for (const bsEmployee of allBS) {
      processedBSCount++;
      if (processedBSCount % 50 === 0) {
        console.log(`⏳ Processing batch... Completed ${processedBSCount} / ${allBS.length} Block Supervisors.`);
      }

      const bsUser = await User.findById(bsEmployee.userId);
      if (!bsUser) continue;

      // Find all PEs reporting to this BS
      const teamPEs = await Employee.find({ reportingTo: bsUser._id });
      if (teamPEs.length === 0) continue;

      // OPTIMIZATION: Fetch ALL commission transactions for this BS once to avoid thousands of slow queries
      const bsTransactions = await Transaction.find({
        employeeId: bsEmployee._id,
        type: "CREDIT_COMMISSION"
      }).select("remarks");
      const bsRemarks = bsTransactions.map(t => (t.remarks || "").toUpperCase());

      for (const pe of teamPEs) {
        const peUser = await User.findById(pe.userId);
        if (!peUser) continue;

        // Find all cards issued by this PE
        const issuedCards = await Card.find({ issuedBy: peUser._id });
        totalCardsChecked += issuedCards.length;

        for (const card of issuedCards) {
          if (!card.cardId) continue;

          // IN-MEMORY CHECK: Extremely fast compared to DB Regex lookup
          const cardIdUpper = card.cardId.toUpperCase();
          const hasTransaction = bsRemarks.some(rem => rem.includes(cardIdUpper));

          if (!hasTransaction) {
            globalMissedCards.push({
              bsName: bsUser.name || "Unknown BS",
              bsPhone: bsUser.phone || "N/A",
              bsEmployeeId: bsEmployee._id,
              bsUserId: bsEmployee.userId,
              cardId: card.cardId,
              issueDate: card.createdAt,
              issuedBy: peUser.name,
              expectedCommission: expectedCommission,
              bsCurrentWallet: bsEmployee.salaryWallet || 0
            });
            globalMissedAmount += expectedCommission;
          }
        }
      }
    }

    console.log("\n================ GLOBAL REPORT ================");
    console.log(`Total Active BS Checked: ${allBS.length}`);
    console.log(`Total Cards Issued by their PEs: ${totalCardsChecked}`);
    console.log(`Total Missed Commissions across ALL BS: ${globalMissedCards.length}`);
    console.log(`Total Pending Amount to be Credited: ₹${globalMissedAmount}`);
    console.log("===============================================\n");

    if (globalMissedCards.length === 0) {
      console.log("✅ No commissions missed for ANY BS across the system. All perfect!");
      process.exit(0);
    }

    if (!EXECUTE) {
      console.log("Details of Missed Cards (Showing first 50 rows for brevity):");
      const displayCards = globalMissedCards.slice(0, 50).map(c => ({
        "BS Name": c.bsName,
        "BS Phone": c.bsPhone,
        "Card ID": c.cardId,
        "Issue Date": new Date(c.issueDate).toLocaleDateString(),
        "Amount": `₹${c.expectedCommission}`
      }));
      console.table(displayCards);
      if (globalMissedCards.length > 50) {
        console.log(`...and ${globalMissedCards.length - 50} more records.`);
      }
      console.log("\n⚠️ NOTE: This was a DRY-RUN. To actually credit these amounts to all BS date-wise, change `const EXECUTE = true;` inside the script and run it again.");
      process.exit(0);
    }

    // ==========================================
    // EXECUTION PHASE (Date-wise Credit)
    // ==========================================
    console.log("🚀 EXECUTE MODE ON: Processing Global Credits Date-Wise...");

    // Sort missed cards by date ascending
    globalMissedCards.sort((a, b) => new Date(a.issueDate) - new Date(b.issueDate));

    // Group by BS for bulk wallet update at the end
    const bsUpdates = {};

    for (const missed of globalMissedCards) {
      // 1. Create the Transaction with the EXACT SAME DATE as the card issuance
      const newTx = new Transaction({
        userId: missed.bsUserId,
        employeeId: missed.bsEmployeeId,
        amount: missed.expectedCommission,
        type: 'CREDIT_COMMISSION',
        status: 'SUCCESS',
        remarks: `Hierarchy commission from PE card issuance (${missed.cardId})`,
        createdAt: missed.issueDate,
        updatedAt: missed.issueDate
      });
      await newTx.save();

      // Accumulate wallet amount
      if (!bsUpdates[missed.bsEmployeeId]) {
        bsUpdates[missed.bsEmployeeId] = 0;
      }
      bsUpdates[missed.bsEmployeeId] += missed.expectedCommission;

      console.log(`✅ Credited ₹${missed.expectedCommission} to BS (${missed.bsPhone}) for Card ${missed.cardId} on Date: ${new Date(missed.issueDate).toLocaleDateString()}`);
    }

    // 2. Update all BS Wallet Balances
    console.log("\nUpdating BS Wallets in Database...");
    for (const bsEmpId in bsUpdates) {
      const amountToAdd = bsUpdates[bsEmpId];
      await Employee.findByIdAndUpdate(bsEmpId, {
        $inc: { salaryWallet: amountToAdd }
      });
      console.log(`💵 Added total ₹${amountToAdd} to Employee ID: ${bsEmpId}`);
    }

    console.log(`\n🎉 GLOBAL SUCCESS: Resolved all missed commissions. Total ₹${globalMissedAmount} distributed across ${Object.keys(bsUpdates).length} BS accounts.`);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

checkAllBSMissedCommissions();
