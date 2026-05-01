import React, { useEffect, useState } from 'react';
import DataService from '../../../services/axios';
import { User, CheckCircle, Send, ArrowLeft, Loader2, ShieldAlert, LayoutGrid } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ChairpersonMentorEval = () => {
    // States
    const [societies, setSocieties] = useState([]); // Array for multiple societies
    const [selectedSociety, setSelectedSociety] = useState(null); // Currently active society
    const [questions, setQuestions] = useState([]);
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submittedIds, setSubmittedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [sessionInfo, setSessionInfo] = useState(null);
    
    const teacherId = localStorage.getItem('userId'); 

    const ratingLabels = {
        1: "Poor",
        2: "Average",
        3: "Good",
        4: "Excellent"
    };

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                
                // 1. Get Active Session
                const sessionRes = await DataService.get('/Session/GetActiveSession');
                setSessionInfo(sessionRes.data);
                const activeSessionId = sessionRes.data.SessionID;

                // 2. Get Societies and Mentors (Backend now returns a List/Array)
                const mentorsRes = await DataService.get(`/SocietyEvaluation/GetChairpersonSocietyWithMentors/${teacherId}/${activeSessionId}`);
                
                // Check if data is an array and has content
                if (Array.isArray(mentorsRes.data) && mentorsRes.data.length > 0) {
                    setSocieties(mentorsRes.data);
                    setSelectedSociety(mentorsRes.data[0]); // Default to first society

                    // 3. Get Questions (SEM - Society Evaluation Mentor)
                    const quesRes = await DataService.get('/SocietyEvaluation/GetActiveQuestionnaire/SEM');
                    setQuestions(quesRes.data.Questions || []);

                    // 4. Get already submitted evaluations
                    const subRes = await DataService.get(`/SocietyEvaluation/GetSubmitted/${teacherId}/SEM/${activeSessionId}`);
                    setSubmittedIds(subRes.data || []);
                } else {
                    setSocieties([]);
                }
            } catch (err) { 
                console.error("Initial load error:", err); 
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [teacherId]);

    const handleSocietyChange = (soc) => {
        setSelectedSociety(soc);
        setSelectedMentor(null); // Reset mentor selection when switching societies
        setAnswers({});
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length !== questions.length) {
            toast.error("Please answer all questions before submitting.");
            return;
        }

        if (!sessionInfo?.SessionID || !selectedSociety?.SocietyId) {
            toast.error("Session or Society information is missing.");
            return;
        }

        try {
            setSubmitting(true);

            const payload = questions.map((q) => ({
                EvaluatorId: teacherId,
                EvaluateeId: selectedMentor.TeacherId,
                SocietyId: parseInt(selectedSociety.SocietyId),
                QuestionId: parseInt(q.QuestionID),
                Score: parseInt(answers[q.QuestionID]),
                EvaluationType: 'SEM',
                SessionId: parseInt(sessionInfo.SessionID)
            }));

            const response = await DataService.post('/SocietyEvaluation/Submit', payload);
            
            if (response.data.success !== false) {
                toast.success(`Evaluation for ${selectedMentor.TeacherName} submitted!`);
                setSubmittedIds([...submittedIds, selectedMentor.TeacherId]);
                setSelectedMentor(null);
                setAnswers({});
            } else {
                toast.error(response.data.error || "Submission failed");
            }
        } catch (err) {
            console.error("Submission error:", err.response?.data || err.message);
            toast.error("Database Error: Could not save evaluation.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-gray-50">
            <Loader2 className="animate-spin text-green-700" size={40} />
            <p className="font-black text-gray-400 uppercase text-xs tracking-[0.3em] italic">Loading Evaluation Portal...</p>
        </div>
    );

    // If no societies found where user is chairperson
    if (societies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 text-center">
                <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-red-50 max-w-md">
                    <div className="bg-red-100 text-red-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-4 italic">No Societies Found</h2>
                    <p className="text-gray-400 font-bold text-sm leading-relaxed mb-8">
                        You are not assigned as a Chairperson for any society in {sessionInfo?.SessionName || 'the current session'}.
                    </p>
                    <button onClick={() => window.history.back()} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg">Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto min-h-screen pb-20">
            {/* Header */}
            <div className="bg-green-700 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <LayoutGrid size={120} />
                </div>
                <div className="relative z-10 space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Chairperson Portal</h1>
                        <p className="text-green-200 text-xs font-bold uppercase tracking-[0.2em]">Society Mentor Evaluation System</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                            <p className="text-[8px] uppercase font-black text-green-300 tracking-widest mb-1">Active Session</p>
                            <p className="text-sm font-bold">{sessionInfo?.SessionName || "..."}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                            <p className="text-[8px] uppercase font-black text-green-300 tracking-widest mb-1">Total Societies</p>
                            <p className="text-sm font-bold">{societies.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Society Selector Tabs (Only show if multiple societies exist) */}
            {!selectedMentor && societies.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {societies.map((soc) => (
                        <button
                            key={soc.SocietyId}
                            onClick={() => handleSocietyChange(soc)}
                            className={`px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border shadow-sm ${
                                selectedSociety?.SocietyId === soc.SocietyId
                                    ? 'bg-gray-900 text-white border-gray-900 shadow-xl scale-105'
                                    : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
                            }`}
                        >
                            {soc.SocietyName}
                        </button>
                    ))}
                </div>
            )}

            {!selectedMentor ? (
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-4">
                        <div className="h-px flex-1 bg-gray-200"></div>
                        <h2 className="text-[14px] font-black text-gray-800 uppercase tracking-[0.4em]">
                            Mentors in {selectedSociety?.SocietyName}
                        </h2>
                        <div className="h-px flex-1 bg-gray-200"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {selectedSociety?.Mentors?.map(m => {
                            const isDone = submittedIds.includes(m.TeacherId);
                            return (
                                <div key={m.TeacherId} className={`bg-white p-8 rounded-[3rem] border transition-all flex flex-col items-center text-center ${isDone ? 'border-green-100 bg-green-50/20' : 'border-gray-50 shadow-sm hover:shadow-2xl hover:-translate-y-1'}`}>
                                    <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center mb-6 transition-colors ${isDone ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-300'}`}>
                                        <User size={40}/>
                                    </div>
                                    <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight">{m.TeacherName}</h3>
                                    <p className="text-[9px] text-gray-400 mb-8 font-bold tracking-widest uppercase italic">Society Mentor</p>
                                    
                                    {isDone ? (
                                        <div className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-100">
                                            <CheckCircle size={14}/> Completed
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setSelectedMentor(m)} 
                                            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg"
                                        >
                                            Evaluate Now
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-green-50 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <button onClick={() => setSelectedMentor(null)} className="p-4 bg-gray-100 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all group">
                                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/>
                            </button>
                            <div>
                                <h2 className="text-2xl font-black italic uppercase text-gray-800 tracking-tighter">Evaluating: {selectedMentor.TeacherName}</h2>
                                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{selectedSociety?.SocietyName}</p>
                            </div>
                        </div>
                        <div className="px-6 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Progress</p>
                             <p className="text-xs font-black text-gray-800">{Object.keys(answers).length} / {questions.length} Answered</p>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-50 space-y-12">
                        {questions.map((q, idx) => (
                            <div key={q.QuestionID} className="space-y-6">
                                <div className="flex gap-5 items-start">
                                    <span className="bg-green-700 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black flex-shrink-0 shadow-lg shadow-green-100">
                                        {idx + 1}
                                    </span>
                                    <p className="font-bold text-gray-700 uppercase text-sm leading-relaxed pt-2">
                                        {q.QuestionText}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3 md:ml-16">
                                    {[1, 2, 3, 4].map(num => (
                                        <button 
                                            key={num}
                                            onClick={() => setAnswers({...answers, [q.QuestionID]: num})}
                                            className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase transition-all border-2 ${
                                                answers[q.QuestionID] === num 
                                                ? 'bg-green-700 border-green-700 text-white shadow-xl scale-105' 
                                                : 'bg-white border-gray-100 text-gray-400 hover:border-green-200 hover:bg-green-50/30'
                                            }`}
                                        >
                                            {ratingLabels[num]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="pt-6 border-t border-gray-50">
                            <button 
                                onClick={handleSubmit} 
                                disabled={submitting}
                                className={`w-full py-7 rounded-[2.5rem] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all ${submitting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-700 text-white hover:bg-gray-900 shadow-2xl shadow-green-200'}`}
                            >
                                {submitting ? <Loader2 className="animate-spin" /> : <Send size={20}/>}
                                {submitting ? "Processing..." : "Finish & Submit Evaluation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChairpersonMentorEval;