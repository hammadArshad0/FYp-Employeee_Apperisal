import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 

  PlusCircle, UserPlus, BarChart3, Settings 
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();


    const user = JSON.parse(localStorage.getItem('user')) || { name: 'Hod' };


  const actions = [
    { 
      title: "Add New KPI", 
      desc: "Define performance metrics", 
      icon: <PlusCircle size={24} />, 
      path: "/hod-dashboard/add-kpi",

      color: "hover:border-green-600 hover:bg-green-50 bg-green-500"
    },
    { 
      title: "Add Evaluator", 
      desc: "Assign peer reviews", 
      icon: <UserPlus size={24} />, 
      path: "/hod-dashboard/add-evaluator",
      color: "hover:border-blue-600 hover:bg-blue-50"
    },
    { 
      title: "Performance", 
      desc: "View analytics & graphs", 
      icon: <BarChart3 size={24} />, 
      path: "/hod-dashboard/performance",
      color: "hover:border-emerald-600 hover:bg-emerald-50"
    },
    { 
      title: " Course Management", 
      desc: "Manage courses & staff", 
      icon: <Settings size={24} />, 
      path: "/hod-dashboard/courses",
      color: "hover:border-purple-600 hover:bg-purple-50"
    },
      { 
      title: " CHR", 
      desc: "Manage courses & staff", 
      icon: <Settings size={24} />, 
      path: "/hod-dashboard/chr",
      color: "hover:border-purple-600 hover:bg-purple-50"
    },
      { 
      title: "Society Management", 
      desc: "Manage courses & staff", 
      icon: <Settings size={24} />, 
      path: "/hod-dashboard/societies",
      color: "hover:border-purple-600 hover:bg-purple-50"
    }
  ];

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-green-700 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-3xl font-black mb-2 tracking-tight">HOD Dashboard</h2>
        <p className="text-green-50 text-lg opacity-90">
          Welcome ,{user.name} Employee Performance Apperisal.
        </p>
      </div>

  

 
      <div className="space-y-4">
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.2em]">Quick Actions</h3>
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
              <h4 className="text-lg font-black text-gray-800 mb-1">{action.title}</h4>
              <p className="text-sm text-gray-500 font-medium">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>



    </div>
  );
};

export default Dashboard;