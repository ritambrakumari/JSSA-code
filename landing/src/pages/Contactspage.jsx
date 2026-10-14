import { useState } from "react";
import { useLandingConfig } from "../context/LandingConfigContext";

export default function ContactsPage() {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    address: "",
    state: "",
    city: "",
    zip: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { landingConfig, loadingConfig: loading } = useLandingConfig();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.name || !form.contact || !form.email) {
      setErrorMsg("Please fill out Name, Contact Number and Email Id.");
      return;
    }
    setErrorMsg("");
    setLoadingSubmit(true);

    try {
      const BASE_URL = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "") 
        : "http://localhost:3005";
        
      const response = await fetch(`${BASE_URL}/api/enquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw new Error("server_error");
      }

      if (!response.ok || (data && data.success === false)) {
        throw new Error((data && data.message) || "server_error");
      }
      
      setSubmitted(true);
      setForm({
        name: "",
        contact: "",
        email: "",
        address: "",
        state: "",
        city: "",
        zip: "",
        message: "",
      });
    } catch (err) {
      console.error("Submit error:", err);
      let userFriendlyMsg = "Oops! Something went wrong on our end. Please try submitting again in a few moments.";
      
      // If the error message comes directly from our backend API validation (e.g. "Name, contact and email are required")
      if (err.message && err.message !== "server_error" && err.message !== "Failed to fetch") {
        userFriendlyMsg = err.message;
      }
      
      setErrorMsg(userFriendlyMsg);
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        background: "#fff",
        minHeight: "100vh",
        color: "#1a1a1a",
      }}
    >
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .touch-section { padding: 48px 100px 36px; background: #fff; max-width: 1400px; margin: 0 auto; }
        .touch-title { text-align: center; font-size: 1.3rem; font-weight: 700; color: #111; margin-bottom: 40px; }

        .offices-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-bottom: 36px;
        }
        .office-block {
          display: flex; gap: 12px; align-items: flex-start;
          padding: 16px; background: #f9f9f9;
          border-radius: 8px; border: 1px solid #e0e0e0;
          transition: all 0.3s ease;
        }
        .office-block:hover { background: #f5f5f5; border-color: #4D7C0F; box-shadow: 0 2px 8px rgba(77,124,15,0.12); }

        .pin-icon { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #4D7C0F; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; background: rgba(77,124,15,0.12); }
        .pin-svg  { width: 14px; height: 14px; fill: none; stroke: #4D7C0F; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

        .office-title { font-size: 0.95rem; font-weight: 800; color: #111; margin-bottom: 6px; }
        .office-addr  { font-size: 0.83rem; color: #444; line-height: 1.6; font-weight: 500; }

        .contact-info-row  { display: flex; gap: 60px; align-items: flex-start; }
        .contact-info-item { display: flex; gap: 12px; align-items: flex-start; }

        .mail-icon  { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #4D7C0F; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .mail-svg   { width: 14px; height: 14px; fill: none; stroke: #4D7C0F; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .phone-icon { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #4D7C0F; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .phone-svg  { width: 14px; height: 14px; fill: none; stroke: #4D7C0F; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .info-text  { font-size: 0.88rem; font-weight: 700; color: #111; line-height: 1.7; }

        .form-outer   { padding: 0 100px; max-width: 1400px; margin: 0 auto; }
        .form-section { background: #f0f0f0; padding: 36px 40px 48px; border-radius: 6px; }
        .form-row     { margin-bottom: 24px; }
        .form-row-2   { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 24px; }
        .form-row-3   { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-bottom: 24px; }

        .field-label { font-size: 0.85rem; font-weight: 700; color: #111; margin-bottom: 6px; display: block; }
        .field-input {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid #ccc; border-radius: 3px;
          font-size: 0.88rem; font-family: 'Segoe UI', Arial, sans-serif;
          font-weight: 500; background: #fff; color: #111; outline: none;
          transition: border-color 0.2s;
        }
        .field-input:focus { border-color: #4D7C0F; box-shadow: 0 0 0 3px rgba(77,124,15,0.12); }
        .field-textarea {
          width: 100%; padding: 12px 14px; min-height: 160px;
          border: 1.5px solid #ccc; border-radius: 3px;
          font-size: 0.88rem; font-family: 'Segoe UI', Arial, sans-serif;
          font-weight: 500; background: #fff; color: #111; outline: none;
          resize: vertical; transition: border-color 0.2s;
        }
        .field-textarea:focus { border-color: #4D7C0F; box-shadow: 0 0 0 3px rgba(77,124,15,0.12); }

        .submit-row { display: flex; justify-content: center; margin-top: 28px; }
        .submit-btn {
          background: #4D7C0F; color: #fff;
          padding: 12px 44px; border: none; border-radius: 5px;
          font-size: 0.88rem; font-weight: 900; letter-spacing: 0.1em;
          text-transform: uppercase; cursor: pointer;
          font-family: 'Segoe UI', Arial, sans-serif;
          transition: background 0.2s, transform 0.1s;
          box-shadow: 0 4px 16px rgba(34,204,0,0.3);
        }
        .submit-btn:hover  { background: #3F6212; }
        .submit-btn:active { transform: scale(0.97); }

        .success-msg { text-align: center; margin-top: 20px; color: #4D7C0F; font-weight: 800; font-size: 0.95rem; animation: fadeIn 0.4s ease; }
        .error-msg { text-align: center; margin-top: 20px; color: #d32f2f; font-weight: 800; font-size: 0.95rem; animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

        /* ── MODALS ── */
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;
          z-index: 9999; animation: fadeInOverlay 0.3s ease;
        }
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
        .modal-box {
          background: #fff; padding: 40px 30px; border-radius: 8px; max-width: 400px; width: 90%;
          text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .modal-icon { width: 70px; height: 70px; margin: 0 auto 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .modal-icon.success { background: #e8f5e2; color: #4D7C0F; border: 3px solid #4D7C0F; }
        .modal-icon.error { background: #ffebee; color: #d32f2f; border: 3px solid #d32f2f; }
        .modal-title { font-size: 1.4rem; font-weight: 800; color: #111; margin-bottom: 12px; }
        .modal-message { font-size: 0.95rem; color: #444; margin-bottom: 30px; font-weight: 500; line-height: 1.5; }
        .modal-btn {
          background: #4D7C0F; color: #fff; padding: 12px 36px; border: none; border-radius: 5px;
          font-size: 0.95rem; font-weight: 800; cursor: pointer; transition: background 0.2s, transform 0.1s;
          letter-spacing: 0.05em;
        }
        .modal-btn:hover { background: #3F6212; }
        .modal-btn:active { transform: scale(0.97); }
        .modal-btn.error-btn { background: #d32f2f; }
        .modal-btn.error-btn:hover { background: #b71c1c; }

        /* ── MOBILE: same layout, just scaled down ── */
        @media (max-width: 768px) {
          .touch-section { padding: 16px 12px 16px; }
          .touch-title   { font-size: 0.85rem; margin-bottom: 14px; }

          .offices-grid  { grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 14px; }
          .office-block  { padding: 7px 6px; gap: 5px; border-radius: 4px; }
          .pin-icon      { width: 16px; height: 16px; flex-shrink: 0; }
          .pin-svg       { width: 8px; height: 8px; }
          .office-title  { font-size: 0.52rem; margin-bottom: 2px; }
          .office-addr   { font-size: 0.46rem; line-height: 1.4; }

          .contact-info-row  { gap: 16px; flex-direction: row; flex-wrap: wrap; }
          .contact-info-item { gap: 5px; }
          .mail-icon, .phone-icon { width: 16px; height: 16px; }
          .mail-svg, .phone-svg   { width: 8px; height: 8px; }
          .info-text { font-size: 0.5rem; line-height: 1.5; }

          .form-outer   { padding: 0 12px; }
          .form-section { padding: 12px 10px 20px; border-radius: 4px; }
          .form-row     { margin-bottom: 10px; }
          .form-row-2   { grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
          .form-row-3   { grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 10px; }

          .field-label    { font-size: 0.55rem; margin-bottom: 3px; }
          .field-input    { padding: 5px 7px; font-size: 0.55rem; border-radius: 2px; }
          .field-textarea { padding: 5px 7px; min-height: 60px; font-size: 0.55rem; border-radius: 2px; }

          .submit-btn { padding: 7px 20px; font-size: 0.6rem; border-radius: 3px; }
          .success-msg { font-size: 0.6rem; margin-top: 10px; }
          .submit-row { margin-top: 12px; }
        }

        .loader-spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #4D7C0F;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 1s linear infinite;
          margin: 40px auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      {/* GET IN TOUCH */}
      <div className="touch-section">
        <div className="touch-title">Get in Touch</div>

        {loading ? (
          <div className="loader-spinner"></div>
        ) : (
          <>
            <div className="offices-grid">
          {landingConfig?.branches?.map((branch) => (
            <div className="office-block" key={branch._id || branch.name}>
              <div className="pin-icon">
                <svg className="pin-svg" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </div>
              <div>
                <div className="office-title">{branch.name}:</div>
                <div className="office-addr">{branch.address}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="contact-info-row" style={{ flexWrap: 'wrap' }}>
          {landingConfig?.contactUs?.emails?.map((email, idx) => (
            <div className="contact-info-item" key={`email-${idx}`}>
              <div className="mail-icon">
                <svg className="mail-svg" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <polyline points="2,4 12,13 22,4" />
                </svg>
              </div>
              <div className="info-text">
                {email}
              </div>
            </div>
          ))}

          {landingConfig?.contactUs?.phones?.map((phone, idx) => (
            <div className="contact-info-item" key={`phone-${idx}`}>
              <div className="phone-icon">
                <svg className="phone-svg" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 6.18 2 2 0 012 4h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 11.91a16 16 0 006.18 6.18l1.27-.78a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <div className="info-text">{phone}</div>
            </div>
          ))}
        </div>
          </>
        )}
      </div>

      {/* FORM */}
      <div className="form-outer">
        <div className="form-section">
          <div className="form-row">
            <label className="field-label">Your Name*</label>
            <input
              className="field-input"
              name="name"
              value={form.name}
              onChange={handleChange}
            />
          </div>
          <div className="form-row-2">
            <div>
              <label className="field-label">Contact Number*</label>
              <input
                className="field-input"
                name="contact"
                value={form.contact}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="field-label">Email Id*</label>
              <input
                className="field-input"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-row">
            <label className="field-label">Full Address*</label>
            <input
              className="field-input"
              name="address"
              value={form.address}
              onChange={handleChange}
            />
          </div>
          <div className="form-row-3">
            <div>
              <label className="field-label">State*</label>
              <input
                className="field-input"
                name="state"
                value={form.state}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="field-label">City/District*</label>
              <input
                className="field-input"
                name="city"
                value={form.city}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="field-label">Zip/Postal Code*</label>
              <input
                className="field-input"
                name="zip"
                value={form.zip}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-row">
            <label className="field-label">Your Message*</label>
            <textarea
              className="field-textarea"
              name="message"
              value={form.message}
              onChange={handleChange}
            />
          </div>
          <div className="submit-row">
            <button className="submit-btn" onClick={handleSubmit} disabled={loadingSubmit}>
              {loadingSubmit ? "SUBMITTING..." : "SUBMIT"}
            </button>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {submitted && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-icon success">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="modal-title">Success!</div>
            <div className="modal-message">Thank you for getting in touch. Your enquiry has been sent successfully and our team will contact you soon.</div>
            <button className="modal-btn" onClick={() => setSubmitted(false)}>OKAY</button>
          </div>
        </div>
      )}

      {/* ERROR MODAL */}
      {errorMsg && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-icon error">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <div className="modal-title">Oops!</div>
            <div className="modal-message">{errorMsg}</div>
            <button className="modal-btn error-btn" onClick={() => setErrorMsg("")}>TRY AGAIN</button>
          </div>
        </div>
      )}
    </div>
  );
}
