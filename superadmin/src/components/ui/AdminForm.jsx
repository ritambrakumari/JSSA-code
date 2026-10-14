import React, { useState, useEffect } from 'react';
import { X, Shield, MapPin, Globe, Plus, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminForm = ({ isOpen, onClose, onSubmit, initialData = null, loading = false }) => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    restrictionType: 'anywhere',
    allowedIPs: [''],
    allowedLocations: [{ lat: '', lng: '', radius: 500, name: '' }]
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        password: '', // Don't pre-fill password for security
        allowedIPs: initialData.allowedIPs?.length ? initialData.allowedIPs : [''],
        allowedLocations: initialData.allowedLocations?.length 
          ? initialData.allowedLocations 
          : [{ lat: '', lng: '', radius: 500, name: '' }]
      });
    } else {
      setFormData({
        email: '',
        phone: '',
        password: '',
        restrictionType: 'anywhere',
        allowedIPs: [''],
        allowedLocations: [{ lat: '', lng: '', radius: 500, name: '' }]
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (index, value, field) => {
    const newArr = [...formData[field]];
    newArr[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArr }));
  };

  const handleLocationChange = (index, field, value) => {
    const newLocs = [...formData.allowedLocations];
    newLocs[index] = { ...newLocs[index], [field]: value };
    setFormData(prev => ({ ...prev, allowedLocations: newLocs }));
  };

  const addField = (field) => {
    if (field === 'allowedIPs') {
      setFormData(prev => ({ ...prev, allowedIPs: [...prev.allowedIPs, ''] }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        allowedLocations: [...prev.allowedLocations, { lat: '', lng: '', radius: 500, name: '' }] 
      }));
    }
  };

  const removeField = (index, field) => {
    const newArr = formData[field].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [field]: newArr.length ? newArr : (field === 'allowedIPs' ? [''] : [{ lat: '', lng: '', radius: 500, name: '' }]) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    data.allowedIPs = data.allowedIPs.filter(ip => ip.trim());
    data.allowedLocations = data.allowedLocations.filter(loc => loc.lat && loc.lng);
    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-2xl overflow-hidden border border-primary-600 rounded-[2.5rem]"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              {initialData ? 'Modify Protocol' : 'Initialize Administrator'}
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Access Configuration Suite</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 border border-transparent hover:border-gray-200 transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[13px] font-semibold text-primary-600 ml-1">Administrative Email</label>
              <input 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field border-primary-100 bg-white font-semibold focus:border-primary-500"
                placeholder="email@example.com"
                required={!formData.phone}
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-[13px] font-semibold text-primary-600 ml-1">Primary Phone</label>
              <input 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field border-primary-100 bg-white font-semibold focus:border-primary-500"
                placeholder="+91 XXXXX XXXXX"
                required={!formData.email}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[13px] font-semibold text-primary-600 ml-1">{initialData ? 'Security Override (Optional)' : 'Access Key'}</label>
            <div className="relative group">
              <input 
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field border-primary-100 bg-white font-semibold focus:border-primary-500 pr-12"
                placeholder="••••••••••••"
                required={!initialData}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[13px] font-semibold text-primary-600 ml-1">Security Protocol</label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'ip', label: 'Network Lock (IP)', icon: Shield },
                { id: 'geolocation', label: 'Geo Fence', icon: MapPin },
                { id: 'anywhere', label: 'Open Access', icon: Globe },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, restrictionType: mode.id }))}
                  className={`flex flex-col items-center justify-center p-6 gap-3 border transition-all rounded-2xl ${
                    formData.restrictionType === mode.id 
                      ? 'bg-primary-600 text-white border-primary-700 shadow-lg' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <mode.icon size={22} />
                  <span className="text-[11px] font-bold text-center">{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {formData.restrictionType === 'ip' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100"
              >
                <div className="flex justify-between items-center">
                  <label className="text-[13px] font-semibold text-primary-600 ml-1">Authorized IP Gateways</label>
                  <button 
                    type="button"
                    onClick={() => addField('allowedIPs')}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    + Add Gateway
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.allowedIPs.map((ip, index) => (
                    <div key={index} className="flex gap-3">
                      <input 
                        value={ip}
                        onChange={(e) => handleArrayChange(index, e.target.value, 'allowedIPs')}
                        className="input-field bg-white border-primary-100 font-semibold focus:border-primary-500"
                        placeholder="XXX.XXX.XXX.XXX"
                      />
                      <button type="button" onClick={() => removeField(index, 'allowedIPs')} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {formData.restrictionType === 'geolocation' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 p-6 bg-slate-50 rounded-2xl border border-slate-100"
              >
                <div className="flex justify-between items-center">
                  <label className="text-[13px] font-semibold text-primary-600 ml-1">Authorized Zones</label>
                  <button 
                    type="button"
                    onClick={() => addField('allowedLocations')}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    + Add Zone
                  </button>
                </div>
                <div className="space-y-6">
                  {formData.allowedLocations.map((loc, index) => (
                    <div key={index} className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 relative shadow-sm">
                      <button 
                        type="button" 
                        onClick={() => removeField(index, 'allowedLocations')}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                      <div className="space-y-3">
                        <label className="text-[12px] font-semibold text-primary-600 ml-1">Zone Label / Address</label>
                        <input 
                          value={loc.name}
                          onChange={(e) => handleLocationChange(index, 'name', e.target.value)}
                          className="input-field border-primary-100 bg-white font-semibold focus:border-primary-500"
                          placeholder="Headquarters, Branch Office, etc."
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[12px] font-semibold text-primary-600 ml-1">Lat</label>
                          <input type="number" step="any" value={loc.lat} onChange={(e) => handleLocationChange(index, 'lat', e.target.value)} className="input-field border-primary-100 bg-white font-semibold focus:border-primary-500" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[12px] font-semibold text-primary-600 ml-1">Lng</label>
                          <input type="number" step="any" value={loc.lng} onChange={(e) => handleLocationChange(index, 'lng', e.target.value)} className="input-field border-primary-100 bg-white font-semibold focus:border-primary-500" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[12px] font-semibold text-primary-600 ml-1">Radius (KM)</label>
                          <input type="number" value={loc.radius} onChange={(e) => handleLocationChange(index, 'radius', e.target.value)} className="input-field border-primary-100 bg-white font-semibold focus:border-primary-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <div className="p-8 border-t border-slate-100 flex gap-4 bg-slate-50/50">
          <button 
            type="button" 
            onClick={onClose}
            className="btn btn-outline flex-1 h-12 text-sm font-bold rounded-2xl active:scale-95"
          >
            Abort
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary flex-1 h-12 text-sm font-bold rounded-2xl active:scale-95 shadow-lg shadow-primary-900/20"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Save Protocol'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminForm;
