import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/img0.png";
import { SYSTEM_MODULES, SIDEBAR_GROUPS } from "../config/modulesConfig";
import {
  LayoutDashboard,
  FileText,
  Users,
  ImageIcon,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  UserCog,
  Shield,
  ScrollText,
  CreditCard,
  Film,
  Bell,
  BookOpen,
  Calendar,
  Send,
  MapPin,
  UserPlus,
  Target,
  Archive,
  Star,
  Landmark,
  Video,
  Activity,
  HelpCircle,
  MessageSquare,
  Lock,
  Award,
  Stethoscope
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

const GREEN_BASE = "#3AB000";
const GREEN_DARK_BASE = "#2d8a00";
const GREEN_LIGHT_BASE = "#e8f5e2";
const GREEN_BORDER_BASE = "#bbf7d0";

/* ── Logo ── */
function SidebarLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 120 120">
      <circle
        cx="60"
        cy="60"
        r="58"
        fill="white"
        stroke={GREEN_BASE}
        strokeWidth="4"
      />
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

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { role, employeeProfile } = useAuth();
  // Applicant + admin/superadmin use the landing-site blue theme (other roles stay green).
  const isBlueTheme = ["applicant", "employee", "admin", "superadmin"].includes(role);
  const GREEN = isBlueTheme ? "#4D7C0F" : GREEN_BASE;
  const GREEN_DARK = isBlueTheme ? "#3F6212" : GREEN_DARK_BASE;
  const GREEN_LIGHT = isBlueTheme ? "#ECFCCB" : GREEN_LIGHT_BASE;
  const GREEN_BORDER = isBlueTheme ? "#D9F99D" : GREEN_BORDER_BASE;
  const permissions = useMemo(() => employeeProfile?.jobRoleId?.permissions || [], [employeeProfile]);
  const activeItem = location.pathname + location.search;
  const [invitationCount, setInvitationCount] = useState(0);

  const fetchInvitations = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;
      if (!token) return;

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/meetings/invitations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setInvitationCount(data.data.length);
      }
    } catch (error) {
      console.error("Sidebar invitation fetch error:", error);
    }
  };

  useEffect(() => {
    fetchInvitations();
    const interval = setInterval(fetchInvitations, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = useMemo(() => {
    const dashboardPath =
      role === "admin"
        ? "/admin/dashboard"
        : role === "applicant"
          ? "/applicant/dashboard"
          : "/dashboard";

    const base = [
      { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, path: dashboardPath },
      { id: "job_postings", name: "Job Postings", icon: Users, path: "/job-postings" },
      { id: "applications", name: "Application Form", icon: FileText, path: "/application-form" },
    ];

    if (role === "applicant") {
      base.splice(3, 0,
        { name: "My Exam & MOU", icon: Bell, path: "/my-exam" },
        { name: "Refund Request", icon: Shield, path: "/applicant/refund" },
        { name: "Transactions", icon: CreditCard, path: "/transactions" }
      );
      return base;
    }

    if (role === "admin" || role === "superadmin") {
      base.push(
        { name: "Gallery", icon: ImageIcon, path: "/admin/gallery" },
        { name: "Scroller", icon: Film, path: "/scroller" },
        { name: "Notifications", icon: Bell, path: "/notifications-manage" },
        { name: "Notice", icon: Bell, path: "/notice" },
        { name: "Transactions", icon: CreditCard, path: "/admin/transactions" },
        { name: "Claim Requests", icon: Shield, path: "/admin/claims" },
        { name: "Camp Management", icon: MapPin, path: "/admin/camp-management" },
        { name: "Enquiry Management", icon: MessageSquare, path: "/admin/enquiries" },
        { name: "Payment Settings", icon: CreditCard, path: "/settings" },
        {
          name: "Exam Management",
          icon: BookOpen,
          children: [
            { name: "Question Bank", icon: FileText, path: "/question-bank" },
            { name: "Exam Event", icon: FileText, path: "/create-paper" },
            { name: "Exam Results", icon: Bell, path: "/test-result" },
            { name: "Re-Exam", icon: FileText, path: "/re-exam" },
            { name: "Unassigned", icon: FileText, path: "/unassigned" },
            { name: "Referred Candidates", icon: FileText, path: "/referred-candidates" },
            { name: "Global Candidates", icon: Users, path: "/global-candidates" },
            { name: "WhatsApp Test", icon: Send, path: "/admin/whatsapp-test" },
          ],
        },
        {
          name: "Employee Management",
          icon: UserCog,
          children: [
            { name: "Employee List", icon: Users, path: "/admin/employee-list" },
            { name: "Target Tracking", icon: Target, path: "/admin/target-tracking" },
            { name: "Zonal Tracking", icon: MapPin, path: "/admin/zonal-tracking" },
            { name: "Add Employee", icon: UserPlus, path: "/admin/employees" },
            { name: "ID Card Management", icon: CreditCard, path: "/admin/id-cards" },
            { name: "Zone Selection", icon: Lock, path: "/admin/zone-selection" },
            { name: "Zone Management", icon: Lock, path: "/admin/zone-management" },
            { name: "Administrative Staff", icon: UserPlus, path: "/admin/administrative-staff" },
            { name: "Job Roles", icon: Shield, path: "/admin/job-roles" },
            { name: "Rating Management", icon: Star, path: "/admin/reviews" },
            { name: "Employee Attendance", icon: Calendar, path: "/admin/attendance" },
            { name: "Staff Attendance", icon: Calendar, path: "/admin/staff-attendance" },
            { name: "Resignation Requests", icon: LogOut, path: "/admin/resignations" },
            { name: "Employee Announcement", icon: Bell, path: "/admin/employee-announcements" },
          ],
        },
        {
          name: "Lead Management",
          icon: Users,
          children: [
            { name: "Lead List", icon: FileText, path: "/admin/leads" },
            { name: "Archived Wall", icon: Archive, path: "/admin/leads?view=archived" },
          ],
        },
        {
          name: "Pharmacy Management",
          icon: Stethoscope,
          children: [
            { name: "Pharmacy List", icon: FileText, path: "/admin/pharmacies" },
            { name: "Discount Config", icon: Settings, path: "/admin/pharmacies/discount-config" }
          ],
        },
        { name: "MOU", icon: ScrollText, path: "/admin/mou" },
        { name: "Fee Structure", icon: CreditCard, path: "/admin/fee-structure" },
        { name: "Wallet Management", icon: CreditCard, path: "/admin/wallet" },
        { name: "Wallet Ledger", icon: ScrollText, path: "/admin/wallet-ledger" },
        { name: "Card Management", icon: CreditCard, path: "/admin/cards" },
        { name: "CardHolder Management", icon: CreditCard, path: "/admin/cardholders" },
        { name: "Doctor Management", icon: Stethoscope, path: "/admin/doctors" },
        { name: "Goal Configuration", icon: Target, path: "/admin/goal-setup" },
        { name: "Salary Management", icon: CreditCard, path: "/admin/salary" },
        {
          name: "Employee Salary",
          icon: CreditCard,
          children: [
            { name: "Withdraw Req", icon: Landmark, path: "/admin/withdrawals" },
            { name: "Salary Calculation", icon: CreditCard, path: "/admin/employee-salary" },
          ],
        },
        { name: "Refund Management", icon: Shield, path: "/admin/refunds" },
        { name: "Feed Management", icon: FileText, path: "/admin/feeds" },
        { name: "Meeting Hub", icon: Video, path: "/admin/meeting-hub", badge: invitationCount > 0 ? invitationCount : null },
        { name: "Meeting Management", icon: Video, path: "/admin/meetings" },
        { name: "Training", icon: BookOpen, path: "/admin/training" },
        {
          name: "Certificate Management",
          icon: Award,
          children: [
            { name: "Certificate List", icon: Award, path: "/admin/certificates" },
            { name: "RM Certificate Assignment", icon: Award, path: "/admin/rm-certificates" },
            { name: "Custom Certificates", icon: Award, path: "/admin/custom-certificates" },
          ],
        },
        { name: "Q&A Management", icon: MessageSquare, path: "/admin/qa" },
        { name: "Letter Management", icon: FileText, path: "/admin/letters" },
        { name: "Policy Management", icon: FileText, path: "/admin/policies" },
        { name: "Visitor Management", icon: UserCog, path: "/admin/visitors" },
        { name: "Chat & Live Support", icon: HelpCircle, path: "/admin/live-support" },
        { name: "Support Management", icon: HelpCircle, path: "/admin/support" },
        { name: "Location Management", icon: MapPin, path: "/admin/location-management" },
        { name: "Blog Management", icon: FileText, path: "/admin/blogs" },
        { name: "Camp Report Management", icon: MapPin, path: "/admin/camp-reports" },
      );
      return base;
    }

    if (role === "staff") {
      const staffModules = [];

      const hasPerm = (perm) => {
        if (!permissions || !Array.isArray(permissions)) return false;
        const normalizedPerm = perm.toLowerCase();
        const snake = perm.replace(/([A-Z])/g, "_$1").toLowerCase();
        return permissions.some(p => {
          const lp = p.toLowerCase();
          return lp === normalizedPerm || lp === snake;
        });
      };

      const groupMap = new Map();
      const jobTitle = employeeProfile?.jobRoleId?.jobTitle || employeeProfile?.designation || employeeProfile?.role || "";
      const isPM = jobTitle.toLowerCase().includes("project manager") || jobTitle.toUpperCase() === "PM";

      SYSTEM_MODULES.forEach(module => {
        let isVisible = module.alwaysVisible;
        if (!isVisible) {
          const permToCheck = module.permId || module.id;
          isVisible = hasPerm(permToCheck);
          // Special case for feeds
          if (permToCheck === "feedManagement" && !isVisible) {
            isVisible = hasPerm("feeds");
          }
        }

        if (isVisible) {
          const menuItem = {
            name: module.label,
            icon: module.icon,
            path: module.path,
            ...(module.hasBadge && { badge: invitationCount > 0 ? invitationCount : null })
          };

          if (module.sidebarGroup) {
            if (!groupMap.has(module.sidebarGroup)) {
              const newGroup = {
                name: module.sidebarGroup,
                icon: SIDEBAR_GROUPS[module.sidebarGroup]?.icon || module.icon,
                children: []
              };
              groupMap.set(module.sidebarGroup, newGroup);
              staffModules.push(newGroup);
            }
            groupMap.get(module.sidebarGroup).children.push(menuItem);
          } else {
            staffModules.push(menuItem);
          }
        }
      });

      // PM dynamic injection: Let's find "Application Form" and insert "My Team" after it.
      if (isPM) {
        const appFormIndex = staffModules.findIndex(m => m.name === "Application Form");
        staffModules.splice(appFormIndex !== -1 ? appFormIndex + 1 : 3, 0, { name: "My Team", icon: Users, path: "/staff/my-team" });
      }

      return staffModules;
    }

    if (role === "employee") {
      if (employeeProfile?.status === "Resigned") {
        return [
          { name: "My Profile", icon: UserCog, path: "/employee/profile" },
          { name: "Logout", icon: LogOut, path: "/logout" },
        ];
      }
      const items = [
        { name: "Dashboard", icon: LayoutDashboard, path: "/employee/dashboard" },
        { name: "Attendance", icon: Calendar, path: "/employee/attendance" },
        { name: "Feed", icon: FileText, path: "/employee/feed" },
        { name: "Cards", icon: CreditCard, path: "/employee/cards" },
        { name: "Leads", icon: Users, path: "/employee/leads" },
        { name: "My Team", icon: Users, path: "/employee/my-team" },
        { name: "Letters", icon: ScrollText, path: "/employee/letters" },
        { name: "Company Policies", icon: ScrollText, path: "/employee/policies" },
        { name: "Working Zone", icon: LayoutDashboard, path: "/employee/working-zone" },
        { name: "Review & Ratings", icon: Bell, path: "/employee/reviews" },
        { name: "Meetings", icon: Video, path: "/employee/meetings", badge: invitationCount > 0 ? invitationCount : null },
        { name: "Announcements", icon: Bell, path: "/employee/announcements" },
        { name: "Claim Approvals", icon: Shield, path: "/employee/claims" },
        { name: "Refund Request", icon: Shield, path: "/employee/refund" },
        { name: "Salary", icon: CreditCard, path: "/employee/salary" },
        { name: "Training", icon: BookOpen, path: "/employee/training" },
        { name: "My Certificates", icon: Award, path: "/employee/my-certificates" },
        { name: "Camp", icon: MapPin, path: "/employee/camp" },
        { name: "Resign", icon: LogOut, path: "/employee/resign" },
        { name: "My Profile", icon: UserCog, path: "/employee/profile" },
        { name: "Hire Team", icon: Users, path: "/employee/hire-team" },
        { name: "Q&A Support", icon: HelpCircle, path: "/employee/support" },
        { name: "Doctor Consult", icon: Stethoscope, path: "/employee/doctors" },
      ];

      if (employeeProfile?.role === "RM" || employeeProfile?.role === "ZC") {
        // Insert Zone Selection after Working Zone or My Team
        const insertIndex = items.findIndex(item => item.name === "Working Zone") + 1;
        items.splice(insertIndex, 0, { name: "Zone Selection", icon: Lock, path: "/employee/zone-selection" });
      }

      if (employeeProfile?.role === "RM") {
        // Remove Cards for RM
        const cardIndex = items.findIndex(item => item.name === "Cards");
        if (cardIndex !== -1) items.splice(cardIndex, 1);
      }

      if (employeeProfile?.role === "RM" || employeeProfile?.role === "ZC") {
        // Insert Target Tracking after Feed
        const feedIndex = items.findIndex(item => item.name === "Feed");
        items.splice(feedIndex !== -1 ? feedIndex + 1 : items.length, 0, { name: "Target Tracking", icon: Target, path: "/employee/target-tracking" });
      }

      if (employeeProfile?.role === "RM") {
        // Add QA Management for RM only
        items.push({ name: "QA Management", icon: MessageSquare, path: "/employee/qa" });
        items.push({ name: "Camp Report", icon: MapPin, path: "/employee/camp-report" });
      }

      items.push({ name: "Logout", icon: LogOut, path: "/logout" });
      return items;
    }

    if (role === "cardHolder") {
      return [
        { name: "My Identity Card", icon: CreditCard, path: "/my-card" },
        { name: "Company Policies", icon: ScrollText, path: "/policies" },
        { name: "Health Calculators", icon: Activity, path: "/body-calculator" },
        { name: "Service Claims", icon: Shield, path: "/claims" },
        { name: "Camp", icon: MapPin, path: "/camp" },
        // { name: "Token Generation", icon: Stethoscope, path: "/cardholder/doctors" },
        { name: "Doctor Consult", icon: Video, path: "/cardholder/consult" },
        // { name: "My Prescriptions", icon: FileText, path: "/cardholder/prescriptions" },
        { name: "Logout", icon: LogOut, path: "/logout" },
      ];
    }

    if (role === "pharmacy") {
      return [
        { name: "Dashboard", icon: LayoutDashboard, path: "/pharmacy/dashboard" },
        // { name: "Pending Prescriptions", icon: FileText, path: "/pharmacy/dashboard/pending-prescriptions" },
        { name: "Bill Generate", icon: FileText, path: "/pharmacy/dashboard/bills" },
        { name: "Category Management", icon: LayoutDashboard, path: "/pharmacy/dashboard/categories" },
        { name: "Medicine Management", icon: LayoutDashboard, path: "/pharmacy/dashboard/products" },
        { name: "My Profile", icon: UserCog, path: "/pharmacy/dashboard/profile" },
        { name: "Logout", icon: LogOut, path: "/logout" },
      ];
    }

    if (role === "doctor") {
      return [
        { name: "Dashboard", icon: LayoutDashboard, path: "/doctor/dashboard" },
        { name: "My Tokens", icon: FileText, path: "/doctor/dashboard/tokens" },
        { name: "Write Prescription", icon: FileText, path: "/doctor/dashboard/write-prescription" },
        { name: "My Profile", icon: UserCog, path: "/doctor/dashboard/profile" },
        { name: "Logout", icon: LogOut, path: "/logout" },
      ];
    }

    base.push({ name: "Logout", icon: LogOut, path: "/logout" });
    return base;
  }, [role, permissions, employeeProfile]);

  // Effect to keep parent menu open if a child is active
  useEffect(() => {
    const activeParent = menuItems.find(
      (item) =>
        item.children &&
        item.children.some((c) => c.path === location.pathname),
    );
    if (activeParent && !openMenus.includes(activeParent.name)) {
      setOpenMenus((prev) => [...prev, activeParent.name]);
    }
  }, [location.pathname, menuItems]);

  const isParentActive = (item) =>
    item.path === activeItem ||
    (item.children || []).some((c) => c.path === activeItem);

  const toggleMenu = (name) => {
    setOpenMenus((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const handleNavigation = (item) => {
    if (item.children && item.children.length > 0) {
      toggleMenu(item.name);
      // Automatically navigate to the first child's path if it exists (except for Employee Management and Employee Salary)
      if (item.name !== "Employee Management" && item.name !== "Employee Salary" && item.children[0] && item.children[0].path) {
        if (window.innerWidth < 768) setIsOpen(false);
        navigate(item.children[0].path);
      }
    } else {
      // Don't clear openMenus here, just navigate
      if (window.innerWidth < 768) setIsOpen(false);
      navigate(item.path);
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden text-white p-2.5 rounded-lg shadow-lg transition-colors"
        style={{ background: GREEN }}
        onClick={() => setIsOpen((s) => !s)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white text-gray-800 shadow-xl flex flex-col transition-transform duration-300 z-40 border-r
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        style={{ borderColor: GREEN_BORDER, ...(isBlueTheme ? { fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" } : {}) }}
      >
        {/* ── Header ── */}
        <div
          className="px-4 pt-4 pb-8 mb-6 relative overflow-hidden group shadow-md"
          style={{
            background: "linear-gradient(135deg, rgb(58, 176, 0) 0%, rgb(45, 138, 0) 100%)",
          }}
        >
          {/* Decorative background accent */}
          <div className="absolute -right-2 -top-2 w-32 h-32 bg-white/5 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white p-2 rounded-xl shadow-xl w-full mb-6 transition-transform duration-300 group-hover:scale-[1.02]">
              <img
                src={logo}
                alt="Logo"
                className="w-full h-auto max-h-40 object-contain"
              />
            </div>

            {/* Role badge */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className={`text-[12px] text-[#2d8a00] font-black tracking-widest uppercase bg-white px-4 py-1.5 rounded-lg shadow-lg border border-white/20`}>
                  {role === "admin" || role === "superadmin"
                    ? "Admin Portal"
                    : role === "staff"
                      ? "Staff Portal"
                      : role === "employee"
                        ? "Employee Portal"
                        : role === "pharmacy"
                          ? "Pharmacy Portal"
                          : role === "doctor"
                            ? "Doctor Portal"
                            : role === "cardHolder"
                              ? "Cardholder Portal"
                              : "Applicant Portal"}
                </span>
              </div>
              {role === "employee" && employeeProfile?.designation && (
                <span className="text-[10px] text-white/90 font-bold uppercase tracking-widest bg-black/10 px-3 py-1 rounded border border-white/10 shadow-inner text-center mt-1">
                  {employeeProfile.designation}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-5 mb-2 mt-4">
          <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">
            Main Menu
          </p>
        </div>

        {/* ── Menu Items ── */}
        <div className="flex-1 overflow-y-auto px-3 custom-scrollbar-green">
          <ul className="text-sm flex flex-col space-y-1">
            {menuItems.map((item) => {
              if (item.isSeparator) {
                return (
                  <li key={item.name} className="px-2 py-4 mt-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">{item.name}</p>
                    <div className="h-px bg-gray-100 mt-2 mx-2" />
                  </li>
                );
              }

              const hasChildren = item.children && item.children.length > 0;
              const parentActive = isParentActive(item);
              const isOpenThis = openMenus.includes(item.name);
              const Icon = item.icon;
              const isLogout = item.name === "Logout";

              return (
                <li key={item.name} className="flex flex-col">
                  {/* Parent button */}
                  <button
                    onClick={() => handleNavigation(item)}
                    className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 w-full text-left"
                    style={{
                      background:
                        isOpenThis || parentActive
                          ? isLogout
                            ? "#fee2e2"
                            : GREEN
                          : "transparent",
                      color:
                        isOpenThis || parentActive
                          ? isLogout
                            ? "#dc2626"
                            : "#fff"
                          : isLogout
                            ? "#dc2626"
                            : "#374151",
                    }}
                    onMouseEnter={(e) => {
                      if (!isOpenThis && !parentActive) {
                        e.currentTarget.style.background = isLogout
                          ? "#fee2e2"
                          : GREEN_LIGHT;
                        e.currentTarget.style.color = isLogout
                          ? "#dc2626"
                          : GREEN_DARK;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isOpenThis && !parentActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = isLogout
                          ? "#dc2626"
                          : "#374151";
                      }
                    }}
                  >
                    <span className="flex items-center gap-2.5 relative">
                      <Icon
                        size={17}
                        style={{
                          color:
                            isOpenThis || parentActive
                              ? isLogout
                                ? "#dc2626"
                                : "#fff"
                              : isLogout
                                ? "#dc2626"
                                : "#6b7280",
                        }}
                      />
                      <span className="text-[13px]">{item.name}</span>
                      {item.badge && (
                        <span className="absolute -top-2 -left-2 min-w-[16px] h-4 bg-red-600 text-white text-[8px] font-black flex items-center justify-center px-1 border-2 border-white shadow-sm z-20">
                          {item.badge}
                        </span>
                      )}
                    </span>
                    {hasChildren && (
                      <ChevronDown
                        size={16}
                        className={`transform transition-transform duration-300 ${isOpenThis ? "rotate-180" : ""}`}
                      />
                    )}
                  </button>

                  {/* Submenu */}
                  {hasChildren && (
                    <div
                      className={`ml-6 mt-1 overflow-hidden transition-all duration-300 ${isOpenThis
                        ? "max-h-[1000px] opacity-100"
                        : "max-h-0 opacity-0"
                        }`}
                    >
                      <ul
                        className="flex flex-col space-y-0.5 pb-1 pl-3 border-l-2"
                        style={{ borderColor: GREEN_BORDER }}
                      >
                        {item.children.map((sub) => {
                          const subActive = activeItem === sub.path;
                          const SubIcon = sub.icon || FileText;
                          return (
                            <li key={sub.name}>
                              <button
                                onClick={() => {
                                  if (window.innerWidth < 768) setIsOpen(false);
                                  navigate(sub.path);
                                }}
                                className="flex items-center gap-2 px-3 py-2 rounded-md text-[12px] font-medium transition-all duration-200 w-full text-left"
                                style={{
                                  background: subActive
                                    ? "#dcfce7"
                                    : "transparent",
                                  color: subActive ? GREEN_DARK : "#4b5563",
                                }}
                                onMouseEnter={(e) => {
                                  if (!subActive) {
                                    e.currentTarget.style.background =
                                      GREEN_LIGHT;
                                    e.currentTarget.style.color = GREEN_DARK;
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!subActive) {
                                    e.currentTarget.style.background =
                                      "transparent";
                                    e.currentTarget.style.color = "#4b5563";
                                  }
                                }}
                              >
                                <SubIcon size={14} />
                                <span>{sub.name}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Custom scrollbar */}
      <style>{`
        .custom-scrollbar-green::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar-green::-webkit-scrollbar-thumb {
          background: #bbf7d0;
          border-radius: 10px;
        }
        .custom-scrollbar-green::-webkit-scrollbar-thumb:hover {
          background: #86efac;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
