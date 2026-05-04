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
  const teacherId = localStorage.getItem('userId'); // ✅ correct key

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    DataService.get('/TeacherSelf/GetSessions').then(res => {
      setSessions(res.data || []);
      const params = new URLSearchParams(location.search);
      const s = params.get('session');
      if (s) setSelectedSession(s);
      else if (res.data?.length > 0) setSelectedSession(String(res.data[0].id));
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
  const radarColors = ['#3b82f6', '#16a34a', '#f97316', '#8b5cf6'];

  const getColor = (v) => v >= 80 ? '#16a34a' : v >= 60 ? '#f97316' : v <= 30 ? '#dc2626' : '#3b82f6';

  const buildCourseMap = (getValue) =>
    courses.reduce((acc, c) => ({ ...acc, [c.CourseCode]: getValue(c) }), {});

  const radarData = [
    { subject: 'Student Eval', ...buildCourseMap(c => Math.round((c.StudentAverage / 10) * 100)) },
    { subject: 'Peer Review',  ...buildCourseMap(c => Math.round((c.PeerAverage / 10) * 100)) },
    { subject: 'Overall',      ...buildCourseMap(c => c.Overall) },
  ];

  const barChartData = [
    { metric: 'Student Eval', ...buildCourseMap(c => Math.round((c.StudentAverage / 10) * 100)) },
    { metric: 'Peer Review',  ...buildCourseMap(c => Math.round((c.PeerAverage / 10) * 100)) },
    { metric: 'Overall',      ...buildCourseMap(c => c.Overall) },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white rounded-2xl border border-gray-200 hover:bg-gray-100 transition-all shadow-sm"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
              <BookOpen className="text-green-600" size={30} />
              Course Comparison
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Compare your performance across courses</p>
          </div>
        </div>

        <select
          value={selectedSession}
          onChange={e => setSelectedSession(e.target.value)}
          className="bg-white border border-gray-200 p-3 rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
        >
          {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
          {/* Course Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((c, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-3 rounded-2xl text-white font-black text-sm"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  >
                    {c.CourseCode}
                  </div>
                  <span className="text-2xl font-black" style={{ color: getColor(c.Overall) }}>{c.Overall}%</span>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Student Evaluation', value: Math.round((c.StudentAverage / 10) * 100) },
                    { label: 'Peer Review',         value: Math.round((c.PeerAverage / 10) * 100) },
                  ].map((m, j) => (
                    <div key={j}>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 px-1">
                        <span>{m.label}</span>
                        <span className="text-gray-700">{m.value}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${m.value}%`, backgroundColor: getColor(m.value) }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-800 mb-6 uppercase tracking-tight">Side by Side Comparison</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="metric" tick={{ fontSize: 11, fontWeight: '900' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontWeight: '900' }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip
                    content={({ active, payload, label }) => active && payload?.length ? (
                      <div className="bg-white p-4 shadow-xl rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-2">{label}</p>
                        {payload.map((p, i) => (
                          <p key={i} className="font-black" style={{ color: p.fill }}>{p.name}: {p.value}%</p>
                        ))}
                      </div>
                    ) : null}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: '900' }} />
                  {courses.map((c, i) => (
                    <Bar key={c.CourseCode} dataKey={c.CourseCode} fill={COLORS[i % COLORS.length]} radius={[8, 8, 0, 0]} barSize={40} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Chart */}
          {courses.length >= 2 && (
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-gray-800 mb-6 uppercase tracking-tight">Radar Comparison</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: '900', fill: '#64748b' }} />
                    {courses.map((c, i) => (
                      <Radar
                        key={c.CourseCode}
                        name={c.CourseCode}
                        dataKey={c.CourseCode}
                        stroke={radarColors[i % radarColors.length]}
                        fill={radarColors[i % radarColors.length]}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: '900' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Go to Question Ratings */}
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