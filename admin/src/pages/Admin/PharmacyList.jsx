import React, { useState, useEffect } from "react";
import { Search, Plus, Trash2, RefreshCw, X, UserPlus, Phone, Mail, ShieldAlert, UserX, LogOut, Stethoscope, Check, User } from "lucide-react";
import { pharmaciesAPI } from "../../utils/api";
import { useAuth } from "../../auth/AuthProvider";
import DashboardLayout from "../../components/DashboardLayout";

/** Blocks portal for inactive / terminated pharmacies — logout only, no close */
export function PharmacyAccountStatusBlocker() {
  const { role, isAuthenticated, employeeProfile, profileLoading, logout } = useAuth();

  if (!isAuthenticated || role !== "pharmacy") return null;

  // Wait for fresh profile after login — avoids stale Inactive/Terminated from last session
  if (profileLoading || !employeeProfile) return null;

  const accountStatus = employeeProfile?.status;
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
            ? "Your pharmacy partnership has been terminated. You cannot access the portal. Contact administration if you believe this is an error."
            : "Your pharmacy account is currently inactive. Please contact administration to restore access."}
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

const PharmacyList = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
  });

  const fetchPharmacies = async () => {
    setIsLoading(true);
    try {
      const res = await pharmaciesAPI.getAll();
      if (res.success) {
        setPharmacies(res.pharmacies || []);
      }
    } catch (err) {
      console.error("Failed to fetch pharmacies:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPharmacy = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await pharmaciesAPI.create(formData);
      if (res.success) {
        alert("Pharmacy added successfully! Default password is their mobile number.");
        setIsModalOpen(false);
        setFormData({ name: "", email: "", mobile: "" });
        fetchPharmacies();
      } else {
        alert(res.error || "Failed to add pharmacy");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error adding pharmacy");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to deactivate this pharmacy?")) {
      try {
        const res = await pharmaciesAPI.delete(id);
        if (res.success) {
          alert("Pharmacy deactivated");
          fetchPharmacies();
        }
      } catch (err) {
        console.error("Error deleting pharmacy:", err);
      }
    }
  };

  const filteredPharmacies = pharmacies.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.userId?.phone?.includes(searchQuery) ||
    p.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30">
                <Stethoscope className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Pharmacy Management</h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Manage pharmacy tied-ups and their onboarding status.</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-none text-center md:text-right shrink-0">
              <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Total Pharmacies</p>
              <p className="text-xl font-black text-white uppercase mt-1">{pharmacies?.length || 0} Pharmacies</p>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-gray-50 border border-gray-150 p-4 rounded-none flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Stethoscope size={14} className="text-[#3AB000]" />
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Directory Controls</span>
            </div>
            <div className="relative w-full max-w-md lg:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 h-9 border border-gray-200 rounded-none focus:ring-1 focus:ring-[#3AB000] outline-none text-[11px] font-bold"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-[10px] px-5 h-9 font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 rounded-none shadow-sm shrink-0"
              >
                <Plus size={14} /> Add Pharmacy
              </button>
              <button
                onClick={fetchPharmacies}
                className="bg-black hover:bg-gray-800 text-white text-[10px] px-5 h-9 font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 rounded-none shadow-sm shrink-0"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-none border border-gray-200 overflow-hidden relative min-h-[400px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-black uppercase text-[10px] tracking-widest border-b border-gray-150">
                    <th className="px-6 py-4">Pharmacy / Owner</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Onboarding</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10">
                        <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
                          <RefreshCw size={24} className="animate-spin text-[#3AB000]" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Loading...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPharmacies.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10">
                        <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
                          <Stethoscope size={24} className="text-gray-300" />
                          <p className="text-[10px] font-black uppercase tracking-widest">No Pharmacies Found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPharmacies.map((pharmacy) => (
                      <tr key={pharmacy._id} className="hover:bg-[#f9fff5] transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-[#f9fff5] border border-[#3AB000]/30 flex items-center justify-center text-[#3AB000] rounded-none shrink-0 font-bold">
                              {pharmacy.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-gray-900 uppercase">{pharmacy.name}</p>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{pharmacy.shopName || "Shop name pending"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 text-[11px] font-bold text-gray-600">
                            {pharmacy.userId?.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-[#3AB000]" /> {pharmacy.userId.phone}
                              </div>
                            )}
                            {pharmacy.userId?.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-[#3AB000]" /> {pharmacy.userId.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border rounded-none ${pharmacy.status === "Active" ? "bg-[#f9fff5] text-[#3AB000] border-[#3AB000]/30" : "bg-red-50 text-red-600 border-red-200"
                            }`}>
                            {pharmacy.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {pharmacy.onboardingComplete ? (
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#3AB000]">
                              <Check className="h-3.5 w-3.5" /> Completed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-orange-500">
                              <RefreshCw className="h-3.5 w-3.5" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => handleDelete(pharmacy._id)}
                              className="h-8 w-8 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-red-500 border border-gray-200 transition-all"
                              title="Deactivate"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add Pharmacy Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white shadow-2xl w-full max-w-md overflow-hidden flex flex-col rounded-none border border-[#3AB000]">
              <div className="bg-[#3AB000] px-6 py-4 flex items-center justify-between">
                <h2 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                  <UserPlus size={14} /> Add New Pharmacy
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddPharmacy}>
                <div className="p-6 space-y-5 bg-white">
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.15em] mb-1.5">Owner / Shop Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3AB000]" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-4 h-10 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3AB000] outline-none rounded-none transition-all placeholder:text-gray-400"
                        placeholder="Enter Name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.15em] mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3AB000]" />
                      <input
                        type="tel"
                        name="mobile"
                        required
                        pattern="[0-9]{10}"
                        title="Please enter valid 10-digit mobile number"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-4 h-10 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3AB000] outline-none rounded-none transition-all placeholder:text-gray-400"
                        placeholder="10-digit mobile number"
                      />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 mt-1.5">This will be used as their login ID and default password.</p>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.15em] mb-1.5">Email ID (Optional)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3AB000]" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-4 h-10 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3AB000] outline-none rounded-none transition-all placeholder:text-gray-400"
                        placeholder="Email Address"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-gray-150 bg-white flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 h-10 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 h-10 bg-[#3AB000] hover:bg-[#2d8a00] text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center justify-center min-w-[140px] rounded-none"
                  >
                    {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : "Add Pharmacy"}
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

export default PharmacyList;
