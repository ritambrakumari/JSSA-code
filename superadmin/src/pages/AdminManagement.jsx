import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import AdminForm from '../components/ui/AdminForm';
import { 
  Plus, 
  Search, 
  UserPlus, 
  Users,
  Shield, 
  MapPin, 
  Globe, 
  Trash2, 
  Edit3,
  Loader2,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAdmins();
      setAdmins(response.data);
    } catch (error) {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleFormSubmit = async (data) => {
    setActionLoading(true);
    try {
      if (selectedAdmin) {
        await adminService.updateAdmin(selectedAdmin._id, data);
        toast.success('Admin updated successfully');
      } else {
        await adminService.createAdmin(data);
        toast.success('Admin created successfully');
      }
      setIsFormOpen(false);
      fetchAdmins();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin? This will also terminate all their active sessions.')) return;
    
    try {
      await adminService.deleteAdmin(id);
      toast.success('Admin deleted successfully');
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to delete admin');
    }
  };

  const filteredAdmins = admins.filter(admin => 
    admin.email?.toLowerCase().includes(search.toLowerCase()) || 
    admin.phone?.includes(search)
  );

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-100">
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-primary-600 mb-2">
              <Shield size={16} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Authority Management</span>
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Admin Network</h1>
           <p className="text-slate-400 font-medium max-w-xl">Configure access protocols and security clearance for administrative nodes.</p>
        </div>
        
        <button 
          onClick={() => { setSelectedAdmin(null); setIsFormOpen(true); }}
          className="btn btn-primary gap-3 h-14 px-8 shadow-xl shadow-primary-500/20 active:scale-95"
        >
          <UserPlus size={20} />
          <span className="text-sm font-bold uppercase tracking-widest">New Operator</span>
        </button>
      </div>

      {/* Filters & Control Row */}
      <div className="flex flex-col md:flex-row gap-5 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search operator by email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-14 h-14 bg-white shadow-sm border-slate-100 hover:border-slate-200 transition-all text-sm font-semibold"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <button 
            onClick={fetchAdmins}
            className="btn btn-outline h-14 gap-3 px-6 rounded-2xl flex-1 md:flex-none"
           >
             <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
             <span className="font-bold uppercase tracking-widest text-[11px]">Sync Feed</span>
           </button>
           <button className="btn btn-outline h-14 px-5 rounded-2xl">
              <Filter size={18} />
           </button>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="card border-slate-100 shadow-xl shadow-slate-200/40">
        {loading ? (
          <div className="h-80 flex flex-col items-center justify-center gap-5">
            <div className="relative">
               <Loader2 className="animate-spin text-primary-500" size={48} />
               <Shield size={18} className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-slate-300" />
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Retrieving clearance feed...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-center p-10">
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6 border-2 border-dashed border-slate-200">
              <Users size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No operators found</h3>
            <p className="text-sm text-slate-500 max-w-sm font-medium">Verify your search criteria or initialize a new operator to populate the network.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary-500/5 border-b border-primary-100/50">
                  <th className="px-8 py-5 text-[11px] font-black text-primary-700 uppercase tracking-[0.2em]">Operator Identity</th>
                  <th className="px-8 py-5 text-[11px] font-black text-primary-700 uppercase tracking-[0.2em]">Access Protocol</th>
                  <th className="px-8 py-5 text-[11px] font-black text-primary-700 uppercase tracking-[0.2em]">Configuration Status</th>
                  <th className="px-8 py-5 text-[11px] font-black text-primary-700 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-primary-50/30 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-lg group-hover:bg-primary-600 group-hover:scale-105 transition-all duration-300">
                          {admin.email?.[0].toUpperCase() || 'A'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-[15px] tracking-tight group-hover:text-primary-700 transition-colors">{admin.email || 'Restricted Identity'}</p>
                          <p className="text-xs text-slate-400 font-bold mt-1 tracking-tight">{admin.phone || 'No direct dial'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-sm ${
                        admin.restrictionType === 'ip' ? 'bg-primary-100 text-primary-700 border border-primary-200' :
                        admin.restrictionType === 'geolocation' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {admin.restrictionType === 'ip' && <Shield size={14} className="fill-current/10" />}
                        {admin.restrictionType === 'geolocation' && <MapPin size={14} className="fill-current/10" />}
                        {admin.restrictionType === 'anywhere' && <Globe size={14} className="fill-current/10" />}
                        <span>{admin.restrictionType} Locked</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                         <div className="text-[11px] font-bold text-slate-600 flex items-center gap-2">
                            <ChevronRight size={12} className="text-slate-300" />
                            {admin.restrictionType === 'ip' && `${admin.allowedIPs?.length || 0} Authorized Gateways`}
                            {admin.restrictionType === 'geolocation' && `${admin.allowedLocations?.length || 0} Zone Mappings`}
                            {admin.restrictionType === 'anywhere' && 'Unrestricted Node'}
                         </div>
                         <div className="h-1 w-24 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 w-full opacity-40" />
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <button 
                          onClick={() => { setSelectedAdmin(admin); setIsFormOpen(true); }}
                          className="p-3 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                          title="Edit Configuration"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(admin._id)}
                          className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Purge Operator"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button className="p-3 text-slate-300 hover:text-slate-600 rounded-xl transition-all">
                           <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedAdmin}
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminManagement;
