import React, { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { ImageIcon, Upload, X, Edit, Trash2, Save, Link as LinkIcon, RefreshCw, Filter } from "lucide-react";
import { scrollerAPI } from "../../utils/api";
import { useAuth } from "../../auth/AuthProvider";
import { useAdminBlue, AdminBlueStyle, AdminHero } from "../../components/AdminBlueTheme";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const Scroller = () => {
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
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [filterActive, setFilterActive] = useState(null); // null = all, true = active only, false = inactive only
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Crop state
  const [selectedFile, setSelectedFile] = useState(null);
  const [crop, setCrop] = useState({ unit: "%", width: 90, aspect: 16 / 9 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const imgRef = useRef(null);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", order: 0, link: "" });

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await scrollerAPI.getAll(filterActive !== null ? filterActive.toString() : null);
      
      if (response.success && response.data) {
        setImages(response.data.scrollerImages || []);
      } else if (response.error) {
        setError(response.error);
      } else {
        setError("Failed to load scroller images");
      }
    } catch (err) {
      console.error("Fetch scroller error:", err);
      setError(err.message || "Failed to load scroller images");
    } finally {
      setLoading(false);
    }
  }, [filterActive]);

  useEffect(() => {
    if (!hasPermission("scroller")) {
      setError("Access denied. Only admins can manage scroller.");
      setLoading(false);
      return;
    }
    fetchImages();
  }, [role, employeeProfile, fetchImages]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
      setSelectedFile(file);
      setShowCropModal(true);
      setCrop({ unit: "%", width: 90, aspect: 16 / 9 });
    };
    reader.readAsDataURL(file);
  };

  const getCroppedImg = (image, crop) => {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg", 0.9);
    });
  };

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) {
      setError("Please crop the image first");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      const croppedFile = new File([croppedBlob], selectedFile.name, {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("image", croppedFile);
      formData.append("title", "");
      formData.append("description", "");
      formData.append("link", "");

      const response = await scrollerAPI.upload(formData);

      if (response.success) {
        setSuccessMessage("Image uploaded successfully!");
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSuccessMessage("");
        }, 3000);
        setShowCropModal(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        setCompletedCrop(null);
        fetchImages();
      } else {
        setError(response.error || "Failed to upload image");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this scroller image?")) {
      return;
    }

    try {
      setDeletingId(id);
      setError(null);
      const response = await scrollerAPI.delete(id);
      
      if (response.success) {
        setSuccessMessage("Image deleted successfully!");
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSuccessMessage("");
        }, 3000);
        fetchImages();
      } else {
        setError(response.error || "Failed to delete image");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message || "Failed to delete image");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (image) => {
    setEditingId(image._id);
    setEditForm({
      title: image.title || "",
      description: image.description || "",
      order: image.order || 0,
      link: image.link || "",
    });
  };

  const handleSaveEdit = async () => {
    try {
      setUpdatingId(editingId);
      setError(null);
      const response = await scrollerAPI.update(editingId, editForm);
      
      if (response.success) {
        setSuccessMessage("Image updated successfully!");
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSuccessMessage("");
        }, 3000);
        setEditingId(null);
        fetchImages();
      } else {
        setError(response.error || "Failed to update image");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message || "Failed to update image");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleActive = async (image) => {
    try {
      setUpdatingId(image._id);
      setError(null);
      const response = await scrollerAPI.update(image._id, { isActive: !image.isActive });
      
      if (response.success) {
        setSuccessMessage(`Image ${!image.isActive ? "activated" : "deactivated"} successfully!`);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSuccessMessage("");
        }, 2000);
        fetchImages();
      } else {
        setError(response.error || "Failed to update image");
      }
    } catch (err) {
      console.error("Toggle active error:", err);
      setError(err.message || "Failed to update image");
    } finally {
      setUpdatingId(null);
    }
  };

  if (!hasPermission("scroller")) {
    return (
      <DashboardLayout>
        <div className="p-3 sm:p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <p className="text-red-700 text-sm">Access denied. Only admins can manage scroller.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-3 sm:p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 text-sm sm:text-base">Loading scroller...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePath="/scroller">
      <div className={`p-3 sm:p-6 ${isBlue ? "adm-blue" : ""}`}>
        {isBlue && <AdminBlueStyle />}
        {isBlue && (
          <AdminHero icon={ImageIcon} title="Scroller Management" subtitle="Upload and manage scroller images (16:9 ratio)" />
        )}
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-4">
            <div className={`flex items-center gap-2 sm:gap-3 ${isBlue ? "hidden" : ""}`}>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#3AB000] flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Scroller Management</h1>
                <p className="text-gray-600 text-xs sm:text-sm">Upload and manage scroller images (16:9 ratio)</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
              {/* Filter Buttons */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                <button
                  onClick={() => setFilterActive(null)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    filterActive === null
                      ? "bg-[#3AB000] text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterActive(true)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    filterActive === true
                      ? "bg-[#3AB000] text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterActive(false)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    filterActive === false
                      ? "bg-[#3AB000] text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Inactive
                </button>
              </div>
              {/* Refresh Button */}
              <button
                onClick={fetchImages}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 w-full sm:w-auto"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span className="sm:hidden">Refresh</span>
              </button>
              {/* Upload Button */}
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs sm:text-sm font-semibold rounded-lg cursor-pointer transition-colors w-full sm:w-auto">
                <Upload className="w-4 h-4" />
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
            <p className="text-green-700 text-xs sm:text-sm font-medium">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <p className="text-red-700 text-xs sm:text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-600 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Crop Modal */}
        {showCropModal && previewUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Crop Image (16:9 Ratio)</h2>
                  <button
                    onClick={() => {
                      setShowCropModal(false);
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setCompletedCrop(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mb-3 sm:mb-4">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={16 / 9}
                    minWidth={100}
                  >
                    <img
                      ref={imgRef}
                      src={previewUrl}
                      alt="Crop preview"
                      style={{ maxWidth: "100%", maxHeight: "60vh" }}
                      className="w-full h-auto"
                      onLoad={() => {
                        if (imgRef.current) {
                          setCrop({ unit: "%", width: 90, aspect: 16 / 9 });
                        }
                      }}
                    />
                  </ReactCrop>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setShowCropModal(false);
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setCompletedCrop(null);
                    }}
                    className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCropComplete}
                    disabled={uploading || !completedCrop}
                    className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#3AB000] rounded-lg hover:bg-[#2d8a00] disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Upload Cropped Image"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scroller Images Grid */}
        {images.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-white rounded-lg border border-gray-200">
            <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-600 text-sm sm:text-base">No scroller images. Upload your first image!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {images.map((image) => (
              <div
                key={image._id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-video bg-gray-100">
                  <img
                    src={image.imageUrl}
                    alt={image.title || "Scroller image"}
                    className="w-full h-full object-cover"
                  />
                  {!image.isActive && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white text-xs sm:text-sm font-semibold">Inactive</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => handleToggleActive(image)}
                      disabled={updatingId === image._id}
                      className={`p-1.5 sm:p-2 rounded-full text-xs sm:text-sm transition-opacity ${
                        image.isActive
                          ? "bg-green-500 text-white"
                          : "bg-gray-500 text-white"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={image.isActive ? "Deactivate" : "Activate"}
                    >
                      {updatingId === image._id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : image.isActive ? (
                        "✓"
                      ) : (
                        "✗"
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  {editingId === image._id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm({ ...editForm, title: e.target.value })
                        }
                        placeholder="Title"
                        className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3AB000]"
                      />
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({ ...editForm, description: e.target.value })
                        }
                        placeholder="Description"
                        className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3AB000]"
                      />
                      <input
                        type="text"
                        value={editForm.link}
                        onChange={(e) =>
                          setEditForm({ ...editForm, link: e.target.value })
                        }
                        placeholder="Link URL (optional)"
                        className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3AB000]"
                      />
                      <input
                        type="number"
                        value={editForm.order}
                        onChange={(e) =>
                          setEditForm({ ...editForm, order: parseInt(e.target.value) || 0 })
                        }
                        placeholder="Order"
                        className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3AB000]"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={updatingId === image._id}
                          className="flex-1 px-2 py-1.5 text-xs bg-[#3AB000] text-white rounded hover:bg-[#2d8a00] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 transition-colors"
                        >
                          {updatingId === image._id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save"
                          )}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          disabled={updatingId === image._id}
                          className="flex-1 px-2 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {image.title && (
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 break-words">
                          {image.title}
                        </p>
                      )}
                      {image.description && (
                        <p className="text-xs text-gray-600 mb-2 break-words">{image.description}</p>
                      )}
                      {image.link && (
                        <div className="flex items-center gap-1 mb-2">
                          <LinkIcon className="w-3 h-3 text-[#4D7C0F] flex-shrink-0" />
                          <a
                            href={image.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#4D7C0F] hover:underline truncate"
                          >
                            {image.link}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">Order: {image.order}</span>
                        <div className="flex gap-1 sm:gap-2">
                          <button
                            onClick={() => handleEdit(image)}
                            className="p-1 sm:p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(image._id)}
                            disabled={deletingId === image._id}
                            className="p-1 sm:p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Delete"
                          >
                            {deletingId === image._id ? (
                              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Scroller;
