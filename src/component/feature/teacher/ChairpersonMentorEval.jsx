import React, { useEffect, useState } from 'react';
import DataService from '../../../services/axios';
import { User, CheckCircle, Send, ArrowLeft, Loader2, UserCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ChairpersonMentorEval = () => {
    const [mentorData, setMentorData] = useState(null);
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
                // 1. Get Active Session first
                const sessionRes = await DataService.get('/Session/GetActiveSession');
                setSessionInfo(sessionRes.data);
                const activeSessionId = sessionRes.data.SessionID;

                // 2. Get Society and Mentors using that SessionID
                const mentorsRes = await DataService.get(`/SocietyEvaluation/GetChairpersonSocietyWithMentors/${teacherId}/${activeSessionId}`);
                setMentorData(mentorsRes.data);

                if (mentorsRes.data?.IsChairperson) {
                    // 3. Get Questions
                    const quesRes = await DataService.get('/SocietyEvaluation/GetActiveQuestionnaire/SEM');
                    setQuestions(quesRes.data.Questions || []);

                    // 4. Get already submitted evaluations
                    const subRes = await DataService.get(`/SocietyEvaluation/GetSubmitted/${teacherId}/SEM/${activeSessionId}`);
                    setSubmittedIds(subRes.data || []);
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

    const handleSubmit = async () => {
        // Validation: Ensure all questions are answered
        if (Object.keys(answers).length !== questions.length) {
            toast.error("Please answer all questions before submitting.");
            return;
        }

        // Integrity Check: Ensure we have Session and Society IDs
        if (!sessionInfo?.SessionID || !mentorData?.SocietyId) {
            toast.error("Session or Society information is missing.");
            return;
        }

        try {
            setSubmitting(true);

            // Constructing the payload exactly as the Backend List<SocietyEvaluationDTO> expects
            const payload = questions.map((q) => ({
                EvaluatorId: teacherId, // String from localStorage
                EvaluateeId: selectedMentor.TeacherId, // String from mentor object
                SocietyId: parseInt(mentorData.SocietyId), // Ensure Integer
                QuestionId: parseInt(q.QuestionID), // Ensure Integer
                Score: parseInt(answers[q.QuestionID]), // Ensure Integer
                EvaluationType: 'SEM',
                SessionId: parseInt(sessionInfo.SessionID) // CRITICAL: This fixes the Inner Exception
            }));

            const response = await DataService.post('/SocietyEvaluation/Submit', payload);
            
            if (response.data.success !== false) {
                toast.success("Evaluation submitted successfully!");
                setSubmittedIds([...submittedIds, selectedMentor.TeacherId]);
                setSelectedMentor(null);
                setAnswers({});
            } else {
                toast.error(response.data.error || "Submission failed");
            }
        } catch (err) {
            console.error("Submission error:", err.response?.data || err.message);
            toast.error("Database Error: Check if all IDs are valid.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
            <Loader2 className="animate-spin text-green-700" size={40} />
            <p className="font-black text-gray-400 uppercase text-xs tracking-[0.3em] italic">Loading Evaluation Portal...</p>
        </div>
    );

    if (mentorData && !mentorData.IsChairperson) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 text-center">
                <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-red-50 max-w-md">
                    <div className="bg-red-100 text-red-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-4 italic">Unauthorized</h2>
                    <p className="text-gray-400 font-bold text-sm leading-relaxed mb-8">
                        You are not assigned as a Chairperson for any society in the current session.
                    </p>
                    <button onClick={() => window.history.back()} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg">Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto min-h-screen">
            {/* Header */}
            <div className="bg-green-700 text-white p-10 rounded-[3rem] shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Society Mentor Evaluation</h1>
                        <div className="flex flex-wrap gap-4 mt-4">
                            <div className="bg-green-800/50 px-4 py-2 rounded-xl border border-green-600/30">
                                <p className="text-[8px] uppercase font-black text-green-300 tracking-widest">Active Session</p>
                                <p className="text-xs font-bold">{sessionInfo?.SessionName || "Loading..."}</p>
                            </div>
                            <div className="bg-green-800/50 px-4 py-2 rounded-xl border border-green-600/30">
                                <p className="text-[8px] uppercase font-black text-green-300 tracking-widest">Your Society</p>
                                <p className="text-lg font-black">{mentorData?.SocietyName || "Not Assigned"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {!selectedMentor ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {mentorData?.Mentors?.map(m => {
                        const isDone = submittedIds.includes(m.TeacherId);
                        return (
                            <div key={m.TeacherId} className={`bg-white p-8 rounded-[3rem] border transition-all flex flex-col items-center text-center ${isDone ? 'border-green-100 opacity-80' : 'border-gray-50 shadow-sm hover:shadow-2xl'}`}>
                                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 ${isDone ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-300'}`}>
                                    <User size={40}/>
                                </div>
                                <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight">{m.TeacherName}</h3>
                                <p className="text-[10px] text-gray-400 mb-8 font-bold tracking-widest uppercase italic">Society Mentor</p>
                                
                                {isDone ? (
                                    <div className="flex items-center gap-2 bg-green-50 text-green-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                                        <CheckCircle size={14}/> Completed
                                    </div>
                                ) : (
                                    <button onClick={() => setSelectedMentor(m)} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg">Start Evaluation</button>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-green-50 flex items-center gap-6">
                        <button onClick={() => setSelectedMentor(null)} className="p-3 bg-gray-100 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all">
                            <ArrowLeft size={20}/>
                        </button>
                        <div>
                            <h2 className="text-2xl font-black italic uppercase text-gray-800">Evaluating: {selectedMentor.TeacherName}</h2>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-50 space-y-12">
                        {questions.map((q, idx) => (
                            <div key={q.QuestionID} className="space-y-6">
                                <div className="flex gap-4 items-center">
                                    <span className="bg-green-700 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black">{idx + 1}</span>
                                    <p className="font-bold text-gray-700 uppercase text-sm">{q.QuestionText}</p>
                                </div>
                                <div className="flex flex-wrap gap-3 ml-12">
                                    {[1, 2, 3, 4].map(num => (
                                        <button 
                                            key={num}
                                            onClick={() => setAnswers({...answers, [q.QuestionID]: num})}
                                            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all border-2 ${
                                                answers[q.QuestionID] === num 
                                                ? 'bg-green-700 border-green-700 text-white shadow-lg' 
                                                : 'bg-white border-gray-100 text-gray-400 hover:border-green-200'
                                            }`}
                                        >
                                            {ratingLabels[num]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <button 
                            onClick={handleSubmit} 
                            disabled={submitting}
                            className={`w-full py-6 rounded-[2.5rem] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${submitting ? 'bg-gray-100 text-gray-400' : 'bg-green-700 text-white hover:bg-black shadow-2xl'}`}
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : <Send size={20}/>}
                            {submitting ? "Saving..." : "Submit Evaluation"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChairpersonMentorEval;