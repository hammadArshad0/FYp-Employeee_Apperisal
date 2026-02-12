import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Target, BarChart3, ShieldCheck, 
  ClipboardList, PlusCircle, Lock, GraduationCap,
  ArrowRightCircle
} from 'lucide-react';

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Director' };

  // Director Specific Stats
  const stats = [
    { label: 'Total Departments', val: '08', icon: <Target size={18} /> },
    { label: 'Total Faculty', val: '142', icon: <Users size={18} /> },
    { label: 'Uni. Performance', val: '78%', icon: <BarChart3 size={18} /> },
    { label: 'Pending Evals', val: '24', icon: <ClipboardList size={18} /> },
  ];

  // Director Actions matching your menu items
  const actions = [
   
    { 
      title: " Questionnaire Form", 
      desc: "Create  Questionnaire", 
      icon: <GraduationCap size={24} />, 
      path: "/director-dashboard/make-questionnaire",
      color: "hover:border-blue-600 hover:bg-blue-50"
    },
    { 
      title: "Add KPIs", 
      desc: "Define University KPIs", 
      icon: <PlusCircle size={24} />, 
      path: "/director-dashboard/add-kpi",
      color: "hover:border-emerald-600 hover:bg-emerald-50"
    },
    { 
      title: "See Performance", 
      desc: "Sensitive Evaluations", 
      icon: <BarChart3 size={24} />, 
      path: "/director-dashboard/performance",
      color: "hover:border-red-600 hover:bg-red-50"
    },
     { 
      title: "Confidential Evaluations", 
      desc: "View sensitive evaluations", 
      icon: <Lock size={24} />, 
      path: "/director-dashboard/confidential",
      color: "hover:border-green-600 hover:bg-green-50"
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner - Same Green as HOD */}
      <div className="bg-green-700 rounded-2xl p-8 text-white shadow-lg flex justify-between items-center overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2 tracking-tight">Director Dashboard</h2>
          <p className="text-green-50 text-lg opacity-90 font-medium">
            Welcome, {user.name}. Employee performance Apperisal.
          </p>
        </div>

      </div>

    

      {/* 2. Quick Action Cards */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-gray-800">Quick Actions</h3>
        
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
            </button>
          ))}
        </div>
      </div>

    

    </div>
  );
};

export default DirectorDashboard;