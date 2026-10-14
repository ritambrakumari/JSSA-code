import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  MeetingProvider,
  MeetingConsumer,
  useMeeting,
  useParticipant,
  usePubSub
} from "@videosdk.live/react-sdk";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Users,
  MessageSquare,
  MoreVertical,
  ShieldCheck,
  Shield,
  Circle,
  Copy,
  User,
  Share2,
  AlertCircle,
  CheckCircle2,
  Search,
  Plus,
  RefreshCw,
  ArrowLeft,
  X,
  Radio,
  Square,
  UserMinus,
  Check,
  ChevronRight,
  Maximize2,
  Clock,
  Hand,
  Send,
  MessageCircle
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../utils/api";
import { useAuth } from "../../../auth/AuthProvider";
import toast from "react-hot-toast";
import DashboardLayout from "../../../components/DashboardLayout";
import { useBroadcast } from "../../../context/BroadcastContext";

const GREEN = "#3AB000";

/* ── Participant View Component ── */
function ParticipantView({ participantId, isHandRaised }) {
  const micRef = useRef(null);
  const videoRef = useRef(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const { webcamStream, micStream, webcamOn, micOn, isLocal, displayName } =
    useParticipant(participantId);

  const { participants, localParticipant } = useMeeting();
  const participant = isLocal ? localParticipant : participants.get(participantId);
  let profileImage = null;

  try {
    if (participant?.metaData) {
      const meta = typeof participant.metaData === 'string'
        ? JSON.parse(participant.metaData)
        : participant.metaData;
      profileImage = meta?.profileImage;
    }
  } catch (e) {
    profileImage = participant?.metaData?.profileImage;
  }

  const videoStream = useMemo(() => {
    if (webcamOn && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      return mediaStream;
    }
  }, [webcamStream, webcamOn]);

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);
        micRef.current.srcObject = mediaStream;
        micRef.current
          .play()
          .catch((error) => console.error("Mic play failed", error));
      } else {
        micRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn]);

  useEffect(() => {
    let audioContext;
    let analyser;
    let microphone;
    let animationFrame;

    if (micOn && micStream) {
      try {
        const mediaStream = new MediaStream([micStream.track]);
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        microphone = audioContext.createMediaStreamSource(mediaStream);
        microphone.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          setAudioLevel(average);
          animationFrame = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (err) {
        console.error("Audio analyser error", err);
      }
    } else {
      setAudioLevel(0);
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (microphone) microphone.disconnect();
      if (analyser) analyser.disconnect();
      if (audioContext && audioContext.state !== "closed") audioContext.close();
    };
  }, [micOn, micStream]);

  useEffect(() => {
    if (videoRef.current) {
      if (videoStream) {
        videoRef.current.srcObject = videoStream;
        videoRef.current.play().catch((err) => console.error("Video play failed", err));
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [videoStream]);

  return (
    <div className={`relative bg-[#202124] rounded-xl overflow-hidden aspect-video transition-all border-[3px] ${audioLevel > 15 ? 'border-[#3AB000] shadow-[0_0_20px_rgba(58,176,0,0.3)]' : 'border-transparent'}`}>
      <audio ref={micRef} autoPlay playsInline muted={isLocal} />
      {webcamOn && videoStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover transition-all duration-500"
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full bg-[#3c4043]">
          <div className={`w-28 h-28 rounded-full bg-[#1a73e8] flex items-center justify-center mb-4 transition-all shadow-2xl border-4 border-white/10 overflow-hidden ${audioLevel > 15 ? 'scale-110 border-[#3AB000]/50 shadow-[0_0_30px_rgba(58,176,0,0.4)]' : ''}`}>
            {profileImage ? (
              <img
                src={profileImage.startsWith('http') ? profileImage : `${(import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api$/, "")}${profileImage}`}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <span
              className={`text-3xl font-black uppercase tracking-tighter ${audioLevel > 15 ? 'text-[#3AB000]' : 'text-white'}`}
              style={{ display: profileImage ? 'none' : 'flex' }}
            >
              {displayName ? displayName.replace("(HOST)", "").trim().split(' ').map(n => n[0]).join('').substring(0, 2) : "P"}
            </span>
          </div>
        </div>
      )}

      {/* Identity Tag (Google Meet Style) */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
        <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 max-w-[200px]">
          {micOn ? (
            <div className="flex items-center gap-0.5 h-3">
              <div className={`w-1 bg-[#3AB000] rounded-full transition-all duration-75 ${audioLevel > 10 ? 'h-3' : 'h-1'}`} />
              <div className={`w-1 bg-[#3AB000] rounded-full transition-all duration-100 ${audioLevel > 20 ? 'h-4' : 'h-1.5'}`} />
              <div className={`w-1 bg-[#3AB000] rounded-full transition-all duration-75 ${audioLevel > 15 ? 'h-2.5' : 'h-1'}`} />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <MicOff size={10} strokeWidth={3} className="text-white" />
            </div>
          )}
          <span className="text-[11px] font-medium text-white truncate">
            {(displayName || "").replace("(HOST)", "").trim() || "Participant"}
            {isLocal && " (YOU)"}
            {displayName?.includes("(HOST)") && <span className="ml-2 text-[9px] bg-[#3AB000] px-1.5 py-0.5 font-black uppercase shadow-sm">HOST</span>}
          </span>
        </div>

        {/* Hand Raise Overlay */}
        {isHandRaised && (
          <div className="absolute top-4 left-4 bg-amber-400 p-2 shadow-2xl animate-bounce border-2 border-white/20 z-50">
            <Hand size={18} className="text-black" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Participant List Item Component ── */
function ParticipantListItem({ participantId, isHost: isLocalUserHost, isGhost, isHandRaised, publishRemoteControl }) {
  const { displayName, isLocal, micOn, webcamOn, remove, disableMic, disableWebcam } = useParticipant(participantId);

  const isHost = displayName?.includes("(HOST)");
  const cleanName = (displayName || "").replace("(HOST)", "").trim() || "Participant";

  const handleMicAction = () => {
    if (micOn) {
      // 1. Try direct SDK disable (requires allow_mod permission)
      disableMic();
      // 2. Fallback: Publish remote control event
      publishRemoteControl(JSON.stringify({
        targetId: participantId,
        action: "DISABLE_MIC"
      }), { persist: false });
      toast(`Muted ${cleanName}`, { icon: '🔇' });
    } else {
      // Send remote control command to target
      publishRemoteControl(JSON.stringify({
        targetId: participantId,
        action: "ENABLE_MIC"
      }), { persist: false });
      toast(`Sent unmute request to ${cleanName}`, { icon: '🎙️' });
    }
  };

  const handleWebcamAction = () => {
    if (webcamOn) {
      // 1. Try direct SDK disable
      disableWebcam();
      // 2. Fallback
      publishRemoteControl(JSON.stringify({
        targetId: participantId,
        action: "DISABLE_VIDEO"
      }), { persist: false });
      toast(`Disabled camera for ${cleanName}`, { icon: '📷' });
    } else {
      // Send remote control command to target
      publishRemoteControl(JSON.stringify({
        targetId: participantId,
        action: "ENABLE_VIDEO"
      }), { persist: false });
      toast(`Sent video start request to ${cleanName}`, { icon: '🎥' });
    }
  };

  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove ${cleanName} from the meeting?`)) {
      remove();
      toast.success(`${cleanName} has been removed`);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border-2 border-gray-100 hover:border-[#3AB000]/50 bg-white transition-all group mb-1 shadow-sm">
      <div className="flex flex-col flex-1 min-w-0 mr-3">
        <span className="text-xs font-black uppercase text-gray-900 tracking-tight flex items-center gap-2 truncate">
          <span className="truncate">{cleanName}</span>
          {isLocal && <span className="shrink-0 text-[8px] text-[#3AB000] bg-green-50 px-1 py-0.5 border border-green-100 font-black tracking-widest uppercase">YOU</span>}
          {isHost && <span className="shrink-0 text-[8px] text-white bg-[#3AB000] px-1 py-0.5 border border-[#3AB000] font-black tracking-widest uppercase shadow-sm">HOST</span>}
          {isHandRaised && <Hand size={12} className="shrink-0 text-amber-500 animate-pulse fill-amber-500" />}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <div className={`w-1.5 h-1.5 rounded-full ${micOn ? 'bg-[#3AB000] animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
            {micOn ? 'Voice Active' : 'Muted'}
          </span>
          <span className="text-gray-300 mx-1">•</span>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
            {webcamOn ? 'Video On' : 'No Video'}
          </span>
        </div>
      </div>

      {!isLocal && (
        <div className="flex items-center gap-1.5">
          {/* ONLY Ghost Admins have remote controls (Surveillance Mode) */}
          {isGhost && (
            <>
              <button
                onClick={handleMicAction}
                className={`p-2 border transition-all ${micOn ? 'text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 border-gray-100' : 'text-[#3AB000] bg-green-50 border-[#3AB000]/30 hover:bg-[#3AB000] hover:text-white'}`}
                title={micOn ? "Mute Participant" : "Request Unmute"}
              >
                {micOn ? <Mic size={14} /> : <MicOff size={14} />}
              </button>
              <button
                onClick={handleWebcamAction}
                className={`p-2 border transition-all ${webcamOn ? 'text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 border-gray-100' : 'text-[#3AB000] bg-green-50 border-[#3AB000]/30 hover:bg-[#3AB000] hover:text-white'}`}
                title={webcamOn ? "Disable Camera" : "Request Camera"}
              >
                {webcamOn ? <Video size={14} /> : <VideoOff size={14} />}
              </button>

              <div className="w-px h-6 bg-gray-100 mx-1" />

              <button
                onClick={handleRemove}
                className="p-2 text-gray-400 hover:text-white hover:bg-red-600 border border-gray-100 hover:border-red-600 transition-all"
                title="Remove from meeting"
              >
                <UserMinus size={14} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Presenter View Component ── */
function PresenterView({ presenterId }) {
  const videoRef = useRef(null);
  const { screenShareStream, screenShareOn, displayName } = useParticipant(presenterId);

  useEffect(() => {
    if (videoRef.current && screenShareOn && screenShareStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(screenShareStream.track);
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch((err) => console.error("Screen share play failed", err));
    }
  }, [screenShareStream, screenShareOn]);

  return (
    <div className="flex-1 bg-black relative overflow-hidden rounded-xl border border-gray-800 shadow-2xl">
      {screenShareOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-white gap-4">
          <Monitor size={48} className="text-gray-600 animate-pulse" />
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Presentation Ended</p>
        </div>
      )}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 border border-white/10">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        {displayName} is presenting
      </div>
    </div>
  );
}

/* ── Local Controls Component ── */
function LocalControls({
  localParticipantId,
  toggleMic,
  toggleWebcam,
  toggleScreenShare,
  isScreenShareOn,
  leave,
  setShowParticipantsList,
  showParticipantsList,
  isHost,
  isGhost,
  meetingId,
  isMicLocked,
  isCameraLocked,
  isScreenShareLocked,
  isChatLocked,
  toggleHandRaise,
  isHandRaised,
  setShowChat,
  showChat,
  unreadCount,
  invitedCount,
  joinedInvitedCount
}) {
  const { micOn, webcamOn, screenShareOn: isLocalScreenShareOn } = useParticipant(localParticipantId) || {};
  const { localParticipant } = useMeeting();

  // Determine if the local user is a Viewer
  const isViewer = localParticipant?.mode === "VIEWER";

  const handleEndClick = async () => {
    if (isHost || isGhost) {
      if (window.confirm("Are you sure you want to END this meeting for everyone?")) {
        try {
          await api.meetings.end(meetingId);
          leave();
        } catch (e) {
          console.error("End meeting failed", e);
          leave();
        }
      }
    } else {
      if (window.confirm("Are you sure you want to leave this meeting?")) {
        leave();
      }
    }
  };

  return (
    <div className="h-20 bg-[#202124] flex items-center justify-center gap-4 px-6 relative z-20">
      {!isViewer && (
        <>
          <button
            onClick={() => !(isMicLocked && !isHost) && toggleMic()}
            disabled={isMicLocked && !isHost}
            className={`p-3.5 rounded-full transition-all flex items-center justify-center relative ${micOn ? 'bg-[#3c4043] hover:bg-[#4a4d51] text-gray-200' : 'bg-[#ea4335] hover:bg-[#d93025] text-white'
              } ${isMicLocked && !isHost ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
            title={isMicLocked && !isHost ? "Microphone Locked by Host" : (micOn ? "Mute Microphone" : "Unmute Microphone")}
          >
            {micOn ? <Mic size={22} /> : <MicOff size={22} />}
            {isMicLocked && !isHost && <div className="absolute -top-1 -right-1 bg-black rounded-full p-0.5 border border-white/20"><X size={10} className="text-white" /></div>}
          </button>

          <button
            onClick={() => !(isCameraLocked && !isHost) && toggleWebcam()}
            disabled={isCameraLocked && !isHost}
            className={`p-3.5 rounded-full transition-all flex items-center justify-center relative ${webcamOn ? 'bg-[#3c4043] hover:bg-[#4a4d51] text-gray-200' : 'bg-[#ea4335] hover:bg-[#d93025] text-white'
              } ${isCameraLocked && !isHost ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
            title={isCameraLocked && !isHost ? "Camera Locked by Host" : (webcamOn ? "Turn Camera Off" : "Turn Camera On")}
          >
            {webcamOn ? <Video size={22} /> : <VideoOff size={22} />}
            {isCameraLocked && !isHost && <div className="absolute -top-1 -right-1 bg-black rounded-full p-0.5 border border-white/20"><X size={10} className="text-white" /></div>}
          </button>
        </>
      )}

      {/* Screen Share (Only for Host in Training Mode) */}
      {(isHost || isGhost) && (
        <button
          onClick={() => !(isScreenShareLocked && !isHost) && toggleScreenShare()}
          disabled={isScreenShareLocked && !isHost}
          className={`p-3.5 rounded-full transition-all flex items-center justify-center relative ${isLocalScreenShareOn ? 'bg-[#8ab4f8] text-[#1967d2]' : 'bg-[#3c4043] hover:bg-[#4a4d51] text-gray-200'
            } ${isScreenShareLocked && !isHost ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
          title={isScreenShareLocked && !isHost ? "Screen Sharing Locked by Host" : (isLocalScreenShareOn ? "Stop Sharing Screen" : "Share Screen")}
        >
          <Monitor size={22} />
          {isScreenShareLocked && !isHost && <div className="absolute -top-1 -right-1 bg-black rounded-full p-0.5 border border-white/20"><X size={10} className="text-white" /></div>}
        </button>
      )}

      <div className="h-8 w-px bg-white/10 mx-2" />

      <button
        onClick={toggleHandRaise}
        className={`p-3.5 rounded-full transition-all flex items-center justify-center relative ${isHandRaised ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'bg-[#3c4043] hover:bg-[#4a4d51] text-gray-200'
          }`}
        title={isHandRaised ? "Lower Hand" : "Raise Hand"}
      >
        <Hand size={22} className={isHandRaised ? 'animate-bounce' : ''} />
      </button>

      <div className="h-8 w-px bg-white/10 mx-2" />

      {!isViewer && (
        <button
          onClick={() => {
            if (isChatLocked && !isHost) {
              toast.error("Chat is restricted by host", { icon: "💬" });
              return;
            }
            setShowChat(!showChat);
            setShowParticipantsList(false);
          }}
          className={`p-3.5 rounded-full transition-all flex items-center justify-center relative ${showChat ? 'bg-[#8ab4f8] text-[#1967d2]' : 'bg-[#3c4043] hover:bg-[#4a4d51] text-gray-200'
            } ${isChatLocked && !isHost && !isGhost ? 'opacity-50 grayscale' : ''}`}
          title={isChatLocked && !isHost && !isGhost ? "Chat Restricted by Host" : "Chat"}
        >
          <MessageSquare size={22} />
          {isChatLocked && !isHost && !isGhost && <div className="absolute -top-1 -right-1 bg-black rounded-full p-0.5 border border-white/20"><X size={10} className="text-white" /></div>}
          {unreadCount > 0 && !showChat && !isChatLocked && (
            <div className="absolute top-0 right-0 bg-[#3AB000] text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#202124]">
              {unreadCount}
            </div>
          )}
        </button>
      )}

      {!isViewer && (
        <button
          onClick={() => {
            setShowParticipantsList(!showParticipantsList);
            setShowChat(false);
          }}
          className={`p-3.5 rounded-full transition-all flex items-center justify-center relative ${showParticipantsList ? 'bg-[#8ab4f8] text-[#1967d2]' : 'bg-[#3c4043] hover:bg-[#4a4d51] text-gray-200'
            }`}
          title="Participants List"
        >
          <Users size={22} />
          {invitedCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-[#3AB000] text-white text-[8px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#202124]">
              {joinedInvitedCount}/{invitedCount}
            </div>
          )}
        </button>
      )}

      <div className="h-8 w-px bg-white/10 mx-4" />

      <button
        onClick={handleEndClick}
        className="flex items-center gap-2 bg-[#ea4335] hover:bg-[#d93025] text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-[10px] transition-all shadow-lg active:scale-95"
      >
        <PhoneOff size={18} strokeWidth={3} />
        {(isHost || isGhost) ? "End Meet" : "Leave Meet"}
      </button>
    </div>
  );
}

/* ── Main Meeting View ── */
function MeetingView({ roomId, onLeave, initialMicOn: previewMic, setInitialMicOn: setPreviewMic, initialCamOn: previewCam, setInitialCamOn: setPreviewCam, hostId, isHost, isGhost, initialTitle, initialInvitedParticipants, initialSettings, initialDuration, initialStartTime, userName, employeeProfile }) {
  const { addJob } = useBroadcast();
  const navigate = useNavigate();
  const [joined, setJoined] = useState(null);
  const [meetingTitle, setMeetingTitle] = useState(initialTitle || "");
  const [invitedParticipantIds, setInvitedParticipantIds] = useState(initialInvitedParticipants || []);
  const [timeLeft, setTimeLeft] = useState(null);

  // Timer calculation effect
  useEffect(() => {
    if (joined !== "JOINED" || !initialDuration || initialDuration === 0) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const startTime = initialStartTime ? new Date(initialStartTime).getTime() : Date.now();
      const durationMs = initialDuration * 60 * 1000;
      const endTime = startTime + durationMs;
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft(0);
        return;
      }
      setTimeLeft(diff);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [joined, initialDuration, initialStartTime]);

  // Auto-expiration effect
  useEffect(() => {
    if (timeLeft === 0) {
      toast.error("Meeting session time has expired. Ending meeting...", {
        duration: 5000,
        icon: "⏰"
      });

      const forceExitTimeout = setTimeout(() => {
        if (isHost || isGhost) {
          api.meetings.end(roomId).catch(console.error);
        } else {
          onLeave();
        }
      }, 5000);

      return () => clearTimeout(forceExitTimeout);
    }
  }, [timeLeft, isHost, isGhost, roomId, onLeave]);

  // Format time for display (HH:MM:SS)
  const formatTimeLeft = (ms) => {
    if (ms === null || ms < 0) return null;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      hours > 0 ? String(hours).padStart(2, '0') : null,
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  useEffect(() => {
    if (initialTitle) setMeetingTitle(initialTitle);
    if (initialInvitedParticipants) setInvitedParticipantIds(initialInvitedParticipants);
  }, [initialTitle, initialInvitedParticipants]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showParticipantsList, setShowParticipantsList] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    if (showChat) {
      scrollToBottom();
    }
  }, [messages, showChat]);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [inviting, setInviting] = useState(false);

  // Host Meeting Policies
  const [entryMicMuted, setEntryMicMuted] = useState(false);
  const [entryVideoDisabled, setEntryVideoDisabled] = useState(false);
  const [entryScreenShareDisabled, setEntryScreenShareDisabled] = useState(false);
  const [entryChatDisabled, setEntryChatDisabled] = useState(false);

  // Media Lock States
  const [isMicLocked, setIsMicLocked] = useState(false);
  const [isCameraLocked, setIsCameraLocked] = useState(false);
  const [isScreenShareLocked, setIsScreenShareLocked] = useState(false);
  const [isChatLocked, setIsChatLocked] = useState(false);
  const [raisedHands, setRaisedHands] = useState(new Set());

  useEffect(() => {
    if (initialSettings) {
      setEntryMicMuted(!initialSettings.micEnabled);
      setEntryVideoDisabled(!initialSettings.cameraEnabled);
      setEntryScreenShareDisabled(!initialSettings.screenShareEnabled);
      setEntryChatDisabled(!initialSettings.chatEnabled);

      setIsMicLocked(!initialSettings.micEnabled);
      setIsCameraLocked(!initialSettings.cameraEnabled);
      setIsScreenShareLocked(!initialSettings.screenShareEnabled);
      setIsChatLocked(!initialSettings.chatEnabled);
    }
  }, [initialSettings]);

  const {
    join,
    leave,
    toggleMic,
    toggleWebcam,
    toggleScreenShare,
    localParticipant,
    participants,
    meetingId: sdkMeetingId,
    isScreenShareOn,
    presenterId,
  } = useMeeting({
    onParticipantJoined: (participant) => {
      // If I am host/ghost, broadcast the current policy to new joiners
      if ((isHost || isGhost) && (entryMicMuted || entryVideoDisabled || entryScreenShareDisabled || entryChatDisabled)) {
        setTimeout(() => {
          publish(JSON.stringify({
            forceMute: entryMicMuted,
            forceVideo: entryVideoDisabled,
            forceScreenShare: entryScreenShareDisabled,
            forceChat: entryChatDisabled
          }), { persist: true });
        }, 2000);
      }
    },
    onMeetingJoined: () => {
      setJoined("JOINED");
      // Host/Ghost broadcasts initial policy immediately
      if (isHost || isGhost) {
        // Sync local host states with lobby settings
        setIsMicLocked(entryMicMuted);
        setIsCameraLocked(entryVideoDisabled);
        setIsScreenShareLocked(entryScreenShareDisabled);
        setIsChatLocked(entryChatDisabled);

        if (entryMicMuted || entryVideoDisabled || entryScreenShareDisabled || entryChatDisabled) {
          publish(JSON.stringify({
            forceMute: entryMicMuted,
            forceVideo: entryVideoDisabled,
            forceScreenShare: entryScreenShareDisabled,
            forceChat: entryChatDisabled
          }), { persist: true });
        }

        // Also update backend
        api.meetings.updateSettings(roomId, {
          micEnabled: !entryMicMuted,
          cameraEnabled: !entryVideoDisabled,
          screenShareEnabled: !entryScreenShareDisabled,
          chatEnabled: !entryChatDisabled
        });
      }
      toast.success("Successfully joined the meeting", { icon: "✅" });
    },
    onMeetingLeft: async () => {
      try {
        await api.meetings.leave(roomId);
      } catch (e) { console.error("API leave failed", e); }
      onLeave();
    },
    onMeetingEnded: () => {
      toast.error("This meeting has been ended by the host. Redirecting in 5 seconds...", {
        duration: 5000,
        icon: "🛑"
      });
      setTimeout(() => {
        onLeave();
      }, 5000);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Polling for meeting status (Handles Admin termination from dashboard)
  useEffect(() => {
    if (joined !== "JOINED") return;

    const checkMeetingStatus = async () => {
      try {
        // Use the join API to check current meeting status
        const res = await api.meetings.join(roomId);
        if (!res.success) {
          toast.error("Meeting session ended by Administrator. Exiting in 5 seconds...", { duration: 5000, icon: "🛡️" });
          setTimeout(() => {
            onLeave();
          }, 5000);
        }
      } catch (error) {
        // If error (like 404), meeting is likely ended
        toast.error("Meeting no longer active. Exiting...", { duration: 5000 });
        setTimeout(() => {
          onLeave();
        }, 5000);
      }
    };

    const interval = setInterval(checkMeetingStatus, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [joined, roomId, onLeave]);

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
      return designation.includes(selectedRoleFilter);
    });
  }, [searchResults, selectedRoleFilter]);

  // Recruitment Stats
  const recruitmentStats = useMemo(() => {
    if (!(isHost || isGhost) || invitedParticipantIds.length === 0) return null;

    let joinedCount = 0;
    // Assuming VideoSDK context 'participants' exists here or via props
    // We will simulate usage of the 'participants' map commonly used in this architecture
    if (typeof participants !== 'undefined') {
      joinedCount = Math.max(0, participants.size - 1);
    }

    return {
      invited: invitedParticipantIds.length,
      joined: joinedCount
    };
  }, [participants, invitedParticipantIds, isHost, isGhost]);

  const [previewStream, setPreviewStream] = useState(null);
  const previewStreamRef = useRef(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const previewVideoRef = useRef(null);

  useEffect(() => {
    let audioContext;
    let analyser;
    let microphone;
    let animationFrame;

    if (previewStream && previewMic) {
      const audioTrack = previewStream.getAudioTracks()[0];
      if (audioTrack) {
        // Use a try-catch in case AudioContext is blocked before user interaction
        try {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          microphone = audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
          microphone.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const updateAudioLevel = () => {
            analyser.getByteTimeDomainData(dataArray);
            let sumSquares = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const normalized = (dataArray[i] - 128) / 128;
              sumSquares += normalized * normalized;
            }
            const rms = Math.sqrt(sumSquares / dataArray.length);
            // Scale rms (usually 0 to 0.5 for normal speech) to a 0-100 value
            const level = Math.min(100, rms * 400);
            setAudioLevel(level);
            animationFrame = requestAnimationFrame(updateAudioLevel);
          };

          updateAudioLevel();
        } catch (e) {
          console.log("AudioContext not started yet");
        }
      }
    } else {
      setAudioLevel(0);
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [previewStream, previewMic]);

  // Absolute Media Termination Kill-Switch
  useEffect(() => {
    return () => {
      // 1. Stop our tracked preview stream
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        previewStreamRef.current = null;
      }

      // 2. Force-stop ANY media tracks active in the DOM (VideoSDK or others)
      try {
        document.querySelectorAll('video, audio').forEach(media => {
          if (media.srcObject instanceof MediaStream) {
            media.srcObject.getTracks().forEach(track => {
              track.stop();
              track.enabled = false;
            });
            media.srcObject = null;
          }
        });
      } catch (e) { console.error("Global cleanup failed", e); }
    };
  }, []);

  useEffect(() => {
    if (joined === null && previewCam) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: previewMic })
        .then(stream => {
          setPreviewStream(stream);
          previewStreamRef.current = stream; // Keep ref updated for reliable cleanup
          if (previewVideoRef.current) {
            previewVideoRef.current.srcObject = stream;
          }
        }).catch(err => console.error("Preview error", err));
    } else if (joined !== null && (previewStream || previewStreamRef.current)) {
      const activeStream = previewStream || previewStreamRef.current;
      activeStream.getTracks().forEach(t => t.stop());
      setPreviewStream(null);
      previewStreamRef.current = null;
    }

    return () => {
      // Use ref in cleanup to avoid closure stale values
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [joined, previewCam, previewMic]);

  // PubSub for Hand Raise
  const { publish: publishHand } = usePubSub("RAISE_HAND", {
    onMessageReceived: (message) => {
      const { participantId, isRaised } = JSON.parse(message.message);
      setRaisedHands(prev => {
        const next = new Set(prev);
        if (isRaised) next.add(participantId);
        else next.delete(participantId);
        return next;
      });

      if (isRaised && (isHost || isGhost) && participantId !== localParticipant.id) {
        const sender = participants.get(participantId);
        toast(`${sender?.displayName || "Someone"} raised their hand`, { icon: "✋" });
      }
    },
  });

  const toggleHandRaise = () => {
    const isCurrentlyRaised = raisedHands.has(localParticipant.id);
    publishHand(JSON.stringify({
      participantId: localParticipant.id,
      isRaised: !isCurrentlyRaised
    }), { persist: true });
  };

  // PubSub for Chat
  const { publish: publishChat } = usePubSub("CHAT", {
    onMessageReceived: (message) => {
      const { text, senderName, timestamp } = JSON.parse(message.message);
      setMessages(prev => [...prev, { text, senderName, timestamp, senderId: message.senderId }]);

      if (!showChat) {
        setUnreadCount(prev => prev + 1);
      }
    },
  });

  const sendChatMessage = (text) => {
    if (!text.trim()) return;
    const msg = {
      text,
      senderName: userName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    publishChat(JSON.stringify(msg), { persist: true });
  };

  // PubSub for Host Controls
  const { publish } = usePubSub("MEETING_POLICY", {
    onMessageReceived: (message) => {
      if (!(isHost || isGhost) && message.senderId !== localParticipant.id) {
        const { forceMute, forceVideo, forceScreenShare, forceChat } = JSON.parse(message.message);

        // Update lock states
        setIsMicLocked(forceMute);
        setIsCameraLocked(forceVideo);
        setIsScreenShareLocked(forceScreenShare);
        setIsChatLocked(forceChat);

        if (forceMute && localParticipant.micOn) {
          toggleMic();
          toast("Host has locked microphones", { icon: "🔇" });
        }
        if (forceVideo && localParticipant.webcamOn) {
          toggleWebcam();
          toast("Host has locked cameras", { icon: "📷" });
        }
        if (forceScreenShare && localParticipant.screenShareOn) {
          toggleScreenShare();
          toast("Host has locked screen sharing", { icon: "🚫" });
        }
        if (forceChat) {
          setShowChat(false);
          toast("Host has locked chat", { icon: "💬" });
        }
      }
    },
  });

  // PubSub for Remote Control (Host triggering participant media)
  const { publish: publishRemoteControl } = usePubSub("REMOTE_CONTROL", {
    onMessageReceived: (message) => {
      const { targetId, action } = JSON.parse(message.message);

      // Only act if I am the target
      if (localParticipant.id === targetId) {
        if (action === "ENABLE_MIC" && !localParticipant.micOn) {
          if (!isMicLocked) {
            toggleMic();
            toast("Host requested you to unmute", { icon: "🎙️" });
          }
        } else if (action === "ENABLE_VIDEO" && !localParticipant.webcamOn) {
          if (!isCameraLocked) {
            toggleWebcam();
            toast("Host requested you to start video", { icon: "🎥" });
          }
        } else if (action === "DISABLE_MIC" && localParticipant.micOn) {
          toggleMic();
          toast("Admin has muted your microphone", { icon: "🔇" });
        } else if (action === "DISABLE_VIDEO" && localParticipant.webcamOn) {
          toggleWebcam();
          toast("Admin has disabled your camera", { icon: "📷" });
        }
      }
    },
  });

  const [showParticipants, setShowParticipants] = useState(false);

  // Participant Remote Control Functions (Host Only)
  const handleRemoteMic = (participantId, isMicOn) => {
    if (!(isHost || isGhost)) return;
    const participant = participants.get(participantId);
    if (participant) {
      if (isMicOn) {
        participant.disableMic();
        toast(`Muted participant`, { icon: '🔇' });
      } else {
        participant.enableMic();
        toast(`Requested participant to unmute`, { icon: '🎙️' });
      }
    }
  };

  const handleRemoteWebcam = (participantId, isWebcamOn) => {
    if (!(isHost || isGhost)) return;
    const participant = participants.get(participantId);
    if (participant) {
      if (isWebcamOn) {
        participant.disableWebcam();
        toast(`Disabled participant's camera`, { icon: '📷' });
      } else {
        participant.enableWebcam();
        toast(`Requested participant to start camera`, { icon: '🎥' });
      }
    }
  };

  // Handle Tab Close / Unload
  useEffect(() => {
    const handleUnload = () => {
      if (joined === "JOINED") {
        // Use sendBeacon for more reliability on unload
        const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/meetings/leave/${roomId}`;
        const token = localStorage.getItem('jssa_token');
        if (token) {
          // We can't easily use sendBeacon with custom headers, so we just try our best
          fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            keepalive: true
          });
        }
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [joined, roomId]);

  const searchRef = useRef(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch team on modal open
  useEffect(() => {
    if (showInviteModal) {
      handleSearch("");
    }
  }, [showInviteModal]);

  const handleSearch = async (val) => {
    setSearchQuery(val);
    try {
      setSearching(true);
      const res = await api.meetings.searchEmployees(val);
      if (res.success) setSearchResults(res.data);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setSearching(false);
    }
  };

  const toggleSelectMember = (member) => {
    if (selectedMembers.find(m => m.userId === member.userId)) {
      setSelectedMembers(selectedMembers.filter(m => m.userId !== member.userId));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  const selectAllMembers = () => {
    const newSelected = [...selectedMembers];
    filteredResults.forEach(member => {
      if (!newSelected.find(m => m.userId === member.userId)) {
        newSelected.push(member);
      }
    });
    setSelectedMembers(newSelected);
  };

  const unselectAllMembers = () => {
    setSelectedMembers([]);
  };

  const handleSendInvites = async () => {
    if (selectedMembers.length === 0) return;
    try {
      setInviting(true);
      const inviteRes = await api.meetings.invite({
        meetingId: roomId,
        employeeUserIds: selectedMembers.map(m => m.userId)
      });

      if (inviteRes.success) {
        toast.success(`Invitations sent to ${selectedMembers.length} members`);
        if (inviteRes.broadcastJobId) {
          addJob({ _id: inviteRes.broadcastJobId, title: `Meeting: ${meetingTitle || 'Invite'}`, status: "pending", sentCount: 0, totalCandidates: selectedMembers.length });
        }
        setShowInviteModal(false);
        setSelectedMembers([]);
        setSearchQuery("");
      }
    } catch (error) {
      toast.error("Failed to send invitations");
    } finally {
      setInviting(false);
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(roomId);
    toast.success("Room ID copied! Share it with your team.");
  };

  const joinMeeting = () => {
    setJoined("JOINING");
    join({
      metaData: {
        profileImage: employeeProfile?.profileImage || "",
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-120px)] bg-[#f8fcf7] border-2 border-gray-100 relative">
        {/* Invite Modal Overlay */}
        {showInviteModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
            <div className="bg-white border border-gray-200 border-t-[8px] border-t-[#3AB000] w-full max-w-lg relative z-10 shadow-2xl flex flex-col">
              <div className="p-6 flex justify-between items-center border-b-2 border-gray-100">
                <div className="flex items-center gap-2">
                  <Search size={20} className="text-[#3AB000]" />
                  <h3 className="font-black uppercase tracking-widest text-sm text-gray-900">Search Employees</h3>
                </div>
                <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-red-500 transition-colors p-2"><X size={20} /></button>
              </div>

              <div className="p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3AB000]" />
                    <input
                      type="text"
                      placeholder="SEARCH EMPLOYEES BY NAME..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      autoFocus
                      className="w-full bg-gray-50 border-2 border-gray-200 p-4 pl-10 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#3AB000] focus:bg-white transition-all shadow-inner"
                    />
                    {searching && <RefreshCw size={14} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#3AB000]" />}
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

                {searchResults.length > 0 && (
                  <div className="flex items-center gap-4 py-2 border-b-2 border-gray-100">
                    <button
                      onClick={selectAllMembers}
                      className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest hover:underline"
                    >
                      Select All
                    </button>
                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                    <button
                      onClick={unselectAllMembers}
                      className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:underline hover:text-red-500"
                    >
                      Unselect All
                    </button>
                  </div>
                )}

                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                  {searching && searchResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 border-2 border-dashed border-gray-100">
                      <RefreshCw size={40} className="text-[#3AB000] animate-spin mb-4" />
                      <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest animate-pulse italic">Syncing Employee Database...</p>
                    </div>
                  ) : filteredResults.map(member => (
                    <div
                      key={member.userId}
                      onClick={() => toggleSelectMember(member)}
                      className={`p-3 border flex items-center justify-between cursor-pointer transition-colors ${selectedMembers.find(m => m.userId === member.userId) ? 'border-[#3AB000] bg-[#e8f5e2]' : 'border-gray-100 hover:border-[#3AB000]/30 bg-white'
                        }`}
                    >
                      <div className="flex flex-col pr-2">
                        <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{member.name}</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 leading-tight">
                          {member.designation || member.role}
                          {member.post ? ` • ${member.post}` : ''}
                          {member.zone ? ` • ${member.zone}` : ''}
                        </span>
                      </div>
                      <div className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 ${selectedMembers.find(m => m.userId === member.userId) ? 'bg-[#3AB000] border-[#3AB000]' : 'border-gray-200'}`}>
                        {selectedMembers.find(m => m.userId === member.userId) && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                    </div>
                  ))}
                  {filteredResults.length === 0 && !searching && (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50/50 border-2 border-dashed border-gray-100">
                      <Users size={32} className="text-gray-200 mb-2" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No team members match this filter</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t-2 border-gray-100 flex justify-between items-center">

                <button
                  onClick={handleSendInvites}
                  disabled={inviting || selectedMembers.length === 0}
                  className={`bg-[#3AB000] text-white px-8 py-3 font-black uppercase tracking-widest text-[10px] hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {inviting ? 'SENDING...' : 'SEND INVITES'}
                </button>
              </div>
            </div>
          </div>
        )}
        {joined === "JOINED" ? (
          <>
            {/* Header / Stats Bar */}
            <div className="h-16 bg-white flex items-center justify-between px-6 shadow-sm border-b border-gray-100 relative z-20">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-[#3AB000] rounded-full animate-pulse" />
                  <span className="text-[11px] font-bold text-[#3AB000] uppercase tracking-wide leading-none">Live Connection</span>
                </div>
                <div className="h-6 w-px bg-gray-200" />
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium text-xs">Meeting ID:</span>
                  <span className="text-gray-800 font-bold text-xs">{roomId}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {(isHost || isGhost) && (
                  <div className="hidden lg:flex flex-col gap-1 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl mr-2 min-w-[180px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users size={12} className="text-[#3AB000]" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Recruitment Progress</span>
                      </div>
                      <span className="text-[10px] font-black text-[#3AB000]">
                        {Math.round(Math.min(100, ((recruitmentStats?.joined || 0) / (Math.max(1, recruitmentStats?.invited || 1))) * 100))}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3AB000] transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(100, ((recruitmentStats?.joined || 0) / (Math.max(1, recruitmentStats?.invited || 0))) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {(isHost || isGhost) && (
                  <>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center gap-2 bg-[#e8f5e2] text-[#3AB000] hover:bg-[#3AB000] hover:text-white px-4 py-2 rounded-full text-xs font-bold transition-all"
                    >
                      <Share2 size={14} strokeWidth={2} />
                      Invite
                    </button>
                    <button
                      onClick={handleCopyInvite}
                      className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                      title="Copy Link"
                    >
                      <Copy size={16} />
                    </button>
                  </>
                )}
                <div className="h-6 w-px bg-gray-200 mx-1" />
                <div className="flex items-center gap-1.5 text-gray-500 px-2 py-1 text-xs font-medium">
                  {timeLeft !== null && (
                    <div className={`flex items-center gap-2 px-3 py-1 border-r border-gray-200 mr-2 ${timeLeft < 300000 ? 'text-red-600 animate-pulse' : 'text-[#3AB000]'}`}>
                      <Clock size={14} className={timeLeft < 300000 ? 'animate-bounce' : ''} />
                      <span className="font-black font-mono tracking-wider">
                        {formatTimeLeft(timeLeft)}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-tighter opacity-60">Left</span>
                    </div>
                  )}
                  <ShieldCheck size={14} className="text-[#3AB000]" />
                  Encrypted
                </div>
              </div>
            </div>

            {/* Main Area: Video Grid & Optional Sidebar */}
            <div className="flex-1 flex overflow-hidden bg-[#202124] relative">

              {/* Sorting logic to keep Host pinned at the top */}
              {(() => {
                const pKeys = [...participants.keys()].filter((id) => {
                  const p = participants.get(id);
                  if (p?.displayName === "Administrator" && p?.id !== localParticipant?.id) {
                    return false;
                  }
                  return true;
                });

                const sortedParticipantIds = pKeys.sort((a, b) => {
                  const pA = participants.get(a);
                  const pB = participants.get(b);

                  // 1. Pin Host first
                  const isAHost = pA?.displayName?.toLowerCase().includes("host") || a === hostId;
                  const isBHost = pB?.displayName?.toLowerCase().includes("host") || b === hostId;

                  if (isAHost && !isBHost) return -1;
                  if (!isAHost && isBHost) return 1;

                  // 2. Then local participant
                  if (pA?.isLocal && !pB?.isLocal) return -1;
                  if (!pA?.isLocal && pB?.isLocal) return 1;

                  return 0;
                });

                // Training Mode UI Logic:
                // 1. If I am a Viewer, I only see the Host/Speakers
                // 2. If there are multiple speakers, show them in grid
                // 3. If there is only one speaker (Host), show them full screen
                
                const speakers = sortedParticipantIds;

                return presenterId ? (
                  <div className="flex-1 flex gap-4 p-4 overflow-hidden">
                    {/* Left: Shared Screen */}
                    <PresenterView presenterId={presenterId} />

                    {/* Right: Small Participant Sidebar */}
                    <div className="w-72 flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-hide">
                      {speakers.map((participantId) => (
                        <div key={participantId} className="w-full shrink-0">
                          <ParticipantView
                            participantId={participantId}
                            isHandRaised={raisedHands.has(participantId)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Video Grid Area (Default) */
                  <div className="flex-1 p-4 md:p-6 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                    <div className={`grid gap-4 md:gap-6 max-w-[1800px] mx-auto min-h-full items-center justify-center ${speakers.length <= 1 ? 'grid-cols-1 max-w-[1000px]' :
                      speakers.length <= 2 ? 'grid-cols-1 md:grid-cols-2 max-w-[1200px]' :
                        speakers.length <= 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 max-w-[1400px]' :
                          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                      }`}>
                      {speakers.map((participantId) => (
                        <div key={participantId} className={`${speakers.length === 1 ? 'max-w-[1000px] mx-auto w-full aspect-video' : 'w-full'}`}>
                          <ParticipantView
                            participantId={participantId}
                            isHandRaised={raisedHands.has(participantId)}
                          />
                        </div>
                      ))}
                    </div>
                    {/* Viewer Placeholder if no one is streaming */}
                    {speakers.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-white gap-4">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border-2 border-dashed border-[#3AB000]/20 animate-pulse">
                          <Radio size={40} className="text-[#3AB000]/30" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-500 italic">Waiting for trainer to start...</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Participants Sidebar */}
              {showParticipantsList && (
                <div className="w-80 bg-white flex flex-col z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.1)] relative border-l border-gray-100">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-black uppercase tracking-widest text-gray-900 text-xs">Participants ({participants.size})</h3>
                    <button onClick={() => setShowParticipantsList(false)} className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-white">
                    {/* ONLY Ghost Admins have global controls (Surveillance Mode) */}
                    {isGhost && (
                      <div className="mb-4 p-3 bg-gray-50 border-2 border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-gray-700 tracking-tight">Mute All Participants</span>
                          <button
                            onClick={() => {
                              const next = !isMicLocked;
                              setIsMicLocked(next);
                              publish(JSON.stringify({
                                forceMute: next,
                                forceVideo: isCameraLocked,
                                forceScreenShare: isScreenShareLocked,
                                forceChat: isChatLocked
                              }), { persist: true });
                              api.meetings.updateSettings(roomId, { micEnabled: !next });
                            }}
                            className={`w-8 h-4 transition-all relative rounded-full ${isMicLocked ? 'bg-[#3AB000]' : 'bg-gray-300'}`}
                          >
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isMicLocked ? 'left-4' : 'left-1'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-gray-700 tracking-tight">Lock All Cameras</span>
                          <button
                            onClick={() => {
                              const next = !isCameraLocked;
                              setIsCameraLocked(next);
                              publish(JSON.stringify({
                                forceMute: isMicLocked,
                                forceVideo: next,
                                forceScreenShare: isScreenShareLocked,
                                forceChat: isChatLocked
                              }), { persist: true });
                              api.meetings.updateSettings(roomId, { cameraEnabled: !next });
                            }}
                            className={`w-8 h-4 transition-all relative rounded-full ${isCameraLocked ? 'bg-[#3AB000]' : 'bg-gray-300'}`}
                          >
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isCameraLocked ? 'left-4' : 'left-1'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-gray-700 tracking-tight">Lock Screen Share</span>
                          <button
                            onClick={() => {
                              const next = !isScreenShareLocked;
                              setIsScreenShareLocked(next);
                              publish(JSON.stringify({
                                forceMute: isMicLocked,
                                forceVideo: isCameraLocked,
                                forceScreenShare: next,
                                forceChat: isChatLocked
                              }), { persist: true });
                              api.meetings.updateSettings(roomId, { screenShareEnabled: !next });
                            }}
                            className={`w-8 h-4 transition-all relative rounded-full ${isScreenShareLocked ? 'bg-[#3AB000]' : 'bg-gray-300'}`}
                          >
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isScreenShareLocked ? 'left-4' : 'left-1'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-gray-700 tracking-tight">Lock Chat Room</span>
                          <button
                            onClick={() => {
                              const next = !isChatLocked;
                              setIsChatLocked(next);
                              publish(JSON.stringify({
                                forceMute: isMicLocked,
                                forceVideo: isCameraLocked,
                                forceScreenShare: isScreenShareLocked,
                                forceChat: next
                              }), { persist: true });
                              api.meetings.updateSettings(roomId, { chatEnabled: !next });
                            }}
                            className={`w-8 h-4 transition-all relative rounded-full ${isChatLocked ? 'bg-[#3AB000]' : 'bg-gray-300'}`}
                          >
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isChatLocked ? 'left-4' : 'left-1'}`} />
                          </button>
                        </div>
                        <div className="h-px bg-gray-200 my-1" />
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest text-center">Global Security Policy</p>
                      </div>
                    )}
                    {[...participants.keys()].map((participantId) => (
                      <ParticipantListItem
                        key={participantId}
                        participantId={participantId}
                        isHost={isHost}
                        isGhost={isGhost}
                        isHandRaised={raisedHands.has(participantId)}
                        publishRemoteControl={publishRemoteControl}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Sidebar */}
              {showChat && (
                <div className="w-80 bg-white flex flex-col z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.1)] relative border-l border-gray-100">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={16} className="text-[#3AB000]" />
                      <h3 className="font-black uppercase tracking-widest text-gray-900 text-xs">In-Call Messages</h3>
                    </div>
                    <button
                      onClick={() => {
                        setShowChat(false);
                        setUnreadCount(0);
                      }}
                      className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#f8fcf7]/30 scroll-smooth">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-[#3AB000]/20">
                          <MessageCircle size={32} className="text-[#3AB000]/30" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed max-w-[180px]">
                          Messages are private to the meeting and cleared when call ends.
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMe = msg.senderId === localParticipant.id;
                        return (
                          <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-1.5 px-1">
                              {!isMe && <span className="text-[9px] font-black uppercase text-[#3AB000] tracking-tight">{msg.senderName}</span>}
                              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{msg.timestamp}</span>
                              {isMe && <span className="text-[9px] font-black uppercase text-gray-400 tracking-tight">You</span>}
                            </div>
                            <div className={`max-w-[85%] px-4 py-2.5 text-[11px] font-medium shadow-sm leading-relaxed ${isMe
                              ? 'bg-[#3AB000] text-white rounded-2xl rounded-tr-none border border-[#3AB000]'
                              : 'bg-white text-gray-700 rounded-2xl rounded-tl-none border border-gray-100'
                              }`}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} className="h-2" />
                  </div>

                  {/* Chat Input */}
                  {(!isChatLocked || isHost || isGhost) ? (
                    <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const input = e.target.elements.chatInput;
                          if (input.value.trim()) {
                            sendChatMessage(input.value);
                            input.value = "";
                          }
                        }}
                        className="flex items-center gap-2 bg-gray-50 border-2 border-gray-100 p-1 rounded-none focus-within:border-[#3AB000] focus-within:bg-white transition-all group"
                      >
                        <input
                          name="chatInput"
                          placeholder="Type a message..."
                          autoComplete="off"
                          className="flex-1 bg-transparent p-2 text-[10px] font-black uppercase tracking-widest outline-none"
                        />
                        <button
                          type="submit"
                          className="p-2.5 bg-[#3AB000] text-white hover:bg-black transition-colors shadow-lg"
                        >
                          <Send size={14} strokeWidth={3} />
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                      <p className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-2">
                        <X size={12} strokeWidth={3} /> Chat restricted by host
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controls Bar */}
            <LocalControls
              localParticipantId={localParticipant?.id}
              toggleMic={toggleMic}
              toggleWebcam={toggleWebcam}
              toggleScreenShare={toggleScreenShare}
              isScreenShareOn={isScreenShareOn}
              leave={leave}
              setShowParticipantsList={setShowParticipantsList}
              showParticipantsList={showParticipantsList}
              isHost={isHost}
              isGhost={isGhost}
              meetingId={roomId}
              isMicLocked={isMicLocked}
              isCameraLocked={isCameraLocked}
              isScreenShareLocked={isScreenShareLocked}
              isChatLocked={isChatLocked}
              toggleHandRaise={toggleHandRaise}
              isHandRaised={raisedHands.has(localParticipant?.id)}
              setShowChat={setShowChat}
              showChat={showChat}
              unreadCount={unreadCount}
              invitedCount={recruitmentStats?.invited || 0}
              joinedInvitedCount={recruitmentStats?.joined || 0}
            />
          </>
        ) : joined === "JOINING" ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fcf7] gap-12 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
              <Video size={600} className="absolute -right-40 -bottom-40 text-[#3AB000]" />
              <Shield size={400} className="absolute -left-20 -top-20 text-[#3AB000]" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-8">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Outermost ring */}
                <div className="absolute inset-0 border-4 border-[#3AB000]/10 rounded-full" />
                {/* Spinning dashed ring */}
                <div className="absolute inset-0 border-t-4 border-l-4 border-[#3AB000] border-dashed rounded-full animate-spin duration-[4s]" />
                {/* Pulsing core */}
                <div className="w-16 h-16 bg-[#3AB000]/10 flex items-center justify-center rounded-full border-2 border-[#3AB000]/20 animate-pulse">
                  <Video size={32} className="text-[#3AB000]" />
                </div>
              </div>

              <div className="text-center space-y-3">
                <h3 className="text-[#3AB000] font-black uppercase tracking-[0.5em] text-xl animate-pulse italic">
                  Connecting...
                </h3>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[9px]">
                    <div className="w-1 h-1 bg-[#3AB000] rounded-full animate-bounce" />
                    Initializing Secure Tunnel
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[9px]">
                    <div className="w-1 h-1 bg-[#3AB000] rounded-full animate-bounce delay-75" />
                    Synchronizing Media Streams
                  </div>
                </div>
              </div>
            </div>

            {/* Hint Tag */}
            <div className="absolute bottom-12 flex items-center gap-3 bg-white px-6 py-3 border border-gray-100 shadow-sm rounded-none">
              <ShieldCheck size={16} className="text-[#3AB000]" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                End-to-End Encrypted Session • JSSA SECURE v2.0
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col xl:flex-row items-start justify-center gap-8 bg-[#f8fcf7] p-6 overflow-y-auto relative pt-24 max-w-7xl mx-auto w-full">
            {/* Navigation Back */}
            <button
              onClick={() => {
                // Trigger Kill-Switch immediately
                if (previewStreamRef.current) {
                  previewStreamRef.current.getTracks().forEach(t => t.stop());
                  previewStreamRef.current = null;
                }
                document.querySelectorAll('video, audio').forEach(media => {
                  if (media.srcObject instanceof MediaStream) {
                    media.srcObject.getTracks().forEach(t => t.stop());
                    media.srcObject = null;
                  }
                });
                onLeave();
              }}
              className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-[#3AB000] font-black uppercase tracking-widest text-[10px] transition-colors"
            >
              <ArrowLeft size={16} /> Return to Lounge
            </button>

            {/* Left Side: Hardware Preview Card */}
            <div className="bg-white border border-gray-200 border-t-[8px] border-t-[#3AB000] p-6 shadow-2xl w-full xl:w-2/3 max-w-[800px] shrink-0 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Monitor size={16} className="text-[#3AB000]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Hardware Check</h3>
              </div>

              <div className="w-full aspect-video bg-gray-900 border-2 border-gray-100 relative overflow-hidden group">
                {previewCam ? (
                  <video ref={previewVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                    <div className="w-20 h-20 bg-gray-800 flex items-center justify-center rounded-full mb-4 border-2 border-white/10">
                      <VideoOff size={32} className="text-gray-500" />
                    </div>
                    <p className="text-white/50 uppercase tracking-widest font-black text-[10px]">Camera Disabled</p>
                  </div>
                )}

                {/* Audio Visualizer Overlay */}
                {previewMic && (
                  <div className="absolute top-4 right-4 flex items-end gap-1 h-6 bg-black/40 p-2 rounded-sm backdrop-blur-sm border border-white/10">
                    <div className="w-1.5 bg-[#3AB000] transition-all duration-75" style={{ height: Math.min(16, Math.max(4, audioLevel * 0.3)) + 'px' }} />
                    <div className="w-1.5 bg-[#3AB000] transition-all duration-100" style={{ height: Math.min(16, Math.max(4, audioLevel * 0.5)) + 'px' }} />
                    <div className="w-1.5 bg-[#3AB000] transition-all duration-75" style={{ height: Math.min(16, Math.max(4, audioLevel * 0.4)) + 'px' }} />
                  </div>
                )}

                {/* Controls Overlay */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                  <button
                    onClick={() => setPreviewMic(!previewMic)}
                    style={{
                      boxShadow: previewMic && audioLevel > 5 ? `0 0 0 ${Math.min(audioLevel / 8, 8)}px rgba(58, 176, 0, 0.4)` : 'none',
                      transform: `scale(${1 + Math.min(audioLevel / 500, 0.05)})`
                    }}
                    className={`p-4 rounded-full transition-all duration-75 ${previewMic ? 'bg-[#3AB000] text-white border border-[#2d8a00]' : 'bg-red-600 hover:bg-red-700 text-white border border-red-500 shadow-2xl'}`}
                  >
                    {previewMic ? <Mic size={20} /> : <MicOff size={20} />}
                  </button>
                  <button
                    onClick={() => setPreviewCam(!previewCam)}
                    className={`p-4 rounded-full shadow-2xl transition-all ${previewCam ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20' : 'bg-red-600 hover:bg-red-700 text-white border border-red-500'}`}
                  >
                    {previewCam ? <Video size={20} /> : <VideoOff size={20} />}
                  </button>
                </div>
              </div>

              {/* Host/Ghost Settings Section in Lobby */}
              {(isHost || isGhost) && (
                <div className="mt-6 p-5 bg-gray-50 border-2 border-gray-100 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={16} className="text-[#3AB000]" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">Host Management Controls</h4>
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase text-gray-700 tracking-tight">Strict Audio Control (Mute All)</span>
                      <span className="text-[9px] font-bold text-red-500/60 uppercase tracking-tighter">Participants will be locked from unmuting</span>
                    </div>
                    <button
                      onClick={() => setEntryMicMuted(!entryMicMuted)}
                      className={`w-10 h-5 transition-all relative rounded-full ${entryMicMuted ? 'bg-[#3AB000]' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${entryMicMuted ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase text-gray-700 tracking-tight">Camera Lockdown (Video Off)</span>
                      <span className="text-[9px] font-bold text-red-500/60 uppercase tracking-tighter">Participants cannot enable webcams</span>
                    </div>
                    <button
                      onClick={() => setEntryVideoDisabled(!entryVideoDisabled)}
                      className={`w-10 h-5 transition-all relative rounded-full ${entryVideoDisabled ? 'bg-[#3AB000]' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${entryVideoDisabled ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase text-gray-700 tracking-tight">Screen Share Lockdown</span>
                      <span className="text-[9px] font-bold text-red-500/60 uppercase tracking-tighter">Only host can share screen</span>
                    </div>
                    <button
                      onClick={() => setEntryScreenShareDisabled(!entryScreenShareDisabled)}
                      className={`w-10 h-5 transition-all relative rounded-full ${entryScreenShareDisabled ? 'bg-[#3AB000]' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${entryScreenShareDisabled ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase text-gray-700 tracking-tight">Disable Chat Interaction</span>
                      <span className="text-[9px] font-bold text-red-500/60 uppercase tracking-tighter">Participants cannot send messages</span>
                    </div>
                    <button
                      onClick={() => setEntryChatDisabled(!entryChatDisabled)}
                      className={`w-10 h-5 transition-all relative rounded-full ${entryChatDisabled ? 'bg-[#3AB000]' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${entryChatDisabled ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Meeting Info & Recruit */}
            <div className="bg-white border border-gray-200 border-t-[8px] border-t-[#3AB000] p-8 shadow-2xl w-full xl:w-1/3 max-w-[450px]">
              <div className="flex flex-col gap-8">
                {/* Top Section: Status */}
                <div className="flex-1 text-center md:text-left">
                  <div className="bg-green-50 w-16 h-16 flex items-center justify-center border-2 border-[#3AB000]/20 mb-4 mx-auto md:mx-0">
                    <ShieldCheck size={40} className="text-[#3AB000]" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-1 italic">Ready to Join</h2>
                  <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.3em] mb-6 italic bg-green-50 px-3 py-1.5 rounded inline-block">Room: {roomId}</p>

                  {(isHost || isGhost) && (
                    <div className="mb-6 space-y-2 text-left">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Meeting Title (Purpose)</label>
                      <input
                        type="text"
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        placeholder="E.G. WEEKLY SYNC, URGENT UPDATE..."
                        className="w-full bg-gray-50 border-2 border-gray-100 p-4 text-[11px] font-black uppercase tracking-widest outline-none focus:border-[#3AB000] focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                  )}

                  <div className="space-y-4">
                    <button
                      onClick={async () => {
                        setJoined("JOINING");

                        // If host and title changed, update it first
                        if (isHost && meetingTitle && meetingTitle !== initialTitle) {
                          try {
                            await api.meetings.update(roomId, { title: meetingTitle });
                          } catch (e) { console.error("Title update failed", e); }
                        }

                        // If members selected, send invites first
                        if (selectedMembers.length > 0) {
                          try {
                            const res = await api.meetings.invite({
                              meetingId: roomId,
                              employeeUserIds: selectedMembers.map(m => m.userId)
                            });
                            if (res.success && res.broadcastJobId) {
                              addJob({ _id: res.broadcastJobId, title: `Meeting: ${meetingTitle || 'Session'}`, status: "pending", sentCount: 0, totalCandidates: selectedMembers.length });
                            }
                          } catch (e) { console.error("Initial invite failed", e); }
                        }
                        join();
                      }}
                      className="w-full bg-[#3AB000] text-white py-5 font-black uppercase tracking-[0.3em] border border-[#3AB000] hover:bg-black hover:border-black transition-all rounded-none text-[13px]"
                    >
                      Join Session
                    </button>
                    <p className="text-[9px] text-gray-300 font-bold uppercase tracking-[0.2em] text-center md:text-left">
                      <ShieldCheck size={12} className="inline mr-1" /> End-to-End Encryption Active
                    </p>
                  </div>
                </div>

                {/* Bottom Section: Quick Recruit (Host Only) */}
                {isHost && (
                  <div className="w-full border-t-2 border-gray-100 pt-8 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-[#3AB000]" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Participants</h3>
                      </div>
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="bg-[#3AB000]/10 hover:bg-[#3AB000] text-[#3AB000] hover:text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                      >
                        <Plus size={14} /> Add Participants
                      </button>
                    </div>

                    {/* Selected Members Persistent List */}
                    <div className="flex-1 max-h-[200px] overflow-y-auto space-y-2 scrollbar-hide">
                      {selectedMembers.length === 0 ? (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-center">
                          <Users size={24} className="text-gray-300 mb-2" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No participants selected yet</p>
                        </div>
                      ) : (
                        selectedMembers.map(m => (
                          <div key={`sel-${m.userId}`} className="flex items-center justify-between bg-green-50 p-3 border border-[#3AB000]/20 shadow-sm">
                            <span className="text-[11px] font-black uppercase text-[#3AB000] tracking-tight">{m.name}</span>
                            <button onClick={() => toggleSelectMember(m)} className="text-[#3AB000] hover:text-red-500 transition-colors p-1"><X size={14} /></button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ── Container Component ── */
const MeetingRoom = ({ isGhost = false }) => {
  const { roomId } = useParams();
  const { employeeProfile, session } = useAuth();
  const [token, setToken] = useState("");
  const [hostId, setHostId] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [initialMicOn, setInitialMicOn] = useState(false);
  const [initialCamOn, setInitialCamOn] = useState(false);
  const [initialTitle, setInitialTitle] = useState("");
  const [initialInvitedParticipants, setInitialInvitedParticipants] = useState([]);
  const [initialSettings, setInitialSettings] = useState(null);
  const [initialDuration, setInitialDuration] = useState(0);
  const [initialStartTime, setInitialStartTime] = useState(null);

  useEffect(() => {
    const getToken = async () => {
      try {
        const res = await api.meetings.join(roomId);
        if (res.success) {
          // Robust Redirection Failsafe:
          // If the platform is not 'internal' and an external URL is provided, 
          // redirect the user to the correct external platform.
          if (res.data.platform && res.data.platform !== 'internal' && res.data.externalUrl) {
            const externalUrl = res.data.externalUrl.startsWith('http') ? res.data.externalUrl : `https://${res.data.externalUrl}`;
            
            // Failsafe: Redirect the CURRENT tab to ensure they reach the external platform
            // even if the popup blocker stopped the new tab from the dashboard.
            window.location.replace(externalUrl);
            return;
          }

          setToken(res.data.token);
          setHostId(res.data.hostId);
          setInitialTitle(res.data.title || "");
          setInitialInvitedParticipants(res.data.invitedParticipants || []);
          setInitialSettings(res.data.settings);
          setInitialDuration(res.data.duration || 0);
          setInitialStartTime(res.data.startTime);
        } else {
          toast.error(res.message || "Could not join room");
          navigate("/employee/meetings");
        }
      } catch (error) {
        toast.error("An error occurred while fetching token");
        navigate("/employee/meetings");
      } finally {
        setLoading(false);
      }
    };

    getToken();
  }, [roomId, navigate]);

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-10 overflow-hidden relative">
      {/* Animated Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,#3AB000_0%,transparent_50%)] animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="w-24 h-24 bg-white/5 border-2 border-[#3AB000] flex items-center justify-center relative group">
          <ShieldCheck size={48} className="text-[#3AB000] animate-pulse" />
          <div className="absolute -inset-2 border border-[#3AB000]/30 animate-spin duration-[10s]" />
        </div>

        <div className="text-center">
          <h2 className="text-white text-2xl font-black uppercase tracking-[0.6em] mb-3 italic">Verifying Access</h2>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-white/20" />
            <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.4em] animate-pulse">JSSA Security Protocol Active</p>
            <div className="h-px w-12 bg-white/20" />
          </div>
        </div>
      </div>

      {/* Status Steps */}
      <div className="relative z-10 flex flex-col gap-3 items-center">
        <div className="flex items-center gap-3 text-white/40 text-[9px] font-black uppercase tracking-widest">
          <div className="w-1.5 h-1.5 rounded-full bg-[#3AB000]" />
          Validating Room ID
        </div>
        <div className="flex items-center gap-3 text-white/40 text-[9px] font-black uppercase tracking-widest">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
          Encrypting Handshake
        </div>
      </div>
    </div>
  );

  const rawUserId = employeeProfile?.userId?._id || employeeProfile?.userId || employeeProfile?._id;
  const currentUserId = isGhost ? "static_admin_id" : (rawUserId?.toString() || "");

  const normalizedHostId = hostId && (typeof hostId === 'object' ? (hostId._id || hostId.id || hostId) : hostId);
  const isHost = currentUserId && normalizedHostId && currentUserId.toString() === normalizedHostId.toString();

  const userName = isGhost ? "Administrator" : (employeeProfile?.name || "Employee User");
  const finalDisplayName = isGhost ? "Administrator" : (isHost ? `${userName} (HOST)` : userName);

  return token ? (
    <MeetingProvider
      config={{
        meetingId: roomId,
        mode: (isHost || isGhost) ? "CONFERENCE" : "VIEWER", // Host is Broadcaster, Others are Viewers
        micEnabled: (isHost || isGhost) ? (isGhost ? false : initialMicOn) : false,
        webcamEnabled: (isHost || isGhost) ? (isGhost ? false : initialCamOn) : false,
        name: finalDisplayName,
        metaData: {
          profileImage: employeeProfile?.profileImage || "",
        },
        webcamConfig: {
          resolution: "h360p_w640p", // Aggressive Cost Saving: Forced SD (360p) to avoid expensive 2K/4K billing
          optimizationMode: "motion",
          multiStream: false
        },
        screenShareConfig: {
          resolution: "h720p_w1280p", // Screen share capped at HD for clarity but not 2K
          optimizationMode: "detail",
          multiStream: false
        },
        recording: {
          enabled: false, // Explicitly disable any potential auto-recording from the client side
        },
      }}
      token={token}
    >
      <MeetingView
        roomId={roomId}
        onLeave={() => navigate(isGhost ? "/admin/meetings" : "/employee/meetings")}
        initialMicOn={initialMicOn}
        setInitialMicOn={setInitialMicOn}
        initialCamOn={initialCamOn}
        setInitialCamOn={setInitialCamOn}
        hostId={normalizedHostId ? normalizedHostId.toString() : ""}
        isHost={!!isHost}
        isGhost={isGhost}
        initialTitle={initialTitle}
        initialInvitedParticipants={initialInvitedParticipants}
        initialSettings={initialSettings}
        initialDuration={initialDuration}
        initialStartTime={initialStartTime}
        userName={finalDisplayName}
        employeeProfile={employeeProfile}
      />
    </MeetingProvider>
  ) : null;
};

export default MeetingRoom;
