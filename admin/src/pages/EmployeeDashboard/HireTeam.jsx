import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../auth/AuthProvider";
import { apiRequest, jobPostingsAPI } from "../../utils/api";
import { toast } from "react-hot-toast";
import { 
  Users, 
  Copy, 
  CheckCircle2, 
  ExternalLink,
  Loader2,
  TrendingUp,
  AlertCircle,
  Link as LinkIcon,
  FileText,
  Wallet,
  ArrowRight
} from "lucide-react";
import axios from "axios";

const GREEN = "#3AB000";

const HireTeam = () => {
  const { employeeProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [sysConfig, setSysConfig] = useState(null);
  const [activeTab, setActiveTab] = useState("refer"); // 'refer' or 'track'
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [selectedRef, setSelectedRef] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const authData = JSON.parse(localStorage.getItem("jssa_auth") || "{}");
      const token = authData.token;

      // 1. Fetch system config for bonus amount
      try {
        const sysRes = await axios.get(`${import.meta.env.VITE_API_URL}/system-config/current`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (sysRes.data?.success) {
          setSysConfig(sysRes.data.data);
        }
      } catch (err) {
        console.error("Config fetch error", err);
      }

      // 2. Fetch Active Jobs
      const jobsRes = await jobPostingsAPI.getAll({ status: "Active", limit: 100 });
      if (jobsRes.success && jobsRes.data?.postings) {
        // Filter jobs by the 3 specific roles if needed, or just show all active
        const relevantJobs = jobsRes.data.postings.filter(j => {
          const title = (j.title || j.post?.en || "").toLowerCase();
          return title.includes("district manager") || 
                 title.includes("block supervisor") || 
                 title.includes("panchayat executive");
        });
        // Use filtered or all, keep the original order (or chronological) and take the last 3
        let jobsToDisplay = relevantJobs.length > 0 ? relevantJobs : jobsRes.data.postings;
        jobsToDisplay = jobsToDisplay.slice(-3);
        
        setJobs(jobsToDisplay);
      }

      // 3. Fetch Referrals
      const refsRes = await apiRequest("/employees/my-referrals", { method: "GET" });
      if (refsRes.success === false) {
        toast.error("Failed to fetch referrals");
      } else {
        setReferrals(refsRes || []);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (jobId) => {
    // Ensure the referral link points to the public site, not the employee dashboard
    let baseUrl = window.location.origin;
    if (baseUrl.includes('account.jssabhiyan.com')) {
      baseUrl = baseUrl.replace('account.jssabhiyan.com', 'jssabhiyan.com');
    }
    
    const link = `${baseUrl}/job-postings/view/${jobId}?ref=${employeeProfile?._id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(jobId);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 3000);
  };

  const getStatusColor = (status, mouStatus) => {
    if (mouStatus === "ConvertedEmployee") return "bg-green-100 text-green-700";
    if (mouStatus === "paid") return "bg-blue-100 text-blue-700";
    if (status === "Approved") return "bg-emerald-100 text-emerald-700";
    if (status === "Rejected") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const getStatusText = (status, mouStatus) => {
    if (mouStatus === "ConvertedEmployee") return "Hired / Onboarded";
    if (mouStatus === "paid") return "MOU Paid";
    if (status) return status;
    return "Pending";
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b-4 border-[#3AB000] pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
              Hire <span className="text-[#3AB000]">Team</span>
            </h1>
            <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.3em] mt-1">
              Refer candidates & build your team
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab("refer")}
            className={`px-8 py-3 text-sm font-black uppercase tracking-widest transition-colors relative ${
              activeTab === "refer" 
                ? "text-[#3AB000] bg-white border-x-2 border-t-4 border-[#3AB000] -mb-[2px] border-b-2 border-b-white z-10" 
                : "text-gray-500 hover:bg-gray-50 border-x-2 border-t-2 border-transparent border-b-2 border-b-transparent hover:text-gray-900"
            }`}
          >
            Generate Links
          </button>
          <button
            onClick={() => setActiveTab("track")}
            className={`px-8 py-3 text-sm font-black uppercase tracking-widest transition-colors relative ${
              activeTab === "track" 
                ? "text-[#3AB000] bg-white border-x-2 border-t-4 border-[#3AB000] -mb-[2px] border-b-2 border-b-white z-10" 
                : "text-gray-500 hover:bg-gray-50 border-x-2 border-t-2 border-transparent border-b-2 border-b-transparent hover:text-gray-900"
            }`}
          >
            My Referrals
            {referrals.length > 0 && (
              <span className="ml-2 bg-[#3AB000] text-white px-2 py-0.5 text-[10px] rounded-none">
                {referrals.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-[#3AB000]" size={32} />
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {activeTab === "refer" && (
              <>
                {/* Bonus Banner */}
            {sysConfig?.referralBonusAmount > 0 && (
              <div className="bg-[#3AB000]/10 border border-[#3AB000]/20 rounded-none p-6 flex flex-col md:flex-row items-center gap-6 justify-between animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-[#3AB000] rounded-none text-white shadow-lg">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-gray-900">Refer & Earn Program Active!</h4>
                    <p className="text-sm text-gray-600 font-medium mt-1">
                      Share the links below. You earn <span className="font-bold text-[#3AB000] text-lg">₹{sysConfig.referralBonusAmount}</span> for every candidate who successfully joins the team!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* How It Works - Step-by-step Guide */}
            {sysConfig?.referralBonusAmount > 0 && (
              <div className="bg-white border border-gray-200 rounded-none p-6 animate-in fade-in slide-in-from-bottom-3">
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <AlertCircle size={16} className="text-[#3AB000]" />
                  How do I get my Commission?
                </h4>
                
                <div className="flex flex-col md:flex-row items-start md:items-start justify-between gap-6 relative mt-8">
                  {/* Connecting Line (hidden on mobile) */}
                  <div className="hidden md:block absolute top-[24px] left-[10%] right-[10%] h-[3px] bg-gray-100 z-0"></div>
                  
                  {/* Step 1 */}
                  <div className="flex flex-col items-center text-center w-full relative z-10 group cursor-default">
                    <div className="w-12 h-12 bg-white text-gray-600 rounded-none flex items-center justify-center mb-4 shadow-sm border-2 border-gray-200 group-hover:border-[#3AB000] group-hover:text-[#3AB000] transition-all duration-300">
                      <LinkIcon size={20} strokeWidth={2.5} />
                    </div>
                    <h5 className="font-black text-gray-900 text-sm mb-1.5 uppercase tracking-wide">1. Share Link</h5>
                    <p className="text-xs text-gray-500 font-medium px-4 leading-relaxed">Copy your unique referral link and share it with candidates.</p>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center text-center w-full relative z-10 group cursor-default">
                    <div className="w-12 h-12 bg-white text-gray-600 rounded-none flex items-center justify-center mb-4 shadow-sm border-2 border-gray-200 group-hover:border-[#3AB000] group-hover:text-[#3AB000] transition-all duration-300">
                      <Users size={20} strokeWidth={2.5} />
                    </div>
                    <h5 className="font-black text-gray-900 text-sm mb-1.5 uppercase tracking-wide">2. Form & Exam</h5>
                    <p className="text-xs text-gray-500 font-medium px-4 leading-relaxed">Candidate fills the form using your link & clears the exam.</p>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center text-center w-full relative z-10 group cursor-default">
                    <div className="w-12 h-12 bg-white text-gray-600 rounded-none flex items-center justify-center mb-4 shadow-sm border-2 border-gray-200 group-hover:border-[#3AB000] group-hover:text-[#3AB000] transition-all duration-300">
                      <FileText size={20} strokeWidth={2.5} />
                    </div>
                    <h5 className="font-black text-gray-900 text-sm mb-1.5 uppercase tracking-wide">3. MOU Details</h5>
                    <p className="text-xs text-gray-500 font-medium px-4 leading-relaxed">Candidate successfully submits their MOU details and fee.</p>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center text-center w-full relative z-10 group cursor-default">
                    <div className="w-12 h-12 bg-[#3AB000] text-white rounded-none flex items-center justify-center mb-4 shadow-md border-4 border-green-50 relative group-hover:scale-110 transition-transform duration-300">
                      <Wallet size={20} strokeWidth={2.5} />
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-none animate-ping opacity-75"></div>
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#3AB000] rounded-none border-2 border-white"></div>
                    </div>
                    <h5 className="font-black text-[#3AB000] text-sm mb-1.5 uppercase tracking-wide">4. Instant Bonus!</h5>
                    <p className="text-xs text-gray-600 font-bold px-4 leading-relaxed">₹{sysConfig.referralBonusAmount} is instantly credited to your wallet!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Referral Links Section */}
            <div className="mt-8">
              <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users size={16} className="text-[#3AB000]"/>
                Generate Referral Links
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map(job => {
                  const title = job.title || job.post?.en || "Job Posting";
                  return (
                    <div key={job._id} className="bg-white border border-gray-200 rounded-none p-5 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase tracking-wider">
                            Advt: {job.advtNo}
                          </span>
                          <h5 className="font-bold text-gray-900 leading-tight">{title}</h5>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => copyLink(job._id)}
                        className={`w-full py-2.5 px-4 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2
                          ${copiedId === job._id 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-black text-white hover:bg-[#3AB000]'
                          }`}
                      >
                        {copiedId === job._id ? (
                          <>
                            <CheckCircle2 size={14} /> Link Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Copy Apply Link
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
                {jobs.length === 0 && (
                  <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 rounded-none border border-dashed border-gray-300">
                    <AlertCircle className="mx-auto mb-2 text-gray-400" size={24} />
                    <p className="text-sm font-medium">No active job postings found.</p>
                  </div>
                )}
              </div>
            </div>
              </>
            )}

            {/* Tracking Table Section */}
            {activeTab === "track" && (
            <div className="mt-4">
              <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-[#3AB000]"/>
                My Referrals Tracking
              </h4>
              <div className="bg-white border border-gray-200 rounded-none overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-black tracking-wider">
                      <tr>
                        <th className="px-4 py-3 w-[25%]">Candidate</th>
                        <th className="px-4 py-3 w-[25%]">Applied For</th>
                        <th className="px-4 py-3 w-[25%]">Progress</th>
                        <th className="px-4 py-3 w-[15%]">Date</th>
                        <th className="px-4 py-3 w-[10%] text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {referrals.map((ref) => (
                        <tr key={ref._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900">{ref.candidateName}</div>
                            <div className="text-xs text-gray-500">{ref.mobile}</div>
                          </td>
                          <td className="px-4 py-3">
                              <div className="w-[200px] md:w-[250px]">
                                <span className="inline-flex text-[11px] font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-none whitespace-normal leading-tight border border-gray-200">
                                  {ref.jobPostingId?.title || ref.jobPostingId?.post?.en || "Unknown"}
                                </span>
                              </div>
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              let progress = { step: 1, text: "App Fee Pending", desc: "Waiting for app fee", color: "bg-gray-100 text-gray-700 border-gray-200" };
                              if (ref.mouStatus === "paid") {
                                progress = { step: 4, text: "Completed", desc: "Bonus Credited!", color: "bg-green-100 text-green-700 border-green-200" };
                              } else if (ref.status === "Approved") {
                                progress = { step: 3, text: "MOU Pending", desc: "Waiting for MOU fee", color: "bg-blue-100 text-blue-700 border-blue-200" };
                              } else if (ref.paymentStatus === "paid") {
                                progress = { step: 2, text: "Exam Pending", desc: "Waiting for exam clear", color: "bg-orange-100 text-orange-700 border-orange-200" };
                              } else if (ref.status === "Rejected") {
                                progress = { step: 0, text: "Rejected", desc: "Application rejected", color: "bg-red-100 text-red-700 border-red-200" };
                              }
                              
                              return (
                                  <div className="flex flex-col gap-1 w-[160px]">
                                    <button 
                                      onClick={() => {
                                        setSelectedRef(ref);
                                        setTrackingModalOpen(true);
                                      }}
                                      className={`group relative flex flex-col items-center justify-center w-full py-1.5 px-3 border-2 rounded-none transition-all cursor-pointer ${progress.color} hover:shadow-md`}
                                    >
                                      <span className="text-[11px] font-black uppercase tracking-wider">{progress.text}</span>
                                      <span className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-80 flex items-center gap-1 group-hover:text-[#3AB000] transition-colors">
                                        View Progress <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                                      </span>
                                    </button>
                                  </div>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-[11px] font-medium whitespace-nowrap">
                            {new Date(ref.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${getStatusColor(ref.status, ref.mouStatus)}`}>
                              {getStatusText(ref.status, ref.mouStatus)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {referrals.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-gray-500 text-sm">
                            You haven't referred any candidates yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            )}

          </div>
        )}
      </div>

      {/* Progress Tracking Modal */}
      {trackingModalOpen && selectedRef && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-black text-gray-900 text-lg">Referral Progress</h3>
                <p className="text-xs text-gray-500 font-medium">Tracking: {selectedRef.candidateName}</p>
              </div>
              <button 
                onClick={() => setTrackingModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-none p-2 transition-colors border border-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {(() => {
                let currentStep = 1;
                if (selectedRef.status === "Rejected") currentStep = 0;
                else if (selectedRef.mouStatus === "paid") currentStep = 4;
                else if (selectedRef.status === "Approved") currentStep = 3;
                else if (selectedRef.paymentStatus === "paid") currentStep = 2;

                const steps = [
                  { num: 1, title: "Application Fee Paid", desc: "Candidate paid the initial form fee", done: currentStep > 1 || currentStep === 4, active: currentStep === 1 },
                  { num: 2, title: "Exam Cleared", desc: "Candidate passed the examination", done: currentStep > 2 || currentStep === 4, active: currentStep === 2 },
                  { num: 3, title: "MOU Fee Paid", desc: "Candidate submitted MOU and paid fee", done: currentStep >= 3 && currentStep === 4, active: currentStep === 3 },
                  { num: 4, title: "Bonus Credited", desc: "Bonus instantly added to your wallet!", done: currentStep === 4, active: currentStep === 4, isLast: true }
                ];

                if (currentStep === 0) {
                  return (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-none flex items-center justify-center mx-auto mb-4">
                        ✕
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">Application Rejected</h4>
                      <p className="text-sm text-gray-500">Unfortunately, this candidate's application was rejected and cannot proceed further.</p>
                    </div>
                  )
                }

                return (
                  <div className="relative border-l-2 border-gray-100 ml-4 space-y-8">
                    {steps.map((step, idx) => (
                      <div key={idx} className="relative pl-8">
                        {/* Circle */}
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-none border-2 bg-white ${
                          step.done ? 'border-[#3AB000] bg-[#3AB000]' : 
                          step.active ? 'border-[#3AB000] bg-white ring-4 ring-green-50' : 
                          'border-gray-300'
                        }`}>
                          {step.done && <CheckCircle2 size={12} className="text-white absolute -top-[2px] -left-[2px] w-full h-full p-[1px]" />}
                        </div>
                        
                        {/* Connecting Line Override for Done */}
                        {step.done && !step.isLast && (
                          <div className="absolute -left-[2px] top-5 w-0.5 h-[calc(100%+16px)] bg-[#3AB000]"></div>
                        )}

                        <div>
                          <h4 className={`text-sm font-bold ${step.done || step.active ? 'text-gray-900' : 'text-gray-400'}`}>
                            {step.title}
                          </h4>
                          <p className={`text-xs mt-1 ${step.done || step.active ? 'text-gray-600' : 'text-gray-400'}`}>
                            {step.desc}
                          </p>
                          {step.active && step.num < 4 && (
                            <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-wider text-[#3AB000] bg-[#3AB000]/10 px-2 py-1 rounded">
                              In Progress...
                            </span>
                          )}
                          {step.isLast && step.done && (
                            <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-wider text-green-700 bg-green-100 px-2 py-1 rounded border border-green-200">
                              ₹{sysConfig?.referralBonusAmount || 100} Credited!
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            
            <div className="bg-gray-50 p-4 border-t border-gray-200 text-center">
              <button 
                onClick={() => setTrackingModalOpen(false)}
                className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-none font-bold text-sm transition-colors"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default HireTeam;
