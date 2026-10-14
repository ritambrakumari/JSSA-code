import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { administrativeStaffAPI } from "../../utils/api";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  ShieldCheck,
  CreditCard,
  Building2,
  ChevronLeft,
  Loader2,
  Users,
  Layers,
  TrendingUp,
  Wallet,
  ArrowDownCircle,
  Award,
  Star,
  FileText,
  ExternalLink,
  BookOpen,
  BadgeCheck,
  Activity,
  Heart,
  Languages,
  AlertCircle,
  IndianRupee,
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  DollarSign
} from "lucide-react";
import { toast } from "react-hot-toast";

const GREEN = "#3AB000";

const AdminStaffDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await administrativeStaffAPI.getDetails(id);
      if (res.success) {
        setStaff(res.data);
      } else {
        toast.error(res.error || "Failed to fetch staff details");
        navigate("/admin/administrative-staff");
      }
    } catch (error) {
      console.error("Fetch Details Error:", error);
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <Loader2 size={48} className="animate-spin text-[#3AB000]" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Decrypting Staff Profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!staff) return null;

  const DetailItem = ({ label, value, icon: Icon, fullWidth = false }) => (
    <div className={`p-4 bg-gray-50/50 border border-gray-100 ${fullWidth ? 'col-span-full' : ''}`}>
      <div className="flex items-center gap-2 mb-1.5 text-gray-400">
        {Icon && <Icon size={12} />}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-[11px] font-bold text-gray-900 uppercase break-words">{value || 'Not Specified'}</p>
    </div>
  );

  const SalaryItem = ({ label, amount, isTotal = false }) => (
    <div className={`flex items-center justify-between p-3 ${isTotal ? 'bg-green-50 border-t-2 border-[#3AB000]' : 'border-b border-gray-100'}`}>
      <span className={`text-[10px] font-black uppercase tracking-widest ${isTotal ? 'text-[#3AB000]' : 'text-gray-400'}`}>{label}</span>
      <span className={`text-sm font-black ${isTotal ? 'text-gray-900' : 'text-gray-600'}`}>₹{Number(amount || 0).toLocaleString('en-IN')}</span>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        {/* Top Navbar */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/admin/administrative-staff")}
            className="flex items-center gap-2 text-gray-400 hover:text-[#3AB000] transition-all font-black text-[10px] uppercase tracking-widest group"
          >
            <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Back to Staff Management
          </button>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 border-r border-gray-200 pr-6">
               <div className="text-right">
                  <p className="text-[10px] font-black text-gray-900 uppercase leading-none">{staff.name}</p>
                  <p className="text-[9px] font-bold text-[#3AB000] uppercase tracking-tighter mt-1">{staff.jobRoleId?.jobTitle || 'Staff Member'}</p>
               </div>
               <div className="w-10 h-10 bg-[#3AB000] text-white flex items-center justify-center font-black text-sm uppercase">
                  {staff.name ? staff.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '??'}
               </div>
            </div>
            <div className="flex items-center gap-2">
               <span className={`text-[9px] font-black px-2.5 py-1 uppercase tracking-widest border ${
                  staff.status === 'Active' 
                    ? 'bg-[#3AB000] text-white border-[#3AB000]' 
                    : 'bg-orange-500 text-white border-orange-500'
               }`}>
                  {staff.status}
               </span>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-[1600px] mx-auto">
          {/* Header Profile */}
          <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] text-white mb-8 overflow-hidden relative shadow-lg shadow-[#3AB000]/10">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -mr-64 -mt-64 blur-3xl"></div>
            <div className="p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-8">
                <div className="w-32 h-32 bg-white/10 border-2 border-white/30 flex items-center justify-center text-white relative group overflow-hidden shadow-2xl">
                  {staff.photo ? (
                    <img 
                      src={staff.photo} 
                      alt={staff.name} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <span className="text-4xl font-black uppercase tracking-tighter">
                      {staff.name ? staff.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '??'}
                    </span>
                  )}
                  <div className="absolute bottom-0 right-0 bg-blue-500 p-1.5 z-20 border-2 border-white shadow-lg rounded-full transform translate-x-1/4 translate-y-1/4">
                    <ShieldCheck size={14} className="text-white" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h1 className="text-5xl font-black tracking-tight uppercase leading-none mb-2">
                      {staff.name}
                    </h1>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">
                        {staff.jobRoleId?.jobTitle || 'Administrative Staff'}
                      </span>
                      <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                      <span className="text-[11px] font-black text-white/80 uppercase tracking-[0.3em]">
                        ID: {staff.userId?._id?.toString().slice(-6).toUpperCase() || 'NEW'}
                      </span>
                    </div>
                  </div>
                  
                    <div className="flex flex-wrap gap-6 pt-2">
                      <div className="flex items-center gap-2.5 text-white">
                        <Phone size={14} className="text-white/70" />
                        <span className="text-xs font-bold tracking-tight">{staff.userId?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-white">
                        <Mail size={14} className="text-white/70" />
                        <span className="text-xs font-bold tracking-tight lowercase">{staff.userId?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-white">
                        <MapPin size={14} className="text-white/70" />
                        <span className="text-xs font-bold tracking-tight uppercase">{staff.district || 'N/A'}, {staff.state || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-white bg-black/20 px-3 py-1 rounded-full border border-white/10 shadow-inner">
                        <Calendar size={14} className="text-white/90" />
                        <span className="text-xs font-black tracking-widest uppercase text-white/90">Joined: {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('en-GB') : 'N/A'}</span>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Left Column - Details */}
            <div className="xl:col-span-8 space-y-8">
              
              {/* Section A: Basic Details */}
              <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-5 flex items-center justify-between">
                   <h3 className="text-[14px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                     <FileText size={20} />
                     Section A: Staff Personal Profile
                   </h3>
                   <span className="text-[10px] font-black text-white/70 uppercase tracking-widest bg-white/10 px-2 py-1 rounded">
                     Staff Member since {new Date(staff.createdAt).getFullYear()}
                   </span>
                </div>
                
                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
                  <DetailItem label="Full Name" value={staff.name} icon={User} />
                  <DetailItem label="Father's Name" value={staff.fatherName} icon={Users} />
                  <DetailItem label="Date of Birth" value={staff.dob ? new Date(staff.dob).toLocaleDateString('en-GB') : 'N/A'} icon={Calendar} />
                  <DetailItem label="Gender" value={staff.gender || 'Not Specified'} />
                  
                  <DetailItem label="Marital Status" value={staff.maritalStatus} icon={Heart} />
                  <DetailItem label="Nationality" value={staff.nationality} />
                  <DetailItem label="Aadhar Number" value={staff.aadharNumber} icon={ShieldCheck} />
                  <DetailItem label="PAN Number" value={staff.panNumber} icon={CreditCard} />
                  <DetailItem label="Joined Date" value={staff.createdAt ? new Date(staff.createdAt).toLocaleString('en-GB') : 'N/A'} icon={Calendar} />
                </div>

                <div className="bg-gray-50 border-y border-gray-200 px-8 py-4">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <MapPin size={14} className="text-[#3AB000]" /> Permanent Residential Address
                   </p>
                </div>
                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
                  <DetailItem label="Full Address" value={`${staff.villageTola || ''}, ${staff.gramPanchayat || ''}, ${staff.district || ''}, ${staff.state || ''}`} fullWidth />
                  <DetailItem label="District" value={staff.district} />
                  <DetailItem label="State" value={staff.state} />
                  <DetailItem label="Pincode" value={staff.pincode} />
                  <DetailItem label="Police Station" value={staff.policeStation} />
                </div>
              </div>

              {/* Section B: Onboarding & Documents */}
              <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 flex items-center justify-between">
                   <h3 className="text-[14px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                     <ShieldCheck size={20} />
                     Section B: Bank & KYC Documentation
                   </h3>
                   <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-white/20 bg-white/10 text-white rounded`}>
                     Status: {staff.onboardingComplete ? 'VERIFIED' : 'PENDING VERIFICATION'}
                   </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-gray-100 border-b border-gray-100">
                   <div className="bg-white p-8">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                         <CreditCard size={14} className="text-blue-600" /> Salary Account Details
                      </p>
                      <div className="space-y-4">
                         <DetailItem label="Account Holder" value={staff.accountHolderName} />
                         <div className="grid grid-cols-2 gap-4">
                            <DetailItem label="Bank Name" value={staff.bankName} />
                            <DetailItem label="IFSC Code" value={staff.ifscCode} />
                         </div>
                         <div className="p-4 bg-blue-50 border border-blue-100 rounded">
                            <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Account Number</p>
                            <p className="text-lg font-black tracking-tighter text-gray-900">{staff.accountNumber || '•••• •••• ••••'}</p>
                         </div>
                      </div>
                   </div>
                   <div className="bg-white p-8 border-l border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                         <Users size={14} className="text-blue-600" /> Emergency / Nominee Details
                      </p>
                      <div className="space-y-4">
                         <DetailItem label="Nominee Name" value={staff.nomineeName} />
                         <div className="grid grid-cols-2 gap-4">
                            <DetailItem label="Relation" value={staff.nomineeRelation} />
                            <DetailItem label="Contact" value={staff.nomineeMobile} />
                         </div>
                         <DetailItem label="Nominee Aadhar" value={staff.nomineeAadhar} />
                      </div>
                   </div>
                </div>

                <div className="p-8 space-y-4">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verification Documents</p>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Aadhar Front', url: staff.aadharFront },
                        { label: 'Aadhar Back', url: staff.aadharBack },
                        { label: 'PAN Card', url: staff.panCard },
                        { label: 'Bank Proof', url: staff.bankDoc }
                      ].map((doc, idx) => (
                        <a key={idx} href={doc.url} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group gap-2">
                          <FileText size={20} className="text-gray-300 group-hover:text-blue-600" />
                          <span className="text-[9px] font-black text-gray-500 group-hover:text-blue-600 uppercase text-center">{doc.label}</span>
                        </a>
                      ))}
                   </div>
                </div>
              </div>
            </div>

            {/* Right Column - Financials & Role */}
            <div className="xl:col-span-4 space-y-8">
              
              {/* Role & Access Section */}
              <div className="bg-white border border-gray-200 p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-blue-600"></div>
                  <div>
                    <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.2em]">Administrative Role</h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">System Access Level</p>
                  </div>
                </div>

                <div className="p-5 bg-blue-50 border border-blue-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-blue-600 uppercase">Designation</p>
                    <Lock size={12} className="text-blue-400" />
                  </div>
                  <p className="text-xl font-black text-gray-900 uppercase tracking-tighter">{staff.jobRoleId?.jobTitle || 'Staff'}</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#3AB000] rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Authorized System Personnel</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase">
                    <span className="text-gray-400">Onboarding Progress</span>
                    <span className={staff.onboardingComplete ? 'text-[#3AB000]' : 'text-orange-500'}>
                      {staff.onboardingComplete ? '100%' : '60%'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100">
                    <div className={`h-full transition-all duration-1000 ${staff.onboardingComplete ? 'bg-[#3AB000] w-full' : 'bg-orange-500 w-[60%]'}`}></div>
                  </div>
                </div>
              </div>

              {/* Salary Structure Section */}
              <div className="bg-white border border-gray-200 overflow-hidden">
                <div className="bg-gray-900 px-8 py-5">
                   <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                     <DollarSign size={14} className="text-yellow-500" /> Remuneration Profile
                   </h3>
                </div>
                <div className="p-0 divide-y divide-gray-100">
                  <SalaryItem label="Basic Salary" amount={staff.salaryStructure?.basic} />
                  <SalaryItem label="HRA" amount={staff.salaryStructure?.hra} />
                  <SalaryItem label="Special Allowance" amount={staff.salaryStructure?.specialAllowance} />
                  <SalaryItem label="Gross Salary" amount={staff.salaryStructure?.grossSalary} />
                  <div className="bg-gray-50 px-8 py-3">
                    <p className="text-[9px] font-black text-gray-400 uppercase">Benefits & Deductions</p>
                  </div>
                  <SalaryItem label="PF Contribution" amount={staff.salaryStructure?.benefits?.pf} />
                  <SalaryItem label="Gratuity" amount={staff.salaryStructure?.benefits?.gratuity} />
                  <SalaryItem label="Insurance" amount={staff.salaryStructure?.benefits?.insurance} />
                  <SalaryItem label="Cost to Company (CTC)" amount={staff.salaryStructure?.ctc} isTotal />
                </div>
                <div className="p-6 bg-yellow-50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white flex items-center justify-center text-yellow-600 shrink-0 shadow-sm">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Card Commission</p>
                    <p className="text-sm font-black text-gray-900 uppercase mt-1">
                      {staff.cardCommission?.enabled ? `₹${staff.cardCommission.amountPerCard} / Card` : 'Disabled'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Commission Earnings */}
              <div className="bg-[#3AB000] p-8 text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                 <div className="relative z-10">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Commission Wallet</p>
                    <p className="text-4xl font-black tracking-tighter mb-6">₹{Number(staff.salaryWallet || 0).toLocaleString('en-IN')}</p>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase bg-black/10 p-2 border border-white/10">
                       <CheckCircle2 size={12} /> Total Cards Cleared: {staff.totalCardEarnings / (staff.cardCommission?.amountPerCard || 1)}
                    </div>
                 </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminStaffDetail;
