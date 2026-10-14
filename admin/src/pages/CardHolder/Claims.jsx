import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { claimsAPI } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  History, Search, Loader2, CheckCircle2, XCircle, FileText, RefreshCw, X, AlertCircle, IndianRupee, User, Plus, ArrowRight, Clock, Download
} from "lucide-react";
import claimFormPdf from "../../assets/form/Claim_Form.pdf";

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

const Claims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [activeTab, setActiveTab] = useState("details"); // 'details' | 'documents'
  const [pageTab, setPageTab] = useState("instructions"); // 'instructions' | 'my_claims'

  // Evidence Modal State
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState("");
  const [evidenceError, setEvidenceError] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Cooldown Modal State
  const [showCooldownModal, setShowCooldownModal] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState({ title: "", en: "", hi: "" });

  const handleNewRequest = () => {
    // The 3-month cooldown check is now performed at the card level inside NewClaim.jsx
    navigate('/claims/new');
  };

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await claimsAPI.getMyClaims({ page: currentPage, limit, search });
      if (res.success) {
        setClaims(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
        }
      }
    } catch (err) {
      toast.error("Failed to load your claims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClaims();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, search]);

  const openReviewModal = (claim) => {
    setSelectedClaim(claim);
    setActiveTab("details");
    setShowReviewModal(true);
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
              <History className="w-6 h-6 text-[#3AB000]" />
              Claims Dashboard
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <a href={claimFormPdf} download="JSSA_Claim_Form.pdf" className="border border-[#3AB000] text-[#3AB000] bg-white hover:bg-[#3AB000]/10 text-xs sm:text-sm px-4 h-10 font-black rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide">
                <Download className="w-4 h-4" /> Download Form
              </a>
              <button onClick={fetchClaims} className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs sm:text-sm px-4 h-10 font-black rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide border border-gray-200">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
              <button onClick={handleNewRequest} className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs sm:text-sm px-5 h-10 font-black rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide">
                <Plus className="w-4 h-4" /> New Request
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => setPageTab("instructions")}
              className={`px-6 md:px-8 py-3 text-xs md:text-[13px] font-black uppercase tracking-widest rounded-none transition-all flex items-center justify-center gap-2 border ${pageTab === "instructions" ? "bg-[#3AB000] text-white border-[#3AB000] shadow-sm shadow-[#3AB000]/20" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-800"}`}
            >
              <AlertCircle size={18} />
              How to Claim / क्लेम कैसे करें
            </button>
            <button
              onClick={() => setPageTab("my_claims")}
              className={`px-6 md:px-8 py-3 text-xs md:text-[13px] font-black uppercase tracking-widest rounded-none transition-all flex items-center justify-center gap-2 border ${pageTab === "my_claims" ? "bg-[#3AB000] text-white border-[#3AB000] shadow-sm shadow-[#3AB000]/20" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-800"}`}
            >
              <History size={18} />
              My Claims
            </button>
          </div>

          {pageTab === "my_claims" && (
            <div className="relative flex-1 w-full pt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mt-2" size={16} />
              <input
                type="text"
                placeholder="Search Name or Health Card..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm font-bold text-gray-800"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>

        {pageTab === "instructions" ? (
          /* --- Instruction Card --- */
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm mt-4 overflow-hidden">
            {/* Header */}
            <div className="bg-[#3AB000]/10 px-4 md:px-6 py-3.5 border-b border-[#3AB000]/20 flex items-center gap-2">
              <AlertCircle className="text-[#3AB000] w-5 h-5 flex-shrink-0" />
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                How to Claim & Approval Process <span className="text-gray-500 font-bold normal-case text-xs">/ क्लेम कैसे करें और स्वीकृति प्रक्रिया</span>
              </h2>
            </div>

            {/* 3 Parts Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 bg-gray-50/30">
              {/* Steps */}
              <div className="p-4 md:p-6">
                <h3 className="text-xs md:text-sm font-black text-[#3AB000] uppercase tracking-widest mb-4 border-b border-[#3AB000]/20 pb-2">Part 1: Application Steps / क्लेम प्रक्रिया</h3>
                <ol className="list-decimal list-outside ml-5 space-y-4 text-sm md:text-[15px] text-gray-700 font-bold leading-relaxed">
                  <li><span className="text-gray-900">Download the claim form.</span> <br /><span className="text-gray-500 font-medium text-sm">(क्लेम फॉर्म डाउनलोड करें।)</span></li>
                  <li><span className="text-gray-900">Manually fill out the downloaded form, as you will need to upload it during the request.</span> <br /><span className="text-gray-500 font-medium text-sm">(डाउनलोड किए गए फॉर्म को मैन्युअल रूप से भरें, क्योंकि नई रिक्वेस्ट भरते समय इसे अपलोड करना होगा।)</span></li>
                  <li><span className="text-gray-900 leading-normal block">Click on <span className="bg-[#3AB000] text-white px-2 py-0.5 rounded-sm text-[11px] uppercase inline-block mx-1">New Request</span> and select your Health Card.</span> <span className="text-gray-500 font-medium text-sm">("NEW REQUEST" पर क्लिक करें और अपना हेल्थ कार्ड चुनें।)</span></li>
                  <li><span className="text-gray-900">Enter all details and upload the required documents.</span> <br /><span className="text-gray-500 font-medium text-sm">(सभी आवश्यक जानकारी भरें और ज़रूरी दस्तावेज़ अपलोड करें।)</span></li>
                  <li><span className="text-gray-900">Verify your details and submit the application.</span> <br /><span className="text-gray-500 font-medium text-sm">(सभी जानकारियों को चेक करें और फॉर्म सबमिट कर दें।)</span></li>
                </ol>
              </div>

              {/* Approval Track */}
              <div className="p-4 md:p-6">
                <h3 className="text-xs md:text-sm font-black text-[#3AB000] uppercase tracking-widest mb-4 border-b border-[#3AB000]/20 pb-2">Part 2: After Submission / सबमिट करने के बाद</h3>
                <ol className="list-decimal list-outside ml-5 space-y-4 text-sm md:text-[15px] text-gray-700 font-bold leading-relaxed">
                  <li><span className="text-gray-900">Your request will first be reviewed by the <b>DM</b>.</span> <br /><span className="text-gray-500 font-medium text-sm">(आपकी रिक्वेस्ट सबसे पहले DM द्वारा जांची जाएगी।)</span></li>
                  <li><span className="text-gray-900">Once approved, it moves to the <b>ZC</b> or <b>RM</b>.</span> <br /><span className="text-gray-500 font-medium text-sm">(DM की स्वीकृति के बाद, यह ZC या RM के पास जाएगी।)</span></li>
                  <li><span className="text-gray-900">The final approval is done by the <b>Admin</b>.</span> <br /><span className="text-gray-500 font-medium text-sm">(अंतिम मंज़ूरी एडमिन द्वारा दी जाएगी।)</span></li>
                  <li><span className="text-gray-900">The approved amount will be sent to your bank account within 24 hours.</span> <br /><span className="text-gray-500 font-medium text-sm">(अप्रूवल मिलने के 24 घंटे के अंदर, पैसा आपके बैंक खाते में भेज दिया जाएगा।)</span></li>
                </ol>
              </div>

              {/* How to Track */}
              <div className="p-4 md:p-6">
                <h3 className="text-xs md:text-sm font-black text-[#3AB000] uppercase tracking-widest mb-4 border-b border-[#3AB000]/20 pb-2">Part 3: How to Track Claim / अपना क्लेम ट्रैक कैसे करें</h3>
                <ol className="list-decimal list-outside ml-5 space-y-4 text-sm md:text-[15px] text-gray-700 font-bold leading-relaxed">
                  <li><span className="text-gray-900 leading-normal block">Go to the <span className="text-gray-800 font-black uppercase inline-block border-b-2 border-[#3AB000]">My Claims</span> tab.</span> <span className="text-gray-500 font-medium text-sm">("MY CLAIMS" टैब पर जाएं।)</span></li>
                  <li><span className="text-gray-900">Find your submitted claim card.</span> <br /><span className="text-gray-500 font-medium text-sm">(अपना सबमिट किया हुआ क्लेम कार्ड देखें।)</span></li>
                  <li><span className="text-gray-900 leading-normal block">Check the <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-sm text-[11px] uppercase inline-block mx-1 font-black">Approval Track</span> section at the bottom of the card to see the current stage.</span> <span className="text-gray-500 font-medium text-sm">(कार्ड के नीचे "Approval Track" सेक्शन में देखें कि आपका क्लेम अभी किस स्टेज पर है।)</span></li>
                </ol>
              </div>
            </div>

            {/* Note */}
            <div className="bg-amber-50 p-4 md:p-5 border-t border-amber-200 flex gap-3 items-start">
              <div className="mt-0.5"><AlertCircle size={20} className="text-red-500" /></div>
              <div className="text-sm md:text-[15px] leading-relaxed">
                <span className="text-red-600 font-black uppercase tracking-wider">Important Note:</span>
                <span className="text-amber-900 font-bold ml-1.5">If your claim is rejected at any stage, please check the rejection remark. You can edit your application, correct the mistakes, and submit it again.</span>
                <div className="text-amber-800 font-medium mt-1.5 text-sm">यदि आपका क्लेम किसी भी स्तर पर रिजेक्ट हो जाता है, तो कृपया कारण पढ़ें, अपनी गलतियों को सुधारें और दोबारा क्लेम सबमिट करें (Re-Claim)।</div>
              </div>
            </div>

            {/* Policy Note */}
            <div className="bg-blue-50 p-4 md:p-5 border-t border-blue-200 flex gap-3 items-start">
              <div className="mt-0.5"><AlertCircle size={20} className="text-blue-600" /></div>
              <div className="text-sm md:text-[15px] leading-relaxed">
                <span className="text-blue-700 font-black uppercase tracking-wider">Policy Note:</span>
                <span className="text-blue-900 font-bold ml-1.5">According to the policy, you can only submit one new claim every 3 months. If you already have a pending or paid claim, please wait for 3 months before submitting a new one.</span>
                <div className="text-blue-800 font-medium mt-1.5 text-sm">पॉलिसी के अनुसार, आप 3 महीने में केवल एक बार नया क्लेम सबमिट कर सकते हैं। यदि आपका पहले से कोई क्लेम पेंडिंग या अप्रूव्ड है, तो कृपया नया क्लेम करने के लिए 3 महीने प्रतीक्षा करें।</div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 pt-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-sm shadow-sm h-24 animate-pulse p-4 w-full flex items-center gap-4">
                    <div className="h-4 bg-gray-200 w-1/4 rounded"></div>
                    <div className="h-10 bg-gray-100 w-1/3 rounded mx-auto"></div>
                    <div className="h-10 bg-gray-200 w-32 rounded"></div>
                  </div>
                ))
              ) : filteredClaims.length === 0 ? (
                <div className="bg-white border border-gray-200 p-16 flex flex-col items-center justify-center rounded-sm">
                  <AlertCircle size={48} className="text-gray-300 mb-4" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No medical claims found</p>
                  <button onClick={() => navigate('/claims/new')} className="mt-4 px-6 py-2 bg-[#3AB000] text-white text-xs font-black uppercase tracking-widest rounded-sm hover:bg-[#2d8a00] transition-colors">Submit New Claim</button>
                </div>
              ) : (
                filteredClaims.map((claim) => (
                  <div key={claim._id} className="bg-white border border-gray-300 shadow-sm hover:shadow-lg rounded-md transition-all flex flex-col p-5 gap-4 group">

                    {/* Main Content Row */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                      {/* 1. Holder Info */}
                      <div className="w-full lg:w-1/3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#3AB000]/10 flex items-center justify-center border border-[#3AB000]/20 flex-shrink-0">
                            <User size={24} className="text-[#3AB000]" />
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight leading-tight">{claim.cardHolderName || claim.memberName || "Unknown"}</h3>
                            <p className="text-xs text-gray-500 font-bold mt-1">Health Card: {claim.healthCardNumber || "N/A"}</p>
                            <div className="flex items-center gap-1.5 mt-2 bg-gray-50 border border-gray-200 px-2.5 py-1 w-max rounded-sm">
                              <Clock size={12} className="text-[#3AB000]" />
                              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                Submitted On: {new Date(claim.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. Financials (Centered) */}
                      <div className="w-full lg:w-1/3 flex justify-center">
                        <div className="flex items-center justify-center gap-8 bg-gray-50/80 px-6 py-4 border border-gray-200 rounded-md w-full max-w-sm">
                          <div className="text-left">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Requested Amount</p>
                            <p className="text-base font-black text-gray-900 flex items-center"><IndianRupee size={16} className="mr-0.5 text-gray-400" /> {claim.totalMedicalExpenses || 0}</p>
                          </div>
                          <div className="h-10 w-px bg-gray-300"></div>
                          <div className="text-left">
                            <p className="text-[10px] text-[#3AB000] font-bold uppercase tracking-widest mb-1">Approved Amount</p>
                            <p className="text-base font-black text-[#3AB000] flex items-center"><IndianRupee size={16} className="mr-0.5 text-[#3AB000]" /> {claim.approvedAmount || 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* 3. Status and Action */}
                      <div className="w-full lg:w-1/3 flex flex-row lg:flex-col items-center justify-between lg:items-end gap-3 mt-2 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                        <div className="flex flex-col items-end gap-2 w-full lg:w-48">
                          {claim.isDeleted ? (
                            <div className="flex flex-col items-center gap-1 w-full">
                              <span className="flex justify-center items-center gap-1.5 text-white text-xs font-black uppercase tracking-widest bg-red-600 px-3 py-2 rounded-md shadow-sm w-full text-center">
                                DELETED BY ADMIN
                              </span>
                            </div>
                          ) : claim.payoutStatus === 'paid' ? (
                            <span className="flex justify-center items-center gap-1.5 text-blue-700 text-xs font-black uppercase tracking-widest bg-blue-50 px-3 py-2 rounded-md border border-blue-200 w-full"><CheckCircle2 size={14} /> PAID</span>
                          ) : claim.status === 'pending' ? (
                            <span className="flex justify-center text-amber-700 text-xs font-black uppercase tracking-widest bg-amber-50 px-3 py-2 rounded-md border border-amber-200 w-full text-center">
                              Pending with {claim.currentStage || 'Authority'}
                            </span>
                          ) : (claim.status === 'approved' || (claim.status === 'pending' && claim.currentStage === 'ADMIN' && claim.approvedAmount > 0)) ? (
                            <span className="flex justify-center items-center gap-1.5 text-blue-700 text-xs font-black uppercase tracking-widest bg-blue-50 px-3 py-2 rounded-md border border-blue-200 w-full"><Clock size={14} /> Processing Pay</span>
                          ) : (
                            <span className="flex justify-center text-red-600 text-xs font-black uppercase tracking-widest bg-red-50 px-3 py-2 rounded-md border border-red-200 w-full text-center">Rejected</span>
                          )}

                          <button onClick={() => openReviewModal(claim)} className="w-full py-2.5 bg-gray-900 text-white hover:bg-gray-800 transition-colors font-black text-xs uppercase tracking-widest rounded-md shadow-md whitespace-nowrap text-center">
                            View Details
                          </button>
                          {claim.status === 'rejected' && !claim.isDeleted && (
                            <button onClick={() => navigate(`/claims/edit/${claim._id}`)} className="w-full py-2.5 bg-[#3AB000] text-white hover:bg-[#2d8a00] transition-colors font-black text-xs uppercase tracking-widest rounded-md shadow-md text-center">
                              Edit & Re-Claim
                            </button>
                          )}

                          {claim.payoutStatus === 'paid' && (
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest w-full text-center">Ref: {claim.payoutId || 'Manual'}</p>
                          )}
                        </div>
                      </div>
                    </div> {/* Close Main Content Row */}

                    {/* Tracking Row */}
                    <div className="mt-1 pt-3 border-t border-gray-100 flex items-center flex-wrap gap-2 text-[10px] uppercase tracking-widest">
                      <span className="text-gray-400 font-bold mr-2">Approval Track:</span>

                      {claim.approvalHistory && claim.approvalHistory.length > 0 ? (
                        claim.approvalHistory.map((history, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-sm font-bold border border-green-100">
                              <CheckCircle2 size={10} /> {history.role}
                            </span>
                            <ArrowRight size={10} className="text-gray-300" />
                          </div>
                        ))
                      ) : null}

                      {claim.status === 'pending' ? (
                        claim.currentStage === 'ADMIN' && claim.approvedAmount > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-sm font-bold border border-green-100">
                              <CheckCircle2 size={10} /> ADMIN
                            </span>
                            <ArrowRight size={10} className="text-gray-300" />
                            <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-1 rounded-sm font-bold border border-blue-100">
                              <Clock size={10} /> PROCESSING PAY
                            </span>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded-sm font-bold border border-amber-100">
                            <Clock size={10} /> {claim.currentStage || 'Authority'}
                          </span>
                        )
                      ) : claim.status === 'approved' || claim.payoutStatus === 'paid' ? (
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-sm font-bold border ${claim.payoutStatus === 'paid' ? 'text-green-700 bg-green-50 border-green-100' : 'text-blue-700 bg-blue-50 border-blue-100'}`}>
                          <CheckCircle2 size={10} /> {claim.payoutStatus === 'paid' ? 'PAID' : 'PROCESSING PAY'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-sm font-bold border border-red-100">
                          <XCircle size={10} /> REJECTED
                        </span>
                      )}
                    </div>

                    {/* Rejection Reason (If Rejected) */}
                    {claim.status === 'rejected' && (
                      (() => {
                        const rejectionItem = claim.approvalHistory?.slice().reverse().find(h => h.status.toLowerCase() === 'rejected');
                        const rejectorRole = rejectionItem?.role || claim.currentStage || 'Authority';
                        const remarkText = rejectionItem?.remark || claim.adminRemark || 'Document Verification Failed. Please check and re-apply.';

                        return (
                          <div className="mt-3 bg-red-50 border border-red-200 rounded-sm p-3 text-left w-full">
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <XCircle size={12} /> Reason for Rejection by {rejectorRole}
                            </p>
                            <p className="text-xs text-red-800 font-bold italic">
                              "{remarkText}"
                            </p>
                          </div>
                        );
                      })()
                    )}

                  </div>
                ))
              )}
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 disabled:opacity-50 font-bold text-xs uppercase tracking-widest rounded-sm"
                >
                  Previous
                </button>
                <span className="text-xs font-black text-gray-600 bg-gray-100 px-4 py-2 rounded-sm border border-gray-200">
                  PAGE {currentPage} OF {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 disabled:opacity-50 font-bold text-xs uppercase tracking-widest rounded-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showReviewModal && selectedClaim && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-2 md:p-6">
          <div className="bg-white shadow-2xl w-full h-full max-w-[1400px] rounded-sm flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#3AB000]">
              <h2 className="text-white font-bold text-base flex items-center gap-2 uppercase tracking-wide">
                <CheckCircle2 className="w-5 h-5" /> Medical Claim Details
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
                  {/* Deleted Reason Alert */}
                  {selectedClaim.isDeleted && (
                    <div className="bg-red-50 border border-red-200 p-4 flex items-start gap-3 shadow-sm rounded-sm">
                      <AlertCircle className="text-red-600 mt-0.5" size={20} />
                      <div>
                        <p className="text-[12px] font-black text-red-900 uppercase tracking-widest">Deleted by Admin</p>
                        <p className="text-[11px] font-bold text-red-700 mt-1 uppercase tracking-wide">
                          Reason: {selectedClaim.deletedReason || "No reason provided."}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Status & Payout Track */}
                  {selectedClaim.payoutStatus === 'paid' && !selectedClaim.isDeleted && (
                    <div className="bg-blue-50 border border-blue-200 p-4 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2"><CheckCircle2 className="text-white" size={20} /></div>
                        <div>
                          <p className="text-[12px] font-black text-blue-900 uppercase tracking-widest">Payment Successful</p>
                          <p className="text-[10px] font-bold text-blue-600 uppercase">TXN ID: {selectedClaim.payoutId || 'Manual'}</p>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                      {selectedClaim.adminRemark && (
                        <div className="bg-[#3AB000]/5 border border-[#3AB000]/20 p-4">
                          <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest mb-1">Administrator Feedback</p>
                          <p className="text-sm font-bold text-gray-800 italic">"{selectedClaim.adminRemark}"</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-5 lg:border-l lg:border-gray-100 lg:pl-8">
                      <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">Tracking History</h3>
                      {selectedClaim.approvalHistory && selectedClaim.approvalHistory.length > 0 ? (
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-3 styled-scrollbar">
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

            {/* Footer Action Area */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end">
              <button onClick={() => setShowReviewModal(false)} className="px-8 py-3 text-[11px] font-black text-gray-600 hover:text-black hover:bg-gray-100 transition-colors uppercase tracking-widest border border-gray-300 bg-white shadow-sm rounded-sm">
                Close Window
              </button>
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
      {/* Cooldown Modal */}
      {showCooldownModal && (
        <div className="fixed inset-0 z-[25000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md shadow-2xl overflow-hidden border-t-4 border-[#3AB000] rounded-md">
            <div className="flex items-center justify-between px-6 py-4 bg-green-50/50 border-b border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#3AB000]/10 flex items-center justify-center">
                  <AlertCircle size={16} className="text-[#3AB000]" />
                </div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-[#3AB000]">Information</h3>
              </div>
              <button onClick={() => setShowCooldownModal(false)} className="text-gray-400 hover:text-black transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-gray-50 rounded-full flex items-center justify-center border-4 border-white shadow-sm mb-6">
                <Clock size={40} className="text-[#3AB000]" />
              </div>
              <h4 className="text-[16px] font-black text-gray-900 uppercase tracking-widest leading-tight">
                {cooldownMessage.title}
              </h4>
              <div className="space-y-3 mt-4 bg-blue-50/50 border border-blue-100 p-5 rounded-sm shadow-inner">
                <p className="text-[11.5px] font-black text-blue-900 uppercase tracking-wide leading-relaxed">
                  {cooldownMessage.en}
                </p>
                <div className="h-px w-full bg-blue-200/50"></div>
                <p className="text-[13.5px] font-bold text-blue-800 leading-relaxed">
                  {cooldownMessage.hi}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-center">
              <button
                onClick={() => setShowCooldownModal(false)}
                className="w-full px-6 py-3.5 bg-[#3AB000] text-white hover:bg-[#2d8a00] hover:shadow-lg transition-all font-black text-[12px] uppercase tracking-widest rounded-sm shadow-md"
              >
                Okay, I Understood
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default Claims;
