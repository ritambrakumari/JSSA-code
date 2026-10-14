// Use environment variable - must be set in .env file
const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  import.meta.env.VITE_BACKEND_URL || 
  "";

if (!API_BASE_URL) {
  console.error("VITE_API_URL or VITE_BACKEND_URL must be set in .env file");
  console.error("Example: VITE_API_URL=http://localhost:3000/api");
}

/**
 * Make API request (public endpoints don't need authentication)
 * @param {string} endpoint - API endpoint
 * @param {object} options - Request options
 * @param {string} options.token - Optional authentication token
 */
async function apiRequest(endpoint, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured. Please set VITE_API_URL or VITE_BACKEND_URL in your .env file");
  }
  
  const url = `${API_BASE_URL}${endpoint}`;
  const { token, timeout = 30000, ...restOptions } = options; // Default 30 second timeout

  const config = {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...restOptions.headers,
    },
  };

  try {
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), timeout);
    });

    // Race between fetch and timeout
    const response = await Promise.race([
      fetch(url, config),
      timeoutPromise,
    ]);
    
    // Check if response is JSON
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      // For 404 errors, return empty data structure silently
      if (response.status === 404) {
        // Silently handle 404 - don't log to avoid console spam
        return { success: false, data: null, error: "Route not found" };
      }
      throw new Error(text || "Server returned non-JSON response");
    }

    if (!response.ok) {
      // For 404 errors, return empty data structure silently
      if (response.status === 404) {
        // Silently handle 404 - don't log to avoid console spam
        return { success: false, data: null, error: data.message || data.error || "Route not found" };
      }
      // Only log non-404 errors
      console.error(`API Error ${response.status}:`, data.message || data.error || `Request failed`);
      return { 
        success: false, 
        data: null, 
        error: data.message || data.error || `Request failed with status ${response.status}` 
      };
    }

    return data;
  } catch (error) {
    // Handle timeout errors
    if (error.message === "Request timeout") {
      console.error("API Request timeout:", url);
      return { success: false, data: null, error: "Request timeout: Server took too long to respond" };
    }
    
    // Only log non-network errors (network errors are expected in some cases)
    if (error.message !== "Failed to fetch" && error.name !== "TypeError") {
      console.error("API Error:", error);
    }
    
    // Provide more helpful error messages
    if (error.message === "Failed to fetch" || error.name === "TypeError") {
      // Return network error structure
      return { success: false, data: null, error: "Network error: Unable to connect to server" };
    }
    
    // For other errors, return error structure instead of throwing
    return { success: false, data: null, error: error.message || "Unknown error" };
  }
}

/**
 * Job Postings API
 */
export const jobPostingsAPI = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append("status", params.status);
    if (params.search) queryParams.append("search", params.search);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);

    const queryString = queryParams.toString();
    const url = `/job-postings${queryString ? `?${queryString}` : ""}`;
    return apiRequest(url, { method: "GET" });
  },

  getById: async (id) => {
    return apiRequest(`/job-postings/${id}`, { method: "GET" });
  },

  getLatestResults: async () => {
    return apiRequest("/job-postings/latest-results", { method: "GET" });
  },

  getLatestVacancies: async () => {
    return apiRequest("/job-postings/latest-vacancies", { method: "GET" });
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
};

/**
 * Gallery API
 */
export const galleryAPI = {
  getAll: async (active = null) => {
    const query = active !== null ? `?active=${active}` : "";
    return apiRequest(`/gallery${query}`, { method: "GET" });
  },
};

/**
 * Notifications API
 */
export const noticesAPI = {
  getAll: async (active = null) => {
    const query = active !== null ? `?active=${active}` : "";
    return apiRequest(`/notices${query}`, { method: "GET" });
  },

  getById: async (id) => {
    return apiRequest(`/notices/${id}`, { method: "GET" });
  },
};

export const notificationsAPI = {
  getAll: async (active = null) => {
    const query = active !== null ? `?active=${active}` : "";
    return apiRequest(`/notifications${query}`, { method: "GET" });
  },
};

/**
 * Payments API
 */
export const paymentsAPI = {
  createOrder: async (jobPostingId, gender, category, applicationId, token = null) => {
    const body = { jobPostingId, gender, category, applicationId };
    return apiRequest("/payments/create-order", {
      method: "POST",
      body: JSON.stringify(body),
      token,
    });
  },

  verifyPayment: async (razorpay_order_id, razorpay_payment_id, razorpay_signature, applicationId, token = null) => {
    return apiRequest("/payments/verify", {
      method: "POST",
      body: JSON.stringify({
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        applicationId: applicationId,
      }),
      token,
    });
  },

  calculateFee: async (jobPostingId, gender, category, token = null) => {
    return apiRequest(
      `/payments/calculate-fee?jobPostingId=${jobPostingId}&gender=${gender}&category=${category}`,
      { method: "GET", token }
    );
  },
};

export default apiRequest;
