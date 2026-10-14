import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { cardAPI, locationAPI } from "../../utils/api";
import {
  ArrowLeft,
  Save,
  User,
  Camera,
  MapPin,
  Heart,
  Building2,
  Loader2,
  CheckCircle2,
  Users,
  X,
  Upload
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

const InputField = ({ label, name, formData, handleChange, handleBlur = () => {}, type = "text", required = false, placeholder = "", options = null, disabled = false, error, isChecking = false }) => (
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

const MultiSelectField = ({ label, name, selectedOptions, options, onChange, required = false }) => {
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
      <div className="min-h-[48px] p-2 bg-white border-[1px] border-black rounded-none flex flex-wrap gap-2">
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

const AdminEditCardHolder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    cardType: "Old Card",
    cardCreatedDate: "",
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

  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
        setLoading(true);
        const res = await cardAPI.getById(id);
        if (res.success && res.data) {
          const card = res.data;
          setFormData({
            ...card,
            dob: card.dob ? new Date(card.dob).toISOString().split("T")[0] : "",
            cardCreatedDate: card.cardCreatedDate ? new Date(card.cardCreatedDate).toISOString().split("T")[0] : (card.createdAt ? new Date(card.createdAt).toISOString().split("T")[0] : ""),
            languages: card.languages || []
          });
        } else {
          toast.error("Failed to load cardholder details");
        }
      } catch (err) {
        console.error("Fetch card details error:", err);
        toast.error("Error loading cardholder details");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCardDetails();
  }, [id]);

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
        } catch (error) {
          setAvailableDistricts(staticDistricts);
        }
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

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const [checkingFields, setCheckingFields] = useState({ mobileNumber: false, email: false });

  useEffect(() => {
    const checkDuplicates = async () => {
      const { mobileNumber, email } = formData;

      if (mobileNumber && mobileNumber.length === 10) {
        setCheckingFields(prev => ({ ...prev, mobileNumber: true }));
        try {
          const res = await cardAPI.checkDuplicate({ mobileNumber, excludeCardId: id });
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
          const res = await cardAPI.checkDuplicate({ email, excludeCardId: id });
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
  }, [formData.mobileNumber, formData.email, id]);

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    const requiredFields = [
      "cardholderName", "gender", "dob", "aadhaarNumber", "mobileNumber",
      "addressLine", "villageCity", "block", "district", "state"
    ];

    for (let field of requiredFields) {
      if (!formData[field] || formData[field].toString().trim() === "") {
        errors[field] = "This field is required";
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const res = await cardAPI.adminUpdate(id, formData);
      if (res.success) {
        toast.success("Cardholder updated successfully!");
        navigate("/admin/cardholders");
      } else {
        toast.error(res.error || "Failed to update cardholder");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[80vh] flex flex-col items-center justify-center text-gray-400">
          <Loader2 size={36} className="animate-spin text-[#3AB000] mb-3" />
          <p className="text-xs font-bold uppercase tracking-widest">Loading Cardholder Details...</p>
        </div>
      </DashboardLayout>
    );
  }

  const occupationOptions = ["Farmer", "Student", "Business", "Govt Employee", "Private Job", "Housewife", "Daily Wager", "Retired", "Unemployed", "Other"];
  const bloodGroupOptions = ["Not Known", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const relationOptions = ["Husband/Wife", "Father", "Mother", "Son", "Daughter", "Brother", "Sister", "Grandfather", "Grandmother", "Friend", "Other"];
  const bankOptions = ["Not Available", "State Bank of India (SBI)", "HDFC Bank", "ICICI Bank", "Punjab National Bank (PNB)", "Bank of Baroda (BoB)", "Axis Bank", "Canara Bank", "Union Bank of India", "Indian Bank", "Kotak Mahindra Bank", "IndusInd Bank", "Yes Bank", "Other"];
  const languageOptions = ["Hindi", "English", "Sanskrit", "Gujarati", "Marathi", "Bengali", "Telugu", "Tamil", "Kannada", "Malayalam", "Punjabi", "Odia", "Urdu"];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/admin/cardholders")}
            className="p-2.5 bg-white border border-gray-200 rounded-none text-gray-400 hover:text-[#3AB000] hover:border-[#3AB000] transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Edit CardHolder Details ({formData.cardId})</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Update information for {formData.cardholderName}</p>
          </div>
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
                  label="Card Creation Date"
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

            {/* Section 1: Basic */}
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
                />
                <InputField
                  label="Age"
                  name="age"
                  formData={formData}
                  handleChange={handleChange}
                  disabled
                />
                <InputField
                  label="Aadhaar Number"
                  name="aadhaarNumber"
                  formData={formData}
                  handleChange={handleChange}
                  required
                />
                <InputField
                  label="Mobile Number"
                  name="mobileNumber"
                  formData={formData}
                  handleChange={handleChange}
                  required
                  error={fieldErrors.mobileNumber}
                  isChecking={checkingFields.mobileNumber}
                />
                <InputField
                  label="Email Address"
                  name="email"
                  type="email"
                  formData={formData}
                  handleChange={handleChange}
                  error={fieldErrors.email}
                  isChecking={checkingFields.email}
                />
                <InputField
                  label="PAN Number"
                  name="panNumber"
                  formData={formData}
                  handleChange={handleChange}
                />
              </div>
            </div>

            {/* Section 2: Address */}
            <div>
              <SectionHeader icon={MapPin} title="Section 2: Address Details" desc="Location details" />
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
                />
                <InputField
                  label="Block / Tehsil"
                  name="block"
                  formData={formData}
                  handleChange={handleChange}
                  required
                />
                <InputField
                  label="Village / City"
                  name="villageCity"
                  formData={formData}
                  handleChange={handleChange}
                  required
                />
                <InputField
                  label="House No. / Street"
                  name="addressLine"
                  formData={formData}
                  handleChange={handleChange}
                  required
                />
                <InputField
                  label="Pincode"
                  name="pincode"
                  formData={formData}
                  handleChange={handleChange}
                />
              </div>
            </div>

            {/* Section 3: Family */}
            <div>
              <SectionHeader icon={Users} title="Section 3: Family & Nominee Details" desc="Family details" />
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
                  label="Father / Husband Name"
                  name="fatherOrHusbandName"
                  formData={formData}
                  handleChange={handleChange}
                  required
                />
                <InputField
                  label="Mother's Name"
                  name="motherName"
                  formData={formData}
                  handleChange={handleChange}
                  required
                />
                <InputField
                  label="Nominee Name"
                  name="nomineeName"
                  formData={formData}
                  handleChange={handleChange}
                  required
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

            {/* Section 4: Professional */}
            <div>
              <SectionHeader icon={Heart} title="Section 4: Professional & Health Info" desc="Occupation & Health" />
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

            {/* Submit */}
            <div className="pt-6 border-t flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3.5 bg-[#3AB000] text-white font-black text-sm uppercase tracking-wider hover:bg-[#329600] transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {saving ? "Saving Changes..." : "Update CardHolder Details"}
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

export default AdminEditCardHolder;
