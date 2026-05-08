import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, ShieldCheck, Loader2, Filter, Mail, MailOpen, Inbox } from 'lucide-react';
import DataService from '../../../services/axios';

const ConfidentialEvaluations = () => {
  const [evaluations, setEvaluations]   = useState([]);
  const [loading, setLoading]           = useState(false);
  const [emailList, setEmailList]       = useState([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [filter, setFilter]             = useState('all');
  const [errorMsg, setErrorMsg]         = useState('');
  const abortRef = useRef(null); // cancel previous request

  useEffect(() => { fetchEmails(); }, []);

  const fetchEmails = async () => {
    try {
      const res = await DataService.get('/email/getall');
      setEmailList(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ FIX: filter aur email dono properly pass ho rahe hain
  const fetchEvaluations = async (email, currentFilter) => {
    if (!email) return;

    // Pehli request cancel karo agar chal rahi ho
    if (abortRef.current) abortRef.current = false;
    const token = {};
    abortRef.current = token;

    setLoading(true);
    setEvaluations([]);
    setErrorMsg('');

    try {
      const res = await DataService.post('/email/get-evaluations', {
        mail:   email,
        filter: currentFilter, // ✅ "unread" | "read" | "all"
      });

      if (token !== abortRef.current && abortRef.current === false) return; // stale

      const result = res.data;
      if (!result.success) {
        setErrorMsg((result.error || 'Unknown error') + (result.detail ? ` — ${result.detail}` : ''));
        setEvaluations([]);
        return;
      }
      setEvaluations(result.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setSelectedEmail(email);
    fetchEvaluations(email, filter);
  };

  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setFilter(newFilter);
    if (selectedEmail) fetchEvaluations(selectedEmail, newFilter);
  };

  // helper: key case insensitive
  const val = (obj, ...keys) => {
    if (!obj) return null;
    for (let k of keys) {
      if (obj[k]  != null) return obj[k];
      const lo = k.charAt(0).toLowerCase() + k.slice(1);
      if (obj[lo] != null) return obj[lo];
      const up = k.charAt(0).toUpperCase() + k.slice(1);
      if (obj[up] != null) return obj[up];
    }
    return null;
  };

  const scoreLabel = (score) => {
    const s = Number(score) || 0;
    if (s >= 4) return { label: 'Excellent', color: 'bg-green-50 text-green-700 border border-green-200' };
    if (s >= 3) return { label: 'Good',      color: 'bg-blue-50 text-blue-700 border border-blue-200' };
    if (s >= 2) return { label: 'Fair',      color: 'bg-orange-50 text-orange-700 border border-orange-200' };
    return              { label: 'Poor',      color: 'bg-red-50 text-red-700 border border-red-200' };
  };

  // Filter badge config
  const filterConfig = {
    all:    { label: 'All Emails',     Icon: Inbox,    color: 'text-slate-600 bg-slate-100' },
    read:   { label: 'Read Only',      Icon: MailOpen, color: 'text-blue-600 bg-blue-50' },
    unread: { label: 'Unread Only',    Icon: Mail,     color: 'text-purple-600 bg-purple-50' },
  };
  const currentFilter = filterConfig[filter] || filterConfig.all;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">

      {/* ── Controls ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

        {/* Email Select */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">
            Email Account
          </label>
          <select
            value={selectedEmail}
            onChange={handleEmailChange}
            className="w-full border-2 border-slate-100 p-3 rounded-xl focus:outline-none focus:border-purple-400 font-semibold text-slate-700 bg-white"
          >
            <option value="">-- Select Email --</option>
            {emailList.map((e) => (
              <option key={e.id} value={e.mail}>{e.mail}</option>
            ))}
          </select>
        </div>

        {/* ✅ Filter Select */}
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">
            Email Filter
          </label>
          <div className="relative">
            <select
              value={filter}
              onChange={handleFilterChange}
              className="w-full border-2 border-slate-100 p-3 rounded-xl focus:outline-none focus:border-purple-400 font-bold text-purple-700 bg-purple-50/30 appearance-none pr-10"
            >
              <option value="all">📬 All Emails</option>
              <option value="unread">📩 Unread Emails Only</option>
              <option value="read">📭 Read Emails Only</option>
            </select>
            <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Main Panel ── */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 min-h-[400px]">

        {/* Panel Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-purple-700 text-white rounded-3xl">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">Confidential Reviews</h3>
              <div className="flex items-center gap-2 mt-1">
                <currentFilter.Icon size={13} />
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${currentFilter.color}`}>
                  {currentFilter.label}
                </span>
                {evaluations.length > 0 && !loading && (
                  <span className="text-[10px] text-slate-400 font-bold">
                    — {evaluations.length} record{evaluations.length !== 1 ? 's' : ''} found
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="space-y-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-[1.5rem] overflow-hidden border border-slate-100 animate-pulse">
                <div className="bg-purple-200 h-20 w-full" />
                <div className="bg-slate-50 p-4 flex justify-between">
                  <div className="bg-slate-200 h-4 w-40 rounded-full" />
                  <div className="bg-slate-200 h-4 w-24 rounded-full" />
                </div>
                <div className="bg-white p-4 space-y-3">
                  <div className="bg-slate-100 h-3 w-full rounded-full" />
                  <div className="bg-slate-100 h-3 w-5/6 rounded-full" />
                </div>
              </div>
            ))}
            <p className="text-center text-slate-400 text-sm font-bold animate-pulse pt-2">
              Fetching emails... this may take a moment ⏳
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-sm font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ── No Data ── */}
        {!loading && !errorMsg && evaluations.length === 0 && (
          <div className="text-center py-20">
            <ShieldCheck size={80} className="mx-auto mb-4 text-slate-200" />
            <p className="font-black text-slate-400 text-lg">
              {selectedEmail
                ? `No ${filter === 'all' ? '' : filter + ' '}emails found`
                : 'Select an email account to begin'}
            </p>
          </div>
        )}

        {/* ── Evaluations List ── */}
        {!loading && evaluations.length > 0 && (
          <div className="space-y-6">
            {evaluations.map((item, idx) => {
              const studentName = val(item, 'studentName', 'StudentName') || 'N/A';
              const studentId   = val(item, 'studentId', 'StudentId', 'StudentID') || 'N/A';
              const session     = val(item, 'session', 'Session') || 'N/A';
              const teacherName = val(item, 'teacherName', 'TeacherName') || 'N/A';
              const teacherId   = val(item, 'teacherId', 'TeacherId', 'TeacherID') || 'N/A';
              const subjectCode = val(item, 'subjectCode', 'SubjectCode', 'courseCode', 'CourseCode') || 'N/A';
              const subjectTitle= val(item, 'subjectTitle', 'SubjectTitle') || '';
              const submittedOn = val(item, 'submittedOn', 'SubmittedOn');
              const evals       = val(item, 'evaluation', 'Evaluation', 'Evaluations', 'evaluations') || [];

              // Duplicate questions hatao
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

                  {/* Student Header */}
                  <div className="bg-purple-700 text-white p-5">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xl font-black">{studentName}</p>
                        <p className="text-xs text-purple-200">
                          ID: {studentId} • Session: {session}
                        </p>
                      </div>
                      <div className="bg-white/10 px-4 py-2 rounded-2xl text-xs font-bold">
                        {submittedOn ? new Date(submittedOn).toLocaleDateString('en-PK', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        }) : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Teacher + Subject */}
                  <div className="p-4 bg-slate-50 flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <p className="font-black text-slate-700">{teacherName}</p>
                      <p className="text-xs text-slate-400 font-semibold">Teacher ID: {teacherId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-purple-700 bg-white px-3 py-1 rounded-xl border border-purple-100">
                        {subjectCode}
                      </p>
                      {subjectTitle && (
                        <p className="text-[10px] text-slate-400 mt-1">{subjectTitle}</p>
                      )}
                      <p className="text-xs font-black text-slate-500 mt-1">Avg: {avgScore}</p>
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="divide-y divide-slate-50 bg-white">
                    {uniqueEvals.map((q, qIdx) => {
                      const score = Number(val(q, 'score', 'Score')) || 0;
                      const { label, color } = scoreLabel(score);
                      return (
                        <div key={qIdx} className="flex justify-between items-center p-4 gap-4">
                          <p className="text-sm text-slate-600 flex-1">
                            {val(q, 'questionText', 'Question', 'QuestionText') || 'N/A'}
                          </p>
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap ${color}`}>
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
        )}
      </div>
    </div>
  );
};

export default ConfidentialEvaluations;