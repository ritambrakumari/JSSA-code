import React, { useState } from 'react';
import { Lock, Phone, MessageSquare, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { authAPI } from '../../utils/api';

// Landing-site theme (navy / blue + Segoe UI)
const GREEN = "#1761b0";
const NAVY = "#123b68";
const FONT = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

export default function CreatePasswordModal({ isOpen }) {
  const { session, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    otp: ''
  });

  // Reset state when modal opens or session changes to prevent showing old success messages
  React.useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setOtpSent(false);
      setFormData({ password: '', confirmPassword: '', otp: '' });
      setError('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, session?.id]);

  const phone = session?.phone || (/^\d{10}$/.test(session?.identifier) ? session.identifier : null);
  const email = session?.email || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(session?.identifier) ? session.identifier : null);

  // Only render if the modal should be open and it's not an admin
  if (!isOpen || !session || session.role === 'admin' || session.role === 'superadmin') {
    return null;
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSendOTP = async () => {
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.setPasswordOtp();
      if (response.success) {
        setOtpSent(true);
      } else {
        setError(response.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePassword = async () => {
    if (!formData.otp || formData.otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.setPassword(formData.otp, formData.password);
      if (response.success) {
        setIsSuccess(true);
      } else {
        setError(response.error || 'Failed to set password');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while setting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" style={{ fontFamily: FONT, borderTop: `4px solid ${GREEN}` }}>
        
        {/* Conditional Rendering based on isSuccess */}
        {isSuccess ? (
          <div className="p-8 text-center animate-in zoom-in duration-300">
            <div className="mx-auto w-20 h-20 bg-[#eaf3fc] flex items-center justify-center rounded-full mb-6">
              <CheckCircle size={40} className="text-[#1761b0]" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: NAVY }}>Password Created!</h2>
            <p className="text-sm text-gray-600 mb-8">
              Your new password has been set successfully. Please keep it safe for future logins.
            </p>

            <div className="bg-[#f5f9ff] rounded-xl p-5 mb-8 text-left space-y-4 border border-[#e1ecf8]" style={{ borderLeft: `4px solid ${GREEN}` }}>
              <div>
                <span className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Mobile Number</span>
                <span className="text-gray-800 font-bold">{phone || 'N/A'}</span>
              </div>
              {email && (
                <div>
                  <span className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Email</span>
                  <span className="text-gray-800 font-bold">{email}</span>
                </div>
              )}
              <div>
                <span className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Your Password</span>
                <span className="text-gray-800 font-bold tracking-widest">{formData.password}</span>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="w-full py-4 rounded-xl font-bold text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: GREEN }}
                    onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = NAVY; }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = GREEN)}
            >
              Okay, Login Now
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 text-center text-white" style={{ background: "linear-gradient(100deg,#3a80d2 0%,#5596df 55%,#76ade9 100%)", textShadow: "0 1px 2px rgba(10,40,80,.35)" }}>
              <div className="mx-auto bg-white/20 w-16 h-16 flex items-center justify-center rounded-full mb-4">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Create Your Password</h2>
              <p className="text-white text-sm font-medium">
                For enhanced security, please create a permanent password for your account.
              </p>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-5">
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Mobile Number</label>
                  <div className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 font-medium cursor-not-allowed flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    {phone || 'N/A'}
                  </div>
                </div>
                
                {email && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Email Address</label>
                    <div className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 font-medium cursor-not-allowed flex items-center gap-2">
                      <MessageSquare size={16} className="text-gray-400" />
                      {email}
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-gray-100" />

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold animate-in slide-in-from-top-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Password Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={otpSent || loading}
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:outline-none text-sm font-bold focus:border-[#1761b0] disabled:bg-gray-50 disabled:text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      disabled={otpSent || loading}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      disabled={otpSent || loading}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:outline-none text-sm font-bold focus:border-[#1761b0] disabled:bg-gray-50 disabled:text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      disabled={otpSent || loading}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* OTP Section */}
              <div className="pt-2">
                {!otpSent ? (
                  <button
                    onClick={handleSendOTP}
                    disabled={loading || !formData.password || formData.password !== formData.confirmPassword}
                    className="w-full py-3.5 rounded-xl font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: GREEN }}
                    onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = NAVY; }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = GREEN)}
                  >
                    {loading ? 'Sending...' : 'Send OTP to Verify'}
                  </button>
                ) : (
                  <div className="space-y-4 animate-in slide-in-from-bottom-2">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-gray-800">Enter OTP</label>
                        <button
                          onClick={() => setOtpSent(false)}
                          className="text-xs font-bold text-[#1761b0] hover:underline"
                        >
                          Resend / Edit Password
                        </button>
                      </div>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="otp"
                          maxLength={6}
                          value={formData.otp}
                          onChange={(e) => handleInputChange({ target: { name: 'otp', value: e.target.value.replace(/\D/g, "") } })}
                          placeholder="000000"
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-[#1761b0] rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:outline-none text-sm text-center tracking-[0.5em] font-bold focus:ring-4 focus:ring-[#1761b0]/20"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleCreatePassword}
                      disabled={loading || !formData.otp}
                      className="w-full py-3.5 rounded-xl font-bold text-white transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
                      style={{ background: GREEN }}
                    onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = NAVY; }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = GREEN)}
                    >
                      {loading ? 'Processing...' : 'Create Password'}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="pt-4 mt-4 border-t border-gray-100 text-center">
                <button
                  onClick={() => logout()}
                  className="text-sm font-bold text-red-500 hover:text-red-600 hover:underline transition-colors"
                >
                  Logout Now
                </button>
                <p className="text-xs text-gray-400 mt-2">
                  You must create a password to continue using the application.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
