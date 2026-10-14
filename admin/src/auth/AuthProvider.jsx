import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearSession, getSession, setSession } from "./auth";
import { api } from "../utils/api";

const AuthContext = createContext(null);

const GREEN = "#3AB000";
const GREEN_DARK = "#2d8a00";

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(() => getSession());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const onChange = () => setSessionState(getSession());
    window.addEventListener("storage", onChange);
    window.addEventListener("jssa_auth_changed", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("jssa_auth_changed", onChange);
    };
  }, []);

   // Check for role mismatch (e.g., upgraded on another system)
  useEffect(() => {
    let lastChecked = 0;
    const checkRoleSync = async () => {
      if (!session || !session.token || session.role !== "applicant") return;
      
      // Throttle sync checks to once per minute to avoid loops
      const now = Date.now();
      if (now - lastChecked < 60000) return;
      lastChecked = now;

      try {
        const res = await api.auth.getMe();
        if (res.success && res.data.user.role === "employee") {
          setShowUpgradeModal(true);
        }
      } catch (err) {
        console.error("Role sync check failed:", err);
      }
    };

    // Check on mount and window focus
    checkRoleSync();
    window.addEventListener("focus", checkRoleSync);
    
    // Active session polling (Increased to 30s to reduce noise)
    const pollInterval = setInterval(async () => {
      if (session && session.token) {
        try {
          await api.auth.getMe();
        } catch (err) {
          // Handled by interceptor
        }
      }
    }, 30000); 

    return () => {
      window.removeEventListener("focus", checkRoleSync);
      clearInterval(pollInterval);
    };
  }, [session]);

  const [isZoneLocked, setIsZoneLocked] = useState(true);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfileStatus = async () => {
    if (!session) {
      setEmployeeProfile(null);
      setIsZoneLocked(true);
      return;
    }

    if (session.role === "employee") {
      try {
        const { employeesAPI } = await import("../utils/api");
        const res = await employeesAPI.getProfile();
        if (res.success) {
          setIsZoneLocked(res.data.isZoneLocked);
          setEmployeeProfile(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch employee profile status:", err);
      }
    } else if (session.role === "staff") {
      try {
        const { apiRequest } = await import("../utils/api");
        const res = await apiRequest("/administrative-staff/me", { method: "GET" });
        if (res.success) {
          setEmployeeProfile(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch staff profile status:", err);
      }
    } else if (session.role === "pharmacy") {
      try {
        const { pharmaciesAPI } = await import("../utils/api");
        const res = await pharmaciesAPI.getProfile();
        if (res.success && res.pharmacy) {
          setEmployeeProfile(res.pharmacy);
        }
      } catch (err) {
        console.error("Failed to fetch pharmacy profile status:", err);
      }
    } else {
      setEmployeeProfile(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!session) {
        setEmployeeProfile(null);
        setIsZoneLocked(true);
        setProfileLoading(false);
        return;
      }

      // Clear stale profile from previous login before fetching fresh status
      setEmployeeProfile(null);
      setProfileLoading(true);

      await fetchProfileStatus();

      if (!cancelled) {
        setProfileLoading(false);
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const value = useMemo(() => {
    return {
      session,
      isAuthenticated: Boolean(session && session.token),
      role: session?.role,
      identifier: session?.identifier,
      token: session?.token,
      isZoneLocked,
      employeeProfile,
      profileLoading,
      refreshProfile: async () => {
        setProfileLoading(true);
        setEmployeeProfile(null);
        await fetchProfileStatus();
        setProfileLoading(false);
      },
      login: ({ identifier, email, phone, role, token, isPasswordSet }) => setSession({ identifier, email, phone, role, token, isPasswordSet }),
      logout: () => {
        setEmployeeProfile(null);
        setProfileLoading(false);
        clearSession();
      },
    };
  }, [session, isZoneLocked, employeeProfile, profileLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Role Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center transform transition-all animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎉</span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Congratulations! Account Upgraded
            </h2>
            <p className="text-sm text-gray-500 mb-1">
              (बधाई हो! आपका अकाउंट अपडेट हो गया है)
            </p>
            
            <div className="bg-green-50 rounded-xl p-4 my-6 border border-green-100">
              <p className="text-gray-700 leading-relaxed font-medium">
                Your role has been upgraded to <span className="text-green-600 font-bold uppercase">Employee</span>. 
                Please logout and login again to access your new dashboard.
              </p>
            </div>
            
            <button
              onClick={() => {
                clearSession();
                setShowUpgradeModal(false);
              }}
              className="w-full py-4 bg-[#3AB000] text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-[#2d8a00] transition-all transform active:scale-95"
            >
              LOGOUT & RELOGIN
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
