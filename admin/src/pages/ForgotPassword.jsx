import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, Lock, Phone, Eye, EyeOff } from "lucide-react";
import { authAPI } from "../utils/api";
import logo from "../assets/img0.png";
import loginbg from "../assets/login-bg.png";

// Landing-site palette (same as the Login page)
const GREEN = "#4D7C0F";
const DARK_GREEN = "#3F6212";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendOTP = async () => {
    const input = email.trim();
    if (!input) {
      setError("Please enter your email or mobile number");
      return;
    }

    const isPhone = /^\d{10}$/.test(input);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

    if (!isPhone && !isEmail) {
      setError("Please enter a valid email address or 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let response;
      if (isPhone) {
        response = await authAPI.forgotPasswordPhone(input);
      } else {
        response = await authAPI.forgotPassword(input);
      }

      if (response.success) {
        if (isPhone) {
          setSuccess("OTP has been sent to your mobile number. Please check your messages.");
        } else {
          setSuccess("OTP has been sent to your email. Please check your inbox.");
        }
        setStep(2);
      } else {
        // Check for database connection error
        if (response.error && response.error.includes("Database connection")) {
          setError("Database connection unavailable. Please contact support or try again later.");
        } else {
          setError(response.error || "Wrong OTP");
        }
      }
    } catch (err) {
      // Check for network or database errors
      if (err.message && (err.message.includes("503") || err.message.includes("Database"))) {
        setError("Database connection unavailable. Please contact support or try again later.");
      } else {
        setError(err.message || "Wrong OTP");
      }
      console.error("Send OTP error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    const input = email.trim();
    const isPhone = /^\d{10}$/.test(input);

    if (isPhone) {
      setSuccess("OTP format valid. Please set new password.");
      setStep(3);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await authAPI.verifyOTP(input, otp.trim());

      if (response.success) {
        setSuccess("OTP verified successfully!");
        setStep(3);
      } else {
        setError(response.error || "Wrong OTP");
      }
    } catch (err) {
      setError(err.message || "Wrong OTP");
      console.error("Verify OTP error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      setError("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const input = email.trim();
    const isPhone = /^\d{10}$/.test(input);

    try {
      let response;
      if (isPhone) {
        response = await authAPI.resetPasswordPhone(
          input,
          otp.trim(),
          newPassword.trim()
        );
      } else {
        response = await authAPI.resetPassword(
          input,
          otp.trim(),
          newPassword.trim()
        );
      }

      if (response.success) {
        setSuccess("Password reset successfully!");
        setStep(4);
      } else {
        setError(response.error || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
      console.error("Reset password error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        backgroundColor: "#f3f6fb",
        backgroundImage: `linear-gradient(rgba(243,246,251,0.55), rgba(243,246,251,0.55)), url(${loginbg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden" style={{ borderTop: `4px solid ${GREEN}` }}>
        {/* Header */}
        <div className="p-6 sm:p-8 bg-white">
          <div className="mb-6">
            <img
              src={logo}
              alt="Jan Swasthya Sahayata Abhiyan"
              className="w-full max-w-lg object-contain mb-4"
            />
            <h2 className="text-2xl font-bold mb-2" style={{ color: DARK_GREEN }}>
              {step === 1 && "Forgot Password?"}
              {step === 2 && "Enter OTP"}
              {step === 3 && "Reset Password"}
              {step === 4 && "Password Reset Successful!"}
            </h2>
            <p className="text-sm text-gray-600">
              {step === 1 && "Enter your mobile number to receive an OTP"}
              {step === 2 && `Enter the 6-digit OTP sent to your ${/^\d{10}$/.test(email.trim()) ? "mobile number" : "email"}`}
              {step === 3 && "Enter your new password"}
              {step === 4 && "Your password has been reset successfully"}
            </p>
          </div>

          {/* Step 1: Email Input */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:outline-none text-sm"
                    onFocus={(e) => (e.target.style.borderColor = GREEN)}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleSendOTP();
                    }}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-[#ECFCCB] border-2 border-[#D9F99D] text-[#4D7C0F] px-4 py-3 rounded-xl text-sm font-medium">
                  {success}
                </div>
              )}

              <button
                onClick={handleSendOTP}
                disabled={loading || !email.trim()}
                className="w-full text-white py-3 sm:py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${GREEN} 0%, ${DARK_GREEN} 100%)`,
                }}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </div>
          )}

          {/* Step 2: OTP Input */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:outline-none text-sm text-center text-2xl font-bold tracking-widest"
                  style={{
                    letterSpacing: "0.5em",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = GREEN)}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && otp.length === 6) handleVerifyOTP();
                  }}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  OTP sent to: <span className="font-semibold">{email}</span>
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-[#ECFCCB] border-2 border-[#D9F99D] text-[#4D7C0F] px-4 py-3 rounded-xl text-sm font-medium">
                  {success}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setError("");
                    setSuccess("");
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="flex-1 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${GREEN} 0%, ${DARK_GREEN} 100%)`,
                  }}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Resend OTP
              </button>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-gray-500 w-5 h-5" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full pl-10 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:outline-none text-sm"
                    onFocus={(e) => (e.target.style.borderColor = GREEN)}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-gray-500 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:outline-none text-sm"
                    onFocus={(e) => (e.target.style.borderColor = GREEN)}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleResetPassword();
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-[#ECFCCB] border-2 border-[#D9F99D] text-[#4D7C0F] px-4 py-3 rounded-xl text-sm font-medium">
                  {success}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep(2);
                    setNewPassword("");
                    setConfirmPassword("");
                    setError("");
                    setSuccess("");
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
                  className="flex-1 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${GREEN} 0%, ${DARK_GREEN} 100%)`,
                  }}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "#ECFCCB" }}
                >
                  <CheckCircle className="w-10 h-10" style={{ color: GREEN }} />
                </div>
              </div>
              <h3 className="text-xl font-bold" style={{ color: DARK_GREEN }}>
                Password Reset Successful!
              </h3>
              <p className="text-sm text-gray-600">
                Your password has been reset successfully. You can now login with your new password.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] text-sm"
                style={{
                  background: `linear-gradient(135deg, ${GREEN} 0%, ${DARK_GREEN} 100%)`,
                }}
              >
                Go to Login
              </button>
            </div>
          )}

          {/* Back to Login Link */}
          {step !== 4 && (
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                style={{ color: GREEN }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
