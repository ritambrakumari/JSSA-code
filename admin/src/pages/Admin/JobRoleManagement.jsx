import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { jobRoleAPI, jobPostingsAPI } from "../../utils/api";
import {
  Search,
  Shield,
  PlusCircle,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
  Users,
  Wallet,
  FileText,
  Bell,
  LayoutDashboard,
  HelpCircle,
  Image as ImageIcon,
  ScrollText,
  RefreshCcw,
  Target,
  CreditCard,
  MapPin,
  Film,
  Send,
  UserPlus,
  Video,
  MessageSquare,
  UserCog,
} from "lucide-react";
import { toast } from "react-hot-toast";

const GREEN = "#3AB000";

import { getPermissionsList } from "../../config/modulesConfig";

const ALL_MODULES = getPermissionsList();

const JobRoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    jobTitle: "",
    termsConditions: "Accepted",
    permissions: [],
    status: "Active",
  });

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await jobRoleAPI.getAll(search);
      if (res.success) {
        setRoles(res.data);
      } else {
        toast.error(res.error || "Failed to fetch roles");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchJobPostings = async () => {
    try {
      const res = await jobPostingsAPI.getAll({ status: "Active" });
      if (res.success) {
        setJobPostings(res.data.postings || []);
      }
    } catch (err) {
      console.error("Failed to fetch job postings:", err);
      setJobPostings([]);
    }
  };

  useEffect(() => {
    fetchJobPostings();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRoles();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleOpenModal = (role = null) => {
    if (role) {
      setSelectedRole(role);
      setFormData({
        jobTitle: role.jobTitle,
        termsConditions: role.termsConditions || "Accepted",
        permissions: role.permissions || [],
        status: role.status || "Active",
      });
      setIsTermsAccepted(true);
    } else {
      setSelectedRole(null);
      setFormData({
        jobTitle: "",
        termsConditions: "Accepted",
        permissions: [],
        status: "Active",
      });
      setIsTermsAccepted(false);
    }
    setIsModalOpen(true);
  };

  const handleTogglePermission = (moduleId) => {
    setFormData((prev) => {
      const isSelected = prev.permissions.includes(moduleId);
      if (isSelected) {
        return { ...prev, permissions: prev.permissions.filter((id) => id !== moduleId) };
      } else {
        return { ...prev, permissions: [...prev.permissions, moduleId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.jobTitle) {
      toast.error("Job title is required");
      return;
    }

    if (!isTermsAccepted) {
      toast.error("Please accept terms and conditions");
      return;
    }

    try {
      setSubmitting(true);
      let res;
      if (selectedRole) {
        res = await jobRoleAPI.update(selectedRole._id, formData);
      } else {
        res = await jobRoleAPI.create(formData);
      }

      if (res.success) {
        toast.success(selectedRole ? "Role updated successfully" : "Role created successfully");
        setIsModalOpen(false);
        fetchRoles();
      } else {
        toast.error(res.error || "Operation failed");
      }
    } catch (error) {
      toast.error("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this job role?")) {
      try {
        const res = await jobRoleAPI.delete(id);
        if (res.success) {
          toast.success("Role deleted successfully");
          fetchRoles();
        } else {
          toast.error(res.error || "Delete failed");
        }
      } catch (error) {
        toast.error("Server error");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          {/* Header & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Job Role Management</h1>
              <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.2em] mt-1">Define Roles & Access Control</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center border border-gray-300 rounded overflow-hidden h-10 w-full sm:w-80 bg-white">
                <input
                  type="text"
                  placeholder="Search roles..."
                  className="flex-1 px-4 text-sm outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="bg-[#3AB000] p-2.5 text-white">
                  <Search size={18} />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleOpenModal()}
                  className="h-10 bg-black hover:bg-[#3AB000] text-white px-6 rounded-sm shadow-sm font-bold flex items-center justify-center gap-2 transition-all uppercase text-[10px] tracking-wider whitespace-nowrap"
                >
                  <PlusCircle size={16} />
                  Add Job Role
                </button>
                <button
                  onClick={fetchRoles}
                  className="h-10 w-10 flex items-center justify-center bg-gray-50 border border-gray-300 text-gray-400 hover:text-[#3AB000] rounded transition-all"
                >
                  <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 size={40} className="animate-spin text-[#3AB000]" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Loading Roles...</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#3AB000] text-white font-black uppercase text-[10px] tracking-widest">
                    <th className="p-4">Job Role Title</th>
                    <th className="p-4">Permissions</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Created At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <tr key={role._id} className="hover:bg-[#f0f9eb] transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-[#3AB000]/10 flex items-center justify-center text-[#3AB000] border border-[#3AB000]/20">
                              <Shield size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 leading-none">{role.jobTitle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-[300px]">
                            {role.permissions?.length > 0 ? (
                              role.permissions.map((p) => (
                                <span key={p} className="text-[8px] font-black bg-white border border-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                  {p}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] text-gray-300 italic">No specific permissions</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${role.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {role.status}
                          </span>
                        </td>
                        <td className="p-4 text-center text-[10px] font-bold text-gray-400">
                          {new Date(role.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(role)}
                              className="p-2 text-gray-400 hover:text-[#3AB000] hover:bg-[#3AB000]/10 rounded transition-all"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(role._id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    !loading && (
                      <tr>
                        <td colSpan="5" className="py-24 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle size={40} className="text-gray-200" />
                            <p className="text-sm font-black text-gray-400 uppercase">No Job Roles Configured</p>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border-t-4 border-[#3AB000] flex flex-col">
            <style>{`
              input::-webkit-calendar-picker-indicator {
                display: none !important;
              }
            `}</style>
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                  {selectedRole ? "Edit Job Role" : "Create New Job Role"}
                </h2>
                <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.2em] mt-1">Job Configuration Portal</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 text-gray-400 transition-all rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Details */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-black text-gray-800 uppercase tracking-wider">Select Job Title*</label>
                    <input
                      list="jobTitles"
                      required
                      placeholder="Type or select a title"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 focus:border-[#3AB000] focus:bg-white text-sm font-bold outline-none transition-all"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    />
                    <datalist id="jobTitles">
                      {jobPostings.map((post) => (
                        <option key={post._id} value={post.post.en} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-black text-gray-800 uppercase tracking-wider">Status</label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 focus:border-[#3AB000] focus:bg-white text-sm font-bold outline-none transition-all cursor-pointer"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Permissions Sidebar View */}
                <div className="space-y-3">
                  <label className="text-[13px] font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    Permissions ( Admin Sidebar View ) <Shield size={14} className="text-[#3AB000]" />
                  </label>
                  
                  <div className="bg-gray-50 border border-gray-100 rounded-lg overflow-hidden h-[350px] flex flex-col">
                    <div className="bg-white p-3 border-b border-gray-100">
                      <p className="text-[11px] font-black text-[#3AB000] uppercase tracking-wider">Select accessible modules</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {ALL_MODULES.map((module) => {
                        const isSelected = formData.permissions.includes(module.id);
                        return (
                          <div
                            key={module.id}
                            onClick={() => handleTogglePermission(module.id)}
                            className={`flex items-center justify-between p-3 rounded cursor-pointer transition-all ${
                              isSelected 
                              ? 'bg-[#3AB000] text-white shadow-md' 
                              : 'bg-white text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={isSelected ? 'text-white' : 'text-[#3AB000]'}>
                                <module.icon size={16} />
                              </span>
                              <span className="text-[13px] font-black uppercase tracking-tight">{module.label}</span>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-white bg-white/20' : 'border-gray-200'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase italic">
                    * Users with this role will only see selected modules in their sidebar.
                  </p>
                </div>
              </div>

              {/* Terms & Conditions at the absolute bottom */}
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div 
                  onClick={() => setIsTermsAccepted(!isTermsAccepted)}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isTermsAccepted 
                    ? 'border-[#3AB000] bg-[#3AB000]/5' 
                    : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    isTermsAccepted ? 'bg-[#3AB000] border-[#3AB000]' : 'border-gray-300 bg-white'
                  }`}>
                    {isTermsAccepted && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <label className="text-[13px] font-black text-gray-800 uppercase tracking-tight cursor-pointer">
                    Accept all terms and conditions*
                  </label>
                </div>
                {!isTermsAccepted && submitting && (
                  <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1 ml-1">
                    <AlertCircle size={10} /> Acceptance is required to proceed
                  </p>
                )}
              </div>
            </form>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="px-10 py-3 bg-black text-white font-black text-[10px] uppercase tracking-widest hover:bg-[#3AB000] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    SAVING...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    {selectedRole ? "UPDATE ROLE" : "CREATE ROLE"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default JobRoleManagement;
