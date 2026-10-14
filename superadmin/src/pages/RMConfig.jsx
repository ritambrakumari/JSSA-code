import React, { useState, useEffect } from 'react';
import { goalConfigService } from '../services/api';
import { 
  Settings, 
  Save,
  Loader2,
  Shield,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const INDIAN_STATES = [
  "Andaman and Nicobar Islands (UT)", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh (UT)", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu (UT)", "Delhi (NCT)", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Lakshadweep (UT)", "Ladakh (UT)", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry (UT)", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttarakhand", "Uttar Pradesh", 
  "West Bengal"
];

const RMConfig = () => {
  const [baseSalary, setBaseSalary] = useState('');
  const [stateSalaries, setStateSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRMConfig();
  }, []);

  const fetchRMConfig = async () => {
    setLoading(true);
    try {
      const response = await goalConfigService.getConfig();
      if (response.success) {
        const rmConfig = response.data.find(c => c.role === 'RM');
        if (rmConfig) {
          if (rmConfig.baseSalary) setBaseSalary(rmConfig.baseSalary.toString());
          if (rmConfig.stateSalaries && Array.isArray(rmConfig.stateSalaries)) {
            setStateSalaries(rmConfig.stateSalaries);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load RM configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStateSalary = () => {
    setStateSalaries([...stateSalaries, { state: "", salary: "" }]);
  };

  const handleRemoveStateSalary = (index) => {
    const newArr = [...stateSalaries];
    newArr.splice(index, 1);
    setStateSalaries(newArr);
  };

  const handleStateSalaryChange = (index, field, value) => {
    const newArr = [...stateSalaries];
    newArr[index][field] = value;
    setStateSalaries(newArr);
  };

  const handleSave = async () => {
    if (!baseSalary || isNaN(baseSalary)) {
      toast.error('Please enter a valid numeric default base salary');
      return;
    }

    // Validate state salaries
    for (let i = 0; i < stateSalaries.length; i++) {
      const item = stateSalaries[i];
      if (!item.state) {
        toast.error(`Please select a state for entry #${i + 1}`);
        return;
      }
      if (!item.salary || isNaN(item.salary)) {
        toast.error(`Please enter a valid numeric salary for ${item.state}`);
        return;
      }
    }

    // Check for duplicate states
    const statesSet = new Set();
    for (const item of stateSalaries) {
      if (statesSet.has(item.state)) {
        toast.error(`Duplicate entry found for state: ${item.state}`);
        return;
      }
      statesSet.add(item.state);
    }

    setSaving(true);
    try {
      const formattedStateSalaries = stateSalaries.map(s => ({
        state: s.state,
        salary: Number(s.salary)
      }));

      await goalConfigService.updateConfig('RM', { 
        baseSalary: Number(baseSalary),
        stateSalaries: formattedStateSalaries
      });
      toast.success('RM Configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-100">
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-primary-600 mb-2">
              <Settings size={16} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Utility Configuration</span>
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">RM Settings</h1>
           <p className="text-slate-400 font-medium max-w-xl">Configure Base Salary and state-wise financial parameters for Regional Managers.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="card border-slate-100 shadow-xl shadow-slate-200/40 p-10 max-w-3xl">
        {loading ? (
          <div className="h-40 flex flex-col items-center justify-center gap-5">
            <div className="relative">
               <Loader2 className="animate-spin text-primary-500" size={48} />
               <Shield size={18} className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-slate-300" />
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Retrieving config...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Default Base Salary */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Default RM Base Salary (Fallback)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input 
                  type="number" 
                  placeholder="e.g. 35500"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  className="input-field pl-10 h-14 bg-slate-50 shadow-inner border-slate-200 focus:border-primary-500 transition-all text-lg font-black text-slate-800"
                />
              </div>
              <p className="text-xs text-slate-400 mt-2 font-medium">This amount acts as a fallback for any RM whose state is not explicitly configured below.</p>
            </div>

            {/* State-wise Salaries */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-bold text-slate-700">
                  State-wise Base Salaries
                </label>
                <button 
                  onClick={handleAddStateSalary}
                  className="flex items-center gap-2 text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={14} /> Add State
                </button>
              </div>

              {stateSalaries.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <p className="text-sm font-medium text-slate-400">No state-wise salaries configured.</p>
                  <p className="text-xs text-slate-400 mt-1">The default base salary will be used for all RMs.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stateSalaries.map((item, index) => (
                    <div key={index} className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex-1">
                        <select
                          value={item.state}
                          onChange={(e) => handleStateSalaryChange(index, 'state', e.target.value)}
                          className="input-field h-12 bg-white border-slate-200 focus:border-primary-500 text-sm font-bold text-slate-800"
                        >
                          <option value="">-- Select State --</option>
                          {INDIAN_STATES.map(s => (
                            <option key={s} value={s.split(" (")[0]}>{s.split(" (")[0]}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                        <input
                          type="number"
                          placeholder="Salary"
                          value={item.salary}
                          onChange={(e) => handleStateSalaryChange(index, 'salary', e.target.value)}
                          className="input-field pl-8 h-12 bg-white border-slate-200 focus:border-primary-500 text-sm font-bold text-slate-800"
                        />
                      </div>
                      <button 
                        onClick={() => handleRemoveStateSalary(index)}
                        className="w-12 h-12 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                        title="Remove State"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary w-full h-14 gap-3 shadow-xl shadow-primary-500/20 active:scale-95 text-sm font-bold tracking-widest uppercase disabled:opacity-70 disabled:active:scale-100 mt-8"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RMConfig;
