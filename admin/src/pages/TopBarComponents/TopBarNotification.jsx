import React, { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { FiBell, FiSearch, FiX } from "react-icons/fi";

const sampleNotifications = [
  {
    id: 1,
    title: "📚 Course Enrollment Confirmed",
    message:
      "Your enrollment for the Spring 2026 semester has been successfully processed.",
    time: "2h ago",
  },
  {
    id: 2,
    title: "🎉 Study Skills Workshop",
    message:
      "Reminder: The Study Skills Workshop is happening tomorrow at 10 AM.",
    time: "1d ago",
  },
  {
    id: 3,
    title: "System Maintenance",
    message:
      "Portal maintenance scheduled for November 12th from 1:00 AM to 3:00 AM UTC.",
    time: "3d ago",
  },
  {
    id: 4,
    title: "📖 Library Due Date",
    message:
      "Your borrowed book 'Introduction to Data Science' is due soon. Remember to return or renew.",
    time: "4d ago",
  },
  {
    id: 5,
    title: "Assignment Feedback Released",
    message:
      "Your Machine Learning Assignment #2 feedback has been posted on the dashboard.",
    time: "5d ago",
  },
];

const NotificationPage = () => {
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [search, setSearch] = useState("");

  const filteredNotifications = sampleNotifications.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-black text-white pt-[72px] px-4 sm:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FiBell className="text-orange-400" />
            Notifications
          </h1>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-[#111] border border-gray-800 rounded-sm px-3 py-2 mb-5">
          <FiSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-black w-full outline-none text-sm text-white placeholder-gray-500"
          />
        </div>

        {/* Notification List */}
        <div className="bg-[#111] border border-gray-800 rounded-sm overflow-hidden divide-y divide-gray-800">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => setSelectedNotification(n)}
                className="p-4 hover:bg-[#1a1a1a] cursor-pointer transition"
              >
                <h3 className="font-semibold text-white">{n.title}</h3>
                <p className="text-sm text-gray-300 mt-1">{n.message}</p>
                <span className="text-xs text-gray-500">{n.time}</span>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center py-10 text-sm">
              No notifications found.
            </div>
          )}
        </div>

        {/* Notification Detail Modal */}
        {selectedNotification && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setSelectedNotification(null)}
          >
            <div
              className="bg-[#1a1a1a] w-[90%] sm:w-[600px] rounded-2xl shadow-lg relative p-6 border border-gray-800 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedNotification(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <FiX size={22} />
              </button>

              <h2 className="text-xl font-semibold mb-2 text-white">
                {selectedNotification.title}
              </h2>

              <p className="text-sm text-gray-500 mb-4">
                {selectedNotification.time}
              </p>

              <div className="border-t border-gray-700 pt-4 text-gray-300 text-sm leading-relaxed">
                {selectedNotification.message}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationPage;
