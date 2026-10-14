import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  GraduationCap,
  IndianRupee,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Briefcase,
  Users,
  Send,
} from "lucide-react";
import { jobPostingsAPI, applicationsAPI, paymentsAPI } from "../../utils/api";
import { useAuth } from "../../auth/AuthProvider";

const JobPostingView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [posting, setPosting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null); // { applicationId, paymentStatus, gender, category }
  const [language, setLanguage] = useState("en"); // 'en' or 'hi'

  useEffect(() => {
    const fetchPosting = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await jobPostingsAPI.getById(id);
        if (response.success && response.data) {
          const post = response.data.posting;
          
          // Check if user has already applied (only for applicants)
          if (role === "applicant") {
            try {
              const checkResponse = await applicationsAPI.checkApplication(id);
              if (checkResponse.success && checkResponse.data) {
                setHasApplied(checkResponse.data.hasApplied);
                setApplicationStatus({
                  applicationId: checkResponse.data.applicationId,
                  paymentStatus: checkResponse.data.paymentStatus,
                  gender: checkResponse.data.gender,
                  category: checkResponse.data.category,
                });
              }
            } catch (err) {
              console.error("Check application error:", err);
              // Don't block the page if check fails
            }
          }
          
          // Helper to normalize bilingual fields
          const normalizeBilingual = (field) => {
            if (!field) return { en: "", hi: "" };
            if (typeof field === 'object' && field !== null) {
              return {
                en: field.en || "",
                hi: field.hi || "",
              };
            }
            // If it's a string (old format), convert to bilingual
            return {
              en: field || "",
              hi: field || "",
            };
          };
          
          // Transform to handle bilingual
          setPosting({
            id: post._id,
            advtNo: post.advtNo,
            title: normalizeBilingual(post.title),
            postTitle: normalizeBilingual(post.postTitle),
            post: normalizeBilingual(post.post),
            date: post.date,
            income: normalizeBilingual(post.income),
            incomeMin: post.incomeMin,
            incomeMax: post.incomeMax,
            education: normalizeBilingual(post.education),
            location: normalizeBilingual(post.location),
            locationArr: post.locationArr || [],
            locationArrHi: post.locationArrHi || [],
            fee: normalizeBilingual(post.fee),
            feeStructure: post.feeStructure || {},
            advertisementFile: post.advertisementFile || "",
            advertisementFileHi: post.advertisementFileHi || "",
            lastDate: post.lastDate,
            applicationOpeningDate: post.applicationOpeningDate,
            firstMeritListDate: post.firstMeritListDate,
            finalMeritListDate: post.finalMeritListDate,
            ageLimit: normalizeBilingual(post.ageLimit),
            ageAsOn: post.ageAsOn,
            selectionProcess: normalizeBilingual(post.selectionProcess),
            status: post.status,
          });
        }
      } catch (err) {
        setError(err.message || "Failed to load job posting");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosting();
  }, [id, role]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript && document.body.contains(existingScript)) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const [processingPayment, setProcessingPayment] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handlePayNow = async () => {
    if (!applicationStatus?.applicationId || !applicationStatus?.gender || !applicationStatus?.category) {
      alert("Application details not found. Please apply again.");
      return;
    }

    try {
      setProcessingPayment(true);
      setError(null);

      // Create Razorpay order
      const orderResponse = await paymentsAPI.createOrder(
        id,
        applicationStatus.gender,
        applicationStatus.category,
        applicationStatus.applicationId
      );

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.error || "Failed to create payment order");
      }

      const { orderId, amount, amountInRupees, keyId } = orderResponse.data;

      // Initialize Razorpay checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: "INR",
        name: "JSSA Application Fee",
        description: `Application Fee - ₹${amountInRupees}`,
        order_id: orderId,
        notes: {
          applicationId: applicationStatus.applicationId,
        },
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await paymentsAPI.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              applicationStatus.applicationId
            );

            if (verifyResponse.success) {
              alert("Payment successful! Application submitted.");
              // Refresh application status
              const checkResponse = await applicationsAPI.checkApplication(id);
              if (checkResponse.success && checkResponse.data) {
                setApplicationStatus({
                  applicationId: checkResponse.data.applicationId,
                  paymentStatus: checkResponse.data.paymentStatus,
                  gender: checkResponse.data.gender,
                  category: checkResponse.data.category,
                });
              }
            } else {
              alert("Payment verification failed. Please contact support.");
              setError("Payment verification failed");
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            alert("Payment verification failed. Please contact support.");
            setError(err.message || "Payment verification failed");
          } finally {
            setProcessingPayment(false);
          }
        },
        theme: {
          color: "#3AB000",
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(false);
            setError("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Failed to initiate payment");
      setProcessingPayment(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this posting?")) {
      try {
        await jobPostingsAPI.delete(id);
        alert("Posting deleted successfully!");
        navigate("/job-postings");
      } catch (err) {
        alert(err.message || "Failed to delete posting");
        console.error("Delete error:", err);
      }
    }
  };

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

  const downloadJobPDF = async (lang = "en") => {
    if (!posting) return;
    
    setDownloadingPDF(true);
    try {
      await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      );
      await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      );

      const isHi = lang === "hi";
      const GREEN = "#3AB000";
      const DARK_BLUE = "#1e2840";
      
      // Build fee structure table if exists
      let feeTableHTML = "";
      if (posting.feeStructure && Object.keys(posting.feeStructure).length > 0 && 
          Object.values(posting.feeStructure).some(val => val && val.toString().trim() !== "")) {
        const categories = [
          { key: "general", label: "General / सामान्य" },
          { key: "obc", label: "OBC" },
          { key: "sc", label: "SC" },
          { key: "st", label: "ST" },
          { key: "ews", label: "EWS" },
        ];
        
        const allFees = [];
        categories.forEach(cat => {
          const maleFee = posting.feeStructure[`male_${cat.key}`];
          const femaleFee = posting.feeStructure[`female_${cat.key}`];
          if (maleFee) allFees.push(parseFloat(maleFee));
          if (femaleFee) allFees.push(parseFloat(femaleFee));
        });
        
        const uniqueFees = [...new Set(allFees)];
        const allSame = uniqueFees.length === 1 && allFees.length > 0;
        
        if (allSame) {
          feeTableHTML = `<div style="text-align:center;padding:8px;background:#fff9e6;border:2px solid #ffc107;border-radius:4px;margin:8px 0"><div style="font-weight:900;font-size:16px;color:#3AB000;margin-bottom:4px">₹${uniqueFees[0]}</div><div style="font-weight:700;font-size:11px;color:#856404">${isHi ? "सभी श्रेणियों के लिए राशि" : "AMOUNT (FOR ALL CATEGORIES)"}</div></div>`;
        } else {
          const tableRows = categories
            .map((cat) => {
              const maleFee = posting.feeStructure[`male_${cat.key}`];
              const femaleFee = posting.feeStructure[`female_${cat.key}`];
              if (!maleFee && !femaleFee) return "";
              return `<tr style="background:#fff"><td style="padding:6px 10px;border:1px solid #ddd;font-weight:700;font-size:11px">${cat.label}</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:900;font-size:11px;color:#3AB000">${maleFee ? `₹${maleFee}` : "—"}</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:900;font-size:11px;color:#3AB000">${femaleFee ? `₹${femaleFee}` : "—"}</td></tr>`;
            })
            .filter(r => r)
            .join("");
          
          feeTableHTML = `<div style="background:#fff9e6;border:2px solid #ffc107;border-radius:4px;padding:8px;margin:8px 0"><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:#ffc107"><th style="padding:6px 10px;border:1px solid #ffc107;text-align:left;font-weight:900;font-size:11px">${isHi ? "श्रेणी" : "Category"}</th><th style="padding:6px 10px;border:1px solid #ffc107;text-align:center;font-weight:900;font-size:11px">${isHi ? "पुरुष" : "Male"}</th><th style="padding:6px 10px;border:1px solid #ffc107;text-align:center;font-weight:900;font-size:11px">${isHi ? "महिला" : "Female"}</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
        }
      }

      // Build rows data
      const rows = [
        [isHi ? "पद का नाम" : "Post Name", 
         isHi ? (posting.post?.hi || "") : (posting.post?.en || ""),
         isHi ? (posting.post?.en || "") : (posting.post?.hi || "")],
        [isHi ? "शैक्षणिक योग्यता" : "Education Qualification",
         isHi ? (posting.education?.hi || "") : (posting.education?.en || ""),
         isHi ? (posting.education?.en || "") : (posting.education?.hi || "")],
        [isHi ? "मासिक आय" : "Monthly Income",
         isHi ? (posting.income?.hi || "") : (posting.income?.en || ""),
         isHi ? (posting.income?.en || "") : (posting.income?.hi || "")],
        [isHi ? "आयु सीमा" : "Age Limit",
         isHi ? (posting.ageLimit?.hi || "19 – 40 वर्ष") : (posting.ageLimit?.en || "19 – 40 Years"),
         isHi ? (posting.ageLimit?.en || "19 – 40 Years") : (posting.ageLimit?.hi || "19 – 40 वर्ष")],
        [isHi ? "आयु की तिथि" : "Age As On",
         posting.ageAsOn || "—", ""],
        [isHi ? "नौकरी करने का स्थान" : "Job Location",
         isHi ? (posting.location?.hi || (posting.locationArrHi?.join(", ") || "पूरे भारत में")) : (posting.location?.en || (posting.locationArr?.join(", ") || "All India")),
         isHi ? (posting.location?.en || (posting.locationArr?.join(", ") || "All India")) : (posting.location?.hi || (posting.locationArrHi?.join(", ") || "पूरे भारत में"))],
        [isHi ? "चयन प्रक्रिया" : "Selection Process",
         isHi ? (posting.selectionProcess?.hi || "—") : (posting.selectionProcess?.en || "—"),
         isHi ? (posting.selectionProcess?.en || "—") : (posting.selectionProcess?.hi || "—")],
        [isHi ? "आवेदन खुलने की तिथि" : "Application Opening Date",
         posting.applicationOpeningDate || "—", ""],
        [isHi ? "आवेदन की अंतिम तिथि" : "Last Date to Apply",
         posting.lastDate || "—", ""],
        [isHi ? "1st मेरिट सूची" : "1st Merit List Date",
         posting.firstMeritListDate || "—", ""],
        [isHi ? "अंतिम मेरिट सूची" : "Final Merit List Date",
         posting.finalMeritListDate || "—", ""],
      ].filter((r) => r[1] && r[1] !== "—");

      const tableRowsHTML = rows
        .map(
          (r, i) =>
            `<tr style="background:${i % 2 === 0 ? "#f8f9fa" : "#fff"}"><td style="padding:7px 12px;font-weight:900;font-size:11px;color:#1e2840;border:1px solid #ddd;width:28%;vertical-align:top">${r[0]}</td><td style="padding:7px 8px;font-weight:900;font-size:11px;color:#1e2840;border:1px solid #ddd;width:2%;text-align:center;vertical-align:top">:</td><td style="padding:7px 12px;font-weight:700;font-size:11px;color:#000;border:1px solid #ddd;vertical-align:top;line-height:1.5">${r[1]}${r[2] ? `<br/><span style="font-weight:700;font-size:10px;color:#666">${r[2]}</span>` : ""}</td></tr>`,
        )
        .join("");

      const advt = posting.advtNo || "";
      const date = posting.date || posting.lastDate || "";
      const titleEn = posting.title?.en || posting.postTitle?.en || posting.post?.en || "";
      const titleHi = posting.title?.hi || posting.postTitle?.hi || posting.post?.hi || "";
      const invitationEn = posting.title?.en || `Invitation for all eligible candidates on vacant posts of ${titleEn} under Jan Swasthya Sahayata Abhiyan by Healthcare Research and Development Board (A Division of NAC India).`;
      const invitationHi = posting.title?.hi || `हेल्थ केयर रिसर्च एंड डेवलपमेंट बोर्ड (A Division Of NAC INDIA) द्वारा जन स्वास्थ्य सहायता अभियान के तहत ${titleHi} के रिक्त पदों पर सभी पात्र उम्मीदवारों के लिए आमंत्रण।`;

      const container = document.createElement("div");
      container.style.cssText = `
        position: fixed; left: -9999px; top: 0;
        width: 680px; background: #fff;
        font-family: 'Noto Sans Devanagari', 'Noto Sans', Arial, sans-serif;
        font-size: 11px; color: #000;
        border: 2px solid #ddd; border-radius: 6px;
        overflow: hidden;
      `;

      container.innerHTML = `
        <div style="background:${DARK_BLUE};display:flex;align-items:center;gap:14px;padding:12px 18px">
          <div style="width:56px;height:56px;border-radius:50%;background:${GREEN};border:3px solid #fff;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:13px">JSS</div>
          <div>
            <div style="color:#fff;font-size:${isHi ? "20px" : "17px"};font-weight:900;line-height:1.2">${isHi ? "जन स्वास्थ्य सहायता अभियान" : "JAN SWASTHYA SAHAYATA ABHIYAN"}</div>
            <div style="color:#fff;font-size:12px;font-weight:700;margin-top:3px">A Project of Healthcare Research & Development Board</div>
            <div style="color:rgba(255,255,255,0.7);font-size:10px;margin-top:2px">(HRDB is Division Of Social Welfare Organization "NAC India")</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 18px;background:#f5f5f5;border-bottom:2px solid #ddd">
          <span style="font-weight:900;font-size:12px;color:#1e2840">${isHi ? "विज्ञापन सं0 :" : "Advt. No. :"} ${advt}</span>
          <span style="background:#1e2840;color:#fff;font-weight:900;font-size:11px;padding:6px 16px;border-radius:2px;letter-spacing:0.05em">${isHi ? "भर्ती आमंत्रण" : "RECRUITMENT INVITATION"}</span>
          <span style="font-weight:900;font-size:12px;color:#1e2840">${isHi ? "दिनांक :" : "DATE :"} ${date}</span>
        </div>
        <div style="background:#1e2840;color:#fff;padding:12px 18px;text-align:center;font-size:${isHi ? "14px" : "12px"};font-weight:700;line-height:1.5">${isHi ? invitationHi : invitationEn}</div>
        <div style="padding:12px 18px">
          <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px">
            <tbody>${tableRowsHTML}</tbody>
          </table>
          ${feeTableHTML ? `<div style="margin-top:8px"><div style="font-weight:900;font-size:11px;color:#1e2840;margin-bottom:4px">${isHi ? "शुल्क संरचना" : "Fee Structure"}</div>${feeTableHTML}</div>` : ""}
        </div>
        <div style="background:#1e2840;color:#fff;padding:10px 18px;text-align:center">
          <div style="font-size:${isHi ? "14px" : "13px"};font-weight:900;margin-bottom:5px">${isHi ? "अधिक जानकारी के लिए :" : "FOR MORE INFORMATION :"}</div>
          <div style="font-size:11px;display:flex;justify-content:space-around;font-weight:700">
            <span>Website : https://www.jssabhiyan-nac.in</span>
            <span>Email : support@jssabhiyan.com</span>
          </div>
        </div>
      `;

      document.body.appendChild(container);
      await new Promise((r) => setTimeout(r, 150));

      const canvas = await window.html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 680,
        height: container.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      const pageW = 210;
      const pageH = 297;
      const imgW = pageW - 15;
      const imgH = (canvas.height * imgW) / canvas.width;

      // Scale to fit on single page
      if (imgH > pageH - 15) {
        const scale = (pageH - 15) / imgH;
        const scaledW = imgW * scale;
        const scaledH = imgH * scale;
        const xOffset = (pageW - scaledW) / 2;
        pdf.addImage(imgData, "PNG", xOffset, 7.5, scaledW, scaledH);
      } else {
        pdf.addImage(imgData, "PNG", 7.5, 7.5, imgW, imgH);
      }

      const advtClean = advt.replace(/\//g, "-");
      pdf.save(
        isHi
          ? `JSSA_${advtClean}_Hindi.pdf`
          : `JSSA_${advtClean}_English.pdf`,
      );
      document.body.removeChild(container);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF: " + err.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Helper to get bilingual value
  const getValue = (field) => {
    if (!posting || !field) return "";
    if (typeof field === 'object' && field !== null) {
      // Return the selected language, fallback to English if not available
      const value = field[language];
      if (value && value.trim()) return value;
      // If selected language is empty, return English as fallback
      return field.en || "";
    }
    // If it's a string (shouldn't happen after normalization, but handle it)
    return field || "";
  };

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout activePath="/job-postings">
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
      <DashboardLayout activePath="/job-postings">
        <div className="ml-6 flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-gray-500 font-medium mb-4">
            {error}
          </p>
          <button
            onClick={() => navigate("/job-postings")}
            className="bg-[#3AB000] text-white px-6 py-2 rounded text-sm font-medium hover:bg-[#2d8a00] transition-colors"
          >
            ← Back to List
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Not Found ─────────────────────────────────────────────────────────────
  if (!posting) {
    return (
      <DashboardLayout activePath="/job-postings">
        <div className="ml-6 flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-gray-500 font-medium mb-4">
            Job posting not found.
          </p>
          <button
            onClick={() => navigate("/job-postings")}
            className="bg-[#3AB000] text-white px-6 py-2 rounded text-sm font-medium hover:bg-[#2d8a00] transition-colors"
          >
            ← Back to List
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const parseFlexibleDate = (value) => {
    if (!value) return null;

    const raw = String(value).trim();
    const nativeParsed = new Date(raw);
    if (!Number.isNaN(nativeParsed.getTime())) {
      return nativeParsed;
    }

    // Support DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
    const dayFirstMatch = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (dayFirstMatch) {
      const day = Number(dayFirstMatch[1]);
      const month = Number(dayFirstMatch[2]);
      const year = Number(dayFirstMatch[3]);
      const parsed = new Date(year, month - 1, day);
      if (
        parsed.getFullYear() === year &&
        parsed.getMonth() === month - 1 &&
        parsed.getDate() === day
      ) {
        return parsed;
      }
    }

    // Support YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
    const yearFirstMatch = raw.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
    if (yearFirstMatch) {
      const year = Number(yearFirstMatch[1]);
      const month = Number(yearFirstMatch[2]);
      const day = Number(yearFirstMatch[3]);
      const parsed = new Date(year, month - 1, day);
      if (
        parsed.getFullYear() === year &&
        parsed.getMonth() === month - 1 &&
        parsed.getDate() === day
      ) {
        return parsed;
      }
    }

    return null;
  };

  const computeStatusFromLastDate = (lastDate) => {
    if (!lastDate) return "Active";
    const d = parseFlexibleDate(lastDate);
    if (!d) return "Active";
    // Treat "lastDate" as inclusive through the end of that day.
    d.setHours(23, 59, 59, 999);
    return d >= new Date() ? "Active" : "Inactive";
  };

  const computedStatus = computeStatusFromLastDate(posting.lastDate);
  const isActive = computedStatus === "Active";

  return (
    <DashboardLayout activePath="/job-postings">
      <div className="ml-6 space-y-3 pb-6">
        {/* ── Breadcrumb + Actions ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate("/job-postings")}
              className="flex items-center gap-1.5 text-[#3AB000] font-medium hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Job Postings
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-500 truncate max-w-xs">
              {getValue(posting.post)}
            </span>
          </div>

          {role === "admin" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/job-postings/edit/${posting.id}`)}
              className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
          )}
        </div>

        {/* ── Bilingual Display Notice ── */}
        <div className="flex justify-end mb-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
            <p className="text-xs text-blue-700 font-medium">
              Displaying in English and Hindi / अंग्रेजी और हिंदी में प्रदर्शित
            </p>
          </div>
        </div>

        {/* ── Hero Card ── */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {/* Green Header */}
          <div className="bg-[#3AB000] px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-green-100 text-xs font-semibold tracking-wider uppercase mb-1">
                  {posting.advtNo} · Date: {posting.date}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <h1 className="text-white font-bold text-lg sm:text-xl leading-snug">
                      {posting.title?.en || posting.postTitle?.en || 
                        (posting.post?.en 
                          ? `Recruitment for the Post of ${posting.post.en}`
                          : "Job Posting")}
                    </h1>
                  </div>
                  {(posting.title?.hi || posting.postTitle?.hi || posting.post?.hi) && (
                    <div>
                      <h2 className="text-white font-bold text-lg sm:text-xl leading-snug">
                        {posting.title?.hi || posting.postTitle?.hi || 
                          (posting.post?.hi 
                            ? `पद के लिए भर्ती: ${posting.post.hi}`
                            : "")}
                      </h2>
                    </div>
                  )}
                </div>
              </div>
              <span
                className={`self-start flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                  isActive
                    ? "bg-white/20 text-white border-white/40"
                    : "bg-black/20 text-white/70 border-white/20"
                }`}
              >
                {isActive ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                {computedStatus}
              </span>
            </div>
          </div>

          {/* Download Bar + Apply Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2 bg-[#f0fae8] border-b border-[#d4edcc]">
            <div className="flex flex-wrap items-center gap-4">
              {posting.advertisementFile && (
                <>
                  <a 
                    href={posting.advertisementFile} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[#3AB000] text-xs font-semibold hover:underline transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Advertisement (English)
                  </a>
                  {posting.advertisementFileHi && <span className="text-gray-300 hidden sm:block">|</span>}
                </>
              )}
              {posting.advertisementFileHi && (
                <a 
                  href={posting.advertisementFileHi} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#3AB000] text-xs font-semibold hover:underline transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  विज्ञापन डाउनलोड करें (हिंदी)
                </a>
              )}
              {/* Removed auto-generated PDF buttons; only show uploaded advertisement PDFs */}
            </div>
            {/* Apply Now Button - Only show for applicants who haven't applied yet */}
            {role === "applicant" && isActive && !hasApplied && (
              <button
                onClick={() => navigate(`/application-form?new=true&jobId=${id}`)}
                className="flex items-center gap-2 bg-[#3AB000] hover:bg-[#2d8a00] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-md hover:shadow-lg"
              >
                <Send className="w-4 h-4" />
                Apply Now
              </button>
            )}
            {/* Pay Now Button - Show if form filled but payment pending or failed */}
            {role === "applicant" && isActive && hasApplied && (applicationStatus?.paymentStatus === "pending" || applicationStatus?.paymentStatus === "failed") && (
              <button
                onClick={handlePayNow}
                disabled={processingPayment}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {processingPayment ? "Processing..." : "Pay Now"}
              </button>
            )}
            {/* Show message if already submitted (form + payment done) */}
            {role === "applicant" && isActive && hasApplied && applicationStatus?.paymentStatus === "paid" && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Already Submitted</span>
              </div>
            )}
            {/* Show message if applied but payment status unknown */}
            {role === "applicant" && isActive && hasApplied && applicationStatus?.paymentStatus !== "pending" && applicationStatus?.paymentStatus !== "failed" && applicationStatus?.paymentStatus !== "paid" && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Already Applied</span>
              </div>
            )}
          </div>

          {/* Quick Info Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
            <QuickInfo
              icon={<Briefcase className="w-4 h-4" />}
              label="Post / पद"
              value={posting.post?.en || ""}
              valueHi={posting.post?.hi || ""}
            />
            <QuickInfo
              icon={<GraduationCap className="w-4 h-4" />}
              label="Education / शैक्षणिक योग्यता"
              value={posting.education?.en || ""}
              valueHi={posting.education?.hi || ""}
            />
            <QuickInfo
              icon={<IndianRupee className="w-4 h-4" />}
              label="Monthly Income / मासिक आय"
              value={posting.income?.en || ""}
              valueHi={posting.income?.hi || ""}
            />
            <QuickInfo
              icon={<Users className="w-4 h-4" />}
              label="Fee Structure / शुल्क संरचना"
              value={
                posting.feeStructure && Object.keys(posting.feeStructure).length > 0
                  ? "See Details Below"
                  : posting.fee?.en || ""
              }
              valueHi={
                posting.feeStructure && Object.keys(posting.feeStructure).length > 0
                  ? "नीचे विवरण देखें"
                  : posting.fee?.hi || ""
              }
              valueClass="text-[#3AB000] font-bold"
            />
          </div>
        </div>

        {/* ── Body Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-3">
            {/* Job Location */}
            <DetailCard
              icon={<MapPin className="w-4 h-4 text-[#3AB000]" />}
              title="Job Location / नौकरी करने का स्थान"
            >
              <div className="mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* English States */}
                  <div>
                    {posting.locationArr?.length > 0 ? (
                      <>
                        <p className="text-xs text-gray-500 font-medium mb-2">English:</p>
                        <div className="flex flex-wrap gap-2">
                          {posting.locationArr.map((loc) => (
                            <span
                              key={loc}
                              className="bg-[#e8f5e2] text-[#2d8a00] text-xs font-medium px-3 py-1 rounded-full border border-[#c8e6c9]"
                            >
                              {loc}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : posting.location?.en ? (
                      <>
                        <p className="text-xs text-gray-500 font-medium mb-1">English:</p>
                        <p className="text-sm text-gray-700">{posting.location.en}</p>
                      </>
                    ) : (
                      <p className="text-gray-400 text-sm">All India</p>
                    )}
                  </div>
                  {/* Hindi States */}
                  <div>
                    {posting.locationArrHi?.length > 0 ? (
                      <>
                        <p className="text-xs text-gray-500 font-medium mb-2">हिंदी:</p>
                        <div className="flex flex-wrap gap-2">
                          {posting.locationArrHi.map((loc) => (
                            <span
                              key={loc}
                              className="bg-[#e8f5e2] text-[#2d8a00] text-xs font-medium px-3 py-1 rounded-full border border-[#c8e6c9]"
                            >
                              {loc}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : posting.location?.hi ? (
                      <>
                        <p className="text-xs text-gray-500 font-medium mb-1">हिंदी:</p>
                        <p className="text-sm text-gray-700">{posting.location.hi}</p>
                      </>
                    ) : (
                      <p className="text-gray-400 text-sm">पूरे भारत में</p>
                    )}
                  </div>
                </div>
              </div>
            </DetailCard>

            {/* Selection Process */}
            <DetailCard
              icon={<CheckCircle2 className="w-4 h-4 text-[#3AB000]" />}
              title="Selection Process / चयन प्रक्रिया"
            >
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {posting.selectionProcess?.en && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">English:</p>
                    <p className="text-sm text-gray-700">{posting.selectionProcess.en}</p>
                  </div>
                )}
                {posting.selectionProcess?.hi && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">हिंदी:</p>
                    <p className="text-sm text-gray-700">{posting.selectionProcess.hi}</p>
                  </div>
                )}
              </div>
            </DetailCard>

            {/* Fee Structure Table */}
            {posting.feeStructure && Object.keys(posting.feeStructure).length > 0 && 
              Object.values(posting.feeStructure).some(val => val && val.toString().trim() !== "") && (() => {
                // Check if all fees are the same
                const categories = ["general", "obc", "sc", "st", "ews"];
                const allFees = [];
                categories.forEach(cat => {
                  const maleFee = posting.feeStructure[`male_${cat}`];
                  const femaleFee = posting.feeStructure[`female_${cat}`];
                  if (maleFee) allFees.push(parseFloat(maleFee));
                  if (femaleFee) allFees.push(parseFloat(femaleFee));
                });
                
                const uniqueFees = [...new Set(allFees)];
                const allSame = uniqueFees.length === 1 && allFees.length > 0;
                const sameAmount = allSame ? uniqueFees[0] : null;
                
                return (
                  <DetailCard
                    icon={<IndianRupee className="w-4 h-4 text-[#3AB000]" />}
                    title="Fee Structure / शुल्क संरचना"
                  >
                    <div className="bg-[#fff9e6] border-2 border-[#ffc107] rounded-lg p-3 sm:p-4 mt-2 overflow-x-auto">
                      <div className="text-sm font-bold text-[#856404] mb-3 flex items-center gap-2">
                        <span>💰</span>
                        <span>Fee Structure by Gender & Category / लिंग और श्रेणी के अनुसार शुल्क संरचना</span>
                      </div>
                      {allSame ? (
                        <div className="text-center py-4">
                          <p className="text-lg sm:text-xl font-bold text-[#3AB000] mb-2">
                            ₹{sameAmount}
                          </p>
                          <p className="text-sm text-gray-700 font-medium">
                            AMOUNT (FOR ALL CATEGORIES) / सभी श्रेणियों के लिए राशि
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs sm:text-sm border-collapse min-w-[300px]">
                            <thead>
                              <tr className="bg-[#ffc107] text-gray-800">
                                <th className="px-2 sm:px-3 py-2 text-left border border-[#ffc107] font-bold">Category / श्रेणी</th>
                                <th className="px-2 sm:px-3 py-2 text-center border border-[#ffc107] font-bold">Male / पुरुष</th>
                                <th className="px-2 sm:px-3 py-2 text-center border border-[#ffc107] font-bold">Female / महिला</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { key: "general", label: "General / सामान्य" },
                                { key: "obc", label: "OBC" },
                                { key: "sc", label: "SC" },
                                { key: "st", label: "ST" },
                                { key: "ews", label: "EWS" },
                              ].map((cat, idx) => {
                                const maleFee = posting.feeStructure[`male_${cat.key}`];
                                const femaleFee = posting.feeStructure[`female_${cat.key}`];
                                if (!maleFee && !femaleFee) return null;
                                return (
                                  <tr
                                    key={cat.key}
                                    className={idx % 2 === 0 ? "bg-white" : "bg-[#fffbf0]"}
                                  >
                                    <td className="px-2 sm:px-3 py-2 border border-gray-300 font-semibold">
                                      {cat.label}
                                    </td>
                                    <td className="px-2 sm:px-3 py-2 border border-gray-300 text-center text-[#3AB000] font-bold">
                                      {maleFee ? `₹${maleFee}` : "—"}
                                    </td>
                                    <td className="px-2 sm:px-3 py-2 border border-gray-300 text-center text-[#3AB000] font-bold">
                                      {femaleFee ? `₹${femaleFee}` : "—"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </DetailCard>
                );
              })()}
          </div>

          {/* Right column – Dates */}
          <div className="space-y-3">
            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
              <p className="text-xs font-bold text-[#3AB000] uppercase tracking-wider mb-2 pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Important Dates
              </p>

              {/* Timeline */}
              <div className="relative pl-5">
                <div className="absolute left-1.5 top-2 bottom-2 w-px bg-gray-200" />
                {[
                  {
                    label: "Application Opens",
                    value: posting.applicationOpeningDate || "—",
                    color: "bg-[#3AB000]",
                    textClass: "text-gray-700",
                  },
                  {
                    label: "Last Date to Apply",
                    value: posting.lastDate,
                    color: "bg-red-400",
                    textClass: "text-red-500 font-semibold",
                  },
                  {
                    label: "1st Merit List Released",
                    value: posting.firstMeritListDate || "—",
                    color: "bg-blue-400",
                    textClass: "text-gray-700",
                  },
                  {
                    label: "Final Merit List Released",
                    value: posting.finalMeritListDate || "—",
                    color: "bg-purple-400",
                    textClass: "text-gray-700",
                  },
                ].map((item, i) => (
                  <div key={i} className="relative mb-3 last:mb-0">
                    <div
                      className={`absolute -left-5 top-1 w-3 h-3 rounded-full border-2 border-white ${item.color}`}
                    />
                    <p className="text-xs text-gray-400 font-medium">
                      {item.label}
                    </p>
                    <p className={`text-sm mt-0.5 ${item.textClass}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Eligibility */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
              <p className="text-xs font-bold text-[#3AB000] uppercase tracking-wider mb-2 pb-1.5 border-b border-gray-100">
                Eligibility / योग्यता
              </p>
              <div className="space-y-2">
                <Row
                  label="Age Limit / आयु सीमा"
                  value={posting.ageLimit?.en || "19 – 40 Years"}
                  valueHi={posting.ageLimit?.hi || "19 – 40 वर्ष"}
                />
                <Row 
                  label="Age As On / आयु की तिथि" 
                  value={posting.ageAsOn || "—"} 
                />
                <Row 
                  label="Education / शिक्षा" 
                  value={posting.education?.en || ""}
                  valueHi={posting.education?.hi || ""}
                />
                {posting.feeStructure && Object.keys(posting.feeStructure).length > 0 && 
                  Object.values(posting.feeStructure).some(val => val && val.toString().trim() !== "") ? (() => {
                    // Check if all fees are the same
                    const categories = ["general", "obc", "sc", "st", "ews"];
                    const allFees = [];
                    categories.forEach(cat => {
                      const maleFee = posting.feeStructure[`male_${cat}`];
                      const femaleFee = posting.feeStructure[`female_${cat}`];
                      if (maleFee) allFees.push(parseFloat(maleFee));
                      if (femaleFee) allFees.push(parseFloat(femaleFee));
                    });
                    
                    const uniqueFees = [...new Set(allFees)];
                    const allSame = uniqueFees.length === 1 && allFees.length > 0;
                    const sameAmount = allSame ? uniqueFees[0] : null;
                    
                    return allSame ? (
                      <Row
                        label="Fee Structure / शुल्क संरचना"
                        value={`₹${sameAmount} (FOR ALL CATEGORIES)`}
                        valueHi={`₹${sameAmount} (सभी श्रेणियों के लिए)`}
                        valueClass="text-[#3AB000] font-bold text-sm"
                      />
                    ) : (
                      <div className="col-span-full">
                        <p className="text-xs text-gray-500 mb-2">Fee Structure / शुल्क संरचना</p>
                        <div className="bg-[#fff9e6] border-2 border-[#ffc107] rounded-lg p-3 sm:p-4 overflow-x-auto">
                          <div className="text-sm font-bold text-[#856404] mb-3 flex items-center gap-2">
                            <span>💰</span>
                            <span>Fee Structure / शुल्क संरचना</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs sm:text-sm border-collapse">
                              <thead>
                                <tr className="bg-[#ffc107] text-gray-800">
                                  <th className="px-2 sm:px-3 py-2 text-left border border-[#ffc107] font-bold">Category / श्रेणी</th>
                                  <th className="px-2 sm:px-3 py-2 text-center border border-[#ffc107] font-bold">Male / पुरुष</th>
                                  <th className="px-2 sm:px-3 py-2 text-center border border-[#ffc107] font-bold">Female / महिला</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[
                                  { key: "general", label: "General / सामान्य" },
                                  { key: "obc", label: "OBC" },
                                  { key: "sc", label: "SC" },
                                  { key: "st", label: "ST" },
                                  { key: "ews", label: "EWS" },
                                ].map((cat, idx) => {
                                  const maleFee = posting.feeStructure[`male_${cat.key}`];
                                  const femaleFee = posting.feeStructure[`female_${cat.key}`];
                                  if (!maleFee && !femaleFee) return null;
                                  return (
                                    <tr
                                      key={cat.key}
                                      className={idx % 2 === 0 ? "bg-white" : "bg-[#fffbf0]"}
                                    >
                                      <td className="px-2 sm:px-3 py-2 border border-gray-300 font-semibold">
                                        {cat.label}
                                      </td>
                                      <td className="px-2 sm:px-3 py-2 border border-gray-300 text-center text-[#3AB000] font-bold">
                                        {maleFee ? `₹${maleFee}` : "—"}
                                      </td>
                                      <td className="px-2 sm:px-3 py-2 border border-gray-300 text-center text-[#3AB000] font-bold">
                                        {femaleFee ? `₹${femaleFee}` : "—"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                : (
                  <Row
                    label="Fee Structure / शुल्क संरचना"
                    value={posting.fee?.en || ""}
                    valueHi={posting.fee?.hi || ""}
                    valueClass="text-[#3AB000] font-bold text-sm"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Back Button ── */}
        <div>
          <button
            onClick={() => navigate("/job-postings")}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#3AB000] transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Job Postings
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

// ── Small helpers ─────────────────────────────────────────────────────────────

const QuickInfo = ({
  icon,
  label,
  value,
  valueHi,
  valueClass = "text-gray-800 font-semibold",
}) => (
  <div className="flex items-start gap-2.5 px-4 py-3">
    <div className="w-7 h-7 rounded-lg bg-[#e8f5e2] flex items-center justify-center flex-shrink-0 text-[#3AB000] mt-0.5">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-1.5 mt-0.5">
        {value && (
          <p className={`text-sm truncate ${valueClass}`}>{value}</p>
        )}
        {valueHi && (
          <p className={`text-sm truncate ${valueClass} text-gray-600`}>{valueHi}</p>
        )}
      </div>
    </div>
  </div>
);

const DetailCard = ({ icon, title, children }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
    <div className="flex items-center gap-2 pb-1.5 border-b border-gray-100 mb-1">
      {icon}
      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
        {title}
      </p>
    </div>
    {children}
  </div>
);

const Row = ({
  label,
  value,
  valueHi,
  valueClass = "text-gray-800 font-medium text-sm",
}) => (
  <div className="flex justify-between items-start text-sm">
    <span className="text-gray-500">{label}</span>
    <div className="text-right">
      {value && <span className={valueClass}>{value}</span>}
      {valueHi && (
        <p className="text-xs text-gray-600 mt-0.5">{valueHi}</p>
      )}
    </div>
  </div>
);

export default JobPostingView;
