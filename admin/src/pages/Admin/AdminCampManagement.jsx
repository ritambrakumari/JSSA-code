import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { campAPI, locationAPI } from "../../utils/api";
import indianStates from "../../data/states.json";
import indianDistricts from "../../data/district.json";
import {
  Tent,
  Plus,
  Loader2,
  RefreshCw,
  Search,
  X,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Edit,
  Pencil,
  Trash2,
  Eye
} from "lucide-react";
import { toast } from "react-hot-toast";

const GREEN = "#3AB000";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "N/A";

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Approved: "bg-green-50 text-[#248000] border-green-200",
    Rejected: "bg-red-50 text-red-700 border-red-200",
    Active: "bg-green-50 text-[#248000] border-green-200",
    Inactive: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border mx-auto ${styles[status] || styles.Pending
        }`}
    >
      {status}
    </span>
  );
};

const RoleBadge = ({ role }) => (
  <span
    className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border mx-auto ${role === "employee"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-purple-50 text-purple-700 border-purple-200"
      }`}
  >
    {role === "employee" ? "Employee" : "Card Holder"}
  </span>
);

function CampModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [form, setForm] = useState({
    name: "",
    state: "",
    district: "",
    blockId: "",
    panchayatId: "",
    campDate: "",
    organizer: "",
    address: "",
  });
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [panchayats, setPanchayats] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setForm({ name: "", state: "", district: "", blockId: "", panchayatId: "", campDate: "", organizer: "", address: "" });
      setDistricts([]);
      setBlocks([]);
      setPanchayats([]);
    } else if (initialData) {
      setForm({
        name: initialData.name || "",
        state: initialData.state || "",
        district: initialData.district || "",
        blockId: initialData.blockId || "",
        panchayatId: initialData.panchayatId || "",
        campDate: initialData.campDate ? initialData.campDate.split('T')[0] : "",
        organizer: initialData.organizer || "",
        address: initialData.address || "",
      });
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (form.state && indianDistricts[form.state]) {
      setDistricts(indianDistricts[form.state]);
    } else {
      setDistricts([]);
      setBlocks([]);
      setPanchayats([]);
    }
  }, [form.state]);

  useEffect(() => {
    const loadBlocks = async () => {
      if (form.state && form.district) {
        try {
          const res = await locationAPI.getBlocks({
            state: form.state,
            district: form.district,
          });
          setBlocks(Array.isArray(res) ? res : res.data || []);
        } catch {
          setBlocks([]);
        }
      } else {
        setBlocks([]);
        setPanchayats([]);
      }
    };
    loadBlocks();
  }, [form.state, form.district]);

  useEffect(() => {
    const loadPanchayats = async () => {
      if (form.blockId) {
        try {
          const res = await locationAPI.getPanchayats({ blockId: form.blockId });
          setPanchayats(Array.isArray(res) ? res : res.data || []);
        } catch {
          setPanchayats([]);
        }
      } else {
        setPanchayats([]);
      }
    };
    loadPanchayats();
  }, [form.blockId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.state || !form.district) {
      toast.error("Camp name, state, and district are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        state: form.state,
        district: form.district,
        blockId: form.blockId || undefined,
        panchayatId: form.panchayatId || undefined,
        campDate: form.campDate || undefined,
        organizer: form.organizer || undefined,
        address: form.address || undefined,
      };

      const res = initialData
        ? await campAPI.updateCamp(initialData._id, payload)
        : await campAPI.createCamp(payload);

      if (res.success) {
        toast.success(initialData ? "Camp updated successfully" : "Camp created successfully");
        onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.message || (initialData ? "Failed to update camp" : "Failed to create camp"));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
        <div className="flex items-center justify-between px-6 py-4 bg-[#3AB000]">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <Tent className="w-5 h-5" />
            {initialData ? "Edit Camp" : "Create New Camp"}
          </h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-0">
          <div className="bg-gray-50/50 p-6 space-y-8">

            {/* Section 1: Camp Details */}
            <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                <Tent className="w-4 h-4 text-[#3AB000]" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Camp Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Camp Name *</label>
                  <input
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Enter camp name"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Camp Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm"
                    value={form.campDate}
                    onChange={(e) => setForm((f) => ({ ...f, campDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Organizer</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm"
                    value={form.organizer}
                    onChange={(e) => setForm((f) => ({ ...f, organizer: e.target.value }))}
                    placeholder="E.g., JSSA Team"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Location Details */}
            <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                <MapPin className="w-4 h-4 text-[#3AB000]" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Location & Address Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">State *</label>
                  <select
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm"
                    value={form.state}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        state: e.target.value,
                        district: "",
                        blockId: "",
                        panchayatId: "",
                      }))
                    }
                    required
                  >
                    <option value="">Select State</option>
                    {indianStates.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">District *</label>
                  <select
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm disabled:bg-gray-50 disabled:text-gray-400"
                    value={form.district}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        district: e.target.value,
                        blockId: "",
                        panchayatId: "",
                      }))
                    }
                    required
                    disabled={!form.state}
                  >
                    <option value="">Select District</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Block</label>
                  <select
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm disabled:bg-gray-50 disabled:text-gray-400"
                    value={form.blockId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, blockId: e.target.value, panchayatId: "" }))
                    }
                    disabled={!form.district}
                  >
                    <option value="">Select Block (Optional)</option>
                    {blocks.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Panchayat</label>
                  <select
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm disabled:bg-gray-50 disabled:text-gray-400"
                    value={form.panchayatId}
                    onChange={(e) => setForm((f) => ({ ...f, panchayatId: e.target.value }))}
                    disabled={!form.blockId}
                  >
                    <option value="">Select Panchayat (Optional)</option>
                    {panchayats.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Full Address</label>
                  <textarea
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm resize-none"
                    rows="2"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="Enter the complete address for the camp"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-black hover:bg-[#3AB000] text-white text-xs font-bold uppercase tracking-widest px-8 py-2.5 rounded-sm transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {saving ? "Saving..." : (initialData ? "Save Changes" : "Save Camp")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RemarkModal({ isOpen, onClose, request, onSuccess }) {
  const [status, setStatus] = useState("Pending");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && request) {
      setStatus(request.status || "Pending");
      setAdminRemarks(request.adminRemarks || "");
    }
  }, [isOpen, request]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await campAPI.updateRequest(request._id, { status, adminRemarks });
      if (res.success) {
        toast.success("Request updated");
        onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.message || "Failed to update request");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
        <div className="flex items-center justify-between px-6 py-4 bg-[#3AB000]">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Update Request
          </h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-gray-50 border border-gray-100 p-4 space-y-2">
            <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">Requester:</span> {request.requesterName}</p>
            <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">Mobile:</span> {request.mobile || "N/A"}</p>
            <p className="text-xs text-gray-500"><span className="font-bold text-gray-700">Location:</span> {request.district}, {request.state}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Status</label>
            <select
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Admin Remarks</label>
            <textarea
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm"
              value={adminRemarks}
              onChange={(e) => setAdminRemarks(e.target.value)}
              placeholder="Enter remarks for the employee..."
              rows={3}
            />
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-black hover:bg-[#3AB000] text-white text-sm font-medium px-8 py-2.5 rounded-sm transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const AdminCampManagement = () => {
  const [tab, setTab] = useState("camps");
  const [camps, setCamps] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ totalCamps: 0, activeCamps: 0, totalRequests: 0, pendingRequests: 0 });
  const [loadingCamps, setLoadingCamps] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCamp, setEditingCamp] = useState(null);
  const [viewingCamp, setViewingCamp] = useState(null);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [campPagination, setCampPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [reqPagination, setReqPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchStats = async () => {
    try {
      const res = await campAPI.getAdminStats();
      if (res.success) setStats(res.data);
    } catch (err) {
      console.error("Stats Error:", err);
    }
  };

  const fetchCamps = async (page = 1) => {
    setLoadingCamps(true);
    try {
      const res = await campAPI.getAdminCamps({ page, limit: 10, search: tab === "camps" ? search : "" });
      if (res.success) {
        setCamps(res.data.camps || (Array.isArray(res.data) ? res.data : []));
        if (res.data.pagination) setCampPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load camps");
    } finally {
      setLoadingCamps(false);
    }
  };

  const fetchRequests = async (page = 1) => {
    setLoadingRequests(true);
    try {
      const res = await campAPI.getAllRequestsAdmin({
        status: statusFilter === "all" ? undefined : statusFilter,
        page,
        limit: 10,
        search: tab === "requests" ? search : ""
      });
      if (res.success) {
        setRequests(res.data.requests || (Array.isArray(res.data) ? res.data : []));
        if (res.data.pagination) setReqPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load camp requests");
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCamps(1);
    fetchRequests(1);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchRequests(1);
  }, [statusFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (tab === "camps") fetchCamps(1);
      if (tab === "requests") fetchRequests(1);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [search, tab]);

  const handleDeleteCamp = async (id) => {
    if (window.confirm("Are you sure you want to delete this camp?")) {
      try {
        const res = await campAPI.deleteCamp(id);
        if (res.success) {
          toast.success("Camp deleted successfully");
          fetchCamps(campPagination.page);
          fetchStats();
        }
      } catch (error) {
        toast.error(error.message || "Failed to delete camp");
      }
    }
  };

  const renderPageNumbers = (pagination, fetchFn) => {
    const totalPages = pagination.pages;
    const currentPage = pagination.page;
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
      pages.push(
        <button key={1} onClick={() => fetchFn(1)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-none text-[10px] font-black hover:border-[#3AB000] cursor-pointer transition-all">1</button>
      );
      if (start > 2) pages.push(<span key="dots-start" className="text-gray-400 text-[10px] px-0.5 self-center">...</span>);
    }
    for (let i = start; i <= end; i++) {
      pages.push(
        <button key={i} onClick={() => fetchFn(i)} className={`w-7 h-7 flex items-center justify-center rounded-none text-[10px] font-black transition-all cursor-pointer border ${currentPage === i ? "bg-[#3AB000] border-[#3AB000] text-white shadow-md shadow-[#3AB000]/10" : "bg-white border-gray-200 text-gray-700 hover:border-[#3AB000]"}`}>
          {i}
        </button>
      );
    }
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push(<span key="dots-end" className="text-gray-400 text-[10px] px-0.5 self-center">...</span>);
      pages.push(
        <button key={totalPages} onClick={() => fetchFn(totalPages)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-none text-[10px] font-black hover:border-[#3AB000] cursor-pointer transition-all">{totalPages}</button>
      );
    }
    return pages;
  };

  return (
    <DashboardLayout>
      <div className="p-0 ml-0 md:ml-6 px-2 md:pr-6 mt-4 space-y-4 h-full max-w-[99rem]">
        {/* TOP STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center justify-between bg-white border border-gray-300 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Camps</span>
              <span className="text-2xl font-black text-gray-900 leading-none">{stats.totalCamps}</span>
            </div>
            <div className="p-3 bg-gray-50 text-gray-600 rounded-none">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between bg-white border border-gray-300 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Camps</span>
              <span className="text-2xl font-black text-[#3AB000] leading-none">{stats.activeCamps}</span>
            </div>
            <div className="p-3 bg-green-50 text-[#3AB000] rounded-none">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between bg-white border border-gray-300 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Requests</span>
              <span className="text-2xl font-black text-blue-600 leading-none">{stats.totalRequests}</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-500 rounded-none">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between bg-white border border-gray-300 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending Requests</span>
              <span className="text-2xl font-black text-amber-600 leading-none">{stats.pendingRequests}</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-500 rounded-none">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Page Header */}

        {/* Filter and Action Bar */}
        <div className="bg-white p-4 border border-gray-200 rounded-none shadow-sm mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            {/* Left: Tabs & Search */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
              {/* Tabs */}
              <div className="flex border border-gray-200 rounded-none overflow-hidden h-10">
                <button
                  onClick={() => setTab("camps")}
                  className={`px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-medium transition-all uppercase tracking-wide whitespace-nowrap flex items-center gap-2 ${tab === "camps"
                      ? "bg-[#3AB000] text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                >
                  <MapPin size={14} /> Camps
                </button>
                <button
                  onClick={() => setTab("requests")}
                  className={`px-4 sm:px-6 py-2 text-[10px] sm:text-xs font-medium transition-all uppercase tracking-wide whitespace-nowrap flex items-center gap-2 ${tab === "requests"
                      ? "bg-[#3AB000] text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                >
                  <Users size={14} /> Camp Requests
                </button>
              </div>

              {/* Search Bar - conditionally shown or unified */}
              <div className="flex h-10 w-full md:w-auto">
                <input
                  type="text"
                  placeholder={`Search ${tab === "camps" ? "camps..." : "name, mobile, district..."}`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm flex-1 md:w-64"
                />
              </div>
            </div>

            {/* Right: Actions & Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {tab === "requests" && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 border border-gray-300 rounded-none px-3 text-xs sm:text-sm font-medium text-gray-700 bg-white focus:outline-none shadow-sm min-w-[140px] cursor-pointer"
                >
                  <option value="all">Status: All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              )}

              <button
                onClick={() => {
                  fetchStats();
                  if (tab === "camps") fetchCamps(1);
                  else fetchRequests(1);
                }}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm px-4 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide"
              >
                <RefreshCw size={14} className={loadingCamps || loadingRequests ? "animate-spin" : ""} />
                Refresh
              </button>

              {tab === "camps" && (
                <button
                  onClick={() => {
                    setEditingCamp(null);
                    setShowCreateModal(true);
                  }}
                  className="bg-black hover:bg-gray-800 text-white text-xs sm:text-sm px-5 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide"
                >
                  <Plus size={16} />
                  <span>Create Camp</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tables */}
        {tab === "camps" && (
          <div className="bg-white border border-gray-200 shadow-sm rounded-none overflow-hidden">
            {loadingCamps ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="animate-spin text-[#3AB000] w-8 h-8" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#3AB000]">
                    <tr>
                      <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">S.N.</th>
                      <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">Camp Name</th>
                      <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">Date & Organizer</th>
                      <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">Location & Address</th>
                      <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">Status</th>
                      <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {camps.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                          No camps yet. Create your first camp.
                        </td>
                      </tr>
                    ) : (
                      camps.map((c, i) => (
                        <tr key={c._id} className="hover:bg-[#f0f9eb] transition-colors">
                          <td className="px-6 py-4 text-gray-500 font-medium align-top">{i + 1}</td>
                          <td className="px-6 py-4 align-top font-bold text-gray-900 text-sm uppercase tracking-tight">
                            <div className="whitespace-normal max-w-[250px] line-clamp-2 overflow-hidden text-ellipsis">
                              {c.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex flex-col gap-1 text-xs text-gray-500 font-semibold mt-1">
                              {c.campDate && <span className="bg-gray-100 px-2 py-0.5 rounded-sm w-max">📅 {formatDate(c.campDate)}</span>}
                              {c.organizer && <span className="bg-gray-100 px-2 py-0.5 rounded-sm max-w-[180px] truncate block" title={c.organizer}>🏢 {c.organizer}</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex flex-col gap-1">
                              {c.address && (
                                <span className="font-medium text-gray-800 text-xs whitespace-normal max-w-[250px] leading-relaxed line-clamp-2 overflow-hidden text-ellipsis" title={c.address}>{c.address}</span>
                              )}
                              <span className="text-[10px] uppercase font-bold text-gray-500 whitespace-normal max-w-[250px] line-clamp-2 overflow-hidden text-ellipsis">
                                {[c.panchayatName, c.blockName, c.district, c.state].filter(Boolean).join(", ")}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setViewingCamp(c)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-600 hover:text-white rounded transition-colors"
                                title="View Camp Details"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCamp(c);
                                  setShowCreateModal(true);
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-colors"
                                title="Edit Camp"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteCamp(c._id)}
                                className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded transition-colors"
                                title="Delete Camp"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {/* Pagination for Camps */}
            {!loadingCamps && campPagination.pages > 1 && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Showing Page {campPagination.page} of {campPagination.pages} ({campPagination.total} Total)
                </p>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => fetchCamps(campPagination.page - 1)}
                    disabled={campPagination.page === 1}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-none text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    Prev
                  </button>
                  {renderPageNumbers(campPagination, fetchCamps)}
                  <button
                    onClick={() => fetchCamps(campPagination.page + 1)}
                    disabled={campPagination.page === campPagination.pages}
                    className="px-4 py-2 bg-[#3AB000] text-white rounded-none text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#3AB000]/20 hover:bg-black disabled:opacity-50 transition-all cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "requests" && (
          <div className="bg-white border border-gray-200 shadow-sm rounded-none overflow-hidden">
            {loadingRequests ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="animate-spin text-[#3AB000] w-8 h-8" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
                  <thead className="bg-[#3AB000]">
                    <tr>
                      <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">S.N.</th>
                      <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">Requester Info</th>
                      <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">Role</th>
                      <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">Location</th>
                      <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">Submitted Date</th>
                      <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">Status</th>
                      <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                          No camp requests found.
                        </td>
                      </tr>
                    ) : (
                      requests.map((r, i) => (
                        <tr key={r._id} className="hover:bg-[#f0f9eb] transition-colors">
                          <td className="px-6 py-4 text-gray-500 font-medium">{i + 1 + (reqPagination.page - 1) * 10}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-gray-900">{r.requesterName || r.userId?.name || "—"}</span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                {r.mobile || "—"} • {r.email || "—"}
                              </span>
                              <span className="text-xs text-[#3AB000] font-medium">{r.designation || "—"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <RoleBadge role={r.userRole} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-gray-800">{r.district || "—"}</span>
                              <span className="text-xs text-gray-500">{r.state || "—"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 font-medium">
                            {formatDate(r.submittedAt)}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => { setSelectedRequest(r); setShowRemarkModal(true); }}
                              className="px-4 py-1.5 bg-white border border-[#3AB000] text-[#3AB000] hover:bg-[#3AB000] hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {/* Pagination for Requests */}
            {!loadingRequests && reqPagination.pages > 1 && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Showing Page {reqPagination.page} of {reqPagination.pages} ({reqPagination.total} Total)
                </p>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => fetchRequests(reqPagination.page - 1)}
                    disabled={reqPagination.page === 1}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-none text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    Prev
                  </button>
                  {renderPageNumbers(reqPagination, fetchRequests)}
                  <button
                    onClick={() => fetchRequests(reqPagination.page + 1)}
                    disabled={reqPagination.page === reqPagination.pages}
                    className="px-4 py-2 bg-[#3AB000] text-white rounded-none text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#3AB000]/20 hover:bg-black disabled:opacity-50 transition-all cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CampModal
        isOpen={showCreateModal}
        initialData={editingCamp}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCamp(null);
        }}
        onSuccess={() => {
          fetchCamps(1);
          fetchStats();
        }}
      />

      {/* View Camp Details Modal */}
      {viewingCamp && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
            <div className="flex items-center justify-between px-6 py-4 bg-[#3AB000]">
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Camp Details
              </h2>
              <button onClick={() => setViewingCamp(null)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-lg space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Camp Name</h4>
                  <p className="text-sm font-bold text-gray-900 mt-1 uppercase">{viewingCamp.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</h4>
                    <p className="text-sm font-semibold text-gray-700 mt-1">
                      {viewingCamp.campDate ? formatDate(viewingCamp.campDate) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Organizer</h4>
                    <p className="text-sm font-semibold text-gray-700 mt-1">{viewingCamp.organizer || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 p-5 rounded-lg space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Address</h4>
                  <p className="text-sm font-semibold text-gray-700 mt-1">{viewingCamp.address || "N/A"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">State</h4>
                    <p className="text-sm font-semibold text-gray-700 mt-1">{viewingCamp.state}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">District</h4>
                    <p className="text-sm font-semibold text-gray-700 mt-1">{viewingCamp.district}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Block</h4>
                    <p className="text-sm font-semibold text-gray-700 mt-1">{viewingCamp.blockName || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Panchayat</h4>
                    <p className="text-sm font-semibold text-gray-700 mt-1">{viewingCamp.panchayatName || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={() => setViewingCamp(null)}
                className="px-8 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-widest rounded-sm transition-all shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <RemarkModal
        isOpen={showRemarkModal}
        onClose={() => setShowRemarkModal(false)}
        request={selectedRequest}
        onSuccess={() => fetchRequests(reqPagination.page)}
      />
    </DashboardLayout>
  );
};

export default AdminCampManagement;
