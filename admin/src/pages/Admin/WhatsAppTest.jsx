import React, { useState } from "react";
import { Send, Phone, User, Hash, Calendar, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { createPaperAPI } from "../../utils/api";
import { useAdminBodyTheme } from "../../components/AdminBlueTheme";

const WhatsAppTest = () => {
  // Standalone page (no DashboardLayout) — apply the admin theme directly
  useAdminBodyTheme();
  const [formData, setFormData] = useState({
    mobile: "91", // Default prefix for India
    name: "",
    appId: "",
    templateName: "mou_process_notification",
    startDate: new Date().toLocaleDateString("en-IN"),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN"),
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Ensure mobile has no + prefix if user added it
    const cleanMobile = formData.mobile.replace("+", "");

    try {
      const response = await createPaperAPI.testWhatsApp({
        ...formData,
        mobile: cleanMobile
      });
      setResult(response);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 style={{ color: "#1A2E05" }} className="text-2xl font-black text-gray-800 flex items-center gap-3">
            <span className="p-2 bg-[#ECFCCB] text-[#4D7C0F] rounded-lg">
              <Send className="w-6 h-6" />
            </span>
            WhatsApp API Tester (Msg2z v3)
          </h1>
          <p className="text-gray-500 mt-2">Test your approved templates on the new msg2z.in platform.</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform transition-all">
          <div className="bg-[#4D7C0F] p-4 text-white flex justify-between items-center">
            <select 
              className="bg-[#3F6212] text-white border-none font-bold text-sm uppercase tracking-widest rounded px-2 py-1 outline-none"
              value={formData.templateName}
              onChange={(e) => setFormData({...formData, templateName: e.target.value})}
            >
              <option value="mou_process_notification">MOU Notification</option>
              <option value="exam_notification">Exam Notification</option>
            </select>
            <div className="px-3 py-1 bg-[#3F6212]/60 rounded-full text-[10px] font-black uppercase">v3 API Active</div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mobile Number */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase flex items-center gap-2">
                  <Phone className="w-3 h-3 text-[#4D7C0F]" /> Mobile Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="9198XXXXXXXX"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-[#D9F99D] focus:border-[#4D7C0F] transition-all font-bold text-gray-700"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>

              {/* Candidate Name */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase flex items-center gap-2">
                  <User className="w-3 h-3 text-[#4D7C0F]" /> Candidate Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-[#D9F99D] focus:border-[#4D7C0F] transition-all font-bold text-gray-700"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Application ID */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase flex items-center gap-2">
                  <Hash className="w-3 h-3 text-[#4D7C0F]" /> Application ID / {"{{1}},{{2}}"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="JSSA-2026-001"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-[#D9F99D] focus:border-[#4D7C0F] transition-all font-bold text-gray-700 font-mono"
                  value={formData.appId}
                  onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                />
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-[#4D7C0F]" /> Start Date / {"{{3}},{{4}}"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="DD/MM/YYYY"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-[#D9F99D] focus:border-[#4D7C0F] transition-all font-bold text-gray-700"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-[#4D7C0F]" /> End Date / {"{{5}},{{6}}"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="DD/MM/YYYY"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-[#D9F99D] focus:border-[#4D7C0F] transition-all font-bold text-gray-700"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4D7C0F] hover:bg-[#3F6212] text-white py-4 px-6 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-[#D9F99D] transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-3 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> SENDING...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" /> SEND TEST MESSAGE
                </>
              )}
            </button>
          </form>

          {/* Result Area */}
          {result && (
            <div className={`p-6 border-t animate-in fade-in slide-in-from-top-2 duration-300 ${result.success ? "bg-green-50" : "bg-red-50"}`}>
              <div className="flex items-start gap-4">
                {result.success ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                )}
                <div>
                  <h3 className={`font-black text-sm uppercase ${result.success ? "text-green-800" : "text-red-800"}`}>
                    {result.success ? "Success! Message Dispatched" : "Error Sending Message"}
                  </h3>
                  <p className={`text-xs mt-1 font-medium ${result.success ? "text-green-600" : "text-red-600"}`}>
                    {result.success ? "The API returned a success status. Check your WhatsApp shortly." : result.error || "Please check your console or server logs."}
                  </p>
                  {result.data && (
                    <pre className="mt-4 p-3 bg-white/50 border border-current/10 rounded-lg text-[10px] overflow-auto max-h-32 text-gray-600">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-sky-50 border border-sky-100 p-6 rounded-2xl flex gap-4">
          <AlertCircle className="w-6 h-6 text-sky-500 mt-1 flex-shrink-0" />
          <div className="text-xs text-sky-800 leading-relaxed font-medium">
            <p className="font-bold uppercase mb-2">Notice for Admin:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>This page will send a live WhatsApp message using the actual API credits.</li>
              <li>Make sure the mobile number contains the country code (e.g., 91 for India).</li>
              <li>Ensure all placeholders (App ID, Name, Dates) are filled as they appear in the final MOU.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppTest;
