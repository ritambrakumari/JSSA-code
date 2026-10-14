import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { pharmacyProductsAPI, pharmacyCategoriesAPI } from "../../utils/api";
import { Plus, Edit2, Trash2, Search, X, Filter, Package, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "../../components/Pagination";

const PharmacyProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    price: "",
    stock: "",
    description: "",
    status: "Active"
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await pharmacyCategoriesAPI.getAll();
      if (res.success) setCategories(res.categories);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await pharmacyProductsAPI.getAll(selectedCategory, { page, limit: 10, search: searchTerm, status: selectedStatus });
      if (res.success) {
        setProducts(res.products);
        if (res.totalPages) setTotalPages(res.totalPages);
        if (res.totalProducts !== undefined) setTotalProducts(res.totalProducts);
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
      toast.error("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedStatus, searchTerm, page]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    setPage(1);
  };

  const handleOpenModal = (product = null) => {
    if (categories.length === 0) {
      toast.error("Please create a category first before adding medicines.");
      return;
    }

    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        categoryId: product.categoryId?._id || product.categoryId,
        price: product.price,
        stock: product.stock,
        description: product.description || "",
        status: product.status
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        categoryId: categories.length > 0 ? categories[0]._id : "",
        price: "",
        stock: "0",
        description: "",
        status: "Active"
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const res = await pharmacyProductsAPI.update(editingProduct._id, formData);
        if (res.success) {
          toast.success("Medicine updated successfully");
          fetchProducts();
          handleCloseModal();
        }
      } else {
        const res = await pharmacyProductsAPI.create(formData);
        if (res.success) {
          toast.success("Medicine added successfully");
          fetchProducts();
          handleCloseModal();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "An error occurred");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      try {
        const res = await pharmacyProductsAPI.delete(id);
        if (res.success) {
          toast.success("Medicine deleted successfully");
          fetchProducts();
        }
      } catch (error) {
        toast.error("Failed to delete medicine");
      }
    }
  };

  const generateDummyProducts = async () => {
    if (categories.length === 0) {
      toast.error("Please add categories first before generating products.", { id: "dummy-prod" });
      return;
    }

    setIsGenerating(true);
    toast.loading("Generating 25 dummy medicines...", { id: "dummy-prod" });
    try {
      const promises = [];
      const medMap = {
        "Tablets": ["Paracetamol", "Ibuprofen", "Aspirin", "Cetirizine", "Metformin", "Amoxicillin"],
        "Syrups": ["Cough Syrup", "Paracetamol Syrup", "Cetirizine Syrup", "Multivitamin Syrup", "Antacid Gel"],
        "Injections": ["Insulin", "Tetanus Toxoid", "Vitamin B12", "Diclofenac Injection", "Ondansetron Injection"],
        "Capsules": ["Omeprazole", "Pantoprazole", "Vitamin E", "Amoxicillin", "Doxycycline"],
        "Ointments": ["Povidone Iodine", "Diclofenac Gel", "Clotrimazole Cream", "Mupirocin Ointment"],
        "Eye Drops": ["Carboxymethylcellulose", "Ciprofloxacin Drops", "Timolol Drops", "Ketorolac Drops"],
        "Inhalers": ["Salbutamol Inhaler", "Budesonide Inhaler", "Fluticasone Inhaler", "Ipratropium Bromide"],
        "Protein Powders": ["Whey Protein", "Ensure Powder", "Protinex", "Pediasure"],
        "Skin Creams": ["Hydrocortisone Cream", "Betamethasone Cream", "Aloe Vera Cream", "Ketoconazole Cream"],
        "Pain Gels": ["Volini Gel", "Moov", "Omnigel", "Fast Relief"],
        "Lotions": ["Calamine Lotion", "Moisturizing Lotion", "Sunscreen SPF 50", "Clindamycin Lotion"],
        "Medical Patches": ["Nicotine Patch", "Diclofenac Patch", "Fentanyl Patch"],
        "Suppositories": ["Glycerin Suppository", "Bisacodyl Suppository", "Diclofenac Suppository"],
        "Nasal Sprays": ["Oxymetazoline Spray", "Fluticasone Spray", "Xylometazoline Spray", "Saline Nasal Spray"],
        "Suspensions": ["Ibuprofen Suspension", "Azithromycin Suspension", "Albendazole Suspension", "Paracetamol Suspension"]
      };

      const fallbackNames = ["Generic Medicine A", "Generic Medicine B", "Generic Medicine C"];

      for (let i = 1; i <= 25; i++) {
        const randomCat = categories[Math.floor(Math.random() * categories.length)];
        const catBaseName = randomCat.name.replace(/[0-9]/g, '').trim(); // Remove random numbers appended during category gen
        const possibleNames = medMap[catBaseName] || fallbackNames;
        const randomName = possibleNames[Math.floor(Math.random() * possibleNames.length)] + " " + (Math.floor(Math.random() * 50) * 10) + "mg";

        promises.push(
          pharmacyProductsAPI.create({
            name: randomName,
            categoryId: randomCat._id,
            price: Math.floor(Math.random() * 500) + 10,
            stock: Math.floor(Math.random() * 200) + 1,
            description: `Automatically generated dummy medicine for ${randomCat.name}.`,
            status: "Active"
          })
        );
      }
      await Promise.allSettled(promises);
      toast.success("Dummy medicines added!", { id: "dummy-prod" });
      setPage(1);
      fetchProducts();
    } catch (error) {
      toast.error("Failed to generate some medicines", { id: "dummy-prod" });
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
                <Package className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Medicine Management</h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Manage your pharmacy inventory</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-none text-center md:text-right shrink-0">
              <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Total Medicines</p>
              <p className="text-xl font-black text-white uppercase mt-1">{totalProducts || products.length}</p>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-gray-50 border border-gray-150 p-4 rounded-none flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Package size={14} className="text-[#3AB000]" />
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Inventory Controls</span>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full md:max-w-3xl lg:ml-auto">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-4 h-9 border border-gray-200 rounded-none focus:ring-1 focus:ring-[#3AB000] outline-none text-[11px] font-bold"
                />
              </div>
              <div className="relative w-full md:w-56 shrink-0">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="w-full pl-9 pr-8 h-9 border border-gray-200 rounded-none focus:ring-1 focus:ring-[#3AB000] outline-none text-[11px] font-bold appearance-none bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
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
                  <option value="Out of Stock">Out of Stock</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {/* <button
                onClick={generateDummyProducts}
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
                <Plus size={14} />
                <span className="hidden sm:inline">Add Medicine</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-none border border-gray-200 overflow-hidden relative min-h-[400px] flex flex-col justify-between">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-black uppercase text-[11px] tracking-widest border-b border-gray-150">
                    <th className="px-6 py-4">Medicine Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price (₹)</th>
                    <th className="px-6 py-4">Stock Details</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3AB000] mx-auto"></div>
                          <p className="text-[10px] font-black uppercase tracking-widest">Loading...</p>
                        </div>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
                          <Package size={24} className="text-gray-300" />
                          <p className="text-[10px] font-black uppercase tracking-widest">No Medicines Found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product._id} className="hover:bg-[#f9fff5] transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-[13px] font-semibold text-gray-900 uppercase">{product.name}</p>
                          {product.description && (
                            <p className="text-[10px] font-bold text-gray-500 truncate max-w-[150px] mt-1">{product.description}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-xs font-bold text-gray-700 uppercase">{product.categoryId?.name || "N/A"}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-[13px] font-black text-[#3AB000]">₹{product.price}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            <div className={`px-2 py-1 inline-flex items-center gap-1.5 w-max text-[9px] font-black uppercase tracking-widest border rounded-none ${product.stock <= 5 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-[#f9fff5] text-[#3AB000] border-[#3AB000]/30'}`}>
                              <span>Available:</span>
                              <span className="text-[11px]">{product.stock}</span>
                            </div>
                            <div className="px-2 py-1 inline-flex items-center gap-1.5 w-max text-[9px] font-black uppercase tracking-widest border border-gray-200 bg-gray-50 text-gray-600 rounded-none">
                              <span>Sold:</span>
                              <span className="text-[11px] text-gray-700">{product.soldQuantity || 0}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border rounded-none 
                            ${product.status === "Active" ? "bg-[#f9fff5] text-[#3AB000] border-[#3AB000]/30" :
                              product.status === "Out of Stock" ? "bg-red-50 text-red-500 border-red-200" :
                                "bg-gray-50 text-gray-600 border-gray-200"
                            }`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(product)}
                              className="h-8 w-8 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 transition-all rounded-none"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(product._id)}
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
                  <Package size={14} /> {editingProduct ? "Edit Medicine" : "Add Medicine"}
                </h2>
                <button onClick={handleCloseModal} className="text-white/80 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-5 bg-white">
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.15em] mb-1.5">Medicine Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 h-10 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3AB000] outline-none rounded-none transition-all placeholder:text-gray-400"
                      placeholder="e.g. Dolo 650"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.15em] mb-1.5">Category <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div
                        onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                        className={`w-full px-4 h-10 text-xs font-bold bg-gray-50 border ${isCatDropdownOpen ? 'border-[#3AB000] bg-white' : 'border-gray-200'} outline-none rounded-none transition-all flex items-center justify-between cursor-pointer`}
                      >
                        <span className={formData.categoryId ? "text-gray-900" : "text-gray-400"}>
                          {categories.find(c => c._id === formData.categoryId)?.name || "Select a category"}
                        </span>
                        <svg className={`fill-current h-4 w-4 text-gray-500 transition-transform ${isCatDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                      </div>

                      {/* Hidden input for HTML5 required validation */}
                      <input type="text" className="h-0 w-0 absolute opacity-0 pointer-events-none" required value={formData.categoryId} onChange={() => { }} />

                      {isCatDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsCatDropdownOpen(false)}></div>
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 shadow-xl max-h-48 overflow-y-auto">
                            {categories.filter(cat => cat.status === "Active" || cat._id === formData.categoryId).map(cat => (
                              <div
                                key={cat._id}
                                onClick={() => {
                                  setFormData({ ...formData, categoryId: cat._id });
                                  setIsCatDropdownOpen(false);
                                }}
                                className={`relative z-30 px-4 py-3 text-xs font-bold cursor-pointer hover:bg-gray-50 ${formData.categoryId === cat._id ? 'bg-[#f9fff5] text-[#3AB000] border-l-2 border-[#3AB000]' : 'text-gray-700 border-l-2 border-transparent'}`}
                              >
                                {cat.name}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.15em] mb-1.5">Price (₹) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 h-10 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3AB000] outline-none rounded-none transition-all placeholder:text-gray-400"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.15em] mb-1.5">Stock <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full px-4 h-10 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3AB000] outline-none rounded-none transition-all placeholder:text-gray-400"
                        placeholder="Quantity"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.15em] mb-1.5">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3AB000] outline-none rounded-none transition-all placeholder:text-gray-400"
                      placeholder="Optional details"
                      rows="2"
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
                      <option value="Out of Stock" disabled={formData.stock > 0}>Out of Stock</option>
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
                    {editingProduct ? "Update" : "Add"}
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

export default PharmacyProductList;
