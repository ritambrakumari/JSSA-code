import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Bell, Plus, Edit, Trash2, Save, X, Link as LinkIcon } from "lucide-react";
import { notificationsAPI } from "../../utils/api";
import { useAuth } from "../../auth/AuthProvider";
import { useAdminBlue, AdminBlueStyle, AdminHero } from "../../components/AdminBlueTheme";

const Notifications = () => {
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
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    notificationDate: "",
    notificationTime: "",
    isActive: true,
  });

  useEffect(() => {
    if (!hasPermission("notifications")) {
      setError("Access denied. Only admins can manage notifications.");
      setLoading(false);
      return;
    }
    fetchNotifications();
  }, [role, employeeProfile]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationsAPI.getAll();
      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
      }
    } catch (err) {
      console.error("Fetch notifications error:", err);
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "isActive") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(false);

      const payload = {
        ...formData,
        startDate: formData.startDate || new Date().toISOString(),
        endDate: formData.endDate || null,
      };

      if (editingId) {
        await notificationsAPI.update(editingId, payload);
        setSuccess("Notification updated successfully!");
      } else {
        await notificationsAPI.create(payload);
        setSuccess("Notification created successfully!");
      }

      setIsModalOpen(false);
      setEditingId(null);
      resetForm();
      fetchNotifications();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Save notification error:", err);
      setError(err.message || "Failed to save notification");
    }
  };

  const handleEdit = (notification) => {
    setEditingId(notification._id);
    setFormData({
      title: notification.title || "",
      url: notification.url || "",
      notificationDate: notification.notificationDate
        ? new Date(notification.notificationDate).toISOString().split("T")[0]
        : "",
      notificationTime: notification.notificationTime || "",
      isActive: notification.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      await notificationsAPI.delete(id);
      setSuccess("Notification deleted successfully!");
      fetchNotifications();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Delete notification error:", err);
      setError(err.message || "Failed to delete notification");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      url: "",
      notificationDate: "",
      notificationTime: "",
      isActive: true,
    });
    setEditingId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    resetForm();
  };

  if (!hasPermission("notifications")) {
    return (
      <DashboardLayout>
        <div className="p-3 sm:p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded text-sm">
            {error || "Access denied. Only admins can manage notifications."}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={`p-3 sm:p-6 ${isBlue ? "adm-blue" : ""}`}>
        {isBlue && <AdminBlueStyle />}
        {isBlue ? (
          <AdminHero icon={Bell} title="Push Notifications" subtitle="Create and manage notifications shown on the website">
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-[#3AB000] text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Notification
            </button>
          </AdminHero>
        ) : (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Push Notifications</h1>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-[#3AB000] hover:bg-[#2d8a00] text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Notification
          </button>
        </div>
        )}

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

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm sm:text-base">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-sm sm:text-base">No notifications found. Create your first notification!</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        URL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
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
                    {notifications.map((notification) => (
                      <tr key={notification._id}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {notification.title || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {notification.url ? (
                            <a
                              href={notification.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[#4D7C0F] hover:text-[#3F6212] flex items-center gap-1"
                            >
                              <LinkIcon className="w-3 h-3" />
                              {notification.url.length > 40
                                ? `${notification.url.substring(0, 40)}...`
                                : notification.url}
                            </a>
                          ) : (
                            <span className="text-sm text-gray-400">No URL</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {notification.notificationDate
                              ? new Date(notification.notificationDate).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "N/A"}
                          </div>
                          {notification.notificationTime && (
                            <div className="text-xs text-gray-500 mt-1">
                              {notification.notificationTime}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              notification.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {notification.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(notification)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(notification._id)}
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {notification.title || "N/A"}
                      </h3>
                      {notification.url ? (
                        <a
                          href={notification.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-[#4D7C0F] hover:text-[#3F6212] flex items-center gap-1 mt-1 break-all"
                        >
                          <LinkIcon className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{notification.url}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No URL</span>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${
                        notification.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {notification.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-700 mb-3">
                    <div className="flex items-start">
                      <span className="font-medium w-24 flex-shrink-0">Date:</span>
                      <span className="flex-1">
                        {notification.notificationDate
                          ? new Date(notification.notificationDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "N/A"}
                      </span>
                    </div>
                    {notification.notificationTime && (
                      <div className="flex items-start">
                        <span className="font-medium w-24 flex-shrink-0">Time:</span>
                        <span className="flex-1">{notification.notificationTime}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(notification)}
                      className="text-indigo-600 hover:text-indigo-900 p-2"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(notification._id)}
                      className="text-red-600 hover:text-red-900 p-2"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {editingId ? "Edit Notification" : "Add Notification"}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3AB000]"
                      placeholder="Enter notification title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL
                    </label>
                    <input
                      type="url"
                      name="url"
                      value={formData.url}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3AB000]"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notification Date
                      </label>
                      <input
                        type="date"
                        name="notificationDate"
                        value={formData.notificationDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3AB000]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notification Time
                      </label>
                      <input
                        type="time"
                        name="notificationTime"
                        value={formData.notificationTime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3AB000]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="h-4 w-4 text-[#3AB000] focus:ring-[#3AB000] border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">Active</label>
                  </div>

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

export default Notifications;
