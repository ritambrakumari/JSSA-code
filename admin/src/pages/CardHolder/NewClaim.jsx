import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { claimsAPI, cardAPI } from "../../utils/api";
import toast from "react-hot-toast";
import {
  FileUp, XCircle, Loader2, ShieldAlert, Plus
} from "lucide-react";

const InputField = ({ label, name, type = "text", required = true, placeholder = "", disabled = false, formData, handleInputChange, isTextarea = false }) => (
  <div className="space-y-1.5">
    <label className="text-[13px] md:text-sm font-bold text-gray-700 block mb-1">
      {label} {required && <span className="text-red-500 inline-block ml-0.5">*</span>}
    </label>
    {isTextarea ? (
      <textarea
        name={name} value={formData[name] || ""} onChange={handleInputChange} required={required} placeholder={placeholder} disabled={disabled} rows={3}
        className={`w-full px-4 py-2.5 bg-white border border-gray-300 rounded-sm focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] outline-none transition-all text-gray-900 font-medium text-sm shadow-sm resize-y ${disabled ? 'opacity-70 cursor-not-allowed bg-gray-50 text-gray-600' : ''}`}
      ></textarea>
    ) : (
      <input
        type={type} name={name} value={formData[name] || ""} onChange={handleInputChange} required={required} placeholder={placeholder} disabled={disabled}
        className={`w-full px-4 py-2.5 bg-white border border-gray-300 rounded-sm focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] outline-none transition-all text-gray-900 font-medium text-sm shadow-sm ${disabled ? 'opacity-70 cursor-not-allowed bg-gray-50 text-gray-600' : ''}`}
      />
    )}
  </div>
);

const FileUploadField = ({ label, helperText, name, required = false, files, handleFileChange, multiple = false, removeFile }) => {
  const isMultipleAndHasFiles = multiple && Array.isArray(files[name]) && files[name].length > 0;
  return (
    <div className="flex flex-col h-full justify-end space-y-1.5">
      <div className="mb-auto">
        <label className="text-[13px] md:text-sm font-bold text-gray-700 inline-block mb-0.5">
          {label} {required && <span className="text-red-500 inline-block ml-0.5">*</span>}
        </label>
        {helperText && <p className="text-[11px] text-gray-500 font-medium leading-tight mb-1">{helperText}</p>}
      </div>
      <input type="file" multiple={multiple} onChange={(e) => handleFileChange(e, name, multiple)} className="hidden" id={`file-${name}`} accept="image/*,.pdf" />

      {!isMultipleAndHasFiles ? (
        <label htmlFor={`file-${name}`} className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-sm cursor-pointer hover:border-[#3AB000] hover:bg-green-50/30 transition-all group shadow-sm mt-auto">
          <span className={`text-sm truncate pr-4 font-medium ${files[name] ? "text-[#3AB000]" : "text-gray-500"}`}>
            {files[name] ? files[name].name : "Choose file..."}
          </span>
          <div className={`px-3 py-1.5 rounded-sm flex-shrink-0 flex items-center gap-1.5 transition-colors ${files[name] ? "bg-[#3AB000]/10 text-[#3AB000] group-hover:bg-[#3AB000] group-hover:text-white" : "bg-gray-100 text-gray-600 group-hover:bg-[#3AB000]/10 group-hover:text-[#3AB000]"}`}>
            <FileUp size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">{files[name] ? "Change" : "Upload"}</span>
          </div>
        </label>
      ) : (
        <div className="flex flex-col gap-2 mt-auto">
          {files[name].map((file, idx) => (
            <div key={idx} className="flex items-center justify-between bg-green-50/50 border border-[#3AB000]/30 px-3 py-2 rounded-sm shadow-sm">
              <span className="text-xs font-medium text-[#3AB000] truncate max-w-[200px]">{file.name}</span>
              <button type="button" onClick={() => removeFile && removeFile(name, idx)} className="text-red-400 hover:text-red-600 transition-colors">
                <XCircle size={16} />
              </button>
            </div>
          ))}
          {files[name].length < 3 && (
            <label htmlFor={`file-${name}`} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-dashed border-[#3AB000] rounded-sm cursor-pointer hover:bg-green-50/50 transition-all text-[#3AB000] shadow-sm">
              <Plus size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Add Another File</span>
            </label>
          )}
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ title }) => (
  <div className="bg-[#3AB000] text-white px-5 py-3 mb-6 rounded-sm shadow-md flex items-center justify-between">
    <h3 className="text-sm font-black uppercase tracking-wide">{title}</h3>
  </div>
);

const NewClaim = () => {
  const [submitting, setSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [myCards, setMyCards] = useState([]);
  const [userClaims, setUserClaims] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [isCardBlocked, setIsCardBlocked] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    cardHolderName: "", relation: "", healthCardNumber: "", mobileNumber: "", email: "",
    aadhaarNumber: "", panNumber: "", bankName: "", accountNumber: "", ifscCode: "",
    branch: "", address: "", totalMedicalExpenses: ""
  });

  const [files, setFiles] = useState({
    healthCardCopy: null, firCopy: null, passportPhotos: null, consultationFeeBill: null,
    aadhaarFront: null, aadhaarBack: null, panFront: null, bankPassbook: null,
    doctorReport: null, dischargeSummary: null, hospitalBills: null,
    diagnosticReports: null, labBills: null, pharmacyBills: null, claimForm: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cardRes, claimRes] = await Promise.all([
          cardAPI.getMyCard(true),
          claimsAPI.getMyClaims({ limit: 100 })
        ]);
        if (cardRes.success && cardRes.data) {
          setMyCards(cardRes.data);
        }
        if (claimRes.success && claimRes.data) {
          setUserClaims(claimRes.data);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, fieldName, multiple = false) => {
    if (multiple) {
      const selectedFiles = Array.from(e.target.files);
      const currentFiles = files[fieldName] || [];
      const newFiles = [...currentFiles, ...selectedFiles];
      if (newFiles.length > 3) {
        toast.error("You can upload a maximum of 3 files.");
        e.target.value = null;
        return;
      }
      let valid = true;
      selectedFiles.forEach(file => {
        if (file.size > 20 * 1024 * 1024 || !['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type)) {
          valid = false;
        }
      });
      if (!valid) {
        toast.error("Invalid files. Ensure max 20MB and only JPG, PNG, PDF formats.");
        e.target.value = null;
        return;
      }
      setFiles({ ...files, [fieldName]: newFiles.length > 0 ? newFiles : null });
    } else {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`File size too large! Maximum allowed is 20MB.`);
          e.target.value = null;
          return;
        }
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`Invalid format! Only JPG, PNG, and PDF are allowed.`);
          e.target.value = null;
          return;
        }
        setFiles({ ...files, [fieldName]: file });
      }
    }
  };
  const removeFile = (fieldName, index) => {
    if (Array.isArray(files[fieldName])) {
      const newFiles = files[fieldName].filter((_, i) => i !== index);
      setFiles({ ...files, [fieldName]: newFiles.length > 0 ? newFiles : null });
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCardId) {
      toast.error("Please select a linked card");
      return;
    }

    const requiredDocs = [
      'healthCardCopy', 'aadhaarFront', 'aadhaarBack', 'panFront',
      'bankPassbook', 'doctorReport', 'consultationFeeBill', 'claimForm',
      'dischargeSummary', 'hospitalBills', 'diagnosticReports', 'labBills',
      'pharmacyBills'
    ];
    for (let doc of requiredDocs) {
      if (!files[doc]) {
        toast.error(`Please upload all mandatory documents (${doc} is missing)`);
        return;
      }
    }
    if (!files['passportPhotos'] || files['passportPhotos'].length !== 3) {
      toast.error("Please upload exactly 3 passport-size photographs.");
      return;
    }

    try {
      setSubmitting(true);
      const submitData = new FormData();
      submitData.append("cardId", selectedCardId);

      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      Object.keys(files).forEach(key => {
        if (files[key]) {
          if (Array.isArray(files[key])) {
            files[key].forEach(f => submitData.append(key, f));
          } else {
            submitData.append(key, files[key]);
          }
        }
      });

      const res = await claimsAPI.submit(submitData);
      if (res.success) {
        toast.success("Claim application submitted successfully");
        navigate("/claims");
      }
    } catch (err) {
      toast.error(err.message || "Failed to submit claim");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="bg-gray-100 min-h-full w-full py-8 px-4 md:px-8">
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] bg-white border border-gray-200 shadow-xl rounded-sm">
            <Loader2 className="animate-spin text-[#3AB000] mb-4" size={48} />
            <p className="text-gray-600 font-bold uppercase tracking-widest text-sm">Loading Application Form...</p>
            <p className="text-gray-400 text-xs mt-2">Fetching your health card details</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto bg-white border border-gray-200 shadow-2xl rounded-sm overflow-hidden relative">

            {/* Top colored bar for formal look */}
            <div className="h-2 w-full bg-[#3AB000]"></div>

            <div className="border-b border-gray-200 px-6 md:px-10 py-6 md:py-8 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-[#3AB000]/10 rounded-full flex items-center justify-center border-2 border-[#3AB000]/20 flex-shrink-0">
                  <ShieldAlert className="text-[#3AB000]" size={32} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">Medical Claim Application</h1>
                  <p className="text-sm text-gray-600 mt-1 font-semibold">Official Form for Health Card Beneficiaries</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/claims')}
                className="flex items-center justify-center gap-2 px-6 py-2.5 transition-all text-sm font-bold shadow-sm bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-sm"
              >
                <XCircle size={18} /> Cancel
              </button>
            </div>

            <div className="px-6 md:px-10 py-8 bg-white">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-sm mb-8 flex items-start gap-3">
                <ShieldAlert className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide">Important Instructions / महत्वपूर्ण निर्देश</h4>
                  <p className="text-xs text-amber-700 mt-1 font-medium leading-relaxed">
                    Please fill all the details carefully. Ensure that the name, bank details, and Aadhaar numbers match your official documents exactly. All uploaded documents must be clear and legible. Mandatory fields are marked with an asterisk (*).
                  </p>
                  <p className="text-xs text-amber-700 mt-2 font-medium leading-relaxed border-t border-amber-200/50 pt-2">
                    कृपया सभी विवरण सावधानी से भरें। सुनिश्चित करें कि नाम, बैंक विवरण और आधार संख्या आपके आधिकारिक दस्तावेजों से बिल्कुल मेल खाते हैं। अपलोड किए गए सभी दस्तावेज स्पष्ट होने चाहिए। अनिवार्य फ़ील्ड को तारांकन (*) के साथ चिह्नित किया गया है।
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                {/* Section 1: Card Details */}
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-sm shadow-sm">
                  <SectionHeader title="1. Card & Beneficiary Selection / कार्ड और लाभार्थी चयन" />
                  <div className="space-y-2 w-full md:w-1/2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-1">Select Linked Health Card / लिंक्ड हेल्थ कार्ड चुनें <span className="text-red-500">*</span></label>
                    <select
                      value={selectedCardId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedCardId(val);
                        const card = myCards.find(c => c._id === val);
                        if (card) {
                          setFormData(prev => ({
                            ...prev,
                            healthCardNumber: card.cardId || "",
                            cardHolderName: card.cardholderName || "",
                            relation: card.fatherOrHusbandName || "",
                            mobileNumber: card.mobileNumber || "",
                            email: card.email || "",
                            aadhaarNumber: card.aadhaarNumber || "",
                            panNumber: card.panNumber || "",
                            bankName: card.bankName || "",
                            accountNumber: card.accountNumber || "",
                            ifscCode: card.ifscCode || "",
                            branch: card.branchName || "",
                            address: [card.addressLine, card.villageCity, card.district, card.state, card.pincode].filter(Boolean).join(", ")
                          }));
                          
                          // --- Card-Level Cooldown Check ---
                          const threeMonthsAgo = new Date();
                          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

                          const cardIdString = card._id.toString();
                          
                          const recentActiveClaim = userClaims.find(c => {
                            const cId = c.card?._id || c.card;
                            if (cId?.toString() !== cardIdString) return false;
                            if (c.isDeleted || c.status === 'rejected') return false;
                            return new Date(c.createdAt) > threeMonthsAgo;
                          });

                          const rejectedRecentClaim = userClaims.find(c => {
                            const cId = c.card?._id || c.card;
                            if (cId?.toString() !== cardIdString) return false;
                            if (c.isDeleted) return false;
                            return c.status === 'rejected' && new Date(c.createdAt) > threeMonthsAgo;
                          });

                          if (recentActiveClaim) {
                            const unlockDate = new Date(recentActiveClaim.createdAt);
                            unlockDate.setMonth(unlockDate.getMonth() + 3);
                            const formattedDate = unlockDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                            setIsCardBlocked(true);
                            setCooldownMessage(`This card is in a 3-month cooldown period. Next claim can be submitted on or after ${formattedDate}.`);
                          } else if (rejectedRecentClaim) {
                            setIsCardBlocked(true);
                            setCooldownMessage(`Your previous claim on this card was rejected. Please go to your Dashboard and click 'Edit & Re-Claim'.`);
                          } else {
                            setIsCardBlocked(false);
                            setCooldownMessage(null);
                          }
                          // ---------------------------------
                        } else {
                          setIsCardBlocked(false);
                          setCooldownMessage(null);
                        }
                      }}
                      required
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-sm focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] outline-none transition-all font-semibold text-gray-900 text-sm shadow-sm cursor-pointer"
                    >
                      <option value="" disabled>-- Select Card --</option>
                      {myCards.map(c => <option key={c._id} value={c._id}>{c.cardholderName} (Card No: {c.cardId})</option>)}
                    </select>
                    {isCardBlocked && cooldownMessage && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-sm flex items-start gap-2">
                        <ShieldAlert className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-xs font-bold text-red-700 leading-tight">
                          {cooldownMessage}
                        </p>
                      </div>
                    )}
                    {!isCardBlocked && selectedCardId && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#3AB000]"></span>
                        <p className="text-xs font-bold text-green-700 uppercase tracking-widest">
                          Card is eligible for claim
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: Personal Details */}
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-sm shadow-sm">
                  <SectionHeader title="2. Personal & Contact Details / व्यक्तिगत और संपर्क विवरण" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {InputField({ label: "Card Holder Name / कार्ड धारक का नाम", name: "cardHolderName", formData, handleInputChange })}
                    {InputField({ label: "S/O, D/O, W/O / पिता/पति का नाम", name: "relation", formData, handleInputChange })}
                    {InputField({ label: "Health Card Number / हेल्थ कार्ड नंबर", name: "healthCardNumber", disabled: true, formData, handleInputChange })}
                    {InputField({ label: "Mobile Number / मोबाइल नंबर", name: "mobileNumber", type: "tel", formData, handleInputChange })}
                    {InputField({ label: "Email Address / ईमेल आईडी", name: "email", type: "email", formData, handleInputChange })}
                    {InputField({ label: "Aadhaar Number / आधार नंबर", name: "aadhaarNumber", formData, handleInputChange })}
                    {InputField({ label: "PAN Number / पैन नंबर", name: "panNumber", required: false, formData, handleInputChange })}
                    <div className="lg:col-span-2">
                      {InputField({ label: "Full Residential Address / पूरा पता", name: "address", formData, handleInputChange, isTextarea: true })}
                    </div>
                  </div>
                </div>

                {/* Section 3: Bank Details */}
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-sm shadow-sm">
                  <SectionHeader title="3. Bank Account Details / बैंक खाता विवरण (भुगतान के लिए)" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {InputField({ label: "Bank Name / बैंक का नाम", name: "bankName", formData, handleInputChange })}
                    {InputField({ label: "Account Number / खाता संख्या", name: "accountNumber", formData, handleInputChange })}
                    {InputField({ label: "IFSC Code / आईएफएससी कोड", name: "ifscCode", formData, handleInputChange })}
                    {InputField({ label: "Branch Name / शाखा का नाम", name: "branch", formData, handleInputChange })}
                  </div>
                </div>

                {/* Section 4: Expense Details */}
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-sm shadow-sm">
                  <SectionHeader title="4. Claim Expense Details / दावा खर्च विवरण" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {InputField({ label: "Total Medical Expenses / कुल चिकित्सा खर्च (₹)", name: "totalMedicalExpenses", type: "number", formData, handleInputChange })}
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 opacity-60">Amount Approved / स्वीकृत राशि</label>
                      <input type="text" disabled placeholder="To be filled by official" className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-sm outline-none text-gray-500 font-semibold text-sm cursor-not-allowed shadow-inner" />
                    </div>
                  </div>
                </div>

                {/* Section 5: Document Uploads */}
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-sm shadow-sm">
                  <SectionHeader title="5. Document Attachments / दस्तावेज़ संलग्नक (Max 10MB)" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {FileUploadField({ label: "Health Card Copy / हेल्थ कार्ड की कॉपी", name: "healthCardCopy", required: true, files, handleFileChange })}
                    {FileUploadField({ label: "Aadhaar Card (Front) / आधार कार्ड (आगे)", name: "aadhaarFront", required: true, files, handleFileChange })}
                    {FileUploadField({ label: "Aadhaar Card (Back) / आधार कार्ड (पीछे)", name: "aadhaarBack", required: true, files, handleFileChange })}
                    {FileUploadField({ label: "PAN Card (Front) / पैन कार्ड (आगे)", name: "panFront", required: true, files, handleFileChange })}
                    {FileUploadField({ label: "Pharmacy Bills / फार्मेसी बिल", name: "pharmacyBills", required: true, files, handleFileChange })}
                    {FileUploadField({ label: "Bank Passbook/Cheque / बैंक पासबुक या चेक", name: "bankPassbook", required: true, files, handleFileChange })}
                    {FileUploadField({ label: "Doctor's Report / डॉक्टर की रिपोर्ट", name: "doctorReport", required: true, files, handleFileChange })}
                    {FileUploadField({ label: "Consultation Fee Bill / डॉक्टर की फीस का बिल", name: "consultationFeeBill", required: true, files, handleFileChange })}
                    {FileUploadField({ label: "Discharge Summary / डिस्चार्ज समरी", name: "dischargeSummary", required: true, files, handleFileChange })}
                    {FileUploadField({ label: "Hospital Bills / अस्पताल के बिल", name: "hospitalBills", required: true, files, handleFileChange })}
                    {FileUploadField({ label: "Diagnostic Reports / डायग्नोस्टिक रिपोर्ट्स", name: "diagnosticReports", required: true, files, handleFileChange })}
                    {FileUploadField({ label: "Laboratory Bills / लेबोरेटरी बिल", name: "labBills", required: true, files, handleFileChange })}
                    {FileUploadField({ label: "Passport-size Photographs (Exactly 3 Copies)", name: "passportPhotos", required: true, multiple: true, files, handleFileChange, removeFile })}
                    {FileUploadField({ label: "FIR Copy / एफआईआर कॉपी (Optional)", name: "firCopy", required: false, files, handleFileChange })}
                    {FileUploadField({
                      label: "Manually Filled Claim Form / हाथ से भरा हुआ क्लेम फॉर्म",
                      helperText: "(Please upload the form you downloaded and filled manually)",
                      name: "claimForm",
                      required: true,
                      files,
                      handleFileChange
                    })}
                  </div>
                </div>

                {/* Declaration and Submit */}
                <div className="bg-[#3AB000]/5 border border-[#3AB000]/30 p-6 rounded-sm flex flex-col items-center text-center space-y-6">
                  <p className="text-xs md:text-sm text-gray-700 font-medium max-w-4xl leading-relaxed">
                    I hereby declare that all the information and documents provided above are true and correct to the best of my knowledge. I understand that any false information may lead to rejection of this claim application.
                  </p>
                  <p className="text-xs md:text-sm text-gray-700 font-medium max-w-4xl leading-relaxed">
                    मैं घोषणा करता/करती हूँ कि ऊपर दी गई सभी जानकारी और दस्तावेज़ मेरी जानकारी के अनुसार सत्य और सही हैं। मैं समझता/समझती हूँ कि कोई भी गलत जानकारी इस दावे को खारिज करने का कारण बन सकती है।
                  </p>
                  <button type="submit" disabled={submitting || isCardBlocked} className={`px-12 py-3.5 text-white text-sm font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 rounded-sm border-2 min-w-[280px] transition-all ${submitting || isCardBlocked ? 'bg-gray-400 border-gray-400 cursor-not-allowed opacity-80' : 'bg-[#3AB000] border-[#3AB000] hover:bg-[#2d8a00] hover:shadow-2xl hover:-translate-y-0.5'}`}>
                    {submitting ? (
                      <><Loader2 className="animate-spin" size={20} /> Processing Application...</>
                    ) : isCardBlocked ? (
                      "Card Blocked"
                    ) : (
                      "Submit Application Form"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NewClaim;
