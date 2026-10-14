import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../../auth/auth";
import { useAuth } from "../../auth/AuthProvider";

import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  CreditCard,
  LogOut
} from "lucide-react";
import { employeesAPI, administrativeStaffAPI, uploadAPI } from "../../utils/api";
import indianStates from "../../data/states.json";
import indianDistricts from "../../data/district.json";

const GREEN = "#0aca00";

const INDIAN_BANKS = [
  "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Punjab National Bank",
  "Bank of Baroda", "Canara Bank", "Union Bank of India", "Bank of India", "Indian Bank",
  "Central Bank of India", "IDBI Bank", "Kotak Mahindra Bank", "IndusInd Bank", "Federal Bank",
  "Yes Bank", "UCO Bank", "Bank of Maharashtra", "Punjab & Sind Bank", "Indian Overseas Bank",
  "RBL Bank", "South Indian Bank", "Bandhan Bank", "IDFC First Bank", "City Union Bank",
  "Karur Vysya Bank", "Jammu & Kashmir Bank", "Karnataka Bank", "Dhanlaxmi Bank",
  "Tamilnad Mercantile Bank", "Nainital Bank", "Kerala Gramin Bank", "Airtel Payments Bank",
  "Paytm Payments Bank", "Fino Payments Bank", "India Post Payments Bank", "Jio Payments Bank",
  "NSDL Payments Bank", "AU Small Finance Bank", "Equitas Small Finance Bank", "Suryoday Small Finance Bank",
  "Ujjivan Small Finance Bank", "ESAF Small Finance Bank", "Utkarsh Small Finance Bank",
  "North East Small Finance Bank", "Jana Small Finance Bank", "Capital Small Finance Bank",
  "Shivalik Small Finance Bank", "Unity Small Finance Bank", "Bihar Gramin Bank",
  "Uttar Bihar Gramin Bank", "Madhyanchal Gramin Bank", "Prathama UP Gramin Bank",
  "Aryavart Bank", "Baroda Gujarat Gramin Bank", "Baroda Rajasthan Kshetriya Gramin Bank",
  "Jharkhand Rajya Gramin Bank", "Karnataka Vikas Grameena Bank", "Andhra Pragathi Grameena Bank",
  "Saurashtra Gramin Bank", "Tripura Gramin Bank", "Nagaland Rural Bank", "Assam Gramin Vikash Bank"
].sort();

// ── Same helpers as MOUForm ──
const TableRow = ({ labelEn, labelHi, valueEn, valueHi }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 border-b border-[#5cb87a] bg-[#c2fbd7]">
    <div className="grid grid-cols-[160px_28px_1fr] border-b md:border-b-0 md:border-r border-[#5cb87a]">
      <div className="p-3 font-semibold text-sm bg-[#c2fbd7] border-r border-[#5cb87a] flex items-center">{labelEn}</div>
      <div className="p-3 text-sm flex items-center justify-center bg-[#9ddfaf] border-r border-[#5cb87a]">:</div>
      <div className="p-3 text-sm bg-[#c2fbd7] flex items-center font-bold">{valueEn || "—"}</div>
    </div>
    <div className="grid grid-cols-[160px_28px_1fr]">
      <div className="p-3 font-semibold text-sm bg-[#c2fbd7] border-r border-[#5cb87a] flex items-center">{labelHi}</div>
      <div className="p-3 text-sm flex items-center justify-center bg-[#9ddfaf] border-r border-[#5cb87a]">:</div>
      <div className="p-3 text-sm bg-[#c2fbd7] flex items-center font-bold">{valueHi || "—"}</div>
    </div>
  </div>
);

const FormSectionHeader = ({ en, hi }) => (
  <div className="border-b-2 border-gray-300 mb-6 pb-2 mt-12">
    <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">
      {en} <span className="text-gray-400 mx-2">/</span> <span className="font-bold">{hi}</span>
    </h2>
  </div>
);

const FormLabel = ({ en, hi, required }) => (
  <label className="text-[13px] font-bold text-gray-600 block mb-1">
    {en} <span className="text-gray-400">/</span> {hi} : {required && <span className="text-red-500">*</span>}
  </label>
);

const FormInput = ({ type = "text", value, readOnly, placeholder, onChange, className = "" }) => (
  <input
    type={type}
    value={value || ""}
    readOnly={readOnly}
    placeholder={placeholder}
    onChange={onChange}
    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm ${readOnly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""} ${className}`}
  />
);

const FormSelect = ({ value, options, onChange, placeholder = "--Please Select--", disabled }) => (
  <select
    value={value || ""}
    onChange={onChange}
    disabled={disabled}
    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm ${disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
  >
    <option value="">{placeholder}</option>
    {options.map((opt, i) => (
      <option key={i} value={typeof opt === "string" ? opt : opt.value}>
        {typeof opt === "string" ? opt : opt.label}
      </option>
    ))}
  </select>
);

// ── Main Component ──
const EmployeeOnboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employee, setEmployee] = useState(null);
  const { role } = useAuth();
  const api = role === "employee" ? employeesAPI : administrativeStaffAPI;
  const [isOpenLang, setIsOpenLang] = useState(false);

  const [states, setStates] = useState(indianStates.states || indianStates);
  const [districts, setDistricts] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(null);

  const [currentEdu, setCurrentEdu] = useState({ level: "", board: "", year: "", percentage: "", file: null, isOther: false });

  const [formData, setFormData] = useState({
    motherName: "", panNumber: "", aadharNumber: "",
    nationality: "indian", maritalStatus: "Unmarried",
    handicapDisability: "No", language: "Hindi, English", bloodGroup: "",
    country: "India / भारत", state: "", district: "",
    blockKhand: "", gramPanchayat: "", villageTola: "",
    wardNo: "", post: "", policeStation: "", pincode: "",
    educationDetails: [],
    accountHolderName: "", bankName: "", accountNumber: "", ifscCode: "", branchName: "",
    nomineeName: "", nomineeRelation: "", nomineeAge: "",
    nomineeAadhar: "", nomineeMobile: "", nomineeEmail: "",
    aadharFront: null, aadharBack: null, panCard: null, bankDoc: null,
    photo: null, signature: null,
    agreeToTerms: false, docsVerified: false
  });

  // Fetch employee profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getMe();
        if (res.success && res.data) {
          setEmployee(res.data);
          setFormData(prev => ({ ...prev, accountHolderName: res.data.name || "" }));
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleStateChange = (e) => {
    const s = e.target.value;
    setFormData(prev => ({ ...prev, state: s, district: "", blockKhand: "", gramPanchayat: "" }));
    setDistricts(Object.keys(indianDistricts[s] || indianDistricts).includes(s)
      ? Object.keys(indianDistricts[s]) : indianDistricts[s] || []);
  };

  const handleDistrictChange = (e) => {
    setFormData(prev => ({ ...prev, district: e.target.value, blockKhand: "", gramPanchayat: "" }));
  };

  const handleDocUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDoc(type);
    try {
      const res = await uploadAPI.uploadMOUDucument(file, type);
      if (res.success) {
        setFormData(prev => ({ ...prev, [type]: res.data.url }));
      } else {
        alert(res.error || "Upload failed");
      }
    } catch (err) {
      alert("Upload error");
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleEduDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDoc("edu_file");
    try {
      const res = await uploadAPI.uploadMOUDucument(file, "marksheet");
      if (res.success) {
        setCurrentEdu((prev) => ({ ...prev, file: res.data.url, fileName: file.name }));
      } else {
        alert(res.error || "Upload failed");
      }
    } catch (err) {
      alert("Upload error");
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSaveEducation = () => {
    if (!currentEdu.level || !currentEdu.board || !currentEdu.year || !currentEdu.percentage) {
      alert("Please fill all qualification fields");
      return;
    }
    setFormData(prev => ({ ...prev, educationDetails: [...prev.educationDetails, { ...currentEdu }] }));
    setCurrentEdu({ level: "", board: "", year: "", percentage: "", file: null, fileName: "", isOther: false });
  };

  const removeEducationRow = (idx) => {
    setFormData(prev => ({ ...prev, educationDetails: prev.educationDetails.filter((_, i) => i !== idx) }));
  };

  const handleComplete = async () => {
    // 1. Validate Required Fields
    const requiredFields = [
      { key: "motherName", label: "Mother's Name" },
      { key: "panNumber", label: "PAN Number" },
      { key: "aadharNumber", label: "Aadhar Number" },
      { key: "country", label: "Country" },
      { key: "state", label: "State" },
      { key: "district", label: "District" },
      { key: "blockKhand", label: "Block / Khand / प्रखंड" },
      { key: "gramPanchayat", label: "Gram Panchayat" },
      { key: "villageTola", label: "At / Village / Tola" },
      { key: "wardNo", label: "Ward No" },
      { key: "post", label: "Post" },
      { key: "policeStation", label: "Police Station" },
      { key: "pincode", label: "PIN Code" },
      { key: "handicapDisability", label: "Handicap/Disability" },
      { key: "maritalStatus", label: "Marital Status" },
      { key: "language", label: "Language Known" },
      { key: "bloodGroup", label: "Blood Group" },
      { key: "nomineeName", label: "Nominee Name" },
      { key: "nomineeRelation", label: "Nominee Relationship" },
      { key: "nomineeAge", label: "Nominee Age" },
      { key: "nomineeAadhar", label: "Nominee Aadhar No" },
      { key: "nomineeMobile", label: "Nominee Mobile" },
      { key: "nomineeEmail", label: "Nominee Email" },
      { key: "accountHolderName", label: "Account Holder Name" },
      { key: "bankName", label: "Bank Name" },
      { key: "accountNumber", label: "Account Number" },
      { key: "ifscCode", label: "IFSC Code" },
      { key: "branchName", label: "Branch Name" },
      { key: "photo", label: "Passport Photo (Upload)" },
      { key: "signature", label: "Signature (Upload)" },
      { key: "aadharFront", label: "Aadhaar Card Front (Upload)" },
      { key: "aadharBack", label: "Aadhaar Card Back (Upload)" },
      { key: "panCard", label: "PAN Card (Upload)" },
      { key: "bankDoc", label: "Cancelled Cheque / Passbook (Upload)" }
    ];

    const missingFields = requiredFields.filter(field => !formData[field.key] || String(formData[field.key]).trim() === "");

    if (missingFields.length > 0) {
      alert(`Please fill the following required fields before submitting:\n\n- ${missingFields.map(f => f.label).join("\n- ")}`);
      return;
    }

    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      alert("Please enter a valid PAN Number format (e.g., ABCDE1234F).");
      return;
    }

    if (!formData.agreeToTerms) { 
      alert("Please agree to the declaration checkbox at the bottom."); 
      return; 
    }

    setIsSubmitting(true);
    try {
      const res = await api.completeOnboarding(formData);
      if (res.success) {
        window.location.href = "/dashboard";
      } else {
        alert(res.error || "Failed to complete onboarding.");
      }
    } catch (err) {
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const jp = employee?.jobPostingId;
  const jr = employee?.jobRoleId;
  const advtNo = jp?.advtNo || "STAFF";
  const postEn = jp?.post?.en || jp?.title || jr?.jobTitle || "N/A";
  const postHi = jp?.post?.hi || postEn;
  const recruitmentTitle = jp 
    ? `Recruitment for the Post of ${postEn} Advt. No. ${advtNo} / ${postHi} पद हेतु भर्ती विज्ञप्ति संख्या: ${advtNo}`
    : `Staff Activation: ${postEn} / कर्मचारी सक्रियण: ${postHi}`;
  const joinDate = new Date().toLocaleDateString("en-IN");

  if (loading) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top bar — Logout only, no sidebar */}
      <div className="bg-[#0aca00] px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white font-black text-xs">JSSA</span>
          </div>
          <span className="text-white font-black text-sm uppercase tracking-wide">Employee Activation Form</span>
        </div>
        <button onClick={() => { clearSession(); navigate('/login', { replace: true }); }}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/40 text-white px-3 py-1.5 rounded text-xs font-black uppercase transition-all">
          <LogOut size={14} /> Logout
        </button>
      </div>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 bg-white min-h-screen">

        {/* ── Full Recruitment Advertisement Table (same as MOUForm) ── */}
        <div className="border border-[#5cb87a] rounded overflow-hidden shadow-sm">
          {/* Title Bar */}
          <div className="bg-[#c2fbd7] p-3 text-center border-b border-[#a0d9a0] font-bold text-sm text-black leading-relaxed">
            {recruitmentTitle}
          </div>

          {/* Advt & Date Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-[#5cb87a] border-b-2 border-green-500 bg-[#9ddfaf]">
            <div className="p-4 text-center">
              <div className="font-black text-xs text-black mb-1 uppercase tracking-tighter">Advt No: {advtNo}</div>
              <div className="flex justify-center gap-4 text-[11px] font-black text-black">
                <div className="bg-white/50 px-2 py-0.5 rounded border border-green-200">START: {jp?.applicationOpeningDate || joinDate}</div>
                <div className="bg-white/50 px-2 py-0.5 rounded border border-green-200">END: {jp?.lastDate || "N/A"}</div>
              </div>
            </div>
            <div className="p-4 text-center">
              <div className="font-black text-xs text-black mb-1 uppercase tracking-tighter">विज्ञापन संख्या: {advtNo}</div>
              <div className="flex justify-center gap-4 text-[11px] font-black text-black">
                <div className="bg-white/50 px-2 py-0.5 rounded border border-green-200">प्रारंभ तिथि: {jp?.applicationOpeningDate || joinDate}</div>
                <div className="bg-white/50 px-2 py-0.5 rounded border border-green-200">अंतिम तिथि: {jp?.lastDate || "N/A"}</div>
              </div>
            </div>
          </div>

          <TableRow labelEn="Post" labelHi="पद" valueEn={postEn} valueHi={postHi} />
          <TableRow
            labelEn="Income / Salary" labelHi="आय / वेतन"
            valueEn={jp?.income?.en || "As per organization policy"}
            valueHi={jp?.income?.hi || "संगठन नीति अनुसार"}
          />
          <TableRow
            labelEn="Educational Qualification" labelHi="शैक्षिक योग्यता"
            valueEn={jp?.education?.en || "As per advertisement"}
            valueHi={jp?.education?.hi || "विज्ञापन अनुसार"}
          />
          <TableRow
            labelEn="Age Limit" labelHi="आयु सीमा"
            valueEn={jp?.ageLimit?.en || "18–40 years"}
            valueHi={jp?.ageLimit?.hi || "18–40 वर्ष"}
          />
          <TableRow
            labelEn="Work Location" labelHi="कार्य स्थान"
            valueEn={jp?.location?.en || "As per posting"}
            valueHi={jp?.location?.hi || "पोस्टिंग अनुसार"}
          />
          {jp?.selectionProcess?.en && (
            <TableRow
              labelEn="Selection Process" labelHi="चयन प्रक्रिया"
              valueEn={jp.selectionProcess.en}
              valueHi={jp.selectionProcess.hi || jp.selectionProcess.en}
            />
          )}
          <TableRow
            labelEn="Employee Name" labelHi="कर्मचारी का नाम"
            valueEn={employee?.name} valueHi={employee?.name}
          />
          <TableRow
            labelEn="Father's Name" labelHi="पिता का नाम"
            valueEn={employee?.fatherName} valueHi={employee?.fatherName}
          />
        </div>

        {/* ── Form Content (same bg as MOUForm) ── */}
        <div className="bg-[#f5f5f5] p-6 rounded-lg border border-gray-200">
          <div className="text-center mb-8">
            <p className="text-[11px] font-semibold text-gray-500 mb-1">
              Employee Activation Form — Post of {postEn} / {postHi} — Jan Swasthya Sahayata Abhiyan
            </p>
          </div>

          {/* 1. PERSONAL DETAILS */}
          <FormSectionHeader en="PERSONAL DETAILS" hi="व्यक्तिगत विवरण" />
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <FormLabel en="Applicant's Name" hi="अभ्यर्थी का नाम" />
                <FormInput value={employee?.name} readOnly />
              </div>
              <div>
                <FormLabel en="Father's/Husband Name" hi="पिता/पति का नाम" />
                <FormInput value={employee?.fatherName} readOnly />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <FormLabel en="Mother's Name" hi="माता का नाम" required />
                <FormInput value={formData.motherName} onChange={(e) => setFormData({ ...formData, motherName: e.target.value })} />
              </div>
              <div>
                <FormLabel en="Date Of Birth" hi="जन्मतिथि" />
                <FormInput
                  type="date"
                  value={employee?.dob ? new Date(employee.dob).toISOString().split('T')[0] : ""}
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <FormLabel en="Mobile Number" hi="मोबाइल नंबर" />
                <FormInput value={employee?.mobile} readOnly />
              </div>
              <div>
                <FormLabel en="Email ID" hi="ईमेल आईडी" />
                <FormInput value={employee?.email} readOnly />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <FormLabel en="Aadhar Number" hi="आधार संख्या" required />
                <FormInput
                  value={formData.aadharNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 12) setFormData({ ...formData, aadharNumber: val });
                  }}
                  placeholder="12 Digit Aadhaar Number"
                />
              </div>
              <div>
                <FormLabel en="PAN Number" hi="पैन संख्या" required />
                <FormInput
                  value={formData.panNumber}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    if (val.length <= 10) setFormData({ ...formData, panNumber: val });
                  }}
                  placeholder="ABCDE1234F"
                  className={formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber) ? "border-red-500 bg-red-50" : ""}
                />
                {formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber) && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">Invalid PAN Card format</p>
                )}
              </div>
            </div>

            {/* Photo & Signature */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Photo */}
              <div>
                <FormLabel en="Passport Photo" hi="पासपोर्ट फोटो" required />
                <div className="flex items-center gap-2">
                  <input type="file" id="photo" className="hidden" onChange={(e) => handleDocUpload(e, "photo")} accept="image/*" />
                  <label htmlFor="photo" className={`flex-1 flex items-center gap-2 p-1 border border-dashed rounded cursor-pointer transition-all ${formData.photo ? 'bg-green-50 border-green-500' : 'bg-white border-gray-300 hover:border-green-500'}`}>
                    {formData.photo && (
                      <div className="w-10 h-10 rounded border overflow-hidden shrink-0 bg-white shadow-sm">
                        <img src={formData.photo} className="w-full h-full object-cover" alt="Preview" />
                      </div>
                    )}
                    <span className="text-xs font-bold text-gray-500 flex-1 text-center truncate">
                      {uploadingDoc === "photo" ? "Uploading..." : (formData.photo ? "Uploaded ✅ Change?" : "Choose File")}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">✔ JPG, PNG (White Background)</p>
              </div>

              {/* Signature */}
              <div>
                <FormLabel en="Signature" hi="हस्ताक्षर" required />
                <div className="flex items-center gap-2">
                  <input type="file" id="signature" className="hidden" onChange={(e) => handleDocUpload(e, "signature")} accept="image/*" />
                  <label htmlFor="signature" className={`flex-1 flex items-center gap-2 p-1 border border-dashed rounded cursor-pointer transition-all ${formData.signature ? 'bg-green-50 border-green-500' : 'bg-white border-gray-300 hover:border-green-500'}`}>
                    {formData.signature && (
                      <div className="w-10 h-10 rounded border overflow-hidden shrink-0 bg-white shadow-sm">
                        <img src={formData.signature} className="w-full h-full object-contain p-1" alt="Preview" />
                      </div>
                    )}
                    <span className="text-xs font-bold text-gray-500 flex-1 text-center truncate">
                      {uploadingDoc === "signature" ? "Uploading..." : (formData.signature ? "Uploaded ✅ Change?" : "Choose File")}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">✔ Sign on White Paper & Upload</p>
              </div>

              {/* Aadhaar Front */}
              <div>
                <FormLabel en="Aadhaar Card (Front Side)" hi="आधार कार्ड (सामने का हिस्सा)" required />
                <div className="flex items-center gap-2">
                  <input type="file" id="aadharFront" className="hidden" onChange={(e) => handleDocUpload(e, "aadharFront")} accept="image/*,.pdf" />
                  <label htmlFor="aadharFront" className={`flex-1 flex items-center gap-2 p-1 border border-dashed rounded cursor-pointer transition-all ${formData.aadharFront ? 'bg-green-50 border-green-500' : 'bg-white border-gray-300 hover:border-green-500'}`}>
                    {formData.aadharFront && (
                      <div className="w-10 h-10 rounded border overflow-hidden shrink-0 bg-white shadow-sm">
                        {formData.aadharFront.toLowerCase().endsWith('.pdf') ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500">
                            <FileText className="w-4 h-4" /><span className="text-[7px] font-black">PDF</span>
                          </div>
                        ) : (
                          <img src={formData.aadharFront} className="w-full h-full object-cover" alt="Preview" />
                        )}
                      </div>
                    )}
                    <span className="text-xs font-bold text-gray-500 flex-1 text-center truncate">
                      {uploadingDoc === "aadharFront" ? "Uploading..." : (formData.aadharFront ? "Verified ✅ Change?" : "Choose File")}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">✔ JPG, PNG, PDF (High Quality)</p>
              </div>
            </div>

            {/* Aadhaar Back + PAN Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <FormLabel en="Aadhaar Card (Back Side)" hi="आधार कार्ड (पीछे का हिस्सा)" required />
                <div className="flex items-center gap-2">
                  <input type="file" id="aadharBack" className="hidden" onChange={(e) => handleDocUpload(e, "aadharBack")} accept="image/*,.pdf" />
                  <label htmlFor="aadharBack" className={`flex-1 flex items-center gap-2 p-1 border border-dashed rounded cursor-pointer transition-all ${formData.aadharBack ? 'bg-green-50 border-green-500' : 'bg-white border-gray-300 hover:border-green-500'}`}>
                    {formData.aadharBack && (
                      <div className="w-10 h-10 rounded border overflow-hidden shrink-0 bg-white shadow-sm">
                        {formData.aadharBack.toLowerCase().endsWith('.pdf') ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500"><FileText className="w-4 h-4" /><span className="text-[7px] font-black">PDF</span></div>
                        ) : (
                          <img src={formData.aadharBack} className="w-full h-full object-cover" alt="Preview" />
                        )}
                      </div>
                    )}
                    <span className="text-xs font-bold text-gray-500 flex-1 text-center truncate">
                      {uploadingDoc === "aadharBack" ? "Uploading..." : (formData.aadharBack ? "Verified ✅ Change?" : "Choose File")}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">✔ JPG, PNG, PDF (High Quality)</p>
              </div>
              <div>
                <FormLabel en="PAN Card" hi="पैन कार्ड" required />
                <div className="flex items-center gap-2">
                  <input type="file" id="panCard" className="hidden" onChange={(e) => handleDocUpload(e, "panCard")} accept="image/*,.pdf" />
                  <label htmlFor="panCard" className={`flex-1 flex items-center gap-2 p-1 border border-dashed rounded cursor-pointer transition-all ${formData.panCard ? 'bg-green-50 border-green-500' : 'bg-white border-gray-300 hover:border-green-500'}`}>
                    {formData.panCard && (
                      <div className="w-10 h-10 rounded border overflow-hidden shrink-0 bg-white shadow-sm">
                        {formData.panCard.toLowerCase().endsWith('.pdf') ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500"><FileText className="w-4 h-4" /><span className="text-[7px] font-black">PDF</span></div>
                        ) : (
                          <img src={formData.panCard} className="w-full h-full object-cover" alt="Preview" />
                        )}
                      </div>
                    )}
                    <span className="text-xs font-bold text-gray-500 flex-1 text-center truncate">
                      {uploadingDoc === "panCard" ? "Uploading..." : (formData.panCard ? "Verified ✅ Change?" : "Choose File")}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">✔ JPG, PNG, PDF (High Quality)</p>
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div>
                <FormLabel en="Country" hi="देश" required />
                <FormInput value={formData.country} readOnly />
              </div>
              <div>
                <FormLabel en="State" hi="राज्य" required />
                <FormSelect value={formData.state} onChange={handleStateChange} options={states} placeholder="--Please Select--" />
              </div>
              <div>
                <FormLabel en="District" hi="जिला" required />
                <FormSelect value={formData.district} onChange={handleDistrictChange} options={districts} placeholder="--Please Select--" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <FormLabel en="Block / Khand / प्रखंड :" required />
                <FormInput value={formData.blockKhand} onChange={(e) => setFormData({ ...formData, blockKhand: e.target.value })} placeholder="Type Block Name..." />
              </div>
              <div>
                <FormLabel en="Gram Panchayat / ग्राम पंचायत :" required />
                <FormInput value={formData.gramPanchayat} onChange={(e) => setFormData({ ...formData, gramPanchayat: e.target.value })} placeholder="Type Panchayat Name..." />
              </div>
              <div>
                <FormLabel en="Post" hi="डाकघर" required />
                <FormInput value={formData.post} onChange={(e) => setFormData({ ...formData, post: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <FormLabel en="At / Village / Tola" hi="ग्राम / टोला" required />
                <FormInput value={formData.villageTola} onChange={(e) => setFormData({ ...formData, villageTola: e.target.value })} />
              </div>
              <div>
                <FormLabel en="Ward No" hi="वार्ड संख्या" required />
                <FormInput value={formData.wardNo} onChange={(e) => setFormData({ ...formData, wardNo: e.target.value })} />
              </div>
              <div>
                <FormLabel en="Police Station (PS)" hi="थाना" required />
                <FormInput value={formData.policeStation} onChange={(e) => setFormData({ ...formData, policeStation: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FormLabel en="PIN Code" hi="पिन कोड" required />
                <FormInput value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} />
              </div>
            </div>
          </div>

          {/* 2. EDUCATION DETAILS */}
          <FormSectionHeader en="EDUCATION & OTHER DETAILS" hi="शिक्षा एवं अन्य विवरण" />

          {formData.educationDetails.length > 0 && (
            <div className="mb-6 border border-[#5cb87a] rounded overflow-hidden shadow-sm">
              <div className="bg-[#9ddfaf] text-black p-3 text-center font-extrabold text-sm flex items-center justify-center gap-4 border-b border-[#5cb87a]">
                <span>🎓 SAVED QUALIFICATIONS / शैक्षिक योग्यता विवरण 🎓</span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#9ddfaf] text-black uppercase text-[11px] font-black">
                  <tr className="border-b border-[#5cb87a]">
                    <th className="px-4 py-3 border-r border-[#5cb87a]">Qualification / योग्यता</th>
                    <th className="px-4 py-3 border-r border-[#5cb87a]">Board / University / बोर्ड</th>
                    <th className="px-4 py-3 border-r border-[#5cb87a] text-center">Passing Year / उत्तीर्ण वर्ष</th>
                    <th className="px-4 py-3 border-r border-[#5cb87a] text-center">Marks / अंक (%)</th>
                    <th className="px-4 py-3 border-r border-[#5cb87a] text-center">Marksheet / मार्कशीट</th>
                    <th className="px-4 py-3 text-center">Action / कार्य</th>
                  </tr>
                </thead>
                <tbody className="bg-[#c2fbd7] text-black divide-y divide-[#5cb87a]">
                  {formData.educationDetails.map((edu, idx) => (
                    <tr key={idx} className="hover:bg-[#9ddfaf]/30 transition-colors">
                      <td className="px-4 py-3 border-r border-[#5cb87a] font-bold text-[13px]">{edu.level}</td>
                      <td className="px-4 py-3 border-r border-[#5cb87a] font-medium text-[13px]">{edu.board}</td>
                      <td className="px-4 py-3 border-r border-[#5cb87a] text-center font-bold text-[13px]">{edu.year}</td>
                      <td className="px-4 py-3 border-r border-[#5cb87a] text-center font-black text-[13px]">{edu.percentage}%</td>
                      <td className="px-4 py-3 border-r border-[#5cb87a] text-center">
                        {edu.file ? (
                          <a href={edu.file} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 underline font-black text-[11px] flex flex-col items-center justify-center">
                            <FileText className="w-3 h-3 mb-0.5" /> View
                          </a>
                        ) : (
                          <span className="text-gray-400 text-[10px] font-bold">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => removeEducationRow(idx)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all border border-red-200">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Education Input Row */}
          <div className="border border-[#5cb87a] bg-white rounded overflow-hidden shadow-sm mb-10">
            <div className="p-3 bg-[#9ddfaf] border-b border-[#5cb87a] flex justify-between items-center">
              <h4 className="text-[12px] font-black text-black flex items-center gap-2 uppercase tracking-widest">
                <Plus className="w-5 h-5 bg-white p-1 rounded-full border border-[#5cb87a]" />
                ADD NEW QUALIFICATION / नई योग्यता जोड़ें
              </h4>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start bg-[#c2fbd7]/30">
              <div className="md:col-span-3">
                <FormLabel en="Qualification / योग्यता :" required />
                <FormSelect
                  value={["10th", "12th", "Graduation"].includes(currentEdu.level) ? currentEdu.level : (currentEdu.level ? "Other" : "")}
                  options={["10th", "12th", "Graduation", "Other"]}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Other") setCurrentEdu({ ...currentEdu, level: "", isOther: true });
                    else setCurrentEdu({ ...currentEdu, level: val, isOther: false });
                  }}
                />
                {currentEdu.isOther && (
                  <div className="mt-2">
                    <FormInput placeholder="Type degree..." value={currentEdu.level} onChange={(e) => setCurrentEdu({ ...currentEdu, level: e.target.value })} />
                  </div>
                )}
              </div>
              <div className="md:col-span-3">
                <FormLabel en="Board/University / बोर्ड/विश्वविद्यालय :" required />
                <FormInput value={currentEdu.board} onChange={(e) => setCurrentEdu({ ...currentEdu, board: e.target.value })} placeholder="e.g. CBSE / Delhi University" />
              </div>
              <div className="md:col-span-2">
                <FormLabel en="Passing Year" hi="उत्तीर्ण वर्ष" required />
                <FormInput type="number" value={currentEdu.year} onChange={(e) => { if (e.target.value.length <= 4) setCurrentEdu({ ...currentEdu, year: e.target.value }); }} placeholder="YYYY" />
              </div>
              <div className="md:col-span-2">
                <FormLabel en="Marks (%)" hi="अंक (%)" required />
                <FormInput type="number" value={currentEdu.percentage} onChange={(e) => { const v = e.target.value; if (!v || (parseFloat(v) >= 0 && parseFloat(v) <= 100)) setCurrentEdu({ ...currentEdu, percentage: v }); }} placeholder="%" />
              </div>
              <div className="md:col-span-2">
                <FormLabel en="Marksheet" hi="मार्कशीट" />
                <div className="relative">
                  <input type="file" id="edu_file" className="hidden" onChange={handleEduDocUpload} accept="image/*,.pdf" />
                  <label htmlFor="edu_file" className="flex flex-col items-center justify-center p-2 border border-[#5cb87a] rounded bg-white hover:bg-green-50 cursor-pointer transition-all h-[42px]">
                    <div className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                      {uploadingDoc === "edu_file" ? "Uploading..." : currentEdu.file ? <span className="text-green-800 truncate max-w-[100px]">{currentEdu.fileName || "Uploaded ✅"}</span> : <>Choose File</>}
                    </div>
                  </label>
                  <div className="text-[9px] text-gray-700 mt-1 uppercase font-bold tracking-tighter">PDF/JPG (High Quality)</div>
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 border-t border-[#5cb87a] flex justify-end">
              <button type="button" onClick={handleSaveEducation}
                className="flex items-center gap-2 px-12 py-2.5 bg-[#0aca00] text-white rounded border border-[#5cb87a] hover:bg-[#08a000] shadow shadow-green-100 transition-all font-black text-sm uppercase tracking-widest transform active:scale-95">
                <Plus className="w-4 h-4" /> ADD
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <FormLabel en="Handicap / Disability" hi="विकलांगता" required />
              <FormSelect value={formData.handicapDisability} onChange={(e) => setFormData({ ...formData, handicapDisability: e.target.value })} options={["No", "Yes (Orthopedic)", "Yes (Visual)", "Yes (Hearing)", "Yes (Other)"]} />
            </div>
            <div>
              <FormLabel en="Marital Status" hi="वैवाहिक स्थिति" required />
              <FormSelect value={formData.maritalStatus} onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })} options={["Unmarried", "Married", "Widowed", "Divorced"]} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div className="relative">
              <FormLabel en="Language Known" hi="ज्ञात भाषाएं" required />
              <button type="button" onClick={() => setIsOpenLang(!isOpenLang)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm min-h-[42px]">
                <div className="flex flex-wrap gap-1">
                  {formData.language ? formData.language.split(", ").map(l => (
                    <span key={l} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-normal border border-green-200">{l}</span>
                  )) : <span className="text-gray-400">--Select Languages--</span>}
                </div>
                <Plus className={`w-4 h-4 text-gray-400 transition-transform ${isOpenLang ? "rotate-45" : ""}`} />
              </button>
              {isOpenLang && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsOpenLang(false)}></div>
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2">
                    <div className="grid grid-cols-2 gap-1">
                      {["Hindi", "English", "Sanskrit", "Bhojpuri", "Bengali", "Maithili", "Odia", "Other"].map(lang => {
                        const isSelected = formData.language?.split(", ").includes(lang);
                        return (
                          <label key={lang} className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-green-50" : "hover:bg-gray-50"}`}>
                            <input type="checkbox" className="accent-green-600" checked={isSelected}
                              onChange={() => {
                                const current = formData.language ? formData.language.split(", ").filter(l => l) : [];
                                const updated = isSelected ? current.filter(l => l !== lang) : [...current, lang];
                                setFormData({ ...formData, language: updated.join(", ") });
                              }} />
                            <span className={`text-xs font-bold ${isSelected ? "text-green-700" : "text-gray-600"}`}>{lang}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div>
              <FormLabel en="Blood Group" hi="रक्त समूह" required />
              <FormSelect value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })} options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"]} />
            </div>
          </div>

          {/* 3. NOMINEE DETAILS */}
          <FormSectionHeader en="NOMINEE DETAILS" hi="नॉमिनी विवरण" />
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <FormLabel en="Nominee Name" hi="नॉमिनी का नाम" required />
                <FormInput value={formData.nomineeName} onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })} />
              </div>
              <div>
                <FormLabel en="Relationship" hi="अभ्यर्थी से संबंध" required />
                <FormSelect value={formData.nomineeRelation} onChange={(e) => setFormData({ ...formData, nomineeRelation: e.target.value })} options={["Father", "Mother", "Spouse", "Son", "Daughter", "Brother", "Sister", "Guardian"]} />
              </div>
              <div>
                <FormLabel en="Nominee Age" hi="नॉमिनी की आयु" required />
                <FormInput type="number" value={formData.nomineeAge} onChange={(e) => { const val = e.target.value; if (!val || (parseInt(val) >= 1 && parseInt(val) <= 120)) setFormData({ ...formData, nomineeAge: val }); }} placeholder="Age" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <FormLabel en="Nominee Aadhar No" hi="नॉमिनी आधार नं" required />
                <FormInput value={formData.nomineeAadhar} onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); if (val.length <= 12) setFormData({ ...formData, nomineeAadhar: val }); }} placeholder="12 Digit Aadhar" />
              </div>
              <div>
                <FormLabel en="Nominee Mobile" hi="मोबाइल नंबर" required />
                <FormInput value={formData.nomineeMobile} onChange={(e) => setFormData({ ...formData, nomineeMobile: e.target.value })} />
              </div>
              <div>
                <FormLabel en="Nominee Email" hi="ईमेल" required />
                <FormInput type="email" value={formData.nomineeEmail} onChange={(e) => setFormData({ ...formData, nomineeEmail: e.target.value })} />
              </div>
            </div>
          </div>

          {/* 4. BANK DETAILS */}
          <FormSectionHeader en="BANK DETAILS" hi="बैंक विवरण" />
          <div className="space-y-6">
            <div className="w-full">
              <FormLabel en="Account Holder Name" hi="खाताधारक का नाम" required />
              <FormInput value={formData.accountHolderName} onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <span className="text-xs font-bold text-gray-700 block mb-1">Bank Name / बैंक का नाम : *</span>
                <FormSelect value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} options={INDIAN_BANKS} placeholder="--Select Bank--" />
              </div>
              <div>
                <FormLabel en="Account Number" hi="खाता संख्या" required />
                <FormInput value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <FormLabel en="IFSC Code" hi="IFSC कोड" required />
                <FormInput value={formData.ifscCode} onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })} />
              </div>
              <div>
                <FormLabel en="Branch Name" hi="शाखा का नाम" required />
                <FormInput value={formData.branchName} onChange={(e) => setFormData({ ...formData, branchName: e.target.value })} />
              </div>
            </div>

            {/* Bank Doc Upload */}
            <div className="w-full">
              <FormLabel en="Cancelled Cheque / Passbook (Upload)" hi="कैंसिल चेक / पासबुक (अपलोड)" required />
              <div className="flex items-center gap-4">
                <input type="file" id="bankDoc" className="hidden" onChange={(e) => handleDocUpload(e, "bankDoc")} accept="image/*,.pdf" />
                <label htmlFor="bankDoc" className={`flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${formData.bankDoc ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300 hover:border-green-500'}`}>
                  {uploadingDoc === "bankDoc" ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                      <span className="text-xs font-bold text-gray-500">Uploading Document...</span>
                    </div>
                  ) : formData.bankDoc ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-20 h-20 rounded-lg border-2 border-green-200 overflow-hidden shadow-md bg-white">
                        {formData.bankDoc.toLowerCase().endsWith('.pdf') ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500">
                            <FileText className="w-8 h-8" /><span className="text-[10px] font-black uppercase">PDF Format</span>
                          </div>
                        ) : (
                          <img src={formData.bankDoc} className="w-full h-full object-cover" alt="Bank Doc Preview" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-black text-green-800 uppercase tracking-widest">Document Verified ✅</span>
                      </div>
                      <span className="text-[10px] text-green-600 font-bold underline">Click to upload a different file</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <CreditCard className="w-8 h-8 text-gray-400" />
                      <div>
                        <span className="text-sm font-black text-gray-700 block uppercase">Upload Passbook or Cancelled Cheque</span>
                        <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-1 block bg-green-50 px-2 py-0.5 rounded">✔ JPG, PNG, PDF (High Quality)</span>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Declaration */}
          <div className="mt-12 p-6 bg-green-50 rounded-xl border-2 border-green-200 space-y-6">
            <div className="flex gap-4 items-start">
              <input type="checkbox" id="declaration" className="mt-1 w-5 h-5 accent-green-600 shrink-0 cursor-pointer"
                checked={formData.agreeToTerms} onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })} />
              <label htmlFor="declaration" className="text-sm font-semibold text-gray-800 leading-relaxed cursor-pointer select-none">
                I hereby declare that the details furnished above are true and correct to the best of my knowledge and belief and I undertake to inform you of any changes therein, immediately. In case any of the above information is found to be false or untrue or misleading or misrepresenting, I am aware that I may be held liable for it.
              </label>
            </div>

            <div className="flex gap-4 items-center">
              <input type="checkbox" id="docVerify" className="w-5 h-5 accent-green-600 shrink-0 cursor-pointer"
                checked={formData.docsVerified} onChange={(e) => setFormData({ ...formData, docsVerified: e.target.checked })} />
              <label htmlFor="docVerify" className="text-[#0aca00] font-bold underline hover:text-green-800 flex items-center gap-2 transition-all cursor-pointer select-none text-sm">
                <FileText className="w-5 h-5" />
                I've read and agree with the terms & conditions of joining
              </label>
              {formData.docsVerified && <CheckCircle2 className="w-5 h-5 text-green-600" />}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-10">
            <button
              onClick={handleComplete}
              disabled={!formData.agreeToTerms || !formData.docsVerified || isSubmitting}
              className={`flex items-center justify-center gap-3 px-16 py-4 rounded-lg font-black text-xl transition-all transform active:scale-95 shadow-lg border-2 border-green-700 ${formData.agreeToTerms && formData.docsVerified && !isSubmitting
                ? "bg-[#0aca00] text-white hover:bg-[#08a000] shadow-green-100"
                : "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300"}`}
            >
              {isSubmitting ? (
                <><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> Saving...</>
              ) : (
                <><CheckCircle2 className="w-6 h-6" /> Submit & Activate Dashboard</>
              )}
            </button>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Jan Swasthya Sahayata Abhiyan © Official Employee Portal</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmployeeOnboarding;
