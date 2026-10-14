import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { CreditCard, Calendar, Briefcase, CheckCircle, Clock, XCircle, Search, RefreshCw, FileText, Download, Loader2, Eye, X, Printer } from "lucide-react";
import { paymentsAPI, applicationsAPI } from "../../utils/api";
import logo_jssa from "../../assets/img0.png";
import jssa_logo_new from "../../assets/JSSAogo.png";
import jss_watermark from "../../assets/jss.png";
import sig_bkumari from "../../assets/bKumari.png";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [downloadingTx, setDownloadingTx] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const invoiceTemplateRef = useRef(null);

  const numberToWords = (num) => {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const g = (n) => {
      if (n < 20) return a[n];
      let digit = n % 10;
      if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
      return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 === 0 ? '' : ' and ' + g(n % 100));
    };

    if (num === 0) return 'Zero';
    return g(num);
  };

  const handlePrint = () => {
    window.print();
  };

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  };

  // The transactions list has no contact details, so fill mobile/email/address
  // for the invoice from the existing application-details API (read only).
  const withContactDetails = async (tx) => {
    if (!tx?.id || tx.mobile || tx.email) return tx;
    try {
      const res = await applicationsAPI.getById(tx.id);
      const app = res?.data?.application;
      if (!res?.success || !app) return tx;
      return {
        ...tx,
        mobile: app.mobile || "",
        email: app.email || "",
        address: app.address || "",
        district: app.district || "",
        state: app.state || "",
      };
    } catch {
      return tx;
    }
  };

  const handleDownloadInvoice = async (tx, event) => {
    if (!tx || isDownloading) return;

    setIsDownloading(true);
    tx = await withContactDetails(tx);
    setDownloadingTx(tx);

    const button = event?.currentTarget;

    try {
      if (typeof window.html2pdf === "undefined") {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
      }

      const h2p = window.html2pdf;
      if (!h2p) throw new Error("PDF library not loaded");

      // ── DATA READINESS POLLING ──
      // Wait until the React-rendered hidden template shows the correct App Number.
      let isReady = false;
      for (let i = 0; i < 30; i++) {
        const currentText = invoiceTemplateRef.current?.innerText || "";
        if (currentText.includes(tx.applicationNumber)) {
          isReady = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Final short buffer for fonts and images
      await new Promise(resolve => setTimeout(resolve, 300));

      const container = invoiceTemplateRef.current?.querySelector('.mx-auto');
      if (!container) throw new Error("Invoice template container not found");

      // Options for html2pdf
      const opt = {
        margin: 0,
        filename: `Invoice_${tx.applicationNumber || tx.id}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        },
        pagebreak: { mode: ['avoid-all'] }
      };

      // Generate the PDF directly from the live hidden template
      // This ensures 100% parity with styles and data.
      await h2p().set(opt).from(container).save();

    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Error generating PDF. Please use the View -> Print option.");
    } finally {
      setIsDownloading(false);
      setDownloadingTx(null);
      if (button) {
        button.disabled = false;
      }
    }
  };

  const openInvoiceModal = async (tx) => {
    setSelectedTx(tx);
    setIsModalOpen(true);
    const full = await withContactDetails(tx);
    if (full !== tx) setSelectedTx(full);
  };

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentsAPI.getTransactions({
        page,
        limit: itemsPerPage,
        status: activeTab !== 'all' ? activeTab : undefined,
        search: searchQuery || undefined
      });
      if (response.success && response.data) {
        setTransactions(response.data.transactions);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setTotalCount(response.data.pagination.totalCount);
          setCurrentPage(response.data.pagination.currentPage);
        }
      } else {
        setError(response.error || "Failed to fetch transactions");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchTransactions(1);
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case "paid":
        return (
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap bg-green-50 text-green-700 border-green-200">
            Paid
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap bg-red-50 text-red-700 border-red-200">
            Failed
          </span>
        );
      case "refund processing":
        return (
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap bg-blue-50 text-blue-700 border-blue-200">
            Refund Processing
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap bg-orange-50 text-orange-700 border-orange-200">
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap bg-gray-100 text-gray-700 border-gray-200">
            {status.toUpperCase()}
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <DashboardLayout activePath="/transactions">
        <div className="p-0 ml-0 md:ml-6 px-2 md:px-0" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
          <style>{TX_BLUE_CSS}</style>

          {/* ── Page Header ── */}
          <div className="tx-hero">
            <div>
              <p className="tx-kicker">Payments</p>
              <h1>Transaction History</h1>
              <p className="tx-sub">All your fee payments in one place. View or download the invoice for paid transactions.</p>
            </div>
            <div className="tx-hero-stat">
              <span>{totalCount}</span>
              <small>Total Transactions</small>
            </div>
          </div>
          {/* ── Top Bar ── */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 w-full">
              <div className="flex items-center gap-0 border border-gray-300 rounded overflow-hidden flex-shrink-0 w-full sm:w-auto">
                {["all", "paid", "pending"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setCurrentPage(1);
                    }}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium border-r border-gray-300 last:border-r-0 transition-colors whitespace-nowrap ${activeTab === tab
                      ? "bg-[#4D7C0F] text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="tx-search flex items-center border border-gray-300 rounded-md overflow-hidden h-10 flex-1 w-full sm:max-w-[500px]">
                <input
                  type="text"
                  placeholder="Search by ID, Job Title or App No..."
                  className="flex-1 px-3 sm:px-4 text-xs sm:text-sm text-gray-700 focus:outline-none h-full bg-white"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                />
                <button
                  onClick={() => setCurrentPage(1)}
                  className="bg-[#4D7C0F] hover:bg-[#3F6212] text-white text-xs sm:text-sm px-4 sm:px-6 h-full font-medium transition-colors whitespace-nowrap"
                >
                  Search
                </button>
              </div>
            </div>

            <button
              onClick={() => fetchTransactions(currentPage)}
              className="bg-[#3F6212] hover:bg-[#4D7C0F] text-white text-xs sm:text-sm font-medium px-4 sm:px-6 py-2.5 rounded-md transition-colors whitespace-nowrap w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden md:block bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <div className="overflow-x-auto -mx-2 md:mx-0">
              <table className="w-full text-sm min-w-[900px] tx-zebra">
                <thead>
                  <tr className="bg-[#4D7C0F]">
                    {[
                      "S.N",
                      "Application No.",
                      "Payment ID",
                      "Date & Time",

                      "Applied For",
                      "Amount",
                      "Status",
                      "Action",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-center font-bold text-white text-sm whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse border-b border-gray-100">
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className="px-4 py-4 text-center">
                            <div className="bg-gray-200 rounded mx-auto h-4 w-4/5" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : transactions.length > 0 ? (
                    transactions.map((tx, idx) => (
                      <tr key={tx.id} className="border-b border-gray-100 hover:bg-[#ECFCCB] transition-colors">
                        <td className="px-4 py-4 text-center text-gray-700">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="px-4 py-4 text-center text-[#3F6212] font-semibold whitespace-nowrap">
                          {tx.applicationNumber}
                        </td>
                        <td className="px-4 py-4 text-center text-gray-700 font-semibold whitespace-nowrap text-xs ">
                          {tx.paymentId !== "N/A" ? tx.paymentId : "Not available"}
                        </td>
                        <td className="px-4 py-4 text-center text-gray-700 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2 font-semibold">
                            <span className="text-gray-900">{formatDate(tx.date).split(',')[0]}</span>
                            <span className="text-[#4D7C0F]">{formatDate(tx.date).split(',')[1]}</span>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center text-gray-700 font-medium whitespace-nowrap">
                          {tx.jobTitle}
                        </td>
                        <td className="px-4 py-4 text-center text-gray-700 font-bold whitespace-nowrap">
                          ₹{tx.amount}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center">{getStatusBadge(tx.paymentStatus)}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openInvoiceModal(tx)}
                              className="p-2 rounded-full transition-colors text-[#4D7C0F] hover:bg-[#ECFCCB]"
                              title="View Invoice"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => handleDownloadInvoice(tx, e)}
                              className={`p-2 rounded-full transition-colors ${tx.paymentStatus.toLowerCase() === "paid"
                                ? "text-[#4D7C0F] hover:bg-[#ECFCCB]"
                                : "text-gray-300 cursor-not-allowed"}`}
                              title={tx.paymentStatus.toLowerCase() === "paid" ? "Download PDF" : "Invoice only available for Paid status"}
                              disabled={(isDownloading && downloadingTx?.id === tx.id) || tx.paymentStatus.toLowerCase() !== "paid"}
                            >
                              {isDownloading && downloadingTx?.id === tx.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Download className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-gray-400 text-sm italic">
                        {error ? (
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-red-500">Error: {error}</p>
                            <button
                              onClick={() => fetchTransactions(1)}
                              className="bg-[#4D7C0F] text-white px-4 py-1.5 rounded text-xs hover:bg-[#3F6212]"
                            >
                              Retry
                            </button>
                          </div>
                        ) : (
                          "No transactions found."
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile Card View ── */}
          <div className="md:hidden space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded border border-gray-200 p-4 animate-pulse h-32"></div>
              ))
            ) : transactions.length > 0 ? (
              transactions.map((tx, idx) => (
                <div
                  key={tx.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow relative"
                >
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(tx.paymentStatus)}
                  </div>

                  <div className="flex items-start justify-between mb-3 pr-16 text-left">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">S.N: {(currentPage - 1) * itemsPerPage + idx + 1}</div>
                      <div className="text-sm font-semibold text-[#3F6212] mb-1">
                        {tx.applicationNumber}
                      </div>
                      <div className="text-base font-medium text-gray-800">
                        {tx.jobTitle}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-700 mb-3 text-left">
                    <div className="flex items-start">
                      <span className="font-medium w-24 flex-shrink-0 italic text-gray-500 text-xs uppercase">Date:</span>
                      <span className="flex-1 font-semibold">
                        {formatDate(tx.date).split(',')[0]}
                        <span className="text-[#4D7C0F] ml-2 text-xs">{formatDate(tx.date).split(',')[1]}</span>
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium w-24 flex-shrink-0 italic text-gray-500 text-xs uppercase">Amount:</span>
                      <span className="flex-1 font-bold">₹{tx.amount}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium w-24 flex-shrink-0 italic text-gray-500 text-xs uppercase">Payment ID:</span>
                      <span className="flex-1 text-xs truncate italic">{tx.paymentId !== "N/A" ? tx.paymentId : "N/A"}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-100 mt-1 flex gap-2">
                      <button
                        onClick={() => openInvoiceModal(tx)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded font-medium text-sm transition-colors bg-[#4D7C0F] text-white hover:bg-[#3F6212]"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={(e) => handleDownloadInvoice(tx, e)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded font-medium text-sm transition-colors ${tx.paymentStatus.toLowerCase() === "paid"
                          ? "border border-[#4D7C0F] text-[#4D7C0F] hover:bg-[#ECFCCB]"
                          : "border border-gray-200 text-gray-300 cursor-not-allowed"}`}
                        disabled={(isDownloading && downloadingTx?.id === tx.id) || tx.paymentStatus.toLowerCase() !== "paid"}
                      >
                        {isDownloading && downloadingTx?.id === tx.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded border border-gray-200 p-8 text-center text-gray-400 text-sm">
                {error ? (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-red-500">Error: {error}</p>
                    <button
                      onClick={() => fetchTransactions(1)}
                      className="bg-[#4D7C0F] text-white px-4 py-1.5 rounded text-xs hover:bg-[#3F6212]"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  "No transactions found."
                )}
              </div>
            )}
          </div>

          {/* ── Pagination UI ── */}
          {!loading && transactions.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between sm:justify-end items-center gap-3 sm:gap-4 mt-6">
              <div className="text-xs sm:text-sm text-gray-600 sm:hidden">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-[#4D7C0F] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:bg-[#3F6212] transition-colors rounded-md flex-1 sm:flex-none"
                >
                  Back
                </button>

                <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
                  {(() => {
                    const pages = [];
                    const visiblePages = new Set([
                      1,
                      2,
                      totalPages - 1,
                      totalPages,
                      currentPage - 1,
                      currentPage,
                      currentPage + 1,
                    ]);
                    for (let i = 1; i <= totalPages; i++) {
                      if (visiblePages.has(i)) pages.push(i);
                      else if (pages[pages.length - 1] !== "...") pages.push("...");
                    }
                    return pages.map((page, idx) =>
                      page === "..." ? (
                        <span key={idx} className="px-1 text-gray-500 select-none">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors ${currentPage === page
                              ? "text-[#4D7C0F] font-bold"
                              : "text-gray-600 hover:text-[#4D7C0F]"
                            }`}
                        >
                          {page}
                        </button>
                      ),
                    );
                  })()}
                </div>

                <div className="sm:hidden text-sm font-medium text-gray-700 px-2">
                  {currentPage}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="bg-[#4D7C0F] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:bg-[#3F6212] transition-colors rounded-md flex-1 sm:flex-none"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* ── Invoice Modal ── */}
          {isModalOpen && selectedTx && (
            <div className="fixed inset-0 z-[999] flex justify-center items-start bg-black/50 p-4 overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-200 py-10">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl relative print:shadow-none print:rounded-none my-auto">
                {/* Modal Header (Hidden in print) */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 print:hidden bg-gray-50 rounded-t-lg">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="text-[#3AB000]" /> Invoice Preview
                  </h3>
                  <div className="flex items-center gap-3">

                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Invoice Content */}
                <div className="p-0 md:p-0 overflow-x-auto print:p-0 print:overflow-visible bg-white relative">
                  <style dangerouslySetInnerHTML={{
                    __html: `
                  @media print {
                    body * { visibility: hidden; }
                    #invoice-print-area, #invoice-print-area * { visibility: visible; }
                    #invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; border: none !important; padding: 0 !important; }
                    @page { size: auto; margin: 5mm; }
                  }
                `}} />

                  <div
                    id="invoice-print-area"
                    className="inv-theme mx-auto bg-white border border-gray-200 shadow-sm print:shadow-none print:border-none relative"
                    style={{
                      width: "100%",
                      minWidth: "700px",
                      padding: "30px",
                      fontFamily: "'Times New Roman', Times, serif",
                      color: "#000",
                      lineHeight: "1.3"
                    }}
                  >
                    {/* Watermark Background */}
                    <div style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%) rotate(-15deg)",
                      opacity: "0.1",
                      width: "450px",
                      zIndex: "0",
                      pointerEvents: "none"
                    }}>
                      <img src={jss_watermark} alt="" className="w-full h-auto" />
                    </div>

                    <div className="relative z-10">
                      {/* Header Label */}
                      <div className="text-right mb-2">
                        <span className="bg-black text-white px-3 py-0.5 font-bold text-xs">INVOICE</span>
                      </div>

                      {/* Organization Header */}
                      <div className="flex justify-between items-start mb-6">
                        {/* Logo (Left Aligned) */}
                        <div className="flex-shrink-0">
                          <img src={jssa_logo_new} alt="JSSA Logo" className="h-24 w-auto object-contain" />
                        </div>

                        {/* Organization Banner (Right Aligned) */}
                        <div className="flex flex-col items-end text-right">
                          <h1 className="text-xl font-bold text-black leading-tight">
                            जन आरोग्य सहायता अभियान/Jan Aarogya Sahayata Abhiyan
                          </h1>
                          <p className="text-[13px] font-bold text-black">(This Project Is Organized Under Social Welfare Organization)</p>
                          <p className="text-[12px] font-bold text-black">Registration No. : 053083</p>

                          <div className="text-[12px] font-bold space-y-0.5 leading-tight mt-1 text-black">
                            <p>Reg. Off.: Riding Road, Sheikhpura Patna, Bihar - 800014 India</p>
                            <p>Cop. Off. : 15, Kg Marg, Janpath, Marakhamba, New Delhi, 110001, India.</p>
                            <p>Helpline: +91-9471987611 | Email : Support@Jssabhiyan.Com</p>
                          </div>
                        </div>
                      </div>

                      {/* Invoice Meta Bar */}
                      <div className="flex justify-between items-center border-y-2 border-black py-0.5 px-2 font-bold text-[13px] mb-3">
                        <span>Invoice No.: JSSA/26/#{selectedTx.applicationNumber}</span>
                        <span>Date: {formatDate(selectedTx.date).split(',')[0]}</span>
                      </div>

                      {/* Title */}
                      <div className="text-center mb-4">
                        <h2 className="text-[14px] font-bold bg-white px-4 flex items-center justify-center gap-2">
                          INVOICE (Application Fee)
                        </h2>
                      </div>

                      {/* Candidate Details */}
                      <div className="space-y-2 mb-3 text-[13px] px-2 font-bold">
                        <div className="flex">
                          <span className="w-40 flex-shrink-0">Candidate Name</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5">: {selectedTx.candidateName}</span>
                        </div>
                        <div className="flex">
                          <span className="w-40 flex-shrink-0">Post Applied For</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5">: {selectedTx.jobTitle}</span>
                        </div>
                        <div className="flex">
                          <span className="w-40 flex-shrink-0">Address</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5">: {selectedTx.address}, {selectedTx.district}, {selectedTx.state}</span>
                        </div>
                        <div className="flex">
                          <span className="w-40 flex-shrink-0">Mobile No.</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5">: {selectedTx.mobile}</span>
                        </div>
                        <div className="flex">
                          <span className="w-40 flex-shrink-0">Email ID</span>
                          <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5">: {selectedTx.email}</span>
                        </div>
                      </div>

                      {/* Fee Table section */}
                      <div className="mb-5 px-2">
                        <h3 className="font-bold text-[13px] mb-2">Fee Details:</h3>
                        <div className="pl-8 space-y-2">
                          <p className="font-bold text-[13px]">
                            1.Application Fee - ₹{selectedTx.amount}/-
                          </p>
                          <p className="font-bold  text-[13px]">
                            2.Total Amount: ₹{selectedTx.amount}/- ({numberToWords(selectedTx.amount)} Only)
                          </p>
                          <p className="font-bold   text-[13px]">
                            3.Payment Mode: {selectedTx.method ? (selectedTx.method === 'upi' ? 'UPI' : selectedTx.method.charAt(0).toUpperCase() + selectedTx.method.slice(1)) : (selectedTx.paymentId && selectedTx.paymentId.startsWith('pay_') ? 'Online' : 'Cash/Other')}
                          </p>
                          <p className="font-bold text-[13px]">
                            4.Transaction ID: <span className="px-2">{selectedTx.paymentId}</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 mb-2 flex flex-col items-start px-2">
                        <p className="font-bold text-sm">B. Kumari</p>
                        <p className="text-[11px] font-bold mb-1">Authorized Signatory</p>
                        <div className="mt-1">
                          <img src={sig_bkumari} alt="Signature" className="h-12 w-auto object-contain" />
                        </div>
                      </div>

                      {/* Terms & Conditions */}
                      <div className="border-t border-black pt-2 px-2">
                        <h4 className="font-bold text-sm underline mb-2 p-0">Terms & Conditions:</h4>
                        <ol className="list-decimal pl-6 text-[12px] leading-relaxed font-semibold space-y-0.5 text-gray-800">
                          <li>The Application Fee of ₹{selectedTx.amount}/- is a one-time charge and is non-refundable. However, within 24 hours of payment, if the candidate is dissatisfied or wishes to withdraw the application, they may request a refund.</li>
                          <li>In such cases, the organization will review the request, and the refund may be granted as per applicable rules and policies.</li>
                          <li>This fee is charged solely for application processing purposes. No refund will be provided once the examination has been conducted.</li>
                          <li>All information provided by the candidate must be true and verified. In case of any false or misleading information, the application may be rejected.</li>
                          <li>Payment posting to your account is subject to credit settlement by your bank and will be posted within a maximum of 2 working days.</li>
                          <li>The above amount is inclusive of applicable taxes. All claims are subject to the exclusive jurisdiction of Delhi courts only.</li>
                        </ol>
                      </div>

                      {/* Footer Declaration */}
                      <div className="mt-2 px-2 text-[13px] font-bold">
                        Declaration: I, <span className="underline">{selectedTx.candidateName}</span>, have read and understood all the above terms and conditions and agree to abide by them.
                      </div>

                      {/* Signature Section */}
                      <div className="mt-10 flex justify-end px-2">
                        <div className="text-right text-[11px] font-bold relative min-w-[200px]">
                          {selectedTx.candidateSignature && (
                            <div className="absolute -top-12 right-0 w-32 flex justify-center">
                              <img
                                src={selectedTx.candidateSignature}
                                alt="Candidate Signature"
                                className="h-12 w-auto object-contain mix-blend-multiply"
                                onError={(e) => e.target.style.display = 'none'}
                              />
                            </div>
                          )}
                          <p>Candidate Signature: ________________</p>
                          <p>Date: {formatDate(selectedTx.date).split(',')[0]}</p>
                        </div>
                      </div>

                      <div className="mt-10 pt-1 border-t border-black text-center text-[11px] font-bold">
                        Note: Original Copy for Recipient provided by Nirmanbharat Assistance Council - Tax Invoice
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer (Hidden in print) */}
                <div className="p-4 border-t border-gray-100 print:hidden text-center text-xs text-gray-500">
                  Click "Print / PDF" to save a copy of this invoice.
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>

      {/* Invoice — landing-site theme (applies to the preview and the downloaded PDF) */}
      <style>{INVOICE_THEME_CSS}</style>

      {/* ── Hidden Background Invoice Template for direct downloads ── */}
      <div
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '0',
          width: '1200px',
          zIndex: -999,
          backgroundColor: 'white'
        }}
        ref={invoiceTemplateRef}
      >
        <div style={{ padding: '0px', width: '800px' }}>
          {/* Using the same UI logic as visual modal for consistency */}
          {(() => {
            const tx = downloadingTx || selectedTx;
            if (!tx) return <div className="p-20 text-center font-serif text-gray-400">Loading invoice data...</div>;
            return (
              <div
                className="inv-theme mx-auto bg-white relative"
                style={{
                  width: "100%",
                  minWidth: "700px",
                  padding: "30px",
                  fontFamily: "'Times New Roman', Times, serif",
                  color: "#000",
                  lineHeight: "1.3"
                }}
              >
                {/* Watermark Background */}
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%) rotate(-15deg)",
                  opacity: "0.1",
                  width: "450px",
                  zIndex: "0",
                  pointerEvents: "none"
                }}>
                  <img src={jss_watermark} alt="" className="w-full h-auto" />
                </div>

                <div className="relative z-10">
                  {/* Header Label */}
                  <div className="text-right mb-2">
                    <span className="bg-black text-white px-3 py-0.5 font-bold text-xs">INVOICE</span>
                  </div>

                  {/* Organization Header */}
                  <div className="flex justify-between items-start mb-6">
                    {/* Logo (Left Aligned) */}
                    <div className="flex-shrink-0">
                      <img src={jssa_logo_new} alt="JSSA Logo" className="h-24 w-auto object-contain" />
                    </div>

                    {/* Organization Banner (Right Aligned) */}
                    <div className="flex flex-col items-end text-right">
                      <h1 className="text-xl font-bold text-black leading-tight">
                        जन आरोग्य सहायता अभियान/Jan Aarogya Sahayata Abhiyan
                      </h1>
                      <p className="text-[13px] font-bold text-black">(This Project Is Organized Under Social Welfare Organization)</p>
                      <p className="text-[12px] font-bold text-black">Registration No. : 053083</p>

                      <div className="text-[12px] font-bold space-y-0.5 leading-tight mt-1 text-black">
                        <p>Reg. Off.: Riding Road, Sheikhpura Patna, Bihar - 800014 India</p>
                        <p>Cop. Off. : 15, Kg Marg, Janpath, Marakhamba, New Delhi, 110001, India.</p>
                        <p>Helpline: +91-9471987611 | Email : Support@Jssabhiyan.Com</p>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Meta Bar */}
                  <div className="flex justify-between items-center border-y-2 border-black py-0.5 px-2 font-bold text-[13px] mb-3">
                    <span>Invoice No.: JSSA/26/#{tx.applicationNumber}</span>
                    <span>Date: {formatDate(tx.date).split(',')[0]}</span>
                  </div>

                  {/* Title */}
                  <div className="text-center mb-4">
                    <h2 className="text-[14px] font-bold bg-white px-4 flex items-center justify-center gap-2">
                      INVOICE (Application Fee)
                    </h2>
                  </div>

                  {/* Candidate Details */}
                  <div className="space-y-2 mb-3 text-[13px] px-2 font-bold">
                    <div className="flex">
                      <span className="w-40 flex-shrink-0">Candidate Name</span>
                      <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5">: {tx.candidateName}</span>
                    </div>
                    <div className="flex">
                      <span className="w-40 flex-shrink-0">Post Applied For</span>
                      <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5">: {tx.jobTitle}</span>
                    </div>
                    <div className="flex">
                      <span className="w-40 flex-shrink-0">Address</span>
                      <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5">: {tx.address}, {tx.district}, {tx.state}</span>
                    </div>
                    <div className="flex">
                      <span className="w-40 flex-shrink-0">Mobile No.</span>
                      <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5">: {tx.mobile}</span>
                    </div>
                    <div className="flex">
                      <span className="w-40 flex-shrink-0">Email ID</span>
                      <span className="flex-1 border-b border-dotted border-gray-400 pb-0.5">: {tx.email}</span>
                    </div>
                  </div>

                  {/* Fee Table section */}
                  <div className="mb-5 px-2">
                    <h3 className="font-bold text-[13px] mb-2">Fee Details:</h3>
                    <div className="pl-8 space-y-1.5">
                      <p className="font-bold text-[13px]">
                        1.Application Fee - ₹{tx.amount}/-
                      </p>
                      <p className="font-bold text-[13px]">
                        2.Total Amount: ₹{tx.amount}/- ({numberToWords(tx.amount)} Only)
                      </p>
                      <p className="font-bold text-[13px]">
                        3.Payment Mode: {tx.method ? (tx.method === 'upi' ? 'UPI' : tx.method.charAt(0).toUpperCase() + tx.method.slice(1)) : (tx.paymentId && tx.paymentId.startsWith('pay_') ? 'Online' : 'Cash/Other')}
                      </p>
                      <p className="font-bold text-[13px]">
                        4.Transaction ID: <span className="px-2">{tx.paymentId}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 mb-2 flex flex-col items-start px-2">
                    <p className="font-bold text-sm">B. Kumari</p>
                    <p className="text-[11px] font-bold mb-1">Authorized Signatory</p>
                    <div className="mt-1">
                      <img src={sig_bkumari} alt="Signature" className="h-12 w-auto object-contain" />
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="border-t border-black pt-2 px-2">
                    <h4 className="font-bold text-sm underline mb-2 p-0">Terms & Conditions:</h4>
                    <ol className="list-decimal pl-6 text-[12px] leading-relaxed font-semibold space-y-0.5 text-gray-800">
                      <li>The Application Fee of ₹{tx.amount}/- is a one-time charge and is non-refundable. However, within 24 hours of payment, if the candidate is dissatisfied or wishes to withdraw the application, they may request a refund.</li>
                      <li>In such cases, the organization will review the request, and the refund may be granted as per applicable rules and policies.</li>
                      <li>This fee is charged solely for application processing purposes. No refund will be provided once the examination has been conducted.</li>
                      <li>All information provided by the candidate must be true and verified. In case of any false or misleading information, the application may be rejected.</li>
                      <li>Payment posting to your account is subject to credit settlement by your bank and will be posted within a maximum of 2 working days.</li>
                      <li>The above amount is inclusive of applicable taxes. All claims are subject to the exclusive jurisdiction of Delhi courts only.</li>
                    </ol>
                  </div>

                  {/* Footer Declaration */}
                  <div className="mt-2 px-2 text-[13px] font-bold">
                    Declaration: I, <span className="underline">{tx.candidateName}</span>, have read and understood all the above terms and conditions and agree to abide by them.
                  </div>

                  {/* Signature Section */}
                  <div className="mt-10 flex justify-end px-2">
                    <div className="text-right text-[11px] font-bold relative min-w-[200px]">
                      {tx.candidateSignature && (
                        <div className="absolute -top-12 right-0 w-32 flex justify-center">
                          <img
                            src={tx.candidateSignature}
                            alt="Candidate Signature"
                            className="h-12 w-auto object-contain mix-blend-multiply"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                      )}
                      <p>Candidate Signature: ________________</p>
                      <p>Date: {formatDate(tx.date).split(',')[0]}</p>
                    </div>
                  </div>

                  <div className="mt-10 pt-1 border-t border-black text-center text-[11px] font-bold">
                    Note: Original Copy for Recipient provided by Nirmanbharat Assistance Council - Tax Invoice
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
};


// Landing-site palette: dark-green #3F6212, green #4D7C0F. Applies to the list only, not the invoice.
const TX_BLUE_CSS = `
.tx-hero{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;padding:22px 26px;margin-bottom:18px;border-radius:10px;color:#fff;
  background:linear-gradient(100deg,#3F6212 0%,#4D7C0F 55%,#65A30D 100%);box-shadow:0 6px 16px rgba(77,124,15,.22);text-shadow:0 1px 2px rgba(26,46,5,.35);}
.tx-kicker{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#fff;font-weight:800;margin:0 0 4px;}
.tx-hero h1{font-size:25px;font-weight:800;margin:0 0 4px;color:#fff;}
.tx-sub{font-size:14px;color:#fff;font-weight:500;margin:0;}
.tx-hero-stat{min-width:130px;background:#fff;border-radius:8px;padding:12px 16px;box-shadow:0 4px 12px rgba(18,59,104,.18);text-shadow:none;}
.tx-hero-stat span{display:block;font-size:26px;font-weight:800;line-height:1;color:#3F6212;}
.tx-hero-stat small{display:block;font-size:12px;color:#4D7C0F;margin-top:6px;font-weight:700;}
.tx-zebra tbody tr:nth-child(even){background:#ECFCCB;}
@media(max-width:640px){.tx-hero{padding:18px;}.tx-hero h1{font-size:21px;}.tx-hero-stat{width:100%;}}
@media(max-width:639px){.tx-search{height:42px;flex:none;}}
`;

export default TransactionHistory;

// Invoice — landing-site theme (dark-green #3F6212, green #4D7C0F, Segoe UI)
const INVOICE_THEME_CSS = `
.inv-theme{font-family:'Segoe UI',Arial,Helvetica,sans-serif!important;color:#1f2937!important;border-top:6px solid #3F6212!important;}
.inv-theme *{font-family:inherit!important;}
.inv-theme .bg-black{background:#3F6212!important;border-radius:3px;padding:4px 14px!important;letter-spacing:.12em;}
.inv-theme h1{color:#3F6212!important;}
.inv-theme .text-black{color:#334155!important;}
.inv-theme .border-black{border-color:#4D7C0F!important;}
.inv-theme .border-y-2{background:#ECFCCB;color:#3F6212;border-radius:2px;padding-top:6px!important;padding-bottom:6px!important;}
.inv-theme h2{display:inline-flex!important;background:#4D7C0F!important;color:#fff!important;padding:6px 18px!important;border-radius:4px;letter-spacing:.04em;}
.inv-theme h3,.inv-theme h4{color:#3F6212!important;}
.inv-theme .border-dotted{border-color:#D9F99D!important;}
.inv-theme .space-y-2 > .flex > span:first-child{color:#3F6212;}
`;
