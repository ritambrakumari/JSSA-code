import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { employeesAPI, locationAPI } from "../../utils/api";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  ShieldCheck,
  CreditCard,
  Building2,
  ChevronLeft,
  Loader2,
  Users,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Wallet,
  ArrowDownCircle,
  Award,
  Star,
  FileText,
  ChevronRight,
  Target,
  Clock,
  ExternalLink,
  BookOpen,
  Map,
  BadgeCheck,
  Activity,
  Heart,
  Languages,
  AlertCircle,
  IndianRupee,
  Calendar,
  Lock
} from "lucide-react";
import { toast } from "react-hot-toast";
import statesData from "../../data/states.json";
import districtsData from "../../data/district.json";

const GREEN = "#3AB000";

const AdminEmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const now = new Date(); // Added this
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [newDesignation, setNewDesignation] = useState("");
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [occupiedZones, setOccupiedZones] = useState([]);

  const [showCorrection, setShowCorrection] = useState(false);
  const [correctedDesignation, setCorrectedDesignation] = useState("");
  const [correcting, setCorrecting] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const reportRef = useRef(null);

  const designations = [
    { name: "Regional Manager ( RM )", role: "RM" },
    { name: "Zonal Coordinator", role: "ZC" }
  ];

  const correctionDesignations = [
    { name: "District Manager", role: "DM" },
    { name: "Block Supervisor", role: "BS" },
    { name: "Panchayat Executive", role: "PE" },
    { name: "Block Supervisor cum Panchayat Executive", role: "BS" }
  ];

  const fetchStates = async () => {
    const staticStates = statesData;
    try {
      const res = await locationAPI.getStates();
      const customStates = res.data ? res.data.map(s => s.name).filter(Boolean) : [];
      const combined = [...new Set([...staticStates, ...customStates])].filter(Boolean);
      setStates(combined.sort((a, b) => a.localeCompare(b)));
    } catch (e) {
      console.error("Fetch States Error:", e);
      setStates(staticStates);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  const handleStateChange = async (state) => {
    setSelectedState(state);
    const staticList = districtsData[state] || [];
    setDistricts(staticList);

    if (state) {
      try {
        const cleanState = state.split(" / ")[0].trim();
        const res = await locationAPI.getCustomDistricts(cleanState);
        const customList = res.data ? res.data.map(d => d.name).filter(Boolean) : [];
        
        const combined = [...new Set([...staticList, ...customList])].filter(Boolean);
        setDistricts(combined.sort((a, b) => a.localeCompare(b)));
      } catch (error) {
        console.error("Fetch custom districts error:", error);
      }
    }
  };

  useEffect(() => {
    const fetchOccupied = async () => {
      const selected = designations.find(d => d.name === newDesignation);
      if (!selected) {
        setOccupiedZones([]);
        return;
      }

      try {
        const params = { role: selected.role };
        if (selected.role === 'ZC' && selectedState) {
          params.state = selectedState;
        }
        const res = await employeesAPI.getOccupiedZones(params);
        if (res.success) {
          setOccupiedZones(res.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch occupied zones:", err);
      }
    };

    fetchOccupied();
  }, [newDesignation, selectedState]);

  const handleUpdate = async () => {
    const selected = designations.find(d => d.name === newDesignation);
    if (!selected) return;

    try {
      setUpdating(true);
      const res = await employeesAPI.update(id, {
        designation: selected.name,
        role: selected.role,
        workingState: selectedState,
        workingDistrict: selectedDistricts.join(", ")
      });
      if (res.success) {
        toast.success("Job Post Updated successfully");
        setShowEdit(false);
        fetchDetails();
      } else {
        toast.error(res.error || "Update failed");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setUpdating(false);
    }
  };

  const handleCorrection = async () => {
    const selected = correctionDesignations.find(d => d.name === correctedDesignation);
    if (!selected) return;

    try {
      setCorrecting(true);
      const res = await employeesAPI.update(id, {
        designation: selected.name,
        role: selected.role
      });
      if (res.success) {
        toast.success("Designation corrected successfully");
        setShowCorrection(false);
        fetchDetails();
      } else {
        toast.error(res.error || "Correction failed");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setCorrecting(false);
    }
  };

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await employeesAPI.getDetails(id);
      if (res.success) {
        setEmployee(res.data);
      } else {
        toast.error(res.error || "Failed to fetch employee details");
        navigate("/admin/employee-list");
      }
    } catch (error) {
      console.error("Fetch Details Error:", error);
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    try {
      setExportingPDF(true);
      const element = reportRef.current;

      // We will capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1280, // Set a standard width to prevent extreme scaling on ultrawide monitors
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const pdfWidth = pageWidth - (margin * 2);
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = margin + 15; // Start lower on the first page to fit the header

      // --- Professional Header ---
      pdf.setFillColor(58, 176, 0); // #3AB000
      pdf.rect(0, 0, pageWidth, 15, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.text("OFFICIAL EMPLOYEE DOSSIER", margin, 10);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US')}`, pageWidth - margin - 50, 10);
      // ----------------------------

      // Add the first page
      pdf.addImage(imgData, "PNG", margin, position, pdfWidth, pdfHeight);
      heightLeft -= (pageHeight - position);

      // Add subsequent pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();

        // Add Header to subsequent pages
        pdf.setFillColor(58, 176, 0);
        pdf.rect(0, 0, pageWidth, 10, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text(`Employee ID: ${employee.userId?._id?.toString().slice(-6).toUpperCase() || 'NEW'} - Page ${pdf.getCurrentPageInfo().pageNumber}`, margin, 7);

        // Position for image on new page
        // The image is shifted up by the amount we already printed
        // So the Y coordinate is negative
        const shiftY = -(pdfHeight - heightLeft) + margin + 10;

        pdf.addImage(imgData, "PNG", margin, shiftY, pdfWidth, pdfHeight);
        heightLeft -= (pageHeight - (margin + 10));
      }

      pdf.save(`Dossier_${employee.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
      toast.success("Professional Report Downloaded!");
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setExportingPDF(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <Loader2 size={48} className="animate-spin text-[#3AB000]" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Decrypting Employee Profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) return null;

  const DetailItem = ({ label, value, icon: Icon, fullWidth = false }) => (
    <div className={`p-4 bg-gray-50/50 border border-gray-100 ${fullWidth ? 'col-span-full' : ''}`}>
      <div className="flex items-center gap-2 mb-1.5 text-gray-400">
        {Icon && <Icon size={12} />}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-[11px] font-bold text-gray-900 uppercase break-words">{value || 'Not Specified'}</p>
    </div>
  );

  const FinancialCard = ({ title, amount, icon: Icon, colorClass = "text-[#3AB000]", bgClass = "bg-[#3AB000]/5" }) => (
    <div className="bg-white border border-gray-200 p-5 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 ${bgClass} -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-125 opacity-50`}></div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 ${bgClass} ${colorClass} shrink-0`}>
            <Icon size={18} />
          </div>
          <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-tight">{title}</h3>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-[12px] font-black ${colorClass}`}>₹</span>
          <span className="text-2xl font-black text-gray-900 tracking-tighter">
            {Number(amount).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        {/* Top Navbar */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/admin/employee-list")}
            className="flex items-center gap-2 text-gray-400 hover:text-[#3AB000] transition-all font-black text-[10px] uppercase tracking-widest group"
          >
            <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Back to Registry
          </button>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 border-r border-gray-200 pr-6">
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-900 uppercase leading-none">{employee.name}</p>
                <p className="text-[9px] font-bold text-[#3AB000] uppercase tracking-tighter mt-1">{employee.designation}</p>
              </div>
              <div className="w-10 h-10 bg-[#3AB000] text-white flex items-center justify-center font-black text-sm">
                {employee.name.charAt(0)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToPDF}
                disabled={exportingPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3AB000] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#2d8a00] transition-colors disabled:opacity-50"
              >
                {exportingPDF ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                {exportingPDF ? "Exporting..." : "Export PDF"}
              </button>
              <span className={`text-[9px] font-black px-2.5 py-1 uppercase tracking-widest border ${employee.status === 'Active'
                ? 'bg-[#3AB000] text-white border-[#3AB000]'
                : 'bg-orange-500 text-white border-orange-500'
                }`}>
                {employee.status}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-[1600px] mx-auto" ref={reportRef}>
          {/* Header Profile */}
          <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] text-white mb-8 overflow-hidden relative shadow-lg shadow-[#3AB000]/10">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -mr-64 -mt-64 blur-3xl"></div>
            <div className="p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-8">
                <div className="w-32 h-32 bg-white/10 border-2 border-white/30 flex items-center justify-center text-white relative group overflow-hidden shadow-2xl">
                  {employee.application?.photo ? (
                    <img
                      src={employee.application.photo}
                      alt={employee.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <span className="text-4xl font-black uppercase tracking-tighter">
                      {employee.name ? employee.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '??'}
                    </span>
                  )}
                  <div className="absolute bottom-0 right-0 bg-[#3AB000] p-1.5 z-20 border-2 border-white shadow-lg rounded-full transform translate-x-1/4 translate-y-1/4">
                    <BadgeCheck size={14} className="text-white" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h1 className="text-5xl font-black tracking-tight uppercase leading-none mb-2">
                      {employee.name}
                    </h1>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">
                        {employee.designation}
                      </span>
                      <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                      <span className="text-[11px] font-black text-white/80 uppercase tracking-[0.3em]">
                        ID: {employee.userId?._id?.toString().slice(-6).toUpperCase() || 'NEW'}
                      </span>
                    </div>
                  </div>

                    <div className="flex flex-wrap gap-6 pt-2">
                      <div className="flex items-center gap-2.5 text-white">
                        <Phone size={14} className="text-white/70" />
                        <span className="text-xs font-bold tracking-tight">{employee.userId?.phone || employee.mobile || employee.application?.mobile || employee.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-white">
                        <Mail size={14} className="text-white/70" />
                        <span className="text-xs font-bold tracking-tight lowercase">{employee.userId?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-white">
                        <MapPin size={14} className="text-white/70" />
                        <span className="text-xs font-bold tracking-tight uppercase">{employee.workingDistrict || 'N/A'}, {employee.workingState || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-white bg-black/20 px-3 py-1 rounded-full border border-white/10 shadow-inner">
                        <Calendar size={14} className="text-white/90" />
                        <span className="text-xs font-black tracking-widest uppercase text-white/90">MOU: {employee.application?.mouPaidAt ? new Date(employee.application.mouPaidAt).toLocaleDateString('en-GB') : (employee.createdAt ? new Date(employee.createdAt).toLocaleDateString('en-GB') : 'N/A')}</span>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* New Stats Row Below Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 max-w-[1600px] mx-auto px-0">
            <div className="bg-white border-b-4 border-[#3AB000] p-6 flex items-center justify-between shadow-sm group hover:-translate-y-1 transition-all">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-tight">Lifetime Cards Issued</p>
                <p className="text-3xl font-black text-gray-900 tracking-tighter">{employee.stats?.cardCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 flex items-center justify-center text-[#3AB000] group-hover:bg-[#3AB000] group-hover:text-white transition-colors">
                <Layers size={24} />
              </div>
            </div>

            <div className="bg-white border-b-4 border-yellow-500 p-6 flex items-center justify-between shadow-sm group hover:-translate-y-1 transition-all">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-tight">Average Performance</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-black text-gray-900 tracking-tighter">{(employee.rating?.averageRating || 0).toFixed(1)}</p>
                  <Star size={20} className="text-yellow-500 fill-yellow-500" />
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-50 flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                <Award size={24} />
              </div>
            </div>

            <div className="bg-white border-b-4 border-blue-500 p-6 flex items-center justify-between shadow-sm group hover:-translate-y-1 transition-all">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-tight">Wallet Liquidity</p>
                <p className="text-3xl font-black text-gray-900 tracking-tighter text-blue-600">₹{Number(employee.walletBalance || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Wallet size={24} />
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

            {/* Left Column - Financials & Performance */}
            <div className="xl:col-span-8 space-y-8">

              {/* Financial Dashboard */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <TrendingUp size={14} className="text-[#3AB000]" />
                    Financial Intelligence Ledger
                  </h3>
                  <button className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest hover:underline flex items-center gap-1">
                    View Full History <ArrowUpRight size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FinancialCard title="Total Gross Earnings" amount={employee.financials?.totalEarnings || 0} icon={IndianRupee} />
                  <FinancialCard title="Total Payouts/Withdraws" amount={employee.financials?.totalWithdrawals || 0} icon={ArrowDownCircle} colorClass="text-red-500" bgClass="bg-red-50" />
                  <FinancialCard title="Current Wallet Balance" amount={employee.financials?.walletBalance || 0} icon={Wallet} />
                  <FinancialCard title="Salary Payout Balance" amount={employee.financials?.salaryBalance || 0} icon={Award} colorClass="text-blue-500" bgClass="bg-blue-50" />
                </div>
              </div>

              {/* Performance Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Targets vs Achievement */}
                <div className="bg-white border border-gray-200 p-8 flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em]">Target Tracking</h3>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Monthly Card Issuance Goal</p>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-100">
                      <Target size={20} className="text-[#3AB000]" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-8">
                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <p className="text-4xl font-black text-gray-900 tracking-tighter">
                          {employee.targets?.achieved || 0} / {employee.targets?.monthly || 0}
                        </p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cards Issued This Month</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-[#3AB000] tracking-tighter">{employee.targets?.percentage || 0}%</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Efficiency</p>
                      </div>
                    </div>

                    <div className="h-4 bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-[#3AB000] transition-all duration-1000 ease-out relative"
                        style={{ width: `${employee.targets?.percentage || 0}%` }}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-shimmer"></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                        <p className={`text-[11px] font-black uppercase ${employee.targets?.percentage >= 100 ? 'text-[#3AB000]' : 'text-orange-500'}`}>
                          {employee.targets?.percentage >= 100 ? 'Target Achieved' : 'In Progress'}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Days Remaining</p>
                        <p className="text-[11px] font-black text-gray-900 uppercase">
                          {new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()} Days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reviews & Satisfaction */}
                <div className="bg-white border border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em]">Service Feedback</h3>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Reviewer Satisfaction Index</p>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-100">
                      <Award size={20} className="text-[#3AB000]" />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center gap-6">
                      <div className="text-6xl font-black text-gray-900 tracking-tighter">
                        {(employee.rating?.averageRating || 0).toFixed(1)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={18}
                              className={s <= Math.round(employee.rating?.averageRating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-200"}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Based on {employee.rating?.totalReviews || 0} Administrative Reviews
                        </p>
                      </div>
                    </div>

                    <div className="p-5 bg-green-50 border-l-4 border-[#3AB000] space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest">Performance Assessment</p>
                        <span className="px-2 py-0.5 bg-[#3AB000] text-white text-[9px] font-black uppercase tracking-widest">
                          {employee.rating?.averageRating >= 4 ? 'EXCELLENT' : employee.rating?.averageRating >= 3 ? 'GOOD' : 'AVERAGE'}
                        </span>
                      </div>
                      <p className="text-xs font-bold leading-relaxed italic text-gray-600">
                        "Employee maintains professional standards and operational integrity within their assigned jurisdiction."
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── PHASE 1: INITIAL REGISTRATION DATA ── */}
              <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] px-8 py-5 flex items-center justify-between">
                  <h3 className="text-[14px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <FileText size={20} />
                    Section A: Application Form Details (Step 1)
                  </h3>
                  <span className="text-[10px] font-black text-white/70 uppercase tracking-widest bg-white/10 px-2 py-1 rounded">
                    {employee.application ? `App ID: ${employee.application.applicationNumber}` : 'MANUAL ENTRY / NO APPLICATION'}
                  </span>
                </div>

                {/* Application Personal Info */}
                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
                  <DetailItem label="Candidate Name" value={employee.application?.candidateName || employee.name} icon={User} />
                  <DetailItem label="Father's Name" value={employee.application?.fatherName || employee.fatherName} icon={Users} />
                  <DetailItem label="Date of Birth" value={employee.application?.dob || employee.dob ? new Date(employee.application?.dob || employee.dob).toLocaleDateString('en-GB') : 'N/A'} icon={Calendar} />
                  <DetailItem label="Gender" value={employee.application?.gender || employee.gender || 'Not Specified'} />

                  <DetailItem label="Category" value={employee.application?.category || employee.category || 'Not Specified'} icon={Award} />
                  <DetailItem label="Nationality" value={employee.application?.nationality || employee.nationality || 'Indian'} />
                  <DetailItem label="Aadhar Number" value={employee.application?.aadhar || employee.aadharNumber} icon={ShieldCheck} />
                  <DetailItem label="PAN Number" value={employee.application?.pan || employee.panNumber} icon={CreditCard} />

                  <DetailItem label="Email Address" value={employee.application?.email} icon={Mail} />
                  <DetailItem label="Mobile Number" value={employee.application?.mobile || employee.userId?.phone || employee.mobile || 'N/A'} icon={Phone} />
                  <DetailItem label="Higher Education" value={employee.application?.higherEducation} icon={BookOpen} />
                  <DetailItem label="Percentage" value={employee.application?.markPercentage ? `${employee.application.markPercentage}%` : 'N/A'} />
                  <DetailItem label="Joined / MOU Date" value={employee.application?.mouPaidAt ? new Date(employee.application.mouPaidAt).toLocaleString('en-GB') : (employee.createdAt ? new Date(employee.createdAt).toLocaleString('en-GB') : 'N/A')} icon={Calendar} />
                </div>

                {/* Application Initial Address */}
                <div className="bg-gray-50 border-y border-gray-200 px-8 py-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} className="text-[#3AB000]" /> Initial Application Address
                  </p>
                </div>
                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
                  <DetailItem label="Full Address" value={employee.application?.address || `${employee.villageTola || ''}, ${employee.gramPanchayat || ''}, ${employee.district || ''}, ${employee.state || ''}`} fullWidth />
                  <DetailItem label="Panchayat" value={employee.application?.panchayat || employee.gramPanchayat} />
                  <DetailItem label="Block" value={employee.application?.block || employee.blockKhand} />
                  <DetailItem label="District" value={employee.application?.district || employee.district} />
                  <DetailItem label="State" value={employee.application?.state || employee.state} />
                </div>

                {/* Application Documents */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initial Documents</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Candidate Photo', url: employee.application?.photo },
                        { label: 'Signature', url: employee.application?.signature }
                      ].map((doc, idx) => (
                        <a key={idx} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white border border-gray-200 hover:border-[#3AB000] hover:bg-[#3AB000]/5 transition-all group">
                          <span className="text-[9px] font-black text-gray-500 group-hover:text-[#3AB000] uppercase tracking-tighter">{doc.label}</span>
                          <ExternalLink size={12} className="text-gray-300 group-hover:text-[#3AB000]" />
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="p-5 bg-green-50 border-l-4 border-[#3AB000] flex flex-col justify-center">
                    <p className="text-[9px] font-black text-[#3AB000]/60 uppercase tracking-widest mb-2">Application Fee Status</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-black text-gray-900 uppercase tracking-tighter">{employee.application?.paymentStatus || 'Pending'}</p>
                      <p className="text-xl font-black text-[#3AB000]">₹{employee.application?.amount || 0}</p>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 mt-2">ID: {employee.application?.paymentId || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* ── PHASE 2: EMPLOYMENT MOU AGREEMENT ── */}
              <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-5 flex items-center justify-between">
                  <h3 className="text-[14px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <ShieldCheck size={20} />
                    Section B: MOU Agreement & Onboarding Data (Step 2)
                  </h3>
                  <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-white/20 bg-white/10 text-white rounded`}>
                    {employee.application ? `MOU Status: ${employee.application.mouStatus}` : `ONBOARDING: ${employee.onboardingComplete ? 'COMPLETE' : 'IN PROGRESS'}`}
                  </span>
                </div>

                {/* MOU Personal History */}
                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
                  <DetailItem label="Mother's Name" value={employee.motherName} icon={Users} />
                  <DetailItem label="Marital Status" value={employee.maritalStatus} icon={Heart} />
                  <DetailItem label="Disability" value={employee.handicapDisability} icon={AlertCircle} />
                  <DetailItem label="Blood Group" value={employee.bloodGroup} icon={Activity} />

                  <DetailItem label="Language" value={employee.language} icon={Languages} />
                  <DetailItem label="Country" value={employee.country} />
                  <DetailItem label="Nationality" value={employee.nationality} />
                  <DetailItem label="MOU Finalized" value={employee.application?.mouPaidAt ? new Date(employee.application.mouPaidAt).toLocaleDateString('en-GB') : (employee.createdAt ? new Date(employee.createdAt).toLocaleDateString('en-GB') : 'N/A')} icon={Calendar} />
                </div>

                {/* MOU Address Details */}
                <div className="bg-gray-50 border-b border-gray-200 px-8 py-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} className="text-[#3AB000]" /> Operational / Detailed Residential Address (MOU)
                  </p>
                </div>
                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
                  <DetailItem label="At / Village / Tola" value={employee.villageTola} />
                  <DetailItem label="Ward No" value={employee.wardNo} />
                  <DetailItem label="Gram Panchayat" value={employee.gramPanchayat} />
                  <DetailItem label="Block / Khand" value={employee.blockKhand} />

                  <DetailItem label="Post Office" value={employee.post} />
                  <DetailItem label="Police Station" value={employee.policeStation} />
                  <DetailItem label="District" value={employee.district} />
                  <DetailItem label="State" value={employee.state} />
                  <DetailItem label="Pincode" value={employee.pincode} fullWidth />
                </div>

                {/* MOU Educational Pedigree */}
                <div className="bg-gray-50 border-b border-gray-200 px-8 py-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <BookOpen size={14} className="text-[#3AB000]" /> Detailed Education History (MOU)
                  </p>
                </div>
                <div className="p-0 overflow-x-auto border-b border-gray-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Level</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Board / University</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Year</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Percentage</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {employee.educationDetails && employee.educationDetails.length > 0 ? (
                        employee.educationDetails.map((edu, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-8 py-4 text-xs font-bold text-gray-900 uppercase">{edu.level}</td>
                            <td className="px-8 py-4 text-xs font-medium text-gray-600">{edu.board}</td>
                            <td className="px-8 py-4 text-xs font-medium text-gray-600">{edu.year}</td>
                            <td className="px-8 py-4 text-xs font-bold text-[#3AB000]">{edu.percentage}%</td>
                            <td className="px-8 py-4">
                              {edu.file ? (
                                <a href={edu.file} target="_blank" rel="noreferrer" className="text-[10px] font-black text-[#3AB000] uppercase hover:underline flex items-center gap-1">
                                  View Doc <ExternalLink size={10} />
                                </a>
                              ) : <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">No Doc</span>}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-8 py-6 text-center text-xs font-bold text-gray-400 uppercase tracking-widest italic">
                            No detailed education records found in MOU.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* MOU Bank & Nominee History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-gray-100 border-b border-gray-100">
                  <div className="bg-white p-8">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <CreditCard size={14} className="text-[#3AB000]" /> Bank Settlement Details (MOU)
                    </p>
                    <div className="space-y-4">
                      <DetailItem label="Account Holder" value={employee.accountHolderName} />
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Bank Name" value={employee.bankName} />
                        <DetailItem label="IFSC Code" value={employee.ifscCode} />
                      </div>
                      <div className="p-4 bg-[#3AB000]/10 border border-[#3AB000]/20 rounded">
                        <p className="text-[9px] font-black text-[#3AB000] uppercase mb-1">Account Number</p>
                        <p className="text-lg font-black tracking-tighter text-gray-900">{employee.accountNumber || '•••• •••• ••••'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-8 border-l border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Users size={14} className="text-[#3AB000]" /> Nominee / Next of Kin (MOU)
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Nominee Name</p>
                          <p className="text-sm font-black text-gray-900 uppercase">{employee.nomineeName || 'N/A'}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-[#3AB000] text-white text-[9px] font-black uppercase">{employee.nomineeRelation || 'N/A'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Nominee Age" value={employee.nomineeAge ? `${employee.nomineeAge} Years` : 'N/A'} />
                        <DetailItem label="Nominee Mobile" value={employee.nomineeMobile} />
                      </div>
                      <DetailItem label="Nominee Aadhar" value={employee.nomineeAadhar} />
                    </div>
                  </div>
                </div>

                {/* MOU Documents & Security Deposit */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MOU Verification Documents</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Aadhar Front', url: employee.aadharFront || employee.application?.aadharFront },
                        { label: 'Aadhar Back', url: employee.aadharBack || employee.application?.aadharBack },
                        { label: 'PAN Card', url: employee.panCard || employee.application?.panCard },
                        { label: 'Bank Doc', url: employee.bankDoc || employee.application?.bankDoc }
                      ].map((doc, idx) => (
                        <a key={idx} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white border border-gray-200 hover:border-[#3AB000] hover:bg-[#3AB000]/5 transition-all group">
                          <span className="text-[9px] font-black text-gray-500 group-hover:text-[#3AB000] uppercase tracking-tighter">{doc.label}</span>
                          <ExternalLink size={12} className="text-gray-300 group-hover:text-[#3AB000]" />
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="p-5 bg-[#3AB000] text-white flex flex-col justify-center shadow-lg shadow-[#3AB000]/20">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">{employee.application ? 'Security Deposit (MOU Fee)' : 'Onboarding Settlement'}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-black uppercase tracking-tighter">₹{employee.application?.mouAmount || 0}</p>
                      <div className="px-2 py-1 bg-white text-[#3AB000] text-[10px] font-black uppercase">{employee.application?.mouStatus || (employee.onboardingComplete ? 'PAID' : 'PENDING')}</div>
                    </div>
                    <p className="text-[10px] font-bold text-white/60 mt-2">Ref: {employee.application?.mouPaymentId || 'INTERNAL'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Management & Tools */}
            <div className="xl:col-span-4 space-y-8">

              {/* Job Management Section */}
              <div className="bg-white border border-gray-200 p-8 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-[#3AB000]"></div>
                  <div>
                    <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.2em]">Operational Deployment</h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Jurisdictional Control Panel</p>
                  </div>
                </div>

                {!showEdit ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Briefcase size={10} className="text-[#3AB000]" /> Designation
                        </p>
                        <p className="text-sm font-black text-gray-900 uppercase">{employee.designation || 'Not Assigned'}</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <MapPin size={10} className="text-[#3AB000]" /> Territory
                        </p>
                        <p className="text-sm font-black text-gray-900 uppercase">{employee.workingDistrict || 'No District Assigned'}</p>
                      </div>
                    </div>

                    <div className="p-5 bg-gray-50 border border-gray-100 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Subordinate Units</p>
                        <span className="text-[10px] font-black text-gray-900">{employee.stats?.panchayatsCount || 0} Total</span>
                      </div>
                      <div className="h-2 bg-gray-200">
                        <div className="h-full bg-[#3AB000] w-2/3"></div>
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 italic">Managing operational logistics for assigned blocks.</p>
                    </div>

                    <button
                      onClick={() => {
                        setNewDesignation(employee.designation || "");
                        setSelectedState(employee.workingState || "");
                        setSelectedDistricts(employee.workingDistrict ? employee.workingDistrict.split(", ") : []);
                        setShowEdit(true);
                        if (employee.workingState) handleStateChange(employee.workingState);
                      }}
                      className="w-full py-4 bg-[#3AB000] text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-[#3AB000]/20 hover:-translate-y-1 active:translate-y-0 transition-all"
                    >
                      Promote / Edit Job Role
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select Target Post</label>
                      <select
                        className="w-full bg-gray-50 border border-gray-200 text-[11px] font-bold p-4 rounded-none focus:border-[#3AB000] outline-none"
                        value={newDesignation}
                        onChange={(e) => setNewDesignation(e.target.value)}
                      >
                        <option value="">Choose Post</option>
                        {designations.map(d => (
                          <option key={d.role} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">State Jurisdiction</label>
                      <select
                        className="w-full bg-gray-50 border border-gray-200 text-[11px] font-bold p-4 rounded-none focus:border-[#3AB000] outline-none"
                        value={selectedState}
                        onChange={(e) => handleStateChange(e.target.value)}
                      >
                        <option value="">Choose State</option>
                        {states.map(s => {
                          if (!s) return null;
                          const cleanS = s.split('/')[0].trim().toUpperCase();
                          const isOccupied = newDesignation.includes("Regional") && 
                                             occupiedZones.some(oz => oz.split('/')[0].trim().toUpperCase() === cleanS) && 
                                             !(employee.workingState && employee.workingState.toUpperCase().includes(cleanS));
                          return (
                            <option
                              key={s}
                              value={s}
                              disabled={isOccupied}
                              title={isOccupied ? "State already assigned to another RM" : ""}
                              className={isOccupied ? "text-red-400 font-bold bg-red-50/50" : ""}
                            >
                              {s} {isOccupied ? " 🔒 (Assigned)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {newDesignation.includes("Zonal") && selectedState && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Operational Districts</label>
                          <span className="text-[9px] font-black text-[#3AB000]">{selectedDistricts.length} Selected</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-gray-50 p-3 border border-gray-100 custom-scrollbar">
                          {districts.map(d => {
                            if (!d) return null;
                            const cleanD = d.split('/')[0].trim().toUpperCase();
                            const isOccupied = occupiedZones.some(oz => oz.split('/')[0].trim().toUpperCase() === cleanD) && 
                                               !(employee.workingDistrict && employee.workingDistrict.toUpperCase().includes(cleanD));
                            const isSelected = selectedDistricts.some(sd => sd.split('/')[0].trim().toUpperCase() === cleanD);
                            
                            return (
                              <label key={d} title={isOccupied ? "Already assigned to another ZC" : ""} className={`flex items-center gap-2 ${isOccupied ? 'cursor-not-allowed opacity-60 bg-red-50 text-red-500 border-red-200' : 'cursor-pointer'} p-2 border text-[9px] font-black uppercase transition-all ${isSelected ? 'bg-[#3AB000] text-white border-[#3AB000]' : 'bg-white border-gray-100'} ${!isOccupied && !isSelected ? 'text-gray-400' : ''}`}>
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={isSelected}
                                  disabled={isOccupied}
                                  onChange={(e) => {
                                    if (isOccupied) return;
                                    if (e.target.checked) {
                                      setSelectedDistricts([...selectedDistricts, d]);
                                    } else {
                                      setSelectedDistricts(selectedDistricts.filter(item => item.split('/')[0].trim().toUpperCase() !== cleanD));
                                    }
                                  }}
                                />
                                {d} {isOccupied && " 🔒"}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={handleUpdate}
                        disabled={updating || !newDesignation || !selectedState}
                        className="flex-1 py-4 bg-[#3AB000] text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50"
                      >
                        {updating ? "Deploying..." : "Apply Changes"}
                      </button>
                      <button
                        onClick={() => setShowEdit(false)}
                        className="px-6 py-4 bg-gray-100 text-gray-500 text-[11px] font-black uppercase tracking-widest"
                      >
                        X
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Designation Correction Section */}
              <div className="bg-white border border-gray-200 p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-amber-500"></div>
                  <div>
                    <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.2em]">Designation Correction</h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Force Update to Align with Paid MOU</p>
                  </div>
                </div>

                {!showCorrection ? (
                  <div className="space-y-4">
                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                      Use this panel to fix mismatched role designations (e.g., if someone paid the MOU fee of Block Supervisor but displays as Panchayat Executive).
                    </p>
                    <button
                      onClick={() => {
                        setCorrectedDesignation(employee.designation || "");
                        setShowCorrection(true);
                      }}
                      className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-amber-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                    >
                      Correction / Force Edit Role
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select Target Post</label>
                      <select
                        className="w-full bg-gray-50 border border-gray-200 text-[11px] font-bold p-4 rounded-none focus:border-amber-500 outline-none"
                        value={correctedDesignation}
                        onChange={(e) => setCorrectedDesignation(e.target.value)}
                      >
                        <option value="">Choose Post</option>
                        {correctionDesignations.map(d => (
                          <option key={d.name} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={handleCorrection}
                        disabled={correcting || !correctedDesignation}
                        className="flex-1 py-4 bg-amber-500 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50"
                      >
                        {correcting ? "Saving Correction..." : "Confirm Update"}
                      </button>
                      <button
                        onClick={() => setShowCorrection(false)}
                        className="px-6 py-4 bg-gray-100 text-gray-500 text-[11px] font-black uppercase tracking-widest"
                      >
                        X
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Supervision Chain */}
              <div className="bg-white border border-gray-200 p-8 space-y-6">
                <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck size={14} className="text-[#3AB000]" /> Verification Matrix
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Role Clearance</p>
                      <p className="text-[11px] font-black text-gray-900 uppercase">{employee.role || 'N/A'}</p>
                    </div>
                    <ShieldCheck size={20} className="text-[#3AB000]" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Joining Authority</p>
                      <p className="text-[11px] font-black text-gray-900 uppercase">{employee.createdBy?.name || 'ADMIN-HQ'}</p>
                    </div>
                    <Award size={20} className="text-[#3AB000]" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Enrolled on</p>
                      <p className="text-[11px] font-black text-gray-900 uppercase">
                        {new Date(employee.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <Calendar size={20} className="text-gray-300" />
                  </div>
                </div>

                {/* Reporting Line */}
                <div className="pt-6 border-t border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Commanding Officer</p>
                  {employee.reportingTo ? (
                    <div className="flex items-center gap-4 group p-3 bg-gray-50 border border-gray-100 hover:border-[#3AB000] transition-colors cursor-pointer">
                      <div className="w-10 h-10 bg-white flex items-center justify-center text-[#3AB000] border border-gray-200">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{employee.reportingTo?.name}</p>
                        <p className="text-[9px] font-bold text-[#3AB000] uppercase tracking-widest">Supervisor Level</p>
                      </div>
                      <ArrowUpRight size={14} className="ml-auto text-gray-300 group-hover:text-[#3AB000]" />
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed border-gray-200 text-center">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reports Directly to High Command</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminEmployeeDetail;
