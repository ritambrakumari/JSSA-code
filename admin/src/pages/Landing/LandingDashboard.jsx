// import { useState, useEffect, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import myGovLogo from "../assets/jss1.png";
// import unicefLogo from "../assets/jss2.png";
// import nitiAayogLogo from "../assets/jss3.jpeg";
// import msmeLogo from "../assets/jss4.png";
// import logo from "../assets/img0.png";
// import swachhBharat from "../assets/Swachh.png";
// import appImg1 from "../assets/img2b.png";
// import appImg2 from "../assets/img1.png";
// import appImg3 from "../assets/img3a.png";
// import logo1 from "../assets/jss.png";
// import cert1 from "../assets/cer1.jpeg";
// import cert2 from "../assets/cer4.jpeg";
// import cert3 from "../assets/cer5.jpeg";
// import cert4 from "../assets/cer4.jpeg";
// import cert5 from "../assets/cer5.jpeg";
// import cert6 from "../assets/cer6.jpeg";
// import cert7 from "../assets/cer7.jpeg";
// import cert8 from "../assets/cer8.jpeg";
// import cert9 from "../assets/cer9.jpeg";
// import cert10 from "../assets/cer10.jpeg";
// import cert11 from "../assets/cer1.jpeg";
// import cert12 from "../assets/cer7.jpeg";
// import cert13 from "../assets/cer9.jpeg";
// import cert14 from "../assets/cer1.jpeg";
// import cert15 from "../assets/cer10.jpeg";
// import cardImg1 from "../assets/jss.jpeg";
// import AboutPage from "../pages/Aboutpage";
// import MembershipPage from "../pages/Membershippage";
// import ServicesPage from "../pages/Servicespage";
// import JobsPage from "../pages/Jobspage";
// import NotificationsPage from "../pages/Notificationspage";
// import GalleryPage from "../pages/Gallerypage";
// import VerificationPage from "../pages/Verificationpage";
// import ContactsPage from "../pages/Contactspage";
// import { jobPostingsAPI, scrollerAPI, notificationsAPI } from "../utils/api.js";
// import brochurePDF from "../assets/broucher.pdf";

// const GREEN = "#4D7C0F";
// const BLUE_TEXT = "#4D7C0F";

// const fallbackSlides = [
//   "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1100&q=80",
//   "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1100&q=80",
//   "https://images.unsplash.com/photo-1593491205049-7f032d28cf01?w=1100&q=80",
//   "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1100&q=80",
// ];

// const PATH_TO_PAGE = {
//   "/": "home",
//   "/about": "about",
//   "/membership": "membership",
//   "/services": "services",
//   "/jobs": "jobs",
//   "/notifications": "notifications",
//   "/gallery": "gallery",
//   "/verification": "verification",
//   "/contacts": "contacts",
// };

// const PAGE_TO_PATH = {
//   home: "/",
//   about: "/about",
//   membership: "/membership",
//   services: "/services",
//   jobs: "/jobs",
//   notifications: "/notifications",
//   gallery: "/gallery",
//   verification: "/verification",
//   contacts: "/contacts",
// };

// const navLinks = [
//   { label: "HOME", page: "home" },
//   { label: "ABOUT US", page: "about" },
//   { label: "MEMBERSHIPS & BENIFITS", page: "membership" },
//   { label: "SERVICES", page: "services" },
//   { label: "JOBS & CARRIERS", page: "jobs" },
//   { label: "NOTIFICATIONS", page: "notifications" },
//   { label: "GALLERY", page: "gallery" },
//   { label: "VERIFICATION", page: "verification" },
//   { label: "CONTACTS", page: "contacts" },
// ];

// /* ─── Animated Counter ─── */
// function CounterNumber({ target, duration = 2000 }) {
//   const [count, setCount] = useState(0);
//   const ref = useRef(null);
//   const started = useRef(false);
//   useEffect(() => {
//     started.current = false;
//     setCount(0);
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting && !started.current) {
//           started.current = true;
//           const startTime = performance.now();
//           const end = parseInt(target.replace(/\D/g, ""), 10) || 0;
//           const step = (now) => {
//             const elapsed = now - startTime;
//             const progress = Math.min(elapsed / duration, 1);
//             const eased = 1 - Math.pow(1 - progress, 3);
//             setCount(Math.floor(eased * end));
//             if (progress < 1) requestAnimationFrame(step);
//             else setCount(end);
//           };
//           requestAnimationFrame(step);
//         }
//       },
//       { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
//     );
//     if (ref.current) observer.observe(ref.current);
//     return () => {
//       if (ref.current) observer.unobserve(ref.current);
//       observer.disconnect();
//     };
//   }, [target, duration]);
//   return <span ref={ref}>{count.toLocaleString("en-IN")}</span>;
// }

// /* ─── Unified MarqueeBand ─── */
// function MarqueeBand({ labelLine1, labelLine2, items = [], animId }) {
//   const ROWS = 3;
//   const rows = Array.from({ length: ROWS }, (_, i) =>
//     items && items.length > i ? items[i] : null,
//   );
//   const getText = (item) =>
//     (item && typeof item === "object" ? item.english : item) || "";
//   const getLink = (item) =>
//     item && typeof item === "object" ? item.link || "#" : "#";
//   const getIsNew = (item) => !!(item && typeof item === "object" && item.isNew);
//   const rowHeightD = 58;
//   const rowHeightM = 46;
//   return (
//     <>
//       <style>{`
//         ${rows
//           .map(
//             (_, i) => `
//           @keyframes mq-${animId}-${i}     { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
//           @keyframes mq-${animId}-mob-${i} { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
//           .mq-${animId}-${i}     { animation: mq-${animId}-${i}     20s linear infinite; will-change:transform; }
//           .mq-${animId}-mob-${i} { animation: mq-${animId}-mob-${i} 20s linear infinite; will-change:transform; }
//           .mq-${animId}-${i}:hover,
//           .mq-${animId}-mob-${i}:hover { animation-play-state: paused; }
//         `,
//           )
//           .join("")}
//         .mband-desk-${animId} { display: flex; }
//         .mband-mob-${animId}  { display: none; }
//         @media (max-width: 768px) {
//           .mband-desk-${animId} { display: none !important; }
//           .mband-mob-${animId}  { display: block !important; }
//         }
//       `}</style>

//       {/* Desktop */}
//       <div
//         className={`mband-desk-${animId}`}
//         style={{
//           background: "#f2f2f2",
//           borderTop: "1px solid #ddd",
//           borderBottom: "1px solid #ddd",
//           minHeight: rowHeightD * ROWS,
//         }}
//       >
//         <div
//           style={{
//             maxWidth: 960,
//             margin: "0 auto",
//             display: "flex",
//             alignItems: "stretch",
//             height: "100%",
//             minHeight: rowHeightD * ROWS,
//           }}
//         >
//           <div
//             style={{
//               width: 200,
//               flexShrink: 0,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "flex-start",
//               padding: "0 32px 0 0",
//               background: "#f2f2f2",
//             }}
//           >
//             <span
//               style={{
//                 fontWeight: 900,
//                 fontSize: 20,
//                 color: "#2d3748",
//                 lineHeight: 1.35,
//                 letterSpacing: "0.01em",
//               }}
//             >
//               {labelLine1}
//               <br />
//               {labelLine2}
//             </span>
//           </div>
//           <div
//             style={{
//               width: 0,
//               flexShrink: 0,
//               borderLeft: "2px dashed #b8b8b8",
//               margin: "18px 0",
//             }}
//           />
//           <div style={{ flex: 1, overflow: "hidden" }}>
//             {rows.map((item, i) => (
//               <div
//                 key={i}
//                 style={{
//                   height: rowHeightD,
//                   background: "#f2f2f2",
//                   overflow: "hidden",
//                   display: "flex",
//                   alignItems: "center",
//                 }}
//               >
//                 {item ? (
//                   <div
//                     className={`mq-${animId}-${i}`}
//                     style={{
//                       whiteSpace: "nowrap",
//                       display: "inline-block",
//                       paddingLeft: 40,
//                     }}
//                   >
//                     {[0, 1].map((copy) => (
//                       <a
//                         key={copy}
//                         href={getLink(item)}
//                         style={{
//                           display: "inline-block",
//                           color: "#4D7C0F",
//                           fontWeight: 600,
//                           fontSize: 15,
//                           textDecoration: "underline",
//                           textUnderlineOffset: 3,
//                           whiteSpace: "nowrap",
//                           paddingRight: 120,
//                         }}
//                       >
//                         {getText(item)}
//                         {getIsNew(item) && (
//                           <span
//                             style={{
//                               marginLeft: 6,
//                               background: "#e53e3e",
//                               color: "#fff",
//                               fontSize: 12,
//                               fontWeight: 900,
//                               padding: "1px 5px",
//                               borderRadius: 3,
//                               verticalAlign: "middle",
//                             }}
//                           >
//                             NEW
//                           </span>
//                         )}
//                       </a>
//                     ))}
//                   </div>
//                 ) : (
//                   <span
//                     style={{ paddingLeft: 40, color: "#ccc", fontSize: 14 }}
//                   >
//                     —
//                   </span>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Mobile */}
//       <div
//         className={`mband-mob-${animId}`}
//         style={{
//           background: "#f2f2f2",
//           borderTop: "1px solid #ddd",
//           borderBottom: "1px solid #ddd",
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             alignItems: "stretch",
//             minHeight: rowHeightM * ROWS,
//           }}
//         >
//           <div
//             style={{
//               flexShrink: 0,
//               width: 72,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "flex-start",
//               padding: "0 8px 0 10px",
//               background: "#f2f2f2",
//             }}
//           >
//             <span
//               style={{
//                 fontWeight: 900,
//                 fontSize: 9,
//                 color: "#2d3748",
//                 lineHeight: 1.35,
//                 letterSpacing: "0.02em",
//               }}
//             >
//               {labelLine1}
//               <br />
//               {labelLine2}
//             </span>
//           </div>
//           <div
//             style={{
//               width: 0,
//               flexShrink: 0,
//               borderLeft: "2px dashed #b8b8b8",
//               margin: "10px 0",
//             }}
//           />
//           <div style={{ flex: 1, overflow: "hidden" }}>
//             {rows.map((item, i) => (
//               <div
//                 key={i}
//                 style={{
//                   height: rowHeightM,
//                   background: "#f2f2f2",
//                   overflow: "hidden",
//                   display: "flex",
//                   alignItems: "center",
//                 }}
//               >
//                 {item ? (
//                   <div
//                     className={`mq-${animId}-mob-${i}`}
//                     style={{
//                       whiteSpace: "nowrap",
//                       display: "inline-block",
//                       paddingLeft: 10,
//                     }}
//                   >
//                     {[0, 1].map((copy) => (
//                       <a
//                         key={copy}
//                         href={getLink(item)}
//                         style={{
//                           display: "inline-block",
//                           color: "#4D7C0F",
//                           fontWeight: 600,
//                           fontSize: 10,
//                           textDecoration: "underline",
//                           textUnderlineOffset: 2,
//                           whiteSpace: "nowrap",
//                           paddingRight: 60,
//                         }}
//                       >
//                         {getText(item)}
//                         {getIsNew(item) && (
//                           <span
//                             style={{
//                               marginLeft: 4,
//                               background: "#e53e3e",
//                               color: "#fff",
//                               fontSize: 8,
//                               fontWeight: 900,
//                               padding: "1px 3px",
//                               borderRadius: 2,
//                               verticalAlign: "middle",
//                             }}
//                           >
//                             NEW
//                           </span>
//                         )}
//                       </a>
//                     ))}
//                   </div>
//                 ) : (
//                   <span
//                     style={{ paddingLeft: 10, color: "#ccc", fontSize: 10 }}
//                   >
//                     —
//                   </span>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// function VacanciesBand({ items = [] }) {
//   return (
//     <MarqueeBand
//       labelLine1="LATEST"
//       labelLine2="VACANCIES"
//       items={items}
//       animId="vac"
//     />
//   );
// }
// function ResultsBand({ items = [] }) {
//   const displayItems =
//     items.length === 0
//       ? [{ english: "Coming Soon", hindi: "जल्द ही आ रहा है", link: "#" }]
//       : items;

//   return (
//     <MarqueeBand
//       labelLine1="Latest"
//       labelLine2="Results"
//       items={displayItems}
//       animId="res"
//     />
//   );
// }

// /* ─── Vertical Notification Ticker ─── */
// function NotificationTicker({
//   notifications = [],
//   onSeeMore,
//   isMobile = false,
// }) {
//   const tickerRef = useRef(null);
//   const innerRef = useRef(null);
//   const animRef = useRef(null);
//   const posRef = useRef(0);

//   useEffect(() => {
//     const ticker = tickerRef.current;
//     const inner = innerRef.current;
//     if (!ticker || !inner || notifications.length === 0) return;

//     posRef.current = 0;
//     inner.style.transform = "translateY(0px)";

//     const SPEED = isMobile ? 0.4 : 0.5;

//     const tick = () => {
//       posRef.current += SPEED;
//       const halfH = inner.scrollHeight / 2;
//       if (halfH > 0 && posRef.current >= halfH) posRef.current = 0;
//       inner.style.transform = `translateY(-${posRef.current}px)`;
//       animRef.current = requestAnimationFrame(tick);
//     };

//     animRef.current = requestAnimationFrame(tick);

//     const pause = () => cancelAnimationFrame(animRef.current);
//     const resume = () => {
//       animRef.current = requestAnimationFrame(tick);
//     };
//     ticker.addEventListener("mouseenter", pause);
//     ticker.addEventListener("mouseleave", resume);

//     return () => {
//       cancelAnimationFrame(animRef.current);
//       ticker.removeEventListener("mouseenter", pause);
//       ticker.removeEventListener("mouseleave", resume);
//     };
//   }, [notifications, isMobile]);

//   const fs = isMobile ? 11 : 13;
//   const subFs = isMobile ? 10 : 12;
//   const pad = isMobile ? "9px 11px" : "11px 14px";
//   const gap = isMobile ? 0 : 0;
//   const height = isMobile ? 220 : 340;

//   /* ── UPDATED: >> prefix, white text, dotted bottom border ── */
//   const cards = notifications.slice(0, 8).map((n, i) => (
//     <a
//       key={i}
//       href={n.url || "#"}
//       target={n.url ? "_blank" : undefined}
//       rel={n.url ? "noopener noreferrer" : undefined}
//       style={{
//         display: "block",
//         color: "#000",
//         fontWeight: 700,
//         fontSize: fs,
//         padding: pad,
//         lineHeight: 1.7,
//         textDecoration: "underline",
//         textUnderlineOffset: 2,
//         borderBottom: "1px dotted rgba(0,0,0,0.2)",
//         marginBottom: gap,
//         flexShrink: 0,
//       }}
//     >
//       {">>"} {n.title}{" "}
//       <span
//         style={{
//           display: "inline-block",
//           fontSize: isMobile ? 7 : 9,
//           fontWeight: 900,
//           padding: "1px 4px",
//           borderRadius: 2,
//           verticalAlign: "middle",
//           animation: "newBadge 1.5s infinite",
//           color: "#fff",
//           letterSpacing: "0.04em",
//         }}
//       >
//         NEW
//       </span>
//     </a>
//   ));

//   return (
//     /* ── UPDATED: borderRadius 4 (rounded-sm) ── */
//     <div
//       style={{
//         flex: 1,
//         borderRadius: 4,
//         padding: isMobile ? 10 : 20,
//         background: GREEN,
//         display: "flex",
//         flexDirection: "column",
//       }}
//     >
//       <h2
//         style={{
//           color: "#fff",
//           fontWeight: 900,
//           fontSize: isMobile ? 12 : 22,
//           marginBottom: isMobile ? 8 : 14,
//           flexShrink: 0,
//         }}
//       >
//         Notification
//       </h2>

//       {notifications.length === 0 ? (
//         <div
//           style={{
//             color: "rgba(255,255,255,0.8)",
//             fontSize: isMobile ? 10 : 13,
//             padding: isMobile ? "6px 8px" : "10px 12px",
//             textAlign: "center",
//           }}
//         >
//           No notifications available
//         </div>
//       ) : (
//         <div
//           ref={tickerRef}
//           style={{
//             height: height,
//             overflow: "hidden",
//             flex: 1,
//             cursor: "pointer",
//           }}
//         >
//           <div ref={innerRef} style={{ willChange: "transform" }}>
//             {cards}
//             {cards}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// /* ─── Desktop JSS Card ─── */
// function JSSCard({ variant = "id" }) {
//   const isId = variant === "id";
//   return (
//     <div
//       style={{
//         borderRadius: 4,
//         overflow: "hidden",
//         boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
//         background: "#fff",
//         display: "flex",
//         flexDirection: "column",
//         border: "1px solid #ddd",
//         minHeight: 400,
//         flex: 1,
//       }}
//     >
//       <div
//         style={{
//           background: "#1a7c00",
//           padding: "12px 10px 10px",
//           textAlign: "center",
//         }}
//       >
//         <div
//           style={{ display: "flex", justifyContent: "center", marginBottom: 5 }}
//         >
//           <img
//             src={logo}
//             alt="Logo"
//             style={{ height: 44, width: "auto", objectFit: "contain" }}
//           />
//         </div>
//         <div
//           style={{
//             fontWeight: 900,
//             color: "#fff",
//             fontSize: 11,
//             letterSpacing: "0.04em",
//             lineHeight: 1.5,
//           }}
//         >
//           JAN SWASTHYA SAHAYTA CARD
//         </div>
//         <div
//           style={{
//             fontSize: 9,
//             color: "#c8f0b8",
//             fontWeight: 600,
//             lineHeight: 1.35,
//           }}
//         >
//           A Project Of Healthcare Research &amp; Development Board
//         </div>
//         <div
//           style={{
//             fontSize: 8,
//             color: "#a8e090",
//             fontStyle: "italic",
//             lineHeight: 1.3,
//             marginTop: 1,
//           }}
//         >
//           (HRDB is Division of social welfare organization "NAC India")
//         </div>
//         {!isId && (
//           <div
//             style={{
//               marginTop: 5,
//               background: "rgba(255,255,255,0.18)",
//               borderRadius: 3,
//               padding: "2px 6px",
//               display: "inline-block",
//             }}
//           >
//             <span
//               style={{
//                 fontWeight: 900,
//                 color: "#fff",
//                 fontSize: 9,
//                 letterSpacing: "0.04em",
//               }}
//             >
//               MEMBERSHIP'S BENIFITS / सदस्यता का सुविधा
//             </span>
//           </div>
//         )}
//       </div>
//       {isId ? (
//         <>
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "center",
//               padding: "10px 0 5px",
//               background: "#fff",
//             }}
//           >
//             <div
//               style={{
//                 border: "2px solid " + GREEN,
//                 borderRadius: 4,
//                 overflow: "hidden",
//                 width: 68,
//                 height: 84,
//               }}
//             >
//               <img
//                 src="https://randomuser.me/api/portraits/men/32.jpg"
//                 alt="member"
//                 style={{ width: "100%", height: "100%", objectFit: "cover" }}
//               />
//             </div>
//           </div>
//           <div style={{ padding: "8px 14px 6px", flex: 1 }}>
//             {[
//               ["NAME", "Rahul Rajwanshi"],
//               ["S/O", "Shri Chandrakant Kumar"],
//               ["DOB", "15/07/1947"],
//               ["GENDER", "MALE"],
//               ["CARD NO.", "JSSA/43/01"],
//             ].map(([k, v]) => (
//               <div
//                 key={k}
//                 style={{
//                   display: "flex",
//                   fontSize: 10,
//                   color: "#111",
//                   lineHeight: 2.2,
//                   borderBottom: "1px dotted #e5e7eb",
//                 }}
//               >
//                 <span
//                   style={{ fontWeight: 700, minWidth: 56, color: "#374151" }}
//                 >
//                   {k}
//                 </span>
//                 <span style={{ color: "#555" }}>: {v}</span>
//               </div>
//             ))}
//           </div>
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "center",
//               padding: "6px 0 8px",
//               background: "#fff",
//             }}
//           >
//             <div
//               style={{
//                 width: 48,
//                 height: 48,
//                 border: "1px solid #ccc",
//                 borderRadius: 3,
//                 background: "#f5f5f5",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
//                 {[
//                   0, 1, 2, 4, 5, 6, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 25,
//                   26, 28, 29, 30, 32, 33, 34,
//                 ].map((n, ii) => (
//                   <rect
//                     key={ii}
//                     x={(n % 6) * 6}
//                     y={Math.floor(n / 6) * 6}
//                     width={5}
//                     height={5}
//                     fill="#222"
//                   />
//                 ))}
//               </svg>
//             </div>
//           </div>
//         </>
//       ) : (
//         <div style={{ padding: "12px 14px", flex: 1 }}>
//           <p
//             style={{
//               fontSize: 11,
//               color: "#222",
//               lineHeight: 1.85,
//               margin: "0 0 10px",
//             }}
//           >
//             <strong>Benefits:</strong> Jan Swasthya sahayata card is provided by
//             the organization to each member. Through this card, you will get
//             better treatment by special doctor, medicines and medical
//             examination in health camps.
//           </p>
//           <div
//             style={{
//               width: "100%",
//               height: 1,
//               background: "#e5e7eb",
//               margin: "8px 0",
//             }}
//           />
//           <p
//             style={{ fontSize: 10, color: "#555", lineHeight: 1.8, margin: 0 }}
//           >
//             <strong>सुविधा:</strong> जन स्वास्थ्य सहायता अभियान के अंतर्गत जुड़े
//             प्रत्येक सदस्य को संस्था द्वारा एक जन स्वास्थ्य सहायता कार्ड प्रदान
//             किया जाता है।
//           </p>
//         </div>
//       )}
//       <div
//         style={{
//           position: "relative",
//           height: 30,
//           overflow: "hidden",
//           flexShrink: 0,
//         }}
//       >
//         <svg
//           viewBox="0 0 200 26"
//           preserveAspectRatio="none"
//           style={{
//             position: "absolute",
//             inset: 0,
//             width: "100%",
//             height: "100%",
//           }}
//         >
//           <polygon points="0,0 70,0 42,26 0,26" fill="#FF9933" />
//           <polygon points="55,0 130,0 102,26 27,26" fill="#fff" />
//           <polygon points="115,0 188,0 160,26 87,26" fill="#3AB000" />
//           <polygon points="173,0 200,0 200,26 145,26" fill="#FF9933" />
//         </svg>
//         <div
//           style={{
//             position: "absolute",
//             inset: 0,
//             background: "rgba(220,100,0,0.80)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//         >
//           <span
//             style={{
//               fontSize: 8,
//               color: "#fff",
//               fontWeight: 700,
//               textAlign: "center",
//             }}
//           >
//             website: www.jssabhiyan-nac.in &nbsp;|&nbsp; Email:
//             support@jssabhiyan.com
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ─── Mobile JSS Card ─── */
// function MobileJSSCard({ variant = "id" }) {
//   const isId = variant === "id";
//   return (
//     <div
//       style={{
//         border: "2px solid #4ade80",
//         borderRadius: 4,
//         padding: 10,
//         background: "#fff",
//       }}
//     >
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: 6,
//           marginBottom: isId ? 8 : 6,
//         }}
//       >
//         <img
//           src={logo}
//           alt="Logo"
//           style={{
//             width: 60,
//             height: "auto",
//             objectFit: "contain",
//             flexShrink: 0,
//           }}
//         />
//         <div>
//           <div style={{ fontWeight: 900, color: "#15803d", fontSize: 9 }}>
//             JAN SWASTHYA SAHAYTA CARD
//           </div>
//           {isId ? (
//             <div style={{ fontSize: 8, color: "#666" }}>
//               A Project Of Healthcare Research &amp; Development Board
//             </div>
//           ) : (
//             <div
//               style={{
//                 fontWeight: 700,
//                 fontSize: 8,
//                 color: "#333",
//                 marginTop: 2,
//               }}
//             >
//               MEMBERSHIP'S BENIFITS / सदस्यता का सुविधा
//             </div>
//           )}
//         </div>
//       </div>
//       {isId ? (
//         <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
//           <img
//             src="https://randomuser.me/api/portraits/men/32.jpg"
//             alt="member"
//             style={{
//               width: 36,
//               height: 44,
//               objectFit: "cover",
//               border: "1px solid #ddd",
//               borderRadius: 2,
//               flexShrink: 0,
//             }}
//           />
//           <div style={{ fontSize: 9, color: "#333", lineHeight: 1.8 }}>
//             <div>
//               <strong>NAME</strong>: Rahul Rajwanshi
//             </div>
//             <div>
//               <strong>S/O</strong>: Shri Chandrakant Kumar
//             </div>
//             <div>
//               <strong>DOB</strong>: 15/07/1947
//             </div>
//             <div>
//               <strong>GENDER</strong>: MALE
//             </div>
//             <div>
//               <strong>CARD NO.</strong>: JSSA/43/01
//             </div>
//           </div>
//           <div
//             style={{
//               marginLeft: "auto",
//               width: 28,
//               height: 28,
//               background: "#e5e7eb",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               fontSize: 8,
//               color: "#888",
//               border: "1px solid #ccc",
//               flexShrink: 0,
//             }}
//           >
//             QR
//           </div>
//         </div>
//       ) : (
//         <p style={{ fontSize: 9, color: "#555", lineHeight: 1.6, margin: 0 }}>
//           Benefits: Jan Swasthya sahayata card is provided to each member.
//           Through this card, you will get better treatment by special doctor,
//           medicines and medical examination in health camps.
//         </p>
//       )}
//       <div
//         style={{
//           background: GREEN,
//           color: "#fff",
//           fontSize: 8,
//           textAlign: "center",
//           padding: "4px 0",
//           marginTop: 6,
//           borderRadius: 3,
//         }}
//       >
//         website: www.jssabhiyan-nac.in | Email: support@jssabhiyan.com
//       </div>
//     </div>
//   );
// }

// /* ─── Cert Slider ─── */
// function CertSlider() {
//   const [current, setCurrent] = useState(0);
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

//   useEffect(() => {
//     const onResize = () => {
//       setIsMobile(window.innerWidth <= 768);
//       setCurrent(0);
//     };
//     window.addEventListener("resize", onResize);
//     return () => window.removeEventListener("resize", onResize);
//   }, []);

//   const certImages = [
//     { src: cert1, alt: "Certificate 1" },
//     { src: cert2, alt: "Certificate 2" },
//     { src: cert3, alt: "Certificate 3" },
//     { src: cert4, alt: "Certificate 4" },
//     { src: cert5, alt: "Certificate 5" },
//     { src: cert6, alt: "Certificate 6" },
//     { src: cert7, alt: "Certificate 7" },
//     { src: cert8, alt: "Certificate 8" },
//     { src: cert9, alt: "Certificate 9" },
//     { src: cert10, alt: "Certificate 10" },
//     { src: cert11, alt: "Certificate 11" },
//     { src: cert12, alt: "Certificate 12" },
//     { src: cert13, alt: "Certificate 13" },
//     { src: cert14, alt: "Certificate 14" },
//     { src: cert15, alt: "Certificate 15" },
//   ];

//   const visibleCount = 4;
//   const cardHeight = isMobile ? 90 : 220;
//   const maxSlide = certImages.length - visibleCount;

//   useEffect(() => {
//     const t = setInterval(() => {
//       setCurrent((c) => (c >= maxSlide ? 0 : c + 1));
//     }, 2500);
//     return () => clearInterval(t);
//   }, [maxSlide]);

//   return (
//     <div
//       style={{
//         maxWidth: 1000,
//         margin: "0 auto 24px",
//         position: "relative",
//         padding: isMobile ? "0 44px" : "0 36px",
//       }}
//     >
//       <div style={{ overflow: "hidden" }}>
//         <div
//           style={{
//             display: "flex",
//             gap: isMobile ? 4 : 12,
//             transform: `translateX(-${current * (100 / visibleCount)}%)`,
//             transition: "transform 0.4s ease",
//           }}
//         >
//           {certImages.map((img, i) => (
//             <img
//               key={i}
//               src={img.src}
//               alt={img.alt}
//               style={{
//                 flexShrink: 0,
//                 width: `calc(${100 / visibleCount}% - 9px)`,
//                 height: cardHeight,
//                 objectFit: "contain",
//                 display: "block",
//               }}
//             />
//           ))}
//         </div>
//       </div>
//       {current > 0 && (
//         <button
//           onClick={() => setCurrent((c) => Math.max(0, c - 1))}
//           style={{
//             position: "absolute",
//             left: 0,
//             top: "50%",
//             transform: "translateY(-50%)",
//             background: "#fff",
//             borderRadius: "50%",
//             border: "2px solid #3AB000",
//             width: isMobile ? 36 : 30,
//             height: isMobile ? 36 : 30,
//             fontSize: isMobile ? 22 : 18,
//             cursor: "pointer",
//             color: "#3AB000",
//             fontWeight: 900,
//           }}
//         >
//           ‹
//         </button>
//       )}
//       {current < maxSlide && (
//         <button
//           onClick={() => setCurrent((c) => Math.min(maxSlide, c + 1))}
//           style={{
//             position: "absolute",
//             right: 0,
//             top: "50%",
//             transform: "translateY(-50%)",
//             background: "#fff",
//             borderRadius: "50%",
//             border: "2px solid #3AB000",
//             width: isMobile ? 36 : 30,
//             height: isMobile ? 36 : 30,
//             fontSize: isMobile ? 22 : 18,
//             cursor: "pointer",
//             color: "#3AB000",
//             fontWeight: 900,
//           }}
//         >
//           ›
//         </button>
//       )}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "center",
//           gap: isMobile ? 4 : 6,
//           marginTop: isMobile ? 8 : 14,
//         }}
//       >
//         {Array.from({ length: maxSlide + 1 }, (_, i) => (
//           <button
//             key={i}
//             onClick={() => setCurrent(i)}
//             style={{
//               width: isMobile ? 6 : 10,
//               height: isMobile ? 6 : 10,
//               borderRadius: "50%",
//               border: "none",
//               cursor: "pointer",
//               background: i === current ? "#3AB000" : "#ccc",
//               padding: 0,
//               transition: "background 0.2s",
//             }}
//           />
//         ))}
//       </div>
//     </div>
//   );
// }

// const PersonIcon = ({ color = "#2e8b00", size = 36 }) => (
//   <svg width={size} height={size} viewBox="0 0 46 46" fill={color}>
//     <circle cx="23" cy="14" r="9" />
//     <ellipse cx="23" cy="36" rx="14" ry="9" />
//   </svg>
// );
// const DoctorIcon = ({ size = 36 }) => (
//   <svg width={size} height={size} viewBox="0 0 46 46" fill="#c0392b">
//     <circle cx="23" cy="11" r="8" />
//     <path d="M9 46 Q9 29 23 29 Q37 29 37 46Z" />
//     <circle
//       cx="31"
//       cy="39"
//       r="4"
//       fill="none"
//       stroke="#c0392b"
//       strokeWidth="2"
//     />
//     <path
//       d="M27 35 Q25 25 21 23"
//       fill="none"
//       stroke="#c0392b"
//       strokeWidth="2"
//     />
//   </svg>
// );
// const YogaIcon = ({ size = 36 }) => (
//   <svg
//     width={size}
//     height={size}
//     viewBox="0 0 46 46"
//     fill="none"
//     stroke="#e67e22"
//     strokeWidth="2.2"
//     strokeLinecap="round"
//   >
//     <circle cx="23" cy="9" r="5" fill="#e67e22" stroke="none" />
//     <line x1="23" y1="14" x2="23" y2="27" />
//     <line x1="23" y1="19" x2="8" y2="25" />
//     <line x1="23" y1="19" x2="38" y2="25" />
//     <line x1="23" y1="27" x2="15" y2="38" />
//     <line x1="23" y1="27" x2="31" y2="38" />
//     <line x1="15" y1="38" x2="25" y2="33" />
//     <line x1="31" y1="38" x2="21" y2="33" />
//   </svg>
// );

// /* ─── Floating Buttons ─── */
// function FloatingButtons() {
//   return (
//     <>
//       <div style={{ position: "fixed", left: 20, bottom: 20, zIndex: 1000 }}>
//         <a
//           href="tel:9471987611"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             width: 60,
//             height: 60,
//             borderRadius: "50%",
//             background: "linear-gradient(135deg, #3AB000 0%, #2d8a00 100%)",
//             color: "#fff",
//             boxShadow: "0 4px 12px rgba(58, 176, 0, 0.4)",
//             textDecoration: "none",
//           }}
//           title="Call Us"
//         >
//           <svg
//             width="28"
//             height="28"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="2.5"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           >
//             <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
//           </svg>
//         </a>
//       </div>
//       <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 1000 }}>
//         <a
//           href="https://wa.me/919471987611"
//           target="_blank"
//           rel="noopener noreferrer"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             width: 60,
//             height: 60,
//             borderRadius: "50%",
//             background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
//             color: "#fff",
//             boxShadow: "0 4px 12px rgba(37, 211, 102, 0.4)",
//             textDecoration: "none",
//           }}
//           title="WhatsApp"
//         >
//           <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
//             <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
//           </svg>
//         </a>
//       </div>
//     </>
//   );
// }

// /* ─── HOME PAGE ─── */
// function HomePage({ onNavigate }) {
//   const [slide, setSlide] = useState(0);
//   const [slides, setSlides] = useState(fallbackSlides);
//   const [scrollerImages, setScrollerImages] = useState([]);
//   const [results, setResults] = useState([]);
//   const [vacancies, setVacancies] = useState([]);
//   const [notifications, setNotifications] = useState([]);
//   const [loadingVacancies, setLoadingVacancies] = useState(true);
//   const [loadingResults, setLoadingResults] = useState(true);

//   useEffect(() => {
//     const fetch_ = async () => {
//       try {
//         const res = await scrollerAPI.getAll(null);
//         if (res?.success && res.data) {
//           const allImages = res.data.scrollerImages || [];
//           const validImages = allImages.filter(
//             (img) => img.imageUrl && img.imageUrl.trim() !== "",
//           );
//           if (validImages.length > 0) {
//             const sortedImages = validImages.sort((a, b) => {
//               if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
//               return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
//             });
//             setSlides(sortedImages.map((i) => i.imageUrl));
//             setScrollerImages(sortedImages);
//             setSlide(0);
//           } else setSlides(fallbackSlides);
//         } else setSlides(fallbackSlides);
//       } catch {
//         setSlides(fallbackSlides);
//       }
//     };
//     fetch_();
//   }, []);

//   useEffect(() => {
//     if (slides.length > 0) {
//       const t = setInterval(
//         () => setSlide((s) => (s + 1) % slides.length),
//         4000,
//       );
//       return () => clearInterval(t);
//     }
//   }, [slides.length]);

//   useEffect(() => {
//     const fetch_ = async () => {
//       try {
//         setLoadingVacancies(true);
//         const r = await jobPostingsAPI.getLatestVacancies();
//         setVacancies(r.success && r.data.vacancies ? r.data.vacancies : []);
//       } catch {
//         setVacancies([]);
//       } finally {
//         setLoadingVacancies(false);
//       }
//     };
//     fetch_();
//     const iv = setInterval(fetch_, 30000);
//     return () => clearInterval(iv);
//   }, []);

//   useEffect(() => {
//     setResults([]);
//     setLoadingResults(false);
//   }, []);

//   useEffect(() => {
//     const fetch_ = async () => {
//       try {
//         const r = await notificationsAPI.getAll("true");
//         setNotifications(r.success && r.data ? r.data.notifications || [] : []);
//       } catch {
//         setNotifications([]);
//       }
//     };
//     fetch_();
//     const iv = setInterval(fetch_, 30000);
//     return () => clearInterval(iv);
//   }, []);

//   const statsData = [
//     {
//       icon: <PersonIcon color="#2e8b00" size={46} />,
//       mobileIcon: <PersonIcon color="#2e8b00" size={28} />,
//       num: "2265",
//       label: "Joined Us",
//     },
//     {
//       icon: <PersonIcon color="#65A30D" size={46} />,
//       mobileIcon: <PersonIcon color="#65A30D" size={28} />,
//       num: "2185",
//       label: "Took Benifits",
//     },
//     {
//       icon: <DoctorIcon size={46} />,
//       mobileIcon: <DoctorIcon size={28} />,
//       num: "2265",
//       label: "Medical Camps",
//     },
//     {
//       icon: <YogaIcon size={46} />,
//       mobileIcon: <YogaIcon size={28} />,
//       num: "2185",
//       label: "Yoga Camps",
//     },
//   ];

//   return (
//     <>
//       {/* Slider + Stats */}
//       <div className="slider-stats-wrap">
//         <div className="slider-area">
//           {slides.length > 0 ? (
//             <>
//               {slides.map((src, i) => {
//                 const si = scrollerImages[i];
//                 const imgEl = (
//                   <img
//                     key={i}
//                     src={src}
//                     alt={si?.title || `slide ${i + 1}`}
//                     style={{
//                       position: "absolute",
//                       inset: 0,
//                       width: "100%",
//                       height: "100%",
//                       objectFit: "cover",
//                       opacity: i === slide ? 1 : 0,
//                       transition: "opacity 0.8s ease",
//                     }}
//                     onError={(e) => (e.target.style.display = "none")}
//                   />
//                 );
//                 if (si?.link)
//                   return (
//                     <a
//                       key={i}
//                       href={si.link}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       style={{
//                         position: "absolute",
//                         inset: 0,
//                         display: i === slide ? "block" : "none",
//                       }}
//                     >
//                       {imgEl}
//                     </a>
//                   );
//                 return (
//                   <div
//                     key={i}
//                     style={{
//                       position: "absolute",
//                       inset: 0,
//                       display: i === slide ? "block" : "none",
//                     }}
//                   >
//                     {imgEl}
//                   </div>
//                 );
//               })}
//               {slides.length > 1 && (
//                 <>
//                   <button
//                     onClick={() =>
//                       setSlide((s) => (s - 1 + slides.length) % slides.length)
//                     }
//                     style={{
//                       position: "absolute",
//                       left: 6,
//                       top: "50%",
//                       transform: "translateY(-50%)",
//                       background: "rgba(255,255,255,0.7)",
//                       border: "none",
//                       borderRadius: "50%",
//                       width: 34,
//                       height: 34,
//                       fontSize: 22,
//                       cursor: "pointer",
//                       zIndex: 10,
//                     }}
//                   >
//                     ‹
//                   </button>
//                   <button
//                     onClick={() => setSlide((s) => (s + 1) % slides.length)}
//                     style={{
//                       position: "absolute",
//                       right: 6,
//                       top: "50%",
//                       transform: "translateY(-50%)",
//                       background: "rgba(255,255,255,0.7)",
//                       border: "none",
//                       borderRadius: "50%",
//                       width: 34,
//                       height: 34,
//                       fontSize: 22,
//                       cursor: "pointer",
//                       zIndex: 10,
//                     }}
//                   >
//                     ›
//                   </button>
//                 </>
//               )}
//             </>
//           ) : (
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 height: "100%",
//                 minHeight: "200px",
//                 background: "#f5f5f5",
//                 color: "#666",
//                 fontSize: "14px",
//               }}
//             >
//               Loading...
//             </div>
//           )}
//           <div
//             style={{
//               position: "absolute",
//               bottom: 6,
//               left: "50%",
//               transform: "translateX(-50%)",
//               display: "flex",
//               gap: 6,
//             }}
//           >
//             {slides.map((_, i) => (
//               <button
//                 key={i}
//                 onClick={() => setSlide(i)}
//                 style={{
//                   width: 8,
//                   height: 8,
//                   borderRadius: "50%",
//                   border: "none",
//                   cursor: "pointer",
//                   background: i === slide ? "#fff" : "rgba(255,255,255,0.45)",
//                   padding: 0,
//                 }}
//               />
//             ))}
//           </div>
//         </div>
//         <div className="stats-area">
//           {statsData.map((s, i) => (
//             <div key={i} className="stat-cell">
//               <span
//                 className="stat-num"
//                 style={{ fontWeight: 900, color: "#1a1a1a" }}
//               >
//                 <CounterNumber target={s.num} />
//               </span>
//               <span className="stat-icon-desktop">{s.icon}</span>
//               <span className="stat-icon-mobile">{s.mobileIcon}</span>
//               <span
//                 className="stat-label"
//                 style={{
//                   color: "#666",
//                   fontWeight: 600,
//                   textAlign: "center",
//                   lineHeight: 1.2,
//                 }}
//               >
//                 {s.label}
//               </span>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Vacancies Band */}
//       <VacanciesBand items={vacancies} />

//       {/* Notice + App Images */}
//       <div
//         className="notice-app-wrap"
//         style={{ background: "#fce8f0", padding: "36px 0 0" }}
//       >
//         <div
//           className="notice-app-inner"
//           style={{ maxWidth: 960, margin: "0 auto", padding: "0 40px" }}
//         >
//           <p
//             className="body-text"
//             style={{
//               lineHeight: 2,
//               color: "#1a1a1a",
//               marginBottom: 22,
//               textAlign: "justify",
//             }}
//           >
//             <strong>NOTICE/सूचना:</strong> जिन अभ्यर्थियों का नाम जिला प्रबंधक
//             पद विज्ञापन सं: JSSA/REQ/01/2025/P–III तथा ब्लॉक सुपरवाइजर सह पंचायत
//             कार्यपालक विज्ञापन सं: JSSA/REQ/02/2025/P–III तथा पंचायत कार्यपालक
//             विज्ञापन सं: JSSA/REQ/03/2026/P–III के अंतर्गत प्रथम मेधा सूची में
//             जारी किया गया है वे अभ्यर्थी कृपया ऑनलाइन एमओयू और सहमति प्रपत्र
//             अंतिम तिथि 02/03/2026 से पहले भर लें।Candidates whose name has been
//             released in the first merit list under District Manager Advt. No:
//             JSSA/REQ/01/2025/P–III &amp; Block Supervisor Cum Panchayat
//             Executive Advt. No: JSSA/REQ/02/2025/P–III &amp; Panchayat Executive
//             Advt. No: JSSA/REQ/03/2025/P–III those candidates please fill the
//             online MoU and consent form before the last date 02/03/2026. Failure
//             to submit the required documents within the stipulated date may lead
//             to cancellation of candidate.
//           </p>
//           <div
//             className="body-text"
//             style={{
//               background: "#f8b4b4",
//               padding: "13px 20px",
//               borderRadius: 3,
//               fontWeight: 700,
//               color: "#1a1a1a",
//               marginBottom: 24,
//               textAlign: "center",
//             }}
//           >
//             IMPORTANT NOTICE:– जन स्वास्थ्य सहायता अभियान के कार्यक्रमों को
//             जमीनी स्तर पर शुरुवात करने हेतु आवश्यक अधिसूचना।
//           </div>
//           <div
//             className="action-btns-row"
//             style={{ display: "flex", gap: 20, marginBottom: 32 }}
//           >
//             {[
//               "Online Test & Interview",
//               "Online Mou & Consent Form",
//               "Authorized Login",
//             ].map((btn, i) => (
//               <button
//                 key={i}
//                 className="action-btn"
//                 style={{
//                   flex: 1,
//                   background: "#2ecc1a",
//                   color: "#000",
//                   fontWeight: 700,
//                   padding: "18px 6px",
//                   borderRadius: 5,
//                   border: "none",
//                   cursor: "pointer",
//                   lineHeight: 1.3,
//                   fontSize: 15,
//                   boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
//                   whiteSpace: "nowrap",
//                   overflow: "hidden",
//                   textOverflow: "ellipsis",
//                 }}
//               >
//                 {btn}
//               </button>
//             ))}
//           </div>
//           <div
//             className="app-imgs-row"
//             style={{
//               display: "flex",
//               alignItems: "flex-end",
//               justifyContent: "space-between",
//               gap: 16,
//             }}
//           >
//             {[appImg1, appImg2, appImg3].map((src, i) => (
//               <img
//                 key={i}
//                 src={src}
//                 alt={`app${i + 1}`}
//                 className="app-img"
//                 style={{
//                   width: "31%",
//                   height: "auto",
//                   objectFit: "contain",
//                   display: "block",
//                 }}
//               />
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Results Band */}
//       <ResultsBand items={results} />

//       {/* Organization Info */}
//       <div style={{ background: "#e8f5e2", padding: "50px 0" }}>
//         <div
//           style={{
//             maxWidth: 960,
//             margin: "0 auto",
//             padding: "0 40px",
//             textAlign: "center",
//           }}
//         >
//           <p
//             className="body-text"
//             style={{ color: "#333", lineHeight: 1.9, margin: 0 }}
//           >
//             This project is organized Under social welfare orgenization 'NAC"
//             Registration No. : 053083 incorporated under [Pursuant to
//             sub-section (2) of section 7 and sub-section (1) of section 8 of the
//             Companies Act, 2013 (18 of 2013) and rule 18 of the Companies
//             (Incorporation) Rules, 2014].
//           </p>
//         </div>
//       </div>

//       {/* Public Notice */}
//       <div
//         className="public-notice-wrap"
//         style={{
//           padding: "24px 16px",
//           textAlign: "center",
//           background: "#fffde8",
//         }}
//       >
//         <div
//           className="pub-notice-title"
//           style={{
//             display: "inline-block",
//             border: "2px solid #374151",
//             padding: "8px 20px",
//             fontWeight: 900,
//             marginBottom: 16,
//           }}
//         >
//           सार्वजनिक सूचना / PUBLIC NOTICE:
//         </div>
//         <p
//           className="body-text"
//           style={{ margin: "0 auto 12px", lineHeight: 1.9, color: "#555" }}
//         >
//           हमारे संस्था द्वारा सदस्यता शुल्क, जाद आवेदन शुल्क एवं एमओयू और सहमति
//           शुल्क के अलावा कोई अतिरिक्त शुल्क नहीं लिया जाता हैं।
//         </p>
//         <p
//           className="body-text"
//           style={{ margin: "0 auto", lineHeight: 1.9, color: "#555" }}
//         >
//           No extra fee is charged by our organization other than membership fee,
//           job application fee and MOU and consent fee.
//         </p>
//       </div>

//       {/* ── Notifications + Cards — Desktop ── */}
//       <div
//         className="notif-cards-desktop"
//         style={{ background: "#fff", padding: "20px 0" }}
//       >
//         <div
//           style={{
//             maxWidth: 960,
//             margin: "0 auto",
//             padding: "0 20px",
//             display: "flex",
//             gap: 20,
//             alignItems: "stretch",
//           }}
//         >
//           {/* Notification Ticker — rounded-sm (borderRadius: 4) */}
//           <NotificationTicker
//             notifications={notifications}
//             onSeeMore={() => onNavigate("notifications")}
//             isMobile={false}
//           />

//           {/* Card Image — rounded-sm border */}
//           <div
//             style={{
//               flex: 1,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               border: "2px solid #e0e0e0",
//               borderRadius: 4,
//               overflow: "hidden",
//             }}
//           >
//             <img
//               src={cardImg1}
//               alt="JSS Card"
//               style={{
//                 width: "100%",
//                 height: "auto",
//                 display: "block",
//               }}
//             />
//           </div>
//         </div>
//       </div>

//       {/* ── Notifications + Cards — Mobile ── */}
//       <div
//         className="notif-cards-mobile"
//         style={{
//           display: "none",
//           gap: 10,
//           padding: "12px",
//           background: "#fff",
//         }}
//       >
//         {/* Notification Ticker — rounded-sm */}
//         <NotificationTicker
//           notifications={notifications}
//           onSeeMore={() => onNavigate("notifications")}
//           isMobile={true}
//         />

//         {/* Card Image — rounded-sm border */}
//         <div
//           style={{
//             flex: 1,
//             display: "flex",
//             alignItems: "center",
//             border: "2px solid #e0e0e0",
//             borderRadius: 4,
//             overflow: "hidden",
//           }}
//         >
//           <img
//             src={cardImg1}
//             alt="JSS Card"
//             style={{
//               width: "100%",
//               height: "auto",
//               display: "block",
//             }}
//           />
//         </div>
//       </div>

//       {/* Intro Section */}
//       <div
//         className="intro-section"
//         style={{
//           borderTop: `4px solid ${GREEN}`,
//           borderBottom: `4px solid ${GREEN}`,
//           padding: "40px 0",
//           background: "#fff",
//         }}
//       >
//         <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 40px" }}>
//           <div className="intro-inner" style={{ display: "flex", gap: 48 }}>
//             <div style={{ flex: "1 1 0" }}>
//               <h3
//                 className="intro-heading"
//                 style={{
//                   fontWeight: 900,
//                   color: "#1a1a1a",
//                   marginBottom: 14,
//                   fontSize: 15,
//                   letterSpacing: "0.02em",
//                 }}
//               >
//                 JAN SWASTHYA SAHAYATA ABHIYAN
//               </h3>
//               <p
//                 className="body-text"
//                 style={{ lineHeight: 1.9, color: "#333", marginBottom: 20 }}
//               >
//                 <strong>Introduction :</strong> Jan Swasthya Sahayata Abhiyan
//                 has been formed by the Healthcare Research and Development Board
//                 (Division of Social Welfare Organization "NAC".) to provide
//                 affordable, free &amp; better treatment with health related
//                 assistance to poor and needy people.
//               </p>
//               <p
//                 className="body-text"
//                 style={{ lineHeight: 1.9, color: "#333" }}
//               >
//                 <strong>Purpose :</strong> To provide better treatment by
//                 special doctors, medicines and medical tests to the poor and
//                 needy people of the country through Jan Swasthya Sahayata
//                 Abhiyan. Also motivating people to follow the guidelines given
//                 by the government to stay safe from COVID 19 by organizing
//                 awareness programs &amp; providing health related ...{" "}
//                 <button
//                   onClick={() => onNavigate("about")}
//                   style={{
//                     color: BLUE_TEXT,
//                     background: "none",
//                     border: "none",
//                     cursor: "pointer",
//                     padding: 0,
//                     fontSize: "inherit",
//                     fontWeight: 600,
//                   }}
//                 >
//                   read more
//                 </button>
//               </p>
//             </div>
//             <div style={{ flex: "1 1 0" }}>
//               <h3
//                 className="intro-heading"
//                 style={{
//                   fontWeight: 900,
//                   color: "#1a1a1a",
//                   marginBottom: 14,
//                   fontSize: 18,
//                   fontFamily: "serif",
//                 }}
//               >
//                 जन स्वास्थ्य सहायता अभियान
//               </h3>
//               <p
//                 className="body-text"
//                 style={{ lineHeight: 1.9, color: "#333", marginBottom: 20 }}
//               >
//                 <strong>परिचय :</strong> जन स्वास्थ्य सहायता अभियान का गठन
//                 हेल्थकेयर रिसर्च एंड डेवलपमेंट बोर्ड (Division Of Social Welfare
//                 Organization "NAC".) द्वारा सस्ती, निःशुल्क एवं बेहतर इलाज तथा
//                 गरीब एवं जरूरतमंद लोगों को स्वास्थ्य संबंधित सहायता मुहैया
//                 करवाने के लिए किया गया है।
//               </p>
//               <p
//                 className="body-text"
//                 style={{ lineHeight: 1.9, color: "#333" }}
//               >
//                 <strong>उद्देश्य :</strong> जन स्वास्थ्य सहायता अभियान के माध्यम
//                 से देश के गरीब और जरूरतमंद लोगों को चिकिसक, दवाईयां और चिकिसा
//                 जांच द्वारा बेहतर उपचार प्रदान करना, साथ ही जागरूकता कार्यक्रम
//                 आयोजित कर COVID 19 से सुरक्षित रहने के लिए सरकार द्वारा दिए गए
//                 दिशा-निर्देशों का पालन करने हेतु लोगों को प्रेरित करना और स्वस्थ
//                 रहने के लिए योग और व्यायाम प्रशिक्षण के साथ स्वास्थ्य संबंधित
//                 सहायता ...{" "}
//                 <button
//                   onClick={() => onNavigate("about")}
//                   style={{
//                     color: BLUE_TEXT,
//                     background: "none",
//                     border: "none",
//                     cursor: "pointer",
//                     padding: 0,
//                     fontSize: "inherit",
//                     fontWeight: 600,
//                   }}
//                 >
//                   अधिक पढ़ें
//                 </button>
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Certificates */}
//       <div
//         className="cert-section"
//         style={{ padding: "28px 16px", background: "#f8f8f8" }}
//       >
//         <CertSlider />
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(4, 1fr)",
//             gap: 10,
//             maxWidth: 1000,
//             margin: "0 auto",
//           }}
//           className="cert-btn-grid"
//         >
//           {[
//             { label: "Enquiry", page: null },
//             { label: "Broucher", page: null, pdf: brochurePDF },
//             { label: "Membership", page: "membership" },
//             { label: "Services", page: "services" },
//           ].map((btn, i) => (
//             <button
//               key={i}
//               className="cert-btn"
//               onClick={() => {
//                 if (btn.page) onNavigate(btn.page);
//                 else if (btn.pdf) window.open(btn.pdf, "_blank");
//               }}
//               style={{
//                 background: GREEN,
//                 color: "#000",
//                 fontWeight: 900,
//                 padding: "14px 4px",
//                 borderRadius: 4,
//                 border: "none",
//                 cursor: btn.page || btn.pdf ? "pointer" : "default",
//               }}
//             >
//               {btn.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Accreditations */}
//       <div
//         className="accred-section"
//         style={{
//           padding: "32px 16px",
//           textAlign: "center",
//           background: "#fff",
//           borderTop: "1px solid #eee",
//         }}
//       >
//         <p
//           className="accred-label"
//           style={{
//             fontWeight: 700,
//             color: "#aaa",
//             letterSpacing: "0.1em",
//             textTransform: "uppercase",
//             marginBottom: 18,
//           }}
//         >
//           ACCREDITATIONS &amp; FOLLOWS GUIDELINES
//         </p>
//         <div
//           className="accred-logos"
//           style={{
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             gap: 48,
//             flexWrap: "wrap",
//           }}
//         >
//           {[myGovLogo, unicefLogo, nitiAayogLogo, msmeLogo].map((src, i) => (
//             <img
//               key={i}
//               src={src}
//               alt={`accreditation-${i}`}
//               className="accred-logo"
//               style={{ width: "auto", objectFit: "contain" }}
//             />
//           ))}
//         </div>
//       </div>
//     </>
//   );
// }

// /* ══════════════════════════════════════════════════════
//    MAIN EXPORT
//    ══════════════════════════════════════════════════════ */
// export default function JSSAbhiyan() {
//   const routerNavigate = useNavigate();
//   const location = useLocation();
//   const activePage = PATH_TO_PAGE[location.pathname] || "home";

//   const navigate = (page) => {
//     const path = PAGE_TO_PATH[page] || "/";
//     routerNavigate(path);
//     window.scrollTo(0, 0);
//   };

//   const renderPage = () => {
//     switch (activePage) {
//       case "about":
//         return <AboutPage onNavigate={navigate} />;
//       case "membership":
//         return <MembershipPage />;
//       case "services":
//         return <ServicesPage />;
//       case "jobs":
//         return <JobsPage />;
//       case "notifications":
//         return <NotificationsPage />;
//       case "gallery":
//         return <GalleryPage />;
//       case "verification":
//         return <VerificationPage />;
//       case "contacts":
//         return <ContactsPage />;
//       default:
//         return <HomePage onNavigate={navigate} />;
//     }
//   };

//   const socialLinks = [
//     {
//       bg: "#1877f2",
//       url: "https://www.facebook.com/",
//       content: (
//         <span
//           style={{
//             fontWeight: 900,
//             fontSize: 16,
//             color: "#fff",
//             lineHeight: 1,
//           }}
//         >
//           f
//         </span>
//       ),
//     },
//     {
//       bg: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285aeb 90%)",
//       url: "https://www.instagram.com/jssabhiyan8/?hl=en",
//       content: (
//         <svg
//           viewBox="0 0 24 24"
//           width="16"
//           height="16"
//           fill="none"
//           stroke="white"
//           strokeWidth="2.2"
//         >
//           <rect x="2" y="2" width="20" height="20" rx="5" />
//           <circle cx="12" cy="12" r="5" />
//           <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none" />
//         </svg>
//       ),
//     },
//     {
//       bg: "#ff0000",
//       url: "https://www.youtube.com/@janswasthyasahayataabhiyan8183",
//       content: (
//         <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
//           <polygon points="9.5,7 9.5,17 18,12" />
//         </svg>
//       ),
//     },
//     {
//       bg: "#0077b5",
//       url: "https://www.linkedin.com/in/jss-abhiyan-3872b13b7/",
//       content: (
//         <span style={{ fontWeight: 900, fontSize: 12, color: "#fff" }}>in</span>
//       ),
//     },
//   ];

//   return (
//     <div
//       style={{
//         fontFamily: "'Segoe UI', sans-serif",
//         color: "#333",
//         background: "#fff",
//         overflowX: "hidden",
//       }}
//     >
//       <div style={{ background: "#2a2a2a", height: "3px", width: "100%" }} />

//       {/* Top Bar */}
//       <div
//         className="tb-topbar"
//         style={{
//           background: GREEN,
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "7px 16px",
//           gap: 8,
//           flexWrap: "wrap",
//         }}
//       >
//         <div
//           className="tb-left"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 14,
//             flexShrink: 1,
//             minWidth: 0,
//           }}
//         >
//           <span
//             className="tb-phone"
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 5,
//               color: "#070606",
//               fontSize: 20,
//               fontWeight: 600,
//               whiteSpace: "nowrap",
//             }}
//           >
//             <svg
//               width="14"
//               height="14"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="black"
//               strokeWidth="2"
//             >
//               <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
//             </svg>
//             9471987611
//           </span>
//           <span
//             className="tb-email"
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 5,
//               color: "#040404",
//               fontSize: 20,
//               fontWeight: 600,
//               whiteSpace: "nowrap",
//             }}
//           >
//             <svg
//               width="14"
//               height="14"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="black"
//               strokeWidth="2"
//             >
//               <rect x="2" y="4" width="20" height="16" rx="2" />
//               <path d="M2 7l10 7 10-7" />
//             </svg>
//             support@jssabhiyan.com
//           </span>
//         </div>
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 6,
//             flexShrink: 0,
//           }}
//         >
//           <div
//             className="tb-search"
//             style={{
//               position: "relative",
//               display: "flex",
//               alignItems: "center",
//             }}
//           >
//             <input
//               style={{
//                 borderRadius: 4,
//                 padding: "5px 26px 5px 10px",
//                 fontSize: 13,
//                 border: "1px solid #ddd",
//                 background: "#fff",
//                 color: "#333",
//                 width: 180,
//               }}
//               placeholder="Type and hit enter..."
//             />
//             <svg
//               style={{ position: "absolute", right: 7 }}
//               width="13"
//               height="13"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="#999"
//               strokeWidth="2.5"
//             >
//               <circle cx="11" cy="11" r="8" />
//               <line x1="21" y1="21" x2="16.65" y2="16.65" />
//             </svg>
//           </div>
//           <button
//             className="tb-dl-btn"
//             style={{
//               background: "#e53e3e",
//               color: "#fff",
//               fontSize: 13,
//               fontWeight: 700,
//               padding: "6px 14px",
//               borderRadius: 4,
//               border: "none",
//               cursor: "pointer",
//               whiteSpace: "nowrap",
//               flexShrink: 0,
//             }}
//           >
//             Download Document
//           </button>
//         </div>
//       </div>

//       {/* Desktop Header */}
//       <div
//         className="hdr-desktop"
//         style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "12px 24px",
//           background: "#fff",
//           borderBottom: "1px solid #eee",
//         }}
//       >
//         <button
//           onClick={() => navigate("home")}
//           style={{
//             background: "none",
//             border: "none",
//             cursor: "pointer",
//             padding: 0,
//           }}
//         >
//           <img
//             src={logo}
//             alt="JSS Logo"
//             style={{ height: 130, width: "auto", objectFit: "contain" }}
//           />
//         </button>
//         <div
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "flex-end",
//             gap: 10,
//           }}
//         >
//           <div style={{ display: "flex", gap: 12 }}>
//             <a
//               href="https://frontend.jssabhiyan.com/"
//               style={{
//                 background: "#e53e3e",
//                 color: "#fff",
//                 fontWeight: 900,
//                 fontSize: 16,
//                 padding: "10px 40px",
//                 borderRadius: 4,
//                 border: "none",
//                 cursor: "pointer",
//                 textDecoration: "none",
//                 display: "inline-block",
//               }}
//             >
//               LOGIN
//             </a>
//             <a
//               href={brochurePDF}
//               target="_blank"
//               rel="noopener noreferrer"
//               style={{
//                 background: GREEN,
//                 color: "#000",
//                 fontWeight: 900,
//                 fontSize: 16,
//                 padding: "10px 40px",
//                 borderRadius: 4,
//                 border: "none",
//                 cursor: "pointer",
//                 textDecoration: "none",
//                 display: "inline-block",
//               }}
//             >
//               BROUCHERS
//             </a>
//           </div>
//           <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
//             <img
//               src={swachhBharat}
//               alt="Swachh Bharat"
//               style={{ height: 55, width: "auto", objectFit: "contain" }}
//             />
//             <div style={{ display: "flex", gap: 7 }}>
//               {socialLinks.map((s, i) => (
//                 <a
//                   key={i}
//                   href={s.url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   style={{
//                     background: s.bg,
//                     borderRadius: 7,
//                     width: 36,
//                     height: 36,
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     textDecoration: "none",
//                     flexShrink: 0,
//                   }}
//                 >
//                   {s.content}
//                 </a>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Mobile Header */}
//       <div
//         className="hdr-mobile"
//         style={{
//           display: "none",
//           flexDirection: "column",
//           background: "#fff",
//           borderBottom: "1px solid #eee",
//           padding: "6px 10px",
//           gap: 6,
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             gap: 6,
//           }}
//         >
//           <button
//             onClick={() => navigate("home")}
//             style={{
//               background: "none",
//               border: "none",
//               cursor: "pointer",
//               padding: 0,
//               flexShrink: 0,
//             }}
//           >
//             <img
//               src={logo}
//               alt="JSS Logo"
//               style={{
//                 height: 44,
//                 width: "auto",
//                 objectFit: "contain",
//                 display: "block",
//               }}
//             />
//           </button>
//           <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
//             <a
//               href="https://frontend.jssabhiyan.com/"
//               style={{
//                 background: "#e53e3e",
//                 color: "#fff",
//                 fontWeight: 900,
//                 fontSize: 11,
//                 padding: "5px 10px",
//                 borderRadius: 3,
//                 textDecoration: "none",
//                 display: "inline-block",
//                 whiteSpace: "nowrap",
//               }}
//             >
//               LOGIN
//             </a>
//             <a
//               href={brochurePDF}
//               target="_blank"
//               rel="noopener noreferrer"
//               style={{
//                 background: GREEN,
//                 color: "#000",
//                 fontWeight: 900,
//                 fontSize: 11,
//                 padding: "5px 10px",
//                 borderRadius: 3,
//                 cursor: "pointer",
//                 textDecoration: "none",
//                 display: "inline-block",
//                 whiteSpace: "nowrap",
//               }}
//             >
//               BROUCHERS
//             </a>
//           </div>
//         </div>
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "flex-end",
//             gap: 6,
//           }}
//         >
//           <img
//             src={swachhBharat}
//             alt="Swachh Bharat"
//             style={{ height: 24, width: "auto", objectFit: "contain" }}
//           />
//           <div style={{ display: "flex", gap: 3 }}>
//             {socialLinks.map((s, i) => (
//               <a
//                 key={i}
//                 href={s.url}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 style={{
//                   background: s.bg,
//                   borderRadius: 4,
//                   width: 22,
//                   height: 22,
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   textDecoration: "none",
//                   flexShrink: 0,
//                 }}
//               >
//                 <span style={{ transform: "scale(0.7)", display: "flex" }}>
//                   {s.content}
//                 </span>
//               </a>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Nav Bar */}
//       <nav
//         style={{
//           background: GREEN,
//           overflowX: "auto",
//           WebkitOverflowScrolling: "touch",
//         }}
//       >
//         <ul
//           className="nav-list"
//           style={{ display: "flex", margin: 0, padding: 0, listStyle: "none" }}
//         >
//           {navLinks.map((item, i) => (
//             <li key={i} className="nav-item">
//               <button
//                 onClick={() => navigate(item.page)}
//                 className="nav-btn"
//                 style={{
//                   display: "block",
//                   color: "#000",
//                   fontWeight: 700,
//                   letterSpacing: "0.02em",
//                   textAlign: "center",
//                   background:
//                     activePage === item.page
//                       ? "rgba(0,0,0,0.25)"
//                       : "transparent",
//                   border: "none",
//                   borderRight:
//                     i < navLinks.length - 1
//                       ? "1px solid rgba(255,255,255,0.2)"
//                       : "none",
//                   cursor: "pointer",
//                   whiteSpace: "nowrap",
//                 }}
//                 onMouseEnter={(e) =>
//                   (e.currentTarget.style.background = "rgba(0,0,0,0.2)")
//                 }
//                 onMouseLeave={(e) =>
//                   (e.currentTarget.style.background =
//                     activePage === item.page
//                       ? "rgba(0,0,0,0.25)"
//                       : "transparent")
//                 }
//               >
//                 {item.label}
//               </button>
//             </li>
//           ))}
//         </ul>
//       </nav>

//       {renderPage()}
//       <FloatingButtons />

//       {/* Footer */}
//       <footer
//         style={{ background: "#304865", color: "#fff", padding: "36px 18px 0" }}
//       >
//         <div
//           className="footer-inner"
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "flex-start",
//             gap: 14,
//             maxWidth: 1200,
//             margin: "0 auto",
//           }}
//         >
//           <div style={{ flex: "1 1 0", minWidth: 0 }}>
//             <h4
//               className="ft-heading"
//               style={{
//                 fontWeight: 900,
//                 marginBottom: 18,
//                 color: "#5ecfcf",
//                 letterSpacing: "0.06em",
//               }}
//             >
//               QUICK LINKS
//             </h4>
//             <ul
//               style={{
//                 listStyle: "none",
//                 padding: 0,
//                 margin: 0,
//                 display: "flex",
//                 flexDirection: "column",
//               }}
//               className="ft-list"
//             >
//               {[
//                 { label: "About Us", page: "about" },
//                 { label: "MemberShip & Benifits", page: "membership" },
//                 { label: "View Jobs & Carrier", page: "jobs" },
//                 { label: "View Our Services", page: "services" },
//                 { label: "Our Privacy Policy", page: "home" },
//                 { label: "Refund & Cancellation", page: "home" },
//                 { label: "Terms & Condition", page: "home" },
//               ].map((l, i) => (
//                 <li key={i}>
//                   <button
//                     onClick={() => navigate(l.page)}
//                     className="ft-link"
//                     style={{
//                       color: "#cbd5e0",
//                       background: "none",
//                       border: "none",
//                       cursor: "pointer",
//                       textAlign: "left",
//                       padding: "2px 0",
//                       display: "block",
//                       width: "100%",
//                     }}
//                     onMouseEnter={(e) => (e.target.style.color = "#fff")}
//                     onMouseLeave={(e) => (e.target.style.color = "#cbd5e0")}
//                   >
//                     {l.label}
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           </div>
//           <div
//             className="ft-logo-wrap"
//             style={{
//               flexShrink: 0,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <img
//               src={logo1}
//               alt="JSS Logo"
//               className="ft-logo-img"
//               style={{ objectFit: "contain" }}
//             />
//           </div>
//           <div
//             style={{
//               flex: "1 1 0",
//               minWidth: 0,
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "flex-end",
//             }}
//           >
//             <h4
//               className="ft-heading"
//               style={{
//                 fontWeight: 900,
//                 marginBottom: 18,
//                 color: "#5ecfcf",
//                 letterSpacing: "0.06em",
//               }}
//             >
//               CONTACT INFO
//             </h4>
//             <div
//               className="ft-contact"
//               style={{
//                 display: "flex",
//                 flexDirection: "column",
//                 alignItems: "flex-end",
//               }}
//             >
//               <div className="ft-contact-item">
//                 Helpline No. : +91-9471987611
//               </div>
//               <div className="ft-contact-item">
//                 Email : support@jssabhiyan.com
//               </div>
//               <button
//                 onClick={() => navigate("contacts")}
//                 className="ft-contact-link"
//                 style={{
//                   color: "#5ecfcf",
//                   background: "none",
//                   border: "none",
//                   cursor: "pointer",
//                   textAlign: "right",
//                   padding: 0,
//                   lineHeight: 1.6,
//                 }}
//               >
//                 To know our all office branch address
//                 <br />
//                 click here
//               </button>
//             </div>
//           </div>
//         </div>
//         <div
//           className="ft-copyright"
//           style={{
//             textAlign: "center",
//             color: "#94a3b8",
//             borderTop: "1px solid #4a5a6c",
//             fontWeight: 500,
//           }}
//         >
//           © 2021 JSS Abhiyan. All Rights Reserved. Trademark &amp; Brands are
//           property of their respective owner.
//         </div>
//       </footer>

//       <style>{`
//         @keyframes newBadge {
//           0%   { background: #e53e3e; }
//           25%  { background: #d97706; }
//           50%  { background: #7c3aed; }
//           75%  { background: #0369a1; }
//           100% { background: #e53e3e; }
//         }
//         @keyframes marquee-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
//         .marquee-inner { animation: marquee-scroll 30s linear infinite; }
//         .marquee-inner:hover { animation-play-state: paused; }
//         * { box-sizing: border-box; }
//         nav::-webkit-scrollbar { height: 3px; }
//         nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 2px; }

//         .hdr-desktop { display: flex !important; }
//         .hdr-mobile  { display: none !important; }
//         .tb-left     { display: flex !important; }
//         .tb-phone    { display: flex !important; }
//         .tb-email    { display: flex !important; }
//         .tb-search   { display: flex !important; }

//         .slider-stats-wrap { display: flex; }
//         .slider-area  { flex: 0 0 75%; position: relative; overflow: hidden; min-height: 500px; max-height: 680px; }
//         .stats-area   { flex: 0 0 25%; display: grid; grid-template-columns: 1fr 1fr; border-left: 1px solid #eee; background: #fff; }
//         .stat-cell    { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 10px 4px; border-bottom: 1px solid #eee; border-right: 1px solid #eee; }
//         .stat-cell:nth-child(2), .stat-cell:nth-child(4) { border-right: none; }
//         .stat-cell:nth-child(3), .stat-cell:nth-child(4) { border-bottom: none; }

//         .nav-list { width: 100%; }
//         .nav-item  { flex: 1; }
//         .nav-btn   { width: 100%; font-size: 14px; padding: 14px 4px; color: #000 !important; }

//         .notif-cards-desktop { display: flex !important; }
//         .notif-cards-mobile  { display: none !important; }

//         .stat-num          { font-size: 22px; }
//         .stat-icon-desktop { display: block; }
//         .stat-icon-mobile  { display: none; }
//         .stat-label        { font-size: 13px; }

//         .body-text       { font-size: 15px; }
//         .action-btn      { font-size: 13px; }
//         .pub-notice-title{ font-size: 16px; }
//         .section-heading { font-size: 15px; }
//         .cert-btn        { font-size: 15px; }
//         .accred-label    { font-size: 11px; }
//         .accred-logo     { height: 100px; }
//         .app-img { width: 31%; }
//         .intro-inner { flex-direction: row; }
//         .footer-inner  { flex-direction: row; }
//         .ft-heading    { font-size: 15px; }
//         .ft-list       { gap: 14px; }
//         .ft-link       { font-size: 14px; font-weight: 500; }
//         .ft-logo-wrap  { padding: 0 40px; }
//         .ft-logo-img   { width: 280px; height: auto; }
//         .ft-contact    { gap: 14px; }
//         .ft-contact-item { font-size: 14px; font-weight: 500; color: #cbd5e0; }
//         .ft-contact-link { font-size: 14px; font-weight: 500; margin-top: 6px; }
//         .ft-copyright  { font-size: 12px; padding: 16px 0; margin-top: 40px; }

//         @media (max-width: 768px) {
//           .hdr-desktop { display: none !important; }
//           .hdr-mobile  { display: flex !important; flex-direction: column !important; }

//           .tb-topbar { flex-wrap: nowrap !important; padding: 4px 8px !important; gap: 4px !important; justify-content: space-between !important; }
//           .tb-left   { display: flex !important; gap: 6px !important; flex-shrink: 1 !important; min-width: 0 !important; align-items: center !important; }
//           .tb-phone  { display: flex !important; font-size: 9px !important; gap: 2px !important; white-space: nowrap !important; flex-shrink: 0 !important; }
//           .tb-phone svg { width: 9px !important; height: 9px !important; }
//           .tb-email  { display: flex !important; font-size: 9px !important; gap: 2px !important; white-space: nowrap !important; flex-shrink: 1 !important; min-width: 0 !important; overflow: hidden !important; }
//           .tb-email svg { width: 9px !important; height: 9px !important; flex-shrink: 0 !important; }
//           .tb-search { display: flex !important; flex-shrink: 1 !important; }
//           .tb-search input { width: 70px !important; font-size: 9px !important; padding: 3px 18px 3px 5px !important; }
//           .tb-search svg { width: 9px !important; height: 9px !important; right: 4px !important; }
//           .tb-dl-btn { font-size: 9px !important; padding: 4px 7px !important; white-space: nowrap !important; flex-shrink: 0 !important; }

//           .slider-stats-wrap { display: flex !important; flex-direction: row !important; min-height: unset !important; }
//           .slider-area { flex: 0 0 70% !important; width: 70% !important; height: 180px !important; min-height: 180px !important; max-height: 180px !important; }
//           .stats-area  { flex: 0 0 30% !important; width: 30% !important; display: grid !important; grid-template-columns: 1fr 1fr !important; border-left: 1px solid #eee !important; border-top: none !important; background: #fff !important; }
//           .stat-cell   { padding: 4px 2px !important; border-bottom: 1px solid #eee !important; border-right: 1px solid #eee !important; gap: 1px !important; }
//           .stat-cell:nth-child(2), .stat-cell:nth-child(4) { border-right: none !important; }
//           .stat-cell:nth-child(3), .stat-cell:nth-child(4) { border-bottom: none !important; }

//           .nav-list { width: 100% !important; flex-wrap: nowrap !important; display: flex !important; }
//           .nav-item  { flex: 1 1 0 !important; }
//           .nav-btn   { font-size: 5.5px !important; padding: 4px 1px !important; width: 100% !important; text-align: center !important; letter-spacing: 0 !important; white-space: nowrap !important; color: #000 !important; }

//           .notif-cards-desktop { display: none !important; }
//           .notif-cards-mobile  { display: flex !important; flex-direction: row !important; }

//           .stat-num          { font-size: 10px !important; }
//           .stat-icon-desktop { display: none !important; }
//           .stat-icon-mobile  { display: block !important; }
//           .stat-label        { font-size: 7px !important; }

//           .notice-app-wrap { padding: 20px 0 0 !important; }
//           .notice-app-inner { padding: 0 14px !important; }
//           .action-btns-row { flex-direction: row !important; gap: 5px !important; margin-bottom: 16px !important; }
//           .action-btn { font-size: 8px !important; padding: 10px 3px !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
//           .app-imgs-row { gap: 6px !important; }
//           .app-img { width: 31% !important; }

//           .public-notice-wrap { padding: 16px 10px !important; }
//           .pub-notice-title { font-size: 11px !important; padding: 6px 10px !important; }

//           .body-text       { font-size: 11px; }
//           .section-heading { font-size: 11px; }
//           .cert-btn        { font-size: 8px !important; padding: 10px 2px !important; }
//           .accred-label    { font-size: 9px; }
//           .accred-logo     { height: 44px; }

//           .intro-inner { flex-direction: row !important; gap: 10px !important; }
//           .intro-section { padding: 16px 0 !important; }
//           .intro-section > div { padding: 0 12px !important; }
//           .intro-heading { font-size: 9px !important; margin-bottom: 5px !important; }

//           .cert-section { padding: 16px 10px !important; }
//           .cert-btn-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 4px !important; }

//           .accred-section { padding: 16px 10px !important; }
//           .accred-logos   { gap: 12px !important; }

//           footer { padding: 10px 6px 0 !important; }
//           .footer-inner   { flex-direction: row !important; gap: 6px !important; align-items: flex-start !important; }
//           .ft-heading     { font-size: 8px !important; margin-bottom: 6px !important; letter-spacing: 0.02em !important; }
//           .ft-list        { gap: 3px !important; }
//           .ft-link        { font-size: 7px !important; font-weight: 500 !important; }
//           .ft-logo-wrap   { padding: 0 4px !important; width: auto !important; justify-content: center !important; }
//           .ft-logo-img    { width: 60px !important; }
//           .ft-contact     { gap: 3px !important; align-items: flex-end !important; }
//           .ft-contact-item { font-size: 7px !important; }
//           .ft-contact-link { font-size: 7px !important; text-align: left !important; margin-top: 2px !important; }
//           .ft-copyright   { font-size: 7px !important; padding: 8px 0 !important; margin-top: 10px !important; }

//           div[style*="position: fixed"][style*="left: 20px"] a,
//           div[style*="position: fixed"][style*="right: 20px"] a {
//             width: 48px !important;
//             height: 48px !important;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }
// import { useState, useEffect, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import myGovLogo from "../assets/jss1.png";
// import unicefLogo from "../assets/jss2.png";
// import nitiAayogLogo from "../assets/jss3.jpeg";
// import msmeLogo from "../assets/jss4.png";
// import logo from "../assets/img0.png";
// import swachhBharat from "../assets/Swachh.png";
// import appImg1 from "../assets/img2b.png";
// import appImg2 from "../assets/img1.png";
// import appImg3 from "../assets/img3a.png";
// import logo1 from "../assets/jss.png";
// import cert1 from "../assets/cer1.jpeg";
// import cert2 from "../assets/cer4.jpeg";
// import cert3 from "../assets/cer5.jpeg";
// import cert4 from "../assets/cer4.jpeg";
// import cert5 from "../assets/cer5.jpeg";
// import cert6 from "../assets/cer6.jpeg";
// import cert7 from "../assets/cer7.jpeg";
// import cert8 from "../assets/cer8.jpeg";
// import cert9 from "../assets/cer9.jpeg";
// import cert10 from "../assets/cer10.jpeg";
// import cert11 from "../assets/cer1.jpeg";
// import cert12 from "../assets/cer7.jpeg";
// import cert13 from "../assets/cer9.jpeg";
// import cert14 from "../assets/cer1.jpeg";
// import cert15 from "../assets/cer10.jpeg";
// import cardImg1 from "../assets/jss.jpeg";
// import AboutPage from "../pages/Aboutpage";
// import MembershipPage from "../pages/Membershippage";
// import ServicesPage from "../pages/Servicespage";
// import JobsPage from "../pages/Jobspage";
// import NotificationsPage from "../pages/Notificationspage";
// import GalleryPage from "../pages/Gallerypage";
// import VerificationPage from "../pages/Verificationpage";
// import ContactsPage from "../pages/Contactspage";
// import { jobPostingsAPI, scrollerAPI, notificationsAPI } from "../utils/api.js";
// import brochurePDF from "../assets/broucher.pdf";

// const GREEN = "#4D7C0F";
// const BLUE_TEXT = "#4D7C0F";

// const fallbackSlides = [
//   "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1100&q=80",
//   "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1100&q=80",
//   "https://images.unsplash.com/photo-1593491205049-7f032d28cf01?w=1100&q=80",
//   "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1100&q=80",
// ];

// const PATH_TO_PAGE = {
//   "/": "home",
//   "/about": "about",
//   "/membership": "membership",
//   "/services": "services",
//   "/jobs": "jobs",
//   "/notifications": "notifications",
//   "/gallery": "gallery",
//   "/verification": "verification",
//   "/contacts": "contacts",
// };

// const PAGE_TO_PATH = {
//   home: "/",
//   about: "/about",
//   membership: "/membership",
//   services: "/services",
//   jobs: "/jobs",
//   notifications: "/notifications",
//   gallery: "/gallery",
//   verification: "/verification",
//   contacts: "/contacts",
// };

// const navLinks = [
//   { label: "HOME", page: "home" },
//   { label: "ABOUT US", page: "about" },
//   { label: "MEMBERSHIPS & BENIFITS", page: "membership" },
//   { label: "SERVICES", page: "services" },
//   { label: "JOBS & CARRIERS", page: "jobs" },
//   { label: "NOTIFICATIONS", page: "notifications" },
//   { label: "GALLERY", page: "gallery" },
//   { label: "VERIFICATION", page: "verification" },
//   { label: "CONTACTS", page: "contacts" },
// ];

// /* ─── Animated Counter ─── */
// function CounterNumber({ target, duration = 2000 }) {
//   const [count, setCount] = useState(0);
//   const ref = useRef(null);
//   const started = useRef(false);
//   useEffect(() => {
//     started.current = false;
//     setCount(0);
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting && !started.current) {
//           started.current = true;
//           const startTime = performance.now();
//           const end = parseInt(target.replace(/\D/g, ""), 10) || 0;
//           const step = (now) => {
//             const elapsed = now - startTime;
//             const progress = Math.min(elapsed / duration, 1);
//             const eased = 1 - Math.pow(1 - progress, 3);
//             setCount(Math.floor(eased * end));
//             if (progress < 1) requestAnimationFrame(step);
//             else setCount(end);
//           };
//           requestAnimationFrame(step);
//         }
//       },
//       { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
//     );
//     if (ref.current) observer.observe(ref.current);
//     return () => {
//       if (ref.current) observer.unobserve(ref.current);
//       observer.disconnect();
//     };
//   }, [target, duration]);
//   return <span ref={ref}>{count.toLocaleString("en-IN")}</span>;
// }

// /* ─── Unified MarqueeBand ─── */
// function MarqueeBand({ labelLine1, labelLine2, items = [], animId }) {
//   const ROWS = 3;
//   const rows = Array.from({ length: ROWS }, (_, i) =>
//     items && items.length > i ? items[i] : null,
//   );
//   const getText = (item) =>
//     (item && typeof item === "object" ? item.english : item) || "";
//   const getLink = (item) =>
//     item && typeof item === "object" ? item.link || "#" : "#";
//   const getIsNew = (item) => !!(item && typeof item === "object" && item.isNew);
//   const rowHeightD = 50;
//   const rowHeightM = 28;
//   return (
//     <>
//       <style>{`
//         ${rows
//           .map(
//             (_, i) => `
//           @keyframes mq-${animId}-${i}     { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
//           @keyframes mq-${animId}-mob-${i} { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
//           .mq-${animId}-${i}     { animation: mq-${animId}-${i}     20s linear infinite; will-change:transform; }
//           .mq-${animId}-mob-${i} { animation: mq-${animId}-mob-${i} 20s linear infinite; will-change:transform; }
//           .mq-${animId}-${i}:hover,
//           .mq-${animId}-mob-${i}:hover { animation-play-state: paused; }
//         `,
//           )
//           .join("")}
//         .mband-desk-${animId} { display: flex; }
//         .mband-mob-${animId}  { display: none; }
//         @media (max-width: 768px) {
//           .mband-desk-${animId} { display: none !important; }
//           .mband-mob-${animId}  { display: block !important; }
//         }
//       `}</style>

//       {/* Desktop */}
//       <div
//         className={`mband-desk-${animId}`}
//         style={{
//           background: "#f2f2f2",
//           borderTop: "1px solid #ddd",
//           borderBottom: "1px solid #ddd",
//           minHeight: rowHeightD * ROWS,
//           width: "100%",
//         }}
//       >
//         <div
//           style={{
//             width: "100%",
//             maxWidth: "100%",
//             padding: "0 24px 0 220px",
//             display: "flex",
//             alignItems: "stretch",
//             height: "100%",
//             minHeight: rowHeightD * ROWS,
//           }}
//         >
//           <div
//             style={{
//               width: 200,
//               flexShrink: 0,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "flex-start",
//               padding: "0 32px 0 0",
//               background: "#f2f2f2",
//             }}
//           >
//             <span
//               style={{
//                 fontWeight: 500,
//                 fontSize: 20,
//                 color: "#2d3748",
//                 lineHeight: 1.35,
//                 letterSpacing: "0.01em",
//               }}
//             >
//               {labelLine1}
//               <br />
//               {labelLine2}
//             </span>
//           </div>
//           <div
//             style={{
//               width: 0,
//               flexShrink: 0,
//               borderLeft: "2px dashed #b8b8b8",
//               margin: "18px 0",
//             }}
//           />
//           <div
//             style={{
//               flex: 1,
//               overflow: "hidden",
//               display: "flex",
//               flexDirection: "column",
//               justifyContent: "center",
//               gap: 0,
//             }}
//           >
//             {rows.map((item, i) => (
//               <div
//                 key={i}
//                 style={{
//                   height: rowHeightD,
//                   background: "#f2f2f2",
//                   overflow: "hidden",
//                   display: "flex",
//                   alignItems: "center",
//                 }}
//               >
//                 {item ? (
//                   <div
//                     className={`mq-${animId}-${i}`}
//                     style={{
//                       whiteSpace: "nowrap",
//                       display: "inline-block",
//                       paddingLeft: 40,
//                     }}
//                   >
//                     {[0, 1].map((copy) => (
//                       <a
//                         key={copy}
//                         href={getLink(item)}
//                         style={{
//                           display: "inline-block",
//                           color: "#4D7C0F",
//                           fontWeight: 600,
//                           fontSize: 11,
//                           textDecoration: "underline",
//                           textUnderlineOffset: 3,
//                           whiteSpace: "nowrap",
//                           paddingRight: 80,
//                         }}
//                       >
//                         {getText(item)}
//                         {getIsNew(item) && (
//                           <span
//                             style={{
//                               marginLeft: 6,
//                               background: "#e53e3e",
//                               color: "#fff",
//                               fontSize: 10,
//                               fontWeight: 900,
//                               padding: "1px 5px",
//                               borderRadius: 3,
//                               verticalAlign: "middle",
//                             }}
//                           >
//                             NEW
//                           </span>
//                         )}
//                       </a>
//                     ))}
//                   </div>
//                 ) : (
//                   <span
//                     style={{ paddingLeft: 40, color: "#ccc", fontSize: 14 }}
//                   >
//                     —
//                   </span>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Mobile */}
//       <div
//         className={`mband-mob-${animId}`}
//         style={{
//           background: "#f2f2f2",
//           borderTop: "1px solid #ddd",
//           borderBottom: "1px solid #ddd",
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             alignItems: "stretch",
//             minHeight: rowHeightM * ROWS,
//           }}
//         >
//           <div
//             style={{
//               flexShrink: 0,
//               width: 72,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               padding: "0 4px 0 16px",
//               background: "#f2f2f2",
//             }}
//           >
//             <span
//               style={{
//                 fontWeight: 500,
//                 fontSize: 7,
//                 color: "#2d3748",
//                 lineHeight: 1.35,
//                 letterSpacing: "0.02em",
//                 textAlign: "center",
//               }}
//             >
//               {labelLine1}
//               <br />
//               {labelLine2}
//             </span>
//           </div>
//           <div
//             style={{
//               width: 0,
//               flexShrink: 0,
//               borderLeft: "2px dashed #b8b8b8",
//               margin: "10px 0",
//             }}
//           />
//           <div
//             style={{
//               flex: 1,
//               overflow: "hidden",
//               display: "flex",
//               flexDirection: "column",
//               justifyContent: "center",
//               gap: 2,
//             }}
//           >
//             {rows.map((item, i) => (
//               <div
//                 key={i}
//                 style={{
//                   height: 22,
//                   background: "#f2f2f2",
//                   overflow: "hidden",
//                   display: "flex",
//                   alignItems: "center",
//                 }}
//               >
//                 {item ? (
//                   <div
//                     className={`mq-${animId}-mob-${i}`}
//                     style={{
//                       whiteSpace: "nowrap",
//                       display: "inline-block",
//                       paddingLeft: 4,
//                     }}
//                   >
//                     {[0, 1].map((copy) => (
//                       <a
//                         key={copy}
//                         href={getLink(item)}
//                         style={{
//                           display: "inline-block",
//                           color: "#4D7C0F",
//                           fontWeight: 600,
//                           fontSize: 8,
//                           textDecoration: "underline",
//                           textUnderlineOffset: 2,
//                           whiteSpace: "nowrap",
//                           paddingRight: 60,
//                         }}
//                       >
//                         {getText(item)}
//                         {getIsNew(item) && (
//                           <span
//                             style={{
//                               marginLeft: 4,
//                               background: "#e53e3e",
//                               color: "#fff",
//                               fontSize: 8,
//                               fontWeight: 900,
//                               padding: "1px 3px",
//                               borderRadius: 2,
//                               verticalAlign: "middle",
//                             }}
//                           >
//                             NEW
//                           </span>
//                         )}
//                       </a>
//                     ))}
//                   </div>
//                 ) : (
//                   <span
//                     style={{ paddingLeft: 10, color: "#ccc", fontSize: 10 }}
//                   >
//                     —
//                   </span>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// function VacanciesBand({ items = [] }) {
//   return (
//     <MarqueeBand
//       labelLine1="LATEST"
//       labelLine2="VACANCIES"
//       items={items}
//       animId="vac"
//     />
//   );
// }

// function ResultsBand({ items = [] }) {
//   const displayItems =
//     items.length === 0
//       ? [{ english: "Coming Soon", hindi: "जल्द ही आ रहा है", link: "#" }]
//       : items;
//   return (
//     <MarqueeBand
//       labelLine1="Latest"
//       labelLine2="Results"
//       items={displayItems}
//       animId="res"
//     />
//   );
// }

// /* ─── Vertical Notification Ticker ─── */
// function NotificationTicker({
//   notifications = [],
//   onSeeMore,
//   isMobile = false,
// }) {
//   const tickerRef = useRef(null);
//   const innerRef = useRef(null);
//   const animRef = useRef(null);
//   const posRef = useRef(0);

//   useEffect(() => {
//     const ticker = tickerRef.current;
//     const inner = innerRef.current;
//     if (!ticker || !inner || notifications.length === 0) return;
//     posRef.current = 0;
//     inner.style.transform = "translateY(0px)";
//     const SPEED = isMobile ? 0.4 : 0.5;
//     const tick = () => {
//       posRef.current += SPEED;
//       const halfH = inner.scrollHeight / 2;
//       if (halfH > 0 && posRef.current >= halfH) posRef.current = 0;
//       inner.style.transform = `translateY(-${posRef.current}px)`;
//       animRef.current = requestAnimationFrame(tick);
//     };
//     animRef.current = requestAnimationFrame(tick);
//     const pause = () => cancelAnimationFrame(animRef.current);
//     const resume = () => {
//       animRef.current = requestAnimationFrame(tick);
//     };
//     ticker.addEventListener("mouseenter", pause);
//     ticker.addEventListener("mouseleave", resume);
//     return () => {
//       cancelAnimationFrame(animRef.current);
//       ticker.removeEventListener("mouseenter", pause);
//       ticker.removeEventListener("mouseleave", resume);
//     };
//   }, [notifications, isMobile]);

//   const fs = isMobile ? 11 : 13;
//   const pad = isMobile ? "9px 11px" : "11px 14px";
//   const height = isMobile ? 160 : 260;

//   const cards = notifications.slice(0, 8).map((n, i) => (
//     <a
//       key={i}
//       href={n.url || "#"}
//       target={n.url ? "_blank" : undefined}
//       rel={n.url ? "noopener noreferrer" : undefined}
//       style={{
//         display: "block",
//         color: "#000",
//         fontWeight: 700,
//         fontSize: fs,
//         padding: pad,
//         lineHeight: 1.7,
//         textDecoration: "underline",
//         textUnderlineOffset: 2,
//         borderBottom: "1px dotted rgba(0,0,0,0.2)",
//         flexShrink: 0,
//       }}
//     >
//       {">>"} {n.title}{" "}
//       <span
//         style={{
//           display: "inline-block",
//           fontSize: isMobile ? 7 : 9,
//           fontWeight: 900,
//           padding: "1px 4px",
//           borderRadius: 2,
//           verticalAlign: "middle",
//           animation: "newBadge 1.5s infinite",
//           color: "#fff",
//           letterSpacing: "0.04em",
//         }}
//       >
//         NEW
//       </span>
//     </a>
//   ));

//   return (
//     <div
//       style={{
//         flex: 1,
//         height: "100%",
//         borderRadius: 4,
//         padding: isMobile ? 10 : 20,
//         background: GREEN,
//         display: "flex",
//         flexDirection: "column",
//       }}
//     >
//       <h2
//         style={{
//           color: "#fff",
//           fontWeight: 900,
//           fontSize: isMobile ? 12 : 22,
//           marginBottom: isMobile ? 8 : 14,
//           flexShrink: 0,
//         }}
//       >
//         Notification
//       </h2>
//       {notifications.length === 0 ? (
//         <div
//           style={{
//             color: "rgba(255,255,255,0.8)",
//             fontSize: isMobile ? 10 : 13,
//             padding: isMobile ? "6px 8px" : "10px 12px",
//             textAlign: "center",
//           }}
//         >
//           No notifications available
//         </div>
//       ) : (
//         <div
//           ref={tickerRef}
//           style={{
//             height: height,
//             overflow: "hidden",
//             flex: 1,
//             cursor: "pointer",
//           }}
//         >
//           <div ref={innerRef} style={{ willChange: "transform" }}>
//             {cards}
//             {cards}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// /* ─── Cert Slider ─── */
// function CertSlider() {
//   const [current, setCurrent] = useState(0);
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

//   useEffect(() => {
//     const onResize = () => {
//       setIsMobile(window.innerWidth <= 768);
//       setCurrent(0);
//     };
//     window.addEventListener("resize", onResize);
//     return () => window.removeEventListener("resize", onResize);
//   }, []);

//   const certImages = [
//     { src: cert1, alt: "Certificate 1" },
//     { src: cert2, alt: "Certificate 2" },
//     { src: cert3, alt: "Certificate 3" },
//     { src: cert4, alt: "Certificate 4" },
//     { src: cert5, alt: "Certificate 5" },
//     { src: cert6, alt: "Certificate 6" },
//     { src: cert7, alt: "Certificate 7" },
//     { src: cert8, alt: "Certificate 8" },
//     { src: cert9, alt: "Certificate 9" },
//     { src: cert10, alt: "Certificate 10" },
//     { src: cert11, alt: "Certificate 11" },
//     { src: cert12, alt: "Certificate 12" },
//     { src: cert13, alt: "Certificate 13" },
//     { src: cert14, alt: "Certificate 14" },
//     { src: cert15, alt: "Certificate 15" },
//   ];

//   const visibleCount = 4;
//   const cardHeight = isMobile ? 90 : 220;
//   const maxSlide = certImages.length - visibleCount;

//   useEffect(() => {
//     const t = setInterval(() => {
//       setCurrent((c) => (c >= maxSlide ? 0 : c + 1));
//     }, 2500);
//     return () => clearInterval(t);
//   }, [maxSlide]);

//   return (
//     <div
//       style={{
//         margin: "0 auto 24px",
//         position: "relative",
//         padding: isMobile ? "0 44px" : "0 36px",
//       }}
//     >
//       <div style={{ overflow: "hidden" }}>
//         <div
//           style={{
//             display: "flex",
//             gap: isMobile ? 4 : 12,
//             transform: `translateX(-${current * (100 / visibleCount)}%)`,
//             transition: "transform 0.4s ease",
//           }}
//         >
//           {certImages.map((img, i) => (
//             <img
//               key={i}
//               src={img.src}
//               alt={img.alt}
//               style={{
//                 flexShrink: 0,
//                 width: `calc(${100 / visibleCount}% - 9px)`,
//                 height: cardHeight,
//                 objectFit: "contain",
//                 display: "block",
//               }}
//             />
//           ))}
//         </div>
//       </div>
//       {current > 0 && (
//         <button
//           onClick={() => setCurrent((c) => Math.max(0, c - 1))}
//           style={{
//             position: "absolute",
//             left: 0,
//             top: "50%",
//             transform: "translateY(-50%)",
//             background: "#fff",
//             borderRadius: "50%",
//             border: "2px solid #3AB000",
//             width: isMobile ? 36 : 30,
//             height: isMobile ? 36 : 30,
//             fontSize: isMobile ? 22 : 18,
//             cursor: "pointer",
//             color: "#3AB000",
//             fontWeight: 900,
//           }}
//         >
//           ‹
//         </button>
//       )}
//       {current < maxSlide && (
//         <button
//           onClick={() => setCurrent((c) => Math.min(maxSlide, c + 1))}
//           style={{
//             position: "absolute",
//             right: 0,
//             top: "50%",
//             transform: "translateY(-50%)",
//             background: "#fff",
//             borderRadius: "50%",
//             border: "2px solid #3AB000",
//             width: isMobile ? 36 : 30,
//             height: isMobile ? 36 : 30,
//             fontSize: isMobile ? 22 : 18,
//             cursor: "pointer",
//             color: "#3AB000",
//             fontWeight: 900,
//           }}
//         >
//           ›
//         </button>
//       )}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "center",
//           gap: isMobile ? 4 : 6,
//           marginTop: isMobile ? 8 : 14,
//         }}
//       >
//         {Array.from({ length: maxSlide + 1 }, (_, i) => (
//           <button
//             key={i}
//             onClick={() => setCurrent(i)}
//             style={{
//               width: isMobile ? 6 : 10,
//               height: isMobile ? 6 : 10,
//               borderRadius: "50%",
//               border: "none",
//               cursor: "pointer",
//               background: i === current ? "#3AB000" : "#ccc",
//               padding: 0,
//               transition: "background 0.2s",
//             }}
//           />
//         ))}
//       </div>
//     </div>
//   );
// }

// const PersonIcon = ({ color = "#1a1a1a", size = 36 }) => (
//   <svg width={size} height={size} viewBox="0 0 46 46" fill={color}>
//     <circle cx="23" cy="14" r="9" />
//     <ellipse cx="23" cy="36" rx="14" ry="9" />
//   </svg>
// );

// const DoctorIcon = ({ size = 36 }) => (
//   <svg width={size} height={size} viewBox="0 0 46 46" fill="#1a1a1a">
//     <circle cx="23" cy="11" r="8" />
//     <path d="M9 46 Q9 29 23 29 Q37 29 37 46Z" />
//     <circle
//       cx="31"
//       cy="39"
//       r="4"
//       fill="none"
//       stroke="#1a1a1a"
//       strokeWidth="2"
//     />
//     <path
//       d="M27 35 Q25 25 21 23"
//       fill="none"
//       stroke="#1a1a1a"
//       strokeWidth="2"
//     />
//   </svg>
// );

// const YogaIcon = ({ size = 36 }) => (
//   <svg
//     width={size}
//     height={size}
//     viewBox="0 0 46 46"
//     fill="none"
//     stroke="#1a1a1a"
//     strokeWidth="2.2"
//     strokeLinecap="round"
//   >
//     <circle cx="23" cy="9" r="5" fill="#1a1a1a" stroke="none" />
//     <line x1="23" y1="14" x2="23" y2="27" />
//     <line x1="23" y1="19" x2="8" y2="25" />
//     <line x1="23" y1="19" x2="38" y2="25" />
//     <line x1="23" y1="27" x2="15" y2="38" />
//     <line x1="23" y1="27" x2="31" y2="38" />
//     <line x1="15" y1="38" x2="25" y2="33" />
//     <line x1="31" y1="38" x2="21" y2="33" />
//   </svg>
// );

// /* ─── Floating Buttons ─── */
// function FloatingButtons() {
//   return (
//     <>
//       <div style={{ position: "fixed", left: 20, bottom: 20, zIndex: 1000 }}>
//         <a
//           href="tel:9471987611"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             width: 60,
//             height: 60,
//             borderRadius: "50%",
//             background: "linear-gradient(135deg, #3AB000 0%, #2d8a00 100%)",
//             color: "#fff",
//             boxShadow: "0 4px 12px rgba(58, 176, 0, 0.4)",
//             textDecoration: "none",
//           }}
//           title="Call Us"
//         >
//           <svg
//             width="28"
//             height="28"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="2.5"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           >
//             <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
//           </svg>
//         </a>
//       </div>
//       <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 1000 }}>
//         <a
//           href="https://wa.me/919471987611"
//           target="_blank"
//           rel="noopener noreferrer"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             width: 60,
//             height: 60,
//             borderRadius: "50%",
//             background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
//             color: "#fff",
//             boxShadow: "0 4px 12px rgba(37, 211, 102, 0.4)",
//             textDecoration: "none",
//           }}
//           title="WhatsApp"
//         >
//           <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
//             <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
//           </svg>
//         </a>
//       </div>
//     </>
//   );
// }

// /* ─── HOME PAGE ─── */
// function HomePage({ onNavigate }) {
//   const [slide, setSlide] = useState(0);
//   const [slides, setSlides] = useState(fallbackSlides);
//   const [scrollerImages, setScrollerImages] = useState([]);
//   const [results, setResults] = useState([]);
//   const [vacancies, setVacancies] = useState([]);
//   const [notifications, setNotifications] = useState([]);
//   const [loadingVacancies, setLoadingVacancies] = useState(true);
//   const [loadingResults, setLoadingResults] = useState(true);

//   useEffect(() => {
//     const fetch_ = async () => {
//       try {
//         const res = await scrollerAPI.getAll(null);
//         if (res?.success && res.data) {
//           const allImages = res.data.scrollerImages || [];
//           const validImages = allImages.filter(
//             (img) => img.imageUrl && img.imageUrl.trim() !== "",
//           );
//           if (validImages.length > 0) {
//             const sortedImages = validImages.sort((a, b) => {
//               if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
//               return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
//             });
//             setSlides(sortedImages.map((i) => i.imageUrl));
//             setScrollerImages(sortedImages);
//             setSlide(0);
//           } else setSlides(fallbackSlides);
//         } else setSlides(fallbackSlides);
//       } catch {
//         setSlides(fallbackSlides);
//       }
//     };
//     fetch_();
//   }, []);

//   useEffect(() => {
//     if (slides.length > 0) {
//       const t = setInterval(
//         () => setSlide((s) => (s + 1) % slides.length),
//         4000,
//       );
//       return () => clearInterval(t);
//     }
//   }, [slides.length]);

//   useEffect(() => {
//     const fetch_ = async () => {
//       try {
//         setLoadingVacancies(true);
//         const r = await jobPostingsAPI.getLatestVacancies();
//         setVacancies(r.success && r.data.vacancies ? r.data.vacancies : []);
//       } catch {
//         setVacancies([]);
//       } finally {
//         setLoadingVacancies(false);
//       }
//     };
//     fetch_();
//     const iv = setInterval(fetch_, 30000);
//     return () => clearInterval(iv);
//   }, []);

//   useEffect(() => {
//     setResults([]);
//     setLoadingResults(false);
//   }, []);

//   useEffect(() => {
//     const fetch_ = async () => {
//       try {
//         const r = await notificationsAPI.getAll("true");
//         setNotifications(r.success && r.data ? r.data.notifications || [] : []);
//       } catch {
//         setNotifications([]);
//       }
//     };
//     fetch_();
//     const iv = setInterval(fetch_, 30000);
//     return () => clearInterval(iv);
//   }, []);

//   const statsData = [
//     {
//       icon: <PersonIcon color="#1a1a1a" size={46} />,
//       mobileIcon: <PersonIcon color="#1a1a1a" size={28} />,
//       num: "2265",
//       label: "Joined Us",
//     },
//     {
//       icon: <PersonIcon color="#1a1a1a" size={46} />,
//       mobileIcon: <PersonIcon color="#1a1a1a" size={28} />,
//       num: "2185",
//       label: "Took Benifits",
//     },
//     {
//       icon: <DoctorIcon size={46} />,
//       mobileIcon: <DoctorIcon size={28} />,
//       num: "2265",
//       label: "Medical Camps Organised",
//     },
//     {
//       icon: <YogaIcon size={46} />,
//       mobileIcon: <YogaIcon size={28} />,
//       num: "2185",
//       label: "Yoga Camps Organised",
//     },
//   ];

//   return (
//     <>
//       {/* Slider + Stats */}
//       <div className="slider-stats-wrap">
//         <div className="slider-area">
//           {slides.length > 0 ? (
//             <>
//               {slides.map((src, i) => {
//                 const si = scrollerImages[i];
//                 const imgEl = (
//                   <img
//                     key={i}
//                     src={src}
//                     alt={si?.title || `slide ${i + 1}`}
//                     style={{
//                       position: "absolute",
//                       inset: 0,
//                       width: "100%",
//                       height: "100%",
//                       objectFit: "cover",
//                       opacity: i === slide ? 1 : 0,
//                       transition: "opacity 0.8s ease",
//                     }}
//                     onError={(e) => (e.target.style.display = "none")}
//                   />
//                 );
//                 if (si?.link)
//                   return (
//                     <a
//                       key={i}
//                       href={si.link}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       style={{
//                         position: "absolute",
//                         inset: 0,
//                         display: i === slide ? "block" : "none",
//                       }}
//                     >
//                       {imgEl}
//                     </a>
//                   );
//                 return (
//                   <div
//                     key={i}
//                     style={{
//                       position: "absolute",
//                       inset: 0,
//                       display: i === slide ? "block" : "none",
//                     }}
//                   >
//                     {imgEl}
//                   </div>
//                 );
//               })}
//               {slides.length > 1 && (
//                 <>
//                   <button
//                     onClick={() =>
//                       setSlide((s) => (s - 1 + slides.length) % slides.length)
//                     }
//                     style={{
//                       position: "absolute",
//                       left: 6,
//                       top: "50%",
//                       transform: "translateY(-50%)",
//                       background: "rgba(255,255,255,0.7)",
//                       border: "none",
//                       borderRadius: "50%",
//                       width: 34,
//                       height: 34,
//                       fontSize: 22,
//                       cursor: "pointer",
//                       zIndex: 10,
//                     }}
//                   >
//                     ‹
//                   </button>
//                   <button
//                     onClick={() => setSlide((s) => (s + 1) % slides.length)}
//                     style={{
//                       position: "absolute",
//                       right: 6,
//                       top: "50%",
//                       transform: "translateY(-50%)",
//                       background: "rgba(255,255,255,0.7)",
//                       border: "none",
//                       borderRadius: "50%",
//                       width: 34,
//                       height: 34,
//                       fontSize: 22,
//                       cursor: "pointer",
//                       zIndex: 10,
//                     }}
//                   >
//                     ›
//                   </button>
//                 </>
//               )}
//             </>
//           ) : (
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 height: "100%",
//                 minHeight: "200px",
//                 background: "#f5f5f5",
//                 color: "#666",
//                 fontSize: "14px",
//               }}
//             >
//               Loading...
//             </div>
//           )}
//           <div
//             style={{
//               position: "absolute",
//               bottom: 6,
//               left: "50%",
//               transform: "translateX(-50%)",
//               display: "flex",
//               gap: 6,
//             }}
//           >
//             {slides.map((_, i) => (
//               <button
//                 key={i}
//                 onClick={() => setSlide(i)}
//                 style={{
//                   width: 8,
//                   height: 8,
//                   borderRadius: "50%",
//                   border: "none",
//                   cursor: "pointer",
//                   background: i === slide ? "#fff" : "rgba(255,255,255,0.45)",
//                   padding: 0,
//                 }}
//               />
//             ))}
//           </div>
//         </div>
//         <div className="stats-area">
//           {statsData.map((s, i) => (
//             <div key={i} className="stat-cell">
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 10,
//                   justifyContent: "flex-start",
//                   width: "100%",
//                 }}
//               >
//                 <span className="stat-icon-desktop">{s.icon}</span>
//                 <span className="stat-icon-mobile">{s.mobileIcon}</span>
//                 <div style={{ display: "flex", flexDirection: "column" }}>
//                   <span
//                     className="stat-num"
//                     style={{
//                       fontWeight: 700,
//                       color: "#1a1a1a",
//                       fontSize: 22,
//                       lineHeight: 1.2,
//                     }}
//                   >
//                     <CounterNumber target={s.num} />
//                   </span>
//                   <span
//                     className="stat-label"
//                     style={{
//                       color: "#333",
//                       fontWeight: 600,
//                       textAlign: "left",
//                       lineHeight: 1.4,
//                     }}
//                   >
//                     {s.label}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Vacancies Band */}
//       <div style={{ marginTop: 24 }}>
//         <VacanciesBand items={vacancies} />
//       </div>

//       {/* Notice + App Images */}
//       <div
//         className="notice-app-wrap"
//         style={{ background: "#fce8f0", padding: "50px 0 0", marginTop: 24 }}
//       >
//         <div
//           className="notice-app-inner"
//           style={{ padding: "0 100px 0 200px" }}
//         >
//           <p
//             className="body-text notice-text"
//             style={{
//               lineHeight: 2.4,
//               color: "#1a1a1a",
//               marginBottom: 28,
//               textAlign: "justify",
//               fontWeight: 400,
//               fontSize: 18,
//             }}
//           >
//             <strong>NOTICE/सूचना:</strong> जिन अभ्यर्थियों का नाम जिला प्रबंधक
//             पद विज्ञापन सं: JSSA/REQ/01/2025/P–III तथा ब्लॉक सुपरवाइजर सह पंचायत
//             कार्यपालक विज्ञापन सं: JSSA/REQ/02/2025/P–III तथा पंचायत कार्यपालक
//             विज्ञापन सं: JSSA/REQ/03/2026/P–III के अंतर्गत प्रथम मेधा सूची में
//             जारी किया गया है वे अभ्यर्थी कृपया ऑनलाइन एमओयू और सहमति प्रपत्र
//             अंतिम तिथि 02/03/2026 से पहले भर लें। Candidates whose name has been
//             released in the first merit list under District Manager Advt. No:
//             JSSA/REQ/01/2025/P–III &amp; Block Supervisor Cum Panchayat
//             Executive Advt. No: JSSA/REQ/02/2025/P–III &amp; Panchayat Executive
//             Advt. No: JSSA/REQ/03/2025/P–III those candidates please fill the
//             online MoU and consent form before the last date 02/03/2026. Failure
//             to submit the required documents within the stipulated date may lead
//             to cancellation of candidate.
//           </p>
//           <div
//             className="body-text notice-important"
//             style={{
//               background: "#f8b4b4",
//               padding: "20px 24px",
//               borderRadius: 3,
//               fontWeight: 600,
//               color: "#1a1a1a",
//               marginBottom: 28,
//               textAlign: "center",
//               fontSize: 19,
//             }}
//           >
//             IMPORTANT NOTICE:– जन स्वास्थ्य सहायता अभियान के कार्यक्रमों को
//             जमीनी स्तर पर शुरुवात करने हेतु आवश्यक अधिसूचना।
//           </div>
//           <div
//             className="action-btns-row"
//             style={{ display: "flex", gap: 20, marginBottom: 32 }}
//           >
//             {[
//               "Online Test & Interview",
//               "Online Mou & Consent Form",
//               "Authorized Login",
//             ].map((btn, i) => (
//               <button
//                 key={i}
//                 className="action-btn"
//                 style={{
//                   flex: 1,
//                   background: "#2ecc1a",
//                   color: "#000",
//                   fontWeight: 700,
//                   padding: "18px 6px",
//                   borderRadius: 5,
//                   border: "none",
//                   cursor: "pointer",
//                   lineHeight: 1.3,
//                   fontSize: 15,
//                   boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
//                   whiteSpace: "nowrap",
//                   overflow: "hidden",
//                   textOverflow: "ellipsis",
//                 }}
//               >
//                 {btn}
//               </button>
//             ))}
//           </div>
//           <div
//             className="app-imgs-row"
//             style={{
//               display: "flex",
//               alignItems: "flex-end",
//               justifyContent: "space-between",
//               gap: 16,
//             }}
//           >
//             {[appImg1, appImg2, appImg3].map((src, i) => (
//               <img
//                 key={i}
//                 src={src}
//                 alt={`app${i + 1}`}
//                 className="app-img"
//                 style={{
//                   width: "31%",
//                   height: "auto",
//                   objectFit: "contain",
//                   display: "block",
//                 }}
//               />
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Results Band */}
//       <div style={{ marginTop: 24 }}>
//         <ResultsBand items={results} />
//       </div>

//       {/* Organization Info */}
//       <div
//         className="org-info-wrap"
//         style={{ background: "#e8f5e2", padding: "50px 0", marginTop: 24 }}
//       >
//         <div
//           className="org-info-inner"
//           style={{ padding: "0 100px 0 200px", textAlign: "center" }}
//         >
//           <p
//             className="body-text org-text"
//             style={{ color: "#333", lineHeight: 1.9, margin: 0 }}
//           >
//             This project is organized Under social welfare orgenization 'NAC"
//             Registration No. : 053083 incorporated under [Pursuant to
//             sub-section (2) of section 7 and sub-section (1) of section 8 of the
//             Companies Act, 2013 (18 of 2013) and rule 18 of the Companies
//             (Incorporation) Rules, 2014].
//           </p>
//         </div>
//       </div>

//       {/* Public Notice */}
//       <div
//         className="public-notice-wrap"
//         style={{
//           padding: "24px 100px 24px 200px",
//           textAlign: "center",
//           background: "#fffde8",
//           marginTop: 24,
//         }}
//       >
//         <div
//           className="pub-notice-title"
//           style={{
//             display: "inline-block",
//             border: "2px solid #374151",
//             padding: "8px 20px",
//             fontWeight: 900,
//             marginBottom: 16,
//           }}
//         >
//           सार्वजनिक सूचना / PUBLIC NOTICE:
//         </div>
//         <p
//           className="body-text"
//           style={{ margin: "0 auto 12px", lineHeight: 1.9, color: "#555" }}
//         >
//           हमारे संस्था द्वारा सदस्यता शुल्क, जाद आवेदन शुल्क एवं एमओयू और सहमति
//           शुल्क के अलावा कोई अतिरिक्त शुल्क नहीं लिया जाता हैं।
//         </p>
//         <p
//           className="body-text"
//           style={{ margin: "0 auto", lineHeight: 1.9, color: "#555" }}
//         >
//           No extra fee is charged by our organization other than membership fee,
//           job application fee and MOU and consent fee.
//         </p>
//       </div>

//       {/* ── Notifications + Cards — Desktop ── */}
//       <div
//         className="notif-cards-desktop"
//         style={{ background: "#fff", padding: "20px 0", marginTop: 24 }}
//       >
//         <div
//           style={{
//             padding: "0 100px 0 200px",
//             display: "flex",
//             gap: 20,
//             alignItems: "stretch",
//           }}
//         >
//           <div
//             style={{
//               flex: "1 1 0",
//               minWidth: 0,
//               display: "flex",
//               flexDirection: "column",
//             }}
//           >
//             <NotificationTicker
//               notifications={notifications}
//               onSeeMore={() => onNavigate("notifications")}
//               isMobile={false}
//             />
//           </div>
//           <div
//             style={{
//               flex: "1 1 0",
//               minWidth: 0,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               border: "2px solid #e0e0e0",
//               borderRadius: 4,
//               overflow: "hidden",
//             }}
//           >
//             <img
//               src={cardImg1}
//               alt="JSS Card"
//               style={{ width: "100%", height: "auto", display: "block" }}
//             />
//           </div>
//         </div>
//       </div>

//       {/* ── Notifications + Cards — Mobile ── */}
//       <div
//         className="notif-cards-mobile"
//         style={{
//           display: "none",
//           gap: 10,
//           padding: "0 12px",
//           background: "#fff",
//           alignItems: "center",
//         }}
//       >
//         <div style={{ flex: "1 1 0", minWidth: 0 }}>
//           <NotificationTicker
//             notifications={notifications}
//             onSeeMore={() => onNavigate("notifications")}
//             isMobile={true}
//           />
//         </div>
//         <div
//           style={{
//             flex: "1 1 0",
//             minWidth: 0,
//             display: "flex",
//             alignItems: "center",
//             border: "2px solid #e0e0e0",
//             borderRadius: 4,
//             overflow: "hidden",
//           }}
//         >
//           <img
//             src={cardImg1}
//             alt="JSS Card"
//             style={{ width: "100%", height: "auto", display: "block" }}
//           />
//         </div>
//       </div>

//       {/* Intro Section */}
//       <div
//         className="intro-section"
//         style={{
//           borderTop: `4px solid ${GREEN}`,
//           borderBottom: `4px solid ${GREEN}`,
//           padding: "40px 0",
//           background: "#fff",
//           marginTop: 24,
//         }}
//       >
//         <div style={{ padding: "0 100px 0 200px" }}>
//           <div className="intro-inner" style={{ display: "flex", gap: 48 }}>
//             <div style={{ flex: "1 1 0" }}>
//               <h3
//                 className="intro-heading"
//                 style={{
//                   fontWeight: 900,
//                   color: "#1a1a1a",
//                   marginBottom: 14,
//                   fontSize: 15,
//                   letterSpacing: "0.02em",
//                 }}
//               >
//                 JAN SWASTHYA SAHAYATA ABHIYAN
//               </h3>
//               <p
//                 className="body-text"
//                 style={{ lineHeight: 1.9, color: "#333", marginBottom: 20 }}
//               >
//                 <strong>Introduction :</strong> Jan Swasthya Sahayata Abhiyan
//                 has been formed by the Healthcare Research and Development Board
//                 (Division of Social Welfare Organization "NAC".) to provide
//                 affordable, free &amp; better treatment with health related
//                 assistance to poor and needy people.
//               </p>
//               <p
//                 className="body-text"
//                 style={{ lineHeight: 1.9, color: "#333" }}
//               >
//                 <strong>Purpose :</strong> To provide better treatment by
//                 special doctors, medicines and medical tests to the poor and
//                 needy people of the country through Jan Swasthya Sahayata
//                 Abhiyan. Also motivating people to follow the guidelines given
//                 by the government to stay safe from COVID 19 by organizing
//                 awareness programs &amp; providing health related ...{" "}
//                 <button
//                   onClick={() => onNavigate("about")}
//                   style={{
//                     color: BLUE_TEXT,
//                     background: "none",
//                     border: "none",
//                     cursor: "pointer",
//                     padding: 0,
//                     fontSize: "inherit",
//                     fontWeight: 600,
//                   }}
//                 >
//                   read more
//                 </button>
//               </p>
//             </div>
//             <div style={{ flex: "1 1 0" }}>
//               <h3
//                 className="intro-heading"
//                 style={{
//                   fontWeight: 900,
//                   color: "#1a1a1a",
//                   marginBottom: 14,
//                   fontSize: 18,
//                   fontFamily: "serif",
//                 }}
//               >
//                 जन स्वास्थ्य सहायता अभियान
//               </h3>
//               <p
//                 className="body-text"
//                 style={{ lineHeight: 1.9, color: "#333", marginBottom: 20 }}
//               >
//                 <strong>परिचय :</strong> जन स्वास्थ्य सहायता अभियान का गठन
//                 हेल्थकेयर रिसर्च एंड डेवलपमेंट बोर्ड (Division Of Social Welfare
//                 Organization "NAC".) द्वारा सस्ती, निःशुल्क एवं बेहतर इलाज तथा
//                 गरीब एवं जरूरतमंद लोगों को स्वास्थ्य संबंधित सहायता मुहैया
//                 करवाने के लिए किया गया है।
//               </p>
//               <p
//                 className="body-text"
//                 style={{ lineHeight: 1.9, color: "#333" }}
//               >
//                 <strong>उद्देश्य :</strong> जन स्वास्थ्य सहायता अभियान के माध्यम
//                 से देश के गरीब और जरूरतमंद लोगों को चिकिसक, दवाईयां और चिकिसा
//                 जांच द्वारा बेहतर उपचार प्रदान करना, साथ ही जागरूकता कार्यक्रम
//                 आयोजित कर COVID 19 से सुरक्षित रहने के लिए सरकार द्वारा दिए गए
//                 दिशा-निर्देशों का पालन करने हेतु लोगों को प्रेरित करना और स्वस्थ
//                 रहने के लिए योग और व्यायाम प्रशिक्षण के साथ स्वास्थ्य संबंधित
//                 सहायता ...{" "}
//                 <button
//                   onClick={() => onNavigate("about")}
//                   style={{
//                     color: BLUE_TEXT,
//                     background: "none",
//                     border: "none",
//                     cursor: "pointer",
//                     padding: 0,
//                     fontSize: "inherit",
//                     fontWeight: 600,
//                   }}
//                 >
//                   अधिक पढ़ें
//                 </button>
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Certificates */}
//       <div
//         className="cert-section"
//         style={{
//           padding: "28px 100px 28px 200px",
//           background: "#f8f8f8",
//           marginTop: 24,
//         }}
//       >
//         <CertSlider />
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(4, 1fr)",
//             gap: 10,
//           }}
//           className="cert-btn-grid"
//         >
//           {[
//             { label: "Enquiry", page: null },
//             { label: "Broucher", page: null, pdf: brochurePDF },
//             { label: "Membership", page: "membership" },
//             { label: "Services", page: "services" },
//           ].map((btn, i) => (
//             <button
//               key={i}
//               className="cert-btn"
//               onClick={() => {
//                 if (btn.page) onNavigate(btn.page);
//                 else if (btn.pdf) window.open(btn.pdf, "_blank");
//               }}
//               style={{
//                 background: GREEN,
//                 color: "#000",
//                 fontWeight: 900,
//                 padding: "14px 4px",
//                 borderRadius: 4,
//                 border: "none",
//                 cursor: btn.page || btn.pdf ? "pointer" : "default",
//               }}
//             >
//               {btn.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* ── Accreditations ── */}
//       {/* FIXED: outer uses padding "32px 0", inner div uses "0 100px" to match all other sections */}
//       <div
//         className="accred-section"
//         style={{
//           background: "#fff",
//           borderTop: "1px solid #eee",
//           marginTop: 24,
//           padding: "32px 0",
//         }}
//       >
//         <div style={{ padding: "0 100px" }}>
//           <p
//             className="accred-label"
//             style={{
//               fontWeight: 700,
//               color: "#aaa",
//               letterSpacing: "0.1em",
//               textTransform: "uppercase",
//               marginBottom: 18,
//               textAlign: "center",
//             }}
//           >
//             ACCREDITATIONS &amp; FOLLOWS GUIDELINES
//           </p>
//           <div
//             className="accred-logos"
//             style={{
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//               gap: 48,
//               flexWrap: "wrap",
//             }}
//           >
//             {[myGovLogo, unicefLogo, nitiAayogLogo, msmeLogo].map((src, i) => (
//               <img
//                 key={i}
//                 src={src}
//                 alt={`accreditation-${i}`}
//                 className="accred-logo"
//                 style={{ width: "auto", objectFit: "contain" }}
//               />
//             ))}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// /* ══════════════════════════════════════════════════════
//    MAIN EXPORT
//    ══════════════════════════════════════════════════════ */
// export default function JSSAbhiyan() {
//   const routerNavigate = useNavigate();
//   const location = useLocation();
//   const activePage = PATH_TO_PAGE[location.pathname] || "home";

//   const navigate = (page) => {
//     const path = PAGE_TO_PATH[page] || "/";
//     routerNavigate(path);
//     window.scrollTo(0, 0);
//   };

//   const renderPage = () => {
//     switch (activePage) {
//       case "about":
//         return <AboutPage onNavigate={navigate} />;
//       case "membership":
//         return <MembershipPage />;
//       case "services":
//         return <ServicesPage />;
//       case "jobs":
//         return <JobsPage />;
//       case "notifications":
//         return <NotificationsPage />;
//       case "gallery":
//         return <GalleryPage />;
//       case "verification":
//         return <VerificationPage />;
//       case "contacts":
//         return <ContactsPage />;
//       default:
//         return <HomePage onNavigate={navigate} />;
//     }
//   };

//   const socialLinks = [
//     {
//       bg: "#1877f2",
//       url: "https://www.facebook.com/",
//       content: (
//         <span
//           style={{
//             fontWeight: 900,
//             fontSize: 16,
//             color: "#fff",
//             lineHeight: 1,
//           }}
//         >
//           f
//         </span>
//       ),
//     },
//     {
//       bg: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285aeb 90%)",
//       url: "https://www.instagram.com/jssabhiyan8/?hl=en",
//       content: (
//         <svg
//           viewBox="0 0 24 24"
//           width="16"
//           height="16"
//           fill="none"
//           stroke="white"
//           strokeWidth="2.2"
//         >
//           <rect x="2" y="2" width="20" height="20" rx="5" />
//           <circle cx="12" cy="12" r="5" />
//           <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none" />
//         </svg>
//       ),
//     },
//     {
//       bg: "#ff0000",
//       url: "https://www.youtube.com/@janswasthyasahayataabhiyan8183",
//       content: (
//         <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
//           <polygon points="9.5,7 9.5,17 18,12" />
//         </svg>
//       ),
//     },
//     {
//       bg: "#0077b5",
//       url: "https://www.linkedin.com/in/jss-abhiyan-3872b13b7/",
//       content: (
//         <span style={{ fontWeight: 900, fontSize: 12, color: "#fff" }}>in</span>
//       ),
//     },
//   ];

//   return (
//     <div
//       style={{
//         fontFamily: "'Segoe UI', sans-serif",
//         color: "#333",
//         background: "#fff",
//         overflowX: "hidden",
//         margin: 0,
//         padding: 0,
//       }}
//     >
//       {/* Top Bar */}
//       <div
//         className="tb-topbar"
//         style={{
//           background: GREEN,
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "8px 20px",
//           gap: 8,
//           height: 54,
//           flexWrap: "nowrap",
//           position: "relative",
//         }}
//       >
//         {/* LEFT: Phone + Email */}
//         <div
//           className="tb-left"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 24,
//             flexShrink: 0,
//             marginLeft: "10%",
//           }}
//         >
//           <span
//             className="tb-phone"
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 6,
//               color: "#000",
//               fontSize: 18,
//               fontWeight: 500,
//               whiteSpace: "nowrap",
//             }}
//           >
//             <svg
//               width="17"
//               height="17"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="black"
//               strokeWidth="2"
//             >
//               <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
//             </svg>
//             9471987611
//           </span>
//           <span
//             className="tb-email"
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 6,
//               color: "#000",
//               fontSize: 18,
//               fontWeight: 500,
//               whiteSpace: "nowrap",
//             }}
//           >
//             <svg
//               width="17"
//               height="17"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="black"
//               strokeWidth="2"
//             >
//               <rect x="2" y="4" width="20" height="16" rx="2" />
//               <path d="M2 7l10 7 10-7" />
//             </svg>
//             support@jssabhiyan.com
//           </span>
//         </div>

//         {/* CENTER: Search bar */}
//         <div
//           className="tb-search"
//           style={{
//             position: "absolute",
//             left: "58%",
//             transform: "translateX(-50%)",
//             display: "flex",
//             alignItems: "center",
//           }}
//         >
//           <input
//             style={{
//               borderRadius: 0,
//               padding: "4px 28px 4px 10px",
//               fontSize: 15,
//               fontWeight: 600,
//               border: "0.5px solid #000",
//               background: "#fff",
//               color: "#333",
//               width: 200,
//               height: 42,
//             }}
//             placeholder="Type and hit enter..."
//           />
//           <svg
//             style={{ position: "absolute", right: 8 }}
//             width="22"
//             height="22"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="#333"
//             strokeWidth="2.8"
//           >
//             <circle cx="11" cy="11" r="8" />
//             <line x1="21" y1="21" x2="16.65" y2="16.65" />
//           </svg>
//         </div>

//         {/* RIGHT: Download button */}
//         <button
//           className="tb-dl-btn"
//           style={{
//             background: "#e53e3e",
//             color: "#fff",
//             fontSize: 13,
//             fontWeight: 900,
//             padding: "5px 28px",
//             borderRadius: 4,
//             border: "none",
//             cursor: "pointer",
//             whiteSpace: "nowrap",
//             flexShrink: 0,
//             height: 42,
//             marginRight: "12%",
//           }}
//         >
//           Download Document
//         </button>
//       </div>

//       {/* Desktop Header */}
//       <div
//         className="hdr-desktop"
//         style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "10px 24px",
//           background: "#fff",
//           borderBottom: "1px solid #eee",
//           minHeight: 150,
//         }}
//       >
//         {/* LEFT: Logo */}
//         <button
//           onClick={() => navigate("home")}
//           style={{
//             background: "none",
//             border: "none",
//             cursor: "pointer",
//             padding: 0,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             flexShrink: 0,
//             marginLeft: "8%",
//           }}
//         >
//           <img
//             src={logo}
//             alt="JSS Logo"
//             style={{
//               height: 155,
//               width: "auto",
//               objectFit: "contain",
//               display: "block",
//             }}
//           />
//         </button>

//         {/* RIGHT: Buttons + Swachh Bharat + Social */}
//         <div
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "flex-end",
//             justifyContent: "space-between",
//             paddingTop: 0,
//             paddingBottom: 14,
//             gap: 14,
//             marginRight: "6%",
//           }}
//         >
//           {/* Row 1: LOGIN + BROUCHERS */}
//           <div
//             style={{
//               display: "flex",
//               gap: 14,
//               alignItems: "center",
//               marginTop: -8,
//             }}
//           >
//             <a
//               href="https://frontend.jssabhiyan.com/"
//               style={{
//                 background: "#e53e3e",
//                 color: "#fff",
//                 fontWeight: 900,
//                 fontSize: 20,
//                 padding: "12px 50px",
//                 borderRadius: 4,
//                 cursor: "pointer",
//                 textDecoration: "none",
//                 display: "inline-block",
//                 letterSpacing: "0.04em",
//                 lineHeight: 1.3,
//               }}
//             >
//               LOGIN
//             </a>
//             <a
//               href={brochurePDF}
//               target="_blank"
//               rel="noopener noreferrer"
//               style={{
//                 background: GREEN,
//                 color: "#000",
//                 fontWeight: 900,
//                 fontSize: 20,
//                 padding: "12px 50px",
//                 borderRadius: 4,
//                 cursor: "pointer",
//                 textDecoration: "none",
//                 display: "inline-block",
//                 letterSpacing: "0.04em",
//                 lineHeight: 1.3,
//               }}
//             >
//               BROUCHERS
//             </a>
//           </div>
//           {/* Row 2: Swachh Bharat + Social */}
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 16,
//               marginBottom: -8,
//             }}
//           >
//             <img
//               src={swachhBharat}
//               alt="Swachh Bharat"
//               style={{ height: 68, width: "auto", objectFit: "contain" }}
//             />
//             <div style={{ display: "flex", gap: 9 }}>
//               {socialLinks.map((s, i) => (
//                 <a
//                   key={i}
//                   href={s.url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   style={{
//                     background: s.bg,
//                     borderRadius: 7,
//                     width: 44,
//                     height: 44,
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     textDecoration: "none",
//                     flexShrink: 0,
//                   }}
//                 >
//                   {s.content}
//                 </a>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Mobile Header */}
//       <div
//         className="hdr-mobile"
//         style={{
//           display: "none",
//           flexDirection: "column",
//           background: "#fff",
//           borderBottom: "1px solid #eee",
//           padding: "1px 8px",
//           gap: 1,
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             gap: 6,
//           }}
//         >
//           <button
//             onClick={() => navigate("home")}
//             style={{
//               background: "none",
//               border: "none",
//               cursor: "pointer",
//               padding: 0,
//               flexShrink: 0,
//               marginLeft: "4%",
//             }}
//           >
//             <img
//               src={logo}
//               alt="JSS Logo"
//               style={{
//                 height: 48,
//                 width: "auto",
//                 objectFit: "contain",
//                 display: "block",
//               }}
//             />
//           </button>
//           <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
//             <a
//               href="https://frontend.jssabhiyan.com/"
//               style={{
//                 background: "#e53e3e",
//                 color: "#fff",
//                 fontWeight: 900,
//                 fontSize: 11,
//                 padding: "5px 10px",
//                 borderRadius: 3,
//                 textDecoration: "none",
//                 display: "inline-block",
//                 whiteSpace: "nowrap",
//               }}
//             >
//               LOGIN
//             </a>
//             <a
//               href={brochurePDF}
//               target="_blank"
//               rel="noopener noreferrer"
//               style={{
//                 background: GREEN,
//                 color: "#000",
//                 fontWeight: 900,
//                 fontSize: 11,
//                 padding: "5px 10px",
//                 borderRadius: 3,
//                 cursor: "pointer",
//                 textDecoration: "none",
//                 display: "inline-block",
//                 whiteSpace: "nowrap",
//               }}
//             >
//               BROUCHERS
//             </a>
//           </div>
//         </div>
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "flex-end",
//             gap: 6,
//           }}
//         >
//           <img
//             src={swachhBharat}
//             alt="Swachh Bharat"
//             style={{ height: 24, width: "auto", objectFit: "contain" }}
//           />
//           <div style={{ display: "flex", gap: 3 }}>
//             {socialLinks.map((s, i) => (
//               <a
//                 key={i}
//                 href={s.url}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 style={{
//                   background: s.bg,
//                   borderRadius: 4,
//                   width: 22,
//                   height: 22,
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   textDecoration: "none",
//                   flexShrink: 0,
//                 }}
//               >
//                 <span style={{ transform: "scale(0.7)", display: "flex" }}>
//                   {s.content}
//                 </span>
//               </a>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Nav Bar */}
//       <nav
//         style={{
//           background: GREEN,
//           overflowX: "auto",
//           WebkitOverflowScrolling: "touch",
//         }}
//       >
//         <ul
//           className="nav-list"
//           style={{ display: "flex", margin: 0, padding: 0, listStyle: "none" }}
//         >
//           {navLinks.map((item, i) => (
//             <li key={i} className="nav-item">
//               <button
//                 onClick={() => navigate(item.page)}
//                 className="nav-btn"
//                 style={{
//                   display: "block",
//                   color: "#000",
//                   fontWeight: 700,
//                   letterSpacing: "0.02em",
//                   textAlign: "center",
//                   background: "transparent",
//                   border: "none",
//                   borderRight:
//                     i < navLinks.length - 1
//                       ? "1px solid rgba(255,255,255,0.2)"
//                       : "none",
//                   cursor: "pointer",
//                   whiteSpace: "nowrap",
//                   outline: "none",
//                 }}
//                 onMouseEnter={(e) =>
//                   (e.currentTarget.style.background = "transparent")
//                 }
//                 onMouseLeave={(e) =>
//                   (e.currentTarget.style.background = "transparent")
//                 }
//               >
//                 {item.label}
//               </button>
//             </li>
//           ))}
//         </ul>
//       </nav>

//       {renderPage()}
//       <FloatingButtons />

//       {/* Footer */}
//       <footer
//         style={{ background: "#304865", color: "#fff", padding: "36px 18px 0" }}
//       >
//         <div
//           className="footer-inner"
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "flex-start",
//             gap: 14,
//             padding: "0 100px 0 200px",
//           }}
//         >
//           <div style={{ flex: "1 1 0", minWidth: 0 }}>
//             <h4
//               className="ft-heading"
//               style={{
//                 fontWeight: 900,
//                 marginBottom: 18,
//                 color: "#5ecfcf",
//                 letterSpacing: "0.06em",
//               }}
//             >
//               QUICK LINKS
//             </h4>
//             <ul
//               style={{
//                 listStyle: "none",
//                 padding: 0,
//                 margin: 0,
//                 display: "flex",
//                 flexDirection: "column",
//               }}
//               className="ft-list"
//             >
//               {[
//                 { label: "About Us", page: "about" },
//                 { label: "MemberShip & Benifits", page: "membership" },
//                 { label: "View Jobs & Carrier", page: "jobs" },
//                 { label: "View Our Services", page: "services" },
//                 { label: "Our Privacy Policy", page: "home" },
//                 { label: "Refund & Cancellation", page: "home" },
//                 { label: "Terms & Condition", page: "home" },
//               ].map((l, i) => (
//                 <li key={i}>
//                   <button
//                     onClick={() => navigate(l.page)}
//                     className="ft-link"
//                     style={{
//                       color: "#ffffff",
//                       background: "none",
//                       border: "none",
//                       cursor: "pointer",
//                       textAlign: "left",
//                       padding: "2px 0",
//                       display: "block",
//                       width: "100%",
//                     }}
//                   >
//                     {l.label}
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           </div>
//           <div
//             className="ft-logo-wrap"
//             style={{
//               flexShrink: 0,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <img
//               src={logo1}
//               alt="JSS Logo"
//               className="ft-logo-img"
//               style={{ objectFit: "contain" }}
//             />
//           </div>
//           <div
//             style={{
//               flex: "1 1 0",
//               minWidth: 0,
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "flex-end",
//             }}
//           >
//             <h4
//               className="ft-heading"
//               style={{
//                 fontWeight: 900,
//                 marginBottom: 18,
//                 color: "#5ecfcf",
//                 letterSpacing: "0.06em",
//               }}
//             >
//               CONTACT INFO
//             </h4>
//             <div
//               className="ft-contact"
//               style={{
//                 display: "flex",
//                 flexDirection: "column",
//                 alignItems: "flex-end",
//               }}
//             >
//               <div className="ft-contact-item">
//                 Helpline No. : +91-9471987611
//               </div>
//               <div className="ft-contact-item">
//                 Email : support@jssabhiyan.com
//               </div>
//               <button
//                 onClick={() => navigate("contacts")}
//                 className="ft-contact-link"
//                 style={{
//                   color: "#5ecfcf",
//                   background: "none",
//                   border: "none",
//                   cursor: "pointer",
//                   textAlign: "right",
//                   padding: 0,
//                   lineHeight: 1.6,
//                 }}
//               >
//                 To know our all office branch address
//                 <br />
//                 click here
//               </button>
//             </div>
//           </div>
//         </div>
//         <div
//           className="ft-copyright"
//           style={{
//             textAlign: "center",
//             color: "#ffffff",
//             borderTop: "1px solid #4a5a6c",
//             fontWeight: 700,
//           }}
//         >
//           © 2021 JSS Abhiyan. All Rights Reserved. Trademark &amp; Brands are
//           property of their respective owner.
//         </div>
//       </footer>

//       <style>{`
//         html, body, #root { margin: 0 !important; padding: 0 !important; }

//         @keyframes newBadge {
//           0%   { background: #e53e3e; }
//           25%  { background: #d97706; }
//           50%  { background: #7c3aed; }
//           75%  { background: #0369a1; }
//           100% { background: #e53e3e; }
//         }
//         @keyframes marquee-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
//         .marquee-inner { animation: marquee-scroll 30s linear infinite; }
//         .marquee-inner:hover { animation-play-state: paused; }
//         * { box-sizing: border-box; }
//         nav::-webkit-scrollbar { height: 3px; }
//         nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 2px; }

//         .hdr-desktop { display: flex !important; }
//         .hdr-mobile  { display: none !important; }
//         .tb-left     { display: flex !important; }
//         .tb-phone    { display: flex !important; }
//         .tb-email    { display: flex !important; }
//         .tb-search   { display: flex !important; }

//         .slider-stats-wrap { display: flex; padding: 16px 100px 16px 100px; background: #fff; }
//         .slider-area  { flex: 0 0 75%; position: relative; overflow: hidden; min-height: 500px; max-height: 680px; border-radius: 4px; }
//         .stats-area   { flex: 0 0 25%; display: grid; grid-template-columns: 1fr 1fr; border-left: 1px solid #eee; background: #fff; }
//         .stat-cell    { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 20px 8px 20px 20px; border-bottom: none; border-right: none; }
//         .stat-cell:nth-child(2), .stat-cell:nth-child(4) { border-right: none; }
//         .stat-cell:nth-child(3), .stat-cell:nth-child(4) { border-bottom: none; }

//         .nav-list { width: 100%; }
//         .nav-item  { flex: 1; }
//         .nav-btn   { width: 100%; font-size: 14px; padding: 14px 4px; color: #000 !important; }

//         .notif-cards-desktop { display: flex !important; }
//         .notif-cards-mobile  { display: none !important; }

//         .stat-num          { font-size: 22px; }
//         .stat-icon-desktop { display: block; }
//         .stat-icon-mobile  { display: none; }
//         .stat-label        { font-size: 13px; }

//         .body-text       { font-size: 15px; }
//         .action-btn      { font-size: 13px; }
//         .pub-notice-title{ font-size: 16px; }
//         .section-heading { font-size: 15px; }
//         .cert-btn        { font-size: 15px; }
//         .accred-label    { font-size: 11px; }
//         .accred-logo     { height: 100px; }
//         .app-img { width: 31%; }
//         .intro-inner { flex-direction: row; }
//         .footer-inner  { flex-direction: row; }
//         .ft-heading    { font-size: 15px; }
//         .ft-list       { gap: 14px; }
//         .ft-link       { font-size: 14px; font-weight: 500; }
//         .ft-logo-wrap  { padding: 0 40px; }
//         .ft-logo-img   { width: 280px; height: auto; }
//         .ft-contact    { gap: 14px; }
//         .ft-contact-item { font-size: 14px; font-weight: 500; color: #ffffff; }
//         .ft-contact-link { font-size: 14px; font-weight: 500; margin-top: 6px; }
//         .ft-copyright  { font-size: 12px; padding: 16px 0; margin-top: 40px; }

//         @media (max-width: 768px) {
//           .hdr-desktop { display: none !important; }
//           .hdr-mobile  { display: flex !important; flex-direction: column !important; padding: 4px 8px !important; min-height: unset !important; }

//           .tb-topbar { flex-wrap: nowrap !important; padding: 0 6px !important; gap: 4px !important; justify-content: space-between !important; height: 36px !important; position: relative !important; }
//           .tb-left   { display: flex !important; gap: 8px !important; flex-shrink: 0 !important; min-width: 0 !important; align-items: center !important; margin-left: 2% !important; }
//           .tb-phone  { display: flex !important; font-size: 8px !important; gap: 3px !important; white-space: nowrap !important; flex-shrink: 0 !important; font-weight: 600 !important; }
//           .tb-phone svg { width: 8px !important; height: 8px !important; }
//           .tb-email  { display: flex !important; font-size: 8px !important; gap: 3px !important; white-space: nowrap !important; flex-shrink: 0 !important; font-weight: 600 !important; }
//           .tb-email svg { width: 8px !important; height: 8px !important; flex-shrink: 0 !important; }
//           .tb-search { position: absolute !important; left: 55% !important; transform: translateX(-50%) !important; display: flex !important; }
//           .tb-search input { width: 80px !important; font-size: 8px !important; padding: 2px 18px 2px 5px !important; height: 22px !important; font-weight: 600 !important; }
//           .tb-search svg { width: 10px !important; height: 10px !important; right: 4px !important; }
//           .tb-dl-btn { font-size: 8px !important; padding: 0 8px !important; white-space: nowrap !important; flex-shrink: 0 !important; height: 22px !important; font-weight: 900 !important; margin-right: 2% !important; }

//           .slider-stats-wrap { display: flex !important; flex-direction: row !important; min-height: unset !important; align-items: stretch !important; justify-content: flex-start !important; padding: 0 !important; gap: 0 !important; width: 100% !important; overflow: hidden !important; }
//           .slider-area { flex: 0 0 55% !important; width: 55% !important; height: 200px !important; min-height: 200px !important; max-height: 200px !important; border-radius: 0 !important; }
//           .stats-area  { flex: 0 0 45% !important; width: 45% !important; display: grid !important; grid-template-columns: 1fr 1fr !important; border-left: 1px solid #eee !important; border-top: none !important; background: #fff !important; height: 200px !important; }
//           .stat-cell   { padding: 4px 2px !important; border-bottom: 1px solid #eee !important; border-right: 1px solid #eee !important; gap: 1px !important; align-items: center !important; justify-content: center !important; }
//           .stat-cell:nth-child(2), .stat-cell:nth-child(4) { border-right: none !important; }
//           .stat-cell:nth-child(3), .stat-cell:nth-child(4) { border-bottom: none !important; }

//           .nav-list { width: 100% !important; flex-wrap: nowrap !important; display: flex !important; }
//           .nav-item  { flex: 1 1 0 !important; }
//           .nav-btn   { font-size: 5.5px !important; padding: 4px 1px !important; width: 100% !important; text-align: center !important; letter-spacing: 0 !important; white-space: nowrap !important; color: #000 !important; }

//           .notif-cards-desktop { display: none !important; }
//           .notif-cards-mobile  { display: flex !important; flex-direction: row !important; padding: 0 12px !important; width: 100% !important; box-sizing: border-box !important; }

//           .stat-num          { font-size: 10px !important; }
//           .stat-icon-desktop { display: none !important; }
//           .stat-icon-mobile  { display: block !important; }
//           .stat-label        { font-size: 7px !important; }

//           .notice-app-wrap { padding: 20px 0 0 !important; }
//           .notice-app-inner { padding: 0 14px !important; }
//           .action-btns-row { flex-direction: row !important; gap: 5px !important; margin-bottom: 16px !important; }
//           .action-btn { font-size: 9px !important; padding: 10px 3px !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
//           .app-imgs-row { gap: 6px !important; }
//           .app-img { width: 31% !important; }

//           .org-info-wrap    { padding: 20px 0 !important; }
//           .org-info-inner   { padding: 0 10px !important; }
//           .public-notice-wrap { padding: 16px 10px !important; }
//           .pub-notice-title { font-size: 11px !important; padding: 6px 10px !important; }

//           .body-text       { font-size: 11px; }
//           .org-text         { font-size: 8px !important; line-height: 1.9 !important; }
//           .notice-text      { font-size: 8px !important; font-weight: 400 !important; line-height: 1.4 !important; margin-bottom: 14px !important; }
//           .notice-important  { font-size: 8px !important; font-weight: 600 !important; padding: 10px 12px !important; margin-bottom: 14px !important; }
//           .section-heading { font-size: 11px; }
//           .cert-btn        { font-size: 8px !important; padding: 10px 2px !important; }
//           .accred-label    { font-size: 9px; }
//           .accred-logo     { height: 44px; }

//           .intro-inner { flex-direction: row !important; gap: 10px !important; }
//           .intro-section { padding: 16px 0 !important; }
//           .intro-section > div { padding: 0 12px !important; }
//           .intro-heading { font-size: 9px !important; margin-bottom: 5px !important; }

//           .cert-section { padding: 16px 10px !important; }
//           .cert-btn-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 4px !important; }

//           /* FIXED mobile accred: outer padding 0, inner div handles 10px sides */
//           .accred-section { padding: 16px 0 !important; }
//           .accred-section > div { padding: 0 10px !important; }
//           .accred-logos   { gap: 12px !important; }

//           footer { padding: 10px 6px 0 !important; }
//           .footer-inner   { flex-direction: row !important; gap: 6px !important; align-items: flex-start !important; padding: 0 !important; }
//           .ft-heading     { font-size: 8px !important; margin-bottom: 6px !important; letter-spacing: 0.02em !important; }
//           .ft-list        { gap: 3px !important; }
//           .ft-link        { font-size: 7px !important; font-weight: 500 !important; }
//           .ft-logo-wrap   { padding: 0 4px !important; width: auto !important; justify-content: center !important; }
//           .ft-logo-img    { width: 60px !important; }
//           .ft-contact     { gap: 3px !important; align-items: flex-end !important; }
//           .ft-contact-item { font-size: 7px !important; }
//           .ft-contact-link { font-size: 7px !important; text-align: left !important; margin-top: 2px !important; }
//           .ft-copyright   { font-size: 7px !important; padding: 8px 0 !important; margin-top: 10px !important; }

//           div[style*="position: fixed"][style*="left: 20px"] a,
//           div[style*="position: fixed"][style*="right: 20px"] a {
//             width: 48px !important;
//             height: 48px !important;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }
// import { useState, useEffect, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import myGovLogo from "../assets/jss1.png";
// import unicefLogo from "../assets/jss2.png";
// import nitiAayogLogo from "../assets/jss3.jpeg";
// import msmeLogo from "../assets/jss4.png";
// import logo from "../assets/img0.png";
// import swachhBharat from "../assets/Swachh.png";
// import appImg1 from "../assets/img2b.png";
// import appImg2 from "../assets/img1.png";
// import appImg3 from "../assets/img3a.png";
// import logo1 from "../assets/jss.png";
// import cert1 from "../assets/cer1.jpeg";
// import cert2 from "../assets/cer4.jpeg";
// import cert3 from "../assets/cer5.jpeg";
// import cert4 from "../assets/cer4.jpeg";
// import cert5 from "../assets/cer5.jpeg";
// import cert6 from "../assets/cer6.jpeg";
// import cert7 from "../assets/cer7.jpeg";
// import cert8 from "../assets/cer8.jpeg";
// import cert9 from "../assets/cer9.jpeg";
// import cert10 from "../assets/cer10.jpeg";
// import cert11 from "../assets/cer1.jpeg";
// import cert12 from "../assets/cer7.jpeg";
// import cert13 from "../assets/cer9.jpeg";
// import cert14 from "../assets/cer1.jpeg";
// import cert15 from "../assets/cer10.jpeg";
// import cardImg1 from "../assets/jss.jpeg";
// import AboutPage from "../pages/Aboutpage";
// import MembershipPage from "../pages/Membershippage";
// import ServicesPage from "../pages/Servicespage";
// import JobsPage from "../pages/Jobspage";
// import NotificationsPage from "../pages/Notificationspage";
// import GalleryPage from "../pages/Gallerypage";
// import VerificationPage from "../pages/Verificationpage";
// import ContactsPage from "../pages/Contactspage";
// import { jobPostingsAPI, scrollerAPI, notificationsAPI } from "../utils/api.js";
// import brochurePDF from "../assets/broucher.pdf";

// const GREEN = "#4D7C0F";
// const BLUE_TEXT = "#4D7C0F";

// const fallbackSlides = [
//   "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1100&q=80",
//   "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1100&q=80",
//   "https://images.unsplash.com/photo-1593491205049-7f032d28cf01?w=1100&q=80",
//   "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1100&q=80",
// ];

// const PATH_TO_PAGE = {
//   "/": "home",
//   "/about": "about",
//   "/membership": "membership",
//   "/services": "services",
//   "/jobs": "jobs",
//   "/notifications": "notifications",
//   "/gallery": "gallery",
//   "/verification": "verification",
//   "/contacts": "contacts",
// };

// const PAGE_TO_PATH = {
//   home: "/",
//   about: "/about",
//   membership: "/membership",
//   services: "/services",
//   jobs: "/jobs",
//   notifications: "/notifications",
//   gallery: "/gallery",
//   verification: "/verification",
//   contacts: "/contacts",
// };

// const navLinks = [
//   { label: "HOME", page: "home" },
//   { label: "ABOUT US", page: "about" },
//   { label: "MEMBERSHIPS & BENIFITS", page: "membership" },
//   { label: "SERVICES", page: "services" },
//   { label: "JOBS & CARRIERS", page: "jobs" },
//   { label: "NOTIFICATIONS", page: "notifications" },
//   { label: "GALLERY", page: "gallery" },
//   { label: "VERIFICATION", page: "verification" },
//   { label: "CONTACTS", page: "contacts" },
// ];

// /* ─── Animated Counter ─── */
// function CounterNumber({ target, duration = 2000 }) {
//   const [count, setCount] = useState(0);
//   const ref = useRef(null);
//   const started = useRef(false);
//   useEffect(() => {
//     started.current = false;
//     setCount(0);
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting && !started.current) {
//           started.current = true;
//           const startTime = performance.now();
//           const end = parseInt(target.replace(/\D/g, ""), 10) || 0;
//           const step = (now) => {
//             const elapsed = now - startTime;
//             const progress = Math.min(elapsed / duration, 1);
//             const eased = 1 - Math.pow(1 - progress, 3);
//             setCount(Math.floor(eased * end));
//             if (progress < 1) requestAnimationFrame(step);
//             else setCount(end);
//           };
//           requestAnimationFrame(step);
//         }
//       },
//       { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
//     );
//     if (ref.current) observer.observe(ref.current);
//     return () => {
//       if (ref.current) observer.unobserve(ref.current);
//       observer.disconnect();
//     };
//   }, [target, duration]);
//   return <span ref={ref}>{count.toLocaleString("en-IN")}</span>;
// }

// /* ─── Unified MarqueeBand ─── */
// function MarqueeBand({ labelLine1, labelLine2, items = [], animId }) {
//   const ROWS = 3;
//   const rows = Array.from({ length: ROWS }, (_, i) =>
//     items && items.length > i ? items[i] : null,
//   );
//   const getText = (item) =>
//     (item && typeof item === "object" ? item.english : item) || "";
//   const getLink = (item) =>
//     item && typeof item === "object" ? item.link || "#" : "#";
//   const getIsNew = (item) => !!(item && typeof item === "object" && item.isNew);
//   const rowHeightD = 50;
//   const rowHeightM = 28;
//   return (
//     <>
//       <style>{`
//         ${rows
//           .map(
//             (_, i) => `
//           @keyframes mq-${animId}-${i}     { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
//           @keyframes mq-${animId}-mob-${i} { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
//           .mq-${animId}-${i}     { animation: mq-${animId}-${i}     20s linear infinite; will-change:transform; }
//           .mq-${animId}-mob-${i} { animation: mq-${animId}-mob-${i} 20s linear infinite; will-change:transform; }
//           .mq-${animId}-${i}:hover,
//           .mq-${animId}-mob-${i}:hover { animation-play-state: paused; }
//         `,
//           )
//           .join("")}
//         .mband-desk-${animId} { display: flex; }
//         .mband-mob-${animId}  { display: none; }
//         @media (max-width: 768px) {
//           .mband-desk-${animId} { display: none !important; }
//           .mband-mob-${animId}  { display: block !important; }
//         }
//       `}</style>

//       {/* Desktop */}
//       <div
//         className={`mband-desk-${animId}`}
//         style={{
//           background: "#f2f2f2",
//           borderTop: "1px solid #ddd",
//           borderBottom: "1px solid #ddd",
//           minHeight: rowHeightD * ROWS,
//           width: "100%",
//         }}
//       >
//         <div
//           style={{
//             width: "100%",
//             maxWidth: "100%",
//             padding: "0 24px 0 220px",
//             display: "flex",
//             alignItems: "stretch",
//             height: "100%",
//             minHeight: rowHeightD * ROWS,
//           }}
//         >
//           <div
//             style={{
//               width: 200,
//               flexShrink: 0,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "flex-start",
//               padding: "0 32px 0 0",
//               background: "#f2f2f2",
//             }}
//           >
//             <span
//               style={{
//                 fontWeight: 500,
//                 fontSize: 20,
//                 color: "#2d3748",
//                 lineHeight: 1.35,
//                 letterSpacing: "0.01em",
//               }}
//             >
//               {labelLine1}
//               <br />
//               {labelLine2}
//             </span>
//           </div>
//           <div
//             style={{
//               width: 0,
//               flexShrink: 0,
//               borderLeft: "2px dashed #b8b8b8",
//               margin: "18px 0",
//             }}
//           />
//           <div
//             style={{
//               flex: 1,
//               overflow: "hidden",
//               display: "flex",
//               flexDirection: "column",
//               justifyContent: "center",
//               gap: 0,
//             }}
//           >
//             {rows.map((item, i) => (
//               <div
//                 key={i}
//                 style={{
//                   height: rowHeightD,
//                   background: "#f2f2f2",
//                   overflow: "hidden",
//                   display: "flex",
//                   alignItems: "center",
//                 }}
//               >
//                 {item ? (
//                   <div
//                     className={`mq-${animId}-${i}`}
//                     style={{
//                       whiteSpace: "nowrap",
//                       display: "inline-block",
//                       paddingLeft: 40,
//                     }}
//                   >
//                     {[0, 1].map((copy) => (
//                       <a
//                         key={copy}
//                         href={getLink(item)}
//                         style={{
//                           display: "inline-block",
//                           color: "#4D7C0F",
//                           fontWeight: 600,
//                           fontSize: 11,
//                           textDecoration: "underline",
//                           textUnderlineOffset: 3,
//                           whiteSpace: "nowrap",
//                           paddingRight: 80,
//                         }}
//                       >
//                         {getText(item)}
//                         {getIsNew(item) && (
//                           <span
//                             style={{
//                               marginLeft: 6,
//                               background: "#e53e3e",
//                               color: "#fff",
//                               fontSize: 10,
//                               fontWeight: 900,
//                               padding: "1px 5px",
//                               borderRadius: 3,
//                               verticalAlign: "middle",
//                             }}
//                           >
//                             NEW
//                           </span>
//                         )}
//                       </a>
//                     ))}
//                   </div>
//                 ) : (
//                   <span
//                     style={{ paddingLeft: 40, color: "#ccc", fontSize: 14 }}
//                   >
//                     —
//                   </span>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Mobile */}
//       <div
//         className={`mband-mob-${animId}`}
//         style={{
//           background: "#f2f2f2",
//           borderTop: "1px solid #ddd",
//           borderBottom: "1px solid #ddd",
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             alignItems: "stretch",
//             minHeight: rowHeightM * ROWS,
//           }}
//         >
//           <div
//             style={{
//               flexShrink: 0,
//               width: 72,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               padding: "0 4px 0 16px",
//               background: "#f2f2f2",
//             }}
//           >
//             <span
//               style={{
//                 fontWeight: 500,
//                 fontSize: 7,
//                 color: "#2d3748",
//                 lineHeight: 1.35,
//                 letterSpacing: "0.02em",
//                 textAlign: "center",
//               }}
//             >
//               {labelLine1}
//               <br />
//               {labelLine2}
//             </span>
//           </div>
//           <div
//             style={{
//               width: 0,
//               flexShrink: 0,
//               borderLeft: "2px dashed #b8b8b8",
//               margin: "10px 0",
//             }}
//           />
//           <div
//             style={{
//               flex: 1,
//               overflow: "hidden",
//               display: "flex",
//               flexDirection: "column",
//               justifyContent: "center",
//               gap: 2,
//             }}
//           >
//             {rows.map((item, i) => (
//               <div
//                 key={i}
//                 style={{
//                   height: 22,
//                   background: "#f2f2f2",
//                   overflow: "hidden",
//                   display: "flex",
//                   alignItems: "center",
//                 }}
//               >
//                 {item ? (
//                   <div
//                     className={`mq-${animId}-mob-${i}`}
//                     style={{
//                       whiteSpace: "nowrap",
//                       display: "inline-block",
//                       paddingLeft: 4,
//                     }}
//                   >
//                     {[0, 1].map((copy) => (
//                       <a
//                         key={copy}
//                         href={getLink(item)}
//                         style={{
//                           display: "inline-block",
//                           color: "#4D7C0F",
//                           fontWeight: 600,
//                           fontSize: 8,
//                           textDecoration: "underline",
//                           textUnderlineOffset: 2,
//                           whiteSpace: "nowrap",
//                           paddingRight: 60,
//                         }}
//                       >
//                         {getText(item)}
//                         {getIsNew(item) && (
//                           <span
//                             style={{
//                               marginLeft: 4,
//                               background: "#e53e3e",
//                               color: "#fff",
//                               fontSize: 8,
//                               fontWeight: 900,
//                               padding: "1px 3px",
//                               borderRadius: 2,
//                               verticalAlign: "middle",
//                             }}
//                           >
//                             NEW
//                           </span>
//                         )}
//                       </a>
//                     ))}
//                   </div>
//                 ) : (
//                   <span
//                     style={{ paddingLeft: 10, color: "#ccc", fontSize: 10 }}
//                   >
//                     —
//                   </span>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// function VacanciesBand({ items = [] }) {
//   return (
//     <MarqueeBand
//       labelLine1="LATEST"
//       labelLine2="VACANCIES"
//       items={items}
//       animId="vac"
//     />
//   );
// }

// function ResultsBand({ items = [] }) {
//   const displayItems =
//     items.length === 0
//       ? [{ english: "Coming Soon", hindi: "जल्द ही आ रहा है", link: "#" }]
//       : items;
//   return (
//     <MarqueeBand
//       labelLine1="Latest"
//       labelLine2="Results"
//       items={displayItems}
//       animId="res"
//     />
//   );
// }

// /* ─── Vertical Notification Ticker ─── */
// function NotificationTicker({
//   notifications = [],
//   onSeeMore,
//   isMobile = false,
// }) {
//   const tickerRef = useRef(null);
//   const innerRef = useRef(null);
//   const animRef = useRef(null);
//   const posRef = useRef(0);

//   useEffect(() => {
//     const ticker = tickerRef.current;
//     const inner = innerRef.current;
//     if (!ticker || !inner || notifications.length === 0) return;
//     posRef.current = 0;
//     inner.style.transform = "translateY(0px)";
//     const SPEED = isMobile ? 0.4 : 0.5;
//     const tick = () => {
//       posRef.current += SPEED;
//       const halfH = inner.scrollHeight / 2;
//       if (halfH > 0 && posRef.current >= halfH) posRef.current = 0;
//       inner.style.transform = `translateY(-${posRef.current}px)`;
//       animRef.current = requestAnimationFrame(tick);
//     };
//     animRef.current = requestAnimationFrame(tick);
//     const pause = () => cancelAnimationFrame(animRef.current);
//     const resume = () => {
//       animRef.current = requestAnimationFrame(tick);
//     };
//     ticker.addEventListener("mouseenter", pause);
//     ticker.addEventListener("mouseleave", resume);
//     return () => {
//       cancelAnimationFrame(animRef.current);
//       ticker.removeEventListener("mouseenter", pause);
//       ticker.removeEventListener("mouseleave", resume);
//     };
//   }, [notifications, isMobile]);

//   const fs = isMobile ? 11 : 13;
//   const pad = isMobile ? "9px 11px" : "11px 14px";
//   const height = isMobile ? 130 : 200;

//   const cards = notifications.slice(0, 8).map((n, i) => (
//     <a
//       key={i}
//       href={n.url || "#"}
//       target={n.url ? "_blank" : undefined}
//       rel={n.url ? "noopener noreferrer" : undefined}
//       style={{
//         display: "block",
//         color: "#000",
//         fontWeight: 700,
//         fontSize: fs,
//         padding: pad,
//         lineHeight: 1.7,
//         textDecoration: "underline",
//         textUnderlineOffset: 2,
//         borderBottom: "1px dotted rgba(0,0,0,0.2)",
//         flexShrink: 0,
//       }}
//     >
//       {">>"} {n.title}{" "}
//       <span
//         style={{
//           display: "inline-block",
//           fontSize: isMobile ? 7 : 9,
//           fontWeight: 900,
//           padding: "1px 4px",
//           borderRadius: 2,
//           verticalAlign: "middle",
//           animation: "newBadge 1.5s infinite",
//           color: "#fff",
//           letterSpacing: "0.04em",
//         }}
//       >
//         NEW
//       </span>
//     </a>
//   ));

//   return (
//     <div
//       style={{
//         flex: 1,
//         height: "100%",
//         borderRadius: 4,
//         padding: isMobile ? 10 : 20,
//         background: GREEN,
//         display: "flex",
//         flexDirection: "column",
//       }}
//     >
//       <h2
//         style={{
//           color: "#fff",
//           fontWeight: 900,
//           fontSize: isMobile ? 12 : 22,
//           marginBottom: isMobile ? 8 : 14,
//           flexShrink: 0,
//         }}
//       >
//         Notification
//       </h2>
//       {notifications.length === 0 ? (
//         <div
//           style={{
//             color: "rgba(255,255,255,0.8)",
//             fontSize: isMobile ? 10 : 13,
//             padding: isMobile ? "6px 8px" : "10px 12px",
//             textAlign: "center",
//           }}
//         >
//           No notifications available
//         </div>
//       ) : (
//         <div
//           ref={tickerRef}
//           style={{
//             height: height,
//             overflow: "hidden",
//             flex: 1,
//             cursor: "pointer",
//           }}
//         >
//           <div ref={innerRef} style={{ willChange: "transform" }}>
//             {cards}
//             {cards}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// /* ─── Cert Slider ─── */
// function CertSlider() {
//   const [current, setCurrent] = useState(0);
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

//   useEffect(() => {
//     const onResize = () => {
//       setIsMobile(window.innerWidth <= 768);
//       setCurrent(0);
//     };
//     window.addEventListener("resize", onResize);
//     return () => window.removeEventListener("resize", onResize);
//   }, []);

//   const certImages = [
//     { src: cert1, alt: "Certificate 1" },
//     { src: cert2, alt: "Certificate 2" },
//     { src: cert3, alt: "Certificate 3" },
//     { src: cert4, alt: "Certificate 4" },
//     { src: cert5, alt: "Certificate 5" },
//     { src: cert6, alt: "Certificate 6" },
//     { src: cert7, alt: "Certificate 7" },
//     { src: cert8, alt: "Certificate 8" },
//     { src: cert9, alt: "Certificate 9" },
//     { src: cert10, alt: "Certificate 10" },
//     { src: cert11, alt: "Certificate 11" },
//     { src: cert12, alt: "Certificate 12" },
//     { src: cert13, alt: "Certificate 13" },
//     { src: cert14, alt: "Certificate 14" },
//     { src: cert15, alt: "Certificate 15" },
//   ];

//   const visibleCount = 4;
//   const cardHeight = isMobile ? 90 : 220;
//   const maxSlide = certImages.length - visibleCount;

//   useEffect(() => {
//     const t = setInterval(() => {
//       setCurrent((c) => (c >= maxSlide ? 0 : c + 1));
//     }, 2500);
//     return () => clearInterval(t);
//   }, [maxSlide]);

//   return (
//     <div
//       style={{
//         margin: "0 auto 24px",
//         position: "relative",
//         padding: isMobile ? "0 44px" : "0 36px",
//       }}
//     >
//       <div style={{ overflow: "hidden" }}>
//         <div
//           style={{
//             display: "flex",
//             gap: isMobile ? 4 : 12,
//             transform: `translateX(-${current * (100 / visibleCount)}%)`,
//             transition: "transform 0.4s ease",
//           }}
//         >
//           {certImages.map((img, i) => (
//             <img
//               key={i}
//               src={img.src}
//               alt={img.alt}
//               style={{
//                 flexShrink: 0,
//                 width: `calc(${100 / visibleCount}% - 9px)`,
//                 height: cardHeight,
//                 objectFit: "contain",
//                 display: "block",
//               }}
//             />
//           ))}
//         </div>
//       </div>
//       {current > 0 && (
//         <button
//           onClick={() => setCurrent((c) => Math.max(0, c - 1))}
//           style={{
//             position: "absolute",
//             left: 0,
//             top: "50%",
//             transform: "translateY(-50%)",
//             background: "#fff",
//             borderRadius: "50%",
//             border: "2px solid #3AB000",
//             width: isMobile ? 36 : 30,
//             height: isMobile ? 36 : 30,
//             fontSize: isMobile ? 22 : 18,
//             cursor: "pointer",
//             color: "#3AB000",
//             fontWeight: 900,
//           }}
//         >
//           ‹
//         </button>
//       )}
//       {current < maxSlide && (
//         <button
//           onClick={() => setCurrent((c) => Math.min(maxSlide, c + 1))}
//           style={{
//             position: "absolute",
//             right: 0,
//             top: "50%",
//             transform: "translateY(-50%)",
//             background: "#fff",
//             borderRadius: "50%",
//             border: "2px solid #3AB000",
//             width: isMobile ? 36 : 30,
//             height: isMobile ? 36 : 30,
//             fontSize: isMobile ? 22 : 18,
//             cursor: "pointer",
//             color: "#3AB000",
//             fontWeight: 900,
//           }}
//         >
//           ›
//         </button>
//       )}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "center",
//           gap: isMobile ? 4 : 6,
//           marginTop: isMobile ? 8 : 14,
//         }}
//       >
//         {Array.from({ length: maxSlide + 1 }, (_, i) => (
//           <button
//             key={i}
//             onClick={() => setCurrent(i)}
//             style={{
//               width: isMobile ? 6 : 10,
//               height: isMobile ? 6 : 10,
//               borderRadius: "50%",
//               border: "none",
//               cursor: "pointer",
//               background: i === current ? "#3AB000" : "#ccc",
//               padding: 0,
//               transition: "background 0.2s",
//             }}
//           />
//         ))}
//       </div>
//     </div>
//   );
// }

// const PersonIcon = ({ color = "#1a1a1a", size = 36 }) => (
//   <svg width={size} height={size} viewBox="0 0 46 46" fill={color}>
//     <circle cx="23" cy="14" r="9" />
//     <ellipse cx="23" cy="36" rx="14" ry="9" />
//   </svg>
// );

// const DoctorIcon = ({ size = 36 }) => (
//   <svg width={size} height={size} viewBox="0 0 46 46" fill="#1a1a1a">
//     <circle cx="23" cy="11" r="8" />
//     <path d="M9 46 Q9 29 23 29 Q37 29 37 46Z" />
//     <circle
//       cx="31"
//       cy="39"
//       r="4"
//       fill="none"
//       stroke="#1a1a1a"
//       strokeWidth="2"
//     />
//     <path
//       d="M27 35 Q25 25 21 23"
//       fill="none"
//       stroke="#1a1a1a"
//       strokeWidth="2"
//     />
//   </svg>
// );

// const YogaIcon = ({ size = 36 }) => (
//   <svg
//     width={size}
//     height={size}
//     viewBox="0 0 46 46"
//     fill="none"
//     stroke="#1a1a1a"
//     strokeWidth="2.2"
//     strokeLinecap="round"
//   >
//     <circle cx="23" cy="9" r="5" fill="#1a1a1a" stroke="none" />
//     <line x1="23" y1="14" x2="23" y2="27" />
//     <line x1="23" y1="19" x2="8" y2="25" />
//     <line x1="23" y1="19" x2="38" y2="25" />
//     <line x1="23" y1="27" x2="15" y2="38" />
//     <line x1="23" y1="27" x2="31" y2="38" />
//     <line x1="15" y1="38" x2="25" y2="33" />
//     <line x1="31" y1="38" x2="21" y2="33" />
//   </svg>
// );

// /* ─── Floating Buttons ─── */
// function FloatingButtons() {
//   return (
//     <>
//       <div style={{ position: "fixed", left: 20, bottom: 20, zIndex: 1000 }}>
//         <a
//           href="tel:9471987611"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             width: 60,
//             height: 60,
//             borderRadius: "50%",
//             background: "linear-gradient(135deg, #3AB000 0%, #2d8a00 100%)",
//             color: "#fff",
//             boxShadow: "0 4px 12px rgba(58, 176, 0, 0.4)",
//             textDecoration: "none",
//           }}
//           title="Call Us"
//         >
//           <svg
//             width="28"
//             height="28"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="2.5"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           >
//             <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
//           </svg>
//         </a>
//       </div>
//       <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 1000 }}>
//         <a
//           href="https://wa.me/919471987611"
//           target="_blank"
//           rel="noopener noreferrer"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             width: 60,
//             height: 60,
//             borderRadius: "50%",
//             background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
//             color: "#fff",
//             boxShadow: "0 4px 12px rgba(37, 211, 102, 0.4)",
//             textDecoration: "none",
//           }}
//           title="WhatsApp"
//         >
//           <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
//             <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
//           </svg>
//         </a>
//       </div>
//     </>
//   );
// }

// /* ─── HOME PAGE ─── */
// function HomePage({ onNavigate }) {
//   const [slide, setSlide] = useState(0);
//   const [slides, setSlides] = useState(fallbackSlides);
//   const [scrollerImages, setScrollerImages] = useState([]);
//   const [results, setResults] = useState([]);
//   const [vacancies, setVacancies] = useState([]);
//   const [notifications, setNotifications] = useState([]);
//   const [loadingVacancies, setLoadingVacancies] = useState(true);
//   const [loadingResults, setLoadingResults] = useState(true);

//   useEffect(() => {
//     const fetch_ = async () => {
//       try {
//         const res = await scrollerAPI.getAll(null);
//         if (res?.success && res.data) {
//           const allImages = res.data.scrollerImages || [];
//           const validImages = allImages.filter(
//             (img) => img.imageUrl && img.imageUrl.trim() !== "",
//           );
//           if (validImages.length > 0) {
//             const sortedImages = validImages.sort((a, b) => {
//               if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
//               return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
//             });
//             setSlides(sortedImages.map((i) => i.imageUrl));
//             setScrollerImages(sortedImages);
//             setSlide(0);
//           } else setSlides(fallbackSlides);
//         } else setSlides(fallbackSlides);
//       } catch {
//         setSlides(fallbackSlides);
//       }
//     };
//     fetch_();
//   }, []);

//   useEffect(() => {
//     if (slides.length > 0) {
//       const t = setInterval(
//         () => setSlide((s) => (s + 1) % slides.length),
//         4000,
//       );
//       return () => clearInterval(t);
//     }
//   }, [slides.length]);

//   useEffect(() => {
//     const fetch_ = async () => {
//       try {
//         setLoadingVacancies(true);
//         const r = await jobPostingsAPI.getLatestVacancies();
//         setVacancies(r.success && r.data.vacancies ? r.data.vacancies : []);
//       } catch {
//         setVacancies([]);
//       } finally {
//         setLoadingVacancies(false);
//       }
//     };
//     fetch_();
//     const iv = setInterval(fetch_, 30000);
//     return () => clearInterval(iv);
//   }, []);

//   useEffect(() => {
//     setResults([]);
//     setLoadingResults(false);
//   }, []);

//   useEffect(() => {
//     const fetch_ = async () => {
//       try {
//         const r = await notificationsAPI.getAll("true");
//         setNotifications(r.success && r.data ? r.data.notifications || [] : []);
//       } catch {
//         setNotifications([]);
//       }
//     };
//     fetch_();
//     const iv = setInterval(fetch_, 30000);
//     return () => clearInterval(iv);
//   }, []);

//   const statsData = [
//     {
//       icon: <PersonIcon color="#1a1a1a" size={46} />,
//       mobileIcon: <PersonIcon color="#1a1a1a" size={28} />,
//       num: "2265",
//       label: "Joined Us",
//     },
//     {
//       icon: <PersonIcon color="#1a1a1a" size={46} />,
//       mobileIcon: <PersonIcon color="#1a1a1a" size={28} />,
//       num: "2185",
//       label: "Took Benifits",
//     },
//     {
//       icon: <DoctorIcon size={46} />,
//       mobileIcon: <DoctorIcon size={28} />,
//       num: "2265",
//       label: "Medical Camps Organised",
//     },
//     {
//       icon: <YogaIcon size={46} />,
//       mobileIcon: <YogaIcon size={28} />,
//       num: "2185",
//       label: "Yoga Camps Organised",
//     },
//   ];

//   return (
//     <>
//       {/* Slider + Stats */}
//       <div className="slider-stats-wrap">
//         <div className="slider-area">
//           {slides.length > 0 ? (
//             <>
//               {slides.map((src, i) => {
//                 const si = scrollerImages[i];
//                 const imgEl = (
//                   <img
//                     key={i}
//                     src={src}
//                     alt={si?.title || `slide ${i + 1}`}
//                     style={{
//                       position: "absolute",
//                       inset: 0,
//                       width: "100%",
//                       height: "100%",
//                       objectFit: "cover",
//                       opacity: i === slide ? 1 : 0,
//                       transition: "opacity 0.8s ease",
//                     }}
//                     onError={(e) => (e.target.style.display = "none")}
//                   />
//                 );
//                 if (si?.link)
//                   return (
//                     <a
//                       key={i}
//                       href={si.link}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       style={{
//                         position: "absolute",
//                         inset: 0,
//                         display: i === slide ? "block" : "none",
//                       }}
//                     >
//                       {imgEl}
//                     </a>
//                   );
//                 return (
//                   <div
//                     key={i}
//                     style={{
//                       position: "absolute",
//                       inset: 0,
//                       display: i === slide ? "block" : "none",
//                     }}
//                   >
//                     {imgEl}
//                   </div>
//                 );
//               })}
//               {slides.length > 1 && (
//                 <>
//                   <button
//                     onClick={() =>
//                       setSlide((s) => (s - 1 + slides.length) % slides.length)
//                     }
//                     style={{
//                       position: "absolute",
//                       left: 6,
//                       top: "50%",
//                       transform: "translateY(-50%)",
//                       background: "rgba(255,255,255,0.7)",
//                       border: "none",
//                       borderRadius: "50%",
//                       width: 34,
//                       height: 34,
//                       fontSize: 22,
//                       cursor: "pointer",
//                       zIndex: 10,
//                     }}
//                   >
//                     ‹
//                   </button>
//                   <button
//                     onClick={() => setSlide((s) => (s + 1) % slides.length)}
//                     style={{
//                       position: "absolute",
//                       right: 6,
//                       top: "50%",
//                       transform: "translateY(-50%)",
//                       background: "rgba(255,255,255,0.7)",
//                       border: "none",
//                       borderRadius: "50%",
//                       width: 34,
//                       height: 34,
//                       fontSize: 22,
//                       cursor: "pointer",
//                       zIndex: 10,
//                     }}
//                   >
//                     ›
//                   </button>
//                 </>
//               )}
//             </>
//           ) : (
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 height: "100%",
//                 minHeight: "200px",
//                 background: "#f5f5f5",
//                 color: "#666",
//                 fontSize: "14px",
//               }}
//             >
//               Loading...
//             </div>
//           )}
//           <div
//             style={{
//               position: "absolute",
//               bottom: 6,
//               left: "50%",
//               transform: "translateX(-50%)",
//               display: "flex",
//               gap: 6,
//             }}
//           >
//             {slides.map((_, i) => (
//               <button
//                 key={i}
//                 onClick={() => setSlide(i)}
//                 style={{
//                   width: 8,
//                   height: 8,
//                   borderRadius: "50%",
//                   border: "none",
//                   cursor: "pointer",
//                   background: i === slide ? "#fff" : "rgba(255,255,255,0.45)",
//                   padding: 0,
//                 }}
//               />
//             ))}
//           </div>
//         </div>
//         <div className="stats-area">
//           {statsData.map((s, i) => (
//             <div key={i} className="stat-cell">
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 10,
//                   justifyContent: "flex-start",
//                   width: "100%",
//                 }}
//               >
//                 <span className="stat-icon-desktop">{s.icon}</span>
//                 <span className="stat-icon-mobile">{s.mobileIcon}</span>
//                 <div style={{ display: "flex", flexDirection: "column" }}>
//                   <span
//                     className="stat-num"
//                     style={{
//                       fontWeight: 700,
//                       color: "#1a1a1a",
//                       fontSize: 22,
//                       lineHeight: 1.2,
//                     }}
//                   >
//                     <CounterNumber target={s.num} />
//                   </span>
//                   <span
//                     className="stat-label"
//                     style={{
//                       color: "#333",
//                       fontWeight: 600,
//                       textAlign: "left",
//                       lineHeight: 1.4,
//                     }}
//                   >
//                     {s.label}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Vacancies Band */}
//       <div style={{ marginTop: 24 }}>
//         <VacanciesBand items={vacancies} />
//       </div>

//       {/* Notice + App Images */}
//       <div
//         className="notice-app-wrap"
//         style={{ background: "#fce8f0", padding: "50px 0 0", marginTop: 24 }}
//       >
//         <div className="notice-app-inner" style={{ padding: "0 80px 0 140px" }}>
//           <p
//             className="body-text notice-text"
//             style={{
//               lineHeight: 2.4,
//               color: "#1a1a1a",
//               marginBottom: 28,
//               textAlign: "justify",
//               fontWeight: 400,
//               fontSize: 18,
//             }}
//           >
//             <strong>NOTICE/सूचना:</strong> जिन अभ्यर्थियों का नाम जिला प्रबंधक
//             पद विज्ञापन सं: JSSA/REQ/01/2025/P–III तथा ब्लॉक सुपरवाइजर सह पंचायत
//             कार्यपालक विज्ञापन सं: JSSA/REQ/02/2025/P–III तथा पंचायत कार्यपालक
//             विज्ञापन सं: JSSA/REQ/03/2026/P–III के अंतर्गत प्रथम मेधा सूची में
//             जारी किया गया है वे अभ्यर्थी कृपया ऑनलाइन एमओयू और सहमति प्रपत्र
//             अंतिम तिथि 02/03/2026 से पहले भर लें। Candidates whose name has been
//             released in the first merit list under District Manager Advt. No:
//             JSSA/REQ/01/2025/P–III &amp; Block Supervisor Cum Panchayat
//             Executive Advt. No: JSSA/REQ/02/2025/P–III &amp; Panchayat Executive
//             Advt. No: JSSA/REQ/03/2025/P–III those candidates please fill the
//             online MoU and consent form before the last date 02/03/2026. Failure
//             to submit the required documents within the stipulated date may lead
//             to cancellation of candidate.
//           </p>
//           <div
//             className="body-text notice-important"
//             style={{
//               background: "#f8b4b4",
//               padding: "20px 24px",
//               borderRadius: 3,
//               fontWeight: 600,
//               color: "#1a1a1a",
//               marginBottom: 28,
//               textAlign: "center",
//               fontSize: 19,
//             }}
//           >
//             IMPORTANT NOTICE:– जन स्वास्थ्य सहायता अभियान के कार्यक्रमों को
//             जमीनी स्तर पर शुरुवात करने हेतु आवश्यक अधिसूचना।
//           </div>
//           <div
//             className="action-btns-row"
//             style={{ display: "flex", gap: 20, marginBottom: 32 }}
//           >
//             {[
//               "Online Test & Interview",
//               "Online Mou & Consent Form",
//               "Authorized Login",
//             ].map((btn, i) => (
//               <button
//                 key={i}
//                 className="action-btn"
//                 style={{
//                   flex: 1,
//                   background: "#2ecc1a",
//                   color: "#000",
//                   fontWeight: 700,
//                   padding: "18px 6px",
//                   borderRadius: 5,
//                   border: "none",
//                   cursor: "pointer",
//                   lineHeight: 1.3,
//                   fontSize: 15,
//                   boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
//                   whiteSpace: "nowrap",
//                   overflow: "hidden",
//                   textOverflow: "ellipsis",
//                 }}
//               >
//                 {btn}
//               </button>
//             ))}
//           </div>
//           <div
//             className="app-imgs-row"
//             style={{
//               display: "flex",
//               alignItems: "flex-end",
//               justifyContent: "space-between",
//               gap: 16,
//             }}
//           >
//             {[appImg1, appImg2, appImg3].map((src, i) => (
//               <img
//                 key={i}
//                 src={src}
//                 alt={`app${i + 1}`}
//                 className="app-img"
//                 style={{
//                   width: "31%",
//                   height: "auto",
//                   objectFit: "contain",
//                   display: "block",
//                 }}
//               />
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Results Band */}
//       <div style={{ marginTop: 24 }}>
//         <ResultsBand items={results} />
//       </div>

//       {/* Organization Info */}
//       <div
//         className="org-info-wrap"
//         style={{ background: "#e8f5e2", padding: "50px 0", marginTop: 24 }}
//       >
//         <div
//           className="org-info-inner"
//           style={{ padding: "0 100px 0 200px", textAlign: "center" }}
//         >
//           <p
//             className="body-text org-text"
//             style={{ color: "#333", lineHeight: 1.9, margin: 0 }}
//           >
//             This project is organized Under social welfare orgenization 'NAC"
//             Registration No. : 053083 incorporated under [Pursuant to
//             sub-section (2) of section 7 and sub-section (1) of section 8 of the
//             Companies Act, 2013 (18 of 2013) and rule 18 of the Companies
//             (Incorporation) Rules, 2014].
//           </p>
//         </div>
//       </div>

//       {/* Public Notice */}
//       <div
//         className="public-notice-wrap"
//         style={{
//           padding: "24px 100px 24px 200px",
//           textAlign: "center",
//           background: "#fffde8",
//           marginTop: 24,
//         }}
//       >
//         <div
//           className="pub-notice-title"
//           style={{
//             display: "inline-block",
//             border: "2px solid #374151",
//             padding: "8px 20px",
//             fontWeight: 900,
//             marginBottom: 16,
//           }}
//         >
//           सार्वजनिक सूचना / PUBLIC NOTICE:
//         </div>
//         <p
//           className="body-text"
//           style={{ margin: "0 auto 12px", lineHeight: 1.9, color: "#555" }}
//         >
//           हमारे संस्था द्वारा सदस्यता शुल्क, जाद आवेदन शुल्क एवं एमओयू और सहमति
//           शुल्क के अलावा कोई अतिरिक्त शुल्क नहीं लिया जाता हैं।
//         </p>
//         <p
//           className="body-text"
//           style={{ margin: "0 auto", lineHeight: 1.9, color: "#555" }}
//         >
//           No extra fee is charged by our organization other than membership fee,
//           job application fee and MOU and consent fee.
//         </p>
//       </div>

//       {/* ── Notification — Desktop ── */}
//       <div
//         className="notif-cards-desktop"
//         style={{ background: "#fff", padding: "20px 0", marginTop: 24 }}
//       >
//         <div
//           style={{
//             margin: "0 auto 0 12%",
//             width: "82%",
//             display: "flex",
//             gap: 20,
//             alignItems: "stretch",
//           }}
//         >
//           <div
//             style={{
//               flex: "1 1 0",
//               minWidth: 0,
//               display: "flex",
//               flexDirection: "column",
//             }}
//           >
//             <NotificationTicker
//               notifications={notifications}
//               onSeeMore={() => onNavigate("notifications")}
//               isMobile={false}
//             />
//           </div>
//           <div
//             style={{
//               flex: "1 1 0",
//               minWidth: 0,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               border: "2px solid #e0e0e0",
//               borderRadius: 4,
//               overflow: "hidden",
//             }}
//           >
//             <img
//               src={cardImg1}
//               alt="JSS Card"
//               style={{ width: "100%", height: "auto", display: "block" }}
//             />
//           </div>
//         </div>
//       </div>

//       {/* ── Notifications + Cards — Mobile ── */}
//       <div
//         className="notif-cards-mobile"
//         style={{
//           display: "none",
//           gap: 10,
//           padding: "0 12px",
//           background: "#fff",
//           alignItems: "center",
//         }}
//       >
//         <div style={{ flex: "1 1 0", minWidth: 0 }}>
//           <NotificationTicker
//             notifications={notifications}
//             onSeeMore={() => onNavigate("notifications")}
//             isMobile={true}
//           />
//         </div>
//         <div
//           style={{
//             flex: "1 1 0",
//             minWidth: 0,
//             display: "flex",
//             alignItems: "center",
//             border: "2px solid #e0e0e0",
//             borderRadius: 4,
//             overflow: "hidden",
//           }}
//         >
//           <img
//             src={cardImg1}
//             alt="JSS Card"
//             style={{ width: "100%", height: "auto", display: "block" }}
//           />
//         </div>
//       </div>

//       {/* Intro Section */}
//       <div
//         className="intro-section"
//         style={{
//           borderTop: `4px solid ${GREEN}`,
//           borderBottom: `4px solid ${GREEN}`,
//           padding: "40px 0",
//           background: "#fff",
//           marginTop: 24,
//         }}
//       >
//         <div style={{ padding: "0 80px 0 140px" }}>
//           <div className="intro-inner" style={{ display: "flex", gap: 48 }}>
//             <div style={{ flex: "1 1 0" }}>
//               <h3
//                 className="intro-heading"
//                 style={{
//                   fontWeight: 900,
//                   color: "#1a1a1a",
//                   marginBottom: 14,
//                   fontSize: 15,
//                   letterSpacing: "0.02em",
//                 }}
//               >
//                 JAN SWASTHYA SAHAYATA ABHIYAN
//               </h3>
//               <p
//                 className="body-text"
//                 style={{ lineHeight: 1.9, color: "#333", marginBottom: 20 }}
//               >
//                 <strong>Introduction :</strong> Jan Swasthya Sahayata Abhiyan
//                 has been formed by the Healthcare Research and Development Board
//                 (Division of Social Welfare Organization "NAC".) to provide
//                 affordable, free &amp; better treatment with health related
//                 assistance to poor and needy people.
//               </p>
//               <p
//                 className="body-text"
//                 style={{ lineHeight: 1.9, color: "#333" }}
//               >
//                 <strong>Purpose :</strong> To provide better treatment by
//                 special doctors, medicines and medical tests to the poor and
//                 needy people of the country through Jan Swasthya Sahayata
//                 Abhiyan. Also motivating people to follow the guidelines given
//                 by the government to stay safe from COVID 19 by organizing
//                 awareness programs &amp; providing health related ...{" "}
//                 <button
//                   onClick={() => onNavigate("about")}
//                   style={{
//                     color: BLUE_TEXT,
//                     background: "none",
//                     border: "none",
//                     cursor: "pointer",
//                     padding: 0,
//                     fontSize: "inherit",
//                     fontWeight: 600,
//                   }}
//                 >
//                   read more
//                 </button>
//               </p>
//             </div>
//             <div style={{ flex: "1 1 0" }}>
//               <h3
//                 className="intro-heading"
//                 style={{
//                   fontWeight: 900,
//                   color: "#1a1a1a",
//                   marginBottom: 14,
//                   fontSize: 18,
//                   fontFamily: "serif",
//                 }}
//               >
//                 जन स्वास्थ्य सहायता अभियान
//               </h3>
//               <p
//                 className="body-text"
//                 style={{ lineHeight: 1.9, color: "#333", marginBottom: 20 }}
//               >
//                 <strong>परिचय :</strong> जन स्वास्थ्य सहायता अभियान का गठन
//                 हेल्थकेयर रिसर्च एंड डेवलपमेंट बोर्ड (Division Of Social Welfare
//                 Organization "NAC".) द्वारा सस्ती, निःशुल्क एवं बेहतर इलाज तथा
//                 गरीब एवं जरूरतमंद लोगों को स्वास्थ्य संबंधित सहायता मुहैया
//                 करवाने के लिए किया गया है।
//               </p>
//               <p
//                 className="body-text"
//                 style={{ lineHeight: 1.9, color: "#333" }}
//               >
//                 <strong>उद्देश्य :</strong> जन स्वास्थ्य सहायता अभियान के माध्यम
//                 से देश के गरीब और जरूरतमंद लोगों को चिकिसक, दवाईयां और चिकिसा
//                 जांच द्वारा बेहतर उपचार प्रदान करना, साथ ही जागरूकता कार्यक्रम
//                 आयोजित कर COVID 19 से सुरक्षित रहने के लिए सरकार द्वारा दिए गए
//                 दिशा-निर्देशों का पालन करने हेतु लोगों को प्रेरित करना और स्वस्थ
//                 रहने के लिए योग और व्यायाम प्रशिक्षण के साथ स्वास्थ्य संबंधित
//                 सहायता ...{" "}
//                 <button
//                   onClick={() => onNavigate("about")}
//                   style={{
//                     color: BLUE_TEXT,
//                     background: "none",
//                     border: "none",
//                     cursor: "pointer",
//                     padding: 0,
//                     fontSize: "inherit",
//                     fontWeight: 600,
//                   }}
//                 >
//                   अधिक पढ़ें
//                 </button>
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Certificates */}
//       <div
//         className="cert-section"
//         style={{
//           padding: "28px 100px 28px 200px",
//           background: "#f8f8f8",
//           marginTop: 24,
//         }}
//       >
//         <CertSlider />
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(4, 1fr)",
//             gap: 10,
//           }}
//           className="cert-btn-grid"
//         >
//           {[
//             { label: "Enquiry", page: null },
//             { label: "Broucher", page: null, pdf: brochurePDF },
//             { label: "Membership", page: "membership" },
//             { label: "Services", page: "services" },
//           ].map((btn, i) => (
//             <button
//               key={i}
//               className="cert-btn"
//               onClick={() => {
//                 if (btn.page) onNavigate(btn.page);
//                 else if (btn.pdf) window.open(btn.pdf, "_blank");
//               }}
//               style={{
//                 background: GREEN,
//                 color: "#000",
//                 fontWeight: 900,
//                 padding: "14px 4px",
//                 borderRadius: 4,
//                 border: "none",
//                 cursor: btn.page || btn.pdf ? "pointer" : "default",
//               }}
//             >
//               {btn.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* ── Accreditations ── */}
//       {/* FIXED: outer uses padding "32px 0", inner div uses "0 100px" to match all other sections */}
//       <div
//         className="accred-section"
//         style={{
//           background: "#fff",
//           borderTop: "1px solid #eee",
//           marginTop: 24,
//           padding: "32px 0",
//         }}
//       >
//         <div
//           style={{
//             margin: "0 auto 0 12%",
//             width: "82%",
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//           }}
//         >
//           <p
//             className="accred-label"
//             style={{
//               fontWeight: 700,
//               color: "#aaa",
//               letterSpacing: "0.1em",
//               textTransform: "uppercase",
//               marginBottom: 18,
//               textAlign: "center",
//             }}
//           >
//             ACCREDITATIONS &amp; FOLLOWS GUIDELINES
//           </p>
//           <div
//             className="accred-logos"
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               gap: 48,
//               flexWrap: "wrap",
//               width: "100%",
//             }}
//           >
//             {[myGovLogo, unicefLogo, nitiAayogLogo, msmeLogo].map((src, i) => (
//               <img
//                 key={i}
//                 src={src}
//                 alt={`accreditation-${i}`}
//                 className="accred-logo"
//                 style={{ width: "auto", objectFit: "contain" }}
//               />
//             ))}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// /* ══════════════════════════════════════════════════════
//    MAIN EXPORT
//    ══════════════════════════════════════════════════════ */
// export default function JSSAbhiyan() {
//   const routerNavigate = useNavigate();
//   const location = useLocation();
//   const activePage = PATH_TO_PAGE[location.pathname] || "home";

//   const navigate = (page) => {
//     const path = PAGE_TO_PATH[page] || "/";
//     routerNavigate(path);
//     window.scrollTo(0, 0);
//   };

//   const renderPage = () => {
//     switch (activePage) {
//       case "about":
//         return <AboutPage onNavigate={navigate} />;
//       case "membership":
//         return <MembershipPage />;
//       case "services":
//         return <ServicesPage />;
//       case "jobs":
//         return <JobsPage />;
//       case "notifications":
//         return <NotificationsPage />;
//       case "gallery":
//         return <GalleryPage />;
//       case "verification":
//         return <VerificationPage />;
//       case "contacts":
//         return <ContactsPage />;
//       default:
//         return <HomePage onNavigate={navigate} />;
//     }
//   };

//   const socialLinks = [
//     {
//       bg: "#1877f2",
//       url: "https://www.facebook.com/",
//       content: (
//         <span
//           style={{
//             fontWeight: 900,
//             fontSize: 16,
//             color: "#fff",
//             lineHeight: 1,
//           }}
//         >
//           f
//         </span>
//       ),
//     },
//     {
//       bg: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285aeb 90%)",
//       url: "https://www.instagram.com/jssabhiyan8/?hl=en",
//       content: (
//         <svg
//           viewBox="0 0 24 24"
//           width="16"
//           height="16"
//           fill="none"
//           stroke="white"
//           strokeWidth="2.2"
//         >
//           <rect x="2" y="2" width="20" height="20" rx="5" />
//           <circle cx="12" cy="12" r="5" />
//           <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none" />
//         </svg>
//       ),
//     },
//     {
//       bg: "#ff0000",
//       url: "https://www.youtube.com/@janswasthyasahayataabhiyan8183",
//       content: (
//         <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
//           <polygon points="9.5,7 9.5,17 18,12" />
//         </svg>
//       ),
//     },
//     {
//       bg: "#0077b5",
//       url: "https://www.linkedin.com/in/jss-abhiyan-3872b13b7/",
//       content: (
//         <span style={{ fontWeight: 900, fontSize: 12, color: "#fff" }}>in</span>
//       ),
//     },
//   ];

//   return (
//     <div
//       style={{
//         fontFamily: "'Segoe UI', sans-serif",
//         color: "#333",
//         background: "#fff",
//         overflowX: "hidden",
//         margin: 0,
//         padding: 0,
//       }}
//     >
//       {/* Top Bar */}
//       <div
//         className="tb-topbar"
//         style={{
//           background: GREEN,
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "8px 20px",
//           gap: 8,
//           height: 54,
//           flexWrap: "nowrap",
//           position: "relative",
//         }}
//       >
//         {/* LEFT: Phone + Email */}
//         <div
//           className="tb-left"
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 24,
//             flexShrink: 0,
//             marginLeft: "10%",
//           }}
//         >
//           <span
//             className="tb-phone"
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 6,
//               color: "#000",
//               fontSize: 18,
//               fontWeight: 500,
//               whiteSpace: "nowrap",
//             }}
//           >
//             <svg
//               width="17"
//               height="17"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="black"
//               strokeWidth="2"
//             >
//               <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
//             </svg>
//             9471987611
//           </span>
//           <span
//             className="tb-email"
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 6,
//               color: "#000",
//               fontSize: 18,
//               fontWeight: 500,
//               whiteSpace: "nowrap",
//             }}
//           >
//             <svg
//               width="17"
//               height="17"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="black"
//               strokeWidth="2"
//             >
//               <rect x="2" y="4" width="20" height="16" rx="2" />
//               <path d="M2 7l10 7 10-7" />
//             </svg>
//             support@jssabhiyan.com
//           </span>
//         </div>

//         {/* CENTER: Search bar */}
//         <div
//           className="tb-search"
//           style={{
//             position: "absolute",
//             left: "58%",
//             transform: "translateX(-50%)",
//             display: "flex",
//             alignItems: "center",
//           }}
//         >
//           <input
//             style={{
//               borderRadius: 0,
//               padding: "4px 28px 4px 10px",
//               fontSize: 15,
//               fontWeight: 600,
//               border: "0.5px solid #000",
//               background: "#fff",
//               color: "#333",
//               width: 200,
//               height: 42,
//             }}
//             placeholder="Type and hit enter..."
//           />
//           <svg
//             style={{ position: "absolute", right: 8 }}
//             width="22"
//             height="22"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="#333"
//             strokeWidth="2.8"
//           >
//             <circle cx="11" cy="11" r="8" />
//             <line x1="21" y1="21" x2="16.65" y2="16.65" />
//           </svg>
//         </div>

//         {/* RIGHT: Download button */}
//         <button
//           className="tb-dl-btn"
//           style={{
//             background: "#e53e3e",
//             color: "#fff",
//             fontSize: 13,
//             fontWeight: 900,
//             padding: "5px 28px",
//             borderRadius: 4,
//             border: "none",
//             cursor: "pointer",
//             whiteSpace: "nowrap",
//             flexShrink: 0,
//             height: 42,
//             marginRight: "12%",
//           }}
//         >
//           Download Document
//         </button>
//       </div>

//       {/* Desktop Header */}
//       <div
//         className="hdr-desktop"
//         style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "10px 24px",
//           background: "#fff",
//           borderBottom: "1px solid #eee",
//           minHeight: 150,
//         }}
//       >
//         {/* LEFT: Logo */}
//         <button
//           onClick={() => navigate("home")}
//           style={{
//             background: "none",
//             border: "none",
//             cursor: "pointer",
//             padding: 0,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             flexShrink: 0,
//             marginLeft: "8%",
//           }}
//         >
//           <img
//             src={logo}
//             alt="JSS Logo"
//             style={{
//               height: 155,
//               width: "auto",
//               objectFit: "contain",
//               display: "block",
//             }}
//           />
//         </button>

//         {/* RIGHT: Buttons + Swachh Bharat + Social */}
//         <div
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "flex-end",
//             justifyContent: "space-between",
//             paddingTop: 0,
//             paddingBottom: 14,
//             gap: 14,
//             marginRight: "6%",
//           }}
//         >
//           {/* Row 1: LOGIN + BROUCHERS */}
//           <div
//             style={{
//               display: "flex",
//               gap: 14,
//               alignItems: "center",
//               marginTop: -8,
//             }}
//           >
//             <a
//               href="https://frontend.jssabhiyan.com/"
//               style={{
//                 background: "#e53e3e",
//                 color: "#fff",
//                 fontWeight: 900,
//                 fontSize: 20,
//                 padding: "12px 50px",
//                 borderRadius: 4,
//                 cursor: "pointer",
//                 textDecoration: "none",
//                 display: "inline-block",
//                 letterSpacing: "0.04em",
//                 lineHeight: 1.3,
//               }}
//             >
//               LOGIN
//             </a>
//             <a
//               href={brochurePDF}
//               target="_blank"
//               rel="noopener noreferrer"
//               style={{
//                 background: GREEN,
//                 color: "#000",
//                 fontWeight: 900,
//                 fontSize: 20,
//                 padding: "12px 50px",
//                 borderRadius: 4,
//                 cursor: "pointer",
//                 textDecoration: "none",
//                 display: "inline-block",
//                 letterSpacing: "0.04em",
//                 lineHeight: 1.3,
//               }}
//             >
//               BROUCHERS
//             </a>
//           </div>
//           {/* Row 2: Swachh Bharat + Social */}
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 16,
//               marginBottom: -8,
//             }}
//           >
//             <img
//               src={swachhBharat}
//               alt="Swachh Bharat"
//               style={{ height: 68, width: "auto", objectFit: "contain" }}
//             />
//             <div style={{ display: "flex", gap: 9 }}>
//               {socialLinks.map((s, i) => (
//                 <a
//                   key={i}
//                   href={s.url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   style={{
//                     background: s.bg,
//                     borderRadius: 7,
//                     width: 44,
//                     height: 44,
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     textDecoration: "none",
//                     flexShrink: 0,
//                   }}
//                 >
//                   {s.content}
//                 </a>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Mobile Header */}
//       <div
//         className="hdr-mobile"
//         style={{
//           display: "none",
//           flexDirection: "column",
//           background: "#fff",
//           borderBottom: "1px solid #eee",
//           padding: "1px 8px",
//           gap: 1,
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             gap: 6,
//           }}
//         >
//           <button
//             onClick={() => navigate("home")}
//             style={{
//               background: "none",
//               border: "none",
//               cursor: "pointer",
//               padding: 0,
//               flexShrink: 0,
//               marginLeft: "4%",
//             }}
//           >
//             <img
//               src={logo}
//               alt="JSS Logo"
//               style={{
//                 height: 48,
//                 width: "auto",
//                 objectFit: "contain",
//                 display: "block",
//               }}
//             />
//           </button>
//           <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
//             <a
//               href="https://frontend.jssabhiyan.com/"
//               style={{
//                 background: "#e53e3e",
//                 color: "#fff",
//                 fontWeight: 900,
//                 fontSize: 11,
//                 padding: "5px 10px",
//                 borderRadius: 3,
//                 textDecoration: "none",
//                 display: "inline-block",
//                 whiteSpace: "nowrap",
//               }}
//             >
//               LOGIN
//             </a>
//             <a
//               href={brochurePDF}
//               target="_blank"
//               rel="noopener noreferrer"
//               style={{
//                 background: GREEN,
//                 color: "#000",
//                 fontWeight: 900,
//                 fontSize: 11,
//                 padding: "5px 10px",
//                 borderRadius: 3,
//                 cursor: "pointer",
//                 textDecoration: "none",
//                 display: "inline-block",
//                 whiteSpace: "nowrap",
//               }}
//             >
//               BROUCHERS
//             </a>
//           </div>
//         </div>
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "flex-end",
//             gap: 6,
//           }}
//         >
//           <img
//             src={swachhBharat}
//             alt="Swachh Bharat"
//             style={{ height: 24, width: "auto", objectFit: "contain" }}
//           />
//           <div style={{ display: "flex", gap: 3 }}>
//             {socialLinks.map((s, i) => (
//               <a
//                 key={i}
//                 href={s.url}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 style={{
//                   background: s.bg,
//                   borderRadius: 4,
//                   width: 22,
//                   height: 22,
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   textDecoration: "none",
//                   flexShrink: 0,
//                 }}
//               >
//                 <span style={{ transform: "scale(0.7)", display: "flex" }}>
//                   {s.content}
//                 </span>
//               </a>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Nav Bar */}
//       <nav
//         style={{
//           background: GREEN,
//           overflowX: "auto",
//           WebkitOverflowScrolling: "touch",
//         }}
//       >
//         <ul
//           className="nav-list"
//           style={{ display: "flex", margin: 0, padding: 0, listStyle: "none" }}
//         >
//           {navLinks.map((item, i) => (
//             <li key={i} className="nav-item">
//               <button
//                 onClick={() => navigate(item.page)}
//                 className="nav-btn"
//                 style={{
//                   display: "block",
//                   color: "#000",
//                   fontWeight: 700,
//                   letterSpacing: "0.02em",
//                   textAlign: "center",
//                   background: "transparent",
//                   border: "none",
//                   borderRight:
//                     i < navLinks.length - 1
//                       ? "1px solid rgba(255,255,255,0.2)"
//                       : "none",
//                   cursor: "pointer",
//                   whiteSpace: "nowrap",
//                   outline: "none",
//                 }}
//                 onMouseEnter={(e) =>
//                   (e.currentTarget.style.background = "transparent")
//                 }
//                 onMouseLeave={(e) =>
//                   (e.currentTarget.style.background = "transparent")
//                 }
//               >
//                 {item.label}
//               </button>
//             </li>
//           ))}
//         </ul>
//       </nav>

//       {renderPage()}
//       <FloatingButtons />

//       {/* Footer */}
//       <footer
//         style={{ background: "#304865", color: "#fff", padding: "36px 18px 0" }}
//       >
//         <div
//           className="footer-inner"
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "flex-start",
//             gap: 14,
//             padding: "0 80px 0 140px",
//           }}
//         >
//           <div style={{ flex: "1 1 0", minWidth: 0 }}>
//             <h4
//               className="ft-heading"
//               style={{
//                 fontWeight: 900,
//                 marginBottom: 18,
//                 color: "#5ecfcf",
//                 letterSpacing: "0.06em",
//               }}
//             >
//               QUICK LINKS
//             </h4>
//             <ul
//               style={{
//                 listStyle: "none",
//                 padding: 0,
//                 margin: 0,
//                 display: "flex",
//                 flexDirection: "column",
//               }}
//               className="ft-list"
//             >
//               {[
//                 { label: "About Us", page: "about" },
//                 { label: "MemberShip & Benifits", page: "membership" },
//                 { label: "View Jobs & Carrier", page: "jobs" },
//                 { label: "View Our Services", page: "services" },
//                 { label: "Our Privacy Policy", page: "home" },
//                 { label: "Refund & Cancellation", page: "home" },
//                 { label: "Terms & Condition", page: "home" },
//               ].map((l, i) => (
//                 <li key={i}>
//                   <button
//                     onClick={() => navigate(l.page)}
//                     className="ft-link"
//                     style={{
//                       color: "#ffffff",
//                       background: "none",
//                       border: "none",
//                       cursor: "pointer",
//                       textAlign: "left",
//                       padding: "2px 0",
//                       display: "block",
//                       width: "100%",
//                     }}
//                   >
//                     {l.label}
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           </div>
//           <div
//             className="ft-logo-wrap"
//             style={{
//               flexShrink: 0,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <img
//               src={logo1}
//               alt="JSS Logo"
//               className="ft-logo-img"
//               style={{ objectFit: "contain" }}
//             />
//           </div>
//           <div
//             style={{
//               flex: "1 1 0",
//               minWidth: 0,
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "flex-end",
//             }}
//           >
//             <h4
//               className="ft-heading"
//               style={{
//                 fontWeight: 900,
//                 marginBottom: 18,
//                 color: "#5ecfcf",
//                 letterSpacing: "0.06em",
//               }}
//             >
//               CONTACT INFO
//             </h4>
//             <div
//               className="ft-contact"
//               style={{
//                 display: "flex",
//                 flexDirection: "column",
//                 alignItems: "flex-end",
//               }}
//             >
//               <div className="ft-contact-item">
//                 Helpline No. : +91-9471987611
//               </div>
//               <div className="ft-contact-item">
//                 Email : support@jssabhiyan.com
//               </div>
//               <button
//                 onClick={() => navigate("contacts")}
//                 className="ft-contact-link"
//                 style={{
//                   color: "#5ecfcf",
//                   background: "none",
//                   border: "none",
//                   cursor: "pointer",
//                   textAlign: "right",
//                   padding: 0,
//                   lineHeight: 1.6,
//                 }}
//               >
//                 To know our all office branch address
//                 <br />
//                 click here
//               </button>
//             </div>
//           </div>
//         </div>
//         <div
//           className="ft-copyright"
//           style={{
//             textAlign: "center",
//             color: "#ffffff",
//             borderTop: "1px solid #4a5a6c",
//             fontWeight: 700,
//           }}
//         >
//           © 2021 JSS Abhiyan. All Rights Reserved. Trademark &amp; Brands are
//           property of their respective owner.
//         </div>
//       </footer>

//       <style>{`
//         html, body, #root { margin: 0 !important; padding: 0 !important; }

//         @keyframes newBadge {
//           0%   { background: #e53e3e; }
//           25%  { background: #d97706; }
//           50%  { background: #7c3aed; }
//           75%  { background: #0369a1; }
//           100% { background: #e53e3e; }
//         }
//         @keyframes marquee-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
//         .marquee-inner { animation: marquee-scroll 30s linear infinite; }
//         .marquee-inner:hover { animation-play-state: paused; }
//         * { box-sizing: border-box; }
//         nav::-webkit-scrollbar { height: 3px; }
//         nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 2px; }

//         .hdr-desktop { display: flex !important; }
//         .hdr-mobile  { display: none !important; }
//         .tb-left     { display: flex !important; }
//         .tb-phone    { display: flex !important; }
//         .tb-email    { display: flex !important; }
//         .tb-search   { display: flex !important; }

//         .slider-stats-wrap { display: flex; padding: 16px 100px 16px 100px; background: #fff; }
//         .slider-area  { flex: 0 0 75%; position: relative; overflow: hidden; min-height: 500px; max-height: 680px; border-radius: 4px; }
//         .stats-area   { flex: 0 0 25%; display: grid; grid-template-columns: 1fr 1fr; border-left: 1px solid #eee; background: #fff; }
//         .stat-cell    { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 20px 8px 20px 20px; border-bottom: none; border-right: none; }
//         .stat-cell:nth-child(2), .stat-cell:nth-child(4) { border-right: none; }
//         .stat-cell:nth-child(3), .stat-cell:nth-child(4) { border-bottom: none; }

//         .nav-list { width: 100%; }
//         .nav-item  { flex: 1; }
//         .nav-btn   { width: 100%; font-size: 14px; padding: 14px 4px; color: #000 !important; }

//         .notif-cards-desktop { display: flex !important; }
//         .notif-cards-mobile  { display: none !important; }

//         .stat-num          { font-size: 22px; }
//         .stat-icon-desktop { display: block; }
//         .stat-icon-mobile  { display: none; }
//         .stat-label        { font-size: 13px; }

//         .body-text       { font-size: 15px; }
//         .action-btn      { font-size: 13px; }
//         .pub-notice-title{ font-size: 16px; }
//         .section-heading { font-size: 15px; }
//         .cert-btn        { font-size: 15px; }
//         .accred-label    { font-size: 11px; }
//         .accred-logo     { height: 100px; }
//         .app-img { width: 31%; }
//         .intro-inner { flex-direction: row; }
//         .footer-inner  { flex-direction: row; }
//         .ft-heading    { font-size: 18px; }
//         .ft-list       { gap: 14px; }
//         .ft-link       { font-size: 16px; font-weight: 500; }
//         .ft-logo-wrap  { padding: 0 40px; }
//         .ft-logo-img   { width: 280px; height: auto; }
//         .ft-contact    { gap: 14px; }
//         .ft-contact-item { font-size: 16px; font-weight: 500; color: #ffffff; }
//         .ft-contact-link { font-size: 16px; font-weight: 500; margin-top: 6px; }
//         .ft-copyright  { font-size: 14px; padding: 16px 0; margin-top: 40px; }

//         @media (max-width: 768px) {
//           .hdr-desktop { display: none !important; }
//           .hdr-mobile  { display: flex !important; flex-direction: column !important; padding: 4px 8px !important; min-height: unset !important; }

//           .tb-topbar { flex-wrap: nowrap !important; padding: 0 6px !important; gap: 4px !important; justify-content: space-between !important; height: 36px !important; position: relative !important; }
//           .tb-left   { display: flex !important; gap: 8px !important; flex-shrink: 0 !important; min-width: 0 !important; align-items: center !important; margin-left: 2% !important; }
//           .tb-phone  { display: flex !important; font-size: 8px !important; gap: 3px !important; white-space: nowrap !important; flex-shrink: 0 !important; font-weight: 600 !important; }
//           .tb-phone svg { width: 8px !important; height: 8px !important; }
//           .tb-email  { display: flex !important; font-size: 8px !important; gap: 3px !important; white-space: nowrap !important; flex-shrink: 0 !important; font-weight: 600 !important; }
//           .tb-email svg { width: 8px !important; height: 8px !important; flex-shrink: 0 !important; }
//           .tb-search { position: absolute !important; left: 55% !important; transform: translateX(-50%) !important; display: flex !important; }
//           .tb-search input { width: 80px !important; font-size: 8px !important; padding: 2px 18px 2px 5px !important; height: 22px !important; font-weight: 600 !important; }
//           .tb-search svg { width: 10px !important; height: 10px !important; right: 4px !important; }
//           .tb-dl-btn { font-size: 8px !important; padding: 0 8px !important; white-space: nowrap !important; flex-shrink: 0 !important; height: 22px !important; font-weight: 900 !important; margin-right: 2% !important; }

//           .slider-stats-wrap { display: flex !important; flex-direction: row !important; min-height: unset !important; align-items: stretch !important; justify-content: flex-start !important; padding: 0 !important; gap: 0 !important; width: 100% !important; overflow: hidden !important; }
//           .slider-area { flex: 0 0 55% !important; width: 55% !important; height: 200px !important; min-height: 200px !important; max-height: 200px !important; border-radius: 0 !important; }
//           .stats-area  { flex: 0 0 45% !important; width: 45% !important; display: grid !important; grid-template-columns: 1fr 1fr !important; border-left: 1px solid #eee !important; border-top: none !important; background: #fff !important; height: 200px !important; }
//           .stat-cell   { padding: 4px 2px !important; border-bottom: 1px solid #eee !important; border-right: 1px solid #eee !important; gap: 1px !important; align-items: center !important; justify-content: center !important; }
//           .stat-cell:nth-child(2), .stat-cell:nth-child(4) { border-right: none !important; }
//           .stat-cell:nth-child(3), .stat-cell:nth-child(4) { border-bottom: none !important; }

//           .nav-list { width: 100% !important; flex-wrap: nowrap !important; display: flex !important; }
//           .nav-item  { flex: 1 1 0 !important; }
//           .nav-btn   { font-size: 5.5px !important; padding: 4px 1px !important; width: 100% !important; text-align: center !important; letter-spacing: 0 !important; white-space: nowrap !important; color: #000 !important; }

//           .notif-cards-desktop { display: none !important; }
//           .notif-cards-mobile  { display: flex !important; flex-direction: row !important; padding: 0 12px !important; width: 100% !important; box-sizing: border-box !important; }

//           .stat-num          { font-size: 10px !important; }
//           .stat-icon-desktop { display: none !important; }
//           .stat-icon-mobile  { display: block !important; }
//           .stat-label        { font-size: 7px !important; }

//           .notice-app-wrap { padding: 20px 0 0 !important; }
//           .notice-app-inner { padding: 0 14px !important; }
//           .action-btns-row { flex-direction: row !important; gap: 5px !important; margin-bottom: 16px !important; }
//           .action-btn { font-size: 9px !important; padding: 10px 3px !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
//           .app-imgs-row { gap: 6px !important; }
//           .app-img { width: 31% !important; }

//           .org-info-wrap    { padding: 20px 0 !important; }
//           .org-info-inner   { padding: 0 10px !important; }
//           .public-notice-wrap { padding: 16px 10px !important; }
//           .pub-notice-title { font-size: 11px !important; padding: 6px 10px !important; }

//           .body-text       { font-size: 11px; }
//           .org-text         { font-size: 8px !important; line-height: 1.9 !important; }
//           .notice-text      { font-size: 8px !important; font-weight: 400 !important; line-height: 1.4 !important; margin-bottom: 14px !important; }
//           .notice-important  { font-size: 8px !important; font-weight: 600 !important; padding: 10px 12px !important; margin-bottom: 14px !important; }
//           .section-heading { font-size: 11px; }
//           .cert-btn        { font-size: 8px !important; padding: 10px 2px !important; }
//           .accred-label    { font-size: 9px; }
//           .accred-logo     { height: 44px; }

//           .intro-inner { flex-direction: row !important; gap: 10px !important; }
//           .intro-section { padding: 16px 0 !important; }
//           .intro-section > div { padding: 0 12px !important; }
//           .intro-heading { font-size: 9px !important; margin-bottom: 5px !important; }

//           .cert-section { padding: 16px 10px !important; }
//           .cert-btn-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 4px !important; }

//           /* FIXED mobile accred: outer padding 0, inner div handles 10px sides */
//           .accred-section { padding: 16px 0 !important; }
//           .accred-section > div { padding: 0 10px !important; }
//           .accred-logos   { gap: 12px !important; }

//           footer { padding: 10px 6px 0 !important; }
//           .footer-inner   { flex-direction: row !important; gap: 6px !important; align-items: flex-start !important; padding: 0 !important; }
//           .ft-heading     { font-size: 8px !important; margin-bottom: 6px !important; letter-spacing: 0.02em !important; }
//           .ft-list        { gap: 3px !important; }
//           .ft-link        { font-size: 7px !important; font-weight: 500 !important; }
//           .ft-logo-wrap   { padding: 0 4px !important; width: auto !important; justify-content: center !important; }
//           .ft-logo-img    { width: 60px !important; }
//           .ft-contact     { gap: 3px !important; align-items: flex-end !important; }
//           .ft-contact-item { font-size: 7px !important; }
//           .ft-contact-link { font-size: 7px !important; text-align: left !important; margin-top: 2px !important; }
//           .ft-copyright   { font-size: 7px !important; padding: 8px 0 !important; margin-top: 10px !important; }

//           div[style*="position: fixed"][style*="left: 20px"] a,
//           div[style*="position: fixed"][style*="right: 20px"] a {
//             width: 48px !important;
//             height: 48px !important;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import myGovLogo from "../../assets/jss1.png";
import unicefLogo from "../../assets/jss2.png";
import nitiAayogLogo from "../../assets/jss3.jpeg";
import msmeLogo from "../../assets/jss4.png";
import logo from "../../assets/img0.png";
import swachhBharat from "../../assets/Swachh.png";
import appImg1 from "../../assets/img2b.png";
import appImg2 from "../../assets/img1.png";
import appImg3 from "../../assets/img3a.png";
import logo1 from "../../assets/jss.png";
import cert1 from "../../assets/cer1.jpeg";
import cert2 from "../../assets/cer4.jpeg";
import cert3 from "../../assets/cer5.jpeg";
import cert4 from "../../assets/cer4.jpeg";
import cert5 from "../../assets/cer5.jpeg";
import cert6 from "../../assets/cer6.jpeg";
import cert7 from "../../assets/cer7.jpeg";
import cert8 from "../../assets/cer8.jpeg";
import cert9 from "../../assets/cer9.jpeg";
import cert10 from "../../assets/cer10.jpeg";
import cert11 from "../../assets/cer1.jpeg";
import cert12 from "../../assets/cer7.jpeg";
import cert13 from "../../assets/cer9.jpeg";
import cert14 from "../../assets/cer1.jpeg";
import cert15 from "../../assets/cer10.jpeg";
import cardImg1 from "../../assets/jss.jpeg";
import AboutPage from "./Aboutpage";
import MembershipPage from "./Membershippage";
import ServicesPage from "./Servicespage";
import JobsPage from "./Jobspage";
import NotificationsPage from "./Notificationspage";
import GalleryPage from "./Gallerypage";
import VerificationPage from "./Verificationpage";
import ContactsPage from "./Contactspage";
import { jobPostingsAPI, scrollerAPI, notificationsAPI } from "../../utils/api.js";
import brochurePDF from "../../assets/broucher.pdf";

const GREEN = "#4D7C0F";
const BLUE_TEXT = "#4D7C0F";

const fallbackSlides = [
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1100&q=80",
  "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1100&q=80",
  "https://images.unsplash.com/photo-1593491205049-7f032d28cf01?w=1100&q=80",
  "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1100&q=80",
];

const PATH_TO_PAGE = {
  "/": "home",
  "/about": "about",
  "/membership": "membership",
  "/services": "services",
  "/jobs": "jobs",
  "/notifications": "notifications",
  "/gallery": "gallery",
  "/verification": "verification",
  "/contacts": "contacts",
};

const PAGE_TO_PATH = {
  home: "/",
  about: "/about",
  membership: "/membership",
  services: "/services",
  jobs: "/jobs",
  notifications: "/notifications",
  gallery: "/gallery",
  verification: "/verification",
  contacts: "/contacts",
};

// Current public landing site (separate app): localhost in dev, live domain in prod
const LANDING_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5173"
    : "https://jssabhiyan.com";

const LANDING_NAV = [
  { label: "Home", path: "/" },
  { label: "About Us", path: "/about" },
  { label: "Jobs & Career", path: "/jobs" },
  { label: "Notifications", path: "/notifications" },
  { label: "Gallery", path: "/gallery" },
  { label: "Feed", path: "/feeds" },
  { label: "News & Updates", path: "/news" },
];

const navLinks = [
  { label: "HOME", page: "home" },
  { label: "ABOUT US", page: "about" },
  { label: "MEMBERSHIPS & BENIFITS", page: "membership" },
  { label: "SERVICES", page: "services" },
  { label: "JOBS & CARRIERS", page: "jobs" },
  { label: "NOTIFICATIONS", page: "notifications" },
  { label: "GALLERY", page: "gallery" },
  { label: "VERIFICATION", page: "verification" },
  { label: "CONTACTS", page: "contacts" },
];

/* ─── Animated Counter ─── */
function CounterNumber({ target, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    started.current = false;
    setCount(0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const end = parseInt(target.replace(/\D/g, ""), 10) || 0;
          const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(step);
            else setCount(end);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
      observer.disconnect();
    };
  }, [target, duration]);
  return <span ref={ref}>{count.toLocaleString("en-IN")}</span>;
}

/* ─── Unified MarqueeBand ─── */
function MarqueeBand({ labelLine1, labelLine2, items = [], animId }) {
  const ROWS = 3;
  const rows = Array.from({ length: ROWS }, (_, i) =>
    items && items.length > i ? items[i] : null,
  );
  const getText = (item) =>
    (item && typeof item === "object" ? item.english : item) || "";
  const getLink = (item) =>
    item && typeof item === "object" ? item.link || "#" : "#";
  const getIsNew = (item) => !!(item && typeof item === "object" && item.isNew);
  const rowHeightD = 38;
  const rowHeightM = 20;
  return (
    <>
      <style>{`
        ${rows
          .map(
            (_, i) => `
          @keyframes mq-${animId}-${i}     { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
          @keyframes mq-${animId}-mob-${i} { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
          .mq-${animId}-${i}     { animation: mq-${animId}-${i}     20s linear infinite; will-change:transform; }
          .mq-${animId}-mob-${i} { animation: mq-${animId}-mob-${i} 20s linear infinite; will-change:transform; }
          .mq-${animId}-${i}:hover,
          .mq-${animId}-mob-${i}:hover { animation-play-state: paused; }
        `,
          )
          .join("")}
        .mband-desk-${animId} { display: flex; }
        .mband-mob-${animId}  { display: none; }
        @media (max-width: 768px) {
          .mband-desk-${animId} { display: none !important; }
          .mband-mob-${animId}  { display: block !important; }
        }
      `}</style>

      {/* Desktop */}
      <div
        className={`mband-desk-${animId}`}
        style={{
          background: "#f2f2f2",
          borderTop: "1px solid #ddd",
          borderBottom: "1px solid #ddd",
          minHeight: rowHeightD * ROWS,
          width: "100%",
          padding: "47px 0",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "100%",
            padding: "0 175px 0 175px",
            display: "flex",
            alignItems: "stretch",
            height: "100%",
            minHeight: rowHeightD * ROWS,
          }}
        >
          <div
            style={{
              width: 200,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "35px 6px",
              background: "#f2f2f2",
            }}
          >
            <span
              style={{
                fontWeight: 400,
                fontSize: 28,
                color: "#2d3748",
                lineHeight: 1,
                letterSpacing: "0.01em",
                display: "block",
              }}
            >
              {labelLine1}
              <br style={{ lineHeight: "0.05em", display: "block", margin: "8px 0" }} />
              {labelLine2}
            </span>
          </div>
          <div
            style={{
              width: 0,
              flexShrink: 0,
              borderLeft: "2px dashed #b8b8b8",
              margin: "12px 0",
            }}
          />
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 0,
            }}
          >
            {rows.map((item, i) => (
              <div
                key={i}
                style={{
                  height: rowHeightD,
                  background: "#f2f2f2",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "-2px",
                }}
              >
                {item ? (
                  <div
                    className={`mq-${animId}-${i}`}
                    style={{
                      whiteSpace: "nowrap",
                      display: "inline-block",
                      paddingLeft: 40,
                    }}
                  >
                    {[0, 1].map((copy) => (
                      <a
                        key={copy}
                        href={getLink(item)}
                        style={{
                          display: "inline-block",
                          color: "#4D7C0F",
                          fontWeight: 600,
                          fontSize: 15,
                          textDecoration: "underline",
                          textUnderlineOffset: 3,
                          whiteSpace: "nowrap",
                          paddingRight: 80,
                        }}
                      >
                        {getText(item)}
                        {getIsNew(item) && (
                          <span
                            style={{
                              marginLeft: 6,
                              background: "#e53e3e",
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: 900,
                              padding: "1px 5px",
                              borderRadius: 3,
                              verticalAlign: "middle",
                            }}
                          >
                            NEW
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                ) : (
                  <span
                    style={{ paddingLeft: 40, color: "#ccc", fontSize: 14 }}
                  >
                    —
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div
        className={`mband-mob-${animId}`}
        style={{
          background: "#f2f2f2",
          borderTop: "1px solid #ddd",
          borderBottom: "1px solid #ddd",
          padding: "35px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            minHeight: rowHeightM * ROWS,
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: 70,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "25px 3px",
              background: "#f2f2f2",
            }}
          >
            <span
              style={{
                fontWeight: 400,
                fontSize: 12,
                color: "#2d3748",
                lineHeight: 1,
                letterSpacing: "0.02em",
                textAlign: "center",
                display: "block",
              }}
            >
              {labelLine1}
              <br style={{ lineHeight: "0.05em", display: "block", margin: "4px 0" }} />
              {labelLine2}
            </span>
          </div>
          <div
            style={{
              width: 0,
              flexShrink: 0,
              borderLeft: "2px dashed #b8b8b8",
              margin: "7px 0",
            }}
          />
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 0,
            }}
          >
            {rows.map((item, i) => (
              <div
                key={i}
                style={{
                  height: rowHeightM,
                  background: "#f2f2f2",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "-1px",
                }}
              >
                {item ? (
                  <div
                    className={`mq-${animId}-mob-${i}`}
                    style={{
                      whiteSpace: "nowrap",
                      display: "inline-block",
                      paddingLeft: 4,
                    }}
                  >
                    {[0, 1].map((copy) => (
                      <a
                        key={copy}
                        href={getLink(item)}
                        style={{
                          display: "inline-block",
                          color: "#4D7C0F",
                          fontWeight: 600,
                          fontSize: 12,
                          textDecoration: "underline",
                          textUnderlineOffset: 2,
                          whiteSpace: "nowrap",
                          paddingRight: 60,
                        }}
                      >
                        {getText(item)}
                        {getIsNew(item) && (
                          <span
                            style={{
                              marginLeft: 4,
                              background: "#e53e3e",
                              color: "#fff",
                              fontSize: 8,
                              fontWeight: 900,
                              padding: "1px 3px",
                              borderRadius: 2,
                              verticalAlign: "middle",
                            }}
                          >
                            NEW
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                ) : (
                  <span
                    style={{ paddingLeft: 10, color: "#ccc", fontSize: 10 }}
                  >
                    —
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function VacanciesBand({ items = [] }) {
  return (
    <MarqueeBand
      labelLine1="LATEST"
      labelLine2="VACANCIES"
      items={items}
      animId="vac"
    />
  );
}

function ResultsBand({ items = [] }) {
  const displayItems =
    items.length === 0
      ? [{ english: "Coming Soon", hindi: "जल्द ही आ रहा है", link: "#" }]
      : items;
  return (
    <MarqueeBand
      labelLine1="Latest"
      labelLine2="Results"
      items={displayItems}
      animId="res"
    />
  );
}

/* ─── Vertical Notification Ticker ─── */
function NotificationTicker({
  notifications = [],
  onSeeMore,
  isMobile = false,
}) {
  const tickerRef = useRef(null);
  const innerRef = useRef(null);
  const animRef = useRef(null);
  const posRef = useRef(0);

  useEffect(() => {
    const ticker = tickerRef.current;
    const inner = innerRef.current;
    if (!ticker || !inner || notifications.length === 0) return;
    posRef.current = 0;
    inner.style.transform = "translateY(0px)";
    const SPEED = isMobile ? 0.4 : 0.5;
    const tick = () => {
      posRef.current += SPEED;
      const halfH = inner.scrollHeight / 2;
      if (halfH > 0 && posRef.current >= halfH) posRef.current = 0;
      inner.style.transform = `translateY(-${posRef.current}px)`;
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    const pause = () => cancelAnimationFrame(animRef.current);
    const resume = () => {
      animRef.current = requestAnimationFrame(tick);
    };
    ticker.addEventListener("mouseenter", pause);
    ticker.addEventListener("mouseleave", resume);
    return () => {
      cancelAnimationFrame(animRef.current);
      ticker.removeEventListener("mouseenter", pause);
      ticker.removeEventListener("mouseleave", resume);
    };
  }, [notifications, isMobile]);

  const fs = isMobile ? 11 : 13;
  const pad = isMobile ? "9px 11px" : "11px 14px";
  const height = isMobile ? 130 : 200;

  const cards = notifications.slice(0, 8).map((n, i) => (
    <a
      key={i}
      href={n.url || "#"}
      target={n.url ? "_blank" : undefined}
      rel={n.url ? "noopener noreferrer" : undefined}
      style={{
        display: "block",
        color: "#000",
        fontWeight: 700,
        fontSize: fs,
        padding: pad,
        lineHeight: 1.7,
        textDecoration: "underline",
        textUnderlineOffset: 2,
        borderBottom: "none",
        flexShrink: 0,
      }}
    >
      {">>"} {n.title}{" "}
      <span
        style={{
          display: "inline-block",
          fontSize: isMobile ? 7 : 9,
          fontWeight: 900,
          padding: "1px 4px",
          borderRadius: 2,
          verticalAlign: "middle",
          animation: "newBadge 1.5s infinite",
          color: "#fff",
          letterSpacing: "0.04em",
        }}
      >
        NEW
      </span>
    </a>
  ));

  return (
    <div
      style={{
        flex: 1,
        height: "100%",
        borderRadius: 4,
        padding: isMobile ? 10 : 20,
        background: GREEN,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2
        style={{
          color: "#fff",
          fontWeight: 900,
          fontSize: isMobile ? 12 : 22,
          marginBottom: isMobile ? 8 : 14,
          flexShrink: 0,
        }}
      >
        Notification
      </h2>
      {notifications.length === 0 ? (
        <div
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: isMobile ? 10 : 13,
            padding: isMobile ? "6px 8px" : "10px 12px",
            textAlign: "center",
          }}
        >
          No notifications available
        </div>
      ) : (
        <div
          ref={tickerRef}
          style={{
            height: height,
            overflow: "hidden",
            flex: 1,
            cursor: "pointer",
          }}
        >
          <div ref={innerRef} style={{ willChange: "transform" }}>
            {cards}
            {cards}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Cert Slider ─── */
function CertSlider() {
  const [current, setCurrent] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setCurrent(0);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const certImages = [
    { src: cert1, alt: "Certificate 1" },
    { src: cert2, alt: "Certificate 2" },
    { src: cert3, alt: "Certificate 3" },
    { src: cert4, alt: "Certificate 4" },
    { src: cert5, alt: "Certificate 5" },
    { src: cert6, alt: "Certificate 6" },
    { src: cert7, alt: "Certificate 7" },
    { src: cert8, alt: "Certificate 8" },
    { src: cert9, alt: "Certificate 9" },
    { src: cert10, alt: "Certificate 10" },
    { src: cert11, alt: "Certificate 11" },
    { src: cert12, alt: "Certificate 12" },
    { src: cert13, alt: "Certificate 13" },
    { src: cert14, alt: "Certificate 14" },
    { src: cert15, alt: "Certificate 15" },
  ];

  const visibleCount = 4;
  const cardHeight = isMobile ? 90 : 220;
  const maxSlide = certImages.length - visibleCount;

  useEffect(() => {
    const t = setInterval(() => {
      setCurrent((c) => (c >= maxSlide ? 0 : c + 1));
    }, 2500);
    return () => clearInterval(t);
  }, [maxSlide]);

  return (
    <div
      style={{
        margin: "0 auto 24px",
        position: "relative",
        padding: isMobile ? "0 44px" : "0 36px",
      }}
    >
      <div style={{ overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            gap: isMobile ? 4 : 12,
            transform: `translateX(-${current * (100 / visibleCount)}%)`,
            transition: "transform 0.4s ease",
          }}
        >
          {certImages.map((img, i) => (
            <img
              key={i}
              src={img.src}
              alt={img.alt}
              style={{
                flexShrink: 0,
                width: `calc(${100 / visibleCount}% - 9px)`,
                height: cardHeight,
                objectFit: "contain",
                display: "block",
              }}
            />
          ))}
        </div>
      </div>
      {current > 0 && (
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            background: "#fff",
            borderRadius: "50%",
            border: "2px solid #3AB000",
            width: isMobile ? 36 : 30,
            height: isMobile ? 36 : 30,
            fontSize: isMobile ? 22 : 18,
            cursor: "pointer",
            color: "#3AB000",
            fontWeight: 900,
          }}
        >
          ‹
        </button>
      )}
      {current < maxSlide && (
        <button
          onClick={() => setCurrent((c) => Math.min(maxSlide, c + 1))}
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            background: "#fff",
            borderRadius: "50%",
            border: "2px solid #3AB000",
            width: isMobile ? 36 : 30,
            height: isMobile ? 36 : 30,
            fontSize: isMobile ? 22 : 18,
            cursor: "pointer",
            color: "#3AB000",
            fontWeight: 900,
          }}
        >
          ›
        </button>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: isMobile ? 4 : 6,
          marginTop: isMobile ? 8 : 14,
        }}
      >
        {Array.from({ length: maxSlide + 1 }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: isMobile ? 6 : 10,
              height: isMobile ? 6 : 10,
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              background: i === current ? "#3AB000" : "#ccc",
              padding: 0,
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

const PersonIcon = ({ color = "#1a1a1a", size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 46 46" fill={color}>
    <circle cx="23" cy="14" r="9" />
    <ellipse cx="23" cy="36" rx="14" ry="9" />
  </svg>
);

const DoctorIcon = ({ size = 36, color = "#dc2626" }) => (
  <svg width={size} height={size} viewBox="0 0 46 46" fill={color}>
    <circle cx="23" cy="11" r="8" />
    <path d="M9 46 Q9 29 23 29 Q37 29 37 46Z" />
    <circle
      cx="31"
      cy="39"
      r="4"
      fill="none"
      stroke={color}
      strokeWidth="2"
    />
    <path
      d="M27 35 Q25 25 21 23"
      fill="none"
      stroke={color}
      strokeWidth="2"
    />
  </svg>
);

const YogaIcon = ({ size = 36, color = "#f97316" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 46 46"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
  >
    <circle cx="23" cy="9" r="5" fill={color} stroke="none" />
    <line x1="23" y1="14" x2="23" y2="27" />
    <line x1="23" y1="19" x2="8" y2="25" />
    <line x1="23" y1="19" x2="38" y2="25" />
    <line x1="23" y1="27" x2="15" y2="38" />
    <line x1="23" y1="27" x2="31" y2="38" />
    <line x1="15" y1="38" x2="25" y2="33" />
    <line x1="31" y1="38" x2="21" y2="33" />
  </svg>
);

/* ─── Floating Buttons ─── */
function FloatingButtons() {
  return (
    <>
      <div style={{ position: "fixed", left: 20, bottom: 20, zIndex: 1000 }}>
        <a
          href="tel:9471987611"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3AB000 0%, #2d8a00 100%)",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(58, 176, 0, 0.4)",
            textDecoration: "none",
          }}
          title="Call Us"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </a>
      </div>
      <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 1000 }}>
        <a
          href="https://wa.me/919471987611"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(37, 211, 102, 0.4)",
            textDecoration: "none",
          }}
          title="WhatsApp"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
      </div>
    </>
  );
}

/* ─── HOME PAGE ─── */
function HomePage({ onNavigate }) {
  const [slide, setSlide] = useState(0);
  const [slides, setSlides] = useState(fallbackSlides);
  const [scrollerImages, setScrollerImages] = useState([]);
  const [results, setResults] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingVacancies, setLoadingVacancies] = useState(true);
  const [loadingResults, setLoadingResults] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await scrollerAPI.getAll(null);
        if (res?.success && res.data) {
          const allImages = res.data.scrollerImages || [];
          const validImages = allImages.filter(
            (img) => img.imageUrl && img.imageUrl.trim() !== "",
          );
          if (validImages.length > 0) {
            const sortedImages = validImages.sort((a, b) => {
              if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
              return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });
            setSlides(sortedImages.map((i) => i.imageUrl));
            setScrollerImages(sortedImages);
            setSlide(0);
          } else setSlides(fallbackSlides);
        } else setSlides(fallbackSlides);
      } catch {
        setSlides(fallbackSlides);
      }
    };
    fetch_();
  }, []);

  useEffect(() => {
    if (slides.length > 0) {
      const t = setInterval(
        () => setSlide((s) => (s + 1) % slides.length),
        4000,
      );
      return () => clearInterval(t);
    }
  }, [slides.length]);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        setLoadingVacancies(true);
        const r = await jobPostingsAPI.getLatestVacancies();
        setVacancies(r.success && r.data.vacancies ? r.data.vacancies : []);
      } catch {
        setVacancies([]);
      } finally {
        setLoadingVacancies(false);
      }
    };
    fetch_();
    const iv = setInterval(fetch_, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    setResults([]);
    setLoadingResults(false);
  }, []);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await notificationsAPI.getAll("true");
        setNotifications(r.success && r.data ? r.data.notifications || [] : []);
      } catch {
        setNotifications([]);
      }
    };
    fetch_();
    const iv = setInterval(fetch_, 30000);
    return () => clearInterval(iv);
  }, []);

  const statsData = [
    {
      icon: <PersonIcon color="#3AB000" size={46} />,
      mobileIcon: <PersonIcon color="#3AB000" size={28} />,
      num: "2,265",
      label: "Joined Us",
    },
    {
      icon: <PersonIcon color="#65A30D" size={46} />,
      mobileIcon: <PersonIcon color="#65A30D" size={28} />,
      num: "2,185",
      label: "Took Benefits",
    },
    {
      icon: <DoctorIcon size={46} color="#dc2626" />,
      mobileIcon: <DoctorIcon size={28} color="#dc2626" />,
      num: "2,265",
      label: "Medical Camps",
    },
    {
      icon: <YogaIcon size={46} color="#f97316" />,
      mobileIcon: <YogaIcon size={28} color="#f97316" />,
      num: "2,185",
      label: "Yoga Camps",
    },
  ];

  return (
    <>
      {/* Slider + Stats */}
      <div className="slider-stats-wrap">
        <div className="slider-area">
          {slides.length > 0 ? (
            <>
              {slides.map((src, i) => {
                const si = scrollerImages[i];
                const imgEl = (
                  <img
                    key={i}
                    src={src}
                    alt={si?.title || `slide ${i + 1}`}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: i === slide ? 1 : 0,
                      transition: "opacity 0.8s ease",
                    }}
                    onError={(e) => (e.target.style.display = "none")}
                  />
                );
                if (si?.link)
                  return (
                    <a
                      key={i}
                      href={si.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: i === slide ? "block" : "none",
                      }}
                    >
                      {imgEl}
                    </a>
                  );
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: i === slide ? "block" : "none",
                    }}
                  >
                    {imgEl}
                  </div>
                );
              })}
              {slides.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSlide((s) => (s - 1 + slides.length) % slides.length)
                    }
                    style={{
                      position: "absolute",
                      left: 6,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "rgba(255,255,255,0.7)",
                      border: "none",
                      borderRadius: "50%",
                      width: 34,
                      height: 34,
                      fontSize: 22,
                      cursor: "pointer",
                      zIndex: 10,
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setSlide((s) => (s + 1) % slides.length)}
                    style={{
                      position: "absolute",
                      right: 6,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "rgba(255,255,255,0.7)",
                      border: "none",
                      borderRadius: "50%",
                      width: 34,
                      height: 34,
                      fontSize: 22,
                      cursor: "pointer",
                      zIndex: 10,
                    }}
                  >
                    ›
                  </button>
                </>
              )}
            </>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minHeight: "200px",
                background: "#f5f5f5",
                color: "#666",
                fontSize: "14px",
              }}
            >
              Loading...
            </div>
          )}
          <div
            style={{
              position: "absolute",
              bottom: 6,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 6,
            }}
          >
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  background: i === slide ? "#fff" : "rgba(255,255,255,0.45)",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
        <div className="stats-area">
          {statsData.map((s, i) => (
            <div key={i} className="stat-cell">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  justifyContent: "flex-start",
                  width: "100%",
                }}
              >
                <span className="stat-icon-desktop">{s.icon}</span>
                <span className="stat-icon-mobile">{s.mobileIcon}</span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    className="stat-num"
                    style={{
                      fontWeight: 700,
                      color: "#1a1a1a",
                      fontSize: 22,
                      lineHeight: 1.2,
                    }}
                  >
                    <CounterNumber target={s.num} />
                  </span>
                  <span
                    className="stat-label"
                    style={{
                      color: "#333",
                      fontWeight: 600,
                      textAlign: "left",
                      lineHeight: 1.4,
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vacancies Band */}
      <div style={{ marginTop: 24 }}>
        <VacanciesBand items={vacancies} />
      </div>

      {/* Notice + App Images */}
      <div
        className="notice-app-wrap"
        style={{ background: "#fce8f0", padding: "20px 0 0", marginTop: 24 }}
      >
        <div className="notice-app-inner" style={{ padding: "0 175px 0 175px" }}>
          <p
            className="body-text notice-text"
            style={{
              lineHeight: 1.6,
              color: "#1a1a1a",
              marginBottom: 28,
              textAlign: "justify",
              fontWeight: 400,
              fontSize: 18,
            }}
          >
            <strong>NOTICE/सूचना:</strong> जिन अभ्यर्थियों का नाम जिला प्रबंधक
            पद विज्ञापन सं: JSSA/REQ/01/2025/P–III तथा ब्लॉक सुपरवाइजर सह पंचायत
            कार्यपालक विज्ञापन सं: JSSA/REQ/02/2025/P–III तथा पंचायत कार्यपालक
            विज्ञापन सं: JSSA/REQ/03/2026/P–III के अंतर्गत प्रथम मेधा सूची में
            जारी किया गया है वे अभ्यर्थी कृपया ऑनलाइन एमओयू और सहमति प्रपत्र
            अंतिम तिथि 02/03/2026 से पहले भर लें। Candidates whose name has been
            released in the first merit list under District Manager Advt. No:
            JSSA/REQ/01/2025/P–III &amp; Block Supervisor Cum Panchayat
            Executive Advt. No: JSSA/REQ/02/2025/P–III &amp; Panchayat Executive
            Advt. No: JSSA/REQ/03/2025/P–III those candidates please fill the
            online MoU and consent form before the last date 02/03/2026. Failure
            to submit the required documents within the stipulated date may lead
            to cancellation of candidate.
          </p>
          <div
            className="body-text notice-important"
            style={{
              background: "#f8b4b4",
              padding: "20px 24px",
              borderRadius: 3,
              fontWeight: 600,
              color: "#1a1a1a",
              marginBottom: 28,
              textAlign: "center",
              fontSize: 19,
            }}
          >
            IMPORTANT NOTICE:– जन स्वास्थ्य सहायता अभियान के कार्यक्रमों को
            जमीनी स्तर पर शुरुवात करने हेतु आवश्यक अधिसूचना।
          </div>
          <div
            className="action-btns-row"
            style={{ display: "flex", gap: 20, marginBottom: 32 }}
          >
            {[
              "Online Test & Interview",
              "Online Mou & Consent Form",
              "Authorized Login",
            ].map((btn, i) => (
              <button
                key={i}
                className="action-btn"
                style={{
                  flex: 1,
                  background: "#2ecc1a",
                  color: "#000",
                  fontWeight: 700,
                  padding: "18px 6px",
                  borderRadius: 5,
                  border: "none",
                  cursor: "pointer",
                  lineHeight: 1.3,
                  fontSize: 15,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {btn}
              </button>
            ))}
          </div>
          <div
            className="app-imgs-row"
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            {[appImg1, appImg2, appImg3].map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`app${i + 1}`}
                className="app-img"
                style={{
                  width: "31%",
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Results Band */}
      <div style={{ marginTop: 24 }}>
        <ResultsBand items={results} />
      </div>

      {/* Organization Info */}
      <div
        className="org-info-wrap"
        style={{ background: "#e8f5e2", padding: "130px 0", marginTop: 12 }}
      >
        <div
          className="org-info-inner"
          style={{ padding: "0 175px 0 175px", textAlign: "center" }}
        >
          <p
            className="body-text org-text"
            style={{ color: "#333", lineHeight: 1.9, margin: 0 }}
          >
            This project is organized Under social welfare orgenization 'NAC"
            Registration No. : 053083 incorporated under [Pursuant to
            sub-section (2) of section 7 and sub-section (1) of section 8 of the
            Companies Act, 2013 (18 of 2013) and rule 18 of the Companies
            (Incorporation) Rules, 2014].
          </p>
        </div>
      </div>

      {/* Public Notice */}
      <div
        className="public-notice-wrap"
        style={{
          padding: "40px 0",
          textAlign: "center",
          background: "#fffde8",
          marginTop: 12,
        }}
      >
        <div className="public-notice-inner">
          <div
            className="pub-notice-title"
            style={{
              display: "inline-block",
              border: "2px solid #374151",
              padding: "8px 20px",
              fontWeight: 900,
              marginBottom: 20,
              fontSize: "28px",
            }}
          >
            सार्वजनिक सूचना / PUBLIC NOTICE:
          </div>

          <p
            className="body-text"
            style={{ margin: "0 0 48px 0", lineHeight: 1.9, color: "#555" }}
          >
            हमारे संस्था द्वारा सदस्यता शुल्क, जॉब आवेदन शुल्क एवं एमओयू और
            सहमति शुल्क के अलावा कोई अतिरिक्त शुल्क नहीं लिया जाता हैं (ये शुल्क
            सिर्फ ऑनलाइन लिया जाता है) अगर इसके अलावा
            आपसे कोई अतिरिक्त शुल्क मांगता है तो हमारे हेल्पलाइन नंबर एवं ईमेल
            पर आप शिकायत करें।
          </p>

          <p
            className="body-text"
            style={{ margin: 0, lineHeight: 1.9, color: "#555" }}
          >
            No extre fee is charged by our organization other than membership
            fee, job application fee and MOU and consent fee (this fee is
            charged online only through our website) If you ask for any
            additional fee apart from this, please contact our helpline number
            And complain by email.
          </p>
        </div>

        <style>
          {`
      .public-notice-inner{
        max-width: 900px;
        margin: auto;
        padding: 0 20px;
      }

      /* Desktop view */
      @media (min-width: 1024px){
        .public-notice-inner{
          max-width: 1400px;
        }
      }
    `}
        </style>
      </div>

      {/* ── Notification — Desktop ── */}
      <div
        className="notif-cards-desktop"
        style={{ background: "#fff", padding: "40px 0", marginTop: 24 }}
      >
        <div
          style={{
            padding: "0 175px 0 175px",
            display: "flex",
            gap: 20,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              flex: "1 1 0",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <NotificationTicker
              notifications={notifications}
              onSeeMore={() => onNavigate("notifications")}
              isMobile={false}
            />
          </div>
          <div
            style={{
              flex: "1 1 0",
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #e0e0e0",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <img
              src={cardImg1}
              alt="JSS Card"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
        </div>
      </div>

      {/* ── Notifications + Cards — Mobile ── */}
      {/* FIX: alignItems changed from "center" to "stretch" so both children match height */}
      <div
        className="notif-cards-mobile"
        style={{
          display: "none",
          gap: 10,
          padding: "0 12px",
          background: "#fff",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            flex: "1 1 0",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <NotificationTicker
            notifications={notifications}
            onSeeMore={() => onNavigate("notifications")}
            isMobile={true}
          />
        </div>
        <div
          style={{
            flex: "1 1 0",
            minWidth: 0,
            display: "flex",
            alignItems: "stretch",
            border: "2px solid #e0e0e0",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <img
            src={cardImg1}
            alt="JSS Card"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      </div>

      {/* Intro Section */}
      <div
        className="intro-section"
        style={{
          borderTop: `4px solid ${GREEN}`,
          borderBottom: `4px solid ${GREEN}`,
          padding: "40px 0",
          background: "#fff",
          marginTop: 24,
        }}
      >
        <div className="intro-container">
          <div className="intro-inner">
            <div className="intro-col">
              <h3 className="intro-heading">JAN SWASTHYA SAHAYATA ABHIYAN</h3>

              <p className="body-text">
                <strong>Introduction :</strong> Jan Swasthya Sahayata Abhiyan
                has been formed by the Healthcare Research and Development Board
                (Division of Social Welfare Organization "NAC".) to provide
                affordable, free & better treatment with health related
                assistance to poor and needy people.
              </p>

              <p className="body-text">
                <strong>Purpose :</strong> To provide better treatment by
                special doctors, medicines and medical tests to the poor and
                needy people of the country through Jan Swasthya Sahayata
                Abhiyan...
                <button
                  onClick={() => onNavigate("about")}
                  className="read-btn"
                >
                  read more
                </button>
              </p>
            </div>

            <div className="intro-col">
              <h3 className="intro-heading hindi">
                जन स्वास्थ्य सहायता अभियान
              </h3>

              <p className="body-text">
                <strong>परिचय :</strong> जन स्वास्थ्य सहायता अभियान का गठन
                हेल्थकेयर रिसर्च एंड डेवलपमेंट बोर्ड द्वारा सस्ती, निःशुल्क एवं
                बेहतर इलाज के लिए किया गया है।
              </p>

              <p className="body-text">
                <strong>उद्देश्य :</strong> जन स्वास्थ्य सहायता अभियान के माध्यम
                से देश के गरीब और जरूरतमंद लोगों को बेहतर उपचार प्रदान करना...
                <button
                  onClick={() => onNavigate("about")}
                  className="read-btn"
                >
                  अधिक पढ़ें
                </button>
              </p>
            </div>
          </div>
        </div>

        <style>
          {`
    .intro-container{
      padding:0 150px 0 170px;
    }

    .intro-inner{
      display:flex;
      gap:48px;
      flex-wrap:nowrap; /* mobile me bhi ek row */
    }

    .intro-col{
      flex:1;
    }

    .intro-heading{
      font-weight:900;
      color:#1a1a1a;
      margin-bottom:14px;
      font-size:18px;
      letter-spacing:0.02em;
    }

    .body-text{
      line-height:1.9;
      color:#333;
      margin-bottom:20px;
      font-size:15px;
    }

    .read-btn{
      color:${BLUE_TEXT};
      background:none;
      border:none;
      cursor:pointer;
      padding:0;
      font-size:inherit;
      font-weight:600;
    }

    /* Mobile View */
    @media (max-width:768px){

      .intro-container{
        padding:0 20px;
      }

      .intro-heading{
        font-size:12px;
      }

      .body-text{
        font-size:10px;
        line-height:1.6;
      }

    }
    `}
        </style>
      </div>

      {/* Certificates */}
      <div
        className="cert-section"
        style={{
          padding: "28px 100px 28px 200px",
          background: "#f8f8f8",
          marginTop: 24,
        }}
      >
        <CertSlider />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
          }}
          className="cert-btn-grid"
        >
          {[
            { label: "Enquiry", page: null },
            { label: "Broucher", page: null, pdf: brochurePDF },
            { label: "Membership", page: "membership" },
            { label: "Services", page: "services" },
          ].map((btn, i) => (
            <button
              key={i}
              className="cert-btn"
              onClick={() => {
                if (btn.page) onNavigate(btn.page);
                else if (btn.pdf) window.open(btn.pdf, "_blank");
              }}
              style={{
                background: GREEN,
                color: "#000",
                fontWeight: 900,
                padding: "14px 4px",
                borderRadius: 4,
                border: "none",
                cursor: btn.page || btn.pdf ? "pointer" : "default",
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* FIXED: outer uses padding "32px 0", inner div uses "0 100px" to match all other sections */}
      <div
        className="accred-section"
        style={{
          background: "#fff",
          borderTop: "1px solid #eee",
          marginTop: 24,
          padding: "32px 0",
        }}
      >
        <div
          style={{
            margin: "0 auto 0 12%",
            width: "82%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <p
            className="accred-label"
            style={{
              fontWeight: 700,
              color: "#aaa",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 18,
              textAlign: "center",
            }}
          >
            ACCREDITATIONS &amp; FOLLOWS GUIDELINES
          </p>

          <div
            className="accred-logos"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 48,
              flexWrap: "wrap",
              width: "100%",
            }}
          >
            {[myGovLogo, unicefLogo, nitiAayogLogo, msmeLogo].map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`accreditation-${i}`}
                className="accred-logo"
                style={{ width: "auto", objectFit: "contain" }}
              />
            ))}
          </div>
        </div>

        {/* Mobile Fix */}
        <style>
          {`
      @media (max-width:768px){

        .accred-label{
          font-size:12px;
        }

        .accred-logos{
          flex-wrap: nowrap !important;
        }

        .accred-logo{
          width:60px !important;
        }

      }
    `}
        </style>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════════════ */
export default function JSSAbhiyan() {
  const routerNavigate = useNavigate();
  const location = useLocation();
  const activePage = PATH_TO_PAGE[location.pathname] || "home";

  const navigate = (page) => {
    const path = PAGE_TO_PATH[page] || "/";
    routerNavigate(path);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (activePage) {
      case "about":
        return <AboutPage onNavigate={navigate} />;
      case "membership":
        return <MembershipPage />;
      case "services":
        return <ServicesPage />;
      case "jobs":
        return <JobsPage />;
      case "notifications":
        return <NotificationsPage />;
      case "gallery":
        return <GalleryPage />;
      case "verification":
        return <VerificationPage />;
      case "contacts":
        return <ContactsPage />;
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  const socialLinks = [
    {
      bg: "#1877f2",
      url: "https://www.facebook.com/",
      content: (
        <span
          style={{
            fontWeight: 900,
            fontSize: 16,
            color: "#fff",
            lineHeight: 1,
          }}
        >
          f
        </span>
      ),
    },
    {
      bg: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285aeb 90%)",
      // url temporarily disabled — icon stays visible, link does nothing
      // url: "https://www.instagram.com/jssabhiyan8/?hl=en",
      content: (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none" />
        </svg>
      ),
    },
    {
      bg: "#ff0000",
      // url temporarily disabled — icon stays visible, link does nothing
      // url: "https://www.youtube.com/@janswasthyasahayataabhiyan8183",
      content: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
          <polygon points="9.5,7 9.5,17 18,12" />
        </svg>
      ),
    },
    {
      bg: "#0077b5",
      url: "https://www.linkedin.com/in/jss-abhiyan-3872b13b7/",
      content: (
        <span style={{ fontWeight: 900, fontSize: 12, color: "#fff" }}>in</span>
      ),
    },
  ];

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        color: "#333",
        background: "#fff",
        overflowX: "hidden",
        margin: 0,
        padding: 0,
      }}
    >
      {/* Clean landing-style navbar */}
      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "8px 40px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <a
          href={`${LANDING_URL}/`}
          style={{
            background: "none",
            border: 0,
            cursor: "pointer",
            padding: 0,
            flexShrink: 0,
            display: "inline-block",
          }}
        >
          <img
            src={logo}
            alt="JSS Logo"
            style={{ height: 60, width: "auto", objectFit: "contain", display: "block" }}
          />
        </a>
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: 1,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {LANDING_NAV.map((item) => (
            <a
              key={item.path}
              href={`${LANDING_URL}${item.path}`}
              style={{
                color: "#1f2937",
                textDecoration: "none",
                padding: "9px 10px",
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 6,
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          title="Brochure (coming soon)"
          style={{
            background: "#4D7C0F",
            color: "#fff",
            fontWeight: 800,
            fontSize: 12,
            padding: "9px 18px",
            borderRadius: 6,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          Brochure
        </a>
      </header>

            {renderPage()}
      <FloatingButtons />

      {/* Footer */}
      <footer
        style={{ background: "#1A2E05", color: "#fff", padding: "44px 18px 0", borderTop: "3px solid #4D7C0F" }}
      >
        <div
          className="footer-inner"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 14,
            padding: "0 80px 0 140px",
          }}
        >
          <div style={{ flex: "1 1 0", minWidth: 0 }}>
            <h4
              className="ft-heading"
              style={{
                fontWeight: 900,
                marginBottom: 18,
                color: "#D9F99D",
                letterSpacing: "0.06em",
              }}
            >
              QUICK LINKS
            </h4>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
              }}
              className="ft-list"
            >
              {[
                { label: "Home", page: "home" },
                { label: "About", page: "about" },
                { label: "Jobs & Career", page: "jobs" },
                { label: "Notifications", page: "notifications" },
                { label: "Gallery", page: "gallery" },
                { label: "Feed", href: `${LANDING_URL}/feeds` },
                { label: "News & Updates", href: `${LANDING_URL}/news` },
              ].map((l, i) => (
                <li key={i}>
                  {l.href ? (
                    <a
                      href={l.href}
                      className="ft-link"
                      style={{
                        color: "#ffffff",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        padding: "2px 0",
                        display: "block",
                        width: "100%",
                        textDecoration: "none",
                      }}
                    >
                      {l.label}
                    </a>
                  ) : (
                    <button
                      onClick={() => navigate(l.page)}
                      className="ft-link"
                      style={{
                        color: "#ffffff",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        padding: "2px 0",
                        display: "block",
                        width: "100%",
                      }}
                    >
                      {l.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="ft-logo-wrap"
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={logo1}
              alt="JSS Logo"
              className="ft-logo-img"
              style={{ objectFit: "contain" }}
            />
          </div>
          <div
            style={{
              flex: "1 1 0",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <h4
              className="ft-heading"
              style={{
                fontWeight: 900,
                marginBottom: 18,
                color: "#D9F99D",
                letterSpacing: "0.06em",
              }}
            >
              CONTACT INFO
            </h4>
            <div
              className="ft-contact"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <div className="ft-contact-item">
                Helpline No. : +91-9471987611
              </div>
              <div className="ft-contact-item">
                Email : support@jssabhiyan.com
              </div>
              <button
                onClick={() => navigate("contacts")}
                className="ft-contact-link"
                style={{
                  color: "#D9F99D",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "right",
                  padding: 0,
                  lineHeight: 1.6,
                }}
              >
                To know our all office branch address
                <br />
                click here
              </button>
            </div>
          </div>
        </div>
        <div
          className="ft-copyright"
          style={{
            textAlign: "center",
            color: "#ffffff",
            borderTop: "1px solid rgba(255,255,255,0.18)",
            fontWeight: 700,
          }}
        >
          © {new Date().getFullYear()} Jan Aarogya Sahayata Abhiyan. All Rights Reserved. Trademark &amp; Brands are
          property of their respective owner.
        </div>
      </footer>

      <style>{`
        html, body, #root { margin: 0 !important; padding: 0 !important; }

        @keyframes newBadge {
          0%   { background: #e53e3e; }
          25%  { background: #d97706; }
          50%  { background: #7c3aed; }
          75%  { background: #0369a1; }
          100% { background: #e53e3e; }
        }
        @keyframes marquee-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .marquee-inner { animation: marquee-scroll 30s linear infinite; }
        .marquee-inner:hover { animation-play-state: paused; }
        @keyframes blink-red-green {
          0%   { background: #e53e3e; }
          50%  { background: #0aca00; }
          100% { background: #e53e3e; }
        }
        .login-blink { animation: blink-red-green 2s ease-in-out infinite; }
        * { box-sizing: border-box; }
        nav::-webkit-scrollbar { height: 3px; }
        nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 2px; }

        .hdr-desktop { display: flex !important; }
        .hdr-mobile  { display: none !important; }
        .tb-left     { display: flex !important; }
        .tb-phone    { display: flex !important; }
        .tb-email    { display: flex !important; }
        .tb-search   { display: flex !important; }

        .slider-stats-wrap { display: flex; padding: 16px 100px 16px 100px; background: #fff; }
        .slider-area  { flex: 0 0 75%; position: relative; overflow: hidden; min-height: 500px; max-height: 680px; border-radius: 4px; }
        .stats-area   { flex: 0 0 25%; display: grid; grid-template-columns: 1fr 1fr; border-left: 1px solid #eee; background: #fff; }
        .stat-cell    { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 20px 8px 20px 20px; border-bottom: none; border-right: none; }
        .stat-cell:nth-child(2), .stat-cell:nth-child(4) { border-right: none; }
        .stat-cell:nth-child(3), .stat-cell:nth-child(4) { border-bottom: none; }

        .nav-list { width: 100%; }
        .nav-item  { flex: 1; }
        .nav-btn   { width: 100%; font-size: 14px; padding: 14px 4px; color: #000 !important; }

        .notif-cards-desktop { display: flex !important; }
        .notif-cards-mobile  { display: none !important; }

        .stat-num          { font-size: 22px; }
        .stat-icon-desktop { display: block; }
        .stat-icon-mobile  { display: none; }
        .stat-label        { font-size: 13px; }

        .body-text       { font-size: 15px; }
        .action-btn      { font-size: 13px; }
        .public-notice-inner { padding: 0 100px 0 140px; }
        .pub-notice-title{ font-size: 16px; }
        .section-heading { font-size: 15px; }
        .cert-btn        { font-size: 15px; }
        .accred-label    { font-size: 11px; }
        .accred-logo     { height: 100px; }
        .app-img { width: 31%; }
        .intro-inner { flex-direction: row; }
        .footer-inner  { flex-direction: row; padding-bottom: 32px !important; }
        .ft-heading    { font-size: 15px !important; letter-spacing: 0.1em !important; position: relative; padding-bottom: 12px; }
        .ft-heading::after { content: ""; position: absolute; left: 0; bottom: 0; width: 28px; height: 2px; background: #65A30D; border-radius: 2px; }
        .footer-inner > div:last-child .ft-heading::after { left: auto; right: 0; }
        .ft-list       { gap: 10px; }
        .ft-link       { font-size: 15px !important; font-weight: 500 !important; transition: color .15s ease, transform .15s ease; display: inline-block !important; }
        .ft-link:hover { color: #D9F99D !important; transform: translateX(4px); }
        .ft-logo-wrap  { padding: 0 40px; }
        .ft-logo-img   { width: 240px; height: auto; filter: drop-shadow(0 8px 18px rgba(0,0,0,.32)); }
        .ft-contact    { gap: 10px; }
        .ft-contact-item { font-size: 15px; font-weight: 500; color: #e7f0dc; }
        .ft-contact-link { font-size: 15px; font-weight: 600; margin-top: 8px; transition: color .15s ease; }
        .ft-contact-link:hover { color: #ECFCCB !important; }
        .ft-copyright  { font-size: 13px; padding: 18px 0; margin-top: 32px; border-top-color: rgba(255,255,255,.16) !important; color: #9fb28a; }

        @media (max-width: 768px) {
          .hdr-desktop { display: none !important; }
          .hdr-mobile  { display: flex !important; flex-direction: column !important; padding: 4px 8px !important; min-height: unset !important; }

          .tb-topbar { flex-wrap: nowrap !important; padding-top: 0 !important; padding-bottom: 0 !important; padding-left: 6px !important; padding-right: 6px !important; gap: 4px !important; justify-content: space-between !important; height: 36px !important; position: relative !important; width: 100% !important; box-sizing: border-box !important; border-top: 1px solid #2a2a2a !important; border-bottom: 1px solid #ffffff !important; }
          .tb-left   { display: flex !important; gap: 8px !important; flex-shrink: 0 !important; min-width: 0 !important; align-items: center !important; }
          .tb-phone  { display: flex !important; font-size: 8px !important; gap: 3px !important; white-space: nowrap !important; flex-shrink: 0 !important; font-weight: 400 !important; color: #000000 !important; }
          .tb-phone svg { width: 8px !important; height: 8px !important; stroke: black !important; fill: none !important; }
          .tb-email  { display: flex !important; font-size: 8px !important; gap: 3px !important; white-space: nowrap !important; flex-shrink: 0 !important; font-weight: 400 !important; color: #000000 !important; }
          .tb-email svg { width: 8px !important; height: 8px !important; flex-shrink: 0 !important; stroke: black !important; fill: none !important; }
          .tb-search { position: absolute !important; left: 50% !important; transform: translateX(-50%) !important; display: flex !important; }
          .tb-search input { width: 104px !important; font-size: 8px !important; padding: 2px 18px 2px 5px !important; height: 22px !important; font-weight: 600 !important; border: 1px solid #000000 !important; }
          .tb-search svg { width: 10px !important; height: 10px !important; right: 4px !important; }
          .tb-dl-btn { font-size: 8px !important; padding: 0 8px !important; white-space: nowrap !important; flex-shrink: 0 !important; height: 22px !important; font-weight: 900 !important; }

          .slider-stats-wrap { display: flex !important; flex-direction: row !important; min-height: unset !important; align-items: stretch !important; justify-content: flex-start !important; padding: 0 !important; gap: 0 !important; width: 100% !important; overflow: hidden !important; }
          .slider-area { flex: 0 0 55% !important; width: 55% !important; height: 200px !important; min-height: 200px !important; max-height: 200px !important; border-radius: 0 !important; }
          .stats-area  { flex: 0 0 45% !important; width: 45% !important; display: grid !important; grid-template-columns: 1fr 1fr !important; border-left: 1px solid #eee !important; border-top: none !important; background: #fff !important; height: 200px !important; }
          .stat-cell   { padding: 4px 2px !important; border-bottom: 1px solid #eee !important; border-right: 1px solid #eee !important; gap: 1px !important; align-items: center !important; justify-content: center !important; }
          .stat-cell:nth-child(2), .stat-cell:nth-child(4) { border-right: none !important; }
          .stat-cell:nth-child(3), .stat-cell:nth-child(4) { border-bottom: none !important; }

          .nav-list { width: 100% !important; flex-wrap: nowrap !important; display: flex !important; }
          .nav-item  { flex: 1 1 0 !important; }
          .nav-btn   { font-size: 5.5px !important; padding: 4px 1px !important; width: 100% !important; text-align: center !important; letter-spacing: 0 !important; white-space: nowrap !important; color: #000 !important; }

          .notif-cards-desktop { display: none !important; }
          /* FIX: align-items: stretch so notification and card match height on mobile */
          .notif-cards-mobile  { display: flex !important; flex-direction: row !important; padding: 0 12px !important; width: 100% !important; box-sizing: border-box !important; align-items: stretch !important; }

          .stat-num          { font-size: 10px !important; }
          .stat-icon-desktop { display: none !important; }
          .stat-icon-mobile  { display: block !important; }
          .stat-label        { font-size: 7px !important; }

          .notice-app-wrap { padding: 20px 0 0 !important; }
          .notice-app-inner { padding: 0 14px !important; }
          .action-btns-row { flex-direction: row !important; gap: 5px !important; margin-bottom: 16px !important; }
          .action-btn { font-size: 9px !important; padding: 10px 3px !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
          .app-imgs-row { gap: 6px !important; }
          .app-img { width: 31% !important; }

          .org-info-wrap    { padding: 20px 0 !important; }
          .org-info-inner   { padding: 0 10px !important; }
          .public-notice-wrap { padding: 20px 0 !important; }
          .public-notice-inner { padding: 0 12px !important; }
          .pub-notice-title { font-size: 11px !important; padding: 6px 10px !important; }

          .body-text       { font-size: 11px; }
          .org-text         { font-size: 8px !important; line-height: 1.9 !important; }
          .notice-text      { font-size: 8px !important; font-weight: 400 !important; line-height: 1.4 !important; margin-bottom: 14px !important; }
          .notice-important  { font-size: 8px !important; font-weight: 600 !important; padding: 10px 12px !important; margin-bottom: 14px !important; }
          .section-heading { font-size: 11px; }
          .cert-btn        { font-size: 8px !important; padding: 10px 2px !important; }
          .accred-label    { font-size: 9px; }
          .accred-logo     { height: 44px; }

          .intro-inner { flex-direction: row !important; gap: 10px !important; }
          .intro-section { padding: 16px 0 !important; }
          .intro-section > div { padding: 0 12px !important; }
          .intro-heading { font-size: 9px !important; margin-bottom: 5px !important; }

          .cert-section { padding: 16px 10px !important; }
          .cert-btn-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 4px !important; }

          .accred-section { padding: 16px 0 !important; }
          .accred-section > div { padding: 0 10px !important; }
          .accred-logos   { gap: 12px !important; }

          footer { padding: 24px 6px 0 !important; }
          .footer-inner   { flex-direction: row !important; gap: 6px !important; align-items: flex-start !important; padding: 0 !important; }
          .ft-heading     { font-size: 8px !important; margin-bottom: 6px !important; padding-bottom: 6px !important; letter-spacing: 0.02em !important; }
          .ft-heading::after { width: 16px !important; height: 1.5px !important; }
          .ft-list        { gap: 3px !important; }
          .ft-link        { font-size: 7px !important; font-weight: 500 !important; }
          .ft-logo-wrap   { padding: 0 4px !important; width: auto !important; justify-content: center !important; }
          .ft-logo-img    { width: 60px !important; filter: drop-shadow(0 4px 8px rgba(0,0,0,.3)) !important; }
          .ft-contact     { gap: 3px !important; align-items: flex-end !important; }
          .ft-contact-item { font-size: 7px !important; color: #e7f0dc !important; }
          .ft-contact-link { font-size: 7px !important; text-align: left !important; margin-top: 2px !important; }
          .ft-copyright   { font-size: 7px !important; padding: 10px 0 !important; margin-top: 14px !important; color: #9fb28a !important; }

          div[style*="position: fixed"][style*="left: 20px"] a,
          div[style*="position: fixed"][style*="right: 20px"] a {
            width: 48px !important;
            height: 48px !important;
          }
        }
      `}</style>
    </div>
  );
}
