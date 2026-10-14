import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { api, blogAPI } from "../../utils/api";
import { PlusCircle, Edit, Trash2, Search, X, Eye, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

const GREEN = "#3AB000";

const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    htmlContent: "",
  });

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await blogAPI.getAll();
      if (res.success) {
        setBlogs(res.data);
      }
    } catch (error) {
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "description" && value.length > 200) {
      toast.error("Description cannot exceed 200 characters");
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    try {
      setImageUploading(true);
      const uploadData = new FormData();
      uploadData.append("file", file);
      const res = await api.upload.uploadBlogImage(uploadData);
      if (res.success) {
        setFormData((prev) => ({ ...prev, image: res.data.fileUrl }));
        toast.success("Image uploaded successfully");
      }
    } catch (error) {
      toast.error("Image upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const openModal = (blog = null) => {
    if (blog) {
      setSelectedBlog(blog);
      setFormData({
        title: blog.title,
        description: blog.description,
        image: blog.image,
        htmlContent: blog.htmlContent,
      });
    } else {
      setSelectedBlog(null);
      setFormData({
        title: "",
        description: "",
        image: "",
        htmlContent: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBlog(null);
    setFormData({ title: "", description: "", image: "", htmlContent: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.image || !formData.htmlContent) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      if (selectedBlog) {
        const res = await blogAPI.update(selectedBlog._id, formData);
        if (res.success) toast.success("Blog updated successfully");
      } else {
        const res = await blogAPI.create(formData);
        if (res.success) toast.success("Blog created successfully");
      }
      closeModal();
      fetchBlogs();
    } catch (error) {
      toast.error(error.message || "Failed to save blog");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this blog?")) {
      try {
        const res = await blogAPI.delete(id);
        if (res.success) {
          toast.success("Blog deleted successfully");
          fetchBlogs();
        }
      } catch (error) {
        toast.error("Failed to delete blog");
      }
    }
  };

  const filteredBlogs = blogs.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          <div className="bg-white p-4 border border-gray-200 rounded-none shadow-sm space-y-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
                <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase">
                  <FileText className="w-6 h-6 text-[#3AB000]" />
                  Blog Management
                </h1>
              </div>

              <button
                onClick={() => openModal()}
                className="bg-black hover:bg-gray-800 text-white text-xs sm:text-sm px-5 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide"
              >
                <PlusCircle className="w-4 h-4" />
                Create Blog
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center border-t border-gray-100 pt-4">
              <div className="flex h-10 w-full flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="SEARCH ARTICLES..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm font-medium uppercase"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-none shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#3AB000] border-b border-[#3AB000]">
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em]">Image</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em]">Title</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em]">Author</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em]">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse border-b border-gray-50">
                        <td className="px-6 py-6"><div className="w-16 h-10 bg-gray-100 rounded-none" /></td>
                        <td className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-40" /></td>
                        <td className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                        <td className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                        <td className="px-6 py-6"><div className="h-10 bg-gray-100 rounded w-20 ml-auto" /></td>
                      </tr>
                    ))
                  ) : filteredBlogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-24 text-center">
                         <FileText size={64} className="text-gray-100 mx-auto mb-4" />
                         <p className="text-sm font-black text-gray-300 uppercase tracking-[0.3em]">No articles found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBlogs.map((blog) => (
                      <tr key={blog._id} className="hover:bg-[#f9fff5] transition-colors border-b border-gray-100 group">
                        <td className="px-6 py-6">
                          <div className="w-20 h-12 bg-gray-100 overflow-hidden shadow-sm shrink-0">
                            <img src={blog.image} alt="" className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="px-6 py-6 max-w-[200px]">
                          <p className="text-[12px] font-black text-gray-900 uppercase leading-tight line-clamp-2 group-hover:text-[#3AB000] transition-colors">
                            {blog.title}
                          </p>
                        </td>
                        <td className="px-6 py-6">
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                            {blog.createdBy?.name || "System"}
                          </p>
                        </td>
                        <td className="px-6 py-6">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                            {new Date(blog.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(blog)}
                              className="h-10 w-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-blue-600 border border-gray-200 hover:border-blue-200 transition-all shadow-sm"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(blog._id)}
                              className="h-10 w-10 flex items-center justify-center bg-white text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-all shadow-sm"
                              title="Delete"
                            >
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
      </div>

      {/* Main Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col border-2 border-[#3AB000]/20 shadow-2xl rounded-none overflow-hidden scale-in-center">
            <div className="bg-[#3AB000] text-white p-6 flex justify-between items-center relative shrink-0">
              <div className="relative z-10">
                <h2 className="text-xl font-black uppercase tracking-widest leading-none">
                  {selectedBlog ? "Edit Article" : "Create New Article"}
                </h2>
                <p className="text-[10px] font-bold text-green-100 uppercase tracking-[0.2em] mt-2">
                  {selectedBlog ? `ID: ${selectedBlog._id.slice(-8).toUpperCase()}` : "DRAFT MODE"}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-white/20 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="p-8 space-y-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 border-l-4 border-[#3AB000]">
                      <label className="block text-[11px] font-black text-[#3AB000] uppercase tracking-widest mb-3">Article Title *</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border-2 border-gray-100 focus:border-[#3AB000] outline-none transition-colors rounded-none font-bold text-gray-900"
                        placeholder="Enter the main headline"
                      />
                    </div>

                    <div className="bg-gray-50 p-6 border-l-4 border-[#3AB000]">
                      <label className="block text-[11px] font-black text-[#3AB000] uppercase tracking-widest mb-3 flex justify-between">
                        <span>Short Description *</span>
                        <span className="text-gray-400">{formData.description.length}/200</span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows="3"
                        className="w-full px-4 py-3 border-2 border-gray-100 focus:border-[#3AB000] outline-none transition-colors resize-none rounded-none text-[12px] font-medium"
                        placeholder="Snippet shown in the card view"
                      />
                    </div>

                    <div className="bg-gray-50 p-6 border-l-4 border-[#3AB000]">
                      <label className="block text-[11px] font-black text-[#3AB000] uppercase tracking-widest mb-3">Cover Image *</label>
                      <div className="flex items-center gap-4">
                        {formData.image && (
                          <div className="w-20 h-20 bg-gray-100 border-2 border-white shadow-md overflow-hidden shrink-0">
                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="h-20 border-2 border-dashed border-gray-300 text-center text-xs font-black text-gray-400 hover:text-[#3AB000] uppercase tracking-widest hover:border-[#3AB000] bg-white transition-colors flex items-center justify-center gap-2">
                            {imageUploading ? <Loader2 size={18} className="animate-spin text-[#3AB000]" /> : <ImageIcon size={18} />}
                            {imageUploading ? "Processing..." : "Drop Image Here"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-full flex flex-col bg-gray-50 p-6 border-l-4 border-[#3AB000]">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-[11px] font-black text-[#3AB000] uppercase tracking-widest">Full HTML Content *</label>
                      <button
                        type="button"
                        onClick={() => setIsPreviewOpen(true)}
                        className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-[#3AB000] flex items-center gap-1 transition-colors"
                      >
                        <Eye size={12} /> Live Preview
                      </button>
                    </div>
                    <textarea
                      name="htmlContent"
                      value={formData.htmlContent}
                      onChange={handleInputChange}
                      required
                      className="w-full flex-1 min-h-[350px] px-4 py-4 border-2 border-gray-100 focus:border-[#3AB000] outline-none transition-colors font-mono text-xs bg-white rounded-none custom-scrollbar"
                      placeholder="<div class='custom-blog-styles'>&#10;  Paste rich HTML here...&#10;</div>"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center gap-4 shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 h-14 bg-white border-2 border-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 hover:text-gray-600 transition-all rounded-none"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={submitting || imageUploading}
                  className="flex-[2] h-14 bg-[#3AB000] text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-green-200 hover:bg-[#2d8a00] transition-all flex items-center justify-center gap-3 disabled:opacity-50 rounded-none"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                  {selectedBlog ? "Update Article" : "Publish Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HTML Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl h-[80vh] flex flex-col border-2 border-[#3AB000]/20 shadow-2xl scale-in-center rounded-none overflow-hidden">
            <div className="bg-gray-100 border-b border-gray-200 p-6 flex justify-between items-center shrink-0">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-[#3AB000] flex items-center gap-2">
                <Eye size={16} /> Article Render Preview
              </h2>
              <button onClick={() => setIsPreviewOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-white html-preview-container custom-scrollbar">
              <div dangerouslySetInnerHTML={{ __html: formData.htmlContent || "<p class='text-gray-400 italic text-sm'>No HTML content to preview.</p>" }} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in-center {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .scale-in-center {
          animation: scale-in-center 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1761b0;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #123b68;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default BlogManagement;
