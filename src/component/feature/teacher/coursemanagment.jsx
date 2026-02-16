import React from 'react';
import { BookOpen, FileText, Download, MoreVertical } from 'lucide-react';

const SeeCourseManagement = () => {
  const courses = [
    { id: 1, title: 'Web Technologies', code: 'CS-301', students: 45, progress: 75 },
    { id: 2, title: 'Software Engineering', code: 'SE-102', students: 38, progress: 40 },
    { id: 3, title: 'Database Systems', code: 'CS-202', students: 52, progress: 90 },
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Course Management</h2>
        <p className="text-gray-500">Manage your course outlines, resources, and student progress.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm group hover:border-green-300 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-50 p-3 rounded-2xl text-green-700 group-hover:bg-green-700 group-hover:text-white transition-all">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="font-black text-gray-800 leading-tight">{course.title}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{course.code}</p>
                </div>
              </div>
              <button className="text-gray-300 hover:text-gray-600"><MoreVertical size={20} /></button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                <span className="text-gray-400">Course Completion</span>
                <span className="text-green-700">{course.progress}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-green-600 h-full rounded-full transition-all duration-1000" style={{ width: `${course.progress}%` }}></div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-700 py-2.5 rounded-xl text-xs font-black uppercase transition-all border border-transparent hover:border-green-100">
                <FileText size={16} /> HOd Remarks
              </button>
              {/* <button className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-700 py-2.5 rounded-xl text-xs font-black uppercase transition-all border border-transparent hover:border-green-100">
                <Download size={16} /> Resources
              </button> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeeCourseManagement;