import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { employeesAPI, walletAPI } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import statesData from "../../data/states.json";
import {
  Search,
  User,
  Filter,
  Loader2,
  RefreshCcw,
  AlertCircle,
  MapPin,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Map,
  Globe,
  Settings,
  Users,
  BarChart2,
  Eye,
  Download
} from "lucide-react";
import { toast } from "react-hot-toast";

const GREEN = "#3AB000";

const AdminZoneSelection = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, locked, unlocked
  const [empTypeFilter, setEmpTypeFilter] = useState("All"); // All, New, Old

  // Pagination State
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 15 });

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Filters State
  const [roleFilter, setRoleFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [blockFilter, setBlockFilter] = useState("all");
  const [panchayatFilter, setPanchayatFilter] = useState("all");
  const [filterCounts, setFilterCounts] = useState({ states: {}, districts: {}, blocks: {}, panchayats: {} });

  const loadFilterCounts = async () => {
    try {
      const res = await employeesAPI.getZoneFilterCounts({
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

  const handleFilterChange = (filterName, value) => {
    if (filterName === "roleFilter") {
      setRoleFilter(value);
      setStateFilter("all");
      setDistrictFilter("all");
      setBlockFilter("all");
      setPanchayatFilter("all");
    } else if (filterName === "stateFilter") {
      setStateFilter(value);
      setDistrictFilter("all");
      setBlockFilter("all");
      setPanchayatFilter("all");
    } else if (filterName === "districtFilter") {
      setDistrictFilter(value);
      setBlockFilter("all");
      setPanchayatFilter("all");
    } else if (filterName === "blockFilter") {
      setBlockFilter(value);
      setPanchayatFilter("all");
    } else if (filterName === "panchayatFilter") {
      setPanchayatFilter(value);
    }
    setPage(1);
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
        panchayat: panchayatFilter !== "all" ? panchayatFilter : "",
        filterType,
        empType: empTypeFilter
      };
      
      const blob = await walletAPI.exportAdminEmployeesCSV(params);

      clearInterval(interval);
      setExportProgress(100);

      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Zone_Eligible_Employees_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`
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

  // =====================
  //  ZONE SELECTION FETCH
  // =====================
  const fetchEmployees = async (pageNum = 1) => {
    try {
      setLoading(true);
      const params = {
        page: pageNum,
        limit: 15,
        search,
        filterType,
        empType: empTypeFilter
      };
      if (roleFilter !== "all") params.role = roleFilter;
      if (stateFilter !== "all") params.state = stateFilter;
      if (districtFilter !== "all") params.district = districtFilter;
      if (blockFilter !== "all") params.block = blockFilter;
      if (panchayatFilter !== "all") params.panchayat = panchayatFilter;

      const res = await employeesAPI.getZoneEligible(params);
      if (res.success) {
        setEmployees(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
          setPage(res.pagination.page);
        }
      } else {
        toast.error(res.error || "Failed to fetch eligible employees");
      }
    } catch (error) {
      console.error("Fetch Zone Eligible Error:", error);
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search / filter trigger for zone selection
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSelectedIds([]);
      fetchEmployees(1);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search, filterType, empTypeFilter, roleFilter, stateFilter, districtFilter, blockFilter, panchayatFilter]);



  // =====================
  //  ZONE SELECTION LOGIC
  // =====================
  const handleUnlockZone = async (empId, name) => {
    if (window.confirm(`Are you sure you want to unlock the territory for ${name}? They will be removed from the hierarchy and will need a new working zone.`)) {
      try {
        setLoading(true);
        const res = await employeesAPI.adminManageZone(empId, { action: "UNLOCK" });
        if (res.success) {
          toast.success(`Zone for ${name} unlocked successfully!`);
          setSelectedIds(prev => prev.filter(id => id !== empId));
          fetchEmployees(page);
        } else {
          toast.error(res.error || "Failed to unlock zone");
        }
      } catch (error) {
        console.error("Unlock zone error:", error);
        toast.error("Network error occurred");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkUnlock = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to unlock zones for all ${selectedIds.length} selected employees?`)) {
      try {
        setLoading(true);
        const res = await employeesAPI.adminBulkUnlockZones(selectedIds);
        if (res.success) {
          toast.success(`Successfully unlocked ${selectedIds.length} zones!`);
          setSelectedIds([]);
          fetchEmployees(1);
        } else {
          toast.error(res.error || "Failed to unlock zones");
        }
      } catch (error) {
        console.error("Bulk unlock error:", error);
        toast.error("Network error occurred");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelectAll = async (e) => {
    if (e.target.checked) {
      try {
        setLoading(true);
        const params = { search, filterType, empType: empTypeFilter };
        if (roleFilter !== "all") params.role = roleFilter;
        if (stateFilter !== "all") params.state = stateFilter;
        if (districtFilter !== "all") params.district = districtFilter;
        if (blockFilter !== "all") params.block = blockFilter;
        if (panchayatFilter !== "all") params.panchayat = panchayatFilter;

        const res = await employeesAPI.getZoneEligibleIds(params);
        if (res.success) {
          setSelectedIds(res.ids || []);
          toast.success(`Selected all ${res.ids?.length || 0} locked employees globally!`);
        } else {
          toast.error("Failed to select employees globally");
        }
      } catch (error) {
        console.error("Global select all error:", error);
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (empId, isChecked) => {
    if (isChecked) {
      setSelectedIds(prev => [...prev, empId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== empId));
    }
  };

  const lockableEmployeesOnPage = employees.filter(emp => emp.isZoneLocked);
  const isAllSelected = lockableEmployeesOnPage.length > 0 &&
    lockableEmployeesOnPage.every(emp => selectedIds.includes(emp._id));

  const renderTerritoryBadges = (emp) => {
    if (!emp.isZoneLocked) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 text-[10px] font-black uppercase tracking-wider rounded-none animate-pulse">
          ⏳ Awaiting Allocation
        </span>
      );
    }

    const stateStr = emp.workingState || "Bihar";
    const districtStr = emp.workingDistrict || "";
    let subStr = "";
    if (emp.role === "DM") {
      if (emp.isAllBlocksAssigned) subStr = "🌍 All Blocks";
      else if (emp.workingBlocks && emp.workingBlocks.length > 0) subStr = `${emp.workingBlocks.length} Blocks`;
      else if (emp.workingBlock) subStr = emp.workingBlock.name || "1 Block";
    } else if (emp.role === "BS") {
      const blockPart = emp.workingBlock?.name || "Block";
      if (emp.isAllPanchayatsAssigned) subStr = `${blockPart} > 🌍 All Panchayats`;
      else if (emp.workingPanchayats && emp.workingPanchayats.length > 0) subStr = `${blockPart} > ${emp.workingPanchayats.length} Panchayats`;
      else if (emp.workingPanchayat) subStr = `${blockPart} > ${emp.workingPanchayat.name || "1 Panchayat"}`;
    } else if (emp.role === "PE") {
      const blockPart = emp.workingBlock?.name || "Block";
      const panchPart = emp.workingPanchayat?.name || "Panchayat";
      subStr = `${blockPart} > ${panchPart}`;
    }

    return (
      <div className="inline-flex flex-col items-center gap-1 bg-green-50/50 border border-[#3AB000]/20 p-2.5 rounded-none min-w-[170px]">
        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1">
          <MapPin size={11} className="text-[#3AB000]" /> {districtStr || stateStr}
        </span>
        {subStr && (
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight truncate max-w-[200px]">
            {subStr}
          </span>
        )}
      </div>
    );
  };

  const getRoleBadge = (role) => {
    const styles = {
      RM: "bg-red-50 text-red-600 border-red-100",
      ZC: "bg-orange-50 text-orange-600 border-orange-100",
      DM: "bg-blue-50 text-blue-600 border-blue-100",
      BS: "bg-purple-50 text-purple-600 border-purple-100",
      PE: "bg-green-50 text-green-600 border-green-100",
    };
    return styles[role] || "bg-gray-50 text-gray-600 border-gray-100";
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
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30">
                <Map className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Zone Selection</h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Territorial Allocation & Reporting Hierarchy Control</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-none text-center md:text-right shrink-0">
              <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Total Candidates</p>
              <p className="text-xl font-black text-white uppercase mt-1">{pagination.total} Employees</p>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-gray-50 border border-gray-150 p-4 rounded-none flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkUnlock}
                  className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-none transition-all flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200"
                >
                  <Unlock size={14} /> Bulk Unlock ({selectedIds.length})
                </button>
              )}
              <div className="text-xs font-black text-gray-500 uppercase tracking-wider pl-1">
                {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select rows to bulk unlock"}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center border border-gray-250 rounded-none overflow-hidden h-12 w-full sm:w-80 bg-white transition-all focus-within:ring-2 focus-within:ring-[#3AB000]/10 focus-within:border-[#3AB000]">
                <input
                  type="text"
                  placeholder="Search by name, district..."
                  className="flex-1 px-4 text-xs font-bold uppercase tracking-wider outline-none text-gray-800"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="bg-[#3AB000] h-full flex items-center px-4 text-white">
                  <Search size={16} />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  className="h-12 px-4 bg-white border border-gray-250 rounded-none text-xs font-black uppercase tracking-wider outline-none transition-all cursor-pointer text-gray-700 focus:border-[#3AB000]"
                  value={empTypeFilter}
                  onChange={(e) => setEmpTypeFilter(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="New">NEW Employees</option>
                  <option value="Old">OLD Employees</option>
                </select>
                <select
                  className="h-12 px-4 bg-white border border-gray-250 rounded-none text-xs font-black uppercase tracking-wider outline-none transition-all cursor-pointer text-gray-700 focus:border-[#3AB000]"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Zone Status</option>
                  <option value="locked">🔒 Locked Zones</option>
                  <option value="unlocked">🔓 Unlocked Zones</option>
                </select>

                <button
                  onClick={() => fetchEmployees(page)}
                  className="h-12 w-12 flex items-center justify-center bg-white border border-gray-250 text-gray-400 hover:text-[#3AB000] hover:border-[#3AB000] rounded-none transition-all group"
                  title="Refresh data"
                >
                  <RefreshCcw size={16} className={`${loading ? "animate-spin" : ""} group-active:rotate-180 transition-transform`} />
                </button>
              </div>
            </div>
          </div>

          {/* Directory Filters */}
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              <select
                value={roleFilter}
                onChange={(e) => handleFilterChange("roleFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
              >
                <option value="all">All Roles</option>
                <option value="RM">Regional Manager (RM)</option>
                <option value="ZC">Zonal Coordinator (ZC)</option>
                <option value="DM">District Manager (DM)</option>
                <option value="BS">Block Supervisor (BS)</option>
                <option value="PE">Panchayat Executive (PE)</option>
              </select>

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

              <select
                value={districtFilter}
                disabled={stateFilter === "all"}
                onChange={(e) => handleFilterChange("districtFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="all">All Districts</option>
                {stateFilter !== "all" && Object.entries(filterCounts.districts || {}).map(([dist]) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>

              <select
                value={blockFilter}
                disabled={districtFilter === "all"}
                onChange={(e) => handleFilterChange("blockFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="all">All Blocks</option>
                {districtFilter !== "all" && Object.entries(filterCounts.blocks || {}).map(([blk]) => (
                  <option key={blk} value={blk}>{blk}</option>
                ))}
              </select>

              <select
                value={panchayatFilter}
                disabled={blockFilter === "all"}
                onChange={(e) => handleFilterChange("panchayatFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="all">All Panchayats</option>
                {blockFilter !== "all" && Object.entries(filterCounts.panchayats || {}).map(([panch]) => (
                  <option key={panch} value={panch}>{panch}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-none border border-gray-200 overflow-hidden relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 size={40} className="animate-spin text-[#3AB000]" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Synchronizing Territorial Data...</p>
              </div>
            )}

            {employees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 font-black uppercase text-[10px] tracking-widest border-b border-gray-150">
                      <th className="p-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          disabled={lockableEmployeesOnPage.length === 0}
                          className="w-4 h-4 accent-[#3AB000] cursor-pointer rounded-none border-gray-300 focus:ring-0 focus:ring-offset-0 disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </th>
                      <th className="p-4">Employee Information</th>
                      <th className="p-4 text-center">Role / Designation</th>
                      <th className="p-4 text-center">Type</th>
                      <th className="p-4 text-center">Current Allocation</th>
                      <th className="p-4 text-center">Zone Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employees.map((emp) => (
                      <tr key={emp._id} className="transition-colors hover:bg-gray-50/30">
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(emp._id)}
                            onChange={(e) => handleSelectRow(emp._id, e.target.checked)}
                            disabled={!emp.isZoneLocked}
                            className="w-4 h-4 accent-[#3AB000] cursor-pointer rounded-none border-gray-300 focus:ring-0 focus:ring-offset-0 disabled:opacity-30 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-none bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                              <User size={18} />
                            </div>
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate max-w-[200px]">{emp.name}</p>
                                <span className="text-[9px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 border border-gray-150 uppercase rounded-none">
                                  ID: {emp.userId?._id?.toString().slice(-6).toUpperCase() || 'NEW'}
                                </span>
                              </div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1 truncate max-w-[320px]">
                                {emp.userId?.phone || emp.mobile || 'No Phone'} | {emp.userId?.email || emp.email || 'No Email'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-none uppercase tracking-wider border ${getRoleBadge(emp.role)}`}>
                              {emp.role || 'Employee'}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mt-1 max-w-[150px] truncate">
                              {emp.designation || "Not Assigned"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {emp.employeeType === 'New' ? (
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                              New
                            </span>
                          ) : emp.employeeType === 'Old' ? (
                            <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                              Old
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {renderTerritoryBadges(emp)}
                        </td>
                        <td className="p-4 text-center">
                          {emp.isZoneLocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 text-[9px] font-black uppercase tracking-wider rounded-none">
                              <Lock size={9} /> Locked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-[#3AB000] border border-green-100 text-[9px] font-black uppercase tracking-wider rounded-none">
                              <Unlock size={9} /> Unallocated
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/admin/zone-assignment/${emp._id}`)}
                              className="px-3.5 py-2 bg-[#3AB000] hover:bg-[#2d8a00] text-white text-[10px] font-black uppercase tracking-wider rounded-none transition-all flex items-center justify-center gap-1 hover:scale-[1.03]"
                            >
                              <Settings size={12} /> Zone Selection
                            </button>
                            {emp.isZoneLocked && (
                              <button
                                onClick={() => handleUnlockZone(emp._id, emp.name)}
                                className="px-2.5 py-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white text-[10px] font-black uppercase rounded-none transition-all"
                                title="Unlock Territory"
                              >
                                <Unlock size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !loading && (
              <div className="py-24 flex flex-col items-center justify-center gap-4 text-center animate-in fade-in duration-500">
                <div className="p-4 bg-gray-50 border border-gray-150 text-gray-300 rounded-none">
                  <AlertCircle size={40} />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900 uppercase">No Employees Found</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">Try adjusting your filters or search terms</p>
                </div>
              </div>
            )}
          </div>

          {/* Pagination UI — Zone Selection */}
          {pagination.pages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between mt-8 gap-4 px-2">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Showing {employees.length} of {pagination.total} Employees
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => fetchEmployees(page - 1)}
                  className="px-4 py-2 bg-white border border-gray-250 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                    let pageNum = 1;
                    if (pagination.pages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
                    else pageNum = page - 2 + i;
                    if (pageNum > pagination.pages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchEmployees(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center text-[10px] font-black transition-all border rounded-none ${page === pageNum
                          ? "bg-[#3AB000] border-[#3AB000] text-white scale-110"
                          : "bg-white border-gray-250 text-gray-400 hover:border-[#3AB000]"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={page === pagination.pages}
                  onClick={() => fetchEmployees(page + 1)}
                  className="px-4 py-2 bg-white border border-gray-250 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}


        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminZoneSelection;
