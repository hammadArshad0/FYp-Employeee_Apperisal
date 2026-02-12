import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, User, Book, GraduationCap, Clock } from 'lucide-react';

const CHRDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const report = location.state?.report || { date: '24 Nov 2025' };

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
      leftEarly: "10 mins",
      remarks: "Left early for administrative work.",
    }
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      
      {/* Header with Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-green-700 hover:text-green-800 font-bold text-sm mb-2 transition-colors"
          >
            <ArrowLeft size={18} className="mr-1" /> Back to List
          </button>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">CHR Analysis</h1>
          <p className="text-gray-500 font-medium">Viewing details for <span className="text-green-700 font-bold">{report.date}</span></p>
        </div>
      </div>

      {/* Grid for Class Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {classes.map((cls) => {
          const isHeld = cls.status === "Held";
          return (
            <div key={cls.id} className={`bg-white rounded-[2rem] border-2 shadow-sm overflow-hidden transition-all hover:shadow-md ${isHeld ? 'border-green-100' : 'border-red-100'}`}>
              
              {/* Card Title Bar */}
              <div className={`px-6 py-4 flex justify-between items-center ${isHeld ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-3">
                  <Book size={20} className={isHeld ? 'text-green-600' : 'text-red-600'} />
                  <h3 className="font-black text-gray-800">{cls.subject}</h3>
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 ${isHeld ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                  {isHeld ? <CheckCircle size={12} /> : <AlertCircle size={12} />} {cls.status}
                </span>
              </div>

              {/* Data Rows */}
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <User size={16} className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Instructor</p>
                      <p className="text-sm font-bold text-gray-700">{cls.teacher}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <GraduationCap size={16} className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Discipline</p>
                      <p className="text-sm font-bold text-gray-700">{cls.discipline}</p>
                    </div>
                  </div>
                </div>

                {/* Late/Early Timing Box */}
                <div className="bg-gray-50 rounded-2xl p-4 flex justify-around border border-gray-100">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Late In</p>
                    <p className={`text-sm font-black ${cls.lateIn !== '--' ? 'text-red-600' : 'text-gray-700'}`}>{cls.lateIn}</p>
                  </div>
                  <div className="w-px bg-gray-200"></div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Left Early</p>
                    <p className={`text-sm font-black ${cls.leftEarly !== '--' ? 'text-red-600' : 'text-gray-700'}`}>{cls.leftEarly}</p>
                  </div>
                </div>

                {/* Remarks Section */}
                <div className="bg-green-50/30 p-4 rounded-2xl border border-green-100/50">
                  <p className="text-[10px] font-black text-green-700 uppercase mb-1 flex items-center gap-1">
                    <Clock size={12} /> Remarks
                  </p>
                  <p className="text-sm text-gray-600 italic font-medium">"{cls.remarks}"</p>
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