import React, { useState, useEffect } from 'react';
import { Filter, Users, BookOpen, BarChart3, Loader2, Search, GraduationCap } from 'lucide-react';
import DataService from '../../../services/axios';

function FilterPerformance() {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState(['All']); // Backend se aayenge
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');

  // 1. Initial Load: Get Sessions & Departments
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [sessionRes, deptRes] = await Promise.all([
          DataService.get('/DirectorFilter/GetSessions'),
          DataService.get('/DirectorFilter/GetDepartments')
        ]);
        
        setSessions(sessionRes.data);
        if (sessionRes.data.length > 0) setSelectedSession(sessionRes.data[0].id);
        
        // Add "All" to backend departments
        setDepartments(['All', ...deptRes.data]);
      } catch (err) {
        console.error("Error fetching initial lists", err);
      }
    };
    fetchInitialData();
  }, []);

  // 2. When Session Changes: Get Courses
  useEffect(() => {
    if (selectedSession) {
      const fetchCourses = async () => {
        try {
          const res = await DataService.get(`/DirectorFilter/GetCoursesBySession/${selectedSession}`);
          setCourses(res.data);
        } catch (err) {
          console.error("Error fetching courses", err);
        }
      };
      fetchCourses();
    }
  }, [selectedSession]);

  // 3. When any Filter Changes: Get Performance Data
  useEffect(() => {
    if (selectedSession) {
      fetchPerformance();
    }
  }, [selectedSession, selectedDept, selectedCourse]);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const res = await DataService.get(`/DirectorFilter/GetFilteredPerformance`, {
        params: {
          sessionId: selectedSession,
          department: selectedDept,
          courseCode: selectedCourse
        }
      });
      setPerformanceData(res.data);
    } catch (err) {
      console.error("Error fetching performance", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper Function for Color Scheme
  // 80+ Green | 60+ Orange | Below 30 Red
  const getScoreColor = (pct) => {
    if (pct >= 80) return 'bg-green-600 text-green-600 border-green-200';
    if (pct >= 60) return 'bg-orange-500 text-orange-500 border-orange-200';
    if (pct <= 30) return 'bg-red-600 text-red-600 border-red-200';
    return 'bg-blue-500 text-blue-500 border-blue-200'; // Default/Intermediate
  };

  const getTextColor = (pct) => {
    if (pct >= 80) return 'text-green-700';
    if (pct >= 60) return 'text-orange-700';
    if (pct <= 30) return 'text-red-700';
    return 'text-blue-700';
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-green-600" size={32} />
            Director Analytics
          </h1>
          <p className="text-gray-500 font-medium">Monitoring Teacher Performance across all metrics.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase ml-2 tracking-widest">Active Session</label>
          <select 
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-green-500 transition-all outline-none"
          >
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase ml-2 tracking-widest">Faculty/Dept</label>
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-green-500 transition-all outline-none"
          >
            {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase ml-2 tracking-widest">Course Catalog</label>
          <select 
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-green-500 transition-all outline-none"
          >
            <option value="All">All Courses</option>
            {courses.map((c, idx) => <option key={idx} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Cards Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-green-600 mb-4" size={48} />
          <p className="text-gray-500 font-bold tracking-widest">FETCHING PERFORMANCE RECORDS...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {performanceData.length === 0 ? (
            <div className="col-span-full bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-200">
               <Search className="mx-auto text-gray-300 mb-4" size={64} />
               <p className="text-xl font-bold text-gray-400">No records found for current selection.</p>
            </div>
          ) : (
            performanceData.map((data, index) => (
              <div key={index} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                
                {/* Score Indicator Badge */}
                <div className={`absolute top-6 right-6 px-4 py-2 rounded-full border ${getScoreColor(data.OverallAvg * 25).split(' ')[1]} bg-opacity-10 font-black`}>
                    {data.OverallAvg} / 4.0
                </div>

                <div className="flex items-start gap-4 mb-8">
                  <div className="bg-gray-100 p-4 rounded-3xl text-gray-500 group-hover:bg-green-600 group-hover:text-white transition-all">
                    <Users size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-800">{data.TeacherName}</h3>
                    <div className="flex items-center gap-2 text-gray-400">
                        <GraduationCap size={14} />
                        <span className="text-xs font-bold uppercase tracking-widest">{data.Department}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Course Code</p>
                        <p className="font-bold text-gray-700">{data.CourseCode}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Success Rate</p>
                        <p className={`font-black ${getTextColor(data.OverallAvg * 25)}`}>{Math.round(data.OverallAvg * 25)}%</p>
                    </div>
                </div>

                {/* Performance Metrics Bars */}
                <div className="space-y-6">
                  {/* Student Progress */}
                  <MetricBar label="Student Evaluation" value={data.StudentPercentage} />
                  {/* Peer Progress */}
                  <MetricBar label="Peer Review" value={data.PeerPercentage} />
                  {/* KPI Progress */}
                  <MetricBar label="KPI Compliance" value={data.KPIPercentage} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Reusable Metric Bar Component with Dynamic Color Logic
function MetricBar({ label, value }) {
    const getColor = (v) => {
        if (v >= 80) return 'bg-green-600';
        if (v >= 60) return 'bg-orange-500';
        if (v <= 30) return 'bg-red-600';
        return 'bg-blue-500';
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                <span>{label}</span>
                <span className="text-gray-700">{value}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${getColor(value)}`}
                    style={{ width: `${value}%` }}
                ></div>
            </div>
        </div>
    );
}

export default FilterPerformance;