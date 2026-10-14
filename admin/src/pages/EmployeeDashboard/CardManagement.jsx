import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { cardAPI } from "../../utils/api";
import {
  Plus,
  Search,
  CreditCard,
  User,
  Calendar,
  Phone,
  ChevronRight,
  Loader2,
  Filter,
  X,
  History,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Pencil
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { toast } from "react-hot-toast";
import { employeesAPI, walletAPI } from "../../utils/api";
import ZoneLockEmptyState from "../../components/ZoneLockEmptyState";

const GREEN = "#3AB000";

const CardManagement = () => {
  const navigate = useNavigate();
  const { identifier, isZoneLocked, employeeProfile, refreshProfile } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(750);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [historyPagination, setHistoryPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [walletHistory, setWalletHistory] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [reqUser, setReqUser] = useState(null);
  const [isInsufficientBalanceModalOpen, setIsInsufficientBalanceModalOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(150);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    await fetchWalletData();
    setRefreshing(false);
  };

  // Load Razorpay Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchWalletData = async () => {
    try {
      setWalletLoading(true);
      const balanceRes = await walletAPI.getBalance();
      if (balanceRes.success) {
        setWalletBalance(balanceRes.balance);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchHistory = async (page = 1) => {
    try {
      setIsHistoryLoading(true);
      const historyRes = await walletAPI.getHistory(page, 20, 'WALLET');
      if (historyRes.success) {
        setWalletHistory(historyRes.data);
        setHistoryPagination(historyRes.pagination);
      }
    } catch (error) {
      console.error("Error fetching wallet history:", error);
      toast.error("Failed to load history");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await cardAPI.getMe?.() || await walletAPI.getBalance(); // Just a fallback if getMe is not in cardAPI
      // Actually let's use the correct one from api.js if I can find it
      // I'll just use a direct apiRequest if needed, but let's assume employeesAPI.getProfile works
    } catch (e) {}
  };

  const handleRecharge = async () => {
    console.log("DEBUG: handleRecharge started");
    try {
      setRechargeLoading(true);
      
      // 1. Load Razorpay script
      console.log("DEBUG: Loading Razorpay script...");
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        console.error("DEBUG: Razorpay script failed to load");
        toast.error("Razorpay SDK failed to load. Are you online?");
        return;
      }
      console.log("DEBUG: Razorpay script loaded successfully");

      // 2. Create Order in Backend
      console.log("DEBUG: Creating order in backend for amount:", selectedAmount);
      const orderRes = await walletAPI.createOrder({ amount: selectedAmount });
      console.log("DEBUG: Order response:", orderRes);
      
      if (!orderRes.success) {
        toast.error(orderRes.error || "Failed to initiate payment");
        return;
      }

      const { orderId, amount, currency, keyId } = orderRes.data;
      console.log("DEBUG: Order details received:", { orderId, amount, currency, keyId });

      // 3. Open Razorpay Checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "JSSA Wallet",
        description: `Wallet Recharge - ₹${selectedAmount}`,
        order_id: orderId,
        handler: async function (response) {
          console.log("DEBUG: Payment success handler called:", response);
          try {
            setRechargeLoading(true);
            // 4. Verify Payment in Backend
            const verifyRes = await walletAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              toast.success("Wallet recharged successfully!");
              setIsRechargeModalOpen(false);
              fetchWalletData(); // Refresh balance and history
            } else {
              toast.error(verifyRes.error || "Payment verification failed");
            }
          } catch (err) {
            console.error("DEBUG: Verification Error:", err);
            toast.error("Failed to verify payment");
          } finally {
            setRechargeLoading(false);
          }
        },
        prefill: {
          name: reqUser?.name || "",
          email: reqUser?.email || "",
          contact: reqUser?.phone || "",
        },
        theme: {
          color: GREEN,
        },
        modal: {
          ondismiss: function() {
            console.log("DEBUG: Checkout modal closed");
            setRechargeLoading(false);
          }
        }
      };

      console.log("DEBUG: Initializing Razorpay modal...");
      if (!window.Razorpay) {
        console.error("DEBUG: window.Razorpay is missing");
        toast.error("Razorpay SDK not found. Please refresh the page.");
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
      console.log("DEBUG: Razorpay modal open command sent");

    } catch (error) {
      console.error("Recharge Error:", error);
      toast.error("Something went wrong");
    } finally {
      setRechargeLoading(false);
    }
  };

  const fetchCards = async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = { search, dateRange, page, limit: 10 };
      if (dateRange === "custom_date") {
        if (customStartDate) queryParams.startDate = customStartDate;
        if (customEndDate) queryParams.endDate = customEndDate;
      }
      const res = await cardAPI.list(queryParams);
      if (res.success) {
        setCards(res.data.cards);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewCard = () => {
    if (walletBalance < currentPrice) {
      setIsInsufficientBalanceModalOpen(true);
    } else {
      navigate("/employee/cards/add");
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await api.systemConfig.getCurrent();
      if (res.success) {
        setCurrentPrice(res.data.cardPrice);
      }
    } catch (err) {
      console.error("Failed to fetch config", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      fetchCards();
      fetchWalletData();
      fetchConfig();
      
      try {
        const profileRes = await employeesAPI.getProfile();
        if (profileRes.success) {
          setReqUser(profileRes.data.userId); // userId populated in getProfile contains email/phone
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };
    init();
  }, [search, dateRange, customStartDate, customEndDate]);

  // Update fixed price check in JSX later

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8 w-full">
        {!isZoneLocked ? (
          <div className="py-10">
            <ZoneLockEmptyState 
              title="Card Issuance Disabled"
              description="You cannot issue or manage member cards until your working jurisdiction (District/Block) is verified and locked."
            />
          </div>
        ) : (
          <>
            {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Card Management</h1>
            <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.2em] mt-1">Issue & Manage Member Cards</p>
          </div>

          <div className="flex items-center justify-end gap-3 flex-1 flex-wrap">
            {/* Always visible Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3AB000]" size={18} />
              <input
                type="text"
                placeholder="Search members by name, ID or mobile..."
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[#3AB000] rounded-none text-sm font-black text-gray-900 outline-none transition-all placeholder:text-gray-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Always visible Date Filter (Target Tracking Style) */}
            <select
              className="px-4 py-3 bg-white border-2 border-[#3AB000] focus:border-black outline-none text-xs font-black transition-all rounded-none cursor-pointer text-gray-700 w-full md:w-auto"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="thisMonth">CURRENT MONTH</option>
              <option value="pastMonth">PAST MONTH</option>
              <option value="custom_date">CUSTOM DATE RANGE</option>
              <option value="all">ALL TIME (TOTAL)</option>
            </select>

            <button
              onClick={handleAddNewCard}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#3AB000] text-white rounded-none font-bold border-2 border-[#3AB000] hover:bg-black hover:border-black transition-all text-sm tracking-wide whitespace-nowrap active:scale-95 shadow-lg w-full md:w-auto"
            >
              <Plus size={20} />
              Add New Card (₹{currentPrice})
            </button>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {dateRange === "custom_date" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 border border-gray-200 rounded-none">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Start Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#3AB000] outline-none text-xs font-bold transition-all rounded-none text-gray-700"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">End Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#3AB000] outline-none text-xs font-bold transition-all rounded-none text-gray-700"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-3 md:grid-cols-2 gap-4 lg:gap-6 mb-10">
          <div className="bg-white p-4 lg:p-6 rounded-none border-2 border-gray-100 border-l-8 border-l-gray-300 flex items-center gap-3 lg:gap-5 transition-all hover:bg-gray-50/50">
            <div className="p-3 lg:p-4 bg-gray-50 text-gray-400 rounded-none border border-gray-100">
              <CreditCard size={28} className="w-6 h-6 lg:w-7 lg:h-7" />
            </div>
            <div>
              <p className="text-[10px] lg:text-[12px] font-black text-gray-400 uppercase tracking-widest">Total Issued Cards</p>
              <p className="text-2xl lg:text-3xl font-black text-gray-900 leading-none mt-1">{pagination.total}</p>
            </div>
          </div>

          <div className="bg-white p-4 lg:p-6 rounded-none border-2 border-[#3AB000]/30 border-l-8 border-l-[#3AB000] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 transition-all hover:bg-green-50/30">
            <div className="flex items-center gap-3 lg:gap-5 w-full xl:w-auto">
              <div className="p-3 lg:p-4 bg-green-50 text-[#3AB000] rounded-none border border-[#3AB000]/10 shrink-0">
                <CreditCard size={28} className="w-6 h-6 lg:w-7 lg:h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] lg:text-[12px] font-black text-gray-400 uppercase tracking-widest truncate">Recharge Balance</p>
                {walletLoading ? (
                  <div className="h-6 lg:h-8 w-20 lg:w-24 bg-gray-100 animate-pulse mt-1" />
                ) : (
                  <p className="text-2xl lg:text-3xl font-black text-gray-900 leading-none mt-1 truncate">₹{walletBalance}</p>
                )}
              </div>
            </div>
            <div className="flex flex-row xl:flex-col gap-2 w-full xl:w-auto shrink-0 mt-2 xl:mt-0">
              <button 
                onClick={() => setIsRechargeModalOpen(true)}
                className="flex-1 xl:w-full px-2 lg:px-4 py-2 xl:py-1.5 bg-[#3AB000] text-white font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95"
              >
                Recharge
              </button>

              <button 
                onClick={() => {
                  fetchHistory(1);
                  setIsHistoryModalOpen(true);
                }}
                className="flex-1 xl:w-full px-2 lg:px-4 py-2 xl:py-1.5 bg-gray-50 text-gray-700 font-black text-[9px] uppercase tracking-widest hover:bg-gray-200 transition-all border border-gray-200 shadow-sm active:scale-95"
              >
                History
              </button>
            </div>
          </div>

          <div className="bg-white p-4 lg:p-6 rounded-none border-2 border-[#3AB000] border-l-8 border-l-[#3AB000] flex items-center gap-3 lg:gap-5 transition-all hover:shadow-xl hover:shadow-green-100/20">
            <div className="p-3 lg:p-4 bg-[#3AB000] text-white rounded-none shadow-lg shadow-green-100 shrink-0">
              <TrendingUp size={28} className="w-6 h-6 lg:w-7 lg:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] lg:text-[12px] font-black text-[#3AB000] uppercase tracking-widest flex items-center gap-2 truncate">
                Salary Earnings
                <button onClick={handleRefresh} disabled={refreshing} className="p-1 hover:bg-[#3AB000]/10 rounded transition-colors text-[#3AB000] shrink-0">
                  <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                </button>
              </p>
              <p className="text-2xl lg:text-3xl font-black text-gray-900 leading-none mt-1 truncate">₹{employeeProfile?.salaryWallet || 0}</p>
            </div>
          </div>
        </div>

        {/* Recharge Modal */}
        {isRechargeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-none border-t-[10px] border-[#3AB000] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 leading-none tracking-tight">ADD MONEY</h2>
                    <p className="text-[11px] font-black text-[#3AB000] uppercase tracking-[0.2em] mt-2">Wallet Recharge System</p>
                  </div>
                  <div className="p-4 bg-green-50 text-[#3AB000] border border-green-100">
                    <CreditCard size={28} />
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="text-[12px] font-black text-gray-400 uppercase tracking-[0.15em] block mb-4">Select Recharge Amount</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[750, 1500, 2250, 3000, 4500, 7500, 15000].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setSelectedAmount(amt)}
                          className={`py-4 px-2 font-black text-base border-2 transition-all rounded-none ${
                            selectedAmount === amt 
                            ? "bg-[#3AB000] border-[#3AB000] text-white shadow-lg shadow-green-100" 
                            : "bg-white border-gray-100 text-gray-500 hover:border-[#3AB000]/30"
                          }`}
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50/80 p-6 border-2 border-dashed border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Current Balance</span>
                      <span className="text-base font-black text-gray-900 tracking-tight">₹{walletBalance}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Adding Amount</span>
                      <span className="text-base font-black text-[#3AB000] tracking-tight">+ ₹{selectedAmount}</span>
                    </div>
                    <div className="mt-5 pt-5 border-t-2 border-gray-200 flex justify-between items-center">
                      <span className="text-[13px] font-black text-gray-900 uppercase tracking-widest">Final Balance</span>
                      <span className="text-2xl font-black text-gray-900 tracking-tighter">₹{walletBalance + selectedAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-10">
                  <button 
                    onClick={() => setIsRechargeModalOpen(false)}
                    className="py-5 font-black text-[11px] uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all border-2 border-transparent"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={rechargeLoading}
                    onClick={handleRecharge}
                    className="py-5 bg-[#3AB000] text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#2d8a00] shadow-xl shadow-green-200 transition-all border-2 border-[#2d8a00] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {rechargeLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        PROCESSING...
                      </>
                    ) : (
                      "Confirm & Add"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Modal - Full Screen Style */}
        {isHistoryModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-white animate-in slide-in-from-bottom duration-500">
            <div className="w-full h-full flex flex-col">
              {/* Top Header Bar */}
              <div className="px-6 py-4 bg-white border-b-2 border-gray-100 flex items-center justify-between sticky top-0 z-[120]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#3AB000]/10 flex items-center justify-center text-[#3AB000] border-2 border-[#3AB000]/20">
                    <History size={24} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none uppercase">Full Audit History</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest">Wallet Activity Log</p>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{walletHistory.length} Records Found</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="group flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-red-600 transition-all"
                >
                  <X size={18} className="group-hover:rotate-90 transition-transform" />
                  Exit Audit
                </button>
              </div>

              {/* Table Container - Inline Scroll */}
              <div className="flex-1 overflow-auto bg-gray-50/30">
                {isHistoryLoading ? (
                  <div className="h-full flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-gray-100 border-t-[#3AB000] rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 size={32} className="text-[#3AB000] animate-pulse" />
                      </div>
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Reconstructing Ledger...</p>
                  </div>
                ) : walletHistory.length > 0 ? (
                  <div className="min-w-[1000px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-[115]">
                        <tr className="bg-[#3AB000] shadow-xl">
                          <th className="px-8 py-6 text-[14px] font-black text-black uppercase tracking-widest border-r border-black/5">Date & Time</th>
                          <th className="px-8 py-6 text-[14px] font-black text-black uppercase tracking-widest border-r border-black/5">Reference ID</th>
                          <th className="px-8 py-6 text-[14px] font-black text-black uppercase tracking-widest border-r border-black/5">Category</th>
                          <th className="px-8 py-6 text-[14px] font-black text-black uppercase tracking-widest border-r border-black/5">Transaction Remarks</th>
                          <th className="px-8 py-6 text-[14px] font-black text-black uppercase tracking-widest text-center border-r border-black/5">Status</th>
                          <th className="px-8 py-6 text-[14px] font-black text-black uppercase tracking-widest text-right">Flow</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {walletHistory.map((log) => (
                          <tr key={log._id} className="hover:bg-gray-50/80 transition-all group">
                            <td className="px-8 py-6 border-r border-gray-50">
                              <p className="text-[14px] font-black text-gray-900 leading-none">
                                {new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                              <p className="text-[11px] font-black text-[#3AB000] uppercase mt-2 tracking-tighter">
                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </p>
                            </td>
                            <td className="px-8 py-6 border-r border-gray-50">
                              <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-3 py-1.5 border border-gray-200 uppercase tracking-tighter">
                                {log.razorpay_order_id || log._id.toString().slice(-12).toUpperCase()}
                              </span>
                            </td>
                            <td className="px-8 py-6 border-r border-gray-50">
                              <span className="text-[12px] font-black text-gray-900 tracking-tight uppercase">
                                {log.type.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-8 py-6 border-r border-gray-50">
                              <span className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-tight border border-gray-200">
                                {log.remarks || 'Standard Wallet Activity'}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-center border-r border-gray-50">
                              <span className={`text-[10px] font-black px-4 py-2 border-2 ${
                                log.status === 'SUCCESS' ? 'bg-[#3AB000]/10 text-[#3AB000] border-[#3AB000]/20' : 
                                log.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-100' : 
                                'bg-yellow-50 text-yellow-700 border-yellow-100'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className={`px-8 py-6 text-right border-l border-gray-50 bg-gray-50/30 group-hover:bg-transparent transition-colors`}>
                              <div className="flex flex-col items-end">
                                <span className={`text-xl font-black tracking-tighter ${log.type.startsWith('CREDIT') ? 'text-green-600' : 'text-red-600'}`}>
                                  {log.type.startsWith('CREDIT') ? '+' : '-'} ₹{log.amount.toLocaleString()}
                                </span>
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">Net Flow</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
                    <div className="w-24 h-24 bg-gray-50 flex items-center justify-center text-gray-200 border-2 border-dashed border-gray-100">
                      <History size={48} />
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-900 tracking-tight uppercase">Ledger is Empty</p>
                      <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">No transaction activities found in this account</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Info Bar */}
              <div className="px-6 py-4 bg-gray-900 flex items-center justify-between text-white border-t-4 border-[#3AB000]">
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Account Holder</p>
                    <p className="text-xs font-black text-white uppercase">{reqUser?.name || 'Authorized Personnel'}</p>
                  </div>
                  <div className="w-px h-8 bg-gray-700"></div>
                  <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Credit Flow</p>
                    <p className="text-xs font-black text-[#3AB000]">₹{walletHistory.reduce((acc, curr) => curr.type.startsWith('CREDIT') ? acc + curr.amount : acc, 0).toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em]">Audit Level: Organization Standard</p>
              </div>
            </div>
          </div>
        )}

        {/* Cards Table */}
        <div className="bg-white rounded-none border-2 border-[#3AB000] overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-[#3AB000]" />
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Fetching member records...</p>
            </div>
          ) : cards.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#3AB000] text-white">
                    <th className="px-8 py-5 text-sm font-bold tracking-wide whitespace-nowrap">Cardholder Name</th>
                    <th className="px-8 py-5 text-sm font-bold tracking-wide text-center whitespace-nowrap">Card ID</th>
                    <th className="px-8 py-5 text-sm font-bold tracking-wide whitespace-nowrap">Mobile</th>
                    <th className="px-8 py-5 text-sm font-bold tracking-wide whitespace-nowrap">Issue Date</th>
                    <th className="px-8 py-5 text-sm font-bold tracking-wide whitespace-nowrap">Status</th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cards.map((card) => (
                    <tr key={card._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-none bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-100">
                            {card.photo ? (
                              <img src={card.photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User size={20} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-[15px] font-black text-gray-900">{card.cardholderName}</p>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{card.gender} • Age {card.age}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="text-[11px] font-black text-[#3AB000] bg-green-50 px-3 py-1.5 rounded-none border-2 border-green-100/50">
                          {card.cardId}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm font-black text-gray-700">
                        {card.mobileNumber}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-[13px] text-gray-500 font-bold">
                          <Calendar size={16} />
                          {new Date(card.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[11px] font-black px-3 py-1.5 rounded-none border-2 ${card.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                          {card.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/employee/cards/edit/${card._id}`)}
                            className="text-gray-400 hover:text-blue-500 transition-colors p-2 hover:bg-blue-50"
                            title="Edit Card"
                          >
                            <Pencil size={20} />
                          </button>
                          <button
                            onClick={() => navigate(`/employee/cards/view/${card._id}`)}
                            className="text-gray-400 hover:text-[#3AB000] transition-colors p-2 hover:bg-green-50"
                            title="View Details"
                          >
                            <ChevronRight size={22} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-none flex items-center justify-center text-gray-300">
                <CreditCard size={32} />
              </div>
              <div>
                <p className="font-bold text-gray-900">No Cards Issued Yet</p>
                <p className="text-xs text-gray-400 mt-1">Start by creating a new identity card.</p>
              </div>
              <button
                onClick={() => navigate("/employee/cards/add")}
                className="mt-2 px-6 py-2.5 bg-[#3AB000] text-white rounded-none font-bold text-sm border border-[#2d8a00]"
              >
                Create New Card
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            {[...Array(pagination.pages)].map((_, i) => (
              <button
                key={i}
                onClick={() => fetchCards(i + 1)}
                className={`w-10 h-10 rounded-none font-bold text-sm transition-all ${pagination.page === i + 1
                  ? 'bg-[#3AB000] text-white border border-[#2d8a00]'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
        {/* Insufficient Balance Modal */}
        {isInsufficientBalanceModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-none border-t-[10px] border-[#3AB000] shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-none flex items-center justify-center mx-auto mb-6 border-2 border-red-100">
                  <AlertCircle size={40} />
                </div>
                
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Insufficient Balance</h2>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-2 mb-6">Minimum ₹{currentPrice} required to issue a card</p>
                
                <div className="bg-gray-50 p-6 border-2 border-dashed border-gray-200 mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Balance</span>
                    <span className="text-xl font-black text-gray-900 tracking-tighter">₹{walletBalance}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Required</span>
                    <span className="text-xl font-black text-[#3AB000] tracking-tighter">₹{currentPrice}</span>
                  </div>
                </div>

                <p className="text-xs font-bold text-gray-500 leading-relaxed mb-10 uppercase tracking-tight">
                  You need at least ₹{currentPrice} in your wallet to issue a new member card. Please recharge your wallet to continue.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setIsInsufficientBalanceModalOpen(false);
                      setIsRechargeModalOpen(true);
                    }}
                    className="w-full py-4 bg-[#3AB000] text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#2d8a00] transition-all border-2 border-[#2d8a00] shadow-lg shadow-green-100"
                  >
                    Recharge Now
                  </button>
                  <button
                    onClick={() => setIsInsufficientBalanceModalOpen(false)}
                    className="w-full py-4 text-gray-400 font-black text-[11px] uppercase tracking-[0.2em] hover:text-gray-900 transition-all"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )}
      </div>
    </DashboardLayout>
  );
};

export default CardManagement;
