import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { employeesAPI, administrativeStaffAPI, pharmaciesAPI, doctorsAPI } from "../utils/api";

/**
 * RequireOnboarding
 * Protects employee and staff dashboard routes. 
 * Redirects to onboarding if not complete.
 */
export const RequireOnboarding = () => {
  const { role, employeeProfile } = useAuth();
  const location = useLocation();
  const [onboardingComplete, setOnboardingComplete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      // If role is not employee, staff, pharmacy, or doctor, we don't need onboarding check
      if (!role || (role !== "employee" && role !== "staff" && role !== "pharmacy" && role !== "doctor")) {
        setIsLoading(false);
        return;
      }

      try {
        console.log(`[OnboardingGuard] Checking status for role: ${role}`);
        let res;
        if (role === "doctor") {
          res = await doctorsAPI.getProfile();
        } else {
          const api = role === "employee" ? employeesAPI : role === "pharmacy" ? pharmaciesAPI : administrativeStaffAPI;
          res = await api.getOnboardingStatus();
        }
        
        if (res.success) {
          let isComplete;
          if (role === "pharmacy") isComplete = res.pharmacy?.onboardingComplete;
          else if (role === "doctor") isComplete = res.doctor?.onboardingComplete;
          else isComplete = res.onboardingComplete;
          
          const finalStatus = isComplete === true;
          console.log(`[OnboardingGuard] Status received:`, finalStatus);
          setOnboardingComplete(finalStatus);
        } else {
          console.warn("[OnboardingGuard] API failed, defaulting to complete");
          setOnboardingComplete(true);
        }
      } catch (err) {
        console.error("[OnboardingGuard] Error checking onboarding:", err);
        setOnboardingComplete(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboarding();
  }, [role, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3AB000]"></div>
      </div>
    );
  }

  // 1. If not complete -> Redirect to Onboarding (Except if already on onboarding page)
  const onboardingPath = role === "staff" ? "/staff/onboarding" : role === "pharmacy" ? "/pharmacy/onboarding" : role === "doctor" ? "/doctor/onboarding" : "/employee/onboarding";
  if ((role === "employee" || role === "staff" || role === "pharmacy" || role === "doctor") && onboardingComplete === false && location.pathname !== onboardingPath) {
    return <Navigate to={onboardingPath} replace />;
  }

  // 2. If complete but on Onboarding page -> Redirect Home
  if ((role === "employee" || role === "staff" || role === "pharmacy" || role === "doctor") && onboardingComplete === true && location.pathname === onboardingPath) {
    const home =
      role === "employee"
        ? (employeeProfile?.status === "Resigned" ? "/employee/profile" : "/employee/dashboard")
        : role === "pharmacy"
        ? "/pharmacy/dashboard"
        : role === "doctor"
        ? "/doctor/dashboard"
        : "/staff/profile";
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
};
