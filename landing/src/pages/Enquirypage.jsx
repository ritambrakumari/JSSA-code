import React, { useState, useMemo } from "react";

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
  "Chandigarh",
  "Puducherry",
  "Andaman & Nicobar Islands",
  "Dadra & Nagar Haveli",
  "Daman & Diu",
  "Lakshadweep",
];

const districtsByState = {
  Bihar: [
    "Patna",
    "Gaya",
    "Muzaffarpur",
    "Bhagalpur",
    "Darbhanga",
    "Nalanda",
    "Vaishali",
    "Saran",
    "Siwan",
    "Gopalganj",
    "Purnia",
    "Katihar",
    "Araria",
    "Kishanganj",
    "Supaul",
    "Madhepura",
    "Saharsa",
    "Khagaria",
    "Begusarai",
    "Samastipur",
    "Munger",
    "Lakhisarai",
    "Sheikhpura",
    "Jamui",
    "Banka",
    "Nawada",
    "Aurangabad",
    "Arwal",
    "Jehanabad",
    "Patna Sahib",
    "Bhojpur",
    "Buxar",
    "Kaimur",
    "Rohtas",
    "West Champaran",
    "East Champaran",
    "Sheohar",
    "Sitamarhi",
    "Madhubani",
    "Motihari",
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
    "Aligarh",
    "Bareilly",
    "Moradabad",
    "Saharanpur",
    "Gorakhpur",
    "Jhansi",
    "Mathura",
    "Firozabad",
    "Muzaffarnagar",
    "Hapur",
    "Rampur",
    "Shahjahanpur",
  ],
  Delhi: [
    "Central Delhi",
    "East Delhi",
    "New Delhi",
    "North Delhi",
    "North East Delhi",
    "North West Delhi",
    "Shahdara",
    "South Delhi",
    "South East Delhi",
    "South West Delhi",
    "West Delhi",
  ],
};

function generateCaptcha() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 6; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const fieldStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: 3,
  fontSize: 14,
  color: "#333",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: 14,
  fontWeight: 600,
  color: "#4a5568",
  marginBottom: 6,
};

export default function EnquiryPage({ onNavigate }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    state: "",
    district: "",
    pincode: "",
    subject: "",
    message: "",
    captchaInput: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [captcha] = useState(generateCaptcha);

  const districts = useMemo(
    () => districtsByState[form.state] || [],
    [form.state],
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "state" ? { district: "" } : {}),
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Valid email required";
    if (!form.contact.trim() || !/^[6-9]\d{9}$/.test(form.contact))
      e.contact = "Valid 10-digit number required";
    if (!form.address.trim()) e.address = "Required";
    if (!form.subject.trim()) e.subject = "Required";
    if (!form.message.trim()) e.message = "Required";
    if (form.captchaInput.trim().toLowerCase() !== captcha.toLowerCase())
      e.captchaInput = "Incorrect code";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitted(true);
  };

  const handleReset = () => {
    setForm({
      name: "",
      email: "",
      contact: "",
      address: "",
      state: "",
      district: "",
      pincode: "",
      subject: "",
      message: "",
      captchaInput: "",
    });
    setErrors({});
    setSubmitted(false);
  };

  return (
    <div
      style={{
        background: "#fff",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}
    >
      <style>{`
        .enq-outer { max-width: 1400px; margin: 0 auto; padding: 40px 48px 60px; }
        .enq-title { text-align: center; font-size: 28px; font-weight: 700; color: #2d3748; margin: 0 0 32px; line-height: 1.4; }
        .enq-box { background: #f2f2f2; border-radius: 4px; padding: 32px 36px 36px; }
        .enq-row-1 { display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 20px; }
        .enq-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .enq-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .enq-err { color: #dc2626; font-size: 11px; margin-top: 3px; }
        .enq-submit-row { display: flex; justify-content: center; margin-top: 24px; }
        .enq-submit-btn { background: ${GREEN}; color: #fff; font-weight: 900; font-size: 15px; letter-spacing: 0.1em; padding: 12px 40px; border: none; border-radius: 4px; cursor: pointer; }
        @media (max-width: 768px) {
          .enq-outer { padding: 20px 14px 40px; }
          .enq-title { font-size: 13px !important; margin-bottom: 16px !important; }
          .enq-box { padding: 12px 10px 16px; }
          .enq-row-1 { gap: 8px; margin-bottom: 8px; }
          .enq-row-2 { grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
          .enq-row-3 { grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 8px; }
          .enq-box input, .enq-box select, .enq-box textarea { font-size: 9px !important; padding: 5px 5px !important; }
          .enq-box label, .enq-box p { font-size: 9px !important; margin-bottom: 3px !important; }
          .enq-err { font-size: 8px !important; }
          .enq-submit-btn { font-size: 11px !important; padding: 8px 24px !important; }
        }
      `}</style>

      <div className="enq-outer">
        <h2 className="enq-title">
          Have any Question?
          <br />
          Describe your Query below
        </h2>

        {submitted ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              background: "#f2f2f2",
              borderRadius: 4,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h3
              style={{
                fontWeight: 800,
                fontSize: 20,
                color: "#1a4a0a",
                marginBottom: 12,
              }}
            >
              Enquiry Submitted Successfully!
            </h3>
            <p style={{ fontSize: 14, color: "#444", marginBottom: 24 }}>
              Our team will respond within 3 working days.
            </p>
            <button
              onClick={handleReset}
              style={{
                background: GREEN,
                color: "#fff",
                fontWeight: 900,
                fontSize: 14,
                padding: "10px 32px",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Submit Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="enq-box">
              {/* Your Name */}
              <div className="enq-row-1">
                <div>
                  <label style={labelStyle}>Your Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    style={{
                      ...fieldStyle,
                      borderColor: errors.name ? "#dc2626" : "#ccc",
                    }}
                  />
                  {errors.name && <p className="enq-err">{errors.name}</p>}
                </div>
              </div>

              {/* Email + Contact */}
              <div className="enq-row-2">
                <div>
                  <label style={labelStyle}>Email Id *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    style={{
                      ...fieldStyle,
                      borderColor: errors.email ? "#dc2626" : "#ccc",
                    }}
                  />
                  {errors.email && <p className="enq-err">{errors.email}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Contact Number *</label>
                  <input
                    type="tel"
                    name="contact"
                    value={form.contact}
                    onChange={handleChange}
                    maxLength={10}
                    style={{
                      ...fieldStyle,
                      borderColor: errors.contact ? "#dc2626" : "#ccc",
                    }}
                  />
                  {errors.contact && (
                    <p className="enq-err">{errors.contact}</p>
                  )}
                </div>
              </div>

              {/* Full Address */}
              <div className="enq-row-1">
                <div>
                  <label style={labelStyle}>Full Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    style={{
                      ...fieldStyle,
                      borderColor: errors.address ? "#dc2626" : "#ccc",
                    }}
                  />
                  {errors.address && (
                    <p className="enq-err">{errors.address}</p>
                  )}
                </div>
              </div>

              {/* State / District / Pincode */}
              <div className="enq-row-3">
                <div>
                  <label style={labelStyle}>State/राज्य :</label>
                  <select
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    style={{
                      ...fieldStyle,
                      borderColor: "#ccc",
                      appearance: "auto",
                    }}
                  >
                    <option value="">Select</option>
                    {indianStates.map((s, i) => (
                      <option key={i} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>District/जिला :</label>
                  <select
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    style={{
                      ...fieldStyle,
                      borderColor: "#ccc",
                      appearance: "auto",
                    }}
                  >
                    <option value="">Select</option>
                    {districts.map((d, i) => (
                      <option key={i} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>
                    Postal Pin Code/डाक पिन कोड :
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    maxLength={6}
                    style={fieldStyle}
                  />
                </div>
              </div>

              {/* Subject */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Subject of Enquiry *</label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  style={{
                    ...fieldStyle,
                    borderColor: errors.subject ? "#dc2626" : "#ccc",
                  }}
                />
                {errors.subject && <p className="enq-err">{errors.subject}</p>}
              </div>

              {/* Message */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Message/Enquiry *</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={8}
                  style={{
                    ...fieldStyle,
                    resize: "vertical",
                    minHeight: 180,
                    borderColor: errors.message ? "#dc2626" : "#ccc",
                  }}
                />
                {errors.message && <p className="enq-err">{errors.message}</p>}
              </div>

              {/* Captcha */}
              <div style={{ marginBottom: 8 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 400,
                    color: "#4a5568",
                    margin: "0 0 8px 0",
                  }}
                >
                  Input this code below:* {captcha}
                </p>
                <input
                  type="text"
                  name="captchaInput"
                  value={form.captchaInput}
                  onChange={handleChange}
                  maxLength={6}
                  style={{
                    ...fieldStyle,
                    width: 340,
                    borderColor: errors.captchaInput ? "#dc2626" : "#ccc",
                  }}
                />
                {errors.captchaInput && (
                  <p className="enq-err">{errors.captchaInput}</p>
                )}
              </div>

              {/* Submit */}
              <div className="enq-submit-row">
                <button type="submit" className="enq-submit-btn">
                  SUBMIT
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
