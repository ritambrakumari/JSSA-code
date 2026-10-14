import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { feeStructureAPI, jobPostingsAPI } from "../../utils/api";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Wallet,
  GraduationCap,
  IdCard,
  Monitor,
  FileText,
  AlertCircle,
  Eye
} from "lucide-react";

// ── Loading Overlay ──
function LoadingOverlay({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 min-w-[200px]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-[#3AB000] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-bold text-gray-800 animate-pulse">{message}</p>
      </div>
    </div>
  );
}

const STATIC_POSTS = [
  { en: "District Manager", hi: "जिला प्रबंधक" },
  { en: "Block Supervisor cum Panchayat Executive", hi: "प्रखंड पर्यवेक्षक सह पंचायत कार्यपालक" },
  { en: "Panchayat Executive", hi: "पंचायत कार्यपालक" },
];

// ── Fee Form Modal ──
function FeeModal({ isOpen, onClose, data, onSuccess }) {
  const [formData, setFormData] = useState({
    jobPost: "",
    trainingFee: 800,
    idCardFee: 100,
    softwareFee: 640,
    mouFee: 250,
    status: "Active"
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        jobPost: data.jobPost || "",
        trainingFee: data.trainingFee || 800,
        idCardFee: data.idCardFee || 100,
        softwareFee: data.softwareFee || 640,
        mouFee: data.mouFee || 250,
        status: data.status || "Active"
      });
    } else {
      setFormData({
        jobPost: "",
        trainingFee: 800,
        idCardFee: 100,
        softwareFee: 640,
        mouFee: 250,
        status: "Active"
      });
    }
  }, [data, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let res;
      if (data?._id) {
        res = await feeStructureAPI.update(data._id, formData);
      } else {
        res = await feeStructureAPI.create(formData);
      }
      
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        alert(res.error || "Failed to save fee structure");
      }
    } catch (err) {
      alert("Error connecting to server");
    } finally {
      setIsSaving(false);
    }
  };

  const total = Number(formData.trainingFee) + Number(formData.idCardFee) + Number(formData.softwareFee) + Number(formData.mouFee);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
        <div className="flex items-center justify-between px-6 py-4 bg-[#3AB000]">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            {data ? "✏️ Edit Fee Structure" : "💰 Add Fee Structure"}
          </h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Job Post</label>
            <select
              required
              disabled={data}
              value={formData.jobPost}
              onChange={(e) => setFormData({ ...formData, jobPost: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm disabled:bg-gray-50"
            >
              <option value="">Select Job Post (पद चुनें)</option>
              {STATIC_POSTS.map((post) => (
                <option key={post.en} value={post.en}>
                  {post.en} / {post.hi}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block flex items-center gap-1.5">
                <GraduationCap size={12} className="text-[#3AB000]" /> Training Fee
              </label>
              <input
                type="number"
                required
                value={formData.trainingFee}
                onChange={(e) => setFormData({ ...formData, trainingFee: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block flex items-center gap-1.5">
                <IdCard size={12} className="text-[#3AB000]" /> ID Card & Kit Fee
              </label>
              <input
                type="number"
                required
                value={formData.idCardFee}
                onChange={(e) => setFormData({ ...formData, idCardFee: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block flex items-center gap-1.5">
                <Monitor size={12} className="text-[#3AB000]" /> Dashboard Access Fee
              </label>
              <input
                type="number"
                required
                value={formData.softwareFee}
                onChange={(e) => setFormData({ ...formData, softwareFee: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block flex items-center gap-1.5">
                <FileText size={12} className="text-[#3AB000]" /> MOU Processing Fee
              </label>
              <input
                type="number"
                required
                value={formData.mouFee}
                onChange={(e) => setFormData({ ...formData, mouFee: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#3AB000]/5 rounded-lg border border-[#3AB000]/20">
             <span className="text-sm font-bold text-gray-600">Total Payable Fee</span>
             <span className="text-xl font-black text-[#3AB000]">₹{total.toLocaleString()}/-</span>
          </div>

          <div className="px-6 py-4 bg-gray-50 -mx-6 -mb-6 border-t border-gray-100 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
            <button
              disabled={isSaving}
              className="bg-black hover:bg-[#3AB000] text-white text-sm font-medium px-8 py-2.5 rounded-sm transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isSaving ? "Saving..." : <><Save size={16} /> Save Details</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const FeeStructure = () => {
  const [feeData, setFeeData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await feeStructureAPI.getAll();
      if (res.success) setFeeData(res.data);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this fee structure?")) {
      try {
        const res = await feeStructureAPI.delete(id);
        if (res.success) loadData();
        else alert(res.error || "Failed to delete");
      } catch {
        alert("Server error");
      }
    }
  };

  const filteredData = feeData.filter((item) => {
     const postName = String(item.jobPost || "").toLowerCase();
     return postName.includes(searchQuery.toLowerCase());
  });

  return (
    <DashboardLayout activePath="/fee-structure">
      {(isLoading) && <LoadingOverlay message="Loading Fees..." />}

      <div className="p-0 ml-0 md:ml-6 px-2 md:px-0 mt-4 h-full">
        {/* ── Top Bar (JobPosting/MOU Style) ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pr-0 md:pr-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 w-full">
            {/* Search Group */}
            <div className="flex items-center border border-gray-300 rounded overflow-hidden h-10 flex-1 w-full sm:max-w-[500px] shadow-sm">
              <input
                type="text"
                placeholder="Search by Job Post name..."
                className="flex-1 px-3 sm:px-4 text-xs sm:text-sm text-gray-700 focus:outline-none h-full bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs sm:text-sm px-4 sm:px-6 h-full font-medium transition-colors whitespace-nowrap"
              >
                Search
              </button>
            </div>
          </div>
          
          <button 
            onClick={() => { setSelectedFee(null); setIsModalOpen(true); }}
            className="bg-black hover:bg-[#3AB000] text-white text-xs sm:text-sm font-medium px-4 sm:px-6 py-2.5 rounded-sm transition-colors whitespace-nowrap w-full sm:w-auto shadow-sm"
          >
            + Add New Fee
          </button>
        </div>

        {/* ── Desktop Table (MOU Style) ── */}
        <div className="hidden md:block bg-white rounded overflow-hidden border border-gray-200 shadow-sm pr-0 md:pr-4 mr-0 md:mr-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#3AB000]">
                  {[
                    "Job Post",
                    "Training Fee",
                    "ID & Kit",
                    "Dashboard",
                    "MOU Fee",
                    "Total Fee",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-400 text-sm italic">
                      No fee structures found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((fee, idx) => (
                    <tr
                      key={fee._id}
                      className="border-b border-gray-100 hover:bg-[#e8f5e2] transition-colors"
                    >
                      <td className="px-4 py-4 text-center text-[#2d8a00] font-semibold">
                        {fee.jobPost || "Unknown Post"}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700 font-medium whitespace-nowrap">
                        ₹{fee.trainingFee}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700 whitespace-nowrap">
                        ₹{fee.idCardFee}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700 whitespace-nowrap">
                        ₹{fee.softwareFee}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700 whitespace-nowrap">
                        ₹{fee.mouFee}
                      </td>
                      <td className="px-4 py-4 text-center">
                         <span className="px-3 py-1 bg-[#3AB000] text-white rounded text-xs font-bold">
                            ₹{fee.totalAmount}/-
                         </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                         <div className="flex items-center justify-center gap-2">
                           <button
                             onClick={() => { setSelectedFee(fee); setIsModalOpen(true); }}
                             className="p-2 text-gray-400 hover:text-[#3AB000] hover:bg-[#3AB000]/10 rounded-lg transition-all"
                             title="Edit"
                           >
                             <Edit size={18} />
                           </button>
                           <button
                             onClick={() => handleDelete(fee._id)}
                             className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                             title="Delete"
                           >
                             <Trash2 size={18} />
                           </button>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Mobile View (MOU/JobPosting Style) ── */}
        <div className="md:hidden space-y-3 mt-4">
          {filteredData.map((fee, idx) => (
            <div key={fee._id} className="bg-white rounded border border-gray-200 p-4 shadow-sm">
               <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Fee Config</div>
                    <h3 className="text-sm font-bold text-[#2d8a00]">{fee.jobPost}</h3>
                  </div>
                  <span className="px-2 py-1 bg-[#3AB000] text-white rounded text-[10px] font-bold">₹{fee.totalAmount}</span>
               </div>
               <div className="grid grid-cols-2 gap-y-2 py-3 border-y border-gray-50 text-[11px]">
                  <div className="flex justify-between pr-4">
                     <span className="text-gray-400">Training:</span>
                     <span className="text-gray-700 font-bold">₹{fee.trainingFee}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-gray-400">ID/Kit:</span>
                     <span className="text-gray-700 font-bold">₹{fee.idCardFee}</span>
                  </div>
                  <div className="flex justify-between pr-4">
                     <span className="text-gray-400">Software:</span>
                     <span className="text-gray-700 font-bold">₹{fee.softwareFee}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-gray-400">MOU:</span>
                     <span className="text-gray-700 font-bold">₹{fee.mouFee}</span>
                  </div>
               </div>
               <div className="mt-3 flex justify-end gap-2">
                  <button onClick={() => { setSelectedFee(fee); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-[#3AB000] bg-gray-50 rounded-lg"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(fee._id)} className="p-2 text-red-400 bg-red-50 rounded-lg"><Trash2 size={16} /></button>
               </div>
            </div>
          ))}
          {filteredData.length === 0 && (
             <div className="py-12 text-center text-gray-400 text-sm italic">No records found.</div>
          )}
        </div>
      </div>

      <FeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedFee}
        onSuccess={loadData}
      />
    </DashboardLayout>
  );
};

export default FeeStructure;
