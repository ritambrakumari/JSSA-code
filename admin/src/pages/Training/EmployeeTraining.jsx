import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { 
  Video, 
  Search, 
  RefreshCw, 
  AlertCircle,
  PlayCircle,
  BookOpen,
  Filter,
  Loader2
} from "lucide-react";
import { apiRequest } from "../../utils/api";
import { toast } from "react-hot-toast";

const TrainingVideo = ({ video }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  // Extract src from iframe string if necessary
  const src = video.embedLink.match(/src="([^"]+)"/)?.[1] || video.embedLink;

  return (
    <div className="aspect-video bg-[#0a0a0a] relative video-embed-wrapper overflow-hidden">
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-20">
          <RefreshCw className="w-8 h-8 text-[#3AB000] animate-spin mb-2" />
          <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Loading Module...</p>
          <div className="mt-4 w-32 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#3AB000] animate-progress-indeterminate"></div>
          </div>
        </div>
      )}
      <iframe
        src={src}
        title={video.title}
        className={`w-full h-full transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

const EmployeeTraining = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/training", { method: "GET" });
      if (res.success) {
        setTrainings(res.data);
      }
    } catch (error) {
      toast.error("Failed to load training videos");
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { title: "District Manager", color: "#3AB000" },
    { title: "Block Supervisor", color: "#0A3D00" },
    { title: "Panchayat Executive", color: "#666666" }
  ];

  const filteredTrainings = trainings.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-0 ml-0 md:ml-6 px-2 md:px-0 pr-2 md:pr-6 mt-4 space-y-6 h-full w-full pb-20">
        
        {/* Hero Section */}
        <div className="bg-white p-6 border border-gray-200 rounded-none shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase">
              <BookOpen className="w-8 h-8 text-[#3AB000]" />
              Learning Center
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Access all your post-specific training modules here</p>
          </div>
          <div className="absolute right-[-20px] top-[-20px] opacity-[0.05]">
            <Video size={120} className="text-[#3AB000]" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search training modules by name..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-sm font-bold shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={fetchTrainings}
            className="bg-white border border-gray-200 p-3 text-gray-500 hover:text-[#3AB000] transition-colors shadow-sm"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={20} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white h-[300px] animate-pulse border border-gray-100"></div>
            ))}
          </div>
        ) : trainings.length === 0 ? (
          <div className="bg-white py-20 text-center border border-gray-200">
            <AlertCircle size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No training modules available right now</p>
          </div>
        ) : (
          <div className="space-y-12">
            {sections.map(section => {
              const sectionVideos = filteredTrainings.filter(t => t.postType === section.title);
              if (sectionVideos.length === 0 && searchTerm) return null;

              return (
                <div key={section.title} className="space-y-6">
                  {/* Premium Section Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 border-l-[12px] border-[#3AB000] shadow-md relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-32 bg-[#3AB000]/[0.02] -skew-x-12 translate-x-16 transition-transform group-hover:translate-x-12"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-[#3AB000] animate-pulse shadow-[0_0_8px_#3AB000]" />
                        <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.3em]">Training Curriculum</p>
                      </div>
                      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none flex flex-wrap items-center gap-3">
                        {section.title}
                        <span className="text-[11px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-none uppercase tracking-widest flex items-center gap-2">
                          <Video size={12} className="text-[#3AB000]" />
                          {sectionVideos.length} {sectionVideos.length === 1 ? 'Module' : 'Modules'}
                        </span>
                      </h2>
                    </div>
                    <div className="hidden lg:flex flex-col items-end gap-1 opacity-40">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em]">Official Training</p>
                      <div className="h-[2px] w-24 bg-gradient-to-r from-transparent to-[#3AB000]"></div>
                    </div>
                  </div>

                  {sectionVideos.length === 0 ? (
                    <p className="text-xs font-bold text-gray-400 uppercase italic">No modules listed under this category.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <style>{`
                        @keyframes progress-indeterminate {
                          0% { transform: translateX(-100%); }
                          100% { transform: translateX(100%); }
                        }
                        .animate-progress-indeterminate {
                          animation: progress-indeterminate 1.5s infinite linear;
                        }
                      `}</style>
                      {sectionVideos.map(video => (
                        <div key={video._id} className="bg-white border border-gray-200 rounded-none overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                          {/* Video Component with Loader */}
                          <TrainingVideo video={video} />
                          
                          {/* Info */}
                          <div className="p-4 bg-white">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-black text-gray-900 uppercase leading-snug group-hover:text-[#3AB000] transition-colors line-clamp-2">
                                {video.title}
                              </h3>
                              <PlayCircle size={18} className="text-gray-300 group-hover:text-[#3AB000] transition-colors flex-shrink-0" />
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                              <span className="text-[9px] font-black text-[#3AB000] uppercase bg-green-50 px-2 py-0.5 tracking-tighter">
                                Verified Module
                              </span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                Added {new Date(video.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeeTraining;
