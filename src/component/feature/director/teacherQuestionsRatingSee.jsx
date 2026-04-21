import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Calendar, Filter, BarChart2, 
  Loader2, Search, TrendingUp, ShieldCheck, Star 
} from 'lucide-react';
import DataService from '../../../services/axios';
import db from "../../../db"; 

function TeacherQuestionsRatingSee() {
  const { id } = useParams(); // Teacher ID/Name
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [questionsData, setQuestionsData] = useState([]);
  const [filters, setFilters] = useState({
    session: '',
    evalType: 'student' 
  });

  // 1. Initial Load: Get Sessions from API
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const res = await DataService.get('/AcademicPerformance/GetSessions');
        if (res.data && res.data.length > 0) {
          setSessions(res.data);
          setFilters(prev => ({ ...prev, session: res.data[0].id }));
        }
      } catch (err) { console.error("Session Fetch Error:", err); }
    };
    fetchInit();
  }, []);

  // 2. Main Data Fetching Logic (API + Dexie Grouping)
  const fetchDetails = useCallback(async () => {
    if (!filters.session) return;
    setLoading(true);
    try {
      if (filters.evalType === 'confidential') {
        // --- DEXIE LOGIC FOR CONFIDENTIAL ---
        const localData = await db.evaluations.toArray();
        
        // Filter: Teacher Name aur Session ID match karein (Case-insensitive)
        const filtered = localData.filter(e => {
          const teacher = (e.teacherName || e.TeacherName || "").trim().toLowerCase();
          const targetTeacher = id.trim().toLowerCase();
          const sessId = String(e.sessionId || e.SessionId || "");
          const targetSess = String(filters.session);
          return teacher === targetTeacher && sessId === targetSess;
        });

        // Grouping: Raw records ko question-wise stats mein convert karein
        const grouped = filtered.reduce((acc, curr) => {
          const qText = curr.questionText || curr.QuestionText || curr.remarks || "General Assessment";
          if (!acc[qText]) {
            acc[qText] = { 
              QuestionText: qText, 
              TotalScore: 0, 
              TotalResponses: 0,
              Score1: 0, Score2: 0, Score3: 0, Score4: 0 
            };
          }
          const s = Number(curr.score || curr.Score || 0);
          if (s > 0) {
            acc[qText].TotalScore += s;
            acc[qText].TotalResponses += 1;
            if (s === 1) acc[qText].Score1 += 1;
            if (s === 2) acc[qText].Score2 += 1;
            if (s === 3) acc[qText].Score3 += 1;
            if (s === 4) acc[qText].Score4 += 1;
          }
          return acc;
        }, {});

        const formatted = Object.values(grouped).map(q => ({
          ...q,
          AverageScore: q.TotalResponses > 0 ? q.TotalScore / q.TotalResponses : 0,
          RatingPercent: q.TotalResponses > 0 ? ((q.TotalScore / q.TotalResponses) / 4) * 100 : 0
        })).sort((a, b) => b.AverageScore - a.AverageScore);
        
        setQuestionsData(formatted);
      } else {
        // --- API LOGIC FOR STUDENT/PEER ---
        const res = await DataService.get('/AcademicPerformance/GetTeacherQuestionStatsFull', {
          params: { 
            teacherId: id, 
            sessionId: filters.session, 
            evaluationType: filters.evalType 
          }
        });

        const formatted = (res.data || []).map(q => ({
          ...q,
          RatingPercent: (q.AverageScore / 4) * 100,
          // Backend keys check (API might return Score1, Score2 etc)
          Score1: q.Score1 || 0,
          Score2: q.Score2 || 0,
          Score3: q.Score3 || 0,
          Score4: q.Score4 || 0
        })).sort((a, b) => b.AverageScore - a.AverageScore);

        setQuestionsData(formatted);
      }
    } catch (err) {
      console.error("Data Fetch Error:", err);
      setQuestionsData([]);
    } finally { setLoading(false); }
  }, [id, filters]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  // Helper: Detailed Star Counts UI
  const renderDetailedStars = (q) => {
    const categories = [
      { label: 'Poor', stars: 1, count: q.Score1, color: 'text-red-500', fill: 'fill-red-500' },
      { label: 'Average', stars: 2, count: q.Score2, color: 'text-orange-400', fill: 'fill-orange-400' },
      { label: 'Good', stars: 3, count: q.Score3, color: 'text-blue-500', fill: 'fill-blue-500' },
      { label: 'Excellent', stars: 4, count: q.Score4, color: 'text-green-600', fill: 'fill-green-600' },
    ];

    return (
      <div className="flex flex-wrap gap-3 mt-4">
        {categories.map((cat) => (
          <div key={cat.label} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm transition-all hover:bg-gray-50">
            <div className="flex -space-x-0.5">
              {[...Array(cat.stars)].map((_, i) => (
                <Star key={i} size={11} className={`${cat.fill} ${cat.color}`} />
              ))}
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
              {cat.label}: <span className="text-slate-900 font-black ml-1">{cat.count}</span>
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-8 animate-in fade-in duration-500">
      
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 font-bold group">
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all">
            <ChevronLeft size={20} />
          </div>
          Back to Reports
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center justify-end gap-2">
            <TrendingUp className="text-blue-600" /> Detailed Performance
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{id}</p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Academic Session</label>
          <select 
            value={filters.session}
            onChange={(e) => setFilters(prev => ({ ...prev, session: e.target.value }))}
            className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Evaluation Source</label>
          <select 
            value={filters.evalType}
            onChange={(e) => setFilters(prev => ({ ...prev, evalType: e.target.value }))}
            className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="student">Student Evaluation</option>
            <option value="peer">Peer Review</option>
            <option value="confidential">Confidential (Dexie DB)</option>
          </select>
        </div>
      </div>

      {/* Data Visualization List */}
      <div className="bg-white rounded-[3.5rem] p-8 shadow-sm border border-gray-100 min-h-[500px]">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl shadow-slate-200">
              <BarChart2 size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Question Analysis</h3>
          </div>
          {filters.evalType === 'confidential' && (
            <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-2xl border border-green-100">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-black uppercase">Local Data Stream</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Aggregating Scores...</p>
          </div>
        ) : questionsData.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {questionsData.map((q, idx) => (
              <div key={idx} className="group p-8 rounded-[2.5rem] border border-gray-50 bg-gray-50/40 hover:border-blue-200 hover:bg-blue-50/20 transition-all duration-500">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                  <div className="flex gap-6 w-full">
                    <span className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center font-black text-slate-800 text-lg group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-1">
                      <p className="font-bold text-slate-700 text-xl leading-snug tracking-tight">{q.QuestionText}</p>
                      
                      <div className="flex items-center gap-4 py-2 border-b border-gray-100 mb-2">
                        <div className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1 rounded-full shadow-sm">
                           <Star size={12} className="fill-white" />
                           <span className="text-xs font-black">{q.AverageScore.toFixed(2)}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {q.TotalResponses} Submissions
                        </span>
                      </div>

                      {/* Detailed Rating Breakdown */}
                      {renderDetailedStars(q)}
                    </div>
                  </div>
                  
                  <div className="text-right min-w-[100px]">
                    <div className={`text-4xl font-black italic tracking-tighter ${q.RatingPercent >= 75 ? 'text-green-600' : 'text-blue-600'}`}>
                      {Math.round(q.RatingPercent)}%
                    </div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Efficiency</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-8 w-full bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-in-out ${q.RatingPercent >= 75 ? 'bg-green-500' : 'bg-blue-600'}`}
                    style={{ width: `${q.RatingPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-gray-200">
            <Search size={80} className="mb-4 opacity-20" />
            <h4 className="text-xl font-black uppercase tracking-widest text-slate-300">No Metrics Found</h4>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase italic tracking-tighter">Check your filters or local database sync</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherQuestionsRatingSee;