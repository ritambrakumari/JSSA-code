import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../auth/AuthProvider";
import DashboardLayout from "../../components/DashboardLayout";
import { ArrowLeft, Wallet, Landmark, Loader2, Plus, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiRequest, walletAPI } from "../../utils/api";
import { toast } from "react-hot-toast";
import axios from "axios";

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
    const isSunday = new Date(r.date).getDay() === 0;
    return !isSunday;
  }).length;

const StaffWithdrawalRequestPage = () => {
  const { employeeProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [viewBank, setViewBank] = useState(null);
  const [amount, setAmount] = useState("");
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  
  const [newBank, setNewBank] = useState({
    accountHolderName: employeeProfile?.name || "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  });

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [thisMonthCommission, setThisMonthCommission] = useState(0);
  const [withdrawnThisMonth, setWithdrawnThisMonth] = useState(0);

  const attendanceMonth = new Date().toISOString().substring(0, 7);

  useEffect(() => {
    const fetchAllData = async () => {
      setFetchingData(true);
      await Promise.all([
        fetchBankAccounts(),
        fetchMonthlyAttendance(),
        fetchHistory(),
        fetchStaffWithdrawals()
      ]);
      setFetchingData(false);
    };
    fetchAllData();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const res = await apiRequest("/withdrawals/my-bank-accounts", { method: "GET" });
      if (res.success) {
        setBankAccounts(res.data);
        if (res.data.length > 0) {
          const primary = res.data.find(b => b.isPrimary) || res.data[0];
          setSelectedBank(primary._id);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch bank accounts");
    }
  };

  const fetchMonthlyAttendance = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/goal-config/attendance/my-monthly?month=${attendanceMonth}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setAttendanceRecords(res.data.data || []);
      }
    } catch (error) {
      console.error("Fetch attendance error:", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await walletAPI.getHistory(1, 10, 'CREDIT_COMMISSION', 'thisMonth', '', '');
      if (res.success) {
        if (res.summary && res.summary.totalAmount !== undefined) {
          setThisMonthCommission(res.summary.totalAmount);
        } else if (res.summary && res.summary.totalEarnings !== undefined) {
          setThisMonthCommission(res.summary.totalEarnings);
        }
      }
    } catch (error) {
      console.error("Fetch History Error:", error);
    }
  };

  const fetchStaffWithdrawals = async () => {
    try {
      const res = await apiRequest(`/withdrawals/staff-history?page=1&limit=100&currentMonth=true`, { method: "GET" });
      if (res.success) {
        const sum = res.data
          .filter(r => r.status !== "rejected" && r.status !== "failed")
          .reduce((acc, r) => acc + r.amount, 0);
        setWithdrawnThisMonth(sum);
      }
    } catch (error) {
      console.error("Failed to fetch withdrawals", error);
    }
  };

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
    return earnedSalary;
  }, [attendanceRecords, employeeProfile?.salaryStructure?.ctc, attendanceMonth]);

  const totalEarningsThisMonth = attendanceStats + thisMonthCommission;
  const withdrawableEarnings = Math.max(0, totalEarningsThisMonth - withdrawnThisMonth);

  const handleAddBank = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await apiRequest("/withdrawals/bank-accounts", {
        method: "POST",
        body: JSON.stringify(newBank)
      });
      if (res.success) {
        toast.success("Bank account added successfully");
        setShowAddBankModal(false);
        setNewBank({
          accountHolderName: employeeProfile?.name || "",
          bankName: "",
          accountNumber: "",
          ifscCode: "",
        });
        fetchBankAccounts();
      } else {
        toast.error(res.error || "Failed to add bank account");
      }
    } catch (error) {
      toast.error(error.message || "Failed to add bank account");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return toast.error("Please enter a valid amount");
    if (!selectedBank) return toast.error("Please select a bank account");
    if (amount > withdrawableEarnings) return toast.error("Amount exceeds withdrawable balance for this month");

    try {
      setLoading(true);
      const res = await apiRequest("/withdrawals/staff-request", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(amount),
          bankAccountId: selectedBank,
          maxAvailable: withdrawableEarnings,
          requestType: "Staff"
        })
      });
      if (res.success) {
        toast.success("Staff withdrawal request submitted successfully");
        await refreshProfile();
        navigate("/staff/salary");
      } else {
        toast.error(res.error || "Withdrawal failed");
      }
    } catch (error) {
      toast.error(error.message || "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-gray-100 pb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/staff/salary")}
              className="p-2 hover:bg-green-100 text-green-600 border-2 border-green-200 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">Salary Withdrawal</h1>
              <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] mt-1">Instant Payout for Current Month</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-green-50 px-4 py-2 border border-green-100">
             <ShieldCheck size={16} className="text-green-600" />
             <span className="text-[10px] font-black uppercase text-green-600 tracking-widest">Secure Gateway</span>
          </div>
        </div>

        {fetchingData ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-4" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Verifying Balance...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Balance */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-green-600 p-6 text-white relative overflow-hidden shadow-xl shadow-green-200">
                <Wallet size={120} className="absolute -right-6 -bottom-6 text-white/10" />
                <p className="text-[10px] font-black text-green-100 uppercase tracking-widest mb-1 relative z-10">Available to Withdraw</p>
                <p className="text-[8px] font-bold text-green-200 uppercase mb-4 relative z-10">Current month earnings only</p>
                <h2 className="text-4xl font-black relative z-10">
                  ₹{Math.round(withdrawableEarnings).toLocaleString('en-IN')}
                </h2>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 p-4">
                <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest leading-relaxed">
                  Note: Any pending withdrawal requests are deducted from your available balance. Only current month's salary and commission can be withdrawn.
                </p>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleWithdraw} className="bg-white border-2 border-gray-100 p-6 md:p-8 space-y-8 shadow-sm">
                
                {/* Amount Input */}
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
                    Withdrawal Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-400">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-4 text-3xl font-black text-gray-900 bg-gray-50 border-2 border-gray-100 focus:border-green-600 focus:bg-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Bank Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      Select Bank Account
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddBankModal(true)}
                      className="text-[10px] font-black text-green-600 uppercase tracking-widest hover:text-green-700 flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Bank
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bankAccounts.length === 0 ? (
                      <div className="col-span-full p-6 text-center border-2 border-dashed border-gray-200 bg-gray-50">
                        <Landmark size={24} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">No Bank Accounts Found</p>
                      </div>
                    ) : (
                      bankAccounts.map((bank) => (
                        <div 
                          key={bank._id}
                          onClick={() => setSelectedBank(bank._id)}
                          className={`cursor-pointer border-2 p-4 transition-all relative overflow-hidden ${
                            selectedBank === bank._id 
                              ? 'border-green-600 bg-green-50 shadow-sm' 
                              : 'border-gray-100 bg-white hover:border-green-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 ${selectedBank === bank._id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                <Landmark size={16} />
                              </div>
                              <div>
                                <p className="text-xs font-black text-gray-900 uppercase">{bank.bankName}</p>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">XXXX-{bank.accountNumber.slice(-4)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewBank(bank);
                              }}
                              className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || withdrawableEarnings <= 0 || !amount || !selectedBank}
                  className="w-full bg-gray-900 text-white py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-black transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-200"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Submit Request"}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* Add Bank Modal */}
      {showAddBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md shadow-2xl border-t-4 border-green-600">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Add Bank Account</h2>
            </div>
            
            <form onSubmit={handleAddBank} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Bank Name</label>
                <input
                  type="text"
                  required
                  value={newBank.bankName}
                  onChange={(e) => setNewBank({...newBank, bankName: e.target.value})}
                  className="w-full text-xs font-bold bg-gray-50 border-2 border-gray-100 px-4 py-3 focus:border-green-600 focus:bg-white focus:outline-none"
                  placeholder="HDFC Bank"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Account Number</label>
                <input
                  type="text"
                  required
                  value={newBank.accountNumber}
                  onChange={(e) => setNewBank({...newBank, accountNumber: e.target.value})}
                  className="w-full text-xs font-bold bg-gray-50 border-2 border-gray-100 px-4 py-3 focus:border-green-600 focus:bg-white focus:outline-none"
                  placeholder="Enter Account Number"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">IFSC Code</label>
                <input
                  type="text"
                  required
                  value={newBank.ifscCode}
                  onChange={(e) => setNewBank({...newBank, ifscCode: e.target.value})}
                  className="w-full text-xs font-bold uppercase bg-gray-50 border-2 border-gray-100 px-4 py-3 focus:border-green-600 focus:bg-white focus:outline-none"
                  placeholder="HDFC0001234"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-colors flex justify-center items-center gap-2"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : "Save Bank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Bank Modal */}
      {viewBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm shadow-2xl border-t-4 border-blue-600">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                <Landmark size={18} className="text-blue-600" /> Bank Details
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Account Holder Name</label>
                <p className="text-sm font-bold text-gray-900 uppercase">{viewBank.accountHolderName}</p>
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Bank Name</label>
                <p className="text-sm font-bold text-gray-900 uppercase">{viewBank.bankName}</p>
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Account Number</label>
                <p className="text-sm font-bold text-gray-900 tracking-wider">{viewBank.accountNumber}</p>
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">IFSC Code</label>
                <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">{viewBank.ifscCode}</p>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setViewBank(null)}
                  className="w-full bg-gray-100 text-gray-600 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StaffWithdrawalRequestPage;
