import React, { useEffect, useState } from 'react';
import DataService from '../../../services/axios';
import { ShieldCheck, UserCheck, ChevronLeft, Loader2, Award, AlertCircle, CheckCircle2 } from 'lucide-react';

const HODChairpersonEval = () => {
    const [chairpersons, setChairpersons] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [selectedCP, setSelectedCP] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentSession, setCurrentSession] = useState(null);

    const hodId = localStorage.getItem('userId');
    const evaluatorName = "Director / HOD Executive";

    // Rating Labels mapping
    const ratingLabels = {
        1: "Poor",
        2: "Average",
        3: "Good",
        4: "Excellent",

    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const sessionRes = await DataService.get('/Session/GetActiveSession');
                const activeSessionId = sessionRes.data.SessionID;
                setCurrentSession(sessionRes.data);

                const cpRes = await DataService.get(`/SocietyEvaluation/GetChairpersons/${activeSessionId}`);
                setChairpersons(cpRes.data || []);

                const quesRes = await DataService.get('/SocietyEvaluation/GetActiveQuestionnaire/SEC');
                setQuestions(quesRes.data.Questions || []);
            } catch (err) {
                console.error("Error fetching HOD data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            alert("Incomplete Audit: Please provide a rating for all performance indicators.");
            return;
        }

        setSubmitting(true);
        const payload = questions.map(q => ({
            EvaluatorId: hodId,
            EvaluateeId: selectedCP.TeacherId,
            SocietyId: selectedCP.SocietyId,
            QuestionId: q.QuestionID,
            Score: answers[q.QuestionID] || 0,
            EvaluationType: "SEC",
            SessionId: currentSession?.SessionID
        }));

        try {
            await DataService.post('/SocietyEvaluation/Submit', payload);
            alert("Success: Chairperson Audit Logged Successfully!");
            setSelectedCP(null);
            setAnswers({});
        } catch (err) {
            alert("Submission failed. Please check your network.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-gray-50">
            <Loader2 className="animate-spin text-green-700" size={40} />
            <p className="font-black text-green-700 uppercase text-xs tracking-[0.3em] italic">Accessing Audit Records...</p>
        </div>
    );

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto min-h-screen">

            {/* Header Section */}
            <div className="bg-green-700 text-white p-10 rounded-[3rem] shadow-2xl flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                    
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">chiarperson Evalution  Portal</h1>
                    <p className="text-green-100 font-bold uppercase text-[12px] tracking-[0.3em] mt-3 italic opacity-80">
                        {currentSession?.SessionName || 'No Active Session'} 
                    </p>
                </div>
                <ShieldCheck size={80} className="opacity-20 animate-pulse hidden md:block" />
            </div>

            {!selectedCP ? (
                /* SCREEN 1: Chairperson Roster */
                <div className="space-y-6">
                    <div className="flex justify-between items-center px-4">
                        {/* <h2 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400">Available Society Leads</h2> */}
                        <span className="text-[10px] bg-gray-100 px-3 py-1 rounded-full font-bold text-gray-500 uppercase">Total: {chairpersons.length}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {chairpersons.length > 0 ? (
                            chairpersons.map(cp => (
                                <div key={cp.TeacherId} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
                                    <div className="flex flex-col items-center text-center space-y-5">
                                        <div className="bg-green-50 p-5 rounded-full text-green-700 group-hover:bg-green-700 group-hover:text-white transition-all duration-500 shadow-inner">
                                            <UserCheck size={36} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-800 text-xl uppercase tracking-tight leading-tight">{cp.TeacherName}</h3>
                                            <p className="text-green-600 font-bold text-[11px] tracking-widest uppercase mt-1">{cp.SocietyName}</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedCP(cp)}
                                            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg"
                                        >
                                            Evaluate Performance
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                                <AlertCircle size={40} className="text-gray-200 mb-4" />
                                <p className="text-gray-400 font-black uppercase italic tracking-widest text-sm">No Audit Files Found</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* SCREEN 2: Evaluation Audit Form */
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6 pb-20">
                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-green-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2">
                            <button
                                onClick={() => { setSelectedCP(null); setAnswers({}); }}
                                className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase hover:text-black transition-colors group"
                            >
                                <ChevronLeft size={16} cassName="group-hover:-translate-x-1 transition-transform" /> Back
                            </button>
                            <h2 className="text-3xl font-black text-gray-900 uppercase italic leading-none tracking-tighter">Chairperson Name: {selectedCP.TeacherName}</h2>
                            <div className="flex gap-2">
                                <span className="bg-green-700 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{selectedCP.SocietyName}</span>
                                <span className="bg-gray-100 text-gray-500 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">ID: {selectedCP.TeacherId}</span>
                            </div>
                        </div>

                        
                    </div>

                    <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-50 space-y-12">
                        <div className="space-y-12">
                            {questions.map((q, idx) => (
                                <div key={q.QuestionID} className="group space-y-6">
                                    <div className="flex gap-6 items-start">
                                        <span className="bg-green-700 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black flex-shrink-0 shadow-lg shadow-green-100 group-hover:scale-110 transition-transform">
                                            {idx + 1}
                                        </span>
                                        <div className="space-y-6 flex-1">
                                            <p className="font-black text-gray-700 uppercase text-sm tracking-tight pt-2 group-hover:text-green-700 transition-colors duration-300">
                                                {q.QuestionText}
                                            </p>

                                            {/* Rating Buttons with Labels */}
                                            <div className="flex flex-wrap gap-4">
                                                {[1, 2, 3, 4].map(num => (
                                                    <div key={num} className="flex flex-col items-center gap-2">
                                                        <button
                                                            onClick={() => setAnswers({ ...answers, [q.QuestionID]: num })}
                                                            className={`px-6 py-4 rounded-2xl font-black transition-all border-2 flex items-center justify-center text-[10px] uppercase tracking-widest ${answers[q.QuestionID] === num
                                                                    ? 'bg-green-700 border-green-700 text-white scale-105 shadow-xl'
                                                                    : 'bg-white border-gray-100 text-gray-400 hover:border-green-200 hover:text-green-600'
                                                                }`}
                                                        >
                                                            {/* Button ke andar ab sirf label nazar ayega */}
                                                            {ratingLabels[num]}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-10 border-t border-gray-100">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-4 group ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 text-white hover:bg-black'
                                    }`}
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />}
                                {submitting ? "Processing..." : "submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HODChairpersonEval;