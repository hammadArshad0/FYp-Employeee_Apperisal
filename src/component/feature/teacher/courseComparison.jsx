import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { BookOpen, Loader2, ArrowLeft, TrendingUp } from 'lucide-react';
import DataService from '../../../services/axios';
import { useNavigate, useLocation } from 'react-router-dom';

function CourseComparison() {
  const teacherId      = localStorage.getItem('userId');
  const loginSessionId = localStorage.getItem('sessionId');

  const [sessions, setSessions]               = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [courses, setCourses]                 = useState([]);
  const [loading, setLoading]                 = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    DataService.get('/Session/list').then(res => {
      const list = res.data || [];
      setSessions(list);

      const urlSession = new URLSearchParams(location.search).get('session');
      if (urlSession) {
        setSelectedSession(urlSession);
      } else if (loginSessionId) {
        setSelectedSession(String(loginSessionId));
      } else if (list.length > 0) {
        setSelectedSession(String(list[0].id || list[0].Id));
      }
    });
  }, []);

  useEffect(() => {
    if (selectedSession && teacherId) fetchComparison();
  }, [selectedSession, teacherId]);

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const res = await DataService.get(`/TeacherSelf/GetCourseComparison/${teacherId}/${selectedSession}`);
      setCourses(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#16a34a', '#f97316', '#8b5cf6', '#ec4899'];

  const getColor = v =>
    v >= 80 ? '#16a34a' : v >= 60 ? '#f97316' : v <= 30 ? '#dc2626' : '#3b82f6';

  const getLabel = v =>
    v >= 80 ? 'Excellent' : v >= 60 ? 'Good' : v <= 30 ? 'Poor' : 'Average';

  const buildMap = fn =>
    courses.reduce((acc, c) => ({ ...acc, [c.CourseCode]: fn(c) }), {});

  const barData = [
    { metric: 'Student Eval', ...buildMap(c => Math.min(100, Math.round((c.StudentAverage / 10) * 100))) },
    { metric: 'Peer Review',  ...buildMap(c => Math.min(100, Math.round((c.PeerAverage    / 10) * 100))) },
    { metric: 'Overall',      ...buildMap(c => Math.min(100, c.Overall)) },
  ];

  const radarData = [
    { subject: 'Student', ...buildMap(c => Math.min(100, Math.round((c.StudentAverage / 10) * 100))) },
    { subject: 'Peer',    ...buildMap(c => Math.min(100, Math.round((c.PeerAverage    / 10) * 100))) },
    { subject: 'Overall', ...buildMap(c => Math.min(100, c.Overall)) },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="p-3 bg-white rounded-2xl border border-gray-200 hover:bg-gray-100 transition-all shadow-sm">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
              <BookOpen className="text-green-600" size={28} />
              Course Comparison
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-1">
              Your performance across all courses
            </p>
          </div>
        </div>

        <select
          value={selectedSession}
          onChange={e => setSelectedSession(e.target.value)}
          className="bg-white border border-gray-200 p-3 rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
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
          <Loader2 className="animate-spin text-green-600 mb-4" size={48} />
          <p className="text-gray-400 font-bold tracking-widest text-sm">COMPARING COURSES...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-200 text-gray-400">
          <p className="font-bold uppercase tracking-widest">No course data found for this session</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((c, i) => {
              const studentPct  = Math.min(100, Math.round((c.StudentAverage / 10) * 100));
              const peerPct     = Math.min(100, Math.round((c.PeerAverage    / 10) * 100));
              const overall     = Math.min(100, c.Overall);
              const accentColor = COLORS[i % COLORS.length];

              return (
                <div key={i} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden">
                  <div className="h-1.5" style={{ backgroundColor: accentColor }} />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-2xl text-white font-black text-sm"
                          style={{ backgroundColor: accentColor }}>
                          {c.CourseCode}
                        </div>
                        {c.CourseName && (
                          <p className="text-sm font-bold text-gray-500 truncate max-w-[140px]">{c.CourseName}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black" style={{ color: getColor(overall) }}>{overall}%</p>
                        <p className="text-[10px] font-black uppercase tracking-widest"
                          style={{ color: getColor(overall) }}>{getLabel(overall)}</p>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      {[
                        { label: 'Student Evaluation', value: studentPct },
                        { label: 'Peer Review',         value: peerPct   },
                        { label: 'Overall',             value: overall   },
                      ].map((m, j) => (
                        <div key={j}>
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 px-0.5">
                            <span>{m.label}</span>
                            <span style={{ color: getColor(m.value) }}>{m.value}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${m.value}%`, backgroundColor: getColor(m.value) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-800 mb-1 uppercase tracking-tight">Side by Side</h3>
            <p className="text-xs text-gray-400 mb-6">All courses compared across each metric</p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="metric" tick={{ fontSize: 11, fontWeight: '900' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="bg-white p-4 shadow-xl rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase mb-2">{label}</p>
                          {payload.map((p, i) => (
                            <p key={i} className="font-black text-sm" style={{ color: p.fill }}>
                              {p.name}: {p.value}%
                            </p>
                          ))}
                        </div>
                      ) : null
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: '900', paddingTop: '16px' }} />
                  {courses.map((c, i) => (
                    <Bar key={c.CourseCode} dataKey={c.CourseCode}
                      fill={COLORS[i % COLORS.length]} radius={[8, 8, 0, 0]} barSize={40} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {courses.length >= 2 && (
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-gray-800 mb-1 uppercase tracking-tight">Radar Comparison</h3>
              <p className="text-xs text-gray-400 mb-6">Shape comparison across all metrics</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: '900', fill: '#64748b' }} />
                    {courses.map((c, i) => (
                      <Radar key={c.CourseCode} name={c.CourseCode} dataKey={c.CourseCode}
                        stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]}
                        fillOpacity={0.15} strokeWidth={2} />
                    ))}
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: '900', paddingTop: '16px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate(`/teacher-dashboard/acdemic-performance/question-ratings?session=${selectedSession}`)}
            className="w-full bg-slate-900 text-white p-5 rounded-[2rem] font-black flex items-center justify-between hover:bg-blue-600 transition-all shadow-sm"
          >
            <div>
              <p className="text-xs uppercase tracking-widest opacity-70 mb-1">See Details</p>
              <p className="text-lg">Question-wise Ratings →</p>
            </div>
            <TrendingUp size={28} className="opacity-60" />
          </button>
        </>
      )}
    </div>
  );
}

export default CourseComparison;