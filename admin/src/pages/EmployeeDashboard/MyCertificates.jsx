import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Award, Eye, X, FileBadge, Download, Loader2 } from 'lucide-react';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/AuthProvider';
import CertificateViewer from '../../components/CertificateViewer';

import jssaLogo from '../../assets/jssa-logo-long.png';
import watermarkLogo from '../../assets/JSSAogo.png';

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

const MyCertificates = () => {
    const { employeeProfile } = useAuth();
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCert, setSelectedCert] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const certRef = useRef(null);

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
            pdf.save(`Certificate_${selectedCert.templateId}.pdf`);

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

    const fetchMyCertificates = async () => {
        try {
            setLoading(true);
            const response = await api.certificates.getMyCertificates();
            if (response.success) {
                setCertificates(response.data);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to load certificates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyCertificates();
    }, []);

    const handleView = (cert) => {
        setSelectedCert(cert);
        setIsModalOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-white p-0 md:ml-0 px-2 md:px-6 pb-10">
                <div className="pt-4 md:pt-6">
                    <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30">
                                <Award className="text-white" size={30} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">My Certificates</h1>
                                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">View and Download Your Assigned Certificates</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 p-5 rounded-none shadow-sm mb-6">
                        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-5">
                            <FileBadge size={16} className="text-[#3AB000]" />
                            <h2 className="text-xs font-black text-gray-800 uppercase tracking-widest">
                                Assigned Certificates
                            </h2>
                        </div>

                        {loading ? (
                            <div className="py-10 flex justify-center">
                                <Loader2 className="w-8 h-8 text-[#3AB000] animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {certificates.length > 0 ? (
                                    certificates.map((cert) => {
                                        const certInfo = allCertificates.find(c => c.templateId === cert.templateId) || { title: 'Certificate', desc: '' };
                                        return (
                                            <div key={cert._id} className="bg-white rounded-none shadow-sm p-4 border border-gray-200 hover:border-[#3AB000] transition-colors flex flex-col h-full group">
                                                <div className="flex items-center justify-center h-28 bg-gray-50 rounded-none mb-4 border border-gray-100 relative overflow-hidden group-hover:bg-green-50 transition-colors">
                                                    <Award className="w-16 h-16 text-gray-200 absolute transform group-hover:scale-110 transition-transform duration-300" strokeWidth={1} />
                                                    <FileBadge className="w-10 h-10 text-[#3AB000] z-10" strokeWidth={1.5} />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-1">{certInfo.title}</h3>
                                                    <p className="text-[10px] text-[#3AB000] font-bold uppercase tracking-wider mb-2 leading-relaxed">Issued on: {new Date(cert.issueDate).toLocaleDateString()}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-4 leading-relaxed">{certInfo.desc}</p>
                                                </div>

                                                <div className="mt-auto">
                                                    <button
                                                        onClick={() => handleView(cert)}
                                                        className="w-full h-10 bg-white border border-[#3AB000] text-[#3AB000] hover:bg-[#3AB000] hover:text-white text-xs font-black uppercase tracking-widest rounded-none transition-all flex justify-center items-center"
                                                    >
                                                        <Eye size={14} className="mr-2" /> View Certificate
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full py-10 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white border border-dashed border-gray-300">
                                        No certificates assigned yet
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Modal */}
                    {isModalOpen && selectedCert && (
                        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center p-4 print:p-0 print:bg-white print:items-start">
                            <div className="bg-white rounded-none shadow-xl max-w-[1250px] w-full relative flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:w-auto">
                                <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gray-50 no-print shrink-0">
                                    <div className="flex items-center gap-3">
                                        <FileBadge className="text-[#3AB000]" size={20} />
                                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">
                                            {allCertificates.find(c => c.templateId === selectedCert.templateId)?.title}
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
                                            onClick={() => !isDownloading && setIsModalOpen(false)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 bg-white border border-gray-200 hover:border-red-500 rounded-none transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Certificate Rendering Area */}
                                <div className="flex justify-center overflow-auto bg-gray-200 p-8 print:p-0 print:bg-white flex-1">
                                    <div ref={certRef} className="print-area bg-[#fdfdfa] shadow-xl print:shadow-none w-[1123px] h-[794px] p-[72px] relative text-gray-900 shrink-0 print:p-0 flex flex-col" style={{ fontFamily: '"Georgia", "Times New Roman", serif', boxSizing: 'border-box' }}>
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
                                                templateId={selectedCert.templateId} 
                                                mode="employee" 
                                                employeeData={{ 
                                                    ...employeeProfile, 
                                                    cardsCount: selectedCert.cardsCount,
                                                    targetCount: selectedCert.targetCount,
                                                    achievementPercentage: selectedCert.achievementPercentage,
                                                    state: selectedCert.state || employeeProfile?.state || employeeProfile?.workingState
                                                }} 
                                                issueDate={selectedCert.issueDate} 
                                                certId={selectedCert._id} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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

export default MyCertificates;
