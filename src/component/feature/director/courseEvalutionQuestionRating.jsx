import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, X, User, Users, BookOpen, ChevronDown, AlertTriangle, Star, ShieldAlert } from 'lucide-react';
import DataService from '../../../services/axios';
import db from '../../../db'; // ✅ Dexie DB import

// ✅ CustomTooltip
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

// ✅ Helper: Dexie data ko API format mein convert karo
const transformDexieToQuestions = (dexieRecords) => {
  // Group by questionId
  const grouped = {};

  dexieRecords.forEach(record => {
    const qId = String(record.questionId);
    if (!grouped[qId]) {
      grouped[qId] = {
        QuestionId: qId,
        QuestionText: record.questionText || `Question ${qId}`,
        Type: 'Confidential',
        isCritical: false,
        AverageScore: 0,
        TotalResponses: 0,
        Score1: 0,
        Score2: 0,
        Score3: 0,
        Score4: 0,
        Evaluators: [],
      };
    }

    const score = parseInt(record.score);
    grouped[qId][`Score${score}`] = (grouped[qId][`Score${score}`] || 0) + 1;
    grouped[qId].TotalResponses += 1;
    grouped[qId].Evaluators.push({
      Name: record.studentName || 'Anonymous',
      ID: record.studentId,
      GivenScore: score,
    });
  });

  // Average calculate karo
  return Object.values(grouped).map(q => {
    const total = q.Score1 * 1 + q.Score2 * 2 + q.Score3 * 3 + q.Score4 * 4;
    q.AverageScore = q.TotalResponses > 0 ? total / q.TotalResponses : 0;
    // Critical: avg below 2.5
    q.isCritical = q.AverageScore < 2.5 && q.TotalResponses > 0;
    return q;
  });
};

const QuestionRatingDetail = () => {
  const { teacherId, sessionId, courseCode: paramCourse } = useParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(paramCourse || '');
  const [evalType, setEvalType] = useState('both');        // both | student | peer | confidential
  const [isCritical, setIsCritical] = useState('all');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  // ✅ Load Courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await DataService.get(`/TeacherSelf/GetMyCourses/${teacherId}/${sessionId}`);
        setCourses(res.data);
        if (!paramCourse && res.data.length > 0) setSelectedCourse(res.data[0]);
      } catch (err) { console.error('Courses error:', err); }
    };
    fetchCourses();
  }, [teacherId, sessionId, paramCourse]);

  // ✅ Fetch Questions — API ya Dexie
  const fetchQuestions = useCallback(async () => {
    if (!selectedCourse) return;
    setLoading(true);

    try {
      // ─── CONFIDENTIAL: Dexie se load karo ──────────────────────────────
      if (evalType === 'confidential') {
        const allRecords = await db.evaluations
          .where('teacherId').equals(String(teacherId))
          .toArray();

        // Is teacher ke is course ka data filter karo
        const courseRecords = allRecords.filter(r =>
          r.courseCode === selectedCourse &&
          String(r.sessionId) === String(sessionId)
        );

        const transformed = transformDexieToQuestions(courseRecords);

        // isCritical filter
        const filtered = isCritical === 'critical'
          ? transformed.filter(q => q.isCritical)
          : transformed;

        setQuestions(filtered);
        return;
      }

      // ─── NORMAL: API se load karo ───────────────────────────────────────
      const res = await DataService.get(
        `/TeacherSelf/GetMyQuestionStats/${teacherId}/${sessionId}`, {
          params: {
            courseCode: selectedCourse,
            evaluationType: evalType,
            onlyCritical: isCritical === 'critical'
          }
        }
      );
      setQuestions(res.data);

    } catch (err) {
      console.error('Fetch error:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [teacherId, sessionId, selectedCourse, evalType, isCritical]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleBarClick = (data) => {
    setModalData(data);
    setModalOpen(true);
  };

  const chartData = questions.map((q, i) => ({
    ...q,
    label: q.QuestionText?.length > 15 ? `Q${i + 1}` : q.QuestionText,
    AvgRounded: parseFloat((q.AverageScore || 0).toFixed(2)),
  }));

  const getBarColor = (avg) => {
    if (avg >= 3.5) return '#15803d';
    if (avg >= 2.5) return '#86efac';
    if (avg >= 1.5) return '#fbbf24';
    return '#f87171';
  };

  const isConfidential = evalType === 'confidential';

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm hover:bg-slate-900 hover:text-white transition-all">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">
              {isConfidential ? 'Confidential Review' : 'Analytical Review'}
            </h1>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Course: {selectedCourse}</p>
          </div>
          {/* ✅ Confidential badge */}
          {isConfidential && (
            <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-2xl shadow-sm">
              <ShieldAlert size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Confidential</span>
            </div>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Academic Course</label>
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full bg-gray-50 p-3 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-inner">
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Source Type</label>
          <select
            value={evalType}
            onChange={(e) => setEvalType(e.target.value)}
            className={`w-full p-3 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-inner transition-all ${
              evalType === 'confidential' ? 'bg-red-50 text-red-700' : 'bg-gray-50'
            }`}
          >
            <option value="both">Both (Student & Peer)</option>
            <option value="student">Student Feedback</option>
            <option value="peer">Peer Review</option>
            {/* ✅ Confidential option */}
            <option value="confidential">🔒 Confidential Evaluation</option>
          </select>
        </div>

        <div>
          <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Issue Tracking</label>
          <select value={isCritical} onChange={(e) => setIsCritical(e.target.value)}
            className={`w-full p-3 rounded-xl font-bold text-xs outline-none appearance-none shadow-inner ${isCritical === 'critical' ? 'bg-red-50 text-red-600' : 'bg-gray-50'}`}>
            <option value="all">All Questions</option>
            <option value="critical">Critical Issues Only</option>
          </select>
        </div>
      </div>

      {/* ✅ Confidential notice banner */}
      {isConfidential && (
        <div className="bg-red-50 border border-red-100 rounded-[2rem] p-5 mb-8 flex items-center gap-4">
          <ShieldAlert className="text-red-500 shrink-0" size={24} />
          <div>
            <p className="text-xs font-black text-red-700 uppercase tracking-widest">Confidential Data — Local Storage</p>
            <p className="text-[10px] text-red-400 font-bold mt-0.5">
              Yeh data sirf is device par Dexie DB mein saved hai. Server pe store nahi hota.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] shadow-sm">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing...</span>
        </div>
      ) : questions.length === 0 ? (
        // ✅ Empty state
        <div className="bg-white p-20 rounded-[3rem] text-center shadow-sm border border-dashed border-gray-200">
          <ShieldAlert className="mx-auto text-gray-300 mb-6" size={60} />
          <h3 className="text-2xl font-black text-gray-400 uppercase italic tracking-tighter">
            {isConfidential ? 'Koi Confidential Data Nahi Mila' : 'No Data Found'}
          </h3>
          <p className="text-gray-300 mt-2 font-bold text-sm">
            {isConfidential
              ? 'Is course ke liye koi confidential evaluation submit nahi hui is device par.'
              : 'No questions available for selected filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* CHART */}
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            {isConfidential && (
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Confidential Evaluation Chart</span>
              </div>
            )}
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} onClick={(e) => e?.activePayload && handleBarClick(e.activePayload[0].payload)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis domain={[0, 4]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} ticks={[0, 1, 2, 3, 4]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="AvgRounded" radius={[10, 10, 0, 0]} barSize={45} cursor="pointer">
                    {chartData.map((entry, index) => <Cell key={index} fill={getBarColor(entry.AvgRounded)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* QUESTION CARDS */}
          <div className="grid grid-cols-1 gap-6">
            {questions.map((q, i) => (
              <div key={i} className={`bg-white p-8 rounded-[2.5rem] border shadow-sm hover:shadow-md transition-all group ${
                isConfidential ? 'border-red-100 hover:border-red-200' : 'border-gray-100'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[9px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-widest">Q{i+1}</span>
                      {/* ✅ Confidential badge on card */}
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                        q.Type === 'Student'       ? 'bg-blue-50 text-blue-600'   :
                        q.Type === 'Confidential'  ? 'bg-red-50 text-red-600'     :
                                                     'bg-purple-50 text-purple-600'
                      }`}>
                        {q.Type === 'Confidential' ? '🔒 Confidential' : q.Type}
                      </span>
                      {q.isCritical && (
                        <span className="flex items-center gap-1 text-[9px] font-black bg-red-600 text-white px-3 py-1 rounded-full uppercase">
                          <AlertTriangle size={10}/> Critical
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 leading-tight">{q.QuestionText}</h3>

                    {/* Rating Boxes */}
                    <div className="flex gap-4 pt-4">
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} className="bg-white border border-gray-100 p-4 rounded-[2rem] text-center min-w-[90px] shadow-sm flex flex-col items-center">
                          <div className="flex gap-0.5 mb-1.5">
                            {[...Array(n)].map((_, starIdx) => (
                              <Star key={starIdx} size={10} className={`fill-current ${n === 4 ? 'text-green-500' : n === 3 ? 'text-blue-400' : n === 2 ? 'text-yellow-400' : 'text-red-400'}`} />
                            ))}
                          </div>
                          <p className="text-[10px] font-black text-slate-800 mb-0.5">{q[`Score${n}`] || 0}</p>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Responses</p>
                        </div>
                      ))}
                    </div>

                    {/* ✅ Confidential mein bhi breakdown button dikhao */}
                    <button onClick={() => handleBarClick(q)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:text-white transition-all mt-6 shadow-sm ${
                      isConfidential
                        ? 'bg-red-50 text-red-700 hover:bg-red-600'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-600'
                    }`}>
                      <Users size={14}/>
                      {isConfidential ? 'Respondent Breakdown' : 'Participant Breakdown'}
                    </button>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className={`px-5 py-3 rounded-3xl mb-2 flex flex-col items-center border shadow-inner ${
                      isConfidential ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <span className={`text-4xl font-black italic tracking-tighter ${isConfidential ? 'text-red-700' : 'text-slate-900'}`}>
                        {(q.AverageScore || 0).toFixed(2)}
                      </span>
                      <div className="flex gap-1 mt-1">
                        {[1,2,3,4].map((star) => (
                          <Star key={star} size={12} className={`${star <= Math.round(q.AverageScore) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest pr-2">Avg Rating</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {modalOpen && modalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className={`p-10 border-b flex justify-between items-start ${
              isConfidential ? 'bg-red-50/50 border-red-50' : 'bg-gray-50/50 border-gray-50'
            }`}>
              <div>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isConfidential ? 'text-red-600' : 'text-blue-600'}`}>
                  {isConfidential ? '🔒 Confidential Respondents' : 'Evaluator Metrics'}
                </p>
                <h4 className="text-lg font-bold text-slate-800 leading-tight">{modalData.QuestionText}</h4>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-3 bg-white rounded-full shadow-sm hover:text-red-500 transition-colors">
                <X size={20}/>
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-3">
              {(modalData.Evaluators || []).length === 0 ? (
                <p className="text-center text-gray-400 font-bold text-sm py-10">Koi evaluator data nahi mila.</p>
              ) : (
                (modalData.Evaluators || []).map((ev, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50/50 border border-gray-100 p-5 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${
                        modalData.Type === 'Student'      ? 'bg-blue-100 text-blue-600'   :
                        modalData.Type === 'Confidential' ? 'bg-red-100 text-red-600'      :
                                                            'bg-purple-100 text-purple-600'
                      }`}>
                        {modalData.Type === 'Confidential' ? <ShieldAlert size={18}/> :
                         modalData.Type === 'Student'      ? <User size={18}/>        : <Users size={18}/>}
                      </div>
                      <div>
                        {/* ✅ Confidential mein name hide karo anonymity ke liye */}
                      <p className="text-sm font-bold text-slate-800">
  {ev.Name || 'Anonymous'}
</p>

<p className="text-[10px] font-black text-gray-400 uppercase">
  ID: {ev.ID || 'N/A'}
</p>
                      </div>
                    </div>
                    <div className={`text-sm font-black px-5 py-2 rounded-xl border-2 ${
                      ev.GivenScore >= 3 ? 'border-green-100 bg-green-50 text-green-700' :
                      ev.GivenScore === 2 ? 'border-orange-100 bg-orange-50 text-orange-600' :
                                           'border-red-100 bg-red-50 text-red-600'
                    }`}>
                      {ev.GivenScore} / 4
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-8 border-t border-gray-50 flex justify-center">
              <button onClick={() => setModalOpen(false)} className="bg-slate-900 text-white px-10 py-3 rounded-2xl text-[11px] font-black uppercase hover:bg-slate-800 transition-all">
                Close Analytics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionRatingDetail;