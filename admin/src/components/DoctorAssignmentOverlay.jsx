import React, { useState, useEffect } from 'react';
import { Stethoscope, ArrowRight, X, PhoneCall, Youtube, BadgeCheck, Video, Info, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { doctorsAPI } from '../utils/api';

const formatTime12Hour = (time24) => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":");
  if (!hours || !minutes) return time24;
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const h12Str = h12 < 10 ? `0${h12}` : h12;
  return `${h12Str}:${minutes} ${ampm}`;
};

const DoctorAssignmentOverlay = () => {
  const [doctors, setDoctors] = useState([]);
  const [visible, setVisible] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const navigate = useNavigate();
  const { role, user } = useAuth();

  useEffect(() => {
    // Only show for employees and cardholders
    if (role !== 'employee' && role !== 'cardholder' && role !== 'cardHolder') return;

    // Check if dismissed in this session for this specific user
    const dismissalKey = `dismissed_doctor_overlay_${user?._id || 'unknown'}`;
    if (sessionStorage.getItem(dismissalKey) === 'true') {
      return;
    }

    const fetchDoctors = async () => {
      try {
        let res;
        if (role === 'employee') {
          res = await doctorsAPI.getEmployeeDoctors();
        } else if (role === 'cardholder' || role === 'cardHolder') {
          res = await doctorsAPI.getCardholderDoctors();
        }

        if (res && res.success && res.data && res.data.length > 0) {
          setDoctors(res.data);
          setVisible(true);
        }
      } catch (error) {
        console.error("Doctor overlay fetch error:", error);
      }
    };

    fetchDoctors();
    const interval = setInterval(fetchDoctors, 30000);
    return () => clearInterval(interval);
  }, [role, user?._id]);

  const handleDismiss = () => {
    const dismissalKey = `dismissed_doctor_overlay_${user?._id || 'unknown'}`;
    sessionStorage.setItem(dismissalKey, 'true');
    setVisible(false);
  };

  const handleViewDoctors = () => {
    setVisible(false);
    if (role === 'employee') {
      navigate('/employee/doctors');
    } else if (role === 'cardholder' || role === 'cardHolder') {
      navigate('/cardholder/doctors');
    }
  };

  if (!visible || doctors.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 w-[380px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-2 border-[#3AB000] z-[9999] animate-in slide-in-from-left-10 duration-500 overflow-hidden rounded-none">
      {/* Header */}
      <div className="bg-[#3AB000] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
            Doctor Assigned
          </span>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <X size={16} strokeWidth={3} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex flex-col gap-4">
          {/* Doctor Details (Showing first available doctor) */}
          {doctors.length > 0 && (() => {
            const doc = doctors[0];
            return (
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 border-b border-gray-100 pb-3">
                  {doc.image ? (
                    <img 
                      src={doc.image} 
                      alt={doc.name}
                      className="w-14 h-14 shrink-0 rounded-none object-cover border-2 border-[#3AB000]/20"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/150' }}
                    />
                  ) : (
                    <div className="w-14 h-14 bg-[#3AB000]/10 text-[#3AB000] flex items-center justify-center shrink-0 border-2 border-[#3AB000]/20">
                      <Stethoscope size={24} strokeWidth={2.5} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                      Medical Assistance
                    </p>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-tight truncate flex items-center gap-1">
                      {doc.name}
                      <BadgeCheck size={14} className="text-[#3AB000]" />
                    </h4>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate mt-0.5">
                      {Array.isArray(doc.specification) && doc.specification.length > 0 ? doc.specification[0] : 'General Physician'}
                    </p>
                    
                    </div>
                </div>

                <div className="bg-[#3AB000]/10 p-3 mt-2 border border-[#3AB000]/20 rounded shadow-sm">
                  <div className="flex flex-col gap-1.5 w-full text-center">
                    <div>
                      <p className="text-xs text-green-900 font-black leading-snug">
                        Doctor is available for consultation!
                      </p>
                      <p className="text-[10px] text-green-800 font-medium mt-0.5">
                        Please connect via Call, YouTube, or Google Meet.
                      </p>
                    </div>
                    
                    <div className="border-t border-[#3AB000]/20 pt-1.5 mt-0.5">
                      <p className="text-[11px] text-green-900 font-black leading-snug">
                        डॉक्टर परामर्श के लिए उपलब्ध हैं!
                      </p>
                      <p className="text-[10px] text-green-800 font-medium mt-0.5">
                        कृपया कॉल, यूट्यूब या गूगल मीट के माध्यम से जुड़ें।
                      </p>
                    </div>
                    
                    {doc.availabilityDate?.startDate && (
                      <div className="border-t border-[#3AB000]/20 pt-2 mt-1">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <span className="text-[10px] text-green-900 font-bold bg-white/80 px-2 py-1 rounded border border-[#3AB000]/20 flex items-center gap-1 whitespace-nowrap shadow-sm">
                            📅 {new Date(doc.availabilityDate.startDate).toLocaleDateString()} - {new Date(doc.availabilityDate.endDate).toLocaleDateString()}
                          </span>
                          {doc.availabilityTime?.startTime && (
                            <span className="text-[10px] text-green-900 font-bold bg-white/80 px-2 py-1 rounded border border-[#3AB000]/20 flex items-center gap-1 whitespace-nowrap shadow-sm">
                              ⏰ {formatTime12Hour(doc.availabilityTime.startTime)} to {formatTime12Hour(doc.availabilityTime.endTime)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  {doc.contactNumbers && doc.contactNumbers.length > 0 && (
                    <button 
                      onClick={() => setShowCallModal(true)}
                      className="flex-1 py-2.5 bg-[#3AB000] text-white flex items-center justify-center hover:bg-[#2d8a00] transition-all shadow-sm rounded-sm"
                      title="Call Doctor"
                    >
                      <PhoneCall size={18} />
                    </button>
                  )}
                  {doc.youtubeLink && (
                    <a 
                      href={doc.youtubeLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2.5 bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-all shadow-sm rounded-sm"
                      title="Join YouTube Live"
                    >
                      <Youtube size={18} />
                    </a>
                  )}
                  {doc.gmeetLink && (
                    <a 
                      href={doc.gmeetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2.5 bg-[#4285F4] text-white flex items-center justify-center hover:bg-[#3367D6] transition-all shadow-sm rounded-sm"
                      title="Join Google Meet"
                    >
                      <Video size={18} />
                    </a>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Action Button */}
        <div className="mt-4">
          <button
            onClick={handleViewDoctors}
            className="w-full py-3 bg-[#3AB000] text-white font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-[0.98]"
          >
            {doctors.length > 1 ? `View All ${doctors.length} Doctors` : 'View Full Details'}
            <ArrowRight size={14} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Call Numbers Modal */}
      {showCallModal && doctors.length > 0 && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded max-w-sm w-full shadow-2xl flex flex-col">
            <div className="bg-gray-50 border-b border-gray-100 flex justify-between items-center p-4">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                <PhoneCall size={16} className="text-[#3AB000]" /> Consultation Numbers
              </h2>
              <button onClick={() => setShowCallModal(false)} className="text-gray-500 hover:bg-gray-200 p-1 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-3">
                {doctors[0].contactNumbers?.map((num, i) => (
                  <a
                    key={i}
                    href={`tel:+91${num}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-50 hover:bg-[#3AB000] text-gray-800 hover:text-white text-sm font-black border border-gray-200 transition-colors shadow-sm group"
                  >
                    <PhoneCall size={16} className="text-[#3AB000] group-hover:text-white" />
                    +91 {num}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAssignmentOverlay;
