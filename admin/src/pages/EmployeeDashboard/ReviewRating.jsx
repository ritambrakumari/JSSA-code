import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Star, MessageSquare, User, TrendingUp, ShieldCheck, Loader2, Send, Calendar } from "lucide-react";
import { reviewAPI } from "../../utils/api";
import { toast } from "react-hot-toast";

const ReviewRating = () => {
  const [activeTab, setActiveTab] = useState("give"); // "give" or "received"
  const [superiors, setSuperiors] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [stats, setStats] = useState({ average: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isLocked = false;

  // Review Form State
  const [showModal, setShowModal] = useState(false);
  const [selectedSuperior, setSelectedSuperior] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [superiorsRes, receivedRes] = await Promise.all([
        reviewAPI.getSuperiors(),
        reviewAPI.getReceived()
      ]);

      if (superiorsRes.success) setSuperiors(superiorsRes.data);
      if (receivedRes.success) {
        setReceivedReviews(receivedRes.data);
        setStats(receivedRes.stats);
      }
    } catch (err) {
      toast.error("Failed to load review data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error("Please select a rating");

    try {
      setSubmitting(true);
      const res = await reviewAPI.submit({
        targetId: selectedSuperior.userId._id,
        rating,
        comment
      });

      if (res.success) {
        toast.success("Review submitted successfully");
        setShowModal(false);
        setRating(0);
        setComment("");
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count, size = 18, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={`${interactive ? "cursor-pointer" : ""} transition-all duration-200 ${i <= count ? "fill-[#3AB000] text-[#3AB000] scale-110" : "text-gray-300"
              }`}
            onClick={() => interactive && setRating(i)}
          />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border border-gray-300 border-l-8 border-l-[#3AB000] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm rounded-none">
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none mb-2">Review & Ratings</h1>
            <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.2em]">Hierarchy Feedback Protocol</p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-none border border-gray-200">
            <button
              onClick={() => !isLocked && setActiveTab("give")}
              disabled={isLocked}
              className={`px-6 py-2.5 rounded-none text-xs font-black uppercase tracking-widest transition-all ${activeTab === "give" ? "bg-[#3AB000] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"} ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Give Review
            </button>
            <button
              onClick={() => !isLocked && setActiveTab("received")}
              disabled={isLocked}
              className={`px-6 py-2.5 rounded-none text-xs font-black uppercase tracking-widest transition-all ${activeTab === "received" ? "bg-[#3AB000] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"} ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Reviews Received
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={40} className="animate-spin text-[#3AB000]" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accessing Feedback Logs...</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {activeTab === "give" ? (
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${isLocked ? "blur-[2px] pointer-events-none select-none" : ""}`}>
                {superiors.map((sup) => (
                  <div key={sup._id} className="bg-white border border-gray-300 rounded-none p-6 hover:border-[#3AB000] transition-all group relative overflow-hidden shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-none bg-gray-50 border border-gray-300 overflow-hidden flex-shrink-0">
                        {sup.userId.photo ? (
                          <img src={sup.userId.photo} alt={sup.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                            <User size={30} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900 uppercase text-sm group-hover:text-[#3AB000] transition-colors">{sup.name}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sup.designation || sup.role}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {sup.canReview ? (
                        <button
                          onClick={() => {
                            setSelectedSuperior(sup);
                            setShowModal(true);
                          }}
                          className="w-full py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-none hover:bg-[#3AB000] transition-all flex items-center justify-center gap-2"
                        >
                          <Star size={14} className="fill-current" />
                          Submit Feedback
                        </button>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="w-full py-3 bg-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-none flex items-center justify-center gap-2 cursor-not-allowed border border-gray-300">
                            <ShieldCheck size={14} />
                            Already Reviewed
                          </div>
                          <p className="text-[9px] font-bold text-gray-400 text-center uppercase tracking-tighter italic">Next review available in {Math.max(0, 7 - Math.floor((Date.now() - new Date(sup.lastReviewDate)) / (1000 * 60 * 60 * 24)))} days</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {superiors.length === 0 && (
                  <div className="col-span-full bg-gray-50 border border-dashed border-gray-300 rounded-none p-20 flex flex-col items-center text-center">
                    <User size={48} className="text-gray-300 mb-4" />
                    <h3 className="font-black text-gray-400 uppercase tracking-widest">No superiors found</h3>
                    <p className="text-xs text-gray-400 mt-2">You don't have anyone assigned as a reporting manager yet.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className={`space-y-4 ${isLocked ? "blur-[2px] pointer-events-none select-none" : ""}`}>
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#3AB000] p-8 rounded-none text-white shadow-sm flex items-center justify-between overflow-hidden relative">
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-green-100 uppercase tracking-[0.3em] mb-2">Average Satisfaction</p>
                      <h4 className="text-5xl font-black">{stats.average}</h4>
                      <div className="mt-4">{renderStars(Math.round(stats.average), 20)}</div>
                    </div>
                    <TrendingUp size={120} className="absolute -right-4 -bottom-4 opacity-10" />
                  </div>
                  <div className="bg-gray-900 p-8 rounded-none text-white shadow-sm flex items-center justify-between overflow-hidden relative">
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Total Reviews</p>
                      <h4 className="text-5xl font-black">{stats.total}</h4>
                      <p className="text-xs font-bold text-gray-400 mt-4 uppercase tracking-widest">Subordinate Feedbacks</p>
                    </div>
                    <MessageSquare size={120} className="absolute -right-4 -bottom-4 opacity-10" />
                  </div>
                </div>

                {/* Reviews List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {receivedReviews.map((rev) => (
                    <div key={rev._id} className="bg-white border border-gray-300 rounded-none p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-none bg-gray-900 text-white flex items-center justify-center font-black text-sm border border-gray-700">
                            {rev.reviewerId.photo ? (
                              <img src={rev.reviewerId.photo} alt="User" className="w-full h-full object-cover" />
                            ) : (
                              <span>{rev.reviewerId.name?.[0].toUpperCase() || "S"}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-gray-900 uppercase tracking-tight leading-none mb-1">{rev.reviewerId.name || "Anonymous Subordinate"}</p>
                            <p className="text-[10px] font-bold text-[#3AB000] uppercase tracking-widest">{rev.reviewerId.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-gray-900">{rev.rating}.0</span>
                              {renderStars(rev.rating, 14)}
                            </div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter flex items-center gap-1 bg-gray-50 px-2 py-0.5 border border-gray-100">
                              <Calendar size={10} />
                              {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <MessageSquare size={12} className="text-[#3AB000]" />
                          Official Feedback
                        </label>
                        <div className="bg-gray-50 p-5 rounded-none border-l-4 border-l-[#3AB000] border-y border-r border-gray-300">
                          <p className="text-xs text-gray-700 leading-relaxed font-bold italic">
                            "{rev.comment || "No comment provided."}"
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {receivedReviews.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-gray-50 rounded-none border border-dashed border-gray-200">
                      <MessageSquare size={48} className="text-gray-200 mx-auto mb-4" />
                      <h3 className="font-black text-gray-400 uppercase tracking-widest">No reviews received yet</h3>
                      <p className="text-xs text-gray-400 mt-2">Feedback from your subordinates will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isLocked && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/5 backdrop-blur-[2px]">
                <div className="bg-black/90 text-white px-8 py-4 text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl border-t-4 border-[#3AB000] animate-in zoom-in-95 duration-300">
                  Access will be granted after official training
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Submission Modal */}
      {showModal && selectedSuperior && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-none w-full max-w-md overflow-hidden shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-300">
            <div className="bg-[#3AB000] p-8 text-white relative">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-none bg-white/20 backdrop-blur-md p-1 border border-white/30">
                  {selectedSuperior.userId.photo ? (
                    <img src={selectedSuperior.userId.photo} alt={selectedSuperior.name} className="w-full h-full object-cover rounded-none" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <User size={30} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">{selectedSuperior.name}</h3>
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{selectedSuperior.designation || selectedSuperior.role}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-none transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Performance Rating</label>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-none flex justify-center scale-125 my-4">
                  {renderStars(rating, 24, true)}
                </div>
                <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest px-2">
                  <span>Needs Improvement</span>
                  <span>Outstanding</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Comments & Feedback</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience with this manager..."
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-none p-4 text-sm font-medium focus:border-[#3AB000] outline-none transition-all resize-none shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#3AB000] text-white text-xs font-black uppercase tracking-[0.2em] rounded-none hover:bg-[#2B8000] shadow-lg shadow-[#3AB000]/20 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    Submit Review
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ReviewRating;
