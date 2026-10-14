import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Settings as SettingsIcon, Save, Eye, EyeOff, CreditCard, CheckCircle, XCircle, Loader } from "lucide-react";
import { settingsAPI } from "../../utils/api";
import { useAuth } from "../../auth/AuthProvider";

const Settings = () => {
  const { role, employeeProfile } = useAuth();
  // Admin / superadmin see the landing-site blue theme (staff keeps green)
  const isBlueTheme = role === "admin" || role === "superadmin";
  const permissions = employeeProfile?.jobRoleId?.permissions || [];

  const hasPermission = (perm) => {
    if (role === "admin" || role === "superadmin") return true;
    if (role === "staff") {
      const normalizedPerm = perm.toLowerCase();
      const snake = perm.replace(/([A-Z])/g, "_$1").toLowerCase();
      return permissions.some(p => {
        const lp = p.toLowerCase();
        return lp === normalizedPerm || lp === snake;
      });
    }
    return false;
  };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  
  const [showLiveSecret, setShowLiveSecret] = useState(false);
  const [showTestSecret, setShowTestSecret] = useState(false);
  const [showLiveSecretX, setShowLiveSecretX] = useState(false);
  const [showTestSecretX, setShowTestSecretX] = useState(false);

  const [formData, setFormData] = useState({
    razorpay: {
      keyId: "",
      keySecret: "",
      isTestMode: true,
      testKeyId: "rzp_test_1DP5mmOlF5G5ag",
      testKeySecret: "",
      webhookSecret: "",
      testWebhookSecret: "",
    },
    razorpayX: {
      keyId: "",
      keySecret: "",
      isTestMode: true,
      testKeyId: "",
      testKeySecret: "",
      accountNumber: "",
    },
  });

  useEffect(() => {
    if (!hasPermission("settings")) {
      setError("Access denied. Only admins can view settings.");
      setLoading(false);
      return;
    }
  
    fetchSettings();
  }, [role, employeeProfile]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsAPI.get();
      
      if (response.success && response.data.settings) {
        setFormData({
          razorpay: {
            keyId: response.data.settings.razorpay?.keyId || "",
            keySecret: response.data.settings.razorpay?.keySecret || "",
            isTestMode: response.data.settings.razorpay?.isTestMode ?? true,
            testKeyId: response.data.settings.razorpay?.testKeyId || "rzp_test_1DP5mmOlF5G5ag",
            testKeySecret: response.data.settings.razorpay?.testKeySecret || "",
            webhookSecret: response.data.settings.razorpay?.webhookSecret || "",
            testWebhookSecret: response.data.settings.razorpay?.testWebhookSecret || "",
          },
          razorpayX: {
            keyId: response.data.settings.razorpayX?.keyId || "",
            keySecret: response.data.settings.razorpayX?.keySecret || "",
            isTestMode: response.data.settings.razorpayX?.isTestMode ?? true,
            testKeyId: response.data.settings.razorpayX?.testKeyId || "",
            testKeySecret: response.data.settings.razorpayX?.testKeySecret || "",
            accountNumber: response.data.settings.razorpayX?.accountNumber || "",
          },
        });
      }
    } catch (err) {
      console.error("Fetch settings error:", err);
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith("razorpay.")) {
      const field = name.replace("razorpay.", "");
      setFormData((prev) => ({
        ...prev,
        razorpay: {
          ...prev.razorpay,
          [field]: type === "checkbox" ? checked : value,
        },
      }));
    } else if (name.startsWith("razorpayX.")) {
      const field = name.replace("razorpayX.", "");
      setFormData((prev) => ({
        ...prev,
        razorpayX: {
          ...prev.razorpayX,
          [field]: type === "checkbox" ? checked : value,
        },
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasPermission("settings")) {
      setError("Access denied. Only admins can update settings.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await settingsAPI.update({
        razorpay: {
          keyId: formData.razorpay.keyId,
          keySecret: formData.razorpay.keySecret,
          isTestMode: formData.razorpay.isTestMode,
          testKeyId: formData.razorpay.testKeyId,
          testKeySecret: formData.razorpay.testKeySecret,
          webhookSecret: formData.razorpay.webhookSecret,
          testWebhookSecret: formData.razorpay.testWebhookSecret,
        },
        razorpayX: {
          keyId: formData.razorpayX.keyId,
          keySecret: formData.razorpayX.keySecret,
          isTestMode: formData.razorpayX.isTestMode,
          testKeyId: formData.razorpayX.testKeyId,
          testKeySecret: formData.razorpayX.testKeySecret,
          accountNumber: formData.razorpayX.accountNumber,
        },
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        // Refresh settings to get updated values including credentials
        fetchSettings();
      }
    } catch (err) {
      console.error("Update settings error:", err);
      setError(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const loadTestCredentials = () => {
    setFormData((prev) => ({
      ...prev,
      razorpay: {
        ...prev.razorpay,
        testKeyId: "rzp_test_1DP5mmOlF5G5ag",
        testKeySecret: "YOUR_TEST_SECRET_KEY",
        isTestMode: true,
      },
    }));
  };

  const handleVerifyCredentials = async () => {
    try {
      setVerifying(true);
      setError(null);
      setVerificationResult(null);

      const response = await settingsAPI.verifyRazorpayCredentials();

      if (response.success && response.data) {
        setVerificationResult({
          valid: response.data.valid,
          message: response.data.message,
          mode: response.data.mode,
          keyId: response.data.keyId,
          error: response.data.error,
        });
      }
    } catch (err) {
      console.error("Verify credentials error:", err);
      setVerificationResult({
        valid: false,
        message: err.message || "Failed to verify credentials",
        mode: "unknown",
      });
    } finally {
      setVerifying(false);
    }
  };

  if (!hasPermission("settings")) {
    return (
      <DashboardLayout>
        <div className="p-3 sm:p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <p className="text-red-700 text-sm">Access denied. Only admins can view settings.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-3 sm:p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 text-sm sm:text-base">Loading settings...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePath="/settings">
      <div className={`p-3 sm:p-6 ${isBlueTheme ? "st-blue" : ""}`}>
        {isBlueTheme && <style>{ST_BLUE_CSS}</style>}
        {/* Header */}
        {isBlueTheme ? (
          <div className="st-hero">
            <div className="st-hero-ic">
              <SettingsIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="st-kicker">Admin Panel</p>
              <h1>Settings</h1>
              <p className="st-sub">Manage application settings and payment gateway credentials</p>
            </div>
          </div>
        ) : (
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#3AB000] flex items-center justify-center flex-shrink-0">
              <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm">Manage application settings and payment gateway credentials</p>
        </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
            <p className="text-green-700 text-xs sm:text-sm font-medium">Settings saved successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <p className="text-red-700 text-xs sm:text-sm">{error}</p>
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Razorpay Section */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[#3AB000] flex-shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Razorpay Payment Gateway</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
              Configure your Razorpay credentials for payment processing. Use test mode for development and testing.
            </p>

            {/* Current Active Credentials Display */}
            {formData.razorpay.isTestMode ? (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">Currently Active: Test Mode</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600">Test Key ID:</span>
                    <p className="font-mono text-gray-900 mt-1 break-all">{formData.razorpay.testKeyId || "Not set"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Test Key Secret:</span>
                    <p className="font-mono text-gray-900 mt-1 break-all">
                      {formData.razorpay.testKeySecret ? (showTestSecret ? formData.razorpay.testKeySecret : "••••••••") : "Not set"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">Currently Active: Live Mode</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600">Live Key ID:</span>
                    <p className="font-mono text-gray-900 mt-1 break-all">{formData.razorpay.keyId || "Not set"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Live Key Secret:</span>
                    <p className="font-mono text-gray-900 mt-1 break-all">
                      {formData.razorpay.keySecret ? (showLiveSecret ? formData.razorpay.keySecret : "••••••••") : "Not set"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Test Mode Toggle */}
            <div className="mb-4 sm:mb-6">
              <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="razorpay.isTestMode"
                  checked={formData.razorpay.isTestMode}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#3AB000] border-gray-300 rounded focus:ring-[#3AB000] flex-shrink-0"
                />
                <span className="text-xs sm:text-sm font-medium text-gray-700">Enable Test Mode</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6 sm:ml-7">
                When enabled, test credentials will be used for all transactions
              </p>
            </div>

            {/* Test Credentials Section */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-[#ECFCCB] border border-[#D9F99D] rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900">Test Credentials</h3>
                <button
                  type="button"
                  onClick={loadTestCredentials}
                  className="text-xs px-3 py-1.5 bg-[#4D7C0F] text-white rounded hover:bg-[#3F6212] transition-colors w-full sm:w-auto"
                >
                  Load Test Credentials
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Test Key ID
                  </label>
                  <input
                    type="text"
                    name="razorpay.testKeyId"
                    value={formData.razorpay.testKeyId}
                    onChange={handleChange}
                    placeholder="rzp_test_..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3AB000] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Test Key Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showTestSecret ? "text" : "password"}
                      name="razorpay.testKeySecret"
                      value={formData.razorpay.testKeySecret}
                      onChange={handleChange}
                      placeholder="Enter test secret key"
                      className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3AB000] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTestSecret(!showTestSecret)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showTestSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Test Webhook Secret
                  </label>
                  <input
                    type="password"
                    name="razorpay.testWebhookSecret"
                    value={formData.razorpay.testWebhookSecret}
                    onChange={handleChange}
                    placeholder="Enter test webhook secret"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3AB000] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Live Credentials Section */}
            <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-3">Live Credentials</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Live Key ID
                  </label>
                  <input
                    type="text"
                    name="razorpay.keyId"
                    value={formData.razorpay.keyId}
                    onChange={handleChange}
                    placeholder="rzp_live_..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3AB000] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Live Key Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showLiveSecret ? "text" : "password"}
                      name="razorpay.keySecret"
                      value={formData.razorpay.keySecret}
                      onChange={handleChange}
                      placeholder="Enter live secret key"
                      className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3AB000] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLiveSecret(!showLiveSecret)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showLiveSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Live Webhook Secret
                  </label>
                  <input
                    type="password"
                    name="razorpay.webhookSecret"
                    value={formData.razorpay.webhookSecret}
                    onChange={handleChange}
                    placeholder="Enter live webhook secret"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3AB000] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RazorpayX Credentials Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6 border-b pb-4">
              <div className="w-8 h-8 rounded-lg bg-[#D9F99D] flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-[#4D7C0F]" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900">RazorpayX (Payouts) Configuration</h2>
                <p className="text-xs text-gray-500 mt-0.5">Manage keys and test mode for Payouts</p>
              </div>
            </div>

            {/* Test Mode Toggle */}
            <div className="mb-4 sm:mb-6">
              <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="razorpayX.isTestMode"
                  checked={formData.razorpayX.isTestMode}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#4D7C0F] border-gray-300 rounded focus:ring-[#4D7C0F] flex-shrink-0"
                />
                <span className="text-xs sm:text-sm font-medium text-gray-700">Enable Test Mode for Payouts</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6 sm:ml-7">
                When enabled, test credentials will be used for all outgoing payouts
              </p>
            </div>

            {/* Account Number */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-3">RazorpayX Account Info</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  RazorpayX Account Number
                </label>
                <input
                  type="text"
                  name="razorpayX.accountNumber"
                  value={formData.razorpayX.accountNumber}
                  onChange={handleChange}
                  placeholder="e.g. 7878780080316316"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#4D7C0F] focus:border-transparent"
                />
              </div>
            </div>

            {/* Test Credentials Section */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-[#ECFCCB] border border-[#D9F99D] rounded-lg">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-3">Test Credentials (RazorpayX)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Test Key ID
                  </label>
                  <input
                    type="text"
                    name="razorpayX.testKeyId"
                    value={formData.razorpayX.testKeyId}
                    onChange={handleChange}
                    placeholder="rzp_test_..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#4D7C0F] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Test Key Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showTestSecretX ? "text" : "password"}
                      name="razorpayX.testKeySecret"
                      value={formData.razorpayX.testKeySecret}
                      onChange={handleChange}
                      placeholder="Enter test secret key"
                      className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#4D7C0F] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTestSecretX(!showTestSecretX)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showTestSecretX ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Credentials Section */}
            <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-3">Live Credentials (RazorpayX)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Live Key ID
                  </label>
                  <input
                    type="text"
                    name="razorpayX.keyId"
                    value={formData.razorpayX.keyId}
                    onChange={handleChange}
                    placeholder="rzp_live_..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#4D7C0F] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Live Key Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showLiveSecretX ? "text" : "password"}
                      name="razorpayX.keySecret"
                      value={formData.razorpayX.keySecret}
                      onChange={handleChange}
                      placeholder="Enter live secret key"
                      className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#4D7C0F] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLiveSecretX(!showLiveSecretX)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showLiveSecretX ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Result */}
          {verificationResult && (
            <div className={`mx-4 sm:mx-6 mb-4 p-3 sm:p-4 rounded-lg border ${
              verificationResult.valid
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-start gap-2 sm:gap-3">
                {verificationResult.valid ? (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-sm font-semibold ${
                    verificationResult.valid ? "text-green-800" : "text-red-800"
                  }`}>
                    {verificationResult.message}
                  </p>
                  {verificationResult.mode && verificationResult.mode !== "unknown" && (
                    <p className="text-xs text-gray-600 mt-1">
                      Mode: {verificationResult.mode === "test" ? "Test" : "Live"}
                    </p>
                  )}
                  {verificationResult.keyId && (
                    <p className="text-xs text-gray-600 mt-1 break-all">
                      Key ID: {verificationResult.keyId}
                    </p>
                  )}
                  {verificationResult.error && (
                    <p className="text-xs text-red-600 mt-1">
                      Error: {verificationResult.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <button
              type="button"
              onClick={handleVerifyCredentials}
              disabled={verifying || saving}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-[#4D7C0F] hover:bg-[#3F6212] text-white text-xs sm:text-sm font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {verifying ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Verify Credentials
                </>
              )}
            </button>
            <button
              type="submit"
              disabled={saving || verifying}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs sm:text-sm font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Settings;

// Landing-site theme for admin/superadmin — CSS only, scoped to .st-blue
const ST_BLUE_CSS = `
.st-blue{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f9fafb;border-radius:10px;}
.st-hero{display:flex;align-items:center;gap:16px;padding:22px 26px;margin-bottom:18px;border-radius:10px;color:#fff;position:relative;overflow:hidden;
  background:linear-gradient(100deg,#3F6212 0%,#4D7C0F 55%,#65A30D 100%);box-shadow:0 6px 16px rgba(77,124,15,.22);text-shadow:0 1px 2px rgba(26,46,5,.35);}
.st-hero::after{content:"";position:absolute;right:-70px;top:-90px;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,.1);pointer-events:none;}
.st-hero-ic{width:48px;height:48px;border-radius:10px;background:#fff;color:#4D7C0F;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(63,98,18,.18);position:relative;z-index:1;}
.st-hero>div:last-child{position:relative;z-index:1;min-width:0;}
.st-kicker{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;margin:0 0 4px;}
.st-hero h1{font-size:24px;line-height:1.2;font-weight:800;margin:0 0 4px;}
.st-sub{font-size:14px;font-weight:500;margin:0;}
.st-blue .bg-\\[\\#3AB000\\]{background:#4D7C0F!important;}
.st-blue .hover\\:bg-\\[\\#2d8a00\\]:hover{background:#3F6212!important;}
.st-blue .text-\\[\\#3AB000\\]{color:#4D7C0F!important;}
.st-blue .focus\\:ring-\\[\\#3AB000\\]:focus{--tw-ring-color:#4D7C0F!important;}
.st-blue .bg-green-50{background:#ECFCCB!important;}
.st-blue .border-green-200{border-color:#D9F99D!important;}
.st-blue .text-green-700,.st-blue .text-green-800{color:#4D7C0F!important;}
.st-blue .text-green-600{color:#4D7C0F!important;}
.st-blue .text-gray-900{color:#1A2E05;}
.st-blue .bg-white{border-radius:8px;}
@media(max-width:640px){.st-hero{padding:18px;}.st-hero h1{font-size:20px;}}
`;
