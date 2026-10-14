import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Languages,
  Loader2,
  Monitor,
  Phone,
  PlayCircle,
  Trophy,
  XCircle,
} from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { createPaperAPI } from "../../utils/api";
import { useBlueBodyTheme } from "../../components/AdminBlueTheme";
import jssa_logo_new from "../../assets/JSSAogo.png";
import main_sign from "../../assets/mainSign.png";

// ─── Static Mock Data ────────────────────────────────────────────────────────
const MOCK_EXAMS = [
  {
    id: "exam-001",
    title: "Mathematics Final Exam",
    class: "Class 10",
    type: "Final",
    duration: 60,
    windowStatus: "active",
    canStart: true,
    attemptsUsed: 0,
    maxAttempts: 1,
    startDate: "2025-03-25",
    endDate: "2025-03-28",
    questions: [
      {
        id: "q1",
        question: "What is the value of √144?",
        options: ["10", "11", "12", "13"],
      },
      {
        id: "q2",
        question: "Solve: 3x + 5 = 20. What is x?",
        options: ["3", "4", "5", "6"],
      },
      {
        id: "q3",
        question: "What is the area of a circle with radius 7 cm? (π = 22/7)",
        options: ["144 cm²", "154 cm²", "164 cm²", "174 cm²"],
      },
      {
        id: "q4",
        question: "Which of the following is a prime number?",
        options: ["21", "27", "29", "33"],
      },
      {
        id: "q5",
        question: "What is the LCM of 12 and 18?",
        options: ["24", "30", "36", "48"],
      },
    ],
  },
  {
    id: "exam-002",
    title: "Science Mid-Term",
    class: "Class 9",
    type: "Mid-Term",
    duration: 45,
    windowStatus: "active",
    canStart: false,
    attemptsUsed: 1,
    maxAttempts: 1,
    startDate: "2025-03-24",
    endDate: "2025-03-27",
    questions: [
      {
        id: "s1",
        question: "What is the chemical formula of water?",
        options: ["H2O", "CO2", "O2", "H2SO4"],
      },
      {
        id: "s2",
        question: "Which planet is closest to the Sun?",
        options: ["Venus", "Earth", "Mercury", "Mars"],
      },
    ],
  },
  {
    id: "exam-003",
    title: "English Literature Quiz",
    class: "Class 11",
    type: "Quiz",
    duration: 30,
    windowStatus: "upcoming",
    canStart: false,
    attemptsUsed: 0,
    maxAttempts: 1,
    startDate: "2025-04-01",
    endDate: "2025-04-03",
    questions: [
      {
        id: "e1",
        question: "Who wrote 'Romeo and Juliet'?",
        options: [
          "Charles Dickens",
          "William Shakespeare",
          "Mark Twain",
          "Jane Austen",
        ],
      },
    ],
  },
  {
    id: "exam-004",
    title: "History Annual Exam",
    class: "Class 8",
    type: "Annual",
    duration: 90,
    windowStatus: "ended",
    canStart: false,
    attemptsUsed: 1,
    maxAttempts: 1,
    startDate: "2025-02-10",
    endDate: "2025-02-12",
    questions: [
      {
        id: "h1",
        question: "In which year did World War II end?",
        options: ["1943", "1944", "1945", "1946"],
      },
    ],
  },
];

// ─── Static API Simulators ────────────────────────────────────────────────────
const getStudentRewardAwardExams = async () => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_EXAMS), 500));
};

const submitStudentRewardAwardAttempt = async (examId, payload) => {
  return new Promise((resolve) =>
    setTimeout(() => {
      console.log("Mock submit:", examId, payload);
      resolve({ success: true });
    }, 800),
  );
};
// ─────────────────────────────────────────────────────────────────────────────

const STEP = {
  list: "list",
  instructions: "instructions",
  running: "running",
  submitted: "submitted",
  review: "review",
  result: "result",
};

const formatCertDateGlobal = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("hi-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const CertificateTemplate = ({ exam, templateRef }) => {
  if (!exam) return <div ref={templateRef} style={{ display: 'none' }}></div>;
  const score = exam.userAttempt?.score || 0;
  const total = exam.totalMarks || 100;
  const pct = total ? ((score / total) * 100).toFixed(2) : 0;
  const name = exam.userAttempt?.applicationId?.candidateName || "_________________";
  const fName = exam.userAttempt?.applicationId?.fatherName || "_________________";
  const appNo = exam.userAttempt?.applicationId?.applicationNumber || "_________________";

  return (
    <div
      style={{ position: 'absolute', top: '0', left: '0', width: '1122px', zIndex: -9999, opacity: 0, pointerEvents: 'none', backgroundColor: 'white' }}
      ref={templateRef}
      className="adm-keep"
    >
      <div style={{ padding: '0px', width: '1122px', height: '793px' }}>
        <div
          className="bg-[#4D7C0F] relative font-sans mx-auto flex items-center justify-center"
          style={{ width: "1050px", height: "750px", boxSizing: "border-box", padding: "12px", marginTop: '18px' }}
        >
          <div
            className="bg-white w-full h-full relative flex flex-col"
            style={{ boxSizing: "border-box", padding: "10px 48px 20px 48px", fontFamily: "Arial, sans-serif", color: "#000", lineHeight: "1.4" }}
          >
            {/* Watermark Background */}
            <div className="absolute left-0 right-0 bottom-0 top-[200px] z-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
              <img src={jssa_logo_new} alt="Watermark" className="w-[550px] h-auto object-contain" />
            </div>

            {/* Header */}
            <div className="relative z-10 flex flex-row items-center justify-start mb-4 border-b-2 border-[#4D7C0F] pb-4 mt-2 px-2 gap-6">
              <img src={jssa_logo_new} alt="Logo" className="h-32 object-contain" />
              <div className="flex flex-col text-left">
                <h1 className="text-2xl font-extrabold text-[#4D7C0F]" style={{ fontFamily: 'sans-serif' }}>
                  जनआरोग्यसहायताअभियान/Jan Aarogya Sahayata Abhiyan
                </h1>
                <p className="text-sm font-bold text-[#1A2E05] mt-0.5">
                  (This Project Is Organized Under Social Welfare Organization)
                </p>
                <p className="text-sm font-bold text-gray-800">
                  Registration No. : {appNo}
                </p>
                <p className="text-[12px] font-semibold text-gray-700 mt-1">
                  Reg. Off.: Riding Road, Sheikhpura, New Capital Patna, Bihar, India - 800014
                </p>
                <p className="text-[12px] font-semibold text-gray-700">
                  Corp. Off.: 98, Nehru Place New Delhi, India - 110001
                </p>
                <p className="text-[11px] font-bold text-gray-800 mt-0.5">
                  Website: <span className="text-[#3F6212] underline">https://jssabhiyan.com/</span> | Email: <span className="text-[#3F6212] underline">Support@Jssabhiyan.Com</span>
                </p>
              </div>
            </div>

            <div className="text-right text-xs font-bold mb-2">
              दिनांक: {formatCertDateGlobal(exam.userAttempt?.createdAt)}
            </div>

            <div className="text-center mb-4 mt-10">
              <span className="text-xl font-black text-black border-b-2 border-black pb-1 uppercase">प्रमाणपत्र</span>
            </div>

            <div className="text-justify text-[15px] leading-7 font-semibold px-2" style={{ fontFamily: 'sans-serif' }}>
              यह प्रमाणित किया जाता है कि श्री / श्रीमती / कुमारी:
              <span className="border-b border-black px-4 inline-block min-w-[200px] text-center text-[#3F6212] italic">{name}</span>
              पिता / पति का नाम:
              <span className="border-b border-black px-4 inline-block min-w-[200px] text-center text-[#3F6212] italic">{fName}</span>
              आवेदन सं.:
              <span className="border-b border-black px-4 inline-block min-w-[150px] text-center text-[#3F6212] ">{appNo}</span>
              ने जन आरोग्य सहायता अभियान द्वारा आयोजित “डिजिटल कौशल मूल्यांकन परीक्षा” को सफलतापूर्वक पूर्ण किया है तथा निर्धारित मानकों के अनुसार उत्तीर्ण घोषित किए गए हैं।
              इनका प्रदर्शन इस परीक्षा में संतोषजनक / उत्कृष्ट रहा है।
            </div>
            <div className="text-center italic font-bold mt-10 mb-10 text-[16px] text-[#3F6212]">
              हम इनके उज्ज्वल भविष्य की कामना करते हैं।
            </div>

            <div className="flex justify-between items-end mt-11 pt-10">
              <div className="text-[14px] space-y-1 font-bold px-2 w-64">
                <p className="flex justify-between w-full"><span>परीक्षा की तिथि:</span> <span className="text-right">{formatCertDateGlobal(exam.userAttempt?.createdAt)}</span></p>
                <p className="flex justify-between w-full"><span>परीक्षा अवधि:</span> <span className="text-right">{exam.duration} मिनट</span></p>
                <p className="flex justify-between w-full"><span>कुल अंक:</span> <span className="text-right">{total}</span></p>
                <p className="flex justify-between w-full"><span>प्राप्त अंक:</span> <span className="text-right">{score}</span></p>
                <p className="flex justify-between w-full"><span>प्रतिशत:</span> <span className="text-right">{pct}%</span></p>
              </div>

              <div className="text-center font-bold text-sm flex flex-col items-center pr-2">
                <p className="text-gray-800 italic underline decoration-1">अधिकृत हस्ताक्षर</p>
                <img src={main_sign} alt="Signature" className="h-10 my-1 object-contain" />
                <p>Program Coordinator</p>
                <p className="text-[#3F6212]">जन आरोग्य सहायता अभियान</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MOUAgreementTemplate = ({ exam, templateRef }) => {
  if (!exam) return <div ref={templateRef} style={{ display: 'none' }}></div>;
  const name = exam.userAttempt?.applicationId?.candidateName || "_________________";
  const fName = exam.userAttempt?.applicationId?.fatherName || "_________________";
  const appNo = exam.userAttempt?.applicationId?.applicationNumber || "_________________";

  return (
    <div
      style={{ position: 'absolute', top: '0', left: '0', width: '1122px', zIndex: -9999, opacity: 0, pointerEvents: 'none', backgroundColor: 'white' }}
      ref={templateRef}
      className="adm-keep"
    >
      <div style={{ padding: '0px', width: '1122px', height: '793px' }}>
        <div
          className="bg-[#3F6212] relative font-sans mx-auto flex items-center justify-center"
          style={{ width: "1050px", height: "750px", boxSizing: "border-box", padding: "12px", marginTop: '18px' }}
        >
          <div
            className="bg-white w-full h-full relative flex flex-col"
            style={{ boxSizing: "border-box", padding: "10px 48px 20px 48px", fontFamily: "Arial, sans-serif", color: "#000", lineHeight: "1.4" }}
          >
            {/* Watermark Background */}
            <div className="absolute left-0 right-0 bottom-0 top-[200px] z-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
              <img src={jssa_logo_new} alt="Watermark" className="w-[550px] h-auto object-contain" />
            </div>

            {/* Header */}
            <div className="relative z-10 flex flex-row items-center justify-start mb-4 border-b-2 border-[#3F6212] pb-4 mt-2 px-2 gap-6">
              <img src={jssa_logo_new} alt="Logo" className="h-32 object-contain" />
              <div className="flex flex-col text-left">
                <h1 className="text-2xl font-extrabold text-[#4D7C0F]" style={{ fontFamily: 'sans-serif' }}>
                  जनआरोग्यसहायताअभियान/Jan Aarogya Sahayata Abhiyan
                </h1>
                <p className="text-sm font-bold text-[#1A2E05] mt-0.5">
                  (This Project Is Organized Under Social Welfare Organization)
                </p>
                <p className="text-sm font-bold text-gray-800">
                  Registration No. : {appNo}
                </p>
                <p className="text-[12px] font-semibold text-gray-700 mt-1">
                  Reg. Off.: Riding Road, Sheikhpura, New Capital Patna, Bihar, India - 800014
                </p>
                <p className="text-[12px] font-semibold text-gray-700">
                  Corp. Off.: 98, Nehru Place New Delhi, India - 110001
                </p>
                <p className="text-[11px] font-bold text-gray-800 mt-0.5">
                  Website: <span className="text-[#3F6212] underline">https://jssabhiyan.com/</span> | Email: <span className="text-[#3F6212] underline">Support@Jssabhiyan.Com</span>
                </p>
              </div>
            </div>

            <div className="text-right text-xs font-bold mb-2">
              दिनांक: {formatCertDateGlobal(new Date())}
            </div>

            <div className="text-center mb-6 mt-6">
              <span className="text-xl font-black text-[#1A2E05] border-b-2 border-[#1A2E05] pb-1 uppercase">सहमति पत्र (MOU)</span>
            </div>

            <div className="text-justify text-[14px] leading-7 font-semibold px-2 space-y-4" style={{ fontFamily: 'sans-serif' }}>
              <p>
                यह सहमति पत्र (Memorandum of Understanding) श्री / श्रीमती / कुमारी:
                <span className="border-b border-black px-2 inline-block min-w-[150px] text-center text-[#3F6212] italic">{name}</span>
                पिता / पति का नाम:
                <span className="border-b border-black px-2 inline-block min-w-[150px] text-center text-[#3F6212] italic">{fName}</span>
                आवेदन सं.:
                <span className="border-b border-black px-2 inline-block min-w-[120px] text-center text-[#3F6212] ">{appNo}</span>
                के मध्य निष्पादित किया गया है।
              </p>

              <p>
                उक्त अभ्यर्थी ने जन आरोग्य सहायता अभियान द्वारा आयोजित प्रतियोगिता परीक्षा को सफलतापूर्वक उत्तीर्ण किया है। इस सहमति पत्र के माध्यम से अभ्यर्थी संगठन के निर्धारित नियमों, शर्तों और कार्यप्रणाली के अनुरूप अपनी सेवाएं प्रदान करने हेतु अपनी सहमति व्यक्त करते हैं।
              </p>

              <p>
                संगठन अभ्यर्थी के उज्ज्वल चयन और भविष्य की मंगलकामना करता है। यह पत्र आगामी प्रशिक्षण और नियुक्ति प्रक्रिया के अगले चरण हेतु आधार स्वरूप मान्य होगा।
              </p>
            </div>

            <div className="flex justify-between items-end mt-16 pt-10">
              <div className="text-center font-bold text-sm flex flex-col items-center pl-2">
                <p className="text-gray-800 italic border-t border-black pt-1 w-40">अभ्यर्थी के हस्ताक्षर</p>
                <p className="text-xs text-gray-400 mt-1">(Candidate Signature)</p>
              </div>

              <div className="text-center font-bold text-sm flex flex-col items-center pr-2">
                <p className="text-gray-800 italic underline decoration-1">अधिकृत हस्ताक्षर</p>
                <img src={main_sign} alt="Signature" className="h-10 my-1 object-contain" />
                <p>Program Coordinator</p>
                <p className="text-[#3F6212]">जन आरोग्य सहायता अभियान</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MyExam() {
  // Landing-site theme (navy/blue, Segoe UI) for this page — UI only; certificate/MOU templates are kept as-is (adm-keep)
  useBlueBodyTheme(true);
  const navigate = useNavigate();
  const [step, setStep] = useState(STEP.list);
  const [examRows, setExamRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedExam, setSelectedExam] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [warnings, setWarnings] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [submittingAttempt, setSubmittingAttempt] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [examLanguage, setExamLanguage] = useState("en"); // "en" or "hi"

  const [isDownloadingCert, setIsDownloadingCert] = useState(false);
  const [selectedCertTx, setSelectedCertTx] = useState(null);
  const [isGuidanceModalOpen, setIsGuidanceModalOpen] = useState(false);
  const certTemplateRef = useRef(null);
  const mouTemplateRef = useRef(null);

  const translations = {
    en: {
      instructions: "Instructions",
      totalQuestions: "Total Questions",
      duration: "Duration",
      minutes: "Minutes",
      stableInternet: "Ensure a stable internet connection.",
      noRefresh: "Do not refresh the page during the exam.",
      autoSubmit: "Exam will auto-submit when time expires.",
      selectLanguage: "Select Exam Language / परीक्षा की भाषा चुनें",
      defaultLang: "Default language",
      hindiMedium: "Hindi medium",
      back: "Back",
      startExam: "Start Exam",
      alreadyAttempted: "You have already attempted this exam once. Re-attempt is not allowed.",
      questionNavigator: "Question Navigator",
      questionXofY: (x, y) => `Question ${x} of ${y}`,
      answered: "Answered",
      previous: "Previous",
      next: "Next",
      endSubmit: "End & Submit",
      submitting: "Submitting...",
      noQuestions: "No questions available for this exam.",
      myExam: "My Exam & MOU",
      manageExams: "Manage your assigned exams, view schedules, and start your assessments.",
      activeExams: "Active Exams",
      upcomingExams: "Upcoming Exams",
      history: "History",
      noActiveExams: "No active exam in current start/end date.",
      noUpcomingExams: "No upcoming exams.",
      noHistory: "No exam history found.",
      questionsCount: "Questions",
      attempts: "Attempts",
      start: "Start",
      end: "End",
      review: "Review",
      result: "Result",
      examClosed: "Exam Closed",
      examPeriodExpired: "Exam Period Expired",
      attempted: "Attempted",
      notAttempted: "Not Attempted",
      startsAt: "Starts at",
      endedOn: "Ended on",
      attemptedOn: "Attempted on",
      score: "Your Score",
      status: "Status",
      pass: "PASS",
      fail: "FAIL",
      resultPending: "Result Pending",
      examResult: "Exam Result",
      scheduledFor: "Scheduled For",
      resultTBA: (date) => `Results will be declared on ${date}.`,
      close: "Close",
      examSubmitted: "Exam Submitted!",
      examRecorded: "Your exam attempt has been successfully recorded. Results will be available soon.",
      backToDashboard: "Back to Dashboard",
      finishedReview: "Finished Review",
      reviewTitle: (title) => `Review: ${title}`,
      reviewSubtitle: "Check your submitted answers. Correct answers are not shown.",
      correct: "Correct",
      incorrect: "Incorrect",
      notAttemptedUpper: "NOT ATTEMPTED",
      backToList: "Back to List",
      downloadCertificate: "Download Certificate",
      mou: "MOU",
    },
    hi: {
      instructions: "निर्देश",
      totalQuestions: "कुल प्रश्न",
      duration: "अवधि",
      minutes: "मिनट",
      stableInternet: "एक स्थिर इंटरनेट कनेक्शन सुनिश्चित करें।",
      noRefresh: "परीक्षा के दौरान पेज को रिफ्रेश न करें।",
      autoSubmit: "समय समाप्त होने पर परीक्षा स्वतः सबमिट हो जाएगी।",
      selectLanguage: "परीक्षा की भाषा चुनें / Select Exam Language",
      defaultLang: "डिफ़ॉल्ट भाषा",
      hindiMedium: "हिंदी माध्यम",
      back: "पीछे",
      startExam: "परीक्षा शुरू करें",
      alreadyAttempted: "आप पहले ही इस परीक्षा का प्रयास कर चुके हैं। पुनः प्रयास की अनुमति नहीं है।",
      questionNavigator: "प्रश्न नेविगेटर",
      questionXofY: (x, y) => `प्रश्न ${x} का ${y}`,
      answered: "उत्तर दिया",
      previous: "पिछला",
      next: "अगला",
      endSubmit: "समाप्त और सबमिट करें",
      submitting: "सबमिट हो रहा है...",
      noQuestions: "इस परीक्षा के लिए कोई प्रश्न उपलब्ध नहीं हैं।",
      myExam: "मेरी परीक्षा & MOU",
      manageExams: "अपने असाइन किए गए एग्जाम प्रबंधित करें, शेड्यूल देखें और मूल्यांकन शुरू करें।",
      activeExams: "सक्रिय परीक्षाएं",
      upcomingExams: "आगामी परीक्षाएं",
      history: "इतिहास",
      noActiveExams: "वर्तमान तिथि में कोई सक्रिय परीक्षा नहीं है।",
      noUpcomingExams: "कोई आगामी परीक्षा नहीं है।",
      noHistory: "कोई परीक्षा इतिहास नहीं मिला।",
      questionsCount: "प्रश्न",
      attempts: "प्रयास",
      start: "शुरू",
      end: "समाप्त",
      review: "समीक्षा",
      result: "परिणाम",
      examClosed: "परीक्षा बंद",
      examPeriodExpired: "परीक्षा अवधि समाप्त",
      attempted: "प्रयास किया",
      notAttempted: "प्रयास नहीं किया",
      startsAt: "शुरू होता है",
      endedOn: "समाप्त हुआ",
      attemptedOn: "प्रयास किया गया",
      score: "आपका स्कोर",
      status: "स्थिति",
      pass: "उत्तीर्ण",
      fail: "अनुत्तीर्ण",
      resultPending: "परिणाम लंबित",
      examResult: "परीक्षा परिणाम",
      scheduledFor: "निर्धारित तिथि",
      resultTBA: (date) => `परिणाम ${date} को घोषित किए जाएंगे।`,
      close: "बंद करें",
      examSubmitted: "परीक्षा सबमिट हो गई!",
      examRecorded: "आपका परीक्षा प्रयास सफलतापूर्वक रिकॉर्ड कर लिया गया है। परिणाम जल्द ही उपलब्ध होंगे।",
      backToDashboard: "डैशबोर्ड पर वापस जाएं",
      finishedReview: "समीक्षा समाप्त",
      reviewTitle: (title) => `समीक्षा: ${title}`,
      reviewSubtitle: "अपने सबमिट किए गए उत्तरों की जाँच करें। सही उत्तर नहीं दिखाए गए हैं।",
      correct: "सही",
      incorrect: "गलत",
      notAttemptedUpper: "प्रयास नहीं किया",
      backToList: "सूची पर वापस जाएं",
      downloadCertificate: "प्रमाणपत्र डाउनलोड करें",
      mou: "MOU",
    }
  };

  const t = translations[examLanguage] || translations.en;

  const screenStreamRef = useRef(null);

  const handleReview = async (exam) => {
    setLoadingReview(true);
    try {
      const res = await createPaperAPI.getReview(exam.id);
      if (res.success) {
        setReviewData(res.data);
        // Step change logic removed to keep user on same list, but we'll use a local modal state
      } else {
        alert(res.error || "Failed to load review");
      }
    } catch (e) {
      alert("Error loading review: " + e.message);
    } finally {
      setLoadingReview(false);
    }
  };

  const handleResult = (exam) => {
    setSelectedExam(exam);
    setStep(STEP.result);
  };

  const questions = shuffledQuestions.length > 0 ? shuffledQuestions : (selectedExam?.questions || []);
  const answeredCount = Object.keys(answers).length;

  // Review Modal Component
  const ReviewModal = ({ data, onClose }) => {
    if (!data) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-[#f3f6fb] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={{ fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
          <div className="px-6 py-5 flex items-center justify-between gap-4 text-white" style={{ background: "linear-gradient(100deg,#3F6212 0%,#4D7C0F 55%,#65A30D 100%)" }}>
            <div>
              <h2 className="text-xl font-bold text-white">{t.reviewTitle(data.testTitle)}</h2>
              <p className="text-sm text-white/90 mt-0.5">{t.reviewSubtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={examLanguage}
                onChange={(e) => setExamLanguage(e.target.value)}
                className="px-3 py-1.5 bg-white text-[#3F6212] border border-white/60 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-white outline-none"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
              </select>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
            {data.review.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-xl border border-[#D9F99D] shadow-sm p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[11px] font-bold text-[#4D7C0F] bg-[#ECFCCB] px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {t.questionXofY(idx + 1, data.review.length)}
                  </span>
                  {q.userAnswerIndex !== undefined ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${q.isCorrect ? "bg-[#ECFCCB] text-[#4D7C0F] border border-[#D9F99D]" : "bg-red-100 text-red-700"
                      }`}>
                      {q.isCorrect ? t.correct : t.incorrect}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-500">
                      {t.notAttemptedUpper}
                    </span>
                  )}
                </div>
                <p className="text-[#3F6212] font-semibold mb-4 text-[15px] leading-relaxed">
                  {examLanguage === "hi" && q.questionHi ? q.questionHi : q.question}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {(examLanguage === "hi" && q.optionsHi?.length === q.options.length
                    ? q.optionsHi
                    : q.options
                  ).map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className={`px-4 py-3 rounded-lg border text-sm flex items-center justify-between transition-colors ${q.userAnswerIndex === optIdx
                        ? q.isCorrect
                          ? "border-[#4D7C0F] bg-[#ECFCCB] text-[#3F6212] font-semibold"
                          : "border-red-500 bg-red-50"
                        : "border-gray-200 bg-white text-gray-700"
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-bold opacity-50">{String.fromCharCode(65 + optIdx)}.</span>
                        {opt}
                      </span>
                      {q.userAnswerIndex === optIdx && (
                        q.isCorrect ? <CheckCircle2 className="w-4 h-4 text-[#4D7C0F]" /> : <XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-[#D9F99D] bg-white flex justify-end">
            <button
              onClick={onClose}
              className="px-7 py-2.5 bg-[#4D7C0F] text-white rounded-lg font-bold hover:bg-[#3F6212] transition shadow-md text-sm"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Guidance Video Modal
  const GuidanceVideoModal = ({ isOpen, onClose }) => {
    const [isVideoLoading, setIsVideoLoading] = useState(true);

    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 border-4 border-[#4D7C0F]">
          <div className="bg-[#4D7C0F] px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <PlayCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-black text-lg uppercase tracking-wider">
                MOU Form Fill Guidance Guide
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full text-white transition-colors border border-white/20"
            >
              <XCircle className="w-7 h-7" />
            </button>
          </div>
          <div className="p-2 bg-black">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-gray-900">
              {isVideoLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
                  <Loader2 className="w-10 h-10 text-[#4D7C0F] animate-spin mb-3" />
                  <p className="text-white font-bold text-xs uppercase tracking-widest animate-pulse">Loading Guidance Video...</p>
                </div>
              )}
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://drive.google.com/file/d/1nxQeJJaO0yLYOMlNKvZDyHbg2JWdjbQH/preview"
                title="MOU Form Fill Guidance"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                onLoad={() => setIsVideoLoading(false)}
              ></iframe>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-bold italic uppercase tracking-tighter">
              Watch this video carefully before filling your MOU form.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#4D7C0F] text-white rounded-xl font-black hover:bg-[#3F6212] transition shadow-lg text-sm"
            >
              GOT IT!
            </button>
          </div>
        </div>
      </div>
    );
  };

  const activeExams = useMemo(
    () => examRows.filter((exam) => exam.windowStatus === "active" && exam.attemptsUsed < exam.maxAttempts),
    [examRows],
  );
  const upcomingExams = useMemo(
    () => examRows.filter((exam) => exam.windowStatus === "upcoming"),
    [examRows],
  );
  const historyExams = useMemo(
    () => {
      const filtered = examRows.filter((exam) => exam.windowStatus === "ended" || (exam.windowStatus === "active" && exam.attemptsUsed >= exam.maxAttempts));
      return [...filtered].sort((a, b) => {
        const dateA = a.userAttempt?.createdAt || a.endDate || 0;
        const dateB = b.userAttempt?.createdAt || b.endDate || 0;
        return new Date(dateB) - new Date(dateA);
      });
    },
    [examRows],
  );

  const loadStudentExams = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await createPaperAPI.getAssigned();
      if (response.success && response.data) {
        setExamRows(Array.isArray(response.data.tests) ? response.data.tests : []);
      } else {
        setError(response.error || "Failed to load assigned exams");
      }
    } catch (e) {
      setError(e.message || "Failed to load active exams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudentExams();
  }, [loadStudentExams]);

  useEffect(() => {
    if (step !== STEP.running) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (step !== STEP.running) return;

    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue =
        "Exam is running. You can close this page only after ending exam.";
    };

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [step]);

  useEffect(() => {
    return () => {
      stopMediaAndRecorders();
    };
  }, []);

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  };

  const handleDownloadCertificate = async (exam) => {
    if (!exam || isDownloadingCert) return;
    setIsDownloadingCert(true);
    setSelectedCertTx(exam);
    try {
      if (typeof window.html2pdf === "undefined") {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
      }
      const h2p = window.html2pdf;
      if (!h2p) throw new Error("PDF library not loaded");
      await new Promise(resolve => setTimeout(resolve, 500));
      const container = certTemplateRef.current?.querySelector('.mx-auto');
      if (!container) throw new Error("Certificate template container not found");
      const opt = {
        margin: 0,
        filename: `Certificate_${exam.userAttempt?.applicationId?.applicationNumber || "Exam"}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      await h2p().set(opt).from(container).save();
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Error generating Certificate PDF. Please try again.");
    } finally {
      setIsDownloadingCert(false);
      setSelectedCertTx(null);
    }
  };

  const isMOUVisible = (exam) => {
    if (!exam.mouStartDate || !exam.mouEndDate) return false;
    const now = new Date();
    const start = new Date(exam.mouStartDate);
    const end = new Date(exam.mouEndDate);
    end.setHours(23, 59, 59, 999);
    return now >= start && now <= end;
  };

  const addWarning = (message) => {
    setWarnings((prev) => [
      ...prev,
      { message, time: new Date().toLocaleTimeString() },
    ]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const selectExam = (exam) => {
    if (!exam?.canStart) return;
    setSelectedExam(exam);
    setCurrentQuestion(0);
    setAnswers({});
    setWarnings([]);
    setError("");

    // Handle question shuffling if enabled
    if (exam.shuffleQuestions && exam.questions?.length > 0) {
      const shuffled = [...exam.questions].sort(() => Math.random() - 0.5);
      setShuffledQuestions(shuffled);
    } else {
      setShuffledQuestions([]);
    }

    setStep(STEP.instructions);
  };

  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
    } catch {
      setIsFullscreen(false);
    }
  };

  const stopMediaAndRecorders = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
  };

  const beginExam = async () => {
    if (!selectedExam) return;
    if (!selectedExam.canStart) {
      setError("This exam is already attempted and cannot be started again.");
      setStep(STEP.list);
      return;
    }
    setError("");
    setWarnings([]);

    try {
      // Screen share removed as requested - "normal test or kuch nahi"
      // await requestFullscreen(); // Optional: Keep or remove fullscreen. Keeping it for now as it's standard for tests.

      setTimeLeft(Math.max(Number(selectedExam.duration || 60), 1) * 60);
      setStep(STEP.running);
    } catch (e) {
      console.error(e);
      setError("Failed to start the exam. Please try again.");
    }
  };

  const handleSubmitExam = async (auto = false) => {
    if (!selectedExam || submittingAttempt) return;
    setSubmittingAttempt(true);
    try {
      const response = await createPaperAPI.submitAttempt(selectedExam._id || selectedExam.id, {
        answers,
        answeredCount,
        autoSubmitted: auto,
      });

      if (response.success && response.data) {
        setSubmissionResult(response.data);
      }

      stopMediaAndRecorders();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
      }
      setStep(STEP.submitted);
      await loadStudentExams();
    } catch (e) {
      setError(e.message || "Failed to submit exam attempt.");
    } finally {
      setSubmittingAttempt(false);
    }
  };

  const current = questions[currentQuestion];

  const summaryText = useMemo(() => {
    if (!selectedExam) return "";
    return `${selectedExam.class} · ${selectedExam.type}`;
  }, [selectedExam]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-[#ECFCCB] via-[#f3f6fb] to-[#ECFCCB] p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white rounded-xl border border-[#D9F99D] shadow-sm p-5 md:p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-[#D9F99D] rounded-xl p-5 shadow-sm animate-pulse">
                  <div className="flex justify-between mb-4">
                    <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-6 bg-gray-100 rounded-full w-16"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded mt-4 w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (step === STEP.list) {
    return (
      <DashboardLayout>
        <CertificateTemplate exam={selectedCertTx} templateRef={certTemplateRef} />
        <MOUAgreementTemplate exam={selectedCertTx} templateRef={mouTemplateRef} />
        <GuidanceVideoModal isOpen={isGuidanceModalOpen} onClose={() => setIsGuidanceModalOpen(false)} />
        <div className="min-h-screen bg-[#f3f6fb] p-4 md:p-8" style={{ fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
          <div className="max-w-6xl mx-auto space-y-6">
            <div
              className="rounded-2xl shadow-md p-6 md:p-8 text-white relative overflow-hidden"
              style={{ background: "linear-gradient(100deg,#3F6212 0%,#4D7C0F 55%,#65A30D 100%)" }}
            >
              <span className="inline-block text-[11px] font-bold tracking-[0.18em] uppercase bg-white/20 border border-white/30 rounded-full px-3 py-1 mb-3">
                Applicant Portal
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                {t.myExam}
              </h1>
              <p className="text-sm md:text-[15px] text-white/90 mt-2">
                {t.manageExams}
              </p>
            </div>

            {error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            ) : null}

            {examRows.length === 0 ? (
              <div className="bg-white border rounded-lg p-4 text-gray-600 shadow-sm">
                {t.noQuestions}
              </div>
            ) : (
              <div className="space-y-7">
                {/* Review Modal Rendering */}
                <ReviewModal data={reviewData} onClose={() => setReviewData(null)} />

                <div>
                  <h2 className="text-xl font-bold text-[#3F6212] mb-3 pl-3 border-l-4 border-[#4D7C0F]">
                    {t.activeExams}
                  </h2>
                  {activeExams.length === 0 ? (
                    <div className="bg-white border rounded-lg p-4 text-sm text-gray-500 shadow-sm">
                      {t.noActiveExams}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {activeExams.map((exam) => (
                        <div
                          key={exam._id || exam.id}
                          className="bg-white border border-[#D9F99D] rounded-xl p-5 shadow-sm hover:shadow-md transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-xl font-semibold text-gray-800">
                              {exam.title}
                            </h3>
                          </div>
                          <div className="mt-3 text-sm text-gray-700 space-y-1">
                            <p>
                              {t.questionsCount}:{" "}
                              <span className="font-semibold">
                                {exam.questions?.length || 0}
                              </span>{" "}
                              · {t.duration}:{" "}
                              <span className="font-semibold">
                                {exam.duration} {t.minutes}
                              </span>
                            </p>
                            <p className="text-xs text-gray-600">
                              {t.attempts}: {exam.attemptsUsed || 0}/{exam.maxAttempts || 1}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t.start}: {exam.startDate ? new Date(exam.startDate).toLocaleDateString() : "-"} | {t.end}:{" "}
                              {exam.endDate ? new Date(exam.endDate).toLocaleDateString() : "-"}
                            </p>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {exam.canStart ? (
                              <button
                                onClick={() => selectExam(exam)}
                                className="px-5 py-2.5 bg-[#4D7C0F] text-white rounded-md font-medium hover:bg-[#3F6212] transition"
                              >
                                {t.startExam}
                              </button>
                            ) : null}

                            {exam.attemptsUsed > 0 && (
                              <>
                                <button
                                  onClick={() => handleReview(exam)}
                                  disabled={loadingReview}
                                  className="px-5 py-2.5 bg-white text-[#4D7C0F] border border-[#4D7C0F] rounded-md font-semibold hover:bg-[#ECFCCB] transition disabled:opacity-50"
                                >
                                  {loadingReview ? "Loading..." : t.review}
                                </button>
                                <button
                                  onClick={() => handleResult(exam)}
                                  className={`px-5 py-2.5 text-white rounded-md font-medium transition ${!exam.resultAvailable
                                    ? "bg-amber-500 hover:bg-amber-600"
                                    : "bg-[#3F6212] hover:bg-[#1A2E05]"
                                    }`}
                                >
                                  {!exam.resultAvailable ? t.resultPending : t.result}
                                </button>
                                {exam.resultAvailable &&
                                  ((exam.userAttempt?.score || 0) >= (exam.passingMarks || 0)) && (
                                    <>
                                      <button
                                        onClick={() => handleDownloadCertificate(exam)}
                                        disabled={isDownloadingCert && selectedCertTx?.id === exam.id}
                                        className="flex items-center gap-1.5 px-5 py-2.5 bg-[#4D7C0F] text-white rounded-md font-medium hover:bg-[#3F6212] transition disabled:opacity-50"
                                      >
                                        {isDownloadingCert && selectedCertTx?.id === exam.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                        {t.downloadCertificate}
                                      </button>
                                      {isMOUVisible(exam) && (
                                        <button
                                          onClick={() => navigate(`/mou/process/${exam.id}`)}
                                          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#65A30D] text-white rounded-md font-medium hover:bg-[#4D7C0F] transition shadow-sm"
                                        >
                                          {t.mou}
                                        </button>
                                      )}
                                    </>
                                  )}
                              </>
                            )}

                            {!exam.canStart && exam.attemptsUsed === 0 && (
                              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded">
                                {t.examClosed}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#3F6212] mb-3 pl-3 border-l-4 border-[#4D7C0F]">
                    {t.upcomingExams}
                  </h2>
                  {upcomingExams.length === 0 ? (
                    <div className="bg-white border rounded-lg p-4 text-sm text-gray-500 shadow-sm">
                      {t.noUpcomingExams}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {upcomingExams.map((exam) => (
                        <div
                          key={exam._id || exam.id}
                          className="bg-white border border-[#D9F99D] rounded-xl p-5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-xl font-semibold text-gray-800">
                              {exam.title}
                            </h3>
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ECFCCB] text-[#3F6212]">
                              {t.upcomingExams}
                            </span>
                          </div>
                          <div className="mt-3 text-sm text-gray-700 space-y-1">
                            <p>
                              {t.questionsCount}:{" "}
                              <span className="font-semibold">
                                {exam.questions?.length || 0}
                              </span>{" "}
                              · {t.duration}:{" "}
                              <span className="font-semibold">
                                {exam.duration} {t.minutes}
                              </span>
                            </p>
                            <p className="text-xs text-gray-600">
                              {t.startsAt}:{" "}
                              <span className="font-semibold text-[#4D7C0F]">
                                {exam.startDate ? new Date(exam.startDate).toLocaleDateString() : "-"}
                              </span>
                            </p>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {exam.attemptsUsed > 0 && (
                              <>
                                <button
                                  onClick={() => handleReview(exam)}
                                  disabled={loadingReview}
                                  className="px-4 py-2 bg-white text-[#4D7C0F] border border-[#4D7C0F] rounded-md text-sm font-semibold hover:bg-[#ECFCCB] transition disabled:opacity-50"
                                >
                                  {t.review}
                                </button>
                                <button
                                  onClick={() => handleResult(exam)}
                                  className={`px-4 py-2 text-white rounded-md text-sm font-medium transition ${!exam.resultAvailable
                                    ? "bg-amber-500 hover:bg-amber-600"
                                    : "bg-[#3F6212] hover:bg-[#1A2E05]"
                                    }`}
                                >
                                  {!exam.resultAvailable ? t.resultPending : t.result}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#3F6212] mb-3 pl-3 border-l-4 border-[#4D7C0F]">
                    {t.history}
                  </h2>
                  {historyExams.length === 0 ? (
                    <div className="bg-white border rounded-lg p-4 text-sm text-gray-500 shadow-sm">
                      {t.noHistory}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {historyExams.map((exam) => (
                        <div
                          key={exam._id || exam.id}
                          className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-xl font-semibold text-gray-800">
                              {exam.title}
                            </h3>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${exam.attemptsUsed > 0 ? "bg-[#ECFCCB] text-[#4D7C0F] border border-[#D9F99D]" : "bg-gray-100 text-gray-600"
                              }`}>
                              {exam.attemptsUsed > 0 ? t.attempted : t.notAttempted}
                            </span>
                          </div>
                          <div className="mt-3 text-sm text-gray-700 space-y-1">
                            <p>
                              {t.questionsCount}:{" "}
                              <span className="font-semibold">
                                {exam.questions?.length || 0}
                              </span>{" "}
                              · {t.duration}:{" "}
                              <span className="font-semibold">
                                {exam.duration} {t.minutes}
                              </span>
                            </p>
                            <p className="text-xs text-gray-600">
                              {exam.windowStatus === "ended"
                                ? `${t.endedOn}: ${exam.endDate ? new Date(exam.endDate).toLocaleDateString() : "-"}`
                                : `${t.attemptedOn}: ${exam.userAttempt?.createdAt ? new Date(exam.userAttempt.createdAt).toLocaleDateString() : "-"}`
                              }
                            </p>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {exam.attemptsUsed > 0 ? (
                              <>
                                <button
                                  onClick={() => handleReview(exam)}
                                  disabled={loadingReview}
                                  className="px-4 py-2 bg-white text-[#4D7C0F] border border-[#4D7C0F] rounded-md text-sm font-semibold hover:bg-[#ECFCCB] transition disabled:opacity-50"
                                >
                                  {t.review}
                                </button>
                                <button
                                  onClick={() => handleResult(exam)}
                                  className={`px-4 py-2 text-white rounded-md text-sm font-medium transition ${!exam.resultAvailable
                                    ? "bg-amber-500 hover:bg-amber-600"
                                    : "bg-[#3F6212] hover:bg-[#1A2E05]"
                                    }`}
                                >
                                  {!exam.resultAvailable ? t.resultPending : t.result}
                                </button>
                                {exam.resultAvailable &&
                                  ((exam.userAttempt?.score || 0) >= (exam.passingMarks || 0)) && (
                                    <>
                                      <button
                                        onClick={() => handleDownloadCertificate(exam)}
                                        disabled={isDownloadingCert && selectedCertTx?.id === exam.id}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-[#4D7C0F] text-white rounded-md text-sm font-medium hover:bg-[#3F6212] transition disabled:opacity-50"
                                      >
                                        {isDownloadingCert && selectedCertTx?.id === exam.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                        {t.downloadCertificate}
                                      </button>
                                      {isMOUVisible(exam) && (
                                        <>
                                          <button
                                            onClick={() => navigate(`/mou/process/${exam.id}`)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-[#65A30D] text-white rounded-md text-sm font-medium hover:bg-[#4D7C0F] transition shadow-sm"
                                          >
                                            {t.mou}
                                          </button>
                                        </>
                                      )}
                                    </>
                                  )}
                              </>
                            ) : (
                              <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded border border-gray-100">
                                {t.examPeriodExpired}
                              </span>
                            )}
                          </div>

                          {exam.resultAvailable &&
                            ((exam.userAttempt?.score || 0) >= (exam.passingMarks || 0)) &&
                            isMOUVisible(exam) && (
                              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex flex-col">
                                  <p className="text-[13px] font-semibold text-black uppercase leading-none tracking-tight">MOU Support Contact Number</p>
                                  <p className="text-[13px] font-bold text-black uppercase mt-1.5 tracking-tight">MOU सहायता संपर्क नंबर</p>
                                  <div className="mt-2.5 flex flex-col gap-1">
                                    <p className="text-[11px] font-extrabold text-[#4D7C0F] uppercase tracking-wide">
                                      Inquiry Hours: Mon - Sat (10 AM - 6 PM)
                                    </p>
                                    <p className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">
                                      पूछताछ का समय: सोम - शनि (सुबह 10 - शाम 6 बजे)
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <a
                                      href="tel:+919289397569"
                                      className="flex items-center gap-1.5 text-[#4D7C0F] font-black text-sm hover:text-[#3F6212] transition-colors group"
                                    >
                                      <div className="w-7 h-7 bg-[#ECFCCB] rounded-full flex items-center justify-center group-hover:bg-[#D9F99D] transition-colors shadow-sm">
                                        <Phone size={14} className="fill-[#4D7C0F] text-[#4D7C0F]" />
                                      </div>
                                      <span>+91 92893 97569</span>
                                    </a>
                                    <a
                                      href="tel:+919289397566"
                                      className="flex items-center gap-1.5 text-[#4D7C0F] font-black text-sm hover:text-[#3F6212] transition-colors group"
                                    >
                                      <div className="w-7 h-7 bg-[#ECFCCB] rounded-full flex items-center justify-center group-hover:bg-[#D9F99D] transition-colors shadow-sm">
                                        <Phone size={14} className="fill-[#4D7C0F] text-[#4D7C0F]" />
                                      </div>
                                      <span>+91 92893 97566</span>
                                    </a>
                                  <button
                                    onClick={() => setIsGuidanceModalOpen(true)}
                                    className="flex items-center gap-1.5 text-[#4D7C0F] font-black text-[11px] uppercase tracking-tighter hover:text-[#3F6212] transition-colors bg-[#ECFCCB] px-3 py-1.5 rounded-lg border border-[#D9F99D] animate-pulse-slow"
                                  >
                                    <PlayCircle size={14} />
                                    Watch MOU Guidance Video
                                  </button>
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (step === STEP.review && reviewData) {
    return null; // Logic handled by modal in list view
  }

  if (step === STEP.result && selectedExam) {
    const now = new Date();
    const resultDate = selectedExam.resultDate ? new Date(selectedExam.resultDate) : null;
    const isActuallyAvailable = selectedExam.showResult || (resultDate ? now >= resultDate : true);

    const resDateStr = resultDate ? resultDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }) : "TBA";

    const score = selectedExam.userAttempt?.score || 0;
    const totalMarks = selectedExam.totalMarks || 100;
    const passingMarks = selectedExam.passingMarks || 0;
    const isPassed = score >= passingMarks;

    return (
      <DashboardLayout>
        <CertificateTemplate exam={selectedCertTx} templateRef={certTemplateRef} />
        <MOUAgreementTemplate exam={selectedCertTx} templateRef={mouTemplateRef} />
        <div className="min-h-screen bg-[#f3f6fb] flex items-center justify-center p-4" style={{ fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
          <GuidanceVideoModal isOpen={isGuidanceModalOpen} onClose={() => setIsGuidanceModalOpen(false)} />
          <div className="max-w-lg w-full bg-white rounded-2xl border border-[#D9F99D] shadow-xl overflow-hidden text-center">
            <div
              className="px-8 pt-8 pb-7 text-white"
              style={{ background: "linear-gradient(100deg,#3F6212 0%,#4D7C0F 55%,#65A30D 100%)" }}
            >
              <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 bg-white shadow-md ${isActuallyAvailable ? (isPassed ? "text-[#4D7C0F]" : "text-red-600") : "text-[#4D7C0F]"
                }`}>
                {isActuallyAvailable ? (isPassed ? <Trophy className="w-10 h-10" /> : <XCircle className="w-10 h-10" />) : <Calendar className="w-10 h-10" />}
              </div>
              <h1 className="text-2xl font-black text-white mb-1">
                {isActuallyAvailable ? t.examResult : t.resultPending}
              </h1>
              <p className="text-white/90 text-sm font-medium">
                {selectedExam.title}
              </p>
            </div>
            <div className="p-6 md:p-8">

            {isActuallyAvailable ? (
              <div className="space-y-4 mb-6">
                <div className="bg-[#ECFCCB] rounded-xl p-4 border border-[#D9F99D]">
                  <p className="text-xs font-bold text-[#4D7C0F] uppercase tracking-widest mb-1">{t.score}</p>
                  <p className="text-4xl font-black text-[#3F6212]">
                    {score}
                    <span className="text-lg text-[#3F6212] font-bold ml-1">/ {totalMarks}</span>
                  </p>
                </div>

                <div className={`rounded-xl p-4 border ${isPassed ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{t.status}</p>
                  <p className={`text-2xl font-black ${isPassed ? "text-green-600" : "text-red-600"}`}>
                    {isPassed ? t.pass : t.fail}
                  </p>
                </div>
                {isPassed && (
                  <>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleDownloadCertificate(selectedExam)}
                        disabled={isDownloadingCert && selectedCertTx?.id === selectedExam.id}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#4D7C0F] text-white rounded-xl font-bold text-[15px] hover:bg-[#3F6212] transition shadow-md disabled:opacity-50"
                      >
                        {isDownloadingCert && selectedCertTx?.id === selectedExam.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        {t.downloadCertificate}
                      </button>
                    </div>

                    {isMOUVisible(selectedExam) && (
                      <div className="mt-6 pt-6 border-t border-[#D9F99D] flex flex-col items-center gap-3">
                        <div className="text-center">
                          <div className="text-center">
                            <p className="text-[11px] font-bold text-[#3F6212] uppercase tracking-widest">MOU Support Contact Number</p>
                            <p className="text-[11px] font-bold text-[#3F6212] uppercase mt-1 tracking-widest">MOU सहायता संपर्क नंबर</p>
                            <div className="mt-2.5 text-center">
                              <p className="text-[10px] font-extrabold text-[#4D7C0F] uppercase tracking-wider">
                                Inquiry Hours: Mon - Sat (10 AM - 6 PM)
                              </p>
                              <p className="text-[10px] font-bold text-gray-700 uppercase mt-1 tracking-tight">
                                पूछताछ का समय: सोम - शनि (सुबह 10 - शाम 6)
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                          <a
                            href="tel:+919289397569"
                            className="flex items-center gap-2 text-[#4D7C0F] font-black text-lg hover:scale-105 transition-transform"
                          >
                            <div className="w-10 h-10 bg-[#ECFCCB] rounded-full flex items-center justify-center shadow-sm">
                              <Phone size={20} className="fill-[#4D7C0F] text-[#4D7C0F]" />
                            </div>
                            <span>+91 92893 97569</span>
                          </a>
                          <a
                            href="tel:+919289397566"
                            className="flex items-center gap-2 text-[#4D7C0F] font-black text-lg hover:scale-105 transition-transform"
                          >
                            <div className="w-10 h-10 bg-[#ECFCCB] rounded-full flex items-center justify-center shadow-sm">
                              <Phone size={20} className="fill-[#4D7C0F] text-[#4D7C0F]" />
                            </div>
                            <span>+91 92893 97566</span>
                          </a>
                          <button
                            onClick={() => setIsGuidanceModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-2 bg-[#ECFCCB] text-[#4D7C0F] rounded-xl font-black text-xs uppercase tracking-widest border border-[#D9F99D] hover:bg-[#D9F99D] transition-all shadow-sm animate-pulse"
                          >
                            <PlayCircle size={16} />
                            Watch MOU Guidance Video
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="bg-[#ECFCCB] rounded-xl p-6 border border-[#D9F99D] mb-6">
                <p className="text-xs font-bold text-[#4D7C0F] uppercase tracking-widest mb-1">{t.scheduledFor}</p>
                <p className="text-xl font-black text-[#3F6212]">
                  {resDateStr}
                </p>
                <p className="text-[11px] text-[#3F6212] mt-2 italic">
                  {t.resultTBA(resDateStr)}
                </p>
              </div>
            )}

            <button
              onClick={() => setStep(STEP.list)}
              className="w-full py-3 bg-white text-[#3F6212] border-2 border-[#3F6212] rounded-xl font-bold hover:bg-[#3F6212] hover:text-white transition"
            >
              {t.close}
            </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (step === STEP.instructions) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          <div className="bg-white border rounded-xl shadow p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight">
              {selectedExam?.title}
            </h2>
            {summaryText && summaryText.trim() !== "." ? <p className="text-sm text-gray-500 mt-1">{summaryText}</p> : null}

            {selectedExam?.description && (
              <div className="mt-3 text-sm text-gray-600 border-l-4 border-[#4D7C0F] pl-4 py-1 italic">
                {selectedExam.description}
              </div>
            )}

            <div className="mt-5 px-5 py-4 bg-[#ECFCCB] border border-[#D9F99D] rounded-lg">
              <p className="text-base font-bold text-[#3F6212] mb-2">
                {t.instructions}
              </p>
              <ul className="text-[15px] font-semibold text-gray-800 space-y-1 leading-snug">
                <li>{t.totalQuestions}: <strong>{selectedExam?.totalQuestions || questions.length}</strong></li>
                <li>{t.duration}: <strong>{selectedExam?.duration} {t.minutes}</strong></li>
                <li>{t.stableInternet}</li>
                <li>{t.noRefresh}</li>
                <li>{t.autoSubmit}</li>
              </ul>
            </div>

            {/* Language Selection */}
            <div className="mt-5">
              <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Languages size={16} className="text-[#4D7C0F]" />
                {t.selectLanguage}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setExamLanguage("en")}
                  className={`px-4 py-4 border-2 rounded-xl flex flex-col items-center gap-1 transition-all ${examLanguage === "en"
                    ? "border-[#4D7C0F] bg-[#ECFCCB] shadow-sm"
                    : "border-gray-100 bg-gray-50 hover:border-[#4D7C0F] hover:bg-[#ECFCCB]"
                    }`}
                >
                  <span className="text-xl font-black text-gray-900">English</span>
                  <span className="text-xs text-gray-500 font-medium">{t.defaultLang}</span>
                </button>
                <button
                  onClick={() => setExamLanguage("hi")}
                  className={`px-4 py-4 border-2 rounded-xl flex flex-col items-center gap-1 transition-all ${examLanguage === "hi"
                    ? "border-[#4D7C0F] bg-[#ECFCCB] shadow-sm"
                    : "border-gray-100 bg-gray-50 hover:border-[#4D7C0F] hover:bg-[#ECFCCB]"
                    }`}
                >
                  <span className="text-xl font-black text-gray-900">हिंदी</span>
                  <span className="text-xs text-gray-500 font-medium">{t.hindiMedium}</span>
                </button>
              </div>
            </div>

            {error ? <p className="text-sm text-red-600 mt-4">{error}</p> : null}
            {selectedExam && !selectedExam.canStart ? (
              <p className="text-sm text-[#3F6212] mt-3">
                {t.alreadyAttempted}
              </p>
            ) : null}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(STEP.list)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                {t.back}
              </button>
              <button
                onClick={beginExam}
                disabled={!selectedExam?.canStart}
                className={`px-5 py-2 rounded-md ${selectedExam?.canStart
                  ? "bg-[#4D7C0F] text-white hover:bg-[#3F6212]"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
              >
                {t.startExam}
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (step === STEP.submitted) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-xl p-10 text-center animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full mx-auto flex items-center justify-center mb-8">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-4">{t.examSubmitted}</h1>
            <p className="text-gray-500 mb-8 leading-relaxed">
              {t.examRecorded}
            </p>
            <button
              onClick={() => setStep(STEP.list)}
              className="w-full py-4 bg-[#4D7C0F] text-white rounded-xl font-bold hover:bg-[#3F6212] transition-all transform hover:scale-[1.02] shadow-lg"
            >
              {t.backToDashboard}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="bg-[#4D7C0F] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Monitor size={20} /> {selectedExam?.title}
          </h1>
          <p className="text-sm text-[#D9F99D]">{summaryText}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-semibold">
            {answeredCount}/{questions.length}
          </div>
          <div className="bg-red-500 px-3 py-2 rounded font-semibold">
            <Clock size={16} className="inline mr-1" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="space-y-4">
          <div className="bg-white text-gray-900 rounded-lg p-3 shadow-sm border border-gray-100">
            <p className="font-semibold mb-2">{t.questionNavigator}</p>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(index)}
                  className={`h-9 rounded text-sm font-semibold transition-all ${currentQuestion === index
                    ? "bg-[#4D7C0F] text-white shadow-md scale-105"
                    : answers[q.id] !== undefined
                      ? "bg-[#4D7C0F] text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Quick End & Submit Button */}
          <button
            onClick={() => {
              const confirmMsg = examLanguage === "hi"
                ? "क्या आप वाकई परीक्षा समाप्त और सबmit करना चाहते हैं? (Are you sure you want to end and submit?)"
                : "Are you sure you want to end and submit the exam?";
              if (window.confirm(confirmMsg)) {
                handleSubmitExam(false);
              }
            }}
            disabled={submittingAttempt}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black transition-all shadow-lg hover:shadow-red-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 size={18} />
            {submittingAttempt ? t.submitting : t.endSubmit}
          </button>
        </div>

        <div className="bg-white text-gray-900 rounded-lg p-6">
          {current ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {t.questionXofY(currentQuestion + 1, questions.length)}
                </h2>
                {answers[current.id] !== undefined ? (
                  <span className="text-[#4D7C0F] text-sm font-semibold flex items-center gap-1">
                    <CheckCircle2 size={16} /> {t.answered}
                  </span>
                ) : null}
              </div>
              <p className="text-base font-medium mb-4">
                {examLanguage === "hi" && current.questionHi ? current.questionHi : current.question}
              </p>
              <div className="space-y-2">
                {(examLanguage === "hi" && current.optionsHi?.length === current.options.length
                  ? current.optionsHi
                  : current.options
                ).map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [current.id]: idx }))
                    }
                    className={`w-full text-left p-3 border rounded ${answers[current.id] === idx
                      ? "border-[#4D7C0F] bg-[#ECFCCB]"
                      : "border-gray-200"
                      }`}
                  >
                    <span className="font-semibold mr-2">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setCurrentQuestion((q) => Math.max(q - 1, 0))}
                  disabled={currentQuestion === 0}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  {t.previous}
                </button>
                {currentQuestion === questions.length - 1 ? (
                  <button
                    onClick={() => handleSubmitExam(false)}
                    disabled={submittingAttempt}
                    className="px-6 py-2 bg-[#3F6212] text-white rounded hover:bg-[#3F6212] disabled:opacity-60"
                  >
                    {submittingAttempt ? t.submitting : t.endSubmit}
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setCurrentQuestion((q) =>
                        Math.min(q + 1, questions.length - 1),
                      )
                    }
                    className="px-4 py-2 bg-[#4D7C0F] text-white rounded hover:bg-[#3F6212]"
                  >
                    {t.next}
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              {t.noQuestions}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
