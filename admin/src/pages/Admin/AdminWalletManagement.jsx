import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { walletAPI } from "../../utils/api";
import {
  Search,
  CreditCard,
  User,
  Filter,
  Loader2,
  ChevronRight,
  ArrowUpRight,
  DollarSign,
  PlusCircle,
  X,
  AlertCircle,
  RefreshCcw,
  Zap,
  Users,
  Download
} from "lucide-react";
import { toast } from "react-hot-toast";
import { employeesAPI } from "../../utils/api";
import axios from "axios";

const GREEN = "#3AB000";

const AdminWalletManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [blockFilter, setBlockFilter] = useState("all");
  const [panchayatFilter, setPanchayatFilter] = useState("all");
  const [filterCounts, setFilterCounts] = useState({ states: {}, districts: {}, blocks: {}, panchayats: {} });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isDeductModalOpen, setIsDeductModalOpen] = useState(false);
  const [deductAmount, setDeductAmount] = useState("");
  const [deductRemarks, setDeductRemarks] = useState("");
  const [deductSubmitting, setDeductSubmitting] = useState(false);
  const [deductShowErrors, setDeductShowErrors] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [paymentMethod, setPaymentMethod] = useState("manual"); // 'manual' or 'online'
  const [showErrors, setShowErrors] = useState(false);

  // Global Recharge States
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [globalPost, setGlobalPost] = useState("");
  const [globalAmount, setGlobalAmount] = useState("");
  const [globalRemarks, setGlobalRemarks] = useState("");
  const [globalEmpType, setGlobalEmpType] = useState("All");
  const [postList, setPostList] = useState([]);
  const [postListLoading, setPostListLoading] = useState(false);
  const [globalSubmitting, setGlobalSubmitting] = useState(false);
  const [globalShowErrors, setGlobalShowErrors] = useState(false);

  const loadFilterCounts = async () => {
    try {
      const res = await employeesAPI.getAllFilterCounts({
        role: roleFilter !== "all" ? roleFilter : "",
        state: stateFilter !== "all" ? stateFilter : "",
        district: districtFilter !== "all" ? districtFilter : "",
        block: blockFilter !== "all" ? blockFilter : ""
      });
      if (res.success) {
        setFilterCounts(res.data || { states: {}, districts: {}, blocks: {}, panchayats: {} });
      }
    } catch (err) {
      console.error("Failed to load filter counts:", err);
    }
  };

  useEffect(() => {
    loadFilterCounts();
  }, [roleFilter, stateFilter, districtFilter, blockFilter]);

  const fetchEmployees = async (page = 1) => {
    try {
      setLoading(true);
      const res = await walletAPI.getAdminEmployees({ 
        search, 
        role: roleFilter,
        state: stateFilter,
        district: districtFilter,
        block: blockFilter,
        panchayat: panchayatFilter,
        page, 
        limit: 20 
      });
      if (res.success) {
        setEmployees(res.data);
        if (res.pagination) {
          setPagination({
            page: res.pagination.currentPage,
            pages: res.pagination.pages,
            total: res.pagination.total
          });
        }
      } else {
        toast.error(res.error || "Failed to fetch employees");
      }
    } catch (error) {
      console.error("Fetch Employees Error:", error);
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEmployees();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, roleFilter, stateFilter, districtFilter, blockFilter, panchayatFilter]);

  const handleFilterChange = (field, value) => {
    setPagination(prev => ({ ...prev, page: 1 }));
    if (field === "roleFilter") { setRoleFilter(value); setStateFilter("all"); setDistrictFilter("all"); setBlockFilter("all"); setPanchayatFilter("all"); }
    if (field === "stateFilter") { setStateFilter(value); setDistrictFilter("all"); setBlockFilter("all"); setPanchayatFilter("all"); }
    if (field === "districtFilter") { setDistrictFilter(value); setBlockFilter("all"); setPanchayatFilter("all"); }
    if (field === "blockFilter") { setBlockFilter(value); setPanchayatFilter("all"); }
    if (field === "panchayatFilter") setPanchayatFilter(value);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 12;
      if (prog >= 85) {
        prog = 85;
        clearInterval(interval);
      }
      setExportProgress(Math.round(prog));
    }, 300);

    try {
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;

      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (stateFilter !== "all") params.append("state", stateFilter);
      if (districtFilter !== "all") params.append("district", districtFilter);
      if (blockFilter !== "all") params.append("block", blockFilter);
      if (panchayatFilter !== "all") params.append("panchayat", panchayatFilter);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/wallet/admin/employees/export-csv?${params.toString()}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob' 
        }
      );

      clearInterval(interval);
      setExportProgress(100);

      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Wallet_Balance_Export_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      clearInterval(interval);
      console.error("Export error:", err);
      toast.error("Failed to export wallet data.");
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 600);
    }
  };

  // Load post list from backend when global modal opens
  const openGlobalModal = async () => {
    setGlobalPost("");
    setGlobalAmount("");
    setGlobalRemarks("");
    setGlobalShowErrors(false);
    setIsGlobalModalOpen(true);
    if (postList.length === 0) {
      try {
        setPostListLoading(true);
        const res = await walletAPI.getPostList();
        if (res.success) setPostList(res.data || []);
        else toast.error("Failed to load post list");
      } catch {
        toast.error("Could not fetch post list from server");
      } finally {
        setPostListLoading(false);
      }
    }
  };

  const handleGlobalRecharge = async () => {
    if (!globalPost) { setGlobalShowErrors(true); toast.error("Please select a post"); return; }
    if (!globalAmount || parseFloat(globalAmount) <= 0) { setGlobalShowErrors(true); toast.error("Please enter a valid amount"); return; }
    setGlobalShowErrors(false);

    if (!window.confirm(`Credit ₹${globalAmount} to ALL ${globalPost}s? This cannot be undone.`)) return;

    try {
      setGlobalSubmitting(true);
      const res = await walletAPI.globalRecharge({
        post: globalPost,
        amount: parseFloat(globalAmount),
        remarks: globalRemarks,
        empType: globalEmpType
      });
      if (res.success) {
        toast.success(res.message);
        setIsGlobalModalOpen(false);
        fetchEmployees();
      } else {
        toast.error(res.error || "Global recharge failed");
      }
    } catch {
      toast.error("Server error during global recharge");
    } finally {
      setGlobalSubmitting(false);
    }
  };

  const handleOpenRecharge = (employee) => {
    setSelectedEmployee(employee);
    setRechargeAmount("");
    setRemarks("");
    setPaymentMethod("manual");
    setShowErrors(false);
    setIsRechargeModalOpen(true);
  };

  const handleAdminRecharge = async () => {
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      setShowErrors(true);
      toast.error("Please enter a valid amount");
      return;
    }
    if (paymentMethod === 'manual' && !remarks) {
      setShowErrors(true);
      toast.error("Please enter remarks for this manual transaction");
      return;
    }
    setShowErrors(false);

    // If online, proceed to online recharge flow
    if (paymentMethod === 'online') {
      await handleOnlineRecharge();
      return;
    }

    try {
      setSubmitting(true);
      const res = await walletAPI.adminRecharge({
        employeeId: selectedEmployee._id,
        amount: parseFloat(rechargeAmount),
        remarks: remarks
      });

      if (res.success) {
        toast.success(res.message);
        setIsRechargeModalOpen(false);
        fetchEmployees(); // Refresh list to show updated balance
      } else {
        toast.error(res.error || "Failed to recharge wallet");
      }
    } catch (error) {
      console.error("Admin Recharge Error:", error);
      toast.error("Internal server error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeduct = (employee) => {
    setSelectedEmployee(employee);
    setDeductAmount("");
    setDeductRemarks("");
    setDeductShowErrors(false);
    setIsDeductModalOpen(true);
  };

  const handleAdminDeduct = async () => {
    if (!deductAmount || parseFloat(deductAmount) <= 0) {
      setDeductShowErrors(true);
      toast.error("Please enter a valid amount");
      return;
    }
    if (!deductRemarks) {
      setDeductShowErrors(true);
      toast.error("Please enter remarks for this deduction");
      return;
    }
    setDeductShowErrors(false);

    try {
      setDeductSubmitting(true);
      const res = await walletAPI.adminDeduct({
        employeeId: selectedEmployee._id,
        amount: parseFloat(deductAmount),
        remarks: deductRemarks
      });

      if (res.success) {
        toast.success(res.message);
        setIsDeductModalOpen(false);
        fetchEmployees();
      } else {
        toast.error(res.error || "Failed to deduct from wallet");
      }
    } catch (error) {
      console.error("Admin Deduct Error:", error);
      toast.error("Internal server error");
    } finally {
      setDeductSubmitting(false);
    }
  };

  const handleOnlineRecharge = async () => {
    try {
      setSubmitting(true);
      const orderRes = await walletAPI.createOrder({
        amount: parseFloat(rechargeAmount),
        targetUserId: selectedEmployee.userId
      });

      if (!orderRes.success) {
        toast.error(orderRes.error || "Failed to initiate payment");
        return;
      }

      const { orderId, amount, currency, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "Jan Swasthya Sahayata Abhiyan",
        description: `Wallet Recharge - ${selectedEmployee.name}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            setLoading(true);
            const verifyRes = await walletAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.success) {
              toast.success("Wallet recharged successfully via Razorpay");
              setIsRechargeModalOpen(false);
              fetchEmployees();
            } else {
              toast.error(verifyRes.error || "Payment verification failed");
            }
          } catch (err) {
            toast.error("Error verifying payment");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: selectedEmployee.name,
          contact: selectedEmployee.phone || ""
        },
        theme: {
          color: GREEN
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Online Recharge Error:", error);
      toast.error("Could not process online payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      {isExporting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-[3px]">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5 min-w-[300px] max-w-[380px]">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
              <Download className="w-7 h-7 text-[#3AB000]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-800">Preparing Excel File...</p>
              <p className="text-xs text-gray-400 mt-1">Please wait while we generate your export</p>
            </div>
            <div className="w-full">
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                <span>{exportProgress < 100 ? "Processing..." : "Done!"}</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#3AB000] to-[#7ED321] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center">
              {exportProgress < 40 ? "Fetching wallet data from database..." 
                : exportProgress < 75 ? "Applying filters & building Excel sheet..."
                : exportProgress < 100 ? "Finalizing & compressing file..."
                : "✅ Download starting now!"}
            </p>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          {/* Header & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Wallet Management</h1>
              <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.2em] mt-1">Manual Credit & Balance Audit</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center border border-gray-300 rounded overflow-hidden h-10 w-full sm:w-80 bg-white">
                <input
                  type="text"
                  placeholder="Search by name, phone or email..."
                  className="flex-1 px-4 text-sm outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="bg-[#3AB000] p-2.5 text-white">
                  <Search size={18} />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="h-10 flex items-center gap-2 px-4 bg-black text-white text-[11px] font-black uppercase tracking-wider rounded hover:bg-gray-800 transition-all shadow-sm whitespace-nowrap disabled:opacity-50"
                >
                  {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  Export
                </button>
                <button
                  onClick={() => fetchEmployees(pagination.page)}
                  className="h-10 w-10 flex items-center justify-center bg-gray-50 border border-gray-300 text-gray-400 hover:text-[#3AB000] rounded transition-all"
                >
                  <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                </button>
                {/* Global Recharge Button */}
                <button
                  onClick={openGlobalModal}
                  className="h-10 flex items-center gap-2 px-4 bg-[#3AB000] text-white text-[11px] font-black uppercase tracking-wider rounded hover:bg-[#2d8a00] transition-all shadow-sm whitespace-nowrap"
                >
                  <Zap size={14} />
                  Global Recharge
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
            <select
              className="h-10 px-3 bg-white border border-gray-300 rounded text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
              value={roleFilter}
              onChange={(e) => handleFilterChange("roleFilter", e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="EMPLOYEE">Manual Employee</option>
              <option value="DM">District Manager (DM)</option>
              <option value="BS">Block Supervisor (BS)</option>
              <option value="PE">Panchayat Executive (PE)</option>
            </select>

            <select
              value={stateFilter}
              onChange={(e) => handleFilterChange("stateFilter", e.target.value)}
              className="h-10 px-3 bg-white border border-gray-300 rounded text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
            >
              <option value="all">All States</option>
              {Object.entries(filterCounts.states || {}).map(([state, count]) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>

            <select
              value={districtFilter}
              disabled={stateFilter === "all"}
              onChange={(e) => handleFilterChange("districtFilter", e.target.value)}
              className="h-10 px-3 bg-white border border-gray-300 rounded text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="all">All Districts</option>
              {stateFilter !== "all" && Object.entries(filterCounts.districts || {}).map(([dist, count]) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>

            {(roleFilter === "all" || roleFilter === "BS" || roleFilter === "PE") && (
              <select
                value={blockFilter}
                disabled={districtFilter === "all"}
                onChange={(e) => handleFilterChange("blockFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-300 rounded text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="all">All Blocks</option>
                {districtFilter !== "all" && Object.entries(filterCounts.blocks || {}).map(([block, count]) => (
                  <option key={block} value={block}>{block}</option>
                ))}
              </select>
            )}

            {(roleFilter === "all" || roleFilter === "PE" || roleFilter === "EMPLOYEE") && (
              <select
                value={panchayatFilter}
                disabled={blockFilter === "all"}
                onChange={(e) => handleFilterChange("panchayatFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-300 rounded text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="all">All Panchayats</option>
                {blockFilter !== "all" && Object.entries(filterCounts.panchayats || {}).map(([panch, count]) => (
                  <option key={panch} value={panch}>{panch}</option>
                ))}
              </select>
            )}
          </div>

          {/* Table Container */}
          <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 size={40} className="animate-spin text-[#3AB000]" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Synchronizing Employee Wallets...</p>
              </div>
            )}

            {employees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#3AB000] text-white font-black uppercase text-[10px] tracking-widest">
                      <th className="p-4">Employee Details</th>
                      <th className="p-4 text-center">Role</th>
                      <th className="p-4 text-center">Designation</th>
                      <th className="p-4 text-center">Type</th>
                      <th className="p-4 text-right">Balance</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employees.map((emp) => (
                      <tr key={emp._id} className="hover:bg-[#f0f9eb] transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-[#3AB000]/10 flex items-center justify-center text-[#3AB000] border border-[#3AB000]/20">
                              <User size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-gray-900 leading-none">{emp.name}</p>
                                <span className="text-[9px] font-black text-gray-400 bg-gray-50 px-1.5 py-0.5 border border-gray-100 uppercase">
                                  ID: {emp.userId?.toString().slice(-6).toUpperCase() || 'NEW'}
                                </span>
                              </div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1.5 flex items-center gap-2">
                                {emp.phone || 'No Mobile'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${emp.role === 'DM' ? 'bg-blue-100 text-blue-700' :
                              emp.role === 'BS' ? 'bg-purple-100 text-purple-700' :
                                emp.role === 'PE' ? 'bg-orange-100 text-orange-700' :
                                  'bg-gray-100 text-gray-500'
                            }`}>
                            {emp.role || 'EMP'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded border ${emp.designation === 'General Employee' ? 'text-gray-400 border-gray-100 bg-gray-50' : 'text-[#3AB000] border-[#3AB000]/20 bg-[#3AB000]/5'
                            } uppercase tracking-tighter inline-block max-w-[150px] truncate`}>
                            {emp.designation}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-[10px] font-black px-2 py-1 uppercase tracking-widest border rounded-none ${
                            emp.finalEmpType === 'New' 
                              ? 'bg-green-50 text-[#3AB000] border-[#3AB000]/30' 
                              : emp.finalEmpType === 'Old'
                                ? 'bg-gray-50 text-gray-500 border-gray-200'
                                : 'text-gray-400'
                          }`}>
                            {emp.finalEmpType || '-'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end">
                            <p className="text-sm font-black text-gray-900 tracking-tight">₹{emp.walletBalance?.toLocaleString() || 0}</p>
                            <span className="text-[9px] font-bold text-[#3AB000] uppercase tracking-widest mt-0.5">Available</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenDeduct(emp)}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow-sm font-bold flex items-center justify-center gap-2 transition-colors h-9 uppercase text-[10px] tracking-wider"
                            >
                              <DollarSign size={14} />
                              Deduct
                            </button>
                            <button
                              onClick={() => handleOpenRecharge(emp)}
                              className="bg-[#3AB000] hover:bg-[#2d8a00] text-white px-4 py-2 rounded shadow-sm font-bold flex items-center justify-center gap-2 transition-colors h-9 uppercase text-[10px] tracking-wider"
                            >
                              <PlusCircle size={14} />
                              Recharge
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !loading && (
              <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
                <div className="p-4 bg-gray-50 text-gray-300">
                  <AlertCircle size={40} />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 uppercase">No Employees Found</p>
                  <p className="text-xs text-gray-400 mt-1 uppercase tracking-tighter font-bold">Try adjusting your filters or search terms</p>
                </div>
              </div>
            )}
          </div>

          {/* Pagination UI */}
          {pagination.pages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between mt-8 gap-4 px-2">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Showing {employees.length} of {pagination.total} Personnel
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => fetchEmployees(pagination.page - 1)}
                  className="px-4 py-2 bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Prev
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                    let pageNum = 1;
                    if (pagination.pages <= 5) pageNum = i + 1;
                    else if (pagination.page <= 3) pageNum = i + 1;
                    else if (pagination.page >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
                    else pageNum = pagination.page - 2 + i;

                    if (pageNum > pagination.pages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchEmployees(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center text-[10px] font-bold transition-all border ${pagination.page === pageNum
                            ? "bg-[#3AB000] border-[#3AB000] text-white shadow-lg shadow-[#3AB000]/20 scale-110"
                            : "bg-white border-gray-100 text-gray-400 hover:border-[#3AB000]"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={pagination.page === pagination.pages}
                  onClick={() => fetchEmployees(pagination.page + 1)}
                  className="px-4 py-2 bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Recharge Modal */}
          {isRechargeModalOpen && selectedEmployee && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-t-4 border-[#3AB000]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Wallet Recharge</h2>
                    <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.2em] mt-1">Admin Recharge Portal</p>
                  </div>
                  <button
                    onClick={() => setIsRechargeModalOpen(false)}
                    className="p-1 hover:bg-gray-100 text-gray-400 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Employee Card */}
                  <div className="bg-gray-50 p-4 flex items-center gap-4 border border-gray-100">
                    <div className="w-12 h-12 rounded bg-white flex items-center justify-center text-[#3AB000] shadow-sm border border-gray-100">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 uppercase">{selectedEmployee.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        {selectedEmployee.role} • CURRENT: ₹{selectedEmployee.walletBalance?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Payment Method Toggle */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => setPaymentMethod('manual')}
                      className={`py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-md ${paymentMethod === 'manual' ? 'bg-white text-[#3AB000] shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      Manual Credit
                    </button>
                    <button
                      onClick={() => setPaymentMethod('online')}
                      className={`py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-md ${paymentMethod === 'online' ? 'bg-white text-[#3AB000] shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      Razorpay Online
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recharge Amount (₹)</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3AB000] font-bold">₹</div>
                        <input
                          type="number"
                          placeholder="Enter amount (e.g. 5000)"
                          className={`w-full pl-10 pr-4 py-4 bg-white border-2 text-lg font-black outline-none transition-all placeholder:text-gray-200 ${
                            showErrors && !rechargeAmount ? 'border-red-500 animate-pulse' : 'border-gray-100 focus:border-[#3AB000]'
                          }`}
                          value={rechargeAmount}
                          onChange={(e) => {
                            setRechargeAmount(e.target.value);
                            if (e.target.value) setShowErrors(false);
                          }}
                        />
                      </div>
                      {showErrors && !rechargeAmount && (
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1 ml-1 flex items-center gap-1">
                          <AlertCircle size={10} /> Amount is required to proceed
                        </p>
                      )}
                    </div>

                    {paymentMethod === 'manual' && (
                      <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Remarks</label>
                        <textarea
                          placeholder="Reason for manual credit (e.g. Cash received at office)"
                          className={`w-full px-4 py-3 bg-white border-2 text-sm outline-none transition-all resize-none h-24 placeholder:text-gray-200 ${
                            showErrors && !remarks ? 'border-red-500 animate-pulse' : 'border-gray-100 focus:border-[#3AB000]'
                          }`}
                          value={remarks}
                          onChange={(e) => {
                            setRemarks(e.target.value);
                            if (e.target.value) setShowErrors(false);
                          }}
                        />
                        {showErrors && !remarks && (
                          <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1 ml-1 flex items-center gap-1">
                            <AlertCircle size={10} /> Remarks are required for manual credit
                          </p>
                        )}
                      </div>
                    )}

                    {paymentMethod === 'online' && (
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg animate-in slide-in-from-top-2 duration-200">
                        <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase tracking-tight">
                          <span className="block font-black mb-1">ONLINE PAYMENT MODE</span>
                          You will be redirected to Razorpay checkout. The amount will be credited to the employee's wallet after successful payment.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <button
                      onClick={() => setIsRechargeModalOpen(false)}
                      className="flex-1 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={submitting}
                      onClick={handleAdminRecharge}
                      className="flex-[2] py-4 bg-[#3AB000] text-white font-black text-[11px] uppercase tracking-widest hover:bg-[#2d8a00] transition-all border-2 border-[#2d8a00] flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#3AB000]/20"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          PROCESSING...
                        </>
                      ) : (
                        <>
                          {paymentMethod === 'online' ? <CreditCard size={16} /> : <ArrowUpRight size={16} />}
                          {paymentMethod === 'online' ? 'PAY VIA RAZORPAY' : 'CONFIRM CREDIT'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deduct Modal */}
          {isDeductModalOpen && selectedEmployee && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-t-4 border-red-500">
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Wallet Deduction</h2>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mt-1">Admin Deduct Portal</p>
                  </div>
                  <button
                    onClick={() => setIsDeductModalOpen(false)}
                    className="p-1 hover:bg-gray-100 text-gray-400 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Employee Card */}
                  <div className="bg-gray-50 p-4 flex items-center gap-4 border border-gray-100">
                    <div className="w-12 h-12 rounded bg-white flex items-center justify-center text-red-500 shadow-sm border border-gray-100">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 uppercase">{selectedEmployee.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        {selectedEmployee.role} • CURRENT: ₹{selectedEmployee.walletBalance?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deduct Amount (₹)</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 font-bold">₹</div>
                        <input
                          type="number"
                          placeholder="Enter amount (e.g. 1000)"
                          className={`w-full pl-10 pr-4 py-4 bg-white border-2 text-lg font-black outline-none transition-all placeholder:text-gray-200 ${
                            deductShowErrors && !deductAmount ? 'border-red-500 animate-pulse' : 'border-gray-100 focus:border-red-500'
                          }`}
                          value={deductAmount}
                          onChange={(e) => {
                            setDeductAmount(e.target.value);
                            if (e.target.value) setDeductShowErrors(false);
                          }}
                        />
                      </div>
                      {deductShowErrors && !deductAmount && (
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1 ml-1 flex items-center gap-1">
                          <AlertCircle size={10} /> Amount is required to proceed
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Remarks</label>
                      <textarea
                        placeholder="Reason for deduction (e.g. Penalty, reversal)"
                        className={`w-full px-4 py-3 bg-white border-2 text-sm outline-none transition-all resize-none h-24 placeholder:text-gray-200 ${
                          deductShowErrors && !deductRemarks ? 'border-red-500 animate-pulse' : 'border-gray-100 focus:border-red-500'
                        }`}
                        value={deductRemarks}
                        onChange={(e) => {
                          setDeductRemarks(e.target.value);
                          if (e.target.value) setDeductShowErrors(false);
                        }}
                      />
                      {deductShowErrors && !deductRemarks && (
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1 ml-1 flex items-center gap-1">
                          <AlertCircle size={10} /> Remarks are required for deduction
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <button
                      onClick={() => setIsDeductModalOpen(false)}
                      className="flex-1 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={deductSubmitting}
                      onClick={handleAdminDeduct}
                      className="flex-[2] py-4 bg-red-500 text-white font-black text-[11px] uppercase tracking-widest hover:bg-red-600 transition-all border-2 border-red-600 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-500/20"
                    >
                      {deductSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          PROCESSING...
                        </>
                      ) : (
                        <>
                          <DollarSign size={16} />
                          CONFIRM DEDUCT
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ⚡ Global Recharge Modal */}
          {isGlobalModalOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-t-4 border-amber-500">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <Zap size={16} className="text-amber-600" />
                      </div>
                      <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Global Recharge</h2>
                    </div>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mt-1.5">Bulk Credit — All Employees of Selected Post</p>
                  </div>
                  <button onClick={() => setIsGlobalModalOpen(false)} className="p-1 hover:bg-gray-100 text-gray-400 transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {/* Warning Banner */}
                  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                      This will credit the amount to <strong>ALL active employees</strong> of the selected post simultaneously. Each employee will receive an individual transaction record.
                    </p>
                  </div>

                  {/* Post Dropdown — from backend */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Users size={11} /> Select Post / Designation
                    </label>
                    {postListLoading ? (
                      <div className="flex items-center gap-2 py-3 px-4 border-2 border-gray-100 rounded">
                        <Loader2 size={14} className="animate-spin text-[#3AB000]" />
                        <span className="text-xs text-gray-400 font-bold">Loading posts from server...</span>
                      </div>
                    ) : (
                      <select
                        value={globalPost}
                        onChange={(e) => { setGlobalPost(e.target.value); setGlobalShowErrors(false); }}
                        className={`w-full px-4 py-3 bg-white border-2 text-sm font-bold text-gray-700 outline-none transition-all rounded ${
                          globalShowErrors && !globalPost ? 'border-red-400 animate-pulse' : 'border-gray-100 focus:border-amber-400'
                        }`}
                      >
                        <option value="">— Select Post —</option>
                        {postList.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    )}
                    {globalShowErrors && !globalPost && (
                      <p className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                        <AlertCircle size={10} /> Post selection is required
                      </p>
                    )}
                  </div>

                  {/* Employee Type Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Users size={11} /> Select Employee Type
                    </label>
                    <select
                      value={globalEmpType}
                      onChange={(e) => setGlobalEmpType(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-100 text-sm font-bold text-gray-700 outline-none transition-all rounded focus:border-amber-400"
                    >
                      <option value="All">All Types</option>
                      <option value="New">NEW Employees</option>
                      <option value="Old">OLD Employees</option>
                    </select>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Credit Amount per Employee (₹)</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 font-bold text-lg">₹</div>
                      <input
                        type="number"
                        placeholder="e.g. 500"
                        className={`w-full pl-10 pr-4 py-4 bg-white border-2 text-lg font-black outline-none transition-all placeholder:text-gray-200 rounded ${
                          globalShowErrors && !globalAmount ? 'border-red-400 animate-pulse' : 'border-gray-100 focus:border-amber-400'
                        }`}
                        value={globalAmount}
                        onChange={(e) => { setGlobalAmount(e.target.value); if (e.target.value) setGlobalShowErrors(false); }}
                      />
                    </div>
                    {globalShowErrors && !globalAmount && (
                      <p className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                        <AlertCircle size={10} /> Amount is required
                      </p>
                    )}
                  </div>

                  {/* Remarks (Optional) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Remarks (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Monthly performance bonus"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-100 focus:border-amber-400 text-sm outline-none transition-all rounded"
                      value={globalRemarks}
                      onChange={(e) => setGlobalRemarks(e.target.value)}
                    />
                  </div>

                  {/* Preview Banner */}
                  {globalPost && globalAmount && parseFloat(globalAmount) > 0 && (
                    <div className="p-3 bg-[#3AB000]/5 border border-[#3AB000]/20 rounded-lg animate-in slide-in-from-top-2 duration-200">
                      <p className="text-[11px] font-black text-[#3AB000] uppercase tracking-tight">
                        ✅ Will credit ₹{parseFloat(globalAmount).toLocaleString()} to all active <span className="underline">{globalPost}</span>s
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-bold">Transaction will appear in each employee's wallet history.</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setIsGlobalModalOpen(false)}
                      className="py-3.5 text-[11px] font-black text-gray-500 uppercase tracking-widest border-2 border-gray-200 hover:border-gray-400 hover:text-gray-700 transition-all rounded"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={globalSubmitting || postListLoading}
                      onClick={handleGlobalRecharge}
                      className="py-3.5 bg-amber-500 text-white font-black text-[11px] uppercase tracking-widest hover:bg-amber-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-amber-500/30 rounded"
                    >
                      {globalSubmitting ? (
                        <><Loader2 size={15} className="animate-spin" /> Processing...</>
                      ) : (
                        <><Zap size={15} /> Confirm Recharge</>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminWalletManagement;
