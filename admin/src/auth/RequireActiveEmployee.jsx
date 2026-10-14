import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

const ALLOWED_WHEN_RESIGNED = ["/employee/profile"];

/**
 * Resigned employees may only access profile (and logout at app level).
 */
export function RequireActiveEmployee() {
  const { employeeProfile, profileLoading, role } = useAuth();
  const location = useLocation();

  if (role !== "employee") return <Outlet />;

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3AB000]"></div>
      </div>
    );
  }

  const status = employeeProfile?.status;
  if (status === "Resigned") {
    const allowed = ALLOWED_WHEN_RESIGNED.some((p) => location.pathname.startsWith(p));
    if (!allowed) {
      return <Navigate to="/employee/profile" replace />;
    }
  }

  return <Outlet />;
}
