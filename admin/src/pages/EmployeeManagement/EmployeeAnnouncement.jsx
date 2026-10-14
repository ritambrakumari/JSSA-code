import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { announcementAPI } from "../../utils/api";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  FileEdit
} from "lucide-react";

// ── Loading Overlay ──
function LoadingOverlay({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 min-w-[200px]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-[#3AB000] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-bold text-gray-800 animate-pulse">{message}</p>
      </div>
    </div>
  );
}

const EmployeeAnnouncement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    status: "Draft",
    expiryDate: ""
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await announcementAPI.getAll();
      if (res && res.success) {
        setAnnouncements(res.data);
      }
    } catch (err) {
      console.error("Data load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        message: item.message,
        status: item.status,
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : ""
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: "",
        message: "",
        status: "Draft",
        expiryDate: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ title: "", message: "", status: "Draft", expiryDate: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      alert("Title and Message are required");
      return;
    }

    setIsLoading(true);
    try {
      let res;
      if (editingItem) {
        res = await announcementAPI.update(editingItem._id, formData);
      } else {
        res = await announcementAPI.create(formData);
      }

      if (res && res.success) {
        handleCloseModal();
        loadData();
      } else {
        alert(res.error || "Operation failed");
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      setIsLoading(true);
      try {
        const res = await announcementAPI.delete(id);
        if (res && res.success) {
          loadData();
        } else {
          alert(res.error || "Delete failed");
        }
      } catch (err) {
        console.error("Delete error:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const filteredData = announcements.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout activePath="/admin/employee-announcements">
      {isLoading && <LoadingOverlay message="Syncing Announcements..." />}

      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
              <Bell className="text-[#3AB000]" /> Employee Announcements
            </h1>
            <p className="text-xs text-gray-500 font-medium">Create and manage internal announcements for all employees</p>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="bg-[#3AB000] hover:bg-[#2d8a00] text-white px-6 py-2.5 rounded shadow-xl flex items-center justify-center gap-2 transition-all font-bold text-sm"
          >
            <Plus size={16} /> Create New Announcement
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-white border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:ring-2 focus:ring-[#3AB000]/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#3AB000] text-black">
                <tr>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest">Date</th>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest">Title</th>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest">Message</th>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest">Expiry Date</th>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest">Status</th>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <AlertCircle size={40} strokeWidth={1} />
                        <p className="font-bold underline">No Announcements Found</p>
                        <p className="text-[10px]">Create your first announcement to notify employees</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-4 text-[11px] font-bold text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-gray-800">{item.title}</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs text-gray-600 line-clamp-2 max-w-md">{item.message}</p>
                      </td>
                      <td className="px-4 py-4 text-[11px] font-bold text-gray-400">
                        {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "No Expiry"}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === "Published"
                            ? "bg-green-100 text-green-700"
                            : item.status === "Expired"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => handleOpenModal(item)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(item._id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
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

      {/* ── Announcement Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 bg-[#3AB000] text-black">
              <h2 className="font-bold text-base flex items-center gap-2 uppercase tracking-tighter">
                {editingItem ? <FileEdit size={18} /> : <Plus size={18} />}
                {editingItem ? "Edit Announcement" : "Create New Announcement"}
              </h2>
              <button onClick={handleCloseModal} className="hover:bg-black/10 p-1 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Important Update on Salary Cycle"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#3AB000]/20 outline-none transition-all placeholder:text-gray-300"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">Message Body</label>
                <textarea
                  required
                  rows="5"
                  placeholder="Type your announcement message here..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 focus:ring-2 focus:ring-[#3AB000]/20 outline-none transition-all resize-none placeholder:text-gray-300"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">Expiry Date (Optional)</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#3AB000]/20 outline-none transition-all"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
                <p className="mt-1 text-[10px] text-gray-400 font-bold">The announcement will be automatically hidden after this date.</p>
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">Publishing Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: "Draft" })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all font-black text-xs uppercase tracking-tighter ${formData.status === "Draft"
                        ? "border-[#3AB000] bg-green-50 text-[#3AB000]"
                        : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
                      }`}
                  >
                    <Clock size={16} /> Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: "Published" })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all font-black text-xs uppercase tracking-tighter ${formData.status === "Published"
                        ? "border-[#3AB000] bg-green-50 text-[#3AB000]"
                        : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
                      }`}
                  >
                    <Send size={16} /> Publish Now
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-gray-600 italic font-bold flex items-center gap-1.5">
                  {formData.status === "Published"
                    ? "✨ Once published, all employees will see this on their dashboard."
                    : "🔒 Drafts are only visible to administrators."}
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 text-sm font-black text-gray-500 hover:bg-gray-50 rounded-lg transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] bg-[#3AB000] text-black px-4 py-3 rounded-lg text-sm font-black shadow-lg hover:bg-[#2d8a00] transition-all flex items-center justify-center gap-2 uppercase tracking-tighter"
                >
                  <Save size={18} /> {editingItem ? "Update Announcement" : "Save Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EmployeeAnnouncement;
