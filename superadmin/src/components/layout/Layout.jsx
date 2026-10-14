import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Activity,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Bell,
  Search,
  Settings,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/jssa-logo-long.png';

const SidebarItem = ({ icon: Icon, label, to, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center justify-between px-6 py-3.5 mx-4 rounded-xl transition-all duration-300 group relative ${active
      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-semibold'
      : 'text-slate-500 hover:bg-primary-50 hover:text-primary-700'
      }`}
  >
    <div className="flex items-center gap-3.5">
      <Icon size={18} className={active ? 'text-white' : 'text-slate-400 group-hover:text-primary-600 transition-colors'} />
      <span className="text-[13px] tracking-tight">{label}</span>
    </div>
    {active ? (
      <motion.div layoutId="active-indicator" className="w-1.5 h-1.5 bg-white rounded-full" />
    ) : (
      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary-300" />
    )}
  </Link>
);

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Control Center', to: '/' },
    { icon: Users, label: 'Admin Network', to: '/admins' },
    { icon: Activity, label: 'Live Surveillance', to: '/sessions' },
    { icon: Bell, label: 'Landing Content', to: '/landing-content' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-900">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-500 ease-in-out lg:translate-x-0 lg:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-8 border-b border-slate-100 flex items-center justify-center bg-white sticky top-0 z-10">
            <img
              src={logo}
              alt="JSSA Logo"
              className="h-14 w-auto object-contain"
            />
          </div>

          <nav className="flex-1 py-8 overflow-y-auto custom-scrollbar bg-white">
            <div className="px-10 mb-4">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">System Navigation</p>
            </div>
            <div className="space-y-1.5">
              {menuItems.map((item) => (
                <SidebarItem
                  key={item.to}
                  {...item}
                  active={location.pathname === item.to}
                  onClick={() => setIsSidebarOpen(false)}
                />
              ))}
            </div>

            <div className="mt-10 px-10 mb-4">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Utility</p>
            </div>
            <div className="space-y-1.5">
              <Link to="/rm-config" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3.5 px-6 py-3.5 mx-4 rounded-xl transition-all w-[calc(100%-32px)] text-[13px] font-medium group ${location.pathname === '/rm-config' ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-semibold' : 'text-slate-500 hover:bg-primary-50 hover:text-primary-700'}`}>
                <Settings size={18} className={location.pathname === '/rm-config' ? 'text-white' : 'text-slate-400 group-hover:text-primary-600 transition-colors'} />
                <span>RM Config</span>
              </Link>
              <Link to="/landing-config" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3.5 px-6 py-3.5 mx-4 rounded-xl transition-all w-[calc(100%-32px)] text-[13px] font-medium group ${location.pathname === '/landing-config' ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-semibold' : 'text-slate-500 hover:bg-primary-50 hover:text-primary-700'}`}>
                <Settings size={18} className={location.pathname === '/landing-config' ? 'text-white' : 'text-slate-400 group-hover:text-primary-600 transition-colors'} />
                <span>Landing Config</span>
              </Link>
            </div>
          </nav>

          <div className="mt-auto p-6 bg-white border-t border-slate-100">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 mb-4 group hover:bg-primary-50 hover:border-primary-100 transition-all cursor-default">
              <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                {user?.email?.[0].toUpperCase() || 'S'}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-primary-600 uppercase tracking-widest leading-none mb-1">SuperAdmin</p>
                <p className="text-[13px] font-bold truncate text-slate-700">{user?.email?.split('@')[0] || 'Administrator'}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 text-red-500 hover:bg-red-50 transition-all font-bold text-[12px] uppercase tracking-wider rounded-2xl border border-red-100 active:scale-95"
            >
              <LogOut size={16} />
              <span>Terminate Session</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-10 sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 text-slate-500 hover:bg-slate-50 lg:hidden rounded-xl border border-slate-200"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-primary-600 rounded-full shadow-[0_0_8px_rgba(22,163,74,0.4)]" />
              <h2 className="text-[18px] font-black text-slate-800 tracking-tight">
                {menuItems.find(item => item.to === location.pathname)?.label || 'Overview Console'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 w-72 group focus-within:border-primary-500/50 transition-all shadow-sm">
              <Search size={16} className="text-slate-400 group-focus-within:text-primary-500" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none pl-3 text-[13px] font-medium text-slate-600 w-full"
              />
              <span className="text-[9px] font-bold text-slate-300 border border-slate-100 px-1.5 py-0.5 rounded-md ml-2">⌘K</span>
            </div>

            <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Network Load</span>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 w-3/4 rounded-full" />
                  </div>
                  <span className="text-[10px] font-bold text-primary-600">99.9%</span>
                </div>
              </div>
              <button className="p-2.5 bg-white text-slate-400 hover:text-primary-600 border border-slate-100 rounded-xl transition-all relative shadow-sm hover:shadow-md">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="max-w-[1500px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
