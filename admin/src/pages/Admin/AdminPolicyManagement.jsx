import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { policiesAPI } from "../../utils/api";
import {
  FileText,
  Plus,
  Trash2,
  X,
  Loader2,
  Upload,
  Eye,
  Download,
  RefreshCw,
  Edit,
} from "lucide-react";
import { toast } from "react-hot-toast";

const cleanFileUrl = (url) => {
  if (!url) return "";
  const API_BASE_URL = import.meta.env.MODE === "development"
    ? "http://localhost:3005/api"
    : "https://api.jssabhiyan.com/api";
  if (url.includes("localhost:3005/api")) return url.replace("http://localhost:3005/api", API_BASE_URL);
  if (url.includes("api.jssabhiyan.com/api") && import.meta.env.MODE === "development") return url.replace("https://api.jssabhiyan.com/api", API_BASE_URL);
  if (url.startsWith("http")) return url;
  if (url.startsWith("/api/")) {
    const base = API_BASE_URL.endsWith("/api") ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    return `${base}${url}`;
  }
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${path}`;
};

const AVAILABLE_ROLES = ["PM", "RM", "ZC", "DM", "BS", "PE", "CARDHOLDER"];

const AdminPolicyManagement = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Upload Form State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filesData, setFilesData] = useState([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [editVisibleTo, setEditVisibleTo] = useState([]);
  const [updating, setUpdating] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Viewer Modal State
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState("");
  const [evidenceError, setEvidenceError] = useState(false);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await policiesAPI.getAll();
      if (res.success) {
        setPolicies(res.data || []);
      } else {
        toast.error(res.message || "Failed to fetch policies");
      }
    } catch (error) {
      toast.error("Could not fetch policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleDownload = async (policy) => {
    try {
      setDownloadingId(policy._id);
      const response = await fetch(cleanFileUrl(policy.fileUrl));
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const ext = policy.fileType === "pdf" ? ".pdf" : ".jpg";
      const filename = `${policy.title.replace(/[^a-z0-9]/gi, "_")}${ext}`;
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleFileChange = (e) => {
    const incomingFiles = Array.from(e.target.files);
    if (!incomingFiles.length) return;

    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
    const newFilesData = [];

    incomingFiles.forEach(f => {
      if (!allowed.includes(f.type)) {
        toast.error(`File type not allowed: ${f.name}`);
        return;
      }
      if (f.size > 50 * 1024 * 1024) {
        toast.error(`File too large: ${f.name}`);
        return;
      }
      newFilesData.push({
        id: Math.random().toString(36).substring(2, 11),
        file: f,
        title: f.name.replace(/\.[^/.]+$/, ""),
        visibleTo: []
      });
    });

    setFilesData(prev => [...prev, ...newFilesData]);
    e.target.value = "";
  };

  const updateFileTitle = (id, newTitle) => {
    setFilesData(prev => prev.map(item => item.id === id ? { ...item, title: newTitle } : item));
  };

  const updateFileRoles = (id, role) => {
    setFilesData(prev => prev.map(item => {
      if (item.id === id) {
        const newRoles = item.visibleTo.includes(role)
          ? item.visibleTo.filter(r => r !== role)
          : [...item.visibleTo, role];
        return { ...item, visibleTo: newRoles };
      }
      return item;
    }));
  };

  const removeFile = (id) => {
    setFilesData(prev => prev.filter(item => item.id !== id));
  };

  const handleUpload = async () => {
    if (filesData.length === 0) {
      toast.error("Please add at least one document");
      return;
    }
    const hasEmptyTitles = filesData.some(f => !f.title.trim());
    if (hasEmptyTitles) {
      toast.error("All files must have a title");
      return;
    }

    try {
      setUploading(true);
      const fd = new FormData();
      const meta = filesData.map(item => ({
        title: item.title.trim(),
        visibleTo: item.visibleTo.length > 0 ? item.visibleTo : ["ALL"]
      }));

      filesData.forEach(item => {
        fd.append("files", item.file);
      });
      fd.append("metadata", JSON.stringify(meta));

      const res = await policiesAPI.upload(fd);
      if (res.success) {
        toast.success(`Successfully uploaded ${filesData.length} policies!`);
        setIsUploadModalOpen(false);
        setFilesData([]);
        fetchPolicies();
      } else {
        toast.error(res.message || "Upload failed");
      }
    } catch {
      toast.error("Server error during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this policy? This cannot be undone.")) return;
    try {
      setDeletingId(id);
      const res = await policiesAPI.deletePolicy(id);
      if (res.success) {
        toast.success("Policy deleted");
        setPolicies(prev => prev.filter(p => p._id !== id));
      } else {
        toast.error(res.message || "Delete failed");
      }
    } catch {
      toast.error("Server error during delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdatePolicy = async () => {
    if (!editTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    try {
      setUpdating(true);
      let payload;
      if (editFile) {
        payload = new FormData();
        payload.append("title", editTitle.trim());
        payload.append("visibleTo", JSON.stringify(editVisibleTo.length > 0 ? editVisibleTo : ["ALL"]));
        payload.append("file", editFile);
      } else {
        payload = {
          title: editTitle.trim(),
          visibleTo: editVisibleTo.length > 0 ? editVisibleTo : ["ALL"]
        };
      }

      const res = await policiesAPI.update(editingPolicy._id, payload);
      if (res.success) {
        toast.success("Policy updated");
        setIsEditModalOpen(false);
        setEditFile(null);
        fetchPolicies(); // Refetch to get updated file details
      } else {
        toast.error(res.message || "Update failed");
      }
    } catch {
      toast.error("Failed to update policy");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30">
                <FileText className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Policy Management</h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Centralized repository for all system policies and guidelines</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-none text-center md:text-right shrink-0">
              <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Total Policies</p>
              <p className="text-xl font-black text-white uppercase mt-1">{policies?.length || 0} Policies</p>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-gray-50 border border-gray-150 p-4 rounded-none flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
                <FileText size={14} className="text-[#3AB000]" />
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Directory Controls</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setFilesData([]); setIsUploadModalOpen(true); }}
                className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-[10px] px-5 h-9 font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 rounded-none shadow-sm"
              >
                <Plus size={14} /> Add New Policy
              </button>
              <button
                onClick={fetchPolicies}
                className="bg-black hover:bg-gray-800 text-white text-[10px] px-5 h-9 font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 rounded-none shadow-sm"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-none border border-gray-200 overflow-hidden relative min-h-[400px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-black uppercase text-[10px] tracking-widest border-b border-gray-150">
                    <th className="px-6 py-4 w-16">S.No</th>
                    <th className="px-6 py-4">Policy Name</th>
                    <th className="px-6 py-4">Visible To</th>
                    <th className="px-6 py-4">Format</th>
                    <th className="px-6 py-4">Uploaded On</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                ) : policies.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No policies uploaded yet.</td></tr>
                ) : (
                  policies.map((policy, index) => (
                    <tr key={policy._id} className="hover:bg-[#f9fff5] transition-colors">
                      <td className="px-6 py-5 text-[12px] font-bold text-gray-500">{index + 1}</td>
                      <td className="px-6 py-5 text-[13px] font-black text-gray-900 uppercase">{policy.title}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-1">
                          {!policy.visibleTo || policy.visibleTo.includes("ALL") ? (
                            <span className="bg-[#3AB000]/10 text-[#3AB000] text-[9px] px-2 py-0.5 rounded-none font-black uppercase tracking-wider">ALL</span>
                          ) : (
                            policy.visibleTo.map(role => (
                              <span key={role} className="bg-blue-50 text-blue-600 text-[9px] px-2 py-0.5 rounded-none font-black uppercase tracking-wider border border-blue-100">{role}</span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-none font-black uppercase tracking-wider border border-gray-200">
                          {policy.fileType === "pdf" ? "PDF" : "Image"}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-[11px] font-black text-gray-900 uppercase">
                        {new Date(policy.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingPolicy(policy);
                              setEditTitle(policy.title);
                              setEditVisibleTo(policy.visibleTo?.includes("ALL") ? [] : (policy.visibleTo || []));
                              setEditFile(null);
                              setIsEditModalOpen(true);
                            }}
                            className="h-8 w-8 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-blue-500 border border-gray-200 transition-all"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEvidenceUrl(cleanFileUrl(policy.fileUrl));
                              setEvidenceError(false);
                              setShowEvidenceModal(true);
                            }}
                            className="h-8 w-8 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-[#3AB000] border border-gray-200 transition-all"
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDownload(policy)}
                            disabled={downloadingId === policy._id}
                            className="h-8 w-8 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-blue-500 border border-gray-200 transition-all"
                            title="Download"
                          >
                            {downloadingId === policy._id ? <Loader2 size={12} className="animate-spin" /> : <Download size={14} />}
                          </button>
                          <button
                            onClick={() => handleDelete(policy._id)}
                            disabled={deletingId === policy._id}
                            className="h-8 w-8 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-red-500 border border-gray-200 transition-all"
                            title="Delete"
                          >
                            {deletingId === policy._id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={14} />}
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

        {/* Upload Modal */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] rounded-none border border-[#3AB000]">
              <div className="bg-[#3AB000] px-6 py-4 flex items-center justify-between">
                <h2 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                  <Upload size={14} /> Upload Policies
                </h2>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-8 overflow-y-auto bg-white">
                <div className="space-y-6">
                  <div className="bg-[#f9fff5] border-2 border-dashed border-[#3AB000]/40 p-10 text-center hover:border-[#3AB000] transition-colors relative rounded-none">
                    <input type="file" multiple accept=".pdf,image/jpeg,image/png,image/webp" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-[#3AB000] border border-[#3AB000]/20">
                        <Plus size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-800 uppercase tracking-widest mb-1.5">Click to Add Files</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">PDF, JPG, PNG up to 50MB</p>
                      </div>
                    </div>
                  </div>

                  {filesData.length > 0 && (
                    <div className="space-y-4 pt-4">
                      <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-100 pb-2">
                        Selected Files ({filesData.length})
                      </h3>
                      <div className="space-y-4">
                        {filesData.map((item) => (
                          <div key={item.id} className="flex flex-col gap-4 p-5 bg-white border border-gray-200 rounded-none relative group hover:border-[#3AB000]/50 transition-all shadow-sm">
                            
                            {/* Header row: File info and delete button */}
                            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#f9fff5] border border-[#3AB000]/30 flex items-center justify-center text-[#3AB000] rounded-none shrink-0">
                                  <FileText size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Original File</p>
                                  <p className="text-[11px] font-bold text-gray-900 truncate">{item.file.name}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => removeFile(item.id)}
                                className="h-8 w-8 shrink-0 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all rounded-none"
                                title="Remove File"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>

                            {/* Body: Input and Roles */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {/* Title Input */}
                              <div className="space-y-2">
                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.15em]">
                                  Display Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => updateFileTitle(item.id, e.target.value)}
                                  placeholder="e.g. Employee Handbook 2024"
                                  className="w-full h-10 px-3 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3AB000] outline-none rounded-none transition-all placeholder:text-gray-400"
                                />
                              </div>

                              {/* Visibility */}
                              <div className="space-y-2">
                                <label className="flex items-center justify-between text-[9px] font-black text-gray-500 uppercase tracking-[0.15em]">
                                  <span>Visibility Settings</span>
                                  <span className="text-[8px] text-gray-400 font-bold tracking-wider">(Leave unchecked for ALL)</span>
                                </label>
                                <div className="bg-gray-50 border border-gray-200 px-3 py-2.5 flex flex-wrap gap-x-4 gap-y-2 min-h-[40px] items-center">
                                  {AVAILABLE_ROLES.map(role => (
                                    <label key={role} className="flex items-center gap-1.5 cursor-pointer group/cb">
                                      <input
                                        type="checkbox"
                                        checked={item.visibleTo.includes(role)}
                                        onChange={() => updateFileRoles(item.id, role)}
                                        className="w-3.5 h-3.5 accent-[#3AB000] border-gray-300 rounded-none cursor-pointer focus:ring-0 focus:ring-offset-0"
                                      />
                                      <span className="text-[10px] font-bold text-gray-600 group-hover/cb:text-gray-900 uppercase tracking-widest transition-colors">{role}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-5 border-t border-gray-150 bg-white flex justify-end gap-4">
                <button onClick={() => setIsUploadModalOpen(false)} className="px-6 h-10 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-gray-800 transition-colors">Cancel</button>
                <button onClick={handleUpload} disabled={uploading} className="px-8 h-10 bg-[#3AB000] hover:bg-[#2d8a00] text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center justify-center min-w-[140px] rounded-none">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : "Upload Policies"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white shadow-2xl w-full max-w-md overflow-hidden flex flex-col rounded-none border border-[#3AB000]">
              <div className="bg-[#3AB000] px-6 py-4 flex items-center justify-between">
                <h2 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                  <Edit size={14} /> Edit Policy
                </h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-5 bg-white">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.15em] mb-2">Policy Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full h-11 px-4 text-xs font-black text-gray-800 border border-gray-300 focus:border-[#3AB000] outline-none rounded-none transition-colors"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.15em]">Visibility Settings</label>
                    <span className="text-[8px] text-gray-400 font-bold tracking-wider">(Leave unchecked for ALL)</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 px-4 py-3 flex flex-wrap gap-x-5 gap-y-3 min-h-[44px] items-center">
                    {AVAILABLE_ROLES.map(role => (
                      <label key={role} className="flex items-center gap-1.5 cursor-pointer group/cb">
                        <input
                          type="checkbox"
                          checked={editVisibleTo.includes(role)}
                          onChange={() => {
                            setEditVisibleTo(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])
                          }}
                          className="w-3.5 h-3.5 accent-[#3AB000] border-gray-300 rounded-none cursor-pointer focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="text-[10px] font-bold text-gray-600 group-hover/cb:text-gray-900 uppercase tracking-widest transition-colors">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Current Document</label>
                  <div className="flex items-center justify-between px-4 py-3 border border-gray-200 bg-gray-50 mb-4 rounded-none">
                    <span className="text-xs font-bold text-gray-600 truncate mr-2" title={editingPolicy?.originalFileName}>
                      {editingPolicy?.originalFileName || "Document"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEvidenceUrl(cleanFileUrl(editingPolicy?.fileUrl));
                        setEvidenceError(false);
                        setShowEvidenceModal(true);
                      }}
                      className="text-[#3AB000] hover:text-[#2d8a00] flex items-center gap-1 text-[10px] font-black uppercase tracking-widest shrink-0"
                    >
                      <Eye size={12} /> View
                    </button>
                  </div>

                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.15em] mb-2">Update Document (Optional)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setEditFile(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      title=""
                    />
                    <div className={`w-full h-11 px-4 py-2 border ${editFile ? 'border-[#3AB000] bg-[#f9fff5]' : 'border-dashed border-gray-300 bg-gray-50 hover:border-[#3AB000]'} flex items-center justify-between transition-colors rounded-none`}>
                      <span className={`text-xs font-bold truncate ${editFile ? 'text-[#3AB000]' : 'text-gray-500'}`}>
                        {editFile ? editFile.name : "Choose new file to replace"}
                      </span>
                      <div className="bg-white border border-gray-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-600 rounded-none z-0 relative">
                        {editFile ? "Change" : "Browse"}
                      </div>
                    </div>
                  </div>
                  {editFile && (
                    <button
                      type="button"
                      onClick={() => setEditFile(null)}
                      className="text-red-500 hover:text-red-600 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-1"
                    >
                      <X size={12} /> Clear Selected File
                    </button>
                  )}
                  {!editFile && <p className="text-[10px] text-gray-400 font-bold mt-1">Leave empty to keep current document.</p>}
                </div>
              </div>
              <div className="p-5 border-t border-gray-150 bg-white flex justify-end gap-4">
                <button onClick={() => setIsEditModalOpen(false)} className="px-6 h-10 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-gray-800 transition-colors">Cancel</button>
                <button onClick={handleUpdatePolicy} disabled={updating} className="px-8 h-10 bg-[#3AB000] hover:bg-[#2d8a00] text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center justify-center min-w-[140px] rounded-none">
                  {updating ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Viewer Modal */}
        {showEvidenceModal && selectedEvidenceUrl && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
            <div className="bg-white shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between px-6 py-4 bg-[#3AB000]">
                <h2 className="text-white font-black text-xs flex items-center gap-2 uppercase tracking-[0.2em]">
                  <FileText className="w-4 h-4" /> Document Viewer
                </h2>
                <button
                  onClick={() => setShowEvidenceModal(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-none bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X size={18} className="text-white" />
                </button>
              </div>

              <div className="p-4 bg-gray-50 flex items-center justify-center min-h-[500px]">
                {evidenceError ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center"><X size={32} /></div>
                    <h3 className="text-lg font-black text-gray-800 uppercase">Document Not Found</h3>
                    <p className="text-xs font-bold text-gray-500 max-w-sm">
                      The requested file could not be loaded. It may have been removed or the connection failed.
                    </p>
                  </div>
                ) : selectedEvidenceUrl.toLowerCase().includes(".pdf") ? (
                  <iframe
                    src={selectedEvidenceUrl}
                    className="w-full h-[70vh] border border-gray-200"
                    title="Policy Document"
                    onError={() => setEvidenceError(true)}
                  />
                ) : (
                  <img
                    src={selectedEvidenceUrl}
                    alt="Policy Document"
                    className="w-full max-h-[70vh] object-contain mx-auto shadow-md border border-gray-200"
                    onError={() => setEvidenceError(true)}
                  />
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminPolicyManagement;
