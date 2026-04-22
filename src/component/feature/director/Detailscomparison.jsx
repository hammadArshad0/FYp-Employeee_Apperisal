import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, BarChart3, ShieldCheck, Search, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DataService from '../../../services/axios';
import db from "../../../db"; 

const ComparisonPage = () => {
    const navigate = useNavigate();

    // API Data States
    const [sessions, setSessions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]); // Filtered list for Course Mode
    const [allTeachers, setAllTeachers] = useState([]); // For Session Mode

    // Selection States
    const [mode, setMode] = useState("course"); 
    const [selectedCourse, setSelectedCourse] = useState("");
    const [teacherA, setTeacherA] = useState("");
    const [teacherB, setTeacherB] = useState("");
    const [session1, setSession1] = useState("");
    const [session2, setSession2] = useState("");

    // Status States
    const [loading, setLoading] = useState(false);
    const [fetchingFilters, setFetchingFilters] = useState(true);
    const [comparisonData, setComparisonData] = useState(null);

    // ✅ 1. Initial Load: Sessions & All Teachers
    useEffect(() => {
        const initLoad = async () => {
            try {
                setFetchingFilters(true);
                const [sessRes, teachRes] = await Promise.all([
                    DataService.get('/DetailsPerformanceComparison/GetSessions'),
                    DataService.get('/DetailsPerformanceComparison/GetAllTeachers') // API update ki
                ]);
                setSessions(sessRes.data || []);
                setAllTeachers(teachRes.data || []);
            } catch (err) {
                console.error("Initial Load Error:", err);
            } finally {
                setFetchingFilters(false);
            }
        };
        initLoad();
    }, []);

    // ✅ Reset data when switching modes
    useEffect(() => {
        setComparisonData(null);
        setTeacherA(""); setTeacherB(""); setSession1(""); setSession2(""); setSelectedCourse("");
        setCourses([]); setTeachers([]);
    }, [mode]);

    // ✅ 2. Fetch Courses (For Course Mode)
    const handleSessionSelect = async (sId) => {
        setSession1(sId);
        if (mode === "course" && sId) {
            try {
                const res = await DataService.get(`/DetailsPerformanceComparison/GetCoursesBySession?sessionId=${sId}`);
                setCourses(res.data || []);
            } catch (err) { console.error("Course Load Error:", err); }
        }
    };

    // ✅ 3. Fetch Teachers (For Course Mode)
    const handleCourseSelect = async (cCode) => {
        setSelectedCourse(cCode);
        if (cCode) {
            try {
                const res = await DataService.get(`/DetailsPerformanceComparison/GetTeachersByCourse?courseCode=${cCode}`);
                setTeachers(res.data || []);
            } catch (err) { console.error("Teacher Load Error:", err); }
        }
    };

    // ✅ 4. Dexie Logic
    const getConfidentialScore = async (tId, sId) => {
        if (!tId || !sId) return 0;
        try {
            const localRecords = await db.evaluations.toArray();
            const filtered = localRecords.filter(r => 
                String(r.teacherId) === String(tId) && String(r.sessionId) === String(sId)
            );
            if (filtered.length === 0) return 0;
            const total = filtered.reduce((sum, r) => sum + Number(r.score || 0), 0);
            return (total / (filtered.length * 4)) * 10;
        } catch (err) { return 0; }
    };

    // ✅ 5. Handle Comparison
    const handleCompare = async () => {
        // Validation
        if (mode === "course" && (!teacherA || !teacherB || !selectedCourse)) return alert("Please select both teachers and a course.");
        if (mode === "session" && (!teacherA || !session1 || !session2)) return alert("Please select teacher and both sessions.");

        try {
            setLoading(true);
            const payload = {
                mode: mode,
                courseCode: selectedCourse,
                teacherA: teacherA,
                teacherB: mode === "course" ? teacherB : teacherA,
                session1: parseInt(session1),
                session2: mode === "course" ? parseInt(session1) : parseInt(session2)
            };

            const res = await DataService.post('/DetailsPerformanceComparison/CompareTeachers', payload);
            let finalResults = res.data;

            // Merge Dexie Data
            const score1 = await getConfidentialScore(payload.teacherA, payload.session1);
            const score2 = await getConfidentialScore(payload.teacherB, payload.session2);

            finalResults[0].ConfidentialScore = score1;
            finalResults[1].ConfidentialScore = score2;

            setComparisonData(finalResults);
        } catch (err) {
            alert("Record not found for this selection.");
        } finally {
            setLoading(false);
        }
    };

    const graphData = comparisonData ? [
        { name: "Peer", T1: comparisonData[0].PeerAverageOutOfTen, T2: comparisonData[1].PeerAverageOutOfTen },
        { name: "Student", T1: comparisonData[0].StudentAverageOutOfTen, T2: comparisonData[1].StudentAverageOutOfTen },
        { name: "Confidential", T1: comparisonData[0].ConfidentialScore, T2: comparisonData[1].ConfidentialScore },
    ] : [];

    if (fetchingFilters) return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-green-700 mb-4" size={50} />
            <p className="font-black text-[10px] text-gray-400 uppercase tracking-widest">Initialising Audit Modules...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* HEADER */}
            <div className="bg-white border-b-2 border-green-700 shadow-sm sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <button onClick={() => navigate(-1)} className="flex items-center text-slate-900 font-black px-4 py-2 rounded-xl text-xs hover:bg-gray-100 transition-all">
                        <ArrowLeft size={16} className="mr-2" /> BACK
                    </button>
                    <div className="flex bg-gray-100 p-1 rounded-2xl">
                        <button onClick={() => setMode("course")} className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${mode === "course" ? 'bg-green-700 text-white shadow-md' : 'text-gray-400'}`}>Course Mode</button>
                        <button onClick={() => setMode("session")} className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${mode === "session" ? 'bg-green-700 text-white shadow-md' : 'text-gray-400'}`}>Session Mode</button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-10">
                {/* FILTER CARD */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                    {mode === "course" ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Academic Session</label>
                                <select value={session1} onChange={(e) => handleSessionSelect(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-green-600 outline-none">
                                    <option value="">Select Session</option>
                                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Choose Course</label>
                                <select value={selectedCourse} onChange={(e) => handleCourseSelect(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-green-600 outline-none">
                                    <option value="">Select Course</option>
                                    {courses.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Teachers</label>
                                <div className="flex gap-2">
                                    <select value={teacherA} onChange={(e) => setTeacherA(e.target.value)} className="w-1/2 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-[10px]">
                                        <option value="">Teacher A</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <select value={teacherB} onChange={(e) => setTeacherB(e.target.value)} className="w-1/2 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-[10px]">
                                        <option value="">Teacher B</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Teacher</label>
                                <select value={teacherA} onChange={(e) => setTeacherA(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-green-600 outline-none">
                                    <option value="">Select Teacher</option>
                                    {allTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Session 1</label>
                                <select value={session1} onChange={(e) => setSession1(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-green-600 outline-none">
                                    <option value="">Select Session</option>
                                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Session 2</label>
                                <select value={session2} onChange={(e) => setSession2(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-green-600 outline-none">
                                    <option value="">Select Session</option>
                                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                    <button 
                        onClick={handleCompare}
                        disabled={loading || !teacherA}
                        className="md:col-span-3 py-5 bg-green-900 text-white rounded-3xl font-black uppercase tracking-[0.3em] hover:bg-green-700 transition-all flex items-center justify-center gap-3 disabled:opacity-30 active:scale-95 shadow-2xl"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                        {loading ? 'Analyzing...' : 'Generate Comparison'}
                    </button>
                </div>

                {/* VISUALIZATION */}
                {comparisonData ? (
                    <div className="mt-12 space-y-10 animate-in zoom-in-95 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-10 rounded-[3rem] shadow-xl h-[450px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={graphData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                                        <YAxis domain={[0, 10]} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)'}} />
                                        <Legend verticalAlign="top" align="right" iconType="circle" />
                                        <Bar dataKey="T1" name={comparisonData[0].Name || "Base"} fill="#16a34a" radius={[10, 10, 0, 0]} barSize={40} />
                                        <Bar dataKey="T2" name={comparisonData[1].Name || "Target"} fill="#2563eb" radius={[10, 10, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="space-y-6">
                                {comparisonData.map((item, i) => (
                                    <div key={i} className={`p-8 rounded-[3rem] bg-white shadow-xl border-l-[12px] ${i === 0 ? 'border-green-600' : 'border-blue-600'}`}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{mode === 'course' ? `Candidate ${i+1}` : `Timeline ${i+1}`}</p>
                                                <h4 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{item.Name || "Unknown"}</h4>
                                            </div>
                                            <div className="text-right">
                                                <h2 className="text-4xl font-black text-slate-900 leading-none">{item.OverallAverageOutOfHundred}%</h2>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase">Efficiency</p>
                                            </div>
                                        </div>
                                        <div className="mt-8 grid grid-cols-3 gap-4">
                                            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Peers</p>
                                                <p className="text-xl font-black text-green-600">{item.PeerAverageOutOfTen}/10</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Students</p>
                                                <p className="text-xl font-black text-blue-600">{item.StudentAverageOutOfTen}/10</p>
                                            </div>
                                            <div className="bg-white-900 p-4 rounded-3xl shadow-lg">
                                                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Confidential</p>
                                                <p className="text-xl font-black text-black-600">{item.ConfidentialScore.toFixed(1)}/10</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-20 flex flex-col items-center justify-center text-slate-300">
                        <AlertCircle size={60} strokeWidth={1} className="mb-4" />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">Select filters and generate audit report</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComparisonPage;