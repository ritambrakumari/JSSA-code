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
  Building2,
  Home,
  Filter,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Database
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

// ── Bulk Sync Modal (The Core Feature) ──
function BulkSyncModal({ isOpen, onClose, onSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  if (!isOpen) return null;

  const downloadTemplate = () => {
    const headers = "State,District,Block Name,Panchayat Name\n";
    const sampleRows = "Odisha,Kendrapara,Aali,Atala\nBihar,Patna,Sadar,Sakri\n";
    const blob = new Blob([headers + sampleRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'location_master_template.csv';
    a.click();
  };

  const handleFileChange = async (e) => {
    const file = e?.target?.files ? e.target.files[0] : (e instanceof File ? e : e);
    if (!file || !(file instanceof File)) return;

    setBulkFile(file);
    setIsProcessing(true);
    setUploadProgress(10);

    const reader = new FileReader();
    reader.onload = async (event) => {
      setUploadProgress(40);
      const text = event.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");

      if (lines.length < 2) {
        alert("Empty or invalid CSV file");
        setIsProcessing(false);
        setUploadProgress(0);
        return;
      }

      try {
        const rows = lines.slice(1).map((line) => {
          const parts = line.match(/(".*?"|[^",\r\n]*)(?:,|$)/g)
            .map(p => p.replace(/^"|"|,$/g, '').trim())
            .filter((p, i, self) => i < self.length - 1);

          if (parts.length < 4) return null;

          const stateEn = parts[0];
          const distEn = parts[1];
          const blockName = parts[2];
          const panchayatName = parts[3];

          const stateMatch = indianStates.find(s => s.toLowerCase().startsWith(stateEn?.toLowerCase()));
          const state = stateMatch || stateEn;

          let district = distEn;
          if (stateMatch && indianDistricts[stateMatch]) {
            const dMatch = indianDistricts[stateMatch].find(d => d.toLowerCase().startsWith(distEn?.toLowerCase()));
            if (dMatch) district = dMatch;
          }

          return {
            state,
            district,
            blockName,
            name: panchayatName
          };
        }).filter(r => r !== null);

        setBulkPreview(rows);
        setUploadProgress(100);
      } catch (err) {
        console.error("Parse error:", err);
      } finally {
        setIsProcessing(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (bulkPreview.length === 0) return;
    setIsProcessing(true);
    setSyncProgress({ current: 0, total: bulkPreview.length });

    const CHUNK_SIZE = 500;
    const totalRecords = bulkPreview.length;
    let createdBlocks = 0;
    let createdPanchayats = 0;

    try {
      for (let i = 0; i < totalRecords; i += CHUNK_SIZE) {
        const chunk = bulkPreview.slice(i, i + CHUNK_SIZE);

        // Translate this batch before sending
        const translatedChunk = await Promise.all(chunk.map(async (row) => {
          // Re-using the translation logic during sync phase to keep preview fast
          const [bHi, pHi] = await Promise.all([
            translateToHindi(row.blockName),
            translateToHindi(row.name)
          ]);
          return { ...row, blockNameHi: bHi, nameHi: pHi };
        }));

        const res = await locationAPI.bulkSyncLocations(translatedChunk);

        if (res && !res.error) {
          createdBlocks += res.stats?.blockCount || 0;
          createdPanchayats += res.stats?.panchayatCount || 0;
          setSyncProgress(prev => ({ ...prev, current: Math.min(i + CHUNK_SIZE, totalRecords) }));
        } else {
          throw new Error(res?.error || "Batch sync failed");
        }
      }

      alert(`Sync complete successfully!\nCreated ${createdBlocks} new blocks and ${createdPanchayats} new panchayats.`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Sync error:", err);
      alert("Error during sync: " + err.message);
    } finally {
      setIsProcessing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 bg-black text-white">
          <h2 className="font-bold text-base flex items-center gap-2">
            <Database size={18} className="text-[#3AB000]" /> Bulk Sync Master Data
          </h2>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <Download size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-900">Step 1: Download Template</p>
                <p className="text-[11px] text-blue-700">Get the 4-column CSV format (State, District, Block, Panchayat)</p>
              </div>
            </div>
            <button onClick={downloadTemplate} className="bg-blue-600 text-white px-4 py-1.5 rounded-sm text-xs font-bold hover:bg-blue-700 transition-all">
              Download CSV
            </button>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all ${isDragging ? 'border-[#3AB000] bg-[#3AB000]/5' : 'border-gray-200 bg-gray-50'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files[0]); }}
          >
            <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm font-bold text-gray-600">{bulkFile ? bulkFile.name : "Step 2: Upload Updated CSV"}</p>
            <p className="text-[11px] text-gray-400 mt-1">Drag and drop your file here</p>
          </div>

          {bulkPreview.length > 0 && (
            <div className="rounded-lg border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between text-[10px] font-black uppercase text-gray-500">
                <span>Data Preview</span>
                <span className="text-green-600">{bulkPreview.length} Entries Detected</span>
              </div>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-white sticky top-0 border-b border-gray-50">
                    <tr className="text-gray-400 font-bold uppercase">
                      <th className="px-3 py-2">State</th>
                      <th className="px-3 py-2">District</th>
                      <th className="px-3 py-2">Block</th>
                      <th className="px-3 py-2">Panchayat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bulkPreview.slice(0, 5).map((row, i) => (
                      <tr key={i} className="text-gray-700">
                        <td className="px-3 py-2">{row.state}</td>
                        <td className="px-3 py-2">{row.district}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span className="font-bold">{row.blockName}</span>
                            <span className="text-[9px] text-gray-400">{row.blockNameHi}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span className="text-[#3AB000] font-bold">{row.name}</span>
                            <span className="text-[9px] text-gray-400">{row.nameHi}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bulkPreview.length > 5 && <div className="p-2 text-center text-[10px] text-gray-400 italic bg-white border-t border-gray-50">+ {bulkPreview.length - 5} more rows</div>}
              </div>
            </div>
          )}
          {isProcessing && syncProgress.total > 0 && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-gray-500 uppercase">Synchronizing Records...</span>
                <span className="text-[#3AB000]">{Math.round((syncProgress.current / syncProgress.total) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-[#3AB000] to-green-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(58,176,0,0.3)]"
                  style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-center text-gray-400 font-medium italic">
                Processed {syncProgress.current} of {syncProgress.total} locations
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600">Cancel</button>
          <button
            disabled={isProcessing || bulkPreview.length === 0}
            onClick={handleSubmit}
            className="bg-[#3AB000] text-white px-8 py-2 rounded-sm text-sm font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "Start Sync Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

const LocationManagement = () => {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [filterState, setFilterState] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    states: 0,
    districts: 0,
    blocks: 0,
    panchayats: 0
  });
  const itemsPerPage = 13;

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Parallel fetch for data and matching stats
      const [dataRes, statsRes] = await Promise.all([
        locationAPI.getPanchayats({
          page: currentPage,
          limit: itemsPerPage,
          state: filterState,
          search: searchQuery
        }),
        locationAPI.getLocationStats({ state: filterState })
      ]);

      if (dataRes && dataRes.data) {
        setLocations(dataRes.data);
        setTotalPages(dataRes.pages || 1);
      }

      if (statsRes && statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error("Data load error:", err);
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
      await locationAPI.deletePanchayat(id);
      loadData();
    }
  };

  const handleBulkDeleteState = async () => {
    if (!filterState) {
      alert("Please select a state to delete first.");
      return;
    }

    if (window.confirm(`WARNING: Are you sure you want to delete ALL blocks and panchayats for ${filterState}? This action cannot be undone.`)) {
      setIsLoading(true);
      try {
        const res = await locationAPI.deleteByState(filterState);
        if (res.success) {
          alert(`Success! ${res.data.blocksDeleted} blocks and ${res.data.panchayatsDeleted} panchayats deleted for ${filterState}.`);
          loadData();
        } else {
          alert(res.error || "Failed to delete data");
        }
      } catch (err) {
        console.error("Bulk delete error:", err);
        alert("An error occurred during bulk delete.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const filteredData = locations;

  return (
    <DashboardLayout activePath="/admin/location-management">
      {isLoading && <LoadingOverlay message="Loading Master Data..." />}

      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
              Master Location Management
            </h1>
            <p className="text-xs text-gray-500 font-medium">Manage States, Districts, Blocks and Gram Panchayats in one place</p>
          </div>

          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="bg-black hover:bg-[#3AB000] text-white px-6 py-2.5 rounded shadow-xl flex items-center justify-center gap-2 transition-all font-bold text-sm"
          >
            <Upload size={16} /> Bulk Sync Master Data (CSV)
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 border border-gray-200 rounded-none shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">States</p>
              <p className="text-xl font-black text-gray-800">{stats.states}</p>
            </div>
            <div className="p-2 bg-gray-100 text-gray-400 rounded-full">
              <MapPin size={18} />
            </div>
          </div>

          <div className="bg-white p-4 border border-gray-200 rounded-none shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Districts</p>
              <p className="text-xl font-black text-gray-800">{stats.districts}</p>
            </div>
            <div className="p-2 bg-blue-50 text-blue-400 rounded-full">
              <Building2 size={18} />
            </div>
          </div>

          <div className="bg-white p-4 border border-gray-200 rounded-none shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Blocks</p>
              <p className="text-xl font-black text-gray-800">{stats.blocks}</p>
            </div>
            <div className="p-2 bg-amber-50 text-amber-500 rounded-full">
              <Home size={18} />
            </div>
          </div>

          <div className="bg-white p-4 border border-gray-200 rounded-none shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Panchayats</p>
              <p className="text-xl font-black text-[#3AB000]">{stats.panchayats}</p>
            </div>
            <div className="p-2 bg-green-50 text-[#3AB000] rounded-full">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Internal Filters */}
          <div className="p-4 bg-white border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded w-full md:w-auto">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filterState}
                onChange={(e) => { setFilterState(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-sm outline-none font-medium text-gray-700 min-w-[150px]"
              >
                <option value="">All States</option>
                {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="relative flex-1 w-full flex items-center gap-2">
              <div className="relative flex-1 flex items-center border border-gray-200 rounded overflow-hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search globally by District, Block or Panchayat..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 text-sm outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button 
                  onClick={handleSearch}
                  className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs sm:text-sm px-4 sm:px-6 h-full py-2 font-medium transition-colors whitespace-nowrap"
                >
                  Search
                </button>
              </div>
              {filterState && (
                <button
                  onClick={handleBulkDeleteState}
                  className="flex shrink-0 items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded text-xs font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm"
                  title={`Delete all data for ${filterState}`}
                >
                  <Trash2 size={14} /> Bulk Delete {filterState}
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#3AB000] text-black">
                <tr>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest">S.N</th>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest">State (राज्य)</th>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest">District (जिला)</th>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest">Block (प्रखंड)</th>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest">Panchayat (पंचायत)</th>
                  <th className="px-4 py-4 font-black text-[10px] uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <AlertCircle size={40} strokeWidth={1} />
                        <p className="font-bold underline">No Location Data Found</p>
                        <p className="text-[10px]">Use Bulk Sync to populate the master list</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((loc, idx) => (
                    <tr key={loc._id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-4 text-[11px] font-bold text-gray-400">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[11px] font-bold text-gray-800 uppercase">{loc.state}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[11px] font-bold text-gray-600 uppercase">{loc.district}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800">{loc.block?.name || "N/A"}</span>
                          <span className="text-[10px] text-gray-400 font-bold">{loc.block?.nameHi || ""}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[#3AB000]">{loc.name}</span>
                          <span className="text-[10px] text-gray-400 font-bold">{loc.nameHi || "---"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleDelete(loc._id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
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

          {!isLoading && filteredData.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-4 py-1.5 bg-white border border-gray-200 text-xs font-bold rounded hover:bg-gray-100 disabled:opacity-50 transition-all"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-4 py-1.5 bg-white border border-gray-200 text-xs font-bold rounded hover:bg-gray-100 disabled:opacity-50 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BulkSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSuccess={loadData}
      />
    </DashboardLayout>
  );
};

export default LocationManagement;
