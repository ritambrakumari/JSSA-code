import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { 
  CreditCard, 
  Settings, 
  Save, 
  RefreshCcw, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  UserPlus, 
  UserCheck,
  AlertCircle,
  Loader2
} from "lucide-react";
import { api } from "../../utils/api";
import { toast } from "react-hot-toast";

const SalaryManagement = () => {
  const [config, setConfig] = useState({
    cardPrice: 150,
    commissions: { PE: 50, BS: 100, DM: 150 }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.systemConfig.getCurrent();
      if (res.success) {
        setConfig(res.data);
      }
    } catch (error) {
      console.error("Fetch Config Error:", error);
      toast.error("Failed to load system configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.systemConfig.update(config);
      if (res.success) {
        toast.success("Configuration saved successfully!", {
          duration: 4000,
          position: 'top-center',
          style: { background: '#3AB000', color: '#fff', fontWeight: 'bold' }
        });
      } else {
        toast.error(res.message || "Failed to save configuration", {
          duration: 4000,
          position: 'top-center'
        });
      }
    } catch (error) {
      toast.error(error.message || "An unexpected error occurred", {
        duration: 4000,
        position: 'top-center'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 size={40} className="animate-spin text-[#3AB000]" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Salary Protocols...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[99rem] mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white border-2 border-[#3AB000]/20 border-l-8 border-l-[#3AB000] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 opacity-50" />
           <div className="relative z-10">
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                 <Settings className="text-[#3AB000]" size={28} />
                 Salary & Pricing Control
              </h1>
              <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.2em] mt-1">Configure Card Pricing & Hierarchy Commissions</p>
           </div>
           
           <button 
              onClick={handleSave}
              disabled={saving}
              className="relative z-10 bg-[#3AB000] hover:bg-black text-white px-8 py-3 flex items-center gap-2 transition-all shadow-lg shadow-green-100 font-black text-xs uppercase tracking-widest"
           >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? "Processing..." : "Save Configuration"}
           </button>
        </div>

         <div className="grid grid-cols-1 gap-8">
            {/* Card Pricing Configuration */}
            <div className="space-y-6">
               <div className="bg-white border-2 border-[#3AB000]/20 border-t-8 border-t-[#3AB000] p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="p-3 bg-green-50 text-[#3AB000] rounded-lg">
                        <CreditCard size={20} />
                     </div>
                     <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Card Issuance Pricing</h3>
                  </div>
                  
                  <div className="space-y-4">
                     <div>
                        <label className="text-sm font-black text-gray-800 uppercase tracking-widest mb-2 block">
                           Deduction Amount (Recharge Wallet)
                        </label>
                        <div className="relative group">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#3AB000]">₹</span>
                           <input 
                              type="number"
                              value={config.cardPrice}
                              onChange={(e) => setConfig({ ...config, cardPrice: Number(e.target.value) })}
                              className="w-full bg-green-50/30 border-2 border-[#3AB000]/20 pl-10 pr-4 py-4 text-2xl font-black text-[#3AB000] focus:border-[#3AB000] focus:bg-white outline-none transition-all rounded-md group-hover:border-[#3AB000]/40"
                              placeholder="0.00"
                           />
                        </div>
                        <p className="mt-2 text-[9px] font-bold text-gray-400 leading-relaxed uppercase">
                           This amount will be automatically deducted from the Employee's Recharge Wallet upon card creation.
                        </p>
                     </div>
                  </div>
               </div>

               <div className="bg-amber-50 border-l-4 border-amber-400 p-6 flex gap-4">
                  <AlertCircle className="text-amber-500 shrink-0" size={24} />
                  <div>
                     <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">Warning: Financial Protocol</h4>
                     <p className="text-[11px] font-bold text-amber-800 leading-tight">
                        Any changes made here will reflect immediately across all card issuance events. Ensure your hierarchy logic is synced with the new commission values.
                     </p>
                  </div>
               </div>
            </div>
         </div>

        {/* Footer Info */}
        <div className="text-center">
           <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">
              JSSA Secure Infrastructure • Hierarchy Commission Protocol V4.2
           </p>
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SalaryManagement;
