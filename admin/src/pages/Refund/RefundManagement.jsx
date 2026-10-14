import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { refundAPI } from "../../utils/api";
import {
  ShieldCheck,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  X,
  Filter,
  History,
  AlertCircle,
  User,
  CreditCard
} from "lucide-react";
import { toast } from "react-hot-toast";

const GREEN = "#3AB000";
const GREEN_LIGHT = "#e8f5e2";

const RefundManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'Approve' or 'Reject'
  const [selectedReq, setSelectedReq] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [refId, setRefId] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await refundAPI.getAllRequests();
      if (res.success) {
        setRequests(res.data);
      }
    } catch (err) {
      toast.error("Failed to load refund requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openModal = (req, type) => {
    setSelectedReq(req);
    setModalType(type);
    setRemarks("");
    setRefId("");
    setShowModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!remarks.trim()) {
      toast.error("Please provide remarks");
      return;
    }
    if (modalType === 'Approve' && !refId.trim()) {
      toast.error("Please provide Refund Reference ID");
      return;
    }

    try {
      setUpdating(true);
      const status = modalType === 'Approve' ? 'Approved' : 'Rejected';
      const res = await refundAPI.updateStatus(selectedReq._id, {
        status,
        adminRemarks: remarks,
        refundRefId: refId
      });

      if (res.success) {
        toast.success(`Refund request ${status.toLowerCase()} successfully`, {
          iconTheme: { primary: "#1761b0", secondary: "#ffffff" },
          style: { border: "1px solid #b9d3f0", color: "#123b68", fontWeight: 600, fontFamily: '"Segoe UI", Tahoma, sans-serif' },
        });
        setShowModal(false);
        fetchRequests();
      }
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      r.userId?.email?.toLowerCase().includes(searchLower) ||
      r.userId?.phone?.includes(search) ||
      r.transactionId?.paymentId?.toLowerCase().includes(searchLower) ||
      r.applicationId?.paymentId?.toLowerCase().includes(searchLower) ||
      r.reason?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    rejected: requests.filter(r => r.status === 'Rejected').length
  };

  return (
    <DashboardLayout>
      <div className="p-0 ml-0 md:ml-6 px-2 md:px-0 mt-4 space-y-4 h-full max-w-[99rem]">
        
        {/* Top Stats - Unified Style */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mr-4">
          <StatCard label="Total Requests" value={stats.total} icon={<History className="w-5 h-5" />} />
          <StatCard label="Pending" value={stats.pending} icon={<Clock className="w-5 h-5" />} color="text-amber-500" iconBg="bg-amber-50" iconColor="text-amber-500" />
          <StatCard label="Authorized" value={stats.approved} icon={<CheckCircle2 className="w-5 h-5" />} color="text-[#3AB000]" iconBg="bg-green-50" iconColor="text-[#3AB000]" />
          <StatCard label="Rejected" value={stats.rejected} icon={<XCircle className="w-5 h-5" />} color="text-red-500" iconBg="bg-red-50" iconColor="text-red-500" />
        </div>

        {/* Header Section - Filter Bar */}
        <div className="bg-white p-4 border border-gray-200 rounded-none shadow-sm space-y-4 mr-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
              <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase">
                <ShieldCheck className="w-6 h-6 text-[#3AB000]" />
                Refund Management
              </h1>
            </div>

            <button
              onClick={fetchRequests}
              className="bg-black hover:bg-gray-800 text-white text-xs sm:text-sm px-5 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center border-t border-gray-100 pt-4">
            <div className="flex h-10 w-full md:w-auto flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by Payment ID, Email, Phone..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                className="h-10 border border-gray-300 rounded-none px-3 text-xs sm:text-sm font-medium text-gray-700 bg-white focus:outline-none shadow-sm min-w-[160px] cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Status: All Requests</option>
                <option value="Pending">Status: Pending</option>
                <option value="Approved">Status: Approved</option>
                <option value="Rejected">Status: Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-none overflow-hidden border border-gray-200 shadow-sm mr-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#3AB000]">
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Candidate Identity</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Payment Info</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Reason</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-center">Status</th>
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
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <AlertCircle size={48} className="text-gray-200 mx-auto mb-4" />
                      <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No refund requests found</p>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-[#e8f5e2] transition-colors border-b border-gray-100">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#0A3D00] text-white flex items-center justify-center font-black text-sm rounded-none">
                            {req.userId?.email?.[0].toUpperCase() || "C"}
                          </div>
                          <div>
                            <p className="text-[14px] font-black text-gray-900 tracking-tight leading-none mb-1 uppercase">
                              {req.userId?.email?.split('@')[0] || "Unknown"}
                            </p>
                            <p className="text-[11px] font-bold text-gray-400 tracking-tighter">{req.userId?.phone || req.userId?.email || "No Contact"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <CreditCard size={12} className="text-gray-400" />
                            <span className="text-[11px] font-black text-gray-800 uppercase tracking-tight">
                              {req.transactionId?.paymentId || req.applicationId?.paymentId || "N/A"}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            Ref: {req.refundRefId || "Awaiting Payment"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="max-w-xs">
                          <p className="text-[11px] font-medium text-gray-500 line-clamp-2">{req.reason}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {req.status === 'Pending' && <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest bg-amber-50 px-2.5 py-1 border border-amber-100">Pending</span>}
                        {req.status === 'Approved' && <span className="text-green-600 text-[10px] font-black uppercase tracking-widest bg-green-50 px-2.5 py-1 border border-green-100">Authorized</span>}
                        {req.status === 'Rejected' && <span className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-50 px-2.5 py-1 border border-red-100">Terminated</span>}
                      </td>
                      <td className="px-6 py-5 text-right">
                        {req.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(req, 'Approve')}
                              disabled={updating}
                              className="p-2.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all border border-green-100 shadow-sm"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <button
                              onClick={() => openModal(req, 'Reject')}
                              disabled={updating}
                              className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Decision Final</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Modal - Styled like ClaimManagement Modal */}
      {showModal && selectedReq && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 ${modalType === 'Approve' ? 'bg-[#3AB000]' : 'bg-red-600'}`}>
              <h2 className="text-white font-bold text-base flex items-center gap-2 uppercase tracking-wide">
                {modalType === 'Approve' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                {modalType === 'Approve' ? 'Authorize Refund' : 'Request Termination'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-1 text-center">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Candidate Identity</label>
                <div className="text-sm font-black text-gray-800 uppercase">{selectedReq.userId?.email || "Unknown Member"}</div>
                <div className={`text-[11px] font-bold mt-1 uppercase px-3 py-1 rounded w-fit mx-auto ${modalType === 'Approve' ? 'bg-green-50 text-[#3AB000]' : 'bg-red-50 text-red-500'}`}>
                  Processing Refund Request
                </div>
              </div>

              {modalType === 'Approve' && (
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Bank Reference / Refund ID</label>
                  <input
                    type="text"
                    value={refId}
                    onChange={(e) => setRefId(e.target.value)}
                    placeholder="Enter the transaction reference from bank..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-[#3AB000] outline-none transition-all font-bold text-gray-800 text-sm"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Official Remarks / Notes</label>
                <textarea
                  rows="3"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter specific notes for this action..."
                  className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 outline-none transition-all font-bold text-gray-800 text-sm ${modalType === 'Approve' ? 'focus:border-[#3AB000]' : 'focus:border-red-500'}`}
                />
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-700 text-[10px] font-black uppercase tracking-wide leading-relaxed">
                Warning: This action is permanent and will update the candidate's request status immediately.
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 text-xs font-black text-gray-500 hover:text-gray-800 transition-colors uppercase tracking-widest border border-gray-200 bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className={`${modalType === 'Approve' ? 'bg-[#3AB000]' : 'bg-red-600'} hover:bg-black text-white text-[11px] font-black px-6 py-2.5 rounded-sm transition-all uppercase tracking-widest shadow-md flex items-center gap-2`}
              >
                {updating && <Loader2 size={14} className="animate-spin" />}
                Confirm {modalType === 'Approve' ? 'Authorization' : 'Termination'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const StatCard = ({ label, value, icon, color = "text-gray-800", iconBg = "bg-gray-100", iconColor = "text-gray-500" }) => (
  <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none shadow-sm">
    <div className="flex flex-col">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</span>
      <span className={`text-2xl font-black ${color} leading-none`}>{value}</span>
    </div>
    <div className={`p-3 ${iconBg} ${iconColor} rounded-full`}>
      {icon}
    </div>
  </div>
);

export default RefundManagement;
