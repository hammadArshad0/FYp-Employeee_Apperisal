// CourseEvaluationRating.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { Search, BarChart3, BookOpen, ChevronRight, TrendingUp, FileSearch } from 'lucide-react';
import DataService from '../../../services/axios';
import db from '../../../db';

const getTeacherID   = (t) => t.userID ?? t.UserId ?? t.userId ?? t.UserID ?? t.id ?? t.ID ?? '';
const getTeacherName = (t) => t.Name ?? t.name ?? t.TeacherName ?? t.teacherName ?? '';

const CourseEvaluationRating = () => {
  const navigate = useNavigate();

  const [sessions, setSessions]               = useState([]);
  const [teachers, setTeachers]               = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [evalType, setEvalType]               = useState('all');

  const [masterData, setMasterData]           = useState([]);
  const [comparisonData, setComparisonData]   = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [hasFetched, setHasFetched]           = useState(false);

  // ── Sessions load ──
  useEffect(() => {
    DataService.get('/TeacherSelf/GetSessions').then(res => {
      const d = res.data ?? [];
      setSessions(d);
      if (d.length > 0) setSelectedSession(String(d[0].id ?? d[0].ID ?? ''));
    });
  }, []);

  // ── Teachers load ──
  useEffect(() => {
    if (!selectedSession) return;
    DataService.get(`/Director/GetTeachersBySession/${selectedSession}`).then(res => {
      const d = res.data ?? [];
      setTeachers(d);
      setSelectedTeacher(d.length > 0 ? getTeacherID(d[0]) : '');
      setMasterData([]);
      setComparisonData([]);
      setHasFetched(false);
    });
  }, [selectedSession]);

  // ── Client-side filter on evalType change ──
  useEffect(() => {
    if (!hasFetched || masterData.length === 0) return;
    applyFilter(masterData, evalType);
  }, [evalType, masterData, hasFetched]);

  // ── Filter helper ──
  const applyFilter = (data, type) => {
    if (type === 'all') {
      setComparisonData(data);
      return;
    }

    const filtered = data
      .map(course => {
        const c = { ...course };
        if (type === 'student') {
          c.PeerAverage         = 0;
          c.ConfidentialAverage = 0;
          c.Overall             = c.StudentAverage != null ? Math.round((c.StudentAverage / 10) * 100) : 0;
        } else if (type === 'peer') {
          c.StudentAverage      = 0;
          c.ConfidentialAverage = 0;
          c.Overall             = c.PeerAverage != null ? Math.round((c.PeerAverage / 10) * 100) : 0;
        } else if (type === 'confidential') {
          c.StudentAverage = 0;
          c.PeerAverage    = 0;
          c.Overall        = c.ConfidentialAverage != null ? Math.round((c.ConfidentialAverage / 10) * 100) : 0;
        }
        return c;
      })
      .filter(c => {
        const orig = masterData.find(m => m.CourseCode === c.CourseCode);
        if (type === 'student')      return (orig?.StudentAverage      ?? 0) > 0;
        if (type === 'peer')         return (orig?.PeerAverage         ?? 0) > 0;
        if (type === 'confidential') return (orig?.ConfidentialAverage ?? 0) > 0;
        return true;
      });

    setComparisonData(filtered);
  };

  // ── Confidential: Dexie se fetch + 1-4 ko 10 scale par convert ──
  const fetchConfidentialGrouped = async () => {
    const local = await db.evaluations.toArray();
    const filtered = local.filter(
      e => String(e.teacherId) === String(selectedTeacher) &&
           String(e.sessionId) === String(selectedSession)
    );
    return filtered.reduce((acc, curr) => {
      const code = curr.courseCode || 'Unknown';
      if (!acc[code]) acc[code] = { CourseCode: code, CourseTitle: curr.courseTitle || '', totalScore: 0, count: 0 };
      acc[code].totalScore += Number(curr.score); // score 1-4
      acc[code].count      += 1;
      return acc;
    }, {});
  };

  // ✅ Helper: 1-4 average ko out of 10 convert karo
  const toOutOf10 = (totalScore, count) => {
    if (!count) return 0;
    const avgOf4 = totalScore / count;          // e.g. 3.2
    return parseFloat(((avgOf4 / 4) * 10).toFixed(2)); // → 8.0
  };

  // ── Main Fetch ──
  const handleFetchGraph = async () => {
    if (!selectedSession || !selectedTeacher) return;
    setLoading(true);
    try {
      const res = await DataService.get(
        `/TeacherSelf/GetCourseComparison/${selectedTeacher}/${selectedSession}?evaluationType=both`
      );
      const apiData = res.data ?? [];

      const confGrouped = await fetchConfidentialGrouped();

      // ✅ Merge: ConfidentialAverage out of 10
      const merged = apiData.map(c => ({
        ...c,
        ConfidentialAverage: confGrouped[c.CourseCode]
          ? toOutOf10(confGrouped[c.CourseCode].totalScore, confGrouped[c.CourseCode].count)
          : 0,
        Overall: c.Overall ?? Math.round(((c.StudentAverage ?? 0) / 10) * 100),
      }));

      // ✅ Confidential-only courses (API mein nahi hain)
      Object.keys(confGrouped).forEach(code => {
        if (!merged.find(m => m.CourseCode === code)) {
          const confAvg10 = toOutOf10(confGrouped[code].totalScore, confGrouped[code].count);
          merged.push({
            CourseCode:           code,
            CourseTitle:          confGrouped[code].CourseTitle,
            StudentAverage:       0,
            PeerAverage:          0,
            ConfidentialAverage:  confAvg10,
            Overall:              Math.round((confAvg10 / 10) * 100),
          });
        }
      });

      setMasterData(merged);
      setHasFetched(true);
      applyFilter(merged, evalType);

    } catch (err) {
      console.error(err);
      setMasterData([]);
      setComparisonData([]);
      setHasFetched(false);
    } finally {
      setLoading(false);
    }
  };

  // ── Visibility flags ──
  const showStudent      = ['all', 'student'].includes(evalType);
  const showPeer         = ['all', 'peer'].includes(evalType);
  const showConfidential = ['all', 'confidential'].includes(evalType);

  // ── Custom Tooltip ──
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 min-w-[180px]">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.fill }}/>
              <span className="text-xs font-bold text-gray-500">{p.name}</span>
            </div>
            <span className="text-sm font-black" style={{ color: p.fill }}>{p.value}/10</span>
          </div>
        ))}
      </div>
    );
  };

  // ── Bar colors ──
  const getStudentColor = (val) => {
    if (val >= 8) return '#15803d';
    if (val >= 6) return '#16a34a';
    if (val >= 4) return '#f97316';
    return '#ef4444';
  };
  const getPeerColor = (val) => {
    if (val >= 8) return '#7c3aed';
    if (val >= 6) return '#8b5cf6';
    if (val >= 4) return '#a78bfa';
    return '#c4b5fd';
  };
  const getConfidentialColor = (val) => {
    if (val >= 8) return '#0369a1';
    if (val >= 6) return '#0284c7';
    if (val >= 4) return '#f97316';
    return '#ef4444';
  };

  // ── Graph datasets ──
  const allGraphData = comparisonData.map(c => ({
    name:         c.CourseCode,
    Student:      c.StudentAverage      ?? 0,
    Peer:         c.PeerAverage         ?? 0,
    Confidential: c.ConfidentialAverage ?? 0,
    sColor: getStudentColor(c.StudentAverage ?? 0),
    pColor: getPeerColor(c.PeerAverage ?? 0),
    cColor: getConfidentialColor(c.ConfidentialAverage ?? 0),
  }));

  const studentGraphData = comparisonData.map(c => ({
    name: c.CourseCode, value: c.StudentAverage ?? 0,
    color: getStudentColor(c.StudentAverage ?? 0),
  }));
  const peerGraphData = comparisonData.map(c => ({
    name: c.CourseCode, value: c.PeerAverage ?? 0,
    color: getPeerColor(c.PeerAverage ?? 0),
  }));
  const confidentialGraphData = comparisonData.map(c => ({
    name: c.CourseCode, value: c.ConfidentialAverage ?? 0,
    color: getConfidentialColor(c.ConfidentialAverage ?? 0),
  }));

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">

      {/* ── HEADER ── */}
      <div className="bg-green-800 text-white p-7 rounded-3xl mb-6 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full"/>
        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full"/>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-green-300"/>
            <span className="text-green-300 text-xs font-black uppercase tracking-widest">Evaluation Portal</span>
          </div>
          <h1 className="text-2xl font-black">Course Evaluation Ratings</h1>
          <p className="text-green-300 text-sm mt-1">Select session, teacher and evaluation type</p>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-3 items-end">

          <div className="flex-1 min-w-[150px]">
            <label className="text-[10px] font-black text-gray-400 mb-1.5 block uppercase tracking-widest">Session</label>
            <select value={selectedSession} onChange={e => { setSelectedSession(e.target.value); setHasFetched(false); }}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold text-gray-700 border-2 border-gray-100 outline-none focus:border-green-500 transition-all">
              {sessions.map((s, i) => (
                <option key={i} value={s.id ?? s.ID ?? ''}>{s.name ?? s.Name ?? `Session ${i+1}`}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-black text-gray-400 mb-1.5 block uppercase tracking-widest">Teacher</label>
            <select value={selectedTeacher} onChange={e => { setSelectedTeacher(e.target.value); setMasterData([]); setComparisonData([]); setHasFetched(false); }}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold text-gray-700 border-2 border-gray-100 outline-none focus:border-green-500 transition-all">
              <option value="">-- Select Teacher --</option>
              {teachers.map((t, i) => (
                <option key={i} value={getTeacherID(t)}>{getTeacherName(t) || `Teacher ${i+1}`}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="text-[10px] font-black text-gray-400 mb-1.5 block uppercase tracking-widest">
              Eval Type
              {hasFetched && <span className="ml-2 text-green-600 normal-case tracking-normal font-bold">● Live Filter</span>}
            </label>
            <select value={evalType} onChange={e => setEvalType(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold text-gray-700 border-2 border-gray-100 outline-none focus:border-green-500 transition-all">
              <option value="all">All (Student + Peer + Confidential)</option>
              <option value="student">Student Only</option>
              <option value="peer">Peer Only</option>
              <option value="confidential">Confidential Only</option>
            </select>
          </div>

          <button onClick={handleFetchGraph} disabled={loading || !selectedTeacher}
            className="bg-green-700 hover:bg-green-800 active:scale-95 text-white px-7 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-green-100 disabled:opacity-50 disabled:shadow-none">
            {loading ? <span className="animate-pulse">Loading...</span> : <><Search size={16}/> View</>}
          </button>
        </div>

        {hasFetched && (
          <p className="text-[10px] text-green-700 font-bold mt-3 px-1">
            ✓ Data loaded — Eval Type dropdown ab bina View ke instantly filter karega.
          </p>
        )}
      </div>

      {/* ── CONTENT ── */}
      {comparisonData.length > 0 ? (
        <div className="space-y-6">

          {/* ── GRAPH CARD ── */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-8 pt-7 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-700 p-2.5 rounded-2xl">
                  <TrendingUp size={18} className="text-white"/>
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-800">Performance Comparison</h2>
                  <p className="text-xs text-gray-400">
                    {evalType === 'all'          && 'Student + Peer + Confidential per course'}
                    {evalType === 'student'      && 'Student ratings only'}
                    {evalType === 'peer'         && 'Peer ratings only'}
                    {evalType === 'confidential' && 'Confidential ratings only (1–4 → out of 10)'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                {showStudent      && <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-600"/><span className="text-xs font-black text-gray-500">Student</span></div>}
                {showPeer         && <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-purple-600"/><span className="text-xs font-black text-gray-500">Peer</span></div>}
                {showConfidential && <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-600"/><span className="text-xs font-black text-gray-500">Confidential</span></div>}
              </div>
            </div>

            {/* Score pills */}
            <div className="flex gap-3 px-8 pb-4 flex-wrap">
              {comparisonData.map((c, i) => {
                const master = masterData.find(m => m.CourseCode === c.CourseCode) || c;
                return (
                  <div key={i} className="bg-gray-50 rounded-2xl px-4 py-2 flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-black text-gray-700">{c.CourseCode}</span>
                    {showStudent      && <span className="text-xs font-black text-green-700 bg-green-100 px-2 py-0.5 rounded-full">S: {master.StudentAverage ?? 0}/10</span>}
                    {showPeer         && <span className="text-xs font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">P: {master.PeerAverage ?? 0}/10</span>}
                    {showConfidential && <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">C: {master.ConfidentialAverage ?? 0}/10</span>}
                  </div>
                );
              })}
            </div>

            <div className="px-6 pb-8">

              {/* ALL */}
              {evalType === 'all' && (
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={allGraphData} margin={{ top: 20, right: 20, left: -10, bottom: 10 }} barGap={4} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} dy={10}/>
                      <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} ticks={[0, 2, 4, 6, 8, 10]}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="Student" name="Student" radius={[6, 6, 2, 2]} barSize={26}>
                        {allGraphData.map((e, i) => <Cell key={i} fill={e.sColor}/>)}
                        <LabelList dataKey="Student" position="top" formatter={v => v > 0 ? `${v}` : ''} style={{ fontSize: 10, fontWeight: 900, fill: '#374151' }} dy={-4}/>
                      </Bar>
                      <Bar dataKey="Peer" name="Peer" radius={[6, 6, 2, 2]} barSize={26}>
                        {allGraphData.map((e, i) => <Cell key={i} fill={e.pColor}/>)}
                        <LabelList dataKey="Peer" position="top" formatter={v => v > 0 ? `${v}` : ''} style={{ fontSize: 10, fontWeight: 900, fill: '#374151' }} dy={-4}/>
                      </Bar>
                      <Bar dataKey="Confidential" name="Confidential" radius={[6, 6, 2, 2]} barSize={26}>
                        {allGraphData.map((e, i) => <Cell key={i} fill={e.cColor}/>)}
                        <LabelList dataKey="Confidential" position="top" formatter={v => v > 0 ? `${v}` : ''} style={{ fontSize: 10, fontWeight: 900, fill: '#374151' }} dy={-4}/>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-center text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">* All scores out of 10</p>
                </div>
              )}

              {/* STUDENT */}
              {evalType === 'student' && (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={studentGraphData} margin={{ top: 20, right: 20, left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} dy={10}/>
                      <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} ticks={[0, 2, 4, 6, 8, 10]}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="value" name="Student" radius={[10, 10, 2, 2]} barSize={48} maxBarSize={64}>
                        {studentGraphData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                        <LabelList dataKey="value" position="top" formatter={v => `${v}/10`} style={{ fontSize: 12, fontWeight: 900, fill: '#374151' }} dy={-8}/>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* PEER */}
              {evalType === 'peer' && (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peerGraphData} margin={{ top: 20, right: 20, left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} dy={10}/>
                      <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} ticks={[0, 2, 4, 6, 8, 10]}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="value" name="Peer" radius={[10, 10, 2, 2]} barSize={48} maxBarSize={64}>
                        {peerGraphData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                        <LabelList dataKey="value" position="top" formatter={v => `${v}/10`} style={{ fontSize: 12, fontWeight: 900, fill: '#374151' }} dy={-8}/>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* CONFIDENTIAL */}
              {evalType === 'confidential' && (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={confidentialGraphData} margin={{ top: 20, right: 20, left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} dy={10}/>
                      <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} ticks={[0, 2, 4, 6, 8, 10]}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="value" name="Confidential" radius={[10, 10, 2, 2]} barSize={48} maxBarSize={64}>
                        {confidentialGraphData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                        <LabelList dataKey="value" position="top" formatter={v => `${v}/10`} style={{ fontSize: 12, fontWeight: 900, fill: '#374151' }} dy={-8}/>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-center text-[10px] text-blue-400 font-bold mt-1 uppercase tracking-widest">
                    * Dexie DB (1–4 scale) → converted to out of 10
                  </p>
                </div>
              )}

              {/* Color legend */}
              <div className="flex items-center justify-center gap-6 mt-4 flex-wrap">
                {evalType === 'confidential' ? (
                  [
                    { label: '8-10 Excellent', color: 'bg-blue-800' },
                    { label: '6-8 Good',       color: 'bg-blue-500' },
                    { label: '4-6 Average',    color: 'bg-orange-400' },
                    { label: '0-4 Low',        color: 'bg-red-400' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}/>
                      <span className="text-[10px] font-black text-gray-400 uppercase">{item.label}</span>
                    </div>
                  ))
                ) : (
                  [
                    { label: '8-10 Excellent', color: 'bg-green-700' },
                    { label: '6-8 Good',       color: 'bg-green-500' },
                    { label: '4-6 Average',    color: 'bg-orange-400' },
                    { label: '0-4 Low',        color: 'bg-red-400' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}/>
                      <span className="text-[10px] font-black text-gray-400 uppercase">{item.label}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── COURSE CARDS ── */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
              Course Details — Click for question-wise ratings
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparisonData.map((course, i) => {
                const master = masterData.find(m => m.CourseCode === course.CourseCode) || course;
                return (
                  <div key={i}
                    onClick={() => navigate(
                      `/director-dashboard/course-evaluation/question-rating-detail/${selectedTeacher}/${selectedSession}/${course.CourseCode}/${evalType}`
                    )}
                    className="bg-white p-6 rounded-3xl border-2 border-gray-100 hover:border-green-400 hover:shadow-lg cursor-pointer group transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-gray-50 group-hover:bg-green-700 p-3 rounded-2xl transition-all">
                        <BookOpen size={20} className="text-gray-400 group-hover:text-white transition-all"/>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Overall</p>
                        <p className={`text-xl font-black ${(course.Overall ?? 0) >= 60 ? 'text-green-700' : 'text-red-500'}`}>
                          {course.Overall ?? 0}%
                        </p>
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-gray-800">{course.CourseCode}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 mb-4">Tap for question-wise detail</p>

                    <div className="space-y-2">
                      {showStudent && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-600"/>
                            <span className="text-xs font-bold text-gray-500">Student</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-600 rounded-full" style={{ width: `${((master.StudentAverage ?? 0) / 10) * 100}%` }}/>
                            </div>
                            <span className="text-xs font-black text-green-700">{master.StudentAverage ?? 0}/10</span>
                          </div>
                        </div>
                      )}
                      {showPeer && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-600"/>
                            <span className="text-xs font-bold text-gray-500">Peer</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-600 rounded-full" style={{ width: `${((master.PeerAverage ?? 0) / 10) * 100}%` }}/>
                            </div>
                            <span className="text-xs font-black text-purple-700">{master.PeerAverage ?? 0}/10</span>
                          </div>
                        </div>
                      )}
                      {showConfidential && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600"/>
                            <span className="text-xs font-bold text-gray-500">Confidential</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${((master.ConfidentialAverage ?? 0) / 10) * 100}%` }}/>
                            </div>
                            {/* ✅ /10 label */}
                            <span className="text-xs font-black text-blue-700">{master.ConfidentialAverage ?? 0}/10</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${(course.Overall ?? 0) >= 60 ? 'bg-green-500' : 'bg-red-400'}`}
                        style={{ width: `${course.Overall ?? 0}%` }}/>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <span className="text-xs font-black text-gray-400 group-hover:text-green-600 flex items-center gap-1 transition-all">
                        View detail <ChevronRight size={13}/>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      ) : (
        <div className="bg-white p-10 rounded-3xl border border-gray-100 text-center">
          <FileSearch size={48} className="text-gray-300 mx-auto mb-4"/>
          <p className="text-gray-500 font-bold">No data to display. Please select session, teacher and click View.</p>
        </div>
      )}
    </div>
  );
};

export default CourseEvaluationRating;