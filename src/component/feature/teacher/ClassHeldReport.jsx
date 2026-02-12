import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

const ClassHeldReport = () => {
  const navigate = useNavigate();

  const reports = [
    { id: 1, date: '25 Nov 2025', count: 2, status: 'Completed' },
    { id: 2, date: '24 Nov 2025', count: 2, status: 'Completed' },
    { id: 3, date: '23 Nov 2025', count: 1, status: 'Completed' },
    { id: 4, date: '22 Nov 2025', count: 3, status: 'Completed' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Green Banner Section */}
      <div className="bg-green-700 rounded-2xl p-8 text-white shadow-lg flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 tracking-tight">Class Held Report (CHR)</h1>
          <p className="text-green-50 text-lg opacity-90 font-medium">
            Review your daily class attendance and conduct records.
          </p>
        </div>
        <Calendar size={120} className="absolute -right-4 -bottom-4 text-white opacity-10 rotate-12" />
      </div>

      {/* Main List */}
      <div className="grid grid-cols-1 gap-4">
        {reports.map((item) => (
          <div 
            key={item.id} 
            className="bg-white p-6 rounded-2xl border-2 border-transparent hover:border-green-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between hover:shadow-xl transition-all group"
          >
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-xl ${item.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                <FileText size={28} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800 group-hover:text-green-700 transition-colors">
                  Report of {item.date}
                </h3>
                <div className="flex items-center gap-3 text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {item.date}</span>
                  <span className="w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
                  <span className={`flex items-center gap-1 ${item.status === 'Completed' ? 'text-green-600' : 'text-orange-500'}`}>
                    {item.status === 'Completed' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {item.status}
                  </span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => navigate('/teacher-dashboard/Class-report/details', { state: { report: item } })}
              className="mt-4 md:mt-0 bg-gray-50 group-hover:bg-green-700 group-hover:text-white text-gray-600 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-gray-100"
            >
              View Details <ChevronRight size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassHeldReport;