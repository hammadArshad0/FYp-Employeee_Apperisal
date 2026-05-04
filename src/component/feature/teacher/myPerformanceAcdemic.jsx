import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Cell
} from 'recharts';
import { TrendingUp, BookOpen, ChevronRight, Loader2, Award, Users, Star } from 'lucide-react';
import DataService from '../../../services/axios';
import { useNavigate } from 'react-router-dom';

const MyPerformanceAcdemic = () => {
  const teacherId = localStorage.getItem('userId'); // ✅ correct key

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    DataService.get('/TeacherSelf/GetSessions').then(res => {
      setSessions(res.data || []);
      if (res.data?.length > 0) setSelectedSession(String(res.data[0].id));
    });
  }, []);

  useEffect(() => {
    if (selectedSession && teacherId) fetchPerformance();
  }, [selectedSession, teacherId]);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const res = await DataService.get(`/TeacherSelf/GetMyPerformance/${teacherId}/${selectedSession}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getColor = (v) => v >= 80 ? '#16a34a' : v >= 60 ? '#f97316' : v <= 30 ? '#dc2626' : '#3b82f6';

  const radarData = data ? [
    { subject: 'Student', value: Math.round((data.StudentAverage / 10) * 100), fullMark: 100 },
    { subject: 'Peer',    value: Math.round((data.PeerAverage / 10) * 100),    fullMark: 100 },
    { subject: 'CHR',     value: Math.round((data.ChrAverage / 10) * 100),     fullMark: 100 },
  ] : [];

  const barData = data ? [
    { name: 'Student Eval', score: Math.round((data.StudentAverage / 10) * 100) },
    { name: 'Peer Review',  score: Math.round((data.PeerAverage / 10) * 100) },
    { name: 'CHR Report',   score: Math.round((data.ChrAverage / 10) * 100) },
  ] : [];

  const overall = data?.OverallPercentage || 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={30} />
            My Performance
          </h1>
          <p className="text-gray-500 font-medium text-sm mt-1">
            {data?.Name} — {data?.Department}
          </p>
        </div>

        <select
          value={selectedSession}
          onChange={e => setSelectedSession(e.target.value)}
          className="bg-white border border-gray-200 p-3 rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        >
          {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
          <p className="text-gray-400 font-bold tracking-widest text-sm">LOADING YOUR STATS...</p>
        </div>
      ) : data ? (
        <>
          {/* Overall Score Card */}
          <div className={`p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl ${
            overall >= 80 ? 'bg-green-600' : overall >= 60 ? 'bg-orange-500' : overall <= 30 ? 'bg-red-600' : 'bg-blue-600'
          }`}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 bg-white -mr-20 -mt-20" />
            <p className="text-white/70 font-black uppercase text-xs tracking-widest mb-2">Overall Score</p>
            <p className="text-7xl font-black">{overall}%</p>
            <p className="text-white/80 font-bold mt-2 text-sm">
              {overall >= 80 ? '🏆 Excellent Performance' : overall >= 60 ? '👍 Good Performance' : overall <= 30 ? '⚠️ Needs Improvement' : '📈 Average Performance'}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {(data.Courses || []).map((c, i) => (
                <span key={i} className="bg-white/20 px-3 py-1 rounded-full text-xs font-black">{c}</span>
              ))}
            </div>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Student Evaluation', value: data.StudentAverage, icon: <Users size={20} />, max: 10 },
              { label: 'Peer Review',         value: data.PeerAverage,    icon: <Star size={20} />,  max: 10 },
              { label: 'CHR Report',          value: data.ChrAverage,     icon: <Award size={20} />, max: 10 },
            ].map((m, i) => {
              const perc = Math.round((m.value / m.max) * 100);
              return (
                <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gray-100 rounded-2xl text-gray-500">{m.icon}</div>
                    <span className="text-2xl font-black" style={{ color: getColor(perc) }}>{perc}%</span>
                  </div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{m.label}</p>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${perc}%`, backgroundColor: getColor(perc) }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-800 mb-6 uppercase tracking-tight">Score Breakdown</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: '900' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontWeight: '900' }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip
                    content={({ active, payload }) => active && payload?.length ? (
                      <div className="bg-white p-4 shadow-xl rounded-2xl border border-gray-100">
                        <p className="text-2xl font-black text-gray-800">{payload[0].value}%</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{payload[0].payload.name}</p>
                      </div>
                    ) : null}
                  />
                  <Bar dataKey="score" radius={[10, 10, 0, 0]} barSize={60}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={getColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-800 mb-6 uppercase tracking-tight">Performance Radar</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: '900', fill: '#64748b' }} />
                  <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate(`/teacher-dashboard/acdemic-performance/course-comparison?session=${selectedSession}`)}
              className="bg-white border-2 border-blue-600 text-blue-600 p-5 rounded-[2rem] font-black flex items-center justify-between hover:bg-blue-600 hover:text-white transition-all group shadow-sm"
            >
              <div>
                <p className="text-xs uppercase tracking-widest opacity-70 mb-1">Compare My Courses</p>
                <p className="text-lg">Course Comparison →</p>
              </div>
              <BookOpen size={28} className="opacity-60 group-hover:opacity-100" />
            </button>

            <button
              onClick={() => navigate(`/teacher-dashboard/acdemic-performance/question-ratings?session=${selectedSession}`)}
              className="bg-slate-900 text-white p-5 rounded-[2rem] font-black flex items-center justify-between hover:bg-blue-600 transition-all group shadow-sm"
            >
              <div>
                <p className="text-xs uppercase tracking-widest opacity-70 mb-1">Question-wise Detail</p>
                <p className="text-lg">See Ratings →</p>
              </div>
              <ChevronRight size={28} className="opacity-60 group-hover:opacity-100" />
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

export default MyPerformanceAcdemic;