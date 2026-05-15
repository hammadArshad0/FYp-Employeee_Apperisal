import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Loader2, Star, X, AlertTriangle, Users, User } from 'lucide-react';
import DataService from '../../../services/axios';
import db from "../../../db";

function TeacherQuestionsRatingSee() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { courseCode, teacherName, sessionId: stateSession } = location.state || {};

    const [sessions, setSessions] = useState([]);
    const [sections, setSections] = useState([]);         // ✅ sections list
    const [loading, setLoading] = useState(false);
    const [questionsData, setQuestionsData] = useState([]);
    const [selectedModal, setSelectedModal] = useState(null);
    const [filters, setFilters] = useState({
        session: stateSession || '',
        evalType: 'student',          // removed 'all' / Combined Sources
        isCritical: 'all',
        course: courseCode || '',
        section: ''                   // ✅ new section filter
    });

    // ── Fetch sessions ────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await DataService.get('/AcademicPerformance/GetSessions');
                setSessions(res.data || []);
                if (!stateSession && res.data?.length > 0) {
                    setFilters(p => ({ ...p, session: res.data[0].id }));
                }
            } catch (err) { console.error("Session Error", err); }
        };
        fetchSessions();
    }, [stateSession]);

    // ── Fetch sections whenever session or course changes ────────────────────
    useEffect(() => {
        if (!filters.session) return;
        const fetchSections = async () => {
            try {
                const res = await DataService.get('/AcademicPerformance/GetSections', {
                    params: {
                        teacherId: id,
                        sessionId: filters.session,
                        courseCode: filters.course || undefined
                    }
                });
                setSections(res.data || []);
                // reset section when list changes
                setFilters(p => ({ ...p, section: '' }));
            } catch (err) { console.error("Sections Error", err); }
        };
        fetchSections();
    }, [id, filters.session, filters.course]);

    // ── Fetch question stats ─────────────────────────────────────────────────
    const fetchDetails = useCallback(async () => {
        if (!filters.session) return;
        setLoading(true);
        try {
            let allCombined = [];

            // Student or Peer → API
            if (filters.evalType === 'student' || filters.evalType === 'peer') {
                const res = await DataService.get('/AcademicPerformance/GetTeacherQuestionStatsFull', {
                    params: {
                        teacherId: id,
                        sessionId: filters.session,
                        evaluationType: filters.evalType,
                        onlyCritical: filters.isCritical === 'critical',
                        courseCode: filters.course || undefined,
                        section: filters.section || undefined   // ✅ pass section
                    }
                });
                if (res.data) allCombined = [...res.data];
            }

            // Confidential → Dexie
            if (filters.evalType === 'confidential') {
                const local = await db.evaluations.toArray();

                let confFiltered = local.filter(e =>
                    String(e.teacherId) === String(id) &&
                    String(e.sessionId) === String(filters.session)
                );

                if (filters.isCritical === 'critical') {
                    confFiltered = confFiltered.filter(e => e.isCritical === true || e.isCritical === 1);
                }
                if (filters.course) {
                    confFiltered = confFiltered.filter(e => String(e.courseCode) === String(filters.course));
                }
                // ✅ section filter on Dexie data
                if (filters.section) {
                    confFiltered = confFiltered.filter(e => String(e.section) === String(filters.section));
                }

                const grouped = confFiltered.reduce((acc, curr) => {
                    const qText = curr.questionText || `Question ${curr.questionId}`;
                    if (!acc[qText]) {
                        acc[qText] = {
                            QuestionText: qText,
                            TotalScore: 0,
                            TotalResponses: 0,
                            Type: 'Confidential',
                            isCritical: curr.isCritical === true || curr.isCritical === 1,
                            Score1: 0, Score2: 0, Score3: 0, Score4: 0,
                            Evaluators: []
                        };
                    }
                    const s = Number(curr.score);
                    if (s > 0) {
                        acc[qText].TotalScore += s;
                        acc[qText].TotalResponses += 1;
                        acc[qText][`Score${s}`] += 1;
                        acc[qText].Evaluators.push({
                            Name: curr.studentName || 'Unknown',
                            ID: curr.studentId || '-',
                            GivenScore: s
                        });
                    }
                    return acc;
                }, {});

                allCombined = Object.values(grouped).map(q => ({
                    ...q,
                    AverageScore: q.TotalResponses > 0 ? q.TotalScore / q.TotalResponses : 0
                }));
            }

            setQuestionsData(allCombined.sort((a, b) => b.AverageScore - a.AverageScore));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [id, filters]);

    useEffect(() => { fetchDetails(); }, [fetchDetails]);

    return (
        <div className="p-8 bg-gray-50 min-h-screen space-y-6 font-sans">

            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 font-black text-gray-500 uppercase text-[10px] bg-white p-3 rounded-2xl shadow-sm hover:bg-slate-900 hover:text-white transition-all"
                >
                    <ChevronLeft size={16} /> Back
                </button>
                <div className="text-right">
                    <h2 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">
                        {teacherName || 'Instructor Performance'}
                    </h2>
                    <p className="text-[10px] font-black text-blue-600 tracking-widest uppercase">
                        Course: {filters.course || 'All'}
                    </p>
                </div>
            </div>

            {/* Filters — 4 columns */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Session */}
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Active Session</label>
                    <select
                        value={filters.session}
                        onChange={e => setFilters(p => ({ ...p, session: e.target.value }))}
                        className="w-full bg-gray-50 p-3 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-inner border-none"
                    >
                        {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                {/* Section ✅ */}
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Section</label>
                    <select
                        value={filters.section}
                        onChange={e => setFilters(p => ({ ...p, section: e.target.value }))}
                        className="w-full bg-gray-50 p-3 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-inner border-none"
                    >
                        <option value="">All Sections</option>
                        {sections.map((sec, i) => (
                            <option key={i} value={sec.section ?? sec}>{sec.section ?? sec}</option>
                        ))}
                    </select>
                </div>

                {/* Source Type */}
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Source Type</label>
                    <select
                        value={filters.evalType}
                        onChange={e => setFilters(p => ({ ...p, evalType: e.target.value }))}
                        className="w-full bg-gray-50 p-3 rounded-xl font-bold text-xs outline-none shadow-inner border-none"
                    >
                        <option value="student">Student Feedback</option>
                        <option value="peer">Peer Review</option>
                        <option value="confidential">Confidential</option>
                    </select>
                </div>

                {/* Issue Tracking */}
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Issue Tracking</label>
                    <select
                        value={filters.isCritical}
                        onChange={e => setFilters(p => ({ ...p, isCritical: e.target.value }))}
                        className={`w-full p-3 rounded-xl font-bold text-xs outline-none shadow-inner border-none ${filters.isCritical === 'critical' ? 'bg-red-50 text-red-600' : 'bg-gray-50'}`}
                    >
                        <option value="all">All Questions</option>
                        <option value="critical">Critical Issues Only</option>
                    </select>
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
                {loading
                    ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
                    : questionsData.length === 0
                        ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                <Users size={48} className="mb-4" />
                                <p className="font-black uppercase tracking-widest text-sm">No data found</p>
                            </div>
                        )
                        : questionsData.map((q, idx) => (
                            <div key={idx} className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm hover:shadow-xl transition-all">
                                <div className="flex flex-col lg:flex-row gap-10">
                                    <div className="flex-1 space-y-6">

                                        {/* Badges */}
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-[9px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-widest">
                                                {q.Type}
                                            </span>
                                            {q.isCritical && (
                                                <span className="flex items-center gap-1 text-[9px] font-black bg-red-600 text-white px-3 py-1 rounded-full uppercase">
                                                    <AlertTriangle size={10} /> Critical
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-2xl font-black text-slate-800 leading-tight">{q.QuestionText}</h3>

                                        {/* Score Distribution Bars */}
                                        <div className="space-y-4 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                                            {[4, 3, 2, 1].map(scoreLevel => {
                                                const count = q[`Score${scoreLevel}`] || 0;
                                                const percentage = q.TotalResponses > 0 ? (count / q.TotalResponses) * 100 : 0;
                                                const barColors = { 4: 'bg-green-500', 3: 'bg-blue-500', 2: 'bg-yellow-500', 1: 'bg-red-500' };
                                                const starColors = { 4: 'text-green-500 fill-green-500', 3: 'text-blue-500 fill-blue-500', 2: 'text-yellow-500 fill-yellow-500', 1: 'text-red-500 fill-red-500' };
                                                return (
                                                    <div key={scoreLevel} className="flex items-center gap-6">
                                                        <div className="w-24 flex items-center justify-end gap-0.5">
                                                            {[...Array(scoreLevel)].map((_, i) => (
                                                                <Star key={i} size={12} className={starColors[scoreLevel]} />
                                                            ))}
                                                        </div>
                                                        <div className="flex-1 h-2.5 bg-white rounded-full overflow-hidden shadow-inner border border-gray-100">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ${barColors[scoreLevel]}`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                        <div className="w-24 text-right">
                                                            <span className="text-xs font-black text-slate-900">{Math.round(percentage)}%</span>
                                                            <span className="text-[10px] font-bold text-slate-400 ml-1.5">({count})</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => setSelectedModal({ title: q.QuestionText, list: q.Evaluators || [], type: q.Type })}
                                            className="flex items-center gap-2 bg-blue-50 text-blue-700 px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        >
                                            <Users size={14} /> Breakdown Details
                                        </button>
                                    </div>

                                    {/* Average Score Box */}
                                    <div className="lg:w-48 flex flex-col justify-center items-center border-l border-gray-50 lg:pl-10">
                                        <div className="bg-slate-900 text-white p-8 rounded-[3rem] text-center w-full shadow-2xl shadow-slate-300 transform -rotate-2">
                                            <div className="text-5xl font-black italic tracking-tighter">
                                                {(q.AverageScore || 0).toFixed(2)}
                                            </div>
                                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Avg Rating</div>
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-300 mt-6 uppercase tracking-widest italic">
                                            {q.TotalResponses} Responses
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                }
            </div>

            {/* Evaluator Breakdown Modal */}
            {selectedModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-xl rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                        <div className="p-10 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
                            <div>
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">
                                    {selectedModal.type} Breakdown
                                </p>
                                <h4 className="text-xl font-bold text-slate-800 leading-tight">{selectedModal.title}</h4>
                            </div>
                            <button
                                onClick={() => setSelectedModal(null)}
                                className="p-3 bg-white rounded-full shadow-sm hover:text-red-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto space-y-3">
                            {selectedModal.list.length === 0
                                ? <p className="text-center text-slate-300 font-bold text-sm py-10">No evaluators found</p>
                                : selectedModal.list.map((ev, i) => (
                                    <div key={i} className="flex items-center justify-between bg-gray-50/50 border border-gray-100 p-6 rounded-[2.5rem]">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white rounded-2xl shadow-sm">
                                                <User size={20} className="text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{ev.Name || 'Anonymous'}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">ID: {ev.ID}</p>
                                            </div>
                                        </div>
                                        <div className={`text-lg font-black px-6 py-2 rounded-2xl border-2 shadow-sm ${ev.GivenScore >= 3 ? 'border-green-100 bg-green-50 text-green-700' : 'border-red-100 bg-red-50 text-red-600'}`}>
                                            {ev.GivenScore} / 4
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TeacherQuestionsRatingSee;