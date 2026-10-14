import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { cardAPI } from "../../utils/api";
import {
  Download,
  Printer,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowLeft,
  UserCheck,
  Calendar,
  Contact,
  Verified,
  Phone,
  QrCode,
  CreditCard,
  X
} from "lucide-react";
import longLogo from "../../assets/jssa-logo-long.png";
import watermarkLogo from "../../assets/JSSAogo.png";
import qrCodeAsset from "../../assets/QrCode.png";

const MyCard = ({ cardId = null }) => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const cardRef = useRef(null);

  const card = cards[selectedCardIndex] || null;

  const fetchCard = async () => {
    try {
      setLoading(true);
      const res = cardId
        ? await cardAPI.getDetails(cardId)
        : await cardAPI.getMyCard();

      if (res.success) {
        if (Array.isArray(res.data)) {
          setCards(res.data);
        } else {
          setCards([res.data]);
        }
      } else {
        setError(res.error || "Card not found");
      }
    } catch (err) {
      setError("Failed to fetch card details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCard();
  }, [cardId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[70vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#3AB000]" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Your Digital Card...</p>
        </div>
      </DashboardLayout>
    );
  }

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (window.html2pdf) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const handleDownload = async () => {
    if (isDownloading || !cardRef.current) return;
    setIsDownloading(true);

    try {
      // Wait for React to apply 'overflow-visible' classes before capturing
      await new Promise(resolve => setTimeout(resolve, 300));

      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');

      const element = cardRef.current;

      // A4 width is 210mm. Physical ID card width is 85.6mm.
      // We set left/right margins to (210 - 85.6) / 2 = 62.2mm
      // This forces html2pdf to scale the 750px UI card exactly to 85.6mm on the PDF!
      const opt = {
        margin: [10, 1, 10, 1], // top, left, bottom, right
        filename: `Jan_Swasthya_Sahayata_Card_${card.cardId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 3,
          useCORS: true,
          letterRendering: true,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await window.html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (error || !card) {
    return (
      <DashboardLayout>
        <div className="h-[70vh] flex flex-col items-center justify-center text-center px-6">
          <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Access Denied</h2>
          <p className="text-sm text-gray-500 font-medium mt-2">{error || "You don't have an active membership card yet."}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-[#1B9E4B] font-black uppercase text-[10px] tracking-widest mb-6 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Jan Swasthya Sahayata Card</h1>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Digital Membership credentials</p>
          </div>
        </div>

        {/* Grid of Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {cards.map((c, idx) => (
            <div key={c._id || idx} className="bg-white border-2 border-gray-200 p-6 flex flex-col items-center text-center hover:border-[#1B9E4B] transition-all shadow-sm">
              <div className="w-24 h-24 rounded-none overflow-hidden border-[3px] border-[#F7941D] mb-4 p-1">
                <img src={c.photo || "https://api.dicebear.com/7.x/initials/svg?seed=" + c.cardholderName} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-black text-[15px] text-gray-900 uppercase leading-tight">{c.cardholderName}</h3>
              <p className="text-[11px] font-bold text-[#1B9E4B] uppercase tracking-widest mt-1">{c.cardId}</p>

              <div className="flex w-full gap-2 mt-6">
                <button
                  onClick={() => { setSelectedCardIndex(idx); setIsModalOpen(true); }}
                  className="flex-1 px-1 py-2 bg-green-50 text-[#1B9E4B] font-bold text-[10px] lg:text-[11px] capitalize hover:bg-green-100 border border-[#1B9E4B]/30 transition-colors rounded-sm whitespace-nowrap"
                >
                  View Card
                </button>
                <button
                  onClick={() => {
                    setSelectedCardIndex(idx);
                    setTimeout(() => handleDownload(), 500);
                  }}
                  disabled={isDownloading && selectedCardIndex === idx}
                  className="flex-1 px-1 flex items-center justify-center gap-1 py-2 bg-[#1B9E4B] text-white font-bold text-[10px] lg:text-[11px] capitalize hover:bg-[#15803d] transition-colors disabled:opacity-50 rounded-sm whitespace-nowrap"
                >
                  {isDownloading && selectedCardIndex === idx ? (
                    <><Loader2 size={12} className="animate-spin shrink-0" /> Wait</>
                  ) : (
                    <><Download size={12} className="shrink-0" /> Download</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* HIDDEN / MODAL Card Display Area */}
        <div className={isModalOpen ? "fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 overflow-hidden" : "opacity-0 pointer-events-none absolute top-[-9999px]"}>

          <div className="bg-transparent w-full max-w-[1200px] flex flex-col relative h-full max-h-[95vh] sm:max-h-[90vh]">
            {/* Header with Close and Download buttons - Fixed at top of modal */}
            {(isModalOpen || isDownloading) && (
              <div className="flex justify-end items-center gap-4 mb-3 shrink-0 px-2 sm:px-0">
                {isModalOpen && (
                  <button
                    onClick={() => handleDownload()}
                    disabled={isDownloading}
                    className="flex items-center gap-2 bg-[#F7941D] hover:bg-orange-600 text-white px-5 py-2.5 text-sm font-black disabled:opacity-50 transition-all shadow-md rounded-sm"
                  >
                    {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    {isDownloading ? "Wait..." : "Download PDF"}
                  </button>
                )}
                {isModalOpen && (
                  <button
                    onClick={() => !isDownloading && setIsModalOpen(false)}
                    className="text-white hover:text-red-500 bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all shadow-md"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Content Area */}
            <div className={`flex-1 overflow-y-auto ${isDownloading ? 'overflow-x-visible' : 'overflow-x-hidden'} bg-white p-4 sm:p-8 rounded-none shadow-2xl relative w-full border-t-4 border-[#1B9E4B] styled-scrollbar`}>
              <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
                {/* Left Side: Cards */}
                <div className={`flex-1 w-full ${isDownloading ? 'overflow-visible' : 'overflow-x-auto'} pb-4 styled-scrollbar`}>
                  {/* The cardRef must wrap the exact elements we want to download */}
                  <div
                    ref={cardRef}
                    className="flex flex-col items-center gap-10 sm:gap-16 bg-white w-[750px] min-w-[750px] mx-auto py-2"
                  >
                    {/* FRONT OF CARD - PIXEL PERFECT WIDE */}
                    <div id="id-card-front" className="relative w-[750px] h-[468px] min-w-[750px] bg-white shadow-2xl overflow-hidden border-2 border-gray-300 rounded-xl font-sans print:shadow-none shrink-0">
                      {/* Header Section */}
                      <div className="flex items-center p-6 pb-0 pt-7">
                        <div className="w-28 h-28 shrink-0">
                          <img src={watermarkLogo} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 text-center pr-12">
                          <h2 className="text-[29px] font-black text-[#1B9E4B] leading-none uppercase tracking-tight">JAN SWASTHYA SAHAYATA CARD</h2>
                          <p className="text-[16px] font-black text-[#1B9E4B] mt-2.5 leading-tight">A Project Of Healthcare Research & Development Board</p>
                          <p className="text-[12px] font-bold text-gray-700 leading-tight mt-1">(HRDB is Division of social welfare organization "NAC India")</p>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="flex items-center justify-between px-12 h-[calc(100%-146px)] relative -mt-3">
                        {/* Photo Area */}
                        <div className="w-[155px] h-[190px] border-[4px] border-[#F7941D] rounded-[15px] overflow-hidden bg-white shadow-lg shrink-0">
                          <img
                            src={card?.photo || (card ? "https://api.dicebear.com/7.x/initials/svg?seed=" + card.cardholderName : "")}
                            className="w-full h-full object-cover"
                            alt="Card Holder"
                          />
                        </div>

                        {/* Details Area */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center px-8 space-y-2.5 -mt-2">
                          {[
                            { label: "NAME", value: card?.cardholderName },
                            {
                              label: (() => {
                                if (!card?.gender) return "S/O";
                                if (card.gender.toLowerCase() === "male") return "S/O";
                                if (card.gender.toLowerCase() === "female") {
                                  if (card.maritalStatus === "Unmarried") return "D/O";
                                  if (["Married", "Widowed"].includes(card.maritalStatus)) return "W/O";
                                  return "D/O";
                                }
                                return "C/O";
                              })(), value: card?.fatherOrHusbandName
                            },
                            { label: "DOB", value: card?.dob ? new Date(card.dob).toLocaleDateString('en-GB') : "" },
                            { label: "GENDER", value: card?.gender || "FEMALE" },
                            { label: "CARD NO.", value: card?.cardId },
                            { label: "ISSUE DATE", value: card?.createdAt ? new Date(card.createdAt).toLocaleDateString('en-GB') : "" }
                          ].map((row, idx) => (
                            <div key={idx} className="flex items-start text-[18px]">
                              <span className="w-[105px] inline-block font-black text-gray-900 uppercase tracking-tighter shrink-0 leading-[1.2] pt-[1px]">{row.label}</span>
                              <span className="font-black text-gray-900 mr-5 shrink-0 leading-[1.2] pt-[1px]">:</span>
                              <span className="flex-1 min-w-0 font-black text-gray-900 uppercase leading-[1.2] break-words">{row.value}</span>
                            </div>
                          ))}
                        </div>

                        {/* QR Code Area */}
                        <div className="w-[130px] h-[130px] border-[2px] border-[#42B7E5] p-1.5 bg-white shadow-sm shrink-0">
                          <img src={qrCodeAsset} className="w-full h-full object-contain" alt="QR" />
                        </div>
                      </div>

                      {/* PIXEL PERFECT BOTTOM SECTION - FIXED OVERLAP */}
                      <div className="absolute bottom-0 left-0 w-full h-[65px] pointer-events-none">
                        <div className="absolute bottom-0 left-0 w-full h-10 bg-[#1B9E4B]"></div>
                        <div
                          className="absolute bottom-0 right-0 h-[60px] bg-[#F7941D]"
                          style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)', width: '50%' }}
                        >
                          <div className="flex flex-col items-end justify-center h-full pr-8 pb-3 text-white">
                            <p className="text-[13px] font-bold leading-none tracking-tight">website: www.jssabhiyan.com</p>
                            <p className="text-[13px] font-bold mt-2 leading-none tracking-tight">Email: support@jssabhiyan.com</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BACK OF CARD - PIXEL PERFECT WIDE */}
                    <div id="id-card-back" className="relative w-[750px] h-[468px] min-w-[750px] bg-white shadow-2xl overflow-hidden border-2 border-gray-300 rounded-xl font-sans print:shadow-none shrink-0">
                      {/* Header Section (Same as front) */}
                      <div className="flex items-center p-6 pb-0 pt-7">
                        <div className="w-28 h-28 shrink-0">
                          <img src={watermarkLogo} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 text-center pr-12">
                          <h2 className="text-[29px] font-black text-[#1B9E4B] leading-none uppercase tracking-tight">JAN SWASTHYA SAHAYATA CARD</h2>
                          <p className="text-[16px] font-black text-[#1B9E4B] mt-2.5 leading-tight">A Project Of Healthcare Research & Development Board</p>
                          <p className="text-[12px] font-bold text-gray-700 leading-tight mt-1">(HRDB is Division of social welfare organization "NAC India")</p>
                        </div>
                      </div>

                      {/* Benefits Content */}
                      <div className="px-16 flex flex-col justify-center h-[calc(100%-146px)] text-center pb-6 -mt-1">
                        <h3 className="text-[16px] font-black text-[#1B9E4B] uppercase underline underline-offset-4 mb-5">MEMBERSHIP'S BENIFITS/ सदस्यता का सुविधा</h3>

                        <div className="space-y-4 text-justify overflow-hidden">
                          <p className="text-[14px] font-bold text-gray-800 leading-[1.6]">
                            <span className="font-black italic">Benefits :</span> Jan Swasthya sahayata card is provided by the ogranization to each members associated under the jan Swasthya Sahayata Abhiyan.And through this card, you will get better treatment by special doctor,medicines and medical examination in the health camp organized by the organization and as per the need, financial assistance and health related assistance will be provided
                          </p>
                          <p className="text-[12px] font-bold text-gray-800 leading-[1.6]">
                            <span className="font-black italic">सुविधा :</span> जन स्वास्थ्य सहायता अभियान के अंतर्गत जुड़े प्रत्येक सदस्य को संस्था द्वारा एक जन स्वास्थ्य सहायता कार्ड प्रदान किया जाता है और इस कार्ड के माध्यम से आपको संस्था द्वारा आयोजित स्वास्थ्य शिविर में विशेष चिकित्सक द्वारा बेहतर इलाज, दवाईयां एवं चिकित्सा जांच करायी जायेगी तथा आवश्यकता अनुसार तक की आर्थिक सहायता एवं स्वास्थ्य संबंधी सहायता प्रदान की जायेगी.
                          </p>
                        </div>
                      </div>

                      {/* PIXEL PERFECT BOTTOM SECTION */}
                      <div className="absolute bottom-0 left-0 w-full h-[65px] pointer-events-none">
                        <div className="absolute bottom-0 left-0 w-full h-10 bg-[#1B9E4B]"></div>
                        <div
                          className="absolute bottom-0 right-0 h-[60px] bg-[#F7941D]"
                          style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)', width: '50%' }}
                        >
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar - Issuance Details */}
                <div className="w-full xl:w-[320px] shrink-0 space-y-6">
                  <div className="bg-white border-2 border-[#1B9E4B] p-6 shadow-xl relative overflow-hidden">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-4 mb-6">
                      <UserCheck className="text-[#1B9E4B]" size={18} />
                      Issuance Record
                    </h3>

                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-green-50 text-[#1B9E4B]">
                          <Contact size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Issued By</p>
                          <p className="text-[13px] font-black text-gray-800 uppercase leading-tight">
                            {card?.issuedBy?.name || card?.issuedBy?.email?.split('@')[0] || "Head Office Admin"}
                          </p>
                          <p className="text-[11px] font-bold text-[#1B9E4B] mt-0.5 uppercase tracking-tighter">Official {card?.issuedBy?.role || "Administrator"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-green-50 text-[#1B9E4B]">
                          <Phone size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Contact Support</p>
                          <p className="text-[13px] font-black text-gray-800">{card?.issuedBy?.phone || "0635541928"}</p>
                          <p className="text-[11px] font-bold text-gray-400 mt-0.5 uppercase tracking-tighter">Support Line Available</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-green-50 text-[#1B9E4B]">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Issuance Date</p>
                          <p className="text-[13px] font-black text-gray-800">{card?.createdAt ? new Date(card.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : ""}</p>
                          <p className="text-[11px] font-bold text-gray-400 mt-0.5 uppercase tracking-tighter">System Generated Timestamp</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Verified className="text-[#1B9E4B]" size={16} />
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Verified Document</span>
                      </div>
                      <div className="w-8 h-8 bg-gray-50 flex items-center justify-center">
                        <QrCode size={16} className="text-gray-300" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900 p-6 text-white border-b-4 border-[#1B9E4B] shadow-lg">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] mb-2 text-green-400">Security Notice</h4>
                    <p className="text-[12px] font-medium leading-relaxed opacity-80 italic">
                      "This is an electronically generated document. No physical signature is required. Validity can be verified via the JSSA portal using the Membership ID."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Block */}
        <div className="mt-8 bg-amber-50 border border-amber-200 p-6 flex items-start gap-4">
          <AlertCircle className="text-amber-600 shrink-0 mt-1" />
          <div>
            <h4 className="text-sm font-black text-gray-900 uppercase mb-1">Printing Instructions</h4>
            <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4 font-bold">
              <li>Print on high-quality PVC or Card stock (85.6mm x 54mm)</li>
              <li>Ensure 'Scale' is set to 100% in print settings</li>
              <li>Print both sides and laminate for durability</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyCard;
