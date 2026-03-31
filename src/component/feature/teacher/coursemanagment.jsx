import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Loader2, AlertCircle } from 'lucide-react';
import DataService from '../../../services/axios';

const SeeCourseManagement = () => {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      // Logic: LocalStorage se ID aur Session uthana
      const teacherId = localStorage.getItem('userId'); 
      const sessionId = localStorage.getItem('sessionId') || 1; // Default to 1 if not found

      if (!teacherId) {
        setError("Teacher ID not found. Please login again.");
        return;
      }

      // API Call: Jo humne backend pe banayi thi
      const res = await DataService.get(`/CourseManagement/my-Courseperformance/${teacherId}/${sessionId}`);
      setPerformance(res.data);
    } catch (err) {
      console.error("Error fetching performance:", err);
      setError(err.response?.status === 404 ? "No remarks found yet." : "Failed to load performance data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-green-600">
        <Loader2 className="animate-spin mb-2" size={40} />
        <p className="font-bold">Loading your performance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">My Performance Details</h2>
        <p className="text-gray-500">View HOD remarks and submission status for the current session.</p>
      </div>

      {error ? (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex items-center gap-4 text-amber-700">
          <AlertCircle />
          <p className="font-bold">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {performance.map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm group hover:border-green-300 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-50 p-3 rounded-2xl text-green-700 group-hover:bg-green-700 group-hover:text-white transition-all">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800 leading-tight">{item.Activity}</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">KPI EVALUATION</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  item.Status === 'On Time' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {item.Status}
                </span>
              </div>

              {/* Remarks Section */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
                <div className="flex items-center gap-2 mb-2 text-gray-400">
                  <FileText size={14} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">HOD Remarks</span>
                </div>
                <p className="text-sm font-medium text-gray-700 italic">
                  "{item.Remarks}"
                </p>
              </div>

              {/* Score Indicator */}
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-gray-400">Obtained Score</span>
                  <span className="text-green-700">{item.ObtainedScore} / 5</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${item.ObtainedScore === 5 ? 'bg-green-600' : 'bg-amber-500'}`} 
                    style={{ width: `${(item.ObtainedScore / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeeCourseManagement;