import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { doctorsAPI } from "../../utils/api";
import { 
  Stethoscope, Plus, Search, Loader2, Image as ImageIcon, 
  Trash2, X, PhoneCall, Check, Edit2, AlertCircle, Eye, Send, PowerOff, Clock, Youtube
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useBroadcast } from "../../context/BroadcastContext";

const formatTime12Hour = (time24) => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":");
  if (!hours || !minutes) return time24;
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const h12Str = h12 < 10 ? `0${h12}` : h12;
  return `${h12Str}:${minutes} ${ampm}`;
};

const AdminDoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { addJob } = useBroadcast();

  // Test SMS State
  const [testPhone, setTestPhone] = useState("");
  const [isTestingSMS, setIsTestingSMS] = useState(false);

  // Tabs & History State
  const [activeTab, setActiveTab] = useState("doctors");
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDoctorId, setEditDoctorId] = useState(null);
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Selected doctor for consult & view
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [viewDoctor, setViewDoctor] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    personalMobile: "",
    email: "",
    description: "",
    descriptionHi: "",
    bio: "",
    bioHi: "",
    specification: [""],
    specificationHi: [""],
    availabilityDate: { startDate: "", endDate: "" },
    availabilityTime: { startTime: "", endTime: "" },
    image: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const [isTranslating, setIsTranslating] = useState({
    description: false,
    bio: false,
    specification: {}
  });
  const lastTranslated = useRef({
    description: "",
    bio: "",
    specification: {}
  });
  const debounceTimers = useRef({});

  // Consult form states
  const [contactNumbers, setContactNumbers] = useState([""]);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [gmeetLink, setGmeetLink] = useState("");
  const [assignedTo, setAssignedTo] = useState({ cardholder: false, employee: false });

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await doctorsAPI.getAll();
      if (res.success) {
        setDoctors(res.data);
      } else {
        toast.error("Failed to fetch doctors");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchSessionHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await doctorsAPI.getSessionHistory();
      if (res.success) {
        setSessionHistory(res.data);
      } else {
        toast.error("Failed to fetch session history");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchSessionHistory();
    }
  }, [activeTab]);

  const handleEndSession = async (id) => {
    if (!window.confirm("Are you sure you want to end this session? The doctor will become inactive.")) return;
    try {
      const res = await doctorsAPI.endSession(id);
      if (res.success) {
        toast.success("Session ended successfully");
        fetchDoctors();
        if (activeTab === 'history') {
          fetchSessionHistory();
        }
      } else {
        toast.error(res.error || "Failed to end session");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const handleToggleOnboarding = async (id, currentState) => {
    if (!window.confirm(`Are you sure you want to change onboarding status to ${!currentState ? 'Onboarded' : 'Pending'}?`)) return;
    try {
      const res = await doctorsAPI.update(id, { onboardingComplete: !currentState });
      if (res.success) {
        toast.success("Onboarding status updated");
        fetchDoctors();
      } else {
        toast.error(res.error || "Failed to update onboarding status");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addSpecification = () => {
    setFormData({ 
      ...formData, 
      specification: [...formData.specification, ""],
      specificationHi: [...formData.specificationHi, ""]
    });
  };

  const removeSpecification = (index) => {
    const specs = [...formData.specification];
    const specsHi = [...formData.specificationHi];
    specs.splice(index, 1);
    specsHi.splice(index, 1);
    setFormData({ 
      ...formData, 
      specification: specs.length ? specs : [""],
      specificationHi: specsHi.length ? specsHi : [""]
    });
  };

  const handleSpecChange = (index, value) => {
    setFormData(prev => {
      const newSpecs = [...prev.specification];
      newSpecs[index] = value;
      return { ...prev, specification: newSpecs };
    });

    if (debounceTimers.current[`spec_${index}`]) clearTimeout(debounceTimers.current[`spec_${index}`]);

    if (value.trim() !== "") {
      setIsTranslating(prev => ({ ...prev, specification: { ...prev.specification, [index]: true } }));
      debounceTimers.current[`spec_${index}`] = setTimeout(async () => {
        if (value !== lastTranslated.current.specification[index]) {
          const translated = await translateToHindi(value);
          if (translated) {
            setFormData(prev => {
              const specsHi = [...prev.specificationHi];
              specsHi[index] = translated;
              return { ...prev, specificationHi: specsHi };
            });
            lastTranslated.current.specification[index] = value;
          }
        }
        setIsTranslating(prev => ({ ...prev, specification: { ...prev.specification, [index]: false } }));
      }, 600);
    } else {
      setIsTranslating(prev => ({ ...prev, specification: { ...prev.specification, [index]: false } }));
    }
  };

  const handleSpecHiChange = (index, value) => {
    const specsHi = [...formData.specificationHi];
    specsHi[index] = value;
    setFormData({ ...formData, specificationHi: specsHi });
  };

  const translateToHindi = async (text) => {
    if (!text.trim()) return "";
    try {
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`);
      const data = await response.json();
      return data[0].map(item => item[0]).join('');
    } catch (error) {
      console.error("Translation error:", error);
      return "";
    }
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, description: value }));

    if (debounceTimers.current.description) clearTimeout(debounceTimers.current.description);

    if (value.trim() !== "") {
      setIsTranslating(prev => ({ ...prev, description: true }));
      debounceTimers.current.description = setTimeout(async () => {
        if (value !== lastTranslated.current.description) {
          const translated = await translateToHindi(value);
          if (translated) {
            setFormData(prev => ({ ...prev, descriptionHi: translated }));
            lastTranslated.current.description = value;
          }
        }
        setIsTranslating(prev => ({ ...prev, description: false }));
      }, 600);
    } else {
      setIsTranslating(prev => ({ ...prev, description: false }));
    }
  };

  const handleBioChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, bio: value }));

    if (debounceTimers.current.bio) clearTimeout(debounceTimers.current.bio);

    if (value.trim() !== "") {
      setIsTranslating(prev => ({ ...prev, bio: true }));
      debounceTimers.current.bio = setTimeout(async () => {
        if (value !== lastTranslated.current.bio) {
          const translated = await translateToHindi(value);
          if (translated) {
            setFormData(prev => ({ ...prev, bioHi: translated }));
            lastTranslated.current.bio = value;
          }
        }
        setIsTranslating(prev => ({ ...prev, bio: false }));
      }, 600);
    } else {
      setIsTranslating(prev => ({ ...prev, bio: false }));
    }
  };

  const openEditModal = (doc) => {
    setIsEditMode(true);
    setEditDoctorId(doc._id);
    setFormData({
      name: doc.name || "",
      personalMobile: doc.personalMobile || "",
      email: doc.email || "",
      description: doc.description || "",
      descriptionHi: doc.descriptionHi || "",
      bio: doc.bio || "",
      bioHi: doc.bioHi || "",
      specification: Array.isArray(doc.specification) && doc.specification.length > 0 ? doc.specification : [""],
      specificationHi: Array.isArray(doc.specificationHi) && doc.specificationHi.length > 0 ? doc.specificationHi : Array.isArray(doc.specification) && doc.specification.length > 0 ? Array(doc.specification.length).fill("") : [""],
      availabilityDate: {
        startDate: doc.availabilityDate?.startDate ? new Date(doc.availabilityDate.startDate).toISOString().split('T')[0] : "",
        endDate: doc.availabilityDate?.endDate ? new Date(doc.availabilityDate.endDate).toISOString().split('T')[0] : ""
      },
      availabilityTime: {
        startTime: doc.availabilityTime?.startTime || "",
        endTime: doc.availabilityTime?.endTime || ""
      },
      image: doc.image || ""
    });
    
    lastTranslated.current = {
      description: doc.description || "",
      bio: doc.bio || "",
      specification: {}
    };
    if (Array.isArray(doc.specification)) {
      doc.specification.forEach((spec, idx) => {
        lastTranslated.current.specification[idx] = spec;
      });
    }

    setImagePreview(doc.image || null);
    setImageFile(null);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Name is required");
    if (!formData.personalMobile || formData.personalMobile.length !== 10) return toast.error("Valid 10-digit Personal Mobile is required");

    try {
      setIsSubmitting(true);
      
      let imageUrl = "";
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("file", imageFile);
        const uploadRes = await doctorsAPI.uploadImage(imageFormData);
        if (uploadRes.success) {
          imageUrl = uploadRes.data.fileUrl;
        } else {
          toast.error("Image upload failed");
          setIsSubmitting(false);
          return;
        }
      }

      const validSpecs = [];
      const validSpecsHi = [];
      formData.specification.forEach((s, i) => {
        if (s.trim() !== "") {
          validSpecs.push(s.trim());
          validSpecsHi.push(formData.specificationHi[i] ? formData.specificationHi[i].trim() : "");
        }
      });
      const finalImageUrl = imageUrl || formData.image;
      
      let res;
      if (isEditMode) {
        res = await doctorsAPI.update(editDoctorId, {
          ...formData,
          specification: validSpecs,
          specificationHi: validSpecsHi,
          image: finalImageUrl
        });
      } else {
        res = await doctorsAPI.create({
          ...formData,
          specification: validSpecs,
          specificationHi: validSpecsHi,
          image: finalImageUrl
        });
      }

      if (res.success) {
        toast.success(isEditMode ? "Doctor updated successfully" : "Doctor added successfully");
        setIsAddModalOpen(false);
        setIsEditMode(false);
        setEditDoctorId(null);
        setFormData({
          name: "", personalMobile: "", email: "", description: "", descriptionHi: "", bio: "", bioHi: "", specification: [""], specificationHi: [""], 
          availabilityDate: { startDate: "", endDate: "" },
          availabilityTime: { startTime: "", endTime: "" },
          image: ""
        });
        lastTranslated.current = { description: "", bio: "", specification: {} };
        setImageFile(null);
        setImagePreview(null);
        fetchDoctors();
      } else {
        toast.error(res.error || "Failed to add doctor");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    try {
      const res = await doctorsAPI.delete(id);
      if (res.success) {
        toast.success("Deleted successfully");
        fetchDoctors();
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const openConsultModal = (doc) => {
    setSelectedDoctor(doc);
    setContactNumbers(doc.contactNumbers?.length > 0 ? doc.contactNumbers : [""]);
    setYoutubeLink(doc.youtubeLink || "");
    setGmeetLink(doc.gmeetLink || "");
    setAssignedTo({
      cardholder: doc.assignedTo?.cardholder || false,
      employee: doc.assignedTo?.employee || false
    });
    setIsConsultModalOpen(true);
  };

  const handleContactChange = (index, value) => {
    const newNumbers = [...contactNumbers];
    newNumbers[index] = value.replace(/\D/g, '').slice(0, 10);
    setContactNumbers(newNumbers);
  };

  const addContactField = () => {
    setContactNumbers([...contactNumbers, ""]);
  };

  const removeContactField = (index) => {
    const newNumbers = [...contactNumbers];
    newNumbers.splice(index, 1);
    setContactNumbers(newNumbers.length ? newNumbers : [""]);
  };

  const handleConsultSubmit = async (e) => {
    e.preventDefault();
    
    // Validate numbers
    const validNumbers = contactNumbers.filter(num => num.length === 10);
    if (contactNumbers.some(num => num.length > 0 && num.length !== 10)) {
      return toast.error("All entered mobile numbers must be exactly 10 digits");
    }
    
    try {
      setIsSubmitting(true);
      const res = await doctorsAPI.update(selectedDoctor._id, {
        contactNumbers: validNumbers,
        youtubeLink: youtubeLink.trim(),
        gmeetLink: gmeetLink.trim(),
        assignedTo
      });

      if (res.success) {
        toast.success("Consultation settings updated");
        setIsConsultModalOpen(false);
        fetchDoctors();

        // Check if broadcast job was created
        if (res.broadcastJobId && res.targetCount > 0) {
          addJob({
            _id: res.broadcastJobId,
            title: "Doctor Consultation SMS",
            totalCandidates: res.targetCount,
            sentCount: 0,
            status: "processing",
            jobType: "doctor_consult"
          });
        }

      } else {
        toast.error(res.error || "Failed to update");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const searchLower = search.toLowerCase();
    const specsStr = Array.isArray(doc.specification) ? doc.specification.join(" ") : (doc.specification || "");
    return doc.name.toLowerCase().includes(searchLower) || specsStr.toLowerCase().includes(searchLower);
  });

  const handleTestSMS = async () => {
    if (!testPhone || testPhone.length !== 10) {
      return toast.error("Please enter a valid 10-digit mobile number");
    }
    try {
      setIsTestingSMS(true);
      const res = await doctorsAPI.testSMS(testPhone);
      if (res.success) {
        toast.success("Test SMS Sent Successfully");
        setTestPhone("");
      } else {
        toast.error(res.error || "Failed to send Test SMS");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsTestingSMS(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
            <div>
              <h1 className="text-xl font-bold text-white">Doctor Management</h1>
              <p className="text-[10px] font-black text-green-100 uppercase tracking-[0.2em] mt-1">
                Manage Consultation Network
              </p>
            </div>
            <button
              onClick={() => {
                setIsEditMode(false);
                setEditDoctorId(null);
                setFormData({
                  name: "", personalMobile: "", email: "", description: "", descriptionHi: "", bio: "", bioHi: "", specification: [""], specificationHi: [""], 
                  availabilityDate: { startDate: "", endDate: "" },
                  availabilityTime: { startTime: "", endTime: "" },
                  image: ""
                });
                lastTranslated.current = { description: "", bio: "", specification: {} };
                setImagePreview(null);
                setImageFile(null);
                setIsAddModalOpen(true);
              }}
              className="bg-white hover:bg-gray-50 text-[#3AB000] text-xs px-5 py-2.5 font-bold uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 rounded-sm transition-all self-start lg:self-auto"
            >
              <Plus size={16} />
              Add Doctor
            </button>
          </div>

          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('doctors')}
              className={`pb-3 px-2 text-sm font-black uppercase tracking-widest transition-colors ${
                activeTab === 'doctors' 
                  ? 'border-b-2 border-[#3AB000] text-[#3AB000]' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Doctor List
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-2 text-sm font-black uppercase tracking-widest transition-colors ${
                activeTab === 'history' 
                  ? 'border-b-2 border-[#3AB000] text-[#3AB000]' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Session History
            </button>
          </div>

          {activeTab === 'doctors' && (
            <div className="bg-white border border-gray-200 p-4 mb-6 rounded shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
              {/* Search */}
              <div className="flex items-center border border-gray-200 rounded overflow-hidden h-10 bg-white focus-within:border-[#3AB000] w-full max-w-md">
                <input
                  type="text"
                  placeholder="Search by name or specification..."
                  className="flex-1 px-3 text-xs font-bold outline-none text-gray-800"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="bg-[#3AB000] h-full flex items-center px-3 text-white">
                  <Search size={14} />
                </div>
              </div>

              {/* Test SMS */}
              <div className="flex items-center border border-gray-200 rounded overflow-hidden h-10 bg-white focus-within:border-[#3AB000] w-full max-w-sm">
                <input
                  type="text"
                  placeholder="Enter 10-digit Mobile No. to Test SMS"
                  className="flex-1 px-3 text-xs font-bold outline-none text-gray-800"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                />
                <button
                  onClick={handleTestSMS}
                  disabled={isTestingSMS || testPhone.length !== 10}
                  className="bg-[#3AB000] hover:bg-[#2d8a00] disabled:bg-gray-400 h-full flex items-center px-4 text-white text-xs font-bold gap-1 transition-colors"
                >
                  {isTestingSMS ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Send
                </button>
              </div>
            </div>
          )}

          {activeTab === 'doctors' && (
            <div className="bg-white rounded border border-gray-200 overflow-visible shadow-sm relative min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-4 text-center rounded">
                <Loader2 size={40} className="animate-spin text-[#3AB000]" />
              </div>
            )}

            {filteredDoctors.length > 0 ? (
              <div className="overflow-visible max-md:overflow-x-auto min-h-[350px]">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#3AB000] text-white font-black uppercase text-[10px] tracking-widest">
                      <th className="px-4 py-3 rounded-tl">Doctor Info</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Specification</th>
                      <th className="px-4 py-3">Availability</th>
                      <th className="px-4 py-3">Assignments</th>
                      <th className="px-4 py-3 text-right rounded-tr">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDoctors.map((doc) => (
                      <tr key={doc._id} className="hover:bg-[#f0f9eb] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={doc.image || 'https://via.placeholder.com/40'} 
                              alt={doc.name}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/40' }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]" title={doc.name}>{doc.name}</p>
                              <p className="text-[10px] text-gray-500 truncate max-w-[150px] mt-1" title={doc.description}>{doc.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2 items-start">
                            <span className={`text-[9px] px-1.5 py-0.5 font-bold uppercase rounded border ${
                              doc.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' :
                              doc.status === 'inactive' ? 'bg-red-50 text-red-600 border-red-200' :
                              'bg-gray-50 text-gray-600 border-gray-200'
                            }`}>
                              {doc.status || 'inactive'}
                            </span>
                            <button 
                              onClick={() => handleToggleOnboarding(doc._id, doc.onboardingComplete)}
                              className={`text-[9px] px-1.5 py-0.5 font-bold uppercase rounded border cursor-pointer hover:opacity-80 transition-opacity ${
                              doc.onboardingComplete ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100'
                            }`}>
                              {doc.onboardingComplete ? 'Onboarded' : 'Pending Onboarding'}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-gray-700">
                          {Array.isArray(doc.specification) && doc.specification.length > 0 ? (
                            <div className="flex items-center gap-1.5 max-w-[220px]">
                              {doc.specification.slice(0, 3).map((spec, i) => (
                                <span key={i} className="bg-[#3AB000]/10 text-[#3AB000] border border-[#3AB000]/20 px-2 py-0.5 rounded text-[10px] truncate max-w-[70px]" title={spec}>{spec}</span>
                              ))}
                              {doc.specification.length > 3 && (
                                <div className="relative group cursor-pointer flex-shrink-0">
                                  <span className="bg-[#3AB000] text-white px-1.5 py-0.5 rounded text-[10px] shadow-sm">
                                    +{doc.specification.length - 3}
                                  </span>
                                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 hidden group-hover:flex flex-col gap-1.5 bg-white border border-gray-200 p-2.5 rounded-lg shadow-xl z-[999] min-w-max max-w-[200px] max-h-[180px] overflow-y-auto">
                                    {doc.specification.slice(3).map((remSpec, idx) => (
                                      <span key={idx} className="bg-[#3AB000]/10 text-[#3AB000] border border-[#3AB000]/20 px-2 py-1 rounded-md text-[10px] break-words whitespace-normal leading-tight">
                                        {remSpec}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {doc.availabilityDate?.startDate ? (
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 whitespace-nowrap text-[10px] font-bold inline-flex items-center gap-1.5">
                              <span>{new Date(doc.availabilityDate.startDate).toLocaleDateString()} - {new Date(doc.availabilityDate.endDate).toLocaleDateString()}</span>
                              {doc.availabilityTime?.startTime && (
                                <>
                                  <span className="w-px h-3 bg-blue-200"></span>
                                  <span>{formatTime12Hour(doc.availabilityTime.startTime)} to {formatTime12Hour(doc.availabilityTime.endTime)}</span>
                                </>
                              )}
                            </span>
                          ) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {doc.assignedTo?.cardholder && <span className="text-[9px] bg-[#3AB000]/10 text-[#3AB000] px-2 py-0.5 font-bold uppercase rounded border border-[#3AB000]/20">Cardholder</span>}
                            {doc.assignedTo?.employee && <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 font-bold uppercase rounded border border-blue-200">Employee</span>}
                            {!doc.assignedTo?.cardholder && !doc.assignedTo?.employee && <span className="text-[9px] text-gray-400 font-bold uppercase">Unassigned</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedDoctor(doc);
                                setContactNumbers(doc.contactNumbers?.length ? doc.contactNumbers : [""]);
                                setYoutubeLink(doc.youtubeLink || "");
                                setAssignedTo(doc.assignedTo || { cardholder: false, employee: false });
                                setIsConsultModalOpen(true);
                              }}
                              className="bg-[#3AB000] hover:bg-[#2d8a00] text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
                            >
                              <PhoneCall size={12} /> Consult Settings
                            </button>
                            {doc.status === 'active' && (
                              <button
                                onClick={() => handleEndSession(doc._id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
                                title="End Session"
                              >
                                <PowerOff size={12} /> End Session
                              </button>
                            )}
                            <button
                              onClick={() => { setViewDoctor(doc); setIsViewModalOpen(true); }}
                              className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(doc)}
                              className="p-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded transition-colors"
                              title="Edit Details"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(doc._id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !loading && (
                <div className="flex flex-col items-center justify-center text-gray-400 py-12">
                  <Stethoscope size={48} className="mb-4 opacity-50" />
                  <p className="text-sm font-bold uppercase tracking-widest">No Doctors Found</p>
                </div>
              )
            )}
          </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded border border-gray-200 overflow-visible shadow-sm relative min-h-[400px]">
              {loadingHistory && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-4 text-center rounded">
                  <Loader2 size={40} className="animate-spin text-[#3AB000]" />
                </div>
              )}

              {sessionHistory.length > 0 ? (
                <div className="overflow-visible max-md:overflow-x-auto min-h-[350px]">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#3AB000] text-white font-black uppercase text-[10px] tracking-widest">
                        <th className="px-4 py-3 rounded-tl">Doctor Info</th>
                        <th className="px-4 py-3">Session Start</th>
                        <th className="px-4 py-3">Session End</th>
                        <th className="px-4 py-3">Link</th>
                        <th className="px-4 py-3 text-right rounded-tr">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sessionHistory.map((session, idx) => (
                        <tr key={session.sessionId || idx} className="hover:bg-[#f0f9eb] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img 
                                src={session.doctorImage || 'https://via.placeholder.com/40'} 
                                alt={session.doctorName}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/40' }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{session.doctorName}</p>
                                <div className="flex gap-1 mt-1">
                                  {session.assignedTo?.cardholder && <span className="text-[9px] bg-[#3AB000]/10 text-[#3AB000] px-1.5 py-0.5 font-bold uppercase rounded border border-[#3AB000]/20">CH</span>}
                                  {session.assignedTo?.employee && <span className="text-[9px] bg-[#3AB000]/10 text-[#3AB000] px-1.5 py-0.5 font-bold uppercase rounded border border-[#3AB000]/20">EMP</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-gray-700">
                            {new Date(session.startTime).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-gray-700">
                            {session.endTime ? new Date(session.endTime).toLocaleString() : <span className="text-[#3AB000]">Active Now</span>}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {session.youtubeLink ? (
                              <a href={session.youtubeLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm">
                                <Youtube size={12} /> {session.endTime ? "Watch Video" : "Watch Live"}
                              </a>
                            ) : "-"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!session.endTime ? (
                              <button
                                onClick={() => handleEndSession(session.doctorId)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center justify-end gap-1.5 transition-colors shadow-sm whitespace-nowrap ml-auto"
                                title="End Session"
                              >
                                <PowerOff size={12} /> End Session
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 inline-block">
                                Session Ended
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                !loadingHistory && (
                  <div className="flex flex-col items-center justify-center text-gray-400 py-12">
                    <Clock size={48} className="mb-4 opacity-50" />
                    <p className="text-sm font-bold uppercase tracking-widest">No Sessions Found</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Doctor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 flex justify-between items-center p-4 z-10">
              <h2 className="text-lg font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                <Stethoscope size={20} className="text-[#3AB000]" />
                {isEditMode ? "Edit Doctor Details" : "Add New Doctor"}
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Doctor Name *</label>
                      <input 
                        type="text" required
                        className="w-full border border-gray-200 rounded p-2 text-sm focus:border-[#3AB000] outline-none h-9"
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 truncate" title="Personal Mobile (Login) *">Mobile (Login) *</label>
                      <input 
                        type="text" required maxLength={10}
                        className="w-full border border-gray-200 rounded p-2 text-sm focus:border-[#3AB000] outline-none h-9"
                        value={formData.personalMobile} onChange={e => setFormData({...formData, personalMobile: e.target.value.replace(/\D/g, '')})}
                        placeholder="10 digit"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Email ID (Login)</label>
                    <input 
                      type="email"
                      className="w-full border border-gray-200 rounded p-2 text-sm focus:border-[#3AB000] outline-none h-9"
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="doctor@example.com"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-black text-gray-500 uppercase">Specifications</label>
                      <button type="button" onClick={addSpecification} className="text-[#3AB000] p-1 bg-[#3AB000]/10 rounded-full hover:bg-[#3AB000]/20">
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.specification.map((spec, idx) => (
                        <div key={idx} className="flex flex-col gap-1 w-full relative border border-gray-100 p-2 rounded bg-gray-50">
                          <div className="flex gap-2 items-center">
                            <input 
                              type="text" placeholder="English (e.g. Cardiologist)"
                              className="flex-1 border border-gray-200 rounded p-1.5 text-xs focus:border-[#3AB000] outline-none"
                              value={spec} onChange={e => handleSpecChange(idx, e.target.value)}
                            />
                            <button type="button" onClick={() => removeSpecification(idx)} disabled={formData.specification.length === 1} className="text-red-400 p-1 hover:text-red-600 shrink-0">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="relative w-[calc(100%-28px)]">
                            <input 
                              type="text" placeholder="Hindi (e.g. हृदय रोग विशेषज्ञ)"
                              className="w-full border border-gray-200 rounded p-1.5 text-xs focus:border-[#3AB000] outline-none pr-8"
                              value={formData.specificationHi[idx] || ""} onChange={e => handleSpecHiChange(idx, e.target.value)}
                            />
                            {isTranslating.specification[idx] && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <Loader2 size={12} className="animate-spin text-[#3AB000]" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Short Description (English)</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-200 rounded p-2 text-sm focus:border-[#3AB000] outline-none"
                      value={formData.description} onChange={handleDescriptionChange}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Short Description (Hindi)</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        className="w-full border border-gray-200 rounded p-2 text-sm focus:border-[#3AB000] outline-none pr-8"
                        value={formData.descriptionHi} onChange={e => setFormData({...formData, descriptionHi: e.target.value})}
                      />
                      {isTranslating.description && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <Loader2 size={14} className="animate-spin text-[#3AB000]" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Profile Image</label>
                    {!imagePreview ? (
                      <div 
                        className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors h-32 relative"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon size={30} className="text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500 font-bold">Click to upload image</span>
                        <input 
                          type="file" ref={fileInputRef} className="hidden" 
                          accept="image/*" onChange={handleImageChange}
                        />
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-col items-center">
                        <div className="w-full h-32 mb-3 bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex items-center justify-center p-1">
                          <img src={imagePreview} alt="Preview" className="h-full w-full object-contain" />
                        </div>
                        <div className="flex gap-3 w-full">
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-600 hover:bg-gray-100 transition-colors uppercase">
                            Re-upload
                          </button>
                          <button type="button" onClick={removeImage} className="flex-1 py-1.5 bg-red-50 border border-red-100 rounded text-[10px] font-bold text-red-600 hover:bg-red-100 transition-colors uppercase">
                            Remove
                          </button>
                          <input 
                            type="file" ref={fileInputRef} className="hidden" 
                            accept="image/*" onChange={handleImageChange}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Biography (English)</label>
                  <textarea 
                    rows="3"
                    className="w-full border border-gray-200 rounded p-2 text-sm focus:border-[#3AB000] outline-none resize-none"
                    value={formData.bio} onChange={handleBioChange}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Biography (Hindi)</label>
                  <div className="relative">
                    <textarea 
                      rows="3"
                      className="w-full border border-gray-200 rounded p-2 text-sm focus:border-[#3AB000] outline-none resize-none pr-8"
                      value={formData.bioHi} onChange={e => setFormData({...formData, bioHi: e.target.value})}
                    ></textarea>
                    {isTranslating.bio && (
                      <div className="absolute right-2 top-2">
                        <Loader2 size={16} className="animate-spin text-[#3AB000]" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Availability Date Range</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="date" 
                      className="flex-1 border border-gray-200 rounded p-2 text-sm focus:border-[#3AB000] outline-none"
                      value={formData.availabilityDate.startDate} 
                      onChange={e => setFormData({...formData, availabilityDate: {...formData.availabilityDate, startDate: e.target.value}})}
                    />
                    <span className="text-gray-400">to</span>
                    <input 
                      type="date" 
                      className="flex-1 border border-gray-200 rounded p-2 text-sm focus:border-[#3AB000] outline-none"
                      value={formData.availabilityDate.endDate} 
                      onChange={e => setFormData({...formData, availabilityDate: {...formData.availabilityDate, endDate: e.target.value}})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Availability Time Range</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="time" 
                      className="flex-1 border border-gray-200 rounded p-2 text-sm focus:border-[#3AB000] outline-none"
                      value={formData.availabilityTime.startTime} 
                      onChange={e => setFormData({...formData, availabilityTime: {...formData.availabilityTime, startTime: e.target.value}})}
                    />
                    <span className="text-gray-400">to</span>
                    <input 
                      type="time" 
                      className="flex-1 border border-gray-200 rounded p-2 text-sm focus:border-[#3AB000] outline-none"
                      value={formData.availabilityTime.endTime} 
                      onChange={e => setFormData({...formData, availabilityTime: {...formData.availabilityTime, endTime: e.target.value}})}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 rounded text-sm font-bold text-gray-600 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded text-sm font-bold bg-[#3AB000] hover:bg-[#2d8a00] text-white flex items-center gap-2">
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isEditMode ? "Update Doctor" : "Save Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Consult Settings Modal */}
      {isConsultModalOpen && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded max-w-md w-full shadow-2xl">
            <div className="bg-gray-50 border-b border-gray-100 flex justify-between items-center p-4">
              <div>
                <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">Consultation Setup</h2>
                <p className="text-[10px] font-bold text-gray-500">For {selectedDoctor.name}</p>
              </div>
              <button onClick={() => setIsConsultModalOpen(false)} className="text-gray-500 hover:bg-gray-200 p-1 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleConsultSubmit} className="p-5 space-y-6">
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black text-gray-500 uppercase">Contact Numbers</label>
                  <button 
                    type="button" 
                    onClick={addContactField}
                    className="text-[#3AB000] hover:bg-[#3AB000]/10 p-1 rounded-full"
                    title="Add Mobile Number"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {contactNumbers.map((num, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-6">+91</span>
                      <input
                        type="text"
                        placeholder="10 digit mobile number"
                        className="flex-1 border border-gray-200 rounded p-2 text-sm outline-none focus:border-[#3AB000]"
                        value={num}
                        onChange={(e) => handleContactChange(idx, e.target.value)}
                        maxLength={10}
                      />
                      <button 
                        type="button" 
                        onClick={() => removeContactField(idx)}
                        className="text-red-400 hover:text-red-600 p-1"
                        disabled={contactNumbers.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1 italic flex items-center gap-1">
                  <AlertCircle size={10} /> Numbers must be exactly 10 digits
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">YouTube Live Link</label>
                <div className="flex items-center">
                  <input
                    type="url"
                    placeholder="https://youtube.com/..."
                    className="w-full border border-gray-200 rounded p-2 text-sm outline-none focus:border-[#3AB000]"
                    value={youtubeLink}
                    onChange={(e) => setYoutubeLink(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Google Meet Link</label>
                <div className="flex items-center">
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    className="w-full border border-gray-200 rounded p-2 text-sm outline-none focus:border-[#3AB000]"
                    value={gmeetLink}
                    onChange={(e) => setGmeetLink(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-3">Assign Accessibility</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${assignedTo.cardholder ? 'bg-[#3AB000] border-[#3AB000]' : 'border-gray-300 group-hover:border-[#3AB000]'}`}>
                      {assignedTo.cardholder && <Check size={14} className="text-white" />}
                    </div>
                    <input 
                      type="checkbox" className="hidden"
                      checked={assignedTo.cardholder}
                      onChange={(e) => setAssignedTo({...assignedTo, cardholder: e.target.checked})}
                    />
                    <span className="text-sm font-bold text-gray-700 select-none">Cardholder</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${assignedTo.employee ? 'bg-[#3AB000] border-[#3AB000]' : 'border-gray-300 group-hover:border-[#3AB000]'}`}>
                      {assignedTo.employee && <Check size={14} className="text-white" />}
                    </div>
                    <input 
                      type="checkbox" className="hidden"
                      checked={assignedTo.employee}
                      onChange={(e) => setAssignedTo({...assignedTo, employee: e.target.checked})}
                    />
                    <span className="text-sm font-bold text-gray-700 select-none">Employee</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button type="submit" disabled={isSubmitting} className="w-full py-2.5 rounded text-sm font-bold bg-[#3AB000] hover:bg-[#2d8a00] text-white flex justify-center items-center gap-2 transition-colors shadow-lg shadow-[#3AB000]/20">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewModalOpen && viewDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded max-w-xl w-full shadow-2xl flex flex-col max-h-[85vh]">
            <div className="bg-gray-50 border-b border-gray-100 flex justify-between items-center p-4">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
                <Eye size={16} className="text-[#3AB000]" />
                Doctor Details
              </h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-500 hover:bg-gray-200 p-1 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col sm:flex-row gap-5 mb-6 pb-6 border-b border-gray-100">
                <img 
                  src={viewDoctor.image || 'https://via.placeholder.com/150'} 
                  alt={viewDoctor.name}
                  className="w-24 h-24 shrink-0 rounded-lg object-cover border border-gray-200 shadow-sm"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/150' }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-black text-gray-900 break-words">{viewDoctor.name}</h3>
                  <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap break-words leading-relaxed">{viewDoctor.description || "No description provided."}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Specifications</label>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(viewDoctor.specification) && viewDoctor.specification.length > 0 ? (
                      viewDoctor.specification.map((spec, idx) => (
                        <span key={idx} className="bg-[#3AB000]/5 text-[#3AB000] px-3 py-1.5 rounded text-xs font-bold border border-[#3AB000]/20 break-words whitespace-normal">
                          {spec} {viewDoctor.specificationHi && viewDoctor.specificationHi[idx] && <span className="border-l border-[#3AB000]/30 pl-1.5 ml-1.5">{viewDoctor.specificationHi[idx]}</span>}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 italic">None</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Biography</label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded border border-gray-100 leading-relaxed whitespace-pre-wrap break-words">
                    {viewDoctor.bio || "No biography provided."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDoctorManagement;
