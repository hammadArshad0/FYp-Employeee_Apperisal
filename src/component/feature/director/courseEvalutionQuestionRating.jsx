import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, X, User, Users, AlertTriangle, Star, ShieldAlert } from 'lucide-react';
import DataService from '../../../services/axios';
import db from '../../../db';

const parseCritical = (val) => val === true || val === 1 || val === '1' || val === 'true';

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 animate-pulse space-y-4">
    <div className="flex gap-2">
      <div className="h-5 w-16 bg-gray-100 rounded-full" />
      <div className="h-5 w-20 bg-gray-100 rounded-full" />
    </div>
    <div className="h-5 w-3/4 bg-gray-100 rounded-xl" />
    <div className="h-4 w-1/2 bg-gray-100 rounded-xl" />
    <div className="flex gap-3 pt-2">
      {[1,2,3,4].map(n => <div key={n} className="h-20 w-24 bg-gray-100 rounded-[2rem]" />)}
    </div>
  </div>
);

// ── CustomTooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 min-w-[190px]">
      <p className="font-black text-gray-800 mb-2 text-xs leading-tight">{d.QuestionText}</p>
      <p className="text-green-700 font-bold text-xs mb-1">Avg: {payload[0].value} / 4</p>
      <p className="text-slate-400 font-bold text-xs mb-2">{d.TotalResponses} responses</p>
      <div className="space-y-1">
        {[4,3,2,1].map(n => {
          const pct = d.TotalResponses > 0 ? ((d[`Score${n}`]||0)/d.TotalResponses)*100 : 0;
          const colors = {4:'bg-green-500',3:'bg-blue-400',2:'bg-yellow-400',1:'bg-red-400'};
          return (
            <div key={n} className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 w-5">{n}★</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`${colors[n]} h-full rounded-full`} style={{width:`${pct}%`}} />
              </div>
              <span className="text-[9px] font-black text-slate-500 w-4 text-right">{d[`Score${n}`]||0}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Dexie → API format ────────────────────────────────────────────────────────
const transformDexieToQuestions = (records) => {
  const grouped = {};
  records.forEach(r => {
    const qId = String(r.questionId);
    if (!grouped[qId]) {
      grouped[qId] = {
        QuestionId: qId, QuestionText: r.questionText || `Question ${qId}`,
        Type: r.questionType || 'Confidential', isCritical: parseCritical(r.isCritical),
        AverageScore: 0, TotalResponses: 0,
        Score1:0, Score2:0, Score3:0, Score4:0, Evaluators:[]
      };
    }
    const s = parseInt(r.score);
    grouped[qId][`Score${s}`] = (grouped[qId][`Score${s}`]||0)+1;
    grouped[qId].TotalResponses += 1;
    grouped[qId].Evaluators.push({ Name: r.studentName||'Anonymous', ID: r.studentId||'-', GivenScore:s });
  });
  return Object.values(grouped).map(q => {
    q.AverageScore = q.TotalResponses > 0
      ? (q.Score1+q.Score2*2+q.Score3*3+q.Score4*4)/q.TotalResponses : 0;
    return q;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
const QuestionRatingDetail = () => {
  const { teacherId, sessionId, courseCode: paramCourse } = useParams();
  const navigate = useNavigate();

  const [courses,         setCourses]         = useState([]);
  const [sections,        setSections]        = useState([]);
  const [selectedCourse,  setSelectedCourse]  = useState(paramCourse || '');
  const [selectedSection, setSelectedSection] = useState('');
  const [evalType,        setEvalType]        = useState('student');
  const [isCritical,      setIsCritical]      = useState('all');
  const [questions,       setQuestions]       = useState([]);
  // ✅ initialLoading = pehli baar, reloading = filter change par (data raha hai screen par)
  const [initialLoading,  setInitialLoading]  = useState(true);
  const [reloading,       setReloading]       = useState(false);
  const [modalOpen,       setModalOpen]       = useState(false);
  const [modalData,       setModalData]       = useState(null);
  const firstLoad = useRef(true);

  // ── Courses + Sections parallel ──────────────────────────────────────────────
  useEffect(() => {
    if (!teacherId || !sessionId) return;
    const init = async () => {
      try {
        // ✅ parallel — dono ek saath chalte hain
        const [coursesRes, sectionsRes] = await Promise.all([
          DataService.get(`/TeacherSelf/GetMyCourses/${teacherId}/${sessionId}`),
          paramCourse
            ? DataService.get('/AcademicPerformance/GetSections', {
                params: { teacherId, sessionId, courseCode: paramCourse }
              })
            : Promise.resolve({ data: [] })
        ]);
        setCourses(coursesRes.data || []);
        setSections(sectionsRes.data || []);
        if (!paramCourse && coursesRes.data?.length > 0) {
          setSelectedCourse(coursesRes.data[0]);
        }
      } catch (err) { console.error('Init error:', err); }
    };
    init();
  }, [teacherId, sessionId, paramCourse]);

  // ── Sections reload when course changes (not on first mount) ─────────────────
  useEffect(() => {
    if (!selectedCourse || firstLoad.current) return;
    const fetchSections = async () => {
      try {
        const res = await DataService.get('/AcademicPerformance/GetSections', {
          params: { teacherId, sessionId, courseCode: selectedCourse }
        });
        setSections(res.data || []);
        setSelectedSection('');
      } catch (err) { console.error('Sections error:', err); }
    };
    fetchSections();
  }, [teacherId, sessionId, selectedCourse]);

  // ── Fetch questions ──────────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    if (!selectedCourse) return;

    // ✅ pehli baar skeleton, baad mein sirf dimmed overlay
    if (firstLoad.current) {
      setInitialLoading(true);
    } else {
      setReloading(true);
    }

    try {
      if (evalType === 'confidential') {
        const allRecords = await db.evaluations
          .where('teacherId').equals(String(teacherId)).toArray();
        let filtered = allRecords.filter(r =>
          r.courseCode === selectedCourse && String(r.sessionId) === String(sessionId)
        );
        if (selectedSection) filtered = filtered.filter(r => String(r.section) === String(selectedSection));
        if (isCritical === 'critical') filtered = filtered.filter(r => parseCritical(r.isCritical));
        setQuestions(transformDexieToQuestions(filtered));
      } else {
        const res = await DataService.get(
          `/TeacherSelf/GetMyQuestionStats/${teacherId}/${sessionId}`, {
            params: {
              courseCode:     selectedCourse,
              evaluationType: evalType,
              onlyCritical:   isCritical === 'critical',
              section:        selectedSection || undefined
            }
          }
        );
        setQuestions(res.data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setQuestions([]);
    } finally {
      setInitialLoading(false);
      setReloading(false);
      firstLoad.current = false;
    }
  }, [teacherId, sessionId, selectedCourse, selectedSection, evalType, isCritical]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleBarClick = (data) => { setModalData(data); setModalOpen(true); };
  const isConfidential = evalType === 'confidential';

  const chartData = questions.map((q, i) => ({
    ...q,
    label:      q.QuestionText?.length > 15 ? `Q${i+1}` : q.QuestionText,
    AvgRounded: parseFloat((q.AverageScore||0).toFixed(2)),
  }));

  const getBarColor = (avg) => {
    if (avg >= 3.5) return '#15803d';
    if (avg >= 2.5) return '#86efac';
    if (avg >= 1.5) return '#fbbf24';
    return '#f87171';
  };

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
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              Course: {selectedCourse}{selectedSection ? ` · Section ${selectedSection}` : ''}
            </p>
          </div>
          {isConfidential && (
            <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-2xl shadow-sm">
              <ShieldAlert size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Confidential</span>
            </div>
          )}
        </div>
        {/* ✅ reloading spinner — chota, header mein, data screen par raha hai */}
        {reloading && (
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Updating...</span>
          </div>
        )}
      </div>

      {/* FILTERS */}
      <div className={`bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 transition-opacity ${reloading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Academic Course</label>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
            className="w-full bg-gray-50 p-3 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-inner border-none">
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Section</label>
          <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
            className="w-full bg-gray-50 p-3 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-inner border-none">
            <option value="">All Sections</option>
            {sections.map((sec, i) => (
              <option key={i} value={sec.section ?? sec}>{sec.section ?? sec}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Source Type</label>
          <select value={evalType} onChange={e => setEvalType(e.target.value)}
            className={`w-full p-3 rounded-xl font-bold text-xs outline-none appearance-none shadow-inner border-none transition-all ${isConfidential ? 'bg-red-50 text-red-700' : 'bg-gray-50'}`}>
            <option value="student">Student Feedback</option>
            <option value="peer">Peer Review</option>
            <option value="confidential">🔒 Confidential Evaluation</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Issue Tracking</label>
          <select value={isCritical} onChange={e => setIsCritical(e.target.value)}
            className={`w-full p-3 rounded-xl font-bold text-xs outline-none appearance-none shadow-inner border-none ${isCritical === 'critical' ? 'bg-red-50 text-red-600' : 'bg-gray-50'}`}>
            <option value="all">All Questions</option>
            <option value="critical">Critical Issues Only</option>
          </select>
        </div>
      </div>

      {isConfidential && (
        <div className="bg-red-50 border border-red-100 rounded-[2rem] p-5 mb-8 flex items-center gap-4">
          <ShieldAlert className="text-red-500 shrink-0" size={24} />
          <div>
            <p className="text-xs font-black text-red-700 uppercase tracking-widest">Confidential Data — Local Storage</p>
            <p className="text-[10px] text-red-400 font-bold mt-0.5">Yeh data sirf is device par Dexie DB mein saved hai.</p>
          </div>
        </div>
      )}

      {/* ✅ INITIAL SKELETON */}
      {initialLoading ? (
        <div className="space-y-6">
          {/* chart skeleton */}
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 animate-pulse">
            <div className="h-[350px] flex items-end gap-3 px-4">
              {[60,80,45,90,55,70,40,85].map((h,i) => (
                <div key={i} className="flex-1 bg-gray-100 rounded-t-2xl" style={{height:`${h}%`}} />
              ))}
            </div>
          </div>
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>

      ) : questions.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] text-center shadow-sm border border-dashed border-gray-200">
          <ShieldAlert className="mx-auto text-gray-300 mb-6" size={60} />
          <h3 className="text-2xl font-black text-gray-400 uppercase italic tracking-tighter">
            {isConfidential ? 'Koi Confidential Data Nahi Mila' : 'No Data Found'}
          </h3>
          <p className="text-gray-300 mt-2 font-bold text-sm">
            {isConfidential
              ? 'Is course / section ke liye koi confidential evaluation submit nahi hui is device par.'
              : 'No questions available for selected filters.'}
          </p>
        </div>

      ) : (
        // ✅ reloading par dimmed, data raha hai screen par
        <div className={`space-y-8 transition-opacity duration-200 ${reloading ? 'opacity-40' : 'opacity-100'}`}>

          {/* CHART */}
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            {isConfidential && (
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Confidential Evaluation Chart</span>
              </div>
            )}
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} onClick={e => e?.activePayload && handleBarClick(e.activePayload[0].payload)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false}
                    tick={{ fill:'#64748b', fontSize:10, fontWeight:900 }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis domain={[0,4]} axisLine={false} tickLine={false}
                    tick={{ fill:'#94a3b8', fontSize:10 }} ticks={[0,1,2,3,4]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="AvgRounded" radius={[10,10,0,0]} barSize={45} cursor="pointer"
                    label={{ position:'top', formatter: (v) => v, fontSize:10, fontWeight:900, fill:'#475569' }}>
                    {chartData.map((entry, index) => <Cell key={index} fill={getBarColor(entry.AvgRounded)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* ✅ Response count legend below chart */}
            <div className="flex gap-2 flex-wrap mt-4 justify-center">
              {chartData.map((q, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  <span className="text-[9px] font-black text-slate-500">{q.label}</span>
                  <span className="text-[9px] font-black text-blue-600">{q.TotalResponses} resp</span>
                </div>
              ))}
            </div>
          </div>

          {/* QUESTION CARDS */}
          <div className="grid grid-cols-1 gap-6">
            {questions.map((q, i) => (
              <div key={i} className={`bg-white p-8 rounded-[2.5rem] border shadow-sm hover:shadow-md transition-all ${
                isConfidential ? 'border-red-100 hover:border-red-200' : 'border-gray-100'}`}>
                <div className="flex justify-between items-start gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[9px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-widest">Q{i+1}</span>
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                        q.Type==='Student' ? 'bg-blue-50 text-blue-600' :
                        q.Type==='Confidential' ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600'}`}>
                        {q.Type==='Confidential' ? '🔒 Confidential' : q.Type}
                      </span>
                      {q.isCritical && (
                        <span className="flex items-center gap-1 text-[9px] font-black bg-red-600 text-white px-3 py-1 rounded-full uppercase">
                          <AlertTriangle size={10}/> Critical
                        </span>
                      )}
                      {/* ✅ total responses badge on card */}
                      <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                        {q.TotalResponses} responses
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 leading-tight">{q.QuestionText}</h3>

                    {/* ✅ Score bars (not just boxes) with count */}
                    <div className="space-y-3 bg-slate-50/60 p-6 rounded-[2rem] border border-slate-100">
                      {[4,3,2,1].map(n => {
                        const count = q[`Score${n}`]||0;
                        const pct = q.TotalResponses > 0 ? (count/q.TotalResponses)*100 : 0;
                        const barColor = {4:'bg-green-500',3:'bg-blue-500',2:'bg-yellow-500',1:'bg-red-500'}[n];
                        const starColor = {4:'text-green-500 fill-green-500',3:'text-blue-500 fill-blue-500',2:'text-yellow-500 fill-yellow-500',1:'text-red-500 fill-red-500'}[n];
                        return (
                          <div key={n} className="flex items-center gap-4">
                            <div className="w-16 flex items-center justify-end gap-0.5">
                              {[...Array(n)].map((_,si) => <Star key={si} size={10} className={starColor}/>)}
                            </div>
                            <div className="flex-1 h-2 bg-white rounded-full overflow-hidden shadow-inner border border-gray-100">
                              <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{width:`${pct}%`}}/>
                            </div>
                            <div className="w-20 text-right">
                              <span className="text-xs font-black text-slate-800">{Math.round(pct)}%</span>
                              <span className="text-[9px] font-bold text-slate-400 ml-1">({count})</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button onClick={() => handleBarClick(q)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:text-white transition-all mt-2 shadow-sm ${
                        isConfidential ? 'bg-red-50 text-red-700 hover:bg-red-600' : 'bg-blue-50 text-blue-700 hover:bg-blue-600'}`}>
                      <Users size={14}/>
                      {isConfidential ? 'Respondent Breakdown' : 'Participant Breakdown'}
                    </button>
                  </div>

                  {/* Avg score box */}
                  <div className="flex flex-col items-center gap-3 min-w-[120px]">
                    <div className={`px-5 py-4 rounded-3xl flex flex-col items-center border shadow-inner w-full ${
                      isConfidential ? 'bg-red-50 border-red-100' : 'bg-slate-900 border-slate-800'}`}>
                      <span className={`text-4xl font-black italic tracking-tighter ${isConfidential ? 'text-red-700' : 'text-white'}`}>
                        {(q.AverageScore||0).toFixed(2)}
                      </span>
                      <div className="flex gap-1 mt-1">
                        {[1,2,3,4].map(star => (
                          <Star key={star} size={11} className={star<=Math.round(q.AverageScore) ? 'fill-yellow-400 text-yellow-400' : isConfidential ? 'text-red-200' : 'text-slate-600'}/>
                        ))}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${isConfidential ? 'text-red-400' : 'text-slate-400'}`}>Avg Rating</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{q.TotalResponses} resp.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL */}
      {modalOpen && modalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className={`p-10 border-b flex justify-between items-start ${isConfidential ? 'bg-red-50/50 border-red-50' : 'bg-gray-50/50 border-gray-50'}`}>
              <div>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isConfidential ? 'text-red-600' : 'text-blue-600'}`}>
                  {isConfidential ? '🔒 Confidential Respondents' : 'Evaluator Metrics'}
                </p>
                <h4 className="text-lg font-bold text-slate-800 leading-tight">{modalData.QuestionText}</h4>
                <p className="text-[10px] font-bold text-slate-400 mt-1">{modalData.TotalResponses} total responses</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-3 bg-white rounded-full shadow-sm hover:text-red-500 transition-colors">
                <X size={20}/>
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-3">
              {!(modalData.Evaluators?.length) ? (
                <p className="text-center text-gray-400 font-bold text-sm py-10">Koi evaluator data nahi mila.</p>
              ) : modalData.Evaluators.map((ev, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50/50 border border-gray-100 p-5 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      modalData.Type==='Student' ? 'bg-blue-100 text-blue-600' :
                      modalData.Type==='Confidential' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                      {modalData.Type==='Confidential' ? <ShieldAlert size={18}/> :
                       modalData.Type==='Student' ? <User size={18}/> : <Users size={18}/>}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{ev.Name||'Anonymous'}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase">ID: {ev.ID||'N/A'}</p>
                    </div>
                  </div>
                  <div className={`text-sm font-black px-5 py-2 rounded-xl border-2 ${
                    ev.GivenScore>=3 ? 'border-green-100 bg-green-50 text-green-700' :
                    ev.GivenScore===2 ? 'border-orange-100 bg-orange-50 text-orange-600' : 'border-red-100 bg-red-50 text-red-600'}`}>
                    {ev.GivenScore} / 4
                  </div>
                </div>
              ))}
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