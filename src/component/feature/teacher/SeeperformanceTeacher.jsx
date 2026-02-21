import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, TrendingUp, CheckCircle2, UserCheck, Users, Star } from 'lucide-react';
import DataService from '../../../services/axios';

const SeePerformanceTeacher = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      const teacherId = localStorage.getItem('userId');
      const sessionId = localStorage.getItem('sessionId');
      try {
        const res = await DataService.get(`/Performance/GetTeacherPerformanceAnalytics/${teacherId}/${sessionId}`);
        setData(res.data);
      } catch (err) {
        setError("Evaluation data load nahi ho saka.");
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <Loader2 className="animate-spin text-green-600 mb-4" size={50} />
      <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Processing Analytics...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6 bg-slate-50 min-h-screen space-y-10 pb-20">
      
      {/* 1. Header Section */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-800 italic uppercase leading-none">Performance Overview</h2>
          <p className="text-slate-400 font-bold text-[10px] mt-2 tracking-[0.2em] uppercase">Session: {data?.SessionName}</p>
        </div>
        <div className="bg-green-600 text-white px-8 py-4 rounded-3xl shadow-lg shadow-green-200 text-center">
          <p className="text-[10px] font-bold uppercase opacity-80">Total Score</p>
          <p className="text-4xl font-black italic">{data?.OverallPercentage}%</p>
        </div>
      </div>

      {/* 2. Main KPI Categories (Looping through Academic, Society etc.) */}
      {data?.Breakdown.map((kpi, idx) => {
        // Calculation for Main KPI percentage out of 100
        const kpiPercentage = Math.round((kpi.KPIAchieved / kpi.KPIWeight) * 100);

        return (
          <div key={idx} className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <TrendingUp size={120} />
            </div>

            {/* Main KPI Title & Progress Line */}
            <div className="relative z-10 mb-10">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-4xl font-black text-slate-800 uppercase italic tracking-tighter">{kpi.KPIName}</h3>
                  <p className="text-green-600 font-bold text-sm italic">Achieved {kpi.KPIAchieved} out of {kpi.KPIWeight}</p>
                </div>
                <div className="text-right">
                  <span className="text-5xl font-black text-slate-800">{kpiPercentage}</span>
                  <span className="text-xl font-bold text-slate-300">%</span>
                </div>
              </div>

              {/* Green Progress Line (Out of 100) */}
              <div className="w-full bg-slate-100 h-6 rounded-full overflow-hidden p-1 border border-slate-50 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-1000 flex items-center justify-end px-2 shadow-lg"
                  style={{ width: `${kpiPercentage}%` }}
                >
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>
            </div>

            {/* Sub-KPI Attractive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {kpi.SubDetails.map((sub, sIdx) => {
                const subPercent = Math.round((sub.SubAchieved / sub.SubMax) * 100);
                
                return (
                  <div key={sIdx} className="group bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 p-6 rounded-[2rem] border border-transparent hover:border-green-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                        {sub.SubName.toLowerCase().includes('student') ? <Users size={20} /> : 
                         sub.SubName.toLowerCase().includes('peer') ? <UserCheck size={20} /> : <Star size={20} />}
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase italic">{sub.SubAchieved} / {sub.SubMax}</span>
                    </div>

                    <h4 className="font-black text-slate-700 text-xs uppercase mb-1 tracking-tight">{sub.SubName}</h4>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-black text-slate-800">{subPercent}</span>
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>

                    {/* Sub-KPI Mini Line */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-700 delay-300"
                        style={{ width: `${subPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Quick Summary Footer */}
      <div className="bg-slate-800 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="text-green-400" />
          </div>
          <p className="text-sm font-medium opacity-80 max-w-xs">Your performance is calculated based on session weights and actual evaluations.</p>
        </div>
        <button className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
          Download PDF Report
        </button>
      </div>

    </div>
  );
};

export default SeePerformanceTeacher;