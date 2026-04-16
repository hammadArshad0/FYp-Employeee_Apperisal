import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Users, ClipboardCheck, BookOpen, 
  ArrowRightCircle, Award, CheckCircle 
} from 'lucide-react';

const TeacherStats = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Instructor' };

  // Teacher Actions - Matching Director Dashboard Style
  const actions = [
    { 
      title: "Performance", 
      desc: "Detailed KPI & Evaluations", 
      icon: <TrendingUp size={24} />, 
      path: "/teacher-dashboard/performance",
      color: "hover:border-green-600 hover:bg-green-50"
    },
    { 
      title: "Class Reports", 
      desc: "Daily CHR Status & History", 
      icon: <ClipboardCheck size={24} />, 
      path: "/teacher-dashboard/Class-report",
      color: "hover:border-purple-600 hover:bg-purple-50"
    },
    { 
      title: "Course Management", 
      desc: "Outlines & Resources", 
      icon: <BookOpen size={24} />, 
      path: "/teacher-dashboard/courses",
      color: "hover:border-orange-600 hover:bg-orange-50"
    },
    { 
      title: "Peer Evaluation", 
      desc: "Evaluate Your Colleagues", 
      icon: <Users size={24} />, 
      path: "/teacher-dashboard/peer",
      color: "hover:border-blue-600 hover:bg-blue-50"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 1. Welcome Banner - Exactly like Director Dashboard */}
      <div className="bg-green-700 rounded-2xl p-8 text-white shadow-lg flex justify-between items-center overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2 tracking-tight">Teacher Dashboard</h2>
          <p className="text-green-50 text-lg opacity-90 font-medium">
            Welcome, {user.name}. Employee Performance Appraisal.
          </p>
        </div>
        {/* Decorative Icon for background */}
        {/* <Award size={120} className="absolute -right-4 -bottom-4 text-white opacity-10 rotate-12" /> */}
      </div>

      {/* 2. Quick Action Cards - Grid Style */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black text-gray-800 tracking-tight">Quick Actions</h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Module</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-start p-6 bg-white border-2 border-transparent rounded-2xl shadow-sm transition-all duration-200 text-left group ${action.color}`}
            >
              <div className="mb-4 p-3 bg-gray-50 rounded-xl group-hover:bg-white group-hover:shadow-md transition-all text-gray-600 group-hover:text-inherit">
                {action.icon}
              </div>
              <h4 className="text-lg font-black text-gray-800 mb-1 leading-tight">{action.title}</h4>
              <p className="text-sm text-gray-500 font-medium leading-tight">{action.desc}</p>
              
              <div className="mt-4 flex items-center gap-1 text-[10px] font-black text-green-700 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                Open Module <ArrowRightCircle size={12} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Small Info Section (Optional) */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
        <div className="bg-blue-0  p-3 rounded-full">
            {/* <CheckCircle size={20} /> */}
        </div>
        {/* <p className="text-sm text-gray-600 font-medium">
          Your last <span className="font-bold text-gray-800">Peer Evaluation</span> completed successfully. View your <span className="font-bold text-gray-800">Performance Report</span> for details.</p> */}
      </div>

    </div>
  );
};

export default TeacherStats;