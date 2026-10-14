import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { api } from "../../utils/api";
import { toast } from "react-hot-toast";
import { UserCog, Plus, X, Search, Clock, CheckCircle2, UserCheck, LogOut, Loader2, RefreshCw, Eye, Trash2 } from "lucide-react";
import dayjs from "dayjs";

const VisitorManagement = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [checkoutId, setCheckoutId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    reason: "",
  });

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const res = await api.visitors.getAll();
      if (res.success) {
        setVisitors(res.data);
      } else {
        toast.error("Failed to load visitors");
      }
    } catch (error) {
      toast.error("Error fetching visitors");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.reason.trim()) {
      toast.error("Name, phone, and reason are required");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.visitors.create(formData);
      if (res.success) {
        toast.success("Visitor Checked-In Successfully");
        setIsModalOpen(false);
        setFormData({ name: "", email: "", phone: "", reason: "" });
        fetchVisitors();
      } else {
        toast.error(res.error || "Failed to add visitor");
      }
    } catch (error) {
      toast.error("Error creating visitor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (id) => {
    if (!window.confirm("Are you sure you want to checkout this visitor?")) return;
    try {
      setCheckoutId(id);
      const res = await api.visitors.checkout(id);
      if (res.success) {
        toast.success("Visitor Checked-Out Successfully");
        fetchVisitors();
      } else {
        toast.error(res.error || "Failed to checkout");
      }
    } catch (error) {
      toast.error("Error checking out visitor");
    } finally {
      setCheckoutId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this visitor record?")) return;
    try {
      setDeleteId(id);
      const res = await api.visitors.delete(id);
      if (res.success) {
        toast.success("Visitor Deleted Successfully");
        fetchVisitors();
      } else {
        toast.error(res.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("Error deleting visitor");
    } finally {
      setDeleteId(null);
    }
  };

  const filteredVisitors = visitors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone.includes(searchQuery)
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">

        {/* ── Top Header Section ── */}
        <div className="bg-white p-4 border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mr-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase">
              <UserCog className="w-6 h-6 text-[#3AB000]" />
              Visitor Management
            </h1>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex items-center h-10 w-full md:w-64 border-2 border-gray-200 focus-within:border-[#3AB000] transition-colors bg-white">
              <Search className="w-4 h-4 text-gray-400 absolute left-3" />
              <input
                type="text"
                placeholder="SEARCH NAME / PHONE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full pl-9 pr-3 text-[11px] font-bold text-gray-700 outline-none uppercase tracking-widest placeholder-gray-400"
              />
            </div>

            <button
              onClick={fetchVisitors}
              className="bg-black hover:bg-gray-800 text-white text-xs px-4 h-10 font-medium uppercase tracking-wide shadow-sm transition-all flex items-center justify-center shrink-0"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs px-5 h-10 font-black uppercase tracking-wide shadow-sm transition-all flex items-center gap-2 shrink-0"
            >
              <Plus size={16} />
              Add Visitor
            </button>
          </div>
        </div>

        {/* ── Visitors Table ── */}
        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden mr-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#3AB000] border-b border-[#3AB000]">
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-[0.2em] w-16">#</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-[0.2em]">Visitor Info</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-[0.2em]">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-[0.2em]">Reason</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-[0.2em]">Time</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-[0.2em] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-gray-50">
                      <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded w-4" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded w-32" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded w-40" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                      <td className="px-6 py-5"><div className="h-6 bg-gray-100 rounded w-20" /></td>
                      <td className="px-6 py-5"><div className="h-8 bg-gray-100 rounded w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredVisitors.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-24 text-center">
                      <UserCheck size={64} className="text-gray-100 mx-auto mb-4" />
                      <p className="text-sm font-black text-gray-300 uppercase tracking-[0.3em]">
                        {searchQuery ? "No matching visitors found" : "No Visitors Logged Today"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredVisitors.map((visitor, index) => (
                    <tr key={visitor._id} className="hover:bg-[#f9fff5] transition-colors border-b border-gray-100 group">
                      <td className="px-6 py-5 text-[11px] font-bold text-gray-900">{index + 1}</td>
                      <td className="px-6 py-5">
                        <p className="text-[13px] font-black text-gray-900 uppercase group-hover:text-[#3AB000] transition-colors">{visitor.name}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[11px] font-bold text-gray-700">{visitor.phone}</p>
                        {visitor.email && <p className="text-[10px] font-bold text-gray-400 lowercase tracking-wide">{visitor.email}</p>}
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[11px] font-bold text-gray-600 leading-snug max-w-[200px] uppercase">
                          {visitor.reason}
                        </p>
                      </td>
                      <td className="px-6 py-5 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-[#3AB000]" />
                          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                            {dayjs(visitor.checkInTime).format("DD MMM YYYY, hh:mm A")}
                          </span>
                        </div>
                        {visitor.checkOutTime && (
                          <div className="flex items-center gap-2">
                            <LogOut size={12} className="text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {dayjs(visitor.checkOutTime).format("DD MMM YYYY, hh:mm A")}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {visitor.status === "Checked-In" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f2ffeb] text-[#2d8a00] border border-[#bbf7d0] text-[9px] font-black uppercase tracking-widest">
                            <Clock size={10} /> Checked-In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 border border-gray-200 text-[9px] font-black uppercase tracking-widest">
                            <CheckCircle2 size={10} /> Checked-Out
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedVisitor(visitor); setViewModalOpen(true); }}
                            className="p-2 text-gray-400 hover:text-[#3AB000] transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                          {visitor.status === "Checked-In" ? (
                            <button
                              onClick={() => handleCheckout(visitor._id)}
                              disabled={checkoutId === visitor._id}
                              className="inline-flex items-center gap-2 px-4 h-10 bg-white border-2 border-gray-200 text-gray-500 hover:border-red-500 hover:text-red-600 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                              {checkoutId === visitor._id ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                              Check-Out
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete(visitor._id)}
                              disabled={deleteId === visitor._id}
                              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              {deleteId === visitor._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
        </div>
      </div>

      {/* ─── Add Visitor Modal ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md border-2 border-[#3AB000]/20 shadow-2xl overflow-hidden">

            {/* Green Modal Header */}
            <div className="bg-[#3AB000] text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest leading-none flex items-center gap-2">
                  <UserCog size={22} />
                  New Visitor
                </h2>
                <p className="text-[10px] font-bold text-green-100 uppercase tracking-[0.2em] mt-2">
                  Record a new visitor check-in
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-6 space-y-5">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 text-sm font-bold text-gray-700 outline-none transition-all focus:border-[#3AB000] uppercase"
                    placeholder="ENTER VISITOR NAME"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 text-sm font-bold text-gray-700 outline-none transition-all focus:border-[#3AB000] uppercase"
                    placeholder="ENTER PHONE NUMBER"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 text-sm font-bold text-gray-700 outline-none transition-all focus:border-[#3AB000] lowercase"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Reason for Visit *</label>
                  <textarea
                    name="reason"
                    required
                    rows="3"
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 text-sm font-bold text-gray-700 outline-none transition-all focus:border-[#3AB000] uppercase resize-none"
                    placeholder="ENTER DETAILED REASON..."
                  ></textarea>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-12 bg-white border-2 border-gray-200 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 hover:text-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] h-12 bg-[#3AB000] text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#2d8a00] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-green-100"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                  Check-In Visitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ─── View Visitor Modal ─── */}
      {viewModalOpen && selectedVisitor && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/60">
          <div className="relative w-full max-w-2xl overflow-hidden bg-white border border-gray-200 shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-[#3AB000] text-white border-b border-[#2d8a00]">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 bg-white/10 border border-white/20">
                  <UserCog size={28} />
                </div>

                <div>
                  <h2 className="text-2xl font-black tracking-widest uppercase">
                    Visitor Details
                  </h2>

                  <p className="text-sm text-white/80">
                    Visitor information overview
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewModalOpen(false)}
                className="flex items-center justify-center w-10 h-10 transition-colors hover:bg-white/10"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 bg-white">

              {/* Profile */}
              <div className="flex items-center gap-5 p-5 mb-6 border border-[#3AB000]/20 bg-[#3AB000]/5">
                <div className="flex items-center justify-center w-20 h-20 text-3xl font-black text-white uppercase bg-[#3AB000]">
                  {selectedVisitor?.name?.charAt(0)}
                </div>

                <div>
                  <h3 className="text-2xl font-black text-gray-800 capitalize">
                    {selectedVisitor.name}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Visitor Management System
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div className="p-4 border border-gray-200 bg-gray-50">
                  <p className="mb-1 text-xs font-bold tracking-widest text-gray-400 uppercase">
                    Phone Number
                  </p>

                  <p className="text-base font-semibold text-gray-800">
                    {selectedVisitor.phone || "-"}
                  </p>
                </div>

                <div className="p-4 border border-gray-200 bg-gray-50">
                  <p className="mb-1 text-xs font-bold tracking-widest text-gray-400 uppercase">
                    Email Address
                  </p>

                  <p className="text-base font-semibold text-gray-800 break-all">
                    {selectedVisitor.email || "-"}
                  </p>
                </div>

                <div className="p-4 border border-gray-200 bg-gray-50 sm:col-span-2">
                  <p className="mb-1 text-xs font-bold tracking-widest text-gray-400 uppercase">
                    Visit Reason
                  </p>

                  <p className="text-base font-semibold text-gray-800 leading-relaxed">
                    {selectedVisitor.reason || "-"}
                  </p>
                </div>

                <div className="p-4 border border-[#3AB000]/20 bg-[#3AB000]/5">
                  <p className="mb-1 text-xs font-bold tracking-widest text-[#3AB000] uppercase">
                    Check-In Time
                  </p>

                  <p className="text-base font-bold text-gray-800">
                    {dayjs(selectedVisitor.checkInTime).format(
                      "DD MMM YYYY, hh:mm A"
                    )}
                  </p>
                </div>

                <div className="p-4 border border-red-200 bg-red-50">
                  <p className="mb-1 text-xs font-bold tracking-widest text-red-500 uppercase">
                    Check-Out Time
                  </p>

                  <p className="text-base font-bold text-gray-800">
                    {selectedVisitor.checkOutTime
                      ? dayjs(selectedVisitor.checkOutTime).format(
                        "DD MMM YYYY, hh:mm A"
                      )
                      : "Still Inside"}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">

              <button
                onClick={() => setViewModalOpen(false)}
                className="px-6 py-3 text-sm font-bold tracking-wider text-gray-700 uppercase transition-colors bg-white border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={() => setViewModalOpen(false)}
                className="px-6 py-3 text-sm font-black tracking-wider text-white uppercase transition-colors bg-[#3AB000] hover:bg-[#2d8a00]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hover\\:bg-\\[\\#f9fff5\\]:hover { background-color: #f9fff5; }
      `}</style>
    </DashboardLayout>
  );
};

export default VisitorManagement;
