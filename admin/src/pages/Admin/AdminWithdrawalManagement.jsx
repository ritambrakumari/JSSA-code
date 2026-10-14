import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Search,
  Filter,
  Landmark,
  RefreshCw,
  AlertCircle,
  History,
  TrendingUp,
  X,
  ToggleLeft,
  ToggleRight,
  FileText,
  Wallet
} from "lucide-react";
import { apiRequest, employeesAPI, systemConfigAPI, settingsAPI } from "../../utils/api";
import { toast } from "react-hot-toast";
import statesData from "../../data/states.json";

const GREEN = "#3AB000";
const GREEN_DARK = "#2d8a00";
const GREEN_LIGHT = "#e8f5e2";

const ExpandableRemark = ({ text, isRightAligned = false, colorClass = "text-gray-600" }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  const isLongText = text.length > 40;

  if (!isLongText) {
    return <span className={`text-[9px] font-black uppercase ${colorClass} block max-w-[200px] mt-1.5 ${isRightAligned ? 'ml-auto text-right' : 'text-left'}`}>R: {text}</span>;
  }

  return (
    <div className={`max-w-[200px] mt-1.5 flex flex-col ${isRightAligned ? 'ml-auto items-end text-right' : 'items-start text-left'}`}>
      <span className={`text-[9px] font-black uppercase ${colorClass} ${!expanded ? 'line-clamp-2' : ''} leading-snug`}>
        R: {text}
      </span>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[9px] text-blue-500 hover:text-blue-700 font-black mt-1 uppercase tracking-widest transition-colors"
      >
        {expanded ? 'Show Less' : 'Read More'}
      </button>
    </div>
  );
};

const AdminWithdrawalManagement = () => {
  const [groupedEmployees, setGroupedEmployees] = useState([]);
  const [globalStats, setGlobalStats] = useState({ totalAmount: 0, pendingCount: 0, successCount: 0, rejectedCount: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filterCounts, setFilterCounts] = useState({ states: {}, districts: {}, blocks: {}, panchayats: {} });
  const [isWithdrawalEnabled, setIsWithdrawalEnabled] = useState(true);
  const [isShowSalaryBreakdownEnabled, setIsShowSalaryBreakdownEnabled] = useState(true);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [requestTypeFilter, setRequestTypeFilter] = useState("Employee");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [blockFilter, setBlockFilter] = useState("all");
  const [panchayatFilter, setPanchayatFilter] = useState("all");
  const [expandedEmployeeId, setExpandedEmployeeId] = useState(null);
  const [modalRequests, setModalRequests] = useState([]);
  const [modalPagination, setModalPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [modalLoading, setModalLoading] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Pay Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payBaseAmount, setPayBaseAmount] = useState("");
  const [payOtherExpenses, setPayOtherExpenses] = useState("");
  const [payRemark, setPayRemark] = useState("");
  const [payMethod, setPayMethod] = useState("manual");

  // Transaction Modal State
  const [showTxModal, setShowTxModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    loadFilterCounts();
  }, [roleFilter, stateFilter, districtFilter, blockFilter]);

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

  const fetchSystemConfig = async () => {
    try {
      const [sysRes, setRes] = await Promise.all([
        systemConfigAPI.getCurrent(),
        settingsAPI.get()
      ]);

      if (sysRes.success && sysRes.data) {
        setIsWithdrawalEnabled(sysRes.data.isWithdrawalEnabled !== false);
      }
      if (setRes.success && setRes.data && setRes.data.settings) {
        setIsShowSalaryBreakdownEnabled(setRes.data.settings.showSalaryBreakdown !== false);
      }
    } catch (err) {
      console.error("Failed to fetch config/settings:", err);
    }
  };

  useEffect(() => {
    fetchSystemConfig();
  }, []);

  const fetchRequests = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 20 });
      if (searchTerm) params.append("search", searchTerm);
      if (filter !== "all") params.append("status", filter);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (stateFilter !== "all") params.append("state", stateFilter);
      if (districtFilter !== "all") params.append("district", districtFilter);
      if (blockFilter !== "all") params.append("block", blockFilter);
      if (panchayatFilter !== "all") params.append("panchayat", panchayatFilter);
      params.append("requestType", requestTypeFilter);

      const res = await apiRequest(`/withdrawals/admin/all?${params.toString()}`, { method: "GET" });
      if (res.success) {
        setGroupedEmployees(res.data);
        if (res.stats) setGlobalStats(res.stats);
        if (res.pagination) {
          setPagination({
            page: res.pagination.page,
            pages: res.pagination.pages,
            total: res.pagination.total
          });
        }
      }
    } catch (error) {
      toast.error("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRequests(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filter, roleFilter, stateFilter, districtFilter, blockFilter, panchayatFilter, requestTypeFilter]);

  const fetchModalRequests = async (employeeId, page = 1) => {
    try {
      setModalLoading(true);
      const res = await apiRequest(`/withdrawals/admin/employee-requests/${employeeId}?page=${page}&limit=5`);
      if (res.success) {
        setModalRequests(res.data);
        if (res.pagination) {
          setModalPagination({
            page: res.pagination.page,
            pages: res.pagination.pages,
            total: res.pagination.total
          });
        }
      }
    } catch (error) {
      toast.error("Failed to fetch employee requests");
    } finally {
      setModalLoading(false);
    }
  };


  const openPayModal = (req) => {
    setSelectedReq(req);
    setPayBaseAmount(req.amount || 0);
    setPayOtherExpenses(0);
    setPayRemark("");
    setPayMethod("manual");
    setShowPayModal(true);
  };

  const processPayment = async () => {
    if (!payBaseAmount || payBaseAmount <= 0) {
      toast.error("Base amount must be greater than 0");
      return;
    }

    try {
      setProcessingId(selectedReq._id);
      const res = await apiRequest(`/withdrawals/admin/approve/${selectedReq._id}`, {
        method: "POST",
        body: JSON.stringify({
          baseAmount: Number(payBaseAmount),
          otherExpenses: Number(payOtherExpenses || 0),
          remark: payRemark,
          paymentMethod: payMethod
        })
      });

      if (res.success) {
        toast.success(res.message || "Withdrawal processed successfully!");
        setShowPayModal(false);
        fetchRequests(pagination.page);
        if (expandedEmployeeId) {
          fetchModalRequests(expandedEmployeeId, modalPagination.page);
        }
      } else {
        toast.error(res.error || "Payment processing failed");
      }
    } catch (error) {
      let errStr = error.message || "Payment processing failed";
      try {
        const parsed = JSON.parse(errStr);
        if (parsed.message) errStr = parsed.message;
        else if (parsed.description) errStr = parsed.description;
      } catch (e) {
        // Not a JSON string, use as is
      }
      toast.error(errStr);
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (req) => {
    setSelectedReq(req);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      setProcessingId(selectedReq._id);
      const res = await apiRequest(`/withdrawals/admin/reject/${selectedReq._id}`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectionReason })
      });
      if (res.success) {
        toast.success("Withdrawal rejected");
        setShowRejectModal(false);
        fetchRequests(pagination.page);
        if (expandedEmployeeId) {
          fetchModalRequests(expandedEmployeeId, modalPagination.page);
        }
      } else {
        toast.error(res.error || "Rejection failed");
      }
    } catch (error) {
      toast.error(error.message || "Rejection failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevert = async (reqId) => {
    if (!window.confirm("Are you sure you want to revert this payment? This will mark it as refunded and return the amount to the user's wallet.")) return;
    try {
      setProcessingId(reqId);
      const res = await apiRequest(`/withdrawals/admin/revert/${reqId}`, {
        method: "POST"
      });
      if (res.success) {
        toast.success("Payment reverted and wallet refunded");
        fetchRequests(pagination.page);
        if (expandedEmployeeId) {
          fetchModalRequests(expandedEmployeeId, modalPagination.page);
        }
      } else {
        toast.error(res.error || "Revert failed");
      }
    } catch (error) {
      toast.error(error.message || "Revert failed");
    } finally {
      setProcessingId(null);
    }
  };

  const stats = {
    totalAmount: globalStats.totalAmount || 0,
    pending: globalStats.pendingCount || 0,
    success: globalStats.successCount || 0,
    rejected: globalStats.rejectedCount || 0
  };

  const handleToggleWithdrawal = async () => {
    try {
      const newValue = !isWithdrawalEnabled;
      const res = await systemConfigAPI.update({ isWithdrawalEnabled: newValue });
      if (res.success) {
        setIsWithdrawalEnabled(newValue);
        toast.success(`Withdrawals globally ${newValue ? 'enabled' : 'disabled'}`);
      }
    } catch (err) {
      toast.error("Failed to update global withdrawal setting");
    }
  };

  const handleToggleSalaryBreakdown = async () => {
    try {
      const newValue = !isShowSalaryBreakdownEnabled;
      const res = await settingsAPI.update({ showSalaryBreakdown: newValue });
      if (res.success) {
        setIsShowSalaryBreakdownEnabled(newValue);
        toast.success(`Salary Breakdown ${newValue ? 'visible' : 'hidden'} for employees`);
      }
    } catch (err) {
      toast.error("Failed to update salary breakdown setting");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-0 ml-0 md:ml-6 px-2 md:px-0 mt-4 space-y-4 h-full max-w-[99rem]">
        
        {/* Request Type Tabs */}
        <div className="flex border-b border-gray-200 mr-4">
          <button
            onClick={() => setRequestTypeFilter("Employee")}
            className={`py-3 px-6 text-[11px] font-black uppercase tracking-widest transition-colors ${
              requestTypeFilter === "Employee"
                ? "border-b-4 border-[#3AB000] text-[#3AB000] bg-green-50/50"
                : "border-b-4 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Employee Requests
          </button>
          <button
            onClick={() => setRequestTypeFilter("Staff")}
            className={`py-3 px-6 text-[11px] font-black uppercase tracking-widest transition-colors ${
              requestTypeFilter === "Staff"
                ? "border-b-4 border-[#3AB000] text-[#3AB000] bg-green-50/50"
                : "border-b-4 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Staff Requests
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mr-4">
          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Payouts</span>
              <span className="text-2xl font-black text-gray-800 leading-none">₹{stats.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 bg-gray-100 text-gray-500 rounded-full">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending Requests</span>
              <span className="text-2xl font-black text-amber-500 leading-none">{stats.pending}</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-500 rounded-full">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Successful</span>
              <span className="text-2xl font-black text-[#3AB000] leading-none">{stats.success}</span>
            </div>
            <div className="p-3 bg-green-50 text-[#3AB000] rounded-full">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rejected/Failed</span>
              <span className="text-2xl font-black text-red-500 leading-none">{stats.rejected}</span>
            </div>
            <div className="p-3 bg-red-50 text-red-500 rounded-full">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 border border-gray-200 rounded-none shadow-sm space-y-4 mr-4 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
              <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase">
                <Landmark className="w-6 h-6 text-[#3AB000]" />
                Withdrawal Management
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleWithdrawal}
                className={`flex items-center gap-2 px-4 py-2 font-bold uppercase tracking-widest text-xs transition-colors shadow-sm ${isWithdrawalEnabled
                  ? "bg-green-50 text-[#3AB000] border border-green-200 hover:bg-green-100"
                  : "bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
                  }`}
              >
                {isWithdrawalEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                {isWithdrawalEnabled ? "Withdrawals Enabled" : "Withdrawals Disabled"}
              </button>

              <button
                onClick={handleToggleSalaryBreakdown}
                className={`flex items-center gap-2 px-4 py-2 font-bold uppercase tracking-widest text-xs transition-colors shadow-sm ${isShowSalaryBreakdownEnabled
                  ? "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                  : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
                  }`}
                title="Show or hide the detailed earnings breakdown and note in the Employee Salary page"
              >
                {isShowSalaryBreakdownEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                {isShowSalaryBreakdownEnabled ? "Salary Breakdown Visible" : "Salary Breakdown Hidden"}
              </button>

              <button
                onClick={() => fetchRequests(pagination.page)}
                className="bg-black hover:bg-gray-800 text-white text-xs px-4 py-2 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide h-[38px]"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter size={14} className="text-[#3AB000]" />
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Global Filters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
              {/* Search */}
              <div className="flex items-center border border-gray-200 rounded-none overflow-hidden h-10 bg-white focus-within:border-[#3AB000] xl:col-span-2">
                <input
                  type="text"
                  placeholder="Search Employee Name, ID or Amount..."
                  className="flex-1 px-3 text-xs font-bold outline-none text-gray-800"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="bg-[#3AB000] h-full flex items-center px-3 text-white">
                  <Search size={14} />
                </div>
              </div>

              {/* Role Filter */}
              <select
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setStateFilter("all"); setDistrictFilter("all"); setBlockFilter("all"); setPanchayatFilter("all"); }}
              >
                <option value="all">All Roles</option>
                <option value="RM">Regional Manager (RM)</option>
                <option value="ZC">Zonal Coordinator (ZC)</option>
                <option value="EMPLOYEE">Manual Employee</option>
                <option value="DM">District Manager (DM)</option>
                <option value="BS">Block Supervisor (BS)</option>
                <option value="PE">Panchayat Executive (PE)</option>
              </select>

              {/* State Filter */}
              <select
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
                value={stateFilter}
                onChange={(e) => { setStateFilter(e.target.value); setDistrictFilter("all"); setBlockFilter("all"); setPanchayatFilter("all"); }}
              >
                <option value="all">All States</option>
                {statesData.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* District Filter */}
              <select
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
                value={districtFilter}
                onChange={(e) => { setDistrictFilter(e.target.value); setBlockFilter("all"); setPanchayatFilter("all"); }}
                disabled={stateFilter === "all"}
              >
                <option value="all">All Districts</option>
                {stateFilter !== "all" && Object.keys(filterCounts.districts || {}).map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Block Filter */}
              {(roleFilter === "all" || roleFilter === "BS" || roleFilter === "PE" || roleFilter === "EMPLOYEE") && (
                <select
                  className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
                  value={blockFilter}
                  onChange={(e) => { setBlockFilter(e.target.value); setPanchayatFilter("all"); }}
                  disabled={districtFilter === "all"}
                >
                  <option value="all">All Blocks</option>
                  {districtFilter !== "all" && Object.keys(filterCounts.blocks || {}).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              )}

              {/* Panchayat Filter */}
              {(roleFilter === "all" || roleFilter === "PE" || roleFilter === "EMPLOYEE") && (
                <select
                  className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
                  value={panchayatFilter}
                  onChange={(e) => setPanchayatFilter(e.target.value)}
                  disabled={blockFilter === "all"}
                >
                  <option value="all">All Panchayats</option>
                  {blockFilter !== "all" && Object.keys(filterCounts.panchayats || {}).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              )}

              {/* Status Filter */}
              <select
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Status: Pending</option>
                <option value="success">Status: Paid</option>
                <option value="rejected">Status: Rejected/Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-none overflow-hidden border border-gray-200 shadow-sm mr-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-[#3AB000]">
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Employee Info</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Location</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Pending Amount</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Paid Amount</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="5" className="px-6 py-8"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                    </tr>
                  ))
                ) : groupedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <AlertCircle size={48} className="text-gray-200 mx-auto mb-4" />
                      <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No withdrawal requests found</p>
                    </td>
                  </tr>
                ) : (
                  groupedEmployees.map((group) => (
                    <React.Fragment key={group.employee?._id || "unknown"}>
                      <tr className={`hover:bg-[#e8f5e2] transition-colors border-b border-gray-100 ${expandedEmployeeId === group.employee?._id ? "bg-green-50" : ""}`}>
                        {/* Employee Info */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#0A3D00] text-white flex items-center justify-center font-black text-sm rounded-none">
                              {group.employee?.name?.[0].toUpperCase() || "E"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-[14px] font-black text-gray-900 tracking-tight leading-none uppercase">
                                  {group.employee?.name || "Unknown"}
                                </p>
                                {group.employee?.role && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-widest rounded-sm border border-blue-200">
                                    {group.employee.role}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-bold text-gray-400 tracking-tighter uppercase">ID: {group.employee?._id?.slice(-8) || "N/A"}</p>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-6 py-5 max-w-[250px]">
                          <div className="space-y-1">
                            <p className="text-[13px] font-black text-gray-800 uppercase leading-tight line-clamp-2" title={group.employee?.workingDistrict || "N/A"}>
                              {group.employee?.workingDistrict || "N/A"}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate" title={group.employee?.workingState || "N/A"}>
                              {group.employee?.workingState || "N/A"}
                            </p>
                          </div>
                        </td>

                        {/* Pending Amount */}
                        <td className="px-6 py-5">
                          <span className="text-lg font-black text-amber-500">₹{group.totalPending.toLocaleString('en-IN')}</span>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{group.requests.filter(r => r.status === 'pending').length} Pending Req</p>
                        </td>

                        {/* Paid Amount */}
                        <td className="px-6 py-5">
                          <span className="text-lg font-black text-[#3AB000]">₹{group.totalPaid.toLocaleString('en-IN')}</span>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{group.requests.filter(r => r.status === 'success').length} Paid Req</p>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => {
                              setExpandedEmployeeId(group.employee?._id);
                              fetchModalRequests(group.employee?._id, 1);
                            }}
                            className="bg-black hover:bg-[#3AB000] text-white text-[10px] font-black px-4 py-2.5 uppercase tracking-widest transition-all rounded-none whitespace-nowrap"
                          >
                            View Details ({group.totalRequests})
                          </button>
                        </td>
                      </tr>

                      {/* Inline Expanded Table Removed - Now using Full Screen Modal */}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination UI */}
        {groupedEmployees.length > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4 mr-4 bg-white p-4 border border-gray-200 shadow-sm">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Showing {groupedEmployees.length} of {pagination.total} Employees
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => fetchRequests(pagination.page - 1)}
                className="px-4 py-2 bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] hover:text-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
                      onClick={() => fetchRequests(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center text-[10px] font-bold transition-all border ${pagination.page === pageNum
                        ? "bg-[#3AB000] border-[#3AB000] text-white shadow-sm scale-110"
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
                onClick={() => fetchRequests(pagination.page + 1)}
                className="px-4 py-2 bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] hover:text-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {expandedEmployeeId && (() => {
        const group = groupedEmployees.find(g => g.employee?._id === expandedEmployeeId);
        if (!group) return null;
        return (
          <div className="fixed inset-0 z-[9900] flex bg-white animate-in fade-in duration-200">
            <div className="bg-white w-full h-full flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-10 py-6 bg-[#3AB000] border-b-4 border-black">
                <div className="flex flex-col">
                  <h2 className="text-white font-black text-2xl flex items-center gap-3 uppercase tracking-wide">
                    <History className="w-8 h-8 text-white" /> Transaction History
                  </h2>
                  <p className="text-xs font-bold text-white/80 uppercase tracking-widest mt-2">
                    {group.employee?.name || "Unknown Employee"} <span className="mx-2 text-white/40">|</span> {group.totalRequests} Requests
                  </p>
                </div>
                <button
                  onClick={() => setExpandedEmployeeId(null)}
                  className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black hover:text-white transition-colors text-white rounded-none border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>



              {/* Employee Metrics */}
              {(() => {
                const pendingReqsCount = group.requests.filter(r => r.status === 'pending').length;
                const approvedReqsCount = group.requests.filter(r => r.status === 'success').length;
                const totalPendingAmount = group.requests.reduce((acc, req) => acc + (req.status === 'pending' ? req.amount : 0), 0);
                const totalPaidAmount = group.requests.reduce((acc, req) => acc + (req.status === 'success' ? req.amount + (req.otherExpenses || 0) : 0), 0);
                const rejectedReqsCount = group.requests.filter(r => r.status === 'rejected' || r.status === 'failed').length;

                return (
                  <div className="bg-gray-50/50 border-b border-gray-200 px-6 py-5 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 shrink-0">
                     <div className="bg-white p-4 rounded-none shadow-sm border border-gray-300 flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="w-10 h-10 rounded-none bg-gray-50 flex shrink-0 items-center justify-center border border-gray-200">
                           <FileText className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Req</p>
                           <p className="text-xl font-black text-gray-900 leading-none mt-1">{group.totalRequests}</p>
                        </div>
                     </div>
                     <div className="bg-white p-4 rounded-none shadow-sm border border-amber-400 flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="w-10 h-10 rounded-none bg-amber-50 flex shrink-0 items-center justify-center border border-amber-200">
                           <Clock className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Req</p>
                           <p className="text-xl font-black text-amber-600 leading-none mt-1">{pendingReqsCount}</p>
                        </div>
                     </div>
                     <div className="bg-white p-4 rounded-none shadow-sm border border-[#3AB000] flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="w-10 h-10 rounded-none bg-green-50 flex shrink-0 items-center justify-center border border-green-200">
                           <CheckCircle2 className="w-5 h-5 text-[#3AB000]" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Approved Req</p>
                           <p className="text-xl font-black text-[#3AB000] leading-none mt-1">{approvedReqsCount}</p>
                        </div>
                     </div>
                     <div className="bg-white p-4 rounded-none shadow-sm border border-gray-400 flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="w-10 h-10 rounded-none bg-gray-50 flex shrink-0 items-center justify-center border border-gray-200">
                           <XCircle className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rejected Req</p>
                           <p className="text-xl font-black text-gray-600 leading-none mt-1">{rejectedReqsCount}</p>
                        </div>
                     </div>
                     <div className="bg-white p-4 rounded-none shadow-sm border border-red-400 flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="w-10 h-10 rounded-none bg-red-50 flex shrink-0 items-center justify-center border border-red-200">
                           <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Amt</p>
                           <p className="text-xl font-black text-red-500 leading-none mt-1">₹{totalPendingAmount.toLocaleString('en-IN')}</p>
                        </div>
                     </div>
                     <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-none shadow-sm border border-blue-400 flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="w-10 h-10 rounded-none bg-blue-100 flex shrink-0 items-center justify-center border border-blue-200">
                           <Landmark className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Total Payout</p>
                           <p className="text-xl font-black text-blue-600 leading-none mt-1">₹{totalPaidAmount.toLocaleString('en-IN')}</p>
                        </div>
                     </div>
                  </div>
                );
              })()}

              {/* Body */}
              <div className="px-10 py-6 overflow-y-auto bg-gray-50 flex-1">
                <table className="w-full text-left bg-white border border-gray-200 shadow-sm">
                  <thead className="sticky top-0 bg-[#3AB000] border-b border-black z-10 shadow-sm">
                    <tr>
                      <th className="px-8 py-5 font-black text-white text-xs uppercase tracking-widest">Date & Time</th>
                      <th className="px-8 py-5 font-black text-white text-xs uppercase tracking-widest">Bank Account</th>
                      <th className="px-8 py-5 font-black text-white text-xs uppercase tracking-widest">Amount</th>
                      <th className="px-8 py-5 font-black text-white text-xs uppercase tracking-widest">Extra Exp.</th>
                      <th className="px-8 py-5 font-black text-white text-xs uppercase tracking-widest text-center">Payment Mode</th>
                      <th className="px-8 py-5 font-black text-white text-xs uppercase tracking-widest text-center">Status</th>
                      <th className="px-8 py-5 font-black text-white text-xs uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {modalLoading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-10 text-center text-gray-500 font-bold uppercase tracking-widest">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#3AB000]" />
                          Loading Requests...
                        </td>
                      </tr>
                    ) : modalRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-green-50/30 transition-colors">
                        <td className="px-6 py-5">
                          <p className="text-[13px] font-black text-gray-800">
                            {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {new Date(req.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-[13px] font-black text-gray-800 uppercase leading-none">{req.bankDetails.bankName}</p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">
                            ACC: {req.bankDetails.accountNumber} <span className="text-gray-300 mx-1">|</span> IFSC: {req.bankDetails.ifscCode}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-lg font-black text-gray-900">₹{req.amount.toLocaleString('en-IN')}</span>
                        </td>
                        <td className="px-6 py-5">
                          {req.otherExpenses ? (
                            <span className="text-[13px] font-black text-amber-600 bg-amber-50 px-2 py-1 border border-amber-100">+₹{req.otherExpenses.toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-sm font-bold text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-center">
                          {req.status === 'success' && req.paymentMethod === 'razorpay' ? (
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 border border-blue-100 uppercase tracking-widest">RazorpayX</span>
                          ) : req.status === 'success' && req.paymentMethod === 'manual' ? (
                            <span className="text-[10px] font-black text-gray-600 bg-gray-50 px-2 py-1 border border-gray-200 uppercase tracking-widest">Manual</span>
                          ) : (
                            <span className="text-sm font-bold text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-center">
                          {req.status === 'pending' && <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest bg-amber-50 px-3 py-1 border border-amber-100">Pending</span>}
                          {req.status === 'success' && <span className="text-[#3AB000] text-[10px] font-black uppercase tracking-widest bg-green-50 px-3 py-1 border border-green-100">Processed</span>}
                          {req.status === 'rejected' && <span className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-50 px-3 py-1 border border-red-100">Rejected</span>}
                          {req.status === 'refunded' && <span className="text-purple-600 text-[10px] font-black uppercase tracking-widest bg-purple-50 px-3 py-1 border border-purple-200">Refunded</span>}
                          {req.status === 'failed' && <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest bg-gray-100 px-3 py-1 border border-gray-200">Failed</span>}
                        </td>
                        <td className="px-6 py-5 text-right">
                          {req.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openPayModal(req)}
                                disabled={processingId === req._id}
                                className="px-4 py-2 bg-green-50 text-[#3AB000] hover:bg-[#3AB000] hover:text-white transition-all border border-green-100 shadow-sm flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                                title="Approve & Pay"
                              >
                                {processingId === req._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                Pay
                              </button>
                              <button
                                onClick={() => openRejectModal(req)}
                                disabled={processingId === req._id}
                                className="px-4 py-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                                title="Reject Request"
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          ) : req.status === 'success' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleRevert(req._id)}
                                disabled={processingId === req._id}
                                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-sm flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                              >
                                {processingId === req._id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                Revert
                              </button>
                              <button
                                onClick={() => { setSelectedTx(req); setShowTxModal(true); }}
                                className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
                              >
                                View Transaction
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Completed</span>
                              <ExpandableRemark text={req.rejectionReason} isRightAligned={true} colorClass="text-red-500" />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Modal Pagination */}
                {modalPagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-6 bg-white p-4 border border-gray-200 shadow-sm">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Showing Page {modalPagination.page} of {modalPagination.pages} ({modalPagination.total} Total)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchModalRequests(expandedEmployeeId, modalPagination.page - 1)}
                        disabled={modalPagination.page === 1 || modalLoading}
                        className="px-3 py-1.5 text-xs font-black uppercase tracking-widest bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50 transition-colors"
                      >
                        Prev
                      </button>

                      <div className="flex items-center gap-1 mx-2">
                        {Array.from({ length: modalPagination.pages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => fetchModalRequests(expandedEmployeeId, pageNum)}
                            disabled={modalLoading}
                            className={`w-7 h-7 flex items-center justify-center text-[10px] font-bold transition-all border ${modalPagination.page === pageNum
                              ? "bg-[#3AB000] border-[#3AB000] text-white shadow-sm scale-110"
                              : "bg-white border-gray-100 text-gray-400 hover:border-[#3AB000]"
                              }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => fetchModalRequests(expandedEmployeeId, modalPagination.page + 1)}
                        disabled={modalPagination.page === modalPagination.pages || modalLoading}
                        className="px-3 py-1.5 text-xs font-black uppercase tracking-widest bg-[#3AB000] hover:bg-green-600 text-white disabled:opacity-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Rejection Modal */}
      {showRejectModal && selectedReq && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-red-600">
              <h2 className="text-white font-bold text-base flex items-center gap-2 uppercase tracking-wide">
                <AlertCircle className="w-5 h-5" /> Reject Payout Request
              </h2>
              <button
                onClick={() => setShowRejectModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-1 text-center">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee Name</label>
                <div className="text-sm font-black text-gray-800 uppercase">{selectedReq.employeeId?.name || "Unknown"}</div>
                <div className="text-[11px] font-bold text-red-500 mt-1 uppercase bg-red-50 px-3 py-1 rounded w-fit mx-auto">
                  Amount: ₹{selectedReq.amount}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Official Rejection Remark</label>
                <textarea
                  rows="4"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter specific reason for rejection..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-red-500 outline-none transition-all font-bold text-gray-800 text-sm"
                />
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-700 text-[10px] font-black uppercase tracking-wide leading-relaxed">
                Note: Amount will be refunded back to the employee's salary wallet immediately.
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-6 py-2.5 text-xs font-black text-gray-500 hover:text-gray-800 transition-colors uppercase tracking-widest border border-gray-200 bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === selectedReq._id}
                className="bg-red-600 hover:bg-black text-white text-[11px] font-black px-6 py-2.5 rounded-sm transition-all uppercase tracking-widest shadow-md flex items-center gap-2"
              >
                {processingId === selectedReq._id && <Loader2 size={14} className="animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && selectedReq && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#3AB000]">
              <h2 className="text-white font-bold text-base flex items-center gap-2 uppercase tracking-wide">
                <CheckCircle2 className="w-5 h-5" /> Process Payment
              </h2>
              <button
                onClick={() => setShowPayModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

              {/* Bank Account Details */}
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm space-y-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#3AB000]"></div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Target Bank Account</label>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black text-gray-800 uppercase">{selectedReq.bankDetails?.bankName}</div>
                    <div className="text-xs font-bold text-gray-500 mt-0.5 uppercase tracking-wide">
                      {selectedReq.bankDetails?.accountHolderName}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-gray-200">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Account No.</label>
                    <div className="text-xs font-bold text-gray-700">{selectedReq.bankDetails?.accountNumber}</div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">IFSC Code</label>
                    <div className="text-xs font-bold text-gray-700">{selectedReq.bankDetails?.ifscCode}</div>
                  </div>
                </div>
              </div>

              {/* Amount Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Base Amount (₹)</label>
                    <input
                      type="number"
                      value={payBaseAmount}
                      onChange={(e) => setPayBaseAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#3AB000] outline-none transition-all font-bold text-gray-800 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Other Expenses (₹)</label>
                    <input
                      type="number"
                      value={payOtherExpenses}
                      onChange={(e) => setPayOtherExpenses(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#3AB000] outline-none transition-all font-bold text-gray-800 text-sm"
                    />
                  </div>
                </div>

                {/* Final Calculation */}
                <div className="bg-green-50/50 p-4 border border-green-100 flex items-center justify-between">
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Final Payable Amount</div>
                  <div className="text-xl font-black text-[#3AB000]">
                    ₹{(Number(payBaseAmount || 0) + Number(payOtherExpenses || 0)).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Remark */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Admin Remark</label>
                <textarea
                  rows="2"
                  value={payRemark}
                  onChange={(e) => setPayRemark(e.target.value)}
                  placeholder="Enter remarks for this payment..."
                  className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#3AB000] outline-none transition-all font-bold text-gray-800 text-sm"
                />
              </div>

              {/* Payment Mode */}
              <div className="space-y-3 pt-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2">Payment Mode</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex flex-col items-center justify-center h-24 border-2 cursor-pointer transition-all ${payMethod === 'manual' ? 'border-[#3AB000] bg-green-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payMethod" value="manual" checked={payMethod === 'manual'} onChange={() => setPayMethod('manual')} className="sr-only" />
                    <CheckCircle2 size={28} className={`mb-2 ${payMethod === 'manual' ? 'text-[#3AB000]' : 'text-gray-300'}`} />
                    <span className={`text-[11px] font-black uppercase tracking-widest ${payMethod === 'manual' ? 'text-[#3AB000]' : 'text-gray-500'}`}>Manual Paid</span>
                  </label>

                  <label className={`flex flex-col items-center justify-center h-24 border-2 cursor-pointer transition-all ${payMethod === 'razorpay' ? 'border-[#3AB000] bg-green-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payMethod" value="razorpay" checked={payMethod === 'razorpay'} onChange={() => setPayMethod('razorpay')} className="sr-only" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className={`h-7 w-auto object-contain mb-2 ${payMethod === 'razorpay' ? 'opacity-100' : 'opacity-50 grayscale'}`} />
                    <span className={`text-[11px] font-black uppercase tracking-widest ${payMethod === 'razorpay' ? 'text-[#3AB000]' : 'text-gray-500'}`}>RazorpayX</span>
                  </label>
                </div>
                {payMethod === 'razorpay' && (
                  <p className="text-[10px] font-bold text-amber-600 bg-amber-50 p-2 mt-2 flex gap-2"><AlertCircle size={14} /> Funds will be deducted from your configured RazorpayX account.</p>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPayModal(false)}
                className="px-6 py-2.5 text-xs font-black text-gray-500 hover:text-gray-800 transition-colors uppercase tracking-widest border border-gray-200 bg-white"
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                disabled={processingId === selectedReq._id}
                className="bg-[#3AB000] hover:bg-green-600 text-white text-[11px] font-black px-6 py-2.5 rounded-sm transition-all uppercase tracking-widest shadow-md flex items-center gap-2"
              >
                {processingId === selectedReq._id && <Loader2 size={14} className="animate-spin" />}
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showTxModal && selectedTx && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#3AB000]">
              <h2 className="text-white font-bold text-base flex items-center gap-2 uppercase tracking-wide">
                <CheckCircle2 className="w-5 h-5" /> Transaction Details
              </h2>
              <button
                onClick={() => setShowTxModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6">

              <div className="bg-green-50 border border-green-100 p-4 rounded-sm space-y-2 text-center">
                <p className="text-[10px] font-bold text-[#3AB000] uppercase tracking-widest">Final Paid Amount</p>
                <p className="text-3xl font-black text-[#3AB000]">₹{(selectedTx.amount + (selectedTx.otherExpenses || 0)).toLocaleString('en-IN')}</p>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-2 bg-white inline-block px-2 py-1 rounded">
                  Processed on {new Date(selectedTx.processedAt).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm border-t border-b border-gray-100 py-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Base Amount</p>
                  <p className="font-black text-gray-800">₹{selectedTx.amount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Extra Expenses</p>
                  <p className="font-black text-amber-600">{selectedTx.otherExpenses ? `+₹${selectedTx.otherExpenses.toLocaleString('en-IN')}` : '₹0'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Mode</p>
                  <p className="font-black text-gray-800 uppercase flex items-center gap-1">
                    {selectedTx.paymentMethod === 'razorpay' ? (
                      <><img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" className="h-3" /> RazorpayX</>
                    ) : (
                      <><CheckCircle2 size={12} className="text-[#3AB000]" /> Manual</>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction ID</p>
                  <p className="font-bold text-gray-600 text-xs">{selectedTx.payoutId || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 border border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Admin Remark</p>
                <p className="font-bold text-gray-800 text-xs whitespace-pre-wrap">{selectedTx.adminRemark || "No remarks provided."}</p>
              </div>

            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowTxModal(false)}
                className="px-6 py-2.5 text-xs font-black text-white hover:bg-black bg-gray-800 transition-colors uppercase tracking-widest rounded-sm shadow-md"
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

export default AdminWithdrawalManagement;
