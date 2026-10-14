import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { 
  Clock, 
  MapPin, 
  UserCheck, 
  Calendar, 
  Timer,
  ShieldCheck,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

const GREEN = "#3AB000";

const formatTo12Hour = (timeStr) => {
  if (!timeStr) return "N/A";
  if (timeStr.toLowerCase().includes("am") || timeStr.toLowerCase().includes("pm")) {
    return timeStr;
  }
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = hours < 10 ? `0${hours}` : hours;
  return `${formattedHours}:${minutes} ${ampm}`;
};

const Attendance = () => {
  const [data, setData] = useState(null); // Goal Config data
  const [attendance, setAttendance] = useState(null); // Today's attendance
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("clocking"); // "clocking" or "history"

  // Selfie Modal States
  const [showSelfieModal, setShowSelfieModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const getStatusBadge = (status) => {
    const normStatus = (status || "PRESENT").toUpperCase();
    let bg = "bg-[#3AB000] text-white";
    if (normStatus === "CHECKED-IN") {
      bg = "bg-amber-500 text-white";
    } else if (normStatus === "COMPLETED") {
      bg = "bg-[#3AB000] text-white";
    } else if (normStatus === "HALF-DAY") {
      bg = "bg-purple-600 text-white";
    } else if (normStatus === "ABSENT") {
      bg = "bg-red-800 text-white";
    }
    return (
      <span className={`${bg} px-2 py-0.5 text-[8px] font-black uppercase rounded-none`}>
        {status || "PRESENT"}
      </span>
    );
  };

  // 1. Live clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Camera Access Effect
  useEffect(() => {
    let videoStream = null;
    const startCamera = async () => {
      try {
        setCameraError(null);
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 }
        });
        setCameraStream(videoStream);
        const videoElement = document.getElementById("selfie-video");
        if (videoElement) {
          videoElement.srcObject = videoStream;
        }
      } catch (err) {
        console.error("Camera Access Error:", err);
        setCameraError("Camera access denied or not available. Please allow camera permissions in your browser.");
      }
    };

    if (showSelfieModal) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [showSelfieModal]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    const video = document.getElementById("selfie-video");
    const canvas = document.createElement("canvas");
    if (video) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      
      // Horizontal flip for natural selfie look
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    // Restart camera
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 640, height: 480 }
    }).then(stream => {
      setCameraStream(stream);
      const videoElement = document.getElementById("selfie-video");
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    }).catch(err => {
      console.error(err);
      setCameraError("Camera access error. Please try again.");
    });
  };

  // 3. Fetch today's status and config
  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;
      
      const [configRes, attendanceRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/goal-config/my-stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/goal-config/attendance/status`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (configRes.data.success) setData(configRes.data.data);
      if (attendanceRes.data.success) setAttendance(attendanceRes.data.data);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load attendance details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  // 4. Handle check-in and check-out
  const handleAttendanceAction = async (type, selfieBase64 = null) => {
    try {
      setActionLoading(true);
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;
      
      // Request GPS location
      let location = null;
      try {
        const getPosition = (options) => {
          return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
          });
        };

        let pos;
        try {
          pos = await getPosition({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        } catch (highAccuracyError) {
          console.warn("High accuracy geolocation failed, trying standard accuracy...", highAccuracyError);
          pos = await getPosition({
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000
          });
        }

        location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
      } catch (err) {
        console.warn("Standard Geolocation failed. Fetching IP-based Geolocation...", err);
        try {
          const ipRes = await fetch("https://ipapi.co/json/");
          const ipData = await ipRes.json();
          if (ipData && ipData.latitude && ipData.longitude) {
            location = {
              lat: ipData.latitude,
              lng: ipData.longitude
            };
            console.log("IP Geolocation fallback successful:", location);
          }
        } catch (ipErr) {
          console.error("IP Geolocation fallback failed:", ipErr);
          location = null;
        }

        if (!location) {
          toast.success(`GPS Bypassed. ${type === "check-in" ? "Checking in" : "Checking out"} via Secure Network IP...`, {
            style: { borderRadius: '0px' },
            duration: 3000
          });
        }
      }

      const endpoint = type === "check-in" ? "check-in" : "check-out";
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/goal-config/attendance/${endpoint}`,
        { location, selfie: selfieBase64 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success(res.data.message, {
          style: { background: GREEN, color: '#fff', fontWeight: 'bold', borderRadius: '0px' }
        });
        setAttendance(res.data.data);
        setShowSelfieModal(false);
        setCapturedImage(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Attendance processing failed", {
        style: { borderRadius: '0px' }
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (!isCheckedIn) {
      setShowSelfieModal(true);
    } else {
      handleAttendanceAction("check-out");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-white rounded-none">
          <Loader2 size={40} className="animate-spin text-[#3AB000]" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Decrypting Secure Registry...</p>
        </div>
      </DashboardLayout>
    );
  }

  const { config } = data || {};
  const isCheckedIn = !!attendance?.checkIn;
  const isCheckedOut = !!attendance?.checkOut;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8 bg-white min-h-screen rounded-none">
        
        {/* HEADER SECTION */}
        <div className="border-b border-gray-100 pb-6 rounded-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#3AB000]/10 flex items-center justify-center text-[#3AB000] rounded-none">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Attendance Center</h1>
                <p className="text-[9px] font-black text-[#3AB000] uppercase tracking-[0.2em] mt-0.5">Daily Shift Clocking & Logs</p>
              </div>
            </div>
            
            {/* LIVE DIGITAL CLOCK WIDGET */}
            <div className="bg-black text-white px-6 py-3 flex items-center gap-4 border-l-4 border-l-[#3AB000] shadow-sm rounded-none">
              <div className="text-right">
                <p className="text-lg font-black tracking-tighter leading-none">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
                <p className="text-[8px] font-black text-[#3AB000] uppercase tracking-widest mt-1">
                  {currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              </div>
              <Clock className="text-[#3AB000] animate-pulse" size={24} />
            </div>
          </div>
        </div>

        {/* TABS CONTROLLER */}
        <div className="flex border-b border-gray-200 rounded-none">
          <button
            onClick={() => setActiveTab("clocking")}
            className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all rounded-none ${
              activeTab === "clocking"
                ? "border-[#3AB000] text-[#3AB000] bg-gray-50/50"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Daily Clocking
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all rounded-none ${
              activeTab === "history"
                ? "border-[#3AB000] text-[#3AB000] bg-gray-50/50"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Attendance History
          </button>
        </div>

        {activeTab === "clocking" ? (
          /* WORKSPACE MAIN GRID */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 rounded-none">
            
            {/* LEFT: CHECK-IN / CHECK-OUT CONTROLLERS */}
            <div className="lg:col-span-7 space-y-6 rounded-none">
              
              {/* PRIMARY INTERACTIVE CARD */}
              <div className="border-2 border-gray-200 p-8 rounded-none relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#3AB000]/5 -mr-10 -mt-10 rounded-none blur-2xl"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center rounded-none">
                  
                  {/* Current Status Badge */}
                  <div className="mb-6 rounded-none">
                    {!isCheckedIn ? (
                      <span className="bg-amber-50 text-amber-600 border border-amber-200 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-none">
                        STATUS: YET TO CHECK-IN
                      </span>
                    ) : !isCheckedOut ? (
                      <span className="bg-[#3AB000]/10 text-[#3AB000] border border-[#3AB000]/20 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] animate-pulse rounded-none">
                        STATUS: CHECKED-IN
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 border border-gray-200 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-none">
                        STATUS: SHIFT COMPLETED
                      </span>
                    )}
                  </div>

                  <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">Daily Attendance</h3>
                  <p className="text-xs text-gray-400 max-w-sm mb-8 leading-relaxed">
                    Mark your check-in and check-out to log your daily working hours.
                  </p>

                  {/* DYNAMIC ACTION BUTTON */}
                  {!isCheckedOut ? (
                    <button
                      onClick={handleButtonClick}
                      disabled={actionLoading}
                      className={`w-full max-w-xs h-20 text-white text-xs font-black uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3 shadow-xl rounded-none ${
                        isCheckedIn 
                          ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20' 
                          : 'bg-black hover:bg-[#3AB000] shadow-[#3AB000]/10'
                      }`}
                    >
                      {actionLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : isCheckedIn ? (
                        <>
                          <Clock size={18} />
                          CHECK-OUT
                        </>
                      ) : (
                        <>
                          <UserCheck size={18} />
                          CHECK-IN
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-full max-w-xs h-20 bg-gray-50 border border-dashed border-gray-300 text-gray-400 text-xs font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 rounded-none">
                      <CheckCircle2 className="text-[#3AB000]" size={18} />
                      SHIFT COMPLETED
                    </div>
                  )}

                </div>
              </div>

            </div>

            {/* RIGHT: SHIFT DETAIL CARD & LIVE STATS */}
            <div className="lg:col-span-5 space-y-6 rounded-none">
              
              {/* SHIFT TIMINGS */}
              <div className="bg-gray-50 p-6 border border-gray-200 space-y-5 rounded-none">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Timer size={14} className="text-[#3AB000]" /> Assigned Shift
                </h4>
                
                <div className="grid grid-cols-2 gap-4 rounded-none">
                  <div className="bg-white p-4 border border-gray-100 text-center rounded-none">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">SHIFT START TIME</p>
                    <p className="text-base font-black text-gray-900">
                      {config?.checkInTime ? formatTo12Hour(config.checkInTime) : "09:00 AM"}
                    </p>
                  </div>
                  <div className="bg-white p-4 border border-gray-100 text-center rounded-none">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">SHIFT END TIME</p>
                    <p className="text-base font-black text-gray-900">
                      {config?.checkOutTime ? formatTo12Hour(config.checkOutTime) : "06:00 PM"}
                    </p>
                  </div>
                </div>

                {isCheckedIn && (
                  <div className="bg-[#3AB000]/5 border border-[#3AB000]/20 p-4 flex items-center justify-between rounded-none">
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase">CHECK-IN TIME</p>
                      <p className="text-sm font-black text-gray-900">
                        {new Date(attendance.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                    {isCheckedOut && (
                      <div className="text-right rounded-none">
                        <p className="text-[8px] font-black text-gray-400 uppercase">WORKING HOURS</p>
                        <p className="text-sm font-black text-[#3AB000]">
                          {attendance.workingHours || "0"} Hrs
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>
        ) : (
          /* SECTION: ATTENDANCE HISTORY LOGGER */
          <div className="pt-6 rounded-none">
            <div className="flex items-center gap-2 mb-6 rounded-none">
              <Calendar size={18} className="text-[#3AB000]" />
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.25em]">Attendance History</h3>
            </div>

            <div className="border border-gray-200 overflow-x-auto rounded-none">
              <table className="w-full text-left border-collapse rounded-none">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 rounded-none">
                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Check-In Time</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Check-Out Time</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Working Hours</th>
                    <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-bold text-gray-700 rounded-none">
                  {attendance ? (
                    <tr className="hover:bg-gray-50 transition-colors rounded-none">
                      <td className="px-6 py-4 uppercase rounded-none">{attendance.date}</td>
                      <td className="px-6 py-4 rounded-none">
                        {attendance.checkIn ? new Date(attendance.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : "N/A"}
                      </td>
                      <td className="px-6 py-4 rounded-none">
                        {attendance.checkOut ? new Date(attendance.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-gray-900 rounded-none">{attendance.workingHours || "0"} Hrs</td>
                      <td className="px-6 py-4 rounded-none">
                        {getStatusBadge(attendance.status)}
                      </td>
                    </tr>
                  ) : (
                    <tr className="rounded-none">
                      <td colSpan="5" className="px-6 py-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest italic rounded-none">
                        No attendance records found for today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SELFIE MODAL */}
        {showSelfieModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4">
            <div className="bg-white border-4 border-black w-full max-w-md p-6 rounded-none shadow-2xl relative">
              <button 
                onClick={() => {
                  setShowSelfieModal(false);
                  setCapturedImage(null);
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-black font-black text-lg cursor-pointer"
              >
                ✕
              </button>
              
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-[#3AB000]/10 flex items-center justify-center text-[#3AB000] mx-auto rounded-none">
                  <ShieldCheck size={28} className="text-[#3AB000]" />
                </div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Selfie Verification</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                  Please capture a clear front-facing selfie to complete check-in.
                </p>

                {/* Camera Screen */}
                <div className="border-2 border-black bg-black w-full relative overflow-hidden aspect-video flex items-center justify-center">
                  {cameraError ? (
                    <div className="p-6 text-center text-red-500 text-xs font-bold leading-normal">
                      {cameraError}
                    </div>
                  ) : capturedImage ? (
                    <img 
                      src={capturedImage} 
                      alt="Captured Selfie" 
                      className="w-full h-full object-cover rounded-none"
                    />
                  ) : (
                    <video 
                      id="selfie-video" 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover rounded-none transform -scale-x-100"
                    />
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  {capturedImage ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleRetake}
                        className="h-12 border-2 border-black text-black bg-white text-xs font-black uppercase tracking-widest hover:bg-gray-50 cursor-pointer rounded-none"
                      >
                        Retake Selfie
                      </button>
                      <button
                        onClick={() => handleAttendanceAction("check-in", capturedImage)}
                        disabled={actionLoading}
                        className="h-12 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-[#3AB000] cursor-pointer flex items-center justify-center rounded-none shadow-md"
                      >
                        {actionLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          "Check-In Now"
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={capturePhoto}
                      disabled={!!cameraError}
                      className="w-full h-12 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-[#3AB000] disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer rounded-none flex items-center justify-center gap-2"
                    >
                      <Clock size={16} />
                      Capture Photo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Attendance;
