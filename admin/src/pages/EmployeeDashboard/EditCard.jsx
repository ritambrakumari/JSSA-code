import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { useNavigate, useParams } from "react-router-dom";
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
  RefreshCcw
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

const InputField = ({ label, name, formData, handleChange, handleBlur, type = "text", required = false, placeholder = "", options = null, disabled = false, error, isChecking = false }) => (
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
  const [mode, setMode] = useState("select"); // 'select', 'camera-select', 'capture'
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
                <button onClick={() => setMode("camera-select")} className="flex-1 py-3 border-2 border-gray-200 font-black text-xs">Retake / Change</button>
                <button onClick={capturePhoto} className="flex-[2] py-3 bg-[#3AB000] text-white font-black text-xs">Capture Photo</button>
              </div>
            </div>
          )}
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
      </div>
    </div>
  );
};

const EditCard = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { employeeProfile, refreshProfile } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [checkingFields, setCheckingFields] = useState({ mobileNumber: false, email: false });
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [existingUserDetails, setExistingUserDetails] = useState(null);

  useEffect(() => {
    setInitialLoading(true);
    cardAPI.getById(id).then(res => {
      if (res.success && res.data) {
        const data = { ...res.data };
        if (data.dob) {
          data.dob = data.dob.split('T')[0];
        }
        setFormData(data);
        if (data.state) {
          setAvailableDistricts(districtsData[data.state] || []);
        }
      } else {
        setError(res.error || "Failed to load card data.");
      }
    }).catch(err => {
      setError("Error fetching card data.");
    }).finally(() => {
      setInitialLoading(false);
    });
  }, [id]);

  const [formData, setFormData] = useState({
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

  // Update districts when state changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (formData.state) {
        const staticDistricts = districtsData[formData.state] || [];
        
        try {
          const cleanState = formData.state.split(" / ")[0].trim();
          const res = await locationAPI.getCustomDistricts(cleanState);
          const customList = res.data ? res.data.map(d => d.name) : [];
          
          const combined = [...new Set([...staticDistricts, ...customList])];
          const sorted = combined.sort((a, b) => a.localeCompare(b));
          
          setAvailableDistricts(sorted);
          
          // Reset district if the new state doesn't have the currently selected district
          if (!sorted.includes(formData.district)) {
            setFormData(prev => ({ ...prev, district: "" }));
          }
        } catch (error) {
          console.error("Failed to fetch custom districts:", error);
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

  useEffect(() => {
    const checkDuplicates = async () => {
      const { mobileNumber, email } = formData;
      let mobileError = fieldErrors.mobileNumber;
      let emailError = fieldErrors.email;

      if (mobileNumber && mobileNumber.length === 10) {
        try {
          const res = await cardAPI.checkDuplicate({ mobileNumber, excludeCardId: id });
          if (res.success) {
            if (res.duplicate) {
              mobileError = res.message;
              setExistingUserDetails(null);
            } else if (res.isExistingCardHolder) {
              mobileError = undefined;
              setExistingUserDetails(res.userDetails);
            } else {
              mobileError = undefined;
              setExistingUserDetails(null);
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setCheckingFields(prev => ({ ...prev, mobileNumber: false }));
        }
      } else if (!mobileNumber || mobileNumber.length !== 10) {
         mobileError = undefined;
         setCheckingFields(prev => ({ ...prev, mobileNumber: false }));
         if (!email) setExistingUserDetails(null);
      }

      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        try {
          const res = await cardAPI.checkDuplicate({ email, excludeCardId: id });
          if (res.success) {
            if (res.duplicate) {
              emailError = res.message;
              setExistingUserDetails(null);
            } else if (res.isExistingCardHolder) {
              emailError = undefined;
              setExistingUserDetails(res.userDetails);
            } else {
              emailError = undefined;
              if (!mobileNumber || mobileNumber.length !== 10) setExistingUserDetails(null);
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setCheckingFields(prev => ({ ...prev, email: false }));
        }
      } else {
         emailError = undefined;
         setCheckingFields(prev => ({ ...prev, email: false }));
         if (!mobileNumber || mobileNumber.length !== 10) setExistingUserDetails(null);
      }

      setFieldErrors(prev => {
        if (prev.mobileNumber === mobileError && prev.email === emailError) return prev;
        return { ...prev, mobileNumber: mobileError, email: emailError };
      });
    };

    const delayFn = setTimeout(() => {
      checkDuplicates();
    }, 500);

    return () => clearTimeout(delayFn);
  }, [formData.mobileNumber, formData.email, id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "mobileNumber" || name === "email") {
      setCheckingFields(prev => ({ ...prev, [name]: true }));
    }

    // Numeric restrictions with maxLength
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
    if (name === "disabilityPercentage" || name === "numberOfChildren") {
      const val = value.replace(/\D/g, "").slice(0, 3);
      setFormData(prev => ({ ...prev, [name]: val }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    if ((name === "mobileNumber" || name === "email") && value.trim()) {
      // Validate length for mobile before checking duplicate
      if (name === "mobileNumber" && value.length !== 10) return;
      if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return;
      
      try {
        const payload = name === "mobileNumber" ? { mobileNumber: value } : { email: value };
        payload.excludeCardId = id; // exclude the current card
        const res = await cardAPI.checkDuplicate(payload);
        if (res.success) {
          if (res.duplicate) {
            setFieldErrors(prev => ({ ...prev, [name]: res.message }));
            setExistingUserDetails(null);
          } else if (res.isExistingCardHolder) {
            setFieldErrors(prev => ({ ...prev, [name]: undefined }));
            setExistingUserDetails(res.userDetails);
          } else {
            setFieldErrors(prev => ({ ...prev, [name]: undefined }));
            setExistingUserDetails(null);
          }
        }
      } catch (err) {
        console.error("Duplicate check error:", err);
      }
    }
  };

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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Photo size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    // Basic Required Fields
    const requiredFields = [
      "cardholderName", "gender", "dob", "aadhaarNumber", "mobileNumber",
      "addressLine", "villageCity", "block", "district", "state",
      "maritalStatus", "fatherOrHusbandName", "motherName",
      "occupation", "bloodGroup", "nomineeName", "nomineeRelation"
    ];

    for (let field of requiredFields) {
      if (!formData[field] || formData[field].toString().trim() === "") {
        const label = field.replace(/([A-Z])/g, ' $1').toLowerCase();
        setError(`Please fill in the required field: ${label}`);
        return false;
      }
    }

    // Age Validation
    if (formData.dob && (formData.age < 5 || formData.age > 60)) {
      setError("Age must be between 5 and 60 years");
      return false;
    }

    // Aadhaar Validation (12 Digits)
    if (!/^\d{12}$/.test(formData.aadhaarNumber.replace(/\s/g, ""))) {
      setError("Aadhaar Number must be exactly 12 digits.");
      return false;
    }

    // Mobile Validation (10 Digits)
    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      setError("Mobile Number must be exactly 10 digits.");
      return false;
    }

    // Pincode Validation (6 Digits)
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      setError("Pincode must be exactly 6 digits.");
      return false;
    }

    // Email Validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    // Conditional: Married
    if (formData.maritalStatus === "Married" && !formData.spouseName) {
      setError("Husband/Wife Name is required for Married status.");
      return false;
    }

    // Conditional: Handicapped
    if (formData.isHandicapped && (!formData.disabilityType || formData.disabilityType === "None")) {
      setError("Please specify the Disability Type.");
      return false;
    }

    // Photo Check
    if (!formData.photo) {
      setError("Please upload a member photo.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    if (fieldErrors.mobileNumber || fieldErrors.email) {
      setError("Please resolve duplicate field errors before submitting.");
      return;
    }

    try {
      setLoading(true);

      // Fetch Geolocation
      let location = null;
      try {
        const getPosition = (options) => {
          return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
          });
        };

        let pos;
        try {
          pos = await getPosition({
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0
          });
        } catch (highAccuracyError) {
          console.warn("High accuracy geolocation failed, trying standard accuracy...", highAccuracyError);
          pos = await getPosition({
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 60000
          });
        }

        location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
      } catch (err) {
        console.warn("Standard GPS failed, calling IP Geolocation fallback...", err);
        try {
          const ipRes = await fetch("https://ipapi.co/json/");
          const ipData = await ipRes.json();
          if (ipData && ipData.latitude && ipData.longitude) {
            location = {
              lat: ipData.latitude,
              lng: ipData.longitude
            };
          }
        } catch (ipErr) {
          console.error("IP Geolocation fallback failed:", ipErr);
          location = null;
        }
      }

      // Attach location to the request body
      const submissionData = {
        ...formData,
        location: location || undefined
      };

      const res = await cardAPI.update(id, submissionData);
      
      if (res.success) {
        setSuccess(true);
        setTimeout(() => navigate("/employee/cards"), 2000);
      } else {
        setError(res.error || "Failed to update card");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="h-[80vh] flex flex-col items-center justify-center text-center px-6">
          <Loader2 className="animate-spin text-[#3AB000] mb-4" size={48} />
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Loading Card Details</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2">Please wait while we fetch the data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (success) {
    return (
      <DashboardLayout>
        <div className="h-[80vh] flex flex-col items-center justify-center text-center px-6">
          <div className="w-20 h-20 bg-green-100 text-[#3AB000] rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">Card Updated Successfully!</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Redirecting to management dashboard...</p>
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

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/employee/cards")}
            className="p-2.5 bg-white border border-gray-200 rounded-none text-gray-400 hover:text-[#3AB000] hover:border-[#3AB000] transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Edit Member Card</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Update the enrollment form below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-none flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} />
              <p className="text-sm font-bold uppercase tracking-tight">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-none border border-[#3AB000] overflow-hidden">
            <div className="p-8 lg:p-12 space-y-12">

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-3 flex flex-col items-center gap-4 text-center">
                  <input
                    type="file"
                    id="photo-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  <div
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="w-40 h-40 bg-white p-1 border-2 border-[#3AB000] rounded-none flex flex-col items-center justify-center text-gray-400 group hover:bg-green-50 transition-all cursor-pointer overflow-hidden relative"
                  >
                    {formData.photo ? (
                      <>
                        <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera size={28} className="text-white mb-2" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Change Photo</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera size={32} className="mb-2 group-hover:text-[#3AB000] transition-colors" />
                        <span className="text-[12px] font-bold uppercase tracking-widest text-center px-4">
                          Click to Upload Photo <span className="text-red-500 font-bold">*</span>
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="mt-2 px-4 py-2 bg-green-50 text-[#3AB000] border border-[#3AB000] text-xs font-black uppercase tracking-widest hover:bg-[#3AB000] hover:text-white transition-all flex items-center gap-2"
                  >
                    <Camera size={14} />
                    {formData.photo ? "Change Photo" : "Upload Photo"}
                  </button>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-4 mt-1">JPEG or PNG max 2MB</p>
                </div>

                <div className="md:col-span-9 space-y-6">
                  <SectionHeader icon={User} title="Personal Information" desc="Identity & Basic Profile" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InputField label="Cardholder Name" name="cardholderName" formData={formData} handleChange={handleChange} required placeholder="Enter full name" />
                    <InputField label="Gender" name="gender" formData={formData} handleChange={handleChange} required options={["Male", "Female", "Other"]} />
                    <InputField label="Date of Birth" name="dob" formData={formData} handleChange={handleChange} type="date" required />
                    <InputField label="Age" name="age" formData={formData} handleChange={handleChange} disabled placeholder="Auto-calculated" />
                    <InputField label="Aadhaar Number" name="aadhaarNumber" formData={formData} handleChange={handleChange} required placeholder="1234 5678 9012" />
                    <InputField label="PAN Number" name="panNumber" formData={formData} handleChange={handleChange} placeholder="ABCDE1234F" />
                  </div>
                </div>
              </div>

              <div>
                <SectionHeader icon={MapPin} title="Contact & Address" desc="Communication Details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InputField label="Mobile Number" name="mobileNumber" formData={formData} handleChange={handleChange} handleBlur={handleBlur} required placeholder="9876543210" error={fieldErrors.mobileNumber} isChecking={checkingFields.mobileNumber} />
                  <InputField label="Email Address" name="email" formData={formData} handleChange={handleChange} handleBlur={handleBlur} type="email" placeholder="example@mail.com" error={fieldErrors.email} isChecking={checkingFields.email} />
                  <InputField label="Pincode" name="pincode" formData={formData} handleChange={handleChange} placeholder="123456" />

                  {existingUserDetails && (
                    <div className="sm:col-span-2 lg:col-span-3 p-4 bg-blue-50 border-l-4 border-blue-500 mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="text-blue-500" size={20} />
                        <h4 className="text-blue-800 font-bold text-sm">Existing User Found</h4>
                      </div>
                      <p className="text-blue-700 text-xs">
                        <strong>Name:</strong> {existingUserDetails.name} | <strong>Role:</strong> {existingUserDetails.role} | <strong>Mobile:</strong> {existingUserDetails.phone}
                      </p>
                      <p className="text-blue-600 text-[10px] font-bold mt-1 uppercase tracking-wider">The card details will be updated for this account.</p>
                    </div>
                  )}

                  <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InputField label="House / Street / Area" name="addressLine" formData={formData} handleChange={handleChange} required placeholder="House No, Street name" />
                    <InputField label="Village / City" name="villageCity" formData={formData} handleChange={handleChange} required placeholder="Village or City name" />
                    <InputField label="Block / Tehsil" name="block" formData={formData} handleChange={handleChange} required placeholder="Block name" />
                    <InputField label="District" name="district" formData={formData} handleChange={handleChange} required options={availableDistricts} />
                    <InputField label="State" name="state" formData={formData} handleChange={handleChange} required options={statesData} />
                  </div>
                </div>
              </div>

              <div>
                <SectionHeader icon={ShieldCheck} title="Family & Marital Details" desc="Dynamic Relationships" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InputField label="Marital Status" name="maritalStatus" formData={formData} handleChange={handleChange} required options={["Unmarried", "Married", "Widowed", "Divorced", "Separated", "Other"]} />
                  <InputField label={getFamilyLabel()} name="fatherOrHusbandName" formData={formData} handleChange={handleChange} required placeholder="Full Name" />
                  <InputField label="Mobile (Optional)" name="fatherOrHusbandMobile" formData={formData} handleChange={handleChange} placeholder="Contact number" />
                  <InputField label="Mother's Name" name="motherName" formData={formData} handleChange={handleChange} required placeholder="Full Name" />

                  {formData.maritalStatus === "Married" && (
                    <>
                      <InputField label="Husband/Wife Name" name="spouseName" formData={formData} handleChange={handleChange} required placeholder="Partner's Name" />
                      <InputField label="Number of Children" name="numberOfChildren" formData={formData} handleChange={handleChange} type="number" />
                    </>
                  )}
                </div>
              </div>

              <div>
                <SectionHeader icon={Briefcase} title="Professional & Health" desc="Occupation & Medical Status" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InputField label="Occupation" name="occupation" formData={formData} handleChange={handleChange} required options={occupationOptions} />
                  <InputField label="Blood Group" name="bloodGroup" formData={formData} handleChange={handleChange} required options={bloodGroupOptions} />
                  <MultiSelectField label="Languages Known" name="languages" selectedOptions={formData.languages} options={languageOptions} onChange={handleMultiChange} />

                  <div className="sm:col-span-2 lg:col-span-1 flex items-center gap-3 pt-6">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="isHandicapped" checked={formData.isHandicapped} onChange={handleChange} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#3AB000]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3AB000]"></div>
                    </label>
                    <span className="text-[11px] font-black text-gray-500 uppercase">Handicapped / Disabled?</span>
                  </div>

                  {formData.isHandicapped && (
                    <>
                      <InputField label="Disability Type" name="disabilityType" formData={formData} handleChange={handleChange} options={disabilityOptions} />
                      <InputField label="Disability %" name="disabilityPercentage" formData={formData} handleChange={handleChange} type="number" placeholder="Percentage" />
                    </>
                  )}

                  <div className="sm:col-span-2 lg:col-span-3 flex flex-col gap-1.5 text-left">
                    <label className="text-[11px] font-black text-gray-500 tracking-widest flex items-center gap-1">Pre-Existing Diseases (Optional)</label>
                    <textarea
                      name="preExistingDisease"
                      value={formData.preExistingDisease}
                      onChange={handleChange}
                      placeholder="Any medical conditions..."
                      className="w-full px-4 py-3 bg-white border-[1px] border-black rounded-none text-[15px] font-medium text-gray-900 focus:border-[#3AB000] outline-none transition-all min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <SectionHeader icon={Building2} title="Nominee & Financials" desc="Account & Security Details" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InputField label="Nominee Name" name="nomineeName" formData={formData} handleChange={handleChange} required placeholder="Full Name" />
                  <InputField label="Nominee Relation" name="nomineeRelation" formData={formData} handleChange={handleChange} required options={relationOptions} />
                  <InputField label="Bank Name" name="bankName" formData={formData} handleChange={handleChange} options={bankOptions} />
                  <InputField label="Account Number" name="accountNumber" formData={formData} handleChange={handleChange} placeholder="Account digits" />
                  <InputField label="IFSC Code" name="ifscCode" formData={formData} handleChange={handleChange} placeholder="SBIN0001234" />
                  <InputField label="Branch Name" name="branchName" formData={formData} handleChange={handleChange} placeholder="Branch location" />
                </div>
              </div>

            </div>

            <div className="bg-gray-50 px-8 lg:px-12 py-8 flex items-center justify-between border-t border-gray-100">
              <div className="hidden md:flex items-center gap-2 text-[#3AB000]">
                <ShieldCheck size={18} className="fill-current" />
                <p className="text-[10px] font-black tracking-widest italic">Member Protection Scheme</p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => navigate("/employee/cards")}
                  className="flex-1 md:flex-none px-8 py-3.5 rounded-none font-black text-gray-500 hover:bg-gray-100 transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 md:flex-none flex items-center justify-center gap-3 px-12 py-3.5 bg-[#3AB000] text-white rounded-none font-black text-sm hover:bg-[#2d8a00] transition-all disabled:opacity-70 tracking-widest border border-[#2d8a00]"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Update Card
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <PhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onImageSelect={(imageData) => setFormData(prev => ({ ...prev, photo: imageData }))}
      />
    </DashboardLayout>
  );
};

export default EditCard;
