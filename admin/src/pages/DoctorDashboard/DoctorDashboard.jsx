import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { doctorsAPI } from "../../utils/api";
import { FileText, Stethoscope, Clock, CheckCircle2 } from "lucide-react";

const DoctorDashboard = () => {
  const [tokens, setTokens] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, tokensRes] = await Promise.all([
        doctorsAPI.getProfile(),
        doctorsAPI.getMyTokens()
      ]);
      if (profileRes.success && profileRes.doctor) {
        setDoctor(profileRes.doctor);
      }
      if (tokensRes.success) {
        setTokens(tokensRes.tokens);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const pendingTokens = tokens.filter(t => t.status === "pending").length;
  const completedTokens = tokens.filter(t => t.status === "completed").length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AB000] mx-auto"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white p-0 md:ml-6 px-2 md:px-6 pb-10">
        <div className="pt-4 md:pt-6">

          {/* Top Banner */}
          {doctor && (
            <div className="bg-gradient-to-r from-[#3AB000] to-[#2d8a00] p-6 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#1a5000] mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30">
                  <Stethoscope className="text-white" size={30} />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Welcome, {doctor.name}</h1>
                  <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Doctor Dashboard Overview</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-none text-center md:text-right shrink-0">
                <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Account Status</p>
                <p className="text-xl font-black text-white uppercase mt-1">{doctor.status}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border-2 border-green-500/20 border-l-8 border-l-green-500 p-6 flex flex-col justify-between gap-4 shadow-sm rounded-none hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 text-green-500 flex items-center justify-center rounded-none border border-green-500/20">
                  <FileText size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Tokens</p>
                  <p className="text-xl font-black text-gray-900 uppercase mt-1 tracking-tight">{tokens.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-yellow-500/20 border-l-8 border-l-yellow-500 p-6 flex flex-col justify-between gap-4 shadow-sm rounded-none hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-50 text-yellow-500 flex items-center justify-center rounded-none border border-yellow-500/20">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pending Tokens</p>
                  <p className="text-xl font-black text-gray-900 uppercase mt-1 tracking-tight">{pendingTokens}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-blue-500/20 border-l-8 border-l-blue-500 p-6 flex flex-col justify-between gap-4 shadow-sm rounded-none hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 flex items-center justify-center rounded-none border border-blue-500/20">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Completed</p>
                  <p className="text-xl font-black text-gray-900 uppercase mt-1 tracking-tight">{completedTokens}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-100 p-0 rounded-none shadow-sm">
            <div className="p-4 border-b-2 border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Stethoscope size={16} className="text-[#3AB000]" />
                Recent Tokens
              </h2>
            </div>
            <div className="p-4">
              {tokens.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No tokens found.</p>
              ) : (
                <div className="space-y-4">
                  {tokens.slice(0, 5).map(token => (
                    <div key={token._id} className="flex justify-between items-center p-3 border border-gray-100 bg-white hover:border-[#3AB000]/50 transition-colors">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{token.tokenNumber}</p>
                        <p className="text-xs text-gray-500">{token.cardholderId?.name} ({token.cardholderId?.phone})</p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 font-black uppercase tracking-widest border ${
                        token.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                        token.status === 'completed' ? 'bg-green-50 text-green-600 border-green-200' :
                        'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {token.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
