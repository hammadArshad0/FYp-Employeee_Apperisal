import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, BookOpen, MessageSquare } from 'lucide-react';
import DataService from '../../services/axios';

const EvaluationModal = ({ isOpen, onClose, teacherData }) => {
  const [evaluations, setEvaluations] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && teacherData && teacherData.EnrolledCourses) {
      const initialEvals = teacherData.EnrolledCourses.map(course => ({
        // Hum code bhej rahe hain kyunke backend isi se enrollment dhondega
        courseCode: course.Code || course.courseCode || course.code, 
        courseName: course.Course || course.title,
        paperStatus: 'on-time', 
        folderStatus: 'on-time',
        remarks: '' 
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
    
    // Payload ko Backend DTO ke mutabiq set kiya hai
    const payload = {
      TeacherID: teacherData.TeacherID,
      SessionID: teacherData.sessionId || teacherData.SessionID,
      HODID: localStorage.getItem('userId'),
      Evaluations: evaluations.map(e => ({
        CourseCode: e.courseCode, // Backend ab 'CourseCode' expect kar raha hai
        PaperStatus: e.paperStatus,
        FolderStatus: e.folderStatus,
        Remarks: e.remarks 
      }))
    };

    try {
      // API call
      const res = await DataService.post('/CourseManagement/SaveEvaluation', payload);
      alert(res.data.message || "Evaluation Saved Successfully!");
      onClose();
    } catch (err) {
      console.error("Save Error:", err);
      const errorMsg = err.response?.data?.Message || err.response?.data?.ExceptionMessage || "Failed to save";
      alert("Error: " + errorMsg);
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
              <h2 className="text-2xl font-black leading-none">{teacherData.TeacherName}</h2>
              <p className="text-green-100 text-[10px] font-bold uppercase tracking-widest mt-1">
                Faculty Evaluation • {evaluations.length} Courses
              </p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
          {evaluations.length === 0 && (
            <div className="text-center py-12">
               <p className="text-gray-400 font-medium">No courses found for this teacher.</p>
            </div>
          )}
          
          {evaluations.map((evalItem, index) => (
            <div key={index} className="mb-6 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-5">
                <span className="bg-green-100 text-green-700 text-[11px] font-black px-3 py-1 rounded-full border border-green-200">
                  {evalItem.courseCode}
                </span>
                <h4 className="font-bold text-gray-800 text-lg">{evalItem.courseName}</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Paper Status */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Paper Submission</label>
                  <select 
                    value={evalItem.paperStatus}
                    onChange={(e) => handleStatusChange(index, 'paperStatus', e.target.value)}
                    className="w-full p-3.5 rounded-2xl border-2 border-gray-50 bg-gray-50 font-bold text-gray-700 focus:bg-white focus:border-green-500 transition-all outline-none"
                  >
                    <option value="on-time">✅ On Time</option>
                    <option value="late">❌ Late</option>
                  </select>
                </div>

                {/* Folder Status */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Folder Submission</label>
                  <select 
                    value={evalItem.folderStatus}
                    onChange={(e) => handleStatusChange(index, 'folderStatus', e.target.value)}
                    className="w-full p-3.5 rounded-2xl border-2 border-gray-50 bg-gray-50 font-bold text-gray-700 focus:bg-white focus:border-green-500 transition-all outline-none"
                  >
                    <option value="on-time">✅ On Time</option>
                    <option value="late">❌ Late</option>
                  </select>
                </div>

                {/* Remarks Field */}
                <div className="col-span-full">
                  <label className="text-[11px] font-bold text-gray-500 uppercase ml-1 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-green-600" /> HOD Comments
                  </label>
                  <textarea 
                    placeholder="Write detailed feedback about paper or folder quality..."
                    value={evalItem.remarks}
                    onChange={(e) => handleStatusChange(index, 'remarks', e.target.value)}
                    className="w-full p-4 border-2 border-gray-50 bg-gray-50 rounded-2xl mt-2 text-sm focus:bg-white focus:border-green-500 outline-none h-28 resize-none transition-all"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-white flex items-center gap-4">
          <button 
            onClick={onClose} 
            className="px-8 py-4 font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving || evaluations.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-green-200 active:scale-95 transition-all"
          >
            {isSaving ? (
              <><Loader2 className="animate-spin" size={22} /> Processing...</>
            ) : (
              <><Save size={22} /> Finalize Evaluation</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationModal;