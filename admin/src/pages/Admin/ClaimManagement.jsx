import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { claimsAPI, employeesAPI, locationAPI } from "../../utils/api";
import toast from "react-hot-toast";
import statesData from "../../data/states.json";
import districtsData from "../../data/district.json";
import {
  ShieldCheck, Search, Loader2, CheckCircle2, XCircle, FileText, RefreshCw, X, AlertCircle, IndianRupee, Check, CreditCard, Receipt, User, MapPin, Trash2
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";

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
    const cleanPath = url.startsWith("/") ? url.slice(1) : url;
    return `https://api.jssabhiyan.com/api/files/${cleanPath}`;
  }
  return url;
};

const getEnglishName = (str) => {
  if (!str) return "N/A";
  return str.split("/")[0].trim();
};

const ClaimManagement = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState("");
  const { role } = useAuth();

  const [selectedFilter, setSelectedFilter] = useState("ALL");

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [remark, setRemark] = useState("");
  const [activeTab, setActiveTab] = useState("details"); // 'details' | 'documents'

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [claimToDelete, setClaimToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");

  // Zone Filters
  const [zmState, setZmState] = useState("all");
  const [zmDistrict, setZmDistrict] = useState("all");
  const [zmBlock, setZmBlock] = useState("all");
  const [zmPanchayat, setZmPanchayat] = useState("all");

  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [availablePanchayats, setAvailablePanchayats] = useState([]);

  useEffect(() => {
    if (zmState !== "all") {
      const selectedStateKey = statesData.find(s => s === zmState) || zmState;
      setAvailableDistricts(districtsData[selectedStateKey] || []);
    } else {
      setAvailableDistricts([]);
    }
  }, [zmState]);

  useEffect(() => {
    const fetchBlocks = async () => {
      if (zmDistrict !== "all") {
        try {
          const cleanState = zmState.split('/')[0].trim();
          const cleanDistrict = zmDistrict.split('/')[0].trim();
          const res = await locationAPI.getBlocks({ state: cleanState, district: cleanDistrict, all: true });
          if (Array.isArray(res)) setAvailableBlocks(res);
          else if (res && res.data) setAvailableBlocks(res.data);
        } catch (err) {
          console.error("Failed to load blocks:", err);
        }
      } else {
        setAvailableBlocks([]);
      }
    };
    fetchBlocks();
  }, [zmDistrict, zmState]);

  useEffect(() => {
    const fetchPanchayats = async () => {
      if (zmBlock !== "all") {
        try {
          const selectedBlock = availableBlocks.find(b => {
            const bName = b.nameHi ? `${b.name} / ${b.nameHi}` : b.name;
            return bName === zmBlock;
          });
          
          let res;
          if (selectedBlock && selectedBlock._id) {
             res = await locationAPI.getPanchayats({ blockId: selectedBlock._id, all: true });
          } else {
             const cleanState = zmState.split('/')[0].trim();
             const cleanDistrict = zmDistrict.split('/')[0].trim();
             const cleanBlock = zmBlock.split('/')[0].trim();
             res = await locationAPI.getPanchayats({ state: cleanState, district: cleanDistrict, search: cleanBlock, all: true });
          }
          
          if (Array.isArray(res)) setAvailablePanchayats(res);
          else if (res && res.data) setAvailablePanchayats(res.data);
        } catch (err) {
          console.error("Failed to load panchayats:", err);
        }
      } else {
        setAvailablePanchayats([]);
      }
    };
    fetchPanchayats();
  }, [zmBlock, availableBlocks, zmState, zmDistrict]);

  const handleZmFilterChange = (field, value) => {
    if (field === "zmState") {
      setZmState(value);
      setZmDistrict("all");
      setZmBlock("all");
      setZmPanchayat("all");
    }
    if (field === "zmDistrict") {
      setZmDistrict(value);
      setZmBlock("all");
      setZmPanchayat("all");
    }
    if (field === "zmBlock") {
      setZmBlock(value);
      setZmPanchayat("all");
    }
    if (field === "zmPanchayat") setZmPanchayat(value);
    setCurrentPage(1);
  };

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [hierarchyData, setHierarchyData] = useState(null);

  useEffect(() => {
    if (showReviewModal && selectedClaim) {
      const fetchHierarchy = async () => {
        try {
          const stateRaw = selectedClaim.card?.state || "Unknown";
          const districtRaw = selectedClaim.card?.district || "Unknown";
          const state = getEnglishName(stateRaw);
          const district = getEnglishName(districtRaw);
          
          if (state !== "N/A" && state !== "Unknown" && district !== "N/A" && district !== "Unknown") {
            const res = await employeesAPI.getLocationOfficers(state, district);
            if (res.success) setHierarchyData(res.data);
          } else {
             setHierarchyData(null);
          }
        } catch (e) {
          console.error("Hierarchy fetch error", e);
        }
      };
      fetchHierarchy();
    } else {
      setHierarchyData(null);
    }
  }, [showReviewModal, selectedClaim]);

  const [approvedAmountInput, setApprovedAmountInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("manual"); // 'manual' | 'razorpay'
  const [adminStep, setAdminStep] = useState(1); // 1: Review, 2: Approve Amount, 3: Pay Claim
  const [paymentSlipFile, setPaymentSlipFile] = useState(null);

  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState("");
  const [evidenceError, setEvidenceError] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit, search, filter: selectedFilter };
      if (zmState !== "all") params.state = zmState;
      if (zmDistrict !== "all") params.district = zmDistrict;
      if (zmBlock !== "all") params.block = zmBlock;
      if (zmPanchayat !== "all") params.panchayat = zmPanchayat;

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
  }, [currentPage, search, selectedFilter, zmState, zmDistrict, zmBlock, zmPanchayat]);

  const openReviewModal = (claim) => {
    setSelectedClaim(claim);
    setRemark("");
    setPaymentSlipFile(null);
    setApprovedAmountInput(claim.approvedAmount ? claim.approvedAmount.toString() : "");
    setAdminStep(1); // Reset to first step
    setActiveTab("details");
    setShowReviewModal(true);
  };

  const handleApproveAmount = async () => {
    if (!approvedAmountInput || isNaN(approvedAmountInput) || Number(approvedAmountInput) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    try {
      setUpdating(true);
      const res = await claimsAPI.approveAmount(selectedClaim._id, Number(approvedAmountInput));
      if (res.success) {
        toast.success("Amount approved successfully!");
        setSelectedClaim(res.data);
        fetchClaims();
      }
    } catch (err) {
      toast.error(err.message || "Failed to approve amount");
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectClaimClick = () => {
    setRejectReason("");
    setShowRejectModal(true);
  };

  const confirmRejectClaim = async () => {
    if (!rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    
    try {
      setUpdating(true);
      const res = await claimsAPI.updateStatus(selectedClaim._id, 'rejected', rejectReason);
      if (res.success) {
        toast.success("Claim rejected successfully!");
        setShowRejectModal(false);
        setShowReviewModal(false);
        fetchClaims();
      }
    } catch (err) {
      toast.error(err.message || "Failed to reject claim");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClaim = async () => {
    if (!deleteReason.trim()) {
      toast.error("Please provide a reason for deleting this claim.");
      return;
    }
    try {
      setUpdating(true);
      const res = await claimsAPI.deleteClaim(claimToDelete._id, deleteReason);
      if (res.success) {
        toast.success("Claim deleted successfully");
        setShowDeleteModal(false);
        setClaimToDelete(null);
        setDeleteReason("");
        fetchClaims();
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete claim");
    } finally {
      setUpdating(false);
    }
  };

  const handleProcessPayment = async () => {
    try {
      setUpdating(true);
      
      let payload;
      if (paymentMethod === 'manual' && paymentSlipFile) {
        payload = new FormData();
        payload.append('method', paymentMethod);
        payload.append('adminRemark', remark || `Processed via ${paymentMethod}`);
        payload.append('paymentProof', paymentSlipFile);
      } else {
        payload = {
          method: paymentMethod,
          adminRemark: remark || `Processed via ${paymentMethod}`
        };
      }

      const res = await claimsAPI.pay(selectedClaim._id, payload);
      if (res.success) {
        toast.success("Payment processed successfully!");
        setShowConfirmModal(false);
        setShowReviewModal(false);
        fetchClaims();
      }
    } catch (err) {
      toast.error(err.message || "Payment failed");
    } finally {
      setUpdating(false);
    }
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
              Medical Claim Payouts (Admin)
            </h1>
            <button onClick={fetchClaims} className="bg-black hover:bg-gray-800 text-white text-xs sm:text-sm px-5 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-gray-100 pt-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search Name, Phone, Health Card..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm font-bold text-gray-800"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="w-full sm:w-auto flex-shrink-0">
              <select
                value={selectedFilter}
                onChange={(e) => {
                  setSelectedFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm font-black text-gray-700 bg-gray-50 uppercase tracking-widest cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <option value="ALL">All Claims</option>
                <option value="PENDING_DM">Pending with DM</option>
                <option value="PENDING_RM">Pending with RM</option>
                <option value="PENDING_ZC">Pending with ZC</option>
                <option value="PENDING_PAY">Payment Pending</option>
                <option value="PAID">Paid (Completed)</option>
                <option value="REJECTED">Rejected</option>
                <option value="REPEATED">Repeated Claims</option>
              </select>
            </div>
          </div>
          
          {/* Location Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-gray-100 pt-4">
            {/* State */}
            <select
              value={zmState}
              onChange={(e) => handleZmFilterChange("zmState", e.target.value)}
              className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
            >
              <option value="all">All States</option>
              {statesData.map((st, i) => (
                <option key={i} value={st}>{st}</option>
              ))}
            </select>

            {/* District */}
            <select
              value={zmDistrict}
              disabled={zmState === "all"}
              onChange={(e) => handleZmFilterChange("zmDistrict", e.target.value)}
              className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="all">All Districts</option>
              {zmState !== "all" && availableDistricts.map((dist, i) => (
                <option key={i} value={dist}>{dist}</option>
              ))}
            </select>

            {/* Block */}
            <select
              value={zmBlock}
              disabled={zmDistrict === "all"}
              onChange={(e) => handleZmFilterChange("zmBlock", e.target.value)}
              className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="all">All Blocks</option>
              {zmDistrict !== "all" && availableBlocks.map((b) => {
                const bName = b.nameHi ? `${b.name} / ${b.nameHi}` : b.name;
                return <option key={b._id || bName} value={bName}>{bName}</option>;
              })}
            </select>

            {/* Panchayat */}
            <select
              value={zmPanchayat}
              disabled={zmBlock === "all"}
              onChange={(e) => handleZmFilterChange("zmPanchayat", e.target.value)}
              className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="all">All Panchayats</option>
              {zmBlock !== "all" && availablePanchayats.map((p) => {
                const pName = p.nameHi ? `${p.name} / ${p.nameHi}` : p.name;
                return <option key={p._id || pName} value={pName}>{pName}</option>;
              })}
            </select>
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
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-center">Payment</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse"><td colSpan="5" className="px-6 py-8"><div className="h-4 bg-gray-100 rounded w-full"></div></td></tr>
                  ))
                ) : filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <AlertCircle size={48} className="text-gray-200 mx-auto mb-4" />
                      <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No claims found</p>
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
                          <span className="text-red-700 text-[10px] font-black uppercase tracking-widest bg-red-100 px-2.5 py-1 border border-red-200 line-through">Deleted</span>
                        ) : claim.payoutStatus === 'paid' ? (
                          <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest bg-blue-50 px-2.5 py-1 border border-blue-200">COMPLETED</span>
                        ) : claim.status === 'pending' ? (
                          claim.currentStage === 'ADMIN' ? (
                            <span className="text-amber-600 text-[10px] font-black uppercase tracking-widest bg-amber-50 px-2.5 py-1 border border-amber-200">PENDING PAY</span>
                          ) : (
                            <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest bg-gray-50 px-2.5 py-1 border border-gray-200">Processing at {claim.currentStage}</span>
                          )
                        ) : claim.status === 'approved' ? (
                          <span className="text-green-600 text-[10px] font-black uppercase tracking-widest bg-green-50 px-2.5 py-1 border border-green-100">Approved</span>
                        ) : (
                          <span className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-50 px-2.5 py-1 border border-red-100">Rejected</span>
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
                        <div className="flex justify-end gap-2">
                          {claim.isDeleted ? (
                             <button onClick={() => openReviewModal(claim)} className="w-full lg:w-auto px-5 py-2.5 bg-gray-900 text-white hover:bg-black transition-all font-black text-[10px] uppercase tracking-widest whitespace-nowrap shadow-sm flex items-center justify-center gap-2 rounded-sm">
                               View Form <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                             </button>
                          ) : claim.payoutStatus !== 'paid' && claim.status !== 'rejected' && (role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin' || role?.toLowerCase() === 'staff') ? (
                            <button onClick={() => openReviewModal(claim)} className="w-full lg:w-auto px-5 py-2.5 bg-[#3AB000] text-white hover:bg-[#2d8a00] transition-all font-black text-[10px] uppercase tracking-widest whitespace-nowrap shadow-sm flex items-center justify-center gap-2 rounded-sm">
                              Review & Pay <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            </button>
                          ) : (
                            <button onClick={() => openReviewModal(claim)} className="w-full lg:w-auto px-5 py-2.5 bg-gray-900 text-white hover:bg-black transition-all font-black text-[10px] uppercase tracking-widest whitespace-nowrap shadow-sm flex items-center justify-center gap-2 rounded-sm">
                              View Form <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                          )}

                          {!claim.isDeleted && (role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin' || role?.toLowerCase() === 'staff') && (
                            <button
                              onClick={() => {
                                setClaimToDelete(claim);
                                setShowDeleteModal(true);
                              }}
                              className="px-3 py-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all font-black rounded-sm border border-red-100 hover:border-red-600"
                              title="Delete Claim"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
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
                      className={`w-8 h-8 flex items-center justify-center border font-bold text-xs rounded-sm transition-colors ${currentPage === pageNumber
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

      {showDeleteModal && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className="bg-white max-w-md w-full rounded-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-red-50">
              <h3 className="text-red-600 font-black text-sm uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={18} />
                Delete Claim
              </h3>
              <button onClick={() => { setShowDeleteModal(false); setDeleteReason(""); }} className="text-red-400 hover:text-red-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-xs font-bold text-gray-600 mb-4 uppercase tracking-wider">
                Are you sure you want to delete this claim? This action will mark the claim as deleted for both employees and the cardholder.
              </p>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Reason for Deletion <span className="text-red-500">*</span></label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="E.g., Duplicate entry, Invalid format, Requested by user..."
                  className="w-full p-3 border border-gray-300 rounded-sm focus:outline-none focus:border-red-500 text-sm resize-none h-24"
                ></textarea>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50">
              <button 
                onClick={() => { setShowDeleteModal(false); setDeleteReason(""); }}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-black text-[10px] uppercase tracking-widest rounded-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteClaim}
                disabled={!deleteReason.trim() || updating}
                className="px-5 py-2.5 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 rounded-sm"
              >
                {updating ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

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

            {/* Stepper Header (Only for Admin Processing) */}
            {selectedClaim.payoutStatus !== 'paid' && selectedClaim.status !== 'rejected' && (role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin' || role?.toLowerCase() === 'staff') && (
              <div className="px-6 py-5 bg-white border-b border-gray-200 shadow-sm flex items-center justify-center">
                <div className="flex items-center w-full max-w-4xl">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3AB000] text-white text-xs font-black shadow-md">1</div>
                    <div className={`text-[11px] font-black uppercase tracking-widest ${adminStep >= 1 ? 'text-[#3AB000]' : 'text-gray-400'}`}>Review Details</div>
                  </div>
                  
                  <div className={`flex-1 h-[2px] mx-4 ${adminStep >= 2 ? 'bg-[#3AB000]' : 'bg-gray-200'}`}></div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black shadow-md ${adminStep >= 2 ? 'bg-[#3AB000] text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>2</div>
                    <div className={`text-[11px] font-black uppercase tracking-widest ${adminStep >= 2 ? 'text-[#3AB000]' : 'text-gray-400'}`}>Approved Amount</div>
                  </div>
                  
                  <div className={`flex-1 h-[2px] mx-4 ${adminStep >= 3 ? 'bg-[#3AB000]' : 'bg-gray-200'}`}></div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-black shadow-md ${adminStep >= 3 ? 'bg-[#3AB000] text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>3</div>
                    <div className={`text-[11px] font-black uppercase tracking-widest ${adminStep >= 3 ? 'text-[#3AB000]' : 'text-gray-400'}`}>Pay Claim</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs (Only in Step 1 or if Stepper is hidden) */}
            {(!(selectedClaim.payoutStatus !== 'paid' && selectedClaim.status !== 'rejected' && (role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin' || role?.toLowerCase() === 'staff')) || adminStep === 1) && (
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-center gap-4 shadow-inner">
                <button onClick={() => setActiveTab("details")} className={`px-8 py-2.5 text-xs font-black uppercase tracking-widest rounded-full transition-all ${activeTab === "details" ? "bg-[#3AB000] text-white shadow-md" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-800"}`}>
                  Form Details
                </button>
                <button onClick={() => setActiveTab("documents")} className={`px-8 py-2.5 text-xs font-black uppercase tracking-widest rounded-full transition-all ${activeTab === "documents" ? "bg-[#3AB000] text-white shadow-md" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-800"}`}>
                  Documents ({getDocKeys().length})
                </button>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6">

              {/* Step 1 Content (Or Default View) */}
              {(!(selectedClaim.payoutStatus !== 'paid' && selectedClaim.status !== 'rejected' && (role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin' || role?.toLowerCase() === 'staff')) || adminStep === 1) && (
                <div className="bg-white p-6 shadow-sm rounded-sm border border-gray-100">
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
                          <p className="text-[9px] font-black text-blue-600 uppercase mb-2">{new Date(selectedClaim.payoutDate || selectedClaim.updatedAt).toLocaleString()}</p>
                          {selectedClaim.paymentSlipUrl && (
                            <button 
                              onClick={() => {
                                setSelectedEvidenceUrl(cleanImageUrl(selectedClaim.paymentSlipUrl));
                                setEvidenceError(false);
                                setShowEvidenceModal(true);
                              }}
                              className="text-[10px] font-black bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1.5 rounded-sm transition-colors flex items-center justify-end gap-2 ml-auto uppercase tracking-widest"
                            >
                              <FileText size={12} /> View Payment Slip
                            </button>
                          )}
                        </div>
                      </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                    {/* Left Column */}
                    <div className="lg:col-span-7 flex flex-col gap-8">
                      <div>
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4 flex items-center gap-2"><User size={16} className="text-[#3AB000]" /> Personal Details</h3>
                        <dl className="space-y-3">
                          <div className="flex justify-between items-center"><dt className="text-xs font-bold text-gray-500">Name:</dt><dd className="text-sm font-black text-gray-900 uppercase">{selectedClaim.cardHolderName || selectedClaim.title}</dd></div>
                          <div className="flex justify-between items-center"><dt className="text-xs font-bold text-gray-500">Relation:</dt><dd className="text-sm font-black text-gray-900 uppercase">{selectedClaim.relation || "N/A"}</dd></div>
                          <div className="flex justify-between items-center"><dt className="text-xs font-bold text-gray-500">Health Card:</dt><dd className="text-sm font-black text-gray-900 uppercase bg-[#3AB000]/10 px-2 py-0.5 rounded-sm">{selectedClaim.healthCardNumber || "N/A"}</dd></div>
                          <div className="flex justify-between items-center"><dt className="text-xs font-bold text-gray-500">Aadhaar:</dt><dd className="text-sm font-black text-gray-900 uppercase">{selectedClaim.aadhaarNumber || "N/A"}</dd></div>
                          <div className="flex justify-between items-center"><dt className="text-xs font-bold text-gray-500">PAN:</dt><dd className="text-sm font-black text-gray-900 uppercase">{selectedClaim.panNumber || "N/A"}</dd></div>
                          <div className="flex justify-between items-center"><dt className="text-xs font-bold text-gray-500">Phone:</dt><dd className="text-sm font-black text-gray-900 uppercase">{selectedClaim.mobileNumber || "N/A"}</dd></div>
                        </dl>

                        {(role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin' || role?.toLowerCase() === 'staff') && (
                          <div className="mt-5 p-3 bg-red-50 border border-red-200 rounded-sm shadow-inner">
                            <h4 className="text-[10px] font-black text-red-800 uppercase tracking-widest mb-2 flex items-center gap-1"><AlertCircle size={12} /> Cardholder Login Credentials</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-gray-600">Email/Phone:</span><span className="text-xs font-black text-gray-900 lowercase">{selectedClaim.email || selectedClaim.userId?.email || selectedClaim.userId?.phone || "N/A"}</span></div>
                              <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-gray-600">Password (DOB):</span><span className="text-xs font-black text-gray-900 bg-white px-1.5 py-0.5 border border-gray-200">{selectedClaim.card?.dob ? new Date(selectedClaim.card.dob).toLocaleDateString('en-GB').replace(/\//g, '') : "N/A"}</span></div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4 flex items-center gap-2"><MapPin size={16} className="text-[#3AB000]" /> Geographic & Hierarchy Details</h3>
                        <div className="bg-white border border-gray-200 rounded-sm shadow-sm mb-8">
                          <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cardholder Zone</span>
                            <span className="text-xs font-black text-[#3AB000] uppercase">{getEnglishName(selectedClaim.card?.district)}, {getEnglishName(selectedClaim.card?.state)}</span>
                          </div>
                          
                          <div className="p-4 space-y-4">
                            {!hierarchyData ? (
                               <div className="flex items-center justify-center py-4">
                                  <Loader2 size={20} className="text-[#3AB000] animate-spin" />
                               </div>
                            ) : (
                              <>
                                {/* DM Row */}
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 shrink-0 bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-black text-xs">DM</div>
                                  <div className="flex-1">
                                    <h4 className="text-xs font-black text-gray-900 uppercase">{hierarchyData.DM ? hierarchyData.DM.name : "-- Vacant / Not Assigned --"}</h4>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">District Manager</p>
                                    {hierarchyData.DM && <p className="text-[10px] font-bold text-[#3AB000] mt-0.5">{hierarchyData.DM.userId?.phone} • {hierarchyData.DM.userId?.email}</p>}
                                  </div>
                                </div>
                                <div className="ml-4 w-px h-4 bg-gray-200"></div>

                                {/* ZC Row */}
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 shrink-0 bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-black text-xs">ZC</div>
                                  <div className="flex-1">
                                    <h4 className="text-xs font-black text-gray-900 uppercase">{hierarchyData.ZC ? hierarchyData.ZC.name : "-- Vacant / Not Assigned --"}</h4>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Zonal Coordinator</p>
                                    {hierarchyData.ZC && <p className="text-[10px] font-bold text-[#3AB000] mt-0.5">{hierarchyData.ZC.userId?.phone} • {hierarchyData.ZC.userId?.email}</p>}
                                  </div>
                                </div>
                                <div className="ml-4 w-px h-4 bg-gray-200"></div>

                                {/* RM Row */}
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 shrink-0 bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-black text-xs">RM</div>
                                  <div className="flex-1">
                                    <h4 className="text-xs font-black text-gray-900 uppercase">{hierarchyData.RM ? hierarchyData.RM.name : "-- Vacant / Not Assigned --"}</h4>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Regional Manager</p>
                                    {hierarchyData.RM && <p className="text-[10px] font-bold text-[#3AB000] mt-0.5">{hierarchyData.RM.userId?.phone} • {hierarchyData.RM.userId?.email}</p>}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4 flex items-center gap-2"><IndianRupee size={16} className="text-[#3AB000]" /> Bank & Financials</h3>
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
                                <span className={`text-[10px] font-black px-2 py-1 uppercase tracking-widest ${hist.role === 'CARDHOLDER'
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
              )}

              {/* Step 2 Content: Approved Amount */}
              {selectedClaim.payoutStatus !== 'paid' && selectedClaim.status !== 'rejected' && (role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin' || role?.toLowerCase() === 'staff') && adminStep === 2 && (
                <div className="bg-white p-10 shadow-sm rounded-sm border border-gray-100 flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div className="w-full max-w-lg space-y-8">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-[#3AB000]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#3AB000]">
                        <IndianRupee size={32} />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Final Approved Amount</h3>
                      <p className="text-xs font-bold text-gray-500">Requested Amount: <span className="text-red-600 font-black">₹{selectedClaim.totalMedicalExpenses || 0}</span></p>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-700 uppercase tracking-widest text-center block">Enter Amount to Approve (₹)</label>
                      <input 
                        type="number" 
                        value={approvedAmountInput} 
                        onChange={(e) => setApprovedAmountInput(e.target.value)} 
                        className="w-full px-6 py-4 text-center text-3xl border-2 border-gray-300 focus:border-[#3AB000] outline-none font-black text-[#3AB000] rounded-md transition-colors" 
                        placeholder="0" 
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 Content: Payment Method */}
              {selectedClaim.payoutStatus !== 'paid' && selectedClaim.status !== 'rejected' && (role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin' || role?.toLowerCase() === 'staff') && adminStep === 3 && (
                <div className="bg-white p-10 shadow-sm rounded-sm border border-gray-100 flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div className="w-full flex flex-col md:flex-row gap-8 items-start justify-center max-w-4xl mx-auto">
                    <div className="flex-1 w-full space-y-4">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block text-center">Select Payment Method</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setPaymentMethod('manual')} className={`flex flex-col items-center justify-center p-6 gap-3 rounded-md border-2 transition-all ${paymentMethod === 'manual' ? 'border-[#3AB000] bg-[#3AB000]/5 text-[#3AB000]' : 'border-gray-200 bg-white text-gray-500 hover:border-[#3AB000]/50'}`}>
                          <Receipt size={32} />
                          <span className="text-xs font-black uppercase tracking-widest text-center">Manual Entry / Bank Transfer</span>
                        </button>
                        <button onClick={() => setPaymentMethod('razorpay')} className={`flex flex-col items-center justify-center p-6 gap-3 rounded-md border-2 transition-all ${paymentMethod === 'razorpay' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500 hover:border-blue-600/50'}`}>
                          <CreditCard size={32} />
                          <span className="text-xs font-black uppercase tracking-widest text-center">Razorpay Gateway</span>
                        </button>
                      </div>
                      <div className="text-center mt-4">
                         <p className="text-xs font-bold text-gray-500">Approved Amount to Pay: <span className="text-[#3AB000] font-black text-lg">₹{approvedAmountInput || selectedClaim.approvedAmount}</span></p>
                      </div>
                    </div>

                    <div className="w-full md:w-[350px] bg-white p-5 border border-gray-200 shadow-sm rounded-sm space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Remark / Note (Optional)</label>
                        <textarea 
                          value={remark} 
                          onChange={(e) => setRemark(e.target.value)} 
                          className="w-full px-3 py-2 border border-gray-300 focus:border-[#3AB000] outline-none text-sm min-h-[80px]" 
                          placeholder={paymentMethod === 'manual' ? "Transaction ID, Reference Number, etc." : "Any remarks..."}
                        ></textarea>
                      </div>
                      
                      {paymentMethod === 'manual' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Upload Payment Proof</label>
                          <div className="relative border-2 border-dashed border-gray-300 hover:border-[#3AB000] bg-gray-50 rounded-sm p-4 text-center cursor-pointer transition-colors">
                            <input 
                              type="file" 
                              accept="image/*,.pdf" 
                              onChange={(e) => setPaymentSlipFile(e.target.files[0])} 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            />
                            {paymentSlipFile ? (
                              <div className="flex flex-col items-center gap-1">
                                <CheckCircle2 size={24} className="text-[#3AB000]" />
                                <span className="text-xs font-bold text-gray-700 truncate w-full px-2">{paymentSlipFile.name}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-gray-500">
                                <FileText size={24} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Click to upload slip</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Action Area */}
            <div className="px-6 py-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              {/* ADMIN PAYOUT SECTION (STEPPER UI) */}
              {selectedClaim.payoutStatus !== 'paid' && selectedClaim.status !== 'rejected' && (role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'superadmin' || role?.toLowerCase() === 'staff') ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    {adminStep > 1 && (
                      <button onClick={() => setAdminStep(adminStep - 1)} className="px-6 py-3 border border-gray-300 bg-white text-gray-600 text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors rounded-sm shadow-sm">
                        Back
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowReviewModal(false)} className="px-6 py-3 text-[11px] font-black text-gray-500 hover:text-black transition-colors uppercase tracking-widest">
                      Cancel
                    </button>

                    {adminStep === 1 && (
                      <>
                        <button onClick={handleRejectClaimClick} disabled={updating} className="px-6 py-3 border border-red-200 bg-red-50 text-red-600 text-[11px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors rounded-sm shadow-sm flex items-center gap-2">
                          {updating ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Reject Claim
                        </button>
                        <button onClick={() => setAdminStep(2)} className="px-8 py-3 bg-[#3AB000] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#2d8a00] transition-colors rounded-sm shadow-md flex items-center gap-2">
                          Proceed to Approve Amount <Check size={14} />
                        </button>
                      </>
                    )}

                    {adminStep === 2 && (
                      <button 
                        onClick={async () => {
                          await handleApproveAmount();
                          if (Number(approvedAmountInput) > 0) setAdminStep(3);
                        }} 
                        disabled={updating || !approvedAmountInput} 
                        className="px-8 py-3 bg-[#3AB000] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#2d8a00] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors rounded-sm shadow-md flex items-center gap-2"
                      >
                        {updating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Amount & Next
                      </button>
                    )}

                    {adminStep === 3 && (
                      <button onClick={() => setShowConfirmModal(true)} disabled={updating} className="px-10 py-3 bg-[#0A3D00] hover:bg-black text-white text-[12px] font-black uppercase tracking-widest shadow-lg transition-all rounded-sm flex items-center gap-2">
                        {updating ? <Loader2 size={16} className="animate-spin" /> : <Receipt size={16} />} PAY NOW (₹{approvedAmountInput || selectedClaim.approvedAmount})
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end w-full">
                  <button onClick={() => setShowReviewModal(false)} className="px-6 py-2.5 text-xs font-black text-gray-600 hover:text-black transition-colors uppercase tracking-widest border border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-sm">
                    Close Window
                  </button>
                </div>
              )}
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
              <button onClick={() => setShowEvidenceModal(false)}><X size={20} /></button>
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[30000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-md shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full"><AlertCircle className="text-blue-600 w-6 h-6" /></div>
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Confirm Payment</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Final Action</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 font-bold mb-1 text-center">Are you sure you want to process this payment?</p>
              <p className="text-xs text-gray-500 text-center mb-6">Payment Method: <span className="font-black text-blue-600 uppercase">{paymentMethod}</span></p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs uppercase tracking-widest rounded-sm transition-colors border border-gray-300">
                  Cancel
                </button>
                <button onClick={handleProcessPayment} disabled={updating} className="flex-1 px-4 py-2.5 bg-black hover:bg-gray-800 text-white font-black text-xs uppercase tracking-widest rounded-sm transition-colors flex items-center justify-center gap-2">
                  {updating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Process
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[30000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-md shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full"><XCircle className="text-red-600 w-6 h-6" /></div>
              <div>
                <h3 className="text-sm font-black text-red-900 uppercase tracking-widest">Reject Claim</h3>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Please provide a reason</p>
              </div>
            </div>
            <div className="p-6">
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-widest">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter detailed reason for rejection..."
                className="w-full border border-gray-300 rounded-sm p-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none h-24 mb-6"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs uppercase tracking-widest rounded-sm transition-colors border border-gray-300">
                  Cancel
                </button>
                <button onClick={confirmRejectClaim} disabled={updating || !rejectReason.trim()} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-black text-xs uppercase tracking-widest rounded-sm transition-colors flex items-center justify-center gap-2">
                  {updating ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Reject Claim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ClaimManagement;
