import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { doctorsAPI } from "../../utils/api";
import { Stethoscope, Loader2, Calendar, PhoneCall, Info, Eye, X, BadgeCheck, Youtube, Clock, Video } from "lucide-react";
import { toast } from "react-hot-toast";

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

const CardholderDoctorConsult = () => {
  const [doctors, setDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("assigned");
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal states
  const [viewDoctor, setViewDoctor] = useState(null);
  const [viewContactsDoctor, setViewContactsDoctor] = useState(null);

  const fetchDoctors = async () => {
    try {
      const [resAssigned, resAll] = await Promise.all([
        doctorsAPI.getCardholderDoctors(),
        doctorsAPI.getAll()
      ]);

      if (resAssigned.success) setDoctors(resAssigned.data);
      if (resAll.success) setAllDoctors(resAll.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await doctorsAPI.getSessionHistory();
      if (res.success) {
        setSessionHistory(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchSessionHistory();
    }
  }, [activeTab]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="border-b-4 border-[#3AB000] pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex flex-col">
                <span>Doctor <span className="text-[#3AB000]">Consultation</span></span>
                <span className="text-lg text-gray-600 mt-1 normal-case tracking-normal">डॉक्टर <span className="text-[#3AB000]">परामर्श</span></span>
              </h1>
              <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.3em] mt-2">
                Connect with our specialists <span className="mx-1 normal-case tracking-normal">| हमारे विशेषज्ञों से संपर्क करें</span>
              </p>
            </div>
            <div className="bg-green-50 px-4 py-2 border border-[#3AB000] flex items-center gap-2">
              <Stethoscope size={14} className="text-[#3AB000]" />
              <span className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest">
                {doctors.length} Available Specialist{doctors.length !== 1 ? 's' : ''} <span className="mx-1 normal-case tracking-normal">| उपलब्ध विशेषज्ञ</span>
              </span>
            </div>
          </div>

          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('assigned')}
              className={`pb-3 px-2 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === 'assigned'
                  ? 'border-b-2 border-[#3AB000] text-[#3AB000]'
                  : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              Assigned Doctors
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-2 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === 'all'
                  ? 'border-b-2 border-[#3AB000] text-[#3AB000]'
                  : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              Doctor List
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-2 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === 'history'
                  ? 'border-b-2 border-[#3AB000] text-[#3AB000]'
                  : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              Session History
            </button>
          </div>

          {(loading && activeTab !== 'history') ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-[#3AB000]" />
              <p className="mt-4 text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Doctors...</p>
            </div>
          ) : activeTab === 'history' ? (
            <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm relative min-h-[400px]">
              {loadingHistory && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-4 text-center rounded">
                  <Loader2 size={40} className="animate-spin text-[#3AB000]" />
                </div>
              )}
              {sessionHistory.length > 0 ? (
                <div className="overflow-x-auto min-h-[350px]">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#3AB000] text-white font-black uppercase text-[10px] tracking-widest">
                        <th className="px-4 py-3">Doctor Info</th>
                        <th className="px-4 py-3">Session Start</th>
                        <th className="px-4 py-3">Session End</th>
                        <th className="px-4 py-3 text-right">YouTube Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sessionHistory.map((session, idx) => (
                        <tr key={session.sessionId || idx} className="hover:bg-[#f0f9eb] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={session.doctorImage || 'https://via.placeholder.com/40'}
                                alt={session.doctorName}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/40' }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{session.doctorName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-gray-700">
                            {new Date(session.startTime).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-gray-700">
                            {session.endTime ? new Date(session.endTime).toLocaleString() : <span className="text-[#3AB000]">Active Now</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {session.youtubeLink ? (
                              <a href={session.youtubeLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm">
                                <Youtube size={12} /> {session.endTime ? "Watch Video" : "Watch Live"}
                              </a>
                            ) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                !loadingHistory && (
                  <div className="flex flex-col items-center justify-center text-gray-400 py-12">
                    <Clock size={48} className="mb-4 opacity-50" />
                    <p className="text-sm font-bold uppercase tracking-widest">No Sessions Found</p>
                  </div>
                )
              )}
            </div>
          ) : (activeTab === 'assigned' ? doctors : allDoctors).length > 0 ? (
            <div className="space-y-6">
              {(activeTab === 'assigned' ? doctors : allDoctors).map((doc) => {
                const isActive = doc.status === 'active' || doc.assignedTo?.employee || doc.assignedTo?.cardholder;
                return (
                  <div key={doc._id} className={`bg-white rounded-none p-6 shadow-sm border ${isActive ? 'border-[#3AB000]' : 'border-gray-300 opacity-90'} hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-6 items-stretch`}>

                    {/* Left Side: Image & Availability */}
                    <div className="flex flex-col gap-4 w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
                      <div className="flex items-center gap-4">
                        <img
                          src={doc.image || 'https://via.placeholder.com/150'}
                          alt={doc.name}
                          className={`w-16 h-16 shrink-0 rounded-none object-cover border-2 shadow-inner ${isActive ? 'border-[#3AB000]/20' : 'border-gray-200'}`}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/150' }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-black text-gray-800 leading-tight flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{doc.name}</span>
                            <BadgeCheck size={22} className="text-white shrink-0" fill={isActive ? "#3AB000" : "#9CA3AF"} />
                            {activeTab === 'all' && (
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${isActive ? 'bg-[#3AB000]/10 text-[#3AB000] border-[#3AB000]/20' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>
                                {isActive ? 'Active' : 'Inactive'}
                              </span>
                            )}
                          </h3>
                          <p className="text-[10px] text-gray-500 truncate mt-0.5">
                            {doc.description || "Specialist"} {doc.descriptionHi && <span className="ml-1 border-l border-gray-300 pl-1">{doc.descriptionHi}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="bg-blue-50/50 rounded-none p-4 border border-blue-100/50 flex-1">
                        <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
                          <Calendar size={12} className="text-blue-600" /> Availability <span className="lowercase normal-case font-bold text-[11px] ml-1 text-blue-400">/ उपलब्धता</span>
                        </h4>
                        {doc.availabilityDate?.startDate ? (
                          <div className="flex flex-col gap-2">
                            <p className="text-[11px] font-bold text-blue-900 bg-blue-100/50 px-2 py-1.5 rounded-none inline-block w-max border border-blue-200/50">
                              {new Date(doc.availabilityDate.startDate).toLocaleDateString()} - {new Date(doc.availabilityDate.endDate).toLocaleDateString()}
                            </p>
                            {doc.availabilityTime?.startTime && (
                              <p className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1.5 rounded-none inline-block w-max border border-blue-100/50">
                                {formatTime12Hour(doc.availabilityTime.startTime)} to {formatTime12Hour(doc.availabilityTime.endTime)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-blue-400 italic">Not Specified / निर्दिष्ट नहीं</p>
                        )}
                      </div>
                    </div>

                    {/* Middle: Specifications and Bio */}
                    <div className="flex-1 flex flex-col w-full border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
                      <div className="mb-5">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
                          <Stethoscope size={12} /> Specifications <span className="lowercase normal-case font-bold text-[11px] ml-1 text-gray-400">/ विशेषज्ञता</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(doc.specification) && doc.specification.length > 0 ? (
                            doc.specification.map((spec, idx) => (
                              <span key={idx} className="bg-[#3AB000]/10 text-[#3AB000] border border-[#3AB000]/20 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider">
                                {spec} {doc.specificationHi && doc.specificationHi[idx] && <span className="normal-case tracking-normal border-l border-[#3AB000]/30 pl-1 ml-1">{doc.specificationHi[idx]}</span>}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] font-bold text-[#3AB000] uppercase tracking-wide bg-[#3AB000]/5 px-2.5 py-1 rounded-none border border-[#3AB000]/20">
                              General Physician
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-2">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                          <Info size={12} /> Biography <span className="lowercase normal-case font-bold text-[11px] ml-1 text-gray-400">/ परिचय</span>
                        </h4>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 mb-1">
                          {doc.bio || doc.description || "No biography available."}
                        </p>
                        {doc.bioHi && (
                          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3 mt-2 border-t border-gray-100 pt-2">
                            {doc.bioHi}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Side: Action Buttons */}
                    <div className="flex flex-col w-full md:w-48 shrink-0 justify-center gap-3">
                      {activeTab === 'assigned' && doc.youtubeLink && (
                        <a
                          href={doc.youtubeLink}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-none bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/20 text-xs font-black transition-colors"
                        >
                          <Youtube size={16} /> <span className="flex flex-col items-center leading-tight"><span>Join Live Session</span><span className="text-[9px] font-medium opacity-90 normal-case tracking-normal mt-0.5">लाइव सेशन से जुड़ें</span></span>
                        </a>
                      )}

                      {activeTab === 'assigned' && doc.gmeetLink && (
                        <a
                          href={doc.gmeetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-none bg-[#4285F4] hover:bg-[#3367D6] text-white shadow-sm shadow-[#4285F4]/20 text-xs font-black transition-colors"
                        >
                          <Video size={16} /> <span className="flex flex-col items-center leading-tight"><span>Join Google Meet</span><span className="text-[9px] font-medium opacity-90 normal-case tracking-normal mt-0.5">गूगल मीट से जुड़ें</span></span>
                        </a>
                      )}

                      <button
                        onClick={() => setViewDoctor(doc)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-none bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-black transition-colors"
                      >
                        <Eye size={16} /> <span className="flex flex-col items-center leading-tight"><span>View Full Details</span><span className="text-[9px] font-medium opacity-90 normal-case tracking-normal mt-0.5">पूरा विवरण देखें</span></span>
                      </button>

                      {activeTab === 'assigned' && (
                        <button
                          onClick={() => setViewContactsDoctor(doc)}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-none bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs font-black transition-colors shadow-sm shadow-[#3AB000]/20"
                        >
                          <PhoneCall size={16} /> <span className="flex flex-col items-center leading-tight"><span>Consultation Numbers</span><span className="text-[9px] font-medium opacity-90 normal-case tracking-normal mt-0.5">परामर्श नंबर</span></span>
                        </button>
                      )}
                    </div>

                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-none border border-gray-100 p-12 text-center shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-none flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-10 h-10 text-gray-300" />
              </div>
              <h2 className="text-xl font-black text-gray-800">No Doctors Found</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                {activeTab === 'assigned' ? "There are currently no doctors assigned for consultation. Please check back later or contact administration." : "No doctors are available in the directory right now."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      {viewDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded max-w-xl w-full shadow-2xl flex flex-col max-h-[85vh]">
            <div className="bg-gray-50 border-b border-gray-100 flex justify-between items-center p-4">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                <Eye size={16} className="text-[#3AB000]" /> Doctor Details <span className="normal-case text-gray-500 font-bold ml-1 text-xs">/ डॉक्टर विवरण</span>
              </h2>
              <button onClick={() => setViewDoctor(null)} className="text-gray-500 hover:bg-gray-200 p-1 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col sm:flex-row gap-5 mb-6 pb-6 border-b border-gray-100">
                <img
                  src={viewDoctor.image || 'https://via.placeholder.com/150'}
                  alt={viewDoctor.name}
                  className="w-24 h-24 shrink-0 rounded-lg object-cover border border-gray-200 shadow-sm"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/150' }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-black text-gray-900 break-words flex items-center gap-1.5">
                    {viewDoctor.name}
                    <BadgeCheck size={26} className="text-white shrink-0" fill="#3AB000" />
                  </h3>
                  <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap break-words leading-relaxed">
                    {viewDoctor.description || "No description provided."}
                    {viewDoctor.descriptionHi && <span className="block mt-1 text-gray-400">{viewDoctor.descriptionHi}</span>}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Specifications <span className="normal-case text-gray-400 font-bold ml-1">/ विशेषज्ञता</span></label>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(viewDoctor.specification) && viewDoctor.specification.length > 0 ? (
                      viewDoctor.specification.map((spec, idx) => (
                        <span key={idx} className="bg-[#3AB000]/5 text-[#3AB000] px-3 py-1.5 rounded text-xs font-bold border border-[#3AB000]/20 break-words whitespace-normal uppercase tracking-wider">
                          {spec} {viewDoctor.specificationHi && viewDoctor.specificationHi[idx] && <span className="normal-case tracking-normal border-l border-[#3AB000]/30 pl-1.5 ml-1.5">{viewDoctor.specificationHi[idx]}</span>}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 italic">None</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Biography <span className="normal-case text-gray-400 font-bold ml-1">/ परिचय</span></label>
                  <div className="bg-gray-50 p-4 rounded-none border border-gray-100 space-y-3">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                      {viewDoctor.bio || "No biography provided."}
                    </p>
                    {viewDoctor.bioHi && (
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words border-t border-gray-200 pt-3">
                        {viewDoctor.bioHi}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Contacts Modal */}
      {viewContactsDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded max-w-sm w-full shadow-2xl flex flex-col">
            <div className="bg-gray-50 border-b border-gray-100 flex justify-between items-center p-4">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                <PhoneCall size={16} className="text-[#3AB000]" /> Consultation Numbers <span className="normal-case text-gray-500 font-bold ml-1 text-xs">/ परामर्श नंबर</span>
              </h2>
              <button onClick={() => setViewContactsDoctor(null)} className="text-gray-500 hover:bg-gray-200 p-1 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <img
                  src={viewContactsDoctor.image || 'https://via.placeholder.com/150'}
                  alt={viewContactsDoctor.name}
                  className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/150' }}
                />
                <div>
                  <h3 className="text-sm font-black text-gray-800 flex items-center gap-1">
                    {viewContactsDoctor.name}
                    <BadgeCheck size={18} className="text-white shrink-0" fill="#3AB000" />
                  </h3>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Select a number to call <span className="normal-case text-gray-400">/ कॉल करने के लिए एक नंबर चुनें</span></p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {viewContactsDoctor.contactNumbers?.map((num, i) => (
                  <a
                    key={i}
                    href={`tel:+91${num}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-50 hover:bg-[#3AB000] text-gray-800 hover:text-white text-sm font-black border border-gray-200 transition-colors shadow-sm group"
                  >
                    <PhoneCall size={16} className="text-[#3AB000] group-hover:text-white" />
                    +91 {num}
                  </a>
                ))}
                {(!viewContactsDoctor.contactNumbers || viewContactsDoctor.contactNumbers.length === 0) && (
                  <p className="text-xs text-center text-gray-500 font-bold bg-gray-50 py-3 rounded-lg border border-gray-100">
                    No contact numbers available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CardholderDoctorConsult;
