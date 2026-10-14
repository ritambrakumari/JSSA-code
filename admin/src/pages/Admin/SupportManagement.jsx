import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Edit, Headset, MapPin, Search, Phone, Clock, Filter, RefreshCcw } from "lucide-react";
import { api } from "../../utils/api";
import { toast } from "react-hot-toast";

import DashboardLayout from "../../components/DashboardLayout";

const SupportManagement = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statesList, setStatesList] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");

  // Form State
  const [rows, setRows] = useState([{ state: "", mobile: "", startTime: "", endTime: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(null);

  // Time conversion helpers
  const formatTime12Hour = (time24) => {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    const hours = parseInt(h, 10);
    const suffix = hours >= 12 ? "PM" : "AM";
    const hours12 = ((hours + 11) % 12 + 1);
    return `${hours12.toString().padStart(2, '0')}:${m} ${suffix}`;
  };

  const parseTimeTo24Hour = (timeString) => {
    if (!timeString) return "";
    const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return "";
    let [, hours, minutes, modifier] = match;
    hours = parseInt(hours, 10);
    if (hours === 12) hours = 0;
    if (modifier.toUpperCase() === 'PM') hours += 12;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  useEffect(() => {
    fetchContacts();
    fetchStates();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await api.support.getAll();
      if (res.success) {
        setContacts(res.data || []);
      }
    } catch (err) {
      toast.error("Failed to load support contacts");
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const res = await api.location.getStates();
      if (res.success) {
        const uniqueStatesMap = new Map();
        res.data.forEach(stateStr => {
          const cleanName = stateStr.split(" / ")[0].trim().toUpperCase();
          if (!uniqueStatesMap.has(cleanName) || stateStr.includes("/")) {
            uniqueStatesMap.set(cleanName, stateStr);
          }
        });
        setStatesList(Array.from(uniqueStatesMap.values()).sort((a, b) => a.localeCompare(b)));
      }
    } catch (error) {
      console.error("Fetch states failed", error);
    }
  };

  const handleAddRow = () => {
    setRows([...rows, { state: "", mobile: "", startTime: "", endTime: "" }]);
  };

  const handleRemoveRow = (index) => {
    const newRows = [...rows];
    newRows.splice(index, 1);
    setRows(newRows);
  };

  const handleRowChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const handleEdit = (stateData, contact) => {
    let startTime = "";
    let endTime = "";
    
    // Parse the timing string like "10:00 AM - 06:00 PM" or "10:00 AM TO 10:00 PM"
    if (contact.timing) {
      const parts = contact.timing.split(/\s*-\s*|\s+TO\s+/i);
      if (parts.length >= 2) {
        startTime = parseTimeTo24Hour(parts[0]);
        endTime = parseTimeTo24Hour(parts[1]);
      }
    }

    const fullStateString = statesList.find(s => s.split(" / ")[0].trim().toUpperCase() === stateData.state) || stateData.state;

    setEditMode({ stateId: stateData._id, contactId: contact._id });
    setRows([{ 
      state: fullStateString, 
      mobile: contact.mobile, 
      startTime, 
      endTime 
    }]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validRows = rows.map(r => ({
      ...r,
      timing: r.startTime && r.endTime ? `${formatTime12Hour(r.startTime)} - ${formatTime12Hour(r.endTime)}` : ""
    })).filter(r => r.state && r.mobile && r.timing);

    if (validRows.length === 0) {
      toast.error("Please fill at least one row completely with Start and End times.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      let res;
      if (editMode) {
        // Edit single contact
        const dataToUpdate = validRows[0];
        res = await api.support.editContact(editMode.stateId, editMode.contactId, {
          state: dataToUpdate.state,
          mobile: dataToUpdate.mobile,
          timing: dataToUpdate.timing
        });
      } else {
        // Bulk update
        res = await api.support.bulkUpdate(validRows);
      }

      if (res.success) {
        toast.success(editMode ? "Contact updated successfully!" : "Support contacts saved successfully!");
        setIsModalOpen(false);
        setRows([{ state: "", mobile: "", startTime: "", endTime: "" }]);
        setEditMode(null);
        fetchContacts();
      } else {
        toast.error(res.error || "Failed to save contacts");
      }
    } catch (error) {
      toast.error("Error saving contacts");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (stateId, contactId) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;
    try {
      const res = await api.support.deleteContact(stateId, contactId);
      if (res.success) {
        toast.success("Contact deleted");
        fetchContacts();
      } else {
        toast.error(res.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("Error deleting contact");
    }
  };

  const filteredContacts = useMemo(() => {
    return contacts.map(stateData => {
      // If state filter is applied and doesn't match, skip
      if (stateFilter !== "all" && stateData.state !== stateFilter) {
        return null;
      }
      
      // Filter contacts within the state based on search query
      const filteredInner = stateData.contacts.filter(contact => {
        const query = searchQuery.toLowerCase();
        return (
          contact.mobile.toLowerCase().includes(query) ||
          stateData.state.toLowerCase().includes(query)
        );
      });

      if (filteredInner.length === 0) return null;

      return { ...stateData, contacts: filteredInner };
    }).filter(Boolean);
  }, [contacts, searchQuery, stateFilter]);

  const uniqueAvailableStates = useMemo(() => {
    return Array.from(new Set(contacts.map(c => c.state))).sort((a, b) => a.localeCompare(b));
  }, [contacts]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Headset className="text-[#3AB000]" /> Support Management
              </h1>
              <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.2em] mt-1">
                Manage State-wise Floating Support Contacts
              </p>
            </div>
            <div className="flex items-center gap-3 self-end lg:self-auto">
              <button
                onClick={fetchContacts}
                className="h-10 w-10 flex items-center justify-center bg-white border border-gray-300 text-gray-400 hover:text-[#3AB000] hover:border-[#3AB000] rounded transition-all shadow-sm group"
              >
                <RefreshCcw
                  size={18}
                  className={`${loading ? "animate-spin" : ""} group-active:rotate-180 transition-transform`}
                />
              </button>
              <button
                onClick={() => {
                  setRows([{ state: "", mobile: "", timing: "" }]);
                  setIsModalOpen(true);
                }}
                className="bg-black hover:bg-gray-800 text-white text-xs px-4 py-2 h-10 font-medium rounded-none shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide"
              >
                <Plus size={14} /> Add Support
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 mb-6 rounded shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-[#3AB000]" />
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Directory Filters</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Search */}
              <div className="flex items-center border border-gray-200 rounded overflow-hidden h-10 bg-white focus-within:border-[#3AB000] lg:col-span-2">
                <input
                  type="text"
                  placeholder="Search by state or mobile number..."
                  className="flex-1 px-3 text-xs font-bold outline-none text-gray-800"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="bg-[#3AB000] h-full flex items-center px-3 text-white">
                  <Search size={14} />
                </div>
              </div>

              {/* State */}
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="h-10 px-3 bg-white border border-gray-200 rounded text-xs font-black uppercase tracking-wider outline-none cursor-pointer text-gray-700 focus:border-[#3AB000]"
              >
                <option value="all">All States</option>
                {uniqueAvailableStates.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm relative min-h-[400px]">
            {loading ? (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AB000]"></div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                  Loading Contacts...
                </p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-6">
                <Headset className="mx-auto text-gray-300 mb-4 h-12 w-12" />
                <h2 className="text-lg font-black text-gray-600 uppercase">No Contacts Found</h2>
                <p className="text-xs text-gray-400 font-bold uppercase mt-2">Adjust your filters or add new contacts</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] table-fixed text-left text-sm border-collapse">
                  <colgroup>
                    <col className="w-[30%]" />
                    <col className="w-[30%]" />
                    <col className="w-[30%]" />
                    <col className="w-[10%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-[#3AB000] text-white font-black uppercase text-[10px] tracking-widest">
                      <th className="px-4 py-3 text-left">State</th>
                      <th className="px-4 py-3 text-left">Mobile Number</th>
                      <th className="px-4 py-3 text-left">Call Timing</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredContacts.map((stateData) => (
                      <tr key={stateData._id} className="hover:bg-[#f0f9eb] transition-colors group cursor-pointer">
                        {/* State Column */}
                        <td className="px-4 py-3 text-sm relative border-r border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#3AB000]/10 flex items-center justify-center text-[#3AB000] border border-[#3AB000]/20">
                              <MapPin size={16} />
                            </div>
                            <span className="font-bold text-gray-900 leading-none">{stateData.state}</span>
                          </div>
                        </td>

                        {/* Mobile Number Column */}
                        <td className="p-0 align-top border-r border-gray-100">
                          <div className="flex flex-col w-full">
                            {stateData.contacts.map((contact, idx) => (
                              <div key={contact._id} className={`px-4 py-3 flex items-center gap-2 text-xs font-bold text-gray-700 ${idx !== stateData.contacts.length - 1 ? 'border-b border-gray-200' : ''}`}>
                                <Phone size={14} className="text-[#3AB000] shrink-0" />
                                {contact.mobile}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Call Timing Column */}
                        <td className="p-0 align-top border-r border-gray-100">
                          <div className="flex flex-col w-full">
                            {stateData.contacts.map((contact, idx) => (
                              <div key={contact._id} className={`px-4 py-3 flex items-center gap-2 text-xs font-bold text-gray-600 uppercase ${idx !== stateData.contacts.length - 1 ? 'border-b border-gray-200' : ''}`}>
                                <Clock size={14} className="text-[#3AB000] shrink-0" />
                                {contact.timing}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Actions Column */}
                        <td className="p-0 align-top">
                          <div className="flex flex-col w-full h-full">
                            {stateData.contacts.map((contact, idx) => (
                              <div key={contact._id} className={`px-4 py-2 flex items-center justify-end ${idx !== stateData.contacts.length - 1 ? 'border-b border-gray-200' : ''}`}>
                                <button
                                  onClick={() => handleEdit(stateData, contact)}
                                  className="text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 p-1.5 rounded transition-all flex-shrink-0 mr-1"
                                  title="Edit Contact"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(stateData._id, contact._id)}
                                  className="text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 p-1.5 rounded transition-all flex-shrink-0"
                                  title="Delete Contact"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        {/* Add Support Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-[#3AB000] px-6 py-4 flex justify-between items-center text-white">
                <h2 className="text-lg font-black uppercase tracking-wider flex items-center gap-2">
                  {editMode ? <Edit size={20} /> : <Plus size={20} />} 
                  {editMode ? "Edit Support Contact" : "Add Support Contacts"}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditMode(null);
                  }}
                  className="hover:bg-black/20 p-1.5 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    {rows.map((row, index) => (
                      <div key={index} className="flex flex-col md:flex-row gap-4 items-start md:items-end bg-gray-50 p-4 rounded-lg border border-gray-200 relative group">
                        {/* State Dropdown */}
                        <div className="flex-1 w-full">
                          <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">State</label>
                          <select
                            value={row.state}
                            onChange={(e) => handleRowChange(index, "state", e.target.value)}
                            className="w-full p-2.5 text-xs font-bold bg-white border border-gray-300 rounded focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all uppercase text-gray-700"
                            required
                          >
                            <option value="">Select State</option>
                            {statesList.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        {/* Mobile Number */}
                        <div className="flex-1 w-full">
                          <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">Mobile Number</label>
                          <input
                            type="text"
                            value={row.mobile}
                            onChange={(e) => handleRowChange(index, "mobile", e.target.value)}
                            placeholder="e.g. +91 9876543210"
                            className="w-full p-2.5 text-xs font-bold bg-white border border-gray-300 rounded focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all uppercase text-gray-700"
                            required
                          />
                        </div>

                        {/* Timing */}
                        <div className="flex-[1.2] w-full">
                          <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">Call Timing</label>
                          <div className="flex items-center gap-2">
                            <div className="w-full relative">
                              <span className="absolute -top-2 left-2 bg-white px-1 text-[8px] font-bold text-gray-400">FROM</span>
                              <input
                                type="time"
                                value={row.startTime}
                                onChange={(e) => handleRowChange(index, "startTime", e.target.value)}
                                className="w-full p-2.5 text-xs font-bold bg-white border border-gray-300 rounded focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all uppercase text-gray-700"
                                required
                              />
                            </div>
                            <span className="text-gray-400 font-bold text-xs">-</span>
                            <div className="w-full relative">
                              <span className="absolute -top-2 left-2 bg-white px-1 text-[8px] font-bold text-gray-400">TO</span>
                              <input
                                type="time"
                                value={row.endTime}
                                onChange={(e) => handleRowChange(index, "endTime", e.target.value)}
                                className="w-full p-2.5 text-xs font-bold bg-white border border-gray-300 rounded focus:ring-2 focus:ring-[#3AB000] focus:border-[#3AB000] outline-none transition-all uppercase text-gray-700"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* Add/Remove Buttons Inline */}
                        {!editMode && (
                          <div className="flex gap-2 w-full md:w-auto shrink-0 mb-0.5">
                            {rows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(index)}
                                className="bg-red-100 text-red-600 p-2.5 rounded hover:bg-red-200 transition-colors shrink-0"
                                title="Remove Row"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            {index === rows.length - 1 && (
                              <button
                                type="button"
                                onClick={handleAddRow}
                                className="bg-blue-100 text-blue-600 p-2.5 rounded hover:bg-blue-200 transition-colors shrink-0"
                                title="Add New Row"
                              >
                                <Plus size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setEditMode(null);
                      }}
                      className="px-6 py-2.5 text-xs font-black uppercase text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 text-xs font-black uppercase bg-[#3AB000] text-white rounded shadow hover:bg-[#2d8a00] transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? "Saving..." : editMode ? "Update Contact" : "Save Contacts"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SupportManagement;
