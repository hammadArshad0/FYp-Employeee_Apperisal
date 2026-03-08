import React, { useState, useEffect } from 'react';
import { Loader2, BarChart3, ShieldCheck, Award, Target, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import DataService from '../../../services/axios';
import db from "../../../db";

const SeePerformanceTeacher = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dexieConfAvg, setDexieConfAvg] = useState(0);
  const [finalOverall, setFinalOverall] = useState(0);
  const [hasDexieData, setHasDexieData] = useState(false);

  useEffect(() => {
    const teacherId = localStorage.getItem('userId');
    const sessionId = localStorage.getItem('sessionId');

    const fetchAllData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Backend Analytics
        const res = await DataService.get(`/Performance/GetTeacherPerformanceAnalytics/${teacherId}/${sessionId}`);
        const backendData = res.data;

        // 2. Fetch Dexie (Local Director Ratings)
        const dexieRecords = await db.evaluations
          .where('teacherId').equals(String(teacherId))
          .and(item => String(item.sessionId) === String(sessionId))
          .toArray();
        
        let currentDexieAvg = 0;
        if (dexieRecords.length > 0) {
          currentDexieAvg = dexieRecords.reduce((s, r) => s + r.score, 0) / dexieRecords.length;
          setDexieConfAvg(currentDexieAvg);
          setHasDexieData(true);
        }

        // 3. Overall Score Calculation Logic (Same as Director side)
        let totalEarned = 0;
        let totalMax = 0;

        backendData.Breakdown.forEach(kpi => {
          totalMax += kpi.KPIWeight;
          let kpiPoints = 0;

          kpi.SubDetails.forEach(sub => {
            const isConf = sub.SubName.toLowerCase().includes('confidential');
            if (isConf && dexieRecords.length > 0) {
              kpiPoints += (currentDexieAvg / 4.0) * sub.SubMax;
            } else {
              kpiPoints += sub.SubAchieved;
            }
          });
          kpi.KPIAchieved = kpiPoints;
          totalEarned += kpiPoints;
        });

        setFinalOverall(totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0);
        setData(backendData);

      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const getGraphData = () => {
    if (!data) return [];
    return data.Breakdown.flatMap(kpi => 
      kpi.SubDetails.map(sub => ({
        name: sub.SubName,
        performance: (sub.SubName.toLowerCase().includes('confidential') && hasDexieData) 
          ? Math.round((dexieConfAvg / 4.0) * 100)
          : Math.round((sub.SubAchieved / sub.SubMax) * 100) || 0,
        isConf: sub.SubName.toLowerCase().includes('confidential') && hasDexieData
      }))
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#f8fafc]">
      <Loader2 className="animate-spin text-green-800 mb-4" size={50} />
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Generating Performance Profile...</p>
    </div>
  );

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER / OVERALL SCOREBOARD */}
        <div className="bg-green-900 p-8 md:p-12 rounded-[3.5rem] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
               <TrendingUp size={20} className="text-green-400" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-300">Academic Analytics</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Your Performance</h2>
            <p className="text-green-300 font-bold text-sm uppercase tracking-[0.2em] mt-3">Session: {data?.SessionName}</p>
            {hasDexieData && (
              <div className="mt-6 flex items-center justify-center md:justify-start gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10 w-fit backdrop-blur-md">
                <ShieldCheck size={16} className="text-green-400" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Verified by Director's Local Ratings</span>
              </div>
            )}
          </div>
          <div className="relative z-10 bg-white/5 p-10 rounded-[3rem] text-center min-w-[260px] border border-white/10 mt-8 md:mt-0 backdrop-blur-sm">
            <p className="text-[11px] font-bold uppercase opacity-50 tracking-[0.3em] mb-2">Aggregate Score</p>
            <p className="text-8xl font-black leading-none tracking-tighter">{finalOverall}%</p>
          </div>
        </div>

        {/* PERFORMANCE GRAPH SECTION (Same to Same as Director) */}
        <div className="bg-white p-6 md:p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl italic">
                <BarChart3 size={28}/>
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Metric Breakdown</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Detailed KPI Analysis</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[9px] font-black uppercase">80%+ Excellent</div>
              <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black uppercase">60%+ Good</div>
              <div className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-[9px] font-black uppercase">&lt;40% Critical</div>
            </div>
          </div>

          <div className="h-[450px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getGraphData()} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{fontSize: 10, fontWeight: '900', fill: '#64748b'}} 
                  axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                  tickLine={false}
                  dy={15}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis domain={[0, 100]} tick={{fontSize: 12, fontWeight: '900', fill: '#94a3b8'}} axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }} unit="%" />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const val = payload[0].value;
                      let colorClass = val >= 80 ? "text-green-600" : val >= 60 ? "text-amber-600" : val >= 40 ? "text-orange-600" : "text-red-600";
                      return (
                        <div className="bg-white p-5 shadow-2xl rounded-[2rem] border border-slate-50 min-w-[150px]">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{payload[0].payload.name}</p>
                          <p className={`text-3xl font-black ${colorClass}`}>{val}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="performance" radius={[12, 12, 4, 4]} barSize={50}>
                  {getGraphData().map((entry, index) => {
                    let barColor = "#ef4444";
                    if (entry.performance >= 80) barColor = "#22c55e";
                    else if (entry.performance >= 60) barColor = "#f59e0b";
                    else if (entry.performance >= 40) barColor = "#f97316";
                    
                    if (entry.isConf) barColor = entry.performance >= 60 ? "#064e3b" : "#450a0a";

                    return <Cell key={`cell-${index}`} fill={barColor} className="hover:opacity-80 transition-all duration-300" />;
                  })}
                  <LabelList dataKey="performance" position="top" formatter={(v) => `${v}%`} style={{ fontWeight: '900', fontSize: '13px', fill: '#334155' }} dy={-10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.Breakdown.map((kpi, idx) => {
            const perc = Math.round((kpi.KPIAchieved / kpi.KPIWeight) * 100) || 0;
            return (
              <div key={idx} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-8">
                  <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-800 group-hover:bg-green-800 group-hover:text-white transition-colors duration-500">
                    {kpi.KPIName.toLowerCase().includes('student') ? <Users size={28}/> : <Award size={28}/>}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Weight</p>
                    <p className="text-2xl font-black text-slate-800">{kpi.KPIWeight}</p>
                  </div>
                </div>
                <h4 className="text-xl font-black text-slate-700 uppercase italic tracking-tighter mb-1">{kpi.KPIName}</h4>
                <p className={`text-5xl font-black italic mb-6 ${perc >= 80 ? 'text-green-700' : perc >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{perc}%</p>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                  <div className={`h-full transition-all duration-1000 ${perc >= 80 ? 'bg-green-700' : 'bg-amber-500'}`} style={{ width: `${perc}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default SeePerformanceTeacher;