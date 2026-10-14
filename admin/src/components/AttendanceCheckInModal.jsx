import React, { useState, useEffect } from "react";
import { Clock, ShieldCheck, Loader2, UserCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../auth/AuthProvider";
import jssaLogo from "../assets/jssa-logo-long.png";

const GREEN = "#3AB000";

const AttendanceCheckInModal = () => {
  const { role, isAuthenticated, employeeProfile, profileLoading } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState(true); // Default to true to prevent screen flashes on initial mount
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Selfie / Camera States
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  // Employee & administrative staff must check in before using the portal
  const needsAttendance = isAuthenticated && (role === "employee" || role === "staff");

  // 1. Live digital clock update
  useEffect(() => {
    if (!needsAttendance) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [needsAttendance]);

  // 2. Fetch today's check-in status on mount
  const checkStatus = async () => {
    if (!needsAttendance) {
      setCheckingStatus(false);
      return;
    }

    try {
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;
      if (!token) {
        setCheckingStatus(false);
        return;
      }

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/goal-config/attendance/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const attendance = res.data.data;
        // If they have checkIn registered for today, isCheckedIn becomes true
        setIsCheckedIn(!!attendance?.checkIn);
      }
    } catch (error) {
      console.error("Error checking attendance status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [needsAttendance]);

  useEffect(() => {
    const onStatusChange = () => checkStatus();
    window.addEventListener("attendance_status_changed", onStatusChange);
    return () => window.removeEventListener("attendance_status_changed", onStatusChange);
  }, [needsAttendance]);

  // 3. Camera Streaming lifecycle
  useEffect(() => {
    if (!needsAttendance || isCheckedIn || checkingStatus) return;

    let videoStream = null;
    const startCamera = async () => {
      try {
        setCameraError(null);
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 }
        });
        setCameraStream(videoStream);
        const videoElement = document.getElementById("modal-selfie-video");
        if (videoElement) {
          videoElement.srcObject = videoStream;
        }
      } catch (err) {
        console.error("Camera Access Error:", err);
        setCameraError("Camera access denied or unavailable. Please enable browser camera permissions to proceed.");
      }
    };

    startCamera();

    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [needsAttendance, isCheckedIn, checkingStatus]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    const video = document.getElementById("modal-selfie-video");
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
    // Restart camera feed
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 640, height: 480 }
    }).then(stream => {
      setCameraStream(stream);
      const videoElement = document.getElementById("modal-selfie-video");
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    }).catch(err => {
      console.error(err);
      setCameraError("Camera access error. Please try again.");
    });
  };

  // 4. Geolocation & Check-In Action
  const handleCheckIn = async (selfieBase64) => {
    try {
      setActionLoading(true);
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;

      // Geolocation check with fallbacks
      let location = null;
      try {
        const getPosition = (options) => {
          return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
          });
        };

        const pos = await getPosition({
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0
        });

        location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
      } catch (err) {
        console.warn("Standard geolocation failed, falling back to secure Network IP lookup...", err);
        try {
          const ipRes = await fetch("https://ipapi.co/json/");
          const ipData = await ipRes.json();
          if (ipData && ipData.latitude && ipData.longitude) {
            location = {
              lat: ipData.latitude,
              lng: ipData.longitude
            };
          }
        } catch (ipErr) {
          console.error("IP fallback geolocation failed:", ipErr);
        }
      }

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/goal-config/attendance/check-in`,
        { location, selfie: selfieBase64 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success("Checked in successfully! (सफलतापूर्वक चेक-इन हो गया)", {
          style: { background: GREEN, color: '#fff', fontWeight: 'bold', borderRadius: '0px' }
        });
        setIsCheckedIn(true);
        stopCamera();
        
        // Dispatch custom event to notify other components (e.g. Attendance widget on dashboard)
        window.dispatchEvent(new Event("attendance_status_changed"));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Check-in failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Inactive / terminated — wait for fresh profile (EmployeeAccountStatusBlocker handles block)
  if (
    profileLoading ||
    (role === "employee" &&
      employeeProfile &&
      (employeeProfile.status === "Inactive" ||
        employeeProfile.status === "Terminated" ||
        employeeProfile.status === "Resigned"))
  ) {
    return null;
  }

  // Guard: block portal until daily check-in (employee or staff)
  if (!needsAttendance || checkingStatus || isCheckedIn) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden select-none">
      <div className="bg-white border-t-8 border-t-[#3AB000] border-x border-b border-gray-200 w-full max-w-md p-8 rounded-none relative animate-in zoom-in duration-300">
        
        <div className="text-center space-y-4">
          {/* JSSA Logo Header */}
          <div className="mb-4">
            <img 
              src={jssaLogo} 
              alt="JSSA Logo" 
              className="h-20 object-contain mx-auto" 
            />
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
            Daily Duty Check-In
          </h2>
          <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.2em] leading-relaxed">
            MANDATORY ATTENDANCE PROTOCOL <br />
            (कार्य प्रारंभ करने के लिए चेक-इन करें)
          </p>

          {/* Live Digital Clock Widget */}
          <div className="bg-green-50/40 border border-green-200 border-l-4 border-l-[#3AB000] text-gray-800 px-4 py-3 flex items-center justify-center gap-3 rounded-none my-2">
            <Clock className="text-[#3AB000] animate-pulse" size={18} />
            <div className="text-left">
              <span className="text-lg font-black tracking-tight leading-none block text-gray-800">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Camera View Screen */}
          <div className="border-2 border-[#3AB000] bg-black w-full relative overflow-hidden aspect-video flex items-center justify-center mt-4 rounded-none">
            {/* Live Indicator overlay */}
            {!cameraError && !capturedImage && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#3AB000] px-2.5 py-1 border border-[#2b8000] rounded-none z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[8px] font-black text-white uppercase tracking-widest">LIVE FEED</span>
              </div>
            )}
            
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
                id="modal-selfie-video" 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover rounded-none transform -scale-x-100"
              />
            )}
          </div>

          {/* Action Button Controls */}
          <div className="space-y-3 pt-3">
            {capturedImage ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="h-12 border-2 border-red-500 text-red-500 bg-white text-xs font-black uppercase tracking-widest hover:bg-red-50 cursor-pointer rounded-none transition-all"
                >
                  Retake Selfie
                </button>
                <button
                  type="button"
                  onClick={() => handleCheckIn(capturedImage)}
                  disabled={actionLoading}
                  className="h-12 bg-[#3AB000] hover:bg-[#2b8000] text-white text-xs font-black uppercase tracking-widest cursor-pointer flex items-center justify-center rounded-none border-2 border-[#3AB000] transition-all"
                >
                  {actionLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "SUBMIT & START"
                  )}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!!cameraError}
                className="w-full h-12 bg-[#3AB000] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2b8000] border-2 border-[#3AB000] disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer rounded-none flex items-center justify-center gap-2 transition-all"
              >
                <UserCheck size={16} />
                Capture Selfie
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCheckInModal;
