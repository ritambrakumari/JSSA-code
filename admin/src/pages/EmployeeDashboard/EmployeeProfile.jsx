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
  LogOut,
  Edit,
  X,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import { createPaperAPI, employeesAPI, profileAPI, uploadAPI } from "../../utils/api";
import { useAuth } from "../../auth/AuthProvider";
import logo from "../../assets/JSSAogo.png";
import logoLong from "../../assets/jssa-logo-long.png";
import {
  AuthorizationTemplate,
  ConsentTemplate,
  MOUTemplate,
  IDCardTemplate
} from "./EmployeeLetters";

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

// Helper to normalize post name to standard display format
const normalizePostName = (text) => {
  if (!text || typeof text !== 'string') return "District Manager";
  const t = text.toLowerCase();

  // Specific matches first, District Manager should be checked to avoid override
  if (t.includes("regional manager") || t.includes("क्षेत्रीय प्रबंधक") || t.includes("regional")) return "Regional Manager";
  if (t.includes("zonal coordinator") || t.includes("आंचलिक समन्वयक") || t.includes("zonal")) return "Zonal Coordinator";
  if (t.includes("district manager") || t.includes("जिला प्रबंधक")) return "District Manager";
  if (t.includes("block supervisor") || t.includes("प्रखंड पर्यवेक्षक")) return "Block Supervisor cum Panchayat Executive";
  if (t.includes("panchayat executive") || t.includes("पंचायत कार्यपालक")) return "Panchayat Executive";

  return text; // Return actual name rather than falling back blindly
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

const EmployeeProfile = () => {
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState(null);
  const [mouAddress, setMouAddress] = useState(null);
  const [appAddress, setAppAddress] = useState(null);
  
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
  const [uploadingDocIndex, setUploadingDocIndex] = useState(null);
  const [previewDocUrl, setPreviewDocUrl] = useState(null);

  const { user, employeeProfile } = useAuth();

  // Letters Shifting States & Refs
  const [viewingDoc, setViewingDoc] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [empId, setEmpId] = useState("");
  const [detectedPostName, setDetectedPostName] = useState("");
  const [formData, setFormData] = useState({
    state: "N/A",
    district: "N/A",
    block: "N/A",
    villageTola: "N/A"
  });

  const authTemplateRef = useRef(null);
  const consentTemplateRef = useRef(null);
  const mouTemplateRef = useRef(null);
  const idCardTemplateRef = useRef(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [examRes, empRes] = await Promise.allSettled([
        createPaperAPI.getAssigned(),
        employeesAPI.getMe(),
      ]);

        let merged = {};
        let activeEmployeeDoc = null;

        if (empRes.status === "fulfilled" && empRes.value?.success && empRes.value?.data) {
          activeEmployeeDoc = empRes.value.data;
        }

        if (activeEmployeeDoc) {
          const ep = activeEmployeeDoc;
          setMouAddress({
            address: ep.villageTola,
            wardNo: ep.wardNo,
            panchayat: ep.gramPanchayat,
            block: ep.blockKhand,
            district: ep.district,
            state: ep.state,
            pincode: ep.pincode
          });
          merged = {
            candidateName: ep.name,
            fatherName: ep.fatherName,
            motherName: ep.motherName,
            dob: ep.dob,
            mobile: ep.mobile,
            email: ep.email,
            nationality: ep.nationality,
            panNumber: ep.panNumber,
            state: ep.state,
            district: ep.district,
            blockKhand: ep.blockKhand,
            gramPanchayat: ep.gramPanchayat,
            villageTola: ep.villageTola,
            wardNo: ep.wardNo,
            pincode: ep.pincode,
            educationDetails: (ep.educationDetails && ep.educationDetails.length > 0) ? ep.educationDetails : (ep.application?.educationDetails || []),
            bankName: ep.bankName,
            accountNumber: ep.accountNumber,
            ifscCode: ep.ifscCode,
            accountHolderName: ep.accountHolderName,
            photo: ep.photo,
            signature: ep.signature,
            post: ep.designation || ep.post || ep.jobPostingId?.title || ep.jobPostingId?.post?.en || "",
            employeeId: ep.employeeId || `JSSA/EMP/${ep._id?.slice(-6).toUpperCase()}`,
            status: ep.status || "Active",
            block: ep.blockKhand,
            panchayat: ep.gramPanchayat,
            address: ep.villageTola,
            createdAt: ep.createdAt || null,
            mouPaidAt: ep.mouPaidAt || null,
          };
        }
        else if (examRes.status === "fulfilled" && examRes.value?.success && examRes.value?.data?.tests?.length > 0) {
          const examApp = examRes.value.data.tests[0].userAttempt?.applicationId;
          if (examApp) {
            setAppAddress({
              address: examApp.address,
              wardNo: examApp.wardNo,
              panchayat: examApp.panchayat,
              block: examApp.block,
              district: examApp.district,
              state: examApp.state,
              pincode: examApp.pincode
            });
            merged = { ...examApp };
          }
        }

        if (Object.keys(merged).length > 0) {
          const targetPost = merged.post || merged.jobPostingId?.title || merged.jobPostingId?.post?.en || "";

          const normalizeForTemplate = (text) => {
            if (!text || typeof text !== 'string') return "district manager";
            const t = text.toLowerCase();
            if (t.includes("regional manager") || t.includes("क्षेत्रीय प्रबंधक") || t.includes("regional")) return "regional manager";
            if (t.includes("zonal coordinator") || t.includes("आंचलिक समन्वयक") || t.includes("zonal")) return "zonal coordinator";
            if (t.includes("district manager") || t.includes("जिला प्रबंधक")) return "district manager";
            if (t.includes("block supervisor") || t.includes("प्रखंड पर्यवेक्षक")) return "block supervisor cum panchayat executive";
            if (t.includes("panchayat executive") || t.includes("पंचायत कार्यपालक")) return "panchayat executive";
            return t;
          };
          const templatePost = normalizeForTemplate(targetPost);
          setDetectedPostName(templatePost);

          setFormData({
            state: merged.state || "N/A",
            district: merged.district || "N/A",
            block: merged.blockKhand || merged.block || "N/A",
            villageTola: merged.villageTola || merged.address || "N/A"
          });

          // Set Initial Edit Form Data, including educationDetails
          setEditFormData({
            name: merged.candidateName || "",
            email: merged.email || "",
            mobile: merged.mobile || "",
            bankName: merged.bankName || "",
            accountNumber: merged.accountNumber || "",
            ifscCode: merged.ifscCode || "",
            accountHolderName: merged.accountHolderName || "",
            educationDetails: merged.educationDetails || [],
          });

          let finalEmpId = "";
          const postCodes = {
            "regional manager": "RM",
            "zonal coordinator": "ZC",
            "district manager": "DM",
            "block supervisor cum panchayat executive": "BSCPE",
            "panchayat executive": "PE"
          };
          const correctCode = postCodes[templatePost] || "DM";

          if (merged.employeeId) {
            let currentId = merged.employeeId;
            if (currentId.includes("/DM/") && correctCode !== "DM") {
              currentId = currentId.replace("/DM/", `/${correctCode}/`);
            } else if (currentId.includes("/RM/") && correctCode !== "RM") {
              currentId = currentId.replace("/RM/", `/${correctCode}/`);
            } else if (currentId.includes("/ZC/") && correctCode !== "ZC") {
              currentId = currentId.replace("/ZC/", `/${correctCode}/`);
            } else if (currentId.includes("/BSCPE/") && correctCode !== "BSCPE") {
              currentId = currentId.replace("/BSCPE/", `/${correctCode}/`);
            } else if (currentId.includes("/PE/") && correctCode !== "PE") {
              currentId = currentId.replace("/PE/", `/${correctCode}/`);
            }
            finalEmpId = currentId;
          } else {
            const shortId = merged._id ? merged._id.slice(-6).toUpperCase() : "XXXXXX";
            finalEmpId = `JSSA/BR/${correctCode}/${shortId}`;
          }
          setEmpId(finalEmpId);

          merged.post = normalizePostName(targetPost);
          setApp(merged);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditClick = () => {
    setEditFormData({
      name: app?.candidateName || app?.name || "",
      mobile: app?.mobile || "",
      email: app?.email || "",
      bankName: app?.bankName || "",
      accountNumber: app?.accountNumber || "",
      ifscCode: app?.ifscCode || "",
      accountHolderName: app?.accountHolderName || "",
      educationDetails: app?.educationDetails || []
    });
    setEditPreviewUrl(app?.photo || "");
    setEditFile(null);
    setEditSignaturePreviewUrl(app?.signature || "");
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

  const handleEducationChange = (index, field, value) => {
    const updated = [...(editFormData.educationDetails || [])];
    updated[index] = { ...updated[index], [field]: value };
    setEditFormData({ ...editFormData, educationDetails: updated });
  };

  const addEducationRow = () => {
    const updated = [...(editFormData.educationDetails || []), { level: "", board: "", year: "", percentage: "" }];
    setEditFormData({ ...editFormData, educationDetails: updated });
  };

  const removeEducationRow = (index) => {
    const updated = [...(editFormData.educationDetails || [])];
    updated.splice(index, 1);
    setEditFormData({ ...editFormData, educationDetails: updated });
  };

  const handleEducationDocUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingDocIndex(index);
    try {
      const data = await uploadAPI.uploadMOUDucument(file, "education");
      
      if (data.success) {
        handleEducationChange(index, "file", data.data.url);
        toast.success("Document uploaded successfully");
      } else {
        throw new Error(data.error || data.message || "Failed to upload document");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingDocIndex(null);
    }
  };

  const handleSaveProfile = async () => {
    if (availabilityError) return;
    try {
      setIsSaving(true);
      const formDataToSend = new FormData();
      Object.keys(editFormData).forEach(key => {
        if (key === "educationDetails") {
          formDataToSend.append(key, JSON.stringify(editFormData[key] || []));
        } else {
          formDataToSend.append(key, editFormData[key]);
        }
      });
      if (editFile) {
        formDataToSend.append("photo", editFile);
      }
      if (editSignatureFile) {
        formDataToSend.append("signature", editSignatureFile);
      }

      await profileAPI.editEmployeeProfile(formDataToSend);
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
      if (window.html2pdf) {
        resolve();
        return;
      }
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

    if (!app || !formData || !empId) {
      alert('Employee data is still loading. Please wait a moment and try again.');
      return;
    }

    setIsDownloading(true);
    setSelectedDocType(docType);

    try {
      let templateRef;
      let fileName;

      if (docType === 'auth') {
        templateRef = authTemplateRef;
        fileName = `Authorization_Letter_${empId}`;
      } else if (docType === 'consent') {
        templateRef = consentTemplateRef;
        fileName = `Letter_of_Consent_${empId}`;
      } else if (docType === 'mou') {
        templateRef = mouTemplateRef;
        fileName = `MOU_Agreement_${empId}`;
      } else if (docType === 'id') {
        templateRef = idCardTemplateRef;
        fileName = `Identity_Card_${empId}`;
      }

      if (!templateRef?.current) {
        setIsDownloading(false);
        setSelectedDocType(null);
        alert('Document is still loading. Please wait a moment and try again.');
        return;
      }

      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
      await new Promise(resolve => setTimeout(resolve, 800));

      if (!window.html2pdf) {
        throw new Error('html2pdf library failed to load');
      }

      const element = templateRef.current;
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

      setIsDownloading(false);
      setSelectedDocType(null);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download PDF. Please check console for details.');
      setIsDownloading(false);
      setSelectedDocType(null);
    }
  };

  const accountStatus = app?.status || employeeProfile?.status;
  const isResigned = accountStatus === "Resigned";

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

        {isResigned && (
          <div className="mb-6 border-2 border-slate-400 bg-slate-50 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-12 h-12 bg-slate-200 flex items-center justify-center">
                <LogOut size={22} className="text-slate-600" />
              </div>
              <span className="inline-flex items-center px-3 py-1.5 bg-slate-600 text-white text-[9px] font-black uppercase tracking-widest">
                Resigned
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Employment ended — profile view only
              </p>
              <p className="text-[11px] font-bold text-slate-600 mt-1 leading-relaxed">
                Your resignation has been approved by administration. You can view your profile
                details here only; other portal sections are no longer available.
              </p>
            </div>
          </div>
        )}

        {/* Header Profile Card */}
        <div className="relative mb-8 pt-20">
          <div
            className={`absolute top-0 left-0 w-full h-40 bg-gradient-to-r ${isResigned ? "from-slate-500 to-slate-600" : "from-green-600 to-green-700"
              }`}
          >
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:20px_20px]"></div>
          </div>

          <div
            className={`bg-white p-6 sm:p-8 border flex flex-col md:flex-row items-center md:items-end gap-6 relative ${isResigned ? "border-slate-400" : "border-green-600"
              }`}
          >
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white p-1 border border-green-600 -mt-20 md:-mt-24 overflow-hidden group">
              <img
                src={cleanImageUrl(app?.photo) || "https://ui-avatars.com/api/?name=User&background=3AB000&color=fff"}
                alt="Profile"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
                  {app?.candidateName}
                </h1>
                {isResigned ? (
                  <span className="inline-flex items-center px-3 py-1.5 bg-slate-600 text-white text-[9px] font-black uppercase tracking-widest border border-slate-700">
                    <LogOut size={12} className="mr-1" /> Resigned Employee
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-[9px] font-black uppercase tracking-widest border border-green-700">
                    <ShieldCheck size={12} className="mr-1" /> Verified Employee
                  </span>
                )}
                
                {/* Edit Profile Button */}
                {!isResigned && (
                  <button 
                    onClick={handleEditClick}
                    className="ml-auto inline-flex items-center px-4 py-2 bg-white text-green-600 text-xs font-bold uppercase tracking-widest border-2 border-green-600 hover:bg-green-50 transition-colors"
                  >
                    <Edit size={14} className="mr-2" /> Edit Profile
                  </button>
                )}
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-600 font-bold text-sm">
                <span className="flex items-center gap-1.5"><Briefcase size={16} className="text-green-600" /> {app?.post || "Not Assigned"}</span>
                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-red-500" /> {app?.district}, {app?.state}</span>
                <span className="flex items-center gap-1.5 text-blue-600"><Globe size={16} /> ID: {app?.employeeId || `JSSA/EMP/${app?._id?.slice(-6).toUpperCase()}`}</span>
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
                <ProfileField icon={User} label="Father's Name" value={app?.fatherName} />
                <ProfileField icon={User} label="Mother's Name" value={app?.motherName} color="text-pink-600" />
                <ProfileField icon={Calendar} label="Date of Birth" value={new Date(app?.dob).toLocaleDateString()} color="text-orange-600" />
                <ProfileField icon={Phone} label="Mobile Number" value={app?.mobile} color="text-green-600" />
                <ProfileField icon={Mail} label="Email Address" value={app?.email} color="text-blue-600" />
                <ProfileField icon={Globe} label="Nationality" value={app?.nationality && app.nationality.charAt(0).toUpperCase() + app.nationality.slice(1)} color="text-purple-600" />
              </div>
            </div>

            {/* Educational Qualifications */}
            <div className="bg-white p-6 sm:p-8 border border-green-600">
              <SectionHeader icon={GraduationCap} title="Education Qualifications" />
              {app?.educationDetails && app.educationDetails.length > 0 ? (
                <div className="overflow-x-auto border border-green-600">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-green-600 text-[9px] font-black uppercase tracking-widest text-white border-b border-green-700">
                        <th className="px-4 py-3">Qualification</th>
                        <th className="px-4 py-3">Board/University</th>
                        <th className="px-4 py-3 text-center">Year</th>
                        <th className="px-4 py-3 text-center">Marks (%)</th>
                        <th className="px-4 py-3 text-center">Document</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {app.educationDetails.map((edu, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-gray-800">{edu.level}</td>
                          <td className="px-4 py-3 text-gray-600 font-semibold">{edu.board}</td>
                          <td className="px-4 py-3 text-center text-gray-600 font-semibold">{edu.year}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 bg-green-600 text-white font-bold">{edu.percentage}%</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {edu.file ? (
                              <button onClick={() => setPreviewDocUrl(cleanImageUrl(edu.file))} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors text-xs font-bold shadow-sm">
                                <Eye size={12} /> View
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs italic">N/A</span>
                            )}
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
                  <p className="text-[11px] text-gray-500 mt-2">Complete your MOU form to add educational qualifications</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">

            {/* Bank Details from MOU */}
            <div className="bg-white p-6 border border-green-600 bg-gradient-to-br from-white to-gray-50">
              <SectionHeader icon={CreditCard} title="Bank Information" />
              <div className="space-y-3 text-left">
                <ProfileField icon={Building} label="Bank Name" value={app?.bankName} color="text-blue-600" />
                <ProfileField icon={CreditCard} label="Account Number" value={app?.accountNumber} color="text-gray-800" />
                <ProfileField icon={Globe} label="IFSC Code" value={app?.ifscCode} color="text-orange-600" />
                <ProfileField icon={User} label="A/C Holder" value={app?.accountHolderName} color="text-green-600" />
                <div className="mt-4 p-3 bg-white border border-green-600">
                  <p className="text-[9px] font-bold text-gray-600 uppercase">Verification Status</p>
                  <p className="text-xs font-black text-green-600 flex items-center mt-2">
                    <ShieldCheck size={14} className="mr-1" /> PAYMENTS ENABLED
                  </p>
                </div>
              </div>
            </div>

            {/* Professional & Address */}
            <div className="bg-white p-6 border border-green-600">
              <SectionHeader icon={MapPin} title="Geographical Details" />
              <div className="space-y-4 text-left">
                {/* Application Address Block */}
                {appAddress && (
                  <div className="p-4 bg-blue-50/50 border border-blue-200">
                    <p className="text-[9px] font-black text-blue-600 uppercase mb-2 tracking-widest flex items-center gap-1">
                      <Globe size={10} />  Address
                    </p>
                    <p className="text-sm font-bold text-gray-800 leading-relaxed">
                      {[
                        appAddress.address,
                        appAddress.wardNo ? `Ward ${appAddress.wardNo}` : null,
                        appAddress.panchayat,
                        appAddress.block,
                        appAddress.district,
                        appAddress.state ? `${appAddress.state}${appAddress.pincode ? ` - ${appAddress.pincode}` : ''}` : appAddress.pincode
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                {/* MOU Address Block - Only show if data exists */}
                {mouAddress && Object.values(mouAddress).some(v => v && v.toString().trim()) && (
                  <div className="p-4 bg-green-50/50 border border-green-200">
                    <p className="text-[9px] font-black text-green-600 uppercase mb-2 tracking-widest flex items-center gap-1">
                      <ShieldCheck size={10} /> MOU / Profile Address
                    </p>
                    <p className="text-sm font-bold text-gray-800 leading-relaxed">
                      {[
                        mouAddress.address,
                        mouAddress.wardNo ? `Ward ${mouAddress.wardNo}` : null,
                        mouAddress.panchayat,
                        mouAddress.block,
                        mouAddress.district,
                        mouAddress.state ? `${mouAddress.state}${mouAddress.pincode ? ` - ${mouAddress.pincode}` : ''}` : mouAddress.pincode
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-red-50 border border-red-600 text-center">
                  <p className="text-[8px] font-black text-red-600 uppercase mb-1">PAN NO.</p>
                  <p className="text-xs font-black text-red-700">{app?.panNumber || app?.pan || "N/A"}</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-600 text-center">
                  <p className="text-[8px] font-black text-blue-600 uppercase mb-1">ADHAR VERIFIED</p>
                  <p className="text-xs font-black text-blue-700">SUCCESS</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* My Official Letters Section */}
        <div className="bg-white p-6 sm:p-8 border border-green-600 mt-8">
          <SectionHeader icon={Briefcase} title="My Official Letters" />
          <p className="text-sm font-semibold text-gray-600 mb-6">
            View and download your official employment letters and identity card.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              {
                type: "auth",
                title: "Authorization Letter",
                icon: <ShieldCheck className="w-8 h-8 text-green-600" />,
                desc: "Official authorization to represent JSSA in your district."
              },
              {
                type: "consent",
                title: "Letter of Consent",
                icon: <CheckCircle2 className="w-8 h-8 text-blue-600" />,
                desc: "Declarations and terms of service consent form."
              },
              {
                type: "mou",
                title: "MOU & Agreement",
                icon: <FileText className="w-8 h-8 text-orange-600" />,
                desc: "Full employment agreement with terms and conditions."
              },
              {
                type: "id",
                title: "Identity Card",
                icon: <CreditCard className="w-8 h-8 text-purple-600" />,
                desc: "Official digital identity card with your photo and ID."
              }
            ].map((card) => (
              <div key={card.type} className="group bg-white border border-green-600 p-6 hover:bg-green-50 transition-all duration-300 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  {card.icon}
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2 uppercase">{card.title}</h3>
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
                  {viewingDoc === 'id' && <CreditCard className="text-purple-600" />}
                  {viewingDoc === 'auth' ? 'Authorization Letter' : viewingDoc === 'consent' ? 'Letter of Consent' : viewingDoc === 'mou' ? 'MOU & Agreement' : 'Identity Card'}
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
                  {viewingDoc === 'auth' && <AuthorizationTemplate application={app} formData={formData} empId={empId} logo={logo} detectedPost={detectedPostName} templateRef={authTemplateRef} />}
                  {viewingDoc === 'consent' && <ConsentTemplate application={app} formData={formData} empId={empId} logo={logo} detectedPost={detectedPostName} templateRef={consentTemplateRef} />}
                  {viewingDoc === 'mou' && <MOUTemplate application={app} formData={formData} empId={empId} logo={logo} detectedPost={detectedPostName} templateRef={mouTemplateRef} />}
                  {viewingDoc === 'id' && <IDCardTemplate application={app} formData={formData} empId={empId} logo={logo} detectedPost={detectedPostName} templateRef={idCardTemplateRef} />}
                </div>
              </div>
            </div>
          </div>
        )}

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

                {/* Education Qualifications */}
                <div className="bg-white p-5 border border-gray-200 shadow-sm mt-5">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
                    <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                      <GraduationCap size={18} className="text-purple-600"/> Education Qualifications
                    </h4>
                    <button 
                      type="button" 
                      onClick={addEducationRow}
                      className="text-[10px] font-bold text-white bg-purple-600 px-3 py-1.5 hover:bg-purple-700 transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Plus size={12} /> Add Education
                    </button>
                  </div>
                  
                  {(!editFormData.educationDetails || editFormData.educationDetails.length === 0) ? (
                    <div className="text-center p-4 bg-gray-50 border border-dashed border-gray-300 text-xs text-gray-500 font-semibold italic">
                      No education details added yet. Click 'Add Education' to start.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {editFormData.educationDetails.map((edu, idx) => (
                        <div key={idx} className="relative grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 border border-gray-200 group">
                          <button 
                            type="button"
                            onClick={() => removeEducationRow(idx)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 border border-red-200 rounded-full flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                            title="Remove Row"
                          >
                            <X size={12} />
                          </button>
                          <div>
                            <label className="block text-[9px] font-black text-gray-600 uppercase mb-1 tracking-wider">Level/Degree</label>
                            <input type="text" value={edu.level} onChange={(e) => handleEducationChange(idx, 'level', e.target.value)} className="w-full p-2 bg-white border border-gray-300 text-xs font-bold text-gray-800 focus:ring-1 focus:ring-purple-500 outline-none" placeholder="e.g. 10th, 12th, B.A." />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-gray-600 uppercase mb-1 tracking-wider">Board/University</label>
                            <input type="text" value={edu.board} onChange={(e) => handleEducationChange(idx, 'board', e.target.value)} className="w-full p-2 bg-white border border-gray-300 text-xs font-bold text-gray-800 focus:ring-1 focus:ring-purple-500 outline-none" placeholder="e.g. CBSE, State Board" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-gray-600 uppercase mb-1 tracking-wider">Passing Year</label>
                            <input type="text" value={edu.year} onChange={(e) => handleEducationChange(idx, 'year', e.target.value)} className="w-full p-2 bg-white border border-gray-300 text-xs font-bold text-gray-800 focus:ring-1 focus:ring-purple-500 outline-none" placeholder="e.g. 2020" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-gray-600 uppercase mb-1 tracking-wider">Percentage/Grade</label>
                            <input type="text" value={edu.percentage} onChange={(e) => handleEducationChange(idx, 'percentage', e.target.value)} className="w-full p-2 bg-white border border-gray-300 text-xs font-bold text-gray-800 focus:ring-1 focus:ring-purple-500 outline-none" placeholder="e.g. 85%" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-gray-600 uppercase mb-1 tracking-wider">Document</label>
                            <div className="flex flex-col gap-1.5">
                              {edu.file && (
                                <button type="button" onClick={() => setPreviewDocUrl(cleanImageUrl(edu.file))} className="inline-flex items-center justify-center gap-1 p-1.5 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors text-[10px] font-bold shadow-sm rounded-sm text-center" title="View Uploaded Document">
                                  <Eye size={12} /> View Document
                                </button>
                              )}
                              <input 
                                type="file" 
                                accept="image/*,.pdf"
                                onChange={(e) => handleEducationDocUpload(idx, e)}
                                disabled={uploadingDocIndex === idx}
                                className="w-full text-[9px] file:mr-2 file:py-1 file:px-2 file:rounded-sm file:border-0 file:text-[9px] file:font-bold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer disabled:opacity-50" 
                              />
                            </div>
                            {uploadingDocIndex === idx && <p className="text-[9px] text-purple-600 mt-1 font-bold animate-pulse text-center">Uploading...</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

      {/* Document Preview Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl h-[85vh] flex flex-col rounded-md shadow-2xl relative">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-sm">Document Preview</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => setPreviewDocUrl(null)} className="text-gray-500 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-100 p-2 overflow-hidden flex items-center justify-center">
              {previewDocUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewDocUrl} className="w-full h-full border-0 bg-white shadow-sm" title="Document Preview" />
              ) : (
                <img src={previewDocUrl} alt="Document Preview" className="max-w-full max-h-full object-contain shadow-sm bg-white" />
              )}
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default EmployeeProfile;
