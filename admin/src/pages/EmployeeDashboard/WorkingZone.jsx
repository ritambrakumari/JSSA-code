import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { employeesAPI } from "../../utils/api";
import {
  ShieldCheck,
  Shield,
  MapPin,
  Lock,
  Loader2,
  AlertCircle,
  Users,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  Globe,
  CornerDownRight
} from "lucide-react";
import { toast } from "react-hot-toast";

const GREEN = "#3AB000";

// =========================================================
// PREMIUM flat 0-radius AWAITING ADMINISTRATIVE ALLOCATION STATE
// =========================================================
const AwaitingAllocationScreen = () => {
  return (
    <div className="p-4 md:p-6 pt-2 md:pt-4 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-6 border-b-4 border-[#3AB000] shadow-sm rounded-none">
        <div className="p-3.5 bg-[#3AB000]/10 rounded-none">
          <MapPin size={24} className="text-[#3AB000]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">My Working Area / मेरा काम करने का क्षेत्र (जोन)</h1>
          <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.2em] mt-1">Details of your assigned duty location / आपके काम की जगह (ड्यूटी लोकेशन) की जानकारी</p>
        </div>
      </div>

      {/* Awaiting Allocation Glassmorphic Container */}
      <div className="bg-white border border-gray-200 p-8 md:p-16 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden rounded-none group">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#3AB000]/10 to-transparent pointer-events-none" />

        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[#3AB000]/10 rounded-none blur-xl scale-125 animate-pulse" />
          <div className="relative w-24 h-24 bg-gray-50 flex items-center justify-center border-2 border-[#3AB000] rounded-none shadow-inner">
            <MapPin size={46} className="text-[#3AB000]" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border border-gray-200 rounded-none flex items-center justify-center shadow-md animate-bounce">
            <ShieldCheck size={16} className="text-[#3AB000]" />
          </div>
        </div>

        <div className="max-w-md space-y-4">
          <div className="inline-flex bg-yellow-50 text-yellow-700 border border-yellow-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-none">
            ⏳ Waiting for Assignment / अभी एरिया तय होना बाकी है
          </div>

          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-snug">
            Your Area Setup is in Progress / आपके काम का क्षेत्र (एरिया) तय किया जा रहा है
          </h2>

          <p className="text-xs font-bold text-gray-600 leading-relaxed uppercase">
            Please wait. Head Office is setting up your State, District, Block and Panchayats. Once this is set, your area details will be shown here. / कृपया थोड़ा इंतज़ार करें। मुख्य कार्यालय (हेड ऑफिस) आपके लिए राज्य, जिला, ब्लॉक और पंचायत तय कर रहा है। जैसे ही यह पूरा होगा, आपको अपनी ड्यूटी का पूरा एरिया यहाँ दिखाई देने लगेगा।
          </p>
        </div>

        {/* Security / Help Note */}
        <div className="mt-12 flex flex-col items-center gap-2 bg-gray-50 border border-gray-200/80 px-6 py-3 rounded-none opacity-90">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#3AB000]" />
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
              JSSA SECURITY INFO / जे.एस.एस.ए सुरक्षा जानकारी
            </span>
          </div>
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-wide">
            Having questions? Call your District Officer or Head Office for support. / कोई सवाल या समस्या है? मदद के लिए अपने जिला अधिकारी (District Admin) या मुख्य कार्यालय से संपर्क करें।
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN WORKING ZONE SCREEN
// ==========================================
const WorkingZone = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await employeesAPI.getProfile();
      if (res.success) {
        setProfile(res.data);
      } else {
        toast.error("Failed to load territory parameters");
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
      toast.error("Network error while syncing zone details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[75vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#3AB000]" />
          <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Checking your area details... / आपके क्षेत्र की जानकारी लोड हो रही है...</p>
        </div>
      </DashboardLayout>
    );
  }

  // If territory is not assigned/locked yet, render empty state
  if (!profile || !profile.isZoneLocked) {
    return (
      <DashboardLayout>
        <AwaitingAllocationScreen />
      </DashboardLayout>
    );
  }

  const role = (profile.role || "Employee").toUpperCase().trim();
  const designationName = profile.designation || "Not Assigned";

  // Calculate assigned labels
  const hasAllBlocks = !!profile.isAllBlocksAssigned;
  const hasAllPanchayats = !!profile.isAllPanchayatsAssigned;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 pt-2 md:pt-4 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700">

        {/* Step Indicator / Lock Notice */}
        <div className="bg-white px-6 py-4 shadow-sm border border-gray-150 rounded-none flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-green-50 flex items-center justify-center border border-green-200 text-[#3AB000] shrink-0">
              <Lock size={14} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-550 uppercase tracking-widest leading-none">Duty Area Status / ड्यूटी एरिया की स्थिति</p>
              <p className="text-xs font-black text-gray-800 uppercase tracking-tight mt-1">LOCKED & CONFIRMED / एरिया लॉक और पक्का हो चुका है</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#3AB000]/5 px-4 py-2 border border-[#3AB000]/20 rounded-none">
            <ShieldCheck className="text-[#3AB000]" size={16} />
            <div className="text-right">
              <p className="text-[9px] font-black text-gray-555 uppercase leading-none">Your Post / आपका पद (पदनाम)</p>
              <p className="text-[11px] font-black text-[#3AB000] uppercase mt-0.5">{designationName} ({role})</p>
            </div>
          </div>
        </div>

        {/* Dynamic Premium Header Banner */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl border-b-4 border-[#3AB000] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-[#3AB000]/10 to-transparent pointer-events-none" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-none flex items-center justify-center border border-white/20 text-[#3AB000] shadow-inner">
              <Globe size={28} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-tight leading-none">
                My Duty Location / मेरी ड्यूटी का क्षेत्र
              </h1>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2.5">
                YOUR OFFICIAL REGISTERED WORKING LOCATION / आपका आधिकारिक तौर पर दर्ज कार्य क्षेत्र
              </p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-2.5 rounded-none text-center md:text-right shrink-0 relative z-10 w-full md:w-auto">
            <p className="text-[9px] font-black text-[#3AB000] uppercase tracking-widest leading-none">MY STATE / मेरा राज्य</p>
            <p className="text-base font-black text-white uppercase mt-1 leading-none">{profile.workingState || "Bihar"}</p>
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Panel: Territory Scope Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-gray-200 rounded-none shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-150 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} className="text-[#3AB000]" />
                  My Working Area / मेरा कार्य क्षेत्र
                </h3>
                <span className="text-[9px] font-black bg-green-50 text-[#3AB000] border border-green-200 px-2 py-0.5 rounded-none uppercase">
                  VERIFIED & ACTIVE / सत्यापित और सक्रिय
                </span>
              </div>

              <div className="p-6 space-y-6">

                {/* State & District Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-none space-y-1">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider block">STATE / राज्य</span>
                    <span className="text-sm font-black text-gray-900 uppercase flex items-center gap-1.5">
                      <Globe size={14} className="text-[#3AB000]" /> {profile.workingState || "Bihar"}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-none space-y-1">
                    <span className="text-[9px] font-black text-gray-555 uppercase tracking-wider block">DISTRICT / जिला</span>
                    <span className="text-sm font-black text-gray-900 uppercase flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#3AB000]" /> {profile.workingDistrict || "Not Configured"}
                    </span>
                  </div>
                </div>

                {/* Scope Coverage badging */}
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <h4 className="text-[10px] font-black text-gray-955 uppercase tracking-[0.25em] flex items-center gap-1.5">
                    <Building size={12} className="text-[#3AB000]" />
                    My Blocks / Panchayats List / मेरे ब्लॉक और पंचायतों की सूची
                  </h4>

                  {/* Render DM Jurisdiction */}
                  {role === "DM" && (
                    <div className="space-y-3">
                      {hasAllBlocks ? (
                        <div className="p-4 bg-green-50 border border-[#3AB000]/30 rounded-none flex items-center gap-3">
                          <CheckCircle2 size={20} className="text-[#3AB000] shrink-0" />
                          <div>
                            <span className="text-xs font-black text-green-900 uppercase block">🌍 ALL BLOCKS ASSIGNED / पूरे जिले के सभी ब्लॉक आवंटित हैं</span>
                            <span className="text-[9px] font-bold text-green-700 uppercase tracking-wide">
                              You have full authority to work in all blocks of this district. / आप इस जिले के सभी ब्लॉकों में काम करने के लिए अधिकृत हैं।
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[10px] text-gray-550 font-black uppercase tracking-wider">
                            MY ASSIGNED BLOCKS / मेरे आवंटित ब्लॉक ({profile.workingBlocks?.length || 0}):
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {profile.workingBlocks?.map(b => (
                              <div key={b._id || b} className="px-4 py-2.5 bg-white border border-gray-150 rounded-none flex items-center gap-2 shadow-sm">
                                <div className="w-1.5 h-1.5 rounded-none bg-[#3AB000] shrink-0" />
                                <span className="text-xs font-black text-gray-850 uppercase tracking-tight truncate">
                                  {b.name || "Block Name"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Render BS Jurisdiction */}
                  {role === "BS" && (
                    <div className="space-y-4">
                      {/* Assigned Base Block */}
                      <div className="p-4 bg-gray-50 border border-gray-150 rounded-none space-y-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider block">MY MAIN BLOCK / मेरा मुख्य ब्लॉक</span>
                        <span className="text-xs font-black text-gray-855 uppercase">
                          {profile.workingBlock?.name || "Not Assigned / अभी तय नहीं हुआ"}
                        </span>
                      </div>

                      {hasAllPanchayats ? (
                        <div className="p-4 bg-green-50 border border-[#3AB000]/30 rounded-none flex items-center gap-3">
                          <CheckCircle2 size={20} className="text-[#3AB000] shrink-0" />
                          <div>
                            <span className="text-xs font-black text-green-900 uppercase block">🌍 ALL PANCHAYATS ASSIGNED / पूरे ब्लॉक की सभी पंचायतें आवंटित हैं</span>
                            <span className="text-[9px] font-bold text-green-700 uppercase tracking-wide">
                              You have full authority to work in all panchayats of this block. / आप इस ब्लॉक की सभी पंचायतों में काम करने के लिए अधिकृत हैं।
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[10px] text-gray-550 font-black uppercase tracking-wider">
                            MY ASSIGNED PANCHAYATS / मेरी आवंटित पंचायतें ({profile.workingPanchayats?.length || 0}):
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {profile.workingPanchayats?.map(p => (
                              <div key={p._id || p} className="px-4 py-2.5 bg-white border border-gray-150 rounded-none flex items-center gap-2 shadow-sm">
                                <div className="w-1.5 h-1.5 rounded-none bg-[#3AB000] shrink-0" />
                                <span className="text-xs font-black text-gray-855 uppercase tracking-tight truncate">
                                  {p.name || "Panchayat Name"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Render PE Jurisdiction */}
                  {role === "PE" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 border border-gray-150 rounded-none space-y-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider block">MY BLOCK / मेरा ब्लॉक</span>
                        <span className="text-xs font-black text-gray-855 uppercase">
                          {profile.workingBlock?.name || "Not Assigned / तय नहीं हुआ"}
                        </span>
                      </div>

                      <div className="p-4 bg-green-50/50 border border-[#3AB000]/25 rounded-none space-y-1 flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-none bg-[#3AB000] mt-1.5 shrink-0" />
                        <div>
                          <span className="text-[9px] font-black text-green-800 uppercase tracking-wider block">MY GRAM PANCHAYAT / मेरी ग्राम पंचायत</span>
                          <span className="text-sm font-black text-[#0A3D00] uppercase">
                            {profile.workingPanchayat?.name || "Not Assigned / तय नहीं हुआ"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render PM, RM, ZC Jurisdiction */}
                  {["PM", "RM", "ZC"].includes(role) && (
                    <div className="space-y-3">
                      <div className="p-4 bg-green-50 border border-[#3AB000]/30 rounded-none flex items-start gap-3">
                        <CheckCircle2 size={20} className="text-[#3AB000] shrink-0" />
                        <div>
                          <span className="text-xs font-black text-green-900 uppercase block">ALL BLOCKS & PANCHAYATS ASSIGNED / सभी ब्लॉक और पंचायतें आवंटित हैं</span>
                          <span className="text-[9px] font-bold text-green-700 uppercase tracking-wide">
                            You have full authority to work in all blocks and panchayats of your assigned area. / आप अपने आवंटित क्षेत्र के सभी ब्लॉकों और पंचायतों में काम करने के लिए पूर्ण रूप से अधिकृत हैं।
                          </span>
                        </div>
                      </div>

                      {/* Render block list for ZC and RM if populated by backend */}
                      {/* {profile.workingBlocks && profile.workingBlocks.length > 0 && (
                        <div className="space-y-2 mt-4">
                          <p className="text-[10px] text-gray-550 font-black uppercase tracking-wider">
                            LIST OF BLOCKS IN YOUR ZONE / आपके ज़ोन में आने वाले ब्लॉक ({profile.workingBlocks.length}):
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2">
                            {profile.workingBlocks.map(b => (
                              <div key={b._id || b} className="px-4 py-2.5 bg-white border border-gray-150 rounded-none flex items-center gap-2 shadow-sm">
                                <div className="w-1.5 h-1.5 rounded-none bg-[#3AB000] shrink-0" />
                                <span className="text-xs font-black text-gray-850 uppercase tracking-tight truncate" title={`${b.name || "Block Name"} (${b.district || "District"})`}>
                                  {b.name || "Block Name"} <span className="text-gray-400 font-normal">({b.district})</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )} */}
                    </div>
                  )}

                  {/* Fallback roles / general view */}
                  {!["DM", "BS", "PE", "PM", "RM", "ZC"].includes(role) && (
                    <div className="p-4 bg-gray-50 border border-gray-150 rounded-none">
                      <p className="text-xs font-bold text-gray-550 leading-normal uppercase">
                        Your duty area details are managed by JSSA Administration Office. / आपके कार्य क्षेत्र (ड्यूटी एरिया) की जानकारी JSSA प्रबंधन कार्यालय द्वारा तय की जाती है।
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Superior Hierarchy & Officers Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-gray-200 rounded-none shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-150 px-6 py-4">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <Users size={14} className="text-[#3AB055]" />
                  MY REPORTING OFFICERS (SENIORS) / मेरे वरिष्ठ अधिकारी (सीनियर्स)
                </h3>
              </div>

              <div className="p-6">
                {(!profile.allSeniors || profile.allSeniors.length === 0) && !profile.reportingTo ? (
                  <div className="py-8 px-4 text-center bg-gray-50 border border-gray-150 rounded-none flex flex-col items-center justify-center gap-3">
                    <Shield size={24} className="text-gray-300" />
                    <div>
                      <p className="text-xs font-black text-gray-855 uppercase tracking-tight">DIRECT HEAD OFFICE REPORTING / सीधे मुख्य कार्यालय (हेड ऑफिस)</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mt-1.5 leading-relaxed">
                        Currently, no supervisor/manager is assigned to your area. You report directly to JSSA Head Office. / वर्तमान में आपके क्षेत्र में कोई मैनेजर या अधिकारी नियुक्त नहीं है। आप अपने काम की रिपोर्ट सीधे JSSA मुख्य कार्यालय (हेड ऑफिस) को भेजेंगे।
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {profile.allSeniors && profile.allSeniors.length > 0 ? (
                      profile.allSeniors.map((senior, idx) => (
                        <div key={idx} className="p-5 border border-gray-150 rounded-none shadow-sm space-y-4 bg-gradient-to-b from-gray-50 to-white relative">
                          <div className="absolute top-4 right-4 text-gray-250">
                            <CornerDownRight size={24} />
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white border border-gray-250 rounded-none flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                              <Users size={22} />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-black text-gray-900 uppercase tracking-tight leading-none truncate max-w-[200px]">
                                {senior.name}
                              </p>
                              <span className="mt-1.5 inline-block text-[8px] font-black bg-gray-100 text-gray-550 border border-gray-200 px-2 py-0.5 rounded-none uppercase tracking-wider leading-none">
                                {senior.designation || (senior.role === "DM" ? "DISTRICT MANAGER" : senior.role === "BS" ? "BLOCK SUPERVISOR" : senior.role === "ZC" ? "ZONAL COORDINATOR" : "MY SENIOR OFFICER")} / {senior.role === "DM" ? "जिला प्रबंधक" : senior.role === "BS" ? "ब्लॉक सुपरवाइजर" : senior.role === "ZC" ? "जोनल समन्वयक" : "मेरे वरिष्ठ अधिकारी"}
                              </span>
                            </div>
                          </div>

                          {/* Contacts detail links */}
                          <div className="pt-3 border-t border-gray-100 space-y-2.5">
                            {senior.phone && (
                              <div className="flex items-center justify-between text-xs font-bold text-gray-600 uppercase tracking-tight">
                                <span className="text-[9px] font-black text-gray-500">Phone Number / मोबाइल नंबर</span>
                                <span className="text-gray-855">{senior.phone}</span>
                              </div>
                            )}
                            {senior.email && (
                              <div className="flex items-center justify-between text-xs font-bold text-gray-600 uppercase tracking-tight">
                                <span className="text-[9px] font-black text-gray-500">Email Address / ईमेल आईडी</span>
                                <span className="text-gray-855 lowercase text-right truncate max-w-[170px]">{senior.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      /* Fallback single reportingTo senior */
                      <div className="p-5 border border-gray-150 rounded-none shadow-sm space-y-4 bg-gradient-to-b from-gray-50 to-white relative">
                        <div className="absolute top-4 right-4 text-gray-250">
                          <CornerDownRight size={24} />
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white border border-gray-250 rounded-none flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                            <Users size={22} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-black text-gray-900 uppercase tracking-tight leading-none truncate max-w-[200px]">
                              {profile.reportingTo.employeeId?.name || profile.reportingTo.name}
                            </p>
                            <span className="mt-1.5 inline-block text-[8px] font-black bg-gray-100 text-gray-550 border border-gray-200 px-2 py-0.5 rounded-none uppercase tracking-wider leading-none">
                              {profile.reportingTo.employeeId?.designation || "MY SENIOR OFFICER / मेरे वरिष्ठ अधिकारी"}
                            </span>
                          </div>
                        </div>

                        {/* Contacts detail links */}
                        <div className="pt-3 border-t border-gray-100 space-y-2.5">
                          {profile.reportingTo.phone && (
                            <div className="flex items-center justify-between text-xs font-bold text-gray-600 uppercase tracking-tight">
                              <span className="text-[9px] font-black text-gray-500">Phone Number / मोबाइल नंबर</span>
                              <span className="text-gray-855">{profile.reportingTo.phone}</span>
                            </div>
                          )}
                          {profile.reportingTo.email && (
                            <div className="flex items-center justify-between text-xs font-bold text-gray-600 uppercase tracking-tight">
                              <span className="text-[9px] font-black text-gray-500">Email Address / ईमेल आईडी</span>
                              <span className="text-gray-855 lowercase text-right truncate max-w-[170px]">{profile.reportingTo.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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

export default WorkingZone;
