import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User, Shield, ArrowRight, Stethoscope } from "lucide-react";
import logo from "../assets/img0.png";
import { useAuth } from "../auth/AuthProvider";
import { roleHomePath } from "../auth/auth";
import { authAPI } from "../utils/api";

const GREEN = "#3AB000";
const DARK_GREEN = "#2d8a00";

export default function PharmacyLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, role, login } = useAuth();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    role: "pharmacy",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  useEffect(() => {
    if (isAuthenticated && role === "pharmacy") {
      navigate(roleHomePath(role), { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.identifier.trim() || !formData.password) {
      setError("Please enter your mobile number and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authAPI.login(
        formData.identifier.trim(),
        formData.password,
        "pharmacy"
      );

      if (response.success && response.data) {
        const { user, token } = response.data;
        login({
          identifier: user.email || user.phone,
          role: user.role,
          token: token,
        });
        navigate(roleHomePath(user.role), { replace: true });
      } else {
        setError(response.error || "Login failed. Access Denied.");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#3AB000] pt-12 pb-8 px-8 text-center relative">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <img src={logo} alt="JSSA Logo" className="h-24 md:h-28 object-contain" />
            </div>
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight">Pharmacy Portal</h1>
          <p className="text-white/90 text-sm mt-1 font-semibold uppercase tracking-widest">Authorized Access Only</p>
        </div>

        <div className="p-8">

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="relative group">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#3AB000] transition-colors" />
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:outline-none text-sm font-medium focus:border-[#3AB000] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#3AB000] transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:outline-none text-sm font-medium focus:border-[#3AB000] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-600 px-4 py-3 rounded text-xs font-bold animate-in fade-in duration-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl font-bold transition-all duration-300 shadow-md hover:bg-[#3AB000] hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : (
                <>
                  Secure Login <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 leading-relaxed uppercase tracking-tighter">
              By accessing this system, you agree to follow the JSSA information security policies. All login attempts are logged with IP addresses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
