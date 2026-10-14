import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { 
  Video, 
  Plus, 
  Trash2, 
  Loader2, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertCircle,
  X,
  ExternalLink,
  User,
  Tag
} from "lucide-react";
import { apiRequest } from "../../utils/api";
import { toast } from "react-hot-toast";

const GREEN = "#3AB000";

const TrainingManagement = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    embedLink: "",
    postType: "District Manager"
  });

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/training", { method: "GET" });
      if (res.success) {
        setTrainings(res.data);
      }
    } catch (error) {
      toast.error("Failed to fetch trainings");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTraining = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.embedLink || !formData.postType) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiRequest("/training", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      if (res.success) {
        toast.success("Training added successfully");
        setShowAddModal(false);
        setFormData({ title: "", embedLink: "", postType: "District Manager" });
        fetchTrainings();
      }
    } catch (error) {
      toast.error(error.message || "Failed to add training");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this training?")) return;
    try {
      const res = await apiRequest(`/training/${id}`, { method: "DELETE" });
      if (res.success) {
        toast.success("Training deleted");
        fetchTrainings();
      }
    } catch (error) {
      toast.error("Failed to delete training");
    }
  };

  const filteredTrainings = trainings.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.postType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-0 ml-0 md:ml-6 px-2 md:px-0 pr-2 md:pr-6 mt-4 space-y-4 h-full w-full">
        
        {/* Header Section */}
        <div className="bg-white p-4 border border-gray-200 rounded-none shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
              <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase">
                <Video className="w-6 h-6 text-[#3AB000]" />
                Training Management
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs sm:text-sm px-5 h-10 font-bold rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide"
              >
                <Plus className="w-4 h-4" />
                Add Training
              </button>
              <button
                onClick={fetchTrainings}
                className="bg-black hover:bg-gray-800 text-white text-xs sm:text-sm px-5 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center border-t border-gray-100 pt-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by title or post type..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Training Table */}
        <div className="bg-white rounded-none overflow-hidden border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-[#3AB000]">
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Video Info</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Post Category</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Uploaded By</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="4" className="px-6 py-8"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                    </tr>
                  ))
                ) : filteredTrainings.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center">
                      <AlertCircle size={48} className="text-gray-200 mx-auto mb-4" />
                      <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No training videos found</p>
                    </td>
                  </tr>
                ) : (
                  filteredTrainings.map((t) => (
                    <tr key={t._id} className="hover:bg-[#e8f5e2] transition-colors border-b border-gray-100">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-green-50 text-[#3AB000]">
                            <Video size={20} />
                          </div>
                          <div>
                            <p className="text-[14px] font-black text-gray-900 tracking-tight leading-none mb-1 uppercase">
                              {t.title}
                            </p>
                            <a 
                              href={t.embedLink.match(/src="([^"]+)"/)?.[1] || t.embedLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-blue-500 hover:underline flex items-center gap-1 uppercase tracking-tighter"
                            >
                              <ExternalLink size={10} /> View Link
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-gray-400" />
                          <span className="text-[12px] font-black text-gray-700 uppercase bg-gray-100 px-2 py-1">
                            {t.postType}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <div>
                            <p className="text-[12px] font-bold text-gray-800 uppercase leading-none">
                              {t.uploadedBy?.name || "System Admin"}
                            </p>
                            <p className="text-[10px] font-medium text-gray-400 uppercase">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => handleDelete(t._id)}
                          className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Training Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 bg-[#3AB000]">
              <h2 className="text-white font-bold text-base flex items-center gap-2 uppercase tracking-wide">
                <Plus className="w-5 h-5" /> Add New Training
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <form onSubmit={handleAddTraining} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Video Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. District Manager Onboarding"
                  className="w-full px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-sm font-bold"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Select Post Category</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-sm font-bold bg-white"
                  value={formData.postType}
                  onChange={(e) => setFormData({...formData, postType: e.target.value})}
                >
                  <option value="District Manager">District Manager</option>
                  <option value="Block Supervisor">Block Supervisor</option>
                  <option value="Panchayat Executive">Panchayat Executive</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Video Embed Link (YouTube/Vimeo)</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Paste <iframe ...> code here"
                  className="w-full px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-sm font-bold"
                  value={formData.embedLink}
                  onChange={(e) => setFormData({...formData, embedLink: e.target.value})}
                />
                <div className="p-3 bg-amber-50 border border-amber-200 mt-2">
                  <p className="text-[10px] text-amber-800 font-black uppercase mb-1 flex items-center gap-1">
                    <AlertCircle size={12} /> Steps to get Embed Code:
                  </p>
                  <ul className="text-[9px] text-amber-700 font-bold space-y-1 list-disc pl-3 uppercase tracking-tight">
                    <li>Open the video on YouTube</li>
                    <li>Click the <span className="text-amber-900">'Share'</span> button below the video</li>
                    <li>Select the <span className="text-amber-900">'Embed'</span> option</li>
                    <li>Copy the <span className="text-amber-900">Entire Code</span> (starting with &lt;iframe...&gt;) and paste it above</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-2.5 text-xs font-black text-gray-500 hover:text-gray-800 transition-colors uppercase tracking-widest border border-gray-200 bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#3AB000] hover:bg-black text-white text-[11px] font-black px-6 py-2.5 transition-all uppercase tracking-widest shadow-md flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : "Save Training"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TrainingManagement;
