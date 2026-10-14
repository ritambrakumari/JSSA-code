import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useBlueBodyTheme } from "../../components/AdminBlueTheme";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  FileText,
  Briefcase,
  Building,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  Table,
  IndianRupee,
  ShieldCheck,
  AlertCircle,
  Trophy,
  Save

} from "lucide-react";
import { createPaperAPI, feeStructureAPI, mouAPI, uploadAPI, locationAPI, applicationsAPI } from "../../utils/api";
import { useAuth } from "../../auth/AuthProvider";
import indianStates from "../../data/states.json";
import indianDistricts from "../../data/district.json";

const GREEN = "#4D7C0F";

const INDIAN_BANKS = [
  "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Punjab National Bank",
  "Bank of Baroda", "Canara Bank", "Union Bank of India", "Bank of India", "Indian Bank",
  "Central Bank of India", "IDBI Bank", "Kotak Mahindra Bank", "IndusInd Bank", "Federal Bank",
  "Yes Bank", "UCO Bank", "Bank of Maharashtra", "Punjab & Sind Bank", "Indian Overseas Bank",
  "RBL Bank", "South Indian Bank", "Bandhan Bank", "IDFC First Bank", "City Union Bank",
  "Karur Vysya Bank", "Jammu & Kashmir Bank", "Karnataka Bank", "Dhanlaxmi Bank",
  "Tamilnad Mercantile Bank", "Nainital Bank", "Kerala Gramin Bank", "Airtel Payments Bank",
  "Paytm Payments Bank", "Fino Payments Bank", "India Post Payments Bank", "Jio Payments Bank",
  "NSDL Payments Bank", "AU Small Finance Bank", "Equitas Small Finance Bank", "Suryoday Small Finance Bank",
  "Ujjivan Small Finance Bank", "ESAF Small Finance Bank", "Utkarsh Small Finance Bank",
  "North East Small Finance Bank", "Jana Small Finance Bank", "Capital Small Finance Bank",
  "Shivalik Small Finance Bank", "Unity Small Finance Bank", "Bihar Gramin Bank",
  "Uttar Bihar Gramin Bank", "Madhyanchal Gramin Bank", "Prathama UP Gramin Bank",
  "Aryavart Bank", "Baroda Gujarat Gramin Bank", "Baroda Rajasthan Kshetriya Gramin Bank",
  "Jharkhand Rajya Gramin Bank", "Karnataka Vikas Grameena Bank", "Andhra Pragathi Grameena Bank",
  "Saurashtra Gramin Bank", "Tripura Gramin Bank", "Nagaland Rural Bank", "Assam Gramin Vikash Bank"
].sort();

// Mock Data for Cascading Blocks & Panchayats
const LOCATION_MAPPING = {
  "Patna": {
    "Patna Sadar": ["Panchayat A", "Panchayat B", "Panchayat C"],
    "Phulwari Sharif": ["Phulwari Rural", "Janipur", "Nohsa"],
    "Danapur": ["Danapur Cantt", "Danapur Rural"]
  },
  "Gaya": {
    "Gaya Sadar": ["Gaya City 1", "Gaya City 2"],
    "Bodh Gaya": ["Bodh Gaya Village", "Mastipur", "Bakrour"]
  },
  "Muzaffarpur": {
    "Mushahari": ["Mushahari East", "Mushahari West"],
    "Bochahan": ["Bochahan Center", "Bochahan North"]
  },
  "Lucknow": {
    "Bakshi Ka Talab": ["BKT 1", "BKT 2"],
    "Sarojini Nagar": ["Sarojini 1", "Sarojini 2"]
  }
};



// Helper for Table Rows (Bilingual)
const TableRow = ({ labelEn, labelHi, valueEn, valueHi, odd = false }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 border-b border-[#D9F99D] ${odd ? "bg-[#ECFCCB]" : "bg-[#ECFCCB]"}`}>
    {/* English Column */}
    <div className="grid grid-cols-[160px_28px_1fr] border-b md:border-b-0 md:border-r border-[#D9F99D]">
      <div className="p-3 font-semibold text-sm bg-[#ECFCCB] border-r border-[#D9F99D] flex items-center">{labelEn}</div>
      <div className="p-3 text-sm flex items-center justify-center bg-[#D9F99D] border-r border-[#D9F99D]">:</div>
      <div className="p-3 text-sm bg-[#ECFCCB] flex items-center">{valueEn || "—"}</div>
    </div>
    {/* Hindi Column */}
    <div className="grid grid-cols-[160px_28px_1fr]">
      <div className="p-3 font-semibold text-sm bg-[#ECFCCB] border-r border-[#D9F99D] flex items-center">{labelHi}</div>
      <div className="p-3 text-sm flex items-center justify-center bg-[#D9F99D] border-r border-[#D9F99D]">:</div>
      <div className="p-3 text-sm bg-[#ECFCCB] flex items-center">{valueHi || "—"}</div>
    </div>
  </div>
);

const FormSectionHeader = ({ en, hi }) => (
  <div className="border-b-2 border-[#4D7C0F] mb-6 pb-2 mt-12">
    <h2 className="text-xl font-black text-[#3F6212] tracking-tight uppercase">
      {en} <span className="text-gray-400 mx-2">/</span> <span className="font-bold">{hi}</span>
    </h2>
  </div>
);

const FormLabel = ({ en, hi, required }) => (
  <label className="text-[13px] font-bold text-gray-600 block mb-1">
    {en} <span className="text-gray-400">/</span> {hi} : {required && <span className="text-red-500">*</span>}
  </label>
);

const FormInput = ({ type = "text", value, readOnly, placeholder, onChange, className = "" }) => (
  <input
    type={type}
    value={value || ""}
    readOnly={readOnly}
    placeholder={placeholder}
    onChange={onChange}
    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#ECFCCB] outline-none text-sm ${readOnly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""} ${className}`}
  />
);

const FormSelect = ({ value, readOnly, options, onChange, placeholder = "--Please Select--", getLabel }) => (
  <select
    value={value}
    disabled={readOnly}
    onChange={onChange}
    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#ECFCCB] outline-none text-sm ${readOnly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
  >
    <option value="">{placeholder}</option>
    {options.map(opt => <option key={opt} value={opt}>{getLabel ? getLabel(opt) : opt}</option>)}
  </select>
);

const MOUForm = () => {
  useBlueBodyTheme(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState(null);
  const [feeDetails, setFeeDetails] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docsVerified, setDocsVerified] = useState(false);
  const [tempEmpId, setTempEmpId] = useState("");
  const [isOpenLang, setIsOpenLang] = useState(false);

  // Address Lists for Cascading Selects
  const [countries, setCountries] = useState(["India / भारत"]);
  const [states, setStates] = useState(indianStates.states);
  const [districts, setDistricts] = useState([]);
  const [fetchingStates, setFetchingStates] = useState(false);
  const [fetchingDistricts, setFetchingDistricts] = useState(false);

  const [blocks, setBlocks] = useState([]);
  const [panchayats, setPanchayats] = useState([]);

  // const getBilingualName = (name) => {
  //   const mapping = {
  //     // Countries
  //     "India": "India / भारत",

  //     // States
  //     "Bihar": "Bihar / बिहार",
  //     "Uttar Pradesh": "Uttar Pradesh / उत्तर प्रदेश",
  //     "Jharkhand": "Jharkhand / झारखंड",
  //     "West Bengal": "West Bengal / पश्चिम बंगाल",
  //     "Madhya Pradesh": "Madhya Pradesh / मध्य प्रदेश",
  //     "Rajasthan": "Rajasthan / राजस्थान",
  //     "Gujarat": "Gujarat / गुजरात",
  //     "Maharashtra": "Maharashtra / महाराष्ट्र",
  //     "Delhi": "Delhi / दिल्ली",
  //     "Punjab": "Punjab / पंजाब",
  //     "Haryana": "Haryana / हरियाणा",
  //     "Uttarakhand": "Uttarakhand / उत्तराखंड",
  //     "Chhattisgarh": "Chhattisgarh / छत्तीसगढ़",
  //     "Odisha": "Odisha / ओडिशा",
  //     "Assam": "Assam / असम",
  //     "Himachal Pradesh": "Himachal Pradesh / हिमाचल प्रदेश",
  //     "Jammu and Kashmir": "Jammu and Kashmir / जम्मू और कश्मीर",
  //     "Karnataka": "Karnataka / कर्नाटक",
  //     "Kerala": "Kerala / केरल",
  //     "Tamil Nadu": "Tamil Nadu / तमिलनाडु",
  //     "Andhra Pradesh": "Andhra Pradesh / आंध्र प्रदेश",
  //     "Telangana": "Telangana / तेलंगाना",
  //     "Goa": "Goa / गोवा",

  //     // Districts (Sample common ones)
  //     "Patna": "Patna / पटना",
  //     "Gaya": "Gaya / गया",
  //     "Muzaffarpur": "Muzaffarpur / मुजफ्फरपुर",
  //     "Lucknow": "Lucknow / लखनऊ",
  //     "Ranchi": "Ranchi / रांची",
  //     "Varanasi": "Varanasi / वाराणसी",
  //     "Araria": "Araria / अररिया",
  //     "Arwal": "Arwal / अरवल",
  //     "Aurangabad": "Aurangabad / औरंगाबाद",
  //     "Barka": "Barka / बांका",
  //     "Begusarai": "Begusarai / बेगूसराय",
  //     "Bhagalpur": "Bhagalpur / भागलपुर",
  //     "Bhojpur": "Bhojpur / भोजपुर",
  //     "Buxar": "Buxar / बक्सर",
  //     "Darbhanga": "Darbhanga / दरभंगा",
  //     "East Champaran": "East Champaran / पूर्वी चंपारण",
  //     "Gopalganj": "Gopalganj / गोपालगंज",
  //     "Jamui": "Jamui / जमुई",
  //     "Jehanabad": "Jehanabad / जहानाबाद",
  //     "Kaimur": "Kaimur / कैमूर",
  //     "Katihar": "Katihar / कटिहार",
  //     "Khagaria": "Khagaria / खगड़िया",
  //     "Kishanganj": "Kishanganj / किशनगंज",
  //     "Lakhisarai": "Lakhisarai / लखीसराय",
  //     "Madhepura": "Madhepura / मधेपुरा",
  //     "Madhubani": "Madhubani / मधुबनी",
  //     "Munger": "Munger / मुंगेर",
  //     "Nalanda": "Nalanda / नालंदा",
  //     "Nawada": "Nawada / नवादा",
  //     "Purnia": "Purnia / पूर्णिया",
  //     "Rohtas": "Rohtas / रोहतास",
  //     "Saharsa": "Saharsa / सहरसा",
  //     "Samastipur": "Samastipur / समस्तीपुर",
  //     "Saran": "Saran / सारण",
  //     "Sheikhpura": "Sheikhpura / शेखपुरा",
  //     "Sheohar": "Sheohar / शिवहर",
  //     "Sitamarhi": "Sitamarhi / सीतामढ़ी",
  //     "Siwan": "Siwan / सीवान",
  //     "Supaul": "Supaul / सुपौल",
  //     "Vaishali": "Vaishali / वैशाली",
  //     "West Champaran": "West Champaran / पश्चिम चंपारण",

  //     // Additional States & Districts from JSON
  //     "Andhra Pradesh": "Andhra Pradesh / आंध्र प्रदेश",
  //     "Arunachal Pradesh": "Arunachal Pradesh / अरुणाचल प्रदेश",
  //     "Chandigarh (UT)": "Chandigarh / चंडीगढ़",
  //     "Dadra and Nagar Haveli (UT)": "Dadra and Nagar Haveli / दादरा और नगर हवेली",
  //     "Daman and Diu (UT)": "Daman and Diu / दमन और दीव",
  //     "Delhi (NCT)": "Delhi / दिल्ली (NCT)",
  //     "Haryana": "Haryana / हरियाणा",
  //     "Kerala": "Kerala / केरल",
  //     "Lakshadweep (UT)": "Lakshadweep / लक्षद्वीप",
  //     "Manipur": "Manipur / मणिपुर",
  //     "Meghalaya": "Meghalaya / मेघालय",
  //     "Mizoram": "Mizoram / मिजोरम",
  //     "Nagaland": "Nagaland / नागालैंड",
  //     "Puducherry (UT)": "Puducherry / पुडुचेरी",
  //     "Sikkim": "Sikkim / सिक्किम",
  //     "Tripura": "Tripura / त्रिपुरा",
  //     "Anantapur": "Anantapur / अनंतपुर",
  //     "Chittoor": "Chittoor / चित्तूर",
  //     "Guntur": "Guntur / गुंटूर",
  //     "Krishna": "Krishna / कृष्णा",
  //     "Kurnool": "Kurnool / कुरनूल",
  //     "Vizianagaram": "Vizianagaram / विजयनगरम",
  //     "Kadapa": "Kadapa / कडप्पा",
  //     "Ahmedabad": "Ahmedabad / अहमदाबाद",
  //     "Gandhinagar": "Gandhinagar / गांधीनगर",
  //     "Surat": "Surat / सूरत",
  //     "Rajkot": "Rajkot / राजकोट",
  //     "Bhopal": "Bhopal / भोपाल",
  //     "Indore": "Indore / इंदौर",
  //     "Gwalior": "Gwalior / ग्वालियर",
  //     "Ujjain": "Ujjain / उज्जैन",
  //     "Mumbai": "Mumbai / मुंबई",
  //     "Pune": "Pune / पुणे",
  //     "Nagpur": "Nagpur / नागपुर",
  //     "Nashik": "Nashik / नासिक",
  //     "Amritsar": "Amritsar / अमृतसर",
  //     "Ludhiana": "Ludhiana / लुधियाना",
  //     "Jaipur": "Jaipur / जयपुर",
  //     "Jodhpur": "Jodhpur / जोधपुर",
  //     "Udaipur": "Udaipur / उदयपुर",
  //     "Chennai": "Chennai / चेन्नई",
  //     "Hyderabad": "Hyderabad / हैदराबाद",
  //     "Agra": "Agra / आगरा",
  //     "Aligarh": "Aligarh / अलीगढ़",
  //     "Allahabad": "Allahabad / इलाहाबाद",
  //     "Bareilly": "Bareilly / बरेली",
  //     "Ghaziabad": "Ghaziabad / गाजियाबाद",
  //     "Gorakhpur": "Gorakhpur / गोरखपुर",
  //     "Kanpur": "Kanpur / कानपुर",
  //     "Mathura": "Mathura / मथुरा",
  //     "Meerut": "Meerut / मेरठ",
  //     "Kolkata": "Kolkata / कोलकाता",
  //     "Ambala": "Ambala / अंबाला",
  //     "Bhiwani": "Bhiwani / भिवानी",
  //     "Faridabad": "Faridabad / फरीदाबाद",
  //     "Gurgaon": "Gurgaon / गुड़गांव",
  //     "Hisar": "Hisar / हिसार",
  //     "Karnal": "Karnal / करनाल",
  //     "Panipat": "Panipat / पानीपत",
  //     "Rohtak": "Rohtak / रोहतक",
  //     "Shimla": "Shimla / शिमला",
  //     "Mandi": "Mandi / मंडी",
  //     "Solan": "Solan / सोलन",
  //     "Jammu": "Jammu / जम्मू",
  //     "Srinagar": "Srinagar / श्रीनगर",
  //     "Bokaro": "Bokaro / बोकारो",
  //     "Dhanbad": "Dhanbad / धनबाद",
  //     "Dumka": "Dumka / दुमका",
  //     "Hazaribag": "Hazaribag / हजारीबाग",
  //     "Jamshedpur": "Jamshedpur / जमशेदपुर",
  //     "Bangalore": "Bangalore / बैंगलोर",
  //     "Mysore": "Mysore / मैसूर",
  //     "Thiruvananthapuram": "Thiruvananthapuram / तिरुवनंतपुरम",
  //     "Kochi": "Kochi / कोच्चि",
  //     "Gwalior": "Gwalior / ग्वालियर",
  //     "Jabalpur": "Jabalpur / जबलपुर",
  //     "Sagar": "Sagar / सागर",
  //     "Satna": "Satna / सतना",
  //     "Amravati": "Amravati / अमरावती",
  //     "Aurangabad": "Aurangabad / औरंगाबाद",
  //     "Kolhapur": "Kolhapur / कोल्हापुर",
  //     "Solapur": "Solapur / सोलापुर",
  //     "Imphal": "Imphal / इम्फाल",
  //     "Shillong": "Shillong / शिलांग",
  //     "Aizawl": "Aizawl / आइजोल",
  //     "Kohima": "Kohima / कोहिमा",
  //     "Bhubaneswar": "Bhubaneswar / भुवनेश्वर",
  //     "Puri": "Puri / पुरी",
  //     "Cuttack": "Cuttack / कटक",
  //     "Amritsar": "Amritsar / अमृतसर",
  //     "Jalandhar": "Jalandhar / जालंधर",
  //     "Ludhiana": "Ludhiana / लुधियाना",
  //     "Patiala": "Patiala / पटियाला",
  //     "Bikaner": "Bikaner / बीकानेर",
  //     "Kota": "Kota / कोटा",
  //     "Ajmer": "Ajmer / अजमेर",
  //     "Alwar": "Alwar / अलवर",
  //     "Bharatpur": "Bharatpur / भरतपुर",
  //     "Madurai": "Madurai / मदुरै",
  //     "Coimbatore": "Coimbatore / कोयंबटूर",
  //     "Warangal": "Warangal / वारंगल",
  //     "Agartala": "Agartala / अगरतला",
  //     "Dehradun": "Dehradun / देहरादून",
  //     "Haridwar": "Haridwar / हरिद्वार",
  //     "Nainital": "Nainital / नैनीताल",
  //     "Bareilly": "Bareilly / बरेली",
  //     "Faizabad": "Faizabad / फैजाबाद",
  //     "Jhansi": "Jhansi / झांसी",
  //     "Moradabad": "Moradabad / मुरादाबाद",
  //     "Saharanpur": "Saharanpur / सहारनपुर",
  //     "Asansol": "Asansol / आसनसोल",
  //     "Durgapur": "Durgapur / दुर्गापुर",
  //     "Siliguri": "Siliguri / सिलीगुड़ी",
  //     "Arrah": "Arrah / आरा",
  //     "Arwal": "Arwal / अरवल",
  //     "Banka": "Banka / बांका",
  //     "Barauni": "Barauni / बरौनी",
  //     "Barh": "Barh / बाढ़",
  //     "Bhabua": "Bhabua / भभुआ",
  //     "Bihar Sharif": "Bihar Sharif / बिहार शरीफ",
  //     "Chhapra": "Chhapra / छपरा",
  //     "Dumraon": "Dumraon / डुमरांव",
  //     "Forbesganj": "Forbesganj / फारबिसगंज",
  //     "Hajipur": "Hajipur / हाजीपुर",
  //     "Jamalpur": "Jamalpur / जमालपुर",
  //     "Kishanganj": "Kishanganj / किशनगंज",
  //     "Makhdumpur": "Makhdumpur / मखदुमपुर",
  //     "Motihari": "Motihari / मोतिहारी",
  //     "Narkatiaganj": "Narkatiaganj / नरकटियागंज",
  //     "Rajgir": "Rajgir / राजगीर",
  //     "Sasaram": "Sasaram / सासाराम",
  //     "Sherghati": "Sherghati / शेरघाटी"
  //   };
  //   return mapping[name] || name;
  // };


  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const [formData, setFormData] = useState({
    // Address Details
    country: "",
    state: "",
    district: "",
    blockKhand: "",
    gramPanchayat: "",
    villageTola: "",
    wardNo: "",
    post: "",
    policeStation: "",
    pincode: "",
    motherName: "",
    panNumber: "",
    nationality: "indian",

    // Education & Others
    handicapDisability: "No",
    maritalStatus: "Unmarried",
    language: "Hindi, English",
    bloodGroup: "",
    educationDetails: [], // Will hold saved records


    // Bank Details
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",

    // Nominee
    nomineeName: "",
    nomineeRelation: "",
    nomineeAge: "",
    nomineeAadhar: "",
    nomineeMobile: "",
    nomineeEmail: "",

    // MOU Document URLs
    aadharFront: null,
    aadharBack: null,
    panCard: null,
    bankDoc: null,

    agreeToTerms: false
  });

  const [uploadingDoc, setUploadingDoc] = useState(null);

  const handleDocUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Removed 2MB size restriction as per user request

    setUploadingDoc(type);
    try {
      const res = await uploadAPI.uploadMOUDucument(file, type);
      if (res.success) {
        setFormData(prev => ({ ...prev, [type]: res.data.url }));
      } else {
        alert(res.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploadingDoc(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [examsRes, feeRes, allAppsRes] = await Promise.all([
          createPaperAPI.getAssigned(),
          feeStructureAPI.getAll(),
          applicationsAPI.getAll({ limit: 0 })
        ]);

        if (examsRes.success && examsRes.data.tests) {
          const currentExam = examsRes.data.tests.find(t => t.id === id);

          if (currentExam) {
            setExam(currentExam);

            // --- ROBUST APPLICATION MATCHING ---
            let app = currentExam.userAttempt?.applicationId;

            // Extract target post name more aggressively
            let targetPostEn = currentExam.post?.en || currentExam.postTitle?.en || "";
            if (!targetPostEn && currentExam.title) {
              const lowerTitle = currentExam.title.toLowerCase();
              if (lowerTitle.includes("district manager")) targetPostEn = "District Manager";
              else if (lowerTitle.includes("block supervisor")) targetPostEn = "Block Supervisor Cum Panchayat Executive";
              else if (lowerTitle.includes("panchayat executive")) targetPostEn = "Panchayat Executive";
              else {
                // Fallback: try to extract from "Post of [Name]"
                const match = currentExam.title.match(/Post of ([^Advt]+)/i);
                if (match) targetPostEn = match[1].trim();
              }
            }

            // console.log("🎯 MOU Target Post:", targetPostEn);

            // Verify if the linked app matches the exam's post. 
            // If mismatch found, or if app is missing, try to recover from all applications.
            const currentAppPost = app?.jobPostingId?.post?.en || app?.jobTitle || "";
            const isMismatch = app && targetPostEn &&
              !targetPostEn.toLowerCase().includes(currentAppPost.toLowerCase()) &&
              !currentAppPost.toLowerCase().includes(targetPostEn.toLowerCase());

            if (!app || isMismatch) {
              // console.log("🔍 MOU Match: Recovery started for:", targetPostEn);
              const matchingApp = allAppsRes.data?.applications
                ?.filter(a => {
                  const appPostEn = a.jobPostingId?.post?.en || a.jobTitle || a.post || "";
                  return (appPostEn && targetPostEn && (
                    appPostEn.toLowerCase().includes(targetPostEn.toLowerCase()) ||
                    targetPostEn.toLowerCase().includes(appPostEn.toLowerCase())
                  ));
                })
                .sort((a, b) => {
                  // Prefer exact match or closer length
                  const aPost = a.jobPostingId?.post?.en || "";
                  const bPost = b.jobPostingId?.post?.en || "";
                  const aDiff = Math.abs(aPost.length - targetPostEn.length);
                  const bDiff = Math.abs(bPost.length - targetPostEn.length);
                  return aDiff - bDiff;
                })[0];

              if (matchingApp) {
                // console.log("✅ MOU Match: Recovered application:", matchingApp.applicationNumber);
                app = matchingApp;
              } else if (allAppsRes.data?.applications?.length > 0) {
                // Ultimate fallback: if no post match, just take the first application to get candidate info
                app = allAppsRes.data.applications[0];
              }
            }

            if (app) {
              setApplication(app);

              // Find matching fee structure
              const postName = targetPostEn || app.jobPostingId?.post?.en || currentExam.post?.en || currentExam.postTitle?.en;

              if (feeRes.success && feeRes.data) {
                const matchingFee = feeRes.data.find(f => { return f.jobPost?.toLowerCase() === postName?.toLowerCase() });
                if (matchingFee) setFeeDetails(matchingFee);
              }

              setFormData(prev => ({
                ...prev,
                panNumber: app.pan || "",
                nationality: app.nationality || "indian",
                motherName: app.motherName || "",
                accountHolderName: app.candidateName || ""
              }));
            }
          } else {
            setError("Exam details not found in your assigned tests.");
          }
        } else {
          setError(examsRes.error || "Failed to load exam data");
        }
      } catch (err) {
        setError("An error occurred while fetching information");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Generate a temporary Employee ID for display in docs
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setTempEmpId(`JSSA/BR/DM/${randomNum}`);
  }, [id]);

  // Fetch Countries on Mount
  useEffect(() => {
    setCountries(["India / भारत"]);
    setFormData(prev => ({ ...prev, country: "India / भारत" }));
    setStates(indianStates);
  }, []);

  const [currentEdu, setCurrentEdu] = useState({
    level: "",
    board: "",
    year: "",
    percentage: "",
    file: null,
    isOther: false
  });

  // Fetch States when Country changes
  const handleCountryChange = (e) => {
    const country = e.target.value;
    setFormData(prev => ({ ...prev, country: country, state: "", district: "" }));
    if (country === "India") {
      setStates(indianStates);
    } else {
      setStates([]);
    }
    setDistricts([]);
  };

  // Fetch Districts (Cities) when State changes
  const handleStateChange = (e) => {
    const stateName = e.target.value;
    setFormData(prev => ({ ...prev, state: stateName, district: "" }));
    setDistricts([]);

    if (indianDistricts[stateName]) {
      setDistricts(indianDistricts[stateName]);
    } else {
      setDistricts([]);
    }
  };

  const handleDistrictChange = async (e) => {
    const dist = e.target.value;
    setFormData(prev => ({ ...prev, district: dist, blockKhand: "", gramPanchayat: "" }));
    setBlocks([]);
    setPanchayats([]);

    if (dist) {
      try {
        const res = await locationAPI.getBlocks({ state: formData.state, district: dist });
        let blockList = [];
        if (Array.isArray(res)) blockList = res;
        else if (res.data) blockList = res.data;

        // Map objects to bilingual strings and deduplicate by label
        const processedBlocks = blockList.map(b => ({
          id: b._id,
          label: b.nameHi ? `${b.name} / ${b.nameHi}` : b.name
        }));

        const uniqueBlocks = [];
        const seenLabels = new Set();

        processedBlocks.forEach(b => {
          const lowerLabel = b.label.toLowerCase().trim();
          if (!seenLabels.has(lowerLabel)) {
            seenLabels.add(lowerLabel);
            uniqueBlocks.push(b);
          }
        });

        setBlocks(uniqueBlocks);
      } catch (err) {
        console.error("Error fetching blocks:", err);
      }
    }
  };

  const handleBlockChange = async (e) => {
    const blockVal = e.target.value; // This will be the ID or Label depending on how we set value
    setFormData(prev => ({ ...prev, blockKhand: blockVal, gramPanchayat: "" }));
    setPanchayats([]);

    // Find the block ID to fetch panchayats
    const selectedBlock = blocks.find(b => b.label === blockVal || b.id === blockVal);
    const blockId = selectedBlock ? selectedBlock.id : null;

    if (blockId) {
      try {
        const res = await locationAPI.getPanchayats({ blockId: blockId });
        let panchList = [];
        if (Array.isArray(res)) panchList = res;
        else if (res.data) panchList = res.data;

        const processedPanchayats = panchList.map(p => p.nameHi ? `${p.name} / ${p.nameHi}` : p.name);

        // Deduplicate panchayats
        const uniquePanchayats = Array.from(new Set(processedPanchayats.map(p => p.trim())))
          .sort((a, b) => a.localeCompare(b));

        setPanchayats(uniquePanchayats);
      } catch (err) {
        console.error("Error fetching panchayats:", err);
      }
    }
  };

  const handleSaveEducation = () => {
    if (!currentEdu.level || !currentEdu.board || !currentEdu.year || !currentEdu.percentage) {
      alert("Please fill all details for the current qualification");
      return;
    }

    // Only include file if it's a valid URL (not null or File object)
    const eduData = {
      level: currentEdu.level,
      board: currentEdu.board,
      year: currentEdu.year,
      percentage: currentEdu.percentage
    };
    if (currentEdu.file) {
      eduData.file = currentEdu.file;
    }

    setFormData({
      ...formData,
      educationDetails: [...formData.educationDetails, eduData]
    });

    // Reset current input
    setCurrentEdu({
      level: "",
      board: "",
      year: "",
      percentage: "",
      file: null,
      isOther: false
    });
  };

  const removeEducationRow = (index) => {
    const updated = formData.educationDetails.filter((_, i) => i !== index);
    setFormData({ ...formData, educationDetails: updated });
  };

  const handleMockPayment = async () => {
    if (!formData.agreeToTerms || !docsVerified) return;
    setIsProcessing(true);
    try {
      const verifyRes = await mouAPI.mockVerify(application._id, formData);
      if (verifyRes.success) {
        alert("DEV MOCK: Role updated to Employee successfully!\n\nYou will be logged out now. Please login again as Employee.");
        logout();
        navigate("/login", { replace: true });
      } else {
        alert(verifyRes.error || "Mock verification failed");
      }
    } catch (err) {
      console.error(err);
      alert("Mock payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!formData.agreeToTerms) return;
    setIsProcessing(true);

    try {
      // ── Form Validation ──
      const requiredFields = {
        motherName: "Mother's Name",
        panNumber: "PAN Number",
        country: "Country",
        state: "State",
        district: "District",
        blockKhand: "Block / Khand",
        gramPanchayat: "Gram Panchayat",
        villageTola: "At / Village / Tola",
        wardNo: "Ward No",
        post: "Post",
        policeStation: "Police Station",
        pincode: "PIN Code",
        accountHolderName: "Account Holder Name",
        bankName: "Bank Name",
        accountNumber: "Account Number",
        ifscCode: "IFSC Code",
        branchName: "Branch Name",
        aadharFront: "Aadhaar Front Side",
        aadharBack: "Aadhaar Back Side",
        panCard: "PAN Card Document",
        bankDoc: "Cancelled Cheque / Passbook",
        nomineeName: "Nominee Name",
        nomineeRelation: "Nominee Relationship",
        nomineeAge: "Nominee Age"
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key]) => !formData[key]?.toString().trim())
        .map(([, label]) => label);

      if (missingFields.length > 0) {
        alert(`Please fill the following required fields:\n• ${missingFields.join('\n• ')}`);
        setIsProcessing(false);
        return;
      }

      if (!formData.agreeToTerms) return;
      setIsProcessing(true);

      const amount = feeDetails?.totalAmount || 1790;
      const res = await mouAPI.submit({
        applicationId: application._id,
        formData: formData,
        amount: amount
      });

      if (res.success) {
        const { orderId, keyId, amount: amountInPaise } = res.data;

        const options = {
          key: keyId,
          amount: amountInPaise,
          currency: "INR",
          name: "JSS Abhiyan",
          description: "MOU Fee Payment",
          order_id: orderId,
          handler: async (response) => {
            try {
              setIsProcessing(true);
              const verifyRes = await mouAPI.verify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                applicationId: application._id,
                testId: id
              });

              if (verifyRes.success) {
                alert("Payment Successful! Your role has been updated to Employee.\n\nYou will be logged out now. Please login again as Employee.");
                logout();
                navigate("/login", { replace: true });
              } else {
                alert(verifyRes.error || "Verification failed");
              }
            } catch (err) {
              console.error(err);
              alert("Payment verification failed");
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: application?.candidateName,
            email: application?.email,
            contact: application?.mobile
          },
          theme: { color: GREEN },
          modal: {
            ondismiss: () => setIsProcessing(false)
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        alert(res.error || "Failed to initiate payment");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ECFCCB]"></div></div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <div className="p-8 text-center text-red-500 font-bold">{error}</div>
    </DashboardLayout>
  );


  const getDetectedPost = (obj) => {
    if (obj?.post?.en) return obj.post.en;
    if (obj?.postTitle?.en) return obj.postTitle.en;
    if (obj?.title) {
      const t = obj.title.toLowerCase();
      if (t.includes("district manager")) return "District Manager";
      if (t.includes("block supervisor")) return "Block Supervisor Cum Panchayat Executive";
      if (t.includes("panchayat executive")) return "Panchayat Executive";
    }
    return null;
  };

  const getAdvtNo = (obj) => {
    if (obj?.advtNo) return obj.advtNo;
    if (obj?.title) {
      const match = obj.title.match(/Advt\. No\. ([^/ ]+)/i);
      if (match) return match[1].trim();
    }
    return null;
  };

  const advtNo = getAdvtNo(exam) || getAdvtNo(application) || "N/A";
  const postEn = getDetectedPost(exam) || getDetectedPost(application) || "District Manager";
  const postHi = exam?.post?.hi || exam?.postTitle?.hi || application?.jobPostingId?.post?.hi || (postEn === "District Manager" ? "जिला प्रबंधक" : "प्रखंड पर्यवेक्षक सह पंचायत कार्यपालक");

  const recruitmentTitle = `Recruitment for the Post of ${postEn} Advt. No. ${advtNo} / ${postHi} पद हेतु भर्ती विज्ञप्ति संख्या: ${advtNo}`;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 bg-white min-h-screen" style={{ fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2.5 px-6 py-3 mb-2 bg-white text-[#3F6212] border-2 border-[#4D7C0F] rounded-lg font-bold text-[17px] shadow-sm hover:bg-[#4D7C0F] hover:text-white transition-all group"
          style={{ fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Exams / पीछे जाएं</span>
        </button>

        {/* ── Recruitment Info Table ── */}
        <div className="border border-[#D9F99D] rounded overflow-hidden shadow-sm">
          {/* Top Title Bar */}
          <div className="p-3 text-center border-b border-[#D9F99D] font-bold text-sm text-white leading-relaxed" style={{ background: "linear-gradient(100deg,#3F6212 0%,#4D7C0F 55%,#65A30D 100%)" }}>
            {recruitmentTitle}
          </div>

          {/* Advt & Date Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-[#D9F99D] border-b-2 border-[#ECFCCB] bg-[#D9F99D]">
            <div className="p-4 text-center">
              <div className="font-black text-xs text-black mb-1 uppercase tracking-tighter">Advt No: {advtNo}</div>
              <div className="flex justify-center gap-4 text-[11px] font-black text-black">
                <div className="bg-white/50 px-2 py-0.5 rounded border border-[#D9F99D]">START: {exam?.mouStartDate ? new Date(exam.mouStartDate).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                <div className="bg-white/50 px-2 py-0.5 rounded border border-[#D9F99D]">END: {exam?.mouEndDate ? new Date(exam.mouEndDate).toLocaleDateString() : new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="p-4 text-center">
              <div className="font-black text-xs text-black mb-1 uppercase tracking-tighter">विज्ञापन संख्या: {advtNo}</div>
              <div className="flex justify-center gap-4 text-[11px] font-black text-black">
                <div className="bg-white/50 px-2 py-0.5 rounded border border-[#D9F99D]">प्रारंभ तिथि: {exam?.mouStartDate ? new Date(exam.mouStartDate).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                <div className="bg-white/50 px-2 py-0.5 rounded border border-[#D9F99D]">समाप्ति तिथि: {exam?.mouEndDate ? new Date(exam.mouEndDate).toLocaleDateString() : new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Detailed Info Rows */}
          <TableRow
            labelEn="Post" labelHi="पद"
            valueEn={postEn}
            valueHi={postHi}
          />

          <div className="bg-[#D9F99D] text-black p-2 text-center font-extrabold text-xs flex items-center justify-center gap-4 border-b border-[#D9F99D]">
            <span>💰 FEE STRUCTURE / शुल्क संरचना 💰</span>
          </div>

          <TableRow
            labelEn="Training Fee" labelHi="प्रशिक्षण शुल्क"
            valueEn={`₹${feeDetails?.trainingFee || 800}/-`} valueHi={`₹${feeDetails?.trainingFee || 800}/-`}
          />
          <TableRow
            labelEn="ID Card & Kit Fee" labelHi="आईडी कार्ड एवं किट शुल्क"
            valueEn={`₹${feeDetails?.idCardFee || 100}/-`} valueHi={`₹${feeDetails?.idCardFee || 100}/-`}
          />
          <TableRow
            labelEn="Dashboard / Software Access Fee" labelHi="डैशबोर्ड / सॉफ्टवेयर एक्सेस शुल्क"
            valueEn={`₹${feeDetails?.softwareFee || 640}/-`} valueHi={`₹${feeDetails?.softwareFee || 640}/-`}
          />
          <TableRow
            labelEn="Agreement / MOU Processing Fee" labelHi="एग्रीमेंट / एमओयू प्रोसेसिंग शुल्क"
            valueEn={`₹${feeDetails?.mouFee || 250}/-`} valueHi={`₹${feeDetails?.mouFee || 250}/-`}
          />

          {/* Total Row with emphasis in Dark Green */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-[#D9F99D] bg-[#D9F99D]">
            <div className="grid grid-cols-[160px_28px_1fr] border-b md:border-b-0 md:border-r border-[#D9F99D]">
              <div className="p-3 font-black text-sm text-black border-r border-[#D9F99D] flex items-center">Total  Fee</div>
              <div className="p-3 text-sm flex items-center justify-center bg-[#D9F99D] border-r border-[#D9F99D] text-black font-bold">:</div>
              <div className="p-3 text-lg font-black text-black flex items-center tracking-wider">₹{feeDetails?.totalAmount?.toLocaleString() || "1,790"}/-</div>
            </div>
            <div className="grid grid-cols-[160px_28px_1fr]">
              <div className="p-3 font-black text-sm text-black border-r border-[#D9F99D] flex items-center">कुल  शुल्क</div>
              <div className="p-3 text-sm flex items-center justify-center bg-[#D9F99D] border-r border-[#D9F99D] text-black font-bold">:</div>
              <div className="p-3 text-lg font-black text-black flex items-center tracking-wider">₹{feeDetails?.totalAmount?.toLocaleString() || "1,790"}/-</div>
            </div>
          </div>
        </div>

        {/* ── MOU Form Content ── */}
        <div className="bg-[#f5f5f5] p-6 rounded-lg border border-gray-200">
          <div className="text-center mb-8">
            <p className="text-[11px] font-semibold text-gray-500 mb-1">{recruitmentTitle}</p>
          </div>

          {/* 1. PERSONAL DETAILS */}
          <FormSectionHeader en="PERSONAL DETAILS" hi="व्यक्तिगत विवरण" />
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <FormLabel en="Applicant's Name" hi="अभ्यर्थी का नाम" />
                <FormInput value={application?.candidateName} readOnly />
              </div>
              <div>
                <FormLabel en="Father's/Husband Name" hi="पिता/पति का नाम" />
                <FormInput value={application?.fatherName} readOnly />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <FormLabel en="Mother's Name" hi="माता का नाम" required />
                <FormInput value={formData.motherName} onChange={(e) => setFormData({ ...formData, motherName: e.target.value })} />
              </div>
              <div>
                <FormLabel en="Date Of Birth" hi="जन्मतिथि" />
                <FormInput type="date" value={application?.dob ? new Date(application.dob).toISOString().split('T')[0] : ""} readOnly />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <FormLabel en="Mobile Number" hi="मोबाइल नंबर" />
                <FormInput value={application?.mobile} readOnly />
              </div>
              <div>
                <FormLabel en="Email ID" hi="ईमेल आईडी" />
                <FormInput value={application?.email} readOnly />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <FormLabel en="Aadhar Number" hi="आधार संख्या" />
                <FormInput value={application?.aadhar} readOnly />
              </div>
              <div>
                <FormLabel en="PAN Number" hi="पैन संख्या" required />
                <FormInput
                  value={formData.panNumber}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    if (val.length <= 10) setFormData({ ...formData, panNumber: val });
                  }}
                  placeholder="ABCDE1234F"
                  className={formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber) ? "border-red-500 bg-red-50" : ""}
                />
                {formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber) && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">Invalid PAN Card format</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Aadhaar Front */}
              <div>
                <FormLabel en="Aadhaar Card (Front Side)" hi="आधार कार्ड (सामने का हिस्सा)" required />
                <div className="flex items-center gap-2">
                  <input type="file" id="aadharFront" className="hidden" onChange={(e) => handleDocUpload(e, "aadharFront")} accept="image/*,.pdf" />
                  <label htmlFor="aadharFront" className={`flex-1 flex items-center gap-2 p-1 border border-dashed rounded cursor-pointer transition-all ${formData.aadharFront ? 'bg-[#ECFCCB] border-[#ECFCCB]' : 'bg-white border-gray-300 hover:border-[#4D7C0F] hover:bg-[#ECFCCB]'}`}>
                    {formData.aadharFront && (
                      <div className="w-10 h-10 rounded border overflow-hidden shrink-0 bg-white shadow-sm">
                        {formData.aadharFront.toLowerCase().endsWith('.pdf') ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500">
                            <FileText className="w-4 h-4" />
                            <span className="text-[7px] font-black">PDF</span>
                          </div>
                        ) : (
                          <img src={formData.aadharFront} className="w-full h-full object-cover" alt="Preview" />
                        )}
                      </div>
                    )}
                    <span className="text-xs font-bold text-[#4D7C0F] flex-1 text-center truncate">
                      {uploadingDoc === "aadharFront" ? "Uploading..." : (formData.aadharFront ? "Verified ✔ Change?" : "Choose File")}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">✔ JPG, PNG, PDF (High Quality)</p>
              </div>

              {/* Aadhaar Back */}
              <div>
                <FormLabel en="Aadhaar Card (Back Side)" hi="आधार कार्ड (पीछे का हिस्सा)" required />
                <div className="flex items-center gap-2">
                  <input type="file" id="aadharBack" className="hidden" onChange={(e) => handleDocUpload(e, "aadharBack")} accept="image/*,.pdf" />
                  <label htmlFor="aadharBack" className={`flex-1 flex items-center gap-2 p-1 border border-dashed rounded cursor-pointer transition-all ${formData.aadharBack ? 'bg-[#ECFCCB] border-[#ECFCCB]' : 'bg-white border-gray-300 hover:border-[#4D7C0F] hover:bg-[#ECFCCB]'}`}>
                    {formData.aadharBack && (
                      <div className="w-10 h-10 rounded border overflow-hidden shrink-0 bg-white shadow-sm">
                        {formData.aadharBack.toLowerCase().endsWith('.pdf') ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500">
                            <FileText className="w-4 h-4" />
                            <span className="text-[7px] font-black">PDF</span>
                          </div>
                        ) : (
                          <img src={formData.aadharBack} className="w-full h-full object-cover" alt="Preview" />
                        )}
                      </div>
                    )}
                    <span className="text-xs font-bold text-[#4D7C0F] flex-1 text-center truncate">
                      {uploadingDoc === "aadharBack" ? "Uploading..." : (formData.aadharBack ? "Verified ✔ Change?" : "Choose File")}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">✔ JPG, PNG, PDF (High Quality)</p>
              </div>

              {/* PAN Card */}
              <div>
                <FormLabel en="PAN Card" hi="पैन कार्ड" required />
                <div className="flex items-center gap-2">
                  <input type="file" id="panCard" className="hidden" onChange={(e) => handleDocUpload(e, "panCard")} accept="image/*,.pdf" />
                  <label htmlFor="panCard" className={`flex-1 flex items-center gap-2 p-1 border border-dashed rounded cursor-pointer transition-all ${formData.panCard ? 'bg-[#ECFCCB] border-[#ECFCCB]' : 'bg-white border-gray-300 hover:border-[#4D7C0F] hover:bg-[#ECFCCB]'}`}>
                    {formData.panCard && (
                      <div className="w-10 h-10 rounded border overflow-hidden shrink-0 bg-white shadow-sm">
                        {formData.panCard.toLowerCase().endsWith('.pdf') ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500">
                            <FileText className="w-4 h-4" />
                            <span className="text-[7px] font-black">PDF</span>
                          </div>
                        ) : (
                          <img src={formData.panCard} className="w-full h-full object-cover" alt="Preview" />
                        )}
                      </div>
                    )}
                    <span className="text-xs font-bold text-[#4D7C0F] flex-1 text-center truncate">
                      {uploadingDoc === "panCard" ? "Uploading..." : (formData.panCard ? "Verified ✔ Change?" : "Choose File")}
                    </span>
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">✔ JPG, PNG, PDF (High Quality)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div>
                <FormLabel en="Country" hi="देश" required />
                <FormSelect
                  value={formData.country}
                  onChange={handleCountryChange}
                  options={countries}
                />
              </div>
              <div>
                <FormLabel en="State" hi="राज्य" required />
                <FormSelect
                  value={formData.state}
                  onChange={handleStateChange}
                  options={states}
                  placeholder={fetchingStates ? "Loading..." : "--Please Select--"}
                />
              </div>
              <div>
                <FormLabel en="District" hi="जिला" required />
                <FormSelect
                  value={formData.district}
                  onChange={handleDistrictChange}
                  options={districts}
                  placeholder={fetchingDistricts ? "Loading..." : "--Please Select--"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <FormLabel en="Block / Khand / प्रखंड :" required />
                <FormInput
                  value={formData.blockKhand}
                  onChange={(e) => setFormData({ ...formData, blockKhand: e.target.value })}
                  placeholder="Type Block Name..."
                />
              </div>
              <div>
                <FormLabel en="Gram Panchayat / ग्राम पंचायत :" required />
                <FormInput
                  value={formData.gramPanchayat}
                  onChange={(e) => setFormData({ ...formData, gramPanchayat: e.target.value })}
                  placeholder="Type Panchayat Name..."
                />
              </div>
              <div>
                <FormLabel en="Post" hi="डाकघर" required />
                <FormInput value={formData.post} onChange={(e) => setFormData({ ...formData, post: e.target.value })} />
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <FormLabel en="At / Village / Tola" hi="ग्राम / टोला" required />
                <FormInput value={formData.villageTola} onChange={(e) => setFormData({ ...formData, villageTola: e.target.value })} />
              </div>
              <div>
                <FormLabel en="Ward No" hi="वार्ड संख्या" required />
                <FormInput value={formData.wardNo} onChange={(e) => setFormData({ ...formData, wardNo: e.target.value })} />
              </div>
              <div>
                <FormLabel en="Police Station (PS)" hi="थाना" required />
                <FormInput value={formData.policeStation} onChange={(e) => setFormData({ ...formData, policeStation: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>
                <FormLabel en="PIN Code" hi="पिन कोड" required />
                <FormInput value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} />
              </div>
            </div>
          </div>

          {/* 2. EDUCATION DETAILS */}
          <FormSectionHeader en="EDUCATION & OTHER DETAILS" hi="शिक्षा एवं अन्य विवरण" />

          {/* Saved Education Table (Mirroring Fee Structure UI) */}
          {formData.educationDetails.length > 0 && (
            <div className="mb-6 border border-[#D9F99D] rounded overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-[#D9F99D] text-black p-3 text-center font-extrabold text-sm flex items-center justify-center gap-4 border-b border-[#D9F99D]">
                <span>🎓 SAVED QUALIFICATIONS / शैक्षिक योग्यता विवरण 🎓</span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#D9F99D] text-black uppercase text-[11px] font-black">
                  <tr className="border-b border-[#D9F99D]">
                    <th className="px-4 py-3 border-r border-[#D9F99D]">Qualification / योग्यता</th>
                    <th className="px-4 py-3 border-r border-[#D9F99D]">Board / University / बोर्ड</th>
                    <th className="px-4 py-3 border-r border-[#D9F99D] text-center">Passing Year / उत्तीर्ण वर्ष</th>
                    <th className="px-4 py-3 border-r border-[#D9F99D] text-center">Marks / अंक (%)</th>
                    <th className="px-4 py-3 border-r border-[#D9F99D]">Marksheet / मार्कशीट</th>
                    <th className="px-4 py-3 text-center">Action / कार्य</th>
                  </tr>
                </thead>
                <tbody className="bg-[#ECFCCB] text-black divide-y divide-[#D9F99D]">
                  {formData.educationDetails.map((edu, idx) => (
                    <tr key={idx} className="hover:bg-[#D9F99D]/30 transition-colors">
                      <td className="px-4 py-3 border-r border-[#D9F99D] font-bold text-[13px]">{edu.level}</td>
                      <td className="px-4 py-3 border-r border-[#D9F99D] font-medium text-[13px]">{edu.board}</td>
                      <td className="px-4 py-3 border-r border-[#D9F99D] text-center font-bold text-[13px]">{edu.year}</td>
                      <td className="px-4 py-3 border-r border-[#D9F99D] text-center font-black text-[13px]">{edu.percentage}%</td>
                      <td className="px-4 py-3 border-r border-[#D9F99D]">
                        {edu.file ? (
                          <div className="flex items-center gap-2 text-[11px] font-bold text-[#3F6212] bg-white/50 px-3 py-1 rounded border border-[#D9F99D]">
                            <CheckCircle2 className="w-3 h-3 text-[#4D7C0F]" />
                            <span className="truncate max-w-[120px]">
                              {typeof edu.file === 'string' ? "Marksheet Uploaded" : edu.file.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-[11px] italic">No file uploaded</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeEducationRow(idx)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all border border-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Active Input Form row */}
          <div className="border border-[#D9F99D] bg-white rounded overflow-hidden shadow-sm mb-10 group transition-all">
            <div className="p-3 bg-[#D9F99D] border-b border-[#D9F99D] flex justify-between items-center">
              <h4 className="text-[12px] font-black text-black flex items-center gap-2 uppercase tracking-widest">
                <Plus className="w-5 h-5 bg-white p-1 rounded-full border border-[#D9F99D]" />
                ADD NEW QUALIFICATION / नई योग्यता जोड़ें
              </h4>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start bg-[#ECFCCB]/30">
              {/* Qualification Column */}
              <div className="md:col-span-3">
                <FormLabel en="Qualification / योग्यता :" required />
                <FormSelect
                  className="bg-white border-[#D9F99D]"
                  value={["10th", "12th", "Graduation"].includes(currentEdu.level) ? currentEdu.level : (currentEdu.level ? "Other" : "")}
                  options={["10th", "12th", "Graduation", "Other"]}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Other") {
                      setCurrentEdu({ ...currentEdu, level: "", isOther: true });
                    } else {
                      setCurrentEdu({ ...currentEdu, level: val, isOther: false });
                    }
                  }}
                />
                {currentEdu.isOther && (
                  <div className="mt-2 animate-in slide-in-from-top-1 duration-200">
                    <FormInput
                      placeholder="Type degree..."
                      value={currentEdu.level}
                      onChange={(e) => setCurrentEdu({ ...currentEdu, level: e.target.value })}
                      className="bg-white border-[#D9F99D]"
                    />
                  </div>
                )}
              </div>

              {/* Board Column */}
              <div className="md:col-span-3">
                <FormLabel en="Board/University / बोर्ड/विश्वविद्यालय :" required />
                <FormInput
                  className="bg-white border-[#D9F99D]"
                  value={currentEdu.board}
                  onChange={(e) => setCurrentEdu({ ...currentEdu, board: e.target.value })}
                  placeholder="e.g. CBSE / Delhi University"
                />
              </div>

              {/* Year Column */}
              <div className="md:col-span-2">
                <FormLabel en="Passing Year" hi="उत्तीर्ण वर्ष" required />
                <FormInput
                  className="bg-white border-[#D9F99D]"
                  type="number"
                  value={currentEdu.year}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length <= 4) setCurrentEdu({ ...currentEdu, year: val });
                  }}
                  placeholder="YYYY"
                />
              </div>

              {/* Marks Column */}
              <div className="md:col-span-2">
                <FormLabel en="Marks (%)" hi="अंक (%)" required />
                <FormInput
                  className="bg-white border-[#D9F99D]"
                  type="number"
                  value={currentEdu.percentage}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val || (parseFloat(val) >= 0 && parseFloat(val) <= 100)) {
                      setCurrentEdu({ ...currentEdu, percentage: val });
                    }
                  }}
                  placeholder="%"
                />
              </div>

              {/* Upload Column */}
              <div className="md:col-span-2">
                <FormLabel en="Marksheet" hi="मार्कशीट" />
                <div className="relative">
                  <input
                    type="file"
                    id="edu_file"
                    className="hidden"
                    onChange={(e) => setCurrentEdu({ ...currentEdu, file: e.target.files[0] })}
                  />
                  <label
                    htmlFor="edu_file"
                    className="flex flex-col items-center justify-center p-2 border border-[#D9F99D] rounded bg-white hover:bg-[#ECFCCB] cursor-pointer transition-all h-[42px]"
                  >
                    <div className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                      {currentEdu.file ? (
                        <span className="text-[#3F6212] truncate max-w-[100px]">{currentEdu.file.name}</span>
                      ) : (
                        <>Choose File</>
                      )}
                    </div>
                  </label>
                  <div className="text-[9px] text-gray-700 mt-1 uppercase font-bold tracking-tighter">PDF/JPG (High Quality)</div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-[#D9F99D] flex justify-end">
              <button
                type="button"
                onClick={handleSaveEducation}
                className="flex items-center gap-2 px-12 py-2.5 bg-[#4D7C0F] text-white rounded border border-[#D9F99D] hover:bg-[#3F6212] shadow shadow-[#D9F99D] transition-all font-black text-sm uppercase tracking-widest transform active:scale-95"
              >
                <Plus className="w-4 h-4" /> ADD
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <FormLabel en="Handicap / Disability" hi="विकलांगता" required />
              <FormSelect
                value={formData.handicapDisability}
                onChange={(e) => setFormData({ ...formData, handicapDisability: e.target.value })}
                options={["No", "Yes (Orthopedic)", "Yes (Visual)", "Yes (Hearing)", "Yes (Other)"]}
              />
            </div>
            <div>
              <FormLabel en="Marital Status" hi="वैवाहिक स्थिति" required />
              <FormSelect
                value={formData.maritalStatus}
                onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                options={["Unmarried", "Married", "Widowed", "Divorced"]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div className="relative">
              <FormLabel en="Language Known" hi="ज्ञात भाषाएं" required />
              <button
                type="button"
                onClick={() => setIsOpenLang(!isOpenLang)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#ECFCCB] outline-none text-sm min-h-[42px]"
              >
                <div className="flex flex-wrap gap-1">
                  {formData.language ? formData.language.split(", ").map(l => (
                    <span key={l} className="bg-[#ECFCCB] text-[#3F6212] px-3 py-1 rounded-full text-xs font-normal border border-[#D9F99D]">{l}</span>
                  )) : <span className="text-gray-400">--Select Languages--</span>}
                </div>
                <Plus className={`w-4 h-4 text-gray-400 transition-transform ${isOpenLang ? "rotate-45" : ""}`} />
              </button>

              {isOpenLang && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsOpenLang(false)}></div>
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-2 gap-1">
                      {["Hindi", "English", "Sanskrit", "Bhojpuri", "Bengali", "Maithili", "Odia", "Other"].map(lang => {
                        const isSelected = formData.language?.split(", ").includes(lang);
                        return (
                          <label key={lang} className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${isSelected ? "bg-[#ECFCCB]" : "hover:bg-gray-50"}`}>
                            <input
                              type="checkbox"
                              className="accent-[#4D7C0F]"
                              checked={isSelected}
                              onChange={() => {
                                const current = formData.language ? formData.language.split(", ").filter(l => l) : [];
                                const updated = isSelected ? current.filter(l => l !== lang) : [...current, lang];
                                setFormData({ ...formData, language: updated.join(", ") });
                              }}
                            />
                            <span className={`text-xs font-bold ${isSelected ? "text-[#3F6212]" : "text-gray-600"}`}>{lang}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div>
              <FormLabel en="Blood Group" hi="रक्त समूह" required />
              <FormSelect
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"]}
              />
            </div>
          </div>

          {/* 3. NOMINEE DETAILS */}
          <FormSectionHeader en="NOMINEE DETAILS" hi="नॉमिनी विवरण" />
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <FormLabel en="Nominee Name" hi="नॉमिनी का नाम" required />
                <FormInput value={formData.nomineeName} onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })} />
              </div>
              <div>
                <FormLabel en="Relationship" hi="अभ्यर्थी से संबंध" required />
                <FormSelect
                  value={formData.nomineeRelation}
                  onChange={(e) => setFormData({ ...formData, nomineeRelation: e.target.value })}
                  options={["Father", "Mother", "Spouse", "Son", "Daughter", "Brother", "Sister", "Guardian"]}
                />
              </div>
              <div>
                <FormLabel en="Nominee Age" hi="नॉमिनी की आयु" required />
                <FormInput
                  type="number"
                  value={formData.nomineeAge}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val || (parseInt(val) >= 1 && parseInt(val) <= 120)) {
                      setFormData({ ...formData, nomineeAge: val });
                    }
                  }}
                  placeholder="Age"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <FormLabel en="Nominee Aadhar No" hi="नॉमिनी आधार नं" required />
                <FormInput
                  value={formData.nomineeAadhar}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 12) setFormData({ ...formData, nomineeAadhar: val });
                  }}
                  placeholder="12 Digit Aadhar"
                />
              </div>
              <div>
                <FormLabel en="Nominee Mobile" hi="मोबाइल नंबर" required />
                <FormInput value={formData.nomineeMobile} onChange={(e) => setFormData({ ...formData, nomineeMobile: e.target.value })} />
              </div>
              <div>
                <FormLabel en="Nominee Email" hi="ईमेल" required />
                <FormInput type="email" value={formData.nomineeEmail} onChange={(e) => setFormData({ ...formData, nomineeEmail: e.target.value })} />
              </div>
            </div>
          </div>

          {/* 4. BANK DETAILS */}
          <FormSectionHeader en="BANK DETAILS" hi="बैंक विवरण" />
          <div className="space-y-6">
            <div className="w-full">
              <FormLabel en="Account Holder Name" hi="खाताधारक का नाम" required />
              <FormInput value={formData.accountHolderName} onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <span className="text-xs font-bold text-gray-700 block mb-1">Bank Name / बैंक का नाम : *</span>
                <FormSelect
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  options={INDIAN_BANKS}
                  placeholder="--Select Bank--"
                />
              </div>
              <div>
                <FormLabel en="Account Number" hi="खाता संख्या" required />
                <FormInput value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <FormLabel en="IFSC Code" hi="IFSC कोड" required />
                <FormInput value={formData.ifscCode} onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })} />
              </div>
              <div>
                <FormLabel en="Branch Name" hi="शाखा का नाम" required />
                <FormInput value={formData.branchName} onChange={(e) => setFormData({ ...formData, branchName: e.target.value })} />
              </div>
            </div>

            {/* Bank Document Upload */}
            <div className="w-full">
              <FormLabel en="Cancelled Cheque / Passbook (Upload)" hi="कैंसिल चेक / पासबुक (अपलोड)" required />
              <div className="flex items-center gap-4">
                <input type="file" id="bankDoc" className="hidden" onChange={(e) => handleDocUpload(e, "bankDoc")} accept="image/*,.pdf" />
                <label htmlFor="bankDoc" className={`flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${formData.bankDoc ? 'bg-[#ECFCCB] border-[#ECFCCB]' : 'bg-gray-50 border-gray-300 hover:border-[#4D7C0F] hover:bg-[#ECFCCB]'}`}>
                  {uploadingDoc === "bankDoc" ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ECFCCB]"></div>
                      <span className="text-xs font-bold text-gray-500">Uploading Document...</span>
                    </div>
                  ) : formData.bankDoc ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-20 h-20 rounded-lg border-2 border-[#D9F99D] overflow-hidden shadow-md bg-white">
                        {formData.bankDoc.toLowerCase().endsWith('.pdf') ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500">
                            <FileText className="w-8 h-8" />
                            <span className="text-[10px] font-black uppercase">PDF Format</span>
                          </div>
                        ) : (
                          <img src={formData.bankDoc} className="w-full h-full object-cover" alt="Bank Doc Preview" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-5 h-5 text-[#4D7C0F]" />
                        <span className="text-sm font-black text-[#3F6212] uppercase tracking-widest">Document Verified ✔</span>
                      </div>
                      <span className="text-[10px] text-[#4D7C0F] font-bold underline">Click to upload a different file</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <CreditCard className="w-8 h-8 text-gray-400" />
                      <div>
                        <span className="text-sm font-black text-gray-700 block uppercase">Upload Passbook or Cancelled Cheque</span>
                        <span className="text-[10px] text-[#4D7C0F] font-bold uppercase tracking-widest mt-1 block bg-[#ECFCCB] px-2 py-0.5 rounded">✔ JPG, PNG, PDF (High Quality)</span>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Declaration Section */}
          <div className="mt-12 p-6 bg-[#ECFCCB] rounded-xl border-2 border-[#D9F99D] space-y-6">
            <div className="flex gap-4 items-start">
              <input
                type="checkbox"
                id="declaration"
                className="mt-1 w-5 h-5 accent-[#4D7C0F] shrink-0 cursor-pointer"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
              />
              <label htmlFor="declaration" className="text-sm font-semibold text-gray-800 leading-relaxed cursor-pointer select-none">
                I hereby declare that the details furnished above are true and correct to the best of my knowledge and belief and I undertake to inform you of any changes therein, immediately. In case any of the above information is found to be false or untrue or misleading or misrepresenting, I am/may are aware that I/may be held liable for it.
              </label>
            </div>

            <div className="flex gap-4 items-center pl-0">
              <input
                type="checkbox"
                id="docVerify"
                className="w-5 h-5 accent-[#4D7C0F] shrink-0 cursor-pointer"
                checked={docsVerified}
                onChange={(e) => setDocsVerified(e.target.checked)}
              />
              <label
                htmlFor="docVerify"
                className="text-[#4D7C0F] font-bold underline hover:text-[#3F6212] flex items-center gap-2 transition-all cursor-pointer select-none text-sm"
              >
                <FileText className="w-5 h-5" />
                I’ve read and agree with the contract mentioned overleaf
              </label>
              {docsVerified && <CheckCircle2 className="w-5 h-5 text-[#4D7C0F] animate-in zoom-in" />}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-10">
            <button
              onClick={handlePayment}
              disabled={!formData.agreeToTerms || !docsVerified || isProcessing}
              className={`flex items-center justify-center gap-3 px-16 py-4 rounded-lg font-black text-xl transition-all transform active:scale-95 shadow-lg border-2 border-[#3F6212] ${formData.agreeToTerms && docsVerified && !isProcessing
                ? "bg-[#4D7C0F] text-white hover:bg-[#3F6212] shadow-[#D9F99D]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400 shadow-none"
                }`}
            >
              {isProcessing ? "PROCESSING..." : `SUBMIT & PAY ₹${feeDetails?.totalAmount?.toLocaleString() || "1,790"}/-`}
            </button>

            {/* MOCK PAYMENT BUTTON - ONLY FOR LOCALHOST TESTING */}
            {(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && (
              <button
                type="button"
                onClick={handleMockPayment}
                disabled={!formData.agreeToTerms || !docsVerified || isProcessing}
                className="text-[10px] font-bold text-red-500 hover:text-red-700 underline uppercase tracking-widest mt-2"
              >
                Dev Only: Mock Payment (Role Change Bypass)
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ── DOCUMENT MODAL ── */}
      {showDocModal && (
        <MOUModal
          isOpen={showDocModal}
          onClose={() => setShowDocModal(false)}
          onVerify={() => {
            setDocsVerified(true);
            setShowDocModal(false);
          }}
          application={application}
          formData={formData}
          empId={tempEmpId}
          exam={exam}
          detectedPost={postEn}
          detectedAdvtNo={advtNo}
        />
      )}
    </DashboardLayout>
  );
};

// ── MOU MODAL COMPONENT ──
const MOUModal = ({ isOpen, onClose, onVerify, application, formData, empId, exam, detectedPost, detectedAdvtNo }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [viewedCount, setViewedCount] = useState(1);
  const logo = "/src/assets/docs/logo.png"; // Logo Path

  const tabs = [
    { title: "Authorization Letter", icon: <FileText className="w-4 h-4" /> },
    { title: "Letter of Consent", icon: <CheckCircle2 className="w-4 h-4" /> },
    { title: "MOU & Agreement", icon: <ShieldCheck className="w-4 h-4" /> },
    { title: "Identity Card", icon: <CreditCard className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">

        {/* Modal Header */}
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <FileText className="text-[#4D7C0F]" />
              Employment Contract Documents
            </h3>
            <p className="text-xs text-gray-500 font-medium">Please review all 4 documents carefully before signing</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <Plus className="w-6 h-6 rotate-45 text-gray-600" />
          </button>
        </div>

        {/* Tab Sidebar & Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tab Sidebar */}
          <div className="w-64 bg-gray-50 border-r p-2 space-y-2 overflow-y-auto">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveTab(idx);
                  if (idx + 1 > viewedCount) setViewedCount(idx + 1);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === idx
                  ? "bg-[#4D7C0F] text-white shadow-md"
                  : "text-gray-600 hover:bg-white hover:shadow-sm"
                  }`}
              >
                {tab.icon}
                {tab.title}
                {idx + 1 <= viewedCount && <CheckCircle2 className={`w-3 h-3 ml-auto ${activeTab === idx ? "text-white" : "text-[#ECFCCB]"}`} />}
              </button>
            ))}
          </div>

          {/* Content Viewer (Scrollable Content) */}
          <div className="flex-1 overflow-y-auto p-8 bg-gray-200">
            <div className="adm-keep bg-white mx-auto shadow-sm p-12 min-h-full max-w-[800px] border-t-8 border-[#4D7C0F] rounded-sm">

              {activeTab === 0 && <AuthorizationTemplate application={application} formData={formData} empId={empId} logo={logo} detectedPost={detectedPost} detectedAdvtNo={detectedAdvtNo} />}
              {activeTab === 1 && <ConsentTemplate application={application} formData={formData} empId={empId} logo={logo} detectedPost={detectedPost} detectedAdvtNo={detectedAdvtNo} />}
              {activeTab === 2 && <MOUTemplate application={application} formData={formData} empId={empId} logo={logo} detectedPost={detectedPost} detectedAdvtNo={detectedAdvtNo} />}
              {activeTab === 3 && <IDCardTemplate application={application} formData={formData} empId={empId} logo={logo} detectedPost={detectedPost} detectedAdvtNo={detectedAdvtNo} />}

            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
          <p className="text-sm font-bold text-gray-500">
            Progess: {viewedCount}/4 Documents Viewed
          </p>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 font-bold text-gray-600 hover:text-gray-800 transition-colors"
            >
              Discard
            </button>
            <button
              disabled={viewedCount < 4}
              onClick={onVerify}
              className={`px-10 py-2 rounded-lg font-black transition-all ${viewedCount >= 4
                ? "bg-[#4D7C0F] text-white hover:bg-[#3F6212] shadow-md"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
              Verify & Accept Contract
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── DOCUMENT TEMPLATES ──

const AuthorizationTemplate = ({ application, formData, empId, logo, detectedPost, detectedAdvtNo }) => {
  const [goalConfigs, setGoalConfigs] = useState(null);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const tokenStr = localStorage.getItem("jssa_auth");
        const token = tokenStr ? JSON.parse(tokenStr).token : null;
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.jssabhiyan.com/api'}/goal-config/employee-configs`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data && data.data) {
           const map = {};
           data.data.forEach(item => {
             map[item.role] = item;
           });
           setGoalConfigs(map);
        }
      } catch (err) {
        console.error("Failed to fetch goal configs:", err);
      }
    };
    fetchConfigs();
  }, []);

  const currentDate = new Date().toLocaleDateString();
  const post = detectedPost || application?.post || application?.jobPostingId?.post?.en || "District Manager";

  const getDMCardRateText = () => {
    if (!goalConfigs || !goalConfigs['DM']) return "₹127 for each card created by you, and ₹10 per card for each card created by the Panchayat Executive and Block Supervisor of your district.";
    const dmConfig = goalConfigs['DM'];
    const ind = dmConfig.individualCommission || 127;
    const layers = dmConfig.layeredCommissions || [];
    const bsLayer = layers.find(l => l.roleName === 'Block Supervisor' || l.roleName === 'BS')?.commission || 10;
    const peLayer = layers.find(l => l.roleName === 'Panchayat Executive' || l.roleName === 'PE')?.commission || 10;
    
    if (bsLayer === peLayer) {
        return `₹${ind} for each card created by you, and ₹${bsLayer} per card for each card created by the Panchayat Executive and Block Supervisor of your district.`;
    }
    return `₹${ind} for each card created by you, and ₹${peLayer} per card for each card created by the Panchayat Executive and ₹${bsLayer} per card for each card created by the Block Supervisor of your district.`;
  };

  const getBSCardRateText = () => {
    if (!goalConfigs || !goalConfigs['BS']) return "₹73 for each card created by you, and ₹10 per card for each card created by the Panchayat Executive of your Block. This amount will be credited to your wallet.";
    const bsConfig = goalConfigs['BS'];
    const ind = bsConfig.individualCommission || 73;
    const layers = bsConfig.layeredCommissions || [];
    const peLayer = layers.find(l => l.roleName === 'Panchayat Executive' || l.roleName === 'PE')?.commission || 10;
    
    return `₹${ind} for each card created by you, and ₹${peLayer} per card for each card created by the Panchayat Executive of your Block. This amount will be credited to your wallet.`;
  };

  const getPECardRateText = () => {
    if (!goalConfigs || !goalConfigs['PE']) return "₹63 per card created by you will be credited to your wallet. You can transfer the credited amount from your wallet to your bank account.";
    const peConfig = goalConfigs['PE'];
    const ind = peConfig.individualCommission || 63;
    
    return `₹${ind} per card created by you will be credited to your wallet. You can transfer the credited amount from your wallet to your bank account.`;
  };

  const getRMCardRateText = () => {
    if (!goalConfigs || !goalConfigs['RM']) return "Applicable layered commissions for cards created by Zonal Coordinators, District Managers, Block Supervisors, and Panchayat Executives in your state.";
    const config = goalConfigs['RM'];
    const layers = config.layeredCommissions || [];
    
    const zcLayer = layers.find(l => l.roleName === 'Zonal Coordinator' || l.roleName === 'ZC')?.commission || 30;
    const dmLayer = layers.find(l => l.roleName === 'District Manager' || l.roleName === 'DM')?.commission || 10;
    const bsLayer = layers.find(l => l.roleName === 'Block Supervisor' || l.roleName === 'BS')?.commission || 10;
    const peLayer = layers.find(l => l.roleName === 'Panchayat Executive' || l.roleName === 'PE')?.commission || 10;
    
    return `₹${zcLayer} per card for each card created by the Zonal Coordinator, ₹${dmLayer} per card for each card created by the District Manager, ₹${bsLayer} per card for each card created by the Block Supervisor, and ₹${peLayer} per card for each card created by the Panchayat Executive in your state.`;
  };

  const getZCCardRateText = () => {
    if (!goalConfigs || !goalConfigs['ZC']) return "₹140 for each card created by you, and applicable layered commissions for cards created by your team.";
    const config = goalConfigs['ZC'];
    const ind = config.individualCommission || 140;
    return `₹${ind} for each card created by you, and applicable layered commissions for cards created by District Managers, Block Supervisors, and Panchayat Executives in your zone.`;
  };

  const getRMSalary = () => {
    let salary = 35500;
    if (goalConfigs && goalConfigs['RM']) {
      const rmConfig = goalConfigs['RM'];
      salary = rmConfig.baseSalary || 35500;
      
      const candidateState = formData?.state || '';
      if (candidateState && rmConfig.stateSalaries && rmConfig.stateSalaries.length > 0) {
         const cleanState = candidateState.split(" / ")[0].trim();
         const stateObj = rmConfig.stateSalaries.find(s => s.state?.toLowerCase() === cleanState.toLowerCase());
         if (stateObj && stateObj.salary) {
            salary = stateObj.salary;
         }
      }
    }
    return `₹${salary.toLocaleString('en-IN')} per month`;
  };

  // Configuration for different posts
  const postDetails = {
    "Regional Manager": {
      refPrefix: "AL/RM",
      subj: "REGIONAL MANAGER",
      offer: "Regional Manager",
      loc: `State of ${formData?.state || ''}`,
      execTitle: "REGIONAL MANAGER",
      salary: getRMSalary(),
      isRM: true,
      cardRate: getRMCardRateText(),
      footerCode: "mou_2933 Regional Manager"
    },
    "Zonal Coordinator": {
      refPrefix: "AL/ZC",
      subj: "ZONAL COORDINATOR",
      offer: "Zonal Coordinator",
      loc: `Zone of ${formData?.state || ''}`,
      execTitle: "ZONAL COORDINATOR",
      salary: "₹30,500 per month",
      cardRate: getZCCardRateText(),
      footerCode: "mou_2933 Zonal Coordinator"
    },
    "District Manager": {
      refPrefix: "AL",
      subj: "DISTRICT Manager",
      offer: "DISTRICT Manager",
      loc: `${formData.district}, ${formData.state}`,
      execTitle: "DISTRICT EXECUTIVE",
      salary: "₹25,500 per month",
      cardRate: getDMCardRateText(),
      footerCode: "mou_2933 District Manager"
    },
    "Block Supervisor Cum Panchayat Executive": {
      refPrefix: "BR/BSCPE",
      subj: "Block Supervisor Cum Panchayat Executive",
      offer: "Block Supervisor cum Panchayat Executive",
      loc: `${formData.block} Block, ${formData.district} District (${formData.state})`,
      execTitle: "Block Supervisor Cum Panchayat Executive",
      salary: "₹14,500 per month",
      cardRate: getBSCardRateText(),
      footerCode: "mou_2933 Block Supervisor HR"
    },
    "Panchayat Executive": {
      refPrefix: "BR/PE",
      subj: "Panchayat Executive",
      offer: "Panchayat Executive",
      loc: `${formData.villageTola}, ${formData.block} Block, ${formData.district} District (${formData.state})`,
      execTitle: "Panchayat Executive",
      salary: "₹12,500 per month",
      cardRate: getPECardRateText(),
      footerCode: "mou_2933 Panchayat Executive"
    }
  };

  const details = postDetails[post] || postDetails["District Manager"];

  return (
    <div className="text-[12px] leading-relaxed text-gray-800 font-sans">
      <div className="mb-0 text-left">
        <div className="text-[11px] font-bold">Ref. No. <span className="text-red-600 uppercase font-black tracking-tighter">JSSA/{details.refPrefix}/{empId.split('/').pop()}</span></div>
      </div>

      {/* Centered Header */}
      <div className="text-center mb-10 -mt-4">
        <img src={logo} alt="JSSA Logo" className="h-20 mx-auto mb-2" />
        <div className="text-2xl font-black text-green-700 font-hindi mb-1 leading-tight">जन स्वास्थ्य सहायता अभियान</div>
        <div className="text-[11px] font-black text-green-800 uppercase tracking-wide">Jan Swasthya Sahayata Abhiyan</div>
        <div className="text-[9px] text-gray-600 font-bold uppercase">A Project of Healthcare Research & Development Board</div>
        <div className="text-[8px] text-gray-500 font-medium">Organised Under “NAC”, Registration. No. 053083</div>
        <div className="w-full h-[3px] bg-gradient-to-r from-green-200 via-green-600 to-green-200 mt-2"></div>
      </div>

      <h2 className="text-center text-lg font-black underline mb-10 uppercase tracking-widest">Letter of Authorization</h2>

      <div className="space-y-1 mb-8">
        <div>To,</div>
        <div className="flex gap-2">
          <span>Dear Mr./Mrs.:</span>
          <span className="text-red-600 font-bold uppercase border-b border-red-200">{application?.candidateName}</span>
        </div>
        <div className="flex gap-2">
          <span>S/O(D/O):</span>
          <span className="text-red-600 font-bold uppercase border-b border-red-200">{application?.fatherName}</span>
        </div>
        <div className="flex gap-2">
          <span>DOB:</span>
          <span className="text-red-600 font-bold border-b border-red-200">{application?.dob ? new Date(application.dob).toLocaleDateString() : 'N/A'}</span>
        </div>
        <div className="flex gap-2">
          <span>Application No:</span>
          <span className="text-red-600 font-bold border-b border-red-200">{application?.applicationNumber}</span>
        </div>
        <div className="flex gap-2">
          <span>Employee ID:</span>
          <span className="text-red-600 font-bold border-b border-red-200 tracking-tighter uppercase font-black">JSSA/{details.refPrefix}/{empId.split('/').pop()}</span>
        </div>
      </div>

      <div className="font-bold mb-6 text-[13px] border-l-4 border-green-600 pl-4 py-1">
        Subject: Authorization for the post of <span className="text-gray-900 uppercase font-black">{details.subj}</span> in our organization.
      </div>

      <p className="mb-4 text-justify">
        Our organization is delighted offer you the authorization of <span className="font-black underline">{details.offer}</span> for
        <span className="text-red-600 font-black underline italic uppercase"> {details.loc} </span> on probation period for three months from the date of appointment.
        On expiry of the probationary period it is open for the management either to confirm your services or extend your probationary period.
        Such an extension can be granted for a maximum of 11 months more. The Management, however, reserves the right to terminate your services
        without assigning any reason during the probationary period, or the extended probationary period. However, during the probation period,
        services can be discontinued without any notice.
      </p>

      <p className="mb-4">Your selection has been made on the basis of educational qualification, experience and interview.</p>

      <p className="mb-4 text-justify italic font-medium leading-relaxed">As the <span className="font-black underline uppercase text-gray-900">{details.execTitle}</span>, you will be responsible for full-fill the target of our organization's project JAN SWASTHYA SAHAYATA ABHIYAN in your jurisdiction where you are posted & follow the instructions of your senior officer.</p>

      <p className="mb-4">Your employment with our organization will be on contract basis, which means you and the organization are free to terminate employment at any time, with or without cause or advance notice.</p>

      <div className="mb-4 font-bold border-l-4 border-green-600 pl-4 bg-green-50 p-4 rounded-r-lg shadow-sm">
        {!details.hideSalary && (
          <p>
            {details.isRM 
              ? `If your team achieves 75% of their monthly target, your income will be ` 
              : `If you meet the monthly target set by the organization, your initial income will be `}
            <span className="text-green-600 font-black text-base">{details.salary}</span>.
          </p>
        )}
        <p className={`text-[11px] text-gray-600 font-medium leading-relaxed italic ${!details.hideSalary ? 'mt-1 border-t border-green-100 pt-1' : ''}`}>
          {!details.hideSalary ? (details.isRM ? "If your team does not achieve the 75% target, then " : "If you do not meet the monthly target set by the organization, then ") : ""}
          <span className="text-gray-800">{details.cardRate}</span>
        </p>
      </div>

      <p className="mb-6 leading-relaxed">
        In addition to the national holiday, you will be granted 18 casual leave in a year for which you will have to inform your senior officer of organization. If you are absent for 11 consecutive days in a month without notice, your service will be terminated by giving you a notice.
        You will report directly to our HR department on email: <span className="font-black text-[#3F6212] underline">joining.HR@JSSABHIYAN.COM</span> Working hours are from <span className="font-bold">10:00 AM</span> to <span className="font-bold">06:00PM</span> (Everyday of week)
      </p>

      <div className="my-10 p-4 border bg-gray-50 rounded italic text-center font-bold text-gray-600">
        Please confirm acceptance of this offer by signing and returning this letter within 5 days from the date of issue.
      </div>

      {/* Signature Section */}
      <div className="mt-16 relative">
        <div className="flex justify-between px-4 items-start">
          <div className="space-y-1">
            <div className="font-bold text-sm mb-2 italic underline underline-offset-4">Yours Sincerely</div>
            <div className="font-black text-green-800 text-[11px] tracking-tighter mb-4 uppercase">JAN SWASTHYA SAHAYATA ABHIYAN</div>
            <div className="w-40 h-20 flex items-center justify-start border-b-2 border-green-100 mb-2">
              <img
                src="/src/assets/docs/district_manger/sing.png"
                alt="Authorized Signatory"
                className="max-h-full max-w-full mix-blend-multiply opacity-90 contrast-125"
              />
            </div>
            <div className="text-[9px] font-black text-[#1A2E05] border-2 border-[#1A2E05] px-2 py-0.5 inline-block uppercase italic mb-8 shadow-sm">
              Authorized Signatory
            </div>

            <div className="text-[10px] leading-tight space-y-1 font-bold text-gray-700 border-l-2 border-gray-200 pl-4">
              <div className="flex gap-1 items-center">
                For JAN SWASTHYA SAHAYATA ABHIYAN
                <span className="text-gray-500 font-medium text-[9px] bg-gray-100 px-2 rounded-full border border-gray-200 uppercase tracking-tighter">
                  {details.footerCode}
                </span>
              </div>
              <div className="flex gap-2">HR Department Date: <span className="text-red-500 font-black">{new Date().toLocaleString()}</span></div>
              <div className="flex gap-2">
                JAN SWASTHYA SAHAYATA ABHIYAN Place :
                <span className="text-red-600 font-black uppercase underline">
                  {details.loc.includes('Block') ? details.loc : `${formData.district} (${formData.state})`}
                </span>
              </div>
              <div className="text-[9px] font-medium text-gray-500 mt-2 space-y-0.5 flex flex-col">
                <span>A project of Healthcare Research and Development</span>
                <span>(Organized under NAC RegNo:053083)</span>
                <span>Registered under Companies Act 2013 under the provision of section 8</span>
              </div>
            </div>
          </div>

          <div className="text-center relative">
            <div className="font-bold text-xs text-gray-400 mb-2 italic border-b border-gray-100 pb-1">Acceptance Signature</div>
            <div className="bg-sky-50 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] p-2 rounded-xl border-2 border-sky-100 mb-2 w-52 h-24 flex items-center justify-center overflow-hidden">
              {application?.signature ? (
                <img
                  src={application.signature}
                  alt="Candidate Signature"
                  className="max-h-full max-w-full mix-blend-multiply transition-all grayscale contrast-125 hover:grayscale-0"
                />
              ) : (
                <div className="text-[8px] text-sky-300 italic font-black uppercase tracking-widest">Digital Authentication Required</div>
              )}
            </div>
            <div className="text-green-600 font-black text-[12px] uppercase tracking-tighter border-b-4 border-green-500 inline-block px-4 pb-0.5">
              {application?.candidateName}
            </div>
            <div className="text-[8px] text-gray-400 font-bold uppercase mt-1 tracking-[0.2em]">Digitally Signed By Candidate</div>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-4 border-t border-gray-100 text-right text-[8px] text-gray-400 font-black italic tracking-widest">
        Page 1/2
      </div>
    </div>
  );
};

const ConsentTemplate = ({ application, formData, empId, logo, detectedPost, detectedAdvtNo }) => {
  const currentDate = new Date().toLocaleString();
  const post = detectedPost || application?.post || application?.jobPostingId?.post?.en || "District Manager";

  const postConfigs = {
    "Regional Manager": {
      consentPost: "REGIONAL MANAGER",
      pointPost: "REGIONAL MANAGER",
      execPost: "REGIONAL MANAGER",
      footerPost: "REGIONAL MANAGER"
    },
    "Zonal Coordinator": {
      consentPost: "ZONAL COORDINATOR",
      pointPost: "ZONAL COORDINATOR",
      execPost: "ZONAL COORDINATOR",
      footerPost: "ZONAL COORDINATOR"
    },
    "District Manager": {
      consentPost: "DISTRICT MANAGER",
      pointPost: "DISTRICT MANAGER",
      execPost: "DISTRICT EXECUTIVE",
      footerPost: "DISTRICT EXECUTIVE"
    },
    "Block Supervisor Cum Panchayat Executive": {
      consentPost: "Block Supervisor cum Panchayat Executive",
      pointPost: "Block Supervisor cum Panchayat Executive",
      execPost: "Block Supervisor cum Panchayat Executive",
      footerPost: "Block Supervisor"
    },
    "Panchayat Executive": {
      consentPost: "Panchayat Executive",
      pointPost: "Panchayat Executive",
      execPost: "Panchayat Executive",
      footerPost: "Panchayat Executive"
    }
  };

  const config = postConfigs[post] || postConfigs["District Manager"];

  const points = [
    `Selection is being done by the social service organization NAC (which is registered under the Companies Act 2013 (section 8)) under JAN SWASTHYA SAHAYATA ABHIYAN against the post of ${config.pointPost}`,
    `Facilities given to permanent employees will not be admissible as ${config.pointPost}`,
    "Selection will be purely on contract basis and neither the permanent employee of the organization nor the organization will be entitled for regularization in the service.",
    "This selection will be for a probationary period of 3 months from the date of appointment. On expiry of the probationary period it is open for the management either to confirm your services or extend your probationary period. Such an extension can be granted for a maximum of 11 months more, The Management, however, reserves the right to terminate your services without assigning any reason during the probationary period, or the extended probationary period. However during the probation period, services can be discontinued without any notice.",
    "Legal action will be taken by terminating the service at any time after giving a notice to the selection received on the basis of wrong facts and papers.",
    "I have not committed a cognizable offense and have not been imprisoned in any case.",
    "selection may be terminated at any time as per the requirement or as decided by the Director of the organization.",
    "verification of wrong documents given by me, legal action will be taken against me and I will not be entitled for honorarium and incentive.",
    `The service of the selected ${config.execPost} is not satisfactory and does not follow the discipline, he will be terminated from service at any time by giving a notice.`,
    "Guidance and guidelines issued from time to time in JAN SWASTHYA SAHAYATA ABHIYAN will be effective.",
    "For each month a certain target will be given by the organization, my selection may be terminated if the target isnot met.",
    "I will be given honorarium and incentive for my service under the JAN SWASTHYA SAHAYATA ABHIYAN guideline. Apart from this, I will not make any claim of any kind",
    "I will be paid honorarium according to the monthly target by the organization, if I do not full fill the target given bythe organization, then I will not be entitled to honorarium and any kind of benefit.",
    "leavingthedistrict, Iwillinformtheconcernedofficerandactioncanbetakenagainstmeinabsencewithout notice.",
    "I will be regularly present in the review to be done by the JAN SWASTHYA SAHAYATA ABHIYAN or senior officer of the organization and action can be taken against me for giving any wrong information.",
    "Inthecaseofanycomplainttothecitizenofmyjurisdictionortheseniorofficeroftheorganization,the organization has full rights, they can take legal action against me at their discretion.",
    "I will be present in all the training and meeting as prescribed by the JAN SWASTHYA SAHAYATA ABHIYAN and senior officer of the organization.",
    "Iwillnotchargeanyextrafeefromanyotherorganizationandpersonotherthantheprescribedfeeofthisinstitution for the works prescribed in the JAN SWASTHYA SAHAYATA ABHIYAN, if I work against it, then the organization has full right to take action against me.",
    "This organization is a social service organization that works through contributions and donations, so the application fee, training fee and other expenses fees given by me as a contribution will not be refundable. I am not entitled to take this fee back from the organization.",
    `I have applied on my own free will and full discretion to work on the post of ${config.pointPost} in the organization, no pressure has been put on me for this.`
  ];

  return (
    <div className="text-[12px] leading-relaxed text-gray-800 font-sans">
      <div className="mb-0 text-left">
        <div className="text-[11px] font-bold uppercase">Ref. No. <span className="text-red-600 font-black">JSSA/LC/{empId.split('/').pop()}</span></div>
      </div>

      {/* Centered Header */}
      <div className="text-center mb-8 -mt-4">
        <img src={logo} alt="JSSA Logo" className="h-20 mx-auto mb-2" />
        <div className="text-2xl font-black text-green-700 font-hindi mb-1 leading-tight text-center">जन स्वास्थ्य सहायता अभियान</div>
        <div className="text-[11px] font-black text-green-800 uppercase tracking-wide">Jan Swasthya Sahayata Abhiyan</div>
        <div className="text-[9px] text-gray-600 font-bold uppercase">A Project of Healthcare Research & Development Board</div>
        <div className="text-[8px] text-gray-500 font-medium tracking-tighter text-center">Organised Under “NAC”, Registration. No. 053083</div>
        <div className="w-full h-[3px] bg-gradient-to-r from-green-200 via-green-600 to-green-200 mt-2"></div>
      </div>

      <h2 className="text-center text-lg font-black underline mb-6 uppercase tracking-widest">Letter of Consent</h2>

      <div className="flex gap-6 mb-8 items-start">
        <div className="flex-1 text-justify scale-y-105">
          This consent letter is being done on <span className="text-red-600 font-bold underline underline-offset-4">{currentDate}</span> between <span className="font-bold uppercase tracking-tighter underline">JAN SWASTHYA SAHAYATA ABHIYAN</span> (A project of Healthcare Research and Development Board organized under NAC which is registered under companies act 2013 (section 8) Reg.No:053083) and selected <span className="font-black text-gray-900 uppercase underline decoration-red-500">{config.consentPost}</span> <span className="text-red-600 font-black underline uppercase">{application?.candidateName}</span> S/O(D/O) <span className="text-red-600 font-black underline uppercase">{application?.fatherName}</span> Under <span className="font-bold underline">JAN SWASTHYA SAHAYATA ABHIYAN</span> with the following conditions.
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <div className="w-32 h-36 border-[3px] border-black p-0.5 bg-white shadow-xl rounded-sm overflow-hidden">
            <img src={application?.photo} alt="Photo" className="w-full h-full object-cover grayscale-[20%]" />
          </div>
          <div className="w-32 h-14 border-[3px] border-sky-300 p-1 bg-sky-50 shadow-inner rounded-sm overflow-hidden flex items-center justify-center">
            <img src={application?.signature} alt="Sign" className="max-w-full max-h-full mix-blend-multiply transition-all grayscale contrast-125" />
          </div>
        </div>
      </div>

      <div className="space-y-4 pr-2">
        {points.map((text, idx) => (
          <div key={idx} className="flex gap-3 text-justify leading-snug">
            <span className="font-black min-w-[20px] text-gray-400">{idx + 1}.</span>
            <p className={`${text.includes(config.pointPost) ? 'font-bold text-gray-900 underline decoration-gray-200' : 'text-gray-700 font-medium'}`}>{text}</p>
          </div>
        ))}
      </div>

      {/* Footer Block */}
      <div className="mt-16 flex justify-between items-start border-t border-gray-100 pt-8">
        <div className="space-y-1">
          <div className="font-black text-xs uppercase italic mb-8 border-b-2 border-gray-100 inline-block">Received By</div>
          <div className="w-44 h-20 flex items-center justify-start mb-2">
            <img
              src="/src/assets/docs/district_manger/sing.png"
              alt="Authorized Signatory"
              className="max-h-full max-w-full mix-blend-multiply opacity-90 contrast-125"
            />
          </div>
          <div className="text-[10px] leading-tight space-y-1 font-bold text-gray-700">
            <div className="uppercase tracking-tighter">For JAN SWASTHYA SAHAYATA ABHIYAN</div>
            <div>HR Department</div>
            <div className="uppercase tracking-tighter">JAN SWASTHYA SAHAYATA ABHIYAN</div>
            <div className="text-[8px] font-medium text-gray-500 uppercase mt-4 space-y-0.5 flex flex-col pt-2 border-t border-gray-50">
              <span>A project of Healthcare Research and Development</span>
              <span>(Organized under NAC RegNo:053083)</span>
              <span>Registered under Companies Act 2013 under the provision of section 8</span>
            </div>
          </div>
        </div>

        <div className="text-right space-y-1 pr-4">
          <div className="w-52 h-28 mb-4 flex items-center justify-center border-2 border-dashed border-sky-100 bg-sky-50/20 rounded-xl overflow-hidden shadow-inner">
            <img src={application?.signature} alt="Sign" className="max-w-full max-h-full mix-blend-multiply transition-all grayscale contrast-150" />
          </div>
          <div className="text-[14px] font-black text-gray-900 uppercase tracking-tighter underline underline-offset-4 decoration-red-500">
            {config.footerPost}
          </div>
          <div className="text-[10px] font-bold text-gray-500">Date: <span className="text-red-600 font-black">{new Date().toLocaleString()}</span></div>
          <div className="text-[10px] font-bold text-gray-500">Place: <span className="text-red-600 font-black uppercase underline">{formData.district} ({formData.state})</span></div>
        </div>
      </div>

      <div className="mt-12 text-center text-[9px] text-gray-300 font-black tracking-[0.5em] uppercase">
        Verfied Document JSSA/NAC/OFFICIAL
      </div>
    </div>
  );
};

const MOUTemplate = ({ application, formData, empId, logo, detectedPost, detectedAdvtNo }) => {
  const [goalConfigs, setGoalConfigs] = React.useState(null);

  React.useEffect(() => {
    const fetchGoalConfigs = async () => {
      try {
        const tokenStr = localStorage.getItem("jssa_auth");
        const token = tokenStr ? JSON.parse(tokenStr).token : null;
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.jssabhiyan.com/api'}/goal-config/employee-configs`, {
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
        });
        const data = await res.json();
        if (data.success) {
          const configsMap = {};
          data.data.forEach(c => configsMap[c.role] = c);
          setGoalConfigs(configsMap);
        }
      } catch (error) {
        console.error('Failed to fetch goal configs in MOUTemplate', error);
      }
    };
    fetchGoalConfigs();
  }, []);

  const getRMSalary = () => {
    let salary = 35500;
    if (goalConfigs && goalConfigs['RM']) {
      const rmConfig = goalConfigs['RM'];
      salary = rmConfig.baseSalary || 35500;
      const candidateState = formData?.state || '';
      if (candidateState && rmConfig.stateSalaries && rmConfig.stateSalaries.length > 0) {
         const cleanState = candidateState.split(" / ")[0].trim();
         const stateObj = rmConfig.stateSalaries.find(s => s.state?.toLowerCase() === cleanState.toLowerCase());
         if (stateObj && stateObj.salary) {
            salary = stateObj.salary;
         }
      }
    }
    return `Rs ${salary.toLocaleString('en-IN')} monthly`;
  };

  const currentDate = new Date().toLocaleDateString();
  const post = detectedPost || application?.post || application?.jobPostingId?.post?.en || "District Manager";

  const postConfigs = {
    "Regional Manager": {
      mouPost: "Regional Manager",
      execPost: "REGIONAL MANAGER",
      workLoc: `State of ${formData?.state || ''}`,
      salary: getRMSalary()
    },
    "Zonal Coordinator": {
      mouPost: "Zonal Coordinator",
      execPost: "ZONAL COORDINATOR",
      workLoc: `Zone of ${formData?.state || ''}`,
      salary: "Rs 30,500 monthly"
    },
    "District Manager": {
      mouPost: "DISTRICT Manager",
      execPost: "DISTRICT EXECUTIVE",
      workLoc: `${formData.district} District (${formData.state})`,
      salary: "Rs 25,500 monthly"
    },
    "Block Supervisor Cum Panchayat Executive": {
      mouPost: "Block Supervisor cum Panchayat Executive",
      execPost: "Block Supervisor Cum Panchayat Executive",
      workLoc: `${formData.block} Block, ${formData.district} District (${formData.state})`,
      salary: "Rs 14,500 monthly"
    },
    "Panchayat Executive": {
      mouPost: "Panchayat Executive",
      execPost: "Panchayat Executive",
      workLoc: `${formData.villageTola || 'Dausa'} Panchayat, ${formData.block || 'Dausa'} Block, ${formData.district || 'Dausa'} District (${formData.state || 'Rajasthan'})`,
      salary: "Rs 0 monthly"
    }
  };

  const config = postConfigs[post] || postConfigs["District Manager"];

  return (
    <div className="text-[11px] leading-relaxed text-gray-800 font-sans">
      {/* ─── PAGE 1 ─── */}
      <div className="mb-20">
        <div className="mb-0 text-left">
          <div className="text-[11px] font-bold">Ref. No. <span className="text-red-600">JSSA/ML/{empId.split('/').pop()}</span></div>
        </div>

        {/* Centered Header */}
        <div className="text-center mb-10 -mt-4">
          <img src={logo} alt="JSSA Logo" className="h-20 mx-auto mb-2" />
          <div className="text-2xl font-black text-green-700 font-hindi mb-1 leading-tight">जन स्वास्थ्य सहायता अभियान</div>
          <div className="text-[11px] font-black text-green-800 uppercase tracking-wide">Jan Swasthya Sahayata Abhiyan</div>
          <div className="text-[9px] text-gray-600 font-bold uppercase">A Project of Healthcare Research & Development Board</div>
          <div className="text-[8px] text-gray-500 font-medium tracking-tighter">Organised Under “NAC”, Registration. No. 053083</div>
          <div className="w-full h-[3px] bg-gradient-to-r from-green-200 via-green-600 to-green-200 mt-2"></div>
        </div>

        <h2 className="text-center text-lg font-black underline mb-8 uppercase tracking-widest">Memorandum Of Understanding Cum Agreement</h2>

        <p className="mb-6 text-justify">
          This MOU cum agreement is being done on <span className="text-red-600 underline font-bold">{currentDate}</span> between <span className="font-bold uppercase tracking-tight">JAN SWASTHYA SAHAYATA ABHIYAN</span> (A project of Healthcare Research and Development Board organized under NAC which is registered under companies act 2013 (section 8) Reg.No:053083) and selected <span className="font-black underline uppercase">{config.mouPost}</span> <span className="text-red-600 font-black underline uppercase">{application?.candidateName}</span> S/O(D/O) <span className="text-red-600 font-black underline uppercase">{application?.fatherName}</span> under <span className="font-bold uppercase tracking-tight">JAN SWASTHYA SAHAYATA ABHIYAN</span> with The following conditions
        </p>

        <div className="space-y-1 mb-8 border-l-4 border-red-500 pl-4 bg-red-50/30 py-2">
          <div className="font-bold">Dear Mr./Mrs.: <span className="text-red-600 uppercase underline">{application?.candidateName}</span></div>
          <div className="font-bold">S/O(D/O): <span className="text-red-600 uppercase underline">{application?.fatherName}</span></div>
          <div className="font-bold">DOB: <span className="text-red-600 underline">{application?.dob ? new Date(application.dob).toLocaleDateString() : 'N/A'}</span></div>
          <div className="font-bold">Application No: <span className="text-red-600 underline">{application?.applicationNumber}</span></div>
          <div className="font-bold">Employee ID: <span className="text-red-600 underline">{empId}</span></div>
        </div>

        <p className="mb-6 italic">The management of the Company congratulates you on your decision to join us. The terms and conditions of employment are as follows:</p>

        <div className="space-y-4">
          <div>
            <span className="font-black underline mr-2">1.0 Designation/Department:</span>
            Your designation shall be <span className="font-black uppercase underline">{config.execPost}</span>. You shall report to our HR department & email: (joining.jssabhiyan@gmail.com). These may change in the interest of the company, if required within the framework of your designation.
          </div>
          <div>
            <span className="font-black underline mr-2">2.0 Commencement:</span>
            Your period of employment commences After providing training and authorization letter.
          </div>
          <div>
            <span className="font-black underline mr-2">3.0 Place Of Work:</span>
            You will be posted in <span className="text-red-600 font-black uppercase underline">{config.workLoc}</span> but the Company reserves the right to transfer or depute you at any time from one to another district, block, panchayat branch office, subsidiary, associate companies or client locations situated anywhere in India or abroad, whether existing or acquired/established later on. Such transfer or deputation will be as per Company’s policies.
          </div>
          <div>
            <span className="font-black underline mr-2">4.0 Confirmation:</span>
            You will be on probation for Three months from the date of appointment. On expiry of the probationary period it is open for the management either to confirm your services or extend your probationary period. Such an extension can be granted for a maximum of 11 months more, The an agreement, however, reserves the right to terminate your services without assigning any reason during the probationary period, or the extended probationary period. However during the probation period, services can be continued without any notice.
          </div>
          <div>
            <span className="font-black underline mr-2">5.0 Compensation:</span>
            For this position, if you meet the monthly target given by the organization, then the initial Income will be from <span className="text-red-600 font-black underline">{config.salary}</span>. If you do not meet the monthly target given by the organization, you will get Label% the work you have done for the entire target for that month will be given to you as income for that month Payment is on the basis of wallet recharge through online.
          </div>
          <div>
            <span className="font-black underline mr-2">6.0 Benefits:</span>
            You will be entitled to Medical, LTA as per rules and regulations of the Company which may be in force from time to time and applicable to your category. Any taxes as per rules of the Income Tax Act or any other Government bodies at any time shall apply. The salary structure may change in case of change of Policies of the company.
          </div>
        </div>

        <div className="mt-20 text-right text-[8px] text-gray-400 italic">Page 1/5</div>
      </div>

      <div className="w-full border-t-2 border-dashed border-gray-300 my-12"></div>

      {/* ─── PAGE 2 ─── */}
      <div className="mb-20">
        <div className="space-y-4 pt-10">
          <div>
            <span className="font-black underline mr-2">7.0 Information Intimation:</span>
            Your appointment is based on information supplied by you. If it is found that you have <span className="font-bold underline">Misrepresented</span>, concealed or given any wrong information about your candidature at the time of your appointment, your services will be liable to be terminated without any notice or compensation.
            <div className="mt-2 pl-4">
              7.1 Whenever you change your present / local address for any reason you shall intimate the change to the Company, immediately.
            </div>
            <div className="pl-4">
              7.2 Your appointment is subject to your being certified medically fit.
            </div>
          </div>
          <div>
            <span className="font-black underline mr-2">8.0 Non-Disclosure:</span>
            You are requested to sign the “Non Disclosure Agreement” attached as Appendix ‘B’, which constitutes an integral part of your working conditions and agreements.
          </div>
          <div>
            <span className="font-black underline mr-2">9.0 Training:</span>
            During the course of your employment with the Company, the Company may impart you training for which you would be required to execute a Service and Surety Bond with the Company, assuring the Company of your service for a minimum fixed period. In case of separation from the company on your request, the company shall recover the amount as given in the Surety Bond.
          </div>
          <div>
            <span className="font-black underline mr-2">10.0 Leave:</span>
            In addition to the national holiday, you will be granted 18 casual leave in a year for which you will have to inform your senior officer of organization. If you are absent for 11 consecutive days in a month without notice, your service will be terminated by giving you a notice.
          </div>
          <div>
            <span className="font-black underline mr-2">11.0 Separation:</span>
            In the event that the Company or you decide to part ways, the basic rules governing the completion of this relationship shall be as follows:
          </div>
          <div>
            <span className="font-black underline mr-2">12.0 General:</span>
            We welcome you to our organization’s project Jan Swasthya Sahayata Abhiyan and wish you a successful, long and happy association.
          </div>
        </div>

        <div className="mt-12 font-bold mb-10">
          Please sign the duplicate copy of this letter and return the same to us as a token of your acceptance.
        </div>

        <div className="flex justify-between items-start mb-16">
          <div className="space-y-1">
            <div className="text-[10px] font-bold">With best regards Yours sincerely,</div>
            <div className="font-black text-green-800 text-[11px] mb-4">For Jan Swasthya Sahayata Abhiyan</div>
            <div className="w-40 h-16 flex items-center">
              <img src="/src/assets/docs/district_manger/sing.png" alt="Sign" className="max-h-full mix-blend-multiply transition-all contrast-125" />
            </div>
            <div className="text-[9px] font-bold text-[#3F6212] border-2 border-[#3F6212] p-1">AUTHORIZED SIGNATORY</div>
            <div className="text-[10px] space-y-1 pt-4">
              <div className="font-black">JAN SWASTHYA SAHAYATA ABHIYAN</div>
              <div className="text-[8px] font-medium text-gray-500 leading-tight">
                A project of Healthcare Research and Development (Organized under NAC RegNo:053083) Registered under Companies Act 2013 under the provision of section 8
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="w-48 h-24 mb-2 flex items-center justify-center border-b border-gray-200">
              <img src={application?.signature} alt="Sign" className="max-w-full max-h-full mix-blend-multiply transition-all grayscale contrast-150" />
            </div>
            <div className="font-black text-[12px] uppercase">{application?.candidateName}</div>
            <div className="text-[9px] font-bold text-gray-400">Digitally Signed By Candidate</div>
          </div>
        </div>

        <div className="space-y-4 text-[10px] bg-gray-50 p-4 rounded-lg">
          <p>I certify that I have read and understood and the contents of the this letter and agree to all the terms and conditions as outlined in the letter.</p>
          <p>I certify that this organization is a social service organization that works through contributions and donations, so the application fee, training fee and other expenses fees given by me as a contribution will not be refundable. I am not entitled to take this fee back from the organization.</p>
        </div>

        <div className="mt-10 text-right text-[8px] text-gray-400 italic">Page 2/5</div>
      </div>

      <div className="w-full border-t-2 border-dashed border-gray-300 my-12"></div>

      {/* ─── PAGE 3 ─── APPENDIX 'B' (NDA) ─── */}
      <div className="mb-20 pt-10">
        <div className="text-right font-black text-sm mb-4">APPENDIX 'B'</div>
        <h2 className="text-center text-lg font-black underline mb-8 uppercase">Non-Disclosure Agreement</h2>

        <p className="mb-6 text-justify">
          This Non-Disclosure Agreement (this "Agreement") is entered into this <span className="font-bold underline">{currentDate}</span> by and between <span className="font-black">Jan Swasthya Sahayata Abhiyan</span> (project of Healthcare Research & development Board, organized under NAC which is registered under Companies Act 2013 having its registration number 053083 under the provision of section 8) and <span className="font-black text-red-600 underline uppercase">{application?.candidateName}</span> S/O(D/O) <span className="font-black text-red-600 underline uppercase">{application?.fatherName}</span> (Recipient" or "Employee").
        </p>

        <div className="font-black mb-4">WITNESSETH</div>

        <div className="space-y-4 mb-8">
          <p>WHEREAS Employee has agreed to commence work as an Employee of organization and is signing an Employment Agreement to that effect;</p>
          <p>WHEREAS, Employee may be exposed and have access to confidential and/or proprietary information of the Company WHEREAS in order to induce such exposure and access, the parties hereto desire to undertake certain obligations of confidentiality, non-disclosure and non competition as set forth herein;</p>
          <p className="font-bold uppercase">NOW THEREFORE, in consideration of the mutual undertakings and promises herein, the Recipient hereby agrees as follows:</p>
        </div>

        <div className="space-y-6">
          <div>
            <span className="font-black underline mr-2 text-[12px]">1. Definitions</span>
            <p className="mt-2 text-justify">For purposes of this Agreement, the following definitions shall apply:</p>
            <div className="mt-3 space-y-4 pl-4">
              <p>"Affiliate" shall mean an entity controlled by, controlling or under common control with the Recipient, as used in this definition, the term "control" means the possession, directly or indirectly, of more than 50% of the voting stock of the controlled entity, or the power to direct, or cause the direction of the management and policy of the controlled entity.</p>
              <p>"Company" shall include Jan Swasthya Sahayata Abhiyan and any of its Affiliates.</p>
              <p>"Development" shall mean any invention, modification, discovery, design, development, improvement, process, software program, work of authorship, documentation, formula, data, technique, know-how, trade secret or intellectual property right whatsoever or any interest therein (whether or not patentable or registerable under copyright, trademark or similar statutes or subject to analogous protection), conceived by Recipient as a result of or in connection with performing the activities, obligations, efforts and / or Services described in the Commercial Agreement.</p>
              <p>"Confidential Information" means any and all information and know-how of a private, secret or confidential nature, in whatever form, that relates to the business, financial condition, technology and/or products of Jan Swasthya Sahayata Abhiyan, its Affiliates, customers, potential customers, employees or potential employees, provided or disclosed to the Recipient or which becomes known to the Recipient as a result of the Commercial Agreement, whether or not marked or otherwise designated as "confidential", "proprietary" or with any other legend indicating its proprietary nature. By way of illustration and not limitation, Confidential Information includes all forms and types of financial, business, technical, or engineering information and know-how, including but not limited to specifications, designs, techniques, compilations, inventions, developments, products, equipment, algorithms, computer programs (whether as source code or object code), marketing and customer, vendor and personal information, projections, plans and reports, and any other data, documentation, or information related thereto, as well as improvements thereof, whether in tangible or intangible form, and whether or not stored, compiled or memorialized in any media or in writing, including information disclosed as a result of any visitation, consultation or information disclosed by Jan Swasthya Sahayata Abhiyan or others on its behalf such as consultants, clients, employees and customers.</p>
            </div>
          </div>
        </div>

        <div className="mt-20 text-right text-[8px] text-gray-400 italic">Page 3/5</div>
      </div>

      <div className="w-full border-t-2 border-dashed border-gray-300 my-12"></div>

      {/* ─── PAGE 4 ─── Obligations Continued ─── */}
      <div className="mb-20 pt-10">
        <div className="space-y-6">
          <div>
            <span className="font-black underline mr-2 text-[12px]">2. Obligations of Confidentiality.</span>
            <div className="mt-3 space-y-4 pl-4 text-justify">
              <p>2.1 Recipient shall treat all Confidential Information disclosed to it as strictly confidential and not to exploit or make use, directly or indirectly, of such Confidential Information without the express written consent of the Company, except for the purpose of performing the activities, obligations, efforts and / or Services pursuant to the Commercial Agreement. Recipient shall assume full responsibility for enforcing this obligation and shall take appropriate measures with its employees to ensure that such persons are bound by a like covenant of secrecy, including but not limited to informing any of its employees receiving such Confidential Information that such Confidential Information shall not be disclosed except as provided herein.</p>
              <p>2.2 Recipient shall not copy or reproduce in any way (including without limitation, store in any computer or electronic system) any Confidential Information for purposes other than the performance of the activities, obligations, efforts and / or Services, without the Company's prior written consent.</p>
              <p>2.3 Recipient shall refrain from analyzing, reverse-engineering, decompiling, or disassembling or attempting to analyze Confidential Information in order to determine the construction, code, algorithm or topology (composition, formula or specifications) thereof, either by itself or through any third party. The disclosure of the Confidential Information by the Company shall not grant Recipient any express, implied or other license or rights to patents or trade secrets of the Company or their employees, whether or not patentable, nor shall it constitute or be deemed to create a partnership, joint venture or other undertaking.</p>
              <p>2.4 Recipient shall not remove or otherwise alter any of trademarks or service marks, serial numbers, logos, copyrights, notices or other proprietary notices or indicia, if any, fixed or attached to the confidential Information or any part thereof.</p>
              <p>2.5 If Recipient or anyone to whom Recipient has disclosed the Confidential Information with the consent of the Company is required to disclose any Confidential Information pursuant to the provisions of any applicable law - Recipient shall first notify the Company of such requirement and shall cooperate with the Company so that the Company may seek a protective order or prevent or minimize such disclosure.</p>
              <p>2.6 Recipient hereby assumes full responsibility for any damage caused to the Company as a result of the breach of this Agreement by it or by any of its employees and consultants, and shall take all appropriate measures to insure the non disclosure of the Confidential Information to any third party.</p>
            </div>
          </div>

          <div>
            <span className="font-black underline mr-2 text-[12px]">3. Return of Proprietary Information:</span>
            <p className="mt-2 pl-4 text-justify underline font-bold">Unless otherwise required by statute or government rule or regulation, upon demand by the Company, Recipient shall: (i) cease using the Confidential Information; (ii) immediately return to the Company all notes, copies and extracts thereof of the Confidential Information, in any form or media whatsoever without retaining copies thereof; and (iii) upon request of the Company, certify in writing that the Recipients have complied with the obligations set forth in this paragraph.</p>
          </div>

          <div>
            <span className="font-black underline mr-2 text-[12px]">4. Intellectual Property Rights.</span>
            <p className="mt-2 pl-4 italic">The Recipient hereby acknowledges and agrees that:</p>
            <p className="mt-2 pl-4 font-bold">The Confidential Information furnished hereunder is and shall remain proprietary to the Company.</p>
            <div className="mt-3 space-y-4 pl-4 text-justify">
              <p>4.1 It shall promptly disclose to the Company, without further compensation or consideration, all Development, and keep accurate records relating to the conception and reduction to practice of all such Development. Such records shall be the sole and exclusive property of the Company, and Recipient shall surrender possession of such records to the Company upon the request of the Company or upon the termination of the activities, obligations, efforts and / or Services of the Commercial Agreement at the latest.</p>
              <p>4.2 It hereby assigns to the Company, without further compensation and consideration, the entire right, title and interest in and to the Development and in and to all proprietary and any and all intellectual property rights therein or based thereon. Recipient shall execute all such assignments, oaths, declarations and other documents as may be prepared by the Company to effect the foregoing.</p>
            </div>
          </div>

          <div>
            <span className="font-black underline mr-2 text-[12px]">5. Non-Solicit.</span>
            <p className="mt-2 pl-4 font-medium italic underline">In addition to any other obligation Recipient may have towards the Company, Recipient agrees that for during the period of the Commercial Agreement and for one (1) year after the termination of the Commercial Agreement for any reason whatsoever, it will not, directly or indirectly:</p>
          </div>
        </div>

        <div className="mt-20 text-right text-[8px] text-gray-400 italic">Page 4/5</div>
      </div>

      <div className="w-full border-t-2 border-dashed border-gray-300 my-12"></div>

      {/* ─── PAGE 5 ─── Miscellaneous ─── */}
      <div className="mb-20 pt-10">
        <div className="space-y-4 pl-4 text-justify mb-10">
          <p>5.1 Engage whether as an employee, partner, joint venture, investor, director, consultant or otherwise, in any business activity which is directly or indirectly in competition anywhere in the world, with any of the products or services being developed, marketed, distributed, planned, sold or otherwise provided by the Company during the time of performing the activities, obligations, efforts and / or Services.</p>
          <p>5.2 (i) solicit, induce, recruit, hire or encourage any employee or consultant of the Company to leave such position, or attempt to do any of the foregoing, either for themselves or for any other person or entity, (ii) contact any customers of the Company for the purpose of selling or marketing to those customers any products or services which are the same as or substantially similar to, or competitive with, the products or services sold and/or provided by the Company in relation to its business at such date, or (iii) otherwise interfere in any manner with the contractual or employment relationship between the Company and any of its employees, consultants, employees or customers.</p>
        </div>

        <div>
          <span className="font-black underline mr-2 text-[12px]">6. Miscellaneous.</span>
          <div className="mt-3 space-y-4 pl-4 text-justify">
            <p>6.1 No failure or delay on the part of the parties to exercise any right, power or remedy under this Agreement shall operate as a waiver thereof, nor shall any single or partial exercise by either of the parties of any rights, powers or remedies. The rights, powers and remedies provided herein are cumulative and are not exclusive of any rights, powers or remedies by law.</p>
            <p>6.2 All notices and requests required or authorized hereunder shall be given in writing either by personal delivery, by registered mail, addressed to the party intended at its address set forth above, or by facsimile, and shall be deemed received as follows: notices served by hand upon delivery, notice served by facsimile the next business day following the delivery, provided however that such notice shall be followed by a telephone confirmation, and notice served by registered mail within seven (7) business days following delivery by registered mail, postage prepaid.</p>
            <p>6.3 This Agreement may be executed in two or more counterparts, each of which shall be deemed an original, but all of which together shall constitute one and the same instrument.</p>
            <p>6.4 This Agreement shall be governed by and construed and enforced in accordance with the laws of</p>
            <div className="pl-4">
              6.5 India, without regard to the principles of the conflict of laws. The competent courts within the city of Delhi, India, shall have exclusive jurisdiction to adjudicate any dispute arising out of this Agreement. Notwithstanding the foregoing, the Company may resort to any court of competent jurisdiction to obtain injunctive relief to prevent the disclosure of its information.
            </div>
            <p>6.6 This Agreement shall constitute the entire Agreement between the parties with respect to the confidentiality, non disclosure, proprietary nature of the Confidential Information and shall supersede any and all prior agreements and understandings relating thereto. No change, modification, alteration or addition of or to any provision of this Agreement shall be binding unless in writing and executed by or on behalf of all parties by a duly authorized representative.</p>
            <p>6.7 Recipient may not assign this Agreement without the prior written consent of the Company.</p>
            <p>6.8 The Company may assign this Agreement to any of its Affiliates and/or any entity which is the successor to any part of its business related to this Agreement by way of merger or acquirer of all or substantially all of its assets related to this Agreement and which agrees to assume all obligations of the assigning party under this Agreement from and after the date of such assignment.</p>
            <p>6.9 If any one or more of the terms contained in this Agreement shall for any reason be held to be excessively broad with regard to time, geographic scope or activity, that term shall be construed in a manner to enable it to be enforced to the extent compatible with applicable law. A determination that any term is void or unenforceable shall not affect the validity or enforceability of any other term or condition and any such invalid provision shall be construed and enforced (to the extent possible) in accordance with the original intent of the parties as herein expressed.</p>
            <p>6.10 The Recipient agrees that an impending or existing violation of any provision of this Agreement may cause the Company irreparable injury for which it would have no adequate remedy at law, and agrees that the Company shall be entitled to seek immediate injunctive relief prohibiting such violation, in addition to any other rights and remedies available to it.</p>
          </div>
        </div>

        <div className="mt-12 font-black italic underline mb-10 tracking-tighter">
          IN WITNESS WHEREOF the Employee has executed this Agreement as of the date first written above. EMPLOYEE
        </div>

        <div className="flex justify-between items-start mt-10">
          <div className="space-y-1">
            <div className="w-48 h-24 mb-2 flex items-center justify-center border-2 border-gray-100 bg-gray-50 rounded shadow-inner overflow-hidden">
              <img src={application?.signature} alt="Sign" className="max-w-full max-h-full mix-blend-multiply grayscale contrast-125" />
            </div>
            <div className="text-[10px] space-y-1">
              <div>Name: <span className="text-red-600 font-black uppercase underline">{application?.candidateName}</span></div>
              <div>S/O: <span className="text-red-600 font-black uppercase underline">{application?.fatherName}</span></div>
              <div>Title: <span className="font-black uppercase underline underline-offset-2">{config.execPost}</span></div>
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="w-40 h-20 flex items-center justify-end ml-auto">
              <img src="/src/assets/docs/district_manger/sing.png" alt="Sign" className="max-h-full mix-blend-multiply transition-all contrast-125" />
            </div>
            <div className="text-[9px] font-bold text-[#3F6212] border-2 border-[#3F6212] p-1 inline-block mb-4 uppercase scale-90 origin-right">AUTHORIZED SIGNATORY</div>
            <div className="text-[10px] space-y-0.5 leading-tight font-bold text-gray-700">
              <div>For JAN SWASTHYA SAHAYATA ABHIYAN</div>
              <div>HR Department</div>
              <div>JAN SWASTHYA SAHAYATA ABHIYAN</div>
              <div className="text-[8px] font-medium text-gray-400 mt-2">
                <div>A project of Healthcare Research and Development</div>
                <div>(Organized under NAC RegNo:053083)</div>
                <div>Registered under Companies Act 2013 under the provision of section 8</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 text-right text-[8px] text-gray-400 italic">Page 5/5</div>
      </div>
    </div>
  );
};




const IDCardTemplate = ({ application, formData, empId, logo, detectedPost, detectedAdvtNo }) => {
  const postLabels = {
    "Regional Manager": "REGIONAL MANAGER",
    "Zonal Coordinator": "ZONAL COORDINATOR",
    "District Manager": "DISTRICT EXECUTIVE",
    "Block Supervisor Cum Panchayat Executive": "BLOCK SUPERVISOR",
    "Panchayat Executive": "PANCHAYAT EXECUTIVE"
  };
  const postKey = detectedPost || application?.post || application?.jobPostingId?.post?.en || "District Manager";
  const designation = postLabels[postKey] || postLabels["District Manager"];

  return (
    <div className="flex justify-center items-center py-6 bg-gray-50 rounded-xl">
      <div className="w-[320px] h-[540px] bg-[#ECFCCB] rounded-lg overflow-hidden shadow-2xl relative flex flex-col font-sans border border-gray-300">

        {/* Header */}
        <div className="p-3 flex items-center gap-2 bg-[#ECFCCB]">
          <img src={logo} alt="Logo" className="w-12 h-12 object-contain bg-white rounded-full p-1 border border-green-500 shadow-sm" />
          <div className="flex-1">
            <div className="text-[13px] font-black text-[#1B5E20] leading-tight tracking-tighter">JAN SWASTHYA SAHAYATA ABHIYAN</div>
            <div className="text-[7px] font-bold text-black leading-tight">A Project of Healthcare Research & Development Board</div>
            <div className="text-[6.5px] font-medium text-black">Organisation “NAC”, Registration. No. : 053083</div>
          </div>
        </div>

        {/* Photo Section */}
        <div className="flex-1 relative flex flex-col items-center pt-4">
          <div className="z-10 w-32 h-36 bg-white border-[3px] border-black shadow-xl overflow-hidden rounded-sm">
            <img src={application?.photo} alt="Identity" className="w-full h-full object-cover" />
          </div>

          {/* Curved Green Wave */}
          <div className="absolute top-28 left-[-20%] w-[140%] h-[180px] bg-[#1B9E4B] rounded-[50%] flex flex-col items-center pt-14 shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
            <div className="text-white text-[16px] font-black uppercase tracking-wide px-4 text-center leading-tight">
              {application?.candidateName}
            </div>
            <div className="text-black text-[15px] font-black uppercase mt-1 tracking-wider">
              {designation}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="bg-[#ECFCCB] px-6 pb-4 pt-10 z-0">
          <div className="space-y-1 text-[10px] font-bold text-gray-800">
            <div className="flex">
              <span className="w-24">Father Name:</span>
              <span className="flex-1 uppercase">{application?.fatherName}</span>
            </div>
            <div className="flex text-black">
              <span className="w-24">ID No. :</span>
              <span className="flex-1 font-black">{empId}</span>
            </div>
            <div className="flex">
              <span className="w-24">Date of Birth :</span>
              <span className="flex-1">{application?.dob ? new Date(application.dob).toLocaleDateString() : '—'}</span>
            </div>
            <div className="flex">
              <span className="w-24">Email ID :</span>
              <span className="flex-1 text-[9px] lowercase opacity-80">{application?.email || '—'}</span>
            </div>
            <div className="flex">
              <span className="w-24">Location :</span>
              <span className="flex-1 uppercase italic">{formData.district}, {formData.state}</span>
            </div>
          </div>

          {/* Footer info */}
          <div className="mt-6 flex justify-between items-end">
            <div className="space-y-0.5">
              <div className="text-[#3F6212] text-[9px] font-black underline italic mb-1">For Any Enquiry :</div>
              <div className="text-[7.5px] font-bold text-gray-600 leading-tight">
                support@jssabhiyan-nac.in<br />
                www.jssabhiyan-nac.in<br />
                +91 - 9471987611
              </div>
            </div>
            <div className="w-16 h-16 bg-white p-1 border border-gray-300 rounded shadow-sm">
              <div className="w-full h-full bg-gray-50 flex flex-wrap gap-[1px] p-0.5 opacity-80">
                {/* Decorative QR Pattern */}
                {Array.from({ length: 49 }).map((_, i) => (
                  <div key={i} className={`w-[6px] h-[6px] ${Math.random() > 0.5 ? 'bg-black' : 'bg-transparent'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MOUForm;
