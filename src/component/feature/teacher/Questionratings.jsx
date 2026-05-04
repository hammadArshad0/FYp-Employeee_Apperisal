import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Star, Loader2, ArrowLeft, Filter, Users, UserCheck } from 'lucide-react';
import DataService from '../../../services/axios';
import { useNavigate, useLocation } from 'react-router-dom';

function QuestionRatings() {
  const teacherId = localStorage.getItem('userId'); // ✅ correct key

  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [evalType, setEvalType] = useState('both');
  const [questions, setQuestions] = useState([]);
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
    if (!selectedSession || !teacherId) return;
    DataService.get(`/TeacherSelf/GetMyCourses/${teacherId}/${selectedSession}`).then(res => {
      setCourses(res.data || []);
      setSelectedCourse('');
    });
  }, [selectedSession, teacherId]);

  const fetchQuestions = useCallback(async (session, course, type) => {
    if (!session || !teacherId) return;
    setLoading(true);
    try {
      const params = { evaluationType: type };
      if (course) params.courseCode = course;
      const res = await DataService.get(
        `/TeacherSelf/GetMyQuestionStats/${teacherId}/${session}`,
        { params }
      );
      setQuestions(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    if (selectedSession && teacherId) {
      fetchQuestions(selectedSession, selectedCourse, evalType);
    }
  }, [selectedSession, selectedCourse, evalType, fetchQuestions]);

  const getColor = (v) => {
    const perc = (v / 4) * 100;
    if (perc >= 80) return '#16a34a';
    if (perc >= 60) return '#f97316';
    if (perc <= 30) return '#dc2626';
    return '#3b82f6';
  };

  const studentQs = questions.filter(q => q.Type === 'Student');
  const peerQs    = questions.filter(q => q.Type === 'Peer');

  const renderQuestionCard = (q, i) => {
    const perc = Math.round((q.AverageScore / 4) * 100);
    const distData = [
      { label: '1 Star',  value: q.Score1 },
      { label: '2 Stars', value: q.Score2 },
      { label: '3 Stars', value: q.Score3 },
      { label: '4 Stars', value: q.Score4 },
    ];

    return (
      <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all">
        <div className="flex items-start justify-between gap-4 mb-4">
          <p className="font-bold text-gray-700 text-sm leading-relaxed flex-1">
            <span className="text-gray-400 font-black mr-2">Q{i + 1}.</span>
            {q.QuestionText || 'Question text not available'}
          </p>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-2xl font-black" style={{ color: getColor(q.AverageScore) }}>
              {Number(q.AverageScore).toFixed(1)}
            </span>
            <span className="text-[9px] font-black text-gray-400 uppercase">/ 4.0</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 px-1">
            <span>Average Score</span>
            <span>{perc}%</span>
          </div>
          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${perc}%`, backgroundColor: getColor(q.AverageScore) }} />
          </div>
        </div>

        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: '900' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fontWeight: '900' }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => active && payload?.length ? (
                  <div className="bg-white p-3 shadow-xl rounded-xl border border-gray-100 text-xs font-bold">
                    {payload[0].payload.label}: <span className="font-black">{payload[0].value} responses</span>
                  </div>
                ) : null}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={28}>
                {distData.map((_, idx) => (
                  <Cell key={idx} fill={['#dc2626', '#f97316', '#3b82f6', '#16a34a'][idx]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 text-right">
          {q.TotalResponses} total responses
        </p>
      </div>
    );
  };

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
              <Star className="text-yellow-500" size={30} />
              Question Ratings
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-1">See how students & peers rated each question</p>
          </div>
        </div>

        <select
          value={selectedSession}
          onChange={e => setSelectedSession(e.target.value)}
          className="bg-white border border-gray-200 p-3 rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-yellow-500 shadow-sm"
        >
          {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Course</label>
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="w-full bg-gray-50 border-none p-3 rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="">All Courses</option>
            {courses.map((c, i) => <option key={i} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Evaluation Type</label>
          <div className="flex gap-2">
            {[
              { val: 'both',    label: 'Both',    icon: <Filter size={14} /> },
              { val: 'student', label: 'Student', icon: <Users size={14} /> },
              { val: 'peer',    label: 'Peer',    icon: <UserCheck size={14} /> },
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => setEvalType(opt.val)}
                className={`flex-1 flex items-center justify-center gap-1.5 p-3 rounded-2xl font-black text-xs uppercase transition-all ${
                  evalType === opt.val
                    ? 'bg-slate-900 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="animate-spin text-yellow-500 mb-4" size={48} />
          <p className="text-gray-400 font-bold tracking-widest text-sm">LOADING QUESTION STATS...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-200 text-gray-400">
          <p className="font-bold uppercase tracking-widest">No question data found</p>
        </div>
      ) : (
        <>
          {studentQs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Users size={18} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">
                  Student Evaluation — {studentQs.length} Questions
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentQs.map((q, i) => renderQuestionCard(q, i))}
              </div>
            </div>
          )}

          {peerQs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <UserCheck size={18} className="text-green-600" />
                </div>
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">
                  Peer Evaluation — {peerQs.length} Questions
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {peerQs.map((q, i) => renderQuestionCard(q, i))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default QuestionRatings;