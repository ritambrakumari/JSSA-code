import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { 
  HelpCircle, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Search, 
  X, 
  Send,
  AlertCircle,
  RefreshCw,
  Loader2,
  Eye,
  CheckCircle
} from "lucide-react";
import { api } from "../../utils/api";
import { toast } from "react-hot-toast";

const GREEN = "#3AB000";

const EmployeeQA = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [formData, setFormData] = useState({ subject: "", question: "" });
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  useEffect(() => {
    fetchQuestions(1);
  }, []);

  const fetchQuestions = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.qa.getMyQuestions({ page, limit: 10 });
      if (res.success) {
        setQuestions(res.data);
        setPagination(res.pagination);
      }
    } catch (error) {
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.question) {
      return toast.error("Please fill all fields");
    }

    try {
      setSubmitting(true);
      const res = await api.qa.ask(formData);
      if (res.success) {
        toast.success("Question submitted successfully");
        setShowModal(false);
        setFormData({ subject: "", question: "" });
        fetchQuestions(1);
      }
    } catch (error) {
      toast.error("Failed to submit question");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'answered':
        return "bg-green-50 text-green-600 border-green-100";
      case 'pending':
        return "bg-amber-50 text-amber-600 border-amber-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-2 border-gray-100 p-6 rounded-none shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#3AB000]" />
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
              <HelpCircle className="text-[#3AB000]" size={28} />
              Help & Support Center
            </h1>
            <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.2em] mt-1">Ask questions and get answers from administration</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#3AB000] hover:bg-[#2B8000] text-white px-6 py-3 font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-100 rounded-none"
          >
            <Plus size={16} /> New Support Query
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-2 border-gray-100 p-6 rounded-none flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-50 text-blue-600 flex items-center justify-center">
                <MessageSquare size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Queries</p>
                <p className="text-2xl font-black text-gray-900">{pagination.total || 0}</p>
             </div>
          </div>
          <div className="bg-white border-2 border-gray-100 p-6 rounded-none flex items-center gap-4">
             <div className="w-12 h-12 bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</p>
                <p className="text-2xl font-black text-gray-900">{questions.filter(q => q.status === 'pending').length}</p>
             </div>
          </div>
          <div className="bg-white border-2 border-gray-100 p-6 rounded-none flex items-center gap-4">
             <div className="w-12 h-12 bg-green-50 text-green-600 flex items-center justify-center">
                <CheckCircle2 size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Answered</p>
                <p className="text-2xl font-black text-gray-900">{questions.filter(q => q.status === 'answered').length}</p>
             </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border-2 border-gray-100 rounded-none overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#3AB000] border-b border-[#3AB000]">
                  <th className="px-6 py-4 text-[11px] font-black uppercase text-white tracking-widest">Inquiry Date</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase text-white tracking-widest">Title</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase text-white tracking-widest">Short Description</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase text-white tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase text-white tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="5" className="px-6 py-8">
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : questions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <AlertCircle size={48} className="text-gray-200" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No support queries found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  questions.map((item) => (
                    <tr key={item._id} className="hover:bg-green-50/30 transition-all group border-l-4 border-l-transparent hover:border-l-[#3AB000]">
                      <td className="px-6 py-6 whitespace-nowrap">
                        <p className="text-[11px] font-black text-gray-900 uppercase">
                           {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">
                           {new Date(item.createdAt).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-6 py-6">
                        <p className="text-[13px] font-black text-gray-900 uppercase truncate max-w-[200px] group-hover:text-[#3AB000] transition-colors">{item.subject}</p>
                      </td>
                      <td className="px-6 py-6">
                        <p className="text-[12px] font-medium text-gray-500 leading-relaxed max-w-[350px] line-clamp-1 italic italic">"{item.question}"</p>
                      </td>
                       <td className="px-6 py-6 text-center">
                         {item.status === 'answered' ? (
                           <span className="inline-flex items-center gap-1.5 bg-green-50 text-[#3AB000] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border border-[#3AB000]/20">
                             <span className="w-2 h-2 bg-[#3AB000] rounded-full" />
                             Resolved
                           </span>
                         ) : (
                           <div className="flex flex-col items-center gap-1.5">
                             <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border border-amber-200">
                               <span className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
                               In Progress
                             </span>
                             <p className="text-[10px] font-black text-amber-600 uppercase tracking-tight">Regional Manager will answer</p>
                           </div>
                         )}
                      </td>
                      <td className="px-6 py-6 text-right">
                         <button 
                           onClick={() => setSelectedQuery(item)}
                           className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-[#3AB000] transition-all shadow-sm"
                         >
                           <Eye size={14} />
                           View Details
                         </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Proper Pagination UI */}
          {pagination.pages > 1 && (
            <div className="bg-gray-50 border-t border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Showing <span className="text-gray-900">{(pagination.page - 1) * 10 + 1}</span> to <span className="text-gray-900">{Math.min(pagination.page * 10, pagination.total)}</span> of <span className="text-gray-900">{pagination.total}</span> Results
              </p>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchQuestions(1)}
                  disabled={pagination.page === 1}
                  className="px-3 h-10 border-2 border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:border-[#3AB000]"
                >
                  First
                </button>
                <button
                  onClick={() => fetchQuestions(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page === 1}
                  className="px-3 h-10 border-2 border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:border-[#3AB000]"
                >
                  Prev
                </button>

                <div className="flex items-center mx-2 gap-1">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let start = Math.max(1, pagination.page - 2);
                    let end = Math.min(pagination.pages, start + maxVisible - 1);
                    
                    if (end - start < maxVisible - 1) {
                      start = Math.max(1, end - maxVisible + 1);
                    }

                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => fetchQuestions(i)}
                          className={`w-10 h-10 border-2 font-black text-xs transition-all ${
                            pagination.page === i 
                              ? 'bg-[#3AB000] border-[#3AB000] text-white shadow-lg shadow-green-100' 
                              : 'bg-white border-gray-200 text-gray-400 hover:border-[#3AB000] hover:text-[#3AB000]'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                </div>

                <button
                  onClick={() => fetchQuestions(Math.min(pagination.pages, pagination.page + 1))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 h-10 border-2 border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:border-[#3AB000]"
                >
                  Next
                </button>
                <button
                  onClick={() => fetchQuestions(pagination.pages)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 h-10 border-2 border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:border-[#3AB000]"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ask Question Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl border-2 border-gray-100 shadow-2xl rounded-none overflow-hidden scale-in-center">
              <div className="bg-[#3AB000] text-white p-6 flex justify-between items-center relative">
                 <div className="relative z-10">
                   <h2 className="text-lg font-black uppercase tracking-widest leading-none">New Support Query</h2>
                   <p className="text-[9px] font-bold text-green-100 uppercase tracking-widest mt-2">Your question will be reviewed by administrators</p>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 transition-colors">
                   <X size={24} />
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-600">Query Subject</label>
                  <input
                    required
                    placeholder="E.G. SALARY DISCREPANCY, ONBOARDING ISSUE"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value.toUpperCase()})}
                    className="w-full p-4 border-2 border-gray-100 font-bold text-sm focus:border-[#3AB000] focus:bg-green-50/30 outline-none rounded-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-600">Detailed Description</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Describe your issue or question in detail..."
                    value={formData.question}
                    onChange={(e) => setFormData({...formData, question: e.target.value})}
                    className="w-full p-4 border-2 border-gray-100 font-bold text-sm focus:border-[#3AB000] focus:bg-green-50/30 outline-none rounded-none transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#3AB000] text-white py-5 font-black uppercase tracking-[0.2em] shadow-xl shadow-[#3AB000]/20 hover:bg-[#2B8000] hover:translate-y-1 transition-all disabled:opacity-50 rounded-none flex items-center justify-center gap-3"
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  Submit Query
                </button>
              </form>
           </div>
        </div>
      )}

      {/* Detail View Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl border-2 border-[#3AB000]/20 shadow-2xl rounded-none overflow-hidden scale-in-center">
              <div className="bg-[#3AB000] text-white p-8 flex justify-between items-center relative">
                 <div className="relative z-10">
                   <h2 className="text-xl font-black uppercase tracking-widest leading-none">Inquiry Details</h2>
                   <p className="text-[10px] font-bold text-green-100 uppercase tracking-[0.2em] mt-3">Ticket ID: {selectedQuery._id.slice(-8).toUpperCase()}</p>
                 </div>
                 <button onClick={() => setSelectedQuery(null)} className="p-3 hover:bg-white/20 transition-colors">
                   <X size={28} />
                 </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                 {/* Question Section */}
                 <div className="bg-gray-50 p-6 space-y-4 border-l-4 border-amber-400">
                    <div className="flex items-center justify-between">
                       <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest">Your Question</p>
                       <p className="text-[9px] font-bold text-gray-400 uppercase">{new Date(selectedQuery.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-sm font-black text-gray-900 uppercase leading-snug">{selectedQuery.subject}</h3>
                       <p className="text-[13px] font-medium text-gray-600 leading-relaxed italic bg-white/50 p-5 border border-gray-100">
                          "{selectedQuery.question}"
                       </p>
                    </div>
                 </div>

                 {/* Response Section */}
                 <div className="space-y-4">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <MessageSquare size={14} className="text-[#3AB000]" /> Administrative Response
                    </p>
                    
                    {selectedQuery.status === 'answered' ? (
                       <div className="bg-green-50/50 p-8 border-2 border-green-100 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                             <CheckCircle size={80} className="text-[#3AB000]" />
                          </div>
                          <div className="relative z-10">
                             <p className="text-[15px] font-bold text-gray-800 leading-relaxed italic">
                                "{selectedQuery.answer}"
                             </p>
                             <div className="mt-8 pt-6 border-t border-green-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 bg-[#3AB000] text-white flex items-center justify-center font-black text-[10px]">AD</div>
                                   <div>
                                      <p className="text-[10px] font-black text-gray-900 uppercase">JSSA Administration</p>
                                      <p className="text-[8px] font-bold text-gray-400 uppercase">Official Verified Response</p>
                                   </div>
                                </div>
                                <p className="text-[9px] font-black text-[#3AB000] uppercase tracking-widest">
                                   Resolved {new Date(selectedQuery.answeredAt).toLocaleDateString()}
                                </p>
                             </div>
                          </div>
                       </div>
                    ) : (
                       <div className="bg-amber-50/50 p-12 border-2 border-dashed border-amber-200 text-center space-y-3">
                          <Clock size={32} className="text-amber-500 mx-auto animate-pulse" />
                          <p className="text-[12px] font-black text-amber-700 uppercase tracking-widest">Pending Review</p>
                          <p className="text-[10px] font-bold text-amber-500/70 uppercase">Regional Manager will provide an answer soon. Please check back later.</p>
                       </div>
                    )}
                 </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                 <button 
                   onClick={() => setSelectedQuery(null)}
                   className="px-8 py-3 bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all"
                 >
                   Close Record
                 </button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in-center {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .scale-in-center {
          animation: scale-in-center 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3AB000;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default EmployeeQA;
