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

// const GREEN = "#0aca00";
// const BLUE_TEXT = "#1a56c4";

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
//   const rowHeightD = 38;
//   const rowHeightM = 20;
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
//           padding: "47px 0",
//         }}
//       >
//         <div
//           style={{
//             width: "100%",
//             maxWidth: "100%",
//             padding: "0 175px 0 175px",
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
//               justifyContent: "center",
//               padding: "35px 6px",
//               background: "#f2f2f2",
//             }}
//           >
//             <span
//               style={{
//                 fontWeight: 400,
//                 fontSize: 28,
//                 color: "#2d3748",
//                 lineHeight: 1,
//                 letterSpacing: "0.01em",
//                 display: "block",
//               }}
//             >
//               {labelLine1}
//               <br
//                 style={{
//                   lineHeight: "0.05em",
//                   display: "block",
//                   margin: "8px 0",
//                 }}
//               />
//               {labelLine2}
//             </span>
//           </div>
//           <div
//             style={{
//               width: 0,
//               flexShrink: 0,
//               borderLeft: "2px dashed #b8b8b8",
//               margin: "12px 0",
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
//                   marginBottom: "-2px",
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
//                           color: "#1a4fa0",
//                           fontWeight: 600,
//                           fontSize: 15,
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
//           padding: "35px 0",
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
//               width: 70,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               padding: "25px 3px",
//               background: "#f2f2f2",
//             }}
//           >
//             <span
//               style={{
//                 fontWeight: 400,
//                 fontSize: 12,
//                 color: "#2d3748",
//                 lineHeight: 1,
//                 letterSpacing: "0.02em",
//                 textAlign: "center",
//                 display: "block",
//               }}
//             >
//               {labelLine1}
//               <br
//                 style={{
//                   lineHeight: "0.05em",
//                   display: "block",
//                   margin: "4px 0",
//                 }}
//               />
//               {labelLine2}
//             </span>
//           </div>
//           <div
//             style={{
//               width: 0,
//               flexShrink: 0,
//               borderLeft: "2px dashed #b8b8b8",
//               margin: "7px 0",
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
//                   height: rowHeightM,
//                   background: "#f2f2f2",
//                   overflow: "hidden",
//                   display: "flex",
//                   alignItems: "center",
//                   marginBottom: "-1px",
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
//                           color: "#1a4fa0",
//                           fontWeight: 600,
//                           fontSize: 12,
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
//   const displayItems = items;
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
//         borderBottom: "none",
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
//           fontSize: isMobile ? 12 : 28,
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

// const DoctorIcon = ({ size = 36, color = "#dc2626" }) => (
//   <svg width={size} height={size} viewBox="0 0 46 46" fill={color}>
//     <circle cx="23" cy="11" r="8" />
//     <path d="M9 46 Q9 29 23 29 Q37 29 37 46Z" />
//     <circle cx="31" cy="39" r="4" fill="none" stroke={color} strokeWidth="2" />
//     <path d="M27 35 Q25 25 21 23" fill="none" stroke={color} strokeWidth="2" />
//   </svg>
// );

// const YogaIcon = ({ size = 36, color = "#f97316" }) => (
//   <svg
//     width={size}
//     height={size}
//     viewBox="0 0 46 46"
//     fill="none"
//     stroke={color}
//     strokeWidth="2.2"
//     strokeLinecap="round"
//   >
//     <circle cx="23" cy="9" r="5" fill={color} stroke="none" />
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
//             setSlides(sortedImages.map((i) => getImageUrl(i.imageUrl)));
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
//       icon: <PersonIcon color="#3AB000" size={46} />,
//       mobileIcon: <PersonIcon color="#3AB000" size={28} />,
//       num: "2,265",
//       label: "Joined Us",
//     },
//     {
//       icon: <PersonIcon color="#1565c0" size={46} />,
//       mobileIcon: <PersonIcon color="#1565c0" size={28} />,
//       num: "2,185",
//       label: "Took Benefits",
//     },
//     {
//       icon: <DoctorIcon size={46} color="#dc2626" />,
//       mobileIcon: <DoctorIcon size={28} color="#dc2626" />,
//       num: "2,265",
//       label: "Medical Camps",
//     },
//     {
//       icon: <YogaIcon size={46} color="#f97316" />,
//       mobileIcon: <YogaIcon size={28} color="#f97316" />,
//       num: "2,185",
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
//         style={{ background: "#fce8f0", padding: "20px 0 0", marginTop: 24 }}
//       >
//         <div
//           className="notice-app-inner"
//           style={{ padding: "0 175px 0 175px" }}
//         >
//           <p
//             className="body-text notice-text"
//             style={{
//               lineHeight: 1.6,
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
//         style={{ background: "#e8f5e2", padding: "130px 0", marginTop: 12 }}
//       >
//         <div
//           className="org-info-inner"
//           style={{ padding: "0 175px 0 175px", textAlign: "center" }}
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
//           padding: "40px 0",
//           textAlign: "center",
//           background: "#fffde8",
//           marginTop: 12,
//         }}
//       >
//         <div className="public-notice-inner">
//           <div
//             className="pub-notice-title"
//             style={{
//               display: "inline-block",
//               border: "2px solid #374151",
//               padding: "8px 20px",
//               fontWeight: 900,
//               marginBottom: 20,
//               fontSize: "28px",
//             }}
//           >
//             सार्वजनिक सूचना / PUBLIC NOTICE:
//           </div>

//           <p
//             className="body-text"
//             style={{ margin: "0 0 48px 0", lineHeight: 1.9, color: "#555" }}
//           >
//             हमारे संस्था द्वारा सदस्यता शुल्क, जॉब आवेदन शुल्क एवं एमओयू और
//             सहमति शुल्क के अलावा कोई अतिरिक्त शुल्क नहीं लिया जाता हैं (ये शुल्क
//             सिर्फ ऑनलाइन लिया जाता है) अगर इसके अलावा आपसे कोई अतिरिक्त शुल्क
//             मांगता है तो हमारे हेल्पलाइन नंबर एवं ईमेल पर आप शिकायत करें।
//           </p>

//           <p
//             className="body-text"
//             style={{ margin: 0, lineHeight: 1.9, color: "#555" }}
//           >
//             No extre fee is charged by our organization other than membership
//             fee, job application fee and MOU and consent fee (this fee is
//             charged online only through our website) If you ask for any
//             additional fee apart from this, please contact our helpline number
//             And complain by email.
//           </p>
//         </div>

//         <style>
//           {`
//       .public-notice-inner{
//         max-width: 900px;
//         margin: auto;
//         padding: 0 20px;
//       }

//       /* Desktop view */
//       @media (min-width: 1024px){
//         .public-notice-inner{
//           max-width: 1400px;
//         }
//       }
//     `}
//         </style>
//       </div>

//       {/* ── Notification — Desktop ── */}
//       <div
//         className="notif-cards-desktop"
//         style={{ background: "#fff", padding: "24px 0", marginTop: 0 }}
//       >
//         <div
//           style={{
//             maxWidth: "100%",
//             margin: "0 auto",
//             padding: "0 90px 0 105px",
//             display: "flex",
//             gap: 20,
//             alignItems: "stretch",
//             justifyContent: "center",
//           }}
//         >
//           <div
//             style={{
//               flex: "1 1 0",
//               minWidth: 0,
//               maxWidth: "50%",
//               display: "flex",
//               flexDirection: "column",
//               justifyContent: "center",
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
//               maxWidth: "50%",
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
//                 maxWidth: "100%",
//               }}
//             />
//           </div>
//         </div>
//       </div>

//       {/* ── Notifications + Cards — Mobile ── */}
//       {/* FIX: alignItems changed from "center" to "stretch" so both children match height */}
//       <div
//         className="notif-cards-mobile"
//         style={{
//           display: "none",
//           gap: 10,
//           padding: "20px 14px",
//           background: "#fff",
//           alignItems: "stretch",
//         }}
//       >
//         <div
//           style={{
//             flex: "1 1 0",
//             minWidth: 0,
//             display: "flex",
//             flexDirection: "column",
//           }}
//         >
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
//             alignItems: "stretch",
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
//               height: "100%",
//               objectFit: "cover",
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
//           marginTop: 24,
//         }}
//       >
//         <div className="intro-container">
//           <div className="intro-inner">
//             <div className="intro-col">
//               <h3 className="intro-heading">JAN SWASTHYA SAHAYATA ABHIYAN</h3>

//               <p className="body-text">
//                 <strong>Introduction :</strong> Jan Swasthya Sahayata Abhiyan
//                 has been formed by the Healthcare Research and Development Board
//                 (Division of Social Welfare Organization "NAC".) to provide
//                 affordable, free & better treatment with health related
//                 assistance to poor and needy people.
//               </p>

//               <p className="body-text">
//                 <strong>Purpose :</strong> To provide better treatment by
//                 special doctors, medicines and medical tests to the poor and
//                 needy people of the country through Jan Swasthya Sahayata
//                 Abhiyan...
//                 <button
//                   onClick={() => onNavigate("about")}
//                   className="read-btn"
//                 >
//                   read more
//                 </button>
//               </p>
//             </div>

//             <div className="intro-col">
//               <h3 className="intro-heading hindi">
//                 जन स्वास्थ्य सहायता अभियान
//               </h3>

//               <p className="body-text">
//                 <strong>परिचय :</strong> जन स्वास्थ्य सहायता अभियान का गठन
//                 हेल्थकेयर रिसर्च एंड डेवलपमेंट बोर्ड द्वारा सस्ती, निःशुल्क एवं
//                 बेहतर इलाज के लिए किया गया है।
//               </p>

//               <p className="body-text">
//                 <strong>उद्देश्य :</strong> जन स्वास्थ्य सहायता अभियान के माध्यम
//                 से देश के गरीब और जरूरतमंद लोगों को बेहतर उपचार प्रदान करना...
//                 <button
//                   onClick={() => onNavigate("about")}
//                   className="read-btn"
//                 >
//                   अधिक पढ़ें
//                 </button>
//               </p>
//             </div>
//           </div>
//         </div>

//         <style>
//           {`
//     .intro-container{
//       padding:0 150px 0 170px;
//     }

//     .intro-inner{
//       display:flex;
//       gap:48px;
//       flex-wrap:nowrap; /* mobile me bhi ek row */
//     }

//     .intro-col{
//       flex:1;
//     }

//     .intro-heading{
//       font-weight:900;
//       color:#1a1a1a;
//       margin-bottom:14px;
//       font-size:18px;
//       letter-spacing:0.02em;
//     }

//     .body-text{
//       line-height:1.9;
//       color:#333;
//       margin-bottom:20px;
//       font-size:15px;
//     }

//     .read-btn{
//       color:${BLUE_TEXT};
//       background:none;
//       border:none;
//       cursor:pointer;
//       padding:0;
//       font-size:inherit;
//       font-weight:600;
//     }

//     /* Mobile View */
//     @media (max-width:768px){

//       .intro-container{
//         padding:0 14px;
//       }

//       .intro-inner{
//         flex-direction: column !important;
//         gap: 20px !important;
//       }

//       .intro-col{
//         width: 100% !important;
//       }

//       .intro-heading{
//         font-size: 14px !important;
//         margin-bottom: 12px !important;
//         line-height: 1.4 !important;
//       }

//       .body-text{
//         font-size: 12px !important;
//         line-height: 1.7 !important;
//         margin-bottom: 16px !important;
//       }

//       .read-btn{
//         font-size: 12px !important;
//         text-decoration: underline !important;
//       }

//     }
//     `}
//         </style>
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

//         {/* Mobile Fix */}
//         <style>
//           {`
//       @media (max-width:768px){

//         .accred-label{
//           font-size:12px;
//         }

//         .accred-logos{
//           flex-wrap: nowrap !important;
//         }

//         .accred-logo{
//           width:60px !important;
//         }

//       }
//     `}
//         </style>
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

//       {/* Green Divider Bar */}
//       <div
//         style={{
//           width: "100%",
//           height: "8px",
//           background: GREEN,
//           position: "relative",
//           boxShadow: "0 2px 8px rgba(10, 202, 0, 0.3)",
//         }}
//       >
//         <div
//           style={{
//             position: "absolute",
//             top: 0,
//             left: 0,
//             right: 0,
//             height: "100%",
//             background: `linear-gradient(to bottom,
//               rgba(10, 202, 0, 0.1) 0%,
//               ${GREEN} 50%,
//               rgba(10, 202, 0, 0.1) 100%)`,
//             filter: "blur(2px)",
//           }}
//         />
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
//             <button
//               type="button"
//               className="login-blink"
//               onClick={(e) => {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 const newWindow = window.open(
//                   "https://frontend.jssabhiyan.com/",
//                   "_blank",
//                   "noopener,noreferrer",
//                 );
//                 if (!newWindow) {
//                   window.location.href = "https://frontend.jssabhiyan.com/";
//                 }
//               }}
//               style={{
//                 background: "#e53e3e",
//                 color: "#fff",
//                 fontWeight: 900,
//                 fontSize: 18,
//                 padding: "12px 50px",
//                 borderRadius: 4,
//                 cursor: "pointer",
//                 border: "none",
//                 display: "inline-block",
//                 letterSpacing: "0.04em",
//                 lineHeight: 1.3,
//                 pointerEvents: "auto",
//                 userSelect: "none",
//               }}
//             >
//               LOGIN
//             </button>
//             <a
//               href={brochurePDF}
//               target="_blank"
//               rel="noopener noreferrer"
//               style={{
//                 background: GREEN,
//                 color: "white",
//                 fontWeight: 900,
//                 fontSize: 18,
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
//           padding: "8px 10px",
//           gap: 8,
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             gap: 8,
//             width: "100%",
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
//               display: "flex",
//               alignItems: "center",
//             }}
//           >
//             <img
//               src={logo}
//               alt="JSS Logo"
//               style={{
//                 height: 50,
//                 width: "auto",
//                 objectFit: "contain",
//                 display: "block",
//               }}
//             />
//           </button>
//           <div
//             style={{
//               display: "flex",
//               gap: 6,
//               flexShrink: 0,
//               alignItems: "center",
//             }}
//           >
//             <button
//               type="button"
//               className="login-blink"
//               onClick={(e) => {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 const newWindow = window.open(
//                   "https://frontend.jssabhiyan.com/",
//                   "_blank",
//                   "noopener,noreferrer",
//                 );
//                 if (!newWindow) {
//                   window.location.href = "https://frontend.jssabhiyan.com/";
//                 }
//               }}
//               style={{
//                 background: "#e53e3e",
//                 color: "#fff",
//                 fontWeight: 700,
//                 fontSize: 11,
//                 padding: "6px 12px",
//                 borderRadius: 4,
//                 border: "none",
//                 cursor: "pointer",
//                 display: "inline-block",
//                 whiteSpace: "nowrap",
//                 lineHeight: 1.3,
//                 letterSpacing: "0.02em",
//                 pointerEvents: "auto",
//                 userSelect: "none",
//               }}
//             >
//               LOGIN
//             </button>
//             <a
//               href={brochurePDF}
//               target="_blank"
//               rel="noopener noreferrer"
//               style={{
//                 background: GREEN,
//                 color: "#000",
//                 fontWeight: 700,
//                 fontSize: 11,
//                 padding: "6px 12px",
//                 borderRadius: 4,
//                 cursor: "pointer",
//                 textDecoration: "none",
//                 display: "inline-block",
//                 whiteSpace: "nowrap",
//                 lineHeight: 1.3,
//                 letterSpacing: "0.02em",
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
//             gap: 8,
//             width: "100%",
//           }}
//         >
//           <img
//             src={swachhBharat}
//             alt="Swachh Bharat"
//             style={{
//               height: 28,
//               width: "auto",
//               objectFit: "contain",
//               flexShrink: 0,
//             }}
//           />
//           <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
//             {socialLinks.map((s, i) => (
//               <a
//                 key={i}
//                 href={s.url}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 style={{
//                   background: s.bg,
//                   borderRadius: 5,
//                   width: 26,
//                   height: 26,
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   textDecoration: "none",
//                   flexShrink: 0,
//                 }}
//               >
//                 <span
//                   style={{
//                     transform: "scale(0.75)",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                   }}
//                 >
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
//         style={{ background: "#1F3D0C", color: "#fff", padding: "36px 18px 0" }}
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
//                 color: "#D9F99D",
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
//                 color: "#D9F99D",
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
//                   color: "#D9F99D",
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
//             borderTop: "1px solid #3F6212",
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
//         @keyframes blink-red-green {
//           0%   { background: #e53e3e; }
//           50%  { background: #0aca00; }
//           100% { background: #e53e3e; }
//         }
//         .login-blink { animation: blink-red-green 2s ease-in-out infinite; }
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
//         .public-notice-inner { padding: 0 100px 0 140px; }
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
//           .hdr-mobile  { display: flex !important; flex-direction: column !important; padding: 8px 10px !important; min-height: unset !important; gap: 8px !important; }

//           /* Mobile header logo and buttons */
//           .hdr-mobile > div:first-child { align-items: center !important; }
//           .hdr-mobile img[alt="JSS Logo"] { height: 50px !important; }
//           .hdr-mobile > div:first-child > div a { font-size: 11px !important; padding: 6px 12px !important; }
//           .hdr-mobile img[alt="Swachh Bharat"] { height: 28px !important; }
//           .hdr-mobile > div:last-child > div a { width: 26px !important; height: 26px !important; }

//           .tb-topbar { flex-wrap: nowrap !important; padding-top: 4px !important; padding-bottom: 4px !important; padding-left: 8px !important; padding-right: 8px !important; gap: 6px !important; justify-content: space-between !important; align-items: center !important; height: auto !important; min-height: 40px !important; position: relative !important; width: 100% !important; box-sizing: border-box !important; border-top: 1px solid #2a2a2a !important; border-bottom: 1px solid #ffffff !important; }
//           .tb-left   { display: flex !important; gap: 5px !important; flex-shrink: 1 !important; min-width: 0 !important; align-items: center !important; overflow: hidden !important; max-width: 45% !important; }
//           .tb-phone  { display: flex !important; font-size: 8px !important; gap: 2px !important; white-space: nowrap !important; flex-shrink: 0 !important; font-weight: 500 !important; color: #000000 !important; align-items: center !important; }
//           .tb-phone svg { width: 9px !important; height: 9px !important; stroke: black !important; fill: none !important; flex-shrink: 0 !important; }
//           .tb-email  { display: flex !important; font-size: 7px !important; gap: 2px !important; white-space: nowrap !important; flex-shrink: 1 !important; min-width: 0 !important; font-weight: 500 !important; color: #000000 !important; align-items: center !important; overflow: hidden !important; text-overflow: ellipsis !important; }
//           .tb-email svg { width: 9px !important; height: 9px !important; flex-shrink: 0 !important; stroke: black !important; fill: none !important; }
//           .tb-search { position: absolute !important; left: 50% !important; transform: translateX(-50%) !important; display: flex !important; align-items: center !important; z-index: 10 !important; }
//           .tb-search input { width: 110px !important; max-width: 110px !important; font-size: 8px !important; padding: 4px 22px 4px 7px !important; height: 24px !important; font-weight: 500 !important; border: 1px solid #000000 !important; border-radius: 4px !important; }
//           .tb-search svg { width: 11px !important; height: 11px !important; right: 5px !important; position: absolute !important; pointer-events: none !important; }
//           .tb-dl-btn { font-size: 7px !important; padding: 4px 7px !important; white-space: nowrap !important; flex-shrink: 0 !important; height: 24px !important; font-weight: 700 !important; border-radius: 4px !important; }

//           /* Slightly larger mobile screens - adjust sizes */
//           @media (min-width: 480px) and (max-width: 768px) {
//             .tb-left { max-width: 50% !important; gap: 6px !important; }
//             .tb-phone { font-size: 9px !important; gap: 3px !important; }
//             .tb-phone svg { width: 10px !important; height: 10px !important; }
//             .tb-email { font-size: 8px !important; gap: 3px !important; }
//             .tb-email svg { width: 10px !important; height: 10px !important; }
//             .tb-search input { width: 120px !important; max-width: 120px !important; font-size: 9px !important; height: 26px !important; }
//             .tb-search svg { width: 12px !important; height: 12px !important; }
//             .tb-dl-btn { font-size: 8px !important; padding: 4px 8px !important; height: 26px !important; }
//           }

//           /* Very small screens (below 360px) */
//           @media (max-width: 360px) {
//             .tb-topbar { padding-left: 4px !important; padding-right: 4px !important; gap: 4px !important; }
//             .tb-left { max-width: 40% !important; gap: 4px !important; }
//             .tb-phone { font-size: 7px !important; gap: 2px !important; }
//             .tb-phone svg { width: 8px !important; height: 8px !important; }
//             .tb-email { font-size: 6px !important; gap: 2px !important; }
//             .tb-email svg { width: 8px !important; height: 8px !important; }
//             .tb-search input { width: 85px !important; max-width: 85px !important; font-size: 7px !important; padding: 3px 18px 3px 6px !important; height: 22px !important; }
//             .tb-search svg { width: 10px !important; height: 10px !important; }
//             .tb-dl-btn { font-size: 6px !important; padding: 3px 5px !important; height: 22px !important; }
//             .hdr-mobile { padding: 6px 8px !important; gap: 6px !important; }
//             .hdr-mobile img[alt="JSS Logo"] { height: 45px !important; }
//             .hdr-mobile > div:first-child > div a { font-size: 10px !important; padding: 5px 10px !important; }
//             .hdr-mobile img[alt="Swachh Bharat"] { height: 24px !important; }
//             .hdr-mobile > div:last-child > div a { width: 24px !important; height: 24px !important; }
//             .nav-btn { font-size: 5.5px !important; padding: 5px 1px !important; }
//           }

//           .slider-stats-wrap { display: flex !important; flex-direction: row !important; min-height: unset !important; align-items: stretch !important; justify-content: flex-start !important; padding: 0 !important; gap: 0 !important; width: 100% !important; overflow: hidden !important; }
//           .slider-area { flex: 0 0 55% !important; width: 55% !important; height: 200px !important; min-height: 200px !important; max-height: 200px !important; border-radius: 0 !important; }
//           .stats-area  { flex: 0 0 45% !important; width: 45% !important; display: grid !important; grid-template-columns: 1fr 1fr !important; border-left: 1px solid #eee !important; border-top: none !important; background: #fff !important; height: 200px !important; }
//           .stat-cell   { padding: 4px 2px !important; border-bottom: 1px solid #eee !important; border-right: 1px solid #eee !important; gap: 1px !important; align-items: center !important; justify-content: center !important; }
//           .stat-cell:nth-child(2), .stat-cell:nth-child(4) { border-right: none !important; }
//           .stat-cell:nth-child(3), .stat-cell:nth-child(4) { border-bottom: none !important; }

//           .nav-list { width: 100% !important; flex-wrap: nowrap !important; display: flex !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
//           .nav-item  { flex: 1 1 0 !important; min-width: fit-content !important; }
//           .nav-btn   { font-size: 6px !important; padding: 6px 2px !important; width: 100% !important; text-align: center !important; letter-spacing: 0 !important; white-space: nowrap !important; color: #000 !important; font-weight: 700 !important; }

//           .notif-cards-desktop { display: none !important; }
//           /* FIX: align-items: stretch so notification and card match height on mobile */
//           .notif-cards-mobile  { display: flex !important; flex-direction: row !important; padding: 20px 14px !important; width: 100% !important; box-sizing: border-box !important; align-items: stretch !important; margin-top: 0 !important; }

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
//           .public-notice-wrap { padding: 20px 0 !important; }
//           .public-notice-inner { padding: 0 12px !important; }
//           .pub-notice-title { font-size: 11px !important; padding: 6px 10px !important; }

//           .body-text       { font-size: 11px; }
//           .org-text         { font-size: 8px !important; line-height: 1.9 !important; }
//           .notice-text      { font-size: 8px !important; font-weight: 400 !important; line-height: 1.4 !important; margin-bottom: 14px !important; }
//           .notice-important  { font-size: 8px !important; font-weight: 600 !important; padding: 10px 12px !important; margin-bottom: 14px !important; }
//           .section-heading { font-size: 11px; }
//           .cert-btn        { font-size: 8px !important; padding: 10px 2px !important; }
//           .accred-label    { font-size: 9px; }
//           .accred-logo     { height: 44px; }

//           .intro-inner { flex-direction: column !important; gap: 20px !important; }
//           .intro-section { padding: 20px 0 !important; }
//           .intro-container { padding: 0 14px !important; }
//           .intro-col { width: 100% !important; }
//           .intro-heading { font-size: 14px !important; margin-bottom: 12px !important; line-height: 1.4 !important; }
//           .intro-section .body-text { font-size: 12px !important; line-height: 1.7 !important; margin-bottom: 16px !important; }
//           .intro-section .read-btn { font-size: 12px !important; text-decoration: underline !important; }

//           .cert-section { padding: 16px 10px !important; }
//           .cert-btn-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 4px !important; }

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
import { useNavigate, useLocation } from "react-router-dom";
import myGovLogo from "../assets/jss1.png";
import unicefLogo from "../assets/jss2.png";
import nitiAayogLogo from "../assets/jss3.jpeg";
import msmeLogo from "../assets/jss4.png";
import logo from "../assets/img0.png";
import swachhBharat from "../assets/Swachh.png";
import appImg1 from "../assets/img2b.png";
import appImg2 from "../assets/img1.png";
import appImg3 from "../assets/img3a.png";
import logo1 from "../assets/jss.png";
import cert1 from "../assets/cer1.jpeg";
import cert2 from "../assets/cer4.jpeg";
import cert3 from "../assets/cer5.jpeg";
import cert4 from "../assets/cer4.jpeg";
import cert5 from "../assets/cer5.jpeg";
import cert6 from "../assets/cer6.jpeg";
import cert7 from "../assets/cer7.jpeg";
import cert8 from "../assets/cer8.jpeg";
import cert9 from "../assets/cer9.jpeg";
import cert10 from "../assets/cer10.jpeg";
import cert11 from "../assets/cer1.jpeg";
import cert12 from "../assets/cer7.jpeg";
import cert13 from "../assets/cer9.jpeg";
import cert14 from "../assets/cer1.jpeg";
import cert15 from "../assets/cer10.jpeg";
import cardImg1 from "../assets/jss.jpeg";
import AboutPage from "../pages/Aboutpage";
import MembershipPage from "../pages/Membershippage";
import ServicesPage from "../pages/Servicespage";
import JobsPage from "../pages/Jobspage";
import NotificationsPage from "../pages/Notificationspage";
import GalleryPage from "../pages/Gallerypage";
import VerificationPage from "../pages/Verificationpage";
import ContactsPage from "../pages/Contactspage";
import PrivacyPolicy from "../pages/Policypage";
import RefundPage from "../pages/Refundpage";
import TermsPage from "../pages/Termspage";
import EnquiryPage from "../pages/Enquirypage";
import { jobPostingsAPI, scrollerAPI, notificationsAPI, galleryAPI, noticesAPI } from "../utils/api.js";
import brochurePDF from "../assets/broucher.pdf";
import NoticeDisplay from "../components/NoticeDisplay.jsx";
import { CampSlider } from "./Verificationpage";
import apiRequest from "../utils/api";
import { Briefcase, Headphones, Heart, Star, Users } from "lucide-react";

// Applicant/Admin portal (admin app, vite port 5174). Override with VITE_LOGIN_URL in production.
const PORTAL_URL = (import.meta.env.VITE_LOGIN_URL || "http://localhost:5174/").replace(/\/?$/, "/");

const GREEN = "#4D7C0F";
const BLUE_TEXT = "#1a56c4";

const fallbackSlides = [
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1100&q=80",
  "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1100&q=80",
  "https://images.unsplash.com/photo-1593491205049-7f032d28cf01?w=1100&q=80",
  "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1100&q=80",
];

const PATH_TO_PAGE = {
  "/": "home",
  "/about": "about",
  "/feeds": "feeds",
  "/membership": "membership",
  "/services": "services",
  "/jobs": "jobs",
  "/news": "news",
  "/notifications": "notifications",
  "/gallery": "gallery",
  "/verification": "verification",
  "/contacts": "contacts",
  "/privacy-policy": "privacy",
  "/refund": "refund",
  "/terms": "terms",
  "/enquiry": "enquiry",
  "/donate": "donate",
  "/donate/learn-more": "donateInfo",
};

const PAGE_TO_PATH = {
  home: "/",
  about: "/about",
  feeds: "/feeds",
  membership: "/membership",
  services: "/services",
  jobs: "/jobs",
  news: "/news",
  notifications: "/notifications",
  gallery: "/gallery",
  verification: "/verification",
  contacts: "/contacts",
  privacy: "/privacy-policy",
  refund: "/refund",
  terms: "/terms",
  enquiry: "/enquiry",
  donate: "/donate",
  donateInfo: "/donate/learn-more",
};

const navLinks = [
  { label: "HOME", page: "home" },
  { label: "ABOUT US", page: "about" },
  { label: "FEEDS", page: "feeds" },
  { label: "MEMBERSHIPS & BENEFITS", page: "membership" },
  { label: "SERVICES", page: "services" },
  { label: "JOBS & CAREERS", page: "jobs" },
  { label: "NOTIFICATIONS", page: "notifications" },
  { label: "GALLERY", page: "gallery" },
  // { label: "VERIFICATION", page: "verification" },
  { label: "CONTACTS", page: "contacts" },
  { label: "NEWS & UPDATES", page: "news" },
];

const homeNavLinks = [
  { en: "Home", hi: "होम", target: "top" },
  { en: "About", hi: "हमारे बारे में", target: "about" },
  { en: "Jobs & Career", hi: "नौकरी एवं करियर", target: "jobs" },
  { en: "Notifications", hi: "सूचनाएं", target: "notifications" },
  { en: "Gallery", hi: "गैलरी", target: "gallery" },
  { en: "Feed", hi: "फीड", target: "feed" },
  { en: "News & Updates", hi: "समाचार", target: "news" },
];

/* ─── Animated Counter ─── */
function CounterNumber({ target, duration = 2000, autoIncrease = false }) {
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

          const end = parseInt(String(target).replace(/\D/g, ""), 10) || 0;
          const startTime = performance.now();

          const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const eased = 1 - Math.pow(1 - progress, 3);

            setCount(Math.floor(eased * end));

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setCount(end);
            }
          };

          requestAnimationFrame(step);
        }
      },
      {
        threshold: 0.1,
      }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, [target, duration]);

  // Demo ke liye continuously increase
  useEffect(() => {
    if (!autoIncrease) return;

    const interval = setInterval(() => {
      setCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 2500);

    return () => clearInterval(interval);
  }, [autoIncrease]);

  return (
    <span ref={ref}>
      {count.toLocaleString("en-IN")}
    </span>
  );
}
// function CounterNumber({ target, duration = 2000 ,autoIncrease=false}) {
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
//   useEffect(() => {
//     if (!autoIncrease) return;

//     const interval = setInterval(() => {
//       setCount((prev) => prev + Math.floor(Math.random() * 5) + 1);
//     }, 3000);

//     return () => clearInterval(interval);
//   }, [autoIncrease]);
//   return <span ref={ref}>{count.toLocaleString("en-IN")}</span>;
// }

// /* ─── Unified MarqueeBand ─── */
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
  const rowHeightM = 14;
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
          .mband-mob-${animId}  { display: flex !important; justify-content: center; }
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
              <br
                style={{
                  lineHeight: "0.05em",
                  display: "block",
                  margin: "8px 0",
                }}
              />
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
            {(!items || items.length === 0) ? (
              <div style={{ paddingLeft: 40, color: "#777", fontSize: 15, fontStyle: "italic", fontWeight: 500 }}>
                No latest updates available at the moment.
              </div>
            ) : (
              rows.map((item, i) => (
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
                            color: "#1a4fa0",
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
              )))}
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
          padding: "6px 0",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            width: "80%",
            minHeight: rowHeightM * ROWS,
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px 3px",
              background: "#f2f2f2",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: 7,
                color: "#2d3748",
                lineHeight: 1.2,
                textAlign: "center",
                display: "block",
              }}
            >
              {labelLine1}
              <br />
              {labelLine2}
            </span>
          </div>
          <div
            style={{
              width: 0,
              flexShrink: 0,
              borderLeft: "2px dashed #b8b8b8",
              margin: "4px 0",
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
            {(!items || items.length === 0) ? (
              <div style={{ paddingLeft: 6, color: "#777", fontSize: 10, fontStyle: "italic", fontWeight: 500 }}>
                No latest updates available.
              </div>
            ) : (
              rows.map((item, i) => (
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
                        paddingLeft: 6,
                      }}
                    >
                      {[0, 1].map((copy) => (
                        <a
                          key={copy}
                          href={getLink(item)}
                          style={{
                            display: "inline-block",
                            color: "#1a4fa0",
                            fontWeight: 600,
                            fontSize: 9,
                            textDecoration: "underline",
                            textUnderlineOffset: 2,
                            whiteSpace: "nowrap",
                            paddingRight: 40,
                          }}
                        >
                          {getText(item)}
                          {getIsNew(item) && (
                            <span
                              style={{
                                marginLeft: 3,
                                background: "#e53e3e",
                                color: "#fff",
                                fontSize: 6,
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
                    <span style={{ paddingLeft: 6, color: "#ccc", fontSize: 8 }}>
                      —
                    </span>
                  )}

                </div>
              )))}
          </div>
        </div>
      </div>
    </>
  );
}

function VacanciesBand({ items = [] }) {
  if (!items || items.length === 0) return null;

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
  if (!items || items.length === 0) return null;

  return (
    <MarqueeBand
      labelLine1="Latest"
      labelLine2="Results"
      items={items}
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
  const fs = isMobile ? 11 : 13;
  const pad = isMobile ? "9px 11px" : "11px 14px";
  const height = isMobile ? 130 : 200;

  const tickerRef = useRef(null);
  const innerRef = useRef(null);
  const animRef = useRef(null);
  const posRef = useRef(0);
  const [canScroll, setCanScroll] = useState(false);

  // Decide whether content actually overflows. If not, don't animate (prevents "jitter" and avoids
  // looking like items are repeating).
  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || notifications.length === 0) {
      setCanScroll(false);
      return;
    }
    // Measure after paint
    const id = requestAnimationFrame(() => {
      const contentH = inner.scrollHeight;
      setCanScroll(contentH > height);
    });
    return () => cancelAnimationFrame(id);
  }, [notifications, isMobile, height]);

  useEffect(() => {
    const ticker = tickerRef.current;
    const inner = innerRef.current;
    // Animate only when we have enough content to scroll. Single pass from bottom → top, then stop.
    if (!ticker || !inner || notifications.length === 0 || !canScroll) return;
    posRef.current = 0;
    inner.style.transform = "translateY(0px)";
    const SPEED = isMobile ? 0.4 : 0.5;
    const maxScroll = Math.max(0, inner.scrollHeight - height);
    if (maxScroll <= 0) return;
    const tick = () => {
      posRef.current += SPEED;
      if (posRef.current >= maxScroll) {
        posRef.current = maxScroll;
        inner.style.transform = `translateY(-${posRef.current}px)`;
        cancelAnimationFrame(animRef.current);
        return;
      }
      inner.style.transform = `translateY(-${posRef.current}px)`;
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    const pause = () => cancelAnimationFrame(animRef.current);
    const resume = () => {
      // If we've already finished the one-pass scroll, don't restart it.
      if (posRef.current >= maxScroll) return;
      animRef.current = requestAnimationFrame(tick);
    };
    ticker.addEventListener("mouseenter", pause);
    ticker.addEventListener("mouseleave", resume);
    return () => {
      cancelAnimationFrame(animRef.current);
      ticker.removeEventListener("mouseenter", pause);
      ticker.removeEventListener("mouseleave", resume);
    };
  }, [notifications, isMobile, canScroll, height]);

  const cards = notifications.slice(0, 8).map((n, i) => {
    const commonStyle = {
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      color: "#2c3e50",
      fontWeight: 600,
      fontSize: fs,
      padding: isMobile ? "12px 10px" : "16px 24px",
      lineHeight: 1.6,
      textDecoration: "none",
      borderBottom: "1px solid #f0f0f0",
      flexShrink: 0,
      background: "#fff",
      borderTop: "none",
      borderLeft: "none",
      borderRight: "none",
      textAlign: "left",
      width: "100%",
      cursor: "pointer",
      transition: "background 0.2s"
    };

    const content = (
      <>
        <div style={{ flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", background: "#e8f5e2" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2ecc1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
        <span style={{ flex: 1, paddingRight: 10 }}>{n.title}</span>
        <span
          style={{
            display: "inline-block",
            fontSize: isMobile ? 8 : 10,
            fontWeight: 800,
            padding: "3px 8px",
            borderRadius: 6,
            verticalAlign: "middle",
            animation: "newBadge 1.5s infinite",
            background: "#e53e3e",
            color: "#fff",
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}
        >
          NEW
        </span>
      </>
    );

    // If URL exists, open it in a new tab; otherwise route to the notifications page.
    if (n.url) {
      return (
        <a
          key={i}
          href={n.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...commonStyle, width: "auto", cursor: "pointer", display: "flex" }}
          className="notif-item-hover"
        >
          {content}
        </a>
      );
    }

    return (
      <button
        key={i}
        type="button"
        style={commonStyle}
        className="notif-item-hover"
        onClick={() => onSeeMore && onSeeMore()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && onSeeMore) onSeeMore();
        }}
      >
        {content}
      </button>
    );
  });

  return (
    <div
      style={{
        flex: 1,
        height: "100%",
        borderRadius: 8,
        border: "1px solid #e2e8f0",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
      }}
    >
      <style>{`
        .notif-item-hover:hover { background: #f8fafc !important; }
      `}</style>
      <div style={{ background: "#2ecc1a", padding: isMobile ? "12px 14px" : "18px 24px", display: "flex", alignItems: "center", gap: 10 }}>
        <svg width={isMobile ? 18 : 24} height={isMobile ? 18 : 24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        <h2
          style={{
            color: "#fff",
            fontWeight: 800,
            fontSize: isMobile ? 14 : 20,
            margin: 0,
            flexShrink: 0,
            letterSpacing: "0.02em"
          }}
        >
          Latest Notifications
        </h2>
      </div>
      {notifications.length === 0 ? (
        <div
          style={{
            color: "#64748b",
            fontSize: isMobile ? 12 : 14,
            padding: isMobile ? "20px" : "40px 20px",
            textAlign: "center",
            fontWeight: 500,
            fontStyle: "italic"
          }}
        >
          No new notifications available at the moment.
        </div>
      ) : (
        <div
          ref={tickerRef}
          style={{
            height: height,
            overflow: "hidden",
            flex: 1,
            cursor: "pointer",
            background: "#fff"
          }}
        >
          <div ref={innerRef} style={{ willChange: "transform" }}>
            {cards}
          </div>
        </div>
      )}
    </div>
  );
}

function dedupeNotifications(items) {
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
    <circle cx="31" cy="39" r="4" fill="none" stroke={color} strokeWidth="2" />
    <path d="M27 35 Q25 25 21 23" fill="none" stroke={color} strokeWidth="2" />
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
  const { landingConfig } = useLandingConfig();
  const phoneNumber = landingConfig?.floatingIcon?.phone || "9471987611";
  const whatsappNumber = landingConfig?.floatingIcon?.whatsapp || "919471987611";

  return (
    <>
      <div style={{ position: "fixed", left: 20, bottom: 20, zIndex: 1000 }}>
        <a
          href={`tel:${phoneNumber.replace(/[^\d+]/g, '')}`}
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
          href={`https://wa.me/${whatsappNumber.replace(/[^\d+]/g, '')}`}
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

/* ─── FEED SLIDER ─── */
function FeedSlider({ feeds, setSelectedFeed }) {
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

  if (!feeds || feeds.length === 0) return null;

  const visibleCount = isMobile ? 1 : 4;
  const maxSlide = Math.max(0, feeds.length - visibleCount);

  useEffect(() => {
    if (maxSlide <= 0) return;
    const t = setInterval(() => {
      setCurrent((c) => (c >= maxSlide ? 0 : c + 1));
    }, 4000);
    return () => clearInterval(t);
  }, [maxSlide]);

  const BASE_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
    : "http://localhost:3005";
  const getImageUrl = (rawUrl) => {
    if (!rawUrl) return "";
    const url = rawUrl.replace(/\\/g, "/");
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return `${BASE_URL}${url}`;
    return `${BASE_URL}/${url}`;
  };

  return (
    <div style={{ position: "relative", padding: isMobile ? "0 44px" : "0 36px" }}>
      <div style={{ overflow: "hidden", padding: "10px 0" }}>
        <div style={{
          display: "flex",
          justifyContent: feeds.length < visibleCount ? "center" : "flex-start",
          gap: 24,
          transform: `translateX(calc(-${current * (100 / visibleCount)}% - ${current * (24 / visibleCount)}px))`,
          transition: "transform 0.4s ease",
        }}>
          {feeds.map((feed, i) => (
            <div key={i} style={{
              flexShrink: 0,
              width: isMobile ? "100%" : `calc(${100 / visibleCount}% - ${24 * (visibleCount - 1) / visibleCount}px)`,
              background: "#fff",
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              display: "flex",
              flexDirection: "column"
            }}>
              {feed.image && (
                <div style={{ width: "100%", height: 240, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
                  <div style={{ position: "absolute", top: -20, left: -20, right: -20, bottom: -20, backgroundImage: `url(${getImageUrl(feed.image)})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(15px)", opacity: 0.5, zIndex: 0 }} />
                  <img src={getImageUrl(feed.image)} alt="Feed" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", position: "relative", zIndex: 1 }} />
                </div>
              )}
              {feed.images && feed.images.length > 0 && !feed.image && (
                <div style={{ width: "100%", height: 240, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
                  <div style={{ position: "absolute", top: -20, left: -20, right: -20, bottom: -20, backgroundImage: `url(${getImageUrl(feed.images[0])})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(15px)", opacity: 0.5, zIndex: 0 }} />
                  <img src={getImageUrl(feed.images[0])} alt="Feed" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", position: "relative", zIndex: 1 }} />
                </div>
              )}
              <div style={{ padding: 20, display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                <div>
                  <div style={{
                    margin: "0 0 8px 0",
                    color: "#333",
                    fontSize: 14,
                    lineHeight: 1.6,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    minHeight: "4.8em",
                    whiteSpace: "pre-wrap"
                  }}>
                    {feed.text}
                  </div>
                  {feed.text && feed.text.length > 80 && (
                    <div style={{ marginBottom: 16 }}>
                      <span onClick={() => setSelectedFeed(feed)} style={{ color: "#0aca00", fontWeight: "bold", cursor: "pointer", fontSize: 13 }}>
                        View More
                      </span>
                    </div>
                  )}
                  {(!feed.text || feed.text.length <= 80) && (
                    <div style={{ marginBottom: 16, height: 20 }}></div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid #eee", paddingTop: 16 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#0aca00", overflow: "hidden", flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: 13, letterSpacing: 0.5 }}>
                    <span>{feed.author?.name ? feed.author.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() : "U"}</span>
                    {feed.author?.photo && (
                      <img
                        src={getImageUrl(feed.author.photo)}
                        alt=""
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div style={{ overflow: "hidden", flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {feed.author?.name || "JSSA User"}
                    </div>
                    <div style={{ fontSize: 12, color: "#777" }}>
                      {new Date(feed.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#0aca00", fontSize: 13, fontWeight: "bold" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span>{feed.likes?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {current > 0 && maxSlide > 0 && (
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            background: "#fff",
            borderRadius: "50%",
            border: "2px solid #0aca00",
            width: isMobile ? 36 : 30,
            height: isMobile ? 36 : 30,
            fontSize: isMobile ? 22 : 18,
            cursor: "pointer",
            color: "#0aca00",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: "2px",
            zIndex: 10,
          }}
        >
          ‹
        </button>
      )}
      {current < maxSlide && maxSlide > 0 && (
        <button
          onClick={() => setCurrent((c) => Math.min(maxSlide, c + 1))}
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            background: "#fff",
            borderRadius: "50%",
            border: "2px solid #0aca00",
            width: isMobile ? 36 : 30,
            height: isMobile ? 36 : 30,
            fontSize: isMobile ? 22 : 18,
            cursor: "pointer",
            color: "#0aca00",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: "2px",
            zIndex: 10,
          }}
        >
          ›
        </button>
      )}

    </div>
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

  const BASE_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
    : "http://localhost:3005";

  const getImageUrl = (rawUrl) => {
    if (!rawUrl) return "";
    const url = rawUrl.replace(/\\/g, "/");
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return `${BASE_URL}${url}`;
    return `${BASE_URL}/${url}`;
  };
  const [activeCamps, setActiveCamps] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [loadingFeeds, setLoadingFeeds] = useState(true);

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        setLoadingFeeds(true);
        const res = await apiRequest("/feeds/public/all?limit=10", { method: "GET" });
        if (res.success && res.data) {
          setFeeds(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch feeds:", err);
      } finally {
        setLoadingFeeds(false);
      }
    };
    fetchFeeds();
  }, []);

  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const res = await apiRequest("/camps/public/active", { method: "GET" });
        if (res.success && res.data) {
          setActiveCamps(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch active camps:", err);
      }
    };
    fetchCamps();
  }, []);

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
            setSlides(sortedImages.map((i) => getImageUrl(i.imageUrl)));
            setScrollerImages(sortedImages);
            setSlide(0);
          } else {
            setSlides(fallbackSlides);
            setSlide(0);
          }
        } else {
          setSlides(fallbackSlides);
          setSlide(0);
        }
      } catch {
        setSlides(fallbackSlides);
        setSlide(0);
      }
    };
    fetch_();
  }, []);

  // Ensure slide index is always valid when slides change
  useEffect(() => {
    if (slides.length > 0 && slide >= slides.length) {
      setSlide(0);
    }
  }, [slides.length, slide]);

  useEffect(() => {
    if (slides.length > 0) {
      // Ensure slide index is valid
      if (slide >= slides.length) {
        setSlide(0);
      }
      const t = setInterval(
        () => setSlide((s) => {
          const next = (s + 1) % slides.length;
          return next >= 0 && next < slides.length ? next : 0;
        }),
        4000,
      );
      return () => clearInterval(t);
    }
  }, [slides.length, slide]);

  useEffect(() => {
    const fetch_ = async () => {
      const parseFlexibleDate = (value) => {
        if (!value) return null;
        const raw = String(value).trim();
        const nativeParsed = new Date(raw);
        if (!Number.isNaN(nativeParsed.getTime())) return nativeParsed;

        const dayFirst = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
        if (dayFirst) {
          const day = Number(dayFirst[1]);
          const month = Number(dayFirst[2]);
          const year = Number(dayFirst[3]);
          const parsed = new Date(year, month - 1, day);
          if (
            parsed.getFullYear() === year &&
            parsed.getMonth() === month - 1 &&
            parsed.getDate() === day
          ) {
            return parsed;
          }
        }

        const yearFirst = raw.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
        if (yearFirst) {
          const year = Number(yearFirst[1]);
          const month = Number(yearFirst[2]);
          const day = Number(yearFirst[3]);
          const parsed = new Date(year, month - 1, day);
          if (
            parsed.getFullYear() === year &&
            parsed.getMonth() === month - 1 &&
            parsed.getDate() === day
          ) {
            return parsed;
          }
        }

        return null;
      };

      const isOpenVacancy = (item) => {
        if (!item?.lastDate) return true;
        const parsed = parseFlexibleDate(item.lastDate);
        if (!parsed) return true;
        parsed.setHours(23, 59, 59, 999);
        return parsed >= new Date();
      };

      try {
        setLoadingVacancies(true);
        const r = await jobPostingsAPI.getLatestVacancies();
        const list = r.success && r.data?.vacancies ? r.data.vacancies : [];
        setVacancies(list.filter(isOpenVacancy));
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
        // Fetch ALL notifications (active + inactive). Backend filtering can be applied server-side if needed.
        const r = await notificationsAPI.getAll("true");
        const list = r.success && r.data ? r.data.notifications || [] : [];
        setNotifications(dedupeNotifications(list));
      } catch {
        setNotifications([]);
      }
    };
    fetch_();
    const iv = setInterval(fetch_, 30000);
    return () => clearInterval(iv);
  }, []);

  // --- Dynamic Stats Logic ---
  const baseDate = new Date("2026-08-06T00:00:00Z");
  const currentDate = new Date();
  
  // Calculate days and weeks passed (minimum 0 to prevent negative values)
  const diffTime = Math.max(currentDate.getTime() - baseDate.getTime(), 0); 
  const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weeksPassed = Math.floor(daysPassed / 7);

  // Original base values
  const baseJoined = 2265;
  const baseBenefits = 2185;
  const baseMedical = 2265;
  const baseYoga = 2185;

  // Calculate dynamic current values
  const currentJoined = baseJoined + (daysPassed * 10);
  const currentBenefits = baseBenefits + (daysPassed * 2);
  const currentMedical = baseMedical + (weeksPassed * 2);
  const currentYoga = baseYoga + (weeksPassed * 2);

  const statsData = [
    {
      icon: <PersonIcon color="#3AB000" size={46} />,
      mobileIcon: <PersonIcon color="#3AB000" size={28} />,
      num: currentJoined.toLocaleString("en-IN"),
      label: "Joined Us",
    },
    {
      icon: <PersonIcon color="#1565c0" size={46} />,
      mobileIcon: <PersonIcon color="#1565c0" size={28} />,
      num: currentBenefits.toLocaleString("en-IN"),
      label: "Took Benefits",
    },
    {
      icon: <DoctorIcon size={46} color="#dc2626" />,
      mobileIcon: <DoctorIcon size={28} color="#dc2626" />,
      num: currentMedical.toLocaleString("en-IN"),
      label: "Medical Camps",
    },
    {
      icon: <YogaIcon size={46} color="#f97316" />,
      mobileIcon: <YogaIcon size={28} color="#f97316" />,
      num: currentYoga.toLocaleString("en-IN"),
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
                const isActive = i === slide;
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
                      opacity: isActive ? 1 : 0,
                      transition: "opacity 0.8s ease",
                      zIndex: isActive ? 2 : 1,
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = fallbackSlides[i % fallbackSlides.length];
                    }}
                    onLoad={(e) => {
                      // Ensure image is loaded before showing
                      if (isActive) {
                        e.target.style.opacity = "1";
                      }
                    }}
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
                    onClick={() => {
                      setSlide((s) => {
                        const prev = (s - 1 + slides.length) % slides.length;
                        return prev >= 0 && prev < slides.length ? prev : 0;
                      });
                    }}
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
                    onClick={() => {
                      setSlide((s) => {
                        const next = (s + 1) % slides.length;
                        return next >= 0 && next < slides.length ? next : 0;
                      });
                    }}
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
              <div className="stat-content-wrapper">
                <div className="stat-icon-bg">
                  <span className="stat-icon-desktop">{s.icon}</span>
                  <span className="stat-icon-mobile">{s.mobileIcon}</span>
                </div>
                <div className="stat-text-wrap">
                  <span className="stat-num">
                    <CounterNumber target={s.num}autoIncrease={s.label === "Registered Users"} />
                  </span>
                  <span className="stat-label">
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
        <div
          className="notice-app-inner"
          style={{ padding: "0 175px 0 175px" }}
        >
          {/* Dynamic Notice Display */}
          <NoticeDisplay />

          {/* Action Buttons */}
          <div
            className="action-btns-row"
            style={{ display: "flex", gap: 20, marginBottom: 32 }}
          >
            {[
              { label: "Online Test & Interview", link: `${PORTAL_URL}my-exam` },
              { label: "Online Mou & Consent Form", link: `${PORTAL_URL}my-exam` },
              { label: "Authorized Login", link: `${PORTAL_URL}login` },
            ].map((btn, i) => (
              <button
                key={i}
                className="action-btn"
                onClick={() => btn.link && (window.location.href = btn.link)}
                style={{
                  flex: 1,
                  background: "#2ecc1a",
                  color: "#000",
                  fontWeight: 700,
                  padding: "18px 6px",
                  borderRadius: 5,
                  border: "none",
                  cursor: btn.link ? "pointer" : "default",
                  lineHeight: 1.3,
                  fontSize: 15,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {btn.label}
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
              <div
                key={i}
                className="app-img-wrapper"
                style={{
                  width: "31%",
                  position: "relative"
                }}
              >
                <img
                  src={src}
                  alt={`app${i + 1}`}
                  className="app-img"
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    display: "block",
                    filter: i === 2 ? "grayscale(30%)" : "none"
                  }}
                />
                {i === 2 && (
                  <div style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(255, 255, 255, 0.4)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 10,
                    backdropFilter: "blur(6px)"
                  }}>
                    <div className="coming-soon-badge">
                      JSSA Application <br /> Coming Soon
                    </div>
                  </div>
                )}
              </div>
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
        style={{ background: "#e8f5e2", padding: "40px 0", marginTop: 12 }}
      >
        <div
          className="org-info-inner"
          style={{ padding: "0 175px 0 175px", textAlign: "center" }}
        >
          <p
            className="body-text org-text"
            style={{ color: "#333", lineHeight: 1.8, margin: 0, fontWeight: 700, fontSize: "1.05rem" }}
          >
            This project is organized under the social welfare organization 'NAC' (Registration No.: 053083),
            incorporated under Pursuant to sub-section (2) of section 7 and sub-section (1) of section 8
            of the Companies Act, 2013 (18 of 2013) and rule 18 of the Companies (Incorporation) Rules, 2014.
          </p>
        </div>
      </div>

      {/* ── Notification — Desktop ── */}
      <div
        className="notif-cards-desktop"
        style={{ background: "#fff", padding: "24px 0", marginTop: 0 }}
      >
        <div
          style={{
            maxWidth: "100%",
            margin: "0 auto",
            padding: "0 90px 0 105px",
            display: "flex",
            gap: 20,
            alignItems: "stretch",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              flex: "1 1 0",
              minWidth: 0,
              maxWidth: "50%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
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
              maxWidth: "50%",
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
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                maxWidth: "100%",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Notifications + Cards — Mobile ── */}
      <div
        className="notif-cards-mobile"
        style={{
          display: "none",
          gap: 24,
          padding: "20px 14px",
          background: "#fff",
          alignItems: "stretch",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: "100%",
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
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #e0e0e0",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }}
        >
          <img
            src={cardImg1}
            alt="JSS Card"
            style={{
              width: "100%",
              height: "auto",
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
    .intro-container{ padding:0 150px 0 170px; }
    .intro-inner{ display:flex; gap:48px; flex-wrap:nowrap; }
    .intro-col{ flex:1; }
    .intro-heading{ font-weight:900; color:#1a1a1a; margin-bottom:14px; font-size:18px; letter-spacing:0.02em; }
    .body-text{ line-height:1.9; color:#333; margin-bottom:20px; font-size:15px; }
    .read-btn{ color:${BLUE_TEXT}; background:none; border:none; cursor:pointer; padding:0; font-size:inherit; font-weight:600; }
    @media (max-width:768px){
      .intro-container{ padding:0 14px; }
      .intro-inner{ flex-direction: row !important; gap: 16px !important; }
      .intro-col{ width: 100% !important; }
      .intro-heading{ font-size: 14px !important; margin-bottom: 12px !important; line-height: 1.4 !important; }
      .body-text{ font-size: 12px !important; line-height: 1.7 !important; margin-bottom: 16px !important; }
      .read-btn{ font-size: 12px !important; text-decoration: underline !important; }
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
            { label: "Enquiry", page: "enquiry" },
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

      {activeCamps.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <CampSlider camps={activeCamps} isFullWidth={true} />
        </div>
      )}

      {/* ── LATEST FEEDS & UPDATES ── */}
      {(loadingFeeds || (feeds && feeds.length > 0)) && (
        <div className="cert-section" style={{ background: "#f8f9fa", padding: "28px 100px 28px 200px", marginTop: 24, borderTop: "1px solid #eee", borderBottom: "1px solid #eee" }}>
          <div>
            <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 900, color: "#3F6212", marginBottom: 32, textTransform: "uppercase" }}>
              Latest Feeds & Updates
            </h2>
            {loadingFeeds ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
                <style>{`@keyframes feedspin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <div style={{ width: 40, height: 40, borderRadius: "50%", border: "4px solid #eee", borderTopColor: "#0aca00", animation: "feedspin 1s linear infinite" }} />
              </div>
            ) : (
              <>
                <FeedSlider feeds={feeds} setSelectedFeed={setSelectedFeed} />
                <div style={{ textAlign: "center", marginTop: 24 }}>
                  <button
                    onClick={() => onNavigate("feeds")}
                    style={{
                      background: "#0aca00",
                      color: "#fff",
                      border: "none",
                      padding: "10px 24px",
                      fontSize: 15,
                      fontWeight: "bold",
                      borderRadius: 25,
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(10, 202, 0, 0.3)",
                    }}
                  >
                    View All Feeds
                  </button>
                </div>
              </>
            )}
          </div>

          {selectedFeed && (() => {
            const BASE_URL = import.meta.env.VITE_API_URL
              ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
              : "http://localhost:3005";
            const getImageUrl = (url) => {
              if (!url) return "";
              if (url.startsWith("http")) return url;
              if (url.startsWith("/")) return `${BASE_URL}${url}`;
              return `${BASE_URL}/${url}`;
            };
            return (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setSelectedFeed(null)}>
                <div style={{ background: "#fff", borderRadius: 8, padding: 0, maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative", display: "flex", flexDirection: "column", borderTop: "4px solid #0aca00" }} onClick={e => e.stopPropagation()}>
                  <div style={{ position: "sticky", top: 0, background: "#fff", zIndex: 10, padding: "16px 24px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0, color: "#0aca00", fontSize: 20 }}>Feed Details</h3>
                    <button onClick={() => setSelectedFeed(null)} style={{ background: "none", border: "none", fontSize: 28, cursor: "pointer", color: "#555", lineHeight: 1 }}>&times;</button>
                  </div>
                  <div style={{ padding: 24 }}>
                    {selectedFeed.image && (
                      <div style={{ width: "100%", height: 300, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa", borderRadius: 8, marginBottom: 20 }}>
                        <div style={{ position: "absolute", top: -20, left: -20, right: -20, bottom: -20, backgroundImage: `url(${getImageUrl(selectedFeed.image)})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(15px)", opacity: 0.5, zIndex: 0 }} />
                        <img src={getImageUrl(selectedFeed.image)} alt="Feed" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", position: "relative", zIndex: 1 }} />
                      </div>
                    )}
                    {selectedFeed.images && selectedFeed.images.length > 0 && !selectedFeed.image && (
                      <div style={{ width: "100%", height: 300, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa", borderRadius: 8, marginBottom: 20 }}>
                        <div style={{ position: "absolute", top: -20, left: -20, right: -20, bottom: -20, backgroundImage: `url(${getImageUrl(selectedFeed.images[0])})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(15px)", opacity: 0.5, zIndex: 0 }} />
                        <img src={getImageUrl(selectedFeed.images[0])} alt="Feed" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", position: "relative", zIndex: 1 }} />
                      </div>
                    )}
                    <style>{`
                    .feed-modal-text::-webkit-scrollbar { width: 6px; }
                    .feed-modal-text::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
                    .feed-modal-text::-webkit-scrollbar-thumb { background: #0aca00; border-radius: 4px; }
                  `}</style>
                    <div className="feed-modal-text" style={{ maxHeight: "30vh", overflowY: "auto", paddingRight: 8, marginBottom: 20 }}>
                      <p style={{ margin: 0, color: "#333", fontSize: 16, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {selectedFeed.text}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid #eee", paddingTop: 16 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#0aca00", overflow: "hidden", flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: 14, letterSpacing: 0.5 }}>
                        <span>{selectedFeed.author?.name ? selectedFeed.author.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() : "U"}</span>
                        {selectedFeed.author?.photo && (
                          <img
                            src={getImageUrl(selectedFeed.author.photo)}
                            alt=""
                            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                      </div>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontWeight: 600, fontSize: 15, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {selectedFeed.author?.name || "JSSA User"}
                        </div>
                        <div style={{ fontSize: 13, color: "#777" }}>
                          {new Date(selectedFeed.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      )}

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
        <style>
          {`
      @media (max-width:768px){
        .accred-label{ font-size:12px; }
        .accred-logos{ flex-wrap: nowrap !important; }
        .accred-logo{ width:60px !important; }
      }
    `}
        </style>
      </div>
    </>
  );
}
/* ─── FEEDS PAGE ─── */
function FeedsPage() {
  const [feeds, setFeeds] = useState([]);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        setLoading(true);
        const res = await apiRequest(`/feeds/public/all?page=${page}&limit=12`, { method: "GET" });
        if (res.success && res.data) {
          if (page === 1) {
            setFeeds(res.data);
          } else {
            setFeeds(prev => [...prev, ...res.data]);
          }
          if (res.pagination) {
            setTotalPages(res.pagination.pages);
          }
        }
      } catch (err) {
        console.error("Failed to fetch feeds:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeeds();
  }, [page]);

  const BASE_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
    : "http://localhost:3005";
  const getImageUrl = (rawUrl) => {
    if (!rawUrl) return "";
    const url = rawUrl.replace(/\\/g, "/");
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return `${BASE_URL}${url}`;
    return `${BASE_URL}/${url}`;
  };

  return (
    <div style={{ background: "#f8f9fa", padding: "60px 40px", minHeight: "80vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 900, color: "#3F6212", marginBottom: 40, textTransform: "uppercase" }}>
          Latest Feeds & Updates
        </h2>

        {loading && page === 1 ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "40vh" }}>
            <style>{`@keyframes feedspin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div style={{ width: 50, height: 50, borderRadius: "50%", border: "4px solid #eee", borderTopColor: "#0aca00", animation: "feedspin 1s linear infinite" }} />
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 24
          }}>
            {feeds.map((feed, i) => (
              <div key={i} style={{
                background: "#fff",
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                height: "100%"
              }}>
                {feed.image && (
                  <div style={{ width: "100%", height: 240, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
                    <div style={{ position: "absolute", top: -20, left: -20, right: -20, bottom: -20, backgroundImage: `url(${getImageUrl(feed.image)})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(15px)", opacity: 0.5, zIndex: 0 }} />
                    <img src={getImageUrl(feed.image)} alt="Feed" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", position: "relative", zIndex: 1 }} />
                  </div>
                )}
                {feed.images && feed.images.length > 0 && !feed.image && (
                  <div style={{ width: "100%", height: 240, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
                    <div style={{ position: "absolute", top: -20, left: -20, right: -20, bottom: -20, backgroundImage: `url(${getImageUrl(feed.images[0])})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(15px)", opacity: 0.5, zIndex: 0 }} />
                    <img src={getImageUrl(feed.images[0])} alt="Feed" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", position: "relative", zIndex: 1 }} />
                  </div>
                )}

                <div style={{ padding: 20, display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                  <div>
                    <div style={{
                      margin: "0 0 8px 0",
                      color: "#333",
                      fontSize: 14,
                      lineHeight: 1.6,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      minHeight: "4.8em",
                      whiteSpace: "pre-wrap"
                    }}>
                      {feed.text}
                    </div>
                    {feed.text && feed.text.length > 80 && (
                      <div style={{ marginBottom: 16 }}>
                        <span onClick={() => setSelectedFeed(feed)} style={{ color: "#0aca00", fontWeight: "bold", cursor: "pointer", fontSize: 13 }}>
                          View More
                        </span>
                      </div>
                    )}
                    {(!feed.text || feed.text.length <= 80) && (
                      <div style={{ marginBottom: 16, height: 20 }}></div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid #eee", paddingTop: 16 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#0aca00", overflow: "hidden", flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: 13, letterSpacing: 0.5 }}>
                      <span>{feed.author?.name ? feed.author.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() : "U"}</span>
                      {feed.author?.photo && (
                        <img
                          src={getImageUrl(feed.author.photo)}
                          alt=""
                          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </div>
                    <div style={{ overflow: "hidden", flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {feed.author?.name || ""}
                      </div>
                      <div style={{ fontSize: 12, color: "#777" }}>
                        {new Date(feed.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#0aca00", fontSize: 13, fontWeight: "bold" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      <span>{feed.likes?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedFeed && (() => {
          return (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setSelectedFeed(null)}>
              <div style={{ background: "#fff", borderRadius: 8, padding: 0, maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative", display: "flex", flexDirection: "column", borderTop: "4px solid #0aca00" }} onClick={e => e.stopPropagation()}>
                <div style={{ position: "sticky", top: 0, background: "#fff", zIndex: 10, padding: "16px 24px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, color: "#0aca00", fontSize: 20 }}>Feed Details</h3>
                  <button onClick={() => setSelectedFeed(null)} style={{ background: "none", border: "none", fontSize: 28, cursor: "pointer", color: "#555", lineHeight: 1 }}>&times;</button>
                </div>
                <div style={{ padding: 24 }}>
                  {selectedFeed.image && (
                    <div style={{ width: "100%", height: 300, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa", borderRadius: 8, marginBottom: 20 }}>
                      <div style={{ position: "absolute", top: -20, left: -20, right: -20, bottom: -20, backgroundImage: `url(${getImageUrl(selectedFeed.image)})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(15px)", opacity: 0.5, zIndex: 0 }} />
                      <img src={getImageUrl(selectedFeed.image)} alt="Feed" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", position: "relative", zIndex: 1 }} />
                    </div>
                  )}
                  {selectedFeed.images && selectedFeed.images.length > 0 && !selectedFeed.image && (
                    <div style={{ width: "100%", height: 300, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa", borderRadius: 8, marginBottom: 20 }}>
                      <div style={{ position: "absolute", top: -20, left: -20, right: -20, bottom: -20, backgroundImage: `url(${getImageUrl(selectedFeed.images[0])})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(15px)", opacity: 0.5, zIndex: 0 }} />
                      <img src={getImageUrl(selectedFeed.images[0])} alt="Feed" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", position: "relative", zIndex: 1 }} />
                    </div>
                  )}
                  <style>{`
                    .feed-modal-text::-webkit-scrollbar { width: 6px; }
                    .feed-modal-text::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
                    .feed-modal-text::-webkit-scrollbar-thumb { background: #0aca00; border-radius: 4px; }
                  `}</style>
                  <div className="feed-modal-text" style={{ maxHeight: "30vh", overflowY: "auto", paddingRight: 8, marginBottom: 20 }}>
                    <p style={{ margin: 0, color: "#333", fontSize: 16, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {selectedFeed.text}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid #eee", paddingTop: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#0aca00", overflow: "hidden", flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: 14, letterSpacing: 0.5 }}>
                      <span>{selectedFeed.author?.name ? selectedFeed.author.name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() : "U"}</span>
                      {selectedFeed.author?.photo && (
                        <img
                          src={getImageUrl(selectedFeed.author.photo)}
                          alt=""
                          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {selectedFeed.author?.name || ""}
                      </div>
                      <div style={{ fontSize: 13, color: "#777" }}>
                        {new Date(selectedFeed.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {page < totalPages && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={loading}
              style={{
                background: "#4D7C0F",
                color: "#fff",
                border: "none",
                padding: "12px 32px",
                fontSize: 16,
                fontWeight: "bold",
                borderRadius: 30,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(77, 124, 15, 0.3)",
                opacity: loading ? 0.7 : 1,
                transition: "all 0.3s ease"
              }}
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════════════ */
import { useLandingConfig } from "../context/LandingConfigContext";
import DonationCard from "../components/DonationCard";
/* ═══════════════════════════════════════════════════════════
   NEW LANDING (reference design)
   Reuses the SAME API calls/components as the old HomePage.
   Old HomePage is preserved below (commented out).
   ═══════════════════════════════════════════════════════════ */
const NL_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
  : "http://localhost:3005";

const nlImg = (rawUrl) => {
  if (!rawUrl) return "";
  const url = rawUrl.replace(/\\/g, "/");
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${NL_BASE_URL}${url}`;
  return `${NL_BASE_URL}/${url}`;
};

// same date logic as the old HomePage (hides expired vacancies)
const nlParseDate = (v) => {
  if (!v) return null;
  const raw = String(v).trim();
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d;
  const m = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (m) {
    const p = new Date(+m[3], +m[2] - 1, +m[1]);
    if (p.getFullYear() === +m[3] && p.getMonth() === +m[2] - 1 && p.getDate() === +m[1]) return p;
  }
  const y = raw.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (y) {
    const p = new Date(+y[1], +y[2] - 1, +y[3]);
    if (p.getFullYear() === +y[1] && p.getMonth() === +y[2] - 1 && p.getDate() === +y[3]) return p;
  }
  return null;
};
const nlIsOpen = (item) => {
  if (!item?.lastDate) return true;
  const p = nlParseDate(item.lastDate);
  if (!p) return true;
  p.setHours(23, 59, 59, 999);
  return p >= new Date();
};

// Local login page (admin app, vite port 5174); override with VITE_LOGIN_URL.
const LOGIN_URL = import.meta.env.VITE_LOGIN_URL || "http://localhost:5174/";

const NAV_PAGE_TARGET = { about: "about", jobs: "jobs", notifications: "notifications", gallery: "gallery", feeds: "feed", news: "news" };

/* ─── New Header (home page only) ─── */
function NewHeader({ onNavigate, socialLinks, language, onLanguageChange, activePage }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState(NAV_PAGE_TARGET[activePage] || null);
  useEffect(() => {
    if (NAV_PAGE_TARGET[activePage]) setSelected(NAV_PAGE_TARGET[activePage]);
    else setSelected((prev) => (activePage === "home" && (prev === "top" || prev === "news") ? prev : null));
  }, [activePage]);
  const go = (page) => {
    setOpen(false);
    onNavigate(page);
  };
  const search = (event) => {
    event.preventDefault();
    const match = navLinks.find((item) => item.label.toLowerCase().includes(searchQuery.trim().toLowerCase()));
    if (match) go(match.page);
  };
  const goToHomeSection = (sectionId) => {
    setOpen(false);
    if (activePage !== "home") {
      onNavigate("home");
      window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" }), 100);
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <>
      <style>{`
        .nh-top{background:#1A2E05;color:#fff;font-size:11px;min-height:30px;padding:4px 40px;display:flex;justify-content:space-between;align-items:center;gap:12px;}
        .nh-top-l{display:flex;gap:20px;align-items:center;}
        .nh-gov{font-weight:700;}
        .nh-access{color:#e2e8f0;white-space:nowrap;display:flex;align-items:center;gap:4px;margin-left:auto;}
        .nh-lang{border:0;background:none;color:#3F6212;font-size:13px;padding:3px 5px;cursor:pointer;}
        .nh-lang.active{color:#fff;background:#4D7C0F;border-radius:3px;font-weight:800;}
        .nh-soc{display:flex;gap:6px;}
        .nh-soc a{width:24px;height:24px;border-radius:5px;display:flex;align-items:center;justify-content:center;}
        .nh-soc svg{width:13px;height:13px;}
        .nh-main{background:#fff;border-bottom:1px solid #e5e7eb;padding:8px 40px;display:flex;align-items:center;gap:12px;}
        .nh-brand{background:none;border:0;padding:0;cursor:pointer;flex-shrink:0;display:flex;align-items:center;}
        .nh-brand img{height:106px;width:auto;max-width:500px;object-fit:contain;display:block;}
        .nh-nav{display:flex;align-items:center;gap:6px;flex:1;justify-content:center;flex-wrap:wrap;}
        .nh-link,.nh-donate,.nh-login,.nh-lang,.nh-burger,.nh-brand,.nh-search input,.nh-search button{-webkit-tap-highlight-color:transparent;}
        .nh-link{background:none;border:0;padding:9px 10px;font-size:15px;font-weight:700;color:#1f2937;cursor:pointer;border-radius:6px;white-space:nowrap;}
        .nh-link:hover{background:#f1f5f9;}
        .nh-link:active{background:#e8f5e9;}
        .nh-link.on{background:#4D7C0F;color:#fff;}
        .nh-donate{background:#C9302C;color:#fff;border:0;border-radius:4px;padding:9px 12px;font-size:11px;font-weight:800;white-space:nowrap;cursor:pointer;}
        .nh-donate:active{background:#A52822;}
        .nh-search{display:flex;align-items:center;border:1px solid #cbd5e1;border-radius:4px;height:40px;flex:0 0 200px;}
        .nh-search input{width:100%;min-width:0;border:0;background:transparent;padding:9px 11px;font:inherit;font-size:15px;outline:none;}
        .nh-search button{height:100%;border:0;background:#3F6212;color:#fff;padding:0 10px;cursor:pointer;}
        .nh-login{background:#4D7C0F;color:#fff;font-weight:800;font-size:14px;padding:9px 18px;border-radius:6px;text-decoration:none;flex-shrink:0;}
        .nh-login:active{background:#3F6212;}
        .nh-burger{display:none;background:none;border:1px solid #cbd5e1;border-radius:6px;width:40px;height:40px;font-size:22px;cursor:pointer;flex-shrink:0;}
        .nh-drawer{display:none;}
        .nh-link:focus,.nh-link:focus-visible{outline:none !important;box-shadow:none !important;}
        .nh-donate:focus,.nh-donate:focus-visible,.nh-login:focus,.nh-login:focus-visible,.nh-lang:focus,.nh-lang:focus-visible,.nh-brand:focus,.nh-brand:focus-visible,.nh-burger:focus,.nh-burger:focus-visible,.nh-search input:focus,.nh-search button:focus{outline:none;box-shadow:0 0 0 3px rgba(77,124,15,.45);border-radius:6px;}
        @media(max-width:1600px) and (min-width:1181px){.nh-main{padding:8px 24px;gap:10px;}.nh-brand img{height:88px;max-width:370px;}.nh-nav{flex-wrap:nowrap;gap:4px;}.nh-link{padding:8px 7px;font-size:14.5px;}.nh-search{flex-basis:170px;}}
        @media(max-width:1180px) and (min-width:761px){
          .nh-main{padding:7px 16px;gap:6px;}
          .nh-top{padding:6px 20px;}
          .nh-brand img{height:62px;max-width:280px;}
          .nh-nav{display:flex;gap:2px;flex-wrap:nowrap;min-width:0;}
          .nh-link{font-size:11px;padding:6px 4px;white-space:normal;line-height:1.15;text-align:center;}
          .nh-search{flex-basis:140px;height:34px;}
          .nh-search input{padding:6px;font-size:12px;}
          .nh-search button{padding:0 7px;}
          .nh-login{padding:8px 10px;font-size:10px;}
          .nh-donate{font-size:9px;padding:7px 8px;}
          .nh-burger,.nh-drawer{display:none;}
        }
        @media(max-width:760px){
          .nh-main{padding:8px 20px;}
          .nh-nav{display:flex;flex-wrap:wrap;justify-content:center;}
          .nh-link{font-size:12px;padding:6px 5px;}
          .nh-search{margin-left:auto;}
          .nh-login{margin-left:auto;}
        }
        @media(max-width:600px){
          .nh-top{padding:5px 12px;font-size:10px;}
          .nh-hide-sm{display:none;}
          .nh-main{padding:8px 12px;gap:8px;flex-wrap:wrap;}
          .nh-brand img{height:58px;}
          .nh-search{order:4;flex:1 1 100%;}
          .nh-login{padding:8px 14px;font-size:12px;margin-left:auto;}
          .nh-drawer{padding:4px 12px 10px;}
        }
      `}</style>

      <div className="nh-top">
        <div className="nh-top-l"></div>
        <div className="nh-soc">
          {socialLinks.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ background: s.bg }}>
              {s.content}
            </a>
          ))}
        </div>
      </div>

      <header className="nh-main">
        <button type="button" className="nh-brand" onClick={() => go("home")} aria-label="Home">
          <img src={logo} alt="Jan Swasthya Sahayata Abhiyan" />
        </button>
        <nav className="nh-nav">
          {homeNavLinks.map((item) => (
            <button key={item.target} className={`nh-link ${selected === item.target ? "on" : ""}`} onClick={() => {
              setOpen(false);
              setSelected(item.target);
              if (item.target === "top") go("home");
              else if (item.target === "about") go("about");
              else if (item.target === "jobs") go("jobs");
              else if (item.target === "notifications") go("notifications");
              else if (item.target === "gallery") go("gallery");
              else if (item.target === "feed") go("feeds");
              else if (item.target === "news") go("news");
            }}>
              {language === "hi" ? item.hi : item.en}
            </button>
          ))}
        </nav>
        <button className="nh-donate" onClick={() => go("donate")}>
          {language === "hi" ? "अभी दान करें" : "Donate Now"}
        </button>
        <div className="nh-access" aria-label="Language">
          <button className={`nh-lang ${language === "hi" ? "active" : ""}`} onClick={() => onLanguageChange("hi")}>हिंदी</button>
          <span>|</span>
          <button className={`nh-lang ${language === "en" ? "active" : ""}`} onClick={() => onLanguageChange("en")}>English</button>
        </div>
        <form className="nh-search" onSubmit={search} role="search">
          <input aria-label="Search pages" placeholder="Search here..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
          <button type="submit" aria-label="Search">⌕</button>
        </form>
        <a href={LOGIN_URL} className="nh-login">LOGIN</a>
        <button className="nh-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? "✕" : "☰"}
        </button>
      </header>

      {open && (
        <div className="nh-drawer">
          {homeNavLinks.map((item) => (
            <button key={item.target} className={`nh-link ${selected === item.target ? "on" : ""}`} onClick={() => {
              setOpen(false);
              setSelected(item.target);
              if (item.target === "top") go("home");
              else if (item.target === "about") go("about");
              else if (item.target === "jobs") go("jobs");
              else if (item.target === "notifications") go("notifications");
              else if (item.target === "gallery") go("gallery");
              else if (item.target === "feed") go("feeds");
              else go("news");
            }}>
              {language === "hi" ? item.hi : item.en}
            </button>
          ))}
          <button className="nh-donate" onClick={() => go("donate")}>
            {language === "hi" ? "दान करें" : "Donate Now "}
          </button>
        </div>
      )}
    </>
  );
}

function LandingFooter({ landingConfig, socialLinks, language, onNavigate, activePage }) {
  const labels = language === "hi"
    ? { quick: "त्वरित लिंक", important: "महत्वपूर्ण लिंक", contact: "संपर्क करें", newsletter: "ईमेल अपडेट", newsletterCopy: "अपडेट पाने के लिए ईमेल से संपर्क करें।", send: "भेजें", rights: "सर्वाधिकार सुरक्षित", donate: "अभी दान करें", home: "होम", about: "हमारे बारे में", jobs: "नौकरी एवं करियर", notifications: "सूचनाएं", gallery: "गैलरी", feed: "फीड", news: "समाचार" }
    : { quick: "Quick Links", important: "Important Links", contact: "Contact Us", newsletter: "Newsletter", newsletterCopy: "Contact us by email to receive updates.", send: "Subscribe", rights: "All rights reserved", donate: "Donate Now", home: "Home", about: "About", jobs: "Jobs & Career", notifications: "Notifications", gallery: "Gallery", feed: "Feed", news: "News & Updates" };

  const goToSection = (sectionId) => {
    if (activePage !== "home") {
      onNavigate("home");
      window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" }), 100);
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  const footerLinks = [
    { label: labels.home, page: "home" },
    { label: labels.about, page: "about" },
    { label: labels.jobs, page: "jobs" },
    { label: labels.notifications, page: "notifications" },
    { label: labels.gallery, page: "gallery" },
    { label: labels.feed, page: "feeds" },
    { label: labels.news, page: "news" },
  ];

  return (
    <>
      <style>{`
        .nl-home-footer{background:#1A2E05;color:#cbd9bd;padding:40px 0 0;margin-top:18px;border-top:3px solid #4D7C0F;}
        .nl-home-footer .nl-wrap{width:92%;max-width:1400px;margin:0 auto;padding:0;}
        .nl-footer-grid{display:grid;grid-template-columns:1.35fr .9fr .9fr 1.15fr 1.25fr;gap:28px;padding-bottom:28px;}
        .nl-home-footer h3{font-size:13px;color:#fff;margin:0 0 16px;letter-spacing:.08em;text-transform:uppercase;position:relative;padding-bottom:10px;}
        .nl-home-footer h3::after{content:"";position:absolute;left:0;bottom:0;width:26px;height:2px;background:#65A30D;border-radius:2px;}
        .nl-home-footer p,.nl-home-footer button,.nl-home-footer a{font-size:12px;line-height:1.8;color:#cbd9bd;}
        .nl-home-footer button{display:block;border:0;background:none;padding:4px 0;text-align:left;cursor:pointer;transition:color .15s ease,transform .15s ease;}
        .nl-home-footer a{text-decoration:none;display:block;transition:color .15s ease,transform .15s ease;}
        .nl-footer-grid>div>button:hover,.nl-footer-grid>div>a:hover{color:#D9F99D;transform:translateX(3px);}
        .nl-home-footer .nl-footer-social{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:6px;}
        .nl-home-footer .nl-footer-social a{width:38px;height:38px;flex:0 0 38px;border-radius:50%;display:flex;align-items:center;justify-content:center;line-height:1;box-shadow:0 2px 6px rgba(0,0,0,.25);transition:transform .2s ease,box-shadow .2s ease;}
        .nl-home-footer .nl-footer-social a:hover{transform:translateY(-3px) scale(1.06);box-shadow:0 6px 14px rgba(0,0,0,.3);}
        .nl-home-footer .nl-footer-social svg{display:block;width:18px;height:18px;flex:0 0 18px;}
        .nl-home-footer input{width:100%;min-width:0;border:1px solid rgba(255,255,255,.22);border-radius:6px;background:rgba(255,255,255,.08);color:#fff;padding:9px 10px;font:inherit;font-size:12px;transition:border-color .15s ease,background .15s ease;}
        .nl-home-footer input::placeholder{color:#9fb28a;}
        .nl-home-footer input:focus{outline:none;border-color:#65A30D;background:rgba(255,255,255,.12);}
        .nl-newsletter-form{display:flex;gap:6px;margin:10px 0;}
        .nl-newsletter-form button{background:#4D7C0F;color:#fff;border-radius:6px;padding:9px 14px;white-space:nowrap;font-weight:700;transition:background .15s ease;}
        .nl-newsletter-form button:hover{background:#65A30D;color:#fff;transform:none;}
        .nl-footer-brand{display:flex;align-items:flex-start;gap:12px;}
        .nl-footer-brand img{width:56px;height:56px;object-fit:contain;background:#fff;border-radius:50%;padding:4px;box-shadow:0 2px 8px rgba(0,0,0,.25);flex-shrink:0;}
        .nl-footer-copy{border-top:1px solid rgba(255,255,255,.14);margin-top:8px;padding:16px 0;font-size:11px;color:#9fb28a;display:flex;justify-content:space-between;gap:12px;}
        .nl-footer-copy button{display:inline;color:#9fb28a;transition:color .15s ease;}
        .nl-footer-copy button:hover{color:#D9F99D;transform:none;}
        @media(max-width:1024px){.nl-footer-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
        @media(max-width:600px){.nl-footer-grid{grid-template-columns:1fr 1fr;gap:24px 16px}.nl-footer-grid>div:first-child,.nl-footer-grid>div:last-child{grid-column:1/-1}.nl-footer-copy{flex-direction:column;text-align:center}}
      `}</style>
    <footer className="nl-home-footer">
      <div className="nl-wrap">
        <div className="nl-footer-grid">
          <div className="nl-footer-brand">
            <img src={logo1} alt="JSS Abhiyan logo" />
            <div>
              <h3 style={{ marginBottom: 6 }}>{language === "hi" ? "जन आरोग्य सहायता अभियान" : "Jan Aarogya Sahayata Abhiyan"}</h3>
              <p>
                {language === "hi"
                  ? "हेल्थकेयर रिसर्च एंड डेवलपमेंट बोर्ड (HRDB) की एक परियोजना। HRDB सामाजिक कल्याण संगठन का एक प्रभाग है।"
                  : "A project of Healthcare Research & Development Board (HRDB), a division of the social welfare organisation."}
              </p>
            </div>
          </div>
          <div>
            <h3>{labels.quick}</h3>
            {footerLinks.map((item) => <button key={item.label} onClick={() => item.section ? goToSection(item.section) : onNavigate(item.page)}>{item.label}</button>)}
            <button onClick={() => onNavigate("donate")}>{labels.donate}</button>
          </div>
          <div>
            <h3>{labels.important}</h3>
            <button onClick={() => onNavigate("privacy")}>Privacy Policy</button>
            <button onClick={() => onNavigate("terms")}>Terms &amp; Conditions</button>
            <button onClick={() => onNavigate("refund")}>Refund &amp; Cancellation</button>
            <button onClick={() => onNavigate("contacts")}>{labels.contact}</button>
          </div>
          <div>
            <h3>{labels.contact}</h3>
            {(landingConfig?.contactUs?.phones || ["9471987611"]).slice(0, 2).map((phone) => <a key={phone} href={`tel:${phone}`}>☎ {phone}</a>)}
            {(landingConfig?.contactUs?.emails || ["support@jssabhiyan.com"]).slice(0, 2).map((email) => <a key={email} href={`mailto:${email}`}>✉ {email}</a>)}
            <div className="nh-soc nl-footer-social" style={{ marginTop: 10 }}>
              {socialLinks.map((social) => <a key={social.label} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label} title={social.label} style={{ background: social.bg }}>{social.content}</a>)}
            </div>
          </div>
          <div>
            <h3>{labels.newsletter}</h3>
            <p>{labels.newsletterCopy}</p>
            <form className="nl-newsletter-form" onSubmit={(event) => {
              event.preventDefault();
              const email = new FormData(event.currentTarget).get("newsletterEmail");
              const recipient = landingConfig?.contactUs?.emails?.[0] || "support@jssabhiyan.com";
              window.location.href = `mailto:${recipient}?subject=Newsletter%20subscription&body=${encodeURIComponent(String(email || ""))}`;
            }}>
              <input type="email" name="newsletterEmail" required aria-label="Email address" placeholder="Email address" />
              <button type="submit">{labels.send}</button>
            </form>
          </div>
        </div>
        <div className="nl-footer-copy">
          <span>© {new Date().getFullYear()} {language === "hi" ? "जन आरोग्य सहायता अभियान" : "Jan Aarogya Sahayata Abhiyan"}. {labels.rights}.</span>
          <span>
            <button type="button" style={{ display: "inline", padding: 0 }} onClick={() => onNavigate("privacy")}>Privacy Policy</button>
            {" · "}
            <button type="button" style={{ display: "inline", padding: 0 }} onClick={() => onNavigate("terms")}>Terms &amp; Conditions</button>
          </span>
        </div>
      </div>
    </footer>
    </>
  );
}



/* ─── Auto-scrolling list for Jobs & Notifications ───
   Scrolls upward once, stops when the last item is reached (no loop).
   Pauses while hovered/focused; users can still scroll manually. */
function NlTicker({ items, renderItem, extraClass = "" }) {
  const boxRef = useRef(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return undefined;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    box.scrollTop = 0;
    let frame;
    let last = performance.now();
    let pos = 0;
    let started = false;
    const SPEED = 22; // pixels per second
    const startDelay = window.setTimeout(() => { started = true; }, 1200);
    const step = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      const max = box.scrollHeight - box.clientHeight;
      if (max <= 0) return; // nothing to scroll
      if (started && !pausedRef.current) {
        pos = Math.min(max, Math.max(pos, box.scrollTop) + SPEED * dt);
        box.scrollTop = pos;
      } else {
        pos = box.scrollTop;
      }
      if (box.scrollTop >= max - 1) return; // reached the end: stop
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => {
      window.clearTimeout(startDelay);
      cancelAnimationFrame(frame);
    };
  }, [items.length]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  return (
    <div
      ref={boxRef}
      className={`nl-notification-list ${extraClass}`}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      onTouchStart={pause}
    >
      {items.map((item, i) => renderItem(item, i, false))}
    </div>
  );
}

/* ─── Fills for empty spaces on the home page (same palette & font as the rest) ─── */
const NL_FILL_CSS = `
.nl-home-content>.nl-feed-side{grid-column:2/4;grid-row:4;margin:16px 0;min-width:0;display:flex;flex-direction:column;}
.nl-home-content{grid-template-columns:minmax(0,1fr) minmax(0,.7fr) minmax(270px,1fr)!important;}
.nl-home-content>.nl-achievements{grid-column:1!important;grid-row:4;margin:16px 0;display:flex;flex-direction:column;}
.nl-feed-side .nl-feed-list{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(3,1fr) auto;column-gap:20px;}
.nl-feed-side .nl-feed-item{align-content:center;}
.nl-feed-side .nl-feed-item{border-bottom:1px solid #eef2f7!important;}
.nl-feed-side .nl-feed-more{grid-column:1/-1;margin:14px 0;}
.nl-achievements .nl-achievement-carousel{flex:1;display:flex;align-items:center;}
.nl-achievements .nl-achievement-window{flex:1;}
.nl-achievements .nl-achievement-dots{display:flex;justify-content:center;align-items:center;gap:8px;margin:6px 0 0;padding:4px 0 18px;}
.nl-achievements .nl-achievement-dot{width:9px;height:9px;border-radius:999px;background:#cbd5e1;transition:width .2s,background .2s;}
.nl-achievements .nl-achievement-dot:hover{background:#94a3b8;}
.nl-achievements .nl-achievement-dot.active{width:24px;background:#4D7C0F;}
.nl-achievements .nl-achievement-meta h3{font-size:15px;}
.nl-achievements .nl-achievement-meta p{font-size:12px;}
@media(max-width:900px){.nl-feed-side .nl-feed-list{grid-template-columns:1fr;grid-template-rows:none;}}
.nl-feed-side .nl-feed-list{flex:1;display:flex;flex-direction:column;}
.nl-feed-side .nl-feed-item{grid-template-columns:92px minmax(0,1fr);padding:12px 0;}
.nl-feed-side .nl-feed-item img,.nl-feed-side .nl-feed-avatar{width:92px;height:76px;}
.nl-feed-more{margin:auto 0 14px;padding:10px 12px;border:1px dashed #D9F99D;border-radius:6px;background:#F7FEE7;color:#4D7C0F;font-weight:700;font-size:13px;cursor:pointer;text-align:center;}
.nl-feed-more:hover{background:#F7FEE7;}
.nl-home-grid>.nl-donation{margin:0!important;}
@media(max-width:760px){.nl-home-content>.nl-feed-side{order:5;}.nl-home-content>.nl-achievements{order:4!important;}}
.nl-pn-body{padding:14px 18px 6px;}
.nl-pn-title{display:inline-block;margin:0 0 12px;padding:6px 14px;border-radius:6px;background:#fff7e6;border:1px solid #fcd9a0;color:#9a4b00;font-weight:800;font-size:15px;}
.nl-pn-list{list-style:none;margin:0 0 8px;padding:0;display:grid;gap:10px;}
.nl-pn-list li{position:relative;padding:10px 14px 10px 40px;background:#F7FEE7;border:1px solid #e1ecf8;border-left:4px solid #4D7C0F;border-radius:6px;}
.nl-pn-list li::before{content:"!";position:absolute;left:12px;top:11px;width:18px;height:18px;border-radius:50%;background:#4D7C0F;color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;}
.nl-pn-list p{margin:0;font-size:14px;line-height:1.55;color:#1f2937;}
.nl-pn-list p[lang="hi"]{margin-top:4px;color:#475569;}
/* public notice between gallery/donation row and certificates/feed row */
.nl-home-content>.nl-public-notice{grid-column:1/-1!important;grid-row:4!important;margin:0!important;}
.nl-home-content>.nl-achievements{grid-row:5!important;}
.nl-home-content>.nl-feed-side{grid-row:5!important;}
@media(max-width:760px){.nl-home-content>.nl-public-notice{order:4!important;margin:0!important;}.nl-home-content>.nl-achievements{order:5!important;}.nl-home-content>.nl-feed-side{order:6!important;}}
.nl-pn-list .nl-pn-title{display:inline-block;margin:0 0 8px;padding:4px 12px;font-size:14px;line-height:1.4;color:#9a4b00;}
.nl-pn-list p.nl-pn-text{white-space:pre-line;}
.nl-pn-list p.nl-pn-text+p.nl-pn-text{margin-top:4px;color:#475569;}
.nl-pn-list li:has(.nl-pn-title)::before{top:15px;}
.nl-pn-loading{display:grid;gap:10px;padding-bottom:8px;}
.nl-pn-loading span{display:block;height:54px;border-radius:6px;background:linear-gradient(90deg,#eef3fa 0%,#f7faff 50%,#eef3fa 100%);background-size:200% 100%;animation:nlPnShimmer 1.2s linear infinite;}
@keyframes nlPnShimmer{from{background-position:200% 0}to{background-position:-200% 0}}
@media(max-width:600px){.nl-pn-body{padding:12px;}.nl-pn-list li{padding:10px 12px 10px 36px;}.nl-pn-list p{font-size:13px;}}
.nl-home-grid #gallery{display:flex;flex-direction:column;}
.nl-home-grid #gallery .nl-gallery-grid{flex:1;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(2,minmax(90px,1fr));}
.nl-home-grid #gallery .nl-gallery-item{aspect-ratio:auto;}
.nl-home-grid #gallery .nl-gallery-item:first-child{grid-column:span 2;grid-row:span 2;}
.nl-partners{display:flex;flex-direction:column;}
.nl-partners .nl-partner-grid{flex:1;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:1fr;gap:10px;padding:12px;}
.nl-partners .nl-partner-card{height:auto;min-height:70px;padding:10px;background:#fff;}
.nl-partners .nl-partner-card img{max-height:58px;}
.nl-help{background:#F7FEE7;border-top:1px solid #D9F99D;padding:22px 0;margin-top:16px;}
.nl-help-in{display:grid;grid-template-columns:minmax(0,1.4fr) repeat(2,minmax(0,1fr)) auto;gap:14px;align-items:center;}
.nl-help-intro h2{font-size:20px;font-weight:800;color:#3F6212;margin:0 0 4px;}
.nl-help-intro p{font-size:13px;color:#475569;margin:0;line-height:1.5;}
.nl-help-item{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #D9F99D;border-radius:8px;padding:12px 14px;text-decoration:none;color:inherit;box-shadow:0 2px 8px rgba(0,0,0,.04);transition:border-color .15s,transform .15s;min-width:0;}
.nl-help-item:hover{border-color:#4D7C0F;transform:translateY(-1px);}
.nl-help-ic{width:38px;height:38px;border-radius:8px;background:#4D7C0F;color:#fff;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
.nl-help-item small{display:block;font-size:11px;color:#64748b;font-weight:600;}
.nl-help-item strong{display:block;font-size:14px;color:#3F6212;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.nl-help-cta{white-space:nowrap;background:#C9302C;}
.nl-help-cta:hover{background:#A52822;}
@media(max-width:1024px){
  .nl-home-grid #gallery .nl-gallery-grid{grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:none;grid-auto-rows:110px;}
  .nl-help-in{grid-template-columns:repeat(2,minmax(0,1fr));}
  .nl-help-intro{grid-column:1/-1;}
}
@media(max-width:760px){
  .nl-stats>.nl-stat:last-child:nth-child(odd){grid-column:1/-1;justify-content:center;}
}
@media(max-width:600px){
  .nl-home-grid #gallery .nl-gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:120px;}
  .nl-help-in{grid-template-columns:1fr;}
  .nl-help-cta{width:100%;}
}
`;

/* ─── Feed details popup (same info as the old inline modal) ─── */
function NlFeedModal({ feed, onClose }) {
  if (!feed) return null;
  const img = feed.image || (feed.images && feed.images[0]);
  return (
    <div className="nl-modal-bg" onClick={onClose}>
      <div className="nl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="nl-modal-head">
          <h3>Feed Details</h3>
          <button onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="nl-modal-body">
          {img && <img src={nlImg(img)} alt="Feed" className="nl-modal-img" />}
          <p className="nl-modal-text">{feed.text}</p>
          <div className="nl-modal-author">
            <strong>{feed.author?.name || ""}</strong>
            <span>
              {new Date(feed.createdAt).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── New Home Page ─── */
function LandingStatValue({ value, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const shownRef = useRef(0);      // number currently on screen
  const seenRef = useRef(false);   // first count-up already happened?

  useEffect(() => {
    if (typeof value !== "number" || !Number.isFinite(value)) return;

    let frameId;
    let observer;
    const animateTo = (from, to, duration) => {
      const startTime = performance.now();
      const tick = (now) => {
        const progress = Math.min(Math.max((now - startTime) / duration, 0), 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const next = Math.floor(from + (to - from) * eased);
        shownRef.current = next;
        setCount(next);
        if (progress < 1) frameId = requestAnimationFrame(tick);
        else { shownRef.current = to; setCount(to); }
      };
      frameId = requestAnimationFrame(tick);
    };

    if (seenRef.current) {
      // Later updates: count up from the current number (never jump back to 0)
      animateTo(shownRef.current, value, 900);
    } else {
      observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        seenRef.current = true;
        animateTo(0, value, 1400);
      }, { threshold: 0.35 });
      if (ref.current) observer.observe(ref.current);
    }

    return () => {
      observer?.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [value]);

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return <span ref={ref}>{value ?? "—"}{suffix}</span>;
  }

  return <span ref={ref}>{count.toLocaleString("en-IN")}{suffix}</span>;
}

/* ─── Growing home-page counters ───
   Each number = base + (days since STAT_START) × perDay, worked out with Math in the browser.
   Same value for every visitor, keeps growing over time and never resets on refresh.
   Change base / perDay here to tune the numbers. */
const STAT_START = Date.UTC(2026, 9, 1); // 1 Oct 2026
const STAT_GROWTH = {
  registeredUsers: { base: 5000, perDay: 240 },
  servicesSelected: { base: 50, perDay: 2 },
  openOpportunities: { base: 30, perDay: 1 },
  donors: { base: 500, perDay: 6 },
};
const growingStat = (key, now) => {
  const { base, perDay } = STAT_GROWTH[key];
  const days = Math.max(0, now - STAT_START) / 86400000;
  return base + Math.floor(days * perDay);
};

/* Shared EN/HI labels for the home page and the donate page */
function getHomeText(language) {
  return language === "hi" ? {
    home: "होम", about: "हमारे बारे में", aboutCopy: "जन स्वास्थ्य सहायता अभियान जरूरतमंद समुदायों तक स्वास्थ्य और सामाजिक सहायता पहुंचाने के लिए कार्य करता है।",
    jobs: "नौकरी एवं करियर", notifications: "सूचनाएं", latest: "नवीनतम", viewAll: "सभी देखें", viewJobs: "सभी नौकरियां देखें", details: "नौकरी विवरण देखें",
    donateTitle: "आज किसी मरीज की मदद करें", donateCopy: "आपका योगदान जरूरतमंद मरीजों को आवश्यक सहायता प्रदान करने में मदद कर सकता है।", donatePatient: "अभी दान करें",
    donateNow: "अभी दान करें", custom: "अन्य राशि", uploadTitle: "दान प्रमाणपत्र अपलोड करें", chooseFile: "फ़ाइल चुनें", uploadFile: "प्रमाणपत्र अपलोड करें", amount: "दान राशि", name: "दाता का नाम", mobile: "मोबाइल नंबर", email: "ईमेल", purpose: "मरीज / दान का उद्देश्य", message: "वैकल्पिक संदेश", proceed: "भुगतान के लिए आगे बढ़ें", unavailable: "इस वेबसाइट पर दान भुगतान उपलब्ध नहीं है। कृपया सहायता के लिए संपर्क करें।", uploadUnavailable: "सर्वर पर प्रमाणपत्र अपलोड सुविधा उपलब्ध नहीं है। फ़ाइल केवल इस पृष्ठ पर चुनी गई है।",
    gallery: "गैलरी", feed: "फीड", news: "समाचार एवं अपडेट", noRecentNews: "अभी कोई नई खबर उपलब्ध नहीं है।", impact: "हमारा प्रभाव", patients: "रोजगार अवसर", volunteers: "फीड पोस्ट", donations: "सूचनाएं", communities: "गैलरी चित्र", volunteer: "हमारी टीम से जुड़ें", join: "अभी आवेदन करें", support: "खुले पद देखें और हमारे साथ काम करने के लिए आवेदन करें।", exploreJobs: "नौकरियां देखें", noJobs: "अभी कोई खुली नौकरी उपलब्ध नहीं है।", noNotices: "अभी कोई नई सूचना उपलब्ध नहीं है।", selectedFile: "चयनित फ़ाइल", noFile: "कोई फ़ाइल नहीं चुनी गई", certificates: "डिजिटल प्रमाणपत्र", quickLinks: "त्वरित लिंक", importantLinks: "महत्वपूर्ण लिंक", contact: "संपर्क करें", allRights: "सर्वाधिकार सुरक्षित", makeDonation: "दान करें", donationCardCopy: "सामाजिक कल्याण पहलों का समर्थन करें और बेहतर समुदाय बनाने में योगदान दें।", learnMore: "और जानें", testimonials: "लोगों की राय", partners: "हमारे सहयोगी", updates: "सामुदायिक अपडेट", noUpdates: "अभी कोई अपडेट उपलब्ध नहीं है।", viewLess: "कम देखें", readMore: "और पढ़ें", registeredUsers: "पंजीकृत उपयोगकर्ता", servicesSelected: "चुनी गई सेवाएं", serviceSatisfaction: "सेवा संतुष्टि", support247: "24/7 सहायता", openOpportunities: "खुले अवसर", donationsLabel: "दानदाता",
  } : {
    home: "Home", about: "About", aboutCopy: "Jan Swasthya Sahayata Abhiyan works to bring health and social support to communities in need.",
    jobs: "Jobs & Career", notifications: "Notifications", latest: "LATEST", viewAll: "View All", viewJobs: "View All Jobs", details: "View Job Details",
    donateTitle: "Help a Patient Today", donateCopy: "Your contribution can help provide essential support to patients in need.", donatePatient: "Donate Now",
    donateNow: "Donate Now", custom: "Custom Amount", uploadTitle: "Upload Donation Certificate", chooseFile: "Choose File", uploadFile: "Upload Certificate", amount: "Donation Amount", name: "Donor Name", mobile: "Mobile Number", email: "Email", purpose: "Patient / Donation Purpose", message: "Optional Message", proceed: "Proceed to Payment", unavailable: "Donation payments are not configured on this website. Please contact us for assistance.", uploadUnavailable: "Certificate upload is not available on the server. The file has only been selected on this page.",
    gallery: "Gallery", feed: "Feed", news: "News & Updates", noRecentNews: "No recent news available.", impact: "Our Impact", patients: "Open Opportunities", volunteers: "Feed Posts", donations: "Notifications", communities: "Gallery Images", volunteer: "Join Our Team", join: "Apply Now", support: "Explore open positions and apply to work with us.", exploreJobs: "Explore Jobs", noJobs: "No open vacancies at this time.", noNotices: "No recent notifications available.", selectedFile: "Selected file", noFile: "No file selected", certificates: "Digital Certificates", quickLinks: "Quick Links", importantLinks: "Important Links", contact: "Contact Us", allRights: "All rights reserved", makeDonation: "Make a Donation", donationCardCopy: "Support social welfare initiatives and contribute to a better community.", learnMore: "Learn More", testimonials: "What People Say", partners: "Our Partners", updates: "Community Updates", noUpdates: "No recent community updates available.", viewLess: "View Less", readMore: "Read More", registeredUsers: "Registered Users", servicesSelected: "Services Selected", serviceSatisfaction: "Service Satisfaction", support247: "24/7 Support", openOpportunities: "Open Opportunities", donationsLabel: "Donations",
  };
}

function NewHomePage({ onNavigate, landingConfig, socialLinks, language }) {
  const [slide, setSlide] = useState(0);
  const [slides, setSlides] = useState(fallbackSlides);
  const [scrollerImages, setScrollerImages] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeCamps, setActiveCamps] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [loadingFeeds, setLoadingFeeds] = useState(true);
  const [achievementIndex, setAchievementIndex] = useState(0);
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  const text = getHomeText(language);

  const achievements = [
    { image: cert1, title: "Certificate of Completion", issuer: "UNICEF", date: "March 11, 2021", description: "Emergency Preparedness and Response" },
    { image: cert4, title: "Certificate of Dedication", issuer: "All India Institute of Public & Physical Health Sciences", date: "March 4, 2021", description: "COVID-19 awareness and prevention" },
    { image: cert5, title: "Record of Achievement", issuer: "World Health Organization", date: "March 5, 2021", description: "COVID-19 operational planning and partners platform" },
    { image: cert6, title: "Swachh Bharat Pledge Certificate", issuer: "MyGov, Government of India", date: "August 8, 2021", description: "Swachh Bharat Pledge" },
    { image: cert7, title: "Training Certificate", issuer: "World Health Organization, Regional Office for Europe", date: "March 5, 2021", description: "Migration and Health: Enhancing Intercultural Competence and Diversity Sensitivity" },
    { image: cert8, title: "Confirmation of Participation", issuer: "World Health Organization", date: "March 5, 2021", description: "Guidance on mask use in the context of COVID-19" },
    { image: cert9, title: "Wear a Mask Certificate", issuer: "MyGov and NITI Aayog", date: "August 8, 2021", description: "Wear a Mask Pledge" },
    { image: cert10, title: "Certificate of Participation", issuer: "National Institute of Rural Development and Panchayati Raj", date: "March 6, 2021", description: "Gram Panchayat Development Plan training" },
  ];

  const staticTestimonials = language === "hi" ? [
    { name: "समुदाय सदस्य", location: "पटना, बिहार", quote: "टीम ने हमारी स्वास्थ्य संबंधी जानकारी और सहायता पाने में मार्गदर्शन किया।" },
    { name: "स्वयंसेवक", location: "गया, बिहार", quote: "समुदाय के साथ काम करने और जरूरतमंद लोगों की मदद करने का अच्छा अनुभव रहा।" },
    { name: "कार्यक्रम प्रतिभागी", location: "नालंदा, बिहार", quote: "कार्यक्रम की जानकारी सरल थी और सहायता टीम ने अच्छे से सहयोग किया।" },
  ] : [
    { name: "Community Member", location: "Patna, Bihar", quote: "The team guided us on finding health information and accessing support." },
    { name: "Volunteer", location: "Gaya, Bihar", quote: "It has been a meaningful experience working with the community and supporting people in need." },
    { name: "Program Participant", location: "Nalanda, Bihar", quote: "The program information was clear, and the support team was helpful." },
  ];

  const vText = (v) => (v && typeof v === "object" ? v.english : v) || "";
  const vLink = (v) => (v && typeof v === "object" ? v.link || "#" : "#");

  // ── same API calls as the old HomePage ──
  useEffect(() => {
    (async () => {
      try {
        setLoadingFeeds(true);
        const res = await apiRequest("/feeds/public/all?limit=10", { method: "GET" });
        if (res.success && res.data) setFeeds(res.data);
      } catch (err) {
        console.error("Failed to fetch feeds:", err);
      } finally {
        setLoadingFeeds(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await galleryAPI.getAll("true");
        const images = res.success && res.data ? res.data.images || [] : [];
        setGalleryImages(images.filter((image) => image.imageUrl && image.isActive !== false));
      } catch (err) {
        console.error("Failed to fetch gallery images:", err);
      } finally {
        setLoadingGallery(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest("/camps/public/active", { method: "GET" });
        if (res.success && res.data) setActiveCamps(res.data);
      } catch (err) {
        console.error("Failed to fetch active camps:", err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await scrollerAPI.getAll(null);
        if (res?.success && res.data) {
          const valid = (res.data.scrollerImages || []).filter((img) => img.imageUrl && img.imageUrl.trim() !== "");
          if (valid.length > 0) {
            const sorted = valid.sort((a, b) => {
              if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
              return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });
            setSlides(sorted.map((i) => nlImg(i.imageUrl)));
            setScrollerImages(sorted);
            setSlide(0);
          }
        }
      } catch {
        /* keep fallback slides */
      }
    })();
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await jobPostingsAPI.getLatestVacancies();
        const list = r.success && r.data?.vacancies ? r.data.vacancies : [];
        setVacancies(list.filter(nlIsOpen));
      } catch {
        setVacancies([]);
      }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await notificationsAPI.getAll();
        const list = r.success && r.data ? r.data.notifications || [] : [];
        setNotifications(dedupeNotifications(list));
      } catch {
        setNotifications([]);
      }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  // Counters grow with time (see STAT_GROWTH). Re-check every 30s so the numbers tick up while the page is open.
  const [statNow, setStatNow] = useState(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setStatNow(Date.now()), 30000);
    return () => clearInterval(iv);
  }, []);
  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const r = await apiRequest("/dashboard/public-counts", { method: "GET" });
  //       if (r?.success && typeof r.data?.registeredUsers === "number") setRegisteredUsers(r.data.registeredUsers);
  //     } catch {
  //       /* keep placeholder */
  //     }
  //   })();
  // }, []);
  const registeredUsers = growingStat("registeredUsers", statNow);
  const servicesSelected = growingStat("servicesSelected", statNow);
  const openOpportunities = growingStat("openOpportunities", statNow);
  const donorCount = growingStat("donors", statNow);
  const stats = [
    { icon: <Users size={30} color="#4D7C0F" />, value: registeredUsers, suffix: "+", label: text.registeredUsers },
    { icon: <Star size={30} color="#4D7C0F" />, value: servicesSelected, suffix: "+", label: text.servicesSelected },
    { icon: <Headphones size={30} color="#4D7C0F" />, value: "24/7", suffix: "", label: text.support247 },
    { icon: <Briefcase size={30} color="#4D7C0F" />, value: openOpportunities, suffix: "+", label: text.openOpportunities },
    { icon: <Heart size={30} color="#C9302C" />, value: donorCount, suffix: "+ Donors", label: text.donationsLabel },
  ];

  return (
    <>
      <div className="nl-page">
      <style>{`
        .nl-page{background:#f3f6fb;}
        .nl-wrap{width:92%;max-width:1400px;margin:0 auto;padding:0;}
        .nl-home-content{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(270px,1fr);gap:12px;align-items:stretch;}
        .nl-home-content>.nl-stats,.nl-home-content>.nl-two,.nl-home-content>.nl-home-grid,.nl-home-content>#news,.nl-home-content>.nl-volunteer,.nl-home-content>.nl-actions{grid-column:1/-1;}
        .nl-home-content>.nl-stats{grid-row:1;}
        .nl-home-content>.nl-two{grid-row:2;}
        .nl-home-content>.nl-home-grid{grid-row:3;grid-template-columns:minmax(0,2fr) minmax(260px,1fr);}
        .nl-home-content>.nl-achievements{grid-column:1;grid-row:4;min-width:0;height:auto;}
        .nl-home-content>.nl-donation{grid-column:2;grid-row:4;margin:0;padding:14px;height: auto;}
        .nl-home-content>#impact{grid-column:1/-1;grid-row:5;}
        .nl-home-content>.nl-voices-partners{grid-column:1/-1;grid-row:6;display:grid;grid-template-columns:1.7fr 1fr;gap:12px;}
        .nl-home-content>.nl-public-notice{grid-column:1/-1;grid-row:5;margin:0;}
        .nl-home-content>#news{grid-row:7;margin:0!important;}
        .nl-home-content>.nl-volunteer{grid-row:8;margin:0;}
        .nl-home-content>.nl-actions{grid-row:9;}
        .nl-hero{position:relative;width:100%;aspect-ratio:4/1;max-height:360px;background:#1A2E05;overflow:hidden;}
        .nl-hero-copy{position:absolute;z-index:4;inset:0;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:24px max(6vw,32px);background:linear-gradient(90deg,rgba(26, 46, 5,.78),rgba(26, 46, 5,.18) 58%,transparent);color:#fff;pointer-events:none;}
        .nl-hero-copy h1{max-width:560px;font-size:42px;line-height:1.1;margin:0 0 8px;font-weight:800;}
        .nl-hero-copy p{font-size:15px;margin:0 0 16px;}
        .nl-hero-actions{display:flex;gap:9px;pointer-events:auto;}
        .nl-blue-button{background:#4D7C0F;color:#fff;border:0;border-radius:5px;padding:11px 17px;font-size:13px;font-weight:800;cursor:pointer;text-decoration:none;}
        .nl-blue-button.secondary{background:#fff;color:#3F6212;}
        .nl-about{display:grid;grid-template-columns:1.2fr .8fr;gap:16px;align-items:center;background:#fff;border:1px solid #e4eaf0;border-radius:6px;padding:16px 20px;margin:12px 0;}
        .nl-about h2{margin:0 0 6px;color:#3F6212;font-size:19px;}
        .nl-about p{margin:0;color:#475569;font-size:13px;line-height:1.5;}
        .nl-about img{width:100%;height:120px;object-fit:cover;border-radius:4px;}
        .nl-hero-slide,.nl-hero-slide a{position:absolute;inset:0;}
        .nl-hero-slide a{display:block;}
        .nl-hero-slide img{width:100%;height:100%;object-fit:cover;display:block;}
        .nl-arrow{position:absolute;top:50%;transform:translateY(-50%);width:36px;height:36px;border-radius:50%;border:0;background:rgba(0,0,0,.45);color:#fff;font-size:22px;cursor:pointer;z-index:5;}
        .nl-prev{left:14px;} .nl-next{right:14px;}
        .nl-dots{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:7px;z-index:5;}
        .nl-dot{width:9px;height:9px;border-radius:50%;border:0;padding:0;cursor:pointer;background:rgba(255,255,255,.5);}
        .nl-dot.on{background:#fff;}

        .nl-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:8px 0;}
        .nl-stat{background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:12px 10px;display:flex;align-items:center;gap:10px;min-width:0;}
        .nl-stat>div:first-child{flex-shrink:0;}
        .nl-stat-num{font-size:20px;font-weight:800;color:#111827;line-height:1.1;}
        .nl-stat-label{font-size:11px;color:#475569;margin-top:3px;line-height:1.25;}

        .nl-two{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0; align-items:start;}
        .nl-card{background:#fff;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;}
        .nl-card-h{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid #eef2f7;}
        .nl-card-h h2{margin:0;font-size:20px;font-weight:800;color:#0f172a;}
        .nl-viewall{background:none;border:0;color:#4D7C0F;font-weight:600;font-size:13px;cursor:pointer;}
        .nl-row{display:flex;align-items:center;gap:12px;padding:12px 18px;border-bottom:1px solid #f1f5f9;}
        .nl-row:last-child{border-bottom:0;}
        .nl-row-link{width:100%;background:none;border:0;border-bottom:1px solid #f1f5f9;text-align:left;text-decoration:none;color:inherit;cursor:pointer;font-family:inherit;}
        .nl-row-link:hover{background:#f8fafc;}
        .nl-row-t{flex:1;min-width:0;font-size:14px;font-weight:600;color:#1f2937;}
        .nl-row-s{font-size:12px;color:#64748b;font-weight:400;margin-top:2px;}
        .nl-apply{background:#C9302C;color:#fff;border:0;border-radius:5px;padding:8px 16px;font-weight:700;font-size:13px;text-decoration:none;white-space:nowrap;cursor:pointer;}
        .nl-apply:hover{background:#A52822;}
        .nl-new{background:#e53e3e;color:#fff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:4px;flex-shrink:0;}
        .nl-date{font-size:12px;color:#64748b;white-space:nowrap;}
        .nl-empty{padding:28px 18px;color:#64748b;font-style:italic;text-align:center;}

        .nl-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0;}
        .nl-actions4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px;}
        .nl-btn{background:#4D7C0F;color:#fff;font-weight:800;font-size:14px;padding:14px 8px;border:0;border-radius:5px;cursor:pointer;}
        .nl-actions .nl-btn{background:#fff;color:#4D7C0F;border:1px solid #d6e0e8;font-size:12px;padding:9px 8px;box-shadow:inset 0 -3px 0 0 #4D7C0F;}

        .nl-home-grid,.nl-cert-support-grid{display:grid;grid-template-columns:1.35fr 1fr;gap:16px;margin:16px 0;align-items:stretch;}
        .nl-cert-support-grid{grid-template-columns:1fr;}
        .nl-gallery-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;padding:12px;}
        .nl-gallery-item{display:block;aspect-ratio:1/1;overflow:hidden;border:0;padding:0;border-radius:5px;background:#eef2f7;cursor:pointer;}
        .nl-gallery-item img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .2s ease;}
        .nl-gallery-item:hover img{transform:scale(1.04);}
        .nl-feed-list{padding:0 14px;}
        .nl-feed-item{display:grid;grid-template-columns:64px minmax(0,1fr);gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #eef2f7;}
        .nl-feed-item:last-child{border-bottom:0;}
        .nl-feed-item img{width:64px;height:58px;object-fit:cover;border-radius:4px;background:#f1f5f9;}
        .nl-feed-avatar{width:64px;height:58px;border-radius:4px;background:#F7FEE7;color:#3F6212;display:grid;place-items:center;font-size:13px;font-weight:800;}
        .nl-feed-copy{min-width:0;}
        .nl-feed-copy strong{display:block;font-size:12px;color:#1f2937;margin-bottom:3px;}
        .nl-feed-copy p{font-size:11px;line-height:1.4;color:#475569;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
        .nl-feed-open{border:0;background:none;color:#4D7C0F;font:inherit;font-size:11px;font-weight:700;padding:6px 0 0;cursor:pointer;}
        .nl-feed-meta{display:flex;gap:10px;color:#64748b;font-size:10px;margin-top:4px;}
        .nl-support-card{height:100%;min-height:200px;padding:20px;background:#edf7ef;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;}
        .nl-support-card h2{margin:0 0 8px;color:#153b2a;font-size:20px;}
        .nl-support-card p{margin:0 0 16px;color:#475569;font-size:13px;line-height:1.6;}
        .nl-support-actions{display:flex;gap:8px;flex-wrap:wrap;}
        .nl-page .nl-pill{background:#4D7C0F;color:#fff;border-radius:5px;}
        .nl-job-meta{font-size:11px;color:#64748b;font-weight:400;line-height:1.45;margin-top:4px;}
        .nl-job-badge{display:inline-block;background:#ECFCCB;color:#3F6212;border-radius:3px;padding:2px 6px;font-size:9px;font-weight:800;margin-right:6px;}
        /* .nl-notification-list{max-height:254px;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:#A3BE8C transparent;} */
        .nl-notification-list {
  max-height: 254px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #A3BE8C transparent;
  margin-bottom: 0;
  padding-bottom: 0;
}
        .nl-notification-list::-webkit-scrollbar{width:6px;}
        .nl-notification-list::-webkit-scrollbar-thumb{background:#A3BE8C;border-radius:3px;}
        .nl-donation{background:#F7FEE7;border:1px solid #D9F99D;border-radius:8px;padding:22px;margin:16px 0;scroll-margin-top:20px;}
        .nl-donation-heading{text-align:center;margin:0 0 4px;color:#3F6212;font-size:26px;}
        .nl-donation-intro{text-align:center;margin:0 auto 18px;color:#475569;font-size:13px;max-width:620px;}
        .nl-donation-grid{display:none;grid-template-columns:1fr;gap:10px;margin-top:12px;}
        .nl-donation.expanded .nl-donation-grid{display:grid;}
        .nl-donation-visual{display:grid;grid-template-columns:90px minmax(0,1fr);gap:12px;align-items:center;}
        .nl-donation-visual img{width:90px;height:92px;object-fit:cover;border-radius:5px;}
        .nl-donation-visual p{font-size:12px;color:#475569;line-height:1.45;margin:0 0 10px;}
        .nl-donation-actions{display:flex;gap:7px;flex-wrap:wrap;}
        .nl-achievement-carousel{position:relative;padding:14px 36px 8px;}
        .nl-achievement-window{overflow:hidden;width:100%;}
        .nl-achievement-track{display:flex;transition:transform .38s ease;will-change:transform;}
        .nl-achievement-slide{flex:0 0 100%;min-width:0;}
        .nl-achievement-image-button{
  width:100%;
  height:360px;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:8px;
  background:#f8fafc;
  border:1px solid #e7edf3;
  border-radius:6px;
  cursor:zoom-in;
  overflow:hidden;
}
  .nl-achievement-image-button img{
  display:block;
  width:100%;
  height:100%;
  object-fit:contain;
}
       
        /* .nl-achievement-image-button{width:100%;height:200px;display:grid;place-items:center;padding:4px;background:#f8fafc;border:1px solid #e7edf3;border-radius:4px;cursor:zoom-in;} */
       /* .nl-achievement-image-button img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;} */
        .nl-achievement-arrow{position:absolute;top:50%;transform:translateY(-50%);width:28px;height:28px;display:grid;place-items:center;border:1px solid #d7e2ee;border-radius:50%;background:#fff;color:#3F6212;font-size:19px;line-height:1;cursor:pointer;}
        .nl-achievement-arrow.prev{left:2px;}
        .nl-achievement-arrow.next{right:2px;}
        .nl-achievement-meta{text-align:center;padding:10px 4px 2px;}
        .nl-achievement-meta h3{font-size:13px;color:#3F6212;margin:0 0 4px;}
        .nl-achievement-meta p{font-size:10px;line-height:1.35;color:#64748b;margin:3px 0;}
        .nl-achievement-dots{display:flex;justify-content:center;gap:6px;margin-top:8px;}
        .nl-achievement-dot{width:7px;height:7px;padding:0;border:0;border-radius:50%;background:#cbd5e1;cursor:pointer;}
        .nl-achievement-dot.active{background:#4D7C0F;}
        .nl-achievement-empty{min-height:230px;display:grid;place-items:center;padding:20px;text-align:center;color:#64748b;font-size:12px;}
        .nl-achievement-preview{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(7,22,39,.82);}
        .nl-achievement-preview-content{position:relative;display:flex;align-items:center;justify-content:center;max-width:min(1000px,94vw);max-height:90vh;padding:14px;background:#fff;border-radius:6px;}
        .nl-achievement-preview-content img{display:block;max-width:100%;max-height:calc(90vh - 28px);width:auto;height:auto;object-fit:contain;}
        .nl-achievement-preview-close{position:absolute;top:5px;right:5px;width:32px;height:32px;border:0;border-radius:50%;background:#3F6212;color:#fff;font-size:22px;cursor:pointer;}
        .nl-notifications-only {
  height: auto;
  max-height: 254px;
  overflow-y: auto;
}
        .nl-donation-panel{background:#fff;border:1px solid #dce6f0;border-radius:6px;padding:12px;}
        .nl-donation-panel h3{margin:0 0 12px;color:#3F6212;font-size:18px;}
        .nl-amounts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:10px 0 12px;}
        .nl-amount-option{background:#fff;border:1px solid #A3BE8C;color:#3F6212;border-radius:4px;padding:9px 5px;font-size:12px;font-weight:700;cursor:pointer;}
        .nl-amount-option.selected{background:#F7FEE7;border-color:#4D7C0F;color:#3F6212;box-shadow:inset 0 0 0 1px #4D7C0F;}
        .nl-custom-amount,.nl-donation-form input,.nl-donation-form textarea{width:100%;border:1px solid #cbd5e1;border-radius:4px;padding:9px 10px;font:inherit;font-size:13px;}
        .nl-donation-form{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px;}
        .nl-donation-form label{display:flex;flex-direction:column;gap:4px;color:#475569;font-size:11px;font-weight:700;}
        .nl-donation-form .full{grid-column:1/-1;}
        .nl-donation-form textarea{min-height:62px;resize:vertical;}
        .nl-form-alert{color:#9a3412;background:#fff7ed;border:1px solid #fed7aa;border-radius:4px;padding:8px;font-size:12px;line-height:1.4;margin-top:8px;}
        .nl-upload-drop{display:flex;flex-direction:column;align-items:flex-start;gap:10px;border:1px dashed #A3BE8C;background:#f7fbff;border-radius:5px;padding:16px;}
        .nl-upload-drop input{max-width:100%;font-size:12px;}
        .nl-upload-help{font-size:11px;color:#64748b;margin:8px 0 0;line-height:1.5;}
        .nl-volunteer{display:flex;justify-content:space-between;align-items:center;gap:18px;background:#3F6212;color:#fff;border-radius:6px;padding:18px 22px;margin:16px 0;}
        .nl-volunteer h2{font-size:19px;margin:0 0 4px;}
        .nl-volunteer p{font-size:12px;margin:0;color:#ECFCCB;}
        .nl-volunteer .nl-blue-button{background:#fff;color:#3F6212;white-space:nowrap;transition:background 0.2s,color 0.2s;}
        .nl-volunteer .nl-blue-button:hover{background:#F7FEE7;}
         
        .nl-certificate-types{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:10px;
  margin:10px 0 12px;
}

.nl-certificate-type{
  background:#eff6fd;
  border:1px solid #d8e6f5;
  border-radius:7px;
  padding:14px 10px;
  text-align:center;
}

.nl-certificate-icon{
  width:40px;
  height:40px;
  margin:0 auto 7px;
  border-radius:50%;
  background:#ECFCCB;
  color:#4D7C0F;
  display:grid;
  place-items:center;
  font-size:19px;
}

.nl-certificate-type strong{
  display:block;
  font-size:13px;
  color:#3F6212;
  line-height:1.3;
}

.nl-certificate-type button{
  margin-top:8px;
  border:1px solid #A3BE8C;
  border-radius:4px;
  background:#fff;
  color:#4D7C0F;
  font-size:11px;
  padding:5px 10px;
  cursor:pointer;
}
  .nl-notification-list .nl-date {
  display: block;
  margin-top: 4px;
}

.nl-notification-list .nl-row .nl-viewall {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
}
        .nl-voices,.nl-partners{background:#fff;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;}
        .nl-testimonial-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:10px;}
        .nl-testimonial{border:1px solid #e7edf3;border-radius:5px;padding:10px;min-width:0;}
        .nl-testimonial-head{display:flex;gap:8px;align-items:center;margin-bottom:7px;}
        .nl-testimonial-head img,.nl-testimonial-avatar{width:34px;height:34px;border-radius:50%;object-fit:cover;background:#F7FEE7;display:grid;place-items:center;color:#3F6212;font-weight:800;font-size:11px;}
        .nl-testimonial-name{font-size:10px;font-weight:800;color:#1A2E05;}
        .nl-testimonial-place{font-size:9px;color:#64748b;}
        .nl-testimonial-copy{font-size:12px;color:#475569;line-height:1.4;margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
        .nl-testimonial-stars{color:#e78b27;font-size:11px;margin-top:6px;}
        .nl-partner-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;padding:10px;}
        .nl-partner-card{height:52px;border:1px solid #edf0f3;border-radius:4px;display:grid;place-items:center;padding:6px;}
        .nl-partner-card img{max-width:100%;max-height:50px;object-fit:contain;}
        .nl-page .nl-new{background:#dc2626;color:#fff;}
        .nl-page .nl-job-badge{background:#ECFCCB;color:#3F6212;}
        .nl-page .nl-sec-h{color:#3F6212;}
        .nl-cert-support-grid button:not(.nl-btn){border-color:#4D7C0F!important;color:#4D7C0F!important;}
        .nl-cert-support-grid button[style*="background"]{background:#4D7C0F!important;}
        .nl-page .nl-modal{border-top-color:#4D7C0F;}
        .nl-page .nl-modal-head h3{color:#4D7C0F;}
        .nl-partner-row{display:flex;justify-content:space-around;align-items:center;gap:20px;flex-wrap:wrap;padding:18px 12px;}
        .nl-partner-row img{width:auto;height:46px;max-width:130px;object-fit:contain;}
        .nl-home-footer{background:#1A2E05;color:#cbd9bd;padding:40px 0 0;margin-top:18px;border-top:3px solid #4D7C0F;}
        .nl-footer-grid{display:grid;grid-template-columns:1.35fr .9fr .9fr 1.15fr 1.25fr;gap:28px;padding-bottom:28px;}
        .nl-home-footer h3{font-size:13px;color:#fff;margin:0 0 16px;letter-spacing:.08em;text-transform:uppercase;position:relative;padding-bottom:10px;}
        .nl-home-footer h3::after{content:"";position:absolute;left:0;bottom:0;width:26px;height:2px;background:#65A30D;border-radius:2px;}
        .nl-home-footer p,.nl-home-footer button,.nl-home-footer a{font-size:12px;line-height:1.8;color:#cbd9bd;}
        .nl-home-footer button{display:block;border:0;background:none;padding:4px 0;text-align:left;cursor:pointer;transition:color .15s ease,transform .15s ease;}
        .nl-home-footer a{text-decoration:none;display:block;transition:color .15s ease,transform .15s ease;}
        .nl-footer-grid>div>button:hover,.nl-footer-grid>div>a:hover{color:#D9F99D;transform:translateX(3px);}
        .nl-home-footer .nl-footer-social{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:6px;}
        .nl-home-footer .nl-footer-social a{width:38px;height:38px;flex:0 0 38px;border-radius:50%;display:flex;align-items:center;justify-content:center;line-height:1;box-shadow:0 2px 6px rgba(0,0,0,.25);transition:transform .2s ease,box-shadow .2s ease;}
        .nl-home-footer .nl-footer-social a:hover{transform:translateY(-3px) scale(1.06);box-shadow:0 6px 14px rgba(0,0,0,.3);}
        .nl-home-footer .nl-footer-social svg{display:block;width:18px;height:18px;flex:0 0 18px;}
        .nl-home-footer input{width:100%;min-width:0;border:1px solid rgba(255,255,255,.22);border-radius:6px;background:rgba(255,255,255,.08);color:#fff;padding:9px 10px;font:inherit;font-size:12px;transition:border-color .15s ease,background .15s ease;}
        .nl-home-footer input::placeholder{color:#9fb28a;}
        .nl-home-footer input:focus{outline:none;border-color:#65A30D;background:rgba(255,255,255,.12);}
        .nl-newsletter-form{display:flex;gap:6px;margin:10px 0;}
        .nl-newsletter-form button{background:#4D7C0F;color:#fff;border-radius:6px;padding:9px 14px;white-space:nowrap;font-weight:700;transition:background .15s ease;}
        .nl-newsletter-form button:hover{background:#65A30D;color:#fff;transform:none;}
        .nl-footer-brand{display:flex;align-items:flex-start;gap:12px;}
        .nl-footer-brand img{width:56px;height:56px;object-fit:contain;background:#fff;border-radius:50%;padding:4px;box-shadow:0 2px 8px rgba(0,0,0,.25);flex-shrink:0;}
        .nl-footer-copy{border-top:1px solid rgba(255,255,255,.14);margin-top:8px;padding:16px 0;font-size:11px;color:#9fb28a;display:flex;justify-content:space-between;gap:12px;}
        .nl-footer-copy button{display:inline;color:#9fb28a;transition:color .15s ease;}
        .nl-footer-copy button:hover{color:#D9F99D;transform:none;}

        .nl-sec{background:#fff;border:1px solid #e5e7eb;border-radius:12px;margin:16px 0;padding:18px 24px;}
        .nl-sec-h{margin:0 0 16px;font-size:22px;font-weight:800;color:#0f172a;text-align:center;}
        .nl-pill{background:#0aca00;color:#fff;border:0;padding:10px 24px;font-size:15px;font-weight:700;border-radius:25px;cursor:pointer;}

        .nl-info{padding:18px 0;text-align:center;}
        .nl-page .nl-info{background:#edf4fb!important;}
        .nl-info p{margin:0;line-height:1.8;color:#333;font-weight:600;font-size:15px;}
        .nl-info-title{display:inline-block;border:2px solid #374151;padding:8px 20px;font-weight:900;margin-bottom:16px;font-size:22px;}
        .nl-logos{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:32px;padding:24px 0;}
        .nl-logos img{height:70px;width:auto;object-fit:contain;}
        .nl-label{text-align:center;font-weight:700;color:#aaa;letter-spacing:.1em;text-transform:uppercase;font-size:11px;}

        .nl-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;}
        .nl-modal{background:#fff;border-radius:8px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;border-top:4px solid #0aca00;}
        .nl-modal-head{position:sticky;top:0;background:#fff;padding:14px 22px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;}
        .nl-modal-head h3{margin:0;color:#0aca00;font-size:20px;}
        .nl-modal-head button{background:none;border:0;font-size:28px;cursor:pointer;color:#555;line-height:1;}
        .nl-modal-body{padding:22px;}
        .nl-modal-img{width:100%;max-height:300px;object-fit:contain;border-radius:8px;margin-bottom:16px;background:#f8f9fa;}
        .nl-modal-text{margin:0 0 16px;color:#333;font-size:16px;line-height:1.6;white-space:pre-wrap;}
        .nl-modal-author{display:flex;flex-direction:column;gap:2px;border-top:1px solid #eee;padding-top:12px;font-size:14px;}
        .nl-modal-author span{color:#777;font-size:13px;}

        @media(max-width:1024px){
          .nl-footer-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
        }
        @media(max-width:768px){
          .nl-actions{grid-template-columns:1fr;}
          .nl-actions4{grid-template-columns:repeat(2,1fr);}
          .nl-sec{padding:14px 12px;}
          .nl-info p{font-size:13px;}
          .nl-info-title{font-size:15px;}
          .nl-logos{gap:16px;}
          .nl-logos img{height:44px;}
        }
        @media(max-width:760px){
          .nl-home-content{display:flex;flex-direction:column;}
          .nl-certificate-types{grid-template-columns:repeat(2,minmax(0,1fr));}
          .nl-home-content>.nl-stats{order:1;}
          .nl-home-content>.nl-two{order:2;}
          .nl-home-content>.nl-home-grid{order:3;}
          .nl-home-content>.nl-achievements{order:4;}
          .nl-home-content>.nl-donation{order:5;}
          .nl-home-content>.nl-public-notice{order:6;}
          .nl-home-content>.nl-voices-partners{order:7;}
          .nl-home-content>#news{order:8;}
          .nl-home-content>.nl-volunteer{order:9;}
          .nl-home-content>.nl-actions{order:10;}
          .nl-home-content>.nl-home-grid{grid-template-columns:1fr;}
          .nl-home-content>.nl-voices-partners{display:grid;grid-template-columns:1fr;}
          .nl-home-content>.nl-donation{margin:0;}
          .nl-achievement-image-button{height:220px;}
          .nl-stats{grid-template-columns:repeat(2,minmax(0,1fr));}
          .nl-two,.nl-home-grid{grid-template-columns:1fr;}
          .nl-donation-grid,.nl-about{grid-template-columns:1fr;}
          .nl-gallery-grid{grid-template-columns:repeat(3,minmax(0,1fr));}
          .nl-about img{height:150px;}
        }
          /* ================================
   SEPARATE SECTION SPACING
================================ */

/* JOBS + CAREER */
.nl-two {
  margin: 16px 0;
  gap: 16px;
}

/* NOTIFICATION */
.nl-notification-list {
  margin: 0;
  padding: 0;
}

/* CERTIFICATE */
.nl-cert-support-grid {
  margin: 16px 0;
  padding: 0;
}

/* ACHIEVEMENTS */
.nl-achievements {
  margin: 16px 0;
  padding: 0;
}

/* DONATION */
.nl-donation {
  margin: 16px 0 !important;
  padding: 22px;
}

/* Don't give certificate/achievement/donation
   the same height */
.nl-cert-support-grid,
.nl-achievements,
.nl-donation {
  height: auto;
  min-height: 0;
}



        @media(max-width:600px){
          .nl-wrap{padding:0 12px;}
          .nl-hero{aspect-ratio:16/9;}
          .nl-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}
          .nl-arrow{width:28px;height:28px;font-size:18px;}
          .nl-prev{left:6px;} .nl-next{right:6px;}
          .nl-stat{padding:10px;gap:8px;}
          .nl-stat-num{font-size:18px;}
          .nl-stat-label{font-size:11px;}
          .nl-card-h h2{font-size:17px;}
          .nl-row{flex-wrap:wrap;padding:10px 12px;}
          .nl-card-h{padding:12px;}
          .nl-gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
          .nl-footer-grid{grid-template-columns:1fr 1fr;gap:18px 14px;}
          .nl-footer-grid>div:first-child{grid-column:1/-1;}
          .nl-footer-copy{flex-direction:column;}
          .nl-donation{padding:14px;}
          .nl-donation-heading{font-size:21px;}
          .nl-donation-panel{padding:13px;}
          .nl-amounts{grid-template-columns:repeat(2,minmax(0,1fr));}
          .nl-volunteer{align-items:flex-start;flex-direction:column;padding:16px;}
          .nl-testimonial-grid{grid-template-columns:1fr;}
          .nl-hero-copy{padding:14px 18px;background:linear-gradient(90deg,rgba(26, 46, 5,.82),rgba(26, 46, 5,.32));}
          .nl-hero-copy h1{font-size:23px;}
          .nl-hero-copy p{font-size:12px;margin-bottom:9px;}
          .nl-blue-button{padding:8px 10px;font-size:11px;}
        }
          .nl-important-note {
  margin: 12px 16px;
  padding: 12px 14px;
  background: #fff8e1;
  border-left: 4px solid #f59e0b;
  border-radius: 6px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.nl-note-icon {
  font-size: 18px;
}

.nl-important-note strong {
  display: block;
  color: #92400e;
  font-size: 14px;
  margin-bottom: 3px;
}

.nl-important-note p {
  margin: 0;
  color: #78350f;
  font-size: 12px;
  line-height: 1.5;
}
      `}</style>

      {/* HERO — admin-managed scroller images (same API as before) */}
      <section className="nl-hero" id="top">
        {slides.map((src, i) => {
          const si = scrollerImages[i];
          const img = (
            <img
              src={src}
              alt={si?.title || `slide ${i + 1}`}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = fallbackSlides[i % fallbackSlides.length];
              }}
            />
          );
          return (
            <div key={i} className="nl-hero-slide" style={{ display: i === slide ? "block" : "none" }}>
              {si?.link ? (
                <a href={si.link} target="_blank" rel="noopener noreferrer">{img}</a>
              ) : (
                img
              )}
            </div>
          );
        })}
        {slides.length > 1 && (
          <>
            <button className="nl-arrow nl-prev" onClick={() => setSlide((s) => (s - 1 + slides.length) % slides.length)} aria-label="Previous">‹</button>
            <button className="nl-arrow nl-next" onClick={() => setSlide((s) => (s + 1) % slides.length)} aria-label="Next">›</button>
            <div className="nl-dots">
              {slides.map((_, i) => (
                <button key={i} className={`nl-dot ${i === slide ? "on" : ""}`} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} />
              ))}
            </div>
          </>
        )}
      </section>

      <div className="nl-wrap nl-home-content">
        <div className="nl-stats" aria-label={text.impact}>
          {stats.map((s, i) => (
            <div key={i} className="nl-stat">
              <div>{s.icon}</div>
              <div>
                <div className="nl-stat-num"><LandingStatValue value={s.value} suffix={s.suffix} /></div>
                <div className="nl-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Live vacancies and notifications from existing public APIs */}
        <div className="nl-two">
          <div className="nl-card" id="jobs">
            <div className="nl-card-h">
              <h2>💼 {text.jobs}</h2>
              <button className="nl-viewall" onClick={() => onNavigate("jobs")}>{text.viewJobs} →</button>
            </div>
            {vacancies.length === 0 ? (
              <div className="nl-empty">{text.noJobs}</div>
            ) : (
              <NlTicker items={vacancies.slice(0, 20)} extraClass="nl-notifications-only" renderItem={(v, i, dup) => (
                <div key={`${dup ? "d" : "o"}-${v?._id || i}`} className="nl-row" aria-hidden={dup || undefined}>
                  <div className="nl-row-t">
                    {i === 0 && <span className="nl-job-badge">{text.latest}</span>}
                    {v?.post?.[language] || v?.post?.en || vText(v)}
                    <div className="nl-job-meta">
                      {[v?.location?.[language] || v?.location?.en, v?.education?.[language] || v?.education?.en, v?.lastDate && `${language === "hi" ? "अंतिम तिथि" : "Last date"}: ${v.lastDate}`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <a className="nl-apply" tabIndex={dup ? -1 : undefined} href={v?._id ? `/job-postings/view/${v._id}` : vLink(v)}>{text.details}</a>
                </div>
              )} />
            )}
          </div>

         <div className="nl-card" id="notifications">
            <div className="nl-card-h">
              <h2>📢 {text.notifications}</h2>
              <button className="nl-viewall" onClick={() => onNavigate("notifications")}>{text.viewAll} →</button>
            </div>
           
            {notifications.length === 0 ? (
              <div className="nl-empty">{text.noNotices}</div>
            ) : (
              <NlTicker items={notifications.slice(0, 20)} renderItem={(n, i, dup) => (
                <div key={`${dup ? "d" : "o"}-${n?._id || i}`} className="nl-row" aria-hidden={dup || undefined}>
                  <div className="nl-row-t">
                    {i === 0 && <span className="nl-job-badge">{text.latest}</span>}
                    {n.title}
                    <div className="nl-job-meta">
                      <span className="nl-date">
                        {n.notificationDate
                          ? new Date(n.notificationDate).toLocaleDateString("en-IN")
                          : ""}
                      </span>
                    </div>
                  </div>
                  <a 
                    className="nl-apply" 
                    href={n?.url || (n?._id ? `/notifications/view/${n._id}` : "#")} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    tabIndex={dup ? -1 : undefined}
                  >
                    {language === "hi" ? "विवरण देखें" : "View Details"}
                  </a>
                </div>
              )} />
            )}
          </div>
          
        </div>

        <section className="nl-card nl-achievements" aria-label="Our Certificates & Achievements">
          <div className="nl-card-h">
            <h2>Our Certificates &amp; Achievements</h2>
          </div>
          {achievements.length ? (
            <>
              <div className="nl-achievement-carousel">
                <button
                  type="button"
                  className="nl-achievement-arrow prev"
                  aria-label="Previous certificate"
                  onClick={() => setAchievementIndex((index) => (index - 1 + achievements.length) % achievements.length)}
                >
                  ‹
                </button>
                <div className="nl-achievement-window">
                  <div className="nl-achievement-track" style={{ transform: `translateX(-${achievementIndex * 100}%)` }}>
                    {achievements.map((achievement) => (
                      <div className="nl-achievement-slide" key={achievement.title}>
                        <button
                          type="button"
                          className="nl-achievement-image-button"
                          aria-label={`Preview ${achievement.title}`}
                          onClick={() => setSelectedAchievement(achievement)}
                        >
                          <img src={achievement.image} alt={achievement.title} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="nl-achievement-arrow next"
                  aria-label="Next certificate"
                  onClick={() => setAchievementIndex((index) => (index + 1) % achievements.length)}
                >
                  ›
                </button>
              </div>
              <div className="nl-achievement-meta" aria-live="polite">
                <h3>{achievements[achievementIndex].title}</h3>
                <p>{achievements[achievementIndex].issuer}</p>
                <p>{achievements[achievementIndex].date}</p>
                {achievements[achievementIndex].description && <p>{achievements[achievementIndex].description}</p>}
              </div>
              <div className="nl-achievement-dots" aria-label="Choose certificate">
                {achievements.map((achievement, index) => (
                  <button
                    type="button"
                    key={achievement.title}
                    className={`nl-achievement-dot ${index === achievementIndex ? "active" : ""}`}
                    aria-label={`Show certificate ${index + 1}`}
                    aria-current={index === achievementIndex ? "true" : undefined}
                    onClick={() => setAchievementIndex(index)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="nl-achievement-empty">Certificates &amp; achievements will be displayed here.</div>
          )}
        </section>

        <section className="nl-card nl-feed-side" id="feed">
          <div className="nl-card-h">
            <h2>🌐 {text.feed}</h2>
            <button className="nl-viewall" onClick={() => onNavigate("feeds")}>{text.viewAll} →</button>
          </div>
          {loadingFeeds ? (
            <div className="nl-empty">Loading feeds...</div>
          ) : feeds.length ? (
            <div className="nl-feed-list">
              {feeds.slice(0, 6).map((feed, index) => {
                const image = feed.image || feed.images?.[0];
                return (
                  <div className="nl-feed-item" key={feed._id || index}>
                    {image ? <img src={nlImg(image)} alt="" loading="lazy" /> : <div className="nl-feed-avatar">JSS</div>}
                    <div className="nl-feed-copy">
                      <strong>{feed.author?.name || ""}</strong>
                      <p>{feed.text || "Community update"}</p>
                      <div className="nl-feed-meta">
                        <span>♥ {feed.likes?.length || 0}</span>
                        {feed.createdAt && <span>{new Date(feed.createdAt).toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN")}</span>}
                      </div>
                      <button className="nl-feed-open" onClick={() => setSelectedFeed(feed)}>{language === "hi" ? "अपडेट पढ़ें" : "Read update"}</button>
                    </div>
                  </div>
                );
              })}
              <button type="button" className="nl-feed-more" onClick={() => onNavigate("feeds")}>
                {language === "hi" ? "सभी अपडेट देखें →" : "See all community updates →"}
              </button>
            </div>
          ) : (
            <div className="nl-empty">No public feeds available.</div>
          )}
        </section>

        <section id="news" className="nl-card" style={{ margin: "16px 0" }}>
          <div className="nl-card-h"><h2>📰 {text.news}</h2><button className="nl-viewall" onClick={() => onNavigate("news")}>{text.viewAll} →</button></div>
          <NlNewsAccordion />
        </section>

        <div className="nl-home-grid">
          <section className="nl-card" id="gallery">
            <div className="nl-card-h">
              <h2>📷 {text.gallery}</h2>
              <button className="nl-viewall" onClick={() => onNavigate("gallery")}>{text.viewAll} →</button>
            </div>
            {loadingGallery ? (
              <div className="nl-empty">Loading gallery...</div>
            ) : galleryImages.length ? (
              <div className="nl-gallery-grid">
                {galleryImages.slice(0, 5).map((image, index) => (
                  <button key={image._id || image.id || index} className="nl-gallery-item" onClick={() => onNavigate("gallery")} aria-label={`Open gallery image ${image.title || index + 1}`}>
                    <img src={nlImg(image.imageUrl)} alt={image.title || `Gallery image ${index + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="nl-empty">No gallery images available.</div>
            )}
          </section>

          <DonationCard text={text} expanded={false} onToggleForm={() => onNavigate("donate")} onNavigate={onNavigate} />
        </div>

        <NlPublicNotice />

        <div className="nl-voices-partners">
          <section className="nl-voices">
            <div className="nl-card-h"><h2>💬 {text.testimonials}</h2></div>
            <div className="nl-testimonial-grid">
              {staticTestimonials.map((testimonial, index) => (
                <article className="nl-testimonial" key={index}>
                  <div className="nl-testimonial-head">
                    <div className="nl-testimonial-avatar" aria-hidden="true">{testimonial.name.slice(0, 1)}</div>
                    <div>
                      <div className="nl-testimonial-name">{testimonial.name}</div>
                      <div className="nl-testimonial-place">{testimonial.location}</div>
                    </div>
                  </div>
                  <p className="nl-testimonial-copy">{testimonial.quote}</p>
                  <div className="nl-testimonial-stars" aria-label="5 out of 5 stars">★★★★★</div>
                </article>
              ))}
            </div>
          </section>
          <section className="nl-partners">
            <div className="nl-card-h"><h2>🤝 {text.partners}</h2></div>
            <div className="nl-partner-grid">
              {[myGovLogo, unicefLogo, nitiAayogLogo, msmeLogo].map((src, index) => (
                <div className="nl-partner-card" key={src}><img src={src} alt={`${text.partners} ${index + 1}`} loading="lazy" /></div>
              ))}
            </div>
          </section>
        </div>

        <section className="nl-volunteer">
          <div><h2>{text.volunteer}</h2><p>{text.support}</p></div>
          <button className="nl-blue-button" onClick={() => onNavigate("jobs")}>{text.join}</button>
        </section>

        <div className="nl-actions">
          {[
            { label: "Online Test & Interview", link: `${PORTAL_URL}my-exam` },
            { label: "Online Mou & Consent Form", link: `${PORTAL_URL}my-exam` },
            { label: "Authorized Login", link: `${PORTAL_URL}login` },
          ].map((btn, i) => (
            <button key={i} className="nl-btn" onClick={() => (window.location.href = btn.link)}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {activeCamps.length > 0 && (
        <div style={{ margin: "16px 0" }}>
          <CampSlider camps={activeCamps} isFullWidth={true} />
        </div>
      )}

      {/* Help & contact strip (fills the space above the footer) */}
      <style>{NL_FILL_CSS}</style>
      <section className="nl-help" aria-label={language === "hi" ? "सहायता" : "Help"}>
        <div className="nl-wrap nl-help-in">
          <div className="nl-help-intro">
            <h2>{language === "hi" ? "मदद चाहिए?" : "Need help?"}</h2>
            <p>{language === "hi" ? "आवेदन, भुगतान या किसी भी जानकारी के लिए हमसे संपर्क करें।" : "Contact us for help with applications, payments or any other information."}</p>
          </div>
          <a className="nl-help-item" href={`tel:${landingConfig?.contactUs?.phones?.[0] || "9471987611"}`}>
            <span className="nl-help-ic">☎</span>
            <span><small>{language === "hi" ? "हेल्पलाइन" : "Helpline"}</small><strong>{landingConfig?.contactUs?.phones?.[0] || "9471987611"}</strong></span>
          </a>
          <a className="nl-help-item" href={`mailto:${landingConfig?.contactUs?.emails?.[0] || "support@jssabhiyan.com"}`}>
            <span className="nl-help-ic">✉</span>
            <span><small>{language === "hi" ? "ईमेल सहायता" : "Email support"}</small><strong>{landingConfig?.contactUs?.emails?.[0] || "support@jssabhiyan.com"}</strong></span>
          </a>
          <button className="nl-blue-button nl-help-cta" onClick={() => onNavigate("jobs")}>
            {language === "hi" ? "खुली नौकरियां देखें" : "View Open Jobs"} →
          </button>
        </div>
      </section>
      {selectedAchievement && (
        <div className="nl-achievement-preview" role="presentation" onClick={() => setSelectedAchievement(null)}>
          <div className="nl-achievement-preview-content" role="dialog" aria-modal="true" aria-label={selectedAchievement.title} onClick={(event) => event.stopPropagation()}>
            <button type="button" className="nl-achievement-preview-close" aria-label="Close certificate preview" onClick={() => setSelectedAchievement(null)}>×</button>
            <img src={selectedAchievement.image} alt={selectedAchievement.title} />
          </div>
        </div>
      )}
      <NlFeedModal feed={selectedFeed} onClose={() => setSelectedFeed(null)} />
    </div>
    </>
  );
}


/* ─── News & Updates (static content) — shown as a click-to-open list ─── */
const NEWS_ITEMS = [
  {
    icon: "💼",
    en: { title: "New Recruitment Opportunities", body: "New job vacancies have been published. Eligible candidates can check the Jobs & Career section and apply before the respective deadline." },
    hi: { title: "नई भर्ती के अवसर", body: "नई नौकरी की रिक्तियां प्रकाशित की गई हैं। पात्र उम्मीदवार Jobs & Career सेक्शन में जाकर निर्धारित अंतिम तिथि से पहले आवेदन कर सकते हैं।" },
  },
  {
    icon: "❤️",
    en: { title: "Patient Support Initiative", body: "Support and assistance initiatives are being promoted to help patients and their families with essential healthcare needs." },
    hi: { title: "मरीज सहायता पहल", body: "मरीजों और उनके परिवारों की आवश्यक स्वास्थ्य संबंधी जरूरतों में सहायता के लिए सहयोगात्मक पहल को बढ़ावा दिया जा रहा है।" },
  },
  {
    icon: "⚠️",
    en: { title: "Important Public Notice", body: "Applicants are advised to verify all recruitment and service-related information through the official portal and remain alert against fraudulent calls or messages." },
    hi: { title: "महत्वपूर्ण सार्वजनिक सूचना", body: "आवेदकों को भर्ती एवं सेवाओं से संबंधित सभी जानकारी आधिकारिक पोर्टल से सत्यापित करने और फर्जी कॉल या संदेशों से सावधान रहने की सलाह दी जाती है।" },
  },
  {
    icon: "🤝",
    en: { title: "Community Support Program", body: "Community-focused initiatives continue to encourage healthcare awareness, social support, and access to essential resources." },
    hi: { title: "सामुदायिक सहयोग कार्यक्रम", body: "स्वास्थ्य जागरूकता, सामाजिक सहयोग और आवश्यक संसाधनों तक पहुंच को बढ़ावा देने वाली सामुदायिक पहल जारी हैं।" },
  },
];

// Public Notice — admin "Notice" page se aata hai (noticesAPI, sirf active notices)
function NlPublicNotice() {
  const [notices, setNotices] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await noticesAPI.getAll(true);
        const list = res?.success ? res.data?.notices || [] : [];
        if (alive) setNotices(list.filter((n) => n.noticeEnglish || n.noticeHindi || n.importantNotice));
      } catch (err) {
        console.error("Error fetching notices:", err);
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Kuch active notice nahi hai to section hi mat dikhao
  if (loaded && notices.length === 0) return null;

  return (
    <section className="nl-card nl-public-notice" id="public-notice">
      <div className="nl-card-h"><h2>📌 PUBLIC NOTICE / सार्वजनिक सूचना</h2></div>
      <div className="nl-pn-body">
        {!loaded ? (
          <div className="nl-pn-loading" aria-busy="true"><span /><span /><span /></div>
        ) : (
          <ul className="nl-pn-list">
            {notices.map((n) => (
              <li key={n._id}>
                {n.importantNotice && <p className="nl-pn-title">{n.importantNotice}</p>}
                {n.noticeEnglish && <p className="nl-pn-text">{n.noticeEnglish}</p>}
                {n.noticeHindi && <p className="nl-pn-text" lang="hi">{n.noticeHindi}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function NlNewsAccordion() {
  return (
    <div className="nl-acc">
      <style>{NL_ACC_CSS}</style>
      {NEWS_ITEMS.map((item) => (
        <details className="nl-acc-item" key={item.en.title}>
          <summary>
            <span className="nl-acc-ic" aria-hidden="true">{item.icon}</span>
            <span className="nl-acc-t">
              <strong>{item.en.title}</strong>
              <span lang="hi">{item.hi.title}</span>
            </span>
            <span className="nl-acc-arrow" aria-hidden="true">▾</span>
          </summary>
          <div className="nl-acc-body">
            <p>{item.en.body}</p>
            <p lang="hi">{item.hi.body}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

const NL_ACC_CSS = `
.nl-acc{display:flex;flex-direction:column;gap:10px;padding:14px 16px 16px;}
.nl-acc-item{border:1px solid #e1ecf8;border-radius:8px;background:#fff;overflow:hidden;transition:box-shadow .15s;}
.nl-acc-item[open]{box-shadow:0 4px 14px rgba(63,98,18,.08);border-color:#D9F99D;}
.nl-acc-item summary{list-style:none;display:flex;align-items:center;gap:12px;padding:13px 16px;cursor:pointer;background:#F7FEE7;}
.nl-acc-item summary::-webkit-details-marker{display:none;}
.nl-acc-item summary:hover{background:#F7FEE7;}
.nl-acc-item summary:focus-visible{outline:2px solid #4D7C0F;outline-offset:-2px;}
.nl-acc-ic{width:38px;height:38px;border-radius:8px;background:#fff;border:1px solid #D9F99D;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;}
.nl-acc-t{flex:1;min-width:0;text-align:left;}
.nl-acc-t strong{display:block;font-size:15px;color:#3F6212;}
.nl-acc-t span{display:block;font-size:13px;color:#64748b;margin-top:2px;}
.nl-acc-arrow{color:#4D7C0F;font-size:18px;transition:transform .2s;flex-shrink:0;}
.nl-acc-item[open] .nl-acc-arrow{transform:rotate(180deg);}
.nl-acc-body{padding:14px 18px 16px 66px;border-top:1px solid #e1ecf8;text-align:left;}
.nl-acc-body p{margin:0;font-size:14.5px;line-height:1.65;color:#1f2937;}
.nl-acc-body p[lang="hi"]{margin-top:8px;color:#475569;}
@media(max-width:600px){.nl-acc{padding:12px;}.nl-acc-body{padding:12px 14px 14px;}}
`;

/* ─── Donate page (/donate) — same form that used to open inside the home donation card ─── */
function DonatePage({ language, onNavigate }) {
  const text = getHomeText(language);
  const [donationAmount, setDonationAmount] = useState("500");
  const [donationCause, setDonationCause] = useState("general");
  const causes = [
    { id: "general", icon: "🤝", en: "Where Needed Most", hi: "जहाँ सबसे ज़्यादा ज़रूरत हो" },
    { id: "patient", icon: "🏥", en: "Patient Treatment", hi: "मरीज़ों का इलाज" },
    { id: "camps", icon: "⛺", en: "Health & Yoga Camps", hi: "स्वास्थ्य एवं योग शिविर" },
    { id: "healthcards", icon: "💳", en: "Free Health Cards", hi: "निःशुल्क हेल्थ कार्ड" },
    { id: "community", icon: "🌱", en: "Community Welfare", hi: "सामुदायिक कल्याण" },
  ];
  const [donationMessage, setDonationMessage] = useState("");
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificatePreview, setCertificatePreview] = useState("");
  const [certificateMessage, setCertificateMessage] = useState("");

  return (
    <div className="dp-page">
      <style>{DP_CSS}</style>
      <main className="dp-main">
        <button type="button" className="dp-back" onClick={() => onNavigate("home")}>← {text.home}</button>
        <section className="dp-hero">
          <div>
            <p className="dp-kicker">{language === "hi" ? "दान" : "Donation"}</p>
            <h1>❤️ {text.makeDonation}</h1>
            <p className="dp-sub">{text.donationCardCopy}</p>
          </div>
        </section>
        <div className="nl-donation-grid dp-grid">
          <div className="nl-donation-panel">
            <h3>{text.donatePatient}</h3>
            <p className="nl-job-meta dp-label">{language === "hi" ? "किस काम के लिए दान करना चाहते हैं?" : "What would you like to support?"}</p>
            <div className="dp-causes" role="radiogroup" aria-label={language === "hi" ? "दान का उद्देश्य" : "Donation cause"}>
              {causes.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  role="radio"
                  aria-checked={donationCause === c.id}
                  className={`dp-cause ${donationCause === c.id ? "selected" : ""}`}
                  onClick={() => setDonationCause(c.id)}
                >
                  <span aria-hidden="true">{c.icon}</span>
                  {language === "hi" ? c.hi : c.en}
                </button>
              ))}
            </div>
            <label className="nl-job-meta dp-label" htmlFor="donation-amount">{text.amount}</label>
            <div className="nl-amounts">
              {["500", "1000", "2500", "5000"].map((amount) => (
                <button type="button" key={amount} className={`nl-amount-option ${donationAmount === amount ? "selected" : ""}`} onClick={() => setDonationAmount(amount)}>₹{Number(amount).toLocaleString("en-IN")}</button>
              ))}
            </div>
            <input id="donation-amount" className="nl-custom-amount" type="number" min="1" step="1" value={donationAmount === "custom" ? "" : donationAmount} placeholder={text.custom} onChange={(event) => setDonationAmount(event.target.value || "custom")} />
            <button className="nl-blue-button" style={{ width: "100%", marginTop: 11 }} onClick={() => { setDonationMessage(""); }}>
              {text.donateNow}
            </button>
            {true && (
              <form className="nl-donation-form" onSubmit={(event) => { event.preventDefault(); setDonationMessage(text.unavailable); }}>
                <label>{text.name}<input required name="donorName" autoComplete="name" /></label>
                <label>{text.mobile}<input required name="mobile" type="tel" autoComplete="tel" /></label>
                <label>{text.email}<input name="email" type="email" autoComplete="email" /></label>
                <label>{language === "hi" ? "विवरण (वैकल्पिक)" : "Details (optional)"}<input name="purpose" placeholder={language === "hi" ? "जैसे किसी मरीज़ या शिविर का नाम" : "e.g. a patient or camp name"} /></label>
                <input type="hidden" name="cause" value={donationCause} />
                <label className="full">{text.message}<textarea name="message" /></label>
                <button className="nl-blue-button full" type="submit">{text.proceed}</button>
              </form>
            )}
            {donationMessage && <div className="nl-form-alert" role="status">{donationMessage}</div>}
          </div>

          {/* Upload Donation Certificate — hidden for now; set SHOW_CERT_UPLOAD = true to bring it back */}
          {SHOW_CERT_UPLOAD && (
            <div className="nl-donation-panel">
              <h3>{text.uploadTitle}</h3>
              <div className="nl-upload-drop">
                <label htmlFor="donation-certificate-file" className="nl-blue-button">{text.chooseFile}</label>
                <input
                  id="donation-certificate-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setCertificateMessage("");
                    setCertificatePreview("");
                    if (!file) { setCertificateFile(null); return; }
                    const validTypes = ["application/pdf", "image/jpeg", "image/png"];
                    if (!validTypes.includes(file.type) || !/\.(pdf|jpe?g|png)$/i.test(file.name)) {
                      setCertificateFile(null);
                      setCertificateMessage(language === "hi" ? "केवल PDF, JPG, JPEG या PNG फ़ाइल चुनें।" : "Choose a PDF, JPG, JPEG, or PNG file.");
                      event.target.value = "";
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      setCertificateFile(null);
                      setCertificateMessage(language === "hi" ? "फ़ाइल 5 MB से छोटी होनी चाहिए।" : "The file must be 5 MB or smaller.");
                      event.target.value = "";
                      return;
                    }
                    setCertificateFile(file);
                    if (file.type.startsWith("image/")) {
                      const reader = new FileReader();
                      reader.onload = () => setCertificatePreview(String(reader.result || ""));
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <span className="nl-job-meta">{certificateFile ? `${text.selectedFile}: ${certificateFile.name}` : text.noFile}</span>
                {certificatePreview && <img src={certificatePreview} alt="Selected certificate preview" style={{ maxWidth: "100%", maxHeight: 140, objectFit: "contain" }} />}
                {certificateFile?.type === "application/pdf" && <span className="nl-job-meta">PDF · {(certificateFile.size / 1024).toFixed(0)} KB</span>}
                <button type="button" className="nl-blue-button" disabled={!certificateFile} onClick={() => setCertificateMessage(text.uploadUnavailable)}>{text.uploadFile}</button>
              </div>
              <p className="nl-upload-help">PDF, JPG, JPEG, PNG · 5 MB maximum</p>
              {certificateMessage && <div className="nl-form-alert" role="status">{certificateMessage}</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const SHOW_CERT_UPLOAD = false;

const DP_CSS = `
.dp-page{background:#f3f6fb;min-height:68vh;font-family:'Segoe UI',sans-serif;color:#1f2937;}
.dp-main{width:94%;max-width:1240px;margin:0 auto;padding:20px 0 48px;}
.dp-back{display:inline-flex;align-items:center;gap:8px;background:#fff;color:#4D7C0F;border:1.5px solid #4D7C0F;border-radius:6px;font-family:inherit;font-weight:800;font-size:15px;line-height:1;cursor:pointer;padding:11px 22px;margin-bottom:16px;box-shadow:0 2px 8px rgba(63,98,18,.08);transition:background .15s,color .15s,box-shadow .15s;}
.dp-back:hover{background:#4D7C0F;color:#fff;box-shadow:0 6px 16px rgba(77,124,15,.25);}
.dp-back:focus-visible{outline:3px solid #D9F99D;outline-offset:2px;}
@media(max-width:600px){.dp-back{font-size:14px;padding:10px 18px;}}
.dp-hero{padding:24px 28px;border-radius:10px;color:#fff;margin-bottom:14px;
  background:linear-gradient(100deg,#3F6212 0%,#4D7C0F 55%,#65A30D 100%);box-shadow:0 6px 16px rgba(77,124,15,.22);text-shadow:0 1px 2px rgba(26,46,5,.35);}
.dp-kicker{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;margin:0 0 4px;}
.dp-hero h1{font-size:28px;font-weight:800;margin:0 0 6px;}
.dp-sub{font-size:14px;margin:0;font-weight:500;}
.dp-grid{display:grid;grid-template-columns:1fr;gap:16px;align-items:start;}
.dp-page .nl-donation-panel{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:30px 32px;box-shadow:0 4px 16px rgba(63,98,18,.07);}
.dp-page .nl-donation-panel h3{margin:0 0 18px;color:#3F6212;font-size:24px;font-weight:800;}
.dp-label{display:block;font-size:14px!important;font-weight:700;color:#334155!important;margin:0 0 8px;}
.dp-causes{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 22px;}
.dp-cause{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid #cbd5e1;background:#fff;border-radius:999px;padding:11px 18px;font-size:15px;font-weight:700;color:#334155;cursor:pointer;white-space:nowrap;transition:all .15s;}
.dp-cause>span{font-size:17px;line-height:1;}
.dp-cause:hover{border-color:#4D7C0F;color:#4D7C0F;}
.dp-cause.selected{background:#4D7C0F;border-color:#4D7C0F;color:#fff;box-shadow:0 3px 10px rgba(77,124,15,.25);}
.dp-page .nl-job-meta{font-size:12px;color:#64748b;}
.dp-page .nl-amounts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:8px 0 10px;}
.dp-page .nl-amount-option{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:14px 6px;font-size:17px;font-weight:800;color:#3F6212;cursor:pointer;}
.dp-page .nl-amount-option.selected,.dp-page .nl-amount-option:hover{border-color:#4D7C0F;background:#F7FEE7;color:#4D7C0F;}
.dp-page .nl-custom-amount,.dp-page .nl-donation-form input,.dp-page .nl-donation-form textarea{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:12px 14px;font:inherit;font-size:15px;box-sizing:border-box;}
.dp-page .nl-custom-amount:focus,.dp-page .nl-donation-form input:focus,.dp-page .nl-donation-form textarea:focus{outline:none;border-color:#4D7C0F;box-shadow:0 0 0 3px #ECFCCB;}
.dp-page .nl-blue-button{display:inline-flex;align-items:center;justify-content:center;background:#4D7C0F;color:#fff;border:0;border-radius:8px;padding:14px 20px;font-size:15px;font-weight:800;cursor:pointer;text-decoration:none;}
.dp-page .nl-blue-button:hover:not(:disabled){background:#3F6212;}
.dp-page .nl-blue-button:disabled{opacity:.55;cursor:not-allowed;}
.dp-page .nl-donation-form{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:20px;}
.dp-page .nl-donation-form label{display:flex;flex-direction:column;gap:6px;color:#334155;font-size:14px;font-weight:700;}
.dp-page .nl-donation-form .full{grid-column:1/-1;}
.dp-page .nl-donation-form textarea{min-height:70px;resize:vertical;}
.dp-page .nl-upload-drop{display:flex;flex-direction:column;align-items:flex-start;gap:10px;border:2px dashed #D9F99D;border-radius:8px;padding:16px;background:#f8fbff;}
.dp-page .nl-upload-drop input[type=file]{display:none;}
.dp-page .nl-upload-help{font-size:12px;color:#64748b;margin:8px 0 0;}
.dp-page .nl-form-alert{margin-top:12px;background:#fffbeb;border:1px solid #fde68a;color:#92400e;border-radius:6px;padding:10px 12px;font-size:13px;}
@media(max-width:800px){.dp-grid{grid-template-columns:1fr;}}
@media(max-width:600px){.dp-page .nl-donation-panel{padding:20px 16px;}.dp-cause{flex:1 1 auto;font-size:14px;padding:10px 14px;}.dp-main{padding:18px 0 48px;}.dp-hero{padding:18px;}.dp-hero h1{font-size:22px;}.dp-page .nl-amounts{grid-template-columns:repeat(2,minmax(0,1fr));}.dp-page .nl-donation-form{grid-template-columns:1fr;}}
`;

/* ─── /donate/learn-more — why donate (opened from "Learn More" on the home donation card) ─── */
const DONATE_INFO_POINTS = [
  {
    icon: "❤️",
    title: "Patient Support / मरीज सहायता",
    en: "Your contribution can help support patients and their families during difficult times.",
    hi: "आपका योगदान कठिन समय में मरीजों और उनके परिवारों की सहायता करने में मदद कर सकता है।",
  },
  {
    icon: "💊",
    title: "Medical Assistance / चिकित्सा सहायता",
    en: "Donations can help support essential healthcare, medicines, and treatment-related needs.",
    hi: "दान आवश्यक स्वास्थ्य सेवाओं, दवाइयों और उपचार संबंधी जरूरतों में सहायता प्रदान करने में मदद कर सकता है।",
  },
  {
    icon: "🍲",
    title: "Essential Needs / आवश्यक जरूरतें",
    en: "Your support can help provide essential resources to people who need assistance.",
    hi: "आपका सहयोग जरूरतमंद लोगों तक आवश्यक संसाधन पहुंचाने में मदद कर सकता है।",
  },
  {
    icon: "🤝",
    title: "Community Support / सामुदायिक सहयोग",
    en: "Together, we can build a caring community that supports people when they need it most.",
    hi: "मिलकर हम एक ऐसे संवेदनशील समुदाय का निर्माण कर सकते हैं जो जरूरत के समय लोगों का साथ दे।",
  },
  {
    icon: "❤️",
    title: "Every Contribution Matters / हर योगदान महत्वपूर्ण है",
    en: "Every contribution, big or small, can make a meaningful difference.",
    hi: "हर योगदान, चाहे छोटा हो या बड़ा, एक सकारात्मक बदलाव लाने में मदद कर सकता है।",
  },
];

function DonateInfoPage({ onNavigate }) {
  return (
    <div className="dp-page">
      <style>{DP_CSS + DI_CSS}</style>
      <main className="dp-main">
        <button type="button" className="dp-back" onClick={() => onNavigate("home")}>← Home</button>
        <section className="dp-hero">
          <p className="dp-kicker">Donation / दान</p>
          <h1>Your Support Can Make a Difference</h1>
          <p className="dp-sub">
            Your contribution can help support patients and families who may need assistance with healthcare, treatment, medicines, and other essential needs. Every contribution, big or small, can help us extend support to those who need it.
          </p>
          <p className="dp-sub di-hi" lang="hi">
            आपका सहयोग जरूरतमंद मरीजों और उनके परिवारों तक स्वास्थ्य सेवाओं, उपचार, दवाइयों और आवश्यक सहायता को पहुंचाने में मदद कर सकता है। आपका छोटा सा योगदान भी किसी के जीवन में सकारात्मक बदलाव ला सकता है।
          </p>
        </section>

        <div className="di-grid">
          {DONATE_INFO_POINTS.map((point) => (
            <article className="di-card" key={point.title}>
              <div className="di-card-h">
                <span className="di-ic" aria-hidden="true">{point.icon}</span>
                <h2>{point.title}</h2>
              </div>
              <p>{point.en}</p>
              <p lang="hi" className="di-hi-text">{point.hi}</p>
            </article>
          ))}
        </div>

        <section className="di-cta">
          <div>
            <h2>Ready to help? / मदद के लिए तैयार हैं?</h2>
            <p>Choose a cause and an amount on the donation page.</p>
          </div>
          <button type="button" className="di-cta-btn" onClick={() => onNavigate("donate")}>Donate Now / अभी दान करें →</button>
        </section>
      </main>
    </div>
  );
}

const DI_CSS = `
.di-hi{margin-top:8px!important;opacity:.95;}
.dp-hero h1{line-height:1.2;}
.di-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:16px;}
.di-card{grid-column:span 2;background:#fff;border:1px solid #e5e7eb;border-top:4px solid #4D7C0F;border-radius:10px;padding:20px;box-shadow:0 4px 14px rgba(63,98,18,.06);}
.di-card:nth-child(4),.di-card:nth-child(5){grid-column:span 3;}
.di-card-h{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
.di-ic{width:46px;height:46px;border-radius:10px;background:#F7FEE7;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;}
.di-card h2{font-size:17px;font-weight:800;color:#3F6212;margin:0;line-height:1.3;}
.di-card p{margin:0;font-size:15px;line-height:1.6;color:#1f2937;}
.di-card .di-hi-text{margin-top:8px;color:#475569;font-size:14.5px;}
.di-cta{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;margin-top:18px;background:#F7FEE7;border:1px solid #ECFCCB;border-radius:10px;padding:20px 24px;}
.di-cta h2{font-size:19px;font-weight:800;color:#3F6212;margin:0 0 4px;}
.di-cta p{margin:0;font-size:14px;color:#475569;}
.di-cta-btn{background:#4D7C0F;color:#fff;border:0;border-radius:8px;padding:14px 22px;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(77,124,15,.25);}
.di-cta-btn:hover{background:#3F6212;}
@media(max-width:900px){.di-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.di-card,.di-card:nth-child(4),.di-card:nth-child(5){grid-column:span 1;}.di-card:nth-child(5){grid-column:1/-1;}}
@media(max-width:600px){.di-grid{grid-template-columns:1fr;}.di-card:nth-child(5){grid-column:auto;}.di-cta-btn{width:100%;}}
`;

/* Dedicated News & Updates page (same notifications API as the home news card) */
function NewsPage() { 
  /*
  const [items, setItems] = useState([]); 
  const [loading, setLoading] = useState(true); 
  useEffect(() => { 
    ...
  }, []); 
  */

  return ( 
    <div className="nw-page"> 
    <style>
    {
      ` .nw-page{
          background:#f3f6fb;
          min-height:68vh;
          font-family:'Segoe UI',sans-serif;
        }
           .nw-main{
          width:92%;
          max-width:1400px;
          margin:0 auto;
          padding:44px 0 120px;
        }
           .nw-h{
          color:#3F6212;
          font-size:30px;
          font-weight:800;
          margin:0 0 22px;
        }

        @media(max-width:600px){
          .nw-main{
            padding:28px 0 120px;
          }

          .nw-h{
            font-size:24px;
          }
        }

      `
    }
    </style>
      
      <main className="nw-main"> 
        <h1 className="nw-h">News &amp; Updates</h1> 
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
          <NlNewsAccordion />
        </div>
      </main> 
    </div> 
  ); 
}
  /*const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const r = await notificationsAPI.getAll();
        const list = r.success && r.data ? r.data.notifications || [] : [];
        setItems(dedupeNotifications(list));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);*/
 {/* return (
    <div className="nw-page">
      <style>{`
        .nw-page{background:#f3f6fb;min-height:68vh;font-family:'Segoe UI',sans-serif;}
        .nw-main{width:92%;max-width:1400px;margin:0 auto;padding:44px 0 72px;}
        .nw-h{color:#3F6212;font-size:30px;font-weight:800;margin:0 0 22px;}
        .nw-list{display:grid;gap:12px;}
        .nw-item{background:#fff;border:1px solid #e5e7eb;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.04);padding:16px 20px;display:flex;justify-content:space-between;align-items:center;gap:14px;}
        .nw-t{font-size:15px;font-weight:600;color:#1f2937;}
        .nw-s{font-size:12px;color:#64748b;margin-top:3px;}
        .nw-link{color:#4D7C0F;font-weight:600;font-size:13px;text-decoration:none;white-space:nowrap;}
        .nw-link:hover{text-decoration:underline;}
        .nw-empty{background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:28px 18px;color:#64748b;font-style:italic;text-align:center;}
        @media(max-width:600px){.nw-main{padding:28px 0 48px;}.nw-h{font-size:24px;}.nw-item{flex-direction:column;align-items:flex-start;}}
      `}</style>
      <main className="nw-main">
        <h1 className="nw-h">News &amp; Updates</h1>*/}
        {/*{loading ? (
          <div className="nw-empty">Loading...</div>
        ) : items.length === 0 ? (
          <div className="nw-empty">No recent news available.</div>
        ) : (
          <div className="nw-list">
            {items.map((item, index) => (
              <article className="nw-item" key={item._id || index}>
                <div>
                  <div className="nw-t">{item.title}</div>
                  {(item.notificationDate || item.createdAt) && (
                    <div className="nw-s">{new Date(item.notificationDate || item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  )}
                  {item.description && <div className="nw-s">{item.description}</div>}
                </div>
                {item.url && <a className="nw-link" href={item.url} target="_blank" rel="noopener noreferrer">Read more →</a>}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}*/}

export default function JSSAbhiyan({ children }) {
  const routerNavigate = useNavigate();
  const location = useLocation();
  // Other pages (e.g. job detail) pass children to reuse this header/footer.
  const activePage = children ? "other" : PATH_TO_PAGE[location.pathname] || "home";

  const { landingConfig, loadingConfig } = useLandingConfig();
  const [language, setLanguage] = useState("en");

  const navigate = (page) => {
    const path = PAGE_TO_PATH[page] || "/";
    routerNavigate(path);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (activePage) {
      case "about":
        return <AboutPage onNavigate={navigate} />;
      case "feeds":
        return <FeedsPage />;
      case "membership":
        return <MembershipPage />;
      case "services":
        return <ServicesPage />;
      case "news":
        return <NewsPage />;
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
      case "privacy":
        return <PrivacyPolicy />;
      case "refund":
        return <RefundPage />;
      case "terms":
        return <TermsPage />;
      case "enquiry":
        return <EnquiryPage />;
      case "donate":
        return <DonatePage language={language} onNavigate={navigate} />;
      case "donateInfo":
        return <DonateInfoPage onNavigate={navigate} />;
      default:
        return <NewHomePage onNavigate={navigate} landingConfig={landingConfig} socialLinks={socialLinks} language={language} />;
    }
  };

  const socialLinks = [
    {
      label: "Facebook",
      bg: "#1877F2",
      url: landingConfig?.socialMedia?.facebook || "https://www.facebook.com/",
      content: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
        </svg>
      ),
    },
    {
      label: "Instagram",
      bg: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
      // url temporarily disabled — icon stays visible, link does nothing
      // url: landingConfig?.socialMedia?.instagram || "https://www.instagram.com/jssabhiyan8/?hl=en",
      content: (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
    {
      label: "YouTube",
      bg: "#FF0000",
      // url temporarily disabled — icon stays visible, link does nothing
      // url: landingConfig?.socialMedia?.youtube || "https://www.youtube.com/@janswasthyasahayataabhiyan8183",
      content: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
          <path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z" />
        </svg>
      ),
    },
    {
      label: "LinkedIn",
      bg: "#0A66C2",
      url: landingConfig?.socialMedia?.linkedin || "https://www.linkedin.com/in/jss-abhiyan-3872b13b7/",
      content: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
          <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.27c-.97 0-1.75-.79-1.75-1.76s.78-1.76 1.75-1.76 1.75.79 1.75 1.76-.78 1.76-1.75 1.76zm13.5 12.27h-3v-5.6c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96v5.7h-3v-11h2.88v1.5h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.6v6.46z" />
        </svg>
      ),
    },
    {
      label: "X",
      bg: "#000000",
      url: landingConfig?.socialMedia?.x || "https://x.com",
      content: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="nl-dashboard-home"
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        color: "#333",
        background: "#fff",
        overflowX: "hidden",
        margin: 0,
        padding: 0,
      }}
    >
      <style>{`.nl-dashboard-home > .tb-topbar,.nl-dashboard-home > .green-divider,.nl-dashboard-home > .hdr-desktop,.nl-dashboard-home > .hdr-mobile,.nl-dashboard-home > nav,.nl-dashboard-home > footer{display:none!important;}`}</style>
      {/* Top Bar */}
      <NewHeader onNavigate={navigate} socialLinks={socialLinks} language={language} onLanguageChange={setLanguage} activePage={activePage} />
      <div
        className="tb-topbar"
        style={{
          background: GREEN,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          gap: 8,
          height: "32px",
          flexWrap: "nowrap",
          position: "relative",
        }}
      >
        {/* LEFT: Phone + Email */}
        <div
          className="tb-left"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexShrink: 0,
            marginLeft: "10%",
          }}
        >
          <span
            className="tb-phone"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#000",
              fontSize: 16,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="2"
            >
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
            </svg>
            {landingConfig?.contactUs?.phones?.[0] || "9471987611"}
          </span>
          <span
            className="tb-email"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#000",
              fontSize: 16,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="2"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 7l10 7 10-7" />
            </svg>
            {landingConfig?.contactUs?.emails?.[0] || "support@jssabhiyan.com"}
          </span>
        </div>

        {/* CENTER: Search bar */}
        {/* <div
          className="tb-search"
          style={{
            position: "absolute",
            left: "58%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <input
            style={{
              borderRadius: 0,
              padding: "4px 28px 4px 10px",
              fontSize: 15,
              fontWeight: 600,
              border: "0.5px solid #000",
              background: "#fff",
              color: "#333",
              width: 200,
              height: 42,
            }}
            placeholder="Type and hit enter..."
          />
          <svg
            style={{ position: "absolute", right: 8 }}
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#333"
            strokeWidth="2.8"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div> */}

        {/* RIGHT: Download button removed temporarily */}
      </div>

      {/* Green Divider Bar */}
      <div
        className="green-divider"
        style={{
          width: "100%",
          height: "8px",
          background: GREEN,
          position: "relative",
          boxShadow: "0 2px 8px rgba(10, 202, 0, 0.3)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "100%",
            background: `linear-gradient(to bottom, rgba(10, 202, 0, 0.1) 0%, ${GREEN} 50%, rgba(10, 202, 0, 0.1) 100%)`,
            filter: "blur(2px)",
          }}
        />
      </div>

      {/* Desktop Header */}
      <div
        className="hdr-desktop"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 24px",
          background: "#fff",
          borderBottom: "1px solid #eee",
          minHeight: 150,
        }}
      >
        {/* LEFT: Logo */}
        <button
          onClick={() => navigate("home")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginLeft: "8%",
          }}
        >
          <img
            src={logo}
            alt="JSS Logo"
            style={{
              height: 155,
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        </button>

        {/* RIGHT: Buttons + Swachh Bharat + Social */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "space-between",
            paddingTop: 0,
            paddingBottom: 14,
            gap: 14,
            marginRight: "6%",
          }}
        >
          {/* Row 1: LOGIN + BROUCHERS */}
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              marginTop: -8,
            }}
          >
            <a
              href="https://account.jssabhiyan.com/login"
              className="login-blink"
              style={{
                background: "#e53e3e",
                color: "#fff",
                fontWeight: 900,
                fontSize: 18,
                padding: "12px 50px",
                borderRadius: 4,
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-block",
                letterSpacing: "0.04em",
                lineHeight: 1.3,
              }}
            >
              LOGIN
            </a>
            {/* <a
              href={brochurePDF}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: GREEN,
                color: "white",
                fontWeight: 900,
                fontSize: 18,
                padding: "12px 50px",
                borderRadius: 4,
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-block",
                letterSpacing: "0.04em",
                lineHeight: 1.3,
              }}
            >
              BROCHURES
            </a> */}
          </div>
          {/* Row 2: Swachh Bharat + Social */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: -8,
            }}
          >
            <img
              src={swachhBharat}
              alt="Swachh Bharat"
              style={{ height: 68, width: "auto", objectFit: "contain" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              {socialLinks.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon-btn"
                  style={{
                    background: s.bg,
                    borderRadius: 6,
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    flexShrink: 0,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
                  }}
                >
                  {s.content}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div
        className="hdr-mobile"
        style={{
          display: "none",
          flexDirection: "column",
          background: "#fff",
          borderBottom: "1px solid #eee",
          padding: "8px 10px",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            width: "100%",
          }}
        >
          <button
            onClick={() => navigate("home")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src={logo}
              alt="JSS Logo"
              style={{
                height: 50,
                width: "auto",
                objectFit: "contain",
                display: "block",
                marginTop: 16,
              }}
            />
          </button>
          <div
            style={{
              display: "flex",
              gap: 6,
              flexShrink: 0,
              alignItems: "center",
            }}
          >
            <a
              href="https://account.jssabhiyan.com/login"
              className="login-blink"
              style={{
                background: "#e53e3e",
                color: "#fff",
                fontWeight: 700,
                fontSize: 11,
                padding: "6px 12px",
                borderRadius: 4,
                textDecoration: "none",
                display: "inline-block",
                whiteSpace: "nowrap",
                lineHeight: 1.3,
                letterSpacing: "0.02em",
              }}
            >
              LOGIN
            </a>

          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
            width: "100%",
          }}
        >
          <img
            src={swachhBharat}
            alt="Swachh Bharat"
            style={{
              height: 28,
              width: "auto",
              objectFit: "contain",
              flexShrink: 0,
            }}
          />
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {socialLinks.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: s.bg,
                  borderRadius: 5,
                  width: 26,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  flexShrink: 0,
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                }}
              >
                <span
                  style={{
                    transform: "scale(0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {s.content}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Nav Bar */}
      <nav
        style={{
          background: GREEN,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <ul
          className="nav-list"
          style={{ display: "flex", margin: 0, padding: 0, listStyle: "none" }}
        >
          {navLinks.map((item, i) => (
            <li key={i} className="nav-item">
              <button
                onClick={() => navigate(item.page)}
                className="nav-btn"
                style={{
                  display: "block",
                  color: "#000",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  textAlign: "center",
                  background: "transparent",
                  border: "none",
                  borderRight:
                    i < navLinks.length - 1
                      ? "1px solid rgba(255,255,255,0.2)"
                      : "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  outline: "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {children || renderPage()}
      <FloatingButtons />
      <div>
        <LandingFooter landingConfig={landingConfig} socialLinks={socialLinks} language={language} onNavigate={navigate} activePage={activePage} />
      </div>

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
                { label: "About Us", page: "about" },
                { label: "MemberShip & Benifits", page: "membership" },
                { label: "View Jobs & Carrier", page: "jobs" },
                { label: "View Our Services", page: "services" },
                { label: "Our Privacy Policy", page: "privacy" },
                { label: "Refund & Cancellation", page: "refund" },
                { label: "Terms & Condition", page: "terms" },
              ].map((l, i) => (
                <li key={i}>
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
              {loadingConfig ? (
                <>
                  <div className="ft-skeleton" style={{ width: '180px', height: '18px', marginBottom: '10px' }}></div>
                  <div className="ft-skeleton" style={{ width: '180px', height: '18px', marginBottom: '10px' }}></div>
                  <div className="ft-skeleton" style={{ width: '210px', height: '18px', marginBottom: '10px' }}></div>
                </>
              ) : (
                <>
                  {landingConfig?.contactUs?.phones?.map((phone, idx) => (
                    <div className="ft-contact-item" key={`phone-${idx}`}>
                      Helpline No.{idx + 1} : {phone}
                    </div>
                  ))}
                  {landingConfig?.contactUs?.emails?.map((email, idx) => (
                    <div className="ft-contact-item" key={`email-${idx}`}>
                      Email : {email}
                    </div>
                  ))}
                </>
              )}
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
            borderTop: "1px solid #3F6212",
            fontWeight: 700,
          }}
        >
          © 2026 Nirmanbharat Assistance Council. All Rights Reserved. Trademark &amp; Brands are
          property of their respective owner.
        </div>
      </footer>

      <style>{`
        html, body, #root { margin: 0 !important; padding: 0 !important; }

        .ft-skeleton {
          background: #3F6212;
          animation: pulse-skeleton 1.5s infinite;
          border-radius: 4px;
        }
        @keyframes pulse-skeleton {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }

        .coming-soon-badge {
          background-color: #2ecc1a;
          color: #000;
          padding: 12px 24px;
          font-weight: 800;
          font-size: 0.95rem;
          box-shadow: 0 8px 24px rgba(46, 204, 26, 0.4);
          border: 2px solid #fff;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-align: center;
          border-radius: 5px;
          line-height: 1.5;
        }

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
        *:focus-visible { outline: 2px solid #4D7C0F !important; outline-offset: 2px; }
        a:focus, button:focus, input:focus, textarea:focus, select:focus, [tabindex]:focus { outline: 2px solid #4D7C0F !important; outline-offset: 2px; }
        nav::-webkit-scrollbar { height: 3px; }
        nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 2px; }

        .hdr-desktop { display: flex !important; }
        .hdr-mobile  { display: none !important; }
        .tb-left     { display: flex !important; }
        .tb-phone    { display: flex !important; }
        .tb-email    { display: flex !important; }
        .tb-search   { display: flex !important; }

        .slider-stats-wrap { display: flex; padding: 12px 100px 24px; background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%); gap: 24px; align-items: stretch; }
        .slider-area  { flex: 0 0 calc(70% - 12px); position: relative; overflow: hidden; min-height: 480px; max-height: 600px; border-radius: 16px; background: #000; border: 4px solid #fff; }
        .stats-area   { flex: 0 0 calc(30% - 12px); display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: transparent; border: none; align-content: center; }
        .stat-cell    { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 16px; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid rgba(0,0,0,0.02); }
        .stat-cell:hover { transform: translateY(-8px); box-shadow: 0 12px 30px rgba(58, 176, 0, 0.15); border-color: rgba(58, 176, 0, 0.3); }
        .stat-content-wrapper { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; width: 100%; text-align: center; }
        .stat-icon-bg { background: rgba(0,0,0,0.03); padding: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: transform 0.3s ease, background 0.3s ease; margin-bottom: 4px; }
        .stat-cell:hover .stat-icon-bg { transform: scale(1.1); background: rgba(58, 176, 0, 0.1); }
        .stat-text-wrap { display: flex; flex-direction: column; align-items: center; text-align: center; }

        .nav-list { width: 100%; }
        .nav-item  { flex: 1; }
        .nav-btn   { width: 100%; font-size: 14px; padding: 14px 4px; color: #000 !important; }

        .notif-cards-desktop { display: flex !important; }
        .notif-cards-mobile  { display: none !important; }

        .stat-num          { font-size: 28px; font-weight: 800; color: #1e293b; line-height: 1.2; font-family: 'Inter', sans-serif; }
        .stat-icon-desktop { display: block; }
        .stat-icon-mobile  { display: none; }
        .stat-label        { font-size: 14px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }

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
          .hdr-mobile  { display: flex !important; flex-direction: column !important; padding: 8px 10px !important; min-height: unset !important; gap: 8px !important; }
          .green-divider { display: none !important; }

          .hdr-mobile > div:first-child { align-items: center !important; }
          .hdr-mobile img[alt="JSS Logo"] { height: 50px !important; }
          .hdr-mobile > div:first-child > div a { font-size: 11px !important; padding: 6px 12px !important; }
          .hdr-mobile img[alt="Swachh Bharat"] { height: 28px !important; }
          .hdr-mobile > div:last-child > div a { width: 26px !important; height: 26px !important; }

          .tb-topbar { flex-wrap: nowrap !important; padding: 4px 6px !important; gap: 4px !important; justify-content: space-between !important; align-items: center !important; height: 36px !important; position: relative !important; width: 100% !important; box-sizing: border-box !important; }
          .tb-left   { display: flex !important; gap: 6px !important; flex-shrink: 0 !important; align-items: center !important; margin-left: 0 !important; }
          .tb-phone  { display: flex !important; font-size: 7px !important; gap: 2px !important; white-space: nowrap !important; flex-shrink: 0 !important; font-weight: 600 !important; color: #000000 !important; align-items: center !important; }
          .tb-phone svg { width: 8px !important; height: 8px !important; stroke: black !important; fill: none !important; flex-shrink: 0 !important; }
          .tb-email  { display: flex !important; font-size: 7px !important; gap: 2px !important; white-space: nowrap !important; flex-shrink: 0 !important; font-weight: 600 !important; color: #000000 !important; align-items: center !important; }
          .tb-email svg { width: 8px !important; height: 8px !important; flex-shrink: 0 !important; stroke: black !important; fill: none !important; }
          .tb-search { position: absolute !important; left: 55% !important; transform: translateX(-50%) !important; display: flex !important; align-items: center !important; }
          .tb-search input { width: 80px !important; font-size: 7px !important; padding: 2px 18px 2px 5px !important; height: 22px !important; font-weight: 500 !important; border: 1px solid #000000 !important; border-radius: 3px !important; }
          .tb-search svg { width: 10px !important; height: 10px !important; right: 4px !important; position: absolute !important; pointer-events: none !important; }
          .tb-dl-btn { font-size: 6px !important; padding: 3px 5px !important; white-space: nowrap !important; flex-shrink: 0 !important; height: 22px !important; font-weight: 700 !important; border-radius: 3px !important; margin-right: 0 !important; }

          @media (max-width: 360px) {
            .tb-topbar { padding: 3px 4px !important; height: 30px !important; }
            .tb-left { gap: 4px !important; }
            .tb-phone { font-size: 6px !important; }
            .tb-phone svg { width: 7px !important; height: 7px !important; }
            .tb-email { font-size: 6px !important; }
            .tb-email svg { width: 7px !important; height: 7px !important; }
            .tb-search input { width: 60px !important; font-size: 6px !important; height: 18px !important; }
            .tb-search svg { width: 9px !important; height: 9px !important; }
            .tb-dl-btn { font-size: 5px !important; padding: 2px 4px !important; height: 18px !important; }
            .hdr-mobile { padding: 6px 8px !important; gap: 6px !important; }
            .hdr-mobile img[alt="JSS Logo"] { height: 45px !important; }
            .hdr-mobile > div:first-child > div a { font-size: 10px !important; padding: 5px 10px !important; }
            .hdr-mobile img[alt="Swachh Bharat"] { height: 24px !important; }
            .hdr-mobile > div:last-child > div a { width: 24px !important; height: 24px !important; }
            .nav-btn { font-size: 5.5px !important; padding: 5px 1px !important; }
          }

          .slider-stats-wrap { background: none !important; display: flex !important; flex-direction: row !important; min-height: unset !important; align-items: stretch !important; justify-content: flex-start !important; padding: 0 !important; gap: 0 !important; width: 100% !important; overflow: hidden !important; }
          .slider-area { border: none !important; box-shadow: none !important; flex: 0 0 55% !important; width: 55% !important; height: 200px !important; min-height: 200px !important; max-height: 200px !important; border-radius: 0 !important; background: #000 !important; }
          .stats-area  { gap: 0 !important; flex: 0 0 45% !important; width: 45% !important; display: grid !important; grid-template-columns: 1fr 1fr !important; border-left: 1px solid #eee !important; border-top: none !important; background: #fff !important; height: 200px !important; }
          .stat-cell   { transform: none !important; box-shadow: none !important; border: none !important; background: #fff !important; border-radius: 0 !important; padding: 4px 2px !important; border-bottom: 1px solid #eee !important; border-right: 1px solid #eee !important; gap: 1px !important; align-items: center !important; justify-content: center !important; }
          .stat-cell:hover { transform: none !important; box-shadow: none !important; border-color: #eee !important; background: #fff !important; }
          .stat-cell:nth-child(2), .stat-cell:nth-child(4) { border-right: none !important; }
          .stat-cell:nth-child(3), .stat-cell:nth-child(4) { border-bottom: none !important; }
          .stat-content-wrapper { flex-direction: row !important; gap: 4px !important; justify-content: flex-start !important; text-align: left !important; }
          .stat-icon-bg { padding: 0 !important; background: transparent !important; margin-bottom: 0 !important; }
          .stat-cell:hover .stat-icon-bg { transform: none !important; background: transparent !important; }
          .stat-text-wrap { align-items: flex-start !important; text-align: left !important; }

          .nav-list { width: 100% !important; flex-wrap: nowrap !important; display: flex !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
          .nav-item  { flex: 1 1 0 !important; min-width: fit-content !important; }
          .nav-btn   { font-size: 6px !important; padding: 6px 2px !important; width: 100% !important; text-align: center !important; letter-spacing: 0 !important; white-space: nowrap !important; color: #000 !important; font-weight: 700 !important; }

          .notif-cards-desktop { display: none !important; }
          .notif-cards-mobile  { display: flex !important; flex-direction: column !important; padding: 20px 14px !important; width: 100% !important; box-sizing: border-box !important; align-items: stretch !important; margin-top: 0 !important; }

          .stat-num          { font-size: 10px !important; font-weight: 700 !important; font-family: inherit !important; color: #1a1a1a !important; line-height: 1.2 !important; }
          .stat-icon-desktop { display: none !important; }
          .stat-icon-mobile  { display: block !important; }
          .stat-label        { font-size: 7px !important; font-weight: 600 !important; text-transform: none !important; letter-spacing: 0 !important; margin-top: 0 !important; color: #333 !important; }

          .notice-app-wrap { padding: 20px 0 0 !important; }
          .notice-app-inner { padding: 0 14px !important; }
          .action-btns-row { flex-direction: row !important; gap: 5px !important; margin-bottom: 16px !important; padding: 0 !important; }
          .action-btn { font-size: 9px !important; padding: 10px 3px !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; width: auto !important; border-radius: 5px !important; text-align: center !important; }
          .app-imgs-row { flex-direction: row !important; gap: 6px !important; align-items: flex-end !important; padding: 0 !important; }
          .coming-soon-badge { padding: 4px 6px !important; font-size: 0.45rem !important; letter-spacing: 0 !important; line-height: 1.1 !important; box-shadow: 0 4px 12px rgba(46, 204, 26, 0.3) !important; border-width: 1px !important; }
          .app-img-wrapper { width: 31% !important; max-width: unset !important; }
          .app-img { width: 100% !important; }

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

          .intro-inner { flex-direction: row !important; gap: 16px !important; }
          .intro-section { padding: 20px 0 !important; }
          .intro-container { padding: 0 10px !important; }
          .intro-col { width: 50% !important; flex: 1 !important; }
          .intro-heading { font-size: 10px !important; margin-bottom: 8px !important; line-height: 1.4 !important; }
          .intro-section .body-text { font-size: 8px !important; line-height: 1.6 !important; margin-bottom: 10px !important; }
          .intro-section .read-btn { font-size: 8px !important; text-decoration: underline !important; }

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
