import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ShieldAlert, ArrowRight, Lock } from "lucide-react";

const ZoneLockEmptyState = ({ title = "Jurisdiction Configuration Required", description = "To access your dashboard and manage your team, you must first verify and lock your assigned working district/block." }) => {
   const navigate = useNavigate();

   return (
      <div className="flex flex-col items-center justify-center text-center p-8 md:p-16 min-h-[60vh] bg-white rounded-2xl border-2 border-dashed border-[#b9d3f0] shadow-sm" style={{ fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
         <div className="relative mb-10">
            <div className="w-24 h-24 bg-amber-50 rounded-2xl flex items-center justify-center animate-pulse">
               <MapPin size={48} className="text-amber-500" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white shadow-lg rounded-xl flex items-center justify-center border-2 border-amber-500">
               <Lock size={18} className="text-amber-600" />
            </div>
         </div>

         <div className="max-w-md space-y-4">
            <h2 className="text-2xl md:text-[26px] font-bold text-[#123b68] leading-tight">
               {title}
            </h2>
            <p className="text-[15px] font-medium text-[#5d7088] leading-relaxed">
               {description}
            </p>
         </div>

         <button
            onClick={() => navigate("/employee/working-zone")}
            className="mt-10 group relative flex items-center gap-3 px-9 py-3.5 bg-[#1761b0] text-white rounded-lg shadow-md overflow-hidden transition-all hover:bg-[#123b68]"
         >
            <span className="text-[15px] font-bold relative z-10">Set Working Zone</span>
            <ArrowRight size={18} className="relative z-10 transition-transform group-hover:translate-x-2" />
            
            {/* Hover Background Animation */}
            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
         </button>

         <div className="mt-10 flex items-center gap-2 opacity-60">
            <ShieldAlert size={14} className="text-gray-400" />
            <span className="text-[11px] font-semibold text-[#6b7d93] uppercase tracking-wider">Secure Jurisdiction Protocol</span>
         </div>
      </div>
   );
};

export default ZoneLockEmptyState;
