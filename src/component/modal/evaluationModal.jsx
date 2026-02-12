import React, { useState } from 'react';
import { X } from 'lucide-react';

const EvaluationModal = ({ isOpen, onClose, teacherData }) => {
  // Har course ke liye individual states maintain karne ke liye
  const [evaluations, setEvaluations] = useState({});

  if (!isOpen || !teacherData) return null;

  const handleSelection = (courseId, type, value) => {
    setEvaluations(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        [type]: value
      }
    }));
  };

  const handleComment = (courseId, comment) => {
    setEvaluations(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        comment: comment
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-green-700 italic">
            Evaluate {teacherData.teacher}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {teacherData.enrolledCourses.map((course) => (
            <div key={course.id} className="border border-green-100 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-gray-800 uppercase tracking-tight">
                {course.course} ({course.code})
              </h3>

              {/* Paper Submission Toggle */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600 italic">Paper Submission on Time</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSelection(course.id, 'paper', 'on-time')}
                    className={`py-2.5 rounded-xl border-2 font-bold transition-all ${
                      evaluations[course.id]?.paper === 'on-time'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-gray-100 text-gray-400'
                    }`}
                  >
                    Yes (On Time)
                  </button>
                  <button
                    onClick={() => handleSelection(course.id, 'paper', 'late')}
                    className={`py-2.5 rounded-xl border-2 font-bold transition-all ${
                      evaluations[course.id]?.paper === 'late'
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'border-gray-100 text-gray-400'
                    }`}
                  >
                    No (Late)
                  </button>
                </div>
              </div>

              {/* Folder Submission Toggle */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600 italic">Folder Submission on Time</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSelection(course.id, 'folder', 'on-time')}
                    className={`py-2.5 rounded-xl border-2 font-bold transition-all ${
                      evaluations[course.id]?.folder === 'on-time'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-gray-100 text-gray-400'
                    }`}
                  >
                    Yes (On Time)
                  </button>
                  <button
                    onClick={() => handleSelection(course.id, 'folder', 'late')}
                    className={`py-2.5 rounded-xl border-2 font-bold transition-all ${
                      evaluations[course.id]?.folder === 'late'
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'border-gray-100 text-gray-400'
                    }`}
                  >
                    No (Late)
                  </button>
                </div>
              </div>

              {/* Comment Input */}
              <input
                type="text"
                placeholder="Write any comments..."
                onChange={(e) => handleComment(course.id, e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-green-500 transition-all text-sm"
              />
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
                console.log("Evaluation Data:", evaluations);
                onClose();
            }}
            className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 active:scale-95 transition-all"
          >
            Save Evaluation
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationModal;