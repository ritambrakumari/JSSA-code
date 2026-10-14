import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { zonalTrackingAPI } from "../../utils/api";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Loader2,
  AlertCircle,
  MapPin,
  TrendingUp,
  Target,
  Users,
  ChevronLeft,
  Phone,
  X
} from "lucide-react";
import { toast } from "react-hot-toast";

const Avatar = ({ src, alt, size = 16 }) => {
  const [error, setError] = useState(false);
  
  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#f0f9eb] text-[#3AB000] font-black text-xl uppercase">
        {alt ? alt.charAt(0) : <User size={size} />}
      </div>
    );
  }

  return (
    <img 
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className="w-full h-full object-cover"
    />
  );
};

const HeaderDistrictCell = ({ districtsString }) => {
  const [showModal, setShowModal] = useState(false);
  const maxLength = 100;
  
  if (!districtsString || districtsString.length <= maxLength) {
    return <span className="text-gray-900">{districtsString || "N/A"}</span>;
  }
  
  return (
    <>
      <span className="text-gray-900 inline">
        {districtsString.substring(0, maxLength)}...
        <button 
          onClick={() => setShowModal(true)}
          className="ml-2 text-[9px] font-black text-[#3AB000] hover:underline uppercase tracking-wider"
        >
          View More
        </button>
      </span>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-none shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 bg-[#3AB000] text-white flex justify-between items-center shrink-0">
              <h3 className="font-black uppercase tracking-widest text-sm">All Assigned Districts</h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-gray-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[40vh] md:max-h-[50vh]">
              <ul className="grid grid-cols-2 gap-y-3 gap-x-4">
                {districtsString.split(',').map((d, i) => (
                  <li key={i} className="text-xs font-bold text-gray-800 flex items-start gap-2">
                    <span className="text-[#3AB000] mt-0.5">•</span>
                    {d.trim()}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
              <button 
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-black text-white text-[10px] font-black uppercase tracking-wider hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const AdminZonalTrackingDetails = () => {
  const { zcId } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 10;

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await zonalTrackingAPI.getZCTrackingDetails(zcId, page, limit, searchTerm);
      if (res.success) {
        setData(res.data);
      } else {
        toast.error(res.message || "Failed to load tracking details");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [zcId, page, searchTerm]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-white flex flex-col items-center justify-center">
          <Loader2 size={48} className="animate-spin text-[#3AB000] mb-4" />
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Loading Tracking Data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!data || !data.zcDetails) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <p className="text-sm font-black text-gray-800 uppercase tracking-wide">Data Not Found</p>
          <button onClick={() => navigate("/admin/zonal-tracking")} className="mt-6 px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-none">
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { zcDetails, zcMatrix, overallMatrix, employees } = data;

  const getProgressBarColor = (percentage) => {
    if (percentage >= 75) return 'bg-[#3AB000]';
    if (percentage >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTextColor = (percentage) => {
    if (percentage >= 75) return 'text-[#3AB000]';
    if (percentage >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50/30 p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          
          {/* Back Button */}
          <button 
            onClick={() => navigate("/admin/zonal-tracking")}
            className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-black uppercase tracking-widest mb-4 transition-colors"
          >
            <ChevronLeft size={14} /> Back to ZC List
          </button>

          {/* SECTION 1: ZC Details */}
          <div className="bg-white border border-gray-200 p-6 rounded-none shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div className="flex items-start md:items-center gap-5 w-full">
              <div className="w-20 h-20 bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 rounded-none shrink-0 overflow-hidden">
                <Avatar 
                  src={zcDetails.photo ? (zcDetails.photo.startsWith('http') ? zcDetails.photo : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${zcDetails.photo}`) : null}
                  alt={zcDetails.name}
                  size={32}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="inline-block bg-[#3AB000] text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-widest">
                    {zcDetails.role || "ZC"}
                  </span>
                  <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">{zcDetails.name}</h1>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Employee ID</p>
                      <p className="text-[11px] font-bold text-gray-800">{zcDetails.userId.slice(-6).toUpperCase()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</p>
                      <p className="text-[11px] font-bold text-gray-800">{zcDetails.phone || "—"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 max-w-2xl">
                    <MapPin size={14} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Assigned District(s)</p>
                      <p className="text-[11px] font-bold text-gray-800 leading-relaxed">
                        <HeaderDistrictCell districtsString={zcDetails.workingDistrict} />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* SECTION 2: ZC Target Matrix */}
            <div className="bg-white border-t-4 border-t-black border border-gray-200 p-6 rounded-none shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Target size={18} className="text-black" />
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">ZC Personal Target</h2>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 p-4 border border-gray-150">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Monthly Target</p>
                  <p className="text-2xl font-black text-gray-900">{zcMatrix.target}</p>
                </div>
                <div className="bg-gray-50 p-4 border border-gray-150">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Achieved</p>
                  <p className="text-2xl font-black text-gray-900">{zcMatrix.achieved}</p>
                </div>
                <div className={`bg-gray-50 p-4 border border-gray-150 flex flex-col justify-center`}>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Performance</p>
                  <p className={`text-2xl font-black ${getTextColor(zcMatrix.percentage)}`}>{zcMatrix.percentage}%</p>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-100 relative mt-2">
                <div 
                  className={`h-full ${getProgressBarColor(zcMatrix.percentage)} transition-all duration-1000`}
                  style={{ width: `${zcMatrix.percentage}%` }}
                />
              </div>
            </div>

            {/* SECTION 3: Employees Overall Matrix */}
            <div className="bg-white border-t-4 border-t-[#3AB000] border border-gray-200 p-6 rounded-none shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Users size={18} className="text-[#3AB000]" />
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Team Overall Target</h2>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 p-4 border border-gray-150">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Combined Target</p>
                  <p className="text-2xl font-black text-[#3AB000]">{overallMatrix.target}</p>
                </div>
                <div className="bg-gray-50 p-4 border border-gray-150">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Achieved</p>
                  <p className="text-2xl font-black text-[#3AB000]">{overallMatrix.achieved}</p>
                </div>
                <div className="bg-gray-50 p-4 border border-gray-150 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Overall Progress</p>
                  <p className={`text-2xl font-black ${getTextColor(overallMatrix.percentage)}`}>{overallMatrix.percentage}%</p>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-100 relative mt-2">
                <div 
                  className={`h-full ${getProgressBarColor(overallMatrix.percentage)} transition-all duration-1000`}
                  style={{ width: `${overallMatrix.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Employees List */}
          <div className="bg-white border border-gray-200 rounded-none shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 justify-between items-center">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-700" />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Assigned Team Members</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search Name or Mobile"
                  className="text-xs font-medium px-3 py-1.5 border border-gray-200 focus:outline-none focus:border-[#3AB000] min-w-[220px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setPage(1);
                      setSearchTerm(searchInput);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    setPage(1);
                    setSearchTerm(searchInput);
                  }}
                  className="bg-white hover:bg-gray-50 text-gray-800 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border border-gray-200"
                >
                  Search
                </button>
                {data.pagination && (
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white border border-gray-200 px-3 py-1.5 ml-2">
                    Total: {data.pagination.total}
                  </span>
                )}
              </div>
            </div>

            {employees.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center gap-4 text-center bg-white">
                <div className="p-4 bg-gray-50 border border-gray-150 text-gray-300 rounded-none inline-block">
                  <AlertCircle size={40} />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900 uppercase">No Team Members Found</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">This ZC has no locked employees in their assigned districts.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-white text-gray-500 font-black uppercase text-[10px] tracking-widest border-b border-gray-200">
                      <th className="p-4 w-12 text-center">#</th>
                      <th className="p-4">Employee Information</th>
                      <th className="p-4">Location</th>
                      <th className="p-4 text-center">Role</th>
                      <th className="p-4 text-center">Achieved / Target</th>
                      <th className="p-4 text-center">Progress</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employees.map((emp, idx) => (
                      <tr key={emp.userId} className="transition-colors hover:bg-gray-50/50">
                        <td className="p-4 text-center text-[11px] font-black text-gray-400">
                          {idx + 1}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-none bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0 overflow-hidden">
                              {emp.profilePicture ? (
                                <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${emp.profilePicture}`} alt={emp.name} className="w-full h-full object-cover" />
                              ) : (
                                <User size={20} />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate max-w-[200px]">{emp.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black text-gray-500 bg-gray-100 px-1.5 py-0.5 border border-gray-200 uppercase rounded-none">
                                  ID: {emp.userId?.toString().slice(-6).toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium mb-1">
                            <MapPin size={12} className="text-gray-400" />
                            {emp.district !== "N/A" ? emp.district : emp.state}
                          </div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                            {emp.block !== "N/A" && emp.block} {emp.panchayat !== "N/A" && `> ${emp.panchayat}`}
                          </p>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-black bg-white border border-gray-200 text-gray-800 px-2 py-1 rounded-none uppercase tracking-widest shadow-sm">
                              {emp.role}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 border border-gray-200 shadow-sm">
                            <span className="text-lg font-black text-gray-900 leading-none">{emp.achieved}</span>
                            <span className="text-xs font-bold text-gray-400">/ {emp.target}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-full h-2 bg-gray-100 overflow-hidden flex-1 relative">
                              <div 
                                className={`h-full ${getProgressBarColor(emp.percentage)} transition-all duration-1000`} 
                                style={{ width: `${emp.percentage}%` }} 
                              />
                            </div>
                            <span className={`text-[10px] font-black w-8 text-right ${getTextColor(emp.percentage)}`}>
                              {emp.percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                           {emp.percentage >= 75 ? (
                             <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#3AB000] bg-green-50 px-2 py-1 border border-green-100">
                               <TrendingUp size={10} /> On Track
                             </span>
                           ) : emp.percentage >= 40 ? (
                             <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 border border-amber-100">
                               <AlertCircle size={10} /> Needs Push
                             </span>
                           ) : (
                             <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 border border-red-100">
                               <AlertCircle size={10} /> Critical
                             </span>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {data.pagination && data.pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6 px-4 pb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Page {data.pagination.page} of {data.pagination.pages}
                </span>
                <div className="flex flex-wrap items-center gap-1 justify-end">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={data.pagination.page === 1}
                    className="px-3 py-1.5 border border-gray-200 bg-white text-xs font-bold text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    PREV
                  </button>
                  
                  {(() => {
                    const total = data.pagination.pages;
                    const current = data.pagination.page;
                    const delta = 1;
                    const range = [];
                    
                    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
                      range.push(i);
                    }
                    if (current - delta > 2) range.unshift("...");
                    if (current + delta < total - 1) range.push("...");
                    
                    range.unshift(1);
                    if (total !== 1) range.push(total);
                    
                    return range.map((pageNum, idx) => (
                      pageNum === "..." ? (
                        <span key={`dots-${idx}`} className="px-2 py-1.5 text-xs font-bold text-gray-400">...</span>
                      ) : (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-1.5 border text-xs font-bold ${
                            current === pageNum 
                              ? "bg-[#3AB000] text-white border-[#3AB000]" 
                              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    ));
                  })()}

                  <button
                    onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                    disabled={data.pagination.page === data.pagination.pages}
                    className="px-3 py-1.5 border border-gray-200 bg-white text-xs font-bold text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    NEXT
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminZonalTrackingDetails;
