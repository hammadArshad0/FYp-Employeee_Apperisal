import React from 'react';
import { Award, TrendingUp, CheckCircle2 } from 'lucide-react';

const SeePerformanceTeacher = () => {
  // Sirf aapki batai hui categories
  const performanceData = [
    { label: 'Student Evaluation', score: 90 },
    { label: 'Peer Evaluation', score: 85 },
    { label: 'Society Contribution', score: 70 },
    { label: 'Academic Score', score: 95 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 1. Header Banner */}
      <div className="bg-green-700 rounded-[2rem] p-8 text-white shadow-lg flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2 tracking-tight">Teacher Performance</h2>
          <p className="text-green-50 text-lg opacity-90 font-medium">
            Summary of your professional evaluations and contributions.
          </p>
        </div>
        <TrendingUp size={120} className="absolute -right-4 -bottom-4 text-white opacity-10 rotate-12" />
      </div>

      {/* 2. Main Graph Card */}
      <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-16">
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-2 italic">
            <CheckCircle2 className="text-green-600" size={24} />
            KPI Performance Scoreboard
          </h3>
          <div className="bg-green-50 px-6 py-2 rounded-2xl border border-green-100 flex items-center gap-2">
            {/* <Award className="text-green-600" size={18} /> */}
            {/* <span className="text-sm font-black text-green-700 uppercase tracking-widest">Grade: A+</span> */}
          </div>
        </div>

        {/* The Graph Area - 4 Boxes Only */}
        <div className="flex justify-around items-end gap-10 h-80 px-4 max-w-5xl mx-auto">
          {performanceData.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center h-full group">
              
              {/* Score Label (Floating) */}
              <div className="mb-4 transform translate-y-2 group-hover:-translate-y-1 transition-all duration-300">
                <span className="bg-green-700 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-lg">
                  {item.score}%
                </span>
              </div>

              {/* Main Container Box (Khaali Hissa) */}
              <div className="w-full max-w-[100px] h-full bg-gray-50 rounded-2xl border-2 border-gray-100 relative overflow-hidden flex items-end shadow-inner transition-all group-hover:border-green-300 group-hover:shadow-md">
                
                {/* The Filling Color (Green Hissa - Based on 90, 85 etc) */}
                <div 
                  className="w-full bg-green-600 rounded-b-[14px] transition-all duration-1000 ease-out relative group-hover:bg-green-500"
                  style={{ height: `${item.score}%` }}
                >
                  {/* Subtle Light Reflection on top of the green fill */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-white/30"></div>
                  
                  {/* Vertical Watermark inside the filled area */}
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white/20 rotate-90 uppercase tracking-widest whitespace-nowrap">
                    BIIT PERFORMANCE
                  </span>
                </div>
              </div>

              {/* Label at Bottom */}
              <div className="mt-8 text-center">
                <p className="text-xs font-black text-gray-500 uppercase tracking-tighter leading-tight mb-1 group-hover:text-green-700 transition-colors">
                  {item.label}
                </p>
                <div className="h-1.5 w-8 bg-gray-100 rounded-full mx-auto group-hover:w-12 group-hover:bg-green-600 transition-all"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend / Info Footer */}
        <div className="mt-20 pt-10 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center text-gray-400 gap-4">
           {/* <p className="text-[10px] font-black uppercase tracking-[0.2em]">Data Source: Quality Assurance Cell (QAC)</p> */}
           <div className="flex gap-6 items-center">
              <div className="flex items-center gap-2">
                {/* <div className="w-2 h-2 bg-green-600 rounded-full"></div> */}
                {/* <span className="text-[10px] font-bold uppercase tracking-widest">Achieved</span> */}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                {/* <span className="text-[10px] font-bold uppercase tracking-widest">Remaining</span> */}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SeePerformanceTeacher;