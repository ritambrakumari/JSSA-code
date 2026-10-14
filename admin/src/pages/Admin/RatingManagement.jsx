import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Star, User, Search, Loader2, Calendar, MessageSquare, Filter, Shield, RefreshCw, TrendingUp } from "lucide-react";
import { reviewAPI } from "../../utils/api";
import { toast } from "react-hot-toast";

const RatingManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState("all");

  const fetchAllReviews = async (p = 1) => {
    try {
      setLoading(true);
      const res = await reviewAPI.getAll({ page: p, limit: 15 });
      if (res.success) {
        setReviews(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error("Failed to load global reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReviews(page);
  }, [page]);

  const filteredReviews = reviews.filter(rev => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      rev.reviewerId?.name?.toLowerCase().includes(searchLower) ||
      rev.targetId?.name?.toLowerCase().includes(searchLower) ||
      rev.comment?.toLowerCase().includes(searchLower);
    
    const matchesRating = ratingFilter === "all" || rev.rating === parseInt(ratingFilter);
    return matchesSearch && matchesRating;
  });

  const stats = {
    total: pagination.total,
    average: reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) : "0.0",
    high: reviews.filter(r => r.rating >= 4).length,
    low: reviews.filter(r => r.rating <= 2).length
  };

  const renderStars = (count) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={12}
            className={`${i <= count ? "fill-[#3AB000] text-[#3AB000]" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-0 ml-0 md:ml-6 px-2 md:px-0 mt-4 space-y-4 h-full max-w-[99rem]">
        
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mr-4">
          <StatCard label="Total Feedbacks" value={stats.total} icon={<MessageSquare className="w-5 h-5" />} />
          <StatCard label="Average Rating" value={stats.average} icon={<Star className="w-5 h-5" />} color="text-[#3AB000]" iconBg="bg-green-50" iconColor="text-[#3AB000]" />
          <StatCard label="High (4-5★)" value={stats.high} icon={<TrendingUp className="w-5 h-5" />} color="text-blue-600" iconBg="bg-blue-50" iconColor="text-blue-600" />
          <StatCard label="Low (1-2★)" value={stats.low} icon={<Filter className="w-5 h-5" />} color="text-red-500" iconBg="bg-red-50" iconColor="text-red-500" />
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 border border-gray-300 rounded-none shadow-sm space-y-4 mr-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase">
              <Shield className="w-6 h-6 text-[#3AB000]" />
              Rating Analysis
            </h1>

            <button
              onClick={() => fetchAllReviews(1)}
              className="bg-black hover:bg-gray-800 text-white text-xs px-5 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center border-t border-gray-100 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by Employee, Manager or Comment..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="h-10 border border-gray-300 rounded-none px-3 text-xs sm:text-sm font-black uppercase tracking-widest text-gray-700 bg-white focus:outline-none shadow-sm min-w-[160px] cursor-pointer"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="all">Rating: All Stars</option>
              <option value="5">Rating: 5 Stars</option>
              <option value="4">Rating: 4 Stars</option>
              <option value="3">Rating: 3 Stars</option>
              <option value="2">Rating: 2 Stars</option>
              <option value="1">Rating: 1 Star</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-none overflow-hidden border border-gray-300 shadow-sm mr-4 mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#3AB000]">
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Submission Date</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Reviewer (Employee)</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-center">Rating</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Target (Manager)</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Feedback Content</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="5" className="px-6 py-8"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                    </tr>
                  ))
                ) : filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <MessageSquare size={48} className="text-gray-200 mx-auto mb-4" />
                      <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No review logs found</p>
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((rev) => (
                    <tr key={rev._id} className="hover:bg-[#e8f5e2] transition-colors border-b border-gray-100">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-[12px] font-bold text-gray-900 uppercase">
                            {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center font-black text-sm rounded-none">
                            {rev.reviewerId?.name?.[0].toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-gray-900 tracking-tight leading-none mb-1 uppercase">
                              {rev.reviewerId?.name || "Unknown"}
                            </p>
                            <p className="text-[10px] font-bold text-[#3AB000] tracking-widest uppercase">{rev.reviewerId?.designation || rev.reviewerId?.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-base font-black text-gray-900 leading-none">{rev.rating}.0</span>
                          {renderStars(rev.rating)}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 text-gray-400 flex items-center justify-center rounded-none border border-gray-200">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="text-[12px] font-black text-gray-900 uppercase tracking-tight">{rev.targetId?.name || "Unknown"}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{rev.targetId?.designation || rev.targetId?.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="max-w-xs">
                          <p className="text-[12px] font-bold text-gray-600 italic leading-relaxed line-clamp-2">"{rev.comment || "No comment provided."}"</p>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination.pages > 1 && (
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Showing Page {pagination.currentPage} of {pagination.pages} ({pagination.total} Total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-none text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-50 transition-all"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 bg-[#3AB000] text-white rounded-none text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#3AB000]/20 hover:bg-black disabled:opacity-50 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ label, value, icon, color = "text-gray-800", iconBg = "bg-gray-100", iconColor = "text-gray-500" }) => (
  <div className="flex items-center justify-between bg-white border border-gray-300 px-6 py-5 rounded-none shadow-sm">
    <div className="flex flex-col">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</span>
      <span className={`text-2xl font-black ${color} leading-none`}>{value}</span>
    </div>
    <div className={`p-3 ${iconBg} ${iconColor} rounded-full`}>
      {icon}
    </div>
  </div>
);

export default RatingManagement;
