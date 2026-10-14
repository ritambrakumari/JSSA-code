import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Early payment redirect check - runs before React loads
(function checkPaymentRedirect() {
  // Skip if already on payment-success page
  if (window.location.pathname === "/payment-success") {
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("orderId") || urlParams.get("order_id");
  const applicationId = urlParams.get("applicationId");
  const payment = urlParams.get("payment");
  const paymentStatus = urlParams.get("payment_status") || urlParams.get("txStatus") || urlParams.get("tx_status");
  const paymentId = urlParams.get("paymentId") || urlParams.get("razorpay_payment_id");

  // Get data from sessionStorage
  let pendingData = null;
  try {
    pendingData = sessionStorage.getItem("pendingApplication");
  } catch (e) {
    // sessionStorage might not be available in some cases
  }

  // IMPORTANT: Do NOT redirect based on pendingData alone (it can be stale and breaks navigation).
  // Only redirect when the URL indicates a payment return.
  const hasPaymentParams =
    orderId ||
    applicationId ||
    paymentId ||
    payment === "success" ||
    paymentStatus === "SUCCESS" ||
    paymentStatus === "success";

  if (hasPaymentParams) {
    // Get payment status to check if payment failed
    const txStatus = urlParams.get("txStatus") || urlParams.get("tx_status") || urlParams.get("payment_status") || "";

    // Don't redirect if payment explicitly failed
    if (txStatus !== "FAILED" && txStatus !== "failed" && txStatus !== "CANCELLED" && txStatus !== "cancelled") {
      let finalApplicationId = applicationId || "";
      let finalOrderId = orderId || "";

      // Try to get from sessionStorage if not in URL
      if (pendingData) {
        try {
          const data = JSON.parse(pendingData);
          if (!finalApplicationId) {
            finalApplicationId = data.applicationId || data.applicationData?._id || "";
          }
          if (!finalOrderId) {
            finalOrderId = data.orderId || "";
          }
        } catch (e) {
          console.error("Error parsing pendingData:", e);
        }
      }

      // Only redirect if we have at least applicationId (from URL or sessionStorage)
      if (finalApplicationId) {
        // Build redirect URL
        const redirectUrl = `/payment-success?orderId=${finalOrderId}&applicationId=${finalApplicationId}`;
        console.log("🚀 EARLY PAYMENT REDIRECT (before React): Redirecting to", redirectUrl, {
          hasPaymentParams,
          hasPendingData: !!pendingData,
          finalApplicationId,
          finalOrderId,
          currentPath: window.location.pathname,
          search: window.location.search
        });

        // Redirect immediately - this will prevent React from loading
        window.location.replace(redirectUrl);
        return; // Exit early
      }
    }
  }
})();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
// import DashboardLayout from "../components/DashboardLayout";
// import { User, Edit, GraduationCap } from "lucide-react";

// const My Exam = () => {
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
