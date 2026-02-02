import React from 'react';
import { BarChart3, Download, Activity, Lock as LockIcon } from 'lucide-react';

const SeePerformance = () => {
  const performanceData = [
    { name: "Ahsan", score: 85, color: "bg-orange-500" },
    { name: "Zahid", score: 92, color: "bg-green-600" },
    { name: "Iqbal", score: 75, color: "bg-red-500" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Employee Performance Dashboard</h1>
          <p className="text-gray-500 font-medium text-sm">Session: Fall 2025 • Performance </p>
        </div>
        <button className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md">
          <Download size={18} /> View performance
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Enhanced Bar Chart (Exactly like your request) */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h3 className="font-black text-slate-800 text-sm tracking-tight">Teacher Performance Comparison</h3>
            <BarChart3 size={18} className="text-green-600" />
          </div>

          {/* Graph Plot Area */}
          <div className="relative h-64 w-full flex items-end justify-around px-2 mb-2">
            
            {/* Background Grid Lines (Dotted) */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[100, 75, 50, 25, 0].map((mark) => (
                <div key={mark} className="w-full flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-300 w-6">{mark}</span>
                  <div className="flex-1 border-t border-dashed border-gray-100"></div>
                </div>
              ))}
            </div>

            {/* Actual Bars */}
            {performanceData.map((data, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center group w-full max-w-[60px]">
                {/* Score Tooltip on Hover */}
                <div className="absolute -top-8 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {data.score}%
                </div>
                
                {/* Animated Bar */}
                <div 
                  className={`${data.color} w-full rounded-t-xl transition-all duration-1000 ease-out shadow-lg group-hover:brightness-110`}
                  style={{ height: `${data.score * 2}px` }} // Scaled height for better visibility
                >
                  <div className="w-full h-full bg-white/10 rounded-t-xl"></div>
                </div>
                
                {/* Name Label */}
                <p className="mt-4 text-xs font-black text-slate-600">{data.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Doughnut Chart */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center">
          <h3 className="font-black text-slate-800 text-sm self-start mb-8">Weight Distribution</h3>
          <div className="relative w-44 h-44 mb-8">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              <circle cx="18" cy="18" r="16" fill="none" stroke="#f1f5f9" strokeWidth="4"></circle>
              <circle cx="18" cy="18" r="16" fill="none" stroke="#16a34a" strokeWidth="4" strokeDasharray="75, 100"></circle>
              <circle cx="18" cy="18" r="16" fill="none" stroke="#2563eb" strokeWidth="4" strokeDasharray="15, 100" strokeDashoffset="-75"></circle>
              <circle cx="18" cy="18" r="16" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="10, 100" strokeDashoffset="-90"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-slate-800 leading-none">Weight</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Distribution</span>
            </div>
          </div>
          <div className="w-full grid grid-cols-1 gap-2">
            <LegendItem color="bg-green-600" label="Academics" val="75%" />
            <LegendItem color="bg-blue-600" label="Society" val="15%" />
            <LegendItem color="bg-orange-500" label="Admin" val="10%" />
          </div>
        </div>

        {/* Right: Progress Metrics */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <h3 className="font-black text-slate-800 text-sm mb-8 tracking-tight">Evaluation Details</h3>
          <div className="space-y-6">
            <ProgressItem label="Peer Evaluation" val={85} />
            <ProgressItem label="Student Evaluation" val={92} />
            <ProgressItem label="Confidential Eval" val={78} locked={true} />
            <ProgressItem label="CHR Reports" val={95} />
          </div>
        </div>
      </div>

      {/* Footer Insight */}
      <div className="bg-green-700 p-6 rounded-3xl flex items-center gap-5 text-white shadow-xl shadow-green-100">
        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
          <Activity size={24} />
        </div>
        <div>
          <h4 className="font-black text-lg leading-tight"></h4>
          <p className="text-green-100 text-sm font-medium opacity-90">Employee performnce Apperisal</p>
        </div>
      </div>
    </div>
  );
};

// Helper Components for Cleaner Code
const LegendItem = ({ color, label, val }) => (
  <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-xl px-3 border border-gray-50">
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
      <span className="text-xs font-bold text-slate-600">{label}</span>
    </div>
    <span className="text-xs font-black text-slate-800">{val}</span>
  </div>
);

const ProgressItem = ({ label, val, locked }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight flex items-center gap-1">
        {label} {locked && <LockIcon size={12} className="text-orange-500" />}
      </span>
      <span className="text-xs font-black text-green-700">{val}%</span>
    </div>
    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
      <div className="bg-green-600 h-full rounded-full transition-all duration-1000" style={{ width: `${val}%` }}></div>
    </div>
  </div>
);

export default SeePerformance;