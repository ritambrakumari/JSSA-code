// Prefer explicit env vars, but safely fall back to Vite proxy (/api). Trigger reload.
const RAW_API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "/api";

const API_BASE_URL = (() => {
  const base = String(RAW_API_BASE_URL || "").trim().replace(/\/+$/, "");
  if (!base) return "/api";

  // If absolute URL is provided without /api suffix, append it to match backend routes.
  if (/^https?:\/\//i.test(base) && !/\/api$/i.test(base)) {
    return `${base}/api`;
  }

  return base;
})();

/**
 * Get auth token from localStorage
 */
function getToken() {
  const session = localStorage.getItem("jssa_auth");
  if (!session) return null;
  try {
    const parsed = JSON.parse(session);
    return parsed.token || null;
  } catch {
    return null;
  }
}

/**
 * Make API request with authentication
 */
export async function apiRequest(endpoint, options = {}) {
  // Use explicit token from options or fall back to localStorage
  const token = options.token || getToken();
  const url = `${API_BASE_URL}${endpoint}`;

  // Clean the options object so we don't pass the custom token to fetch
  const { token: _, ...fetchOptions } = options;

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions.headers,
  };

  // Only add Content-Type: application/json if it's not FormData
  if (!(fetchOptions.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const config = {
    ...fetchOptions,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Check if response is JSON
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || "Server returned non-JSON response");
    }

    if (!response.ok) {
      // 🛡️ Global Auth Interceptor: Handle session termination
      if (response.status === 401) {
        console.warn("[AUTH] Session terminated or invalid. Logging out...");
        localStorage.removeItem("jssa_auth");
        const publicPaths = ["/", "/login", "/admin-portal-login"];
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.href = "/login";
        }
      }

      // Improve error message handling for objects
      let errorMessage = "Request failed";
      if (data) {
        if (typeof data.message === 'object') {
          errorMessage = JSON.stringify(data.message);
        } else {
          errorMessage = data.message || data.error || `Request failed with status ${response.status}`;
        }
      }
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    // UI-only: replace raw database / network errors (e.g. "getaddrinfo ENOTFOUND ...mongodb.net")
    // with a friendly message. Request logic is unchanged.
    if (/ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|getaddrinfo|MongoNetworkError|MongoServerSelectionError|buffering timed out|Server selection timed out/i.test(error?.message || "")) {
      console.error("API connection error:", error.message);
      error.message = "Connection interrupted. Please check your internet connection and try again in a moment.";
    }

    // Only log non-network errors (network errors are expected in some cases)
    if (error.message !== "Failed to fetch" && error.name !== "TypeError") {
      console.error("API Error:", error);
    }

    // Provide more helpful error messages
    if (error.message === "Failed to fetch" || error.name === "TypeError") {
      // Return error structure instead of throwing for better error handling
      return {
        success: false,
        data: null,
        error: `Cannot connect to backend server. Please ensure:
1. Backend server is running (npm run dev:backend)
2. Backend is accessible at ${API_BASE_URL}
3. Check CORS settings in backend`
      };
    }

    // For other errors, return error structure instead of throwing
    return {
      success: false,
      data: null,
      error: error.message || "Unknown error"
    };
  }
}

/**
 * Auth API
 */
export const authAPI = {
  register: async (userData) => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  login: async (identifier, password, role) => {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password, role }),
    });
  },
  nimbusLoginRequest: async (phone, role) => {
    return apiRequest("/auth/nimbus-login-request", {
      method: "POST",
      body: JSON.stringify({ phone, role }),
    });
  },
  nimbusLoginVerify: async (phone, otp, role) => {
    return apiRequest("/auth/nimbus-login-verify", {
      method: "POST",
      body: JSON.stringify({ phone, otp, role }),
    });
  },
  forgotPasswordPhone: async (phone) => {
    return apiRequest("/auth/forgot-password-phone", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },
  resetPasswordPhone: async (phone, otp, newPassword) => {
    return apiRequest("/auth/reset-password-phone", {
      method: "POST",
      body: JSON.stringify({ phone, otp, newPassword }),
    });
  },
  setPasswordOtp: async () => {
    return apiRequest("/auth/set-password-otp", {
      method: "POST",
    });
  },
  setPassword: async (otp, newPassword) => {
    return apiRequest("/auth/set-password", {
      method: "POST",
      body: JSON.stringify({ otp, newPassword }),
    });
  },
  forgotPassword: async (email) => {
    return apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  verifyOTP: async (email, otp) => {
    return apiRequest("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  },

  resetPassword: async (email, otp, newPassword) => {
    return apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },

  getMe: async () => {
    return apiRequest("/auth/me", { method: "GET" });
  },

  logoutAllAdmins: async () => {
    return apiRequest("/auth/admin/logout-all", { method: "POST" });
  },
};

/**
 * Profile API (New Feature)
 */
export const profileAPI = {
  checkAvailability: async (email, phone) => {
    return apiRequest("/profile/check-availability", {
      method: "POST",
      body: JSON.stringify({ email, phone }),
    });
  },

  editEmployeeProfile: async (formData) => {
    const token = getToken();
    const url = `${API_BASE_URL}/profile/employee/edit`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || "Server returned non-JSON response");
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
    }

    return data;
  },

  editStaffProfile: async (formData) => {
    const token = getToken();
    const url = `${API_BASE_URL}/profile/staff/edit`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || "Server returned non-JSON response");
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
    }

    return data;
  },
};

/**
 * Claims API
 */
export const claimsAPI = {
  submit: async (formData) => {
    const token = getToken();
    const url = `${API_BASE_URL}/claims/submit`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || "Server returned non-JSON response");
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
    }

    return data;
  },

  reApply: async (id, formData) => {
    const token = getToken();
    const url = `${API_BASE_URL}/claims/re-apply/${id}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || "Server returned non-JSON response");
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
    }

    return data;
  },

  getMyClaims: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit !== undefined) queryParams.append("limit", params.limit);
    if (params.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const url = `/claims/my-claims${queryString ? `?${queryString}` : ""}`;
    return apiRequest(url, { method: "GET" });
  },

  getById: async (id) => {
    return apiRequest(`/claims/${id}`, { method: "GET" });
  },

  getAllClaims: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit !== undefined) queryParams.append("limit", params.limit);
    if (params.search) queryParams.append("search", params.search);
    if (params.filter) queryParams.append("filter", params.filter);
    if (params.state) queryParams.append("state", params.state);
    if (params.district) queryParams.append("district", params.district);
    if (params.block) queryParams.append("block", params.block);
    if (params.panchayat) queryParams.append("panchayat", params.panchayat);

    const queryString = queryParams.toString();
    const url = `/claims/all${queryString ? `?${queryString}` : ""}`;
    return apiRequest(url, { method: "GET" });
  },

  updateStatus: async (id, status, adminRemark) => {
    return apiRequest(`/claims/status/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status, adminRemark }),
    });
  },

  approveAmount: async (id, amount) => {
    return apiRequest(`/claims/admin/approve-amount/${id}`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },

  pay: async (id, payload) => {
    if (payload instanceof FormData) {
      const token = getToken();
      const url = `${API_BASE_URL}/claims/admin/pay/${id}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: payload,
      });

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || "Server returned non-JSON response");
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
      }

      return data;
    }

    return apiRequest(`/claims/admin/pay/${id}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  deleteClaim: async (id, reason) => {
    return apiRequest(`/claims/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    });
  },
};

/**
 * Applications API
 */
export const applicationsAPI = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append("status", params.status);
    if (params.search) queryParams.append("search", params.search);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit !== undefined) queryParams.append("limit", params.limit);
    if (params.jobPostingId) queryParams.append("jobPostingId", params.jobPostingId);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.paymentStatus) queryParams.append("paymentStatus", params.paymentStatus);

    const queryString = queryParams.toString();
    const url = `/applications${queryString ? `?${queryString}` : ""}`;
    return apiRequest(url, { method: "GET" });
  },

  getById: async (id) => {
    return apiRequest(`/applications/${id}`, { method: "GET" });
  },

  create: async (applicationData) => {
    return apiRequest("/applications", {
      method: "POST",
      body: JSON.stringify(applicationData),
    });
  },

  update: async (id, applicationData) => {
    return apiRequest(`/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(applicationData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/applications/${id}`, { method: "DELETE" });
  },

  checkApplication: async (jobPostingId) => {
    return apiRequest(`/applications/check/${jobPostingId}`, { method: "GET" });
  },

  checkDuplicate: async (data) => {
    return apiRequest("/applications/check-duplicate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updatePaymentStatus: async (id, paymentStatus) => {
    return apiRequest(`/applications/${id}/payment-status`, {
      method: "PATCH",
      body: JSON.stringify({ paymentStatus }),
    });
  },
};

/**
 * Employees API
 */
export const employeesAPI = {
  create: async (employeeData) => {
    return apiRequest("/employees", {
      method: "POST",
      body: JSON.stringify(employeeData),
    });
  },
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/employees?${query}`, { method: "GET" });
  },
  getLocationOfficers: async (state, district) => {
    return apiRequest(`/employees/location-officers?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`, { method: "GET" });
  },
  getById: async (id) => {
    return apiRequest(`/employees/${id}/details`, { method: "GET" });
  },
  adminEditEmployee: async (id, data) => {
    return apiRequest(`/employees/${id}/edit`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  getZoneEligible: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/employees/zone-eligible?${query}`, { method: "GET" });
  },
  getZoneFilterCounts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/employees/zone-eligible/filter-counts?${query}`, { method: "GET" });
  },
  getAllFilterCounts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/employees/all-filter-counts?${query}`, { method: "GET" });
  },
  getZoneEligibleIds: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/employees/zone-eligible/ids?${query}`, { method: "GET" });
  },
  adminBulkUnlockZones: async (ids) => {
    return apiRequest(`/employees/admin-bulk-unlock-zones`, {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  },
  getOnboardingStatus: async () => {
    return apiRequest("/employees/onboarding-status", { method: "GET" });
  },
  completeOnboarding: async (formData) => {
    return apiRequest("/employees/complete-onboarding", {
      method: "POST",
      body: JSON.stringify(formData),
    });
  },
  getMe: async () => {
    return apiRequest("/employees/me", { method: "GET" });
  },
  getProfile: async () => {
    return apiRequest("/employees/me", { method: "GET" });
  },
  lockZone: async (zoneData) => {
    return apiRequest("/employees/lock-zone", {
      method: "POST",
      body: JSON.stringify(zoneData),
    });
  },
  assignZone: async (id, zoneData) => {
    return apiRequest(`/employees/${id}/assign-zone`, {
      method: "POST",
      body: JSON.stringify(zoneData),
    });
  },
  getAssignedZonesStatus: async () => {
    return apiRequest("/employees/assigned-zones-status", { method: "GET" });
  },
  getHierarchy: async () => {
    return apiRequest("/employees/hierarchy", { method: "GET" });
  },
  getOccupiedZones: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/employees/occupied-zones?${query}`, { method: "GET" });
  },
  adminManageZone: async (id, data) => {
    return apiRequest(`/employees/${id}/admin-manage-zone`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  delete: async (id) => {
    return apiRequest(`/employees/${id}`, { method: "DELETE" });
  },
  getDetails: async (id) => {
    return apiRequest(`/employees/${id}/details`, { method: "GET" });
  },
  rmGetDetails: async (id) => {
    return apiRequest(`/employees/${id}/rm-details`, { method: "GET" });
  },
  update: async (id, data) => {
    return apiRequest(`/employees/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

/**
 * Job Postings API
 */
export const jobPostingsAPI = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append("status", params.status);
    if (params.search) queryParams.append("search", params.search);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit !== undefined) queryParams.append("limit", params.limit);
    if (params.includeCounts) queryParams.append("includeCounts", params.includeCounts);

    const queryString = queryParams.toString();
    const url = `/job-postings${queryString ? `?${queryString}` : ""}`;
    return apiRequest(url, { method: "GET" });
  },

  getById: async (id) => {
    return apiRequest(`/job-postings/${id}`, { method: "GET" });
  },

  create: async (postingData) => {
    return apiRequest("/job-postings", {
      method: "POST",
      body: JSON.stringify(postingData),
    });
  },

  update: async (id, postingData) => {
    return apiRequest(`/job-postings/${id}`, {
      method: "PUT",
      body: JSON.stringify(postingData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/job-postings/${id}`, { method: "DELETE" });
  },
};

/**
 * Students API
 */
export const studentsAPI = {
  register: async (studentData) => {
    return apiRequest("/students/register", {
      method: "POST",
      body: JSON.stringify(studentData),
    });
  },

  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append("status", params.status);
    if (params.search) queryParams.append("search", params.search);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit !== undefined) queryParams.append("limit", params.limit);

    const queryString = queryParams.toString();
    const url = `/students${queryString ? `?${queryString}` : ""}`;
    return apiRequest(url, { method: "GET" });
  },

  getById: async (id) => {
    return apiRequest(`/students/${id}`, { method: "GET" });
  },

  update: async (id, studentData) => {
    return apiRequest(`/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(studentData),
    });
  },
};

/**
 * Dashboard API
 */
export const dashboardAPI = {
  getStats: async () => {
    return apiRequest("/dashboard/stats", { method: "GET" });
  },
};

/**
 * Settings API
 */
export const settingsAPI = {
  get: async () => {
    return apiRequest("/settings", { method: "GET" });
  },

  update: async (settingsData) => {
    return apiRequest("/settings", {
      method: "PUT",
      body: JSON.stringify(settingsData),
    });
  },

  getRazorpayStatus: async () => {
    return apiRequest("/settings/razorpay/status", { method: "GET" });
  },

  verifyRazorpayCredentials: async () => {
    return apiRequest("/settings/razorpay/verify", { method: "POST" });
  },
};

/**
 * Gallery API
 */
export const galleryAPI = {
  getAll: async (active = null) => {
    const query = active !== null ? `?active=${active}` : "";
    return apiRequest(`/gallery${query}`, { method: "GET" });
  },

  getById: async (id) => {
    return apiRequest(`/gallery/${id}`, { method: "GET" });
  },

  upload: async (formData) => {
    const token = getToken();
    const url = `${API_BASE_URL}/gallery`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || "Server returned non-JSON response");
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
    }

    return data;
  },

  update: async (id, updateData) => {
    return apiRequest(`/gallery/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/gallery/${id}`, { method: "DELETE" });
  },
};

/**
 * Scroller API
 */
export const scrollerAPI = {
  getAll: async (active = null) => {
    const query = active !== null ? `?active=${active}` : "";
    return apiRequest(`/scroller${query}`, { method: "GET" });
  },

  getById: async (id) => {
    return apiRequest(`/scroller/${id}`, { method: "GET" });
  },

  upload: async (formData) => {
    const token = getToken();
    const url = `${API_BASE_URL}/scroller`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || "Server returned non-JSON response");
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
    }

    return data;
  },

  update: async (id, updateData) => {
    return apiRequest(`/scroller/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/scroller/${id}`, { method: "DELETE" });
  },
};

/**
 * Payments API
 */
export const paymentsAPI = {
  createOrder: async (jobPostingId, gender, category, applicationId, token = null) => {
    return apiRequest("/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ jobPostingId, gender, category, applicationId }),
      token,
    });
  },

  verifyPayment: async (orderId, paymentId, signature, applicationId, token = null) => {
    return apiRequest("/payments/verify", {
      method: "POST",
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        applicationId: applicationId,
      }),
      token,
    });
  },

  calculateFee: async (jobPostingId, gender, category) => {
    return apiRequest(
      `/payments/calculate-fee?jobPostingId=${jobPostingId}&gender=${gender}&category=${category}`,
      { method: "GET" }
    );
  },

  getTransactions: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit !== undefined) queryParams.append("limit", params.limit);
    if (params.status) queryParams.append("status", params.status);
    if (params.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const url = `/payments/transactions${queryString ? `?${queryString}` : ""}`;
    return apiRequest(url, { method: "GET" });
  },
  getAllTransactions: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit !== undefined) queryParams.append("limit", params.limit);
    if (params.status) queryParams.append("status", params.status);
    if (params.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const url = `/payments/all-transactions${queryString ? `?${queryString}` : ""}`;
    return apiRequest(url, { method: "GET" });
  },
  updateMOUStatus: async (data) => {
    return apiRequest("/payments/mou/status", {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  },
};

/**
 * Notifications API
 */
export const notificationsAPI = {
  getAll: async (active = null) => {
    const query = active !== null ? `?active=${active}` : "";
    return apiRequest(`/notifications${query}`, { method: "GET" });
  },

  getById: async (id) => {
    return apiRequest(`/notifications/${id}`, { method: "GET" });
  },

  create: async (data) => {
    return apiRequest("/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return apiRequest(`/notifications/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return apiRequest(`/notifications/${id}`, { method: "DELETE" });
  },
};

/**
 * Visitors API
 */
export const visitorsAPI = {
  getAll: async () => {
    return apiRequest("/visitors", { method: "GET" });
  },
  create: async (visitorData) => {
    return apiRequest("/visitors", {
      method: "POST",
      body: JSON.stringify(visitorData),
    });
  },
  checkout: async (id) => {
    return apiRequest(`/visitors/${id}/checkout`, { method: "PUT" });
  },
  delete: async (id) => {
    return apiRequest(`/visitors/${id}`, { method: "DELETE" });
  }
};

/**
 * Notices API
 */
export const noticesAPI = {
  getAll: async (active = null) => {
    const query = active !== null ? `?active=${active}` : "";
    return apiRequest(`/notices${query}`, { method: "GET" });
  },

  getById: async (id) => {
    return apiRequest(`/notices/${id}`, { method: "GET" });
  },

  create: async (data) => {
    return apiRequest("/notices", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return apiRequest(`/notices/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return apiRequest(`/notices/${id}`, { method: "DELETE" });
  },
};

/**
 * Question Bank API
 */
export const questionBankAPI = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append("status", params.status);
    if (params.search) queryParams.append("search", params.search);
    if (params.subject) queryParams.append("subject", params.subject);
    if (params.difficulty) queryParams.append("difficulty", params.difficulty);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit !== undefined) queryParams.append("limit", params.limit);

    const queryString = queryParams.toString();
    const url = `/question-bank${queryString ? `?${queryString}` : ""}`;
    return apiRequest(url, { method: "GET" });
  },

  getById: async (id) => {
    return apiRequest(`/question-bank/${id}`, { method: "GET" });
  },

  create: async (data) => {
    return apiRequest("/question-bank", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return apiRequest(`/question-bank/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return apiRequest(`/question-bank/${id}`, { method: "DELETE" });
  },
};

/**
 * Create Paper API
 */
export const createPaperAPI = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append("status", params.status);
    if (params.search) queryParams.append("search", params.search);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit !== undefined) queryParams.append("limit", params.limit);
    if (params.minimal !== undefined) queryParams.append("minimal", params.minimal);

    const queryString = queryParams.toString();
    const url = `/create-paper${queryString ? `?${queryString}` : ""}`;
    return apiRequest(url, { method: "GET" });
  },

  getById: async (id) => {
    return apiRequest(`/create-paper/${id}`, { method: "GET" });
  },

  getDetails: async (id) => {
    return apiRequest(`/create-paper/details/${id}`, { method: "GET" });
  },

  getAttempts: async (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/create-paper/${id}/attempts?${query}`, { method: "GET" });
  },

  getAllStudentIds: async (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/create-paper/${id}/all-student-ids?${query}`, { method: "GET" });
  },

  getUnassigned: async (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/create-paper/${id}/unassigned?${query}`, { method: "GET" });
  },

  getGlobalUnassigned: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/create-paper/all/global-unassigned?${query}`, { method: "GET" });
  },

  getGlobalCandidates: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/create-paper/all/global-candidates?${query}`, { method: "GET" });
  },


  getReferredUnassigned: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/create-paper/all/referred-unassigned?${query}`, { method: "GET" });
  },

  resetAttempts: async (testId, applicationId) => {
    return apiRequest(`/create-paper/${testId}/attempts/${applicationId}`, { method: "DELETE" });
  },

  bulkResetAttempts: async (testId, studentIds) => {
    return apiRequest(`/create-paper/${testId}/attempts/bulk-reset`, {
      method: "DELETE",
      body: JSON.stringify({ studentIds })
    });
  },

  planReExam: async (id, studentIds, extraData = {}) => {
    return apiRequest(`/create-paper/${id}/re-exam`, {
      method: "POST",
      body: JSON.stringify({ studentIds, ...extraData })
    });
  },
  notifyManual: async (id, studentIds, extraData = {}) => {
    return apiRequest(`/create-paper/${id}/notify-manual`, {
      method: "POST",
      body: JSON.stringify({ studentIds, ...extraData })
    });
  },

  create: async (data) => {
    return apiRequest("/create-paper", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return apiRequest(`/create-paper/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return apiRequest(`/create-paper/${id}`, { method: "DELETE" });
  },

  getAssigned: async () => {
    return apiRequest("/create-paper/assigned", { method: "GET" });
  },

  getReview: async (id) => {
    return apiRequest(`/create-paper/${id}/review`, { method: "GET" });
  },

  submitAttempt: async (id, data) => {
    return apiRequest(`/create-paper/${id}/submit`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMOUFilterCounts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/create-paper/mou/filter-counts?${query}`, { method: "GET" });
  },

  getMOUList: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/create-paper/mou/global-list?${query}`, { method: "GET" });
  },

  getMOUGlobalDetails: async (id) => {
    return apiRequest(`/create-paper/mou/details/${id}`, { method: "GET" });
  },
  getMOUGlobalIds: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/create-paper/mou/global-ids?${query}`, { method: "GET" });
  },
  updateMOUStatus: async (id, status) => {
    return apiRequest(`/create-paper/mou/update-status/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  bulkConvertMOU: async (attemptIds) => {
    return apiRequest("/create-paper/mou/bulk-convert", {
      method: "POST",
      body: JSON.stringify({ attemptIds }),
    });
  },
  // Professional Export using standard apiRequest
  exportMOUCSV: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/create-paper/mou/export-csv?${query}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    });
    if (!response.ok) throw new Error("Export failed");
    return await response.blob();
  },
  testWhatsApp: async (data) => {
    return apiRequest("/create-paper/test/whatsapp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  bulkUpdateMOU: async (data) => {
    return apiRequest("/create-paper/bulk-update-mou", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  notifyMOU: async (data) => {
    return apiRequest("/create-paper/mou/notify", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  startMOUBroadcast: async (attemptIds, channels) => {
    return apiRequest("/create-paper/mou/broadcast", {
      method: "POST",
      body: JSON.stringify({ attemptIds, channels }),
    });
  },
  startBroadcast: async (id, studentIds, extraData = {}) => {
    return apiRequest(`/create-paper/${id}/broadcast`, {
      method: "POST",
      body: JSON.stringify({ studentIds, ...extraData }),
    });
  },
  getBroadcastStatus: async (jobId) => {
    return apiRequest(`/create-paper/broadcast/status/${jobId}`, {
      method: "GET",
    });
  },
  controlBroadcast: async (jobId, action) => {
    return apiRequest(`/create-paper/broadcast/control/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    });
  },
  getActiveBroadcasts: async () => {
    return apiRequest("/create-paper/broadcast/active", {
      method: "GET",
    });
  },

  // Manual Candidate Addition
  searchCandidate: async (query) => {
    return apiRequest("/create-paper/search-candidate", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  },
  addCandidateToPaper: async (id, applicationId) => {
    return apiRequest(`/create-paper/${id}/add-candidate`, {
      method: "POST",
      body: JSON.stringify({ applicationId }),
    });
  },
};

export const systemConfigAPI = {
  getCurrent: async () => {
    return apiRequest("/system-config/current", { method: "GET" });
  },
  update: async (data) => {
    return apiRequest("/system-config/update", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

/**
 * Upload API
 */
export const uploadAPI = {
  uploadAdvertisement: async (file) => {
    const token = getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/upload/advertisement`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || "Upload failed");
    }
    return data;
  },
  uploadMOUDucument: async (file, type) => {
    const token = getToken();
    if (!token) throw new Error("Authentication required");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await fetch(`${API_BASE_URL}/upload/mou-document`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error || "Upload failed");
    return data;
  },
  uploadBlogImage: async (formData) => {
    return apiRequest("/upload/blog-image", {
      method: "POST",
      body: formData,
      headers: {} // Let browser set multipart boundary
    });
  },
};

/**
 * Test Results API
 */
export const testResultsAPI = {
  getAll: async () => {
    return apiRequest("/test-result", { method: "GET" });
  },
  getById: async (id) => {
    return apiRequest(`/test-result/${id}`, { method: "GET" });
  },
};

export const feeStructureAPI = {
  getAll: async () => {
    return apiRequest("/fee-structure", { method: "GET" });
  },
  create: async (data) => {
    return apiRequest("/fee-structure", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: async (id, data) => {
    return apiRequest(`/fee-structure/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  delete: async (id) => {
    return apiRequest(`/fee-structure/${id}`, { method: "DELETE" });
  },
};

export const mouAPI = {
  submit: async (data) => {
    return apiRequest("/mou/submit", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  verify: async (verificationData) => {
    return apiRequest("/mou/verify", {
      method: "POST",
      body: JSON.stringify(verificationData),
    });
  },
  mockVerify: async (applicationId, formData) => {
    return apiRequest("/mou/mock-verify", {
      method: "POST",
      body: JSON.stringify({ applicationId, formData }),
    });
  },
};

export const locationAPI = {
  getBlocks: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/location/blocks${query ? `?${query}` : ""}`, { method: "GET" });
  },
  getStats: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/location/stats${query ? `?${query}` : ""}`, { method: "GET" });
  },
  getCustomDistricts: async (state) => {
    return apiRequest(`/location/districts?state=${state}`, { method: "GET" });
  },
  createDistrict: async (data) => {
    return apiRequest("/location/districts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getStates: async () => {
    return apiRequest("/location/states", { method: "GET" });
  },
  createBlock: async (data) => {
    return apiRequest("/location/blocks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  bulkCreateBlocks: async (data) => {
    return apiRequest("/location/blocks/bulk", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateBlock: async (id, data) => {
    return apiRequest(`/location/blocks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deleteBlock: async (id) => {
    return apiRequest(`/location/blocks/${id}`, { method: "DELETE" });
  },
  deleteBlocks: async (ids) => {
    return apiRequest("/location/blocks-bulk", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  },
  getPanchayats: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/location/panchayats${query ? `?${query}` : ""}`, { method: "GET" });
  },
  createPanchayat: async (data) => {
    return apiRequest("/location/panchayats", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  bulkCreatePanchayats: async (data) => {
    return apiRequest("/location/panchayats/bulk", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updatePanchayat: async (id, data) => {
    return apiRequest(`/location/panchayats/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deletePanchayat: async (id) => {
    return apiRequest(`/location/panchayats/${id}`, { method: "DELETE" });
  },
  deletePanchayats: async (ids) => {
    return apiRequest("/location/panchayats-bulk", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  },
  bulkSyncLocations: async (data) => {
    return apiRequest("/location/sync-bulk", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getLocationStats: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/location/stats${query ? `?${query}` : ""}`, { method: "GET" });
  },
  getStats: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/location/stats${query ? `?${query}` : ""}`, { method: "GET" });
  },
  deduplicate: async () => {
    return apiRequest("/location/deduplicate", { method: "POST" });
  },
  deleteByState: async (state) => {
    return apiRequest("/location/delete-by-state", {
      method: "DELETE",
      body: JSON.stringify({ state }),
    });
  },
};

export const cardAPI = {
  checkDuplicate: async (data) => {
    return apiRequest("/cards/check-duplicate", { method: "POST", body: JSON.stringify(data) });
  },
  create: async (data) => {
    return apiRequest("/cards/create", { method: "POST", body: JSON.stringify(data) });
  },
  list: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/cards/list${query ? `?${query}` : ""}`, { method: "GET" });
  },
  getDetails: async (id) => {
    return apiRequest(`/cards/details/${id}`, { method: "GET" });
  },
  getById: async (id) => {
    return apiRequest(`/cards/details/${id}`, { method: "GET" });
  },
  update: async (id, data) => {
    return apiRequest(`/cards/edit/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  getMyCard: async (basic = false) => {
    return apiRequest(`/cards/my-card${basic ? '?basic=true' : ''}`, { method: "GET" });
  },
  getFilterCounts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/cards/filters/counts?${query}`, { method: "GET" });
  },
  adminCreate: async (data) => {
    return apiRequest("/cards/admin/create", { method: "POST", body: JSON.stringify(data) });
  },
  adminUpdate: async (id, data) => {
    return apiRequest(`/cards/admin/edit/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  adminDelete: async (id) => {
    return apiRequest(`/cards/admin/delete/${id}`, { method: "DELETE" });
  },
  exportAdminCardsCSV: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    try {
      const response = await fetch(`/api/cards/export-csv?${query}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Export failed");
      return await response.blob();
    } catch (error) {
      console.error("Export error:", error);
      throw error;
    }
  },
};

/**
 * Wallet API
 */
export const walletAPI = {
  getBalance: async () => {
    return apiRequest("/wallet/balance", { method: "GET" });
  },
  getLifetimeEarnings: async () => {
    return apiRequest("/wallet/lifetime-earnings", { method: "GET" });
  },
  getHistory: async (page = 1, limit = 10, type = '', dateRange = '', startDate = '', endDate = '') => {
    let url = `/wallet/history?page=${page}&limit=${limit}`;
    if (type) url += `&type=${type}`;
    if (dateRange && dateRange !== "all") {
      url += `&dateRange=${dateRange}`;
      if (dateRange === "custom_date" && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
    }
    return apiRequest(url, { method: "GET" });
  },
  createOrder: async (data) => {
    return apiRequest("/wallet/create-order", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  verifyPayment: async (paymentData) => {
    return apiRequest("/wallet/verify-payment", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  },
  adminRecharge: async (rechargeData) => {
    return apiRequest("/wallet/admin-recharge", {
      method: "POST",
      body: JSON.stringify(rechargeData),
    });
  },
  adminDeduct: async (deductData) => {
    return apiRequest("/wallet/admin-deduct", {
      method: "POST",
      body: JSON.stringify(deductData),
    });
  },
  getAdminEmployees: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/wallet/admin/employees?${query}`, { method: "GET" });
  },
  getPostList: async () => {
    return apiRequest("/wallet/post-list", { method: "GET" });
  },
  globalRecharge: async (data) => {
    return apiRequest("/wallet/global-recharge", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getAdminTransactions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/wallet/admin/transactions?${query}`, { method: "GET" });
  },
  resolveAdminTransaction: async (id, action) => {
    return apiRequest(`/wallet/admin/transactions/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
  },
  checkRazorpayStatus: async (id) => {
    return apiRequest(`/wallet/admin/transactions/${id}/razorpay-status`, { method: "GET" });
  },
  exportAdminEmployeesCSV: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/wallet/admin/employees/export-csv?${query}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    });
    if (!response.ok) throw new Error("Export failed");
    return await response.blob();
  },
};


/**
 * Admin API
 */
export const adminAPI = {
  getAdmins: async () => {
    return apiRequest("/auth/admin/list", { method: "GET" });
  },
  createAdmin: async (adminData) => {
    return apiRequest("/auth/admin/create", {
      method: "POST",
      body: JSON.stringify(adminData),
    });
  },
  updateAdmin: async (id, adminData) => {
    return apiRequest(`/auth/admin/${id}`, {
      method: "PUT",
      body: JSON.stringify(adminData),
    });
  },
  deleteAdmin: async (id) => {
    return apiRequest(`/auth/admin/${id}`, { method: "DELETE" });
  },
};

export const announcementAPI = {
  getAll: () => apiRequest("/announcements"),
  getLatest: () => apiRequest("/announcements/latest"),
  create: (data) => apiRequest("/announcements", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/announcements/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/announcements/${id}`, { method: "DELETE" }),
};

/**
 * Job Role API
 */
export const jobRoleAPI = {
  getAll: async (search = "") => {
    return apiRequest(`/job-roles?search=${search}`, { method: "GET" });
  },
  create: async (data) => {
    return apiRequest("/job-roles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: async (id, data) => {
    return apiRequest(`/job-roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  delete: async (id) => {
    return apiRequest(`/job-roles/${id}`, { method: "DELETE" });
  },
};

/**
 * Administrative Staff API
 */
export const administrativeStaffAPI = {
  getAll: async () => {
    return apiRequest("/administrative-staff", { method: "GET" });
  },
  getDetails: async (id) => {
    return apiRequest(`/administrative-staff/${id}`, { method: "GET" });
  },
  create: async (staffData) => {
    return apiRequest("/administrative-staff", {
      method: "POST",
      body: JSON.stringify(staffData),
    });
  },
  update: async (id, staffData) => {
    return apiRequest(`/administrative-staff/${id}`, {
      method: "PATCH",
      body: JSON.stringify(staffData),
    });
  },
  delete: async (id) => {
    return apiRequest(`/administrative-staff/${id}`, { method: "DELETE" });
  },
  getMe: async () => {
    return apiRequest("/administrative-staff/me", { method: "GET" });
  },
  getOnboardingStatus: async () => {
    return apiRequest("/administrative-staff/onboarding-status", { method: "GET" });
  },
  completeOnboarding: async (formData) => {
    return apiRequest("/administrative-staff/complete-onboarding", {
      method: "POST",
      body: JSON.stringify(formData),
    });
  },
};

export const refundAPI = {
  request: (data) => apiRequest("/refunds/request", { method: "POST", body: JSON.stringify(data) }),
  getMyRequests: () => apiRequest("/refunds/my-requests"),
  getAllRequests: () => apiRequest("/refunds/admin/all"),
  updateStatus: (id, data) => apiRequest(`/refunds/admin/status/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};

export const resignationAPI = {
  getEligibility: () => apiRequest("/resignations/eligibility"),
  submitRequest: (data) =>
    apiRequest("/resignations/request", { method: "POST", body: JSON.stringify(data) }),
  getMyRequests: () => apiRequest("/resignations/my-requests"),
  withdrawRequest: (id) =>
    apiRequest(`/resignations/my-requests/${id}/withdraw`, { method: "PATCH" }),
  getAllAdmin: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append("status", params.status);
    const qs = query.toString();
    return apiRequest(`/resignations/admin/all${qs ? `?${qs}` : ""}`);
  },
  updateAdminStatus: (id, data) =>
    apiRequest(`/resignations/admin/status/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};

export const campAPI = {
  createCamp: (data) =>
    apiRequest("/camps", { method: "POST", body: JSON.stringify(data) }),
  updateCamp: (id, data) =>
    apiRequest(`/camps/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCamp: (id) =>
    apiRequest(`/camps/${id}`, { method: "DELETE" }),
  getAdminStats: () => apiRequest("/camps/admin/stats", { method: "GET" }),
  getAdminCamps: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    const qs = query.toString();
    return apiRequest(`/camps${qs ? `?${qs}` : ""}`, { method: "GET" });
  },
  getActiveCamps: () => apiRequest("/camps/active", { method: "GET" }),
  getEligibility: () => apiRequest("/camps/requests/eligibility", { method: "GET" }),
  submitRequest: () =>
    apiRequest("/camps/requests", { method: "POST", body: JSON.stringify({}) }),
  getMyRequests: () => apiRequest("/camps/requests/my", { method: "GET" }),
  getAllRequestsAdmin: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append("status", params.status);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.search) query.append("search", params.search);
    const qs = query.toString();
    return apiRequest(`/camps/requests/admin/all${qs ? `?${qs}` : ""}`);
  },
  updateRequest: (id, data) =>
    apiRequest(`/camps/requests/admin/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

export const feedAPI = {
  create: (data) => apiRequest("/feeds/create", { method: "POST", body: JSON.stringify(data) }),
  getMyFeeds: () => apiRequest("/feeds/my-feeds"),
  getPublicFeeds: () => apiRequest("/feeds/public"),
  getAllAdminFeeds: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.status) queryParams.append("status", params.status);
    if (params.search) queryParams.append("search", params.search);
    return apiRequest(`/feeds/admin/all?${queryParams.toString()}`, { method: "GET" });
  },
  updateStatus: (id, data) => apiRequest(`/feeds/admin/status/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  editFeed: (id, data) => apiRequest(`/feeds/admin/edit/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  toggleLike: (id) => apiRequest(`/feeds/like/${id}`, { method: "POST" }),
  uploadImage: (formData) => apiRequest("/upload/feed-image", {
    method: "POST",
    body: formData,
    headers: {} // Let browser set multipart boundary
  }),
  delete: (id) => apiRequest(`/feeds/admin/${id}`, { method: "DELETE" })
};

export const leadAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/leads${query ? `?${query}` : ""}`);
  },
  getArchived: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/leads/archived${query ? `?${query}` : ""}`);
  },
  create: (data) => apiRequest("/leads", { method: "POST", body: JSON.stringify(data) }),
  updateStatus: (id, status, callRemark) => apiRequest(`/leads/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, callRemark }) }),
  archive: (id, isArchived) => apiRequest(`/leads/${id}/archive`, { method: "PATCH", body: JSON.stringify({ isArchived }) }),
};

export const reviewAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/reviews/all${query ? `?${query}` : ""}`);
  },
  getSuperiors: () => apiRequest("/reviews/superiors"),
  getReceived: () => apiRequest("/reviews/received"),
  submit: (data) => apiRequest("/reviews", { method: "POST", body: JSON.stringify(data) }),
};

/**
 * Meeting API
 */
export const meetingAPI = {
  create: async (data) => {
    return apiRequest("/meetings/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  join: async (roomId) => {
    return apiRequest(`/meetings/join/${roomId}`, { method: "GET" });
  },
  leave: async (roomId) => {
    return apiRequest(`/meetings/leave/${roomId}`, { method: "PUT" });
  },
  end: async (roomId) => {
    return apiRequest(`/meetings/end/${roomId}`, { method: "PUT" });
  },
  getHistory: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/meetings/history${query ? `?${query}` : ""}`, { method: "GET" });
  },
  getAdminActive: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/meetings/admin/active${query ? `?${query}` : ""}`, { method: "GET" });
  },
  broadcastReminder: async (meetingId, channels) => {
    return apiRequest("/meetings/broadcast-reminder", {
      method: "POST",
      body: JSON.stringify({ meetingId, channels }),
    });
  },
  deleteMeetings: async (meetingIds) => {
    return apiRequest("/meetings/admin/delete", {
      method: "POST",
      body: JSON.stringify({ meetingIds }),
    });
  },
  invite: async (data) => {
    return apiRequest("/meetings/invite", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getInvitations: async () => {
    return apiRequest("/meetings/invitations", { method: "GET" });
  },
  updateInvitationStatus: async (invitationId, status) => {
    return apiRequest("/meetings/invitation/status", {
      method: "POST",
      body: JSON.stringify({ invitationId, status }),
    });
  },
  searchEmployees: async (params = {}) => {
    const query = typeof params === 'string' ? `?query=${params}` : `?${new URLSearchParams(params).toString()}`;
    return apiRequest(`/meetings/search-employees${query}`, { method: "GET" });
  },
  getScheduled: async () => {
    return apiRequest("/meetings/scheduled", { method: "GET" });
  },
  addPoint: async (meetingId, text) => {
    return apiRequest(`/meetings/${meetingId}/points`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },
  deletePoint: async (meetingId, pointId) => {
    return apiRequest(`/meetings/${meetingId}/points/${pointId}`, {
      method: "DELETE",
    });
  },
  updateObservations: async (meetingId, observations) => {
    return apiRequest(`/meetings/${meetingId}/observations`, {
      method: "PUT",
      body: JSON.stringify({ observations }),
    });
  },
  uploadAttachment: async (meetingId, formData) => {
    return apiRequest(`/meetings/${meetingId}/attachments`, {
      method: "POST",
      body: formData,
    });
  },
  update: async (roomId, data) => {
    return apiRequest(`/meetings/update/${roomId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  updateSettings: async (roomId, settings) => {
    return apiRequest(`/meetings/update-settings/${roomId}`, {
      method: "PUT",
      body: JSON.stringify({ settings }),
    });
  },
};

/**
 * Calculator API — Health Calculators for CardHolder
 */
export const calculatorAPI = {
  log: (data) =>
    apiRequest("/calculator/log", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMyHistory: () => apiRequest("/calculator/my-history", { method: "GET" }),
  getAdminReport: () => apiRequest("/calculator/admin-report", { method: "GET" }),
};

/**
 * Broadcast API - Manage background jobs
 */
export const broadcastAPI = {
  getJob: (jobId) => apiRequest(`/create-paper/broadcast/status/${jobId}`, { method: "GET" }),
  controlJob: (jobId, action) => apiRequest(`/create-paper/broadcast/control/${jobId}`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  }),
  getActiveJobs: () => apiRequest("/create-paper/broadcast/active", { method: "GET" }),
};

/**
 * Q&A API
 */
export const qaAPI = {
  ask: async (data) => {
    return apiRequest("/qa/ask", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getMyQuestions: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    return apiRequest(`/qa/my-questions?${queryParams.toString()}`, { method: "GET" });
  },
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.status) queryParams.append("status", params.status);
    if (params.search) queryParams.append("search", params.search);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.designation) queryParams.append("designation", params.designation);
    return apiRequest(`/qa/admin/all?${queryParams.toString()}`, { method: "GET" });
  },
  getRMAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.status) queryParams.append("status", params.status);
    if (params.search) queryParams.append("search", params.search);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.designation) queryParams.append("designation", params.designation);
    return apiRequest(`/qa/rm/all?${queryParams.toString()}`, { method: "GET" });
  },
  answer: async (id, answer) => {
    return apiRequest(`/qa/admin/answer/${id}`, {
      method: "PUT",
      body: JSON.stringify({ answer }),
    });
  },
  delete: async (id) => {
    return apiRequest(`/qa/admin/${id}`, { method: "DELETE" });
  },
};

export const lettersAPI = {
  // Admin: get all letters (optionally filter by locations)
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.state) query.append("state", params.state);
    if (params.district) query.append("district", params.district);
    if (params.block) query.append("block", params.block);
    if (params.panchayat) query.append("panchayat", params.panchayat);
    if (params.isEmployeeUpload !== undefined) query.append("isEmployeeUpload", params.isEmployeeUpload);
    const q = query.toString() ? `?${query.toString()}` : "";
    return apiRequest(`/letters${q}`, { method: "GET" });
  },
  // Employee: get letters for their own post
  getMyLetters: async () => {
    return apiRequest("/letters/my-letters", { method: "GET" });
  },
  // Employee: get team letters (RM, ZC)
  getTeamLetters: async () => {
    return apiRequest("/letters/team-letters", { method: "GET" });
  },
  // Admin: upload a new letter (FormData with title, post, file)
  upload: async (formData) => {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/letters`, {
      method: "POST",
      headers: { Authorization: token ? `Bearer ${token}` : "" },
      body: formData,
    });
    return res.json();
  },
  // Employee: upload a new letter (FormData with title, file)
  uploadEmployeeLetter: async (formData) => {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/letters/employee`, {
      method: "POST",
      headers: { Authorization: token ? `Bearer ${token}` : "" },
      body: formData,
    });
    return res.json();
  },
  // Admin: delete a letter by ID
  deleteLetter: async (id) => {
    return apiRequest(`/letters/${id}`, { method: "DELETE" });
  },
};

export const blogAPI = {
  getAll: async () => apiRequest("/blogs"),
  getById: async (id) => apiRequest(`/blogs/${id}`),
  create: async (data) => apiRequest("/blogs", { method: "POST", body: JSON.stringify(data) }),
  update: async (id, data) => apiRequest(`/blogs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id) => apiRequest(`/blogs/${id}`, { method: "DELETE" }),
};

/**
 * Support Contacts API
 */
export const supportAPI = {
  getAll: async () => {
    return apiRequest("/support", { method: "GET" });
  },
  bulkUpdate: async (contacts) => {
    return apiRequest("/support/bulk", {
      method: "POST",
      body: JSON.stringify({ contacts })
    });
  },
  deleteContact: async (stateId, contactId) => {
    return apiRequest(`/support/${stateId}/contact/${contactId}`, { method: "DELETE" });
  },
  editContact: async (stateId, contactId, data) => {
    return apiRequest(`/support/${stateId}/contact/${contactId}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },
  getMyStateSupport: async () => {
    return apiRequest("/support/my-state", { method: "GET" });
  }
};

/**
 * Policies API
 */
export const policiesAPI = {
  getAll: async () => {
    return apiRequest("/policies", { method: "GET" });
  },
  upload: async (formData) => {
    const token = getToken();
    const url = `${API_BASE_URL}/policies/upload`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || "Server returned non-JSON response");
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
    }

    return data;
  },
  update: async (id, data) => {
    if (data instanceof FormData) {
      const token = getToken();
      const url = `${API_BASE_URL}/policies/${id}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: data,
      });

      const contentType = response.headers.get("content-type");
      let resData;
      if (contentType && contentType.includes("application/json")) {
        resData = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || "Server returned non-JSON response");
      }

      if (!response.ok) {
        throw new Error(resData.message || resData.error || `Request failed with status ${response.status}`);
      }

      return resData;
    }

    return apiRequest(`/policies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deletePolicy: async (id) => {
    return apiRequest(`/policies/${id}`, { method: "DELETE" });
  },
};

/**
 * Zonal Tracking API
 */
export const zonalTrackingAPI = {
  getAdminZCsList: async (search = "") => {
    return apiRequest(`/zonal-tracking/admin/zcs${search ? `?search=${search}` : ""}`, { method: "GET" });
  },
  getZCTrackingDetails: async (zcId, page = 1, limit = 10, search = "") => {
    return apiRequest(`/zonal-tracking/admin/tracking-details/${zcId}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { method: "GET" });
  }
};

/**
 * Doctors API
 */
export const doctorsAPI = {
  getProfile: async () => {
    return apiRequest("/doctors/me", { method: "GET" });
  },
  submitOnboarding: async (data) => {
    return apiRequest("/doctors/onboarding", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  getActiveDoctors: async () => {
    return apiRequest("/doctors/active", { method: "GET" });
  },
  generateToken: async (doctorId, cardId = null) => {
    return apiRequest(`/doctors/${doctorId}/generate-token`, { 
      method: "POST",
      body: cardId ? JSON.stringify({ cardId }) : undefined,
    });
  },
  getMyTokens: async (page = 1, limit = 10, search = "") => {
    return apiRequest(`/doctors/my-tokens?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { method: "GET" });
  },
  getCardholderTokens: async (page = 1, limit = 10) => {
    return apiRequest(`/doctors/cardholder-tokens?page=${page}&limit=${limit}`, { method: "GET" });
  },
  updateTokenStatus: async (tokenId, status) => {
    return apiRequest(`/doctors/tokens/${tokenId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },
  getPendingTokens: async (page = 1, limit = 10, search = "") => {
    return apiRequest(`/doctors/my-tokens/pending?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { method: "GET" });
  },
  createPrescription: async (data) => {
    return apiRequest("/doctors/prescriptions/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getMyPrescriptions: async (page = 1, limit = 10, search = "") => {
    return apiRequest(`/doctors/prescriptions/my-prescriptions?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { method: "GET" });
  },
  getAll: async () => {
    return apiRequest("/doctors", { method: "GET" });
  },
  getInactiveDoctors: async () => {
    return apiRequest("/doctors/inactive", { method: "GET" });
  },
  getEmployeeDoctors: async () => {
    return apiRequest("/doctors/employee", { method: "GET" });
  },
  getCardholderDoctors: async () => {
    return apiRequest("/doctors/cardholder", { method: "GET" });
  },
  getById: async (id) => {
    return apiRequest(`/doctors/${id}`, { method: "GET" });
  },
  getSessionHistory: async () => {
    return apiRequest("/doctors/session-history", { method: "GET" });
  },
  endSession: async (id) => {
    return apiRequest(`/doctors/${id}/end-session`, { method: "POST" });
  },
  create: async (data) => {
    return apiRequest("/doctors", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: async (id, data) => {
    return apiRequest(`/doctors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  delete: async (id) => {
    return apiRequest(`/doctors/${id}`, { method: "DELETE" });
  },
  testSMS: async (phone) => {
    return apiRequest("/doctors/test-sms", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },
  uploadImage: async (formData) => {
    const session = localStorage.getItem("jssa_auth");
    let token = null;
    if (session) {
      try { token = JSON.parse(session).token; } catch (e) { }
    }

    // Fallback to /api as in API_BASE_URL resolution
    const RAW_API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "/api";
    const API_BASE_URL = (() => {
      const base = String(RAW_API_BASE_URL || "").trim().replace(/\/+$/, "");
      if (!base) return "/api";
      if (/^https?:\/\//i.test(base) && !/\/api$/i.test(base)) return `${base}/api`;
      return base;
    })();

    const url = `${API_BASE_URL}/upload/doctor-image`;
    const response = await fetch(url, {
      method: "POST",
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || "Server returned non-JSON response");
    }
    if (!response.ok) {
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
    }
    return data;
  }
};

export const adminPayoutAPI = {
  initiatePayout: async (data) => {
    return apiRequest("/admin/payout/initiate", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  testPayout: async (data) => {
    return apiRequest("/admin/payout/test", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  getHistory: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/payout/history?${query}`, { method: "GET" });
  }
};

export const certificatesAPI = {
  getConfig: async () => {
    return apiRequest("/certificates/config", { method: "GET" });
  },
  updateConfig: async (data) => {
    return apiRequest("/certificates/config", {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },
  triggerAutoAssign: async (data) => {
    return apiRequest("/certificates/auto-assign/trigger", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  getAutoAssignHistory: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/certificates/auto-assign/history?${query}`, { method: "GET" });
  },
  bulkDeleteAssigned: async (ids) => {
    return apiRequest("/certificates/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids })
    });
  },
  getRMs: async () => {
    return apiRequest("/certificates/rms", { method: "GET" });
  },
  getEmployeeCertificates: async (id) => {
    return apiRequest(`/certificates/employee/${id}`, { method: "GET" });
  },
  assign: async (data) => {
    return apiRequest("/certificates/assign", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  updateAssigned: async (id, data) => {
    return apiRequest(`/certificates/assign/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },
  deleteAssigned: async (id) => {
    return apiRequest(`/certificates/assign/${id}`, { method: "DELETE" });
  },
  getMyCertificates: async () => {
    return apiRequest("/certificates/my-certificates", { method: "GET" });
  }
};

export const pharmacyBillsAPI = {
  create: async (data) => {
    return apiRequest("/pharmacy-bills", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/pharmacy-bills${query ? `?${query}` : ""}`, { method: "GET" });
  },
  verifyCardholder: async (mobile) => {
    return apiRequest(`/pharmacy-bills/verify-cardholder/${mobile}`, { method: "GET" });
  },
  getByPrescriptionId: async (prescriptionId) => {
    return apiRequest(`/pharmacy-bills/prescription/${prescriptionId}`, { method: "GET" });
  }
};

export const pharmaciesAPI = {
  getAll: async () => apiRequest("/pharmacies", { method: "GET" }),
  create: async (data) => apiRequest("/pharmacies", { method: "POST", body: JSON.stringify(data) }),
  update: async (id, data) => apiRequest(`/pharmacies/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id) => apiRequest(`/pharmacies/${id}`, { method: "DELETE" }),
  getProfile: async () => apiRequest("/pharmacies/me", { method: "GET" }),
  submitOnboarding: async (data) => apiRequest("/pharmacies/onboarding", { method: "PUT", body: JSON.stringify(data) }),
  getOnboardingStatus: async () => apiRequest("/pharmacies/me", { method: "GET" }),
  getDashboardStats: async () => apiRequest("/pharmacies/dashboard-stats", { method: "GET" }),
  getPrescriptions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/pharmacies/prescriptions${query ? `?${query}` : ""}`, { method: "GET" });
  },
  dispensePrescription: async (id) => apiRequest(`/pharmacies/prescriptions/${id}/dispense`, { method: "PUT" }),
};

export const pharmacyCategoriesAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/pharmacy-categories${query ? `?${query}` : ""}`, { method: "GET" });
  },
  create: async (data) => apiRequest("/pharmacy-categories", { method: "POST", body: JSON.stringify(data) }),
  update: async (id, data) => apiRequest(`/pharmacy-categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id) => apiRequest(`/pharmacy-categories/${id}`, { method: "DELETE" }),
};

export const pharmacyProductsAPI = {
  getAll: async (categoryId = "", params = {}) => {
    const queryParams = new URLSearchParams(params);
    if (categoryId) queryParams.append("categoryId", categoryId);
    const query = queryParams.toString();
    const url = `/pharmacy-products${query ? `?${query}` : ""}`;
    return apiRequest(url, { method: "GET" });
  },
  create: async (data) => apiRequest("/pharmacy-products", { method: "POST", body: JSON.stringify(data) }),
  update: async (id, data) => apiRequest(`/pharmacy-products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id) => apiRequest(`/pharmacy-products/${id}`, { method: "DELETE" }),
  searchForDoctor: async (q) => apiRequest(`/pharmacy-products/search?q=${encodeURIComponent(q)}`, { method: "GET" }),
};

// Combined API object
export const api = {
  auth: authAPI,
  certificates: certificatesAPI,
  applications: applicationsAPI,
  jobPostings: jobPostingsAPI,

  questionBank: questionBankAPI,
  createPaper: createPaperAPI,
  upload: uploadAPI,
  testResults: testResultsAPI,
  feeStructure: feeStructureAPI,
  mou: mouAPI,
  location: locationAPI,
  cards: cardAPI,
  wallet: walletAPI,
  systemConfig: systemConfigAPI,
  reviews: reviewAPI,
  meetings: meetingAPI,
  calculator: calculatorAPI,
  qa: qaAPI,
  broadcast: broadcastAPI,
  letters: lettersAPI,
  visitors: visitorsAPI,
  blogs: blogAPI,
  support: supportAPI,
  policies: policiesAPI,
  zonalTracking: zonalTrackingAPI,
  doctors: doctorsAPI,
  adminPayout: adminPayoutAPI,
  pharmacies: pharmaciesAPI,
  pharmacyCategories: pharmacyCategoriesAPI,
  pharmacyProducts: pharmacyProductsAPI,
  pharmacyBills: pharmacyBillsAPI,
};

export default apiRequest;
