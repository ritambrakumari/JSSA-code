import { useState } from "react";

export default function VerificationPage() {
  const [candidateId, setCandidateId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

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
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Mukta', sans-serif",
        padding: "40px 20px",
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
