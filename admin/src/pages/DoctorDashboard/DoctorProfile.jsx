import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { doctorsAPI } from "../../utils/api";
import { User, Phone, Mail, Award, CheckCircle2, ShieldCheck, MapPin, Building, FileText, CreditCard, Loader2, Briefcase, GraduationCap, X } from "lucide-react";

// Helper to sanitize image URLs for production
const cleanImageUrl = (url) => {
  if (!url) return "";
  
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;

  if (url.includes("localhost:") && url.includes("/api/")) {
    const parts = url.split("/api/");
    return `https://api.jssabhiyan.com/api/${parts[1]}`;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  if (url.startsWith("/api/")) return `https://api.jssabhiyan.com${url}`;
  
  if (url.startsWith("/")) return `https://api.jssabhiyan.com/api${url}`;
  
  if (url.startsWith("uploads/") || url.startsWith("files/")) return `https://api.jssabhiyan.com/api/${url}`;
  
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

const DoctorProfile = () => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewDocUrl, setPreviewDocUrl] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await doctorsAPI.getProfile();
      if (res.success && res.doctor) {
        setDoctor(res.doctor);
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
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

  if (!doctor) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-gray-500">Profile not found.</div>
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

          <div className="bg-white p-6 sm:p-8 border flex flex-col md:flex-row items-center md:items-end gap-6 relative border-green-600">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-green-50 p-1 border border-green-600 -mt-20 md:-mt-24 overflow-hidden group flex items-center justify-center">
              {doctor.image ? (
                <img src={cleanImageUrl(doctor.image)} alt={doctor.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl sm:text-7xl font-black text-green-600 group-hover:scale-110 transition-transform duration-500">
                  {doctor.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
                  {doctor.name}
                </h1>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {doctor.onboardingComplete ? (
                    <span className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-[9px] font-black uppercase tracking-widest border border-green-700">
                      <ShieldCheck size={12} className="mr-1" /> ONBOARDED
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest border border-red-700">
                      <ShieldCheck size={12} className="mr-1" /> ONBOARDING PENDING
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-600 font-bold text-sm">
                <span className="flex items-center gap-1.5 text-blue-600"><Phone size={16} /> {doctor.personalMobile || "N/A"}</span>
                <span className="flex items-center gap-1.5 text-orange-600"><Mail size={16} /> {doctor.email || "N/A"}</span>
                {doctor.experience?.length > 0 && (
                  <span className="flex items-center gap-1.5 text-purple-600"><Award size={16} /> {doctor.experience[0].orgName || "Experienced"}</span>
                )}
                {doctor.clinicAddress && (
                  <span className="flex items-center gap-1.5 text-green-700 w-full md:w-auto"><MapPin size={16} /> {doctor.clinicAddress}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Areas */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Professional Details */}
            <div className="bg-white p-6 sm:p-8 border border-green-600">
              <SectionHeader icon={Award} title="Professional Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <ProfileField icon={Award} label="Qualifications" value={Array.isArray(doctor.qualifications) ? doctor.qualifications.map(q => q.degreeName).join(", ") : (doctor.qualifications || "N/A")} color="text-blue-600" />
                <ProfileField icon={CheckCircle2} label="Specialization" value={doctor.specification?.join(", ") || "N/A"} color="text-green-600" />
                <ProfileField icon={FileText} label="Medical Reg No" value={doctor.medicalRegNo} color="text-orange-600" />
                <ProfileField icon={User} label="Father's Name" value={doctor.fatherName} color="text-purple-600" />
              </div>
            </div>

            {/* Detailed Experience */}
            {Array.isArray(doctor.experience) && doctor.experience.length > 0 && (
              <div className="bg-white p-6 sm:p-8 border border-green-600">
                <SectionHeader icon={Briefcase} title="Experience Details" />
                <div className="space-y-4">
                  {doctor.experience.map((exp, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-black text-gray-800 text-sm">{exp.orgName}</h4>
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded uppercase">
                          {exp.totalExperience} Years
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium mb-1">
                        {new Date(exp.startDate).toLocaleDateString()} - {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">{exp.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Qualifications */}
            {Array.isArray(doctor.qualifications) && doctor.qualifications.length > 0 && (
              <div className="bg-white p-6 sm:p-8 border border-green-600">
                <SectionHeader icon={GraduationCap} title="Qualification Details" />
                <div className="space-y-4">
                  {doctor.qualifications.map((qual, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 border border-gray-200 flex justify-between items-center">
                      <div>
                        <h4 className="font-black text-gray-800 text-sm">{qual.degreeName}</h4>
                        <p className="text-xs text-gray-600 font-medium">{qual.universityName}</p>
                        <p className="text-xs text-gray-500 mt-1">Passing Year: {qual.passingYear} | PR: {qual.pr || 'N/A'}</p>
                      </div>
                      {qual.docUrl && (
                        <button onClick={() => setPreviewDocUrl(cleanImageUrl(qual.docUrl))} className="inline-flex items-center justify-center px-3 py-1.5 bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-wider hover:bg-green-200 transition-colors border border-green-200">
                          View Cert
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="bg-white p-6 sm:p-8 border border-green-600">
              <SectionHeader icon={FileText} title="Uploaded Documents" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {['aadharFront', 'aadharBack', 'panCardDoc', 'medicalDegreeDoc', 'medicalRegDoc', 'bankPassbookDoc', 'signatureDoc'].map(docKey => (
                  <div key={docKey} className="flex flex-col items-center justify-center p-4 border border-gray-200 bg-gray-50 hover:border-green-300 transition-colors">
                    {doctor[docKey] ? (
                      <>
                        <CheckCircle2 className="text-green-600 mb-3" size={28} />
                        <span className="text-[11px] font-black uppercase tracking-wider text-gray-800 text-center">
                          {docKey.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <button onClick={() => setPreviewDocUrl(cleanImageUrl(doctor[docKey]))} className="mt-3 inline-flex items-center justify-center px-4 py-2 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wider hover:bg-green-200 transition-colors w-full border border-green-200">
                          View File
                        </button>
                      </>
                    ) : (
                      <>
                        <FileText className="text-gray-300 mb-3" size={28} />
                        <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 text-center">
                          {docKey.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="mt-3 px-3 py-2 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-wider w-full text-center border border-red-100">
                          Missing
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            
            {/* Bank Details */}
            <div className="bg-white p-6 border border-green-600 bg-gradient-to-br from-white to-gray-50">
              <SectionHeader icon={CreditCard} title="Bank Information" />
              <div className="space-y-3 text-left">
                <ProfileField icon={User} label="Account Holder" value={doctor.accountHolderName} color="text-green-600" />
                <ProfileField icon={Building} label="Bank Name" value={doctor.bankName} color="text-blue-600" />
                <ProfileField icon={CreditCard} label="Account Number" value={doctor.accountNumber} color="text-gray-800" />
                <ProfileField icon={FileText} label="IFSC Code" value={doctor.ifscCode} color="text-orange-600" />
                <div className="mt-4 p-4 bg-white border border-green-600">
                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Verification Status</p>
                  <p className={`text-xs font-black flex items-center mt-2 ${doctor.onboardingComplete ? 'text-green-600' : 'text-red-600'}`}>
                    <ShieldCheck size={14} className="mr-1" /> {doctor.onboardingComplete ? "ONBOARDED & READY" : "ONBOARDING PENDING"}
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
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

export default DoctorProfile;
