import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Loader2, Filter } from 'lucide-react'; // Filter icon add kiya
import DataService from '../../../services/axios';

const ConfidentialEvaluations = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailList, setEmailList] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  
  // ✅ Naya filter state - Default "unread"
  const [filter, setFilter] = useState("unread");

  useEffect(() => { fetchEmails(); }, []);

  const fetchEmails = async () => {
    try {
      const res = await DataService.get("/email/getall");
      setEmailList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ fetchEvaluations ko email aur filter dono parameters pass kiye
  const fetchEvaluations = async (email, currentFilter) => {
    if (!email) return;
    try {
      setLoading(true);
      setEvaluations([]);

      // ✅ Filter ko request body mein bheja
      const res = await DataService.post("/email/get-evaluations", { 
        mail: email,
        filter: currentFilter // "unread", "read", ya "all"
      });
      
      const result = res.data;
      if (!result.success) {
        alert("Error: " + result.error + "\nDetail: " + (result.detail || ''));
        return;
      }

      setEvaluations(result.data || []);
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  const scoreLabel = (score) => {
    const s = Number(score) || 0;
    if (s >= 4) return { label: 'Excellent', color: 'bg-green-50 text-green-700 border border-green-100' };
    if (s >= 3) return { label: 'Good',      color: 'bg-blue-50 text-blue-700 border border-blue-100' };
    if (s >= 2) return { label: 'Fair',      color: 'bg-orange-50 text-orange-700 border border-orange-100' };
    return              { label: 'Poor',      color: 'bg-red-50 text-red-700 border border-red-100' };
  };

  const val = (obj, ...keys) => {
    if (!obj) return null;
    for (let k of keys) {
      if (obj[k] != null) return obj[k];
      const c = k.charAt(0).toLowerCase() + k.slice(1);
      if (obj[c] != null) return obj[c];
      const p = k.charAt(0).toUpperCase() + k.slice(1);
      if (obj[p] != null) return obj[p];
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">

      {/* ─── NEW FILTER SECTION ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-2xl shadow border">
        
        {/* Email Select */}
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Email Address</label>
          <select
            value={selectedEmail}
            onChange={(e) => {
              setSelectedEmail(e.target.value);
              fetchEvaluations(e.target.value, filter);
            }}
            className="w-full border-2 border-gray-100 p-3 rounded-xl focus:outline-none focus:border-purple-400 font-semibold"
          >
            <option value="">-- Select Email --</option>
            {emailList.map((e) => (
              <option key={e.id} value={e.mail}>{e.mail}</option>
            ))}
          </select>
        </div>

        {/* ✅ NEW: Filter Dropdown */}
        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Email Filter</label>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                if(selectedEmail) fetchEvaluations(selectedEmail, e.target.value);
              }}
              className="w-full border-2 border-gray-100 p-3 rounded-xl focus:outline-none focus:border-purple-400 font-bold text-purple-700 bg-purple-50/30 appearance-none"
            >
              <option value="unread">Unread Emails Only</option>
              <option value="read">Read Emails Only</option>
              <option value="all">All Emails</option>
            </select>
            <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="bg-white rounded-[2rem] p-6 shadow border min-h-[400px]">
        {/* ... baqi ka content jo pehle tha (Header, Loading, No Data, Evaluations List) ... */}
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-purple-700 text-white rounded-3xl">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black">Confidential Reviews</h3>
            <p className="text-xs text-gray-500 italic">
               Filter: <span className="text-purple-600 font-bold uppercase">{filter}</span>
            </p>
          </div>
        </div>

        {/* Same rendering logic as before */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-purple-600" size={48} />
          </div>
        )}

        {!loading && evaluations.length === 0 && (
          <div className="text-center py-20 text-gray-300">
            <ShieldCheck size={80} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold text-gray-400">Koi records nahi mile</p>
          </div>
        )}

        <div className="space-y-6">
          {evaluations.map((item, idx) => {
            // ... (Aapka purana map logic yahan aayega) ...
            const studentName = val(item, 'studentName', 'StudentName') || 'N/A';
            const studentId   = val(item, 'studentId',   'StudentId', 'StudentID') || 'N/A';
            const session     = val(item, 'session',     'Session') || 'N/A';
            const teacherName = val(item, 'teacherName', 'TeacherName') || 'N/A';
            const teacherId   = val(item, 'teacherId',   'TeacherId', 'TeacherID') || 'N/A';
            const subjectCode = val(item, 'subjectCode', 'SubjectCode', 'courseCode', 'CourseCode') || 'N/A';
            const submittedOn = val(item, 'submittedOn', 'SubmittedOn');
            const evals = val(item, 'evaluation', 'Evaluation', 'Evaluations', 'evaluations') || [];

            const uniqueEvals = evals.filter((q, i, arr) =>
              arr.findIndex(x =>
                (val(x, 'questionText', 'Question', 'QuestionText') || '') ===
                (val(q, 'questionText', 'Question', 'QuestionText') || '')
              ) === i
            );

            const avgScore = uniqueEvals.length > 0
              ? (uniqueEvals.reduce((s, q) => s + (Number(val(q, 'score', 'Score')) || 0), 0) / uniqueEvals.length).toFixed(1)
              : 'N/A';

            return (
              <div key={idx} className="border-2 border-purple-50 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Visuals Rendering Logic (Student Header, Teacher + Course, Questions) */}
                <div className="bg-purple-700 text-white p-5">
                   <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xl font-black">{studentName}</p>
                        <p className="text-xs text-purple-200">ID: {studentId} • Session: {session}</p>
                      </div>
                      <div className="bg-white/10 px-4 py-2 rounded-2xl text-xs">
                        {submittedOn ? new Date(submittedOn).toLocaleDateString() : 'N/A'}
                      </div>
                   </div>
                </div>
                {/* ... rest of your UI elements ... */}
                <div className="p-4 bg-gray-50 flex justify-between">
                   <p className="font-bold text-gray-700">{teacherName} <span className="text-xs font-normal text-gray-400">({teacherId})</span></p>
                   <p className="text-sm font-black text-purple-600 bg-white px-3 py-1 rounded-lg border">{subjectCode} • Avg: {avgScore}</p>
                </div>
                <div className="divide-y divide-gray-100 bg-white">
                    {uniqueEvals.map((q, qIdx) => {
                      const score = Number(val(q, 'score', 'Score')) || 0;
                      const { label, color } = scoreLabel(score);
                      return (
                        <div key={qIdx} className="flex justify-between p-4 items-center">
                          <p className="text-sm text-gray-600">{val(q, 'questionText', 'Question', 'QuestionText')}</p>
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${color}`}>{label} ({score})</span>
                        </div>
                      )
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ConfidentialEvaluations;