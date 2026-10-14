import React, { useState, useEffect } from 'react';
import DashboardLayout from "../../components/DashboardLayout";
import { User, Users, MapPin, Search, Award, TrendingUp, AlertCircle, Loader2, ChevronLeft, ChevronRight, Target, Filter, Lock } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { employeesAPI } from "../../utils/api";

const AdminTargetTracking = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [role, setRole] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [blockFilter, setBlockFilter] = useState("all");
  const [panchayatFilter, setPanchayatFilter] = useState("all");
  const [zoneStatus, setZoneStatus] = useState("locked");
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("current");

  const [filterCounts, setFilterCounts] = useState({ states: {}, districts: {}, blocks: {}, panchayats: {} });

  const loadFilterCounts = async () => {
    try {
      const res = await employeesAPI.getAllFilterCounts({
        role: role !== "all" ? role : "",
        state: stateFilter !== "all" ? stateFilter : "",
        district: districtFilter !== "all" ? districtFilter : "",
        block: blockFilter !== "all" ? blockFilter : ""
      });
      if (res.success) {
        const normalizeKeys = (obj) => {
          const newObj = {};
          Object.keys(obj || {}).forEach(k => {
             if (k && k !== "N/A") {
               const cleanKey = k.split('/')[0].trim().toUpperCase();
               newObj[cleanKey] = (newObj[cleanKey] || 0) + obj[k];
             }
          });
          // Sort keys alphabetically
          return Object.keys(newObj).sort().reduce((acc, key) => {
            acc[key] = newObj[key];
            return acc;
          }, {});
        };

        setFilterCounts({ 
          states: normalizeKeys(res.data?.states), 
          districts: normalizeKeys(res.data?.districts), 
          blocks: normalizeKeys(res.data?.blocks), 
          panchayats: normalizeKeys(res.data?.panchayats) 
        });
      }
    } catch (err) {
      console.error("Failed to load filter counts:", err);
    }
  };

  useEffect(() => {
    loadFilterCounts();
  }, [role, stateFilter, districtFilter, blockFilter]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchTargetData = async () => {
    try {
      setLoading(true);
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;
      if (!token) throw new Error("No token found");

      let queryParams = new URLSearchParams();
      if (role !== "all") queryParams.append("role", role);
      if (zoneStatus !== "all") queryParams.append("zoneStatus", zoneStatus);
      if (stateFilter !== "all") queryParams.append("state", stateFilter);
      if (districtFilter !== "all") queryParams.append("district", districtFilter);
      if (blockFilter !== "all") queryParams.append("block", blockFilter);
      if (panchayatFilter !== "all") queryParams.append("panchayat", panchayatFilter);
      if (search) queryParams.append("search", search);
      if (monthFilter !== "current") queryParams.append("month", monthFilter);
      
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/goal-config/admin/target-tracking?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setData(res.data.data || []);
        setCurrentPage(1);
      } else {
        setError(res.data.message || "Failed to fetch data");
        toast.error("Failed to fetch data");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTargetData();
    }, 500);
    return () => clearTimeout(timer);
  }, [role, stateFilter, districtFilter, blockFilter, panchayatFilter, search, zoneStatus, monthFilter]);

  // Pagination logic
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const currentData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
        
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30">
              <Target className="text-white" size={30} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Target Tracking</h1>
              <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Global Employee Target Monitoring</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-none text-center md:text-right shrink-0">
            <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Total Employees</p>
            <p className="text-xl font-black text-white uppercase mt-1">{data.length}</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white border border-gray-200 p-4 mb-6 rounded shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[#3AB000]" />
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Directory Filters</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            <div className="lg:col-span-1">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Search Employee</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-800 focus:outline-none focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] rounded transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full py-2 px-3 bg-gray-50 border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-800 focus:outline-none focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] rounded transition-all cursor-pointer"
              >
                <option value="all">ALL ROLES</option>
                <option value="RM">REGIONAL MANAGER</option>
                <option value="ZC">ZONAL COORDINATOR</option>
                <option value="DM">DISTRICT MANAGER</option>
                <option value="BS">BLOCK SUPERVISOR</option>
                <option value="PE">PANCHAYAT EXECUTIVE</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Month</label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full py-2 px-3 bg-gray-50 border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-800 focus:outline-none focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] rounded transition-all cursor-pointer"
              >
                <option value="current">CURRENT MONTH</option>
                <option value="past">PAST MONTH</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Zone Status</label>
              <select
                value={zoneStatus}
                onChange={(e) => setZoneStatus(e.target.value)}
                className="w-full py-2 px-3 bg-gray-50 border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-800 focus:outline-none focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] rounded transition-all cursor-pointer"
              >
                <option value="all">ALL ZONES</option>
                <option value="locked">LOCKED ZONES</option>
                <option value="unlocked">UNLOCKED ZONES</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">State</label>
              <select
                value={stateFilter}
                onChange={(e) => {
                  setStateFilter(e.target.value);
                  setDistrictFilter("all");
                  setBlockFilter("all");
                  setPanchayatFilter("all");
                }}
                className="w-full py-2 px-3 bg-gray-50 border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-800 focus:outline-none focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] rounded transition-all cursor-pointer"
              >
                <option value="all">ALL STATES</option>
                {Object.keys(filterCounts.states || {}).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">District</label>
              <select
                value={districtFilter}
                onChange={(e) => {
                  setDistrictFilter(e.target.value);
                  setBlockFilter("all");
                  setPanchayatFilter("all");
                }}
                disabled={stateFilter === "all"}
                className="w-full py-2 px-3 bg-gray-50 border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-800 focus:outline-none focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] rounded transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="all">ALL DISTRICTS</option>
                {stateFilter !== "all" && Object.keys(filterCounts.districts || {}).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Block</label>
              <select
                value={blockFilter}
                onChange={(e) => {
                  setBlockFilter(e.target.value);
                  setPanchayatFilter("all");
                }}
                disabled={districtFilter === "all"}
                className="w-full py-2 px-3 bg-gray-50 border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-800 focus:outline-none focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] rounded transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="all">ALL BLOCKS</option>
                {districtFilter !== "all" && Object.keys(filterCounts.blocks || {}).map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-none border border-gray-200 overflow-hidden relative min-h-[400px]">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-black uppercase text-[10px] tracking-widest border-b border-gray-150">
                  <th className="p-4 w-12 text-center"></th>
                  <th className="p-4">Employee Information</th>
                  <th className="p-4">Location</th>
                  <th className="p-4 text-center">Role</th>
                  <th className="p-4 text-center">Achieved / Target</th>
                  <th className="p-4 text-center">Progress</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 size={40} className="animate-spin text-[#3AB000]" />
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Performance Data...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
                        <div className="p-4 bg-gray-50 border border-gray-150 text-gray-300 rounded-none inline-block">
                          <AlertCircle size={40} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900 uppercase">No Employees Found</p>
                          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">Try adjusting your filters or search terms</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentData.map((emp) => (
                    <tr key={emp.userId} className="transition-colors hover:bg-gray-50/30">
                      <td className="p-4 text-center">
                        <div className="w-4 h-4 bg-gray-100 rounded-none border border-gray-200 mx-auto"></div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-none bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                            {emp.profilePicture ? (
                              <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${emp.profilePicture}`} alt={emp.name} className="w-full h-full object-cover" />
                            ) : (
                              <User size={20} className="text-gray-400" />
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate max-w-[200px]">{emp.name}</p>
                              <span className="text-[9px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 border border-gray-150 uppercase rounded-none">
                                ID: {emp.userId?.toString().slice(-6).toUpperCase() || 'NEW'}
                              </span>
                            </div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1 truncate max-w-[320px]">{emp.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                          <MapPin size={12} className="text-gray-400" />
                          {emp.district !== "N/A" ? `${emp.district}, ${emp.state}` : emp.state}
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
                           {emp.block !== "N/A" && emp.block} {emp.panchayat !== "N/A" && `> ${emp.panchayat}`}
                        </p>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-black bg-white border border-gray-200 text-gray-800 px-2 py-1 rounded uppercase tracking-widest shadow-sm">
                            {emp.role}
                          </span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            {emp.isZoneLocked && <Lock size={8} className="text-[#3AB000]" />}
                            {emp.designation || 'EMPLOYEE'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {emp.role === "RM" ? (
                          <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 border border-gray-100">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">TEAM PROGRESS</span>
                            <span className={`text-sm font-black ${emp.colorCode === 'green' ? 'text-[#3AB000]' : emp.colorCode === 'red' ? 'text-red-500' : 'text-amber-500'}`}>
                              {emp.percentage}%
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 border border-gray-100">
                            <span className="text-lg font-black text-gray-900 leading-none">{emp.achieved}</span>
                            <span className="text-xs font-bold text-gray-400">/ {emp.target}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full h-2.5 bg-gray-100 overflow-hidden flex-1 relative">
                            <div 
                              className={`h-full ${getProgressBarColor(emp.colorCode)} transition-all duration-1000`} 
                              style={{ width: `${emp.percentage}%` }} 
                            />
                          </div>
                          <span className={`text-xs font-black w-10 text-right ${emp.colorCode === 'green' ? 'text-[#3AB000]' : emp.colorCode === 'red' ? 'text-red-500' : 'text-amber-500'}`}>
                            {emp.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                         {emp.colorCode === 'green' ? (
                           <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#3AB000] bg-green-50 px-2 py-1">
                             <TrendingUp size={12} /> On Track
                           </span>
                         ) : emp.colorCode === 'orange' ? (
                           <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1">
                             <AlertCircle size={12} /> Needs Push
                           </span>
                         ) : (
                           <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1">
                             <AlertCircle size={12} /> Critical
                           </span>
                         )}
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
          <div className="flex flex-col md:flex-row items-center justify-between mt-8 gap-4 px-2">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, data.length)} of {data.length} Employees
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 bg-white border border-gray-250 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all"
              >
                Prev
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  if (
                    totalPages <= 5 || 
                    i === 0 || 
                    i === totalPages - 1 || 
                    Math.abs(currentPage - 1 - i) <= 1
                  ) {
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 flex items-center justify-center text-[10px] font-black transition-all border rounded-none ${
                          currentPage === i + 1 
                            ? 'bg-[#3AB000] border-[#3AB000] text-white scale-110' 
                            : 'bg-white border-gray-250 text-gray-400 hover:border-[#3AB000]'
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  } else if (
                    (i === 1 && currentPage > 3) || 
                    (i === totalPages - 2 && currentPage < totalPages - 2)
                  ) {
                    return <span key={i} className="text-gray-400 px-1">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-4 py-2 bg-white border border-gray-250 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminTargetTracking;
