import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { feedAPI } from "../../utils/api";
import {
  ShieldCheck,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  X,
  History,
  AlertCircle,
  CreditCard,
  Eye,
  MessageSquare,
  FileText,
  Pencil,
  Trash2
} from "lucide-react";
import { toast } from "react-hot-toast";

const GREEN = "#3AB000";

// Helper to fix local/production URLs
const cleanImageUrl = (url) => {
  if (!url) return "";

  const API_BASE_URL = import.meta.env.MODE === "development"
    ? "http://localhost:3005/api"
    : "https://api.jssabhiyan.com/api";

  // If the URL has a localhost base with any port, replace the base domain up to /api
  if (url.includes("localhost:") && url.includes("/api")) {
    const apiIndex = url.indexOf("/api");
    return `${API_BASE_URL}${url.substring(apiIndex + 4)}`;
  }

  // If it's already a full production URL and we are in development, fix it
  if (url.includes("api.jssabhiyan.com/api") && import.meta.env.MODE === "development") {
    return url.replace("https://api.jssabhiyan.com/api", API_BASE_URL);
  }

  // If it's already a full URL (and not one of our APIs that needs fixing), return as is
  if (url.startsWith("http")) {
    return url;
  }

  // If path starts with /api/, prepend the base domain
  if (url.startsWith("/api/")) {
    const base = API_BASE_URL.endsWith("/api") ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    return `${base}${url}`;
  }

  // Standard relative path handling
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${path}`;
};

const FeedManagement = () => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'Approve', 'Reject', 'View', or 'Edit'
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [viewerImage, setViewerImage] = useState(null);
  const [editText, setEditText] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editImages, setEditImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchFeeds = useCallback(async (forceLoading = true) => {
    try {
      if (forceLoading) setLoading(true);
      const res = await feedAPI.getAllAdminFeeds({
        page,
        limit: 15,
        status: statusFilter,
        search
      });
      if (res.success) {
        setFeeds(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      toast.error("Failed to load feed requests");
    } finally {
      if (forceLoading) setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  // Reset page on filter/search change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const openModal = (feed, type) => {
    setSelectedFeed(feed);
    setModalType(type);
    setRemarks(feed.adminRemarks || "");
    if (type === 'Edit') {
      setEditText(feed.text || "");
      setEditImage(feed.image || "");
      setEditImages(feed.images || []);
    }
    setShowModal(true);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await feedAPI.uploadImage(formData);
      if (res.success) {
        toast.success("Image uploaded successfully");
        const newUrl = res.data.url;
        setEditImage(newUrl);
        setEditImages([newUrl]);
      } else {
        toast.error(res.error || "Failed to upload image");
      }
    } catch (err) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setEditImage("");
    setEditImages([]);
    toast.success("Image removed from feed");
  };

  const handleEditFeed = async () => {
    if (!editText.trim()) {
      toast.error("Feed content cannot be empty");
      return;
    }

    try {
      setUpdating(true);
      const res = await feedAPI.editFeed(selectedFeed._id, { 
        text: editText,
        image: editImage,
        images: editImages
      });

      if (res.success) {
        toast.success("Feed content updated successfully");
        setShowModal(false);
        setFeeds(prev => prev.map(f => f._id === selectedFeed._id ? res.data : f));
      } else {
        toast.error(res.error || "Failed to update feed");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update feed");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!remarks.trim()) {
      toast.error("Please provide official remarks");
      return;
    }

    try {
      setUpdating(true);
      const status = modalType === 'Approve' ? 'Approved' : 'Rejected';
      const res = await feedAPI.updateStatus(selectedFeed._id, {
        status,
        adminRemarks: remarks
      });

      if (res.success) {
        toast.success(`Feed publication ${status.toLowerCase()} successfully`);
        setShowModal(false);
        fetchFeeds();
      }
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteFeed = async () => {
    try {
      setUpdating(true);
      const res = await feedAPI.delete(selectedFeed._id);
      if (res.success) {
        toast.success("Feed deleted successfully");
        setShowModal(false);
        fetchFeeds();
      } else {
        toast.error(res.error || "Failed to delete feed");
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete feed");
    } finally {
      setUpdating(false);
    }
  };



  return (
    <DashboardLayout>
      <div className="p-0 ml-0 md:ml-6 px-2 md:px-0 mt-4 space-y-4 h-full max-w-[99rem]">
        
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mr-4">
          <StatCard label="Total Submissions" value={stats.total} icon={<FileText className="w-5 h-5" />} />
          <StatCard label="Awaiting Approval" value={stats.pending} icon={<Clock className="w-5 h-5" />} color="text-amber-500" iconBg="bg-amber-50" iconColor="text-amber-500" />
          <StatCard label="Published" value={stats.approved} icon={<CheckCircle2 className="w-5 h-5" />} color="text-[#3AB000]" iconBg="bg-green-50" iconColor="text-[#3AB000]" />
          <StatCard label="Rejected" value={stats.rejected} icon={<XCircle className="w-5 h-5" />} color="text-red-500" iconBg="bg-red-50" iconColor="text-red-500" />
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 border border-gray-200 rounded-none shadow-sm space-y-4 mr-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase">
              <ShieldCheck className="w-6 h-6 text-[#3AB000]" />
              Feed Moderation
            </h1>

            <button
              onClick={fetchFeeds}
              className="bg-black hover:bg-gray-800 text-white text-xs px-5 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Wall
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center border-t border-gray-100 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by Author or Content..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="h-10 border border-gray-300 rounded-none px-3 text-xs sm:text-sm font-medium text-gray-700 bg-white focus:outline-none shadow-sm min-w-[160px] cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Status: All Posts</option>
              <option value="Pending">Status: Pending</option>
              <option value="Approved">Status: Approved</option>
              <option value="Rejected">Status: Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-none overflow-hidden border border-gray-200 shadow-sm mr-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#3AB000]">
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Author Identity</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Post Content</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-center">Media</th>
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
                ) : feeds.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <AlertCircle size={48} className="text-gray-200 mx-auto mb-4" />
                      <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No feeds to moderate</p>
                    </td>
                  </tr>
                ) : (
                  feeds.map((feed) => (
                    <tr key={feed._id} className="hover:bg-[#e8f5e2] transition-colors border-b border-gray-100">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#0A3D00] text-white flex items-center justify-center font-black text-sm rounded-none">
                            {feed.author?.email?.[0].toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="text-[14px] font-black text-gray-900 tracking-tight leading-none mb-1 uppercase truncate max-w-[150px]">
                              {feed.author?.name || feed.author?.email?.split('@')[0]}
                            </p>
                            <p className="text-[11px] font-bold text-gray-400 tracking-tighter">{feed.author?.phone || feed.author?.email || "No Contact"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="max-w-xs">
                          <p className="text-[12px] font-bold text-gray-600 line-clamp-3 italic leading-relaxed">"{feed.text}"</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap justify-center gap-2 min-w-[100px]">
                          {(feed.images?.length > 0) ? (
                            feed.images.map((img, i) => (
                              <div 
                                key={i} 
                                className="relative w-10 h-10 border border-gray-300 rounded-none overflow-hidden cursor-pointer group shadow-sm bg-gray-50"
                                onClick={() => setViewerImage(cleanImageUrl(img))}
                                title={`View Image ${i + 1}`}
                              >
                                <img src={cleanImageUrl(img)} alt={`Thumb ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye size={14} className="text-white" />
                                </div>
                              </div>
                            ))
                          ) : feed.image ? (
                              <div 
                                className="relative w-10 h-10 border border-gray-300 rounded-none overflow-hidden cursor-pointer group shadow-sm bg-gray-50"
                                onClick={() => setViewerImage(cleanImageUrl(feed.image))}
                                title="View Attachment"
                              >
                                <img src={cleanImageUrl(feed.image)} alt="Thumb" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye size={14} className="text-white" />
                                </div>
                              </div>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-300 uppercase italic">No Media</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {feed.status === 'Pending' && <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest bg-amber-50 px-2.5 py-1 border border-amber-100">Pending</span>}
                        {feed.status === 'Approved' && <span className="text-green-600 text-[10px] font-black uppercase tracking-widest bg-green-50 px-2.5 py-1 border border-green-100">Approved</span>}
                        {feed.status === 'Rejected' && <span className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-50 px-2.5 py-1 border border-red-100">Rejected</span>}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(feed, 'View')}
                            className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => openModal(feed, 'Edit')}
                            className="p-2.5 bg-gray-50 text-gray-700 hover:bg-gray-800 hover:text-white transition-all border border-gray-200 shadow-sm"
                            title="Edit Content"
                          >
                            <Pencil size={18} />
                          </button>
                          {feed.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => openModal(feed, 'Approve')}
                                disabled={updating}
                                className="p-2.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all border border-green-100 shadow-sm"
                                title="Approve Feed"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button
                                onClick={() => openModal(feed, 'Reject')}
                                disabled={updating}
                                className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm"
                                title="Reject Feed"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openModal(feed, 'Delete')}
                            className="p-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-sm"
                            title="Delete Feed"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Proper Pagination UI */}
          {pagination.pages > 1 && (
            <div className="bg-gray-50 border-t border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Showing <span className="text-gray-900">{(page - 1) * 15 + 1}</span> to <span className="text-gray-900">{Math.min(page * 15, pagination.total)}</span> of <span className="text-gray-900">{pagination.total}</span> Results
              </p>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-3 h-10 border-2 border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:border-[#3AB000]"
                >
                  First
                </button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 h-10 border-2 border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:border-[#3AB000]"
                >
                  Prev
                </button>

                <div className="flex items-center mx-2 gap-1">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let start = Math.max(1, page - 2);
                    let end = Math.min(pagination.pages, start + maxVisible - 1);
                    
                    if (end - start < maxVisible - 1) {
                      start = Math.max(1, end - maxVisible + 1);
                    }

                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setPage(i)}
                          className={`w-10 h-10 border-2 font-black text-xs transition-all ${
                            page === i 
                              ? 'bg-[#3AB000] border-[#3AB000] text-white shadow-lg shadow-green-100' 
                              : 'bg-white border-gray-200 text-gray-400 hover:border-[#3AB000] hover:text-[#3AB000]'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-3 h-10 border-2 border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:border-[#3AB000]"
                >
                  Next
                </button>
                <button
                  onClick={() => setPage(pagination.pages)}
                  disabled={page === pagination.pages}
                  className="px-3 h-10 border-2 border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:border-[#3AB000]"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Moderation Modal (Approve / Reject / Delete) */}
      {showModal && selectedFeed && (modalType === 'Approve' || modalType === 'Reject' || modalType === 'Delete') && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className={`flex items-center justify-between px-6 py-4 ${modalType === 'Approve' ? 'bg-[#3AB000]' : 'bg-red-600'}`}>
              <h2 className="text-white font-bold text-base flex items-center gap-2 uppercase tracking-wide">
                {modalType === 'Approve' ? <CheckCircle2 size={20} /> : modalType === 'Delete' ? <Trash2 size={20} /> : <AlertCircle size={20} />}
                Post Moderation: {modalType}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-white hover:opacity-70 transition-opacity"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-100 space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Publication Content</p>
                  <p className="text-sm font-bold text-gray-800 leading-relaxed italic border-l-4 border-gray-200 pl-4 bg-white py-3 border-y border-r border-gray-100">"{selectedFeed.text}"</p>
                  
                  {/* Images Grid in Modal */}
                  {selectedFeed.images?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {selectedFeed.images.map((img, i) => (
                        <div key={i} className="aspect-video border border-gray-300 overflow-hidden group cursor-pointer" onClick={() => setViewerImage(cleanImageUrl(img))}>
                          <img src={cleanImageUrl(img)} alt={`Attach ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        </div>
                      ))}
                    </div>
                  ) : selectedFeed.image && (
                    <img src={cleanImageUrl(selectedFeed.image)} alt="Attach" className="w-full h-40 object-cover mt-2 border border-gray-300 cursor-pointer" onClick={() => setViewerImage(cleanImageUrl(selectedFeed.image))} />
                  )}
                </div>

                {modalType === 'Delete' ? (
                  <div className="p-4 bg-red-50 border border-red-100 text-center">
                    <AlertCircle size={32} className="text-red-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Are you sure you want to permanently delete this feed?</p>
                    <p className="text-[10px] text-red-500 mt-1">This action cannot be undone and will remove it from the employee feeds entirely.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Moderation Remarks</label>
                    <textarea
                      rows="3"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter the reason for approval or rejection (visible to employee)..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-black outline-none transition-all font-bold text-gray-800 text-sm rounded-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-6 py-2.5 text-xs font-black text-gray-500 uppercase tracking-widest bg-white border border-gray-200">Cancel</button>
              <button
                onClick={modalType === 'Delete' ? handleDeleteFeed : handleUpdateStatus}
                disabled={updating}
                className={`${modalType === 'Approve' ? 'bg-[#3AB000]' : 'bg-red-600'} hover:bg-black text-white text-[11px] font-black px-8 py-2.5 rounded-none transition-all uppercase tracking-widest flex items-center gap-2`}
              >
                {updating && <Loader2 size={14} className="animate-spin" />}
                Confirm {modalType}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {showModal && selectedFeed && modalType === 'View' && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#0A3D00]">
              <h2 className="text-white font-bold text-base flex items-center gap-2 uppercase tracking-wide">
                <Eye size={20} className="text-[#3AB000]" />
                Feed Details View
              </h2>
              <button onClick={() => setShowModal(false)} className="text-white hover:opacity-70 transition-opacity">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Author Identity & Info Card */}
              <div className="bg-gray-50 border border-gray-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#3AB000] text-white flex items-center justify-center font-black text-lg rounded-none">
                    {selectedFeed.author?.email?.[0].toUpperCase() || "U"}
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Author Identity</span>
                    <p className="text-[14px] font-black text-gray-900 tracking-tight uppercase">
                      {selectedFeed.author?.name || selectedFeed.author?.email?.split('@')[0]}
                    </p>
                    <p className="text-[12px] font-bold text-gray-500 tracking-tight">
                      {selectedFeed.author?.email || "No Email"}
                    </p>
                  </div>
                </div>

                <div className="text-left md:text-right">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Submitted On</span>
                  <p className="text-[12px] font-bold text-gray-800">
                    {new Date(selectedFeed.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  <p className="text-[11px] font-medium text-gray-400 mt-0.5">
                    Contact: {selectedFeed.author?.phone || "N/A"}
                  </p>
                </div>
              </div>

              {/* Feed Text */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Post Content Text</label>
                <div className="p-4 bg-white border-l-4 border-[#3AB000] border-y border-r border-gray-200 shadow-sm leading-relaxed italic text-gray-800 text-sm font-bold">
                  "{selectedFeed.text}"
                </div>
              </div>

              {/* Attached Media */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] block">Media Attachments</label>
                {selectedFeed.images?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedFeed.images.map((img, i) => (
                      <div 
                        key={i} 
                        className="relative aspect-video border border-gray-300 overflow-hidden cursor-pointer group shadow-sm bg-gray-50"
                        onClick={() => setViewerImage(cleanImageUrl(img))}
                      >
                        <img src={cleanImageUrl(img)} alt={`Attach ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye size={18} className="text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedFeed.image ? (
                  <div 
                    className="relative max-w-sm aspect-video border border-gray-300 overflow-hidden cursor-pointer group shadow-sm bg-gray-50"
                    onClick={() => setViewerImage(cleanImageUrl(selectedFeed.image))}
                  >
                    <img src={cleanImageUrl(selectedFeed.image)} alt="Attach" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye size={18} className="text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center border border-dashed border-gray-200 text-gray-400 text-xs font-bold uppercase tracking-wider bg-gray-50">
                    No Images or Videos Attached
                  </div>
                )}
              </div>

              {/* Moderation Status details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Moderation Status</span>
                  {selectedFeed.status === 'Pending' && <span className="text-amber-500 text-[11px] font-black uppercase tracking-widest bg-amber-50 px-3 py-1.5 border border-amber-100">Awaiting Decision</span>}
                  {selectedFeed.status === 'Approved' && <span className="text-green-600 text-[11px] font-black uppercase tracking-widest bg-green-50 px-3 py-1.5 border border-green-100">Approved & Published</span>}
                  {selectedFeed.status === 'Rejected' && <span className="text-red-500 text-[11px] font-black uppercase tracking-widest bg-red-50 px-3 py-1.5 border border-red-100">Rejected / Archived</span>}
                </div>

                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Official Remarks</span>
                  <p className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 p-2.5 leading-relaxed">
                    {selectedFeed.adminRemarks || "No remarks entered yet."}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
              <button 
                onClick={() => setShowModal(false)} 
                className="px-6 py-2.5 text-xs font-black text-gray-500 uppercase tracking-widest bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-none shadow-sm"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && selectedFeed && modalType === 'Edit' && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-black">
              <h2 className="text-white font-bold text-base flex items-center gap-2 uppercase tracking-wide">
                <Pencil size={20} className="text-[#3AB000]" />
                Edit Feed Content
              </h2>
              <button onClick={() => setShowModal(false)} className="text-white hover:opacity-70 transition-opacity">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Context Summary */}
              <div className="p-3 bg-gray-50 border border-gray-200 flex items-center gap-3">
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-black text-xs rounded-none">
                  {selectedFeed.author?.email?.[0].toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-[12px] font-black text-gray-800 uppercase tracking-tight">
                    Author: {selectedFeed.author?.name || selectedFeed.author?.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400">
                    Status: {selectedFeed.status} | Likes: {selectedFeed.likes?.length || 0}
                  </p>
                </div>
              </div>

              {/* Editable Content Input */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] block">Feed Text Content</label>
                <textarea
                  rows="6"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Type the corrected post text here..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 focus:border-[#3AB000] focus:bg-white outline-none transition-all font-bold text-gray-800 text-sm rounded-none shadow-inner"
                />
              </div>

              {/* Media Edit Section */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] block">Feed Image Attachment</label>
                
                {uploadingImage ? (
                  <div className="p-6 border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="animate-spin text-[#3AB000]" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Uploading new image...</span>
                  </div>
                ) : editImage || editImages?.length > 0 ? (
                  <div className="relative group border border-gray-300 overflow-hidden max-w-xs bg-gray-50 p-2 space-y-2">
                    <img 
                      src={cleanImageUrl(editImage || editImages[0])} 
                      alt="Current Feed attachment" 
                      className="w-full h-40 object-cover border border-gray-200" 
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex-1 text-center py-2 bg-black hover:bg-gray-800 text-white text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors shadow-sm block">
                        Change Image
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange} 
                          className="hidden" 
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-4 py-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 p-6 bg-gray-50 flex flex-col items-center justify-center gap-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Image Attached to Feed</span>
                    <label className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors shadow-sm block">
                      Upload Image
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)} 
                className="px-6 py-2.5 text-xs font-black text-gray-500 uppercase tracking-widest bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded-none"
              >
                Cancel
              </button>
              <button
                onClick={handleEditFeed}
                disabled={updating}
                className="bg-[#3AB000] hover:bg-black text-white text-[11px] font-black px-8 py-2.5 rounded-none transition-all uppercase tracking-widest flex items-center gap-2 shadow-md"
              >
                {updating && <Loader2 size={14} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewerImage && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setViewerImage(null)}>
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center pointer-events-none">
            <button 
              onClick={() => setViewerImage(null)} 
              className="absolute top-4 right-4 z-10 p-3 bg-white/10 hover:bg-[#3AB000] text-white transition-all rounded-none border border-white/20 pointer-events-auto shadow-2xl"
            >
              <X size={24} strokeWidth={3} />
            </button>
            <img 
              src={cleanImageUrl(viewerImage)} 
              alt="Full view" 
              className="max-w-full max-h-full object-contain shadow-2xl pointer-events-auto border-4 border-white/10"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 px-6 py-2 border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.3em]">
             Press anywhere to close preview
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

export default FeedManagement;
