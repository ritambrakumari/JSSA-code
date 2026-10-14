// import React, { useState, useEffect, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import DashboardLayout from "../../components/DashboardLayout";
// import { createPaperAPI } from "../../utils/api";
// import {
//   FileText,
//   Search,
//   ChevronRight,
//   RotateCcw,
//   Users,
//   AlertCircle,
//   ArrowLeft,
//   HelpCircle,
//   Trophy,
//   Activity,
//   ChevronLeft
// } from "lucide-react";

// // ── Components ──

// const StatusBadge = ({ status }) => {
//   const styles = {
//     Pass: "bg-green-100 text-green-800",
//     Fail: "bg-red-100 text-red-800",
//     Missed: "bg-amber-100 text-amber-800",
//     Pending: "bg-gray-100 text-gray-800"
//   };
//   return (
//     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status] || styles.Pending}`}>
//       {status}
//     </span>
//   );
// };

// export default function ReExam() {
//   const navigate = useNavigate();
//   const [tests, setTests] = useState([]);
//   const [selectedTest, setSelectedTest] = useState(null);
//   const [testDetails, setTestDetails] = useState(null);
//   const [attempts, setAttempts] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [filterStatus, setFilterStatus] = useState("all");
//   const [isActionLoading, setIsActionLoading] = useState(false);
//   const [selectedStudentIds, setSelectedStudentIds] = useState([]);

//   // Pagination states
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 10 });

//   // ── Load All Tests ──
//   const loadTests = async () => {
//     setIsLoading(true);
//     setError("");
//     try {
//       const res = await createPaperAPI.getAll({ minimal: "true" });
//       if (res.success) {
//         setTests(res.data.tests || []);
//       } else {
//         setError(res.error || "Failed to load exams.");
//       }
//     } catch (err) {
//       setError("Failed to connect to server.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadTests();
//   }, []);

//   // ── Load Test Details & Attempts ──
//   const loadTestDetails = async (test, page = 1) => {
//     setIsLoading(true);
//     setSelectedTest(test);
//     try {
//       const [detailsRes, attemptsRes] = await Promise.all([
//         createPaperAPI.getDetails(test.id),
//         createPaperAPI.getAttempts(test.id, {
//           page,
//           limit: 10,
//           search: searchQuery,
//           status: filterStatus
//         })
//       ]);

//       if (detailsRes.success && attemptsRes.success) {
//         setTestDetails(detailsRes.data.test);
//         setAttempts(attemptsRes.data.attempts || []);
//         setPagination(attemptsRes.data.pagination);
//         setCurrentPage(page);
//       } else {
//         setError("Failed to load details.");
//       }
//     } catch (err) {
//       setError("Failed to load details.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (selectedTest) {
//       loadTestDetails(selectedTest, 1);
//     }
//   }, [searchQuery, filterStatus]);

//   // ── Handle Re-Exam (Reset Attempts) ──
//   const handleReExam = async (applicationId, studentName) => {
//     if (!window.confirm(`Are you sure you want to reset attempts for ${studentName}? This will delete their current score and allow them to retake the exam.`)) {
//       return;
//     }

//     setIsActionLoading(true);
//     try {
//       const res = await createPaperAPI.resetAttempts(selectedTest.id, applicationId);
//       if (res.success) {
//         alert("Attempts reset successfully.");
//         // Reload current page of attempts
//         await loadTestDetails(selectedTest, currentPage);
//       } else {
//         alert(res.error || "Failed to reset attempts.");
//       }
//     } catch (err) {
//       alert("Failed to reset attempts.");
//     } finally {
//       setIsActionLoading(false);
//     }
//   };

//   const toggleStudentSelection = (studentId) => {
//     setSelectedStudentIds(prev =>
//       prev.includes(studentId)
//         ? prev.filter(id => id !== studentId)
//         : [...prev, studentId]
//     );
//   };

//   const toggleSelectAll = () => {
//     if (selectedStudentIds.length === filteredStudents.length) {
//       setSelectedStudentIds([]);
//     } else {
//       setSelectedStudentIds(filteredStudents.map(s => s._id));
//     }
//   };

//   const handlePlanReExam = async () => {
//     if (selectedStudentIds.length === 0) {
//       alert("Please select at least one student to plan a re-exam.");
//       return;
//     }

//     if (!window.confirm(`Create a new Re-Exam paper for these ${selectedStudentIds.length} selected students? You will be taken to the 'Create Paper' section to finalize it.`)) {
//       return;
//     }

//     setIsActionLoading(true);
//     try {
//       // Prepare the data for CreatePaper.jsx
//       // We only send the title and selected students so the user can "re-select"
//       // the questions, duration, and other details from scratch.
//       const reExamData = {
//         title: `Re-Exam: ${selectedTest.title}`,
//         assignedStudents: selectedStudentIds,
//         status: "draft",
//       };

//       // Navigate to CreatePaper.jsx with this data
//       navigate("/create-paper", { state: { reExamData } });
//     } catch (err) {
//       alert("Failed to plan re-exam.");
//     } finally {
//       setIsActionLoading(false);
//     }
//   };

//   // ── Calculations ──
//   const processedStudents = useMemo(() => {
//     if (!testDetails) return [];

//     return attempts.map(attempt => {
//       const student = attempt.applicationId || {};
//       const studentId = student._id;

//       let score = attempt.score;
//       let pct = Math.round((attempt.score / (testDetails.totalMarks || 1)) * 100);
//       let status = pct >= (testDetails.passingMarks || 40) ? "Pass" : "Fail";

//       return {
//         ...student,
//         status,
//         score,
//         pct,
//         hasAttempt: true,
//         _id: studentId
//       };
//     });
//   }, [testDetails, attempts]);

//   const filteredStudents = processedStudents;

//   // ── Render ──

//   if (isLoading && tests.length === 0) {
//     return (
//       <DashboardLayout>
//         <div className="flex flex-col items-center justify-center min-h-[60vh]">
//           <div className="w-12 h-12 border-4 border-[#3AB000]/20 border-t-[#3AB000] rounded-full animate-spin mb-4" />
//           <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Exams...</p>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   return (
//     <DashboardLayout>
//       <div className="min-h-screen bg-white ml-0 p-0 md:ml-6 px-2 md:px-0 pb-10">
//         {!selectedTest ? (
//           // ── List of Tests ──
//           <div className="space-y-6">
//             <div className="bg-gradient-to-r from-gray-900 to-black rounded-2xl p-8 text-white mb-8">
//               <h1 className="text-3xl font-black mb-2">Re-Exam Management</h1>
//               <p className="text-gray-400 text-sm font-bold">Select an exam to manage student attempts and reset scores.</p>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {tests.length === 0 ? (
//                 <div className="col-span-full py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
//                   <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
//                   <p className="text-gray-500 font-bold">No exams found.</p>
//                 </div>
//               ) : (
//                 tests.map(test => (
//                   <div
//                     key={test.id}
//                     onClick={() => loadTestDetails(test)}
//                     className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:border-[#3AB000] hover:shadow-xl hover:shadow-[#3AB000]/5 transition-all group cursor-pointer"
//                   >
//                     <div className="flex items-start justify-between mb-4">
//                       <div className="w-12 h-12 bg-[#f0fce8] rounded-xl flex items-center justify-center text-[#3AB000] group-hover:scale-110 transition-transform">
//                         <FileText size={24} />
//                       </div>
//                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${test.status === 'published' ? 'bg-[#3AB000] text-white' : 'bg-gray-100 text-gray-400'}`}>
//                         {test.status}
//                       </span>
//                     </div>
//                     <h3 className="text-lg font-black text-gray-900 mb-2 group-hover:text-[#3AB000] transition-colors line-clamp-2">
//                       {test.title}
//                     </h3>
//                     <div className="grid grid-cols-2 gap-4 mt-6">
//                       <div className="space-y-1">
//                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Questions</p>
//                         <p className="text-sm font-bold text-gray-700">{test.totalQuestions}</p>
//                       </div>
//                       <div className="space-y-1">
//                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</p>
//                         <p className="text-sm font-bold text-gray-700">{test.duration} Min</p>
//                       </div>
//                     </div>
//                     <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
//                       <div className="flex items-center gap-2 text-[#3AB000]">
//                         <Activity size={16} />
//                         <span className="text-xs font-black uppercase tracking-widest">Manage Retakes</span>
//                       </div>
//                       <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         ) : (
//           // ── Detailed View for Selected Test ──
//           <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
//             <div className="flex items-center gap-4 mb-8">
//               <button
//                 onClick={() => {
//                   setSelectedTest(null);
//                   setTestDetails(null);
//                   setAttempts([]);
//                   setCurrentPage(1);
//                 }}
//                 className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors"
//               >
//                 <ArrowLeft size={20} />
//               </button>
//               <div>
//                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Back to Exams</p>
//                 <h2 className="text-2xl font-black text-gray-900">{selectedTest.title}</h2>
//               </div>
//             </div>

//             {/* Stats Overview */}
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
//               {[
//                 { label: "Assigned", value: testDetails?.assignedStudents?.length || 0, icon: Users, color: "text-blue-600" },
//                 { label: "Total Attempts", value: pagination.total, icon: Activity, color: "text-[#3AB000]" },
//                 { label: "Passing Score", value: testDetails?.passingMarks || 40, icon: Trophy, color: "text-amber-600" },
//                 { label: "Total Marks", value: testDetails?.totalMarks || 0, icon: HelpCircle, color: "text-purple-600" },
//               ].map((stat, i) => (
//                 <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
//                   <div className="flex items-center gap-3 mb-2">
//                     <stat.icon size={16} className={stat.color} />
//                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
//                   </div>
//                   <p className="text-2xl font-black text-gray-900">{stat.value}</p>
//                 </div>
//               ))}
//             </div>

//             {/* Filters & Actions */}
//             <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
//               <div className="relative w-full md:w-96">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
//                 <input
//                   type="text"
//                   placeholder="Search students..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3AB000] outline-none font-medium"
//                 />
//               </div>
//               <div className="flex flex-wrap gap-3 w-full md:w-auto">
//                 <select
//                   value={filterStatus}
//                   onChange={(e) => setFilterStatus(e.target.value)}
//                   className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none bg-white flex-1 md:flex-none"
//                 >
//                   <option value="all">All Status</option>
//                   <option value="pass">Passed</option>
//                   <option value="fail">Failed</option>
//                   <option value="missed">Missed</option>
//                   <option value="pending">Pending</option>
//                 </select>

//                 <div className="flex gap-2 w-full sm:w-auto">
//                   <button
//                     onClick={handlePlanReExam}
//                     disabled={isActionLoading}
//                     className="flex-1 sm:flex-none px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
//                   >
//                     Plan New Re-Exam
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {/* Student List */}
//             <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
//               <table className="w-full text-left border-collapse">
//                 <thead>
//                   <tr className="bg-gray-50/50 border-b border-gray-100">
//                     <th className="px-6 py-4 w-12">
//                       <input
//                         type="checkbox"
//                         checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
//                         onChange={toggleSelectAll}
//                         className="w-4 h-4 rounded border-gray-300 text-[#3AB000] focus:ring-[#3AB000]"
//                       />
//                     </th>
//                     <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Details</th>
//                     <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Score / Pct</th>
//                     <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
//                     <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-50">
//                   {isLoading ? (
//                     <tr>
//                       <td colSpan="4" className="py-20 text-center">
//                         <div className="w-8 h-8 border-4 border-[#3AB000]/20 border-t-[#3AB000] rounded-full animate-spin mx-auto mb-4" />
//                         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Students...</p>
//                       </td>
//                     </tr>
//                   ) : filteredStudents.length === 0 ? (
//                     <tr>
//                       <td colSpan="4" className="py-20 text-center text-gray-400 font-bold">No attempts found for this page.</td>
//                     </tr>
//                   ) : (
//                     filteredStudents.map(student => (
//                       <tr key={student._id} className="hover:bg-[#f0fce8]/30 transition-colors group">
//                         <td className="px-6 py-4">
//                           <input
//                             type="checkbox"
//                             checked={selectedStudentIds.includes(student._id)}
//                             onChange={() => toggleStudentSelection(student._id)}
//                             className="w-4 h-4 rounded border-gray-300 text-[#3AB000] focus:ring-[#3AB000]"
//                           />
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex items-center gap-4">
//                             <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 font-black text-xs">
//                               {student.candidateName?.charAt(0)}
//                             </div>
//                             <div>
//                               <p className="text-sm font-bold text-gray-900 group-hover:text-[#3AB000] transition-colors">{student.candidateName}</p>
//                               <p className="text-[10px] text-gray-400 font-medium">
//                                 <span className="text-[#3AB000] font-bold">{student.applicationNumber}</span> · {student.mobile} · {student.district}
//                               </p>
//                               <p className="text-[10px] text-gray-400 font-medium">{student.email}</p>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 text-center">
//                           <p className="text-sm font-black text-gray-900">{student.score} / {testDetails.totalMarks}</p>
//                           <p className="text-[10px] text-[#3AB000] font-black">{student.pct}%</p>
//                         </td>
//                         <td className="px-6 py-4 text-center">
//                           <StatusBadge status={student.status} />
//                         </td>
//                         <td className="px-6 py-4 text-right">
//                           <button
//                             onClick={() => handleReExam(student._id, student.candidateName)}
//                             disabled={isActionLoading || !student.hasAttempt}
//                             className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
//                               student.hasAttempt
//                                 ? "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
//                                 : "bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed"
//                             }`}
//                           >
//                             <RotateCcw size={14} />
//                             Reset & Retake
//                           </button>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             {/* Pagination UI */}
//             {pagination.pages > 1 && (
//               <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
//                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
//                   Showing {(currentPage - 1) * pagination.limit + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} students
//                 </p>
//                 <div className="flex gap-2">
//                   <button
//                     disabled={currentPage === 1 || isLoading}
//                     onClick={() => loadTestDetails(selectedTest, currentPage - 1)}
//                     className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
//                   >
//                     <ChevronLeft size={18} />
//                   </button>
//                   <div className="flex gap-1">
//                     {[...Array(pagination.pages)].map((_, i) => (
//                       <button
//                         key={i}
//                         onClick={() => loadTestDetails(selectedTest, i + 1)}
//                         className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
//                           currentPage === i + 1
//                             ? "bg-[#3AB000] text-white"
//                             : "bg-white border border-gray-200 text-gray-400 hover:border-[#3AB000] hover:text-[#3AB000]"
//                         }`}
//                       >
//                         {i + 1}
//                       </button>
//                     ))}
//                   </div>
//                   <button
//                     disabled={currentPage === pagination.pages || isLoading}
//                     onClick={() => loadTestDetails(selectedTest, currentPage + 1)}
//                     className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
//                   >
//                     <ChevronRight size={18} />
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </DashboardLayout>
//   );
// }
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { createPaperAPI } from "../../utils/api";
import {
  FileText,
  Search,
  ChevronRight,
  RotateCcw,
  Users,
  AlertCircle,
  ArrowLeft,
  HelpCircle,
  Trophy,
  Activity,
  ChevronLeft,
  Edit,
  UserPlus,
} from "lucide-react";

// ── Status Badge ──
const StatusBadge = ({ status }) => {
  const styles = {
    Pass: "text-[#3AB000] font-semibold",
    Fail: "text-red-500 font-semibold",
    Missed: "text-amber-500 font-semibold",
    Pending: "text-gray-400 font-semibold",
    Unassigned: "text-blue-500 font-semibold",
  };
  return (
    <span className={`text-xs ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
};

// ── Loading Overlay ──
function LoadingOverlay({ message = "Fetching data..." }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 min-w-[200px]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-[#3AB000] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-bold text-gray-800 animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}

export default function ReExam() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testDetails, setTestDetails] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  // Test list pagination
  const [testPage, setTestPage] = useState(1);
  const testsPerPage = 7;

  // Attempt pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    limit: 10,
  });



  // ── Load All Tests ──
  const loadTests = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await createPaperAPI.getAll({ minimal: "true" });
      if (res.success) {
        setTests(res.data.tests || []);
      } else {
        setError(res.error || "Failed to load exams.");
      }
    } catch {
      setError("Failed to connect to server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  // ── Load Test Details & Attempts ──
  const loadTestDetails = async (test, page = 1) => {
    setIsLoading(true);
    setSelectedTest(test);
    try {
      const [detailsRes, attemptsRes] = await Promise.all([
        createPaperAPI.getDetails(test.id),
        createPaperAPI.getAttempts(test.id, {
          page,
          limit: 10,
          search: searchQuery,
          status: filterStatus,
        }),
      ]);
      if (detailsRes.success && attemptsRes.success) {
        setTestDetails(detailsRes.data.test);
        setAttempts(attemptsRes.data.attempts || []);
        setPagination(attemptsRes.data.pagination);
        setCurrentPage(page);
      } else {
        setError("Failed to load details.");
      }
    } catch {
      setError("Failed to load details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTest) {
      if (filterStatus === "unassigned") {
        loadUnassigned(selectedTest, 1);
      } else {
        loadTestDetails(selectedTest, 1);
      }
    }
  }, [searchQuery, filterStatus]);


  // ── Reset Attempts ──
  const handleReExam = async (applicationId, studentName) => {
    if (
      !window.confirm(
        `Are you sure you want to reset attempts for ${studentName}? This will delete their current score and allow them to retake the exam.`,
      )
    )
      return;
    setIsActionLoading(true);
    try {
      const res = await createPaperAPI.resetAttempts(
        selectedTest.id,
        applicationId,
      );
      if (res.success) {
        alert("Attempts reset successfully.");
        await loadTestDetails(selectedTest, currentPage);
      } else {
        alert(res.error || "Failed to reset attempts.");
      }
    } catch {
      alert("Failed to reset attempts.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const toggleSelectAll = async () => {
    // Check if everything on current page is selected
    const pageStudentIds = filteredStudents.map((s) => s._id);
    const allOnPageSelected = pageStudentIds.length > 0 && pageStudentIds.every((id) =>
      selectedStudentIds.includes(id),
    );

    if (allOnPageSelected) {
      // If everything on page is selected, just clear the current page selection
      setSelectedStudentIds((prev) =>
        prev.filter((id) => !pageStudentIds.includes(id)),
      );
    } else {
      // PROMPT USER: Select only current page or ALL students (across all pages)?
      const selectAllMode = window.confirm(
        `Do you want to select ALL ${pagination.total} filtered students across ALL pages?\n\nClick 'OK' for ALL students.\nClick 'Cancel' for only current page.`
      );

      if (selectAllMode) {
        setIsActionLoading(true);
        try {
          const res = await createPaperAPI.getAllStudentIds(selectedTest.id, {
            search: searchQuery,
            status: filterStatus,
          });
          if (res?.success) {
            const allIds = res.data.studentIds.map(id => String(id));
            setSelectedStudentIds(allIds);
          } else {
            alert("Failed to fetch all student IDs.");
          }
        } catch (err) {
          console.error(err);
          alert("Error fetching student IDs.");
        } finally {
          setIsActionLoading(false);
        }
      } else {
        // Just select current page
        setSelectedStudentIds((prev) => [
          ...new Set([...prev, ...pageStudentIds]),
        ]);
      }
    }
  };

  const handlePlanReExam = async () => {
    if (selectedStudentIds.length === 0) {
      alert("Please select at least one student to plan a re-exam.");
      return;
    }
    if (
      !window.confirm(
        `Create a new Re-Exam paper for these ${selectedStudentIds.length} selected students? You will be taken to the 'Create Paper' section to finalize it.`,
      )
    )
      return;
    setIsActionLoading(true);
    try {
      navigate("/create-paper", {
        state: {
          reExamData: {
            title: `Re-Exam: ${selectedTest.title}`,
            assignedStudents: selectedStudentIds,
            status: "draft",
          },
        },
      });
    } catch {
      alert("Failed to plan re-exam.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // ── Derived Data ──
  const filteredStudents = useMemo(() => {
    if (!testDetails || !attempts) return [];

    // Since attempts are paginated on the backend, we use attempts as the primary source 
    // for the table rows to ensure pagination works correctly.
    return attempts.map((attempt) => {
      const student = attempt.applicationId || {};
      const score = attempt.score || 0;
      const totalMarks = testDetails.totalMarks || 100;
      const pct = Math.round((score / totalMarks) * 100);
      
      // Use status from backend if available, otherwise calculate Pass/Fail
      const status = attempt.status || (pct >= (testDetails.passingMarks || 40) ? "Pass" : "Fail");
      const hasAttempt = attempt.hasAttempt !== undefined ? attempt.hasAttempt : true;

      return {
        ...student,
        _id: student._id,
        status,
        score,
        pct,
        hasAttempt,
      };
    });
  }, [testDetails, attempts]);

  // ── Test list filtering by tab ──
  const filteredTests = tests.filter((t) => {
    if (activeTab === "published") return t.status === "published";
    if (activeTab === "draft") return t.status === "draft";
    return true;
  });

  const totalTestPages = Math.ceil(filteredTests.length / testsPerPage);
  const pagedTests = filteredTests.slice(
    (testPage - 1) * testsPerPage,
    testPage * testsPerPage,
  );

  // ── Table Skeleton ──
  const TableSkeleton = ({ cols = 5 }) => (
    <tbody>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-gray-100">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-4 text-center">
              <div className="bg-gray-200 rounded mx-auto h-4 w-4/5" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );

  // ── Loading Screen ──
  if (isLoading && tests.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-[#3AB000]/20 border-t-[#3AB000] rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm font-medium">Loading Exams...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {(isLoading || isActionLoading) && (
        <LoadingOverlay
          message={isActionLoading ? "Processing..." : "Loading Data..."}
        />
      )}
      <div className="min-h-screen bg-white ml-0 p-0 md:ml-6 px-2 md:px-0 pb-10">
        {!selectedTest ? (
          // ────────────────────────────────────────────────
          //  LIST VIEW
          // ────────────────────────────────────────────────
          <div>
            {/* Top Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                {/* Left side (Title) */}
                <h1 className="text-base sm:text-lg font-bold text-gray-800 hidden lg:block">
                  Re-Exam Management
                </h1>

                {/* Right side (Tabs / Filter) */}
                <div className="flex justify-end w-full sm:w-auto">
                  <div className="gap-0 border border-gray-300 rounded overflow-hidden flex w-full sm:w-auto">
                    {["all", "published", "draft"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => {
                          setActiveTab(tab);
                          setTestPage(1);
                        }}
                        className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium border-r border-gray-300 last:border-r-0 transition-colors whitespace-nowrap ${
                          activeTab === tab
                            ? "bg-[#3AB000] text-white"
                            : "bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="bg-[#3AB000]">
                      {[
                        "S.N",
                        "Exam Title",
                        "Questions",
                        "Duration",
                        "Status",
                        "Action",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {isLoading ? (
                    <TableSkeleton cols={6} />
                  ) : filteredTests.length === 0 ? (
                    <tbody>
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center py-12 text-gray-400 text-sm"
                        >
                          {error ? (
                            <div className="flex flex-col items-center gap-2">
                              <p className="text-red-500">{error}</p>
                              <button
                                onClick={loadTests}
                                className="bg-[#3AB000] text-white px-4 py-1.5 rounded text-xs hover:bg-[#2d8a00]"
                              >
                                Retry
                              </button>
                            </div>
                          ) : (
                            "No exams found."
                          )}
                        </td>
                      </tr>
                    </tbody>
                  ) : (
                    <tbody>
                      {pagedTests.map((test, idx) => (
                        <tr
                          key={test.id}
                          className="border-b border-gray-100 hover:bg-[#e8f5e2] transition-colors"
                        >
                          <td className="px-4 py-4 text-center text-gray-700">
                            {(testPage - 1) * testsPerPage + idx + 1}
                          </td>
                          <td className="px-4 py-4 text-center text-[#2d8a00] font-semibold">
                            {test.title}
                          </td>
                          <td className="px-4 py-4 text-center text-gray-700">
                            {test.totalQuestions}
                          </td>
                          <td className="px-4 py-4 text-center text-gray-700 whitespace-nowrap">
                            {test.duration} Min
                          </td>
                          <td
                            className={`px-4 py-4 text-center text-xs font-semibold ${test.status === "published" ? "text-[#3AB000]" : "text-gray-400"}`}
                          >
                            {test.status === "published"
                              ? "Published"
                              : "Draft"}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => loadTestDetails(test)}
                              className="text-[#3AB000] hover:text-[#2d8a00] transition-colors"
                              title="Manage Retakes"
                            >
                              <Activity className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  )}
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded border border-gray-200 p-4 animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                ))
              ) : filteredTests.length === 0 ? (
                <div className="bg-white rounded border border-gray-200 p-8 text-center text-gray-400 text-sm">
                  No exams found.
                </div>
              ) : (
                pagedTests.map((test, idx) => (
                  <div
                    key={test.id}
                    className="bg-white rounded border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">
                          S.N: {(testPage - 1) * testsPerPage + idx + 1}
                        </div>
                        <div className="text-base font-semibold text-[#2d8a00]">
                          {test.title}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${test.status === "published" ? "text-[#3AB000]" : "text-gray-400"}`}
                      >
                        {test.status === "published" ? "Published" : "Draft"}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-700 mb-3">
                      <div className="flex">
                        <span className="font-medium w-24 flex-shrink-0">
                          Questions:
                        </span>
                        <span>{test.totalQuestions}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium w-24 flex-shrink-0">
                          Duration:
                        </span>
                        <span>{test.duration} Min</span>
                      </div>
                    </div>
                    <div className="flex justify-end pt-3 border-t border-gray-100">
                      <button
                        onClick={() => loadTestDetails(test)}
                        className="text-[#3AB000] hover:text-[#2d8a00] transition-colors p-2"
                        title="Manage Retakes"
                      >
                        <Activity className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {!isLoading && filteredTests.length > testsPerPage && (
              <div className="flex flex-col sm:flex-row justify-between sm:justify-end items-center gap-3 mt-6">
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center">
                  <button
                    onClick={() => setTestPage((p) => Math.max(p - 1, 1))}
                    disabled={testPage === 1}
                    className="bg-[#3AB000] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:bg-[#2d8a00] transition-colors rounded-sm flex-1 sm:flex-none"
                  >
                    Back
                  </button>
                  <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
                    {(() => {
                      const pages = [];
                      const visible = new Set([
                        1,
                        2,
                        totalTestPages - 1,
                        totalTestPages,
                        testPage - 1,
                        testPage,
                        testPage + 1,
                      ]);
                      for (let i = 1; i <= totalTestPages; i++) {
                        if (visible.has(i)) pages.push(i);
                        else if (pages[pages.length - 1] !== "...")
                          pages.push("...");
                      }
                      return pages.map((page, i) =>
                        page === "..." ? (
                          <span
                            key={i}
                            className="px-1 text-gray-500 select-none"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setTestPage(page)}
                            className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors ${testPage === page ? "text-[#3AB000] font-bold" : "text-gray-600 hover:text-[#3AB000]"}`}
                          >
                            {page}
                          </button>
                        ),
                      );
                    })()}
                  </div>
                  <button
                    onClick={() =>
                      setTestPage((p) => Math.min(p + 1, totalTestPages))
                    }
                    disabled={testPage === totalTestPages}
                    className="bg-[#3AB000] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:bg-[#2d8a00] transition-colors rounded-sm flex-1 sm:flex-none"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // ────────────────────────────────────────────────
          //  DETAIL VIEW
          // ────────────────────────────────────────────────
          <div>
            {/* Back Header */}
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => {
                  setSelectedTest(null);
                  setTestDetails(null);
                  setAttempts([]);
                  setCurrentPage(1);
                }}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-800"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">
                  Re-Exam Management
                </p>
                <h2 className="text-base sm:text-lg font-bold text-gray-800">
                  {selectedTest.title}
                </h2>
              </div>
            </div>

            {/* Stats Row */}
            <div className="hidden md:block bg-white rounded overflow-hidden border border-gray-200 mb-5">
              <div className="grid grid-cols-4 divide-x divide-gray-200">
                {[
                  {
                    label: "Assigned Students",
                    value: testDetails?.assignedStudents?.length || 0,
                    icon: Users,
                  },
                  {
                    label: "Total Attempts",
                    value: pagination.total,
                    icon: Activity,
                  },
                  {
                    label: "Passing Score",
                    value: testDetails?.passingMarks || 40,
                    icon: Trophy,
                  },
                  {
                    label: "Total Marks",
                    value: testDetails?.totalMarks || 0,
                    icon: HelpCircle,
                  },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-4">
                    <stat.icon
                      size={18}
                      className="text-[#3AB000] flex-shrink-0"
                    />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">
                        {stat.label}
                      </p>
                      <p className="text-xl font-bold text-gray-800">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Stats */}
            <div className="md:hidden grid grid-cols-2 gap-3 mb-4">
              {[
                {
                  label: "Assigned",
                  value: testDetails?.assignedStudents?.length || 0,
                  icon: Users,
                },
                { label: "Attempts", value: pagination.total, icon: Activity },
                {
                  label: "Passing Score",
                  value: testDetails?.passingMarks || 40,
                  icon: Trophy,
                },
                {
                  label: "Total Marks",
                  value: testDetails?.totalMarks || 0,
                  icon: HelpCircle,
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white rounded border border-gray-200 p-3 flex items-center gap-2"
                >
                  <stat.icon size={16} className="text-[#3AB000]" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {stat.label}
                    </p>
                    <p className="text-lg font-bold text-gray-800">
                      {stat.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 w-full">
                {/* Status Tabs */}
                <div className="flex items-center gap-0 border border-gray-300 rounded overflow-hidden flex-shrink-0 w-full sm:w-auto">
                  {["all", "pass", "fail", "missed", "pending"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setFilterStatus(tab);
                        setSelectedStudentIds([]);
                      }}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-r border-gray-300 last:border-r-0 transition-colors whitespace-nowrap ${
                        filterStatus === tab
                          ? "bg-[#3AB000] text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="flex items-center border border-gray-300 rounded overflow-hidden h-10 flex-1 w-full sm:max-w-[400px]">
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="flex-1 px-3 sm:px-4 text-xs sm:text-sm text-gray-700 focus:outline-none h-full bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs sm:text-sm px-4 h-full font-medium transition-colors whitespace-nowrap">
                    Search
                  </button>
                </div>
              </div>

              <button
                onClick={handlePlanReExam}
                disabled={isActionLoading}
                className="bg-black hover:bg-[#3AB000] text-white text-xs sm:text-sm font-medium px-4 sm:px-6 py-2.5 rounded-sm transition-colors whitespace-nowrap w-full sm:w-auto"
              >
                + Plan New Re-Exam
              </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead>
                    <tr className="bg-[#3AB000]">
                      <th className="px-4 py-3 text-center font-bold text-black text-sm w-12">
                        <input
                          type="checkbox"
                          checked={
                            filteredStudents.length > 0 &&
                            selectedStudentIds.length === filteredStudents.length
                          }
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 accent-black"
                        />
                      </th>
                      {[
                        "S.N",
                        "Student Details",
                        "Score / %",
                        "Status",
                        "Action",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-center font-bold text-black text-sm whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {isLoading ? (
                    <TableSkeleton cols={6} />
                  ) : filteredStudents.length === 0 ? (
                    <tbody>
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-12 text-gray-400 text-sm"
                        >
                          No attempts found.
                        </td>
                      </tr>
                    </tbody>
                  ) : (
                    <tbody>
                      {filteredStudents.map((student, idx) => (
                        <tr
                          key={student._id}
                          className="border-b border-gray-100 hover:bg-[#e8f5e2] transition-colors"
                        >
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(student._id)}
                              onChange={() =>
                                toggleStudentSelection(student._id)
                              }
                              className="w-4 h-4 rounded border-gray-300 accent-[#3AB000]"
                            />
                          </td>
                          <td className="px-4 py-4 text-center text-gray-700">
                            {(currentPage - 1) * pagination.limit + idx + 1}
                          </td>
                          <td className="px-4 py-4 text-left">
                            <p className="text-sm font-semibold text-[#2d8a00]">
                              {student.candidateName}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {student.applicationNumber} · {student.mobile} ·{" "}
                              {student.district}
                            </p>
                            <p className="text-xs text-gray-400">
                              {student.email}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-center text-gray-700 whitespace-nowrap">
                            <span className="font-semibold">
                              {student.score} / {testDetails?.totalMarks}
                            </span>
                            <span className="text-[#3AB000] font-semibold block text-xs">
                              {student.pct}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <StatusBadge status={student.status} />
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() =>
                                handleReExam(student._id, student.candidateName)
                              }
                              disabled={isActionLoading || !student.hasAttempt}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                student.hasAttempt
                                  ? "text-red-600 border border-red-200 hover:bg-red-50"
                                  : "text-gray-300 border border-gray-100 cursor-not-allowed"
                              }`}
                            >
                              <RotateCcw size={13} />
                              Reset
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  )}
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded border border-gray-200 p-4 animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                ))
              ) : filteredStudents.length === 0 ? (
                <div className="bg-white rounded border border-gray-200 p-8 text-center text-gray-400 text-sm">
                  No attempts found.
                </div>
              ) : (
                filteredStudents.map((student, idx) => (
                  <div
                    key={student._id}
                    className="bg-white rounded border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student._id)}
                          onChange={() => toggleStudentSelection(student._id)}
                          className="w-4 h-4 rounded border-gray-300 accent-[#3AB000] flex-shrink-0"
                        />
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">
                            S.N:{" "}
                            {(currentPage - 1) * pagination.limit + idx + 1}
                          </div>
                          <div className="text-sm font-semibold text-[#2d8a00]">
                            {student.candidateName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {student.applicationNumber} · {student.mobile}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={student.status} />
                    </div>
                    <div className="space-y-1 text-sm text-gray-700 mb-3">
                      <div className="flex">
                        <span className="font-medium w-20 flex-shrink-0">
                          Score:
                        </span>
                        <span>
                          {student.score} / {testDetails?.totalMarks}{" "}
                          <span className="text-[#3AB000] font-semibold">
                            ({student.pct}%)
                          </span>
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-medium w-20 flex-shrink-0">
                          District:
                        </span>
                        <span>{student.district}</span>
                      </div>
                    </div>
                    <div className="flex justify-end pt-3 border-t border-gray-100">
                      <button
                        onClick={() =>
                          handleReExam(student._id, student.candidateName)
                        }
                        disabled={isActionLoading || !student.hasAttempt}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          student.hasAttempt
                            ? "text-red-600 border border-red-200 hover:bg-red-50"
                            : "text-gray-300 border border-gray-100 cursor-not-allowed"
                        }`}
                      >
                        <RotateCcw size={13} />
                        Reset & Retake
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {!isLoading && pagination.pages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between sm:justify-end items-center gap-3 mt-6">
                <div className="text-xs text-gray-500 sm:hidden">
                  Showing {(currentPage - 1) * pagination.limit + 1}–
                  {Math.min(currentPage * pagination.limit, pagination.total)}{" "}
                  of {pagination.total}
                </div>
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center">
                  <button
                    onClick={() =>
                      loadTestDetails(selectedTest, currentPage - 1)
                    }
                    disabled={currentPage === 1 || isLoading}
                    className="bg-[#3AB000] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:bg-[#2d8a00] transition-colors rounded-sm flex-1 sm:flex-none"
                  >
                    Back
                  </button>
                  <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
                    {(() => {
                      const pages = [];
                      const visible = new Set([
                        1,
                        2,
                        pagination.pages - 1,
                        pagination.pages,
                        currentPage - 1,
                        currentPage,
                        currentPage + 1,
                      ]);
                      for (let i = 1; i <= pagination.pages; i++) {
                        if (visible.has(i)) pages.push(i);
                        else if (pages[pages.length - 1] !== "...")
                          pages.push("...");
                      }
                      return pages.map((page, i) =>
                        page === "..." ? (
                          <span
                            key={i}
                            className="px-1 text-gray-500 select-none"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => loadTestDetails(selectedTest, page)}
                            className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors ${currentPage === page ? "text-[#3AB000] font-bold" : "text-gray-600 hover:text-[#3AB000]"}`}
                          >
                            {page}
                          </button>
                        ),
                      );
                    })()}
                  </div>
                  <div className="sm:hidden text-sm font-medium text-gray-700 px-2">
                    {currentPage}
                  </div>
                  <button
                    onClick={() =>
                      loadTestDetails(selectedTest, currentPage + 1)
                    }
                    disabled={currentPage === pagination.pages || isLoading}
                    className="bg-[#3AB000] disabled:opacity-50 text-white px-6 sm:px-10 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:bg-[#2d8a00] transition-colors rounded-sm flex-1 sm:flex-none"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
