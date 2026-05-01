import React, { useEffect, useState } from 'react';
import DataService from '../../../services/axios';
import { ShieldCheck, UserCheck, ChevronLeft, Loader2, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';

const HODChairpersonEval = () => {
    const [chairpersons, setChairpersons] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedCP, setSelectedCP] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState("");

    const rawHodId = localStorage.getItem('userId') || "";
    const hodId = rawHodId.trim();

    const ratingLabels = { 1: "Poor", 2: "Average", 3: "Good", 4: "Excellent" };

    // Common function to fetch chairpersons
    const fetchChairpersons = async (sessionId) => {
        try {
            const cpRes = await DataService.get(`/SocietyEvaluation/GetChairpersons/${sessionId}`);
            // Backend se aane wali list mein 'isEvaluated' ka field hona chahiye
            setChairpersons(cpRes.data || []);
        } catch (err) {
            console.error("Error fetching chairpersons:", err);
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const sessionsListRes = await DataService.get('/Session/list');
                setSessions(sessionsListRes.data || []);

                const activeRes = await DataService.get('/Session/GetActiveSession');
                const activeId = activeRes.data.SessionID;
                setSelectedSessionId(activeId);

                await fetchChairpersons(activeId);

                const quesRes = await DataService.get('/SocietyEvaluation/GetActiveQuestionnaire/SEC');
                setQuestions(quesRes.data.Questions || []);
            } catch (err) {
                console.error("Error fetching initial data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleSessionChange = async (sessionId) => {
        setSelectedSessionId(sessionId);
        await fetchChairpersons(sessionId);
        setSelectedCP(null); 
        setAnswers({});
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            alert("Incomplete Audit: Please provide a rating for all performance indicators.");
            return;
        }

        setSubmitting(true);

        const payload = questions.map(q => ({
            EvaluatorId: hodId.toString().trim(), 
            EvaluateeId: selectedCP.TeacherId.toString().trim(),
            SocietyId: parseInt(selectedCP.SocietyId),
            QuestionId: parseInt(q.QuestionID),
            Score: parseInt(answers[q.QuestionID]),
            EvaluationType: "SEC",
            SessionId: parseInt(selectedSessionId)
        }));

        try {
            const response = await DataService.post('/SocietyEvaluation/Submit', payload);
            
            if (response.data.success) {
                // UPDATE LOCAL STATE FOR IMMEDIATE DISABLE
                const updatedList = chairpersons.map(cp => {
                    if (cp.TeacherId === selectedCP.TeacherId && cp.SocietyId === selectedCP.SocietyId) {
                        return { ...cp, isEvaluated: true };
                    }
                    return cp;
                });
                setChairpersons(updatedList);

                alert("Success: Chairperson Audit Logged Successfully!");
                setSelectedCP(null);
                setAnswers({});
            } else {
                alert(`Error: ${response.data.error}`);
            }
        } catch (err) {
            console.error("Submission Error:", err);
            alert("Network Error: Could not connect to the server.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
            <Loader2 className="animate-spin text-green-700 mb-4" size={40} />
            <p className="font-black text-green-700 uppercase text-xs tracking-widest italic text-center">
                Syncing Audit Records...<br/>
                <span className="text-[10px] opacity-50 not-italic">Verifying Security Protocols</span>
            </p>
        </div>
    );

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto min-h-screen font-sans">
            {/* Header Section */}
            <div className="bg-green-700 text-white p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                <div className="relative z-10 text-center md:text-left">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Chairperson Evaluation</h1>
                    <p className="text-green-200 text-[10px] uppercase tracking-[0.3em] mt-2 font-bold">HOD Administrative Portal</p>
                    
                    <div className="mt-6 flex items-center gap-3 bg-green-800/50 p-3 rounded-2xl border border-green-600/50 w-fit mx-auto md:mx-0">
                        <Calendar size={18} className="text-green-300" />
                        <select 
                            value={selectedSessionId}
                            onChange={(e) => handleSessionChange(e.target.value)}
                            className="bg-transparent border-none text-green-100 font-bold uppercase text-[12px] focus:ring-0 cursor-pointer"
                        >
                            {sessions.map(s => (
                                <option key={s.id} value={s.id} className="text-black">{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <ShieldCheck size={100} className="opacity-10 absolute -right-4 -bottom-4 md:static md:opacity-20" />
            </div>

            {!selectedCP ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {chairpersons.length > 0 ? (
                        chairpersons.map(cp => (
                            <div key={`${cp.TeacherId}-${cp.SocietyId}`} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden transition-all group">
                                {cp.isEvaluated && (
                                    <div className="absolute top-6 right-6 text-green-600 bg-green-50 p-2 rounded-full shadow-inner z-10">
                                        <CheckCircle2 size={20} />
                                    </div>
                                )}
                                
                                <div className={`flex flex-col items-center text-center space-y-5 ${cp.isEvaluated ? 'opacity-60' : ''}`}>
                                    <div className={`p-5 rounded-full transition-all shadow-inner ${cp.isEvaluated ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-700 group-hover:bg-green-700 group-hover:text-white'}`}>
                                        <UserCheck size={36} />
                                    </div>
                                    <div>
                                        <h3 className={`font-black text-xl uppercase tracking-tight ${cp.isEvaluated ? 'text-gray-400' : 'text-gray-800'}`}>{cp.TeacherName}</h3>
                                        <p className={`font-bold text-[11px] tracking-widest uppercase mt-1 ${cp.isEvaluated ? 'text-gray-400' : 'text-green-600'}`}>{cp.SocietyName}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedCP(cp)}
                                        disabled={cp.isEvaluated}
                                        className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
                                            cp.isEvaluated 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                                            : 'bg-gray-900 text-white hover:bg-green-700 active:scale-95 shadow-lg'
                                        }`}
                                    >
                                        {cp.isEvaluated ? "Evaluated" : "Evaluate Performance"}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[4rem] border-2 border-dashed border-gray-100 text-gray-400">
                            <AlertCircle size={48} className="mb-4 opacity-10" />
                            <p className="font-black uppercase italic tracking-widest text-sm">No Active Chairperson Records Found</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6 pb-20">
                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-green-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <button
                                onClick={() => { setSelectedCP(null); setAnswers({}); }}
                                className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase hover:text-black transition-colors mb-4"
                            >
                                <ChevronLeft size={16} /> Back to Roster
                            </button>
                            <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Chairperson: {selectedCP.TeacherName}</h2>
                            <div className="flex gap-2 mt-3">
                                <span className="bg-green-700 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{selectedCP.SocietyName}</span>
                                <span className="bg-gray-100 text-gray-500 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">UID: {selectedCP.TeacherId}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-50 space-y-12">
                        {questions.map((q, idx) => (
                            <div key={q.QuestionID} className="group">
                                <div className="flex gap-6 items-start">
                                    <span className="bg-green-700 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black flex-shrink-0 shadow-lg group-hover:bg-black transition-colors">
                                        {idx + 1}
                                    </span>
                                    <div className="space-y-6 flex-1">
                                        <p className="font-black text-gray-700 uppercase text-sm tracking-tight pt-2 leading-relaxed">{q.QuestionText}</p>
                                        <div className="flex flex-wrap gap-4">
                                            {[1, 2, 3, 4].map(num => (
                                                <button
                                                    key={num}
                                                    onClick={() => setAnswers({ ...answers, [q.QuestionID]: num })}
                                                    className={`px-8 py-4 rounded-2xl font-black transition-all border-2 text-[10px] uppercase tracking-[0.2em] ${answers[q.QuestionID] === num
                                                        ? 'bg-green-700 border-green-700 text-white shadow-xl scale-105'
                                                        : 'bg-white border-gray-100 text-gray-400 hover:border-green-200 hover:text-green-600'
                                                    }`}
                                                >
                                                    {ratingLabels[num]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        <div className="pt-10">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className={`w-full py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.5em] shadow-2xl transition-all flex items-center justify-center gap-4 ${submitting ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-green-700 text-white hover:bg-black hover:-translate-y-1'}`}
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                {submitting ? "Securing Audit..." : "Finalize Evaluation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HODChairpersonEval;