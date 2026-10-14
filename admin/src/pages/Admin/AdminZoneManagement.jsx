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
  AlertCircle,
  MapPin,
  Lock,
  Unlock,
  Map,
  Users,
  Download
} from "lucide-react";
import { toast } from "react-hot-toast";

const AdminZoneManagement = () => {
  const navigate = useNavigate();

  // === ZONE MANAGEMENT SECTION STATE ===
  const [zmEmployees, setZmEmployees] = useState([]);
  const [zmLoading, setZmLoading] = useState(true);
  const [zmPage, setZmPage] = useState(1);
  const [zmPagination, setZmPagination] = useState({ page: 1, pages: 1, total: 0, limit: 15 });
  const [zmRoleCounts, setZmRoleCounts] = useState({ dm: 0, bs: 0, pe: 0, total: 0 });

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

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
        search: zmSearch,
        role: zmRole !== "all" ? zmRole : "",
        state: zmState !== "all" ? zmState : "",
        district: zmDistrict !== "all" ? zmDistrict : "",
        block: zmBlock !== "all" ? zmBlock : "",
        panchayat: zmPanchayat !== "all" ? zmPanchayat : "",
        filterType: "locked"
      };
      
      const blob = await walletAPI.exportAdminEmployeesCSV(params);

      clearInterval(interval);
      setExportProgress(100);

      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Zone_Management_Employees_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`
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

  // Zone Management Filters
  const [zmSearch, setZmSearch] = useState("");
  const [zmRole, setZmRole] = useState("all");
  const [zmState, setZmState] = useState("all");
  const [zmDistrict, setZmDistrict] = useState("all");
  const [zmBlock, setZmBlock] = useState("all");
  const [zmPanchayat, setZmPanchayat] = useState("all");

  // Available options for dropdowns (extracted from counts api)
  const [filterCounts, setFilterCounts] = useState({ states: {}, districts: {}, blocks: {}, panchayats: {} });

  const loadFilterCounts = async () => {
    try {
      const res = await employeesAPI.getZoneFilterCounts({
        role: zmRole !== "all" ? zmRole : "",
        state: zmState !== "all" ? zmState : "",
        district: zmDistrict !== "all" ? zmDistrict : "",
        block: zmBlock !== "all" ? zmBlock : ""
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
  }, [zmRole, zmState, zmDistrict, zmBlock]);

  // ========================
  //  ZONE MANAGEMENT FETCH
  // ========================
  const fetchZmEmployees = useCallback(async (pageNum = 1, overrideFilters = null) => {
    try {
      setZmLoading(true);
      const filters = overrideFilters || { zmSearch, zmRole, zmState, zmDistrict, zmBlock, zmPanchayat };
      const params = {
        page: pageNum,
        limit: 15,
        filterType: "locked",
        search: filters.zmSearch || "",
      };
      if (filters.zmRole && filters.zmRole !== "all") params.role = filters.zmRole;
      if (filters.zmState && filters.zmState !== "all") params.state = filters.zmState;
      if (filters.zmDistrict && filters.zmDistrict !== "all") params.district = filters.zmDistrict;
      if (filters.zmBlock && filters.zmBlock !== "all") params.block = filters.zmBlock;
      if (filters.zmPanchayat && filters.zmPanchayat !== "all") params.panchayat = filters.zmPanchayat;

      const res = await employeesAPI.getZoneEligible(params);
      if (res.success) {
        setZmEmployees(res.data || []);
        if (res.pagination) {
          setZmPagination(res.pagination);
          setZmPage(res.pagination.page);
        }
        if (res.roleCounts) {
          setZmRoleCounts(res.roleCounts);
        }
      } else {
        toast.error(res.error || "Failed to fetch zone management data");
      }
    } catch (error) {
      console.error("Fetch ZM Error:", error);
      toast.error("Network error occurred");
    } finally {
      setZmLoading(false);
    }
  }, [zmSearch, zmRole, zmState, zmDistrict, zmBlock, zmPanchayat]);

  // Initial load for zone management
  useEffect(() => {
    fetchZmEmployees(1);
  }, []);

  // Debounce zm search
  useEffect(() => {
    const timer = setTimeout(() => {
      setZmPage(1);
      fetchZmEmployees(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [zmSearch]);

  // Immediate trigger for dropdown filters
  const handleZmFilterChange = (field, value) => {
    const newFilters = { zmSearch, zmRole, zmState, zmDistrict, zmBlock, zmPanchayat, [field]: value };
    if (field === "zmRole") { setZmRole(value); newFilters.zmState = "all"; newFilters.zmDistrict = "all"; newFilters.zmBlock = "all"; newFilters.zmPanchayat = "all"; setZmState("all"); setZmDistrict("all"); setZmBlock("all"); setZmPanchayat("all"); }
    if (field === "zmState") { setZmState(value); newFilters.zmDistrict = "all"; newFilters.zmBlock = "all"; newFilters.zmPanchayat = "all"; setZmDistrict("all"); setZmBlock("all"); setZmPanchayat("all"); }
    if (field === "zmDistrict") { setZmDistrict(value); newFilters.zmBlock = "all"; newFilters.zmPanchayat = "all"; setZmBlock("all"); setZmPanchayat("all"); }
    if (field === "zmBlock") { setZmBlock(value); newFilters.zmPanchayat = "all"; setZmPanchayat("all"); }
    if (field === "zmPanchayat") setZmPanchayat(value);
    setZmPage(1);
    fetchZmEmployees(1, newFilters);
  };

  const handleZmUnlockZone = async (empId, name) => {
    if (window.confirm(`Are you sure you want to unlock the territory for ${name}? They will be removed from the hierarchy.`)) {
      try {
        setZmLoading(true);
        const res = await employeesAPI.adminManageZone(empId, { action: "UNLOCK" });
        if (res.success) {
          toast.success(`Zone for ${name} unlocked successfully!`);
          fetchZmEmployees(zmPage);
        } else {
          toast.error(res.error || "Failed to unlock zone");
        }
      } catch (error) {
        toast.error("Network error occurred");
      } finally {
        setZmLoading(false);
      }
    }
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
          <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30">
                <Map className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Zone Management</h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Territorial Allocation & Reporting Hierarchy Control</p>
              </div>
            </div>

          </div>


          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "District Managers", count: zmRoleCounts.dm, color: "from-blue-500 to-blue-600", bg: "bg-blue-50", text: "text-blue-600", badge: "DM" },
              { label: "Block Supervisors", count: zmRoleCounts.bs, color: "from-purple-500 to-purple-600", bg: "bg-purple-50", text: "text-purple-600", badge: "BS" },
              { label: "Panchayat Executives", count: zmRoleCounts.pe, color: "from-green-500 to-green-600", bg: "bg-green-50", text: "text-green-600", badge: "PE" },
              { label: "Total Assigned", count: zmRoleCounts.total, color: "from-[#3AB000] to-[#2d8a00]", bg: "bg-green-50", text: "text-[#3AB000]", badge: "ALL" },
            ].map((card, i) => (
              <div key={i} className="bg-white border border-gray-200 p-5 rounded-none shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
                  <p className="text-2xl font-black text-gray-900">{card.count}</p>
                </div>
                <div className={`w-10 h-10 rounded-none bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <span className="text-[9px] font-black text-white">{card.badge}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Zone Management Filter Panel */}
          <div className="bg-white border border-gray-200 p-4 mb-4 rounded-none shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-[#3AB000]" />
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Global Filters</span>
                <span className="text-[9px] font-bold text-gray-400 hidden md:inline-block ml-2">| Filter changes auto-apply to all pages</span>
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
              <div className="flex items-center border border-gray-200 rounded-none overflow-hidden h-10 bg-white focus-within:border-[#3AB000] xl:col-span-2">
                <input
                  type="text"
                  placeholder="Search by name..."
                  className="flex-1 px-3 text-xs font-bold uppercase tracking-wide outline-none text-gray-800"
                  value={zmSearch}
                  onChange={(e) => setZmSearch(e.target.value)}
                />
                <div className="bg-[#3AB000] h-full flex items-center px-3 text-white">
                  <Search size={14} />
                </div>
              </div>

              {/* Role */}
              <select
                value={zmRole}
                onChange={(e) => handleZmFilterChange("zmRole", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
              >
                <option value="all">All Roles</option>
                <option value="RM">Regional Manager (RM)</option>
                <option value="ZC">Zonal Coordinator (ZC)</option>
                <option value="DM">District Manager (DM)</option>
                <option value="BS">Block Supervisor (BS)</option>
                <option value="PE">Panchayat Executive (PE)</option>
              </select>

              {/* State */}
              <select
                value={zmState}
                onChange={(e) => handleZmFilterChange("zmState", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
              >
                <option value="all">All States</option>
                {statesData.map((st, i) => (
                  <option key={i} value={st}>{st}</option>
                ))}
              </select>

              {/* District */}
              <select
                value={zmDistrict}
                disabled={zmState === "all"}
                onChange={(e) => handleZmFilterChange("zmDistrict", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="all">All Districts</option>
                {zmState !== "all" && Object.entries(filterCounts.districts || {}).map(([dist, count]) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>

              {/* Block (Hidden for DM) */}
              {(zmRole === "all" || zmRole === "BS" || zmRole === "PE") && (
                <select
                  value={zmBlock}
                  disabled={zmDistrict === "all"}
                  onChange={(e) => handleZmFilterChange("zmBlock", e.target.value)}
                  className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="all">All Blocks</option>
                  {zmDistrict !== "all" && Object.entries(filterCounts.blocks || {}).map(([block, count]) => (
                    <option key={block} value={block}>{block}</option>
                  ))}
                </select>
              )}

              {/* Panchayat (Hidden for DM, BS) */}
              {(zmRole === "all" || zmRole === "PE") && (
                <select
                  value={zmPanchayat}
                  disabled={zmBlock === "all"}
                  onChange={(e) => handleZmFilterChange("zmPanchayat", e.target.value)}
                  className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="all">All Panchayats</option>
                  {zmBlock !== "all" && Object.entries(filterCounts.panchayats || {}).map(([panch, count]) => (
                    <option key={panch} value={panch}>{panch}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Zone Management Table */}
          <div className="bg-white rounded-none border border-gray-200 overflow-hidden relative min-h-[300px] shadow-sm">
            {zmLoading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-4">
                <Loader2 size={36} className="animate-spin text-[#3AB000]" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Loading Assigned Employees...</p>
              </div>
            )}

            {zmEmployees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#3AB000] text-white font-black uppercase text-[10px] tracking-widest">
                      <th className="p-4 w-12">#</th>
                      <th className="p-4">Employee</th>
                      <th className="p-4 text-center">Role</th>
                      <th className="p-4">Designation</th>
                      <th className="p-4">State</th>
                      <th className="p-4">District</th>
                      <th className="p-4">Block</th>
                      <th className="p-4">Panchayat</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {zmEmployees.map((emp, idx) => (
                      <tr key={emp._id} className="hover:bg-green-50/30 transition-colors">
                        <td className="p-4 text-[11px] font-black text-gray-400">
                          {(zmPage - 1) * 15 + idx + 1}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 rounded-none shrink-0">
                              <User size={14} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{emp.name}</p>
                              <p className="text-[9px] font-bold text-gray-400 mt-0.5">{emp.userId?.phone || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-none uppercase tracking-wider border ${getRoleBadge(emp.role)}`}>
                            {emp.role || "—"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold text-gray-600 uppercase">{emp.designation || "—"}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold text-gray-700">{emp.workingState || "—"}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold text-gray-700">{emp.workingDistrict || "—"}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold text-gray-700">{emp.workingBlock?.name || "—"}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold text-gray-700">{emp.workingPanchayat?.name || "—"}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 border border-red-100 text-[9px] font-black uppercase tracking-wider rounded-none">
                            <Lock size={8} /> Locked
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleZmUnlockZone(emp._id, emp.name)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white text-[9px] font-black uppercase tracking-wider rounded-none transition-all flex items-center gap-1 ml-auto"
                          >
                            <Unlock size={10} /> Unlock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !zmLoading && (
              <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
                <div className="p-4 bg-gray-50 border border-gray-150 text-gray-200 rounded-none">
                  <AlertCircle size={36} />
                </div>
                <p className="text-xs font-black text-gray-400 uppercase">No Assigned Employees Found</p>
                <p className="text-[10px] text-gray-300 uppercase tracking-widest font-bold">Try adjusting filters</p>
              </div>
            )}
          </div>

          {/* Zone Management Pagination */}
          {zmPagination.pages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4 px-2">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Showing {zmEmployees.length} of {zmPagination.total} Assigned Employees
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={zmPage === 1}
                  onClick={() => fetchZmEmployees(zmPage - 1)}
                  className="px-4 py-2 bg-white border border-gray-250 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, zmPagination.pages))].map((_, i) => {
                    let pageNum = 1;
                    if (zmPagination.pages <= 5) pageNum = i + 1;
                    else if (zmPage <= 3) pageNum = i + 1;
                    else if (zmPage >= zmPagination.pages - 2) pageNum = zmPagination.pages - 4 + i;
                    else pageNum = zmPage - 2 + i;
                    if (pageNum > zmPagination.pages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchZmEmployees(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center text-[10px] font-black transition-all border rounded-none ${zmPage === pageNum
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
                  disabled={zmPage === zmPagination.pages}
                  onClick={() => fetchZmEmployees(zmPage + 1)}
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

export default AdminZoneManagement;
