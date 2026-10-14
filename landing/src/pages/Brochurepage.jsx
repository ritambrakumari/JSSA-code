// BrochurePage.jsx
import logo from "../assets/img0.png";

const TEAL = "#1a7a7a";

export default function BrochurePage({ onClose }) {
  return (
    <div
      style={{
        background: "#e8e8e8",
        minHeight: "100vh",
        padding: "32px 16px",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi&display=swap');
        * { box-sizing: border-box; }
        .brochure-wrap { max-width: 820px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
        .page-card { background: #fff; border-radius: 4px; overflow: hidden; position: relative; }
        .teal-header { background: ${TEAL}; color: #fff; padding: 20px 32px; font-size: 1.4rem; font-weight: 800; }
        .teal-label { color: ${TEAL}; font-weight: 700; }
        .hindi { font-family: 'Tiro Devanagari Hindi', serif; }
        .body-text { font-size: 14px; line-height: 1.9; color: #222; }
        .watermark {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 320px; height: 320px; opacity: 0.07;
          pointer-events: none; z-index: 0;
        }
        .bullet-col-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 24px; }
        .bullet-col-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
        .bullet-item { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: #222; line-height: 1.5; }
        .dot { width: 10px; height: 10px; border-radius: 50%; background: ${TEAL}; flex-shrink: 0; margin-top: 4px; }
        .back-btn {
          background: ${TEAL}; color: #fff; border: none; padding: 10px 28px;
          font-size: 14px; font-weight: 700; cursor: pointer; border-radius: 4px;
          display: inline-block;
        }
        .back-btn:hover { background: #155f5f; }
      `}</style>

      <div className="brochure-wrap">
        {/* BACK BUTTON */}
        <div>
          <button className="back-btn" onClick={onClose}>
            ← Back to Home
          </button>
        </div>

        {/* ── PAGE 1 ── Logo Header */}
        <div className="page-card" style={{ padding: 28 }}>
          <div
            style={{
              border: "2.5px solid #2e8b00",
              borderRadius: 12,
              padding: "20px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={logo}
              alt="logo"
              style={{
                width: "80%",
                maxWidth: 480,
                height: "auto",
                objectFit: "contain",
              }}
            />
          </div>
        </div>

        {/* ── PAGE 2 ── Card Front */}
        <div
          className="page-card"
          style={{ background: "#0e8080", padding: "28px 40px" }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: "20px 24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <img src={logo} alt="watermark" className="watermark" />
            {/* Card Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 16,
                position: "relative",
                zIndex: 1,
              }}
            >
              <img
                src={logo}
                alt="logo"
                style={{ width: 80, height: 80, objectFit: "contain" }}
              />
              <div>
                <div
                  style={{
                    color: TEAL,
                    fontWeight: 900,
                    fontSize: 22,
                    letterSpacing: "0.03em",
                  }}
                >
                  JAN SWASTHYA SAHAYTA CARD
                </div>
                <div style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>
                  A Project Of Healthcare Research &amp; Development Board
                </div>
                <div style={{ fontSize: 11, color: "#666" }}>
                  (HRDB is Division of social welfare organization "NAC India")
                </div>
              </div>
            </div>
            {/* Card Body */}
            <div
              style={{
                display: "flex",
                gap: 20,
                alignItems: "flex-start",
                position: "relative",
                zIndex: 1,
              }}
            >
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="member"
                style={{
                  width: 110,
                  height: 130,
                  objectFit: "cover",
                  border: "1px solid #ccc",
                  borderRadius: 2,
                }}
              />
              <div
                style={{
                  fontSize: 14,
                  color: "#111",
                  lineHeight: 2.2,
                  fontWeight: 600,
                }}
              >
                <div>
                  <strong>NAME</strong>&nbsp;&nbsp;: &nbsp;Rahul Rajwanshi
                </div>
                <div>
                  <strong>S/O</strong>&nbsp;&nbsp;&nbsp;&nbsp;: &nbsp;Shri
                  Chandrakant Kumar
                </div>
                <div>
                  <strong>DOB</strong>&nbsp;&nbsp;&nbsp;: &nbsp;15/07/1947
                </div>
                <div>
                  <strong>GENDER</strong>: &nbsp;MALE
                </div>
                <div>
                  <strong>CARD NO.</strong>: &nbsp;JSSA/43/01
                </div>
              </div>
              <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                {/* QR Code SVG */}
                <div
                  style={{
                    width: 80,
                    height: 80,
                    background: "#000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 4,
                  }}
                >
                  <svg viewBox="0 0 21 21" width="70" height="70" fill="white">
                    <rect x="0" y="0" width="9" height="9" />
                    <rect x="12" y="0" width="9" height="9" />
                    <rect x="0" y="12" width="9" height="9" />
                    <rect x="2" y="2" width="5" height="5" fill="#000" />
                    <rect x="14" y="2" width="5" height="5" fill="#000" />
                    <rect x="2" y="14" width="5" height="5" fill="#000" />
                    <rect x="5" y="5" width="1" height="1" fill="white" />
                    <rect x="14" y="5" width="1" height="1" fill="white" />
                    <rect x="5" y="14" width="1" height="1" fill="white" />
                    <rect x="10" y="0" width="1" height="1" />
                    <rect x="10" y="3" width="1" height="1" />
                    <rect x="10" y="6" width="1" height="1" />
                    <rect x="0" y="10" width="1" height="1" />
                    <rect x="3" y="10" width="1" height="1" />
                    <rect x="6" y="10" width="1" height="1" />
                    <rect x="9" y="9" width="3" height="3" />
                    <rect x="12" y="12" width="2" height="2" />
                    <rect x="15" y="12" width="2" height="2" />
                    <rect x="18" y="12" width="2" height="2" />
                    <rect x="12" y="15" width="2" height="2" />
                    <rect x="12" y="18" width="2" height="2" />
                    <rect x="15" y="15" width="2" height="2" />
                    <rect x="18" y="18" width="2" height="2" />
                  </svg>
                </div>
              </div>
            </div>
            {/* Card Footer */}
            <div
              style={{
                marginTop: 16,
                background: "linear-gradient(90deg, #2e8b00 0%, #f5a623 100%)",
                borderRadius: 4,
                padding: "8px 16px",
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                textAlign: "center",
                position: "relative",
                zIndex: 1,
              }}
            >
              website: www.jssabhiyan-nac.in &nbsp;|&nbsp; Email:
              support@jssabhiyan-nac.in
            </div>
          </div>
        </div>

        {/* ── PAGE 3 ── Card Back */}
        <div
          className="page-card"
          style={{ background: "#0e8080", padding: "28px 40px" }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: "20px 24px",
              position: "relative",
              overflow: "hidden",
              minHeight: 260,
            }}
          >
            <img src={logo} alt="watermark" className="watermark" />
            {/* Corner decorations */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: 0,
                height: 0,
                borderLeft: "100px solid #2e8b00",
                borderTop: "70px solid transparent",
                zIndex: 0,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 0,
                height: 0,
                borderRight: "100px solid #f5a623",
                borderTop: "70px solid transparent",
                zIndex: 0,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 0,
                height: 0,
                borderLeft: "60px solid #2e8b00",
                borderBottom: "40px solid transparent",
                opacity: 0.2,
                zIndex: 0,
              }}
            />
            {/* Content */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 14,
                position: "relative",
                zIndex: 1,
              }}
            >
              <img
                src={logo}
                alt="logo"
                style={{ width: 75, height: 75, objectFit: "contain" }}
              />
              <div>
                <div style={{ color: TEAL, fontWeight: 900, fontSize: 20 }}>
                  JAN SWASTHYA SAHAYTA CARD
                </div>
                <div style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>
                  A Project Of Healthcare Research &amp; Development Board
                </div>
                <div style={{ fontSize: 11, color: "#666" }}>
                  (HRDB is Division of social welfare organization "NAC India")
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 12,
                    color: "#222",
                    marginTop: 4,
                  }}
                >
                  MEMBERSHIP'S BENIFITS / सदस्यता का सुविधा
                </div>
              </div>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#333",
                lineHeight: 1.8,
                textAlign: "center",
                maxWidth: 580,
                margin: "0 auto",
                position: "relative",
                zIndex: 1,
                paddingBottom: 48,
              }}
            >
              <strong>Benefits :</strong> Jan Swasthya sahayata card is provided
              by the ogranization to each members associated under the jan
              Swasthya Sahayata Abhiyan. And through this card, you will get
              better treatment by special doctor, medicines and medical
              examination in the health camp organized by the organization and
              as per the need, financial assistance and health related
              assistance will be provided.
              <br />
              <br />
              <span className="hindi">
                सुविधा : जन स्वास्थ्य सहायता अभियान के अंतगर्त जुड़े प्रत्येक
                सदस्य को संस्था द्वारा एक जन स्वास्थ्य सहायता कार्ड प्रदान किया
                जाता है और इस कार्ड के माध्यम से आपको संस्था द्वारा आयोजत
                स्वास्थ्य शिविर में विशेष चिकित्सक द्वारा बेहतर इलाज, दवाईयां
                एवं चिकिसा जांच करायी जायेगी तथा आवश्यकता अनुसार तक की आर्थिक
                सहायता एवं स्वास्थ्य संबंधी सहायता प्रदान की जायेगी।
              </span>
            </p>
          </div>
        </div>

        {/* ── PAGE 4 ── About Us */}
        <div className="page-card">
          <div style={{ position: "relative", overflow: "hidden" }}>
            <img
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&q=80"
              alt="about"
              style={{
                width: "100%",
                height: 280,
                objectFit: "cover",
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: TEAL,
                padding: "16px 28px",
              }}
            >
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 22 }}>
                ABOUT US /{" "}
              </span>
              <span
                className="hindi"
                style={{ color: "#fff", fontWeight: 900, fontSize: 22 }}
              >
                हमारे बारे में
              </span>
            </div>
          </div>
          <div
            style={{
              padding: "28px 36px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <img src={logo} alt="watermark" className="watermark" />
            <div
              style={{
                textAlign: "center",
                marginBottom: 20,
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  color: TEAL,
                  fontWeight: 900,
                  fontSize: 20,
                  letterSpacing: "0.04em",
                }}
              >
                JAN SWASTHYA SAHAYTA ABHIYAN
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#333",
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                A Project Of Healthcare Research &amp; Development Board
              </div>
              <div style={{ fontSize: 13, color: "#555" }}>
                (HRDB is Division Of Social Welfare Organisation "NAC India")
              </div>
              <hr
                style={{
                  margin: "16px auto",
                  width: "60%",
                  borderColor: "#ccc",
                  border: "none",
                  borderTop: "1px solid #ccc",
                }}
              />
            </div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <p className="body-text" style={{ marginBottom: 14 }}>
                <span className="teal-label">Introduction : </span>
                Jan Swasthya Sahayata Abhiyan has been formed by the Healthcare
                Research and Development Board (Division of Social Welfare
                Organization "Nac India") to provide affordable, free &amp;
                better treatment with health related assistance to poor and
                needy people.
              </p>
              <p className="body-text" style={{ marginBottom: 14 }}>
                <span className="teal-label">Purpose : </span>
                To provide better treatment by special doctors, medicines and
                medical tests to the poor and needy people of the country
                through Jan Swasthya Sahayata Abhiyan, Also motivating people to
                follow the guidelines given by the government to stay safe from
                COVID 19 by organizing awareness programs and providing health
                related support as well as providing yoga and exercise training.
              </p>
              <p className="body-text hindi" style={{ marginBottom: 14 }}>
                <span className="teal-label">परिचय : </span>
                जन स्वास्थ्य सहायता अभियान का गठन हेल्थकेयर रिसर्च एंड डेवलपमेंट
                बोर्ड (Division Of Social Welfare Organization "NAC India")
                द्वारा किया गया है जो सस्ती, निःशुल्क एवं बेहेतर इलाज तथा गरीब
                एवं जरतमंद लोगों को स्वास्थ्य संबधत सहायता मुहैया करवाने के लिए
                किया गया है।
              </p>
              <p className="body-text hindi">
                <span className="teal-label">उद्देश्य : </span>
                जन स्वास्थ्य सहायता अभियान के माध्यम से देश के गरीब और जरूरतमंद
                लोगों को विशेष चिकित्सकों द्वारा बेहतर उपचार, दवाएं और चिकित्सा
                परीक्षण प्रदान करना, साथ ही जागरूकता कार्यक्रम आयोजित करके कोविड
                से सुरक्षित रहने के लिए सरकार द्वारा दिए गए दिशानिर्देशों का
                पालन करने के लिए प्रेरित करना तथा योग एवं व्यायाम प्रशिक्षण
                प्रदान करना।
              </p>
            </div>
          </div>
        </div>

        {/* ── PAGE 5 ── Services */}
        <div className="page-card" style={{ padding: "0 0 32px" }}>
          <div style={{ position: "relative", overflow: "hidden" }}>
            <img src={logo} alt="watermark" className="watermark" />
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "28px 0 24px",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  background: TEAL,
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 22,
                  padding: "16px 60px",
                  borderRadius: 4,
                  textAlign: "center",
                }}
              >
                SERVICES / <span className="hindi">सेवाएं</span>
              </div>
            </div>
            <div
              style={{
                padding: "8px 40px 24px",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  color: TEAL,
                  fontWeight: 900,
                  fontSize: 15,
                  marginBottom: 16,
                }}
              >
                HEALTH CHECKUP PACKAGES /{" "}
                <span className="hindi">स्वास्थ्य जांच पैकेज</span>
              </div>
              <div className="bullet-col-3">
                {[
                  "FULL BODY CHECKUP",
                  "D-DIMER",
                  "C-REACTIVE PROTEIN (CRP)",
                  "KIDNEY PROFILE",
                  "CBC / HEMOGRAM",
                  "LIVER FUNCTION TESTS (LFT)",
                  "FERRITIN",
                  "MASTER HEALTH CHECKUP",
                  "Immunity Profile",
                  "Infection Checkup Profile",
                  "CBC-CRP COMBO",
                  "CRP-CBC-D-DIMER COMBO",
                  "CBC-CRP-LDH-FERR-D-DIMER-IL6",
                  "Woman Wellness Profile",
                  "Food Intolerance Profile",
                  "Complete Vitamins Profile++",
                  "Covid Antibody Packages",
                  "Post Covid Checkup Packages",
                  "Women Health Checkup Packages",
                  "HealthyLife Packages",
                  "Wellness Packages",
                  "Full Body Health Checkup",
                  "Senior Citizen Health Checkup",
                  "and, More Other Checkups",
                ].map((item, i) => (
                  <div className="bullet-item" key={i}>
                    <div className="dot" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: "0 40px", position: "relative", zIndex: 1 }}>
              <div
                style={{
                  color: TEAL,
                  fontWeight: 700,
                  fontSize: 14,
                  marginBottom: 14,
                }}
              >
                Medicines and doctor's consultation for the following diseases /{" "}
                <span className="hindi">
                  निम्नलिखित बीमारियों के लिए दवाएं और डॉक्टर का परामर्श
                </span>
              </div>
              <div className="bullet-col-2">
                {[
                  "Heart Disease",
                  "Cancer",
                  "Unintentional Injuries",
                  "Chronic Lower Respiratory Disease",
                  "Stroke and Cerebrovascular Diseases",
                  "Alzheimer's Disease",
                  "Diabetes",
                  "Influenza and Pneumonia",
                  "Kidney Disease",
                  "Stomach Problems",
                  "Lever Problems",
                  "Allergies",
                  "Colds and Flu",
                  `Conjunctivitis ("Pink Eye")`,
                  "Diarrhea",
                  "Headaches",
                  "Mononucleosis",
                  "Stomach Aches",
                  "Covid 19",
                  "and, More Other Diseases",
                ].map((d, i) => (
                  <div className="bullet-item" key={i}>
                    <div className="dot" />
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── PAGE 6 ── Membership & Benefits */}
        <div className="page-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="teal-header">
            Membership &amp; Benefits /{" "}
            <span className="hindi">सदस्यता एवं सुविधा</span>
          </div>
          <div
            style={{
              padding: "24px 40px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <img src={logo} alt="watermark" className="watermark" />
            <div style={{ position: "relative", zIndex: 1 }}>
              <p className="body-text" style={{ marginBottom: 14 }}>
                <span className="teal-label">Membership : </span>
                Any citizen of the country whose minimum age is 18 years can get
                membership under Jan Swasthya Sahayata Abhiyan. Documents
                required to take membership: Aadhar card, PAN card and photocopy
                of ration card and membership fee are necessary.
              </p>
              <p className="body-text hindi" style={{ marginBottom: 20 }}>
                <span className="teal-label">सदस्यता : </span>
                देश के कोई भी नागरिक जिसकी न्यूनतम आयु 18 वर्ष है, वो जन
                स्वास्थ्य सहायता अभियान के अंतगर्त सदस्यता प्राप्त कर सकते है।
                सदस्यता लेने के लिए जरूरी दतावेजे आधारकाड, पैनैकाड तथा राशन
                कार्ड की छायाप्रत एवं सदस्यता शुल्क जरूरी है।
              </p>
              <p className="body-text" style={{ marginBottom: 14 }}>
                <span className="teal-label">Benefits : </span>
                Jan Swasthya Sahayata card is provided by the organization to
                each member associated under the Jan Swasthya Sahayata Abhiyan.
                And through this card, you will get better treatment by special
                doctor, medicines and medical examination in the health camp
                organized by the organization and as per the need, financial
                assistance and health related assistance will be provided up to
                ₹ 6500.
              </p>
              <p className="body-text hindi">
                <span className="teal-label">सुविधा : </span>
                जन स्वास्थ्य सहायता अभियान के अंतगर्त जुड़े प्रत्येक सदस्य को
                संस्था द्वारा एक जन स्वास्थ्य सहायता कार्ड प्रदान किया जाता है
                और इस कार्ड के माध्यम से आपको संस्था द्वारा आयोजत स्वास्थ्य
                शिविर में विशेष चिकित्सक द्वारा बेहतर इलाज, दवाईयां एवं चिकिसा
                जांच करायी जायेगी तथा आवश्यकता अनुसार ₹6500 तक की आर्थिक सहायता
                एवं स्वास्थ्य संबंधी सहायता प्रदान की जायेगी।
              </p>
            </div>
          </div>
        </div>

        {/* ── PAGE 7 ── Terms & Conditions Part 1 */}
        <div className="page-card" style={{ padding: 0 }}>
          <div className="teal-header">
            Membership &amp; Benefits /{" "}
            <span className="hindi">सदस्यता एवं सुविधा</span>
          </div>
          <div
            style={{
              padding: "24px 40px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <img src={logo} alt="watermark" className="watermark" />
            <div style={{ position: "relative", zIndex: 1 }}>
              <p
                className="teal-label"
                style={{ marginBottom: 18, fontSize: 15 }}
              >
                Terms and Conditions For Members :
              </p>
              {[
                "The person should be above 18 years to be active member of this organization and without any criminal background.",
                "The Person should be physically and mentally strong (special person define first) and willing to work for the organization individually or in the group and travel at his own expense.",
                "A person is selected and can be removed and take legal action by the chairman and core group without notice or giving reason for wrong information, misconduct, misbehaviour, indiscipline.",
                "The member is willing to work and obey the chairman and core group.",
                "The member will give his best efforts to full fill objective and task assigned to him or her.",
              ].map((term, i) => (
                <p
                  key={i}
                  className="body-text"
                  style={{ marginBottom: 14, paddingLeft: 4 }}
                >
                  <strong>{i + 1})</strong>&nbsp; {term}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* ── PAGE 8 ── Terms & Conditions Part 2 */}
        <div className="page-card" style={{ padding: 0 }}>
          <div className="teal-header">
            Membership &amp; Benefits /{" "}
            <span className="hindi">सदस्यता एवं सुविधा</span>
          </div>
          <div
            style={{
              padding: "24px 40px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <img src={logo} alt="watermark" className="watermark" />
            <div style={{ position: "relative", zIndex: 1 }}>
              <p
                className="teal-label"
                style={{ marginBottom: 18, fontSize: 15 }}
              >
                Terms and Conditions For Members :
              </p>
              {[
                "Member should be attend the meetings and participate fully and have to give written application for being absent, 3 day before meetings.",
                "The meeting will be helds at various locations.",
                "Meeting will be headed by the chairman, and the core group and members.",
                "The Chairmen has the supreme power to form or diffuse a core group and member.",
                "It is duty of a member to obey and give due respect to the chairman and core group.",
                "Membership fee should paid with application form and the Membership fee will be non-refundable.",
              ].map((term, i) => (
                <p
                  key={i}
                  className="body-text"
                  style={{ marginBottom: 14, paddingLeft: 4 }}
                >
                  <strong>{i + 6})</strong>&nbsp; {term}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* ── PAGE 9 ── Contact & Thank You */}
        <div
          className="page-card"
          style={{
            padding: "32px 40px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <img src={logo} alt="watermark" className="watermark" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p
              style={{
                color: TEAL,
                fontWeight: 900,
                fontSize: 16,
                marginBottom: 28,
              }}
            >
              FOR MORE INFORMATION /{" "}
              <span className="hindi">अधिक जानकारी हेतु :</span>
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 24,
                marginBottom: 36,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    background: TEAL,
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 7l10 7 10-7" />
                  </svg>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#222",
                    lineHeight: 1.8,
                  }}
                >
                  info@jssabhiyan-nac.in
                  <br />
                  support@jssabhiyan-nac.in
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div
                  style={{
                    width: 50,
                    height: 50,
                    background: TEAL,
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#222" }}>
                  www.jssabhiyan-nac.in
                </div>
              </div>
            </div>
            <div
              style={{
                background: TEAL,
                borderRadius: 4,
                padding: "32px 0",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 40,
                  letterSpacing: "0.02em",
                }}
              >
                Thank You.
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Back Button */}
        <div style={{ paddingBottom: 16 }}>
          <button className="back-btn" onClick={onClose}>
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
