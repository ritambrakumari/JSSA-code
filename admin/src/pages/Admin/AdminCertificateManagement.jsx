import React, { useState, useEffect, useRef, useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import jssaLogo from '../../assets/jssa-logo-long.png';
import watermarkLogo from '../../assets/JSSAogo.png';
import { Award, Eye, X, Folder, ChevronRight, FileBadge, FileText, Download, Loader2, Settings, Play, Save, Sliders, Calendar, CheckCircle2, History, Layers, Trash2, Search, Filter, ChevronLeft, ChevronRight as ChevronRightIcon, BarChart3, Info } from 'lucide-react';
import CertificateViewer from '../../components/CertificateViewer';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AdminCertificateManagement = () => {
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'config' | 'report'
  const [selectedCategory, setSelectedCategory] = useState('training');
  const [selectedCert, setSelectedCert] = useState(null);
  const [certModalData, setCertModalData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const certRef = useRef(null);

  // Certificate Config State
  const [config, setConfig] = useState({
    globalExcellenceEnabled: true,
    statePerformerEnabled: true,
    targetAchievedEnabled: true,
    partialPerformanceEnabled: true,
    minCardsThresholdForPerformance: 50,
    autoAssignCronEnabled: true
  });
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Manual Auto-Assign Trigger State
  const currentDate = new Date();
  const [triggerMonth, setTriggerMonth] = useState(currentDate.getMonth() === 0 ? 12 : currentDate.getMonth());
  const [triggerYear, setTriggerYear] = useState(currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear());
  const [isTriggering, setIsTriggering] = useState(false);

  // Auto-Assigned Certificates History & Search/Filter State
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDesignation, setFilterDesignation] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [selectedCertIds, setSelectedCertIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Script load error for ${src}`));
      document.head.appendChild(script);
    });
  };

  const fetchConfig = async () => {
    try {
      setLoadingConfig(true);
      const res = await api.certificates.getConfig();
      if (res.success && res.data) {
        setConfig(res.data);
      }
    } catch (err) {
      console.error('Failed to load certificate config:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const params = {};
      if (filterMonth) params.month = filterMonth;
      if (filterYear) params.year = filterYear;

      const res = await api.certificates.getAutoAssignHistory(params);
      if (res.success) {
        setHistoryList(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to fetch certificate history');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'config') {
      fetchConfig();
    }
    if (activeTab === 'report') {
      fetchHistory();
    }
  }, [activeTab, filterMonth, filterYear]);

  // Unique designations list for dropdown filter
  const designationsList = useMemo(() => {
    const set = new Set();
    historyList.forEach(item => {
      const emp = item.employeeId || {};
      const des = emp.role || emp.designation;
      if (des) set.add(des.trim());
    });
    return Array.from(set).sort();
  }, [historyList]);

  // Filtered Certificates History based on search, designation, month, year
  const filteredHistory = useMemo(() => {
    return historyList.filter(item => {
      const emp = item.employeeId || {};
      const user = emp.userId || {};

      const name = (emp.name || '').toLowerCase();
      const mobile = (user.mobile || emp.mobile || '').toLowerCase();
      const email = (user.email || emp.email || '').toLowerCase();
      const roleDes = (emp.role || emp.designation || '').toLowerCase();

      const search = searchTerm.toLowerCase().trim();
      const matchesSearch = !search || name.includes(search) || mobile.includes(search) || email.includes(search);
      const matchesDesignation = !filterDesignation || roleDes.includes(filterDesignation.toLowerCase());

      return matchesSearch && matchesDesignation;
    });
  }, [historyList, searchTerm, filterDesignation]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedCertIds([]);
  }, [searchTerm, filterDesignation, filterMonth, filterYear, activeTab]);

  // Paginated Data
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const paginatedHistory = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredHistory, currentPage, itemsPerPage]);

  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const handleSelectAllCurrentPage = (e) => {
    if (e.target.checked) {
      const currentPageIds = paginatedHistory.map(item => item._id);
      const combined = Array.from(new Set([...selectedCertIds, ...currentPageIds]));
      setSelectedCertIds(combined);
    } else {
      const currentPageIds = paginatedHistory.map(item => item._id);
      setSelectedCertIds(selectedCertIds.filter(id => !currentPageIds.includes(id)));
    }
  };

  const handleSelectOne = (id) => {
    if (selectedCertIds.includes(id)) {
      setSelectedCertIds(selectedCertIds.filter(item => item !== id));
    } else {
      setSelectedCertIds([...selectedCertIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCertIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedCertIds.length} selected certificate records?`)) return;

    try {
      setIsBulkDeleting(true);
      const res = await api.certificates.bulkDeleteAssigned(selectedCertIds);
      if (res.success) {
        toast.success(res.message || `${selectedCertIds.length} certificates deleted successfully!`);
        setSelectedCertIds([]);
        fetchHistory();
      } else {
        toast.error(res.message || 'Failed to delete selected certificates');
      }
    } catch (err) {
      toast.error('Error deleting selected certificates');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteCertificate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assigned certificate record?')) return;
    try {
      const res = await api.certificates.deleteAssigned(id);
      if (res.success) {
        toast.success('Certificate record deleted successfully!');
        fetchHistory();
      } else {
        toast.error(res.message || 'Failed to delete certificate');
      }
    } catch (err) {
      toast.error('Error deleting certificate record');
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      const res = await api.certificates.updateConfig(config);
      if (res.success) {
        toast.success('Certificate Configuration saved successfully!');
        setConfig(res.data);
      } else {
        toast.error(res.message || 'Failed to save configuration');
      }
    } catch (err) {
      toast.error(err.message || 'Error saving configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleRunAutoAssign = async () => {
    try {
      setIsTriggering(true);
      const res = await api.certificates.triggerAutoAssign({
        month: Number(triggerMonth),
        year: Number(triggerYear)
      });

      if (res.success) {
        toast.success(res.message || 'Auto-assignment completed successfully!');
        if (activeTab === 'report') fetchHistory();
      } else {
        toast.error(res.message || 'Auto-assignment failed');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to execute auto-assignment');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleDownload = async () => {
    if (isDownloading || !certRef.current) return;
    setIsDownloading(true);

    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/dom-to-image/2.6.0/dom-to-image.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

      const element = certRef.current;
      element.classList.remove('shadow-xl');
      await new Promise(resolve => setTimeout(resolve, 50));

      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const scale = 3;

      const dataUrl = await window.domtoimage.toJpeg(element, {
        quality: 1.0,
        bgcolor: '#fdfdfa',
        width: width * scale,
        height: height * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          margin: '0',
          boxShadow: 'none'
        }
      });

      element.classList.add('shadow-xl');

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [width, height],
        compress: true
      });

      pdf.addImage(dataUrl, 'JPEG', 0, 0, width, height);
      pdf.save(`Certificate_${selectedCert}.pdf`);

    } catch (err) {
      console.error('PDF Generation Error:', err);
      if (certRef.current) {
        certRef.current.classList.add('shadow-xl');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const categories = [
    { id: 'training', title: 'Training', desc: 'Manage Training Certificates' },
    { id: 'rm-zc-dm', title: 'RM, ZC', desc: 'Manage RM, ZC Certificates' },
    { id: 'employee', title: 'Other Employee', desc: 'Manage Employee Certificates' },
  ];

  const allCertificates = [
    { id: 'training-cert-1', categoryId: 'training', templateId: 'training', title: 'Training Certificate (उत्कृष्ट योगदान प्रशंसा प्रमाण-पत्र)', desc: 'Certificate of Appreciation for Outstanding Contribution' },
    { id: 'rm-zc-dm-cert-1', categoryId: 'rm-zc-dm', templateId: 'rm-zc-dm', title: 'Leadership Certificate (नेतृत्व उत्कृष्टता प्रमाण-पत्र)', desc: 'Leadership Excellence Certificate' },
    { id: 'rm-zc-dm-cert-2', categoryId: 'rm-zc-dm', templateId: 'rm-zc-dm-social-impact', title: 'Social Impact (सामाजिक प्रभाव प्रमाण-पत्र)', desc: 'Social Impact Certificate' },
    { id: 'rm-zc-dm-cert-3', categoryId: 'rm-zc-dm', templateId: 'rm-zc-dm-appreciation', title: 'Appreciation (प्रशंसा प्रमाण-पत्र)', desc: 'Certificate of Appreciation' },
    { id: 'employee-cert-1', categoryId: 'employee', templateId: 'employee', title: 'Employee Excellence (उत्कृष्टता प्रमाण-पत्र)', desc: 'Certificate of Excellence' },
    { id: 'employee-cert-2', categoryId: 'employee', templateId: 'employee-outstanding', title: 'Outstanding Performance (उत्कृष्ट कार्य निष्पादन)', desc: 'Certificate of Outstanding Performance' },
    { id: 'employee-cert-3', categoryId: 'employee', templateId: 'employee-performance', title: 'Performance (कार्य निष्पादन प्रमाण-पत्र)', desc: 'Certificate of Performance' },
    { id: 'employee-cert-4', categoryId: 'employee', templateId: 'employee-best-state', title: 'Best State Performer (राज्य स्तरीय उत्कृष्ट प्रदर्शन)', desc: 'Best State Performer Certificate' },
    { id: 'employee-cert-5', categoryId: 'employee', templateId: 'employee-honor', title: 'Honor & Appreciation (सम्मान एवं प्रशंसा)', desc: 'Certificate of Honor and Appreciation' },
  ];

  const displayedCertificates = allCertificates.filter(cert => cert.categoryId === selectedCategory);

  const handleView = (templateId, customData = null) => {
    setSelectedCert(templateId);
    setCertModalData(customData);
    setIsModalOpen(true);
  };

  const getAssignmentBadge = (type) => {
    switch (type) {
      case 'auto_global':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 border border-amber-300">Global Top Performer</span>;
      case 'auto_state':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2 py-0.5 border border-blue-300">State Top Performer</span>;
      case 'auto_target':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 border border-emerald-300">100% Target Achieved</span>;
      case 'auto_performance':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase px-2 py-0.5 border border-purple-300">Performance Qualifier</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-[10px] font-black uppercase px-2 py-0.5 border border-gray-300">Manual Assignment</span>;
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-0 md:ml-0 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">

          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-6 no-print">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30">
                <FileText className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Certificate Management</h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Manage, Configure & Auto-Assign Employee Certificates</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-none text-center md:text-right shrink-0">
              <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Total Templates</p>
              <p className="text-xl font-black text-white uppercase mt-1">{allCertificates.length}</p>
            </div>
          </div>

          {/* Sub-Nav Navigation Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-8 no-print bg-gray-100 p-2 border border-gray-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('templates')}
                className={`flex items-center gap-2 px-5 py-2.5 font-black uppercase text-xs tracking-wider transition-all duration-200 rounded-none border ${
                  activeTab === 'templates'
                    ? 'bg-[#3AB000] text-white border-[#2d8a00] shadow-md transform -translate-y-0.5'
                    : 'bg-white text-gray-700 hover:text-[#3AB000] hover:bg-green-50/80 border-gray-200'
                }`}
              >
                <FileBadge size={16} /> Certificate Templates
              </button>

              <button
                onClick={() => setActiveTab('config')}
                className={`flex items-center gap-2 px-5 py-2.5 font-black uppercase text-xs tracking-wider transition-all duration-200 rounded-none border ${
                  activeTab === 'config'
                    ? 'bg-[#3AB000] text-white border-[#2d8a00] shadow-md transform -translate-y-0.5'
                    : 'bg-white text-gray-700 hover:text-[#3AB000] hover:bg-green-50/80 border-gray-200'
                }`}
              >
                <Settings size={16} /> Certificate Config & Auto-Assign
              </button>

              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-2 px-5 py-2.5 font-black uppercase text-xs tracking-wider transition-all duration-200 rounded-none border ${
                  activeTab === 'report'
                    ? 'bg-[#3AB000] text-white border-[#2d8a00] shadow-md transform -translate-y-0.5'
                    : 'bg-white text-gray-700 hover:text-[#3AB000] hover:bg-green-50/80 border-gray-200'
                }`}
              >
                <BarChart3 size={16} /> Auto-Assigned Certificates Report
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/admin/rm-certificates"
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-800 hover:border-[#3AB000] hover:text-[#3AB000] hover:bg-green-50 text-[11px] font-black uppercase tracking-wider transition-all"
              >
                RM & ZC Assignment Portal
              </Link>
              <Link
                to="/admin/custom-certificates"
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-800 hover:border-[#3AB000] hover:text-[#3AB000] hover:bg-green-50 text-[11px] font-black uppercase tracking-wider transition-all"
              >
                Custom Certificates
              </Link>
            </div>
          </div>

          {/* TAB 1: TEMPLATES PREVIEW */}
          {activeTab === 'templates' && (
            <>
              {/* 3 Grid Boxes for Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 no-print">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`cursor-pointer rounded-none p-5 border-2 transition-all duration-200 ${selectedCategory === cat.id
                      ? 'bg-green-50 border-[#3AB000] shadow-sm'
                      : 'bg-white border-gray-200 hover:border-[#D9F99D] hover:shadow-sm'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2.5 flex items-center justify-center rounded-none border ${selectedCategory === cat.id ? 'bg-[#3AB000] text-white border-[#2d8a00]' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                          <Folder size={20} />
                        </div>
                        <div>
                          <h3 className={`font-black uppercase text-sm tracking-wider ${selectedCategory === cat.id ? 'text-[#3AB000]' : 'text-gray-800'}`}>
                            {cat.title}
                          </h3>
                          <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">{cat.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${selectedCategory === cat.id ? 'text-[#3AB000]' : 'text-gray-300'}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Certificates under the selected category */}
              {selectedCategory && (
                <div className="no-print bg-gray-50 border border-gray-200 p-5 rounded-none shadow-sm mb-6">
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-5">
                    <FileBadge size={16} className="text-[#3AB000]" />
                    <h2 className="text-xs font-black text-gray-800 uppercase tracking-widest">
                      Certificates for {categories.find(c => c.id === selectedCategory)?.title}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {displayedCertificates.length > 0 ? (
                      displayedCertificates.map((cert) => (
                        <div key={cert.id} className="bg-white rounded-none shadow-sm p-4 border border-gray-200 hover:border-[#3AB000] transition-colors flex flex-col h-full group">
                          <div className="flex items-center justify-center h-28 bg-gray-50 rounded-none mb-4 border border-gray-100 relative overflow-hidden group-hover:bg-green-50 transition-colors">
                            <Award className="w-16 h-16 text-gray-200 absolute transform group-hover:scale-110 transition-transform duration-300" strokeWidth={1} />
                            <FileBadge className="w-10 h-10 text-[#3AB000] z-10" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-1">{cert.title}</h3>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-4 leading-relaxed">{cert.desc}</p>
                          </div>

                          <div className="mt-auto">
                            <button
                              onClick={() => handleView(cert.templateId)}
                              className="w-full h-10 bg-white border border-[#3AB000] text-[#3AB000] hover:bg-[#3AB000] hover:text-white text-xs font-black uppercase tracking-widest rounded-none transition-all flex justify-center items-center"
                            >
                              <Eye size={14} className="mr-2" /> View Certificate
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-10 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white border border-dashed border-gray-300">
                        No certificates available in this category
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: CERTIFICATE CONFIG & AUTO-ASSIGN */}
          {activeTab === 'config' && (
            <div className="space-y-6 no-print">

              {/* SYSTEM OPERATING INSTRUCTIONS GUIDE BANNER */}
              <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-2 border-green-300 p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2.5 text-[#3F6212] font-black text-sm uppercase tracking-wide border-b-2 border-[#D9F99D] pb-3">
                  <Info size={20} className="text-[#3AB000]" />
                  <span>Automatic Certificate System — Operating Instructions & Workflow Guide</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white p-4 border border-[#D9F99D] shadow-sm space-y-2">
                    <div className="font-black text-[#3F6212] uppercase text-xs flex items-center gap-1.5">
                      <span>⚙️ 1. Purpose of Rules Config</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                      Enables administrators to toggle individual auto-assignment criteria ON/OFF and adjust the <strong>Minimum Cards Threshold</strong> required for performance certificates. Click <strong>Save Configuration</strong> to apply.
                    </p>
                  </div>

                  <div className="bg-white p-4 border border-[#D9F99D] shadow-sm space-y-2">
                    <div className="font-black text-[#3F6212] uppercase text-xs flex items-center gap-1.5">
                      <span>🤖 2. Automatic Monthly Cron</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                      Runs automatically on the <strong>1st of every month at 00:00 AM</strong>. Evaluates card creation stats for the preceding month and auto-generates certificates for eligible <strong>DM, BS, & PE</strong>.
                    </p>
                  </div>

                  <div className="bg-white p-4 border border-[#D9F99D] shadow-sm space-y-2">
                    <div className="font-black text-[#3F6212] uppercase text-xs flex items-center gap-1.5">
                      <span>▶️ 3. Past Month Manual Trigger</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                      Allows manual execution for past months (e.g. June 2026). Generates certificates instantly based on card creation stats for testing or historical records.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3.5 border border-[#D9F99D] text-xs text-gray-800 font-bold uppercase tracking-wide flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[#3AB000] font-black">👥 ROLE ELIGIBILITY:</span>
                    <span>Auto-Assignment applies ONLY to <strong className="text-gray-900">DM, BS, & PE</strong>.</span>
                  </div>
                  <div className="text-gray-600 font-semibold text-[11px]">
                    * <strong>RM & ZC</strong> certificates are assigned manually via the <strong>RM & ZC Assignment Portal</strong>.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Card 1: Configuration Parameters */}
                <div className="lg:col-span-2 bg-white border-2 border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-gray-200 pb-4 mb-6">
                    <Sliders className="text-[#3AB000]" size={22} />
                    <div>
                      <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Auto-Assignment Rules & Threshold Config</h2>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Configure monthly automatic certificate criteria</p>
                    </div>
                  </div>

                  {loadingConfig ? (
                    <div className="py-10 flex justify-center">
                      <Loader2 className="w-8 h-8 text-[#3AB000] animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-6">

                      {/* Rule 1 Toggle */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200">
                        <div>
                          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">1. Global Top Performer (Employee Excellence)</h4>
                          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Auto-assigns to highest card creator company-wide in month</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.globalExcellenceEnabled}
                            onChange={(e) => setConfig({ ...config, globalExcellenceEnabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3AB000]"></div>
                        </label>
                      </div>

                      {/* Rule 2 Toggle */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200">
                        <div>
                          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">2. State Wise Top Performer (Best State Performer)</h4>
                          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Auto-assigns to top card creator in each state per month</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.statePerformerEnabled}
                            onChange={(e) => setConfig({ ...config, statePerformerEnabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3AB000]"></div>
                        </label>
                      </div>

                      {/* Rule 3 Toggle */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200">
                        <div>
                          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">3. 100% Target Achieved (Outstanding Performance)</h4>
                          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Auto-assigns to employees achieving 100% of monthly card target</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.targetAchievedEnabled}
                            onChange={(e) => setConfig({ ...config, targetAchievedEnabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3AB000]"></div>
                        </label>
                      </div>

                      {/* Rule 4 Input & Toggle */}
                      <div className="p-4 bg-gray-50 border border-gray-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">4. Partial Target / Minimum Cards Threshold (Performance)</h4>
                            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Auto-assigns to employees creating at least min cards threshold</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={config.partialPerformanceEnabled}
                              onChange={(e) => setConfig({ ...config, partialPerformanceEnabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3AB000]"></div>
                          </label>
                        </div>

                        <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
                          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider shrink-0">
                            Minimum Cards Threshold:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={config.minCardsThresholdForPerformance}
                            onChange={(e) => setConfig({ ...config, minCardsThresholdForPerformance: e.target.value })}
                            className="w-32 px-3 py-1.5 border border-gray-300 focus:border-[#3AB000] focus:ring-0 text-sm font-bold rounded-none"
                          />
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cards / Month</span>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4">
                        <button
                          onClick={handleSaveConfig}
                          disabled={savingConfig}
                          className="flex items-center gap-2 px-6 py-2.5 bg-[#3AB000] hover:bg-[#2d8a00] text-white font-black text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm disabled:opacity-50"
                        >
                          {savingConfig ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          {savingConfig ? 'Saving Configuration...' : 'Save Configuration'}
                        </button>
                      </div>

                    </div>
                  )}
                </div>

                {/* Card 2: Manual Auto-Assign Trigger */}
                <div className="bg-white border-2 border-gray-200 p-6 shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 border-b border-gray-200 pb-4 mb-6">
                    <Play className="text-[#3AB000]" size={22} />
                    <div>
                      <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Past Month Manual Trigger</h2>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Run auto-assignment for past or specific months</p>
                    </div>
                  </div>

                  <div className="space-y-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Select Month</label>
                        <select
                          value={triggerMonth}
                          onChange={(e) => setTriggerMonth(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 text-xs font-bold uppercase rounded-none focus:border-[#3AB000]"
                        >
                          {monthNames.map((m, idx) => (
                            <option key={idx + 1} value={idx + 1}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Select Year</label>
                        <select
                          value={triggerYear}
                          onChange={(e) => setTriggerYear(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 text-xs font-bold uppercase rounded-none focus:border-[#3AB000]"
                        >
                          <option value="2026">2026</option>
                          <option value="2025">2025</option>
                          <option value="2024">2024</option>
                        </select>
                      </div>

                      <div className="bg-[#ECFCCB] border border-[#D9F99D] p-3 text-[10px] font-medium text-[#3F6212] uppercase tracking-wider leading-relaxed">
                        💡 <strong>Note:</strong> Future months will auto-run on the 1st of every month automatically via Cron. Use this trigger to process past months or re-run evaluation.
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <button
                        onClick={handleRunAutoAssign}
                        disabled={isTriggering}
                        className="w-full py-3 bg-[#3F6212] hover:bg-[#1A2E05] text-white font-black text-xs uppercase tracking-widest transition-colors rounded-none flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        {isTriggering ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                        {isTriggering ? 'Processing Auto-Assign...' : 'Run Auto-Assignment Now'}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: AUTO-ASSIGNED CERTIFICATES REPORT (NEW TAB) */}
          {activeTab === 'report' && (
            <div className="bg-white border-2 border-gray-200 p-6 shadow-sm no-print space-y-6">

              {/* Header & Filter Controls Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="text-[#3AB000]" size={24} />
                  <div>
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Auto-Assigned Certificates Report</h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">List of all automatically generated monthly certificates</p>
                  </div>
                </div>

                {/* Bulk Actions Button */}
                {selectedCertIds.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={isBulkDeleting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-none transition-colors flex items-center gap-2 shadow-sm shrink-0 disabled:opacity-50"
                  >
                    {isBulkDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Delete Selected ({selectedCertIds.length})
                  </button>
                )}
              </div>

              {/* Advanced Filter Inputs: Search, Designation, Month, Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 border border-gray-200">

                {/* Search Bar (Name, Mobile, Email) */}
                <div className="relative">
                  <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1">Search Employee</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search Name, Mobile, Email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-300 text-xs font-bold rounded-none focus:border-[#3AB000] focus:ring-0"
                    />
                    <Search className="absolute left-2.5 top-2 text-gray-400" size={14} />
                  </div>
                </div>

                {/* Designation Filter */}
                <div>
                  <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1">Filter Designation / Role</label>
                  <select
                    value={filterDesignation}
                    onChange={(e) => setFilterDesignation(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 text-xs font-bold uppercase rounded-none focus:border-[#3AB000]"
                  >
                    <option value="">All Designations / Roles</option>
                    {designationsList.map((d, idx) => (
                      <option key={idx} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Month Filter */}
                <div>
                  <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1">Filter Month</label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 text-xs font-bold uppercase rounded-none focus:border-[#3AB000]"
                  >
                    <option value="">All Months</option>
                    {monthNames.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Year Filter */}
                <div>
                  <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1">Filter Year</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 text-xs font-bold uppercase rounded-none focus:border-[#3AB000]"
                  >
                    <option value="">All Years</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>

              {/* Table Data Section */}
              {loadingHistory ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="w-8 h-8 text-[#3AB000] animate-spin" />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200 text-[10px] font-black uppercase tracking-wider text-gray-700">
                          <th className="p-3 w-10 text-center border-r border-gray-200">
                            <input
                              type="checkbox"
                              checked={paginatedHistory.length > 0 && paginatedHistory.every(item => selectedCertIds.includes(item._id))}
                              onChange={handleSelectAllCurrentPage}
                              className="w-4 h-4 rounded-none accent-[#3AB000] cursor-pointer"
                            />
                          </th>
                          <th className="p-3 border-r border-gray-200">Employee Details</th>
                          <th className="p-3 border-r border-gray-200">State / Region</th>
                          <th className="p-3 border-r border-gray-200">Certificate Title</th>
                          <th className="p-3 border-r border-gray-200">Category & Reason</th>
                          <th className="p-3 border-r border-gray-200">Month / Year</th>
                          <th className="p-3 border-r border-gray-200 text-center">Cards Issued</th>
                          <th className="p-3 border-r border-gray-200 text-center">Target %</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-xs font-medium">
                        {paginatedHistory.length > 0 ? (
                          paginatedHistory.map((item) => {
                            const emp = item.employeeId || {};
                            const user = emp.userId || {};
                            const certTemplate = allCertificates.find(c => c.templateId === item.templateId);
                            const isSelected = selectedCertIds.includes(item._id);

                            const name = emp.name || user.name || 'N/A';
                            const role = emp.role || emp.designation || 'Staff';
                            const mobile = user.phone || user.mobile || emp.phone || emp.mobile || emp.mobileNumber || '';
                            const email = user.email || emp.email || '';

                            return (
                              <tr key={item._id} className={`transition-colors ${isSelected ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                                <td className="p-3 text-center border-r border-gray-200">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelectOne(item._id)}
                                    className="w-4 h-4 rounded-none accent-[#3AB000] cursor-pointer"
                                  />
                                </td>
                                <td className="p-3 border-r border-gray-200">
                                  <div className="font-black text-gray-900 uppercase">{name}</div>
                                  <div className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">{role}</div>
                                  {mobile && (
                                    <div className="text-[10px] font-bold text-gray-700">
                                      📞 {mobile}
                                    </div>
                                  )}
                                  {email && (
                                    <div className="text-[10px] text-gray-500 font-medium">
                                      ✉️ {email}
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 border-r border-gray-200 font-bold uppercase text-gray-700">
                                  {item.state || emp.workingState || emp.state || 'N/A'}
                                </td>
                                <td className="p-3 border-r border-gray-200">
                                  <div className="font-bold text-gray-800 uppercase">{certTemplate ? certTemplate.title : item.templateId}</div>
                                </td>
                                <td className="p-3 border-r border-gray-200">
                                  {getAssignmentBadge(item.assignmentType)}
                                </td>
                                <td className="p-3 border-r border-gray-200 font-bold text-gray-800 uppercase">
                                  {monthNames[item.month - 1] || item.month} {item.year}
                                </td>
                                <td className="p-3 border-r border-gray-200 text-center font-black text-[#3AB000]">
                                  {item.cardsCount || 0} Cards
                                </td>
                                <td className="p-3 border-r border-gray-200 text-center font-black text-gray-800">
                                  {item.achievementPercentage || 0}%
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleView(item.templateId, {
                                        employeeData: {
                                          ...emp,
                                          cardsCount: item.cardsCount,
                                          targetCount: item.targetCount,
                                          achievementPercentage: item.achievementPercentage,
                                          state: item.state || emp.workingState || emp.state
                                        },
                                        issueDate: item.issueDate,
                                        certId: item._id
                                      })}
                                      className="px-2.5 py-1 bg-white border border-[#3AB000] text-[#3AB000] hover:bg-[#3AB000] hover:text-white font-black text-[10px] uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                                    >
                                      <Eye size={12} /> View
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCertificate(item._id)}
                                      className="px-2.5 py-1 bg-white border border-red-300 text-red-600 hover:bg-red-600 hover:text-white font-black text-[10px] uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                                    >
                                      <Trash2 size={12} /> Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="9" className="py-10 text-center text-xs font-black uppercase tracking-widest text-gray-400 bg-gray-50">
                              No auto-assigned certificates found for selected filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">

                    <div className="flex items-center gap-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <span>
                        Showing {filteredHistory.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredHistory.length)} of {filteredHistory.length} Certificates
                      </span>

                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-gray-500 font-bold">Items per page:</label>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="px-2 py-1 border border-gray-300 text-xs font-bold rounded-none focus:border-[#3AB000]"
                        >
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                        </select>
                      </div>
                    </div>

                    {/* Pagination Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:text-[#3AB000] text-xs font-black uppercase tracking-wider disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-700 rounded-none flex items-center gap-1 mr-1"
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>

                      {getPageNumbers().map((pageNum, idx) => (
                        pageNum === '...' ? (
                          <span key={`dots-${idx}`} className="px-2 py-1 text-xs font-bold text-gray-400 select-none">...</span>
                        ) : (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1.5 text-xs font-black transition-colors rounded-none border ${currentPage === pageNum ? 'bg-[#3AB000] text-white border-[#2d8a00] shadow-sm' : 'bg-white text-gray-700 hover:bg-green-50 hover:text-[#3AB000] border-gray-300'}`}
                          >
                            {pageNum}
                          </button>
                        )
                      ))}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:text-[#3AB000] text-xs font-black uppercase tracking-wider disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-700 rounded-none flex items-center gap-1 ml-1"
                      >
                        Next <ChevronRightIcon size={14} />
                      </button>
                    </div>

                  </div>
                </>
              )}

            </div>
          )}

          {/* Certificate Modal & Print Area */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center p-4 print:p-0 print:bg-white print:items-start">
              <div className="bg-white rounded-none shadow-xl max-w-[1250px] w-full relative flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:w-auto">

                {/* Modal Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gray-50 no-print shrink-0">
                  <div className="flex items-center gap-3">
                    <FileBadge className="text-[#3AB000]" size={20} />
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">
                      {allCertificates.find(c => c.templateId === selectedCert)?.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold text-white bg-[#3F6212] hover:bg-[#1A2E05] rounded-none transition-colors disabled:opacity-50"
                    >
                      {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      {isDownloading ? 'Generating...' : 'Download PDF'}
                    </button>
                    <button
                      onClick={() => !isDownloading && setIsModalOpen(false)}
                      className="p-1.5 text-gray-400 hover:text-red-500 bg-white border border-gray-200 hover:border-red-500 rounded-none transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Certificate Container */}
                <div className="flex justify-center overflow-auto bg-gray-200 p-8 print:p-0 print:bg-white flex-1">
                  <div ref={certRef} className="print-area bg-[#fdfdfa] shadow-xl print:shadow-none w-[1123px] h-[794px] p-[72px] relative text-gray-900 shrink-0 print:p-0 flex flex-col" style={{ fontFamily: '"Georgia", "Times New Roman", serif', boxSizing: 'border-box' }}>

                    {/* Outer Thick Border */}
                    <div className="absolute inset-0 border-[16px] border-[#3F6212] pointer-events-none z-30"></div>

                    {/* Inner Decorative Border */}
                    <div className="absolute inset-[28px] border-[3px] border-[#3F6212] pointer-events-none z-20 opacity-80"></div>

                    {/* Watermark Logo */}
                    <div className="absolute inset-0 m-auto flex items-center justify-center pointer-events-none z-0 opacity-[0.06] overflow-hidden">
                      <img src={watermarkLogo} alt="Watermark" className="w-[550px] h-auto object-contain" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                      {/* Logo at the top */}
                      <div className="flex justify-center mb-4 -mt-6">
                        <img src={jssaLogo} alt="JSSA Logo" className="h-20 object-contain" />
                      </div>

                      <CertificateViewer
                        templateId={selectedCert}
                        mode={certModalData ? "live" : "preview"}
                        employeeData={certModalData?.employeeData || {}}
                        issueDate={certModalData?.issueDate || new Date()}
                        certId={certModalData?.certId || 'XXXXXX'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Styles for printing */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 1150px !important;
            min-height: 720px !important;
            padding: 0;
            margin: 0;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            transform: scale(0.92);
            transform-origin: top left;
          }
        }
      `}} />
    </DashboardLayout>
  );
};

export default AdminCertificateManagement;
