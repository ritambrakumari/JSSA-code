import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { locationAPI } from "../../utils/api";
import { translateToHindi } from "../../utils/translation";
import indianStates from "../../data/states.json";
import indianDistricts from "../../data/district.json";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  MapPin,
  Home,
  Filter,
  Download,
  Upload,
  CheckCircle2
} from "lucide-react";

// ── Loading Overlay ──
function LoadingOverlay({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 min-w-[200px]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-[#3AB000] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-bold text-gray-800 animate-pulse">{message}</p>
      </div>
    </div>
  );
}

// ── Panchayat Modal ──
function PanchayatModal({ isOpen, onClose, data, onSuccess }) {
  const [formData, setFormData] = useState({
    country: "India / भारत",
    state: "",
    district: "",
    block: "",
    name: "",
    nameHi: ""
  });
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState("single");
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load districts based on state
  useEffect(() => {
    if (formData.state && indianDistricts[formData.state]) {
      setDistricts(indianDistricts[formData.state]);
    } else {
      setDistricts([]);
      setBlocks([]);
    }
  }, [formData.state]);

  // Load blocks based on state/district
  useEffect(() => {
    const fetchBlocks = async () => {
      if (formData.state && formData.district) {
        try {
          const res = await locationAPI.getBlocks({ state: formData.state, district: formData.district });
          if (Array.isArray(res)) setBlocks(res);
          else if (res.data) setBlocks(res.data);
          else setBlocks([]);
        } catch (err) {
          console.error("Error fetching blocks:", err);
        }
      } else {
        setBlocks([]);
      }
    };
    fetchBlocks();
  }, [formData.state, formData.district]);

  useEffect(() => {
    if (data) {
      setFormData({
        country: "India / भारत",
        state: data.state || "",
        district: data.district || "",
        block: data.block?._id || data.block || "",
        name: data.name || "",
        nameHi: data.nameHi || ""
      });
    } else {
      setFormData({
        country: "India / भारत",
        state: "",
        district: "",
        block: "",
        name: "",
        nameHi: ""
      });
      setBulkPreview([]);
      setBulkFile(null);
      setActiveTab("single");
    }
  }, [data, isOpen]);

  if (!isOpen) return null;

  const handleNameBlur = async () => {
    if (formData.name && !formData.nameHi) {
      setIsTranslating(true);
      const translated = await translateToHindi(formData.name);
      setFormData(prev => ({ ...prev, nameHi: translated }));
      setIsTranslating(false);
    }
  };

  const downloadTemplate = () => {
    const headers = "Country,State,District,Block Name,Panchayat Name\n";
    const sampleRows = "India,Bihar,Patna,Sadar,Rampur\n";
    const blob = new Blob([headers + sampleRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'panchayat_upload_template.csv';
    a.click();
  };

  const handleFileChange = async (e) => {
    // Check if e is a ChangeEvent (from <input>) or a raw File (from handleDrop)
    const file = e?.target?.files ? e.target.files[0] : (e instanceof File ? e : e);
    
    if (!file || !(file instanceof File)) return;
    setBulkFile(file);
    setIsTranslating(true);
    setUploadProgress(10);
    
    try {
      const res = await locationAPI.getBlocks();
      const allBlocks = Array.isArray(res) ? res : res?.data || [];
      setUploadProgress(30);
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        setUploadProgress(50);
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
        if (lines.length < 2) {
          alert("Invalid CSV");
          setIsTranslating(false);
          setUploadProgress(0);
          return;
        }

        try {
          const rows = await Promise.all(lines.slice(1).map(async (line) => {
            const parts = line.split(",").map(p => p.trim());
            const countryEn = parts[0] || "India";
            const stateEn = parts[1];
            const distEn = parts[2];
            const blockNameEn = parts[3];
            const nameEn = parts[4];
            
            const stateMatch = indianStates.find(s => s.toLowerCase().startsWith(stateEn?.toLowerCase()));
            const state = stateMatch || stateEn;
            
            let district = distEn;
            if (stateMatch && indianDistricts[stateMatch]) {
               const dMatch = indianDistricts[stateMatch].find(d => d.toLowerCase().startsWith(distEn?.toLowerCase()));
               if (dMatch) district = dMatch;
            }

            const nameHi = await translateToHindi(nameEn);
            
            const blockObj = allBlocks.find(b => 
              b.name?.trim().toLowerCase() === blockNameEn?.trim().toLowerCase() &&
              b.district?.trim() === district?.trim() &&
              b.state?.trim() === state?.trim()
            );

            return {
              country: countryEn.toLowerCase() === "india" ? "India / भारत" : countryEn,
              state,
              district,
              block: blockObj?._id || null, 
              name: nameEn,
              nameHi: nameHi,
              _blockName: blockNameEn
            };
          }));
          setUploadProgress(90);
          setBulkPreview(rows);
        } catch (csvErr) {
          console.error("Bulk CSV Translation Error:", csvErr);
        } finally {
          setIsTranslating(false);
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(0), 1000);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      alert("Error fetching blocks for mapping");
      setIsTranslating(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (activeTab === "bulk") {
        const invalidRows = bulkPreview.filter(r => !r.block);
        if (invalidRows.length > 0) {
          alert(`Error: ${invalidRows.length} rows have Block Names that don't exist in the system. Please add the Blocks first.`);
          setIsSaving(false);
          return;
        }
        const res = await locationAPI.bulkCreatePanchayats(bulkPreview);
        if (res && !res.error) {
          onSuccess();
          onClose();
        } else {
          alert(res?.error || "Bulk upload failed");
        }
        return;
      }

      let dataToSave = { ...formData };
      if (dataToSave.name && !dataToSave.nameHi) {
        try {
          const translated = await translateToHindi(dataToSave.name);
          dataToSave.nameHi = translated;
          setFormData(dataToSave);
        } catch (transErr) {
          console.error("Translation fail in submit:", transErr);
        }
      }

      let res;
      if (data?._id) {
        res = await locationAPI.updatePanchayat(data._id, dataToSave);
      } else {
        res = await locationAPI.createPanchayat(dataToSave);
      }
      
      if (res && !res.error) {
        onSuccess();
        onClose();
      } else {
        alert(res?.error || "Failed to save panchayat");
      }
    } catch (err) {
      alert("Error connecting to server");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
        <div className="flex items-center justify-between px-6 py-4 bg-[#3AB000]">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            {data ? "✏️ Edit Gram Panchayat" : "🏡 Add New Panchayat"}
          </h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {!data && (
          <div className="flex border-b border-gray-100 bg-gray-50/50">
            <button
              onClick={() => setActiveTab("single")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'single' ? 'border-[#3AB000] text-[#3AB000] bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              Single Entry
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'bulk' ? 'border-[#3AB000] text-[#3AB000] bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              Bulk Upload (CSV)
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {activeTab === "single" ? (
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Country / देश</label>
                <select
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm"
                >
                  <option value="India / भारत">India / भारत</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">State / राज्य</label>
                <select
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value, district: "", block: "" })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm"
                >
                  <option value="">Select State</option>
                  {indianStates.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">District / जिला</label>
                <select
                  required
                  disabled={!formData.state}
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value, block: "" })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm disabled:bg-gray-50"
                >
                  <option value="">Select District</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Block / प्रखंड</label>
                <select
                  required
                  disabled={!formData.district}
                  value={formData.block}
                  onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm disabled:bg-gray-50"
                >
                  <option value="">Select Block</option>
                  {blocks.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
                {formData.district && blocks.length === 0 && <p className="text-[10px] text-red-500 italic mt-1">No blocks found for this district. Add a block first.</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Gram Panchayat Name (English)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rampur"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value, nameHi: "" })}
                    onBlur={handleNameBlur}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm"
                  />
                  {isTranslating && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-[#3AB000] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {formData.nameHi && (
                  <p className="text-[10px] text-[#3AB000] font-bold mt-1 animate-in fade-in slide-in-from-top-1">
                    ✨ Auto-translated: {formData.nameHi}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <Download size={16} className="text-green-600" />
                  <span className="text-xs font-semibold text-green-700">Download Template</span>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="text-xs font-bold text-green-600 hover:underline"
                >
                  Download CSV
                </button>
              </div>

              <div 
                className={`relative group border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging ? 'border-[#3AB000] bg-[#3AB000]/10 scale-[1.02]' : 'border-gray-200 bg-gray-50/50 hover:border-[#3AB000]'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragging ? 'text-[#3AB000]' : 'text-gray-300 group-hover:text-[#3AB000]'}`} />
                <p className={`text-sm font-bold transition-colors ${isDragging ? 'text-[#3AB000]' : 'text-gray-600'}`}>
                  {bulkFile ? bulkFile.name : (isDragging ? "Drop file now!" : "Click or Drag CSV file here")}
                </p>
                <p className="text-xs text-gray-400 mt-1 uppercase font-black">Requires Blocks to already exist</p>

                {uploadProgress > 0 && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-100 overflow-hidden rounded-b-xl">
                    <div 
                      className="h-full bg-[#3AB000] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {isTranslating && <div className="text-center py-2"><div className="w-5 h-5 border-2 border-[#3AB000] border-t-transparent rounded-full animate-spin mx-auto mr-2 inline-block" /><span className="text-xs font-bold text-gray-500">Parsing & Validating...</span></div>}

              {bulkPreview.length > 0 && (
                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Preview (Top 5)</span>
                    <span className="text-[10px] font-bold text-green-600">{bulkPreview.length} Records</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    <table className="w-full text-left text-[10px]">
                      <thead className="sticky top-0 bg-white shadow-sm">
                        <tr className="text-gray-400 border-b border-gray-50">
                          <th className="px-3 py-2 font-bold uppercase">District</th>
                          <th className="px-3 py-2 font-bold uppercase">Block</th>
                          <th className="px-3 py-2 font-bold uppercase">Panchayat Name</th>
                          <th className="px-3 py-2 font-bold uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {bulkPreview.slice(0, 5).map((row, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-gray-600">{row.district}</td>
                            <td className="px-3 py-2 text-gray-600 font-bold">{row._blockName}</td>
                            <td className="px-3 py-2 text-[#3AB000] font-bold">
                              {row.name} / {row.nameHi}
                            </td>
                            <td className="px-3 py-2">
                              {row.block ? <span className="text-green-500">✅ Found</span> : <span className="text-red-500 font-black">❌ Block Not Found</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="px-6 py-4 bg-gray-50 -mx-6 -mb-6 border-t border-gray-100 flex items-center justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
            <button
              disabled={isSaving}
              className="bg-black hover:bg-[#3AB000] text-white text-sm font-medium px-8 py-2.5 rounded-sm transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isSaving ? "Saving..." : <>{activeTab === "bulk" ? <Upload size={16}/> : <Save size={16} />} {activeTab === "bulk" ? "Import All Panchayats" : "Save Panchayat"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const PanchayatManagement = () => {
  const [panchayats, setPanchayats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPanchayat, setSelectedPanchayat] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const itemsPerPage = 13;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await locationAPI.getPanchayats({
        page: currentPage,
        limit: itemsPerPage,
        state: filterState
      });
      if (res && res.data) {
        setPanchayats(res.data);
        setTotalPages(res.pages || 1);
        setTotalItems(res.total || 0);
      } else if (Array.isArray(res)) {
        setPanchayats(res);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, filterState]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        const res = await locationAPI.deletePanchayat(id);
        if (res && !res.error) loadData();
        else alert(res?.error || "Failed to delete");
      } catch {
        alert("Server error");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} panchayats?`)) {
      setIsLoading(true);
      try {
        const res = await locationAPI.deletePanchayats(selectedIds);
        if (res && !res.error) {
          setSelectedIds([]);
          loadData();
        } else {
          alert(res?.error || "Failed to delete selected panchayats");
        }
      } catch (err) {
        alert("Server error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(panchayats.map(p => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredData = panchayats;
  return (
    <DashboardLayout activePath="/location/panchayats">
      {isLoading && <LoadingOverlay message="Fetching Panchayats..." />}

      <div className="p-0 ml-0 md:ml-6 px-2 md:px-0">
        {/* ── Top Bar ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 w-full">
            <div className="flex items-center gap-2 w-full sm:w-auto bg-white border border-gray-300 rounded-sm pr-1">
              <div className="flex items-center gap-2 px-3 py-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={filterState}
                  onChange={(e) => { setFilterState(e.target.value); setCurrentPage(1); }}
                  className="px-1 text-sm outline-none bg-white h-full min-w-[140px]"
                >
                  <option value="">All States</option>
                  {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {filterState && (
                <button
                  onClick={() => {
                    const stateIds = panchayats.filter(p => p.state === filterState).map(p => p._id);
                    setSelectedIds(prev => Array.from(new Set([...prev, ...stateIds])));
                  }}
                  className="bg-[#3AB000]/10 hover:bg-[#3AB000] text-[#3AB000] hover:text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-sm transition-all"
                  title={`Select all panchayats from ${filterState}`}
                >
                  Select State
                </button>
              )}
            </div>

            <div className="flex items-center border border-gray-300 rounded overflow-hidden h-10 flex-1 w-full sm:max-w-[500px]">
              <input
                type="text"
                placeholder="Search by Panchayat Name..."
                className="flex-1 px-3 sm:px-4 text-xs sm:text-sm text-gray-700 focus:outline-none h-full bg-white transition-all shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                onClick={handleSearch}
                className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs sm:text-sm px-4 sm:px-6 h-full font-medium transition-colors whitespace-nowrap"
              >
                Search
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium px-4 sm:px-6 py-2.5 rounded-sm transition-colors whitespace-nowrap flex items-center justify-center gap-2 shadow-md animate-in fade-in slide-in-from-right-2"
              >
                <Trash2 size={16} /> Delete Selected ({selectedIds.length})
              </button>
            )}
            <button
              onClick={() => { setSelectedPanchayat(null); setIsModalOpen(true); }}
              className="bg-black hover:bg-[#3AB000] text-white text-xs sm:text-sm font-medium px-4 sm:px-6 py-2.5 rounded-sm transition-colors whitespace-nowrap w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Panchayat
            </button>
          </div>
        </div>

        <div className="hidden md:block bg-white rounded overflow-hidden border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#3AB000]">
                <th className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={panchayats.length > 0 && selectedIds.length === panchayats.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-[#3AB000] focus:ring-[#3AB000] cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3 font-bold text-black text-sm text-center">S.N</th>
                <th className="px-6 py-3 font-bold text-black text-sm text-center">State / राज्य</th>
                <th className="px-6 py-3 font-bold text-black text-sm text-center">District / जिला</th>
                <th className="px-6 py-3 font-bold text-black text-sm text-center">Block / प्रखंड</th>
                <th className="px-6 py-3 font-bold text-black text-sm text-center">Panchayat Name / पंचायत</th>
                <th className="px-6 py-3 text-center font-bold text-black text-sm">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {panchayats.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">No panchayats found.</td>
                </tr>
              ) : (
                panchayats.map((p, idx) => (
                  <tr key={p._id} className={`${selectedIds.includes(p._id) ? 'bg-[#e8f5e2]' : 'hover:bg-[#e8f5e2]'} transition-colors group`}>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p._id)}
                        onChange={() => handleSelect(p._id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#3AB000] focus:ring-[#3AB000] cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500 font-medium">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 text-center">
                      {p.state}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium text-center">
                      {p.district}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-bold text-center">
                      {p.block ? `${p.block.name} / ${p.block.nameHi || ""}` : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className="text-sm font-bold text-gray-800">{p.name} / {p.nameHi}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => { setSelectedPanchayat(p); setIsModalOpen(true); }}
                          className="text-[#3AB000] hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="text-[#3AB000] hover:text-red-500 transition-colors"
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

        <div className="md:hidden space-y-4">
          {filteredData.map((p) => (
            <div key={p._id} className={`bg-white rounded-lg border ${selectedIds.includes(p._id) ? 'border-[#3AB000] ring-1 ring-[#3AB000]' : 'border-gray-200'} p-4 shadow-sm transition-all`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p._id)}
                    onChange={() => handleSelect(p._id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#3AB000] focus:ring-[#3AB000] cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Home className="w-4 h-4 text-[#3AB000]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">{p.name}</h3>
                      <p className="text-[10px] text-gray-500">{p.nameHi}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setSelectedPanchayat(p); setIsModalOpen(true); }} className="p-1.5 text-blue-500 bg-blue-50 rounded"><Edit size={14}/></button>
                  <button onClick={() => handleDelete(p._id)} className="p-1.5 text-red-500 bg-red-50 rounded"><Trash2 size={14}/></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-gray-50 pt-3">
                <div className="flex flex-col">
                  <span className="text-gray-400 uppercase font-black tracking-tighter">Block</span>
                  <span className="font-bold text-gray-700">{p.block?.name || "N/A"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 uppercase font-black tracking-tighter">District</span>
                  <span className="font-bold text-gray-700">{p.district.split(' / ')[0]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Pagination ── */}
        {!isLoading && filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between sm:justify-end items-center gap-3 sm:gap-4 mt-6">
            <div className="text-xs sm:text-sm text-gray-600 sm:hidden">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-[#3AB000] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:bg-[#2d8a00] transition-colors rounded-sm flex-1 sm:flex-none"
              >
                Back
              </button>

              <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
                {(() => {
                  const pages = [];
                  const visiblePages = new Set([
                    1,
                    2,
                    totalPages - 1,
                    totalPages,
                    currentPage - 1,
                    currentPage,
                    currentPage + 1,
                  ]);
                  for (let i = 1; i <= totalPages; i++) {
                    if (visiblePages.has(i)) pages.push(i);
                    else if (pages[pages.length - 1] !== "...") pages.push("...");
                  }
                  return pages.map((page, idx) =>
                    page === "..." ? (
                      <span key={idx} className="px-1 text-gray-500 select-none">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors ${
                          currentPage === page
                            ? "text-[#3AB000] font-bold"
                            : "text-gray-600 hover:text-[#3AB000]"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  );
                })()}
              </div>

              <div className="sm:hidden text-sm font-medium text-gray-700 px-2">
                {currentPage}
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

      <PanchayatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedPanchayat}
        onSuccess={loadData}
      />
    </DashboardLayout>
  );
};

export default PanchayatManagement;
