import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Award, Search, FileBadge, Calendar, Save, Loader2, Eye, Edit, Trash2, X, Folder, ChevronRight, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import CertificateViewer from '../../components/CertificateViewer';
import jssaLogo from '../../assets/jssa-logo-long.png';
import watermarkLogo from '../../assets/JSSAogo.png';

const categories = [
    { id: 'training', title: 'Training', desc: 'Manage Training Certificates' },
    { id: 'rm-zc-dm', title: 'RM, ZC, DM', desc: 'Manage RM, ZC, DM Certificates' },
    { id: 'employee', title: 'Other Employee', desc: 'Manage Employee Certificates' },
];

const allCertificates = [
    { id: 'training-cert-1', categoryId: 'training', templateId: 'training', title: 'Training Certificate (उत्कृष्ट योगदान प्रशंसा प्रमाण-पत्र)' },
    { id: 'rm-zc-dm-cert-1', categoryId: 'rm-zc-dm', templateId: 'rm-zc-dm', title: 'Leadership Certificate (नेतृत्व उत्कृष्टता प्रमाण-पत्र)' },
    { id: 'rm-zc-dm-cert-2', categoryId: 'rm-zc-dm', templateId: 'rm-zc-dm-social-impact', title: 'Social Impact (सामाजिक प्रभाव प्रमाण-पत्र)' },
    { id: 'rm-zc-dm-cert-3', categoryId: 'rm-zc-dm', templateId: 'rm-zc-dm-appreciation', title: 'Appreciation (प्रशंसा प्रमाण-पत्र)' },
    { id: 'employee-cert-1', categoryId: 'employee', templateId: 'employee', title: 'Employee Excellence (उत्कृष्टता प्रमाण-पत्र)' },
    { id: 'employee-cert-2', categoryId: 'employee', templateId: 'employee-outstanding', title: 'Outstanding Performance (उत्कृष्ट कार्य निष्पादन)' },
    { id: 'employee-cert-3', categoryId: 'employee', templateId: 'employee-performance', title: 'Performance (कार्य निष्पादन प्रमाण-पत्र)' },
    { id: 'employee-cert-4', categoryId: 'employee', templateId: 'employee-best-state', title: 'Best State Performer (राज्य स्तरीय उत्कृष्ट प्रदर्शन)' },
    { id: 'employee-cert-5', categoryId: 'employee', templateId: 'employee-honor', title: 'Honor & Appreciation (सम्मान एवं प्रशंसा)' },
];

const RMCertificateAssignment = () => {
    const [rms, setRms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('training');
    
    // Modals state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [previewCert, setPreviewCert] = useState(null);
    
    // Current Action State
    const [selectedRm, setSelectedRm] = useState(null);
    const [assignedCertificates, setAssignedCertificates] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [loadingCerts, setLoadingCerts] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        templateIds: [],
        issueDate: new Date().toISOString().split('T')[0]
    });
    const [editCertId, setEditCertId] = useState(null);

    const fetchRMs = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const response = await api.certificates.getRMs();
            if (response.success) {
                setRms(response.data);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch RMs');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const fetchAssignedCertificates = async (employeeId) => {
        try {
            setLoadingCerts(true);
            const response = await api.certificates.getEmployeeCertificates(employeeId);
            if (response.success) {
                setAssignedCertificates(response.data);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch certificates');
        } finally {
            setLoadingCerts(false);
        }
    };

    useEffect(() => {
        fetchRMs();
    }, []);

    const filteredRMs = rms.filter(rm => 
        rm.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        rm.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rm.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenAssign = (rm) => {
        setSelectedRm(rm);
        setEditCertId(null);
        setFormData({
            templateIds: [],
            issueDate: new Date().toISOString().split('T')[0]
        });
        setIsAssignModalOpen(true);
    };

    const handleOpenView = async (rm) => {
        setSelectedRm(rm);
        setIsViewModalOpen(true);
        await fetchAssignedCertificates(rm._id);
    };

    const handleEditCert = (cert) => {
        setIsViewModalOpen(false);
        setEditCertId(cert._id);
        setFormData({
            templateIds: [cert.templateId],
            issueDate: new Date(cert.issueDate).toISOString().split('T')[0]
        });
        setIsAssignModalOpen(true);
    };

    const handleDeleteCert = async (certId) => {
        if (!window.confirm('Are you sure you want to delete this assigned certificate?')) return;
        
        try {
            const response = await api.certificates.deleteAssigned(certId);
            if (response.success) {
                toast.success('Certificate deleted successfully');
                fetchAssignedCertificates(selectedRm._id);
                fetchRMs(false);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to delete certificate');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.templateIds.length === 0) {
            toast.error('Please select at least one certificate template');
            return;
        }

        try {
            setIsSaving(true);
            if (editCertId) {
                // Update
                const payload = {
                    templateId: formData.templateIds[0],
                    issueDate: formData.issueDate
                };
                const response = await api.certificates.updateAssigned(editCertId, payload);
                if (response.success) {
                    toast.success('Certificate updated successfully');
                    setIsAssignModalOpen(false);
                    fetchAssignedCertificates(selectedRm._id);
                    fetchRMs(false);
                }
            } else {
                // Create
                const payload = {
                    employeeId: selectedRm._id,
                    ...formData
                };
                const response = await api.certificates.assign(payload);
                if (response.success) {
                    toast.success('Certificate assigned successfully');
                    setIsAssignModalOpen(false);
                    fetchAssignedCertificates(selectedRm._id);
                    fetchRMs(false);
                }
            }
        } catch (error) {
            toast.error(error.message || 'Failed to save certificate');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-white p-0 md:ml-0 px-2 md:px-6 pb-10">
                <div className="pt-4 md:pt-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30">
                            <Award className="text-white" size={30} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">RM & ZC Certificate Assignment</h1>
                            <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Assign certificates to Regional Managers (RM) & Zonal Coordinators (ZC)</p>
                        </div>
                    </div>
                </div>

                    {/* OPERATING INSTRUCTIONS BANNER */}
                    <div className="bg-gradient-to-r from-white via-[#ECFCCB] to-[#D9F99D] border-2 border-[#D9F99D] p-6 shadow-sm mb-6 space-y-5">
                        <div className="flex items-center gap-2.5 text-[#3F6212] font-black text-sm uppercase tracking-wide border-b-2 border-[#D9F99D] pb-3">
                            <Info size={20} className="text-[#3AB000]" />
                            <span>RM & ZC Manual Certificate Assignment — Operating Instructions & Step-by-Step Guide</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="bg-white p-4 border border-[#D9F99D] shadow-sm space-y-2">
                                <div className="font-black text-[#3F6212] uppercase text-xs flex items-center gap-1.5">
                                    <span>🔍 Step 1: Search & Locate Employee</span>
                                </div>
                                <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                                    Use the search bar below to find any <strong>Regional Manager (RM)</strong> or <strong>Zonal Coordinator (ZC)</strong> by Name, Designation, or District location.
                                </p>
                            </div>

                            <div className="bg-white p-4 border border-[#D9F99D] shadow-sm space-y-2">
                                <div className="font-black text-[#3F6212] uppercase text-xs flex items-center gap-1.5">
                                    <span>🏷️ Step 2: Assign Certificate</span>
                                </div>
                                <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                                    Click the <strong>Assign</strong> button next to the employee. Pick the <strong>Issue Date</strong>, select one or more <strong>RM/ZC Certificate Templates</strong>, and click <strong>Save Assignment</strong>.
                                </p>
                            </div>

                            <div className="bg-white p-4 border border-[#D9F99D] shadow-sm space-y-2">
                                <div className="font-black text-[#3F6212] uppercase text-xs flex items-center gap-1.5">
                                    <span>👁️ Step 3: View & Manage Records</span>
                                </div>
                                <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                                    Click the <strong>View</strong> button to inspect assigned certificates for that employee. Open the <strong>Preview</strong> modal or <strong>Delete</strong> any invalid certificate record.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-3.5 border border-[#D9F99D] text-xs text-gray-800 font-bold uppercase tracking-wide flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-[#3AB000] font-black">📌 ASSIGNMENT SCOPE:</span>
                                <span>This page is dedicated ONLY to manual certificate assignment for <strong>RM & ZC</strong>.</span>
                            </div>
                            <div className="text-gray-600 font-semibold text-[11px]">
                                * Automatic monthly assignment for <strong>DM, BS, & PE</strong> is managed under <strong>Certificate Config</strong>.
                            </div>
                        </div>
                    </div>

                    {/* Search & Filter */}
                    <div className="bg-white border border-gray-200 p-5 rounded-none shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search RM / ZC by Name, Role, or District..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-[#3AB000] text-sm"
                            />
                        </div>
                        <div className="text-sm font-bold text-gray-600 bg-gray-50 px-4 py-2 border border-gray-200 rounded-none">
                            Total RM & ZC: {filteredRMs.length}
                        </div>
                    </div>

                    {/* RM Table */}
                    <div className="bg-white border border-gray-200 shadow-sm overflow-hidden rounded-none mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-4 text-xs font-black uppercase text-gray-700 tracking-wider">Employee Name</th>
                                    <th className="p-4 text-xs font-black uppercase text-gray-700 tracking-wider">Designation</th>
                                    <th className="p-4 text-xs font-black uppercase text-gray-700 tracking-wider">Location</th>
                                    <th className="p-4 text-xs font-black uppercase text-gray-700 tracking-wider text-center">Assigned</th>
                                    <th className="p-4 text-xs font-black uppercase text-gray-700 tracking-wider text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center">
                                            <Loader2 className="w-8 h-8 text-[#3AB000] animate-spin mx-auto" />
                                            <p className="text-sm mt-2 text-gray-500">Loading RMs...</p>
                                        </td>
                                    </tr>
                                ) : filteredRMs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-sm text-gray-500">
                                            No RM found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRMs.map((rm) => (
                                        <tr key={rm._id} className="border-b border-gray-100 hover:bg-[#ECFCCB] transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800">{rm.name}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-gray-600 bg-gray-100 inline-block px-2 py-1 rounded-sm border border-gray-200">{rm.designation || rm.role}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-gray-600">{rm.district || rm.workingDistrict}, {rm.state || rm.workingState}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 bg-[#ECFCCB] border border-[#D9F99D] text-[#3F6212] font-black text-sm">
                                                    {rm.assignedCount || 0}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenAssign(rm)}
                                                        className="px-3 py-1.5 bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                                                    >
                                                        <FileBadge size={14} /> Assign
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenView(rm)}
                                                        className="px-3 py-1.5 bg-white border border-[#3AB000] text-[#3AB000] hover:bg-[#3AB000] hover:text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                                                    >
                                                        <Eye size={14} /> View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Assign Modal */}
                {isAssignModalOpen && selectedRm && (
                    <div className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center p-4">
                        <div className="bg-white max-w-4xl w-full flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gray-50 shrink-0">
                                <h2 className="text-base font-black uppercase tracking-widest text-gray-800 flex items-center gap-2">
                                    <FileBadge className="text-[#3AB000]" size={20} />
                                    {editCertId ? 'Edit Assigned Certificate' : 'Assign Certificate'}
                                </h2>
                                <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-red-500">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 overflow-auto">
                                <div className="bg-[#ECFCCB] border border-[#D9F99D] p-4 mb-6 text-sm">
                                    <span className="font-bold text-gray-800">Selected Employee: </span>
                                    <span className="text-[#3F6212] font-bold">{selectedRm.name} ({selectedRm.designation || selectedRm.role})</span>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-6">
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Issue Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="date"
                                                required
                                                max={new Date().toISOString().split('T')[0]}
                                                value={formData.issueDate}
                                                onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 border-b border-gray-200 pb-2 mb-4">
                                            <Folder className="text-[#3AB000]" size={18} />
                                            <label className="text-xs font-black text-gray-800 uppercase tracking-wider">
                                                Available RM & ZC Certificate Templates {editCertId && '(Editing Single)'}
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {allCertificates.filter(c => c.categoryId === 'rm-zc-dm').map(cert => {
                                                const isSelected = formData.templateIds.includes(cert.templateId);
                                                return (
                                                <div 
                                                    key={cert.templateId}
                                                    onClick={() => {
                                                        if (editCertId) {
                                                            setFormData({ ...formData, templateIds: [cert.templateId] });
                                                        } else {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                templateIds: prev.templateIds.includes(cert.templateId) 
                                                                    ? prev.templateIds.filter(id => id !== cert.templateId) 
                                                                    : [...prev.templateIds, cert.templateId]
                                                            }));
                                                        }
                                                    }}
                                                    className={`cursor-pointer border-2 p-4 text-center transition-all ${
                                                        isSelected 
                                                        ? 'border-[#3AB000] bg-[#ECFCCB] shadow-sm' 
                                                        : 'border-gray-200 hover:border-[#D9F99D]'
                                                    }`}
                                                >
                                                    <Award className={`w-8 h-8 mx-auto mb-2 ${isSelected ? 'text-[#3AB000]' : 'text-gray-400'}`} />
                                                    <p className="text-xs font-bold text-gray-800">{cert.title}</p>
                                                </div>
                                            )})}
                                        </div>

                                        {formData.templateIds.length > 0 && (
                                            <div className="mt-6 border-t border-gray-200 pt-4">
                                                <label className="block text-xs font-bold text-gray-700 uppercase mb-3">Selected Templates ({formData.templateIds.length})</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.templateIds.map(id => {
                                                        const c = allCertificates.find(cert => cert.templateId === id);
                                                        return (
                                                            <div key={id} className="bg-[#3AB000] text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 shadow-sm">
                                                                {c?.title}
                                                                {!editCertId && (
                                                                    <X 
                                                                        size={14} 
                                                                        className="cursor-pointer hover:text-red-200 bg-black/20 rounded-full p-0.5" 
                                                                        onClick={() => setFormData(prev => ({ ...prev, templateIds: prev.templateIds.filter(tid => tid !== id) }))} 
                                                                    />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
                                        <button 
                                            type="button" 
                                            onClick={() => setIsAssignModalOpen(false)}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 font-bold uppercase text-xs hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            disabled={isSaving}
                                            className="px-6 py-2 bg-[#4D7C0F] text-white font-bold uppercase text-xs hover:bg-[#3F6212] flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                            {editCertId ? 'Update' : 'Save Assignment'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Assigned Modal */}
                {isViewModalOpen && selectedRm && (
                    <div className="fixed inset-0 z-50 bg-white flex justify-center items-center">
                        <div className="bg-white w-full h-full flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 shrink-0">
                                <h2 className="text-xl font-black uppercase tracking-widest text-gray-800 flex items-center gap-3">
                                    <Eye className="text-[#3AB000]" size={28} />
                                    Assigned Certificates: {selectedRm.name}
                                </h2>
                                <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-red-500 bg-white border border-gray-200 p-2.5 hover:border-red-500 hover:bg-red-50 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 md:p-10 overflow-auto bg-gray-50/30 flex-1">
                                {loadingCerts ? (
                                    <div className="py-20 flex justify-center">
                                        <Loader2 className="w-12 h-12 text-[#3AB000] animate-spin" />
                                    </div>
                                ) : assignedCertificates.length === 0 ? (
                                    <div className="py-32 text-center text-gray-500 border border-dashed border-gray-300 bg-white mx-auto max-w-4xl text-lg">
                                        No certificates assigned to this employee.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-10 w-full max-w-[1600px] mx-auto">
                                        {Object.entries(
                                            [...assignedCertificates]
                                                .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
                                                .reduce((acc, cert) => {
                                                    const dateStr = new Date(cert.issueDate).toLocaleDateString('en-GB', {
                                                        day: 'numeric', month: 'long', year: 'numeric'
                                                    });
                                                    if (!acc[dateStr]) acc[dateStr] = [];
                                                    acc[dateStr].push(cert);
                                                    return acc;
                                                }, {})
                                        ).map(([date, certs]) => (
                                            <div key={date} className="flex flex-col gap-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-px bg-gray-300 flex-1"></div>
                                                    <div className="px-6 py-2 bg-white border border-gray-200 text-sm font-black text-[#3F6212] uppercase tracking-widest shadow-sm">
                                                        {date}
                                                    </div>
                                                    <div className="h-px bg-gray-300 flex-1"></div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                    {certs.map(cert => {
                                                        const certInfo = allCertificates.find(c => c.templateId === cert.templateId) || { title: 'Unknown Certificate' };
                                                        return (
                                                            <div key={cert._id} className="border border-gray-200 p-5 flex flex-col justify-between gap-4 hover:border-[#4D7C0F] hover:shadow-lg transition-all bg-white group h-full">
                                                                <div className="flex items-start gap-4">
                                                                    <div className="w-12 h-12 bg-[#ECFCCB] flex items-center justify-center shrink-0 border border-[#D9F99D] group-hover:bg-[#3AB000] transition-colors">
                                                                        <Award className="text-[#3AB000] group-hover:text-white transition-colors" size={24} />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide leading-tight mb-2">{certInfo.title}</h4>
                                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Assigned Template</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-end mt-2 pt-4 border-t border-gray-100 gap-2">
                                                                    <button 
                                                                        onClick={() => setPreviewCert(cert)}
                                                                        className="p-2 border border-[#D9F99D] text-[#4D7C0F] hover:bg-[#ECFCCB] hover:border-[#4D7C0F] hover:text-[#3F6212] transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                                                                        title="Preview"
                                                                    >
                                                                        <Eye size={16} /> Preview
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteCert(cert._id)}
                                                                        className="p-2 border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={16} /> Delete
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Certificate Preview Modal */}
                {previewCert && (
                    <div className="fixed inset-0 z-[60] bg-black/80 flex justify-center items-center p-4">
                        <div className="bg-white w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 shrink-0">
                                <h2 className="text-lg font-black uppercase tracking-widest text-gray-800 flex items-center gap-2">
                                    <Eye className="text-[#3AB000]" size={20} />
                                    Certificate Preview: {selectedRm?.name}
                                </h2>
                                <button onClick={() => setPreviewCert(null)} className="text-gray-400 hover:text-red-500 bg-white border border-gray-200 p-2 rounded-none hover:border-red-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto bg-gray-200 flex justify-center items-center p-8">
                                <div className="print-area bg-[#fdfdfa] shadow-xl w-[1123px] h-[794px] p-[72px] relative text-gray-900 shrink-0 flex flex-col scale-75 lg:scale-90 xl:scale-100 origin-center" style={{ fontFamily: '"Georgia", "Times New Roman", serif', boxSizing: 'border-box' }}>
                                    <div className="absolute inset-0 border-[16px] border-[#206933] pointer-events-none z-30"></div>
                                    <div className="absolute inset-[28px] border-[3px] border-[#206933] pointer-events-none z-20 opacity-80"></div>
                                    <div className="absolute inset-0 m-auto flex items-center justify-center pointer-events-none z-0 opacity-[0.06] overflow-hidden">
                                        <img src={watermarkLogo} alt="Watermark" className="w-[550px] h-auto object-contain" />
                                    </div>

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex justify-center mb-4 -mt-6">
                                            <img src={jssaLogo} alt="JSSA Logo" className="h-20 object-contain" />
                                        </div>

                                        <CertificateViewer 
                                            templateId={previewCert.templateId} 
                                            mode="admin" 
                                            employeeData={{
                                                ...selectedRm,
                                                cardsCount: previewCert.cardsCount,
                                                targetCount: previewCert.targetCount,
                                                achievementPercentage: previewCert.achievementPercentage,
                                                state: previewCert.state || selectedRm?.state || selectedRm?.workingState
                                            }} 
                                            issueDate={previewCert.issueDate} 
                                            certId={previewCert._id} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </DashboardLayout>
    );
};

export default RMCertificateAssignment;
