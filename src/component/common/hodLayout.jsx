import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, UserPlus, BarChart3, LayoutDashboard, 
  LogOut, BookOpen, Menu, X ,ChevronDown,

} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = [
    { name: 'Dashboard', path: '/hod-dashboard', icon: <LayoutDashboard size={30} /> },
    { name: 'Add KPI', path: '/hod-dashboard/add-kpi', icon: <Plus size={30} /> },
    { name: 'Add Peer Evaluator', path: '/hod-dashboard/add-evaluator', icon: <UserPlus size={30} /> },
    { name: 'See Performance', path: '/hod-dashboard/performance', icon: <BarChart3 size={30} /> },
    { name: 'Course Management', path: '/hod-dashboard/courses', icon: <BookOpen size={30} /> },
    { name: 'CHR', path: '/hod-dashboard/chr', icon: <BarChart3 size={30} /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={toggleSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200
        lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-green-600">
          <span className="text-white font-bold text-xl">HOD Dashboard</span>
          <button onClick={toggleSidebar} className="lg:hidden text-white"><X size={20} /></button>
        </div>

        <nav className="flex-1 p-4 space-y-5">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => window.innerWidth < 1024 && toggleSidebar()}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                location.pathname === item.path 
                ? 'bg-green-600 text-white' 
                : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 w-full rounded-md transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};


const Header = ({ toggleSidebar }) => {
  // LocalStorage se user data nikalna (Login ke waqt jo save kiya tha)
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Guest User', role: 'HOD' };

  // Name se initials nikalne ka function (e.g., "Dr. Munir" -> "DM")
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm">
      {/* Left Side: Menu & Identity */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="hidden md:block">
          <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Active Session</p>
          <h2 className="text-gray-800 font-black text-lg flex items-center gap-2">
            {user.role}: <span className="text-gray-500 font-bold">{user.name}</span>
          </h2>
        </div>
      </div>

      {/* Right Side: Profile & Notifications */}
        <div className="flex items-center gap-6">
        

        {/* User Profile Dropdown Look */}
        <div className="flex items-center gap-3 bg-gray-50 p-1.5 pr-4 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all group">
          <div className="w-10 h-10 bg-green-700 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg shadow-green-200 group-hover:scale-105 transition-transform">
            {getInitials(user.name)}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-black text-gray-800 leading-none mb-1">{user.name}</p>

          </div>
          {/* <ChevronDown size={14} className="text-gray-400 group-hover:text-green-600" /> */}
        </div>
      </div>
    </header>
  );
};



const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-auto p-6">
           <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;