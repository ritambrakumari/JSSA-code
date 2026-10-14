import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthProvider";
import DashboardLayout from "../../components/DashboardLayout";
import ZoneLockEmptyState from "../../components/ZoneLockEmptyState";
import { TrendingUp, Calendar, Loader2, ArrowUpRight, ArrowDownRight, RefreshCw, XCircle, CheckCircle2, Clock, Download } from "lucide-react";
import { walletAPI, apiRequest, systemConfigAPI } from "../../utils/api";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import watermarkUrl from "../../assets/JSSAogo.png";
import logoUrl from "../../assets/jssa-logo-long.png";

const getImageBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
};

const ExpandableRemark = ({ text, isRightAligned = false, colorClass = "text-gray-600" }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <span className="text-xs font-bold text-gray-400 uppercase">N/A</span>;

  const isLongText = text.length > 50;

  if (!isLongText) {
    return <span className={`text-xs font-bold ${colorClass} block max-w-[250px] ${isRightAligned ? 'ml-auto text-right' : 'text-left'}`}>{text}</span>;
  }

  return (
    <div className={`max-w-[250px] flex flex-col ${isRightAligned ? 'ml-auto items-end text-right' : 'items-start text-left'}`}>
      <span className={`text-xs font-bold ${colorClass} ${!expanded ? 'line-clamp-2' : ''} leading-snug`}>
        {text}
      </span>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] text-blue-500 hover:text-blue-700 font-black mt-1.5 uppercase tracking-widest transition-colors"
      >
        {expanded ? 'Show Less' : 'Read More'}
      </button>
    </div>
  );
};

const Salary = () => {
  const { isZoneLocked, employeeProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [dateRange, setDateRange] = useState("all");
  const [summary, setSummary] = useState(null);

  const [lifetimeEarnings, setLifetimeEarnings] = useState(0);
  const [thisMonthEarnings, setThisMonthEarnings] = useState(0);
  const [activeTab, setActiveTab] = useState("commission");
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [isWithdrawalEnabled, setIsWithdrawalEnabled] = useState(true);

  // Modal State for Transaction Details
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSystemConfig = async () => {
    try {
      const res = await systemConfigAPI.getCurrent();
      if (res.success && res.data) {
        setIsWithdrawalEnabled(res.data.isWithdrawalEnabled !== false);
      }
    } catch (err) {
      console.error("Failed to fetch system config:", err);
    }
  };

  const handleDownloadReceipt = async (req) => {
    const doc = new jsPDF();

    // Theme Colors
    const primaryColor = [58, 176, 0]; // #3AB000
    const darkText = [30, 30, 30];
    const grayText = [120, 120, 120];
    const lightGray = [248, 248, 248];
    const lightGreen = [235, 245, 230];

    // Convert Images
    let logoB64, watermarkB64;
    try {
      logoB64 = await getImageBase64(logoUrl);
      watermarkB64 = await getImageBase64(watermarkUrl);
    } catch (err) {
      console.warn("Failed to load images for PDF", err);
    }

    // 1. Header Background (White for Logo visibility)
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 45, 'F');

    // Bottom Border of Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 45, 210, 3, 'F');

    // Header Logo & Text
    if (logoB64) {
      // Adjusted aspect ratio for wide logo (approx 3.5:1)
      doc.addImage(logoB64, 'PNG', 12, 10, 85, 24);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...primaryColor);
    doc.text("PAYMENT RECEIPT", 195, 24, null, null, "right");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayText);
    doc.text("JSS Abhiyan - Official Payout", 195, 32, null, null, "right");

    // 2. Watermark (Centered, very faint)
    if (watermarkB64) {
      doc.setGState(new doc.GState({ opacity: 0.05 }));
      doc.addImage(watermarkB64, 'PNG', 45, 90, 120, 120);
      doc.setGState(new doc.GState({ opacity: 1.0 }));
    }

    // 3. Receipt Meta Info Bar
    doc.setFillColor(...lightGray);
    doc.rect(15, 60, 180, 20, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.rect(15, 60, 180, 20, 'S');

    doc.setFontSize(9);
    doc.setTextColor(...grayText);
    doc.setFont("helvetica", "bold");

    // Row 1 inside the bar
    doc.text("RECEIPT NO", 20, 68);
    doc.text("DATE & TIME", 100, 68);
    doc.text("STATUS", 165, 68);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkText);
    doc.text(req._id.toUpperCase(), 20, 75);
    const dateStr = new Date(req.processedAt || req.createdAt).toLocaleString('en-IN');
    doc.text(dateStr, 100, 75);
    doc.setTextColor(...primaryColor);
    doc.text("PROCESSED", 165, 75);

    // 4. Beneficiary Details
    doc.setTextColor(...darkText);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Beneficiary Details", 15, 100);

    // Accent line
    doc.setFillColor(...primaryColor);
    doc.rect(15, 103, 25, 1, 'F');

    doc.setFontSize(10);

    // Two column layout for beneficiary
    doc.setTextColor(...grayText);
    doc.setFont("helvetica", "normal");
    doc.text("Paid To:", 15, 115);
    doc.text("Bank Name:", 15, 123);
    doc.text("Account No:", 110, 115);
    doc.text("IFSC Code:", 110, 123);

    doc.setTextColor(...darkText);
    doc.setFont("helvetica", "bold");
    doc.text(employeeProfile?.name?.toUpperCase() || 'N/A', 40, 115);
    doc.text(req.bankDetails?.bankName?.toUpperCase() || 'N/A', 40, 123);
    doc.text(req.bankDetails?.accountNumber || 'N/A', 135, 115);
    doc.text(req.bankDetails?.ifscCode || 'N/A', 135, 123);

    // 5. Payment Breakdown Table
    const startY = 145;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Breakdown", 15, startY);

    doc.setFillColor(...primaryColor);
    doc.rect(15, startY + 3, 25, 1, 'F');

    // Table Header
    doc.setFillColor(...lightGreen);
    doc.rect(15, startY + 10, 180, 12, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Description", 20, startY + 18);
    doc.text("Amount", 185, startY + 18, null, null, "right");

    // Table Rows
    doc.setTextColor(...darkText);
    doc.setFont("helvetica", "normal");

    let currentY = startY + 32;
    doc.text("Base Withdrawal Amount", 20, currentY);
    doc.text(`Rs. ${(req.amount || 0).toLocaleString('en-IN')}`, 185, currentY, null, null, "right");

    if (req.otherExpenses > 0) {
      currentY += 12;
      doc.text("Other Expenses / Allowances", 20, currentY);
      doc.text(`+ Rs. ${(req.otherExpenses || 0).toLocaleString('en-IN')}`, 185, currentY, null, null, "right");
    }

    // Total Box
    currentY += 15;
    doc.setFillColor(...primaryColor);
    doc.rect(15, currentY - 8, 180, 16, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL PAID AMOUNT", 20, currentY + 3);
    doc.text(`Rs. ${((req.amount || 0) + (req.otherExpenses || 0)).toLocaleString('en-IN')}`, 185, currentY + 3, null, null, "right");

    // 6. Footer Note
    doc.setFontSize(8);
    doc.setTextColor(...grayText);
    doc.setFont("helvetica", "italic");
    doc.text("This is a computer-generated official receipt. No signature is required.", 105, 275, null, null, "center");
    doc.text("For any queries, please contact JSS Abhiyan administration.", 105, 280, null, null, "center");

    doc.save(`JSSA_Receipt_${req._id.slice(-8)}.pdf`);
  };

  useEffect(() => {
    fetchSystemConfig();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    await fetchHistory(1, dateRange);
    await fetchLifetimeEarnings();
    await fetchThisMonthEarnings();
    if (activeTab === "withdrawals") await fetchWithdrawals();
    setRefreshing(false);
  };

  const [rmSalary, setRmSalary] = useState(null);
  const [roleConfig, setRoleConfig] = useState(null);
  const isRM = employeeProfile?.role === "RM" || employeeProfile?.jobPostingId?.post?.en?.toLowerCase() === "regional manager";

  useEffect(() => {
    if (isZoneLocked) {
      fetchHistory(1, dateRange);
      fetchLifetimeEarnings();
      fetchThisMonthEarnings();
      fetchWithdrawals();
    }
  }, [isZoneLocked, dateRange]);

  useEffect(() => {
    if (employeeProfile?.role) {
      const fetchConfigs = async () => {
        try {
          const tokenStr = localStorage.getItem("jssa_auth");
          const token = tokenStr ? JSON.parse(tokenStr).token : null;
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.jssabhiyan.com/api'}/goal-config/employee-configs`, {
            headers: token ? {
              'Authorization': `Bearer ${token}`
            } : {}
          });
          const data = await res.json();
          if (data.success) {
            const config = data.data.find(c => c.role === employeeProfile.role);
            if (config) {
              setRoleConfig(config);
            }
            if (isRM) {
              const rmConfig = data.data.find(c => c.role === 'RM');
              if (rmConfig) {
                let salary = rmConfig.baseSalary || 35500;
                const empState = employeeProfile?.workingState || employeeProfile?.jobPostingId?.state || '';
                if (empState && rmConfig.stateSalaries && rmConfig.stateSalaries.length > 0) {
                  const cleanState = empState.split(" / ")[0].trim();
                  const stateObj = rmConfig.stateSalaries.find(s => s.state?.toLowerCase() === cleanState.toLowerCase());
                  if (stateObj && stateObj.salary) {
                    salary = stateObj.salary;
                  }
                }
                setRmSalary(salary);
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch salary config', error);
        }
      };
      fetchConfigs();
    }
  }, [employeeProfile, isRM]);

  const fetchHistory = async (page = 1, filterDate = dateRange) => {
    try {
      setLoading(true);
      const res = await walletAPI.getHistory(page, 15, 'COMMISSION', filterDate);
      if (res.success) {
        setHistory(res.data);
        setPagination(res.pagination);
        if (res.summary) setSummary(res.summary);
      }
    } catch (error) {
      toast.error("Failed to fetch transaction history");
    } finally {
      setLoading(false);
    }
  };

  const fetchLifetimeEarnings = async () => {
    try {
      const res = await walletAPI.getLifetimeEarnings();
      if (res.success) {
        setLifetimeEarnings(res.totalEarnings);
      }
    } catch (error) {
      console.error("Failed to fetch lifetime earnings", error);
    }
  };

  const fetchThisMonthEarnings = async () => {
    try {
      const res = await walletAPI.getHistory(1, 1, 'COMMISSION', 'thisMonth');
      if (res.success && res.summary) {
        setThisMonthEarnings(res.summary.totalAmount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch this month earnings", error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setLoadingWithdrawals(true);
      const res = await apiRequest("/withdrawals/my-requests", { method: "GET" });
      if (res.success) {
        setWithdrawals(res.data);
      }
    } catch (error) {
      toast.error("Failed to fetch withdrawal history");
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SUCCESS": return "bg-green-100 text-[#3AB000]";
      case "PENDING": return "bg-orange-100 text-orange-600";
      case "FAILED": return "bg-red-100 text-red-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8 w-full">
        {!isZoneLocked ? (
          <div className="py-10">
            <ZoneLockEmptyState
              title="Salary Dashboard Locked"
              description="Your earnings dashboard will be activated once your working jurisdiction is confirmed and locked."
            />
          </div>
        ) : (
          <>
            {/* Header / Metric Card */}
            <div className="bg-white border-2 border-[#3AB000]/20 border-l-8 border-l-[#3AB000] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
              <div>
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none mb-2">Salary & Earnings</h1>
                <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.2em]">Track your real-time commissions</p>
              </div>

              {/* Earnings Wallet Card */}
              <div className="flex flex-col md:flex-row items-stretch gap-4">

                {/* Total Earnings Box */}
                <div className="flex flex-col justify-between bg-[#F4FBF0] border border-[#3AB000]/30 shadow-sm px-6 py-4 rounded-none min-w-[220px] max-w-[300px] hover:shadow-md hover:border-[#3AB000]/50 transition-all relative group overflow-hidden">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -right-6 -bottom-6 text-[#3AB000] opacity-5 group-hover:scale-110 transition-transform duration-500">
                      <TrendingUp size={100} />
                    </div>
                  </div>

                  <div className="z-10 relative">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] font-black text-[#2B8000] uppercase tracking-[0.2em] flex items-center gap-2">
                        Total Earnings
                      </p>
                      <TrendingUp size={18} className="text-[#3AB000]" />
                    </div>
                    <p className="text-3xl font-black text-[#3AB000] leading-none break-all mb-4">₹{lifetimeEarnings.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="z-20 relative flex flex-col gap-1 w-full mt-2">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Lifetime Commission</p>
                    {isRM && (
                      <p className="text-[8.5px] font-bold text-[#3AB000]/80 leading-tight pr-4">
                        *Note: Your earnings only include commission for cards made AFTER you joined the team and locked your zone.
                      </p>
                    )}
                  </div>
                </div>

                {/* Withdrawable Amount Box */}
                <div className="flex flex-col justify-between bg-gradient-to-br from-[#3AB000] to-[#2B8000] shadow-md shadow-[#3AB000]/20 px-6 py-4 rounded-none min-w-[220px] max-w-[300px] hover:shadow-[#3AB000]/40 transition-all relative group">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -right-6 -bottom-6 text-black opacity-10 group-hover:scale-110 transition-transform duration-500">
                      <ArrowUpRight size={100} />
                    </div>
                  </div>

                  <div className="z-10 relative">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] font-black text-green-100 uppercase tracking-[0.2em] flex items-center gap-2">
                        Withdrawable Balance
                        <button onClick={handleRefresh} disabled={refreshing} className="p-1 hover:bg-white/20 rounded-none transition-colors text-white pointer-events-auto">
                          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                        </button>
                      </p>
                    </div>
                    <p className="text-3xl font-black text-white leading-none break-all mb-4">₹{(employeeProfile?.salaryWallet || 0).toLocaleString('en-IN')}</p>
                  </div>

                  <div className="z-20 relative group">
                    <button
                      onClick={() => isWithdrawalEnabled && navigate('/employee/withdraw')}
                      disabled={!isWithdrawalEnabled}
                      className={`w-full py-2 border font-bold text-[10px] uppercase tracking-widest transition-colors pointer-events-auto ${isWithdrawalEnabled
                          ? "bg-white/10 hover:bg-white/20 text-white border-white/30"
                          : "bg-gray-800/40 text-gray-300 border-gray-800/30 cursor-not-allowed"
                        }`}
                    >
                      Withdraw
                    </button>
                    {!isWithdrawalEnabled && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max max-w-[300px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-gray-900 text-white text-sm font-bold p-3 rounded shadow-xl z-50 pointer-events-none text-center leading-relaxed">
                        Withdrawals are only open from the 1st to the 5th of each month.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Month Earnings Box */}
                <div className="flex flex-col justify-between bg-[#F4FBF0] border border-[#3AB000]/30 shadow-sm px-6 py-4 rounded-none min-w-[220px] max-w-[300px] hover:shadow-md hover:border-[#3AB000]/50 transition-all relative group overflow-hidden">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -right-6 -bottom-6 text-[#3AB000] opacity-5 group-hover:scale-110 transition-transform duration-500">
                      <Calendar size={100} />
                    </div>
                  </div>

                  <div className="z-10 relative">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] font-black text-[#2B8000] uppercase tracking-[0.2em] flex items-center gap-2">
                        Current Month
                      </p>
                      <Calendar size={18} className="text-[#3AB000]" />
                    </div>
                    <p className="text-3xl font-black text-[#3AB000] leading-none break-all mb-4">₹{thisMonthEarnings.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="z-20 relative flex flex-col gap-1 w-full mt-2">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">This Month Commission</p>
                  </div>
                </div>

                {isRM && rmSalary !== null && (
                  <div className="flex flex-col justify-center bg-[#F4FBF0] border border-[#3AB000]/30 shadow-sm px-6 py-4 rounded-none min-w-[220px] max-w-[320px] relative overflow-hidden group transition-all hover:shadow-md hover:border-[#3AB000]/50">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-black text-[#2B8000] uppercase tracking-[0.2em] z-10 flex items-center gap-2">
                        Target Based Salary
                      </p>
                    </div>
                    <p className="text-3xl font-black text-[#3AB000] leading-none mb-3">₹{rmSalary.toLocaleString('en-IN')}</p>
                    <div className="flex items-start gap-1.5 z-10">
                      <span className="text-[#3AB000] font-black text-xs leading-none mt-0.5">*</span>
                      <p className="text-[10px] text-gray-600 font-semibold leading-snug">
                        Requires <strong className="text-[#2B8000]">50%</strong> team monthly target achievement.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("commission")}
                className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === "commission" ? "border-b-4 border-[#3AB000] text-[#3AB000] bg-white" : "text-gray-500 hover:text-gray-800"}`}
              >
                Commission History
              </button>
              <button
                onClick={() => setActiveTab("withdrawals")}
                className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === "withdrawals" ? "border-b-4 border-[#3AB000] text-[#3AB000] bg-white" : "text-gray-500 hover:text-gray-800"}`}
              >
                Withdrawal History
              </button>
            </div>

            {/* Transactions Table */}
            <div className="bg-white border-2 border-[#3AB000]/20 shadow-lg shadow-green-50/50 rounded-xl overflow-hidden mt-4">
              <div className="p-6 border-b-2 border-[#3AB000]/20 bg-green-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-[#3AB000] uppercase tracking-widest flex items-start gap-2">
                    {activeTab === "commission" ? "Transaction History" : "Withdrawal Requests"}
                    {activeTab === "commission" && !loading && (
                      <div className="flex flex-col gap-1 mt-0.5">
                        <span className="bg-[#3AB000] text-white text-[10px] px-2 py-0.5 rounded-full w-fit leading-none">
                          {pagination.total} Records
                        </span>
                      </div>
                    )}
                  </h2>
                  <p className="text-[10px] font-black text-[#3AB000]/70 uppercase tracking-[0.2em] mt-1.5 mb-2">
                    {activeTab === "commission" ? "All your commission earnings" : "Track your payout requests"}
                  </p>

                  {activeTab === "commission" && !loading && roleConfig && (
                    <div className="mb-4 mt-6 bg-[#F4FBF0] border border-[#3AB000]/30 p-4 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest bg-green-100 px-2 py-1 rounded-sm">COMMISSION RULES</span>
                        <span className="text-xs font-bold text-gray-500">Per Card Earnings</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {roleConfig.layeredCommissions && roleConfig.layeredCommissions.length > 0 ? (
                          roleConfig.layeredCommissions.map(layer => (
                            <div key={layer.roleName} className="bg-white px-3 py-2 border border-[#3AB000]/20 rounded-md shadow-sm flex items-center gap-2">
                              <span className="text-xs font-black text-gray-700 uppercase">{layer.roleName}</span>
                              <span className="text-gray-300 font-bold text-[10px]">&rarr;</span>
                              <span className="text-sm font-black text-[#3AB000]">₹{layer.commission}</span>
                            </div>
                          ))
                        ) : null}
                        {roleConfig.individualCommission > 0 && !isRM && (
                          <div className="bg-white px-3 py-2 border border-[#3AB000]/20 rounded-md shadow-sm flex items-center gap-2">
                            <span className="text-xs font-black text-gray-700 uppercase">SELF</span>
                            <span className="text-gray-300 font-bold text-[10px]">&rarr;</span>
                            <span className="text-sm font-black text-[#3AB000]">₹{roleConfig.individualCommission}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "commission" && !loading && summary && pagination.total > 0 && summary.showSalaryBreakdown !== false && (
                    <div className="flex flex-col gap-2">
                      <div className="mt-2 bg-white border border-green-200/60 p-3.5 rounded-lg flex flex-col md:flex-row gap-4 md:items-center shadow-sm w-full md:w-auto">
                        <div className="flex flex-col min-w-max">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Earnings Breakdown</span>
                          <span className="text-xl font-black text-[#3AB000] leading-none flex items-center gap-2">
                            ₹{summary.totalAmount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {summary.breakdown && summary.breakdown.length > 0 && (
                          <div className="flex flex-wrap gap-2 md:border-l md:border-gray-100 md:pl-5">
                            {summary.breakdown.map((b, idx) => (
                              <div key={b._id} className="bg-[#F4FBF0] border border-[#3AB000]/20 px-3 py-2 rounded-md flex items-center gap-2.5">
                                <span className="text-xs font-black text-gray-800">{b.count} <span className="text-[9px] text-gray-500 tracking-widest">RECORDS</span></span>
                                <span className="text-gray-300 font-bold text-[10px]">×</span>
                                <span className="text-xs font-black text-gray-800">
                                  ₹{b._id} <span className="text-[9px] text-gray-400 uppercase tracking-widest ml-0.5 font-bold">({b.label || 'Commission'})</span>
                                </span>
                                <span className="text-[#3AB000]/50 font-black text-[10px]">=</span>
                                <span className="text-sm font-black text-[#3AB000]">₹{(b.count * b._id).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] font-medium text-gray-500 italic max-w-xl">
                        *Note: These records only include commissions for cards generated <strong>after</strong> you joined the team and locked your zone.
                      </p>
                    </div>
                  )}
                </div>
                {activeTab === "commission" && (
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#3AB000]" />
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="text-xs font-bold text-[#3AB000] uppercase tracking-widest bg-white border border-[#3AB000]/30 rounded px-3 py-2 outline-none focus:border-[#3AB000]"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="last7days">Last 7 Days</option>
                      <option value="thisMonth">This Month</option>
                      <option value="pastMonth">Past Month</option>
                    </select>
                  </div>
                )}
              </div>

              {activeTab === "commission" ? (
                loading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#3AB000]" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-20 text-gray-500 font-bold">
                    No transactions found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#3AB000] text-white">
                        <tr>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 last:border-r-0">Transaction ID</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 last:border-r-0">Date</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 last:border-r-0">Type</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 last:border-r-0">Amount</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 last:border-r-0">Status</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((tx, idx) => (
                          <tr key={tx._id} className={`border-b border-gray-100 transition-colors hover:bg-green-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <td className="p-4 font-mono text-xs text-gray-500">{tx._id.slice(-8).toUpperCase()}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-gray-400" />
                                <span className="text-sm font-bold text-gray-900">
                                  {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {tx.type.includes('CREDIT') ? (
                                  <ArrowDownRight size={16} className="text-[#3AB000]" />
                                ) : (
                                  <ArrowUpRight size={16} className="text-red-500" />
                                )}
                                <span className={`text-xs font-black uppercase tracking-widest ${tx.type.includes('CREDIT') ? "text-[#3AB000]" : "text-red-500"
                                  }`}>
                                  {tx.type.split('_')[0]}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`text-lg font-black ${tx.type.includes('CREDIT') ? "text-[#3AB000]" : "text-red-500"
                                }`}>
                                {tx.type.includes('CREDIT') ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${getStatusColor(tx.status)}`}>
                                {tx.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <ExpandableRemark text={tx.remarks} colorClass="text-gray-600" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                      <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                          Page {pagination.page} of {pagination.pages}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => fetchHistory(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="px-4 py-2 bg-white border border-gray-200 rounded text-xs font-black text-gray-600 disabled:opacity-50 hover:border-[#3AB000] transition-colors"
                          >
                            Prev
                          </button>

                          {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1)
                            .map((p, idx, arr) => (
                              <React.Fragment key={p}>
                                {idx > 0 && p - arr[idx - 1] > 1 && (
                                  <span className="px-2 py-2 text-gray-400 font-bold">...</span>
                                )}
                                <button
                                  onClick={() => fetchHistory(p)}
                                  className={`w-8 h-8 flex items-center justify-center border rounded text-xs font-black transition-colors ${pagination.page === p
                                      ? "bg-[#3AB000] text-white border-[#3AB000]"
                                      : "bg-white text-gray-600 border-gray-200 hover:border-[#3AB000]"
                                    }`}
                                >
                                  {p}
                                </button>
                              </React.Fragment>
                            ))}

                          <button
                            onClick={() => fetchHistory(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages}
                            className="px-4 py-2 bg-white border border-gray-200 rounded text-xs font-black text-[#3AB000] disabled:opacity-50 hover:border-[#3AB000] transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                loadingWithdrawals ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#3AB000]" />
                  </div>
                ) : withdrawals.length === 0 ? (
                  <div className="text-center py-20 text-gray-500 font-bold">
                    No withdrawal requests found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-[#3AB000] text-white">
                        <tr>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 last:border-r-0">Request ID</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 last:border-r-0">Date</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 last:border-r-0">Bank Account</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 last:border-r-0">Requested Amount</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 last:border-r-0">Extra Expense</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 last:border-r-0">Total Paid</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest border-r border-white/10 last:border-r-0 text-center">Status</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.map((req, idx) => (
                          <tr key={req._id} className={`border-b border-gray-100 transition-colors hover:bg-green-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <td className="p-4 font-mono text-xs text-gray-500">{req._id.slice(-8).toUpperCase()}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-gray-400" />
                                <span className="text-sm font-bold text-gray-900">
                                  {new Date(req.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                <p className="text-[13px] font-black text-gray-800 uppercase leading-none">{req.bankDetails?.bankName}</p>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
                                  ACC: {req.bankDetails?.accountNumber}
                                </p>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-sm font-black text-gray-900">
                                ₹{req.amount.toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="text-sm font-black text-purple-600">
                                + ₹{(req.otherExpenses || 0).toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="text-base font-black text-green-700">
                                ₹{((req.amount || 0) + (req.otherExpenses || 0)).toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {req.status === 'pending' && <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest bg-amber-50 px-2.5 py-1 border border-amber-100 flex items-center justify-center gap-1 w-fit mx-auto"><Clock size={12} /> Pending</span>}

                              {req.status === 'success' && (
                                Date.now() - new Date(req.processedAt || req.createdAt).getTime() < 86400000 ? (
                                  <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest bg-blue-50 px-2.5 py-1 border border-blue-100 flex items-center justify-center gap-1 w-fit mx-auto"><Clock size={12} /> In Process</span>
                                ) : (
                                  <span className="text-green-600 text-[10px] font-black uppercase tracking-widest bg-green-50 px-2.5 py-1 border border-green-100 flex items-center justify-center gap-1 w-fit mx-auto"><CheckCircle2 size={12} /> Processed</span>
                                )
                              )}

                              {req.status === 'rejected' && <span className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-50 px-2.5 py-1 border border-red-100 flex items-center justify-center gap-1 w-fit mx-auto"><XCircle size={12} /> Rejected</span>}
                              {req.status === 'refunded' && <span className="text-purple-600 text-[10px] font-black uppercase tracking-widest bg-purple-50 px-2.5 py-1 border border-purple-200 flex items-center justify-center gap-1 w-fit mx-auto"><XCircle size={12} /> Refunded</span>}
                              {req.status === 'failed' && <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest bg-gray-100 px-2.5 py-1 border border-gray-200 flex items-center justify-center gap-1 w-fit mx-auto"><XCircle size={12} /> Failed</span>}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex flex-col items-end space-y-2">
                                <div className="flex flex-col items-end space-y-1">
                                  {req.adminRemark && (
                                    <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded truncate max-w-[150px]" title={req.adminRemark}>
                                      {req.adminRemark}
                                    </span>
                                  )}
                                  {req.rejectionReason && (
                                    <ExpandableRemark text={req.rejectionReason} isRightAligned={true} colorClass="text-red-500" />
                                  )}
                                  {!req.adminRemark && !req.rejectionReason && (
                                    <span className="text-gray-300 italic text-xs">—</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedTransaction(req);
                                    setIsModalOpen(true);
                                  }}
                                  className="text-[9px] font-black uppercase tracking-widest text-[#3AB000] hover:text-[#2B8000] border border-[#3AB000] px-2 py-1 bg-green-50 hover:bg-green-100 transition-colors mt-2"
                                >
                                  View Details
                                </button>
                                {req.status === 'success' && Date.now() - new Date(req.processedAt || req.createdAt).getTime() >= 86400000 && (
                                  <button
                                    onClick={() => handleDownloadReceipt(req)}
                                    className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 border border-blue-600 px-2 py-1 bg-blue-50 hover:bg-blue-100 transition-colors mt-2 flex items-center gap-1"
                                    title="Download Receipt"
                                  >
                                    <Download size={10} /> Receipt
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* Transaction Details Modal */}
      {isModalOpen && selectedTransaction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg shadow-2xl border-t-4 border-[#3AB000] animate-in fade-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                <TrendingUp size={20} className="text-[#3AB000]" /> Transaction Details
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Request ID</span>
                  <span className="text-sm font-mono text-gray-800">{selectedTransaction._id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Date & Time</span>
                  <span className="text-sm font-bold text-gray-800">
                    {new Date(selectedTransaction.createdAt).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="border-2 border-gray-100 p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-500">Requested Amount</span>
                  <span className="text-sm font-black text-gray-800">₹{(selectedTransaction.amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-dashed border-gray-200">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-500">Extra Expense</span>
                  <span className="text-sm font-black text-purple-600">+ ₹{(selectedTransaction.otherExpenses || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black uppercase tracking-widest text-gray-900">Total Paid</span>
                  <span className="text-xl font-black text-[#3AB000]">₹{((selectedTransaction.amount || 0) + (selectedTransaction.otherExpenses || 0)).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Status Box */}
              <div className={`p-4 border-l-4 ${selectedTransaction.status === 'success' ? 'border-green-500 bg-green-50' :
                  selectedTransaction.status === 'rejected' ? 'border-red-500 bg-red-50' :
                    'border-amber-500 bg-amber-50'
                }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Current Status</span>
                    <span className={`text-sm font-black uppercase tracking-wider ${selectedTransaction.status === 'success' ? 'text-green-700' :
                        selectedTransaction.status === 'rejected' ? 'text-red-700' :
                          selectedTransaction.status === 'refunded' ? 'text-purple-700' :
                            'text-amber-700'
                      }`}>
                      {selectedTransaction.status === 'success' && Date.now() - new Date(selectedTransaction.processedAt || selectedTransaction.createdAt).getTime() < 86400000 ? 'IN PROCESS' : selectedTransaction.status}
                    </span>
                  </div>
                  {selectedTransaction.processedAt && (
                    <div className="text-right">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block">Processed On</span>
                      <span className="text-xs font-bold text-gray-700">
                        {new Date(selectedTransaction.processedAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Remarks */}
              {(selectedTransaction.adminRemark || selectedTransaction.rejectionReason) && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  {selectedTransaction.adminRemark && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Admin Remark</span>
                      <p className="text-sm font-bold text-gray-700 bg-gray-50 p-3 rounded">{selectedTransaction.adminRemark}</p>
                    </div>
                  )}
                  {selectedTransaction.rejectionReason && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Rejection Reason</span>
                      <p className="text-sm font-bold text-red-600 bg-red-50 p-3 rounded">{selectedTransaction.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Salary;
