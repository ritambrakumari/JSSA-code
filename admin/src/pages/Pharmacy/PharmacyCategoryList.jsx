import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { pharmacyCategoriesAPI } from "../../utils/api";
import { Plus, Edit2, Trash2, Search, X, LayoutGrid, Loader2, Filter } from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "../../components/Pagination";

const PharmacyCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Active"
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await pharmacyCategoriesAPI.getAll({ page, limit: 10, search: searchTerm, status: selectedStatus });
      if (res.success) {
        setCategories(res.categories);
        if (res.totalPages) setTotalPages(res.totalPages);
        if (res.totalCategories !== undefined) setTotalCategories(res.totalCategories);
      }

    } catch (error) {
      console.error("Failed to fetch categories", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedStatus, page]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    setPage(1);
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
        status: category.status
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
        status: "Active"
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const res = await pharmacyCategoriesAPI.update(editingCategory._id, formData);
        if (res.success) {
          toast.success("Category updated successfully");
          fetchCategories();
          handleCloseModal();
        }
      } else {
        const res = await pharmacyCategoriesAPI.create(formData);
        if (res.success) {
          toast.success("Category created successfully");
          fetchCategories();
          handleCloseModal();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "An error occurred");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        const res = await pharmacyCategoriesAPI.delete(id);
        if (res.success) {
          toast.success("Category deleted successfully");
          fetchCategories();
        }
      } catch (error) {
        toast.error("Failed to delete category");
      }
    }
  };

  const generateDummyCategories = async () => {
    setIsGenerating(true);
    toast.loading("Generating 15 dummy categories...", { id: "dummy-cat" });
    try {
      const promises = [];
      const categoryNames = [
        "Tablets", "Syrups", "Injections", "Capsules", "Ointments",
        "Eye Drops", "Inhalers", "Protein Powders", "Skin Creams", "Pain Gels",
        "Lotions", "Medical Patches", "Suppositories", "Nasal Sprays", "Suspensions"
      ];

      for (let i = 0; i < 15; i++) {
        promises.push(
          pharmacyCategoriesAPI.create({
            name: categoryNames[i] + " " + Math.floor(Math.random() * 100),
            description: `Automatically generated ${categoryNames[i]} category for testing.`,
            status: "Active"
          })
        );
      }
      await Promise.allSettled(promises);
      toast.success("Dummy categories added!", { id: "dummy-cat" });
      setPage(1);
      fetchCategories();
    } catch (error) {
      toast.error("Failed to generate some categories", { id: "dummy-cat" });
    } finally {
      setIsGenerating(false);
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
                <LayoutGrid className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Category Management</h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Manage your pharmacy product categories</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-none text-center md:text-right shrink-0">
              <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Total Categories</p>
              <p className="text-xl font-black text-white uppercase mt-1">{totalCategories || categories.length}</p>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-gray-50 border border-gray-150 p-4 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 shrink-0">
              <LayoutGrid size={14} className="text-[#3AB000]" />
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Directory Controls</span>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full md:max-w-3xl lg:ml-auto">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-4 h-9 border border-gray-200 rounded-none focus:ring-1 focus:ring-[#3AB000] outline-none text-[11px] font-bold"
                />
              </div>

              <div className="relative w-full md:w-48 shrink-0">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={selectedStatus}
                  onChange={handleStatusChange}
                  className="w-full pl-9 pr-8 h-9 border border-gray-200 rounded-none focus:ring-1 focus:ring-[#3AB000] outline-none text-[11px] font-bold appearance-none bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {/* <button
                onClick={generateDummyCategories}
                disabled={isGenerating}
                className="bg-[#6b7280] hover:bg-gray-800 text-white px-4 h-9 flex items-center justify-center gap-2 transition-colors rounded-none shrink-0"
              >
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Add Dummy Data</span>
              </button> */}
              <button
                onClick={() => handleOpenModal()}
                className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-[10px] px-5 h-9 font-black uppercase tracking-wider transition-all flex items-center gap-2 rounded-none shadow-sm shrink-0"
              >
                <Plus size={14} /> Add Category
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-none border border-gray-200 overflow-hidden relative min-h-[400px] flex flex-col justify-between">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-black uppercase text-[11px] tracking-widest border-b border-gray-150">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3AB000] mx-auto"></div>
                          <p className="text-[10px] font-black uppercase tracking-widest">Loading...</p>
                        </div>
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
                          <LayoutGrid size={24} className="text-gray-300" />
                          <p className="text-[10px] font-black uppercase tracking-widest">No Categories Found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    categories.map((category) => (
                      <tr key={category._id} className="hover:bg-[#f9fff5] transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-[13px] font-semibold text-gray-900 uppercase">{category.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-gray-600 truncate max-w-xs">{category.description || "-"}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border rounded-none ${category.status === "Active" ? "bg-[#f9fff5] text-[#3AB000] border-[#3AB000]/30" : "bg-gray-50 text-gray-600 border-gray-200"
                            }`}>
                            {category.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(category)}
                              className="h-8 w-8 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 transition-all rounded-none"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(category._id)}
                              className="h-8 w-8 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200 transition-all rounded-none"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination UI */}
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white shadow-2xl w-full max-w-md overflow-hidden flex flex-col rounded-none border border-[#3AB000]">
              <div className="bg-[#3AB000] px-6 py-4 flex items-center justify-between">
                <h2 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                  <LayoutGrid size={14} /> {editingCategory ? "Edit Category" : "Add Category"}
                </h2>
                <button onClick={handleCloseModal} className="text-white/80 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-5 bg-white">
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.15em] mb-1.5">Category Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 h-10 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3AB000] outline-none rounded-none transition-all placeholder:text-gray-400"
                      placeholder="e.g. Tablets, Syrups"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.15em] mb-1.5">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3AB000] outline-none rounded-none transition-all placeholder:text-gray-400"
                      placeholder="Optional details"
                      rows="3"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.15em] mb-1.5">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 h-10 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3AB000] outline-none rounded-none transition-all"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="p-5 border-t border-gray-150 bg-white flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 h-10 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 h-10 bg-[#3AB000] hover:bg-[#2d8a00] text-white text-[10px] font-black uppercase tracking-wider transition-all min-w-[140px] rounded-none"
                  >
                    {editingCategory ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PharmacyCategoryList;
