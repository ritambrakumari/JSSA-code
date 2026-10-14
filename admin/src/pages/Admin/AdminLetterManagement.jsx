import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { lettersAPI, locationAPI } from "../../utils/api";
import statesData from "../../data/states.json";
import districtsData from "../../data/district.json";
import {
  FileText,
  Plus,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Upload,
  Eye,
  Download,
  RefreshCw,
  FileSearch,
  Users,
  MapPin,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-hot-toast";

// Helper to fix local/production URLs
const cleanImageUrl = (url) => {
  if (!url) return "";

  const API_BASE_URL = import.meta.env.MODE === "development"
    ? "http://localhost:3005/api"
    : "https://api.jssabhiyan.com/api";

  if (url.includes("localhost:3005/api")) {
    return url.replace("http://localhost:3005/api", API_BASE_URL);
  }

  if (url.includes("api.jssabhiyan.com/api") && import.meta.env.MODE === "development") {
    return url.replace("https://api.jssabhiyan.com/api", API_BASE_URL);
  }

  if (url.startsWith("http")) return url;

  if (url.startsWith("/api/")) {
    const base = API_BASE_URL.endsWith("/api") ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    return `${base}${url}`;
  }

  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${path}`;
};

const LocationBadge = ({ state, district, blockName, panchayatName }) => {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-black uppercase text-gray-800 tracking-wider">
        {state}
      </span>
      {district && (
        <span className="text-[9px] font-bold uppercase text-gray-500">
          Dist: {district} {blockName ? `| Block: ${blockName}` : ""}
        </span>
      )}
      {panchayatName && (
        <span className="text-[9px] font-bold uppercase text-gray-500">
          GP: {panchayatName}
        </span>
      )}
    </div>
  );
};

const AdminLetterManagement = () => {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterState, setFilterState] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterDistrictsList, setFilterDistrictsList] = useState([]);

  // New States for hierarchical letters and employee uploads
  const [activeTab, setActiveTab] = useState("admin");
  const [uploadLevel, setUploadLevel] = useState("Panchayat");

  // Upload form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Locations for upload
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedPanchayat, setSelectedPanchayat] = useState("");

  const [districtsList, setDistrictsList] = useState([]);
  const [blocksList, setBlocksList] = useState([]);
  const [panchayatsList, setPanchayatsList] = useState([]);

  // Manual addition state
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlockName, setNewBlockName] = useState("");
  const [isAddingBlock, setIsAddingBlock] = useState(false);

  const [showAddPanchayat, setShowAddPanchayat] = useState(false);
  const [newPanchayatName, setNewPanchayatName] = useState("");
  const [isAddingPanchayat, setIsAddingPanchayat] = useState(false);

  const [showAddDistrict, setShowAddDistrict] = useState(false);
  const [newDistrictName, setNewDistrictName] = useState("");
  const [isAddingDistrict, setIsAddingDistrict] = useState(false);

  // Files state: array of { id, file, title }
  const [filesData, setFilesData] = useState([]);

  // Delete confirm
  const [deletingId, setDeletingId] = useState(null);

  // Grouped view state
  const [selectedGroupKey, setSelectedGroupKey] = useState(null);

  // View modal + download
  const [viewLetter, setViewLetter] = useState(null);
  const [downloading, setDownloading] = useState(null);

  // Proper blob download — no new tab
  const handleDownload = async (letter) => {
    try {
      setDownloading(letter._id);
      const response = await fetch(cleanImageUrl(letter.fileUrl));
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const ext = letter.fileType === "pdf" ? ".pdf" : ".jpg";
      const filename = `${letter.title.replace(/[^a-z0-9]/gi, "_")}${ext}`;
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
      setDownloading(null);
    }
  };

  // ----------------------------------------
  // Location Effects for Filter
  // ----------------------------------------
  useEffect(() => {
    if (filterState) {
      setFilterDistrictsList(districtsData[filterState] || []);
    } else {
      setFilterDistrictsList([]);
    }
  }, [filterState]);

  const fetchLetters = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterState) params.state = filterState.split(" / ")[0].trim();
      if (filterDistrict) params.district = filterDistrict.split(" / ")[0].trim();
      params.isEmployeeUpload = activeTab === "employee";

      const res = await lettersAPI.getAll(params);
      if (res.success) {
        setLetters(res.data || []);
        if (selectedGroupKey) setSelectedGroupKey(null);
      } else {
        toast.error(res.error || "Failed to load letters");
      }
    } catch {
      toast.error("Could not fetch letters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, [filterState, filterDistrict, activeTab]);

  // ----------------------------------------
  // Location Effects for Upload Modal
  // ----------------------------------------
  useEffect(() => {
    const fetchDistricts = async () => {
      if (selectedState) {
        const staticList = districtsData[selectedState] || [];
        try {
          const cleanState = selectedState.split(" / ")[0].trim();
          const res = await locationAPI.getCustomDistricts(cleanState);
          const customList = res.data ? res.data.map(d => d.name) : [];
          
          const combined = [...new Set([...staticList, ...customList])];
          setDistrictsList(combined.sort((a, b) => a.localeCompare(b)));
        } catch (error) {
          console.error("Fetch custom districts error:", error);
          setDistrictsList(staticList);
        }
      } else {
        setDistrictsList([]);
      }
    };
    fetchDistricts();
  }, [selectedState]);

  useEffect(() => {
    const fetchBlocks = async () => {
      if (!selectedDistrict) {
        setBlocksList([]);
        return;
      }
      try {
        const cleanState = selectedState.split(" / ")[0].trim();
        const cleanDistrict = selectedDistrict.split(" / ")[0].trim();
        const res = await locationAPI.getBlocks({
          state: cleanState,
          district: cleanDistrict,
          all: true
        });
        setBlocksList(Array.isArray(res) ? res : res.data || []);
      } catch (error) {
        toast.error("Failed to load blocks");
      }
    };
    fetchBlocks();
  }, [selectedDistrict, selectedState]);

  useEffect(() => {
    const fetchPanchayats = async () => {
      if (!selectedBlock) {
        setPanchayatsList([]);
        return;
      }
      try {
        const res = await locationAPI.getPanchayats({
          blockId: selectedBlock,
          all: true
        });
        setPanchayatsList(Array.isArray(res) ? res : res.data || []);
      } catch (error) {
        toast.error("Failed to load panchayats");
      }
    };
    fetchPanchayats();
  }, [selectedBlock]);

  // ----------------------------------------
  // Upload Modal Handlers
  // ----------------------------------------
  const openModal = () => {
    setSelectedState("");
    setSelectedDistrict("");
    setSelectedBlock("");
    setSelectedPanchayat("");
    setFilesData([]);
    setShowErrors(false);
    setShowAddDistrict(false);
    setNewDistrictName("");
    setShowAddBlock(false);
    setNewBlockName("");
    setShowAddPanchayat(false);
    setNewPanchayatName("");
    setIsModalOpen(true);
  };

  const handleAddBlock = async () => {
    if (!newBlockName.trim()) {
      toast.error("Please enter a block name");
      return;
    }
    setIsAddingBlock(true);
    try {
      const cleanState = selectedState.split(" / ")[0].trim();
      const cleanDistrict = selectedDistrict.split(" / ")[0].trim();
      const res = await locationAPI.createBlock({
        state: cleanState,
        district: cleanDistrict,
        name: newBlockName.trim(),
        nameHi: newBlockName.trim()
      });
      const newBlock = res.data || res;
      setBlocksList(prev => [...prev, newBlock].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedBlock(newBlock._id);
      setNewBlockName("");
      setShowAddBlock(false);
      toast.success("Block added successfully");
    } catch (err) {
      toast.error("Failed to add block");
    } finally {
      setIsAddingBlock(false);
    }
  };

  const handleAddPanchayat = async () => {
    if (!newPanchayatName.trim()) {
      toast.error("Please enter a panchayat name");
      return;
    }
    setIsAddingPanchayat(true);
    try {
      const cleanState = selectedState.split(" / ")[0].trim();
      const cleanDistrict = selectedDistrict.split(" / ")[0].trim();
      const res = await locationAPI.createPanchayat({
        state: cleanState,
        district: cleanDistrict,
        block: selectedBlock,
        name: newPanchayatName.trim(),
        nameHi: newPanchayatName.trim()
      });
      const newPanch = res.data || res;
      setPanchayatsList(prev => [...prev, newPanch].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedPanchayat(newPanch._id);
      setNewPanchayatName("");
      setShowAddPanchayat(false);
      toast.success("Panchayat added successfully");
    } catch (err) {
      toast.error("Failed to add panchayat");
    } finally {
      setIsAddingPanchayat(false);
    }
  };

  const handleAddDistrict = async () => {
    if (!newDistrictName.trim() || !selectedState) {
      toast.error("Please enter a district name");
      return;
    }
    setIsAddingDistrict(true);
    try {
      const cleanState = selectedState.split(" / ")[0].trim();
      
      const res = await locationAPI.createDistrict({
        state: cleanState,
        name: newDistrictName.trim()
      });
      
      const newDist = res.data?.name || res.name || newDistrictName.trim();
      setDistrictsList(prev => {
        const updated = [...prev, newDist];
        return [...new Set(updated)].sort((a, b) => a.localeCompare(b));
      });
      setSelectedDistrict(newDist);
      setNewDistrictName("");
      setShowAddDistrict(false);
      toast.success("District added successfully");
    } catch (err) {
      toast.error("Failed to add district");
    } finally {
      setIsAddingDistrict(false);
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
        title: f.name.replace(/\.[^/.]+$/, "") // default title without extension
      });
    });

    setFilesData(prev => [...prev, ...newFilesData]);
    e.target.value = ""; // reset input
  };

  const updateFileTitle = (id, newTitle) => {
    setFilesData(prev => prev.map(item => item.id === id ? { ...item, title: newTitle } : item));
  };

  const removeFile = (id) => {
    setFilesData(prev => prev.filter(item => item.id !== id));
  };

  const handleUpload = async () => {
    if (!selectedState) {
      setShowErrors(true);
      toast.error("State is required");
      return;
    }
    if (["District", "Block", "Panchayat"].includes(uploadLevel) && !selectedDistrict) {
      setShowErrors(true);
      toast.error("District is required for this level");
      return;
    }
    if (["Block", "Panchayat"].includes(uploadLevel) && !selectedBlock) {
      setShowErrors(true);
      toast.error("Block is required for this level");
      return;
    }
    if (uploadLevel === "Panchayat" && !selectedPanchayat) {
      setShowErrors(true);
      toast.error("Panchayat is required for this level");
      return;
    }

    if (filesData.length === 0) {
      setShowErrors(true);
      toast.error("Please add at least one document");
      return;
    }
    const hasEmptyTitles = filesData.some(f => !f.title.trim());
    if (hasEmptyTitles) {
      setShowErrors(true);
      toast.error("All files must have a title");
      return;
    }

    try {
      setUploading(true);
      const fd = new FormData();

      const cleanState = selectedState.split(" / ")[0].trim();
      const cleanDistrict = selectedDistrict.split(" / ")[0].trim();
      const blockName = blocksList.find(b => b._id === selectedBlock)?.name || "";
      const panchayatName = panchayatsList.find(p => p._id === selectedPanchayat)?.name || "";

      const meta = filesData.map(item => ({
        title: item.title.trim(),
        state: cleanState,
        district: ["District", "Block", "Panchayat"].includes(uploadLevel) ? cleanDistrict : "",
        block: ["Block", "Panchayat"].includes(uploadLevel) ? selectedBlock : "",
        blockName: ["Block", "Panchayat"].includes(uploadLevel) ? blockName : "",
        panchayat: uploadLevel === "Panchayat" ? selectedPanchayat : "",
        panchayatName: uploadLevel === "Panchayat" ? panchayatName : "",
        letterLevel: uploadLevel
      }));

      filesData.forEach(item => {
        fd.append("files", item.file);
      });
      fd.append("metadata", JSON.stringify(meta));

      const res = await lettersAPI.upload(fd);
      if (res.success) {
        toast.success(`Successfully uploaded ${filesData.length} letters!`);
        setIsModalOpen(false);
        fetchLetters();
      } else {
        toast.error(res.error || "Upload failed");
      }
    } catch {
      toast.error("Server error during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this letter? This cannot be undone.")) return;
    try {
      setDeletingId(id);
      const res = await lettersAPI.deleteLetter(id);
      if (res.success) {
        toast.success("Letter deleted");
        setLetters(prev => prev.filter(l => l._id !== id));
      } else {
        toast.error(res.error || "Delete failed");
      }
    } catch {
      toast.error("Server error during delete");
    } finally {
      setDeletingId(null);
    }
  };

  const totalLetters = letters.length;

  const groupedLettersMap = letters.reduce((acc, letter) => {
    const key = `${letter.state}|${letter.district}|${letter.block || ''}|${letter.panchayat || ''}`;
    if (!acc[key]) {
      acc[key] = {
        key,
        state: letter.state,
        district: letter.district,
        blockName: letter.blockName,
        panchayatName: letter.panchayatName,
        documents: [],
        createdAt: letter.createdAt,
      };
    }
    acc[key].documents.push(letter);
    if (new Date(letter.createdAt) > new Date(acc[key].createdAt)) {
      acc[key].createdAt = letter.createdAt;
    }
    return acc;
  }, {});

  const groupedLetters = Object.values(groupedLettersMap).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const currentDisplayLetters = selectedGroupKey ? (groupedLettersMap[selectedGroupKey]?.documents || []) : groupedLetters;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">

        {/* ── Top Stats Row ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mr-4">
          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Documents</span>
              <span className="text-2xl font-black text-gray-800 leading-none">{loading ? "..." : totalLetters}</span>
            </div>
            <div className="p-3 bg-gray-100 text-gray-500">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ── Filter Bar Section ── */}
        <div className="bg-white p-4 border border-gray-200 shadow-sm space-y-4 mr-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
              <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase shrink-0">
                <FileText className="w-6 h-6 text-[#3AB000]" />
                Document Management
              </h1>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0">
              {activeTab === 'admin' && (
                <div className="flex bg-white border border-[#3AB000] rounded shadow-sm shrink-0">
                  <button onClick={() => { setUploadLevel("State"); openModal(); }} className="flex items-center gap-1.5 px-3 h-10 text-[10px] font-black uppercase tracking-widest bg-white hover:bg-[#3AB000] text-[#3AB000] hover:text-white transition-all border-r border-[#3AB000]"><Plus size={12} /> State Letter</button>
                  <button onClick={() => { setUploadLevel("District"); openModal(); }} className="flex items-center gap-1.5 px-3 h-10 text-[10px] font-black uppercase tracking-widest bg-white hover:bg-[#3AB000] text-[#3AB000] hover:text-white transition-all border-r border-[#3AB000]"><Plus size={12} /> District Letter</button>
                  <button onClick={() => { setUploadLevel("Block"); openModal(); }} className="flex items-center gap-1.5 px-3 h-10 text-[10px] font-black uppercase tracking-widest bg-white hover:bg-[#3AB000] text-[#3AB000] hover:text-white transition-all border-r border-[#3AB000]"><Plus size={12} /> Block Letter</button>
                  <button onClick={() => { setUploadLevel("Panchayat"); openModal(); }} className="flex items-center gap-1.5 px-3 h-10 text-[10px] font-black uppercase tracking-widest bg-white hover:bg-[#3AB000] text-[#3AB000] hover:text-white transition-all"><Plus size={12} /> Panchayat Letter</button>
                </div>
              )}
              <button
                onClick={fetchLetters}
                className="bg-black hover:bg-gray-800 text-white text-[10px] px-5 h-10 font-black uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 rounded shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>
          </div>

          {/* Location Filters for Table */}
          <div className="flex items-center gap-4 border-t border-gray-100 pt-4 flex-wrap">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter By:</span>
            </div>
            <select
              value={filterState}
              onChange={(e) => {
                setFilterState(e.target.value);
                setFilterDistrict("");
              }}
              className="px-4 h-10 border border-gray-200 text-xs font-black text-gray-700 uppercase tracking-wider outline-none focus:border-[#3AB000]"
            >
              <option value="">All States</option>
              {statesData.map((s) => (
                <option key={s} value={s}>{s.split(" / ")[0]}</option>
              ))}
            </select>

            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              disabled={!filterState}
              className="px-4 h-10 border border-gray-200 text-xs font-black text-gray-700 uppercase tracking-wider outline-none focus:border-[#3AB000] disabled:opacity-50"
            >
              <option value="">All Districts</option>
              {filterDistrictsList.map((d) => (
                <option key={d} value={d}>{d.split(" / ")[0]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Tabs Section ── */}
        <div className="flex bg-gray-100 rounded-t p-1 border border-gray-200 shadow-sm mr-4 mt-2 w-max">
          <button onClick={() => setActiveTab('admin')} className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded transition-all ${activeTab === 'admin' ? 'bg-white shadow text-[#3AB000]' : 'text-gray-500 hover:text-gray-700'}`}>Official Uploads</button>
          <button onClick={() => setActiveTab('employee')} className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded transition-all ${activeTab === 'employee' ? 'bg-white shadow text-[#3AB000]' : 'text-gray-500 hover:text-gray-700'}`}>Employee Uploads</button>
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden mr-4 flex flex-col">
          {selectedGroupKey && (
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
              <button
                onClick={() => setSelectedGroupKey(null)}
                className="flex items-center gap-2 text-[#3AB000] font-black uppercase tracking-widest text-[10px] hover:text-[#2d8a00] transition-colors"
              >
                <ArrowLeft size={14} /> Back to Location Groups
              </button>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Viewing {groupedLettersMap[selectedGroupKey]?.documents.length} Document(s)
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#3AB000] border-b border-[#3AB000]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em]">{selectedGroupKey ? "Title" : "Location Documents"}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em]">Location Assignment</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em]">{selectedGroupKey ? "Uploaded On" : "Latest Upload"}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-gray-50">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100" />
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-32" />
                            <div className="h-3 bg-gray-50 rounded w-20" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5"><div className="h-6 bg-gray-100 rounded w-28" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                      <td className="px-6 py-5"><div className="h-10 bg-gray-100 rounded w-28 ml-auto" /></td>
                    </tr>
                  ))
                ) : letters.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-24 text-center">
                      <FileSearch size={64} className="text-gray-100 mx-auto mb-4" />
                      <p className="text-sm font-black text-gray-300 uppercase tracking-[0.3em]">
                        {filterState ? `No documents found in selected location` : "No documents uploaded yet"}
                      </p>
                    </td>
                  </tr>
                ) : !selectedGroupKey ? (
                  currentDisplayLetters.map((group) => (
                    <tr key={group.key} className="hover:bg-[#f9fff5] transition-colors border-b border-gray-100 group">
                      {/* Group Title */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 flex items-center justify-center shrink-0 bg-[#3AB000]/10 text-[#3AB000]">
                            <FileSearch size={16} />
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-gray-900 uppercase leading-none mb-1 group-hover:text-[#3AB000] transition-colors">
                              {group.documents.length} Document{group.documents.length !== 1 ? 's' : ''}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Multiple Formats
                              </p>
                              {group.documents.some(d => d.isEmployeeUpload) && (
                                <span className="bg-blue-100 text-blue-700 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">Emp Upload</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location Badge */}
                      <td className="px-6 py-5">
                        <LocationBadge
                          state={group.state}
                          district={group.district}
                          blockName={group.blockName}
                          panchayatName={group.panchayatName}
                        />
                      </td>

                      {/* Date */}
                      <td className="px-6 py-5">
                        <p className="text-[11px] font-black text-gray-900 uppercase">
                          {new Date(group.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedGroupKey(group.key)}
                            className="h-10 px-4 flex items-center justify-center gap-2 bg-gray-50 text-[#3AB000] font-black text-[10px] uppercase tracking-widest hover:bg-[#3AB000] hover:text-white border border-gray-200 hover:border-[#3AB000] transition-all"
                            title="View Documents"
                          >
                            <Eye size={14} /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  currentDisplayLetters.map((letter) => (
                    <tr key={letter._id} className="hover:bg-[#f9fff5] transition-colors border-b border-gray-100 group">
                      {/* Title */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 flex items-center justify-center shrink-0 ${letter.fileType === "pdf" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                            }`}>
                            <FileText size={16} />
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-gray-900 uppercase leading-none mb-1 group-hover:text-[#3AB000] transition-colors">
                              {letter.title}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {letter.fileType === "pdf" ? "PDF Document" : "Image"}
                              </p>
                              {letter.isEmployeeUpload && (
                                <span className="bg-blue-100 text-blue-700 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">Emp Upload</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location Badge */}
                      <td className="px-6 py-5">
                        <LocationBadge
                          state={letter.state}
                          district={letter.district}
                          blockName={letter.blockName}
                          panchayatName={letter.panchayatName}
                        />
                      </td>

                      {/* Date */}
                      <td className="px-6 py-5">
                        <p className="text-[11px] font-black text-gray-900 uppercase">
                          {new Date(letter.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewLetter(letter)}
                            className="h-10 w-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-[#3AB000] border border-gray-200 hover:border-[#3AB000]/30 transition-all"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDownload(letter)}
                            disabled={downloading === letter._id}
                            className="h-10 w-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-blue-500 border border-gray-200 hover:border-blue-300 transition-all disabled:opacity-50"
                            title="Download"
                          >
                            {downloading === letter._id
                              ? <Loader2 size={14} className="animate-spin" />
                              : <Download size={16} />}
                          </button>
                          <button
                            onClick={() => handleDelete(letter._id)}
                            disabled={deletingId === letter._id}
                            className="h-10 w-10 flex items-center justify-center bg-white text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-all disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === letter._id
                              ? <Loader2 size={16} className="animate-spin" />
                              : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {!loading && letters.length > 0 && (
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center gap-2">
              <Users size={12} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {selectedGroupKey ? `${currentDisplayLetters.length} document(s)` : `${groupedLetters.length} location group(s)`}
              </span>
            </div>
          )}
        </div>

      </div>

      {/* ─── Upload Modal ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-[#3AB000]/20 shadow-2xl custom-scrollbar flex flex-col">

            {/* Header */}
            <div className="bg-[#3AB000] text-white p-6 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest leading-none">Upload {uploadLevel} Level Documents</h2>
                <p className="text-[10px] font-bold text-green-100 uppercase tracking-[0.2em] mt-2">
                  Attach to a specific {uploadLevel} location
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/20 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1 bg-gray-50">

              {/* Location Setup */}
              <div className="bg-white p-5 border border-gray-200 space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2 pb-3 border-b border-gray-100">
                  <MapPin size={15} className="text-[#3AB000]" /> 1. Select Target Location
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* State */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">State *</label>
                    <select
                      value={selectedState}
                      onChange={(e) => {
                        setSelectedState(e.target.value);
                        setSelectedDistrict("");
                        setSelectedBlock("");
                        setSelectedPanchayat("");
                        setShowErrors(false);
                      }}
                      className={`w-full px-4 py-3 border-2 text-xs font-bold text-gray-700 outline-none transition-all ${showErrors && !selectedState ? "border-red-400" : "border-gray-200 focus:border-[#3AB000]"
                        }`}
                    >
                      <option value="">— Select State —</option>
                      {statesData.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* District */}
                  {["District", "Block", "Panchayat"].includes(uploadLevel) && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">District *</label>
                        {selectedState && (
                          <button
                            type="button"
                            onClick={() => setShowAddDistrict(!showAddDistrict)}
                            className="text-[9px] font-black text-[#3AB000] hover:underline uppercase tracking-widest flex items-center gap-1"
                          >
                            {showAddDistrict ? "Cancel" : "+ Add Missing"}
                          </button>
                        )}
                      </div>

                      {showAddDistrict ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newDistrictName}
                            onChange={e => setNewDistrictName(e.target.value)}
                            placeholder="Enter district name"
                            className="flex-1 px-4 py-3 border-2 text-xs font-bold text-gray-700 outline-none border-gray-200 focus:border-[#3AB000]"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleAddDistrict}
                            disabled={isAddingDistrict || !newDistrictName.trim()}
                            className="px-6 bg-[#3AB000] hover:bg-[#2d8a00] text-white font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {isAddingDistrict ? <Loader2 size={14} className="animate-spin" /> : "Add"}
                          </button>
                        </div>
                      ) : (
                        <select
                          value={selectedDistrict}
                          onChange={(e) => {
                            setSelectedDistrict(e.target.value);
                            setSelectedBlock("");
                            setSelectedPanchayat("");
                            setShowErrors(false);
                          }}
                          disabled={!selectedState}
                          className={`w-full px-4 py-3 border-2 text-xs font-bold text-gray-700 outline-none transition-all disabled:opacity-50 ${showErrors && !selectedDistrict ? "border-red-400" : "border-gray-200 focus:border-[#3AB000]"
                            }`}
                        >
                          <option value="">— Select District —</option>
                          {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Block */}
                  {["Block", "Panchayat"].includes(uploadLevel) && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Block *</label>
                        {selectedDistrict && (
                          <button
                            type="button"
                            onClick={() => setShowAddBlock(!showAddBlock)}
                            className="text-[9px] font-black text-[#3AB000] hover:underline uppercase tracking-widest flex items-center gap-1"
                          >
                            {showAddBlock ? "Cancel" : "+ Add Missing"}
                          </button>
                        )}
                      </div>

                      {showAddBlock ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newBlockName}
                            onChange={e => setNewBlockName(e.target.value)}
                            placeholder="Enter block name"
                            className="flex-1 px-4 py-3 border-2 text-xs font-bold text-gray-700 outline-none border-gray-200 focus:border-[#3AB000]"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleAddBlock}
                            disabled={isAddingBlock || !newBlockName.trim()}
                            className="px-6 bg-[#3AB000] hover:bg-[#2d8a00] text-white font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {isAddingBlock ? <Loader2 size={14} className="animate-spin" /> : "Add"}
                          </button>
                        </div>
                      ) : (
                        <select
                          value={selectedBlock}
                          onChange={(e) => {
                            setSelectedBlock(e.target.value);
                            setSelectedPanchayat("");
                            setShowErrors(false);
                          }}
                          disabled={!selectedDistrict}
                          className={`w-full px-4 py-3 border-2 text-xs font-bold text-gray-700 outline-none transition-all disabled:opacity-50 ${showErrors && !selectedBlock ? "border-red-400" : "border-gray-200 focus:border-[#3AB000]"
                            }`}
                        >
                          <option value="">— Select Block —</option>
                          {blocksList.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Panchayat */}
                  {uploadLevel === "Panchayat" && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Panchayat *</label>
                        {selectedBlock && (
                          <button
                            type="button"
                            onClick={() => setShowAddPanchayat(!showAddPanchayat)}
                            className="text-[9px] font-black text-[#3AB000] hover:underline uppercase tracking-widest flex items-center gap-1"
                          >
                            {showAddPanchayat ? "Cancel" : "+ Add Missing"}
                          </button>
                        )}
                      </div>

                      {showAddPanchayat ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newPanchayatName}
                            onChange={e => setNewPanchayatName(e.target.value)}
                            placeholder="Enter panchayat name"
                            className="flex-1 px-4 py-3 border-2 text-xs font-bold text-gray-700 outline-none border-gray-200 focus:border-[#3AB000]"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleAddPanchayat}
                            disabled={isAddingPanchayat || !newPanchayatName.trim()}
                            className="px-6 bg-[#3AB000] hover:bg-[#2d8a00] text-white font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {isAddingPanchayat ? <Loader2 size={14} className="animate-spin" /> : "Add"}
                          </button>
                        </div>
                      ) : (
                        <select
                          value={selectedPanchayat}
                          onChange={(e) => {
                            setSelectedPanchayat(e.target.value);
                            setShowErrors(false);
                          }}
                          disabled={!selectedBlock}
                          className={`w-full px-4 py-3 border-2 text-xs font-bold text-gray-700 outline-none transition-all disabled:opacity-50 ${showErrors && !selectedPanchayat ? "border-red-400" : "border-gray-200 focus:border-[#3AB000]"
                            }`}
                        >
                          <option value="">— Select Panchayat —</option>
                          {panchayatsList.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Documents Setup */}
              <div className="bg-white p-5 border border-gray-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <FileText size={15} className="text-[#3AB000]" /> 2. Add Documents
                  </h3>
                  <label className="cursor-pointer bg-[#3AB000] hover:bg-[#2d8a00] text-white text-[10px] px-4 py-2 font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                    <Plus size={14} /> Add Files
                    <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>

                {showErrors && filesData.length === 0 && (
                  <div className="p-3 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-200 flex items-center gap-2">
                    <AlertCircle size={14} /> Please upload at least one document
                  </div>
                )}

                {filesData.length > 0 ? (
                  <div className="space-y-3">
                    {filesData.map((item, index) => (
                      <div key={item.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border border-gray-200 bg-gray-50/50">
                        <div className="w-10 h-10 bg-[#3AB000]/10 flex items-center justify-center shrink-0">
                          <FileText size={20} className="text-[#3AB000]" />
                        </div>
                        <div className="flex-1 w-full space-y-1">
                          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Document Title *</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateFileTitle(item.id, e.target.value)}
                            placeholder="Enter a descriptive title"
                            className={`w-full px-3 py-2 text-xs font-bold text-gray-800 border-2 outline-none focus:border-[#3AB000] ${showErrors && !item.title.trim() ? "border-red-400" : "border-gray-200"}`}
                          />
                        </div>
                        <div className="shrink-0 flex flex-col gap-1 items-end pt-5 md:pt-0">
                          <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 border border-gray-200">
                            {(item.file.size / 1024).toFixed(0)} KB
                          </span>
                          <button onClick={() => removeFile(item.id)} className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 hover:text-red-700">
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 bg-gray-50">
                    <Upload size={32} className="text-gray-300 mb-3" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No documents added</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-1">PDF, JPG, PNG, WEBP accepted (max 50MB)</p>
                  </div>
                )}
              </div>

            </div>

            {/* Actions */}
            <div className="p-6 bg-white border-t border-gray-100 flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-12 bg-white border-2 border-gray-200 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 hover:text-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={uploading}
                onClick={handleUpload}
                className="flex-[2] h-12 bg-[#3AB000] text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#2d8a00] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-green-100"
              >
                {uploading
                  ? <><Loader2 size={16} className="animate-spin" /> Uploading {filesData.length} files...</>
                  : <><Upload size={16} /> Upload {filesData.length > 0 ? filesData.length : ""} Documents</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── View Document Modal ─── */}
      {viewLetter && (
        <div
          className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setViewLetter(null)}
        >
          <div
            className="bg-white w-full max-w-3xl flex flex-col shadow-2xl border-t-4 border-[#3AB000]"
            style={{ maxHeight: "90vh" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 flex items-center justify-center shrink-0 border-2 ${viewLetter.fileType === "pdf"
                    ? "border-red-200 text-red-500 bg-red-50"
                    : "border-blue-200 text-blue-500 bg-blue-50"
                  }`}>
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate uppercase">{viewLetter.title}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {viewLetter.fileType === "pdf" ? "PDF Document" : "Image"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button
                  onClick={() => handleDownload(viewLetter)}
                  disabled={downloading === viewLetter._id}
                  className="flex items-center gap-1.5 px-4 h-10 text-[10px] font-black text-white uppercase tracking-widest bg-[#3AB000] hover:bg-[#2d8a00] transition-all disabled:opacity-60"
                >
                  {downloading === viewLetter._id
                    ? <><Loader2 size={13} className="animate-spin" /> Downloading...</>
                    : <><Download size={13} /> Download</>}
                </button>
                <button
                  onClick={() => setViewLetter(null)}
                  className="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-gray-700 border-2 border-gray-200 hover:border-gray-400 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Document Viewer */}
            <div className="flex-1 overflow-auto bg-gray-50" style={{ minHeight: "460px" }}>
              {viewLetter.fileType === "pdf" ? (
                <iframe
                  src={cleanImageUrl(viewLetter.fileUrl)}
                  title={viewLetter.title}
                  className="w-full h-full"
                  style={{ minHeight: "500px", border: "none" }}
                />
              ) : (
                <div className="flex items-center justify-center p-6 h-full">
                  <img
                    src={cleanImageUrl(viewLetter.fileUrl)}
                    alt={viewLetter.title}
                    className="max-w-full max-h-[60vh] object-contain shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hover\\:bg-\\[\\#f9fff5\\]:hover { background-color: #f9fff5; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </DashboardLayout>
  );
};

export default AdminLetterManagement;
