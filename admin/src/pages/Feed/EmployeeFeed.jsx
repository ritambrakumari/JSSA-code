import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";

// Helper to fix local/production URLs
const cleanImageUrl = (url) => {
  if (!url) return "";

  const API_BASE_URL = import.meta.env.MODE === "development"
    ? "http://localhost:3005/api"
    : "https://api.jssabhiyan.com/api";

  // If the URL is already absolute and points to localhost, fix it for the current environment
  if (url.includes("localhost:3005/api")) {
    return url.replace("http://localhost:3005/api", API_BASE_URL);
  }

  // If it's already a full production URL and we are in development, fix it
  if (url.includes("api.jssabhiyan.com/api") && import.meta.env.MODE === "development") {
    return url.replace("https://api.jssabhiyan.com/api", API_BASE_URL);
  }

  // If it's already a full URL (and not one of our APIs that needs fixing), return as is
  if (url.startsWith("http")) {
    return url;
  }

  // If path starts with /api/, prepend the base domain
  if (url.startsWith("/api/")) {
    const base = API_BASE_URL.endsWith("/api") ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    return `${base}${url}`;
  }

  // Standard relative path handling
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${path}`;
};
import { feedAPI, employeesAPI } from "../../utils/api";
import { useAuth } from "../../auth/AuthProvider";
import {
  Image as ImageIcon,
  Send,
  Heart,
  MessageSquare,
  Share2,
  Loader2,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Camera,
  History,
  Eye,
  ShieldCheck
} from "lucide-react";
import { toast } from "react-hot-toast";

const EmployeeFeed = () => {
  const [activeTab, setActiveTab] = useState("wall"); // 'wall' or 'create'
  const [feeds, setFeeds] = useState([]);
  const [myFeeds, setMyFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Create Post States
  const [postText, setPostText] = useState("");
  const [postImages, setPostImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedMyFeed, setSelectedMyFeed] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [viewerImage, setViewerImage] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const isSocialLocked = false;
  // Alternatively, use a custom env: import.meta.env.VITE_ENABLE_SOCIAL_LOCK === 'true'

  const fetchCurrentUser = async () => {
    try {
      const res = await employeesAPI.getMe();
      if (res.success) {
        setCurrentUserData(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  };

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      const res = await feedAPI.getPublicFeeds();
      if (res.success) setFeeds(res.data);

      const myRes = await feedAPI.getMyFeeds();
      if (myRes.success) setMyFeeds(myRes.data);
    } catch (err) {
      toast.error("Failed to load feeds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
    fetchCurrentUser();
  }, []);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const oversized = files.find(f => f.size > 5 * 1024 * 1024);
    if (oversized) {
      toast.error("Each image should be less than 5MB");
      return;
    }

    try {
      setUploading(true);
      const uploadedUrls = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await feedAPI.uploadImage(formData);
        if (res.success) {
          // Store only the relative path to avoid saving localhost URLs in the database
          const url = res.data.url;
          const relativePath = url.includes("/api/") ? "/api/" + url.split("/api/")[1] : url;
          uploadedUrls.push(relativePath);
        }
      }

      setPostImages(prev => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded!`);
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postText.trim()) return;

    const charCount = postText.trim().length;
    if (charCount < 50) {
      toast.error("Please enter at least 50 characters.");
      return;
    }

    if (postImages.length === 0) {
      toast.error("Image upload is required.");
      return;
    }


    try {
      setSubmitting(true);
      const res = await feedAPI.create({ text: postText, images: postImages });
      if (res.success) {
        toast.success("Post submitted for approval!");
        setPostText("");
        setPostImages([]);
        setActiveTab("wall");
        setShowSuccessMessage(true);
        fetchFeeds();
        // Auto-hide after 8 seconds
        setTimeout(() => setShowSuccessMessage(false), 15000);
      }
    } catch (err) {
      toast.error(err.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (id) => {
    try {
      const res = await feedAPI.toggleLike(id);
      if (res.success) {
        setFeeds(prev => prev.map(f => f._id === id ? { ...f, likes: res.likes } : f));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header - Minimal */}
        <div className="border-b-4 border-[#3AB000] pb-6 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
              Employee <span className="text-[#3AB000]">Feed</span>
            </h1>
            <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.3em] mt-1">
              Community & Engagement Wall
            </p>
          </div>

          <button
            onClick={() => !isSocialLocked && setShowHistoryModal(true)}
            disabled={isSocialLocked}
            className={`flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-black text-black text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-md group ${isSocialLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-black hover:text-white"}`}
          >
            <History size={16} className={isSocialLocked ? "" : "group-hover:rotate-[-45deg] transition-transform"} />
            My Publications
          </button>
        </div>

        {/* Publication Policy Strip */}
        <div className="bg-amber-50 border border-amber-100 px-4 py-2 mb-8 flex items-center gap-3">
          <AlertCircle size={14} className="text-amber-500" />
          <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wider">
            All posts are moderated. Approval takes 12-24 hrs. Avoid sharing sensitive data.
          </p>
        </div>

        <div className="max-w-[600px] mx-auto space-y-6">
          {/* Post Submission Success Message */}
          {showSuccessMessage && (
            <div className="bg-[#e8f5e2] border-2 border-[#3AB000] p-4 animate-in fade-in slide-in-from-top duration-500 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#3AB000]"></div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-[#3AB000] shrink-0 mt-0.5" size={20} />
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-[#0A3D00] uppercase tracking-wider">Feed Sent Successfully!</p>
                  <p className="text-[10px] font-bold text-gray-700 leading-relaxed">
                    Your post is currently <span className="text-[#3AB000] font-black">UNDER REVIEW</span> and will be visible on the wall once approved by the administrator.
                    You can monitor the status of your post in the <span className="font-black underline cursor-pointer" onClick={() => setShowHistoryModal(true)}>My Publications</span> section.
                  </p>
                </div>
                <button onClick={() => setShowSuccessMessage(false)} className="ml-auto text-gray-400 hover:text-black">
                  <XCircle size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Create Post Composer - Top of Feed */}
          <div className="bg-white border border-[#3AB000] p-4 md:p-6 shadow-sm rounded-none mb-8">
            <div className="flex gap-4 mb-4">
              <div className="w-10 h-10 bg-[#3AB000] text-white flex items-center justify-center font-black text-sm rounded-none shrink-0 overflow-hidden">
                {currentUserData?.photo ? (
                  <img src={cleanImageUrl(currentUserData.photo)} alt="Me" className="w-full h-full object-cover" />
                ) : (
                  currentUserData?.name?.[0] || JSON.parse(localStorage.getItem('jssa_auth'))?.user?.name?.[0] || "U"
                )}
              </div>
              <div className="w-full relative">
                <textarea
                  required
                  disabled={isSocialLocked}
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="What's on your mind today? Share an update with the team..."
                  className={`w-full p-3 pb-8 bg-gray-50 border border-gray-100 focus:border-[#3AB000] outline-none text-sm font-bold min-h-[100px] transition-all rounded-none resize-none ${isSocialLocked ? "blur-[2px] select-none" : ""}`}
                />
                
                <div className="absolute bottom-3 right-3 text-[10px] font-black uppercase tracking-wider pointer-events-none">
                  <span className={postText.trim().length < 50 ? "text-red-500" : "text-[#3AB000]"}>
                    {postText.trim().length}
                  </span>
                  <span className="text-gray-400"> / 50 Chars Min</span>
                </div>

                {isSocialLocked && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/10 backdrop-blur-[1px]">
                    <div className="bg-black/90 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-2xl border-t-2 border-[#3AB000]">
                      Features will be enabled after official training
                    </div>
                  </div>
                )}
              </div>
            </div>

            {postImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {postImages.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square border border-gray-300">
                    <img src={cleanImageUrl(img)} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPostImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-1 bg-black/80 text-white hover:bg-red-600 transition-colors"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 relative">
              <label className={`flex items-center gap-2 group ${isSocialLocked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                <div className="p-2 bg-gray-50 group-hover:bg-green-50 transition-all border border-gray-200">
                  <Camera size={18} className="text-gray-400 group-hover:text-[#3AB000]" />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-black">
                  {uploading ? "Uploading..." : "Add Media Files"}
                </span>
                {!isSocialLocked && <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />}
              </label>

              <button
                onClick={handleCreatePost}
                disabled={isSocialLocked || submitting || !postText.trim()}
                className="px-8 py-2.5 bg-[#3AB000] text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-all flex items-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                Post
              </button>
            </div>
          </div>

          {/* Feed Wall Items */}
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-[#3AB000]" />
              </div>
            ) : feeds.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 p-20 text-center">
                <ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No publications yet</p>
              </div>
            ) : (
              feeds.map((feed) => (
                <FeedCard
                  key={feed._id}
                  feed={feed}
                  onLike={handleLike}
                  onViewImage={setViewerImage}
                  currentUserId={currentUserData?.userId?._id || currentUserData?.userId}
                  isLocked={isSocialLocked}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* History Modal - Full Page */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[1500] bg-white animate-in slide-in-from-bottom duration-300 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 md:px-12 py-6 bg-[#3AB000] shadow-lg shrink-0">
            <div>
              <h2 className="text-white font-black text-2xl flex items-center gap-3 uppercase tracking-tighter">
                <History size={28} />
                My Publication <span className="opacity-70">Archive</span>
              </h2>
              <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em] mt-1">
                Track status and engagement of your posts
              </p>
            </div>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="p-3 bg-black hover:bg-white hover:text-black text-white transition-all rounded-none border border-black"
            >
              <XCircle size={24} />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-gray-100/50 px-4 md:px-8 py-8">
            <div className="w-full max-w-[100rem]">
              {myFeeds.length === 0 ? (
                <div className="text-center py-32 bg-white border border-dashed border-gray-300 mx-auto max-w-4xl">
                  <Clock size={64} className="text-gray-100 mx-auto mb-6" />
                  <p className="text-[12px] font-black text-gray-300 uppercase tracking-[0.3em]">No publication history found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                  {myFeeds.map((mf) => (
                    <div key={mf._id} className="bg-white border-2 border-gray-100 p-0 flex flex-col shadow-sm hover:shadow-2xl hover:border-[#3AB000] transition-all group relative">
                      {/* Status Header - Professional */}
                      <div className={`px-4 py-3.5 flex justify-between items-center border-b-2 ${mf.status === 'Approved' ? 'bg-[#3AB000] border-[#3AB000]' :
                        mf.status === 'Rejected' ? 'bg-red-600 border-red-600' : 'bg-amber-500 border-amber-500'
                        }`}>
                        <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                          {mf.status === 'Approved' ? <CheckCircle2 size={16} /> : mf.status === 'Rejected' ? <XCircle size={16} /> : <Clock size={16} />}
                          {mf.status}
                        </span>
                        <p className="text-[10px] font-black text-white uppercase tracking-tighter bg-black/20 px-2 py-0.5 rounded-none border border-white/10">
                          {new Date(mf.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Content Section */}
                      <div className="p-4 flex-1 space-y-4">
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                            <div className="w-1 h-3 bg-[#3AB000]"></div>
                            <MessageSquare size={12} className="text-[#3AB000]" /> Publication Data
                          </p>
                          <div className="bg-gray-50 border border-gray-200 p-3 italic text-[12px] font-bold text-gray-800 leading-relaxed border-l-4 border-l-[#3AB000]">
                            "{mf.text}"
                          </div>
                        </div>

                        {/* Images Section with Label */}
                        {(mf.images?.length > 0 || mf.image) && (
                          <div className="space-y-1.5">
                            <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                              <div className="w-1 h-3 bg-[#3AB000]"></div>
                              <ImageIcon size={12} className="text-[#3AB000]" /> Media Attachments
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {mf.images?.length > 0 ? (
                                mf.images.slice(0, 3).map((img, i) => (
                                  <div key={i} className="aspect-square border-2 border-gray-200 overflow-hidden relative group/img cursor-pointer shadow-md" onClick={() => setViewerImage(img)}>
                                    <img src={cleanImageUrl(img)} alt="Hist" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
                                    {i === 2 && mf.images.length > 3 && (
                                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white text-[12px] font-black">
                                        +{mf.images.length - 3}
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                      <Eye size={18} className="text-white" />
                                    </div>
                                  </div>
                                ))
                              ) : mf.image && (
                                <div className="aspect-square border-2 border-gray-200 overflow-hidden cursor-pointer shadow-md group/img relative" onClick={() => setViewerImage(mf.image)}>
                                  <img src={cleanImageUrl(mf.image)} alt="Hist" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <Eye size={18} className="text-white" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Moderation Log Footer */}
                      {mf.adminRemarks && (
                        <div className="mt-auto bg-[#0A3D00] p-4 border-t-2 border-[#3AB000]">
                          <p className="text-[9px] font-black text-[#3AB000] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <ShieldCheck size={14} /> Moderation Log
                          </p>
                          <p className="text-[11px] font-bold text-white italic leading-snug bg-white/5 p-3 border-l-4 border-[#3AB000]">
                            "{mf.adminRemarks}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="bg-white border-t-2 border-gray-100 px-6 py-6 flex justify-center shrink-0">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="px-12 py-3 bg-black text-white text-xs font-black uppercase tracking-[0.3em] hover:bg-[#3AB000] transition-all shadow-xl"
            >
              Return to Community Wall
            </button>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewerImage && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setViewerImage(null)}>
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center pointer-events-none">
            <button
              onClick={() => setViewerImage(null)}
              className="absolute top-4 right-4 z-10 p-3 bg-white/10 hover:bg-[#3AB000] text-white transition-all rounded-none border border-white/20 pointer-events-auto shadow-2xl"
            >
              <XCircle size={24} strokeWidth={2} />
            </button>
            <img
              src={cleanImageUrl(viewerImage)}
              alt="Full view"
              className="max-w-full max-h-full object-contain shadow-2xl pointer-events-auto border-4 border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 px-6 py-2 border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.3em]">
            Press anywhere to close preview
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const FeedCard = ({ feed, onLike, onViewImage, currentUserId, isLocked }) => {
  const isLiked = feed.likes?.some(id => (id?._id || id)?.toString() === currentUserId?.toString());

  return (
    <div className="bg-white border border-[#3AB000] rounded-none overflow-hidden shadow-sm hover:shadow-lg transition-all">
      {/* Header - Social Style */}
      <div className="p-3 px-4 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#3AB000] text-white flex items-center justify-center font-black text-xs uppercase rounded-none border-2 border-white shadow-sm overflow-hidden">
            {feed.author?.photo ? (
              <img src={cleanImageUrl(feed.author.photo)} alt={feed.author?.name} className="w-full h-full object-cover" />
            ) : (
              feed.author?.name?.[0] || feed.author?.email?.[0] || "U"
            )}
          </div>
          <div>
            <p className="text-[12px] font-black text-gray-900 tracking-tight leading-none mb-0.5">
              {feed.author?.name || feed.author?.email?.split('@')[0]}
            </p>
            <p className="text-[10px] font-bold text-gray-400 tracking-tighter uppercase">
              {new Date(feed.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <button className="text-gray-300 hover:text-[#3AB000] transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Text Content */}
      <div className="px-4 pb-3">
        <p className="text-[13px] font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
          {feed.text}
        </p>
      </div>

      {/* Media Content - Multiple Images Support */}
      {(feed.images?.length > 0 || feed.image) && (
        <div className="bg-gray-50 border-y border-gray-100">
          {feed.images?.length > 0 ? (
            <div className={`grid gap-0.5 ${feed.images.length === 1 ? "grid-cols-1" :
              feed.images.length === 2 ? "grid-cols-2" :
                "grid-cols-2"
              }`}>
              {feed.images.map((img, idx) => (
                <div key={idx} className={`${feed.images.length === 3 && idx === 0 ? "col-span-2 h-72" : "h-64"} overflow-hidden border-gray-100 relative group cursor-pointer`} onClick={() => onViewImage(cleanImageUrl(img))}>
                  <img
                    src={cleanImageUrl(img)}
                    alt={`Post media ${idx}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-none border border-white/30">
                      <Eye size={24} className="text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative group cursor-pointer overflow-hidden" onClick={() => onViewImage(cleanImageUrl(feed.image))}>
              <img
                src={cleanImageUrl(feed.image)}
                alt="Post media"
                className="w-full h-auto object-cover max-h-[600px] group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-none border border-white/30">
                  <Eye size={28} className="text-white" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interaction - Minimalist */}
      <div className="px-4 py-3 bg-white flex items-center">
        <button
          onClick={() => !isLocked && onLike(feed._id)}
          disabled={isLocked}
          className={`flex items-center gap-2 transition-all group ${isLocked ? "opacity-60 cursor-not-allowed" : (isLiked ? "text-[#3AB000]" : "text-gray-400 hover:text-[#3AB000]")}`}
        >
          <div className={`transition-all ${isLiked && !isLocked ? "scale-110" : (!isLocked && "group-hover:scale-110")}`}>
            <Heart
              size={22}
              fill={isLiked ? (isLocked ? "#d1d5db" : "#3AB000") : "none"}
              stroke={isLiked ? (isLocked ? "#d1d5db" : "#3AB000") : "currentColor"}
              strokeWidth={isLiked ? 2.5 : 2}
            />
          </div>
          <span className={`text-[13px] font-black ${isLiked ? (isLocked ? "text-gray-400" : "text-[#3AB000]") : "text-gray-400"}`}>
            {feed.likes?.length || 0}
          </span>
        </button>

        <div className="ml-auto">
          <span className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.2em] opacity-80">
            JSSA COMMUNITY
          </span>
        </div>
      </div>
    </div>
  );
};

export default EmployeeFeed;
