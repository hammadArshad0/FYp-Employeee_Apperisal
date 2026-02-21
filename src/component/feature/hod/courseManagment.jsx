import React, { useEffect, useState } from 'react';
import { GraduationCap, BookOpen, ClipboardCheck, ChevronDown, Loader2, Layers } from 'lucide-react';
import DataService from '../../../services/axios';
import EvaluationModal from '../../modal/evaluationModal';
const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState('');
const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const handleOpenModal = (teacher) => {
    setSelectedTeacher(teacher);
    setIsModalOpen(true);
  };
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await DataService.get('/kpi/sessions');
        setSessions(res.data);
        if (res.data.length > 0) setSelectedSession(res.data[0].id);
      } catch (err) {
        console.error("Sessions error", err);
      }
    };
    fetchInitialData();
  }, []);

const fetchCourses = async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      const res = await DataService.get(`/CourseManagement/EnrollmentCourses/${selectedSession}`);
      
      // Check karein ke data empty toh nahi
      if (!res.data || res.data.length === 0) {
        setCourses([]);
        return;
      }

      // --- Updated Grouping Logic ---
      const grouped = res.data.reduce((acc, current) => {
        // Backend se naye names: teacherName aur courseTitle
        const teacherName = current.teacherName || current.teacher; 
        
        if (!acc[teacherName]) {
          acc[teacherName] = {
            teacher: teacherName,
            enrolledCourses: []
          };
        }
        
        acc[teacherName].enrolledCourses.push({
          // id ki jagah ab unique key use karein ya courseCode
          code: current.courseCode || current.code,
          course: current.courseTitle || current.course
        });
        return acc;
      }, {});
      
      setCourses(Object.values(grouped));

    } catch (err) {
      console.error("Courses load error", err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [selectedSession]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      
      {/* Header & Session Filter */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-green-700 p-2 rounded-lg text-white shadow-md shadow-green-100">
            <GraduationCap size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Teacher Assignments</h1>
        </div>

        <div className="relative w-full md:w-64">
          <select 
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full appearance-none bg-white border border-gray-200 px-4 py-2.5 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 ring-green-500 shadow-sm cursor-pointer"
          >
            <option value="">Select Session</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
        </div>
      </div>

      {/* Grouped Teacher Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-green-700">
          <Loader2 className="animate-spin mb-2" size={40} />
          <p className="font-bold">Organizing Data...</p>
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {courses.map((t, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group"
            >
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-50 text-green-700 p-3 rounded-xl group-hover:bg-green-700 group-hover:text-white transition-all">
                    <Layers size={22} />
                  </div>
                  <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded">
                    {t.enrolledCourses.length} Courses
                  </span>
                </div>

                <h3 className="text-xl font-black text-gray-800 mb-4 border-b pb-2 border-gray-50">
                  {t.teacher}
                </h3>

                {/* Teacher's Courses List */}
                <div className="space-y-3">
                  {t.enrolledCourses.map((c) => (
                    <div key={c.id} className="bg-gray-50/50 p-3 rounded-lg border border-gray-50">
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">{c.code}</p>
                      <p className="text-sm font-bold text-gray-600 leading-tight">{c.course}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button 
        onClick={() => handleOpenModal(t)} // 't' yahan grouped teacher data hai
        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
      >
        <ClipboardCheck size={18} />
        Evaluate Performance
      </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 max-w-7xl mx-auto">
            <p className="text-gray-400 font-bold">No assignments found.</p>
        </div>
      )}
      {/* Modal Component */}
      <EvaluationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        teacherData={selectedTeacher}
      />
    </div>
  );
};

export default CourseManagement;