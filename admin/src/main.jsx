import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Tailwind CSS

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// import DashboardLayout from "../components/DashboardLayout";
// import { User, Edit, GraduationCap } from "lucide-react";

// const StudentManagement = () => {
//   const students = [
//     {
//       id: "STU2025123",
//       name: "Aarav Sharma",
//       gender: "Male",
//       class: "10",
//       stream: "Science",
//       city: "Delhi",
//       batch: "A",
//       progress: "90%",
//       status: "Active",
//       addedBy: "John",
//     },
//     {
//       id: "STU2025124",
//       name: "Riya Patel",
//       gender: "Female",
//       class: "12",
//       stream: "Commerce",
//       city: "Mumbai",
//       batch: "B",
//       progress: "75%",
//       status: "Inactive",
//       addedBy: "Rohit",
//     },
//     {
//       id: "STU2025125",
//       name: "Arjun Verma",
//       gender: "Male",
//       class: "11",
//       stream: "Science",
//       city: "Jaipur",
//       batch: "A",
//       progress: "88%",
//       status: "Active",
//       addedBy: "John",
//     },
//     {
//       id: "STU2025126",
//       name: "Sneha Gupta",
//       gender: "Female",
//       class: "10",
//       stream: "Science",
//       city: "Lucknow",
//       batch: "C",
//       progress: "92%",
//       status: "Active",
//       addedBy: "Rohit",
//     },
//   ];

//   return (
//     <DashboardLayout>
//       <div className="p-6 space-y-6">
//         {/* Student Table */}
//         <div className="bg-white rounded-sm border border-gray-100 shadow-md overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="bg-orange-50 text-gray-700">
//               <tr>
//                 <th className="p-3 text-left">Student ID</th>
//                 <th className="p-3 text-left">Name</th>
//                 <th className="p-3 text-left">Gender</th>
//                 <th className="p-3 text-left">Class</th>
//                 <th className="p-3 text-left">Stream</th>
//                 <th className="p-3 text-left">City</th>
//                 <th className="p-3 text-left">Batch</th>
//                 <th className="p-3 text-left">Progress</th>
//                 <th className="p-3 text-left">Status</th>
//                 <th className="p-3 text-left">Added By</th>
//                 <th className="p-3 text-left">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {students.map((stu) => (
//                 <tr
//                   key={stu.id}
//                   className="border-t hover:bg-orange-50 transition-all duration-150"
//                 >
//                   <td className="p-3 font-medium">{stu.id}</td>
//                   <td className="p-3 flex items-center gap-2">
//                     <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
//                       <User className="text-orange-500" size={16} />
//                     </div>
//                     {stu.name}
//                   </td>
//                   <td className="p-3">{stu.gender}</td>
//                   <td className="p-3">{stu.class}</td>
//                   <td className="p-3">{stu.stream}</td>
//                   <td className="p-3">{stu.city}</td>
//                   <td className="p-3">{stu.batch}</td>
//                   <td className="p-3 font-medium text-orange-600">
//                     {stu.progress}
//                   </td>
//                   <td className="p-3">
//                     <span
//                       className={`px-2 py-1 rounded-full text-xs font-medium ${
//                         stu.status === "Active"
//                           ? "bg-green-100 text-green-600"
//                           : "bg-gray-100 text-gray-500"
//                       }`}
//                     >
//                       {stu.status}
//                     </span>
//                   </td>
//                   <td className="p-3">{stu.addedBy}</td>
//                   <td className="p-3 flex gap-1">
//                     <button className="p-1.5 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200">
//                       <User size={14} className="text-orange-600" />
//                     </button>
//                     <button className="p-1.5 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200">
//                       <Edit size={14} className="text-orange-600" />
//                     </button>
//                     <button className="p-1.5 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200">
//                       <GraduationCap size={14} className="text-orange-600" />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// };

// export default StudentManagement;
