// import { useState } from "react";

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
//   ],
// };

// const inputStyle = {
//   width: "100%",
//   padding: "10px 12px",
//   border: "1px solid #ccc",
//   borderRadius: 4,
//   fontSize: 14,
//   background: "#fff",
//   outline: "none",
//   boxSizing: "border-box",
// };

// const labelStyle = {
//   display: "block",
//   fontSize: 14,
//   fontWeight: 600,
//   color: "#111",
//   marginBottom: 6,
// };

// export default function MembershipPage() {
//   const [form, setForm] = useState({
//     name: "",
//     fatherName: "",
//     mobile: "",
//     email: "",
//     photo: null,
//     aadhar: "",
//     pan: "",
//     dob: "",
//     address: "",
//     state: "",
//     district: "",
//     zip: "",
//     policeStation: "",
//     signature: null,
//     agree1: false,
//     agree2: false,
//   });
//   const [selectedState, setSelectedState] = useState("");

//   const handleChange = (e) => {
//     const { name, value, type, checked, files } = e.target;
//     if (type === "file") setForm((p) => ({ ...p, [name]: files[0] }));
//     else if (type === "checkbox") setForm((p) => ({ ...p, [name]: checked }));
//     else setForm((p) => ({ ...p, [name]: value }));
//     if (name === "state") {
//       setSelectedState(value);
//       setForm((p) => ({ ...p, district: "" }));
//     }
//   };

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: "#fff",
//         fontFamily: "'Segoe UI', 'Noto Sans', sans-serif",
//         color: "#000",
//       }}
//     >
//       {/* ── MEMBERSHIP & BENEFITS TEXT SECTION ── */}
//       <div style={{ width: "100%", padding: "32px 40px", background: "#fff" }}>
//         <h2
//           style={{
//             fontWeight: 900,
//             fontSize: 28,
//             color: "#1a2a4a",
//             marginBottom: 24,
//           }}
//         >
//           Membership &amp; Benefits / सदस्यता एवं सुविधा
//         </h2>

//         <div
//           style={{
//             borderTop: `2px solid ${GREEN}`,
//             paddingTop: 24,
//             display: "flex",
//             flexDirection: "column",
//             gap: 20,
//           }}
//         >
//           <p style={{ fontSize: 14, lineHeight: 1.9, color: "#000" }}>
//             <span style={{ fontWeight: 700 }}>Membership :</span> Any citizen of
//             the country whose minimum age is 18 years can get membership under
//             Jan Swasthya Sahayata Abhiyan, Documents required to take
//             membership: Aadhar card, PAN card and photocopy of ration card and
//             membership fee are necessary.
//           </p>

//           <p style={{ fontSize: 14, lineHeight: 1.9, color: "#000" }}>
//             <span style={{ fontWeight: 700 }}>सदस्यता :</span> देश के कोई भी
//             नागरिक जिसकी न्यूनतम आयु 18 वर्ष है, वो जन स्वास्थ्य सहायता अभियान
//             के अंतर्गत सदस्यता प्राप्त कर सकते हैं। सदस्यता लेने के लिए जरूरी
//             दस्तावेज आधारकार्ड, पैन कार्ड तथा राशन कार्ड की छायाप्रति एवं
//             सदस्यता शुल्क जरूरी है।
//           </p>

//           <p style={{ fontSize: 14, lineHeight: 1.9, color: "#000" }}>
//             <span style={{ fontWeight: 700 }}>Benefits :</span> Jan Swasthya
//             Sahayata card is provided by the organization to each member
//             associated under the Jan Swasthya Sahayata Abhiyan. And through this
//             card, you will get better treatment by special doctor, medicines and
//             medical examination in the health camp organized by the organization
//             and as per the need, financial assistance and health related
//             assistance will be provided.
//           </p>

//           <p style={{ fontSize: 14, lineHeight: 1.9, color: "#000" }}>
//             <span style={{ fontWeight: 700 }}>सुविधा :</span> जन स्वास्थ्य
//             सहायता अभियान के अंतर्गत जुड़े प्रत्येक सदस्य को संस्था द्वारा एक जन
//             स्वास्थ्य सहायता कार्ड प्रदान किया जाता है और इस कार्ड के माध्यम से
//             आपको संस्था द्वारा आयोजित स्वास्थ्य शिविर में विशेष चिकित्सक द्वारा
//             बेहतर इलाज, दवाईयां एवं चिकित्सा जांच करायी जायेगी तथा आवश्यकतानुसार
//             आर्थिक सहायता एवं स्वास्थ्य संबंधी सहायता प्रदान की जायेगी।
//           </p>
//         </div>
//       </div>

//       {/* ── REGISTRATION FORM ── */}
//       <div style={{ width: "100%", padding: "0 40px 40px" }}>
//         <div
//           style={{
//             background: "#f0f0f0",
//             borderRadius: 6,
//             padding: "32px 36px",
//           }}
//         >
//           <h2
//             style={{
//               fontWeight: 900,
//               fontSize: 18,
//               color: "#000",
//               marginBottom: 28,
//             }}
//           >
//             ONLINE MEMBERSHIP REGISTRATION FORM / ऑनलाइन सदस्यता पंजीकरण फॉर्म :
//           </h2>

//           <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
//             {/* Row 1: Name + Father Name */}
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "1fr 1fr",
//                 gap: 24,
//               }}
//             >
//               <div>
//                 <label style={labelStyle}>Your Name/आपका नाम *</label>
//                 <input
//                   name="name"
//                   value={form.name}
//                   onChange={handleChange}
//                   style={inputStyle}
//                 />
//               </div>
//               <div>
//                 <label style={labelStyle}>Father's Name/पिता का नाम*</label>
//                 <input
//                   name="fatherName"
//                   value={form.fatherName}
//                   onChange={handleChange}
//                   style={inputStyle}
//                 />
//               </div>
//             </div>

//             {/* Row 2: Mobile + Email */}
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "1fr 1fr",
//                 gap: 24,
//               }}
//             >
//               <div>
//                 <label style={labelStyle}>Mobile Number/मोबाइल नंबर*</label>
//                 <input
//                   name="mobile"
//                   value={form.mobile}
//                   onChange={handleChange}
//                   style={inputStyle}
//                 />
//               </div>
//               <div>
//                 <label style={labelStyle}>Email Id/ईमेल आईडी*</label>
//                 <input
//                   name="email"
//                   type="email"
//                   value={form.email}
//                   onChange={handleChange}
//                   style={inputStyle}
//                 />
//               </div>
//             </div>

//             {/* Row 3: Photo + Aadhar */}
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "1fr 1fr",
//                 gap: 24,
//               }}
//             >
//               <div>
//                 <label style={labelStyle}>
//                   Attach Photograph/फोटोग्राफ संलग्न करें*
//                 </label>
//                 <input
//                   name="photo"
//                   type="file"
//                   accept="image/*"
//                   onChange={handleChange}
//                   style={{ ...inputStyle, padding: "6px 8px" }}
//                 />
//                 <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
//                   Max file size:1 MB
//                 </p>
//               </div>
//               <div>
//                 <label style={labelStyle}>Aadhar No/आधार नंबर*</label>
//                 <input
//                   name="aadhar"
//                   value={form.aadhar}
//                   onChange={handleChange}
//                   style={inputStyle}
//                 />
//               </div>
//             </div>

//             {/* Row 4: PAN + DOB */}
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "1fr 1fr",
//                 gap: 24,
//               }}
//             >
//               <div>
//                 <label style={labelStyle}>PAN Card No/पैन कार्ड नं*</label>
//                 <input
//                   name="pan"
//                   value={form.pan}
//                   onChange={handleChange}
//                   style={inputStyle}
//                 />
//               </div>
//               <div>
//                 <label style={labelStyle}>Date Of Birth/जन्मतिथि*</label>
//                 <input
//                   name="dob"
//                   type="date"
//                   value={form.dob}
//                   onChange={handleChange}
//                   style={inputStyle}
//                 />
//               </div>
//             </div>

//             {/* Row 5: Permanent Address (full width) */}
//             <div>
//               <label style={labelStyle}>Permanent Address</label>
//               <input
//                 name="address"
//                 value={form.address}
//                 onChange={handleChange}
//                 placeholder="House No, Street Name, Area and Landmark"
//                 style={inputStyle}
//               />
//             </div>

//             {/* Row 6: State + District + ZIP */}
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "1fr 1fr 1fr",
//                 gap: 24,
//               }}
//             >
//               <div>
//                 <label style={labelStyle}>State</label>
//                 <select
//                   name="state"
//                   value={form.state}
//                   onChange={handleChange}
//                   style={inputStyle}
//                 >
//                   <option value="">Select</option>
//                   {indianStates.map((s) => (
//                     <option key={s} value={s}>
//                       {s}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label style={labelStyle}>District</label>
//                 <select
//                   name="district"
//                   value={form.district}
//                   onChange={handleChange}
//                   style={inputStyle}
//                 >
//                   <option value="">--Please Select---</option>
//                   {(districtsByState[selectedState] || []).map((d) => (
//                     <option key={d} value={d}>
//                       {d}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label style={labelStyle}>Zip/Postal Code</label>
//                 <input
//                   name="zip"
//                   value={form.zip}
//                   onChange={handleChange}
//                   style={inputStyle}
//                 />
//               </div>
//             </div>

//             {/* Row 7: Police Station (full width) */}
//             <div>
//               <label style={labelStyle}>
//                 Local Police Station/स्थानीय पुलिस स्टेशन*
//               </label>
//               <input
//                 name="policeStation"
//                 value={form.policeStation}
//                 onChange={handleChange}
//                 style={inputStyle}
//               />
//             </div>

//             {/* Row 8: Membership Fee + Signature */}
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "1fr 1fr",
//                 gap: 24,
//                 alignItems: "start",
//               }}
//             >
//               <div>
//                 <label style={labelStyle}>
//                   Membership Fees/सदस्यता शुल्क* :
//                 </label>
//                 <input
//                   readOnly
//                   value="₹ 150/- only"
//                   style={{
//                     ...inputStyle,
//                     background: "#fff",
//                     color: "#333",
//                     fontWeight: 600,
//                     width: "auto",
//                     cursor: "default",
//                   }}
//                 />
//               </div>
//               <div>
//                 <label style={labelStyle}>
//                   Attach Signature/हस्ताक्षर संलग्न करें*
//                 </label>
//                 <input
//                   name="signature"
//                   type="file"
//                   accept="image/*"
//                   onChange={handleChange}
//                   style={{ ...inputStyle, padding: "6px 8px" }}
//                 />
//                 <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
//                   Max file size:1 MB
//                 </p>
//               </div>
//             </div>

//             {/* Checkboxes */}
//             <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
//               <label
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 8,
//                   fontSize: 14,
//                   color: "#000",
//                   cursor: "pointer",
//                 }}
//               >
//                 <input
//                   type="checkbox"
//                   name="agree1"
//                   checked={form.agree1}
//                   onChange={handleChange}
//                   style={{
//                     width: 16,
//                     height: 16,
//                     cursor: "pointer",
//                     accentColor: GREEN,
//                   }}
//                 />
//                 I have read and agree to the Terms and Conditions.{" "}
//                 <a
//                   href="#"
//                   style={{
//                     color: "#000",
//                     fontWeight: 700,
//                     textDecoration: "underline",
//                   }}
//                 >
//                   Click here to read
//                 </a>
//               </label>
//               <label
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 8,
//                   fontSize: 14,
//                   color: "#000",
//                   cursor: "pointer",
//                 }}
//               >
//                 <input
//                   type="checkbox"
//                   name="agree2"
//                   checked={form.agree2}
//                   onChange={handleChange}
//                   style={{
//                     width: 16,
//                     height: 16,
//                     cursor: "pointer",
//                     accentColor: GREEN,
//                   }}
//                 />
//                 I declare all the informations....
//               </label>
//             </div>

//             {/* Submit Button */}
//             <div style={{ textAlign: "center", marginTop: 8 }}>
//               <button
//                 onClick={() => alert("Form submitted!")}
//                 style={{
//                   background: GREEN,
//                   color: "#fff",
//                   fontWeight: 900,
//                   fontSize: 15,
//                   padding: "12px 48px",
//                   borderRadius: 4,
//                   border: "none",
//                   cursor: "pointer",
//                   letterSpacing: "0.08em",
//                 }}
//               >
//                 SUBMIT
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
import { useState } from "react";

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
  ],
};

const NAVY = "#1a2a4a";

export default function MembershipPage() {
  const [form, setForm] = useState({
    name: "",
    fatherName: "",
    mobile: "",
    email: "",
    photo: null,
    aadhar: "",
    pan: "",
    dob: "",
    address: "",
    state: "",
    district: "",
    zip: "",
    policeStation: "",
    signature: null,
    agree1: false,
    agree2: false,
  });
  const [selectedState, setSelectedState] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      setForm((p) => ({ ...p, [name]: files[0] }));
      return;
    }
    if (type === "checkbox") {
      setForm((p) => ({ ...p, [name]: checked }));
      return;
    }
    if (name === "state") {
      setSelectedState(value);
      setForm((p) => ({ ...p, state: value, district: "" }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const inp = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: 14,
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    color: "#000",
    fontFamily: "inherit",
  };
  const lbl = {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "#111",
    marginBottom: 6,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        fontFamily: "'Segoe UI','Noto Sans',sans-serif",
        color: "#000",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }

        .mem-text-wrap    { padding: 32px 40px; background: #fff; }
        .mem-main-heading { font-weight: 900; font-size: 26px; color: #1a2a4a; margin-bottom: 20px; }
        .mem-body-text    { font-size: 15px; line-height: 1.9; color: #000; }

        .mem-form-wrap    { padding: 0 40px 40px; }
        .mem-form-heading { font-weight: 900; font-size: 17px; color: #000; margin-bottom: 24px; line-height: 1.5; }
        .mem-form-box     { background: #f0f0f0; border-radius: 6px; padding: 28px 24px; }
        .mem-form-inner   { display: flex; flex-direction: column; gap: 20px; }

        .mem-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .mem-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }

        .mem-label { display: block; font-size: 14px; font-weight: 600; color: #111; margin-bottom: 6px; }
        .mem-input {
          width: 100%; padding: 10px 12px;
          border: 1px solid #ccc; border-radius: 4px;
          font-size: 14px; background: #fff; outline: none;
          box-sizing: border-box; color: #000; font-family: inherit;
        }
        .mem-input:focus { border-color: ${GREEN}; }
        .mem-file  { width: 100%; padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; background: #fff; outline: none; box-sizing: border-box; color: #000; font-family: inherit; }
        .mem-hint  { font-size: 12px; color: #555; margin-top: 4px; }

        .mem-cb-wrap  { display: flex; flex-direction: column; gap: 10px; }
        .mem-cb-label { display: flex; align-items: flex-start; gap: 8px; font-size: 14px; color: #000; cursor: pointer; line-height: 1.6; }
        .mem-cb       { width: 16px; height: 16px; cursor: pointer; accent-color: ${GREEN}; flex-shrink: 0; }

        .mem-submit-btn {
          background: ${GREEN}; color: #fff; font-weight: 900;
          font-size: 15px; padding: 12px 48px; border-radius: 4px;
          border: none; cursor: pointer; letter-spacing: 0.08em;
        }
        .mem-submit-row { text-align: center; margin-top: 6px; }

        /* ── MOBILE: same columns, just smaller ── */
        @media (max-width: 768px) {
          .mem-text-wrap    { padding: 14px 10px; }
          .mem-main-heading { font-size: 13px !important; margin-bottom: 10px !important; }
          .mem-body-text    { font-size: 8px !important; line-height: 1.6 !important; }

          .mem-form-wrap    { padding: 0 10px 20px; }
          .mem-form-heading { font-size: 8px !important; margin-bottom: 10px !important; }
          .mem-form-box     { padding: 12px 10px !important; border-radius: 3px !important; }
          .mem-form-inner   { gap: 10px !important; }

          /* Keep same columns — just smaller gap */
          .mem-grid-2 { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
          .mem-grid-3 { grid-template-columns: 1fr 1fr 1fr !important; gap: 6px !important; }

          .mem-label { font-size: 7px !important; margin-bottom: 2px !important; }
          .mem-input { padding: 4px 5px !important; font-size: 7px !important; border-radius: 2px !important; }
          .mem-file  { padding: 3px 4px !important; font-size: 6px !important; border-radius: 2px !important; }
          .mem-hint  { font-size: 6px !important; margin-top: 2px !important; }

          .mem-cb-wrap  { gap: 6px !important; }
          .mem-cb-label { font-size: 7px !important; gap: 4px !important; line-height: 1.4 !important; }
          .mem-cb       { width: 10px !important; height: 10px !important; }

          .mem-submit-btn { font-size: 8px !important; padding: 6px 20px !important; border-radius: 3px !important; }
        }
      `}</style>

      {/* ── MEMBERSHIP & BENEFITS TEXT ── */}
      <div className="mem-text-wrap">
        <h2 className="mem-main-heading">
          Membership &amp; Benefits / सदस्यता एवं सुविधाएँ
        </h2>
        <div
          style={{
            borderTop: `2px solid ${GREEN}`,
            paddingTop: 20,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* SECTION: Intro */}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 'bold', color: NAVY, marginBottom: 8 }}>JSSA Health Card Membership</h3>
            <p className="mem-body-text" style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 8, color: "#000" }}>
              The JSSA Health Card Membership is designed to connect beneficiaries with healthcare awareness programs, wellness initiatives, community outreach activities, and eligible healthcare assistance services conducted under organizational guidelines.
            </p>
            <p className="mem-body-text" style={{ fontSize: 15, lineHeight: 1.8, color: "#000" }}>
              JSSA membership aims to encourage preventive healthcare practices and promote health awareness among individuals and families.
            </p>
          </div>

          {/* SECTION: Eligibility */}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 'bold', color: NAVY, marginBottom: 12, borderBottom: `1px solid #eee`, paddingBottom: 6 }}>
              Membership Eligibility / सदस्यता पात्रता
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.8, color: "#000" }} className="mem-body-text">
                  <li>Minimum Age: 5 Years</li>
                  <li>Maximum Age: 60 Years</li>
                </ul>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.8, color: '#444' }} className="mem-body-text">
                  <li>न्यूनतम आयु: 5 वर्ष</li>
                  <li>अधिकतम आयु: 60 वर्ष</li>
                </ul>
              </div>
            </div>
            <p className="mem-body-text" style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 4, color: "#000" }}>
              Only individuals between 5 and 60 years of age are eligible for JSSA Health Card membership.
            </p>
            <p className="mem-body-text" style={{ fontSize: 15, lineHeight: 1.8, color: '#444' }}>
              केवल 5 से 60 वर्ष आयु के व्यक्ति JSSA हेल्थ कार्ड सदस्यता के लिए पात्र हैं।
            </p>
          </div>

          {/* SECTION: Fee */}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 'bold', color: NAVY, marginBottom: 12, borderBottom: `1px solid #eee`, paddingBottom: 6 }}>
              Membership Fee / सदस्यता शुल्क
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 12 }}>
              <div className="mem-body-text" style={{ flex: 1, minWidth: 200, fontSize: 15, lineHeight: 1.8, color: "#000" }}>
                <strong>Membership Contribution:</strong> ₹150<br />
                <strong>Validity:</strong> 1 Year from the date of activation
              </div>
              <div className="mem-body-text" style={{ flex: 1, minWidth: 200, fontSize: 15, lineHeight: 1.8, color: '#444' }}>
                <strong>सदस्यता शुल्क:</strong> ₹150<br />
                <strong>वैधता:</strong> सक्रियण तिथि से 1 वर्ष
              </div>
            </div>
            <p className="mem-body-text" style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 4, color: "#000" }}>
              The membership fee supports healthcare awareness activities, health camps, wellness programs, E-Clinic support, beneficiary coordination, and community outreach initiatives conducted by JSSA.
            </p>
            <p className="mem-body-text" style={{ fontSize: 15, lineHeight: 1.8, color: '#444' }}>
              यह सदस्यता शुल्क स्वास्थ्य जागरूकता कार्यक्रमों, स्वास्थ्य शिविरों, वेलनेस गतिविधियों, ई-क्लिनिक सहायता, लाभार्थी समन्वय एवं सामुदायिक जागरूकता गतिविधियों के संचालन में उपयोग किया जाता है।
            </p>
          </div>

          {/* SECTION: Benefits */}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 'bold', color: NAVY, marginBottom: 16, borderBottom: `1px solid #eee`, paddingBottom: 6 }}>
              Membership Benefits / सदस्यता लाभ
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {/* Box 1 */}
              <div style={{ background: '#f8f9fa', padding: '16px 20px', borderRadius: 8, borderLeft: `4px solid ${GREEN}` }}>
                <strong style={{ fontSize: 15, color: NAVY, display: 'block', marginBottom: 12 }}>Healthcare Awareness Programs<br /><span style={{ fontSize: 14, color: '#444' }}>स्वास्थ्य जागरूकता कार्यक्रम</span></strong>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.8, color: "#000" }} className="mem-body-text">
                  <li style={{ marginBottom: 6 }}>Health Awareness Sessions <br /><span style={{ color: '#555' }}>(स्वास्थ्य जागरूकता सत्र)</span></li>
                  <li style={{ marginBottom: 6 }}>Preventive Healthcare Education <br /><span style={{ color: '#555' }}>(निवारक स्वास्थ्य शिक्षा)</span></li>
                  <li>Public Health Campaigns <br /><span style={{ color: '#555' }}>(जन स्वास्थ्य अभियान)</span></li>
                </ul>
              </div>
              {/* Box 2 */}
              <div style={{ background: '#f8f9fa', padding: '16px 20px', borderRadius: 8, borderLeft: `4px solid ${GREEN}` }}>
                <strong style={{ fontSize: 15, color: NAVY, display: 'block', marginBottom: 12 }}>Health Camps<br /><span style={{ fontSize: 14, color: '#444' }}>स्वास्थ्य शिविर</span></strong>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.8, color: "#000" }} className="mem-body-text">
                  <li style={{ marginBottom: 6 }}>General Health Camps <br /><span style={{ color: '#555' }}>(सामान्य स्वास्थ्य शिविर)</span></li>
                  <li style={{ marginBottom: 6 }}>Eye Check-up Camps <br /><span style={{ color: '#555' }}>(नेत्र जांच शिविर)</span></li>
                  <li style={{ marginBottom: 6 }}>Wellness Camps <br /><span style={{ color: '#555' }}>(वेलनेस शिविर)</span></li>
                  <li>Community Health Activities <br /><span style={{ color: '#555' }}>(सामुदायिक स्वास्थ्य गतिविधियाँ)</span></li>
                </ul>
              </div>
              {/* Box 3 */}
              <div style={{ background: '#f8f9fa', padding: '16px 20px', borderRadius: 8, borderLeft: `4px solid ${GREEN}` }}>
                <strong style={{ fontSize: 15, color: NAVY, display: 'block', marginBottom: 12 }}>Yoga & Wellness Activities<br /><span style={{ fontSize: 14, color: '#444' }}>योग एवं वेलनेस गतिविधियाँ</span></strong>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.8, color: "#000" }} className="mem-body-text">
                  <li style={{ marginBottom: 6 }}>Yoga Camps <br /><span style={{ color: '#555' }}>(योग शिविर)</span></li>
                  <li style={{ marginBottom: 6 }}>Wellness Awareness Programs <br /><span style={{ color: '#555' }}>(वेलनेस जागरूकता कार्यक्रम)</span></li>
                  <li>Healthy Lifestyle Guidance <br /><span style={{ color: '#555' }}>(स्वस्थ जीवनशैली मार्गदर्शन)</span></li>
                </ul>
              </div>
              {/* Box 4 */}
              <div style={{ background: '#f8f9fa', padding: '16px 20px', borderRadius: 8, borderLeft: `4px solid ${GREEN}` }}>
                <strong style={{ fontSize: 15, color: NAVY, display: 'block', marginBottom: 12 }}>E-Clinic Support<br /><span style={{ fontSize: 14, color: '#444' }}>ई-क्लिनिक सहायता</span></strong>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.8, color: "#000" }} className="mem-body-text">
                  <li style={{ marginBottom: 6 }}>Basic Healthcare Guidance <br /><span style={{ color: '#555' }}>(बुनियादी स्वास्थ्य मार्गदर्शन)</span></li>
                  <li style={{ marginBottom: 6 }}>Healthcare Coordination Support <br /><span style={{ color: '#555' }}>(स्वास्थ्य समन्वय सहायता)</span></li>
                  <li>Beneficiary Assistance <br /><span style={{ color: '#555' }}>(लाभार्थी सहायता)</span></li>
                </ul>
              </div>
            </div>
          </div>

          {/* SECTION: Claim Assistance */}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 'bold', color: NAVY, marginBottom: 12, borderBottom: `1px solid #eee`, paddingBottom: 6 }}>
              Claim Assistance Eligibility / दावा सहायता पात्रता
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              <div style={{ flex: 1, minWidth: 250 }}>
                <p className="mem-body-text" style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 8, color: "#000" }}>
                  Eligible beneficiaries may apply for healthcare assistance as per JSSA Claim Policy, subject to:
                </p>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.8, color: "#000" }} className="mem-body-text">
                  <li>Eligibility Verification</li>
                  <li>Document Verification</li>
                  <li>Medical Assessment</li>
                  <li>Organizational Guidelines</li>
                  <li>Management Approval</li>
                </ul>
              </div>
              <div style={{ flex: 1, minWidth: 250 }}>
                <p className="mem-body-text" style={{ fontSize: 15, lineHeight: 1.8, color: '#444', marginBottom: 8 }}>
                  पात्र लाभार्थी JSSA दावा नीति के अनुसार सहायता हेतु आवेदन कर सकते हैं, जो निम्न के अधीन होगी:
                </p>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.8, color: '#444' }} className="mem-body-text">
                  <li>पात्रता सत्यापन</li>
                  <li>दस्तावेज सत्यापन</li>
                  <li>चिकित्सा मूल्यांकन</li>
                  <li>संगठनात्मक दिशा-निर्देश</li>
                  <li>प्रबंधन स्वीकृति</li>
                </ul>
              </div>
            </div>
          </div>

          {/* SECTION: Special Assistance */}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 'bold', color: NAVY, marginBottom: 12, borderBottom: `1px solid #eee`, paddingBottom: 6 }}>
              Special Assistance Provision / विशेष सहायता प्रावधान
            </h3>
            <p className="mem-body-text" style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 4, color: "#000" }}>
              In deserving cases involving EWS, BPL, financial hardship, or critical medical situations, additional assistance may be considered subject to verification and approval.
            </p>
            <p className="mem-body-text" style={{ fontSize: 15, lineHeight: 1.8, color: '#444' }}>
              EWS, BPL, आर्थिक रूप से कमजोर अथवा गंभीर चिकित्सा परिस्थितियों वाले मामलों में सत्यापन एवं स्वीकृति के उपरांत अतिरिक्त सहायता पर विचार किया जा सकता है।
            </p>
          </div>

          {/* SECTION: Important Note */}
          <div style={{ background: '#fff3cd', borderLeft: '4px solid #ffc107', padding: '20px 24px', borderRadius: 8 }}>
            <h3 style={{ fontSize: 18, fontWeight: 'bold', color: '#856404', margin: '0 0 12px 0' }}>
              Important Note / महत्वपूर्ण सूचना
            </h3>
            <p className="mem-body-text" style={{ fontSize: 14, lineHeight: 1.8, color: '#856404', marginBottom: 12 }}>
              The JSSA Health Card is a welfare-support membership facility and not an insurance policy.<br />
              Membership does not guarantee claim approval, financial assistance, or any specific benefit. All assistance and services are subject to applicable policies, eligibility criteria, document verification, operational guidelines, and management approval.
            </p>
            <p className="mem-body-text" style={{ fontSize: 14, lineHeight: 1.8, color: '#856404', marginBottom: 0 }}>
              JSSA हेल्थ कार्ड एक जनकल्याणकारी सदस्यता सुविधा है, यह कोई बीमा पॉलिसी नहीं है।<br />
              सदस्यता प्राप्त होने मात्र से दावा स्वीकृति, वित्तीय सहायता या किसी विशेष लाभ की गारंटी नहीं मिलती। सभी सहायता एवं सेवाएँ संगठन की नीतियों, पात्रता मानदंडों, दस्तावेज सत्यापन, संचालन दिशा-निर्देशों एवं प्रबंधन स्वीकृति के अधीन होंगी।
            </p>
          </div>

        </div>
      </div>


    </div>
  );
}
