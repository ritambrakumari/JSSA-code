import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { walletAPI } from "../../utils/api";
import { toast } from "react-hot-toast";
import {
  Search,
  Filter,
  Loader2,
  CreditCard,
  History,
  CheckCircle,
  XCircle,
  RefreshCcw,
  IndianRupee,
  Users,
  Landmark
} from "lucide-react";

export default function AdminEmployeeSalary() {
  // Data States
  const [employees, setEmployees] = useState([]);

  // Filtering & Pagination
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [roleFilter, setRoleFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("thisMonth");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null); // single employee object

  // Fetch Data based on activeTab
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEmployees();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, page, roleFilter, dateFilter, customStartDate, customEndDate]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = { search, page, limit: 20 };
      if (roleFilter !== "all") params.role = roleFilter;
      params.dateRange = dateFilter;
      if (dateFilter === "custom_date") {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const res = await walletAPI.getAdminEmployees(params);
      if (res.success) {
        setEmployees(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.pages);
        }
      } else {
        toast.error(res.error || "Failed to fetch employees");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Modal Handlers
  const handleOpenSalaryModal = (emp) => {
    setSelectedEmp(emp);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmp(null);
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };
  const isDev = false
  return (
    <DashboardLayout activePath="/admin/employee-salary">
      {isDev ? <div className="max-w-[99rem] mx-auto space-y-6">Working in progress</div> : <><div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
          <div className="pt-4 md:pt-6">

            {/* Header */}
            <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30">
                  <IndianRupee className="text-white" size={30} />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Employee Salary Management</h1>
                  <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Process Payouts & View Earnings</p>
                </div>
              </div>
              <button
                onClick={() => fetchEmployees()}
                className="bg-white/20 hover:bg-white/30 border border-white/30 text-white p-2 transition-colors self-start md:self-auto rounded-none"
              >
                <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-200 p-4 mb-4 rounded-none shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-[#3AB000]" />
                  <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Global Filters</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="flex items-center border border-gray-200 rounded-none overflow-hidden h-10 bg-white focus-within:border-[#3AB000] lg:col-span-1">
                  <input
                    type="text"
                    placeholder="Search by name, email..."
                    className="flex-1 px-3 text-xs font-bold uppercase tracking-wide outline-none text-gray-800"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  />
                  <div className="bg-[#3AB000] h-full flex items-center px-3 text-white">
                    <Search size={14} />
                  </div>
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                  className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
                >
                  <option value="all">All Roles</option>
                  <option value="PE">Panchayat Executive (PE)</option>
                  <option value="BS">Block Supervisor (BS)</option>
                  <option value="DM">District Manager (DM)</option>
                  <option value="ZC">Zonal Coordinator (ZC)</option>
                  <option value="RM">Regional Manager (RM)</option>
                  <option value="PM">Project Manager (PM)</option>
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                  className="h-10 px-3 bg-white border border-gray-200 rounded-none text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
                >
                  <option value="all">All Time</option>
                  <option value="thisMonth">Current Month</option>
                  <option value="pastMonth">Past Month</option>
                  <option value="custom_date">Custom Date</option>
                </select>
              </div>

              {dateFilter === "custom_date" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-20">Start Date:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => { setCustomStartDate(e.target.value); setPage(1); }}
                      className="h-10 border border-gray-200 rounded-none px-3 text-xs font-bold text-gray-700 bg-white focus:border-[#3AB000] outline-none flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-20">End Date:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => { setCustomEndDate(e.target.value); setPage(1); }}
                      className="h-10 border border-gray-200 rounded-none px-3 text-xs font-bold text-gray-700 bg-white focus:border-[#3AB000] outline-none flex-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-none border border-gray-200 overflow-hidden shadow-sm relative min-h-[400px]">
              {loading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-4 text-center">
                  <Loader2 size={40} className="animate-spin text-[#3AB000]" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Loading Employees...</p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#3AB000] text-white font-black uppercase text-[10px] tracking-widest">
                      <th className="p-4">Employee</th>
                      <th className="p-4">Email</th>
                      <th className="p-4 text-center">Role</th>
                      <th className="p-4 text-center">Mobile</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employees.length > 0 && employees.map((emp) => {
                      const getRoleBadge = (role) => {
                        const styles = {
                          RM: "bg-red-50 text-red-600 border-red-100",
                          ZC: "bg-orange-50 text-orange-600 border-orange-100",
                          DM: "bg-blue-50 text-blue-600 border-blue-100",
                          BS: "bg-purple-50 text-purple-600 border-purple-100",
                          PE: "bg-green-50 text-green-600 border-green-100",
                        };
                        return styles[role] || "bg-gray-50 text-gray-600 border-gray-100";
                      };

                      return (
                      <tr key={emp._id} className="hover:bg-green-50/30 transition-colors">
                        <td className="p-4">
                          <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{emp.name}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-[11px] font-bold text-gray-500 lowercase tracking-normal">{emp.email || "—"}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-none uppercase tracking-wider border ${getRoleBadge(emp.role)}`}>
                            {emp.role || "—"}
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold text-[11px] text-gray-700">
                          {emp.userId?.phone || emp.mobile || "—"}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleOpenSalaryModal(emp)}
                            className="px-4 py-2 bg-white border border-gray-200 hover:border-[#3AB000] hover:text-[#3AB000] text-gray-700 text-[9px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-2 rounded-none shadow-sm"
                          >
                            <CreditCard size={14} />
                            View Salary Detail
                          </button>
                        </td>
                      </tr>
                    )})}

                    {/* Empty States */}
                    {employees.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400 font-bold uppercase text-xs">
                          No employees found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center p-4 border-t border-gray-100">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 bg-gray-100 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-200 disabled:opacity-50 rounded"
                  >
                    Prev
                  </button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((p, idx) => (
                      <button
                        key={idx}
                        disabled={p === '...'}
                        onClick={() => p !== '...' && setPage(p)}
                        className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded transition-colors ${page === p
                          ? 'bg-[#3AB000] text-white'
                          : p === '...'
                            ? 'bg-transparent text-gray-400 cursor-default'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 bg-gray-100 text-[10px] font-black uppercase text-gray-600 hover:bg-gray-200 disabled:opacity-50 rounded"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

          {/* Salary Detail Modal */}
          {isModalOpen && selectedEmp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-gray-50 border border-gray-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col shadow-2xl rounded-none">
                
                {/* Modal Header */}
                <div className="bg-white border-b border-gray-200 p-5 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-none bg-[#3AB000]/10 flex items-center justify-center border border-[#3AB000]/20">
                      <CreditCard className="w-5 h-5 text-[#3AB000]" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-black uppercase tracking-widest text-sm">
                        Salary Details
                      </h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {selectedEmp.name} • {selectedEmp.role}
                      </p>
                    </div>
                  </div>
                  <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <XCircle size={24} />
                  </button>
                </div>

                {/* Modal Body - Premium Metrics Grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Earnings */}
                  <div className="bg-white p-4 rounded-none shadow-sm border border-blue-400 flex flex-col gap-2 transition-all hover:shadow-md">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-none bg-blue-50 flex shrink-0 items-center justify-center border border-blue-200">
                           <IndianRupee className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Earnings</p>
                     </div>
                     <p className="text-2xl font-black text-gray-900 leading-none mt-2">₹{(selectedEmp.grossEarnings || 0).toLocaleString('en-IN')}</p>
                     <p className="text-[9px] font-bold text-blue-500/70 uppercase">Lifetime Commission</p>
                  </div>

                  {/* Withdrawable Amount */}
                  <div className="bg-white p-4 rounded-none shadow-sm border border-[#3AB000] flex flex-col gap-2 transition-all hover:shadow-md">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-none bg-green-50 flex shrink-0 items-center justify-center border border-green-200">
                           <Landmark className="w-4 h-4 text-[#3AB000]" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Withdrawable</p>
                     </div>
                     <p className="text-2xl font-black text-[#3AB000] leading-none mt-2">₹{(selectedEmp.salaryWallet || 0).toLocaleString('en-IN')}</p>
                     <p className="text-[9px] font-bold text-[#3AB000]/70 uppercase">Current Unpaid Wallet</p>
                  </div>

                  {/* Current Month Salary */}
                  <div className="bg-white p-4 rounded-none shadow-sm border border-amber-400 flex flex-col gap-2 transition-all hover:shadow-md">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-none bg-amber-50 flex shrink-0 items-center justify-center border border-amber-200">
                           <CreditCard className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Month</p>
                     </div>
                     <p className="text-2xl font-black text-gray-900 leading-none mt-2">₹{(selectedEmp.grossMonthEarnings || 0).toLocaleString('en-IN')}</p>
                     <p className="text-[9px] font-bold text-amber-500/70 uppercase">This Month Commission</p>
                  </div>
                </div>

                <div className="p-4 bg-white border-t border-gray-200 flex justify-end shrink-0">
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-2.5 bg-gray-100 border border-gray-200 text-xs font-black text-gray-600 uppercase tracking-widest rounded-none hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      }

    </DashboardLayout>
  );
}
