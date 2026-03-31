import React, { useState, useEffect } from 'react';
import { Loader2, BarChart3, ShieldCheck, Award, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import DataService from '../../../services/axios';
import db from "../../../db";

const SeePerformance = () => {
  const [sessions, setSessions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [finalOverall, setFinalOverall] = useState(0);
  const [dexieConfAvg, setDexieConfAvg] = useState(0);
  const [hasDexieData, setHasDexieData] = useState(false);

  useEffect(() => {
    DataService.get('/Session/list').then(res => setSessions(res.data || []));
  }, []);

  useEffect(() => {
    if (selectedSession) {
      setTeachers([]);
      setSelectedTeacher('');
      DataService.get(`/Director/GetTeachersBySession/${selectedSession}`)
        .then(res => setTeachers(res.data || []));
    }
  }, [selectedSession]);

  const isConfidential = (name) => (name || '').toLowerCase().includes('confidential');

  const fetchPerformance = async () => {
    if (!selectedTeacher || !selectedSession) return;
    setLoading(true);
    setData(null);
    setHasDexieData(false);
    setDexieConfAvg(0);

    try {
      const res = await DataService.get(`/Director/GetSpecificTeacherPerformance/${selectedTeacher}/${selectedSession}`);
      const backendData = res.data;

      const dexieRecords = await db.evaluations
        .where('teacherId').equals(String(selectedTeacher))
        .and(item => String(item.sessionId) === String(selectedSession))
        .toArray();
      
      let currentDexieAvg = 0;
      if (dexieRecords.length > 0) {
        currentDexieAvg = dexieRecords.reduce((s, r) => s + r.score, 0) / dexieRecords.length;
        setDexieConfAvg(currentDexieAvg);
        setHasDexieData(true);
      }

      let totalEarned = 0;
      let totalMax = 0;

      backendData.Breakdown.forEach(kpi => {
        totalMax += kpi.KPIWeight;
        let kpiPoints = 0;

        kpi.SubDetails.forEach(sub => {
          if (isConfidential(sub.SubName) && dexieRecords.length > 0) {
            kpiPoints += (currentDexieAvg / 4.0) * sub.SubMax;
          } else {
            // ✅ FIX: SubAchieved ko SubMax se zyada mat hone do
            kpiPoints += Math.min(sub.SubAchieved, sub.SubMax);
          }
        });

        // ✅ FIX: KPI points bhi KPIWeight se zyada nahi hone chahiye
        kpi.KPIAchieved = Math.min(kpiPoints, kpi.KPIWeight);
        totalEarned += kpi.KPIAchieved;
      });

      setFinalOverall(totalMax > 0 ? Math.min(100, Math.round((totalEarned / totalMax) * 100)) : 0);
      setData(backendData);

    } catch (err) {
      console.error(err);
      alert("kpi not found.");
    } finally { setLoading(false); }
  };

  // ✅ FIX: performance kabhi 100 se zyada nahi jayegi
  const getGraphData = () => {
    if (!data) return [];
    return data.Breakdown.flatMap(kpi => 
      kpi.SubDetails.map(sub => {
        let performance;
        if (isConfidential(sub.SubName) && hasDexieData) {
          performance = Math.round((dexieConfAvg / 4.0) * 100);
        } else {
          performance = Math.round((Math.min(sub.SubAchieved, sub.SubMax) / sub.SubMax) * 100) || 0;
        }
        // ✅ Hard clamp — bilkul safe
        performance = Math.min(100, Math.max(0, performance));

        return {
          name: sub.SubName,
          performance,
          isConf: isConfidential(sub.SubName) && hasDexieData
        };
      })
    );
  };

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* SELECTION PANEL */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-green-800 ml-1 tracking-wider">Session</label>
            <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-bold outline-none focus:border-green-600 transition-all cursor-pointer">
              <option value="">Select Session...</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name || s.Name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-green-800 ml-1 tracking-wider">Teacher</label>
            <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} disabled={!selectedSession} className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-bold outline-none focus:border-green-600 disabled:opacity-50 transition-all cursor-pointer">
              <option value="">{selectedSession ? "Select Teacher..." : "Select session first"}</option>
              {teachers.map(t => <option key={t.UserID} value={t.UserID}>{t.Name}</option>)}
            </select>
          </div>
          <button onClick={fetchPerformance} disabled={loading || !selectedTeacher} className="bg-green-800 hover:bg-green-900 text-white h-[60px] rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-green-100 transition-all active:scale-95 disabled:grayscale">
            {loading ? <Loader2 className="animate-spin" /> : "Generate Analysis"}
          </button>
        </div>

        {data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* MAIN SCOREBOARD */}
            <div className="bg-green-900 p-8 md:p-12 rounded-[3.5rem] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
              <div className="relative z-10 text-center md:text-left">
                <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">{data.TeacherName}</h2>
                <p className="text-green-300 font-bold text-sm uppercase tracking-[0.2em] mt-3">{data.Department} • {data.SessionName}</p>
                {hasDexieData && (
                  <div className="mt-6 flex items-center justify-center md:justify-start gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10 w-fit backdrop-blur-md">
                    <ShieldCheck size={16} className="text-green-400" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Director's Local Data Integrated</span>
                  </div>
                )}
              </div>
              <div className="relative z-10 bg-white/5 p-10 rounded-[3rem] text-center min-w-[260px] border border-white/10 mt-8 md:mt-0 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase opacity-50 tracking-[0.3em] mb-2">Aggregate Score</p>
                <p className="text-8xl font-black leading-none tracking-tighter">{finalOverall}%</p>
              </div>
            </div>

            {/* DYNAMIC PERFORMANCE ANALYSIS GRAPH */}
            <div className="bg-white p-6 md:p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl italic">
                    <BarChart3 size={28}/>
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Metric Analytics</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Live Performance Color Indicators</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[9px] font-black uppercase">80%+ Excellent</div>
                  <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black uppercase">60%+ Good</div>
                  <div className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-[9px] font-black uppercase">40%+ Average</div>
                  <div className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-[9px] font-black uppercase">&lt;40% Critical</div>
                </div>
              </div>

              <div className="h-[450px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getGraphData()} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f1f5f9" strokeOpacity={1} />
                    <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: '900', fill: '#64748b'}} axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }} tickLine={false} dy={15} />
                    <YAxis domain={[0, 100]} tick={{fontSize: 12, fontWeight: '900', fill: '#94a3b8'}} axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }} unit="%" />
                    <Tooltip
                      cursor={{fill: '#f8fafc'}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const val = payload[0].value;
                          let status = "Critical";
                          let colorClass = "text-red-600";
                          if (val >= 80) { status = "Excellent"; colorClass = "text-green-600"; }
                          else if (val >= 60) { status = "Good"; colorClass = "text-amber-600"; }
                          else if (val >= 40) { status = "Average"; colorClass = "text-orange-600"; }
                          return (
                            <div className="bg-white p-5 shadow-2xl rounded-[2rem] border border-slate-50 min-w-[150px]">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{payload[0].payload.name}</p>
                              <p className={`text-3xl font-black ${colorClass}`}>{val}%</p>
                              <p className={`text-[10px] font-bold uppercase mt-1 ${colorClass}`}>{status}</p>
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
                        if (entry.isConf) {
                          barColor = entry.performance >= 60 ? "#064e3b" : "#450a0a";
                        }
                        return (
                          <Cell key={`cell-${index}`} fill={barColor} className="hover:opacity-80 transition-all duration-300" />
                        );
                      })}
                      <LabelList dataKey="performance" position="top" formatter={(v) => `${v}%`} style={{ fontWeight: '900', fontSize: '13px', fill: '#334155' }} dy={-10} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.Breakdown.map((kpi, idx) => {
                const perc = Math.min(100, Math.round((kpi.KPIAchieved / kpi.KPIWeight) * 100) || 0);
                return (
                  <div key={idx} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-8">
                      <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-800 group-hover:bg-green-800 group-hover:text-white transition-colors duration-500">
                        <Award size={28}/>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Weights</p>
                        <p className="text-2xl font-black text-slate-800">{kpi.KPIWeight}%</p>
                      </div>
                    </div>
                    <h4 className="text-xl font-black text-slate-700 uppercase italic tracking-tighter mb-1">{kpi.KPIName}</h4>
                    <p className="text-5xl font-black text-green-700 italic mb-6">{perc}%</p>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-green-700 transition-all duration-1000" style={{ width: `${perc}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ✅ NEW: SUB KPI BREAKDOWN CARDS */}
            <div className="space-y-4">
              <h3 className="text-xl font-black text-slate-700 uppercase italic tracking-tighter px-2">
                Sub KPI Breakdown
              </h3>
              {data.Breakdown.flatMap((kpi) =>
                kpi.SubDetails.map((sub, idx) => {
                  const achieved = (isConfidential(sub.SubName) && hasDexieData)
                    ? Math.round((dexieConfAvg / 4.0) * sub.SubMax)
                    : Math.min(sub.SubAchieved, sub.SubMax);

                  const finalPerc = Math.min(100, Math.round((achieved / sub.SubMax) * 100) || 0);

                  let finalBarColor = "bg-red-500";
                  let finalTextColor = "text-red-600";
                  if (finalPerc >= 80) { finalBarColor = "bg-green-600"; finalTextColor = "text-green-700"; }
                  else if (finalPerc >= 60) { finalBarColor = "bg-amber-500"; finalTextColor = "text-amber-600"; }
                  else if (finalPerc >= 40) { finalBarColor = "bg-orange-500"; finalTextColor = "text-orange-600"; }

                  return (
                    <div key={`${kpi.KPIName}-${idx}`} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex items-center gap-6">
                      {/* Left: Names + Progress Bar */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          {kpi.KPIName}
                        </p>
                        <h4 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter truncate">
                          {sub.SubName}
                          {isConfidential(sub.SubName) && hasDexieData && (
                            <span className="ml-2 text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black normal-case not-italic">
                              Local Data
                            </span>
                          )}
                        </h4>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner mt-3">
                          <div
                            className={`h-full ${finalBarColor} transition-all duration-1000`}
                            style={{ width: `${finalPerc}%` }}
                          />
                        </div>
                      </div>

                      {/* Right: Score */}
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                        <p className={`text-3xl font-black ${finalTextColor}`}>
                          {achieved}
                          <span className="text-base text-slate-400 font-bold"> / {sub.SubMax}</span>
                        </p>
                        <p className={`text-[11px] font-black uppercase ${finalTextColor}`}>{finalPerc}%</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default SeePerformance;