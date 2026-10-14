import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { resignationAPI } from "../../utils/api";
import {
  LogOut,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  X,
  History,
  User,
  Download,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { employeesAPI } from "../../utils/api";
import axios from "axios";

const GREEN = "#3AB000";

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const AdminResignationManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedReq, setSelectedReq] = useState(null);
  const [remarks, setRemarks] = useState("");

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

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (roleFilter !== "all") params.role = roleFilter;
      if (stateFilter !== "all") params.state = stateFilter;
      if (districtFilter !== "all") params.district = districtFilter;
      if (blockFilter !== "all") params.block = blockFilter;
      if (panchayatFilter !== "all") params.panchayat = panchayatFilter;

      const res = await resignationAPI.getAllAdmin(params);
      if (res.success) setRequests(res.data);
    } catch {
      toast.error("Failed to load resignation requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, roleFilter, stateFilter, districtFilter, blockFilter, panchayatFilter]);

  const handleFilterChange = (field, value) => {
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
      if (search) params.append("search", search);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (stateFilter !== "all") params.append("state", stateFilter);
      if (districtFilter !== "all") params.append("district", districtFilter);
      if (blockFilter !== "all") params.append("block", blockFilter);
      if (panchayatFilter !== "all") params.append("panchayat", panchayatFilter);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/resignations/admin/all?${params.toString()}`,
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
      link.setAttribute("download", `Resignations_Export_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      clearInterval(interval);
      console.error("Export error:", err);
      toast.error("Failed to export resignation data.");
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 600);
    }
  };

  const openModal = (req, type) => {
    setSelectedReq(req);
    setModalType(type);
    setRemarks("");
    setShowModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!remarks.trim()) {
      toast.error("Please provide remarks");
      return;
    }
    try {
      setUpdating(true);
      const status = modalType === "Approve" ? "Approved" : "Rejected";
      const res = await resignationAPI.updateAdminStatus(selectedReq._id, {
        status,
        adminRemarks: remarks,
      });
      if (res.success) {
        toast.success(`Resignation ${status.toLowerCase()}`);
        setShowModal(false);
        fetchRequests();
      }
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const filtered = requests.filter((r) => {
    const q = search.toLowerCase();
    const emp = r.employeeId;
    const user = r.userId;
    return (
      emp?.name?.toLowerCase().includes(q) ||
      emp?.designation?.toLowerCase().includes(q) ||
      user?.email?.toLowerCase().includes(q) ||
      user?.phone?.includes(search) ||
      r.reason?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "Pending").length,
    approved: requests.filter((r) => r.status === "Approved").length,
    rejected: requests.filter((r) => r.status === "Rejected").length,
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
              {exportProgress < 40 ? "Fetching resignation data from database..." 
                : exportProgress < 75 ? "Applying filters & building Excel sheet..."
                : exportProgress < 100 ? "Finalizing & compressing file..."
                : "✅ Download starting now!"}
            </p>
          </div>
        </div>
      )}
      <div className="p-0 ml-0 md:ml-6 px-2 md:px-0 mt-4 space-y-4 h-full max-w-[99rem]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mr-4">
          <StatCard label="Total" value={stats.total} icon={<History className="w-5 h-5" />} />
          <StatCard label="Pending" value={stats.pending} icon={<Clock className="w-5 h-5" />} color="text-amber-500" />
          <StatCard label="Approved" value={stats.approved} icon={<CheckCircle2 className="w-5 h-5" />} color="text-[#3AB000]" />
          <StatCard label="Rejected" value={stats.rejected} icon={<XCircle className="w-5 h-5" />} color="text-red-500" />
        </div>

        <div className="bg-white p-4 border border-gray-200 shadow-sm space-y-4 mr-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h1 className="text-xl font-black text-gray-800 uppercase flex items-center gap-2">
              <LogOut className="w-6 h-6 text-[#3AB000]" />
              Resignation Requests
            </h1>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="bg-black text-white text-xs px-5 h-10 font-black uppercase flex items-center gap-2 disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isExporting ? "Exporting..." : "Export"}
              </button>
              <button
                onClick={fetchRequests}
                className="bg-black text-white text-xs px-5 h-10 font-black uppercase flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 border-t border-gray-100 pt-4">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm font-bold h-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>

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
          </div>
        </div>

        <div className="bg-white border border-gray-200 mr-4 overflow-x-auto">
          {loading ? (
            <div className="py-24 flex justify-center">
              <Loader2 className="animate-spin text-[#3AB000]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-sm font-black text-gray-400 uppercase">No requests</div>
          ) : (
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-[#3AB000] text-white">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black uppercase">Employee</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase">Designation</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase">MOU Paid</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase">Eligible From</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase">Submitted</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase">Reason</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase">Status</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <div>
                          <p className="text-xs font-black">{r.employeeId?.name || "—"}</p>
                          <p className="text-[10px] text-gray-500">{r.userId?.email || r.userId?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold">{r.employeeId?.designation || "—"}</td>
                    <td className="px-4 py-3 text-xs">{formatDate(r.mouPaidAt)}</td>
                    <td className="px-4 py-3 text-xs">{formatDate(r.eligibleFrom)}</td>
                    <td className="px-4 py-3 text-xs">{formatDate(r.submittedAt || r.createdAt)}</td>
                    <td className="px-4 py-3 text-[10px] font-bold text-gray-600 max-w-[200px] truncate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[9px] font-black px-2 py-1 uppercase border ${
                          r.status === "Approved"
                            ? "bg-green-50 text-[#3AB000]"
                            : r.status === "Rejected"
                              ? "bg-red-50 text-red-600"
                              : r.status === "Withdrawn"
                                ? "bg-gray-50 text-gray-600"
                                : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "Pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal(r, "Approve")}
                            className="text-[9px] font-black uppercase px-3 py-1.5 bg-[#3AB000] text-white"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openModal(r, "Reject")}
                            className="text-[9px] font-black uppercase px-3 py-1.5 border border-red-600 text-red-600"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">{r.adminRemarks || "—"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-md p-6 border-t-8 border-[#3AB000]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black uppercase text-sm">{modalType} Resignation</h3>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              {selectedReq?.employeeId?.name} — remarks required
            </p>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full border-2 border-gray-200 p-3 text-sm font-bold min-h-[100px] mb-4"
              placeholder="Admin remarks..."
            />
            <button
              onClick={handleUpdateStatus}
              disabled={updating}
              className={`w-full py-3 text-white text-xs font-black uppercase ${
                modalType === "Approve" ? "bg-[#3AB000]" : "bg-red-600"
              }`}
            >
              {updating ? "Processing..." : `Confirm ${modalType}`}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const StatCard = ({ label, value, icon, color = "text-gray-800" }) => (
  <div className="bg-white border border-gray-200 p-4 flex items-center justify-between">
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
    <div className="text-[#3AB000]">{icon}</div>
  </div>
);

export default AdminResignationManagement;
