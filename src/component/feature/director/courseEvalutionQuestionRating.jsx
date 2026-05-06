import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ArrowLeft, X, User, Users, BookOpen, ChevronDown } from 'lucide-react';
import DataService from '../../../services/axios';

// ─── Custom Tooltip for question graph ───────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 text-sm">
        <p className="font-black text-gray-800 mb-1">{payload[0].payload.QuestionText}</p>
        <p className="text-green-700 font-bold">Avg Score: {payload[0].value} / 4</p>
        <p className="text-gray-400">Responses: {payload[0].payload.TotalResponses}</p>
      </div>
    );
  }
  return null;
};

// ─── Score badge colors ───────────────────────────────────────────────────────
const scoreBadge = (score) => {
  const map = {
    4: 'bg-green-100 text-green-800',
    3: 'bg-blue-100 text-blue-800',
    2: 'bg-yellow-100 text-yellow-800',
    1: 'bg-red-100 text-red-800',
  };
  return map[score] || 'bg-gray-100 text-gray-600';
};

const QuestionRatingDetail = () => {
  const { teacherId, sessionId, courseCode: paramCourse, evalType: paramEvalType } = useParams();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [courses, setCourses]         = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(paramCourse || '');
  const [evalType, setEvalType]       = useState(paramEvalType || 'both');
  const [questions, setQuestions]     = useState([]);
  const [loading, setLoading]         = useState(false);

  // Modal state
  const [modalOpen, setModalOpen]     = useState(false);
  const [modalData, setModalData]     = useState(null); // { question, evaluators[] }

  // ── 1. Load courses for this teacher + session ─────────────────────────────
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await DataService.get(`/TeacherSelf/GetMyCourses/${teacherId}/${sessionId}`);
        // res.data = ["CS101","CS202",...]
        setCourses(res.data);
        if (!paramCourse && res.data.length > 0) setSelectedCourse(res.data[0]);
      } catch (err) {
        console.error('Courses fetch error:', err);
      }
    };
    fetchCourses();
  }, [teacherId, sessionId]);

  // ── 2. Load question data whenever course or evalType changes ──────────────
  useEffect(() => {
    if (!selectedCourse) return;
    fetchQuestions();
  }, [selectedCourse, evalType]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await DataService.get(
        `/TeacherSelf/GetCourseQuestionDetail/${teacherId}/${sessionId}/${selectedCourse}?evaluationType=${evalType}`
      );
      setQuestions(res.data);
    } catch (err) {
      console.error('Questions fetch error:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  // ── 3. Click on bar → open modal with evaluator list ──────────────────────
  const handleBarClick = (data) => {
    setModalData(data);
    setModalOpen(true);
  };

  // Short label for X-axis
  const shortLabel = (text, i) =>
    text ? (text.length > 18 ? `Q${i + 1}` : text) : `Q${i + 1}`;

  // ── Prepare chart data ─────────────────────────────────────────────────────
  const chartData = questions.map((q, i) => ({
    ...q,
    label: shortLabel(q.QuestionText, i),
    AvgRounded: parseFloat((q.AverageScore || 0).toFixed(2)),
  }));

  const getBarColor = (avg) => {
    if (avg >= 3.5) return '#15803d';
    if (avg >= 2.5) return '#86efac';
    if (avg >= 1.5) return '#fbbf24';
    return '#f87171';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">

      {/* ── HEADER ── */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 bg-white rounded-2xl border border-gray-200 hover:bg-gray-50
                     text-gray-500 hover:text-gray-800 transition-all active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800">Question-wise Ratings</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Teacher ID: <span className="font-bold text-gray-600">{teacherId}</span>
            {' · '}Session: <span className="font-bold text-gray-600">{sessionId}</span>
          </p>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end mb-8">

        {/* Course Dropdown */}
        <div className="flex-1 min-w-[180px]">
          <label className="text-[11px] font-black text-gray-400 mb-1.5 block uppercase tracking-widest">
            Course
          </label>
          <div className="relative">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 rounded-2xl text-sm font-semibold text-gray-700
                         border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500
                         appearance-none pr-10"
            >
              {courses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Evaluation Type */}
        <div className="flex-1 min-w-[160px]">
          <label className="text-[11px] font-black text-gray-400 mb-1.5 block uppercase tracking-widest">
            Evaluation Type
          </label>
          <div className="relative">
            <select
              value={evalType}
              onChange={(e) => setEvalType(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 rounded-2xl text-sm font-semibold text-gray-700
                         border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500
                         appearance-none pr-10"
            >
              <option value="both">Both (Student &amp; Peer)</option>
              <option value="student">Student Only</option>
              <option value="peer">Peer Only</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Info badge */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 rounded-2xl border border-green-200">
          <BookOpen size={16} className="text-green-700" />
          <span className="text-sm font-black text-green-800">{selectedCourse}</span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>

      ) : questions.length > 0 ? (
        <div className="space-y-8">

          {/* GRAPH — click a bar to open modal */}
          <div className="bg-white p-8 rounded-[36px] border border-gray-100 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-black text-gray-800">Question-wise Average Score</h2>
              <p className="text-xs text-gray-400 mt-1">
                Click any bar to see individual evaluator scores
              </p>
            </div>

            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload.length) {
                      handleBarClick(e.activePayload[0].payload);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    axisLine={false} tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                    dy={10} angle={-25} textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 4]}
                    axisLine={false} tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    ticks={[0, 1, 2, 3, 4]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="AvgRounded" name="Avg Score" radius={[6,6,0,0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={getBarColor(entry.AvgRounded)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Color legend */}
            <div className="flex flex-wrap gap-4 mt-2 justify-end">
              {[
                { color: '#15803d', label: 'Excellent (≥3.5)' },
                { color: '#86efac', label: 'Good (≥2.5)' },
                { color: '#fbbf24', label: 'Average (≥1.5)' },
                { color: '#f87171', label: 'Poor (<1.5)' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
                  <span className="text-xs font-semibold text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* QUESTION CARDS LIST */}
        {/* ── QUESTION ANALYSIS CARDS (AS PER IMAGE) ── */}
<div className="space-y-6">
  {questions.map((q, i) => (
    <div
      key={`${q.Type}-${q.QuestionId}-${i}`}
      className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm"
    >
      {/* Header: Question Number, Text, and Avg Rating */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
            <span className="text-gray-400 font-black">{i + 1}</span>
          </div>
          <div>
            <h3 className="text-[#2D3748] font-black text-lg leading-tight mb-2">
              {q.QuestionText || "Question Title"}
            </h3>
            {/* Stars Placeholder - (Static for UI look) */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((star) => (
                <span key={star} className={star <= Math.round(q.AverageScore) ? "text-yellow-400" : "text-gray-200"}>
                  ★
                </span>
              ))}
              <span className="text-gray-400 text-xs font-bold ml-1">({parseFloat(q.AverageScore || 0).toFixed(1)})</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-3xl font-black text-green-600 leading-none">
            {parseFloat(q.AverageScore || 0).toFixed(2)}
          </p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Avg Rating</p>
        </div>
      </div>

      {/* Score Distribution Section */}
      <div className="mb-6">
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Score Distribution</p>
        <div className="space-y-3">
          {[4, 3, 2, 1].map((s) => {
            const count = q[`Score${s}`] || 0;
            // Percentage calculation for the bar width
            const pct = q.TotalResponses > 0 ? (count / q.TotalResponses) * 100 : 0;
            
            // Color logic based on score
            const barColor = s === 4 ? "bg-green-500" : s === 3 ? "bg-blue-400" : s === 2 ? "bg-orange-400" : "bg-red-500";

            return (
              <div key={s} className="flex items-center gap-4">
                <span className="text-[11px] font-bold text-gray-500 w-4">S{s}</span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-4 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer: Eval Type and Action Link */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-50">
        <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-4 py-1.5 rounded-full border border-blue-100 uppercase tracking-wide">
          {q.Type === 'Student' ? 'Student Eval' : 'Peer Eval'}
        </span>
        
        <button 
          onClick={() => handleBarClick({ ...q, label: `Q${i + 1}` })}
          className="text-[11px] font-bold text-gray-400 italic hover:text-green-600 transition-colors"
        >
          Click to see who rated →
        </button>
      </div>
    </div>
  ))}
</div>
        </div>

      ) : (
        <div className="bg-white rounded-[40px] border-2 border-dashed border-gray-200 p-20 text-center">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen size={32} className="text-gray-200" />
          </div>
          <h3 className="text-lg font-black text-gray-700">No Questions Found</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto mt-2">
            No evaluation data for <strong>{selectedCourse}</strong> with type "{evalType}".
          </p>
        </div>
      )}

      {/* ── EVALUATOR MODAL ── */}
      {modalOpen && modalData && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full
                    ${modalData.Type === 'Student'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {modalData.Type === 'Student' ? '👤 Student Evaluation' : '👥 Peer Evaluation'}
                  </span>
                </div>
                <h3 className="text-base font-black text-gray-800 leading-snug">
                  {modalData.QuestionText || 'Question Detail'}
                </h3>
                <p className="text-xs text-gray-400 mt-1 font-semibold">
                  Avg: <span className="text-green-700 font-black">
                    {parseFloat(modalData.AverageScore || 0).toFixed(2)} / 4
                  </span>
                  {' · '}{modalData.TotalResponses} responses
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Evaluator List */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {(modalData.StudentDetails || []).length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No individual records available.</p>
              ) : (
                (modalData.StudentDetails || []).map((person, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-2xl bg-gray-50
                               hover:bg-green-50 border border-transparent hover:border-green-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black
                        ${modalData.Type === 'Student'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {modalData.Type === 'Student'
                          ? <User size={16} />
                          : <Users size={16} />
                        }
                      </div>

                      <div>
                        <p className="text-sm font-black text-gray-800">
                          {person.StudentName || person.Name || '—'}
                        </p>
                        <p className="text-xs text-gray-400 font-semibold">
                          {modalData.Type === 'Student' ? 'Roll No' : 'Teacher ID'}: {person.RollNo || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Score badge */}
                    <span className={`px-3 py-1 rounded-xl text-sm font-black ${scoreBadge(person.Score)}`}>
                      {person.Score} / 4
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Score Distribution in Modal */}
            <div className="p-5 border-t border-gray-100">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
                Score Distribution
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(s => {
                  const count = modalData[`Score${s}`] || 0;
                  const pct   = modalData.TotalResponses > 0
                    ? ((count / modalData.TotalResponses) * 100).toFixed(0)
                    : 0;
                  return (
                    <div key={s} className="text-center bg-gray-50 rounded-2xl p-3">
                      <p className="text-xl font-black text-gray-800">{count}</p>
                      <p className="text-[11px] text-gray-400 font-bold">Score {s}</p>
                      <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: s === 4 ? '#15803d' : s === 3 ? '#86efac'
                                      : s === 2 ? '#fbbf24' : '#f87171'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionRatingDetail;