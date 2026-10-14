import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { doctorsAPI, cardAPI } from "../../utils/api";
import { Stethoscope, Loader2, User, Phone, Mail, Award, Key, MapPin, List, CheckCircle, XCircle, Clock, Eye, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import moment from "moment";

const cleanImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;
  if (url.includes("localhost:") && url.includes("/api/")) {
    const parts = url.split("/api/");
    return `https://api.jssabhiyan.com/api/${parts[1]}`;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api/")) return `https://api.jssabhiyan.com${url}`;
  if (url.startsWith("/")) return `https://api.jssabhiyan.com/api${url}`;
  if (url.startsWith("uploads/") || url.startsWith("files/")) return `https://api.jssabhiyan.com/api/${url}`;
  const cleanPath = url.startsWith("/") ? url.slice(1) : url;
  return `https://api.jssabhiyan.com/api/files/${cleanPath}`;
};

const CardholderTokenGeneration = () => {
  const [doctors, setDoctors] = useState([]);
  const [myTokens, setMyTokens] = useState([]);
  const [myCards, setMyCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingFor, setGeneratingFor] = useState(null);
  const [successModal, setSuccessModal] = useState({ show: false, data: null });
  const [viewTokenModal, setViewTokenModal] = useState({ show: false, data: null });
  const [cardSelectionModal, setCardSelectionModal] = useState({ show: false, doctorId: null });
  const [activeTab, setActiveTab] = useState("doctors");
  const [tokenPage, setTokenPage] = useState(1);
  const [tokenPagination, setTokenPagination] = useState({ pages: 1, total: 0 });
  const [loadingTokens, setLoadingTokens] = useState(false);

  const fetchMyTokens = async (pageNum = 1) => {
    setLoadingTokens(true);
    try {
      const res = await doctorsAPI.getCardholderTokens(pageNum, 10);
      if (res.success) {
        setMyTokens(res.tokens);
        if (res.pagination) setTokenPagination(res.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch tokens", error);
    } finally {
      setLoadingTokens(false);
    }
  };

  useEffect(() => {
    if (activeTab === "tokens") {
      fetchMyTokens(tokenPage);
    }
  }, [tokenPage, activeTab]);

  const fetchData = async () => {
    try {
      const [docRes, tokenRes, cardRes] = await Promise.all([
        doctorsAPI.getActiveDoctors(),
        doctorsAPI.getCardholderTokens(1, 10),
        cardAPI.getMyCard(true).catch(() => ({ success: true, data: [] }))
      ]);
      if (docRes.success) {
        setDoctors(docRes.data);
      }
      if (tokenRes.success) {
        setMyTokens(tokenRes.tokens);
        if (tokenRes.pagination) setTokenPagination(tokenRes.pagination);
      }
      if (cardRes.success && cardRes.data) {
        setMyCards(Array.isArray(cardRes.data) ? cardRes.data : [cardRes.data]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateToken = async (doctorId, cardId) => {
    setGeneratingFor(doctorId);
    setCardSelectionModal({ show: false, doctorId: null });
    try {
      const res = await doctorsAPI.generateToken(doctorId, cardId);
      if (res.success) {
        const doctorObj = doctors.find(d => d._id === doctorId);
        const cardObj = myCards.find(c => c._id === cardId);

        // Manually populate token to avoid "Unknown" flash before fetchData completes
        const populatedToken = {
          ...res.token,
          doctorId: doctorObj,
          cardId: cardObj,
        };

        setSuccessModal({ show: true, data: { tokenNumber: res.token.tokenNumber, doctor: doctorObj } });
        setMyTokens(prev => [populatedToken, ...prev].slice(0, 10)); // Keep max 10
        fetchData();
      } else {
        toast.error(res.error || "Failed to generate token");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setGeneratingFor(null);
    }
  };



  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="border-b-4 border-[#3AB000] pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                Token <span className="text-[#3AB000]">Generation</span>
              </h1>
              <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.3em] mt-2">
                Generate token for consultation
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("doctors")}
              className={`pb-3 px-2 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === "doctors"
                ? "border-b-2 border-[#3AB000] text-[#3AB000]"
                : "text-gray-400 hover:text-gray-600"
                }`}
            >
              Doctor List
            </button>
            <button
              onClick={() => setActiveTab("tokens")}
              className={`pb-3 px-2 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === "tokens"
                ? "border-b-2 border-[#3AB000] text-[#3AB000]"
                : "text-gray-400 hover:text-gray-600"
                }`}
            >
              My Generated Tokens
            </button>
          </div>

          {activeTab === "doctors" && (
            <div className="flex flex-col gap-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200">
                  <Loader2 className="w-10 h-10 animate-spin text-[#3AB000] mb-4" />
                  <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Loading doctors...</p>
                </div>
              ) : doctors.length === 0 ? (
                <div className="py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
                  <p className="font-bold uppercase tracking-widest text-xs">No doctors available at the moment.</p>
                </div>
              ) : (
                doctors.map(doctor => {
                  const pendingCardIds = myTokens
                    .filter(t => (t.doctorId?._id === doctor._id || t.doctorId === doctor._id) && t.status === "pending" && t.cardId)
                    .map(t => typeof t.cardId === 'object' ? t.cardId._id : t.cardId);

                  // Disable if user has no cards, or if ALL of their cards already have pending tokens for this doctor
                  const allCardsPending = myCards.length === 0 || myCards.every(c => pendingCardIds.includes(c._id));

                  return (
                    <div key={doctor._id} className="bg-white rounded-none p-6 shadow-sm border border-[#3AB000] hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-6 items-stretch">

                      {/* Left Side: Image & Info */}
                      <div className="flex flex-col gap-4 w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 shrink-0 rounded-none border-2 border-gray-200 shadow-inner bg-green-50 overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center text-[#3AB000] font-black text-xl uppercase z-0">
                              {doctor.name ? doctor.name.substring(0, 2) : 'DR'}
                            </div>
                            {doctor.image && (
                              <img
                                src={cleanImageUrl(doctor.image)}
                                alt={doctor.name}
                                className="absolute inset-0 w-full h-full object-cover z-10 bg-white"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-black text-gray-800 leading-tight flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">{doctor.name}</span>
                            </h3>
                          </div>
                        </div>

                        {doctor.clinicAddress && (
                          <div className="bg-green-50/50 rounded-none p-4 border border-green-100/50 flex-1">
                            <h4 className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
                              <MapPin size={12} className="text-green-600" /> Location
                            </h4>
                            <p className="text-[11px] font-bold text-green-900 bg-green-100/50 px-2 py-1.5 rounded-none inline-block border border-green-200/50">
                              {doctor.clinicAddress}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Middle: Bio & Specifications */}
                      <div className="flex-1 flex flex-col w-full border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
                        <div className="mb-5">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
                            <User size={12} /> About Doctor
                          </h4>
                          <p className="text-xs text-gray-600 leading-relaxed text-justify">
                            {doctor.description || "Expert medical professional ready to assist you."}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
                            <Stethoscope size={12} /> Specifications
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(doctor.specification) && doctor.specification.length > 0 ? (
                              doctor.specification.map((spec, i) => (
                                <span key={i} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest border border-gray-200">
                                  {spec}
                                </span>
                              ))
                            ) : (
                              <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest border border-gray-200">
                                General Physician
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Section */}
                      <div className="flex flex-col justify-center min-w-[200px]">
                        <button
                          onClick={() => setCardSelectionModal({ show: true, doctorId: doctor._id })}
                          disabled={generatingFor === doctor._id || allCardsPending}
                          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-none font-black text-xs uppercase tracking-widest transition-all shadow-sm ${allCardsPending
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300"
                            : "bg-white text-[#3AB000] hover:bg-[#3AB000] hover:text-white border-2 border-[#3AB000] disabled:opacity-50 disabled:cursor-not-allowed"
                            }`}
                        >
                          {generatingFor === doctor._id ? (
                            <>
                              <Loader2 size={16} className="animate-spin" /> Generating...
                            </>
                          ) : allCardsPending ? (
                            <>
                              <Clock size={16} /> Max Pending Limit
                            </>
                          ) : (
                            <>
                              <Key size={16} /> Generate Token
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "tokens" && (
            <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm relative min-h-[400px] flex flex-col">
              <div className="overflow-x-auto min-h-[350px] flex-1">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#3AB000] text-white font-black uppercase text-[10px] tracking-widest">
                      <th className="px-4 py-4">Token No</th>
                      <th className="px-4 py-4">Doctor Info</th>
                      <th className="px-4 py-4">Generated On</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingTokens || loading ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 animate-spin text-[#3AB000] mb-4" />
                            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Loading tokens...</p>
                          </div>
                        </td>
                      </tr>
                    ) : myTokens.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          <p className="font-bold uppercase tracking-widest text-xs">No tokens generated yet.</p>
                        </td>
                      </tr>
                    ) : (
                      myTokens.map(token => (
                        <tr key={token._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-black text-gray-900">{token.tokenNumber}</span>
                            <p className="text-[10px] text-gray-500 uppercase font-bold mt-1 truncate max-w-[150px]" title={token.cardId?.cardholderName || token.cardholderId?.name}>
                              Patient: {token.cardId?.cardholderName || token.cardholderId?.name || "Unknown"}
                            </p>
                            {token.cardId?.cardId && (
                              <p className="text-[10px] text-[#3AB000] font-bold uppercase mt-0.5">
                                Card: {token.cardId.cardId}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200 overflow-hidden shrink-0">
                                <div className="absolute inset-0 flex items-center justify-center font-black text-sm uppercase z-0">
                                  {token.doctorId?.name ? token.doctorId.name.substring(0, 2) : 'DR'}
                                </div>
                                {token.doctorId?.image && (
                                  <img
                                    src={cleanImageUrl(token.doctorId.image)}
                                    alt="Doc"
                                    className="absolute inset-0 w-full h-full object-cover z-10 bg-white"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{token.doctorId?.name || "Unknown Doctor"}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider truncate">{token.doctorId?.specification?.[0] || "General"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-gray-700">
                            {moment(token.createdAt).format("DD/MM/YYYY, HH:mm:ss")}
                          </td>
                          <td className="px-4 py-3">
                            {token.status === "pending" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-700 text-[10px] font-black uppercase tracking-widest border border-yellow-200">
                                <Clock size={12} /> Pending
                              </span>
                            )}
                            {token.status === "prescribed" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-200">
                                <FileText size={12} /> Prescribed
                              </span>
                            )}
                            {token.status === "dispensed" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-widest border border-purple-200">
                                <CheckCircle size={12} /> Dispensed
                              </span>
                            )}
                            {token.status === "completed" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-[#3AB000] text-[10px] font-black uppercase tracking-widest border border-[#3AB000]/30">
                                <CheckCircle size={12} /> Completed
                              </span>
                            )}
                            {token.status === "cancelled" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest border border-red-200">
                                <XCircle size={12} /> Cancelled
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setViewTokenModal({ show: true, data: token })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-none text-[10px] font-black uppercase tracking-widest border border-blue-200 hover:border-blue-600 transition-colors shadow-sm"
                            >
                              <Eye size={12} /> View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination UI */}
              {tokenPagination.total > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between mt-auto border-t border-gray-100 bg-gray-50 p-4 gap-4">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Showing {myTokens.length} of {tokenPagination.total} Tokens
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={tokenPage === 1}
                      onClick={() => setTokenPage(tokenPage - 1)}
                      className="px-4 py-2 bg-white border border-gray-250 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all"
                    >
                      Prev
                    </button>
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, tokenPagination.pages))].map((_, i) => {
                        let pageNum = 1;
                        if (tokenPagination.pages <= 5) pageNum = i + 1;
                        else if (tokenPage <= 3) pageNum = i + 1;
                        else if (tokenPage >= tokenPagination.pages - 2) pageNum = tokenPagination.pages - 4 + i;
                        else pageNum = tokenPage - 2 + i;
                        if (pageNum > tokenPagination.pages) return null;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setTokenPage(pageNum)}
                            className={`w-8 h-8 flex items-center justify-center text-[10px] font-black transition-all border rounded-none ${tokenPage === pageNum
                              ? "bg-[#3AB000] border-[#3AB000] text-white scale-110"
                              : "bg-white border-gray-250 text-gray-400 hover:border-[#3AB000]"
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      disabled={tokenPage === tokenPagination.pages}
                      onClick={() => setTokenPage(tokenPage + 1)}
                      className="px-4 py-2 bg-white border border-gray-250 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {successModal.show && successModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-none border-t-4 border-[#3AB000] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                <CheckCircle size={32} className="text-[#3AB000]" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">Token Generated</h2>
              <div className="bg-gray-50 border border-gray-100 p-4 mb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Your Token Number</p>
                <p className="text-2xl font-black text-[#3AB000]">{successModal.data.tokenNumber}</p>
              </div>

              <div className="text-left bg-blue-50/50 border border-blue-100 p-4 mb-6">
                <p className="font-bold text-gray-800 text-sm mb-1">{successModal.data.doctor?.name}</p>
                <div className="flex items-start gap-1.5 mb-3">
                  <MapPin size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-gray-600">{successModal.data.doctor?.clinicAddress || "Clinic address not specified"}</p>
                </div>

                <div className="space-y-2 border-t border-blue-100/50 pt-3">
                  <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                    <span className="font-black text-gray-900">Next Steps:</span> Please visit the doctor at the clinic address provided above at your earliest convenience to consult and get your prescribed medicines.
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <span className="font-black text-gray-800">अगला कदम:</span> कृपया परामर्श के लिए और अपनी निर्धारित दवाइयां प्राप्त करने के लिए जल्द से जल्द ऊपर दिए गए क्लिनिक के पते पर डॉक्टर से मिलें।
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSuccessModal({ show: false, data: null });
                  setActiveTab("tokens");
                }}
                className="w-full py-3 bg-[#3AB000] hover:bg-[#2d8a00] text-white font-black text-xs uppercase tracking-widest transition-colors rounded-none"
              >
                View My Tokens
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Token Modal */}
      {viewTokenModal.show && viewTokenModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-none shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className={`p-4 text-white flex justify-between items-center ${viewTokenModal.data.status === "pending" ? "bg-yellow-500" :
              viewTokenModal.data.status === "completed" ? "bg-[#3AB000]" : "bg-red-500"
              }`}>
              <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                {viewTokenModal.data.status === "pending" && <Clock size={18} />}
                {viewTokenModal.data.status === "completed" && <CheckCircle size={18} />}
                {viewTokenModal.data.status === "cancelled" && <XCircle size={18} />}
                {viewTokenModal.data.status} TOKEN
              </h2>
              <button onClick={() => setViewTokenModal({ show: false, data: null })} className="hover:bg-black/20 p-1 rounded transition-colors">
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 text-center">
              <div className="bg-gray-50 border border-gray-100 p-4 mb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Token Number</p>
                <p className="text-2xl font-black text-gray-900">{viewTokenModal.data.tokenNumber}</p>
                <p className="text-xs text-gray-500 font-bold mt-2 border-t border-gray-200 pt-2">
                  Generated: {moment(viewTokenModal.data.createdAt).format("DD MMM YYYY, hh:mm A")}
                </p>
              </div>

              <div className="text-left bg-blue-50/50 border border-blue-100 p-4 mb-6">
                <p className="font-bold text-gray-800 text-sm mb-1">{viewTokenModal.data.doctorId?.name || "Unknown Doctor"}</p>
                <div className="flex items-start gap-1.5 mb-3">
                  <MapPin size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-gray-600">{viewTokenModal.data.doctorId?.clinicAddress || "Clinic address not specified"}</p>
                </div>

                {viewTokenModal.data.status === "pending" && (
                  <div className="space-y-2 border-t border-blue-100/50 pt-3">
                    <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                      <span className="font-black text-gray-900">Next Steps:</span> Please visit the doctor at the clinic address provided above at your earliest convenience.
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <span className="font-black text-gray-800">अगला कदम:</span> कृपया परामर्श के लिए ऊपर दिए गए क्लिनिक के पते पर डॉक्टर से मिलें।
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setViewTokenModal({ show: false, data: null })}
                className="w-full py-3 bg-gray-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest transition-colors rounded-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Selection Modal */}
      {cardSelectionModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-none border-t-4 border-[#3AB000] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-4 flex justify-between items-center bg-gray-50 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Select Patient Card</h2>
              <button
                onClick={() => setCardSelectionModal({ show: false, doctorId: null })}
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-gray-600 font-bold mb-4">Please select the card for which you want to book this consultation.</p>

              <div className="space-y-3">
                {myCards.map(card => {
                  // Check if this specific card has a pending token for the selected doctor
                  const isPendingForThisCard = myTokens.some(t =>
                    (t.doctorId?._id === cardSelectionModal.doctorId || t.doctorId === cardSelectionModal.doctorId) &&
                    t.status === "pending" &&
                    (typeof t.cardId === 'object' ? t.cardId._id === card._id : t.cardId === card._id)
                  );

                  return (
                    <button
                      key={card._id}
                      disabled={isPendingForThisCard}
                      onClick={() => handleGenerateToken(cardSelectionModal.doctorId, card._id)}
                      className={`w-full text-left p-4 border-2 flex items-center justify-between transition-all ${isPendingForThisCard
                        ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                        : "border-gray-200 hover:border-[#3AB000] hover:bg-green-50"
                        }`}
                    >
                      <div className="flex flex-col text-left gap-3 py-1">
                        <div>
                          <span className="text-[10px] text-[#3AB000] font-black uppercase tracking-widest block mb-1">Card Holder Name</span>
                          <span className="font-black text-[15px] text-gray-800 uppercase block leading-none">{card.cardholderName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#3AB000] font-black uppercase tracking-widest block mb-1">Card Number</span>
                          <span className="text-xs font-black text-gray-700 uppercase tracking-widest block leading-none">{card.cardId}</span>
                        </div>
                      </div>

                      {isPendingForThisCard ? (
                        <span className="text-[10px] font-black uppercase text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Pending</span>
                      ) : (
                        <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-[#3AB000]">Select</span>
                      )}
                    </button>
                  );
                })}

                {myCards.length === 0 && (
                  <div className="text-center p-4 bg-red-50 text-red-600 font-bold text-sm border border-red-200">
                    No cards available. Please apply for a card first.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CardholderTokenGeneration;
