import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { dashboardAPI } from "../utils/api";
import {
  Users,
  Heart,
  Stethoscope,
  ClipboardList,
  FileText,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  UserCheck,
  Ambulance,
  MapPin,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
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
  AreaChart,
  Area,
} from "recharts";

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
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

  // Format stats for display
  const stats = dashboardData
    ? [
        {
          title: "Total Applicants",
          value: Math.floor(dashboardData.stats.totalApplications / 10).toLocaleString(),
          change: `+${dashboardData.stats.todayChange}%`,
          isPositive: true,
          icon: Users,
          lightColor: "bg-gradient-to-br from-green-50 to-green-100",
          textColor: "text-green-600",
        },
        {
          title: "Applications Today",
          value: Math.floor(dashboardData.stats.applicationsToday / 10).toString(),
          change: `+${dashboardData.stats.todayChange}%`,
          isPositive: parseInt(dashboardData.stats.todayChange) >= 0,
          icon: ClipboardList,
          lightColor: "bg-gradient-to-br from-emerald-50 to-emerald-100",
          textColor: "text-emerald-600",
        },
        {
          title: "Active Job Postings",
          value: dashboardData.stats.activeJobPostings.toString(),
          change: "+0%",
          isPositive: true,
          icon: Stethoscope,
          lightColor: "bg-gradient-to-br from-teal-50 to-teal-100",
          textColor: "text-teal-600",
        },
        {
          title: "Total Job Postings",
          value: dashboardData.stats.totalJobPostings.toString(),
          change: "+0%",
          isPositive: true,
          icon: Heart,
          lightColor: "bg-gradient-to-br from-lime-50 to-lime-100",
          textColor: "text-lime-600",
        },
      ]
    : [];

  const enrollmentData = dashboardData?.enrollmentData || [];

  // Convert status distribution to category data for pie chart
  const categoryData = dashboardData?.statusDistribution
    ? Object.entries(dashboardData.statusDistribution)
        .map(([name, value], index) => {
          const colors = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"];
          return {
            name: name || "Pending",
            value: value,
            color: colors[index % colors.length],
          };
        })
        .filter((item) => item.value > 0)
    : [];

  // Use district distribution for age/group chart (as we don't have age data)
  const ageData = dashboardData?.districtDistribution
    ? dashboardData.districtDistribution.map((item) => ({
        group: item._id || "Unknown",
        count: item.count,
      }))
    : [];

  const recentApplicants = dashboardData?.recentApplications || [];

  // Generate recent activities from recent applications
  const recentActivities = recentApplicants.slice(0, 4).map((app) => {
    const timeAgo = (date) => {
      const now = new Date();
      const diff = now - new Date(date);
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (minutes < 60) return `${minutes} min ago`;
      if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
      return `${days} day${days > 1 ? "s" : ""} ago`;
    };

    return {
      action: "New application submitted",
      detail: `${app.name} - ${app.district}`,
      time: timeAgo(app.createdAt),
      icon: FileText,
    };
  });

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-white p-4">
          <div className="max-w-[99rem] ml-2 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-gray-100 rounded-sm shadow-sm p-6 animate-pulse"
                >
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#3AB000]"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
        <div className="min-h-screen bg-white p-4">
          <div className="max-w-[99rem] ml-2 mx-auto">
            <div className="text-center py-12">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Failed to Load Dashboard
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-[#3AB000] text-white px-6 py-2 rounded hover:bg-[#2d8a00] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-[99rem] ml-2 mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-sm shadow-sm p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 hover:scale-105 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`${stat.lightColor} p-4 rounded-sm shadow-sm group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className={`w-7 h-7 ${stat.textColor}`} />
                    </div>
                    <span
                      className={`flex items-center text-sm font-bold px-3 py-1 rounded-full ${
                        stat.isPositive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {stat.isPositive ? (
                        <ArrowUp className="w-4 h-4 mr-1" />
                      ) : (
                        <ArrowDown className="w-4 h-4 mr-1" />
                      )}
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-gray-600 text-sm font-semibold mb-2">
                    {stat.title}
                  </h3>
                  <p className="text-4xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-4">
            {/* Applicant Growth Chart */}
            <div className="bg-gradient-to-br from-white to-green-50 rounded-sm shadow-sm p-6 border border-green-200 hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    Applicant Growth
                  </h2>
                  <p className="text-sm text-gray-600">
                    Monthly registration trend
                  </p>
                </div>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 border-2 border-green-200 rounded-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm hover:border-green-300 transition-colors"
                >
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={enrollmentData.length > 0 ? enrollmentData : [{ month: "No Data", applicants: 0 }]}>
                  <defs>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    stroke="#9ca3af"
                    style={{ fontSize: "12px", fontWeight: "600" }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    style={{ fontSize: "12px", fontWeight: "600" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "2px solid #bbf7d0",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="applicants"
                    stroke="#16a34a"
                    strokeWidth={4}
                    fill="url(#greenGrad)"
                    dot={{
                      fill: "#16a34a",
                      r: 6,
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 8, strokeWidth: 2, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Service Distribution Chart */}
            <div className="bg-gradient-to-br from-white to-emerald-50 rounded-sm shadow-sm p-6 border border-emerald-200 hover:shadow-xl transition-all duration-300">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Application Status Distribution
                </h2>
                <p className="text-sm text-gray-600">
                  Applications by status
                </p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData.length > 0 ? categoryData : [{ name: "No Data", value: 1, color: "#e5e7eb" }]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={90}
                    dataKey="value"
                    strokeWidth={3}
                    stroke="#fff"
                  >
                    {(categoryData.length > 0 ? categoryData : [{ name: "No Data", value: 1, color: "#e5e7eb" }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "2px solid #a7f3d0",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Age Distribution */}
          <div className="bg-gradient-to-br from-white to-teal-50 rounded-sm shadow-sm p-6 mb-4 border border-teal-200 hover:shadow-xl transition-all duration-300">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                District Distribution
              </h2>
              <p className="text-sm text-gray-600">
                Applications by district
              </p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ageData.length > 0 ? ageData : [{ group: "No Data", count: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="group"
                  stroke="#9ca3af"
                  style={{ fontSize: "12px", fontWeight: "600" }}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: "12px", fontWeight: "600" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "2px solid #99f6e4",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="count" fill="#16a34a" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Applicants Table & Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-4">
            {/* Applicants Table */}
            <div className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 rounded-sm shadow-sm p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    Recent Applicants
                  </h2>
                  <p className="text-sm text-gray-600">
                    Latest application submissions
                  </p>
                </div>
                <button
                  onClick={() => (window.location.href = "/application-form")}
                  className="text-green-600 text-sm font-bold hover:text-green-700 px-4 py-2 rounded-sm hover:bg-green-50 transition-colors"
                >
                  View All →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      {["App ID", "Name", "Village", "Service", "Status"].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left py-4 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {recentApplicants.length > 0 ? (
                      recentApplicants.map((a) => (
                        <tr
                          key={a.id}
                          className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-green-50 hover:to-transparent transition-all duration-200"
                        >
                          <td className="py-4 px-4 text-sm font-bold text-gray-800">
                            {a.id.slice(-6).toUpperCase()}
                          </td>
                          <td className="py-4 px-4 text-sm font-medium text-gray-700">
                            {a.name}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {a.district}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {a.service}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm border ${
                                a.status === "Approved"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : a.status === "Pending"
                                    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                    : a.status === "Active"
                                      ? "bg-blue-100 text-blue-700 border-blue-200"
                                      : "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                            >
                              {a.status || "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          No recent applications
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-sm shadow-sm p-6 border-2 border-green-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-2 rounded-lg shadow-md">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Quick Stats
                  </h2>
                  <p className="text-xs text-gray-600">Performance overview</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  {
                    label: "Approval Rate",
                    value: `${dashboardData?.stats.approvalRate || "0"}%`,
                    sub: "Last 30 days",
                    color: "from-green-500 to-green-600",
                  },
                  {
                    label: "Total Applications",
                    value: Math.floor((dashboardData?.stats.totalApplications || 0) / 10).toLocaleString(),
                    sub: "All time",
                    color: "from-emerald-500 to-emerald-600",
                  },
                  {
                    label: "Active Postings",
                    value: dashboardData?.stats.activeJobPostings.toString() || "0",
                    sub: "Job postings",
                    color: "from-teal-500 to-teal-600",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-sm bg-white border-2 border-green-200 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                  >
                    <div
                      className={`w-14 h-14 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                    >
                      {item.value}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-sm">
                        {item.label}
                      </h3>
                      <p className="text-xs text-gray-600 font-medium">
                        {item.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-gradient-to-br from-white to-green-50 rounded-sm shadow-sm p-6 border border-green-200 hover:shadow-xl transition-all duration-300">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Recent Activities
              </h2>
              <p className="text-sm text-gray-600">Latest updates and events</p>
            </div>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 hover:bg-white rounded-sm transition-all duration-200 border border-transparent hover:border-green-200 hover:shadow-md group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-600 font-medium">
                        {activity.detail}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold bg-gray-100 px-3 py-2 rounded-lg">
                      <Clock className="w-4 h-4" />
                      {activity.time}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
