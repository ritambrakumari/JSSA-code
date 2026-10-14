import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jobPostingsAPI } from "../utils/api.js";
import ApplicationSlip from "../components/ApplicationSlip.jsx";

const GREEN = "#4D7C0F";

// Add responsive styles
const responsiveStyles = `
  @media (max-width: 768px) {
    .payment-success-container {
      padding: 10px !important;
    }
    
    .payment-success-banner {
      padding: 16px !important;
      margin-bottom: 16px !important;
    }
    
    .payment-success-banner h1 {
      font-size: 24px !important;
      margin-bottom: 8px !important;
    }
    
    .payment-success-banner h2 {
      font-size: 16px !important;
      margin-bottom: 8px !important;
    }
    
    .payment-success-banner p {
      font-size: 14px !important;
    }
    
    .payment-success-actions {
      flex-direction: column !important;
      gap: 12px !important;
    }
    
    .payment-success-actions button {
      width: 100% !important;
      padding: 14px 20px !important;
      font-size: 15px !important;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = responsiveStyles;
  document.head.appendChild(styleSheet);
}

function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [applicationData, setApplicationData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [job, setJob] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  // Prevent any auto-redirects - ensure we stay on this page
  useEffect(() => {
    console.log("✅ PaymentSuccess page mounted/updated - staying on this page");
    const currentPath = window.location.pathname;
    if (!currentPath.includes("/payment-success")) {
      console.warn("⚠️ Warning: PaymentSuccess component loaded but URL is not payment-success:", currentPath);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("📄 PaymentSuccess page loading data...");
        const pendingData = sessionStorage.getItem("pendingApplication");
        const orderId = searchParams.get("orderId");
        const applicationId = searchParams.get("applicationId");
        console.log("PaymentSuccess - orderId:", orderId, "applicationId:", applicationId, "pendingData exists:", !!pendingData);

        await new Promise(resolve => setTimeout(resolve, 100));

        const finalPendingData = sessionStorage.getItem("pendingApplication") || pendingData;

        if (finalPendingData) {
          try {
            const data = JSON.parse(finalPendingData);
            console.log("✅ Found pending application data in sessionStorage");
            console.log("📦 Full formData keys:", Object.keys(data.formData || {}));
            console.log("📸 Photo exists:", !!data.formData?.photo, "Type:", typeof data.formData?.photo);
            console.log("✍️ Signature exists:", !!data.formData?.signature, "Type:", typeof data.formData?.signature);

            setApplicationData(data.applicationData);
            setFormData(data.formData || {});

            if (data.formData?.photo) {
              const photoSrc = data.formData.photo;
              if (typeof photoSrc === 'string' && (photoSrc.startsWith('data:') || photoSrc.startsWith('http'))) {
                setPhotoPreview(photoSrc);
                console.log("✅ Photo loaded successfully");
              } else if (typeof photoSrc === 'string') {
                setPhotoPreview(`data:image/jpeg;base64,${photoSrc}`);
                console.log("✅ Photo loaded (added data URI prefix)");
              }
            }

            if (data.formData?.signature) {
              const signatureSrc = data.formData.signature;
              if (typeof signatureSrc === 'string' && (signatureSrc.startsWith('data:') || signatureSrc.startsWith('http'))) {
                setSignaturePreview(signatureSrc);
                console.log("✅ Signature loaded successfully");
              } else if (typeof signatureSrc === 'string') {
                setSignaturePreview(`data:image/png;base64,${signatureSrc}`);
                console.log("✅ Signature loaded (added data URI prefix)");
              }
            }

            if (data.applicationData?.jobPostingId) {
              try {
                const jobResponse = await jobPostingsAPI.getById(data.applicationData.jobPostingId);
                if (jobResponse.success && jobResponse.data.posting) {
                  setJob(jobResponse.data.posting);
                }
              } catch (err) {
                console.error("Error loading job:", err);
              }
            }
            setLoading(false);
            return;
          } catch (parseErr) {
            console.error("Error parsing pendingData:", parseErr);
          }
        }

        if (applicationId) {
          console.log("📡 Fetching application from API...");
          const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "";
          if (apiUrl) {
            try {
              const response = await fetch(`${apiUrl}/applications/${applicationId}`);
              const result = await response.json();
              if (result.success && result.data.application) {
                console.log("✅ Found application in API");
                const app = result.data.application;
                setApplicationData(app);

                if (app.jobPostingId) {
                  const jobResponse = await jobPostingsAPI.getById(app.jobPostingId);
                  if (jobResponse.success && jobResponse.data.posting) {
                    setJob(jobResponse.data.posting);
                  }
                }
                setLoading(false);
                return;
              }
            } catch (err) {
              console.error("Error fetching application:", err);
            }
          }
        }

        console.warn("⚠️ PaymentSuccess: No application data found. Redirecting to home page.");
        try {
          sessionStorage.removeItem("pendingApplication");
        } catch (e) {
          // ignore
        }
        navigate("/");
      } catch (err) {
        console.error("Error loading payment success data:", err);
        setLoading(false);
      }
    };

    loadData();
  }, [searchParams]);

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, color: "#666" }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!loading && !applicationData && !formData) {
    const orderId = searchParams.get("orderId");
    const applicationId = searchParams.get("applicationId");

    if (orderId || applicationId) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f5f5",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "40px",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
              maxWidth: 500,
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: "#333" }}>
              Application Not Found
            </div>
            <div style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
              Unable to load application details. Please check your application number or contact support.
            </div>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 24 }}>
              Order ID: {orderId || "N/A"} | Application ID: {applicationId || "N/A"}
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem("pendingApplication");
                navigate("/");
              }}
              style={{
                background: GREEN,
                color: "#fff",
                border: "none",
                padding: "12px 24px",
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              🏠 Go to Home
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "40px",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            textAlign: "center",
            maxWidth: 500,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: "#333" }}>
            Invalid Payment Success Page
          </div>
          <div style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
            No payment information found. Please return to the application page.
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("pendingApplication");
              navigate("/");
            }}
            style={{
              background: GREEN,
              color: "#fff",
              border: "none",
              padding: "12px 24px",
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🏠 Go to Home
          </button>
        </div>
      </div>
    );
  }

  const finalFormData = formData || applicationData || {};
  const applicationNumber = applicationData?.applicationNumber || finalFormData?.applicationNumber || "";

  return (
    <div
      className="payment-success-container"
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "10px",
      }}
    >
      {/* Payment Success Banner */}
      <div
        className="payment-success-banner"
        style={{
          maxWidth: "900px",
          width: "100%",
          margin: "0 auto 20px",
          background: "#fff",
          borderRadius: 8,
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: GREEN,
            marginBottom: 12,
          }}
        >
          ✅ Payment Successful!
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#333",
            marginBottom: 8,
          }}
        >
          Your application has been submitted successfully
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#666",
            marginBottom: 16,
          }}
        >
          Application Number:{" "}
          <span style={{ color: GREEN, fontSize: 18 }}>
            {applicationNumber || "N/A"}
          </span>
        </div>
        <div
          style={{
            fontSize: 14,
            color: "#666",
            lineHeight: 1.6,
          }}
        >
          Please download your application slip below. Keep this application number
          for future reference.
        </div>
      </div>

      <div style={{ maxWidth: "900px", width: "100%", margin: "0 auto" }}>
        <ApplicationSlip
          applicationData={finalFormData}
          jobPosting={job}
          photoSrc={photoPreview}
          signatureSrc={signaturePreview}
        />
      </div>

      {/* Download PDF Button */}
      <div
        className="payment-success-actions"
        style={{
          display: "flex",
          gap: 12,
          padding: "15px 20px",
          justifyContent: "center",
          flexWrap: "wrap",
          background: "#fff",
          maxWidth: "900px",
          margin: "20px auto 0",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <button
          onClick={async (e) => {
            try {
              if (!window.html2canvas)
                await loadScript(
                  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
                );
              if (!window.jspdf)
                await loadScript(
                  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
                );
              await new Promise((resolve) => setTimeout(resolve, 500));
              const container = document.getElementById("application-slip-pdf");
              if (!container || !window.html2canvas || !window.jspdf) {
                alert(
                  "PDF libraries not loaded. Please wait and try again.",
                );
                return;
              }
              const button = e.target;
              const originalText = button.innerHTML;
              button.innerHTML = "⏳ Generating PDF...";
              button.disabled = true;
              try {
                const originalOverflow = container.style.overflow;
                const originalMaxHeight = container.style.maxHeight;
                container.style.overflow = "visible";
                container.style.maxHeight = "none";
                container.style.height = "auto";
                const images = container.querySelectorAll("img");
                await Promise.all(
                  Array.from(images).map((img) => {
                    if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                      return Promise.resolve();
                    }
                    return new Promise((resolve) => {
                      const timeout = setTimeout(() => {
                        console.log("Image load timeout:", img.src.substring(0, 50));
                        resolve();
                      }, 5000);
                      img.onload = () => {
                        clearTimeout(timeout);
                        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                          resolve();
                        } else {
                          setTimeout(resolve, 100);
                        }
                      };
                      img.onerror = () => {
                        clearTimeout(timeout);
                        console.error("Image failed to load:", img.src.substring(0, 50));
                        resolve();
                      };
                      if (img.src && !img.complete) {
                        const currentSrc = img.src;
                        img.src = "";
                        img.src = currentSrc;
                      }
                    });
                  }),
                );
                await new Promise((resolve) => setTimeout(resolve, 500));
                const fullHeight = Math.max(
                  container.scrollHeight,
                  container.offsetHeight,
                  container.clientHeight,
                );
                const fullWidth = Math.max(
                  container.scrollWidth,
                  container.offsetWidth,
                  container.clientWidth,
                );
                const canvas = await window.html2canvas(container, {
                  scale: 2.5,
                  useCORS: false,
                  logging: false,
                  backgroundColor: "#ffffff",
                  allowTaint: false,
                  width: fullWidth,
                  height: fullHeight,
                  windowWidth: fullWidth,
                  windowHeight: fullHeight,
                  scrollX: 0,
                  scrollY: 0,
                  removeContainer: false,
                  imageTimeout: 15000,
                });
                container.style.overflow = originalOverflow;
                container.style.maxHeight = originalMaxHeight;
                container.style.height = "";
                const { jsPDF } = window.jspdf;
                const imgData = canvas.toDataURL("image/png", 0.95);

                const pdf = new jsPDF({
                  unit: "mm",
                  format: "a4",
                  orientation: "portrait",
                });

                const pdfWidth = 210;
                const pdfHeight = 297;
                const margin = 0; // Full width - no margins
                const imgWidth = pdfWidth - 2 * margin;
                let imgHeight = (canvas.height * imgWidth) / canvas.width;

                if (imgHeight > pdfHeight - 2 * margin) {
                  const scaleFactor = (pdfHeight - 2 * margin) / imgHeight;
                  imgHeight = pdfHeight - 2 * margin;
                  const scaledWidth = imgWidth * scaleFactor;
                  const xOffset = margin + (imgWidth - scaledWidth) / 2;
                  pdf.addImage(
                    imgData,
                    "PNG",
                    xOffset,
                    margin,
                    scaledWidth,
                    imgHeight,
                  );
                } else {
                  pdf.addImage(
                    imgData,
                    "PNG",
                    margin,
                    margin,
                    imgWidth,
                    imgHeight,
                  );
                }

                pdf.save(`Application_Slip_${applicationNumber}.pdf`);
              } finally {
                button.innerHTML = originalText;
                button.disabled = false;
              }
            } catch (err) {
              alert(
                "Failed to generate PDF: " + (err.message || "Unknown error"),
              );
            }
          }}
          style={{
            background: GREEN,
            color: "#fff",
            border: "none",
            padding: "12px 24px",
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          📥 Download PDF
        </button>
        <button
          onClick={() => {
            sessionStorage.removeItem("pendingApplication");
            navigate("/");
          }}
          style={{
            background: "#4D7C0F",
            color: "#fff",
            border: "none",
            padding: "12px 24px",
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          🏠 Home
        </button>
      </div>
    </div>
  );
}

export default PaymentSuccess;
