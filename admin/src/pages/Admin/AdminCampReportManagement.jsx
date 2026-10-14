import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, MapPin, X, FileImage, FileVideo, User, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';

const AdminCampReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem('jssa_auth') || '{}');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/camp-report/all`, {
        headers: { Authorization: `Bearer ${authData.token}` }
      });
      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load camp reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this camp report?")) return;
    try {
      const authData = JSON.parse(localStorage.getItem('jssa_auth') || '{}');
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/camp-report/${id}`, {
        headers: { Authorization: `Bearer ${authData.token}` }
      });
      if (res.data.success) {
        toast.success("Report deleted successfully");
        fetchReports();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete report");
    }
  };

  return (
    <DashboardLayout>
      <div className="admin-camp-container">
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">

        <div className="bg-white p-4 border border-gray-200 rounded-none shadow-sm space-y-4 mr-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
              <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase">
                <MapPin className="w-6 h-6 text-[#3AB000]" />
                Camp Report Management
              </h1>
            </div>

            <button
              onClick={() => fetchReports()}
              className="bg-black hover:bg-gray-800 text-white text-xs sm:text-sm px-5 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Feed
            </button>
          </div>
        </div>

      <div className="bg-white border border-gray-200 rounded-none shadow-sm overflow-hidden mr-4">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#3AB000] border-b border-[#3AB000]">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em]">Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em]">Submitted By (RM)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em]">Report Details</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em]">Media</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-gray-50">
                    <td className="px-6 py-6"><div className="w-20 h-4 bg-gray-100" /></td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-none"></div>
                        <div className="space-y-2">
                           <div className="h-4 bg-gray-100 rounded w-24"></div>
                           <div className="h-3 bg-gray-50 rounded w-32"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-40"></div></td>
                    <td className="px-6 py-6"><div className="h-4 bg-gray-50 rounded w-20"></div></td>
                    <td className="px-6 py-6"><div className="h-10 bg-gray-100 rounded w-10 ml-auto"></div></td>
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                     <AlertCircle size={64} className="text-gray-100 mx-auto mb-4" />
                     <p className="text-sm font-black text-gray-300 uppercase tracking-[0.3em]">Zero active reports detected</p>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                <tr key={report._id} className="hover:bg-[#f9fff5] transition-colors border-b border-gray-100 group">
                  <td className="px-6 py-6">
                    <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0A3D00] text-white flex items-center justify-center font-black text-sm rounded-none overflow-hidden shrink-0">
                        {report.createdBy?.employeeId?.photo || report.createdBy?.photo ? (
                          <img src={report.createdBy.employeeId?.photo || report.createdBy.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (report.createdBy?.employeeId?.name || report.createdBy?.name || "U")[0].toUpperCase()
                        )}
                      </div>
                      <div className="max-w-[180px]">
                        <p className="text-[13px] font-black text-gray-900 uppercase leading-none mb-1 group-hover:text-[#3AB000] transition-colors truncate">
                          {report.createdBy?.employeeId?.name || report.createdBy?.name || 'Unknown'}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{report.createdBy?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 max-w-[300px]">
                    <p className="text-[12px] font-black text-gray-900 uppercase leading-tight line-clamp-2">{report.title}</p>
                    <p className="text-[11px] font-medium text-gray-500 leading-relaxed line-clamp-2 italic mt-1">{report.description}</p>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><FileImage size={14} className="text-[#3AB000]" /> {report.images?.length || 0}</span>
                      <span className="flex items-center gap-1"><FileVideo size={14} className="text-orange-500" /> {report.videos?.length || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="h-10 w-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-[#3AB000] border border-gray-200 hover:border-[#3AB000]/30 transition-all shadow-sm"
                        title="View Full Report"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(report._id)}
                        className="h-10 w-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-500/30 transition-all shadow-sm"
                        title="Delete Report"
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
        </div>

      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border-2 border-[#3AB000] w-full max-w-4xl overflow-hidden shadow-2xl relative my-8 rounded-none">
            <div className="p-4 bg-green-50 border-b border-[#3AB000] flex justify-between items-center sticky top-0 z-10">
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">{selectedReport.title}</h2>
                <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest mt-1">
                  Submitted by {selectedReport.createdBy?.employeeId?.name || selectedReport.createdBy?.name || 'Unknown'} on {new Date(selectedReport.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-1 hover:bg-gray-200 transition-colors border border-gray-300">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <div className="h-4 w-1 bg-[#3AB000]"></div> Description
                </h3>
                <div className="bg-gray-50 p-4 border border-gray-200 text-xs font-bold text-gray-700 whitespace-pre-wrap leading-relaxed tracking-wide">
                  {selectedReport.description}
                </div>
              </div>

              {selectedReport.tags && selectedReport.tags.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <div className="h-4 w-1 bg-[#3AB000]"></div> Key Highlights / Tags
                  </h3>
                  <div className="bg-gray-50 p-4 border border-gray-200">
                    <ul className="list-disc list-inside text-xs font-bold text-gray-700 space-y-1">
                      {selectedReport.tags.map((tag, i) => (
                        <li key={i}>{tag}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedReport.images && selectedReport.images.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <div className="h-4 w-1 bg-[#3AB000]"></div> Uploaded Images
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedReport.images.map((img, i) => (
                      <div key={i} className="relative group overflow-hidden border border-gray-200 shadow-sm aspect-square">
                        <img src={img} alt={`Report Image ${i+1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => setPreviewImage(img)} className="bg-white text-black p-2 rounded-none hover:bg-[#3AB000] hover:text-white transition-colors border border-transparent hover:border-white shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                            <Eye size={14} /> View Full
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.videos && selectedReport.videos.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <div className="h-4 w-1 bg-[#3AB000]"></div> Uploaded Videos
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedReport.videos.map((vid, i) => (
                      <div key={i} className="relative group overflow-hidden border border-gray-200 shadow-sm bg-black aspect-video">
                        <video src={vid} className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => setPreviewVideo(vid)} className="bg-white text-black p-2 rounded-none hover:bg-[#3AB000] hover:text-white transition-colors border border-transparent hover:border-white shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                            <Eye size={14} /> Play Video
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-[#3AB000] bg-green-50 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-6 py-2.5 font-black text-[11px] uppercase tracking-widest text-[#3AB000] bg-white border border-[#3AB000] hover:bg-[#3AB000] hover:text-white transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
          <button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 p-2 text-white transition-colors border border-white/20">
            <X size={24} />
          </button>
          <img src={previewImage} alt="Preview" className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl border border-white/10" />
        </div>
      )}

      {previewVideo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
          <button onClick={() => setPreviewVideo(null)} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 p-2 text-white transition-colors border border-white/20">
            <X size={24} />
          </button>
          <video src={previewVideo} controls autoPlay className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl border border-white/10" />
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3AB000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2d8a00;
        }
      `}</style>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminCampReportManagement;
