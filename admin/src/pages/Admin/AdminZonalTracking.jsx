import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { zonalTrackingAPI } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import {
  Search,
  User,
  Loader2,
  AlertCircle,
  Map,
  Eye,
  Lock,
  X
} from "lucide-react";
import { toast } from "react-hot-toast";

const Avatar = ({ src, alt }) => {
  const [error, setError] = useState(false);
  
  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#f0f9eb] text-[#3AB000] font-black text-sm uppercase">
        {alt ? alt.charAt(0) : <User size={16} />}
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

const DistrictCell = ({ districtsString }) => {
  const [showModal, setShowModal] = useState(false);
  const maxLength = 60;
  
  const cleanDistricts = districtsString ? districtsString.split(',').map(d => d.split('/')[0].trim()).filter(Boolean).join(', ') : "";

  if (!cleanDistricts || cleanDistricts.length <= maxLength) {
    return <span className="text-[11px] font-bold text-gray-800 leading-relaxed block max-w-md">{cleanDistricts || "—"}</span>;
  }
  
  return (
    <>
      <div className="max-w-md">
        <span className="text-[11px] font-bold text-gray-800 leading-relaxed transition-all break-words">
          {cleanDistricts.substring(0, maxLength)}...
        </span>
        <button 
          onClick={() => setShowModal(true)}
          className="ml-2 text-[9px] font-black text-[#3AB000] hover:underline uppercase tracking-wider"
        >
          View More
        </button>
      </div>

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
                {cleanDistricts.split(',').map((d, i) => (
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

const AdminZonalTracking = () => {
  const navigate = useNavigate();
  const [zcs, setZcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchZCs = async (searchQuery = "") => {
    try {
      setLoading(true);
      const res = await zonalTrackingAPI.getAdminZCsList(searchQuery);
      if (res.success) {
        setZcs(res.data || []);
      } else {
        toast.error(res.message || "Failed to load ZCs");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchZCs(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30">
                <Map className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Zonal Tracking</h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Zonal Coordinator Tracking & Analytics</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-none text-center shrink-0">
              <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Total ZCs</p>
              <p className="text-xl font-black text-white uppercase mt-1">{zcs.length}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 mb-4 rounded-none shadow-sm">
            <div className="flex items-center border border-gray-200 rounded-none overflow-hidden h-10 bg-white focus-within:border-[#3AB000] w-full max-w-md">
              <input
                type="text"
                placeholder="Search ZC by name..."
                className="flex-1 px-3 text-xs font-bold uppercase tracking-wide outline-none text-gray-800"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="bg-[#3AB000] h-full flex items-center px-3 text-white">
                <Search size={14} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-none border border-gray-200 overflow-hidden relative min-h-[300px] shadow-sm">
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-4">
                <Loader2 size={36} className="animate-spin text-[#3AB000]" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Loading Zonal Coordinators...</p>
              </div>
            )}

            {!loading && zcs.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
                <div className="p-4 bg-gray-50 border border-gray-150 text-gray-200 rounded-none">
                  <AlertCircle size={36} />
                </div>
                <p className="text-xs font-black text-gray-400 uppercase">No Zonal Coordinators Found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#3AB000] text-white font-black uppercase text-[10px] tracking-widest">
                      <th className="p-4 w-12">#</th>
                      <th className="p-4">Coordinator</th>
                      <th className="p-4">Mobile</th>
                      <th className="p-4">Designation</th>
                      <th className="p-4">Assigned District(s)</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {zcs.map((zc, idx) => (
                      <tr key={zc.userId} className="hover:bg-green-50/30 transition-colors">
                        <td className="p-4 text-[11px] font-black text-gray-400">{idx + 1}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 rounded-none shrink-0 overflow-hidden">
                                <Avatar 
                                  src={zc.photo ? (zc.photo.startsWith('http') ? zc.photo : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${zc.photo}`) : null}
                                  alt={zc.name}
                                />
                            </div>
                            <div>
                              <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{zc.name}</p>
                              <p className="text-[9px] font-bold text-gray-400 mt-0.5">ID: {zc.userId.slice(-6).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-[11px] font-bold text-gray-800 tracking-wider">{zc.phone || "—"}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-[11px] font-bold text-gray-800 uppercase">{zc.designation || "Zonal Coordinator"}</span>
                        </td>
                        <td className="p-4">
                          <DistrictCell districtsString={zc.workingDistrict} />
                        </td>
                        <td className="p-4 text-center">
                           {zc.isZoneLocked ? (
                               <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-[#3AB000] border border-green-100 text-[9px] font-black uppercase tracking-wider rounded-none">
                                 <Lock size={8} /> Locked
                               </span>
                           ) : (
                               <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-500 border border-gray-200 text-[9px] font-black uppercase tracking-wider rounded-none">
                                 Unlocked
                               </span>
                           )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => navigate(`/admin/zonal-tracking/${zc.userId}`)}
                            className="px-4 py-2 bg-black text-white hover:bg-gray-800 text-[10px] font-black uppercase tracking-wider rounded-none transition-all inline-flex items-center gap-2"
                          >
                            <Eye size={12} /> View Tracking
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminZonalTracking;
