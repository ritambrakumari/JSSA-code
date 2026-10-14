import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { applicationsAPI, paymentsAPI, authAPI } from "../../utils/api";

// ── Static edit data ──────────────────────────────────────────────────────────
const STATIC_APPLICATIONS = {
  APP001: {
    candidateName: "Ramesh Kumar Singh",
    fatherName: "Suresh Kumar Singh",
    motherName: "Geeta Devi",
    dob: "1995-06-15",
    gender: "male",
    nationality: "indian",
    category: "general",
    aadhar: "1234 5678 9012",
    pan: "ABCDE1234F",
    mobile: "9876543210",
    email: "ramesh@email.com",
    address: "Village Rampur, Near SBI Bank, Ranchi",
    state: "jharkhand",
    district: "ranchi",
    block: "b1",
    panchayat: "p1",
    pincode: "834001",
    higherEducation: "B.Tech",
    board: "BIT Sindri, Jharkhand",
    marks: "680",
    markPercentage: "75.5",
  },
  APP002: {
    candidateName: "Priya Sharma",
    fatherName: "Vijay Sharma",
    motherName: "Sunita Sharma",
    dob: "1997-03-22",
    gender: "female",
    nationality: "indian",
    category: "obc",
    aadhar: "9876 5432 1098",
    pan: "XYZAB9876G",
    mobile: "9812345678",
    email: "priya@email.com",
    address: "Flat 12, Shanti Nagar, Dhanbad",
    state: "jharkhand",
    district: "dhanbad",
    block: "b2",
    panchayat: "p2",
    pincode: "826001",
    higherEducation: "MBA",
    board: "Xavier Institute, Ranchi",
    marks: "720",
    markPercentage: "80.0",
  },
};

const BLANK_FORM = {
  candidateName: "",
  fatherName: "",
  motherName: "",
  dob: "",
  gender: "",
  nationality: "",
  category: "",
  aadhar: "",
  pan: "",
  mobile: "",
  email: "",
  address: "",
  state: "",
  district: "",
  block: "",
  panchayat: "",
  pincode: "",
  higherEducation: "",
  board: "",
  marks: "",
  markPercentage: "",
};

// ── Input ─────────────────────────────────────────────────────────────────────
const InputField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  maxLength,
}) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
      className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm text-gray-800
        focus:outline-none focus:ring-1 focus:ring-[#3AB000] focus:border-[#3AB000]
        bg-white placeholder-gray-300 transition-all"
    />
  </div>
);

// ── Select ────────────────────────────────────────────────────────────────────
const SelectField = ({ label, name, value, onChange, options, required }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm text-gray-800
          focus:outline-none focus:ring-1 focus:ring-[#3AB000] focus:border-[#3AB000]
          bg-white appearance-none cursor-pointer transition-all"
      >
        <option value="">--Please Select--</option>
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
        <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  </div>
);

// ── Section Header ─────────────────────────────────────────────────────────────
const SectionHeader = ({ title }) => (
  <div className="bg-[#3AB000] px-4 py-2.5">
    <h3 className="text-sm font-bold text-white uppercase tracking-wide">
      {title}
    </h3>
  </div>
);

// ── Main Modal Component ──────────────────────────────────────────────────────
// Props:
//   isOpen     — boolean
//   onClose    — fn to close modal
//   onSuccess  — fn called after successful submit (to refresh list)
//   isEdit     — boolean (edit mode)
//   applicationId — id of application to edit (only when isEdit=true)

const AddApplicationModal = ({
  isOpen,
  onClose,
  onSuccess,
  isEdit = false,
  applicationId = null,
  jobPostingId = null,
}) => {
  const [form, setForm] = useState(BLANK_FORM);
  const [photo, setPhoto] = useState(null);
  const [signature, setSignature] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [agreed1, setAgreed1] = useState(false);
  const [agreed2, setAgreed2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userPhone, setUserPhone] = useState("");

  // Fetch user profile to get phone number
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        if (response.success && response.data?.user?.phone) {
          setUserPhone(response.data.user.phone);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setForm(BLANK_FORM);
      setPhoto(null);
      setSignature(null);
      setPhotoPreview(null);
      setSignaturePreview(null);
      setAgreed1(false);
      setAgreed2(false);
      setError(null);
      return;
    }
    if (isEdit && applicationId) {
      fetchApplicationData();
    }
  }, [isOpen, isEdit, applicationId]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const fetchApplicationData = async () => {
    setFetchLoading(true);
    setError(null);
    try {
      const response = await applicationsAPI.getById(applicationId);
      if (response.success && response.data) {
        const app = response.data.application;
        // Map API data to form format - only map fields that exist in the model
        // Other fields will remain empty/default
        setForm({
          candidateName: app.candidateName || "",
          fatherName: app.fatherName || "",
          motherName: app.motherName || "", // May not exist in DB
          dob: app.dob || "", // May not exist in DB
          gender: app.gender || "", // May not exist in DB
          nationality: app.nationality || "", // May not exist in DB
          category: app.category || "", // May not exist in DB
          aadhar: app.aadhar || "", // May not exist in DB
          pan: app.pan || "", // May not exist in DB
          mobile: app.mobile || "",
          email: app.email || "", // May not exist in DB
          address: app.address || "", // May not exist in DB
          state: app.state || "", // May not exist in DB
          district: app.district || "",
          block: app.block || "", // May not exist in DB
          panchayat: app.panchayat || "", // May not exist in DB
          pincode: app.pincode || "", // May not exist in DB
          higherEducation: app.higherEducation || "",
          board: app.board || "", // May not exist in DB
          marks: app.marks || "", // May not exist in DB
          markPercentage: app.markPercentage || "", // May not exist in DB
        });
        // Set photo and signature previews if available
        if (app.photo) {
          setPhotoPreview(app.photo);
        }
        if (app.signature) {
          setSignaturePreview(app.signature);
        }
      } else {
        throw new Error("Application not found");
      }
    } catch (err) {
      setError(err.message || "Failed to load application data");
      console.error("Fetch application data error:", err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleFile = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "photo") {
      setPhoto(file);
      setPhotoPreview(url);
    } else {
      setSignature(file);
      setSignaturePreview(url);
    }
  };

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const handlePayment = async (applicationId, gender, category) => {
    if (!jobPostingId || !gender || !category) {
      alert("Job posting, gender, and category are required for payment");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create Razorpay order
      const orderResponse = await paymentsAPI.createOrder(
        jobPostingId, 
        gender, 
        category, 
        applicationId,
        null // Token from localStorage
      );
      
      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.error || "Failed to create payment order");
      }

      const { orderId, amount, amountInRupees, keyId } = orderResponse.data;

      // Initialize Razorpay checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: "INR",
        name: "JSSA Application Fee",
        description: `Application Fee - ₹${amountInRupees}`,
        order_id: orderId,
        notes: {
          applicationId: applicationId,
          jobPostingId: jobPostingId,
        },
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await paymentsAPI.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              applicationId,
              null // Token from localStorage
            );

            if (verifyResponse.success) {
              alert("Payment successful! Application submitted.");
              if (onSuccess) {
                await onSuccess({ id: applicationId, paymentStatus: "paid" });
              }
              onClose();
            } else {
              alert("Payment verification failed. Please contact support.");
              setError("Payment verification failed");
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            alert("Payment verification failed. Please contact support.");
            setError(err.message || "Payment verification failed");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: form.candidateName || "",
          email: form.email || "",
          contact: userPhone || form.mobile || "",
        },
        theme: {
          color: "#3AB000",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setError("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed1 || !agreed2) {
      alert("Please accept both declarations.");
      return;
    }

    // Validate gender and category for payment
    if (jobPostingId && (!form.gender || !form.category)) {
      alert("Please select Gender and Category for payment processing.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Prepare form data - include mobile from user profile if not in form
      const applicationData = {
        ...form,
        // Use mobile from user profile if form doesn't have it
        mobile: form.mobile || userPhone || "",
        // Include job posting ID if applying from a specific job posting
        ...(jobPostingId && { jobPostingId }),
        // Include photo and signature if they are files (new uploads)
        // If they are URLs (existing), they should already be in the form
      };
      
      // First create/update the application
      let createdApplication;
      if (isEdit && applicationId) {
        // Update existing application
        const updateResponse = await applicationsAPI.update(applicationId, applicationData);
        if (updateResponse.success && updateResponse.data) {
          createdApplication = updateResponse.data.application;
        }
      } else {
        // Create new application
        const createResponse = await applicationsAPI.create(applicationData);
        if (createResponse.success && createResponse.data) {
          createdApplication = createResponse.data.application;
        }
      }

      if (!createdApplication) {
        throw new Error("Failed to create/update application");
      }

      const applicationIdValue = createdApplication._id || createdApplication.id;

      // If job posting ID exists, proceed with payment
      if (jobPostingId && form.gender && form.category) {
        // Check if fee is required
        try {
          const feeResponse = await paymentsAPI.calculateFee(jobPostingId, form.gender, form.category);
          if (feeResponse.success && feeResponse.data && feeResponse.data.amount > 0) {
            // Fee is required, initiate payment
            setLoading(false);
            await handlePayment(applicationIdValue, form.gender, form.category);
            return;
          }
        } catch (feeErr) {
          console.error("Fee calculation error:", feeErr);
          // Continue without payment if fee calculation fails
        }
      }

      // No payment required or payment flow completed
      if (onSuccess) {
        await onSuccess({ id: applicationIdValue });
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit application");
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center py-6 px-4 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* ── Modal Box ── */}
        <div className="bg-gray-100 rounded-sm shadow-2xl w-full max-w-3xl relative my-auto">
          {/* ── Modal Header ── */}
          <div className="flex items-center justify-between bg-[#3AB000] px-5 py-3 rounded-t-sm">
            <div>
              <h2 className="text-sm font-bold text-white">
                {isEdit ? "Edit Application" : "Add New Application"}
              </h2>
              <p className="text-[11px] text-green-100 mt-0.5">
                Recruitment for District Manager · JSSA/REQ/01/2025/P-III
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-1.5 rounded-sm transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Scrollable Body ── */}
          <div className="max-h-[80vh] overflow-y-auto p-4 space-y-4">
            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-sm flex items-center justify-between">
                <span>Error: {error}</span>
                <button
                  onClick={isEdit ? fetchApplicationData : () => setError(null)}
                  className="bg-red-500 text-white px-3 py-1 rounded-sm text-xs hover:bg-red-600"
                >
                  {isEdit ? "Retry" : "Dismiss"}
                </button>
              </div>
            )}

            {/* Skeleton while loading edit data */}
            {fetchLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className="bg-white rounded-sm border border-gray-200 overflow-hidden"
                  >
                    <div className="animate-pulse bg-gray-300 h-10" />
                    <div className="p-4 grid grid-cols-2 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="animate-pulse h-9 bg-gray-200 rounded-sm"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ── PERSONAL DETAILS ── */}
                <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
                  <SectionHeader title="Personal Details / व्यक्तिगत विवरण" />
                  <div className="p-4 space-y-4">
                    <InputField
                      label="Candidate's Name / अभ्यर्थी का नाम"
                      name="candidateName"
                      value={form.candidateName}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField
                        label="Father's Name / पिता का नाम"
                        name="fatherName"
                        value={form.fatherName}
                        onChange={handleChange}
                        placeholder="Father's full name"
                        required
                      />
                      <InputField
                        label="Mother's Name / माता का नाम"
                        name="motherName"
                        value={form.motherName}
                        onChange={handleChange}
                        placeholder="Mother's full name"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField
                        label="Date of Birth / जन्मतिथि"
                        name="dob"
                        value={form.dob}
                        onChange={handleChange}
                        type="date"
                        required
                      />
                      <SelectField
                        label="Gender / लिंग"
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        required
                        options={[
                          { v: "male", l: "Male / पुरुष" },
                          { v: "female", l: "Female / महिला" },
                          { v: "other", l: "Other / अन्य" },
                        ]}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SelectField
                        label="Nationality / राष्ट्रीयता"
                        name="nationality"
                        value={form.nationality}
                        onChange={handleChange}
                        required
                        options={[
                          { v: "indian", l: "Indian / भारतीय" },
                          { v: "other", l: "Other / अन्य" },
                        ]}
                      />
                      <SelectField
                        label="Category / श्रेणी"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        required
                        options={[
                          { v: "general", l: "General / सामान्य" },
                          { v: "obc", l: "OBC / अन्य पिछड़ा वर्ग" },
                          { v: "sc", l: "SC / अनुसूचित जाति" },
                          { v: "st", l: "ST / अनुसूचित जनजाति" },
                          { v: "ews", l: "EWS / आर्थिक रूप से कमजोर वर्ग" },
                        ]}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField
                        label="Aadhar Number / आधार संख्या"
                        name="aadhar"
                        value={form.aadhar}
                        onChange={handleChange}
                        placeholder="XXXX XXXX XXXX"
                        required
                        maxLength={14}
                      />
                      <InputField
                        label="PAN Number / पेन संख्या"
                        name="pan"
                        value={form.pan}
                        onChange={handleChange}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Mobile Number field hidden - using phone from user profile for Razorpay */}
                      <InputField
                        label="Email ID / ईमेल आईडी"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        type="email"
                        placeholder="example@email.com"
                        required
                      />
                    </div>
                    <InputField
                      label="Permanent Address / स्थाई पता"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Enter complete permanent address"
                      required
                    />
                  </div>
                </div>

                {/* ── ADDRESS DETAILS ── */}
                <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
                  <SectionHeader title="Address Details / पता विवरण" />
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SelectField
                        label="State / राज्य"
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        required
                        options={[
                          { v: "assam", l: "Assam / असम" },
                          { v: "bihar", l: "Bihar / बिहार" },
                          { v: "chhattisgarh", l: "Chhattisgarh / छत्तीसगढ़" },
                          { v: "delhi", l: "Delhi / दिल्ली" },
                          { v: "gujarat", l: "Gujarat / गुजरात" },
                          { v: "haryana", l: "Haryana / हरियाणा" },
                          { v: "jharkhand", l: "Jharkhand / झारखंड" },
                          { v: "madhya_pradesh", l: "Madhya Pradesh / मध्य प्रदेश" },
                          { v: "maharashtra", l: "Maharashtra / महाराष्ट्र" },
                          { v: "odisha", l: "Odisha / ओडिशा" },
                          { v: "rajasthan", l: "Rajasthan / राजस्थान" },
                          { v: "uttar_pradesh", l: "Uttar Pradesh / उत्तर प्रदेश" },
                          { v: "uttarakhand", l: "Uttarakhand / उत्तराखंड" },
                          { v: "west_bengal", l: "West Bengal / पश्चिम बंगाल" },
                        ]}
                      />
                      <SelectField
                        label="District / जिला"
                        name="district"
                        value={form.district}
                        onChange={handleChange}
                        required
                        options={[
                          { v: "ranchi", l: "Ranchi / रांची" },
                          { v: "dhanbad", l: "Dhanbad / धनबाद" },
                          { v: "jamshedpur", l: "Jamshedpur / जमशेदपुर" },
                          { v: "bokaro", l: "Bokaro / बोकारो" },
                          { v: "deoghar", l: "Deoghar / देवघर" },
                          { v: "hazaribagh", l: "Hazaribagh / हजारीबाग" },
                          { v: "giridih", l: "Giridih / गिरिडीह" },
                          { v: "patna", l: "Patna / पटना" },
                          { v: "gaya", l: "Gaya / गया" },
                          { v: "bhagalpur", l: "Bhagalpur / भागलपुर" },
                          { v: "muzaffarpur", l: "Muzaffarpur / मुजफ्फरपुर" },
                          { v: "lucknow", l: "Lucknow / लखनऊ" },
                          { v: "kanpur", l: "Kanpur / कानपुर" },
                          { v: "varanasi", l: "Varanasi / वाराणसी" },
                          { v: "agra", l: "Agra / आगरा" },
                          { v: "bhopal", l: "Bhopal / भोपाल" },
                          { v: "indore", l: "Indore / इंदौर" },
                          { v: "gwalior", l: "Gwalior / ग्वालियर" },
                          { v: "jaipur", l: "Jaipur / जयपुर" },
                          { v: "jodhpur", l: "Jodhpur / जोधपुर" },
                          { v: "udaipur", l: "Udaipur / उदयपुर" },
                          { v: "mumbai", l: "Mumbai / मुंबई" },
                          { v: "pune", l: "Pune / पुणे" },
                          { v: "nagpur", l: "Nagpur / नागपुर" },
                          { v: "ahmedabad", l: "Ahmedabad / अहमदाबाद" },
                          { v: "surat", l: "Surat / सूरत" },
                          { v: "vadodara", l: "Vadodara / वडोदरा" },
                          { v: "gurgaon", l: "Gurgaon / गुड़गांव" },
                          { v: "faridabad", l: "Faridabad / फरीदाबाद" },
                          { v: "panchkula", l: "Panchkula / पंचकुला" },
                          { v: "raipur", l: "Raipur / रायपुर" },
                          { v: "bilaspur", l: "Bilaspur / बिलासपुर" },
                          { v: "bhubaneswar", l: "Bhubaneswar / भुवनेश्वर" },
                          { v: "cuttack", l: "Cuttack / कटक" },
                          { v: "rourkela", l: "Rourkela / राउरकेला" },
                          { v: "dehradun", l: "Dehradun / देहरादून" },
                          { v: "haridwar", l: "Haridwar / हरिद्वार" },
                          { v: "nainital", l: "Nainital / नैनीताल" },
                          { v: "kolkata", l: "Kolkata / कोलकाता" },
                          { v: "howrah", l: "Howrah / हावड़ा" },
                          { v: "durgapur", l: "Durgapur / दुर्गापुर" },
                          { v: "guwahati", l: "Guwahati / गुवाहाटी" },
                          { v: "silchar", l: "Silchar / सिलचर" },
                          { v: "dibrugarh", l: "Dibrugarh / डिब्रूगढ़" },
                          { v: "new_delhi", l: "New Delhi / नई दिल्ली" },
                          { v: "north_delhi", l: "North Delhi / उत्तर दिल्ली" },
                          { v: "south_delhi", l: "South Delhi / दक्षिण दिल्ली" },
                          { v: "east_delhi", l: "East Delhi / पूर्व दिल्ली" },
                          { v: "west_delhi", l: "West Delhi / पश्चिम दिल्ली" },
                        ]}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <SelectField
                        label="Block / ब्लॉक"
                        name="block"
                        value={form.block}
                        onChange={handleChange}
                        options={[
                          { v: "b1", l: "Block 1" },
                          { v: "b2", l: "Block 2" },
                          { v: "b3", l: "Block 3" },
                        ]}
                      />
                      <SelectField
                        label="Panchayat / पंचायत"
                        name="panchayat"
                        value={form.panchayat}
                        onChange={handleChange}
                        options={[
                          { v: "p1", l: "Panchayat 1" },
                          { v: "p2", l: "Panchayat 2" },
                          { v: "p3", l: "Panchayat 3" },
                        ]}
                      />
                      <InputField
                        label="Postal Pin Code / डाक पिन कोड"
                        name="pincode"
                        value={form.pincode}
                        onChange={handleChange}
                        placeholder="XXXXXX"
                        required
                        maxLength={6}
                      />
                    </div>

                    {/* File Uploads */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Attach Photograph / फोटो संलग्न करें{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <label className="flex items-center gap-3 px-3 py-2.5 border border-dashed border-[#3AB000] bg-[#e8f5e2] rounded-sm cursor-pointer hover:bg-green-100 transition">
                          <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-[#3AB000] text-white flex-shrink-0">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path
                                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#3AB000] truncate max-w-[160px]">
                              {photo ? photo.name : "Choose File"}
                            </p>
                            <p className="text-xs text-gray-400">
                              Max file size: 3MB
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFile(e, "photo")}
                          />
                        </label>
                        {photoPreview && (
                          <img
                            src={photoPreview}
                            alt="photo"
                            className="mt-2 h-20 w-20 object-cover rounded-sm border border-[#bbf7d0]"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Attach Signature / हस्ताक्षर संलग्न करें{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <label className="flex items-center gap-3 px-3 py-2.5 border border-dashed border-[#3AB000] bg-[#e8f5e2] rounded-sm cursor-pointer hover:bg-green-100 transition">
                          <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-[#3AB000] text-white flex-shrink-0">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path
                                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#3AB000] truncate max-w-[160px]">
                              {signature ? signature.name : "Choose File"}
                            </p>
                            <p className="text-xs text-gray-400">
                              Max file size: 3MB
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFile(e, "signature")}
                          />
                        </label>
                        {signaturePreview && (
                          <img
                            src={signaturePreview}
                            alt="signature"
                            className="mt-2 h-20 w-32 object-contain rounded-sm border border-[#bbf7d0] bg-white p-1"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── EDUCATION DETAILS ── */}
                <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
                  <SectionHeader title="Education Details / शिक्षा विवरण" />
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField
                        label="Higher Education / उच्च शिक्षा"
                        name="higherEducation"
                        value={form.higherEducation}
                        onChange={handleChange}
                        placeholder="e.g. B.Tech, MBA, M.Sc"
                        required
                      />
                      <InputField
                        label="Board / University / विश्वविद्यालय"
                        name="board"
                        value={form.board}
                        onChange={handleChange}
                        placeholder="University or Board name"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField
                        label="Marks / अंक"
                        name="marks"
                        value={form.marks}
                        onChange={handleChange}
                        type="number"
                        placeholder="Total marks obtained"
                        required
                      />
                      <InputField
                        label="Mark Percentage / अंक प्रतिशत"
                        name="markPercentage"
                        value={form.markPercentage}
                        onChange={handleChange}
                        type="number"
                        placeholder="e.g. 75.5"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* ── DECLARATION ── */}
                <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
                  <SectionHeader title="Declaration / घोषणा" />
                  <div className="p-4 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreed1}
                        onChange={() => setAgreed1((v) => !v)}
                        className="mt-0.5 w-4 h-4 accent-[#3AB000] flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700">
                        I have read and agree to the{" "}
                        <span className="text-[#3AB000] font-semibold underline cursor-pointer">
                          Terms and Conditions
                        </span>
                        .
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreed2}
                        onChange={() => setAgreed2((v) => !v)}
                        className="mt-0.5 w-4 h-4 accent-[#3AB000] flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700">
                        I declare that all the information given in this
                        application form is correct to the best of my knowledge
                        and belief.
                      </span>
                    </label>
                  </div>
                </div>

                {/* ── ACTION BUTTONS ── */}
                <div className="flex justify-end gap-3 pb-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="border border-gray-300 text-gray-600 px-8 py-2.5 rounded-sm text-sm hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !agreed1 || !agreed2}
                    className="bg-[#3AB000] hover:bg-[#2d8a00] disabled:opacity-50 disabled:cursor-not-allowed
                      text-white px-10 py-2.5 rounded-sm text-sm font-semibold flex items-center gap-2 transition-colors"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          />
                        </svg>
                        {isEdit ? "Updating..." : "Submitting..."}
                      </>
                    ) : isEdit ? (
                      "Update Application"
                    ) : (
                      "Submit & Continue"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AddApplicationModal;
