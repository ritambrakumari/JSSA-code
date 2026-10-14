import React, { useState, useRef, useEffect } from "react";
import {
  FiMenu,
  FiGrid,
  FiMaximize,
  FiBell,
  FiMail,
  FiUser,
  FiSettings,
  FiLogOut,
  FiPhone,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { roleHomePath } from "../auth/auth";

const GREEN_BASE = "#3AB000";
const GREEN_DARK_BASE = "#2d8a00";

// Applicant + admin/superadmin use the landing-site blue theme (other roles stay green).
const HDR_BLUE_CSS = `
.hdr-blue{font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;}
.hdr-blue .text-green-100{color:#ECFCCB;}
.hdr-blue .text-green-200{color:#D9F99D;}
.hdr-blue .text-green-300{color:#D9F99D;}
.hdr-blue .bg-green-900\\/40{background:rgba(26, 46, 5,.45);}
.hdr-blue .border-green-400\\/30{border-color:rgba(217, 249, 157,.35);}
.hdr-blue circle[fill="#3AB000"]{fill:#4D7C0F;}
`;

/* ── Static Avatar ── */
function StaticAvatar({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="20" cy="20" r="20" fill="#3AB000" />
      <circle cx="20" cy="14" r="7" fill="white" />
      <ellipse cx="20" cy="36" rx="13" ry="9" fill="white" />
    </svg>
  );
}

/* ── Digital Clock ── */
function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n) => String(n).padStart(2, "0");
  const hours = pad(time.getHours());
  const minutes = pad(time.getMinutes());
  const seconds = pad(time.getSeconds());

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const dayName = days[time.getDay()];
  const monthStr = months[time.getMonth()];
  const dateNum = pad(time.getDate());
  const year = time.getFullYear();

  return (
    <div
      className="flex items-center gap-2 px-3 py-1 rounded-lg select-none"
      style={{
        background: "rgba(0,0,0,0.25)",
        border: "1px solid rgba(255,255,255,0.2)",
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      {/* Time */}
      <div className="flex items-center gap-0.5">
        <span
          className="text-white font-bold text-lg leading-none"
          style={{ letterSpacing: 2 }}
        >
          {hours}
        </span>
        <span
          className="text-green-200 font-bold text-lg leading-none animate-pulse"
          style={{ letterSpacing: 1 }}
        >
          :
        </span>
        <span
          className="text-white font-bold text-lg leading-none"
          style={{ letterSpacing: 2 }}
        >
          {minutes}
        </span>
        <span
          className="text-green-200 font-bold text-lg leading-none animate-pulse"
          style={{ letterSpacing: 1 }}
        >
          :
        </span>
        <span
          className="text-green-300 font-bold text-base leading-none"
          style={{ letterSpacing: 2 }}
        >
          {seconds}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/25" />

      {/* Date */}
      <div className="flex flex-col leading-none">
        <span className="text-green-200 text-[10px] font-bold tracking-widest">
          {dayName}
        </span>
        <span className="text-white text-[10px] font-semibold">
          {dateNum} {monthStr} {year}
        </span>
      </div>
    </div>
  );
}

const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { role, identifier, session } = useAuth();
  const isBlueTheme = ["applicant", "employee", "admin", "superadmin"].includes(role);
  const GREEN = isBlueTheme ? "#3F6212" : GREEN_BASE;
  const GREEN_DARK = isBlueTheme ? "#4D7C0F" : GREEN_DARK_BASE;
  const userObj = session?.user || {};

  const [employeeData, setEmployeeData] = useState(null);
  const [staffData, setStaffData] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { employeesAPI, administrativeStaffAPI } = await import("../utils/api");
        if (role === "employee") {
          const res = await employeesAPI.getMe();
          if (res.success) setEmployeeData(res.data);
        } else if (role === "staff") {
          const res = await administrativeStaffAPI.getMe();
          if (res.success) setStaffData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch user data for header:", err);
      }
    };
    fetchUserData();
  }, [role]);

  const cleanImageUrl = (url) => {
    if (!url) return "";
    
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      return url;
    }
    if (url.includes("localhost:") && url.includes("/api/")) {
      const parts = url.split("/api/");
      return `https://api.jssabhiyan.com/api/${parts[1]}`;
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    if (url.startsWith("/api/")) {
      return `https://api.jssabhiyan.com${url}`;
    }
    if (url.startsWith("/")) {
      return `https://api.jssabhiyan.com/api${url}`;
    }
    if (url.startsWith("uploads/") || url.startsWith("files/")) {
      return `https://api.jssabhiyan.com/api/${url}`;
    }
    return `https://api.jssabhiyan.com/api/files/${url}`;
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRoleText = () => {
    switch (role) {
      case "employee": return "Employee";
      case "staff": return "Administrative Staff";
      case "cardHolder": return "Cardholder";
      case "admin": return "Admin";
      case "superadmin": return "Super Admin";
      default: return "User";
    }
  };

  const getDropdownLinks = () => {
    let links = [];
    switch (role) {
      case "employee":
        links = [
          { icon: FiUser, label: "My Profile", path: "/employee/profile" },
          { icon: FiGrid, label: "Go to Dashboard", path: roleHomePath(role) },
        ];
        break;
      case "staff":
        links = [
          { icon: FiUser, label: "My Profile", path: "/staff/profile" },
          { icon: FiGrid, label: "Go to Dashboard", path: roleHomePath(role) },
        ];
        break;
      case "admin":
      case "superadmin":
        links = [
          { icon: FiGrid, label: "Go to Dashboard", path: roleHomePath(role) },
          { icon: FiSettings, label: "Settings", path: "/settings" },
        ];
        break;
      case "cardHolder":
      default:
        links = [];
        break;
    }

    links.push({ icon: FiPhone, label: "Support: 9546599311", path: null });
    return links;
  };

  let displayName = userObj.name || (role === "admin" ? "Admin" : "User");
  let displayEmail = userObj.email || (role === "cardHolder" ? "" : "");
  let displayPhoto = null;

  let displayPhone = userObj.phone || userObj.mobileNumber || "";

  if (role === "employee" && employeeData) {
    displayName = employeeData.name;
    displayEmail = employeeData.email;
    displayPhoto = employeeData.photo;
    displayPhone = employeeData.phone || employeeData.mobileNumber || displayPhone;
  } else if (role === "staff" && staffData) {
    displayName = staffData.name;
    displayEmail = staffData.email;
    displayPhoto = staffData.photo;
    displayPhone = staffData.phone || staffData.mobileNumber || displayPhone;
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 sm:left-64 h-[56px] flex items-center px-4 sm:px-6 lg:px-8 shadow-md z-50 ${isBlueTheme ? "hdr-blue" : ""}`}
      style={{
        background: `linear-gradient(90deg, ${GREEN} 0%, ${GREEN_DARK} 100%)`,
      }}
    >
      {isBlueTheme && <style>{HDR_BLUE_CSS}</style>}
      <div className="flex justify-between items-center w-full h-full">
        <div className="flex items-center gap-2">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => onSidebarToggle()}
            className="sm:hidden p-1 rounded hover:bg-white/10 text-white transition focus:outline-none"
          >
            <FiMenu size={20} />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Clock */}
          <div className="hidden sm:block">
            <DigitalClock />
          </div>

          <div className="w-px h-6 mx-1 bg-white/30" />

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg transition focus:outline-none"
              style={{ background: "transparent" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {/* Avatar with online dot */}
              <div className="relative">
                <div className="w-8 h-8 rounded-full border-2 border-white/60 overflow-hidden bg-white/10 flex items-center justify-center">
                  {displayPhoto ? (
                    <img
                      src={cleanImageUrl(displayPhoto)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : displayName !== "User" && displayName !== "Admin" ? (
                    <span className="text-white text-xs font-bold">
                      {getInitials(displayName)}
                    </span>
                  ) : (
                    <StaticAvatar size={32} />
                  )}
                </div>
                {/* Online dot */}
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                  style={{ background: "#4ade80", borderColor: GREEN_DARK }}
                />
              </div>

              {/* Name — hidden on small screens */}
              <div className="hidden md:block text-left max-w-[120px] lg:max-w-[180px]">
                <p className="text-white text-xs font-bold leading-tight truncate">
                  {displayName}
                </p>
                <p className="text-white/70 text-[10px] leading-tight truncate">
                  {getRoleText()}
                </p>
              </div>
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-2xl overflow-hidden"
                style={{ border: "1px solid #e5e7eb" }}
              >
                {/* Profile Header */}
                <div
                  className="px-4 py-3 flex items-center gap-3"
                  style={{
                    background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DARK} 100%)`,
                  }}
                >
                  <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center">
                    {displayPhoto ? (
                      <img
                        src={cleanImageUrl(displayPhoto)}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : displayName !== "User" && displayName !== "Admin" ? (
                      <span className="text-white text-sm font-bold">
                        {getInitials(displayName)}
                      </span>
                    ) : (
                      <StaticAvatar size={40} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white leading-tight truncate">
                      {displayName}
                    </p>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 bg-green-900/40 text-green-100 text-[9px] font-extrabold uppercase tracking-widest rounded-sm border border-green-400/30 shadow-sm">
                        {getRoleText()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Contact Info */}
                <div className="py-2 border-b border-gray-100 bg-gray-50/50 flex flex-col">
                  {displayEmail && (
                    <div className="px-4 py-1 text-[12px] text-gray-600 font-medium flex items-center gap-3">
                      <FiMail size={15} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{displayEmail}</span>
                    </div>
                  )}
                  {displayPhone && (
                    <div className="px-4 py-1 text-[12px] text-gray-600 font-medium flex items-center gap-3">
                      <FiPhone size={15} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{displayPhone}</span>
                    </div>
                  )}
                </div>

                {/* Menu Items */}
                <div className="py-1.5">
                  {getDropdownLinks().map(({ icon: Icon, label, path }, i) => (
                    <button
                      key={i}
                      onClick={() => path && navigate(path)}
                      className="w-full px-4 py-2.5 text-sm flex items-center gap-3 text-gray-700 transition"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#e8f5e2")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <span style={{ color: GREEN }}>
                        <Icon size={15} />
                      </span>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Divider + Logout */}
                <div style={{ borderTop: "1px solid #e5e7eb" }}>
                  <button
                    onClick={() => navigate("/logout")}
                    className="w-full px-4 py-2.5 text-sm flex items-center gap-3 text-red-600 font-semibold transition"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#fee2e2")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <FiLogOut size={15} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
