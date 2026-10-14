import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, ShieldCheck, Smartphone, Send, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/jssa-logo-long.png';

const LoginPage = () => {
  const [loginMode, setLoginMode] = useState('password'); // 'password' or 'otp'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, requestOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) return toast.error('Please fill in all fields');

    setLoading(true);
    try {
      await login({ identifier, password });
      toast.success('Welcome back, SuperAdmin!');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone || phone.length !== 10) return toast.error('Enter a valid 10-digit phone number');

    setLoading(true);
    try {
      await requestOTP(phone);
      setOtpSent(true);
      setCountdown(60);
      toast.success('OTP sent successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) return toast.error('Enter valid OTP');

    setLoading(true);
    try {
      await verifyOTP(phone, otp);
      toast.success('OTP Verified. Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="p-10 text-center bg-slate-900 relative overflow-hidden">
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
             <div className="relative z-10 flex flex-col items-center">
                <div className="bg-white p-3 rounded-2xl mb-6 shadow-xl">
                   <img src={logo} alt="JSSA Logo" className="h-14 w-auto" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">SuperAdmin Access</h1>
                <p className="text-slate-400 text-[13px] mt-2 font-medium">Secure Administrative Gateway</p>
             </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-50 mx-10 mt-8 rounded-2xl border border-slate-100">
             <button 
                onClick={() => { setLoginMode('password'); setOtpSent(false); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${loginMode === 'password' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
                Password Access
             </button>
             <button 
                onClick={() => setLoginMode('otp')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${loginMode === 'otp' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
                OTP Access
             </button>
          </div>

          <div className="p-10 pt-8">
            <AnimatePresence mode="wait">
              {loginMode === 'password' ? (
                <motion.form 
                  key="password"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handlePasswordLogin} 
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-slate-600 ml-1">Account Identifier</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="input-field pl-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white"
                        placeholder="Email or Phone"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-slate-600 ml-1">Security Key</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field pl-12 pr-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors p-1"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full h-14 text-[15px] font-bold shadow-lg shadow-primary-900/20 active:scale-95 mt-4 rounded-2xl"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <span className="flex items-center gap-2">
                        Initialize Session <ShieldCheck size={20} />
                      </span>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  {!otpSent ? (
                    <form onSubmit={handleSendOTP} className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[13px] font-semibold text-slate-600 ml-1">Mobile Number</label>
                          <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              className="input-field pl-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white"
                              placeholder="9876543210"
                              required
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="btn btn-primary w-full h-14 text-[15px] font-bold shadow-lg shadow-primary-900/20 active:scale-95 mt-4 rounded-2xl"
                        >
                          {loading ? (
                            <Loader2 className="animate-spin" size={24} />
                          ) : (
                            <span className="flex items-center gap-2">
                              Send Access OTP <Send size={18} />
                            </span>
                          )}
                        </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                       <div className="space-y-2">
                          <div className="flex justify-between items-center mb-1">
                             <label className="text-[13px] font-semibold text-slate-600 ml-1">Security Code</label>
                             <button 
                                type="button"
                                onClick={() => setOtpSent(false)}
                                className="text-[11px] font-bold text-primary-600 hover:underline"
                             >
                                Change Number
                             </button>
                          </div>
                          <div className="relative">
                            <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                              type="text"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className="input-field pl-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white tracking-[0.5em] font-bold text-lg"
                              placeholder="••••••"
                              required
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium text-center mt-3">
                             {countdown > 0 ? (
                                `Resend OTP in ${countdown}s`
                             ) : (
                                <button type="button" onClick={handleSendOTP} className="text-primary-600 font-bold hover:underline">Resend OTP Now</button>
                             )}
                          </p>
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="btn btn-primary w-full h-14 text-[15px] font-bold shadow-lg shadow-primary-900/20 active:scale-95 mt-4 rounded-2xl"
                        >
                          {loading ? (
                            <Loader2 className="animate-spin" size={24} />
                          ) : (
                            <span className="flex items-center gap-2">
                              Verify & Initialize <ShieldCheck size={20} />
                            </span>
                          )}
                        </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-10 pt-6 border-t border-slate-50 text-center">
               <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                 Protected by RSA-4096 Encryption. <br />
                 All access attempts are logged and monitored.
               </p>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-8 text-slate-400 text-xs font-medium">
          &copy; {new Date().getFullYear()} Jan Swasthya Sahayata Abhiyan
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
