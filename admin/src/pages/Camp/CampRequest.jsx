import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { campAPI } from "../../utils/api";
import {
  Tent,
  Loader2,
  MapPin,
  History,
  Send,
  Clock,
  X,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-hot-toast";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-amber-50 text-amber-600 border-amber-100",
    Approved: "bg-green-50 text-green-600 border-green-100",
    Rejected: "bg-red-50 text-red-600 border-red-100",
  };
  return (
    <span
      className={`px-3 py-1 border text-[11px] font-black uppercase tracking-widest ${
        styles[status] || "bg-gray-50 text-gray-400 border-gray-100"
      }`}
    >
      {status}
    </span>
  );
};

const getCampStatus = (dateString) => {
  if (!dateString) return null;
  const campDate = new Date(dateString);
  campDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (campDate < today) return { label: "Passed", color: "bg-gray-100 text-gray-500 border-gray-200" };
  if (campDate > today) return { label: "Upcoming", color: "bg-[#3AB000]/10 text-[#3AB000] border-[#3AB000]/20" };
  return { label: "Ongoing Today", color: "bg-amber-100 text-amber-700 border-amber-200" };
};

const CampRequest = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState("available");
  const [camps, setCamps] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campsRes, eligRes, reqRes] = await Promise.all([
        campAPI.getActiveCamps(),
        campAPI.getEligibility(),
        campAPI.getMyRequests(),
      ]);
      if (campsRes.success) setCamps(campsRes.data);
      if (eligRes.success) setEligibility(eligRes.data);
      if (reqRes.success) setMyRequests(reqRes.data);
    } catch (error) {
      toast.error(error.message || "Failed to load camp details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const canRequest = eligibility?.canRequest === true;

  const getRequestTooltip = () => {
    if (eligibility?.employeeStatus === "Resigned") {
      return "Resigned employees cannot submit camp requests.";
    }
    if (eligibility?.hasPending) {
      return "You already have a pending camp request.";
    }
    if (!canRequest && eligibility?.eligibleFrom) {
      return `You can submit the next request after ${formatDate(eligibility.eligibleFrom)}${
        eligibility.daysRemaining > 0 ? ` (${eligibility.daysRemaining} days left)` : ""
      }.`;
    }
    return "";
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await campAPI.submitRequest();
      if (res.success) {
        toast.success("Camp request submitted successfully");
        setShowConfirmModal(false);
        fetchData();
      }
    } catch (error) {
      toast.error(error.message || "Failed to submit camp request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-0 ml-0 md:ml-6 px-2 md:px-0 mt-4 space-y-6 h-full mr-4 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#3AB000]/20 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#3AB000]/10 flex items-center justify-center shrink-0">
              <Tent className="text-[#3AB000]" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                Camp Request
              </h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                View camps & submit general request
              </p>
            </div>
          </div>
          <div className="relative group w-full sm:w-auto">
            <button
              type="button"
              onClick={() => canRequest && setShowConfirmModal(true)}
              disabled={!canRequest || submitting || loading}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 transition-all text-[11px] font-black uppercase tracking-widest shadow-md ${
                canRequest && !loading
                  ? "bg-[#3AB000] text-white hover:bg-[#2d8a00]"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              <Send size={16} />
              Request
            </button>
            {!canRequest && getRequestTooltip() && (
              <div
                role="tooltip"
                className="pointer-events-none absolute left-0 sm:left-1/2 sm:-translate-x-1/2 bottom-full mb-3 w-full sm:w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible z-50 transition-opacity duration-150"
              >
                <div className="bg-gray-900 text-white text-xs font-semibold normal-case leading-relaxed p-4 border-l-4 border-amber-400 shadow-xl">
                  {getRequestTooltip()}
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 bg-white border border-[#3AB000]/20">
            <Loader2 className="animate-spin text-[#3AB000]" size={28} />
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              Loading camp details...
            </p>
          </div>
        ) : (
          <>
            {!canRequest && !eligibility?.hasPending && eligibility?.eligibleFrom && (
              <div className="bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                <Clock className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                  Next request allowed from {formatDate(eligibility.eligibleFrom)}
                  {eligibility.daysRemaining > 0 &&
                    ` — about ${eligibility.daysRemaining} day(s) remaining.`}
                </p>
              </div>
            )}

            {eligibility?.hasPending && (
              <div className="py-6 bg-amber-50 border border-amber-200 text-center px-6">
                <CheckCircle2 className="text-amber-600 w-10 h-10 mb-3 mx-auto" />
                <p className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">
                  Pending Admin Review
                </p>
                <p className="text-[10px] font-bold text-gray-500 uppercase max-w-md mx-auto">
                  Your camp request is pending admin review.
                </p>
              </div>
            )}

            {/* Tabs */}
            <div className="flex bg-white border-b-2 border-gray-100 shadow-sm">
              <button
                onClick={() => setTab("available")}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${
                  tab === "available"
                    ? "text-[#3AB000] border-b-[3px] border-[#3AB000] bg-[#3AB000]/5"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                Available Camps
              </button>
              <button
                onClick={() => setTab("requests")}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${
                  tab === "requests"
                    ? "text-[#3AB000] border-b-[3px] border-[#3AB000] bg-[#3AB000]/5"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                My Requests
              </button>
            </div>

            {/* Available Camps */}
            {tab === "available" && (
              <div className="bg-white overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
              {camps.length === 0 ? (
                <div className="py-16 text-center">
                  <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                    No active camps at the moment
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 p-4 bg-gray-50/50">
                  {camps.map((c) => {
                    const status = getCampStatus(c.campDate);
                    return (
                    <div key={c._id} className="bg-white border-2 border-[#3AB000]/40 p-5 shadow-sm hover:border-[#3AB000] hover:shadow-md transition-all">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest block mb-1">Camp Name</span>
                            <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">{c.name}</h3>
                          </div>
                          {status && (
                            <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border rounded-sm ${status.color}`}>
                              {status.label}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-6">
                          <div>
                            <span className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest block mb-1">Camp Date</span>
                            <span className="bg-[#3AB000]/10 text-[#3AB000] font-bold px-2 py-1 rounded-sm text-xs inline-flex items-center gap-1.5 border border-[#3AB000]/20">
                              📅 {c.campDate ? formatDate(c.campDate) : "TBD"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest block mb-1">Organizer</span>
                            <span className="bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded-sm text-xs inline-flex items-center gap-1.5 border border-gray-200">
                              🏢 {c.organizer || "—"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest block mb-1">Full Address & Location</span>
                          <div className="bg-gray-50 p-3 border border-gray-100 rounded-sm">
                            {c.address && (
                              <p className="text-xs font-bold text-gray-800 leading-relaxed whitespace-normal mb-1">{c.address}</p>
                            )}
                            <span className="text-[10px] uppercase text-gray-500 font-black">
                              {[
                                c.panchayatName?.split(" / ")[0].trim(),
                                c.blockName?.split(" / ")[0].trim(),
                                c.district?.split(" / ")[0].trim(),
                                c.state?.split(" / ")[0].trim()
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}

            {/* My Camp Requests */}
            {tab === "requests" && (
            <div className="bg-white overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                {myRequests.length === 0 ? (
                  <div className="py-16 text-center">
                    <History className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                      No camp requests yet
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 p-4 bg-gray-50/50">
                    {myRequests.map((r) => (
                      <div
                        key={r._id}
                        className="bg-white border-2 border-[#3AB000]/40 p-5 shadow-sm hover:border-[#3AB000] hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-4"
                      >
                        <div className="flex flex-col gap-3 min-w-[140px] md:border-r border-gray-100 md:pr-6">
                          <StatusBadge status={r.status} />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                            DATE: {formatDate(r.submittedAt)}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          {r.adminRemarks ? (
                            <div className="bg-[#3AB000]/5 border-l-2 border-[#3AB000] px-4 py-3 rounded-r-sm">
                              <div className="flex items-center gap-2 mb-1.5">
                                <MessageSquare size={14} className="text-[#3AB000]" />
                                <span className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest">
                                  Administrator Remarks
                                </span>
                              </div>
                              <p className="text-[13px] font-bold text-gray-800 italic leading-tight">
                                &ldquo;{r.adminRemarks}&rdquo;
                              </p>
                            </div>
                          ) : (
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              General camp request — awaiting review
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-md border-t-8 border-[#3AB000] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.15em]">
                Confirm Camp Request
              </h3>
              <button
                type="button"
                onClick={() => !submitting && setShowConfirmModal(false)}
                disabled={submitting}
                className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-40"
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200">
                <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <p className="text-[10px] font-bold text-amber-900 uppercase leading-relaxed">
                  Are you sure you want to submit a general camp request? You can submit again
                  only after 3 months from your last request.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                  className="flex-1 px-5 py-3 text-[11px] font-black uppercase tracking-widest border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
                >
                  No, Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                  className="flex-1 bg-[#3AB000] text-white py-3 font-black uppercase tracking-[0.2em] text-[11px] hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                  {submitting ? "Processing..." : "Yes, Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CampRequest;
