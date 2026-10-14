import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { cardAPI } from "../../utils/api";
import statesData from "../../data/states.json";
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
  AlertTriangle,
  Download
} from "lucide-react";
import { toast } from "react-hot-toast";

const GREEN = "#3AB000";

const AdminCardManagement = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedCard, setSelectedCard] = useState(null);

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
  const [exportProgress, setExportProgress] = useState(0);

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
    if (field === "roleFilter") { setRoleFilter(value); setStateFilter("all"); setDistrictFilter("all"); setBlockFilter("all"); setPanchayatFilter("all"); }
    else if (field === "stateFilter") { setStateFilter(value); setDistrictFilter("all"); setBlockFilter("all"); setPanchayatFilter("all"); }
    else if (field === "districtFilter") { setDistrictFilter(value); setBlockFilter("all"); setPanchayatFilter("all"); }
    else if (field === "blockFilter") { setBlockFilter(value); setPanchayatFilter("all"); }
    else if (field === "panchayatFilter") { setPanchayatFilter(value); }
    else if (field === "dateFilter") { setDateFilter(value); }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 12;
      if (prog >= 85) {
        prog = 85;
        clearInterval(interval);
      }
      setExportProgress(Math.round(prog));
    }, 300);

    try {
      const params = {
        search,
        role: roleFilter !== "all" ? roleFilter : "",
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

      clearInterval(interval);
      setExportProgress(100);

      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Cards_List_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      clearInterval(interval);
      console.error("Export failed:", error);
      toast.error("Failed to export. Please check if you have permission or data is too large.");
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 600);
    }
  };

  const fetchCards = async (page = 1) => {
    try {
      setLoading(true);
      const params = { search, role: roleFilter, dateRange: dateFilter, page, limit: 10 };
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
        setCards(res.data.cards);
        setPagination(res.data.pagination);
      } else {
        toast.error(res.error || "Failed to load cards");
      }
    } catch (error) {
      console.error("Error fetching cards:", error);
      toast.error("An error occurred while fetching cards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCards(1);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search, roleFilter, stateFilter, districtFilter, blockFilter, panchayatFilter, dateFilter, customStartDate, customEndDate]);

  // Sliding window pagination algorithm (renders 5 page numbers around the current page)
  const renderPageNumbers = () => {
    const totalPages = pagination.pages;
    const currentPage = pagination.page;
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => fetchCards(1)}
          className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-none text-[10px] font-black hover:border-[#3AB000] cursor-pointer transition-all"
        >
          1
        </button>
      );
      if (start > 2) {
        pages.push(
          <span key="dots-start" className="text-gray-400 text-[10px] px-0.5 self-center">
            ...
          </span>
        );
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => fetchCards(i)}
          className={`w-7 h-7 flex items-center justify-center rounded-none text-[10px] font-black transition-all cursor-pointer border ${currentPage === i
            ? "bg-[#3AB000] border-[#3AB000] text-white shadow-md shadow-[#3AB000]/10"
            : "bg-white border-gray-200 text-gray-700 hover:border-[#3AB000]"
            }`}
        >
          {i}
        </button>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push(
          <span key="dots-end" className="text-gray-400 text-[10px] px-0.5 self-center">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => fetchCards(totalPages)}
          className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-none text-[10px] font-black hover:border-[#3AB000] cursor-pointer transition-all"
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <React.Fragment>
      <DashboardLayout>
        {isExporting && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-[3px]">
            <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5 min-w-[300px] max-w-[380px]">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <Download className="w-7 h-7 text-[#3AB000]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-800">Preparing Excel File...</p>
                <p className="text-xs text-gray-400 mt-1">Please wait while we generate your export</p>
              </div>
              <div className="w-full">
                <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                  <span>{exportProgress < 100 ? "Processing..." : "Done!"}</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#3AB000] to-[#7ED321] rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-0 ml-0 md:ml-6 px-2 md:px-0 mt-4 space-y-4 h-full max-w-[99rem]">

          {/* TOP STATS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mr-4">
            <div className="flex items-center justify-between bg-white border border-gray-300 px-6 py-5 rounded-none shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Cards Issued</span>
                <span className="text-2xl font-black text-gray-900 leading-none">{pagination.total}</span>
              </div>
              <div className="p-3 bg-gray-50 text-[#3AB000] rounded-none">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center justify-between bg-white border border-gray-300 px-6 py-5 rounded-none shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Members</span>
                <span className="text-2xl font-black text-[#3AB000] leading-none">
                  {cards.filter(c => c.status === "Active").length || pagination.total}
                </span>
              </div>
              <div className="p-3 bg-green-50 text-[#3AB000] rounded-none">
                <User className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center justify-between bg-white border border-gray-300 px-6 py-5 rounded-none shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">GPS Tagged Cards</span>
                <span className="text-2xl font-black text-amber-600 leading-none">
                  {cards.filter(c => c.location?.lat && c.location?.lng).length}
                </span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-500 rounded-none">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* FILTER BAR SECTION */}
          <div className="bg-white p-4 border border-gray-300 rounded-none shadow-sm space-y-4 mr-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase">
                <CreditCard className="w-6 h-6 text-[#3AB000]" />
                Member Card Issuance Registry
              </h1>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className="bg-black hover:bg-gray-800 text-white text-xs px-5 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide cursor-pointer"
                >
                  <Download size={14} />
                  Export Excel
                </button>
                <button
                  onClick={() => fetchCards(1)}
                  className="bg-white border border-gray-300 hover:border-[#3AB000] hover:text-[#3AB000] text-gray-600 text-xs px-4 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 border-t border-gray-100 pt-4">
              <div className="flex items-center border border-gray-200 rounded-none overflow-hidden h-10 bg-white focus-within:border-[#3AB000] xl:col-span-2">
                <input
                  type="text"
                  placeholder="Search by name, Card ID, or Mobile..."
                  className="flex-1 px-3 text-xs font-bold outline-none text-gray-800"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="bg-[#3AB000] h-full flex items-center px-3 text-white">
                  <Search size={14} />
                </div>
              </div>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => handleFilterChange("dateFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="custom_date">Custom Date Range</option>
              </select>

              {dateFilter === "custom_date" && (
                <div className="flex items-center gap-2 xl:col-span-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-10 px-3 flex-1 bg-white border border-gray-200 rounded-none text-[10px] font-black uppercase tracking-wider outline-none text-gray-700 focus:border-[#3AB000]"
                  />
                  <span className="text-gray-400 font-black text-[10px] uppercase">TO</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="h-10 px-3 flex-1 bg-white border border-gray-200 rounded-none text-[10px] font-black uppercase tracking-wider outline-none text-gray-700 focus:border-[#3AB000]"
                  />
                </div>
              )}

              {/* Role */}
              <select
                value={roleFilter}
                onChange={(e) => handleFilterChange("roleFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
              >
                <option value="all">All Issuers</option>
                <option value="RM">Regional Manager (RM)</option>
                <option value="ZC">Zonal Coordinator (ZC)</option>
                <option value="EMPLOYEE">Manual Employee</option>
                <option value="DM">District Manager (DM)</option>
                <option value="BS">Block Supervisor (BS)</option>
                <option value="PE">Panchayat Executive (PE)</option>
              </select>

              {/* State */}
              <select
                value={stateFilter}
                onChange={(e) => handleFilterChange("stateFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
              >
                <option value="all">All States</option>
                {statesData.map((st, i) => (
                  <option key={i} value={st}>{st}</option>
                ))}
              </select>

              {/* District */}
              <select
                value={districtFilter}
                disabled={stateFilter === "all"}
                onChange={(e) => handleFilterChange("districtFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="all">All Districts</option>
                {stateFilter !== "all" && Object.entries(filterCounts.districts || {}).map(([dist, count]) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>

              {/* Block */}
              <select
                value={blockFilter}
                disabled={districtFilter === "all"}
                onChange={(e) => handleFilterChange("blockFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="all">All Blocks</option>
                {districtFilter !== "all" && Object.entries(filterCounts.blocks || {}).map(([blk, count]) => (
                  <option key={blk} value={blk}>{blk}</option>
                ))}
              </select>

              {/* Panchayat */}
              <select
                value={panchayatFilter}
                disabled={blockFilter === "all"}
                onChange={(e) => handleFilterChange("panchayatFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="all">All Panchayats</option>
                {blockFilter !== "all" && Object.entries(filterCounts.panchayats || {}).map(([panch, count]) => (
                  <option key={panch} value={panch}>{panch}</option>
                ))}
              </select>
            </div>
          </div>

          {/* CARDS RECORDS TABLE */}
          <div className="bg-white rounded-none overflow-hidden border border-gray-300 shadow-sm mr-4 mb-10">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-[#3AB000]">
                    <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Member Details</th>
                    <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-center">Card ID</th>
                    <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Contact & Zone</th>
                    <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Issued By</th>
                    <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Issue Location</th>
                    <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-center">Status</th>
                    <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="7" className="px-6 py-8"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                      </tr>
                    ))
                  ) : cards.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-20 text-center">
                        <AlertTriangle size={48} className="text-gray-200 mx-auto mb-4" />
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No Card Records Found</p>
                      </td>
                    </tr>
                  ) : (
                    cards.map((card) => (
                      <tr key={card._id} className="hover:bg-[#e8f5e2] transition-colors border-b border-gray-100">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-none bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                              {card.photo ? (
                                <img src={card.photo} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User size={18} className="text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-[13px] font-black text-gray-900 leading-none uppercase">{card.cardholderName}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{card.gender} • Age {card.age}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-[10px] font-black text-[#3AB000] bg-green-50 px-3 py-1.5 rounded-none border border-[#3AB000]/20 tracking-wide uppercase">
                            {card.cardId}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[12px] font-bold text-gray-700 flex items-center gap-1.5">
                              📞 {card.mobileNumber}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              📍 {card.villageCity}, {card.district}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[12px] font-bold text-gray-800">
                              {card.issuedBy?.name || "Admin"}
                            </span>
                            <span className="text-[9px] font-black text-[#3AB000] uppercase tracking-wider leading-none">
                              {card.issuedBy?.designation || "Administrator"} ({card.issuedBy?.role || "admin"})
                            </span>
                            {(card.issuedBy?.phone || card.issuedBy?.email) && (
                              <span className="text-[9px] text-gray-500 font-bold flex flex-wrap gap-x-2 gap-y-0.5 mt-1 max-w-[220px]">
                                {card.issuedBy?.phone && (
                                  <span className="inline-flex items-center gap-0.5">
                                    📞 {card.issuedBy.phone}
                                  </span>
                                )}
                                {card.issuedBy?.email && (
                                  <span className="inline-flex items-center gap-0.5 break-all">
                                    📧 {card.issuedBy.email}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {card.location?.lat && card.location?.lng ? (
                            <span className="text-[10px] font-black text-[#3AB000] uppercase tracking-wider flex items-center gap-1">
                              <MapPin size={12} />
                              {card.location.lat.toFixed(6)}, {card.location.lng.toFixed(6)}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">
                              No GPS Data
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-none border ${card.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                            }`}>
                            {card.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <button
                            onClick={() => setSelectedCard(card)}
                            className="bg-black hover:bg-gray-800 text-white p-2 rounded-none transition-all inline-flex items-center justify-center shadow-md cursor-pointer"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {pagination.pages > 1 && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Showing Page {pagination.page} of {pagination.pages} ({pagination.total} Total)
                </p>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => fetchCards(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-none text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    Prev
                  </button>
                  {renderPageNumbers()}
                  <button
                    onClick={() => fetchCards(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 bg-[#3AB000] text-white rounded-none text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#3AB000]/20 hover:bg-black disabled:opacity-50 transition-all cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>

      {/* Card Details Modal */}
      {selectedCard && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 99999
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              width: '100%',
              maxWidth: '768px',
              borderRadius: '0px',
              borderTop: '10px solid #3AB000',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div className="p-6 lg:p-8 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                    <CreditCard className="text-[#3AB000] w-5 h-5" />
                    Member Profile Card
                  </h2>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mt-0.5">Enrollment Records & Audit log</p>
                </div>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-none"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Profile Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '32px', width: '100%', alignItems: 'start' }}>
                {/* Photo Column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '180px' }}>
                  <div className="w-40 h-40 bg-gray-50 border-4 border-[#3AB000] p-1 rounded-none overflow-hidden mb-3">
                    {selectedCard.photo ? (
                      <img src={selectedCard.photo} alt="Member" className="w-full h-full object-cover rounded-none" />
                    ) : (
                      <User size={48} className="text-gray-300 w-full h-full p-6" />
                    )}
                  </div>
                  <span className="text-xs font-black text-[#3AB000] bg-green-50 px-3.5 py-1.5 border border-[#3AB000]/20 tracking-widest uppercase font-mono shadow-sm">
                    {selectedCard.cardId}
                  </span>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-2">
                    REG: {new Date(selectedCard.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Fields Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                  {/* Basic Info */}
                  <div style={{ backgroundColor: '#FCFCFC', border: '1px solid #EAEAEA', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 border-b border-gray-200/60 pb-2">
                      <User size={13} className="text-[#3AB000]" /> Personal Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', width: '100%' }}>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Full Name</p>
                        <p className="text-[13px] font-black text-gray-900 uppercase tracking-tight mt-0.5">{selectedCard.cardholderName}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Gender & Age</p>
                        <p className="text-[13px] font-black text-gray-900 uppercase mt-0.5">{selectedCard.gender} • {selectedCard.age} Yrs</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Aadhaar Number</p>
                        <p className="text-[12px] font-black text-gray-800 font-mono bg-gray-100 px-2 py-0.5 inline-block rounded-none mt-0.5">{selectedCard.aadhaarNumber}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">PAN Number</p>
                        <p className="text-[12px] font-black text-gray-800 font-mono bg-gray-100 px-2 py-0.5 inline-block rounded-none mt-0.5">{selectedCard.panNumber || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Login Password (DOB)</p>
                        <p className="text-[12px] font-black text-gray-800 font-mono bg-gray-100 px-2 py-0.5 inline-block rounded-none mt-0.5">
                          {selectedCard.dob ? `${String(new Date(selectedCard.dob).getDate()).padStart(2, '0')}${String(new Date(selectedCard.dob).getMonth() + 1).padStart(2, '0')}${new Date(selectedCard.dob).getFullYear()}` : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact & Address */}
                  <div style={{ backgroundColor: '#F8FDF7', border: '1px solid #E2F2DE', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest flex items-center gap-2 border-b border-[#3AB000]/15 pb-2">
                      <MapPin size={13} /> Contact & Residential Address
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', width: '100%' }}>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</p>
                        <p className="text-[13px] font-black text-gray-900 font-mono mt-0.5">📞 {selectedCard.mobileNumber}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                        <p className="text-[12px] font-black text-gray-900 break-all mt-0.5">{selectedCard.email || "N/A"}</p>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Full Address</p>
                        <p className="text-[12px] font-bold text-gray-700 leading-normal mt-0.5">
                          {selectedCard.addressLine}, {selectedCard.villageCity}, {selectedCard.block}, {selectedCard.district}, {selectedCard.state} - {selectedCard.pincode}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Family & Health */}
                  <div style={{ backgroundColor: '#FCFCFC', border: '1px solid #EAEAEA', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 border-b border-gray-200/60 pb-2">
                      <Heart size={13} className="text-[#3AB000]" /> Family & Medical Info
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', width: '100%' }}>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Parent / Husband Name</p>
                        <p className="text-[13px] font-black text-gray-900 mt-0.5">{selectedCard.fatherOrHusbandName}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Marital Status</p>
                        <p className="text-[13px] font-black text-gray-900 mt-0.5">{selectedCard.maritalStatus}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Occupation</p>
                        <p className="text-[13px] font-black text-gray-900 mt-0.5">{selectedCard.occupation}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Blood Group</p>
                        <p className="text-[13px] font-black text-[#3AB000] mt-0.5">{selectedCard.bloodGroup}</p>
                      </div>
                    </div>
                  </div>

                  {/* Nominee & Financial */}
                  <div style={{ backgroundColor: '#F5FCFF', border: '1px solid #D6EEF8', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 className="text-[10px] font-black text-sky-800 uppercase tracking-widest flex items-center gap-2 border-b border-sky-100 pb-2">
                      <Building2 size={13} className="text-[#3AB000]" /> Nominee & Financial details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', width: '100%' }}>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Nominee Details</p>
                        <p className="text-[13px] font-black text-gray-900 mt-0.5">{selectedCard.nomineeName} ({selectedCard.nomineeRelation})</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Bank Details</p>
                        <p className="text-[12px] font-black text-gray-800 bg-sky-50 border border-sky-100 px-2 py-1 rounded-none inline-block font-mono mt-0.5">
                          {selectedCard.bankName !== "Not Available" ? `${selectedCard.bankName} - A/C: ${selectedCard.accountNumber}` : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* System Audit */}
                  <div style={{ backgroundColor: '#FCFAF7', border: '1px solid #F3EDE0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 className="text-[10px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-2 border-b border-amber-100 pb-2">
                      <ShieldCheck size={13} className="text-[#3AB000]" /> Digital Issuance Audit Log
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', width: '100%' }}>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Issuer User</p>
                        <p className="text-[12px] font-black text-gray-900 mt-0.5">{selectedCard.issuedBy?.name || "Admin"}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Issuer Role</p>
                        <p className="text-[11px] font-bold text-gray-700 mt-0.5">{selectedCard.issuedBy?.designation || "Administrator"} ({selectedCard.issuedBy?.role || "admin"})</p>
                      </div>
                      {selectedCard.issuedBy?.phone && (
                        <div>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Issuer Contact</p>
                          <p className="text-[12px] font-bold text-gray-700 font-mono mt-0.5">📞 {selectedCard.issuedBy.phone}</p>
                        </div>
                      )}
                      {selectedCard.issuedBy?.email && (
                        <div>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Issuer Email</p>
                          <p className="text-[11px] font-bold text-gray-700 mt-0.5 break-all">📧 {selectedCard.issuedBy.email}</p>
                        </div>
                      )}
                      {selectedCard.location?.lat && selectedCard.location?.lng && (
                        <div style={{ gridColumn: 'span 2', marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed #EAE5D9' }}>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">GPS Audit coordinates</p>
                          <span className="text-[12px] font-black text-[#3AB000] flex items-center gap-1.5 mt-0.5">
                            <MapPin size={12} />
                            {selectedCard.location.lat.toFixed(6)}, {selectedCard.location.lng.toFixed(6)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  onClick={() => setSelectedCard(null)}
                  className="px-8 py-3 bg-black text-white font-black text-xs uppercase tracking-widest hover:bg-[#3AB000] transition-all cursor-pointer shadow-sm"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default AdminCardManagement;
