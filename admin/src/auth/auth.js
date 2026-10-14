const AUTH_STORAGE_KEY = "jssa_auth";

/**
 * @typedef {"admin" | "applicant" | "employee" | "cardHolder" | "staff" | "pharmacy" | "doctor"} Role
 * @typedef {{ identifier: string, email?: string, phone?: string, role: Role, token: string, isPasswordSet?: boolean, loginAt: number }} AuthSession
 */

/**
 * @returns {AuthSession | null}
 */
export function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    
    // Force logout old sessions that don't have the new isPasswordSet property
    if (parsed.role !== "admin" && parsed.role !== "superadmin" && typeof parsed.isPasswordSet === "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    if (
      !parsed ||
      (parsed.role !== "admin" && parsed.role !== "applicant" && parsed.role !== "employee" && parsed.role !== "cardHolder" && parsed.role !== "staff" && parsed.role !== "pharmacy" && parsed.role !== "doctor") ||
      typeof parsed.identifier !== "string" ||
      !parsed.token
    ) {
      return null;
    }
    return /** @type {AuthSession} */ (parsed);
  } catch {
    return null;
  }
}

/**
 * @param {{ identifier: string, role: Role, token: string }} session
 */
export function setSession(session) {
  const payload = {
    identifier: session.identifier,
    email: session.email,
    phone: session.phone,
    role: session.role,
    token: session.token,
    isPasswordSet: session.isPasswordSet,
    loginAt: Date.now(),
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event("jssa_auth_changed"));
}

export function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event("jssa_auth_changed"));
}

/**
 * @param {Role | undefined} role
 */
export function roleHomePath(role, employeeStatus) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "applicant") return "/applicant/dashboard";
  if (role === "employee") {
    if (employeeStatus === "Resigned") return "/employee/profile";
    return "/employee/dashboard";
  }
  if (role === "cardHolder") return "/my-card";
  if (role === "staff") return "/staff/profile";
  if (role === "pharmacy") return "/pharmacy/dashboard";
  if (role === "doctor") return "/doctor/dashboard";
  return "/";
}
