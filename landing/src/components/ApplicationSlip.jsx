import React from "react";

// ── Import logo from assets ───────────────────────────────────────────────────
import logo from "../assets/img0.png";
// ─────────────────────────────────────────────────────────────────────────────

const ApplicationSlip = ({
  applicationData = {},
  jobPosting = {},
  photoSrc = null,
  signatureSrc = null
}) => {
  const Row = ({ label, value }) => (
    <tr>
      <td style={styles.tdLabel}>{label}</td>
      <td style={styles.tdValue}>{value}</td>
    </tr>
  );

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  // Format DOB
  const formatDOB = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formData = applicationData || {};
  const applicationNumber = formData.applicationNumber || "";
  const advtNo = jobPosting?.advtNo || jobPosting?.advtNo || "JSSA/REQ/01/2025/P-III";
  const postTitle = jobPosting?.postTitle?.en || jobPosting?.post?.en || "District Manager";
  const currentDate = formatDate(new Date());

  return (
    <div style={styles.page} className="slp-root" id="application-slip-pdf">
      <style>{SLIP_THEME_CSS}</style>
      {/* ── Browser print header bar ──────────────────────────────────── */}
      <div style={styles.printBar} className="slp-printbar">
        <span>{currentDate}</span>
        <span>Application Slip - {postTitle} Recruitment 2024</span>
      </div>

      {/* ── LOGO only — big, full width ───────────────────────────────── */}
      <div style={styles.logoWrapper}>
        <img
          src={logo}
          alt="Jan Swasthya Sahayata Abhiyan"
          style={styles.logo}
        />
      </div>

      {/* ── Post title banner ─────────────────────────────────────────── */}
      <div style={styles.banner} className="slp-banner">{postTitle} Recruitment</div>

      {/* ── Advt / Application Slip / Date strip ─────────────────────── */}
      <div style={styles.strip} className="slp-strip">
        <span>
          <strong>Advt. No.:</strong> {advtNo}
        </span>
        <span style={styles.stripCenter} className="slp-strip-title">Application Slip</span>
        <span>
          <strong>Date:</strong> {currentDate}
        </span>
      </div>

      {/* ── Post applied + Application number ────────────────────────── */}
      <div style={styles.postRow} className="slp-post">
        <span>
          <strong>Post Applied for:</strong> {postTitle}
        </span>
        <span>
          <strong>Application No.:</strong> {applicationNumber}
        </span>
      </div>

      {/* ── Personal Details heading ──────────────────────────────────── */}
      <div style={styles.sectionHead} className="slp-sec">&nbsp;Personal Details</div>

      {/* ── Personal Details table + blank photo box ─────────────────── */}
      <div style={styles.detailsRow}>
        <table style={styles.table}>
          <tbody>
            <Row label="Name:" value={(formData.candidateName || "").toUpperCase()} />
            <Row label="Father's Name:" value={(formData.fatherName || "").toUpperCase()} />
            <Row label="Mother's Name:" value={(formData.motherName || "").toUpperCase()} />
            <Row label="Date of Birth:" value={formatDOB(formData.dob)} />
            <Row label="Gender:" value={formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : ""} />
            <Row label="Nationality:" value={formData.nationality ? formData.nationality.charAt(0).toUpperCase() + formData.nationality.slice(1) : "Indian"} />
            <Row label="Category:" value={(formData.category || "").toUpperCase()} />
            <Row label="Aadhar Number:" value={formData.aadhar || ""} />
            <Row label="PAN Number:" value={(formData.pan || "").toUpperCase()} />
            <Row label="Mobile Number:" value={formData.mobile || ""} />
            <Row label="Email ID:" value={formData.email || ""} />
            <Row
              label="Permanent Address:"
              value={(formData.address || "").toUpperCase()}
            />
            <Row label="State:" value={formData.state || ""} />
          </tbody>
        </table>

        {/* Photo box */}
        <div style={styles.photoBox} className="slp-box">
          {photoSrc ? (
            <img
              src={photoSrc}
              alt="Applicant Photo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : null}
        </div>
      </div>

      {/* Pincode row */}
      <table style={{ ...styles.table, marginBottom: "10px" }}>
        <tbody>
          <Row label="Pincode:" value={formData.pincode || ""} />
        </tbody>
      </table>

      {/* ── Educational Details heading ───────────────────────────────── */}
      <div style={styles.sectionHead} className="slp-sec">&nbsp;Educational Details</div>

      <table style={{ ...styles.table, marginBottom: "12px" }}>
        <tbody>
          <Row label="Higher Education:" value={formData.higherEducation || ""} />
          <Row
            label="Board/University:"
            value={formData.board || ""}
          />
          <Row label="Total Marks:" value={formData.marks || ""} />
          <Row label="Marks in Percentage:" value={formData.markPercentage || ""} />
        </tbody>
      </table>

      {/* ── Declaration checkboxes ────────────────────────────────────── */}
      <div style={styles.checkRow}>
        <span style={styles.checkbox}>&#10003;</span>
        <span>I have read and agree to the Terms and Conditions.</span>
      </div>

      <div
        style={{ ...styles.checkRow, marginBottom: "16px", lineHeight: "1.5" }}
      >
        <span style={styles.checkbox}>&#10003;</span>
        <span>
          I declare that all the information given in this application form is
          correct to the best of my knowledge and belief. If any information
          provided is found false, my candidature may be rejected at any point
          of time. I have read and understood the conditions which I would abide
          by. Thus, I have given the above declaration in my full consciousness
          without any pressure.
        </span>
      </div>

      {/* ── BLANK static signature box ────────────────────────────────── */}
      <div style={styles.sigWrapper} className="slp-sig">
        <div style={styles.sigBlock}>
          <div style={styles.sigBox}>
            {signatureSrc ? (
              <img
                src={signatureSrc}
                alt="Signature"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            ) : null}
          </div>
          <div style={styles.sigLabel}>Candidate's Signature</div>
        </div>
      </div>

      {/* ── Bottom summary table ──────────────────────────────────────── */}
      <table style={styles.summaryTable} className="slp-sum">
        <thead>
          <tr>
            {["Application No.:", "Email:", "Payment Status:", "Date:"].map(
              (h) => (
                <th key={h} style={styles.th}>
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={styles.td}>{applicationNumber}</td>
            <td style={styles.td}>{formData.email || ""}</td>
            <td style={styles.td}>Complete</td>
            <td style={styles.td}>{currentDate}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Footer URL ────────────────────────────────────────────────── */}
      <div style={styles.footer} className="slp-foot">
        <span>
          https://jssabhiyan.com/fill_application_print?oid={formData._id || formData.id || applicationNumber}
        </span>
        <span>1/1</span>
      </div>
    </div>
  );
};

/* ── Styles ───────────────────────────────────────────────────────────────── */
const styles = {
  page: {
    background: "#fff",
    fontFamily: "'Times New Roman', Times, serif",
    color: "#111",
    maxWidth: "900px",
    margin: "0 auto",
    padding: "14px 60px 22px 60px",
    boxSizing: "border-box",
    fontSize: "13px",
  },
  printBar: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11.5px",
    color: "#444",
    paddingBottom: "6px",
    marginBottom: "14px",
  },

  /* Big logo — full width, no text beside it */
  logoWrapper: {
    width: "100%",
    marginBottom: "12px",
  },
  logo: {
    width: "100%",
    height: "auto",
    objectFit: "contain",
    display: "block",
  },

  banner: {
    border: "1px solid #555",
    textAlign: "center",
    padding: "5px 0",
    fontWeight: "bold",
    fontSize: "14px",
    marginBottom: "6px",
  },
  strip: {
    border: "1px solid #555",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 12px",
    marginBottom: "10px",
    fontSize: "13px",
  },
  stripCenter: {
    fontWeight: "bold",
    fontSize: "15px",
  },
  postRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    fontSize: "14px",
  },
  sectionHead: {
    fontWeight: "bold",
    fontSize: "14px",
    marginBottom: "5px",
  },
  detailsRow: {
    display: "flex",
    gap: "14px",
    marginBottom: "4px",
    alignItems: "flex-start",
  },
  table: {
    borderCollapse: "collapse",
    flex: 1,
  },
  tdLabel: {
    fontWeight: "bold",
    paddingRight: "16px",
    paddingTop: "1.5px",
    paddingBottom: "1.5px",
    verticalAlign: "top",
    whiteSpace: "nowrap",
    width: "190px",
    fontSize: "13px",
  },
  tdValue: {
    paddingTop: "1.5px",
    paddingBottom: "1.5px",
    verticalAlign: "top",
    fontSize: "13px",
    lineHeight: "1.3",
  },
  photoBox: {
    flexShrink: 0,
    width: "132px",
    height: "158px",
    border: "1px solid #888",
    background: "#ffffff",
    overflow: "hidden",
  },
  checkRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    marginBottom: "10px",
    fontSize: "13px",
  },
  checkbox: {
    marginTop: "1px",
    flexShrink: 0,
    width: "14px",
    height: "14px",
    borderRadius: "3px",
    background: "#4D7C0F",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "bold",
    lineHeight: "1",
  },
  sigWrapper: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "12px",
  },
  sigBlock: {
    textAlign: "center",
  },
  sigBox: {
    border: "1px solid #aaa",
    width: "145px",
    height: "62px",
    background: "#ffffff",
    marginBottom: "4px",
    overflow: "hidden",
  },
  sigLabel: {
    fontSize: "13px",
  },
  summaryTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
    textAlign: "center",
    marginBottom: "16px",
  },
  th: {
    border: "1px solid #555",
    padding: "6px 10px",
    fontWeight: "bold",
    background: "#fff",
  },
  td: {
    border: "1px solid #555",
    padding: "6px 10px",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    color: "#555",
    borderTop: "1px solid #ddd",
    paddingTop: "6px",
  },
};

// Application slip / PDF — landing-site theme (dark green #3F6212, green #4D7C0F, Segoe UI)
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

export default ApplicationSlip;
