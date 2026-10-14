// import { useState, useEffect } from "react";
// import { notificationsAPI } from "../utils/api.js";

// export default function NotificationsPage() {
//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchNotifications = async () => {
//       try {
//         setLoading(true);
//         const response = await notificationsAPI.getAll("true"); // Only fetch active notifications
//         if (response.success && response.data) {
//           setNotifications(response.data.notifications || []);
//         }
//       } catch (error) {
//         console.error("Failed to fetch notifications:", error);
//         setNotifications([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchNotifications();
//   }, []);

//   const formatDate = (dateString) => {
//     if (!dateString) return "";
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-IN", {
//       day: "2-digit",
//       month: "long",
//       year: "numeric",
//     });
//   };

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: "#f5f5f5",
//         padding: "32px 20px",
//         fontFamily: "'Segoe UI', 'Noto Sans', sans-serif",
//       }}
//     >
//       <div style={{ maxWidth: 1000, margin: "0 auto" }}>
//         <h1
//           style={{
//             fontSize: 28,
//             fontWeight: 700,
//             color: "#3F6212",
//             marginBottom: 24,
//             textAlign: "center",
//           }}
//         >
//           Notifications
//         </h1>

//         {loading ? (
//           <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
//             Loading notifications...
//           </div>
//         ) : notifications.length === 0 ? (
//           <div
//             style={{
//               textAlign: "center",
//               padding: "60px 20px",
//               background: "#fff",
//               borderRadius: 8,
//               boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//             }}
//           >
//             <p style={{ fontSize: 16, color: "#666" }}>No notifications available at the moment.</p>
//           </div>
//         ) : (
//           <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//             {notifications.map((notification) => (
//               <div
//                 key={notification._id}
//                 style={{
//                   background: "#fff",
//                   borderRadius: 8,
//                   padding: "20px",
//                   boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//                   borderLeft: "4px solid #3AB000",
//                 }}
//               >
//                 <h3
//                   style={{
//                     fontSize: 18,
//                     fontWeight: 700,
//                     color: "#3F6212",
//                     marginBottom: 8,
//                   }}
//                 >
//                   {notification.title}
//                 </h3>
//                 {notification.url && (
//                   <div style={{ marginBottom: 8 }}>
//                     <a
//                       href={notification.url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       style={{
//                         fontSize: 14,
//                         color: "#1e40af",
//                         textDecoration: "underline",
//                         display: "inline-flex",
//                         alignItems: "center",
//                         gap: 6,
//                       }}
//                     >
//                       🔗 {notification.url}
//                     </a>
//                   </div>
//                 )}
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 12,
//                     marginTop: 12,
//                     paddingTop: 12,
//                     borderTop: "1px solid #eee",
//                   }}
//                 >
//                   {notification.notificationDate && (
//                     <span
//                       style={{
//                         fontSize: 13,
//                         color: "#666",
//                         display: "flex",
//                         alignItems: "center",
//                         gap: 6,
//                       }}
//                     >
//                       📅 {formatDate(notification.notificationDate)}
//                     </span>
//                   )}
//                   {notification.notificationTime && (
//                     <span
//                       style={{
//                         fontSize: 13,
//                         color: "#666",
//                         display: "flex",
//                         alignItems: "center",
//                         gap: 6,
//                       }}
//                     >
//                       🕐 {notification.notificationTime}
//                     </span>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
import { useState, useEffect } from "react";
import { notificationsAPI } from "../utils/api.js";

const GREEN = "#4D7C0F";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  const dedupe = (items) => {
    const arr = Array.isArray(items) ? items : [];
    const seen = new Set();
    const out = [];
    for (const n of arr) {
      const key =
        n?._id ||
        `${n?.title || ""}__${n?.notificationDate || ""}__${n?.notificationTime || ""}__${n?.url || ""}`;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(n);
    }
    return out;
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        // Fetch ALL notifications (active + inactive)
        const response = await notificationsAPI.getAll();
        if (response.success && response.data) {
          setNotifications(dedupe(response.data.notifications || []));
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const isNew = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  };

  return (
    <div
      style={{
        minHeight: "68vh",
        background: "#f3f6fb",
        fontFamily: "'Segoe UI', sans-serif",
      }}
      className="notif-wrap"
    >
      <div style={{ width: "92%", maxWidth: 1400, margin: "0 auto" }}>
        <h1 className="notif-heading">Notifications / सूचनाएं</h1>
        <div className="notif-card">

        {loading ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#666",
              fontSize: 15,
            }}
          >
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#666",
              fontSize: 15,
            }}
          >
            No notifications available at the moment.
          </div>
        ) : (
          (expanded ? notifications : notifications.slice(0, 3)).map((n) => (
            <div key={n._id}>
              <div
                className="notif-item"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f8fafc")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <span
                  style={{
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: 2,
                    color: "#3F6212",
                  }}
                >
                  &gt;&gt;
                </span>
                <span style={{ lineHeight: 1.7, color: "#3F6212" }}>
                  {n.url ? (
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#3F6212",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.textDecoration = "underline")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.textDecoration = "none")
                      }
                    >
                      {n.title}
                    </a>
                  ) : (
                    <span>{n.title}</span>
                  )}
                  {isNew(n.notificationDate) && (
                    <span
                      style={{
                        display: "inline-block",
                        background: "#C9302C",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 900,
                        padding: "1px 6px",
                        borderRadius: 3,
                        marginLeft: 6,
                        verticalAlign: "middle",
                        letterSpacing: "0.05em",
                      }}
                    >
                      NEW
                    </span>
                  )}
                  {(n.notificationDate || n.notificationTime) && (
                    <span
                      style={{
                        marginLeft: 10,
                        fontSize: 12,
                        color: "#888",
                        fontWeight: 400,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {n.notificationDate &&
                        new Date(n.notificationDate).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      {n.notificationDate && n.notificationTime && " · "}
                      {n.notificationTime}
                    </span>
                  )}
                </span>
              </div>
              <div
                style={{ borderBottom: "1px dashed #aaa", margin: "0 8px" }}
              />
            </div>
          ))
        )}
        </div>
        {!loading && notifications.length > 3 && (
          <div style={{ textAlign: "center", marginTop: 18 }}>
            <button type="button" className="notif-more" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "View Less" : "View More"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .notif-wrap { padding: 44px 0 72px; }
        .notif-heading { color: #3F6212; font-size: 30px; font-weight: 800; margin: 0 0 22px; }
        .notif-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,.04); overflow: hidden; }
        .notif-item a, .notif-item span { color: #1f2937 !important; }
        .notif-item a { font-weight: 600 !important; }
        .notif-item span[style*="D9534F"] { color: #fff !important; }
        .notif-item a:hover { color: #4D7C0F !important; }
        .notif-card div[style*="dashed"] { border-bottom: 1px solid #f1f5f9 !important; margin: 0 !important; }
        .notif-more { border: 1px solid #4D7C0F; border-radius: 5px; background: #fff; color: #4D7C0F; padding: 10px 22px; font-family: 'Segoe UI', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; }
        .notif-more:hover { background: #4D7C0F; color: #fff; }
        .notif-item {
          padding: 14px 20px;
          font-size: 15px;
          cursor: default;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          transition: background 0.15s;
        }
        @media (max-width: 768px) {
          .notif-wrap { padding: 28px 0 48px !important; }
          .notif-heading { font-size: 24px; }
          .notif-item { padding: 10px 8px; font-size: 11px; gap: 5px; }
          .notif-item span { font-size: 11px; }
        }
      `}</style>
    </div>
  );
}
