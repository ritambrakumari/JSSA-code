import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { leadAPI, feedAPI } from "../../utils/api";
import {
  Users,
  Plus,
  Search,
  X,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  History,
  RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";

const EmployeeLeads = () => {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "Individual", // Default type
    phone: "",
    altPhone: "",
    email: "",
    profileImage: "",
    address: "",
    notes: ""
  });

  const isLocked = false;

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        search: searchQuery
      };
      const res = await leadAPI.getAll(params);
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
  }, [currentPage]);

  // Debounced search
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const data = new FormData();
      data.append("file", file);

      // Using existing feedAPI upload as it's generic enough
      const res = await feedAPI.uploadImage(data);
      if (res && res.success) {
        setFormData({ ...formData, profileImage: res.data.url });
        toast.success("Image uploaded!");
      }
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await leadAPI.create(formData);
      if (res && res.success) {
        toast.success("Lead submitted successfully!");
        setIsModalOpen(false);
        setFormData({
          name: "",
          type: "Individual",
          phone: "",
          altPhone: "",
          email: "",
          profileImage: "",
          address: "",
          notes: ""
        });
        loadLeads();
      } else {
        toast.error(res.error || "Failed to submit lead");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  // Server-side handles stats/filtering now
  const stats = {
    total: pagination.total || leads.length,
    qualified: leads.filter(l => l.status === "Qualified").length // Still client-side for current page for UI, or backend could send totals
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header section - Theme Style */}
        <div className="border-b-4 border-[#3AB000] pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
              Lead <span className="text-[#3AB000]">Management</span>
            </h1>
            <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.3em] mt-1">
              Internal Prospect Tracking Hub
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadLeads}
              disabled={isLoading}
              className={`flex items-center justify-center h-12 px-4 bg-white border border-gray-300 text-gray-600 hover:text-[#3AB000] hover:border-[#3AB000] rounded-none transition-all shadow-sm ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              title="Refresh Leads"
            >
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => !isLocked && setIsModalOpen(true)}
              disabled={isLocked}
              className={`flex items-center gap-2 bg-[#3AB000] text-white h-12 px-8 rounded-none font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-black"}`}
            >
              <Plus size={16} /> Add New Lead
            </button>
          </div>
        </div>

        {/* Publication Policy Strip - Feed Style */}
        <div className="bg-amber-50 border border-amber-100 px-4 py-2.5 mb-8 flex items-center gap-3">
          <AlertCircle size={14} className="text-amber-500" />
          <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">
            Ensure all details are accurate. Admins verify leads via calls. False leads affect performance rating.
          </p>
        </div>

        <div className="relative">
          {/* Filters and Stats */}
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 ${isLocked ? "blur-[2px] pointer-events-none select-none" : ""}`}>
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or mobile..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 focus:border-[#3AB000] outline-none text-sm font-bold transition-all rounded-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="bg-white p-4 border border-gray-200 flex items-center justify-between group hover:border-[#3AB000] transition-colors">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total My Leads</span>
              <span className="text-xl font-black text-gray-900">{stats.total}</span>
            </div>
            <div className="bg-white p-4 border border-[#3AB000] flex items-center justify-between bg-green-50/30">
              <span className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest">Verified Leads</span>
              <span className="text-xl font-black text-[#3AB000]">
                {leads.filter(l => l.status === "Qualified").length}
              </span>
            </div>
          </div>

          {/* Leads Table - Card Style */}
          <div className={`bg-white border border-[#3AB000] shadow-sm overflow-hidden rounded-none ${isLocked ? "blur-[2px] pointer-events-none select-none" : ""}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Prospect Details</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Lead Type</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Submitted At</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-[#3AB000] mx-auto mb-4" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Synchronizing Database...</p>
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center">
                        <Users className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No leads found in records</p>
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr key={lead._id} className="hover:bg-green-50/20 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#3AB000] text-white flex items-center justify-center font-black text-sm rounded-none border-2 border-white shadow-sm overflow-hidden">
                              {lead.profileImage ? (
                                <img src={lead.profileImage} alt={lead.name} className="w-full h-full object-cover" />
                              ) : (
                                lead.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="text-[13px] font-black text-gray-900 uppercase tracking-tight">{lead.name}</p>
                              <p className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                                <Phone size={10} /> {lead.phone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-none border border-gray-200">
                            {lead.type}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <p className="text-[11px] font-black text-gray-700 uppercase tracking-tighter">
                              {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">
                              {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1.5 rounded-none text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 border ${lead.status === "Qualified" ? "bg-green-50 text-[#3AB000] border-green-100" :
                              lead.status === "Follow Up" ? "bg-blue-50 text-blue-600 border-blue-100" :
                              lead.status === "Disqualified" ? "bg-red-50 text-red-500 border-red-100" :
                                "bg-amber-50 text-amber-500 border-amber-100"
                            }`}>
                            {lead.status === "Qualified" && <CheckCircle size={10} />}
                            {lead.status === "Follow Up" && <Clock size={10} />}
                            {lead.status === "Pending" && <Clock size={10} />}
                            {lead.status === "Disqualified" && <AlertCircle size={10} />}
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          {(lead.callRemark || (lead.history && lead.history.length > 0)) ? (
                            <button
                              onClick={() => { setSelectedLead(lead); setIsHistoryModalOpen(true); }}
                              className="w-8 h-8 rounded bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 inline-flex items-center justify-center transition-all disabled:opacity-50 mx-auto shadow-sm"
                              title="View History"
                            >
                              <History size={16} />
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Component - Standard Style */}
            {!isLoading && pagination.pages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between sm:justify-end items-center gap-3 sm:gap-4 mt-6 mr-6 mb-8 p-4 border-t border-gray-50">
                <div className="text-xs sm:text-sm text-gray-600 sm:hidden font-black uppercase tracking-widest">
                  Page {currentPage} of {pagination.pages}
                </div>
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="bg-[#3AB000] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-black transition-all rounded-none flex-1 sm:flex-none shadow-sm"
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
                            className={`w-7 h-7 flex items-center justify-center rounded-none text-[12px] transition-colors font-black ${currentPage === page
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
                    className="bg-[#3AB000] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-black transition-all rounded-none flex-1 sm:flex-none shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {isLocked && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/5 backdrop-blur-[2px]">
              <div className="bg-black/90 text-white px-8 py-4 text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl border-t-4 border-[#3AB000] animate-in zoom-in-95 duration-300">
                Access will be granted after official training
              </div>
            </div>
          )}
        </div>

        {/* Footer Policy - Matching Feed Style */}
        <div className="mt-12 p-6 bg-gray-50 border border-gray-200 rounded-none flex items-start gap-4">
          <AlertCircle className="text-[#3AB000] shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">Official Compliance</p>
            <p className="text-[10px] text-gray-500 font-bold leading-relaxed max-w-2xl">
              All prospect data submitted is the property of JSSA. Unauthorized sharing of lead information is strictly prohibited.
              Employees must follow the standard verification protocol for all submissions.
            </p>
          </div>
        </div>

        {/* Add Lead Modal - Sharp Theme */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-none border-t-8 border-[#3AB000] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Submit <span className="text-[#3AB000]">Prospect</span></h2>
                  <p className="text-[9px] font-black text-[#3AB000] uppercase tracking-[0.3em] mt-1 text-left">Internal Verification Form</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar-green">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 focus:border-[#3AB000] rounded-none text-sm font-bold outline-none transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Prospect Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lead Type <span className="text-red-500">*</span></label>
                    <select
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 focus:border-[#3AB000] rounded-none text-sm font-bold outline-none transition-all"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="Individual">Individual</option>
                      <option value="Doctor">Doctor</option>
                      <option value="Clinic">Clinic</option>
                      <option value="Hospital">Hospital</option>
                      <option value="Nursing Home">Nursing Home</option>
                      <option value="Pharmacy">Pharmacy</option>
                      <option value="Lab / Diagnostic">Lab / Diagnostic</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Agent">Agent</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Number <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="tel"
                      maxLength="10"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 focus:border-[#3AB000] rounded-none text-sm font-bold outline-none transition-all"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Primary Mobile"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alt Mobile (Optional)</label>
                    <input
                      type="tel"
                      maxLength="10"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 focus:border-[#3AB000] rounded-none text-sm font-bold outline-none transition-all"
                      value={formData.altPhone}
                      onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                      placeholder="Secondary Mobile"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address (Optional)</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 focus:border-[#3AB000] rounded-none text-sm font-bold outline-none transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="example@mail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profile Image (Optional)</label>
                    <div className="relative group">
                      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed transition-all cursor-pointer ${formData.profileImage ? "border-[#3AB000] bg-green-50/30" : "border-gray-300 hover:border-[#3AB000] bg-gray-50"}`}>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />

                        {uploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-[#3AB000]" />
                            <span className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest">Uploading...</span>
                          </div>
                        ) : formData.profileImage ? (
                          <div className="relative w-full h-full p-2">
                            <img src={formData.profileImage} alt="Preview" className="w-full h-full object-contain mx-auto" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[9px] font-black text-white uppercase tracking-widest">Change Image</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-[#3AB000]">
                            <Camera size={32} strokeWidth={1.5} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Tap to Upload Photo</span>
                            <span className="text-[8px] font-bold uppercase opacity-60">JPG, PNG up to 5MB</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Address <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 focus:border-[#3AB000] rounded-none text-sm font-bold outline-none transition-all min-h-[80px] resize-none"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Complete residential or business address"
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Additional Notes</label>
                  <textarea
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 focus:border-[#3AB000] rounded-none text-sm font-bold outline-none transition-all min-h-[80px] resize-none"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any specific instructions or context..."
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-8 py-3.5 border-2 border-black text-black font-black text-[10px] uppercase tracking-widest rounded-none hover:bg-black hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-8 py-3.5 bg-[#3AB000] text-white font-black text-[10px] uppercase tracking-widest rounded-none hover:bg-black transition-all shadow-lg disabled:opacity-50"
                    disabled={uploading}
                  >
                    Confirm Submission
                  </button>
                </div>
              </form>
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

              <div className="p-6 overflow-y-auto bg-gray-50 flex-1 custom-scrollbar-green">
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

export default EmployeeLeads;
