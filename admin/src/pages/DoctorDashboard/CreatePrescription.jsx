import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { doctorsAPI, pharmacyProductsAPI } from "../../utils/api";
import { FileText, Plus, Search, Trash2, Check, User, Clock, ArrowLeft, Activity, XCircle } from "lucide-react";
import toast from "react-hot-toast";

const InputField = ({ label, type = "text", required = true, placeholder = "", value, onChange, isTextarea = false, rows = 3 }) => (
  <div className="space-y-1.5 w-full">
     <label className="text-[13px] md:text-sm font-bold text-gray-700 block mb-1">
       {label} {required && <span className="text-red-500 inline-block ml-0.5">*</span>}
     </label>
     {isTextarea ? (
       <textarea 
         value={value} onChange={onChange} required={required} placeholder={placeholder} rows={rows}
         className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-sm focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] outline-none transition-all text-gray-900 font-medium text-sm shadow-sm resize-y"
       ></textarea>
     ) : (
       <input 
         type={type} value={value} onChange={onChange} required={required} placeholder={placeholder}
         className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-sm focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] outline-none transition-all text-gray-900 font-medium text-sm shadow-sm"
       />
     )}
  </div>
);

const SelectOrCustomField = ({ label, required = true, value, customValue, onSelectChange, onCustomChange, options, placeholder }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-[13px] md:text-sm font-bold text-gray-700 block mb-1">
      {label} {required && <span className="text-red-500 inline-block ml-0.5">*</span>}
    </label>
    <select
      value={value}
      onChange={onSelectChange}
      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-sm focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] outline-none transition-all text-gray-900 font-medium text-sm shadow-sm mb-2"
      required={required && value !== "Custom"}
    >
      <option value="">Select {label}</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
      <option value="Custom" className="font-bold text-[#3AB000]">Custom / Other</option>
    </select>
    
    {value === "Custom" && (
      <input
        type="text"
        value={customValue}
        onChange={onCustomChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 bg-gray-50 border border-[#3AB000]/50 rounded-sm focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] outline-none transition-all text-gray-900 font-medium text-sm shadow-inner animate-in fade-in slide-in-from-top-1"
      />
    )}
  </div>
);

const getDosageOptions = (type) => {
  switch (type) {
    case "Tablet":
    case "Capsule":
      return ["1 Tablet", "1/2 Tablet", "250mg", "500mg", "650mg", "1g", "As Directed"];
    case "Syrup":
      return ["2.5ml", "5ml", "10ml", "15ml", "As Directed"];
    case "Injection":
      return ["1 Ampoule", "2ml", "5ml", "1 Vial", "As Directed"];
    case "Cream":
      return ["Apply Locally", "Apply Twice Daily", "Pea-sized amount", "As Directed"];
    case "Drops":
      return ["1 Drop", "2 Drops", "3 Drops", "4 Drops", "As Directed"];
    default:
      return ["250mg", "500mg", "5ml", "10ml", "1 Drop", "As Directed"];
  }
};

const SectionHeader = ({ title }) => (
  <div className="bg-[#3AB000] text-white px-5 py-3 mb-6 rounded-sm shadow-md flex items-center justify-between">
    <h3 className="text-sm font-black uppercase tracking-wide">{title}</h3>
  </div>
);

const CreatePrescription = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selection
  const [selectedTokenId, setSelectedTokenId] = useState(searchParams.get("tokenId") || "");
  const selectedToken = tokens.find(t => t._id === selectedTokenId);

  // Form State
  const [medicines, setMedicines] = useState([{ name: "", type: "Tablet", dosage: "", customDosage: "", frequency: "", customFrequency: "", duration: "", customDuration: "", instructions: "", customInstructions: "" }]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Search state
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState(null); // Which medicine is being searched
  const searchTimeout = React.useRef(null); // Ref for debouncing search

  useEffect(() => {
    fetchPendingTokens();
  }, []);

  const fetchPendingTokens = async () => {
    try {
      const res = await doctorsAPI.getPendingTokens();
      if (res.success) {
        setTokens(res.tokens);
      }
    } catch (error) {
      console.error("Failed to fetch tokens", error);
      toast.error("Failed to load pending tokens");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchMedicine = (query, index) => {
    const updated = [...medicines];
    updated[index].name = query;
    updated[index].medicineId = undefined;
    setMedicines(updated);

    // Clear the previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Allow search for 2 or more characters
    if (query.trim().length > 1) {
      searchTimeout.current = setTimeout(async () => {
        setSearchIndex(index);
        try {
          const res = await pharmacyProductsAPI.searchForDoctor(query.trim());
          if (res.success) {
            setSearchResults(res.products);
          }
        } catch (err) {
          console.error("Search error", err);
        }
      }, 400); // 400ms delay for debouncing
    } else {
      setSearchResults([]);
    }
  };

  const selectMedicine = (product, index) => {
    const updated = [...medicines];
    updated[index].name = product.name;
    updated[index].medicineId = product._id; // Ensure medicineId is saved
    setMedicines(updated);
    setSearchResults([]);
    setSearchIndex(null);
  };

  const addMedicineRow = () => {
    setMedicines([...medicines, { name: "", type: "Tablet", dosage: "", customDosage: "", frequency: "", customFrequency: "", duration: "", customDuration: "", instructions: "", customInstructions: "" }]);
  };

  const removeMedicineRow = (index) => {
    const updated = medicines.filter((_, i) => i !== index);
    setMedicines(updated);
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedToken) {
      toast.error("Please select a Token / Patient first.");
      return;
    }

    if (!notes || notes.trim() === "") {
      toast.error("Please provide Doctor Notes / Diagnosis & Advice.");
      return;
    }

    const validMedicines = medicines.filter(m => m.name.trim() !== "");
    if (validMedicines.length === 0) {
      toast.error("Please add at least one medicine.");
      return;
    }

    for (let m of validMedicines) {
      const d = m.dosage === "Custom" ? m.customDosage : m.dosage;
      const f = m.frequency === "Custom" ? m.customFrequency : m.frequency;
      const dur = m.duration === "Custom" ? m.customDuration : m.duration;
      const inst = m.instructions === "Custom" ? m.customInstructions : m.instructions;
      
      if (!d || !f || !dur || !inst) {
        toast.error(`Please complete Dosage, Frequency, Duration, and Instructions for: ${m.name}`);
        return;
      }
    }

    if (!window.confirm("Are you sure you want to prescribe these medicines? This will send them to the pharmacy.")) return;

    setSubmitting(true);
    try {
      const payload = {
        tokenId: selectedToken._id,
        medicines: validMedicines.map(m => ({
          ...m,
          dosage: m.dosage === "Custom" ? m.customDosage : m.dosage,
          frequency: m.frequency === "Custom" ? m.customFrequency : m.frequency,
          duration: m.duration === "Custom" ? m.customDuration : m.duration,
          instructions: m.instructions === "Custom" ? m.customInstructions : m.instructions,
          source: m.medicineId ? 'in_house' : 'outside'
        })),
        notes
      };
      const res = await doctorsAPI.createPrescription(payload);
      if (res.success) {
        toast.success("Prescription created successfully!");
        navigate("/doctor/dashboard/write-prescription"); // Go back to list
      } else {
        toast.error(res.error || "Failed to create prescription");
      }
    } catch (error) {
      toast.error("Error creating prescription");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AB000]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30 text-white transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none hidden md:flex items-center justify-center border border-white/30 shrink-0">
                <FileText className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">
                  Create Prescription
                </h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">
                  Select a patient token and prescribe medicines
                </p>
              </div>
            </div>
          </div>

        <div className="bg-white rounded-none shadow-md border-2 border-gray-100 overflow-hidden mb-6">
          {/* Patient Selection Section */}
          <div className="p-6 border-b border-gray-100">
            <SectionHeader title="1. Select Patient Token" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-1.5">
                <label className="text-[13px] md:text-sm font-bold text-gray-700 block mb-1">
                  Select Pending Token <span className="text-red-500 inline-block ml-0.5">*</span>
                </label>
                <select
                  value={selectedTokenId}
                  onChange={(e) => setSelectedTokenId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-sm focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] outline-none transition-all text-gray-900 font-medium text-sm shadow-sm"
                >
                  <option value="">-- Search & Select a Token --</option>
                  {tokens.map(token => (
                    <option key={token._id} value={token._id}>
                      Token #{token.tokenNumber} - {token.cardId?.cardholderName || token.cardholderId?.name} {token.cardId?.cardId ? `(${token.cardId.cardId})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedToken && (
                <div className="bg-green-50/50 p-4 rounded-sm border border-[#3AB000]/30 shadow-sm flex items-start gap-4">
                  <div className="w-12 h-12 bg-white text-[#3AB000] rounded-sm flex items-center justify-center font-black text-xl shrink-0 border border-[#3AB000]/20">
                    {(selectedToken.cardId?.cardholderName || selectedToken.cardholderId?.name)?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg uppercase">{selectedToken.cardId?.cardholderName || selectedToken.cardholderId?.name}</h3>
                    <p className="text-gray-500 text-sm font-medium">Phone: {selectedToken.cardholderId?.phone}</p>
                    {selectedToken.cardId?.cardId && (
                      <p className="text-[#3AB000] text-xs font-bold mt-0.5">Card No: {selectedToken.cardId.cardId}</p>
                    )}
                    <p className="text-[10px] font-black tracking-widest uppercase text-[#3AB000] bg-[#3AB000]/10 inline-block px-2 py-1 rounded-sm mt-2">
                      Token #{selectedToken.tokenNumber}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medicine Prescription Section */}
          <div className={`p-6 border-b border-gray-100 transition-opacity duration-300 ${!selectedToken ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
            <SectionHeader title="2. Prescribe Medicines" />

            <div className="space-y-4">
              {medicines.map((med, index) => (
                <div key={index} className="p-5 border border-gray-200 rounded-sm bg-white shadow-sm relative group hover:border-[#3AB000]/50 transition-colors">
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicineRow(index)}
                      className="absolute -top-3 -right-3 bg-white text-red-400 p-1 rounded-sm border border-red-200 shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove Medicine"
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                  
                  <div className="flex flex-col gap-5">
                    {/* Top Row: Search and Type */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      <div className="lg:col-span-2 relative">
                        <div className="space-y-1.5">
                          <label className="text-[13px] md:text-sm font-bold text-gray-700 mb-1 flex items-center justify-between">
                            <span>Medicine Name <span className="text-red-500 inline-block ml-0.5">*</span></span>
                            {med.name && !med.medicineId && (
                              <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-0.5 border border-orange-200">Outside</span>
                            )}
                            {med.name && med.medicineId && (
                              <span className="text-[9px] font-black uppercase tracking-widest text-[#3AB000] bg-green-50 px-2 py-0.5 border border-[#3AB000]/30">In House</span>
                            )}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => handleSearchMedicine(e.target.value, index)}
                              placeholder="Search Pharmacy Inventory..."
                              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-sm focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] outline-none transition-all text-gray-900 font-medium text-sm shadow-sm pl-9"
                              required
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                          </div>
                        </div>
                        
                        {/* Autocomplete Dropdown */}
                        {searchIndex === index && searchResults.length > 0 && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-sm shadow-xl max-h-60 overflow-y-auto">
                            {searchResults.map(product => (
                              <div
                                key={product._id}
                                onClick={() => selectMedicine(product, index)}
                                className="p-3 hover:bg-green-50/50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                              >
                                <div className="font-bold text-gray-800 text-sm">{product.name}</div>
                                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                  <span>Stock: <strong className="text-gray-700">{product.stock}</strong></span>
                                  <span className="font-bold text-[#3AB000]">₹{product.price}</span>
                                </div>
                                <div className="mt-2">
                                  <span className="text-[10px] uppercase tracking-widest font-black text-[#3AB000] bg-[#3AB000]/10 px-2 py-1 rounded-sm">
                                    Store: {product.pharmacyId?.shopName || product.pharmacyId?.name || "Unknown Pharmacy"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="space-y-1.5">
                          <label className="text-[13px] md:text-sm font-bold text-gray-700 block mb-1">Type <span className="text-red-500 inline-block ml-0.5">*</span></label>
                          <select
                            value={med.type}
                            onChange={(e) => handleMedicineChange(index, "type", e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-sm focus:border-[#3AB000] focus:ring-1 focus:ring-[#3AB000] outline-none transition-all text-gray-900 font-medium text-sm shadow-sm"
                          >
                            <option value="Tablet">Tablet</option>
                            <option value="Syrup">Syrup</option>
                            <option value="Capsule">Capsule</option>
                            <option value="Injection">Injection</option>
                            <option value="Cream">Cream</option>
                            <option value="Drops">Drops</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Dosage Info */}
                    <div className="bg-[#3AB000]/5 p-5 border border-[#3AB000]/20 rounded-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative shadow-sm">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#3AB000] rounded-l-md"></div>
                      
                      <SelectOrCustomField
                        label="Dosage"
                        required={true}
                        value={med.dosage}
                        customValue={med.customDosage}
                        onSelectChange={(e) => handleMedicineChange(index, "dosage", e.target.value)}
                        onCustomChange={(e) => handleMedicineChange(index, "customDosage", e.target.value)}
                        options={getDosageOptions(med.type)}
                        placeholder="e.g. 500mg"
                      />

                      <SelectOrCustomField
                        label="Frequency"
                        required={true}
                        value={med.frequency}
                        customValue={med.customFrequency}
                        onSelectChange={(e) => handleMedicineChange(index, "frequency", e.target.value)}
                        onCustomChange={(e) => handleMedicineChange(index, "customFrequency", e.target.value)}
                        options={["1-0-1 (Morning & Night)", "1-1-1 (Morning, Aft., Night)", "1-0-0 (Morning only)", "0-0-1 (Night only)", "SOS (When required)", "Once a week"]}
                        placeholder="e.g. 1-0-1"
                      />

                      <SelectOrCustomField
                        label="Duration"
                        required={true}
                        value={med.duration}
                        customValue={med.customDuration}
                        onSelectChange={(e) => handleMedicineChange(index, "duration", e.target.value)}
                        onCustomChange={(e) => handleMedicineChange(index, "customDuration", e.target.value)}
                        options={["1 Day", "3 Days", "5 Days", "1 Week", "2 Weeks", "1 Month", "Till Next Visit"]}
                        placeholder="e.g. 5 Days"
                      />

                      <SelectOrCustomField
                        label="Instructions"
                        required={true}
                        value={med.instructions}
                        customValue={med.customInstructions}
                        onSelectChange={(e) => handleMedicineChange(index, "instructions", e.target.value)}
                        onCustomChange={(e) => handleMedicineChange(index, "customInstructions", e.target.value)}
                        options={["After Meals", "Before Meals", "With Meals", "Empty Stomach", "At Bedtime", "Apply Locally", "Mix with Water", "Chew Well"]}
                        placeholder="e.g. Take after meals"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={addMedicineRow}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-dashed border-[#3AB000] rounded-sm cursor-pointer hover:bg-green-50/50 transition-all text-[#3AB000] shadow-sm text-xs font-bold uppercase tracking-wider"
              >
                <Plus size={16} /> Add Another Medicine
              </button>
            </div>
            
            <div className="mt-8">
              <SectionHeader title="3. Doctor Notes / Diagnosis" />
              <InputField
                label="Diagnosis & Advice"
                isTextarea={true}
                required={true}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write any diagnosis, diet plans, or specific advice for the patient..."
                rows={4}
              />
            </div>
          </div>

          <div className="p-6 bg-gray-50 flex items-center justify-end gap-4 border-t-4 border-[#3AB000]">
            <button
              type="button"
              onClick={() => navigate("/doctor/dashboard/write-prescription")}
              className="px-6 py-2.5 bg-white border-2 border-gray-200 rounded-none font-black text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all uppercase text-[10px] tracking-widest shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedToken}
              className="px-8 py-2.5 bg-[#3AB000] text-white border-2 border-[#3AB000] rounded-none font-black hover:bg-[#2d8a00] hover:border-[#2d8a00] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase text-[10px] tracking-widest"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-spin" /> Submitting...
                </span>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Submit Prescription
                </>
              )}
            </button>
          </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreatePrescription;
