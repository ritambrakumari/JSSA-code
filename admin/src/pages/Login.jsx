import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, User, Lock, Phone, MessageSquare, CheckCircle2, ArrowRight, Briefcase, Shield, ChevronDown, CreditCard } from "lucide-react";
import logo from "../assets/img0.png";
import loginbg from "../assets/login-bg.png";
import { useAuth } from "../auth/AuthProvider";
import { roleHomePath } from "../auth/auth";
import { authAPI } from "../utils/api";

const GREEN = "#65A30D";
const DARK_GREEN = "#4D7C0F";

function Logo({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle
        cx="60"
        cy="60"
        r="58"
        fill="white"
        stroke={GREEN}
        strokeWidth="4"
      />
      <defs>
        <path id="topArcL" d="M 16,60 a44,44 0 0,1 88,0" />
        <path id="botArcL" d="M 16,60 a44,44 0 0,0 88,0" />
      </defs>
      <text fontSize="7" fill="#444" fontWeight="bold" letterSpacing="1.2">
        <textPath href="#topArcL" startOffset="5%">
          जन स्वास्थ्य सहायता अभियान
        </textPath>
      </text>
      <text fontSize="6" fill="#444" fontWeight="600" letterSpacing="0.8">
        <textPath href="#botArcL" startOffset="4%">
          A Project Of Healthcare R&amp;D Board
        </textPath>
      </text>
      <circle cx="38" cy="52" r="7" fill="#22c55e" />
      <ellipse cx="38" cy="72" rx="9" ry="13" fill="#22c55e" />
      <line
        x1="29"
        y1="65"
        x2="20"
        y2="58"
        stroke="#22c55e"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="47"
        y1="65"
        x2="56"
        y2="58"
        stroke="#22c55e"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="60" cy="49" r="7.5" fill="#f97316" />
      <ellipse cx="60" cy="70" rx="9" ry="14" fill="#f97316" />
      <line
        x1="51"
        y1="62"
        x2="42"
        y2="55"
        stroke="#f97316"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="69"
        y1="62"
        x2="78"
        y2="55"
        stroke="#f97316"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="82" cy="52" r="7" fill="#65A30D" />
      <ellipse cx="82" cy="72" rx="9" ry="13" fill="#65A30D" />
      <line
        x1="73"
        y1="65"
        x2="64"
        y2="58"
        stroke="#65A30D"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="91"
        y1="65"
        x2="100"
        y2="58"
        stroke="#65A30D"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IllustrationSVG() {
  return (
    <svg
      viewBox="0 0 480 380"
      style={{ width: "100%", maxWidth: 420, height: "auto" }}
    >
      <circle cx="240" cy="190" r="180" fill="#fff" opacity="0.06" />
      <circle cx="240" cy="190" r="130" fill="#fff" opacity="0.08" />
      <rect
        x="70"
        y="295"
        width="340"
        height="18"
        rx="9"
        fill="#fff"
        opacity="0.25"
      />
      <ellipse cx="240" cy="313" rx="170" ry="14" fill="#fff" opacity="0.15" />
      <rect
        x="100"
        y="250"
        width="80"
        height="45"
        rx="6"
        fill="#fff"
        opacity="0.2"
      />
      <rect
        x="108"
        y="285"
        width="10"
        height="25"
        rx="4"
        fill="#fff"
        opacity="0.3"
      />
      <rect
        x="162"
        y="285"
        width="10"
        height="25"
        rx="4"
        fill="#fff"
        opacity="0.3"
      />
      <ellipse cx="140" cy="235" rx="22" ry="28" fill="#4ade80" />
      <circle cx="140" cy="200" r="22" fill="#fde68a" />
      <path
        d="M120 196 Q128 180 140 180 Q152 180 160 196 L160 200 Q152 190 140 190 Q128 190 120 200Z"
        fill="#166534"
      />
      <ellipse
        cx="120"
        cy="240"
        rx="8"
        ry="22"
        fill="#fde68a"
        transform="rotate(-20 120 240)"
      />
      <ellipse
        cx="162"
        cy="240"
        rx="8"
        ry="22"
        fill="#fde68a"
        transform="rotate(20 162 240)"
      />
      <rect
        x="150"
        y="248"
        width="22"
        height="30"
        rx="3"
        fill="#ef4444"
        opacity="0.9"
      />
      <line
        x1="155"
        y1="248"
        x2="155"
        y2="278"
        stroke="#fff"
        strokeWidth="1.5"
      />
      <rect
        x="90"
        y="268"
        width="70"
        height="28"
        rx="3"
        fill="#fff"
        opacity="0.9"
      />
      <rect x="95" y="272" width="60" height="20" rx="2" fill="#bbf7d0" />
      <rect
        x="85"
        y="294"
        width="80"
        height="5"
        rx="2"
        fill="#fff"
        opacity="0.6"
      />
      <rect x="305" y="255" width="13" height="50" rx="6" fill="#16a34a" />
      <rect x="323" y="255" width="13" height="50" rx="6" fill="#16a34a" />
      <ellipse cx="323" cy="225" rx="26" ry="34" fill="#22c55e" />
      <circle cx="323" cy="183" r="23" fill="#fcd34d" />
      <ellipse cx="323" cy="172" rx="25" ry="17" fill="#14532d" />
      <ellipse
        cx="297"
        cy="228"
        rx="10"
        ry="26"
        fill="#fcd34d"
        transform="rotate(-22 297 228)"
      />
      <ellipse
        cx="349"
        cy="228"
        rx="10"
        ry="26"
        fill="#fcd34d"
        transform="rotate(22 349 228)"
      />
      <rect
        x="290"
        y="238"
        width="66"
        height="46"
        rx="4"
        fill="#fff"
        opacity="0.95"
      />
      <rect x="293" y="244" width="60" height="36" rx="2" fill="#dcfce7" />
      <rect x="305" y="236" width="26" height="6" rx="3" fill="#aaa" />
      <line
        x1="299"
        y1="254"
        x2="345"
        y2="254"
        stroke={GREEN}
        strokeWidth="2"
        opacity="0.6"
      />
      <line
        x1="299"
        y1="262"
        x2="345"
        y2="262"
        stroke={GREEN}
        strokeWidth="2"
        opacity="0.6"
      />
      <line
        x1="299"
        y1="270"
        x2="330"
        y2="270"
        stroke={GREEN}
        strokeWidth="2"
        opacity="0.6"
      />
      <g transform="translate(50,90)">
        <rect
          x="8"
          y="0"
          width="10"
          height="28"
          rx="3"
          fill="#fff"
          opacity="0.85"
        />
        <rect
          x="0"
          y="8"
          width="28"
          height="10"
          rx="3"
          fill="#fff"
          opacity="0.85"
        />
      </g>
      <g transform="translate(390,80)">
        <path
          d="M20 8 Q20 0 12 0 Q4 0 4 8 Q4 16 12 22 Q20 16 20 8Z"
          fill="#fca5a5"
          opacity="0.85"
        />
      </g>
      <g transform="translate(40,200)">
        <circle cx="10" cy="10" r="10" fill="#fff" opacity="0.85" />
        <path
          d="M6 6 Q6 14 14 14 Q22 14 22 22"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2.5"
        />
        <circle
          cx="22"
          cy="24"
          r="4"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2.5"
        />
      </g>
      <g transform="translate(400,200)">
        <rect
          x="0"
          y="6"
          width="38"
          height="16"
          rx="8"
          fill="#a7f3d0"
          opacity="0.85"
        />
        <rect
          x="0"
          y="6"
          width="19"
          height="16"
          rx="8"
          fill="#6ee7b7"
          opacity="0.85"
        />
        <line x1="19" y1="6" x2="19" y2="22" stroke="#fff" strokeWidth="1.5" />
      </g>
      <g transform="translate(218,42)">
        <rect
          x="0"
          y="0"
          width="48"
          height="32"
          rx="5"
          fill="#fff"
          opacity="0.85"
        />
        <circle cx="12" cy="12" r="6" fill="#bbf7d0" />
        <line
          x1="22"
          y1="10"
          x2="40"
          y2="10"
          stroke="#22c55e"
          strokeWidth="2"
          opacity="0.7"
        />
        <line
          x1="22"
          y1="16"
          x2="40"
          y2="16"
          stroke="#22c55e"
          strokeWidth="2"
          opacity="0.7"
        />
        <line
          x1="8"
          y1="24"
          x2="40"
          y2="24"
          stroke="#22c55e"
          strokeWidth="1.5"
          opacity="0.5"
        />
      </g>
      <circle cx="100" cy="95" r="5" fill="#fde68a" opacity="0.7" />
      <circle cx="380" cy="140" r="4" fill="#bbf7d0" opacity="0.8" />
      <circle cx="420" cy="170" r="5" fill="#fde68a" opacity="0.6" />
      <circle cx="60" cy="270" r="5" fill="#a7f3d0" opacity="0.7" />
      <circle cx="430" cy="280" r="4" fill="#fde68a" opacity="0.6" />
      <circle cx="200" cy="345" r="4" fill="#bbf7d0" opacity="0.7" />
      <circle cx="300" cy="350" r="5" fill="#fde68a" opacity="0.6" />
      <path
        d="M450 230 L453 240 L463 240 L455 246 L458 256 L450 250 L442 256 L445 246 L437 240 L447 240Z"
        fill="#fde68a"
        opacity="0.7"
      />
      <path
        d="M55 145 L57 152 L64 152 L58 157 L61 164 L55 159 L49 164 L52 157 L46 152 L53 152Z"
        fill="#bbf7d0"
        opacity="0.8"
      />
    </svg>
  );
}

export default function JSSAbhiyanLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, role, login } = useAuth();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    role: "applicant",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [promotedUserName, setPromotedUserName] = useState("");

  // Nimbus OTP States
  const [loginMethod, setLoginMethod] = useState("otp"); // Default to "otp"
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Only redirect if user is already authenticated AND they're not on the login page intentionally
  // This ensures login page always shows first on app start
  // BUT: If logout() was just called, wait for auth state to update before redirecting
  useEffect(() => {
    if (isAuthenticated && role) {
      // Small delay to ensure login page renders first
      const timer = setTimeout(() => {
        navigate(roleHomePath(role), { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, role, navigate]);

  // Clear auth context when component mounts to prevent cached redirect
  useEffect(() => {
    // This ensures when user lands on login page after logout,
    // the previous auth state is not used
    return () => { };
  }, [])

  const handleLogin = async () => {
    const identifierToUse = loginMethod === "otp" ? phoneValue : formData.identifier;
    if (!identifierToUse.trim() || !formData.password) {
      setError("Please enter email/phone and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authAPI.login(
        identifierToUse.trim(),
        formData.password,
        formData.role,
      );

      if (response.success && response.data) {
        const { user, token } = response.data;

        // Check if user was promoted to employee after MOU payment
        if (formData.role === "applicant" && user.role === "employee") {
          setPromotedUserName(user.candidateName || user.name || "Applicant");
          setShowEmployeeModal(true);
          setFormData(prev => ({ ...prev, identifier: "", password: "" }));
          return;
        }

        login({
          identifier: user.email || user.phone,
          email: user.email,
          phone: user.phone,
          role: user.role,
          token: token,
          isPasswordSet: user.isPasswordSet,
        });
        navigate(roleHomePath(user.role), { replace: true });
      } else if (response.error) {
        setError(response.error);
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    if (!phoneValue || phoneValue.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authAPI.nimbusLoginRequest(phoneValue, formData.role);
      if (response.success) {
        setOtpSent(true);
      } else {
        setError(response.error || response.message || "Failed to send OTP");
      }
    } catch (err) {
      setError(err.message || "An error occurred while requesting OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpValue || otpValue.length < 4) {
      setError("Please enter the OTP sent to your mobile");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authAPI.nimbusLoginVerify(phoneValue, otpValue, formData.role);
      if (response.success && response.data) {
        const { user, token } = response.data;

        // Check if user was promoted to employee after MOU payment
        if (formData.role === "applicant" && user.role === "employee") {
          setPromotedUserName(user.candidateName || user.name || "Applicant");
          setShowEmployeeModal(true);
          setPhoneValue("");
          setOtpValue("");
          setOtpSent(false);
          return;
        }

        login({
          identifier: user.phone || user.email,
          email: user.email,
          phone: user.phone,
          role: user.role,
          token: token,
          isPasswordSet: user.isPasswordSet,
        });
        navigate(roleHomePath(user.role), { replace: true });
      } else {
        setError(response.error || response.message || "Verification failed");
      }
    } catch (err) {
      setError(err.message || "An error occurred during verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="jl-theme min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(rgba(243,246,251,0.55), rgba(243,246,251,0.55)), url(${loginbg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <style>{`
        .jl-theme{background:#f3f6fb;font-family:'Segoe UI',sans-serif;}
        .jl-theme .rounded-xl{border-radius:6px;}
        .jl-theme .text-green-600,.jl-theme .text-green-700,.jl-theme .text-green-700\\/80,.jl-theme .text-green-600\\/70,.jl-theme .text-green-100,.jl-theme .text-\\[\\#3AB000\\]{color:#65A30D;}
        .jl-theme .text-green-100{color:#ECFCCB;}
        .jl-theme .hover\\:text-green-600:hover,.jl-theme .hover\\:text-green-700:hover,.jl-theme .group:hover .group-hover\\:text-green-500{color:#4D7C0F;}
        .jl-theme .bg-green-500,.jl-theme .bg-\\[\\#3AB000\\]{background:#65A30D;}
        .jl-theme .hover\\:bg-\\[\\#2d8a00\\]:hover{background:#4D7C0F;}
        .jl-theme .bg-green-50,.jl-theme .bg-green-50\\/50,.jl-theme .hover\\:bg-green-50:hover,.jl-theme .group:hover .group-hover\\:bg-green-50{background:#F7FEE7;}
        .jl-theme .bg-green-200{background:#D9F99D;}
        .jl-theme .border-green-100,.jl-theme .border-green-200{border-color:#D9F99D;}
        .jl-theme .border-\\[\\#3AB000\\],.jl-theme .focus\\:border-\\[\\#3AB000\\]:focus{border-color:#65A30D;}
        .jl-theme .border-\\[\\#3AB000\\]\\/20{border-color:rgba(101,163,13,.2);}
        .jl-theme .focus\\:ring-green-500\\/10:focus{--tw-ring-color:rgba(101,163,13,.1);}
        .jl-theme .from-green-500,.jl-theme .from-green-600{background-image:linear-gradient(to right,#65A30D,#4D7C0F);}
        .jl-theme .shadow-green-200{--tw-shadow-color:#D9F99D;}
      `}</style>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Brand Header (same green gradient box as the Admin Portal login) */}
        <div className="pt-10 pb-8 px-8 text-center relative" style={{ background: "linear-gradient(100deg,#3F6212 0%,#4D7C0F 55%,#65A30D 100%)", textShadow: "0 1px 2px rgba(26,46,5,.35)" }}>
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-2xl shadow-2xl">
              <img src={logo} alt="JSSA Logo" className="h-24 md:h-28 object-contain" />
            </div>
          </div>
        </div>

        {/* LEFT: Login Form */}
        <div className="w-full p-6 sm:p-8 lg:p-10 bg-white">
          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <label className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#3AB000]" />
                Login as
              </label>
              <div className="relative" id="role-dropdown-container">
                {/* Custom Dropdown Trigger */}
                <button
                  type="button"
                  onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                  className="w-full pl-10 pr-10 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-800 text-sm font-bold text-left transition-all focus:outline-none focus:border-[#3AB000] focus:ring-4 focus:ring-green-500/10 cursor-pointer hover:border-gray-300 flex items-center gap-2 relative z-20"
                  style={{ borderColor: isRoleMenuOpen ? GREEN : "#e5e7eb" }}
                >
                  <div className="absolute left-3 text-[#3AB000]">
                    {formData.role === "applicant" && <User size={18} />}
                    {formData.role === "employee" && <Briefcase size={18} />}
                    {formData.role === "pharmacy" && <Briefcase size={18} />}
                    {formData.role === "doctor" && <Briefcase size={18} />}
                    {formData.role === "cardHolder" && <CreditCard size={18} />}
                    {(formData.role === "admin" || formData.role === "staff" || formData.role === "superadmin") && <Shield size={18} />}
                  </div>
                  <span>
                    {formData.role === "applicant" ? "Applicant (अभ्यर्थी)" :
                      formData.role === "employee" ? "Employee (कर्मचारी)" :
                        formData.role === "pharmacy" ? "Pharmacy (फार्मेसी)" :
                          formData.role === "doctor" ? "Doctor (डॉक्टर)" :
                            formData.role === "cardHolder" ? "Card Holder (कार्ड धारक)" :
                              formData.role === "staff" ? "Administrative Staff (प्रशासनिक कर्मचारी)" :
                                "Administrator (व्यवस्थापक)"}
                  </span>
                  <div className="absolute right-3 transition-transform duration-300" style={{ transform: isRoleMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <ChevronDown size={18} className="text-gray-400" />
                  </div>
                </button>

                {/* Custom Dropdown Menu */}
                {isRoleMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsRoleMenuOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#3AB000]/20 rounded-2xl shadow-2xl overflow-y-auto max-h-[300px] z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                      {[
                        { value: "applicant", label: "Applicant", hindi: "आवेदक", icon: User },
                        { value: "employee", label: "Employee", hindi: "कर्मचारी", icon: Briefcase },
                        { value: "cardHolder", label: "Card Holder", hindi: "कार्ड धारक", icon: CreditCard },
                        { value: "pharmacy", label: "Pharmacy", hindi: "फार्मेसी", icon: Briefcase },
                        // { value: "doctor", label: "Doctor", hindi: "डॉक्टर", icon: Briefcase },
                        { value: "staff", label: "Administrative Staff", hindi: "प्रशासनिक कर्मचारी", icon: Shield },
                      ].map((opt) => {
                        const Icon = opt.icon;
                        const active = formData.role === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setFormData(p => ({ ...p, role: opt.value }));
                              setIsRoleMenuOpen(false);
                            }}
                            className="w-full px-4 py-3.5 flex items-center gap-3 transition-all duration-200 text-left group"
                            style={{
                              background: active ? `${GREEN}10` : "transparent",
                              color: active ? GREEN : "#374151"
                            }}
                          >
                            <div className={`p-2 rounded-lg transition-colors ${active ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-green-50 group-hover:text-green-500'}`}>
                              <Icon size={16} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{opt.label}</span>
                              <span className={`text-[10px] font-medium ${active ? 'text-green-600/70' : 'text-gray-400'}`}>{opt.hindi}</span>
                            </div>
                            {active && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {loginMethod === "otp" ? (
              /* Mobile Login View */
              <div className="animate-in fade-in duration-300 space-y-5">
                {!otpSent ? (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-3">
                        Enter your Mobile Number
                      </label>
                      <div className="relative group">
                        <div className="absolute left-0 top-0 bottom-0 flex items-center gap-2 pl-4 pr-3 border-r-2 border-gray-100 h-full">
                          <Phone size={16} className="text-gray-400" />
                          <span className="text-xs font-bold text-[#3AB000]">+91</span>
                        </div>
                        <input
                          type="tel"
                          maxLength={10}
                          value={phoneValue}
                          onChange={(e) => setPhoneValue(e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter mobile number"
                          autoComplete="nope"
                          className="w-full pl-24 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:outline-none text-sm font-bold focus:border-[#3AB000] group-hover:border-gray-300"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-3">
                        Enter your password
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className="w-full pl-10 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:outline-none text-sm font-medium focus:border-[#3AB000] group-hover:border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-bold text-gray-800">
                        Enter 6-digit OTP
                      </label>
                      <button
                        onClick={() => setOtpSent(false)}
                        className="text-xs font-bold text-green-600 hover:underline"
                      >
                        Change Number
                      </button>
                    </div>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        maxLength={6}
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:outline-none text-sm text-center tracking-[0.5em] font-bold focus:border-[#3AB000]"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      setLoginMethod("password");
                      setError("");
                    }}
                    className="text-sm font-bold text-green-600 hover:text-green-700 transition-colors"
                  >
                    Login with Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-sm font-bold text-gray-500 hover:text-green-600 transition-colors underline"
                  >
                    How to create password?
                  </button>
                </div>
              </div>
            ) : (
              /* Email Login View */
              <div className="animate-in fade-in duration-300 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Enter your email
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="identifier"
                      value={formData.identifier}
                      onChange={handleInputChange}
                      placeholder="name@example.com"
                      autoComplete="nope"
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:outline-none text-sm font-medium focus:border-[#3AB000] group-hover:border-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Enter your password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:outline-none text-sm font-medium focus:border-[#3AB000] group-hover:border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setLoginMethod("otp");
                    setError("");
                  }}
                  className="text-sm font-bold text-green-600 hover:text-green-700 transition-colors"
                >
                  Login with Mobile Number
                </button>
              </div>
            )}

            {formData.role !== "admin" && (
              <div className="text-right mt-1 mb-2">
                <Link
                  to="/forgot-password"
                  className="text-sm font-bold text-[#3AB000] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold animate-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            <button
              onClick={
                (loginMethod === "otp" && !otpSent) || loginMethod === "password"
                  ? handleLogin
                  : handleVerifyOTP
              }
              disabled={loading}
              className="w-full text-white py-4 rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-95 text-base disabled:opacity-50"
              style={{
                background: GREEN,
                letterSpacing: "0.02em",
              }}
            >
              {loading
                ? "Processing..."
                : (loginMethod === "otp" && !otpSent) || loginMethod === "password"
                  ? "Login"
                  : "Verify & Login"}
            </button>

            {/* OTP Login Secondary Button */}
            {loginMethod === "otp" && !otpSent && formData.role !== 'admin' && (
              <button
                onClick={handleRequestOTP}
                disabled={loading}
                className="w-full text-[#3AB000] bg-white border-2 border-[#3AB000] py-4 rounded-xl font-bold transition-all duration-300 hover:bg-green-50 active:scale-95 text-sm mt-2"
              >
                Don't have a password? Login with OTP
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Employee Role Promotion Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="relative h-32 bg-gradient-to-r from-green-500 to-green-700 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white rounded-full blur-3xl" />
              </div>
              <div className="relative text-white text-center">
                <CheckCircle2 size={64} className="mx-auto mb-2 animate-bounce" />
              </div>
            </div>

            {/* Content */}
            <div className="p-8 text-center space-y-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Congratulations!</h2>
                <p className="text-gray-600 font-semibold">
                  {promotedUserName}
                </p>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 space-y-3">
                <p className="text-sm font-bold text-gray-800 leading-relaxed">
                  Your MOU payment has been verified successfully.
                </p>
                <p className="text-sm font-bold text-green-700">
                  You are now an <span className="text-lg">EMPLOYEE</span> of Jan Swasthya Sahayata Abhiyan!
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 text-left space-y-2">
                <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Next Step</p>
                <p className="text-sm font-semibold text-blue-800">
                  Please login using the <span className="text-blue-600 font-black">Employee</span> login option to access your employee dashboard.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowEmployeeModal(false);
                  setFormData(prev => ({ ...prev, role: "employee" }));
                }}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-black py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                Continue as Employee
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => setShowEmployeeModal(false)}
                className="w-full border-2 border-gray-300 text-gray-700 font-bold py-2 rounded-xl transition-all duration-300 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div
              className="relative h-24 flex items-center px-6 overflow-hidden"
              style={{ background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})` }}
            >
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white rounded-full blur-3xl" />
              </div>
              <div className="relative text-white flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">How to Create Password</h3>
                  <p className="text-sm text-green-100">पासवर्ड कैसे बनाएं?</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="space-y-5">
                <div className="flex gap-4 items-start bg-green-50/50 p-3 rounded-2xl border border-green-100 transition-colors hover:bg-green-50">
                  <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-black flex-shrink-0 mt-0.5 shadow-md shadow-green-200" style={{ backgroundColor: GREEN }}>1</div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 leading-tight mb-1">Enter Mobile Number</p>
                    <p className="text-xs text-gray-600 mb-1">Enter your registered mobile number in the field above.</p>
                    <p className="text-xs text-green-700/80 font-medium">ऊपर अपना पंजीकृत मोबाइल नंबर दर्ज करें।</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start bg-green-50/50 p-3 rounded-2xl border border-green-100 transition-colors hover:bg-green-50">
                  <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-black flex-shrink-0 mt-0.5 shadow-md shadow-green-200" style={{ backgroundColor: GREEN }}>2</div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 leading-tight mb-1">Select OTP Login</p>
                    <p className="text-xs text-gray-600 mb-1">Click the "Don't have a password? Login with OTP" button.</p>
                    <p className="text-xs text-green-700/80 font-medium">नीचे दिए गए "Don't have a password? Login with OTP" बटन पर क्लिक करें।</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start bg-green-50/50 p-3 rounded-2xl border border-green-100 transition-colors hover:bg-green-50">
                  <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-black flex-shrink-0 mt-0.5 shadow-md shadow-green-200" style={{ backgroundColor: GREEN }}>3</div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 leading-tight mb-1">Verify OTP</p>
                    <p className="text-xs text-gray-600 mb-1">Enter the 6-digit OTP sent to your phone and click login.</p>
                    <p className="text-xs text-green-700/80 font-medium">अपने फोन पर आए 6-अंकों वाले OTP को दर्ज करें और लॉगिन करें।</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start bg-green-50/50 p-3 rounded-2xl border border-green-100 transition-colors hover:bg-green-50">
                  <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-black flex-shrink-0 mt-0.5 shadow-md shadow-green-200" style={{ backgroundColor: GREEN }}>4</div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 leading-tight mb-1">Create New Password</p>
                    <p className="text-xs text-gray-600 mb-1">After login, enter your new password, confirm it, and submit!</p>
                    <p className="text-xs text-green-700/80 font-medium">लॉगिन के बाद, अपना नया पासवर्ड दर्ज करें, पुष्टि करें और सबमिट करें!</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full bg-[#3AB000] text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:bg-[#2d8a00] active:scale-95 mt-4"
              >
                Understood / समझ आ गया
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
