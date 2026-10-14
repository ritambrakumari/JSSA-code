import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { claimsAPI } from "../../utils/api";
import toast from "react-hot-toast";
import {
  ShieldCheck, Search, Loader2, CheckCircle2, XCircle, FileText, RefreshCw, X, AlertCircle, IndianRupee, Check, CreditCard, Receipt, User, MessageSquare
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import indianDistricts from "../../data/district.json";

const cleanImageUrl = (url) => {
  if (!url) return "";
  if (url.includes("localhost:") && url.includes("/api/")) {
    const parts = url.split("/api/");
    return `https://api.jssabhiyan.com/api/${parts[1]}`;
  }
  if (url.startsWith("/api/")) {
    return `https://api.jssabhiyan.com${url}`;
  }
  if (!url.startsWith("http") && !url.startsWith("/api/")) {
    return `https://api.jssabhiyan.com/api/files/${url}`;
  }
  return url;
};

const EmployeeClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const { employeeProfile, user } = useAuth();
  
  const currentEmployeeRole = employeeProfile?.role;
  const isAdmin = false; // Admin logic moved to ClaimManagement.jsx

  const getAvailableStates = () => {
    if (!employeeProfile || !employeeProfile.workingState) return [];
    return employeeProfile.workingState.split(",").map(s => s.trim()).filter(s => s);
  };
  const stateOptions = getAvailableStates();

  const getAvailableDistricts = () => {
    if (!employeeProfile) return [];
    if (currentEmployeeRole === "RM") {
      if (!selectedState) return [];
      // Match state name (e.g., "MAHARASHTRA") with JSON key (e.g., "Maharashtra / महाराष्ट्र")
      const matchingKey = Object.keys(indianDistricts).find(key => 
        key.toLowerCase().includes(selectedState.toLowerCase())
      );
      return matchingKey ? indianDistricts[matchingKey] : [];
    } else if (currentEmployeeRole === "ZC") {
      if (!employeeProfile.workingDistrict) return [];
      // ZC might have multiple districts separated by comma
      return employeeProfile.workingDistrict.split(",").map(d => d.trim()).filter(d => d);
    }
    return [];
  };
  const districtOptions = getAvailableDistricts();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [remark, setRemark] = useState("");
  const [activeTab, setActiveTab] = useState("details"); // 'details' | 'documents'

  const [approvedAmountInput, setApprovedAmountInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("manual"); // 'manual' | 'razorpay'

  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState("");
  const [evidenceError, setEvidenceError] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchClaims = async () => {
    try {
      setLoading(true);
      let params = { page: currentPage, limit, search };
      if (selectedState) params.state = selectedState;
      if (selectedDistrict) params.district = selectedDistrict;
      const res = await claimsAPI.getAllClaims(params);
      if (res.success) {
        setClaims(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
        }
      }
    } catch (err) {
      toast.error("Failed to load claims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClaims();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, search, selectedState, selectedDistrict]);

  const openReviewModal = (claim) => {
    setSelectedClaim(claim);
    setRemark("");
    setApprovedAmountInput(claim.approvedAmount > 0 ? claim.approvedAmount : claim.totalMedicalExpenses || "");
    setActiveTab("details");
    setShowReviewModal(true);
  };

  const handleAction = async (status) => {
    if (!remark) {
      toast.error("Please provide a remark");
      return;
    }
    if (status === "rejected" && !window.confirm("Are you sure you want to REJECT this claim?")) return;
    if (status === "approved" && !window.confirm("Are you sure you want to APPROVE this claim?")) return;

    try {
      setUpdating(true);
      const res = await claimsAPI.updateStatus(selectedClaim._id, status, remark);
      if (res.success) {
        toast.success(`Claim ${status} successfully`);
        setShowReviewModal(false);
        fetchClaims();
      }
    } catch (err) {
      toast.error(err.message || "Action failed");
    } finally {
      setUpdating(false);
    }
  };


  const hierarchyLevels = {
    "PE": 1,
    "BS": 2,
    "DM": 3,
    "ZC": 4,
    "RM": 5,
    "ADMIN": 6
  };

  const canApprove = (claim) => {
    if (claim.status !== 'pending' || isAdmin) return false;
    return claim.currentStage === currentEmployeeRole;
  };

  const isBypassing = (claim) => {
    return false; // Deprecated with new exact-match rule
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    const diff = new Date(deadline) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };
  const filteredClaims = claims;

  const getDocKeys = () => {
    if (!selectedClaim || !selectedClaim.documents) return [];
    return Object.keys(selectedClaim.documents).filter(k => selectedClaim.documents[k]);
  };

  return (
    <DashboardLayout>
      <div className="p-0 ml-0 md:ml-6 px-2 md:px-0 mt-4 space-y-4 h-full max-w-[99rem] mr-4 pb-12">
        <div className="bg-white p-4 border border-gray-200 rounded-none shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase">
              <ShieldCheck className="w-6 h-6 text-[#3AB000]" />
              Medical Claim Approvals
            </h1>
            <button onClick={fetchClaims} className="bg-black hover:bg-gray-800 text-white text-xs sm:text-sm px-5 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
          <div className="relative flex-1 w-full border-t border-gray-100 pt-4 flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search Name, Phone, Health Card..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            
            {(currentEmployeeRole === "RM" || currentEmployeeRole === "ZC") && stateOptions.length > 0 && (
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedDistrict(""); // Reset district when state changes
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm bg-white min-w-[140px] max-w-[200px] truncate uppercase font-bold tracking-widest text-gray-700"
                >
                  <option value="">All My States</option>
                  {stateOptions.map((st, idx) => (
                    <option key={idx} value={st}>{st}</option>
                  ))}
                </select>

                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={!selectedState && currentEmployeeRole === "RM"} // RM must select state first
                  className="px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm bg-white min-w-[140px] max-w-[200px] truncate uppercase font-bold tracking-widest text-gray-700 disabled:opacity-50 disabled:bg-gray-50"
                >
                  <option value="">All Districts</option>
                  {districtOptions.map((dist, idx) => (
                    <option key={idx} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-none overflow-hidden border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#3AB000]">
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Card Holder</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Financials</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-center">Stage</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-center">Deadline</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-center">Payment</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse"><td colSpan="6" className="px-6 py-8"><div className="h-4 bg-gray-100 rounded w-full"></div></td></tr>
                  ))
                ) : filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <AlertCircle size={48} className="text-gray-200 mx-auto mb-4" />
                      <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No pending claims found</p>
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((claim) => (
                    <tr key={claim._id} className={`hover:bg-[#e8f5e2] transition-colors border-b border-gray-100 ${claim.isDeleted ? 'opacity-70 bg-red-50/30' : ''}`}>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1 items-start">
                          <p className="text-[14px] font-black text-gray-900 tracking-tight leading-none uppercase">
                            {claim.cardHolderName || claim.memberName || "Unknown"}
                          </p>
                          <p className="text-[11px] font-bold text-gray-400 tracking-tighter">HC: {claim.healthCardNumber || "N/A"}</p>
                          {claim.isRepeatedClaim && (
                            <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 rounded-sm text-[9px] font-black uppercase tracking-widest">
                              <RefreshCw size={10} /> Repeated Claim
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="max-w-xs space-y-1">
                          <p className="text-[11px] font-black text-gray-500 uppercase leading-none">Total Exp: ₹{claim.totalMedicalExpenses || 0}</p>
                          <p className="text-[12px] font-black text-green-700 uppercase leading-none">Apprv: ₹{claim.approvedAmount || 0}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {claim.isDeleted ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-red-700 text-[10px] font-black uppercase tracking-widest bg-red-100 px-2.5 py-1 border border-red-200 line-through">
                              Deleted by Admin
                            </span>
                            <span className="text-[8px] font-bold text-red-500 uppercase">Void</span>
                          </div>
                        ) : claim.payoutStatus === 'paid' ? (
                          <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest bg-blue-50 px-2.5 py-1 border border-blue-200">COMPLETED</span>
                        ) : claim.status === 'pending' ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border ${claim.currentStage === currentEmployeeRole ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                              {claim.currentStage === currentEmployeeRole ? `ACTION REQUIRED` : `PENDING WITH ${claim.currentStage}`}
                            </span>
                          </div>
                        ) : claim.status === 'approved' ? (
                          <span className="text-green-600 text-[10px] font-black uppercase tracking-widest bg-green-50 px-2.5 py-1 border border-green-100">Approved</span>
                        ) : (
                          <span className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-50 px-2.5 py-1 border border-red-100">Rejected</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center">
                         {claim.status === 'pending' && claim.stageDeadline ? (
                            <div className="flex flex-col items-center justify-center">
                              <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-sm whitespace-nowrap shadow-sm flex items-center gap-1">
                                ⏳ {getDaysLeft(claim.stageDeadline)} Days Left
                              </span>
                              <span className="text-[7.5px] font-bold text-gray-500 mt-1 max-w-[120px] leading-tight text-center uppercase tracking-widest">
                                Auto-forwards to next higher authority if no action is taken
                              </span>
                            </div>
                         ) : claim.status === 'pending' && !claim.stageDeadline ? (
                            <div className="flex flex-col items-center justify-center">
                               <span className="text-[9px] font-black text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-sm uppercase tracking-widest flex items-center gap-1">
                                 ♾️ NO DEADLINE
                               </span>
                               <span className="text-[7px] font-bold text-gray-400 mt-1 max-w-[100px] leading-tight text-center uppercase tracking-widest">
                                 Legacy Claim (Manual Action)
                               </span>
                            </div>
                         ) : (
                            <div className="flex flex-col items-center justify-center opacity-60">
                                <span className="text-[9px] font-black text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded-sm uppercase tracking-widest">
                                 {claim.isDeleted ? '🚫 DELETED' : claim.status === 'rejected' ? '🚫 REJECTED' : '✅ CLOSED'}
                               </span>
                               <span className="text-[7px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                                 Not Applicable
                               </span>
                            </div>
                         )}
                      </td>
                      <td className="px-6 py-5 text-center">
                         {claim.payoutStatus === 'paid' ? (
                           <div className="flex flex-col items-center gap-1">
                             <CheckCircle2 size={16} className="text-blue-600" />
                             <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{claim.payoutId}</span>
                           </div>
                         ) : (
                           <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Pending</span>
                         )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => openReviewModal(claim)} 
                          disabled={claim.isDeleted}
                          className={`px-4 py-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                            claim.isDeleted 
                              ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed" 
                              : "bg-gray-900 text-white hover:bg-black"
                          }`}
                        >
                          {claim.isDeleted ? "Deleted" : (canApprove(claim) ? "Review" : "View Form")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 mt-4 px-6 py-4 border-t border-gray-100 bg-white">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 bg-white text-gray-700 disabled:opacity-50 font-bold text-xs uppercase tracking-widest rounded-sm"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(currentPage - p) <= 1)
                .map((pageNumber, idx, arr) => (
                  <React.Fragment key={pageNumber}>
                    {idx > 0 && arr[idx - 1] !== pageNumber - 1 && (
                      <span className="px-2 text-gray-400 font-bold">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`w-8 h-8 flex items-center justify-center border font-bold text-xs rounded-sm transition-colors ${
                        currentPage === pageNumber
                          ? "bg-[#3AB000] text-white border-[#3AB000]"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  </React.Fragment>
                ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 bg-white text-gray-700 disabled:opacity-50 font-bold text-xs uppercase tracking-widest rounded-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showReviewModal && selectedClaim && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-2 md:p-6">
          <div className="bg-white shadow-2xl w-full h-full max-w-[1400px] rounded-sm flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#3AB000]">
              <h2 className="text-white font-bold text-base flex items-center gap-2 uppercase tracking-wide">
                <CheckCircle2 className="w-5 h-5" /> Medical Claim Form
              </h2>
              <button onClick={() => setShowReviewModal(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-center gap-4 shadow-inner">
              <button onClick={() => setActiveTab("details")} className={`px-8 py-2.5 text-xs font-black uppercase tracking-widest rounded-full transition-all ${activeTab === "details" ? "bg-[#3AB000] text-white shadow-md" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-800"}`}>
                Form Details
              </button>
              <button onClick={() => setActiveTab("documents")} className={`px-8 py-2.5 text-xs font-black uppercase tracking-widest rounded-full transition-all ${activeTab === "documents" ? "bg-[#3AB000] text-white shadow-md" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-800"}`}>
                Documents ({getDocKeys().length})
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
              
              {activeTab === "details" && (
                <div className="space-y-6">
                  {/* Status & Payout Track */}
                  {selectedClaim.payoutStatus === 'paid' && (
                    <div className="bg-blue-50 border border-blue-200 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="bg-blue-600 p-2"><CheckCircle2 className="text-white" size={20} /></div>
                         <div>
                            <p className="text-[12px] font-black text-blue-900 uppercase tracking-widest">Payment Successful</p>
                            <p className="text-[10px] font-bold text-blue-600 uppercase">TXN ID: {selectedClaim.payoutId}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-blue-900">₹{selectedClaim.approvedAmount}</p>
                         <p className="text-[9px] font-black text-blue-600 uppercase">{new Date(selectedClaim.payoutDate).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                     {/* Left Column */}
                     <div className="lg:col-span-7 flex flex-col gap-8">
                       <div>
                         <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4 flex items-center gap-2"><User size={16} className="text-[#3AB000]"/> Personal Details</h3>
                         <dl className="space-y-3">
                           <div className="flex justify-between items-center"><dt className="text-xs font-bold text-gray-500">Name:</dt><dd className="text-sm font-black text-gray-900 uppercase">{selectedClaim.cardHolderName || selectedClaim.title}</dd></div>
                           <div className="flex justify-between items-center"><dt className="text-xs font-bold text-gray-500">Relation:</dt><dd className="text-sm font-black text-gray-900 uppercase">{selectedClaim.relation || "N/A"}</dd></div>
                           <div className="flex justify-between items-center"><dt className="text-xs font-bold text-gray-500">Health Card:</dt><dd className="text-sm font-black text-gray-900 uppercase bg-[#3AB000]/10 px-2 py-0.5 rounded-sm">{selectedClaim.healthCardNumber || "N/A"}</dd></div>
                           <div className="flex justify-between items-center"><dt className="text-xs font-bold text-gray-500">Aadhaar:</dt><dd className="text-sm font-black text-gray-900 uppercase">{selectedClaim.aadhaarNumber || "N/A"}</dd></div>
                           <div className="flex justify-between items-center"><dt className="text-xs font-bold text-gray-500">PAN:</dt><dd className="text-sm font-black text-gray-900 uppercase">{selectedClaim.panNumber || "N/A"}</dd></div>
                           <div className="flex justify-between items-center"><dt className="text-xs font-bold text-gray-500">Phone:</dt><dd className="text-sm font-black text-gray-900 uppercase">{selectedClaim.mobileNumber || "N/A"}</dd></div>
                         </dl>
                       </div>
                       
                       <div>
                         <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4 flex items-center gap-2"><IndianRupee size={16} className="text-[#3AB000]"/> Bank & Financials</h3>
                         {selectedClaim.bankDetails ? (
                           <dl className="space-y-3 mb-6">
                             <div className="flex justify-between items-center"><dt className="text-xs font-bold text-gray-500">Bank Name:</dt><dd className="text-sm font-black text-gray-900 uppercase">{selectedClaim.bankDetails.bankName}</dd></div>
                             <div className="flex justify-between items-center"><dt className="text-xs font-bold text-gray-500">A/C No:</dt><dd className="text-sm font-black text-gray-900 uppercase bg-blue-50 text-blue-800 px-2 py-0.5">{selectedClaim.bankDetails.accountNumber}</dd></div>
                             <div className="flex justify-between items-center"><dt className="text-xs font-bold text-gray-500">IFSC:</dt><dd className="text-sm font-black text-gray-900 uppercase">{selectedClaim.bankDetails.ifscCode}</dd></div>
                           </dl>
                         ) : <p className="text-sm text-gray-400 italic mb-6">No bank details provided.</p>}
                         
                         <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 border border-gray-200 rounded-sm shadow-inner space-y-3">
                           <div className="flex justify-between items-center"><span className="text-xs font-black text-gray-500 uppercase tracking-widest">Requested Exp:</span><span className="text-lg font-black text-red-600">₹{selectedClaim.totalMedicalExpenses || 0}</span></div>
                           <div className="h-px bg-gray-200 w-full my-1"></div>
                           <div className="flex justify-between items-center"><span className="text-xs font-black text-gray-500 uppercase tracking-widest">Approved Amt:</span><span className="text-xl font-black text-green-700">₹{selectedClaim.approvedAmount || 0}</span></div>
                         </div>
                       </div>
                     </div>

                     {/* Right Column */}
                     <div className="lg:col-span-5 lg:border-l lg:border-gray-100 lg:pl-8">
                       <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">Tracking History</h3>
                       {selectedClaim.approvalHistory && selectedClaim.approvalHistory.length > 0 ? (
                         <div className="space-y-3 max-h-[500px] overflow-y-auto pr-3 styled-scrollbar">
                           {selectedClaim.approvalHistory.map((hist, idx) => (
                             <div key={idx} className="bg-gray-50 border border-gray-100 p-3.5 flex flex-col rounded-sm shadow-sm relative">
                               <div className="flex justify-between items-start mb-2">
                                 <span className={`text-[10px] font-black px-2 py-1 uppercase tracking-widest ${
                                   hist.role === 'CARDHOLDER' 
                                     ? 'text-green-700 bg-green-50 border border-green-200' 
                                     : hist.remark?.startsWith('DELETED BY ADMIN') || hist.status?.toLowerCase() === 'rejected'
                                       ? 'text-red-600 bg-red-50 border border-red-200'
                                       : 'text-blue-600 bg-blue-50 border border-blue-100'
                                 }`}>
                                   {hist.role === 'CARDHOLDER' 
                                     ? 'Resubmitted by Cardholder' 
                                     : hist.remark?.startsWith('DELETED BY ADMIN')
                                       ? 'DELETED BY ADMIN'
                                       : hist.status?.toLowerCase() === 'rejected'
                                         ? `Rejected by ${hist.role}`
                                         : `${hist.role} Level`}
                                 </span>
                                 <span className="text-[9px] font-bold text-gray-400 mt-1">{new Date(hist.date).toLocaleString()}</span>
                               </div>
                               <p className="text-xs font-bold text-gray-700 italic border-l-2 border-gray-200 pl-2 ml-1">"{hist.remark}"</p>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="flex items-center justify-center h-48 bg-gray-50 border border-gray-100 border-dashed">
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No history yet</p>
                         </div>
                       )}
                     </div>
                  </div>
                </div>
              )}

              {activeTab === "documents" && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                   {getDocKeys().map(key => {
                     const docValue = selectedClaim.documents[key];
                     
                     const renderDocumentCard = (url, label, uniqueKey) => {
                       if (!url || url === "null") return null;
                       const isPdf = url.endsWith('.pdf') || url.includes('.pdf');
                       return (
                         <div key={uniqueKey} className="relative border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-[#3AB000] transition-all group cursor-pointer rounded-sm overflow-hidden flex flex-col h-48" onClick={() => {
                           setSelectedEvidenceUrl(cleanImageUrl(url));
                           setEvidenceError(false);
                           setShowEvidenceModal(true);
                         }}>
                           <div className="flex-1 bg-gray-50 flex items-center justify-center overflow-hidden p-2 group-hover:bg-[#3AB000]/5 transition-colors">
                              {isPdf ? (
                                <div className="flex flex-col items-center justify-center gap-2 text-red-500">
                                  <FileText size={48} strokeWidth={1.5} />
                                  <span className="text-[10px] font-black text-red-600 uppercase tracking-widest bg-red-100 px-2 py-0.5 rounded-full">PDF Document</span>
                                </div>
                              ) : (
                                <img src={cleanImageUrl(url)} alt={label} className="w-full h-full object-contain filter group-hover:brightness-110 transition-all" />
                              )}
                           </div>
                           <div className="bg-white border-t border-gray-100 p-3 flex flex-col items-center justify-center">
                             <p className="text-[11px] font-black text-gray-800 uppercase tracking-wider truncate w-full text-center">{label}</p>
                             <p className="text-[9px] font-bold text-[#3AB000] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity mt-1">Click to view</p>
                           </div>
                         </div>
                       );
                     };

                     if (Array.isArray(docValue)) {
                       return docValue.map((url, index) => renderDocumentCard(url, `${key.replace(/([A-Z])/g, ' $1').trim()} ${index + 1}`, `${key}-${index}`));
                     }
                     return renderDocumentCard(docValue, key.replace(/([A-Z])/g, ' $1').trim(), key);
                   })}
                   {getDocKeys().length === 0 && (
                     <p className="text-xs text-gray-400 italic col-span-full text-center py-10">No documents found.</p>
                   )}
                </div>
              )}
            </div>

            {/* Footer Action Area */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">


               {/* STANDARD REVIEW ACTIONS */}
               <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 border border-gray-200 rounded-sm shadow-sm">
                  <div className="flex-1 w-full">
                    {canApprove(selectedClaim) ? (
                      <div className="relative">
                        {isBypassing(selectedClaim) && (
                           <div className="mb-2 flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-sm">
                             <AlertCircle size={14} />
                             <span className="text-[10px] font-black uppercase tracking-wide">
                               Note: This claim is currently pending at the {selectedClaim.currentStage} level. You are bypassing the hierarchy to approve it.
                             </span>
                           </div>
                        )}
                        <div className="relative">
                          <MessageSquare size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="text" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Type your verification remark here..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] outline-none font-bold text-sm text-gray-800 transition-all rounded-sm" />
                        </div>
                      </div>
                    ) : selectedClaim.status === 'pending' && !isAdmin && !canApprove(selectedClaim) ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-sm">
                        <AlertCircle size={16} />
                        <span className="text-xs font-bold uppercase tracking-wide">
                          This claim is currently pending approval at the {selectedClaim.currentStage} level.
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-end gap-3 w-full md:w-auto">
                    <button onClick={() => setShowReviewModal(false)} className="px-6 py-2.5 text-xs font-black text-gray-600 hover:text-black transition-colors uppercase tracking-widest border border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-sm">
                      Close Window
                    </button>
                    {canApprove(selectedClaim) && (
                      <>
                        <button onClick={() => handleAction("rejected")} disabled={updating} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 text-[11px] font-black px-6 py-2.5 rounded-sm transition-all uppercase tracking-widest shadow-sm">Reject</button>
                        <button onClick={() => handleAction("approved")} disabled={updating} className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-[11px] font-black px-6 py-2.5 rounded-sm transition-all uppercase tracking-widest shadow-sm flex items-center gap-2">
                          {updating ? <Loader2 size={14} className="animate-spin" /> : "Verify & Forward"}
                        </button>
                      </>
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Doc Preview Modal */}
      {showEvidenceModal && selectedEvidenceUrl && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
              <h3 className="text-xs font-black uppercase tracking-widest">Document Preview</h3>
              <button onClick={() => setShowEvidenceModal(false)}><X size={20}/></button>
            </div>
            <div className="flex-1 bg-gray-100 flex items-center justify-center p-4 overflow-auto">
              {selectedEvidenceUrl.toLowerCase().includes('.pdf') ? (
                <iframe src={selectedEvidenceUrl} className="w-full h-full border-none" />
              ) : (
                <img src={selectedEvidenceUrl} className="max-w-full max-h-full object-contain" alt="preview" />
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EmployeeClaims;
