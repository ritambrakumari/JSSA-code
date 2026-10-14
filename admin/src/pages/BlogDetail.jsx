import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { blogAPI } from "../utils/api";
import { ArrowLeft, Loader2, Calendar, User } from "lucide-react";
import { toast } from "react-hot-toast";
import DashboardLayout from "../components/DashboardLayout";

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await blogAPI.getById(id);
        if (res.success) {
          setBlog(res.data);
        }
      } catch (error) {
        toast.error("Failed to load blog details");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id, navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-0 md:ml-6 px-2 md:px-6 pb-10 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-[#3AB000] mb-4" size={40} />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Loading Article...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!blog) return null;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-0 md:ml-6 px-2 md:px-6 pb-20">
        <div className="max-w-4xl mx-auto pt-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-8 text-sm font-black uppercase tracking-widest text-gray-600 hover:text-[#3AB000] transition-colors"
          >
            <ArrowLeft size={18} /> Back
          </button>
        {/* Blog Header Info */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tight leading-none mb-6">
            {blog.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white p-4 border-l-4 border-[#3AB000] shadow-sm">
            <div className="flex items-center gap-2">
              <User size={14} className="text-[#3AB000]" />
              {blog.createdBy?.name || "System Administrator"}
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#3AB000]" />
              {new Date(blog.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric"
              })}
            </div>
          </div>
        </div>

        {/* Hero Image */}
        {blog.image && (
          <div className="w-full h-[300px] md:h-[450px] mb-10 border-4 border-white shadow-xl relative overflow-hidden group bg-gray-200">
            <img 
              src={blog.image} 
              alt={blog.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        )}

        {/* Description / Subtitle */}
        <div className="text-xl font-bold text-gray-600 mb-10 italic border-l-2 border-gray-300 pl-4 py-2">
          {blog.description}
        </div>

        {/* Rendered HTML Content */}
        <div className="bg-white p-6 md:p-12 border-2 border-gray-100 shadow-sm">
          <div 
            className="prose prose-lg max-w-none prose-green html-preview-container"
            dangerouslySetInnerHTML={{ __html: blog.htmlContent }} 
          />
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BlogDetail;
