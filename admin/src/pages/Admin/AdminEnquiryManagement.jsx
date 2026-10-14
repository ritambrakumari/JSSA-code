import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  MessageSquare, 
  Search, 
  Loader2, 
  Eye, 
  RefreshCw, 
  CheckCircle,
  Clock,
  X
} from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import apiRequest from "../../utils/api";

const StatusBadge = ({ status }) => {
  const isResolved = status === "Resolved";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isResolved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
      {isResolved ? <CheckCircle size={12} /> : <Clock size={12} />}
      {status}
    </span>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function AdminEnquiryManagement() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  const [viewingEnquiry, setViewingEnquiry] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("Pending");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchEnquiries = async (page = 1) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.append("page", page);
      query.append("limit", 10);
      if (search) query.append("search", search);
      if (statusFilter) query.append("status", statusFilter);

      const res = await apiRequest(`/enquiries?${query.toString()}`, { method: "GET" });
      if (res?.success) {
        setEnquiries(res.data.enquiries);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries(1);
    // eslint-disable-next-line
  }, [statusFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEnquiries(1);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line
  }, [search]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!viewingEnquiry) return;
    setUpdating(true);
    try {
      const res = await apiRequest(`/enquiries/${viewingEnquiry._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: updateStatus,
          adminRemarks: adminRemarks
        })
      });
      if (res?.success) {
        toast.success("Enquiry updated successfully");
        setViewingEnquiry(null);
        fetchEnquiries(pagination.page);
      }
    } catch (error) {
      toast.error("Failed to update enquiry");
    } finally {
      setUpdating(false);
    }
  };

  const openViewModal = (enquiry) => {
    setViewingEnquiry(enquiry);
    setUpdateStatus(enquiry.status || "Pending");
    setAdminRemarks(enquiry.adminRemarks || "");
  };

  const renderPageNumbers = () => {
    const totalPages = pagination.pages;
    const currentPage = pagination.page;
    if (totalPages === 0) return null;

    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
      pages.push(
        <button key={1} onClick={() => fetchEnquiries(1)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-sm text-xs font-bold hover:border-[#3AB000] cursor-pointer transition-all">1</button>
      );
      if (start > 2) pages.push(<span key="dots-start" className="text-gray-400 text-xs px-1 self-center">...</span>);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(
        <button key={i} onClick={() => fetchEnquiries(i)} className={`w-8 h-8 flex items-center justify-center rounded-sm text-xs font-bold transition-all cursor-pointer border ${currentPage === i ? "bg-[#3AB000] border-[#3AB000] text-white" : "bg-white border-gray-200 text-gray-700 hover:border-[#3AB000]"}`}>
          {i}
        </button>
      );
    }
    
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push(<span key="dots-end" className="text-gray-400 text-xs px-1 self-center">...</span>);
      pages.push(
        <button key={totalPages} onClick={() => fetchEnquiries(totalPages)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-sm text-xs font-bold hover:border-[#3AB000] cursor-pointer transition-all">{totalPages}</button>
      );
    }
    return pages;
  };

  return (
    <DashboardLayout>
      <div className="p-0 md:ml-6 px-2 md:px-6 mt-4 pb-10 space-y-4 h-full">
        
        {/* Header Section */}
        <div className="bg-white p-4 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 text-[#3AB000] rounded-sm">
              <MessageSquare size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Contact Enquiries</h1>
              <p className="text-xs font-medium text-gray-500">Manage user messages from landing page</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] outline-none text-sm w-full md:w-64 rounded-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 border border-gray-300 bg-white text-sm focus:border-[#3AB000] outline-none rounded-sm cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
            </select>
            <button
              onClick={() => fetchEnquiries(1)}
              className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold text-xs uppercase flex items-center gap-2 rounded-sm transition-colors"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="animate-spin text-[#3AB000] w-10 h-10" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#3AB000]">
                  <tr>
                    <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">Date</th>
                    <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">Contact Details</th>
                    <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">Location</th>
                    <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">Status</th>
                    <th className="px-6 py-4 font-black text-white text-[13px] uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enquiries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                        No enquiries found.
                      </td>
                    </tr>
                  ) : (
                    enquiries.map((enq) => (
                      <tr key={enq._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                          {formatDate(enq.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 text-sm">{enq.name}</div>
                          <div className="text-xs font-semibold text-gray-500 mt-0.5">{enq.contact}</div>
                          <div className="text-xs font-semibold text-gray-500 mt-0.5">{enq.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="whitespace-normal max-w-[200px] text-xs font-semibold text-gray-600 line-clamp-2" title={enq.address}>
                            {enq.address || "N/A"}
                          </div>
                          <div className="text-[10px] font-bold uppercase text-gray-400 mt-1">
                            {[enq.city, enq.state].filter(Boolean).join(", ")} {enq.zip && `- ${enq.zip}`}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={enq.status} />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openViewModal(enq)}
                            className="px-3 py-1.5 bg-[#3AB000]/10 hover:bg-[#3AB000] text-[#3AB000] hover:text-white rounded text-xs font-bold transition-colors flex items-center gap-1.5 uppercase"
                          >
                            <Eye size={14} /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {!loading && pagination.total > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Showing page {pagination.page} of {pagination.pages}
              </span>
              <div className="flex gap-1.5">{renderPageNumbers()}</div>
            </div>
          )}
        </div>
      </div>

      {/* View & Update Modal */}
      {viewingEnquiry && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 bg-[#3AB000]">
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Enquiry Details
              </h2>
              <button onClick={() => setViewingEnquiry(null)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-gray-400 mb-1">Name</h4>
                  <p className="text-sm font-bold text-gray-800">{viewingEnquiry.name}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-gray-400 mb-1">Date Submitted</h4>
                  <p className="text-sm font-bold text-gray-800">{formatDate(viewingEnquiry.createdAt)}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-gray-400 mb-1">Contact</h4>
                  <p className="text-sm font-bold text-gray-800">{viewingEnquiry.contact}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-gray-400 mb-1">Email</h4>
                  <p className="text-sm font-bold text-gray-800">{viewingEnquiry.email}</p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-[10px] font-black uppercase text-gray-400 mb-1">Address</h4>
                  <p className="text-sm font-bold text-gray-800">
                    {viewingEnquiry.address}
                    <br />
                    {[viewingEnquiry.city, viewingEnquiry.state, viewingEnquiry.zip].filter(Boolean).join(", ")}
                  </p>
                </div>
                <div className="col-span-2 bg-gray-50 p-4 border border-gray-200 rounded">
                  <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2">Message</h4>
                  <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {viewingEnquiry.message || "No message provided."}
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="bg-blue-50/50 p-5 border border-blue-100 rounded">
                <h3 className="text-xs font-black uppercase text-blue-800 mb-4 tracking-wider">Update Action</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1.5">Status</label>
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-sm focus:border-[#3AB000] outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1.5">Admin Remarks</label>
                    <textarea
                      value={adminRemarks}
                      onChange={(e) => setAdminRemarks(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded text-sm focus:border-[#3AB000] outline-none min-h-[80px]"
                      placeholder="Add notes about how this enquiry was handled..."
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setViewingEnquiry(null)}
                    className="px-5 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 font-bold text-xs uppercase rounded"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-5 py-2 bg-[#3AB000] hover:bg-[#2e8a00] text-white font-bold text-xs uppercase rounded flex items-center gap-2"
                  >
                    {updating ? <Loader2 size={14} className="animate-spin" /> : null}
                    Save Updates
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
