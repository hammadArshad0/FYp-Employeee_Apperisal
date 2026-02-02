import React, { useState } from 'react';
import { BookOpen, PlusCircle, Trash2, Search, GraduationCap } from 'lucide-react';

const CourseManagement = () => {
  const [courses, setCourses] = useState([
    { id: 1, code: 'CS-101', name: 'Introduction to Computing', teacher: 'Dr. Asma', students: 45 },
    { id: 2, code: 'CS-202', name: 'Data Structures', teacher: 'Mr. Zahid', students: 38 },
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-green-700 p-3 rounded-xl text-white">
            <GraduationCap size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800">Course Management</h1>
            <p className="text-sm text-gray-500 font-medium">Manage departmental courses and teacher assignments</p>
          </div>
        </div>
        <button className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-100">
          <PlusCircle size={20} /> Add New Course
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Courses</p>
          <p className="text-3xl font-black text-gray-800">18</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Assigned</p>
          <p className="text-3xl font-black text-green-700">15</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Pending</p>
          <p className="text-3xl font-black text-orange-500">03</p>
        </div>
      </div>

      {/* Course Table/List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-black text-gray-700 uppercase text-sm tracking-widest">Active Curriculum</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search course..." 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-green-600 outline-none w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white">
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Code</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Course Name</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">Instructor</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-center">Students</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-green-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-green-700">{course.code}</td>
                  <td className="px-6 py-4 font-bold text-gray-800">{course.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600 border border-gray-200">
                        {course.teacher.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-semibold text-gray-600">{course.teacher}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-bold">
                      {course.students}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default CourseManagement;