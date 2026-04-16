import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, BarChart3, Users, BookOpen, Calendar, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DataService from '../../../services/axios'; // Aapka axios instance

const ComparisonPage = () => {
    const navigate = useNavigate();

    // API Data States
    const [sessions, setSessions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]);

    // Selection States
    const [mode, setMode] = useState("course"); // 'course' or 'session'
    const [selectedCourse, setSelectedCourse] = useState("");
    const [teacherA, setTeacherA] = useState("");
    const [teacherB, setTeacherB] = useState("");
    const [session1, setSession1] = useState("");
    const [session2, setSession2] = useState("");

    // Status States
    const [loading, setLoading] = useState(false);
    const [fetchingFilters, setFetchingFilters] = useState(true);
    const [comparisonData, setComparisonData] = useState(null);

    // ✅ 1. Initial Load: Sessions
    useEffect(() => {
        const initLoad = async () => {
            try {
                setFetchingFilters(true);
                const res = await DataService.get('/DetailsPerformanceComparison/GetSessions');
                setSessions(res.data);
            } catch (err) {
                console.error("Session Load Error:", err);
            } finally {
                setFetchingFilters(false);
            }
        };
        initLoad();
    }, []);

    // ✅ 2. Fetch Courses when Session 1 changes
    const handleSessionSelect = async (sId) => {
        setSession1(sId);
        if (mode === "course") {
            try {
                const res = await DataService.get(`/DetailsPerformanceComparison/GetCoursesBySession?sessionId=${sId}`);
                setCourses(res.data);
            } catch (err) {
                console.error("Course Load Error:", err);
            }
        }
    };

    // ✅ 3. Fetch Teachers when Course changes
    const handleCourseSelect = async (cCode) => {
        setSelectedCourse(cCode);
        try {
            const res = await DataService.get(`/DetailsPerformanceComparison/GetTeachersByCourse?courseCode=${cCode}`);
            setTeachers(res.data);
        } catch (err) {
            console.error("Teacher Load Error:", err);
        }
    };

    // ✅ 4. Final Comparison Call
    const handleCompare = async () => {
        try {
            setLoading(true);
            const payload = {
                mode: mode,
                courseCode: selectedCourse,
                teacherA: teacherA,
                teacherB: mode === "course" ? teacherB : teacherA,
                session1: parseInt(session1),
                session2: parseInt(session2)
            };
            const res = await DataService.post('/DetailsPerformanceComparison/CompareTeachers', payload);
            setComparisonData(res.data);
        } catch (err) {
            alert("Error fetching comparison results!");
        } finally {
            setLoading(false);
        }
    };

    const graphData = comparisonData ? [
        { name: "Peer Score", T1: comparisonData[0].PeerAverageOutOfTen, T2: comparisonData[1].PeerAverageOutOfTen },
        { name: "Student Score", T1: comparisonData[0].StudentAverageOutOfTen, T2: comparisonData[1].StudentAverageOutOfTen },
    ] : [];

    if (fetchingFilters) return (
        <div className="h-screen flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-green-600" size={50} />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* --- HEADER --- */}
            <div className="bg-white border-b-2 border-green-700 shadow-md sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <button onClick={() => navigate(-1)} className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-black px-4 py-2 rounded-xl text-sm">
                        <ArrowLeft size={20} className="mr-2" /> BACK
                    </button>
                    <h1 className="font-black text-xl uppercase italic text-green-700 tracking-tighter">Performance Comparison</h1>
                    <div className="flex gap-2">
                        <button onClick={() => {setMode("course"); setComparisonData(null);}} className={`px-4 py-2 rounded-xl font-black text-xs uppercase ${mode === "course" ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-400'}`}>Course Mode</button>
                        <button onClick={() => {setMode("session"); setComparisonData(null);}} className={`px-4 py-2 rounded-xl font-black text-xs uppercase ${mode === "session" ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-400'}`}>Session Mode</button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-10">
                {/* --- FILTERS SECTION --- */}
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {mode === "course" ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">1. Select Session</label>
                                <select onChange={(e) => handleSessionSelect(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-green-500 outline-none">
                                    <option value="">Choose Session</option>
                                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">2. Select Course</label>
                                <select onChange={(e) => handleCourseSelect(e.target.value)} disabled={!session1} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-green-500 outline-none disabled:opacity-50">
                                    <option value="">Choose Course</option>
                                    {courses.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">3. Compare Teachers</label>
                                <div className="flex gap-2">
                                    <select onChange={(e) => setTeacherA(e.target.value)} className="w-1/2 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-xs">
                                        <option value="">Teacher A</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <select onChange={(e) => setTeacherB(e.target.value)} className="w-1/2 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-xs">
                                        <option value="">Teacher B</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">1. Select Teacher</label>
                                <select onChange={(e) => setTeacherA(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none">
                                    <option value="">Choose Teacher</option>
                                    {/* Add GetAllTeachers API call or use existing list */}
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">2. Base Session</label>
                                <select onChange={(e) => setSession1(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none">
                                    <option value="">Session 1</option>
                                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">3. Comparison Session</label>
                                <select onChange={(e) => setSession2(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none">
                                    <option value="">Session 2</option>
                                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                    <button 
                        onClick={handleCompare}
                        disabled={loading || !teacherA}
                        className="md:col-span-3 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                        {loading ? 'Processing...' : 'Generate Comparison Report'}
                    </button>
                </div>

                {/* --- RESULTS SECTION --- */}
                {comparisonData && (
                    <div className="mt-12 space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Analytics Graph */}
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 h-[400px]">
                                <h3 className="font-black uppercase italic text-gray-400 text-xs mb-6 flex items-center gap-2">
                                    <BarChart3 size={16} /> Performance Visualizer
                                </h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={graphData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontWeight: 'bold', fontSize: 12}} />
                                        <YAxis domain={[0, 10]} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                        <Legend iconType="circle" />
                                        <Bar dataKey="T1" name={comparisonData[0].Name || "Target 1"} fill="#15803d" radius={[10, 10, 0, 0]} barSize={40} />
                                        <Bar dataKey="T2" name={comparisonData[1].Name || "Target 2"} fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Stats Cards */}
                            <div className="space-y-6">
                                {comparisonData.map((item, index) => (
                                    <div key={index} className={`p-8 rounded-[2.5rem] shadow-lg border-l-8 ${index === 0 ? 'bg-white border-green-600' : 'bg-white border-blue-600'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    {mode === 'course' ? `Teacher ${index + 1}` : `Session ${index + 1}`}
                                                </p>
                                                <h4 className="text-xl font-black text-gray-900 uppercase">{item.Name || 'N/A'}</h4>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-black text-gray-900 leading-none">{item.OverallAverageOutOfHundred}%</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase italic">Overall Score</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-8">
                                            <div className="bg-gray-50 p-4 rounded-2xl">
                                                <p className="text-[9px] font-black text-gray-400 uppercase">Peer Rating</p>
                                                <p className="text-lg font-black text-green-700">{item.PeerAverageOutOfTen}/10</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-2xl">
                                                <p className="text-[9px] font-black text-gray-400 uppercase">Student Rating</p>
                                                <p className="text-lg font-black text-blue-700">{item.StudentAverageOutOfTen}/10</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComparisonPage;