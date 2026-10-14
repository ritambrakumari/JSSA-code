import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jobPostingsAPI } from "../../utils/api.js";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, MapPin, Clock3 } from "lucide-react";

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

const districtsByState = {
  Bihar: [
    "Patna",
    "Gaya",
    "Muzaffarpur",
    "Bhagalpur",
    "Darbhanga",
    "Purnia",
    "Samastipur",
    "Begusarai",
    "Nalanda",
    "Rohtas",
    "Araria",
    "Aurangabad",
    "Banka",
    "Buxar",
    "Gopalganj",
    "Jamui",
    "Katihar",
    "Khagaria",
    "Kishanganj",
    "Madhepura",
    "Madhubani",
    "Munger",
    "Nawada",
    "Saran",
    "Sitamarhi",
    "Siwan",
    "Supaul",
    "Vaishali",
    "West Champaran",
    "East Champaran",
  ],
  Jharkhand: [
    "Ranchi",
    "Dhanbad",
    "Jamshedpur",
    "Bokaro",
    "Hazaribagh",
    "Giridih",
    "Deoghar",
    "Dumka",
    "Pakur",
    "Garhwa",
    "Chatra",
    "Gumla",
    "Khunti",
    "Koderma",
    "Latehar",
    "Lohardaga",
    "Palamu",
    "Ramgarh",
    "Sahibganj",
    "Seraikela",
    "Simdega",
  ],
  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur",
    "Agra",
    "Varanasi",
    "Allahabad",
    "Meerut",
    "Noida",
    "Ghaziabad",
    "Bareilly",
    "Aligarh",
    "Gorakhpur",
    "Moradabad",
    "Saharanpur",
    "Faizabad",
    "Jhansi",
    "Mathura",
  ],
  "Madhya Pradesh": [
    "Bhopal",
    "Indore",
    "Gwalior",
    "Jabalpur",
    "Ujjain",
    "Sagar",
    "Dewas",
    "Satna",
    "Ratlam",
    "Rewa",
  ],
  Maharashtra: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Thane",
    "Nashik",
    "Aurangabad",
    "Solapur",
    "Kolhapur",
    "Amravati",
    "Nanded",
  ],
  Rajasthan: [
    "Jaipur",
    "Jodhpur",
    "Kota",
    "Bikaner",
    "Ajmer",
    "Udaipur",
    "Bhilwara",
    "Alwar",
    "Bharatpur",
    "Sikar",
  ],
  Gujarat: [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Gandhinagar",
    "Bhavnagar",
    "Jamnagar",
    "Junagadh",
  ],
  "West Bengal": [
    "Kolkata",
    "Howrah",
    "Darjeeling",
    "Jalpaiguri",
    "Murshidabad",
    "Bardhaman",
    "Nadia",
    "North 24 Parganas",
    "South 24 Parganas",
  ],
  Delhi: [
    "Central Delhi",
    "East Delhi",
    "New Delhi",
    "North Delhi",
    "North East Delhi",
    "South Delhi",
    "West Delhi",
  ],
  Assam: [
    "Guwahati",
    "Dibrugarh",
    "Silchar",
    "Jorhat",
    "Nagaon",
    "Tinsukia",
    "Kamrup",
    "Barpeta",
  ],
  Odisha: [
    "Bhubaneswar",
    "Cuttack",
    "Rourkela",
    "Berhampur",
    "Sambalpur",
    "Puri",
    "Balasore",
    "Bhadrak",
  ],
  Uttarakhand: [
    "Dehradun",
    "Haridwar",
    "Roorkee",
    "Haldwani",
    "Rudrapur",
    "Kashipur",
    "Rishikesh",
    "Nainital",
  ],
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

async function downloadPDF(job, lang) {
  const isHi = lang === "hi";
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  );
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  );
  const rows = isHi ? job.rows.hi : job.rows.en;
  const container = document.createElement("div");
  container.style.cssText = `position:fixed;left:-9999px;top:0;width:700px;background:#fff;font-family:'Noto Sans Devanagari','Noto Sans',Arial,sans-serif;font-size:13px;color:#000;border:2px solid #888;border-radius:8px;overflow:hidden;`;
  const tableRowsHTML = rows
    .map(
      (r, i) =>
        `<tr><td style="padding:9px 14px;font-weight:700;background:${i % 2 === 0 ? "#efefef" : "#fff"};border:1px solid #ccc;width:35%;vertical-align:top">${r[0]}</td><td style="padding:9px 8px;background:${i % 2 === 0 ? "#efefef" : "#fff"};border:1px solid #ccc;width:4%;text-align:center;vertical-align:top">:</td><td style="padding:9px 14px;background:${i % 2 === 0 ? "#efefef" : "#fff"};border:1px solid #ccc;vertical-align:top;line-height:1.6">${r[1]}</td></tr>`,
    )
    .join("");
  container.innerHTML = `<div style="background:#1e2840;display:flex;align-items:center;gap:16px;padding:14px 20px"><div style="width:64px;height:64px;border-radius:50%;background:${GREEN};border:3px solid #fff;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:14px">JSS</div><div><div style="color:#fff;font-size:${isHi ? "22px" : "19px"};font-weight:900;line-height:1.2">${isHi ? "जन स्वास्थ्य सहायता अभियान" : "JAN SWASTHYA SAHAYATA ABHIYAN"}</div><div style="color:#fff;font-size:13px;font-weight:700;margin-top:4px">A Project of Healthcare Research &amp; Development Board</div><div style="color:rgba(255,255,255,0.7);font-size:11px;margin-top:2px">(HRDB is Division Of Social Welfare Organization "NAC India")</div></div></div><div style="display:flex;align-items:center;justify-content:space-between;padding:10px 20px;background:#f5f5f5;border-bottom:2px solid #ddd"><span style="font-weight:700;font-size:13px;color:#1e2840">${isHi ? "विज्ञापन सं0 :" : "Advt. No. :"} ${job.advt}</span><span style="background:#1e2840;color:#fff;font-weight:900;font-size:12px;padding:7px 18px;border-radius:2px;letter-spacing:0.05em">${isHi ? "भर्ती आमंत्रण" : "RECRUITMENT INVITATION"}</span><span style="font-weight:700;font-size:13px;color:#1e2840">${isHi ? "दिनांक :" : "DATE :"} ${job.date}</span></div><div style="background:#1e2840;color:#fff;padding:14px 20px;text-align:center;font-size:${isHi ? "15px" : "13px"};font-weight:700;line-height:1.6">${isHi ? job.invitationHi : job.invitationEn}</div><div style="padding:16px 20px"><table style="width:100%;border-collapse:collapse;font-size:${isHi ? "14px" : "13px"}"><tbody>${tableRowsHTML}</tbody></table></div><div style="background:#1e2840;color:#fff;padding:12px 20px;text-align:center"><div style="font-size:${isHi ? "16px" : "14px"};font-weight:900;margin-bottom:6px">${isHi ? "अधिक जानकारी के लिए :" : "FOR MORE INFORMATION :"}</div><div style="font-size:12px;display:flex;justify-content:space-around"><span>Website : https://www.jssabhiyan-nac.in</span><span>Email : ${isHi ? "info@jssabhiyan-nac.in" : "support@jssabhiyan-nac.in"}</span></div></div>`;
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
        const ctx = sliceCanvas.getContext("2d");
        ctx.drawImage(canvas, 0, -yOffset);
        const sliceData = sliceCanvas.toDataURL("image/png");
        const sliceImgH = (sliceCanvas.height * imgW) / canvas.width;
        pdf.addImage(sliceData, "PNG", 10, 10, imgW, sliceImgH);
        yOffset += sliceH;
        page++;
      }
    }
    pdf.save(
      isHi
        ? `JSSA_${job.advt.replace(/\//g, "-")}_Hindi.pdf`
        : `JSSA_${job.advt.replace(/\//g, "-")}_English.pdf`,
    );
  } finally {
    document.body.removeChild(container);
  }
}

function ApplicationForm({ job, onBack }) {
  const [stateVal, setStateVal] = useState("");
  const [form, setForm] = useState({
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
    district: "",
    block: "",
    panchayat: "",
    pincode: "",
    photo: null,
    signature: null,
    higherEdu: "",
    board: "",
    marks: "",
    markPct: "",
    agree1: false,
    agree2: false,
  });

  const handle = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") setForm((p) => ({ ...p, [name]: files[0] }));
    else if (type === "checkbox") setForm((p) => ({ ...p, [name]: checked }));
    else setForm((p) => ({ ...p, [name]: value }));
    if (name === "state") {
      setStateVal(value);
      setForm((p) => ({ ...p, state: value, district: "" }));
    }
  };

  const iStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: 14,
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    color: "#000",
  };
  const lStyle = {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "#333",
    marginBottom: 6,
  };

  return (
    <div
      style={{
        background: "#fff",
        fontFamily: "'Segoe UI','Noto Sans',sans-serif",
      }}
    >
      <div
        style={{
          background: GREEN,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            padding: "7px 14px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
        <span className="jobs-back-title">
          {job.title} — Advt. No. {job.advt}
        </span>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 14px 40px" }}>
        <div
          style={{
            background: "#f0f0f0",
            borderRadius: 6,
            padding: "20px 18px",
            marginTop: 20,
          }}
        >
          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              color: "#555",
              marginBottom: 16,
            }}
          >
            {job.title} Advt. No. {job.advt} / {job.titleHi} {job.advt}
          </p>
          <h3 className="jobs-section-heading">PERSONAL DETAILS</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={lStyle}>Candidate's Name / अभ्यर्थी का नाम :</label>
              <input
                name="candidateName"
                value={form.candidateName}
                onChange={handle}
                style={iStyle}
              />
            </div>
            <div className="jobs-grid-2">
              <div>
                <label style={lStyle}>Father's Name / पिता का नाम :</label>
                <input
                  name="fatherName"
                  value={form.fatherName}
                  onChange={handle}
                  style={iStyle}
                />
              </div>
              <div>
                <label style={lStyle}>Mother's Name / माता का नाम :</label>
                <input
                  name="motherName"
                  value={form.motherName}
                  onChange={handle}
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
                  value={form.dob}
                  onChange={handle}
                  style={iStyle}
                />
              </div>
              <div>
                <label style={lStyle}>Gender / लिंग :</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handle}
                  style={iStyle}
                >
                  <option value="">--Select--</option>
                  <option>Male / पुरुष</option>
                  <option>Female / महिला</option>
                  <option>Other / अन्य</option>
                </select>
              </div>
            </div>
            <div className="jobs-grid-2">
              <div>
                <label style={lStyle}>Nationality / राष्ट्रीयता :</label>
                <select
                  name="nationality"
                  value={form.nationality}
                  onChange={handle}
                  style={iStyle}
                >
                  <option value="">--Select--</option>
                  <option>Indian / भारतीय</option>
                  <option>Other / अन्य</option>
                </select>
              </div>
              <div>
                <label style={lStyle}>Category / श्रेणी :</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handle}
                  style={iStyle}
                >
                  <option value="">--Select--</option>
                  <option>General / सामान्य</option>
                  <option>OBC</option>
                  <option>SC</option>
                  <option>ST</option>
                  <option>EWS</option>
                </select>
              </div>
            </div>
            <div className="jobs-grid-2">
              <div>
                <label style={lStyle}>Aadhar Number / आधार संख्या :</label>
                <input
                  name="aadhar"
                  value={form.aadhar}
                  onChange={handle}
                  style={iStyle}
                />
              </div>
              <div>
                <label style={lStyle}>Pan Number / पेन संख्या :</label>
                <input
                  name="pan"
                  value={form.pan}
                  onChange={handle}
                  style={iStyle}
                />
              </div>
            </div>
            <div className="jobs-grid-2">
              <div>
                <label style={lStyle}>Mobile Number / मोबाइल नंबर :</label>
                <input
                  name="mobile"
                  value={form.mobile}
                  onChange={handle}
                  style={iStyle}
                />
              </div>
              <div>
                <label style={lStyle}>Email Id / ईमेल आईडी :</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handle}
                  style={iStyle}
                />
              </div>
            </div>
            <div>
              <label style={lStyle}>Permanent Address / स्थाई पता :</label>
              <input
                name="address"
                value={form.address}
                onChange={handle}
                style={iStyle}
              />
            </div>
            <div className="jobs-grid-2">
              <div>
                <label style={lStyle}>State / राज्य :</label>
                <select
                  name="state"
                  value={form.state || ""}
                  onChange={handle}
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
                <select
                  name="district"
                  value={form.district}
                  onChange={handle}
                  style={iStyle}
                >
                  <option value=""></option>
                  {(districtsByState[stateVal] || []).map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="jobs-grid-3">
              <div>
                <label style={lStyle}>Block / ब्लॉक :</label>
                <select
                  name="block"
                  value={form.block}
                  onChange={handle}
                  style={iStyle}
                >
                  <option value=""></option>
                </select>
              </div>
              <div>
                <label style={lStyle}>Panchayat / पंचायत :</label>
                <select
                  name="panchayat"
                  value={form.panchayat}
                  onChange={handle}
                  style={iStyle}
                >
                  <option value=""></option>
                </select>
              </div>
              <div>
                <label style={lStyle}>Pin Code / पिन कोड :</label>
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={handle}
                  style={iStyle}
                />
              </div>
            </div>
            <div className="jobs-grid-2">
              <div>
                <label style={lStyle}>Photograph / फोटो :</label>
                <input
                  name="photo"
                  type="file"
                  accept="image/*"
                  onChange={handle}
                  style={{ ...iStyle, padding: "6px 8px" }}
                />
                <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                  Max file size: 3MB
                </p>
              </div>
              <div>
                <label style={lStyle}>Signature / हस्ताक्षर :</label>
                <input
                  name="signature"
                  type="file"
                  accept="image/*"
                  onChange={handle}
                  style={{ ...iStyle, padding: "6px 8px" }}
                />
                <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                  Max file size: 3MB
                </p>
              </div>
            </div>
          </div>
          <h3 className="jobs-section-heading" style={{ marginTop: 24 }}>
            EDUCATION DETAILS
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="jobs-grid-2">
              <div>
                <label style={lStyle}>Higher Education / उच्च शिक्षा :</label>
                <input
                  name="higherEdu"
                  value={form.higherEdu}
                  onChange={handle}
                  style={iStyle}
                />
              </div>
              <div>
                <label style={lStyle}>Board / University :</label>
                <input
                  name="board"
                  value={form.board}
                  onChange={handle}
                  style={iStyle}
                />
              </div>
            </div>
            <div className="jobs-grid-2">
              <div>
                <label style={lStyle}>Marks / अंक :</label>
                <input
                  name="marks"
                  value={form.marks}
                  onChange={handle}
                  style={iStyle}
                />
              </div>
              <div>
                <label style={lStyle}>Percentage / प्रतिशत :</label>
                <input
                  name="markPct"
                  value={form.markPct}
                  onChange={handle}
                  style={iStyle}
                />
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: 20,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name="agree1"
                checked={form.agree1}
                onChange={handle}
                style={{
                  width: 16,
                  height: 16,
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
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 14,
                cursor: "pointer",
                lineHeight: 1.6,
              }}
            >
              <input
                type="checkbox"
                name="agree2"
                checked={form.agree2}
                onChange={handle}
                style={{
                  width: 16,
                  height: 16,
                  marginTop: 2,
                  flexShrink: 0,
                  accentColor: GREEN,
                }}
              />
              I declare that all the information given in this application form
              is correct to the best of my knowledge and belief.
            </label>
          </div>
          <div style={{ textAlign: "center", marginTop: 22 }}>
            <button
              onClick={() => alert("Application submitted!")}
              className="jobs-submit-btn"
            >
              SUBMIT &amp; CONTINUE
            </button>
          </div>
        </div>
      </div>
      <style>{jobsCSS}</style>
    </div>
  );
}

function JobDetailPage({ job, onBack, onApply }) {
  const [downloading, setDownloading] = useState(null);
  const d = job.rows;
  const rows = d.en.length;

  return (
    <div
      style={{
        background: "#fff",
        fontFamily: "'Segoe UI','Noto Sans',sans-serif",
      }}
    >
      <div
        style={{ maxWidth: 1000, margin: "20px auto 40px", padding: "0 8px" }}
      >
        {/* ── Main green-bordered table ── */}
        <div
          style={{
            border: `2px solid ${GREEN}`,
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          {/* Title row — light green, centered bilingual */}
          <div className="jobs-detail-title-row">
            Recruitment for the Post of {job.title} Advt. No. {job.advt} /&nbsp;
            {job.titleHi} विज्ञापन संख्या: {job.advt}
          </div>

          {/* Download row */}
          <div className="jobs-detail-download-row">
            <div
              className="jobs-detail-download-cell"
              style={{ borderRight: `1px solid ${GREEN}55` }}
            >
              <div className="advt-label">Advt No: {job.advt}</div>
              {job.date && <div className="advt-date">Date: {job.date}</div>}
              <button
                className="dl-link"
                onClick={async () => {
                  setDownloading("en");
                  try {
                    await downloadPDF(job, "en");
                  } catch (e) {
                    alert("PDF download failed: " + e.message);
                  }
                  setDownloading(null);
                }}
                disabled={!!downloading}
              >
                📄{" "}
                {downloading === "en" ? (
                  "Generating PDF..."
                ) : (
                  <>
                    <span>
                      Download Advertisement (English Version) Click Here ✤✤
                    </span>
                    <span className="new-badge">NEW</span>
                  </>
                )}
              </button>
            </div>
            <div className="jobs-detail-download-cell">
              <div className="advt-label">विज्ञापन सं० {job.advt}</div>
              {job.date && <div className="advt-date">दिनांक -{job.date}</div>}
              <button
                className="dl-link"
                onClick={async () => {
                  setDownloading("hi");
                  try {
                    await downloadPDF(job, "hi");
                  } catch (e) {
                    alert("PDF download failed: " + e.message);
                  }
                  setDownloading(null);
                }}
                disabled={!!downloading}
              >
                📄{" "}
                {downloading === "hi" ? (
                  "PDF बन रहा है..."
                ) : (
                  <>
                    <span>
                      डाउनलोड विज्ञापन (हिंदी संस्करण) यहाँ क्लिक करें ✤✤
                    </span>
                    <span className="new-badge">NEW</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bilingual data rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className={`jobs-detail-row ${i % 2 === 0 ? "row-odd" : "row-even"}`}
            >
              {/* English half */}
              <div
                className="jobs-detail-lang-cell"
                style={{ borderRight: `1px solid #b8dda0` }}
              >
                <div className="jobs-detail-key">{d.en[i]?.[0] || ""}</div>
                <div className="jobs-detail-colon">:</div>
                <div className="jobs-detail-val">{d.en[i]?.[1] || ""}</div>
              </div>
              {/* Hindi half */}
              <div className="jobs-detail-lang-cell">
                <div className="jobs-detail-key">{d.hi[i]?.[0] || ""}</div>
                <div className="jobs-detail-colon">:</div>
                <div className="jobs-detail-val">{d.hi[i]?.[1] || ""}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Apply / Closed button */}
        <div
          style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}
        >
          {job.isNew ? (
            <button onClick={onApply} className="jobs-submit-btn">
              Apply Now / अभी आवेदन करें
            </button>
          ) : (
            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: 6,
                padding: "12px 18px",
                fontSize: 14,
                fontWeight: 700,
                color: "#8B1a1a",
              }}
            >
              ⚠️ This vacancy is closed. / यह भर्ती बंद हो चुकी है।
            </div>
          )}
        </div>
      </div>
      <style>{jobsCSS}</style>
    </div>
  );
}

/* ── Vacancy item — lighter weight, no duplicate bold advt ── */
function VacancyItem({ job, onClick, disabled = false }) {
  return (
    <div>
      <div
        onClick={() => {
          if (disabled) return;
          onClick(job);
        }}
        className={`jobs-vacancy-item ${disabled ? "jobs-vacancy-item--disabled" : ""}`}
        role="button"
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") onClick(job);
        }}
      >
        <span
          style={{ fontWeight: 600, flexShrink: 0, marginTop: 1, color: GREEN }}
        >
          &gt;&gt;
        </span>
        <span>
          {/* Show only the combined title text in English + Hindi */}
          {job.title}
          {job.isNew && (
            <span
              style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 900,
                padding: "1px 6px",
                borderRadius: 3,
                marginLeft: 6,
                verticalAlign: "middle",
                color: "#fff",
                animation: "newBadgeJob 1.5s infinite",
              }}
            >
              NEW
            </span>
          )}
          {!job.isNew && (
            <span
              style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 900,
                padding: "1px 6px",
                borderRadius: 3,
                marginLeft: 6,
                verticalAlign: "middle",
                color: "#fff",
                background: "#6b7280",
              }}
            >
              INACTIVE / EXPIRED
            </span>
          )}
        </span>
      </div>
      <div style={{ borderBottom: "1px dashed #ccc", margin: "0 8px" }} />
    </div>
  );
}

function convertJobToComponentFormat(posting) {
  const isActive = posting.status === "Active";
  
  // Robust date parsing for lastDate
  const parseFlexibleDate = (value) => {
    if (!value) return null;
    const raw = String(value).trim();
    const nativeParsed = new Date(raw);
    if (!Number.isNaN(nativeParsed.getTime())) return nativeParsed;
    const dayFirstMatch = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (dayFirstMatch) {
      const day = Number(dayFirstMatch[1]);
      const month = Number(dayFirstMatch[2]);
      const year = Number(dayFirstMatch[3]);
      return new Date(year, month - 1, day);
    }
    const yearFirstMatch = raw.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
    if (yearFirstMatch) {
      const year = Number(yearFirstMatch[1]);
      const month = Number(yearFirstMatch[2]);
      const day = Number(yearFirstMatch[3]);
      return new Date(year, month - 1, day);
    }
    return null;
  };

  const lastDateObj = parseFlexibleDate(posting.lastDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let isClosed = false;
  if (lastDateObj) {
    const compareDate = new Date(lastDateObj);
    compareDate.setHours(23, 59, 59, 999);
    isClosed = compareDate < new Date();
  }

  const rowsEn = [
    ["Post", posting.post?.en || posting.postTitle?.en || ""],
    ["Total Post", posting.totalPost || ""],
    ["Monthly Income", posting.income?.en || ""],
    ["Education Qualification", posting.education?.en || ""],
    [
      "Age Limit",
      `${posting.ageLimit?.en || ""} (As on ${posting.ageAsOn || ""})`,
    ],
    ["Job Location", posting.location?.en || ""],
    ["Selection Process", posting.selectionProcess?.en || ""],
    ["Application Opening On", posting.applicationOpeningDate || ""],
    ["Last Date of Application", posting.lastDate || ""],
    ["1st Merit List Released", posting.firstMeritListDate || ""],
    ["Final Merit List Released", posting.finalMeritListDate || ""],
    ["Fee Structure", posting.fee?.en || ""],
  ];
  const rowsHi = [
    ["पद", posting.post?.hi || posting.postTitle?.hi || ""],
    ["कुल पद", posting.totalPost || ""],
    ["मासिक आय", posting.income?.hi || ""],
    ["शैक्षणिक योग्यता", posting.education?.hi || ""],
    ["आयु सीमा", `${posting.ageLimit?.hi || ""} (${posting.ageAsOn || ""} को)`],
    ["नौकरी करने का स्थान", posting.location?.hi || ""],
    ["चयन प्रक्रिया", posting.selectionProcess?.hi || ""],
    ["आवेदन खुलने की तिथि", posting.applicationOpeningDate || ""],
    ["आवेदन की अंतिम तिथि", posting.lastDate || ""],
    ["मेधा सूची जारी", posting.firstMeritListDate || ""],
    ["अंतिम मेधा सूची जारी", posting.finalMeritListDate || ""],
    ["शुल्क संरचना", posting.fee?.hi || ""],
  ];
  return {
    id: posting._id,
    advt: posting.advtNo,
    isNew: isActive && !isClosed,
    // Use title field (single combined string) from backend
    title: posting.title || "",
    department: posting.department?.en || posting.department || posting.departmentName?.en || posting.departmentName || "",
    location: posting.location?.en || posting.location || "",
    employmentType: posting.employmentType || posting.type || "",
    description: posting.description?.en || posting.description || posting.post?.en || posting.postTitle?.en || "",
    deadline: posting.lastDate || "",
    titleHi: "", // Not used anymore since title is combined
    date: posting.date || "",
    invitationEn:
      posting.title ||
      `Invitation for all eligible candidates on vacant posts of ${posting.post?.en || ""} under Jan Swasthya Sahayata Abhiyan by Healthcare Research and Development Board (A Division of NAC India).`,
    invitationHi:
      posting.title ||
      `हेल्थ केयर रिसर्च एंड डेवलपमेंट बोर्ड (A Division Of NAC INDIA) द्वारा जन स्वास्थ्य सहायता अभियान के तहत ${posting.post?.hi || ""} के रिक्त पदों पर सभी पात्र उम्मीदवारों के लिए आमंत्रण`,
    rows: { en: rowsEn, hi: rowsHi },
  };
}

/* ══════════════════════════════════════════════
   CSS  —  wider list  +  lighter font weight
   ══════════════════════════════════════════════ */
const jobsCSS = `
  * { box-sizing: border-box; }

  @keyframes newBadgeJob {
    0%   { background: #e53e3e; }
    25%  { background: #d97706; }
    50%  { background: #7c3aed; }
    75%  { background: #0369a1; }
    100% { background: #e53e3e; }
  }

  .jobs-back-title { color: #fff; font-weight: 700; font-size: 14px; }

  .jobs-section-heading {
    font-weight: 900; font-size: 16px; color: #1a2a4a; margin: 20px 0 14px;
  }

  .jobs-submit-btn {
    background: ${GREEN}; color: #fff; font-weight: 900;
    font-size: 15px; padding: 12px 40px;
    border: none; cursor: pointer; border-radius: 4px;
  }

  /* ── Vacancy item: wider padding, normal weight ── */
  .jobs-vacancy-item {
    padding: 13px 28px;
    font-size: 15px;
    font-weight: 400;
    color: #1a2a4a;
    line-height: 1.7;
    cursor: pointer;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    transition: none;
  }

  .jobs-vacancy-item--disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }


  /* ── List page: full-width, 100px side padding, max-width cap ── */
  .jobs-list-wrap {
    width: 100%;
    padding: 32px 100px 48px; max-width: 1400px; margin: 0 auto;
  }

  .jobs-list-heading {
    font-weight: 400; font-size: 20px; color: #1a2a4a; margin-bottom: 8px;
  }

  .jobs-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .jobs-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }

  /* ── Detail title row — light green, centered ── */
  .jobs-detail-title-row {
    background: #eef4fc;
    padding: 8px 14px;
    text-align: center;
    border-left: 1px solid #1761b0;
    border-right: 1px solid #1761b0;
    font-size: 13px; font-weight: 700; color: #1a2a4a; line-height: 1.6;
  }

  /* ── Download row ── */
  .jobs-detail-download-row {
    display: grid; grid-template-columns: 1fr 1fr;
    border-bottom: 2px solid #1761b0; background: #eef4fc;
  }
  .jobs-detail-download-cell { padding: 18px 20px; background: transparent; text-align: center; }
  .jobs-detail-download-cell .advt-label { font-weight: 900; font-size: 16px; color: #1a2a4a; margin-bottom: 4px; }
  .jobs-detail-download-cell .advt-date  { font-weight: 700; font-size: 15px; color: #1a2a4a; margin-bottom: 12px; }
  .jobs-detail-download-cell .dl-link {
    color: #1a56c4 !important; font-weight: 700; font-size: 13px;
    text-decoration: underline !important; background: none; border: none;
    cursor: pointer; padding: 0; display: inline-flex; align-items: center;
    gap: 5px; justify-content: center;
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

  /* ── Data rows — WHITE background ── */
  .jobs-detail-row {
    display: grid; grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid #c8e6c0;
  }
  .jobs-detail-row:last-child { border-bottom: none; }
  .jobs-detail-row.row-odd  { background: #ffffff; }
  .jobs-detail-row.row-even { background: #ffffff; }

  .jobs-detail-lang-cell { display: grid; grid-template-columns: 160px 28px 1fr; padding: 0; }
  .jobs-detail-key {
    padding: 12px 10px 12px 12px;
    font-weight: 400; font-size: 14px;
    color: #1a2a4a; line-height: 1.5;
    border-right: 1px solid #b8dda0;
  }
  .jobs-detail-colon {
    padding: 12px 0; font-size: 14px; color: #555;
    text-align: center; border-right: 1px solid #b8dda0;
    vertical-align: top; display: flex; align-items: flex-start; justify-content: center;
  }
  .jobs-detail-val { padding: 12px 12px; font-size: 14px; color: #333; line-height: 1.6; }

  .ngo-jobs-page { width: 92%; max-width: 1400px; min-height: 68vh; margin: 0 auto; padding: 48px 0 72px; color: #1f2937; }
  .ngo-jobs-heading { color: #123b68; font-size: 30px; font-weight: 800; margin: 0 0 22px; }
  .ngo-jobs-toolbar { display: flex; justify-content: flex-end; margin-bottom: 14px; }
  .ngo-jobs-back { display: inline-flex; align-items: center; gap: 7px; border: 1px solid #bfd0e3; border-radius: 5px; background: #fff; color: #174d82; padding: 9px 13px; font-weight: 700; cursor: pointer; }
  .ngo-jobs-empty { min-height: 350px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 34px 20px; border: 1px solid #e1e8f0; border-radius: 8px; background: linear-gradient(135deg,#f8fbff,#eef5fc); text-align: center; }
  .ngo-jobs-empty-icon { width: 76px; height: 76px; display: grid; place-items: center; border-radius: 50%; background: #e0edfa; color: #1761b0; margin-bottom: 16px; }
  .ngo-jobs-empty h2 { color: #123b68; font-size: 24px; margin: 0 0 8px; }
  .ngo-jobs-empty p { max-width: 520px; margin: 0 0 20px; color: #596b7d; font-size: 15px; line-height: 1.6; }
  .ngo-jobs-home { display: inline-flex; align-items: center; gap: 7px; border: 0; border-radius: 5px; background: #1761b0; color: #fff; padding: 10px 16px; font-weight: 700; cursor: pointer; }
  .ngo-job-grid { display: grid; grid-template-columns: 1fr; gap: 14px; max-height: 70vh; overflow-y: auto; overflow-x: hidden; padding-right: 8px; scrollbar-width: thin; scrollbar-color: #9bb9d8 transparent; }
  .ngo-job-grid::-webkit-scrollbar { width: 6px; }
  .ngo-job-grid::-webkit-scrollbar-thumb { background: #9bb9d8; border-radius: 3px; }
  .ngo-job-card { padding: 18px; border: 1px solid #e1e8f0; border-radius: 7px; background: #fff; box-shadow: 0 2px 8px rgba(16,42,67,.06); }
  .ngo-job-title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
  .ngo-job-title { color: #3F6212; font-size: 18px; font-weight: 800; margin: 0; }
  .ngo-job-badge { border-radius: 3px; background: #ECFCCB; color: #3F6212; padding: 4px 7px; font-size: 10px; font-weight: 800; white-space: nowrap; }
  .ngo-job-description { color: #526477; font-size: 13px; line-height: 1.5; margin: 0 0 12px; }
  .ngo-job-details { display: flex; flex-wrap: wrap; gap: 8px 14px; padding: 11px 0; border-top: 1px solid #edf1f5; border-bottom: 1px solid #edf1f5; }
  .ngo-job-detail { display: inline-flex; gap: 6px; align-items: center; color: #5b6b7a; font-size: 12px; }
  .ngo-job-detail svg { color: #1761b0; }
  .ngo-job-card-footer { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 13px; }
  .ngo-job-department { color: #64748b; font-size: 12px; }
  .ngo-job-apply { border: 0; border-radius: 4px; background: #C9302C; color: #fff; padding: 9px 14px; font-size: 12px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
  .ngo-job-apply:hover { background: #A52822; }
  .ngo-old-jobs { margin-top: 32px; }
  .ngo-more-wrap { text-align: center; margin-top: 18px; }
  .ngo-more { border: 1px solid #1761b0; border-radius: 5px; background: #fff; color: #1761b0; padding: 10px 22px; font-family: 'Segoe UI', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; }
  .ngo-more:hover { background: #1761b0; color: #fff; }
  .ngo-jobs-howto { display: inline-block; margin: 0 0 18px; color: #1761b0; font-family: 'Segoe UI', sans-serif; font-weight: 600; font-size: 14px; text-decoration: none; }
  .ngo-jobs-howto:hover { color: #123b68; text-decoration: underline; }
  .ngo-jobs-howto span { font-weight: 700; }

  @media (max-width: 768px) {
    .jobs-list-wrap { padding: 16px 12px 28px; }
    .ngo-jobs-page { width: auto; padding: 28px 16px 48px; }
    .ngo-jobs-heading { font-size: 25px; }
    .ngo-jobs-empty { min-height: 300px; }
    .ngo-job-grid { grid-template-columns: 1fr; }
    .ngo-job-card { padding: 15px; }
    .jobs-list-heading { font-size: 20px; }
    .jobs-vacancy-item {
      padding: 12px 10px;
      font-size: 15px;
      font-weight: 400;
      gap: 8px;
      flex-wrap: nowrap;
      white-space: normal;
      overflow: visible;
      line-height: 1.6;
    }
    .jobs-vacancy-item span:last-child {
      flex: 1;
      min-width: 0;
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .jobs-back-title { font-size: 10px; }
    .jobs-section-heading { font-size: 11px; }
    .jobs-submit-btn { font-size: 11px; padding: 8px 18px; }
    .jobs-grid-2 { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
    .jobs-grid-3 { grid-template-columns: 1fr 1fr 1fr !important; gap: 6px !important; }

    /* ── Detail table mobile — keep EN|HI same row, just smaller ── */
    .jobs-detail-title-row { font-size: 7px; padding: 6px 6px; line-height: 1.4; }
    .jobs-detail-download-row { grid-template-columns: 1fr 1fr !important; }
    .jobs-detail-download-cell { padding: 6px 4px; }
    .jobs-detail-download-cell .advt-label { font-size: 7px; margin-bottom: 2px; }
    .jobs-detail-download-cell .advt-date  { font-size: 6px; margin-bottom: 6px; }
    .jobs-detail-download-cell .dl-link    { font-size: 6px; gap: 2px; }
    .jobs-detail-download-cell .new-badge  { font-size: 6px; padding: 1px 3px; }

    /* Keep 1fr 1fr — never stack rows */
    .jobs-detail-row { grid-template-columns: 1fr 1fr !important; }

    /* 3-col inside each half: key | colon | value — all tiny */
    .jobs-detail-lang-cell { grid-template-columns: 52px 10px 1fr !important; }
    .jobs-detail-key    { font-size: 7px !important; padding: 4px 3px 4px 4px !important; line-height: 1.4 !important; }
    .jobs-detail-colon  { font-size: 7px !important; padding: 4px 0 !important; }
    .jobs-detail-val    { font-size: 7px !important; padding: 4px 3px !important; line-height: 1.4 !important; }
  }
`;

export default function JobsPage() {
  const navigate = useNavigate();
  const [view, setView] = useState("list");
  const [selectedJob, setSelectedJob] = useState(null);
  const [latestJobs, setLatestJobs] = useState([]);
  const [oldJobs, setOldJobs] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await jobPostingsAPI.getAll({
          status: "all",
          limit: 100,
        });
        if (response.success && response.data.postings) {
          const allJobs = response.data.postings.map(
            convertJobToComponentFormat,
          );
          const active = allJobs.filter((j) => j.isNew);
          const inactive = allJobs.filter((j) => !j.isNew);
          
          const sortByDate = (list) => {
            return list.sort((a, b) => {
              const ja = response.data.postings.find((p) => p._id === a.id);
              const jb = response.data.postings.find((p) => p._id === b.id);
              
              // Secondary sort by date
              return new Date(jb.createdAt) - new Date(ja.createdAt);
            });
          };

          // Already split by isNew (Active vs Inactive)
          setLatestJobs(sortByDate(active));
          setOldJobs(sortByDate(inactive));
        } else {
          setLatestJobs([]);
          setOldJobs([]);
        }
      } catch {
        setLatestJobs([]);
        setOldJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const openDetail = (job) => {
    // Only allow opening details for current/open vacancies
    if (!job?.isNew) return;
    navigate(`/job-postings/view/${job.id}`);
  };
  const openApply = () => setView("apply");
  const backToList = () => {
    setView("list");
    setSelectedJob(null);
  };
  const backToDetail = () => setView("detail");

  if (view === "apply" && selectedJob)
    return <ApplicationForm job={selectedJob} onBack={backToDetail} />;
  if (view === "detail" && selectedJob)
    return (
      <JobDetailPage
        job={selectedJob}
        onBack={backToList}
        onApply={openApply}
      />
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        fontFamily: "'Segoe UI','Noto Sans',sans-serif",
      }}
      className="jobs-list-wrap"
    >
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            fontSize: 16,
            color: "#666",
          }}
        >
          Loading jobs...
        </div>
      ) : (
        <main className="ngo-jobs-page">
          <h1 className="ngo-jobs-heading">Job Opportunities</h1>
          <a className="ngo-jobs-howto" href="https://youtu.be/GVJ5RN5bl00" target="_blank" rel="noopener noreferrer">
            आवेदन पत्र कैसे भरें? / How to fill out the application form? <span>YouTube</span>
          </a>

          {latestJobs.length > 0 ? (
            <>
            <div className="ngo-job-grid" aria-live="polite">
              {(showAll ? latestJobs : latestJobs.slice(0, 3)).map((job) => (
                <article className="ngo-job-card" key={job.id}>
                  <div className="ngo-job-title-row">
                    <h2 className="ngo-job-title">{job.title}</h2>
                    <span className="ngo-job-badge">OPEN</span>
                  </div>
                  <p className="ngo-job-description">{job.description}</p>
                  <div className="ngo-job-details">
                    <span className="ngo-job-detail"><BriefcaseBusiness size={15} />{job.department || "Department not specified"}</span>
                    <span className="ngo-job-detail"><MapPin size={15} />{job.location || "Location not specified"}</span>
                    <span className="ngo-job-detail"><Clock3 size={15} />{job.employmentType || "Employment type not specified"}</span>
                    {job.deadline && <span className="ngo-job-detail"><CalendarDays size={15} />Deadline: {job.deadline}</span>}
                  </div>
                  <div className="ngo-job-card-footer">
                    <span className="ngo-job-department">Advt. No. {job.advt}</span>
                    <button type="button" className="ngo-job-apply" onClick={() => openDetail(job)}>Apply Now</button>
                  </div>
                </article>
              ))}
            </div>
            {latestJobs.length > 3 && (
              <div className="ngo-more-wrap">
                <button type="button" className="ngo-more" onClick={() => setShowAll((v) => !v)}>{showAll ? "View Less" : "View More"}</button>
              </div>
            )}
            </>
          ) : (
            <section className="ngo-jobs-empty" aria-live="polite">
              <div className="ngo-jobs-empty-icon"><BriefcaseBusiness size={38} strokeWidth={1.7} aria-hidden="true" /></div>
              <h2>Coming Soon</h2>
              <p>New job opportunities will be available here soon. Stay connected for the latest openings.</p>
            </section>
          )}

          {oldJobs.length > 0 && (
            <section className="ngo-old-jobs">
              <h2 className="jobs-list-heading">Previous Vacancies</h2>
              {oldJobs.map((job) => <VacancyItem key={job.id} job={job} onClick={openDetail} disabled />)}
            </section>
          )}
        </main>
      )}
      <style>{jobsCSS}</style>
    </div>
  );
}
// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { jobPostingsAPI } from "../../utils/api.js";

// const GREEN = "#3AB000";

// const indianStates = [
//   "Andhra Pradesh",
//   "Arunachal Pradesh",
//   "Assam",
//   "Bihar",
//   "Chhattisgarh",
//   "Goa",
//   "Gujarat",
//   "Haryana",
//   "Himachal Pradesh",
//   "Jharkhand",
//   "Karnataka",
//   "Kerala",
//   "Madhya Pradesh",
//   "Maharashtra",
//   "Manipur",
//   "Meghalaya",
//   "Mizoram",
//   "Nagaland",
//   "Odisha",
//   "Punjab",
//   "Rajasthan",
//   "Sikkim",
//   "Tamil Nadu",
//   "Telangana",
//   "Tripura",
//   "Uttar Pradesh",
//   "Uttarakhand",
//   "West Bengal",
//   "Delhi",
//   "Jammu & Kashmir",
//   "Ladakh",
// ];

// const districtsByState = {
//   Bihar: [
//     "Patna",
//     "Gaya",
//     "Muzaffarpur",
//     "Bhagalpur",
//     "Darbhanga",
//     "Purnia",
//     "Samastipur",
//     "Begusarai",
//     "Nalanda",
//     "Rohtas",
//     "Araria",
//     "Aurangabad",
//     "Banka",
//     "Buxar",
//     "Gopalganj",
//     "Jamui",
//     "Katihar",
//     "Khagaria",
//     "Kishanganj",
//     "Madhepura",
//     "Madhubani",
//     "Munger",
//     "Nawada",
//     "Saran",
//     "Sitamarhi",
//     "Siwan",
//     "Supaul",
//     "Vaishali",
//     "West Champaran",
//     "East Champaran",
//   ],
//   Jharkhand: [
//     "Ranchi",
//     "Dhanbad",
//     "Jamshedpur",
//     "Bokaro",
//     "Hazaribagh",
//     "Giridih",
//     "Deoghar",
//     "Dumka",
//     "Pakur",
//     "Garhwa",
//     "Chatra",
//     "Gumla",
//     "Khunti",
//     "Koderma",
//     "Latehar",
//     "Lohardaga",
//     "Palamu",
//     "Ramgarh",
//     "Sahibganj",
//     "Seraikela",
//     "Simdega",
//   ],
//   "Uttar Pradesh": [
//     "Lucknow",
//     "Kanpur",
//     "Agra",
//     "Varanasi",
//     "Allahabad",
//     "Meerut",
//     "Noida",
//     "Ghaziabad",
//     "Bareilly",
//     "Aligarh",
//     "Gorakhpur",
//     "Moradabad",
//     "Saharanpur",
//     "Faizabad",
//     "Jhansi",
//     "Mathura",
//   ],
//   "Madhya Pradesh": [
//     "Bhopal",
//     "Indore",
//     "Gwalior",
//     "Jabalpur",
//     "Ujjain",
//     "Sagar",
//     "Dewas",
//     "Satna",
//     "Ratlam",
//     "Rewa",
//   ],
//   Maharashtra: [
//     "Mumbai",
//     "Pune",
//     "Nagpur",
//     "Thane",
//     "Nashik",
//     "Aurangabad",
//     "Solapur",
//     "Kolhapur",
//     "Amravati",
//     "Nanded",
//   ],
//   Rajasthan: [
//     "Jaipur",
//     "Jodhpur",
//     "Kota",
//     "Bikaner",
//     "Ajmer",
//     "Udaipur",
//     "Bhilwara",
//     "Alwar",
//     "Bharatpur",
//     "Sikar",
//   ],
//   Gujarat: [
//     "Ahmedabad",
//     "Surat",
//     "Vadodara",
//     "Rajkot",
//     "Gandhinagar",
//     "Bhavnagar",
//     "Jamnagar",
//     "Junagadh",
//   ],
//   "West Bengal": [
//     "Kolkata",
//     "Howrah",
//     "Darjeeling",
//     "Jalpaiguri",
//     "Murshidabad",
//     "Bardhaman",
//     "Nadia",
//     "North 24 Parganas",
//     "South 24 Parganas",
//   ],
//   Delhi: [
//     "Central Delhi",
//     "East Delhi",
//     "New Delhi",
//     "North Delhi",
//     "North East Delhi",
//     "South Delhi",
//     "West Delhi",
//   ],
//   Assam: [
//     "Guwahati",
//     "Dibrugarh",
//     "Silchar",
//     "Jorhat",
//     "Nagaon",
//     "Tinsukia",
//     "Kamrup",
//     "Barpeta",
//   ],
//   Odisha: [
//     "Bhubaneswar",
//     "Cuttack",
//     "Rourkela",
//     "Berhampur",
//     "Sambalpur",
//     "Puri",
//     "Balasore",
//     "Bhadrak",
//   ],
//   Uttarakhand: [
//     "Dehradun",
//     "Haridwar",
//     "Roorkee",
//     "Haldwani",
//     "Rudrapur",
//     "Kashipur",
//     "Rishikesh",
//     "Nainital",
//   ],
// };

// function loadScript(src) {
//   return new Promise((resolve, reject) => {
//     if (document.querySelector(`script[src="${src}"]`)) {
//       resolve();
//       return;
//     }
//     const s = document.createElement("script");
//     s.src = src;
//     s.onload = resolve;
//     s.onerror = reject;
//     document.head.appendChild(s);
//   });
// }

// async function downloadPDF(job, lang) {
//   const isHi = lang === "hi";
//   await loadScript(
//     "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
//   );
//   await loadScript(
//     "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
//   );
//   const rows = isHi ? job.rows.hi : job.rows.en;
//   const container = document.createElement("div");
//   container.style.cssText = `position:fixed;left:-9999px;top:0;width:700px;background:#fff;font-family:'Noto Sans Devanagari','Noto Sans',Arial,sans-serif;font-size:13px;color:#000;border:2px solid #888;border-radius:8px;overflow:hidden;`;
//   const tableRowsHTML = rows
//     .map(
//       (r, i) =>
//         `<tr><td style="padding:9px 14px;font-weight:700;background:${i % 2 === 0 ? "#efefef" : "#fff"};border:1px solid #ccc;width:35%;vertical-align:top">${r[0]}</td><td style="padding:9px 8px;background:${i % 2 === 0 ? "#efefef" : "#fff"};border:1px solid #ccc;width:4%;text-align:center;vertical-align:top">:</td><td style="padding:9px 14px;background:${i % 2 === 0 ? "#efefef" : "#fff"};border:1px solid #ccc;vertical-align:top;line-height:1.6">${r[1]}</td></tr>`,
//     )
//     .join("");
//   container.innerHTML = `<div style="background:#1e2840;display:flex;align-items:center;gap:16px;padding:14px 20px"><div style="width:64px;height:64px;border-radius:50%;background:${GREEN};border:3px solid #fff;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:14px">JSS</div><div><div style="color:#fff;font-size:${isHi ? "22px" : "19px"};font-weight:900;line-height:1.2">${isHi ? "जन स्वास्थ्य सहायता अभियान" : "JAN SWASTHYA SAHAYATA ABHIYAN"}</div><div style="color:#fff;font-size:13px;font-weight:700;margin-top:4px">A Project of Healthcare Research &amp; Development Board</div><div style="color:rgba(255,255,255,0.7);font-size:11px;margin-top:2px">(HRDB is Division Of Social Welfare Organization "NAC India")</div></div></div><div style="display:flex;align-items:center;justify-content:space-between;padding:10px 20px;background:#f5f5f5;border-bottom:2px solid #ddd"><span style="font-weight:700;font-size:13px;color:#1e2840">${isHi ? "विज्ञापन सं0 :" : "Advt. No. :"} ${job.advt}</span><span style="background:#1e2840;color:#fff;font-weight:900;font-size:12px;padding:7px 18px;border-radius:2px;letter-spacing:0.05em">${isHi ? "भर्ती आमंत्रण" : "RECRUITMENT INVITATION"}</span><span style="font-weight:700;font-size:13px;color:#1e2840">${isHi ? "दिनांक :" : "DATE :"} ${job.date}</span></div><div style="background:#1e2840;color:#fff;padding:14px 20px;text-align:center;font-size:${isHi ? "15px" : "13px"};font-weight:700;line-height:1.6">${isHi ? job.invitationHi : job.invitationEn}</div><div style="padding:16px 20px"><table style="width:100%;border-collapse:collapse;font-size:${isHi ? "14px" : "13px"}"><tbody>${tableRowsHTML}</tbody></table></div><div style="background:#1e2840;color:#fff;padding:12px 20px;text-align:center"><div style="font-size:${isHi ? "16px" : "14px"};font-weight:900;margin-bottom:6px">${isHi ? "अधिक जानकारी के लिए :" : "FOR MORE INFORMATION :"}</div><div style="font-size:12px;display:flex;justify-content:space-around"><span>Website : https://www.jssabhiyan-nac.in</span><span>Email : ${isHi ? "info@jssabhiyan-nac.in" : "support@jssabhiyan-nac.in"}</span></div></div>`;
//   document.body.appendChild(container);
//   try {
//     await new Promise((r) => setTimeout(r, 100));
//     const canvas = await window.html2canvas(container, {
//       scale: 2,
//       useCORS: true,
//       backgroundColor: "#ffffff",
//       logging: false,
//     });
//     const imgData = canvas.toDataURL("image/png");
//     const { jsPDF } = window.jspdf;
//     const pdf = new jsPDF({
//       unit: "mm",
//       format: "a4",
//       orientation: "portrait",
//     });
//     const pageW = 210,
//       pageH = 297,
//       imgW = pageW - 20;
//     const imgH = (canvas.height * imgW) / canvas.width;
//     if (imgH <= pageH - 20) {
//       pdf.addImage(imgData, "PNG", 10, 10, imgW, imgH);
//     } else {
//       const ratio = canvas.width / imgW,
//         sliceH = (pageH - 20) * ratio;
//       let yOffset = 0,
//         page = 0;
//       while (yOffset < canvas.height) {
//         if (page > 0) pdf.addPage();
//         const sliceCanvas = document.createElement("canvas");
//         sliceCanvas.width = canvas.width;
//         sliceCanvas.height = Math.min(sliceH, canvas.height - yOffset);
//         const ctx = sliceCanvas.getContext("2d");
//         ctx.drawImage(canvas, 0, -yOffset);
//         const sliceData = sliceCanvas.toDataURL("image/png");
//         const sliceImgH = (sliceCanvas.height * imgW) / canvas.width;
//         pdf.addImage(sliceData, "PNG", 10, 10, imgW, sliceImgH);
//         yOffset += sliceH;
//         page++;
//       }
//     }
//     pdf.save(
//       isHi
//         ? `JSSA_${job.advt.replace(/\//g, "-")}_Hindi.pdf`
//         : `JSSA_${job.advt.replace(/\//g, "-")}_English.pdf`,
//     );
//   } finally {
//     document.body.removeChild(container);
//   }
// }

// function ApplicationForm({ job, onBack }) {
//   const [stateVal, setStateVal] = useState("");
//   const [form, setForm] = useState({
//     candidateName: "",
//     fatherName: "",
//     motherName: "",
//     dob: "",
//     gender: "",
//     nationality: "",
//     category: "",
//     aadhar: "",
//     pan: "",
//     mobile: "",
//     email: "",
//     address: "",
//     district: "",
//     block: "",
//     panchayat: "",
//     pincode: "",
//     photo: null,
//     signature: null,
//     higherEdu: "",
//     board: "",
//     marks: "",
//     markPct: "",
//     agree1: false,
//     agree2: false,
//   });

//   const handle = (e) => {
//     const { name, value, type, checked, files } = e.target;
//     if (type === "file") setForm((p) => ({ ...p, [name]: files[0] }));
//     else if (type === "checkbox") setForm((p) => ({ ...p, [name]: checked }));
//     else setForm((p) => ({ ...p, [name]: value }));
//     if (name === "state") {
//       setStateVal(value);
//       setForm((p) => ({ ...p, state: value, district: "" }));
//     }
//   };

//   const iStyle = {
//     width: "100%",
//     padding: "10px 12px",
//     border: "1px solid #ccc",
//     borderRadius: 4,
//     fontSize: 14,
//     background: "#fff",
//     outline: "none",
//     boxSizing: "border-box",
//     color: "#000",
//   };
//   const lStyle = {
//     display: "block",
//     fontSize: 14,
//     fontWeight: 600,
//     color: "#333",
//     marginBottom: 6,
//   };

//   return (
//     <div
//       style={{
//         background: "#fff",
//         fontFamily: "'Segoe UI','Noto Sans',sans-serif",
//       }}
//     >
//       <div
//         style={{
//           background: GREEN,
//           padding: "10px 16px",
//           display: "flex",
//           alignItems: "center",
//           gap: 10,
//         }}
//       >
//         <button
//           onClick={onBack}
//           style={{
//             background: "rgba(255,255,255,0.2)",
//             border: "none",
//             color: "#fff",
//             fontWeight: 700,
//             fontSize: 13,
//             padding: "7px 14px",
//             borderRadius: 4,
//             cursor: "pointer",
//           }}
//         >
//           ← Back
//         </button>
//         <span className="jobs-back-title">
//           {job.title} — Advt. No. {job.advt}
//         </span>
//       </div>
//       <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 14px 40px" }}>
//         <div
//           style={{
//             background: "#f0f0f0",
//             borderRadius: 6,
//             padding: "20px 18px",
//             marginTop: 20,
//           }}
//         >
//           <p
//             style={{
//               textAlign: "center",
//               fontSize: 13,
//               color: "#555",
//               marginBottom: 16,
//             }}
//           >
//             {job.title} Advt. No. {job.advt} / {job.titleHi} {job.advt}
//           </p>
//           <h3 className="jobs-section-heading">PERSONAL DETAILS</h3>
//           <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//             <div>
//               <label style={lStyle}>Candidate's Name / अभ्यर्थी का नाम :</label>
//               <input
//                 name="candidateName"
//                 value={form.candidateName}
//                 onChange={handle}
//                 style={iStyle}
//               />
//             </div>
//             <div className="jobs-grid-2">
//               <div>
//                 <label style={lStyle}>Father's Name / पिता का नाम :</label>
//                 <input
//                   name="fatherName"
//                   value={form.fatherName}
//                   onChange={handle}
//                   style={iStyle}
//                 />
//               </div>
//               <div>
//                 <label style={lStyle}>Mother's Name / माता का नाम :</label>
//                 <input
//                   name="motherName"
//                   value={form.motherName}
//                   onChange={handle}
//                   style={iStyle}
//                 />
//               </div>
//             </div>
//             <div className="jobs-grid-2">
//               <div>
//                 <label style={lStyle}>Date Of Birth / जन्मतिथि :</label>
//                 <input
//                   name="dob"
//                   type="date"
//                   value={form.dob}
//                   onChange={handle}
//                   style={iStyle}
//                 />
//               </div>
//               <div>
//                 <label style={lStyle}>Gender / लिंग :</label>
//                 <select
//                   name="gender"
//                   value={form.gender}
//                   onChange={handle}
//                   style={iStyle}
//                 >
//                   <option value="">--Select--</option>
//                   <option>Male / पुरुष</option>
//                   <option>Female / महिला</option>
//                   <option>Other / अन्य</option>
//                 </select>
//               </div>
//             </div>
//             <div className="jobs-grid-2">
//               <div>
//                 <label style={lStyle}>Nationality / राष्ट्रीयता :</label>
//                 <select
//                   name="nationality"
//                   value={form.nationality}
//                   onChange={handle}
//                   style={iStyle}
//                 >
//                   <option value="">--Select--</option>
//                   <option>Indian / भारतीय</option>
//                   <option>Other / अन्य</option>
//                 </select>
//               </div>
//               <div>
//                 <label style={lStyle}>Category / श्रेणी :</label>
//                 <select
//                   name="category"
//                   value={form.category}
//                   onChange={handle}
//                   style={iStyle}
//                 >
//                   <option value="">--Select--</option>
//                   <option>General / सामान्य</option>
//                   <option>OBC</option>
//                   <option>SC</option>
//                   <option>ST</option>
//                   <option>EWS</option>
//                 </select>
//               </div>
//             </div>
//             <div className="jobs-grid-2">
//               <div>
//                 <label style={lStyle}>Aadhar Number / आधार संख्या :</label>
//                 <input
//                   name="aadhar"
//                   value={form.aadhar}
//                   onChange={handle}
//                   style={iStyle}
//                 />
//               </div>
//               <div>
//                 <label style={lStyle}>Pan Number / पेन संख्या :</label>
//                 <input
//                   name="pan"
//                   value={form.pan}
//                   onChange={handle}
//                   style={iStyle}
//                 />
//               </div>
//             </div>
//             <div className="jobs-grid-2">
//               <div>
//                 <label style={lStyle}>Mobile Number / मोबाइल नंबर :</label>
//                 <input
//                   name="mobile"
//                   value={form.mobile}
//                   onChange={handle}
//                   style={iStyle}
//                 />
//               </div>
//               <div>
//                 <label style={lStyle}>Email Id / ईमेल आईडी :</label>
//                 <input
//                   name="email"
//                   type="email"
//                   value={form.email}
//                   onChange={handle}
//                   style={iStyle}
//                 />
//               </div>
//             </div>
//             <div>
//               <label style={lStyle}>Permanent Address / स्थाई पता :</label>
//               <input
//                 name="address"
//                 value={form.address}
//                 onChange={handle}
//                 style={iStyle}
//               />
//             </div>
//             <div className="jobs-grid-2">
//               <div>
//                 <label style={lStyle}>State / राज्य :</label>
//                 <select
//                   name="state"
//                   value={form.state || ""}
//                   onChange={handle}
//                   style={iStyle}
//                 >
//                   <option value="">Select</option>
//                   {indianStates.map((s) => (
//                     <option key={s}>{s}</option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label style={lStyle}>District / जिला :</label>
//                 <select
//                   name="district"
//                   value={form.district}
//                   onChange={handle}
//                   style={iStyle}
//                 >
//                   <option value=""></option>
//                   {(districtsByState[stateVal] || []).map((d) => (
//                     <option key={d}>{d}</option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//             <div className="jobs-grid-3">
//               <div>
//                 <label style={lStyle}>Block / ब्लॉक :</label>
//                 <select
//                   name="block"
//                   value={form.block}
//                   onChange={handle}
//                   style={iStyle}
//                 >
//                   <option value=""></option>
//                 </select>
//               </div>
//               <div>
//                 <label style={lStyle}>Panchayat / पंचायत :</label>
//                 <select
//                   name="panchayat"
//                   value={form.panchayat}
//                   onChange={handle}
//                   style={iStyle}
//                 >
//                   <option value=""></option>
//                 </select>
//               </div>
//               <div>
//                 <label style={lStyle}>Pin Code / पिन कोड :</label>
//                 <input
//                   name="pincode"
//                   value={form.pincode}
//                   onChange={handle}
//                   style={iStyle}
//                 />
//               </div>
//             </div>
//             <div className="jobs-grid-2">
//               <div>
//                 <label style={lStyle}>Photograph / फोटो :</label>
//                 <input
//                   name="photo"
//                   type="file"
//                   accept="image/*"
//                   onChange={handle}
//                   style={{ ...iStyle, padding: "6px 8px" }}
//                 />
//                 <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
//                   Max file size: 3MB
//                 </p>
//               </div>
//               <div>
//                 <label style={lStyle}>Signature / हस्ताक्षर :</label>
//                 <input
//                   name="signature"
//                   type="file"
//                   accept="image/*"
//                   onChange={handle}
//                   style={{ ...iStyle, padding: "6px 8px" }}
//                 />
//                 <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
//                   Max file size: 3MB
//                 </p>
//               </div>
//             </div>
//           </div>
//           <h3 className="jobs-section-heading" style={{ marginTop: 24 }}>
//             EDUCATION DETAILS
//           </h3>
//           <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//             <div className="jobs-grid-2">
//               <div>
//                 <label style={lStyle}>Higher Education / उच्च शिक्षा :</label>
//                 <input
//                   name="higherEdu"
//                   value={form.higherEdu}
//                   onChange={handle}
//                   style={iStyle}
//                 />
//               </div>
//               <div>
//                 <label style={lStyle}>Board / University :</label>
//                 <input
//                   name="board"
//                   value={form.board}
//                   onChange={handle}
//                   style={iStyle}
//                 />
//               </div>
//             </div>
//             <div className="jobs-grid-2">
//               <div>
//                 <label style={lStyle}>Marks / अंक :</label>
//                 <input
//                   name="marks"
//                   value={form.marks}
//                   onChange={handle}
//                   style={iStyle}
//                 />
//               </div>
//               <div>
//                 <label style={lStyle}>Percentage / प्रतिशत :</label>
//                 <input
//                   name="markPct"
//                   value={form.markPct}
//                   onChange={handle}
//                   style={iStyle}
//                 />
//               </div>
//             </div>
//           </div>
//           <div
//             style={{
//               display: "flex",
//               flexDirection: "column",
//               gap: 10,
//               marginTop: 20,
//             }}
//           >
//             <label
//               style={{
//                 display: "flex",
//                 alignItems: "flex-start",
//                 gap: 8,
//                 fontSize: 14,
//                 cursor: "pointer",
//               }}
//             >
//               <input
//                 type="checkbox"
//                 name="agree1"
//                 checked={form.agree1}
//                 onChange={handle}
//                 style={{
//                   width: 16,
//                   height: 16,
//                   marginTop: 2,
//                   flexShrink: 0,
//                   accentColor: GREEN,
//                 }}
//               />
//               I have read and agree to the Terms and Conditions.{" "}
//               <a
//                 href="#"
//                 style={{
//                   color: "#000",
//                   fontWeight: 700,
//                   textDecoration: "underline",
//                   marginLeft: 4,
//                 }}
//               >
//                 Click here to read
//               </a>
//             </label>
//             <label
//               style={{
//                 display: "flex",
//                 alignItems: "flex-start",
//                 gap: 8,
//                 fontSize: 14,
//                 cursor: "pointer",
//                 lineHeight: 1.6,
//               }}
//             >
//               <input
//                 type="checkbox"
//                 name="agree2"
//                 checked={form.agree2}
//                 onChange={handle}
//                 style={{
//                   width: 16,
//                   height: 16,
//                   marginTop: 2,
//                   flexShrink: 0,
//                   accentColor: GREEN,
//                 }}
//               />
//               I declare that all the information given in this application form
//               is correct to the best of my knowledge and belief.
//             </label>
//           </div>
//           <div style={{ textAlign: "center", marginTop: 22 }}>
//             <button
//               onClick={() => alert("Application submitted!")}
//               className="jobs-submit-btn"
//             >
//               SUBMIT &amp; CONTINUE
//             </button>
//           </div>
//         </div>
//       </div>
//       <style>{jobsCSS}</style>
//     </div>
//   );
// }

// function JobDetailPage({ job, onBack, onApply }) {
//   const [downloading, setDownloading] = useState(null);
//   const d = job.rows;
//   const rows = d.en.length;

//   return (
//     <div
//       style={{
//         background: "#fff",
//         fontFamily: "'Segoe UI','Noto Sans',sans-serif",
//       }}
//     >
//       <div
//         style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px 40px" }}
//       >
//         <div
//           style={{
//             border: `2px solid ${GREEN}`,
//             borderRadius: 4,
//             overflow: "hidden",
//           }}
//         >
//           <div
//             style={{
//               background: `${GREEN}22`,
//               padding: "10px 14px",
//               textAlign: "center",
//               borderBottom: `1px solid ${GREEN}`,
//               fontSize: 13,
//               fontWeight: 600,
//               color: "#1a2a4a",
//             }}
//           >
//             {job.title} Advt. No. {job.advt} / {job.titleHi} {job.advt}
//           </div>
//           <div className="jobs-detail-download-row">
//             <div
//               className="jobs-detail-download-cell"
//               style={{ borderRight: `1px solid ${GREEN}` }}
//             >
//               <div
//                 style={{
//                   fontWeight: 900,
//                   fontSize: 14,
//                   color: "#1a2a4a",
//                   marginBottom: 4,
//                 }}
//               >
//                 Advt No: {job.advt}
//               </div>
//               <div
//                 style={{
//                   fontWeight: 700,
//                   fontSize: 13,
//                   color: "#1a2a4a",
//                   marginBottom: 10,
//                 }}
//               >
//                 Date: {job.date}
//               </div>
//               <button
//                 onClick={async () => {
//                   setDownloading("en");
//                   try {
//                     await downloadPDF(job, "en");
//                   } catch (e) {
//                     alert("PDF download failed: " + e.message);
//                   }
//                   setDownloading(null);
//                 }}
//                 disabled={downloading === "en"}
//                 style={{
//                   color: "#1a56c4",
//                   fontWeight: 700,
//                   fontSize: 13,
//                   textDecoration: "underline",
//                   background: "none",
//                   border: "none",
//                   cursor: "pointer",
//                   padding: 0,
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 4,
//                   opacity: downloading === "en" ? 0.6 : 1,
//                 }}
//               >
//                 📄{" "}
//                 {downloading === "en"
//                   ? "Generating PDF..."
//                   : "Download Advertisement (English) 🌱"}
//               </button>
//             </div>
//             <div className="jobs-detail-download-cell">
//               <div
//                 style={{
//                   fontWeight: 900,
//                   fontSize: 14,
//                   color: "#1a2a4a",
//                   marginBottom: 4,
//                 }}
//               >
//                 विज्ञापन सं० {job.advt}
//               </div>
//               <div
//                 style={{
//                   fontWeight: 700,
//                   fontSize: 13,
//                   color: "#1a2a4a",
//                   marginBottom: 10,
//                 }}
//               >
//                 दिनांक - {job.date}
//               </div>
//               <button
//                 onClick={async () => {
//                   setDownloading("hi");
//                   try {
//                     await downloadPDF(job, "hi");
//                   } catch (e) {
//                     alert("PDF download failed: " + e.message);
//                   }
//                   setDownloading(null);
//                 }}
//                 disabled={downloading === "hi"}
//                 style={{
//                   color: "#1a56c4",
//                   fontWeight: 700,
//                   fontSize: 13,
//                   textDecoration: "underline",
//                   background: "none",
//                   border: "none",
//                   cursor: "pointer",
//                   padding: 0,
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 4,
//                   opacity: downloading === "hi" ? 0.6 : 1,
//                 }}
//               >
//                 📄{" "}
//                 {downloading === "hi"
//                   ? "PDF बन रहा है..."
//                   : "डाउनलोड विज्ञापन (हिंदी) 🌱"}
//               </button>
//             </div>
//           </div>
//           {Array.from({ length: rows }).map((_, i) => (
//             <div
//               key={i}
//               className="jobs-detail-row"
//               style={{ background: i % 2 === 0 ? `${GREEN}08` : "#fff" }}
//             >
//               <div
//                 className="jobs-detail-lang-cell"
//                 style={{ borderRight: `1px solid ${GREEN}` }}
//               >
//                 <div className="jobs-detail-key">{d.en[i][0]}</div>
//                 <div className="jobs-detail-val">: {d.en[i][1]}</div>
//               </div>
//               <div className="jobs-detail-lang-cell">
//                 <div className="jobs-detail-key">{d.hi[i][0]}</div>
//                 <div className="jobs-detail-val">: {d.hi[i][1]}</div>
//               </div>
//             </div>
//           ))}
//         </div>
//         <div
//           style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}
//         >
//           {job.isNew ? (
//             <button onClick={onApply} className="jobs-submit-btn">
//               Apply Now / अभी आवेदन करें
//             </button>
//           ) : (
//             <div
//               style={{
//                 background: "#fee2e2",
//                 border: "1px solid #fca5a5",
//                 borderRadius: 6,
//                 padding: "12px 18px",
//                 fontSize: 14,
//                 fontWeight: 700,
//                 color: "#8B1a1a",
//               }}
//             >
//               ⚠️ This vacancy is closed. / यह भर्ती बंद हो चुकी है।
//             </div>
//           )}
//         </div>
//       </div>
//       <style>{jobsCSS}</style>
//     </div>
//   );
// }

// function VacancyItem({ job, onClick }) {
//   return (
//     <div>
//       <div onClick={() => onClick(job)} className="jobs-vacancy-item">
//         <span style={{ fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
//           &gt;&gt;
//         </span>
//         <span>
//           {job.title} Advt. No. {job.advt} / {job.titleHi} {job.advt}{" "}
//           <strong>{job.advt}</strong>
//           {job.isNew && (
//             <span
//               style={{
//                 display: "inline-block",
//                 fontSize: 10,
//                 fontWeight: 900,
//                 padding: "1px 6px",
//                 borderRadius: 3,
//                 marginLeft: 6,
//                 verticalAlign: "middle",
//                 color: "#fff",
//                 animation: "newBadgeJob 1.5s infinite",
//               }}
//             >
//               NEW
//             </span>
//           )}
//         </span>
//       </div>
//       <div style={{ borderBottom: "1px dashed #aaa", margin: "0 8px" }} />
//     </div>
//   );
// }

// function convertJobToComponentFormat(posting) {
//   const isActive = posting.status === "Active";
//   const lastDate = new Date(posting.lastDate);
//   const today = new Date();
//   const isClosed = lastDate < today;
//   const rowsEn = [
//     ["Post", posting.post?.en || posting.postTitle?.en || ""],
//     ["Total Post", posting.totalPost || ""],
//     ["Monthly Income", posting.income?.en || ""],
//     ["Education Qualification", posting.education?.en || ""],
//     [
//       "Age Limit",
//       `${posting.ageLimit?.en || ""} (As on ${posting.ageAsOn || ""})`,
//     ],
//     ["Job Location", posting.location?.en || ""],
//     ["Selection Process", posting.selectionProcess?.en || ""],
//     ["Application Opening On", posting.applicationOpeningDate || ""],
//     ["Last Date of Application", posting.lastDate || ""],
//     ["1st Merit List Released", posting.firstMeritListDate || ""],
//     ["Final Merit List Released", posting.finalMeritListDate || ""],
//     ["Fee Structure", posting.fee?.en || ""],
//   ];
//   const rowsHi = [
//     ["पद", posting.post?.hi || posting.postTitle?.hi || ""],
//     ["कुल पद", posting.totalPost || ""],
//     ["मासिक आय", posting.income?.hi || ""],
//     ["शैक्षणिक योग्यता", posting.education?.hi || ""],
//     ["आयु सीमा", `${posting.ageLimit?.hi || ""} (${posting.ageAsOn || ""} को)`],
//     ["नौकरी करने का स्थान", posting.location?.hi || ""],
//     ["चयन प्रक्रिया", posting.selectionProcess?.hi || ""],
//     ["आवेदन खुलने की तिथि", posting.applicationOpeningDate || ""],
//     ["आवेदन की अंतिम तिथि", posting.lastDate || ""],
//     ["मेधा सूची जारी", posting.firstMeritListDate || ""],
//     ["अंतिम मेधा सूची जारी", posting.finalMeritListDate || ""],
//     ["शुल्क संरचना", posting.fee?.hi || ""],
//   ];
//   return {
//     id: posting._id,
//     advt: posting.advtNo,
//     isNew: isActive && !isClosed,
//     title: posting.postTitle?.en || posting.post?.en || "",
//     titleHi: posting.postTitle?.hi || posting.post?.hi || "",
//     date: posting.date || "",
//     invitationEn:
//       posting.title?.en ||
//       `Invitation for all eligible candidates on vacant posts of ${posting.postTitle?.en || posting.post?.en || ""} under Jan Swasthya Sahayata Abhiyan by Healthcare Research and Development Board (A Division of NAC India).`,
//     invitationHi:
//       posting.title?.hi ||
//       `हेल्थ केयर रिसर्च एंड डेवलपमेंट बोर्ड (A Division Of NAC INDIA) द्वारा जन स्वास्थ्य सहायता अभियान के तहत ${posting.postTitle?.hi || posting.post?.hi || ""} के रिक्त पदों पर सभी पात्र उम्मीदवारों के लिए आमंत्रण`,
//     rows: { en: rowsEn, hi: rowsHi },
//   };
// }

// const jobsCSS = `
//   * { box-sizing: border-box; }

//   @keyframes newBadgeJob {
//     0%   { background: #e53e3e; }
//     25%  { background: #d97706; }
//     50%  { background: #7c3aed; }
//     75%  { background: #0369a1; }
//     100% { background: #e53e3e; }
//   }

//   .jobs-back-title { color: #fff; font-weight: 700; font-size: 14px; }

//   .jobs-section-heading {
//     font-weight: 900; font-size: 16px; color: #1a2a4a; margin: 20px 0 14px;
//   }

//   .jobs-submit-btn {
//     background: ${GREEN}; color: #fff; font-weight: 900;
//     font-size: 15px; padding: 12px 40px;
//     border: none; cursor: pointer; border-radius: 4px;
//   }

//   /* ── Vacancy list item ── */
//   .jobs-vacancy-item {
//     padding: 14px 20px; font-size: 15px; color: #1a2a4a;
//     line-height: 1.7; cursor: pointer;
//     display: flex; align-items: flex-start; gap: 8px;
//   }

//   /* ── Job list page — CENTERED with side gaps ── */
//   .jobs-list-wrap {
//     max-width: 1000px;
//     margin: 0 auto;
//     padding: 32px 40px;
//   }

//   .jobs-list-heading {
//     font-weight: 700; font-size: 20px; color: #1a2a4a; margin-bottom: 6px;
//   }

//   .jobs-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
//   .jobs-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }

//   /* ── Detail download row ── */
//   .jobs-detail-download-row {
//     display: grid; grid-template-columns: 1fr 1fr;
//     border-bottom: 1px solid ${GREEN};
//   }
//   .jobs-detail-download-cell {
//     padding: 16px 18px; background: ${GREEN}0d;
//   }

//   /* ── Detail bilingual rows ── */
//   .jobs-detail-row {
//     display: grid; grid-template-columns: 1fr 1fr;
//     border-bottom: 1px solid ${GREEN}44;
//   }
//   .jobs-detail-row:last-child { border-bottom: none; }

//   .jobs-detail-lang-cell {
//     display: grid; grid-template-columns: 150px 1fr; padding: 0;
//   }
//   .jobs-detail-key {
//     padding: 10px 12px; font-weight: 700; font-size: 13px;
//     color: #333; border-right: 1px solid ${GREEN}33;
//   }
//   .jobs-detail-val {
//     padding: 10px 12px; font-size: 13px; color: #333; line-height: 1.6;
//   }

//   @media (max-width: 768px) {
//     .jobs-list-wrap { padding: 16px 12px; }
//     .jobs-list-heading { font-size: 14px; }
//     .jobs-vacancy-item { padding: 8px 10px; font-size: 10px; }
//     .jobs-back-title { font-size: 10px; }
//     .jobs-section-heading { font-size: 11px; }
//     .jobs-submit-btn { font-size: 11px; padding: 8px 18px; }
//     .jobs-grid-2 { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
//     .jobs-grid-3 { grid-template-columns: 1fr 1fr 1fr !important; gap: 6px !important; }

//     /* download row — keep 2 cols, just smaller */
//     .jobs-detail-download-row { grid-template-columns: 1fr 1fr !important; }
//     .jobs-detail-download-cell { padding: 8px 6px; }

//     /* detail rows — keep 2 cols (EN | HI) side by side */
//     .jobs-detail-row { grid-template-columns: 1fr 1fr !important; }
//     .jobs-detail-lang-cell { grid-template-columns: 60px 1fr; }
//     .jobs-detail-key { font-size: 7px; padding: 5px 4px; }
//     .jobs-detail-val { font-size: 7px; padding: 5px 4px; }
//   }
// `;

// export default function JobsPage() {
//   const navigate = useNavigate();
//   const [view, setView] = useState("list");
//   const [selectedJob, setSelectedJob] = useState(null);
//   const [latestJobs, setLatestJobs] = useState([]);
//   const [oldJobs, setOldJobs] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchJobs = async () => {
//       try {
//         setLoading(true);
//         const response = await jobPostingsAPI.getAll({
//           status: "all",
//           limit: 100,
//         });
//         if (response.success && response.data.postings) {
//           const allJobs = response.data.postings.map(
//             convertJobToComponentFormat,
//           );
//           const active = allJobs.filter((j) => j.isNew);
//           const inactive = allJobs.filter((j) => !j.isNew);
//           active.sort((a, b) => {
//             const ja = response.data.postings.find((p) => p._id === a.id);
//             const jb = response.data.postings.find((p) => p._id === b.id);
//             return new Date(jb.createdAt) - new Date(ja.createdAt);
//           });
//           setLatestJobs(active);
//           setOldJobs(inactive);
//         } else {
//           setLatestJobs([]);
//           setOldJobs([]);
//         }
//       } catch {
//         setLatestJobs([]);
//         setOldJobs([]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchJobs();
//   }, []);

//   const openDetail = (job) => {
//     navigate(`/job-postings/view/${job.id}`);
//   };
//   const openApply = () => setView("apply");
//   const backToList = () => {
//     setView("list");
//     setSelectedJob(null);
//   };
//   const backToDetail = () => setView("detail");

//   if (view === "apply" && selectedJob)
//     return <ApplicationForm job={selectedJob} onBack={backToDetail} />;
//   if (view === "detail" && selectedJob)
//     return (
//       <JobDetailPage
//         job={selectedJob}
//         onBack={backToList}
//         onApply={openApply}
//       />
//     );

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: "#fff",
//         fontFamily: "'Segoe UI','Noto Sans',sans-serif",
//       }}
//       className="jobs-list-wrap"
//     >
//       {loading ? (
//         <div
//           style={{
//             textAlign: "center",
//             padding: "40px",
//             fontSize: 16,
//             color: "#666",
//           }}
//         >
//           Loading jobs...
//         </div>
//       ) : (
//         <>
//           <div style={{ marginBottom: 36 }}>
//             <h2 className="jobs-list-heading">List Of Latest Vacancies</h2>
//             <div style={{ borderBottom: `2px solid ${GREEN}` }} />
//             {latestJobs.length > 0 ? (
//               latestJobs.map((job) => (
//                 <VacancyItem key={job.id} job={job} onClick={openDetail} />
//               ))
//             ) : (
//               <div
//                 style={{
//                   padding: "18px",
//                   textAlign: "center",
//                   color: "#666",
//                   fontSize: 14,
//                 }}
//               >
//                 No active vacancies at the moment.
//               </div>
//             )}
//           </div>
//           <div>
//             <h2 className="jobs-list-heading">List of Old Vacancies</h2>
//             <div style={{ borderBottom: `2px solid ${GREEN}` }} />
//             {oldJobs.length > 0 ? (
//               oldJobs.map((job) => (
//                 <VacancyItem key={job.id} job={job} onClick={openDetail} />
//               ))
//             ) : (
//               <div
//                 style={{
//                   padding: "18px",
//                   textAlign: "center",
//                   color: "#666",
//                   fontSize: 14,
//                 }}
//               >
//                 No old vacancies to display.
//               </div>
//             )}
//           </div>
//         </>
//       )}
//       <style>{jobsCSS}</style>
//     </div>
//   );
// }

