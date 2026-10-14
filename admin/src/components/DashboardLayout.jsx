import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import FloatingBroadcastManager from "./FloatingBroadcastManager";
import AnnouncementBanner from "./AnnouncementBanner";
import RefundTerminationModal from "./RefundTerminationModal";
import MeetingInviteOverlay from "./MeetingInviteOverlay";
import StateSupportButton from "./StateSupportButton";
import AttendanceCheckInModal from "./AttendanceCheckInModal";
import { EmployeeAccountStatusBlocker } from "../pages/Admin/AdminEmployeeList";
import { StaffAccountStatusBlocker } from "../pages/Admin/AdministrativeStaffManagement";
import { PharmacyAccountStatusBlocker } from "../pages/Admin/PharmacyList";
import DoctorAssignmentOverlay from "./DoctorAssignmentOverlay";
import WhatsAppChannelFloatingIcon from "./WhatsAppChannelFloatingIcon";
import { useAdminBodyTheme } from "./AdminBlueTheme";

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Admin & superadmin get the landing-site theme on every admin route (UI only)
  const adminTheme = useAdminBodyTheme();

  return (
    <div>
      {/* Header */}
      <Header />

      {/* Announcement Banner for Employees */}
      <AnnouncementBanner />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Inactive / terminated employee — logout only */}
      <EmployeeAccountStatusBlocker />
      {/* Inactive / terminated administrative staff — logout only */}
      <StaffAccountStatusBlocker />
      {/* Inactive / terminated pharmacy — logout only */}
      <PharmacyAccountStatusBlocker />
      {/* Daily check-in guard for employees & administrative staff */}
      <AttendanceCheckInModal />

      {/* Main Content */}
      <main
        className={`mt-12 p-4 bg-white min-h-screen transition-all duration-300 ${adminTheme ? "adm-main" : ""}
        ${sidebarOpen ? "ml-56" : "ml-0"} 
        md:ml-56`}
      >
        {children}
      </main>

      {/* Global Broadcast Status Manager */}
      <FloatingBroadcastManager />

      {/* State Support Button for Employees */}
      <StateSupportButton />

      {/* Global Refund Termination Check */}
      <RefundTerminationModal />

      {/* Global Meeting Invite Floating Card */}
      <MeetingInviteOverlay />

      {/* Global Doctor Assignment Floating Card */}
      <DoctorAssignmentOverlay />

      {/* WhatsApp Channel Floating Icon */}
      <WhatsAppChannelFloatingIcon />
    </div>
  );
};

export default DashboardLayout;
