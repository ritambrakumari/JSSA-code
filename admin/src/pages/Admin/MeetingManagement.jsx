import React, { useState, useEffect } from 'react';
import { Eye, Shield, Power, Activity, Users, Clock, Video, RefreshCw, Search, History, ShieldCheck, AlertCircle, Trash2, CheckSquare, Square, Bell, Send, Mail, MessageSquare, X, Loader2, Check } from 'lucide-react';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useBroadcast } from '../../context/BroadcastContext';
const MeetingManagement = () => {
  const [activeMeetings, setActiveMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedMeetings, setSelectedMeetings] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedMeetingForReminder, setSelectedMeetingForReminder] = useState(null);
  const { addJob } = useBroadcast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchActiveMeetings(page, true); // Show loader when page/filters change
    const interval = setInterval(() => fetchActiveMeetings(page, false), 30000); // Silent background refresh
    return () => clearInterval(interval);
  }, [page, startDate, endDate, platformFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchActiveMeetings(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchActiveMeetings = async (targetPage = 1, showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);
      const res = await api.meetings.getAdminActive({
        page: targetPage,
        limit: 15,
        startDate,
        endDate,
        platform: platformFilter,
        status: statusFilter,
        search
      });
      if (res.success) {
        setActiveMeetings(res.data);
        setPagination(res.pagination);
      }
    } catch (error) {
      console.error("Fetch active meetings error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMonitor = (roomId) => {
    toast.success("Entering Ghost Mode...");
    navigate(`/admin/meeting/monitor/${roomId}`);
  };

  const handleForceEnd = async (roomId) => {
    if (!window.confirm("Are you sure you want to FORCE END this meeting for everyone?")) return;

    try {
      const res = await api.meetings.end(roomId);
      if (res.success) {
        toast.success("Meeting terminated by Administrator");
        fetchActiveMeetings(page);
      } else {
        toast.error(res.error || "Failed to terminate meeting");
      }
    } catch (error) {
      toast.error("Failed to terminate meeting");
    }
  };

  const handleDelete = async (meetingIds) => {
    const count = Array.isArray(meetingIds) ? meetingIds.length : 1;
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE ${count} meeting record(s)? This cannot be undone.`)) return;

    try {
      const ids = Array.isArray(meetingIds) ? meetingIds : [meetingIds];
      const res = await api.meetings.deleteMeetings(ids);
      if (res.success) {
        toast.success(res.message || "Meetings deleted");
        setSelectedMeetings([]);
        fetchActiveMeetings(page);
      } else {
        toast.error(res.message || "Delete failed");
      }
    } catch (error) {
      toast.error("An error occurred during deletion");
    }
  };

  const toggleSelectAll = () => {
    if (selectedMeetings.length === filteredMeetings.length && filteredMeetings.length > 0) {
      setSelectedMeetings([]);
    } else {
      setSelectedMeetings(filteredMeetings.map(m => m._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedMeetings(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Remove local filter since we now use server-side search
  const filteredMeetings = activeMeetings;

  const stats = {
    total: pagination.total,
    participants: activeMeetings.reduce((acc, m) => acc + (m.activeParticipants?.length || 0), 0)
  };

  const handleOpenReminderModal = (meeting) => {
    setSelectedMeetingForReminder(meeting);
    setShowReminderModal(true);
  };

  const handleStartBroadcast = async (channels) => {
    try {
      const res = await api.meetings.broadcastReminder(selectedMeetingForReminder._id, channels);
      if (res.success) {
        toast.success(res.message);
        setShowReminderModal(false);
        addJob({
          _id: res.jobId,
          jobType: 'meeting_reminder',
          title: `Reminder: ${selectedMeetingForReminder.title}`,
          status: "pending",
          sentCount: 0,
          totalCandidates: (selectedMeetingForReminder.invitedParticipants?.length || 0) - (selectedMeetingForReminder.activeParticipants?.length || 0)
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start broadcast");
    }
  };


  return (
    <DashboardLayout>
      <div className="p-0 ml-0 md:ml-6 px-2 md:px-0 mt-4 space-y-4 h-full max-w-[99rem] flex flex-col">


        {/* Top Stats - Unified Style */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mr-4">
          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Live Sessions</span>
              <span className="text-2xl font-black text-gray-800 leading-none">{loading ? '...' : stats.total}</span>
            </div>
            <div className="p-3 bg-gray-100 text-gray-500 rounded-full">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Traffic</span>
              <span className="text-2xl font-black text-[#3AB000] leading-none">{loading ? '...' : stats.participants}</span>
            </div>
            <div className="p-3 bg-green-50 text-[#3AB000] rounded-full">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Signal Quality</span>
              <span className="text-2xl font-black text-blue-500 leading-none">U-HD</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-500 rounded-full">
              <Video className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center justify-between bg-white border border-gray-200 px-6 py-5 rounded-none shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Admin Status</span>
              <span className="text-2xl font-black text-red-500 leading-none">ACTIVE</span>
            </div>
            <div className="p-3 bg-red-50 text-red-500 rounded-full">
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Header Section - Filter Bar */}
        <div className="bg-white p-4 border border-gray-200 rounded-none shadow-sm space-y-4 mr-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
              <h1 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2 uppercase">
                <ShieldCheck className="w-6 h-6 text-[#3AB000]" />
                Meeting Surveillance
              </h1>
              {selectedMeetings.length > 0 && (
                <div className="flex items-center gap-3 ml-4 pl-4 border-l-2 border-gray-100">
                  <span className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest">
                    {selectedMeetings.length} Selected
                  </span>
                  <button
                    onClick={() => handleDelete(selectedMeetings)}
                    className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black px-4 h-8 flex items-center gap-2 uppercase tracking-wide shadow-lg shadow-red-200 transition-all"
                  >
                    <Trash2 size={14} />
                    Bulk Delete
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => fetchActiveMeetings(page, true)}
              className="bg-black hover:bg-gray-800 text-white text-xs sm:text-sm px-5 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Sync Live
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center border-t border-gray-100 pt-4">
            <div className="flex h-10 w-full md:w-auto flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search Room ID, Host, Title..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-xs sm:text-sm font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform:</span>
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="h-10 border border-gray-300 px-3 text-[10px] font-black uppercase outline-none focus:border-[#3AB000]"
                >
                  <option value="all">All Platforms</option>
                  <option value="internal">Internal</option>
                  <option value="gmeet">Google Meet</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 border border-gray-300 px-3 text-[10px] font-black uppercase outline-none focus:border-[#3AB000]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 border border-gray-300 px-3 text-[10px] font-black uppercase outline-none focus:border-[#3AB000]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 border border-gray-300 px-3 text-[10px] font-black uppercase outline-none focus:border-[#3AB000]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Ongoing</option>
                  <option value="ended">Ended</option>
                </select>
              </div>

              {(startDate || endDate || platformFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setPlatformFilter("all");
                    setStatusFilter("all");
                    setSearch("");
                  }}
                  className="h-10 px-4 text-[10px] font-black uppercase text-red-600 hover:bg-red-50 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Table Container with Inline Scroll */}
        <div className="bg-white rounded-none border border-gray-200 shadow-sm mr-4 flex-1 overflow-hidden flex flex-col min-h-[500px]">
          <div className="overflow-x-auto flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#3AB000]">
                  <th className="px-6 py-4 w-12">
                    <button onClick={toggleSelectAll} className="text-black hover:text-white transition-colors">
                      {selectedMeetings.length === filteredMeetings.length && filteredMeetings.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide w-[300px]">Session Identity</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide">Host Details</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-center">Timing (Start - End)</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-center">Status</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-center">Duration</th>
                  <th className="px-6 py-4 font-black text-black text-[13px] uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-gray-50">
                      <td className="px-6 py-5"><div className="w-5 h-5 bg-gray-100 rounded"></div></td>
                      <td className="px-6 py-5">
                        <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-gray-100 rounded w-20"></div>
                            <div className="h-2 bg-gray-50 rounded w-12"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded w-24 mx-auto"></div></td>
                      <td className="px-6 py-5"><div className="h-6 bg-gray-50 rounded w-16 mx-auto"></div></td>
                      <td className="px-6 py-5"><div className="h-8 bg-gray-100 rounded w-20 mx-auto"></div></td>
                      <td className="px-6 py-5 text-right"><div className="h-10 bg-gray-100 rounded w-32 ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredMeetings.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
                      <AlertCircle size={48} className="text-gray-200 mx-auto mb-4" />
                      <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Zero active traffic detected</p>
                    </td>
                  </tr>
                ) : (
                  filteredMeetings.map((meeting) => (
                    <tr key={meeting._id} className={`hover:bg-[#f9fff5] transition-colors border-b border-gray-100 ${selectedMeetings.includes(meeting._id) ? 'bg-[#f0f9eb]' : ''}`}>
                      <td className="px-6 py-5">
                        <button onClick={() => toggleSelect(meeting._id)} className={`${selectedMeetings.includes(meeting._id) ? 'text-[#3AB000]' : 'text-gray-300'} hover:text-[#3AB000] transition-colors`}>
                          {selectedMeetings.includes(meeting._id) ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        <div>
                          <p className="text-[14px] font-black text-gray-900 tracking-tight leading-none mb-1 uppercase max-w-[280px] truncate">
                            {meeting.title}
                          </p>
                          <p className="text-[11px] font-bold text-[#3AB000] tracking-tighter uppercase">{meeting.roomId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#0A3D00] text-white flex items-center justify-center font-black text-sm rounded-none">
                            {meeting.host?.name?.[0] || "H"}
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-gray-800 uppercase leading-none mb-1">{meeting.host?.name || "Unknown"}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{meeting.host?.employeeId || "No ID"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center">
                          <p className="text-[13px] font-black text-gray-900 uppercase flex items-center gap-2">
                            <Clock size={14} className="text-[#3AB000]" />
                            {(() => {
                              const d = meeting.startTime || meeting.scheduledFor || meeting.createdAt;
                              return d && !isNaN(new Date(d).getTime()) 
                                ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) 
                                : "N/A";
                            })()}
                            <span className="text-gray-300 mx-1">→</span>
                            <span className="text-gray-500 font-bold italic">
                              {meeting.endTime && !isNaN(new Date(meeting.endTime).getTime()) 
                                ? new Date(meeting.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) 
                                : "Ongoing"}
                            </span>
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {meeting.status === 'ended' ? (
                          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-red-200">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                            Ended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-green-50 text-[#3AB000] px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-[#3AB000]/20">
                            <span className="w-1.5 h-1.5 bg-[#3AB000] rounded-full animate-pulse" />
                            Ongoing
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center bg-gray-100 text-gray-900 px-4 py-1.5 text-[12px] font-black uppercase tracking-widest border border-gray-300 shadow-sm">
                          {(() => {
                            const start = meeting.startTime || meeting.scheduledFor || meeting.createdAt;
                            const end = meeting.endTime || (meeting.status === 'ongoing' ? new Date() : null);
                            if (!start || !end) return "---";
                            const diff = (new Date(end) - new Date(start)) / 60000;
                            if (isNaN(diff)) return "---";
                            const totalMins = Math.round(diff);
                            const h = Math.floor(totalMins / 60);
                            const m = totalMins % 60;
                            return h > 0 ? `${h}h ${m}m` : `${m}m`;
                          })()}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenReminderModal(meeting)}
                            disabled={meeting.status === 'ended'}
                            className={`inline-flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${meeting.status === 'ended' ? 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100' : 'bg-white text-[#3AB000] border border-[#3AB000] hover:bg-[#3AB000] hover:text-white'
                              }`}
                          >
                            <Bell size={14} />
                            Remind
                          </button>
                          <button
                            onClick={() => handleMonitor(meeting.roomId)}
                            disabled={meeting.status === 'ended'}
                            className={`inline-flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${meeting.status === 'ended' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-[#3AB000]'
                              }`}
                          >
                            <Eye size={14} />
                            Ghost
                          </button>
                          <button
                            onClick={() => handleForceEnd(meeting.roomId)}
                            disabled={meeting.status === 'ended'}
                            className={`inline-flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm ${meeting.status === 'ended' ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white'
                              }`}
                          >
                            <Power size={14} />
                            End
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Proper Pagination UI */}
          {pagination.pages > 1 && (
            <div className="bg-gray-50 border-t border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Showing <span className="text-gray-900">{(page - 1) * 15 + 1}</span> to <span className="text-gray-900">{Math.min(page * 15, pagination.total)}</span> of <span className="text-gray-900">{pagination.total}</span> Results
              </p>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-3 h-10 border-2 border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:border-[#3AB000]"
                >
                  First
                </button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 h-10 border-2 border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:border-[#3AB000]"
                >
                  Prev
                </button>

                <div className="flex items-center mx-2 gap-1">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let start = Math.max(1, page - 2);
                    let end = Math.min(pagination.pages, start + maxVisible - 1);
                    
                    if (end - start < maxVisible - 1) {
                      start = Math.max(1, end - maxVisible + 1);
                    }

                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setPage(i)}
                          className={`w-10 h-10 border-2 font-black text-xs transition-all ${
                            page === i 
                              ? 'bg-[#3AB000] border-[#3AB000] text-white shadow-lg shadow-green-100' 
                              : 'bg-white border-gray-200 text-gray-400 hover:border-[#3AB000] hover:text-[#3AB000]'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-3 h-10 border-2 border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:border-[#3AB000]"
                >
                  Next
                </button>
                <button
                  onClick={() => setPage(pagination.pages)}
                  disabled={page === pagination.pages}
                  className="px-3 h-10 border-2 border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all hover:border-[#3AB000]"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast Reminder Modal */}
      {showReminderModal && (
        <BroadcastReminderModal 
          meeting={selectedMeetingForReminder} 
          onClose={() => setShowReminderModal(false)} 
          onStart={handleStartBroadcast}
        />
      )}


      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3AB000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2d8a00;
        }
      `}</style>
    </DashboardLayout>
  );
};

const BroadcastReminderModal = ({ meeting, onClose, onStart }) => {
  const [channels, setChannels] = useState(['email', 'sms']);
  const absentees = (meeting.invitedParticipants?.length || 0) - (meeting.activeParticipants?.length || 0);

  const toggleChannel = (channel) => {
    setChannels(prev => prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto text-left">
      <div className="bg-white border border-gray-200 shadow-[24px_24px_0px_0px_rgba(0,0,0,0.05)] w-full max-w-lg animate-in zoom-in duration-200 rounded-none overflow-hidden my-auto">
        {/* Header - Clean style like QA */}
        <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 flex items-center justify-center text-[#3AB000]">
              <Send size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Broadcast Protocol</h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Automated Multi-Channel Nudge</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 text-gray-300 transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Accent Border Box */}
          <div className="bg-gray-50 p-6 space-y-4 border-l-4 border-[#3AB000]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black text-[#3AB000] uppercase tracking-widest">Meeting Details</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Room: {meeting.roomId}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-gray-900 uppercase leading-tight tracking-tight">{meeting.title}</h3>
            </div>
          </div>

          {/* Infrastructure Selection */}
          <div className="space-y-4">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
               Choose how to remind them
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => toggleChannel('email')}
                className={`relative flex flex-col items-center justify-center gap-3 p-6 border-2 transition-all group ${
                  channels.includes('email') ? 'border-[#3AB000] bg-green-50/30 text-[#3AB000]' : 'border-gray-100 text-gray-400 grayscale hover:grayscale-0 hover:border-gray-300'
                }`}
              >
                <div className={`absolute top-3 right-3 w-4 h-4 border-2 flex items-center justify-center ${channels.includes('email') ? 'bg-[#3AB000] border-[#3AB000]' : 'border-gray-200 bg-white'}`}>
                  {channels.includes('email') && <Check size={10} className="text-white" strokeWidth={4} />}
                </div>
                <div className={`w-12 h-12 flex items-center justify-center mb-1 ${channels.includes('email') ? 'bg-[#3AB000] text-white' : 'bg-gray-50 text-gray-300'}`}>
                  <Mail size={24} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.1em]">Send Email</span>
              </button>
              <button
                onClick={() => toggleChannel('sms')}
                className={`relative flex flex-col items-center justify-center gap-3 p-6 border-2 transition-all group ${
                  channels.includes('sms') ? 'border-[#3AB000] bg-green-50/30 text-[#3AB000]' : 'border-gray-100 text-gray-400 grayscale hover:grayscale-0 hover:border-gray-300'
                }`}
              >
                <div className={`absolute top-3 right-3 w-4 h-4 border-2 flex items-center justify-center ${channels.includes('sms') ? 'bg-[#3AB000] border-[#3AB000]' : 'border-gray-200 bg-white'}`}>
                  {channels.includes('sms') && <Check size={10} className="text-white" strokeWidth={4} />}
                </div>
                <div className={`w-12 h-12 flex items-center justify-center mb-1 ${channels.includes('sms') ? 'bg-[#3AB000] text-white' : 'bg-gray-50 text-gray-300'}`}>
                  <MessageSquare size={24} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.1em]">Send SMS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons - Gray background like QA */}
        <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex-1 h-14 bg-white border-2 border-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 hover:text-gray-600 transition-all"
          >
            Abort Operation
          </button>
          <button
            disabled={channels.length === 0}
            onClick={() => onStart(channels)}
            className="flex-[2] h-14 bg-[#3AB000] text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-green-100 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Send size={18} />
            Initiate Broadcast
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingManagement;
