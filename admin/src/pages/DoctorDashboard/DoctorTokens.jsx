import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { doctorsAPI } from "../../utils/api";
import { FileText, Check, X, RefreshCw, Ticket, PenTool, Search } from "lucide-react";

const DoctorTokens = () => {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      if (page !== 1) setPage(1); // Reset page on search change
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchData(page, debouncedSearch);
  }, [page, debouncedSearch]);

  const fetchData = async (pageNum = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const [tokensRes, profileRes] = await Promise.all([
        doctorsAPI.getMyTokens(pageNum, 10, searchQuery),
        doctorsAPI.getProfile()
      ]);
      if (tokensRes.success) {
        setTokens(tokensRes.tokens);
        if (tokensRes.pagination) {
          setPagination(tokensRes.pagination);
        }
      }
      if (profileRes.success && profileRes.doctor) {
        setDoctor(profileRes.doctor);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (tokenId, status) => {
    if (!window.confirm(`Are you sure you want to mark this token as ${status}?`)) return;
    setUpdating(true);
    try {
      const res = await doctorsAPI.updateTokenStatus(tokenId, status);
      if (res.success) {
        setTokens(tokens.map(t => t._id === tokenId ? { ...t, status: res.token.status } : t));
      } else {
        alert(res.error || "Failed to update status");
      }
    } catch (error) {
      alert("Error updating status");
    } finally {
      setUpdating(false);
    }
  };

  // Removed full page loading blocker so search doesn't lose focus

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          
          {/* Top Banner (Matching DoctorDashboard) */}
          <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30">
                <Ticket className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">
                  {doctor ? `Welcome, ${doctor.name}` : 'My Tokens'}
                </h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">
                  Token Management
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchData(page, debouncedSearch)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] px-5 h-9 font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 rounded-none backdrop-blur-sm shrink-0"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-100 p-0 rounded-none shadow-sm min-h-[400px] flex flex-col">
            <div className="p-4 border-b-2 border-gray-100 flex flex-col md:flex-row justify-between md:items-center bg-gray-50 gap-4">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Ticket size={16} className="text-[#3AB000]" />
                All Tokens
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Token No..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border-2 border-gray-200 rounded-none text-sm font-bold focus:outline-none focus:border-[#3AB000] focus:ring-0 w-64 md:w-80 transition-colors"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#3AB000] text-white font-black uppercase text-[10px] tracking-widest">
                    <th className="px-6 py-4 whitespace-nowrap">Token Number</th>
                    <th className="px-6 py-4 whitespace-nowrap">Patient / Cardholder</th>
                    <th className="px-6 py-4 whitespace-nowrap">Card Number</th>
                    <th className="px-6 py-4 whitespace-nowrap">Date</th>
                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10">
                      <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
                        <RefreshCw size={24} className="text-[#3AB000] animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Loading...</p>
                      </div>
                    </td>
                  </tr>
                ) : tokens.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10">
                      <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
                        <Ticket size={24} className="text-gray-300" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No Tokens Found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tokens.map((token) => (
                    <tr key={token._id} className="hover:bg-[#f9fff5] transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-[#f9fff5] border border-[#3AB000] flex items-center justify-center text-[#3AB000] rounded-none shrink-0 font-bold">
                            #
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 uppercase">{token.tokenNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-bold text-gray-800 uppercase">{token.cardId?.cardholderName || token.cardholderId?.name}</p>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5">{token.cardholderId?.phone}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {token.cardId?.cardId ? (
                          <span className="text-[11px] font-black text-[#3AB000] bg-[#3AB000]/10 px-2.5 py-1 rounded-sm uppercase tracking-widest">
                            {token.cardId.cardId}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700 font-bold">{new Date(token.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border rounded-full ${
                          token.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          token.status === 'completed' ? 'bg-green-50 text-[#3AB000] border-[#3AB000]/30' :
                          'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {token.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {token.status === "pending" ? (
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => navigate(`/doctor/dashboard/create-prescription?tokenId=${token._id}`)}
                              disabled={updating}
                              className="px-3 py-1.5 text-xs font-semibold capitalize bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-sm border border-blue-200 transition-colors shadow-sm whitespace-nowrap flex items-center gap-1.5"
                            >
                              <PenTool size={14} />
                              Write Prescription
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(token._id, "cancelled")}
                              disabled={updating}
                              className="px-3 py-1.5 text-xs font-semibold capitalize bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-sm border border-red-200 transition-colors shadow-sm flex items-center gap-1.5"
                            >
                              <X size={14} />
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-500 border border-gray-200 rounded-sm flex items-center gap-1.5">
                              <Check size={14} className="text-[#3AB000]" /> Action Completed
                            </span>
                          </div>
                        )}
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
                  Showing {tokens.length} of {pagination.total} Tokens
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
    </DashboardLayout>
  );
};

export default DoctorTokens;
