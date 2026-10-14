import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../../auth/auth";
import { useAuth } from "../../auth/AuthProvider";
import { CheckCircle2, LogOut, Plus, Trash2 } from "lucide-react";
import { doctorsAPI, uploadAPI } from "../../utils/api";
import logo from "../../assets/jssa-logo-long.png";

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

const DoctorOnboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const { role } = useAuth();
  const [uploadingDoc, setUploadingDoc] = useState(null);

  const [formData, setFormData] = useState({
    // Initial fields from Admin (Pre-filled)
    name: "",
    personalMobile: "",
    email: "",
    specification: [],
    
    // Personal Details
    fatherName: "", 
    gender: "Male",
    clinicName: "",
    clinicAddress: "",
    
    // Professional Details
    medicalRegNo: "",
    experience: [],
    qualifications: [],
    
    // Bank & ID Details
    aadharNumber: "", 
    panNumber: "",
    accountHolderName: "", 
    bankName: "", 
    accountNumber: "", 
    ifscCode: "",
    
    // Docs
    image: null,
    aadharFront: null, 
    aadharBack: null, 
    panCardDoc: null, 
    medicalDegreeDoc: null,
    medicalRegDoc: null,
    bankPassbookDoc: null, 
    signatureDoc: null,
    
    agreeToTerms: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await doctorsAPI.getProfile();
        if (res.success && res.doctor) {
          setDoctor(res.doctor);
          setFormData(prev => ({ 
            ...prev, 
            name: res.doctor.name || "",
            personalMobile: res.doctor.personalMobile || "",
            email: res.doctor.email || "",
            specification: res.doctor.specification?.length > 0 ? res.doctor.specification : [""],
            experience: Array.isArray(res.doctor.experience) ? res.doctor.experience : [],
            qualifications: Array.isArray(res.doctor.qualifications) ? res.doctor.qualifications : [],
            accountHolderName: res.doctor.name || "",
            clinicName: res.doctor.clinicName || "",
            clinicAddress: res.doctor.clinicAddress || "",
            image: res.doctor.image || null
          }));
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

  const handleArrayDocUpload = async (e, arrayName, index) => {
    const file = e.target.files[0];
    if (!file) return;
    const typeKey = `${arrayName}-${index}`;
    setUploadingDoc(typeKey);
    try {
      const res = await uploadAPI.uploadMOUDucument(file, "document"); // Generic type for upload
      if (res.success) {
        setFormData(prev => {
          const newArray = [...prev[arrayName]];
          newArray[index] = { ...newArray[index], docUrl: res.data.url };
          return { ...prev, [arrayName]: newArray };
        });
      } else {
        alert(res.error || "Upload failed");
      }
    } catch (err) {
      alert("Upload error");
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const handleSubmit = async () => {
    // Basic Validation
    if (!formData.name || !formData.personalMobile || !formData.fatherName || !formData.gender || !formData.email || !formData.clinicName || !formData.clinicAddress) {
      return alert("Please fill all required Personal Details (including Clinic/Hospital Name and Address).");
    }
    if (formData.specification.length === 0 || !formData.specification[0]) {
      return alert("Please add at least one Specialization.");
    }
    if (!formData.medicalRegNo || !formData.aadharNumber || !formData.panNumber) {
      return alert("Please fill all required Professional & Identity Details.");
    }
    if (!formData.accountHolderName || !formData.bankName || !formData.accountNumber || !formData.ifscCode) {
      return alert("Please fill all required Bank Details.");
    }
    if (formData.experience.length === 0) {
      return alert("Please add at least one Experience record.");
    }
    for (let exp of formData.experience) {
      if (!exp.orgName || !exp.detail || !exp.startDate || !exp.totalExperience) {
        return alert("Please fill all required fields in Experience.");
      }
    }
    if (formData.qualifications.length === 0) {
      return alert("Please add at least one Qualification record.");
    }
    for (let qual of formData.qualifications) {
      if (!qual.degreeName || !qual.universityName || !qual.passingYear) {
        return alert("Please fill all required fields in Qualifications.");
      }
    }
    if (!formData.aadharFront || !formData.aadharBack || !formData.panCardDoc || !formData.medicalDegreeDoc || !formData.medicalRegDoc || !formData.bankPassbookDoc || !formData.signatureDoc) {
      return alert("Please upload all required documents.");
    }
    if (!formData.agreeToTerms) return alert("Please agree to the declaration.");
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
      };
      
      const res = await doctorsAPI.submitOnboarding(payload);
      if (res.success) {
        alert("Onboarding Complete!");
        window.location.href = "/doctor/dashboard";
      } else {
        alert(res.error || "Submission failed");
      }
    } catch (err) {
      alert("Error submitting form");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-[#3AB000] px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white font-black text-xs">JSSA</span>
          </div>
          <span className="text-white font-black text-sm uppercase tracking-wide">Doctor Activation Form</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/40 text-white px-3 py-1.5 rounded text-xs font-black uppercase transition-all"
        >
          <LogOut size={14} /> Logout
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 bg-white min-h-screen shadow-xl border-x border-gray-200">
        
        <div className="flex flex-col items-center mb-8 border-b-[3px] border-[#3AB000] pb-8">
          <img src={logo} alt="JSSA Logo" className="h-24 md:h-28 mb-6 object-contain drop-shadow-sm" />
          <h1 className="text-2xl md:text-3xl font-black text-[#2d8a00] uppercase tracking-wider text-center">
            Doctor Activation Form
          </h1>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-widest mt-1">
            डॉक्टर सक्रियण प्रपत्र
          </h2>
          <div className="mt-4 text-sm font-bold text-gray-700 bg-gray-100 px-6 py-2 rounded-lg border border-gray-300">
            Applicant: {doctor?.name} | Mobile: {doctor?.personalMobile}
          </div>
        </div>

        <div className="bg-[#f5f5f5] p-6 rounded-lg border border-gray-200">
          <FormSectionHeader en="Personal Details" hi="व्यक्तिगत विवरण" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <FormLabel en="Full Name" hi="पूरा नाम" required />
              <FormInput value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <FormLabel en="Personal Mobile" hi="मोबाइल नंबर" required />
              <FormInput value={formData.personalMobile} readOnly />
            </div>
            <div>
              <FormLabel en="Email ID" hi="ईमेल" required />
              <FormInput value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <FormLabel en="Father's Name" hi="पिता का नाम" required />
              <FormInput
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
              />
            </div>
            <div>
              <FormLabel en="Gender" hi="लिंग" required />
              <FormSelect
                options={["Male", "Female", "Other"]}
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              />
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <FormLabel en="Clinic / Hospital Name" hi="क्लिनिक / अस्पताल का नाम" required />
              <FormInput
                value={formData.clinicName}
                onChange={(e) => setFormData({...formData, clinicName: e.target.value})}
                placeholder="Enter Clinic or Hospital Name..."
              />
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <FormLabel en="Clinic / Hospital Address" hi="क्लिनिक / अस्पताल का पता" required />
              <textarea
                value={formData.clinicAddress}
                onChange={(e) => setFormData({...formData, clinicAddress: e.target.value})}
                placeholder="Enter complete clinic/hospital address..."
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm resize-y min-h-[80px]"
              />
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <FormLabel en="Specialization" hi="विशेषज्ञता" required />
              <div className="space-y-2">
                {formData.specification.map((spec, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <FormInput
                      value={spec}
                      onChange={(e) => {
                        const newSpecs = [...formData.specification];
                        newSpecs[index] = e.target.value;
                        setFormData({ ...formData, specification: newSpecs });
                      }}
                      placeholder="e.g. Cardiologist"
                    />
                    {formData.specification.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newSpecs = formData.specification.filter((_, i) => i !== index);
                          setFormData({ ...formData, specification: newSpecs });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, specification: [...formData.specification, ""] })}
                  className="flex items-center gap-1 text-sm text-[#3AB000] font-semibold hover:underline"
                >
                  <Plus size={16} /> Add Specialization
                </button>
              </div>
            </div>
          </div>

          <FormSectionHeader en="Professional & Identity Details" hi="व्यावसायिक और पहचान विवरण" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FormLabel en="Medical Registration No" hi="चिकित्सा पंजीकरण संख्या" required />
              <FormInput
                value={formData.medicalRegNo}
                onChange={(e) => setFormData({ ...formData, medicalRegNo: e.target.value })}
              />
            </div>

            <div>
              <FormLabel en="Aadhar Number" hi="आधार नंबर" required />
              <FormInput
                value={formData.aadharNumber}
                onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
              />
            </div>
            <div>
              <FormLabel en="PAN Number" hi="पैन नंबर" required />
              <FormInput
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
              />
            </div>
          </div>

          <FormSectionHeader en="Bank Details" hi="बैंक विवरण" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FormLabel en="Account Holder Name" hi="खाता धारक का नाम" required />
              <FormInput
                value={formData.accountHolderName}
                onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
              />
            </div>
            <div>
              <FormLabel en="Bank Name" hi="बैंक का नाम" required />
              <FormInput
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              />
            </div>
            <div>
              <FormLabel en="Account Number" hi="खाता संख्या" required />
              <FormInput
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              />
            </div>
            <div>
              <FormLabel en="IFSC Code" hi="आईएफएससी कोड" required />
              <FormInput
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
              />
            </div>
          </div>

          <FormSectionHeader en="Experience & Qualifications" hi="अनुभव और योग्यता" />
          
          {/* Experience Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">Experience / अनुभव <span className="text-red-500">*</span></h3>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, experience: [...prev.experience, { orgName: "", detail: "", startDate: "", endDate: "", totalExperience: "", docUrl: "" }] }))}
                className="flex items-center gap-1 text-sm text-[#3AB000] font-semibold hover:underline"
              >
                <Plus size={16} /> Add Experience
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.experience.map((exp, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white relative shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      const newExp = formData.experience.filter((_, i) => i !== index);
                      setFormData(prev => ({ ...prev, experience: newExp }));
                    }}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mr-8">
                    <div>
                      <FormLabel en="Hospital/Org Name" hi="अस्पताल का नाम" required />
                      <FormInput value={exp.orgName} onChange={(e) => {
                        const newExp = [...formData.experience];
                        newExp[index].orgName = e.target.value;
                        setFormData({ ...formData, experience: newExp });
                      }} />
                    </div>
                    <div>
                      <FormLabel en="Detail" hi="विवरण" required />
                      <FormInput value={exp.detail} onChange={(e) => {
                        const newExp = [...formData.experience];
                        newExp[index].detail = e.target.value;
                        setFormData({ ...formData, experience: newExp });
                      }} />
                    </div>
                    <div>
                      <FormLabel en="Start Date" hi="प्रारंभ तिथि" required />
                      <FormInput type="date" value={exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : ''} onChange={(e) => {
                        const newExp = [...formData.experience];
                        newExp[index].startDate = e.target.value;
                        setFormData({ ...formData, experience: newExp });
                      }} />
                    </div>
                    <div>
                      <FormLabel en="End Date" hi="अंतिम तिथि" />
                      <FormInput type="date" value={exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : ''} onChange={(e) => {
                        const newExp = [...formData.experience];
                        newExp[index].endDate = e.target.value;
                        setFormData({ ...formData, experience: newExp });
                      }} />
                    </div>
                    <div>
                      <FormLabel en="Total Experience" hi="कुल अनुभव" required />
                      <FormInput value={exp.totalExperience} onChange={(e) => {
                        const newExp = [...formData.experience];
                        newExp[index].totalExperience = e.target.value;
                        setFormData({ ...formData, experience: newExp });
                      }} />
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-2 bg-gray-50 flex flex-col items-center text-center">
                      <FormLabel en="Experience Doc" hi="दस्तावेज़" />
                      {exp.docUrl ? (
                        <div className="mt-1 text-[#3AB000] flex flex-col items-center gap-1">
                          <CheckCircle2 size={24} />
                          <span className="text-xs font-semibold">Uploaded</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newExp = [...formData.experience];
                              newExp[index].docUrl = "";
                              setFormData({ ...formData, experience: newExp });
                            }}
                            className="text-[10px] text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1 w-full">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            id={`exp-doc-${index}`}
                            className="hidden"
                            onChange={(e) => handleArrayDocUpload(e, "experience", index)}
                          />
                          <label
                            htmlFor={`exp-doc-${index}`}
                            className="w-full inline-block py-1.5 px-3 bg-white border border-gray-300 rounded text-xs text-gray-700 cursor-pointer hover:bg-gray-100"
                          >
                            {uploadingDoc === `experience-${index}` ? "Uploading..." : "Select File"}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Qualification Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">Qualifications / योग्यता <span className="text-red-500">*</span></h3>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, qualifications: [...prev.qualifications, { degreeName: "", universityName: "", passingYear: "", pr: "", docUrl: "" }] }))}
                className="flex items-center gap-1 text-sm text-[#3AB000] font-semibold hover:underline"
              >
                <Plus size={16} /> Add Qualification
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.qualifications.map((qual, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white relative shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      const newQual = formData.qualifications.filter((_, i) => i !== index);
                      setFormData(prev => ({ ...prev, qualifications: newQual }));
                    }}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mr-8">
                    <div>
                      <FormLabel en="Degree Name" hi="डिग्री का नाम" required />
                      <FormInput value={qual.degreeName} onChange={(e) => {
                        const newQual = [...formData.qualifications];
                        newQual[index].degreeName = e.target.value;
                        setFormData({ ...formData, qualifications: newQual });
                      }} />
                    </div>
                    <div>
                      <FormLabel en="University Name" hi="विश्वविद्यालय" required />
                      <FormInput value={qual.universityName} onChange={(e) => {
                        const newQual = [...formData.qualifications];
                        newQual[index].universityName = e.target.value;
                        setFormData({ ...formData, qualifications: newQual });
                      }} />
                    </div>
                    <div>
                      <FormLabel en="Passing Year" hi="उत्तीर्ण वर्ष" required />
                      <FormInput type="number" value={qual.passingYear} onChange={(e) => {
                        const newQual = [...formData.qualifications];
                        newQual[index].passingYear = e.target.value;
                        setFormData({ ...formData, qualifications: newQual });
                      }} />
                    </div>
                    <div>
                      <FormLabel en="PR" hi="पीआर" />
                      <FormInput value={qual.pr} onChange={(e) => {
                        const newQual = [...formData.qualifications];
                        newQual[index].pr = e.target.value;
                        setFormData({ ...formData, qualifications: newQual });
                      }} />
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-2 bg-gray-50 flex flex-col items-center text-center">
                      <FormLabel en="Degree Doc" hi="दस्तावेज़" />
                      {qual.docUrl ? (
                        <div className="mt-1 text-[#3AB000] flex flex-col items-center gap-1">
                          <CheckCircle2 size={24} />
                          <span className="text-xs font-semibold">Uploaded</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newQual = [...formData.qualifications];
                              newQual[index].docUrl = "";
                              setFormData({ ...formData, qualifications: newQual });
                            }}
                            className="text-[10px] text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1 w-full">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            id={`qual-doc-${index}`}
                            className="hidden"
                            onChange={(e) => handleArrayDocUpload(e, "qualifications", index)}
                          />
                          <label
                            htmlFor={`qual-doc-${index}`}
                            className="w-full inline-block py-1.5 px-3 bg-white border border-gray-300 rounded text-xs text-gray-700 cursor-pointer hover:bg-gray-100"
                          >
                            {uploadingDoc === `qualifications-${index}` ? "Uploading..." : "Select File"}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <FormSectionHeader en="Documents Upload" hi="दस्तावेज़ अपलोड" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { key: "image", labelEn: "Profile Photo", labelHi: "प्रोफ़ाइल फ़ोटो" },
              { key: "aadharFront", labelEn: "Aadhar Front", labelHi: "आधार का सामने का भाग" },
              { key: "aadharBack", labelEn: "Aadhar Back", labelHi: "आधार का पीछे का भाग" },
              { key: "panCardDoc", labelEn: "PAN Card", labelHi: "पैन कार्ड" },
              { key: "medicalDegreeDoc", labelEn: "Medical Degree", labelHi: "मेडिकल डिग्री" },
              { key: "medicalRegDoc", labelEn: "Registration Certificate", labelHi: "पंजीकरण प्रमाणपत्र" },
              { key: "bankPassbookDoc", labelEn: "Bank Passbook/Cheque", labelHi: "बैंक पासबुक/चेक" },
              { key: "signatureDoc", labelEn: "Signature", labelHi: "हस्ताक्षर" }
            ].map((doc) => (
              <div key={doc.key} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col items-center text-center">
                <FormLabel en={doc.labelEn} hi={doc.labelHi} required />
                {formData[doc.key] ? (
                  <div className="mt-2 text-[#3AB000] flex flex-col items-center gap-1">
                    <CheckCircle2 size={32} />
                    <span className="text-sm font-semibold">Uploaded</span>
                    <button
                      onClick={() => setFormData({ ...formData, [doc.key]: null })}
                      className="text-xs text-red-500 mt-2 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 w-full">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      id={doc.key}
                      className="hidden"
                      onChange={(e) => handleDocUpload(e, doc.key)}
                    />
                    <label
                      htmlFor={doc.key}
                      className="w-full inline-block py-2 px-4 bg-white border border-gray-300 rounded text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                    >
                      {uploadingDoc === doc.key ? "Uploading..." : "Select File"}
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 w-5 h-5 text-[#3AB000] rounded border-gray-300 focus:ring-green-500"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
              />
              <span className="text-sm text-gray-700">
                <strong className="block mb-1 text-gray-900">Declaration / घोषणा</strong>
                I hereby declare that all the information and documents provided are true and correct to the best of my knowledge. / मैं घोषणा करता/करती हूँ कि दी गई सभी जानकारी और दस्तावेज़ मेरी जानकारी के अनुसार सत्य और सही हैं।
              </span>
            </label>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.agreeToTerms}
              className="px-8 py-3 bg-[#3AB000] text-white font-bold rounded-lg hover:bg-[#2d8a00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorOnboarding;
