import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, ShieldCheck, Filter, Mail, MailOpen, Inbox, Search, X, BarChart3, TrendingUp } from 'lucide-react';
import DataService from '../../../services/axios';

const ConfidentialEvaluations = () => {
  
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailList, setEmailList] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef(null);

  useEffect(() => { fetchEmails(); }, []);

  const fetchEmails = async () => {
    try {
      const res = await DataService.get('/email/getall');
      setEmailList(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchEvaluations = async (email, currentFilter) => {
    if (!email) return;
    if (abortRef.current) abortRef.current = false;
    const token = {};
    abortRef.current = token;
    setLoading(true);
    setEvaluations([]);
    setErrorMsg('');

    try {
      const res = await DataService.post('/email/get-evaluations', { mail: email, filter: currentFilter });
      if (token !== abortRef.current && abortRef.current === false) return;
      const result = res.data;
      if (!result.success) {
        setErrorMsg((result.error || 'Unknown error') + (result.detail ? ` — ${result.detail}` : ''));
        return;
      }
      setEvaluations(result.data || []);
    } catch (err) {
      setErrorMsg('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setSelectedEmail(email);
    setSearchTerm('');
    fetchEvaluations(email, filter);
  };

  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setFilter(newFilter);
    if (selectedEmail) fetchEvaluations(selectedEmail, newFilter);
  };

  const val = (obj, ...keys) => {
    if (!obj) return null;
    for (let k of keys) {
      if (obj[k] != null) return obj[k];
      const lo = k.charAt(0).toLowerCase() + k.slice(1);
      if (obj[lo] != null) return obj[lo];
      const up = k.charAt(0).toUpperCase() + k.slice(1);
      if (obj[up] != null) return obj[up];
    }
    return null;
  };

  const scoreLabel = (score) => {
    const s = Number(score) || 0;
    if (s >= 4) return { label: 'Excellent', color: 'bg-green-50 text-green-700 border-green-200' };
    if (s >= 3) return { label: 'Good', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (s >= 2) return { label: 'Fair', color: 'bg-orange-50 text-orange-700 border-orange-200' };
    return { label: 'Poor', color: 'bg-red-50 text-red-700 border-red-200' };
  };

  // ✅ Search Logic
  const filteredData = evaluations.filter((item) => {
    const sName = (val(item, 'studentName', 'StudentName') || '').toLowerCase();
    const sId = (val(item, 'studentId', 'StudentId', 'StudentID') || '').toLowerCase();
    const tName = (val(item, 'teacherName', 'TeacherName') || '').toLowerCase();
    const tId = (val(item, 'teacherId', 'TeacherId', 'TeacherID') || '').toLowerCase();
    const cCode = (val(item, 'subjectCode', 'SubjectCode', 'CourseCode') || '').toLowerCase();
    const cName = (val(item, 'subjectTitle', 'SubjectTitle', 'CourseName') || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return sName.includes(search) || sId.includes(search) || tName.includes(search) || 
           tId.includes(search) || cCode.includes(search) || cName.includes(search);
  });

  // ✅ Statistics with Counts and Percentages (Average)
  const calculateStats = () => {
    let totalQuestions = 0;
    const counts = { excellent: 0, good: 0, fair: 0, poor: 0 };

    filteredData.forEach(item => {
      const evals = val(item, 'evaluation', 'Evaluation', 'evaluations') || [];
      evals.forEach(q => {
        const s = Number(val(q, 'score', 'Score')) || 0;
        totalQuestions++;
        if (s >= 4) counts.excellent++;
        else if (s >= 3) counts.good++;
        else if (s >= 2) counts.fair++;
        else counts.poor++;
      });
    });

    const getPerc = (count) => totalQuestions > 0 ? ((count / totalQuestions) * 100).toFixed(1) : "0";

    return [
      { label: 'Excellent', count: counts.excellent, avg: getPerc(counts.excellent), color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' },
      { label: 'Good', count: counts.good, avg: getPerc(counts.good), color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
      { label: 'Fair', count: counts.fair, avg: getPerc(counts.fair), color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' },
      { label: 'Poor', count: counts.poor, avg: getPerc(counts.poor), color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' },
    ];
  };

  const statCards = calculateStats();
  const filterConfig = {
    all: { label: 'All Emails', Icon: Inbox, color: 'text-slate-600 bg-slate-100' },
    read: { label: 'Read Only', Icon: MailOpen, color: 'text-blue-600 bg-blue-50' },
    unread: { label: 'Unread Only', Icon: Mail, color: 'text-purple-600 bg-purple-50' },
  };
  const currentFilter = filterConfig[filter] || filterConfig.all;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      
      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Email Account</label>
          <select value={selectedEmail} onChange={handleEmailChange} className="w-full border-2 border-slate-100 p-3 rounded-2xl focus:border-purple-400 outline-none font-semibold text-slate-700">
            <option value="">-- Select Email --</option>
            {emailList.map((e) => <option key={e.id} value={e.mail}>{e.mail}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Status Filter</label>
          <select value={filter} onChange={handleFilterChange} className="w-full border-2 border-slate-100 p-3 rounded-2xl focus:border-purple-400 outline-none font-bold text-purple-700 bg-purple-50/30">
            <option value="all">📬 All Emails</option>
            <option value="unread">📩 Unread Only</option>
            <option value="read">📭 Read Only</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Universal Search</label>
          <div className="relative">
            <input type="text" placeholder="Search anything..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border-2 border-slate-100 p-3 rounded-2xl focus:border-purple-400 outline-none font-semibold" />
            {searchTerm ? <X size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 cursor-pointer" onClick={() => setSearchTerm('')} /> : <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />}
          </div>
        </div>
      </div>

      {/* ✅ Stats with Count & Average (%) */}
      {!loading && filteredData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div key={i} className={`bg-white p-5 rounded-3xl border-b-4 ${s.border} shadow-sm transition-transform hover:-translate-y-1`}>
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-xl ${s.bg} ${s.color}`}><BarChart3 size={16}/></div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${s.bg} ${s.color}`}>{s.avg}% Avg</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className={`text-3xl font-black ${s.color}`}>{s.count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main Panel */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 min-h-[500px]">
        <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-purple-700 text-white rounded-3xl shadow-lg"><ShieldAlert size={24} /></div>
            <div>
                <h3 className="text-2xl font-black text-slate-800">Confidential Reviews</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${currentFilter.color}`}>{currentFilter.label}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">• {filteredData.length} Records found</span>
                </div>
            </div>
        </div>

        {loading && <div className="text-center py-20 animate-pulse text-slate-400 font-bold">⏳ Fetching data...</div>}
        {!loading && errorMsg && <div className="bg-red-50 border-2 border-red-100 text-red-600 p-4 rounded-2xl font-bold text-sm">⚠️ {errorMsg}</div>}

        <div className="space-y-8">
          {filteredData.map((item, idx) => {
            const evals = val(item, 'evaluation', 'Evaluation', 'evaluations') || [];
            const avgScore = evals.length > 0 ? (evals.reduce((s, q) => s + (Number(val(q, 'score', 'Score')) || 0), 0) / evals.length).toFixed(1) : '0';

            return (
              <div key={idx} className="border-2 border-slate-50 rounded-[2.5rem] overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="bg-slate-900 text-white p-6 flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h4 className="text-2xl font-black">{val(item, 'studentName', 'StudentName')}</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-1">ID: {val(item, 'studentId', 'StudentId')} • Session: {val(item, 'session', 'Session') || 'N/A'}</p>
                  </div>
                  <div className="bg-purple-600 px-5 py-2 rounded-2xl text-center shadow-lg">
                      <p className="text-[10px] font-black uppercase opacity-70">Total Avg</p>
                      <p className="text-2xl font-black">{avgScore}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 flex flex-wrap justify-between items-center gap-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 text-purple-600 font-black shadow-sm">T</div>
                    <div>
                      <p className="font-black text-slate-800 text-lg">{val(item, 'teacherName', 'TeacherName')}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase">Teacher ID: {val(item, 'teacherId', 'TeacherId')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-700 font-black text-lg">{val(item, 'subjectCode', 'SubjectCode')}</p>
                    <p className="text-sm font-bold text-slate-500">{val(item, 'subjectTitle', 'SubjectTitle', 'CourseName')}</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-50">
                  {evals.map((q, qIdx) => {
                    const score = Number(val(q, 'score', 'Score')) || 0;
                    const { label, color } = scoreLabel(score);
                    return (
                      <div key={qIdx} className="p-5 flex flex-wrap md:flex-nowrap justify-between items-center gap-4 bg-white hover:bg-slate-50/50 transition-colors">
                        <div className="flex gap-4 items-start">
                          <span className="text-slate-300 font-black mt-0.5">{qIdx + 1}.</span>
                          <p className="text-slate-600 font-medium">{val(q, 'questionText', 'Question')}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 shadow-sm ${color}`}>
                          {label} ({score})
                        </span>
                      </div>
                    );
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