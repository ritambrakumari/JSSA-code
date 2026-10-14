import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { walletAPI, employeesAPI, apiRequest } from "../../utils/api";
import statesData from "../../data/states.json";
import { useAuth } from "../../auth/AuthProvider";
import {
  Search,
  User,
  Filter,
  Loader2,
  RefreshCcw,
  AlertCircle,
  LogOut,
  ShieldAlert,
  UserX,
  RotateCcw,
  Download,
  Edit,
} from "lucide-react";
import { toast } from "react-hot-toast";

/** Blocks portal for inactive / terminated employees — logout only, no close */
export function EmployeeAccountStatusBlocker() {
  const { role, isAuthenticated, employeeProfile, profileLoading, logout } = useAuth();

  if (!isAuthenticated || role !== "employee") return null;

  // Wait for fresh profile after login — avoids stale Inactive/Terminated from last session
  if (profileLoading || !employeeProfile) return null;

  const accountStatus = employeeProfile?.status;
  if (accountStatus !== "Inactive" && accountStatus !== "Terminated") return null;

  const isTerminated = accountStatus === "Terminated";

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 select-none">
      <div className="bg-white border-t-8 border-t-[#3AB000] w-full max-w-md p-8 shadow-2xl text-center space-y-5">
        <div className="w-14 h-14 mx-auto bg-red-50 text-red-600 flex items-center justify-center">
          {isTerminated ? <UserX size={28} /> : <ShieldAlert size={28} />}
        </div>
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
          {isTerminated ? "Account Terminated" : "Account Inactive"}
        </h2>
        <p className="text-xs font-bold text-gray-500 leading-relaxed uppercase tracking-wide">
          {isTerminated
            ? "Your employment has been terminated. You cannot access the portal. Contact administration if you believe this is an error."
            : "Your account is currently inactive. Please contact your administrator to restore access."}
        </p>
        <button
          type="button"
          onClick={logout}
          className="w-full h-12 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}

const AdminEmployeeList = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [blockFilter, setBlockFilter] = useState("all");
  const [panchayatFilter, setPanchayatFilter] = useState("all");
  
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [actionLoadingId, setActionLoadingId] = useState(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: null, isDanger: false });

  const [filterCounts, setFilterCounts] = useState({ states: {}, districts: {}, blocks: {}, panchayats: {} });
  
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
      const params = {
        search,
        role: roleFilter !== "all" ? roleFilter : "",
        state: stateFilter !== "all" ? stateFilter : "",
        district: districtFilter !== "all" ? districtFilter : "",
        block: blockFilter !== "all" ? blockFilter : "",
        panchayat: panchayatFilter !== "all" ? panchayatFilter : ""
      };
      
      const blob = await walletAPI.exportAdminEmployeesCSV(params);

      clearInterval(interval);
      setExportProgress(100);

      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Employees_List_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      clearInterval(interval);
      console.error("Export failed:", error);
      toast.error("Failed to export. Please check if you have permission or data is too large.");
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 600);
    }
  };

  useEffect(() => {
    loadFilterCounts();
  }, [roleFilter, stateFilter, districtFilter, blockFilter]);

  const fetchEmployees = async (page = 1) => {
    try {
      setLoading(true);
      const params = { search, role: roleFilter, page, limit: 20 };
      if (stateFilter !== "all") params.state = stateFilter;
      if (districtFilter !== "all") params.district = districtFilter;
      if (blockFilter !== "all") params.block = blockFilter;
      if (panchayatFilter !== "all") params.panchayat = panchayatFilter;

      const res = await walletAPI.getAdminEmployees(params);
      if (res.success) {
        setEmployees(res.data);
        if (res.pagination) {
          setPagination({
            page: res.pagination.currentPage,
            pages: res.pagination.pages,
            total: res.pagination.total,
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
      fetchEmployees(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, roleFilter, stateFilter, districtFilter, blockFilter, panchayatFilter]);

  const handleFilterChange = (field, value) => {
    if (field === "roleFilter") { setRoleFilter(value); setStateFilter("all"); setDistrictFilter("all"); setBlockFilter("all"); setPanchayatFilter("all"); }
    else if (field === "stateFilter") { setStateFilter(value); setDistrictFilter("all"); setBlockFilter("all"); setPanchayatFilter("all"); }
    else if (field === "districtFilter") { setDistrictFilter(value); setBlockFilter("all"); setPanchayatFilter("all"); }
    else if (field === "blockFilter") { setBlockFilter(value); setPanchayatFilter("all"); }
    else if (field === "panchayatFilter") { setPanchayatFilter(value); }
  };

  const updateAccountStatus = async (emp, action) => {
    const recordId = emp.employeeRecordId || emp._id;
    if (!emp.employeeRecordId) {
      toast.error("Complete employee profile required before managing account status");
      return;
    }

    try {
      setActionLoadingId(recordId);
      const res = await apiRequest(`/employees/${recordId}/account-status`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      if (res.success) {
        toast.success(res.message || "Status updated", { iconTheme: { primary: "#1761b0", secondary: "#ffffff" }, style: { border: "1px solid #b9d3f0", color: "#123b68", fontWeight: 600, fontFamily: '"Segoe UI", Tahoma, sans-serif' } });
        await fetchEmployees(pagination.page);
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update account status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleActive = (emp, e) => {
    e.stopPropagation();
    const current = emp.accountStatus || "Active";
    if (current === "Terminated") return;

    const goingInactive = current === "Active";
    const msg = goingInactive
      ? `Mark "${emp.name}" as INACTIVE? They will see an inactive modal on login.`
      : `Activate "${emp.name}"? They will regain portal access.`;

    setConfirmDialog({
      isOpen: true,
      title: goingInactive ? "MARK INACTIVE?" : "ACTIVATE ACCOUNT?",
      message: msg,
      isDanger: goingInactive,
      onConfirm: () => updateAccountStatus(emp, goingInactive ? "deactivate" : "activate"),
    });
  };

  const handleTerminate = (emp, e) => {
    e.stopPropagation();
    if ((emp.accountStatus || "Active") === "Terminated") return;

    setConfirmDialog({
      isOpen: true,
      title: "TERMINATE ACCOUNT?",
      message: `Terminate "${emp.name}"?\n\nThis cannot be undone from the employee side. Use Reactivate to restore access.`,
      isDanger: true,
      onConfirm: () => updateAccountStatus(emp, "terminate"),
    });
  };

  const handleReactivate = (emp, e) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: "REACTIVATE ACCOUNT?",
      message: `Reactivate "${emp.name}" and restore Active status?`,
      isDanger: false,
      onConfirm: () => updateAccountStatus(emp, "reactivate"),
    });
  };

  const getAccountBadge = (emp) => {
    const account = emp.accountStatus || "Active";
    if (account === "Terminated") {
      return "bg-red-100 text-red-700 border-red-200";
    }
    if (account === "Inactive") {
      return "bg-gray-100 text-gray-600 border-gray-200";
    }
    return "bg-[#3AB000]/5 text-[#3AB000] border-[#3AB000]/20";
  };

  return (
    <DashboardLayout>
      {/* Export Progress Overlay */}
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
              {exportProgress < 40 ? "Fetching personnel data from database..." 
                : exportProgress < 75 ? "Applying filters & building Excel sheet..."
                : exportProgress < 100 ? "Finalizing & compressing file..."
                : "✅ Download starting now!"}
            </p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Employee Directory</h1>
              <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.2em] mt-1">
                Personnel Database & Registry
              </p>
            </div>

            <button
              onClick={() => fetchEmployees(pagination.page)}
              className="h-10 w-10 flex items-center justify-center bg-white border border-gray-300 text-gray-400 hover:text-[#3AB000] hover:border-[#3AB000] rounded transition-all shadow-sm group self-end lg:self-auto"
            >
              <RefreshCcw
                size={18}
                className={`${loading ? "animate-spin" : ""} group-active:rotate-180 transition-transform`}
              />
            </button>
          </div>

          <div className="bg-white border border-gray-200 p-4 mb-6 rounded shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-[#3AB000]" />
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Directory Filters</span>
              </div>
              <button
                onClick={handleExport}
                className="bg-black hover:bg-gray-800 text-white text-xs px-4 py-2 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide"
              >
                <Download size={14} />
                <span>Export Excel</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {/* Search */}
              <div className="flex items-center border border-gray-200 rounded overflow-hidden h-10 bg-white focus-within:border-[#3AB000] xl:col-span-2">
                <input
                  type="text"
                  placeholder="Search by name, phone or email..."
                  className="flex-1 px-3 text-xs font-bold outline-none text-gray-800"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="bg-[#3AB000] h-full flex items-center px-3 text-white">
                  <Search size={14} />
                </div>
              </div>

              {/* Role */}
              <select
                value={roleFilter}
                onChange={(e) => handleFilterChange("roleFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
              >
                <option value="all">All Personnel</option>
                <option value="RM">Regional Manager (RM)</option>
                <option value="ZC">Zonal Coordinator (ZC)</option>
                <option value="EMPLOYEE">Manual Employee</option>
                <option value="DM">District Manager (DM)</option>
                <option value="BS">Block Supervisor (BS)</option>
                <option value="PE">Panchayat Executive (PE)</option>
              </select>

              {/* State */}
              <select
                value={stateFilter}
                onChange={(e) => handleFilterChange("stateFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
              >
                <option value="all">All States</option>
                {statesData.map((st, i) => (
                  <option key={i} value={st}>{st}</option>
                ))}
              </select>

              {/* District */}
              <select
                value={districtFilter}
                disabled={stateFilter === "all"}
                onChange={(e) => handleFilterChange("districtFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="all">All Districts</option>
                {stateFilter !== "all" && Object.entries(filterCounts.districts || {}).map(([dist, count]) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>

              {/* Block */}
              {(roleFilter === "all" || roleFilter === "BS" || roleFilter === "PE" || roleFilter === "EMPLOYEE") && (
                <select
                  value={blockFilter}
                  disabled={districtFilter === "all"}
                  onChange={(e) => handleFilterChange("blockFilter", e.target.value)}
                  className="h-10 px-3 bg-white border border-gray-200 rounded text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="all">All Blocks</option>
                  {districtFilter !== "all" && Object.entries(filterCounts.blocks || {}).map(([blk, count]) => (
                    <option key={blk} value={blk}>{blk}</option>
                  ))}
                </select>
              )}

              {/* Panchayat */}
              {(roleFilter === "all" || roleFilter === "PE" || roleFilter === "EMPLOYEE") && (
                <select
                  value={panchayatFilter}
                  disabled={blockFilter === "all"}
                  onChange={(e) => handleFilterChange("panchayatFilter", e.target.value)}
                  className="h-10 px-3 bg-white border border-gray-200 rounded text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="all">All Panchayats</option>
                  {blockFilter !== "all" && Object.entries(filterCounts.panchayats || {}).map(([panch, count]) => (
                    <option key={panch} value={panch}>{panch}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 size={40} className="animate-spin text-[#3AB000]" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                  Synchronizing Employee Registry...
                </p>
              </div>
            )}

            {employees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1480px] table-fixed text-left text-sm border-collapse">
                  <colgroup>
                    <col className="w-[18%]" />
                    <col className="w-[6%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[8%]" />
                    <col className="w-[7%]" />
                    <col className="w-[15%]" />
                    <col className="w-[24%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-[#3AB000] text-white font-black uppercase text-[10px] tracking-widest">
                      <th className="px-3 py-3">Employee Details</th>
                      <th className="px-2 py-3 text-center">Role</th>
                      <th className="px-2 py-3 text-center">Designation</th>
                      <th className="px-2 py-3 text-center">Jurisdiction</th>
                      <th className="px-2 py-3 text-center">Onboarding</th>
                      <th className="px-2 py-3 text-center">Account</th>
                      <th className="px-3 py-3 text-center">Contact</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employees.map((emp) => {
                      const accountStatus = emp.accountStatus || "Active";
                      const isTerminated = accountStatus === "Terminated";
                      const isActive = accountStatus === "Active";
                      const recordId = emp.employeeRecordId || emp._id;
                      const busy = actionLoadingId === recordId;

                      return (
                        <tr
                          key={emp._id}
                          onClick={() => navigate(`/admin/employee-detail/${emp._id}`)}
                          className="transition-colors group relative hover:bg-[#f0f9eb] cursor-pointer"
                        >
                          <td className="px-3 py-3 relative">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-[#3AB000]/10 flex items-center justify-center text-[#3AB000] border border-[#3AB000]/20">
                                <User size={20} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-gray-900 leading-none">{emp.name}</p>
                                  <span className="text-[9px] font-black text-gray-400 bg-gray-50 px-1.5 py-0.5 border border-gray-100 uppercase">
                                    ID: {emp.userId?.toString().slice(-6).toUpperCase() || "NEW"}
                                  </span>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1.5">
                                  {emp.userId?.phone || emp.mobile || emp.application?.mobile || emp.phone || "No Mobile"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span
                              className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                                emp.role === "RM"
                                  ? "bg-red-100 text-red-700"
                                  : emp.role === "ZC"
                                    ? "bg-teal-100 text-teal-700"
                                    : emp.role === "DM"
                                      ? "bg-blue-100 text-blue-700"
                                      : emp.role === "BS"
                                        ? "bg-purple-100 text-purple-700"
                                        : emp.role === "PE"
                                          ? "bg-orange-100 text-orange-700"
                                          : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {emp.role || "EMP"}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-tighter inline-block max-w-full leading-snug ${
                                emp.designation === "General Employee"
                                  ? "text-gray-400 border-gray-100 bg-gray-50"
                                  : "text-[#3AB000] border-[#3AB000]/20 bg-[#3AB000]/5"
                              }`}
                            >
                              {emp.designation}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter bg-gray-50 px-2 py-1 border border-gray-100 rounded inline-block max-w-full">
                              {emp.workingDistrict || "NOT ASSIGNED"}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span
                              className={`text-[9px] font-black px-2.5 py-1 rounded-none uppercase tracking-widest border ${
                                emp.status === "Active"
                                  ? "bg-[#3AB000]/5 text-[#3AB000] border-[#3AB000]/20"
                                  : "bg-orange-50 text-orange-600 border-orange-100"
                              }`}
                            >
                              {emp.status}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <span
                              className={`text-[9px] font-black px-2.5 py-1 rounded-none uppercase tracking-widest border ${getAccountBadge(emp)}`}
                            >
                              {accountStatus}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center overflow-hidden">
                            <div className="flex flex-col items-center min-w-0 max-w-full">
                              <p className="text-[10px] font-black text-gray-900 tracking-tight truncate max-w-full" title={emp.email || ""}>
                                {emp.email || "NO EMAIL"}
                              </p>
                              <span className="text-[9px] font-bold text-[#3AB000] uppercase tracking-widest mt-0.5">
                                Verified
                              </span>
                            </div>
                          </td>
                          <td className="pl-4 pr-3 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2.5 ml-auto">
                              {emp.employeeRecordId ? (
                                <>
                                  <div
                                    className="flex items-center gap-2 shrink-0 pr-2 border-r border-gray-200"
                                    title={
                                      isTerminated
                                        ? "Terminated — use Reactivate"
                                        : "Toggle account Active / Inactive"
                                    }
                                  >
                                    <div className="flex flex-col items-end leading-none">
                                      <span className="text-[7px] font-black text-gray-400 uppercase tracking-wider">
                                        Account
                                      </span>
                                      <span
                                        className={`text-[8px] font-black uppercase ${
                                          isTerminated
                                            ? "text-red-600"
                                            : isActive
                                              ? "text-[#3AB000]"
                                              : "text-orange-600"
                                        }`}
                                      >
                                        {isTerminated ? "Locked" : isActive ? "Active" : "Inactive"}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={busy || isTerminated}
                                      onClick={(e) => handleToggleActive(emp, e)}
                                      className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${
                                        isActive ? "bg-[#3AB000]" : "bg-gray-300"
                                      } ${isTerminated ? "opacity-40 cursor-not-allowed" : ""}`}
                                      aria-label={
                                        isTerminated
                                          ? "Account locked — reactivate required"
                                          : `Set account ${isActive ? "inactive" : "active"}`
                                      }
                                    >
                                      <span
                                        className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                                          isActive ? "translate-x-4" : "translate-x-0"
                                        }`}
                                      />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/admin/employee/edit/${emp._id}`);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[8px] font-black uppercase tracking-wide disabled:opacity-50 whitespace-nowrap shrink-0"
                                  >
                                    <Edit size={10} />
                                    Edit
                                  </button>

                                  {isTerminated ? (
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={(e) => handleReactivate(emp, e)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#3AB000] hover:bg-[#2d8a00] text-white text-[8px] font-black uppercase tracking-wide disabled:opacity-50 whitespace-nowrap shrink-0"
                                    >
                                      {busy ? (
                                        <Loader2 size={10} className="animate-spin" />
                                      ) : (
                                        <RotateCcw size={10} />
                                      )}
                                      Reactivate
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={(e) => handleTerminate(emp, e)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[8px] font-black uppercase tracking-wide disabled:opacity-50 whitespace-nowrap shrink-0"
                                    >
                                      {busy ? (
                                        <Loader2 size={10} className="animate-spin" />
                                      ) : (
                                        <UserX size={10} />
                                      )}
                                      Terminate
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span className="text-[8px] font-bold text-gray-400 uppercase whitespace-nowrap">Incomplete</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              !loading && (
                <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="p-4 bg-gray-50 text-gray-300">
                    <AlertCircle size={40} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 uppercase">No Employees Found</p>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-tighter font-bold">
                      Try adjusting your filters or search terms
                    </p>
                  </div>
                </div>
              )
            )}
          </div>

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
                        className={`w-8 h-8 flex items-center justify-center text-[10px] font-bold transition-all border ${
                          pagination.page === pageNum
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
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className={`bg-white border-t-8 w-full max-w-md p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200 ${confirmDialog.isDanger ? 'border-t-red-600' : 'border-t-[#3AB000]'}`}>
            
            <div className={`w-16 h-16 mx-auto flex items-center justify-center rounded-none ${confirmDialog.isDanger ? 'bg-red-50 text-red-600' : 'bg-green-50 text-[#3AB000]'}`}>
              <AlertCircle size={32} />
            </div>
            
            <div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{confirmDialog.title}</h3>
              <p className="text-xs font-bold text-gray-500 leading-relaxed uppercase tracking-wide mt-3 whitespace-pre-wrap">
                {confirmDialog.message}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null, isDanger: false })}
                className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-black uppercase tracking-widest flex items-center justify-center transition-colors rounded-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                  setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null, isDanger: false });
                }}
                className={`flex-1 h-12 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center transition-all rounded-none active:scale-95 shadow-sm hover:shadow ${
                  confirmDialog.isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#3AB000] hover:bg-[#2d8a00]'
                }`}
              >
                Confirm
              </button>
            </div>
            
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminEmployeeList;
