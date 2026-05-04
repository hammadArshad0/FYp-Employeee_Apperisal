import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import {
  TrendingUp, Users, Star, ShieldCheck, Award,
  Loader2, BookOpen, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataService from '../../../services/axios';
import db from '../../../db';

const MyPerformanceCombined = () => {
  const teacherId = localStorage.getItem('userId');
  const loginSessionId = localStorage.getItem('sessionId');
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(loginSessionId || '');
  const [backendData, setBackendData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confPct, setConfPct] = useState(null);

  useEffect(() => {
    DataService.get('/Session/list').then(res => {
      const list = res.data || [];
      setSessions(list);
      if (!selectedSession && list.length > 0)
        setSelectedSession(String(list[0].id || list[0].Id));
    });
  }, []);

  useEffect(() => {
    if (!selectedSession || !teacherId) return;
    fetchAll();
  }, [selectedSession, teacherId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await DataService.get(
        `/TeacherSelf/GetMyPerformance/${teacherId}/${selectedSession}`
      );
      setBackendData(res.data);

      const dexieRecords = await db.evaluations
        .where('teacherId').equals(String(teacherId))
        .and(item => String(item.sessionId) === String(selectedSession))
        .toArray();

      if (dexieRecords.length > 0) {
        const avg = dexieRecords.reduce((s, r) => s + r.score, 0) / dexieRecords.length;
        setConfPct(Math.min(100, Math.round((avg / 4) * 100)));
      } else {
        setConfPct(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getColor = v =>
    v >= 80 ? '#16a34a' : v >= 60 ? '#f97316' : v < 40 ? '#dc2626' : '#3b82f6';

  const studentPct = backendData ? Math.min(100, Math.round((backendData.StudentAverage / 10) * 100)) : 0;
  const peerPct    = backendData ? Math.min(100, Math.round((backendData.PeerAverage    / 10) * 100)) : 0;
  const chrPct     = backendData ? Math.min(100, Math.round((backendData.ChrAverage     / 10) * 100)) : 0;

  const scores = [studentPct, peerPct, chrPct];
  if (confPct !== null) scores.push(confPct);
  const overall = scores.length
    ? Math.min(100, Math.round(scores.reduce((a, b) => a + b, 0) / scores.length))
    : 0;

  const overallBg =
    overall >= 80 ? 'bg-green-600' :
    overall >= 60 ? 'bg-orange-500' :
    overall < 40  ? 'bg-red-600'   : 'bg-blue-600';

  const overallLabel =
    overall >= 80 ? ' Excellent performance' :
    overall >= 60 ? ' Good performance'      :
    overall < 40  ? ' Needs improvement'     : ' Average performance';

  const chartData = [
    { name: 'Student Eval', score: studentPct,    isConf: false },
    { name: 'Peer Review',  score: peerPct,       isConf: false },
    { name: 'Confidential', score: confPct ?? 0,  isConf: true  },
    { name: 'CHR Report',   score: chrPct,        isConf: false },
  ];

  const radarData = [
    { subject: 'Student', value: studentPct,   fullMark: 100 },
    { subject: 'Peer',    value: peerPct,       fullMark: 100 },
    { subject: 'Conf',    value: confPct ?? 0,  fullMark: 100 },
    { subject: 'CHR',     value: chrPct,        fullMark: 100 },
  ];

  const metricCards = [
    { label: 'Student Evaluation', icon: <Users size={20}/>,      value: studentPct, source: '' },
    { label: 'Peer Review',        icon: <Star size={20}/>,       value: peerPct,    source: '' },
    { label: 'Confidential Eval',  icon: <ShieldCheck size={20}/>,value: confPct,    source: confPct !== null ? '' : 'No local data' },
    { label: 'CHR Report',         icon: <Award size={20}/>,      value: chrPct,     source: '' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={30}/>
            My Performance
          </h1>
          {backendData && (
            <p className="text-gray-500 font-medium text-sm mt-1">
              {backendData.Name} — {backendData.Department}
            </p>
          )}
        </div>

        <select
          value={selectedSession}
          onChange={e => setSelectedSession(e.target.value)}
          className="bg-white border border-gray-200 p-3 rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        >
          {sessions.map(s => (
            <option key={s.id || s.Id} value={s.id || s.Id}>
              {s.name || s.Name}
              {String(s.id || s.Id) === String(loginSessionId) ? ' (Current)' : ''}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={48}/>
          <p className="text-gray-400 font-bold tracking-widest text-sm">LOADING YOUR STATS...</p>
        </div>
      ) : backendData ? (
        <>
          <div className={`p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl ${overallBg}`}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 bg-white -mr-20 -mt-20"/>
            <p className="text-white/70 font-black uppercase text-xs tracking-widest mb-2">Overall Score</p>
            <p className="text-7xl font-black">{overall}%</p>
            <p className="text-white/80 font-bold mt-2 text-sm">{overallLabel}</p>
            {confPct !== null ? (
              <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                {/* <ShieldCheck size={11}/> Includes confidential evaluation from local data */}
              </p>
            ) : (
              <p className="text-white/50 text-xs mt-1">Confidential data not available locally</p>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {(backendData.Courses || []).map((c, i) => (
                <span key={i} className="bg-white/20 px-3 py-1 rounded-full text-xs font-black">{c}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metricCards.map((m, i) => {
              const val = m.value;
              const col = val !== null ? getColor(val) : '#94a3b8';
              return (
                <div key={i} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-gray-100 rounded-xl text-gray-500">{m.icon}</div>
                    <span className="text-xl font-black" style={{ color: col }}>
                      {val !== null ? `${val}%` : '—'}
                    </span>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{m.label}</p>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    {val !== null && (
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${val}%`, backgroundColor: col }}/>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5">{m.source}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-800 mb-1 uppercase tracking-tight">Score Breakdown</h3>
            <p className="text-xs text-gray-400 mb-4">
              {/* Student · Peer · Confidential (Dexie) · CHR — all four sources */}
            </p>
            <div className="flex flex-wrap gap-3 text-[11px] text-gray-500 mb-5">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block bg-[#16a34a]"/>Academic sources
              </span>
              <span className="flex items-center gap-1.5">
                {/* <span className="w-3 h-3 rounded-sm inline-block bg-[#2563eb]"/>Confidential (Dexie) */}
              </span>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: '900' }} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit="%"/>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="bg-white p-4 shadow-xl rounded-2xl border border-gray-100">
                          <p className="text-2xl font-black text-gray-800">{payload[0].value}%</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{payload[0].payload.name}</p>
                          {payload[0].payload.isConf && (
                            <p className="text-[10px] text-blue-500 flex items-center gap-1 mt-1">
                              <ShieldCheck size={10}/> Dexie local data
                            </p>
                          )}
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={52}>
                    <LabelList
                      dataKey="score"
                      position="top"
                      formatter={v => `${v}%`}
                      style={{ fontSize: 11, fontWeight: '700', fill: '#475569' }}
                    />
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.isConf ? '#2563eb' : getColor(entry.score)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-800 mb-6 uppercase tracking-tight">Performance Radar</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f1f5f9"/>
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: '900', fill: '#64748b' }}/>
                  <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div> */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate(`/teacher-dashboard/acdemic-performance/course-comparison?session=${selectedSession}`)}
              className="bg-white border-2 border-blue-600 text-blue-600 p-5 rounded-[2rem] font-black flex items-center justify-between hover:bg-blue-600 hover:text-white transition-all group shadow-sm"
            >
              <div>
                <p className="text-xs uppercase tracking-widest opacity-70 mb-1">Compare My Courses</p>
                <p className="text-lg">Course Comparison →</p>
              </div>
              <BookOpen size={28} className="opacity-60 group-hover:opacity-100"/>
            </button>

            <button
              onClick={() => navigate(`/teacher-dashboard/acdemic-performance/question-ratings?session=${selectedSession}`)}
              className="bg-slate-900 text-white p-5 rounded-[2rem] font-black flex items-center justify-between hover:bg-blue-600 transition-all group shadow-sm"
            >
              <div>
                <p className="text-xs uppercase tracking-widest opacity-70 mb-1">Question-wise Detail</p>
                <p className="text-lg">See Ratings →</p>
              </div>
              <ChevronRight size={28} className="opacity-60 group-hover:opacity-100"/>
            </button>
          </div>
        </>
      ) : (
        <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-200 text-gray-400">
          <p className="font-bold uppercase tracking-widest">No performance data found</p>
        </div>
      )}
    </div>
  );
};

export default MyPerformanceCombined;