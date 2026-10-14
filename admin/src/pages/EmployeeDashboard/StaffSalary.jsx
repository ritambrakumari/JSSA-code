import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { 
  TrendingUp, 
  Calendar, 
  Loader2, 
  ArrowDownRight, 
  RefreshCw,
  CreditCard,
  Briefcase,
  ShieldCheck,
  ReceiptText,
  Clock,
  Sun,
  CalendarDays,
  IndianRupee,
  Wallet,
  Landmark,
  ArrowRight,
  List,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { walletAPI, apiRequest, systemConfigAPI } from "../../utils/api";
import { useAuth } from "../../auth/AuthProvider";
import { toast } from "react-hot-toast";
import axios from "axios";

const GREEN = "#3AB000";

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const countSundaysInMonth = (year, month) => {
  const days = getDaysInMonth(year, month);
  let count = 0;
  for (let d = 1; d <= days; d++) {
    if (new Date(year, month, d).getDay() === 0) count++;
  }
  return count;
};

const countPresentDays = (records) =>
  records.filter((r) => {
    if (r.status !== "Checked-In" && r.status !== "Completed") return false;
    // Exclude Sundays from present days because they are already paid automatically
    const isSunday = new Date(r.date).getDay() === 0;
    return !isSunday;
  }).length;

const MetricCard = ({ icon: Icon, label, value, subLabel, color = "bg-green-600" }) => (
  <div className="bg-white border-2 border-green-600/20 p-6 flex items-start gap-4 shadow-sm relative overflow-hidden group">
    <div className={`p-3 ${color} text-white relative z-10`}>
      <Icon size={24} />
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
      {subLabel && <p className="text-[9px] font-bold text-green-600 uppercase mt-1 tracking-tight">{subLabel}</p>}
    </div>
    <div className="absolute -right-4 -bottom-4 text-gray-100 group-hover:scale-110 transition-transform duration-500">
      <Icon size={80} />
    </div>
  </div>
);

const AttendanceMetricCard = ({ icon: Icon, label, value, subLabel, accent = "bg-green-600" }) => (
  <div className="h-full min-h-[112px] bg-white border border-green-600/30 p-4 flex flex-col shadow-sm">
    <div className="flex items-start justify-between gap-2 mb-3">
      <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider leading-snug min-w-0 flex-1">
        {label}
      </p>
      <div className={`shrink-0 w-9 h-9 flex items-center justify-center ${accent} text-white`}>
        <Icon size={18} strokeWidth={2.5} />
      </div>
    </div>
    <p className="text-xl font-black text-gray-900 tabular-nums leading-none mt-auto">{value}</p>
    {subLabel && (
      <p className="text-[8px] font-bold text-green-600 uppercase mt-2 tracking-wide leading-tight">
        {subLabel}
      </p>
    )}
  </div>
);

const SalaryField = ({ label, value, isBold = false }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
    <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">{label}</span>
    <span className={`text-sm ${isBold ? "font-black text-green-600" : "font-bold text-gray-900"}`}>
      ₹{(value || 0).toLocaleString('en-IN')}
    </span>
  </div>
);

const StaffSalary = () => {
  const navigate = useNavigate();
  const { employeeProfile, refreshProfile } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filteredEarnings, setFilteredEarnings] = useState(0); // This is commission
  const [thisMonthCommission, setThisMonthCommission] = useState(0);
  const [dateRange, setDateRange] = useState("thisMonth");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceMonth, setAttendanceMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );
  
  // Withdrawal States
  const [withdrawnThisMonth, setWithdrawnThisMonth] = useState(0);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalPagination, setWithdrawalPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isWithdrawalEnabled, setIsWithdrawalEnabled] = useState(true);

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

  useEffect(() => {
    fetchSystemConfig();
  }, []);
  const fetchMonthlyAttendance = async (targetMonth = attendanceMonth) => {
    try {
      setAttendanceLoading(true);
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/goal-config/attendance/my-monthly?month=${targetMonth}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setAttendanceRecords(res.data.data || []);
      }
    } catch (error) {
      console.error("Fetch attendance error:", error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchHistory = async (page = 1) => {
    try {
      setLoading(true);
      const res = await walletAPI.getHistory(page, 10, 'CREDIT_COMMISSION', dateRange, startDate, endDate);
      if (res.success) {
        setHistory(res.data);
        setPagination(res.pagination);
        let amount = 0;
        if (res.summary && res.summary.totalAmount !== undefined) {
          amount = res.summary.totalAmount;
        } else if (res.summary && res.summary.totalEarnings !== undefined) {
          amount = res.summary.totalEarnings;
        }
        setFilteredEarnings(amount);
        if (dateRange === "thisMonth") {
          setThisMonthCommission(amount);
        }
      }
    } catch (error) {
      console.error("Fetch History Error:", error);
      toast.error("Failed to fetch transaction history");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffWithdrawals = async (page = 1, currentMonth = true) => {
    try {
      setWithdrawalLoading(true);
      const res = await apiRequest(`/withdrawals/staff-history?page=${page}&limit=10&currentMonth=${currentMonth}`, { method: "GET" });
      if (res.success) {
        if (currentMonth) {
          // Calculate sum of pending and approved/success requests for the current month
          const sum = res.data
            .filter(r => r.status !== "rejected" && r.status !== "failed")
            .reduce((acc, r) => acc + r.amount, 0);
          setWithdrawnThisMonth(sum);
        }
        setWithdrawalHistory(res.data);
        setWithdrawalPagination(res.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch withdrawals", error);
    } finally {
      setWithdrawalLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange !== "custom_date") {
      fetchHistory(1);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchStaffWithdrawals(1, true);
  }, []);

  useEffect(() => {
    fetchMonthlyAttendance();
  }, [attendanceMonth]);

  const attendanceStats = useMemo(() => {
    const [yearStr, monthStr] = attendanceMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const daysInMonth = getDaysInMonth(year, month);
    const sundays = countSundaysInMonth(year, month);
    const presentDays = countPresentDays(attendanceRecords);
    const ctc = employeeProfile?.salaryStructure?.ctc || 0;
    const perDaySalary = daysInMonth > 0 ? ctc / daysInMonth : 0;
    const payableDays = presentDays + sundays;
    const earnedSalary = perDaySalary * payableDays;

    return {
      daysInMonth,
      sundays,
      presentDays,
      payableDays,
      ctc,
      perDaySalary,
      earnedSalary,
      monthLabel: new Date(year, month).toLocaleString("en-IN", { month: "long", year: "numeric" }),
    };
  }, [attendanceRecords, employeeProfile?.salaryStructure?.ctc, attendanceMonth]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    await Promise.all([fetchHistory(1), fetchMonthlyAttendance(), fetchStaffWithdrawals(1, true), fetchSystemConfig()]);
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  const totalEarningsThisMonth = attendanceStats.earnedSalary + thisMonthCommission;
  const withdrawableEarnings = Math.max(0, totalEarningsThisMonth - withdrawnThisMonth);

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case "thisMonth": return "THIS MONTH'S COMMISSIONS";
      case "pastMonth": return "PAST MONTH'S COMMISSIONS";
      case "today": return "TODAY'S COMMISSIONS";
      case "yesterday": return "YESTERDAY'S COMMISSIONS";
      case "last7days": return "LAST 7 DAYS COMMISSIONS";
      case "last30days": return "LAST 30 DAYS COMMISSIONS";
      case "all": return "LIFETIME CARD COMMISSIONS";
      case "custom_date": return "CUSTOM RANGE COMMISSIONS";
      default: return "CARD COMMISSIONS";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SUCCESS": return "bg-green-100 text-green-700";
      case "PENDING": return "bg-orange-100 text-orange-700";
      case "FAILED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const salary = employeeProfile?.salaryStructure || {};
  const commission = employeeProfile?.cardCommission || {};

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-green-600 pb-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">
              Salary & <span className="text-green-600">Earnings</span>
            </h1>
            <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.3em] mt-1">
              Financial performance & commission dashboard
            </p>
          </div>
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-green-700 transition-colors shadow-lg shadow-green-200 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Stats"}
          </button>
        </div>

        {/* Top Metric Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border-2 border-green-600/20 p-6 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Current Month Salary</p>
            <h3 className="text-3xl font-black text-gray-900">₹{Math.round(attendanceStats.earnedSalary).toLocaleString('en-IN')}</h3>
            <p className="text-[9px] font-bold text-green-600 uppercase mt-2">Based on Attendance</p>
          </div>
          <div className="bg-white border-2 border-green-600/20 p-6 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Current Month Commission</p>
            <h3 className="text-3xl font-black text-gray-900">₹{Math.round(thisMonthCommission).toLocaleString('en-IN')}</h3>
            <p className="text-[9px] font-bold text-green-600 uppercase mt-2">Cards Approved This Month</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-600 p-6 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-2">Total Monthly Earnings</p>
            <h3 className="text-4xl font-black text-green-700">₹{Math.round(totalEarningsThisMonth).toLocaleString('en-IN')}</h3>
            <p className="text-[9px] font-bold text-gray-500 uppercase mt-2">Salary + Commission</p>
          </div>
          <div className="bg-green-600 text-white p-6 shadow-lg shadow-green-200 flex flex-col justify-center relative overflow-hidden group">
            <Wallet size={80} className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform duration-500" />
            <p className="text-[10px] font-black text-green-100 uppercase tracking-widest mb-2 relative z-10">Withdrawable Earning</p>
            <h3 className="text-4xl font-black text-white relative z-10">₹{Math.round(withdrawableEarnings).toLocaleString('en-IN')}</h3>
            <div className="mt-4 flex flex-col gap-2 relative z-10">
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => isWithdrawalEnabled && navigate('/staff/salary/withdraw')}
                  disabled={withdrawableEarnings <= 0 || !isWithdrawalEnabled}
                  className="flex-1 min-w-max bg-white text-green-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-green-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Withdraw <ArrowRight size={14} />
                </button>
                <button 
                  onClick={() => { setShowHistoryModal(true); fetchStaffWithdrawals(1, false); }}
                  className="bg-green-700 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-green-800 transition-colors flex items-center justify-center gap-2"
                >
                  <List size={14} /> Track
                </button>
              </div>
              {!isWithdrawalEnabled && (
                <p className="text-[9px] font-bold text-red-200 uppercase mt-1 tracking-wider bg-red-900/30 p-1.5 border border-red-500/20 text-center shadow-inner">
                  Withdrawals are only open from the 1st to the 5th of each month.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Attendance & Earned Salary */}
        <div className="bg-white border-2 border-green-600/20 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50/80 to-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-600 text-white">
                <Clock size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                  Attendance & Earned Salary
                </h2>
                <p className="text-[9px] font-black text-green-600 uppercase tracking-[0.25em] mt-0.5">
                  {attendanceStats.monthLabel} · CTC-based calculation
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest max-w-xs text-left lg:text-right hidden sm:block">
                Sundays are paid automatically and are not deducted from your salary.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">Filter:</span>
                <input 
                  type="month"
                  value={attendanceMonth}
                  onChange={(e) => setAttendanceMonth(e.target.value)}
                  className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-green-600 uppercase tracking-widest shadow-sm shrink-0"
                />
              </div>
            </div>
          </div>

          {attendanceLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-2" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Loading attendance...
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 [&>*]:min-w-0">
                <AttendanceMetricCard
                  icon={CalendarDays}
                  label="Days in Month"
                  value={attendanceStats.daysInMonth}
                  accent="bg-gray-700"
                />
                <AttendanceMetricCard
                  icon={Sun}
                  label="Sundays (Paid)"
                  value={attendanceStats.sundays}
                  subLabel="Auto present"
                  accent="bg-amber-600"
                />
                <AttendanceMetricCard
                  icon={ShieldCheck}
                  label="Present Days"
                  value={attendanceStats.presentDays}
                  subLabel="Checked-in / Done"
                  accent="bg-green-600"
                />
                <AttendanceMetricCard
                  icon={Calendar}
                  label="Payable Days"
                  value={attendanceStats.payableDays}
                  subLabel="Present + Sundays"
                  accent="bg-teal-600"
                />
                <AttendanceMetricCard
                  icon={IndianRupee}
                  label="Per Day Salary"
                  value={`₹${Math.round(attendanceStats.perDaySalary).toLocaleString("en-IN")}`}
                  subLabel={`CTC ÷ ${attendanceStats.daysInMonth}`}
                  accent="bg-purple-600"
                />
                <AttendanceMetricCard
                  icon={TrendingUp}
                  label="Earned This Month"
                  value={`₹${Math.round(attendanceStats.earnedSalary).toLocaleString("en-IN")}`}
                  subLabel="Based on attendance"
                  accent="bg-[#3AB000]"
                />
              </div>

              {attendanceRecords.length > 0 && (
                <div className="border border-gray-200 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Date</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Check-In</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Check-Out</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Hours</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {attendanceRecords.map((rec) => (
                        <tr key={rec._id} className="hover:bg-green-50/30 text-xs font-bold text-gray-700">
                          <td className="px-4 py-3">{rec.date}</td>
                          <td className="px-4 py-3">
                            {rec.checkIn?.time
                              ? new Date(rec.checkIn.time).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {rec.checkOut?.time
                              ? new Date(rec.checkOut.time).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </td>
                          <td className="px-4 py-3">{rec.workingHours || "0"}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-green-100 text-green-700">
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Salary Breakdown & CTC */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-green-600/20 shadow-sm overflow-hidden h-full flex flex-col">
              {/* Section Header */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50/80 to-white flex items-center gap-3">
                <div className="p-3 bg-purple-600 text-white">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                    Remuneration Profile
                  </h2>
                  <p className="text-[9px] font-black text-purple-600 uppercase tracking-[0.25em] mt-0.5">
                    CTC & Salary Structure
                  </p>
                </div>
              </div>

              {/* Section Content */}
              <div className="p-6 space-y-6 flex-1">
                <MetricCard 
                  icon={ShieldCheck} 
                  label="Monthly CTC" 
                  value={`₹${(salary.ctc || 0).toLocaleString('en-IN')}`}
                  subLabel="Gross Salary + Benefits"
                  color="bg-purple-600"
                />
                
                <div className="bg-white border-2 border-purple-600/30 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
                    <Briefcase size={20} className="text-purple-600" />
                    <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Salary Structure</h2>
                  </div>
                  <div className="space-y-1">
                    <SalaryField label="Basic Salary" value={salary.basic} />
                    <SalaryField label="HRA" value={salary.hra} />
                    <SalaryField label="Special Allowance" value={salary.specialAllowance} />
                    <SalaryField label="Medical Allowance" value={salary.medicalAllowance} />
                    <SalaryField label="Conveyance" value={salary.conveyanceAllowance} />
                    <SalaryField label="Mobile Bill" value={salary.mobileBill} />
                    <SalaryField label="Performance Bonus" value={salary.performanceBonus} />
                    <div className="mt-4 pt-4 border-t-2 border-purple-600/30">
                      <SalaryField label="Gross Salary" value={salary.grossSalary} isBold />
                    </div>
                  </div>
                </div>

                <div className="bg-purple-600 p-6 shadow-lg shadow-purple-100">
                  <h3 className="text-xs font-black text-purple-100 uppercase tracking-widest mb-4">Additional Benefits</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-white">
                      <span className="text-[10px] font-bold uppercase tracking-tight">Provident Fund (PF)</span>
                      <span className="text-sm font-black">₹{(salary.benefits?.pf || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-white">
                      <span className="text-[10px] font-bold uppercase tracking-tight">Gratuity</span>
                      <span className="text-sm font-black">₹{(salary.benefits?.gratuity || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-white">
                      <span className="text-[10px] font-bold uppercase tracking-tight">Insurance</span>
                      <span className="text-sm font-black">₹{(salary.benefits?.insurance || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Earnings History */}
          <div className="lg:col-span-2">
            <div className="bg-white border-2 border-green-600/20 shadow-sm overflow-hidden h-full flex flex-col">
              {/* Section Header */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50/80 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-600 text-white">
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                      Commission & Earnings
                    </h2>
                    <p className="text-[9px] font-black text-green-600 uppercase tracking-[0.25em] mt-0.5">
                      Card creation bonuses & history
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">Filter:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <select 
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-green-600 uppercase tracking-widest shadow-sm"
                    >
                      <option value="thisMonth">This Month</option>
                      <option value="pastMonth">Past Month</option>
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="last7days">Last 7 Days</option>
                      <option value="last30days">Last 30 Days</option>
                      <option value="all">All Time</option>
                      <option value="custom_date">Custom Date</option>
                    </select>
                    
                    {dateRange === "custom_date" && (
                      <div className="flex items-center gap-2">
                        <input 
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-green-600 uppercase tracking-widest shadow-sm"
                        />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">To</span>
                        <input 
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-green-600 uppercase tracking-widest shadow-sm"
                        />
                        <button 
                          onClick={() => fetchHistory(1)}
                          disabled={!startDate || !endDate}
                          className="bg-green-600 text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-green-700 disabled:opacity-50 transition-opacity shadow-sm"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section Content */}
              <div className="p-6 flex-1 flex flex-col space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MetricCard 
                    icon={TrendingUp} 
                    label="Card Earnings" 
                    value={`₹${(filteredEarnings || 0).toLocaleString('en-IN')}`}
                    subLabel={getDateRangeLabel()}
                    color="bg-[#3AB000]"
                  />
                  <MetricCard 
                    icon={CreditCard} 
                    label="Card Commission" 
                    value={`₹${commission.amountPerCard || 0}`}
                    subLabel={commission.enabled ? "Active" : "Inactive"}
                    color="bg-orange-600"
                  />
                </div>

                <div className="bg-white border-2 border-green-600 shadow-sm overflow-hidden flex-1 flex flex-col">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-green-50/50">
                    <div className="flex items-center gap-2">
                      <ReceiptText size={20} className="text-green-600" />
                      <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Earnings History</h2>
                    </div>
                    <span className="text-[9px] font-black text-green-600 uppercase tracking-widest bg-white px-2 py-1 border border-green-600/30">
                      Card Commissions
                    </span>
                  </div>

                  <div className="flex-1 overflow-x-auto">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-3" />
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fetching History...</p>
                      </div>
                    ) : history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mb-4">
                          <ReceiptText size={32} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No Commission History Found</p>
                      </div>
                    ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">Txn ID</th>
                          <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">Date</th>
                          <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">Amount</th>
                          <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">Status</th>
                          <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {history.map((tx) => (
                          <tr key={tx._id} className="hover:bg-green-50/30 transition-colors">
                            <td className="px-4 py-3 text-xs font-mono font-bold text-gray-400 whitespace-nowrap">
                              #{tx._id.slice(-8).toUpperCase()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-gray-800">
                                  {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                  })}
                                </span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase">
                                  {new Date(tx.createdAt).toLocaleTimeString('en-IN', {
                                    hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <ArrowDownRight size={14} className="text-green-600" />
                                <span className="text-base font-black text-green-600">
                                  ₹{tx.amount.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest border ${getStatusColor(tx.status)}`}>
                                {tx.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-bold text-gray-600 line-clamp-1">{tx.remarks}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    )}
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        Showing Page {pagination.page} of {pagination.pages}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => fetchHistory(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="px-4 py-2 bg-white border border-gray-200 text-[9px] font-black text-gray-600 uppercase tracking-widest hover:border-green-600 transition-colors disabled:opacity-30"
                        >
                          Previous
                        </button>
                        <button 
                          onClick={() => fetchHistory(pagination.page + 1)}
                          disabled={pagination.page === pagination.pages}
                          className="px-4 py-2 bg-green-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-green-700 transition-colors disabled:opacity-30 shadow-md shadow-green-100"
                        >
                          Next Page
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Tracking Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex bg-white animate-in fade-in duration-200">
          <div className="bg-white w-full h-full flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-10 py-6 bg-[#3AB000] border-b-4 border-black">
              <div className="flex flex-col">
                <h2 className="text-white font-black text-2xl flex items-center gap-3 uppercase tracking-wide">
                  <ReceiptText className="w-8 h-8 text-white" /> Withdrawal History
                </h2>
                <p className="text-xs font-bold text-white/80 uppercase tracking-widest mt-2">
                  Track your payment requests and statuses
                </p>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black hover:text-white transition-colors text-white rounded-none border border-white/10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6 bg-white">
              {withdrawalLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-4" />
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Records...</p>
                </div>
              ) : withdrawalHistory.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <List size={32} className="text-gray-400" />
                  </div>
                  <p className="text-lg font-black text-gray-900 uppercase">No Withdrawals Found</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mt-2">You haven't made any withdrawal requests yet</p>
                </div>
              ) : (
                <div className="border border-gray-200 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Date</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Requested Amount</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Extra Expense</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Total Paid</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Status</th>
                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {withdrawalHistory.map((item) => (
                        <tr key={item._id} className="hover:bg-green-50/30 text-xs font-bold text-gray-700">
                          <td className="px-4 py-4 whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-gray-900 font-black">
                            ₹{(item.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-purple-600 font-black">
                            + ₹{(item.otherExpenses || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-green-700 font-black text-sm">
                            ₹{((item.amount || 0) + (item.otherExpenses || 0)).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider ${
                              item.status === 'success' || item.status === 'approved' ? 'bg-green-100 text-green-700' :
                              item.status === 'rejected' || item.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {item.adminRemark ? (
                              <span className="text-gray-600 block max-w-xs truncate" title={item.adminRemark}>{item.adminRemark}</span>
                            ) : (
                              <span className="text-gray-400 italic">—</span>
                            )}
                            {item.rejectionReason && (
                              <span className="text-red-500 block max-w-xs truncate" title={item.rejectionReason}>Reason: {item.rejectionReason}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Modal Footer (Pagination) */}
            {!withdrawalLoading && withdrawalPagination.pages > 1 && (
              <div className="px-10 py-6 border-t-4 border-black flex items-center justify-between bg-gray-50 shrink-0">
                <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                  Showing Page {withdrawalPagination.page} of {withdrawalPagination.pages}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => fetchStaffWithdrawals(withdrawalPagination.page - 1, false)}
                    disabled={withdrawalPagination.page === 1}
                    className="px-6 py-3 bg-white border border-gray-200 text-[10px] font-black text-gray-600 uppercase tracking-widest hover:border-black hover:text-black transition-colors disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => fetchStaffWithdrawals(withdrawalPagination.page + 1, false)}
                    disabled={withdrawalPagination.page === withdrawalPagination.pages}
                    className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-30 shadow-md shadow-gray-200"
                  >
                    Next Page
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StaffSalary;
