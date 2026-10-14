import React, { useState, useEffect } from "react";
import { refundAPI } from "../utils/api";
import { useAuth } from "../auth/AuthProvider";
import { LogOut, AlertOctagon } from "lucide-react";

const RefundTerminationModal = () => {
  const [approvedRefund, setApprovedRefund] = useState(null);
  const { role, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    // Only check for non-admin users who are logged in
    if (!isAuthenticated || role === "admin" || role === "superadmin" || role === "staff") {
      setApprovedRefund(null);
      return;
    }

    const checkRefundStatus = async () => {
      try {
        const res = await refundAPI.getMyRequests();
        if (res.success && res.data) {
          const approved = res.data.find(req => req.status === "Approved");
          if (approved) {
            setApprovedRefund(approved);
          }
        }
      } catch (err) {
        console.error("Refund check failed:", err);
      }
    };

    checkRefundStatus();
  }, [role, isAuthenticated]);

  if (!approvedRefund) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white rounded-none border-t-8 border-[#3AB000] shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-100">
          <AlertOctagon className="w-10 h-10 text-red-600" />
        </div>

        <h2 className="text-2xl font-black text-gray-900 text-center uppercase tracking-tighter mb-2">
          Account <span className="text-[#3AB000]">Terminated</span>
        </h2>
        <p className="text-[10px] font-black text-gray-400 text-center uppercase tracking-widest mb-8">
          Refund Approved & Access Revoked
        </p>

        <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-6 space-y-4 mb-8">
          <p className="text-xs font-bold text-gray-600 leading-relaxed text-center italic">
            "Aapka refund request approve kar diya gaya hai. Policy ke mutabik, refund ke baad aapka account terminate kar diya gaya hai."
          </p>
          
          <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Refund Amount</p>
              <div className="flex items-center gap-1 text-[#3AB000] font-black text-lg">
                <span>₹</span>
                <span>{approvedRefund.amount}</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Refund ID</p>
              <p className="text-xs font-black text-gray-900 truncate">
                {approvedRefund.refundRefId || approvedRefund._id?.toString().slice(-8).toUpperCase() || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            setApprovedRefund(null);
          }}
          className="w-full py-4 bg-black text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-[#3AB000] transition-all flex items-center justify-center gap-3 shadow-xl"
        >
          <LogOut size={18} />
          Logout & Exit System
        </button>
      </div>
    </div>
  );
};

export default RefundTerminationModal;
