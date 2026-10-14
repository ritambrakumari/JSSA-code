import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthProvider";
import DashboardLayout from "../../components/DashboardLayout";
import { ArrowLeft, Wallet, Landmark, Loader2, Plus, CheckCircle2, AlertCircle, X, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiRequest, systemConfigAPI } from "../../utils/api";
import { toast } from "react-hot-toast";

const GREEN = "#3AB000";

const WithdrawalRequestPage = () => {
  const { employeeProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingBanks, setFetchingBanks] = useState(true);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [amount, setAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [viewingBank, setViewingBank] = useState(null);

  const [isWithdrawalEnabled, setIsWithdrawalEnabled] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // New Bank State
  const [newBank, setNewBank] = useState({
    accountHolderName: employeeProfile?.name || "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  });

  useEffect(() => {
    fetchSystemConfig();
    fetchBankAccounts();
  }, []);

  const fetchSystemConfig = async () => {
    try {
      setCheckingStatus(true);
      const res = await systemConfigAPI.getCurrent();
      if (res.success && res.data) {
        setIsWithdrawalEnabled(res.data.isWithdrawalEnabled !== false);
      }
    } catch (err) {
      console.error("Failed to fetch system config:", err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      setFetchingBanks(true);
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
    } finally {
      setFetchingBanks(false);
    }
  };

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
    if (!amount || amount < 500) return toast.error("Minimum withdrawal amount is ₹500");
    if (!selectedBank) return toast.error("Please select a bank account");
    if (amount > employeeProfile?.salaryWallet) return toast.error("Insufficient balance");

    try {
      setLoading(true);
      const res = await apiRequest("/withdrawals/request", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(amount),
          bankAccountId: selectedBank,
          requestType: "Employee"
        })
      });
      if (res.success) {
        toast.success("Withdrawal request submitted successfully");
        await refreshProfile();
        navigate("/employee/salary");
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
              onClick={() => navigate("/employee/salary")}
              className="p-2 hover:bg-[#3AB000]/10 text-[#3AB000] border-2 border-[#3AB000]/20 transition-colors rounded-none"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">Salary Withdrawal</h1>
              <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.2em] mt-1">Instant Payout to your bank account</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-green-50 px-4 py-2 border border-green-100">
            <ShieldCheck size={16} className="text-[#3AB000]" />
            <span className="text-[10px] font-black uppercase text-[#3AB000] tracking-widest">Secure Gateway</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Request Form */}
          {checkingStatus ? (
            <div className="lg:col-span-2 space-y-6 flex justify-center py-20 bg-white border-2 border-gray-100 shadow-xl shadow-gray-100/50">
              <Loader2 className="animate-spin text-[#3AB000] w-10 h-10" />
            </div>
          ) : !isWithdrawalEnabled ? (
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border-2 border-gray-100 shadow-xl shadow-gray-100/50 p-10 rounded-none text-center space-y-4">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={32} />
                </div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Withdrawals Closed</h2>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                  Withdrawals are only open from the <span className="text-[#3AB000]">1st to the 5th of each month</span>. Please come back during the withdrawal window.
                </p>
                <div className="pt-6">
                  <button onClick={() => navigate('/employee/salary')} className="px-6 py-3 bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-colors">
                    Back to Salary
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleWithdraw} className="bg-white border-2 border-gray-100 shadow-xl shadow-gray-100/50 p-8 rounded-none space-y-8 relative overflow-hidden">
                {/* Decorative Gradient Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3AB000] to-[#2B8000]" />

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-700 block">Withdrawal Amount</label>
                  <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-4xl text-gray-300 group-focus-within:text-[#3AB000] transition-colors">₹</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="500"
                      className="w-full pl-14 pr-8 py-8 border-2 border-gray-100 font-black text-5xl focus:border-[#3AB000] focus:bg-green-50/30 outline-none rounded-none transition-all placeholder:text-gray-100"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-700">Select Destination Account</label>
                    <button
                      type="button"
                      onClick={() => setShowAddBankModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#3AB000] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#2B8000] transition-all shadow-lg shadow-[#3AB000]/20 rounded-none"
                    >
                      <Plus size={14} /> Add Bank
                    </button>
                  </div>

                  {fetchingBanks ? (
                    <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-[#3AB000]" /></div>
                  ) : bankAccounts.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-gray-200 text-center space-y-2">
                      <Landmark size={30} className="mx-auto text-gray-200" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No bank accounts added yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {bankAccounts.map((bank) => {
                        const isMOU = bank.accountNumber === employeeProfile?.accountNumber;
                        return (
                          <div
                            key={bank._id}
                            className={`group flex flex-col p-5 border-2 transition-all ${selectedBank === bank._id
                                ? "border-[#3AB000] bg-green-50"
                                : "border-gray-100 hover:border-gray-200 bg-white"
                              }`}
                          >
                            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedBank(bank._id)}>
                              <div className={`w-10 h-10 flex items-center justify-center transition-colors ${selectedBank === bank._id ? "bg-[#3AB000] text-white" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"}`}>
                                <Landmark size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-tight text-gray-900 truncate">{bank.bankName}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">XXXX {bank.accountNumber.slice(-4)}</p>
                              </div>
                              {selectedBank === bank._id && <CheckCircle2 size={16} className="text-[#3AB000] shrink-0" />}
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-100/50 flex items-center justify-between">
                              {isMOU ? (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest rounded-sm border border-blue-100">
                                  MOU Linked
                                </span>
                              ) : <div></div>}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setViewingBank(bank); }}
                                className="text-[9px] font-black uppercase tracking-widest text-[#3AB000] hover:text-[#2B8000] transition-colors"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !amount || !selectedBank}
                  className="w-full bg-[#3AB000] text-white py-6 font-black uppercase tracking-[0.3em] text-sm shadow-xl shadow-[#3AB000]/20 hover:bg-[#2B8000] hover:shadow-none hover:translate-y-1 transition-all disabled:opacity-50 disabled:grayscale rounded-none"
                >
                  {loading ? "Processing Transaction..." : "Confirm & Withdraw"}
                </button>
              </form>
            </div>
          )}

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-[#3AB000] to-[#2B8000] p-8 text-white shadow-2xl shadow-[#3AB000]/30 rounded-none relative overflow-hidden group">
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2 opacity-80">
                  <Wallet size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Available Balance</span>
                </div>
                <h2 className="text-4xl font-black tracking-tighter">₹{(employeeProfile?.salaryWallet || 0).toLocaleString('en-IN')}</h2>
              </div>
              {/* Background Icon Decoration */}
              <Wallet size={120} className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700" />
            </div>

            {/* Guidelines */}
            <div className="bg-white border-2 border-gray-100 p-6 space-y-4 rounded-none">
              <div className="flex items-center gap-2 text-[#3AB000]">
                <AlertCircle size={16} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Withdrawal Guidelines</h3>
              </div>
              <div className="space-y-4">
                {[
                  "Requests are reviewed and processed within 24-48 working hours.",
                  "Amount will be credited to the selected bank account only.",
                  "Minimum withdrawal limit: ₹1.00",
                  "Razorpay X Gateway ensures 100% secure transfers."
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-1 h-1 bg-[#3AB000] rounded-full mt-1.5 shrink-0" />
                    <p className="text-[9px] font-bold text-gray-500 uppercase leading-relaxed tracking-wide">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Bank Modal */}
      {showAddBankModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md border-2 border-[#3AB000]/20 shadow-[20px_20px_60px_-15px_rgba(58,176,0,0.3)] rounded-none overflow-hidden scale-in-center">
            <div className="bg-[#3AB000] text-white p-6 flex justify-between items-center relative">
              {/* Decorative background pattern */}
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Landmark size={80} />
              </div>
              <div className="relative z-10">
                <h2 className="text-lg font-black uppercase tracking-widest leading-none">Add Bank Details</h2>
                <p className="text-[9px] font-bold text-green-100 uppercase tracking-widest mt-2">Enter your verified bank information</p>
              </div>
              <button
                onClick={() => setShowAddBankModal(false)}
                className="p-2 hover:bg-white/20 transition-colors relative z-10"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddBank} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-600">Account Holder Name</label>
                  <input
                    required
                    placeholder="John Doe"
                    value={newBank.accountHolderName}
                    onChange={(e) => setNewBank({ ...newBank, accountHolderName: e.target.value })}
                    className="w-full p-4 border-2 border-gray-100 font-bold text-sm focus:border-[#3AB000] focus:bg-green-50/30 outline-none rounded-none uppercase transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-600">Bank Name</label>
                  <input
                    required
                    placeholder="HDFC Bank"
                    value={newBank.bankName}
                    onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                    className="w-full p-4 border-2 border-gray-100 font-bold text-sm focus:border-[#3AB000] focus:bg-green-50/30 outline-none rounded-none uppercase transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-600">Account Number</label>
                    <input
                      required
                      placeholder="0000000000"
                      value={newBank.accountNumber}
                      onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                      className="w-full p-4 border-2 border-gray-100 font-bold text-sm focus:border-[#3AB000] focus:bg-green-50/30 outline-none rounded-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-gray-600">IFSC Code</label>
                    <input
                      required
                      placeholder="HDFC0001234"
                      value={newBank.ifscCode}
                      onChange={(e) => setNewBank({ ...newBank, ifscCode: e.target.value.toUpperCase() })}
                      className="w-full p-4 border-2 border-gray-100 font-bold text-sm focus:border-[#3AB000] focus:bg-green-50/30 outline-none rounded-none uppercase transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3AB000] text-white py-5 font-black uppercase tracking-[0.2em] shadow-xl shadow-[#3AB000]/20 hover:bg-[#2B8000] hover:shadow-none hover:translate-y-1 transition-all disabled:opacity-50 rounded-none"
              >
                {loading ? "Verifying..." : "Save Bank Account"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Bank Modal */}
      {viewingBank && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm border-2 border-[#3AB000]/20 shadow-[20px_20px_60px_-15px_rgba(58,176,0,0.3)] rounded-none overflow-hidden scale-in-center">
            <div className="bg-gray-50 border-b border-gray-100 p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white border border-gray-200 flex items-center justify-center text-[#3AB000]">
                  <Landmark size={16} />
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Account Details</h2>
              </div>
              <button
                onClick={() => setViewingBank(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Account Holder</label>
                <p className="text-sm font-bold text-gray-900 uppercase mt-0.5">{viewingBank.accountHolderName}</p>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Bank Name</label>
                <p className="text-sm font-bold text-gray-900 uppercase mt-0.5">{viewingBank.bankName}</p>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Account Number</label>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{viewingBank.accountNumber}</p>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">IFSC Code</label>
                <p className="text-sm font-bold text-gray-900 uppercase mt-0.5">{viewingBank.ifscCode}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles for animations */}
      <style>{`
        @keyframes scale-in-center {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .scale-in-center {
          animation: scale-in-center 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
      `}</style>
    </DashboardLayout>
  );
};
export default WithdrawalRequestPage;
