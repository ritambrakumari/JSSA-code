import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { employeesAPI, profileAPI } from "../../utils/api";
import { User, Shield, CreditCard, Mail, Phone, Loader2, ArrowLeft, Save, X, Building, MapPin, Fingerprint, Users } from "lucide-react";
import toast from "react-hot-toast";

const InfoGroup = ({ label, value, isEditing, onChange, type = "text", error, isChecking }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
      {label}
      {isChecking && <Loader2 size={12} className="animate-spin text-blue-500" />}
    </label>
    {isEditing ? (
      <>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 bg-gray-50 border text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all ${error ? 'border-red-500' : 'border-gray-200'}`}
        />
        {error && <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1"><X size={12}/> {error}</p>}
      </>
    ) : (
      <p className="text-sm font-black text-gray-900 bg-gray-50 px-3 py-2 border border-gray-100 uppercase">{value || "N/A"}</p>
    )}
  </div>
);

const SectionHeader = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-200">
    <div className="p-2 bg-gray-100 rounded-lg">
      <Icon size={18} className="text-gray-700" />
    </div>
    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{title}</h3>
  </div>
);

export default function AdminEmployeeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [employee, setEmployee] = useState(null);
  
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    mobile: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    fatherName: "",
    motherName: "",
    dob: "",
    panNumber: "",
    aadharNumber: "",
    maritalStatus: "",
    handicapDisability: "",
  });

  const [availabilityError, setAvailabilityError] = useState("");
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [currentCheckField, setCurrentCheckField] = useState("");
  const [checkTimeout, setCheckTimeout] = useState(null);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const res = await employeesAPI.getById(id);
      if (res.success && res.data) {
        const emp = res.data;
        setEmployee(emp);
        setEditData({
          name: emp.name || "",
          email: emp.userId?.email || emp.email || "",
          mobile: emp.userId?.phone || emp.mobile || "",
          bankName: emp.bankName || "",
          accountNumber: emp.accountNumber || "",
          ifscCode: emp.ifscCode || "",
          accountHolderName: emp.accountHolderName || "",
          fatherName: emp.fatherName || "",
          motherName: emp.motherName || "",
          dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : "",
          panNumber: emp.panNumber || "",
          aadharNumber: emp.aadharNumber || "",
          maritalStatus: emp.maritalStatus || "Unmarried",
          handicapDisability: emp.handicapDisability || "No",
        });
      }
    } catch (err) {
      toast.error(err.message || "Failed to fetch employee details");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));

    if (field === "email" || field === "mobile") {
      if (checkTimeout) clearTimeout(checkTimeout);
      setCurrentCheckField(field);
      setIsCheckingAvailability(true);
      
      const newTimeout = setTimeout(async () => {
        try {
          if (field === "mobile" && value.length !== 10) {
            setIsCheckingAvailability(false);
            return;
          }
          // Don't show error if it matches their current email/mobile
          if (field === "email" && value === (employee.userId?.email || employee.email)) {
            setAvailabilityError("");
            setIsCheckingAvailability(false);
            return;
          }
          if (field === "mobile" && value === (employee.userId?.phone || employee.mobile)) {
            setAvailabilityError("");
            setIsCheckingAvailability(false);
            return;
          }

          const res = await profileAPI.checkAvailability(
            field === "email" ? value : undefined,
            field === "mobile" ? value : undefined
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

  const handleSave = async () => {
    if (availabilityError) {
      toast.error("Please fix errors before saving");
      return;
    }
    
    try {
      setSaving(true);
      const res = await employeesAPI.adminEditEmployee(id, editData);
      if (res.success) {
        toast.success("Employee details updated successfully!", { iconTheme: { primary: "#1761b0", secondary: "#ffffff" }, style: { border: "1px solid #b9d3f0", color: "#123b68", fontWeight: 600, fontFamily: '"Segoe UI", Tahoma, sans-serif' } });
        navigate("/admin/employee-list");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update employee");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full min-h-[60vh]">
          <Loader2 size={40} className="animate-spin text-[#3AB000]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <p className="text-red-500 font-bold">Employee not found.</p>
          <button onClick={() => navigate("/admin/employee-list")} className="mt-4 text-blue-500 underline">Back to List</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-8 px-4">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <button 
              onClick={() => navigate("/admin/employee-list")}
              className="flex items-center gap-2 text-sm font-black text-gray-500 hover:text-black uppercase tracking-widest transition-colors mb-3"
            >
              <ArrowLeft size={16} /> Back to Directory
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-3">
              Edit Employee <span className="text-[#3AB000]">/ {employee.name}</span>
            </h1>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">
              ID: {employee.employeeRecordId || "PENDING"} | ROLE: {employee.role}
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => navigate("/admin/employee-list")}
              className="flex-1 md:flex-none px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:border-black hover:text-black transition-all flex items-center justify-center gap-2"
            >
              <X size={14} /> Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={saving || !!availabilityError}
              className="flex-1 md:flex-none px-8 py-3 bg-[#3AB000] text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#3AB000]/20"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Personal Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 sm:p-8 border border-gray-200 shadow-sm">
              <SectionHeader title="Personal Information" icon={User} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoGroup 
                  label="Full Name" 
                  value={editData.name} 
                  isEditing={true} 
                  onChange={(val) => handleInputChange("name", val)} 
                />
                
                <InfoGroup 
                  label="Email Address (Login ID)" 
                  value={editData.email} 
                  isEditing={true} 
                  onChange={(val) => handleInputChange("email", val)}
                  type="email"
                  error={availabilityError && availabilityError.includes("email") ? availabilityError : ""}
                  isChecking={isCheckingAvailability && currentCheckField === "email"}
                />
                
                <InfoGroup 
                  label="Mobile Number (Login ID)" 
                  value={editData.mobile} 
                  isEditing={true} 
                  onChange={(val) => handleInputChange("mobile", val)}
                  type="text"
                  error={availabilityError && availabilityError.includes("mobile") ? availabilityError : ""}
                  isChecking={isCheckingAvailability && currentCheckField === "mobile"}
                />
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 border border-gray-200 shadow-sm">
              <SectionHeader title="Family & Additional Info" icon={Users} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoGroup 
                  label="Father's Name" 
                  value={editData.fatherName} 
                  isEditing={true} 
                  onChange={(val) => handleInputChange("fatherName", val)} 
                />
                <InfoGroup 
                  label="Mother's Name" 
                  value={editData.motherName} 
                  isEditing={true} 
                  onChange={(val) => handleInputChange("motherName", val)} 
                />
                <InfoGroup 
                  label="Date of Birth" 
                  value={editData.dob} 
                  isEditing={true} 
                  onChange={(val) => handleInputChange("dob", val)} 
                  type="date"
                />
                <InfoGroup 
                  label="Marital Status" 
                  value={editData.maritalStatus} 
                  isEditing={true} 
                  onChange={(val) => handleInputChange("maritalStatus", val)} 
                />
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 border border-gray-200 shadow-sm">
              <SectionHeader title="Identity Details" icon={Fingerprint} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoGroup 
                  label="Aadhar Number" 
                  value={editData.aadharNumber} 
                  isEditing={true} 
                  onChange={(val) => handleInputChange("aadharNumber", val)} 
                />
                <InfoGroup 
                  label="PAN Number" 
                  value={editData.panNumber} 
                  isEditing={true} 
                  onChange={(val) => handleInputChange("panNumber", val)} 
                />
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 border border-gray-200 shadow-sm">
              <SectionHeader title="Banking Details" icon={CreditCard} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoGroup 
                  label="Bank Name" 
                  value={editData.bankName} 
                  isEditing={true} 
                  onChange={(val) => handleInputChange("bankName", val)} 
                />
                <InfoGroup 
                  label="Account Holder Name" 
                  value={editData.accountHolderName} 
                  isEditing={true} 
                  onChange={(val) => handleInputChange("accountHolderName", val)} 
                />
                <InfoGroup 
                  label="Account Number" 
                  value={editData.accountNumber} 
                  isEditing={true} 
                  onChange={(val) => handleInputChange("accountNumber", val)} 
                />
                <InfoGroup 
                  label="IFSC Code" 
                  value={editData.ifscCode} 
                  isEditing={true} 
                  onChange={(val) => handleInputChange("ifscCode", val)} 
                />
              </div>
            </div>
          </div>

          {/* Right Column: Read-Only Stats */}
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 p-6">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Current Assignments</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Designation</p>
                  <p className="text-sm font-black text-gray-900 mt-1">{employee.designation}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Role Code</p>
                  <p className="text-sm font-black text-[#3AB000] mt-1">{employee.role}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base District</p>
                  <p className="text-sm font-black text-gray-900 mt-1">{employee.workingDistrict || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                  <span className={`inline-block mt-1 text-[10px] font-black px-3 py-1 uppercase tracking-widest ${
                      employee.status === "Active" 
                        ? "bg-[#3AB000]/10 text-[#3AB000]" 
                        : "bg-red-100 text-red-600"
                    }`}>
                    {employee.status}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                  Note: Role, Designation, and District assignments cannot be edited from this screen to prevent hierarchy issues. They are managed via Promotions & Transfers.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
