import React, { useState, useEffect } from "react";
import { landingConfigService } from "../../services/api";
import { toast } from "sonner";
import {
  Settings,
  Save,
  Loader2,
  Shield,
  Plus,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Link as LinkIcon
} from "lucide-react";

const LandingConfig = () => {
  const [activeTab, setActiveTab] = useState("contact");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [contactUs, setContactUs] = useState({ phones: [], emails: [] });
  const [socialMedia, setSocialMedia] = useState({ facebook: "", instagram: "", youtube: "", linkedin: "", x: "" });
  const [branches, setBranches] = useState([]);
  const [floatingIcon, setFloatingIcon] = useState({ phone: "", whatsapp: "" });
  const [whatsappChannel, setWhatsappChannel] = useState("");

  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newBranch, setNewBranch] = useState({ name: "", address: "", phone: "", email: "", showInFooter: false });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await landingConfigService.getConfig();
      setContactUs(data.contactUs || { phones: [], emails: [] });
      setSocialMedia(data.socialMedia || { facebook: "", instagram: "", youtube: "", linkedin: "", x: "" });
      setBranches(data.branches || []);
      setFloatingIcon(data.floatingIcon || { phone: "", whatsapp: "" });
      setWhatsappChannel(data.whatsappChannel || "");
    } catch (error) {
      console.error(error);
      toast.error("Failed to load configurations");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (sectionData, sectionName) => {
    try {
      setSaving(true);
      const payload = { [sectionName]: sectionData };
      await landingConfigService.updateConfig(payload);
      toast.success(`${sectionName.replace(/([A-Z])/g, ' $1').trim()} updated successfully!`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update configuration");
    } finally {
      setSaving(false);
    }
  };

  // Contact Us Handlers
  const addPhone = () => {
    if (newPhone && !contactUs.phones.includes(newPhone)) {
      setContactUs({ ...contactUs, phones: [...contactUs.phones, newPhone] });
      setNewPhone("");
    }
  };
  const removePhone = (index) => {
    const updated = [...contactUs.phones];
    updated.splice(index, 1);
    setContactUs({ ...contactUs, phones: updated });
  };
  const addEmail = () => {
    if (newEmail && !contactUs.emails.includes(newEmail)) {
      setContactUs({ ...contactUs, emails: [...contactUs.emails, newEmail] });
      setNewEmail("");
    }
  };
  const removeEmail = (index) => {
    const updated = [...contactUs.emails];
    updated.splice(index, 1);
    setContactUs({ ...contactUs, emails: updated });
  };

  // Branch Handlers
  const addBranch = () => {
    if (!newBranch.name || !newBranch.address) return toast.error("Name and Address are required!");
    setBranches([...branches, newBranch]);
    setNewBranch({ name: "", address: "", phone: "", email: "", showInFooter: false });
  };
  const removeBranch = (index) => {
    const updated = [...branches];
    updated.splice(index, 1);
    setBranches(updated);
  };
  const updateBranch = (index, field, value) => {
    const updated = [...branches];
    updated[index][field] = value;
    setBranches(updated);
  };

  const tabs = [
    { id: "contact", label: "Contact Us" },
    { id: "social", label: "Social Media" },
    { id: "branches", label: "Branches" },
    { id: "floating", label: "Floating Icons" },
    { id: "whatsappChannel", label: "WhatsApp Channel" }
  ];

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-100">
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-primary-600 mb-2">
              <Settings size={16} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Landing Configuration</span>
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Landing Page Settings</h1>
           <p className="text-slate-400 font-medium max-w-xl">Configure Contact Info, Social Media Links, Branches, and Floating Action Buttons for the public landing page.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-4 border-b border-slate-200 px-2">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-6 text-[13px] uppercase tracking-wider font-bold transition-all relative cursor-pointer hover:bg-slate-50/50 rounded-t-lg ${
              activeTab === tab.id 
                ? "text-primary-600" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary-600 rounded-t-full shadow-[0_-2px_10px_rgba(var(--primary-600),0.5)]" />
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="card border-slate-100 shadow-xl shadow-slate-200/40 p-10 max-w-3xl mt-8">
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
            
            {/* CONTACT US TAB */}
            {activeTab === "contact" && (
              <div className="space-y-8 animate-fade-in">
                {/* Phone Numbers */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Phone Numbers</label>
                  <div className="flex gap-3 mb-5">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Phone size={18} /></span>
                      <input 
                        type="text" 
                        placeholder="Add Phone Number" 
                        value={newPhone} 
                        onChange={(e) => setNewPhone(e.target.value)} 
                        className="input-field pl-12 h-14 bg-slate-50 shadow-inner border-slate-200 focus:border-primary-500 transition-all font-bold text-slate-800 w-full rounded-xl border"
                      />
                    </div>
                    <button onClick={addPhone} className="flex items-center gap-2 text-xs font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-100 bg-primary-50 px-6 rounded-xl transition-all cursor-pointer shrink-0 uppercase tracking-wide active:scale-95">
                      <Plus size={16} /> Add
                    </button>
                  </div>
                  {contactUs.phones.length > 0 && (
                    <div className="space-y-3">
                      {contactUs.phones.map((phone, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-50 px-5 py-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <span className="font-bold text-slate-700">{phone}</span>
                          <button onClick={() => removePhone(i)} className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer shrink-0 active:scale-95">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Emails */}
                <div className="pt-8 border-t border-slate-100">
                  <label className="block text-sm font-bold text-slate-700 mb-3">Email Addresses</label>
                  <div className="flex gap-3 mb-5">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={18} /></span>
                      <input 
                        type="email" 
                        placeholder="Add Email Address" 
                        value={newEmail} 
                        onChange={(e) => setNewEmail(e.target.value)} 
                        className="input-field pl-12 h-14 bg-slate-50 shadow-inner border-slate-200 focus:border-primary-500 transition-all font-bold text-slate-800 w-full rounded-xl border"
                      />
                    </div>
                    <button onClick={addEmail} className="flex items-center gap-2 text-xs font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-100 bg-primary-50 px-6 rounded-xl transition-all cursor-pointer shrink-0 uppercase tracking-wide active:scale-95">
                      <Plus size={16} /> Add
                    </button>
                  </div>
                  {contactUs.emails.length > 0 && (
                    <div className="space-y-3">
                      {contactUs.emails.map((email, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-50 px-5 py-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <span className="font-bold text-slate-700">{email}</span>
                          <button onClick={() => removeEmail(i)} className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer shrink-0 active:scale-95">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleSave(contactUs, "contactUs")}
                  disabled={saving}
                  className="btn btn-primary w-full h-14 gap-3 shadow-xl shadow-primary-500/20 active:scale-95 text-sm font-bold tracking-widest uppercase cursor-pointer hover:shadow-primary-500/40 hover:opacity-90 disabled:opacity-70 disabled:active:scale-100 transition-all mt-6"
                >
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  <span>{saving ? 'Saving...' : 'Save Contact Us'}</span>
                </button>
              </div>
            )}

            {/* SOCIAL MEDIA TAB */}
            {activeTab === "social" && (
              <div className="space-y-8 animate-fade-in">
                {Object.keys(socialMedia).map((platform) => (
                  <div key={platform}>
                    <label className="block text-sm font-bold text-slate-700 mb-3 capitalize">{platform === "x" ? "X (Twitter)" : platform} Link</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><LinkIcon size={18} /></span>
                      <input 
                        type="text" 
                        value={socialMedia[platform]} 
                        onChange={(e) => setSocialMedia({ ...socialMedia, [platform]: e.target.value })} 
                        placeholder={`https://...`}
                        className="input-field pl-12 h-14 bg-slate-50 shadow-inner border-slate-200 focus:border-primary-500 transition-all font-bold text-slate-800 w-full rounded-xl border"
                      />
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => handleSave(socialMedia, "socialMedia")}
                  disabled={saving}
                  className="btn btn-primary w-full h-14 gap-3 shadow-xl shadow-primary-500/20 active:scale-95 text-sm font-bold tracking-widest uppercase cursor-pointer hover:shadow-primary-500/40 hover:opacity-90 disabled:opacity-70 disabled:active:scale-100 transition-all mt-8"
                >
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  <span>{saving ? 'Saving...' : 'Save Social Media'}</span>
                </button>
              </div>
            )}

            {/* BRANCHES TAB */}
            {activeTab === "branches" && (
              <div className="space-y-10 animate-fade-in">
                
                {/* Add New Branch */}
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-inner space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin size={20} className="text-primary-600" />
                    <h4 className="font-black text-slate-800 text-lg">Add New Branch</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Branch Name *</label>
                       <input 
                         type="text" 
                         placeholder="e.g. Main Branch" 
                         value={newBranch.name} 
                         onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })} 
                         className="input-field h-14 bg-white shadow-sm border-slate-200 focus:border-primary-500 px-4 rounded-xl border font-bold text-slate-800 w-full"
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Address *</label>
                       <input 
                         type="text" 
                         placeholder="Full address details" 
                         value={newBranch.address} 
                         onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })} 
                         className="input-field h-14 bg-white shadow-sm border-slate-200 focus:border-primary-500 px-4 rounded-xl border font-bold text-slate-800 w-full"
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Phone Number</label>
                       <input 
                         type="text" 
                         placeholder="+91..." 
                         value={newBranch.phone} 
                         onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })} 
                         className="input-field h-14 bg-white shadow-sm border-slate-200 focus:border-primary-500 px-4 rounded-xl border font-bold text-slate-800 w-full"
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Email Address</label>
                       <input 
                         type="email" 
                         placeholder="branch@example.com" 
                         value={newBranch.email} 
                         onChange={(e) => setNewBranch({ ...newBranch, email: e.target.value })} 
                         className="input-field h-14 bg-white shadow-sm border-slate-200 focus:border-primary-500 px-4 rounded-xl border font-bold text-slate-800 w-full"
                       />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-slate-200/60">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${newBranch.showInFooter ? 'bg-primary-600 border-primary-600' : 'border-slate-300 bg-white group-hover:border-primary-500'}`}>
                         {newBranch.showInFooter && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <input 
                        type="checkbox" 
                        checked={newBranch.showInFooter} 
                        onChange={(e) => setNewBranch({ ...newBranch, showInFooter: e.target.checked })}
                        className="hidden"
                      />
                      <span className="text-sm font-bold text-slate-700">Display in Website Footer</span>
                    </label>
                    <button onClick={addBranch} className="btn btn-primary h-12 px-6 gap-2 text-xs uppercase tracking-wider cursor-pointer hover:opacity-90 hover:shadow-lg transition-all active:scale-95">
                      <Plus size={16} /> Add Branch
                    </button>
                  </div>
                </div>

                {/* Existing Branches */}
                <div>
                  <h4 className="font-black text-slate-800 text-lg mb-5">Existing Branches</h4>
                  {branches.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <p className="text-sm font-bold text-slate-400">No branches added yet.</p>
                      <p className="text-xs text-slate-400 mt-1">Branches you add will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {branches.map((b, i) => (
                        <div key={i} className="border border-slate-200 p-6 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow relative">
                          <button 
                            onClick={() => removeBranch(i)} 
                            className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer active:scale-95"
                          >
                            <Trash2 size={20} />
                          </button>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 pr-12">
                            <div>
                              <label className="block text-[11px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">Name</label>
                              <input 
                                type="text" 
                                value={b.name} 
                                onChange={(e) => updateBranch(i, "name", e.target.value)} 
                                className="input-field h-12 bg-slate-50 border-slate-200 focus:border-primary-500 px-4 w-full rounded-xl border font-bold text-sm text-slate-800 shadow-inner"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">Address</label>
                              <input 
                                type="text" 
                                value={b.address} 
                                onChange={(e) => updateBranch(i, "address", e.target.value)} 
                                className="input-field h-12 bg-slate-50 border-slate-200 focus:border-primary-500 px-4 w-full rounded-xl border font-bold text-sm text-slate-800 shadow-inner"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">Phone</label>
                              <input 
                                type="text" 
                                value={b.phone} 
                                onChange={(e) => updateBranch(i, "phone", e.target.value)} 
                                className="input-field h-12 bg-slate-50 border-slate-200 focus:border-primary-500 px-4 w-full rounded-xl border font-bold text-sm text-slate-800 shadow-inner"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-black text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
                              <input 
                                type="email" 
                                value={b.email} 
                                onChange={(e) => updateBranch(i, "email", e.target.value)} 
                                className="input-field h-12 bg-slate-50 border-slate-200 focus:border-primary-500 px-4 w-full rounded-xl border font-bold text-sm text-slate-800 shadow-inner"
                              />
                            </div>
                          </div>
                          <div className="pt-5 border-t border-slate-100 flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${b.showInFooter ? 'bg-primary-600' : 'bg-slate-200 group-hover:bg-slate-300'}`}>
                                 {b.showInFooter && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                              </div>
                              <input 
                                type="checkbox" 
                                checked={b.showInFooter} 
                                onChange={(e) => updateBranch(i, "showInFooter", e.target.checked)}
                                className="hidden"
                              />
                              <span className="text-sm font-bold text-slate-600">Display in Website Footer</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleSave(branches, "branches")}
                  disabled={saving}
                  className="btn btn-primary w-full h-14 gap-3 shadow-xl shadow-primary-500/20 active:scale-95 text-sm font-bold tracking-widest uppercase cursor-pointer hover:shadow-primary-500/40 hover:opacity-90 disabled:opacity-70 disabled:active:scale-100 transition-all mt-8"
                >
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  <span>{saving ? 'Saving...' : 'Save Branches'}</span>
                </button>
              </div>
            )}

            {/* FLOATING ICON TAB */}
            {activeTab === "floating" && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Phone size={18} /></span>
                    <input 
                      type="text" 
                      value={floatingIcon.phone} 
                      onChange={(e) => setFloatingIcon({ ...floatingIcon, phone: e.target.value })} 
                      placeholder="e.g. +91 9876543210"
                      className="input-field pl-12 h-14 bg-slate-50 shadow-inner border-slate-200 focus:border-primary-500 transition-all font-bold text-slate-800 w-full rounded-xl border"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium">This number will be used for the call icon on the landing page.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">WhatsApp Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                      </svg>
                    </span>
                    <input 
                      type="text" 
                      value={floatingIcon.whatsapp} 
                      onChange={(e) => setFloatingIcon({ ...floatingIcon, whatsapp: e.target.value })} 
                      placeholder="e.g. 919876543210 (without +)"
                      className="input-field pl-12 h-14 bg-slate-50 shadow-inner border-slate-200 focus:border-primary-500 transition-all font-bold text-slate-800 w-full rounded-xl border"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium">Please include country code without '+' (e.g., 91 for India). Used for WhatsApp chat widget.</p>
                </div>

                <button 
                  onClick={() => handleSave(floatingIcon, "floatingIcon")}
                  disabled={saving}
                  className="btn btn-primary w-full h-14 gap-3 shadow-xl shadow-primary-500/20 active:scale-95 text-sm font-bold tracking-widest uppercase cursor-pointer hover:shadow-primary-500/40 hover:opacity-90 disabled:opacity-70 disabled:active:scale-100 transition-all mt-8"
                >
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  <span>{saving ? 'Saving...' : 'Save Floating Icons'}</span>
                </button>
              </div>
            )}

            {/* WHATSAPP CHANNEL TAB */}
            {activeTab === "whatsappChannel" && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">WhatsApp Channel Link</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <LinkIcon size={18} />
                    </span>
                    <input 
                      type="text" 
                      value={whatsappChannel} 
                      onChange={(e) => setWhatsappChannel(e.target.value)} 
                      placeholder="e.g. https://whatsapp.com/channel/..."
                      className="input-field pl-12 h-14 bg-slate-50 shadow-inner border-slate-200 focus:border-primary-500 transition-all font-bold text-slate-800 w-full rounded-xl border"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium">This link will be used on the landing page to redirect users to your WhatsApp Channel.</p>
                </div>

                <button 
                  onClick={() => handleSave(whatsappChannel, "whatsappChannel")}
                  disabled={saving}
                  className="btn btn-primary w-full h-14 gap-3 shadow-xl shadow-primary-500/20 active:scale-95 text-sm font-bold tracking-widest uppercase cursor-pointer hover:shadow-primary-500/40 hover:opacity-90 disabled:opacity-70 disabled:active:scale-100 transition-all mt-8"
                >
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  <span>{saving ? 'Saving...' : 'Save Channel Link'}</span>
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default LandingConfig;
