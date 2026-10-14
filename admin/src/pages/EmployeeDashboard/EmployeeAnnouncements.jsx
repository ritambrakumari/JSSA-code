import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { announcementAPI } from "../../utils/api";
import { 
  Bell, 
  Megaphone, 
  Calendar, 
  Clock, 
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react";

const EmployeeAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setIsLoading(true);
        const res = await announcementAPI.getAll();
        if (res && res.success) {
          setAnnouncements(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Header Section */}
        <div className="border-b-4 border-[#3AB000] pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
              Official <span className="text-[#3AB000]">Announcements</span>
            </h1>
            <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.3em] mt-1">
              JSSA Internal Communications Hub
            </p>
          </div>
          <div className="bg-green-50 px-4 py-2 border border-[#3AB000] rounded-none flex items-center gap-2">
            <Bell size={14} className="text-[#3AB000] animate-bounce" />
            <span className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest">
              {announcements.length} Active Notice{announcements.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#3AB000]" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Synchronizing Bulletin Board...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-300 p-20 text-center rounded-none">
              <div className="w-16 h-16 bg-gray-50 rounded-none border border-gray-300 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-200" />
              </div>
              <p className="text-[11px] font-black text-gray-300 uppercase tracking-widest">No active announcements at this time</p>
              <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-tighter">Check back later for official updates from management.</p>
            </div>
          ) : (
            announcements.map((item) => (
              <div 
                key={item._id} 
                className="group bg-white border border-gray-300 hover:border-[#3AB000] transition-all duration-300 rounded-none overflow-hidden shadow-sm hover:shadow-xl"
              >
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                  {/* Left Side: Icon/Date */}
                  <div className="flex md:flex-col items-center md:items-start justify-between md:justify-start gap-4 md:w-32 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-6">
                    <div className="bg-[#3AB000] p-3 rounded-none text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Megaphone size={20} />
                    </div>
                    <div className="text-right md:text-left">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">
                        <Calendar size={10} />
                        {new Date(item.publishedAt || item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-[#3AB000] uppercase tracking-tighter">
                        <Clock size={10} />
                        {new Date(item.publishedAt || item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 bg-green-50 text-[#3AB000] text-[9px] font-black uppercase tracking-widest border border-[#3AB000] rounded-none">
                        Official
                      </span>
                      {item.expiryDate && (
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-200 rounded-none">
                          Limited Time
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-4 group-hover:text-[#3AB000] transition-colors leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base font-medium leading-relaxed whitespace-pre-wrap">
                      {item.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Policy */}
        <div className="mt-12 p-6 bg-gray-50 rounded-none border border-gray-300 flex items-start gap-4">
           <AlertCircle className="text-[#3AB000] shrink-0 mt-0.5" size={18} />
           <div>
             <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest mb-1">Notice Policy</p>
             <p className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase tracking-widest">
               All announcements published here are legally binding internal communications from the JSSA administration. 
               Employees are required to read and acknowledge these updates as part of their training and operational compliance.
             </p>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeAnnouncements;
