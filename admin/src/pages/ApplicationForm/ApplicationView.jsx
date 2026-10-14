import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  FileText,
  CheckCircle2,
  XCircle,
  Calendar,
  Building,
  CreditCard,
  Download,
} from "lucide-react";
import { applicationsAPI, jobPostingsAPI, paymentsAPI } from "../../utils/api";
import logo1 from "../../assets/jss.png";
import img0 from "../../assets/img0.png";

const ApplicationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [jobPosting, setJobPosting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  console.log(jobPosting)
  const normalizePaymentStatus = (status) =>
    String(status || "pending").toLowerCase();

  const getPostingId = (jobPostingId) => {
    if (!jobPostingId) return null;
    if (typeof jobPostingId === "string") return jobPostingId;
    if (typeof jobPostingId === "object") return jobPostingId._id || null;
    return null;
  };

  useEffect(() => {
    const fetchApplication = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await applicationsAPI.getById(id);
        if (response.success && response.data) {
          const app = response.data.application;
          setApplication({
            id: app._id,
            candidateName: app.candidateName,
            fatherName: app.fatherName,
            motherName: app.motherName,
            dob: app.dob,
            gender: app.gender,
            nationality: app.nationality,
            category: app.category,
            aadhar: app.aadhar,
            pan: app.pan,
            mobile: app.mobile,
            email: app.email,
            address: app.address,
            state: app.state,
            district: app.district,
            block: app.block,
            panchayat: app.panchayat,
            pincode: app.pincode,
            higherEducation: app.higherEducation,
            board: app.board,
            marks: app.marks,
            markPercentage: app.markPercentage,
            applicationNumber: app.applicationNumber,
            photo: app.photo,
            signature: app.signature,
            status: app.status,
            paymentStatus: app.paymentStatus || "pending",
            createdAt: app.createdAt,
            updatedAt: app.updatedAt,
            createdBy: app.createdBy,
            jobPostingId: getPostingId(app.jobPostingId),
            resolvedJobPostingId: getPostingId(app.resolvedJobPostingId),
          });

          // Fetch job posting details if available
          const postingId =
            getPostingId(app.jobPostingId) || getPostingId(app.resolvedJobPostingId);
          if (postingId) {
            try {
              const jobResponse = await jobPostingsAPI.getById(postingId);
              if (jobResponse.success && jobResponse.data) {
                setJobPosting(jobResponse.data.posting);
              }
            } catch (jobErr) {
              console.error("Error fetching job posting:", jobErr);
            }
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load application");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id]);


  // ── PDF Download Function ────────────────────────────────────────────────────
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  };

  const urlToBase64 = async (url) => {
    if (!url || url.startsWith("data:")) return url;
    try {
      // Force https only when the site itself runs on https (live). On localhost the
      // backend serves plain http, so upgrading would break the photo/signature fetch.
      const secureUrl = window.location.protocol === "https:" ? url.replace(/^http:\/\//i, 'https://') : url;
      const res = await fetch(secureUrl, { mode: "cors" });
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Base64 conversion failed:", err);
      return url;
    }
  };

  const downloadApplicationPDF = async () => {
    if (!application) return;

    setDownloadingPDF(true);
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

      const originalOverflow = container.style.overflow;
      const originalMaxHeight = container.style.maxHeight;
      container.style.overflow = "visible";
      container.style.maxHeight = "none";
      container.style.height = "auto";

      const images = container.querySelectorAll("img");

      // Convert all images to Base64 first
      await Promise.all(
        Array.from(images).map(async (img) => {
          if (img.src && !img.src.startsWith("data:")) {
            const base64 = await urlToBase64(img.src);
            img.src = base64;
          }
        })
      );

      // Wait for all newly set base64 images to load
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
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

      // A4 size: 210mm x 297mm
      const pdf = new jsPDF({
        unit: "mm",
        format: [210, 297],
        orientation: "portrait",
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 5;
      const imgWidth = pdfWidth - 2 * margin;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Ensure content fits on single A4 page
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

      const appNumber = application.applicationNumber || application.id || "APP";
      pdf.save(`Application_Slip_${appNumber}.pdf`);
    } catch (err) {
      alert(
        "Failed to generate PDF: " + (err.message || "Unknown error"),
      );
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handlePayNow = async () => {
    if (!application) return;

    const jobPostingId =
      getPostingId(application.jobPostingId) ||
      getPostingId(application.resolvedJobPostingId);
    if (!jobPostingId) {
      alert("Job posting ID missing in application. Please contact support.");
      return;
    }
    if (!application.gender || !application.category) {
      alert("Application gender/category details are missing.");
      return;
    }

    try {
      setProcessingPayment(true);
      await loadScript("https://checkout.razorpay.com/v1/checkout.js");

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }

      const orderResponse = await paymentsAPI.createOrder(
        jobPostingId,
        application.gender,
        application.category,
        application.id,
        null // Token will be automatically pulled from localStorage via apiRequest
      );

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.error || "Failed to create payment order");
      }

      const { orderId, amount, amountInRupees, keyId } = orderResponse.data;
      const options = {
        key: keyId,
        amount,
        currency: "INR",
        name: "JSSA Application Fee",
        description: `Application Fee - Rs ${amountInRupees}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyResponse = await paymentsAPI.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              application.id,
              null // Token from localStorage
            );

            if (!verifyResponse.success) {
              throw new Error(
                verifyResponse.error || "Payment verification failed",
              );
            }

            alert("Payment successful");
            window.location.reload();
          } catch (verifyError) {
            alert(
              verifyError.message || "Payment verification failed. Please try again.",
            );
            setProcessingPayment(false);
          }
        },
        theme: { color: "#3AB000" },
        modal: {
          ondismiss: () => setProcessingPayment(false),
        },
        notes: {
          applicationId: application.id,
          jobPostingId,
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", () => {
        setProcessingPayment(false);
      });
      razorpay.open();
    } catch (payError) {
      alert(payError.message || "Failed to initiate payment");
      setProcessingPayment(false);
    }
  };

  // ── Skeleton ──────────────────────────────────────────────────────────────

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout activePath="/application-form">
        <div className="ml-6 animate-pulse space-y-4">
          <div className="h-7 bg-gray-200 rounded w-1/4 mb-2" />
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-200 h-28 w-full" />
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-4 bg-gray-200 rounded ${i % 2 === 0 ? "w-3/4" : "w-1/2"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Error State ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout activePath="/application-form">
        <div className="ml-6 flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-gray-500 font-medium mb-4">{error}</p>
          <button
            onClick={() => navigate("/application-form")}
            className="bg-[#4D7C0F] text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-[#3F6212] transition-colors"
          >
            ← Back to List
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Not Found ─────────────────────────────────────────────────────────────
  if (!application) {
    return (
      <DashboardLayout activePath="/application-form">
        <div className="ml-6 flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-gray-500 font-medium mb-4">
            Application not found.
          </p>
          <button
            onClick={() => navigate("/application-form")}
            className="bg-[#4D7C0F] text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-[#3F6212] transition-colors"
          >
            ← Back to List
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const paymentStatus = normalizePaymentStatus(application.paymentStatus);
  const isPaid = paymentStatus === "paid";
  const isPendingPayment = paymentStatus === "pending" || paymentStatus === "failed";
  const canInitiatePayment =
    !!(getPostingId(application.jobPostingId) || getPostingId(application.resolvedJobPostingId)) &&
    !!application.gender &&
    !!application.category;
  const statusColors = {
    paid: "bg-green-50 text-green-700 border-green-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  };

  const statusLabel =
    paymentStatus === "paid"
      ? "Paid"
      : paymentStatus === "pending"
        ? "Payment Pending"
        : "Payment " + paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1);
  const fmtDateTime = (v) =>
    v
      ? new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "—";
  const fmtDate = (v) =>
    v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <DashboardLayout activePath="/application-form">
      <div className="av-page ml-6 pb-8">
        <style>{AV_STYLES}</style>

        {/* ── Breadcrumb + Actions ── */}
        <div className="av-topbar">
          <div className="av-crumb">
            <button onClick={() => navigate("/application-form")} className="av-crumb-link">
              <ArrowLeft className="w-3.5 h-3.5" />
              Application Form
            </button>
            <span className="av-crumb-sep">/</span>
            <span className="av-crumb-current">{application.candidateName}</span>
          </div>

          <div className="flex items-center gap-2">
            {isPendingPayment ? (
              <button
                onClick={handlePayNow}
                disabled={processingPayment || !canInitiatePayment}
                title={canInitiatePayment ? "Proceed to payment" : "Required payment details are missing"}
                className="av-btn av-btn-primary"
              >
                <CreditCard className="w-4 h-4" />
                {processingPayment ? "Processing..." : "Pay Now"}
              </button>
            ) : (
              <button onClick={downloadApplicationPDF} disabled={downloadingPDF} className="av-btn av-btn-outline">
                <Download className="w-4 h-4" />
                {downloadingPDF ? "Generating..." : "Download PDF"}
              </button>
            )}
          </div>
        </div>

        {/* ── Hero Card ── */}
        <section className="av-card av-hero-card">
          <div className="av-hero">
            <div className="av-hero-main">
              {application.photo ? (
                <img
                  src={application.photo}
                  alt={application.candidateName}
                  className="av-avatar"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="av-avatar av-avatar-fallback">
                  {application.candidateName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="av-hero-text">
                <p className="av-hero-kicker">Candidate Application</p>
                <h1 className="av-hero-name">{application.candidateName}</h1>
                <p className="av-hero-sub">
                  Application No. <strong>{application.applicationNumber || "N/A"}</strong>
                </p>
              </div>
            </div>
            <span className={`av-status av-status-${isPaid ? "paid" : paymentStatus === "pending" ? "pending" : "failed"}`}>
              {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {statusLabel}
            </span>
          </div>

          {/* Quick Info Strip */}
          <div className="av-quick">
            <QuickInfo icon={<User className="w-4 h-4" />} label="Father's Name" value={application.fatherName} />
            <QuickInfo icon={<Phone className="w-4 h-4" />} label="Mobile" value={application.mobile} />
            <QuickInfo icon={<MapPin className="w-4 h-4" />} label="District" value={application.district} />
            <QuickInfo icon={<GraduationCap className="w-4 h-4" />} label="Education" value={application.higherEducation} />
          </div>
        </section>

        {isPendingPayment && (
          <div className="av-notice">
            <CreditCard className="w-5 h-5 flex-shrink-0" />
            <div>
              <strong>Payment pending.</strong> Your application will be processed after the fee is paid.
              {!canInitiatePayment && " Some required details are missing, so online payment is not available yet."}
            </div>
          </div>
        )}

        {/* ── Body Grid ── */}
        <div className="av-grid">
          {/* Left column */}
          <div className="av-col">
            <DetailCard icon={<User className="w-4 h-4" />} title="Personal Information">
              <InfoTable
                rows={[
                  ["Candidate Name", application.candidateName],
                  ["Father's Name", application.fatherName],
                  ["Mobile Number", application.mobile],
                  ["District", application.district],
                  ["Higher Education", application.higherEducation],
                ]}
              />
            </DetailCard>

            <DetailCard icon={<FileText className="w-4 h-4" />} title="Application Details">
              <InfoTable
                rows={[
                  ["Application Number", application.applicationNumber || "—"],
                  [
                    "Payment Status",
                    <span className={`av-status av-status-sm av-status-${isPaid ? "paid" : paymentStatus === "pending" ? "pending" : "failed"}`}>
                      {statusLabel}
                    </span>,
                  ],
                  ["Created At", fmtDateTime(application.createdAt)],
                  ["Last Updated", fmtDateTime(application.updatedAt)],
                ]}
              />
            </DetailCard>

            {(application.photo || application.signature) && (
              <DetailCard icon={<FileText className="w-4 h-4" />} title="Documents">
                <div className="av-docs">
                  {application.photo && (
                    <figure className="av-doc">
                      <img
                        src={application.photo}
                        alt="Candidate Photo"
                        className="av-doc-img object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <figcaption>Photo</figcaption>
                    </figure>
                  )}
                  {application.signature && (
                    <figure className="av-doc">
                      <img
                        src={application.signature}
                        alt="Candidate Signature"
                        className="av-doc-img object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <figcaption>Signature</figcaption>
                    </figure>
                  )}
                </div>
              </DetailCard>
            )}
          </div>

          {/* Right column */}
          <div className="av-col">
            <DetailCard icon={<Calendar className="w-4 h-4" />} title="Timeline">
              <ol className="av-timeline">
                <li>
                  <span className="av-dot" />
                  <div>
                    <p className="av-tl-label">Application Submitted</p>
                    <p className="av-tl-date">{fmtDate(application.createdAt)}</p>
                  </div>
                </li>
                <li>
                  <span className={`av-dot ${isPaid ? "" : "av-dot-muted"}`} />
                  <div>
                    <p className="av-tl-label">{isPaid ? "Fee Paid" : "Fee Payment Pending"}</p>
                    <p className="av-tl-date">{isPaid ? "Completed" : "Awaiting payment"}</p>
                  </div>
                </li>
                <li>
                  <span className="av-dot av-dot-muted" />
                  <div>
                    <p className="av-tl-label">Last Updated</p>
                    <p className="av-tl-date">{fmtDate(application.updatedAt)}</p>
                  </div>
                </li>
              </ol>
            </DetailCard>

            {application.createdBy && (
              <DetailCard icon={<User className="w-4 h-4" />} title="Account">
                <div className="av-rows">
                  {application.createdBy.email && <Row label="Email" value={application.createdBy.email} />}
                  {application.createdBy.phone && <Row label="Phone" value={application.createdBy.phone} />}
                  {application.createdBy.role && (
                    <Row label="Role" value={application.createdBy.role} valueClass="av-row-v capitalize" />
                  )}
                </div>
              </DetailCard>
            )}
          </div>
        </div>

        {/* ── Back Button ── */}
        <div>
          <button onClick={() => navigate("/application-form")} className="av-back">
            <ArrowLeft className="w-4 h-4" />
            Back to Applications
          </button>
        </div>
        {/* ── Hidden Application Slip for PDF (New Format) ── */}
        <div
          className="slp-root" id="application-slip-pdf"
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            background: "#fff",
            fontFamily: "'Times New Roman', Times, serif",
            color: "#111",
            maxWidth: "900px",
            width: "900px",
            margin: "0 auto",
            padding: "14px 60px 22px 60px",
            boxSizing: "border-box",
            fontSize: "13px",
          }}
        >
          <style>{SLIP_THEME_CSS}</style>
          {/* Print Bar */}
          <div className="slp-printbar"
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11.5px",
              color: "#444",
              paddingBottom: "6px",
              marginBottom: "14px",
            }}
          >
            <span>
              {new Date(application?.createdAt).toLocaleString("en-US", {
                month: "numeric",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
            <span>
              Application Slip -{" "}
              {jobPosting?.postTitle?.en || jobPosting?.post?.en || "Recruitment"} {jobPosting?.advtNo?.match(/\b(19|20)\d{2}\b/)?.[0] || ""}
            </span>
          </div>

          {/* Big Logo - Full Width */}
          <div
            style={{
              width: "100%",
              marginBottom: "12px",
            }}
          >
            <img
              src={img0}
              alt="Jan Swasthya Sahayata Abhiyan"
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          {/* Post Title Banner */}
          <div className="slp-banner"
            style={{
              border: "1px solid #555",
              textAlign: "center",
              padding: "5px 0",
              fontWeight: "bold",
              fontSize: "14px",
              marginBottom: "6px",
            }}
          >
            {jobPosting?.postTitle?.en || jobPosting?.post?.en || "Recruitment"}
          </div>

          {/* Advt / Application Slip / Date Strip */}
          <div className="slp-strip"
            style={{
              border: "1px solid #555",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 12px",
              marginBottom: "10px",
              fontSize: "13px",
            }}
          >
            <span>
              <strong>Advt. No.:</strong> {jobPosting?.advtNo || ""}
            </span>
            <span className="slp-strip-title"
              style={{
                fontWeight: "bold",
                fontSize: "15px",
              }}
            >
              Application Slip
            </span>
            <span>
              <strong>Date:</strong>{" "}
              {new Date(application?.createdAt).toLocaleString("en-US", {
                month: "numeric",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </span>
          </div>

          {/* Post Applied + Application Number */}
          <div className="slp-post"
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
              fontSize: "14px",
            }}
          >
            <span>
              <strong>Post Applied for:</strong>{" "}
              {jobPosting?.postTitle?.en || jobPosting?.post?.en || ""}
            </span>
            <span>
              <strong>Application No.:</strong> {application.applicationNumber || "N/A"}
            </span>
          </div>

          {/* Personal Details Heading */}
          <div className="slp-sec"
            style={{
              fontWeight: "bold",
              fontSize: "14px",
              marginBottom: "5px",
            }}
          >
            &nbsp;Personal Details
          </div>

          {/* Personal Details Table + Photo Box */}
          <div
            style={{
              display: "flex",
              gap: "14px",
              marginBottom: "4px",
              alignItems: "flex-start",
            }}
          >
            <table
              style={{
                borderCollapse: "collapse",
                flex: 1,
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      fontWeight: "bold",
                      paddingRight: "16px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: "190px",
                      fontSize: "13px",
                    }}
                  >
                    Name:
                  </td>
                  <td
                    style={{
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      fontSize: "13px",
                      lineHeight: "1.45",
                    }}
                  >
                    {(application.candidateName || "").toUpperCase()}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      fontWeight: "bold",
                      paddingRight: "16px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: "190px",
                      fontSize: "13px",
                    }}
                  >
                    Father's Name:
                  </td>
                  <td
                    style={{
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      fontSize: "13px",
                      lineHeight: "1.45",
                    }}
                  >
                    {(application.fatherName || "").toUpperCase()}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      fontWeight: "bold",
                      paddingRight: "16px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: "190px",
                      fontSize: "13px",
                    }}
                  >
                    Mother's Name:
                  </td>
                  <td
                    style={{
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      fontSize: "13px",
                      lineHeight: "1.45",
                    }}
                  >
                    {(application.motherName || "").toUpperCase()}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      fontWeight: "bold",
                      paddingRight: "16px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: "190px",
                      fontSize: "13px",
                    }}
                  >
                    Date of Birth:
                  </td>
                  <td
                    style={{
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      fontSize: "13px",
                      lineHeight: "1.45",
                    }}
                  >
                    {application.dob
                      ? new Date(application.dob).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                      : ""}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      fontWeight: "bold",
                      paddingRight: "16px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: "190px",
                      fontSize: "13px",
                    }}
                  >
                    Gender:
                  </td>
                  <td
                    style={{
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      fontSize: "13px",
                      lineHeight: "1.45",
                    }}
                  >
                    {application.gender?.charAt(0).toUpperCase() +
                      application.gender?.slice(1) || ""}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      fontWeight: "bold",
                      paddingRight: "16px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: "190px",
                      fontSize: "13px",
                    }}
                  >
                    Nationality:
                  </td>
                  <td
                    style={{
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      fontSize: "13px",
                      lineHeight: "1.45",
                    }}
                  >
                    {application.nationality?.charAt(0).toUpperCase() +
                      application.nationality?.slice(1) || ""}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      fontWeight: "bold",
                      paddingRight: "16px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: "190px",
                      fontSize: "13px",
                    }}
                  >
                    Category:
                  </td>
                  <td
                    style={{
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      fontSize: "13px",
                      lineHeight: "1.45",
                    }}
                  >
                    {(application.category || "").toUpperCase()}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      fontWeight: "bold",
                      paddingRight: "16px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: "190px",
                      fontSize: "13px",
                    }}
                  >
                    Aadhar Number:
                  </td>
                  <td
                    style={{
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      fontSize: "13px",
                      lineHeight: "1.45",
                    }}
                  >
                    {application.aadhar || ""}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      fontWeight: "bold",
                      paddingRight: "16px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: "190px",
                      fontSize: "13px",
                    }}
                  >
                    PAN Number:
                  </td>
                  <td
                    style={{
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      fontSize: "13px",
                      lineHeight: "1.45",
                    }}
                  >
                    {(application.pan || "").toUpperCase()}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      fontWeight: "bold",
                      paddingRight: "16px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: "190px",
                      fontSize: "13px",
                    }}
                  >
                    Mobile Number:
                  </td>
                  <td
                    style={{
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      fontSize: "13px",
                      lineHeight: "1.45",
                    }}
                  >
                    {application.mobile || ""}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      fontWeight: "bold",
                      paddingRight: "16px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: "190px",
                      fontSize: "13px",
                    }}
                  >
                    Email ID:
                  </td>
                  <td
                    style={{
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      fontSize: "13px",
                      lineHeight: "1.45",
                    }}
                  >
                    {application.email || ""}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      fontWeight: "bold",
                      paddingRight: "16px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: "190px",
                      fontSize: "13px",
                    }}
                  >
                    Permanent Address:
                  </td>
                  <td
                    style={{
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      fontSize: "13px",
                      lineHeight: "1.45",
                    }}
                  >
                    {(application.address || "").toUpperCase()}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      fontWeight: "bold",
                      paddingRight: "16px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: "190px",
                      fontSize: "13px",
                    }}
                  >
                    State:
                  </td>
                  <td
                    style={{
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      verticalAlign: "top",
                      fontSize: "13px",
                      lineHeight: "1.45",
                    }}
                  >
                    {application.state || ""}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Photo Box */}
            <div className="slp-box"
              style={{
                flexShrink: 0,
                width: "132px",
                height: "158px",
                border: "1px solid #888",
                background: "#ffffff",
              }}
            >
              {application.photo ? (
                <img
                  src={application.photo}
                  alt="Applicant Photo"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : null}
            </div>
          </div>

          {/* Pincode Row */}
          <table
            style={{
              borderCollapse: "collapse",
              marginBottom: "14px",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    fontWeight: "bold",
                    paddingRight: "16px",
                    paddingTop: "3px",
                    paddingBottom: "3px",
                    verticalAlign: "top",
                    whiteSpace: "nowrap",
                    width: "190px",
                    fontSize: "13px",
                  }}
                >
                  Pincode:
                </td>
                <td
                  style={{
                    paddingTop: "3px",
                    paddingBottom: "3px",
                    verticalAlign: "top",
                    fontSize: "13px",
                    lineHeight: "1.45",
                  }}
                >
                  {application.pincode || ""}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Educational Details Heading */}
          <div className="slp-sec"
            style={{
              fontWeight: "bold",
              fontSize: "14px",
              marginBottom: "5px",
            }}
          >
            &nbsp;Educational Details
          </div>

          <table
            style={{
              borderCollapse: "collapse",
              marginBottom: "18px",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    fontWeight: "bold",
                    paddingRight: "16px",
                    paddingTop: "3px",
                    paddingBottom: "3px",
                    verticalAlign: "top",
                    whiteSpace: "nowrap",
                    width: "190px",
                    fontSize: "13px",
                  }}
                >
                  Higher Education:
                </td>
                <td
                  style={{
                    paddingTop: "3px",
                    paddingBottom: "3px",
                    verticalAlign: "top",
                    fontSize: "13px",
                    lineHeight: "1.45",
                  }}
                >
                  {application.higherEducation || ""}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    fontWeight: "bold",
                    paddingRight: "16px",
                    paddingTop: "3px",
                    paddingBottom: "3px",
                    verticalAlign: "top",
                    whiteSpace: "nowrap",
                    width: "190px",
                    fontSize: "13px",
                  }}
                >
                  Board/University:
                </td>
                <td
                  style={{
                    paddingTop: "3px",
                    paddingBottom: "3px",
                    verticalAlign: "top",
                    fontSize: "13px",
                    lineHeight: "1.45",
                  }}
                >
                  {application.board || ""}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    fontWeight: "bold",
                    paddingRight: "16px",
                    paddingTop: "3px",
                    paddingBottom: "3px",
                    verticalAlign: "top",
                    whiteSpace: "nowrap",
                    width: "190px",
                    fontSize: "13px",
                  }}
                >
                  Total Marks:
                </td>
                <td
                  style={{
                    paddingTop: "3px",
                    paddingBottom: "3px",
                    verticalAlign: "top",
                    fontSize: "13px",
                    lineHeight: "1.45",
                  }}
                >
                  {application.marks || ""}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    fontWeight: "bold",
                    paddingRight: "16px",
                    paddingTop: "3px",
                    paddingBottom: "3px",
                    verticalAlign: "top",
                    whiteSpace: "nowrap",
                    width: "190px",
                    fontSize: "13px",
                  }}
                >
                  Marks in Percentage:
                </td>
                <td
                  style={{
                    paddingTop: "3px",
                    paddingBottom: "3px",
                    verticalAlign: "top",
                    fontSize: "13px",
                    lineHeight: "1.45",
                  }}
                >
                  {application.markPercentage || ""}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Declaration Checkboxes */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              marginBottom: "10px",
              fontSize: "13px",
            }}
          >
            <input
              type="checkbox"
              defaultChecked
              style={{
                marginTop: "2px",
                flexShrink: 0,
                width: "14px",
                height: "14px",
              }}
            />
            <span>I have read and agree to the Terms and Conditions.</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              marginBottom: "24px",
              lineHeight: "1.65",
              fontSize: "13px",
            }}
          >
            <input
              type="checkbox"
              defaultChecked
              style={{
                marginTop: "2px",
                flexShrink: 0,
                width: "14px",
                height: "14px",
              }}
            />
            <span>
              I declare that all the information given in this application form is
              correct to the best of my knowledge and belief. If any information
              provided is found false, my candidature may be rejected at any point
              of time. I have read and understood the conditions which I would abide
              by. Thus, I have given the above declaration in my full consciousness
              without any pressure.
            </span>
          </div>

          {/* Signature Box */}
          <div className="slp-sig"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                textAlign: "center",
              }}
            >
              <div
                style={{
                  border: "1px solid #aaa",
                  width: "145px",
                  height: "62px",
                  background: "#ffffff",
                  marginBottom: "4px",
                }}
              >
                {application.signature ? (
                  <img
                    src={application.signature}
                    alt="Signature"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                ) : null}
              </div>
              <div
                style={{
                  fontSize: "13px",
                }}
              >
                Candidate's Signature
              </div>
            </div>
          </div>

          {/* Bottom Summary Table */}
          <table className="slp-sum"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            <thead>
              <tr>
                {["Application No.:", "Email:", "Payment Status:", "Date:"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        border: "1px solid #555",
                        padding: "6px 10px",
                        fontWeight: "bold",
                        background: "#fff",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  style={{
                    border: "1px solid #555",
                    padding: "6px 10px",
                  }}
                >
                  {application.applicationNumber || "N/A"}
                </td>
                <td
                  style={{
                    border: "1px solid #555",
                    padding: "6px 10px",
                  }}
                >
                  {application.email || ""}
                </td>
                <td
                  style={{
                    border: "1px solid #555",
                    padding: "6px 10px",
                  }}
                >
                  {application.paymentStatus === "paid" ? "Complete" : "Pending"}
                </td>
                <td
                  style={{
                    border: "1px solid #555",
                    padding: "6px 10px",
                  }}
                >
                  {new Date(application?.createdAt).toLocaleString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer URL */}
          <div className="slp-foot"
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "#555",
              borderTop: "1px solid #ddd",
              paddingTop: "6px",
            }}
          >
            <span>
              https://jssabhiyan.com/fill_application_print?oid={application.id || ""}
            </span>
            <span>1/1</span>
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
};

// ── Small helpers ─────────────────────────────────────────────────────────────

// Landing-site palette: dark-green #3F6212, green #4D7C0F.
const AV_STYLES = `
.av-page{font-family:'Segoe UI',sans-serif;color:#1f2937;display:flex;flex-direction:column;gap:16px;}
.av-topbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;}
.av-crumb{display:flex;align-items:center;gap:8px;font-size:14px;min-width:0;}
.av-crumb-link{display:flex;align-items:center;gap:6px;color:#4D7C0F;font-weight:700;background:none;border:0;cursor:pointer;padding:0;}
.av-crumb-link:hover{text-decoration:underline;}
.av-crumb-sep{color:#94a3b8;}
.av-crumb-current{color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px;}
.av-btn{display:inline-flex;align-items:center;gap:8px;border-radius:6px;padding:10px 18px;font-size:13px;font-weight:800;cursor:pointer;transition:background .15s,color .15s,box-shadow .15s;}
.av-btn:disabled{opacity:.55;cursor:not-allowed;}
.av-btn-primary{background:#4D7C0F;color:#fff;border:1px solid #4D7C0F;box-shadow:0 4px 12px rgba(77,124,15,.25);}
.av-btn-primary:hover:not(:disabled){background:#3F6212;border-color:#3F6212;}
.av-btn-outline{background:#fff;color:#4D7C0F;border:1px solid #4D7C0F;}
.av-btn-outline:hover:not(:disabled){background:#4D7C0F;color:#fff;}
.av-card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.04);overflow:hidden;}
.av-hero{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:14px;padding:24px 26px;color:#fff;
  background:linear-gradient(100deg,#1A2E05 0%,#3F6212 55%,#4D7C0F 100%);position:relative;}
.av-hero::after{content:"";position:absolute;right:-60px;top:-60px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,.06);pointer-events:none;}
.av-hero-main{display:flex;align-items:center;gap:18px;min-width:0;flex:1;}
.av-avatar{width:84px;height:84px;border-radius:50%;object-fit:cover;border:4px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.25);flex-shrink:0;background:#fff;}
.av-avatar-fallback{display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.15);color:#fff;font-size:30px;font-weight:800;}
.av-hero-text{flex:1;min-width:0;}
.av-hero-kicker{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#D9F99D;font-weight:700;margin:0 0 4px;}
.av-hero-name{font-size:26px;line-height:1.15;font-weight:800;margin:0 0 6px;word-break:break-word;}
.av-hero-sub{font-size:13px;color:#D9F99D;margin:0;}
.av-hero-sub strong{color:#fff;letter-spacing:.03em;}
.av-status{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;font-size:12px;font-weight:800;border:1px solid;white-space:nowrap;position:relative;z-index:1;}
.av-status-sm{padding:3px 10px;font-size:11px;}
.av-status-paid{background:#ecfdf5;color:#047857;border-color:#a7f3d0;}
.av-status-pending{background:#fffbeb;color:#b45309;border-color:#fde68a;}
.av-status-failed{background:#fef2f2;color:#b91c1c;border-color:#fecaca;}
.av-quick{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));}
.av-quick-item{display:flex;align-items:flex-start;gap:12px;padding:16px 20px;border-right:1px solid #D9F99D;min-width:0;}
.av-quick-item:last-child{border-right:0;}
.av-quick-ic{width:36px;height:36px;border-radius:8px;background:#ECFCCB;color:#4D7C0F;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.av-quick-l{font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin:0;}
.av-quick-v{font-size:14px;color:#3F6212;font-weight:700;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.av-notice{display:flex;gap:12px;align-items:flex-start;background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;color:#92400e;border-radius:8px;padding:12px 16px;font-size:13px;line-height:1.5;}
.av-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(260px,1fr);gap:16px;align-items:start;}
.av-col{display:flex;flex-direction:column;gap:16px;min-width:0;}
.av-card-h{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid #D9F99D;}
.av-card-ic{width:30px;height:30px;border-radius:7px;background:#ECFCCB;color:#4D7C0F;display:flex;align-items:center;justify-content:center;}
.av-card-h h2{font-size:15px;font-weight:800;color:#3F6212;margin:0;}
.av-card-b{padding:6px 18px 14px;}
.av-table{width:100%;font-size:14px;border-collapse:collapse;}
.av-table tr{border-bottom:1px solid #f1f5f9;}
.av-table tr:last-child{border-bottom:0;}
.av-table td{padding:11px 0;vertical-align:top;}
.av-table td:first-child{color:#64748b;font-weight:600;width:42%;padding-right:16px;}
.av-table td:last-child{color:#1f2937;font-weight:700;word-break:break-word;}
.av-docs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;padding-top:10px;}
.av-doc{margin:0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#f8fafc;}
.av-doc-img{width:100%;height:190px;display:block;background:#fff;}
.av-doc figcaption{font-size:12px;font-weight:700;color:#3F6212;padding:8px 12px;border-top:1px solid #e5e7eb;background:#fff;}
.av-timeline{list-style:none;margin:0;padding:10px 0 0;position:relative;}
.av-timeline li{display:flex;gap:12px;position:relative;padding-bottom:16px;}
.av-timeline li:last-child{padding-bottom:0;}
.av-timeline li:not(:last-child)::before{content:"";position:absolute;left:6px;top:16px;bottom:0;width:2px;background:#D9F99D;}
.av-dot{width:14px;height:14px;border-radius:50%;background:#4D7C0F;border:3px solid #D9F99D;flex-shrink:0;margin-top:2px;box-sizing:border-box;}
.av-dot-muted{background:#cbd5e1;border-color:#f1f5f9;}
.av-tl-label{font-size:13px;font-weight:700;color:#1f2937;margin:0;}
.av-tl-date{font-size:12px;color:#64748b;margin:2px 0 0;}
.av-rows{display:flex;flex-direction:column;gap:10px;padding-top:10px;}
.av-row{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:13px;}
.av-row-l{color:#64748b;}
.av-row-v{color:#1f2937;font-weight:700;text-align:right;word-break:break-all;}
.av-back{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#64748b;background:none;border:0;cursor:pointer;padding:0;}
.av-back:hover{color:#4D7C0F;}
@media(max-width:1024px){.av-grid{grid-template-columns:1fr;}}
@media(max-width:768px){
  .av-quick{grid-template-columns:repeat(2,minmax(0,1fr));}
  .av-quick-item:nth-child(2){border-right:0;}
  .av-quick-item:nth-child(-n+2){border-bottom:1px solid #D9F99D;}
  .av-hero{padding:20px;flex-direction:column;}
  .av-hero-main{width:100%;}
  .av-quick-v{white-space:normal;word-break:break-word;}
  .av-hero-name{font-size:21px;}
  .av-avatar{width:68px;height:68px;}
}
@media(max-width:480px){
  .av-docs{grid-template-columns:1fr;}
  .av-table td:first-child{width:45%;}
  .av-crumb-current{max-width:140px;}
  .av-hero-main{gap:14px;}
  .av-quick-item{padding:14px;gap:10px;}
}
`;

const QuickInfo = ({ icon, label, value }) => (
  <div className="av-quick-item">
    <div className="av-quick-ic">{icon}</div>
    <div className="min-w-0">
      <p className="av-quick-l">{label}</p>
      <div className="av-quick-v" title={typeof value === "string" ? value : undefined}>
        {value || "—"}
      </div>
    </div>
  </div>
);

const DetailCard = ({ icon, title, children }) => (
  <section className="av-card">
    <div className="av-card-h">
      <span className="av-card-ic">{icon}</span>
      <h2>{title}</h2>
    </div>
    <div className="av-card-b">{children}</div>
  </section>
);

const InfoTable = ({ rows }) => (
  <table className="av-table">
    <tbody>
      {rows.map(([key, val]) => (
        <tr key={key}>
          <td>{key}</td>
          <td>{val || "—"}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const Row = ({ label, value, valueClass = "av-row-v" }) => (
  <div className="av-row">
    <span className="av-row-l">{label}</span>
    <span className={valueClass}>{value || "—"}</span>
  </div>
);

export default ApplicationView;

// Application slip / PDF — landing-site theme (dark-green #3F6212, green #4D7C0F, Segoe UI)
const SLIP_THEME_CSS = `
.slp-root{font-family:'Segoe UI',Arial,Helvetica,sans-serif!important;color:#1f2937!important;}
.slp-root *{font-family:inherit!important;}
.slp-printbar{color:#64748b!important;}
.slp-banner{background:#3F6212!important;color:#fff!important;border:0!important;border-radius:4px!important;padding:9px 12px!important;font-size:16px!important;letter-spacing:.02em;}
.slp-strip{background:#ECFCCB!important;border:1px solid #D9F99D!important;border-radius:4px!important;color:#1A2E05!important;}
.slp-strip strong{color:#3F6212!important;}
.slp-strip-title{color:#4D7C0F!important;font-size:17px!important;font-weight:800!important;letter-spacing:.04em;text-transform:uppercase;}
.slp-post strong{color:#3F6212!important;}
.slp-sec{background:#4D7C0F!important;color:#fff!important;padding:5px 10px!important;border-radius:3px!important;margin:12px 0 8px!important;font-size:13px!important;letter-spacing:.05em;text-transform:uppercase;}
.slp-root td[style*="font-weight: bold"]{color:#3F6212!important;}
.slp-box{border:1.5px solid #D9F99D!important;border-radius:4px!important;}
.slp-sig [style*="border"]{border:1.5px solid #D9F99D!important;border-radius:4px!important;}
.slp-root input[type="checkbox"]{accent-color:#4D7C0F;}
.slp-sum th{background:#3F6212!important;color:#fff!important;border:1px solid #3F6212!important;}
.slp-sum td{border:1px solid #D9F99D!important;}
.slp-sum tbody tr{background:#ECFCCB;}
.slp-foot{color:#64748b!important;border-top:2px solid #4D7C0F!important;}
`;
