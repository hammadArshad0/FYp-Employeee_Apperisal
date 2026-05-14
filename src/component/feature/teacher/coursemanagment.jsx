import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import DataService from '../../../services/axios';

const SeeCourseManagement = () => {
  const [performance, setPerformance] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const teacherId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await DataService.get(`/CourseManagement/TeacherSessions/${teacherId}`);
        const sessionList = res.data;
        setSessions(sessionList);

        if (sessionList.length > 0) {
          const latest = sessionList[sessionList.length - 1];
          setSelectedSession(latest.id);
          fetchPerformance(latest.id);
        }
      } catch (err) {
        setError("Sessions load nahi ho sakin.");
      }
    };
    if (teacherId) fetchSessions();
  }, [teacherId]);

  const handleSessionChange = (e) => {
    const sessionId = Number(e.target.value);
    setSelectedSession(sessionId);
    fetchPerformance(sessionId);
  };

  const fetchPerformance = async (sessionId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await DataService.get(`/CourseManagement/my-Courseperformance/${teacherId}/${sessionId}`);
      setPerformance(res.data.Performance || []);
      setCourses(res.data.Courses || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Is session mein abhi koi evaluation nahi hai.");
      } else {
        setError("Data load nahi ho saka.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">My Performance</h2>
          <p className="text-gray-500"> Course Evaluation See.</p>
        </div>

        {sessions.length > 0 && (
          <div className="relative">
            <select
              value={selectedSession}
              onChange={handleSessionChange}
              className="appearance-none bg-white border border-gray-200 rounded-2xl px-4 py-2.5 pr-10 text-sm font-bold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer min-w-[200px]"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Status Messages */}
      {loading && <div className="flex flex-col items-center justify-center h-64 text-green-600"><Loader2 className="animate-spin mb-2" size={40} /><p className="font-bold">Fetching Data...</p></div>}
      {!loading && error && <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex items-center gap-4 text-amber-700"><AlertCircle /><p className="font-bold">{error}</p></div>}

      {/* Course Cards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((course, index) => {
            // ✅ Filter performance specific to THIS course card
            const paperScore = performance.find(p => 
              p.CourseCode === course.CourseCode && p.Activity?.toLowerCase().includes('paper')
            );
            const folderScore = performance.find(p => 
              p.CourseCode === course.CourseCode && p.Activity?.toLowerCase().includes('folder')
            );

            return (
              <div key={index} className="bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm hover:border-green-300 transition-all">
                {/* Course Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-green-50 p-3 rounded-2xl text-green-700"><BookOpen size={24} /></div>
                  <div>
                    <h3 className="font-black text-gray-800 text-lg leading-tight">{course.CourseName}</h3>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{course.CourseCode}</span>
                  </div>
                </div>

                {/* Score Sections */}
                <div className="space-y-4">
                  <ScoreCard item={paperScore} title="Paper Submission" />
                  <ScoreCard item={folderScore} title="Folder Submission" />
                </div>

                {/* Overall Score */}
                {(paperScore || folderScore) && (
                  <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-black text-gray-400 uppercase">Average Score</span>
                    <span className="text-lg font-black text-green-700">
                      {(((paperScore?.ObtainedScore || 0) + (folderScore?.ObtainedScore || 0)) / 2).toFixed(1)} / 5
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Sub-Component for cleaner code
const ScoreCard = ({ item, title }) => {
  if (!item) return <div className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">{title} evaluation pending...</div>;

  return (
    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-gray-400" />
          <span className="text-xs font-black text-gray-500 uppercase">{title}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${item.Status === 'On Time' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {item.Status}
        </span>
      </div>

      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full transition-all duration-1000 ${item.ObtainedScore === 5 ? 'bg-green-600' : 'bg-amber-500'}`}
          style={{ width: `${(item.ObtainedScore / 5) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Remarks & Notes</p>
        <p className="text-sm text-gray-600 italic leading-relaxed">{item.Remarks}</p>
      </div>
    </div>
  );
};

export default SeeCourseManagement;