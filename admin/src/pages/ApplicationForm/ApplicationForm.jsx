import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Eye, ArrowLeft, Briefcase, Users, Loader2, Pencil, ChevronDown } from "lucide-react";
import logo from "../../assets/img0.png";
import { useNavigate } from "react-router-dom";
import { applicationsAPI, jobPostingsAPI } from "../../utils/api";
import { useAuth } from "../../auth/AuthProvider";

const ApplicationForm = () => {
  const { role } = useAuth();
  // Applicant view uses the landing-site blue theme; admin view stays as before.
  // Landing-site blue theme: applicant + admin/superadmin (other roles stay green)
  const isBlueTheme = ["applicant", "admin", "superadmin"].includes(role);
  const isApplicantView = role === "applicant";
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const itemsPerPage = 7;

  const [applications, setApplications] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [jobPostings, setJobPostings] = useState([]);
  const [selectedJobPostingId, setSelectedJobPostingId] = useState(null);
  const [selectedJobPosting, setSelectedJobPosting] = useState(null);
  const [jobPostingsLoading, setJobPostingsLoading] = useState(true);
  const [paymentDrafts, setPaymentDrafts] = useState({});
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const extractJobTitle = (posting) => {
    if (!posting) return null;
    if (typeof posting === "string") return null;
    if (posting.post) {
      if (typeof posting.post === "object") {
        return posting.post.en || posting.post.hi || null;
      }
      return posting.post;
    }
    if (posting.title) return posting.title;
    return null;
  };

  const formatPaymentStatus = (status) => {
    if (!status) return "N/A";
    const normalized = String(status).toLowerCase();
    if (normalized === "paid" || normalized === "success") return "Paid";
    if (normalized === "pending") return "Pending";
    if (normalized === "failed") return "Failed";
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const normalizePaymentStatus = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "success") return "paid";
    return normalized || "pending";
  };

  // Fetch job postings (only for admin)
  const fetchJobPostings = async () => {
    setJobPostingsLoading(true);
    try {
      const response = await jobPostingsAPI.getAll({
        limit: 0,
        includeCounts: role === "admin" ? "true" : "false",
      });
      if (response.success && response.data) {
        const postings = response.data.postings.map((post) => ({
          id: post._id || post.id,
          advtNo: post.advtNo || "N/A",
          post: typeof post.post === "object" ? post.post.en : post.post,
          postHi: typeof post.post === "object" ? post.post.hi : post.post,
          location:
            typeof post.location === "object"
              ? post.location.en
              : post.location,
          status: post.status,
          lastDate: post.lastDate,
          createdAt: post.createdAt,
          applicationCount: post.applicationCount || 0,
        }));

        const sorted = postings.sort((a, b) => {
          const aOpen = isVacancyOpen(a.lastDate) && a.status !== "Inactive";
          const bOpen = isVacancyOpen(b.lastDate) && b.status !== "Inactive";

          if (aOpen && !bOpen) return -1;
          if (!aOpen && bOpen) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setJobPostings(sorted);
      }
    } catch (err) {
      console.error("Fetch job postings error:", err);
    } finally {
      setJobPostingsLoading(false);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchApplications = async (jobId = null) => {
    const isInitialLoad = !applications.length || jobId !== null;
    if (isInitialLoad) setLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: debouncedSearchQuery ? 100 : itemsPerPage,
        search: debouncedSearchQuery,
        paymentStatus: paymentStatusFilter,
        startDate: fromDate || undefined,
        endDate: toDate || undefined,
      };

      const effectiveJobId = jobId || selectedJobPostingId;
      if (effectiveJobId) {
        params.jobPostingId = effectiveJobId;
      }

      const response = await applicationsAPI.getAll(params);
      if (response.success && response.data) {
        const transformed = response.data.applications.map((app) => {
          const posting =
            app.jobPostingId && typeof app.jobPostingId === "object"
              ? app.jobPostingId
              : null;
          const postingTitle = extractJobTitle(posting);
          const postingId =
            posting?._id ||
            (typeof app.jobPostingId === "string" ? app.jobPostingId : null);

          return {
            id: app._id,
            photo: app.photo,
            candidateName: app.candidateName,
            mobile: app.mobile,
            email: app.email,
            status: app.status,
            paymentStatus: app.paymentStatus || null,
            applicationNumber: app.applicationNumber,
            jobTitle: app.jobTitle || postingTitle || null,
            jobPostingId: postingId,
            createdAt: app.createdAt,
          };
        });

        setApplications(transformed);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalItems(response.data.pagination?.total || 0);

        setPaymentDrafts(
          transformed.reduce((acc, app) => {
            acc[app.id] = normalizePaymentStatus(app.paymentStatus);
            return acc;
          }, {}),
        );
      }
    } catch (err) {
      setError(err.message || "Failed to fetch applications");
      console.error("Fetch applications error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobPostings();
  }, [role]);

  const getJobTitleForApplication = (app) => {
    if (app.jobTitle) return app.jobTitle;
    if (app.jobPostingId) {
      const matchedPosting = jobPostings.find(
        (job) => job.id === app.jobPostingId,
      );
      if (matchedPosting?.post) return matchedPosting.post;
    }
    return selectedJobPosting?.post?.en || selectedJobPosting?.post || "N/A";
  };

  useEffect(() => {
    if (selectedJobPostingId) {
      jobPostingsAPI.getById(selectedJobPostingId).then((response) => {
        if (response.success && response.data) {
          setSelectedJobPosting(response.data.posting);
        }
      });
    }
    fetchApplications();
  }, [
    selectedJobPostingId,
    role,
    currentPage,
    debouncedSearchQuery,
    paymentStatusFilter,
    fromDate,
    toDate,
  ]);

  // Pagination
  const indexOfFirst = (currentPage - 1) * itemsPerPage;

  // Skeleton Loader
  const TableSkeleton = () => (
    <tbody>
      {Array.from({ length: itemsPerPage }).map((_, idx) => (
        <tr key={idx} className="animate-pulse border-b border-gray-100">
          {Array.from({ length: 8 }).map((__, j) => (
            <td key={j} className="px-4 py-4 text-center">
              <div
                className={`bg-gray-200 rounded mx-auto ${
                  j === 1 ? "h-9 w-9 rounded-full" : "h-4 w-4/5"
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );

  // Empty State
  const EmptyState = () => (
    <tbody>
      <tr>
        <td colSpan="8" className="text-center py-12 text-gray-400 text-sm">
          {error ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-red-500">Error: {error}</p>
              <button
                onClick={fetchApplications}
                className="bg-[#3AB000] text-white px-4 py-1.5 rounded text-xs hover:bg-[#2d8a00]"
              >
                Retry
              </button>
            </div>
          ) : (
            "No applications found."
          )}
        </td>
      </tr>
    </tbody>
  );

  const FullPageLoader = () => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-[#3AB000]/20 border-t-[#3AB000] animate-spin"></div>
        <img
          src={logo}
          alt="Logo"
          className="absolute inset-0 w-16 h-16 m-auto object-contain animate-pulse"
        />
      </div>
      <div className="flex items-center gap-2 text-[#3AB000] font-bold text-lg animate-bounce">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading Applications...
      </div>
    </div>
  );

  // Handle job posting selection
  // Collapsible job cards (admin): click a job to see its application numbers inline
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [jobApps, setJobApps] = useState({});

  const toggleJobApplications = async (jobId) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      return;
    }
    setExpandedJobId(jobId);
    if (jobApps[jobId]?.items) return; // already loaded
    setJobApps((prev) => ({ ...prev, [jobId]: { loading: true } }));
    try {
      // Same applications API the full list uses, filtered by this job
      const response = await applicationsAPI.getAll({ page: 1, limit: 50, jobPostingId: jobId });
      const items = response.success && response.data
        ? response.data.applications.map((app) => ({
            id: app._id,
            applicationNumber: app.applicationNumber,
            candidateName: app.candidateName,
            mobile: app.mobile,
            paymentStatus: app.paymentStatus || null,
            createdAt: app.createdAt,
          }))
        : [];
      const total = response.data?.pagination?.total ?? items.length;
      setJobApps((prev) => ({ ...prev, [jobId]: { loading: false, items, total } }));
    } catch (err) {
      setJobApps((prev) => ({ ...prev, [jobId]: { loading: false, items: [], error: err.message || "Failed to load applications" } }));
    }
  };

  const handleJobPostingClick = (jobId) => {
    setSelectedJobPostingId(jobId);
    setCurrentPage(1);
    setSearchQuery("");
    setPaymentStatusFilter("all");
    setFromDate("");
    setToDate("");
  };

  // Handle back to job list
  const handleBackToJobs = () => {
    setSelectedJobPostingId(null);
    setSelectedJobPosting(null);
    setApplications([]);
    setCurrentPage(1);
    setSearchQuery("");
    setPaymentStatusFilter("all");
    setFromDate("");
    setToDate("");
  };

  const updatePaymentStatus = async (applicationId) => {
    const nextStatus = paymentDrafts[applicationId] || "pending";
    setUpdatingPaymentId(applicationId);
    try {
      const response = await applicationsAPI.updatePaymentStatus(
        applicationId,
        nextStatus,
      );
      if (!response?.success) {
        alert(response?.error || "Failed to update payment status.");
        return;
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { ...app, paymentStatus: nextStatus }
            : app,
        ),
      );
    } catch (err) {
      alert(err.message || "Failed to update payment status.");
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  // Check if vacancy is open based on last date
  const isVacancyOpen = (lastDate) => {
    if (!lastDate) return true;
    try {
      const parts = lastDate.split(/[-/.]/);
      let date;
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          date = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      } else {
        date = new Date(lastDate);
      }

      if (isNaN(date.getTime())) return true;
      date.setHours(23, 59, 59, 999);
      return date >= new Date();
    } catch {
      return true;
    }
  };

  // Show job postings list (only for admin)
  if (role === "admin" && !selectedJobPostingId && !debouncedSearchQuery) {
    return (
      <DashboardLayout>
        <div className={`p-0 ml-0 md:ml-6 px-2 md:px-0 ${isBlueTheme ? "af-blue" : ""}`}>
          {isBlueTheme && <style>{AF_BLUE_CSS}</style>}
          {isBlueTheme && (
            <div className="af-hero">
              <div>
                <p className="af-kicker">Admin Panel · Applications</p>
                <h1>Applications</h1>
                <p className="af-sub">Click a job posting to see its application numbers, or search any applicant by name, application no. or mobile.</p>
              </div>
            </div>
          )}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-6">
            <div className="mb-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {isBlueTheme ? "Select a Job Posting" : "All Job Openings"}
              </h2>
              <p className="text-sm text-gray-600">
                {isBlueTheme ? "Click a job to show / hide its applications" : "Select a job or search globally"}
              </p>
            </div>

            {/* Global Search for Admin */}
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:items-center lg:justify-end lg:flex-1">
              <div className="flex items-center border border-gray-300 rounded overflow-hidden h-10 flex-1 w-full sm:max-w-[500px]">
                <input
                  type="text"
                  placeholder="Search by Name, App No, Mobile No..."
                  className="flex-1 px-3 sm:px-4 text-xs sm:text-sm text-gray-700 focus:outline-none h-full bg-white"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <button
                  onClick={() => fetchApplications()}
                  className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs sm:text-sm px-4 sm:px-6 h-full font-medium transition-colors whitespace-nowrap"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {jobPostingsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded border border-gray-200 p-4 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : jobPostings.length === 0 ? (
            <div className="bg-white rounded border border-gray-200 p-8 text-center text-gray-400">
              No job postings found.
            </div>
          ) : (
            <div className="space-y-3 pb-8">
              {jobPostings.map((job) => {
                const isOpen = isVacancyOpen(job.lastDate);
                const isInactive = job.status === "Inactive" || !isOpen;

                const isExpanded = expandedJobId === job.id;
                const jobAppState = jobApps[job.id] || {};

                return (
                  <div key={job.id} className={`af-job ${isExpanded ? "af-job-open" : ""}`}>
                  <div
                    onClick={() => toggleJobApplications(job.id)}
                    role="button"
                    aria-expanded={isExpanded}
                    className={`bg-white rounded border overflow-hidden p-4 hover:shadow-md transition-all cursor-pointer border-l-4 ${
                      isInactive
                        ? "border-l-gray-400 border-gray-200 opacity-80"
                        : "border-l-[#3AB000] border-gray-200 hover:border-[#3AB000]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Briefcase
                            className={`w-5 h-5 ${
                              isInactive ? "text-gray-400" : "text-[#3AB000]"
                            }`}
                          />
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3
                              className={`text-lg font-bold ${
                                isInactive ? "text-gray-600" : "text-gray-900"
                              }`}
                            >
                              {job.post}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                isInactive
                                  ? "bg-red-50 text-red-600 border-red-100"
                                  : "bg-green-50 text-green-600 border-green-100"
                              }`}
                            >
                              {isInactive ? "Inactive" : "Active"}
                            </span>
                          </div>
                        </div>
                        {/* Only the job name is shown (Advt. No, last date, location hidden) */}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div
                            className={`flex items-center gap-2 ${
                              isInactive ? "text-gray-400" : "text-[#3AB000]"
                            }`}
                          >
                            <Users className="w-5 h-5" />
                            <span className="text-lg font-bold">
                              {/* Actual number of applicants for this job */}
                              {(jobAppState.total ?? job.applicationCount ?? 0).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Applications</p>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── Collapsible: application numbers for this job ── */}
                  {isExpanded && (
                    <div className="af-job-panel">
                      {jobAppState.loading ? (
                        <div className="af-job-msg">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading applications...
                        </div>
                      ) : jobAppState.error ? (
                        <div className="af-job-msg af-job-err">{jobAppState.error}</div>
                      ) : !jobAppState.items || jobAppState.items.length === 0 ? (
                        <div className="af-job-msg">No applications for this job yet.</div>
                      ) : (
                        <>
                          <div className="af-job-table-wrap">
                            <table className="af-job-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Application No.</th>
                                  <th>Candidate</th>
                                  <th>Mobile</th>
                                  <th>Payment</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody>
                                {jobAppState.items.map((app, idx) => {
                                  const ps = normalizePaymentStatus(app.paymentStatus);
                                  return (
                                    <tr key={app.id}>
                                      <td>{idx + 1}</td>
                                      <td className="af-job-appno">{app.applicationNumber || "—"}</td>
                                      <td>{app.candidateName || "—"}</td>
                                      <td>{app.mobile || "—"}</td>
                                      <td>
                                        <span className={`af-pill af-pill-${ps === "paid" ? "paid" : ps === "pending" ? "pending" : "failed"}`}>
                                          {formatPaymentStatus(app.paymentStatus)}
                                        </span>
                                      </td>
                                      <td>
                                        <button
                                          type="button"
                                          className="af-job-view"
                                          onClick={() => navigate(`/applications/view/${app.id}`)}
                                        >
                                          <Eye className="w-4 h-4" /> View
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          <div className="af-job-foot">
                            <span>
                              Showing {jobAppState.items.length}
                              {jobAppState.total > jobAppState.items.length ? ` of ${jobAppState.total}` : ""} application(s)
                            </span>
                            <button type="button" className="af-job-full" onClick={() => handleJobPostingClick(job.id)}>
                              Open full list (filters &amp; payment update) →
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={`p-0 ml-0 md:ml-6 px-2 md:px-0 ${isBlueTheme ? "af-blue" : ""}`}>
        {isBlueTheme && <style>{AF_BLUE_CSS}</style>}
        {loading && <FullPageLoader />}

        {/* ── Page Header (applicant view) ── */}
        {isBlueTheme && (
          <div className="af-hero">
            <div>
              <p className="af-kicker">{isApplicantView ? "Application Form" : "Admin Panel"}</p>
              <h1>{isApplicantView ? "My Applications" : "All Applications"}</h1>
              <p className="af-sub">{isApplicantView ? "Track every application you have submitted and complete pending payments." : "Review applications and manage payment status."}</p>
            </div>
            <div className="af-hero-stats">
              <div className="af-hero-stat">
                <span>{totalItems || applications.length}</span>
                <small>Total Applications</small>
              </div>
            </div>
          </div>
        )}

        {/* ── Top Bar ── */}
        <div className={isBlueTheme && (selectedJobPosting || debouncedSearchQuery) ? "af-topbar" : "flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4"}>
          {role === "admin" &&
            (selectedJobPostingId || debouncedSearchQuery) && (
              <button
                onClick={handleBackToJobs}
                className={isBlueTheme ? "af-back-btn" : "flex items-center gap-2 text-[#3AB000] hover:text-[#2d8a00] font-medium transition-colors"}
              >
                <ArrowLeft className="w-4 h-4" />
                {debouncedSearchQuery && !selectedJobPostingId
                  ? "Back to Jobs"
                  : "Back to Job List"}
              </button>
            )}
          {selectedJobPosting ? (
            <div className={isBlueTheme ? "af-topbar-info" : "flex-1"}>
              <h3 className="text-lg font-bold text-gray-900">
                {typeof selectedJobPosting.post === "object"
                  ? selectedJobPosting.post.en
                  : selectedJobPosting.post}
              </h3>
              <p className={isBlueTheme ? "af-advt" : "text-sm text-gray-600"}>
                Advt. No: {selectedJobPosting.advtNo}
              </p>
            </div>
          ) : debouncedSearchQuery ? (
            <div className={isBlueTheme ? "af-topbar-info" : "flex-1"}>
              <h3 className="text-lg font-bold text-gray-900">
                Global Search Results
              </h3>
              <p className="text-sm text-gray-600">
                Showing matches for "{debouncedSearchQuery}"
              </p>
            </div>
          ) : null}
        </div>

        {/* ── Search + Filters Bar ── */}
        <div className="flex flex-col gap-3 mb-4">
          {/* Search Row */}
          <div className="flex items-center border border-gray-300 rounded overflow-hidden h-10 w-full">
            <input
              type="text"
              placeholder="Search by Name, App No, Mobile No..."
              className="flex-1 px-3 sm:px-4 text-xs sm:text-sm text-gray-700 focus:outline-none h-full bg-white"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <button
              onClick={() => fetchApplications()}
              className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs sm:text-sm px-4 sm:px-6 h-full font-medium transition-colors whitespace-nowrap flex items-center gap-2"
            >
              {isRefreshing && <Loader2 className="w-3 h-3 animate-spin" />}
              Search
            </button>
          </div>

          {/* Payment Status + Date Range Row */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-wrap">
            {/* Payment Status Filter */}
            <div className="inline-flex rounded border border-gray-300 overflow-hidden flex-shrink-0">
              {["all", "pending", "paid"].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setPaymentStatusFilter(option);
                    setCurrentPage(1);
                  }}
                  className={`px-5 py-2 text-sm font-semibold capitalize transition-colors ${
                    paymentStatusFilter === option
                      ? "bg-[#3AB000] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                Creation Date:
              </span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-[#3AB000] h-9"
              />
              <span className="text-gray-400 text-xs font-medium">to</span>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-[#3AB000] h-9"
              />
              {(fromDate || toDate) && (
                <button
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                    setCurrentPage(1);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 border border-red-200 rounded hover:bg-red-50 transition-colors h-9"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Desktop Table ── */}
        <div className="hidden md:block bg-white rounded overflow-hidden border border-gray-200">
          <div className="overflow-x-auto -mx-2 md:mx-0">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="bg-[#3AB000]">
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                    S.N
                  </th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                    Photo
                  </th>
                  {!selectedJobPostingId && (
                    <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                      Job Post
                    </th>
                  )}
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                    Application No.
                  </th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                    Candidate Name
                  </th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                    Mobile
                  </th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                    Email
                  </th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                    Payment Status
                  </th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>

              {applications.length === 0 ? (
                <EmptyState />
              ) : (
                <tbody
                  className={
                    isRefreshing ? "opacity-50 pointer-events-none" : ""
                  }
                >
                  {applications.map((app, idx) => (
                    <tr
                      key={app.id}
                      onClick={() => navigate(`/applications/view/${app.id}`)}
                      className="border-b border-gray-100 hover:bg-[#e8f5e2] transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-4 text-center text-gray-700">
                        {indexOfFirst + idx + 1}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {app.photo ? (
                          <img
                            src={app.photo}
                            alt={app.candidateName}
                            className="h-9 w-9 rounded-full object-cover mx-auto"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-[#e8f5e2] flex items-center justify-center mx-auto text-[#3AB000] font-bold text-sm">
                            {(app.candidateName || "A").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      {!selectedJobPostingId && (
                        <td className="px-4 py-4 text-center text-gray-700 max-w-[150px] truncate font-medium">
                          {getJobTitleForApplication(app)}
                        </td>
                      )}
                      <td className="px-4 py-4 text-center text-gray-700 font-medium">
                        {app.applicationNumber || "N/A"}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700 font-bold">
                        {app.candidateName}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700">
                        {app.mobile || "N/A"}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700">
                        {app.email || "N/A"}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700">
                        {role === "admin" ? (
                          <div
                            className="flex items-center justify-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <select
                              value={paymentDrafts[app.id] || "pending"}
                              onChange={(e) =>
                                setPaymentDrafts((prev) => ({
                                  ...prev,
                                  [app.id]: e.target.value,
                                }))
                              }
                              className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="failed">Failed</option>
                              <option value="refunded">Refunded</option>
                            </select>
                            <button
                              onClick={() => updatePaymentStatus(app.id)}
                              disabled={
                                updatingPaymentId === app.id ||
                                (paymentDrafts[app.id] || "pending") ===
                                  normalizePaymentStatus(app.paymentStatus)
                              }
                              className="px-2 py-1 rounded text-xs font-semibold bg-[#3AB000] text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              {updatingPaymentId === app.id
                                ? "Saving..."
                                : "Update"}
                            </button>
                          </div>
                        ) : isBlueTheme ? (
                          <span
                            className={`af-pill af-pill-${
                              normalizePaymentStatus(app.paymentStatus) === "paid"
                                ? "paid"
                                : normalizePaymentStatus(app.paymentStatus) === "pending"
                                  ? "pending"
                                  : "failed"
                            }`}
                          >
                            {formatPaymentStatus(app.paymentStatus)}
                          </span>
                        ) : (
                          formatPaymentStatus(app.paymentStatus)
                        )}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700 whitespace-nowrap">
                        {app.createdAt
                          ? new Date(app.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "N/A"}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/applications/view/${app.id}`);
                            }}
                            className="text-[#3AB000] hover:text-[#2d8a00] transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/applications/edit/${app.id}`);
                            }}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit Applicant"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
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
          {applications.length === 0 && !loading ? (
            <div className="bg-white rounded border border-gray-200 p-8 text-center text-gray-400 text-sm">
              {error ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-red-500">Error: {error}</p>
                  <button
                    onClick={fetchApplications}
                    className="bg-[#3AB000] text-white px-4 py-1.5 rounded text-xs hover:bg-[#2d8a00]"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                "No applications found."
              )}
            </div>
          ) : (
            applications.map((app, idx) => (
              <div
                key={app.id}
                onClick={() => navigate(`/applications/view/${app.id}`)}
                className="bg-white rounded-lg border border-gray-200 p-3.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex-shrink-0">
                    {app.photo ? (
                      <img
                        src={app.photo}
                        alt={app.candidateName || "Applicant"}
                        className="h-12 w-12 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-[#e8f5e2] flex items-center justify-center text-[#3AB000] font-bold text-base">
                        {(app.candidateName || "A").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-gray-500 mb-1">
                      S.N: {indexOfFirst + idx + 1}
                    </div>
                    <div className="text-sm font-bold text-gray-900 mb-1 truncate">
                      {app.candidateName}
                    </div>
                    {!selectedJobPostingId && (
                      <div className="text-xs text-[#3AB000] font-medium truncate mb-1">
                        {getJobTitleForApplication(app)}
                      </div>
                    )}
                    <div className="text-xs font-semibold text-gray-800 mb-1">
                      App No: {app.applicationNumber || "N/A"}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">
                      Mobile: {app.mobile || "N/A"}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 italic">
                      Applied:{" "}
                      {app.createdAt
                        ? new Date(app.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </div>
                  </div>
                  <div
                    className={`text-[11px] px-2 py-1 rounded-full border font-semibold ${
                      normalizePaymentStatus(app.paymentStatus) === "paid"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : normalizePaymentStatus(app.paymentStatus) ===
                            "pending"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {formatPaymentStatus(app.paymentStatus)}
                  </div>
                </div>

                {role === "admin" && (
                  <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <select
                        value={paymentDrafts[app.id] || "pending"}
                        onChange={(e) =>
                          setPaymentDrafts((prev) => ({
                            ...prev,
                            [app.id]: e.target.value,
                          }))
                        }
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                      <button
                        onClick={() => updatePaymentStatus(app.id)}
                        disabled={
                          updatingPaymentId === app.id ||
                          (paymentDrafts[app.id] || "pending") ===
                            normalizePaymentStatus(app.paymentStatus)
                        }
                        className="px-3 py-1.5 rounded text-xs font-semibold bg-[#3AB000] text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {updatingPaymentId === app.id ? "Saving..." : "Update"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm text-gray-700 mb-2.5">
                  <div className="flex items-start">
                    <span className="font-medium w-28 flex-shrink-0">
                      Email:
                    </span>
                    <span className="flex-1 truncate">
                      {app.email || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/applications/view/${app.id}`);
                    }}
                    className="text-[#3AB000] hover:text-[#2d8a00] transition-colors p-2"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/applications/edit/${app.id}`);
                    }}
                    className="text-blue-600 hover:text-blue-800 transition-colors p-2"
                    title="Edit Applicant"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {!loading && applications.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between sm:justify-end items-center gap-3 sm:gap-4 mt-6">
            <div className="text-xs sm:text-sm text-gray-600 sm:hidden">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-[#3AB000] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:bg-[#2d8a00] transition-colors rounded-sm flex-1 sm:flex-none"
              >
                Back
              </button>

              <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
                {(() => {
                  const pages = [];
                  const visiblePages = new Set([
                    1,
                    2,
                    totalPages - 1,
                    totalPages,
                    currentPage - 1,
                    currentPage,
                    currentPage + 1,
                  ]);
                  for (let i = 1; i <= totalPages; i++) {
                    if (visiblePages.has(i)) pages.push(i);
                    else if (pages[pages.length - 1] !== "...")
                      pages.push("...");
                  }
                  return pages.map((page, idx) =>
                    page === "..." ? (
                      <span
                        key={idx}
                        className="px-1 text-gray-500 select-none"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors ${
                          currentPage === page
                            ? "text-[#3AB000] font-bold"
                            : "text-gray-600 hover:text-[#3AB000]"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  );
                })()}
              </div>

              <div className="sm:hidden text-sm font-medium text-gray-700 px-2">
                {currentPage}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="bg-[#3AB000] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:bg-[#2d8a00] transition-colors rounded-sm flex-1 sm:flex-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

// Landing-site palette for the applicant view: dark-green #3F6212, green #4D7C0F.
const AF_BLUE_CSS = `
.af-topbar{display:flex;flex-wrap:wrap;align-items:center;gap:16px 24px;background:#fff;border:1px solid #e5e7eb;border-left:4px solid #4D7C0F;border-radius:8px;padding:16px 20px;margin-bottom:18px;box-shadow:0 2px 8px rgba(0,0,0,.04);}
.af-back-btn{display:inline-flex;align-items:center;gap:8px;background:#fff;color:#4D7C0F;border:1.5px solid #4D7C0F;border-radius:6px;padding:9px 18px;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;transition:background .15s,color .15s;}
.af-back-btn:hover{background:#4D7C0F;color:#fff;}
.af-topbar-info{flex:1 1 260px;min-width:0;padding-left:24px;border-left:1px solid #e5e7eb;}
.af-topbar-info h3{color:#1A2E05!important;margin:0 0 8px;line-height:1.3;}
.af-topbar-info p{margin:0;}
.af-advt{display:inline-block;font-size:12px;font-weight:700;color:#4D7C0F;background:#ECFCCB;border:1px solid #D9F99D;border-radius:999px;padding:4px 12px;}
@media(max-width:640px){.af-topbar-info{padding-left:0;border-left:0;border-top:1px solid #e5e7eb;padding-top:14px;flex-basis:100%;}}

.af-job-open>div:first-child{border-bottom-left-radius:0;border-bottom-right-radius:0;}
.af-job{min-width:0;max-width:100%;}
.af-job-panel{min-width:0;max-width:100%;overflow:hidden;background:#fff;border:1px solid #e5e7eb;border-top:0;border-left:4px solid #4D7C0F;border-radius:0 0 6px 6px;padding:12px 16px 14px;}
.af-job-msg{display:flex;align-items:center;gap:8px;font-size:13px;color:#64748b;padding:10px 4px;}
.af-job-err{color:#b91c1c;}
.af-job-table-wrap{overflow-x:auto;}
.af-job-table{width:100%;border-collapse:collapse;font-size:13px;}
.af-job-table th{background:#3F6212;color:#fff;font-weight:700;text-align:left;padding:9px 12px;white-space:nowrap;}
.af-job-table th:first-child{border-top-left-radius:6px;}
.af-job-table th:last-child{border-top-right-radius:6px;}
.af-job-table td{padding:9px 12px;border-bottom:1px solid #D9F99D;color:#1f2937;white-space:nowrap;}
.af-job-table tbody tr:nth-child(even){background:#ECFCCB;}
.af-job-table tbody tr:hover{background:#ECFCCB;}
.af-job-appno{font-weight:800;color:#3F6212!important;letter-spacing:.02em;}
.af-job-view{display:inline-flex;align-items:center;gap:4px;background:none;border:0;color:#4D7C0F;font-weight:700;font-size:12px;cursor:pointer;}
.af-job-view:hover{color:#3F6212;text-decoration:underline;}
.af-job-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;font-size:12px;color:#64748b;}
.af-job-full{background:#4D7C0F;color:#fff;border:0;border-radius:6px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;}
.af-job-full:hover{background:#3F6212;}

.af-blue{font-family:'Segoe UI',sans-serif;}
.af-hero{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;padding:22px 26px;margin-bottom:18px;border-radius:10px;color:#fff;
  background:linear-gradient(100deg,#3F6212 0%,#4D7C0F 55%,#65A30D 100%);box-shadow:0 6px 16px rgba(77,124,15,.22);text-shadow:0 1px 2px rgba(26,46,5,.35);}
.af-kicker{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#fff;font-weight:800;margin:0 0 4px;}
.af-hero h1{font-size:25px;font-weight:800;margin:0 0 4px;color:#fff;}
.af-sub{font-size:14px;color:#fff;font-weight:500;margin:0;}
.af-hero-stat{min-width:130px;background:#fff;border:0;border-radius:8px;padding:12px 16px;box-shadow:0 4px 12px rgba(63,98,18,.18);text-shadow:none;}
.af-hero-stat span{display:block;font-size:26px;font-weight:800;line-height:1;color:#3F6212;}
.af-hero-stat small{display:block;font-size:12px;color:#4D7C0F;margin-top:6px;font-weight:700;}
.af-blue .bg-\\[\\#3AB000\\]{background:#4D7C0F!important;}
.af-blue .hover\\:bg-\\[\\#2d8a00\\]:hover{background:#3F6212!important;}
.af-blue .hover\\:text-\\[\\#3AB000\\]:hover{color:#3F6212!important;}
.af-blue .border-l-\\[\\#3AB000\\]{border-left-color:#4D7C0F!important;}
.af-blue .hover\\:border-\\[\\#3AB000\\]:hover{border-color:#4D7C0F!important;}
.af-blue .text-\\[\\#3AB000\\]{color:#4D7C0F!important;}
.af-blue .hover\\:text-\\[\\#2d8a00\\]:hover{color:#3F6212!important;}
.af-blue .bg-\\[\\#e8f5e2\\]{background:#ECFCCB!important;}
.af-blue .hover\\:bg-\\[\\#e8f5e2\\]:hover{background:#ECFCCB!important;}
.af-blue .border-\\[\\#3AB000\\]\\/20{border-color:rgba(77,124,15,.2)!important;}
.af-blue .border-t-\\[\\#3AB000\\]{border-top-color:#4D7C0F!important;}
.af-blue .focus\\:border-\\[\\#3AB000\\]:focus{border-color:#4D7C0F!important;}
.af-blue .rounded,.af-blue .rounded-sm{border-radius:6px;}
.af-blue input:focus{box-shadow:inset 0 0 0 2px #D9F99D;}
.af-blue table thead th{color:#fff!important;font-weight:700;letter-spacing:.02em;}
.af-blue .hidden.md\\:block.bg-white{border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.04);}
.af-blue tbody tr:nth-child(even){background:#ECFCCB;}
.af-blue table th,.af-blue table td{padding-left:10px!important;padding-right:10px!important;}
.af-blue .inline-flex .bg-gray-100{background:#fff!important;}
.af-blue .inline-flex .hover\\:bg-gray-200:hover{background:#ECFCCB!important;}
.af-blue .md\\:hidden > .bg-white{box-shadow:0 2px 8px rgba(0,0,0,.04);}
.af-pill{display:inline-block;font-size:12px;font-weight:700;padding:3px 12px;border-radius:999px;border:1px solid;white-space:nowrap;}
.af-pill-paid{background:#ecfdf5;color:#047857;border-color:#a7f3d0;}
.af-pill-pending{background:#fffbeb;color:#b45309;border-color:#fde68a;}
.af-pill-failed{background:#fef2f2;color:#b91c1c;border-color:#fecaca;}
@media(max-width:640px){.af-hero{padding:18px;}.af-hero h1{font-size:20px;}.af-hero-stats,.af-hero-stat{width:100%;}}
`;

export default ApplicationForm;
