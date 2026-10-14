import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { employeesAPI, locationAPI } from "../../utils/api";
import statesData from "../../data/states.json";
import districtsData from "../../data/district.json";
import {
  ArrowLeft,
  MapPin,
  Loader2,
  Save,
  Globe,
  Info,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Building,
  User,
  Phone,
  Mail
} from "lucide-react";
import { toast } from "react-hot-toast";

const GREEN = "#3AB000";

const AdminZoneAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Core loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Employee details & active assignments
  const [employee, setEmployee] = useState(null);
  const [assignedStatuses, setAssignedStatuses] = useState([]);

  // Selections
  const [selectedState, setSelectedState] = useState("Bihar / बिहार");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedPanchayat, setSelectedPanchayat] = useState("");

  // Lists
  const [districtsList, setDistrictsList] = useState([]);
  const [blocksList, setBlocksList] = useState([]);
  const [panchayatsList, setPanchayatsList] = useState([]);

  // Multi-select for DM/BS
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [isAllBlocks, setIsAllBlocks] = useState(false);
  const [selectedPanchayats, setSelectedPanchayats] = useState([]);
  const [isAllPanchayats, setIsAllPanchayats] = useState(false);

  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlockName, setNewBlockName] = useState("");
  const [isAddingBlock, setIsAddingBlock] = useState(false);

  const [showAddPanchayat, setShowAddPanchayat] = useState(false);
  const [newPanchayatName, setNewPanchayatName] = useState("");
  const [isAddingPanchayat, setIsAddingPanchayat] = useState(false);

  const [showAddDistrict, setShowAddDistrict] = useState(false);
  const [newDistrictName, setNewDistrictName] = useState("");
  const [isAddingDistrict, setIsAddingDistrict] = useState(false);

  // Load employee details and current double-assignment status maps
  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true);
        const [empRes, statusRes] = await Promise.all([
          employeesAPI.getDetails(id),
          employeesAPI.getAssignedZonesStatus()
        ]);

        if (empRes.success && empRes.data) {
          const empData = empRes.data;
          setEmployee(empData);

          // Restore existing state/district if they were previously assigned
          let resolvedState = "Bihar / बिहार";
          if (empData.workingState) {
            // Find matched state with bilingual details
            const matchedState = statesData.find(s => 
              s.split(" / ")[0].trim().toLowerCase() === empData.workingState.split(" / ")[0].trim().toLowerCase()
            );
            if (matchedState) {
              setSelectedState(matchedState);
              resolvedState = matchedState;
            }
          }

          if (empData.workingDistrict) {
            // Find matched district with bilingual details
            const dists = districtsData[resolvedState] || [];
            const matchedDist = dists.find(d => 
              d.split(" / ")[0].trim().toLowerCase() === empData.workingDistrict.split(" / ")[0].trim().toLowerCase()
            );
            if (matchedDist) {
              setSelectedDistrict(matchedDist);
            } else {
              setSelectedDistrict(empData.workingDistrict);
            }
          }

          // Prepopulate roles parameters
          const role = (empData.role || "").toUpperCase();
          if (role === "DM") {
            setIsAllBlocks(!!empData.isAllBlocksAssigned);
            if (empData.workingBlocks) {
              setSelectedBlocks(empData.workingBlocks.map(b => b._id || b));
            }
          } else if (role === "BS") {
            if (empData.workingBlock) {
              setSelectedBlock(empData.workingBlock._id || empData.workingBlock);
            }
            setIsAllPanchayats(!!empData.isAllPanchayatsAssigned);
            if (empData.workingPanchayats) {
              setSelectedPanchayats(empData.workingPanchayats.map(p => p._id || p));
            }
          } else if (role === "PE") {
            if (empData.workingBlock) {
              setSelectedBlock(empData.workingBlock._id || empData.workingBlock);
            }
            if (empData.workingPanchayat) {
              setSelectedPanchayat(empData.workingPanchayat._id || empData.workingPanchayat);
            }
          }
        } else {
          toast.error(empRes.error || "Failed to fetch employee details");
        }

        if (statusRes.success && statusRes.data) {
          setAssignedStatuses(statusRes.data);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        toast.error("Network error while initializing wizard");
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [id]);

  // Load districts matching selectedState
  useEffect(() => {
    const fetchDistricts = async () => {
      if (selectedState) {
        const staticList = districtsData[selectedState] || [];
        try {
          const cleanState = selectedState.split(" / ")[0].trim();
          const res = await locationAPI.getCustomDistricts(cleanState);
          const customList = res.data ? res.data.map(d => d.name) : [];
          
          const combined = [...new Set([...staticList, ...customList])];
          setDistrictsList(combined.sort((a, b) => a.localeCompare(b)));
        } catch (error) {
          console.error("Fetch custom districts error:", error);
          setDistrictsList(staticList);
        }
      } else {
        setDistrictsList([]);
      }
    };
    fetchDistricts();
  }, [selectedState]);

  // Load blocks matching selectedDistrict (for DM, BS, PE)
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!selectedDistrict) {
        setBlocksList([]);
        return;
      }
      try {
        const cleanState = selectedState.split(" / ")[0].trim();
        const cleanDistrict = selectedDistrict.split(" / ")[0].trim();
        const res = await locationAPI.getBlocks({
          state: cleanState,
          district: cleanDistrict,
          all: true // fetch all unpaginated blocks
        });
        setBlocksList(Array.isArray(res) ? res : res.data || []);
      } catch (error) {
        console.error("Fetch blocks error:", error);
        toast.error("Failed to load blocks for selected district");
      }
    };
    fetchBlocks();
  }, [selectedDistrict, selectedState]);

  // Load panchayats matching selectedBlock (for BS, PE)
  useEffect(() => {
    const fetchPanchayats = async () => {
      if (!selectedBlock) {
        setPanchayatsList([]);
        return;
      }
      try {
        const res = await locationAPI.getPanchayats({
          blockId: selectedBlock,
          all: true // fetch all unpaginated panchayats
        });
        setPanchayatsList(Array.isArray(res) ? res : res.data || []);
      } catch (error) {
        console.error("Fetch panchayats error:", error);
        toast.error("Failed to load panchayats for selected block");
      }
    };
    fetchPanchayats();
  }, [selectedBlock]);

  const handleAddBlock = async () => {
    if (!newBlockName.trim() || !selectedState || !selectedDistrict) return;
    setIsAddingBlock(true);
    try {
      const cleanState = selectedState.split(" / ")[0].trim();
      const cleanDistrict = selectedDistrict.split(" / ")[0].trim();
      
      const res = await locationAPI.createBlock({
        state: cleanState,
        district: cleanDistrict,
        name: newBlockName.trim(),
        country: "India / भारत"
      });
      
      const newBlock = res.data || res;
      setBlocksList(prev => [...prev, newBlock].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedBlock(newBlock._id);
      setNewBlockName("");
      setShowAddBlock(false);
      toast.success("Block added successfully!");
    } catch (err) {
      toast.error("Failed to add block");
    } finally {
      setIsAddingBlock(false);
    }
  };

  const handleAddPanchayat = async () => {
    if (!newPanchayatName.trim() || !selectedState || !selectedDistrict || !selectedBlock) return;
    setIsAddingPanchayat(true);
    try {
      const cleanState = selectedState.split(" / ")[0].trim();
      const cleanDistrict = selectedDistrict.split(" / ")[0].trim();
      
      const res = await locationAPI.createPanchayat({
        state: cleanState,
        district: cleanDistrict,
        block: selectedBlock,
        name: newPanchayatName.trim()
      });
      
      const newPanch = res.data || res;
      setPanchayatsList(prev => [...prev, newPanch].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedPanchayat(newPanch._id);
      setNewPanchayatName("");
      setShowAddPanchayat(false);
      toast.success("Panchayat added successfully!");
    } catch (err) {
      toast.error("Failed to add panchayat");
    } finally {
      setIsAddingPanchayat(false);
    }
  };

  const handleAddDistrict = async () => {
    if (!newDistrictName.trim() || !selectedState) return;
    setIsAddingDistrict(true);
    try {
      const cleanState = selectedState.split(" / ")[0].trim();
      
      const res = await locationAPI.createDistrict({
        state: cleanState,
        name: newDistrictName.trim()
      });
      
      const newDist = res.data?.name || res.name || newDistrictName.trim();
      setDistrictsList(prev => {
        const updated = [...prev, newDist];
        return [...new Set(updated)].sort((a, b) => a.localeCompare(b));
      });
      setSelectedDistrict(newDist);
      setNewDistrictName("");
      setShowAddDistrict(false);
      toast.success("District added successfully!");
    } catch (err) {
      toast.error("Failed to add district");
    } finally {
      setIsAddingDistrict(false);
    }
  };

  // Helper to extract clean english labels
  const getCleanName = (name) => {
    if (!name) return "";
    return name.split(" / ")[0].trim();
  };

  // Determine warnings for blocks (DMs)
  const getBlockAssignees = (blockId) => {
    const cleanDist = getCleanName(selectedDistrict).toLowerCase();
    const matches = assignedStatuses.filter(emp => {
      // Exclude self
      if (emp._id === id) return false;
      const role = (emp.role || "").toUpperCase();
      if (role !== "DM") return false;

      const empDist = getCleanName(emp.workingDistrict).toLowerCase();
      if (empDist !== cleanDist) return false;

      if (emp.isAllBlocksAssigned) return true;
      if (emp.workingBlocks && emp.workingBlocks.some(b => (b._id || b) === blockId)) return true;
      if (emp.workingBlock && (emp.workingBlock._id || emp.workingBlock) === blockId) return true;
      return false;
    });
    return matches.map(m => m.name);
  };

  // Determine warnings for whole district (DMs under "All Blocks")
  const getDistrictDMAllBlocksAssignees = () => {
    const cleanDist = getCleanName(selectedDistrict).toLowerCase();
    const matches = assignedStatuses.filter(emp => {
      if (emp._id === id) return false;
      const role = (emp.role || "").toUpperCase();
      if (role !== "DM") return false;

      const empDist = getCleanName(emp.workingDistrict).toLowerCase();
      return empDist === cleanDist && emp.isAllBlocksAssigned;
    });
    return matches.map(m => m.name);
  };

  // Determine warnings for panchayats (BSs)
  const getPanchayatAssignees = (panchayatId) => {
    const matches = assignedStatuses.filter(emp => {
      if (emp._id === id) return false;
      const role = (emp.role || "").toUpperCase();
      if (role !== "BS") return false;

      // Check block match
      const empBlockId = emp.workingBlock?._id || emp.workingBlock;
      if (empBlockId !== selectedBlock) return false;

      if (emp.isAllPanchayatsAssigned) return true;
      if (emp.workingPanchayats && emp.workingPanchayats.some(p => (p._id || p) === panchayatId)) return true;
      if (emp.workingPanchayat && (emp.workingPanchayat._id || emp.workingPanchayat) === panchayatId) return true;
      return false;
    });
    return matches.map(m => m.name);
  };

  // Determine warning for whole block (BS under "All Panchayats")
  const getBlockBSAllPanchayatsAssignees = () => {
    const matches = assignedStatuses.filter(emp => {
      if (emp._id === id) return false;
      const role = (emp.role || "").toUpperCase();
      if (role !== "BS") return false;

      const empBlockId = emp.workingBlock?._id || emp.workingBlock;
      return empBlockId === selectedBlock && emp.isAllPanchayatsAssigned;
    });
    return matches.map(m => m.name);
  };

  // Determine warnings for PE (Gram Panchayat single selection)
  const getPanchayatPEAssignees = (panchayatId) => {
    const matches = assignedStatuses.filter(emp => {
      if (emp._id === id) return false;
      const role = (emp.role || "").toUpperCase();
      if (role !== "PE") return false;

      const empPanchId = emp.workingPanchayat?._id || emp.workingPanchayat;
      return empPanchId === panchayatId;
    });
    return matches.map(m => m.name);
  };

  // Toggle single block selection
  const handleToggleBlock = (blockId) => {
    setSelectedBlocks(prev =>
      prev.includes(blockId)
        ? prev.filter(id => id !== blockId)
        : [...prev, blockId]
    );
  };

  // Toggle All Blocks
  const handleToggleAllBlocks = (checked) => {
    setIsAllBlocks(checked);
    if (checked) {
      setSelectedBlocks(blocksList.map(b => b._id));
    } else {
      setSelectedBlocks([]);
    }
  };

  // Toggle single panchayat selection
  const handleTogglePanchayat = (panchayatId) => {
    setSelectedPanchayats(prev =>
      prev.includes(panchayatId)
        ? prev.filter(id => id !== panchayatId)
        : [...prev, panchayatId]
    );
  };

  // Toggle All Panchayats
  const handleToggleAllPanchayats = (checked) => {
    setIsAllPanchayats(checked);
    if (checked) {
      setSelectedPanchayats(panchayatsList.map(p => p._id));
    } else {
      setSelectedPanchayats([]);
    }
  };

  // Lock and Save zone handler
  const handleSaveAssignment = async () => {
    if (!selectedDistrict) {
      return toast.error("Please select a valid district.");
    }

    const role = (employee?.role || "").toUpperCase();
    
    // Core payload setup
    const payload = {
      workingState: getCleanName(selectedState),
      workingDistrict: getCleanName(selectedDistrict),
      workingBlock: null,
      workingBlocks: [],
      workingPanchayat: null,
      workingPanchayats: [],
      isAllBlocksAssigned: false,
      isAllPanchayatsAssigned: false
    };

    if (role === "DM") {
      if (!isAllBlocks && selectedBlocks.length === 0) {
        return toast.error("Please assign at least one Block or toggle 'All Blocks'.");
      }
      payload.isAllBlocksAssigned = isAllBlocks;
      payload.workingBlocks = selectedBlocks;
      if (selectedBlocks.length > 0) {
        payload.workingBlock = selectedBlocks[0]; // backward compatibility
      }
    } else if (role === "BS") {
      if (!selectedBlock) {
        return toast.error("Please select an operational Block.");
      }
      if (!isAllPanchayats && selectedPanchayats.length === 0) {
        return toast.error("Please assign at least one Panchayat or toggle 'All Panchayats'.");
      }
      payload.workingBlock = selectedBlock;
      payload.isAllPanchayatsAssigned = isAllPanchayats;
      payload.workingPanchayats = selectedPanchayats;
      if (selectedPanchayats.length > 0) {
        payload.workingPanchayat = selectedPanchayats[0]; // backward compatibility
      }
    } else if (role === "PE") {
      if (!selectedBlock) {
        return toast.error("Please select an operational Block.");
      }
      if (!selectedPanchayat) {
        return toast.error("Please select an operational Panchayat.");
      }
      payload.workingBlock = selectedBlock;
      payload.workingPanchayat = selectedPanchayat;
    } else {
      // ZC or RM or fallback
      payload.workingBlock = selectedBlock || null;
      payload.workingPanchayat = selectedPanchayat || null;
    }

    try {
      setSaving(true);
      const res = await employeesAPI.assignZone(id, payload);
      if (res.success) {
        toast.success("Zone allocated and hierarchy auto-synced successfully!");
        navigate("/admin/zone-selection");
      } else {
        toast.error(res.error || "Failed to allocate zone");
      }
    } catch (error) {
      console.error("Save assignment error:", error);
      toast.error("Network error during zone reservation");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[75vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#3AB000]" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Loading Allocation Wizard...</p>
        </div>
      </DashboardLayout>
    );
  }

  const role = (employee?.role || "DM").toUpperCase();
  const designationName = employee?.designation || employee?.jobPostingId?.title || "Employee";

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-12">
        <div className="pt-4 md:pt-6 max-w-5xl mx-auto space-y-6">
          
          {/* Header Action Row */}
          <div className="flex items-center justify-between border-b border-gray-150 pb-4">
            <button
              onClick={() => navigate("/admin/zone-selection")}
              className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-[#3AB000] uppercase tracking-widest transition-all"
            >
              <ArrowLeft size={16} /> Back to selection list
            </button>
            <div className="inline-block px-3 py-1 bg-gray-100 border border-gray-250 text-[10px] font-black uppercase text-gray-500 rounded-none">
              Wizard Mode: Active
            </div>
          </div>

          {/* Premium Card: Employee Profile summary */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-none flex flex-col md:flex-row items-center justify-between gap-6 border-b-4 border-[#3AB000] relative overflow-hidden">
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#3AB000]/10 to-transparent pointer-events-none" />
            
            <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-none flex items-center justify-center border border-white/20 text-[#3AB000] shrink-0">
                <User size={32} />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-black text-white uppercase tracking-tight truncate max-w-[280px]">
                    {employee?.name}
                  </h1>
                  <span className="text-[9px] font-black bg-[#3AB000] text-white px-2 py-0.5 border border-[#3AB000]/30 uppercase rounded-none tracking-wider">
                    {role}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-gray-300 uppercase mt-1 tracking-wider">
                  Post: {designationName}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Phone size={10} className="text-[#3AB000]" /> {employee?.mobile || employee?.userId?.phone || "N/A"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail size={10} className="text-[#3AB000]" /> {employee?.email || employee?.userId?.email || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-none text-center md:text-right shrink-0 relative z-10 w-full md:w-auto">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Territory Status</p>
              {employee?.isZoneLocked ? (
                <div className="mt-1.5 inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 text-[#3AB000] border border-[#3AB000]/20 text-[10px] font-black uppercase rounded-none">
                  Active Allocation
                </div>
              ) : (
                <div className="mt-1.5 inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-black uppercase rounded-none animate-pulse">
                  Awaiting Mapping
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Step 1: Selection Controls Panel */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-none space-y-5">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2 pb-3 border-b border-gray-200">
                  <Globe size={15} className="text-[#3AB000]" /> Base Territory Setup
                </h3>

                {/* State selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">State</label>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      setSelectedDistrict("");
                      setSelectedBlock("");
                      setSelectedPanchayat("");
                      setSelectedBlocks([]);
                      setSelectedPanchayats([]);
                    }}
                    className="w-full bg-white border border-gray-250 px-4 py-3 rounded-none text-xs font-black text-gray-700 focus:border-[#3AB000] outline-none transition-all cursor-pointer"
                  >
                    {statesData.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* District selector */}
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">District</label>
                    {selectedState && (
                      <button 
                        type="button" 
                        onClick={() => setShowAddDistrict(!showAddDistrict)} 
                        className="text-[9px] font-black text-[#3AB000] hover:underline uppercase tracking-widest flex items-center gap-1"
                      >
                        {showAddDistrict ? "Cancel" : "+ Add Missing"}
                      </button>
                    )}
                  </div>
                  {showAddDistrict ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newDistrictName} 
                        onChange={e => setNewDistrictName(e.target.value)} 
                        placeholder="Enter district name" 
                        className="flex-1 bg-white border border-gray-250 px-4 py-3 rounded-none text-xs font-bold text-gray-700 outline-none focus:border-[#3AB000]" 
                        autoFocus
                      />
                      <button 
                        type="button" 
                        onClick={handleAddDistrict} 
                        disabled={isAddingDistrict || !newDistrictName.trim()} 
                        className="px-6 bg-[#3AB000] hover:bg-[#2d8a00] text-white font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {isAddingDistrict ? <Loader2 size={14} className="animate-spin" /> : "Add"}
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedDistrict}
                      onChange={(e) => {
                        setSelectedDistrict(e.target.value);
                        setSelectedBlock("");
                        setSelectedPanchayat("");
                        setSelectedBlocks([]);
                        setSelectedPanchayats([]);
                      }}
                      className="w-full bg-white border border-gray-250 px-4 py-3 rounded-none text-xs font-black text-gray-700 focus:border-[#3AB000] outline-none transition-all cursor-pointer"
                    >
                      <option value="">-- Choose District --</option>
                      {districtsList.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Block selector (Only visible for BS and PE) */}
                {(role === "BS" || role === "PE") && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Operational Block</label>
                      {selectedDistrict && (
                        <button 
                          type="button" 
                          onClick={() => setShowAddBlock(!showAddBlock)} 
                          className="text-[9px] font-black text-[#3AB000] hover:underline uppercase tracking-widest flex items-center gap-1"
                        >
                          {showAddBlock ? "Cancel" : "+ Add Missing"}
                        </button>
                      )}
                    </div>
                    {showAddBlock ? (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newBlockName} 
                          onChange={e => setNewBlockName(e.target.value)} 
                          placeholder="Enter block name" 
                          className="flex-1 bg-white border border-gray-250 px-4 py-3 rounded-none text-xs font-bold text-gray-700 outline-none focus:border-[#3AB000]" 
                          autoFocus
                        />
                        <button 
                          type="button" 
                          onClick={handleAddBlock} 
                          disabled={isAddingBlock || !newBlockName.trim()} 
                          className="px-6 bg-[#3AB000] hover:bg-[#2d8a00] text-white font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {isAddingBlock ? <Loader2 size={14} className="animate-spin" /> : "Add"}
                        </button>
                      </div>
                    ) : (
                      <select
                        value={selectedBlock}
                        onChange={(e) => {
                          setSelectedBlock(e.target.value);
                          setSelectedPanchayat("");
                          setSelectedPanchayats([]);
                        }}
                        disabled={!selectedDistrict}
                        className="w-full bg-white border border-gray-250 px-4 py-3 rounded-none text-xs font-black text-gray-700 focus:border-[#3AB000] outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Choose Block --</option>
                        {blocksList.map(b => (
                          <option key={b._id} value={b._id}>{b.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Single Panchayat selector (Only visible for PE) */}
                {role === "PE" && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Gram Panchayat</label>
                      {selectedBlock && (
                        <button 
                          type="button" 
                          onClick={() => setShowAddPanchayat(!showAddPanchayat)} 
                          className="text-[9px] font-black text-[#3AB000] hover:underline uppercase tracking-widest flex items-center gap-1"
                        >
                          {showAddPanchayat ? "Cancel" : "+ Add Missing"}
                        </button>
                      )}
                    </div>
                    {showAddPanchayat ? (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newPanchayatName} 
                          onChange={e => setNewPanchayatName(e.target.value)} 
                          placeholder="Enter panchayat name" 
                          className="flex-1 bg-white border border-gray-250 px-4 py-3 rounded-none text-xs font-bold text-gray-700 outline-none focus:border-[#3AB000]" 
                          autoFocus
                        />
                        <button 
                          type="button" 
                          onClick={handleAddPanchayat} 
                          disabled={isAddingPanchayat || !newPanchayatName.trim()} 
                          className="px-6 bg-[#3AB000] hover:bg-[#2d8a00] text-white font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {isAddingPanchayat ? <Loader2 size={14} className="animate-spin" /> : "Add"}
                        </button>
                      </div>
                    ) : (
                      <select
                        value={selectedPanchayat}
                        onChange={(e) => setSelectedPanchayat(e.target.value)}
                        disabled={!selectedBlock}
                        className="w-full bg-white border border-gray-250 px-4 py-3 rounded-none text-xs font-black text-gray-700 focus:border-[#3AB000] outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Choose Panchayat --</option>
                        {panchayatsList.map(p => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Dynamic Notification panel about reporting mapping */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-none flex gap-3">
                <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Self-Healing Hierarchy</p>
                  <p className="text-[11px] font-bold text-blue-800 leading-normal">
                    Saving zone updates triggers immediate database cascading. Subordinates will auto-link to their superiors dynamically (PE &rarr; BS &rarr; DM).
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Role-Based Checklist & Selection Summary */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* If district is not selected */}
              {!selectedDistrict ? (
                <div className="bg-white border border-gray-200 rounded-none min-h-[350px] flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-gray-50 border border-gray-150 rounded-none flex items-center justify-center text-gray-300 mb-4">
                    <MapPin size={30} />
                  </div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Awaiting Location Parameter</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5 max-w-sm leading-relaxed">
                    Please select a State and District on the left control panel to launch the geographical assignment checklists.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-none overflow-hidden flex flex-col min-h-[350px] animate-in fade-in duration-500">
                  {/* Dynamic list header */}
                  <div className="bg-gray-50 border-b border-gray-150 px-6 py-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <Building size={14} className="text-[#3AB000]" />
                        {role === "DM" ? "Geographical Blocks Assignment" : role === "BS" ? "Gram Panchayats Assignment" : "Selected Territory Details"}
                      </h3>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mt-1">
                        State: {getCleanName(selectedState)} | District: {getCleanName(selectedDistrict)}
                        {selectedBlock && ` | Block: ${blocksList.find(b => b._id === selectedBlock)?.name || ""}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#3AB000] animate-pulse" />
                      <span className="text-[9px] font-black text-[#3AB000] uppercase tracking-widest">Dynamic Validation</span>
                    </div>
                  </div>

                  <div className="flex-1 p-6 space-y-6">
                    {/* WIZARD FOR DM (BLOCKS CHECKLIST) */}
                    {role === "DM" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-yellow-50/50 border border-yellow-200/50 p-4 rounded-none">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="toggleAllBlocks"
                              checked={isAllBlocks}
                              onChange={(e) => handleToggleAllBlocks(e.target.checked)}
                              className="w-4 h-4 accent-[#3AB000] rounded-none border-gray-300 cursor-pointer focus:ring-0 focus:ring-offset-0 mt-0.5"
                            />
                            <div>
                              <label htmlFor="toggleAllBlocks" className="text-xs font-black text-gray-900 uppercase tracking-wider block cursor-pointer">
                                Assign All Blocks in District
                              </label>
                              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tight mt-0.5">
                                Selects all current and future blocks inside {getCleanName(selectedDistrict)}.
                              </p>
                            </div>
                          </div>

                          {/* Dynamic double-assignment indicator for DM whole district */}
                          {getDistrictDMAllBlocksAssignees().length > 0 && (
                            <div className="flex items-center gap-1.5 bg-yellow-100 text-yellow-800 border border-yellow-200 px-2.5 py-1 text-[9px] font-black uppercase rounded-none">
                              <AlertTriangle size={10} /> Already Assigned to: {getDistrictDMAllBlocksAssignees().join(", ")}
                            </div>
                          )}
                        </div>

                        {/* Blocks checklist grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar p-1">
                          {blocksList.map(blockItem => {
                            const isSelected = selectedBlocks.includes(blockItem._id);
                            const assignees = getBlockAssignees(blockItem._id);
                            return (
                              <div
                                key={blockItem._id}
                                onClick={() => !isAllBlocks && handleToggleBlock(blockItem._id)}
                                className={`p-4 rounded-none border flex items-center justify-between gap-4 transition-all duration-200 ${
                                  isAllBlocks ? "bg-gray-50 border-gray-250 cursor-not-allowed opacity-75" : 
                                  isSelected ? "bg-green-50 border-[#3AB000] cursor-pointer" : 
                                  "bg-white border-gray-200 cursor-pointer hover:border-[#3AB000]"
                                }`}
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}} // handled by row click
                                    disabled={isAllBlocks}
                                    className="w-4 h-4 accent-[#3AB000] rounded-none border-gray-300 cursor-pointer focus:ring-0 focus:ring-offset-0 shrink-0"
                                  />
                                  <span className={`text-[12px] font-black uppercase tracking-tight truncate ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                                    {blockItem.name}
                                  </span>
                                </div>

                                {assignees.length > 0 && (
                                  <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 text-[8px] font-black uppercase rounded-none shrink-0">
                                    <AlertTriangle size={8} /> Occupied: {assignees.join(", ")}
                                  </span>
                                )}
                              </div>
                            );
                          })}

                          {blocksList.length === 0 && (
                            <p className="text-xs text-gray-400 font-bold uppercase py-6 italic text-center col-span-2">
                              No geographical blocks cataloged for this district.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* WIZARD FOR BS (PANCHAYATS CHECKLIST) */}
                    {role === "BS" && (
                      <div className="space-y-4">
                        {!selectedBlock ? (
                          <div className="py-12 text-center border-2 border-dashed border-gray-150 rounded-none opacity-60">
                            <Building size={28} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-xs font-black uppercase text-gray-400 tracking-wider">Awaiting Operational Block selection</p>
                          </div>
                        ) : (
                          <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between bg-yellow-50/50 border border-yellow-200/50 p-4 rounded-none">
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  id="toggleAllPanchayats"
                                  checked={isAllPanchayats}
                                  onChange={(e) => handleToggleAllPanchayats(e.target.checked)}
                                  className="w-4 h-4 accent-[#3AB000] rounded-none border-gray-300 cursor-pointer focus:ring-0 focus:ring-offset-0 mt-0.5"
                                />
                                <div>
                                  <label htmlFor="toggleAllPanchayats" className="text-xs font-black text-gray-900 uppercase tracking-wider block cursor-pointer">
                                    Assign All Panchayats in Block
                                  </label>
                                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tight mt-0.5">
                                    Selects all current and future Gram Panchayats inside this block.
                                  </p>
                                </div>
                              </div>

                              {/* Dynamic double-assignment indicator for BS whole block */}
                              {getBlockBSAllPanchayatsAssignees().length > 0 && (
                                <div className="flex items-center gap-1.5 bg-yellow-100 text-yellow-800 border border-yellow-200 px-2.5 py-1 text-[9px] font-black uppercase rounded-none">
                                  <AlertTriangle size={10} /> Already Assigned to: {getBlockBSAllPanchayatsAssignees().join(", ")}
                                </div>
                              )}
                            </div>

                            {/* Panchayats checklist grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar p-1">
                              {panchayatsList.map(panchItem => {
                                const isSelected = selectedPanchayats.includes(panchItem._id);
                                const assignees = getPanchayatAssignees(panchItem._id);
                                return (
                                  <div
                                    key={panchItem._id}
                                    onClick={() => !isAllPanchayats && handleTogglePanchayat(panchItem._id)}
                                    className={`p-4 rounded-none border flex items-center justify-between gap-4 transition-all duration-200 ${
                                      isAllPanchayats ? "bg-gray-50 border-gray-250 cursor-not-allowed opacity-75" : 
                                      isSelected ? "bg-green-50 border-[#3AB000] cursor-pointer" : 
                                      "bg-white border-gray-200 cursor-pointer hover:border-[#3AB000]"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}} // handled by row click
                                        disabled={isAllPanchayats}
                                        className="w-4 h-4 accent-[#3AB000] rounded-none border-gray-300 cursor-pointer focus:ring-0 focus:ring-offset-0 shrink-0"
                                      />
                                      <span className={`text-[12px] font-black uppercase tracking-tight truncate ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                                        {panchItem.name}
                                      </span>
                                    </div>

                                    {assignees.length > 0 && (
                                      <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 text-[8px] font-black uppercase rounded-none shrink-0">
                                        <AlertTriangle size={8} /> Occupied: {assignees.join(", ")}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}

                              {panchayatsList.length === 0 && (
                                <p className="text-xs text-gray-400 font-bold uppercase py-6 italic text-center col-span-2">
                                  No Gram Panchayats cataloged for this block.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* WIZARD FOR PE (SINGLE PANCHAYAT SELECTION FEEDBACK) */}
                    {role === "PE" && (
                      <div className="space-y-4">
                        {!selectedPanchayat ? (
                          <div className="py-12 text-center border-2 border-dashed border-gray-150 rounded-none opacity-60">
                            <MapPin size={28} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-xs font-black uppercase text-gray-400 tracking-wider">Awaiting Gram Panchayat Selection</p>
                          </div>
                        ) : (
                          <div className="bg-gray-50 border border-gray-200 p-6 rounded-none flex flex-col md:flex-row items-center justify-between gap-6 animate-in zoom-in-95 duration-300">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-white border border-gray-150 rounded-none flex items-center justify-center text-[#3AB000] shrink-0">
                                <CheckCircle2 size={24} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Working Zone</p>
                                <h4 className="text-base font-black text-gray-900 uppercase tracking-tight mt-0.5">
                                  {panchayatsList.find(p => p._id === selectedPanchayat)?.name}
                                </h4>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-1.5">
                                  Block: {blocksList.find(b => b._id === selectedBlock)?.name} | State: {getCleanName(selectedState)}
                                </p>
                              </div>
                            </div>

                            {/* Warnings for PE occupancy */}
                            {getPanchayatPEAssignees(selectedPanchayat).length > 0 ? (
                              <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200 px-4 py-2 text-[10px] font-black uppercase rounded-none">
                                <AlertTriangle size={12} className="text-yellow-500 shrink-0" />
                                <div>
                                  <span>Already Assigned to:</span>
                                  <span className="block font-black text-xs text-yellow-800">{getPanchayatPEAssignees(selectedPanchayat).join(", ")}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 text-[9px] font-black uppercase rounded-none">
                                <CheckCircle2 size={12} className="text-[#3AB000]" /> Available Zone
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Wizard Save / Submit Footer */}
                  <div className="p-6 bg-gray-50 border-t border-gray-150 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center sm:text-left">
                      {role === "DM" ? `${selectedBlocks.length} Blocks Selected` : role === "BS" ? `${selectedPanchayats.length} Panchayats Selected` : selectedPanchayat ? "1 Panchayat Selected" : "0 selections"}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => navigate("/admin/zone-selection")}
                        className="flex-1 sm:flex-none px-6 py-3 bg-white border border-gray-250 hover:border-gray-400 text-xs font-black text-gray-500 uppercase tracking-wider rounded-none transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAssignment}
                        disabled={saving}
                        className="flex-1 sm:flex-none px-8 py-3 bg-[#3AB000] hover:bg-[#2d8a00] text-white text-xs font-black uppercase tracking-widest rounded-none transition-all flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Save size={14} />
                        )}
                        Lock & Save Zone
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminZoneAssignment;
