import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { createPaperAPI } from "../../utils/api";
import { UserPlus, Search, ShieldAlert, ChevronDown, Check, X, RefreshCw, Filter } from "lucide-react";
import { jobPostingsAPI } from "../../utils/api";

// Same UI constants as ReExam
const StatusBadge = ({ status }) => {
  if (status === "Unassigned")
    return (
      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
        Unassigned
      </span>
    );
  return (
    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
      {status}
    </span>
  );
};

const TableSkeleton = () => (
  <tbody>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="animate-pulse border-b border-gray-100">
        <td className="p-4">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
        </td>
        <td className="p-4">
          <div className="w-8 h-4 bg-gray-200 rounded mx-auto"></div>
        </td>
        <td className="p-4 space-y-2">
          <div className="w-32 h-4 bg-gray-200 rounded"></div>
          <div className="w-48 h-3 bg-gray-200 rounded"></div>
          <div className="w-24 h-3 bg-gray-200 rounded"></div>
        </td>
        <td className="p-4 text-center">
          <div className="w-24 h-4 bg-gray-200 rounded mx-auto"></div>
        </td>
        <td className="p-4 text-center">
          <div className="w-20 h-4 bg-gray-200 rounded mx-auto"></div>
        </td>
      </tr>
    ))}
  </tbody>
);

const Unassigned = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 10 });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSearchQuery, setTempSearchQuery] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [tempAppliedFrom, setTempAppliedFrom] = useState("");
  const [tempAppliedTo, setTempAppliedTo] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectionMode, setSelectionMode] = useState("manual"); // "manual" or "all-paid"
  const [deselectedIds, setDeselectedIds] = useState(new Set());
  
  // Job Posting Filter states
  const [postings, setPostings] = useState([]);
  const [selectedPostingId, setSelectedPostingId] = useState("");
  const [selectedPostingTitle, setSelectedPostingTitle] = useState("");
  const [tempSelectedPostingId, setTempSelectedPostingId] = useState("");
  const [tempSelectedPostingTitle, setTempSelectedPostingTitle] = useState("");
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
  const [titleSearch, setTitleSearch] = useState("");
  const titleDropdownRef = useRef(null);

  // Fetch job postings on mount
  useEffect(() => {
    const fetchPostings = async () => {
      try {
        const res = await jobPostingsAPI.getAll();
        if (res.success) {
          setPostings(res.data.postings || []);
        }
      } catch (err) {
        console.error("Failed to fetch job postings:", err);
      }
    };
    fetchPostings();
  }, []);

  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (titleDropdownRef.current && !titleDropdownRef.current.contains(e.target)) {
        setIsTitleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const titleOptions = useMemo(() => {
    // Prioritize the full descriptive title including Advt No and Bilingual text
    return postings.map((p) => {
      return p.title || (typeof p.post === "object" ? p.post.en : p.post) || p.advtNo;
    });
  }, [postings]);

  const isVacancyOpen = (lastDate) => {
    if (!lastDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lDate = new Date(lastDate);
    lDate.setHours(0, 0, 0, 0);
    return today <= lDate;
  };

  const filteredTitles = useMemo(() => {
    const q = titleSearch.toLowerCase().trim();
    return titleOptions
      .filter((opt) => opt.toLowerCase().includes(q))
      .sort((a, b) => {
        const score = (title) => {
          const posting = postings.find((p) => {
            const en = typeof p.post === "object" ? p.post.en : p.post;
            return en === title || p.title === title || p.advtNo === title;
          });
          return posting
            ? posting.status !== "Inactive" && isVacancyOpen(posting.lastDate)
              ? 1
              : 0
            : 1;
        };
        return score(b) - score(a);
      });
  }, [titleOptions, titleSearch, postings]);

  const loadUnassigned = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await createPaperAPI.getGlobalUnassigned({
        page,
        limit: 10,
        search: searchQuery,
        appliedFrom,
        appliedTo,
        jobPostingId: selectedPostingId
      });
      if (res.success) {
        setStudents(
          (res.data.students || []).map((s) => ({
            ...s,
            status: "Unassigned",
          }))
        );
        setPagination(res.data.pagination);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadUnassigned(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, appliedFrom, appliedTo, selectedPostingId]);

  const toggleSelectAll = () => {
    // Standard Select All only selects current page items in manual mode
    if (selectedStudentIds.length === students.length && students.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s._id));
      setSelectionMode("manual");
    }
  };

  const toggleStudentSelection = (id) => {
    if (selectionMode === "all-paid") {
      setDeselectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      return;
    }
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selectAllPaidAcrossPages = () => {
    if (selectionMode === "all-paid") {
      setSelectionMode("manual");
      setDeselectedIds(new Set());
      setSelectedStudentIds([]);
    } else {
      setSelectionMode("all-paid");
      setDeselectedIds(new Set());
      setSelectedStudentIds([]);
    }
  };

  const isStudentSelected = (id) => {
    if (selectionMode === "all-paid") {
      return !deselectedIds.has(id);
    }
    return selectedStudentIds.includes(id);
  };

  const selectionCount = useMemo(() => {
    if (selectionMode === "all-paid") {
      return Math.max(0, (pagination?.total || 0) - deselectedIds.size);
    }
    return selectedStudentIds.length;
  }, [selectionMode, deselectedIds, selectedStudentIds, pagination]);

  const handlePlanAssignment = async () => {
    if (selectionCount === 0) {
      alert("Please select at least one candidate to assign.");
      return;
    }
    setIsActionLoading(true);
    try {
      let finalIds = [...selectedStudentIds];

      if (selectionMode === "all-paid") {
        // Fetch ALL IDs based on filters
        const res = await createPaperAPI.getGlobalUnassigned({
          limit: 0, // Get all
          search: searchQuery,
          appliedFrom,
          appliedTo,
          jobPostingId: selectedPostingId,
        });

        if (res.success) {
          finalIds = (res.data.students || [])
            .map((s) => s._id)
            .filter((id) => !deselectedIds.has(id));
        } else {
          throw new Error("Failed to fetch complete list of students.");
        }
      }

      navigate("/create-paper", {
        state: {
          reExamData: {
            title: `New Assignment Event`,
            assignedStudents: finalIds,
            status: "draft",
          },
        },
      });
    } catch (err) {
      alert(err.message || "Failed to plan assignment.");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white ml-0 p-0 md:ml-6 px-2 md:px-0 pb-10">
        <div className="pt-4 md:pt-6">
          {/* Top Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              {/* Left side (Title) */}
              <h1 className="text-base sm:text-lg font-bold text-gray-800 hidden lg:block">
                Unassigned Candidates
              </h1>

              {/* Right side (Tabs / Filter) */}
              {/* <div className="flex justify-end w-full sm:w-auto">
                <div className="gap-0 border border-gray-300 rounded overflow-hidden flex w-full sm:w-auto">
                  <button className="flex-1 sm:flex-none px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap bg-[#3AB000] text-white">
                    Global Unassigned
                  </button>
                </div>
              </div> */}
            </div>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 w-full">
              {/* Search */}
              <div className="flex items-center border border-gray-300 rounded overflow-hidden h-10 flex-1 w-full sm:max-w-[400px]">
                <input
                  type="text"
                  placeholder="Search students..."
                  className="flex-1 px-3 sm:px-4 text-xs sm:text-sm text-gray-700 focus:outline-none h-full bg-white"
                  value={tempSearchQuery}
                  onChange={(e) => setTempSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(tempSearchQuery)}
                />
                <button 
                  onClick={() => setSearchQuery(tempSearchQuery)}
                  className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs sm:text-sm px-4 h-full font-medium transition-colors whitespace-nowrap"
                >
                  Search
                </button>
              </div>
            </div>

            <button
              onClick={handlePlanAssignment}
              disabled={isActionLoading || selectionCount === 0}
              className="bg-black hover:bg-[#3AB000] disabled:opacity-50 text-white text-xs sm:text-sm font-medium px-4 sm:px-6 py-2.5 rounded-sm transition-colors whitespace-nowrap w-full sm:w-auto flex items-center justify-center gap-1.5"
            >
              {isActionLoading ? (
                <RefreshCw size={14} className="animate-spin text-[#3AB000]" />
              ) : (
                <UserPlus size={14} />
              )}
              {isActionLoading ? "Assigning..." : `Assign Selected (${selectionCount})`}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-4 items-end">
            <div className="lg:col-span-2 relative" ref={titleDropdownRef}>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Filter by Post / Event Title
              </label>
              <div
                onClick={() => setIsTitleDropdownOpen(!isTitleDropdownOpen)}
                className={`w-full px-3 py-2.5 border border-gray-300 rounded text-sm bg-white flex items-center justify-between cursor-pointer transition-all ${isTitleDropdownOpen ? "ring-2 ring-[#3AB000] border-[#3AB000]" : ""}`}
              >
                <div className="flex flex-col truncate flex-1 leading-tight">
                  <span className={`truncate text-xs font-bold text-gray-400 uppercase tracking-tighter`}>
                    Selected Post Plan
                  </span>
                  <span className={`truncate ${!tempSelectedPostingTitle ? "text-gray-400" : "text-[#2d8a00] font-black"}`}>
                    {tempSelectedPostingTitle || "Select Job Posting to filter"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {tempSelectedPostingTitle && (
                    <X 
                      size={14} 
                      className="text-gray-400 hover:text-red-500" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempSelectedPostingId("");
                        setTempSelectedPostingTitle("");
                      }} 
                    />
                  )}
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${isTitleDropdownOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </div>

              {isTitleDropdownOpen && (
                <div className="absolute top-full left-0 right-0 z-[100] mt-1 bg-white border border-gray-200 rounded shadow-xl flex flex-col max-h-72 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 border-b border-gray-100 bg-gray-50">
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        autoFocus
                        value={titleSearch}
                        onChange={(e) => setTitleSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Search titles..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-[#3AB000] outline-none"
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1 custom-scrollbar">
                    <div
                      onClick={() => {
                        setTempSelectedPostingId("");
                        setTempSelectedPostingTitle("");
                        setIsTitleDropdownOpen(false);
                        setTitleSearch("");
                      }}
                      className={`px-4 py-3 text-sm cursor-pointer hover:bg-[#e8f5e2] transition-colors border-b border-gray-50 flex items-center justify-between (!tempSelectedPostingId ? "bg-[#e8f5e2] text-[#3AB000] font-semibold" : "text-gray-700")`}
                    >
                      <span className="font-medium">All Posts</span>
                      {!tempSelectedPostingId && <Check size={14} className="text-[#3AB000]" />}
                    </div>
                    {filteredTitles.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-gray-400 text-center">
                        No positions found.
                      </div>
                    ) : (
                      filteredTitles.map((opt) => {
                        const posting = postings.find((p) => {
                          const en = typeof p.post === "object" ? p.post.en : p.post;
                          return en === opt || p.title === opt || p.advtNo === opt;
                        });
                        const isActive = posting
                          ? posting.status !== "Inactive" && isVacancyOpen(posting.lastDate)
                          : true;
                        
                        const isSelected = tempSelectedPostingId === posting?._id;

                        return (
                          <div
                            key={opt}
                            onClick={(e) => {
                              e.stopPropagation();
                              setTempSelectedPostingId(posting?._id || "");
                              setTempSelectedPostingTitle(opt);
                              setIsTitleDropdownOpen(false);
                              setTitleSearch("");
                            }}
                            className={`px-4 py-3 text-sm cursor-pointer hover:bg-[#e8f5e2] transition-colors flex items-center justify-between gap-3 ${isSelected ? "bg-[#e8f5e2] text-[#3AB000] font-semibold" : "text-gray-700 font-medium"}`}
                          >
                            <span className="truncate flex-1">{opt}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${isActive ? "bg-green-100 text-[#3AB000]" : "bg-red-100 text-red-500"}`}
                              >
                                {isActive ? "Active" : "Inactive"}
                              </span>
                              {isSelected && <Check size={14} className="text-[#3AB000]" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Applied From
              </label>
              <input
                type="date"
                value={tempAppliedFrom}
                onChange={(e) => setTempAppliedFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Applied To
              </label>
              <input
                type="date"
                value={tempAppliedTo}
                onChange={(e) => setTempAppliedTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all"
              />
            </div>
            <div className="flex items-end h-full">
              <button
                onClick={() => {
                  setAppliedFrom(tempAppliedFrom);
                  setAppliedTo(tempAppliedTo);
                  setSelectedPostingId(tempSelectedPostingId);
                  setSelectedPostingTitle(tempSelectedPostingTitle);
                  setSearchQuery(tempSearchQuery);
                }}
                className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs font-black uppercase tracking-widest px-6 h-10 rounded-sm transition-all shadow-sm flex items-center justify-center gap-2 w-full lg:w-auto"
              >
                <Filter size={14} /> Apply Filter
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Quick Action
              </label>
              <button
                onClick={selectAllPaidAcrossPages}
                className={`w-full px-3 py-2 border rounded text-xs font-bold uppercase tracking-wider transition-all h-[38px] ${selectionMode === "all-paid" ? "bg-[#3AB000] text-white border-[#3AB000]" : "bg-white text-gray-700 border-gray-300 hover:border-[#3AB000] hover:text-[#3AB000]"}`}
              >
                {selectionMode === "all-paid" ? (
                  <span className="flex items-center justify-center gap-2">
                    <Check size={14} /> All Paid Selected
                  </span>
                ) : (
                  "Select All Paid"
                )}
              </button>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-[#3AB000]">
                    <th className="px-4 py-3 text-center font-bold text-black text-sm w-12">
                      {/* Global checkbox removed as per request. Row checkboxes remain. */}
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                      S.N
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-black text-sm whitespace-nowrap">
                      Candidate Details
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                      Applied Date
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                      Status
                    </th>
                  </tr>
                </thead>

                {isLoading ? (
                  <TableSkeleton />
                ) : students.length === 0 ? (
                  <tbody>
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                        No unassigned candidates found.
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody>
                    {students.map((student, idx) => (
                      <tr
                        key={student._id}
                        className="border-b border-gray-100 hover:bg-[#e8f5e2] transition-colors"
                      >
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isStudentSelected(student._id)}
                            onChange={() => toggleStudentSelection(student._id)}
                            className="w-4 h-4 rounded border-gray-300 accent-[#3AB000]"
                          />
                        </td>
                        <td className="px-4 py-4 text-center text-gray-700">
                          {(currentPage - 1) * pagination.limit + idx + 1}
                        </td>
                        <td className="px-4 py-4 text-left">
                          <p className="text-sm font-semibold text-[#2d8a00]">
                            {student.candidateName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {student.applicationNumber} · {student.district}
                          </p>
                          <p className="text-xs text-gray-400">
                            {student.mobile} · {student.email}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center text-gray-600 font-medium">
                          {student.createdAt ? new Date(student.createdAt).toLocaleDateString("en-GB") : "-"}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <StatusBadge status={student.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded border border-gray-200 p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              ))
            ) : students.length === 0 ? (
              <div className="bg-white rounded border border-gray-200 p-8 text-center text-gray-400 text-sm">
                No unassigned candidates found.
              </div>
            ) : (
              students.map((student, idx) => (
                <div key={student._id} className="bg-white rounded border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={isStudentSelected(student._id)}
                        onChange={() => toggleStudentSelection(student._id)}
                        className="w-4 h-4 rounded border-gray-300 accent-[#3AB000] flex-shrink-0"
                      />
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">
                          S.N: {(currentPage - 1) * pagination.limit + idx + 1}
                        </div>
                        <div className="text-sm font-semibold text-[#2d8a00]">
                          {student.candidateName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {student.applicationNumber} · {student.district}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Applied: {student.createdAt ? new Date(student.createdAt).toLocaleDateString("en-GB") : "-"}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={student.status} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {!isLoading && pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between sm:justify-end items-center gap-3 mt-6">
              <div className="text-xs text-gray-500 sm:hidden">
                Showing {(currentPage - 1) * pagination.limit + 1}–
                {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center">
                <button
                  onClick={() => loadUnassigned(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className="bg-[#3AB000] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:bg-[#2d8a00] transition-colors rounded-sm flex-1 sm:flex-none"
                >
                  Back
                </button>
                <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
                  {(() => {
                    const pages = [];
                    const visible = new Set([
                      1, 2, pagination.pages - 1, pagination.pages,
                      currentPage - 1, currentPage, currentPage + 1
                    ]);
                    for (let i = 1; i <= pagination.pages; i++) {
                      if (visible.has(i)) pages.push(i);
                      else if (pages[pages.length - 1] !== "...") pages.push("...");
                    }
                    return pages.map((page, i) =>
                      page === "..." ? (
                        <span key={i} className="px-1 text-gray-500 select-none">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => loadUnassigned(page)}
                          className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors ${currentPage === page ? "text-[#3AB000] font-bold" : "text-gray-600 hover:text-[#3AB000]"
                            }`}
                        >
                          {page}
                        </button>
                      )
                    );
                  })()}
                </div>
                <div className="sm:hidden text-sm font-medium text-gray-700 px-2">
                  {currentPage}
                </div>
                <button
                  onClick={() => loadUnassigned(currentPage + 1)}
                  disabled={currentPage === pagination.pages || isLoading}
                  className="bg-[#3AB000] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:bg-[#2d8a00] transition-colors rounded-sm flex-1 sm:flex-none"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Unassigned;
