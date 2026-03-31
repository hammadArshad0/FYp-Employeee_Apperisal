import React, { useEffect, useState } from 'react';
import { GraduationCap, ClipboardCheck, ChevronDown, Loader2, Layers } from 'lucide-react';
import DataService from '../../../services/axios';
import EvaluationModal from '../../modal/evaluationModal';

const CourseManagement = () => {
  const [teachersData, setTeachersData] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(localStorage.getItem('currentSessionId') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await DataService.get('/kpi/sessions');
        const sessionList = res.data;
        setSessions(sessionList);

        if (sessionList.length > 0) {
          const savedSession = localStorage.getItem('currentSessionId');
          // Agar saved session list mein maujood hai to wo rakhein, warna latest (max ID) uthayein
          const sessionExists = sessionList.find(s => s.id.toString() === savedSession);
          
          if (sessionExists) {
            setSelectedSession(savedSession);
          } else {
            const latest = sessionList.reduce((prev, curr) => (prev.id > curr.id) ? prev : curr);
            setSelectedSession(latest.id);
            localStorage.setItem('currentSessionId', latest.id);
          }
        }
      } catch (err) { console.error("Sessions error", err); }
    };
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      const fetchCourses = async () => {
        setLoading(true);
        try {
          const res = await DataService.get(`/CourseManagement/EnrollmentCourses/${selectedSession}`);
          setTeachersData(res.data || []);
          localStorage.setItem('currentSessionId', selectedSession);
        } catch (err) { setTeachersData([]); }
        finally { setLoading(false); }
      };
      fetchCourses();
    }
  }, [selectedSession]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-green-700 p-2 rounded-lg text-white shadow-md shadow-green-100"><GraduationCap size={24} /></div>
          <h1 className="text-xl font-bold text-gray-800">Course Management</h1>
        </div>

        <div className="relative w-full md:w-64">
          <select 
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full appearance-none bg-white border border-gray-200 px-4 py-2.5 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 ring-green-500 shadow-sm cursor-pointer"
          >
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-green-700">
          <Loader2 className="animate-spin mb-2" size={40} /><p className="font-bold">Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {teachersData.map((t) => (
            <div key={t.TeacherID} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-50 text-green-700 p-3 rounded-xl group-hover:bg-green-700 group-hover:text-white transition-all"><Layers size={22} /></div>
                  <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded">{t.EnrolledCourses.length} Courses</span>
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-4 border-b pb-2">{t.TeacherName}</h3>
                <div className="space-y-3">
                  {t.EnrolledCourses.map((c) => (
                    <div key={c.Code} className="bg-gray-50/50 p-3 rounded-lg border border-gray-50">
                      <p className="text-[10px] font-black text-green-600 uppercase">{c.Code}</p>
                      <p className="text-sm font-bold text-gray-600 leading-tight">{c.Course}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => { setSelectedTeacher({...t, sessionId: selectedSession}); setIsModalOpen(true); }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 font-bold flex items-center justify-center gap-2 transition-all">
                <ClipboardCheck size={18} /> Evaluate Performance
              </button>
            </div>
          ))}
        </div>
      )}

      <EvaluationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} teacherData={selectedTeacher} />
    </div>
  );
};

export default CourseManagement;