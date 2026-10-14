import React, { useState, useEffect } from "react";
import { Headset, Phone, Clock, Info } from "lucide-react";
import { api } from "../utils/api";
import { useAuth } from "../auth/AuthProvider";
import jssaLogo from "../assets/JSSAogo.png";

const StateSupportButton = () => {
  const { role } = useAuth();
  const [supportData, setSupportData] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Only fetch for employees
    if (role === "employee") {
      fetchMyStateSupport();
    }
  }, [role]);

  const fetchMyStateSupport = async () => {
    try {
      const res = await api.support.getMyStateSupport();
      if (res.success && res.data && res.data.contacts.length > 0) {
        setSupportData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch state support", error);
    }
  };

  if (!supportData || role !== "employee") return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Floating Button */}
        <button className="bg-[#3AB000] text-white p-4 rounded-full shadow-2xl hover:bg-[#2d8a00] hover:scale-110 transition-all duration-300 flex items-center justify-center border-4 border-white">
          <Headset size={28} className="animate-pulse" />
        </button>

        {/* Tooltip / Popup */}
        <div
          className={`absolute bottom-full right-0 pb-4 w-72 transition-all duration-300 origin-bottom-right ${isHovered ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
            }`}
        >
          <div className="bg-white rounded-xl shadow-2xl border border-[#bbf7d0] overflow-hidden">
            <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-4 text-white flex items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiMzQUIwMDAiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSI+PC9wYXRoPgo8L3N2Zz4=')] opacity-30"></div>
              
              <div className="bg-white p-1.5 rounded-xl shadow-md shrink-0 relative z-10">
                <img src={jssaLogo} alt="JSS Abhiyan Logo" className="h-10 w-10 object-contain" />
              </div>
              
              <div className="text-left relative z-10 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#e0f2d8] mb-0.5">JSS Abhiyan</p>
                <h3 className="text-[15px] font-black uppercase tracking-wide text-white drop-shadow-sm leading-tight">Support Help Desk</h3>
              </div>
            </div>

            <div className="p-4 bg-white">
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar-green pr-1">
                {supportData.contacts.map((contact) => (
                  <div key={contact._id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 hover:border-[#bbf7d0] transition-colors group">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone size={14} className="text-[#3AB000] group-hover:scale-110 transition-transform" />
                      <a href={`tel:${contact.mobile}`} className="text-sm font-black text-gray-800 hover:text-[#3AB000]">
                        {contact.mobile}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-500 uppercase">{contact.timing}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#f2fcf5] p-2.5 mt-3 border border-[#bbf7d0] rounded-lg flex gap-2 items-start">
                <Info size={14} className="text-[#3AB000] shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium text-[#2d8a00] leading-relaxed">
                  <strong>Note:</strong> Kindly reach out to support <span className="font-bold">only during the given time</span>.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar-green::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-green::-webkit-scrollbar-thumb {
          background: #bbf7d0;
          border-radius: 10px;
        }
        .custom-scrollbar-green::-webkit-scrollbar-thumb:hover {
          background: #86efac;
        }
      `}</style>
    </div>
  );
};

export default StateSupportButton;
