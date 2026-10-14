import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { roleHomePath } from "../auth/auth";
import { employeesAPI, administrativeStaffAPI, pharmaciesAPI, doctorsAPI } from "../utils/api";

export default function DashboardRedirect() {
  const { role, employeeProfile } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!role || (role !== "employee" && role !== "staff" && role !== "pharmacy" && role !== "doctor")) {
        setIsLoading(false);
        return;
      }

      try {
        const api = role === "employee" ? employeesAPI : role === "pharmacy" ? pharmaciesAPI : role === "doctor" ? doctorsAPI : administrativeStaffAPI;
        const res = await api.getOnboardingStatus();
        if (res.success) {
          setOnboardingComplete(res.onboardingComplete);
        } else {
          // Fallback to true if API fails to avoid blocking users unnecessarily
          setOnboardingComplete(true);
        }
      } catch (err) {
        setOnboardingComplete(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboarding();
  }, [role]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3AB000]"></div>
      </div>
    );
  }

  if ((role === "employee" || role === "staff" || role === "pharmacy" || role === "doctor") && onboardingComplete === false) {
    const onboardingPath = role === "staff" ? "/staff/onboarding" : role === "pharmacy" ? "/pharmacy/onboarding" : role === "doctor" ? "/doctor/onboarding" : "/employee/onboarding";
    return <Navigate to={onboardingPath} replace />;
  }

  return <Navigate to={roleHomePath(role, employeeProfile?.status)} replace />;
}

