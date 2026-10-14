import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { createPaperAPI } from "../../utils/api";
import {
  UserCheck,
  ArrowLeft,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Award,
  Briefcase,
  FileText,
  Edit3,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
import { applicationsAPI, uploadAPI } from "../../utils/api";
import indianStates from "../../data/states.json";
import indianDistricts from "../../data/district.json";

const GENDER_OPTIONS = ["male", "female", "other"];
const CATEGORY_OPTIONS = ["general", "obc", "sc", "st", "ews"];
const NATIONALITY_OPTIONS = ["indian", "other"];
const MARITAL_STATUS_OPTIONS = ["Unmarried", "Married", "Widowed", "Divorced"];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const RELATION_OPTIONS = ["Father", "Mother", "Spouse", "Son", "Daughter", "Brother", "Sister", "Other"];
const DISABILITY_OPTIONS = ["No", "Yes"];

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

function InfoGroup({ label, value, isEditing, onChange, type = "text", options = [], error }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{label}</label>
      {isEditing ? (
        type === "select" ? (
          <div className="relative">
            <select
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full text-sm font-bold text-gray-900 border-2 rounded-md px-3 py-1.5 outline-none transition-all appearance-none ${
                error 
                  ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200" 
                  : "border-blue-200 bg-blue-50/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              }`}
            >
              <option value="">-- Select --</option>
              {options.map(opt => (
                <option key={opt} value={opt}>{opt.toUpperCase()}</option>
              ))}
            </select>
            <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${error ? 'text-red-400' : 'text-blue-400'}`}>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>
        ) : (
          <input
            type={type}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full text-sm font-bold text-gray-900 border-2 rounded-md px-3 py-1.5 outline-none transition-all ${
              error 
                ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200" 
                : "border-blue-200 bg-blue-50/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            }`}
          />
        )
      ) : (
        <div className="text-sm font-bold text-gray-900 border-l-2 border-[#3AB000] pl-2 py-1 bg-gray-50/50 min-h-[32px] flex items-center">
          {value || "N/A"}
        </div>
      )}
      {isEditing && error && (
        <p className="text-[10px] font-bold text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

function SectionHeader({ title, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-6">
      {Icon && <Icon size={18} className="text-[#3AB000]" />}
      <h3 className="text-sm font-black text-black uppercase tracking-[0.2em]">{title}</h3>
    </div>
  );
}

const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // Remove leading slash if any
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `https://api.jssabhiyan.com/api/files/${cleanPath}`;
};

export default function MOUDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [duplicateError, setDuplicateError] = useState("");
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  useEffect(() => {
    const checkDuplicate = async () => {
      if (!isEditing || !data || !data.applicationId) return;

      const oldEmail = data.applicationId.email;
      const oldMobile = data.applicationId.mobile;
      const newEmail = editData.email;
      const newMobile = editData.mobile;

      if ((newEmail && newEmail !== oldEmail) || (newMobile && newMobile !== oldMobile)) {
        try {
          setIsCheckingDuplicate(true);
          const res = await applicationsAPI.checkDuplicate({
            email: newEmail !== oldEmail ? newEmail : undefined,
            mobile: newMobile !== oldMobile ? newMobile : undefined,
            excludeUserId: data.applicationId.createdBy,
          });
          
          if (res && res.isDuplicate) {
            setDuplicateError(res.message);
          } else {
            setDuplicateError("");
          }
        } catch (err) {
          console.error("Failed to check duplicate", err);
        } finally {
          setIsCheckingDuplicate(false);
        }
      } else {
        setDuplicateError("");
        setIsCheckingDuplicate(false);
      }
    };

    const timeoutId = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(timeoutId);
  }, [editData.email, editData.mobile, isEditing, data]);

  useEffect(() => {
    // Check for edit mode in URL
    const params = new URLSearchParams(location.search);
    if (params.get('edit') === 'true') {
      setIsEditing(true);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await createPaperAPI.getMOUGlobalDetails(id);
        if (res.success) {
          setData(res.data);
          // Initialize editData with candidate details
          if (res.data.applicationId) {
            setEditData(res.data.applicationId);
          }
        } else {
          setError(res.error || "Failed to load candidate details");
        }
      } catch (err) {
        setError("Connection error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Revert changes if cancelling
      setEditData(data.applicationId);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Cascading logic for Address
      if (field === 'state') {
        newData.district = "";
      }
      
      return newData;
    });
  };

  const handleFileChange = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingDoc(field);
    try {
      const res = await uploadAPI.uploadMOUDucument(file, field);
      if (res.success) {
        toast.success(`${field} uploaded successfully`);
        setEditData(prev => ({ ...prev, [field]: res.data.url }));
      } else {
        toast.error(res.error || "Upload failed");
      }
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const res = await applicationsAPI.update(data.applicationId._id, editData);
      if (res.success) {
        toast.success("Candidate details updated successfully");
        setData(prev => ({
          ...prev,
          applicationId: { ...prev.applicationId, ...editData }
        }));
        setIsEditing(false);
      } else {
        toast.error(res.error || "Failed to update details");
      }
    } catch (err) {
      toast.error("An error occurred while saving");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#3AB000] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Fetching candidate data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-red-600 font-bold">{error || "Candidate not found"}</p>
            <button
              onClick={() => navigate("/admin/mou")}
              className="mt-4 px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest"
            >
              Back to MOU List
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const candidate = data.applicationId || {};
  const education = candidate.educationDetails || [];
  const test = data.testId || {};

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Back Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-gray-200 shadow-sm">
          <button
            onClick={() => navigate("/admin/mou")}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-[#3AB000] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Candidates
          </button>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={!!duplicateError}
                  className={`flex items-center gap-2 px-6 py-2.5 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-md ${
                    duplicateError ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-black active:scale-95"
                  }`}
                >
                  <Save size={14} />
                  Save Changes
                </button>
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95"
                >
                  <X size={14} />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleEditToggle}
                className="flex items-center gap-2 px-6 py-2.5 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-md active:scale-95"
              >
                <Edit3 size={14} />
                Edit Candidate Info
              </button>
            )}
            <button className="flex items-center gap-2 px-6 py-2.5 bg-[#3AB000] text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95">
              <Download size={14} />
              Export Candidate PDF
            </button>
          </div>
        </div>

        {/* Main Profile Card */}
        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
          {/* Cover/Top Header */}
          <div className="h-32 bg-[#3AB000] relative">
            <div className="absolute -bottom-16 left-8 p-1 bg-white border-2 border-gray-100 shadow-xl group/photo">
              <div className="w-32 h-32 bg-gray-50 overflow-hidden relative">
                {candidate.photo ? (
                  <img
                    src={getFileUrl(isEditing ? editData.photo : candidate.photo)}
                    alt="Candidate"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200">
                    <UserCheck size={48} />
                  </div>
                )}

                {isEditing && (
                  <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer">
                    {uploadingDoc === 'photo' ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload size={20} />
                        <span className="text-[8px] font-bold uppercase mt-1">Change Photo</span>
                      </>
                    )}
                    <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'photo')} />
                  </label>
                )}
              </div>
            </div>
            <div className="absolute bottom-6 left-44">
              {isEditing ? (
                <input
                  value={editData.candidateName || ""}
                  onChange={(e) => handleInputChange('candidateName', e.target.value)}
                  className="text-3xl font-black text-white uppercase tracking-tighter leading-none bg-white/20 outline-none border-b-2 border-white w-full max-w-md placeholder:text-white/50"
                  placeholder="CANDIDATE NAME"
                />
              ) : (
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none drop-shadow-md">
                  {candidate.candidateName}
                </h1>
              )}
              <p className="text-[10px] text-white/80 font-black uppercase tracking-[0.4em] mt-3 bg-black/20 w-fit px-2 py-0.5">
                Full Profile Dashboard
              </p>
            </div>
            <div className="absolute bottom-6 right-8 flex items-center gap-2">
              <span className={`px-5 py-2 text-[11px] font-black uppercase tracking-widest border-2 shadow-lg ${
                data.mouStatus === "Done"
                  ? "border-white text-white bg-black/20"
                  : data.mouStatus === "ConvertedEmployee"
                    ? "border-white text-white bg-slate-600/90"
                    : "border-white/50 text-white bg-amber-500/80"
              }`}>
                Status:{" "}
                {data.mouStatus === "ConvertedEmployee"
                  ? "Converted Employee"
                  : data.mouStatus || "Pending"}
              </span>
            </div>
          </div>

          {/* Profile Stats Bar */}
          <div className="mt-20 px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-gray-100 bg-gray-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 text-gray-400">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">App Number</p>
                <p className="text-sm font-black text-black tracking-tight">{candidate.applicationNumber || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 text-gray-400">
                <Award size={18} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Exam Score</p>
                <p className="text-sm font-black text-[#3AB000] tracking-tight">{data.score || 0} Marks</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 text-gray-400">
                <Briefcase size={18} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Job Applied</p>
                <p className="text-sm font-black text-black tracking-tight line-clamp-1">{test.title || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 text-gray-400">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Applied On</p>
                <p className="text-sm font-black text-black tracking-tight">{candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Personal & Family */}
            <div className="lg:col-span-8 space-y-12">

              {/* Personal Details */}
              <div>
                <SectionHeader title="Personal Information" icon={Shield} />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8">
                  <InfoGroup label="Father's Name" value={isEditing ? editData.fatherName : candidate.fatherName} isEditing={isEditing} onChange={(val) => handleInputChange('fatherName', val)} />
                  <InfoGroup label="Mother's Name" value={isEditing ? editData.motherName : candidate.motherName} isEditing={isEditing} onChange={(val) => handleInputChange('motherName', val)} />
                  <InfoGroup label="Date of Birth" value={isEditing ? (editData.dob ? new Date(editData.dob).toISOString().split('T')[0] : "") : (candidate.dob ? new Date(candidate.dob).toLocaleDateString() : "N/A")} isEditing={isEditing} onChange={(val) => handleInputChange('dob', val)} type="date" />
                  <InfoGroup label="Gender" value={isEditing ? editData.gender : candidate.gender} isEditing={isEditing} onChange={(val) => handleInputChange('gender', val)} type="select" options={GENDER_OPTIONS} />
                  <InfoGroup label="Category" value={isEditing ? editData.category : candidate.category} isEditing={isEditing} onChange={(val) => handleInputChange('category', val)} type="select" options={CATEGORY_OPTIONS} />
                  <InfoGroup label="Nationality" value={isEditing ? editData.nationality : candidate.nationality} isEditing={isEditing} onChange={(val) => handleInputChange('nationality', val)} type="select" options={NATIONALITY_OPTIONS} />
                  <InfoGroup label="Religion" value={isEditing ? editData.religion : candidate.religion} isEditing={isEditing} onChange={(val) => handleInputChange('religion', val)} />
                  <InfoGroup label="Marital Status" value={isEditing ? editData.maritalStatus : candidate.maritalStatus} isEditing={isEditing} onChange={(val) => handleInputChange('maritalStatus', val)} type="select" options={MARITAL_STATUS_OPTIONS} />
                  <InfoGroup label="Blood Group" value={isEditing ? editData.bloodGroup : candidate.bloodGroup} isEditing={isEditing} onChange={(val) => handleInputChange('bloodGroup', val)} type="select" options={BLOOD_GROUP_OPTIONS} />
                  <InfoGroup label="Disability" value={isEditing ? editData.handicapDisability : candidate.handicapDisability} isEditing={isEditing} onChange={(val) => handleInputChange('handicapDisability', val)} type="select" options={DISABILITY_OPTIONS} />
                  <InfoGroup label="Languages" value={isEditing ? editData.languageKnown : candidate.languageKnown} isEditing={isEditing} onChange={(val) => handleInputChange('languageKnown', val)} />
                  <InfoGroup label="Aadhaar No" value={isEditing ? editData.aadhar : candidate.aadhar} isEditing={isEditing} onChange={(val) => handleInputChange('aadhar', val)} />
                  <InfoGroup label="Pan Card No" value={isEditing ? editData.pan : candidate.pan} isEditing={isEditing} onChange={(val) => handleInputChange('pan', val)} />
                </div>
              </div>

              {/* Nominee Details */}
              <div>
                <SectionHeader title="Nominee Information" icon={UserCheck} />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8">
                  <InfoGroup label="Nominee Name" value={isEditing ? editData.nomineeName : candidate.nomineeName} isEditing={isEditing} onChange={(val) => handleInputChange('nomineeName', val)} />
                  <InfoGroup label="Relation" value={isEditing ? editData.nomineeRelation : candidate.nomineeRelation} isEditing={isEditing} onChange={(val) => handleInputChange('nomineeRelation', val)} type="select" options={RELATION_OPTIONS} />
                  <InfoGroup label="Nominee Age" value={isEditing ? editData.nomineeAge : candidate.nomineeAge} isEditing={isEditing} onChange={(val) => handleInputChange('nomineeAge', val)} type="number" />
                  <InfoGroup label="Nominee Aadhaar" value={isEditing ? editData.nomineeAadhar : candidate.nomineeAadhar} isEditing={isEditing} onChange={(val) => handleInputChange('nomineeAadhar', val)} />
                  <InfoGroup label="Nominee Mobile" value={isEditing ? editData.nomineeMobile : candidate.nomineeMobile} isEditing={isEditing} onChange={(val) => handleInputChange('nomineeMobile', val)} />
                  <InfoGroup label="Nominee Email" value={isEditing ? editData.nomineeEmail : candidate.nomineeEmail} isEditing={isEditing} onChange={(val) => handleInputChange('nomineeEmail', val)} type="email" />
                </div>
              </div>

              {/* Educational Qualifications */}
              <div>
                <SectionHeader title="Academic Qualifications" icon={Award} />
                {education.length > 0 ? (
                  <div className="overflow-hidden border border-gray-200">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-gray-200">
                          <th className="px-6 py-3">Degree/Level</th>
                          <th className="px-6 py-3">Board/University</th>
                          <th className="px-6 py-3 text-center">Year</th>
                          <th className="px-6 py-3 text-center">Marks (%)</th>
                          <th className="px-6 py-3 text-center">Document</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {education.map((edu, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-black text-gray-800 text-sm">{edu.level}</td>
                            <td className="px-6 py-4 text-gray-600 font-bold text-sm">{edu.board}</td>
                            <td className="px-6 py-4 text-center text-gray-600 font-bold text-sm">{edu.year}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="px-3 py-1 bg-black text-white font-black text-xs">{edu.percentage}%</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {edu.file ? (
                                <a
                                  href={getFileUrl(edu.file)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-black text-[#3AB000] uppercase hover:underline"
                                >
                                  View Doc
                                </a>
                              ) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-200">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest italic">No educational records available</p>
                  </div>
                )}
              </div>

              {/* Uploaded Documents Grid */}
              <div>
                <SectionHeader title="Uploaded Documents" icon={FileText} />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {[
                    { label: "Aadhar Front", field: "aadharFront", file: isEditing ? editData.aadharFront : candidate.aadharFront },
                    { label: "Aadhar Back", field: "aadharBack", file: isEditing ? editData.aadharBack : candidate.aadharBack },
                    { label: "Pan Card", field: "panCard", file: isEditing ? editData.panCard : candidate.panCard },
                    { label: "Bank Passbook/Cheque", field: "bankDoc", file: isEditing ? editData.bankDoc : candidate.bankDoc },
                  ].map((doc, idx) => (
                    <div key={idx} className={`bg-gray-50 border p-4 flex flex-col items-center justify-center space-y-3 group transition-all ${isEditing ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200 hover:border-[#3AB000]'}`}>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{doc.label}</p>
                      
                      {isEditing ? (
                        <div className="w-full space-y-2">
                          <label className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white text-[10px] font-black uppercase cursor-pointer hover:bg-black transition-colors">
                            {uploadingDoc === doc.field ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={12} />}
                            {doc.file ? "Change File" : "Upload File"}
                            <input type="file" className="hidden" onChange={(e) => handleFileChange(e, doc.field)} />
                          </label>
                          {doc.file && (
                            <p className="text-[8px] text-blue-600 font-bold truncate text-center">File Uploaded ✓</p>
                          )}
                        </div>
                      ) : (
                        doc.file ? (
                          <a
                            href={getFileUrl(doc.file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 bg-black text-white text-[10px] font-black uppercase text-center hover:bg-[#3AB000] transition-colors"
                          >
                            View Document
                          </a>
                        ) : (
                          <div className="w-full py-2 bg-gray-100 text-gray-400 text-[10px] font-black uppercase text-center border border-dashed border-gray-300">
                            Not Uploaded
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bank Details (If any) */}
              <div>
                <SectionHeader title="Banking Information" icon={Shield} />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <InfoGroup label="Bank Name" value={isEditing ? editData.bankName : candidate.bankName} isEditing={isEditing} onChange={(val) => handleInputChange('bankName', val)} type="select" options={INDIAN_BANKS} />
                  <InfoGroup label="Branch" value={isEditing ? editData.branchName : candidate.branchName} isEditing={isEditing} onChange={(val) => handleInputChange('branchName', val)} />
                  <InfoGroup label="IFSC Code" value={isEditing ? editData.ifscCode : candidate.ifscCode} isEditing={isEditing} onChange={(val) => handleInputChange('ifscCode', val)} />
                  <InfoGroup label="Account No" value={isEditing ? editData.accountNumber : candidate.accountNumber} isEditing={isEditing} onChange={(val) => handleInputChange('accountNumber', val)} />
                  <InfoGroup label="Holder Name" value={isEditing ? editData.accountHolderName : candidate.accountHolderName} isEditing={isEditing} onChange={(val) => handleInputChange('accountHolderName', val)} />
                </div>
              </div>
            </div>

            {/* Right Column: Contact & Address */}
            <div className="lg:col-span-4 space-y-8">

              {/* Contact Card */}
              <div className="bg-gray-50 p-6 border-l-4 border-black space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Phone size={14} className="text-[#3AB000]" /> Contact Info
                </h4>
                <div className="flex items-start gap-3">
                  <Mail size={16} className="text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Email</p>
                    {isEditing ? (
                      <div>
                        <div className="relative">
                          <input
                            value={editData.email || ""}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={`w-full text-sm font-bold text-gray-800 border-2 rounded px-2 py-1 pr-8 bg-white outline-none transition-all ${
                              duplicateError && duplicateError.includes("Email")
                                ? "border-red-400 focus:border-red-500 ring-2 ring-red-200" 
                                : "border-blue-200 focus:border-blue-500"
                            }`}
                          />
                          {isCheckingDuplicate && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                        {duplicateError && duplicateError.includes("Email") && (
                          <p className="text-[10px] font-bold text-red-500 mt-1">{duplicateError}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-gray-800 break-all">{candidate.email || "N/A"}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Mobile</p>
                    {isEditing ? (
                      <div>
                        <div className="relative">
                          <input
                            value={editData.mobile || ""}
                            onChange={(e) => handleInputChange('mobile', e.target.value)}
                            className={`w-full text-sm font-bold text-gray-800 border-2 rounded px-2 py-1 pr-8 bg-white outline-none transition-all ${
                              duplicateError && duplicateError.includes("Mobile Number")
                                ? "border-red-400 focus:border-red-500 ring-2 ring-red-200" 
                                : "border-blue-200 focus:border-blue-500"
                            }`}
                          />
                          {isCheckingDuplicate && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                        {duplicateError && duplicateError.includes("Mobile Number") && (
                          <p className="text-[10px] font-bold text-red-500 mt-1">{duplicateError}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-gray-800">{candidate.mobile || "N/A"}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Card */}
              <div className="bg-gray-50 p-6 border-l-4 border-[#3AB000] space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MapPin size={14} className="text-black" /> Permanent Address
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Village/Tola</p>
                    {isEditing ? (
                      <input
                        value={editData.villageTola || ""}
                        onChange={(e) => handleInputChange('villageTola', e.target.value)}
                        className="w-full text-sm font-bold text-gray-800 border-2 border-blue-200 rounded px-2 py-1 bg-white outline-none focus:border-blue-500 transition-all"
                      />
                    ) : (
                      <p className="text-sm font-bold text-gray-800">{candidate.villageTola || "N/A"}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">State</p>
                      {isEditing ? (
                        <div className="relative">
                          <select
                            value={editData.state || ""}
                            onChange={(e) => handleInputChange('state', e.target.value)}
                            className="w-full text-sm font-bold text-gray-800 border-2 border-blue-200 rounded px-2 py-1 bg-white outline-none focus:border-blue-500 transition-all appearance-none pr-8"
                          >
                            <option value="">-- Select State --</option>
                            {Array.isArray(indianStates) && indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-gray-800">{candidate.state || "N/A"}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">District</p>
                      {isEditing ? (
                        <div className="relative">
                          <select
                            value={editData.district || ""}
                            onChange={(e) => handleInputChange('district', e.target.value)}
                            className="w-full text-sm font-bold text-gray-800 border-2 border-blue-200 rounded px-2 py-1 bg-white outline-none focus:border-blue-500 transition-all appearance-none pr-8"
                          >
                            <option value="">-- Select District --</option>
                            {(indianDistricts && indianDistricts[editData.state] || []).map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-gray-800">{candidate.district || "N/A"}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Block</p>
                      {isEditing ? (
                        <input
                          value={editData.blockKhand || ""}
                          onChange={(e) => handleInputChange('blockKhand', e.target.value)}
                          className="w-full text-sm font-bold text-gray-800 border-2 border-blue-200 rounded px-2 py-1 bg-white outline-none focus:border-blue-500 transition-all"
                        />
                      ) : (
                        <p className="text-sm font-bold text-gray-800">{candidate.blockKhand || "N/A"}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Pincode</p>
                      {isEditing ? (
                        <input
                          value={editData.pincode || ""}
                          onChange={(e) => handleInputChange('pincode', e.target.value)}
                          className="w-full text-sm font-bold text-gray-800 border-2 border-blue-200 rounded px-2 py-1 bg-white outline-none focus:border-blue-500 transition-all"
                        />
                      ) : (
                        <p className="text-sm font-bold text-gray-800">{candidate.pincode || "N/A"}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-6 space-y-6 text-center group/sig">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate Signature</p>
                <div className="h-24 w-full bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center p-2 relative overflow-hidden">
                  {candidate.signature || (isEditing && editData.signature) ? (
                    <img
                      src={getFileUrl(isEditing ? editData.signature : candidate.signature)}
                      alt="Signature"
                      className="max-h-full max-w-full grayscale hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-300 uppercase font-bold">No Signature Image</span>
                  )}

                  {isEditing && (
                    <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover/sig:opacity-100 transition-opacity cursor-pointer">
                      {uploadingDoc === 'signature' ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload size={16} />
                          <span className="text-[8px] font-bold uppercase mt-1">Change Signature</span>
                        </>
                      )}
                      <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'signature')} />
                    </label>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
