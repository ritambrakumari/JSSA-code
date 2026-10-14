import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  FileText,
  ArrowRight,
  PlusCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  ClipboardList,
  TrendingUp,
  Calendar,
  MapPin,
  Eye,
  Bell,
  Briefcase,
  BookOpen,
  UserCheck,
  Award,
  CheckCircle2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { dashboardAPI, applicationsAPI, jobPostingsAPI, notificationsAPI, createPaperAPI, noticesAPI } from "../utils/api";
import ScrollerCarousel from "../components/Scroller/ScrollerCarousel";

export default function ApplicantDashboard() {
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const navigate = useNavigate();
  const { identifier } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentApplications, setRecentApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const [assignedTests, setAssignedTests] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch dashboard stats
        const statsResponse = await dashboardAPI.getStats();
        if (statsResponse.success && statsResponse.data) {
          setDashboardData(statsResponse.data);
        }

        // Fetch assigned tests
        try {
          const testsResponse = await createPaperAPI.getAssigned();
          if (testsResponse.success && testsResponse.data) {
            setAssignedTests(testsResponse.data.tests || []);
          }
        } catch (err) {
          console.error("Error fetching assigned tests:", err);
        }

        // Fetch recent applications
        const appsResponse = await applicationsAPI.getAll({ limit: 5 });
        if (appsResponse.success && appsResponse.data) {
          const transformed = appsResponse.data.applications.map((app) => ({
            id: app._id,
            candidateName: app.candidateName,
            district: app.district,
            status: app.status || "Pending",
            paymentStatus: app.paymentStatus || "pending",
            createdAt: app.createdAt,
            jobPosting: app.jobPostingId
              ? app.jobPostingId.post?.en || app.jobPostingId.post || "General"
              : "General",
            jobPostingId: app.jobPostingId?._id || app.jobPostingId,
          }));
          setRecentApplications(transformed);
        }

        // Fetch notifications and notices
        try {
          const [notifResponse, noticesResponse] = await Promise.all([
            notificationsAPI.getAll(true),
            noticesAPI.getAll(true)
          ]);

          let combined = [];

          if (notifResponse.success && notifResponse.data) {
            const notifs = (notifResponse.data.notifications || notifResponse.data || []).map(n => ({
              ...n,
              type: 'notification',
              displayTitle: n.title,
              displayLink: n.url || n.link
            }));
            combined = [...combined, ...notifs];
          }

          if (noticesResponse.success && noticesResponse.data) {
            const notices = (noticesResponse.data.notices || noticesResponse.data || []).map(n => ({
              ...n,
              type: 'notice',
              displayTitle: n.noticeEnglish && n.noticeHindi
                ? `${n.noticeEnglish} / ${n.noticeHindi}`
                : (n.noticeEnglish || n.noticeHindi || n.importantNotice),
              displayLink: null // Notices usually don't have direct links in this model
            }));
            combined = [...combined, ...notices];
          }

          // Sort by date
          combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setNotifications(combined);
        } catch (err) {
          console.error("Error fetching notifications/notices:", err);
        }

        // Fetch active job postings
        try {
          const jobsResponse = await jobPostingsAPI.getAll({ status: "Active", limit: 6 });
          if (jobsResponse.success && jobsResponse.data) {
            setJobPostings(jobsResponse.data.postings || jobsResponse.data || []);
          }
        } catch (err) {
          console.error("Error fetching job postings:", err);
        }
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Application flow stages
  const applicationFlow = [
    {
      stage: "Application Fill",
      icon: FileText,
      description: "Submit your application form",
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      stage: "Exam",
      icon: BookOpen,
      description: "Complete the assessment exam",
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      stage: "MoU",
      icon: ClipboardList,
      description: "MoU verification",
      color: "bg-yellow-500",
      lightColor: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
    {
      stage: "Employment",
      icon: Award,
      description: "Final employment",
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-600",
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      Approved: "bg-green-100 text-green-700 border-green-200",
      Active: "bg-blue-100 text-blue-700 border-blue-200",
      Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      Rejected: "bg-red-100 text-red-700 border-red-200",
      Inactive: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colors[status] || colors.Pending;
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="ad-page">
          <style>{AD_STYLES}</style>
          <div className="ad-center">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#4D7C0F" }} />
            <p>Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="ad-page">
          <style>{AD_STYLES}</style>
          <div className="ad-center">
            <div className="ad-error-ic">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2>Failed to Load Dashboard</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="ad-btn">
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Progress through the 4 stages (same rules as before)
  const isAppPaid = recentApplications.some((app) => app.paymentStatus === "paid");
  const isExamAssigned = assignedTests.length > 0;
  const isExamPassed = assignedTests.some((t) => {
    const score = t.userAttempt?.score || 0;
    const passing = t.passingMarks || 40;
    return t.userAttempt && score >= passing;
  });
  const isMOUDone = assignedTests.some(
    (t) => t.userAttempt?.mouStatus === "verified" || t.userAttempt?.mouStatus === "submitted"
  );
  const isEmployed = assignedTests.some((t) => t.userAttempt?.employmentStatus === "Active");

  const getStageStatus = (index) => {
    if (index === 0) return isAppPaid ? "completed" : "current";
    if (index === 1) return isExamPassed ? "completed" : isAppPaid || isExamAssigned ? "current" : "upcoming";
    if (index === 2) return isMOUDone ? "completed" : isExamPassed ? "current" : "upcoming";
    return isEmployed ? "completed" : isMOUDone ? "current" : "upcoming";
  };
  const stageStatusLabel = { completed: "Completed", current: "In Progress", upcoming: "Upcoming" };

  const pendingPayments = recentApplications.filter((app) => app.paymentStatus === "pending").length;
  const hasExamAlert = assignedTests.some(
    (test) => test.windowStatus === "active" || test.windowStatus === "upcoming"
  );

  return (
    <DashboardLayout>
      <div className="ad-page">
        <style>{AD_STYLES}</style>
        <div className="ad-wrap">
          {/* Scroller Carousel */}
          <ScrollerCarousel />

          {/* Welcome Header */}
          <section className="ad-hero">
            <div className="ad-hero-text">
              <p className="ad-kicker">Applicant Dashboard</p>
              <h1>Welcome{identifier ? `, ${identifier}` : ""}!</h1>
              <p className="ad-hero-sub">Track your applications and explore new opportunities.</p>
            </div>
            <div className="ad-hero-stats">
              <div className="ad-hero-stat">
                <span>{recentApplications.length}</span>
                <small>My Applications</small>
              </div>
              <div className="ad-hero-stat">
                <span>{pendingPayments}</span>
                <small>Payment Pending</small>
              </div>
              <div className="ad-hero-stat">
                <span>{assignedTests.length}</span>
                <small>Exams Assigned</small>
              </div>
            </div>
          </section>

          {/* Exam Alert Strip */}
          {hasExamAlert && (
            <div className="ad-alert">
              <div className="ad-alert-l">
                <div className="ad-alert-ic">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="ad-alert-t">Exam Alert!</p>
                  <p className="ad-alert-s">
                    You have active or upcoming exams. Please check your schedule and start on time.
                  </p>
                </div>
              </div>
              <button onClick={() => navigate("/my-exam")} className="ad-btn ad-btn-light">
                Go to My Exam &amp; MOU →
              </button>
            </div>
          )}

          {/* Application Flow */}
          <section className="ad-card">
            <div className="ad-card-h">
              <h2>
                <span className="ad-card-ic">
                  <TrendingUp className="w-4 h-4" />
                </span>
                Application Process Flow
              </h2>
            </div>
            <div className="ad-flow">
              {applicationFlow.map((step, index) => {
                const Icon = step.icon;
                const status = getStageStatus(index);
                const handleStageClick = () => {
                  if (index === 0) navigate("/application-form");
                  if (index === 1 || index === 2) navigate("/my-exam");
                };
                return (
                  <div key={step.stage} className={`ad-step ad-step-${status}`}>
                    {index < applicationFlow.length - 1 && <span className="ad-step-line" />}
                    <button type="button" onClick={handleStageClick} className="ad-step-ic" title={step.stage}>
                      <Icon className="w-6 h-6" />
                      {status === "completed" && (
                        <span className="ad-step-check">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                    <p className="ad-step-n">Step {index + 1}</p>
                    <h3>{step.stage}</h3>
                    <p className="ad-step-d">{step.description}</p>
                    <span className="ad-step-badge">{stageStatusLabel[status]}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* YouTube Video Section for Paid Applicants */}
          {isAppPaid && (
            <section className="ad-card ad-video">
              <div className="ad-video-h">
                <Eye className="w-5 h-5" />
                <h3>MOU Form Fill Guidance Video</h3>
              </div>
              <div className="ad-video-frame">
                {isVideoLoading && (
                  <div className="ad-video-loading">
                    <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#4D7C0F" }} />
                    <p>Loading Guidance Video...</p>
                  </div>
                )}
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://drive.google.com/file/d/1nxQeJJaO0yLYOMlNKvZDyHbg2JWdjbQH/preview"
                  title="MOU Form Fill Guidance Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  onLoad={() => setIsVideoLoading(false)}
                ></iframe>
              </div>
            </section>
          )}

          {/* Main Grid */}
          <div className="ad-grid">
            {/* Left Column - Vacancies & Quick Actions */}
            <div className="ad-col">
              {/* All Related Vacancies */}
              <section className="ad-card">
                <div className="ad-card-h">
                  <h2>
                    <span className="ad-card-ic">
                      <Briefcase className="w-4 h-4" />
                    </span>
                    Related Vacancies
                  </h2>
                  <button onClick={() => navigate("/job-postings")} className="ad-viewall">
                    View All →
                  </button>
                </div>
                <div className="ad-list ad-scroll">
                  {jobPostings.length > 0 ? (
                    jobPostings.map((job) => (
                      <div
                        key={job._id}
                        className="ad-item ad-item-link ad-job"
                        onClick={() => navigate(`/job-postings/view/${job._id}`)}
                      >
                        <div className="ad-item-body">
                          <h3>{job.post?.en || job.postTitle?.en || job.post || "Job Posting"}</h3>
                          {job.post?.hi && <p className="ad-item-s">{job.post.hi}</p>}
                          <div className="ad-meta">
                            {job.advtNo && (
                              <span>
                                <FileText className="w-3 h-3" />
                                {job.advtNo}
                              </span>
                            )}
                            {job.location?.en && (
                              <span>
                                <MapPin className="w-3 h-3" />
                                {job.location.en}
                              </span>
                            )}
                          </div>
                          <span className="ad-pill ad-pill-paid">{job.status || "Active"}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 ad-item-arrow" />
                      </div>
                    ))
                  ) : (
                    <div className="ad-empty">
                      <Briefcase className="w-10 h-10" />
                      <p>No vacancies available</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Quick Actions */}
              <section className="ad-card">
                <div className="ad-card-h">
                  <h2>
                    <span className="ad-card-ic">
                      <CheckCircle className="w-4 h-4" />
                    </span>
                    Quick Actions
                  </h2>
                </div>
                <div className="ad-actions">
                  <button onClick={() => navigate("/application-form?new=true")} className="ad-action ad-action-primary">
                    <span className="ad-action-ic">
                      <PlusCircle className="w-5 h-5" />
                    </span>
                    <span className="ad-action-t">
                      <strong>New Application</strong>
                      <small>Create a new application</small>
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => navigate("/application-form")} className="ad-action">
                    <span className="ad-action-ic">
                      <FileText className="w-5 h-5" />
                    </span>
                    <span className="ad-action-t">
                      <strong>My Applications</strong>
                      <small>View all applications</small>
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => navigate("/job-postings")} className="ad-action">
                    <span className="ad-action-ic">
                      <Briefcase className="w-5 h-5" />
                    </span>
                    <span className="ad-action-t">
                      <strong>Browse Jobs</strong>
                      <small>Explore opportunities</small>
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </section>

              {/* Stats Summary */}
              {dashboardData && (
                <section className="ad-card">
                  <div className="ad-card-h">
                    <h2>
                      <span className="ad-card-ic">
                        <TrendingUp className="w-4 h-4" />
                      </span>
                      Quick Stats
                    </h2>
                  </div>
                  <div className="ad-stats">
                    <div className="ad-stat">
                      <span>Total Applications</span>
                      <strong>
                        {Math.floor((dashboardData.stats?.totalApplications || 0) / 10).toLocaleString()}
                      </strong>
                    </div>
                    <div className="ad-stat">
                      <span>Approved</span>
                      <strong className="ad-stat-green">{dashboardData.statusDistribution?.Approved || 0}</strong>
                    </div>
                    <div className="ad-stat">
                      <span>Pending</span>
                      <strong className="ad-stat-amber">{dashboardData.statusDistribution?.Pending || 0}</strong>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Right Column - Notifications & Applications */}
            <div className="ad-col">
              {/* Recent Applications */}
              <section className="ad-card">
                <div className="ad-card-h">
                  <h2>
                    <span className="ad-card-ic">
                      <FileText className="w-4 h-4" />
                    </span>
                    My Applications
                  </h2>
                  <button onClick={() => navigate("/application-form")} className="ad-viewall">
                    View All →
                  </button>
                </div>
                <div className="ad-list">
                  {recentApplications.length > 0 ? (
                    recentApplications.map((app) => (
                      <div
                        key={app.id}
                        className="ad-item ad-item-link"
                        onClick={() => navigate(`/applications/view/${app.id}`)}
                      >
                        <div className="ad-item-ic">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="ad-item-body">
                          <h3>{app.candidateName}</h3>
                          <p className="ad-item-s">{app.jobPosting}</p>
                          {app.paymentStatus === "pending" && (
                            <span className="ad-pill ad-pill-pending">Payment Pending</span>
                          )}
                          {app.paymentStatus === "paid" && <span className="ad-pill ad-pill-paid">Payment Done</span>}
                        </div>
                        <span className="ad-item-cta">
                          View <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="ad-empty">
                      <FileText className="w-10 h-10" />
                      <p>No applications yet. Start by applying for a job!</p>
                      <button onClick={() => navigate("/application-form?new=true")} className="ad-btn">
                        Create Application
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Notifications */}
              <section className="ad-card">
                <div className="ad-card-h">
                  <h2>
                    <span className="ad-card-ic">
                      <Bell className="w-4 h-4" />
                    </span>
                    All Notifications
                  </h2>
                  <button onClick={() => navigate("/notifications")} className="ad-viewall">
                    View All →
                  </button>
                </div>
                <div className="ad-list ad-scroll">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`ad-item ${notif.displayLink ? "ad-item-link" : ""}`}
                        onClick={() => {
                          if (notif.displayLink) {
                            if (notif.displayLink.startsWith("http")) {
                              window.open(notif.displayLink, "_blank");
                            } else {
                              navigate(notif.displayLink);
                            }
                          }
                        }}
                      >
                        <div className={`ad-item-ic ${notif.type === "notice" ? "ad-item-ic-navy" : ""}`}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <div className="ad-item-body">
                          <h3>{notif.displayTitle || "Notification"}</h3>
                          {notif.message || notif.description ? (
                            <p className="ad-item-s line-clamp-2">{notif.message || notif.description}</p>
                          ) : null}
                          {notif.createdAt && (
                            <p className="ad-item-date">
                              {new Date(notif.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                        {notif.displayLink && <ChevronRight className="w-4 h-4 ad-item-arrow" />}
                      </div>
                    ))
                  ) : (
                    <div className="ad-empty">
                      <Bell className="w-10 h-10" />
                      <p>No notifications available</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Landing-site palette: dark-green #3F6212, green #4D7C0F, page #f9fafb.
const AD_STYLES = `
.ad-page{min-height:100vh;background:#f9fafb;padding:16px;font-family:'Segoe UI',sans-serif;color:#1f2937;}
.ad-wrap{max-width:99rem;margin:0 auto;display:flex;flex-direction:column;gap:18px;}
.ad-center{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;padding:80px 16px;color:#64748b;}
.ad-center h2{font-size:22px;font-weight:800;color:#3F6212;margin:0;}
.ad-center p{margin:0;}
.ad-error-ic{width:64px;height:64px;border-radius:50%;background:#fef2f2;color:#dc2626;display:flex;align-items:center;justify-content:center;}
.ad-btn{display:inline-flex;align-items:center;gap:6px;background:#4D7C0F;color:#fff;border:0;border-radius:6px;padding:10px 18px;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;transition:background .15s;}
.ad-btn:hover{background:#3F6212;}
.ad-btn-light{background:#fff;color:#3F6212;}
.ad-btn-light:hover{background:#ECFCCB;}
.ad-hero{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:18px;padding:26px 28px;border-radius:10px;color:#fff;position:relative;overflow:hidden;
  background:linear-gradient(100deg,#3F6212 0%,#4D7C0F 55%,#65A30D 100%);box-shadow:0 6px 16px rgba(77,124,15,.22);text-shadow:0 1px 2px rgba(26,46,5,.35);}
.ad-hero::after{content:"";position:absolute;right:-70px;top:-90px;width:260px;height:260px;border-radius:50%;background:rgba(255,255,255,.1);pointer-events:none;}
.ad-hero-text{min-width:0;flex:1 1 320px;position:relative;z-index:1;}
.ad-kicker{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#fff;font-weight:800;margin:0 0 6px;}
.ad-hero h1{font-size:26px;line-height:1.2;font-weight:800;margin:0 0 6px;word-break:break-word;}
.ad-hero-sub{font-size:14px;color:#fff;font-weight:500;margin:0;}
.ad-hero-stats{display:flex;gap:10px;flex-wrap:wrap;position:relative;z-index:1;}
.ad-hero-stat{min-width:120px;background:#fff;border:0;border-radius:8px;padding:12px 16px;box-shadow:0 4px 12px rgba(63,98,18,.18);text-shadow:none;}
.ad-hero-stat span{display:block;font-size:26px;font-weight:800;line-height:1;color:#3F6212;}
.ad-hero-stat small{display:block;font-size:12px;color:#4D7C0F;margin-top:6px;font-weight:700;}
.ad-alert{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;background:#4D7C0F;color:#fff;border-radius:10px;padding:14px 18px;box-shadow:0 6px 16px rgba(77,124,15,.25);}
.ad-alert-l{display:flex;align-items:center;gap:12px;min-width:0;flex:1 1 280px;}
.ad-alert-ic{width:40px;height:40px;border-radius:8px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.ad-alert-t{font-size:15px;font-weight:800;margin:0;}
.ad-alert-s{font-size:12px;color:#D9F99D;margin:3px 0 0;}
.ad-card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.04);overflow:hidden;}
.ad-card-h{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 18px;border-bottom:1px solid #D9F99D;}
.ad-card-h h2{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:800;color:#3F6212;margin:0;}
.ad-card-ic{width:30px;height:30px;border-radius:7px;background:#ECFCCB;color:#4D7C0F;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.ad-viewall{background:none;border:0;color:#4D7C0F;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;padding:0;}
.ad-viewall:hover{text-decoration:underline;}
.ad-flow{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:24px 18px 22px;}
.ad-step{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 6px;}
.ad-step-line{position:absolute;top:30px;left:calc(50% + 34px);right:calc(-50% + 34px);height:3px;border-radius:3px;background:#e5e7eb;}
.ad-step-completed .ad-step-line{background:#4D7C0F;}
.ad-step-ic{position:relative;width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:4px solid #fff;cursor:pointer;
  background:#e5e7eb;color:#94a3b8;box-shadow:0 4px 12px rgba(15,23,42,.12);transition:transform .15s;}
.ad-step-ic:hover{transform:scale(1.07);}
.ad-step-completed .ad-step-ic{background:#3F6212;color:#fff;}
.ad-step-current .ad-step-ic{background:#4D7C0F;color:#fff;box-shadow:0 0 0 5px #D9F99D,0 4px 12px rgba(77,124,15,.3);}
.ad-step-check{position:absolute;top:-4px;right:-4px;background:#fff;border-radius:50%;color:#059669;display:flex;padding:1px;box-shadow:0 1px 4px rgba(0,0,0,.15);}
.ad-step-n{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;margin:12px 0 2px;}
.ad-step h3{font-size:14px;font-weight:800;color:#3F6212;margin:0;}
.ad-step-upcoming h3{color:#94a3b8;}
.ad-step-d{font-size:12px;color:#64748b;margin:3px 0 8px;line-height:1.35;}
.ad-step-upcoming .ad-step-d{color:#b6c2d1;}
.ad-step-badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;background:#f1f5f9;color:#94a3b8;}
.ad-step-completed .ad-step-badge{background:#ecfdf5;color:#047857;}
.ad-step-current .ad-step-badge{background:#ECFCCB;color:#4D7C0F;}
.ad-video{max-width:48rem;width:100%;margin:0 auto;}
.ad-video-h{display:flex;align-items:center;gap:10px;background:#3F6212;color:#fff;padding:14px 18px;}
.ad-video-h h3{font-size:15px;font-weight:800;margin:0;}
.ad-video-frame{position:relative;width:100%;aspect-ratio:16/9;background:#1A2E05;}
.ad-video-loading{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#fff;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;}
.ad-grid{display:grid;grid-template-columns:minmax(280px,1fr) minmax(0,2fr);gap:18px;align-items:start;}
.ad-col{display:flex;flex-direction:column;gap:18px;min-width:0;}
.ad-list{padding:8px;}
.ad-scroll{max-height:24rem;overflow-y:auto;}
.ad-item{display:flex;align-items:flex-start;gap:12px;padding:12px;border-radius:6px;border-bottom:1px solid #f1f5f9;}
.ad-item:last-child{border-bottom:0;}
.ad-item-link{cursor:pointer;transition:background .15s;}
.ad-item-link:hover{background:#ECFCCB;}
.ad-item-ic{width:36px;height:36px;border-radius:8px;background:#ECFCCB;color:#4D7C0F;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.ad-item-ic-navy{background:#3F6212;color:#fff;}
.ad-item-body{flex:1;min-width:0;}
.ad-item-body h3{font-size:14px;font-weight:700;color:#1f2937;margin:0 0 3px;word-break:break-word;}
.ad-item-s{font-size:12px;color:#64748b;margin:0 0 6px;}
.ad-item-date{font-size:11px;color:#94a3b8;font-weight:600;margin:0;}
.ad-item-arrow{color:#94a3b8;flex-shrink:0;margin-top:10px;}
.ad-item-cta{display:inline-flex;align-items:center;gap:2px;font-size:12px;font-weight:700;color:#4D7C0F;flex-shrink:0;align-self:center;}
.ad-job{padding:12px 12px 14px;}
.ad-meta{display:flex;flex-wrap:wrap;gap:10px;font-size:11px;color:#64748b;margin:0 0 8px;}
.ad-meta span{display:inline-flex;align-items:center;gap:4px;}
.ad-pill{display:inline-block;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;border:1px solid;}
.ad-pill-paid{background:#ecfdf5;color:#047857;border-color:#a7f3d0;}
.ad-pill-pending{background:#fffbeb;color:#b45309;border-color:#fde68a;}
.ad-empty{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;padding:32px 16px;color:#cbd5e1;}
.ad-empty p{color:#64748b;font-size:13px;margin:0;}
.ad-actions{display:flex;flex-direction:column;gap:10px;padding:14px;}
.ad-action{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;cursor:pointer;color:#94a3b8;transition:background .15s,border-color .15s;}
.ad-action:hover{background:#ECFCCB;border-color:#D9F99D;}
.ad-action-ic{width:40px;height:40px;border-radius:8px;background:#ECFCCB;color:#4D7C0F;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.ad-action-t{flex:1;min-width:0;display:flex;flex-direction:column;}
.ad-action-t strong{font-size:14px;color:#3F6212;}
.ad-action-t small{font-size:12px;color:#64748b;}
.ad-action-primary{background:#4D7C0F;border-color:#4D7C0F;color:#fff;}
.ad-action-primary:hover{background:#3F6212;border-color:#3F6212;}
.ad-action-primary .ad-action-ic{background:rgba(255,255,255,.18);color:#fff;}
.ad-action-primary .ad-action-t strong{color:#fff;}
.ad-action-primary .ad-action-t small{color:#D9F99D;}
.ad-stats{display:flex;flex-direction:column;padding:6px 18px 12px;}
.ad-stat{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;font-weight:600;}
.ad-stat:last-child{border-bottom:0;}
.ad-stat strong{font-size:20px;color:#3F6212;}
.ad-stat strong.ad-stat-green{color:#047857;}
.ad-stat strong.ad-stat-amber{color:#b45309;}
@media(max-width:1024px){.ad-grid{grid-template-columns:1fr;}}
@media(max-width:768px){
  .ad-page{padding:12px;}
  .ad-hero{padding:20px;}
  .ad-hero h1{font-size:21px;}
  .ad-hero-stats{width:100%;}
  .ad-hero-stat{flex:1 1 0;min-width:0;}
  .ad-flow{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:22px;}
  .ad-step-line{display:none;}
  .ad-alert .ad-btn{width:100%;justify-content:center;}
}
@media(max-width:400px){.ad-hero-stat span{font-size:20px;}}
`;
