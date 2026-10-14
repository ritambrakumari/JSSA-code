import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, X, Upload, FileImage, FileVideo, MapPin, Tag, Eye, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';

const EmployeeCampReport = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [editId, setEditId] = useState(null);
  const [viewReport, setViewReport] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  
  const [existingImages, setExistingImages] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem('jssa_auth') || '{}');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/camp-report/my-reports`, {
        headers: { Authorization: `Bearer ${authData.token}` }
      });
      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load camp reports');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormData({ title: '', description: '' });
    setTags([]);
    setImages([]);
    setVideos([]);
    setExistingImages([]);
    setExistingVideos([]);
    setTagInput('');
  };

  const openEditModal = (report) => {
    setEditId(report._id);
    setFormData({ title: report.title, description: report.description });
    setTags(report.tags || []);
    setExistingImages(report.images || []);
    setExistingVideos(report.videos || []);
    setImages([]);
    setVideos([]);
    setShowModal(true);
  };

  const handleTagAddButton = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    setTagInput('');
  };

  const handleTagAdd = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTagAddButton();
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Image ${file.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });
    setImages(prev => [...prev, ...validFiles]);
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`Video ${file.name} exceeds 50MB limit`);
        return false;
      }
      return true;
    });
    setVideos(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeVideo = (index) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeExistingVideo = (index) => {
    setExistingVideos(existingVideos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error("Title and Description are required");
      return;
    }
    
    setSubmitting(true);
    const authData = JSON.parse(localStorage.getItem('jssa_auth') || '{}');
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('tags', JSON.stringify(tags));
    if (editId) {
      data.append('existingImages', JSON.stringify(existingImages));
      data.append('existingVideos', JSON.stringify(existingVideos));
    }
    
    images.forEach(file => data.append('media', file));
    videos.forEach(file => data.append('media', file));

    try {
      const url = editId 
        ? `${import.meta.env.VITE_API_URL}/camp-report/${editId}`
        : `${import.meta.env.VITE_API_URL}/camp-report`;
      
      const method = editId ? 'put' : 'post';

      const res = await axios[method](url, data, {
        headers: { 
          Authorization: `Bearer ${authData.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        toast.success(editId ? "Camp Report updated successfully!" : "Camp Report submitted successfully!");
        closeModal();
        fetchReports();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="border-b-4 border-[#3AB000] pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
              <MapPin className="text-[#3AB000]" size={32} /> Camp <span className="text-[#3AB000]">Reports</span>
            </h1>
            <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-[0.3em] mt-1">
              Manage and submit field reports
            </p>
          </div>
          <button
            onClick={() => { closeModal(); setShowModal(true); }}
            className="flex items-center gap-2 bg-[#3AB000] text-white px-6 py-3 font-black text-[11px] uppercase tracking-widest hover:bg-[#2e8c00] transition-colors border border-[#3AB000]"
          >
            <Plus size={16} /> New Report
          </button>
        </div>

      <div className="mb-4">
        <div className="flex items-center gap-3 mb-4 mt-6">
          <div className="h-6 w-1 bg-[#3AB000]"></div>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.15em]">My Submissions</h2>
        </div>
      </div>

      <div className="bg-white border border-[#3AB000] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500 font-bold tracking-widest uppercase text-sm animate-pulse">Loading Reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-10 text-center text-gray-400 font-bold tracking-widest uppercase text-sm">No camp reports found</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#3AB000] text-white">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Date</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Title</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Media</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Tags</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report._id} className="border-b border-gray-100 hover:bg-green-50/50 transition-colors">
                  <td className="p-4 text-xs font-bold text-gray-600 whitespace-nowrap">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-black text-gray-900">{report.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">{report.description}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                      <span className="flex items-center gap-1"><FileImage size={14} className="text-[#3AB000]" /> {report.images?.length || 0}</span>
                      <span className="flex items-center gap-1"><FileVideo size={14} className="text-orange-400" /> {report.videos?.length || 0}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <ul className="list-disc list-inside text-xs font-bold text-gray-700">
                      {report.tags?.slice(0, 3).map((tag, i) => (
                        <li key={i} className="truncate max-w-[150px]">{tag}</li>
                      ))}
                      {report.tags?.length > 3 && (
                        <li className="text-gray-500 text-[10px]">+{report.tags.length - 3} more...</li>
                      )}
                    </ul>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setViewReport(report)}
                        className="p-2 bg-green-50 text-[#3AB000] border border-[#3AB000] hover:bg-[#3AB000] hover:text-white transition-colors"
                        title="View Report"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openEditModal(report)}
                        className="p-2 bg-blue-50 text-blue-600 border border-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                        title="Edit Report"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border-2 border-[#3AB000] w-full max-w-2xl overflow-hidden shadow-2xl relative my-8 rounded-none">
            <div className="p-4 bg-green-50 border-b border-[#3AB000] flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="text-[#3AB000]" size={18} /> {editId ? 'Edit Report' : 'Submit New Report'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-200 transition-colors border border-gray-300">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Report Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border-2 border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-[#3AB000] focus:ring-0 transition-colors rounded-none outline-none"
                  placeholder="e.g. Village Health Camp - Jaipur"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Description</label>
                <textarea
                  required
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border-2 border-gray-200 p-3 text-sm font-medium text-gray-700 focus:border-[#3AB000] focus:ring-0 transition-colors resize-none rounded-none outline-none"
                  placeholder="Describe the camp activities, attendance, and outcomes..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <Tag size={14} className="text-[#3AB000]"/> Key Highlights / Tags
                </label>
                <div className="border-2 border-gray-200 p-3 focus-within:border-[#3AB000] transition-colors rounded-none bg-white">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag, index) => (
                      <div key={index} className="flex items-center gap-1 bg-green-50 border border-[#3AB000] text-[#3AB000] px-2 py-1 text-[10px] font-black uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 bg-[#3AB000] rounded-full mr-1"></span>
                        {tag}
                        <button type="button" onClick={() => removeTag(index)} className="hover:text-red-500 ml-1">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagAdd}
                      className="flex-1 outline-none text-sm font-bold text-gray-700 bg-transparent placeholder-gray-400"
                      placeholder="Type a point..."
                    />
                    <button type="button" onClick={handleTagAddButton} className="px-4 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors">
                      Add Point
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <FileImage size={14} className="text-[#3AB000]" /> Images (Max 10MB)
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 p-6 hover:bg-gray-50 hover:border-[#3AB000] transition-colors cursor-pointer group rounded-none">
                    <Upload size={24} className="text-gray-400 group-hover:text-[#3AB000] mb-2 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Upload Images</span>
                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  {existingImages.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Existing Images</p>
                      {existingImages.map((img, i) => (
                        <div key={`exist-${i}`} className="flex justify-between items-center text-[10px] font-black text-gray-600 bg-green-50 p-2 border border-[#3AB000]/30 uppercase tracking-widest">
                          <span className="truncate max-w-[200px]">{img.split('/').pop()}</span>
                          <button type="button" onClick={() => removeExistingImage(i)} className="text-red-500 hover:text-red-700"><X size={14}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {images.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">New Images</p>
                      {images.map((img, i) => (
                        <div key={`new-${i}`} className="flex justify-between items-center text-[10px] font-black text-gray-600 bg-gray-50 p-2 border border-gray-200 uppercase tracking-widest">
                          <span className="truncate max-w-[200px]">{img.name}</span>
                          <button type="button" onClick={() => removeImage(i)} className="text-red-500 hover:text-red-700"><X size={14}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <FileVideo size={14} className="text-orange-500" /> Videos (Max 50MB)
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 p-6 hover:bg-gray-50 hover:border-orange-400 transition-colors cursor-pointer group rounded-none">
                    <Upload size={24} className="text-gray-400 group-hover:text-orange-400 mb-2 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Upload Videos</span>
                    <input type="file" multiple accept="video/*" onChange={handleVideoChange} className="hidden" />
                  </label>
                  {existingVideos.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Existing Videos</p>
                      {existingVideos.map((vid, i) => (
                        <div key={`exist-${i}`} className="flex justify-between items-center text-[10px] font-black text-gray-600 bg-orange-50 p-2 border border-orange-200 uppercase tracking-widest">
                          <span className="truncate max-w-[200px]">{vid.split('/').pop()}</span>
                          <button type="button" onClick={() => removeExistingVideo(i)} className="text-red-500 hover:text-red-700"><X size={14}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {videos.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">New Videos</p>
                      {videos.map((vid, i) => (
                        <div key={`new-${i}`} className="flex justify-between items-center text-[10px] font-black text-gray-600 bg-gray-50 p-2 border border-gray-200 uppercase tracking-widest">
                          <span className="truncate max-w-[200px]">{vid.name}</span>
                          <button type="button" onClick={() => removeVideo(i)} className="text-red-500 hover:text-red-700"><X size={14}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t-2 border-gray-100 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 font-black text-[11px] uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors border-2 border-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-[#3AB000] text-white font-black text-[11px] uppercase tracking-widest hover:bg-[#2e8c00] transition-colors disabled:opacity-50 border-2 border-[#3AB000]"
                >
                  {submitting ? 'Saving...' : (editId ? 'Save Changes' : 'Submit Report')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border-2 border-[#3AB000] w-full max-w-4xl overflow-hidden shadow-2xl relative my-8 rounded-none">
            <div className="p-4 bg-green-50 border-b border-[#3AB000] flex justify-between items-center sticky top-0 z-10">
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">{viewReport.title}</h2>
                <p className="text-[10px] font-black text-[#3AB000] uppercase tracking-widest mt-1">
                  Submitted on {new Date(viewReport.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setViewReport(null)} className="p-1 hover:bg-gray-200 transition-colors border border-gray-300">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <div className="h-4 w-1 bg-[#3AB000]"></div> Description
                </h3>
                <div className="bg-gray-50 p-4 border border-gray-200 text-xs font-bold text-gray-700 whitespace-pre-wrap leading-relaxed tracking-wide">
                  {viewReport.description}
                </div>
              </div>

              {viewReport.tags && viewReport.tags.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <div className="h-4 w-1 bg-[#3AB000]"></div> Key Highlights / Tags
                  </h3>
                  <div className="bg-gray-50 p-4 border border-gray-200">
                    <ul className="list-disc list-inside text-xs font-bold text-gray-700 space-y-1">
                      {viewReport.tags.map((tag, i) => (
                        <li key={i}>{tag}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {viewReport.images && viewReport.images.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <div className="h-4 w-1 bg-[#3AB000]"></div> Uploaded Images
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {viewReport.images.map((img, i) => (
                      <div key={i} className="relative group overflow-hidden border border-gray-200 shadow-sm aspect-square">
                        <img src={img} alt={`Report Image ${i+1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => setPreviewImage(img)} className="bg-white text-black p-2 rounded-none hover:bg-[#3AB000] hover:text-white transition-colors border border-transparent hover:border-white shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                            <Eye size={14} /> View Full
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewReport.videos && viewReport.videos.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <div className="h-4 w-1 bg-[#3AB000]"></div> Uploaded Videos
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {viewReport.videos.map((vid, i) => (
                      <div key={i} className="relative group overflow-hidden border border-gray-200 shadow-sm bg-black aspect-video">
                        <video src={vid} className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => setPreviewVideo(vid)} className="bg-white text-black p-2 rounded-none hover:bg-[#3AB000] hover:text-white transition-colors border border-transparent hover:border-white shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                            <Eye size={14} /> Play Video
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-[#3AB000] bg-green-50 flex justify-end">
              <button
                onClick={() => setViewReport(null)}
                className="px-6 py-2.5 font-black text-[11px] uppercase tracking-widest text-[#3AB000] bg-white border border-[#3AB000] hover:bg-[#3AB000] hover:text-white transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
          <button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 p-2 text-white transition-colors border border-white/20">
            <X size={24} />
          </button>
          <img src={previewImage} alt="Preview" className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl border border-white/10" />
        </div>
      )}

      {previewVideo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
          <button onClick={() => setPreviewVideo(null)} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 p-2 text-white transition-colors border border-white/20">
            <X size={24} />
          </button>
          <video src={previewVideo} controls autoPlay className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl border border-white/10" />
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3AB000;
        }
      `}</style>
    </div>
    </DashboardLayout>
  );
};

export default EmployeeCampReport;
