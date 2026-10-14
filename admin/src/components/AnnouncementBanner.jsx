import React, { useState, useEffect } from "react";
import { announcementAPI } from "../utils/api";
import { useAuth } from "../auth/AuthProvider";
import { Bell, X, Info, Megaphone } from "lucide-react";

const AnnouncementBanner = () => {
  const { role } = useAuth();
  const [announcement, setAnnouncement] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show for employees
    if (role !== "employee") return;

    const fetchLatestAnnouncement = async () => {
      try {
        const res = await announcementAPI.getLatest();
        if (res && res.success && res.data) {
          // Check if this specific announcement has been dismissed
          const dismissedId = sessionStorage.getItem("dismissed_announcement_id");
          if (dismissedId !== res.data._id) {
            setAnnouncement(res.data);
            setIsVisible(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch announcement:", err);
      }
    };

    fetchLatestAnnouncement();
  }, [role]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (announcement) {
      sessionStorage.setItem("dismissed_announcement_id", announcement._id);
    }
  };

  if (!isVisible || !announcement) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-[40] px-4 flex justify-center md:pl-60 md:pr-4 pointer-events-none">
      <div className="relative group bg-[#064e3b] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-[#3AB000] overflow-hidden flex flex-col items-start justify-center p-5 md:p-6 text-left animate-intense-blink pointer-events-auto w-full max-w-xl">
        
        {/* Animated Shine Layer */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] animate-shine" />
        </div>

        <div className="relative z-10 flex flex-col items-start w-full">
          {/* Top Icon & Badge Row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#3AB000] p-2 rounded-xl shadow-lg animate-bounce-slow">
              <Megaphone size={18} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[#3AB000] text-sm md:text-base font-black uppercase tracking-[0.2em] leading-none mb-1 drop-shadow-md">
                JSSA OFFICIAL
              </span>
              <div className="h-1 w-full bg-gradient-to-r from-[#3AB000] to-transparent rounded-full shadow-sm" />
            </div>
          </div>
          
          {/* Title Area */}
          <h3 className="text-white text-lg md:text-xl font-black tracking-tight leading-tight uppercase mb-2">
            {announcement.title}
          </h3>
          
          {/* Message Area */}
          <p className="text-green-50/90 text-sm md:text-base font-bold leading-relaxed max-w-[95%]">
            {announcement.message}
          </p>
        </div>
        
        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-[#3AB000] hover:text-white rounded-full text-white transition-all border border-white/10 shadow-lg active:scale-90 z-20"
          title="Dismiss"
        >
          <X size={18} />
        </button>

        {/* Improved Intense Blinking & Eye-Catching CSS */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes intense-blink {
            0% { border-color: #3AB000; box-shadow: 0 0 10px rgba(58, 176, 0, 0.2); }
            50% { border-color: #ffffff; box-shadow: 0 0 30px rgba(58, 176, 0, 0.6); }
            100% { border-color: #3AB000; box-shadow: 0 0 10px rgba(58, 176, 0, 0.2); }
          }
          @keyframes shine {
            0% { left: -100%; }
            15% { left: 100%; }
            100% { left: 100%; }
          }
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          .animate-intense-blink {
            animation: intense-blink 1.2s infinite ease-in-out;
          }
          .animate-shine {
            animation: shine 4s infinite linear;
          }
          .animate-bounce-slow {
            animation: bounce-slow 2s infinite ease-in-out;
          }
        `}} />
      </div>
    </div>
  );
};

export default AnnouncementBanner;
