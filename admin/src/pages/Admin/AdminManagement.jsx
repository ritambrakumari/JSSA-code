import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { adminAPI, authAPI } from "../../utils/api";
import {
  Search,
  Plus,
  Trash2,
  X,
  Shield,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  UserCheck,
  Edit
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";

const GREEN = "#3AB000";

const AdminManagement = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Form State
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    password: "",
    role: "admin",
    allowedIPs: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const res = await adminAPI.getAdmins();
      if (res.success) {
        setAdmins(res.data);
      }
    } catch (err) {
      console.error("Fetch admins error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleDelete = async (id) => {
    if (id === "000000000000000000000001") {
      alert("System Admin cannot be deleted.");
      return;
    }
    if (id === user?._id) {
      alert("You cannot delete your own account.");
      return;
    }
    if (window.confirm("Are you sure you want to remove this admin access?")) {
      try {
        const res = await adminAPI.deleteAdmin(id);
        if (res.success) {
          alert("Admin removed successfully");
          fetchAdmins();
        } else {
          alert(res.error || "Failed to delete admin");
        }
      } catch (err) {
        alert("Error deleting admin");
      }
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!formData.phone && !formData.email) {
      alert("Please provide at least a Phone number or Email.");
      return;
    }
    
    // Only require password for NEW admins
    if (!isEditing && formData.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!formData.allowedIPs || formData.allowedIPs.trim() === "") {
        alert("Please provide at least one Allowed IP Address. This field is mandatory for security.");
        setIsSubmitting(false);
        return;
      }

      const processedData = {
        ...formData,
        allowedIPs: formData.allowedIPs
          ? formData.allowedIPs.split(',').map(ip => ip.trim()).filter(ip => ip !== "")
          : []
      };

      let res;
      if (isEditing) {
        // Remove password if empty to prevent overwriting with blank
        if (!processedData.password) delete processedData.password;
        res = await adminAPI.updateAdmin(editingId, processedData);
      } else {
        res = await adminAPI.createAdmin(processedData);
      }

      if (res.success) {
        alert(isEditing ? "Admin updated successfully!" : "New Admin added successfully!");
        closeModal();
        fetchAdmins();
      } else {
        alert(res.message || res.error || "Operation failed");
      }
    } catch (err) {
      alert("Error processing request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoutAllAdmins = async () => {
    if (window.confirm("CRITICAL ACTION: Are you sure you want to LOGOUT ALL admins immediately? All active sessions will be terminated and everyone will need to login again.")) {
      setIsSubmitting(true);
      try {
        const res = await authAPI.logoutAllAdmins();
        if (res.success) {
          alert(res.message);
          // Optional: You might want to logout the current admin too if they click this,
          // but the next API call will catch it anyway.
        } else {
          alert(res.error || "Failed to logout admins");
        }
      } catch (err) {
        alert("Error processing request");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const openModal = (admin = null) => {
    if (admin) {
      setIsEditing(true);
      setEditingId(admin._id);
      setFormData({
        phone: admin.phone || "",
        email: admin.email || "",
        password: "", // Don't show existing password
        role: "admin",
        allowedIPs: admin.allowedIPs ? admin.allowedIPs.join(', ') : ""
      });
    } else {
      setIsEditing(false);
      setEditingId(null);
      setFormData({ phone: "", email: "", password: "", role: "admin", allowedIPs: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({ phone: "", email: "", password: "", role: "admin", allowedIPs: "" });
  };

  const filteredAdmins = admins.filter(admin => 
    (admin.phone && admin.phone.includes(searchQuery)) ||
    (admin.email && admin.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentAdmins = filteredAdmins.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);

  return (
    <DashboardLayout activePath="/admin/management">
      <div className="p-0 ml-0 md:ml-6 px-2 md:px-0 bg-gray-50 min-h-screen">
        {/* ── Top Bar (JobPosting Style) ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 w-full">
             <div className="flex items-center gap-2 mb-2 sm:mb-0">
               <Shield className="text-[#3AB000]" size={24} />
               <h1 className="text-xl font-bold text-gray-800 whitespace-nowrap">Admin Authentication</h1>
             </div>

            <div className="flex items-center border border-gray-300 rounded overflow-hidden h-10 flex-1 w-full sm:max-w-[500px] ml-0 sm:ml-4">
              <input
                type="text"
                placeholder="Search by Mobile or Email..."
                className="flex-1 px-3 sm:px-4 text-xs sm:text-sm text-gray-700 focus:outline-none h-full bg-white"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <button className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs sm:text-sm px-4 sm:px-6 h-full font-medium transition-colors whitespace-nowrap">
                Search
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <button 
              onClick={handleLogoutAllAdmins}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold px-4 sm:px-6 py-2.5 rounded-sm transition-colors whitespace-nowrap w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Lock size={14} /> Logout All Admins
            </button>
            <button 
              onClick={() => openModal()}
              className="bg-black hover:bg-[#3AB000] text-white text-xs sm:text-sm font-medium px-4 sm:px-6 py-2.5 rounded-sm transition-colors whitespace-nowrap w-full sm:w-auto"
            >
              + Add New Admin
            </button>
          </div>
        </div>

        {/* ── Desktop Table (JobPosting Style) ── */}
        <div className="hidden md:block bg-white rounded overflow-hidden border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-[#3AB000]">
                  {["S.N", "Mobile Number", "Email Address", "Allowed IPs", "Created Date", "Action"].map((h) => (
                    <th key={h} className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-[#3AB000] border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-bold">Fetching admin list...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentAdmins.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center text-gray-400">
                      <AlertCircle className="mx-auto mb-2 opacity-20" size={48} strokeWidth={1} />
                      <p className="font-bold">No admins found matching your search</p>
                    </td>
                  </tr>
                ) : (
                  currentAdmins.map((admin, idx) => (
                    <tr key={admin._id} className="border-b border-gray-100 hover:bg-[#e8f5e2] transition-colors">
                      <td className="px-4 py-4 text-center text-gray-600 font-medium">
                        {indexOfFirst + idx + 1}
                      </td>
                      <td className="px-4 py-4 text-center text-[#2d8a00] font-bold">
                        {admin.phone || "---"}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700">
                        {admin.email || "---"}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          {admin.allowedIPs && admin.allowedIPs.length > 0 ? (
                            admin.allowedIPs.map(ip => (
                              <span key={ip} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded border border-gray-200">
                                {ip}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-[10px]">All IPs</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-500 whitespace-nowrap text-xs">
                        {new Date(admin.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => openModal(admin)}
                            className="text-[#3AB000] hover:text-blue-600 transition-colors"
                            title="Edit Admin"
                          >
                            <Edit size={16} />
                          </button>
                          {admin._id !== "000000000000000000000001" ? (
                            <button 
                              onClick={() => handleDelete(admin._id)}
                              className="text-[#3AB000] hover:text-red-600 transition-colors"
                              title="Delete Admin"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-white bg-black px-2 py-0.5 rounded uppercase tracking-tighter">System</span>
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

        {/* ── Mobile Card View (JobPosting Style) ── */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded border border-gray-200 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))
          ) : currentAdmins.length === 0 ? (
            <div className="bg-white rounded border border-gray-200 p-8 text-center text-gray-400 text-sm">
              No admins found.
            </div>
          ) : (
            currentAdmins.map((admin, idx) => (
              <div key={admin._id} className="bg-white rounded border border-gray-200 p-4 hover:shadow-md transition-shadow relative">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-[10px] text-gray-500 mb-1">S.N: {indexOfFirst + idx + 1}</div>
                    <div className="text-sm font-bold text-[#2d8a00]">{admin.phone || "---"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openModal(admin)}
                      className="text-blue-600 p-1"
                    >
                      <Edit size={14} />
                    </button>
                    {admin._id === "000000000000000000000001" ? (
                      <span className="text-[9px] font-bold text-white bg-black px-1.5 py-0.5 rounded uppercase">System</span>
                    ) : (
                      <button 
                        onClick={() => handleDelete(admin._id)}
                        className="text-red-500 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-600 mb-1">{admin.email || "No Email"}</div>
                <div className="text-[10px] text-gray-400">Created: {new Date(admin.createdAt).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </div>

        {/* ── Pagination (JobPosting Style) ── */}
        {!isLoading && filteredAdmins.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between sm:justify-end items-center gap-3 sm:gap-4 mt-6 pb-8">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-[#3AB000] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:bg-[#2d8a00] transition-colors rounded-sm flex-1 sm:flex-none"
              >
                Back
              </button>
              <div className="text-sm font-medium text-gray-700 px-2">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="bg-[#3AB000] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:bg-[#2d8a00] transition-colors rounded-sm flex-1 sm:flex-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal (JobPosting Form Style) ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 overflow-y-auto py-6 px-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-2xl my-auto animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#3AB000] rounded-t-lg">
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                {isEditing ? <Edit size={18} /> : <Plus size={18} />} 
                {isEditing ? "Edit Admin Access" : "Add Admin Access"}
              </h2>
              <button
                onClick={closeModal}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="tel"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#3AB000] transition-colors bg-white text-gray-700"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="email"
                    placeholder="admin@example.com"
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#3AB000] transition-colors bg-white text-gray-700"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                  Password {!isEditing && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder={isEditing ? "Leave blank to keep current" : "Min 6 characters"}
                    className="w-full pl-10 pr-12 py-2 text-sm border border-gray-300 rounded outline-none focus:border-[#3AB000] transition-colors bg-white text-gray-700"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-red-600 mb-1.5 uppercase tracking-wider flex justify-between">
                  <span>Allowed IP Addresses (Required)</span>
                  <span className="text-gray-400 font-normal">Mandatory for Admin</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3AB000]" size={16} />
                  <input 
                    type="text"
                    required
                    placeholder="e.g. 122.161.x.x, 103.x.x.x"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-[#3AB000]/20 rounded-xl outline-none focus:border-[#3AB000] transition-all bg-white text-gray-700"
                    value={formData.allowedIPs}
                    onChange={(e) => setFormData({ ...formData, allowedIPs: e.target.value })}
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-2 font-medium bg-green-50 p-2 rounded border border-green-100 italic">
                  * Admin login will be <b>BLOCKED</b> if this is empty. Use commas for multiple IPs.
                </p>
              </div>

              <div className="bg-[#f9fbe7] border border-[#c5e1a5] p-3 rounded flex gap-3">
                <AlertCircle className="text-[#3AB000] shrink-0" size={18} />
                <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                  Newly added admins will have full access to manage job postings, applications, and organization settings.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-2 text-sm font-bold text-white bg-[#3AB000] rounded hover:bg-[#2d8a00] transition-colors disabled:opacity-60 flex items-center gap-2 shadow-sm"
                >
                  {isSubmitting ? "Creating..." : "Add Admin Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminManagement;
