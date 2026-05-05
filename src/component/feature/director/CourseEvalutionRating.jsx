// TeacherPerformance.jsx
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import DataService from '../../../services/axios';


const CourseEvalutionRating = () => {
  const [sessions, setSessions]           = useState([]);
  const [teachers, setTeachers]           = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [evalType, setEvalType]           = useState('both');
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [goNext, setGoNext]               = useState(false);

  // Sessions load
  useEffect(() => {
    DataService.get('/TeacherSelf/GetSessions')
      .then(res => setSessions(res.data || []));
  }, []);

  // Session change → Teachers
  useEffect(() => {
    if (!selectedSession) return;
    setSelectedTeacher('');
    setGoNext(false);
    setLoadingTeachers(true);
    DataService.get(`/Director/GetTeachersBySession/${selectedSession}`)
      .then(res => setTeachers(res.data || []))
      .finally(() => setLoadingTeachers(false));
  }, [selectedSession]);

  if (goNext) {
    return (
      <Screen2
        teacherId={selectedTeacher}
        sessionId={selectedSession}
        evalType={evalType}
        onBack={() => setGoNext(false)}
      />
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex flex-col gap-6">

      <div>
        <h1 className="text-2xl font-black text-gray-800">Teacher Performance</h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
          Select session, teacher and evaluation type
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">

        {/* Session */}
        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
            Session
          </label>
          <select
            value={selectedSession}
            onChange={e => setSelectedSession(e.target.value)}
            className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none border border-gray-200 focus:border-green-500 transition-all"
          >
            <option value="">-- Select Session --</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Teacher */}
        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
            Teacher
          </label>
          <div className="relative">
            <select
              value={selectedTeacher}
              onChange={e => setSelectedTeacher(e.target.value)}
              disabled={!selectedSession || loadingTeachers}
              className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none border border-gray-200 focus:border-green-500 transition-all disabled:opacity-50"
            >
              <option value="">
                {loadingTeachers ? 'Loading...' : !selectedSession ? 'Select session first' : '-- Select Teacher --'}
              </option>
              {teachers.map(t => (
                <option key={t.UserID} value={t.UserID}>{t.Name}</option>
              ))}
            </select>
            {loadingTeachers && (
              <Loader2 size={16} className="animate-spin absolute right-4 top-1/2 -translate-y-1/2 text-green-600"/>
            )}
          </div>
        </div>

        {/* Eval Type */}
        {selectedTeacher && (
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
              Evaluation Type
            </label>
            <div className="flex gap-2">
              {[
                { key: 'both',    label: 'All' },
                { key: 'student', label: 'Student' },
                { key: 'peer',    label: 'Peer' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setEvalType(opt.key)}
                  className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                    evalType === opt.key
                      ? 'bg-green-700 text-white shadow-lg shadow-green-100'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Next Button */}
        <button
          onClick={() => setGoNext(true)}
          disabled={!selectedSession || !selectedTeacher}
          className="w-full bg-green-700 hover:bg-green-800 text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-green-100 disabled:grayscale disabled:opacity-50"
        >
          View Performance →
        </button>

      </div>
    </div>
  );
};

export default CourseEvalutionRating;