import {
  LayoutDashboard,
  FileText,
  Users,
  ImageIcon,
  Settings,
  LogOut,
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
  HelpCircle,
  MessageSquare,
  Lock,
  Wallet,
  Award,
  Stethoscope
} from "lucide-react";

export const SIDEBAR_GROUPS = {
  "Exam Management": { icon: BookOpen },
  "Employee Management": { icon: UserCog },
  "Lead Management": { icon: Users },
  "Certificate Management": { icon: Award },
  "Pharmacy Management": { icon: Stethoscope }
};

export const SYSTEM_MODULES = [
  { id: "dashboard", label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { id: "jobPostings", label: "Job Postings", path: "/job-postings", icon: Users },
  { id: "applications", label: "Application Form", path: "/application-form", icon: FileText },

  // Media & Content
  { id: "gallery", label: "Gallery", path: "/admin/gallery", icon: ImageIcon },
  { id: "scroller", label: "Scroller", path: "/scroller", icon: Film },
  { id: "notifications", label: "Notifications", path: "/notifications-manage", icon: Bell },
  { id: "notices", label: "Notices", path: "/notice", icon: Bell },
  { id: "blogManagement", label: "Blog Management", path: "/admin/blogs", icon: FileText },
  { id: "feedManagement", label: "Feed Management", path: "/admin/feeds", icon: ScrollText },

  // Exam Management
  { id: "questionBank", label: "Question Bank", path: "/question-bank", icon: HelpCircle, sidebarGroup: "Exam Management" },
  { id: "createPaper", label: "Exam Event / Create Paper", path: "/create-paper", icon: FileText, sidebarGroup: "Exam Management" },
  { id: "testResults", label: "Exam Results", path: "/test-result", icon: Bell, sidebarGroup: "Exam Management" },
  { id: "reExam", label: "Re-Exam", path: "/re-exam", icon: FileText, sidebarGroup: "Exam Management" },
  { id: "unassigned", label: "Unassigned Management", path: "/unassigned", icon: HelpCircle, sidebarGroup: "Exam Management" },
  { id: "unassigned_referred", permId: "unassigned", label: "Referred Candidates", path: "/referred-candidates", icon: FileText, sidebarGroup: "Exam Management", hideInPermissions: true },
  { id: "globalCandidates", permId: "unassigned", label: "Global Candidates", path: "/global-candidates", icon: Users, sidebarGroup: "Exam Management", hideInPermissions: true },
  { id: "whatsappTest", label: "WhatsApp Test", path: "/admin/whatsapp-test", icon: Send, sidebarGroup: "Exam Management" },

  // Employee Management
  { id: "employees", label: "Employee List", path: "/admin/employee-list", icon: Users, sidebarGroup: "Employee Management" },
  { id: "employees_add", permId: "employees", label: "Add Employee", path: "/admin/employees", icon: UserPlus, sidebarGroup: "Employee Management", hideInPermissions: true },
  { id: "employees_att", permId: "employees", label: "Employee Attendance", path: "/admin/attendance", icon: Calendar, sidebarGroup: "Employee Management", hideInPermissions: true },
  { id: "employees_res", permId: "employees", label: "Resignation Requests", path: "/admin/resignations", icon: LogOut, sidebarGroup: "Employee Management", hideInPermissions: true },
  { id: "idCardManagement", label: "ID Card Management", path: "/admin/id-cards", icon: CreditCard, sidebarGroup: "Employee Management" },
  { id: "cardHolderManagement", label: "CardHolder Management", path: "/admin/cardholders", icon: CreditCard },
  { id: "doctorManagement", label: "Doctor Management", path: "/admin/doctors", icon: Stethoscope },
  { id: "targetTracking", label: "Target Tracking", path: "/admin/target-tracking", icon: Target, sidebarGroup: "Employee Management" },
  { id: "zonalTracking", label: "Zonal Tracking", path: "/admin/zonal-tracking", icon: MapPin, sidebarGroup: "Employee Management" },
  { id: "administrativeStaff", label: "Administrative Staff", path: "/admin/administrative-staff", icon: UserPlus, sidebarGroup: "Employee Management" },
  { id: "adminStaff_att", permId: "administrativeStaff", label: "Staff Attendance", path: "/admin/staff-attendance", icon: Calendar, sidebarGroup: "Employee Management", hideInPermissions: true },
  { id: "jobRoles", label: "Job Roles Management", path: "/admin/job-roles", icon: Shield, sidebarGroup: "Employee Management" },
  { id: "employeeAnnouncements", label: "Employee Announcements", path: "/admin/employee-announcements", icon: Bell, sidebarGroup: "Employee Management" },
  { id: "zoneManagement_sel", permId: "zoneManagement", label: "Zone Selection", path: "/admin/zone-selection", icon: Lock, sidebarGroup: "Employee Management", hideInPermissions: true },
  { id: "zoneManagement", label: "Zone Management", path: "/admin/zone-management", icon: Lock, sidebarGroup: "Employee Management" },
  { id: "reviews", label: "Rating Management", path: "/admin/reviews", icon: Star, sidebarGroup: "Employee Management" },

  // Lead Management Group
  { id: "leads", label: "Lead Management", path: "/admin/leads", icon: Users, hideInPermissions: false, alwaysVisible: false }, // For permissions only
  { id: "leads_list", permId: "leads", label: "Lead List", path: "/admin/leads", icon: FileText, sidebarGroup: "Lead Management", hideInPermissions: true },
  { id: "leads_arc", permId: "leads", label: "Archived Wall", path: "/admin/leads?view=archived", icon: Archive, sidebarGroup: "Lead Management", hideInPermissions: true },

  // Pharmacy Management Group
  { id: "pharmacyManagement", label: "Pharmacy Management", path: "/admin/pharmacies", icon: Stethoscope, hideInPermissions: false, alwaysVisible: false },
  { id: "pharmacy_list", permId: "pharmacyManagement", label: "Pharmacy List", path: "/admin/pharmacies", icon: FileText, sidebarGroup: "Pharmacy Management", hideInPermissions: true },

  // Certificate Management Group
  { id: "certificateManagement", label: "Certificate Management", path: "/admin/certificates", icon: Award, hideInPermissions: false, alwaysVisible: false },
  { id: "certificate_list", permId: "certificateManagement", label: "Certificate List", path: "/admin/certificates", icon: Award, sidebarGroup: "Certificate Management", hideInPermissions: true },
  { id: "certificate_assign", permId: "certificateManagement", label: "RM Certificate Assignment", path: "/admin/rm-certificates", icon: Award, sidebarGroup: "Certificate Management", hideInPermissions: true },
  { id: "custom_certificates", permId: "certificateManagement", label: "Custom Certificates", path: "/admin/custom-certificates", icon: Award, sidebarGroup: "Certificate Management", hideInPermissions: true },


  // Legal & Financial
  { id: "mou", label: "MOU Management", path: "/admin/mou", icon: FileText },
  { id: "feeStructure", label: "Fee Structure", path: "/admin/fee-structure", icon: Wallet },
  { id: "wallet", label: "Wallet Management", path: "/admin/wallet", icon: Wallet },
  { id: "wallet_ledger", permId: "wallet", label: "Wallet Ledger", path: "/admin/wallet-ledger", icon: ScrollText, hideInPermissions: true },
  { id: "wallet_cards", permId: "wallet", label: "Card Management", path: "/admin/cards", icon: CreditCard, hideInPermissions: true },
  { id: "salaryManagement", label: "Salary Management", path: "/admin/salary", icon: CreditCard },
  { id: "transactions", label: "Transactions", path: "/admin/transactions", icon: CreditCard },
  { id: "claims", label: "Claim Requests", path: "/admin/claims", icon: Shield },
  { id: "withdrawals", label: "Withdrawal Requests", path: "/admin/withdrawals", icon: Landmark },
  { id: "refunds", label: "Refund Management", path: "/admin/refunds", icon: Shield },
  { id: "settings", label: "Payment Settings", path: "/settings", icon: Settings },

  // System & Support
  { id: "liveSupport", label: "Chat & Live Support", path: "/admin/live-support", icon: HelpCircle },
  { id: "qaManagement", label: "Q&A Management", path: "/admin/qa", icon: MessageSquare },
  { id: "visitorManagement", label: "Visitor Management", path: "/admin/visitors", icon: UserCog },
  { id: "letterManagement", label: "Letter Management", path: "/admin/letters", icon: FileText },
  { id: "supportManagement", label: "Support Management", path: "/admin/support", icon: HelpCircle },
  { id: "policies", label: "Policy Management", path: "/admin/policies", icon: FileText },
  { id: "enquiries", label: "Enquiry Management", path: "/admin/enquiries", icon: MessageSquare },

  // System
  { id: "goalConfiguration", label: "Goal Configuration", path: "/admin/goal-setup", icon: Target },
  { id: "locationManagement", label: "Location Management", path: "/admin/location-management", icon: MapPin },

  // Always Visible Items (Not tied to roles in JobRoleManagement)
  { id: "campManagement", label: "Camp Management", path: "/admin/camp-management", icon: MapPin, alwaysVisible: true },
  { id: "meetings", label: "Meetings", path: "/staff/meetings", icon: Video, alwaysVisible: true, hasBadge: true },
  { id: "training", label: "Training", path: "/admin/training", icon: BookOpen, alwaysVisible: true },
  { id: "letters_staff", label: "Letters", path: "/staff/letters", icon: ScrollText, alwaysVisible: true },
  // { id: "my_certificates_staff", label: "My Certificates", path: "/employee/my-certificates", icon: Award, alwaysVisible: true },
  { id: "attendance_staff", label: "Attendance", path: "/staff/attendance", icon: Calendar, alwaysVisible: true },
  { id: "salary_staff", label: "Staff Salary", path: "/staff/salary", icon: CreditCard, alwaysVisible: true },
  { id: "profile_staff", label: "My Profile", path: "/staff/profile", icon: UserCog, alwaysVisible: true },
  { id: "logout_staff", label: "Logout", path: "/logout", icon: LogOut, alwaysVisible: true },
];

export const getPermissionsList = () => {
  return SYSTEM_MODULES.filter(m => !m.alwaysVisible && !m.hideInPermissions).map(m => ({
    id: m.id,
    label: m.label,
    icon: m.icon
  }));
};
