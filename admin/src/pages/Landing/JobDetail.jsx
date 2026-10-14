import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { jobPostingsAPI, paymentsAPI } from "../../utils/api.js";
import logo from "../../assets/img0.png";
import logo1 from "../../assets/jss.png";
import swachhBharat from "../../assets/Swachh.png";
import brochurePDF from "../../assets/broucher.pdf";

// Landing-site theme blue (was green #3AB000)
const GREEN = "#4D7C0F";

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CSS â€” exact match to screenshot design
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const jobsCSS = `
  * { box-sizing: border-box; }

  .jobs-section-heading {
    font-weight: 900; font-size: 15px; color: #3F6212;
    margin: 20px 0 12px; letter-spacing: 0.02em;
  }
  .jobs-submit-btn {
    background: #4D7C0F;
    color: #fff; font-weight: 900;
    font-size: 15px; padding: 12px 40px;
    border: none; cursor: pointer; border-radius: 4px;
    box-shadow: 0 6px 16px rgba(77, 124, 15,0.4), inset 0 -3px 0 0 #4D7C0F;
    transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  }
  .jobs-submit-btn:hover {
    background: #3F6212;
    box-shadow: 0 8px 20px rgba(77, 124, 15,0.5), inset 0 -3px 0 0 #4D7C0F;
  }
  .jobs-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .jobs-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

  /* â”€â”€ Title row â€” light green centered â”€â”€ */
  .jobs-detail-title-row {
    background: #ECFCCB;
    padding: 10px 14px;
    text-align: center;
    border-bottom: 1px solid #ECFCCB;
    font-size: 13px; font-weight: 700; color: #000000; line-height: 1.6;
  }

  /* â”€â”€ Download row â€” #ECFCCB â”€â”€ */
  .jobs-detail-download-row {
    display: grid; grid-template-columns: 1fr 1fr;
    border-bottom: 2px solid ${GREEN}; background: #ECFCCB;
  }
  .jobs-detail-download-cell {
    padding: 18px 20px; text-align: center;
  }
  .jobs-detail-download-cell .advt-label {
    font-weight: 900; font-size: 16px; color: #000000; margin-bottom: 4px;
  }
  .jobs-detail-download-cell .advt-date {
    font-weight: 700; font-size: 15px; color: #000000; margin-bottom: 12px;
  }
  .jobs-detail-download-cell .dl-link {
    color: #4D7C0F !important; font-weight: 900; font-size: 13px;
    text-decoration: underline !important; background: none; border: none;
    cursor: pointer; padding: 0;
    display: inline-flex; align-items: center; gap: 5px; justify-content: center;
  }
  .jobs-detail-download-cell .dl-link span {
    font-weight: 900 !important;
  }
  .jobs-detail-download-cell .dl-link:disabled { opacity: 0.6; cursor: not-allowed; }
  .jobs-detail-download-cell .new-badge {
    display: inline-block; color: #fff; font-size: 9px; font-weight: 900;
    padding: 1px 5px; border-radius: 3px; margin-left: 5px;
    vertical-align: middle; letter-spacing: 0.05em;
    animation: badge-color 1.5s infinite;
  }
  @keyframes badge-color {
    0%   { background: #ff0000; }
    20%  { background: #ff6600; }
    40%  { background: #ffcc00; color: #333; }
    60%  { background: #00cc44; }
    80%  { background: #0066ff; }
    100% { background: #ff0000; }
  }

  /* â”€â”€ Data rows â€” all #ECFCCB, colon col #ECFCCB â”€â”€ */
  .jobs-detail-row {
    display: grid; grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid #ECFCCB;
  }
  .jobs-detail-row:last-child { border-bottom: none; }
  .jobs-detail-row.row-odd  { background: #ECFCCB; }
  .jobs-detail-row.row-even { background: #ECFCCB; }

  /* â”€â”€ 3-col inner: key | : | value â”€â”€ */
  .jobs-detail-lang-cell {
    display: grid; grid-template-columns: 160px 28px 1fr; padding: 0;
  }
  .jobs-detail-key {
    padding: 12px 10px 12px 12px;
    font-weight: 400; font-size: 14px; color: #000000;
    line-height: 1.5;
    background: #ECFCCB;
    border-right: 1px solid #ECFCCB;
  }
  .jobs-detail-colon {
    padding: 12px 0; font-size: 14px; color: #000000;
    text-align: center;
    background: #ECFCCB;
    border-right: 1px solid #ECFCCB;
    display: flex; align-items: flex-start; justify-content: center;
  }
  .jobs-detail-val {
    padding: 12px 12px; font-size: 14px; color: #000000; line-height: 1.6;
    background: #ECFCCB;
  }

  /* review table */
  .review-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .review-table td { padding: 8px 12px; border: 1px solid #e0e0e0; vertical-align: top; }
  .review-table td:first-child { font-weight: 700; color: #3F6212; width: 40%; background: #f5f5f5; }

  /* â”€â”€ Nav/header classes â”€â”€ */
  @keyframes marquee-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  nav::-webkit-scrollbar { height: 3px; }
  nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 2px; }
  .hdr-desktop { display: flex !important; }
  .hdr-mobile  { display: none !important; }
  .tb-left     { display: flex !important; }
  .tb-phone    { display: flex !important; }
  .tb-email    { display: flex !important; }
  .tb-search   { display: flex !important; }
  .nav-list { width: 100%; }
  .nav-item  { flex: 1; }
  .nav-btn   { width: 100%; font-size: 14px; padding: 14px 4px; color: #000 !important; }
  .footer-inner  { flex-direction: row; }
  .ft-heading    { font-size: 18px; }
  .ft-list       { gap: 14px; }
  .ft-link       { font-size: 16px; font-weight: 500; }
  .ft-logo-wrap  { padding: 0 40px; }
  .ft-logo-img   { width: 280px; height: auto; }
  .ft-contact    { gap: 14px; }
  .ft-contact-item { font-size: 16px; font-weight: 500; color: #ffffff; }
  .ft-contact-link { font-size: 16px; font-weight: 500; margin-top: 6px; }
  .ft-copyright  { font-size: 14px; padding: 16px 0; margin-top: 40px; }

  /* â”€â”€ Mobile â”€â”€ */
  @media (max-width: 768px) {
    .hdr-desktop { display: none !important; }
    .hdr-mobile  { display: flex !important; flex-direction: column !important; padding: 4px 8px !important; }

    .tb-topbar { flex-wrap: nowrap !important; padding: 0 6px !important; gap: 4px !important; justify-content: space-between !important; height: 36px !important; position: relative !important; }
    .tb-left   { display: flex !important; gap: 8px !important; flex-shrink: 0 !important; margin-left: 2% !important; }
    .tb-phone  { font-size: 8px !important; gap: 3px !important; }
    .tb-phone svg { width: 8px !important; height: 8px !important; }
    .tb-email  { font-size: 8px !important; gap: 3px !important; }
    .tb-email svg { width: 8px !important; height: 8px !important; }
    .tb-search { position: absolute !important; left: 55% !important; transform: translateX(-50%) !important; }
    .tb-search input { width: 80px !important; font-size: 8px !important; height: 22px !important; }
    .tb-dl-btn { font-size: 8px !important; height: 22px !important; padding: 0 8px !important; margin-right: 2% !important; }

    .nav-list { flex-wrap: nowrap !important; }
    .nav-item  { flex: 1 1 0 !important; }
    .nav-btn   { font-size: 5.5px !important; padding: 4px 1px !important; }

    /* â”€â”€ Detail table mobile â€” EN|HI same row, smaller font â”€â”€ */
    .jobs-detail-title-row { font-size: 7px; padding: 6px; line-height: 1.4; }
    .jobs-detail-download-row { grid-template-columns: 1fr 1fr !important; }
    .jobs-detail-download-cell { padding: 6px 4px; }
    .jobs-detail-download-cell .advt-label { font-size: 7px; margin-bottom: 2px; }
    .jobs-detail-download-cell .advt-date  { font-size: 6px; margin-bottom: 6px; }
    .jobs-detail-download-cell .dl-link    { font-size: 6px; gap: 2px; }
    .jobs-detail-download-cell .new-badge  { font-size: 6px; padding: 1px 3px; }

    .jobs-detail-row { grid-template-columns: 1fr 1fr !important; }
    .jobs-detail-lang-cell { grid-template-columns: 52px 10px 1fr !important; }
    .jobs-detail-key   { font-size: 7px !important; padding: 4px 3px 4px 4px !important; line-height: 1.4 !important; }
    .jobs-detail-colon { font-size: 7px !important; padding: 4px 0 !important; }
    .jobs-detail-val   { font-size: 7px !important; padding: 4px 3px !important; line-height: 1.4 !important; }

    .jobs-grid-2 { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
    .jobs-grid-3 { grid-template-columns: 1fr 1fr 1fr !important; gap: 5px !important; }
    .jobs-section-heading { font-size: 11px; margin: 12px 0 8px; }
    .jobs-submit-btn { font-size: 11px; padding: 8px 18px; }
    .review-table td { font-size: 11px; padding: 6px 8px; }

    footer { padding: 10px 6px 0 !important; }
    .footer-inner   { flex-direction: row !important; gap: 6px !important; padding: 0 !important; }
    .ft-heading     { font-size: 8px !important; margin-bottom: 6px !important; }
    .ft-list        { gap: 3px !important; }
    .ft-link        { font-size: 7px !important; }
    .ft-logo-wrap   { padding: 0 4px !important; }
    .ft-logo-img    { width: 60px !important; }
    .ft-contact     { gap: 3px !important; align-items: flex-end !important; }
    .ft-contact-item { font-size: 7px !important; }
    .ft-contact-link { font-size: 7px !important; margin-top: 2px !important; }
    .ft-copyright   { font-size: 7px !important; padding: 8px 0 !important; margin-top: 10px !important; }
  }
`;

// Current public landing site (separate app): localhost in dev, live domain in prod
const LANDING_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5173"
    : "https://jssabhiyan.com";

const navLinks = [
  { label: "Home", page: "/" },
  { label: "About Us", page: "/about" },
  { label: "Jobs & Career", page: "/jobs" },
  { label: "Notifications", page: "/notifications" },
  { label: "Gallery", page: "/gallery" },
  { label: "Feed", page: "/feeds" },
  { label: "News & Updates", page: "/news" },
];

const socialLinks = [
  {
    bg: "#1877f2",
    url: "https://www.facebook.com/",
    content: (
      <span
        style={{ fontWeight: 900, fontSize: 16, color: "#fff", lineHeight: 1 }}
      >
        f
      </span>
    ),
  },
  {
    bg: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285aeb 90%)",
    // url temporarily disabled — icon stays visible, link does nothing
    // url: "https://www.instagram.com/jssabhiyan8/?hl=en",
    content: (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="white"
        strokeWidth="2.2"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none" />
      </svg>
    ),
  },
  {
    bg: "#ff0000",
    // url temporarily disabled — icon stays visible, link does nothing
    // url: "https://www.youtube.com/@janswasthyasahayataabhiyan8183",
    content: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
        <polygon points="9.5,7 9.5,17 18,12" />
      </svg>
    ),
  },
  {
    bg: "#0077b5",
    url: "https://www.linkedin.com/in/jss-abhiyan-3872b13b7/",
    content: (
      <span style={{ fontWeight: 900, fontSize: 12, color: "#fff" }}>in</span>
    ),
  },
];

const quickLinks = [
  { label: "Home", href: `${LANDING_URL}/` },
  { label: "About", page: "/about" },
  { label: "Jobs & Career", page: "/jobs" },
  { label: "Notifications", page: "/notifications" },
  { label: "Gallery", page: "/gallery" },
  { label: "Feed", href: `${LANDING_URL}/feeds` },
  { label: "News & Updates", href: `${LANDING_URL}/news` },
];

const MOJIBAKE_PATTERN = /(à¤|à¥|â‚|âœ|ï¸|ðŸ|â|â€”|â€|Ã|Â)/;

const isMojibake = (value) =>
  typeof value === "string" && MOJIBAKE_PATTERN.test(value);

const pickHindiOrFallback = (hiValue, enValue = "") => {
  const hi = typeof hiValue === "string" ? hiValue.trim() : "";
  const en = typeof enValue === "string" ? enValue.trim() : "";
  if (!hi || isMojibake(hi)) return en;
  return hi;
};

function loadScript(src) {
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
}

async function downloadJobPDF(job, lang) {
  const isHi = lang === "hi";
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  );
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  );
  const rowsEn = [
    ["Post", job.post?.en || job.postTitle?.en || ""],
    ["Monthly Income", job.income?.en || ""],
    ["Education Qualification", job.education?.en || ""],
    ["Age Limit", job.ageLimit?.en || ""],
    ["Job Location", job.location?.en || ""],
    ["Selection Process", job.selectionProcess?.en || ""],
    ["Application Opening On", job.applicationOpeningDate || ""],
    ["Last Date of Application", job.lastDate || ""],
    ["Fee Structure", job.fee?.en || ""],
  ].filter((r) => r[1]);
  const rowsHi = [
    ["पद", pickHindiOrFallback(job.post?.hi || job.postTitle?.hi, job.post?.en || job.postTitle?.en || "")],
    ["मासिक आय", pickHindiOrFallback(job.income?.hi, job.income?.en || "")],
    ["शैक्षणिक योग्यता", pickHindiOrFallback(job.education?.hi, job.education?.en || "")],
    ["आयु सीमा", pickHindiOrFallback(job.ageLimit?.hi, job.ageLimit?.en || "")],
    ["नौकरी करने का स्थान", pickHindiOrFallback(job.location?.hi, job.location?.en || "")],
    ["चयन प्रक्रिया", pickHindiOrFallback(job.selectionProcess?.hi, job.selectionProcess?.en || "")],
    ["आवेदन खुलने की तिथि", job.applicationOpeningDate || ""],
    ["आवेदन की अंतिम तिथि", job.lastDate || ""],
    ["शुल्क संरचना", pickHindiOrFallback(job.fee?.hi, job.fee?.en || "")],
  ].filter((r) => r[1]);
  const rows = isHi ? rowsHi : rowsEn;
  const advt = job.advtNo || "";
  const date = job.date || job.lastDate || "";
  const titleEn = job.postTitle?.en || job.post?.en || "";
  const titleHi = job.postTitle?.hi || job.post?.hi || "";
  const invitationEn =
    job.title?.en ||
    `Invitation for all eligible candidates on vacant posts of ${titleEn} under Jan Swasthya Sahayata Abhiyan by Healthcare Research and Development Board (A Division of NAC India).`;
  const invitationHi =
    job.title?.hi ||
    `à¤¹à¥‡à¤²à¥à¤¥ à¤•à¥‡à¤¯à¤° à¤°à¤¿à¤¸à¤°à¥à¤š à¤à¤‚à¤¡ à¤¡à¥‡à¤µà¤²à¤ªà¤®à¥‡à¤‚à¤Ÿ à¤¬à¥‹à¤°à¥à¤¡ (A Division Of NAC INDIA) à¤¦à¥à¤µà¤¾à¤°à¤¾ à¤œà¤¨ à¤¸à¥à¤µà¤¾à¤¸à¥à¤¥à¥à¤¯ à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾ à¤…à¤­à¤¿à¤¯à¤¾à¤¨ à¤•à¥‡ à¤¤à¤¹à¤¤ ${titleHi} à¤•à¥‡ à¤°à¤¿à¤•à¥à¤¤ à¤ªà¤¦à¥‹à¤‚ à¤ªà¤° à¤¸à¤­à¥€ à¤ªà¤¾à¤¤à¥à¤° à¤‰à¤®à¥à¤®à¥€à¤¦à¤µà¤¾à¤°à¥‹à¤‚ à¤•à¥‡ à¤²à¤¿à¤ à¤†à¤®à¤‚à¤¤à¥à¤°à¤£à¥¤`;
  const tableRowsHTML = rows
    .map(
      (r, i) =>
        `<tr><td style="padding:9px 14px;font-weight:700;background:${i % 2 === 0 ? "#efefef" : "#fff"};border:1px solid #ccc;width:35%;vertical-align:top">${r[0]}</td><td style="padding:9px 8px;background:${i % 2 === 0 ? "#efefef" : "#fff"};border:1px solid #ccc;width:4%;text-align:center;vertical-align:top">:</td><td style="padding:9px 14px;background:${i % 2 === 0 ? "#efefef" : "#fff"};border:1px solid #ccc;vertical-align:top;line-height:1.6">${r[1]}</td></tr>`,
    )
    .join("");
  const container = document.createElement("div");
  container.style.cssText = `position:fixed;left:-9999px;top:0;width:700px;background:#fff;font-family:'Noto Sans Devanagari','Noto Sans',Arial,sans-serif;font-size:13px;color:#000;border:2px solid #888;border-radius:8px;overflow:hidden;`;
  container.innerHTML = `<div style="background:#1A2E05;display:flex;align-items:center;gap:16px;padding:14px 20px"><div style="width:64px;height:64px;border-radius:50%;background:${GREEN};border:3px solid #fff;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:14px">JSS</div><div><div style="color:#fff;font-size:${isHi ? "22px" : "19px"};font-weight:900;line-height:1.2">${isHi ? "à¤œà¤¨ à¤¸à¥à¤µà¤¾à¤¸à¥à¤¥à¥à¤¯ à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾ à¤…à¤­à¤¿à¤¯à¤¾à¤¨" : "JAN SWASTHYA SAHAYATA ABHIYAN"}</div><div style="color:#fff;font-size:13px;font-weight:700;margin-top:4px">A Project of Healthcare Research &amp; Development Board</div><div style="color:rgba(255,255,255,0.7);font-size:11px;margin-top:2px">(HRDB is Division Of Social Welfare Organization "NAC India")</div></div></div><div style="display:flex;align-items:center;justify-content:space-between;padding:10px 20px;background:#f5f5f5;border-bottom:2px solid #ddd"><span style="font-weight:700;font-size:13px;color:#1A2E05">${isHi ? "à¤µà¤¿à¤œà¥à¤žà¤¾à¤ªà¤¨ à¤¸à¤‚0 :" : "Advt. No. :"} ${advt}</span><span style="background:#1A2E05;color:#fff;font-weight:900;font-size:12px;padding:7px 18px;border-radius:2px;letter-spacing:0.05em">${isHi ? "à¤­à¤°à¥à¤¤à¥€ à¤†à¤®à¤‚à¤¤à¥à¤°à¤£" : "RECRUITMENT INVITATION"}</span><span style="font-weight:700;font-size:13px;color:#1A2E05">${isHi ? "à¤¦à¤¿à¤¨à¤¾à¤‚à¤• :" : "DATE :"} ${date}</span></div><div style="background:#1A2E05;color:#fff;padding:14px 20px;text-align:center;font-size:${isHi ? "15px" : "13px"};font-weight:700;line-height:1.6">${isHi ? invitationHi : invitationEn}</div><div style="padding:16px 20px"><table style="width:100%;border-collapse:collapse;font-size:${isHi ? "14px" : "13px"}"><tbody>${tableRowsHTML}</tbody></table></div><div style="background:#1A2E05;color:#fff;padding:12px 20px;text-align:center"><div style="font-size:${isHi ? "16px" : "14px"};font-weight:900;margin-bottom:6px">${isHi ? "à¤…à¤§à¤¿à¤• à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€ à¤•à¥‡ à¤²à¤¿à¤ :" : "FOR MORE INFORMATION :"}</div><div style="font-size:12px;display:flex;justify-content:space-around"><span>Website : https://www.jssabhiyan-nac.in</span><span>Email : support@jssabhiyan.com</span></div></div>`;
  document.body.appendChild(container);
  try {
    await new Promise((r) => setTimeout(r, 100));
    const canvas = await window.html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });
    const pageW = 210,
      pageH = 297,
      imgW = pageW - 20;
    const imgH = (canvas.height * imgW) / canvas.width;
    if (imgH <= pageH - 20) {
      pdf.addImage(imgData, "PNG", 10, 10, imgW, imgH);
    } else {
      const ratio = canvas.width / imgW,
        sliceH = (pageH - 20) * ratio;
      let yOffset = 0,
        page = 0;
      while (yOffset < canvas.height) {
        if (page > 0) pdf.addPage();
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.min(sliceH, canvas.height - yOffset);
        sliceCanvas.getContext("2d").drawImage(canvas, 0, -yOffset);
        const sliceData = sliceCanvas.toDataURL("image/png");
        pdf.addImage(
          sliceData,
          "PNG",
          10,
          10,
          imgW,
          (sliceCanvas.height * imgW) / canvas.width,
        );
        yOffset += sliceH;
        page++;
      }
    }
    pdf.save(
      isHi
        ? `JSSA_${advt.replace(/\//g, "-")}_Hindi.pdf`
        : `JSSA_${advt.replace(/\//g, "-")}_English.pdf`,
    );
  } finally {
    document.body.removeChild(container);
  }
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SHARED LAYOUT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function SharedLayout({ children, navigate, activePath = "/jobs" }) {
  const isReferral = !!new URLSearchParams(window.location.search).get("ref");

  return (
    <div
      style={{
        background: "#fff",
        fontFamily: "'Segoe UI','Noto Sans Devanagari','Noto Sans',sans-serif",
        minHeight: "100vh",
      }}
    >
      {/* Clean landing-style navbar */}
      {!isReferral && (
        <header
          style={{
            background: "#fff",
            borderBottom: "1px solid #e5e7eb",
            padding: "8px 40px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <a
            href={`${LANDING_URL}/`}
            style={{
              background: "none",
              border: 0,
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
              display: "inline-block",
            }}
          >
            <img
              src={logo}
              alt="JSS Logo"
              style={{ height: 60, width: "auto", objectFit: "contain", display: "block" }}
            />
          </a>
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flex: 1,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {navLinks.map((item) => (
              <a
                key={item.page}
                href={`${LANDING_URL}${item.page}`}
                style={{
                  color: "#1f2937",
                  textDecoration: "none",
                  padding: "9px 10px",
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            title="Brochure (coming soon)"
            style={{
              background: "#4D7C0F",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              padding: "9px 18px",
              borderRadius: 6,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            Brochure
          </a>
        </header>
      )}

      {children}

      {/* Floating buttons */}
      {!isReferral && (
        <>
          <div style={{ position: "fixed", left: 20, bottom: 20, zIndex: 1000 }}>
            <a
              href="tel:9471987611"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4D7C0F 0%, #3F6212 100%)",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(58,176,0,0.4)",
                textDecoration: "none",
              }}
              title="Call Us"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </a>
          </div>
          <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 1000 }}>
            <a
              href="https://wa.me/919471987611"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(37,211,102,0.4)",
                textDecoration: "none",
              }}
              title="WhatsApp"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </a>
          </div>
        </>
      )}

      {/* Footer */}
      {!isReferral && (
        <footer
          style={{ background: "#1F3D0C", color: "#fff", padding: "36px 18px 0" }}
        >
          <div
            className="footer-inner"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 14,
              padding: "0 80px 0 140px",
            }}
          >
            <div style={{ flex: "1 1 0", minWidth: 0 }}>
              <h4
                className="ft-heading"
                style={{
                  fontWeight: 900,
                  marginBottom: 18,
                  color: "#D9F99D",
                  letterSpacing: "0.06em",
                }}
              >
                QUICK LINKS
              </h4>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
                className="ft-list"
              >
                {quickLinks.map((l, i) => (
                  <li key={i}>
                    {l.href ? (
                      <a
                        href={l.href}
                        className="ft-link"
                        style={{
                          color: "#ffffff",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          padding: "2px 0",
                          display: "block",
                          width: "100%",
                          textDecoration: "none",
                        }}
                      >
                        {l.label}
                      </a>
                    ) : (
                      <button
                        onClick={() => navigate(l.page)}
                        className="ft-link"
                        style={{
                          color: "#ffffff",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          padding: "2px 0",
                          display: "block",
                          width: "100%",
                        }}
                      >
                        {l.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="ft-logo-wrap"
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={logo1}
                alt="JSS Logo"
                className="ft-logo-img"
                style={{ objectFit: "contain" }}
              />
            </div>
            <div
              style={{
                flex: "1 1 0",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <h4
                className="ft-heading"
                style={{
                  fontWeight: 900,
                  marginBottom: 18,
                  color: "#D9F99D",
                  letterSpacing: "0.06em",
                }}
              >
                CONTACT INFO
              </h4>
              <div
                className="ft-contact"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                <div className="ft-contact-item">
                  Helpline No. : +91-9471987611
                </div>
                <div className="ft-contact-item">
                  Email : support@jssabhiyan.com
                </div>
                <button
                  onClick={() => navigate("/contacts")}
                  className="ft-contact-link"
                  style={{
                    color: "#D9F99D",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "right",
                    padding: 0,
                    lineHeight: 1.6,
                  }}
                >
                  To know our all office branch address
                  <br />
                  click here
                </button>
              </div>
            </div>
          </div>
          <div
            className="ft-copyright"
            style={{
              textAlign: "center",
              color: "#ffffff",
              borderTop: "1px solid rgba(255,255,255,0.18)",
              fontWeight: 700,
            }}
          >
            © {new Date().getFullYear()} Jan Aarogya Sahayata Abhiyan. All Rights Reserved. Trademark &amp; Brands are
            property of their respective owner.
          </div>
        </footer>
      )}
      <style>{jobsCSS}</style>
    </div>
  );
}

/* â”€â”€ Form Fields â”€â”€ */
function FormFields({
  formData,
  handleInputChange,
  handleFileChange,
  photoPreview,
  signaturePreview,
  validationErrors,
}) {
  const iStyle = {
    width: "100%",
    padding: "9px 11px",
    border: "1px solid #ccc",
    borderRadius: 3,
    fontSize: 13,
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    color: "#000",
  };
  const lStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#444",
    marginBottom: 5,
  };
  return (
    <>
      <h3 className="jobs-section-heading">
        PERSONAL DETAILS / व्यक्तिगत विवरण
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={lStyle}>Candidate's Name / अभ्यर्थी का नाम :</label>
          <input
            name="candidateName"
            value={formData.candidateName}
            onChange={handleInputChange}
            style={{
              ...iStyle,
              borderColor: validationErrors.candidateName ? "#e53e3e" : "#ccc",
            }}
          />
          {validationErrors.candidateName && (
            <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
              {validationErrors.candidateName}
            </div>
          )}
        </div>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>Father's Name / पिता का नाम :</label>
            <input
              name="fatherName"
              value={formData.fatherName}
              onChange={handleInputChange}
              style={{
                ...iStyle,
                borderColor: validationErrors.fatherName ? "#e53e3e" : "#ccc",
              }}
            />
            {validationErrors.fatherName && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.fatherName}
              </div>
            )}
          </div>
          <div>
            <label style={lStyle}>Mother's Name / माता का नाम :</label>
            <input
              name="motherName"
              value={formData.motherName}
              onChange={handleInputChange}
              style={{
                ...iStyle,
                borderColor: validationErrors.motherName ? "#e53e3e" : "#ccc",
              }}
            />
            {validationErrors.motherName && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.motherName}
              </div>
            )}
          </div>
        </div>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>Date Of Birth / जन्मतिथि :</label>
            <input
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleInputChange}
              max={new Date().toISOString().split("T")[0]}
              style={{
                ...iStyle,
                borderColor: validationErrors.dob ? "#e53e3e" : "#ccc",
              }}
            />
            {validationErrors.dob && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.dob}
              </div>
            )}
          </div>
          <div>
            <label style={lStyle}>Gender / लिंग :</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              style={{
                ...iStyle,
                borderColor: validationErrors.gender ? "#e53e3e" : "#ccc",
              }}
            >
              <option value="">--Please Select--</option>
              <option value="male">Male / पुरुष</option>
              <option value="female">Female / महिला</option>
              <option value="other">Other / अन्य</option>
            </select>
            {validationErrors.gender && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.gender}
              </div>
            )}
          </div>
        </div>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>Nationality / राष्ट्रीयता :</label>
            <select
              name="nationality"
              value={formData.nationality}
              onChange={handleInputChange}
              style={{
                ...iStyle,
                borderColor: validationErrors.nationality ? "#e53e3e" : "#ccc",
              }}
            >
              <option value="">---Please Select---</option>
              <option value="indian">Indian / भारतीय</option>
              <option value="other">Other / अन्य</option>
            </select>
            {validationErrors.nationality && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.nationality}
              </div>
            )}
          </div>
          <div>
            <label style={lStyle}>Category / श्रेणी :</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              style={{
                ...iStyle,
                borderColor: validationErrors.category ? "#e53e3e" : "#ccc",
              }}
            >
              <option value="">---Please Select---</option>
              <option value="general">General / सामान्य</option>
              <option value="obc">OBC</option>
              <option value="sc">SC</option>
              <option value="st">ST</option>
              <option value="ews">EWS</option>
            </select>
            {validationErrors.category && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.category}
              </div>
            )}
          </div>
        </div>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>Aadhar Number / आधार संख्या :</label>
            <input
              name="aadhar"
              value={formData.aadhar}
              onChange={handleInputChange}
              maxLength={12}
              style={{
                ...iStyle,
                borderColor: validationErrors.aadhar ? "#e53e3e" : "#ccc",
              }}
            />
            {validationErrors.aadhar && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.aadhar}
              </div>
            )}
          </div>
          <div>
            <label style={lStyle}>Pan Number / पैन संख्या :</label>
            <input
              name="pan"
              value={formData.pan}
              onChange={handleInputChange}
              maxLength={10}
              style={{
                textTransform: "uppercase",
                ...iStyle,
                borderColor: validationErrors.pan ? "#e53e3e" : "#ccc",
              }}
            />
            {validationErrors.pan && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.pan}
              </div>
            )}
          </div>
        </div>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>Mobile Number / मोबाइल नंबर :</label>
            <input
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              maxLength={10}
              type="tel"
              style={{
                ...iStyle,
                borderColor: validationErrors.mobile ? "#e53e3e" : "#ccc",
              }}
            />
            {validationErrors.mobile && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.mobile}
              </div>
            )}
          </div>
          <div>
            <label style={lStyle}>Email Id / ईमेल आईडी :</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              style={{
                ...iStyle,
                borderColor: validationErrors.email ? "#e53e3e" : "#ccc",
              }}
            />
            {validationErrors.email && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.email}
              </div>
            )}
          </div>
        </div>
        <div>
          <label style={lStyle}>Permanenet Address / स्थायी पता :</label>
          <input
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            style={{
              ...iStyle,
              borderColor: validationErrors.address ? "#e53e3e" : "#ccc",
            }}
          />
          {validationErrors.address && (
            <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
              {validationErrors.address}
            </div>
          )}
        </div>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>State / राज्य :</label>
            <select
              name="state"
              value={formData.state || ""}
              onChange={handleInputChange}
              style={{
                ...iStyle,
                borderColor: validationErrors.state ? "#e53e3e" : "#ccc",
              }}
            >
              <option value="">Select</option>
              {indianStates.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            {validationErrors.state && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.state}
              </div>
            )}
          </div>
          <div>
            <label style={lStyle}>District / जिला :</label>
            <input
              name="district"
              value={formData.district}
              onChange={handleInputChange}
              style={{
                ...iStyle,
                borderColor: validationErrors.district ? "#e53e3e" : "#ccc",
              }}
            />
            {validationErrors.district && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.district}
              </div>
            )}
          </div>
        </div>
        <div className="jobs-grid-3">
          <div>
            <label style={lStyle}>Block / ब्लॉक :</label>
            <input
              name="block"
              value={formData.block}
              onChange={handleInputChange}
              style={iStyle}
            />
          </div>
          <div>
            <label style={lStyle}>Panchayat / पंचायत :</label>
            <input
              name="panchayat"
              value={formData.panchayat}
              onChange={handleInputChange}
              style={iStyle}
            />
          </div>
          <div>
            <label style={lStyle}>Postal Pin Code / डाक पिन कोड :</label>
            <input
              name="pincode"
              value={formData.pincode}
              onChange={handleInputChange}
              maxLength={6}
              style={{
                ...iStyle,
                borderColor: validationErrors.pincode ? "#e53e3e" : "#ccc",
              }}
            />
            {validationErrors.pincode && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.pincode}
              </div>
            )}
          </div>
        </div>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>Attach Photograph / फोटो लगाएं :</label>
            <input
              name="photo"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "photo")}
              style={{
                ...iStyle,
                padding: "6px 8px",
                borderColor: validationErrors.photo ? "#e53e3e" : "#ccc",
              }}
            />
            {photoPreview && (
              <img
                src={photoPreview}
                alt="photo"
                style={{
                  marginTop: 8,
                  width: 80,
                  height: 80,
                  objectFit: "cover",
                  border: `2px solid ${GREEN}`,
                  borderRadius: 4,
                }}
              />
            )}
            {validationErrors.photo && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.photo}
              </div>
            )}
            <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
              Auto-compressed to ~500KB (max 10MB input)
            </p>
          </div>
          <div>
            <label style={lStyle}>Attach Signature / हस्ताक्षर लगाएं :</label>
            <input
              name="signature"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "signature")}
              style={{
                ...iStyle,
                padding: "6px 8px",
                borderColor: validationErrors.signature ? "#e53e3e" : "#ccc",
              }}
            />
            {signaturePreview && (
              <img
                src={signaturePreview}
                alt="sig"
                style={{
                  marginTop: 8,
                  width: 140,
                  height: 55,
                  objectFit: "contain",
                  border: `2px solid ${GREEN}`,
                  borderRadius: 4,
                  background: "#fff",
                  padding: 4,
                }}
              />
            )}
            {validationErrors.signature && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.signature}
              </div>
            )}
            <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
              Auto-compressed to ~500KB (max 10MB input)
            </p>
          </div>
        </div>
      </div>
      <h3 className="jobs-section-heading" style={{ marginTop: 22 }}>
        EDUCATION DETAILS / शैक्षणिक विवरण
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>Higher Education / उच्च शिक्षा :</label>
            <input
              name="higherEducation"
              value={formData.higherEducation}
              onChange={handleInputChange}
              style={{
                ...iStyle,
                borderColor: validationErrors.higherEducation ? "#e53e3e" : "#ccc",
              }}
            />
            {validationErrors.higherEducation && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.higherEducation}
              </div>
            )}
          </div>
          <div>
            <label style={lStyle}>Board/University :</label>
            <input
              name="board"
              value={formData.board}
              onChange={handleInputChange}
              style={{
                ...iStyle,
                borderColor: validationErrors.board ? "#e53e3e" : "#ccc",
              }}
            />
            {validationErrors.board && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.board}
              </div>
            )}
          </div>
        </div>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>Marks / अंक :</label>
            <input
              name="marks"
              value={formData.marks}
              onChange={handleInputChange}
              style={{
                ...iStyle,
                borderColor: validationErrors.marks ? "#e53e3e" : "#ccc",
              }}
            />
            {validationErrors.marks && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.marks}
              </div>
            )}
          </div>
          <div>
            <label style={lStyle}>Percentage / प्रतिशत :</label>
            <input
              name="markPercentage"
              value={formData.markPercentage}
              onChange={handleInputChange}
              type="number"
              min="0"
              max="100"
              style={{
                ...iStyle,
                borderColor: validationErrors.markPercentage ? "#e53e3e" : "#ccc",
              }}
            />
            {validationErrors.markPercentage && (
              <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>
                {validationErrors.markPercentage}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* â”€â”€ Inline Review â”€â”€ */
function InlineReview({
  formData,
  photoPreview,
  signaturePreview,
  feeAmount,
  onEdit,
  onSubmit,
  applying,
  handleInputChange,
  handleFileChange,
  job,
  indianStates,
}) {
  const iStyle = {
    width: "100%",
    padding: "9px 11px",
    border: "1px solid #ccc",
    borderRadius: 3,
    fontSize: 13,
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    color: "#000",
  };
  const lStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#444",
    marginBottom: 5,
  };

  const titleEn = job?.postTitle?.en || job?.post?.en || "";
  const titleHi = job?.postTitle?.hi || job?.post?.hi || "";

  return (
    <div
      style={{
        marginTop: 16,
        background: "#fff",
        borderRadius: 4,
        padding: "24px 28px",
        border: "1px solid #e0e0e0",
      }}
    >
      {/* Main Title */}
      <h1
        style={{
          fontSize: 24,
          fontWeight: 900,
          color: "#000",
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        Form Preview / प्रपत्र पूर्वावलोकन
      </h1>

      {/* Subtitle with green lines */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            borderTop: `2px solid ${GREEN}`,
            marginBottom: 12,
          }}
        />
        <h2
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: "#000",
            textAlign: "center",
            padding: "8px 0",
            margin: 0,
          }}
        >
          {titleEn} के लिए एमओयू और सहमति का ऑनलाइन फॉर्म / {titleHi} के लिए एमओयू और सहमति का ऑनलाइन फॉर्म
        </h2>
        <div
          style={{
            borderBottom: `2px solid ${GREEN}`,
            marginTop: 12,
          }}
        />
      </div>

      {/* Instructions */}
      <div
        style={{
          background: "#f9f9f9",
          padding: "16px 18px",
          borderRadius: 4,
          marginBottom: 24,
          border: "1px solid #e0e0e0",
        }}
      >
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.7,
            color: "#333",
            marginBottom: 10,
          }}
        >
          <strong>English:</strong> You are requested to please check all the
          columns, photograph and signature are correct, If there is any
          error, correct it and submit the form by clicking on Update and
          Continue below.
        </p>
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.7,
            color: "#333",
            margin: 0,
          }}
        >
          <strong>हिंदी:</strong> आपसे अनुरोध है कि कृपया सभी कॉलम, फोटो और
          हस्ताक्षर सही से जांच लें, यदि कोई त्रुटि हो तो उसे सुधार लें और नीचे
          दिए गए अपडेट एंड कंटिन्यू पर क्लिक करके फॉर्म सबमिट कर दें।
        </p>
      </div>

      {/* Section Heading */}
      <h3
        className="jobs-section-heading"
        style={{
          fontWeight: 900,
          fontSize: 16,
          color: "#3F6212",
          margin: "24px 0 16px",
        }}
      >
        PERSONAL DETAILS / व्यक्तिगत विवरण
      </h3>

      {/* Editable Form Fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={lStyle}>
            Candidate's Name / अभ्यर्थी का नाम :
          </label>
          <input
            name="candidateName"
            value={formData.candidateName}
            onChange={handleInputChange}
            style={iStyle}
          />
        </div>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>Father's Name / पिता का नाम :</label>
            <input
              name="fatherName"
              value={formData.fatherName}
              onChange={handleInputChange}
              style={iStyle}
            />
          </div>
          <div>
            <label style={lStyle}>Mother's Name / माता का नाम :</label>
            <input
              name="motherName"
              value={formData.motherName}
              onChange={handleInputChange}
              style={iStyle}
            />
          </div>
        </div>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>Date Of Birth / जन्मतिथि :</label>
            <input
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleInputChange}
              max={new Date().toISOString().split("T")[0]}
              style={iStyle}
            />
          </div>
          <div>
            <label style={lStyle}>Gender / लिंग :</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              style={iStyle}
            >
              <option value="">--Please Select--</option>
              <option value="male">Male / पुरुष</option>
              <option value="female">Female / महिला</option>
              <option value="other">Other / अन्य</option>
            </select>
          </div>
        </div>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>Nationality / राष्ट्रीयता :</label>
            <select
              name="nationality"
              value={formData.nationality}
              onChange={handleInputChange}
              style={iStyle}
            >
              <option value="">---Please Select---</option>
              <option value="indian">Indian / भारतीय</option>
              <option value="other">Other / अन्य</option>
            </select>
          </div>
          <div>
            <label style={lStyle}>Category / श्रेणी :</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              style={iStyle}
            >
              <option value="">---Please Select---</option>
              <option value="general">General / सामान्य</option>
              <option value="obc">OBC</option>
              <option value="sc">SC</option>
              <option value="st">ST</option>
              <option value="ews">EWS</option>
            </select>
          </div>
        </div>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>Aadhar Number / आधार संख्या :</label>
            <input
              name="aadhar"
              value={formData.aadhar}
              onChange={handleInputChange}
              maxLength={12}
              style={iStyle}
            />
          </div>
          <div>
            <label style={lStyle}>Pan Number / पैन संख्या :</label>
            <input
              name="pan"
              value={formData.pan}
              onChange={handleInputChange}
              maxLength={10}
              style={{ textTransform: "uppercase", ...iStyle }}
            />
          </div>
        </div>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>Mobile Number / मोबाइल नंबर :</label>
            <input
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              maxLength={10}
              type="tel"
              style={iStyle}
            />
          </div>
          <div>
            <label style={lStyle}>Email Id / ईमेल आईडी :</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              style={iStyle}
            />
          </div>
        </div>
        <div>
          <label style={lStyle}>Permanenet Address / स्थायी पता :</label>
          <input
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            style={iStyle}
          />
        </div>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>State / राज्य :</label>
            <select
              name="state"
              value={formData.state || ""}
              onChange={handleInputChange}
              style={iStyle}
            >
              <option value="">Select</option>
              {indianStates.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={lStyle}>District / जिला :</label>
            <input
              name="district"
              value={formData.district}
              onChange={handleInputChange}
              style={iStyle}
            />
          </div>
        </div>
        <div className="jobs-grid-3">
          <div>
            <label style={lStyle}>Block / ब्लॉक :</label>
            <input
              name="block"
              value={formData.block}
              onChange={handleInputChange}
              style={iStyle}
            />
          </div>
          <div>
            <label style={lStyle}>Panchayat / पंचायत :</label>
            <input
              name="panchayat"
              value={formData.panchayat}
              onChange={handleInputChange}
              style={iStyle}
            />
          </div>
          <div>
            <label style={lStyle}>Postal Pin Code / डाक पिन कोड :</label>
            <input
              name="pincode"
              value={formData.pincode}
              onChange={handleInputChange}
              maxLength={6}
              style={iStyle}
            />
          </div>
        </div>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>Attach Photograph / फोटो लगाएं :</label>
            <input
              name="photo"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "photo")}
              style={{ ...iStyle, padding: "6px 8px" }}
            />
            {photoPreview && (
              <img
                src={photoPreview}
                alt="photo"
                style={{
                  marginTop: 8,
                  width: 80,
                  height: 80,
                  objectFit: "cover",
                  border: `2px solid ${GREEN}`,
                  borderRadius: 4,
                }}
              />
            )}
            <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
              Auto-compressed to ~500KB (max 10MB input)
            </p>
          </div>
          <div>
            <label style={lStyle}>Attach Signature / हस्ताक्षर लगाएं :</label>
            <input
              name="signature"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "signature")}
              style={{ ...iStyle, padding: "6px 8px" }}
            />
            {signaturePreview && (
              <img
                src={signaturePreview}
                alt="sig"
                style={{
                  marginTop: 8,
                  width: 140,
                  height: 55,
                  objectFit: "contain",
                  border: `2px solid ${GREEN}`,
                  borderRadius: 4,
                  background: "#fff",
                  padding: 4,
                }}
              />
            )}
            <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
              Auto-compressed to ~500KB (max 10MB input)
            </p>
          </div>
        </div>
      </div>

      <h3 className="jobs-section-heading" style={{ marginTop: 24 }}>
        EDUCATION DETAILS / शैक्षणिक विवरण
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>Higher Education / उच्च शिक्षा :</label>
            <input
              name="higherEducation"
              value={formData.higherEducation}
              onChange={handleInputChange}
              style={iStyle}
            />
          </div>
          <div>
            <label style={lStyle}>Board/University :</label>
            <input
              name="board"
              value={formData.board}
              onChange={handleInputChange}
              style={iStyle}
            />
          </div>
        </div>
        <div className="jobs-grid-2">
          <div>
            <label style={lStyle}>Marks / अंक :</label>
            <input
              name="marks"
              value={formData.marks}
              onChange={handleInputChange}
              style={iStyle}
            />
          </div>
          <div>
            <label style={lStyle}>Percentage / प्रतिशत :</label>
            <input
              name="markPercentage"
              value={formData.markPercentage}
              onChange={handleInputChange}
              type="number"
              min="0"
              max="100"
              style={iStyle}
            />
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button
          onClick={onSubmit}
          disabled={applying}
          style={{
            background: applying ? "#ccc" : "#4D7C0F",
            boxShadow: applying ? "none" : "0 6px 16px rgba(77, 124, 15,0.4), inset 0 -3px 0 0 #4D7C0F",
            color: "#fff",
            border: "none",
            padding: "12px 40px",
            borderRadius: 4,
            fontSize: 15,
            fontWeight: 900,
            cursor: applying ? "not-allowed" : "pointer",
          }}
        >
          {applying
            ? "Processing..."
            : feeAmount > 0
              ? "Update and Continue / अपडेट एंड कंटिन्यू"
              : "Update and Continue / अपडेट एंड कंटिन्यू"}
        </button>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN EXPORT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [formStep, setFormStep] = useState("form");
  const [submittedApplication, setSubmittedApplication] = useState(null);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [applying, setApplying] = useState(false);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [feeAmount, setFeeAmount] = useState(0);
  const [photo, setPhoto] = useState(null);
  const [signature, setSignature] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [agreed1, setAgreed1] = useState(false);
  const [agreed2, setAgreed2] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    applicationNumber: "",
    candidateName: "",
    fatherName: "",
    motherName: "",
    dob: "",
    gender: "",
    nationality: "",
    category: "",
    aadhar: "",
    pan: "",
    mobile: "",
    email: "",
    address: "",
    state: "",
    district: "",
    block: "",
    panchayat: "",
    pincode: "",
    higherEducation: "",
    board: "",
    marks: "",
    markPercentage: "",
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
    if (formData.gender && formData.category && id) calculateFee();
    else setFeeAmount(0);
  }, [formData.gender, formData.category, id]);

  // Validate age when DOB changes
  useEffect(() => {
    if (formData.dob && job?.ageLimit?.en) {
      const dob = new Date(formData.dob);
      const ageAsOn = job.ageAsOn ? new Date(job.ageAsOn) : new Date();
      const age = ageAsOn.getFullYear() - dob.getFullYear();
      const monthDiff = ageAsOn.getMonth() - dob.getMonth();
      const dayDiff = ageAsOn.getDate() - dob.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      const ageLimitText = job.ageLimit.en;
      const maxAgeMatch = ageLimitText.match(/(\d+)/g);
      if (maxAgeMatch && maxAgeMatch.length > 0) {
        const maxAge = Math.max(...maxAgeMatch.map(Number));
        const minAge = maxAgeMatch.length > 1 ? Math.min(...maxAgeMatch.map(Number)) : 18;

        if (actualAge < minAge) {
          setValidationErrors((prev) => ({
            ...prev,
            dob: `Age must be at least ${minAge} years. Your age is ${actualAge} years.`,
          }));
        } else if (actualAge > maxAge) {
          setValidationErrors((prev) => ({
            ...prev,
            dob: `Age must not exceed ${maxAge} years. Your age is ${actualAge} years.`,
          }));
        } else if (validationErrors.dob) {
          setValidationErrors((prev) => {
            const updated = { ...prev };
            delete updated.dob;
            return updated;
          });
        }
      }
    } else if (validationErrors.dob && !formData.dob) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated.dob;
        return updated;
      });
    }
  }, [formData.dob, job?.ageLimit?.en, job?.ageAsOn]);

  const calculateFee = async () => {
    try {
      setCalculatingFee(true);
      const response = await paymentsAPI.calculateFee(
        id,
        formData.gender,
        formData.category,
      );
      if (response.success) setFeeAmount(response.data.amount || 0);
    } catch {
      setFeeAmount(0);
    } finally {
      setCalculatingFee(false);
    }
  };

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const response = await jobPostingsAPI.getById(id);
        if (response.success && response.data.posting)
          setJob(response.data.posting);
        else setError("Job posting not found");
      } catch (err) {
        setError(err.message || "Failed to load job details");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchJob();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }

    // Handle mobile number - only digits
    let processedValue = value;
    if (name === "mobile") {
      processedValue = value.replace(/\D/g, "").substring(0, 10);
    }
    // Handle Aadhar - only digits
    if (name === "aadhar") {
      processedValue = value.replace(/\D/g, "").substring(0, 12);
    }
    // Handle Pincode - only digits
    if (name === "pincode") {
      processedValue = value.replace(/\D/g, "").substring(0, 6);
    }
    // Handle PAN - uppercase alphanumeric
    if (name === "pan") {
      processedValue = value.replace(/[^A-Z0-9]/gi, "").toUpperCase().substring(0, 10);
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: processedValue };
      if (name === "candidateName" && processedValue && !updated.applicationNumber) {
        // Generate random 9-digit number (100000000 to 999999999)
        updated.applicationNumber = String(Math.floor(100000000 + Math.random() * 900000000));
      }

      return updated;
    });
  };

  const compressImageToTargetSize = async (file, targetBytes = 500 * 1024) => {
    if (!file || file.size <= targetBytes) return file;

    const image = await new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Unable to read image file"));
      };
      img.src = objectUrl;
    });

    let width = image.naturalWidth || image.width;
    let height = image.naturalHeight || image.height;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return file;

    const baseName = (file.name || "image").replace(/\.[^/.]+$/, "");
    let smallestBlob = null;

    for (let scaleStep = 0; scaleStep < 6; scaleStep++) {
      canvas.width = Math.max(200, Math.round(width));
      canvas.height = Math.max(200, Math.round(height));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      for (let quality = 0.9; quality >= 0.3; quality -= 0.1) {
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", Number(quality.toFixed(1))),
        );
        if (!blob) continue;

        if (!smallestBlob || blob.size < smallestBlob.size) {
          smallestBlob = blob;
        }

        if (blob.size <= targetBytes) {
          return new File([blob], `${baseName}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
        }
      }

      width *= 0.85;
      height *= 0.85;
    }

    if (smallestBlob) {
      return new File([smallestBlob], `${baseName}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    }

    return file;
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB before compression.");
      return;
    }

    // Clear validation error for this file
    if (validationErrors[type]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[type];
        return updated;
      });
    }

    let processedFile = file;
    try {
      processedFile = await compressImageToTargetSize(file);
    } catch (error) {
      console.error("Image compression failed:", error);
    }

    const reader = new FileReader();
    if (type === "photo") {
      setPhoto(processedFile);
      reader.onloadend = () => setPhotoPreview(reader.result);
    } else {
      setSignature(processedFile);
      reader.onloadend = () => setSignaturePreview(reader.result);
    }
    reader.readAsDataURL(processedFile);
  };

  const isRetriableNetworkError = (error) => {
    if (!error) return false;
    const message = String(error.message || "").toLowerCase();
    return (
      error.name === "TypeError" ||
      error.name === "AbortError" ||
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("network request failed") ||
      message.includes("load failed") ||
      message.includes("timeout")
    );
  };

  const fetchWithRetry = async (
    url,
    options = {},
    { timeoutMs = 25000, retries = 2, retryDelayMs = 800 } = {},
  ) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        const shouldRetry = isRetriableNetworkError(error) && attempt < retries;
        if (!shouldRetry) {
          if (error.name === "AbortError") {
            throw new Error("Request timeout");
          }
          throw error;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelayMs * (attempt + 1)),
        );
      }
    }
    throw new Error("Network error: Request failed after retries");
  };

  const uploadApplicationFile = async (file, type, apiUrl) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const uploadResponse = await fetchWithRetry(
      `${apiUrl}/upload/application-file`,
      {
        method: "POST",
        body: formData,
      },
      { timeoutMs: 30000, retries: 2, retryDelayMs: 900 },
    );

    const contentType = uploadResponse.headers.get("content-type");
    const uploadData =
      contentType && contentType.includes("application/json")
        ? await uploadResponse.json()
        : null;

    if (!uploadResponse.ok || !uploadData?.success || !uploadData?.data?.url) {
      throw new Error(
        uploadData?.message ||
        uploadData?.error ||
        `Failed to upload ${type}`,
      );
    }

    return uploadData.data.url;
  };

  // Validation functions
  const validateAge = () => {
    if (!formData.dob || !job.ageLimit?.en) return null;

    const dob = new Date(formData.dob);
    const ageAsOn = job.ageAsOn ? new Date(job.ageAsOn) : new Date();
    const age = ageAsOn.getFullYear() - dob.getFullYear();
    const monthDiff = ageAsOn.getMonth() - dob.getMonth();
    const dayDiff = ageAsOn.getDate() - dob.getDate();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    // Extract max age from ageLimit (e.g., "18-40" or "40 years" or "Maximum 40")
    const ageLimitText = job.ageLimit.en;
    const maxAgeMatch = ageLimitText.match(/(\d+)/g);
    if (!maxAgeMatch || maxAgeMatch.length === 0) return null;

    const maxAge = Math.max(...maxAgeMatch.map(Number));
    const minAge = maxAgeMatch.length > 1 ? Math.min(...maxAgeMatch.map(Number)) : 18;

    if (actualAge < minAge) {
      return `Age must be at least ${minAge} years. Your age is ${actualAge} years.`;
    }
    if (actualAge > maxAge) {
      return `Age must not exceed ${maxAge} years. Your age is ${actualAge} years.`;
    }
    return null;
  };

  const validateMobile = () => {
    if (!formData.mobile) return "Mobile number is required";
    const mobile = formData.mobile.replace(/\D/g, "");
    if (mobile.length !== 10) {
      return "Mobile number must be exactly 10 digits";
    }
    if (!/^[6-9]/.test(mobile)) {
      return "Mobile number must start with 6, 7, 8, or 9";
    }
    return null;
  };

  const validateEmail = () => {
    if (!formData.email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const validateAadhar = () => {
    if (!formData.aadhar) return "Aadhar number is required";
    const aadhar = formData.aadhar.replace(/\D/g, "");
    if (aadhar.length !== 12) {
      return "Aadhar number must be exactly 12 digits";
    }
    return null;
  };

  const validatePAN = () => {
    if (!formData.pan) return "PAN number is required";
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(formData.pan.toUpperCase())) {
      return "PAN must be in format: ABCDE1234F";
    }
    return null;
  };

  const validatePincode = () => {
    if (!formData.pincode) return "Pin code is required";
    const pincode = formData.pincode.replace(/\D/g, "");
    if (pincode.length !== 6) {
      return "Pin code must be exactly 6 digits";
    }
    return null;
  };

  const validateAllFields = () => {
    const errors = {};

    // Required fields
    if (!formData.candidateName?.trim()) {
      errors.candidateName = "Candidate name is required";
    }
    if (!formData.fatherName?.trim()) {
      errors.fatherName = "Father's name is required";
    }
    if (!formData.motherName?.trim()) {
      errors.motherName = "Mother's name is required";
    }
    if (!formData.dob) {
      errors.dob = "Date of birth is required";
    }
    if (!formData.gender) {
      errors.gender = "Gender is required";
    }
    if (!formData.nationality) {
      errors.nationality = "Nationality is required";
    }
    if (!formData.category) {
      errors.category = "Category is required";
    }
    if (!formData.address?.trim()) {
      errors.address = "Address is required";
    }
    if (!formData.state) {
      errors.state = "State is required";
    }
    if (!formData.district?.trim()) {
      errors.district = "District is required";
    }
    if (!formData.higherEducation?.trim()) {
      errors.higherEducation = "Higher education is required";
    }
    if (!formData.board?.trim()) {
      errors.board = "Board/University is required";
    }
    if (!formData.marks?.trim()) {
      errors.marks = "Marks are required";
    }
    if (!formData.markPercentage?.trim()) {
      errors.markPercentage = "Percentage is required";
    }

    // Validate mobile
    const mobileError = validateMobile();
    if (mobileError) errors.mobile = mobileError;

    // Validate email
    const emailError = validateEmail();
    if (emailError) errors.email = emailError;

    // Validate Aadhar
    const aadharError = validateAadhar();
    if (aadharError) errors.aadhar = aadharError;

    // Validate PAN
    const panError = validatePAN();
    if (panError) errors.pan = panError;

    // Validate Pincode
    const pincodeError = validatePincode();
    if (pincodeError) errors.pincode = pincodeError;

    // Validate age
    if (formData.dob) {
      const ageError = validateAge();
      if (ageError) errors.dob = ageError;
    }

    // Validate files
    if (!photo) {
      errors.photo = "Photo is required";
    }
    if (!signature) {
      errors.signature = "Signature is required";
    }

    // Validate checkboxes
    if (!agreed1) {
      errors.agreed1 = "Please accept the terms and conditions";
    }
    if (!agreed2) {
      errors.agreed2 = "Please accept the declaration";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReview = () => {
    if (!validateAllFields()) {
      alert("Please fill all required fields correctly before submitting.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setFormStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setApplying(true);
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "";
      if (!apiUrl)
        throw new Error("VITE_API_URL or VITE_BACKEND_URL must be set");

      if (!formData.candidateName?.trim())
        throw new Error("Candidate name is required");
      if (!formData.fatherName?.trim())
        throw new Error("Father's name is required");
      const normalizedMobile = formData.mobile.replace(/\D/g, "");
      if (normalizedMobile.length !== 10)
        throw new Error("Mobile number must be exactly 10 digits");
      if (!formData.district?.trim()) throw new Error("District is required");
      if (!formData.higherEducation?.trim())
        throw new Error("Higher education is required");

      // Start order creation early so it can run in parallel with uploads/apply.
      // Removed early order creation to ensure we have an applicationId for the robust webhook link

      const [photoUrl, signatureUrl] = await Promise.all([
        uploadApplicationFile(photo, "photo", apiUrl),
        uploadApplicationFile(signature, "signature", apiUrl),
      ]);

      const requestBody = {
        ...formData,
        mobile: normalizedMobile,
        jobPostingId: id,
        photo: photoUrl,
        signature: signatureUrl,
        referredBy: new URLSearchParams(window.location.search).get("ref") || undefined,
      };
      const applyResponse = await fetchWithRetry(
        `${apiUrl}/applications/apply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        },
        { timeoutMs: 35000, retries: 1, retryDelayMs: 1200 },
      );
      const applyContentType = applyResponse.headers.get("content-type");
      const applyData =
        applyContentType && applyContentType.includes("application/json")
          ? await applyResponse.json()
          : {
            success: false,
            error:
              (await applyResponse.text()) ||
              "Server returned non-JSON response",
          };

      if (!applyResponse.ok) {
        if (applyData.errors && Array.isArray(applyData.errors))
          throw new Error(
            `Validation failed: ${applyData.errors.map((err) => err.msg || err.message).join(", ")}`,
          );
        throw new Error(
          applyData.message ||
          applyData.error ||
          "Failed to create application",
        );
      }
      if (!applyData.success)
        throw new Error(
          applyData.message ||
          applyData.error ||
          "Failed to create application",
        );

      console.log("📝 Application Created (Frontend):", applyData.data.application);
      const applicationId = applyData.data.application?._id || applyData.data.application?.id;
      const token = applyData.data.token;

      if (!applicationId) {
        console.error("❌ Critical: No Application ID returned from backend!", applyData.data);
      } else {
        console.log(`✅ Captured Application ID: ${applicationId}`);
      }

      if (feeAmount <= 0) {
        setSubmittedApplication({
          ...applyData.data.application,
          defaultPassword: applyData.data.defaultPassword,
          applicationNumber:
            applyData.data.application.applicationNumber ||
            formData.applicationNumber,
        });
        setShowSuccessPage(true);
        return;
      }

      // Create payment order with applicationId
      console.log(`💳 Initiating Payment Order: job=${id}, app=${applicationId}`);
      const orderResponse = await paymentsAPI.createOrder(
        id,
        formData.gender,
        formData.category,
        applicationId,
        token
      );
      if (!orderResponse.success)
        throw new Error(
          orderResponse.error || "Failed to create payment order",
        );
      const { orderId, amount, amountInRupees, keyId } = orderResponse.data;

      let retries = 0;
      while (!window.Razorpay && retries < 10) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        retries++;
      }
      if (!window.Razorpay)
        throw new Error(
          "Razorpay payment gateway is not loaded. Please refresh and try again.",
        );

      const razorpay = new window.Razorpay({
        key: keyId,
        amount,
        currency: "INR",
        name: "JSSA Application Fee",
        description: `Application Fee - ₹${amountInRupees}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyResponse = await paymentsAPI.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              applicationId,
              token,
            );
            if (verifyResponse.success) {
              setSubmittedApplication({
                ...applyData.data.application,
                defaultPassword: applyData.data.defaultPassword,
                applicationNumber:
                  applyData.data.application.applicationNumber ||
                  formData.applicationNumber,
              });
              setShowSuccessPage(true);
            } else {
              alert(
                `Payment verification failed: ${verifyResponse.message || "Please contact support."}`,
              );
            }
          } catch (err) {
            alert(`Payment verification failed: ${err.message}`);
          } finally {
            setApplying(false);
          }
        },
        prefill: {
          name: formData.candidateName || "",
          email: formData.email || "",
          contact: formData.mobile || "",
        },
        theme: { color: GREEN },
        modal: {
          ondismiss: () => {
            setApplying(false);
            alert("Payment cancelled. You can try again later.");
          },
        },
        notes: { applicationId, jobPostingId: id },
      });
      razorpay.on("payment.failed", (response) => {
        alert(
          `Payment failed: ${response.error.description || "Please try again."}`,
        );
        setApplying(false);
      });
      razorpay.open();
    } catch (err) {
      let errorMessage = err.message || "An error occurred while submitting.";
      if (
        errorMessage.includes("Network error") ||
        errorMessage.includes("Failed to fetch")
      ) {
        errorMessage =
          "Network error: Unable to connect to the server. Please check your internet connection and try again.";
      } else if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("Timeout")
      ) {
        errorMessage =
          "Request timeout: The server took too long to respond. Please try again.";
      }
      alert(errorMessage);
      setApplying(false);
    }
  };

  if (loading)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          fontSize: 16,
          color: "#666",
        }}
      >
        Loading jobs...
      </div>
    );
  if (error || !job)
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 16, color: "#e53e3e", marginBottom: 16 }}>
          {error || "Job posting not found"}
        </div>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "10px 20px",
            background: GREEN,
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Go Back
        </button>
      </div>
    );

  const formatFeeStructure = (feeStructure) => {
    if (
      !feeStructure ||
      !Object.keys(feeStructure).some((key) => feeStructure[key])
    )
      return "";
    const categories = [
      { key: "general", label: "General" },
      { key: "obc", label: "OBC" },
      { key: "sc", label: "SC" },
      { key: "st", label: "ST" },
      { key: "ews", label: "EWS" },
    ];

    // Check if all fees are the same
    const allFees = [];
    categories.forEach((cat) => {
      const maleFee = feeStructure[`male_${cat.key}`];
      const femaleFee = feeStructure[`female_${cat.key}`];
      if (maleFee) allFees.push(parseFloat(maleFee));
      if (femaleFee) allFees.push(parseFloat(femaleFee));
    });

    const uniqueFees = [...new Set(allFees)];
    const allSame = uniqueFees.length === 1 && allFees.length > 0;

    if (allSame) {
      return `₹${uniqueFees[0]} (FOR ALL CATEGORIES)`;
    }

    // If not all same, show detailed format
    const parts = [];
    categories.forEach((cat) => {
      const maleFee = feeStructure[`male_${cat.key}`];
      const femaleFee = feeStructure[`female_${cat.key}`];
      if (maleFee || femaleFee) {
        const feeParts = [];
        if (maleFee) feeParts.push(`Male: ${maleFee}`);
        if (femaleFee) feeParts.push(`Female: ${femaleFee}`);
        if (feeParts.length > 0)
          parts.push(`${cat.label} (${feeParts.join(", ")})`);
      }
    });
    return parts.length > 0 ? parts.join("\n") : "";
  };

  const formatFeeStructureHi = (feeStructure) => {
    if (
      !feeStructure ||
      !Object.keys(feeStructure).some((key) => feeStructure[key])
    )
      return "";
    const categories = [
      { key: "general", label: "सामान्य" },
      { key: "obc", label: "OBC" },
      { key: "sc", label: "SC" },
      { key: "st", label: "ST" },
      { key: "ews", label: "EWS" },
    ];

    // Check if all fees are the same
    const allFees = [];
    categories.forEach((cat) => {
      const maleFee = feeStructure[`male_${cat.key}`];
      const femaleFee = feeStructure[`female_${cat.key}`];
      if (maleFee) allFees.push(parseFloat(maleFee));
      if (femaleFee) allFees.push(parseFloat(femaleFee));
    });

    const uniqueFees = [...new Set(allFees)];
    const allSame = uniqueFees.length === 1 && allFees.length > 0;

    if (allSame) {
      return `₹${uniqueFees[0]} (सभी श्रेणियों के लिए)`;
    }

    // If not all same, show detailed format
    const parts = [];
    categories.forEach((cat) => {
      const maleFee = feeStructure[`male_${cat.key}`];
      const femaleFee = feeStructure[`female_${cat.key}`];
      if (maleFee || femaleFee) {
        const feeParts = [];
        if (maleFee) feeParts.push(`पुरुष: ${maleFee}`);
        if (femaleFee) feeParts.push(`महिला: ${femaleFee}`);
        if (feeParts.length > 0)
          parts.push(`${cat.label} (${feeParts.join(", ")})`);
      }
    });
    return parts.length > 0 ? parts.join("\n") : "";
  };

  const feeStructureText =
    formatFeeStructure(job.feeStructure) || job.fee?.en || "";
  const feeStructureTextHi =
    formatFeeStructureHi(job.feeStructure) ||
    pickHindiOrFallback(job.fee?.hi, job.fee?.en || "");

  const rowsEn = [
    ["Post", job.post?.en || job.postTitle?.en || ""],
    ["Total Post", job.totalPost || ""],
    ["Monthly Income", job.income?.en || ""],
    ["Education Qualification", job.education?.en || ""],
    [
      "Age Limit",
      `${job.ageLimit?.en || ""}${job.ageAsOn ? ` (As on ${job.ageAsOn})` : ""}`,
    ],
    ["Job Location", job.location?.en || ""],
    ["Selection Process", job.selectionProcess?.en || ""],
    ["Onboarding & Training Start Date", job.firstMeritListDate || ""],
    ["Work Commencement Date / Work Start Date", job.finalMeritListDate || ""],
    ["Fee Structure", feeStructureText],
  ].filter((r) => r[1]);

  const rowsHi = [
    ["पद", pickHindiOrFallback(job.post?.hi || job.postTitle?.hi, job.post?.en || job.postTitle?.en || "")],
    ["कुल पद", job.totalPost || ""],
    ["मासिक आय", pickHindiOrFallback(job.income?.hi, job.income?.en || "")],
    ["शैक्षणिक योग्यता", pickHindiOrFallback(job.education?.hi, job.education?.en || "")],
    [
      "आयु सीमा",
      `${pickHindiOrFallback(job.ageLimit?.hi, job.ageLimit?.en || "")}${job.ageAsOn ? ` (${job.ageAsOn} को)` : ""}`,
    ],
    ["नौकरी करने का स्थान", pickHindiOrFallback(job.location?.hi, job.location?.en || "")],
    ["चयन प्रक्रिया", pickHindiOrFallback(job.selectionProcess?.hi, job.selectionProcess?.en || "")],
    ["आवेदन खुलने की तिथि", job.applicationOpeningDate || ""],
    ["आवेदन की अंतिम तिथि", job.lastDate || ""],
    ["जॉइनिंग एवं प्रशिक्षण प्रारंभ तिथि", job.firstMeritListDate || ""],
    ["कार्य प्रारंभ तिथि", job.finalMeritListDate || ""],
    ["शुल्क संरचना", feeStructureTextHi],
  ].filter((r) => r[1]);

  const rows = Math.max(rowsEn.length, rowsHi.length);
  const isActive = job.status === "Active";
  const titleEn = job.postTitle?.en || job.post?.en || "";
  const titleHi = pickHindiOrFallback(
    job.postTitle?.hi || job.post?.hi,
    job.postTitle?.en || job.post?.en || "",
  );

  return (
    <SharedLayout navigate={navigate} activePath="/jobs">
      <div
        style={{ maxWidth: 1400, margin: "20px auto 40px", padding: "0 2%" }}
      >
        {formStep !== "review" && (
          <div
            style={{
              border: `2px solid ${GREEN}`,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            {/* â”€â”€ Title row â”€â”€ */}
            <div className="jobs-detail-title-row">
              Recruitment for the Post of {titleEn} Advt. No. {job.advtNo}{" "}
              /&nbsp;
              {titleHi} विज्ञापन संख्या: {job.advtNo}
            </div>

            {/* â”€â”€ Download row â”€â”€ */}
            <div className="jobs-detail-download-row">
              <div
                className="jobs-detail-download-cell"
                style={{ borderRight: `1px solid ${GREEN}55` }}
              >
                <div className="advt-label">Advt No: {job.advtNo}</div>
                {job.date && <div className="advt-date">Date: {job.date}</div>}
                <button
                  className="dl-link"
                  onClick={async () => {
                    setDownloading("en");
                    try {
                      await downloadJobPDF(job, "en");
                    } catch (e) {
                      alert("PDF download failed: " + e.message);
                    } finally {
                      setDownloading(null);
                    }
                  }}
                  disabled={!!downloading}
                >
                  <span style={{ marginRight: "6px", display: "inline-flex", alignItems: "center", verticalAlign: "middle" }}>
                    <svg width="22" height="26" viewBox="0 0 22 26" style={{ marginRight: "4px", flexShrink: 0 }}>
                      {/* White paper background */}
                      <rect width="18" height="22" x="2" y="2" fill="#ffffff" stroke="#d0d0d0" strokeWidth="0.5" rx="0.5" />
                      {/* Folded corner */}
                      <path d="M 18 2 L 20 2 L 20 4 L 18 2 Z" fill="#e0e0e0" stroke="#d0d0d0" strokeWidth="0.5" />
                      {/* Red PDF header banner */}
                      <rect width="18" height="4" x="2" y="2" fill="#c0392b" rx="0.5" />
                      {/* PDF text - PD in one box, F in separate */}
                      <rect width="6" height="2.5" x="3" y="2.5" fill="#c0392b" />
                      <text x="3.5" y="4" fontSize="5" fill="#ffffff" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="0.2">PD</text>
                      <rect width="3.5" height="2.5" x="9.5" y="2.5" fill="#c0392b" />
                      <text x="10" y="4" fontSize="5" fill="#ffffff" fontWeight="900" fontFamily="Arial, sans-serif">F</text>
                      {/* Adobe Acrobat logo (stylized A) */}
                      <path d="M 9 9 L 11 13 L 13 9 M 10 11 L 12 11" stroke="#c0392b" strokeWidth="0.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 11 9 L 11 13" stroke="#c0392b" strokeWidth="0.8" strokeLinecap="round" />
                    </svg>
                  </span>
                  {downloading === "en" ? (
                    "Generating PDF..."
                  ) : (
                    <>
                      <span style={{ fontWeight: 900 }}>
                        Download Advertisement (English Version) Click Here ✤✤
                      </span>
                      <span className="new-badge">NEW</span>
                    </>
                  )}
                </button>
              </div>
              <div className="jobs-detail-download-cell">
                <div className="advt-label">विज्ञापन सं.: {job.advtNo}</div>
                {job.date && (
                  <div className="advt-date">दिनांक - {job.date}</div>
                )}
                <button
                  className="dl-link"
                  onClick={async () => {
                    setDownloading("hi");
                    try {
                      await downloadJobPDF(job, "hi");
                    } catch (e) {
                      alert("PDF download failed: " + e.message);
                    } finally {
                      setDownloading(null);
                    }
                  }}
                  disabled={!!downloading}
                >
                  <span style={{ marginRight: "6px", display: "inline-flex", alignItems: "center", verticalAlign: "middle" }}>
                    <svg width="22" height="26" viewBox="0 0 22 26" style={{ marginRight: "4px", flexShrink: 0 }}>
                      {/* White paper background */}
                      <rect width="18" height="22" x="2" y="2" fill="#ffffff" stroke="#d0d0d0" strokeWidth="0.5" rx="0.5" />
                      {/* Folded corner */}
                      <path d="M 18 2 L 20 2 L 20 4 L 18 2 Z" fill="#e0e0e0" stroke="#d0d0d0" strokeWidth="0.5" />
                      {/* Red PDF header banner */}
                      <rect width="18" height="4" x="2" y="2" fill="#c0392b" rx="0.5" />
                      {/* PDF text - PD in one box, F in separate */}
                      <rect width="6" height="2.5" x="3" y="2.5" fill="#c0392b" />
                      <text x="3.5" y="4" fontSize="5" fill="#ffffff" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="0.2">PD</text>
                      <rect width="3.5" height="2.5" x="9.5" y="2.5" fill="#c0392b" />
                      <text x="10" y="4" fontSize="5" fill="#ffffff" fontWeight="900" fontFamily="Arial, sans-serif">F</text>
                      {/* Adobe Acrobat logo (stylized A) */}
                      <path d="M 9 9 L 11 13 L 13 9 M 10 11 L 12 11" stroke="#c0392b" strokeWidth="0.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 11 9 L 11 13" stroke="#c0392b" strokeWidth="0.8" strokeLinecap="round" />
                    </svg>
                  </span>
                  {downloading === "hi" ? (
                    "PDF बन रहा है..."
                  ) : (
                    <>
                      <span style={{ fontWeight: 900 }}>
                        डाउनलोड विज्ञापन (हिंदी संस्करण) यहाँ क्लिक करें ✤✤
                      </span>
                      <span className="new-badge">NEW</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* â”€â”€ Data rows â€” key | : | value â”€â”€ */}
            {Array.from({ length: rows }).map((_, i) => {
              const isFee =
                rowsEn[i]?.[0] === "Fee Structure" ||
                rowsHi[i]?.[0] === "शुल्क संरचना";
              return (
                <div
                  key={i}
                  className={`jobs-detail-row ${i % 2 === 0 ? "row-odd" : "row-even"}`}
                >
                  {/* English half */}
                  <div
                    className="jobs-detail-lang-cell"
                    style={{ borderRight: `1px solid #ECFCCB` }}
                  >
                    <div className="jobs-detail-key">
                      {rowsEn[i]?.[0] || ""}
                    </div>
                    <div className="jobs-detail-colon">:</div>
                    <div
                      className="jobs-detail-val"
                      style={isFee ? { whiteSpace: "pre-line" } : {}}
                    >
                      {rowsEn[i]?.[1] || ""}
                    </div>
                  </div>
                  {/* Hindi half */}
                  <div className="jobs-detail-lang-cell">
                    <div className="jobs-detail-key">
                      {rowsHi[i]?.[0] || ""}
                    </div>
                    <div className="jobs-detail-colon">:</div>
                    <div
                      className="jobs-detail-val"
                      style={isFee ? { whiteSpace: "pre-line" } : {}}
                    >
                      {rowsHi[i]?.[1] || ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Form / Closed / Review */}
        {!isActive ? (
          <div
            style={{
              marginTop: 16,
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: 6,
              padding: "12px 18px",
              fontSize: 14,
              fontWeight: 700,
              color: "#8B1a1a",
            }}
          >
            ⚠️ This vacancy is closed1. / यह भर्ती बंद हो चुकी है।
          </div>
        ) : formStep === "review" ? (
          <InlineReview
            formData={formData}
            photoPreview={photoPreview}
            signaturePreview={signaturePreview}
            feeAmount={feeAmount}
            onEdit={() => {
              setFormStep("form");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onSubmit={handleSubmit}
            applying={applying}
            handleInputChange={handleInputChange}
            handleFileChange={handleFileChange}
            job={job}
            indianStates={indianStates}
          />
        ) : (
          <>
            <div
              style={{
                marginTop: 16,
                background: "#f0f0f0",
                borderRadius: "4px 4px 0 0",
                padding: "10px 16px",
                textAlign: "center",
                fontSize: 12,
                fontWeight: 600,
                color: "#3F6212",
              }}
            >
              Recruitment for the Post of {titleEn} Advt. No. {job.advtNo} /{" "}
              {titleHi} {job.advtNo}
            </div>
            <div
              style={{
                background: "#f0f0f0",
                borderRadius: "0 0 4px 4px",
                padding: "20px 20px 28px",
              }}
            >
              <FormFields
                formData={formData}
                handleInputChange={handleInputChange}
                handleFileChange={handleFileChange}
                photoPreview={photoPreview}
                signaturePreview={signaturePreview}
                validationErrors={validationErrors}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginTop: 20,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={agreed1}
                      onChange={(e) => {
                        setAgreed1(e.target.checked);
                        if (e.target.checked && validationErrors.agreed1) {
                          setValidationErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.agreed1;
                            return updated;
                          });
                        }
                      }}
                      style={{
                        width: 15,
                        height: 15,
                        marginTop: 2,
                        flexShrink: 0,
                        accentColor: GREEN,
                      }}
                    />
                    I have read and agree to the Terms and Conditions.{" "}
                    <a
                      href="#"
                      style={{
                        color: "#000",
                        fontWeight: 700,
                        textDecoration: "underline",
                        marginLeft: 4,
                      }}
                    >
                      Click here to read
                    </a>
                  </label>
                  {validationErrors.agreed1 && (
                    <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4, marginLeft: 23 }}>
                      {validationErrors.agreed1}
                    </div>
                  )}
                </div>
                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      fontSize: 13,
                      cursor: "pointer",
                      lineHeight: 1.6,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={agreed2}
                      onChange={(e) => {
                        setAgreed2(e.target.checked);
                        if (e.target.checked && validationErrors.agreed2) {
                          setValidationErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.agreed2;
                            return updated;
                          });
                        }
                      }}
                      style={{
                        width: 15,
                        height: 15,
                        marginTop: 2,
                        flexShrink: 0,
                        accentColor: GREEN,
                      }}
                    />
                    I declare that all the information given in this application
                    form is correct to the best of my knowledge and belief.
                  </label>
                  {validationErrors.agreed2 && (
                    <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4, marginLeft: 23 }}>
                      {validationErrors.agreed2}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "center", marginTop: 22 }}>
                <button onClick={handleReview} className="jobs-submit-btn">
                  SUBMIT &amp; CONTINUE
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Success Popup Modal */}
      {showSuccessPage && submittedApplication && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              navigate("/");
            }
          }}
        >
          <div
            id="application-slip-pdf"
            style={{
              background: "#fff",
              borderRadius: 0,
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              padding: 0,
              position: "relative",
              fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Header with timestamp and title */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 20px",
                background: "#fff",
                borderBottom: "1px solid #e0e0e0",
              }}
            >
              <div style={{ fontSize: 12, color: "#666" }}>
                {new Date().toLocaleString("en-US", {
                  month: "numeric",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#000",
                  textAlign: "center",
                }}
              >
                Application Slip - {job?.postTitle?.en || job?.post?.en || ""} Recruitment 2024
              </div>
            </div>

            {/* Logo and Organization Section */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "20px",
                background: "#fff",
                borderBottom: "1px solid #e0e0e0",
              }}
            >
              {/* Circular Logo */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${GREEN} 0%, #3F6212 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: 900,
                  flexShrink: 0,
                  border: "3px solid #fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    border: "2px solid #fff",
                  }}
                />
                <div style={{ zIndex: 1, textAlign: "center", lineHeight: 1.1 }}>
                  JSSA
                </div>
              </div>

              {/* Organization Text */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: GREEN,
                    marginBottom: 6,
                    lineHeight: 1.2,
                  }}
                >
                  जन स्वास्थ्य सहायता अभियान
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#000",
                    marginBottom: 4,
                    fontWeight: 600,
                  }}
                >
                  A Project Of Healthcare Research & Development Board
                </div>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>
                  (HRDB is Division of social welfare organization "NAC India")
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: GREEN,
                  }}
                >
                  Registration No.: 053083
                </div>
              </div>
            </div>

            {/* Black Recruitment Title Bar */}
            <div
              style={{
                background: "#000",
                color: "#fff",
                padding: "12px 20px",
                textAlign: "center",
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: 0.5,
              }}
            >
              {job?.postTitle?.en || job?.post?.en || ""} Recruitment
            </div>

            {/* Application Details Black Bar */}
            <div
              style={{
                background: "#000",
                color: "#fff",
                padding: "10px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                Advt. No.: {job?.advtNo || ""}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  textAlign: "center",
                  flex: 1,
                }}
              >
                Application Slip
              </div>
              <div style={{ fontSize: 12 }}>
                Date: {new Date().toLocaleString("en-US", {
                  month: "numeric",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>

            {/* Post Applied and Application Number */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "16px 20px",
                background: "#f9f9f9",
                borderBottom: "1px solid #e0e0e0",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                Post Applied for: {job?.postTitle?.en || job?.post?.en || ""}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                Application No.: {submittedApplication.applicationNumber || formData.applicationNumber}
              </div>
            </div>

            {/* Personal Details Section with Photo */}
            <div
              style={{
                padding: "20px",
                background: "#fff",
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: "#000",
                  marginBottom: 16,
                  paddingBottom: 8,
                  borderBottom: "2px solid #e0e0e0",
                }}
              >
                Personal Details
              </h3>

              <div style={{ display: "flex", gap: 24 }}>
                {/* Left side - Details */}
                <div
                  style={{
                    flex: 1,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px 24px",
                    fontSize: 13,
                    lineHeight: 1.8,
                  }}
                >
                  <div>
                    <strong style={{ color: "#333" }}>Name:</strong>{" "}
                    <span style={{ color: "#000" }}>
                      {formData.candidateName?.toUpperCase() || ""}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: "#333" }}>Application No.:</strong>{" "}
                    <span style={{ color: "#000" }}>
                      {submittedApplication.applicationNumber || formData.applicationNumber}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: "#333" }}>Father's Name:</strong>{" "}
                    <span style={{ color: "#000" }}>
                      {formData.fatherName?.toUpperCase() || ""}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: "#333" }}>Mother's Name:</strong>{" "}
                    <span style={{ color: "#000" }}>
                      {formData.motherName?.toUpperCase() || ""}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: "#333" }}>Date of Birth:</strong>{" "}
                    <span style={{ color: "#000" }}>
                      {formData.dob
                        ? new Date(formData.dob).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                        : ""}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: "#333" }}>Gender:</strong>{" "}
                    <span style={{ color: "#000" }}>
                      {formData.gender?.charAt(0).toUpperCase() +
                        formData.gender?.slice(1) || ""}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: "#333" }}>Nationality:</strong>{" "}
                    <span style={{ color: "#000" }}>
                      {formData.nationality?.charAt(0).toUpperCase() +
                        formData.nationality?.slice(1) || ""}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: "#333" }}>Category:</strong>{" "}
                    <span style={{ color: "#000" }}>
                      {formData.category?.toUpperCase() || ""}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: "#333" }}>Aadhar Number:</strong>{" "}
                    <span style={{ color: "#000" }}>{formData.aadhar || ""}</span>
                  </div>
                  <div>
                    <strong style={{ color: "#333" }}>PAN Number:</strong>{" "}
                    <span style={{ color: "#000" }}>
                      {formData.pan?.toUpperCase() || ""}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: "#333" }}>Mobile Number:</strong>{" "}
                    <span style={{ color: "#000" }}>{formData.mobile || ""}</span>
                  </div>
                  <div>
                    <strong style={{ color: "#333" }}>Email ID:</strong>{" "}
                    <span style={{ color: "#000" }}>{formData.email || ""}</span>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <strong style={{ color: "#333" }}>Permanent Address:</strong>{" "}
                    <span style={{ color: "#000" }}>
                      {formData.address?.toUpperCase() || ""}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: "#333" }}>State:</strong>{" "}
                    <span style={{ color: "#000" }}>{formData.state || ""}</span>
                  </div>
                  <div>
                    <strong style={{ color: "#333" }}>District:</strong>{" "}
                    <span style={{ color: "#000" }}>
                      {formData.district || ""}
                    </span>
                  </div>
                  {formData.block && (
                    <div>
                      <strong style={{ color: "#333" }}>Block:</strong>{" "}
                      <span style={{ color: "#000" }}>{formData.block}</span>
                    </div>
                  )}
                  {formData.panchayat && (
                    <div>
                      <strong style={{ color: "#333" }}>Panchayat:</strong>{" "}
                      <span style={{ color: "#000" }}>{formData.panchayat}</span>
                    </div>
                  )}
                  <div>
                    <strong style={{ color: "#333" }}>Pin Code:</strong>{" "}
                    <span style={{ color: "#000" }}>{formData.pincode || ""}</span>
                  </div>
                </div>

                {/* Right side - Photo */}
                {photoPreview && (
                  <div
                    style={{
                      width: 140,
                      flexShrink: 0,
                      textAlign: "center",
                    }}
                  >
                    <img
                      src={photoPreview}
                      alt="Applicant Photo"
                      style={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                        border: "2px solid #000",
                        borderRadius: 4,
                        display: "block",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Educational Details */}
            <div
              style={{
                padding: "20px",
                background: "#fff",
                borderTop: "1px solid #e0e0e0",
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: "#000",
                  marginBottom: 16,
                  paddingBottom: 8,
                  borderBottom: "2px solid #e0e0e0",
                }}
              >
                Educational Details
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px 24px",
                  fontSize: 13,
                  lineHeight: 1.8,
                }}
              >
                <div>
                  <strong style={{ color: "#333" }}>Higher Education:</strong>{" "}
                  <span style={{ color: "#000" }}>
                    {formData.higherEducation || ""}
                  </span>
                </div>
                <div>
                  <strong style={{ color: "#333" }}>Board/University:</strong>{" "}
                  <span style={{ color: "#000" }}>{formData.board || ""}</span>
                </div>
                <div>
                  <strong style={{ color: "#333" }}>Total Marks:</strong>{" "}
                  <span style={{ color: "#000" }}>{formData.marks || ""}</span>
                </div>
                <div>
                  <strong style={{ color: "#333" }}>Marks in Percentage:</strong>{" "}
                  <span style={{ color: "#000" }}>
                    {formData.markPercentage || ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature Section */}
            {signaturePreview && (
              <div
                style={{
                  padding: "20px",
                  background: "#fff",
                  borderTop: "1px solid #e0e0e0",
                  textAlign: "right",
                }}
              >
                <img
                  src={signaturePreview}
                  alt="Signature"
                  style={{
                    width: 200,
                    height: 80,
                    objectFit: "contain",
                    border: "1px solid #ccc",
                    background: "#fff",
                    padding: 8,
                    display: "inline-block",
                  }}
                />
                <div
                  style={{
                    fontSize: 12,
                    marginTop: 6,
                    fontWeight: 600,
                    color: "#000",
                  }}
                >
                  Candidate's Signature
                </div>
              </div>
            )}

            {/* Application Status Table */}
            <div
              style={{
                marginTop: 20,
                padding: "0 20px 20px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                  border: "1px solid #e0e0e0",
                }}
              >
                <thead>
                  <tr style={{ background: "#3F6212", color: "#fff" }}>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: 700,
                        border: "1px solid #3F6212",
                      }}
                    >
                      Application No.
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: 700,
                        border: "1px solid #3F6212",
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: 700,
                        border: "1px solid #3F6212",
                      }}
                    >
                      Payment Status:
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: 700,
                        border: "1px solid #3F6212",
                      }}
                    >
                      Date:
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: "#f9f9f9" }}>
                    <td
                      style={{
                        padding: "12px",
                        border: "1px solid #e0e0e0",
                        color: "#000",
                      }}
                    >
                      {submittedApplication.applicationNumber ||
                        formData.applicationNumber}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        border: "1px solid #e0e0e0",
                        color: "#000",
                      }}
                    >
                      {formData.email || ""}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        border: "1px solid #e0e0e0",
                        color: GREEN,
                        fontWeight: 700,
                      }}
                    >
                      Complete
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        border: "1px solid #e0e0e0",
                        color: "#000",
                      }}
                    >
                      {new Date().toLocaleString("en-US", {
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
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "16px 20px",
                borderTop: "1px solid #e0e0e0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 11,
                color: "#666",
                background: "#f9f9f9",
              }}
            >
              <div style={{ wordBreak: "break-all" }}>
                https://jssabhiyan.com/fill_application_print?oid=
                {submittedApplication._id || submittedApplication.id}
              </div>
              <div>1/1</div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: 12,
                padding: "20px",
                justifyContent: "center",
                flexWrap: "wrap",
                background: "#fff",
                borderTop: "2px solid #e0e0e0",
              }}
            >
              <button
                onClick={async (e) => {
                  try {
                    // Load libraries if not already loaded
                    if (!window.html2canvas) {
                      await loadScript(
                        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
                      );
                    }
                    if (!window.jspdf) {
                      await loadScript(
                        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
                      );
                    }

                    // Wait a bit for libraries to initialize
                    await new Promise((resolve) => setTimeout(resolve, 500));

                    const container = document.getElementById("application-slip-pdf");
                    if (!container) {
                      alert("Application slip container not found.");
                      return;
                    }

                    if (!window.html2canvas || !window.jspdf) {
                      alert(
                        "PDF libraries not loaded. Please wait a moment and try again.",
                      );
                      return;
                    }

                    // Show loading message
                    const button = e.target;
                    const originalText = button.innerHTML;
                    button.innerHTML = "â³ Generating PDF...";
                    button.disabled = true;

                    try {
                      // Ensure container is fully visible and expanded
                      const originalOverflow = container.style.overflow;
                      const originalMaxHeight = container.style.maxHeight;
                      container.style.overflow = "visible";
                      container.style.maxHeight = "none";
                      container.style.height = "auto";

                      // Wait for all images to load completely
                      const images = container.querySelectorAll("img");
                      await Promise.all(
                        Array.from(images).map((img) => {
                          // If image is already loaded and has dimensions, resolve immediately
                          if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                            return Promise.resolve();
                          }
                          // Otherwise wait for load
                          return new Promise((resolve) => {
                            const timeout = setTimeout(() => {
                              console.log("Image load timeout:", img.src.substring(0, 50));
                              resolve();
                            }, 5000);
                            img.onload = () => {
                              clearTimeout(timeout);
                              // Double check dimensions after load
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
                            // Force reload if src is set but not loaded
                            if (img.src && !img.complete) {
                              const currentSrc = img.src;
                              img.src = "";
                              img.src = currentSrc;
                            }
                          });
                        }),
                      );
                      // Additional wait to ensure images are rendered
                      await new Promise((resolve) => setTimeout(resolve, 500));

                      // Get full height including all content
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

                      // For base64 images, use allowTaint: false and useCORS: false
                      const canvas = await window.html2canvas(container, {
                        scale: 2,
                        useCORS: false, // Base64 images don't need CORS
                        logging: false,
                        backgroundColor: "#ffffff",
                        allowTaint: false, // Set to false for base64 images
                        width: fullWidth,
                        height: fullHeight,
                        windowWidth: fullWidth,
                        windowHeight: fullHeight,
                        scrollX: 0,
                        scrollY: 0,
                        removeContainer: false,
                        imageTimeout: 15000, // Increase timeout for base64 images
                      });

                      // Restore original styles
                      container.style.overflow = originalOverflow;
                      container.style.maxHeight = originalMaxHeight;
                      container.style.height = "";

                      const { jsPDF } = window.jspdf;
                      const imgData = canvas.toDataURL("image/png", 1.0);

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

                      pdf.save(
                        `Application_Slip_${submittedApplication.applicationNumber ||
                        formData.applicationNumber
                        }.pdf`,
                      );
                    } finally {
                      button.innerHTML = originalText;
                      button.disabled = false;
                    }
                  } catch (err) {
                    console.error("PDF generation error:", err);
                    alert("Failed to generate PDF: " + (err.message || "Unknown error"));
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
                ðŸ“¥ Download PDF
              </button>
              <button
                onClick={() => {
                  navigate("/login");
                }}
                style={{
                  background: "#3F6212",
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
                ðŸ” Login
              </button>
              <button
                onClick={() => {
                  navigate("/");
                }}
                style={{
                  background: "#6c757d",
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
                ✖ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </SharedLayout>
  );
}

