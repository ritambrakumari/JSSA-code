import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  FileText,
  CheckCircle2,
  XCircle,
  Calendar,
  Building,
  CreditCard,
  Download,
  Save,
  Loader2,
  Camera,
  Upload,
} from "lucide-react";
import { applicationsAPI, jobPostingsAPI, feedAPI } from "../../utils/api";
import toast from "react-hot-toast";

// Landing-theme (blue) look for success toasts on this page
const BLUE_TOAST = {
  iconTheme: { primary: "#4D7C0F", secondary: "#ffffff" },
  style: { border: "1px solid #D9F99D", color: "#3F6212", fontWeight: 600 },
};

const ApplicationEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [application, setApplication] = useState(null);
  const [jobPosting, setJobPosting] = useState(null);
  
  const photoRef = useRef(null);
  const signatureRef = useRef(null);

  const [formData, setFormData] = useState({
    candidateName: "",
    fatherName: "",
    motherName: "",
    dob: "",
    gender: "",
    nationality: "",
    category: "",
    aadhar: "",
    pan: "",
    mobile: "",
    email: "",
    address: "",
    state: "",
    district: "",
    block: "",
    panchayat: "",
    pincode: "",
    higherEducation: "",
    board: "",
    marks: "",
    markPercentage: "",
    photo: "",
    signature: "",
  });

  const getPostingId = (jobPostingId) => {
    if (!jobPostingId) return null;
    if (typeof jobPostingId === "string") return jobPostingId;
    if (typeof jobPostingId === "object") return jobPostingId._id || null;
    return null;
  };

  useEffect(() => {
    const fetchApplication = async () => {
      setLoading(true);
      try {
        const response = await applicationsAPI.getById(id);
        if (response.success && response.data) {
          const app = response.data.application;
          setApplication(app);
          setFormData({
            candidateName: app.candidateName || "",
            fatherName: app.fatherName || "",
            motherName: app.motherName || "",
            dob: app.dob ? new Date(app.dob).toISOString().split('T')[0] : "",
            gender: app.gender || "",
            nationality: app.nationality || "",
            category: app.category || "",
            aadhar: app.aadhar || "",
            pan: app.pan || "",
            mobile: app.mobile || "",
            email: app.email || "",
            address: app.address || "",
            state: app.state || "",
            district: app.district || "",
            block: app.block || "",
            panchayat: app.panchayat || "",
            pincode: app.pincode || "",
            higherEducation: app.higherEducation || "",
            board: app.board || "",
            marks: app.marks || "",
            markPercentage: app.markPercentage || "",
            photo: app.photo || "",
            signature: app.signature || "",
          });

          const postingId = getPostingId(app.jobPostingId) || getPostingId(app.resolvedJobPostingId);
          if (postingId) {
            const jobResponse = await jobPostingsAPI.getById(postingId);
            if (jobResponse.success && jobResponse.data) {
              setJobPosting(jobResponse.data.posting);
            }
          }
        }
      } catch (err) {
        toast.error("Failed to load application");
      } finally {
        setLoading(false);
      }
    };
    fetchApplication();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading(`Uploading ${type}...`);
    try {
      const data = new FormData();
      data.append("image", file);
      const res = await feedAPI.uploadImage(data);
      if (res.success && res.data) {
        setFormData((prev) => ({ ...prev, [type]: res.data.url }));
        toast.success(`${type} updated`, { id: toastId, ...BLUE_TOAST });
      } else {
        toast.error("Upload failed", { id: toastId });
      }
    } catch (err) {
      toast.error("Error uploading file", { id: toastId });
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await applicationsAPI.update(id, formData);
      if (res.success) {
        toast.success("Application updated successfully", BLUE_TOAST);
        navigate(`/applications/view/${id}`);
      } else {
        toast.error(res.error || "Update failed");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout activePath="/application-form">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-[#4D7C0F]" />
        </div>
      </DashboardLayout>
    );
  }

  const statusColors = {
    paid: "bg-green-50 text-green-700 border-green-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  };

  const paymentStatus = application?.paymentStatus || "pending";

  return (
    <DashboardLayout activePath="/application-form">
      <div className="ml-6 space-y-4 pb-8">
        {/* Breadcrumb + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate("/application-form")}
              className="flex items-center gap-1.5 text-[#4D7C0F] font-medium hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Application Form
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-[#4D7C0F] font-black uppercase tracking-widest bg-[#ECFCCB] px-2 py-0.5 rounded border border-[#D9F99D]">
              Editing Applicant Details
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-1.5 bg-[#4D7C0F] text-white px-6 py-2 rounded text-sm font-bold hover:bg-[#3F6212] transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </button>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-5" style={{ background: "linear-gradient(100deg,#3F6212 0%,#4D7C0F 55%,#65A30D 100%)" }}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {formData.photo ? (
                    <img
                      src={formData.photo}
                      alt={formData.candidateName}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                      className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-md">
                      {formData.candidateName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    name="candidateName"
                    value={formData.candidateName}
                    onChange={handleInputChange}
                    className="bg-transparent text-white font-bold text-xl sm:text-2xl leading-snug border-b border-white/30 focus:border-white outline-none w-full mb-1 placeholder:text-white/50"
                    placeholder="Candidate Name"
                  />
                  <p className="text-[#ECFCCB] text-sm">
                    Application Number: {application?.applicationNumber || "N/A"}
                  </p>
                </div>
              </div>
              <span
                className={`self-start flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusColors[paymentStatus] || statusColors.pending}`}
              >
                {paymentStatus === "paid" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {paymentStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Quick Info Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 border-b border-gray-100">
            <EditQuickInfo
              icon={<User className="w-4 h-4" />}
              label="Father's Name"
              name="fatherName"
              value={formData.fatherName}
              onChange={handleInputChange}
            />
            <EditQuickInfo
              icon={<Phone className="w-4 h-4" />}
              label="Mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
            />
            <EditQuickInfo
              icon={<MapPin className="w-4 h-4" />}
              label="District"
              name="district"
              value={formData.district}
              onChange={handleInputChange}
            />
            <EditQuickInfo
              icon={<GraduationCap className="w-4 h-4" />}
              label="Education"
              name="higherEducation"
              value={formData.higherEducation}
              onChange={handleInputChange}
              type="select"
              options={["MATRIC", "INTERMEDIATE", "GRADUATION", "POST GRADUATION", "OTHER"]}
            />
          </div>
        </div>

        {/* Body Grid */}
        <div className="space-y-4">
          {/* Main Form Area */}
          <div className="space-y-4">
            {/* Personal Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#4D7C0F] uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <FormRow label="Mother's Name" name="motherName" value={formData.motherName} onChange={handleInputChange} />
                <FormRow label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleInputChange} />
                <FormRow 
                  label="Gender" 
                  name="gender" 
                  type="select" 
                  value={formData.gender} 
                  onChange={handleInputChange} 
                  options={["Male", "Female", "Other"]}
                />
                <FormRow 
                  label="Category" 
                  name="category" 
                  type="select" 
                  value={formData.category} 
                  onChange={handleInputChange} 
                  options={["General", "OBC", "SC", "ST", "EWS"]}
                />
                <FormRow label="Nationality" name="nationality" value={formData.nationality} onChange={handleInputChange} />
                <FormRow label="Aadhar Number" name="aadhar" value={formData.aadhar} onChange={handleInputChange} />
                <FormRow label="PAN Number" name="pan" value={formData.pan} onChange={handleInputChange} />
                <FormRow label="Email Address" name="email" value={formData.email} onChange={handleInputChange} />
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#4D7C0F] uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase mb-1 block">Full Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:border-[#4D7C0F] focus:ring-1 focus:ring-[#4D7C0F] outline-none font-semibold text-gray-800 shadow-sm"
                    rows="2"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormRow label="State" name="state" value={formData.state} onChange={handleInputChange} />
                  <FormRow label="District" name="district" value={formData.district} onChange={handleInputChange} />
                  <FormRow label="Block" name="block" value={formData.block} onChange={handleInputChange} />
                  <FormRow label="Panchayat" name="panchayat" value={formData.panchayat} onChange={handleInputChange} />
                  <FormRow label="Pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} />
                </div>
              </div>
            </div>

            {/* Education Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#4D7C0F] uppercase tracking-wider mb-4 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Education Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <FormRow label="Board / University" name="board" value={formData.board} onChange={handleInputChange} />
                <FormRow label="Total Marks" name="marks" value={formData.marks} onChange={handleInputChange} />
                <FormRow label="Percentage" name="markPercentage" value={formData.markPercentage} onChange={handleInputChange} />
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#4D7C0F] uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Uploaded Documents
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-400 uppercase">Photo</label>
                    <button 
                      onClick={() => photoRef.current?.click()}
                      className="text-[10px] bg-[#4D7C0F] text-white px-2 py-1 rounded font-bold hover:bg-[#3F6212] transition-colors"
                    >
                      Change
                    </button>
                  </div>
                  <div className="aspect-square w-full relative overflow-hidden rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center">
                    {formData.photo ? (
                      <img
                        src={formData.photo}
                        alt="Candidate Photo"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                       <User className="w-12 h-12 text-gray-200" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={photoRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "photo")}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-400 uppercase">Signature</label>
                    <button 
                      onClick={() => signatureRef.current?.click()}
                      className="text-[10px] bg-[#4D7C0F] text-white px-2 py-1 rounded font-bold hover:bg-[#3F6212] transition-colors"
                    >
                      Change
                    </button>
                  </div>
                  <div className="aspect-[3/1] w-full relative overflow-hidden rounded-lg border border-gray-100 bg-gray-50 p-2 flex items-center justify-center">
                    {formData.signature ? (
                      <img
                        src={formData.signature}
                        alt="Candidate Signature"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                       <FileText className="w-8 h-8 text-gray-200" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={signatureRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "signature")}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
           <button
              onClick={() => navigate(-1)}
              className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-bold uppercase text-[11px] tracking-wider rounded hover:bg-gray-50 transition-colors"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-10 py-3 bg-[#4D7C0F] text-white font-bold uppercase text-[11px] tracking-wider rounded hover:bg-[#3F6212] transition-colors shadow-lg shadow-[#D9F99D] disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Applicant Data
            </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

// --- Helper Components ---

const EditQuickInfo = ({ icon, label, name, value, onChange, type = "text", options = [] }) => (
  <div className="flex items-center gap-3 p-4">
    <div className="w-10 h-10 rounded-full bg-[#ECFCCB] flex items-center justify-center text-[#4D7C0F] shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-0.5">{label}</label>
      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full bg-transparent font-bold text-gray-800 text-xs focus:ring-0 outline-none cursor-pointer"
        >
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          className="w-full bg-transparent font-bold text-gray-800 text-xs border-b border-transparent focus:border-[#4D7C0F] outline-none"
        />
      )}
    </div>
  </div>
);

const FormRow = ({ label, name, value, onChange, type = "text", options = [] }) => (
  <div>
    <label className="text-[11px] font-bold text-gray-400 uppercase mb-1 block tracking-wider">{label}</label>
    {type === "select" ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full h-10 px-3 bg-white border border-gray-300 rounded focus:border-[#4D7C0F] focus:ring-1 focus:ring-[#4D7C0F] outline-none font-semibold text-gray-800 transition-all shadow-sm"
      >
        <option value="">Select {label}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full h-10 px-3 bg-white border border-gray-300 rounded focus:border-[#4D7C0F] focus:ring-1 focus:ring-[#4D7C0F] outline-none font-semibold text-gray-800 transition-all shadow-sm"
      />
    )}
  </div>
);

const StaticRow = ({ label, value, className = "" }) => (
  <div className="flex justify-between items-center gap-4">
    <span className="text-[11px] font-medium text-gray-500">{label}</span>
    <span className={`text-[11px] font-bold text-gray-800 ${className}`}>{value || "—"}</span>
  </div>
);

export default ApplicationEdit;
