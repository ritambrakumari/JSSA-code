import React, { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { employeesAPI } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import statesData from "../../data/states.json";
import {
  Search,
  User,
  Filter,
  Loader2,
  AlertCircle,
  Download,
  CreditCard,
  X,
  Verified,
  QrCode,
  UserCheck,
  Contact,
  Phone,
  Calendar
} from "lucide-react";
import { toast } from "react-hot-toast";
import { IDCardTemplate, AvatarPlaceholder } from "../EmployeeDashboard/EmployeeLetters";

// Assets for ID Card
import watermarkLogo from "../../assets/JSSAogo.png";
import qrCodeAsset from "../../assets/QrCode.png";

const EmployeeAvatar = ({ photo, name }) => {
  const [error, setError] = useState(false);
  if (!photo || error) return <AvatarPlaceholder />;
  return <img src={photo} alt={name} className="w-full h-full object-cover" onError={() => setError(true)} />;
};

const IdCardManagement = () => {
  const navigate = useNavigate();

  // === TABLE STATE ===
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 15 });

  // === FILTER STATE ===
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [blockFilter, setBlockFilter] = useState("all");
  const [panchayatFilter, setPanchayatFilter] = useState("all");

  const [filterCounts, setFilterCounts] = useState({ states: {}, districts: {}, blocks: {}, panchayats: {} });

  // === MODAL STATE ===
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef(null);

  const loadFilterCounts = async () => {
    try {
      const res = await employeesAPI.getAllFilterCounts({
        role: role !== "all" ? role : "",
        state: stateFilter !== "all" ? stateFilter : "",
        district: districtFilter !== "all" ? districtFilter : "",
        block: blockFilter !== "all" ? blockFilter : ""
      });
      if (res.success) {
        setFilterCounts(res.data || { states: {}, districts: {}, blocks: {}, panchayats: {} });
      }
    } catch (err) {
      console.error("Failed to load filter counts:", err);
    }
  };

  useEffect(() => {
    loadFilterCounts();
  }, [role, stateFilter, districtFilter, blockFilter]);

  const fetchEmployees = useCallback(async (pageNum = 1, overrideFilters = null) => {
    try {
      setLoading(true);
      const filters = overrideFilters || { search, role, stateFilter, districtFilter, blockFilter, panchayatFilter };
      const params = {
        page: pageNum,
        limit: 15,
        search: filters.search || "",
      };
      if (filters.role && filters.role !== "all") params.role = filters.role;
      if (filters.stateFilter && filters.stateFilter !== "all") params.state = filters.stateFilter;
      if (filters.districtFilter && filters.districtFilter !== "all") params.district = filters.districtFilter;
      if (filters.blockFilter && filters.blockFilter !== "all") params.block = filters.blockFilter;
      if (filters.panchayatFilter && filters.panchayatFilter !== "all") params.panchayat = filters.panchayatFilter;

      const res = await employeesAPI.getZoneEligible(params);
      if (res.success) {
        setEmployees(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
          setPage(res.pagination.page);
        }
      } else {
        toast.error(res.error || "Failed to fetch employees");
      }
    } catch (error) {
      console.error("Fetch Employees Error:", error);
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  }, [search, role, stateFilter, districtFilter, blockFilter, panchayatFilter]);

  useEffect(() => {
    fetchEmployees(1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchEmployees(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleFilterChange = (field, value) => {
    const newFilters = { search, role, stateFilter, districtFilter, blockFilter, panchayatFilter, [field]: value };
    if (field === "role") { 
      setRole(value); 
      newFilters.stateFilter = "all"; newFilters.districtFilter = "all"; newFilters.blockFilter = "all"; newFilters.panchayatFilter = "all"; 
      setStateFilter("all"); setDistrictFilter("all"); setBlockFilter("all"); setPanchayatFilter("all"); 
    }
    if (field === "stateFilter") { 
      setStateFilter(value); 
      newFilters.districtFilter = "all"; newFilters.blockFilter = "all"; newFilters.panchayatFilter = "all"; 
      setDistrictFilter("all"); setBlockFilter("all"); setPanchayatFilter("all"); 
    }
    if (field === "districtFilter") { 
      setDistrictFilter(value); 
      newFilters.blockFilter = "all"; newFilters.panchayatFilter = "all"; 
      setBlockFilter("all"); setPanchayatFilter("all"); 
    }
    if (field === "blockFilter") { 
      setBlockFilter(value); 
      newFilters.panchayatFilter = "all"; 
      setPanchayatFilter("all"); 
    }
    if (field === "panchayatFilter") setPanchayatFilter(value);
    
    setPage(1);
    fetchEmployees(1, newFilters);
  };

  const getRoleBadge = (roleStr) => {
    const styles = {
      RM: "bg-red-50 text-red-600 border-red-100",
      ZC: "bg-orange-50 text-orange-600 border-orange-100",
      DM: "bg-blue-50 text-blue-600 border-blue-100",
      BS: "bg-purple-50 text-purple-600 border-purple-100",
      PE: "bg-green-50 text-green-600 border-green-100",
    };
    return styles[roleStr] || "bg-gray-50 text-gray-600 border-gray-100";
  };

  // === PDF GENERATION LOGIC ===
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (window.html2pdf) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const handleDownload = async () => {
    if (isDownloading || !cardRef.current || !selectedCard) return;
    setIsDownloading(true);

    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
      
      const element = cardRef.current;
      const opt = {
        margin: 0,
        filename: `ID_Card_${selectedCard.employeeId || selectedCard.userId?.employeeId || selectedCard._id}.pdf`,
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

      await window.html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF Generation Error:', err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewCard = (emp) => {
    setSelectedCard(emp);
    setIsModalOpen(true);
  };

  const getGenderPrefix = (emp) => {
    const gender = emp.gender || "";
    const maritalStatus = emp.maritalStatus || "";
    if (gender.toLowerCase() === "male") return "S/O";
    if (gender.toLowerCase() === "female") {
      if (maritalStatus === "Unmarried") return "D/O";
      if (["Married", "Widowed"].includes(maritalStatus)) return "W/O";
      return "D/O";
    }
    return "C/O";
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30">
                <CreditCard className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">ID Card Management</h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Manage and Download Employee Digital Cards</p>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          <div className="bg-white border border-gray-200 p-4 mb-4 rounded-none shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-[#3AB000]" />
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Global Filters</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {/* Search */}
              <div className="flex items-center border border-gray-200 rounded-none overflow-hidden h-10 bg-white focus-within:border-[#3AB000] xl:col-span-2">
                <input
                  type="text"
                  placeholder="Search by name, mobile, email..."
                  className="flex-1 px-3 text-xs font-bold uppercase tracking-wide outline-none text-gray-800"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="bg-[#3AB000] h-full flex items-center px-3 text-white">
                  <Search size={14} />
                </div>
              </div>

              {/* Role */}
              <select
                value={role}
                onChange={(e) => handleFilterChange("role", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
              >
                <option value="all">All Roles</option>
                <option value="RM">Regional Manager (RM)</option>
                <option value="ZC">Zonal Coordinator (ZC)</option>
                <option value="DM">District Manager (DM)</option>
                <option value="BS">Block Supervisor (BS)</option>
                <option value="PE">Panchayat Executive (PE)</option>
              </select>

              {/* State */}
              <select
                value={stateFilter}
                onChange={(e) => handleFilterChange("stateFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
              >
                <option value="all">All States</option>
                {statesData.map((st, i) => (
                  <option key={i} value={st}>{st}</option>
                ))}
              </select>

              {/* District */}
              <select
                value={districtFilter}
                disabled={stateFilter === "all"}
                onChange={(e) => handleFilterChange("districtFilter", e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="all">All Districts</option>
                {stateFilter !== "all" && Object.entries(filterCounts.districts || {}).map(([dist]) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>

              {/* Block */}
              {(role === "all" || role === "BS" || role === "PE") && (
                <select
                  value={blockFilter}
                  disabled={districtFilter === "all"}
                  onChange={(e) => handleFilterChange("blockFilter", e.target.value)}
                  className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000] disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="all">All Blocks</option>
                  {districtFilter !== "all" && Object.entries(filterCounts.blocks || {}).map(([blk]) => (
                    <option key={blk} value={blk}>{blk}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Employees Table */}
          <div className="bg-white rounded-none border border-gray-200 overflow-hidden relative min-h-[300px] shadow-sm">
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-4">
                <Loader2 size={36} className="animate-spin text-[#3AB000]" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Loading Employees...</p>
              </div>
            )}

            {employees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#3AB000] text-white font-black uppercase text-[10px] tracking-widest">
                      <th className="p-4 w-12">#</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Mobile</th>
                      <th className="p-4 text-center">Role</th>
                      <th className="p-4">Location (District)</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employees.map((emp, idx) => (
                      <tr key={emp._id} className="hover:bg-green-50/30 transition-colors">
                        <td className="p-4 text-[11px] font-black text-gray-400">
                          {(page - 1) * 15 + idx + 1}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 rounded-none shrink-0 overflow-hidden">
                              <EmployeeAvatar photo={emp.photo} name={emp.name} />
                            </div>
                            <div className="max-w-[150px]">
                              <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate" title={emp.name}>{emp.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-[13px] font-semibold text-gray-700 lowercase max-w-[150px] truncate" title={emp.userId?.email || "—"}>{emp.userId?.email || "—"}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-[13px] font-semibold text-gray-700 max-w-[100px] truncate">{emp.userId?.phone || "—"}</p>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-none uppercase tracking-wider border ${getRoleBadge(emp.role)}`}>
                            {emp.role || "—"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-[13px] font-bold text-gray-700">{emp.workingDistrict || emp.state || "—"}</span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleViewCard(emp)}
                            className="px-3 py-1.5 bg-green-50 text-[#3AB000] border border-green-200 hover:bg-[#3AB000] hover:text-white text-[9px] font-black uppercase tracking-wider rounded-none transition-all flex items-center gap-1 ml-auto"
                          >
                            <CreditCard size={12} /> View ID Card
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !loading && (
              <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
                <div className="p-4 bg-gray-50 border border-gray-150 text-gray-200 rounded-none">
                  <AlertCircle size={36} />
                </div>
                <p className="text-xs font-black text-gray-400 uppercase">No Employees Found</p>
                <p className="text-[10px] text-gray-300 uppercase tracking-widest font-bold">Try adjusting filters</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4 px-2">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Showing {employees.length} of {pagination.total} Employees
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => fetchEmployees(page - 1)}
                  className="px-4 py-2 bg-white border border-gray-250 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                    let pageNum = 1;
                    if (pagination.pages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
                    else pageNum = page - 2 + i;
                    if (pageNum > pagination.pages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchEmployees(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center text-[10px] font-black transition-all border rounded-none ${page === pageNum
                          ? "bg-[#3AB000] border-[#3AB000] text-white scale-110"
                          : "bg-white border-gray-250 text-gray-400 hover:border-[#3AB000]"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={page === pagination.pages}
                  onClick={() => fetchEmployees(page + 1)}
                  className="px-4 py-2 bg-white border border-gray-250 text-[10px] font-black uppercase tracking-widest hover:border-[#3AB000] disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ID Card Modal */}
      <div className={isModalOpen ? "fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 overflow-hidden" : "opacity-0 pointer-events-none absolute top-[-9999px]"}>
        <div className="bg-transparent w-full max-w-4xl flex flex-col relative h-full max-h-[95vh] sm:max-h-[90vh]">
          {/* Header Actions */}
          {(isModalOpen || isDownloading) && (
            <div className="bg-white p-4 border-b-2 border-[#1B9E4B] flex justify-between items-center text-gray-900 rounded-t-sm shadow-sm relative z-10 mx-auto w-full">
              <h3 className="font-black flex items-center gap-2 uppercase tracking-wide">
                <CreditCard className="text-purple-600" />
                IDENTITY CARD
              </h3>
              <div className="flex gap-2">
                {isModalOpen && (
                  <button 
                    onClick={() => handleDownload()}
                    disabled={isDownloading}
                    className="p-2 bg-[#3AB000] text-white hover:bg-green-700 transition-all shadow-md disabled:opacity-50 border border-[#3AB000]"
                    title="Download PDF"
                  >
                    {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                  </button>
                )}
                {isModalOpen && (
                  <button 
                    onClick={() => !isDownloading && setIsModalOpen(false)} 
                    className="p-2 bg-gray-300 hover:bg-gray-400 transition-all border border-gray-400"
                  >
                    <X size={24} className="text-gray-700" />
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-8 rounded-b-sm shadow-2xl relative w-full styled-scrollbar mx-auto">
            {selectedCard && (
              <div className="mx-auto bg-white border border-gray-300 p-4 w-fit shadow-md">
                <div ref={cardRef} className="adm-keep flex-1 flex flex-col items-center w-full overflow-hidden">
                  <IDCardTemplate 
                    application={{
                      candidateName: selectedCard.name,
                      photo: selectedCard.photo,
                      fatherName: selectedCard.fatherName || selectedCard.husbandName || "—",
                      dob: selectedCard.dob,
                      email: selectedCard.userId?.email || selectedCard.email,
                      post: selectedCard.role
                    }}
                    formData={{
                      district: selectedCard.workingDistrict || selectedCard.district || selectedCard.state || "—",
                      state: selectedCard.state || "—"
                    }}
                    empId={selectedCard.employeeId || selectedCard.userId?.employeeId || selectedCard._id}
                    logo={watermarkLogo}
                    templateRef={cardRef}
                    detectedPost={selectedCard.role}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
};

export default IdCardManagement;
