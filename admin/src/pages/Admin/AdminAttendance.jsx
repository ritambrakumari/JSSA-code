import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  Shield,
  Trash2,
  Calendar,
  Search,
  RefreshCw,
  Clock,
  User,
  Filter,
  Loader2,
  AlertTriangle,
  MapPin,
  Eye,
  X,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { employeesAPI } from "../../utils/api";

const AdminAttendance = ({
  personType = "employee",
  registryTitle = "Employee Attendance Registry",
  searchPlaceholder = "Search by Employee Name...",
  entityLabel = "Employee",
}) => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Global Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [designationFilter, setDesignationFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [roleFilter, setRoleFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [blockFilter, setBlockFilter] = useState("all");
  const [panchayatFilter, setPanchayatFilter] = useState("all");
  const [filterCounts, setFilterCounts] = useState({ states: {}, districts: {}, blocks: {}, panchayats: {} });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

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

  React.useEffect(() => {
    loadFilterCounts();
  }, [roleFilter, stateFilter, districtFilter, blockFilter]);

  // Pagination States
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, pages: 1, total: 0 });

  // View Modal States
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empHistory, setEmpHistory] = useState([]);
  const [empHistoryLoading, setEmpHistoryLoading] = useState(false);

  // Selfie lightbox
  const [selectedSelfie, setSelectedSelfie] = useState(null);

  // Unique designations from loaded data (for filter dropdown)
  const [availableDesignations, setAvailableDesignations] = useState([]);

  const getToken = () => {
    const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
    return authData.token;
  };

  // ===========================
  //  FETCH ATTENDANCE (Backend Global Filter)
  // ===========================
  const fetchAttendance = useCallback(async (p = 1, overrideFilters = null) => {
    try {
      setLoading(true);
      const token = getToken();
      const filters = overrideFilters || { search, statusFilter, designationFilter, dateFrom, dateTo, roleFilter, stateFilter, districtFilter, blockFilter, panchayatFilter };

      const params = new URLSearchParams();
      params.append("page", p);
      params.append("limit", 15);
      params.append("personType", personType);
      if (filters.search) params.append("search", filters.search);
      if (filters.statusFilter && filters.statusFilter !== "all") params.append("status", filters.statusFilter);
      if (filters.designationFilter && filters.designationFilter !== "all") params.append("designation", filters.designationFilter);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.roleFilter && filters.roleFilter !== "all") params.append("role", filters.roleFilter);
      if (filters.stateFilter && filters.stateFilter !== "all") params.append("state", filters.stateFilter);
      if (filters.districtFilter && filters.districtFilter !== "all") params.append("district", filters.districtFilter);
      if (filters.blockFilter && filters.blockFilter !== "all") params.append("block", filters.blockFilter);
      if (filters.panchayatFilter && filters.panchayatFilter !== "all") params.append("panchayat", filters.panchayatFilter);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/goal-config/admin/attendance?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setAttendance(res.data.data);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
        // Build unique designations for dropdown
        const desigs = [...new Set(res.data.data.map(item => item.designation).filter(Boolean))];
        setAvailableDesignations(prev => [...new Set([...prev, ...desigs])]);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to load ${entityLabel.toLowerCase()} attendance registry`);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, designationFilter, dateFrom, dateTo, personType, entityLabel]);

  // Initial load
  useEffect(() => {
    fetchAttendance(1);
  }, []);

  // Debounce search filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAttendance(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Immediate trigger for dropdown/date filters
  const handleFilterChange = (field, value) => {
    const newFilters = { search, statusFilter, designationFilter, dateFrom, dateTo, roleFilter, stateFilter, districtFilter, blockFilter, panchayatFilter, [field]: value };
    if (field === "statusFilter") setStatusFilter(value);
    if (field === "designationFilter") setDesignationFilter(value);
    if (field === "dateFrom") setDateFrom(value);
    if (field === "dateTo") setDateTo(value);
    if (field === "roleFilter") { setRoleFilter(value); newFilters.stateFilter = "all"; newFilters.districtFilter = "all"; newFilters.blockFilter = "all"; newFilters.panchayatFilter = "all"; setStateFilter("all"); setDistrictFilter("all"); setBlockFilter("all"); setPanchayatFilter("all"); }
    if (field === "stateFilter") { setStateFilter(value); newFilters.districtFilter = "all"; newFilters.blockFilter = "all"; newFilters.panchayatFilter = "all"; setDistrictFilter("all"); setBlockFilter("all"); setPanchayatFilter("all"); }
    if (field === "districtFilter") { setDistrictFilter(value); newFilters.blockFilter = "all"; newFilters.panchayatFilter = "all"; setBlockFilter("all"); setPanchayatFilter("all"); }
    if (field === "blockFilter") { setBlockFilter(value); newFilters.panchayatFilter = "all"; setPanchayatFilter("all"); }
    if (field === "panchayatFilter") setPanchayatFilter(value);

    setPage(1);
    fetchAttendance(1, newFilters);
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
      const token = getToken();
      const params = new URLSearchParams();
      params.append("export", "true");
      params.append("personType", personType);
      if (search) params.append("search", search);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (designationFilter && designationFilter !== "all") params.append("designation", designationFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (roleFilter && roleFilter !== "all") params.append("role", roleFilter);
      if (stateFilter && stateFilter !== "all") params.append("state", stateFilter);
      if (districtFilter && districtFilter !== "all") params.append("district", districtFilter);
      if (blockFilter && blockFilter !== "all") params.append("block", blockFilter);
      if (panchayatFilter && panchayatFilter !== "all") params.append("panchayat", panchayatFilter);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/goal-config/admin/attendance?${params.toString()}`,
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
      link.setAttribute("download", `Attendance_Export_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      clearInterval(interval);
      console.error("Export error:", err);
      toast.error("Failed to export attendance data.");
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 600);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    fetchAttendance(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchAttendance(newPage);
  };

  // ===========================
  //  DELETE
  // ===========================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this attendance record? This action cannot be undone.")) return;
    try {
      setDeleteLoading(id);
      const token = getToken();
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/goal-config/admin/attendance/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Record deleted successfully", { style: { borderRadius: "0px" } });
        fetchAttendance(page);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete attendance record");
    } finally {
      setDeleteLoading(null);
    }
  };

  // ===========================
  //  VIEW MODAL
  // ===========================
  const handleViewEmployee = async (item) => {
    setSelectedEmp(item);
    setViewModalOpen(true);
    setEmpHistory([]);
    setEmpHistoryLoading(true);

    try {
      const token = getToken();
      // Fetch ALL attendance records for this specific employee
      const empUserId = item.employeeId?._id || item.employeeId;
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/goal-config/admin/attendance?employeeId=${empUserId}&personType=${personType}&limit=500&page=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setEmpHistory(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to load ${entityLabel.toLowerCase()} history`);
    } finally {
      setEmpHistoryLoading(false);
    }
  };

  // Compute metrics for view modal
  const computeMetrics = (records) => {
    const total = records.length;
    const completed = records.filter(r => r.status === "Completed" || (r.checkOut?.time)).length;
    const late = records.filter(r => r.status === "Late" || r.status === "Late & Early Out").length;
    const halfDay = records.filter(r => r.status === "Half-Day").length;
    const absent = records.filter(r => r.status === "Absent").length;
    const totalHrs = records.reduce((sum, r) => sum + (parseFloat(r.workingHours) || 0), 0);
    const avgHrs = total > 0 ? (totalHrs / total).toFixed(1) : "0.0";
    return { total, completed, late, halfDay, absent, totalHrs: totalHrs.toFixed(1), avgHrs };
  };

  // ===========================
  //  HELPERS
  // ===========================
  const formatTo12Hour = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes} ${ampm}`;
  };

  const getStatusBadge = (item, small = false) => {
    let displayStatus = item.status || "Present";
    if (item.checkOut?.time) displayStatus = "Completed";
    else if (item.checkIn?.time && displayStatus !== "Completed") displayStatus = "Checked-In";

    const normStatus = displayStatus.toUpperCase();
    let bg = "bg-[#3AB000] text-white";
    if (normStatus === "CHECKED-IN") bg = "bg-amber-500 text-white";
    else if (normStatus === "COMPLETED") bg = "bg-[#3AB000] text-white";
    else if (normStatus === "HALF-DAY") bg = "bg-purple-600 text-white";
    else if (normStatus === "ABSENT") bg = "bg-red-800 text-white";
    else if (normStatus === "LATE") bg = "bg-orange-500 text-white";

    return (
      <span className={`${bg} px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-none`}>
        {displayStatus}
      </span>
    );
  };

  const stats = {
    total: pagination.total || 0,
    active: attendance.filter(a => a.status === "Checked-In").length,
    completed: attendance.filter(a => a.status === "Completed").length,
  };

  const renderPageNumbers = () => {
    const totalPages = pagination.pages;
    const current = pagination.currentPage;
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, current - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);

    return (
      <div className="flex gap-1 items-center">
        {startPage > 1 && (
          <>
            <button onClick={() => handlePageChange(1)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-none text-[10px] font-black hover:border-[#3AB000] cursor-pointer transition-all">1</button>
            {startPage > 2 && <span className="text-gray-400 text-[10px] px-0.5">...</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => handlePageChange(p)}
            className={`w-7 h-7 flex items-center justify-center rounded-none text-[10px] font-black transition-all cursor-pointer border ${p === current
              ? "bg-[#3AB000] border-[#3AB000] text-white shadow-md shadow-[#3AB000]/10"
              : "bg-white border-gray-200 text-gray-700 hover:border-[#3AB000]"
              }`}
          >
            {p}
          </button>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-400 text-[10px] px-0.5">...</span>}
            <button onClick={() => handlePageChange(totalPages)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-none text-[10px] font-black hover:border-[#3AB000] cursor-pointer transition-all">{totalPages}</button>
          </>
        )}
      </div>
    );
  };

  const metrics = viewModalOpen && empHistory.length > 0 ? computeMetrics(empHistory) : null;

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
              {exportProgress < 40 ? "Fetching attendance data from database..." 
                : exportProgress < 75 ? "Applying filters & building Excel sheet..."
                : exportProgress < 100 ? "Finalizing & compressing file..."
                : "✅ Download starting now!"}
            </p>
          </div>
        </div>
      )}
      <div className="p-0 ml-0 md:ml-6 px-2 md:px-0 mt-4 space-y-4 h-full max-w-[99rem]">

        {/* TOP STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mr-4">
          <div className="flex items-center justify-between bg-white border border-gray-300 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Logs (Filtered)</span>
              <span className="text-2xl font-black text-gray-900 leading-none">{stats.total}</span>
            </div>
            <div className="p-3 bg-gray-50 text-[#3AB000] rounded-none">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between bg-white border border-gray-300 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Checked-In (Page)</span>
              <span className="text-2xl font-black text-amber-600 leading-none">{stats.active}</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-500 rounded-none">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between bg-white border border-gray-300 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Completed Shifts (Page)</span>
              <span className="text-2xl font-black text-[#3AB000] leading-none">{stats.completed}</span>
            </div>
            <div className="p-3 bg-green-50 text-[#3AB000] rounded-none">
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white p-4 border border-gray-300 rounded-none shadow-sm space-y-4 mr-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase">
              <Shield className="w-6 h-6 text-[#3AB000]" />
              {registryTitle}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="bg-black hover:bg-gray-800 text-white text-xs px-5 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isExporting ? "Exporting..." : "Export Excel"}
              </button>
              <button
                onClick={handleRefresh}
                className="bg-black hover:bg-gray-800 text-white text-xs px-5 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh Registry
              </button>
            </div>
          </div>

          {/* Filter hint */}
          <div className="flex items-center gap-2 text-[9px] font-bold text-[#3AB000] uppercase tracking-wider bg-green-50 border border-green-100 px-3 py-1.5 rounded-none w-fit">
            <Filter size={10} />
            Global Backend Filters — All filters apply across all pages
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 border-t border-gray-100 pt-4">
            {/* Search */}
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm font-bold h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <select
              className="h-10 border border-gray-300 rounded-none px-3 text-xs sm:text-sm font-black uppercase tracking-widest text-gray-700 bg-white focus:outline-none shadow-sm cursor-pointer focus:border-[#3AB000]"
              value={statusFilter}
              onChange={(e) => handleFilterChange("statusFilter", e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="checked-in">Checked-In</option>
              <option value="completed">Completed</option>
              <option value="late">Late</option>
              <option value="half-day">Half-Day</option>
              <option value="absent">Absent</option>
            </select>

            {/* Designation Filter */}


            {/* Date From */}
            <div className="flex items-center gap-2 h-10 px-3 border border-gray-300 bg-gray-50/50">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="bg-transparent border-none focus:outline-none text-xs font-bold text-gray-700 w-full"
              />
            </div>

            {/* Date To */}
            <div className="flex items-center gap-2 h-10 px-3 border border-gray-300 bg-gray-50/50">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="bg-transparent border-none focus:outline-none text-xs font-bold text-gray-700 w-full"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => handleFilterChange("roleFilter", e.target.value)}
              className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
            >
              <option value="all">All Roles</option>
              <option value="RM">Regional Manager (RM)</option>
              <option value="ZC">Zonal Coordinator (ZC)</option>
              <option value="DM">District Manager (DM)</option>
              <option value="BS">Block Supervisor (BS)</option>
              <option value="PE">Panchayat Executive (PE)</option>
            </select>

            {/* State Filter */}
            <select
              value={stateFilter}
              onChange={(e) => handleFilterChange("stateFilter", e.target.value)}
              className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
            >
              <option value="all">All States</option>
              {Object.entries(filterCounts.states || {}).map(([state, count]) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>

            {/* District Filter */}
            <select
              value={districtFilter}
              disabled={stateFilter === "all"}
              onChange={(e) => handleFilterChange("districtFilter", e.target.value)}
              className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="all">All Districts</option>
              {stateFilter !== "all" && Object.entries(filterCounts.districts || {}).map(([dist, count]) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>

            {/* Block (Hidden for DM) */}
            {(roleFilter === "all" || roleFilter === "BS" || roleFilter === "PE") && (
              <select
                value={blockFilter}
                disabled={districtFilter === "all"}
                onChange={(e) => handleFilterChange("blockFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="all">All Blocks</option>
                {districtFilter !== "all" && Object.entries(filterCounts.blocks || {}).map(([block, count]) => (
                  <option key={block} value={block}>{block}</option>
                ))}
              </select>
            )}

            {/* Panchayat (Hidden for DM, BS) */}
            {(roleFilter === "all" || roleFilter === "PE") && (
              <select
                value={panchayatFilter}
                disabled={blockFilter === "all"}
                onChange={(e) => handleFilterChange("panchayatFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="all">All Panchayats</option>
                {blockFilter !== "all" && Object.entries(filterCounts.panchayats || {}).map(([panch, count]) => (
                  <option key={panch} value={panch}>{panch}</option>
                ))}
              </select>
            )}

            {(search || statusFilter !== "all" || designationFilter !== "all" || dateFrom || dateTo) && (
              <div className="xl:col-span-6 flex justify-end mt-1">
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setDesignationFilter("all");
                    setRoleFilter("all");
                    setStateFilter("all");
                    setDistrictFilter("all");
                    setBlockFilter("all");
                    setPanchayatFilter("all");
                    setDateFrom("");
                    setDateTo("");
                    setPage(1);
                    fetchAttendance(1, { search: "", statusFilter: "all", designationFilter: "all", dateFrom: "", dateTo: "", roleFilter: "all", stateFilter: "all", districtFilter: "all", blockFilter: "all", panchayatFilter: "all" });
                  }}
                  className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase underline underline-offset-4"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ATTENDANCE TABLE */}
        <div className="bg-white rounded-none overflow-hidden border border-gray-300 shadow-sm mr-4 mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#3AB000]">
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Date</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">{entityLabel} Details</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-center">Selfie</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Check-In</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Check-Out</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-center">Working Hrs</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-center">Status</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="8" className="px-6 py-8"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                    </tr>
                  ))
                ) : attendance.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-20 text-center">
                      <AlertTriangle size={48} className="text-gray-200 mx-auto mb-4" />
                      <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No Attendance Records Found</p>
                    </td>
                  </tr>
                ) : (
                  attendance.map((item) => (
                    <tr key={item._id} className="hover:bg-[#e8f5e2] transition-colors border-b border-gray-100">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-[12px] font-bold text-gray-900 uppercase">{item.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center font-black text-sm rounded-none">
                            {(item.employeeName || "E")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-gray-900 tracking-tight leading-none mb-1 uppercase">{item.employeeName}</p>
                            <p className="text-[10px] font-bold text-[#3AB000] tracking-widest uppercase">{item.designation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {item.checkIn?.selfie ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}${item.checkIn.selfie}`}
                            alt="Selfie"
                            onClick={() => setSelectedSelfie(`${import.meta.env.VITE_API_URL}${item.checkIn.selfie}`)}
                            className="w-10 h-10 object-cover border-2 border-black hover:border-[#3AB000] cursor-pointer transition-all mx-auto rounded-none shadow-sm hover:scale-105"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs italic">No Selfie</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-gray-400" />
                            <span className="text-xs font-bold text-gray-700">{item.checkIn ? formatTo12Hour(item.checkIn.time) : "N/A"}</span>
                          </div>
                          {item.checkIn?.location?.lat && item.checkIn?.location?.lng && (
                            <span className="text-[9.5px] font-black text-[#3AB000] uppercase tracking-wider flex items-center gap-1">
                              <MapPin size={10} />
                              {item.checkIn.location.lat.toFixed(6)}, {item.checkIn.location.lng.toFixed(6)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-gray-400" />
                            <span className="text-xs font-bold text-gray-700">{item.checkOut ? formatTo12Hour(item.checkOut.time) : "N/A"}</span>
                          </div>
                          {item.checkOut?.location?.lat && item.checkOut?.location?.lng && (
                            <span className="text-[9.5px] font-black text-orange-600 uppercase tracking-wider flex items-center gap-1">
                              <MapPin size={10} />
                              {item.checkOut.location.lat.toFixed(6)}, {item.checkOut.location.lng.toFixed(6)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center font-black text-gray-900 text-xs">
                        {item.workingHours || "0.0"} Hrs
                      </td>
                      <td className="px-6 py-5 text-center">
                        {getStatusBadge(item)}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* VIEW BUTTON */}
                          <button
                            onClick={() => handleViewEmployee(item)}
                            className="bg-[#3AB000] hover:bg-[#2d8a00] text-white p-2 rounded-none transition-all inline-flex items-center justify-center shadow-md shadow-green-600/10"
                            title="View Attendance History"
                          >
                            <Eye size={14} />
                          </button>
                          {/* DELETE BUTTON */}
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={deleteLoading === item._id}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-none transition-all disabled:opacity-50 inline-flex items-center justify-center shadow-md shadow-red-600/10"
                          >
                            {deleteLoading === item._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination.pages > 1 && (
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Showing Page {pagination.currentPage} of {pagination.pages} ({pagination.total} Total)
              </p>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-none text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-50 transition-all cursor-pointer"
                >
                  Prev
                </button>
                {renderPageNumbers()}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 bg-[#3AB000] text-white rounded-none text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#3AB000]/20 hover:bg-black disabled:opacity-50 transition-all cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================
           SELFIE LIGHTBOX MODAL
         ======================== */}
      {selectedSelfie && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4"
          onClick={() => setSelectedSelfie(null)}
        >
          <div className="relative bg-white p-2 border-4 border-black max-w-lg w-full rounded-none" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedSelfie(null)}
              className="absolute top-4 right-4 text-black font-black text-xl hover:text-red-600 bg-white w-8 h-8 flex items-center justify-center border-2 border-black shadow-md rounded-none z-10 cursor-pointer transition-all"
            >
              ✕
            </button>
            <img src={selectedSelfie} alt="Verification Selfie" className="w-full h-auto object-contain rounded-none border border-gray-100" />
            <div className="p-4 text-center bg-gray-50 border-t border-gray-100">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">{entityLabel} Check-In Selfie</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================
           VIEW EMPLOYEE MODAL
         ======================== */}
      {viewModalOpen && selectedEmp && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setViewModalOpen(false)}
        >
          <div
            className="relative bg-white w-full max-w-4xl max-h-[90vh] flex flex-col border-2 border-[#3AB000]/20 shadow-2xl rounded-none overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#3AB000] px-6 py-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 border border-white/30 flex items-center justify-center text-2xl font-black text-white uppercase rounded-none">
                  {(selectedEmp.employeeName || "E")[0]}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-widest leading-none">{selectedEmp.employeeName}</h2>
                  <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1">{selectedEmp.designation} — Attendance History & Metrics</p>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/20 transition-colors rounded-none"
              >
                <X size={22} className="text-white" />
              </button>
            </div>

            {/* Modal Body (scrollable) */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {empHistoryLoading ? (
                <div className="py-16 flex flex-col items-center gap-4">
                  <Loader2 size={40} className="animate-spin text-[#3AB000]" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading Attendance History...</p>
                </div>
              ) : (
                <>
                  {/* Metrics Cards */}
                  {metrics && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart2 size={14} className="text-[#3AB000]" />
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Summary Metrics</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { label: "Total Records", value: metrics.total, color: "border-gray-200 bg-gray-50", textColor: "text-gray-900" },
                          { label: "Completed", value: metrics.completed, color: "border-green-200 bg-green-50", textColor: "text-[#3AB000]" },
                          { label: "Total Hours", value: `${metrics.totalHrs}h`, color: "border-blue-200 bg-blue-50", textColor: "text-blue-600" },
                        ].map((m, i) => (
                          <div key={i} className={`p-3 border rounded-none ${m.color} text-center`}>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{m.label}</p>
                            <p className={`text-xl font-black ${m.textColor}`}>{m.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attendance History Table */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={14} className="text-[#3AB000]" />
                      <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Attendance History</span>
                      <span className="ml-auto text-[9px] font-bold text-gray-400">{empHistory.length} Records (Latest First)</span>
                    </div>
                    {empHistory.length === 0 ? (
                      <div className="py-8 text-center border border-gray-100 bg-gray-50 rounded-none">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No History Found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto overflow-y-auto max-h-[350px] border border-gray-200 rounded-none relative">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead className="sticky top-0 z-10">
                            <tr className="bg-gray-50 border-b border-gray-200 shadow-sm">
                              <th className="px-4 py-3 text-[9px] font-black text-gray-500 uppercase tracking-widest bg-gray-50">#</th>
                              <th className="px-4 py-3 text-[9px] font-black text-gray-500 uppercase tracking-widest bg-gray-50">Date</th>
                              <th className="px-4 py-3 text-[9px] font-black text-gray-500 uppercase tracking-widest bg-gray-50">Check-In</th>
                              <th className="px-4 py-3 text-[9px] font-black text-gray-500 uppercase tracking-widest bg-gray-50">Check-Out</th>
                              <th className="px-4 py-3 text-[9px] font-black text-gray-500 uppercase tracking-widest text-center bg-gray-50">Working Hrs</th>
                              <th className="px-4 py-3 text-[9px] font-black text-gray-500 uppercase tracking-widest text-center bg-gray-50">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {empHistory.map((rec, idx) => (
                              <tr key={rec._id} className="hover:bg-green-50/30 transition-colors">
                                <td className="px-4 py-3 text-[10px] font-bold text-gray-400">{idx + 1}</td>
                                <td className="px-4 py-3 text-[11px] font-black text-gray-800 uppercase">{rec.date}</td>
                                <td className="px-4 py-3 text-[11px] font-bold text-gray-700">
                                  <div className="flex flex-col">
                                    <span>{rec.checkIn ? formatTo12Hour(rec.checkIn.time) : "—"}</span>
                                    {rec.checkIn?.location?.lat && (
                                      <span className="text-[9px] text-[#3AB000] font-black flex items-center gap-1">
                                        <MapPin size={8} />{rec.checkIn.location.lat.toFixed(4)}, {rec.checkIn.location.lng.toFixed(4)}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-[11px] font-bold text-gray-700">
                                  <div className="flex flex-col">
                                    <span>{rec.checkOut ? formatTo12Hour(rec.checkOut.time) : "—"}</span>
                                    {rec.checkOut?.location?.lat && (
                                      <span className="text-[9px] text-orange-500 font-black flex items-center gap-1">
                                        <MapPin size={8} />{rec.checkOut.location.lat.toFixed(4)}, {rec.checkOut.location.lng.toFixed(4)}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center text-[11px] font-black text-gray-900">
                                  {rec.workingHours || "0.0"} Hrs
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {getStatusBadge(rec)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-xs font-black uppercase tracking-wider hover:bg-gray-100 transition-all rounded-none"
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

export default AdminAttendance;
