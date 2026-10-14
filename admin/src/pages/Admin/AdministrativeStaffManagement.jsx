import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { apiRequest, jobRoleAPI } from "../../utils/api";
import { useAuth } from "../../auth/AuthProvider";
import { 
  UserPlus, 
  Search, 
  Shield, 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  User, 
  Trash2, 
  Loader2, 
  AlertCircle,
  RefreshCcw,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Wallet,
  ArrowRight,
  ClipboardList,
  UserCheck,
  CreditCard,
  ChevronDown,
  Pencil,
  Eye,
  EyeOff,
  UserX,
  RotateCcw,
  LogOut,
  ShieldAlert
} from "lucide-react";
import { toast } from "react-hot-toast";

const GREEN = "#3AB000";

export function StaffAccountStatusBlocker() {
  const { role, isAuthenticated, logout, employeeProfile, profileLoading } = useAuth();

  if (!isAuthenticated || role !== "staff") return null;
  if (profileLoading || !employeeProfile) return null;

  const accountStatus = employeeProfile?.accountStatus || "Active";
  if (accountStatus !== "Inactive" && accountStatus !== "Terminated") return null;

  const isTerminated = accountStatus === "Terminated";

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 select-none">
      <div className="bg-white border-t-8 border-t-[#3AB000] w-full max-w-md p-8 shadow-2xl text-center space-y-5">
        <div className="w-14 h-14 mx-auto bg-red-50 text-red-600 flex items-center justify-center">
          {isTerminated ? <UserX size={28} /> : <ShieldAlert size={28} />}
        </div>
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
          {isTerminated ? "Account Terminated" : "Account Inactive"}
        </h2>
        <p className="text-xs font-bold text-gray-500 leading-relaxed uppercase tracking-wide">
          {isTerminated
            ? "Your account has been terminated. You cannot access the portal. Contact administration if you believe this is an error."
            : "Your account is currently inactive. Please contact your administrator to restore access."}
        </p>
        <button
          type="button"
          onClick={logout}
          className="w-full h-12 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}

const AdministrativeStaffManagement = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDanger: false
  });

  const [formData, setFormData] = useState({
    name: "",
    fatherName: "",
    dob: "",
    jobRoleId: "",
    email: "",
    mobile: "",
    password: "",
    salaryStructure: {
      basic: "", hra: "", specialAllowance: "", medicalAllowance: "", conveyanceAllowance: "",
      statutoryBonus: "", mobileBill: "", performanceBonus: "", grossSalary: 0,
      benefits: { pf: "", gratuity: "", insurance: "" }, ctc: 0
    },
    cardCommission: {
      enabled: false,
      amountPerCard: ""
    }
  });

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("/administrative-staff", { method: "GET" });
      if (res.success) setStaffList(res.data || []);
      else toast.error(res.error || "Failed to fetch staff");
    } catch (err) {
      console.error("Failed to fetch staff:", err);
      toast.error("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobRoles = async () => {
    try {
      const res = await jobRoleAPI.getAll();
      if (res.success) setJobRoles(res.data || []);
    } catch (err) {
      console.error("Failed to fetch job roles:", err);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchJobRoles();
  }, []);

  // Calculate Salaries
  useEffect(() => {
    const s = formData.salaryStructure;
    const gross = 
      Number(s.basic || 0) + 
      Number(s.hra || 0) + 
      Number(s.specialAllowance || 0) + 
      Number(s.medicalAllowance || 0) + 
      Number(s.conveyanceAllowance || 0) + 
      Number(s.statutoryBonus || 0) + 
      Number(s.mobileBill || 0) + 
      Number(s.performanceBonus || 0);
    
    const totalBenefits = 
      Number(s.benefits.pf || 0) + 
      Number(s.benefits.gratuity || 0) + 
      Number(s.benefits.insurance || 0);
    
    const ctc = gross + totalBenefits;

    if (gross !== s.grossSalary || ctc !== s.ctc) {
      setFormData(prev => ({
        ...prev,
        salaryStructure: {
          ...prev.salaryStructure,
          grossSalary: gross,
          ctc: ctc
        }
      }));
    }
  }, [formData.salaryStructure]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editMode ? `/administrative-staff/${selectedId}` : "/administrative-staff";
      const method = editMode ? "PATCH" : "POST";
      
      const res = await apiRequest(url, {
        method: method,
        body: JSON.stringify(formData)
      });

      if (res.success) {
        toast.success(editMode ? "Staff updated successfully!" : "Staff created successfully!");
        setIsModalOpen(false);
        resetForm();
        fetchStaff();
      } else {
        toast.error(res.error || `Failed to ${editMode ? 'update' : 'create'} staff`);
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (staff) => {
    setEditMode(true);
    setSelectedId(staff._id);
    setFormData({
      name: staff.name,
      fatherName: staff.fatherName || "",
      dob: staff.dob ? staff.dob.split('T')[0] : "",
      jobRoleId: staff.jobRoleId?._id || "",
      email: staff.userId?.email || "",
      mobile: staff.userId?.phone || "",
      password: "", // Keep password empty unless changing
      salaryStructure: {
        ...staff.salaryStructure,
        benefits: { ...staff.salaryStructure?.benefits }
      },
      cardCommission: {
        enabled: staff.cardCommission?.enabled || false,
        amountPerCard: staff.cardCommission?.amountPerCard || 0
      }
    });
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditMode(false);
    setSelectedId(null);
    setFormData({
      name: "",
      fatherName: "",
      dob: "",
      jobRoleId: "",
      email: "",
      mobile: "",
      password: "",
      salaryStructure: {
        basic: "", hra: "", specialAllowance: "", medicalAllowance: "", conveyanceAllowance: "",
        statutoryBonus: "", mobileBill: "", performanceBonus: "", grossSalary: 0,
        benefits: { pf: "", gratuity: "", insurance: "" }, ctc: 0
      },
      cardCommission: {
        enabled: false,
        amountPerCard: ""
      }
    });
    setShowPassword(false);
    setCurrentStep(1);
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Staff Member?",
      message: "Are you sure you want to delete this staff member? This action cannot be undone.",
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await apiRequest(`/administrative-staff/${id}`, { method: "DELETE" });
          if (res.success) {
            toast.success("Staff deleted successfully");
            fetchStaff();
          } else {
            toast.error(res.error || "Failed to delete staff");
          }
        } catch (err) {
          toast.error("Failed to delete staff");
        }
      }
    });
  };

  const handleSalaryChange = (field, value) => {
    if (field.startsWith('benefits.')) {
      const benefitField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        salaryStructure: {
          ...prev.salaryStructure,
          benefits: {
            ...prev.salaryStructure.benefits,
            [benefitField]: value === "" ? "" : Number(value)
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        salaryStructure: {
          ...prev.salaryStructure,
          [field]: value === "" ? "" : Number(value)
        }
      }));
    }
  };

  const updateAccountStatus = async (staff, action) => {
    try {
      setActionLoadingId(staff._id);
      const res = await apiRequest(`/administrative-staff/${staff._id}/account-status`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      if (res.success) {
        toast.success(res.message || "Status updated");
        await fetchStaff();
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update account status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleActive = (staff, e) => {
    e.stopPropagation();
    const current = staff.accountStatus || "Active";
    if (current === "Terminated") return;

    const goingInactive = current === "Active";
    
    setConfirmDialog({
      isOpen: true,
      title: goingInactive ? "Mark Inactive?" : "Activate Account?",
      message: goingInactive
        ? `Mark "${staff.name}" as INACTIVE? They will see an inactive modal on login.`
        : `Activate "${staff.name}"? They will regain portal access.`,
      isDanger: goingInactive,
      onConfirm: () => updateAccountStatus(staff, goingInactive ? "deactivate" : "activate")
    });
  };

  const handleTerminate = (staff, e) => {
    e.stopPropagation();
    if ((staff.accountStatus || "Active") === "Terminated") return;

    setConfirmDialog({
      isOpen: true,
      title: "Terminate Account?",
      message: `Terminate "${staff.name}"?\n\nThis cannot be undone from the employee side. Use Reactivate to restore access.`,
      isDanger: true,
      onConfirm: () => updateAccountStatus(staff, "terminate")
    });
  };

  const handleReactivate = (staff, e) => {
    e.stopPropagation();
    
    setConfirmDialog({
      isOpen: true,
      title: "Reactivate Account?",
      message: `Reactivate "${staff.name}" and restore Active status?`,
      isDanger: false,
      onConfirm: () => updateAccountStatus(staff, "reactivate")
    });
  };

  const getAccountBadge = (staff) => {
    const account = staff.accountStatus || "Active";
    if (account === "Terminated") {
      return "bg-red-100 text-red-700 border-red-200";
    }
    if (account === "Inactive") {
      return "bg-gray-100 text-gray-600 border-gray-200";
    }
    return "bg-[#3AB000]/5 text-[#3AB000] border-[#3AB000]/20";
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          {/* Header & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Administrative Staff</h1>
              <p className="text-xs font-bold text-[#3AB000] uppercase tracking-[0.1em] mt-1">Personnel & Payroll Management</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center border border-gray-300 rounded-none overflow-hidden h-12 w-full sm:w-80 bg-white focus-within:border-[#3AB000] transition-all">
                <input
                  type="text"
                  placeholder="Search staff by name or email..."
                  className="flex-1 px-4 text-sm font-medium outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="bg-[#3AB000] p-3 text-white">
                  <Search size={20} />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => { resetForm(); setIsModalOpen(true); }}
                  className="h-12 bg-black hover:bg-[#3AB000] text-white px-8 rounded-none shadow-md font-bold flex items-center justify-center gap-2 transition-all uppercase text-xs tracking-wider whitespace-nowrap active:scale-95"
                >
                  <UserPlus size={18} />
                  Add New Staff
                </button>
                <button
                  onClick={fetchStaff}
                  className="h-12 w-12 flex items-center justify-center bg-gray-50 border border-gray-300 text-gray-400 hover:text-[#3AB000] hover:border-[#3AB000] rounded-none transition-all duration-500"
                >
                  <RefreshCcw size={20} className={isLoading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-none border border-gray-200 overflow-hidden shadow-sm relative min-h-[450px]">
            {isLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 size={48} className="animate-spin text-[#3AB000]" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Synchronizing Database...</p>
              </div>
            )}

            {filteredStaff.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#3AB000] text-white font-bold uppercase text-xs tracking-widest">
                      <th className="p-5 w-20 text-center">S.N</th>
                      <th className="p-5">Staff Information</th>
                      <th className="p-5 text-center">Designation</th>
                      <th className="p-5 text-center">Account Status</th>
                      <th className="p-5 text-right">Monthly CTC (Rs.)</th>
                      <th className="p-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStaff.map((staff, index) => (
                      <tr key={staff._id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="p-5 text-center font-bold text-gray-400">{index + 1}</td>
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-none bg-gray-100 flex items-center justify-center text-gray-400 font-black text-lg uppercase group-hover:bg-[#3AB000] group-hover:text-white transition-all duration-300">
                              {staff.name[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-base font-bold text-gray-800 leading-none">{staff.name}</p>
                                <span className="text-[10px] font-black text-[#3AB000] bg-green-50 px-2 py-0.5 rounded-none border border-green-100 uppercase tracking-tighter">
                                  ID: {staff.userId?._id?.toString().slice(-6).toUpperCase() || 'NEW'}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-400 mt-1.5 flex items-center gap-2">
                                <Mail size={12} /> {staff.userId?.email || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <span className="text-xs font-bold px-4 py-1.5 bg-gray-100 text-gray-600 rounded-none uppercase tracking-tight group-hover:bg-green-50 group-hover:text-[#3AB000] transition-colors">
                            {staff.jobRoleId?.jobTitle || "Not Assigned"}
                          </span>
                        </td>

                        <td className="p-5 text-center" onClick={(e) => e.stopPropagation()}>
                          <span
                            className={`text-[9px] font-black px-2.5 py-1 rounded-none uppercase tracking-widest border ${getAccountBadge(staff)}`}
                          >
                            {staff.accountStatus || "Active"}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          <div className="text-lg font-black text-gray-800 tracking-tight">
                            ₹{staff.salaryStructure?.ctc?.toLocaleString() || 0}
                          </div>
                          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">Calculated CTC</p>
                        </td>
                         <td className="p-5 text-right flex items-center justify-end gap-1">
                           {/* Account Toggle */}
                           <div
                              className="flex items-center gap-2 shrink-0 pr-2 mr-2 border-r border-gray-200"
                              title={(staff.accountStatus || "Active") === "Terminated" ? "Terminated — use Reactivate" : "Toggle account Active / Inactive"}
                            >
                              <div className="flex flex-col items-end leading-none">
                                <span className="text-[7px] font-black text-gray-400 uppercase tracking-wider">Account</span>
                                <span className={`text-[8px] font-black uppercase ${
                                  (staff.accountStatus || "Active") === "Terminated" ? "text-red-600"
                                  : (staff.accountStatus || "Active") === "Active" ? "text-[#3AB000]" : "text-orange-600"
                                }`}>
                                  {(staff.accountStatus || "Active") === "Terminated" ? "Locked" : (staff.accountStatus || "Active") === "Active" ? "Active" : "Inactive"}
                                </span>
                              </div>
                              <button
                                type="button"
                                disabled={actionLoadingId === staff._id || (staff.accountStatus || "Active") === "Terminated"}
                                onClick={(e) => handleToggleActive(staff, e)}
                                className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${
                                  (staff.accountStatus || "Active") === "Active" ? "bg-[#3AB000]" : "bg-gray-300"
                                } ${(staff.accountStatus || "Active") === "Terminated" ? "opacity-40 cursor-not-allowed" : ""}`}
                              >
                                <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                                  (staff.accountStatus || "Active") === "Active" ? "translate-x-4" : "translate-x-0"
                                }`} />
                              </button>
                           </div>

                           <button 
                             onClick={() => navigate(`/admin/staff-detail/${staff._id}`)}
                             className="p-2 text-gray-400 hover:text-[#3AB000] hover:bg-green-50 rounded transition-all"
                             title="View Details"
                           >
                             <Eye size={16} />
                           </button>
                           <button 
                             onClick={() => handleEdit(staff)}
                             className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-all"
                             title="Edit Staff"
                           >
                             <Pencil size={16} />
                           </button>

                           <button 
                             onClick={() => handleDelete(staff._id)}
                             className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                             title="Delete Staff"
                           >
                             <Trash2 size={16} />
                           </button>

                           {/* Terminate / Reactivate Action */}
                           <div className="pl-2 ml-1 border-l border-gray-200">
                             {(staff.accountStatus || "Active") === "Terminated" ? (
                               <button
                                 onClick={(e) => handleReactivate(staff, e)}
                                 disabled={actionLoadingId === staff._id}
                                 className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-[#3AB000] hover:bg-green-700 rounded transition-all shadow-sm"
                                 title="Reactivate"
                               >
                                 {actionLoadingId === staff._id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                                 Reactivate
                               </button>
                             ) : (
                               <button
                                 onClick={(e) => handleTerminate(staff, e)}
                                 disabled={actionLoadingId === staff._id}
                                 className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 rounded transition-all shadow-sm"
                                 title="Terminate"
                               >
                                 {actionLoadingId === staff._id ? <Loader2 size={12} className="animate-spin" /> : <UserX size={12} />}
                                 Terminate
                               </button>
                             )}
                           </div>
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !isLoading && (
              <div className="py-32 flex flex-col items-center justify-center gap-6 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-none flex items-center justify-center text-gray-200">
                  <AlertCircle size={64} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-800 uppercase tracking-tight">No Staff Found</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Step Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            style={{ width: '70rem' }}
            className="bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 rounded-none border-t-8 border-[#3AB000] flex flex-col max-h-[95vh]"
          >
            
            {/* Modal Header */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-center shrink-0 bg-gray-50/30">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white flex items-center justify-center text-[#3AB000] rounded-none shadow-sm border border-gray-100">
                  {currentStep === 1 ? <ClipboardList size={28} /> : <Wallet size={28} />}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">
                    {editMode ? "Modify Staff Record" : (currentStep === 1 ? "Personnel Registry" : "Salary Configuration")}
                  </h2>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mt-2">
                    {editMode ? `Editing: ${formData.name}` : (currentStep === 1 ? "Step 1: Personnel Information" : "Step 2: Compensation Setup")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-red-50 hover:text-red-500 text-gray-400 transition-all rounded-none"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              {/* Modern Card-Style Stepper - Zero Radius */}
              <div className="mb-12 flex items-center justify-center gap-0 bg-gray-50 p-0 rounded-none border border-gray-100 max-w-2xl mx-auto">
                <div 
                  className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-none transition-all duration-300 ${currentStep === 1 ? 'bg-white shadow-md border-r border-gray-100 text-[#3AB000]' : 'text-gray-400 grayscale cursor-pointer hover:bg-gray-100'}`}
                  onClick={() => currentStep > 1 && setCurrentStep(1)}
                >
                  <div className={`w-8 h-8 rounded-none flex items-center justify-center ${currentStep === 1 ? 'bg-[#3AB000] text-white' : 'bg-gray-200 text-gray-400'}`}>
                    <UserCheck size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Step 01</p>
                    <p className="text-sm font-black uppercase tracking-tight mt-1">Basic Info</p>
                  </div>
                </div>

                <div 
                  className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-none transition-all duration-300 ${currentStep === 2 ? 'bg-white shadow-md border-l border-gray-100 text-[#3AB000]' : 'text-gray-400 grayscale cursor-pointer hover:bg-gray-100'}`}
                  onClick={() => {
                    if (formData.name && formData.email && formData.mobile && formData.jobRoleId) {
                      setCurrentStep(2);
                    }
                  }}
                >
                  <div className={`w-8 h-8 rounded-none flex items-center justify-center ${currentStep === 2 ? 'bg-[#3AB000] text-white' : 'bg-gray-200 text-gray-400'}`}>
                    <CreditCard size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Step 02</p>
                    <p className="text-sm font-black uppercase tracking-tight mt-1">Salary Plan</p>
                  </div>
                </div>
              </div>

              {currentStep === 1 ? (
                /* Step 1: Basic Details */
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">Full Name*</label>
                      <div className="relative group">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#3AB000] transition-colors" />
                        <input 
                          type="text" required placeholder="Ex: Rahul Sharma"
                          className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-300 focus:border-[#3AB000] focus:bg-white text-base font-bold text-gray-800 outline-none rounded-none transition-all"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">Father's Name</label>
                      <input 
                        type="text" placeholder="Ex: Sanjay Sharma"
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-300 focus:border-[#3AB000] focus:bg-white text-base font-bold text-gray-800 outline-none rounded-none transition-all"
                        value={formData.fatherName}
                        onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">Date of Birth*</label>
                      <div className="relative group">
                        <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#3AB000] transition-colors" />
                        <input 
                          type="date" required
                          className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-300 focus:border-[#3AB000] focus:bg-white text-base font-bold text-gray-800 outline-none rounded-none transition-all"
                          value={formData.dob}
                          onChange={(e) => setFormData({...formData, dob: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">Assign Job Role*</label>
                      <div className="relative group">
                        <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#3AB000] transition-colors" />
                        <select 
                          required
                          className="w-full pl-12 pr-10 py-4 bg-gray-50 border border-gray-300 focus:border-[#3AB000] focus:bg-white text-base font-bold text-gray-800 outline-none rounded-none transition-all cursor-pointer appearance-none"
                          value={formData.jobRoleId}
                          onChange={(e) => setFormData({...formData, jobRoleId: e.target.value})}
                        >
                          <option value="">Select a role...</option>
                          {jobRoles.map(role => (
                            <option key={role._id} value={role._id}>{role.jobTitle}</option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-[#3AB000] transition-colors" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">Email Address*</label>
                      <div className="relative group">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#3AB000] transition-colors" />
                        <input 
                          type="email" required placeholder="name@jssa.com"
                          className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-300 focus:border-[#3AB000] focus:bg-white text-base font-bold text-gray-800 outline-none rounded-none transition-all"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">Mobile Number*</label>
                      <div className="relative group">
                        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#3AB000] transition-colors" />
                        <input 
                          type="tel" required maxLength={10} placeholder="10-digit number"
                          className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-300 focus:border-[#3AB000] focus:bg-white text-base font-bold text-gray-800 outline-none rounded-none transition-all"
                          value={formData.mobile}
                          onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">Login Password</label>
                    <div className="relative group">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Default password is '123456' if left empty"
                        className="w-full px-5 py-4 pr-12 bg-gray-50 border border-gray-300 focus:border-[#3AB000] focus:bg-white text-base font-bold text-gray-800 outline-none rounded-none transition-all"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#3AB000] transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Step 2: Salary Structure */
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    {/* Monthly Particulars Table */}
                    <div className="xl:col-span-7 space-y-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-[#3AB000] uppercase tracking-[0.1em] flex items-center gap-3">
                          <span className="w-8 h-8 bg-[#3AB000] text-white flex items-center justify-center rounded-none text-xs font-black">M</span>
                          Monthly vs Yearly Breakup
                        </h3>
                      </div>
                      <div className="border border-gray-200 rounded-none overflow-hidden shadow-sm bg-white">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50/50">
                            <tr className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                              <th className="p-5 font-black">Salary Component</th>
                              <th className="p-5 w-48 font-black">Monthly (Rs.)</th>
                              <th className="p-5 w-48 text-right text-gray-900 font-black">Yearly (Rs.)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {[
                              { label: 'Basic Salary', field: 'basic' },
                              { label: 'HRA', field: 'hra' },
                              { label: 'Special Allowance', field: 'specialAllowance' },
                              { label: 'Medical Allowance', field: 'medicalAllowance' },
                              { label: 'Conveyance Allowance', field: 'conveyanceAllowance' },
                              { label: 'Statutory Bonus', field: 'statutoryBonus' },
                              { label: 'Mobile Bill Reimbursement', field: 'mobileBill' },
                              { label: 'Performance Bonus', field: 'performanceBonus' },
                            ].map((item) => (
                              <tr key={item.field} className="hover:bg-gray-50/30 transition-all group">
                                <td className="p-5 font-bold text-gray-600 group-hover:text-gray-900 transition-colors uppercase text-[11px] tracking-tight">{item.label}</td>
                                <td className="p-3">
                                  <input 
                                    type="number"
                                    className="w-full bg-gray-50 border border-gray-300 focus:border-[#3AB000] focus:bg-white px-4 py-2.5 rounded-none font-black text-gray-800 outline-none transition-all text-right text-base"
                                    value={formData.salaryStructure[item.field]}
                                    onChange={(e) => handleSalaryChange(item.field, e.target.value)}
                                  />
                                </td>
                                <td className="p-5 text-right font-black text-gray-900 tabular-nums text-base">
                                  ₹{(formData.salaryStructure[item.field] * 12).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-[#3AB000]/5 font-black text-[#3AB000]">
                              <td className="p-5 uppercase tracking-widest text-xs">Total Monthly Gross</td>
                              <td className="p-5 text-right text-xl">₹{formData.salaryStructure.grossSalary.toLocaleString()}</td>
                              <td className="p-5 text-right text-lg tabular-nums">₹{(formData.salaryStructure.grossSalary * 12).toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Benefits & CTC Summary */}
                    <div className="xl:col-span-5 space-y-8">
                      <div className="space-y-5">
                        <h3 className="text-sm font-black text-blue-500 uppercase tracking-[0.1em] flex items-center gap-3">
                          <Shield size={20} className="text-blue-500" />
                          Benefits & Employer Contributions
                        </h3>
                        <div className="bg-blue-50/20 border border-blue-100 rounded-none p-6 space-y-6">
                          {[
                            { label: 'PF (Employer Contribution)', field: 'benefits.pf' },
                            { label: 'Gratuity #', field: 'benefits.gratuity' },
                            { label: 'Insurance Valuation', field: 'benefits.insurance' },
                          ].map((item) => (
                            <div key={item.field} className="space-y-2.5">
                              <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">{item.label}</label>
                              <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                  <input 
                                    type="number"
                                    className="w-full bg-white border border-gray-300 focus:border-blue-400 px-5 py-3 rounded-none text-base font-black text-gray-800 outline-none transition-all text-right"
                                    value={item.field.includes('.') ? formData.salaryStructure.benefits[item.field.split('.')[1]] : formData.salaryStructure[item.field]}
                                    onChange={(e) => handleSalaryChange(item.field, e.target.value)}
                                  />
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold">₹</span>
                                </div>
                                <div className="w-2/5 text-right bg-blue-500/10 p-2 rounded-none border border-blue-500/20">
                                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">Yearly Value (Rs.)</p>
                                  <p className="text-sm font-black text-gray-900 tabular-nums">
                                    ₹{((item.field.includes('.') ? formData.salaryStructure.benefits[item.field.split('.')[1]] : formData.salaryStructure[item.field]) * 12).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Commission Configuration */}
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black text-orange-500 uppercase tracking-[0.1em] flex items-center gap-3">
                            <CreditCard size={20} className="text-orange-500" />
                            Card Creation Commission
                          </h3>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer"
                              checked={formData.cardCommission.enabled}
                              onChange={(e) => setFormData({
                                ...formData, 
                                cardCommission: { ...formData.cardCommission, enabled: e.target.checked }
                              })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                          </label>
                        </div>
                        
                        {formData.cardCommission.enabled && (
                          <div className="bg-orange-50/20 border border-orange-100 p-6 animate-in slide-in-from-top-2 duration-300">
                             <div className="space-y-2.5">
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Commission per Card (Rs.)</label>
                                <div className="relative group">
                                  <input 
                                    type="number"
                                    className="w-full pl-12 pr-5 py-4 bg-white border border-gray-300 focus:border-orange-400 text-base font-black text-gray-800 outline-none rounded-none transition-all"
                                    placeholder="Ex: 50"
                                    value={formData.cardCommission.amountPerCard}
                                    onChange={(e) => setFormData({
                                      ...formData,
                                      cardCommission: { ...formData.cardCommission, amountPerCard: e.target.value === "" ? "" : Number(e.target.value) }
                                    })}
                                  />
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold group-focus-within:text-orange-500">₹</span>
                                </div>
                                <p className="text-[10px] font-bold text-orange-400 uppercase italic">This amount will be credited for every card (PE, BS, DM, ZC, RM) created by the staff.</p>
                             </div>
                          </div>
                        )}
                      </div>

                      {/* Professional Final CTC Card */}
                      <div className="space-y-4 bg-[#111827] p-8 rounded-none text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-700">
                          <Wallet size={160} />
                        </div>
                        <div className="relative z-10">
                          <div className="flex justify-between items-center border-b border-gray-800 pb-6 mb-6">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Gross Pay (Monthly)</p>
                              <p className="text-xl font-black tracking-tight mt-1">₹{formData.salaryStructure.grossSalary.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Add-ons (Benefits)</p>
                              <p className="text-xl font-black tracking-tight text-blue-400 mt-1">
                                +₹{(formData.salaryStructure.ctc - formData.salaryStructure.grossSalary).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#3AB000]">Total Monthly CTC</p>
                            <div className="flex items-baseline gap-3">
                              <span className="text-5xl font-black tracking-tighter text-[#3AB000]">₹{formData.salaryStructure.ctc.toLocaleString()}</span>
                              <span className="text-sm font-bold text-gray-500 uppercase">/ month</span>
                            </div>
                          </div>

                          <div className="mt-8 pt-6 border-t border-gray-800/50 flex justify-between items-center">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Annual CTC Projection</span>
                            <span className="text-base font-black text-white bg-[#3AB000] px-5 py-2 rounded-none shadow-lg shadow-green-900/20">
                              ₹{(formData.salaryStructure.ctc * 12).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-gray-100 bg-gray-50/50 shrink-0 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-all flex items-center gap-2 group"
              >
                <X size={16} className="group-hover:rotate-90 transition-transform" />
                Cancel Process
              </button>
              
              <div className="flex gap-4">
                {currentStep === 2 && (
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-8 py-4 bg-white border border-gray-300 text-gray-600 font-black text-xs uppercase tracking-widest hover:border-[#3AB000] hover:text-[#3AB000] rounded-none transition-all flex items-center gap-2 shadow-sm"
                  >
                    <ChevronLeft size={18} /> Back to Details
                  </button>
                )}
                
                {currentStep === 1 ? (
                  <button
                    onClick={() => {
                      if (!formData.name || !formData.email || !formData.mobile || !formData.jobRoleId || !formData.dob) {
                        toast.error("Required fields missing in Step 1");
                        return;
                      }
                      
                      // Age validation
                      const birthDate = new Date(formData.dob);
                      const today = new Date();
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const m = today.getMonth() - birthDate.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                      }
                      
                      if (age < 18) {
                        toast.error("Staff must be at least 18 years old");
                        return;
                      }

                      setCurrentStep(2);
                    }}
                    className="px-12 py-4 bg-black text-white font-black text-xs uppercase tracking-widest hover:bg-[#3AB000] rounded-none transition-all flex items-center gap-3 shadow-xl group active:scale-95"
                  >
                    Salary Configuration <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="px-12 py-4 bg-[#3AB000] text-white font-black text-xs uppercase tracking-widest hover:bg-[#2d8a00] rounded-none transition-all flex items-center gap-3 shadow-xl shadow-green-200 active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        SAVING RECORDS...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        {editMode ? "UPDATE STAFF RECORD" : "CONFIRM & CREATE STAFF"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className={`bg-white border-t-8 w-full max-w-md p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200 ${confirmDialog.isDanger ? 'border-t-red-600' : 'border-t-[#3AB000]'}`}>
            
            <div className={`w-16 h-16 mx-auto flex items-center justify-center rounded-none ${confirmDialog.isDanger ? 'bg-red-50 text-red-600' : 'bg-green-50 text-[#3AB000]'}`}>
              <AlertCircle size={32} />
            </div>
            
            <div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{confirmDialog.title}</h3>
              <p className="text-xs font-bold text-gray-500 leading-relaxed uppercase tracking-wide mt-3 whitespace-pre-wrap">
                {confirmDialog.message}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null, isDanger: false })}
                className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-black uppercase tracking-widest flex items-center justify-center transition-colors rounded-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                  setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null, isDanger: false });
                }}
                className={`flex-1 h-12 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center transition-all rounded-none active:scale-95 shadow-sm hover:shadow ${
                  confirmDialog.isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#3AB000] hover:bg-[#2d8a00]'
                }`}
              >
                Confirm
              </button>
            </div>
            
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdministrativeStaffManagement;
