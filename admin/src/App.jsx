import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import TopBarNotification from "./pages/TopBarComponents/TopBarNotification";
import TopBarMail from "./pages/TopBarComponents/TopBarMail";

import ApplicationForm from "./pages/ApplicationForm/ApplicationForm";
import ApplicationView from "./pages/ApplicationForm/ApplicationView";
import ApplicationEdit from "./pages/ApplicationForm/ApplicationEdit";
import JobPosting from "./pages/JobPosting/JobPosting";
import JobPostingApplicants from "./pages/JobPosting/JobPostingApplicants.jsx";
import QuestionBank from "./pages/QuestionBank/QuestionBank.jsx";
import CreatePaper from "./pages/CreatePaper/CreatePaper.jsx";
import TestResult from "./pages/TestResult/TestResult.jsx";
import Exam from "./pages/MyExam/MyExam.jsx";
import MOUForm from "./pages/MyExam/MOUForm.jsx";
import ReExam from "./pages/ReExam/ReExam.jsx";
import Unassigned from "./pages/Unassigned/Unassigned.jsx";
import ReferredCandidates from "./pages/Unassigned/ReferredCandidates.jsx";
import GlobalCandidates from "./pages/GlobalCandidates/GlobalCandidates.jsx";
import TransactionHistory from "./pages/TransactionHistory/TransactionHistory.jsx";
import MOU from "./pages/EmployeeManagement/MOU";
import MOUDetail from "./pages/EmployeeManagement/MOUDetail";
import FeeStructure from "./pages/EmployeeManagement/FeeStructure";
import ManualEmployeeList from "./pages/EmployeeManagement/ManualEmployeeList";
import EmployeeAnnouncement from "./pages/EmployeeManagement/EmployeeAnnouncement";
import PharmacyList from "./pages/Admin/PharmacyList";
import PharmacyOnboarding from "./pages/Pharmacy/PharmacyOnboarding";
import DoctorOnboarding from "./pages/DoctorDashboard/DoctorOnboarding";
import DoctorDashboard from "./pages/DoctorDashboard/DoctorDashboard";
import DoctorTokens from "./pages/DoctorDashboard/DoctorTokens";
import DoctorProfile from "./pages/DoctorDashboard/DoctorProfile";
import PharmacyDashboard from "./pages/Pharmacy/PharmacyDashboard";
import PharmacyProfile from "./pages/Pharmacy/PharmacyProfile";
import PharmacyDiscountConfig from "./pages/Admin/PharmacyDiscountConfig";
import PharmacyBillList from "./pages/Pharmacy/PharmacyBillList";
import CreatePharmacyBill from "./pages/Pharmacy/CreatePharmacyBill";
import PharmacyCategoryList from "./pages/Pharmacy/PharmacyCategoryList";
import PharmacyProductList from "./pages/Pharmacy/PharmacyProductList";
import PendingPrescriptions from "./pages/Pharmacy/PendingPrescriptions";
import WritePrescription from "./pages/DoctorDashboard/WritePrescription";
import CreatePrescription from "./pages/DoctorDashboard/CreatePrescription";
import MyPrescriptions from "./pages/CardHolder/MyPrescriptions";
import EmployeeAnnouncements from "./pages/EmployeeDashboard/EmployeeAnnouncements";
import EmployeeLeads from "./pages/EmployeeDashboard/EmployeeLeads";
import EmployeePlaceholder from "./pages/EmployeeDashboard/EmployeePlaceholder";
import Attendance from "./pages/EmployeeDashboard/Attendance";
import MainDashboard from "./pages/EmployeeDashboard/MainDashboard";
import EmployeeOnboarding from "./pages/EmployeeDashboard/EmployeeOnboarding";
import StaffOnboarding from "./pages/EmployeeDashboard/StaffOnboarding";
import StaffProfile from "./pages/EmployeeDashboard/StaffProfile";
import StaffLetters from "./pages/EmployeeDashboard/StaffLetters";
import EmployeeDoctorConsult from "./pages/EmployeeDashboard/EmployeeDoctorConsult";
import EmployeeLetters from "./pages/EmployeeDashboard/EmployeeLetters";
import EmployeeProfile from "./pages/EmployeeDashboard/EmployeeProfile";
import CardManagement from "./pages/EmployeeDashboard/CardManagement";
import AddCard from "./pages/EmployeeDashboard/AddCard";
import EditCard from "./pages/EmployeeDashboard/EditCard";
import WorkingZone from "./pages/EmployeeDashboard/WorkingZone";
import MyTeam from "./pages/EmployeeDashboard/MyTeam";
import Salary from "./pages/EmployeeDashboard/Salary";
import StaffSalary from "./pages/EmployeeDashboard/StaffSalary";
import MyCard from "./pages/CardHolder/MyCard";
import CardholderDoctorConsult from "./pages/CardHolder/CardholderDoctorConsult";
import RefundRequest from "./pages/Refund/RefundRequest";
import RefundManagement from "./pages/Refund/RefundManagement";
import EmployeeResign from "./pages/EmployeeDashboard/EmployeeResign";
import AdminResignationManagement from "./pages/Admin/AdminResignationManagement";
import EmployeeFeed from "./pages/Feed/EmployeeFeed";
import FeedManagement from "./pages/Feed/FeedManagement";
import ReviewRating from "./pages/EmployeeDashboard/ReviewRating";
import RatingManagement from "./pages/Admin/RatingManagement";
import WithdrawalRequestPage from "./pages/EmployeeDashboard/WithdrawalRequestPage";
import StaffWithdrawalRequestPage from "./pages/EmployeeDashboard/StaffWithdrawalRequestPage";
import AdminWithdrawalManagement from "./pages/Admin/AdminWithdrawalManagement";
import MeetingDashboard from "./pages/EmployeeDashboard/Meetings/MeetingDashboard";
import MeetingRoom from "./pages/EmployeeDashboard/Meetings/MeetingRoom";
import MeetingManagement from "./pages/Admin/MeetingManagement";
import TrainingManagement from "./pages/Training/TrainingManagement";
import EmployeeTraining from "./pages/Training/EmployeeTraining";
import AdminCertificateManagement from "./pages/Admin/AdminCertificateManagement";
import CustomCertificateManagement from "./pages/Admin/CustomCertificateManagement";
import RMCertificateAssignment from "./pages/Admin/RMCertificateAssignment";
import MyCertificates from "./pages/EmployeeDashboard/MyCertificates";
import AdminQA from "./pages/Admin/AdminQA";
import EmployeeQA from "./pages/EmployeeDashboard/EmployeeQA";
import EmployeeClaims from "./pages/EmployeeDashboard/EmployeeClaims";
import RMQA from "./pages/Employee/RMQA";
import TargetTracking from "./pages/EmployeeDashboard/TargetTracking";
import HireTeam from "./pages/EmployeeDashboard/HireTeam";
import LiveSupport from "./pages/Admin/LiveSupport";
import AdminLetterManagement from "./pages/Admin/AdminLetterManagement";
import AdminPolicyManagement from "./pages/Admin/AdminPolicyManagement";
import BlogManagement from "./pages/Admin/BlogManagement";
import BlogDetail from "./pages/BlogDetail";
import SupportManagement from "./pages/Admin/SupportManagement";
import PoliciesView from "./pages/PoliciesView";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import StudentRegistration from "./pages/StudentRegistration";
import AdminDashboard from "./pages/AdminDashboard";
import ApplicantDashboard from "./pages/ApplicantDashboard";
import DashboardRedirect from "./pages/DashboardRedirect";
import Settings from "./pages/Settings/Settings";
import Gallery from "./pages/Gallery/Gallery";
import Scroller from "./pages/Scroller/Scroller";
import Notifications from "./pages/Notifications/Notifications";
import Notice from "./pages/Notice/Notice.jsx";
import BlockManagement from "./pages/Admin/BlockManagement.jsx";
import PanchayatManagement from "./pages/Admin/PanchayatManagement.jsx";
import LocationManagement from "./pages/Admin/LocationManagement.jsx";
import WhatsAppTest from "./pages/Admin/WhatsAppTest.jsx";
import AdminTransactions from "./pages/Admin/AdminTransactions.jsx";
import AdminWalletManagement from "./pages/Admin/AdminWalletManagement.jsx";
import WalletTransactions from "./pages/Admin/WalletTransactions.jsx";
import AdminEmployeeList from "./pages/Admin/AdminEmployeeList.jsx";
import AdminEmployeeEdit from "./pages/Admin/AdminEmployeeEdit.jsx";
import AdminEmployeeDetail from "./pages/Admin/AdminEmployeeDetail.jsx";
import IdCardManagement from "./pages/EmployeeManagement/IdCardManagement.jsx";
import AdminStaffDetail from "./pages/Admin/AdminStaffDetail.jsx";
import AdminManagement from "./pages/Admin/AdminManagement.jsx";
import Claims from "./pages/CardHolder/Claims.jsx";
import NewClaim from "./pages/CardHolder/NewClaim.jsx";
import EditClaim from "./pages/CardHolder/EditClaim.jsx";
import BodyCalculator from "./pages/CardHolder/BodyCalculator.jsx";
import CardholderTokenGeneration from "./pages/CardHolder/CardholderTokenGeneration.jsx";
import ClaimManagement from "./pages/Admin/ClaimManagement";
import AdminCardManagement from "./pages/Admin/AdminCardManagement.jsx";
import AdminCardHolderList from "./pages/Admin/AdminCardHolderList.jsx";
import AdminAddCardHolder from "./pages/Admin/AdminAddCardHolder.jsx";
import AdminEditCardHolder from "./pages/Admin/AdminEditCardHolder.jsx";
import AdminCampManagement from "./pages/Admin/AdminCampManagement.jsx";
import CampRequest from "./pages/Camp/CampRequest.jsx";
import GoalConfiguration from "./pages/Admin/GoalConfiguration";
import SalaryManagement from "./pages/Admin/SalaryManagement";
import AdminEmployeeSalary from "./pages/Admin/AdminEmployeeSalary";
import JobRoleManagement from "./pages/Admin/JobRoleManagement";
import AdministrativeStaffManagement from "./pages/Admin/AdministrativeStaffManagement";
import LeadManagement from "./pages/Admin/LeadManagement";
import AdminZoneSelection from "./pages/Admin/AdminZoneSelection";
import AdminZoneManagement from "./pages/Admin/AdminZoneManagement";
import AdminZoneAssignment from "./pages/Admin/AdminZoneAssignment";
import EmployeeZoneSelection from "./pages/Employee/EmployeeZoneSelection";
import EmployeeZoneAssignment from "./pages/Employee/EmployeeZoneAssignment";
import AdminAttendance from "./pages/Admin/AdminAttendance";
import AdminStaffAttendance from "./pages/Admin/AdminStaffAttendance";
import VisitorManagement from "./pages/AdminDashboard/VisitorManagement";
import AdminCampReportManagement from "./pages/Admin/AdminCampReportManagement.jsx";
import EmployeeCampReport from "./pages/EmployeeDashboard/EmployeeCampReport.jsx";
import AdminTargetTracking from "./pages/Admin/AdminTargetTracking";
import AdminZonalTracking from "./pages/Admin/AdminZonalTracking";
import AdminZonalTrackingDetails from "./pages/Admin/AdminZonalTrackingDetails";
import AdminDoctorManagement from "./pages/Admin/AdminDoctorManagement";
import AdminEnquiryManagement from "./pages/Admin/AdminEnquiryManagement.jsx";
import AdminLogin from "./pages/AdminLogin";
import Logout from "./pages/Logout";


// Landing pages
import LandingDashboard from "./pages/Landing/LandingDashboard";
import JobDetail from "./pages/Landing/JobDetail";

import { AuthProvider } from "./auth/AuthProvider";
import { BroadcastProvider } from "./context/BroadcastContext";
import { RequireAuth, RequireRole } from "./auth/RequireAuth";
import { RequireOnboarding } from "./auth/RequireOnboarding";
import { RequireActiveEmployee } from "./auth/RequireActiveEmployee";
import { useParams } from "react-router-dom";

// Helper wrapper to pass ID from URL to MyCard component
const MyCardViewWrapper = () => {
  const { id } = useParams();
  return <MyCard cardId={id} />;
};

import { Toaster } from "react-hot-toast";
import CreatePasswordModal from "./components/auth/CreatePasswordModal";
import { useAuth } from "./auth/AuthProvider";

function GlobalPasswordModal() {
  const { session } = useAuth();
  const isOpen = session && session.role !== 'admin' && session.role !== 'superadmin' && session.isPasswordSet === false;
  return <CreatePasswordModal isOpen={isOpen} />;
}

function App() {
  // Log to identify frontend app
  console.log("🚀 FRONTEND App Running on Port 5173");

  return (
    <AuthProvider>
      <GlobalPasswordModal />
      <BroadcastProvider>
        <Toaster
          containerStyle={{ zIndex: 11000 }}
          toastOptions={{
            // Landing-theme look for every success toast (error toasts keep their default red)
            success: {
              iconTheme: { primary: "#4D7C0F", secondary: "#ffffff" },
              style: {
                border: "1px solid #D9F99D",
                color: "#3F6212",
                fontWeight: 600,
                fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
              },
            },
          }}
        />
        <Router>
          <Routes>
            {/* Frontend default route - Login page */}
            <Route path="/" element={<Login />} />

            {/* Landing/Public pages - accessible without authentication */}
            <Route path="/landing" element={<LandingDashboard />} />
            <Route path="/about" element={<LandingDashboard />} />
            <Route path="/membership" element={<LandingDashboard />} />
            <Route path="/services" element={<LandingDashboard />} />
            <Route path="/jobs" element={<LandingDashboard />} />
            <Route path="/notifications" element={<LandingDashboard />} />
            <Route path="/gallery" element={<LandingDashboard />} />
            <Route path="/verification" element={<LandingDashboard />} />
            <Route path="/contacts" element={<LandingDashboard />} />
            <Route path="/job-postings/view/:id" element={<JobDetail />} />

            {/* Login page - always accessible */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin-portal-login" element={<AdminLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/student-register" element={<StudentRegistration />} />

            {/* Protected app routes */}
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<DashboardRedirect />} />

              <Route element={<RequireOnboarding />}>
                <Route
                  path="/admin/dashboard"
                  element={
                    <RequireRole allow={["admin", "superadmin"]}>
                      <AdminDashboard />
                    </RequireRole>
                  }
                />
              </Route>

              {/* Chat & Live Support */}
              <Route
                path="/admin/live-support"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <LiveSupport />
                  </RequireRole>
                }
              />

              <Route
                path="/applicant/dashboard"
                element={
                  <RequireRole allow={["applicant"]}>
                    <ApplicantDashboard />
                  </RequireRole>
                }
              />
              <Route
                path="/my-exam"
                element={
                  <RequireRole allow={["applicant"]}>
                    <Exam />
                  </RequireRole>
                }
              />
              <Route path="/mou/process/:id" element={<MOUForm />} />
              <Route path="/my-card" element={<MyCard />} />
              <Route path="/body-calculator" element={<BodyCalculator />} />
              <Route path="/claims" element={<Claims />} />
              <Route path="/claims/new" element={<NewClaim />} />
              <Route path="/claims/edit/:id" element={<EditClaim />} />
              <Route path="/policies" element={<PoliciesView />} />
              <Route
                path="/cardholder/doctors"
                element={
                  <RequireRole allow={["cardHolder"]}>
                    <CardholderTokenGeneration />
                  </RequireRole>
                }
              />
              <Route
                path="/cardholder/consult"
                element={
                  <RequireRole allow={["cardHolder"]}>
                    <CardholderDoctorConsult />
                  </RequireRole>
                }
              />
              <Route
                path="/cardholder/prescriptions"
                element={
                  <RequireRole allow={["cardHolder"]}>
                    <MyPrescriptions />
                  </RequireRole>
                }
              />
              <Route
                path="/camp"
                element={
                  <RequireRole allow={["cardHolder"]}>
                    <CampRequest />
                  </RequireRole>
                }
              />
              <Route
                path="/transactions"
                element={
                  <RequireRole allow={["applicant"]}>
                    <TransactionHistory />
                  </RequireRole>
                }
              />
              {/* Pharmacy Routes */}
              <Route
                path="/pharmacy/onboarding"
                element={
                  <RequireRole allow={["pharmacy"]}>
                    <PharmacyOnboarding />
                  </RequireRole>
                }
              />
              {/* Doctor Routes */}
              <Route
                path="/doctor/onboarding"
                element={
                  <RequireRole allow={["doctor"]}>
                    <DoctorOnboarding />
                  </RequireRole>
                }
              />
              <Route
                path="/doctor/dashboard"
                element={
                  <RequireRole allow={["doctor"]}>
                    <RequireOnboarding />
                  </RequireRole>
                }
              >
                <Route index element={<DoctorDashboard />} />
                <Route path="tokens" element={<DoctorTokens />} />
                <Route path="write-prescription" element={<WritePrescription />} />
                <Route path="create-prescription" element={<CreatePrescription />} />
                <Route path="profile" element={<DoctorProfile />} />
              </Route>
              <Route
                path="/pharmacy/dashboard"
                element={
                  <RequireRole allow={["pharmacy"]}>
                    <RequireOnboarding />
                  </RequireRole>
                }
              >
                <Route index element={<PharmacyDashboard />} />
                <Route path="pending-prescriptions" element={<PendingPrescriptions />} />
                <Route path="bills" element={<PharmacyBillList />} />
                <Route path="bills/create" element={<CreatePharmacyBill />} />
                <Route path="profile" element={<PharmacyProfile />} />
                <Route path="categories" element={<PharmacyCategoryList />} />
                <Route path="products" element={<PharmacyProductList />} />
              </Route>

              {/* Employee Routes */}
              <Route
                path="/employee/onboarding"
                element={
                  <RequireRole allow={["employee"]}>
                    <EmployeeOnboarding />
                  </RequireRole>
                }
              />
              <Route
                path="/employee/profile"
                element={
                  <RequireRole allow={["employee"]}>
                    <EmployeeProfile />
                  </RequireRole>
                }
              />
              <Route
                path="/employee/qa"
                element={
                  <RequireRole allow={["employee", "staff"]}>
                    <EmployeeQA />
                  </RequireRole>
                }
              />
              <Route
                path="/employee/my-certificates"
                element={
                  <RequireRole allow={["employee", "staff"]}>
                    <MyCertificates />
                  </RequireRole>
                }
              />
              <Route
                path="/employee/doctors"
                element={
                  <RequireRole allow={["employee"]}>
                    <EmployeeDoctorConsult />
                  </RequireRole>
                }
              />
              <Route
                path="/applicant/refund"
                element={
                  <RequireRole allow={["applicant"]}>
                    <RefundRequest />
                  </RequireRole>
                }
              />

              <Route
                path="/admin/transactions"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminTransactions />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/wallet"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminWalletManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/wallet-ledger"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <WalletTransactions />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/visitors"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <VisitorManagement />
                  </RequireRole>
                }
              />
              
              {/* Camp Reports */}
              <Route
                path="/admin/camp-reports"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminCampReportManagement />
                  </RequireRole>
                }
              />
              
              {/* Enquiries / Contacts */}
              <Route
                path="/admin/enquiries"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminEnquiryManagement />
                  </RequireRole>
                }
              />
              
              {/* Doctor Management */}
              <Route
                path="/admin/doctors"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminDoctorManagement />
                  </RequireRole>
                }
              />

              {/* Shared routes (both roles can open) */}
              <Route path="/job-postings" element={<JobPosting />} />
              <Route path="/job-postings/view/:id" element={<JobDetail />} />
              <Route
                path="/job-postings/:id/applicants"
                element={<JobPostingApplicants />}
              />
              <Route path="/application-form" element={<ApplicationForm />} />
              <Route
                path="/applications/view/:id"
                element={<ApplicationView />}
              />
              <Route
                path="/applications/edit/:id"
                element={<ApplicationEdit />}
              />
              <Route path="/blog/:id" element={<BlogDetail />} />

              {/* Settings - Admin only */}
              <Route
                path="/settings"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <Settings />
                  </RequireRole>
                }
              />

              {/* Gallery - Admin only */}
              <Route
                path="/admin/gallery"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <Gallery />
                  </RequireRole>
                }
              />
              <Route
                path="/question-bank"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <QuestionBank />
                  </RequireRole>
                }
              />
              <Route
                path="/re-exam"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <ReExam />
                  </RequireRole>
                }
              />
              <Route
                path="/unassigned"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <Unassigned />
                  </RequireRole>
                }
              />
              <Route
                path="/referred-candidates"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <ReferredCandidates />
                  </RequireRole>
                }
              />
              <Route
                path="/global-candidates"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <GlobalCandidates />
                  </RequireRole>
                }
              />

              <Route
                path="/create-paper"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <CreatePaper />
                  </RequireRole>
                }
              />
              <Route
                path="/test-result"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <TestResult />
                  </RequireRole>
                }
              />

              {/* Employee Management - Admin only */}
              <Route
                path="/admin/mou"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <MOU />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/mou/detail/:id"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <MOUDetail />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/fee-structure"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <FeeStructure />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/employees"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <ManualEmployeeList />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/employee/edit/:id"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminEmployeeEdit />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/id-cards"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <IdCardManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/administrative-staff"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdministrativeStaffManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/staff-detail/:id"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminStaffDetail />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/job-roles"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <JobRoleManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/employee-list"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminEmployeeList />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/employee-detail/:id"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminEmployeeDetail />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/zone-selection"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminZoneSelection />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/zone-management"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminZoneManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/target-tracking"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminTargetTracking />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/zonal-tracking"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminZonalTracking />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/zonal-tracking/:zcId"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminZonalTrackingDetails />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/zone-assignment/:id"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminZoneAssignment />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/employee-announcements"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <EmployeeAnnouncement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/pharmacies"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <PharmacyList />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/pharmacies/discount-config"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <PharmacyDiscountConfig />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/whatsapp-test"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <WhatsAppTest />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/location-management"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <LocationManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/management"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/claims"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <ClaimManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/camp-management"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminCampManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/salary"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <SalaryManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/employee-salary"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminEmployeeSalary />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/goal-setup"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <GoalConfiguration />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/refunds"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <RefundManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/resignations"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminResignationManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/feeds"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <FeedManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/leads"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <LeadManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/reviews"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <RatingManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/attendance"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminAttendance />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/staff-attendance"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminStaffAttendance />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/cards"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminCardManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/cardholders"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminCardHolderList />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/cardholders/add"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminAddCardHolder />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/cardholders/edit/:id"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminEditCardHolder />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/withdrawals"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminWithdrawalManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/meetings"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <MeetingManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/meeting-hub"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <MeetingDashboard />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/meeting/monitor/:roomId"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <MeetingRoom isGhost={true} />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/training"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <TrainingManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/certificates"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminCertificateManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/custom-certificates"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <CustomCertificateManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/rm-certificates"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <RMCertificateAssignment />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/qa"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminQA />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/letters"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminLetterManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/policies"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <AdminPolicyManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/blogs"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <BlogManagement />
                  </RequireRole>
                }
              />
              <Route
                path="/admin/support"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <SupportManagement />
                  </RequireRole>
                }
              />
              {/* Scroller - Admin only */}
              <Route
                path="/scroller"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <Scroller />
                  </RequireRole>
                }
              />

              {/* Notifications - Admin only */}
              <Route
                path="/notifications-manage"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <Notifications />
                  </RequireRole>
                }
              />
              <Route
                path="/notice"
                element={
                  <RequireRole allow={["admin", "superadmin", "staff"]}>
                    <Notice />
                  </RequireRole>
                }
              />

              {/* Top bar demo pages */}
              <Route
                path="/notifications-demo"
                element={<TopBarNotification />}
              />
              <Route path="/mail" element={<TopBarMail />} />

              {/* Meeting Room — staff */}
              <Route element={<RequireRole allow={["staff"]} />}>
                <Route element={<RequireOnboarding />}>
                  <Route path="/meeting/:roomId" element={<MeetingRoom />} />
                </Route>
              </Route>

              {/* Employee Routes */}
              <Route element={<RequireRole allow={["employee"]} />}>
                <Route element={<RequireOnboarding />}>
                  <Route path="/employee/profile" element={<EmployeeProfile />} />
                  <Route element={<RequireActiveEmployee />}>
                    <Route path="/employee/onboarding" element={<EmployeeOnboarding />} />
                    <Route path="/employee/dashboard" element={<MainDashboard />} />
                    <Route path="/employee/feed" element={<EmployeeFeed />} />
                    <Route path="/employee/cards" element={<CardManagement />} />
                    <Route path="/employee/cards/add" element={<AddCard />} />
                    <Route path="/employee/cards/edit/:id" element={<EditCard />} />
                    <Route path="/employee/cards/view/:id" element={<MyCardViewWrapper />} />
                    <Route path="/employee/leads" element={<EmployeeLeads />} />
                    <Route path="/employee/target-tracking" element={<TargetTracking />} />
                    <Route path="/employee/zone-selection" element={<EmployeeZoneSelection />} />
                    <Route path="/employee/zone-assignment/:id" element={<EmployeeZoneAssignment />} />
                    <Route path="/employee/my-team" element={<MyTeam />} />
                    <Route path="/employee/hire-team" element={<HireTeam />} />
                    <Route path="/employee/letters" element={<EmployeeLetters />} />
                    <Route path="/employee/policies" element={<PoliciesView />} />
                    <Route path="/employee/working-zone" element={<WorkingZone />} />
                    <Route path="/employee/reviews" element={<ReviewRating />} />
                    <Route path="/employee/meetings" element={<MeetingDashboard />} />
                    <Route path="/employee/claims" element={<EmployeeClaims />} />
                    <Route path="/employee/announcements" element={<EmployeeAnnouncements />} />
                    <Route path="/employee/refund" element={<RefundRequest />} />
                    <Route path="/employee/resign" element={<EmployeeResign />} />
                    <Route path="/employee/camp" element={<CampRequest />} />
                    <Route path="/employee/salary" element={<Salary />} />
                    <Route path="/employee/withdraw" element={<WithdrawalRequestPage />} />
                    <Route path="/employee/training" element={<EmployeeTraining />} />
                    <Route path="/employee/hire-team" element={<EmployeePlaceholder title="Hire Team" />} />
                    <Route path="/employee/attendance" element={<Attendance />} />
                    <Route path="/employee/support" element={<EmployeeQA />} />
                    <Route path="/employee/qa" element={<RMQA />} />
                    <Route path="/employee/camp-report" element={<EmployeeCampReport />} />
                    <Route path="/meeting/:roomId" element={<MeetingRoom />} />
                  </Route>
                </Route>
              </Route>

              {/* Staff Activation Route */}
              <Route element={<RequireRole allow={["staff"]} />}>
                <Route element={<RequireOnboarding />}>
                  <Route path="/staff/onboarding" element={<StaffOnboarding />} />
                  <Route path="/staff/profile" element={<StaffProfile />} />
                  <Route path="/staff/letters" element={<StaffLetters />} />
                  <Route path="/staff/salary" element={<StaffSalary />} />
                  <Route path="/staff/salary/withdraw" element={<StaffWithdrawalRequestPage />} />
                  <Route path="/staff/meetings" element={<MeetingDashboard />} />
                  <Route path="/staff/my-team" element={<MyTeam />} />
                  <Route path="/staff/attendance" element={<Attendance />} />
                </Route>
              </Route>

              <Route path="/logout" element={<Logout />} />
            </Route>

            {/* Catch-all: redirect unknown routes to login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </BroadcastProvider>
    </AuthProvider>
  );
}

export default App;
