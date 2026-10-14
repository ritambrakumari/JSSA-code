import React, { useState, useEffect } from 'react';
import { sessionService } from '../services/api';
import {
  Monitor,
  Smartphone,
  Globe,
  Clock,
  MapPin,
  LogOut,
  RefreshCw,
  Loader2,
  Shield,
  Activity,
  Cpu,
  Power,
  ShieldAlert,
  Wifi,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const ActiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState(null);

  const [activeTab, setActiveTab] = useState('superadmin');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await sessionService.getSessions();
      setSessions(response.data);
    } catch (error) {
      toast.error('Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filteredSessions = sessions.filter(s => {
    if (activeTab === 'superadmin') return s.type === 'superadmin';
    if (activeTab === 'admin') return s.type === 'admin';
    return true;
  });

  const superAdminCount = sessions.filter(s => s.type === 'superadmin').length;
  const adminCount = sessions.filter(s => s.type === 'admin').length;

  const handleTerminate = async (id) => {
    if (!window.confirm('Forcibly logout this session?')) return;
    setTerminating(id);
    try {
      await sessionService.terminateSession(id);
      toast.success('Session terminated');
      setSessions(prev => prev.filter(s => s._id !== id));
    } catch (error) {
      toast.error('Termination failed');
    } finally {
      setTerminating(null);
    }
  };

  const handlePurgeAll = async () => {
    if (!window.confirm('Purge ALL active sessions from the network?')) return;
    setLoading(true);
    try {
      await Promise.all(filteredSessions.map(s => sessionService.terminateSession(s._id)));
      toast.success('Selected sessions purged');
      setSessions(prev => prev.filter(s => !filteredSessions.find(fs => fs._id === s._id)));
    } catch (error) {
      toast.error('Purge failed');
    } finally {
      setLoading(false);
    }
  };

  const formatLastActive = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Online';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return then.toLocaleDateString();
  };

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-100">
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-primary-600 mb-2">
              <Activity size={16} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Network Intelligence</span>
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Live Surveillance</h1>
           <p className="text-slate-400 font-medium max-w-xl">Real-time monitoring of all authenticated administrative sessions and access nodes.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchSessions}
            className="btn btn-outline h-14 gap-3 px-8 rounded-2xl active:scale-95"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span className="text-xs font-bold uppercase tracking-widest">Sync Feed</span>
          </button>
          <button 
            onClick={handlePurgeAll}
            className="btn bg-red-600 text-white hover:bg-red-700 h-14 gap-3 px-8 rounded-2xl shadow-xl shadow-red-900/10 active:scale-95"
            disabled={loading || filteredSessions.length === 0}
          >
            <ShieldAlert size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Emergency Purge</span>
          </button>
        </div>
      </div>

      {/* Tabs UI */}
      <div className="flex items-center gap-4 border-b border-slate-100 pb-px">
        {[
          { id: 'superadmin', label: 'SuperAdmin Logins', count: superAdminCount },
          { id: 'admin', label: 'Admin Logins', count: adminCount },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-8 py-4 text-sm font-bold transition-all ${
              activeTab === tab.id ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest ${
                activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count} LIVE
              </span>
            </div>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-[500px] flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <Loader2 size={64} className="animate-spin text-primary-500" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-4 h-4 bg-primary-600 rounded-full animate-ping opacity-50" />
            </div>
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Scanning Decrypted Traffic...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="h-[500px] flex flex-col items-center justify-center text-center p-12 bg-white border border-slate-100 rounded-[3rem] shadow-sm"
        >
          <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-8 border-2 border-dashed border-slate-200">
            <Wifi size={40} className="animate-pulse" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4">No Active Streams</h3>
          <p className="text-slate-400 font-medium max-w-md mx-auto leading-relaxed italic text-sm uppercase tracking-widest">
            The administrative perimeter for {activeTab} is currently clear. <br/> 
            No unauthorized or active nodes detected.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredSessions.map((session, index) => (
              <motion.div
                key={session._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="card group border-slate-100/60 hover:border-primary-500/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/5"
              >
                {/* Status Bar */}
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-2.5 h-2.5 rounded-full ${formatLastActive(session.lastActive) === 'Online' ? 'bg-primary-500 shadow-[0_0_8px_#14b8a6]' : 'bg-slate-600'}`} />
                      {formatLastActive(session.lastActive) === 'Online' && (
                        <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-40" />
                      )}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${formatLastActive(session.lastActive) === 'Online' ? 'text-primary-400' : 'text-slate-500'}`}>
                      {formatLastActive(session.lastActive)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <Shield size={12} className="text-primary-500" /> Layer-7 Secure
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {/* Operator Info */}
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.25rem] bg-slate-50 text-slate-400 flex items-center justify-center font-bold text-xl shadow-inner group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                      {session.userId?.email?.[0].toUpperCase() || 'A'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[17px] font-bold text-slate-900 truncate tracking-tight">{session.userId?.email || 'Authenticated Node'}</p>
                      <div className="flex items-center gap-2 mt-1">
                         <div className="w-1 h-1 bg-slate-300 rounded-full" />
                         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{session.location?.city || 'Region Unknown'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Network Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50 group-hover:bg-white transition-colors duration-500">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Globe size={10} className="text-primary-500" /> IP Gateway
                       </p>
                       <p className="text-[13px] font-black text-slate-800 font-mono tracking-tighter">{session.ipAddress || '0.0.0.0'}</p>
                    </div>
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50 group-hover:bg-white transition-colors duration-500">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Monitor size={10} className="text-primary-500" /> Platform
                       </p>
                       <p className="text-[13px] font-bold text-slate-800 truncate tracking-tight">{session.deviceInfo?.os || 'Encrypted OS'}</p>
                    </div>
                  </div>

                  {/* Device Info */}
                  <div className="space-y-4">
                     <div className="flex justify-between items-center px-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Cpu size={14} className="text-primary-500" /> Browser Fingerprint
                        </p>
                        <ExternalLink size={12} className="text-slate-300" />
                     </div>
                     <div className="bg-slate-950 p-4 rounded-2xl text-[12px] font-medium text-primary-400/80 leading-relaxed font-mono overflow-hidden whitespace-nowrap text-ellipsis border border-white/5">
                        {session.deviceInfo?.browser || 'RSA-Encrypted Agent'}
                     </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-colors">
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">
                    Node ID: {session._id.slice(-8).toUpperCase()}
                  </div>
                  <button 
                    onClick={() => handleTerminate(session._id)}
                    disabled={terminating === session._id}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm group-hover:shadow-md"
                  >
                    {terminating === session._id ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
                    <span>FORCIBLY TERMINATE</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ActiveSessions;
