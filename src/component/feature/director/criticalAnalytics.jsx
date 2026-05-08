import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import DataService from '../../../services/axios';

const CriticalAnalytics = () => {
  const [evalType, setEvalType] = useState('All');
  const [data, setData] = useState([]);
  const [selectedDetails, setSelectedDetails] = useState(null);

  useEffect(() => {
    fetchData();
  }, [evalType]);

  const fetchData = async () => {
    try {
      const res = await DataService.get(`/Analytics/GetCriticalAnalysis?type=${evalType}`);
      setData(res.data || []);
    } catch (err) {
      setData([]);
    }
  };

  const starIcons = ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐"];

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      {/* Page Header */}
      <div className="max-w-5xl mx-auto mb-10 flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-100">C</div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Critical Analysis</h1>
        </div>
        <select 
          value={evalType} 
          onChange={(e) => setEvalType(e.target.value)} 
          className="bg-slate-100 border-none px-4 py-2 rounded-xl font-black text-slate-600 outline-none text-xs cursor-pointer hover:bg-slate-200 transition-all"
        >
          <option value="All">All Evaluations</option>
          <option value="Student">Student (S)</option>
          <option value="Peer">Peer (T)</option>
        </select>
      </div>

      {/* Analytics Cards */}
      <div className="max-w-5xl mx-auto grid gap-12">
        {data.map((q) => (
          <div key={q.QuestionId} className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-slate-200/40 border border-white">
            
            {/* Header: Question Text */}
            <div className="mb-8 px-2">
              <h2 className="text-lg font-black text-slate-800 leading-tight italic">
                "{q.QuestionText}"
              </h2>
            </div>

            {/* Rating Stats: Star + Count (Together) */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              {q.Distribution.map((item, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-3xl text-center shadow-sm">
                  <div className="text-sm mb-1">{starIcons[idx]}</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl font-black text-slate-800">{item.Count}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">count</span>
                  </div>
                </div>
              ))}
            </div>

            {/* The Graph */}
            <div className="h-52 w-full max-w-2xl mx-auto mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={q.Distribution}>
                  <XAxis dataKey="Label" axisLine={false} tickLine={false} fontSize={10} fontWeight="900" dy={10} />
                  <Bar 
                    dataKey="Count" 
                    radius={[10, 10, 0, 0]} 
                    barSize={60}
                    onClick={(dp) => setSelectedDetails({ 
                        label: `${q.QuestionText} - ${dp.Label} (${starIcons[dp.Score-1]})`, 
                        list: q.Details.filter(d => (d.Score || d.score) === dp.Score) 
                    })}
                  >
                    {q.Distribution.map((entry, index) => (
                      <Cell key={index} fill={['#f43f5e', '#fb923c', '#38bdf8', '#22c55e'][index]} className="cursor-pointer hover:opacity-80 transition-opacity" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Average & Button Row */}
            <div className="flex justify-between items-center border-t border-slate-50 pt-6 mt-4">
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                <span className="text-[9px] font-black uppercase text-blue-400">Average:</span>
                <span className="text-lg font-black text-blue-700 italic">{q.AverageScore}</span>
              </div>
              
              <button 
                onClick={() => setSelectedDetails({ label: q.QuestionText, list: q.Details })}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md flex items-center gap-2"
              >
                View Details <span className="text-lg opacity-50">›</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex justify-center items-center p-6 z-50">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-white">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <h3 className="font-black text-lg text-slate-800 uppercase italic tracking-tight">{selectedDetails.label}</h3>
              <button onClick={() => setSelectedDetails(null)} className="text-slate-400 hover:text-red-500 font-black text-3xl transition-colors">×</button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                    <th className="pl-4">Evaluator</th>
                    <th className="text-center">Score</th>
                    <th>To Teacher</th>
                    <th className="text-right pr-4">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDetails.list.map((item, i) => (
                    <tr key={i} className="bg-slate-50 hover:bg-blue-50 transition-colors">
                      <td className="py-4 pl-4 rounded-l-2xl border-l-4 border-blue-500">
                        <div className="font-black text-slate-700 text-xs uppercase">{item.EvaluatorName}</div>
                        <div className="text-[8px] text-slate-400 font-bold uppercase">ID: {item.EvaluatorID}</div>
                      </td>
                      <td className="py-4 text-center">
                        <span className="font-black text-slate-900 bg-white px-3 py-1 rounded-lg border shadow-sm text-sm">{item.Score}</span>
                      </td>
                      <td className="py-4 font-bold text-slate-600 text-xs uppercase">{item.EvaluateeName}</td>
                      <td className="py-4 pr-4 rounded-r-2xl text-right">
                        <span className={`text-[8px] font-black px-3 py-1 rounded-lg ${item.Role === 'Student' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                          {item.Role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriticalAnalytics;