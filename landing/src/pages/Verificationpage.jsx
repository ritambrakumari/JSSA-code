import { useState, useEffect } from "react";
import apiRequest from "../utils/api";

export function CampSlider({ camps, isFullWidth = false }) {
  const [current, setCurrent] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [selectedCamp, setSelectedCamp] = useState(null);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setCurrent(0);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!camps || camps.length === 0) return null;

  const visibleCount = isMobile ? 1 : 4;
  const maxSlide = Math.max(0, camps.length - visibleCount);

  useEffect(() => {
    if (maxSlide <= 0) return;
    const t = setInterval(() => {
      setCurrent((c) => (c >= maxSlide ? 0 : c + 1));
    }, 2500);
    return () => clearInterval(t);
  }, [maxSlide]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: isFullWidth ? "100%" : 860,
        margin: isFullWidth ? "0" : "0 auto 40px",
        position: "relative",
        padding: isFullWidth 
          ? (isMobile ? "16px 10px" : "28px 100px 28px 200px") 
          : (isMobile ? "24px 20px" : "32px 48px"),
        background: isFullWidth ? "#f8f8f8" : "#f0f0f0",
        border: isFullWidth ? "none" : "1px solid #ccc",
        borderRadius: isFullWidth ? 0 : 6,
        boxShadow: isFullWidth ? "none" : "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <h3 style={{ textAlign: "center", marginBottom: 20, color: "#3a7d00", fontSize: "1.2rem", fontWeight: 800 }}>ACTIVE CAMPS / सक्रिय शिविर</h3>
      <div style={{ position: "relative", padding: isFullWidth ? (isMobile ? "0 44px" : "0 36px") : 0 }}>
        <div style={{ overflow: "hidden", padding: "10px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: camps.length < visibleCount ? "center" : "flex-start",
            gap: isMobile ? 4 : 12,
            transform: `translateX(-${current * (100 / visibleCount)}%)`,
            transition: "transform 0.4s ease",
          }}
        >
          {camps.map((camp, i) => {
            let status = { text: "TBD", color: "#f39c12", bg: "#fef5e7" };
            if (camp.campDate) {
              const campDate = new Date(camp.campDate);
              const today = new Date();
              campDate.setHours(0,0,0,0);
              today.setHours(0,0,0,0);
              
              if (campDate > today) {
                status = { text: "Upcoming", color: "#4D7C0F", bg: "#ECFCCB" };
              } else if (campDate.getTime() === today.getTime()) {
                status = { text: "Ongoing", color: "#00b894", bg: "#e8f8f5" };
              } else {
                status = { text: "Completed", color: "#636e72", bg: "#f2f3f4" };
              }
            }

            return (
              <div
                key={i}
                style={{
                  flexShrink: 0,
                  width: `calc(${100 / visibleCount}% - ${isMobile ? 0 : 9}px)`,
                  background: "#fff",
                  border: "1px solid #e0e0e0",
                  borderTop: "4px solid #3a7d00",
                  borderRadius: 8,
                  padding: "16px 16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "left",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  minHeight: 180,
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
                  
                  {/* Top Row: Camp Name & Status Badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.7rem", color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Camp Name</div>
                      <h4 style={{ margin: 0, color: "#111", fontSize: "1.1rem", fontWeight: 800, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{camp.name}</h4>
                    </div>
                    <div style={{ flexShrink: 0, fontSize: "0.7rem", background: status.bg, color: status.color, padding: "4px 10px", borderRadius: 12, fontWeight: 800, textTransform: "uppercase" }}>
                      {status.text}
                    </div>
                  </div>

                  {/* Highlight Row: Date & Organizer */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", background: "#f8f9fa", padding: "10px 12px", borderRadius: 6, border: "1px solid #eee" }}>
                    <div style={{ flex: 1, minWidth: 100 }}>
                      <div style={{ fontSize: "0.65rem", color: "#777", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Camp Date</div>
                      <div style={{ fontSize: "0.85rem", color: "#333", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d9534f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink: 0}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{camp.campDate ? new Date(camp.campDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Date TBD"}</span>
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 80, overflow: "hidden" }}>
                      <div style={{ fontSize: "0.65rem", color: "#777", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Organizer</div>
                      <div style={{ fontSize: "0.85rem", color: "#2e7d32", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink: 0}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{camp.organizer || "JSSA"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Location Details */}
                  <div>
                    <div style={{ fontSize: "0.65rem", color: "#777", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Location Details</div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "#555", fontSize: "0.85rem", lineHeight: 1.4 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2, color: "#3a7d00" }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{camp.district}, {camp.state}</span>
                        </div>
                        {(camp.blockName || camp.panchayatName) && (
                          <div style={{ color: "#666", fontSize: "0.75rem", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {camp.blockName && <span><strong style={{color:"#444"}}>Block:</strong> {camp.blockName}</span>} 
                            {camp.blockName && camp.panchayatName && <span style={{margin: "0 6px", color:"#ccc"}}>|</span>}
                            {camp.panchayatName && <span><strong style={{color:"#444"}}>Panchayat:</strong> {camp.panchayatName}</span>}
                          </div>
                        )}
                        {camp.address && (
                          <div style={{ color: "#777", fontSize: "0.8rem", marginTop: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            <strong style={{color:"#444"}}>Address:</strong> {camp.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* View More Button */}
                  <div style={{ marginTop: "auto", paddingTop: 10 }}>
                    <button 
                      onClick={() => setSelectedCamp(camp)}
                      style={{ width: "100%", background: "#e8f5e9", color: "#3a7d00", border: "1px solid #c8e6c9", padding: "8px", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s" }}
                      onMouseEnter={(e) => { e.target.style.background = "#3a7d00"; e.target.style.color = "#fff"; }}
                      onMouseLeave={(e) => { e.target.style.background = "#e8f5e9"; e.target.style.color = "#3a7d00"; }}
                    >
                      View More
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {current > 0 && maxSlide > 0 && (
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          style={{
            position: "absolute",
            left: isFullWidth ? 0 : (isMobile ? -12 : -32),
            top: "50%",
            transform: "translateY(-50%)",
            background: "#fff",
            borderRadius: "50%",
            border: "2px solid #3a7d00",
            width: isMobile ? 36 : 30,
            height: isMobile ? 36 : 30,
            fontSize: isMobile ? 22 : 18,
            cursor: "pointer",
            color: "#3a7d00",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 3
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
            right: isFullWidth ? 0 : (isMobile ? -12 : -32),
            top: "50%",
            transform: "translateY(-50%)",
            background: "#fff",
            borderRadius: "50%",
            border: "2px solid #3a7d00",
            width: isMobile ? 36 : 30,
            height: isMobile ? 36 : 30,
            fontSize: isMobile ? 22 : 18,
            cursor: "pointer",
            color: "#3a7d00",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 3
          }}
        >
          ›
        </button>
      )}
      {maxSlide > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: isMobile ? 4 : 6,
            marginTop: isMobile ? 12 : 16,
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
                background: i === current ? "#3a7d00" : "#ccc",
                padding: 0,
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>
      )}
      </div>
      {selectedCamp && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setSelectedCamp(null)}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 0, maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative", display: "flex", flexDirection: "column", borderTop: "6px solid #3a7d00", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <div style={{ position: "sticky", top: 0, background: "#fff", zIndex: 10, padding: "20px 24px", borderBottom: "1px solid #eaeaea", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, color: "#3F6212", fontSize: 22, fontWeight: 900, textTransform: "uppercase" }}>Camp Details</h3>
              <button onClick={() => setSelectedCamp(null)} style={{ background: "#f0f0f0", border: "none", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer", color: "#555", transition: "background 0.2s" }} onMouseEnter={(e) => e.target.style.background = "#e0e0e0"} onMouseLeave={(e) => e.target.style.background = "#f0f0f0"}>&times;</button>
            </div>
            
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Section 1: Camp Name */}
              <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: 8, border: "1px solid #eee" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3a7d00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  <strong style={{ color: "#555", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 0.5 }}>Camp Name</strong>
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111", lineHeight: 1.4 }}>{selectedCamp.name}</div>
              </div>
              
              {/* Section 2: Date & Organizer */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: 8, border: "1px solid #eee" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d9534f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <strong style={{ color: "#555", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 0.5 }}>Camp Date</strong>
                  </div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#333" }}>
                    {selectedCamp.campDate ? new Date(selectedCamp.campDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Date TBD"}
                  </div>
                </div>
                
                <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: 8, border: "1px solid #eee" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <strong style={{ color: "#555", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 0.5 }}>Organizer</strong>
                  </div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#333" }}>{selectedCamp.organizer || "JSSA"}</div>
                </div>
              </div>

              {/* Section 3: Location & Address */}
              <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: 8, border: "1px solid #eee" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e67e22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <strong style={{ color: "#555", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 0.5 }}>Location & Address Details</strong>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#777", marginBottom: 4, textTransform: "uppercase", fontWeight: 600 }}>State & District</div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "#222" }}>{selectedCamp.district}, {selectedCamp.state}</div>
                  </div>
                  
                  {(selectedCamp.blockName || selectedCamp.panchayatName) && (
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                      {selectedCamp.blockName && (
                        <div style={{ background: "#fff", padding: "10px 12px", borderRadius: 6, border: "1px solid #e0e0e0" }}>
                          <div style={{ fontSize: "0.75rem", color: "#777", marginBottom: 2, textTransform: "uppercase", fontWeight: 600 }}>Block</div>
                          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#333" }}>{selectedCamp.blockName}</div>
                        </div>
                      )}
                      {selectedCamp.panchayatName && (
                        <div style={{ background: "#fff", padding: "10px 12px", borderRadius: 6, border: "1px solid #e0e0e0" }}>
                          <div style={{ fontSize: "0.75rem", color: "#777", marginBottom: 2, textTransform: "uppercase", fontWeight: 600 }}>Panchayat</div>
                          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#333" }}>{selectedCamp.panchayatName}</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedCamp.address && (
                    <div style={{ background: "#fff", padding: "12px 14px", borderRadius: 6, border: "1px solid #e0e0e0" }}>
                      <div style={{ fontSize: "0.75rem", color: "#777", marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Full Address</div>
                      <div style={{ fontSize: "0.95rem", color: "#333", lineHeight: 1.6, fontWeight: 500 }}>{selectedCamp.address}</div>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function VerificationPage() {
  const [candidateId, setCandidateId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeCamps, setActiveCamps] = useState([]);

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

  const handleSubmit = () => {
    if (!candidateId.trim()) return;
    setLoading(true);
    setSubmitted(false);
    setResult(null);
    setTimeout(() => {
      setLoading(false);
      setResult({
        found: candidateId.length > 3,
        name: "Rajesh Kumar",
        id: candidateId,
        designation: "Health Worker",
        district: "Lucknow",
        status: "Active",
      });
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div
      style={{
        background: "#e8e8e8",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        fontFamily: "'Mukta', sans-serif",
        padding: "80px 20px 40px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700;800;900&family=Tiro+Devanagari+Hindi@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .verify-card {
          background: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 6px;
          padding: 40px 48px 48px;
          width: 100%;
          max-width: 860px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        .verify-title {
          font-size: 1.05rem;
          font-weight: 900;
          color: #111;
          letter-spacing: 0.02em;
          margin-bottom: 14px;
        }
        .verify-title .hindi-part {
          font-family: 'Tiro Devanagari Hindi', serif;
          font-weight: 900;
        }

        .green-line {
          width: 100%;
          height: 2px;
          background: #3a7d00;
          margin-bottom: 28px;
        }

        .field-label {
          font-size: 0.85rem;
          font-weight: 800;
          color: #111;
          margin-bottom: 8px;
          display: block;
        }
        .field-label .hindi-label {
          font-family: 'Tiro Devanagari Hindi', serif;
          font-weight: 700;
        }

        .field-input {
          width: 100%;
          max-width: 520px;
          padding: 11px 16px;
          border: 1.5px solid #ccc;
          border-radius: 5px;
          font-size: 0.9rem;
          font-family: 'Mukta', sans-serif;
          font-weight: 600;
          background: #fff;
          color: #111;
          outline: none;
          display: block;
          transition: border-color 0.2s;
        }
        .field-input::placeholder { color: #aaa; font-weight: 500; }
        .field-input:focus { border-color: #3a7d00; box-shadow: 0 0 0 3px rgba(58,125,0,0.1); }

        .submit-row {
          display: flex;
          justify-content: center;
          margin-top: 28px;
        }

        .submit-btn {
          background: #888;
          color: #fff;
          padding: 12px 48px;
          border: none;
          border-radius: 5px;
          font-size: 0.95rem;
          font-weight: 900;
          cursor: pointer;
          font-family: 'Mukta', sans-serif;
          letter-spacing: 0.06em;
          transition: background 0.2s;
          min-width: 140px;
        }
        .submit-btn:hover { background: #3a7d00; }
        .submit-btn:disabled { background: #aaa; cursor: not-allowed; }

        .result-card {
          margin-top: 28px;
          border-radius: 4px;
          overflow: hidden;
          border: 2px solid #3a7d00;
          animation: fadeUp 0.4s ease;
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

        .result-header {
          background: #3a7d00; color: #fff;
          padding: 12px 20px;
          font-size: 0.83rem; font-weight: 900;
          letter-spacing: 0.06em; text-transform: uppercase;
        }
        .result-body { background: #fff; padding: 20px 24px; }
        .result-row {
          display: flex; padding: 9px 0;
          border-bottom: 1px solid #f0f0f0; font-size: 0.85rem;
        }
        .result-row:last-child { border-bottom: none; }
        .result-key { width: 180px; font-weight: 800; color: #333; flex-shrink: 0; }
        .result-val { color: #111; font-weight: 700; }
        .status-badge {
          display: inline-block; padding: 2px 12px; border-radius: 2px;
          font-size: 0.72rem; font-weight: 900; letter-spacing: 0.07em;
          text-transform: uppercase;
          background: #e8f5e9; color: #1e6000;
          border: 1px solid #4caf50;
        }

        .not-found-card {
          margin-top: 24px; padding: 18px 22px;
          background: #fff5f5; border: 2px solid #c0392b;
          border-radius: 4px; color: #c0392b;
          font-size: 0.88rem; font-weight: 800;
          animation: fadeUp 0.4s ease;
        }

        .loading-dots span {
          display: inline-block; width: 6px; height: 6px; border-radius: 50%;
          background: #fff; margin: 0 2px;
          animation: dot 1.2s ease infinite;
        }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dot { 0%,80%,100%{transform:scale(0.5);opacity:0.35} 40%{transform:scale(1);opacity:1} }
      `}</style>
      
      {activeCamps.length > 0 && <CampSlider camps={activeCamps} />}

      <div className="verify-card">
        <div className="verify-title">
          STAFF VERIFICATION / <span className="hindi-part">स्टाफ सत्यापन</span>{" "}
          :
        </div>
        <div className="green-line" />

        <label className="field-label">
          Candidate Id/<span className="hindi-label">आपका नाम</span> *
        </label>
        <input
          className="field-input"
          type="text"
          value={candidateId}
          onChange={(e) => {
            setCandidateId(e.target.value);
            setSubmitted(false);
            setResult(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Enter Candidate ID or Name"
        />

        <div className="submit-row">
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={loading || !candidateId.trim()}
          >
            {loading ? (
              <span className="loading-dots">
                <span />
                <span />
                <span />
              </span>
            ) : (
              "Submit"
            )}
          </button>
        </div>

        {submitted &&
          result &&
          (result.found ? (
            <div className="result-card">
              <div className="result-header">
                ✅ Verification Successful — सत्यापन सफल
              </div>
              <div className="result-body">
                {[
                  ["Candidate ID", result.id],
                  ["Full Name", result.name],
                  ["Designation", result.designation],
                  ["District", result.district],
                  [
                    "Status",
                    <span className="status-badge">✔ {result.status}</span>,
                  ],
                ].map(([key, val]) => (
                  <div className="result-row" key={key}>
                    <div className="result-key">{key}</div>
                    <div className="result-val">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="not-found-card">
              ❌ No record found for "<strong>{candidateId}</strong>". Please
              check the ID and try again.
            </div>
          ))}
      </div>
    </div>
  );
}
