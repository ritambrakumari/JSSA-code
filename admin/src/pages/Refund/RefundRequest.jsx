import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Shield, CreditCard, Loader2, AlertCircle, CheckCircle2, History, Send } from "lucide-react";
import { refundAPI, paymentsAPI } from "../../utils/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../../auth/AuthProvider";

const GREEN = "#3AB000";

const RefundRequest = () => {
  const { role } = useAuth();
  // Applicant portal uses the landing-site blue design; employee view stays as before.
  const isBlueTheme = role === "applicant";
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recentTransaction, setRecentTransaction] = useState(null);
  const [reason, setReason] = useState("");
  const [myRequests, setMyRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("history"); // request or history

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch latest successful transactions
      const txRes = await paymentsAPI.getTransactions({ page: 1, limit: 10, status: 'paid' });
      if (txRes.success && txRes.data.transactions.length > 0) {
        // Find the most recent successful payment
        setRecentTransaction(txRes.data.transactions[0]);
      }

      // Fetch refund history
      const refundRes = await refundAPI.getMyRequests();
      if (refundRes.success) {
        setMyRequests(refundRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      toast.error("Failed to load refund details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recentTransaction) {
      toast.error("No eligible transaction found for refund");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for refund");
      return;
    }

    setSubmitting(true);
    try {
      const res = await refundAPI.request({
        transactionId: recentTransaction.id || recentTransaction._id,
        reason: reason.trim(),
        isMou: recentTransaction.isMou || false
      });

      if (res.success) {
        toast.success("Refund request submitted successfully");
        setReason("");
        setActiveTab("history");
        fetchInitialData();
      }
    } catch (error) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const isAlreadyRequested = recentTransaction && myRequests.some(req => {
    const txId = recentTransaction.id || recentTransaction._id;
    const reqTxId = typeof req.transactionId === 'object' ? req.transactionId?._id : req.transactionId;
    const reqAppId = typeof req.applicationId === 'object' ? req.applicationId?._id : req.applicationId;
    return reqTxId === txId || reqAppId === txId;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[80vh] flex items-center justify-center">
          <Loader2 className={`w-10 h-10 animate-spin ${isBlueTheme ? "text-[#4D7C0F]" : "text-[#3AB000]"}`} />
        </div>
      </DashboardLayout>
    );
  }

  // ── Applicant view: landing-site blue design (employee view below is unchanged) ──
  if (isBlueTheme) {
    const statusClass = (status) =>
      status === "Approved" ? "rf-pill-ok" : status === "Rejected" ? "rf-pill-bad" : "rf-pill-wait";
    return (
      <DashboardLayout>
        <div className="rf-page">
          <style>{RF_BLUE_CSS}</style>

          <div className="rf-hero">
            <div>
              <p className="rf-kicker">Fee Refund</p>
              <h1>Refund Request</h1>
              <p className="rf-sub">Request a refund for your fee payment and track its status.</p>
            </div>
            <div className="rf-hero-stat">
              <span>{myRequests.length}</span>
              <small>My Requests</small>
            </div>
          </div>

          <div className="rf-tabs">
            <button onClick={() => setActiveTab("request")} className={activeTab === "request" ? "on" : ""}>
              <Send size={15} /> New Request
            </button>
            <button onClick={() => setActiveTab("history")} className={activeTab === "history" ? "on" : ""}>
              <History size={15} /> Request History
            </button>
          </div>

          {activeTab === "request" ? (
            <div className="rf-grid">
              <div className="rf-col">
                <section className="rf-card">
                  <div className="rf-card-h">
                    <span className="rf-card-ic"><CreditCard size={16} /></span>
                    <h2>Payment Details</h2>
                    <span className="rf-tag">Auto-filled</span>
                  </div>
                  {!recentTransaction ? (
                    <div className="rf-empty">
                      <AlertCircle size={40} />
                      <p className="rf-empty-t">No successful payments found</p>
                      <p>Only successful application or security fees are eligible for refund.</p>
                    </div>
                  ) : (
                    <div className="rf-details">
                      <BlueDetail label="Payment Type" value={recentTransaction.type || "Application Fee"} />
                      <BlueDetail label="Transaction ID" value={recentTransaction.paymentId} />
                      <BlueDetail label="Application No." value={recentTransaction.applicationNumber} />
                      <BlueDetail label="Job Post" value={recentTransaction.jobTitle} />
                      <BlueDetail label="Paid Amount" value={`₹${recentTransaction.amount}`} highlight />
                      <BlueDetail
                        label="Payment Date"
                        value={new Date(recentTransaction.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                      />
                    </div>
                  )}
                </section>

                {recentTransaction && (
                  <section className="rf-card">
                    <div className="rf-card-h">
                      <span className="rf-card-ic"><Send size={16} /></span>
                      <h2>Refund Reason</h2>
                    </div>
                    {isAlreadyRequested ? (
                      <div className="rf-done">
                        <CheckCircle2 size={40} />
                        <p className="rf-empty-t">Request Already Submitted</p>
                        <p>
                          A refund request for this payment has already been recorded. Please check the{" "}
                          <button type="button" className="rf-link" onClick={() => setActiveTab("history")}>
                            Request History
                          </button>{" "}
                          tab for updates.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="rf-form">
                        <label htmlFor="rf-reason">Why are you requesting a refund?</label>
                        <textarea
                          id="rf-reason"
                          required
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Please describe the reason for your refund request in detail..."
                        />
                        <button type="submit" disabled={submitting} className="rf-btn">
                          {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                          {submitting ? "Processing..." : "Submit Refund Request"}
                        </button>
                      </form>
                    )}
                  </section>
                )}
              </div>

              <aside className="rf-card rf-policy">
                <div className="rf-policy-h">
                  <Shield size={18} />
                  <h2>Refund Policy</h2>
                </div>
                <ul>
                  {[
                    "Refund requests must be submitted within 24 hours of payment.",
                    "Transaction processing fees may be non-refundable.",
                    "Once approved, refund will be credited to original payment source.",
                    "Requests are reviewed by admin within 3-5 working days.",
                    "Fraudulent requests may lead to permanent account suspension.",
                  ].map((text) => (
                    <li key={text}>
                      <CheckCircle2 size={16} />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          ) : (
            <section className="rf-card">
              <div className="rf-card-h">
                <span className="rf-card-ic"><History size={16} /></span>
                <h2>Request History</h2>
              </div>
              {myRequests.length === 0 ? (
                <div className="rf-empty">
                  <History size={44} />
                  <p className="rf-empty-t">No Refund Requests Found</p>
                  <p>Requests you submit will appear here with their status.</p>
                </div>
              ) : (
                <div className="rf-table-wrap">
                  <table className="rf-table">
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Admin Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myRequests.map((req) => (
                        <tr key={req._id}>
                          <td className="rf-id">#{req._id.slice(-8).toUpperCase()}</td>
                          <td>{new Date(req.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                          <td>
                            <span className={`rf-pill ${statusClass(req.status)}`}>{req.status}</span>
                          </td>
                          <td className="rf-remark">{req.adminRemarks || "Awaiting review..."}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
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
              Refund <span className="text-[#3AB000]">Request</span>
            </h1>
            <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.3em] mt-1">
              Candidate Fee Withdrawal System
            </p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-none border border-gray-200">
            <button
              onClick={() => setActiveTab("request")}
              className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "request" ? "bg-[#3AB000] text-white shadow-lg" : "text-gray-500 hover:text-gray-700"}`}
            >
              New Request
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "history" ? "bg-[#3AB000] text-white shadow-lg" : "text-gray-500 hover:text-gray-700"}`}
            >
              Request History
            </button>
          </div>
        </div>

        {activeTab === "request" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Auto-filled Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border-2 border-[#3AB000] p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Shield size={120} />
                </div>

                <h3 className="text-sm font-black text-black uppercase tracking-[0.2em] mb-8 border-b border-gray-100 pb-4">
                  Payment Details (Auto-Filled)
                </h3>

                {!recentTransaction ? (
                  <div className="py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No successful payments found</p>
                    <p className="text-xs text-gray-400 mt-2">Only successful application or security fees are eligible for refund.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <DetailItem label="Payment Type" value={recentTransaction.type || "Application Fee"} isStatus />
                    <DetailItem label="Transaction ID" value={recentTransaction.paymentId} />
                    <DetailItem label="Application No." value={recentTransaction.applicationNumber} />
                    <DetailItem label="Job Post" value={recentTransaction.jobTitle} />
                    <DetailItem label="Paid Amount" value={`₹${recentTransaction.amount}`} isAmount />
                    <DetailItem label="Payment Date" value={new Date(recentTransaction.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} />
                  </div>
                )}
              </div>

              {recentTransaction && (
                <div className="bg-white border-2 border-black p-8 shadow-sm">
                  <h3 className="text-sm font-black text-black uppercase tracking-[0.2em] mb-6 border-b border-gray-100 pb-4">
                    Refund Reason
                  </h3>

                  {isAlreadyRequested ? (
                    <div className="py-12 bg-amber-50 border border-amber-200 flex flex-col items-center justify-center text-center p-6">
                      <CheckCircle2 className="text-[#3AB000] w-12 h-12 mb-4" />
                      <p className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Request Already Submitted</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed max-w-xs">
                        A refund request for this payment has already been recorded.
                        Please check the <span className="text-[#3AB000] cursor-pointer underline" onClick={() => setActiveTab("history")}>Request History</span> tab for updates.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Why are you requesting a refund?</label>
                        <textarea
                          required
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Please describe the reason for your refund request in detail..."
                          className="w-full p-4 bg-gray-50 border-2 border-gray-200 focus:border-[#3AB000] outline-none text-sm font-bold min-h-[120px] transition-colors"
                        />
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full bg-[#3AB000] text-white py-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-100"
                        >
                          {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                          {submitting ? "Processing..." : "Submit Refund Request"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Right: Policy */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900 text-white p-8 border-t-8 border-[#3AB000] sticky top-8">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#3AB000] mb-6">
                  Refund Policy
                </h3>
                <ul className="space-y-4">
                  <PolicyItem text="Refund requests must be submitted within 24 hours of payment." />
                  <PolicyItem text="Transaction processing fees may be non-refundable." />
                  <PolicyItem text="Once approved, refund will be credited to original payment source." />
                  <PolicyItem text="Requests are reviewed by admin within 3-5 working days." />
                  <PolicyItem text="Fraudulent requests may lead to permanent account suspension." />
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* History View */
          <div className="bg-white border-2 border-[#3AB000] overflow-hidden">
            {myRequests.length === 0 ? (
              <div className="py-24 text-center">
                <History className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No Refund Requests Found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#3AB000] text-white">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">ID</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Admin Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {myRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black text-gray-400">#{req._id.slice(-8).toUpperCase()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-gray-900">{new Date(req.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-black px-2 py-1 uppercase tracking-widest border ${req.status === 'Approved' ? 'bg-green-50 text-[#3AB000] border-[#3AB000]/20' :
                            req.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                              'bg-yellow-50 text-yellow-700 border-yellow-100'
                            }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[10px] font-bold text-gray-500 italic max-w-xs">{req.adminRemarks || "Awaiting review..."}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const DetailItem = ({ label, value, isAmount = false, isStatus = false }) => (
  <div>
    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-sm font-black tracking-tight ${isAmount ? "text-[#3AB000] text-xl" :
      isStatus ? "text-[#3AB000]" :
        "text-gray-900"
      }`}>
      {value || "N/A"}
    </p>
  </div>
);

const PolicyItem = ({ text }) => (
  <li className="flex items-start gap-3">
    <CheckCircle2 size={14} className="text-[#3AB000] mt-0.5 flex-shrink-0" />
    <p className="text-[10px] font-bold text-gray-300 leading-relaxed uppercase tracking-tight">{text}</p>
  </li>
);

const BlueDetail = ({ label, value, highlight = false }) => (
  <div className="rf-detail">
    <p className="rf-detail-l">{label}</p>
    <p className={`rf-detail-v ${highlight ? "rf-detail-amt" : ""}`}>{value || "N/A"}</p>
  </div>
);

// Landing-site palette for the applicant view: dark-green #3F6212, green #4D7C0F.
const RF_BLUE_CSS = `
.rf-page{max-width:72rem;margin:0 auto;padding:4px 4px 32px;font-family:'Segoe UI',sans-serif;color:#1f2937;display:flex;flex-direction:column;gap:18px;}
.rf-hero{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;padding:22px 26px;border-radius:10px;color:#fff;
  background:linear-gradient(100deg,#3F6212 0%,#4D7C0F 55%,#65A30D 100%);box-shadow:0 6px 16px rgba(77,124,15,.22);text-shadow:0 1px 2px rgba(26,46,5,.35);}
.rf-kicker{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#fff;font-weight:800;margin:0 0 4px;}
.rf-hero h1{font-size:25px;font-weight:800;margin:0 0 4px;color:#fff;}
.rf-sub{font-size:14px;color:#fff;font-weight:500;margin:0;}
.rf-hero-stat{min-width:120px;background:#fff;border-radius:8px;padding:12px 16px;box-shadow:0 4px 12px rgba(18,59,104,.18);text-shadow:none;}
.rf-hero-stat span{display:block;font-size:26px;font-weight:800;line-height:1;color:#3F6212;}
.rf-hero-stat small{display:block;font-size:12px;color:#4D7C0F;margin-top:6px;font-weight:700;}
.rf-tabs{display:inline-flex;align-self:flex-start;background:#fff;border:1px solid #dbe3ee;border-radius:8px;padding:4px;gap:4px;}
.rf-tabs button{display:inline-flex;align-items:center;gap:7px;border:0;background:none;padding:9px 18px;border-radius:6px;font-size:13px;font-weight:700;color:#475569;cursor:pointer;transition:background .15s,color .15s;}
.rf-tabs button:hover{background:#ECFCCB;color:#3F6212;}
.rf-tabs button.on{background:#4D7C0F;color:#fff;box-shadow:0 3px 10px rgba(77,124,15,.25);}
.rf-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(260px,1fr);gap:18px;align-items:start;}
.rf-col{display:flex;flex-direction:column;gap:18px;min-width:0;}
.rf-card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.04);overflow:hidden;}
.rf-card-h{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid #D9F99D;}
.rf-card-h h2{font-size:16px;font-weight:800;color:#3F6212;margin:0;}
.rf-card-ic{width:30px;height:30px;border-radius:7px;background:#ECFCCB;color:#4D7C0F;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.rf-tag{margin-left:auto;font-size:11px;font-weight:700;color:#4D7C0F;background:#ECFCCB;border-radius:999px;padding:3px 10px;}
.rf-details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 28px;padding:20px 18px 22px;}
.rf-detail-l{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin:0 0 4px;}
.rf-detail-v{font-size:15px;font-weight:700;color:#1f2937;margin:0;word-break:break-word;}
.rf-detail-amt{font-size:22px;color:#4D7C0F;}
.rf-empty,.rf-done{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:40px 20px;color:#cbd5e1;}
.rf-empty p,.rf-done p{margin:0;font-size:13px;color:#64748b;max-width:380px;line-height:1.5;}
.rf-empty .rf-empty-t,.rf-done .rf-empty-t{font-size:15px;font-weight:800;color:#3F6212;}
.rf-empty svg{color:#f59e0b;}
.rf-done{background:#ECFCCB;margin:16px;border:1px solid #D9F99D;border-radius:8px;}
.rf-done svg{color:#059669;}
.rf-link{background:none;border:0;padding:0;color:#4D7C0F;font-weight:700;text-decoration:underline;cursor:pointer;font-size:inherit;}
.rf-form{display:flex;flex-direction:column;gap:10px;padding:18px;}
.rf-form label{font-size:13px;font-weight:700;color:#334155;}
.rf-form textarea{width:100%;min-height:130px;padding:12px 14px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;font-size:14px;color:#1f2937;outline:none;resize:vertical;transition:border-color .15s,box-shadow .15s;}
.rf-form textarea:focus{border-color:#4D7C0F;box-shadow:0 0 0 3px #D9F99D;background:#fff;}
.rf-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;background:#4D7C0F;color:#fff;border:0;border-radius:8px;padding:13px 18px;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(77,124,15,.25);transition:background .15s;}
.rf-btn:hover:not(:disabled){background:#3F6212;}
.rf-btn:disabled{opacity:.6;cursor:not-allowed;}
.rf-policy{position:sticky;top:72px;}
.rf-policy-h{display:flex;align-items:center;gap:10px;padding:14px 18px;background:#3F6212;color:#fff;}
.rf-policy-h h2{font-size:15px;font-weight:800;margin:0;}
.rf-policy ul{list-style:none;margin:0;padding:16px 18px 18px;display:flex;flex-direction:column;gap:12px;}
.rf-policy li{display:flex;gap:10px;align-items:flex-start;font-size:13px;color:#334155;line-height:1.45;}
.rf-policy li svg{color:#4D7C0F;flex-shrink:0;margin-top:2px;}
.rf-table-wrap{overflow-x:auto;}
.rf-table{width:100%;border-collapse:collapse;font-size:14px;min-width:560px;}
.rf-table th{background:#4D7C0F;color:#fff;text-align:left;font-weight:700;padding:12px 18px;white-space:nowrap;}
.rf-table td{padding:13px 18px;border-bottom:1px solid #f1f5f9;color:#1f2937;vertical-align:top;}
.rf-table tbody tr:nth-child(even){background:#ECFCCB;}
.rf-table tbody tr:hover{background:#ECFCCB;}
.rf-id{font-weight:700;color:#3F6212;font-family:ui-monospace,Consolas,monospace;font-size:13px;}
.rf-remark{color:#64748b;font-style:italic;max-width:320px;}
.rf-pill{display:inline-block;font-size:12px;font-weight:700;padding:3px 12px;border-radius:999px;border:1px solid;white-space:nowrap;}
.rf-pill-ok{background:#ecfdf5;color:#047857;border-color:#a7f3d0;}
.rf-pill-bad{background:#fef2f2;color:#b91c1c;border-color:#fecaca;}
.rf-pill-wait{background:#fffbeb;color:#b45309;border-color:#fde68a;}
@media(max-width:1024px){.rf-grid{grid-template-columns:1fr;}.rf-policy{position:static;}}
@media(max-width:640px){
  .rf-hero{padding:18px;}.rf-hero h1{font-size:21px;}.rf-hero-stat{width:100%;}
  .rf-tabs{align-self:stretch;}.rf-tabs button{flex:1;justify-content:center;padding:9px 8px;}
  .rf-details{grid-template-columns:1fr;}
}
`;

export default RefundRequest;
