import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaWhatsapp } from "react-icons/fa";
import { useAuth } from "../auth/AuthProvider";

const WhatsAppChannelFloatingIcon = () => {
  const [whatsappChannel, setWhatsappChannel] = useState("");
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const response = await axios.get(`${apiUrl}/landing-config/whatsapp-channel`);
        if (response.data && response.data.whatsappChannel) {
          setWhatsappChannel(response.data.whatsappChannel);
        }
      } catch (error) {
        console.error("Error fetching WhatsApp Channel config", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChannel();
  }, [apiUrl]);

  // Check if role is allowed
  const allowedRoles = ["employee", "staff", "cardholder"];
  const userRole = role?.toLowerCase();
  const isAllowed = userRole && allowedRoles.includes(userRole);

  if (loading || !whatsappChannel || !isAllowed) return null;

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[100] flex flex-col items-end group cursor-pointer" 
         onClick={() => window.open(whatsappChannel, "_blank")}
    >
      {/* Tooltip on Top */}
      <div className="absolute right-2 bottom-full mb-3 bg-white px-3 py-1.5 rounded-md shadow-[0_4px_15px_rgba(0,0,0,0.1)] text-[#25D366] font-black text-[11px] uppercase tracking-widest whitespace-nowrap border border-[#25D366]/20 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-y-2 group-hover:translate-y-0 flex flex-col items-center">
        Join Channel
        {/* Tooltip arrow pointing down */}
        <div className="absolute top-full right-4 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-white drop-shadow-md"></div>
      </div>

      {/* Main Icon Button */}
      <div className="w-14 h-14 bg-[#25D366] rounded-l-xl shadow-xl flex items-center justify-center relative overflow-hidden group-hover:w-16 transition-all duration-300">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-150 transition-transform duration-500 rounded-full blur-md"></div>
        
        {/* We use FaWhatsapp from react-icons */}
        <FaWhatsapp 
          size={32} 
          color="white" 
          className="relative z-10 group-hover:scale-110 transition-transform duration-300"
        />
        
        {/* Notification Ping Badge */}
        <span className="absolute top-2 right-2 flex h-3 w-3 z-20">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-[#25D366]"></span>
        </span>
      </div>
    </div>
  );
};

export default WhatsAppChannelFloatingIcon;
