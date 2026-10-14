import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { leadAPI } from "../../utils/api";
import {
  Users,
  Search,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  PhoneCall,
  Trash2,
  RotateCcw,
  Check,
  X,
  History,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  ShieldCheck,
  Download
} from "lucide-react";
import toast from "react-hot-toast";
import { employeesAPI } from "../../utils/api";
import axios from "axios";

const LeadManagement = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("view") === "archived" ? "archived" : "all";

  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 10 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [callRemark, setCallRemark] = useState("");
  const [remarkAction, setRemarkAction] = useState(null);

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

  useEffect(() => {
    loadFilterCounts();
  }, [roleFilter, stateFilter, districtFilter, blockFilter]);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        search: searchQuery,
        status: statusFilter,
        role: roleFilter,
        state: stateFilter,
        district: districtFilter,
        block: blockFilter,
        panchayat: panchayatFilter
      };

      const res = activeTab === "all"
        ? await leadAPI.getAll(params)
        : await leadAPI.getArchived(params);

      if (res && res.success) {
        setLeads(res.data);
        setPagination(res.pagination || { total: res.data.length, pages: 1, limit: 10 });
      }
    } catch (err) {
      console.error("Failed to load leads:", err);
      toast.error("Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [activeTab, currentPage, statusFilter, roleFilter, stateFilter, districtFilter, blockFilter, panchayatFilter]);

  // Debounced search logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        loadLeads();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleUpdateStatus = async (status, remark) => {
    if (!selectedLead) return;
    try {
      const res = await leadAPI.updateStatus(selectedLead._id, status, remark);
      if (res && res.success) {
        toast.success(`Lead marked as ${status}`);
        setIsCallModalOpen(false);
        setCallRemark("");
        setRemarkAction(null);
        loadLeads();
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleArchive = async (id, isArchived) => {
    try {
      const res = await leadAPI.archive(id, isArchived);
      if (res && res.success) {
        toast.success(isArchived ? "Lead moved to archive" : "Lead restored");
        loadLeads();
      }
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  const handleFilterChange = (field, value) => {
    setCurrentPage(1);
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
      params.append("export", "true");
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (stateFilter !== "all") params.append("state", stateFilter);
      if (districtFilter !== "all") params.append("district", districtFilter);
      if (blockFilter !== "all") params.append("block", blockFilter);
      if (panchayatFilter !== "all") params.append("panchayat", panchayatFilter);

      const endpoint = activeTab === "all" ? "/leads" : "/leads/archived";

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}${endpoint}?${params.toString()}`,
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
      link.setAttribute("download", `Leads_${activeTab === "all" ? "Live" : "Archived"}_Export_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      clearInterval(interval);
      console.error("Export error:", err);
      toast.error("Failed to export leads data.");
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 600);
    }
  };

  const stats = {
    total: pagination.total || leads.length,
    pending: leads.filter(l => l.status === "Pending").length,
    qualified: leads.filter(l => l.status === "Qualified").length,
    disqualified: leads.filter(l => l.status === "Disqualified").length
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
              {exportProgress < 40 ? "Fetching leads data from database..."
                : exportProgress < 75 ? "Applying filters & building Excel sheet..."
                  : exportProgress < 100 ? "Finalizing & compressing file..."
                    : "✅ Download starting now!"}
            </p>
          </div>
        </div>
      )}
      <div className="p-0 ml-0 md:ml-6 px-2 md:px-0 mt-4 space-y-4 h-full max-w-[99rem]">

        {/* Top Stats - Unified Style */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mr-4">
          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{activeTab === 'all' ? 'Live Records' : 'Archived Wall'}</span>
              <span className="text-2xl font-black text-gray-800 leading-none">{isLoading ? '...' : stats.total}</span>
            </div>
            <div className="p-3 bg-gray-100 text-gray-500 rounded-full">
              <History className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">New Prospects</span>
              <span className="text-2xl font-black text-amber-500 leading-none">{isLoading ? '...' : stats.pending}</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-500 rounded-full">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Qualified Leads</span>
              <span className="text-2xl font-black text-[#3AB000] leading-none">{isLoading ? '...' : stats.qualified}</span>
            </div>
            <div className="p-3 bg-green-50 text-[#3AB000] rounded-full">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Disqualified Leads</span>
              <span className="text-2xl font-black text-red-500 leading-none">{isLoading ? '...' : stats.disqualified}</span>
            </div>
            <div className="p-3 bg-red-50 text-red-500 rounded-full">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Header Section - Filter Bar */}
        <div className="bg-white p-4 border border-gray-200 rounded-none shadow-sm space-y-4 mr-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
              <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2 capitalize">
                <ShieldCheck className="w-6 h-6 text-[#3AB000]" />
                {activeTab === "all" ? "Lead Management" : "Archived Leads"}
              </h1>
              <span className="text-[10px] font-black text-[#3AB000] capitalize tracking-wide bg-green-50 px-2 py-0.5 border border-green-100">
                Admin Control Authority
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="bg-black hover:bg-gray-800 text-white text-[11px] px-5 h-10 font-black rounded-none transition-all flex items-center gap-2 capitalize tracking-wide disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {isExporting ? "Exporting..." : "Export"}
              </button>
              <button
                onClick={loadLeads}
                className="bg-black hover:bg-gray-800 text-white text-[11px] px-5 h-10 font-black rounded-none transition-all flex items-center gap-2 capitalize tracking-wide"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 border-t border-gray-100 pt-4">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by name, mobile, type or author..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm font-bold h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="h-10 px-3 bg-white border border-gray-300 rounded-none text-xs font-black capitalize tracking-wide outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Status: All</option>
              <option value="Pending">Pending</option>
              <option value="Qualified">Qualified</option>
              <option value="Disqualified">Disqualified</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => handleFilterChange("roleFilter", e.target.value)}
              className="h-10 px-3 bg-white border border-gray-300 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
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
              className="h-10 px-3 bg-white border border-gray-300 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
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
              className="h-10 px-3 bg-white border border-gray-300 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
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
                className="h-10 px-3 bg-white border border-gray-300 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="all">All Blocks</option>
                {districtFilter !== "all" && Object.entries(filterCounts.blocks || {}).map(([block, count]) => (
                  <option key={block} value={block}>{block}</option>
                ))}
              </select>
            )}

            {(roleFilter === "all" || roleFilter === "PE") && (
              <select
                value={panchayatFilter}
                disabled={blockFilter === "all"}
                onChange={(e) => handleFilterChange("panchayatFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-300 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="all">All Panchayats</option>
                {blockFilter !== "all" && Object.entries(filterCounts.panchayats || {}).map(([panch, count]) => (
                  <option key={panch} value={panch}>{panch}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Leads Table - Sharp Style */}
        <div className="bg-white rounded-none overflow-hidden border border-gray-200 shadow-sm mr-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#3AB000]">
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">Photo</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">Prospect Name</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">Contact Number</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">Submitted By</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">Lead Category</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">Full Address</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">Verification Status</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-gray-100">
                      <td className="px-4 py-4 text-center"><div className="w-10 h-10 bg-gray-100 rounded-full mx-auto" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-32 mx-auto" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-24 mx-auto" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-28 mx-auto" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-20 mx-auto" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-32 mx-auto" /></td>
                      <td className="px-4 py-4 text-center"><div className="h-6 bg-gray-100 rounded-full w-20 mx-auto" /></td>
                      <td className="px-4 py-4 text-center"><div className="h-8 bg-gray-100 rounded w-16 mx-auto" /></td>
                    </tr>
                  ))
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-32 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-24 h-24 bg-gray-50 flex items-center justify-center rounded-full border-2 border-gray-100">
                          <Search className="w-12 h-12 text-gray-100" />
                        </div>
                        <div>
                          <p className="text-xl font-black text-gray-400 capitalize tracking-tight">No Matching Leads Found</p>
                          <p className="text-[11px] font-bold text-gray-300 uppercase tracking-[0.2em] mt-1">Try adjusting your search or filters</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead._id} className="border-b border-gray-100 hover:bg-[#e8f5e2] transition-colors">
                      <td className="px-4 py-4 text-center">
                        <div className={`w-10 h-10 flex items-center justify-center text-white font-bold rounded-full overflow-hidden mx-auto shadow-sm ${lead.status === "Qualified" ? "bg-[#3AB000]" : lead.status === "Disqualified" ? "bg-red-500" : "bg-amber-500"}`}>
                          {lead.profileImage ? (
                            <img src={lead.profileImage} alt={lead.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm">{lead.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <p className="text-sm font-bold text-gray-900 capitalize whitespace-nowrap">{lead.name}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                          <Phone size={14} className="text-[#3AB000]" /> {lead.phone}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-gray-900 capitalize whitespace-nowrap">
                            {lead.createdBy?.name || lead.createdBy?.email || lead.createdBy?.phone?.replace(/(\d{2})\d{6}(\d{2})/, "$1******$2") || "System Agent"}
                          </span>

                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          <Users size={14} className="text-[#3AB000]" /> {lead.type}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <p className="text-xs font-semibold text-gray-600 truncate max-w-[150px] mx-auto" title={lead.address}>
                          {lead.address}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {lead.status === "Qualified" && (
                          <span className="border border-green-600 text-green-700 text-[9px] font-black uppercase px-3 py-1 rounded-full bg-green-50 shadow-sm whitespace-nowrap w-fit mx-auto">
                            Qualified
                          </span>
                        )}
                        {lead.status === "Follow Up" && (
                          <span className="border border-blue-500 text-blue-600 text-[9px] font-black uppercase px-3 py-1 rounded-full bg-blue-50 shadow-sm whitespace-nowrap w-fit mx-auto">
                            Follow Up
                          </span>
                        )}
                        {lead.status === "Pending" && (
                          <span className="border border-amber-500 text-amber-600 text-[9px] font-black uppercase px-3 py-1 rounded-full bg-amber-50 shadow-sm whitespace-nowrap w-fit mx-auto">
                            Pending
                          </span>
                        )}
                        {lead.status === "Disqualified" && (
                          <span className="border border-red-600 text-red-700 text-[9px] font-black uppercase px-3 py-1 rounded-full bg-red-50 shadow-sm whitespace-nowrap w-fit mx-auto">
                            Disqualified
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {activeTab === "all" ? (
                            <>
                              <button
                                onClick={() => { setSelectedLead(lead); setIsCallModalOpen(true); }}
                                className="w-8 h-8 rounded bg-green-50 text-[#3AB000] hover:bg-[#3AB000] hover:text-white border border-green-200 flex items-center justify-center transition-all disabled:opacity-50"
                                title="Verify Call"
                              >
                                <PhoneCall size={16} />
                              </button>
                              <button
                                onClick={() => { setSelectedLead(lead); setIsHistoryModalOpen(true); }}
                                className="w-8 h-8 rounded bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 flex items-center justify-center transition-all disabled:opacity-50"
                                title="View History"
                              >
                                <History size={16} />
                              </button>
                              <button
                                onClick={() => handleArchive(lead._id, true)}
                                className="w-8 h-8 rounded bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-200 flex items-center justify-center transition-all disabled:opacity-50"
                                title="Archive Lead"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleArchive(lead._id, false)}
                              className="w-8 h-8 rounded bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-200 flex items-center justify-center transition-all disabled:opacity-50"
                              title="Restore Lead"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Component - JobPosting Style Reference */}
          {!isLoading && pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between sm:justify-end items-center gap-3 sm:gap-4 mt-6 mr-4 mb-8">
              <div className="text-xs sm:text-sm text-gray-600 sm:hidden font-black uppercase tracking-widest">
                Page {currentPage} of {pagination.pages}
              </div>
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-[#3AB000] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-black transition-all rounded-sm flex-1 sm:flex-none"
                >
                  Back
                </button>

                <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
                  {(() => {
                    const pages = [];
                    const visiblePages = new Set([
                      1,
                      2,
                      pagination.pages - 1,
                      pagination.pages,
                      currentPage - 1,
                      currentPage,
                      currentPage + 1,
                    ]);
                    for (let i = 1; i <= pagination.pages; i++) {
                      if (visiblePages.has(i)) pages.push(i);
                      else if (pages[pages.length - 1] !== "...") pages.push("...");
                    }
                    return pages.map((page, idx) =>
                      page === "..." ? (
                        <span key={idx} className="px-1 text-gray-400 select-none">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 flex items-center justify-center rounded text-[12px] transition-colors font-black ${currentPage === page
                            ? "text-[#3AB000] font-black"
                            : "text-gray-400 hover:text-[#3AB000]"
                            }`}
                        >
                          {page}
                        </button>
                      )
                    );
                  })()}
                </div>

                <div className="sm:hidden text-sm font-black text-gray-700 px-2">
                  {currentPage}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, pagination.pages))
                  }
                  disabled={currentPage === pagination.pages}
                  className="bg-[#3AB000] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-black transition-all rounded-sm flex-1 sm:flex-none"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Call Result Modal - Sharp Theme */}
        {isCallModalOpen && selectedLead && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-none border-t-8 border-[#3AB000] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
              {/* Header with Profile Pic & Close Button */}
              <div className="bg-gray-50 border-b border-gray-100 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white border-2 border-[#3AB000] rounded-none overflow-hidden shadow-lg flex-shrink-0">
                    {selectedLead.profileImage ? (
                      <img src={selectedLead.profileImage} alt={selectedLead.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#3AB000] text-white font-black text-2xl uppercase">
                        {selectedLead.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-1">Call Verification</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Prospect: <span className="text-[#3AB000]">{selectedLead.name}</span></p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsCallModalOpen(false); setRemarkAction(null); setCallRemark(""); }}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-red-500 transition-colors shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                {/* Contact & Detail Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 p-3">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Primary Contact</p>
                    <p className="text-[12px] font-black text-gray-800 flex items-center gap-2"><Phone size={12} className="text-[#3AB000]" /> {selectedLead.phone}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-3">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Lead Type</p>
                    <p className="text-[12px] font-black text-gray-800 flex items-center gap-2"><Users size={12} className="text-[#3AB000]" /> {selectedLead.type}</p>
                  </div>
                  {selectedLead.altPhone && (
                    <div className="bg-gray-50 border border-gray-200 p-3">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Alt Contact</p>
                      <p className="text-[12px] font-black text-gray-800">{selectedLead.altPhone}</p>
                    </div>
                  )}
                  {selectedLead.email && (
                    <div className="bg-gray-50 border border-gray-200 p-3">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                      <p className="text-[11px] font-black text-gray-800 truncate">{selectedLead.email}</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 border border-gray-200 p-4">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MapPin size={10} /> Full Registered Address</p>
                  <p className="text-xs font-medium text-gray-700 leading-relaxed max-h-[80px] overflow-y-auto custom-scrollbar-green pr-2">{selectedLead.address}</p>
                </div>

                {selectedLead.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4">
                    <p className="text-[9px] font-black text-yellow-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">Additional Notes</p>
                    <p className="text-xs font-medium text-gray-800 leading-relaxed max-h-[120px] overflow-y-auto custom-scrollbar-green pr-2 whitespace-pre-wrap">{selectedLead.notes}</p>
                  </div>
                )}


                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100">
                  <div className="w-8 h-8 rounded-none bg-white border border-green-200 flex items-center justify-center text-[#3AB000] font-black text-xs uppercase">
                    {selectedLead.createdBy?.name?.[0] || "A"}
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Submitted By</p>
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">{selectedLead.createdBy?.name || "Unknown Author"}</p>
                  </div>
                </div>

                {/* Call Remark Section or Action Buttons */}
                <div className="pt-4 border-t border-gray-100">
                  {selectedLead.status === "Qualified" || selectedLead.status === "Disqualified" ? (
                    <div className={`p-4 border ${selectedLead.status === "Qualified" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                      <p className={`text-[11px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 ${selectedLead.status === "Qualified" ? "text-green-700" : "text-red-700"}`}>
                        {selectedLead.status === "Qualified" ? <CheckCircle size={14} /> : <X size={14} />}
                        {selectedLead.status === "Qualified" 
                          ? "This lead has already been successfully converted to a client." 
                          : "This lead has already been disqualified and rejected."}
                      </p>
                    </div>
                  ) : !remarkAction ? (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Convert to Client Button (Full Width) */}
                      <button
                        onClick={() => setRemarkAction("Qualified")}
                        className="col-span-2 flex flex-col items-center justify-center gap-2 bg-[#3AB000] text-white py-4 rounded-none font-black transition-all hover:bg-black group shadow-lg"
                      >
                        <CheckCircle size={20} className="transition-transform group-hover:scale-110" />
                        <span className="text-[9px] uppercase tracking-[0.1em]">Convert to Client</span>
                      </button>

                      {/* Follow Up Button */}
                      <button
                        onClick={() => setRemarkAction("Follow Up")}
                        className="flex flex-col items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-none font-black transition-all hover:bg-black group shadow-lg"
                      >
                        <Phone size={20} className="transition-transform group-hover:scale-110" />
                        <span className="text-[9px] uppercase tracking-[0.1em]">
                          {selectedLead.status === "Pending" ? "Mark Follow Up" : "Add Follow Up"}
                        </span>
                      </button>

                      {/* Disqualify Button */}
                      <button
                        onClick={() => setRemarkAction("Disqualified")}
                        className="flex flex-col items-center justify-center gap-2 bg-red-600 text-white py-4 rounded-none font-black transition-all hover:bg-black group shadow-lg"
                      >
                        <X size={20} className="transition-transform group-hover:scale-110" />
                        <span className="text-[9px] uppercase tracking-[0.1em]">Disqualify / Reject</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Call Summary / Remarks</label>
                        <textarea
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 focus:border-[#3AB000] rounded-none text-sm font-bold outline-none transition-all min-h-[100px] resize-none"
                          placeholder={`Enter remark for marking as ${remarkAction}...`}
                          value={callRemark}
                          onChange={(e) => setCallRemark(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setRemarkAction(null)}
                          className="flex-1 px-4 py-3 border-2 border-black text-black font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(remarkAction, callRemark)}
                          className={`flex-1 px-4 py-3 text-white font-black text-[10px] uppercase tracking-widest transition-all ${remarkAction === "Qualified" ? "bg-[#3AB000] hover:bg-black" : remarkAction === "Follow Up" ? "bg-blue-600 hover:bg-black" : "bg-red-600 hover:bg-black"}`}
                        >
                          Save & {remarkAction}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { setIsCallModalOpen(false); setRemarkAction(null); setCallRemark(""); }}
                  className="w-full text-[9px] font-black text-gray-400 uppercase tracking-widest py-2 hover:text-red-500 transition-colors mt-4"
                >
                  Discard Verification
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Follow Up History Modal */}
        {isHistoryModalOpen && selectedLead && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-none border-t-8 border-blue-600 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
              <div className="bg-gray-50 border-b border-gray-100 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-1">Follow Up History</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prospect: <span className="text-blue-600">{selectedLead.name}</span></p>
                </div>
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-red-500 transition-colors shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
                {selectedLead.history && selectedLead.history.length > 0 ? (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-300 before:to-transparent">
                    {selectedLead.history.slice().reverse().map((item, index) => (
                      <div key={index} className="relative flex items-start gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-gray-50 bg-white text-blue-600 shrink-0 shadow-sm z-10">
                          <History size={16} />
                        </div>
                        <div className="flex-1 bg-white p-4 border border-gray-200 shadow-sm mt-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-gray-100 pb-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 inline-block w-fit ${item.status === 'Qualified' ? 'bg-green-100 text-green-700' : item.status === 'Disqualified' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {item.status}
                            </span>
                            <time className="text-[10px] font-bold text-gray-400">
                              {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </time>
                          </div>
                          <p className="text-xs font-bold text-gray-700 leading-relaxed whitespace-pre-wrap">{item.remark}</p>
                          {item.updatedBy && item.updatedBy.name && (
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-3">Updated By: <span className="text-gray-700">{item.updatedBy.name}</span></p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-sm font-bold text-gray-400">No follow-up history available yet.</p>
                    {selectedLead.callRemark && (
                      <div className="mt-4 bg-white p-4 border border-gray-200 shadow-sm text-left inline-block">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Previous Admin Remark</p>
                        <p className="text-sm font-bold text-gray-700">{selectedLead.callRemark}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LeadManagement;
