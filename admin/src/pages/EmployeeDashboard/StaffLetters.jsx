import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { administrativeStaffAPI } from "../../utils/api";
import { useAuth } from "../../auth/AuthProvider";
import logoLong from "../../assets/jssa-logo-long.png";
import sing from "../../assets/docs/district_manger/sing.png";
import QrCode from '../../assets/QrCode.png';

import {
  Loader2,
  Download,
  Eye,
  ShieldCheck,
  FileText,
  CheckCircle2,
  CreditCard,
  Plus,
  FileCheck,
  Briefcase,
  User,
  Mail,
  Phone
} from "lucide-react";

// Helper to sanitize image URLs for production
const cleanImageUrl = (url) => {
  if (!url) return "";

  // If it's a localhost URL (any common port), replace with production base
  if (url.includes("localhost:") && url.includes("/api/")) {
    const parts = url.split("/api/");
    return `https://api.jssabhiyan.com/api/${parts[1]}`;
  }

  // If it starts with /api/, handle production mapping
  if (url.startsWith("/api/")) {
    // Avoid double /api if the path already starts with it
    return `https://api.jssabhiyan.com${url}`;
  }

  // Handle paths that might be relative without /api/
  if (!url.startsWith("http") && !url.startsWith("/api/")) {
    const cleanPath = url.startsWith("/") ? url.slice(1) : url;
    if (cleanPath.startsWith("uploads/") || cleanPath.startsWith("files/")) {
      return `https://api.jssabhiyan.com/api/${cleanPath}`;
    }
    return `https://api.jssabhiyan.com/api/files/${cleanPath}`;
  }

  return url;
};

// Helper to convert number to Indian currency words
const numberToWords = (num) => {
  if (num === 0) return "Zero";
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + (n % 100 !== 0 ? "and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + (n % 1000 !== 0 ? inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + (n % 100000 !== 0 ? inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + "Crore " + (n % 10000000 !== 0 ? inWords(n % 10000000) : "");
  };

  return inWords(num).trim() + " Rupees";
};

export const AuthorizationTemplate = ({ staff, templateRef }) => {
  const displayId = `JSSA/STAFF/${staff?._id?.slice(-6).toUpperCase()}`;
  const postName = staff?.jobRoleId?.jobTitle || "Administrative Staff";
  const targetDateStr = staff?.createdAt ? staff.createdAt : new Date();
  const currentDate = new Date(targetDateStr).toLocaleDateString();
  const currentDateTime = new Date(targetDateStr).toLocaleString();

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
        <div className="flex gap-2"><span>Dear Mr./Mrs.:</span><span className="text-gray-900 font-bold uppercase border-b border-gray-300">{staff?.name}</span></div>
        <div className="flex gap-2"><span>S/O(D/O):</span><span className="text-gray-900 font-bold uppercase border-b border-gray-300">{staff?.fatherName}</span></div>
        <div className="flex gap-2"><span>DOB:</span><span className="text-gray-900 font-bold border-b border-gray-300">{staff?.dob ? new Date(staff.dob).toLocaleDateString() : 'N/A'}</span></div>
        <div className="flex gap-2"><span>Staff ID:</span><span className="text-gray-900 font-black border-b border-gray-300 tracking-tighter uppercase">{displayId}</span></div>
      </div>

      <div className="font-bold mb-6 text-[13px] border-l-4 border-green-600 pl-4 py-1 text-left">
        Subject: Authorization for the post of <span className="text-gray-900 uppercase font-black">{postName}</span> in our organization.
      </div>

      <p className="mb-4 text-justify">
        Our organization is delighted offer you the authorization of <span className="font-black underline">{postName}</span> for
        <span className="text-gray-900 font-black underline italic uppercase"> {staff?.district} ({staff?.state}) </span> on probation period for three months from the date of appointment.
        On expiry of the probationary period it is open for the management either to confirm your services or extend your probationary period.
        Such an extension can be granted for a maximum of 11 months more. The Management, however, reserves the right to terminate your services
        without assigning any reason during the probationary period, or the extended probationary period. However, during the probation period,
        services can be discontinued without any notice.
      </p>

      <p className="mb-4">Your selection has been made on the basis of educational qualification, experience and interview.</p>

      <p className="mb-4 text-justify italic font-medium leading-relaxed">As the <span className="font-black underline uppercase text-gray-900">{postName}</span>, you will be responsible for full-fill the target of our organization's project JAN SWASTHYA SAHAYATA ABHIYAN in your jurisdiction where you are posted & follow the instructions of your senior officer.</p>

      <p className="mb-4">Your employment with our organization will be on contract basis, which means you and the organization are free to terminate employment at any time, with or without cause or advance notice.</p>

      <div className="mb-4 font-bold border-l-4 border-green-600 pl-4 bg-green-50 p-4 rounded-r-lg shadow-sm">
        <p>If you meet the monthly target set by the organization, your initial income will be based on organizational policies for the <span className="text-green-600 font-black text-base">{postName}</span> role.</p>
        <p className="mt-1 text-[11px] text-gray-600 font-medium leading-relaxed italic border-t border-green-100 pt-1">
          Performance bonuses and allowances will be credited based on organizational policies.
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
              </div>
              <div className="flex gap-2">HR Department Date: <span className="text-gray-900 font-black">{currentDateTime}</span></div>
              <div className="flex gap-2">
                JAN SWASTHYA SAHAYATA ABHIYAN Place :
                <span className="text-gray-900 font-black uppercase underline">
                  {staff?.district} ({staff?.state})
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
              {staff?.signature ? (
                <img
                  src={cleanImageUrl(staff.signature)}
                  alt="Staff Signature"
                  className="max-h-full max-w-full mix-blend-multiply transition-all grayscale contrast-125 hover:grayscale-0"
                />
              ) : (
                <div className="text-[8px] text-sky-300 italic font-black uppercase tracking-widest">Digital Authentication Required</div>
              )}
            </div>
            <div className="text-gray-900 font-black text-[12px] uppercase tracking-tighter border-b-4 border-gray-400 inline-block px-4 pb-0.5">
              {staff?.name}
            </div>
            <div className="text-[8px] text-gray-400 font-bold uppercase mt-1 tracking-[0.2em]">Digitally Signed By Staff</div>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-4 border-t border-gray-100 text-right text-[8px] text-gray-400 font-black italic tracking-widest">
        Page 1/1
      </div>
    </div>
  );
};

export const ConsentTemplate = ({ staff, templateRef }) => {
  const displayId = `JSSA/STAFF/${staff?._id?.slice(-6).toUpperCase()}`;
  const postName = staff?.jobRoleId?.jobTitle || "Administrative Staff";
  const targetDateStr = staff?.createdAt ? staff.createdAt : new Date();
  const currentDate = new Date(targetDateStr).toLocaleString();
  const currentDateTime = new Date(targetDateStr).toLocaleString();

  const points = [
    `Selection is being done by the social service organization NAC (which is registered under the Companies Act 2013 (section 8)) under JAN SWASTHYA SAHAYATA ABHIYAN against the post of ${postName}`,
    `Facilities given to permanent employees will not be admissible as ${postName}`,
    "Selection will be purely on contract basis and neither the permanent employee of the organization nor the organization will be entitled for regularization in the service.",
    "This selection will be for a probationary period of 3 months from the date of appointment. On expiry of the probationary period it is open for the management either to confirm your services or extend your probationary period. Such an extension can be granted for a maximum of 11 months more, The Management, however, reserves the right to terminate your services without assigning any reason during the probationary period, or the extended probationary period. However during the probation period, services can be discontinued without any notice.",
    "Legal action will be taken by terminating the service at any time after giving a notice to the selection received on the basis of wrong facts and papers.",
    "I have not committed a cognizable offense and have not been imprisoned in any case.",
    "selection may be terminated at any time as per the requirement or as decided by the Director of the organization.",
    "verification of wrong documents given by me, legal action will be taken against me and I will not be entitled for honorarium and incentive.",
    `The service of the selected ${postName} is not satisfactory and does not follow the discipline, he will be terminated from service at any time by giving a notice.`,
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
    `I have applied on my own free will and full discretion to work on the post of ${postName} in the organization, no pressure has been put on me for this.`
  ];

  return (
    <div className="text-[12px] leading-relaxed text-gray-800 font-sans p-12 bg-white border" ref={templateRef}>
      <div className="mb-0 text-left">
        <div className="text-[11px] font-bold uppercase">Ref. No. <span className="text-gray-900 font-black">JSSA/LC/{staff?._id?.slice(-6).toUpperCase()}</span></div>
      </div>

      <div className="text-center mb-8  mt-3">
        <img src={logoLong} alt="JSSA Header" className="w-full max-w-[450px] mx-auto" />
        <div className="w-full h-[1px] bg-green-500/30 mt-4"></div>
      </div>

      <h2 className="text-center text-lg font-black underline mb-6 uppercase tracking-widest">Letter of Consent</h2>

      <div className="flex gap-6 mb-8 items-start">
        <div className="flex-1 text-justify scale-y-105">
          This consent letter is being done on <span className="text-gray-900 font-bold underline underline-offset-4">{currentDate}</span> between <span className="font-bold uppercase tracking-tighter underline">JAN SWASTHYA SAHAYATA ABHIYAN</span> (A project of Healthcare Research and Development Board organized under NAC which is registered under companies act 2013 (section 8) Reg.No:053083) and selected <span className="font-black text-gray-900 uppercase underline decoration-gray-200">{postName}</span> <span className="text-gray-900 font-black underline uppercase">{staff?.name}</span> S/O(D/O) <span className="text-gray-900 font-black underline uppercase">{staff?.fatherName}</span> Under <span className="font-bold underline">JAN SWASTHYA SAHAYATA ABHIYAN</span> with the following conditions.
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <div className="w-32 h-36 border-[3px] border-black p-0.5 bg-white shadow-xl rounded-sm overflow-hidden">
            <img src={cleanImageUrl(staff?.photo)} alt="Photo" className="w-full h-full object-cover grayscale-[20%]" />
          </div>
          <div className="w-32 h-14 border-[3px] border-sky-300 p-1 bg-sky-50 shadow-inner rounded-sm overflow-hidden flex items-center justify-center">
            <img src={cleanImageUrl(staff?.signature)} alt="Sign" className="max-w-full max-h-full mix-blend-multiply transition-all grayscale contrast-125" />
          </div>
        </div>
      </div>

      <div className="space-y-4 pr-2">
        {points.map((text, idx) => (
          <div key={idx} className="flex gap-3 text-justify leading-snug">
            <span className="font-black min-w-[20px] text-gray-400">{idx + 1}.</span>
            <p className={`${text.includes(postName) ? 'font-bold text-gray-900 underline decoration-gray-200' : 'text-gray-700 font-medium'}`}>{text}</p>
          </div>
        ))}
      </div>

      {/* Footer Block */}
      <div className="mt-16 flex justify-between items-start border-t border-gray-100 pt-8">
        <div className="space-y-1 text-left">
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
            <img src={cleanImageUrl(staff?.signature)} alt="Sign" className="max-w-full max-h-full mix-blend-multiply transition-all grayscale contrast-150" />
          </div>
          <div className="text-[14px] font-black text-gray-900 uppercase tracking-tighter underline underline-offset-4 decoration-gray-200">
            {postName}
          </div>
          <div className="text-[10px] font-bold text-gray-500">Date: <span className="text-gray-900 font-black">{currentDateTime}</span></div>
          <div className="text-[10px] font-bold text-gray-500">Place: <span className="text-gray-900 font-black uppercase underline">{staff?.district} ({staff?.state})</span></div>
        </div>
      </div>

      <div className="mt-12 text-center text-[9px] text-gray-300 font-black tracking-[0.5em] uppercase">
        Verfied Document JSSA/NAC/OFFICIAL
      </div>
    </div>
  );
};

export const MOUTemplate = ({ staff, templateRef }) => {
  const displayId = `JSSA/STAFF/${staff?._id?.slice(-6).toUpperCase()}`;
  const postName = staff?.jobRoleId?.jobTitle || "Administrative Staff";
  const targetDateStr = staff?.createdAt ? staff.createdAt : new Date();
  const currentDate = new Date(targetDateStr).toLocaleDateString();
  const currentDateTime = new Date(targetDateStr).toLocaleString();

  return (
    <div className="text-[11px] leading-relaxed text-gray-800 font-sans" ref={templateRef}>
      {/* ─── PAGE 1 ─── */}
      <div className="mb-20 p-12 bg-white border shadow-sm">
        <div className="mb-0 text-left ">
          <div className="text-[11px] font-bold">Ref. No. <span className="text-gray-900">JSSA/STAFF/ML/{staff?._id?.slice(-6).toUpperCase()}</span></div>
        </div>

        {/* Centered Header */}
        <div className="text-center mb-8  mt-3">
          <img src={logoLong} alt="JSSA Header" className="w-full max-w-[450px] mx-auto" />
          <div className="w-full h-[1px] bg-green-500/30 mt-4"></div>
        </div>

        <h2 className="text-center text-lg font-black underline mb-8 uppercase tracking-widest">Memorandum Of Understanding Cum Agreement</h2>

        <p className="mb-6 text-justify">
          This MOU cum agreement is being done on <span className="text-gray-900 underline font-bold">{currentDate}</span> between <span className="font-bold uppercase tracking-tight">JAN SWASTHYA SAHAYATA ABHIYAN</span> (A project of Healthcare Research and Development Board organized under NAC which is registered under companies act 2013 (section 8) Reg.No:053083) and selected <span className="font-black underline uppercase">{postName}</span> <span className="text-gray-900 font-black underline uppercase">{staff?.name}</span> S/O(D/O) <span className="text-gray-900 font-black underline uppercase">{staff?.fatherName}</span> under <span className="font-bold uppercase tracking-tight">JAN SWASTHYA SAHAYATA ABHIYAN</span> with The following conditions
        </p>

        <div className="space-y-1 mb-8 border-l-4 border-gray-400 pl-4 bg-gray-50/20 py-2 text-left">
          <div className="font-bold">Dear Mr./Mrs.: <span className="text-gray-900 uppercase underline">{staff?.name}</span></div>
          <div className="font-bold">S/O(D/O): <span className="text-gray-900 uppercase underline">{staff?.fatherName}</span></div>
          <div className="font-bold">Staff ID: <span className="text-gray-900 underline">{displayId}</span></div>
        </div>

        <p className="mb-6 italic text-left">The management of the Company congratulates you on your decision to join us. The terms and conditions of employment are as follows:</p>

        <div className="space-y-4 text-left">
          <div>
            <span className="font-black underline mr-2">1.0 Designation/Department:</span>
            Your designation shall be <span className="font-black uppercase underline">{postName}</span>. You shall report to our HR department & email: (joining.jssabhiyan@gmail.com). These may change in the interest of the company, if required within the framework of your designation.
          </div>
          <div>
            <span className="font-black underline mr-2">2.0 Commencement:</span>
            Your period of employment commences After providing training and authorization letter.
          </div>
          <div>
            <span className="font-black underline mr-2">3.0 Place Of Work:</span>
            You will be posted in <span className="text-gray-900 font-black uppercase underline">{staff?.district}, {staff?.state}</span> but the Company reserves the right to transfer or depute you at any time from one to another district, block, panchayat branch office, subsidiary, associate companies or client locations situated anywhere in India or abroad, whether existing or acquired/established later on. Such transfer or deputation will be as per Company's policies.
          </div>
          <div>
            <span className="font-black underline mr-2">4.0 Confirmation:</span>
            You will be on probation for Three months from the date of appointment. On expiry of the probationary period it is open for the management either to confirm your services or extend your probationary period. Such an extension can be granted for a maximum of 11 months more, The an agreement, however, reserves the right to terminate your services without assigning any reason during the probationary period, or the extended probationary period. However during the probation period, services can be discontinued without any notice.
          </div>
          <div>
            <span className="font-black underline mr-2">5.0 Compensation:</span>
            For this position, if you meet the monthly target given by the organization, then the initial Income will be as per the organizational salary structure for the {postName} role. If you do not meet the monthly target given by the organization, you will get Label% the work you have done for the entire target for that month will be given to you as income for that month Payment is on the basis of wallet recharge through online.
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
              <img src={cleanImageUrl(staff?.signature)} alt="Sign" className="max-w-full max-h-full mix-blend-multiply transition-all grayscale contrast-150" />
            </div>
            <div className="font-black text-[12px] uppercase">{staff?.name}</div>
            <div className="text-[9px] font-bold text-gray-400">Digitally Signed By Staff</div>
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
          This Non-Disclosure Agreement (this "Agreement") is entered into this <span className="font-bold underline">{currentDate}</span> by and between <span className="font-black">Jan Swasthya Sahayata Abhiyan</span> (project of Healthcare Research & development Board, organized under NAC which is registered under Companies Act 2013 having its registration number 053083 under the provision of section 8) and <span className="font-black text-gray-900 underline uppercase">{staff?.name}</span> S/O(D/O) <span className="font-black text-gray-900 underline uppercase">{staff?.fatherName}</span> (Recipient" or "Staff").
        </p>

        <div className="font-black mb-4">WITNESSETH</div>

        <div className="space-y-4 mb-8 text-left">
          <p>WHEREAS Staff has agreed to commence work as an Staff of organization and is signing an Employment Agreement to that effect;</p>
          <p>WHEREAS, Staff may be exposed and have access to confidential and/or proprietary information of the Company WHEREAS in order to induce such exposure and access, the parties hereto desire to undertake certain obligations of confidentiality, non-disclosure and non competition as set forth herein;</p>
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
          <p>5.1 Engage whether as an staff, partner, joint venture, investor, director, consultant or otherwise, in any business activity which is directly or indirectly in competition anywhere in the world, with any of the products or services being developed, marketed, distributed, planned, sold or otherwise provided by the Company during the time of performing the activities, obligations, efforts and / or Services.</p>
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
          IN WITNESS WHEREOF the Staff has executed this Agreement as of the date first written above. STAFF
        </div>

        <div className="flex justify-between items-start mt-10 text-left">
          <div className="space-y-1">
            <div className="w-48 h-24 mb-2 flex items-center justify-center border-2 border-gray-100 bg-gray-50 rounded shadow-inner overflow-hidden">
              <img src={cleanImageUrl(staff?.signature)} alt="Sign" className="max-w-full max-h-full mix-blend-multiply grayscale contrast-125" />
            </div>
            <div className="text-[10px] space-y-1">
              <div>Name: <span className="text-gray-900 font-black uppercase underline">{staff?.name}</span></div>
              <div>S/O: <span className="text-gray-900 font-black uppercase underline">{staff?.fatherName}</span></div>
              <div>Title: <span className="font-black uppercase underline underline-offset-2">{postName}</span></div>
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

export const OfferLetterTemplate = ({ staff, templateRef }) => {
  const displayId = `JSSA/STAFF/${staff?._id?.slice(-6).toUpperCase()}`;
  const postName = staff?.jobRoleId?.jobTitle || "Administrative Staff";
  const currentDate = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
  const effectiveDate = staff?.createdAt ? new Date(staff.createdAt).toLocaleDateString('en-GB') : currentDate;
  const acceptanceDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');

  const salary = staff?.salaryStructure || {};
  const monthlyGross = salary.grossSalary || 0;
  const yearlyGross = monthlyGross * 12;

  return (
    <div className="text-[11px] leading-relaxed text-gray-800 font-sans" ref={templateRef}>
      {/* ─── PAGE 1: OFFER LETTER ─── */}
      <div className="mb-20 p-12 bg-white border shadow-sm relative overflow-hidden">
        {/* Background Watermark */}
        <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center pointer-events-none rotate-[-30deg]">
          <img src={logoLong} alt="Watermark" className="w-[800px]" />
        </div>

        <div className="text-center mb-6">
          <img src={logoLong} alt="JSSA Header" className="w-full max-w-[550px] mx-auto" />
          <div className="w-full h-[3px] bg-green-600/50 mt-2"></div>
        </div>

        <h2 className="text-center text-sm font-black mb-6 uppercase tracking-tighter border-y border-gray-200 py-1">AUTHORIZATION / OFFER LETTER</h2>

        <div className="flex justify-between mb-6">
          <div className="space-y-0.5">
            <div className="font-bold flex gap-1">To,</div>
            <div className="font-bold flex gap-1">Mr. Mrs. <span className="text-gray-900 uppercase">{staff?.name}</span></div>
            <div className="font-bold flex gap-1">D/O.S/O.W/O: <span className="text-gray-900 uppercase">{staff?.fatherName}</span></div>
            <div className="font-bold flex gap-1">Date of Birth: <span className="text-gray-900">{staff?.dob ? new Date(staff.dob).toLocaleDateString('en-GB') : '—'}</span></div>
            <div className="font-bold flex gap-1">Email: <span className="text-gray-900 underline">{staff?.email}</span></div>
            <div className="font-bold flex gap-1 text-[10px]">ID NO : <span className="font-black">{displayId}</span></div>
          </div>
          <div className="text-right">
            <div className="font-bold">Date: <span className="text-gray-900">{currentDate}</span></div>
          </div>
        </div>

        <div className="mb-6">
          <span className="font-black text-xs">Subject: Authorization for the Post of <span className="text-gray-900 uppercase">{postName} ({staff?.state})</span></span>
        </div>

        <div className="space-y-3 text-justify">
          <p>Dear Ms. <span className="text-gray-900 font-bold">{staff?.name}</span>,</p>
          <p>
            We are pleased to inform you that you are hereby authorized for the position of <span className="text-gray-900 font-black">{postName}</span> in our organization <span className="font-black">Jan Swasthya Sahayata Abhiyan</span>. Your appointment will be effective from <span className="text-gray-900 font-bold">{effectiveDate}</span>, subject to verification of your educational qualifications, experience, and interview.
          </p>

          <div className="space-y-2">
            <p><span className="font-black">1. Roles & Responsibilities:</span> As a <span className="text-gray-900 font-bold">{postName}</span>, you will be responsible for achieving the targets of the organization's project <span className="italic">Jan Swasthya Sahayata Abhiyan</span> within your assigned jurisdiction and for following the instructions of your senior officers.</p>

            <p><span className="font-black">2. Nature of Employment:</span> <span className="font-bold">Your</span> employment will be on a contractual basis. This means that both you and the organization are free to terminate the employment at any time, with or without cause or prior notice.</p>

            <div className="space-y-1">
              <p><span className="font-black">3. Honorarium / Salary Structure</span></p>
              <ul className="list-none pl-6 space-y-1">
                <li className="flex gap-2">
                  <span>➢</span>
                  <span>If you successfully achieve the monthly target set by the organization, you will receive an honorarium of <span className="text-gray-900 font-bold">₹{monthlyGross.toLocaleString()} ({numberToWords(monthlyGross)})</span> per month.</span>
                </li>
                {staff?.cardCommission?.enabled && (
                  <>
                    <li className="flex gap-2">
                      <span>➢</span>
                      <span>If you perform work beyond the assigned target, you will be paid an additional <span className="text-gray-900 font-bold">₹{staff.cardCommission.amountPerCard} ({numberToWords(staff.cardCommission.amountPerCard)})</span> per card as a bonus for extra work.</span>
                    </li>
                    <li className="flex gap-2">
                      <span>➢</span>
                      <span>If you fail to achieve the monthly target, you will be paid <span className="text-gray-900 font-bold">₹{staff.cardCommission.amountPerCard} ({numberToWords(staff.cardCommission.amountPerCard)})</span> per card based on the total work completed during that month.</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <p><span className="font-black">4. Mode of Payment:</span> All payments will be made on a monthly basis through online transfer directly to your bank account.</p>

            <div className="space-y-1">
              <p><span className="font-black">5. Leave Policy</span></p>
              <ul className="list-none pl-6 space-y-1">
                <li className="flex gap-2"><span>➢</span><span>In addition to national holidays, you will be entitled to <span className="font-bold">18 casual leaves per year</span>.</span></li>
                <li className="flex gap-2"><span>➢</span><span>You must inform your senior officer prior to taking leave.</span></li>
                <li className="flex gap-2"><span>➢</span><span>If you remain absent for <span className="font-bold">11 consecutive days without notice</span>, your services may be terminated.</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 text-right text-[8px] text-gray-400 italic">Page 1/2</div>
      </div>

      <div className="w-full border-t-2 border-dashed border-gray-300 my-12"></div>

      {/* ─── PAGE 2: OFFER LETTER CONT. ─── */}
      <div className="mb-20 p-12 bg-white border shadow-sm relative overflow-hidden">
        {/* Background Watermark */}
        <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center pointer-events-none rotate-[-30deg]">
          <img src={logoLong} alt="Watermark" className="w-[800px]" />
        </div>

        <div className="space-y-4 text-justify mt-10">
          <p><span className="font-black">6. Working Hours :</span> Your working hours will be from <span className="font-bold">09:30 AM to 07:00 PM</span>, every day of the week.</p>

          <p><span className="font-black">7. PF (Employer Contribution), Gratuity, and Insurance Benefits</span> (Mediclaim, Term Life, and Accidental Coverage) shall become applicable to employees only after the successful completion of 3 months of continuous service with the organization.</p>

          <p><span className="font-black">8. Reporting Authority :</span> You will report directly to the HR Department. Email: <span className="text-blue-700 underline font-medium">jssabiyan.services@gmail.com</span></p>
        </div>

        <div className="mt-10 font-bold">
          Please confirm your acceptance of this offer by signing and returning this letter by <span className="text-gray-900">{acceptanceDate}</span>.
        </div>

        <div className="mt-12">
          <div className="font-bold mb-2">Sincerely,</div>
          <div className="w-40 h-14 mb-1">
            <img src={sing} alt="Sign" className="max-h-full mix-blend-multiply transition-all contrast-125" />
          </div>
          <div className="space-y-0.5 leading-tight">
            <div className="font-bold text-[10px]">A. Kamar</div>
            <div className="font-bold text-[9px] text-gray-600">Chief executive Director</div>
            <div className="font-black text-[9px] text-gray-800">Jan Swasthya Sahayata Abhiyan</div>
          </div>
        </div>

        <div className="mt-16 space-y-4">
          <div className="font-bold border-b border-gray-200 pb-2">
            <span className="font-black mr-2">Acceptance :</span> I, <span className="text-gray-900 uppercase font-black">{staff?.name}</span>, have read and understood the above terms and conditions and hereby accept the offer.
          </div>

          <div className="flex justify-end pt-10">
            <div className="text-right">
              <div className="font-bold mb-1">( Signature)</div>
              <div className="w-48 h-16 border-b border-dashed border-gray-300 mb-2 flex items-center justify-center">
                {staff?.signature && <img src={cleanImageUrl(staff.signature)} className="max-h-full grayscale contrast-150 mix-blend-multiply" />}
              </div>
              <div className="text-gray-900 font-black uppercase text-[12px]">{staff?.name}</div>
              <div className="font-bold text-gray-900 text-[10px]">Date: ...........</div>
            </div>
          </div>
        </div>

        <div className="mt-20 text-right text-[8px] text-gray-400 italic">Page 2/3</div>
      </div>

      <div className="w-full border-t-2 border-dashed border-gray-300 my-12"></div>

      {/* ─── PAGE 3: ANNEXURE-II ─── */}
      <div className="mb-20 p-12 bg-white border shadow-sm relative overflow-hidden">
        {/* Background Watermark */}
        <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center pointer-events-none rotate-[-30deg]">
          <img src={logoLong} alt="Watermark" className="w-[800px]" />
        </div>

        <div className="text-center mb-10">
          <h2 className="font-black text-sm uppercase tracking-widest">ANNEXURE-II</h2>
          <h3 className="font-bold text-xs uppercase tracking-tight">Compensation Details Confidential</h3>
        </div>

        <div className="grid grid-cols-2 gap-y-4 mb-8 text-[11px]">
          <div className="font-bold">Candidate name :- <span className="text-gray-900 uppercase font-black ml-2">{staff?.name}</span></div>
          <div className="font-bold text-right">Grade:- <span className="text-gray-900 uppercase font-black ml-2">{staff?.grade || 'Officer'}</span></div>
          <div className="font-bold">Positioning Name :- <span className="text-gray-900 uppercase font-black ml-2">{postName}</span></div>
          <div className="font-bold text-right">Location :- <span className="text-gray-900 uppercase font-black ml-2">{staff?.state}</span></div>
        </div>

        <table className="w-full border-collapse border border-gray-400 text-[10px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-400 p-1.5 text-center w-16">Sr. No</th>
              <th className="border border-gray-400 p-1.5 text-left">Particulars</th>
              <th className="border border-gray-400 p-1.5 text-right w-32">Monthly(Rs.)</th>
              <th className="border border-gray-400 p-1.5 text-right w-32">Yearly (Rs.)</th>
            </tr>
          </thead>
          <tbody className="font-medium">
            <tr>
              <td className="border border-gray-400 p-1.5 text-center">1</td>
              <td className="border border-gray-400 p-1.5 text-right italic pr-10">Basic Salary</td>
              <td className="border border-gray-400 p-1.5 text-right">{(salary.basic || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="border border-gray-400 p-1.5 text-right">{((salary.basic || 0) * 12).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-1.5 text-center">2</td>
              <td className="border border-gray-400 p-1.5 text-right italic pr-10">HRA</td>
              <td className="border border-gray-400 p-1.5 text-right">{(salary.hra || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="border border-gray-400 p-1.5 text-right">{((salary.hra || 0) * 12).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-1.5 text-center">3</td>
              <td className="border border-gray-400 p-1.5 text-right italic pr-10">Special Allowance</td>
              <td className="border border-gray-400 p-1.5 text-right">{(salary.specialAllowance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="border border-gray-400 p-1.5 text-right">{((salary.specialAllowance || 0) * 12).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-1.5 text-center">4</td>
              <td className="border border-gray-400 p-1.5 text-right italic pr-10">Medical Allowance</td>
              <td className="border border-gray-400 p-1.5 text-right">{(salary.medicalAllowance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="border border-gray-400 p-1.5 text-right">{((salary.medicalAllowance || 0) * 12).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-1.5 text-center">5</td>
              <td className="border border-gray-400 p-1.5 text-right italic pr-10">Conveyance Allowance</td>
              <td className="border border-gray-400 p-1.5 text-right">{(salary.conveyanceAllowance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="border border-gray-400 p-1.5 text-right">{((salary.conveyanceAllowance || 0) * 12).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-1.5 text-center">6</td>
              <td className="border border-gray-400 p-1.5 text-right italic pr-10">Statutory Bonus</td>
              <td className="border border-gray-400 p-1.5 text-right">{(salary.statutoryBonus || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="border border-gray-400 p-1.5 text-right">{((salary.statutoryBonus || 0) * 12).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-1.5 text-center">7</td>
              <td className="border border-gray-400 p-1.5 text-right italic pr-10">Mobile Bill Reimbursement</td>
              <td className="border border-gray-400 p-1.5 text-right">{(salary.mobileBill || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="border border-gray-400 p-1.5 text-right">{((salary.mobileBill || 0) * 12).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-1.5 text-center"></td>
              <td className="border border-gray-400 p-1.5 text-center italic font-black">Performance Bonus</td>
              <td className="border border-gray-400 p-1.5 text-right">{(salary.performanceBonus || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="border border-gray-400 p-1.5 text-right">{((salary.performanceBonus || 0) * 12).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-1.5 text-center"></td>
              <td className="border border-gray-400 p-1.5 text-center font-black">Gross Salary</td>
              <td className="border border-gray-400 p-1.5 text-right font-black">{(monthlyGross).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="border border-gray-400 p-1.5 text-right font-black">{(yearlyGross).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-400 p-1.5 text-center" colSpan={4}>
                <span className="font-black text-[11px] uppercase tracking-widest">Benefit</span>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-1.5 text-center">1</td>
              <td className="border border-gray-400 p-1.5 text-left italic font-bold">PF ( Employer Contribution)</td>
              <td className="border border-gray-400 p-1.5 text-right">{(salary.benefits?.pf || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="border border-gray-400 p-1.5 text-right">{((salary.benefits?.pf || 0) * 12).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-1.5 text-center">2</td>
              <td className="border border-gray-400 p-1.5 text-left italic font-bold">Gratuity #</td>
              <td className="border border-gray-400 p-1.5 text-right">{(salary.benefits?.gratuity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="border border-gray-400 p-1.5 text-right">{((salary.benefits?.gratuity || 0) * 12).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-1.5 text-center">3</td>
              <td className="border border-gray-400 p-1.5 text-left italic font-bold">Insurance Valuation- Mediclaim, Term Life And Accidental Benefit</td>
              <td className="border border-gray-400 p-1.5 text-right">{(salary.benefits?.insurance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="border border-gray-400 p-1.5 text-right">{((salary.benefits?.insurance || 0) * 12).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr className="bg-gray-100">
              <td className="border border-gray-400 p-1.5 text-center"></td>
              <td className="border border-gray-400 p-1.5 text-center font-black uppercase">Cost Company (CTC)</td>
              <td className="border border-gray-400 p-1.5 text-right font-black">{(salary.ctc || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="border border-gray-400 p-1.5 text-right font-black">{((salary.ctc || 0) * 12).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 text-center font-bold text-[9px]">
          # Payable As Per The Payment Of Gratuity Act.
        </div>

        <div className="mt-8 text-justify text-[10px] leading-relaxed">
          <span className="font-black">Confidentiality :</span> Matter of your compensation is confidential information of the bank and should be treated with absolute confidentiality except to the extent you are required to make disclosure for any tax, legal or regulatory purpose. Any breach of these confidentiality obligations will be considered as breach of fidelity and secrecy clause under your terms of appointment.
        </div>

        <div className="mt-20 text-right text-[8px] text-gray-400 italic">Page 3/3</div>
      </div>
    </div>
  );
};

export const IDCardTemplate = ({ staff, templateRef }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [staff?.photo]);

  const designation = staff?.jobRoleId?.jobTitle || "Administrative Staff";
  const displayId = `JSSA/STAFF/${staff?._id?.slice(-6).toUpperCase()}`;

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
              {staff?.photo && !imageError ? (
                <img src={cleanImageUrl(staff.photo)} alt="Identity" className="w-full h-full object-cover" onError={() => setImageError(true)} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Half - Details */}
        <div className="h-[314px] bg-white pt-[75px] flex flex-col items-center px-6 relative z-10 w-full overflow-hidden shrink-0">
          {/* Central Watermark */}
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-0 mt-8">
            <img src={logoLong} alt="Watermark" className="w-[160px] object-contain opacity-[0.05] grayscale" />
          </div>

          {/* Name & Designation */}
          <div className="text-center w-full z-10 mb-3 mt-1">
            <div className="text-[21px] font-black uppercase text-gray-900 leading-none tracking-tight mb-1">
              {staff?.name}
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
                  <td className="text-[#1B9E4B] font-black text-[12px] uppercase tracking-tight">{displayId}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="text-gray-500 uppercase font-bold tracking-widest py-1 align-top pt-1.5">Father</td>
                  <td className="text-gray-400 font-bold align-top pt-1.5">:</td>
                  <td className="text-gray-800 font-black uppercase leading-tight pt-1.5">{staff?.fatherName}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="text-gray-500 uppercase font-bold tracking-widest py-1">D.O.B</td>
                  <td className="text-gray-400 font-bold">:</td>
                  <td className="text-gray-800 font-black">{staff?.dob ? new Date(staff.dob).toLocaleDateString('en-GB') : '—'}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="text-gray-500 uppercase font-bold tracking-widest py-1">Email</td>
                  <td className="text-gray-400 font-bold">:</td>
                  <td className="text-[#1B9E4B] font-bold truncate">{staff?.email || '—'}</td>
                </tr>
                <tr>
                  <td className="text-gray-500 uppercase font-bold tracking-widest py-1 align-top pt-1.5">Location</td>
                  <td className="text-gray-400 font-bold align-top pt-1.5">:</td>
                  <td className="text-gray-800 font-black uppercase pt-1.5 pr-1 pb-1">
                    <div className="leading-[1.6] text-[8.5px]">{staff?.district}, {staff?.state}</div>
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

const StaffLetters = () => {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-green-50 border-2 border-green-600 flex items-center justify-center mb-6">
          <FileText className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">Official Letters</h1>
        <p className="text-gray-600 font-bold max-w-md leading-relaxed mb-6">
          All your official letters (Offer Letter, Authorization Letter, Consent Letter, MOU, and ID Card) have been successfully shifted to your Profile page.
        </p>
        <a
          href="/staff/profile"
          className="px-6 py-3 bg-[#3AB000] text-white font-bold text-sm uppercase tracking-wider hover:bg-green-700 transition-all border-2 border-[#3AB000] shadow-md shadow-[#3AB000]/10"
        >
          Go to Profile
        </a>
      </div>
    </DashboardLayout>
  );
};

export default StaffLetters;

