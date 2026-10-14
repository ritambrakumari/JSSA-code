import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { roleHomePath } from "./auth";

export function RequireAuth() {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  // If authenticated but role missing (shouldn't happen), send to login.
  if (!role) return <Navigate to="/" replace />;

  return <Outlet />;
}

/**
 * @param {{ allow: Array<"admin" | "applicant" | "employee">, children?: React.ReactNode }} props
 */
export function RequireRole({ allow, children }) {
  const { role, employeeProfile } = useAuth();
  const location = useLocation();

  if (!role) return <Navigate to="/" replace />;
  if (!allow.includes(role)) {
    return (
      <Navigate
        to={roleHomePath(role, employeeProfile?.status)}
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  
  // Return children if provided, otherwise return Outlet for layout routes
  return children ? children : <Outlet />;
}

