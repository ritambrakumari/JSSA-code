import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  LogOut,
  Loader2,
  CheckCircle2,
  History,
  Send,
  Clock,
  Calendar,
  X,
} from "lucide-react";
import { resignationAPI } from "../../utils/api";
import { toast } from "react-hot-toast";

const GREEN = "#3AB000";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "N/A";

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-amber-50 text-amber-700 border-amber-100",
    Approved: "bg-green-50 text-[#3AB000] border-green-100",
    Rejected: "bg-red-50 text-red-600 border-red-100",
    Withdrawn: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`text-[9px] font-black px-2 py-1 uppercase tracking-widest border ${
        styles[status] || styles.Pending
      }`}
    >
      {status}
    </span>
  );
};

const EmployeeResign = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eligRes, reqRes] = await Promise.all([
        resignationAPI.getEligibility(),
        resignationAPI.getMyRequests(),
      ]);
      if (eligRes.success) setEligibility(eligRes.data);
      if (reqRes.success) setMyRequests(reqRes.data);
    } catch (error) {
      toast.error(error.message || "Failed to load resignation details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eligibility?.canSubmit) {
      toast.error("You are not yet eligible to submit a resignation request");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for resignation");
      return;
    }
    if (!confirmed) {
      toast.error("Please confirm that you understand the resignation policy");
      return;
    }

    setSubmitting(true);
    try {
      const res = await resignationAPI.submitRequest({ reason: reason.trim() });
      if (res.success) {
        toast.success("Resignation request submitted successfully");
        setReason("");
        setConfirmed(false);
        setShowApplyModal(false);
        fetchData();
      }
    } catch (error) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (id) => {
    setWithdrawingId(id);
    try {
      const res = await resignationAPI.withdrawRequest(id);
      if (res.success) {
        toast.success("Request withdrawn");
        fetchData();
      }
    } catch (error) {
      toast.error(error.message || "Failed to withdraw request");
    } finally {
      setWithdrawingId(null);
    }
  };

  const pendingRequest = myRequests.find((r) => r.status === "Pending");
  const canSubmitForm =
    eligibility?.canSubmit && !pendingRequest && eligibility?.employeeStatus === "Active";

  const getApplyTooltip = () => {
    if (pendingRequest) {
      return "Your resignation is already submitted and waiting for admin approval. Use “Withdraw Request” below if you want to cancel it.";
    }
    if (eligibility?.employeeStatus && eligibility.employeeStatus !== "Active") {
      return "Your account is not active right now, so you cannot apply for resignation.";
    }
    if (!eligibility?.canSubmit) {
      const days = eligibility?.daysRemaining ?? 0;
      const fromDate = formatDate(eligibility?.eligibleFrom);
      if (eligibility?.mouPaid) {
        return `You can apply after 3 months from your MOU payment date. Apply opens on ${fromDate}${days > 0 ? ` — about ${days} days left` : ""}.`;
      }
      return `You can apply after 3 months from your joining date. Apply opens on ${fromDate}${days > 0 ? ` — about ${days} days left` : ""}.`;
    }
    return "";
  };

  const openApplyModal = () => {
    if (!canSubmitForm) return;
    setShowApplyModal(true);
  };

  const closeApplyModal = () => {
    if (submitting) return;
    setShowApplyModal(false);
    setReason("");
    setConfirmed(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[80vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#3AB000]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b-4 border-[#3AB000] pb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
              <LogOut className="text-[#3AB000]" />
              Resignation <span className="text-[#3AB000]">Request</span>
            </h1>
            <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.3em] mt-1">
              Voluntary exit — subject to admin approval
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Eligibility */}
            <div className="bg-white border-2 border-[#3AB000] p-8 shadow-sm">
              <h3 className="text-sm font-black text-black uppercase tracking-[0.2em] mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
                <Calendar size={16} className="text-[#3AB000]" />
                Eligibility
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {eligibility?.mouPaid && (
                  <DetailItem label="MOU Paid Date" value={formatDate(eligibility.mouPaidAt)} />
                )}
                <DetailItem
                  label={eligibility?.mouPaid ? "Eligibility Base (MOU)" : "Join Date"}
                  value={formatDate(eligibility?.eligibilityBaseDate)}
                />
                <DetailItem label="Eligible From" value={formatDate(eligibility?.eligibleFrom)} highlight />
                <DetailItem
                  label="Days Remaining"
                  value={
                    eligibility?.canSubmit
                      ? "Eligible now"
                      : `${eligibility?.daysRemaining ?? 0} day(s)`
                  }
                />
              </div>
              {!eligibility?.canSubmit && !pendingRequest && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <Clock className="text-amber-600 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                    {eligibility?.mouPaid
                      ? `You can apply after 3 months from your MOU payment. Apply opens on ${formatDate(eligibility?.eligibleFrom)}.`
                      : `You can apply after 3 months from your joining date. Apply opens on ${formatDate(eligibility?.eligibleFrom)}.`}
                    {(eligibility?.daysRemaining ?? 0) > 0 &&
                      ` About ${eligibility.daysRemaining} days left.`}
                  </p>
                </div>
              )}

              {pendingRequest && (
                <div className="mt-6 py-6 bg-amber-50 border border-amber-200 text-center px-6">
                  <CheckCircle2 className="text-amber-600 w-10 h-10 mb-3 mx-auto" />
                  <p className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">
                    Pending Admin Review
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase max-w-md mx-auto mb-4">
                    Your resignation is pending approval. You retain full portal access until
                    approved.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleWithdraw(pendingRequest._id)}
                    disabled={withdrawingId === pendingRequest._id}
                    className="text-[10px] font-black uppercase tracking-widest text-red-600 border border-red-200 px-4 py-2 hover:bg-red-50"
                  >
                    {withdrawingId === pendingRequest._id ? "Withdrawing..." : "Withdraw Request"}
                  </button>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-100">
                <ApplyResignButton
                  disabled={!canSubmitForm}
                  tooltip={getApplyTooltip()}
                  onClick={openApplyModal}
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white border-2 border-[#3AB000] overflow-hidden">
              <h3 className="text-sm font-black text-black uppercase tracking-[0.2em] p-6 border-b border-gray-100 flex items-center gap-2">
                <History size={16} className="text-[#3AB000]" />
                Status & Timeline
              </h3>
              {myRequests.length === 0 ? (
                <div className="py-16 text-center">
                  <History className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                    No requests yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#3AB000] text-white">
                      <tr>
                        <th className="px-6 py-3 text-[10px] font-black uppercase">Date</th>
                        <th className="px-6 py-3 text-[10px] font-black uppercase">Event</th>
                        <th className="px-6 py-3 text-[10px] font-black uppercase">Status</th>
                        <th className="px-6 py-3 text-[10px] font-black uppercase">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {myRequests.map((req) => (
                        <tr key={req._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-xs font-black">
                            {formatDate(req.submittedAt || req.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-gray-600 uppercase">
                            Resignation submitted
                            {req.processedAt && (
                              <span className="block text-gray-400 mt-1">
                                Processed: {formatDate(req.processedAt)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={req.status} />
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-gray-500 italic max-w-xs">
                            {req.adminRemarks || req.reason?.slice(0, 80) || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-900 text-white p-8 border-t-8 border-[#3AB000] sticky top-8">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#3AB000] mb-6">
                Policy Notice
              </h3>
              <ul className="space-y-4">
                <PolicyItem text="If MOU is paid, eligibility is MOU paid date + 3 calendar months." />
                <PolicyItem text="Otherwise, eligibility is join date + 3 calendar months." />
                <PolicyItem text="Resignation is effective only after admin approval." />
                <PolicyItem text="While pending, you retain full portal access." />
                <PolicyItem text="After approval, only My Profile and Logout remain available." />
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-lg border-t-8 border-[#3AB000] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.15em]">
                Submit Resignation Request
              </h3>
              <button
                type="button"
                onClick={closeApplyModal}
                disabled={submitting}
                className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-40"
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Reason for resignation (required)
              </label>
              <textarea
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please describe your reason in detail..."
                className="w-full p-4 bg-gray-50 border-2 border-gray-200 focus:border-[#3AB000] outline-none text-sm font-bold min-h-[120px]"
              />
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-[10px] font-bold text-gray-600 uppercase leading-relaxed">
                  I understand that resignation takes effect only after admin approval, and after
                  approval I will only have access to My Profile.
                </span>
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#3AB000] text-white py-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-black transition-all flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Send size={18} />
                )}
                {submitting ? "Processing..." : "Submit Resignation Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const ApplyResignButton = ({ disabled, tooltip, onClick }) => (
  <div className="relative group w-full sm:w-auto">
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full sm:w-auto px-8 py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${
        disabled
          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
          : "bg-[#3AB000] text-white hover:bg-black"
      }`}
    >
      <Send size={16} />
      Apply for Resignation
    </button>
    {disabled && tooltip && (
      <div
        role="tooltip"
        className="pointer-events-none absolute left-0 sm:left-1/2 sm:-translate-x-1/2 bottom-full mb-3 w-full sm:w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible z-50 transition-opacity duration-150"
      >
        <div className="bg-gray-900 text-white text-xs font-semibold normal-case leading-relaxed p-4 border-l-4 border-amber-400 shadow-xl rounded-sm">
          {tooltip}
        </div>
        <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-gray-900 rotate-45" />
      </div>
    )}
  </div>
);

const DetailItem = ({ label, value, highlight = false }) => (
  <div>
    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p
      className={`text-sm font-black tracking-tight ${
        highlight ? "text-[#3AB000] text-lg" : "text-gray-900"
      }`}
    >
      {value}
    </p>
  </div>
);

const PolicyItem = ({ text }) => (
  <li className="flex items-start gap-3">
    <CheckCircle2 size={14} className="text-[#3AB000] mt-0.5 shrink-0" />
    <p className="text-[10px] font-bold text-gray-300 leading-relaxed uppercase tracking-tight">
      {text}
    </p>
  </li>
);

export default EmployeeResign;
