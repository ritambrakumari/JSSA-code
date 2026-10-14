import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { pharmacyBillsAPI, pharmaciesAPI } from "../../utils/api";
import { FileText, Plus, Download, Printer, Eye, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import Pagination from "../../components/Pagination";

const PharmacyBillList = () => {
  const [bills, setBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [totalBills, setTotalBills] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pharmacyDetails, setPharmacyDetails] = useState(null);
  const [shopName, setShopName] = useState("PHARMACY INVOICE");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();
  const billRef = useRef();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchBills();
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchPharmacyDetails();
  }, []);

  const fetchPharmacyDetails = async () => {
    try {
      const res = await pharmaciesAPI.getProfile();
      if (res.success && res.pharmacy) {
        setPharmacyDetails(res.pharmacy);
        if (res.pharmacy.shopName) {
          setShopName(res.pharmacy.shopName.toUpperCase());
        }
      }
    } catch (error) {
      console.error("Failed to load pharmacy details", error);
    }
  };

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      const res = await pharmacyBillsAPI.getAll(params);
      if (res.success) {
        setBills(res.bills);
        if (res.totalPages) setTotalPages(res.totalPages);
        if (res.totalBills !== undefined) setTotalBills(res.totalBills);
      }
    } catch (error) {
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const openBillModal = (bill) => {
    setSelectedBill(bill);
    setIsModalOpen(true);
  };

  const downloadBillPDF = async (bill) => {
    if (!billRef.current) return;
    setIsDownloading(true);
    const element = billRef.current;
    const opt = {
      margin: 10,
      filename: `Invoice_${bill._id.substring(bill._id.length - 8).toUpperCase()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      toast.error("Failed to download PDF");
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DashboardLayout role="pharmacy">
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">

          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30">
                <FileText className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Bill History</h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-wider mt-2">Manage and view all your generated bills</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-none text-center md:text-right shrink-0">
              <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Total Bills</p>
              <p className="text-xl font-black text-white uppercase mt-1">{totalBills}</p>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-gray-50 border border-gray-150 p-4 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 mt-6 md:mt-0">
            <div className="flex items-center gap-2 shrink-0">
              <FileText size={14} className="text-[#3AB000]" />
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Bill Controls</span>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full md:max-w-3xl lg:ml-auto">
              <div className="relative w-full">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input
                  type="text"
                  placeholder="Search by customer name or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-10 h-9 border border-gray-200 rounded-none focus:ring-1 focus:ring-[#3AB000] outline-none text-[11px] font-bold bg-white"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate("/pharmacy/dashboard/bills/create")}
                className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-[10px] px-5 h-9 font-black uppercase tracking-wider transition-all flex items-center gap-2 rounded-none shadow-sm shrink-0"
              >
                <Plus size={14} /> Create New Bill
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-none border border-gray-200 overflow-hidden relative min-h-[400px] flex flex-col justify-between">
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-400 space-y-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3AB000] mx-auto"></div>
                <p className="text-[10px] font-black uppercase tracking-wider">Loading...</p>
              </div>
            ) : bills.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-400 space-y-3">
                <FileText size={24} className="text-gray-300" />
                <p className="text-[10px] font-black uppercase tracking-wider">No Bills Found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 font-black uppercase text-[11px] tracking-wider border-b border-gray-150">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4">Mobile Number</th>
                      <th className="px-6 py-4 text-center">Type</th>
                      <th className="px-6 py-4 text-center">Items</th>
                      <th className="px-6 py-4 text-right">Total Amount</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bills.map((bill) => (
                      <tr key={bill._id} className="hover:bg-[#f9fff5] transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-xs font-bold text-gray-600 uppercase">{new Date(bill.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-semibold text-gray-900 uppercase">{bill.customerName}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-xs font-bold text-gray-700">{bill.customerMobile}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {bill.isCardHolder ? (
                            <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest border rounded-none bg-[#f9fff5] text-[#3AB000] border-[#3AB000]/30">CardHolder</span>
                          ) : (
                            <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest border rounded-none bg-gray-50 text-gray-600 border-gray-200">Regular</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider border rounded-none bg-gray-50 text-gray-600 border-gray-200">
                            {bill.items.reduce((sum, item) => sum + item.quantity, 0)} Items
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <p className="text-[14px] font-black text-[#3AB000]">₹{bill.finalAmount.toFixed(2)}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openBillModal(bill)}
                              className="px-3 h-8 flex items-center justify-center gap-1.5 bg-[#f9fff5] text-[#3AB000] border border-[#3AB000]/30 hover:bg-[#3AB000] hover:text-white transition-all rounded-none text-[9px] font-black uppercase tracking-wider"
                              title="View Invoice"
                            >
                              <Eye size={12} /> View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination UI */}
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
          </div>
        </div>
      </div>

      {/* Bill Details Modal */}
      {isModalOpen && selectedBill && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto relative rounded-sm shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10 shadow-sm">
              <h2 className="font-black text-gray-800 uppercase tracking-wider text-sm">Invoice Preview</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => downloadBillPDF(selectedBill)}
                  disabled={isDownloading}
                  className="flex items-center gap-2 bg-[#3AB000] text-white px-4 h-8 rounded-none text-[9px] font-black uppercase tracking-wider hover:bg-[#2d8a00] transition-colors disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  {isDownloading ? "DOWNLOADING..." : "DOWNLOAD PDF"}
                </button>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-500 hover:text-red-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Bill Preview Area (using billRef) */}
            <div className="p-8 bg-gray-50 flex justify-center">
              <div ref={billRef} className="p-8 bg-white text-black relative min-h-[500px] flex flex-col border-2 border-gray-200 shadow-sm w-full max-w-3xl font-sans">
                {/* INVOICE BADGE */}
                <div className="absolute top-0 right-8 bg-green-700 text-white px-5 py-1.5 rounded-b-md shadow-sm text-[10px] font-black tracking-[0.3em] uppercase">
                  Invoice
                </div>

                <div className="flex-1">
                  {/* Header Section */}
                  <div className="flex flex-col md:flex-row justify-between items-start mb-8 pb-6 border-b-2 border-gray-800 gap-6">
                    <div className="flex-1">
                      <h1 className="text-3xl font-black uppercase tracking-wider text-green-700 leading-none mb-3">{shopName}</h1>
                      {pharmacyDetails && (
                        <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider space-y-1.5 leading-relaxed">
                          {pharmacyDetails.shopAddress && <p className="max-w-xs">{pharmacyDetails.shopAddress}</p>}
                          <p>
                            {pharmacyDetails.userId?.phone ? `Ph: ${pharmacyDetails.userId.phone}` : ""}
                            {pharmacyDetails.userId?.phone && pharmacyDetails.userId?.email ? " | " : ""}
                            {pharmacyDetails.userId?.email ? `Email: ${pharmacyDetails.userId.email}` : ""}
                          </p>
                          <p>
                            {pharmacyDetails.gstNumber ? `GST: ${pharmacyDetails.gstNumber}` : ""}
                            {pharmacyDetails.gstNumber && pharmacyDetails.licenseNumber ? " | " : ""}
                            {pharmacyDetails.licenseNumber ? `D.L. No: ${pharmacyDetails.licenseNumber}` : ""}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right pt-6 md:pt-0">
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-sm min-w-[160px]">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Invoice No</p>
                        <p className="text-sm font-bold text-gray-900">{selectedBill._id.substring(selectedBill._id.length - 8).toUpperCase()}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mt-3 mb-1">Date</p>
                        <p className="text-sm font-bold text-gray-900">{new Date(selectedBill.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Billed To Section */}
                  <div className="mb-8 p-4 border border-gray-200 bg-gray-50 rounded-sm">
                    <h3 className="font-black text-gray-400 uppercase text-[10px] tracking-widest mb-2 border-b border-gray-200 pb-2">Billed To</h3>
                    <p className="font-black text-gray-900 text-sm mt-2 uppercase">{selectedBill.customerName}</p>
                    <p className="text-gray-600 text-xs font-bold mt-1">Ph: {selectedBill.customerMobile}</p>
                    {selectedBill.isCardHolder && (
                      <p className="text-green-700 font-black text-[10px] tracking-wider mt-2 uppercase flex items-center gap-1">
                        ✓ JSSA Cardholder
                      </p>
                    )}
                  </div>

                  {/* Items Table */}
                  <div className="mb-8">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-gray-100 border-b-2 border-gray-300 text-left">
                          <th className="p-3 font-black uppercase text-[10px] tracking-widest text-gray-700 border-r border-gray-300">Description</th>
                          <th className="p-3 font-black uppercase text-[10px] tracking-widest text-gray-700 text-right border-r border-gray-300 w-24">Price</th>
                          <th className="p-3 font-black uppercase text-[10px] tracking-widest text-gray-700 text-center border-r border-gray-300 w-20">Qty</th>
                          <th className="p-3 font-black uppercase text-[10px] tracking-widest text-gray-700 text-right w-28">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedBill.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-3 text-gray-900 font-bold border-r border-gray-300">{item.name}</td>
                            <td className="p-3 text-right text-gray-600 font-bold border-r border-gray-300">₹{item.price.toFixed(2)}</td>
                            <td className="p-3 text-center font-black text-gray-900 border-r border-gray-300">{item.quantity}</td>
                            <td className="p-3 text-right font-black text-gray-900">₹{item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Section */}
                  <div className="flex justify-end mb-12">
                    <div className="w-72 border border-gray-300 bg-gray-50 rounded-sm p-4 shadow-sm">
                      <div className="flex justify-between py-1.5 text-sm">
                        <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Subtotal:</span>
                        <span className="font-black text-gray-900">₹{selectedBill.subTotal.toFixed(2)}</span>
                      </div>
                      {selectedBill.discountPercent > 0 && (
                        <div className="flex justify-between py-1.5 text-green-600 text-sm">
                          <span className="font-bold uppercase tracking-wider text-[10px]">Discount ({selectedBill.discountPercent}%):</span>
                          <span className="font-black">-₹{selectedBill.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-4 border-t-2 border-gray-300 mt-2">
                        <span className="font-black uppercase tracking-wider text-gray-900 text-xs mt-1">Grand Total:</span>
                        <span className="font-black text-2xl text-green-700">₹{selectedBill.finalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 pb-4 text-center border-t border-gray-300 bg-gray-50 -mx-8 -mb-8">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Powered by JSSA Platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PharmacyBillList;
