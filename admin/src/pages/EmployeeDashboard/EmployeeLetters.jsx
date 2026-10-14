import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { createPaperAPI, applicationsAPI, feeStructureAPI, employeesAPI, lettersAPI } from "../../utils/api";
import { useAuth } from "../../auth/AuthProvider";
import logo from "../../assets/JSSAogo.png";
import logoLong from "../../assets/jssa-logo-long.png";
import sing from "../../assets/docs/district_manger/sing.png";
import QrCode from '../../assets/QrCode.png'

import {
  Loader2,
  Download,
  Eye,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Plus,
  CreditCard,
  AlertCircle,
  X,
  Mail,
  Phone,
} from "lucide-react";
import ZoneLockEmptyState from "../../components/ZoneLockEmptyState";

// Helper to fix local/production URLs
const cleanImageUrl = (url) => {
  if (!url) return "";

  const API_BASE_URL = import.meta.env.MODE === "development"
    ? "https://api.jssabhiyan.com/api"
    : "https://api.jssabhiyan.com/api";

  // If the URL is already absolute and points to localhost, fix it for the current environment
  if (url.includes("localhost:3005/api")) {
    return url.replace("http://localhost:3005/api", API_BASE_URL);
  }

  // If it's already a full production URL and we are in development, fix it
  if (url.includes("api.jssabhiyan.com/api") && import.meta.env.MODE === "development") {
    return url.replace("https://api.jssabhiyan.com/api", API_BASE_URL);
  }

  // If it's already a full URL (and not one of our APIs that needs fixing), return as is
  if (url.startsWith("http")) {
    return url;
  }

  // If path starts with /api/, prepend the base domain
  if (url.startsWith("/api/")) {
    const base = API_BASE_URL.endsWith("/api") ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    return `${base}${url}`;
  }

  let cleanPath = url.startsWith("/") ? url.slice(1) : url;
  
  if (cleanPath.startsWith("uploads/") || cleanPath.startsWith("files/")) {
    return `${API_BASE_URL}/${cleanPath}`;
  }

  // Fallback
  return `${API_BASE_URL}/files/${cleanPath}`;
};


export const AuthorizationTemplate = ({ application, formData, empId, logo, templateRef, detectedPost }) => {
  const [goalConfigs, setGoalConfigs] = useState(null);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const tokenStr = localStorage.getItem("jssa_auth");
        const token = tokenStr ? JSON.parse(tokenStr).token : null;
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.jssabhiyan.com/api'}/goal-config/employee-configs`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data && data.data) {
          const map = {};
          data.data.forEach(item => {
            map[item.role] = item;
          });
          setGoalConfigs(map);
        }
      } catch (err) {
        console.error("Failed to fetch goal configs:", err);
      }
    };
    fetchConfigs();
  }, []);

  const targetDateStr = application?.mouPaidAt ? application.mouPaidAt : (application?.createdAt ? application.createdAt : new Date());
  const currentDate = new Date(targetDateStr).toLocaleDateString();
  const currentDateTime = new Date(targetDateStr).toLocaleString();
  const post = detectedPost || application?.post || application?.jobPostingId?.post?.en || "district manager";

  const getDMCardRateText = () => {
    if (!goalConfigs || !goalConfigs['DM']) return "₹127 for each card created by you, and ₹10 per card for each card created by the Panchayat Executive and Block Supervisor of your district.";
    const dmConfig = goalConfigs['DM'];
    const ind = dmConfig.individualCommission || 127;
    const layers = dmConfig.layeredCommissions || [];
    const bsLayer = layers.find(l => l.roleName === 'Block Supervisor' || l.roleName === 'BS')?.commission || 10;
    const peLayer = layers.find(l => l.roleName === 'Panchayat Executive' || l.roleName === 'PE')?.commission || 10;

    if (bsLayer === peLayer) {
      return `₹${ind} for each card created by you, and ₹${bsLayer} per card for each card created by the Panchayat Executive and Block Supervisor of your district.`;
    }
    return `₹${ind} for each card created by you, and ₹${peLayer} per card for each card created by the Panchayat Executive and ₹${bsLayer} per card for each card created by the Block Supervisor of your district.`;
  };

  const getBSCardRateText = () => {
    if (!goalConfigs || !goalConfigs['BS']) return "₹73 for each card created by you, and ₹10 per card for each card created by the Panchayat Executive of your Block. This amount will be credited to your wallet.";
    const bsConfig = goalConfigs['BS'];
    const ind = bsConfig.individualCommission || 73;
    const layers = bsConfig.layeredCommissions || [];
    const peLayer = layers.find(l => l.roleName === 'Panchayat Executive' || l.roleName === 'PE')?.commission || 10;

    return `₹${ind} for each card created by you, and ₹${peLayer} per card for each card created by the Panchayat Executive of your Block. This amount will be credited to your wallet.`;
  };

  const getPECardRateText = () => {
    if (!goalConfigs || !goalConfigs['PE']) return "₹63 per card created by you will be credited to your wallet. You can transfer the credited amount from your wallet to your bank account.";
    const peConfig = goalConfigs['PE'];
    const ind = peConfig.individualCommission || 63;

    return `₹${ind} per card created by you will be credited to your wallet. You can transfer the credited amount from your wallet to your bank account.`;
  };

  const getRMCardRateText = () => {
    if (!goalConfigs || !goalConfigs['RM']) return "Applicable layered commissions for cards created by Zonal Coordinators, District Managers, Block Supervisors, and Panchayat Executives in your state.";
    const config = goalConfigs['RM'];
    const layers = config.layeredCommissions || [];

    const zcLayer = layers.find(l => l.roleName === 'Zonal Coordinator' || l.roleName === 'ZC')?.commission || 30;
    const dmLayer = layers.find(l => l.roleName === 'District Manager' || l.roleName === 'DM')?.commission || 10;
    const bsLayer = layers.find(l => l.roleName === 'Block Supervisor' || l.roleName === 'BS')?.commission || 10;
    const peLayer = layers.find(l => l.roleName === 'Panchayat Executive' || l.roleName === 'PE')?.commission || 10;

    return `₹${zcLayer} per card for each card created by the Zonal Coordinator, ₹${dmLayer} per card for each card created by the District Manager, ₹${bsLayer} per card for each card created by the Block Supervisor, and ₹${peLayer} per card for each card created by the Panchayat Executive in your state.`;
  };

  const getZCCardRateText = () => {
    if (!goalConfigs || !goalConfigs['ZC']) return "₹140 for each card created by you, and applicable layered commissions for cards created by your team.";
    const config = goalConfigs['ZC'];
    const ind = config.individualCommission || 140;
    return `₹${ind} for each card created by you, and applicable layered commissions for cards created by District Managers, Block Supervisors, and Panchayat Executives in your zone.`;
  };

  const getRMSalary = () => {
    let salary = 35500;
    if (goalConfigs && goalConfigs['RM']) {
      const rmConfig = goalConfigs['RM'];
      salary = rmConfig.baseSalary || 35500;

      const candidateState = formData?.state || '';
      if (candidateState && rmConfig.stateSalaries && rmConfig.stateSalaries.length > 0) {
        const cleanState = candidateState.split(" / ")[0].trim();
        const stateObj = rmConfig.stateSalaries.find(s => s.state?.toLowerCase() === cleanState.toLowerCase());
        if (stateObj && stateObj.salary) {
          salary = stateObj.salary;
        }
      }
    }
    return `₹${salary.toLocaleString('en-IN')} per month`;
  };

  const postDetails = {
    "regional manager": {
      refPrefix: "AL/RM",
      subj: "REGIONAL MANAGER",
      offer: "Regional Manager",
      loc: `State of ${formData?.state || ''}`,
      execTitle: "Regional Manager",
      salary: getRMSalary(),
      isRM: true,
      cardRate: getRMCardRateText(),
      footerCode: "mou_2933 Regional Manager"
    },
    "zonal coordinator": {
      refPrefix: "AL/ZC",
      subj: "ZONAL COORDINATOR",
      offer: "Zonal Coordinator",
      loc: `Zone of ${formData?.state || ''}`,
      execTitle: "Zonal Coordinator",
      salary: "₹30,500 per month",
      cardRate: getZCCardRateText(),
      footerCode: "mou_2933 Zonal Coordinator"
    },
    "district manager": {
      refPrefix: "AL",
      subj: "DISTRICT Manager",
      offer: "DISTRICT Manager",
      loc: `${formData?.district || ''}, ${formData?.state || ''}`,
      execTitle: "DISTRICT Manager",
      salary: "₹25,500 per month",
      cardRate: getDMCardRateText(),
      footerCode: "mou_2933 District Manager"
    },
    "block supervisor cum panchayat executive": {
      refPrefix: "BR/BSCPE",
      subj: "Block Supervisor Cum Panchayat Executive",
      offer: "Block Supervisor cum Panchayat Executive",
      loc: `${formData?.block || ''} Block, ${formData?.district || ''} District (${formData?.state || ''})`,
      execTitle: "Block Supervisor Cum Panchayat Executive",
      salary: "₹14,500 per month",
      cardRate: getBSCardRateText(),
      footerCode: "mou_2933 Block Supervisor HR"
    },
    "panchayat executive": {
      refPrefix: "BR/PE",
      subj: "Panchayat Executive",
      offer: "Panchayat Executive",
      loc: `${formData?.villageTola || ''}, ${formData?.block || ''} Block, ${formData?.district || ''} District (${formData?.state || ''})`,
      execTitle: "Panchayat Executive",
      salary: "₹12,500 per month",
      cardRate: getPECardRateText(),
      footerCode: "mou_2933 Panchayat Executive"
    }
  };

  const details = postDetails[post?.toLowerCase()] || postDetails["district manager"];
  const displayId = empId;

  return (
    <div className="p-12 text-[12px] leading-relaxed text-gray-800 font-sans bg-white border" ref={templateRef}>
      <div className="mb-0 -mt-6 text-left">
        <div className="text-[11px] font-bold">Ref. No. <span className="text-gray-900 uppercase font-black tracking-tighter">{displayId}</span></div>
      </div>

      <div className="text-center mb-8  mt-3">
        <img src={logoLong} alt="JSSA Header" className="w-full max-w-[450px] mx-auto" />
        <div className="w-full h-[1px] bg-green-500/30 mt-4"></div>
      </div>

      <h2 className="text-center text-lg font-black underline mb-10 uppercase tracking-widest">Letter of Authorization</h2>

      <div className="space-y-1 mb-8 text-left">
        <div>To,</div>
        <div className="flex gap-2"><span>Dear Mr./Mrs.:</span><span className="text-gray-900 font-bold uppercase border-b border-gray-300">{application?.candidateName}</span></div>
        <div className="flex gap-2"><span>S/O(D/O):</span><span className="text-gray-900 font-bold uppercase border-b border-gray-300">{application?.fatherName}</span></div>
        <div className="flex gap-2"><span>DOB:</span><span className="text-gray-900 font-bold border-b border-gray-300">{application?.dob ? new Date(application.dob).toLocaleDateString() : 'N/A'}</span></div>
        <div className="flex gap-2"><span>Application No:</span><span className="text-gray-900 font-bold border-b border-gray-300">{application?.applicationNumber}</span></div>
        <div className="flex gap-2"><span>Employee ID:</span><span className="text-gray-900 font-black border-b border-gray-300 tracking-tighter uppercase">{displayId}</span></div>
      </div>

      <div className="font-bold mb-6 text-[13px] border-l-4 border-green-600 pl-4 py-1 text-left">
        Subject: Authorization for the post of <span className="text-gray-900 uppercase font-black">{details.subj}</span> in our organization.
      </div>

      <p className="mb-4 text-justify">
        Our organization is delighted offer you the authorization of <span className="font-black underline">{details.offer}</span> for
        <span className="text-gray-900 font-black underline italic uppercase"> {details.loc} </span> on probation period for three months from the date of appointment.
        On expiry of the probationary period it is open for the management either to confirm your services or extend your probationary period.
        Such an extension can be granted for a maximum of 11 months more. The Management, however, reserves the right to terminate your services
        without assigning any reason during the probationary period, or the extended probationary period. However, during the probation period,
        services can be discontinued without any notice.
      </p>

      <p className="mb-4">Your selection has been made on the basis of educational qualification, experience and interview.</p>

      <p className="mb-4 text-justify italic font-medium leading-relaxed">As the <span className="font-black underline uppercase text-gray-900">{details.execTitle}</span>, you will be responsible for full-fill the target of our organization's project JAN SWASTHYA SAHAYATA ABHIYAN in your jurisdiction where you are posted & follow the instructions of your senior officer.</p>

      <p className="mb-4">Your employment with our organization will be on contract basis, which means you and the organization are free to terminate employment at any time, with or without cause or advance notice.</p>

      <div className="mb-4 font-bold border-l-4 border-green-600 pl-4 bg-green-50 p-4 rounded-r-lg shadow-sm">
        {!details.hideSalary && (
          <p>
            {details.isRM
              ? `If your team achieves 50% of their monthly target, your income will be `
              : `If you meet the monthly target set by the organization, your initial income will be `}
            <span className="text-green-600 font-black text-base">{details.salary}</span>.
          </p>
        )}
        <p className={`text-[11px] text-gray-600 font-medium leading-relaxed italic ${!details.hideSalary ? 'mt-1 border-t border-green-100 pt-1' : ''}`}>
          {!details.hideSalary ? (details.isRM ? "If your team does not achieve the 50% target, then " : "If you do not meet the monthly target set by the organization, then ") : ""}
          <span className="text-gray-800">{details.cardRate}</span>
        </p>
      </div>

      <p className="mb-6 leading-relaxed">
        In addition to the national holiday, you will be granted 18 casual leave in a year for which you will have to inform your senior officer of organization. If you are absent for 11 consecutive days in a month without notice, your service will be terminated by giving you a notice.
        You will report directly to our HR department on email: <span className="font-black text-blue-700 underline">joining.HR@JSSABHIYAN.COM</span> Working hours are from <span className="font-bold">10:00 AM</span> to <span className="font-bold">06:00PM</span> (Everyday of week)
      </p>

      <div className="my-10 p-4 border bg-gray-50 rounded italic text-center font-bold text-gray-600">
        Please confirm acceptance of this offer by signing and returning this letter within 5 days from the date of issue.
      </div>

      {/* Signature Section */}
      <div className="mt-16 relative">
        <div className="flex justify-between px-4 items-start">
          <div className="space-y-1">
            <div className="font-bold text-sm mb-2 italic underline underline-offset-4">Yours Sincerely</div>
            <div className="font-black text-green-800 text-[11px] tracking-tighter mb-4 uppercase">JAN SWASTHYA SAHAYATA ABHIYAN</div>
            <div className="w-40 h-20 flex items-center justify-start border-b-2 border-green-100 mb-2">
              <img
                src={sing}
                alt="Authorized Signatory"
                className="max-h-full max-w-full mix-blend-multiply opacity-90 contrast-125"
              />
            </div>
            <div className="text-[9px] font-black text-blue-900 border-2 border-blue-900 px-2 py-0.5 inline-block uppercase italic mb-8 shadow-sm">
              Authorized Signatory
            </div>

            <div className="text-[10px] leading-tight space-y-1 font-bold text-gray-700 border-l-2 border-gray-200 pl-4">
              <div className="flex gap-1 items-center">
                For JAN SWASTHYA SAHAYATA ABHIYAN
                <span className="text-gray-500 font-medium text-[9px] bg-gray-100 px-2 rounded-full border border-gray-200 uppercase tracking-tighter">
                  {details.footerCode}
                </span>
              </div>
              <div className="flex gap-2">HR Department Date: <span className="text-gray-900 font-black">{currentDateTime}</span></div>
              <div className="flex gap-2">
                JAN SWASTHYA SAHAYATA ABHIYAN Place :
                <span className="text-gray-900 font-black uppercase underline">
                  {details.loc.includes('Block') ? details.loc : `${formData.district} (${formData.state})`}
                </span>
              </div>
              <div className="text-[9px] font-medium text-gray-500 mt-2 space-y-0.5 flex flex-col">
                <span>A project of Healthcare Research and Development</span>
                <span>(Organized under NAC RegNo:053083)</span>
                <span>Registered under Companies Act 2013 under the provision of section 8</span>
              </div>
            </div>
          </div>

          <div className="text-center relative">
            <div className="font-bold text-xs text-gray-400 mb-2 italic border-b border-gray-100 pb-1">Acceptance Signature</div>
            <div className="bg-sky-50 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] p-2 rounded-xl border-2 border-sky-100 mb-2 w-52 h-24 flex items-center justify-center overflow-hidden">
              {application?.signature ? (
                <img
                  src={cleanImageUrl(application.signature)}
                  alt="Candidate Signature"
                  className="max-h-full max-w-full mix-blend-multiply transition-all grayscale contrast-125 hover:grayscale-0"
                />
              ) : (
                <div className="text-[8px] text-sky-300 italic font-black uppercase tracking-widest">Digital Authentication Required</div>
              )}
            </div>
            <div className="text-gray-900 font-black text-[12px] uppercase tracking-tighter border-b-4 border-gray-400 inline-block px-4 pb-0.5">
              {application?.candidateName}
            </div>
            <div className="text-[8px] text-gray-400 font-bold uppercase mt-1 tracking-[0.2em]">Digitally Signed By Candidate</div>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-4 border-t border-gray-100 text-right text-[8px] text-gray-400 font-black italic tracking-widest">
        Page 1/2
      </div>
    </div>
  );
};

export const ConsentTemplate = ({ application, formData, empId, logo, templateRef, detectedPost }) => {
  const targetDateStr = application?.mouPaidAt ? application.mouPaidAt : (application?.createdAt ? application.createdAt : new Date());
  const currentDate = new Date(targetDateStr).toLocaleString();
  const currentDateTime = new Date(targetDateStr).toLocaleString();
  const post = detectedPost || application?.post || application?.jobPostingId?.post?.en || "district manager";

  const postConfigs = {
    "regional manager": {
      consentPost: "REGIONAL MANAGER",
      pointPost: "REGIONAL MANAGER",
      execPost: "REGIONAL MANAGER",
      footerPost: "REGIONAL MANAGER"
    },
    "zonal coordinator": {
      consentPost: "ZONAL COORDINATOR",
      pointPost: "ZONAL COORDINATOR",
      execPost: "ZONAL COORDINATOR",
      footerPost: "ZONAL COORDINATOR"
    },
    "district manager": {
      consentPost: "DISTRICT MANAGER",
      pointPost: "DISTRICT MANAGER",
      execPost: "DISTRICT MANAGER",
      footerPost: "DISTRICT MANAGER"
    },
    "block supervisor cum panchayat executive": {
      consentPost: "Block Supervisor cum Panchayat Executive",
      pointPost: "Block Supervisor cum Panchayat Executive",
      execPost: "Block Supervisor cum Panchayat Executive",
      footerPost: "Block Supervisor"
    },
    "panchayat executive": {
      consentPost: "Panchayat Executive",
      pointPost: "Panchayat Executive",
      execPost: "Panchayat Executive",
      footerPost: "Panchayat Executive"
    }
  };

  const config = postConfigs[post?.toLowerCase()] || postConfigs["district manager"];

  const points = [
    `Selection is being done by the social service organization NAC (which is registered under the Companies Act 2013 (section 8)) under JAN SWASTHYA SAHAYATA ABHIYAN against the post of ${config.pointPost}`,
    `Facilities given to permanent employees will not be admissible as ${config.pointPost}`,
    "Selection will be purely on contract basis and neither the permanent employee of the organization nor the organization will be entitled for regularization in the service.",
    "This selection will be for a probationary period of 3 months from the date of appointment. On expiry of the probationary period it is open for the management either to confirm your services or extend your probationary period. Such an extension can be granted for a maximum of 11 months more, The Management, however, reserves the right to terminate your services without assigning any reason during the probationary period, or the extended probationary period. However during the probation period, services can be discontinued without any notice.",
    "Legal action will be taken by terminating the service at any time after giving a notice to the selection received on the basis of wrong facts and papers.",
    "I have not committed a cognizable offense and have not been imprisoned in any case.",
    "selection may be terminated at any time as per the requirement or as decided by the Director of the organization.",
    "verification of wrong documents given by me, legal action will be taken against me and I will not be entitled for honorarium and incentive.",
    `The service of the selected ${config.execPost} is not satisfactory and does not follow the discipline, he will be terminated from service at any time by giving a notice.`,
    "Guidance and guidelines issued from time to time in JAN SWASTHYA SAHAYATA ABHIYAN will be effective.",
    "For each month a certain target will be given by the organization, my selection may be terminated if the target isnot met.",
    "I will be given honorarium and incentive for my service under the JAN SWASTHYA SAHAYATA ABHIYAN guideline. Apart from this, I will not make any claim of any kind",
    "I will be paid honorarium according to the monthly target by the organization, if I do not full fill the target given bythe organization, then I will not be entitled to honorarium and any kind of benefit.",
    "leavingthedistrict, Iwillinformtheconcernedofficerandactioncanbetakenagainstmeinabsencewithout notice.",
    "I will be regularly present in the review to be done by the JAN SWASTHYA SAHAYATA ABHIYAN or senior officer of the organization and action can be taken against me for giving any wrong information.",
    "Inthecaseofanycomplainttothecitizenofmyjurisdictionortheseniorofficeroftheorganization,the organization has full rights, they can take legal action against me at their discretion.",
    "I will be present in all the training and meeting as prescribed by the JAN SWASTHYA SAHAYATA ABHIYAN and senior officer of the organization.",
    "Iwillnotchargeanyextrafeefromanyotherorganizationandpersonotherthantheprescribedfeeofthisinstitution for the works prescribed in the JAN SWASTHYA SAHAYATA ABHIYAN, if I work against it, then the organization has full right to take action against me.",
    "This organization is a social service organization that works through contributions and donations, so the application fee, training fee and other expenses fees given by me as a contribution will not be refundable. I am not entitled to take this fee back from the organization.",
    `I have applied on my own free will and full discretion to work on the post of ${config.pointPost} in the organization, no pressure has been put on me for this.`
  ];

  return (
    <div className="text-[12px] leading-relaxed text-gray-800 font-sans p-12 bg-white border" ref={templateRef}>
      <div className="mb-0 text-left">
        <div className="text-[11px] font-bold uppercase">Ref. No. <span className="text-gray-900 font-black">JSSA/LC/{empId.split('/').pop()}</span></div>
      </div>

      <div className="text-center mb-8  mt-3">
        <img src={logoLong} alt="JSSA Header" className="w-full max-w-[450px] mx-auto" />
        <div className="w-full h-[1px] bg-green-500/30 mt-4"></div>
      </div>

      <h2 className="text-center text-lg font-black underline mb-6 uppercase tracking-widest">Letter of Consent</h2>

      <div className="flex gap-6 mb-8 items-start">
        <div className="flex-1 text-justify scale-y-105">
          This consent letter is being done on <span className="text-gray-900 font-bold underline underline-offset-4">{currentDate}</span> between <span className="font-bold uppercase tracking-tighter underline">JAN SWASTHYA SAHAYATA ABHIYAN</span> (A project of Healthcare Research and Development Board organized under NAC which is registered under companies act 2013 (section 8) Reg.No:053083) and selected <span className="font-black text-gray-900 uppercase underline decoration-gray-200">{config.consentPost}</span> <span className="text-gray-900 font-black underline uppercase">{application?.candidateName}</span> S/O(D/O) <span className="text-gray-900 font-black underline uppercase">{application?.fatherName}</span> Under <span className="font-bold underline">JAN SWASTHYA SAHAYATA ABHIYAN</span> with the following conditions.
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <div className="w-32 h-36 border-[3px] border-black p-0.5 bg-white shadow-xl rounded-sm overflow-hidden">
            <img src={cleanImageUrl(application?.photo)} alt="Photo" className="w-full h-full object-cover grayscale-[20%]" />
          </div>
          <div className="w-32 h-14 border-[3px] border-sky-300 p-1 bg-sky-50 shadow-inner rounded-sm overflow-hidden flex items-center justify-center">
            <img src={cleanImageUrl(application?.signature)} alt="Sign" className="max-w-full max-h-full mix-blend-multiply transition-all grayscale contrast-125" />
          </div>
        </div>
      </div>

      <div className="space-y-4 pr-2">
        {points.map((text, idx) => (
          <div key={idx} className="flex gap-3 text-justify leading-snug">
            <span className="font-black min-w-[20px] text-gray-400">{idx + 1}.</span>
            <p className={`${text.includes(config.pointPost) ? 'font-bold text-gray-900 underline decoration-gray-200' : 'text-gray-700 font-medium'}`}>{text}</p>
          </div>
        ))}
      </div>

      {/* Footer Block */}
      <div className="mt-16 flex justify-between items-start border-t border-gray-100 pt-8">
        <div className="space-y-1">
          <div className="font-black text-xs uppercase italic mb-8 border-b-2 border-gray-100 inline-block">Received By</div>
          <div className="w-44 h-20 flex items-center justify-start mb-2">
            <img
              src={sing}
              alt="Authorized Signatory"
              className="max-h-full max-w-full mix-blend-multiply opacity-90 contrast-125"
            />
          </div>
          <div className="text-[10px] leading-tight space-y-1 font-bold text-gray-700">
            <div className="uppercase tracking-tighter">For JAN SWASTHYA SAHAYATA ABHIYAN</div>
            <div>HR Department</div>
            <div className="uppercase tracking-tighter">JAN SWASTHYA SAHAYATA ABHIYAN</div>
            <div className="text-[8px] font-medium text-gray-500 uppercase mt-4 space-y-0.5 flex flex-col pt-2 border-t border-gray-50">
              <span>A project of Healthcare Research and Development</span>
              <span>(Organized under NAC RegNo:053083)</span>
              <span>Registered under Companies Act 2013 under the provision of section 8</span>
            </div>
          </div>
        </div>

        <div className="text-right space-y-1 pr-4">
          <div className="w-52 h-28 mb-4 flex items-center ml-16 justify-center border-2 border-dashed border-sky-100 bg-sky-50/20 rounded-xl overflow-hidden shadow-inner">
            <img src={cleanImageUrl(application?.signature)} alt="Sign" className="max-w-full max-h-full mix-blend-multiply transition-all grayscale contrast-150" />
          </div>
          <div className="text-[14px] font-black text-gray-900 uppercase tracking-tighter underline underline-offset-4 decoration-gray-200">
            {config.footerPost}
          </div>
          <div className="text-[10px] font-bold text-gray-500">Date: <span className="text-gray-900 font-black">{currentDateTime}</span></div>
          <div className="text-[10px] font-bold text-gray-500">Place: <span className="text-gray-900 font-black uppercase underline">{formData.district} ({formData.state})</span></div>
        </div>
      </div>

      <div className="mt-12 text-center text-[9px] text-gray-300 font-black tracking-[0.5em] uppercase">
        Verfied Document JSSA/NAC/OFFICIAL
      </div>
    </div>
  );
};

export const MOUTemplate = ({ application, formData, empId, logo, templateRef, detectedPost }) => {
  const [goalConfigs, setGoalConfigs] = React.useState(null);

  React.useEffect(() => {
    const fetchGoalConfigs = async () => {
      try {
        const tokenStr = localStorage.getItem("jssa_auth");
        const token = tokenStr ? JSON.parse(tokenStr).token : null;
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.jssabhiyan.com/api'}/goal-config/employee-configs`, {
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
        });
        const data = await res.json();
        if (data.success) {
          const configsMap = {};
          data.data.forEach(c => configsMap[c.role] = c);
          setGoalConfigs(configsMap);
        }
      } catch (error) {
        console.error('Failed to fetch goal configs in MOUTemplate', error);
      }
    };
    fetchGoalConfigs();
  }, []);

  const getRMSalary = () => {
    let salary = 35500;
    if (goalConfigs && goalConfigs['RM']) {
      const rmConfig = goalConfigs['RM'];
      salary = rmConfig.baseSalary || 35500;
      const candidateState = formData?.state || '';
      if (candidateState && rmConfig.stateSalaries && rmConfig.stateSalaries.length > 0) {
        const cleanState = candidateState.split(" / ")[0].trim();
        const stateObj = rmConfig.stateSalaries.find(s => s.state?.toLowerCase() === cleanState.toLowerCase());
        if (stateObj && stateObj.salary) {
          salary = stateObj.salary;
        }
      }
    }
    return `Rs ${salary.toLocaleString('en-IN')} monthly`;
  };

  const targetDateStr = application?.mouPaidAt ? application.mouPaidAt : (application?.createdAt ? application.createdAt : new Date());
  const currentDate = new Date(targetDateStr).toLocaleDateString();
  const currentDateTime = new Date(targetDateStr).toLocaleString();

  const post = detectedPost || application?.post || application?.jobPostingId?.post?.en || "district manager";

  const postConfigs = {
    "regional manager": {
      mouPost: "Regional Manager",
      execPost: "REGIONAL MANAGER",
      workLoc: `State of ${formData?.state || ''}`,
      salary: getRMSalary()
    },
    "zonal coordinator": {
      mouPost: "Zonal Coordinator",
      execPost: "ZONAL COORDINATOR",
      workLoc: `Zone of ${formData?.state || ''}`,
      salary: "Rs 30,500 monthly"
    },
    "district manager": {
      mouPost: "DISTRICT Manager",
      execPost: "DISTRICT MANAGER",
      workLoc: `${formData.district} District (${formData.state})`,
      salary: "Rs 25,500 monthly"
    },
    "block supervisor cum panchayat executive": {
      mouPost: "Block Supervisor cum Panchayat Executive",
      execPost: "Block Supervisor Cum Panchayat Executive",
      workLoc: `${formData.block} Block, ${formData.district} District (${formData.state})`,
      salary: "Rs 14,500 monthly"
    },
    "panchayat executive": {
      mouPost: "Panchayat Executive",
      execPost: "Panchayat Executive",
      workLoc: `${formData.villageTola || 'Dausa'} Panchayat, ${formData.block || 'Dausa'} Block, ${formData.district || 'Dausa'} District (${formData.state || 'Rajasthan'})`,
      salary: "Rs 0 monthly"
    }
  };

  const config = postConfigs[post?.toLowerCase()] || postConfigs["district manager"];

  return (
    <div className="text-[11px] leading-relaxed text-gray-800 font-sans" ref={templateRef}>
      {/* ─── PAGE 1 ─── */}
      <div className="mb-20 p-12 bg-white border shadow-sm">
        <div className="mb-0 text-left ">
          <div className="text-[11px] font-bold">Ref. No. <span className="text-gray-900">JSSA/ML/{empId?.split("/")?.pop()}</span></div>
        </div>

        {/* Centered Header */}
        <div className="text-center mb-8  mt-3">
          <img src={logoLong} alt="JSSA Header" className="w-full max-w-[450px] mx-auto" />
          <div className="w-full h-[1px] bg-green-500/30 mt-4"></div>
        </div>

        <h2 className="text-center text-lg font-black underline mb-8 uppercase tracking-widest">Memorandum Of Understanding Cum Agreement</h2>

        <p className="mb-6 text-justify">
          This MOU cum agreement is being done on <span className="text-gray-900 underline font-bold">{currentDate}</span> between <span className="font-bold uppercase tracking-tight">JAN SWASTHYA SAHAYATA ABHIYAN</span> (A project of Healthcare Research and Development Board organized under NAC which is registered under companies act 2013 (section 8) Reg.No:053083) and selected <span className="font-black underline uppercase">{config.mouPost}</span> <span className="text-gray-900 font-black underline uppercase">{application?.candidateName}</span> S/O(D/O) <span className="text-gray-900 font-black underline uppercase">{application?.fatherName}</span> under <span className="font-bold uppercase tracking-tight">JAN SWASTHYA SAHAYATA ABHIYAN</span> with The following conditions
        </p>

        <div className="space-y-1 mb-8 border-l-4 border-gray-400 pl-4 bg-gray-50/20 py-2 text-left">
          <div className="font-bold">Dear Mr./Mrs.: <span className="text-gray-900 uppercase underline">{application?.candidateName}</span></div>
          <div className="font-bold">S/O(D/O): <span className="text-gray-900 uppercase underline">{application?.fatherName}</span></div>
          <div className="font-bold">DOB: <span className="text-gray-900 underline">{application?.dob ? new Date(application.dob).toLocaleDateString() : 'N/A'}</span></div>
          <div className="font-bold">Application No: <span className="text-gray-900 underline">{application?.applicationNumber}</span></div>
          <div className="font-bold">Employee ID: <span className="text-gray-900 underline">{empId}</span></div>
        </div>

        <p className="mb-6 italic text-left">The management of the Company congratulates you on your decision to join us. The terms and conditions of employment are as follows:</p>

        <div className="space-y-4 text-left">
          <div>
            <span className="font-black underline mr-2">1.0 Designation/Department:</span>
            Your designation shall be <span className="font-black uppercase underline">{config.execPost}</span>. You shall report to our HR department & email: (joining.jssabhiyan@gmail.com). These may change in the interest of the company, if required within the framework of your designation.
          </div>
          <div>
            <span className="font-black underline mr-2">2.0 Commencement:</span>
            Your period of employment commences After providing training and authorization letter.
          </div>
          <div>
            <span className="font-black underline mr-2">3.0 Place Of Work:</span>
            You will be posted in <span className="text-gray-900 font-black uppercase underline">{config.workLoc}</span> but the Company reserves the right to transfer or depute you at any time from one to another district, block, panchayat branch office, subsidiary, associate companies or client locations situated anywhere in India or abroad, whether existing or acquired/established later on. Such transfer or deputation will be as per Company's policies.
          </div>
          <div>
            <span className="font-black underline mr-2">4.0 Confirmation:</span>
            You will be on probation for Three months from the date of appointment. On expiry of the probationary period it is open for the management either to confirm your services or extend your probationary period. Such an extension can be granted for a maximum of 11 months more, The an agreement, however, reserves the right to terminate your services without assigning any reason during the probationary period, or the extended probationary period. However during the probation period, services can be discontinued without any notice.
          </div>
          <div>
            <span className="font-black underline mr-2">5.0 Compensation:</span>
            For this position, if you meet the monthly target given by the organization, then the initial Income will be from <span className="text-gray-900 font-black underline">{config.salary}</span>. If you do not meet the monthly target given by the organization, you will get Label % the work you have done for the entire target for that month will be given to you as income for that month Payment is on the basis of wallet recharge through online.
          </div>
          <div>
            <span className="font-black underline mr-2">6.0 Benefits:</span>
            You will be entitled to Medical, LTA as per rules and regulations of the Company which may be in force from time to time and applicable to your category. Any taxes as per rules of the Income Tax Act or any other Government bodies at any time shall apply. The salary structure may change in case of change of Policies of the company.
          </div>
        </div>

        <div className="mt-20 text-right text-[8px] text-gray-400 italic">Page 1/5</div>
      </div>

      <div className="w-full border-t-2 border-dashed border-gray-300 my-12"></div>

      {/* ─── PAGE 2 ─── */}
      <div className="mb-20 p-12 bg-white border shadow-sm">
        <div className="space-y-4 pt-10 text-left">
          <div>
            <span className="font-black underline mr-2">7.0 Information Intimation:</span>
            Your appointment is based on information supplied by you. If it is found that you have <span className="font-bold underline">Misrepresented</span>, concealed or given any wrong information about your candidature at the time of your appointment, your services will be liable to be terminated without any notice or compensation.
            <div className="mt-2 pl-4">
              7.1 Whenever you change your present / local address for any reason you shall intimate the change to the Company, immediately.
            </div>
            <div className="pl-4">
              7.2 Your appointment is subject to your being certified medically fit.
            </div>
          </div>
          <div>
            <span className="font-black underline mr-2">8.0 Non-Disclosure:</span>
            You are requested to sign the “Non Disclosure Agreement” attached as Appendix ‘B’, which constitutes an integral part of your working conditions and agreements.
          </div>
          <div>
            <span className="font-black underline mr-2">9.0 Training:</span>
            During the course of your employment with the Company, the Company may impart you training for which you would be required to execute a Service and Surety Bond with the Company, assuring the Company of your service for a minimum fixed period. In case of separation from the company on your request, the company shall recover the amount as given in the Surety Bond.
          </div>
          <div>
            <span className="font-black underline mr-2">10.0 Leave:</span>
            In addition to the national holiday, you will be granted 18 casual leave in a year for which you will have to inform your senior officer of organization. If you are absent for 11 consecutive days in a month without notice, your service will be terminated by giving you a notice.
          </div>
          <div>
            <span className="font-black underline mr-2">11.0 Separation:</span>
            In the event that the Company or you decide to part ways, the basic rules governing the completion of this relationship shall be as follows:
          </div>
          <div>
            <span className="font-black underline mr-2">12.0 General:</span>
            We welcome you to our organization’s project Jan Swasthya Sahayata Abhiyan and wish you a successful, long and happy association.
          </div>
        </div>

        <div className="mt-12 font-bold mb-10 text-left">
          Please sign the duplicate copy of this letter and return the same to us as a token of your acceptance.
        </div>

        <div className="flex justify-between items-start mb-16 text-left">
          <div className="space-y-1">
            <div className="text-[10px] font-bold">With best regards Yours sincerely,</div>
            <div className="font-black text-green-800 text-[11px] mb-4">For Jan Swasthya Sahayata Abhiyan</div>
            <div className="w-40 h-16 flex items-center">
              <img src={sing} alt="Sign" className="max-h-full mix-blend-multiply transition-all contrast-125" />
            </div>
            <div className="text-[9px] font-bold text-blue-800 border-2 border-blue-800 p-1 inline-block">AUTHORIZED SIGNATORY</div>
            <div className="text-[10px] space-y-1 pt-4">
              <div className="font-black uppercase">JAN SWASTHYA SAHAYATA ABHIYAN</div>
              <div className="text-[8px] font-medium text-gray-500 leading-tight">
                A project of Healthcare Research and Development (Organized under NAC RegNo:053083) Registered under Companies Act 2013 under the provision of section 8
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="w-48 h-24 mb-2 flex items-center justify-center border-b border-gray-200">
              <img src={cleanImageUrl(application?.signature)} alt="Sign" className="max-w-full max-h-full mix-blend-multiply transition-all grayscale contrast-150" />
            </div>
            <div className="font-black text-[12px] uppercase">{application?.candidateName}</div>
            <div className="text-[9px] font-bold text-gray-400">Digitally Signed By Candidate</div>
          </div>
        </div>

        <div className="space-y-4 text-[10px] bg-gray-50 p-4 rounded-lg text-left">
          <p>I certify that I have read and understood and the contents of the this letter and agree to all the terms and conditions as outlined in the letter.</p>
          <p>I certify that this organization is a social service organization that works through contributions and donations, so the application fee, training fee and other expenses fees given by me as a contribution will not be refundable. I am not entitled to take this fee back from the organization.</p>
        </div>

        <div className="mt-10 text-right text-[8px] text-gray-400 italic">Page 2/5</div>
      </div>

      <div className="w-full border-t-2 border-dashed border-gray-300 my-12"></div>

      {/* ─── PAGE 3 ─── APPENDIX 'B' (NDA) ─── */}
      <div className="mb-20 pt-10 p-12 bg-white border shadow-sm">
        <div className="text-right font-black text-sm mb-4">APPENDIX 'B'</div>
        <h2 className="text-center text-lg font-black underline mb-8 uppercase">Non-Disclosure Agreement</h2>

        <p className="mb-6 text-justify">
          This Non-Disclosure Agreement (this "Agreement") is entered into this <span className="font-bold underline">{currentDate}</span> by and between <span className="font-black">Jan Swasthya Sahayata Abhiyan</span> (project of Healthcare Research & development Board, organized under NAC which is registered under Companies Act 2013 having its registration number 053083 under the provision of section 8) and <span className="font-black text-gray-900 underline uppercase">{application?.candidateName}</span> S/O(D/O) <span className="font-black text-gray-900 underline uppercase">{application?.fatherName}</span> (Recipient" or "Employee").
        </p>

        <div className="font-black mb-4">WITNESSETH</div>

        <div className="space-y-4 mb-8 text-left">
          <p>WHEREAS Employee has agreed to commence work as an Employee of organization and is signing an Employment Agreement to that effect;</p>
          <p>WHEREAS, Employee may be exposed and have access to confidential and/or proprietary information of the Company WHEREAS in order to induce such exposure and access, the parties hereto desire to undertake certain obligations of confidentiality, non-disclosure and non competition as set forth herein;</p>
          <p className="font-bold uppercase">NOW THEREFORE, in consideration of the mutual undertakings and promises herein, the Recipient hereby agrees as follows:</p>
        </div>

        <div className="space-y-6 text-left">
          <div>
            <span className="font-black underline mr-2 text-[12px]">1. Definitions</span>
            <p className="mt-2 text-justify">For purposes of this Agreement, the following definitions shall apply:</p>
            <div className="mt-3 space-y-4 pl-4 text-justify">
              <p>"Affiliate" shall mean an entity controlled by, controlling or under common control with the Recipient, as used in this definition, the term "control" means the possession, directly or indirectly, of more than 50% of the voting stock of the controlled entity, or the power to direct, or cause the direction of the management and policy of the controlled entity.</p>
              <p>"Company" shall include Jan Swasthya Sahayata Abhiyan and any of its Affiliates.</p>
              <p>"Development" shall mean any invention, modification, discovery, design, development, improvement, process, software program, work of authorship, documentation, formula, data, technique, know-how, trade secret or intellectual property right whatsoever or any interest therein (whether or not patentable or registerable under copyright, trademark or similar statutes or subject to analogous protection), conceived by Recipient as a result of or in connection with performing the activities, obligations, efforts and / or Services described in the Commercial Agreement.</p>
              <p>"Confidential Information" means any and all information and know-how of a private, secret or confidential nature, in whatever form, that relates to the business, financial condition, technology and/or products of Jan Swasthya Sahayata Abhiyan, its Affiliates, customers, potential customers, employees or potential employees, provided or disclosed to the Recipient or which becomes known to the Recipient as a result of the Commercial Agreement, whether or not marked or otherwise designated as "confidential", "proprietary" or with any other legend indicating its proprietary nature. By way of illustration and not limitation, Confidential Information includes all forms and types of financial, business, technical, or engineering information and know-how, including but not limited to specifications, designs, techniques, compilations, inventions, developments, products, equipment, algorithms, computer programs (whether as source code or object code), marketing and customer, vendor and personal information, projections, plans and reports, and any other data, documentation, or information related thereto, as well as improvements thereof, whether in tangible or intangible form, and whether or not stored, compiled or memorialized in any media or in writing, including information disclosed as a result of any visitation, consultation or information disclosed by Jan Swasthya Sahayata Abhiyan or others on its behalf such as consultants, clients, employees and customers.</p>
            </div>
          </div>
        </div>

        <div className="mt-20 text-right text-[8px] text-gray-400 italic">Page 3/5</div>
      </div>

      <div className="w-full border-t-2 border-dashed border-gray-300 my-12"></div>

      {/* ─── PAGE 4 ─── Obligations Continued ─── */}
      <div className="mb-20 pt-10 p-12 bg-white border shadow-sm">
        <div className="space-y-6 text-left">
          <div>
            <span className="font-black underline mr-2 text-[12px]">2. Obligations of Confidentiality.</span>
            <div className="mt-3 space-y-4 pl-4 text-justify">
              <p>2.1 Recipient shall treat all Confidential Information disclosed to it as strictly confidential and not to exploit or make use, directly or indirectly, of such Confidential Information without the express written consent of the Company, except for the purpose of performing the activities, obligations, efforts and / or Services pursuant to the Commercial Agreement. Recipient shall assume full responsibility for enforcing this obligation and shall take appropriate measures with its employees to ensure that such persons are bound by a like covenant of secrecy, including but not limited to informing any of its employees receiving such Confidential Information that such Confidential Information shall not be disclosed except as provided herein.</p>
              <p>2.2 Recipient shall not copy or reproduce in any way (including without limitation, store in any computer or electronic system) any Confidential Information for purposes other than the performance of the activities, obligations, efforts and / or Services, without the Company's prior written consent.</p>
              <p>2.3 Recipient shall refrain from analyzing, reverse-engineering, decompiling, or disassembling or attempting to analyze Confidential Information in order to determine the construction, code, algorithm or topology (composition, formula or specifications) thereof, either by itself or through any third party. The disclosure of the Confidential Information by the Company shall not grant Recipient any express, implied or other license or rights to patents or trade secrets of the Company or their employees, whether or not patentable, nor shall it constitute or be deemed to create a partnership, joint venture or other undertaking.</p>
              <p>2.4 Recipient shall not remove or otherwise alter any of trademarks or service marks, serial numbers, logos, copyrights, notices or other proprietary notices or indicia, if any, fixed or attached to the confidential Information or any part thereof.</p>
              <p>2.5 If Recipient or anyone to whom Recipient has disclosed the Confidential Information with the consent of the Company is required to disclose any Confidential Information pursuant to the provisions of any applicable law - Recipient shall first notify the Company of such requirement and shall cooperate with the Company so that the Company may seek a protective order or prevent or minimize such disclosure.</p>
              <p>2.6 Recipient hereby assumes full responsibility for any damage caused to the Company as a result of the breach of this Agreement by it or by any of its employees and consultants, and shall take all appropriate measures to insure the non disclosure of the Confidential Information to any third party.</p>
            </div>
          </div>

          <div>
            <span className="font-black underline mr-2 text-[12px]">3. Return of Proprietary Information:</span>
            <p className="mt-2 pl-4 text-justify underline font-bold">Unless otherwise required by statute or government rule or regulation, upon demand by the Company, Recipient shall: (i) cease using the Confidential Information; (ii) immediately return to the Company all notes, copies and extracts thereof of the Confidential Information, in any form or media whatsoever without retaining copies thereof; and (iii) upon request of the Company, certify in writing that the Recipients have complied with the obligations set forth in this paragraph.</p>
          </div>

          <div>
            <span className="font-black underline mr-2 text-[12px]">4. Intellectual Property Rights.</span>
            <p className="mt-2 pl-4 italic">The Recipient hereby acknowledges and agrees that:</p>
            <p className="mt-2 pl-4 font-bold">The Confidential Information furnished hereunder is and shall remain proprietary to the Company.</p>
            <div className="mt-3 space-y-4 pl-4 text-justify">
              <p>4.1 It shall promptly disclose to the Company, without further compensation or consideration, all Development, and keep accurate records relating to the conception and reduction to practice of all such Development. Such records shall be the sole and exclusive property of the Company, and Recipient shall surrender possession of such records to the Company upon the request of the Company or upon the termination of the activities, obligations, efforts and / or Services of the Commercial Agreement at the latest.</p>
              <p>4.2 It hereby assigns to the Company, without further compensation and consideration, the entire right, title and interest in and to the Development and in and to all proprietary and any and all intellectual property rights therein or based thereon. Recipient shall execute all such assignments, oaths, declarations and other documents as may be prepared by the Company to effect the foregoing.</p>
            </div>
          </div>

          <div>
            <span className="font-black underline mr-2 text-[12px]">5. Non-Solicit.</span>
            <p className="mt-2 pl-4 font-medium italic underline">In addition to any other obligation Recipient may have towards the Company, Recipient agrees that for during the period of the Commercial Agreement and for one (1) year after the termination of the Commercial Agreement for any reason whatsoever, it will not, directly or indirectly:</p>
          </div>
        </div>

        <div className="mt-20 text-right text-[8px] text-gray-400 italic">Page 4/5</div>
      </div>

      <div className="w-full border-t-2 border-dashed border-gray-300 my-12"></div>

      {/* ─── PAGE 5 ─── Miscellaneous ─── */}
      <div className="mb-20 pt-10 p-12 bg-white border shadow-sm">
        <div className="space-y-4 pl-4 text-justify mb-10">
          <p>5.1 Engage whether as an employee, partner, joint venture, investor, director, consultant or otherwise, in any business activity which is directly or indirectly in competition anywhere in the world, with any of the products or services being developed, marketed, distributed, planned, sold or otherwise provided by the Company during the time of performing the activities, obligations, efforts and / or Services.</p>
          <p>5.2 (i) solicit, induce, recruit, hire or encourage any employee or consultant of the Company to leave such position, or attempt to do any of the foregoing, either for themselves or for any other person or entity, (ii) contact any customers of the Company for the purpose of selling or marketing to those customers any products or services which are the same as or substantially similar to, or competitive with, the products or services sold and/or provided by the Company in relation to its business at such date, or (iii) otherwise interfere in any manner with the contractual or employment relationship between the Company and any of its employees, consultants, employees or customers.</p>
        </div>

        <div>
          <span className="font-black underline mr-2 text-[12px]">6. Miscellaneous.</span>
          <div className="mt-3 space-y-4 pl-4 text-justify">
            <p>6.1 No failure or delay on the part of the parties to exercise any right, power or remedy under this Agreement shall operate as a waiver thereof, nor shall any single or partial exercise by either of the parties of any rights, powers or remedies. The rights, powers and remedies provided herein are cumulative and are not exclusive of any rights, powers or remedies by law.</p>
            <p>6.2 All notices and requests required or authorized hereunder shall be given in writing either by personal delivery, by registered mail, addressed to the party intended at its address set forth above, or by facsimile, and shall be deemed received as follows: notices served by hand upon delivery, notice served by facsimile the next business day following the delivery, provided however that such notice shall be followed by a telephone confirmation, and notice served by registered mail within seven (7) business days following delivery by registered mail, postage prepaid.</p>
            <p>6.3 This Agreement may be executed in two or more counterparts, each of which shall be deemed an original, but all of which together shall constitute one and the same instrument.</p>
            <p>6.4 This Agreement shall be governed by and construed and enforced in accordance with the laws of</p>
            <div className="pl-4">
              6.5 India, without regard to the principles of the conflict of laws. The competent courts within the city of Delhi, India, shall have exclusive jurisdiction to adjudicate any dispute arising out of this Agreement. Notwithstanding the foregoing, the Company may resort to any court of competent jurisdiction to obtain injunctive relief to prevent the disclosure of its information.
            </div>
            <p>6.6 This Agreement shall constitute the entire Agreement between the parties with respect to the confidentiality, non disclosure, proprietary nature of the Confidential Information and shall supersede any and all prior agreements and understandings relating thereto. No change, modification, alteration or addition of or to any provision of this Agreement shall be binding unless in writing and executed by or on behalf of all parties by a duly authorized representative.</p>
            <p>6.7 Recipient may not assign this Agreement without the prior written consent of the Company.</p>
            <p>6.8 The Company may assign this Agreement to any of its Affiliates and/or any entity which is the successor to any part of its business related to this Agreement by way of merger or acquirer of all or substantially all of its assets related to this Agreement and which agrees to assume all obligations of the assigning party under this Agreement from and after the date of such assignment.</p>
            <p>6.9 If any one or more of the terms contained in this Agreement shall for any reason be held to be excessively broad with regard to time, geographic scope or activity, that term shall be construed in a manner to enable it to be enforced to the extent compatible with applicable law. A determination that any term is void or unenforceable shall not affect the validity or enforceability of any other term or condition and any such invalid provision shall be construed and enforced (to the extent possible) in accordance with the original intent of the parties as herein expressed.</p>
            <p>6.10 The Recipient agrees that an impending or existing violation of any provision of this Agreement may cause the Company irreparable injury for which it would have no adequate remedy at law, and agrees that the Company shall be entitled to seek immediate injunctive relief prohibiting such violation, in addition to any other rights and remedies available to it.</p>
          </div>
        </div>

        <div className="mt-12 font-black italic underline mb-10 tracking-tighter text-left">
          IN WITNESS WHEREOF the Employee has executed this Agreement as of the date first written above. EMPLOYEE
        </div>

        <div className="flex justify-between items-start mt-10 text-left">
          <div className="space-y-1">
            <div className="w-48 h-24 mb-2 flex items-center justify-center border-2 border-gray-100 bg-gray-50 rounded shadow-inner overflow-hidden">
              <img src={cleanImageUrl(application?.signature)} alt="Sign" className="max-w-full max-h-full mix-blend-multiply grayscale contrast-125" />
            </div>
            <div className="text-[10px] space-y-1">
              <div>Name: <span className="text-gray-900 font-black uppercase underline">{application?.candidateName}</span></div>
              <div>S/O: <span className="text-gray-900 font-black uppercase underline">{application?.fatherName}</span></div>
              <div>Title: <span className="font-black uppercase underline underline-offset-2">{config.execPost}</span></div>
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="w-40 h-20 flex items-center justify-end ml-auto">
              <img src={sing} alt="Sign" className="max-h-full mix-blend-multiply transition-all contrast-125" />
            </div>
            <div className="text-[9px] font-bold text-blue-800 border-2 border-blue-800 p-1 inline-block mb-4 uppercase scale-90 origin-right">AUTHORIZED SIGNATORY</div>
            <div className="text-[10px] space-y-0.5 leading-tight font-bold text-gray-700">
              <div>For JAN SWASTHYA SAHAYATA ABHIYAN</div>
              <div>HR Department</div>
              <div>JAN SWASTHYA SAHAYATA ABHIYAN</div>
              <div className="text-[8px] font-medium text-gray-400 mt-2">
                <div>A project of Healthcare Research and Development</div>
                <div>(Organized under NAC RegNo:053083)</div>
                <div>Registered under Companies Act 2013 under the provision of section 8</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 text-right text-[8px] text-gray-400 italic">Page 5/5</div>
      </div>
    </div>
  );
};

export const AvatarPlaceholder = () => (
  <svg width="100%" height="100%" viewBox="0 0 120 120" fill="none">
    <rect width="120" height="120" fill="#E5E7EB" />
    <circle cx="60" cy="45" r="20" fill="#9CA3AF" />
    <path
      d="M30 95C30 78.4315 43.4315 65 60 65C76.5685 65 90 78.4315 90 95V100H30V95Z"
      fill="#9CA3AF"
    />
  </svg>
);

export const IDCardTemplate = ({ application, formData, empId, logo, templateRef, detectedPost }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [application?.photo]);

  const postLabels = {
    "regional manager": "REGIONAL MANAGER",
    "zonal coordinator": "ZONAL COORDINATOR",
    "district manager": "DISTRICT MANAGER",
    "block supervisor cum panchayat executive": "BLOCK SUPERVISOR CUM PANCHAYAT EXECUTIVE",
    "panchayat executive": "PANCHAYAT EXECUTIVE"
  };
  const post = detectedPost || application?.post || application?.jobPostingId?.post?.en || "district manager";

  const designation = postLabels[post?.toLowerCase()] || postLabels["district manager"];

  return (
    <div className="flex justify-center items-center py-6 bg-gray-50">
      {/* Outer wrapper - Classic Physical Badge Layout */}
      <div
        className="w-[320px] h-[550px] bg-white overflow-hidden relative flex flex-col font-sans rounded-lg border border-gray-300 shadow-[0_0_20px_rgba(0,0,0,0.1)] box-border"
        ref={templateRef}
      >
        {/* Top Half - Solid Green Header */}
        <div className="h-[160px] w-full flex flex-col items-center relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d5927] to-[#1B9E4B]"></div>

          {/* Logo - Added relative z-10 to fix html2canvas missing logo issue */}
          <div className="relative z-10 w-full bg-white py-2.5 flex justify-center shadow-sm border-b border-gray-200">
            <img src={logoLong} alt="Logo" className="h-[63px] object-contain" />
          </div>

          {/* Photo Box (Overlapping) */}
          <div className="w-[105px] h-[130px] bg-white p-1 shadow-[0_5px_15px_rgba(0,0,0,0.15)] border-[3px] border-white absolute -bottom-[65px] z-20 rounded-md">
            <div className="w-full h-full bg-gray-100 overflow-hidden rounded-sm">
              {application?.photo && !imageError ? (
                <img src={cleanImageUrl(application.photo)} alt="Identity" className="w-full h-full object-cover" onError={() => setImageError(true)} />
              ) : (
                <AvatarPlaceholder />
              )}
            </div>
          </div>
        </div>

        {/* Bottom Half - Details */}
        <div className="h-[314px] bg-white pt-[75px] flex flex-col items-center px-6 relative z-10 w-full overflow-hidden shrink-0">
          {/* Central Watermark */}
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-0 mt-8">
            <img src={logo} alt="Watermark" className="w-[160px] h-[160px] object-contain opacity-[0.05] grayscale" />
          </div>

          {/* Name & Designation */}
          <div className="text-center w-full z-10 mb-3 mt-1">
            <div className="text-[21px] font-black uppercase text-gray-900 leading-none tracking-tight mb-1">
              {application?.candidateName}
            </div>
            <div className="text-[11.5px] font-black uppercase text-[#1B9E4B] tracking-wider">
              {designation}
            </div>
          </div>

          {/* Details Table - Authentic Tabular Look */}
          <div className="w-full text-left z-10 border-t-[2px] border-[#1B9E4B] pt-1.5">
            <table className="w-full text-[9px]">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="w-[30%] text-gray-500 uppercase font-bold tracking-widest py-1">Emp ID</td>
                  <td className="w-[5%] text-gray-400 font-bold">:</td>
                  <td className="text-[#1B9E4B] font-black text-[12px] uppercase tracking-tight">{empId}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="text-gray-500 uppercase font-bold tracking-widest py-1 align-top pt-1.5">Father</td>
                  <td className="text-gray-400 font-bold align-top pt-1.5">:</td>
                  <td className="text-gray-800 font-black uppercase leading-tight pt-1.5">{application?.fatherName}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="text-gray-500 uppercase font-bold tracking-widest py-1">D.O.B</td>
                  <td className="text-gray-400 font-bold">:</td>
                  <td className="text-gray-800 font-black">{application?.dob ? new Date(application.dob).toLocaleDateString('en-GB') : '—'}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="text-gray-500 uppercase font-bold tracking-widest py-1">Email</td>
                  <td className="text-gray-400 font-bold">:</td>
                  <td className="text-[#1B9E4B] font-bold truncate">{application?.email || '—'}</td>
                </tr>
                <tr>
                  <td className="text-gray-500 uppercase font-bold tracking-widest py-1 align-top pt-1.5">Location</td>
                  <td className="text-gray-400 font-bold align-top pt-1.5">:</td>
                  <td className="text-gray-800 font-black uppercase pt-1.5 pr-1 pb-1">
                    <div className="leading-[1.6] text-[8.5px]">{formData.district}, {formData.state}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full bg-[#0d5927] flex justify-between items-center px-5 py-3.5 z-30 relative shrink-0 mt-auto">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-[#1B9E4B]"></div>
          <div className="flex flex-col text-white mb-1">
            <div className="text-[8.5px] uppercase tracking-widest text-[#a8e5b6] mb-1.5 font-bold">Contact Support</div>
            <div className="text-[10.5px] font-medium space-y-1">
              <div className="flex items-center gap-1.5">
                <Mail className="w-[11px] h-[11px] text-[#a8e5b6]" />
                <span className="tracking-wide">support@jssabhiyan.com</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-[11px] h-[11px] text-[#a8e5b6]" />
                <span className="tracking-wide">+91-9546599311</span>
              </div>
            </div>
          </div>
          <div className="w-[48px] h-[48px] bg-white p-1 rounded-sm shadow-md flex items-center justify-center">
            <img src={QrCode} className="w-full h-full object-contain" alt="QR" />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---

const EmployeeLetters = () => {
  const { isZoneLocked, employeeProfile } = useAuth();
  const userRole = employeeProfile?.role?.toUpperCase() || "";
  const isTeamLettersEnabled = userRole === "RM" || userRole === "ZC";

  const [activeTab, setActiveTab] = useState("my"); // "my", "team"
  const [teamRoleFilter, setTeamRoleFilter] = useState("DM"); // "DM", "BS", "PE"
  const [teamLetters, setTeamLetters] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState(null);

  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewLetter, setViewLetter] = useState(null);
  const [downloading, setDownloading] = useState(null); // letter._id being downloaded

  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Proper download — fetch as blob so browser doesn't open new tab
  const handleDownload = async (letter) => {
    try {
      setDownloading(letter._id);
      const response = await fetch(cleanImageUrl(letter.fileUrl));
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const ext = letter.fileType === "pdf" ? ".pdf" : ".jpg";
      const filename = `${letter.title.replace(/[^a-z0-9]/gi, "_")}${ext}`;
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const fetchLettersList = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await lettersAPI.getMyLetters();
      if (res.success) {
        setLetters(res.data || []);
      } else {
        setError(res.error || "Failed to load letters");
      }
    } catch {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamLettersList = async () => {
    try {
      setTeamLoading(true);
      setTeamError(null);
      const res = await lettersAPI.getTeamLetters();
      if (res.success) {
        setTeamLetters(res.data || []);
      } else {
        setTeamError(res.error || "Failed to load team letters");
      }
    } catch {
      setTeamError("Could not connect to server");
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "my") {
      fetchLettersList();
    } else if (activeTab === "team" && isTeamLettersEnabled) {
      fetchTeamLettersList();
    }
  }, [activeTab]);

  const handleUploadSubmit = async () => {
    if (!uploadTitle.trim()) {
      setUploadError("Title is required");
      return;
    }
    if (!uploadFile) {
      setUploadError("Document file is required");
      return;
    }
    try {
      setUploading(true);
      setUploadError("");
      const formData = new FormData();
      formData.append("title", uploadTitle);
      formData.append("file", uploadFile);

      const res = await lettersAPI.uploadEmployeeLetter(formData);
      if (res.success) {
        setIsUploadModalOpen(false);
        setUploadTitle("");
        setUploadFile(null);
        fetchLettersList();
      } else {
        setUploadError(res.error || "Failed to upload document");
      }
    } catch (err) {
      setUploadError("Server connection error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {!isZoneLocked ? (
          <div className="py-10">
            <ZoneLockEmptyState
              title="Official Letters Locked"
              description="You cannot access or upload official letters until your working jurisdiction (District/Block) is verified and locked."
            />
          </div>
        ) : (
          <>
            {/* Header — EmployeeLeads theme */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                  Official <span className="text-[#3AB000]">Letters</span>
                </h1>
                <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.3em] mt-1">
                  {activeTab === "team" ? "Documents Uploaded By Your Team" : "Documents Issued to You & Your Uploads"}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {activeTab === "my" && !loading && !error && letters.length > 0 && (
                  <div className="flex items-center gap-2 bg-[#3AB000]/10 border border-[#3AB000]/20 px-4 py-2">
                    <FileText size={14} className="text-[#3AB000]" />
                    <span className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest">
                      {letters.length} Letter{letters.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {activeTab === "my" && (
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs px-5 h-9 font-black uppercase tracking-wide shadow-sm transition-all flex items-center gap-2"
                  >
                    <Plus size={16} /> Upload Document
                  </button>
                )}
              </div>
            </div>

            {/* Main Tabs */}
            <div className="flex gap-2 border-b-4 border-[#3AB000] mb-8 items-end">
              <button
                onClick={() => setActiveTab("my")}
                className={`px-6 py-3 text-[12px] font-black uppercase tracking-widest transition-all ${
                  activeTab === "my"
                    ? "bg-[#3AB000] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                My Letters & Uploads
              </button>
              
              {isTeamLettersEnabled && (
                <button
                  onClick={() => setActiveTab("team")}
                  className={`px-6 py-3 text-[12px] font-black uppercase tracking-widest transition-all ${
                    activeTab === "team"
                      ? "bg-[#3AB000] text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  Team Letters
                </button>
              )}
            </div>

            {/* Team Role Filters */}
            {activeTab === "team" && (
              <div className="flex bg-[#3AB000]/10 border border-[#3AB000]/20 p-1 mb-6 w-fit">
                {["DM", "BS", "PE"].map(role => (
                  <button
                    key={role}
                    onClick={() => setTeamRoleFilter(role)}
                    className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      teamRoleFilter === role
                        ? "bg-[#3AB000] text-white shadow-md"
                        : "text-[#3AB000] hover:bg-[#3AB000]/20"
                    }`}
                  >
                    {role === "DM" ? "District Manager" : role === "BS" ? "Block Supervisor" : "Panchayat Executive"}
                  </button>
                ))}
              </div>
            )}

            {/* Loading State */}
            {((activeTab === "my" && loading) || (activeTab === "team" && teamLoading)) && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-[#3AB000]/20 border-t-[#3AB000] rounded-full animate-spin" />
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                  Loading {activeTab === "team" ? "team letters" : "your letters"}...
                </p>
              </div>
            )}

            {/* Error State */}
            {((activeTab === "my" && !loading && error) || (activeTab === "team" && !teamLoading && teamError)) && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-14 h-14 bg-red-50 border-2 border-red-200 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-red-400" />
                </div>
                <p className="text-sm font-black text-gray-500 uppercase tracking-widest">
                  {activeTab === "my" ? error : teamError}
                </p>
                <button
                  onClick={() => activeTab === "my" ? fetchLettersList() : fetchTeamLettersList()}
                  className="px-4 py-2 text-[11px] font-black text-[#3AB000] uppercase tracking-widest border-2 border-[#3AB000] hover:bg-[#3AB000] hover:text-white transition-all"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {((activeTab === "my" && !loading && !error && letters.length === 0) ||
              (activeTab === "team" && !teamLoading && !teamError && teamLetters.filter(l => l.uploadedBy?.employeeId?.role === teamRoleFilter).length === 0)) && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-gray-500 uppercase tracking-widest mb-1">
                    {activeTab === "team" ? "No Team Letters Found" : "No Letters Issued Yet"}
                  </p>
                  <p className="text-[11px] text-gray-400 font-bold max-w-xs">
                    {activeTab === "team"
                      ? `No letters uploaded by ${teamRoleFilter} in your jurisdiction yet.`
                      : "Official letters from JSSA Administration will appear here once issued."}
                  </p>
                </div>
              </div>
            )}

            {/* Letters Card Grid */}
            {((activeTab === "my" && !loading && !error && letters.length > 0) ||
              (activeTab === "team" && !teamLoading && !teamError && teamLetters.filter(l => l.uploadedBy?.employeeId?.role === teamRoleFilter).length > 0)) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(activeTab === "my" ? letters : teamLetters.filter(l => l.uploadedBy?.employeeId?.role === teamRoleFilter)).map((letter) => (
                  <div
                    key={letter._id}
                    className="bg-white border border-gray-100 hover:border-[#3AB000]/40 hover:shadow-md transition-all flex flex-col"
                  >
                    {/* Card Top — icon area */}
                    <div className={`h-28 flex items-center justify-center border-b border-gray-100 ${letter.fileType === "pdf" ? "bg-red-50" : "bg-blue-50"
                      }`}>
                      <div className={`w-14 h-14 flex items-center justify-center border-2 ${letter.fileType === "pdf"
                        ? "border-red-200 text-red-500"
                        : "border-blue-200 text-blue-500"
                        }`}>
                        <FileText size={28} />
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex flex-col flex-1">
                      <p className="text-sm font-black text-gray-900 leading-tight mb-1 line-clamp-2">
                        {letter.title}
                        {letter.isEmployeeUpload && (
                          <span className="ml-2 bg-blue-100 text-blue-700 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase inline-block align-middle">
                            Upload
                          </span>
                        )}
                      </p>
                      
                      {activeTab === "team" && letter.uploadedBy && (
                        <p className="text-[10px] font-bold text-gray-500 mb-2 truncate">
                          By: <span className="text-gray-800">{letter.uploadedBy.name}</span> ({letter.uploadedBy.employeeId?.role || "Employee"})
                        </p>
                      )}

                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                        {letter.fileType === "pdf" ? "PDF Document" : "Image"}
                        {" · "}
                        {new Date(letter.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={() => setViewLetter(letter)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black text-gray-600 uppercase tracking-widest border-2 border-gray-200 hover:border-[#3AB000] hover:text-[#3AB000] transition-all"
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={() => handleDownload(letter)}
                          disabled={downloading === letter._id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black text-white uppercase tracking-widest bg-[#3AB000] hover:bg-[#2d8a00] transition-all disabled:opacity-60"
                        >
                          {downloading === letter._id
                            ? <><Loader2 size={13} className="animate-spin" /> Downloading...</>
                            : <><Download size={13} /> Download</>}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── View Document Modal ─── */}
      {viewLetter && (
        <div
          className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setViewLetter(null)}
        >
          <div
            className="bg-white w-full max-w-3xl flex flex-col shadow-2xl border-t-4 border-[#3AB000]"
            style={{ maxHeight: "90vh" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 flex items-center justify-center shrink-0 border-2 ${viewLetter.fileType === "pdf" ? "border-red-200 text-red-500 bg-red-50" : "border-blue-200 text-blue-500 bg-blue-50"
                  }`}>
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{viewLetter.title}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {viewLetter.fileType === "pdf" ? "PDF Document" : "Image"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button
                  onClick={() => handleDownload(viewLetter)}
                  disabled={downloading === viewLetter._id}
                  className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black text-white uppercase tracking-widest bg-[#3AB000] hover:bg-[#2d8a00] transition-all disabled:opacity-60"
                >
                  {downloading === viewLetter._id
                    ? <><Loader2 size={13} className="animate-spin" /> Downloading...</>
                    : <><Download size={13} /> Download</>}
                </button>
                <button
                  onClick={() => setViewLetter(null)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 border-2 border-gray-200 hover:border-gray-400 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Document Viewer */}
            <div className="flex-1 overflow-auto bg-gray-50" style={{ minHeight: "400px" }}>
              {viewLetter.fileType === "pdf" ? (
                <iframe
                  src={cleanImageUrl(viewLetter.fileUrl)}
                  title={viewLetter.title}
                  className="w-full h-full"
                  style={{ minHeight: "500px", border: "none" }}
                />
              ) : (
                <div className="flex items-center justify-center p-6 h-full">
                  <img
                    src={cleanImageUrl(viewLetter.fileUrl)}
                    alt={viewLetter.title}
                    className="max-w-full max-h-[60vh] object-contain shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Upload Document Modal ─── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md shadow-2xl border-t-4 border-[#3AB000] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-black text-gray-800 uppercase tracking-widest">Upload Document</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {uploadError && (
                <div className="bg-red-50 text-red-600 p-3 text-xs font-bold border border-red-100 flex items-center gap-2">
                  <AlertCircle size={14} /> {uploadError}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Title *</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Monthly Report"
                  className="w-full px-4 py-3 border-2 border-gray-200 text-sm font-bold text-gray-700 outline-none focus:border-[#3AB000] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">File (PDF or Image) *</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full px-4 py-3 border-2 border-gray-200 text-sm font-bold text-gray-700 outline-none focus:border-[#3AB000] transition-all file:mr-4 file:py-1 file:px-3 file:rounded-none file:border-0 file:text-xs file:font-black file:uppercase file:bg-[#3AB000] file:text-white hover:file:bg-[#2d8a00]"
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={uploading}
                className="px-6 py-2 text-[10px] font-black text-white uppercase tracking-widest bg-[#3AB000] hover:bg-[#2d8a00] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default EmployeeLetters;
