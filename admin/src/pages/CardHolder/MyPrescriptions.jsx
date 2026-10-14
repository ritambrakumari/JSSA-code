import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { doctorsAPI, pharmacyBillsAPI } from "../../utils/api";
import { FileText, Download, Loader2, Clock, User, Eye, Pill, Stethoscope, X } from "lucide-react";
import toast from "react-hot-toast";
import html2pdf from "html2pdf.js";

const cleanImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;
  if (url.includes("localhost:") && url.includes("/api/")) {
    const parts = url.split("/api/");
    return `https://api.jssabhiyan.com/api/${parts[1]}`;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api/")) return `https://api.jssabhiyan.com${url}`;
  if (url.startsWith("/")) return `https://api.jssabhiyan.com/api${url}`;
  if (url.startsWith("uploads/") || url.startsWith("files/")) return `https://api.jssabhiyan.com/api/${url}`;
  const cleanPath = url.startsWith("/") ? url.slice(1) : url;
  return `https://api.jssabhiyan.com/api/files/${cleanPath}`;
};

const MyPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loadingBill, setLoadingBill] = useState(false);
  const pdfRef = useRef();

  useEffect(() => {
    fetchMyPrescriptions(page);
  }, [page]);

  const fetchMyPrescriptions = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await doctorsAPI.getMyPrescriptions(pageNum, 10);
      if (res.success) {
        setPrescriptions(res.prescriptions);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch prescriptions", error);
      toast.error("Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (prescription) => {
    setSelectedPrescription(prescription);
    setIsModalOpen(true);
  };

  const openViewBillModal = async (prescription) => {
    setLoadingBill(true);
    try {
      const res = await pharmacyBillsAPI.getByPrescriptionId(prescription._id);
      if (res.success && res.bill) {
        setSelectedBill({ ...res.bill, pharmacyUser: res.pharmacyUser });
        setIsBillModalOpen(true);
      } else {
        toast.error("Bill not found for this prescription.");
      }
    } catch (error) {
      toast.error("Failed to load bill");
    } finally {
      setLoadingBill(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedPrescription || !pdfRef.current) return;
    setIsDownloading(true);
    
    try {
      const element = pdfRef.current;
      const opt = {
        margin: 10,
        filename: `Prescription_${selectedPrescription.tokenId?.tokenNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
      toast.success("Prescription downloaded!");
    } catch (error) {
      console.error("Error downloading PDF", error);
      toast.error("Failed to download prescription");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[70vh]">
          <Loader2 className="w-10 h-10 animate-spin text-[#3AB000]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30 shrink-0">
                <FileText className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">My Prescriptions</h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">View your doctor prescriptions</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-none text-center md:text-right shrink-0">
              <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Total Records</p>
              <p className="text-xl font-black text-white mt-1 leading-none">{pagination.total}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-none min-h-[400px] flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#3AB000] text-white text-[10px] uppercase tracking-[0.2em]">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Doctor</th>
                    <th className="px-6 py-4">Medicines</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {prescriptions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-gray-500 font-bold text-xs uppercase tracking-widest">
                        No prescriptions found.
                      </td>
                    </tr>
                  ) : (
                    prescriptions.map((prescription) => (
                      <tr key={prescription._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(prescription.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-1">
                            Token #{prescription.tokenId?.tokenNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Stethoscope className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="font-bold text-sm text-gray-800">Dr. {prescription.doctorId?.name}</div>
                              <div className="text-[10px] uppercase font-black tracking-widest text-gray-500 mt-0.5">{prescription.doctorId?.specification}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {prescription.medicines?.slice(0, 2).map((med, idx) => (
                              <span key={idx} className="bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-none text-[10px] font-black uppercase tracking-widest">
                                {med.name}
                              </span>
                            ))}
                            {prescription.medicines?.length > 2 && (
                              <span className="bg-gray-100 border border-gray-200 text-gray-500 px-2.5 py-1 rounded-none text-[10px] font-black uppercase tracking-widest">
                                +{prescription.medicines.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {prescription.status === "pending_pharmacy" ? (
                            <span className="inline-flex items-center px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-none text-[9px] font-black uppercase tracking-widest">
                              Visit Pharmacy
                            </span>
                          ) : prescription.status === "dispensed" ? (
                            <span className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-none text-[9px] font-black uppercase tracking-widest">
                              Received
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-none text-[9px] font-black uppercase tracking-widest">
                              {prescription.status}
                            </span>
                          )}
                          
                          {(() => {
                            const pharmacy = prescription.pharmacyId || (prescription.medicines?.[0]?.medicineId?.pharmacyId);
                            if (pharmacy) {
                              return (
                                <div className="mt-2 flex flex-col gap-0.5">
                                  <span className="text-[10px] font-black text-[#3AB000] uppercase tracking-wider truncate max-w-[150px]" title={pharmacy.shopName || pharmacy.businessName || pharmacy.name}>
                                    {pharmacy.shopName || pharmacy.businessName || pharmacy.name || "Unknown Pharmacy"}
                                  </span>
                                  <span className="text-[9px] text-gray-500 truncate max-w-[150px]" title={pharmacy.address}>
                                    {pharmacy.address}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openViewModal(prescription)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors text-[10px] font-black uppercase tracking-widest rounded-none shadow-sm ml-auto"
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
                            {prescription.billGenerated && (
                              <button
                                onClick={() => openViewBillModal(prescription)}
                                disabled={loadingBill}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-green-600 text-green-600 hover:bg-green-50 transition-colors text-[10px] font-black uppercase tracking-widest rounded-none shadow-sm disabled:opacity-50"
                              >
                                {loadingBill ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                                View Bill
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
            
            {/* Pagination UI */}
            {pagination.total > 0 && (
              <div className="flex flex-col md:flex-row items-center justify-between mt-auto border-t border-gray-100 bg-gray-50 p-4 gap-4">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Showing {prescriptions.length} of {pagination.total} Prescriptions
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 bg-white border border-gray-250 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all"
                  >
                    Prev
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                      let pageNum = 1;
                      if (pagination.pages <= 5) pageNum = i + 1;
                      else if (page <= 3) pageNum = i + 1;
                      else if (page >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
                      else pageNum = page - 2 + i;
                      if (pageNum > pagination.pages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center text-[10px] font-black transition-all border rounded-none ${page === pageNum
                            ? "bg-[#3AB000] border-[#3AB000] text-white scale-110"
                            : "bg-white border-gray-250 text-gray-400 hover:border-[#3AB000]"
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    disabled={page === pagination.pages}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 bg-white border border-gray-250 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Prescription Modal (Prescription Pad Style) */}
      {isModalOpen && selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-3xl shadow-2xl flex flex-col my-8 relative rounded-none">

            {/* Close Button Floating */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
            >
              <X size={16} />
            </button>

            {/* Prescription Pad Container */}
            <div ref={pdfRef} className="p-8 md:p-12 border-t-8 border-[#3AB000] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] relative print:border-none print:shadow-none print:p-0">

              {/* Doctor Header */}
              <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-gray-200 pb-6 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-[#1a5000] uppercase tracking-wider">
                    Dr. {selectedPrescription.doctorId?.name || "Doctor Name"}
                  </h2>
                  <p className="text-sm font-bold text-gray-600 uppercase tracking-widest mt-1">
                    {selectedPrescription.doctorId?.specification || "Medical Specialist"}
                  </p>
                </div>
                <div className="text-left md:text-right mt-4 md:mt-0">
                  <div className="inline-block px-4 py-2 border-2 border-[#3AB000] text-[#3AB000] font-black uppercase tracking-widest text-lg mb-2 bg-green-50/50 max-w-[250px] whitespace-normal break-words">
                    {selectedPrescription.doctorId?.clinicName || selectedPrescription.doctorId?.clinicAddress || "Clinic / Hospital"}
                  </div>

                </div>
              </div>

              {/* Patient Details Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-none mb-8 border border-gray-200">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Patient Name</p>
                  <p className="text-sm font-bold text-gray-900 uppercase break-words">
                    {selectedPrescription.tokenId?.cardId?.cardholderName || selectedPrescription.cardholderId?.name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Date</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(selectedPrescription.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Token / ID</p>
                  <p className="text-sm font-bold text-gray-900 break-words">{selectedPrescription.tokenId?.tokenNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Card ID</p>
                  <p className="text-sm font-bold text-gray-900 break-words">
                    {selectedPrescription.tokenId?.cardId?.cardId ? selectedPrescription.tokenId.cardId.cardId : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Phone No.</p>
                  <p className="text-sm font-bold text-gray-900 break-words">
                    {selectedPrescription.cardholderId?.phone || "N/A"}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="min-h-[300px]">
                <div className="flex gap-4 mb-6">
                  <div className="text-5xl font-serif font-bold text-[#3AB000] italic opacity-80 leading-none">
                    Rx
                  </div>
                  <div className="w-full pt-2 overflow-x-auto">
                    {selectedPrescription.medicines && selectedPrescription.medicines.length > 0 ? (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b-2 border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            <th className="pb-3 w-10">#</th>
                            <th className="pb-3">Medicine Name</th>
                            <th className="pb-3">Dosage</th>
                            <th className="pb-3">Duration</th>
                            <th className="pb-3 text-right">Source</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedPrescription.medicines.map((med, index) => (
                            <tr key={index} className="group hover:bg-gray-50 transition-colors">
                              <td className="py-4 text-sm font-bold text-gray-400">{index + 1}.</td>
                              <td className="py-4">
                                <p className="text-sm font-bold text-gray-900 uppercase">{med.name || med.medicineId?.name}</p>
                              </td>
                              <td className="py-4 text-sm text-gray-700 font-bold">{med.dosage}</td>
                              <td className="py-4 text-sm text-gray-700">{med.duration}</td>
                              <td className="py-4 text-right">
                                <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest border rounded-none ${med.source === 'in_house' ? 'bg-green-50 text-[#3AB000] border-[#3AB000]/30' : 'bg-orange-50 text-orange-600 border-orange-200'
                                  }`}>
                                  {med.source?.replace("_", " ") || "In House"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-sm text-gray-500 italic mt-2">No medicines prescribed.</p>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                {selectedPrescription.notes && (
                  <div className="mt-10 ml-0 md:ml-[4.5rem]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b-2 border-gray-100 pb-1">Additional Notes / Advice</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap font-medium">{selectedPrescription.notes}</p>
                  </div>
                )}
              </div>

              {/* Footer Section */}
              <div className="mt-16 pt-8 border-t-2 border-dashed border-gray-200 flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="text-left w-full md:w-1/3 flex flex-col justify-end">
                  <p className="text-[12px] font-black uppercase tracking-widest text-gray-400">
                    Powered By <span className="text-gray-800">JSSA</span>
                  </p>
                </div>

                <div className="text-right w-full md:w-1/3 flex flex-col items-end">
                  {selectedPrescription.doctorId?.signatureDoc ? (
                    <img
                      src={cleanImageUrl(selectedPrescription.doctorId.signatureDoc)}
                      alt="Doctor Signature"
                      className="h-16 object-contain mb-2 mix-blend-multiply opacity-90"
                    />
                  ) : (
                    <div className="h-16 w-32 border-b-2 border-gray-800 border-dashed mb-2 opacity-20"></div>
                  )}
                  <p className="text-sm font-bold text-gray-900 uppercase">Dr. {selectedPrescription.doctorId?.name}</p>
                  <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest mt-1">Authorized Signature</p>
                </div>
              </div>

            </div>

            {/* Action Bar (Download & Close) */}
            <div className="bg-gray-100 p-4 border-t border-gray-200 flex justify-end gap-3 items-center rounded-none print:hidden">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-300 text-gray-800 hover:bg-gray-400 px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all shadow-sm"
              >
                Close
              </button>
              
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="bg-[#3AB000] text-white px-6 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-[#2d8a00] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Downloading...
                  </>
                ) : (
                  <>
                    <Download size={14} /> Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Bill Modal */}
      {isBillModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-none border border-gray-200 w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-[#3AB000] p-4 flex justify-between items-center text-white">
              <h2 className="text-sm font-black uppercase flex items-center gap-2 tracking-wider">
                <FileText className="w-4 h-4" /> Pharmacy Invoice
              </h2>
              <button onClick={() => setIsBillModalOpen(false)} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                ✕
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-gray-50">
              <div className="bg-white border-2 border-gray-200 shadow-sm p-8 max-w-2xl mx-auto relative">
                <div className="absolute top-0 right-8 bg-[#3AB000] text-white px-5 py-1.5 shadow-sm text-[10px] font-black tracking-[0.3em] uppercase">
                  Invoice
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 pb-6 border-b-2 border-gray-800 gap-6">
                  <div className="flex-1">
                    <h1 className="text-3xl font-black uppercase tracking-wider text-[#3AB000] leading-none mb-3">
                      {selectedBill.pharmacyId?.shopName || selectedBill.pharmacyId?.name || "PHARMACY INVOICE"}
                    </h1>
                    <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider space-y-1.5 leading-relaxed">
                      {selectedBill.pharmacyId?.shopAddress && <p className="max-w-xs">{selectedBill.pharmacyId.shopAddress}</p>}
                      <p>
                        {selectedBill.pharmacyUser?.phone ? `Ph: ${selectedBill.pharmacyUser.phone}` : ""} 
                        {selectedBill.pharmacyUser?.phone && selectedBill.pharmacyUser?.email ? " | " : ""}
                        {selectedBill.pharmacyUser?.email ? `Email: ${selectedBill.pharmacyUser.email}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right border border-gray-200 bg-gray-50 p-4 min-w-[160px]">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Date</p>
                    <p className="font-bold text-gray-800 text-sm">{new Date(selectedBill.createdAt).toLocaleDateString()}</p>
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">GENERATED</p>
                    </div>
                  </div>
                </div>

                <div className="mb-8 p-4 bg-gray-50 border border-gray-200 flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Billed To</p>
                    <h2 className="font-black text-gray-800 text-base uppercase tracking-wider">{selectedBill.customerName}</h2>
                    <p className="text-xs font-bold text-gray-600 mt-1">Ph: {selectedBill.customerMobile}</p>
                    {selectedBill.isCardHolder && (
                      <p className="text-[9px] font-black text-[#3AB000] uppercase tracking-wider mt-2 flex items-center gap-1">
                        ✓ JSSA Cardholder
                      </p>
                    )}
                  </div>
                </div>

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
                      {selectedBill.items?.map((item, idx) => (
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

                <div className="flex justify-end mb-12">
                  <div className="w-72 border border-gray-300 bg-gray-50 rounded-sm p-4 shadow-sm">
                    <div className="flex justify-between py-1.5 text-sm">
                      <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Subtotal:</span>
                      <span className="font-black text-gray-800">₹{selectedBill.subTotal?.toFixed(2)}</span>
                    </div>
                    {selectedBill.discountPercent > 0 && (
                      <div className="flex justify-between py-1.5 text-sm">
                        <span className="font-bold text-[#3AB000] uppercase tracking-wider text-[10px]">Discount ({selectedBill.discountPercent}%):</span>
                        <span className="font-black text-[#3AB000]">-₹{selectedBill.discountAmount?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-3 border-t-2 border-gray-800 mt-2 text-lg">
                      <span className="font-black text-gray-800 uppercase tracking-wider text-xs flex items-center">Grand Total:</span>
                      <span className="font-black text-[#3AB000]">₹{selectedBill.finalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyPrescriptions;
