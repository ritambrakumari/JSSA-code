import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { doctorsAPI } from "../../utils/api";
import { FileText, Plus, Clock, ArrowRight, Activity, Search, RefreshCw, ClipboardList, Eye, X } from "lucide-react";

// Helper to sanitize image URLs for production
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

const WritePrescription = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("pending");
  const [tokens, setTokens] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPagination, setPendingPagination] = useState({ pages: 1, total: 0 });
  const [prescriptionPage, setPrescriptionPage] = useState(1);
  const [prescriptionPagination, setPrescriptionPagination] = useState({ pages: 1, total: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      if (activeTab === "pending" && pendingPage !== 1) setPendingPage(1);
      if (activeTab === "prescriptions" && prescriptionPage !== 1) setPrescriptionPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, activeTab, pendingPage, prescriptionPage]);

  useEffect(() => {
    if (activeTab === "pending") {
      fetchPendingTokens(pendingPage, debouncedSearch);
    } else {
      fetchMyPrescriptions(prescriptionPage, debouncedSearch);
    }
  }, [activeTab, pendingPage, prescriptionPage, debouncedSearch]);

  const fetchPendingTokens = async (pageNum = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const res = await doctorsAPI.getPendingTokens(pageNum, 10, searchQuery);
      if (res.success) {
        setTokens(res.tokens);
        if (res.pagination) setPendingPagination(res.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch pending tokens", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPrescriptions = async (pageNum = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const res = await doctorsAPI.getMyPrescriptions(pageNum, 10, searchQuery);
      if (res.success) {
        setPrescriptions(res.prescriptions);
        if (res.pagination) setPrescriptionPagination(res.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch prescriptions", error);
    } finally {
      setLoading(false);
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
                <FileText className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">
                  Write Prescription
                </h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">
                  Prescribe Medicines & View Records
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/doctor/dashboard/create-prescription")}
                className="bg-white text-[#3AB000] hover:bg-gray-50 border-none px-5 h-9 font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 rounded-none shadow-sm shrink-0"
              >
                <Plus size={14} /> Create Prescription
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b-2 border-gray-100 mb-6 px-2">
            <button
              onClick={() => { setActiveTab("pending"); setSearchTerm(""); }}
              className={`flex items-center gap-2 px-6 py-3 font-black text-xs uppercase tracking-widest transition-all ${activeTab === "pending"
                ? "border-b-4 border-[#3AB000] text-[#3AB000]"
                : "text-gray-400 hover:text-gray-600 hover:border-gray-300"
                }`}
            >
              <Clock size={16} /> Pending Tokens
            </button>
            <button
              onClick={() => { setActiveTab("prescriptions"); setSearchTerm(""); }}
              className={`flex items-center gap-2 px-6 py-3 font-black text-xs uppercase tracking-widest transition-all ${activeTab === "prescriptions"
                ? "border-b-4 border-[#3AB000] text-[#3AB000]"
                : "text-gray-400 hover:text-gray-600 hover:border-gray-300"
                }`}
            >
              <ClipboardList size={16} /> My Prescriptions
            </button>
          </div>

          <div className="bg-white border-2 border-gray-100 p-0 rounded-none shadow-sm min-h-[400px] flex flex-col">
            <div className="p-4 border-b-2 border-gray-100 flex flex-col md:flex-row justify-between md:items-center bg-gray-50 gap-4">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                {activeTab === "pending" ? (
                  <><Clock size={16} className="text-[#3AB000]" /> Pending Tokens</>
                ) : (
                  <><ClipboardList size={16} className="text-[#3AB000]" /> Prescriptions Record</>
                )}
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by token or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-none text-sm font-bold focus:outline-none focus:border-[#3AB000] focus:ring-0 w-64 transition-colors"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#3AB000] text-white font-black uppercase text-[10px] tracking-widest">
                    <th className="px-6 py-4">Token Number</th>
                    <th className="px-6 py-4">Patient / Cardholder</th>
                    <th className="px-6 py-4">Date</th>
                    {activeTab === "prescriptions" && <th className="px-6 py-4">Medicines</th>}
                    {activeTab === "prescriptions" && <th className="px-6 py-4">Status</th>}
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={activeTab === "prescriptions" ? "6" : "4"} className="px-6 py-10">
                        <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
                          <RefreshCw size={24} className="text-[#3AB000] animate-spin" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Loading...</p>
                        </div>
                      </td>
                    </tr>
                  ) : (activeTab === "pending" && tokens.length === 0) || (activeTab === "prescriptions" && prescriptions.length === 0) ? (
                    <tr>
                      <td colSpan={activeTab === "prescriptions" ? "6" : "4"} className="px-6 py-10">
                        <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
                          <Activity size={24} className="text-gray-300" />
                          <p className="text-[10px] font-black uppercase tracking-widest">No records found</p>
                        </div>
                      </td>
                    </tr>
                  ) : activeTab === "pending" ? (
                    tokens.map((token) => (
                      <tr key={token._id} className="hover:bg-[#f9fff5] transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-[#f9fff5] border border-[#3AB000] flex items-center justify-center text-[#3AB000] rounded-none shrink-0 font-bold">
                              #
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900 uppercase">{token.tokenNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-bold text-gray-800 uppercase">{token.cardId?.cardholderName || token.cardholderId?.name}</p>
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{token.cardholderId?.phone}</p>
                          {token.cardId?.cardId && (
                            <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest mt-0.5">Card: {token.cardId.cardId}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700 font-bold">{new Date(token.createdAt).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => navigate(`/doctor/dashboard/create-prescription?tokenId=${token._id}`)}
                            className="bg-transparent border-2 border-[#3AB000] text-[#3AB000] px-4 py-1.5 rounded-none hover:bg-[#3AB000] hover:text-white transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 inline-flex"
                          >
                            Write <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    prescriptions.map((p) => (
                      <tr key={p._id} className="hover:bg-[#f9fff5] transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 rounded-none shrink-0 font-bold">
                              Rx
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900 uppercase">{p.tokenId?.tokenNumber || "N/A"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-bold text-gray-800 uppercase">{p.tokenId?.cardId?.cardholderName || p.cardholderId?.name}</p>
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{p.cardholderId?.phone}</p>
                          {p.tokenId?.cardId?.cardId && (
                            <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest mt-0.5">Card: {p.tokenId.cardId.cardId}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700 font-bold">{new Date(p.createdAt).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-gray-900">{p.medicines?.length || 0}</span> <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">Prescribed</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest border ${p.status === 'dispensed' ? 'bg-green-50 text-[#3AB000] border-[#3AB000]/30' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}>
                            {p.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => setSelectedPrescription(p)}
                            className="bg-transparent border-2 border-gray-300 text-gray-600 px-4 py-1.5 rounded-none hover:bg-gray-100 hover:text-gray-900 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 inline-flex"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination UI */}
            {activeTab === "pending" && pendingPagination.total > 0 && (
              <div className="flex flex-col md:flex-row items-center justify-between mt-auto border-t border-gray-100 bg-gray-50 p-4 gap-4">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Showing {tokens.length} of {pendingPagination.total} Pending Tokens
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pendingPage === 1}
                    onClick={() => setPendingPage(pendingPage - 1)}
                    className="px-4 py-2 bg-white border border-gray-250 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all"
                  >
                    Prev
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, pendingPagination.pages))].map((_, i) => {
                      let pageNum = 1;
                      if (pendingPagination.pages <= 5) pageNum = i + 1;
                      else if (pendingPage <= 3) pageNum = i + 1;
                      else if (pendingPage >= pendingPagination.pages - 2) pageNum = pendingPagination.pages - 4 + i;
                      else pageNum = pendingPage - 2 + i;
                      if (pageNum > pendingPagination.pages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPendingPage(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center text-[10px] font-black transition-all border rounded-none ${pendingPage === pageNum
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
                    disabled={pendingPage === pendingPagination.pages}
                    onClick={() => setPendingPage(pendingPage + 1)}
                    className="px-4 py-2 bg-white border border-gray-250 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {activeTab === "prescriptions" && prescriptionPagination.total > 0 && (
              <div className="flex flex-col md:flex-row items-center justify-between mt-auto border-t border-gray-100 bg-gray-50 p-4 gap-4">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Showing {prescriptions.length} of {prescriptionPagination.total} Prescriptions
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={prescriptionPage === 1}
                    onClick={() => setPrescriptionPage(prescriptionPage - 1)}
                    className="px-4 py-2 bg-white border border-gray-250 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all"
                  >
                    Prev
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, prescriptionPagination.pages))].map((_, i) => {
                      let pageNum = 1;
                      if (prescriptionPagination.pages <= 5) pageNum = i + 1;
                      else if (prescriptionPage <= 3) pageNum = i + 1;
                      else if (prescriptionPage >= prescriptionPagination.pages - 2) pageNum = prescriptionPagination.pages - 4 + i;
                      else pageNum = prescriptionPage - 2 + i;
                      if (pageNum > prescriptionPagination.pages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPrescriptionPage(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center text-[10px] font-black transition-all border rounded-none ${prescriptionPage === pageNum
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
                    disabled={prescriptionPage === prescriptionPagination.pages}
                    onClick={() => setPrescriptionPage(prescriptionPage + 1)}
                    className="px-4 py-2 bg-white border border-gray-250 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Prescription Modal (Prescription Pad Style) */}
      {selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-3xl shadow-2xl flex flex-col my-8 relative rounded-none">

            {/* Close Button Floating */}
            <button
              onClick={() => setSelectedPrescription(null)}
              className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
            >
              <X size={16} />
            </button>

            {/* Prescription Pad Container */}
            <div className="p-8 md:p-12 border-t-8 border-[#3AB000] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] relative print:border-none print:shadow-none print:p-0">

              {/* Doctor Header */}
              <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-gray-200 pb-6 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-[#1a5000] uppercase tracking-wider">
                    Dr. {selectedPrescription.doctorId?.name || "Doctor Name"}
                  </h2>
                  <p className="text-sm font-bold text-gray-600 uppercase tracking-widest mt-1">
                    {selectedPrescription.doctorId?.specification || "Medical Specialist"}
                  </p>
                </div>
                <div className="text-left md:text-right mt-4 md:mt-0">
                  <div className="inline-block px-4 py-2 border-2 border-[#3AB000] text-[#3AB000] font-black uppercase tracking-widest text-lg mb-2 bg-green-50/50 max-w-[250px] whitespace-normal break-words">
                    {selectedPrescription.doctorId?.clinicName || selectedPrescription.doctorId?.clinicAddress || "Clinic / Hospital"}
                  </div>

                </div>
              </div>

              {/* Patient Details Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-none mb-8 border border-gray-200">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Patient Name</p>
                  <p className="text-sm font-bold text-gray-900 uppercase break-words">
                    {selectedPrescription.tokenId?.cardId?.cardholderName || selectedPrescription.cardholderId?.name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Date</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(selectedPrescription.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Token / ID</p>
                  <p className="text-sm font-bold text-gray-900 break-words">{selectedPrescription.tokenId?.tokenNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Card ID</p>
                  <p className="text-sm font-bold text-gray-900 break-words">
                    {selectedPrescription.tokenId?.cardId?.cardId ? selectedPrescription.tokenId.cardId.cardId : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Phone No.</p>
                  <p className="text-sm font-bold text-gray-900 break-words">
                    {selectedPrescription.cardholderId?.phone || "N/A"}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="min-h-[300px]">
                <div className="flex gap-4 mb-6">
                  <div className="text-5xl font-serif font-bold text-[#3AB000] italic opacity-80 leading-none">
                    Rx
                  </div>
                  <div className="w-full pt-2 overflow-x-auto">
                    {selectedPrescription.medicines && selectedPrescription.medicines.length > 0 ? (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b-2 border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            <th className="pb-3 w-10">#</th>
                            <th className="pb-3">Medicine Name</th>
                            <th className="pb-3">Dosage</th>
                            <th className="pb-3">Duration</th>
                            <th className="pb-3 text-right">Source</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedPrescription.medicines.map((med, index) => (
                            <tr key={index} className="group hover:bg-gray-50 transition-colors">
                              <td className="py-4 text-sm font-bold text-gray-400">{index + 1}.</td>
                              <td className="py-4">
                                <p className="text-sm font-bold text-gray-900 uppercase">{med.name || med.medicineId?.name}</p>
                              </td>
                              <td className="py-4 text-sm text-gray-700 font-bold">{med.dosage}</td>
                              <td className="py-4 text-sm text-gray-700">{med.duration}</td>
                              <td className="py-4 text-right">
                                <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest border rounded-none ${med.source === 'in_house' ? 'bg-green-50 text-[#3AB000] border-[#3AB000]/30' : 'bg-orange-50 text-orange-600 border-orange-200'
                                  }`}>
                                  {med.source.replace("_", " ")}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-sm text-gray-500 italic mt-2">No medicines prescribed.</p>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                {selectedPrescription.notes && (
                  <div className="mt-10 ml-0 md:ml-[4.5rem]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b-2 border-gray-100 pb-1">Additional Notes / Advice</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap font-medium">{selectedPrescription.notes}</p>
                  </div>
                )}
              </div>

              {/* Footer Section */}
              <div className="mt-16 pt-8 border-t-2 border-dashed border-gray-200 flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="text-left w-full md:w-1/3 flex flex-col justify-end">
                  <p className="text-[12px] font-black uppercase tracking-widest text-gray-400">
                    Powered By <span className="text-gray-800">JSSA</span>
                  </p>
                </div>

                <div className="text-right w-full md:w-1/3 flex flex-col items-end">
                  {selectedPrescription.doctorId?.signatureDoc ? (
                    <img
                      src={cleanImageUrl(selectedPrescription.doctorId.signatureDoc)}
                      alt="Doctor Signature"
                      className="h-16 object-contain mb-2 mix-blend-multiply opacity-90"
                    />
                  ) : (
                    <div className="h-16 w-32 border-b-2 border-gray-800 border-dashed mb-2 opacity-20"></div>
                  )}
                  <p className="text-sm font-bold text-gray-900 uppercase">Dr. {selectedPrescription.doctorId?.name}</p>
                  <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest mt-1">Authorized Signature</p>
                </div>
              </div>

            </div>

            {/* Action Bar (Close) */}
            <div className="bg-gray-100 p-4 border-t border-gray-200 flex justify-end items-center rounded-none print:hidden">
              <button
                onClick={() => setSelectedPrescription(null)}
                className="bg-gray-800 text-white hover:bg-gray-700 px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default WritePrescription;
