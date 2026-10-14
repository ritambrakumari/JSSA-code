import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { cardAPI } from "../../utils/api";
import statesData from "../../data/states.json";
import districtsData from "../../data/district.json";
import {
  Search,
  CreditCard,
  User,
  Calendar,
  Phone,
  ChevronRight,
  Loader2,
  Filter,
  X,
  MapPin,
  ShieldCheck,
  Building2,
  Briefcase,
  Heart,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Download,
  AlertTriangle,
  Eye
} from "lucide-react";
import { toast } from "react-hot-toast";

const GREEN = "#3AB000";

const AdminCardHolderList = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedCard, setSelectedCard] = useState(null);
  const [deleteModalCard, setDeleteModalCard] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [cardTypeFilter, setCardTypeFilter] = useState("Old Card");
  const [roleFilter, setRoleFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [blockFilter, setBlockFilter] = useState("all");
  const [panchayatFilter, setPanchayatFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [filterCounts, setFilterCounts] = useState({ states: {}, districts: {}, blocks: {}, panchayats: {} });

  const [isExporting, setIsExporting] = useState(false);

  const loadFilterCounts = async () => {
    try {
      const res = await cardAPI.getFilterCounts({
        role: roleFilter !== "all" ? roleFilter : "",
        state: stateFilter !== "all" ? stateFilter : "",
        district: districtFilter !== "all" ? districtFilter : "",
        block: blockFilter !== "all" ? blockFilter : ""
      });
      if (res.success) {
        setFilterCounts(res.data || { states: {}, districts: {}, blocks: {}, panchayats: {} });
      }
    } catch (err) {
      console.error("Failed to load filter counts:", err);
    }
  };

  useEffect(() => {
    loadFilterCounts();
  }, [roleFilter, stateFilter, districtFilter, blockFilter]);

  const handleFilterChange = (field, value) => {
    if (field === "cardTypeFilter") { setCardTypeFilter(value); }
    else if (field === "roleFilter") { setRoleFilter(value); setStateFilter("all"); setDistrictFilter("all"); setBlockFilter("all"); setPanchayatFilter("all"); }
    else if (field === "stateFilter") { setStateFilter(value); setDistrictFilter("all"); setBlockFilter("all"); setPanchayatFilter("all"); }
    else if (field === "districtFilter") { setDistrictFilter(value); setBlockFilter("all"); setPanchayatFilter("all"); }
    else if (field === "blockFilter") { setBlockFilter(value); setPanchayatFilter("all"); }
    else if (field === "panchayatFilter") { setPanchayatFilter(value); }
    else if (field === "dateFilter") { setDateFilter(value); }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = {
        search,
        role: roleFilter !== "all" ? roleFilter : "",
        cardType: cardTypeFilter !== "all" ? cardTypeFilter : "",
        state: stateFilter !== "all" ? stateFilter : "",
        district: districtFilter !== "all" ? districtFilter : "",
        block: blockFilter !== "all" ? blockFilter : "",
        panchayat: panchayatFilter !== "all" ? panchayatFilter : "",
        dateRange: dateFilter !== "all" ? dateFilter : ""
      };
      
      if (dateFilter === "custom_date") {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      
      const blob = await cardAPI.exportAdminCardsCSV(params);

      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `CardHolders_List_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const fetchCards = async (page = 1) => {
    try {
      setLoading(true);
      const params = { search, role: roleFilter, dateRange: dateFilter, page, limit: 10 };
      if (cardTypeFilter !== "all") params.cardType = cardTypeFilter;
      if (stateFilter !== "all") params.state = stateFilter;
      if (districtFilter !== "all") params.district = districtFilter;
      if (blockFilter !== "all") params.block = blockFilter;
      if (panchayatFilter !== "all") params.panchayat = panchayatFilter;
      if (dateFilter === "custom_date") {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const res = await cardAPI.list(params);
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : (res.data?.cards || []);
        const pag = res.pagination || res.data?.pagination || { page: 1, pages: 1, total: 0 };
        setCards(list);
        setPagination(pag);
      } else {
        toast.error(res.error || "Failed to load cardholders");
      }
    } catch (error) {
      console.error("Error fetching cards:", error);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCards(1);
    }, 150);
    return () => clearTimeout(timer);
  }, [search, roleFilter, cardTypeFilter, stateFilter, districtFilter, blockFilter, panchayatFilter, dateFilter, customStartDate, customEndDate]);

  const handleDeleteCard = async () => {
    if (!deleteModalCard) return;
    try {
      setDeleting(true);
      const res = await cardAPI.adminDelete(deleteModalCard._id);
      if (res.success) {
        toast.success("Cardholder deleted successfully");
        setDeleteModalCard(null);
        fetchCards(pagination.page);
      } else {
        toast.error(res.error || "Failed to delete cardholder");
      }
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error("Failed to delete cardholder");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">

          {/* Top Banner (AdminPolicyManagement Reference Style) */}
          <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30">
                <CreditCard className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">CardHolder Management</h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">
                  Centralized Directory For Legacy Old Cards & Manual Cardholder Entries
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-none text-center md:text-right shrink-0">
              <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Total Cards</p>
              <p className="text-xl font-black text-white uppercase mt-1">{pagination.total || cards?.length || 0} Cards</p>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-gray-50 border border-gray-150 p-4 rounded-none flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <CreditCard size={14} className="text-[#3AB000]" />
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">CardHolder Directory Controls</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/admin/cardholders/add")}
                className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-[10px] px-5 h-9 font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 rounded-none shadow-sm"
              >
                <Plus size={14} /> Add Manual CardHolder
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="bg-black hover:bg-gray-800 text-white text-[10px] px-5 h-9 font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 rounded-none shadow-sm"
              >
                <Download size={14} /> {isExporting ? "Exporting..." : "Export Excel"}
              </button>
              <button
                onClick={() => fetchCards(1)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-[10px] px-4 h-9 font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 rounded-none"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 border border-gray-150 rounded-none mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search Name, Card ID, Mobile..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 text-xs font-medium text-gray-900 outline-none focus:border-[#3AB000]"
                />
              </div>

              {/* Card Type Filter */}
              <div>
                <select
                  value={cardTypeFilter}
                  onChange={(e) => handleFilterChange("cardTypeFilter", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900 outline-none focus:border-[#3AB000]"
                >
                  <option value="Old Card">Old Cards / Manual Entries Only</option>
                  <option value="all">All Cards (Old & New)</option>
                </select>
              </div>

              {/* State Filter */}
              <div>
                <select
                  value={stateFilter}
                  onChange={(e) => handleFilterChange("stateFilter", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-xs font-medium text-gray-900 outline-none focus:border-[#3AB000]"
                >
                  <option value="all">All States</option>
                  {(Array.isArray(statesData) ? statesData : Object.keys(statesData)).map(st => (
                    <option key={st} value={st}>{st} ({filterCounts.states?.[st] || 0})</option>
                  ))}
                </select>
              </div>

              {/* District Filter */}
              <div>
                <select
                  value={districtFilter}
                  onChange={(e) => handleFilterChange("districtFilter", e.target.value)}
                  disabled={stateFilter === "all"}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-xs font-medium text-gray-900 outline-none focus:border-[#3AB000] disabled:bg-gray-100"
                >
                  <option value="all">All Districts</option>
                  {stateFilter !== "all" && districtsData[stateFilter]?.map(dist => (
                    <option key={dist} value={dist}>{dist} ({filterCounts.districts?.[dist] || 0})</option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <select
                  value={dateFilter}
                  onChange={(e) => handleFilterChange("dateFilter", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-xs font-medium text-gray-900 outline-none focus:border-[#3AB000]"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="custom_date">Custom Date Range</option>
                </select>
              </div>
            </div>

            {dateFilter === "custom_date" && (
              <div className="flex gap-4 pt-3 border-t mt-3">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-xs"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-xs"
                />
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-none border border-gray-200 overflow-hidden relative min-h-[400px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-black uppercase text-[10px] tracking-widest border-b border-gray-150">
                    <th className="px-6 py-4">Card ID / Type</th>
                    <th className="px-6 py-4">Cardholder</th>
                    <th className="px-6 py-4">Contact & Location</th>
                    <th className="px-6 py-4">Aadhaar</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center text-gray-400">
                        <Loader2 size={32} className="animate-spin text-[#3AB000] mx-auto mb-2" />
                        <span className="text-xs font-black uppercase tracking-widest">Loading CardHolders...</span>
                      </td>
                    </tr>
                  ) : (!Array.isArray(cards) || cards.length === 0) ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center text-gray-500">
                        <CreditCard size={40} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-xs font-black uppercase tracking-wider text-gray-700">No CardHolders Found</p>
                        <p className="text-[11px] text-gray-400 mt-1">Try adjusting search filters or add a new manual cardholder.</p>
                      </td>
                    </tr>
                  ) : (
                    cards.map((c) => (
                      <tr key={c._id} className="hover:bg-[#f9fff5] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-black text-[#3AB000] text-[13px]">{c.cardId}</div>
                          <span className={`inline-block text-[9px] font-black px-2 py-0.5 mt-1 uppercase tracking-wider ${c.cardType === "Old Card" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                            {c.cardType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {c.photo ? (
                              <img src={c.photo} alt={c.cardholderName} className="w-9 h-9 rounded-none object-cover border border-gray-200" />
                            ) : (
                              <div className="w-9 h-9 rounded-none bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-black text-xs uppercase">
                                {c.cardholderName?.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-black text-gray-900 text-[13px] uppercase">{c.cardholderName}</div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase">{c.gender} • {c.age || "N/A"} Yrs</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 text-[12px]">{c.mobileNumber}</div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase">{c.district}, {c.state?.split(" / ")[0]}</div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-gray-700 text-xs">
                          {c.aadhaarNumber ? `•••• •••• ${c.aadhaarNumber.slice(-4)}` : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-[11px] font-black text-gray-900 uppercase">
                          {new Date(c.cardCreatedDate || c.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedCard(c)}
                              className="h-8 w-8 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-[#3AB000] border border-gray-200 transition-all"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => navigate(`/admin/cardholders/edit/${c._id}`)}
                              className="h-8 w-8 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-blue-500 border border-gray-200 transition-all"
                              title="Edit Cardholder"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteModalCard(c)}
                              className="h-8 w-8 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-red-500 border border-gray-200 transition-all"
                              title="Delete Cardholder"
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

            {/* Pagination Footer */}
            {pagination.pages > 1 && (
              <div className="p-4 border-t border-gray-150 bg-gray-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Showing Page {pagination.page} of {pagination.pages} ({pagination.total} Total Cards)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchCards(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-4 py-1.5 bg-white border border-gray-200 text-[10px] font-black uppercase tracking-wider disabled:opacity-40 hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchCards(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="px-4 py-1.5 bg-white border border-gray-200 text-[10px] font-black uppercase tracking-wider disabled:opacity-40 hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* View Details Modal */}
        {selectedCard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="bg-white w-full max-w-2xl overflow-hidden border-2 border-[#3AB000] shadow-2xl">
              <div className="px-6 py-4 bg-[#0A3D00] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard size={20} className="text-[#3AB000]" />
                  <h3 className="font-black text-sm uppercase tracking-widest">CardHolder Details ({selectedCard.cardId})</h3>
                </div>
                <button onClick={() => setSelectedCard(null)} className="text-white/60 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
                {/* Profile Header */}
                <div className="flex items-center gap-6 pb-6 border-b border-gray-150">
                  <div className="w-24 h-24 bg-gray-100 border-2 border-[#3AB000] overflow-hidden shrink-0">
                    {selectedCard.photo ? (
                      <img src={selectedCard.photo} alt={selectedCard.cardholderName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-black text-2xl uppercase">
                        {selectedCard.cardholderName?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{selectedCard.cardholderName}</h2>
                      <span className={`text-[9px] font-black px-2 py-0.5 uppercase tracking-wider ${selectedCard.cardType === "Old Card" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                        {selectedCard.cardType}
                      </span>
                    </div>
                    <p className="text-gray-500 font-bold text-[11px] uppercase tracking-wide">
                      {selectedCard.gender} • {selectedCard.age || "N/A"} Years Old • DOB: {selectedCard.dob ? new Date(selectedCard.dob).toLocaleDateString("en-GB") : "N/A"}
                    </p>
                    <p className="text-[#3AB000] font-black text-sm tracking-wider mt-1">
                      Aadhaar: {selectedCard.aadhaarNumber ? selectedCard.aadhaarNumber.replace(/(\d{4})/g, '$1 ').trim() : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-1">
                    <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Mobile</span>
                    <p className="font-bold text-gray-900 text-[13px]">{selectedCard.mobileNumber || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Email</span>
                    <p className="font-bold text-gray-900 text-[13px]">{selectedCard.email || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Father / Husband</span>
                    <p className="font-bold text-gray-900 text-[13px]">{selectedCard.fatherOrHusbandName || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Mother</span>
                    <p className="font-bold text-gray-900 text-[13px]">{selectedCard.motherName || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">State & District</span>
                    <p className="font-bold text-gray-900 text-[13px]">
                      {selectedCard.district ? selectedCard.district.split(" / ")[0] : "N/A"}, {selectedCard.state ? selectedCard.state.split(" / ")[0] : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Block & Village</span>
                    <p className="font-bold text-gray-900 text-[13px]">
                      {selectedCard.block ? selectedCard.block.split(" / ")[0] : "N/A"}, {selectedCard.villageCity || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Nominee</span>
                    <p className="font-bold text-gray-900 text-[13px]">
                      {selectedCard.nomineeName || "N/A"} {selectedCard.nomineeRelation ? `(${selectedCard.nomineeRelation})` : ""}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Card Creation Date</span>
                    <p className="font-bold text-[#3AB000] text-[13px]">
                      {selectedCard.cardCreatedDate || selectedCard.createdAt ? new Date(selectedCard.cardCreatedDate || selectedCard.createdAt).toLocaleDateString("en-GB") : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalCard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="bg-white w-full max-w-md p-6 border-2 border-red-500 shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-none flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase">Confirm Delete</h3>
              <p className="text-xs text-gray-600 font-medium">
                Are you sure you want to delete cardholder <strong className="text-gray-900">{deleteModalCard.cardholderName} ({deleteModalCard.cardId})</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteModalCard(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 border border-gray-300 font-black text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCard}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-600 text-white font-black text-xs uppercase hover:bg-red-700"
                >
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCardHolderList;
