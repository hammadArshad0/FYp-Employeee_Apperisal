// src/pages/ClassHeldReport.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronRight } from 'lucide-react';

const ClassHeldReport = () => {
  const navigate = useNavigate();

  // Mock Data
  const reports = [
    { id: 1, date: '25 Nov 2025', count: 2, status: 'Completed' },
    { id: 2, date: '24 Nov 2025', count: 2, status: 'Action Required' },
    { id: 3, date: '23 Nov 2025', count: 1, status: 'Completed' },
    { id: 4, date: '22 Nov 2025', count: 3, status: 'Completed' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* Header Section (Purple Theme) */}
      <div className="bg-purple-700 text-white pb-20 pt-8 px-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => navigate('/teacher-dashboard')} 
            className="flex items-center text-purple-100 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">Class Held Report (CHR)</h1>
          <p className="text-purple-200 mt-2">View your daily performance record and attendance history.</p>
        </div>
      </div>

      {/* Main Content List */}
      <div className="max-w-4xl mx-auto px-8 -mt-12 pb-12">
        <div className="space-y-4">
          
          {reports.map((item) => (
            <div 
              key={item.id} 
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">CHR Report of {item.date}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> {item.date}
                    </span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>{item.count} records</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => navigate('/teacher/chr-details', { state: { report: item } })}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-200"
              >
                View Details <ChevronRight size={18} />
              </button>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};

export default ClassHeldReport;