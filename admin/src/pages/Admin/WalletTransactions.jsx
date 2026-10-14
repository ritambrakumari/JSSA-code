import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { walletAPI } from "../../utils/api";
import { toast } from "react-hot-toast";
import {
  CreditCard,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  Calendar,
  Info
} from "lucide-react";

const GREEN = "#3AB000";

const WalletTransactions = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [resolvingId, setResolvingId] = useState(null);
  const [checkingRpId, setCheckingRpId] = useState(null);

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true);
      const res = await walletAPI.getAdminTransactions({
        page,
        limit: 20,
        status: statusFilter,
        search,
        type: typeFilter !== "ALL" ? typeFilter : undefined
      });
      if (res.success) {
        setTransactions(res.data);
        if (res.pagination) {
          setPagination({
            page: res.pagination.currentPage,
            pages: res.pagination.pages,
            total: res.pagination.total
          });
        }
      } else {
        toast.error(res.error || "Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Fetch Transactions Error:", error);
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTransactions(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter, typeFilter]);

  const handleResolve = async (id, action) => {
    if (!window.confirm(`Are you sure you want to mark this transaction as ${action}? ${action === 'SUCCESS' ? "This will credit the user's wallet." : ""}`)) {
      return;
    }

    try {
      setResolvingId(id);
      const res = await walletAPI.resolveAdminTransaction(id, action);
      if (res.success) {
        toast.success(res.message);
        fetchTransactions(pagination.page); // Refresh list
      } else {
        toast.error(res.error || "Failed to resolve transaction");
      }
    } catch (error) {
      console.error("Resolve Error:", error);
      toast.error("Server error occurred");
    } finally {
      setResolvingId(null);
    }
  };

  const handleCheckRazorpay = async (id) => {
    try {
      setCheckingRpId(id);
      const res = await walletAPI.checkRazorpayStatus(id);
      if (res.success) {
        let msg = `Razorpay Order: ${res.data.orderStatus.toUpperCase()} | Payment: ${res.data.paymentStatus.toUpperCase()}`;
        if (res.data.failureReason) {
          msg += ` | Reason: ${res.data.failureReason}`;
        }
        toast.success(msg, { duration: 8000 });
      } else {
        toast.error(res.error || "Failed to check status");
      }
    } catch (error) {
      console.error("RP Status Error:", error);
      toast.error("Server error occurred while checking Razorpay");
    } finally {
      setCheckingRpId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const renderPaginationButtons = () => {
    const { page, pages } = pagination;
    const pageNumbers = [];
    const maxVisible = 5;

    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(pages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => fetchTransactions(i)}
          className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-colors shadow-sm ${page === i
              ? "bg-[#3AB000] text-white border-[#3AB000]"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => fetchTransactions(page - 1)}
          className="p-1.5 bg-white border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 text-gray-600 transition-colors shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => fetchTransactions(1)}
              className="px-3 py-1.5 text-xs font-bold rounded-sm border bg-white text-gray-600 border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
            >
              1
            </button>
            {startPage > 2 && <span className="px-1 text-gray-400">...</span>}
          </>
        )}

        {pageNumbers}

        {endPage < pages && (
          <>
            {endPage < pages - 1 && <span className="px-1 text-gray-400">...</span>}
            <button
              onClick={() => fetchTransactions(pages)}
              className="px-3 py-1.5 text-xs font-bold rounded-sm border bg-white text-gray-600 border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
            >
              {pages}
            </button>
          </>
        )}

        <button
          disabled={page === pages}
          onClick={() => fetchTransactions(page + 1)}
          className="p-1.5 bg-[#3AB000] text-white rounded-sm hover:bg-opacity-90 disabled:opacity-50 transition-colors shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>
    );
  };

  return (
    <DashboardLayout activePath="/admin/wallet-ledger">
      <div className="p-0 ml-0 md:ml-6 px-2 md:px-0">
        {/* Header - Styled like AdminTransactions Filters */}
        <div className="bg-white p-4 border border-gray-200 rounded-none shadow-sm space-y-4 mr-4 mb-4 mt-4 md:mt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
              <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase">
                <CreditCard className="w-6 h-6 text-[#3AB000]" />
                WALLET LEDGER
              </h1>
            </div>

            <button
              onClick={() => fetchTransactions(pagination.page)}
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
                placeholder="Search name, phone, order ID..."
                className="px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm flex-1"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                <option value="ALL">Status: All</option>
                <option value="SUCCESS">Status: Success</option>
                <option value="PENDING">Status: Pending</option>
                <option value="FAILED">Status: Failed</option>
              </select>
              <select
                className="h-10 border border-gray-300 rounded-none px-3 text-xs sm:text-sm font-medium text-gray-700 bg-white focus:outline-none shadow-sm min-w-[160px] cursor-pointer"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="ALL">Type: All</option>
                <option value="CREDIT_ADMIN">Type: Admin Credit</option>
                <option value="CREDIT_ONLINE">Type: User Deposit</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Desktop Table ── */}
        <div className="bg-white rounded-none overflow-hidden border border-gray-200 shadow-sm mr-4 md:mr-6 mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-[#3AB000]">
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">S.N</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">Date & Time</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">Employee Details</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">Reference / Order ID</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="7" className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-10 text-center text-gray-400">
                      <p className="text-sm font-bold uppercase tracking-widest">No transactions found</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx, idx) => (
                    <tr key={tx._id} className="border-b border-gray-100 hover:bg-[#e8f5e2] transition-colors">
                      <td className="px-4 py-4 text-center text-gray-700">
                        {(pagination.page - 1) * 20 + idx + 1}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2 font-semibold">
                          <span className="text-gray-900">{formatDate(tx.createdAt).split(',')[0]}</span>
                          <span className="text-[#3AB000]">{formatDate(tx.createdAt).split(',')[1]}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-gray-900 uppercase whitespace-nowrap">{tx.userName}</span>
                          <span className="text-xs font-semibold text-gray-500 mt-0.5">{tx.userPhone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                          {tx.razorpay_order_id || 'MANUAL'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-gray-900">₹{tx.amount}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tx.type.replace(/_/g, ' ')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {tx.status === 'SUCCESS' && (
                          <span className="border border-green-600 text-green-700 text-[9px] font-black uppercase px-3 py-1 rounded-full bg-green-50 shadow-sm whitespace-nowrap w-fit mx-auto">
                            Success
                          </span>
                        )}
                        {tx.status === 'PENDING' && (
                          <span className="border border-orange-500 text-orange-600 text-[9px] font-black uppercase px-3 py-1 rounded-full bg-orange-50 shadow-sm whitespace-nowrap w-fit mx-auto">
                            Pending
                          </span>
                        )}
                        {tx.status === 'FAILED' && (
                          <span className="border border-red-600 text-red-700 text-[9px] font-black uppercase px-3 py-1 rounded-full bg-red-50 shadow-sm whitespace-nowrap w-fit mx-auto">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {tx.status === 'PENDING' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              disabled={resolvingId === tx._id || checkingRpId === tx._id}
                              onClick={() => handleResolve(tx._id, 'SUCCESS')}
                              className="w-8 h-8 rounded bg-green-50 text-[#3AB000] hover:bg-[#3AB000] hover:text-white border border-green-200 flex items-center justify-center transition-all disabled:opacity-50"
                              title="Mark Success & Credit Wallet"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button
                              disabled={resolvingId === tx._id || checkingRpId === tx._id}
                              onClick={() => handleResolve(tx._id, 'FAILED')}
                              className="w-8 h-8 rounded bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-200 flex items-center justify-center transition-all disabled:opacity-50"
                              title="Mark Failed"
                            >
                              <XCircle size={16} />
                            </button>
                            {tx.razorpay_order_id && tx.razorpay_order_id !== 'MANUAL' && (
                              <button
                                disabled={checkingRpId === tx._id || resolvingId === tx._id}
                                onClick={() => handleCheckRazorpay(tx._id)}
                                className="w-8 h-8 rounded bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-200 flex items-center justify-center transition-all disabled:opacity-50"
                                title="Check Razorpay Status"
                              >
                                {checkingRpId === tx._id ? <RefreshCw size={14} className="animate-spin" /> : <Info size={16} />}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400 italic">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && pagination.pages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Showing Page {pagination.page} of {pagination.pages}
              </span>
              {renderPaginationButtons()}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WalletTransactions;
