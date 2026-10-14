import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { cardAPI, locationAPI } from "../../utils/api";
import {
  ArrowLeft,
  Save,
  User,
  Camera,
  MapPin,
  Briefcase,
  Heart,
  ShieldCheck,
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  X,
  Upload,
  Calendar,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

import statesData from "../../data/states.json";
import districtsData from "../../data/district.json";
import Webcam from "react-webcam";

const SectionHeader = ({ icon: Icon, title, desc }) => (
  <div className="flex items-center gap-4 mb-8 pb-4 border-b-2 border-[#3AB000] bg-gray-50/50 p-3">
    <div className="p-2.5 bg-white border border-gray-100">
      <Icon className="text-[#3AB000]" size={24} />
    </div>
    <div>
      <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
      <p className="text-[11px] font-bold text-gray-500 tracking-widest mt-0.5">{desc}</p>
    </div>
  </div>
);

const InputField = ({ label, name, formData, handleChange, handleBlur = () => { }, type = "text", required = false, placeholder = "", options = null, disabled = false, error, isChecking = false }) => (
  <div className="flex flex-col gap-1.5 text-left">
    <label className="text-sm font-bold text-gray-700 tracking-wide flex items-center gap-1.5">
      {label} {required && <span className="text-red-500 font-bold text-base">*</span>}
    </label>
    <div className="relative w-full">
      {options ? (
        <select
          name={name}
          value={formData[name]}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full px-4 py-3 bg-white border-[1px] ${error ? "border-red-500 focus:border-red-500" : "border-black focus:border-[#3AB000]"} rounded-none text-[15px] font-medium text-gray-900 outline-none transition-all ${isChecking ? "pr-10" : ""}`}
        >
          <option value="">Select {label}</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-3 bg-white border-[1px] ${error ? "border-red-500 focus:border-red-500" : "border-black focus:border-[#3AB000]"} rounded-none text-[15px] font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 ${isChecking ? "pr-10" : ""}`}
        />
      )}
      {isChecking && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          <Loader2 size={18} className="animate-spin text-[#3AB000]" />
        </div>
      )}
    </div>
    {error && <span className="text-red-500 text-xs mt-0.5 font-bold">{error}</span>}
  </div>
);

const MultiSelectField = ({ label, name, selectedOptions, options, onChange, required = false, error }) => {
  const handleAdd = (val) => {
    if (val && !selectedOptions.includes(val)) {
      onChange(name, [...selectedOptions, val]);
    }
  };

  const handleRemove = (val) => {
    onChange(name, selectedOptions.filter(item => item !== val));
  };

  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label className="text-sm font-bold text-gray-700 tracking-wide flex items-center gap-1.5">
        {label} {required && <span className="text-red-500 font-bold text-base">*</span>}
      </label>
      <div className={`min-h-[48px] p-2 bg-white border-[1px] ${error ? "border-red-500" : "border-black"} rounded-none flex flex-wrap gap-2`}>
        {(selectedOptions || []).map(opt => (
          <span key={opt} className="px-3 py-1 bg-green-50 text-[#3AB000] border border-[#3AB000]/20 text-xs font-black flex items-center gap-2">
            {opt}
            <button type="button" onClick={() => handleRemove(opt)} className="hover:text-red-500">×</button>
          </span>
        ))}
        <select
          onChange={(e) => {
            handleAdd(e.target.value);
            e.target.value = "";
          }}
          className="flex-1 min-w-[120px] outline-none text-sm font-medium bg-transparent"
        >
          <option value="">Add Language...</option>
          {options.filter(opt => !(selectedOptions || []).includes(opt)).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      {error && <span className="text-red-500 text-xs mt-0.5 font-bold">{error}</span>}
    </div>
  );
};

const PhotoModal = ({ isOpen, onClose, onImageSelect }) => {
  const [mode, setMode] = useState("select");
  const [facingMode, setFacingMode] = useState("environment");
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const capturePhoto = React.useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      onImageSelect(imageSrc);
      handleClose();
    }
  }, [webcamRef, onImageSelect]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelect(reader.result);
        handleClose();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    setMode("select");
    onClose();
  };

  if (!isOpen) return null;

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: facingMode
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-none overflow-hidden shadow-2xl border-2 border-[#3AB000]">
        <div className="px-6 py-4 bg-[#0A3D00] flex items-center justify-between border-b-2 border-[#3AB000]">
          <h3 className="text-white font-black uppercase tracking-widest text-sm">Update Profile Photo</h3>
          <button onClick={handleClose} className="text-white/60 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {mode === "select" && (
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-4 p-8 border-2 border-dashed border-gray-200 hover:border-[#3AB000] hover:bg-green-50 transition-all group"
              >
                <Upload size={32} className="text-gray-400 group-hover:text-[#3AB000]" />
                <div className="text-left">
                  <p className="font-black text-gray-900 text-sm">Upload Image</p>
                  <p className="text-[10px] font-bold text-gray-400 tracking-widest">Select from gallery</p>
                </div>
              </button>

              <button
                onClick={() => setMode("camera-select")}
                className="flex items-center justify-center gap-4 p-8 border-2 border-dashed border-gray-200 hover:border-[#3AB000] hover:bg-green-50 transition-all group"
              >
                <Camera size={32} className="text-gray-400 group-hover:text-[#3AB000]" />
                <div className="text-left">
                  <p className="font-black text-gray-900 text-sm">Capture Real Photo</p>
                  <p className="text-[10px] font-bold text-gray-400 tracking-widest">Use device camera</p>
                </div>
              </button>
            </div>
          )}

          {mode === "camera-select" && (
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => {
                  setFacingMode("user");
                  setMode("capture");
                }}
                className="flex items-center justify-center gap-4 p-8 border-2 border-dashed border-[#3AB000] bg-green-50/30 hover:bg-green-50 transition-all group"
              >
                <div className="p-3 bg-white rounded-none border border-[#3AB000]/20">
                  <User size={32} className="text-[#3AB000]" />
                </div>
                <div className="text-left">
                  <p className="font-black text-gray-900 uppercase text-sm">Front Camera</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selfie Mode</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setFacingMode("environment");
                  setMode("capture");
                }}
                className="flex items-center justify-center gap-4 p-8 border-2 border-dashed border-[#3AB000] bg-green-50/30 hover:bg-green-50 transition-all group"
              >
                <div className="p-3 bg-white rounded-none border border-[#3AB000]/20">
                  <Camera size={32} className="text-[#3AB000]" />
                </div>
                <div className="text-left">
                  <p className="font-black text-gray-900 uppercase text-sm">Back Camera</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Environment Mode</p>
                </div>
              </button>

              <button
                onClick={() => setMode("select")}
                className="mt-2 py-3 border-2 border-gray-200 font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all"
              >
                Back to Options
              </button>
            </div>
          )}

          {mode === "capture" && (
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-full aspect-square bg-black overflow-hidden border-4 border-gray-100">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  mirrored={facingMode === "user"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-4 w-full">
                <button onClick={() => setMode("camera-select")} className="flex-1 py-3 border-2 border-gray-200 font-black text-xs uppercase">Retake / Change</button>
                <button onClick={capturePhoto} className="flex-[2] py-3 bg-[#3AB000] text-white font-black text-xs uppercase">Capture Photo</button>
              </div>
            </div>
          )}
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
      </div>
    </div>
  );
};

const AdminAddCardHolder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [checkingFields, setCheckingFields] = useState({ mobileNumber: false, email: false });
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    cardType: "Old Card",
    cardCreatedDate: new Date().toISOString().split("T")[0],
    cardholderName: "",
    gender: "Male",
    dob: "",
    age: "",
    photo: "",
    aadhaarNumber: "",
    panNumber: "",
    mobileNumber: "",
    email: "",
    addressLine: "",
    villageCity: "",
    block: "",
    district: "",
    state: "Rajasthan / राजस्थान",
    pincode: "",
    maritalStatus: "Unmarried",
    fatherOrHusbandName: "",
    fatherOrHusbandMobile: "",
    motherName: "",
    spouseName: "",
    numberOfChildren: 0,
    occupation: "Farmer",
    bloodGroup: "Not Known",
    isHandicapped: false,
    disabilityType: "None",
    disabilityPercentage: "",
    languages: [],
    preExistingDisease: "",
    nomineeName: "",
    nomineeRelation: "Husband/Wife",
    bankName: "Not Available",
    accountNumber: "",
    ifscCode: "",
    branchName: ""
  });

  const handleMultiChange = (name, values) => {
    setFormData(prev => ({ ...prev, [name]: values }));
  };

  useEffect(() => {
    const fetchDistricts = async () => {
      if (formData.state) {
        const staticDistricts = districtsData[formData.state] || [];
        try {
          const cleanState = formData.state.split(" / ")[0].trim();
          const res = await locationAPI.getCustomDistricts(cleanState);
          const customList = res.data ? res.data.map(d => d.name) : [];
          const combined = [...new Set([...staticDistricts, ...customList])].sort((a, b) => a.localeCompare(b));
          setAvailableDistricts(combined);
          if (!combined.includes(formData.district)) {
            setFormData(prev => ({ ...prev, district: "" }));
          }
        } catch (error) {
          setAvailableDistricts(staticDistricts);
          if (!staticDistricts.includes(formData.district)) {
            setFormData(prev => ({ ...prev, district: "" }));
          }
        }
      } else {
        setAvailableDistricts([]);
        setFormData(prev => ({ ...prev, district: "" }));
      }
    };
    fetchDistricts();
  }, [formData.state]);

  useEffect(() => {
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData(prev => ({ ...prev, age }));

      if (age < 5 || age > 60) {
        setFieldErrors(prev => ({ ...prev, dob: "Age must be between 5 and 60 years" }));
      } else {
        setFieldErrors(prev => ({ ...prev, dob: undefined }));
      }
    } else {
      setFieldErrors(prev => ({ ...prev, dob: undefined }));
    }
  }, [formData.dob]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "mobileNumber") {
      const val = value.replace(/\D/g, "").slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: val }));
      return;
    }
    if (name === "aadhaarNumber") {
      const val = value.replace(/\D/g, "").slice(0, 12);
      setFormData(prev => ({ ...prev, [name]: val }));
      return;
    }
    if (name === "pincode") {
      const val = value.replace(/\D/g, "").slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: val }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  useEffect(() => {
    const checkDuplicates = async () => {
      const { mobileNumber, email } = formData;

      if (mobileNumber && mobileNumber.length === 10) {
        setCheckingFields(prev => ({ ...prev, mobileNumber: true }));
        try {
          const res = await cardAPI.checkDuplicate({ mobileNumber });
          if (res.success && res.duplicate) {
            setFieldErrors(prev => ({ ...prev, mobileNumber: res.message }));
          } else {
            setFieldErrors(prev => ({ ...prev, mobileNumber: undefined }));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setCheckingFields(prev => ({ ...prev, mobileNumber: false }));
        }
      } else if (!mobileNumber || mobileNumber.length !== 10) {
        setFieldErrors(prev => ({ ...prev, mobileNumber: undefined }));
        setCheckingFields(prev => ({ ...prev, mobileNumber: false }));
      }

      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setCheckingFields(prev => ({ ...prev, email: true }));
        try {
          const res = await cardAPI.checkDuplicate({ email });
          if (res.success && res.duplicate) {
            setFieldErrors(prev => ({ ...prev, email: res.message }));
          } else {
            setFieldErrors(prev => ({ ...prev, email: undefined }));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setCheckingFields(prev => ({ ...prev, email: false }));
        }
      } else if (!email) {
        setFieldErrors(prev => ({ ...prev, email: undefined }));
        setCheckingFields(prev => ({ ...prev, email: false }));
      }
    };

    const delayFn = setTimeout(() => {
      checkDuplicates();
    }, 400);

    return () => clearTimeout(delayFn);
  }, [formData.mobileNumber, formData.email]);

  const getFamilyLabel = () => {
    if (formData.gender === "Female") {
      if (formData.maritalStatus === "Married" || formData.maritalStatus === "Widowed") {
        return "Husband's Name";
      }
      if (formData.maritalStatus === "Divorced" || formData.maritalStatus === "Separated") {
        return "Ex-Husband's / Father's Name";
      }
    }
    return "Father's Name";
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    const requiredFields = [
      "cardType", "cardholderName", "gender", "dob", "aadhaarNumber", "mobileNumber",
      "addressLine", "villageCity", "block", "district", "state",
      "maritalStatus", "fatherOrHusbandName", "motherName",
      "occupation", "bloodGroup", "nomineeName", "nomineeRelation"
    ];

    for (let field of requiredFields) {
      if (!formData[field] || formData[field].toString().trim() === "") {
        errors[field] = "This field is required";
        isValid = false;
      }
    }

    if (formData.dob && (formData.age < 5 || formData.age > 60)) {
      errors.dob = "Age must be between 5 and 60 years";
      isValid = false;
    }

    if (formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber)) {
      errors.aadhaarNumber = "Aadhaar Number must be exactly 12 digits";
      isValid = false;
    }

    if (formData.mobileNumber && !/^\d{10}$/.test(formData.mobileNumber)) {
      errors.mobileNumber = "Mobile Number must be exactly 10 digits";
      isValid = false;
    }

    if (!formData.photo) {
      errors.photo = "Please upload a member photo";
      isValid = false;
      toast.error("Please upload a member photo");
    }

    setFieldErrors(errors);
    if (!isValid && Object.keys(errors).length > 0 && errors.photo === undefined) {
      toast.error("Please fill all required fields correctly.");
    }
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (fieldErrors.mobileNumber || fieldErrors.email) {
      toast.error("Please resolve duplicate field errors before submitting.");
      return;
    }

    try {
      setLoading(true);
      const res = await cardAPI.adminCreate(formData);
      if (res.success) {
        setSuccess(true);
        toast.success("Manual Cardholder created successfully!");
        setTimeout(() => navigate("/admin/cardholders"), 1500);
      } else {
        toast.error(res.error || "Failed to create cardholder");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <DashboardLayout>
        <div className="h-[80vh] flex flex-col items-center justify-center text-center px-6">
          <div className="w-20 h-20 bg-green-100 text-[#3AB000] rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">Card Created Successfully!</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Redirecting to CardHolder list...</p>
        </div>
      </DashboardLayout>
    );
  }

  const occupationOptions = ["Farmer", "Student", "Business", "Govt Employee", "Private Job", "Housewife", "Daily Wager", "Retired", "Unemployed", "Other"];
  const bloodGroupOptions = ["Not Known", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const relationOptions = ["Husband/Wife", "Father", "Mother", "Son", "Daughter", "Brother", "Sister", "Grandfather", "Grandmother", "Friend", "Other"];
  const disabilityOptions = ["None", "Visual Impairment", "Hearing Impairment", "Locomotor Disability", "Mental Illness", "Intellectual Disability", "Multiple Disabilities", "Other"];
  const bankOptions = ["Not Available", "State Bank of India (SBI)", "HDFC Bank", "ICICI Bank", "Punjab National Bank (PNB)", "Bank of Baroda (BoB)", "Axis Bank", "Canara Bank", "Union Bank of India", "Indian Bank", "Kotak Mahindra Bank", "IndusInd Bank", "Yes Bank", "Other"];
  const languageOptions = ["Hindi", "English", "Sanskrit", "Gujarati", "Marathi", "Bengali", "Telugu", "Tamil", "Kannada", "Malayalam", "Punjabi", "Odia", "Urdu"];

  const handleFillDummyData = () => {
    const firstNames = ["Rajesh", "Amit", "Suresh", "Vikram", "Pooja", "Sunita", "Ramesh", "Deepak", "Anjali", "Sanjay", "Manoj", "Kavita"];
    const lastNames = ["Kumar", "Sharma", "Verma", "Singh", "Patel", "Gupta", "Yadav", "Mishra", "Joshi", "Choudhary"];

    const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${randomFirst} ${randomLast}`;

    const randDigits = (length) => Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
    const randomMobile = "9" + randDigits(9);
    const randomAadhaar = "9" + randDigits(11);
    const randomEmail = `${randomFirst.toLowerCase()}${randDigits(4)}@example.com`;
    const randomPan = `ABCDE${randDigits(4)}F`;
    const randomAccount = "3" + randDigits(10);
    const randomIFSC = "SBIN000" + randDigits(4);

    // Pick state & district
    const stateList = statesData;
    const selectedState = stateList[Math.floor(Math.random() * stateList.length)] || statesData[0];
    const distList = districtsData[selectedState] || [];
    const selectedDist = distList[Math.floor(Math.random() * distList.length)] || "";

    // Random DOB (between 1985 and 2002)
    const birthYear = 1985 + Math.floor(Math.random() * 17);
    const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
    const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");
    const dob = `${birthYear}-${birthMonth}-${birthDay}`;

    // Issue Date (between 2024-01-01 and 2026-06-01)
    const issueDate = `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`;

    setFormData(prev => ({
      ...prev,
      cardType: "Old Card",
      cardCreatedDate: issueDate,
      cardholderName: fullName,
      gender: Math.random() > 0.5 ? "Male" : "Female",
      dob: dob,
      aadhaarNumber: randomAadhaar,
      mobileNumber: randomMobile,
      email: randomEmail,
      panNumber: randomPan,
      state: selectedState,
      district: selectedDist,
      block: `Block ${randDigits(2)}`,
      villageCity: `Village ${randomLast}`,
      houseNoStreet: `House No. ${randDigits(2)}, Main Road`,
      pincode: `30${randDigits(4)}`,
      maritalStatus: "Married",
      fatherOrHusbandName: `Father ${randomLast}`,
      motherName: `Mother ${randomLast}`,
      spouseName: `Spouse ${randomLast}`,
      nomineeName: `Nominee ${randomLast}`,
      nomineeRelation: "Spouse",
      occupation: "Farmer",
      bloodGroup: "B+",
      languagesKnown: ["Hindi", "English"],
      disabilityStatus: "None",
      bankName: "State Bank of India (SBI)",
      accountNumber: randomAccount,
      ifscCode: randomIFSC
    }));

    setFieldErrors({});
    toast.success("Random dummy data populated!");
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/cardholders")}
              className="p-2.5 bg-white border border-gray-200 rounded-none text-gray-400 hover:text-[#3AB000] hover:border-[#3AB000] transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Add Manual CardHolder (Old System Entry)</h1>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Manual entry - No wallet deduction or commission payout</p>
            </div>
          </div>

          {/* <button
            type="button"
            onClick={handleFillDummyData}
            className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shrink-0"
          >
            <Sparkles size={16} /> Fill Dummy Data
          </button> */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-[#3AB000] p-8 lg:p-12 space-y-12 shadow-md">

            {/* Top Photo & Card Type */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-3 flex flex-col items-center gap-4 text-center">
                <div className="relative w-36 h-36 bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                  {formData.photo ? (
                    <img src={formData.photo} alt="Member" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <User size={40} />
                      <span className="text-[10px] font-bold uppercase tracking-wider mt-2">Member Photo</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="px-4 py-2 bg-gray-900 text-white font-black text-xs uppercase tracking-wider hover:bg-[#3AB000] transition-all"
                >
                  {formData.photo ? "Change Photo" : "Upload / Capture Photo"}
                </button>
                {fieldErrors.photo && <span className="text-red-500 text-xs font-bold">{fieldErrors.photo}</span>}
              </div>

              <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Card Type"
                  name="cardType"
                  formData={formData}
                  handleChange={handleChange}
                  options={["Old Card", "New Card"]}
                  required
                />

                <InputField
                  label="Card Creation Date (Issue Date)"
                  name="cardCreatedDate"
                  type="date"
                  formData={formData}
                  handleChange={handleChange}
                  required
                />

                <InputField
                  label="Cardholder Full Name"
                  name="cardholderName"
                  formData={formData}
                  handleChange={handleChange}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  error={fieldErrors.cardholderName}
                />

                <InputField
                  label="Gender"
                  name="gender"
                  formData={formData}
                  handleChange={handleChange}
                  options={["Male", "Female", "Other"]}
                  required
                />
              </div>
            </div>

            {/* Section 1: Basic & Identity */}
            <div>
              <SectionHeader icon={User} title="Section 1: Basic & Identity Information" desc="Personal identifiers" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField
                  label="Date of Birth (DOB)"
                  name="dob"
                  type="date"
                  formData={formData}
                  handleChange={handleChange}
                  required
                  error={fieldErrors.dob}
                />
                <InputField
                  label="Age (Auto-calculated)"
                  name="age"
                  formData={formData}
                  handleChange={handleChange}
                  disabled
                />
                <InputField
                  label="Aadhaar Number (12 Digits)"
                  name="aadhaarNumber"
                  formData={formData}
                  handleChange={handleChange}
                  placeholder="12 digit Aadhaar"
                  required
                  error={fieldErrors.aadhaarNumber}
                />
                <InputField
                  label="Mobile Number (10 Digits - User Login ID)"
                  name="mobileNumber"
                  formData={formData}
                  handleChange={handleChange}
                  placeholder="10 digit mobile"
                  required
                  error={fieldErrors.mobileNumber}
                  isChecking={checkingFields.mobileNumber}
                />
                <InputField
                  label="Email Address (Optional)"
                  name="email"
                  type="email"
                  formData={formData}
                  handleChange={handleChange}
                  placeholder="email@example.com"
                  error={fieldErrors.email}
                  isChecking={checkingFields.email}
                />
                <InputField
                  label="PAN Number (Optional)"
                  name="panNumber"
                  formData={formData}
                  handleChange={handleChange}
                  placeholder="ABCDE1234F"
                />
              </div>
            </div>

            {/* Section 2: Address */}
            <div>
              <SectionHeader icon={MapPin} title="Section 2: Address Details" desc="Residential information" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField
                  label="State"
                  name="state"
                  formData={formData}
                  handleChange={handleChange}
                  options={statesData}
                  required
                />
                <InputField
                  label="District"
                  name="district"
                  formData={formData}
                  handleChange={handleChange}
                  options={availableDistricts}
                  required
                  error={fieldErrors.district}
                />
                <InputField
                  label="Block / Tehsil"
                  name="block"
                  formData={formData}
                  handleChange={handleChange}
                  placeholder="e.g. Sanganer"
                  required
                  error={fieldErrors.block}
                />
                <InputField
                  label="Village / City"
                  name="villageCity"
                  formData={formData}
                  handleChange={handleChange}
                  placeholder="e.g. Jaipur"
                  required
                  error={fieldErrors.villageCity}
                />
                <InputField
                  label="House No. / Street / Area"
                  name="addressLine"
                  formData={formData}
                  handleChange={handleChange}
                  placeholder="House no, Street"
                  required
                  error={fieldErrors.addressLine}
                />
                <InputField
                  label="Pincode (6 Digits)"
                  name="pincode"
                  formData={formData}
                  handleChange={handleChange}
                  placeholder="302011"
                  error={fieldErrors.pincode}
                />
              </div>
            </div>

            {/* Section 3: Family & Social */}
            <div>
              <SectionHeader icon={Users} title="Section 3: Family & Social Info" desc="Family ties & Nominee" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField
                  label="Marital Status"
                  name="maritalStatus"
                  formData={formData}
                  handleChange={handleChange}
                  options={["Unmarried", "Married", "Widowed", "Divorced", "Separated", "Other"]}
                  required
                />
                <InputField
                  label={getFamilyLabel()}
                  name="fatherOrHusbandName"
                  formData={formData}
                  handleChange={handleChange}
                  required
                  error={fieldErrors.fatherOrHusbandName}
                />
                <InputField
                  label="Mother's Name"
                  name="motherName"
                  formData={formData}
                  handleChange={handleChange}
                  required
                  error={fieldErrors.motherName}
                />
                {formData.maritalStatus === "Married" && (
                  <InputField
                    label="Spouse Name"
                    name="spouseName"
                    formData={formData}
                    handleChange={handleChange}
                    required
                    error={fieldErrors.spouseName}
                  />
                )}
                <InputField
                  label="Nominee Name"
                  name="nomineeName"
                  formData={formData}
                  handleChange={handleChange}
                  required
                  error={fieldErrors.nomineeName}
                />
                <InputField
                  label="Nominee Relation"
                  name="nomineeRelation"
                  formData={formData}
                  handleChange={handleChange}
                  options={relationOptions}
                  required
                />
              </div>
            </div>

            {/* Section 4: Professional & Health */}
            <div>
              <SectionHeader icon={Heart} title="Section 4: Professional & Health Info" desc="Occupation & Health profile" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField
                  label="Occupation"
                  name="occupation"
                  formData={formData}
                  handleChange={handleChange}
                  options={occupationOptions}
                  required
                />
                <InputField
                  label="Blood Group"
                  name="bloodGroup"
                  formData={formData}
                  handleChange={handleChange}
                  options={bloodGroupOptions}
                  required
                />
                <MultiSelectField
                  label="Languages Known"
                  name="languages"
                  selectedOptions={formData.languages}
                  options={languageOptions}
                  onChange={handleMultiChange}
                />
              </div>
            </div>

            {/* Section 5: Financial */}
            <div>
              <SectionHeader icon={Building2} title="Section 5: Bank Details (Optional)" desc="Banking information" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField
                  label="Bank Name"
                  name="bankName"
                  formData={formData}
                  handleChange={handleChange}
                  options={bankOptions}
                />
                <InputField
                  label="Account Number"
                  name="accountNumber"
                  formData={formData}
                  handleChange={handleChange}
                  placeholder="Bank Account Number"
                />
                <InputField
                  label="IFSC Code"
                  name="ifscCode"
                  formData={formData}
                  handleChange={handleChange}
                  placeholder="SBIN0001234"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 bg-[#3AB000] text-white font-black text-sm uppercase tracking-wider hover:bg-[#329600] transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {loading ? "Creating Card..." : "Save & Issue Manual Card"}
              </button>
            </div>
          </div>
        </form>

        <PhotoModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          onImageSelect={(img) => setFormData(prev => ({ ...prev, photo: img }))}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminAddCardHolder;
