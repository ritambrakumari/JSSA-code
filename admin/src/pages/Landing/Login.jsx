import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Eye, User, Lock, EyeOff } from "lucide-react";

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = () => {
    console.log("Super Admin Login attempt:", formData);
    // Navigate to dashboard page
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="w-full max-w-5xl bg-white rounded-sm shadow-sm overflow-hidden flex">
        {/* Left Side - Super Admin Login Form */}
        <div className="w-1/2 p-12 bg-gradient-to-br from-orange-50 via-white to-amber-50">
          {/* Brand Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-8">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: "#FF7B1D" }}
              >
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="relative text-2xl font-bold text-gray-800 inline-block">
                Right Edu Tech
                <span className="absolute left-0 -bottom-1 w-full h-[4px] bg-[#FF7B1D] rounded-full"></span>
              </h1>
            </div>

            <p className="text-sm text-gray-500">
              Nice to see you again! Let's get started
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Identifier Field */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Enter your Email or Username or Mobile Number
              </label>
              <div className="relative">
                {/* Icon */}
                <User className="absolute left-3 top-3.5 text-black w-5 h-5" />
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Enter your password
              </label>
              <div className="relative">
                {/* Lock Icon (Left Side) */}
                <Lock className="absolute left-3 top-3.5 text-black w-5 h-5" />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password (8 or more characters)"
                  className="w-full pl-10 pr-10 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none"
                />

                {/* Eye Icon (Show/Hide Password) */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-600 hover:text-orange-600 transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] mt-14"
            >
              Log in
            </button>
          </div>
        </div>

        {/* Right Side - Illustration & Message */}
        <div className="w-1/2 flex flex-col items-center justify-center p-12 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-center relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-yellow-200 rounded-full blur-3xl animate-pulse delay-700"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>

          <div className="mb-6 relative z-10">
            <h3 className="text-orange-100 text-sm font-medium mb-3 uppercase tracking-wide">
              Nice to see you again
            </h3>
            <h2 className="text-white text-4xl font-bold mb-4">Welcome back</h2>
          </div>

          <div className="relative w-full max-w-md z-10">
            <svg viewBox="0 0 500 400" className="w-full h-auto">
              {/* Background decorative circles */}
              <circle cx="250" cy="200" r="190" fill="#FFFFFF" opacity="0.05" />
              <circle cx="250" cy="200" r="140" fill="#FFFFFF" opacity="0.08" />

              {/* Desk/Table */}
              <ellipse
                cx="250"
                cy="320"
                rx="180"
                ry="20"
                fill="#FFFFFF"
                opacity="0.2"
              />
              <rect
                x="80"
                y="300"
                width="340"
                height="20"
                rx="10"
                fill="#FFFFFF"
                opacity="0.3"
              />

              {/* Person in wheelchair - Left Side */}
              {/* Wheelchair wheels */}
              <circle
                cx="180"
                cy="280"
                r="28"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="5"
                opacity="0.9"
              />
              <circle
                cx="180"
                cy="280"
                r="18"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2"
                opacity="0.9"
              />
              <line
                x1="165"
                y1="280"
                x2="195"
                y2="280"
                stroke="#FFFFFF"
                strokeWidth="2"
                opacity="0.9"
              />
              <line
                x1="180"
                y1="265"
                x2="180"
                y2="295"
                stroke="#FFFFFF"
                strokeWidth="2"
                opacity="0.9"
              />

              {/* Small front wheel */}
              <circle
                cx="140"
                cy="285"
                r="12"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="4"
                opacity="0.9"
              />

              {/* Wheelchair frame */}
              <path
                d="M 140 285 L 155 270 L 155 240 L 180 240"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="4"
                opacity="0.9"
              />
              <rect
                x="155"
                y="240"
                width="50"
                height="40"
                rx="8"
                fill="#FFFFFF"
                opacity="0.9"
              />

              {/* Person in wheelchair */}
              {/* Body */}
              <ellipse cx="180" cy="230" rx="22" ry="30" fill="#A78BFA" />
              {/* Head */}
              <circle cx="180" cy="195" r="20" fill="#FDE68A" />
              {/* Hair */}
              <path
                d="M 163 190 Q 170 178 180 178 Q 190 178 197 190 L 197 195 Q 190 188 180 188 Q 170 188 163 195 Z"
                fill="#6366F1"
              />
              {/* Arms */}
              <ellipse
                cx="160"
                cy="235"
                rx="8"
                ry="25"
                fill="#FDE68A"
                transform="rotate(-15 160 235)"
              />
              <ellipse
                cx="200"
                cy="235"
                rx="8"
                ry="25"
                fill="#FDE68A"
                transform="rotate(15 200 235)"
              />
              {/* Book in hand */}
              <rect
                x="195"
                y="245"
                width="20"
                height="28"
                rx="2"
                fill="#EF4444"
                opacity="0.9"
              />
              <line
                x1="200"
                y1="245"
                x2="200"
                y2="273"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />

              {/* Standing Person - Right Side */}
              {/* Legs */}
              <rect
                x="300"
                y="250"
                width="12"
                height="50"
                rx="6"
                fill="#6366F1"
              />
              <rect
                x="318"
                y="250"
                width="12"
                height="50"
                rx="6"
                fill="#6366F1"
              />
              {/* Body */}
              <ellipse cx="315" cy="220" rx="25" ry="35" fill="#8B5CF6" />
              {/* Head */}
              <circle cx="315" cy="180" r="22" fill="#FCD34D" />
              {/* Hair */}
              <ellipse cx="315" cy="170" rx="24" ry="18" fill="#7C3AED" />
              {/* Arms */}
              <ellipse
                cx="290"
                cy="225"
                rx="10"
                ry="28"
                fill="#FCD34D"
                transform="rotate(-25 290 225)"
              />
              <ellipse
                cx="340"
                cy="225"
                rx="10"
                ry="28"
                fill="#FCD34D"
                transform="rotate(25 340 225)"
              />

              {/* Laptop in hands */}
              <rect
                x="280"
                y="235"
                width="70"
                height="45"
                rx="3"
                fill="#FFFFFF"
                opacity="0.95"
              />
              <rect
                x="285"
                y="240"
                width="60"
                height="35"
                rx="2"
                fill="#C4B5FD"
              />
              <circle cx="315" cy="257" r="3" fill="#8B5CF6" />

              {/* Floating Education Icons */}
              {/* Book stack - top left */}
              <g transform="translate(50, 80)">
                <rect
                  x="0"
                  y="20"
                  width="45"
                  height="10"
                  rx="2"
                  fill="#EF4444"
                  opacity="0.85"
                />
                <rect
                  x="2"
                  y="10"
                  width="41"
                  height="10"
                  rx="2"
                  fill="#8B5CF6"
                  opacity="0.85"
                />
                <rect
                  x="4"
                  y="0"
                  width="37"
                  height="10"
                  rx="2"
                  fill="#3B82F6"
                  opacity="0.85"
                />
              </g>

              {/* Graduation cap - top right */}
              <g transform="translate(400, 70)">
                <rect
                  x="0"
                  y="10"
                  width="50"
                  height="4"
                  rx="2"
                  fill="#FBBF24"
                />
                <path d="M 5 10 L 25 0 L 45 10 Z" fill="#FBBF24" />
                <rect x="23" y="10" width="4" height="15" fill="#FBBF24" />
                <circle cx="25" cy="25" r="3" fill="#FBBF24" />
              </g>

              {/* Certificate/Document - left middle */}
              <g transform="translate(40, 200)">
                <rect
                  x="0"
                  y="0"
                  width="50"
                  height="40"
                  rx="3"
                  fill="#FFFFFF"
                  opacity="0.9"
                />
                <circle cx="25" cy="12" r="6" fill="#8B5CF6" opacity="0.5" />
                <line
                  x1="10"
                  y1="24"
                  x2="40"
                  y2="24"
                  stroke="#8B5CF6"
                  strokeWidth="2"
                  opacity="0.7"
                />
                <line
                  x1="10"
                  y1="30"
                  x2="40"
                  y2="30"
                  stroke="#8B5CF6"
                  strokeWidth="2"
                  opacity="0.7"
                />
              </g>

              {/* Light bulb - top center */}
              <g transform="translate(240, 50)">
                <circle cx="10" cy="10" r="12" fill="#FCD34D" opacity="0.8" />
                <rect
                  x="7"
                  y="22"
                  width="6"
                  height="8"
                  rx="3"
                  fill="#FCD34D"
                  opacity="0.6"
                />
                <path
                  d="M 5 10 L 2 5 M 15 10 L 18 5 M 10 0 L 10 -3"
                  stroke="#FCD34D"
                  strokeWidth="2"
                  opacity="0.8"
                />
              </g>

              {/* Apple - right middle */}
              <g transform="translate(420, 200)">
                <circle cx="10" cy="15" r="15" fill="#EF4444" opacity="0.85" />
                <ellipse
                  cx="10"
                  cy="15"
                  rx="12"
                  ry="15"
                  fill="#EF4444"
                  opacity="0.85"
                />
                <path
                  d="M 10 0 Q 8 3 10 5"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                />
                <ellipse
                  cx="13"
                  cy="3"
                  rx="4"
                  ry="2"
                  fill="#10B981"
                  opacity="0.8"
                />
              </g>

              {/* Pencil - bottom left */}
              <g transform="translate(90, 120)">
                <rect
                  x="0"
                  y="0"
                  width="12"
                  height="50"
                  rx="2"
                  fill="#FBBF24"
                />
                <polygon points="0,50 6,60 12,50" fill="#FCD34D" />
                <rect x="0" y="0" width="12" height="10" fill="#FCD34D" />
                <circle cx="6" cy="5" r="2" fill="#1F2937" />
              </g>

              {/* Clock - right bottom */}
              <g transform="translate(380, 280)">
                <circle cx="20" cy="20" r="18" fill="#FFFFFF" opacity="0.9" />
                <circle
                  cx="20"
                  cy="20"
                  r="15"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="2"
                />
                <line
                  x1="20"
                  y1="20"
                  x2="20"
                  y2="10"
                  stroke="#8B5CF6"
                  strokeWidth="2"
                />
                <line
                  x1="20"
                  y1="20"
                  x2="27"
                  y2="20"
                  stroke="#8B5CF6"
                  strokeWidth="2"
                />
                <circle cx="20" cy="20" r="2" fill="#8B5CF6" />
              </g>

              {/* Decorative dots/sparkles */}
              <circle cx="120" cy="100" r="4" fill="#FCD34D" opacity="0.6" />
              <circle cx="380" cy="130" r="5" fill="#C4B5FD" opacity="0.7" />
              <circle cx="430" cy="180" r="4" fill="#FCD34D" opacity="0.5" />
              <circle cx="70" cy="270" r="6" fill="#A78BFA" opacity="0.6" />
              <circle cx="100" cy="340" r="4" fill="#FCD34D" opacity="0.7" />
              <circle cx="400" cy="340" r="5" fill="#C4B5FD" opacity="0.6" />

              {/* Stars */}
              <path
                d="M 450 240 L 453 248 L 461 248 L 455 253 L 457 261 L 450 256 L 443 261 L 445 253 L 439 248 L 447 248 Z"
                fill="#FCD34D"
                opacity="0.7"
              />
              <path
                d="M 60 150 L 62 156 L 68 156 L 63 160 L 65 166 L 60 162 L 55 166 L 57 160 L 52 156 L 58 156 Z"
                fill="#A78BFA"
                opacity="0.7"
              />
            </svg>
          </div>

          <p className="text-orange-50 text-sm mt-6 max-w-sm relative z-10">
            Empower minds and transform education with{" "}
            <span className="font-semibold text-white">Right Edu Tech</span>
          </p>
        </div>
      </div>
    </div>
  );
}
