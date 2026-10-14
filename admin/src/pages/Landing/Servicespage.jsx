import { useState } from "react";

const GREEN = "#4D7C0F";

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
];

const districtsByState = {
  Bihar: [
    "Patna",
    "Gaya",
    "Muzaffarpur",
    "Bhagalpur",
    "Darbhanga",
    "Purnia",
    "Samastipur",
    "Begusarai",
    "Nalanda",
    "Rohtas",
    "Araria",
    "Arwal",
    "Aurangabad",
    "Banka",
    "Buxar",
    "Gopalganj",
    "Jamui",
    "Jehanabad",
    "Kaimur",
    "Katihar",
    "Khagaria",
    "Kishanganj",
    "Lakhisarai",
    "Madhepura",
    "Madhubani",
    "Munger",
    "Nawada",
    "Saran",
    "Sheikhpura",
    "Sheohar",
    "Sitamarhi",
    "Siwan",
    "Supaul",
    "Vaishali",
    "West Champaran",
    "East Champaran",
  ],
  Jharkhand: [
    "Ranchi",
    "Dhanbad",
    "Jamshedpur",
    "Bokaro",
    "Hazaribagh",
    "Giridih",
    "Deoghar",
    "Dumka",
    "Pakur",
    "Garhwa",
    "Chatra",
    "Gumla",
    "Khunti",
    "Koderma",
    "Latehar",
    "Lohardaga",
    "Palamu",
    "Ramgarh",
    "Sahibganj",
    "Seraikela",
    "Simdega",
    "West Singhbhum",
    "East Singhbhum",
  ],
  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur",
    "Agra",
    "Varanasi",
    "Allahabad",
    "Meerut",
    "Noida",
    "Ghaziabad",
    "Bareilly",
    "Aligarh",
    "Moradabad",
    "Saharanpur",
    "Gorakhpur",
    "Faizabad",
    "Jhansi",
    "Mathura",
    "Firozabad",
    "Rampur",
    "Shahjahanpur",
    "Muzaffarnagar",
  ],
  "Madhya Pradesh": [
    "Bhopal",
    "Indore",
    "Gwalior",
    "Jabalpur",
    "Ujjain",
    "Sagar",
    "Dewas",
    "Satna",
    "Ratlam",
    "Rewa",
  ],
  Maharashtra: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Thane",
    "Nashik",
    "Aurangabad",
    "Solapur",
    "Kolhapur",
    "Amravati",
    "Nanded",
  ],
  Rajasthan: [
    "Jaipur",
    "Jodhpur",
    "Kota",
    "Bikaner",
    "Ajmer",
    "Udaipur",
    "Bhilwara",
    "Alwar",
    "Bharatpur",
    "Sikar",
  ],
  Gujarat: [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Gandhinagar",
    "Bhavnagar",
    "Jamnagar",
    "Junagadh",
    "Anand",
    "Navsari",
  ],
  "West Bengal": [
    "Kolkata",
    "Howrah",
    "Darjeeling",
    "Jalpaiguri",
    "Murshidabad",
    "Bardhaman",
    "Nadia",
    "North 24 Parganas",
    "South 24 Parganas",
    "Hooghly",
  ],
  Delhi: [
    "Central Delhi",
    "East Delhi",
    "New Delhi",
    "North Delhi",
    "North East Delhi",
    "North West Delhi",
    "Shahdara",
    "South Delhi",
    "South East Delhi",
    "South West Delhi",
    "West Delhi",
  ],
};

const servicesData = [
  {
    titleEn: "Health Camps",
    titleHi: "स्वास्थ्य शिविर",
    descEn: "JSSA organizes Health Camps to promote healthcare awareness and encourage timely health check-ups among community members.",
    descHi: "JSSA समुदाय के लोगों में स्वास्थ्य जागरूकता बढ़ाने तथा समय पर स्वास्थ्य जांच को प्रोत्साहित करने के लिए स्वास्थ्य शिविर आयोजित करता है।",
    activities: [
      "General Health Check-ups / सामान्य स्वास्थ्य जांच",
      "Basic Health Screening / प्राथमिक स्वास्थ्य परीक्षण",
      "Health Awareness Sessions / स्वास्थ्य जागरूकता सत्र",
      "Community Health Guidance / सामुदायिक स्वास्थ्य मार्गदर्शन",
      "Preventive Healthcare Education / निवारक स्वास्थ्य शिक्षा"
    ]
  },
  {
    titleEn: "Eye Check-up Camps",
    titleHi: "नेत्र जांच शिविर",
    descEn: "Eye Check-up Camps are conducted to create awareness about eye health and encourage early detection of vision-related problems.",
    descHi: "नेत्र स्वास्थ्य के प्रति जागरूकता बढ़ाने एवं दृष्टि संबंधी समस्याओं की प्रारंभिक पहचान को प्रोत्साहित करने हेतु नेत्र जांच शिविर आयोजित किए जाते हैं।",
    activities: [
      "Basic Eye Screening / प्राथमिक नेत्र परीक्षण",
      "Vision Assessment / दृष्टि परीक्षण",
      "Eye Health Awareness / नेत्र स्वास्थ्य जागरूकता",
      "Guidance on Eye Care / नेत्र देखभाल संबंधी मार्गदर्शन",
      "Referral Support (where applicable) / आवश्यकतानुसार रेफरल सहायता"
    ]
  },
  {
    titleEn: "Yoga & Wellness Camps",
    titleHi: "योग एवं वेलनेस शिविर",
    descEn: "JSSA promotes physical and mental well-being through Yoga and Wellness Programs.",
    descHi: "JSSA योग एवं वेलनेस कार्यक्रमों के माध्यम से शारीरिक एवं मानसिक स्वास्थ्य को बढ़ावा देता है।",
    activities: [
      "Yoga Sessions / योग सत्र",
      "Meditation Activities / ध्यान गतिविधियाँ",
      "Stress Management Awareness / तनाव प्रबंधन जागरूकता",
      "Fitness Awareness Programs / फिटनेस जागरूकता कार्यक्रम",
      "Healthy Lifestyle Guidance / स्वस्थ जीवनशैली मार्गदर्शन"
    ]
  },
  {
    titleEn: "E-Clinic Support",
    titleHi: "ई-क्लिनिक सहायता",
    descEn: "JSSA supports healthcare accessibility through E-Clinic initiatives and healthcare guidance services.",
    descHi: "JSSA ई-क्लिनिक पहल एवं स्वास्थ्य मार्गदर्शन सेवाओं के माध्यम से स्वास्थ्य सेवाओं तक पहुंच को प्रोत्साहित करता है।",
    activities: [
      "Basic Healthcare Guidance / प्राथमिक स्वास्थ्य मार्गदर्शन",
      "Healthcare Information Support / स्वास्थ्य संबंधी जानकारी",
      "Beneficiary Assistance / लाभार्थी सहायता",
      "E-Consultation Coordination Support / ई-परामर्श समन्वय सहायता",
      "Health Service Information / स्वास्थ्य सेवाओं की जानकारी"
    ]
  },
  {
    titleEn: "Healthcare Awareness Programs",
    titleHi: "स्वास्थ्य जागरूकता कार्यक्रम",
    descEn: "JSSA conducts awareness programs to educate communities about health and preventive healthcare.",
    descHi: "JSSA स्वास्थ्य एवं निवारक स्वास्थ्य सेवाओं के प्रति समुदाय को जागरूक बनाने के लिए कार्यक्रम आयोजित करता है।",
    activities: [
      "Health Awareness Campaigns / स्वास्थ्य जागरूकता अभियान",
      "Disease Prevention Awareness / रोग निवारण जागरूकता",
      "Public Health Education / जनस्वास्थ्य शिक्षा",
      "Seasonal Disease Awareness / मौसमी रोग जागरूकता",
      "Community Health Sessions / सामुदायिक स्वास्थ्य सत्र"
    ]
  },
  {
    titleEn: "Preventive Healthcare Awareness",
    titleHi: "निवारक स्वास्थ्य जागरूकता",
    descEn: "These programs focus on disease prevention through awareness and education.",
    descHi: "ये कार्यक्रम जागरूकता एवं शिक्षा के माध्यम से रोगों की रोकथाम पर केंद्रित होते हैं।",
    activities: [
      "Hygiene Awareness / स्वच्छता जागरूकता",
      "Nutrition Awareness / पोषण जागरूकता",
      "Lifestyle Disease Prevention / जीवनशैली संबंधी रोगों की रोकथाम",
      "Preventive Health Education / निवारक स्वास्थ्य शिक्षा",
      "Family Health Awareness / पारिवारिक स्वास्थ्य जागरूकता"
    ]
  },
  {
    titleEn: "Health Education Activities",
    titleHi: "स्वास्थ्य शिक्षा गतिविधियाँ",
    descEn: "JSSA conducts educational activities that help individuals make informed healthcare decisions.",
    descHi: "JSSA ऐसी शैक्षिक गतिविधियाँ संचालित करता है जो लोगों को बेहतर स्वास्थ्य निर्णय लेने में सहायता करती हैं।",
    activities: [
      "Health Education Workshops / स्वास्थ्य शिक्षा कार्यशालाएँ",
      "Community Awareness Sessions / सामुदायिक जागरूकता सत्र",
      "Health Information Distribution / स्वास्थ्य संबंधी जानकारी का वितरण",
      "Educational Campaigns / शैक्षिक अभियान",
      "Public Health Learning Programs / जनस्वास्थ्य शिक्षण कार्यक्रम"
    ]
  },
  {
    titleEn: "Health Screening Activities",
    titleHi: "स्वास्थ्य जांच गतिविधियाँ",
    descEn: "Health screening activities are conducted to encourage early identification of common health concerns.",
    descHi: "सामान्य स्वास्थ्य समस्याओं की प्रारंभिक पहचान को प्रोत्साहित करने के लिए स्वास्थ्य जांच गतिविधियाँ आयोजित की जाती हैं।",
    activities: [
      "Basic Health Screening / प्राथमिक स्वास्थ्य परीक्षण",
      "Wellness Assessments / वेलनेस मूल्यांकन",
      "Community Screening Drives / सामुदायिक जांच अभियान",
      "Health Monitoring Awareness / स्वास्थ्य निगरानी जागरूकता"
    ]
  },
  {
    titleEn: "Rural Outreach Programs",
    titleHi: "ग्रामीण स्वास्थ्य जागरूकता कार्यक्रम",
    descEn: "Special emphasis is placed on improving healthcare awareness in rural and underserved communities.",
    descHi: "ग्रामीण एवं वंचित क्षेत्रों में स्वास्थ्य जागरूकता बढ़ाने पर विशेष ध्यान दिया जाता है।",
    activities: [
      "Village Awareness Campaigns / ग्राम जागरूकता अभियान",
      "Rural Health Education / ग्रामीण स्वास्थ्य शिक्षा",
      "Community Meetings / सामुदायिक बैठकें",
      "Healthcare Information Outreach / स्वास्थ्य जानकारी प्रसार",
      "Public Awareness Drives / जनजागरूकता अभियान"
    ]
  },
  {
    titleEn: "Community Outreach Programs",
    titleHi: "सामुदायिक संपर्क कार्यक्रम",
    descEn: "JSSA works directly with communities to promote health awareness and social welfare initiatives.",
    descHi: "JSSA स्वास्थ्य जागरूकता एवं सामाजिक कल्याण पहलों को बढ़ावा देने के लिए सीधे समुदायों के साथ कार्य करता है।",
    activities: [
      "Community Engagement Activities / सामुदायिक सहभागिता गतिविधियाँ",
      "Public Awareness Campaigns / जनजागरूकता अभियान",
      "Health Promotion Events / स्वास्थ्य प्रोत्साहन कार्यक्रम",
      "Social Welfare Outreach / सामाजिक कल्याण गतिविधियाँ",
      "Local Awareness Programs / स्थानीय जागरूकता कार्यक्रम"
    ]
  },
  {
    titleEn: "Public Guidance & Support",
    titleHi: "जन मार्गदर्शन एवं सहायता",
    descEn: "JSSA provides guidance and support related to healthcare awareness and organizational programs.",
    descHi: "JSSA स्वास्थ्य जागरूकता एवं संगठनात्मक कार्यक्रमों से संबंधित मार्गदर्शन एवं सहायता प्रदान करता है।",
    activities: [
      "Beneficiary Guidance / लाभार्थी मार्गदर्शन",
      "Healthcare Information Support / स्वास्थ्य संबंधी जानकारी",
      "Program Information Assistance / कार्यक्रम संबंधी सहायता",
      "Public Help & Support / जन सहायता एवं सहयोग"
    ]
  },
  {
    titleEn: "Healthcare Coordination Support",
    titleHi: "स्वास्थ्य समन्वय सहायता",
    descEn: "JSSA facilitates coordination between beneficiaries and healthcare-related support activities wherever applicable.",
    descHi: "JSSA लाभार्थियों एवं स्वास्थ्य सहायता गतिविधियों के बीच समन्वय स्थापित करने में सहयोग प्रदान करता है।",
    activities: [
      "Beneficiary Coordination / लाभार्थी समन्वय",
      "Healthcare Service Guidance / स्वास्थ्य सेवाओं संबंधी मार्गदर्शन",
      "Community Health Support / सामुदायिक स्वास्थ्य सहायता",
      "Assistance Coordination / सहायता समन्वय"
    ]
  },
  {
    titleEn: "Beneficiary Registration Support",
    titleHi: "लाभार्थी पंजीकरण सहायता",
    descEn: "JSSA assists eligible individuals in registration processes related to organizational programs and services.",
    descHi: "JSSA पात्र व्यक्तियों को संगठनात्मक कार्यक्रमों एवं सेवाओं से संबंधित पंजीकरण प्रक्रिया में सहायता प्रदान करता है।",
    activities: [
      "Registration Assistance / पंजीकरण सहायता",
      "Documentation Guidance / दस्तावेज़ी मार्गदर्शन",
      "Beneficiary Support Services / लाभार्थी सहायता सेवाएँ",
      "Information Verification Support / जानकारी सत्यापन सहायता"
    ]
  },
  {
    titleEn: "Community Health Awareness Campaigns",
    titleHi: "सामुदायिक स्वास्थ्य जागरूकता अभियान",
    descEn: "Large-scale awareness initiatives are conducted to improve public understanding of healthcare and wellness.",
    descHi: "स्वास्थ्य एवं वेलनेस के प्रति जनजागरूकता बढ़ाने के लिए व्यापक स्तर पर अभियान संचालित किए जाते हैं।",
    activities: [
      "Public Health Campaigns / जनस्वास्थ्य अभियान",
      "Health Promotion Drives / स्वास्थ्य प्रोत्साहन अभियान",
      "Awareness Rallies / जागरूकता रैलियाँ",
      "Community Health Events / सामुदायिक स्वास्थ्य कार्यक्रम"
    ]
  },
  {
    titleEn: "Healthy Lifestyle Awareness Initiatives",
    titleHi: "स्वस्थ जीवनशैली जागरूकता पहल",
    descEn: "These initiatives encourage individuals to adopt healthier daily habits and wellness practices.",
    descHi: "ये पहल लोगों को स्वस्थ जीवनशैली एवं बेहतर दैनिक आदतें अपनाने के लिए प्रेरित करती हैं।",
    activities: [
      "Nutrition Awareness / पोषण जागरूकता",
      "Physical Activity Promotion / शारीरिक गतिविधियों को बढ़ावा",
      "Wellness Education / वेलनेस शिक्षा",
      "Lifestyle Improvement Guidance / जीवनशैली सुधार मार्गदर्शन",
      "Health & Fitness Awareness / स्वास्थ्य एवं फिटनेस जागरूकता"
    ]
  }
];

export default function ServicesPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    state: "",
    district: "",
    zip: "",
    serviceType: "",
    message: "",
    agree1: false,
    agree2: false,
  });
  const [selectedState, setSelectedState] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((p) => ({ ...p, [name]: checked }));
      return;
    }
    if (name === "state") {
      setSelectedState(value);
      setForm((p) => ({ ...p, state: value, district: "" }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        fontFamily: "'Segoe UI','Noto Sans',sans-serif",
        color: "#000",
      }}
    >
      <style>{`
        .svc-pkg-section  { padding: 32px 40px; background: #fff; }
        .svc-dis-section  { padding: 24px 40px 32px; background: #fff; }
        .svc-form-section { padding: 0 40px 48px; }

        .svc-pkg-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 32px; }
        .svc-dis-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 80px; }

        .svc-form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .svc-form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }

        .svc-h2-main { font-weight: 900; font-size: 22px; color: #1a2a4a; text-align: center; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.02em; }
        .svc-h2-sub  { font-weight: 900; font-size: 20px; color: #1a2a4a; text-align: center; margin-bottom: 2px; }
        .svc-h2-hin  { font-weight: 900; font-size: 18px; color: #1a2a4a; text-align: center; margin-bottom: 12px; }
        .svc-form-h2 { font-weight: 900; font-size: 22px; color: #000; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.02em; }

        .svc-field-label { display: block; font-size: 14px; font-weight: 600; color: #111; margin-bottom: 6px; }
        .svc-field-input {
          width: 100%; padding: 10px 12px;
          border: 1px solid #ccc; border-radius: 4px;
          font-size: 14px; background: #fff; outline: none;
          box-sizing: border-box; color: #000;
          font-family: inherit;
        }
        .svc-field-input:focus { border-color: ${GREEN}; }
        .svc-field-textarea {
          width: 100%; padding: 10px 12px;
          border: 1px solid #ccc; border-radius: 4px;
          font-size: 14px; background: #fff; outline: none;
          box-sizing: border-box; color: #000; resize: vertical;
          font-family: inherit; min-height: 120px;
        }
        .svc-field-textarea:focus { border-color: ${GREEN}; }

        .svc-services-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }

        .svc-dot { margin-top: 5px; flex-shrink: 0; width: 6px; height: 6px; border-radius: 1px; background: #1a2a4a; min-width: 6px; }
        .svc-item { display: flex; align-items: flex-start; gap: 8px; font-size: 14px; color: #000; padding: 3px 0; }

        .svc-cb-label { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #000; cursor: pointer; }
        .svc-cb       { width: 16px; height: 16px; cursor: pointer; accent-color: ${GREEN}; }

        .svc-post-label { font-weight: 900; font-size: 14px; color: #000; margin-bottom: 16px; letter-spacing: 0.05em; }

        @media (max-width: 768px) {
          .svc-pkg-section  { padding: 14px 10px; }
          .svc-dis-section  { padding: 10px 10px 14px; }
          .svc-form-section { padding: 0 10px 24px; }
          .svc-content-section { padding: 14px 10px !important; }

          .svc-pkg-grid { grid-template-columns: 1fr 1fr 1fr !important; gap: 3px 8px !important; }
          .svc-dis-grid { grid-template-columns: 1fr 1fr !important; gap: 3px 16px !important; }
          .svc-activities-list { column-count: 1 !important; }
          .svc-services-grid { grid-template-columns: 1fr !important; gap: 16px !important; }

          .svc-form-grid-2 { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
          .svc-form-grid-3 { grid-template-columns: 1fr 1fr 1fr !important; gap: 6px !important; }

          .svc-h2-main { font-size: 16px !important; margin-bottom: 2px !important; }
          .svc-h2-sub  { font-size: 12px !important; margin-bottom: 1px !important; }
          .svc-h2-hin  { font-size: 12px !important; margin-bottom: 6px !important; }
          .svc-form-h2 { font-size: 14px !important; margin-bottom: 8px !important; }

          .svc-item { font-size: 10px !important; padding: 1px 0 !important; gap: 4px !important; }
          .svc-dot  { width: 4px !important; height: 4px !important; min-width: 4px !important; margin-top: 3px !important; }

          .svc-field-label    { font-size: 10px !important; margin-bottom: 2px !important; }
          .svc-field-input    { padding: 6px 8px !important; font-size: 12px !important; border-radius: 4px !important; }
          .svc-field-textarea { padding: 6px 8px !important; font-size: 12px !important; border-radius: 4px !important; min-height: 80px !important; }

          .svc-post-label { font-size: 12px !important; margin-bottom: 6px !important; }
          .svc-cb-label   { font-size: 12px !important; gap: 6px !important; }
          .svc-cb         { width: 14px !important; height: 14px !important; }

          .svc-form-inner { gap: 14px !important; }
          .svc-form-box   { padding: 16px 12px !important; }

          .svc-submit-btn { font-size: 12px !important; padding: 10px 24px !important; }
        }
      `}</style>

      {/* SERVICES SECTION */}
      <div className="svc-content-section" style={{ padding: "32px 40px", background: "#fff" }}>
        <h2 className="svc-h2-main" style={{ fontSize: 28, marginBottom: 8 }}>
          Services / सेवाएँ
        </h2>

        <div className="svc-services-grid" style={{ borderTop: `2px solid ${GREEN}`, paddingTop: 24 }}>
          {servicesData.map((svc, index) => (
            <div key={index} style={{ background: '#f8f9fa', padding: 24, borderLeft: `4px solid ${GREEN}` }}>
              <h3 style={{ fontSize: 20, fontWeight: 'bold', color: '#1a2a4a', marginBottom: 16 }}>
                {index + 1}. {svc.titleEn} <span style={{ color: '#555', fontSize: 18 }}>/ {svc.titleHi}</span>
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 20 }}>
                <p style={{ flex: 1, minWidth: 250, fontSize: 15, lineHeight: 1.8, color: '#000', margin: 0 }}>
                  {svc.descEn}
                </p>
                <p style={{ flex: 1, minWidth: 250, fontSize: 15, lineHeight: 1.8, color: '#444', margin: 0 }}>
                  {svc.descHi}
                </p>
              </div>

              <div style={{ background: '#fff', padding: '16px 20px', border: '1px solid #eaeaea' }}>
                <strong style={{ fontSize: 15, color: '#1a2a4a', display: 'block', marginBottom: 12 }}>Activities / गतिविधियाँ :</strong>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.8, color: '#000' }} className="svc-activities-list">
                  {svc.activities.map((act, i) => {
                    const [en, hi] = act.split(' / ');
                    return (
                      <li key={i} style={{ marginBottom: 6, breakInside: 'avoid' }}>
                        <span style={{ fontWeight: 500 }}>{en}</span> <br /><span style={{ color: '#555' }}>({hi})</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}

          {/* Disclaimer */}
          <div style={{ gridColumn: '1 / -1', background: '#fff3cd', borderLeft: '4px solid #ffc107', padding: '20px 24px', marginTop: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 'bold', color: '#856404', margin: '0 0 12px 0' }}>
              Disclaimer / अस्वीकरण
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: '#856404', marginBottom: 12 }}>
              All services, activities, healthcare assistance, awareness programs, camps, and support initiatives are conducted as per organizational policies, operational guidelines, resource availability, and applicable regulations. Availability of specific activities may vary by location and operational requirements.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: '#856404', margin: 0 }}>
              सभी सेवाएँ, गतिविधियाँ, स्वास्थ्य सहायता, जागरूकता कार्यक्रम, शिविर एवं सहयोगात्मक पहलें संगठन की नीतियों, संचालन दिशानिर्देशों, संसाधनों की उपलब्धता एवं लागू नियमों के अनुसार संचालित की जाती हैं। विभिन्न सेवाओं की उपलब्धता स्थान एवं संचालन आवश्यकताओं के अनुसार भिन्न हो सकती है।
            </p>
          </div>
        </div>
      </div>


    </div>
  );
}
