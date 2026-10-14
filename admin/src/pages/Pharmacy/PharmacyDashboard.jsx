import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { pharmaciesAPI, pharmacyCategoriesAPI, pharmacyProductsAPI } from "../../utils/api";
import { Activity, LayoutGrid, Package, Stethoscope, AlertTriangle, TrendingUp, IndianRupee, Receipt, Wallet, FileText } from "lucide-react";

const PharmacyDashboard = () => {
  const [pharmacy, setPharmacy] = useState(null);
  const [stats, setStats] = useState({ categories: 0, products: 0 });
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await pharmaciesAPI.getProfile();
        if (profileRes.success && profileRes.pharmacy) {
          setPharmacy(profileRes.pharmacy);
        }

        const [catRes, prodRes, dashStatsRes] = await Promise.all([
          pharmacyCategoriesAPI.getAll(),
          pharmacyProductsAPI.getAll(),
          pharmaciesAPI.getDashboardStats()
        ]);

        setStats({
          categories: catRes.success ? catRes.categories.length : 0,
          products: prodRes.success ? prodRes.products.length : 0
        });

        if (dashStatsRes.success) {
          setDashboardStats(dashStatsRes.stats);
        }

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AB000] mx-auto"></div>
            <p className="text-[10px] font-black uppercase tracking-widest">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!pharmacy) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
            <Stethoscope size={24} className="text-gray-300" />
            <p className="text-[10px] font-black uppercase tracking-widest">Failed to load dashboard</p>
          </div>
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
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30">
                <Stethoscope className="text-white" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Welcome, {pharmacy.name}</h1>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mt-2">Pharmacy Dashboard Overview</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-none text-center md:text-right shrink-0">
              <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Account Status</p>
              <p className="text-xl font-black text-white uppercase mt-1">{pharmacy.status}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border-2 border-[#3AB000]/20 border-l-8 border-l-[#3AB000] p-6 flex flex-col justify-between gap-4 shadow-sm rounded-none hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 text-[#3AB000] flex items-center justify-center rounded-none border border-[#3AB000]/20">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Account Status</p>
                  <p className="text-xl font-black text-gray-900 uppercase mt-1 tracking-tight">{pharmacy.status}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-blue-500/20 border-l-8 border-l-blue-500 p-6 flex flex-col justify-between gap-4 shadow-sm rounded-none hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 flex items-center justify-center rounded-none border border-blue-500/20">
                  <LayoutGrid size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Categories</p>
                  <p className="text-xl font-black text-gray-900 uppercase mt-1 tracking-tight">{stats.categories}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-orange-500/20 border-l-8 border-l-orange-500 p-6 flex flex-col justify-between gap-4 shadow-sm rounded-none hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 flex items-center justify-center rounded-none border border-orange-500/20">
                  <Package size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Products</p>
                  <p className="text-xl font-black text-gray-900 uppercase mt-1 tracking-tight">{stats.products}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Stats Grid (4 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {/* Today's Sales Widget */}
            {dashboardStats && (
              <div className="bg-white border-2 border-yellow-500/20 border-l-8 border-l-yellow-500 p-6 flex flex-col justify-between gap-4 shadow-sm rounded-none hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-50 text-yellow-500 flex items-center justify-center rounded-none border border-yellow-500/20">
                    <IndianRupee size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Today's Revenue</p>
                    <p className="text-xl font-black text-gray-900 uppercase mt-1 tracking-tight">₹{(dashboardStats.todayRevenue || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
            
            {dashboardStats && (
              <div className="bg-white border-2 border-purple-500/20 border-l-8 border-l-purple-500 p-6 flex flex-col justify-between gap-4 shadow-sm rounded-none hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 text-purple-500 flex items-center justify-center rounded-none border border-purple-500/20">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Bills Generated</p>
                    <p className="text-xl font-black text-gray-900 uppercase mt-1 tracking-tight">{dashboardStats.todayBillsCount}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Total Sales Widgets */}
            {dashboardStats && (
              <div className="bg-white border-2 border-cyan-500/20 border-l-8 border-l-cyan-500 p-6 flex flex-col justify-between gap-4 shadow-sm rounded-none hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-50 text-cyan-500 flex items-center justify-center rounded-none border border-cyan-500/20">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Revenue</p>
                    <p className="text-xl font-black text-gray-900 uppercase mt-1 tracking-tight">₹{(dashboardStats.totalRevenue || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {dashboardStats && (
              <div className="bg-white border-2 border-pink-500/20 border-l-8 border-l-pink-500 p-6 flex flex-col justify-between gap-4 shadow-sm rounded-none hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pink-50 text-pink-500 flex items-center justify-center rounded-none border border-pink-500/20">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Bills Generated</p>
                    <p className="text-xl font-black text-gray-900 uppercase mt-1 tracking-tight">{dashboardStats.totalBillsCount}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PharmacyDashboard;
