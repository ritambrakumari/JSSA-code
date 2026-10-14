import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const FileUploadField = ({ label, helperText, name, required = false, files, handleFileChange, existingFileUrl = null, multiple = false, removeFile, removeExistingFile }) => {
  const hasExistingFile = existingFileUrl && existingFileUrl !== "null" && existingFileUrl !== "";
  let existingFileCount = 0;
  let existingFilesArray = [];
  if (hasExistingFile) {
    if (Array.isArray(existingFileUrl)) {
      existingFilesArray = existingFileUrl;
      existingFileCount = existingFileUrl.length;
    } else {
      existingFileCount = 1;
    }
  }
  const isMultiple = multiple;
  const newFilesArray = Array.isArray(files[name]) ? files[name] : [];
  const totalFiles = existingFileCount + newFilesArray.length;

  return (
    <div className="flex flex-col h-full justify-end space-y-1.5">
      <div className="mb-auto">
        <label className="text-[13px] md:text-sm font-bold text-gray-700 inline-block mb-0.5">
          {label} {!hasExistingFile && required && <span className="text-red-500 inline-block ml-0.5">*</span>}
        </label>
        {helperText && <p className="text-[11px] text-gray-500 font-medium leading-tight mb-1">{helperText}</p>}
      </div>
      <input type="file" multiple={multiple} onChange={(e) => handleFileChange(e, name, multiple)} className="hidden" id={`file-${name}`} accept="image/*,.pdf" />
      
      {!isMultiple ? (
        <label htmlFor={`file-${name}`} className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-sm cursor-pointer hover:border-[#3AB000] hover:bg-green-50/30 transition-all group shadow-sm mt-auto" title={hasExistingFile && !files[name] ? existingFileUrl.split('/').pop() : ""}>
          <span className={`text-sm truncate pr-4 font-medium ${files[name] || hasExistingFile ? "text-[#3AB000]" : "text-gray-500"}`}>
            {files[name] ? files[name].name : (hasExistingFile ? existingFileUrl.split('/').pop() : "Choose file...")}
          </span>
          <div className={`px-3 py-1.5 rounded-sm flex-shrink-0 flex items-center gap-1.5 transition-colors ${files[name] || hasExistingFile ? "bg-[#3AB000]/10 text-[#3AB000] group-hover:bg-[#3AB000] group-hover:text-white" : "bg-gray-100 text-gray-600 group-hover:bg-[#3AB000]/10 group-hover:text-[#3AB000]"}`}>
            <FileUp size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">{files[name] || hasExistingFile ? "Change" : "Upload"}</span>
          </div>
        </label>
      ) : (
        <div className="flex flex-col gap-2 mt-auto">
          {existingFilesArray.map((url, idx) => (
            <div key={`exist-${idx}`} className="flex items-center justify-between bg-gray-50 border border-gray-200 px-3 py-2 rounded-sm shadow-sm">
              <span className="text-xs font-medium text-gray-600 truncate max-w-[200px]" title={url.split('/').pop()}>{url.split('/').pop()}</span>
              <button type="button" onClick={() => removeExistingFile && removeExistingFile(name, idx)} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0 ml-2">
                <XCircle size={16} />
              </button>
            </div>
          ))}
          {newFilesArray.map((file, idx) => (
            <div key={`new-${idx}`} className="flex items-center justify-between bg-green-50/50 border border-[#3AB000]/30 px-3 py-2 rounded-sm shadow-sm">
              <span className="text-xs font-medium text-[#3AB000] truncate max-w-[200px]">{file.name}</span>
              <button type="button" onClick={() => removeFile && removeFile(name, idx)} className="text-red-400 hover:text-red-600 transition-colors">
                <XCircle size={16} />
              </button>
            </div>
          ))}
          {totalFiles < 3 && (
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

const EditClaim = () => {
  const { id } = useParams();
  const [submitting, setSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [myCards, setMyCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    cardHolderName: "", relation: "", healthCardNumber: "", mobileNumber: "", email: "",
    aadhaarNumber: "", panNumber: "", bankName: "", accountNumber: "", ifscCode: "",
    branch: "", address: "", totalMedicalExpenses: "", title: "", description: "", cardholderNote: ""
  });

  const [files, setFiles] = useState({
    healthCardCopy: null, firCopy: null, passportPhotos: null, consultationFeeBill: null,
    aadhaarFront: null, aadhaarBack: null, panFront: null, bankPassbook: null,
    doctorReport: null, dischargeSummary: null, hospitalBills: null,
    diagnosticReports: null, labBills: null, pharmacyBills: null, claimForm: null
  });

  const [existingDocs, setExistingDocs] = useState({});

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const cardRes = await cardAPI.getMyCard(true); // pass true for basic details
        if (cardRes.success && cardRes.data) {
          setMyCards(cardRes.data);
        }

        const claimsRes = await claimsAPI.getById(id);
        if (claimsRes.success) {
          const claim = claimsRes.data;
          if (claim) {
            if (claim.status !== 'rejected') {
              toast.error("Only rejected claims can be edited");
              navigate("/claims");
              return;
            }
            setSelectedCardId(claim.card?._id || claim.card);
            setFormData({
              cardHolderName: claim.cardHolderName || "",
              relation: claim.relation || "",
              healthCardNumber: claim.healthCardNumber || "",
              mobileNumber: claim.mobileNumber || "",
              email: claim.email || "",
              aadhaarNumber: claim.aadhaarNumber || "",
              panNumber: claim.panNumber || "",
              bankName: claim.bankDetails?.bankName || "",
              accountNumber: claim.bankDetails?.accountNumber || "",
              ifscCode: claim.bankDetails?.ifscCode || "",
              branch: claim.bankDetails?.branch || "",
              address: claim.address || "",
              totalMedicalExpenses: claim.totalMedicalExpenses || "",
              title: claim.title || "",
              description: claim.description || "",
              cardholderNote: ""
            });
            setExistingDocs(claim.documents || {});
          } else {
            toast.error("Claim not found");
            navigate("/claims");
          }
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, fieldName, multiple = false) => {
    if (multiple) {
      const selectedFiles = Array.from(e.target.files);
      const existingPhotos = existingDocs[fieldName] || [];
      const uploadedPhotos = files[fieldName] || [];
      const totalPhotos = existingPhotos.length + uploadedPhotos.length + selectedFiles.length;
      if (totalPhotos > 3) {
        toast.error("You can have a maximum of 3 files.");
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

  const removeExistingFile = (fieldName, index) => {
    if (Array.isArray(existingDocs[fieldName])) {
      const newExisting = existingDocs[fieldName].filter((_, i) => i !== index);
      setExistingDocs({ ...existingDocs, [fieldName]: newExisting });
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
    
    if (!formData.cardholderNote) {
      toast.error("Please provide a note to the reviewer explaining your corrections.");
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

      const res = await claimsAPI.reApply(id, submitData);
      if (res.success) {
        toast.success("Claim re-applied successfully");
        navigate("/claims");
      }
    } catch (err) {
      toast.error(err.message || "Failed to re-apply claim");
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
            <p className="text-gray-600 font-bold uppercase tracking-widest text-sm">Loading Claim Data...</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto bg-white border border-gray-200 shadow-2xl rounded-sm overflow-hidden relative">
            
            <div className="h-2 w-full bg-[#3AB000]"></div>
            
            <div className="border-b border-gray-200 px-6 md:px-10 py-6 md:py-8 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-[#3AB000]/10 rounded-full flex items-center justify-center border-2 border-[#3AB000]/20 flex-shrink-0">
                 <ShieldAlert className="text-[#3AB000]" size={32} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">Edit & Re-Claim</h1>
                <p className="text-sm text-gray-600 mt-1 font-semibold">Correct details and re-submit your claim</p>
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
             <div className="bg-blue-50 border border-blue-200 p-4 rounded-sm mb-8 flex items-start gap-3">
               <ShieldAlert className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
               <div>
                 <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wide">Edit Instructions / संपादन निर्देश</h4>
                 <p className="text-xs text-blue-700 mt-1 font-medium leading-relaxed">
                   Your existing data and documents have been loaded. You only need to upload new documents if they need correction. Please explain what you changed in the "Note to Reviewer" field at the bottom.
                 </p>
               </div>
             </div>

             <form onSubmit={handleSubmit} className="space-y-10">
                {/* Section 1: Card Details */}
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-sm shadow-sm">
                  <SectionHeader title="1. Card & Beneficiary Selection" />
                  <div className="space-y-2 w-full md:w-1/2">
                     <label className="text-sm font-bold text-gray-700 flex items-center gap-1">Select Linked Health Card <span className="text-red-500">*</span></label>
                     <select 
                       value={selectedCardId} 
                       onChange={(e) => {
                         const val = e.target.value;
                         setSelectedCardId(val);
                         const card = myCards.find(c => c._id === val);
                         if (card) {
                           setFormData(prev => ({ ...prev, healthCardNumber: card.cardId, cardHolderName: card.cardholderName }));
                         }
                       }} 
                       required disabled
                       className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-sm focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] outline-none transition-all font-semibold text-gray-500 text-sm shadow-sm cursor-not-allowed"
                     >
                       <option value="" disabled>-- Select Card --</option>
                       {myCards.map(c => <option key={c._id} value={c._id}>{c.cardholderName} (Card No: {c.cardId})</option>)}
                     </select>
                  </div>
                </div>

                {/* Section 2: Personal Details */}
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-sm shadow-sm">
                  <SectionHeader title="2. Personal & Contact Details" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {InputField({ label: "Card Holder Name", name: "cardHolderName", formData, handleInputChange })}
                    {InputField({ label: "S/O, D/O, W/O", name: "relation", formData, handleInputChange })}
                    {InputField({ label: "Health Card Number", name: "healthCardNumber", disabled: true, formData, handleInputChange })}
                    {InputField({ label: "Mobile Number", name: "mobileNumber", type: "tel", formData, handleInputChange })}
                    {InputField({ label: "Email Address", name: "email", type: "email", formData, handleInputChange })}
                    {InputField({ label: "Aadhaar Number", name: "aadhaarNumber", formData, handleInputChange })}
                    {InputField({ label: "PAN Number", name: "panNumber", required: false, formData, handleInputChange })}
                    <div className="lg:col-span-2">
                       {InputField({ label: "Full Residential Address", name: "address", formData, handleInputChange, isTextarea: true })}
                    </div>
                  </div>
                </div>

                {/* Section 3: Bank Details */}
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-sm shadow-sm">
                  <SectionHeader title="3. Bank Account Details" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {InputField({ label: "Bank Name", name: "bankName", formData, handleInputChange })}
                    {InputField({ label: "Account Number", name: "accountNumber", formData, handleInputChange })}
                    {InputField({ label: "IFSC Code", name: "ifscCode", formData, handleInputChange })}
                    {InputField({ label: "Branch Name", name: "branch", formData, handleInputChange })}
                  </div>
                </div>

                {/* Section 4: Expense Details */}
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-sm shadow-sm">
                  <SectionHeader title="4. Claim Expense Details" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {InputField({ label: "Total Medical Expenses (₹)", name: "totalMedicalExpenses", type: "number", formData, handleInputChange })}
                    <div className="space-y-1.5">
                       <label className="text-sm font-bold text-gray-700 opacity-60">Amount Approved</label>
                       <input type="text" disabled placeholder="To be filled by official" className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-sm outline-none text-gray-500 font-semibold text-sm cursor-not-allowed shadow-inner" />
                    </div>
                  </div>
                </div>

                {/* Section 5: Document Uploads */}
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-sm shadow-sm">
                  <SectionHeader title="5. Document Attachments" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {FileUploadField({ label: "Health Card Copy", name: "healthCardCopy", required: true, files, handleFileChange, existingFileUrl: existingDocs.healthCardCopy })}
                    {FileUploadField({ label: "Aadhaar Card (Front)", name: "aadhaarFront", required: true, files, handleFileChange, existingFileUrl: existingDocs.aadhaarFront })}
                    {FileUploadField({ label: "Aadhaar Card (Back)", name: "aadhaarBack", required: true, files, handleFileChange, existingFileUrl: existingDocs.aadhaarBack })}
                    {FileUploadField({ label: "PAN Card (Front)", name: "panFront", required: true, files, handleFileChange, existingFileUrl: existingDocs.panFront })}
                    {FileUploadField({ label: "Pharmacy Bills", name: "pharmacyBills", required: true, files, handleFileChange, existingFileUrl: existingDocs.pharmacyBills })}
                    {FileUploadField({ label: "Bank Passbook/Cheque", name: "bankPassbook", required: true, files, handleFileChange, existingFileUrl: existingDocs.bankPassbook })}
                    {FileUploadField({ label: "Doctor's Report", name: "doctorReport", required: true, files, handleFileChange, existingFileUrl: existingDocs.doctorReport })}
                    {FileUploadField({ label: "Consultation Fee Bill", name: "consultationFeeBill", required: true, files, handleFileChange, existingFileUrl: existingDocs.consultationFeeBill })}
                    {FileUploadField({ label: "Discharge Summary", name: "dischargeSummary", required: true, files, handleFileChange, existingFileUrl: existingDocs.dischargeSummary })}
                    {FileUploadField({ label: "Hospital Bills", name: "hospitalBills", required: true, files, handleFileChange, existingFileUrl: existingDocs.hospitalBills })}
                    {FileUploadField({ label: "Diagnostic Reports", name: "diagnosticReports", required: true, files, handleFileChange, existingFileUrl: existingDocs.diagnosticReports })}
                    {FileUploadField({ label: "Laboratory Bills", name: "labBills", required: true, files, handleFileChange, existingFileUrl: existingDocs.labBills })}
                    {FileUploadField({ label: "Passport-size Photographs (Exactly 3 Copies)", name: "passportPhotos", required: true, multiple: true, files, handleFileChange, removeFile, removeExistingFile, existingFileUrl: existingDocs.passportPhotos })}
                    {FileUploadField({ label: "FIR Copy (Optional)", name: "firCopy", required: false, files, handleFileChange, existingFileUrl: existingDocs.firCopy })}
                    {FileUploadField({ 
                      label: "Manually Filled Claim Form / हाथ से भरा हुआ क्लेम फॉर्म", 
                      helperText: "(Please upload the form you downloaded and filled manually)",
                      name: "claimForm", 
                      required: true, 
                      files, 
                      handleFileChange, 
                      existingFileUrl: existingDocs.claimForm 
                    })}
                  </div>
                </div>

                {/* Section 6: Note */}
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-sm shadow-sm">
                  <SectionHeader title="6. Note to Reviewer" />
                  <div className="w-full">
                     {InputField({ label: "Explain what corrections you made", name: "cardholderNote", required: true, placeholder: "e.g., I have uploaded the clear copy of my bank passbook...", formData, handleInputChange, isTextarea: true })}
                  </div>
                </div>

                {/* Declaration and Submit */}
                <div className="bg-[#3AB000]/5 border border-[#3AB000]/30 p-6 rounded-sm flex flex-col items-center text-center space-y-6">
                   <p className="text-xs md:text-sm text-gray-700 font-medium max-w-4xl leading-relaxed">
                     I hereby declare that all the corrected information and documents provided above are true.
                   </p>
                   <button type="submit" disabled={submitting} className="px-12 py-3.5 bg-[#3AB000] text-white text-sm font-black uppercase tracking-widest shadow-xl hover:bg-[#2d8a00] hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 rounded-sm border-2 border-[#3AB000] min-w-[280px]">
                     {submitting ? (
                       <><Loader2 className="animate-spin" size={20} /> Processing...</>
                     ) : (
                       "Re-Submit Claim"
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

export default EditClaim;
