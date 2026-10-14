import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { 
  Target, 
  Users, 
  ShieldCheck, 
  Wallet, 
  Loader2, 
  Save, 
  Zap, 
  IndianRupee, 
  Activity,
  Briefcase,
  Settings2
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

const GREEN = "#3AB000";

const GoalConfiguration = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [activeRole, setActiveRole] = useState("PE");
  const [activeSubTab, setActiveSubTab] = useState("ops");
  const [systemConfig, setSystemConfig] = useState({ referralBonusAmount: 0 });

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;
      
      // Fetch role configs
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/goal-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch system config
      try {
        const sysRes = await axios.get(`${import.meta.env.VITE_API_URL}/system-config/current`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (sysRes.data && sysRes.data.success) {
          setSystemConfig(sysRes.data.data);
        }
      } catch (err) {
        console.error("Fetch System Config Error:", err);
      }

      const roles = ["PE", "BS", "DM", "ZC", "RM"];
      let completeConfigs = [];

      if (res.data && res.data.success) {
        const existingConfigs = res.data.data || [];
        completeConfigs = roles.map(role => {
          const existing = existingConfigs.find(c => c.role === role);
          return existing || {
            role,
            rechargeAllowed: true,
            minRechargeAmount: 100,
            cardTargetEnabled: false,
            monthlyCardTarget: 0,
            teamCardTargetEnabled: false,
            leadTargetEnabled: false,
            monthlyLeadTarget: 0,
            attendanceEnabled: true,
            checkInTime: "09:00",
            checkOutTime: "18:00",
            layeredTargets: [],
            individualCommission: 0,
            layeredCommissions: [],
            leadEarningEnabled: false,
            individualLeadEarning: 0
          };
        });
      } else {
        completeConfigs = roles.map(role => ({
          role,
          rechargeAllowed: true,
          minRechargeAmount: 100,
          cardTargetEnabled: false,
          monthlyCardTarget: 0,
          teamCardTargetEnabled: false,
          leadTargetEnabled: false,
          monthlyLeadTarget: 0,
          attendanceEnabled: true,
          checkInTime: "09:00",
          checkOutTime: "18:00",
          layeredTargets: [],
          individualCommission: 0,
          layeredCommissions: [],
          leadEarningEnabled: false,
          individualLeadEarning: 0
        }));
      }
      setConfigs(completeConfigs);
    } catch (error) {
      console.error("Fetch Configs Error:", error);
      toast.error("Failed to load configurations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleToggle = (index, field) => {
    const newConfigs = [...configs];
    newConfigs[index][field] = !newConfigs[index][field];
    setConfigs(newConfigs);
  };

  const handleInputChange = (index, field, value) => {
    const newConfigs = [...configs];
    newConfigs[index][field] = value === "" ? 0 : parseInt(value);
    setConfigs(newConfigs);
  };

  const handleValueChange = (index, field, value) => {
    const newConfigs = [...configs];
    newConfigs[index][field] = value;
    setConfigs(newConfigs);
  };

  const handleLayeredTargetChange = (idx, roleName, targetValue) => {
    const newConfigs = [...configs];
    const config = newConfigs[idx];
    if (!config.layeredTargets) config.layeredTargets = [];
    
    const layerIdx = config.layeredTargets.findIndex(lt => lt.roleName === roleName);
    const val = targetValue === "" ? 0 : parseInt(targetValue);

    if (layerIdx > -1) {
      config.layeredTargets[layerIdx].target = val;
    } else {
      config.layeredTargets.push({ roleName, target: val });
    }
    setConfigs(newConfigs);
  };

  const getLayeredTargetValue = (config, roleName) => {
    if (!config.layeredTargets) return 0;
    const layer = config.layeredTargets.find(lt => lt.roleName === roleName);
    return layer ? layer.target : 0;
  };

  const handleLayeredCommissionChange = (idx, roleName, commValue) => {
    const newConfigs = [...configs];
    const config = newConfigs[idx];
    if (!config.layeredCommissions) config.layeredCommissions = [];
    
    const layerIdx = config.layeredCommissions.findIndex(lc => lc.roleName === roleName);
    const val = commValue === "" ? 0 : parseInt(commValue);

    if (layerIdx > -1) {
      config.layeredCommissions[layerIdx].commission = val;
    } else {
      config.layeredCommissions.push({ roleName, commission: val });
    }
    setConfigs(newConfigs);
  };

  const getLayeredCommissionValue = (config, roleName) => {
    if (!config.layeredCommissions) return 0;
    const layer = config.layeredCommissions.find(lc => lc.roleName === roleName);
    return layer ? layer.commission : 0;
  };

  const saveConfig = async () => {
    const index = configs.findIndex(c => c.role === activeRole);
    if (index === -1) return;

    try {
      setSaving(activeRole);
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;
      const config = configs[index];
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/goal-config/${config.role}`,
        config,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(`${config.role} Protocols Updated`, {
          style: { background: GREEN, color: '#fff', fontWeight: 'bold', borderRadius: '0' }
        });
      }
    } catch (error) {
      console.error("Save Error:", error);
      toast.error("Update Failed");
    } finally {
      setSaving(null);
    }
  };

  const saveGlobalConfig = async () => {
    try {
      setSaving("GLOBAL");
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/system-config/update`,
        { referralBonusAmount: systemConfig.referralBonusAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(`Global Protocols Updated`, {
          style: { background: GREEN, color: '#fff', fontWeight: 'bold', borderRadius: '0' }
        });
      }
    } catch (error) {
      console.error("Save Global Error:", error);
      toast.error("Global Update Failed");
    } finally {
      setSaving(null);
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case "PE": return "Panchayat Executive";
      case "BS": return "Block Supervisor";
      case "DM": return "District Manager";
      case "ZC": return "Zonal Coordinator";
      case "RM": return "Regional Manager";
      default: return role;
    }
  };

  const getSubordinates = (role) => {
    switch (role) {
      case "BS": return ["Panchayat Executive"];
      case "DM": return ["Block Supervisor", "Panchayat Executive"];
      case "ZC": return ["District Manager", "Block Supervisor", "Panchayat Executive"];
      case "RM": return ["Zonal Coordinator", "District Manager", "Block Supervisor", "Panchayat Executive"];
      default: return [];
    }
  };

  const currentIdx = configs.findIndex(c => c.role === activeRole);
  const currentConfig = configs[currentIdx];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="px-4 md:px-8 py-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#3AB000]/10 flex items-center justify-center rounded text-[#3AB000]">
                <Settings2 size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Goal Configuration</h1>
                <p className="text-[9px] font-black text-[#3AB000] uppercase tracking-[0.2em] mt-0.5">Architectural Performance Control</p>
              </div>
            </div>
            <button 
              onClick={activeRole === "GLOBAL" ? saveGlobalConfig : saveConfig}
              disabled={saving === activeRole || (activeRole === "GLOBAL" && saving === "GLOBAL")}
              className="bg-black hover:bg-[#3AB000] text-white px-8 py-3 font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-3 rounded-sm disabled:opacity-50"
            >
              {saving === activeRole || (activeRole === "GLOBAL" && saving === "GLOBAL") ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving === activeRole || (activeRole === "GLOBAL" && saving === "GLOBAL") ? "Saving..." : `Save ${activeRole === "GLOBAL" ? "Global" : activeRole} Configuration`}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="relative w-12 h-12">
               <div className="absolute inset-0 border-4 border-gray-100 rounded-full" />
               <div className="absolute inset-0 border-4 border-[#3AB000] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Syncing Hierarchy Engine...</p>
          </div>
        ) : (
          <div className="px-4 md:px-8 py-6 space-y-6">
            {/* Main Role Tabs - No Shadow */}
            <div className="flex border border-gray-200 rounded overflow-hidden w-full">
              {["GLOBAL", "PE", "BS", "DM", "ZC", "RM"].map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`flex-1 py-4 text-center transition-all duration-200 border-r border-gray-200 last:border-r-0 ${activeRole === role ? "bg-[#3AB000] text-black font-bold" : "bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}
                >
                  <span className="text-[11px] uppercase tracking-wider font-black">{role === "GLOBAL" ? "Global System" : getRoleName(role)}</span>
                </button>
              ))}
            </div>

            {/* Active Workspace - No Shadow */}
            {activeRole === "GLOBAL" ? (
              <div className="bg-white flex flex-col border border-gray-200 rounded-sm animate-in slide-in-from-bottom-2 duration-300 min-h-[600px] w-full overflow-hidden p-6 md:p-10">
                <div className="max-w-2xl">
                  <div className="space-y-5">
                    <div className="p-6 bg-gray-50 border border-gray-200 rounded-sm space-y-4 transition-all hover:border-[#3AB000]/30 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-[#3AB000]/10 rounded-sm text-[#3AB000]">
                            <Users size={15} />
                          </div>
                          <p className="text-xs font-black text-gray-800 capitalize tracking-wide">
                            Refer & Earn Protocol
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#3AB000]">₹</span>
                          <input 
                            type="number" 
                            value={systemConfig.referralBonusAmount || 0} 
                            onChange={(e) => setSystemConfig({ ...systemConfig, referralBonusAmount: e.target.value === "" ? 0 : parseInt(e.target.value) })}
                            placeholder="0"
                            className="w-full h-14 pl-10 pr-6 bg-white border border-gray-300 rounded-none font-black text-3xl text-[#3AB000] focus:border-[#3AB000] outline-none shadow-sm transition-all" 
                          />
                        </div>
                        <div className="flex items-start gap-2 px-1">
                          <ShieldCheck size={12} className="text-[#3AB000] mt-0.5 shrink-0" />
                          <p className="text-[10px] font-bold text-gray-500 capitalize leading-relaxed">
                            Global Referral Bonus. Any employee who refers a candidate will receive this amount when the candidate successfully signs the MOU and gets hired, regardless of the post.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : currentConfig && (
              <div className="bg-white flex flex-col lg:flex-row border border-gray-200 rounded-sm animate-in slide-in-from-bottom-2 duration-300 min-h-[600px] w-full overflow-hidden">
                {/* Left Navigation Sub-Tabs */}
                <div className="w-full lg:w-52 bg-gray-50 border-r border-gray-200 p-3 space-y-1.5">
                  <button
                    onClick={() => setActiveSubTab("ops")}
                    className={`w-full flex items-center gap-3 p-4 transition-all rounded-sm font-black text-[10px] uppercase tracking-wider ${activeSubTab === "ops" ? "bg-[#3AB000] text-black" : "text-gray-400 hover:bg-white hover:text-gray-600"}`}
                  >
                    <Zap size={15} />
                    Operational
                  </button>
                  
                  <button
                    onClick={() => setActiveSubTab("targets")}
                    className={`w-full flex items-center gap-3 p-4 transition-all rounded-sm font-black text-[10px] uppercase tracking-wider ${activeSubTab === "targets" ? "bg-[#3AB000] text-black" : "text-gray-400 hover:bg-white hover:text-gray-600"}`}
                  >
                    <Target size={15} />
                    Performance
                  </button>
                  
                  <button
                    onClick={() => setActiveSubTab("finance")}
                    className={`w-full flex items-center gap-3 p-4 transition-all rounded-sm font-black text-[10px] uppercase tracking-wider ${activeSubTab === "finance" ? "bg-[#3AB000] text-black" : "text-gray-400 hover:bg-white hover:text-gray-600"}`}
                  >
                    <IndianRupee size={15} />
                    Financial
                  </button>
                </div>

                {/* Main Content Workspace */}
                <div className="flex-1 p-6 md:p-10">
                  <div className="w-full">
                    {/* Operational Settings */}
                    {activeSubTab === "ops" && (
                      <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div className="p-5 bg-[#3AB000]/5 border border-[#3AB000]/20 rounded flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Wallet className="text-[#3AB000]" size={18} />
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Recharge Permission</span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={currentConfig.rechargeAllowed} onChange={() => handleToggle(currentIdx, "rechargeAllowed")} />
                                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3AB000]"></div>
                              </label>
                            </div>
                            {currentConfig.rechargeAllowed && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Min. Recharge Amount (₹)</p>
                                <input type="number" value={currentConfig.minRechargeAmount} onChange={(e) => handleInputChange(currentIdx, "minRechargeAmount", e.target.value)} className="w-full h-11 px-4 bg-white border border-gray-300 rounded text-sm font-bold focus:ring-1 focus:ring-[#3AB000] outline-none" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-6">
                            <div className="p-5 bg-[#3AB000]/5 border border-[#3AB000]/20 rounded flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Activity className="text-[#3AB000]" size={18} />
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Attendance System</span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={currentConfig.attendanceEnabled} onChange={() => handleToggle(currentIdx, "attendanceEnabled")} />
                                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3AB000]"></div>
                              </label>
                            </div>
                            {currentConfig.attendanceEnabled && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Login (IN)</span>
                                  <input type="time" value={currentConfig.checkInTime} onChange={(e) => handleValueChange(currentIdx, "checkInTime", e.target.value)} className="w-full h-11 px-3 border border-gray-300 rounded font-bold text-xs" />
                                </div>
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logout (OUT)</span>
                                  <input type="time" value={currentConfig.checkOutTime} onChange={(e) => handleValueChange(currentIdx, "checkOutTime", e.target.value)} className="w-full h-11 px-3 border border-gray-300 rounded font-bold text-xs" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Performance Settings */}
                    {activeSubTab === "targets" && (
                      <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                          <div className="space-y-5">
                            <div className="p-4 bg-[#3AB000]/5 border border-[#3AB000]/20 rounded flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Individual Card Goal</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={currentConfig.cardTargetEnabled} onChange={() => handleToggle(currentIdx, "cardTargetEnabled")} />
                                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3AB000]"></div>
                              </label>
                            </div>
                            {currentConfig.cardTargetEnabled && (
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monthly Issuance Goal</p>
                                <input type="number" value={currentConfig.monthlyCardTarget} onChange={(e) => handleInputChange(currentIdx, "monthlyCardTarget", e.target.value)} className="w-full h-12 px-4 border border-gray-300 rounded font-black text-lg text-[#3AB000]" />
                              </div>
                            )}
                          </div>

                          {getSubordinates(activeRole).length > 0 && (
                            <div className="space-y-5">
                              <div className="p-4 bg-black text-white rounded flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Users className="text-[#3AB000]" size={18} />
                                  <span className="text-xs font-bold uppercase tracking-wider">Team Hierarchy</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={currentConfig.teamCardTargetEnabled} onChange={() => handleToggle(currentIdx, "teamCardTargetEnabled")} />
                                  <div className="w-10 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3AB000]"></div>
                                </label>
                              </div>
                              {currentConfig.teamCardTargetEnabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {getSubordinates(activeRole).map((subRole) => (
                                    <div key={subRole} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded transition-all hover:bg-[#3AB000]/5 hover:border-[#3AB000]/30">
                                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{subRole}</span>
                                      <input 
                                        type="number" 
                                        value={getLayeredTargetValue(currentConfig, subRole)}
                                        onChange={(e) => handleLayeredTargetChange(currentIdx, subRole, e.target.value)}
                                        className="w-24 h-9 px-2 border border-gray-300 rounded text-right font-bold text-sm focus:border-[#3AB000] outline-none bg-white"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Financial Settings */}
                    {activeSubTab === "finance" && (
                      <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                          <div className="space-y-5">
                            <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
                              <p className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                                <Briefcase size={16} className="text-[#3AB000]" />
                                Individual Card Earning
                              </p>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#3AB000]">₹</span>
                                <input 
                                  type="number" 
                                  value={currentConfig.individualCommission} 
                                  onChange={(e) => {
                                    const newConfigs = [...configs];
                                    newConfigs[currentIdx].individualCommission = e.target.value === "" ? 0 : parseInt(e.target.value);
                                    setConfigs(newConfigs);
                                  }} 
                                  className="w-full h-14 pl-10 pr-6 border border-gray-300 rounded font-black text-3xl text-[#3AB000] focus:border-[#3AB000] outline-none bg-white shadow-inner" 
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-5">
                            <div className="p-6 bg-gray-50 border border-gray-200 rounded-sm space-y-4 transition-all hover:border-[#3AB000]/30 group">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-[#3AB000]/10 rounded-sm text-[#3AB000]">
                                    <Zap size={15} />
                                  </div>
                                  <p className="text-xs font-black text-gray-800 capitalize tracking-wide">
                                    Lead Earning Protocol
                                  </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer scale-90">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={currentConfig.leadEarningEnabled || false} 
                                    onChange={() => handleToggle(currentIdx, "leadEarningEnabled")} 
                                  />
                                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3AB000]"></div>
                                </label>
                              </div>
                              
                              {currentConfig.leadEarningEnabled ? (
                                <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                  <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#3AB000]">₹</span>
                                    <input 
                                      type="number" 
                                      value={currentConfig.individualLeadEarning || 0} 
                                      onChange={(e) => {
                                        const newConfigs = [...configs];
                                        newConfigs[currentIdx].individualLeadEarning = e.target.value === "" ? 0 : parseInt(e.target.value);
                                        setConfigs(newConfigs);
                                      }} 
                                      placeholder="0"
                                      className="w-full h-14 pl-10 pr-6 bg-white border border-gray-300 rounded-none font-black text-3xl text-[#3AB000] focus:border-[#3AB000] outline-none shadow-sm transition-all" 
                                    />
                                  </div>
                                  <div className="flex items-start gap-2 px-1">
                                    <ShieldCheck size={12} className="text-[#3AB000] mt-0.5 shrink-0" />
                                    <p className="text-[10px] font-bold text-gray-500 capitalize leading-relaxed">
                                      Employee earns this amount only when a lead is marked as "Qualified" by Admin.
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[10px] font-bold text-gray-400 capitalize px-1">
                                  Lead earning is currently disabled for this role.
                                </p>
                              )}
                            </div>
                          </div>

                          {getSubordinates(activeRole).length > 0 && currentConfig.teamCardTargetEnabled && (
                            <div className="space-y-5">
                              <div className="p-4 bg-black text-white rounded flex items-center gap-3">
                                <IndianRupee size={16} className="text-[#3AB000]" />
                                <span className="text-xs font-bold uppercase tracking-wider">Hierarchy Earnings</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {getSubordinates(activeRole).map((subRole) => (
                                  <div key={subRole} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded hover:bg-[#3AB000]/5 transition-all">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">From {subRole}</span>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#3AB000]">₹</span>
                                      <input 
                                        type="number" 
                                        value={getLayeredCommissionValue(currentConfig, subRole)}
                                        onChange={(e) => handleLayeredCommissionChange(currentIdx, subRole, e.target.value)}
                                        className="w-24 h-9 pl-6 pr-2 border border-gray-300 rounded text-right font-bold text-sm focus:border-[#3AB000] outline-none bg-white"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GoalConfiguration;
