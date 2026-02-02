// src/pages/TeacherDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Calendar, FileText, Users, LogOut, ChevronRight } from 'lucide-react';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-green-100 p-2 rounded-lg text-green-700">
            <BarChart2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Teacher Portal</h1>
            <p className="text-xs text-gray-500">Welcome, {user?.name || 'Instructor'}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Logout
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-10">
        
        {/* KPI Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Performance Overview</h2>
            <p className="text-gray-500 mb-6">Your current KPI score based on student evaluations and administrative tasks.</p>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-2xl font-bold text-green-700">89%</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Academics</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-2xl font-bold text-orange-700">10%</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Society</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-2xl font-bold text-blue-700">95%</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Admin</p>
              </div>
            </div>
          </div>
          
          {/* Simple Bar Chart Visual */}
          <div className="h-48 w-full md:w-1/3 flex items-end justify-between gap-2 px-4 border-b border-l border-gray-200">
            {[40, 70, 55, 90, 30, 80].map((h, i) => (
              <div key={i} className="w-full bg-green-600 rounded-t-md hover:opacity-80 transition-all" style={{ height: `${h}%` }}></div>
            ))}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* --- Class Held Report Card --- */}
          <div 
            onClick={() => navigate('/teacher/chr')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-lg hover:border-purple-200 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                <Calendar size={24} />
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-purple-600 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Class Held Report</h3>
            <p className="text-sm text-gray-500">View your daily class attendance and schedule report status.</p>
          </div>

          {/* Other Dummy Cards */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-lg hover:border-orange-200 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                <FileText size={24} />
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-orange-600 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Course Management</h3>
            <p className="text-sm text-gray-500">Manage course materials, outlines, and student resources.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-lg hover:border-teal-200 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-teal-100 text-teal-600 rounded-xl">
                <Users size={24} />
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-teal-600 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Society Mentorship</h3>
            <p className="text-sm text-gray-500">Evaluate and guide your assigned student societies.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;