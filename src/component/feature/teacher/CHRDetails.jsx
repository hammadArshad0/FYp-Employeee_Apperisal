// src/pages/CHRDetails.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

const CHRDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const report = location.state?.report || { date: '24 Nov 2025' };

  // Mock Data for specific day
  const classes = [
    {
      id: 1,
      subject: "Web Technologies (WT)",
      status: "Not Held",
      date: "24 Nov 2025",
      teacher: "Mr. Muhammad Ahsan",
      discipline: "BCS-4A",
      lateIn: "--",
      leftEarly: "--",
      remarks: "Class not conducted due to faculty meeting.",
    },
    {
      id: 2,
      subject: "Database Systems (DBS)",
      status: "Held",
      date: "24 Nov 2025",
      teacher: "Mr. Muhammad Ahsan",
      discipline: "BCS-5B",
      lateIn: "--",
      leftEarly: "10 minutes",
      remarks: "Left early for administrative work.",
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* Header (Purple) */}
      <div className="bg-purple-700 text-white pb-20 pt-8 px-8">
        <div className="max-w-5xl mx-auto">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-purple-100 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={20} className="mr-2" /> Back to Reports
          </button>
          <h1 className="text-3xl font-bold">CHR Details</h1>
          <p className="text-purple-200 mt-2">Detailed class records for <span className="font-bold text-white">{report.date}</span>.</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-5xl mx-auto px-8 -mt-12 pb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {classes.map((cls) => {
          const isHeld = cls.status === "Held";
          
          return (
            <div 
              key={cls.id} 
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300
                ${isHeld ? 'border-green-100' : 'border-red-100'}
              `}
            >
              {/* Card Header */}
              <div className={`px-6 py-4 flex justify-between items-center border-b
                  ${isHeld ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}
              `}>
                <h3 className={`font-bold text-lg ${isHeld ? 'text-gray-800' : 'text-gray-800'}`}>{cls.subject}</h3>
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1
                  ${isHeld ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                `}>
                  {isHeld ? <CheckCircle size={12}/> : <AlertCircle size={12}/>}
                  {cls.status}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Date</p>
                    <p className="font-semibold text-gray-700">{cls.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Teacher</p>
                    <p className="font-semibold text-gray-700">{cls.teacher}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Discipline</p>
                    <p className="font-semibold text-gray-700">{cls.discipline}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Status</p>
                    <p className={`font-semibold ${isHeld ? 'text-green-600' : 'text-red-500'}`}>{cls.status}</p>
                  </div>
                </div>

                {/* Timing Info */}
                <div className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex-1">
                     <p className="text-xs text-gray-500 mb-1">Late In</p>
                     <p className="font-bold text-gray-800">{cls.lateIn}</p>
                  </div>
                  <div className="w-px bg-gray-200"></div>
                  <div className="flex-1">
                     <p className="text-xs text-gray-500 mb-1">Left Early</p>
                     <p className="font-bold text-gray-800">{cls.leftEarly}</p>
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">Remarks</p>
                  <p className="text-sm text-gray-600 italic leading-relaxed">"{cls.remarks}"</p>
                </div>

              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
};

export default CHRDetails;