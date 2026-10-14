import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { createPaperAPI } from "../utils/api";

const BroadcastContext = createContext();

export const useBroadcast = () => useContext(BroadcastContext);

export const BroadcastProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);
  const pollingRef = useRef({});

  // Add a new job to tracking
  const addJob = (job) => {
    setJobs((prev) => {
      // Avoid duplicates
      if (prev.find((j) => j._id === job._id)) return prev;
      return [...prev, job];
    });
  };

  // Control a job (pause, resume, cancel)
  const controlJob = async (jobId, action) => {
    try {
      const res = await createPaperAPI.controlBroadcast(jobId, action);
      if (res?.success) {
        if (action === "cancel") {
          removeJob(jobId);
        } else {
          updateJobState(jobId, res.data);
        }
      }
    } catch (err) {
      console.error(`Control error for job ${jobId}:`, err);
    }
  };

  const removeJob = (jobId) => {
    setJobs((prev) => prev.filter((j) => j._id !== jobId));
    if (pollingRef.current[jobId]) {
      clearInterval(pollingRef.current[jobId]);
      delete pollingRef.current[jobId];
    }
  };

  const updateJobState = (jobId, newData) => {
    setJobs((prev) =>
      prev.map((j) => (j._id === jobId ? { ...j, ...newData } : j))
    );
  };

  // Auto-fetch active jobs on mount (for page refresh support)
  useEffect(() => {
    const fetchActiveJobs = async () => {
      try {
        const res = await createPaperAPI.getActiveBroadcasts();
        if (res?.success && res.data.length > 0) {
          setJobs(res.data);
        }
      } catch (err) {
        console.error("Error fetching active jobs:", err);
      }
    };
    fetchActiveJobs();
  }, []);

  // Polling logic for each job
  useEffect(() => {
    jobs.forEach((job) => {
      if (
        (job.status === "processing" || job.status === "paused" || job.status === "pending") &&
        !pollingRef.current[job._id]
      ) {
        pollingRef.current[job._id] = setInterval(async () => {
          try {
            const res = await createPaperAPI.getBroadcastStatus(job._id);
            if (res?.success) {
              updateJobState(job._id, res.data);
              
              // If finished or failed, stop polling after a delay
              if (res.data.status === "completed" || res.data.status === "failed") {
                clearInterval(pollingRef.current[job._id]);
                delete pollingRef.current[job._id];
                
                // Keep it visible for 5 seconds then remove
                setTimeout(() => removeJob(job._id), 5000);
              }
            }
          } catch (err) {
            console.error(`Polling error for job ${job._id}:`, err);
          }
        }, 3000);
      }
    });

    return () => {
      // Cleanup on unmount (though this provider stays alive)
    };
  }, [jobs]);

  return (
    <BroadcastContext.Provider value={{ jobs, addJob, controlJob, removeJob }}>
      {children}
    </BroadcastContext.Provider>
  );
};
