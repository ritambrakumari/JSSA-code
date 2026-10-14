import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { pharmaciesAPI } from "../../utils/api";
import { FileText, Check, Loader2, Clock, User, Eye, Pill, X } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const PendingPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrescriptions(page);
  }, [filterStatus, page]);

  const handleFilterStatusChange = (status) => {
    setFilterStatus(status);
    setPage(1);
  };

  const fetchPrescriptions = async (pageNum = page) => {
    setLoading(true);
    try {
      const res = await pharmaciesAPI.getPrescriptions({ status: filterStatus, page: pageNum, limit: 10 });
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

  const handleComplete = async (prescriptionId) => {
    if (!window.confirm("Are you sure you want to mark this prescription as completed?")) return;

    setUpdatingId(prescriptionId);
    try {
      const res = await pharmaciesAPI.dispensePrescription(prescriptionId);
      if (res.success) {
        toast.success("Prescription completed successfully!");
        if (filterStatus === "pending") {
          fetchPrescriptions(page);
        } else {
          fetchPrescriptions(page); // Refresh to update status
        }
        if (selectedPrescription?._id === prescriptionId) {
          setIsModalOpen(false);
        }
      } else {
        toast.error(res.error || "Failed to complete prescription");
      }
    } catch (error) {
      toast.error("Failed to complete prescription");
    } finally {
      setUpdatingId(null);
    }
  };

  const openViewModal = (prescription) => {
    setSelectedPrescription(prescription);
    setIsModalOpen(true);
  };

  const createBillFromPrescription = (prescription) => {
    // Navigate to create bill page passing the prescription items in state
    navigate("/pharmacy/dashboard/bills/create", { state: { prescription } });
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30 shrink-0">
                <FileText className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Prescriptions</h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Manage all pharmacy prescriptions</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-none text-center md:text-right shrink-0">
              <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none">
                {filterStatus === 'pending' ? 'Pending Count' : filterStatus === 'completed' ? 'Completed Count' : 'Total Records'}
              </p>
              <p className="text-xl font-black text-white uppercase mt-1">{pagination.total}</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 border-b-2 border-gray-100 pb-4">
            <button
              onClick={() => handleFilterStatusChange("all")}
              className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-colors rounded-none border ${
                filterStatus === "all"
                  ? "bg-[#3AB000] text-white border-[#3AB000]"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterStatusChange("pending")}
              className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-colors rounded-none border ${
                filterStatus === "pending"
                  ? "bg-[#3AB000] text-white border-[#3AB000]"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => handleFilterStatusChange("completed")}
              className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-colors rounded-none border ${
                filterStatus === "completed"
                  ? "bg-[#3AB000] text-white border-[#3AB000]"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Completed
            </button>
          </div>

          <div className="bg-white border-2 border-gray-100 rounded-none overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#3AB000] text-white text-[10px] uppercase tracking-[0.2em]">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Cardholder</th>
                    <th className="px-6 py-4">Doctor</th>
                    <th className="px-6 py-4">Medicines</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="w-10 h-10 animate-spin text-[#3AB000] mb-4" />
                          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Loading prescriptions...</p>
                        </div>
                      </td>
                    </tr>
                  ) : prescriptions.length === 0 ? (
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
                            {new Date(prescription.createdAt).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-1">
                            Token #{prescription.tokenId?.tokenNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-800 text-sm">{prescription.cardholderId?.name}</div>
                          <div className="text-xs text-gray-500 font-medium">{prescription.cardholderId?.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {prescription.doctorId?.image ? (
                              <img src={prescription.doctorId.image} alt="Dr" className="w-8 h-8 rounded-none border border-gray-200 object-cover" />
                            ) : (
                              <div className="w-8 h-8 bg-green-50 text-green-700 border border-green-200 flex items-center justify-center font-bold text-[10px] uppercase">
                                Dr
                              </div>
                            )}
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
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openViewModal(prescription)}
                              className="px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-none flex items-center gap-1 hover:bg-blue-50 transition-colors text-[10px] font-black uppercase tracking-widest shadow-sm"
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
                            {prescription.status !== "dispensed" ? (
                              <>
                                <button
                                  onClick={() => createBillFromPrescription(prescription)}
                                  className="px-3 py-1.5 bg-white border border-orange-400 text-orange-600 rounded-none flex items-center gap-1 hover:bg-orange-50 transition-colors text-[10px] font-black uppercase tracking-widest shadow-sm"
                                >
                                  <FileText className="w-3 h-3" /> Generate Bill
                                </button>
                                <button
                                  onClick={() => handleComplete(prescription._id)}
                                  disabled={updatingId === prescription._id || !prescription.billGenerated}
                                  title={!prescription.billGenerated ? "Generate bill first to enable" : "Mark completed"}
                                  className="px-3 py-1.5 bg-white border border-[#3AB000] text-[#3AB000] rounded-none flex items-center gap-1 hover:bg-green-50 transition-colors text-[10px] font-black uppercase tracking-widest shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {updatingId === prescription._id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                  Complete
                                </button>
                              </>
                            ) : (
                              <span className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-none flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                                <Check className="w-3 h-3" /> Completed
                              </span>
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
            <div className="flex flex-col md:flex-row items-center justify-between mt-auto border-t border-gray-100 bg-gray-50 p-4 gap-4 mb-6 border-x-2 border-b-2">
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

      {/* View Prescription Modal */}
      {isModalOpen && selectedPrescription && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col rounded-none border border-[#3AB000]">
            {/* Header */}
            <div className="bg-[#3AB000] px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                <FileText size={14} /> Prescription Details
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <div className="bg-white border-2 border-gray-100 p-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-gray-100 pb-6">
                  <div>
                    <h3 className="text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em]">Patient Details</h3>
                    <p className="font-black text-lg text-gray-800">{selectedPrescription.cardholderId?.name}</p>
                    <p className="text-gray-600 text-sm mt-1 font-medium">Phone: {selectedPrescription.cardholderId?.phone}</p>
                    {selectedPrescription.cardholderId?.age && <p className="text-gray-600 text-sm font-medium">Age: {selectedPrescription.cardholderId?.age} years</p>}
                  </div>
                  <div className="text-left md:text-right">
                    <h3 className="text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em]">Doctor Details</h3>
                    <p className="font-black text-lg text-gray-800">Dr. {selectedPrescription.doctorId?.name}</p>
                    <p className="text-gray-600 text-sm font-medium mt-1">{selectedPrescription.doctorId?.specification}</p>
                    <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">{selectedPrescription.doctorId?.clinicAddress}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-[10px] font-black text-gray-500 mb-4 uppercase tracking-[0.2em]">Prescribed Medicines</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-2 border-gray-100">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3 border-b-2 border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-600">Medicine</th>
                          <th className="p-3 border-b-2 border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-600">Type</th>
                          <th className="p-3 border-b-2 border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-600">Dosage</th>
                          <th className="p-3 border-b-2 border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-600">Frequency</th>
                          <th className="p-3 border-b-2 border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-600">Duration</th>
                          <th className="p-3 border-b-2 border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-600">Instructions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPrescription.medicines?.map((med, idx) => (
                          <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                            <td className="p-3 font-bold text-gray-800 flex items-center gap-2">
                              <Pill className="w-3.5 h-3.5 text-[#3AB000]" />
                              {med.name}
                            </td>
                            <td className="p-3 text-gray-600 text-xs font-medium">{med.type}</td>
                            <td className="p-3 text-gray-600 text-xs font-medium">{med.dosage}</td>
                            <td className="p-3 text-gray-600 text-xs font-medium">{med.frequency}</td>
                            <td className="p-3 text-gray-600 text-xs font-medium">{med.duration}</td>
                            <td className="p-3 text-gray-500 text-xs italic">{med.instructions || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedPrescription.notes && (
                  <div className="mt-6">
                    <h3 className="text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em]">Doctor's Notes / Diagnosis</h3>
                    <div className="p-4 bg-[#fffdf0] border border-[#ffea80] text-yellow-800 rounded-none whitespace-pre-line text-sm font-medium">
                      {selectedPrescription.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-6 flex justify-between items-center border-t-4 border-[#3AB000]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-white border-2 border-gray-200 rounded-none font-black text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all uppercase text-[10px] tracking-widest shadow-sm"
              >
                Close
              </button>
              <div className="flex gap-4">
                <button
                  onClick={() => createBillFromPrescription(selectedPrescription)}
                  className="px-6 py-2.5 bg-blue-600 text-white border-2 border-blue-600 rounded-none font-black hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm uppercase text-[10px] tracking-widest"
                >
                  <FileText className="w-3.5 h-3.5" /> Generate Bill
                </button>
                <button
                  onClick={() => handleComplete(selectedPrescription._id)}
                  disabled={updatingId === selectedPrescription._id || !selectedPrescription.billGenerated}
                  title={!selectedPrescription.billGenerated ? "Generate bill first to enable" : "Mark completed"}
                  className="px-6 py-2.5 bg-[#3AB000] text-white border-2 border-[#3AB000] rounded-none font-black hover:bg-[#2d8a00] hover:border-[#2d8a00] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase text-[10px] tracking-widest"
                >
                  {updatingId === selectedPrescription._id ? "Completing..." : "Mark Completed"}
                  {!updatingId && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PendingPrescriptions;
