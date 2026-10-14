import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { pharmaciesAPI } from "../../utils/api";
import { User, Phone, Mail, MapPin, FileText, CheckCircle2, Building, CreditCard, ShieldCheck, Globe, Loader2, Briefcase } from "lucide-react";

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

const PharmacyProfile = () => {
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await pharmaciesAPI.getProfile();
        if (res.success && res.pharmacy) {
          setPharmacy(res.pharmacy);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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

  if (!pharmacy) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-gray-500">Failed to load profile.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 max-w-6xl mx-auto">
        
        {/* Header Profile Card */}
        <div className="relative mb-8 pt-20">
          <div
            className="absolute top-0 left-0 w-full h-40 bg-gradient-to-r from-green-600 to-green-700"
          >
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:20px_20px]"></div>
          </div>

          <div
            className="bg-white p-6 sm:p-8 border flex flex-col md:flex-row items-center md:items-end gap-6 relative border-green-600"
          >
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-green-50 p-1 border border-green-600 -mt-20 md:-mt-24 overflow-hidden group flex items-center justify-center">
              <span className="text-6xl sm:text-7xl font-black text-green-600 group-hover:scale-110 transition-transform duration-500">
                {pharmacy.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
                  {pharmacy.name}
                </h1>
                <span className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-[9px] font-black uppercase tracking-widest border border-green-700">
                  <ShieldCheck size={12} className="mr-1" /> {pharmacy.status === "Active" ? "Verified Partner" : pharmacy.status}
                </span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-600 font-bold text-sm">
                <span className="flex items-center gap-1.5"><Building size={16} className="text-green-600" /> {pharmacy.shopName || "Pharmacy Partner"}</span>
                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-red-500" /> {pharmacy.district}, {pharmacy.state}</span>
                <span className="flex items-center gap-1.5 text-blue-600"><Phone size={16} /> {pharmacy.userId?.phone}</span>
                {pharmacy.userId?.email && <span className="flex items-center gap-1.5 text-orange-600"><Mail size={16} /> {pharmacy.userId?.email}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Areas */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Pharmacy Details */}
            <div className="bg-white p-6 sm:p-8 border border-green-600">
              <SectionHeader icon={Building} title="Pharmacy Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <ProfileField icon={FileText} label="License Number" value={pharmacy.licenseNumber} color="text-blue-600" />
                <ProfileField icon={FileText} label="GST Number" value={pharmacy.gstNumber} color="text-orange-600" />
                <ProfileField icon={User} label="Pharmacist Name" value={pharmacy.pharmacistName} color="text-green-600" />
                <ProfileField icon={CheckCircle2} label="Pharmacist Reg. No" value={pharmacy.pharmacistRegNumber} color="text-purple-600" />
                <div className="sm:col-span-2">
                  <ProfileField icon={MapPin} label="Shop Address" value={pharmacy.shopAddress} color="text-red-600" />
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white p-6 sm:p-8 border border-green-600">
              <SectionHeader icon={FileText} title="Uploaded Documents" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {['aadharFront', 'aadharBack', 'panCard', 'bankDoc', 'shopPhoto', 'licenseDoc'].map(docKey => (
                  <div key={docKey} className="flex flex-col items-center justify-center p-4 border border-gray-200 bg-gray-50 hover:border-green-300 transition-colors">
                    {pharmacy[docKey] ? (
                      <>
                        <CheckCircle2 className="text-green-600 mb-3" size={28} />
                        <span className="text-[11px] font-black uppercase tracking-wider text-gray-800 text-center">
                          {docKey.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <a href={pharmacy[docKey]} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center justify-center px-4 py-2 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wider hover:bg-green-200 transition-colors w-full border border-green-200">
                          View File
                        </a>
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
                <ProfileField icon={User} label="Account Holder" value={pharmacy.accountHolderName} color="text-green-600" />
                <ProfileField icon={Building} label="Bank Name" value={pharmacy.bankName} color="text-blue-600" />
                <ProfileField icon={CreditCard} label="Account Number" value={pharmacy.accountNumber} color="text-gray-800" />
                <ProfileField icon={FileText} label="IFSC Code" value={pharmacy.ifscCode} color="text-orange-600" />
                <div className="mt-4 p-4 bg-white border border-green-600">
                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Verification Status</p>
                  <p className="text-xs font-black text-green-600 flex items-center mt-2">
                    <ShieldCheck size={14} className="mr-1" /> {pharmacy.status === "Active" ? "READY FOR OPERATIONS" : pharmacy.status.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PharmacyProfile;
