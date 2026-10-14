import React, { useState, useEffect } from 'react';
import { adminService, sessionService } from '../services/api';
import { Link } from 'react-router-dom';
import {
  Users,
  Activity,
  ShieldCheck,
  MapPin,
  TrendingUp,
  ArrowUpRight,
  UserCheck,
  BarChart3,
  Globe,
  Lock,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, subValue, trend, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="card group hover:border-primary-500/50 transition-all duration-500 bg-primary-50/30 border-primary-100 shadow-sm"
  >
    <div className="p-7 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
         <Icon size={120} className="-rotate-12" />
      </div>
      
      <div className="flex items-center justify-between mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary-100/50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
          <Icon size={24} />
        </div>
        {trend && (
           <div className="flex items-center gap-1.5 px-3 py-1 bg-primary-50 rounded-full">
              <TrendingUp size={12} className="text-primary-600" />
              <span className="text-[10px] font-black text-primary-700 uppercase tracking-widest">{trend}</span>
           </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-4xl font-bold text-slate-900 tracking-tight group-hover:text-primary-600 transition-colors">{value}</h3>
        <p className="text-[13px] font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
         <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide group-hover:text-primary-600 transition-colors">{subValue}</span>
         <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary-600 group-hover:text-white transition-all">
            <ArrowUpRight size={14} />
         </div>
      </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeSessions: 0,
    ipRestricted: 0,
    geoRestricted: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [adminRes, sessionRes] = await Promise.all([
          adminService.getAdmins(),
          sessionService.getSessions()
        ]);

        const admins = adminRes.data;
        setStats({
          totalAdmins: admins.length,
          activeSessions: sessionRes.data.length,
          ipRestricted: admins.filter(a => a.restrictionType === 'ip').length,
          geoRestricted: admins.filter(a => a.restrictionType === 'geolocation').length
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-100">
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-primary-600 mb-2">
              <Zap size={16} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Operational Live Feed</span>
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">System Oversight</h1>
           <p className="text-slate-400 font-medium max-w-xl">Real-time monitoring of administrative protocols and infrastructure health indicators.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 pr-6">
              <div className="w-12 h-12 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-lg">
                 <BarChart3 size={20} />
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Health Pulse</p>
                 <p className="text-[13px] font-bold text-slate-800 uppercase leading-none">99.8% Optimized</p>
              </div>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Admins"
          value={stats.totalAdmins}
          subValue="Access Nodes"
          trend="Steady"
          delay={0.1}
        />
        <StatCard
          icon={Activity}
          label="Live Sessions"
          value={stats.activeSessions}
          subValue="Encrypted Streams"
          trend="Active"
          delay={0.2}
        />
        <StatCard
          icon={Lock}
          label="IP Enforced"
          value={stats.ipRestricted}
          subValue="Security Rules"
          trend="Shielded"
          delay={0.3}
        />
        <StatCard
          icon={Globe}
          label="Geo Fenced"
          value={stats.geoRestricted}
          subValue="Region Maps"
          trend="Mapped"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Command Control Banner */}
        <div className="xl:col-span-2 bg-slate-950 p-12 rounded-[3rem] relative overflow-hidden group shadow-2xl">
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#14b8a6 2px, transparent 2.5px)', backgroundSize: '32px 32px' }} />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="mb-12">
               <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] mb-8">
                  <ShieldCheck size={14} className="text-primary-500" /> Root Authority Command
               </div>
               <h2 className="text-4xl font-black text-white mb-6 tracking-tight leading-tight max-w-lg">
                  Advanced Administrative <span className="text-primary-500">Security Control Center</span>
               </h2>
               <p className="text-slate-400 max-w-xl text-lg font-medium leading-relaxed opacity-80">
                  Global oversight active. Seamlessly orchestrate network protocols, 
                  security clearance levels, and real-time surveillance across the entire ecosystem.
               </p>
            </div>
            
            <div className="flex flex-wrap gap-5">
              <Link to="/admins" className="btn btn-primary px-10 py-4 text-[13px] font-bold shadow-xl shadow-primary-500/30">
                Network Clearance Access
              </Link>
              <Link to="/sessions" className="btn bg-white/5 text-white hover:bg-white/10 px-10 py-4 text-[13px] font-bold border border-white/10 active:scale-95 transition-all">
                Live Feed Monitor
              </Link>
            </div>
          </div>
        </div>

        {/* Node Health Status */}
        <div className="card p-10 flex flex-col hover:border-primary-500/20">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
              Node Infrastructure
            </h3>
            <span className="text-[9px] font-black text-primary-600 px-3 py-1 bg-primary-50 border border-primary-100 rounded-lg uppercase tracking-widest">Global Scan</span>
          </div>

          <div className="space-y-8 flex-1">
            {[
              { label: 'Primary Auth Gateway', status: 'Healthy', val: 100 },
              { label: 'Security DB Cluster', status: 'Syncing', val: 97 },
              { label: 'Session Cache Node', status: 'Active', val: 100 },
              { label: 'Encryption Layer', status: 'Optimal', val: 100 },
            ].map((item, i) => (
              <div key={i} className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[13px] font-bold text-slate-700">{item.label}</span>
                  <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{item.status}</span>
                </div>
                <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-[1px]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.val}%` }}
                    transition={{ duration: 1.5, delay: 0.5 + (i * 0.1) }}
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-50 text-center">
             <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                Automated protocols active
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
