import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  GraduationCap,
  Briefcase,
  Calendar,
  ShieldCheck,
  Globe,
  Loader2,
  Eye,
  Download,
  Plus,
  CheckCircle2,
  FileText,
  Edit,
  X,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import { administrativeStaffAPI, profileAPI } from "../../utils/api";
import { useAuth } from "../../auth/AuthProvider";
import logo from "../../assets/JSSAogo.png";
import logoLong from "../../assets/jssa-logo-long.png";
import {
  AuthorizationTemplate,
  ConsentTemplate,
  MOUTemplate,
  OfferLetterTemplate,
  IDCardTemplate
} from "./StaffLetters";

const GREEN = "#3AB000";

// Helper to sanitize image URLs for production
const cleanImageUrl = (url) => {
  if (!url) return "";
  
  // Keep local blobs and data URIs intact for image previews
  if (url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }

  // Handle localhost mappings
  if (url.includes("localhost:") && url.includes("/api/")) {
    const parts = url.split("/api/");
    return `https://api.jssabhiyan.com/api/${parts[1]}`;
  }

  // Keep absolute http/https URLs intact
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Handle relative paths
  if (url.startsWith("/api/")) {
    return `https://api.jssabhiyan.com${url}`;
  }
  
  if (url.startsWith("/")) {
    return `https://api.jssabhiyan.com/api${url}`;
  }
  
  if (url.startsWith("uploads/") || url.startsWith("files/")) {
    return `https://api.jssabhiyan.com/api/${url}`;
  }
  
  const cleanPath = url.startsWith("/") ? url.slice(1) : url;
  return `https://api.jssabhiyan.com/api/files/${cleanPath}`;
};

const ProfileField = ({ icon: Icon, label, value, color = "text-gray-600" }) => (
  <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200">
    <div className={`p-2 ${color.replace('text', 'bg')}/10`}>
      <Icon size={18} className={color} />
    </div>
    <div className="flex-1">
      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-gray-900 break-words mt-1">{value || "Not Provided"}</p>
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-5 pb-3 border-b-2 border-green-600">
    <Icon className="text-green-600" size={20} />
    <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">{title}</h2>
  </div>
);

const StaffProfile = () => {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);
  
  // Edit Profile States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editFile, setEditFile] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState("");
  const [editSignatureFile, setEditSignatureFile] = useState(null);
  const [editSignaturePreviewUrl, setEditSignaturePreviewUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [checkTimeout, setCheckTimeout] = useState(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [currentCheckField, setCurrentCheckField] = useState("");

  const { user } = useAuth();
  // Letters Shifting States & Refs
  const [viewingDoc, setViewingDoc] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  
  const authTemplateRef = useRef(null);
  const consentTemplateRef = useRef(null);
  const mouTemplateRef = useRef(null);
  const offerTemplateRef = useRef(null);
  const idCardTemplateRef = useRef(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await administrativeStaffAPI.getMe();
      if (res.success && res.data) {
        setStaff(res.data);
      }
    } catch (err) {
      console.error("Staff Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditClick = () => {
    setEditFormData({
      name: staff?.name || "",
      mobile: staff?.mobile || "",
      email: staff?.email || "",
      bankName: staff?.bankName || "",
      accountNumber: staff?.accountNumber || "",
      ifscCode: staff?.ifscCode || "",
      accountHolderName: staff?.accountHolderName || ""
    });
    setEditPreviewUrl(staff?.photo || "");
    setEditFile(null);
    setEditSignaturePreviewUrl(staff?.signature || "");
    setEditSignatureFile(null);
    setAvailabilityError("");
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));

    if (name === "email" || name === "mobile") {
      if (checkTimeout) clearTimeout(checkTimeout);
      setCurrentCheckField(name);
      setIsCheckingAvailability(true);
      
      const newTimeout = setTimeout(async () => {
        try {
          if (name === "mobile" && value.length !== 10) {
            setIsCheckingAvailability(false);
            return;
          }
          const res = await profileAPI.checkAvailability(
            name === "email" ? value : undefined,
            name === "mobile" ? value : undefined
          );
          if (res && res.available === false) {
            setAvailabilityError(res.error);
          } else {
            setAvailabilityError("");
          }
        } catch (err) {
          console.error("Availability check failed", err);
        } finally {
          setIsCheckingAvailability(false);
        }
      }, 500);
      setCheckTimeout(newTimeout);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditFile(file);
      setEditPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSignatureChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditSignatureFile(file);
      setEditSignaturePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (availabilityError) return;
    try {
      setIsSaving(true);
      const formDataToSend = new FormData();
      Object.keys(editFormData).forEach(key => {
        formDataToSend.append(key, editFormData[key]);
      });
      if (editFile) {
        formDataToSend.append("photo", editFile);
      }
      if (editSignatureFile) {
        formDataToSend.append("signature", editSignatureFile);
      }

      await profileAPI.editStaffProfile(formDataToSend);
      setIsEditModalOpen(false);
      toast.success("Profile updated successfully!");
      fetchProfile(); // Refresh data
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (window.html2pdf) return resolve();
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
  };

  const handleDownload = async (docType) => {
    if (isDownloading) return;
    setIsDownloading(true);
    setSelectedDocType(docType);
    try {
      let ref;
      let fileName;
      const displayId = staff?._id?.slice(-6).toUpperCase();
      if (docType === 'auth') { ref = authTemplateRef; fileName = `Staff_Authorization_Letter_${displayId}`; }
      else if (docType === 'consent') { ref = consentTemplateRef; fileName = `Staff_Consent_Letter_${displayId}`; }
      else if (docType === 'mou') { ref = mouTemplateRef; fileName = `Staff_MOU_Agreement_${displayId}`; }
      else if (docType === 'offer') { ref = offerTemplateRef; fileName = `Staff_Offer_Letter_Annexure_${displayId}`; }
      else if (docType === 'id') { ref = idCardTemplateRef; fileName = `Staff_ID_Card_${displayId}`; }
      
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
      await new Promise(resolve => setTimeout(resolve, 800));

      if (!window.html2pdf) {
        throw new Error('html2pdf library failed to load');
      }

      const element = ref.current;
      if (!element || !element.offsetHeight) {
        throw new Error('Template element not properly rendered');
      }

      // Fix html2canvas scroll offset bug inside overflow modals
      const scrollContainer = document.getElementById('modal-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
      window.scrollTo(0, 0);

      // Give DOM a moment to update scroll
      await new Promise(resolve => setTimeout(resolve, 100));

      let opt;
      if (docType === 'id') {
        opt = {
          margin: 0,
          filename: `${fileName}.pdf`,
          image: { type: 'jpeg', quality: 0.99 },
          html2canvas: {
            scale: 3,
            useCORS: true,
            logging: false,
            backgroundColor: '#C5E9F9',
            scrollY: 0,
            scrollX: -6
          },
          jsPDF: {
            unit: 'mm',
            format: [85, 160],
            orientation: 'portrait',
            compress: true
          }
        };
      } else {
        opt = {
          margin: [8, 8, 8, 8],
          filename: `${fileName}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
      }

      const pdf = window.html2pdf();
      await pdf.set(opt).from(element).save();
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download PDF.');
    } finally { 
      setIsDownloading(false); 
      setSelectedDocType(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
          <p className="font-bold text-gray-700">Loading your profile details...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 max-w-6xl mx-auto">

        {/* Header Profile Card */}
        <div className="relative mb-8 pt-20">
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-r from-green-600 to-green-700">
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:20px_20px]"></div>
          </div>

          <div className="bg-white p-6 sm:p-8 border border-green-600 flex flex-col md:flex-row items-center md:items-end gap-6 relative">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white p-1 border border-green-600 -mt-20 md:-mt-24 overflow-hidden group">

              <img
                src={cleanImageUrl(staff?.photo) || "https://ui-avatars.com/api/?name=" + (staff?.name || "User") + "&background=3AB000&color=fff"}
                alt="Profile"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
                  {staff?.name}
                </h1>
                <span className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-[9px] font-black uppercase tracking-widest border border-green-700">
                  <ShieldCheck size={12} className="mr-1" /> Administrative Staff
                </span>
                
                {/* Edit Profile Button */}
                <button 
                  onClick={handleEditClick}
                  className="ml-auto inline-flex items-center px-4 py-2 bg-white text-green-600 text-xs font-bold uppercase tracking-widest border-2 border-green-600 hover:bg-green-50 transition-colors"
                >
                  <Edit size={14} className="mr-2" /> Edit Profile
                </button>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-600 font-bold text-sm">
                <span className="flex items-center gap-1.5"><Briefcase size={16} className="text-green-600" /> {staff?.jobRoleId?.jobTitle || "Not Assigned"}</span>
                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-red-500" /> {staff?.district}, {staff?.state}</span>
                <span className="flex items-center gap-1.5 text-blue-600"><Globe size={16} /> ID: JSSA/STAFF/{staff?._id?.slice(-6).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content Areas */}
          <div className="lg:col-span-2 space-y-8">

            {/* Personal Details */}
            <div className="bg-white p-6 sm:p-8 border border-green-600">
              <SectionHeader icon={User} title="Personal Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <ProfileField icon={User} label="Father's Name" value={staff?.fatherName} />
                <ProfileField icon={User} label="Mother's Name" value={staff?.motherName} color="text-pink-600" />
                <ProfileField icon={Calendar} label="Date of Birth" value={staff?.dob ? new Date(staff.dob).toLocaleDateString() : "N/A"} color="text-orange-600" />
                <ProfileField icon={Phone} label="Mobile Number" value={staff?.mobile} color="text-green-600" />
                <ProfileField icon={Mail} label="Email Address" value={staff?.email} color="text-blue-600" />
                <ProfileField icon={Globe} label="Nationality" value={staff?.nationality && staff.nationality.charAt(0).toUpperCase() + staff.nationality.slice(1)} color="text-purple-600" />
              </div>
            </div>

            {/* Educational Qualifications */}
            <div className="bg-white p-6 sm:p-8 border border-green-600">
              <SectionHeader icon={GraduationCap} title="Education Qualifications" />
              {staff?.educationDetails && staff.educationDetails.length > 0 ? (
                <div className="overflow-x-auto border border-green-600">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-green-600 text-[9px] font-black uppercase tracking-widest text-white border-b border-green-700">
                        <th className="px-4 py-3">Qualification</th>
                        <th className="px-4 py-3">Board/University</th>
                        <th className="px-4 py-3 text-center">Year</th>
                        <th className="px-4 py-3 text-center">Marks (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {staff.educationDetails.map((edu, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-gray-800">{edu.level}</td>
                          <td className="px-4 py-3 text-gray-600 font-semibold">{edu.board}</td>
                          <td className="px-4 py-3 text-center text-gray-600 font-semibold">{edu.year}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 bg-green-600 text-white font-bold">{edu.percentage}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 border border-dashed border-green-600">
                  <GraduationCap size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-bold text-gray-600">No education details added yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">

            {/* Bank Details */}
            <div className="bg-white p-6 border border-green-600 bg-gradient-to-br from-white to-gray-50">
              <SectionHeader icon={CreditCard} title="Bank Information" />
              <div className="space-y-3 text-left">
                <ProfileField icon={Building} label="Bank Name" value={staff?.bankName} color="text-blue-600" />
                <ProfileField icon={CreditCard} label="Account Number" value={staff?.accountNumber} color="text-gray-800" />
                <ProfileField icon={Globe} label="IFSC Code" value={staff?.ifscCode} color="text-orange-600" />
                <ProfileField icon={User} label="A/C Holder" value={staff?.accountHolderName} color="text-green-600" />
                <div className="mt-4 p-3 bg-white border border-green-600">
                  <p className="text-[9px] font-bold text-gray-600 uppercase">Verification Status</p>
                  <p className="text-xs font-black text-green-600 flex items-center mt-2">
                    <ShieldCheck size={14} className="mr-1" /> ACTIVE
                  </p>
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div className="bg-white p-6 border border-green-600">
              <SectionHeader icon={MapPin} title="Geographical Details" />
              <div className="space-y-4 text-left">
                <div className="p-4 bg-green-50/50 border border-green-200">
                  <p className="text-[9px] font-black text-green-600 uppercase mb-2 tracking-widest flex items-center gap-1">
                    <ShieldCheck size={10} /> Profile Address
                  </p>
                  <p className="text-sm font-bold text-gray-800 leading-relaxed">
                    {[
                      staff?.villageTola,
                      staff?.wardNo ? `Ward ${staff.wardNo}` : null,
                      staff?.gramPanchayat,
                      staff?.blockKhand,
                      staff?.district,
                      staff?.state ? `${staff.state}${staff.pincode ? ` - ${staff.pincode}` : ''}` : staff?.pincode
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 mt-4">
                <div className="p-3 bg-red-50 border border-red-600 text-center">
                  <p className="text-[8px] font-black text-red-600 uppercase mb-1">PAN NO.</p>
                  <p className="text-xs font-black text-red-700">{staff?.panNumber || "N/A"}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* My Official Letters Section */}
        <div className="bg-white p-6 sm:p-8 border border-green-600 mt-8">
          <SectionHeader icon={Briefcase} title="My Official Letters" />
          <p className="text-sm font-semibold text-gray-600 mb-6">
            View and download your official employment letters, offer letter, and identity card.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {[
              { type: "offer", title: "Offer Letter", icon: <FileText className="w-8 h-8 text-red-600" />, desc: "Official offer letter with compensation Annexure-II." },
              { type: "auth", title: "Authorization Letter", icon: <ShieldCheck className="w-8 h-8 text-green-600" />, desc: "Official authorization to represent JSSA." },
              { type: "consent", title: "Letter of Consent", icon: <CheckCircle2 className="w-8 h-8 text-blue-600" />, desc: "Declarations and terms of service consent form." },
              { type: "mou", title: "MOU & Agreement", icon: <FileText className="w-8 h-8 text-orange-600" />, desc: "Full employment agreement with terms." },
              { type: "id", title: "Identity Card", icon: <CreditCard className="w-8 h-8 text-purple-600" />, desc: "Official digital identity card with your photo." }
            ].map((card) => (
              <div key={card.type} className="group bg-white border border-green-600 p-6 hover:bg-green-50 transition-all duration-300 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  {card.icon}
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2 uppercase leading-tight">{card.title}</h3>
                <p className="text-xs text-gray-600 mb-6 font-semibold leading-relaxed">{card.desc}</p>
                <div className="flex gap-3 mt-auto w-full">
                  <button
                    onClick={() => setViewingDoc(card.type)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#3AB000] text-white font-bold text-xs hover:bg-green-700 transition-all border border-[#3AB000]"
                    title="View Letter"
                  >
                    <Eye size={16} />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View Modal */}
        {viewingDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-white w-full max-w-4xl max-h-[95vh] my-auto shadow-2xl flex flex-col overflow-hidden border-2 border-green-600">
              <div className="p-4 bg-green-50 border-b-2 border-green-600 flex justify-between items-center text-gray-900 flex-shrink-0">
                <h3 className="font-black flex items-center gap-2 uppercase tracking-wide">
                  {viewingDoc === 'auth' && <ShieldCheck className="text-green-600" />}
                  {viewingDoc === 'consent' && <CheckCircle2 className="text-blue-600" />}
                  {viewingDoc === 'mou' && <FileText className="text-orange-600" />}
                  {viewingDoc === 'offer' && <FileText className="text-red-600" />}
                  {viewingDoc === 'id' && <CreditCard className="text-purple-600" />}
                  {viewingDoc === 'auth' ? 'Authorization Letter' : viewingDoc === 'consent' ? 'Letter of Consent' : viewingDoc === 'mou' ? 'MOU & Agreement' : viewingDoc === 'offer' ? 'Offer Letter' : 'Identity Card'}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(viewingDoc)}
                    disabled={isDownloading && selectedDocType === viewingDoc}
                    className="p-2 bg-[#3AB000] text-white hover:bg-green-700 transition-all shadow-md disabled:opacity-50 border border-[#3AB000]"
                    title="Download PDF"
                  >
                    {isDownloading && selectedDocType === viewingDoc ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Download size={20} />
                    )}
                  </button>
                  <button
                    onClick={() => setViewingDoc(null)}
                    className="p-2 bg-gray-300 hover:bg-gray-400 transition-all border border-gray-400"
                  >
                    <Plus className="w-6 h-6 rotate-45 text-gray-700" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-100" id="modal-scroll-container">
                <div className={`mx-auto bg-white border border-gray-300 p-4 ${viewingDoc === 'id' ? 'w-fit' : 'max-w-[800px]'}`}>
                  {viewingDoc === 'auth' && <AuthorizationTemplate staff={staff} templateRef={authTemplateRef} />}
                  {viewingDoc === 'consent' && <ConsentTemplate staff={staff} templateRef={consentTemplateRef} />}
                  {viewingDoc === 'mou' && <MOUTemplate staff={staff} templateRef={mouTemplateRef} />}
                  {viewingDoc === 'offer' && <OfferLetterTemplate staff={staff} templateRef={offerTemplateRef} />}
                  {viewingDoc === 'id' && <IDCardTemplate staff={staff} templateRef={idCardTemplateRef} />}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Templates for Download */}
        <div style={{ display: 'none' }}>
          <AuthorizationTemplate staff={staff} templateRef={authTemplateRef} />
          <ConsentTemplate staff={staff} templateRef={consentTemplateRef} />
          <MOUTemplate staff={staff} templateRef={mouTemplateRef} />
          <OfferLetterTemplate staff={staff} templateRef={offerTemplateRef} />
          <IDCardTemplate staff={staff} templateRef={idCardTemplateRef} />
          <IDCardTemplate staff={staff} templateRef={idCardTemplateRef} />
        </div>

        {/* Edit Profile Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-white w-full max-w-2xl shadow-2xl flex flex-col border-2 border-green-600">
              <div className="p-4 bg-green-50 border-b-2 border-green-600 flex justify-between items-center text-gray-900">
                <h3 className="font-black flex items-center gap-2 uppercase tracking-wide">
                  <Edit className="text-green-600" /> Edit Profile
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 bg-gray-300 hover:bg-gray-400 transition-all rounded-full"
                >
                  <X size={20} className="text-gray-700" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Profile Photo */}
                <div className="bg-green-50/50 p-5 border border-green-100">
                  <label className="block text-xs font-black text-green-800 mb-3 uppercase tracking-wider">Profile Photo</label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 border-2 border-green-600 shadow-lg overflow-hidden bg-white shrink-0">
                      <img src={cleanImageUrl(editPreviewUrl) || "https://ui-avatars.com/api/?name=User&background=3AB000&color=fff"} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border-2 border-green-600 text-green-700 text-sm font-bold hover:bg-green-50 transition-colors shadow-sm">
                        <Edit size={16} className="mr-2" /> Change Photo
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                      <p className="text-[10px] font-semibold text-gray-500 mt-2">Recommended: Square image, max 2MB.</p>
                    </div>
                  </div>
                </div>

                {/* Signature Image */}
                <div className="bg-blue-50/50 p-5 border border-blue-100">
                  <label className="block text-xs font-black text-blue-800 mb-3 uppercase tracking-wider">Signature</label>
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-16 border-2 border-blue-600 shadow-lg overflow-hidden bg-white shrink-0">
                      {editSignaturePreviewUrl ? (
                        <img src={cleanImageUrl(editSignaturePreviewUrl)} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs italic">No Signature</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border-2 border-blue-600 text-blue-700 text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm">
                        <Edit size={16} className="mr-2" /> Change Signature
                        <input type="file" accept="image/*" onChange={handleSignatureChange} className="hidden" />
                      </label>
                      <p className="text-[10px] font-semibold text-gray-500 mt-2">Recommended: Rectangle image, clear background.</p>
                    </div>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="bg-white p-5 border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-black text-gray-900 mb-5 flex items-center gap-2 pb-3 border-b border-gray-100">
                    <User size={18} className="text-green-600"/> Personal Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase mb-1.5 tracking-wider">Full Name</label>
                      <input type="text" name="name" value={editFormData.name} onChange={handleEditChange} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none" placeholder="Enter full name" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase mb-1.5 tracking-wider">Email <span className="text-blue-600 font-bold">(Login ID)</span></label>
                      <input type="email" name="email" value={editFormData.email} onChange={handleEditChange} className={`w-full p-2.5 bg-gray-50 border text-sm font-bold focus:bg-white focus:ring-2 transition-all outline-none ${availabilityError && availabilityError.includes("email") ? 'border-red-500 focus:ring-red-500 text-red-700' : 'border-gray-300 text-gray-800 focus:ring-green-500 focus:border-green-500'}`} placeholder="Enter email address" />
                      
                      {isCheckingAvailability && currentCheckField === "email" ? (
                        <p className="text-[10px] text-blue-600 font-bold mt-1.5 flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Checking availability...</p>
                      ) : availabilityError && availabilityError.includes("email") ? (
                        <p className="text-[10px] text-red-600 font-bold mt-1.5 flex items-center gap-1"><X size={12}/> {availabilityError}</p>
                      ) : (
                        <p className="text-[10px] text-gray-500 font-semibold mt-1">Updates your account login email.</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-gray-600 uppercase mb-1.5 tracking-wider">Mobile Number <span className="text-blue-600 font-bold">(Login ID)</span></label>
                      <input type="text" maxLength={10} name="mobile" value={editFormData.mobile} onChange={handleEditChange} className={`w-full p-2.5 bg-gray-50 border text-sm font-bold focus:bg-white focus:ring-2 transition-all outline-none ${availabilityError && availabilityError.includes("mobile") ? 'border-red-500 focus:ring-red-500 text-red-700' : 'border-gray-300 text-gray-800 focus:ring-green-500 focus:border-green-500'}`} placeholder="10-digit mobile number" />
                      
                      {isCheckingAvailability && currentCheckField === "mobile" ? (
                        <p className="text-[10px] text-blue-600 font-bold mt-1.5 flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Checking availability...</p>
                      ) : availabilityError && availabilityError.includes("mobile") ? (
                        <p className="text-[10px] text-red-600 font-bold mt-1.5 flex items-center gap-1"><X size={12}/> {availabilityError}</p>
                      ) : (
                        <p className="text-[10px] text-gray-500 font-semibold mt-1">Updates your account login mobile number.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bank Information */}
                <div className="bg-white p-5 border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-black text-gray-900 mb-5 flex items-center gap-2 pb-3 border-b border-gray-100">
                    <CreditCard size={18} className="text-blue-600"/> Bank Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase mb-1.5 tracking-wider">Bank Name</label>
                      <input type="text" name="bankName" value={editFormData.bankName} onChange={handleEditChange} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" placeholder="e.g. State Bank of India" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase mb-1.5 tracking-wider">Account Number</label>
                      <input type="text" name="accountNumber" value={editFormData.accountNumber} onChange={handleEditChange} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-mono" placeholder="Account Number" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase mb-1.5 tracking-wider">IFSC Code</label>
                      <input type="text" name="ifscCode" value={editFormData.ifscCode} onChange={handleEditChange} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none uppercase font-mono" placeholder="IFSC Code" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase mb-1.5 tracking-wider">A/C Holder Name</label>
                      <input type="text" name="accountHolderName" value={editFormData.accountHolderName} onChange={handleEditChange} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" placeholder="Name as per bank" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all shadow-sm">Cancel</button>
                <button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving || !!availabilityError}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm disabled:opacity-50 transition-all shadow-sm shadow-green-600/30"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default StaffProfile;
