import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { policiesAPI } from "../utils/api";
import {
  FileText,
  Eye,
  Download,
  Loader2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

const cleanFileUrl = (url) => {
  if (!url) return "";
  const API_BASE_URL = import.meta.env.MODE === "development"
    ? "http://localhost:3005/api"
    : "https://api.jssabhiyan.com/api";
  if (url.includes("localhost:3005/api")) return url.replace("http://localhost:3005/api", API_BASE_URL);
  if (url.includes("api.jssabhiyan.com/api") && import.meta.env.MODE === "development") return url.replace("https://api.jssabhiyan.com/api", API_BASE_URL);
  if (url.startsWith("http")) return url;
  if (url.startsWith("/api/")) {
    const base = API_BASE_URL.endsWith("/api") ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    return `${base}${url}`;
  }
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${path}`;
};

const PoliciesView = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Evidence Modal State
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState("");
  const [evidenceError, setEvidenceError] = useState(false);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await policiesAPI.getAll();
      if (res.success) {
        setPolicies(res.data || []);
      } else {
        toast.error(res.message || "Failed to fetch policies");
      }
    } catch (error) {
      toast.error("Could not fetch policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleDownload = async (policy) => {
    try {
      setDownloadingId(policy._id);
      const response = await fetch(cleanFileUrl(policy.fileUrl));
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const ext = policy.fileType === "pdf" ? ".pdf" : ".jpg";
      const filename = `${policy.title.replace(/[^a-z0-9]/gi, "_")}${ext}`;
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
      setDownloadingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-0 md:p-6 mt-4 md:mt-0 space-y-6 h-full mr-0 md:mr-4 ml-0 md:ml-6 px-2 md:px-0">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-white border border-[#3AB000]/20 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#3AB000]/10 flex items-center justify-center">
               <FileText className="text-[#3AB000]" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">Company Policies</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">View & Download official documents</p>
            </div>
          </div>
        </div>

        {/* List View */}
        <div className="space-y-3">
           {loading ? (
             <div className="py-12 flex flex-col items-center justify-center gap-3 bg-white border border-gray-200">
                <Loader2 className="animate-spin text-[#3AB000]" size={24} />
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Loading...</p>
             </div>
           ) : policies.length === 0 ? (
             <div className="py-12 bg-white border border-dashed border-gray-200 text-center">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No policies available right now</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {policies.map((policy) => (
                  <div key={policy._id} className="bg-white border border-[#3AB000]/20 hover:border-[#3AB000]/60 transition-all shadow-sm overflow-hidden flex flex-col">
                     <div className="p-5 flex-1 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="w-10 h-10 bg-[#3AB000]/10 rounded flex items-center justify-center shrink-0">
                            <FileText className="text-[#3AB000]" size={20} />
                          </div>
                          <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded font-black uppercase tracking-wider">
                            {policy.fileType === "pdf" ? "PDF" : "Image"}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-[14px] font-black text-gray-900 uppercase tracking-tight line-clamp-2" title={policy.title}>{policy.title}</h4>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Uploaded: {new Date(policy.createdAt).toLocaleDateString("en-IN")}</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 border-t border-gray-100">
                        <button 
                          onClick={() => {
                            setSelectedEvidenceUrl(cleanFileUrl(policy.fileUrl));
                            setEvidenceError(false);
                            setShowEvidenceModal(true);
                          }}
                          className="flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-[#3AB000]/5 hover:text-[#3AB000] border-r border-gray-100 transition-colors"
                        >
                          <Eye size={14} /> View
                        </button>
                        <button 
                          onClick={() => handleDownload(policy)}
                          disabled={downloadingId === policy._id}
                          className="flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-[#3AB000]/5 hover:text-[#3AB000] transition-colors"
                        >
                          {downloadingId === policy._id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
                          Download
                        </button>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>

      {/* Viewer Modal */}
      {showEvidenceModal && selectedEvidenceUrl && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 bg-[#3AB000]">
              <h2 className="text-white font-bold text-base flex items-center gap-2 uppercase tracking-wide">
                <FileText className="w-5 h-5" /> Document Viewer
              </h2>
              <button
                onClick={() => setShowEvidenceModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <XCircle className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-4 bg-gray-50 flex items-center justify-center min-h-[500px]">
              {evidenceError ? (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <AlertCircle className="w-16 h-16 text-red-500 animate-bounce" />
                  <h3 className="text-lg font-black text-gray-800 uppercase">Document Not Found</h3>
                  <p className="text-xs font-bold text-gray-500 max-w-sm">
                    The requested file could not be loaded. It may have been removed or the connection failed.
                  </p>
                </div>
              ) : selectedEvidenceUrl.toLowerCase().includes(".pdf") ? (
                <iframe
                  src={selectedEvidenceUrl}
                  className="w-full h-[70vh] border border-gray-200"
                  title="Policy Document"
                  onError={() => setEvidenceError(true)}
                />
              ) : (
                <img
                  src={selectedEvidenceUrl}
                  alt="Policy Document"
                  className="w-full max-h-[70vh] object-contain mx-auto shadow-md border border-gray-200"
                  onError={() => setEvidenceError(true)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PoliciesView;
