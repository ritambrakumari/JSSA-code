import React, { useState, useEffect, useRef } from "react";
import { useBroadcast } from "../context/BroadcastContext";
import { 
  RefreshCw, 
  Pause, 
  Play, 
  Square, 
  CheckCircle2, 
  AlertCircle,
  Bell,
  X,
  GripHorizontal
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

const BroadcastJobCard = ({ job, controlJob, removeJob, index }) => {
  // Individual Dragging State for each card
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [rel, setRel] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const x = e.pageX - rel.x;
      const y = e.pageY - rel.y;
      setPosition({ x, y });
      e.preventDefault();
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, rel]);

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    const pos = cardRef.current.getBoundingClientRect();
    setRel({
      x: e.pageX - pos.left,
      y: e.pageY - pos.top
    });
    setIsDragging(true);
    e.preventDefault();
  };

  // Calculate default stacking position based on index if not dragged yet
  const cardStyle = {
    position: "fixed",
    bottom: position.y === 0 ? `${24 + (index * 200)}px` : "auto", // Stack from bottom with more gap
    right: position.x === 0 ? "24px" : "auto",
    left: position.x !== 0 ? `${position.x}px` : "auto",
    top: position.y !== 0 ? `${position.y}px` : "auto",
    zIndex: isDragging ? 10000 : 9999,
    width: "320px",
    pointerEvents: "auto",
    transition: isDragging ? "none" : "bottom 0.3s ease-out, right 0.3s ease-out"
  };

  return (
    <div 
      ref={cardRef}
      style={cardStyle}
      className="bg-black text-white shadow-2xl border-b-4 border-[#3AB000] overflow-hidden animate-in slide-in-from-right-10 duration-500"
    >
      {/* Header - Drag Handle */}
      <div 
        onMouseDown={onMouseDown}
        className={`px-4 py-3 flex items-center justify-between border-b border-white/10 bg-[#1a1a1a] select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal size={14} className="text-gray-500" />
          {job.status === "processing" || job.status === "pending" ? (
            <RefreshCw size={14} className="animate-spin text-[#3AB000]" />
          ) : job.status === "completed" ? (
            <CheckCircle2 size={14} className="text-[#3AB000]" />
          ) : job.status === "paused" ? (
            <Pause size={14} className="text-amber-500" />
          ) : (
            <AlertCircle size={14} className="text-red-500" />
          )}
          <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px]">
            {job.title || "Campaign"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-[#3AB000] bg-white/5 px-2 py-0.5 rounded border border-[#3AB000]/20">
            {Math.round((job.sentCount / (job.totalCandidates || 1)) * 100)}%
          </span>
          {(job.status === "completed" || job.status === "failed") && (
            <button onClick={() => removeJob(job._id)} className="text-white/40 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        <div className="flex justify-between text-[11px] font-bold">
          <span className="text-gray-400">
            {job.status === "completed" 
              ? "Campaign Finished Successfully" 
              : job.status === "paused" 
                ? "Broadcast Paused" 
                : job.status === "failed"
                  ? "Process Failed"
                  : "Delivering Messages..."}
          </span>
          <span className="text-[#3AB000]">{job.sentCount} / {job.totalCandidates}</span>
        </div>
        
        {/* Progress Bars */}
        {['meeting', 'meeting_reminder'].includes(job.jobType) ? (
          <div className="space-y-3">
            {/* Email Progress (Disabled as per request) */}
            {/* <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-white/40">
                <span>Email Delivery</span>
                <span className="text-[#3AB000]">{job.emailSentCount || 0} / {job.totalCandidates}</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#3AB000] transition-all duration-1000 ease-out shadow-[0_0_8px_#3AB000]"
                  style={{ width: `${((job.emailSentCount || 0) / (job.totalCandidates || 1)) * 100}%` }}
                />
              </div>
            </div> */}

            {/* SMS Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-white/40">
                <span>SMS Delivery</span>
                <span className="text-blue-400">{job.smsSentCount || 0} / {job.totalCandidates}</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000 ease-out shadow-[0_0_8px_#3B82F6]"
                  style={{ width: `${((job.smsSentCount || 0) / (job.totalCandidates || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out shadow-[0_0_10px_#3AB000] ${
                job.status === "paused" ? "bg-amber-500" : 
                job.status === "failed" ? "bg-red-500" : "bg-[#3AB000]"
              }`}
              style={{ width: `${(job.sentCount / (job.totalCandidates || 1)) * 100}%` }}
            />
          </div>
        )}
        
        {/* Controls */}
        {job.status !== "completed" && job.status !== "failed" && (
          <div className="flex items-center gap-2 pt-1">
            {job.status === "processing" || job.status === "pending" ? (
              <button 
                onClick={() => controlJob(job._id, "pause")}
                className="flex-1 bg-white/5 hover:bg-amber-500/20 text-white py-2.5 flex items-center justify-center gap-2 border border-white/10 transition-all group"
              >
                <Pause size={12} className="group-hover:text-amber-500" />
                <span className="text-[9px] font-black uppercase">Pause</span>
              </button>
            ) : (
              <button 
                onClick={() => controlJob(job._id, "resume")}
                className="flex-1 bg-[#3AB000] hover:bg-[#2d8a00] text-white py-2.5 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#3AB000]/20"
              >
                <Play size={12} />
                <span className="text-[9px] font-black uppercase">Resume</span>
              </button>
            )}
            <button 
              onClick={() => {
                if(window.confirm(`Stop this ${job.jobType === 'mou' ? 'MOU' : 'Exam'} broadcast?`)) {
                  controlJob(job._id, "cancel");
                }
              }}
              className="bg-white/5 hover:bg-red-600/20 text-white px-4 py-2.5 flex items-center justify-center gap-2 border border-white/10 transition-all group"
            >
              <Square size={12} className="group-hover:text-red-500 fill-current" />
              <span className="text-[9px] font-black uppercase">Cancel</span>
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-center gap-1.5 opacity-40">
           <Bell size={10} className="text-[#3AB000]" />
           <p className="text-[9px] font-bold uppercase tracking-widest italic">
             Background Task Active
           </p>
        </div>
      </div>
    </div>
  );
};

const FloatingBroadcastManager = () => {
  const { role } = useAuth();
  const { jobs, controlJob, removeJob } = useBroadcast();

  if (jobs.length === 0) return null;

  return (
    <>
      {jobs.map((job, index) => (
        <BroadcastJobCard 
          key={job._id} 
          job={job} 
          index={index}
          controlJob={controlJob} 
          removeJob={removeJob} 
        />
      ))}
    </>
  );
};

export default FloatingBroadcastManager;
