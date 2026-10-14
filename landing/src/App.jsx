import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { LandingConfigProvider } from "./context/LandingConfigContext";
import TopBarNotification from "./pages/TopBarComponents/TopBarNotification";
import TopBarMail from "./pages/TopBarComponents/TopBarMail";
import Dashboard from "./pages/Dashboard";
import JobDetail from "./pages/JobDetail";
import Login from "./pages/Login";
import PaymentSuccess from "./pages/PaymentSuccess";
import WhatsAppChannelFloatingIcon from "./components/WhatsAppChannelFloatingIcon";

// NOTE: BrowserRouter is in main.jsx — DO NOT add it here

// Global payment redirect handler - catches payment redirects on any page
function PaymentRedirectHandler() {
  const location = useLocation();

  useEffect(() => {
    // Skip if already on payment-success page
    if (window.location.pathname === "/payment-success") {
      return;
    }

    const checkAndRedirect = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get("orderId") || urlParams.get("order_id");
      const applicationId = urlParams.get("applicationId");
      const payment = urlParams.get("payment");
      const paymentStatus = urlParams.get("payment_status") || urlParams.get("txStatus") || urlParams.get("tx_status");
      const paymentId = urlParams.get("paymentId") || urlParams.get("razorpay_payment_id");

      // Get data from sessionStorage first
      const pendingData = sessionStorage.getItem("pendingApplication");

      // IMPORTANT: Do NOT redirect based on pendingData alone (it can be stale and breaks navigation).
      // Only redirect when the URL indicates a payment return.
      const hasPaymentParams =
        orderId ||
        applicationId ||
        paymentId ||
        payment === "success" ||
        paymentStatus === "SUCCESS" ||
        paymentStatus === "success";

      if (hasPaymentParams) {
        // Get payment status to check if payment failed
        const txStatus = urlParams.get("txStatus") || urlParams.get("tx_status") || urlParams.get("payment_status") || "";

        // Don't redirect if payment explicitly failed
        if (txStatus === "FAILED" || txStatus === "failed" || txStatus === "CANCELLED" || txStatus === "cancelled") {
          return;
        }

        let finalApplicationId = applicationId || "";
        let finalOrderId = orderId || "";

        // Try to get from sessionStorage if not in URL
        if (pendingData) {
          try {
            const data = JSON.parse(pendingData);
            if (!finalApplicationId) {
              finalApplicationId = data.applicationId || data.applicationData?._id || "";
            }
            if (!finalOrderId) {
              finalOrderId = data.orderId || "";
            }
          } catch (e) {
            console.error("Error parsing pendingData:", e);
          }
        }

        // Only redirect if we have at least applicationId (from URL or sessionStorage)
        if (finalApplicationId) {
          // Build redirect URL
          const redirectUrl = `/payment-success?orderId=${finalOrderId}&applicationId=${finalApplicationId}`;
          console.log("🌐 GLOBAL PAYMENT REDIRECT: Redirecting to", redirectUrl, {
            hasPaymentParams,
            hasPendingData: !!pendingData,
            finalApplicationId,
            finalOrderId,
            currentPath: window.location.pathname,
            search: window.location.search
          });

          // Redirect immediately
          window.location.replace(redirectUrl);
          return true; // Indicate redirect happened
        }
      }
      return false;
    };

    // Run immediately on mount and on location change
    checkAndRedirect();
  }, [location]);

  return null;
}

function App() {
  // Log to identify landing app
  console.log("🌐 Landing App Running on Port 5174");

  return (
    <LandingConfigProvider>

      <PaymentRedirectHandler />
      
      {/* WhatsApp Channel Icon */}
      <WhatsAppChannelFloatingIcon />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/topbar-notifications" element={<TopBarNotification />} />
        <Route path="/mail" element={<TopBarMail />} />
        <Route path="/job-postings/view/:id" element={<JobDetail />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />

        {/* All JSS Abhiyan pages — Dashboard reads URL and shows correct page */}
        <Route path="/home" element={<Dashboard />} />
        <Route path="/about" element={<Dashboard />} />
        <Route path="/feeds" element={<Dashboard />} />
        <Route path="/membership" element={<Dashboard />} />
        <Route path="/services" element={<Dashboard />} />
        <Route path="/jobs" element={<Dashboard />} />
        <Route path="/news" element={<Dashboard />} />
        <Route path="/notifications" element={<Dashboard />} />
        <Route path="/gallery" element={<Dashboard />} />
        <Route path="/verification" element={<Dashboard />} />
        <Route path="/contacts" element={<Dashboard />} />
        <Route path="/privacy-policy" element={<Dashboard />} />
        <Route path="/terms-of-service" element={<Dashboard />} />


        <Route path="*" element={<Dashboard />} />
      </Routes>
    </LandingConfigProvider>
  );
}

export default App;
