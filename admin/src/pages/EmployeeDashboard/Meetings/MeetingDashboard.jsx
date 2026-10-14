import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Video,
  Plus,
  History,
  LogIn,
  ExternalLink,
  Calendar,
  RefreshCw,
  Users,
  X,
  Search,
  CheckCircle2,
  Monitor,
  Clock,
  ChevronRight,
  FileText,
  Check,
  Trash2,
  Upload,
  Paperclip,
  PlusCircle,
  FileBox,
  Download,
  Eye,
  Youtube,
  Power,
  Bell,
  Send,
  Mail,
  MessageSquare,
  Loader2,
  Activity
} from 'lucide-react';
import { api } from '../../../utils/api';
import districtsData from '../../../data/district.json';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthProvider';
import DashboardLayout from '../../../components/DashboardLayout';
import { useBroadcast } from '../../../context/BroadcastContext';

const GREEN = "#3AB000";

// Memoized Team List Component to fix lag
const TeamList = memo(({ results, selectedParticipants, onToggle, searching, themeColor = "#3AB000" }) => {
  if (searching) {
    return (
      <div className="flex flex-col items-center justify-center py-10 animate-pulse">
        <RefreshCw size={32} style={{ color: themeColor }} className="animate-spin mb-3" />
        <p className="text-[10px] font-black uppercase" style={{ color: themeColor }}>Fetching Team...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return <div className="text-center py-10 text-gray-300 text-[10px] font-black uppercase">No members found</div>;
  }

  return (
    <>
      {results.map((user) => {
        const isSelected = selectedParticipants.find(p => p.userId === user.userId);
        return (
          <div
            key={user.userId}
            onClick={() => onToggle(user)}
            className={`p-3.5 flex items-center justify-between cursor-pointer transition-all border-2 ${isSelected ? 'text-white shadow-md' : 'bg-white border-gray-100 text-gray-700'
              }`}
            style={{
              backgroundColor: isSelected ? themeColor : undefined,
              borderColor: isSelected ? themeColor : undefined,
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-none flex items-center justify-center font-black text-[11px] ${isSelected ? 'bg-white/20' : 'bg-gray-100'}`} style={{ color: !isSelected ? themeColor : undefined }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-black text-[11.5px] uppercase leading-none mb-1">{user.name}</p>
                <p className={`text-[9px] font-bold uppercase ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                  {user.designation || user.role || 'MEMBER'}
                </p>
              </div>
            </div>
            {isSelected ? <Check size={16} strokeWidth={4} /> : <Plus size={16} className="text-gray-300" />}
          </div>
        );
      })}
    </>
  );
});

const MeetingDashboard = () => {
  const { addJob } = useBroadcast();
  const [activeTab, setActiveTab] = useState('overview');
  const [history, setHistory] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(60); // Default 60 mins
  const [customHours, setCustomHours] = useState(1);
  const [customMinutes, setCustomMinutes] = useState(0);
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [showGMeetModal, setShowGMeetModal] = useState(false);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyPlatform, setHistoryPlatform] = useState('all');
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');

  // Location Filter State
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [blocksList, setBlocksList] = useState([]);
  const [panchayatsList, setPanchayatsList] = useState([]);

  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedPanchayat, setSelectedPanchayat] = useState('');

  const DURATION_OPTIONS = [
    { label: "15 MINS", value: 15 },
    { label: "30 MINS", value: 30 },
    { label: "1 HOUR", value: 60 },
    { label: "1 HR 30 MIN", value: 90 },
    { label: "2 HOURS", value: 120 },
    { label: "3 HOURS", value: 180 },
    { label: "CUSTOM", value: -1 },
    { label: "UNLIMITED", value: 0 },
  ];

  // Schedule Form State
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [meetingPlatform, setMeetingPlatform] = useState('internal'); // 'internal' or 'gmeet'
  const [meetingType, setMeetingType] = useState('instant'); // instant or scheduled
  const [gmeetUrl, setGmeetUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [searching, setSearching] = useState(false);

  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const ROLES = [
    { label: "All Roles", value: "ALL" },
    { label: "District Manager", value: "DISTRICT MANAGER" },
    { label: "Block Supervisor", value: "BLOCK SUPERVISOR" },
    { label: "Panchayat Executive", value: "PANCHAYAT EXECUTIVE" },
  ];

  const filteredResults = useMemo(() => {
    if (selectedRoleFilter === "ALL") return searchResults;
    return searchResults.filter(member => {
      const designation = (member.designation || member.role || member.post || "").toUpperCase();
      // Only match if the FIRST/PRIMARY role matches the filter exactly
      const primaryRole = designation.split(/\s+CUM\s+|\/|,|&/)[0].trim();
      return primaryRole === selectedRoleFilter;
    });
  }, [searchResults, selectedRoleFilter]);

  const { role } = useAuth();
  const navigate = useNavigate();

  // Production Lock Logic
  const isLocked = import.meta.env.MODE === "development" ? false : false;

  const [invitations, setInvitations] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Audit Modal State
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [newPoint, setNewPoint] = useState('');
  const [observations, setObservations] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedMeetingForReminder, setSelectedMeetingForReminder] = useState(null);

  useEffect(() => {
    fetchHistory();
    fetchScheduled();
    fetchInvitations();
    const interval = setInterval(fetchInvitations, 30000);
    return () => clearInterval(interval);
  }, [historyStartDate, historyEndDate, historyPlatform]);

  // Location Fetching Logic
  useEffect(() => {
    if (role === 'staff' || role === 'admin' || role === 'superadmin') {
      api.location.getStates().then(res => {
        if (res.success) {
          const uniqueStatesMap = new Map();
          res.data.forEach(stateStr => {
            const cleanName = stateStr.split(" / ")[0].trim().toUpperCase();
            if (!uniqueStatesMap.has(cleanName) || stateStr.includes("/")) {
              uniqueStatesMap.set(cleanName, stateStr);
            }
          });
          setStatesList(Array.from(uniqueStatesMap.values()).sort((a, b) => a.localeCompare(b)));
        }
      });
    }
  }, [role]);

  useEffect(() => {
    if (selectedState) {
      const fetchDistricts = async () => {
        const staticList = districtsData[selectedState] || [];
        try {
          const cleanState = selectedState.split(" / ")[0].trim();
          const res = await api.location.getCustomDistricts(cleanState);
          const customList = res.data ? res.data.map(d => d.name) : [];
          
          const combined = [...new Set([...staticList, ...customList])];
          setDistrictsList(combined.sort((a, b) => a.localeCompare(b)));
        } catch (error) {
          setDistrictsList(staticList);
        }
      };
      fetchDistricts();
    } else {
      setDistrictsList([]);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedDistrict) {
      const cleanState = selectedState.split(" / ")[0].trim();
      const cleanDistrict = selectedDistrict.split(" / ")[0].trim();
      api.location.getBlocks({ state: cleanState, district: cleanDistrict, all: 'true' }).then(res => {
        if (Array.isArray(res)) setBlocksList(res);
        else if (res && res.data) setBlocksList(res.data);
      });
    } else {
      setBlocksList([]);
    }
  }, [selectedDistrict, selectedState]);

  useEffect(() => {
    if (selectedBlock) {
      api.location.getPanchayats({ blockId: selectedBlock, all: 'true' }).then(res => {
        if (Array.isArray(res)) setPanchayatsList(res);
        else if (res && res.data) setPanchayatsList(res.data);
      });
    } else {
      setPanchayatsList([]);
    }
  }, [selectedBlock]);

  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [ongoingSessions, setOngoingSessions] = useState([]);

  const fetchInvitations = async () => {
    if (isLocked) return;
    try {
      const res = await api.meetings.getInvitations();
      if (res.success) {
        setPendingInvitations(res.data.filter(inv => inv.status === 'pending'));
        setOngoingSessions(res.data.filter(inv => inv.status === 'accepted'));
        setInvitations(res.data);
      }
    } catch (error) {
      console.error("Fetch invitations error:", error);
    }
  };

  const handleInviteAction = async (inviteId, status, roomId) => {
    try {
      setActionLoading(true);
      const res = await api.meetings.updateInvitationStatus(inviteId, status);
      if (res.success) {
        if (status === 'accepted') {
          const invite = invitations.find(inv => inv._id === inviteId);
          const meeting = invite?.meetingId;

          if ((meeting?.platform === 'gmeet' || meeting?.platform === 'youtube') && meeting?.externalUrl) {
            const url = meeting.externalUrl.startsWith('http') ? meeting.externalUrl : `https://${meeting.externalUrl}`;
            window.open(url, '_blank');
            setInvitations(invitations.filter(inv => inv._id !== inviteId));
          } else {
            navigate(`/meeting/${roomId}`);
          }
        } else {
          setInvitations(invitations.filter(inv => inv._id !== inviteId));
          toast.success("Invitation dismissed");
        }
      }
    } catch (error) {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReminderModal = (meeting) => {
    if (role !== 'admin' && role !== 'staff') return;
    setSelectedMeetingForReminder(meeting);
    setShowReminderModal(true);
  };

  const handleStartBroadcast = async (channels) => {
    try {
      const res = await api.meetings.broadcastReminder(selectedMeetingForReminder._id, channels);
      if (res.success) {
        toast.success(res.message);
        setShowReminderModal(false);
        // Integrate with Global Broadcast System
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


  const fetchHistory = async () => {
    if (isLocked) return;
    try {
      setRefreshing(true);
      const res = await api.meetings.getHistory({
        startDate: historyStartDate,
        endDate: historyEndDate,
        platform: historyPlatform
      });
      if (res.success) {
        setHistory(res.data);
      }
    } catch (error) {
      console.error("Fetch history error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchScheduled = async () => {
    if (isLocked) return;
    try {
      const res = await api.meetings.getScheduled();
      if (res.success) {
        setScheduled(res.data);
      }
    } catch (error) {
      console.error("Fetch scheduled error:", error);
    }
  };

  const handleCreateInstant = async () => {
    if (isLocked) return;
    setLoading(true);
    const finalDuration = meetingDuration === -1 ? (Number(customHours) * 60 + Number(customMinutes)) : meetingDuration;

    try {
      const res = await api.meetings.create({
        title: "Quick Sync",
        type: "instant",
        duration: finalDuration
      });
      if (res.success) {
        toast.success("Meeting room created!");
        if (res.data.broadcastJobId) {
          addJob({ _id: res.data.broadcastJobId, title: `Meeting: Quick Sync`, status: "pending", sentCount: 0, totalCandidates: 0 }); // Details will be fetched by polling
        }
        navigate(`/meeting/${res.data.roomId}`);
      } else {
        toast.error(res.message || "Failed to create meeting");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleForceEnd = async (roomId) => {
    if (!window.confirm("Are you sure you want to END this session for everyone?")) return;

    try {
      const res = await api.meetings.end(roomId);
      if (res.success) {
        toast.success("Session terminated successfully");
        fetchHistory();
        fetchScheduled();
        fetchInvitations();
      } else {
        toast.error(res.error || "Failed to terminate session");
      }
    } catch (error) {
      toast.error("Failed to terminate session");
    }
  };

  const handleJoin = async (id = roomIdInput, meetingData = null) => {
    if (isLocked) return;

    // If we have meeting data directly (from list), check if it's GMeet/YouTube
    if (meetingData && (meetingData.platform === 'gmeet' || meetingData.platform === 'youtube') && meetingData.externalUrl) {
      window.open(meetingData.externalUrl.startsWith('http') ? meetingData.externalUrl : `https://${meetingData.externalUrl}`, '_blank');
      return;
    }

    if (!id) return toast.error("Please enter a Room ID");
    const trimmedId = id.trim();

    // If ID is an external ID (gmeet- or youtube-), we need to find the meeting and redirect
    if (trimmedId.startsWith('gmeet-') || trimmedId.startsWith('youtube-')) {
      // Search in scheduled, invitations, OR history for maximum coverage
      const m = scheduled.find(s => s.roomId === trimmedId) ||
        history.find(h => h.roomId === trimmedId) ||
        invitations.find(i => i.meetingId?.roomId === trimmedId)?.meetingId;

      if (m && m.externalUrl) {
        window.open(m.externalUrl.startsWith('http') ? m.externalUrl : `https://${m.externalUrl}`, '_blank');
        return;
      }
    }

    navigate(`/meeting/${trimmedId}`);
  };

  const handleSearchEmployees = useCallback(async (query, sDate = searchStartDate, eDate = searchEndDate, st = selectedState, dt = selectedDistrict, bl = selectedBlock, pt = selectedPanchayat) => {
    if (isLocked) return;
    setSearchQuery(query);
    try {
      setSearching(true);
      const res = await api.meetings.searchEmployees({
        query,
        startDate: sDate,
        endDate: eDate,
        state: st,
        district: dt,
        block: bl,
        panchayat: pt
      });
      if (res.success) setSearchResults(res.data);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setSearching(false);
    }
  }, [isLocked, searchStartDate, searchEndDate, selectedState, selectedDistrict, selectedBlock, selectedPanchayat]);

  useEffect(() => {
    handleSearchEmployees(searchQuery, searchStartDate, searchEndDate, selectedState, selectedDistrict, selectedBlock, selectedPanchayat);
  }, [selectedState, selectedDistrict, selectedBlock, selectedPanchayat]);

  const toggleParticipant = useCallback((user) => {
    if (isLocked) return;
    setSelectedParticipants(prev => {
      if (prev.find(p => p.userId === user.userId)) {
        return prev.filter(p => p.userId !== user.userId);
      } else {
        return [...prev, user];
      }
    });
  }, [isLocked]);

  const selectAll = () => {
    const newSelected = [...selectedParticipants];
    filteredResults.forEach(user => {
      if (!newSelected.find(p => p.userId === user.userId)) {
        newSelected.push(user);
      }
    });
    setSelectedParticipants(newSelected);
  };

  const unselectAll = () => {
    setSelectedParticipants([]);
  };

  const handleScheduleSubmit = async () => {
    if (isLocked) return;

    if (meetingType === 'scheduled' && (!scheduleDate || !scheduleTime)) {
      return toast.error("Please fill in all required fields");
    }

    const scheduledFor = meetingType === 'instant' ? new Date() : new Date(`${scheduleDate}T${scheduleTime}`);

    if (meetingType === 'scheduled' && scheduledFor < new Date()) {
      return toast.error("Scheduled time must be in the future");
    }

    setLoading(true);
    const finalDuration = meetingDuration === -1 ? (Number(customHours) * 60 + Number(customMinutes)) : meetingDuration;

    try {
      const res = await api.meetings.create({
        title: scheduleTitle,
        type: meetingType,
        scheduledFor: scheduledFor.toISOString(),
        invitedParticipants: selectedParticipants.map(p => p.userId),
        duration: finalDuration,
        platform: meetingPlatform,
        externalUrl: meetingPlatform === 'gmeet' ? gmeetUrl : (meetingPlatform === 'youtube' ? youtubeUrl : null)
      });

      if (res.success) {
        toast.success(meetingType === 'instant' ? "Instant Meet started!" : "Meeting scheduled successfully!");
        if (res.data.broadcastJobId) {
          addJob({ _id: res.data.broadcastJobId, title: `Meeting: ${scheduleTitle}`, status: "pending", sentCount: 0, totalCandidates: selectedParticipants.length });
        }
        setShowScheduleModal(false);
        setShowGMeetModal(false);
        setShowYouTubeModal(false);
        fetchScheduled();
        // Reset form
        setScheduleTitle('');
        setScheduleDate('');
        setScheduleTime('');
        setSelectedParticipants([]);
        setMeetingPlatform('internal');
        setMeetingType('instant');
        setGmeetUrl('');
        setYoutubeUrl('');
      }
    } catch (error) {
      toast.error("Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };

  const handleAuditClick = (meeting, editMode = false) => {
    setSelectedMeeting(meeting);
    setObservations(meeting.observations || '');
    setIsEditMode(editMode);
    setShowAuditModal(true);
  };

  const handleAddPoint = async () => {
    if (!newPoint.trim()) return;
    try {
      const res = await api.meetings.addPoint(selectedMeeting._id, newPoint);
      if (res.success) {
        setSelectedMeeting({ ...selectedMeeting, meetingPoints: res.data });
        setNewPoint('');
        fetchHistory();
      }
    } catch (err) {
      toast.error("Failed to add point");
    }
  };

  const handleDeletePoint = async (pointId) => {
    try {
      const res = await api.meetings.deletePoint(selectedMeeting._id, pointId);
      if (res.success) {
        const updatedPoints = selectedMeeting.meetingPoints.filter(p => p._id !== pointId);
        setSelectedMeeting({ ...selectedMeeting, meetingPoints: updatedPoints });
        fetchHistory();
      }
    } catch (err) {
      toast.error("Failed to delete point");
    }
  };

  const handleUpdateObservations = async () => {
    try {
      const res = await api.meetings.updateObservations(selectedMeeting._id, observations);
      if (res.success) {
        toast.success("Observations updated");
        fetchHistory();
      }
    } catch (err) {
      toast.error("Failed to update observations");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);

    try {
      setUploading(true);
      const res = await api.meetings.uploadAttachment(selectedMeeting._id, formData);
      if (res.success) {
        setSelectedMeeting({ ...selectedMeeting, attachments: res.data });
        toast.success("File uploaded successfully");
        fetchHistory();
      }
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const getAttachmentUrl = (url) => {
    const baseUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";
    // If baseUrl ends with /api, remove it to get the static folder root
    const rootUrl = baseUrl.replace(/\/api$/, "");
    return `${rootUrl}${url}`;
  };

  useEffect(() => {
    if (showScheduleModal || showGMeetModal || showYouTubeModal) {
      handleSearchEmployees("");
    }
  }, [showScheduleModal, showGMeetModal, showYouTubeModal]);

  return (
    <DashboardLayout>

      <div className="p-8 max-w-7xl mx-auto space-y-10 w-full min-h-screen relative">
        <div className={`space-y-10 transition-all duration-500 ${isLocked ? 'blur-[3px] pointer-events-none select-none opacity-60' : ''}`}>
          {/* Clean Header */}
          <div className="bg-[#3AB000] border border-[#3AB000] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-none text-white">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight leading-none mb-2">Meeting Hub</h1>
              <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.4em]">Connect with your team instantly</p>
            </div>

            <div className="flex bg-white/10 p-1 rounded-none border border-white/20 backdrop-blur-md">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-10 py-3 rounded-none font-black uppercase tracking-widest text-[11px] transition-all ${activeTab === 'overview' ? 'bg-white text-[#3AB000]' : 'text-white hover:bg-white/10'
                  }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-10 py-3 rounded-none font-black uppercase tracking-widest text-[11px] transition-all ${activeTab === 'history' ? 'bg-white text-[#3AB000]' : 'text-white hover:bg-white/10'
                  }`}
              >
                History
              </button>
            </div>
          </div>

          {/* Active Invitations Banner */}
          {pendingInvitations.length > 0 && (
            (() => {
              const inv = pendingInvitations[0];
              const isYouTube = inv.meetingId?.platform === 'youtube';

              return (
                <div className={`${isYouTube ? 'bg-[#FF0000]' : 'bg-[#3AB000]'} p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-l-8 border-white animate-in slide-in-from-top-4 duration-500`}>
                  <div className="flex items-center gap-6 text-white">
                    <div className="w-14 h-14 bg-white/20 flex items-center justify-center animate-pulse">
                      {isYouTube ? <Youtube size={32} strokeWidth={2.5} /> : <Video size={28} strokeWidth={3} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">
                        {isYouTube ? 'LIVE STREAM PROTOCOL' : 'Incoming Request'}
                      </p>
                      <h3 className="text-xl font-black uppercase tracking-tight leading-none italic">
                        {isYouTube ? 'MANDATORY YOUTUBE LIVE SESSION' : `${inv.senderId?.name} is inviting you`}
                      </h3>
                      <p className="text-[11px] font-bold opacity-90 mt-1 uppercase tracking-widest">
                        {isYouTube ? 'THIS IS A LIVE STREAMING SESSION - PLEASE JOIN IMMEDIATELY' : (inv.meetingId?.title || 'Video Session')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                      onClick={() => handleInviteAction(inv._id, 'accepted', inv.meetingId?.roomId)}
                      className={`w-full md:w-auto px-16 py-4 bg-white ${isYouTube ? 'text-[#FF0000]' : 'text-[#3AB000]'} font-black uppercase tracking-widest text-[12px] shadow-lg hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3`}
                    >
                      {isYouTube ? 'JOIN LIVE STREAM NOW' : 'Join Session'} <ChevronRight size={18} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              );
            })()
          )}

          {/* Ongoing Sessions (Re-join) */}
          {ongoingSessions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em]">Ongoing Sessions</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ongoingSessions.map((session) => {
                  const meeting = session.meetingId;
                  if (!meeting) return null;
                  const isExternal = meeting.platform !== 'internal';
                  const isYouTube = meeting.platform === 'youtube';
                  const isGMeet = meeting.platform === 'gmeet';

                  return (
                    <div key={session._id} className="bg-white border-2 border-gray-100 p-5 flex items-center justify-between group hover:border-[#3AB000] transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 flex items-center justify-center text-white ${isYouTube ? 'bg-red-600' : (isGMeet ? 'bg-blue-600' : 'bg-[#3AB000]')}`}>
                          {isYouTube ? <Youtube size={20} /> : <Video size={20} />}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-gray-900 uppercase truncate max-w-[150px]">{meeting.title}</h4>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Live Now</p>
                        </div>
                      </div>
                      {isExternal ? (
                        <a
                          href={meeting.externalUrl?.startsWith('http') ? meeting.externalUrl : `https://${meeting.externalUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#3AB000] transition-all"
                        >
                          Re-join
                        </a>
                      ) : (
                        <button
                          onClick={() => handleJoin(meeting.roomId, meeting)}
                          className="px-4 py-2 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#3AB000] transition-all"
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Actions Column */}
            <div className={`${activeTab === 'history' ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-8`}>
              {activeTab === 'overview' ? (
                <div className="space-y-8 w-full">
                  {/* Top Row: Internal Actions */}
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-8`}>
                    {/* Instant Meeting Card */}
                    {role !== 'employee' && (
                      <div className="bg-white border border-gray-200 p-8 flex flex-col gap-6 rounded-none transition-all hover:border-[#3AB000] group relative overflow-hidden">
                        <div className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-none flex items-center justify-center text-[#3AB000] group-hover:bg-[#3AB000] group-hover:text-white transition-all duration-300">
                          <Plus size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2 leading-tight">Start Instant Meeting</h3>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-4">Internal VideoSDK session</p>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Duration</label>
                              <select
                                value={meetingDuration}
                                onChange={(e) => setMeetingDuration(Number(e.target.value))}
                                className="w-full bg-gray-50 border border-gray-200 p-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#3AB000] focus:bg-white transition-all"
                              >
                                {DURATION_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="mt-auto pt-4 flex gap-2">
                          <button
                            onClick={handleCreateInstant}
                            disabled={loading}
                            className="flex-1 bg-[#3AB000] text-white py-4 rounded-none font-black uppercase tracking-[0.2em] text-[9px] hover:bg-black transition-all disabled:opacity-50"
                          >
                            {loading ? '...' : 'Start Now'}
                          </button>
                          <button
                            onClick={() => {
                              setMeetingPlatform('internal');
                              setShowScheduleModal(true);
                            }}
                            className="px-4 bg-white text-gray-900 border border-gray-200 rounded-none hover:border-[#3AB000] hover:text-[#3AB000] transition-all"
                            title="Schedule for later"
                          >
                            <Calendar size={18} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Join Card */}
                    <div className={`bg-white border border-gray-200 p-8 flex flex-col gap-6 rounded-none transition-all hover:border-[#3AB000] group relative overflow-hidden`}>
                      <div className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-none flex items-center justify-center text-gray-400 group-hover:bg-[#3AB000] group-hover:text-white transition-all duration-300">
                        <LogIn size={28} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2 leading-tight">Join with ID</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-4">Enter Meeting code to join</p>
                        <div className="relative">
                          <input
                            type="text"
                            value={roomIdInput}
                            onChange={(e) => setRoomIdInput(e.target.value)}
                            placeholder="MEETING ID"
                            className="w-full bg-gray-50 border border-gray-200 px-4 py-4 rounded-none font-black text-gray-900 outline-none focus:border-[#3AB000] focus:bg-white transition-all placeholder:text-gray-300 uppercase tracking-widest text-[10px]"
                          />
                        </div>
                      </div>
                      <div className="mt-auto pt-4">
                        <button
                          onClick={() => handleJoin()}
                          className="w-full bg-[#3AB000] text-white py-4 rounded-none font-black uppercase tracking-[0.2em] text-[9px] hover:bg-black transition-all"
                        >
                          Verify & Join
                        </button>
                      </div>
                    </div>

                    {/* GMeet Card */}
                    <div className="bg-white border-2 border-dashed border-blue-200 p-8 flex flex-col justify-between gap-8 rounded-none transition-all hover:border-blue-400 hover:bg-blue-50/10 group relative overflow-hidden shadow-sm">
                      <div className="flex items-center gap-6 relative z-10">
                        <div className="w-14 h-14 bg-white border border-blue-100 rounded-none flex items-center justify-center text-blue-500 shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                          <ExternalLink size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                          <div className="flex gap-1 mb-2"><div className="w-2 h-2 bg-red-500" /><div className="w-2 h-2 bg-blue-500" /><div className="w-2 h-2 bg-green-500" /><div className="w-2 h-2 bg-yellow-500" /></div>
                          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter leading-none mb-2">Google Meet Session</h3>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                            Conduct interviews or large group sessions.
                          </p>
                        </div>
                      </div>

                      <div className="relative z-10">
                        <button
                          onClick={() => {
                            setMeetingPlatform('gmeet');
                            setShowGMeetModal(true);
                          }}
                          className="w-full bg-blue-600 text-white py-4 rounded-none font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-900 shadow-xl shadow-blue-100 transition-all"
                        >
                          Setup GMeet
                        </button>
                      </div>
                      <div className="absolute -right-6 -bottom-6 text-blue-50 opacity-[0.05] pointer-events-none">
                        <ExternalLink size={120} />
                      </div>
                    </div>

                    {/* YouTube Card */}
                    {role !== 'employee' && (
                      <div className="bg-white border-2 border-dashed border-red-200 p-8 flex flex-col justify-between gap-8 rounded-none transition-all hover:border-red-400 hover:bg-red-50/10 group relative overflow-hidden shadow-sm">
                        <div className="flex items-center gap-6 relative z-10">
                          <div className="w-14 h-14 bg-white border border-red-100 rounded-none flex items-center justify-center text-red-500 shadow-sm group-hover:bg-red-500 group-hover:text-white transition-all duration-500">
                            <Youtube size={24} strokeWidth={2.5} />
                          </div>
                          <div>
                            <div className="w-8 h-1 bg-red-500 mb-2" />
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter leading-none mb-2">YouTube Live Session</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                              Broadcast training to massive audiences.
                            </p>
                          </div>
                        </div>

                        <div className="relative z-10">
                          <button
                            onClick={() => {
                              setMeetingPlatform('youtube');
                              setShowYouTubeModal(true);
                            }}
                            className="w-full bg-red-600 text-white py-4 rounded-none font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-900 shadow-xl shadow-red-100 transition-all"
                          >
                            Setup YouTube
                          </button>
                        </div>
                        <div className="absolute -right-6 -bottom-6 text-red-50 opacity-[0.05] pointer-events-none">
                          <Youtube size={120} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* History Log */
                <div className="bg-white border border-gray-300 rounded-none overflow-hidden">
                  <div className="p-8 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-3">
                        <History size={18} className="text-[#3AB000]" />
                        Session Audit Log
                      </h2>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-7">Official recorded sessions and outcomes</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Platform</span>
                        <select
                          value={historyPlatform}
                          onChange={(e) => setHistoryPlatform(e.target.value)}
                          className="h-9 border-2 border-gray-100 bg-white px-3 text-[9px] font-black uppercase outline-none focus:border-[#3AB000] transition-all"
                        >
                          <option value="all">All Platforms</option>
                          <option value="internal">Internal</option>
                          <option value="gmeet">Google Meet</option>
                          <option value="youtube">YouTube</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Date</span>
                        <input
                          type="date"
                          value={historyStartDate}
                          onChange={(e) => setHistoryStartDate(e.target.value)}
                          className="h-9 border-2 border-gray-100 bg-white px-3 text-[9px] font-black uppercase outline-none focus:border-[#3AB000] transition-all"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">End Date</span>
                        <input
                          type="date"
                          value={historyEndDate}
                          onChange={(e) => setHistoryEndDate(e.target.value)}
                          className="h-9 border-2 border-gray-100 bg-white px-3 text-[9px] font-black uppercase outline-none focus:border-[#3AB000] transition-all"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] opacity-0">Spacer</span>
                        <button
                          onClick={() => {
                            setHistoryStartDate('');
                            setHistoryEndDate('');
                            setHistoryPlatform('all');
                          }}
                          className="h-9 px-4 text-[9px] font-black uppercase text-red-500 hover:bg-red-50 transition-colors border-2 border-transparent"
                        >
                          Clear
                        </button>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] opacity-0">Spacer</span>
                        <button onClick={fetchHistory} className="h-9 flex items-center gap-2 text-[9px] font-black text-white bg-[#3AB000] px-4 uppercase hover:bg-black transition-all">
                          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                          Sync
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-hide">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-[#3AB000] text-white">
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest border-r border-white/10">Meeting Details</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest border-r border-white/10 text-center">Platform</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest border-r border-white/10 text-center">Schedule</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest border-r border-white/10 text-center">Duration</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest border-r border-white/10 text-center">Meeting Points</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {history.map((item) => (
                          <tr key={item._id} className="hover:bg-green-50/50 transition-colors group">
                            <td className="px-10 py-8">
                              <p className="font-black text-gray-900 text-sm uppercase tracking-tight group-hover:text-[#3AB000] transition-colors">{item.title}</p>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 font-mono">{item.roomId}</p>
                            </td>
                            <td className="px-10 py-8 text-center">
                              <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 border-2 ${item.platform === 'gmeet'
                                ? 'border-blue-100 bg-blue-50 text-blue-600'
                                : item.platform === 'youtube'
                                  ? 'border-red-100 bg-red-50 text-red-600'
                                  : 'border-green-100 bg-green-50 text-[#3AB000]'
                                }`}>
                                {item.platform === 'gmeet' ? 'Google Meet' : (item.platform === 'youtube' ? 'YouTube' : 'Internal')}
                              </span>
                            </td>
                            <td className="px-10 py-8 text-center">
                              <p className="text-xs font-black text-gray-900 uppercase">{(() => { const d = item.startTime || item.scheduledFor || item.createdAt; return d && !isNaN(new Date(d).getTime()) ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A' })()}</p>
                              <p className="text-[9px] font-black text-[#3AB000] mt-1 uppercase tracking-widest">{(() => { const d = item.startTime || item.scheduledFor || item.createdAt; return d && !isNaN(new Date(d).getTime()) ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'JUST NOW' })()}</p>
                            </td>
                            <td className="px-10 py-8 text-center">
                              {item.endTime ? (
                                <span className="text-[10px] font-black text-[#3AB000] bg-green-50 px-4 py-2 border border-[#3AB000]/10 uppercase tracking-widest">
                                  {(() => {
                                    const start = item.startTime || item.scheduledFor || item.createdAt;
                                    const diff = (new Date(item.endTime) - new Date(start)) / 60000;
                                    return !isNaN(diff) ? Math.round(diff) : 0;
                                  })()}M Session
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-2 text-[#3AB000] bg-green-50 px-4 py-2 border border-[#3AB000]/20 text-[10px] font-black uppercase tracking-widest">
                                  <span className="w-1.5 h-1.5 bg-[#3AB000] rounded-none animate-pulse" />
                                  Active Now
                                </span>
                              )}
                            </td>
                            <td className="px-10 py-8 text-center">
                              <button
                                onClick={() => handleAuditClick(item, true)}
                                className="inline-flex items-center gap-2 text-[#3AB000] hover:text-black transition-colors"
                              >
                                <FileText size={14} />
                                <span className="text-[9px] font-black uppercase tracking-widest underline">Manage Audit & Points</span>
                              </button>
                            </td>
                            <td className="px-10 py-8 text-right flex items-center justify-end gap-2">
                              {(role === 'admin' || role === 'staff') && (
                                <button
                                  onClick={() => handleOpenReminderModal(item)}
                                  className="p-3 bg-white text-[#3AB000] hover:bg-[#3AB000] hover:text-white border border-[#3AB000]/30 transition-all rounded-none shadow-sm flex items-center gap-2"
                                  title="Broadcast Reminder"
                                >
                                  <Bell size={18} strokeWidth={2.5} />
                                  <span className="text-[9px] font-black uppercase hidden xl:inline">Remind</span>
                                </button>
                              )}
                              {!item.endTime && (role === 'admin' || role === 'staff') && (
                                <button
                                  onClick={() => handleForceEnd(item.roomId)}
                                  className="p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 transition-all rounded-none shadow-sm"
                                  title="End Session"
                                >
                                  <Power size={18} strokeWidth={2.5} />
                                </button>
                              )}
                              <button
                                onClick={() => handleAuditClick(item, false)}
                                className="p-3 bg-green-50 text-[#3AB000] hover:bg-black hover:text-white border border-[#3AB000]/20 transition-all rounded-none shadow-sm"
                                title="View Meeting Audit & Points"
                              >
                                <Eye size={18} strokeWidth={2.5} />
                              </button>
                              {item.platform !== 'internal' && item.externalUrl && (
                                <button
                                  onClick={() => window.open(item.externalUrl.startsWith('http') ? item.externalUrl : `https://${item.externalUrl}`, '_blank')}
                                  className={`p-3 border transition-all rounded-none shadow-sm ${item.platform === 'youtube' ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-red-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-200'}`}
                                  title={`Open ${item.platform === 'youtube' ? 'YouTube' : 'GMeet'} Session`}
                                >
                                  {item.platform === 'youtube' ? <Youtube size={18} strokeWidth={2.5} /> : <ExternalLink size={18} strokeWidth={2.5} />}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {history.length === 0 && <div className="p-32 text-center text-gray-300 font-black uppercase text-[10px] tracking-[0.4em]">No meetings found</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Right Pipeline Column */}
            {activeTab === 'overview' && (
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-white border border-gray-200 border-t-8 border-t-[#3AB000] p-10 flex flex-col h-full min-h-[500px] rounded-none">
                  <div className="flex items-center justify-between mb-10 border-b border-gray-100 pb-6">
                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-3">
                      <Calendar size={18} className="text-[#3AB000]" />
                      Upcoming Meetings
                    </h3>
                    <span className="bg-gray-100 text-[#3AB000] px-4 py-1.5 rounded-none text-[10px] font-black border border-gray-200">{scheduled.length}</span>
                  </div>

                  <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                    {scheduled.map((item) => {
                      const isGMeet = item.platform === 'gmeet';
                      return (
                        <div key={item._id} className={`p-6 rounded-none border-2 transition-all group relative ${isGMeet
                          ? 'border-blue-100 bg-blue-50/30 hover:border-blue-400'
                          : 'border-gray-100 bg-gray-50/30 hover:border-[#3AB000]'
                          }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {isGMeet && <div className="flex gap-0.5"><div className="w-1 h-1 bg-red-500" /><div className="w-1 h-1 bg-blue-500" /><div className="w-1 h-1 bg-green-500" /><div className="w-1 h-1 bg-yellow-500" /></div>}
                                <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${isGMeet ? 'text-blue-600' : (item.platform === 'youtube' ? 'text-red-600' : 'text-gray-400')}`}>
                                  {item.platform === 'gmeet' ? 'Google Meet Session' : (item.platform === 'youtube' ? 'YouTube Live Session' : 'Internal Meeting')}
                                </span>
                              </div>
                              <h4 className={`font-black text-sm leading-tight mb-4 transition-colors uppercase tracking-tight ${isGMeet ? 'text-blue-900 group-hover:text-blue-600' : 'text-gray-900 group-hover:text-[#3AB000]'
                                }`}>{item.title}</h4>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Calendar size={13} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">
                                    {item.scheduledFor && !isNaN(new Date(item.scheduledFor).getTime())
                                      ? new Date(item.scheduledFor).toLocaleDateString()
                                      : 'TBD'}
                                  </span>
                                </div>
                                <div className={`flex items-center gap-2 ${isGMeet ? 'text-blue-500' : 'text-[#3AB000]'}`}>
                                  <Clock size={13} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">
                                    {item.scheduledFor && !isNaN(new Date(item.scheduledFor).getTime())
                                      ? new Date(item.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                      : 'PENDING'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {item.platform !== 'internal' && item.externalUrl ? (
                              <a
                                href={item.externalUrl.startsWith('http') ? item.externalUrl : `https://${item.externalUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-12 h-12 border-2 transition-all rounded-none flex items-center justify-center ${isGMeet
                                  ? 'bg-white border-blue-200 text-blue-400 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                                  : 'bg-white border-red-200 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600'
                                  }`}
                              >
                                <LogIn size={20} strokeWidth={3} />
                              </a>
                            ) : (
                              <button
                                onClick={() => handleJoin(item.roomId, item)}
                                className="w-12 h-12 border-2 bg-white border-gray-300 text-gray-400 hover:bg-[#3AB000] hover:text-white hover:border-[#3AB000] transition-all rounded-none flex items-center justify-center"
                              >
                                <LogIn size={20} strokeWidth={3} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {scheduled.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-28 text-center opacity-40">
                        <Calendar size={48} className="text-gray-200 mb-6" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] italic text-gray-300">Pipeline Inactive</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-10 pt-10 border-t border-gray-100">
                    <div className="flex items-start gap-4 p-6 bg-gray-50 border border-gray-200">
                      <Users size={20} className="text-[#3AB000] mt-1" />
                      <div>
                        <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-1">Invite Team</h4>
                        <p className="text-[9px] text-gray-400 leading-relaxed font-black uppercase tracking-widest">Start a collaborative session with your colleagues.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Meeting Modal - Sharp & Clean */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl rounded-none relative z-10 border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-10 pb-6 flex justify-between items-center border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#3AB000] text-white rounded-none flex items-center justify-center border-b-4 border-l-4 border-black/10">
                    <Calendar size={32} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="font-black text-3xl text-gray-900 uppercase tracking-tighter leading-none">Schedule Meeting</h3>
                    <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.4em] mt-1">Plan your next team collaboration</p>
                  </div>
                </div>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={28} /></button>
              </div>

              <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {/* Left Side: Details */}
                <div className="w-full lg:w-1/2 p-10 space-y-8 border-r border-gray-100 overflow-y-auto">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Meeting Title</label>
                    <input
                      type="text"
                      placeholder="ENTER MEETING SUBJECT..."
                      value={scheduleTitle}
                      onChange={(e) => setScheduleTitle(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 p-5 rounded-none font-bold text-gray-900 outline-none focus:border-[#3AB000] focus:bg-white transition-all uppercase placeholder:text-gray-300 text-sm tracking-widest shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Meeting Date</label>
                      <input
                        type="date"
                        value={scheduleDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 p-5 rounded-none font-bold text-gray-900 outline-none focus:border-[#3AB000] focus:bg-white transition-all uppercase text-sm tracking-widest shadow-inner"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Meeting Time</label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-gray-100 p-4 text-[11px] font-black uppercase outline-none focus:border-[#3AB000] focus:bg-white transition-all shadow-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Session Duration</label>
                      <select
                        value={meetingDuration}
                        onChange={(e) => setMeetingDuration(Number(e.target.value))}
                        className="w-full bg-gray-50 border-2 border-gray-100 p-4 text-[11px] font-black uppercase outline-none focus:border-[#3AB000] focus:bg-white transition-all shadow-sm"
                      >
                        {DURATION_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>

                      {meetingDuration === -1 && (
                        <div className="grid grid-cols-2 gap-3 mt-2 animate-in slide-in-from-top-2 duration-300">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black text-[#3AB000] uppercase tracking-widest">Hours</label>
                            <input
                              type="number"
                              min="0"
                              value={customHours}
                              onChange={(e) => setCustomHours(e.target.value)}
                              className="w-full bg-white border-2 border-[#3AB000]/20 p-3 text-[11px] font-black outline-none focus:border-[#3AB000]"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-black text-[#3AB000] uppercase tracking-widest">Minutes</label>
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={customMinutes}
                              onChange={(e) => setCustomMinutes(e.target.value)}
                              className="w-full bg-white border-2 border-[#3AB000]/20 p-3 text-[11px] font-black outline-none focus:border-[#3AB000]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 bg-green-50/50 border border-[#3AB000]/10 rounded-none">
                    <p className="text-[9px] font-black text-[#3AB000] uppercase tracking-[0.2em] leading-relaxed">
                      Invitations will be sent automatically to all selected team members once the meeting is scheduled.
                    </p>
                  </div>
                </div>

                {/* Right Side: Members */}
                <div className="w-full lg:w-1/2 p-10 bg-gray-50/30 flex flex-col overflow-hidden">
                  <div className="space-y-4 flex flex-col h-full">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Select Team Members</label>

                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input
                          type="text"
                          placeholder="SEARCH COLLEAGUES BY NAME..."
                          value={searchQuery}
                          onChange={(e) => handleSearchEmployees(e.target.value)}
                          className="w-full bg-white border border-gray-200 p-4 pl-12 rounded-none font-bold text-gray-900 outline-none focus:border-[#3AB000] transition-all uppercase text-xs tracking-widest"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">MOU FROM</label>
                          <input
                            type="date"
                            value={searchStartDate}
                            onChange={(e) => {
                              setSearchStartDate(e.target.value);
                              handleSearchEmployees(searchQuery, e.target.value, searchEndDate);
                            }}
                            className="w-full bg-white border border-gray-300 p-2 text-[10px] font-black uppercase outline-none focus:border-[#3AB000] transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">MOU TO</label>
                          <input
                            type="date"
                            value={searchEndDate}
                            onChange={(e) => {
                              setSearchEndDate(e.target.value);
                              handleSearchEmployees(searchQuery, searchStartDate, e.target.value);
                            }}
                            className="w-full bg-white border border-gray-300 p-2 text-[10px] font-black uppercase outline-none focus:border-[#3AB000] transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {ROLES.map(role => (
                          <button
                            key={role.value}
                            onClick={() => setSelectedRoleFilter(role.value)}
                            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border-2 transition-all ${selectedRoleFilter === role.value
                              ? 'bg-[#3AB000] border-[#3AB000] text-white shadow-md'
                              : 'bg-white border-gray-100 text-gray-400 hover:border-[#3AB000]/30'
                              }`}
                          >
                            {role.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {filteredResults.length > 0 && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-200 bg-white px-3 shadow-sm">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={selectAll}
                            className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest hover:text-black transition-colors flex items-center gap-1"
                          >
                            <Check size={12} strokeWidth={3} />
                            Select All
                          </button>
                          <div className="w-1 h-1 bg-gray-300 rounded-full" />
                          <button
                            onClick={unselectAll}
                            className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-600 transition-colors flex items-center gap-1"
                          >
                            <X size={12} strokeWidth={3} />
                            Unselect All
                          </button>
                        </div>

                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-hide min-h-[300px] flex flex-col">
                      <TeamList
                        results={filteredResults}
                        selectedParticipants={selectedParticipants}
                        onToggle={toggleParticipant}
                        searching={searching}
                        themeColor="#3AB000"
                      />
                    </div>

                    {selectedParticipants.length > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Selected ({selectedParticipants.length})</span>
                          <button onClick={unselectAll} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">Clear All</button>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                          {selectedParticipants.map(p => (
                            <span key={`tag-${p.userId}`} className="inline-flex items-center gap-1.5 bg-gray-900 text-white pl-3 pr-1 py-1 rounded-none text-[9px] font-black uppercase border-l-2 border-[#3AB000]">
                              {p.name}
                              <button onClick={() => toggleParticipant(p)} className="p-0.5 hover:text-red-500"><X size={10} /></button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-10 bg-gray-50 border-t border-gray-200 flex justify-end gap-10">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="font-black uppercase tracking-widest text-[11px] text-gray-400 hover:text-gray-900 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleSubmit}
                  disabled={loading}
                  className="bg-[#3AB000] text-white px-16 py-4 rounded-none font-black uppercase tracking-[0.2em] text-[12px] hover:bg-black transition-all disabled:opacity-50"
                >
                  {loading ? 'SCHEDULING...' : 'Schedule Meeting'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Audit & Points Modal */}
        {showAuditModal && selectedMeeting && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-6xl rounded-none relative z-10 border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-8 pb-6 flex justify-between items-center border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-900 text-[#3AB000] flex items-center justify-center">
                    <FileBox size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-black text-3xl text-gray-900 uppercase tracking-tight leading-none">{selectedMeeting.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs font-bold text-[#3AB000] uppercase tracking-wide">
                        {isEditMode ? 'Session Audit & Management' : 'Session Discussion Summary'}
                      </p>
                      {!isEditMode && (
                        <span className="bg-[#3AB000] text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-tighter shadow-sm">Official Record</span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowAuditModal(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <X size={28} />
                </button>
              </div>

              <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {/* Left Side: Points & POC */}
                <div className="flex-1 p-8 space-y-8 overflow-y-auto border-r border-gray-100">
                  {/* Key Points Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <PlusCircle size={18} className="text-[#3AB000]" />
                        Key Meeting Points
                      </h4>
                      <span className="text-xs font-bold text-gray-400">{(selectedMeeting.meetingPoints || []).length} Points Added</span>
                    </div>

                    <div className="space-y-4">
                      {(selectedMeeting.meetingPoints || []).length > 0 ? (
                        (selectedMeeting.meetingPoints || []).map((point, idx) => (
                          <div key={point._id || idx} className={`flex items-start gap-4 ${isEditMode ? 'p-5 bg-green-50/30 border-l-4 border-[#3AB000]' : 'p-6 bg-white border-b border-gray-100'} group transition-all`}>
                            <div className="flex-1">
                              <p className={`${isEditMode ? 'text-sm' : 'text-base'} font-bold text-gray-800 leading-relaxed`}>{point.text}</p>
                              <p className="text-[10px] font-black text-gray-400 uppercase mt-2 tracking-tight italic">Added on {new Date(point.timestamp).toLocaleString()}</p>
                            </div>
                            {isEditMode && (
                              <button
                                onClick={() => handleDeletePoint(point._id)}
                                className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-10 text-center border-2 border-dashed border-gray-100 bg-gray-50/50">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">No discussion points recorded for this session</p>
                        </div>
                      )}

                      {isEditMode && (
                        <div className="flex items-center gap-2 mt-4">
                          <input
                            type="text"
                            value={newPoint}
                            onChange={(e) => setNewPoint(e.target.value)}
                            placeholder="TYPE A KEY MEETING POINT AND PRESS ENTER..."
                            className="flex-1 bg-white border-2 border-gray-100 p-4 text-xs font-bold uppercase tracking-wide outline-none focus:border-[#3AB000] transition-all shadow-sm"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddPoint()}
                          />
                          <button
                            onClick={handleAddPoint}
                            className="p-4 bg-[#3AB000] text-white hover:bg-black transition-all shadow-lg flex items-center justify-center min-w-[56px]"
                          >
                            <Plus size={24} strokeWidth={3} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Observations Section */}
                  <div className="space-y-4 pt-8 border-t border-gray-100">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <FileText size={18} className="text-[#3AB000]" />
                      Final Observations / POC
                    </h4>

                    {isEditMode ? (
                      <>
                        <textarea
                          value={observations}
                          onChange={(e) => setObservations(e.target.value)}
                          placeholder="DESCRIBE THE MEETING OUTCOMES, NEXT STEPS, AND POINTS OF CONTACT..."
                          className="w-full h-48 bg-white border-2 border-gray-100 p-6 text-sm font-medium text-gray-700 outline-none focus:border-[#3AB000] transition-all resize-none leading-relaxed shadow-sm"
                        />
                        <button
                          onClick={handleUpdateObservations}
                          className="px-10 py-4 bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-[#3AB000] transition-all shadow-lg"
                        >
                          Save Observations
                        </button>
                      </>
                    ) : (
                      <div className="w-full relative">
                        <div className="absolute -top-3 left-6 px-3 bg-white text-[9px] font-black text-[#3AB000] uppercase tracking-widest border border-green-100">Audit Report Content</div>
                        <div className="w-full min-h-[15rem] bg-gray-50/30 border-2 border-gray-100 p-10 text-base font-bold text-gray-700 leading-relaxed whitespace-pre-wrap italic shadow-inner">
                          {selectedMeeting.observations || "No observations recorded for this session."}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Attachments */}
                <div className="w-full lg:w-80 bg-gray-50/50 p-8 flex flex-col">
                  <div className="flex items-center gap-2 mb-8">
                    <Paperclip size={20} className="text-[#3AB000]" />
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Attachments</h4>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3">
                    {(selectedMeeting.attachments || []).map((file, idx) => (
                      <div key={idx} className="p-4 bg-white border border-gray-200 shadow-sm group hover:border-[#3AB000] transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <FileText size={14} className="text-[#3AB000]" />
                          <a
                            href={getAttachmentUrl(file.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-[#3AB000] transition-colors"
                            download={file.name}
                          >
                            <Download size={16} />
                          </a>
                        </div>
                        <p className="text-xs font-black uppercase truncate text-gray-900">{file.name}</p>
                        <p className="text-[10px] font-bold text-[#3AB000] mt-1 uppercase tracking-tight italic">{(file.fileType || 'File').split('/')[1]}</p>
                      </div>
                    ))}

                    {(selectedMeeting.attachments || []).length === 0 && (
                      <div className="py-12 text-center opacity-30">
                        <Upload size={32} className="mx-auto mb-2" />
                        <p className="text-[9px] font-black uppercase tracking-widest">No Documents</p>
                      </div>
                    )}
                  </div>

                  {isEditMode && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <label className="block w-full">
                        <div className={`w-full flex flex-col items-center justify-center p-8 border-2 border-dashed transition-all cursor-pointer ${uploading ? 'bg-green-50 border-[#3AB000] animate-pulse' : 'bg-white border-gray-200 hover:border-[#3AB000] hover:bg-green-50/20'}`}>
                          <Upload size={24} className={uploading ? 'text-gray-400' : 'text-[#3AB000]'} />
                          <span className="text-xs font-black uppercase tracking-wider mt-3 text-gray-700">
                            {uploading ? 'UPLOADING...' : 'Upload Document'}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={uploading}
                          />
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="px-12 py-4 bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-[#3AB000] transition-all shadow-lg"
                >
                  Close Audit View
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Broadcast Reminder Modal */}
        {showReminderModal && (
          <BroadcastReminderModal
            meeting={selectedMeetingForReminder}
            onClose={() => setShowReminderModal(false)}
            onStart={handleStartBroadcast}
          />
        )}

        {isLocked && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/5 backdrop-blur-[2px]">
            <div className="bg-black/90 text-white px-8 py-4 text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl border-t-4 border-[#3AB000] animate-in zoom-in-95 duration-300">
              Access will be granted after official training
            </div>
          </div>
        )}
        {/* Google Meet Setup Modal */}
        {showGMeetModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white w-full max-w-4xl rounded-none relative z-10 border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-6 flex justify-between items-center border-b-4 border-blue-600 bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white text-blue-600 rounded-none flex items-center justify-center shadow-md border border-blue-100">
                    <ExternalLink size={24} strokeWidth={3} />
                  </div>
                  <div>
                    <div className="flex gap-1 mb-0.5"><div className="w-1.5 h-1.5 bg-red-500" /><div className="w-1.5 h-1.5 bg-blue-500" /><div className="w-1.5 h-1.5 bg-green-500" /><div className="w-1.5 h-1.5 bg-yellow-500" /></div>
                    <h3 className="font-black text-2xl text-gray-900 uppercase tracking-tight leading-none">Setup GMeet Session</h3>
                    <p className="text-[9px] font-black text-blue-600 uppercase mt-0.5 italic">Cost-efficient External Meeting</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowGMeetModal(false);
                    setMeetingPlatform('internal');
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {/* Left Side: GMeet Details */}
                <div className="w-full lg:w-1/2 p-6 space-y-6 border-r border-gray-100 overflow-y-auto bg-white">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase ml-1">Meeting Mode</label>
                      <div className="flex bg-gray-100 p-1 rounded-none border border-gray-200">
                        <button
                          onClick={() => setMeetingType('instant')}
                          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${meetingType === 'instant' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                          Instant
                        </button>
                        <button
                          onClick={() => setMeetingType('scheduled')}
                          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${meetingType === 'scheduled' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                          Scheduled
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-400 uppercase ml-1">Meeting Title</label>
                      <input
                        type="text"
                        placeholder="E.G. CANDIDATE INTERVIEW / SYNC..."
                        value={scheduleTitle}
                        onChange={(e) => setScheduleTitle(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-none font-bold text-gray-900 outline-none focus:border-blue-500 focus:bg-white transition-all uppercase placeholder:text-gray-300 text-xs shadow-inner"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-blue-600 uppercase ml-1 flex items-center gap-2">
                        Google Meet URL
                      </label>
                      <input
                        type="text"
                        placeholder="PASTE MEET.GOOGLE.COM LINK..."
                        value={gmeetUrl}
                        onChange={(e) => setGmeetUrl(e.target.value)}
                        className="w-full bg-blue-50/50 border-2 border-blue-100 p-3.5 rounded-none font-bold text-blue-900 outline-none focus:border-blue-600 focus:bg-white transition-all text-xs"
                      />
                    </div>

                    {meetingType === 'scheduled' && (
                      <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-gray-400 uppercase ml-1">Date</label>
                          <input
                            type="date"
                            value={scheduleDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-none font-bold text-gray-900 outline-none focus:border-blue-500 transition-all uppercase text-xs shadow-inner"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-gray-400 uppercase ml-1">Time</label>
                          <input
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-none font-bold text-gray-900 outline-none focus:border-blue-500 transition-all text-xs shadow-inner"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-blue-50 border-l-4 border-blue-600 shadow-sm">
                    <p className="text-[10px] font-black text-blue-900 uppercase leading-relaxed">
                      {meetingType === 'instant'
                        ? 'Meeting invitation will be sent to employees instantly.'
                        : 'Attendance will be tracked automatically upon clicking Join.'}
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleScheduleSubmit}
                      disabled={loading || !scheduleTitle || !gmeetUrl || (meetingType === 'scheduled' && (!scheduleDate || !scheduleTime))}
                      className="w-full bg-blue-600 text-white py-4 rounded-none font-black uppercase text-[11px] hover:bg-black transition-all disabled:opacity-50 shadow-xl shadow-blue-200"
                    >
                      {loading ? 'PROCESSING...' : meetingType === 'instant' ? 'START INSTANT MEET' : 'CONFIRM & SEND INVITES'}
                    </button>
                  </div>
                </div>

                {/* Right Side: Invite Members */}
                <div className="w-full lg:w-1/2 p-6 bg-gray-50/50 flex flex-col overflow-hidden">
                  <div className="space-y-3 flex flex-col h-full">
                    <label className="text-xs font-black text-gray-400 uppercase ml-1">Add Participants</label>

                    <div className="relative mb-2">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input
                        type="text"
                        placeholder="SEARCH TEAM MEMBERS..."
                        value={searchQuery}
                        onChange={(e) => handleSearchEmployees(e.target.value)}
                        className="w-full bg-white border border-gray-200 p-3.5 pl-10 rounded-none font-bold text-gray-900 outline-none focus:border-blue-500 transition-all uppercase text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 text-blue-600">MOU FROM</label>
                        <input
                          type="date"
                          value={searchStartDate}
                          onChange={(e) => {
                            setSearchStartDate(e.target.value);
                            handleSearchEmployees(searchQuery, e.target.value, searchEndDate);
                          }}
                          className="w-full bg-white border border-gray-300 p-2 text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 text-blue-600">MOU TO</label>
                        <input
                          type="date"
                          value={searchEndDate}
                          onChange={(e) => {
                            setSearchEndDate(e.target.value);
                            handleSearchEmployees(searchQuery, searchStartDate, e.target.value);
                          }}
                          className="w-full bg-white border border-gray-300 p-2 text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {ROLES.map(roleOpt => (
                        <button
                          key={roleOpt.value}
                          onClick={() => setSelectedRoleFilter(roleOpt.value)}
                          className={`px-3 py-2 text-[9.5px] font-black uppercase border-2 transition-all ${selectedRoleFilter === roleOpt.value
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                            : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200'
                            }`}
                        >
                          {roleOpt.label}
                        </button>
                      ))}
                    </div>

                    {(role === 'staff' || role === 'admin' || role === 'superadmin') && (
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <select
                          value={selectedState}
                          onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(''); setSelectedBlock(''); setSelectedPanchayat(''); }}
                          className="w-full bg-white border border-gray-300 p-2 text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all text-blue-600"
                        >
                          <option value="">All States</option>
                          {statesList.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select
                          value={selectedDistrict}
                          onChange={(e) => { setSelectedDistrict(e.target.value); setSelectedBlock(''); setSelectedPanchayat(''); }}
                          className="w-full bg-white border border-gray-300 p-2 text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all text-blue-600"
                        >
                          <option value="">All Districts</option>
                          {districtsList.map(d => <option key={d._id || d.name || d} value={d.name || d}>{(d.name || d).split(" / ")[0]}</option>)}
                        </select>
                        <select
                          value={selectedBlock}
                          onChange={(e) => { setSelectedBlock(e.target.value); setSelectedPanchayat(''); }}
                          className="w-full bg-white border border-gray-300 p-2 text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all text-blue-600"
                        >
                          <option value="">All Blocks</option>
                          {blocksList.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                        <select
                          value={selectedPanchayat}
                          onChange={(e) => setSelectedPanchayat(e.target.value)}
                          className="w-full bg-white border border-gray-300 p-2 text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all text-blue-600"
                        >
                          <option value="">All Panchayats</option>
                          {panchayatsList.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                      </div>
                    )}

                    {filteredResults.length > 0 && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-200 bg-white px-2 mb-1 shadow-sm">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={selectAll}
                            className="text-[10px] font-black text-blue-600 uppercase hover:text-black transition-colors flex items-center gap-1"
                          >
                            <Check size={10} strokeWidth={3} />
                            Select All
                          </button>
                          <div className="w-1 h-1 bg-gray-100 rounded-full" />
                          <button
                            onClick={unselectAll}
                            className="text-[10px] font-black text-gray-400 uppercase hover:text-red-600 transition-colors flex items-center gap-1"
                          >
                            <X size={10} strokeWidth={3} />
                            Unselect All
                          </button>
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase">
                          {selectedParticipants.length} Selected
                        </span>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 scrollbar-hide">
                      <TeamList
                        results={filteredResults}
                        selectedParticipants={selectedParticipants}
                        onToggle={toggleParticipant}
                        searching={searching}
                        themeColor="#2563eb"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* YouTube Setup Modal */}
        {showYouTubeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white w-full max-w-4xl rounded-none relative z-10 border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-6 flex justify-between items-center border-b-4 border-red-600 bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white text-red-600 rounded-none flex items-center justify-center shadow-md border border-red-100">
                    <Youtube size={24} strokeWidth={3} />
                  </div>
                  <div>
                    <div className="w-8 h-1.5 bg-red-600 mb-1" />
                    <h3 className="font-black text-2xl text-gray-900 uppercase tracking-tight leading-none">Setup YouTube Session</h3>
                    <p className="text-[9px] font-black text-red-600 uppercase mt-0.5 italic">Massive Audience Broadcasting</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowYouTubeModal(false);
                    setMeetingPlatform('internal');
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {/* Left Side: YouTube Details */}
                <div className="w-full lg:w-1/2 p-6 space-y-6 border-r border-gray-100 overflow-y-auto bg-white">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase ml-1">Streaming Mode</label>
                      <div className="flex bg-gray-100 p-1 rounded-none border border-gray-200">
                        <button
                          onClick={() => setMeetingType('instant')}
                          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${meetingType === 'instant' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                          Instant
                        </button>
                        <button
                          onClick={() => setMeetingType('scheduled')}
                          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${meetingType === 'scheduled' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                          Scheduled
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-400 uppercase ml-1">Session Title</label>
                      <input
                        type="text"
                        placeholder="E.G. COMPANY TOWN HALL / LIVE TRAINING..."
                        value={scheduleTitle}
                        onChange={(e) => setScheduleTitle(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-none font-bold text-gray-900 outline-none focus:border-red-500 focus:bg-white transition-all uppercase placeholder:text-gray-300 text-xs shadow-inner"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-red-600 uppercase ml-1 flex items-center gap-2">
                        YouTube Live URL
                      </label>
                      <input
                        type="text"
                        placeholder="PASTE YOUTUBE LIVE LINK..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="w-full bg-red-50/50 border-2 border-red-100 p-3.5 rounded-none font-bold text-red-900 outline-none focus:border-red-600 focus:bg-white transition-all text-xs"
                      />
                    </div>

                    {meetingType === 'scheduled' && (
                      <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-gray-400 uppercase ml-1">Date</label>
                          <input
                            type="date"
                            value={scheduleDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-none font-bold text-gray-900 outline-none focus:border-red-500 transition-all uppercase text-xs shadow-inner"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-gray-400 uppercase ml-1">Time</label>
                          <input
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-none font-bold text-gray-900 outline-none focus:border-red-500 transition-all text-xs shadow-inner"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-red-50 border-l-4 border-red-600 shadow-sm">
                    <p className="text-[10px] font-black text-red-900 uppercase leading-relaxed">
                      Broadcast will be available to all selected trainees via their dashboard.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleScheduleSubmit}
                      disabled={loading || !scheduleTitle || !youtubeUrl || (meetingType === 'scheduled' && (!scheduleDate || !scheduleTime))}
                      className="w-full bg-red-600 text-white py-4 rounded-none font-black uppercase text-[11px] hover:bg-black transition-all disabled:opacity-50 shadow-xl shadow-red-200"
                    >
                      {loading ? 'PROCESSING...' : meetingType === 'instant' ? 'START BROADCAST' : 'CONFIRM & SEND INVITES'}
                    </button>
                  </div>
                </div>

                {/* Right Side: Invite Members */}
                <div className="w-full lg:w-1/2 p-6 bg-gray-50/50 flex flex-col overflow-hidden">
                  <div className="space-y-3 flex flex-col h-full">
                    <label className="text-xs font-black text-gray-400 uppercase ml-1">Select Audience</label>

                    <div className="relative mb-2">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input
                        type="text"
                        placeholder="SEARCH TEAM MEMBERS..."
                        value={searchQuery}
                        onChange={(e) => handleSearchEmployees(e.target.value)}
                        className="w-full bg-white border border-gray-200 p-3.5 pl-10 rounded-none font-bold text-gray-900 outline-none focus:border-red-500 transition-all uppercase text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 text-red-600">MOU FROM</label>
                        <input
                          type="date"
                          value={searchStartDate}
                          onChange={(e) => {
                            setSearchStartDate(e.target.value);
                            handleSearchEmployees(searchQuery, e.target.value, searchEndDate);
                          }}
                          className="w-full bg-white border border-gray-300 p-2 text-[10px] font-black uppercase outline-none focus:border-red-500 transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 text-red-600">MOU TO</label>
                        <input
                          type="date"
                          value={searchEndDate}
                          onChange={(e) => {
                            setSearchEndDate(e.target.value);
                            handleSearchEmployees(searchQuery, searchStartDate, e.target.value);
                          }}
                          className="w-full bg-white border border-gray-300 p-2 text-[10px] font-black uppercase outline-none focus:border-red-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {ROLES.map(roleOpt => (
                        <button
                          key={roleOpt.value}
                          onClick={() => setSelectedRoleFilter(roleOpt.value)}
                          className={`px-3 py-2 text-[9.5px] font-black uppercase border-2 transition-all ${selectedRoleFilter === roleOpt.value
                            ? 'bg-red-600 border-red-600 text-white shadow-md'
                            : 'bg-white border-gray-100 text-gray-400 hover:border-red-200'
                            }`}
                        >
                          {roleOpt.label}
                        </button>
                      ))}
                    </div>

                    {(role === 'staff' || role === 'admin' || role === 'superadmin') && (
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <select
                          value={selectedState}
                          onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(''); setSelectedBlock(''); setSelectedPanchayat(''); }}
                          className="w-full bg-white border border-gray-300 p-2 text-[10px] font-black uppercase outline-none focus:border-red-500 transition-all text-red-600"
                        >
                          <option value="">All States</option>
                          {statesList.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select
                          value={selectedDistrict}
                          onChange={(e) => { setSelectedDistrict(e.target.value); setSelectedBlock(''); setSelectedPanchayat(''); }}
                          className="w-full bg-white border border-gray-300 p-2 text-[10px] font-black uppercase outline-none focus:border-red-500 transition-all text-red-600"
                        >
                          <option value="">All Districts</option>
                          {districtsList.map(d => <option key={d._id || d.name || d} value={d.name || d}>{(d.name || d).split(" / ")[0]}</option>)}
                        </select>
                        <select
                          value={selectedBlock}
                          onChange={(e) => { setSelectedBlock(e.target.value); setSelectedPanchayat(''); }}
                          className="w-full bg-white border border-gray-300 p-2 text-[10px] font-black uppercase outline-none focus:border-red-500 transition-all text-red-600"
                        >
                          <option value="">All Blocks</option>
                          {blocksList.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                        <select
                          value={selectedPanchayat}
                          onChange={(e) => setSelectedPanchayat(e.target.value)}
                          className="w-full bg-white border border-gray-300 p-2 text-[10px] font-black uppercase outline-none focus:border-red-500 transition-all text-red-600"
                        >
                          <option value="">All Panchayats</option>
                          {panchayatsList.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                      </div>
                    )}

                    {filteredResults.length > 0 && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-200 bg-white px-2 mb-1 shadow-sm">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={selectAll}
                            className="text-[10px] font-black text-red-600 uppercase hover:text-black transition-colors flex items-center gap-1"
                          >
                            <Check size={10} strokeWidth={3} />
                            Select All
                          </button>
                          <div className="w-1 h-1 bg-gray-100 rounded-full" />
                          <button
                            onClick={unselectAll}
                            className="text-[10px] font-black text-gray-400 uppercase hover:text-red-600 transition-colors flex items-center gap-1"
                          >
                            <X size={10} strokeWidth={3} />
                            Unselect All
                          </button>
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase">
                          {selectedParticipants.length} Selected
                        </span>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 scrollbar-hide">
                      <TeamList
                        results={filteredResults}
                        selectedParticipants={selectedParticipants}
                        onToggle={toggleParticipant}
                        searching={searching}
                        themeColor="#dc2626"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
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
                className={`relative flex flex-col items-center justify-center gap-3 p-6 border-2 transition-all group ${channels.includes('email') ? 'border-[#3AB000] bg-green-50/30 text-[#3AB000]' : 'border-gray-100 text-gray-400 grayscale hover:grayscale-0 hover:border-gray-300'
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
                className={`relative flex flex-col items-center justify-center gap-3 p-6 border-2 transition-all group ${channels.includes('sms') ? 'border-[#3AB000] bg-green-50/30 text-[#3AB000]' : 'border-gray-100 text-gray-400 grayscale hover:grayscale-0 hover:border-gray-300'
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

export default MeetingDashboard;
