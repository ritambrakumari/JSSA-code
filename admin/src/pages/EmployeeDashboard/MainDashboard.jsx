import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  Target,
  Users,
  UserCheck,
  Clock,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  RefreshCw,
  Video,
  Youtube,
  FileText,
  Calendar,
  X,
  History
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import ZoneLockEmptyState from "../../components/ZoneLockEmptyState";
import { useAuth } from "../../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { blogAPI } from "../../utils/api";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const GREEN = "#4D7C0F";

const MainDashboard = () => {
  const { isZoneLocked, employeeProfile, refreshProfile } = useAuth();
  const [data, setData] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [ongoingSessions, setOngoingSessions] = useState([]);
  const [recentBlogs, setRecentBlogs] = useState([]);

  // Target History States
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Wallet History States
  const [isWalletHistoryOpen, setIsWalletHistoryOpen] = useState(false);
  const [walletHistoryData, setWalletHistoryData] = useState([]);
  const [walletHistoryLoading, setWalletHistoryLoading] = useState(false);

  const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/goal-config/target-history`, {
        headers: { Authorization: `Bearer ${authData.token}` }
      });
      if (res.data.success) {
        setHistoryData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchWalletHistory = async () => {
    try {
      setWalletHistoryLoading(true);
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/wallet/history?page=1&limit=20&type=WALLET`, {
        headers: { Authorization: `Bearer ${authData.token}` }
      });
      if (res.data.success) {
        setWalletHistoryData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching wallet history:", err);
      toast.error("Failed to load wallet history");
    } finally {
      setWalletHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (showHistory && historyData.length === 0) {
      fetchHistory();
    }
  }, [showHistory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    await fetchInvitations();
    setRefreshing(false);
  };



  const handleInviteAction = async (inviteId, status, roomId) => {
    try {
      setActionLoading(true);
      const token = JSON.parse(localStorage.getItem("jssa_auth") || "{}").token;
      await axios.post(`${import.meta.env.VITE_API_URL}/meetings/invitation/status`,
        { invitationId: inviteId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (status === 'accepted') {
        const invite = invitations.find(inv => inv._id === inviteId);
        const meeting = invite?.meetingId;

        if ((meeting?.platform === 'gmeet' || meeting?.platform === 'youtube') && meeting?.externalUrl) {
          window.open(meeting.externalUrl.startsWith('http') ? meeting.externalUrl : `https://${meeting.externalUrl}`, '_blank');
          setInvitations(invitations.filter(inv => inv._id !== inviteId));
        } else {
          navigate(`/meeting/${roomId}`);
        }
      } else {
        setInvitations(invitations.filter(inv => inv._id !== inviteId));
        toast.success("Invitation dismissed");
      }
    } catch (error) {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;

      const requests = [
        axios.get(`${import.meta.env.VITE_API_URL}/goal-config/my-stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/goal-config/attendance/status`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/meetings/invitations`, { headers: { Authorization: `Bearer ${token}` } }),
        blogAPI.getAll().catch(() => ({ success: false })),
        axios.get(`${import.meta.env.VITE_API_URL}/goal-config/rm-stats`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        axios.get(`${import.meta.env.VITE_API_URL}/goal-config/employee-configs`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
      ];

      const [configRes, attendanceRes, inviteRes, blogsRes, rmStatsRes, rmConfigRes] = await Promise.all(requests);

      if (configRes.data.success) {
        const dashboardData = configRes.data.data;
        if (rmStatsRes?.data?.success) {
          dashboardData.rmStats = rmStatsRes.data.data;
        }
        if (rmConfigRes?.data?.success) {
          const rmConf = rmConfigRes.data.data.find(c => c.role === 'RM');
          if (rmConf) {
            let salary = rmConf.baseSalary || 35500;
            const empState = employeeProfile?.workingState || employeeProfile?.jobPostingId?.state || '';
            if (empState && rmConf.stateSalaries && rmConf.stateSalaries.length > 0) {
              const cleanState = empState.split(" / ")[0].trim();
              const stateObj = rmConf.stateSalaries.find(s => s.state?.toLowerCase() === cleanState.toLowerCase());
              if (stateObj && stateObj.salary) {
                salary = stateObj.salary;
              }
            }
            dashboardData.rmBaseSalary = salary;
          }
        }
        setData(dashboardData);
      }
      if (attendanceRes.data.success) setAttendance(attendanceRes.data.data);
      if (inviteRes.data.success) {
        setInvitations(inviteRes.data.data);
        setPendingInvitations(inviteRes.data.data.filter(inv => inv.status === 'pending'));
        setOngoingSessions(inviteRes.data.data.filter(inv => inv.status === 'accepted'));
      }
      if (blogsRes && blogsRes.success) {
        setRecentBlogs(blogsRes.data.slice(0, 5)); // show latest 5 blogs
      }
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };



  const fetchInvitations = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;
      if (!token) return;

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/meetings/invitations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        // Only show toast if new invitation arrived
        if (res.data.data.filter(i => i.status === 'pending').length > pendingInvitations.length) {
          toast.success("New Meeting Invitation Received!", {
            icon: '📞',
            style: {
              borderRadius: '0px',
              background: '#4D7C0F',
              color: '#fff',
              fontWeight: '900',
              textTransform: 'uppercase',
              fontSize: '10px',
              letterSpacing: '0.1em'
            }
          });
        }
        setInvitations(res.data.data);
        setPendingInvitations(res.data.data.filter(inv => inv.status === 'pending'));
        setOngoingSessions(res.data.data.filter(inv => inv.status === 'accepted'));
      }
    } catch (error) {
      console.error("Fetch Invitations Error:", error);
    }
  };

  useEffect(() => {
    fetchData();

    const handleStatusChange = () => {
      fetchData();
    };
    window.addEventListener("attendance_status_changed", handleStatusChange);

    // Poll for new invitations every 30 seconds
    const interval = setInterval(fetchInvitations, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("attendance_status_changed", handleStatusChange);
    };
  }, []);

  const handleAttendanceAction = async (type) => {
    try {
      setActionLoading(true);
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;

      // Get location
      let location = null;
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
      } catch (err) {
        console.warn("Location access denied");
      }

      const endpoint = type === "check-in" ? "check-in" : "check-out";
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/goal-config/attendance/${endpoint}`,
        { location },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        setAttendance(res.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Attendance action failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 size={40} className="animate-spin text-[#4D7C0F]" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Synchronizing Dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  const { config, stats, role, rmStats, rmBaseSalary } = data || {};
  const isRM = role === 'RM' || employeeProfile?.jobPostingId?.post?.en?.toLowerCase() === "regional manager";

  const progress = (current, target) => {
    if (!target || target === 0) return 100;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  let globalPR = 0;
  let dynamicSalaryWallet = employeeProfile?.salaryWallet || 0;

  if (isRM && rmStats?.teamBreakdown) {
    let totalTarget = 0;
    let totalAchieved = 0;
    ['dm', 'bs', 'pe'].forEach(key => {
      const item = rmStats.teamBreakdown[key];
      if (item) {
        totalTarget += item.totalTarget;
        totalAchieved += item.achieved;
      }
    });
    if (totalTarget > 0) {
      globalPR = Math.min(Math.round((totalAchieved / totalTarget) * 100), 100);
    }

    // Backend automatically credits this to salaryWallet if globalPR >= 75
    // Use the latest salaryWallet returned by rmStats if available
    if (rmStats?.salaryWallet !== undefined) {
      dynamicSalaryWallet = rmStats.salaryWallet;
    }
  }

  return (
    <DashboardLayout>
      <style>{EMP_LANDING_CSS}</style>
      <div className="emp-land p-6 space-y-6 w-full bg-[#f3f6fb] min-h-full">
        {!isZoneLocked ? (
          <div className="py-10">
            <ZoneLockEmptyState
              title="Dashboard Performance Locked"
              description="Your statistics and performance goals will be activated once your working jurisdiction is confirmed and locked."
            />
          </div>
        ) : (
          <>
            {/* Active Meeting Invitations - Enhanced Premium UI */}
            {pendingInvitations.length > 0 && (
              (() => {
                const inv = pendingInvitations[0];
                const isYouTube = inv.meetingId?.platform === 'youtube';

                return (
                  <div className="mb-8 relative group">
                    <div className={`absolute -inset-1 bg-gradient-to-r ${isYouTube ? 'from-[#FF0000] to-[#ff4d4d]' : 'from-[#4D7C0F] to-[#65A30D]'} blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200`}></div>
                    <div className={`relative ${isYouTube ? 'bg-[#FF0000]' : 'bg-[#4D7C0F]'} p-0 shadow-2xl flex flex-col md:flex-row items-stretch border-2 border-white/20`}>
                      {/* Left Accent Bar */}
                      <div className="w-2 bg-white/30 hidden md:block" />

                      <div className="flex-1 p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                        {/* Background Decorative Icon */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none transform translate-x-1/4">
                          {isYouTube ? <Youtube size={240} strokeWidth={1} className="text-white" /> : <Video size={240} strokeWidth={1} className="text-white" />}
                        </div>

                        <div className="flex items-center gap-6 relative z-10">
                          <div className="relative">
                            <div className={`w-20 h-20 bg-white ${isYouTube ? 'text-[#FF0000]' : 'text-[#4D7C0F]'} flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]`}>
                              {isYouTube ? <Youtube size={44} strokeWidth={2.5} className="animate-pulse" /> : <Video size={36} strokeWidth={2.5} className="animate-pulse" />}
                            </div>
                            {pendingInvitations.length > 1 && (
                              <div className="absolute -top-2 -right-2 w-8 h-8 bg-black text-white border-4 border-white flex items-center justify-center font-black text-[10px]">
                                {pendingInvitations.length}
                              </div>
                            )}
                          </div>

                          <div className="text-center md:text-left">
                            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 mb-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                                {isYouTube ? 'LIVE STREAM PROTOCOL' : 'Incoming Call Protocol'}
                              </span>
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1 italic">
                              {isYouTube ? 'MANDATORY YOUTUBE LIVE' : 'Session Invitation'}
                            </h3>
                            <p className="text-[11px] font-bold text-white uppercase tracking-widest flex flex-wrap items-center justify-center md:justify-start gap-2">
                              {isYouTube ? (
                                <span className="bg-white text-[#FF0000] px-2 py-0.5 font-black italic">THIS IS A MANDATORY STREAMING SESSION</span>
                              ) : (
                                <>
                                  <span className="bg-white text-[#4D7C0F] px-2 py-0.5 font-black">{inv.senderId?.name}</span>
                                  <span>INVITED YOU TO</span>
                                  <span className="text-white underline decoration-white/30 underline-offset-4">{inv.meetingId?.title}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto relative z-10">
                          <button
                            onClick={() => handleInviteAction(inv._id, 'accepted', inv.meetingId?.roomId)}
                            disabled={actionLoading}
                            className={`w-full md:w-auto h-16 px-16 bg-white ${isYouTube ? 'text-[#FF0000]' : 'text-[#4D7C0F]'} font-black uppercase tracking-widest text-[12px] shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center justify-center gap-4`}
                          >
                            {actionLoading ? <Loader2 size={20} className="animate-spin" /> : (
                              <>
                                {isYouTube ? 'JOIN LIVE STREAM NOW' : 'JOIN SESSION NOW'}
                                <ArrowRight size={22} strokeWidth={3} />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Ongoing Sessions section */}
            {ongoingSessions.length > 0 && (
              <div className="mb-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em]">Ongoing Sessions</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ongoingSessions.map((session) => {
                    const meeting = session.meetingId;
                    if (!meeting) return null;
                    const isExternal = meeting.platform !== 'internal';
                    const isYouTube = meeting.platform === 'youtube';
                    const isGMeet = meeting.platform === 'gmeet';

                    return (
                      <div key={session._id} className="bg-white border-2 border-gray-100 p-6 flex items-center justify-between group hover:border-[#4D7C0F] transition-all shadow-sm rounded-none">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 flex items-center justify-center text-white ${isYouTube ? 'bg-red-600' : (isGMeet ? 'bg-blue-600' : 'bg-[#4D7C0F]')}`}>
                            {isYouTube ? <Youtube size={24} /> : <Video size={24} />}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-gray-900 uppercase truncate max-w-[150px]">{meeting.title}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Meeting</p>
                          </div>
                        </div>
                        {isExternal ? (
                          <a
                            href={meeting.externalUrl?.startsWith('http') ? meeting.externalUrl : `https://${meeting.externalUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#4D7C0F] transition-all"
                          >
                            Re-join
                          </a>
                        ) : (
                          <button
                            onClick={() => navigate(`/meeting/${meeting.roomId}`)}
                            className="px-6 py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#4D7C0F] transition-all"
                          >
                            Re-join
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Header Section */}
            <div className="rounded-2xl p-6 md:p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6 shadow-md" style={{ background: "linear-gradient(100deg,#65A30D 0%,#5596df 55%,#65A30D 100%)" }}>
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                <div>
                  <span className="inline-block text-[11px] font-bold tracking-[0.18em] uppercase bg-white/20 border border-white/30 text-white rounded-full px-3 py-1 mb-3">Employee Portal</span>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">Employee Dashboard</h1>
                  <p className="text-[11px] font-bold text-white/90 uppercase tracking-[0.2em] mt-2">Role: {role} • Hierarchy Performance Tracking</p>
                </div>
              </div>

              {/* Wallet Balance Displays (Right Aligned) */}
              <div className="flex gap-4 lg:ml-auto w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                {/* Recharge Wallet */}
                <div className="flex flex-col justify-center bg-white border-2 border-white/60 shadow-lg px-6 py-4 rounded-2xl min-w-[220px] max-w-[300px] hover:border-[#4D7C0F]/40 transition-colors relative overflow-hidden group">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black text-[#4D7C0F] uppercase tracking-[0.2em] z-10 flex items-center gap-2">
                      Recharge
                      <button 
                        onClick={() => {
                          setIsWalletHistoryOpen(true);
                          fetchWalletHistory();
                        }}
                        className="p-1 hover:bg-[#4D7C0F]/10 rounded transition-colors text-[#4D7C0F]"
                      >
                        <History size={12} />
                      </button>
                    </p>
                    <CreditCard size={18} className="text-[#4D7C0F] z-10" />
                  </div>
                  <p className="text-3xl font-black text-gray-900 leading-none z-10 break-all">₹{(employeeProfile?.walletBalance || 0).toLocaleString('en-IN')}</p>
                  <div className="absolute -right-6 -bottom-6 text-[#4D7C0F] opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <CreditCard size={100} />
                  </div>
                </div>

                {/* Earnings Wallet */}
                <div className="flex flex-col justify-center bg-gradient-to-br from-[#3F6212] to-[#1A2E05] border-2 border-white/30 shadow-xl shadow-[#3F6212]/30 px-6 py-4 rounded-2xl min-w-[220px] max-w-[300px] hover:shadow-[#4D7C0F]/40 transition-shadow relative overflow-hidden group">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black text-[#ECFCCB] uppercase tracking-[0.2em] z-10 flex items-center gap-2">
                      Earnings
                      <button onClick={handleRefresh} disabled={refreshing} className="p-1 hover:bg-white/20 rounded transition-colors text-white">
                        <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                      </button>
                    </p>
                    <TrendingUp size={18} className="text-[#ECFCCB] z-10" />
                  </div>
                  <p className="text-3xl font-black text-white leading-none z-10 break-all">₹{(dynamicSalaryWallet || 0).toLocaleString('en-IN')}</p>
                  <div className="absolute -right-6 -bottom-6 text-black opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <TrendingUp size={100} />
                  </div>
                </div>
              </div>

              {/* Attendance Widget */}
              {config?.attendanceEnabled && (
                <div className="bg-gray-50 border border-gray-100 p-3 rounded flex items-center gap-4 min-w-[300px]">
                  <div className={`p-2 rounded ${attendance?.checkIn ? 'bg-green-100 text-[#3AB000]' : 'bg-orange-100 text-orange-600'}`}>
                    <UserCheck size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Attendance Protocol</p>
                    <p className="text-xs font-bold text-gray-800">
                      {attendance?.checkIn ? (
                        attendance?.checkOut ? 'Status: Completed' : `Checked-in: ${new Date(attendance.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      ) : (
                        'Status: Standby'
                      )}
                    </p>
                  </div>
                  {!attendance?.checkOut && (
                    <button
                      onClick={() => handleAttendanceAction(attendance?.checkIn ? 'check-out' : 'check-in')}
                      disabled={actionLoading}
                      className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${attendance?.checkIn
                        ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20'
                        : 'bg-[#4D7C0F] hover:bg-[#3F6212] text-white shadow-lg shadow-[#4D7C0F]/20'
                        }`}
                    >
                      {actionLoading ? <Loader2 size={12} className="animate-spin" /> : (attendance?.checkIn ? 'Check-out' : 'Check-in')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Individual Performance Section */}
            <div className="mb-10 mt-8">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <TrendingUp size={16} /> My Performance
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card Creation Progress */}
                {config?.cardTargetEnabled && (
                  <div className="relative group border-2 border-[#4D7C0F] rounded-2xl p-8 bg-white transition-all duration-500 overflow-hidden h-full">
                    {/* Background Accent */}
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#4D7C0F]/5 rounded-full blur-3xl group-hover:bg-[#4D7C0F]/10 transition-all duration-700" />

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-[#4D7C0F] animate-pulse" />
                            <p className="text-[10px] font-black text-[#4D7C0F] uppercase tracking-[0.3em]">Monthly Mission</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                              {role === 'RM' ? 'Team Target Overview' : 'Individual Target'}
                            </h3>
                            <button
                              onClick={() => setShowHistory(true)}
                              className="px-4 py-2 bg-[#ECFCCB] border border-[#D9F99D] hover:bg-[#4D7C0F] hover:border-[#4D7C0F] hover:text-white text-[#4D7C0F] text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-sm flex items-center gap-2 group"
                            >
                              <Clock size={14} /> View Past Targets
                            </button>
                          </div>
                        </div>
                        <div className="bg-[#4D7C0F] text-white p-4 rounded-2xl shadow-lg shadow-[#4D7C0F]/30 transform group-hover:scale-110 transition-transform duration-500">
                          <ShieldCheck size={28} />
                        </div>
                      </div>

                      {isRM && data.rmStats ? (
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-[#4D7C0F] to-[#3F6212] p-4 rounded-xl shadow-md text-white mb-6 border border-[#4D7C0F]">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-[13px] font-black uppercase tracking-tight">Global Performance Ratio</p>
                              <p className="text-xl font-black leading-none">{globalPR}%</p>
                            </div>
                            <div className="relative w-full h-3 bg-black/20 rounded-full overflow-hidden p-0.5">
                              <div
                                className="h-full bg-white transition-all duration-1000 ease-out rounded-full shadow-[0_0_5px_rgba(255,255,255,0.4)]"
                                style={{ width: `${globalPR}%` }}
                              />
                            </div>
                            <p className="text-[10px] font-bold text-white/80 mt-2">
                              {globalPR >= 75
                                ? "🎉 Target Achieved! Base salary added to total earnings."
                                : `Reach 50% to unlock base salary (₹${rmBaseSalary || 35500}).`}
                            </p>
                          </div>
                          {['dm', 'bs', 'pe'].map(key => {
                            const item = data.rmStats.teamBreakdown[key];
                            const roleName = key === 'dm' ? 'District Manager' : key === 'bs' ? 'Block Supervisor' : 'Panchayat Executive';
                            const prPercentage = item.totalTarget === 0 ? 0 : progress(item.achieved, item.totalTarget);
                            return (
                              <div key={key} className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-[#4D7C0F]/30 hover:shadow-md">
                                <div className="flex justify-between items-center mb-3">
                                  <p className="text-[13px] font-black text-gray-900 uppercase tracking-tight">{roleName}</p>
                                  <p className="text-lg font-black text-[#4D7C0F] leading-none">{prPercentage}%</p>
                                </div>
                                <div className="relative w-full h-2.5 bg-gray-200 rounded-full overflow-hidden p-0.5">
                                  <div
                                    className="h-full bg-gradient-to-r from-[#4D7C0F] to-[#65A30D] transition-all duration-1000 ease-out rounded-full shadow-[0_0_5px_rgba(77,124,15,0.4)]"
                                    style={{ width: `${prPercentage}%` }}
                                  >
                                    <div className="w-full h-full opacity-30 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[move_1s_linear_infinite]" />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-5xl font-black text-gray-900 tracking-tighter">
                                {stats?.individual?.cards} <span className="text-xl text-gray-400 font-bold">/ {config?.monthlyCardTarget}</span>
                              </p>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Cards Successfully Issued</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-[#4D7C0F]">{progress(stats?.individual?.cards, config?.monthlyCardTarget)}%</p>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Completed</p>
                            </div>
                          </div>

                          <div className="relative w-full h-4 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-50">
                            <div
                              className="h-full bg-gradient-to-r from-[#4D7C0F] to-[#65A30D] transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(77,124,15,0.4)]"
                              style={{ width: `${progress(stats?.individual?.cards, config?.monthlyCardTarget)}%` }}
                            >
                              <div className="w-full h-full opacity-30 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[move_1s_linear_infinite]" />
                            </div>
                          </div>

                          <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={16} className="text-[#4D7C0F]" />
                              <span className="text-[11px] font-black text-gray-700 uppercase tracking-tight">{stats?.individual?.cards} Completed</span>
                            </div>
                            <div className="w-px h-4 bg-gray-200" />
                            <div className="flex items-center gap-2">
                              <AlertCircle size={16} className="text-orange-400" />
                              <span className="text-[11px] font-black text-gray-700 uppercase tracking-tight">{Math.max(0, config?.monthlyCardTarget - stats?.individual?.cards)} Remaining</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Lead Upload Progress */}
                {config?.leadTargetEnabled && (
                  <div className="border-2 border-gray-100 hover:border-[#D9F99D] rounded-2xl p-6 bg-white shadow-sm transition-all duration-300 h-full">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Leads Goal</p>
                        <h3 className="text-xl font-black text-gray-900 uppercase">Leads Target</h3>
                      </div>
                      <div className="bg-[#ECFCCB] text-[#4D7C0F] p-3 rounded-2xl">
                        <Target size={24} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <p className="text-3xl font-black text-gray-900">
                          {stats?.individual?.leads} <span className="text-sm text-gray-400">/ {config?.monthlyLeadTarget}</span>
                        </p>
                        <p className={`text-xs font-black uppercase tracking-widest ${progress(stats?.individual?.leads, config?.monthlyLeadTarget) >= 100 ? 'text-[#4D7C0F]' : 'text-gray-400'}`}>
                          {progress(stats?.individual?.leads, config?.monthlyLeadTarget)}% Done
                        </p>
                      </div>

                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#4D7C0F] transition-all duration-1000 ease-out rounded-full"
                          style={{ width: `${progress(stats?.individual?.leads, config?.monthlyLeadTarget)}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2">
                        <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-[#4D7C0F]" /> {stats?.individual?.leads} Uploaded</span>
                        <span className="flex items-center gap-1"><AlertCircle size={12} className="text-orange-400" /> {Math.max(0, config?.monthlyLeadTarget - stats?.individual?.leads)} Remaining</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Blogs Swiper - Below My Performance */}
            {recentBlogs.length > 0 && (
              <div className="mb-10">
                <style>{`
                .small-swiper-nav .swiper-button-next:after,
                .small-swiper-nav .swiper-button-prev:after {
                  font-size: 16px !important;
                  font-weight: 900;
                  color: #4D7C0F;
                }
                .small-swiper-nav .swiper-button-next,
                .small-swiper-nav .swiper-button-prev {
                  width: 30px;
                  height: 30px;
                  background-color: white;
                  border-radius: 50%;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  border: 1px solid #e5e7eb;
                }
              `}</style>
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <FileText size={16} /> Recent Articles
                </h2>
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  spaceBetween={24}
                  slidesPerView={1}
                  breakpoints={{
                    640: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 },
                    1280: { slidesPerView: 4 }
                  }}
                  autoplay={{ delay: 3500, disableOnInteraction: false }}
                  navigation
                  pagination={{ clickable: true }}
                  className="pb-12 small-swiper-nav"
                >
                  {recentBlogs.map((blog) => (
                    <SwiperSlide key={blog._id} className="h-auto">
                      <div
                        onClick={() => navigate(`/blog/${blog._id}`)}
                        className="group cursor-pointer bg-white border-2 border-[#4D7C0F]/40 rounded-2xl h-full flex flex-col hover:border-[#4D7C0F] hover:shadow-lg hover:shadow-[#4D7C0F]/10 transition-all duration-300 overflow-hidden"
                      >
                        <div className="h-44 w-full overflow-hidden relative border-b-2 border-gray-100">
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                          <img
                            src={blog.image}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="text-[10px] font-black text-[#4D7C0F] uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Calendar size={12} />
                            {new Date(blog.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric"
                            })}
                          </div>
                          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-tight mb-2 line-clamp-2">
                            {blog.title}
                          </h3>
                          <p className="text-sm text-gray-500 font-medium leading-snug line-clamp-2">
                            {blog.description}
                          </p>
                          <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-[#4D7C0F] transition-colors">
                              Read Article
                            </span>
                            <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#4D7C0F] group-hover:text-white transition-colors text-gray-400">
                              <ArrowRight size={12} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            )}

            {/* Team Performance Section (BS/DM only) */}
            {(role === "BS" || role === "DM") && config?.teamCardTargetEnabled && (
              <div className="mb-10 animate-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Users size={16} /> Team Performance
                </h2>
                <div className="bg-[#4D7C0F] rounded-xl p-8 text-white shadow-xl shadow-[#4D7C0F]/20 relative overflow-hidden">
                  {/* Decorative Pattern */}
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Users size={200} />
                  </div>

                  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div>
                      <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em] mb-2">Aggregate District Goal</p>
                      <h3 className="text-3xl font-black uppercase tracking-tight mb-6">Collective Team Target</h3>

                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-5xl font-black">{stats?.team?.cards}</span>
                        <span className="text-lg font-bold text-white/60 pb-1">/ {config?.monthlyTeamCardTarget} CARDS</span>
                      </div>

                      <p className="text-sm font-bold text-white/80">
                        Team has completed {progress(stats?.team?.cards, config?.monthlyTeamCardTarget)}% of the monthly goal.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden border border-white/30 p-0.5">
                        <div
                          className="h-full bg-white transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                          style={{ width: `${progress(stats?.team?.cards, config?.monthlyTeamCardTarget)}%` }}
                        ></div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 backdrop-blur-md p-4 border border-white/20 rounded-lg">
                          <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">Remaining</p>
                          <p className="text-xl font-black">{Math.max(0, config?.monthlyTeamCardTarget - stats?.team?.cards)}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 border border-white/20 rounded-lg">
                          <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">Team Size</p>
                          <p className="text-xl font-black flex items-center gap-2">Managed <ArrowRight size={16} /></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}



            {/* Quick Actions / Links */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                // { icon: Target, label: "Create Card", type: "Action", path: "/employee/cards/add" },
                { icon: Users, label: "Upload Leads", type: "Action", path: "/employee/leads" },
                { icon: MapPin, label: "Working Zone", type: "System", path: "/employee/working-zone" },
                { icon: UserCheck, label: "View Profile", type: "Account", path: "/employee/profile" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => window.location.href = item.path}
                  className="group relative bg-[#fafafa] border-2 border-gray-200 p-6 rounded-2xl cursor-pointer hover:bg-white hover:border-[#4D7C0F] hover:shadow-[0_20px_40px_-12px_rgba(77,124,15,0.2)] transition-all duration-300 shadow-sm"
                >
                  {/* Status Pulse on Hover */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#4D7C0F] animate-pulse" />
                  </div>

                  <div className="flex flex-col gap-5">
                    <div className="w-14 h-14 bg-white border border-gray-100 text-gray-500 rounded-2xl flex items-center justify-center group-hover:bg-[#4D7C0F] group-hover:text-white group-hover:rotate-[360deg] transition-all duration-500 shadow-md group-hover:shadow-[#4D7C0F]/20">
                      <item.icon size={28} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-1 group-hover:text-[#4D7C0F] transition-colors">
                        {item.type}
                      </p>
                      <h4 className="text-[15px] font-black text-gray-900 uppercase tracking-tight leading-none">
                        {item.label}
                      </h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Target History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col animate-in fade-in zoom-in-95 duration-300">
          {/* Modal Header */}
          <div className="bg-gray-900 text-white p-6 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#4D7C0F] rounded-xl">
                <Target size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-widest">Past Target History</h2>
                <p className="text-[#4D7C0F] text-[10px] font-black tracking-[0.2em] uppercase mt-1">
                  Review your previous monthly missions
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={28} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-gray-50">
            <div className="max-w-4xl mx-auto space-y-6">
              {historyLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 size={40} className="animate-spin text-[#4D7C0F]" />
                </div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-widest text-xs">
                  No historical data found.
                </div>
              ) : (
                <>
                  {historyData.map((item, index) => {
                    const isPerfect = item.percentage >= 100;

                    // Dynamic styling based on performance
                    let colorClass = "text-[#4D7C0F]";
                    let bgClass = "bg-[#4D7C0F]";
                    let borderClass = "border-[#4D7C0F]";
                    let gradientClass = "from-[#4D7C0F] to-[#65A30D]";

                    if (item.percentage === 0) {
                      colorClass = "text-red-500";
                      bgClass = "bg-red-500";
                      borderClass = "border-red-200 hover:border-red-500";
                      gradientClass = "from-red-500 to-red-400";
                    } else if (item.percentage > 0 && item.percentage < 40) {
                      colorClass = "text-orange-500";
                      bgClass = "bg-orange-500";
                      borderClass = "border-orange-200 hover:border-orange-500";
                      gradientClass = "from-orange-500 to-orange-400";
                    } else if (item.percentage >= 40 && item.percentage < 100) {
                      colorClass = "text-[#4D7C0F]";
                      bgClass = "bg-[#4D7C0F]";
                      borderClass = "border-[#D9F99D] hover:border-[#4D7C0F]";
                      gradientClass = "from-[#4D7C0F] to-[#65A30D]";
                    }

                    if (isPerfect) {
                      return (
                        <div key={index} className="bg-gradient-to-r from-[#ECFCCB] to-white p-6 rounded-2xl border-2 border-[#4D7C0F] transition-all shadow-md relative overflow-hidden">
                          <div className="absolute right-0 top-0 p-4 opacity-10">
                            <CheckCircle2 size={80} className="text-[#4D7C0F]" />
                          </div>
                          <div className="relative z-10">
                            <div className="flex justify-between items-end mb-4">
                              <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{item.month}</h3>
                                <p className="text-[10px] font-bold text-[#4D7C0F] tracking-widest uppercase mt-1">Target Completed!</p>
                              </div>
                              <div className="text-right">
                                <span className="text-3xl font-black text-[#4D7C0F]">{item.percentage}%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mb-2 text-sm font-black text-gray-700 bg-white/50 px-4 py-2 rounded-lg">
                              <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#4D7C0F]" /> {item.achieved} Cards Made</span>
                              <span>Target: {item.target}</span>
                            </div>
                            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                              <div className="h-full bg-[#4D7C0F] rounded-full shadow-[0_0_10px_rgba(77,124,15,0.4)]" style={{ width: '100%' }} />
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={index} className={`bg-white p-6 rounded-2xl border-2 ${borderClass} transition-all shadow-sm hover:shadow-md`}>
                          <div className="flex justify-between items-end mb-4">
                            <div>
                              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{item.month}</h3>
                              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-1">Target vs Achieved</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-3xl font-black ${colorClass}`}>{item.percentage}%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mb-3 text-sm font-black text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                            <span className="flex items-center gap-2">
                              {item.achieved > 0 ? <CheckCircle2 size={16} className={colorClass} /> : <AlertCircle size={16} className={colorClass} />}
                              {item.achieved} Cards Made
                            </span>
                            <span>Target: {item.target}</span>
                          </div>
                          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full bg-gradient-to-r ${gradientClass} rounded-full`}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    }
                  })}
                  <p className="text-center text-xs font-bold text-gray-400 mt-8 uppercase tracking-widest">
                    Showing performance data for the last 6 months.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wallet History Modal - Full Screen Style */}
      {isWalletHistoryOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-white animate-in slide-in-from-bottom duration-500">
          <div className="w-full h-full flex flex-col">
            {/* Top Header Bar */}
            <div className="px-6 py-4 bg-white border-b-2 border-gray-100 flex items-center justify-between sticky top-0 z-[120]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#4D7C0F]/10 flex items-center justify-center text-[#4D7C0F] border-2 border-[#4D7C0F]/20">
                  <History size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none uppercase">Full Audit History</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-black text-[#4D7C0F] uppercase tracking-widest">Wallet Activity Log</p>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{walletHistoryData.length} Records Found</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsWalletHistoryOpen(false)}
                className="group flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-red-600 transition-all"
              >
                <X size={18} className="group-hover:rotate-90 transition-transform" />
                Exit Audit
              </button>
            </div>

            {/* Table Container - Inline Scroll */}
            <div className="flex-1 overflow-auto bg-gray-50/30">
              {walletHistoryLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-gray-100 border-t-[#4D7C0F] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 size={32} className="text-[#4D7C0F] animate-pulse" />
                    </div>
                  </div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Reconstructing Ledger...</p>
                </div>
              ) : walletHistoryData.length > 0 ? (
                <div className="min-w-[1000px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-[115]">
                      <tr className="bg-[#4D7C0F] shadow-xl">
                        <th className="px-8 py-6 text-[14px] font-black text-black uppercase tracking-widest border-r border-black/5">Date & Time</th>
                        <th className="px-8 py-6 text-[14px] font-black text-black uppercase tracking-widest border-r border-black/5">Reference ID</th>
                        <th className="px-8 py-6 text-[14px] font-black text-black uppercase tracking-widest border-r border-black/5">Category</th>
                        <th className="px-8 py-6 text-[14px] font-black text-black uppercase tracking-widest border-r border-black/5">Transaction Remarks</th>
                        <th className="px-8 py-6 text-[14px] font-black text-black uppercase tracking-widest text-center border-r border-black/5">Status</th>
                        <th className="px-8 py-6 text-[14px] font-black text-black uppercase tracking-widest text-right">Flow</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {walletHistoryData.map((log) => (
                        <tr key={log._id} className="hover:bg-gray-50/80 transition-all group">
                          <td className="px-8 py-6 border-r border-gray-50">
                            <p className="text-[14px] font-black text-gray-900 leading-none">
                              {new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[11px] font-black text-[#4D7C0F] uppercase mt-2 tracking-tighter">
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </p>
                          </td>
                          <td className="px-8 py-6 border-r border-gray-50">
                            <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-3 py-1.5 border border-gray-200 uppercase tracking-tighter">
                              {log.razorpay_order_id || log._id.toString().slice(-12).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-8 py-6 border-r border-gray-50">
                            <span className="text-[12px] font-black text-gray-900 tracking-tight uppercase">
                              {log.type.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-8 py-6 border-r border-gray-50">
                            <span className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-tight border border-gray-200">
                              {log.remarks || 'Standard Wallet Activity'}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-center border-r border-gray-50">
                            <span className={`text-[10px] font-black px-4 py-2 border-2 ${
                              log.status === 'SUCCESS' ? 'bg-[#4D7C0F]/10 text-[#4D7C0F] border-[#4D7C0F]/20' : 
                              log.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-100' : 
                              'bg-yellow-50 text-yellow-700 border-yellow-100'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className={`px-8 py-6 text-right border-l border-gray-50 bg-gray-50/30 group-hover:bg-transparent transition-colors`}>
                            <div className="flex flex-col items-end">
                              <span className={`text-xl font-black tracking-tighter ${log.type.startsWith('CREDIT') ? 'text-green-600' : 'text-red-600'}`}>
                                {log.type.startsWith('CREDIT') ? '+' : '-'} ₹{log.amount.toLocaleString()}
                              </span>
                              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">Net Flow</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
                  <div className="w-24 h-24 bg-gray-50 flex items-center justify-center text-gray-200 border-2 border-dashed border-gray-100">
                    <History size={48} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900 tracking-tight uppercase">Ledger is Empty</p>
                    <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">No transaction activities found in this account</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Info Bar */}
            <div className="px-6 py-4 bg-gray-900 flex items-center justify-between text-white border-t-4 border-[#4D7C0F]">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Account Holder</p>
                  <p className="text-xs font-black text-white uppercase">{employeeProfile?.employeeName || 'Authorized Personnel'}</p>
                </div>
                <div className="w-px h-8 bg-gray-700"></div>
                <div>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Credit Flow</p>
                  <p className="text-xs font-black text-[#4D7C0F]">₹{walletHistoryData.reduce((acc, curr) => curr.type.startsWith('CREDIT') ? acc + curr.amount : acc, 0).toLocaleString()}</p>
                </div>
              </div>
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em]">Audit Level: Organization Standard</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

// Landing-page typography for the employee dashboard content (UI only).
const EMP_LANDING_CSS = `
.emp-land, .emp-land *:not(svg):not(path) { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif !important; }
.emp-land { color: #1f2d3d; }
.emp-land .font-black { font-weight: 700 !important; }
.emp-land .font-extrabold { font-weight: 700 !important; }
.emp-land .text-gray-900, .emp-land .text-gray-800 { color: #3F6212 !important; }
.emp-land .text-gray-400 { color: #6b7d93 !important; }
.emp-land [class*="tracking-[0.2em]"], .emp-land [class*="tracking-[0.3em]"], .emp-land .tracking-widest { letter-spacing: 0.06em !important; }
.emp-land .tracking-tighter, .emp-land .tracking-tight { letter-spacing: 0 !important; }
.emp-land h1, .emp-land h2, .emp-land h3 { letter-spacing: 0 !important; }
.emp-land .text-\\[10px\\], .emp-land .text-\\[9px\\], .emp-land .text-\\[8px\\] { font-size: 11px !important; }
.emp-land .bg-white.rounded-2xl, .emp-land .bg-white.rounded-xl { border-color: #d6e4f5; }
.emp-land .bg-gray-50 { background-color: #ffffff !important; }
`;

export default MainDashboard;
