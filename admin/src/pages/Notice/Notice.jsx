import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
  Loader,
} from "lucide-react";
import { noticesAPI } from "../../utils/api";
import { useAuth } from "../../auth/AuthProvider";
import { useAdminBlue, AdminBlueStyle, AdminHero } from "../../components/AdminBlueTheme";

const PushNotices = () => {
  const { role, employeeProfile } = useAuth();
  const isBlue = useAdminBlue();
  const permissions = employeeProfile?.jobRoleId?.permissions || [];

  const hasPermission = (perm) => {
    if (role === "admin" || role === "superadmin") return true;
    if (role === "staff") {
      const normalizedPerm = perm.toLowerCase();
      const snake = perm.replace(/([A-Z])/g, "_$1").toLowerCase();
      return permissions.some(p => {
        const lp = p.toLowerCase();
        return lp === normalizedPerm || lp === snake;
      });
    }
    return false;
  };
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    noticeEnglish: "",
    noticeHindi: "",
    importantNotice: "",
    isActive: true,
  });

  useEffect(() => {
    if (!hasPermission("notices")) {
      setError("Access denied. Only admins can manage notices.");
      setLoading(false);
      return;
    }
    fetchNotices();
  }, [role, employeeProfile]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await noticesAPI.getAll();
      if (response.success && response.data) {
        setNotices(response.data.notices || []);
      } else {
        setError(response.error || "Failed to load notices");
      }
    } catch (err) {
      console.error("Fetch notices error:", err);
      setError(err.message || "Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingId) {
        const response = await noticesAPI.update(editingId, formData);
        if (response.success) {
          showSuccess("Notice updated successfully!");
          await fetchNotices();
          setIsModalOpen(false);
          setEditingId(null);
          resetForm();
        } else {
          setError(response.error || "Failed to update notice");
        }
      } else {
        const response = await noticesAPI.create(formData);
        if (response.success) {
          showSuccess("Notice created successfully!");
          await fetchNotices();
          setIsModalOpen(false);
          resetForm();
        } else {
          setError(response.error || "Failed to create notice");
        }
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to save notice");
    }
  };

  const handleEdit = (notice) => {
    setEditingId(notice._id);
    setFormData({
      noticeEnglish: notice.noticeEnglish || "",
      noticeHindi: notice.noticeHindi || "",
      importantNotice: notice.importantNotice || "",
      isActive: notice.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
    
    try {
      const response = await noticesAPI.delete(id);
      if (response.success) {
        showSuccess("Notice deleted successfully!");
        await fetchNotices();
      } else {
        setError(response.error || "Failed to delete notice");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message || "Failed to delete notice");
    }
  };

  const resetForm = () => {
    setFormData({
      noticeEnglish: "",
      noticeHindi: "",
      importantNotice: "",
      isActive: true,
    });
    setEditingId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    resetForm();
  };

  return (
    <DashboardLayout>
      <div className={`p-3 sm:p-6 ${isBlue ? "adm-blue" : ""}`}>
        {isBlue && <AdminBlueStyle />}
        {isBlue && (
          <AdminHero icon={FileText} title="Push Notices" subtitle="Active notices appear in the Public Notice section of the website">
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-[#3AB000] text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Notice
            </button>
          </AdminHero>
        )}
        {/* ── Header ── */}
        <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6 ${isBlue ? "hidden" : ""}`}>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Push Notices
          </h1>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-[#3AB000] hover:bg-[#2d8a00] text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Notice
          </button>
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded text-sm">
            {success}
          </div>
        )}

        {/* ── Loading state ── */}
        {loading ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Loader className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500 text-sm sm:text-base">Loading notices...</p>
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-sm sm:text-base">
              No notices found. Create your first notice!
            </p>
          </div>
        ) : (
          <>
            {/* ── Desktop Table ── */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notice (English)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notice (Hindi)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Important Notice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {notices.map((notice) => (
                      <tr key={notice._id}>
                        {/* English */}
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs line-clamp-3">
                            {notice.noticeEnglish || "N/A"}
                          </div>
                        </td>

                        {/* Hindi */}
                        <td className="px-6 py-4">
                          <div
                            className="text-sm text-gray-800 max-w-xs line-clamp-3"
                            style={{
                              fontFamily: "'Noto Sans Devanagari', serif",
                            }}
                          >
                            {notice.noticeHindi || (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </div>
                        </td>

                        {/* Important */}
                        <td className="px-6 py-4">
                          {notice.importantNotice ? (
                            <div className="flex items-start gap-1.5 bg-red-50 border border-red-200 rounded px-2 py-1.5 max-w-xs">
                              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                              <p className="text-xs font-semibold text-red-700 line-clamp-3">
                                {notice.importantNotice}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              notice.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {notice.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(notice)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(notice._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Mobile Cards ── */}
            <div className="md:hidden space-y-3">
              {notices.map((notice) => (
                <div
                  key={notice._id}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        notice.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {notice.isActive ? "Active" : "Inactive"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(notice)}
                        className="text-indigo-600 hover:text-indigo-900 p-2"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(notice._id)}
                        className="text-red-600 hover:text-red-900 p-2"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {notice.noticeEnglish && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                        English
                      </p>
                      <p className="text-sm font-medium text-gray-900 line-clamp-3">
                        {notice.noticeEnglish}
                      </p>
                    </div>
                  )}

                  {notice.noticeHindi && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                        Hindi / सूचना
                      </p>
                      <p
                        className="text-sm text-gray-800 line-clamp-3"
                        style={{ fontFamily: "'Noto Sans Devanagari', serif" }}
                      >
                        {notice.noticeHindi}
                      </p>
                    </div>
                  )}

                  {notice.importantNotice && (
                    <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded px-3 py-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-red-700 line-clamp-3">
                        IMPORTANT NOTICE:– {notice.importantNotice}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Modal ── */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {editingId ? "Edit Notice" : "Add Notice"}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Field 1 — English */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notice Text (English){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="noticeEnglish"
                      value={formData.noticeEnglish}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3AB000] resize-none"
                      placeholder="Enter notice in English…"
                    />
                  </div>

                  {/* Field 2 — Hindi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notice Text (Hindi / सूचना)
                    </label>
                    <textarea
                      name="noticeHindi"
                      value={formData.noticeHindi}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3AB000] resize-none"
                      placeholder="हिंदी में सूचना लिखें…"
                      style={{ fontFamily: "'Noto Sans Devanagari', serif" }}
                    />
                  </div>

                  {/* Field 3 — Important Notice */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Important Notice
                    </label>
                    <textarea
                      name="importantNotice"
                      value={formData.importantNotice}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3AB000] resize-none"
                      placeholder="Enter important notice (shown as highlighted banner)…"
                    />
                  </div>

                  {/* Active */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="h-4 w-4 text-[#3AB000] focus:ring-[#3AB000] border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isActive"
                      className="ml-2 block text-sm text-gray-700 cursor-pointer"
                    >
                      Active
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 bg-[#3AB000] text-white rounded-md hover:bg-[#2d8a00] flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Save className="w-4 h-4" />
                      {editingId ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PushNotices;
