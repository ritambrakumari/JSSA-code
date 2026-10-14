import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { systemConfigAPI } from "../../utils/api";
import { Settings, Save, Percent } from "lucide-react";
import toast from "react-hot-toast";

const PharmacyDiscountConfig = () => {
  const [discountPercent, setDiscountPercent] = useState(10);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await systemConfigAPI.getCurrent();
      if (res.success && res.data) {
        setDiscountPercent(res.data.pharmacyDiscountPercent !== undefined ? res.data.pharmacyDiscountPercent : 10);
      }
    } catch (error) {
      toast.error("Failed to load discount config");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (discountPercent < 0 || discountPercent > 100) {
      toast.error("Discount percentage must be between 0 and 100");
      return;
    }
    setSaving(true);
    try {
      const res = await systemConfigAPI.update({ pharmacyDiscountPercent: Number(discountPercent) });
      if (res.success) {
        toast.success("Pharmacy Discount updated successfully!");
      } else {
        toast.error(res.error || "Failed to update discount");
      }
    } catch (error) {
      toast.error("Failed to update discount config");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30">
                <Settings className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Global Configurations</h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Manage settings and configurations across the platform.</p>
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="bg-white rounded-none border border-gray-200 overflow-hidden">
              <div className="bg-[#3AB000] p-4 flex items-center gap-2">
                <Percent className="text-white" size={16} />
                <h2 className="text-white font-black uppercase tracking-wider text-xs">
                  Pharmacy Discount Configuration
                </h2>
              </div>
              
              <div className="p-6 bg-white">
                <p className="text-xs text-gray-500 font-bold mb-6 leading-relaxed max-w-2xl">
                  Configure the global discount percentage that is applied automatically for verified JSSA Card Holders across all registered pharmacies.
                </p>
                
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-6 h-6 border-4 border-[#3AB000] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="max-w-md bg-gray-50 p-6 border border-gray-200">
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Percent size={12} className="text-[#3AB000]" />
                      Discount Percentage (%) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(e.target.value)}
                        className="flex-1 px-4 h-10 text-xs font-bold text-gray-900 bg-white border border-gray-200 focus:bg-white focus:border-[#3AB000] outline-none rounded-none transition-all placeholder:text-gray-400"
                        min="0"
                        max="100"
                      />
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#3AB000] hover:bg-[#2d8a00] text-white px-6 h-10 font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-none min-w-[120px] disabled:opacity-50 text-[10px]"
                      >
                        {saving ? "SAVING..." : <><Save size={14} /> SAVE CONFIG</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PharmacyDiscountConfig;
