import React, { useState, useEffect } from 'react';
import { Video, X, ArrowRight, PhoneIncoming, Youtube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const MeetingInviteOverlay = () => {
  const [invitations, setInvitations] = useState([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissedRooms, setDismissedRooms] = useState(new Set());
  const navigate = useNavigate();

  const fetchInvitations = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;
      if (!token) return;

      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/meetings/invitations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const now = new Date();
        const activeInvites = res.data.data.filter(inv => {
          if (inv.status !== 'pending') return false;
          if (dismissedRooms.has(inv.meetingId?._id)) return false;
          
          const meeting = inv.meetingId;
          if (!meeting) return false;

          // If instant, always show
          if (meeting.type === 'instant') return true;

          // If scheduled, show only if it's within 15 minutes of starting OR it's already past start time
          if (meeting.type === 'scheduled' && meeting.scheduledFor) {
            const startTime = new Date(meeting.scheduledFor);
            const diffInMinutes = (startTime - now) / (1000 * 60);
            
            // Show if it's starting in less than 15 mins OR it's already late
            return diffInMinutes <= 15;
          }

          return true;
        });

        setInvitations(activeInvites);
        if (activeInvites.length > 0) setVisible(true);
        else setVisible(false);
      }
    } catch (error) {
      console.error("Overlay fetch error:", error);
    }
  };

  useEffect(() => {
    fetchInvitations();
    const interval = setInterval(fetchInvitations, 30000);
    return () => clearInterval(interval);
  }, [dismissedRooms]);

  const handleAction = async (inviteId, status, roomId, dbMeetingId) => {
    try {
      setLoading(true);
      const invite = invitations.find(inv => inv._id === inviteId);
      const meeting = invite?.meetingId;

      if (status === 'accepted' && (meeting?.platform === 'gmeet' || meeting?.platform === 'youtube') && meeting?.externalUrl) {
        const url = meeting.externalUrl.startsWith('http') ? meeting.externalUrl : `https://${meeting.externalUrl}`;
        window.open(url, '_blank');
      }

      const token = JSON.parse(localStorage.getItem("jssa_auth") || "{}").token;
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/meetings/invitation/status`, 
        { invitationId: inviteId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (status === 'accepted') {
        if (!((meeting?.platform === 'gmeet' || meeting?.platform === 'youtube') && meeting?.externalUrl)) {
          navigate(`/meeting/${roomId}`);
        } else {
          setInvitations(invitations.filter(inv => inv._id !== inviteId));
        }
      } else {
        setDismissedRooms(prev => new Set(prev).add(dbMeetingId));
        setInvitations(invitations.filter(inv => inv._id !== inviteId));
      }
    } catch (error) {
      toast.error("Action failed");
    } finally {
      setLoading(false);
    }
  };

  if (!visible || invitations.length === 0) return null;

  const currentInvite = invitations[0];
  const isYouTube = currentInvite.meetingId?.platform === 'youtube';

  return (
    <div 
      className={`fixed bottom-6 right-6 w-[380px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-2 ${isYouTube ? 'border-[#FF0000]' : 'border-[#3AB000]'} z-[9999] animate-in slide-in-from-right-10 duration-500 overflow-hidden rounded-none`}
    >
      <div className={`${isYouTube ? 'bg-[#FF0000]' : 'bg-[#3AB000]'} px-5 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
            {isYouTube ? 'LIVE YOUTUBE STREAMING' : 'Live Invitation'}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start gap-5">
          <div className={`w-16 h-16 ${isYouTube ? 'bg-[#FF0000]/10 text-[#FF0000]' : 'bg-[#3AB000]/10 text-[#3AB000]'} flex items-center justify-center shrink-0 border-2 ${isYouTube ? 'border-[#FF0000]/20' : 'border-[#3AB000]/20'}`}>
            {isYouTube ? <Youtube size={32} strokeWidth={2.5} /> : <Video size={28} strokeWidth={2.5} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
              {isYouTube ? 'STREAMING PROTOCOL ACTIVE' : 'Incoming Session'}
            </p>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-tight mb-1 truncate">
              {isYouTube ? 'MANDATORY LIVE STREAM' : (currentInvite.meetingId?.title || 'Video Session')}
            </h4>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {isYouTube ? 'JOIN THE MANDATORY YOUTUBE LIVE SESSION' : `Hosted by ${currentInvite.senderId?.name || 'Admin'}`}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => handleAction(currentInvite._id, 'accepted', currentInvite.meetingId?.roomId, currentInvite.meetingId?._id)}
            disabled={loading}
            className={`w-full py-4 ${isYouTube ? 'bg-[#FF0000]' : 'bg-[#3AB000]'} text-white font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg active:scale-[0.98]`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isYouTube ? 'JOIN LIVE STREAM' : 'Join Session'}
                <ArrowRight size={18} strokeWidth={3} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingInviteOverlay;
