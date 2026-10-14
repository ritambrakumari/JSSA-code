import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { dashboardAPI, createPaperAPI } from "../utils/api";
import ScrollerCarousel from "../components/Scroller/ScrollerCarousel";
import {
  FileText,
  Briefcase,
  Settings,
  PlusCircle,
  Eye,
  TrendingUp,
  ArrowRight,
  CreditCard,
  BarChart3,
  Activity,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Zap,
  PieChart as PieIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Landing page theme (navy / blue) — UI only, data & API same as before
const BLUE = "#4D7C0F";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await dashboardAPI.getStats();
        if (response.success && response.data) {
          setDashboardData(response.data);
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

  // MOU pending count is hidden on the dashboard for now (application fee only).

  // Format stats for display (actual counts from the API)
  const stats = dashboardData
    ? [
        {
          title: "Total Applications",
          value: (dashboardData.stats.totalApplications || 0).toLocaleString(),
          change: `+${dashboardData.stats.todayChange}%`,
          isPositive: true,
          icon: FileText,
          link: "/application-form",
        },
        {
          title: "Applications Today",
          value: (dashboardData.stats.applicationsToday || 0).toLocaleString(),
          change: `+${dashboardData.stats.todayChange}%`,
          isPositive: parseInt(dashboardData.stats.todayChange) >= 0,
          icon: TrendingUp,
          link: "/application-form",
        },
        {
          title: "Active Job Postings",
          value: dashboardData.stats.activeJobPostings.toString(),
          change: "+0%",
          isPositive: true,
          icon: Briefcase,
          link: "/job-postings",
        },
        {
          title: "Paid Applications",
          value: (dashboardData.stats.totalPaidApplications || 0).toLocaleString(),
          change: "Total Paid",
          isPositive: true,
          icon: CheckCircle2,
          link: "/application-form",
        },
        (() => {
          // Application fee pending: from the existing statusDistribution (payment status counts)
          const appPending = Object.entries(dashboardData.statusDistribution || {})
            .filter(([k]) => String(k || "pending").toLowerCase() === "pending")
            .reduce((sum, [, v]) => sum + (Number(v) || 0), 0);
          return {
            title: "Pending",
            value: appPending.toLocaleString(),
            change: "Awaiting",
            chipClass: "adm-chip-warn",
            icon: Clock,
            link: "/application-form",
            breakdown: [
              { label: "Application Form", value: appPending, link: "/application-form" },
            ],
          };
        })(),
      ]
    : [];

  const enrollmentData = dashboardData?.enrollmentData || [];
  const recentApplicants = dashboardData?.recentApplications || [];

  // Quick Actions
  const quickActions = [
    {
      title: "Add Job Posting",
      description: "Create a new job posting",
      icon: PlusCircle,
      action: () => {
        const event = new CustomEvent("openJobPostingModal");
        window.dispatchEvent(event);
        navigate("/job-postings");
      },
    },
    {
      title: "View Applications",
      description: "Manage all applications",
      icon: Eye,
      action: () => navigate("/application-form"),
    },
    {
      title: "Payment Settings",
      description: "Manage Razorpay credentials",
      icon: CreditCard,
      action: () => navigate("/settings"),
    },
    {
      title: "Manage Settings",
      description: "Configure system settings",
      icon: Settings,
      action: () => navigate("/settings"),
    },
  ];

  // Status distribution for pie chart
  const categoryData = dashboardData?.statusDistribution
    ? Object.entries(dashboardData.statusDistribution)
        .map(([name, value], index) => {
          const colors = ["#4D7C0F", "#f59e0b", "#dc2626", "#3F6212", "#6366f1"];
          const key = String(name || "pending").toLowerCase();
          // Fixed colours per payment status: paid = blue, pending = orange, failed = red
          const fixed = key.includes("fail")
            ? "#dc2626"
            : key === "paid"
              ? "#4D7C0F"
              : key === "pending"
                ? "#f59e0b"
                : key.includes("refund")
                  ? "#6366f1"
                  : null;
          return {
            name: name || "Pending",
            value: value || 0,
            color: fixed || colors[index % colors.length],
          };
        })
        .filter((item) => item.value > 0)
    : [];

  // District distribution
  const districtData = dashboardData?.districtDistribution
    ? dashboardData.districtDistribution.map((item) => ({
        district: item._id || "Unknown",
        count: item.count,
      }))
    : [];

  const tooltipStyle = {
    backgroundColor: "white",
    border: "1px solid #D9F99D",
    borderRadius: "8px",
    fontSize: "12px",
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="adm-page">
          <style>{ADM_STYLES}</style>
          <div className="adm-wrap">
            <div className="adm-skel-hero" />
            <div className="adm-center">
              <div className="adm-spinner" />
              <p>Loading dashboard...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="adm-page">
          <style>{ADM_STYLES}</style>
          <div className="adm-wrap">
            <div className="adm-center">
              <div className="adm-error-ic">
                <AlertCircle size={34} />
              </div>
              <h2>Failed to Load Dashboard</h2>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="adm-btn">
                Retry
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const paymentStatusClass = (s) =>
    s === "paid" ? "adm-pill-paid" : s === "pending" ? "adm-pill-pending" : "adm-pill-failed";

  return (
    <DashboardLayout activePath="/admin/dashboard">
      <div className="adm-page">
        <style>{ADM_STYLES}</style>
        <div className="adm-wrap">
          {/* Scroller Carousel */}
          <ScrollerCarousel />

          {/* Hero banner — same look as landing / applicant pages */}
          <section className="adm-hero">
            <div className="adm-hero-text">
              <p className="adm-kicker">Admin Dashboard</p>
              <h1>Jan Swasthya Sahayata Abhiyan</h1>
              <p className="adm-hero-sub">Manage applications, job postings, and system settings</p>
            </div>
            <div className="adm-hero-actions">
              <button className="adm-btn adm-btn-light" onClick={quickActions[0].action}>
                <PlusCircle size={16} /> Add Job Posting
              </button>
              <button className="adm-btn adm-btn-ghost" onClick={() => navigate("/application-form")}>
                <Eye size={16} /> View Applications
              </button>
            </div>
          </section>

          {/* Stats */}
          <div className="adm-stats">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => stat.link && navigate(stat.link)}
                  className="adm-stat"
                >
                  <div className="adm-stat-top">
                    <span className="adm-stat-ic">
                      <Icon size={20} />
                    </span>
                    <span className={`adm-chip ${stat.chipClass || (stat.isPositive ? "adm-chip-up" : "adm-chip-down")}`}>
                      {stat.change}
                    </span>
                  </div>
                  <p className="adm-stat-val">{stat.value}</p>
                  <p className="adm-stat-label">{stat.title}</p>
                  {stat.breakdown && (
                    <div className="adm-stat-split">
                      {stat.breakdown.map((b) => (
                        <span
                          key={b.label}
                          role="link"
                          tabIndex={0}
                          className="adm-stat-split-row"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(b.link);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.stopPropagation();
                              navigate(b.link);
                            }
                          }}
                        >
                          <span>{b.label}</span>
                          <strong>{b.value === null || b.value === undefined ? "…" : Number(b.value).toLocaleString()}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <section className="adm-card">
            <div className="adm-card-h">
              <h2>
                <span className="adm-card-ic"><Zap size={16} /></span> Quick Actions
              </h2>
            </div>
            <div className="adm-actions">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button key={index} type="button" onClick={action.action} className="adm-action">
                    <span className="adm-action-ic">
                      <Icon size={20} />
                    </span>
                    <span className="adm-action-txt">
                      <strong>{action.title}</strong>
                      <small>{action.description}</small>
                    </span>
                    <ArrowRight size={16} className="adm-action-arrow" />
                  </button>
                );
              })}
            </div>
          </section>

          {/* Charts Row */}
          <div className="adm-grid">
            <section className="adm-card">
              <div className="adm-card-h">
                <h2>
                  <span className="adm-card-ic"><Activity size={16} /></span> Application Growth
                </h2>
                <span className="adm-card-sub">Monthly registration trend</span>
              </div>
              <div className="adm-chart">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={enrollmentData.length > 0 ? enrollmentData : [{ month: "No Data", applicants: 0 }]}>
                    <defs>
                      <linearGradient id="admBlueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BLUE} stopOpacity={0.22} />
                        <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D9F99D" />
                    <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="applicants"
                      stroke={BLUE}
                      strokeWidth={3}
                      fill="url(#admBlueGrad)"
                      dot={{ fill: BLUE, r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="adm-card">
              <div className="adm-card-h">
                <h2>
                  <span className="adm-card-ic"><PieIcon size={16} /></span> Payment Status
                </h2>
                <span className="adm-card-sub">Distribution by payment status</span>
              </div>
              <div className="adm-chart">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categoryData.length > 0 ? categoryData : [{ name: "No Data", value: 1, color: "#e5e7eb" }]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name.toUpperCase()}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      dataKey="value"
                    >
                      {(categoryData.length > 0 ? categoryData : [{ name: "No Data", value: 1, color: "#e5e7eb" }]).map((entry, index) => {
                        let fillColor = entry.color;
                        const status = entry.name.toLowerCase();
                        if (status === "paid") fillColor = "#4D7C0F";
                        if (status === "pending") fillColor = "#f59e0b";
                        if (status.includes("fail")) fillColor = "#dc2626";
                        return <Cell key={`cell-${index}`} fill={fillColor} />;
                      })}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* Payment Management */}
          <section className="adm-card">
            <div className="adm-card-h">
              <h2>
                <span className="adm-card-ic"><CreditCard size={16} /></span> Payment Management
              </h2>
              <button onClick={() => navigate("/settings")} className="adm-btn adm-btn-sm">
                <Settings size={14} /> Manage Credentials
              </button>
            </div>
            <div className="adm-pay">
              <div className="adm-pay-box">
                <div className="adm-pay-top">
                  <span>Payment Gateway</span>
                  <CheckCircle size={18} color="#16a34a" />
                </div>
                <p className="adm-pay-val">Razorpay</p>
                <small>Payment processing enabled</small>
              </div>
              <div className="adm-pay-box">
                <div className="adm-pay-top">
                  <span>Test Mode</span>
                  <AlertCircle size={18} color="#d97706" />
                </div>
                <p className="adm-pay-val">Active</p>
                <small>Using test credentials</small>
              </div>
              <div className="adm-pay-box">
                <div className="adm-pay-top">
                  <span>Quick Actions</span>
                  <ArrowRight size={18} color={BLUE} />
                </div>
                <button onClick={() => navigate("/settings")} className="adm-link">
                  Configure Settings →
                </button>
                <small>Update credentials &amp; preferences</small>
              </div>
            </div>
          </section>

          {/* District Distribution & Recent Applications */}
          <div className="adm-grid">
            <section className="adm-card">
              <div className="adm-card-h">
                <h2>
                  <span className="adm-card-ic"><MapPin size={16} /></span> District Distribution
                </h2>
                <span className="adm-card-sub">Applications by district</span>
              </div>
              <div className="adm-chart">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={districtData.length > 0 ? districtData : [{ district: "No Data", count: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D9F99D" />
                    <XAxis dataKey="district" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#ECFCCB" }} />
                    <Bar dataKey="count" fill={BLUE} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="adm-card">
              <div className="adm-card-h">
                <h2>
                  <span className="adm-card-ic"><BarChart3 size={16} /></span> Recent Applications
                </h2>
                <button onClick={() => navigate("/application-form")} className="adm-link">
                  View All →
                </button>
              </div>
              <div className="adm-recent">
                {recentApplicants.length > 0 ? (
                  recentApplicants.slice(0, 5).map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => navigate(`/applications/view/${app.id}`)}
                      className="adm-recent-row"
                    >
                      <span className="adm-avatar">
                        {(app.name || "?").trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="adm-recent-txt">
                        <strong>{app.name}</strong>
                        <small>{app.district}</small>
                      </span>
                      <span className={`adm-pill ${paymentStatusClass(app.paymentStatus)}`}>
                        {app.paymentStatus || "Pending"}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="adm-empty">No recent applications</div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

const ADM_STYLES = `
.adm-page{min-height:100vh;background:#f3f6fb;padding:16px;font-family:'Segoe UI',sans-serif;color:#1f2937;}
.adm-wrap{max-width:99rem;margin:0 auto;display:flex;flex-direction:column;gap:18px;}
.adm-center{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;padding:70px 16px;color:#64748b;}
.adm-center h2{font-size:22px;font-weight:800;color:#3F6212;margin:0;}
.adm-center p{margin:0;}
.adm-spinner{width:44px;height:44px;border-radius:50%;border:4px solid #D9F99D;border-top-color:#4D7C0F;animation:admSpin .8s linear infinite;}
@keyframes admSpin{to{transform:rotate(360deg)}}
.adm-skel-hero{height:130px;border-radius:10px;background:linear-gradient(90deg,#ECFCCB 0%,#F7FEE7 50%,#ECFCCB 100%);background-size:200% 100%;animation:admShimmer 1.2s linear infinite;}
@keyframes admShimmer{from{background-position:200% 0}to{background-position:-200% 0}}
.adm-error-ic{width:64px;height:64px;border-radius:50%;background:#fef2f2;color:#dc2626;display:flex;align-items:center;justify-content:center;}

.adm-btn{display:inline-flex;align-items:center;gap:6px;background:#4D7C0F;color:#fff;border:0;border-radius:6px;padding:10px 18px;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;transition:background .15s,transform .15s;text-shadow:none;}
.adm-btn:hover{background:#3F6212;}
.adm-btn-sm{padding:8px 14px;font-size:12px;}
.adm-btn-light{background:#fff;color:#3F6212;box-shadow:0 4px 12px rgba(63,98,18,.18);}
.adm-btn-light:hover{background:#ECFCCB;}
.adm-btn-ghost{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.55);color:#fff;}
.adm-btn-ghost:hover{background:rgba(255,255,255,.28);}
.adm-link{background:none;border:0;padding:0;color:#4D7C0F;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;text-align:left;}
.adm-link:hover{color:#3F6212;text-decoration:underline;}

.adm-hero{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:18px;padding:26px 28px;border-radius:10px;color:#fff;position:relative;overflow:hidden;
  background:linear-gradient(100deg,#3F6212 0%,#4D7C0F 55%,#65A30D 100%);box-shadow:0 6px 16px rgba(77,124,15,.22);text-shadow:0 1px 2px rgba(26,46,5,.35);}
.adm-hero::after{content:"";position:absolute;right:-70px;top:-90px;width:260px;height:260px;border-radius:50%;background:rgba(255,255,255,.1);pointer-events:none;}
.adm-hero-text{min-width:0;flex:1 1 320px;position:relative;z-index:1;}
.adm-kicker{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;margin:0 0 6px;}
.adm-hero h1{font-size:26px;line-height:1.2;font-weight:800;margin:0 0 6px;}
.adm-hero-sub{font-size:14px;font-weight:500;margin:0;}
.adm-hero-actions{display:flex;gap:10px;flex-wrap:wrap;position:relative;z-index:1;}

.adm-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;}
.adm-stat{display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;background:#fff;border:1px solid #e5e7eb;border-top:3px solid #4D7C0F;border-radius:8px;padding:16px 18px;text-align:left;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.04);transition:box-shadow .2s,transform .2s;font-family:inherit;}
.adm-stat:hover{box-shadow:0 8px 20px rgba(18,59,104,.12);transform:translateY(-2px);}
.adm-stat-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.adm-stat-ic{width:40px;height:40px;border-radius:8px;background:#ECFCCB;color:#4D7C0F;display:flex;align-items:center;justify-content:center;}
.adm-chip{font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px;}
.adm-chip-up{background:#e8f6ee;color:#15803d;}
.adm-chip-down{background:#fdecec;color:#b91c1c;}
.adm-chip-warn{background:#fff7e6;color:#b45309;}
.adm-stat-split{display:flex;flex-direction:column;gap:4px;margin-top:10px;padding-top:8px;border-top:1px dashed #e5e7eb;}
.adm-stat-split-row{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;color:#475569;padding:3px 6px;border-radius:4px;cursor:pointer;}
.adm-stat-split-row:hover{background:#fff7e6;color:#b45309;}
.adm-stat-split-row strong{color:#b45309;font-weight:800;}
.adm-stat-val{font-size:28px;line-height:1;font-weight:800;color:#3F6212;margin:0 0 6px;}
.adm-stat-label{font-size:13px;font-weight:600;color:#64748b;margin:0;}

.adm-card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.04);overflow:hidden;min-width:0;}
.adm-card-h{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px 12px;padding:14px 18px;border-bottom:1px solid #D9F99D;}
.adm-card-h h2{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:800;color:#1A2E05;margin:0;}
.adm-card-ic{width:30px;height:30px;border-radius:7px;background:#ECFCCB;color:#4D7C0F;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.adm-card-sub{font-size:12px;color:#64748b;}
.adm-chart{padding:14px 10px 8px 0;}

.adm-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:16px 18px 18px;}
.adm-action{display:flex;align-items:center;gap:12px;text-align:left;background:#ECFCCB;border:1px solid #D9F99D;border-left:4px solid #4D7C0F;border-radius:6px;padding:14px;cursor:pointer;transition:background .15s,box-shadow .15s;font-family:inherit;min-width:0;}
.adm-action:hover{background:#D9F99D;box-shadow:0 4px 12px rgba(63,98,18,.1);}
.adm-action-ic{width:40px;height:40px;border-radius:8px;background:#4D7C0F;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.adm-action-txt{display:flex;flex-direction:column;min-width:0;flex:1;}
.adm-action-txt strong{font-size:14px;color:#1A2E05;}
.adm-action-txt small{font-size:12px;color:#64748b;margin-top:2px;}
.adm-action-arrow{color:#4D7C0F;flex-shrink:0;transition:transform .15s;}
.adm-action:hover .adm-action-arrow{transform:translateX(3px);}

.adm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;}

.adm-pay{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:16px 18px 18px;}
.adm-pay-box{background:#ECFCCB;border:1px solid #D9F99D;border-radius:6px;padding:14px 16px;display:flex;flex-direction:column;gap:4px;}
.adm-pay-top{display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:600;color:#475569;margin-bottom:4px;}
.adm-pay-val{font-size:22px;font-weight:800;color:#3F6212;margin:0;}
.adm-pay-box small{font-size:12px;color:#64748b;}

.adm-recent{display:flex;flex-direction:column;padding:6px 18px 12px;}
.adm-recent-row{display:flex;align-items:center;gap:12px;padding:12px 4px;border:0;border-bottom:1px solid #D9F99D;background:none;cursor:pointer;text-align:left;font-family:inherit;transition:background .15s;}
.adm-recent-row:last-child{border-bottom:0;}
.adm-recent-row:hover{background:#ECFCCB;}
.adm-avatar{width:38px;height:38px;border-radius:50%;background:#ECFCCB;color:#4D7C0F;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.adm-recent-txt{display:flex;flex-direction:column;min-width:0;flex:1;}
.adm-recent-txt strong{font-size:14px;color:#1A2E05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.adm-recent-txt small{font-size:12px;color:#64748b;}
.adm-pill{font-size:11px;font-weight:800;text-transform:capitalize;padding:4px 10px;border-radius:999px;border:1px solid;flex-shrink:0;}
.adm-pill-paid{background:#e8f6ee;color:#15803d;border-color:#bbe5c9;}
.adm-pill-pending{background:#fff7e6;color:#9a4b00;border-color:#fcd9a0;}
.adm-pill-failed{background:#fdecec;color:#b91c1c;border-color:#f6c4c4;}
.adm-empty{text-align:center;color:#64748b;padding:32px 0;font-size:14px;}

@media(max-width:1200px){.adm-actions{grid-template-columns:repeat(2,minmax(0,1fr));}.adm-stats{grid-template-columns:repeat(3,minmax(0,1fr));}}
@media(max-width:1024px){.adm-stats{grid-template-columns:repeat(2,minmax(0,1fr));}.adm-grid{grid-template-columns:1fr;}}
@media(max-width:768px){
  .adm-page{padding:12px;}
  .adm-hero{padding:20px;}
  .adm-hero h1{font-size:21px;}
  .adm-pay{grid-template-columns:1fr;}
}
@media(max-width:560px){
  .adm-actions{grid-template-columns:1fr;}
  .adm-stats{gap:10px;}
  .adm-stat{padding:14px;}
  .adm-stat-val{font-size:22px;}
  .adm-hero-actions{width:100%;}
  .adm-hero-actions .adm-btn{flex:1;justify-content:center;}
}
`;
