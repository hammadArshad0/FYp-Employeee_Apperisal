import React, { useState } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { 
  BarChart2, FileText, Users, LogOut, 
  LayoutDashboard, UserCircle, ClipboardCheck, BookOpen, Menu, X 
} from 'lucide-react';

const Teacherlayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile toggle state
  const user = JSON.parse(localStorage.getItem('user')) || {};

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/teacher-dashboard', icon: <LayoutDashboard size={22} /> },
    { name: 'See Performance', path: '/teacher-dashboard/performance', icon: <BarChart2 size={22} /> },
    { name: 'Class Held Report', path: '/teacher-dashboard/Class-report', icon: <ClipboardCheck size={22} /> },
    { name: 'Course Management', path: '/teacher-dashboard/courses', icon: <BookOpen size={22} /> },
    { name: 'Peer Evaluation', path: '/teacher-dashboard/peer', icon: <Users size={22} /> },
  ];

  // Helper to close sidebar on mobile after clicking link
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* --- MOBILE OVERLAY --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col shadow-xl 
        transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b bg-green-700 border-gray-100 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <BookOpen size={24} />
            <h1 className="text-xl font-black tracking-tight">Portal</h1>
          </div>
          {/* Close button for mobile */}
          <button onClick={closeSidebar} className="lg:hidden p-1 hover:bg-green-600 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 mt-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                location.pathname === item.path
                  ? 'bg-green-700 text-white shadow-lg shadow-green-200'
                  : 'text-gray-500 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN SECTION --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* --- HEADER --- */}
        <header className="h-20 bg-white border-b border-gray-200 px-4 sm:px-8 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Hamburger for mobile */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <h2 className="hidden sm:block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Teacher Panel</h2>
              <p className="text-md sm:text-lg font-black text-gray-800 truncate max-w-[150px] sm:max-w-none">
                {menuItems.find(item => item.path === location.pathname)?.name || 'Welcome'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 bg-gray-50 px-3 sm:px-5 py-2 rounded-2xl border border-gray-100">
            <div className="text-right border-r pr-3 sm:pr-4 border-gray-300 hidden xs:block">
              <p className="text-xs sm:text-sm font-black text-gray-900 uppercase leading-none mb-1 truncate max-w-[100px]">
                {user.name || 'Instructor'}
              </p>
              <p className="text-[9px] sm:text-[11px] text-green-700 font-bold uppercase tracking-tighter">
                ID: {user.id || 'N/A'}
              </p>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-700 rounded-full flex items-center justify-center text-white shadow-md flex-shrink-0">
              <UserCircle size={20} className="sm:w-6 sm:h-6" strokeWidth={2.5} />
            </div>
          </div>
        </header>

        {/* --- DYNAMIC CONTENT --- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Teacherlayout;