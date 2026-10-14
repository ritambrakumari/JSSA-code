import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  GraduationCap,
  Eye,
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react";
import { applicationsAPI, jobPostingsAPI } from "../../utils/api";

const JobPostingApplicants = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jobPosting, setJobPosting] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentDrafts, setPaymentDrafts] = useState({});
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch job posting details
        const postingResponse = await jobPostingsAPI.getById(id);
        if (postingResponse.success && postingResponse.data) {
          setJobPosting(postingResponse.data.posting);
        }

        // Fetch all applications for this job posting
        const applicationsResponse = await applicationsAPI.getAll({ 
          limit: 0,
          jobPostingId: id 
        });
        if (applicationsResponse.success && applicationsResponse.data) {
          const transformed = applicationsResponse.data.applications.map((app) => ({
            id: app._id,
            photo: app.photo,
            candidateName: app.candidateName,
            fatherName: app.fatherName,
            mobile: app.mobile,
            district: app.district,
            higherEducation: app.higherEducation,
            status: app.status,
            paymentStatus: app.paymentStatus || "pending",
            createdAt: app.createdAt,
          }));
          setApplicants(transformed);
          setPaymentDrafts(
            transformed.reduce((acc, app) => {
              acc[app.id] = app.paymentStatus || "pending";
              return acc;
            }, {}),
          );
        }
      } catch (err) {
        setError(err.message || "Failed to load data");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Filter applicants by search query
  const filteredApplicants = applicants.filter((app) =>
    [app.candidateName, app.mobile, app.district, app.fatherName]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

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

      setApplicants((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, paymentStatus: nextStatus } : app,
        ),
      );
    } catch (err) {
      alert(err.message || "Failed to update payment status.");
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const statusColors = {
    Active: "bg-green-50 text-green-700 border-green-200",
    Inactive: "bg-gray-50 text-gray-700 border-gray-200",
    Pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Approved: "bg-blue-50 text-blue-700 border-blue-200",
    Rejected: "bg-red-50 text-red-700 border-red-200",
  };

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout activePath="/application-form">
        <div className="ml-0 md:ml-6 px-2 md:px-0 animate-pulse space-y-4">
          <div className="h-7 bg-gray-200 rounded w-1/4 mb-2" />
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-200 h-28 w-full" />
            <div className="p-4 sm:p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-4 bg-gray-200 rounded ${i % 2 === 0 ? "w-3/4" : "w-1/2"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Error State ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout activePath="/application-form">
        <div className="ml-0 md:ml-6 px-2 md:px-0 flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-gray-500 font-medium mb-4 text-sm sm:text-base px-4">{error}</p>
          <button
            onClick={() => navigate("/application-form")}
            className="bg-[#3AB000] text-white px-6 py-2 rounded text-xs sm:text-sm font-medium hover:bg-[#2d8a00] transition-colors"
          >
            ← Back to List
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Not Found ─────────────────────────────────────────────────────────────
  if (!jobPosting) {
    return (
      <DashboardLayout activePath="/application-form">
        <div className="ml-0 md:ml-6 px-2 md:px-0 flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-gray-500 font-medium mb-4 text-sm sm:text-base px-4">
            Job posting not found.
          </p>
          <button
            onClick={() => navigate("/application-form")}
            className="bg-[#3AB000] text-white px-6 py-2 rounded text-xs sm:text-sm font-medium hover:bg-[#2d8a00] transition-colors"
          >
            ← Back to List
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const getValue = (field) => {
    if (!field) return "—";
    if (typeof field === "object" && field !== null) {
      return field.en || field.hi || "";
    }
    return field || "—";
  };

  return (
    <DashboardLayout activePath="/application-form">
      <div className="ml-0 md:ml-6 px-2 md:px-0 space-y-4 pb-8">
        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-xs sm:text-sm overflow-x-auto">
          <button
            onClick={() => navigate("/application-form")}
            className="flex items-center gap-1.5 text-[#3AB000] font-medium hover:underline whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Application Form</span>
            <span className="sm:hidden">Back</span>
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500 truncate max-w-[150px] sm:max-w-xs">
            {getValue(jobPosting.post)} - Applicants
          </span>
        </div>

        {/* ── Job Posting Info Card ── */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-[#3AB000] px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-white font-bold text-lg sm:text-xl md:text-2xl leading-snug mb-1">
                  {getValue(jobPosting.post)}
                </h1>
                <p className="text-green-100 text-xs sm:text-sm">
                  Advertisement No: {jobPosting.advtNo || "—"}
                </p>
                <p className="text-green-100 text-xs mt-1">
                  Total Applicants: {Math.floor(filteredApplicants.length / 10).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
            <QuickInfo
              icon={<MapPin className="w-4 h-4" />}
              label="Location"
              value={getValue(jobPosting.location)}
            />
            <QuickInfo
              icon={<GraduationCap className="w-4 h-4" />}
              label="Education"
              value={getValue(jobPosting.education)}
            />
            <QuickInfo
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Status"
              value={jobPosting.status || "—"}
            />
            <QuickInfo
              icon={<Users className="w-4 h-4" />}
              label="Applicants"
              value={Math.floor(filteredApplicants.length / 10).toLocaleString()}
            />
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              placeholder="Search by name, mobile, district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#3AB000] focus:border-transparent"
            />
            <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap text-center sm:text-left">
              {Math.floor(filteredApplicants.length / 10).toLocaleString()} applicant{Math.floor(filteredApplicants.length / 10) !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* ── Desktop Table ── */}
        <div className="hidden md:block bg-white rounded overflow-hidden border border-gray-200">
          {filteredApplicants.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {searchQuery ? "No applicants found matching your search." : "No applicants have applied for this job posting yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 md:mx-0">
              <table className="w-full text-sm min-w-[1000px]">
                <thead>
                  <tr className="bg-[#3AB000]">
                    <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                      S.N
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                      Photo
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                      Candidate Name
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                      Father's Name
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                      Mobile
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                      District
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                      Education
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                      Payment Status
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                      Applied On
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplicants.map((app, idx) => (
                    <tr
                      key={app.id}
                      className="border-b border-gray-100 hover:bg-[#e8f5e2] transition-colors"
                    >
                      <td className="px-4 py-4 text-center text-gray-700">
                        {idx + 1}
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
                            {app.candidateName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700 font-medium">
                        {app.candidateName}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700">
                        {app.fatherName}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700">
                        {app.mobile}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700">
                        {app.district}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700">
                        {app.higherEducation}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
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
                                (app.paymentStatus || "pending")
                            }
                            className="px-2 py-1 rounded text-xs font-semibold bg-[#3AB000] text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            {updatingPaymentId === app.id ? "Saving..." : "Update"}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700 text-xs">
                        {app.createdAt
                          ? new Date(app.createdAt).toLocaleDateString("en-GB")
                          : "—"}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => navigate(`/applications/view/${app.id}`)}
                          className="text-[#3AB000] hover:text-[#2d8a00] transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Mobile Card View ── */}
        <div className="md:hidden space-y-3">
          {filteredApplicants.length === 0 ? (
            <div className="bg-white rounded border border-gray-200 p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-sm">
                {searchQuery ? "No applicants found matching your search." : "No applicants have applied for this job posting yet."}
              </p>
            </div>
          ) : (
            filteredApplicants.map((app, idx) => (
              <div
                key={app.id}
                className="bg-white rounded border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0">
                    {app.photo ? (
                      <img
                        src={app.photo}
                        alt={app.candidateName}
                        className="h-12 w-12 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-[#e8f5e2] flex items-center justify-center text-[#3AB000] font-bold text-base">
                        {app.candidateName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-1">S.N: {idx + 1}</div>
                    <div className="text-base font-semibold text-gray-800 mb-1">
                      {app.candidateName}
                    </div>
                    <div className="text-sm text-gray-600">{app.fatherName}</div>
                  </div>
                  <div className="flex items-center gap-2">
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
                          (app.paymentStatus || "pending")
                      }
                      className="px-2 py-1 rounded text-xs font-semibold bg-[#3AB000] text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {updatingPaymentId === app.id ? "Saving..." : "Update"}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-700 mb-3">
                  <div className="flex items-start">
                    <span className="font-medium w-20 flex-shrink-0">Mobile:</span>
                    <span className="flex-1">{app.mobile}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium w-20 flex-shrink-0">District:</span>
                    <span className="flex-1">{app.district}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium w-20 flex-shrink-0">Education:</span>
                    <span className="flex-1">{app.higherEducation}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium w-20 flex-shrink-0">Payment:</span>
                    <span className="flex-1">
                      {app.paymentStatus === "pending" || !app.paymentStatus ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                          Payment Pending
                        </span>
                      ) : app.paymentStatus === "paid" ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                          Payment Done
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
                          {app.paymentStatus}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium w-20 flex-shrink-0">Applied On:</span>
                    <span className="flex-1 text-xs">
                      {app.createdAt
                        ? new Date(app.createdAt).toLocaleDateString("en-GB")
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/applications/view/${app.id}`)}
                    className="text-[#3AB000] hover:text-[#2d8a00] transition-colors p-2"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Back Button ── */}
        <div>
          <button
            onClick={() => navigate("/application-form")}
            className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 hover:text-[#3AB000] transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Application Form</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

// ── Helper Components ─────────────────────────────────────────────────────────────

const QuickInfo = ({ icon, label, value }) => (
  <div className="flex items-start gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4">
    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#e8f5e2] flex items-center justify-center flex-shrink-0 text-[#3AB000] mt-0.5">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-xs sm:text-sm mt-0.5 text-gray-800 font-semibold truncate">
        {value || "—"}
      </p>
    </div>
  </div>
);

export default JobPostingApplicants;
