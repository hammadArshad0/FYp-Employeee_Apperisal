import React, { useState, useEffect, useCallback } from 'react';
import { Star, Loader2, ArrowLeft, Filter, Users, UserCheck } from 'lucide-react';
import DataService from '../../../services/axios';
import { useNavigate, useLocation } from 'react-router-dom';

function QuestionRatings() {
  const teacherId = localStorage.getItem('userId');

  const [sessions, setSessions]               = useState([]);
  const [courses, setCourses]                 = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedCourse, setSelectedCourse]   = useState('');
  const [evalType, setEvalType]               = useState('both');
  const [questions, setQuestions]             = useState([]);
  const [loading, setLoading]                 = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    DataService.get('/TeacherSelf/GetSessions').then(res => {
      setSessions(res.data || []);
      const s = new URLSearchParams(location.search).get('session');
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
    if (selectedSession && teacherId)
      fetchQuestions(selectedSession, selectedCourse, evalType);
  }, [selectedSession, selectedCourse, evalType, fetchQuestions]);

  const getColor = v => {
    const p = (v / 4) * 100;
    if (p >= 80) return '#16a34a';
    if (p >= 60) return '#f97316';
    if (p <= 30) return '#dc2626';
    return '#3b82f6';
  };

  const getLabel = v => {
    const p = (v / 4) * 100;
    if (p >= 80) return 'Excellent';
    if (p >= 60) return 'Good';
    if (p <= 30) return 'Poor';
    return 'Average';
  };

  const StarRow = ({ score, size = 26 }) => (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4].map(i => {
        const diff   = score - (i - 1);
        const filled = diff >= 1 ? 1 : diff > 0 ? diff : 0;
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
            <Star size={size} fill="#e5e7eb" color="#e5e7eb"
              style={{ position: 'absolute', top: 0, left: 0 }} />
            {filled > 0 && (
              <span style={{
                position: 'absolute', top: 0, left: 0,
                width: `${filled * 100}%`, overflow: 'hidden', display: 'inline-block'
              }}>
                <Star size={size} fill="#facc15" color="#facc15" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );

  const renderCard = (q, i) => {
    const perc  = Math.round((q.AverageScore / 4) * 100);
    const col   = getColor(q.AverageScore);
    const lbl   = getLabel(q.AverageScore);
    const total = (q.Score1 + q.Score2 + q.Score3 + q.Score4) || 1;

    const distRows = [
      { star: 4, value: q.Score4, col: '#16a34a' },
      { star: 3, value: q.Score3, col: '#3b82f6' },
      { star: 2, value: q.Score2, col: '#f97316' },
      { star: 1, value: q.Score1, col: '#dc2626' },
    ];

    return (
      <div key={i} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">

        {/* color strip */}
        <div className="h-1.5" style={{ backgroundColor: col }} />

        <div className="p-6 flex flex-col gap-4 flex-1">

          {/* question */}
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black text-white"
              style={{ backgroundColor: col }}>
              {i + 1}
            </div>
            <p className="text-[13px] font-semibold text-gray-600 leading-relaxed">
              {q.QuestionText || 'Question text not available'}
            </p>
          </div>

          {/* big score + stars */}
          <div className="flex items-end justify-between pt-1">
            <div>
              <StarRow score={q.AverageScore} size={24} />
              <p className="text-[10px] font-black uppercase tracking-widest mt-2"
                style={{ color: col }}>
                {lbl}
              </p>
            </div>
            <div className="text-right leading-none">
              <span className="text-5xl font-black" style={{ color: col }}>
                {Number(q.AverageScore).toFixed(1)}
              </span>
              <span className="text-base text-gray-300 font-bold"> / 4</span>
            </div>
          </div>

          {/* slim progress */}
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${perc}%`, backgroundColor: col }} />
          </div>

          {/* divider */}
          <div className="border-t border-gray-50" />

          {/* distribution — stars + count only, NO bar */}
          <div className="space-y-2.5">
            {distRows.map(r => {
              const pct = Math.round(((r.value || 0) / total) * 100);
              return (
                <div key={r.star} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 shrink-0">
                    {[1, 2, 3, 4].map(s => (
                      <Star key={s} size={12}
                        fill={s <= r.star ? '#facc15' : '#e5e7eb'}
                        color={s <= r.star ? '#facc15' : '#e5e7eb'} />
                    ))}
                  </div>
                  <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: r.col }} />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 min-w-[52px] justify-end">
                    <span className="text-xs font-black" style={{ color: r.col }}>
                      {r.value || 0}
                    </span>
                    <span className="text-[10px] text-gray-300 font-bold">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-right">
            {q.TotalResponses} total responses
          </p>
        </div>
      </div>
    );
  };

  const Section = ({ title, icon, bgColor, items }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-2xl ${bgColor}`}>{icon}</div>
        <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">
          {title} — {items.length} Questions
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((q, i) => renderCard(q, i))}
      </div>
    </div>
  );

  const studentQs = questions.filter(q => q.Type === 'Student');
  const peerQs    = questions.filter(q => q.Type === 'Peer');

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
              <Star size={28} fill="#facc15" color="#facc15" />
              Question Ratings
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-1">
              How students & peers rated each question
            </p>
          </div>
        </div>
        <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}
          className="bg-white border border-gray-200 p-3 rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm">
          {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Course</label>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
            className="w-full bg-gray-50 p-3 rounded-2xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-yellow-400 border-none">
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
              <button key={opt.val} onClick={() => setEvalType(opt.val)}
                className={`flex-1 flex items-center justify-center gap-1.5 p-3 rounded-2xl font-black text-xs uppercase transition-all ${
                  evalType === opt.val ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="animate-spin text-yellow-400 mb-4" size={48} />
          <p className="text-gray-400 font-bold tracking-widest text-sm">LOADING QUESTION STATS...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-200 text-gray-400">
          <p className="font-bold uppercase tracking-widest">No question data found</p>
        </div>
      ) : (
        <>
          {studentQs.length > 0 && (
            <Section title="Student Evaluation"
              icon={<Users size={18} className="text-blue-600" />}
              bgColor="bg-blue-50" items={studentQs} />
          )}
          {peerQs.length > 0 && (
            <Section title="Peer Evaluation"
              icon={<UserCheck size={18} className="text-green-600" />}
              bgColor="bg-green-50" items={peerQs} />
          )}
        </>
      )}
    </div>
  );
}

export default QuestionRatings;