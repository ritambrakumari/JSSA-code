import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../../auth/auth";
import { useAuth } from "../../auth/AuthProvider";
import { CheckCircle2, LogOut, Plus, Trash2 } from "lucide-react";
import { pharmaciesAPI, uploadAPI } from "../../utils/api";
import indianStates from "../../data/states.json";
import indianDistricts from "../../data/district.json";
import logo from "../../assets/jssa-logo-long.png";

const GREEN = "#0aca00";

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

const PharmacyOnboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pharmacy, setPharmacy] = useState(null);
  const { role } = useAuth();

  const [states, setStates] = useState(indianStates.states || indianStates);
  const [districts, setDistricts] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(null);

  const [formData, setFormData] = useState({
    // General Info
    fatherName: "", panNumber: "", aadharNumber: "",
    gender: "Male",
    country: "India / भारत", state: "", district: "",
    blockKhand: "", gramPanchayat: "", pincode: "",
    fullAddress: "",
    
    // Pharmacy Specific
    shopName: "", licenseNumber: "", gstNumber: "",
    pharmacistName: "", pharmacistRegNumber: "",
    shopAddress: "",

    // Bank
    accountHolderName: "", bankName: "", accountNumber: "", ifscCode: "", branchName: "",
    
    // Docs
    aadharFront: null, aadharBack: null, panCard: null, bankDoc: null,
    shopPhoto: null, licenseDoc: null, signature: null,
    
    agreeToTerms: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await pharmaciesAPI.getProfile();
        if (res.success && res.pharmacy) {
          setPharmacy(res.pharmacy);
          setFormData(prev => ({ 
            ...prev, 
            accountHolderName: res.pharmacy.name || "",
            shopName: res.pharmacy.shopName || ""
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

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const handleSubmit = async () => {
    if (!formData.agreeToTerms) return alert("Please agree to the declaration.");
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        onboardingComplete: true,
        status: "Active"
      };
      
      const res = await pharmaciesAPI.submitOnboarding(payload);
      if (res.success) {
        alert("Onboarding Complete!");
        window.location.href = "/pharmacy/dashboard";
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
      <div className="bg-[#0aca00] px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white font-black text-xs">JSSA</span>
          </div>
          <span className="text-white font-black text-sm uppercase tracking-wide">Pharmacy Activation Form</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/40 text-white px-3 py-1.5 rounded text-xs font-black uppercase transition-all"
        >
          <LogOut size={14} /> Logout
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 bg-white min-h-screen shadow-xl border-x border-gray-200">
        
        <div className="flex flex-col items-center mb-8 border-b-[3px] border-green-600 pb-8">
          <img src={logo} alt="JSSA Logo" className="h-24 md:h-28 mb-6 object-contain drop-shadow-sm" />
          <h1 className="text-2xl md:text-3xl font-black text-green-700 uppercase tracking-wider text-center">
            Pharmacy Activation Form
          </h1>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-widest mt-1">
            फार्मेसी सक्रियण प्रपत्र
          </h2>
          <div className="mt-4 text-sm font-bold text-gray-700 bg-gray-100 px-6 py-2 rounded-lg border border-gray-300">
            Applicant: {pharmacy?.name} | Mobile: {pharmacy?.userId?.phone}
          </div>
        </div>

        <div className="bg-[#f5f5f5] p-6 rounded-lg border border-gray-200">
          <div className="text-center mb-8">
            <p className="text-[11px] font-semibold text-gray-500 mb-1">
              Pharmacy Activation Form — Jan Swasthya Sahayata Abhiyan
            </p>
          </div>

          <FormSectionHeader en="Personal Details" hi="व्यक्तिगत विवरण" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <FormLabel en="Full Name" hi="पूरा नाम" required />
                <FormInput value={pharmacy?.name} readOnly />
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

            <FormSectionHeader en="Address Details" hi="पता विवरण" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <FormLabel en="State" hi="राज्य" required />
                <FormSelect
                  options={states}
                  value={formData.state}
                  onChange={handleStateChange}
                />
              </div>
              <div>
                <FormLabel en="District" hi="जिला" required />
                <FormSelect
                  options={districts}
                  value={formData.district}
                  onChange={handleDistrictChange}
                  disabled={!formData.state}
                />
              </div>
              <div>
                <FormLabel en="Block/Khand" hi="प्रखंड/खंड" required />
                <FormInput
                  value={formData.blockKhand}
                  onChange={(e) => setFormData({ ...formData, blockKhand: e.target.value })}
                />
              </div>
              <div>
                <FormLabel en="Pincode" hi="पिनकोड" required />
                <FormInput
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <FormLabel en="Full Address" hi="पूरा पता" required />
                <FormInput
                  value={formData.fullAddress}
                  onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                />
              </div>
            </div>

            <FormSectionHeader en="Pharmacy / Shop Details" hi="फार्मेसी / दुकान विवरण" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FormLabel en="Shop Name" hi="दुकान का नाम" required />
                <FormInput
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                />
              </div>
              <div>
                <FormLabel en="License Number" hi="लाइसेंस नंबर" required />
                <FormInput
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                />
              </div>
              <div>
                <FormLabel en="Pharmacist Name" hi="फार्मासिस्ट का नाम" required />
                <FormInput
                  value={formData.pharmacistName}
                  onChange={(e) => setFormData({ ...formData, pharmacistName: e.target.value })}
                />
              </div>
              <div>
                <FormLabel en="Pharmacist Registration No" hi="फार्मासिस्ट पंजीकरण संख्या" required />
                <FormInput
                  value={formData.pharmacistRegNumber}
                  onChange={(e) => setFormData({ ...formData, pharmacistRegNumber: e.target.value })}
                />
              </div>
              <div>
                <FormLabel en="GST Number (Optional)" hi="जीएसटी नंबर (वैकल्पिक)" />
                <FormInput
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <FormLabel en="Shop Address" hi="दुकान का पता" required />
                <FormInput
                  value={formData.shopAddress}
                  onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
                />
              </div>
            </div>

            <FormSectionHeader en="Bank Details" hi="बैंक विवरण" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div>
                <FormLabel en="Branch Name" hi="शाखा का नाम" required />
                <FormInput
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                />
              </div>
            </div>

            <FormSectionHeader en="Documents Upload" hi="दस्तावेज़ अपलोड" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: "aadharFront", labelEn: "Aadhar Front", labelHi: "आधार का सामने का भाग" },
                { key: "aadharBack", labelEn: "Aadhar Back", labelHi: "आधार का पीछे का भाग" },
                { key: "panCard", labelEn: "PAN Card", labelHi: "पैन कार्ड" },
                { key: "bankDoc", labelEn: "Bank Passbook/Cheque", labelHi: "बैंक पासबुक/चेक" },
                { key: "shopPhoto", labelEn: "Shop Front Photo", labelHi: "दुकान की सामने की फोटो" },
                { key: "licenseDoc", labelEn: "Pharmacy License", labelHi: "फार्मेसी लाइसेंस" },
                { key: "signature", labelEn: "Signature", labelHi: "हस्ताक्षर" }
              ].map((doc) => (
                <div key={doc.key} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col items-center text-center">
                  <FormLabel en={doc.labelEn} hi={doc.labelHi} required />
                  {formData[doc.key] ? (
                    <div className="mt-2 text-green-600 flex flex-col items-center gap-1">
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
                  className="mt-1 w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
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
                className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default PharmacyOnboarding;
