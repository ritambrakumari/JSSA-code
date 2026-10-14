import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  ChevronRight,
  ShieldCheck,
  User,
  MapPin,
  Phone,
  Mail,
  Search,
  ArrowLeft,
  Home,
  AlertCircle,
  Network,
  RefreshCw
} from "lucide-react";
import { employeesAPI } from "../../utils/api";
import DashboardLayout from "../../components/DashboardLayout";
import ZoneLockEmptyState from "../../components/ZoneLockEmptyState";
import { useAuth } from "../../auth/AuthProvider";

const GREEN = "#3AB000";

const AccountStatusBadge = ({ status }) => {
  if (!status || status === "Active") return null;
  if (status === "Resigned") {
    return (
      <span className="text-[8px] px-1.5 py-0.5 font-black rounded-none uppercase tracking-widest shrink-0 bg-slate-100 text-slate-600 border border-slate-200">
        Resigned
      </span>
    );
  }
  const isTerminated = status === "Terminated";
  return (
    <span
      className={`text-[8px] px-1.5 py-0.5 font-black rounded-none uppercase tracking-widest shrink-0 ${
        isTerminated
          ? "bg-red-100 text-red-700 border border-red-200"
          : "bg-orange-100 text-orange-700 border border-orange-200"
      }`}
    >
      {isTerminated ? "Terminated" : "Inactive"}
    </span>
  );
};

// ==========================================
// BEAUTIFUL EMPTY STATE COMPONENT
// ==========================================
const MyTeamEmptyState = () => {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 pt-2 md:pt-2 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="flex items-center gap-3 bg-white p-6 border-b-4 border-[#3AB000] shadow-sm">
          <div className="p-3 bg-[#3AB000]/10">
            <Users size={24} className="text-[#3AB000]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">My Team</h1>
            <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.2em] mt-1">Official Member Directory</p>
          </div>
        </div>

        {/* Empty State Card */}
        <div className="bg-white border-2 border-gray-150 p-8 md:p-16 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden group">
          {/* Decorative Corner Line */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#3AB000]/10 to-transparent pointer-events-none" />
          
          <div className="relative mb-8">
            {/* Pulsing glow under icon */}
            <div className="absolute inset-0 bg-[#3AB000]/10 rounded-full blur-xl scale-125 animate-pulse" />
            <div className="relative w-24 h-24 bg-[#3AB000]/5 flex items-center justify-center border-2 border-[#3AB000] rounded-none">
              <Users size={44} className="text-[#3AB000]" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border-2 border-[#3AB000] flex items-center justify-center shadow-md">
              <RefreshCw size={14} className="text-[#3AB000] animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>

          <div className="max-w-md space-y-4">
            <div className="inline-block bg-[#3AB000]/10 px-4 py-1.5 border border-[#3AB000]/30 text-[10px] font-black text-[#3AB000] uppercase tracking-[0.25em]">
              Administration Update in Progress
            </div>
            
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-snug">
              Team details are currently being updated by the JSSA Administration.
            </h2>
            
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
              The regional hierarchy, reporting structures, and active member listings are being synchronized from HQ databases. Please check back later.
            </p>
          </div>

          {/* Security Badge */}
          <div className="mt-12 flex items-center gap-2 bg-gray-50 border border-gray-150 px-4 py-2 opacity-80">
            <ShieldCheck size={14} className="text-[#3AB000]" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              JSSA Secure Directory Protocol
            </span>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

const MyTeam = () => {
  const { isZoneLocked } = useAuth();
  const [hierarchy, setHierarchy] = useState(null);
  const [hierarchyData, setHierarchyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isLocked = false;

  // Robust Role Helper
  const checkRole = (nodeRole, target) => {
    if (!nodeRole) return false;
    const r = nodeRole.toUpperCase();
    if (target === 'PM') return r === 'PM' || r.includes('PROJECT');
    if (target === 'RM') return r === 'RM' || r.includes('REGIONAL');
    if (target === 'ZC') return r === 'ZC' || r.includes('ZONAL');
    if (target === 'DM') return r === 'DM' || r.includes('DISTRICT');
    if (target === 'BS') return r === 'BS' || r.includes('BLOCK');
    if (target === 'PE') return r === 'PE' || r.includes('PANCHAYAT');
    return false;
  };

  // Focused View States
  const [focusedNode, setFocusedNode] = useState(null);
  const [navigationStack, setNavigationStack] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const res = await employeesAPI.getHierarchy();
      console.log("Hierarchy Data Received:", res); // Debugging

      if (res.success && res.data) {
        setHierarchyData(res.data);

        const scopedRoot = res.data.fullTree || res.data.root;

        setHierarchy(scopedRoot);
        setFocusedNode(scopedRoot);

        // Ensure we have valid fields
        const initialStep = {
          id: scopedRoot?.id || scopedRoot?._id || "root",
          name: scopedRoot?.name || (scopedRoot?.isVacant ? "--" : "Team Member"),
          post: scopedRoot?.post || "Regional Manager",
          role: scopedRoot?.role || "RM",
          isVacant: !!scopedRoot?.isVacant
        };

        setNavigationStack([initialStep]);
      } else {
        setError(res.message || "No team structure found");
      }
    } catch (err) {
      console.error("Hierarchy Fetch Error:", err);
      setError("Server connection failed or data corrupted");
    } finally {
      setLoading(false);
    }
  };

  // Navigate to a specific node in the hierarchy
  const handleDrillDown = (node) => {
    if (!node) return;

    const nodeId = node.id || node._id;
    setFocusedNode(node);

    const newStack = [...navigationStack];
    // Avoid duplicates in stack
    setNavigationStack(prev => [...prev, node]);
    setFocusedNode(node);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJumpToNode = (node, pathIndex) => {
    // Reconstruct the navigation stack up to the jumped node
    const rootNode = hierarchy;
    if (!rootNode) return;

    // Helper to find full node in tree
    const findNode = (current, id) => {
      if (!current) return null;
      const currentId = (current.id || current._id || "").toString();
      const targetId = (id || "").toString();
      if (currentId === targetId) return current;
      if (current.subordinates) {
        for (let sub of current.subordinates) {
          const found = findNode(sub, id);
          if (found) return found;
        }
      }
      return null;
    };

    const targetNode = findNode(hierarchy, node.id || node._id);

    // Fallback: If not found in tree (e.g., it's a vacant path node), try to match by role and zone
    if (!targetNode && node.isVacant) {
      // Search for a vacant node in the tree that matches this role and zone
      const findVacantNode = (current) => {
        if (current.isVacant && current.role === node.role) {
          // For ZC/DM, check district match
          if (current.zone?.district === node.zone?.district) return current;
        }
        if (current.subordinates) {
          for (let sub of current.subordinates) {
            const found = findVacantNode(sub);
            if (found) return found;
          }
        }
        return null;
      };
      const vNode = findVacantNode(hierarchy);
      if (vNode) {
        setFocusedNode(vNode);
        // For vacant nodes, we don't fully reconstruct the stack for now 
        // to keep it safe, just jump.
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (!targetNode) return;

    let newStack = [rootNode];

    // Add path elements up to the clicked index
    const limit = Math.min(pathIndex, hierarchyData?.path?.length || 0);
    for (let i = 1; i <= limit; i++) {
      const pathNode = hierarchyData.path[i - 1]; // Index adjustment
      if (pathNode) {
        const stepNode = findNode(hierarchy, pathNode.id || pathNode._id);
        if (stepNode && !newStack.find(s => (s.id || s._id) === (stepNode.id || stepNode._id))) {
          newStack.push(stepNode);
        }
      }
    }

    // Crucial: Always add the target node to the end of the stack if it's not already the root
    if ((targetNode.id || targetNode._id) !== (rootNode.id || rootNode._id)) {
      if (!newStack.find(s => (s.id || s._id) === (targetNode.id || targetNode._id))) {
        newStack.push(targetNode);
      }
    }

    setNavigationStack(newStack);
    setFocusedNode(targetNode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate back using breadcrumbs
  const handleBreadcrumbClick = (index) => {
    const newStack = navigationStack.slice(0, index + 1);
    const targetId = newStack[newStack.length - 1].id;

    // Recursive search to find the node by ID in the tree
    const findNode = (current, id) => {
      const currentId = current.id || current._id;
      if (currentId === id) return current;
      if (current.subordinates) {
        for (let sub of current.subordinates) {
          const found = findNode(sub, id);
          if (found) return found;
        }
      }
      return null;
    };

    const targetNode = findNode(hierarchy, targetId);
    if (targetNode) {
      setFocusedNode(targetNode);
      setNavigationStack(newStack);
    }
  };

  const filteredSubordinates = useMemo(() => {
    if (!focusedNode || !focusedNode.subordinates) return [];

    const subs = Array.isArray(focusedNode.subordinates) ? focusedNode.subordinates.filter(Boolean) : [];
    if (!searchQuery.trim()) return subs;

    return subs.filter(sub =>
      (sub.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.post || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.zone?.district || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [focusedNode, searchQuery]);

  // ==========================================
  // CONDITIONAL RENDER FLAG
  // ==========================================
  // Note: SHOW_EMPTY_STATE removed — real hierarchy data now active

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#3AB000] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading State Hierarchy...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isZoneLocked) {
    return (
      <DashboardLayout>
        <div className="py-20">
          <ZoneLockEmptyState
            title="Team Hierarchy Locked"
            description="Your organizational structure will be visible once you lock your working district and block area in the profile settings."
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 relative min-h-screen">
        <div className={`space-y-8 transition-all duration-500 ${isLocked ? 'blur-[3px] pointer-events-none select-none opacity-60' : ''}`}>

          {/* HEADER & SEARCH */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#3AB000]/10 rounded-none">
                  <Network size={20} className="text-[#3AB000]" />
                </div>
                <h1 className="text-xl font-black uppercase tracking-tight text-gray-900">Team Explorer</h1>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-10">Optimized for 8,000+ state members</p>
            </div>

            <div className="relative group max-w-md w-full">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3AB000] transition-colors" />
              <input
                type="text"
                placeholder="SEARCH BY NAME, ROLE OR DISTRICT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-gray-100 p-4 pl-12 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#3AB000] transition-all shadow-sm"
              />
            </div>
          </div>

          {/* BREADCRUMBS NAVIGATION */}
          <div className="flex items-center gap-2 bg-white p-3 border-2 border-gray-100 overflow-x-auto no-scrollbar shadow-sm">
            <button
              onClick={() => handleBreadcrumbClick(0)}
              className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-[#3AB000] transition-all flex-shrink-0"
            >
              <Home size={16} />
            </button>

            {navigationStack.map((step, idx) => (
              <React.Fragment key={step.id}>
                <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                <button
                  onClick={() => handleBreadcrumbClick(idx)}
                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 transition-all flex-shrink-0
                  ${idx === navigationStack.length - 1 ? 'bg-[#3AB000] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  {step.isVacant ? `--` : step.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* MAIN EXPLORER AREA */}
          <div className="max-w-7xl mx-auto space-y-8">
            {/* QUICK NAVIGATION PATH - For quick access to personal hierarchy */}
            {hierarchyData?.path && hierarchyData.path.length > 0 && !checkRole(hierarchyData.me?.role, 'RM') && !checkRole(hierarchyData.me?.role, 'PM') && (
              <div className="bg-white/60 backdrop-blur-md border border-[#3AB000]/20 p-5 rounded-none shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-[#3AB000]/10 rounded-none flex items-center justify-center">
                    <ShieldCheck size={18} className="text-[#3AB000]" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black text-[#3AB000] uppercase tracking-widest leading-none mb-1">Your Reporting Chain</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase">आपका रिपोर्टिंग पदानुक्रम</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {hierarchyData.path.map((node, idx) => (
                    <React.Fragment key={node.id || idx}>
                      <button
                        onClick={() => handleJumpToNode(node, idx)}
                        className={`group flex flex-col items-start px-5 py-2.5 rounded-none border-2 transition-all text-left min-w-[100px] shadow-sm
                        ${node.isVacant
                            ? 'bg-gray-50 border-dashed border-gray-200 hover:border-orange-300'
                            : node.accountStatus === 'Terminated'
                              ? 'bg-red-50/40 border-red-200 hover:border-red-400'
                              : node.accountStatus === 'Resigned'
                                ? 'bg-slate-50/40 border-slate-200 hover:border-slate-400'
                                : node.accountStatus === 'Inactive'
                                  ? 'bg-orange-50/40 border-orange-200 hover:border-orange-400'
                                  : 'bg-white border-gray-100 hover:border-[#3AB000] hover:shadow-md hover:-translate-y-0.5'}`}
                      >
                        <span className={`text-[9px] font-black uppercase tracking-widest mb-0.5
                        ${node.isVacant ? 'text-gray-400' : 'text-[#3AB000]'}`}>
                          {node.role || node.post}
                        </span>
                        <span className={`text-[13px] font-black truncate max-w-[140px] leading-tight
                        ${node.isVacant ? 'text-gray-400 italic font-medium' : 'text-gray-800 group-hover:text-black'}`}>
                          {node.name}
                        </span>
                        <AccountStatusBadge status={node.accountStatus} />
                      </button>
                      <ChevronRight size={18} className="text-gray-300 mx-1" />
                    </React.Fragment>
                  ))}

                  <button
                    onClick={() => {
                      console.log("Jumping to self:", hierarchyData.me);
                      handleJumpToNode(hierarchyData.me, hierarchyData.path.length);
                    }}
                    className="flex flex-col items-start px-5 py-2.5 bg-[#3AB000] border border-[#3AB000] rounded-none shadow-[0_8px_20px_rgba(58,176,0,0.3)] text-left hover:scale-[1.02] hover:brightness-110 active:scale-95 transition-all group"
                  >
                    <span className="text-[9px] font-black text-white/80 uppercase tracking-widest mb-0.5">YOU / आप</span>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-black text-white leading-tight">
                        {hierarchyData.me?.name}
                      </span>
                      <span className="text-[10px] font-bold text-white/90 bg-black/10 px-2 py-0.5 rounded-none mt-1 border border-white/10 uppercase tracking-tighter">
                        {hierarchyData.me?.post}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* HIERARCHY EXPLORER HEADER */}
            {focusedNode && (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-[#3AB000]/40"></div>
                  <div className="text-[13px] font-black text-[#2D8800] uppercase tracking-[0.05em] bg-[#3AB000]/10 px-8 py-2.5 rounded-none border-2 border-[#3AB000]/30 shadow-[0_0_15px_rgba(58,176,0,0.1)] flex items-center gap-3">
                    <ShieldCheck size={16} className="text-[#3AB000]" />
                    {checkRole(focusedNode.role, 'PM') ? `Project Manager (PM) / परियोजना प्रबंधक` :
                      checkRole(focusedNode.role, 'RM') ? `Regional Manager (RM) / क्षेत्रीय प्रबंधक` :
                        checkRole(focusedNode.role, 'ZC') ? `Zonal Coordinator (ZC) / जोनल समन्वयक` :
                          checkRole(focusedNode.role, 'DM') ? `District Manager (DM) / जिला प्रबंधक` :
                            checkRole(focusedNode.role, 'BS') ? `Block Supervisor (BS) / ब्लॉक पर्यवेक्षक` :
                              'Officer In Charge / प्रभारी अधिकारी'}
                  </div>
                  <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-[#3AB000]/40"></div>
                </div>
                <EmployeeCard
                  employee={focusedNode}
                  isFocused={true}
                  isMe={focusedNode.isMe}
                />
                <div className="h-10 w-0.5 bg-gradient-to-b from-[#3AB000] to-transparent"></div>
              </div>
            )}

            {/* SUBORDINATES GRID */}
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-gray-200 to-gray-200"></div>
                <div className="flex flex-col items-center gap-1.5 px-6">
                  <h2 className="text-[14px] font-black text-gray-800 uppercase tracking-[0.08em] flex items-center gap-3 text-center">
                    <Users size={18} className="text-[#3AB000]" />
                    {checkRole(focusedNode?.role, 'PM') ? 'Regional Managers / क्षेत्रीय प्रबंधक' :
                      checkRole(focusedNode?.role, 'RM') ? 'Zonal Coordinators / जोनल समन्वयक' :
                        checkRole(focusedNode?.role, 'ZC') ? 'District Managers / जिला प्रबंधक' :
                          checkRole(focusedNode?.role, 'DM') ? 'Block Supervisors / ब्लॉक पर्यवेक्षक' :
                            checkRole(focusedNode?.role, 'BS') ? 'Panchayat Executives / पंचायत कार्यकारी' :
                              'Reporting Team Members / रिपोर्टिंग टीम'}
                  </h2>
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#3AB000] to-transparent rounded-none opacity-40 shadow-[0_0_8px_rgba(58,176,0,0.3)]"></div>
                </div>
                <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-gray-200 to-gray-200"></div>
              </div>

              {filteredSubordinates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSubordinates.map((sub) => {
                    // PE is the leaf level — no drill-down possible
                    const isPE = (sub.role || "").toUpperCase() === "PE";
                    return (
                      <EmployeeCard
                        key={sub.id}
                        employee={sub}
                        onClick={isPE ? undefined : () => handleDrillDown(sub)}
                        isMe={sub.isMe}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-none">
                  <Users size={40} className="text-gray-200 mb-4" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No active subordinates found at this level</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {isZoneLocked && isLocked && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/5 backdrop-blur-[2px]">
            <div className="bg-black/90 text-white px-8 py-4 text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl border-t-4 border-[#3AB000] animate-in zoom-in-95 duration-300 text-center">
              Access to Team Hierarchy will be granted after official training
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

/* ── PREMIER EMPLOYEE CARD COMPONENT ── */
const EmployeeCard = ({ employee, isFocused = false, onClick, isMe = false }) => {
  const isVacant = employee.isVacant;
  const accountStatus = employee.accountStatus || "Active";
  const isInactive = accountStatus === "Inactive";
  const isTerminated = accountStatus === "Terminated";
  const isResigned = accountStatus === "Resigned";
  const isUnavailable = isInactive || isTerminated || isResigned;

  return (
    <div
      onClick={onClick}
      className={`relative group transition-all duration-500 flex flex-col
        ${onClick ? 'cursor-pointer hover:-translate-y-2' : ''}
        ${isFocused ? 'max-w-md w-full' : 'w-full'}`}
    >
      {/* "YOU" Pulse Badge */}
      {isMe && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30">
          <div className="relative">
            <div className="absolute inset-0 bg-[#3AB000] rounded-none animate-ping opacity-20"></div>
            <div className="bg-[#3AB000] text-white text-[9px] font-black px-4 py-1.5 rounded-none shadow-xl border-2 border-white flex items-center gap-1.5 whitespace-nowrap">
              <div className="w-1.5 h-1.5 bg-white rounded-none animate-pulse"></div>
              YOU
            </div>
          </div>
        </div>
      )}

      {/* Main Card Body */}
      <div className={`p-5 border-2 transition-all shadow-sm flex flex-col gap-3 rounded-none
        ${isVacant ? 'border-dashed border-amber-200 bg-amber-50/20' : ''}
        ${!isVacant && isTerminated ? 'border-red-300 bg-red-50/40 shadow-red-100/50' : ''}
        ${!isVacant && isResigned ? 'border-slate-300 bg-slate-50/40 shadow-slate-100/50' : ''}
        ${!isVacant && isInactive ? 'border-orange-300 bg-orange-50/40 shadow-orange-100/50' : ''}
        ${!isVacant && !isUnavailable ? 'border-[#3AB000]/10 bg-[#3AB000]/[0.02] group-hover:bg-[#3AB000]/[0.05] group-hover:border-[#3AB000]/30 shadow-sm' : ''}
        ${isFocused ? 'border-[#3AB000] ring-8 ring-[#3AB000]/5 shadow-2xl bg-white' : ''}`}>

        {/* Top Info */}
        <div className="flex items-start gap-4 text-left">
          <div className={`relative flex-shrink-0 w-14 h-14 rounded-none flex items-center justify-center transition-all duration-500
            ${isVacant ? 'bg-amber-100/50' : ''}
            ${!isVacant && isTerminated ? 'bg-red-100/60' : ''}
            ${!isVacant && isResigned ? 'bg-slate-100/60' : ''}
            ${!isVacant && isInactive ? 'bg-orange-100/60' : ''}
            ${!isVacant && !isUnavailable ? 'bg-white shadow-inner group-hover:bg-[#3AB000]/10' : ''}`}>
            {isVacant ? (
              <ShieldCheck size={28} className="text-amber-300 opacity-50" />
            ) : employee.photo ? (
              <img src={employee.photo} alt={employee.name} className="w-full h-full object-cover rounded-none" />
            ) : (
              <span className={`text-lg font-black uppercase ${
                isTerminated ? 'text-red-600/70' : isResigned ? 'text-slate-600/70' : isInactive ? 'text-orange-600/70' : 'text-[#3AB000]/60'
              }`}>
                {(employee.name || "??").substring(0, 2)}
              </span>
            )}
            {!isVacant && (
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-none border-2 border-white flex items-center justify-center shadow-lg z-10 ${
                isTerminated ? 'bg-red-600' : isResigned ? 'bg-slate-500' : isInactive ? 'bg-orange-500' : 'bg-[#3AB000]'
              }`}>
                <ShieldCheck size={10} className="text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h3 className={`font-black text-[16px] uppercase tracking-tight truncate transition-colors
                ${isVacant ? 'text-amber-500' : isTerminated ? 'text-red-700' : isResigned ? 'text-slate-700' : isInactive ? 'text-orange-700' : 'text-gray-900 group-hover:text-[#3AB000]'}`}>
                {isVacant ? '--' : employee.name}
              </h3>
              {isVacant && (
                <span className="text-[9px] bg-amber-100 text-amber-600 px-1.5 py-0.5 font-black rounded-none uppercase">Vacant</span>
              )}
              {!isVacant && <AccountStatusBadge status={accountStatus} />}
            </div>
            <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest leading-none">
              {isVacant ? `${employee.post} NOT ASSIGNED` : employee.post}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-black text-[#3AB000] uppercase mt-1.5">
              <MapPin size={9} className="text-[#3AB000]" />
              {employee.role === 'PM'
                ? "INDIA / भारत"
                : employee.role === 'RM'
                ? (employee.zone?.state || "State Level")
                : (employee.zone?.district || employee.zone?.state || "Official Zone")}
              {employee.role !== 'PM' && (
                employee.zone?.isAllBlocksAssigned
                  ? <span className="truncate"> • ALL BLOCKS IN DISTRICT</span>
                  : employee.zone?.blocks && employee.zone.blocks.length > 1
                    ? <span className="truncate" title={employee.zone.blocks.join(', ')}> • {employee.zone.blocks.length} BLOCKS ASSIGNED</span>
                    : employee.zone?.panchayats && employee.zone.panchayats.length > 1
                      ? <span className="truncate" title={employee.zone.panchayats.join(', ')}> • {employee.zone.block} • {employee.zone.panchayats.length} PANCHAYATS</span>
                      : employee.zone?.block
                        ? <span className=""> • {employee.zone.block}</span>
                        : null
              )}
            </div>
          </div>
        </div>

        {/* Contact Info (If Not Vacant) */}
        {!isVacant && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-gray-100/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white shadow-sm rounded-none flex items-center justify-center group-hover:bg-[#3AB000]/5">
                <Phone size={11} className="text-gray-400 group-hover:text-[#3AB000]" />
              </div>
              <span className="text-[12px] font-bold text-gray-700 truncate">{employee.phone || "---"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white shadow-sm rounded-none flex items-center justify-center group-hover:bg-[#3AB000]/5">
                <Mail size={11} className="text-gray-400 group-hover:text-[#3AB000]" />
              </div>
              <span className="text-[12px] font-bold text-gray-700 truncate">{employee.email || "---"}</span>
            </div>
          </div>
        )}

        {/* Action Indicator */}
        {onClick && (
          <div className="flex items-center justify-between pt-2">
            <span className={`text-[8px] font-black uppercase tracking-widest ${
              isVacant ? 'text-gray-300 group-hover:text-[#3AB000]' :
              isTerminated ? 'text-red-600' :
              isResigned ? 'text-slate-600' :
              isInactive ? 'text-orange-600' :
              'text-gray-300 group-hover:text-[#3AB000]'
            }`}>
              {isVacant ? 'View Field Team' : isTerminated ? 'Terminated — View Team' : isResigned ? 'Resigned — View Team' : isInactive ? 'Inactive — View Team' : 'Click to Explore'}
            </span>
            <ChevronRight size={14} className="text-gray-200 group-hover:text-[#3AB000] transition-transform group-hover:translate-x-1" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeam;
