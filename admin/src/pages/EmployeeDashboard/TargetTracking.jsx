import React, { useState, useEffect } from 'react';
import { useAuth } from "../../auth/AuthProvider";
import DashboardLayout from "../../components/DashboardLayout";
import { Users, MapPin, Search, Award, TrendingUp, AlertCircle, Loader2, ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react';

const TargetTracking = () => {
  const { employeeProfile } = useAuth();
  const isRM = employeeProfile?.role === "RM" || employeeProfile?.jobPostingId?.post?.en?.toLowerCase() === "regional manager";
  const isZC = employeeProfile?.role === "ZC" || employeeProfile?.jobPostingId?.post?.en?.toLowerCase() === "zonal coordinator";
  const [data, setData] = useState({ rmDetails: null, team: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showZonesModal, setShowZonesModal] = useState(false);
  
  // Filters
  const [designation, setDesignation] = useState("all");
  const [district, setDistrict] = useState("");
  const [block, setBlock] = useState("");
  const [panchayat, setPanchayat] = useState("");
  const [timeFilter, setTimeFilter] = useState("current_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [cardType, setCardType] = useState("all");

  const [allDistricts, setAllDistricts] = useState([]);
  const [allBlocks, setAllBlocks] = useState([]);
  const [allPanchayats, setAllPanchayats] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTargetData = async () => {
    try {
      setLoading(true);
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;
      if (!token) throw new Error("No token found");

      let query = `?designation=${designation}&timeFilter=${timeFilter}&cardType=${cardType}`;
      if (timeFilter === "custom_date") {
        if (customStartDate) query += `&startDate=${customStartDate}`;
        if (customEndDate) query += `&endDate=${customEndDate}`;
      }
      if (district) query += `&district=${encodeURIComponent(district)}`;
      if (block) query += `&block=${encodeURIComponent(block)}`;
      if (panchayat) query += `&panchayat=${encodeURIComponent(panchayat)}`;
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/goal-config/target-tracking/team${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      
      if (result.success) {
        setData(result.data);
        setCurrentPage(1); // Reset to page 1 on new filter
        
        const cleanName = (name) => {
          if (!name || name === 'N/A') return null;
          return name.split('/')[0].trim().toUpperCase();
        };

        if (!district) {
          let districtsSet = new Set(result.data.team.map(emp => cleanName(emp.district)).filter(Boolean));
          if (isZC && result.data.rmDetails && result.data.rmDetails.zone && result.data.rmDetails.zone !== "N/A" && result.data.rmDetails.zone !== "Not Assigned") {
            result.data.rmDetails.zone.split(',').forEach(d => {
              const cleaned = cleanName(d);
              if (cleaned) districtsSet.add(cleaned);
            });
          }
          setAllDistricts([...districtsSet].sort());
        }
        if (!block) {
          setAllBlocks([...new Set(result.data.team.map(emp => cleanName(emp.block)).filter(Boolean))].sort());
        }
        if (!panchayat) {
          setAllPanchayats([...new Set(result.data.team.map(emp => cleanName(emp.panchayat)).filter(Boolean))].sort());
        }
      } else {
        setError(result.message || "Failed to fetch data");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce filter API calls slightly
    const timer = setTimeout(() => {
      fetchTargetData();
    }, 500);
    return () => clearTimeout(timer);
  }, [designation, district, block, panchayat, timeFilter, customStartDate, customEndDate, cardType]);

  // Pagination logic
  const filteredSearchTeam = data.team ? data.team.filter(emp => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (emp.name && emp.name.toLowerCase().includes(q)) ||
           (emp.phone && String(emp.phone).includes(q)) ||
           (emp.email && emp.email.toLowerCase().includes(q));
  }) : [];

  const totalPages = Math.ceil(filteredSearchTeam.length / itemsPerPage);
  const currentTeamData = filteredSearchTeam.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalCardsIssued = filteredSearchTeam.reduce((sum, emp) => sum + (Number(emp.achieved) || 0), 0);
  const totalTarget = filteredSearchTeam.reduce((sum, emp) => sum + (Number(emp.target) || 0), 0);
  const totalNewCards = filteredSearchTeam.reduce((sum, emp) => sum + (Number(emp.newCards) || 0), 0);
  const totalOldCards = filteredSearchTeam.reduce((sum, emp) => sum + (Number(emp.oldCards) || 0), 0);

  const roleCounts = data.roleCounts || { ZC: 0, DM: 0, BS: 0, PE: 0 };

  const getProgressBarColor = (colorCode) => {
    switch(colorCode) {
      case 'green': return 'bg-[#3AB000]';
      case 'orange': return 'bg-amber-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        
        {/* Header section - Theme Style */}
        <div className="border-b-4 border-[#3AB000] pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
              Target <span className="text-[#3AB000]">Tracking</span>
            </h1>
            <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.3em] mt-1">
              Hierarchical Team Performance Hub
            </p>
          </div>
        </div>

        {/* Section 1: RM Info */}
        {data.rmDetails && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-6 w-1 bg-[#3AB000]"></div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.15em]">Section 1: Manager Profile</h2>
            </div>
            <div className="bg-green-50/30 border border-[#3AB000] px-6 py-4 flex flex-col md:flex-row md:items-center gap-6 rounded-none">
            <div className="flex items-center gap-3 pr-6 md:border-r border-gray-300">
              <Users size={18} className="text-[#3AB000]" />
              <div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">{isZC ? "Zonal Coordinator" : "Regional Manager"}</p>
                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{data.rmDetails.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pr-6 md:border-r border-gray-300">
              <Award size={18} className="text-[#3AB000]" />
              <div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">Designation</p>
                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{data.rmDetails.designation}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-[#3AB000]" />
              <div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">Supervising Zone</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-gray-900 uppercase tracking-tight" title={data.rmDetails.zone}>
                    {data.rmDetails.zone ? (data.rmDetails.zone.split(',').map(z => z.split('/')[0].trim()).join(', ').length > 40 
                      ? data.rmDetails.zone.split(',').map(z => z.split('/')[0].trim()).join(', ').substring(0, 40) + "..." 
                      : data.rmDetails.zone.split(',').map(z => z.split('/')[0].trim()).join(', ')) : ''}
                  </p>
                  {data.rmDetails.zone && data.rmDetails.zone.split(',').map(z => z.split('/')[0].trim()).join(', ').length > 40 && (
                    <button 
                      onClick={() => setShowZonesModal(true)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase"
                    >
                      View All
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-500 px-4 py-3 mb-8 flex items-center gap-3 rounded-none">
            <AlertCircle size={16} className="text-red-500" />
            <p className="text-[11px] font-black text-red-700 uppercase tracking-widest">{error}</p>
          </div>
        )}

        {/* Section 2: Team Data */}
        <div>
          <div className="flex items-center justify-between mb-4 mt-10">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 bg-[#3AB000]"></div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.15em]">Section 2: Team Performance Grid</h2>
            </div>
            <button 
              onClick={fetchTargetData}
              disabled={loading}
              className="bg-black hover:bg-gray-800 text-white px-5 py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Refresh
            </button>
          </div>

          {/* Filters and Stats */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="bg-white border border-gray-300 p-3">
              <div className="flex items-center gap-3 w-full px-2">
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="SEARCH BY NAME, PHONE, EMAIL..."
                  className="w-full bg-transparent border-none outline-none text-xs font-bold text-gray-700 uppercase"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
            <select
              className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#3AB000] outline-none text-xs font-bold transition-all rounded-none cursor-pointer text-gray-700"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="">ALL DISTRICTS</option>
              {allDistricts.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="relative">
            <select
              className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#3AB000] outline-none text-xs font-bold transition-all rounded-none cursor-pointer text-gray-700"
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              disabled={!district}
            >
              <option value="">ALL BLOCKS</option>
              {allBlocks.map(b => <option key={b} value={b}>{b.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="relative">
            <select
              className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#3AB000] outline-none text-xs font-bold transition-all rounded-none cursor-pointer text-gray-700"
              value={panchayat}
              onChange={(e) => setPanchayat(e.target.value)}
              disabled={!block}
            >
              <option value="">ALL PANCHAYATS</option>
              {allPanchayats.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
            </select>
          </div>
          <select 
            className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#3AB000] outline-none text-xs font-bold transition-all rounded-none cursor-pointer text-gray-700"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
          >
            <option value="all">ALL DESIGNATIONS</option>
            <option value="ZC">ZONAL COORDINATOR (ZC)</option>
            <option value="DM">DISTRICT MANAGER (DM)</option>
            <option value="BS">BLOCK SUPERVISOR (BS)</option>
            <option value="PE">PANCHAYAT EXECUTIVE (PE)</option>
          </select>
          <select 
            className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#3AB000] outline-none text-xs font-bold transition-all rounded-none cursor-pointer text-gray-700"
            value={cardType}
            onChange={(e) => setCardType(e.target.value)}
          >
            <option value="all">ALL CARD TYPES</option>
            <option value="New Card">NEW CARDS</option>
            <option value="Old Card">OLD CARDS</option>
          </select>
          <select 
            className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#3AB000] outline-none text-xs font-bold transition-all rounded-none cursor-pointer text-gray-700"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="current_month">CURRENT MONTH</option>
            <option value="past_month">PAST MONTH</option>
            <option value="custom_date">CUSTOM DATE RANGE</option>
            <option value="all_time">ALL TIME (TOTAL)</option>
            </select>
          </div>
          </div>

        {/* Custom Date Pickers */}
        {timeFilter === "custom_date" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 border border-gray-200 rounded-none">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Start Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#3AB000] outline-none text-xs font-bold transition-all rounded-none text-gray-700"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">End Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-[#3AB000] outline-none text-xs font-bold transition-all rounded-none text-gray-700"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Filtered Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 p-5 rounded-none flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 flex items-center justify-center rounded-full shrink-0 border border-blue-100">
              <TrendingUp size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Total Target</p>
              <p className="text-2xl font-black text-gray-900 leading-none mt-1">{totalTarget}</p>
            </div>
          </div>
          <div className="bg-green-50 border border-[#3AB000] p-5 rounded-none flex items-center gap-4">
            <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full shrink-0 border border-green-200">
              <Award size={20} className="text-[#3AB000]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-green-700 uppercase tracking-[0.2em]">Total Generated</p>
              <p className="text-2xl font-black text-[#3AB000] leading-none mt-1 mb-1.5">{totalCardsIssued}</p>
              {(isRM || isZC) && (
                <p className="text-[8.5px] font-bold text-green-800/70 leading-tight pr-2">
                  *Note: This total includes cards made before you joined. Commission is only paid for cards made AFTER you joined the team and locked your zone.
                </p>
              )}
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-500 p-5 rounded-none flex items-center gap-4">
            <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full shrink-0 border border-emerald-200">
              <Award size={20} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">New Cards</p>
              <p className="text-2xl font-black text-emerald-600 leading-none mt-1">{totalNewCards}</p>
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-500 p-5 rounded-none flex items-center gap-4">
            <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full shrink-0 border border-purple-200">
              <Award size={20} className="text-purple-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-purple-700 uppercase tracking-[0.2em]">Old Cards</p>
              <p className="text-2xl font-black text-purple-600 leading-none mt-1">{totalOldCards}</p>
            </div>
          </div>
        </div>

        {/* Role Counts */}
        {(isRM || isZC) && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 p-5 rounded-none flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-blue-700 uppercase tracking-[0.2em]">Self Cards</p>
                <p className="text-2xl font-black text-blue-900 leading-none mt-1">{roleCounts.Self !== undefined ? roleCounts.Self : 0}</p>
              </div>
              <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full shrink-0 border border-blue-100">
                <Award size={20} className="text-blue-500" />
              </div>
            </div>

            {isRM && (
              <div className="bg-white border border-gray-200 p-5 rounded-none flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Total ZC</p>
                  <p className="text-2xl font-black text-gray-900 leading-none mt-1">{roleCounts.ZC}</p>
                </div>
                <div className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-full shrink-0 border border-gray-100">
                  <Users size={20} className="text-gray-500" />
                </div>
              </div>
            )}
            <div className="bg-white border border-gray-200 p-5 rounded-none flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Total DM</p>
                <p className="text-2xl font-black text-gray-900 leading-none mt-1">{roleCounts.DM}</p>
              </div>
              <div className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-full shrink-0 border border-gray-100">
                <Users size={20} className="text-gray-500" />
              </div>
            </div>
            <div className="bg-white border border-gray-200 p-5 rounded-none flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Total BS</p>
                <p className="text-2xl font-black text-gray-900 leading-none mt-1">{roleCounts.BS}</p>
              </div>
              <div className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-full shrink-0 border border-gray-100">
                <Users size={20} className="text-gray-500" />
              </div>
            </div>
            <div className="bg-white border border-gray-200 p-5 rounded-none flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Total PE</p>
                <p className="text-2xl font-black text-gray-900 leading-none mt-1">{roleCounts.PE}</p>
              </div>
              <div className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-full shrink-0 border border-gray-100">
                <Users size={20} className="text-gray-500" />
              </div>
            </div>
          </div>
        )}

        {/* Tracking Table - Theme Style */}
        <div className="bg-white border border-[#3AB000] shadow-sm overflow-hidden rounded-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Employee Info</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Location</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">Assigned Target</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">Cards Issued</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] w-1/3">Target Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <Loader2 className="w-10 h-10 animate-spin text-[#3AB000] mx-auto mb-4" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compiling Team Data...</p>
                    </td>
                  </tr>
                ) : data.team && data.team.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No matching team members found</p>
                    </td>
                  </tr>
                ) : (
                  currentTeamData.map((emp) => (
                    <tr key={emp.id} className="hover:bg-green-50/20 transition-colors relative">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <p className="text-[13px] font-black text-gray-900 uppercase tracking-tight">{emp.name}</p>
                          <span className="mt-1 text-[9px] font-black text-[#3AB000] uppercase tracking-widest bg-green-50 inline-block px-2 py-0.5 border border-green-200 w-fit">
                            {emp.designation}
                          </span>
                        </div>
                      </td>
                          <td className="px-6 py-5">
                            <div className="space-y-1">
                              <p className="text-[13px] font-black text-gray-800 uppercase leading-none">{emp.district}</p>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                                <MapPin size={10} className="text-[#3AB000]" />
                                {emp.block === "N/A" ? "N/A" : emp.block}
                                {(emp.panchayat && emp.panchayat !== "N/A") && (
                                  <span className="ml-1 text-gray-400">({emp.panchayat})</span>
                                )}
                              </p>
                            </div>
                          </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-xl font-black text-gray-900">{emp.target}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-xl font-black text-[#3AB000]">{emp.achieved}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-black uppercase tracking-widest ${
                              emp.statusColor === 'green' ? 'text-[#3AB000]' : 
                              emp.statusColor === 'orange' ? 'text-amber-500' : 'text-red-500'
                            }`}>
                              {emp.progress >= 80 ? "On Track" : emp.progress >= 50 ? "Falling Behind" : "Critical"}
                            </span>
                            <span className="text-[12px] font-black text-gray-900">{emp.progress}%</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 overflow-hidden border border-gray-200">
                            <div 
                              className={`h-full ${getProgressBarColor(emp.statusColor)} transition-all duration-700`} 
                              style={{ width: `${emp.progress}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination Controls */}
        {!loading && totalPages > 0 && (
          <div className="flex items-center justify-between mt-6 bg-white border border-[#3AB000] p-4 rounded-none">
            <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, data.team.length)} of {data.team.length} Entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 text-gray-500 hover:bg-[#3AB000] hover:text-white hover:border-[#3AB000] transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:hover:border-gray-200"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  // Show max 5 pages with logic to keep current page centered if many pages
                  if (
                    totalPages <= 5 || 
                    i === 0 || 
                    i === totalPages - 1 || 
                    (i >= currentPage - 2 && i <= currentPage)
                  ) {
                    return (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 flex items-center justify-center text-[11px] font-black transition-colors ${
                          currentPage === i + 1 
                            ? 'bg-[#3AB000] text-white border border-[#3AB000]' 
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-[#3AB000] hover:text-[#3AB000]'
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  }
                  
                  // Show ellipsis
                  if (
                    (i === 1 && currentPage > 3) || 
                    (i === totalPages - 2 && currentPage < totalPages - 2)
                  ) {
                    return <span key={i} className="px-1 text-gray-400">...</span>;
                  }
                  
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 text-gray-500 hover:bg-[#3AB000] hover:text-white hover:border-[#3AB000] transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:hover:border-gray-200"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
        </div>

        {/* Footer Policy - Matching Feed Style */}
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-none flex items-start gap-4">
          <AlertCircle className="text-[#3AB000] shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1.5">Tracking Compliance</p>
            <p className="text-[10px] text-gray-500 font-bold leading-relaxed max-w-2xl">
              Target statistics are updated in real-time based on approved card generation records. It is the responsibility of the {isZC ? "Zonal Coordinator" : "Regional Manager"} to ensure all team members strictly adhere to their assigned monthly targets. Constant poor performance (Red Status) requires immediate intervention and retraining.
            </p>
          </div>
        </div>

      </div>

      {/* Zones Modal */}
      {showZonesModal && data.rmDetails?.zone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowZonesModal(false)}>
          <div className="bg-white p-6 max-w-2xl w-full max-h-[80vh] flex flex-col border-t-4 border-[#3AB000] shadow-2xl rounded-none" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Supervising Zones</h3>
                <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest mt-1">All Assigned Locations</p>
              </div>
              <button onClick={() => setShowZonesModal(false)} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar-green pr-2">
              <div className="flex flex-wrap gap-2.5">
                {data.rmDetails.zone.split(',').map((z, idx) => {
                  const parts = z.trim().split('/');
                  const eng = parts[0] ? parts[0].trim() : '';
                  const hin = parts[1] ? parts[1].trim() : '';
                  return (
                    <div key={idx} className="bg-green-50/50 border border-green-200 px-3 py-2 flex flex-col items-center justify-center min-w-[120px] hover:bg-[#3AB000] hover:text-white hover:border-[#3AB000] group transition-all duration-200 cursor-default">
                      <span className="text-xs font-black uppercase tracking-wider group-hover:text-white text-gray-800">{eng}</span>
                      {hin && <span className="text-[10px] font-bold group-hover:text-green-100 text-gray-500 mt-0.5">{hin}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default TargetTracking;
