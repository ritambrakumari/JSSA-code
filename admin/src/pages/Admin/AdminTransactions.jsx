import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { 
  CreditCard, 
  Search, 
  RefreshCw, 
  Eye, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Phone, 
  MapPin, 
  Briefcase,
  IndianRupee,
  Filter
} from "lucide-react";
import { paymentsAPI } from "../../utils/api";
import { useAdminBlue, AdminBlueStyle, AdminHero } from "../../components/AdminBlueTheme";

const GREEN = "#3AB000";
const GREEN_DARK = "#2d8a00";
const GREEN_LIGHT = "#e8f5e2";

const AdminTransactions = () => {
  const isBlue = useAdminBlue();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTx, setSelectedTx] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalAppFeePaid: 0,
    totalMOUFeePaid: 0,
    totalApplications: 0
  });

  // Pagination stats
  const [pagination, setPagination] = useState({
    totalCount: 0,
    limit: 10
  });

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const res = await paymentsAPI.getAllTransactions({
        page,
        limit: 10,
        status: statusFilter,
        search: searchQuery
      });
      if (res.success) {
        setTransactions(res.data.transactions);
        setTotalPages(res.data.pagination.totalPages);
        setCurrentPage(res.data.pagination.currentPage);
        setPagination({
          totalCount: res.data.pagination.totalCount,
          limit: res.data.pagination.limit
        });
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      } else {
        setError(res.error || "Failed to load transactions");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) fetchTransactions(1);
      else setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const StatusBadge = ({ status }) => {
    const s = status?.toLowerCase();
    const styles = {
      paid: "text-[#3AB000] font-bold uppercase",
      pending: "text-amber-500 font-bold uppercase",
      failed: "text-red-500 font-bold uppercase",
    };
    return (
      <span className={`text-[10px] tracking-wider ${styles[s] || "text-gray-400 font-bold uppercase"}`}>
        {status}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleSyncMOU = async (tx) => {
    const paymentId = prompt("Enter Razorpay Payment ID for this MOU Fee (Optional):", "");
    if (paymentId === null) return; // User cancelled

    try {
      setLoading(true);
      const res = await paymentsAPI.updateMOUStatus({
        applicationId: tx.id,
        status: "paid",
        paymentId: paymentId || undefined
      });
      if (res.success) {
        alert("MOU Fee successfully marked as PAID!");
        fetchTransactions(currentPage);
        if (selectedTx && selectedTx.id === tx.id) {
            setIsModalOpen(false);
        }
      } else {
        alert("Failed to update status: " + res.error);
        setLoading(false);
      }
    } catch (err) {
      alert("Error updating status");
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className={`p-0 ml-0 md:ml-6 px-2 md:px-0 mt-4 space-y-4 h-full ${isBlue ? "adm-blue" : ""}`}>
        {isBlue && <AdminBlueStyle />}
        {isBlue && (
          <div className="mr-4">
            <AdminHero icon={CreditCard} title="Unified Transactions" subtitle="Application fee and MOU fee payments in one place" />
          </div>
        )}
        {/* Top Stats - Full Width Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mr-4">
          {/* Stat Card 0: Total Apps */}
          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Applications</span>
              <span className="text-2xl font-black text-gray-800 leading-none">{loading ? '...' : stats.totalApplications?.toLocaleString()}</span>
            </div>
            <div className="p-3 bg-gray-100 text-gray-500 rounded-full">
              <User className="w-5 h-5" />
            </div>
          </div>

          {/* Stat Card 1: App Fees */}
          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">App Fees Paid</span>
              <span className="text-2xl font-black text-[#4D7C0F] leading-none">{loading ? '...' : stats.totalAppFeePaid?.toLocaleString()}</span>
            </div>
            <div className="p-3 bg-[#ECFCCB] text-[#4D7C0F] rounded-full">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Stat Card 2: MOU Fees */}
          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">MOU Fees Paid</span>
              <span className="text-2xl font-black text-[#3AB000] leading-none">{loading ? '...' : stats.totalMOUFeePaid?.toLocaleString()}</span>
            </div>
            <div className="p-3 bg-green-50 text-[#3AB000] rounded-full">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Header - Styled like MOU.jsx Filters */}
        <div className="bg-white p-4 border border-gray-200 rounded-none shadow-sm space-y-4 mr-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
              <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase">
                {isBlue ? <Search className="w-5 h-5 text-[#3AB000]" /> : <CreditCard className="w-6 h-6 text-[#3AB000]" />}
                {isBlue ? "Search & Filter" : "Unified Transactions"}
              </h1>
            </div>
            
            <button 
              onClick={() => fetchTransactions(currentPage)}
              className="bg-black hover:bg-gray-800 text-white text-xs sm:text-sm px-5 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center border-t border-gray-100 pt-4">
            <div className="flex h-10 w-full md:w-auto flex-1">
              <input 
                type="text"
                placeholder="Search Name, App No, Payment ID, Email..."
                className="px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                onClick={() => fetchTransactions(1)}
                className="bg-[#3AB000] hover:bg-[#1a5e00] text-white text-xs sm:text-sm px-6 font-medium transition-colors uppercase tracking-wide"
              >
                Search
              </button>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
               <select 
                className="h-10 border border-gray-300 rounded-none px-3 text-xs sm:text-sm font-medium text-gray-700 bg-white focus:outline-none shadow-sm min-w-[160px] cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Status: All</option>
                <option value="paid">Status: Paid</option>
                <option value="pending">Status: Pending</option>
                <option value="fully_paid">Status: Fully Paid (Both)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table - Modified columns as requested */}
        <div className="bg-white rounded-none overflow-hidden border border-gray-200 shadow-sm mr-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#3AB000]">
                  <th className="px-4 py-3 text-center font-bold text-black text-[13px]">S.N</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-[13px]">Payment ID</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-[13px]">Candidate Name</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-[13px]">Post</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-[13px]">App Fee</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-[13px]">MOU Fee</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-[13px]">Status</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-[13px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="8" className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                    </tr>
                  ))
                ) : transactions.length > 0 ? (
                  transactions.map((tx, idx) => (
                    <tr key={tx.id} className="hover:bg-[#e8f5e2] transition-colors border-b border-gray-100">
                      <td className="px-4 py-4 text-center text-gray-500 font-bold text-xs">
                        {(currentPage - 1) * pagination.limit + idx + 1}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[11px] font-mono text-[#4D7C0F] font-bold bg-[#ECFCCB] px-2 py-0.5 rounded border border-[#D9F99D]">{tx.appFee.paymentId || "N/A"}</span>
                          <span className="text-[9px] text-gray-400 font-bold font-mono">#{tx.applicationNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-medium text-gray-700 capitalize">{tx.candidateName?.toLowerCase()}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-[12px] font-black text-gray-800 uppercase leading-tight max-w-[180px] inline-block">{tx.jobTitle}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[13px] font-bold text-gray-700">₹{tx.appFee.amount}</span>
                          <StatusBadge status={tx.appFee.status} />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[13px] font-bold text-gray-700">₹{tx.mouFee.amount}</span>
                          <StatusBadge status={tx.mouFee.status} />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {tx.isFullyPaid ? (
                          <span className="text-[9px] font-black text-[#3AB000] border border-[#3AB000]/30 px-2 py-0.5 rounded-full uppercase">Fully Paid</span>
                        ) : (
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Incomplete</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button 
                          onClick={() => { setSelectedTx(tx); setIsModalOpen(true); }}
                          className="p-2 text-gray-400 hover:text-[#3AB000] hover:bg-[#3AB000]/10 rounded-lg transition-all"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-400 font-medium italic text-sm">No transactions found matching your criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none">Page {currentPage} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-1.5 bg-white border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 text-gray-600 transition-colors shadow-sm"
                >
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-1.5 bg-[#3AB000] text-white rounded-sm hover:bg-opacity-90 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Detail Modal - Typed like MOU.jsx Edit Modal */}
        {isModalOpen && selectedTx && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
              {/* Modal Header - MOU Style */}
              <div className="flex items-center justify-between px-6 py-4 bg-[#3AB000]">
                <h2 className="text-white font-bold text-base flex items-center gap-2 uppercase tracking-wide">
                  <CreditCard className="w-5 h-5" /> Transaction Snapshot
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Candidate Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 border-b border-gray-100">
                  <div className="space-y-1 text-center md:text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Candidate</label>
                    <div className="text-sm font-black text-gray-800 uppercase">{selectedTx.candidateName}</div>
                  </div>
                  <div className="space-y-1 text-center md:text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mobile</label>
                    <div className="text-sm font-black text-gray-800">{selectedTx.mobile}</div>
                  </div>
                  <div className="space-y-1 text-center md:text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</label>
                    <div className="text-sm font-black text-gray-800 truncate uppercase">{selectedTx.district}, {selectedTx.state}</div>
                  </div>
                  <div className="space-y-1 text-center md:text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Job Posting</label>
                    <div className="text-[11px] font-bold text-[#3AB000] uppercase mt-1 bg-green-50 px-2 py-0.5 rounded w-fit mx-auto md:mx-0">{selectedTx.jobTitle}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
                  {/* Step 1: Application Fee */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between font-mono">
                      <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1 h-5 bg-[#3AB000] rounded-none"></div>
                        1. Application Fee
                      </h3>
                      <StatusBadge status={selectedTx.appFee.status} />
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-4">
                      <div className="flex justify-between items-end">
                        <div className="text-center md:text-left w-full md:w-auto">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Amount</p>
                          <p className="text-xl font-black text-gray-800 underline decoration-[#3AB000]/20 underline-offset-4">₹{selectedTx.appFee.amount}</p>
                        </div>
                        <div className="text-right hidden md:block">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Method</p>
                          <p className="text-xs font-bold text-gray-600 capitalize">{selectedTx.appFee.method}</p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-200 space-y-2">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-2 border border-gray-100 gap-1">
                           <span className="text-[9px] font-bold text-gray-400 uppercase">Order ID</span>
                           <span className="text-[10px] font-mono text-gray-500 break-all">{selectedTx.appFee.orderId}</span>
                        </div>
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-2 border border-gray-100 gap-1">
                           <span className="text-[9px] font-bold text-gray-400 uppercase">Payment ID</span>
                           <span className="text-[10px] font-mono text-[#3AB000] font-bold break-all">{selectedTx.appFee.paymentId}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: MOU Fee */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between font-mono">
                      <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1 h-5 bg-black rounded-none"></div>
                        2. MOU Fee (Post-Selection)
                      </h3>
                      <StatusBadge status={selectedTx.mouFee.status} />
                    </div>
                    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-4 relative ${selectedTx.mouFee.status !== 'paid' ? 'opacity-80' : ''}`}>
                      <div className="flex justify-between items-end">
                        <div className="text-center md:text-left w-full md:w-auto">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Amount</p>
                          <p className="text-xl font-black text-gray-800 underline decoration-black/20 underline-offset-4">₹{selectedTx.mouFee.amount}</p>
                        </div>
                        <div className="text-right hidden md:block">
                           <p className="text-[10px] font-bold text-gray-400 uppercase">Stage</p>
                           <p className="text-[10px] font-bold text-gray-600 uppercase">MOU Process</p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-200 space-y-2">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-2 border border-gray-100 gap-1">
                           <span className="text-[9px] font-bold text-gray-400 uppercase">Order ID</span>
                           <span className="text-[10px] font-mono text-gray-500 break-all">{selectedTx.mouFee.orderId}</span>
                        </div>
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-2 border border-gray-100 gap-1">
                           <span className="text-[9px] font-bold text-gray-400 uppercase">Payment ID</span>
                           <span className="text-[10px] font-mono text-[#3AB000] font-bold break-all">{selectedTx.mouFee.paymentId}</span>
                        </div>
                      </div>
                      {selectedTx.mouFee.status !== 'paid' && (
                        <div className="absolute inset-0 bg-white/20 flex flex-col items-center justify-center pt-8">
                           <span className="text-[10px] font-black text-gray-400/30 tracking-[0.4em] -rotate-12 outline-1 mb-2 pointer-events-none">PENDING</span>
                           <button 
                             onClick={() => handleSyncMOU(selectedTx)}
                             className="bg-black hover:bg-[#3AB000] text-white text-[10px] font-bold px-4 py-2 rounded-sm uppercase tracking-widest shadow-md transition-colors"
                           >
                             Mark as Paid
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footnote */}
                <div className="bg-[#ECFCCB] border-l-4 border-[#4D7C0F] p-4 rounded-none text-[#3F6212] text-[10px] font-black uppercase tracking-wide leading-relaxed">
                   Disclaimer: Official transaction records retrieved on {formatDate(selectedTx.date)}. Use the Razorpay Payment ID for all reconciliation purposes.
                </div>
              </div>

              {/* Modal Footer - MOU Style */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-2.5 text-xs font-black text-gray-500 hover:text-gray-800 transition-colors uppercase tracking-widest border border-gray-200 bg-white shadow-sm"
                >
                  Close
                </button>
                <button 
                   onClick={() => window.print()}
                   className="bg-black hover:bg-[#3AB000] text-white text-[11px] font-black px-8 py-2.5 rounded-sm transition-all uppercase tracking-widest shadow-md"
                >
                  Print Records
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminTransactions;
