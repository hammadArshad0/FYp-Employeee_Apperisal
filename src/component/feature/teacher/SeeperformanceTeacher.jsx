// SeePerformanceTeacher.jsx
import React, { useState, useEffect } from 'react';
import { Loader2, BarChart3, Award, Target, TrendingUp, Users, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import DataService from '../../../services/axios';
import db from "../../../db";

const SeePerformanceTeacher = () => {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [sessions, setSessions]       = useState([]);
  const [kpiTypes, setKpiTypes]       = useState([]);
  const [selectedKpiType, setSelectedKpiType] = useState('');
  const [dexieConfAvg, setDexieConfAvg]       = useState(0);
  const [finalOverall, setFinalOverall]       = useState(0);
  const [hasDexieData, setHasDexieData]       = useState(false);

  const teacherId    = localStorage.getItem('userId');
  const loginSessId  = localStorage.getItem('sessionId');
  const [selectedSession, setSelectedSession] = useState(loginSessId || '');

  // ── 1. Sessions load ──
  useEffect(() => {
    DataService.get('/Session/list').then(res => {
      const list = res.data || [];
      setSessions(list);
      if (!selectedSession && list.length > 0) {
        setSelectedSession(String(list[0].id || list[0].Id));
      }
    }).catch(err => console.error(err));
  }, []);

  // ── 2. KPI Types load when session changes ──
  useEffect(() => {
    if (!selectedSession) return;
    setSelectedKpiType('');
    DataService.get(`/Performance/GetKpiTypesBySession/${selectedSession}`)
      .then(res => setKpiTypes(res.data || []))
      .catch(err => console.error(err));
  }, [selectedSession]);

  // ── 3. Performance load when session OR kpiType changes ──
  useEffect(() => {
    if (!selectedSession || !teacherId) return;
    fetchPerformance();
  }, [selectedSession, selectedKpiType]);

  const fetchPerformance = async () => {
    setLoading(true);
    setData(null);
    try {
      // ✅ Fixed: comma was missing before { params }
      const res = await DataService.get(
        `/Performance/GetTeacherPerformanceAnalytics/${teacherId}/${selectedSession}`,
        { params: { kpiId: selectedKpiType || null } }
      );
      const backendData = res.data;

      // Dexie (confidential local) data
      const dexieRecords = await db.evaluations
        .where('teacherId').equals(String(teacherId))
        .and(item => String(item.sessionId) === String(selectedSession))
        .toArray();

      let currentDexieAvg = 0;
      if (dexieRecords.length > 0) {
        currentDexieAvg = dexieRecords.reduce((s, r) => s + r.score, 0) / dexieRecords.length;
        setDexieConfAvg(currentDexieAvg);
        setHasDexieData(true);
      } else {
        setDexieConfAvg(0);
        setHasDexieData(false);
      }

      // Calculate totals
      let totalEarned = 0;
      let totalMax    = 0;

      backendData.Breakdown.forEach(kpi => {
        totalMax += kpi.KPIWeight;
        let kpiPoints = 0;

        kpi.SubDetails.forEach(sub => {
          const isConf = sub.SubName.toLowerCase().includes('confidential');
          if (isConf && dexieRecords.length > 0) {
            sub.AchievedSync = Number(((currentDexieAvg / (sub.MaxScale || 4)) * sub.SubMax).toFixed(2));
          } else {
            sub.AchievedSync = Math.min(sub.SubAchieved, sub.SubMax);
          }
          kpiPoints += sub.AchievedSync;
        });

        kpi.KPIAchieved = Math.min(kpiPoints, kpi.KPIWeight);
        totalEarned += kpi.KPIAchieved;
      });

      setFinalOverall(totalMax > 0 ? Math.min(100, Math.round((totalEarned / totalMax) * 100)) : 0);
      setData(backendData);

    } catch (err) {
      console.error("Error:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const getGraphData = () => {
    if (!data) return [];
    return data.Breakdown.flatMap(kpi =>
      kpi.SubDetails.map(sub => {
        const perf = Math.min(100, Math.round((sub.AchievedSync / sub.SubMax) * 100) || 0);
        return {
          name:   sub.SubName,
          performance: perf,
          isConf: sub.SubName.toLowerCase().includes('confidential') && hasDexieData,
        };
      })
    );
  };

  const getBarColor = (val, isConf = false) => {
    if (isConf) return val >= 60 ? '#064e3b' : '#450a0a';
    if (val >= 80) return '#22c55e';
    if (val >= 60) return '#f59e0b';
    if (val >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── SESSION + KPI TYPE SELECTOR ── */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">

            {/* Icon + Title */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="p-3 bg-green-50 text-green-700 rounded-2xl">
                <Calendar size={24}/>
              </div>
              <div>
                <h3 className="font-black uppercase italic text-slate-800 leading-none">My Performance</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Select session & category
                </p>
              </div>
            </div>

            {/* Dropdowns */}
            <div className="flex flex-col md:flex-row gap-3 w-full">

              {/* Session */}
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                  Session
                </label>
                <select
                  value={selectedSession}
                  onChange={e => setSelectedSession(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-bold text-sm outline-none focus:border-green-600 transition-all cursor-pointer"
                >
                  <option value="">-- Select Session --</option>
                  {sessions.map(s => {
                    const id = s.id || s.Id;
                    return (
                      <option key={id} value={id}>
                        {s.name || s.Name}
                        {String(id) === String(loginSessId) ? ' (Current)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

            
              {/* <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                  KPI Category
                </label>
                <select
                  value={selectedKpiType}
                  onChange={e => setSelectedKpiType(e.target.value)}
                  disabled={!selectedSession || kpiTypes.length === 0}
                  className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl font-bold text-sm outline-none focus:border-green-600 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {kpiTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div> */}
            </div>
          </div>
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-green-800 mb-4" size={50}/>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">
              Analyzing Session Data...
            </p>
          </div>
        )}

        {/* ── DATA ── */}
        {!loading && data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* SCOREBOARD */}
            <div className="bg-green-900 p-6 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full"/>
              <div className="relative z-10 text-center md:text-left">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-300">
                  Academic Analytics
                </span>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none mt-2">
                  Your Performance
                </h2>
                <p className="text-green-300 font-bold text-sm uppercase tracking-[0.2em] mt-3">
                  {data.SessionName}
                </p>
              </div>
              <div className="relative z-10 bg-white/5 p-6 rounded-[2rem] text-center min-w-[220px] border border-white/10 mt-6 md:mt-0">
                <p className="text-[11px] font-bold uppercase opacity-50 tracking-[0.2em] mb-2">
                  Overall Score
                </p>
                <p className="text-7xl font-black leading-none tracking-tighter">{finalOverall}%</p>
              </div>
            </div>

            {/* GRAPH */}
            <div className="bg-white p-6 md:p-10 rounded-[3.5rem] shadow-2xl border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl">
                    <BarChart3 size={26}/>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">
                      Metric Analytics
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      Live Performance Color Indicators
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '80%+ Excellent', cls: 'bg-green-100 text-green-700' },
                    { label: '60%+ Good',      cls: 'bg-amber-100 text-amber-700' },
                    { label: '40%+ Average',   cls: 'bg-orange-100 text-orange-700' },
                    { label: '<40% Critical',  cls: 'bg-red-100 text-red-700' },
                  ].map((b, i) => (
                    <div key={i} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${b.cls}`}>
                      {b.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getGraphData()} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      dy={15}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fontWeight: 900, fill: '#94a3b8' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      unit="%"
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const val = payload[0].value;
                        const status =
                          val >= 80 ? 'Excellent' : val >= 60 ? 'Good' : val >= 40 ? 'Average' : 'Critical';
                        const color =
                          val >= 80 ? 'text-green-600' : val >= 60 ? 'text-amber-600' : val >= 40 ? 'text-orange-600' : 'text-red-600';
                        return (
                          <div className="bg-white p-5 shadow-2xl rounded-[2rem] border border-slate-50 min-w-[150px]">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">
                              {payload[0].payload.name}
                            </p>
                            <p className={`text-3xl font-black ${color}`}>{val}%</p>
                            <p className={`text-[10px] font-bold uppercase mt-1 ${color}`}>{status}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="performance" radius={[12,12,4,4]} barSize={50}>
                      {getGraphData().map((e, i) => (
                        <Cell key={i} fill={getBarColor(e.performance, e.isConf)}
                          className="hover:opacity-80 transition-all duration-300"/>
                      ))}
                      <LabelList dataKey="performance" position="top"
                        formatter={v => `${v}%`}
                        style={{ fontWeight: 900, fontSize: 13, fill: '#334155' }}
                        dy={-10}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.Breakdown.map((kpi, idx) => {
                const perc = Math.min(100, Math.round((kpi.KPIAchieved / kpi.KPIWeight) * 100) || 0);
                const color =
                  perc >= 80 ? { text: 'text-green-700', bar: 'bg-green-700' } :
                  perc >= 60 ? { text: 'text-amber-600', bar: 'bg-amber-600' } :
                  perc >= 40 ? { text: 'text-orange-600', bar: 'bg-orange-600' } :
                               { text: 'text-red-700',    bar: 'bg-red-700' };
                return (
                  <div key={idx} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-8">
                      <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-green-800 group-hover:text-white transition-colors duration-500">
                        {kpi.KPIName.toLowerCase().includes('student')
                          ? <Users size={28}/>
                          : <Award size={28}/>
                        }
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Max Weight
                        </p>
                        <p className="text-2xl font-black text-slate-800">{kpi.KPIWeight}%</p>
                      </div>
                    </div>
                    <h4 className="text-xl font-black text-slate-700 uppercase italic tracking-tighter mb-1">
                      {kpi.KPIName}
                    </h4>
                    <p className={`text-5xl font-black italic mb-6 ${color.text}`}>{perc}%</p>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full ${color.bar} transition-all duration-1000`} style={{ width: `${perc}%` }}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SUB KPI BREAKDOWN */}
            <div className="space-y-4 pb-10">
              <h3 className="text-xl font-black text-slate-700 uppercase italic tracking-tighter px-2">
                Sub KPI Breakdown
              </h3>
              {data.Breakdown.flatMap((kpi) =>
                kpi.SubDetails.map((sub, idx) => {
                  const finalPerc = Math.min(100, Math.round((sub.AchievedSync / sub.SubMax) * 100) || 0);
                  const color =
                    finalPerc >= 80 ? { text: 'text-green-700',  bar: 'bg-green-600'  } :
                    finalPerc >= 60 ? { text: 'text-amber-600',  bar: 'bg-amber-500'  } :
                    finalPerc >= 40 ? { text: 'text-orange-600', bar: 'bg-orange-500' } :
                                      { text: 'text-red-600',    bar: 'bg-red-500'    };
                  return (
                    <div key={`${kpi.KPIName}-${idx}`}
                      className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex items-center gap-6">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          {kpi.KPIName}
                        </p>
                        <h4 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter truncate">
                          {sub.SubName}
                        </h4>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner mt-3">
                          <div className={`h-full ${color.bar} transition-all duration-1000`}
                            style={{ width: `${finalPerc}%` }}/>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                        <p className={`text-3xl font-black ${color.text}`}>
                          {Number(sub.AchievedSync.toFixed(2))}
                          <span className="text-base text-slate-400 font-bold"> / {sub.SubMax}</span>
                        </p>
                        <p className={`text-[11px] font-black uppercase ${color.text}`}>{finalPerc}%</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── NO DATA ── */}
        {!loading && !data && (
          <div className="bg-white p-20 rounded-[3.5rem] text-center border border-slate-100 shadow-sm">
            <Target className="mx-auto text-slate-200 mb-6" size={80}/>
            <h3 className="text-2xl font-black text-slate-800 uppercase italic">No Performance Data</h3>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">
              Data hasn't been uploaded for this session yet.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default SeePerformanceTeacher;