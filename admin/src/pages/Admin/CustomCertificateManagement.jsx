import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Plus, Download, Trash2, X, Eye, EyeOff, Loader2, Award } from "lucide-react";
import toast from "react-hot-toast";
import CertificateViewer from "../../components/CertificateViewer";
import jssaLogo from '../../assets/jssa-logo-long.png';
import watermarkLogo from '../../assets/JSSAogo.png';
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import api from "../../utils/api";

const CustomCertificateManagement = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewCertModal, setViewCertModal] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const certRef = React.useRef(null);
  const [formData, setFormData] = useState({
    recipientName: "",
    position: "",
    eventName: "",
    location: "",
    issueDate: new Date().toISOString().split("T")[0],
    submittedBy: "",
    organizationName: "जन स्वास्थ्य सहायता अभियान (JSSA)",
    customContent: "",
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const data = await api("/custom-certificates", { method: "GET" });
      if (data.success) {
        setCertificates(data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch certificates");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const data = await api("/custom-certificates", { method: "POST", body: JSON.stringify(formData) });
      if (data.success) {
        toast.success("Certificate generated successfully!");
        setShowModal(false);
        setFormData({
          recipientName: "",
          position: "",
          eventName: "",
          location: "",
          issueDate: new Date().toISOString().split("T")[0],
          submittedBy: "",
          organizationName: "जन स्वास्थ्य सहायता अभियान (JSSA)",
          customContent: "",
        });
        setPreviewMode(false);
        fetchCertificates();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error generating certificate");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this certificate?")) return;
    try {
      const data = await api(`/custom-certificates/${id}`, { method: "DELETE" });
      if (data.success) {
        toast.success("Certificate deleted!");
        fetchCertificates();
      }
    } catch (error) {
      toast.error("Error deleting certificate");
    }
  };

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

  const handleDownload = async () => {
    if (!certRef.current || !viewCertModal) return;
    setIsDownloading(true);
    
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/dom-to-image/2.6.0/dom-to-image.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

      // Wait a moment for rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      const element = certRef.current;
      
      // Temporarily remove shadow for clean print
      element.classList.remove('shadow-xl');

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
        orientation: 'landscape',
        unit: 'px',
        format: [width, height],
        compress: true
      });

      pdf.addImage(dataUrl, 'JPEG', 0, 0, width, height);
      pdf.save(`Certificate_${viewCertModal.certNumber.replace(/\//g, '_')}.pdf`);
      toast.success("Downloaded successfully");
    } catch (err) {
      console.error('PDF Generation Error:', err);
      if (certRef.current) {
        certRef.current.classList.add('shadow-xl');
      }
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
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
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Custom Certificates</h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Generate and manage custom branded certificates</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#206933] hover:bg-gray-100 transition-colors shadow-md text-xs font-black uppercase tracking-widest rounded-none"
            >
              <Plus size={16} /> Create Certificate
            </button>
          </div>

          {/* Certificates List */}
          <div className="bg-white border border-gray-200 shadow-sm overflow-hidden rounded-none mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 text-xs font-black uppercase text-gray-700 tracking-wider">Cert Number</th>
                    <th className="p-4 text-xs font-black uppercase text-gray-700 tracking-wider">Recipient</th>
                    <th className="p-4 text-xs font-black uppercase text-gray-700 tracking-wider">Event</th>
                    <th className="p-4 text-xs font-black uppercase text-gray-700 tracking-wider">Date</th>
                    <th className="p-4 text-xs font-black uppercase text-gray-700 tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500 font-bold uppercase text-xs tracking-widest">
                      <Loader2 className="animate-spin mx-auto mb-2" size={24} /> Loading certificates...
                    </td>
                  </tr>
                ) : certificates.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500 font-bold uppercase text-xs tracking-widest">
                      No custom certificates generated yet.
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert) => (
                    <tr key={cert._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-sm font-bold text-gray-900">{cert.certNumber}</td>
                      <td className="p-4">
                        <div className="text-sm font-bold text-gray-900">{cert.recipientName}</div>
                        <div className="text-xs text-gray-500 font-medium">{cert.position}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-700">{cert.eventName}</td>
                      <td className="p-4 text-sm text-gray-700">{new Date(cert.issueDate).toLocaleDateString()}</td>
                      <td className="p-4 flex items-center justify-end gap-3">
                        <button
                          onClick={() => setViewCertModal(cert)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                          <Eye size={14} /> View / Download
                        </button>
                        <button
                          onClick={() => handleDelete(cert._id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-sm transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          </div>

        {/* Create Certificate Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[50000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`bg-white rounded-md shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${previewMode ? 'w-full max-w-6xl h-[90vh]' : 'w-full max-w-xl max-h-[90vh]'}`}>
              <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] border-b-[3px] border-[#154622] px-6 py-4 flex items-center justify-between shrink-0">
                <h2 className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2 drop-shadow-sm">
                  <Award size={18} className="text-white" />
                  {previewMode ? 'Preview Certificate' : 'Create Custom Certificate'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-auto flex flex-col md:flex-row">
                {!previewMode ? (
                  <form id="cert-form" onSubmit={handleSubmit} className="p-6 space-y-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Recipient Name</label>
                        <input required name="recipientName" value={formData.recipientName} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm p-2.5 text-sm outline-none focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000]" placeholder="e.g. Rahul Sharma" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Position / Title</label>
                        <input required name="position" value={formData.position} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm p-2.5 text-sm outline-none focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000]" placeholder="e.g. Volunteer" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Event / Training Name</label>
                      <input required name="eventName" value={formData.eventName} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm p-2.5 text-sm outline-none focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000]" placeholder="e.g. Health Awareness Camp" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Location</label>
                        <input required name="location" value={formData.location} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm p-2.5 text-sm outline-none focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000]" placeholder="e.g. Delhi" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Issue Date</label>
                        <input required type="date" name="issueDate" value={formData.issueDate} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm p-2.5 text-sm outline-none focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Submitted By (Signatory)</label>
                        <input required name="submittedBy" value={formData.submittedBy} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm p-2.5 text-sm outline-none focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000]" placeholder="e.g. State President" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Organization Name</label>
                        <input required name="organizationName" value={formData.organizationName} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm p-2.5 text-sm outline-none focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000]" />
                      </div>
                    </div>

                    <div className="bg-[#f0f9f3] p-4 rounded-md border border-[#3AB000]/30 mb-5 shadow-sm">
                      <h4 className="text-[#206933] font-black uppercase tracking-widest text-xs mb-2 flex items-center gap-1">
                        <Award size={14} /> How to use Custom Content
                      </h4>
                      <ol className="list-decimal pl-4 space-y-1 text-sm text-[#206933]/80 font-medium mb-3">
                        <li>Fill in the recipient details in the inputs above.</li>
                        <li>Type your custom message below (or leave blank for the default format).</li>
                        <li>Use the <strong>Placeholders</strong> exactly as shown below to insert dynamic values. They will automatically render in bold green text on the certificate!</li>
                      </ol>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <code className="bg-white px-2 py-1 rounded text-[#206933] border border-[#3AB000]/30 font-bold shadow-sm">[Name]</code> 
                        <code className="bg-white px-2 py-1 rounded text-[#206933] border border-[#3AB000]/30 font-bold shadow-sm">[Position]</code> 
                        <code className="bg-white px-2 py-1 rounded text-[#206933] border border-[#3AB000]/30 font-bold shadow-sm">[Event]</code> 
                        <code className="bg-white px-2 py-1 rounded text-[#206933] border border-[#3AB000]/30 font-bold shadow-sm">[Location]</code>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Custom Certificate Content (Optional)</label>
                      <textarea name="customContent" value={formData.customContent} onChange={handleInputChange} rows={4} className="w-full border border-gray-300 rounded-sm p-2.5 text-sm outline-none focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000]" placeholder="Leave blank to use default template text.&#10;&#10;Example: This certificate is presented to [Name] for their excellent role as [Position] at the [Event] held in [Location]."></textarea>
                    </div>
                  </form>
                ) : (
                  <div className="flex-1 bg-[#e0e8e3] p-8 flex justify-center items-start overflow-auto min-h-[400px]">
                     {/* Scaled Wrapper to fix CSS transform bounds */}
                     <div style={{ width: '955px', height: '675px' }} className="shrink-0 relative">
                       <div className="bg-[#fdfdfa] shadow-2xl w-[1123px] min-h-[794px] h-max p-[72px] absolute top-0 left-0 origin-top-left scale-[0.85] text-gray-900 flex flex-col" style={{ fontFamily: '"Georgia", "Times New Roman", serif', boxSizing: 'border-box' }}>
                          {/* Outer Thick Border */}
                          <div className="absolute inset-0 border-[16px] border-[#206933] pointer-events-none z-30"></div>
                          {/* Inner Decorative Border */}
                          <div className="absolute inset-[28px] border-[3px] border-[#206933] pointer-events-none z-20 opacity-80"></div>
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
                              templateId="custom-dynamic"
                              mode="preview"
                              customData={formData}
                              certId="JSSA/CUSTOM/PREVIEW"
                              issueDate={formData.issueDate}
                            />
                          </div>
                       </div>
                     </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-100 transition-colors text-xs font-black uppercase tracking-widest"
                >
                  {previewMode ? <><EyeOff size={16} /> Edit Details</> : <><Eye size={16} /> Preview</>}
                </button>

                <div className="flex items-center gap-3">
                  <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 bg-gray-100 border border-gray-200 rounded-sm text-xs font-black uppercase tracking-widest transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="cert-form"
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#206933] text-white hover:bg-[#154622] rounded-sm text-xs font-black uppercase tracking-widest transition-colors shadow-md disabled:bg-gray-400 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />} 
                    Generate Certificate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Certificate Modal (Matches AdminCertificateManagement) */}
        {viewCertModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center p-4 print:p-0 print:bg-white print:items-start">
            <div className="bg-white rounded-none shadow-xl max-w-[1250px] w-full relative flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:w-auto">

              {/* Modal Header */}
              <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gray-50 no-print shrink-0">
                <div className="flex items-center gap-3">
                  <Award className="text-[#3AB000]" size={20} />
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">
                    View Certificate - {viewCertModal.certNumber}
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold text-white bg-[#206933] hover:bg-[#154622] rounded-none transition-colors disabled:opacity-50"
                  >
                    {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    {isDownloading ? 'Generating...' : 'Download PDF'}
                  </button>
                  <button
                    onClick={() => !isDownloading && setViewCertModal(null)}
                    className="p-1.5 text-gray-400 hover:text-red-500 bg-white border border-gray-200 hover:border-red-500 rounded-none transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Certificate Container */}
              <div className="flex justify-center overflow-auto bg-gray-200 p-8 print:p-0 print:bg-white flex-1">
                <div ref={certRef} className="print-area bg-[#fdfdfa] shadow-xl print:shadow-none w-[1123px] min-h-[794px] h-max p-[72px] relative text-gray-900 shrink-0 print:p-0 flex flex-col" style={{ fontFamily: '"Georgia", "Times New Roman", serif', boxSizing: 'border-box' }}>

                  {/* Outer Thick Border */}
                  <div className="absolute inset-0 border-[16px] border-[#206933] pointer-events-none z-30"></div>

                  {/* Inner Decorative Border */}
                  <div className="absolute inset-[28px] border-[3px] border-[#206933] pointer-events-none z-20 opacity-80"></div>

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
                      templateId="custom-dynamic"
                      mode="view"
                      customData={{
                        recipientName: viewCertModal.recipientName,
                        position: viewCertModal.position,
                        eventName: viewCertModal.eventName,
                        location: viewCertModal.location,
                        issueDate: viewCertModal.issueDate,
                        submittedBy: viewCertModal.submittedBy,
                        organizationName: viewCertModal.organizationName,
                        customContent: viewCertModal.customContent,
                      }}
                      certId={viewCertModal.certNumber}
                      issueDate={viewCertModal.issueDate}
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

export default CustomCertificateManagement;
