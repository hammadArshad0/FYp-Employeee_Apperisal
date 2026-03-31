import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, BookOpen } from 'lucide-react';
import DataService from '../../services/axios';

const EvaluationModal = ({ isOpen, onClose, teacherData }) => {
  const [evaluations, setEvaluations] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && teacherData && teacherData.EnrolledCourses) {
      const initialEvals = teacherData.EnrolledCourses.map(course => ({
        courseCode: course.Code || course.Id,
        courseName: course.Course,
        paperStatus: 'on-time', 
        folderStatus: 'on-time'
      }));
      setEvaluations(initialEvals);
    }
  }, [teacherData, isOpen]);

  if (!isOpen || !teacherData) return null;

  const handleStatusChange = (index, field, value) => {
    const updated = [...evaluations];
    updated[index][field] = value;
    setEvaluations(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Yahan payload ko Backend DTO (EvaluationRequestDTO) ke mutabiq format kiya hai
    const payload = {
      TeacherID: teacherData.TeacherID,
      SessionID: parseInt(localStorage.getItem('sessionId')) || 1, // Dynamic Session ID
      HODID: localStorage.getItem('userId') || "HOD-01", 
      Evaluations: evaluations.map(e => ({
        CourseCode: e.courseCode,
        PaperStatus: e.paperStatus, // "on-time" ya "late"
        FolderStatus: e.folderStatus
      }))
    };

    try {
      // Backend Route: /api/CourseManagement/SaveEvaluation
      const res = await DataService.post('/CourseManagement/SaveEvaluation', payload);
      alert(res.data.message || "Evaluation Saved Successfully!");
      onClose();
    } catch (err) {
      console.error("Save Error:", err);
      const serverError = err.response?.data?.Message || "Server connection failed";
      alert("Failed: " + serverError);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 to-green-600 p-6 text-white flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
               <BookOpen size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black leading-tight">{teacherData.TeacherName}</h2>
              <p className="text-green-100 text-xs font-bold uppercase tracking-widest">
                Evaluation for {evaluations.length} Courses
              </p>
            </div>
          </div>
          <button onClick={onClose} className="bg-black/10 hover:bg-black/20 p-2 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
          {evaluations.length === 0 && <p className="text-center text-gray-400 py-10">No courses found for evaluation.</p>}
          
          {evaluations.map((evalItem, index) => (
            <div key={index} className="mb-6 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-green-600 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                  {evalItem.courseCode}
                </span>
                <h4 className="font-bold text-gray-800">{evalItem.courseName}</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Paper Status */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Paper Submission</label>
                  <select 
                    value={evalItem.paperStatus}
                    onChange={(e) => handleStatusChange(index, 'paperStatus', e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-gray-100 font-bold text-gray-700 focus:border-green-500 outline-none cursor-pointer"
                  >
                    <option value="on-time">✅ On Time</option>
                    <option value="late">❌ Late</option>
                  </select>
                </div>

                {/* Folder Status */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Folder Submission</label>
                  <select 
                    value={evalItem.folderStatus}
                    onChange={(e) => handleStatusChange(index, 'folderStatus', e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-gray-100 font-bold text-gray-700 focus:border-green-500 outline-none cursor-pointer"
                  >
                    <option value="on-time">✅ On Time</option>
                    <option value="late">❌ Late</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-white flex gap-3">
          <button onClick={onClose} className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving || evaluations.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-4 rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            {isSaving ? (
              <><Loader2 className="animate-spin" size={20} /> Saving...</>
            ) : (
              <><Save size={20} /> Submit Evaluation</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationModal;