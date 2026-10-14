import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  Trash2, 
  X, 
  Send,
  User,
  Mail,
  Briefcase,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  ArrowRight
} from "lucide-react";
import { api } from "../../utils/api";
import { toast } from "react-hot-toast";

const RMQA = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [designationFilter, setDesignationFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [selectedQA, setSelectedQA] = useState(null);
  const [isResponding, setIsResponding] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = useCallback(async (forceLoading = true) => {
    try {
      if (forceLoading) setLoading(true);
      const res = await api.qa.getRMAll({ 
        page, 
        limit: 15, 
        status: statusFilter, 
        search,
        startDate,
        endDate,
        designation: designationFilter
      });
      if (res.success) {
        setQuestions(res.data);
        setPagination(res.pagination);
      }
    } catch (error) {
      toast.error("Failed to load questions");
    } finally {
      if (forceLoading) setLoading(false);
    }
  }, [page, statusFilter, search, startDate, endDate, designationFilter]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const handleAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) return toast.error("Please enter an answer");

    try {
      setSubmitting(true);
      const res = await api.qa.answer(selectedQA._id, answerText);
      if (res.success) {
        toast.success("Response sent successfully");
        setSelectedQA(null);
        setAnswerText("");
        fetchQuestions(false);
      }
    } catch (error) {
      toast.error("Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="admin-qa-container">
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mr-4">
          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Queries</span>
              <span className="text-2xl font-black text-gray-800 leading-none">{loading ? '...' : pagination.total}</span>
            </div>
            <div className="p-3 bg-gray-100 text-gray-500 rounded-full">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending Support</span>
              <span className="text-2xl font-black text-red-500 leading-none">
                {loading ? '...' : questions.filter(q => q.status === 'pending').length}
              </span>
            </div>
            <div className="p-3 bg-red-50 text-red-500 rounded-full">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Resolved Cases</span>
              <span className="text-2xl font-black text-[#3AB000] leading-none">
                {loading ? '...' : questions.filter(q => q.status === 'answered').length}
              </span>
            </div>
            <div className="p-3 bg-green-50 text-[#3AB000] rounded-full">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-none shadow-sm space-y-4 mr-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
              <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase">
                <MessageSquare className="w-6 h-6 text-[#3AB000]" />
                Inquiry Management
              </h1>
            </div>

            <button
              onClick={() => fetchQuestions()}
              className="bg-black hover:bg-gray-800 text-white text-xs sm:text-sm px-5 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Feed
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center border-t border-gray-100 pt-4">
            <div className="flex h-10 w-full md:w-auto flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="SEARCH EMPLOYEE, SUBJECT, OR CONTENT..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm font-medium uppercase"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 border border-gray-300 px-3 text-[10px] font-black uppercase outline-none focus:border-[#3AB000] bg-white cursor-pointer"
                >
                  <option value="all">All Queries</option>
                  <option value="pending">Pending Only</option>
                  <option value="answered">Answered Only</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Role:</span>
                <select
                  value={designationFilter}
                  onChange={(e) => setDesignationFilter(e.target.value)}
                  className="h-10 border border-gray-300 px-3 text-[10px] font-black uppercase outline-none focus:border-[#3AB000] bg-white cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="DISTRICT MANAGER">District Manager</option>
                  <option value="BLOCK SUPERVISOR">Block Supervisor</option>
                  <option value="PANCHAYAT EXECUTIVE">Panchayat Executive</option>
                  <option value="STAFF">General Staff</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 border border-gray-300 px-3 text-[10px] font-black uppercase outline-none focus:border-[#3AB000]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 border border-gray-300 px-3 text-[10px] font-black uppercase outline-none focus:border-[#3AB000]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-none shadow-sm overflow-hidden mr-4">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#3AB000] border-b border-[#3AB000]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em]">Employee</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em]">Subject</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em]">Detailed Query</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em] text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em] text-center">Timing Info</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-white tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-gray-50">
                      <td className="px-6 py-6"><div className="w-4 h-4 bg-gray-100" /></td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-none"></div>
                          <div className="space-y-2">
                             <div className="h-4 bg-gray-100 rounded w-24"></div>
                             <div className="h-3 bg-gray-50 rounded w-32"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-40"></div></td>
                      <td className="px-6 py-6"><div className="h-6 bg-gray-50 rounded w-20 mx-auto"></div></td>
                      <td className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-32 mx-auto"></div></td>
                      <td className="px-6 py-6"><div className="h-10 bg-gray-100 rounded w-24 ml-auto"></div></td>
                    </tr>
                  ))
                ) : questions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-24 text-center">
                       <AlertCircle size={64} className="text-gray-100 mx-auto mb-4" />
                       <p className="text-sm font-black text-gray-300 uppercase tracking-[0.3em]">Zero active inquiries detected</p>
                    </td>
                  </tr>
                ) : (
                  questions.map((item) => (
                    <tr key={item._id} className="hover:bg-[#f9fff5] transition-colors border-b border-gray-100 group">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#0A3D00] text-white flex items-center justify-center font-black text-sm rounded-none overflow-hidden shrink-0">
                            {item.employeeId?.photo || item.userId?.photo ? (
                              <img src={item.employeeId?.photo || item.userId?.photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (item.employeeId?.name || item.userId?.name || "U")[0].toUpperCase()
                            )}
                          </div>
                          <div className="max-w-[180px]">
                            <p className="text-[13px] font-black text-gray-900 uppercase leading-none mb-1 group-hover:text-[#3AB000] transition-colors truncate">
                              {item.employeeId?.name || item.userId?.name || "Unknown"}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{item.userId?.email || "N/A"}</p>
                            <p className="text-[9px] font-black text-[#3AB000] uppercase mt-1 truncate">{item.employeeId?.designation || "STAFF"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 max-w-[200px]">
                        <p className="text-[12px] font-black text-gray-900 uppercase leading-tight line-clamp-2">
                           {item.subject}
                        </p>
                      </td>
                      <td className="px-6 py-6 max-w-[300px]">
                        <p className="text-[11px] font-medium text-gray-500 leading-relaxed line-clamp-2 italic">
                           "{item.question}"
                        </p>
                      </td>
                      <td className="px-6 py-6 text-center">
                        {item.status === 'answered' ? (
                          <span className="inline-flex items-center gap-1.5 bg-green-50 text-[#3AB000] px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-[#3AB000]/20">
                            <span className="w-1.5 h-1.5 bg-[#3AB000] rounded-full" />
                            Resolved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-amber-200">
                            <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="flex flex-col items-center">
                           <p className="text-[11px] font-black text-gray-900 uppercase flex items-center gap-1.5">
                              <Clock size={12} className="text-[#3AB000]" />
                              {new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                           </p>
                           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">
                              {new Date(item.createdAt).toLocaleDateString()}
                           </p>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => {
                               setSelectedQA(item);
                               setIsResponding(false);
                             }}
                             className="h-10 w-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-[#3AB000] border border-gray-200 hover:border-[#3AB000]/30 transition-all shadow-sm"
                             title="Quick View"
                           >
                             <Eye size={16} />
                           </button>
                           <button 
                             onClick={() => {
                               setSelectedQA(item);
                               setIsResponding(true);
                             }}
                             className={`inline-flex items-center h-10 gap-2 px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                               item.status === 'pending' 
                               ? "bg-black text-white hover:bg-[#3AB000]" 
                               : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                             }`}
                           >
                             <Send size={14} />
                             {item.status === 'pending' ? "Respond Now" : "Logged"}
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="bg-gray-50 border-t border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Showing <span className="text-gray-900">{(page - 1) * 15 + 1}</span> to <span className="text-gray-900">{Math.min(page * 15, pagination.total)}</span> of <span className="text-gray-900">{pagination.total}</span> Results
              </p>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-3 h-10 border-2 border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:border-[#3AB000]"
                >
                  First
                </button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 h-10 border-2 border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:border-[#3AB000]"
                >
                  Prev
                </button>

                <div className="flex items-center mx-2 gap-1">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let start = Math.max(1, page - 2);
                    let end = Math.min(pagination.pages, start + maxVisible - 1);
                    
                    if (end - start < maxVisible - 1) {
                      start = Math.max(1, end - maxVisible + 1);
                    }

                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setPage(i)}
                          className={`w-10 h-10 border-2 font-black text-xs transition-all ${
                            page === i 
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
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-3 h-10 border-2 border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:border-[#3AB000]"
                >
                  Next
                </button>
                <button
                  onClick={() => setPage(pagination.pages)}
                  disabled={page === pagination.pages}
                  className="px-3 h-10 border-2 border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:border-[#3AB000]"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedQA && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl border-2 border-[#3AB000]/20 shadow-2xl rounded-none overflow-hidden scale-in-center">
              <div className="bg-[#3AB000] text-white p-8 flex justify-between items-center relative">
                 <div className="relative z-10">
                   <h2 className="text-xl font-black uppercase tracking-widest leading-none">Employee Inquiry Response</h2>
                   <p className="text-[10px] font-bold text-green-100 uppercase tracking-[0.2em] mt-3">Reference ID: {selectedQA._id.slice(-8).toUpperCase()}</p>
                 </div>
                 <button onClick={() => setSelectedQA(null)} className="p-3 hover:bg-white/20 transition-colors">
                   <X size={28} />
                 </button>
              </div>

              <div className="max-h-[65vh] overflow-y-auto custom-scrollbar p-8 space-y-8">
                 <div className="flex items-center gap-6 bg-gray-50/50 p-6 border-2 border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-100 border-2 border-white shadow-md overflow-hidden shrink-0">
                       {selectedQA.employeeId?.photo || selectedQA.userId?.photo ? (
                          <img src={selectedQA.employeeId?.photo || selectedQA.userId?.photo} alt="" className="w-full h-full object-cover" />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#0A3D00] text-white text-3xl font-black">
                             {(selectedQA.employeeId?.name || selectedQA.userId?.name || "U")[0].toUpperCase()}
                          </div>
                       )}
                    </div>
                    <div className="flex-1">
                       <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter leading-none">
                             {selectedQA.employeeId?.name || selectedQA.userId?.name || "Unknown User"}
                          </h3>
                          <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest ${
                             selectedQA.status === 'answered' ? "bg-green-50 text-[#3AB000]" : "bg-amber-50 text-amber-600"
                          }`}>
                             {selectedQA.status}
                          </span>
                       </div>
                       <div className="grid grid-cols-2 gap-y-2">
                          <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                             <Briefcase size={12} className="text-[#3AB000]" /> {selectedQA.employeeId?.designation || "STAFF"}
                          </p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                             <User size={12} className="text-[#3AB000]" /> {selectedQA.employeeId?.employeeId || "NEW_REQ"}
                          </p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2 col-span-2">
                             <Mail size={12} className="text-[#3AB000]" /> {selectedQA.userId?.email || "N/A"}
                          </p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-gray-50 p-6 space-y-4 border-l-4 border-[#3AB000]">
                    <div className="flex items-center justify-between">
                       <p className="text-[11px] font-black text-[#3AB000] uppercase tracking-widest">Inquiry Content</p>
                       <p className="text-[9px] font-bold text-gray-400 uppercase">Received {new Date(selectedQA.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-sm font-black text-gray-900 uppercase leading-snug">{selectedQA.subject}</h3>
                       <p className="text-[12px] font-medium text-gray-600 leading-relaxed bg-white/50 p-4 border border-gray-100 italic">
                          "{selectedQA.question}"
                       </p>
                    </div>
                 </div>

                 {isResponding && selectedQA.status === 'pending' && (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                       <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Send size={14} className="text-[#3AB000]" /> Official Response Text
                       </p>
                       <textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="Type the official response here..."
                          className="w-full h-40 p-6 border-2 border-gray-100 focus:border-[#3AB000] focus:bg-green-50/10 outline-none rounded-none text-sm font-medium leading-relaxed transition-all resize-none"
                       />
                    </div>
                 )}

                 {selectedQA.status === 'answered' && (
                    <div className="space-y-4 pt-4 border-t border-gray-100 bg-green-50/30 p-6 border-2 border-green-100">
                       <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-black text-[#3AB000] uppercase tracking-widest">Administrative Response Provided</p>
                          <span className="text-[8px] font-black bg-[#3AB000] text-white px-2 py-0.5 uppercase tracking-widest">LOGGED</span>
                       </div>
                       <p className="text-[14px] font-bold text-gray-800 leading-relaxed italic">"{selectedQA.answer}"</p>
                       <p className="text-[9px] font-black text-[#3AB000]/70 uppercase mt-4">Sent on {new Date(selectedQA.answeredAt).toLocaleString()}</p>
                    </div>
                 )}
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center gap-4">
                 <button 
                   onClick={() => setSelectedQA(null)}
                   className="flex-1 h-14 bg-white border-2 border-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 hover:text-gray-600 transition-all"
                 >
                   {isResponding ? "Cancel" : "Close Records"}
                 </button>
                 {isResponding && selectedQA.status === 'pending' && (
                    <button 
                      onClick={handleAnswer}
                      disabled={submitting}
                      className="flex-[2] h-14 bg-[#3AB000] text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-green-200 hover:bg-[#2B8000] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                      Dispatch Response
                    </button>
                 )}
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
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3AB000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2d8a00;
        }
      `}</style>
      </div>
    </DashboardLayout>
  );
};

export default RMQA;
