import React, { useMemo, useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { api } from "../../utils/api";
import {
  Download,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  X,
  Mail,
  Phone,
  TrendingUp,
  Briefcase,
  Users,
} from "lucide-react";

export default function TestHistory() {
  const [history, setHistory] = useState([]);
  const [allExams, setAllExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [historyRes, examsRes] = await Promise.all([
          api.testResults.getAll(),
          api.createPaper.getAll({ minimal: "true" })
        ]);

        // Handle History
        if (Array.isArray(historyRes)) {
          setHistory(historyRes);
        } else if (historyRes.message === "exam not done yet") {
          setHistory([]);
        }

        // Handle All Exams
        if (examsRes.success) {
          setAllExams(examsRes.data.tests || []);
        }

        setErrorMsg("");
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setErrorMsg("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  console.log('allExams', allExams)
  const uniqueJobs = useMemo(() => {
    // Each exam record from the DB is its own row
    const publishedExams = allExams.filter(exam => exam.status !== "draft");

    const jobList = publishedExams.map(exam => {
      const examId = exam._id || exam.id;
      // Find history records matching this exam
      const relevantHistory = history.filter(h => 
        (h.testId === examId) || 
        (h.testTitle === exam.title && h.totalMarks === exam.totalMarks)
      );

      return {
        id: examId,
        title: exam.title,
        type: exam.type || "General",
        difficulty: exam.difficulty || "Mixed",
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        count: (exam.attempts || 0) || relevantHistory.length,
        endDate: exam.endDate, // Added this field as requested
        status: exam.status === "published" ? "Active" : "Draft"
      };
    });

    // Add any orphans from history that don't match any exam in allExams
    const matchedHistoryIds = new Set();
    allExams.forEach(exam => {
      history.forEach(h => {
        if (h.testId === (exam._id || exam.id) || (h.testTitle === exam.title && h.totalMarks === exam.totalMarks)) {
          matchedHistoryIds.add(h.id || h._id);
        }
      });
    });

    const orphanJobs = {};
    history.forEach(h => {
      if (!matchedHistoryIds.has(h.id || h._id)) {
        if (!orphanJobs[h.testTitle]) {
          orphanJobs[h.testTitle] = {
            id: h.testId || h.testTitle,
            title: h.testTitle,
            type: h.type || "General",
            difficulty: h.difficulty || "Mixed",
            duration: h.duration,
            totalMarks: h.totalMarks,
            count: 0,
            endDate: null,
            status: "Active"
          };
        }
        orphanJobs[h.testTitle].count++;
      }
    });

    return [...jobList, ...Object.values(orphanJobs)];
  }, [history, allExams]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "completedAt",
    direction: "desc",
  });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 7;

  const filtered = useMemo(() => {
    let d = [...history];
    if (selectedJob) {
      d = d.filter((h) => 
        (h.testId === selectedJob.id) || 
        (h.testTitle === selectedJob.title && h.totalMarks === selectedJob.totalMarks)
      );
    }
    if (searchQuery)
      d = d.filter((h) =>
        [h.student, h.email, h.mobile, h.applicationNumber, h.testTitle]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      );
    if (filterStatus !== "all")
      d = d.filter(
        (h) => String(h.status || "").toLowerCase() === filterStatus,
      );
    d.sort((a, b) => {
      const av = a[sortConfig.key],
        bv = b[sortConfig.key];
      if (typeof av === "number")
        return sortConfig.direction === "asc" ? av - bv : bv - av;
      return sortConfig.direction === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return d;
  }, [history, searchQuery, filterStatus, sortConfig, selectedJob]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const passed = filtered.filter((h) => h.status === "pass").length;
    const avgPct = total
      ? Math.round(filtered.reduce((s, h) => s + h.pct, 0) / total)
      : 0;
    return { total, passed, failed: total - passed, avgPct };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleSort = (key) => {
    setSortConfig((p) => ({
      key,
      direction: p.key === key && p.direction === "desc" ? "asc" : "desc",
    }));
    setPage(1);
  };

  const SI = ({ col }) =>
    sortConfig.key !== col ? (
      <ChevronDown className="w-3 h-3 opacity-30 inline ml-1" />
    ) : sortConfig.direction === "asc" ? (
      <ChevronUp className="w-3 h-3 text-black inline ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 text-black inline ml-1" />
    );

  const handleExport = () => {
    const rows = [
      [
        "Student",
        "Application No",
        "Mobile",
        "Email",
        "Test",
        "Score",
        "Total",
        "%",
        "Status",
        "Date",
      ],
      ...filtered.map((h) => [
        h.student,
        h.applicationNumber,
        h.mobile,
        h.email,
        h.testTitle,
        h.score,
        h.totalMarks,
        h.pct,
        h.status === "pass" ? "Pass" : "Fail",
        h.completedAt,
      ]),
    ];
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(
        new Blob([rows.map((r) => r.join(",")).join("\n")], {
          type: "text/csv",
        }),
      ),
      download: `test-history-${new Date().toISOString().split("T")[0]}.csv`,
    });
    a.click();
  };

  // ── Pagination pages helper ──
  const paginationPages = () => {
    const pages = [];
    const vis = new Set([
      1,
      2,
      totalPages - 1,
      totalPages,
      safePage - 1,
      safePage,
      safePage + 1,
    ]);
    for (let i = 1; i <= totalPages; i++) {
      if (vis.has(i)) pages.push(i);
      else if (pages[pages.length - 1] !== "...") pages.push("...");
    }
    return pages;
  };

  // ── Skeleton rows ──
  const TableSkeleton = () => (
    <tbody>
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-gray-100">
          {Array.from({ length: 7 }).map((__, j) => (
            <td key={j} className="px-4 py-4 text-center">
              <div className="bg-gray-200 rounded mx-auto h-4 w-4/5" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );

  return (
    <DashboardLayout>
      <div className="p-0 ml-0 md:ml-6 px-2 md:px-0">
        {/* ── Exam List View ── */}
        {!selectedJob ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-gray-800">Exam Results</h2>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                {
                  label: "Total Exams",
                  value: uniqueJobs.length,
                  color: "text-[#3AB000]",
                },
                {
                  label: "Total Attempts",
                  value: history.length,
                  color: "text-[#3AB000]",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="bg-gray-50 rounded border border-gray-100 p-3"
                >
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`text-2xl font-medium ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Exam Cards Table */}
            <div className="bg-white rounded overflow-hidden border border-gray-200">
              {loading ? (
                <div className="py-16 text-center">
                  <div className="w-8 h-8 border-4 border-[#3AB000] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Loading exams…</p>
                </div>
              ) : uniqueJobs.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                  {errorMsg || "No exam attempts found."}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {uniqueJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => {
                        setSelectedJob(job);
                        setPage(1);
                      }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-4 hover:bg-[#e8f5e2] transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-9 h-9 rounded bg-[#3AB000]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Briefcase className="w-4 h-4 text-[#3AB000]" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm leading-snug">
                            {job.title}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                            <span>
                              Type:{" "}
                              <span className="font-medium text-gray-700">
                                {job.type || "—"}
                              </span>
                            </span>
                            <span>
                              Difficulty:{" "}
                              <span className="font-medium text-gray-700">
                                {job.difficulty || "—"}
                              </span>
                            </span>
                            <span>
                              Max Marks:{" "}
                              <span className="font-medium text-gray-700">
                                {job.totalMarks}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:flex-shrink-0 pl-12 sm:pl-0">
                        <div className="text-xs text-gray-500">
                          Expiry:{" "}
                          <span className="font-medium text-gray-700">
                            {job.endDate ? (
                              new Date(job.endDate).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            ) : (
                              <span className="text-gray-400">No Limit</span>
                            )}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-[#3AB000] bg-[#3AB000]/10 px-2 py-1 rounded">
                          Active
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* ── Student Results View ── */
          <>
            {/* ── Top Bar ── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 w-full">
                {/* Back + Tabs */}
                <div className="flex items-center gap-0 border border-gray-300 rounded overflow-hidden flex-shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setSelectedJob(null);
                      setSearchQuery("");
                      setFilterStatus("all");
                    }}
                    className="flex items-center gap-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-white text-gray-600 border-r border-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    <X className="w-3.5 h-3.5" /> Back
                  </button>
                  {["all", "pass", "fail"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setFilterStatus(tab);
                        setPage(1);
                      }}
                      className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium border-r border-gray-300 last:border-r-0 transition-colors whitespace-nowrap ${filterStatus === tab
                        ? "bg-[#3AB000] text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="flex items-center border border-gray-300 rounded overflow-hidden h-10 flex-1 w-full sm:max-w-[460px]">
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, app no..."
                    className="flex-1 px-3 sm:px-4 text-xs sm:text-sm text-gray-700 focus:outline-none h-full bg-white"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                  <button className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs sm:text-sm px-4 sm:px-6 h-full font-medium transition-colors whitespace-nowrap">
                    Search
                  </button>
                </div>
              </div>

              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-black hover:bg-[#3AB000] text-white text-xs sm:text-sm font-medium px-4 sm:px-6 py-2.5 rounded-sm transition-colors whitespace-nowrap w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            {/* Exam Title */}
            <p className="text-sm font-semibold text-gray-700 mb-3 truncate">
              {selectedJob.title}
            </p>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                {
                  label: "Total Candidates",
                  value: stats.total,
                  color: "text-[#3AB000]",
                },
                {
                  label: "Passed",
                  value: stats.passed,
                  color: "text-[#3AB000]",
                },
                { label: "Failed", value: stats.failed, color: "text-red-600" },
                {
                  label: "Avg Score",
                  value: `${stats.avgPct}%`,
                  color: "text-yellow-600",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="bg-gray-50 rounded border border-gray-100 p-3"
                >
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`text-2xl font-medium ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* ── Desktop Table ── */}
            <div className="hidden md:block bg-white rounded overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="bg-[#3AB000]">
                      {[
                        { label: "S.N", key: null },
                        { label: "Candidate", key: "student" },
                        { label: "Application No", key: "applicationNumber" },
                        { label: "Contact", key: "mobile" },
                        { label: "Score", key: "score" },
                        { label: "Percentage", key: "pct" },
                        { label: "Status", key: "status" },
                        { label: "Date", key: "completedAt" },
                      ].map(({ label, key }) => (
                        <th
                          key={label}
                          onClick={() => key && handleSort(key)}
                          className={`px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap ${key ? "cursor-pointer hover:bg-[#2d8a00] transition-colors" : ""}`}
                        >
                          {label}
                          {key && <SI col={key} />}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {loading ? (
                    <TableSkeleton />
                  ) : paginated.length === 0 ? (
                    <tbody>
                      <tr>
                        <td
                          colSpan="8"
                          className="text-center py-12 text-gray-400 text-sm"
                        >
                          No candidates found.
                        </td>
                      </tr>
                    </tbody>
                  ) : (
                    <tbody>
                      {paginated.map((h, idx) => (
                        <tr
                          key={h.id}
                          className="border-b border-gray-100 hover:bg-[#e8f5e2] transition-colors"
                        >
                          <td className="px-4 py-4 text-center text-gray-500">
                            {(safePage - 1) * PAGE_SIZE + idx + 1}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <p className="font-semibold text-gray-800 whitespace-nowrap">
                              {h.student}
                            </p>
                            {h.district && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {h.district}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center text-[#2d8a00] font-semibold whitespace-nowrap font-mono text-xs">
                            {h.applicationNumber}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <p className="text-xs text-gray-700 flex items-center justify-center gap-1 whitespace-nowrap">
                              <Phone className="w-3 h-3 text-[#3AB000]" />{" "}
                              {h.mobile}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mt-0.5 whitespace-nowrap">
                              <Mail className="w-3 h-3" /> {h.email}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-center font-semibold text-gray-800 whitespace-nowrap">
                            {h.score}
                            <span className="text-xs text-gray-400 font-normal">
                              {" "}
                              / {h.totalMarks}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-20 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${h.pct >= 40 ? "bg-[#3AB000]" : "bg-red-500"}`}
                                  style={{ width: `${h.pct}%` }}
                                />
                              </div>
                              <span
                                className={`text-xs font-semibold ${h.pct >= 80 ? "text-[#3AB000]" : h.pct >= 60 ? "text-blue-600" : h.pct >= 40 ? "text-yellow-600" : "text-red-500"}`}
                              >
                                {h.pct}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${h.status === "pass"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                                }`}
                            >
                              {h.status === "pass" ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {h.status === "pass" ? "Pass" : "Fail"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-gray-500 text-xs whitespace-nowrap">
                            {new Date(h.completedAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  )}
                </table>
              </div>
            </div>

            {/* ── Mobile Card View ── */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded border border-gray-200 p-4 animate-pulse"
                    >
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : paginated.length === 0 ? (
                <div className="bg-white rounded border border-gray-200 p-8 text-center text-gray-400 text-sm">
                  No candidates found.
                </div>
              ) : (
                paginated.map((h, idx) => (
                  <div
                    key={h.id}
                    className="bg-white rounded border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">
                          S.N: {(safePage - 1) * PAGE_SIZE + idx + 1}
                        </div>
                        <div className="text-sm font-semibold text-[#2d8a00] mb-1 font-mono">
                          {h.applicationNumber}
                        </div>
                        <div className="text-base font-medium text-gray-800">
                          {h.student}
                        </div>
                        {h.district && (
                          <div className="text-xs text-gray-400">
                            {h.district}
                          </div>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${h.status === "pass"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                          }`}
                      >
                        {h.status === "pass" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {h.status === "pass" ? "Pass" : "Fail"}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                      {[
                        ["Mobile", h.mobile],
                        ["Email", h.email],
                        ["Score", `${h.score} / ${h.totalMarks}`],
                        ["Percent", `${h.pct}%`],
                        [
                          "Date",
                          new Date(h.completedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }),
                        ],
                      ].map(([label, val]) => (
                        <div key={label} className="flex items-start">
                          <span className="font-medium w-20 flex-shrink-0">
                            {label}:
                          </span>
                          <span className="flex-1">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Pagination ── */}
            {!loading && filtered.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between sm:justify-end items-center gap-3 sm:gap-4 mt-6">
                <div className="text-xs sm:text-sm text-gray-600 sm:hidden">
                  Page {safePage} of {totalPages}
                </div>
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={safePage === 1}
                    className="bg-[#3AB000] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:bg-[#2d8a00] transition-colors rounded-sm flex-1 sm:flex-none"
                  >
                    Back
                  </button>

                  <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
                    {paginationPages().map((p, i) =>
                      p === "..." ? (
                        <span
                          key={i}
                          className="px-1 text-gray-500 select-none"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors ${safePage === p
                            ? "text-[#3AB000] font-bold"
                            : "text-gray-600 hover:text-[#3AB000]"
                            }`}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  </div>

                  <div className="sm:hidden text-sm font-medium text-gray-700 px-2">
                    {safePage}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={safePage === totalPages}
                    className="bg-[#3AB000] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:bg-[#2d8a00] transition-colors rounded-sm flex-1 sm:flex-none"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
