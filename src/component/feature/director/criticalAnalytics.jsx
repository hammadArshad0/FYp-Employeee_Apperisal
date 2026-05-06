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
      // API call with selected type
      const res = await DataService.get(`/Analytics/GetCriticalAnalysis?type=${evalType}`);
      setData(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  const handleBarClick = (dataPoint, questionDetails) => {
    // Score comparison with capital 'S' as per Backend response
    const filtered = questionDetails.filter(d => (d.Score || d.score) === dataPoint.Score);
    setSelectedDetails({ label: dataPoint.Label, students: filtered });
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm mb-8 flex flex-col md:flex-row justify-between items-center border border-slate-200">
        <div>
          <h1 className="font-black text-2xl uppercase text-slate-800 tracking-tight">Critical Analysis</h1>
          <p className="text-slate-400 text-sm font-bold uppercase italic">Viewing: {evalType}</p>
        </div>
        <select 
          value={evalType} 
          onChange={(e) => setEvalType(e.target.value)} 
          className="mt-4 md:mt-0 border-2 border-slate-100 p-3 rounded-2xl font-black bg-slate-50 cursor-pointer outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-700"
        >
          <option value="All">All Evaluations</option>
          <option value="Student">Student Evaluations</option>
          <option value="Peer">Peer Evaluations</option>
        </select>
      </div>

      {/* Main Charts Grid */}
      <div className="grid gap-8">
        {data.length > 0 ? data.map((q) => (
          <div key={q.QuestionId} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
            <div className="flex justify-between items-start mb-6">
               <h2 className="font-extrabold text-xl text-slate-800 leading-tight max-w-3xl">"{q.QuestionText}"</h2>
               <div className="bg-blue-600 text-white px-5 py-2 rounded-2xl text-lg font-black shadow-lg shadow-blue-200 italic">
                 Avg: {q.AverageScore}
               </div>
            </div>
            
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={q.Distribution}>
                  <XAxis dataKey="Label" axisLine={false} tickLine={false} fontSize={12} fontWeight="900" />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '15px', border: 'none', fontWeight: 'bold'}} />
                  <Bar 
                    dataKey="Count" 
                    onClick={(dataPoint) => handleBarClick(dataPoint, q.Details)} 
                    style={{cursor: 'pointer'}}
                    radius={[12, 12, 0, 0]}
                  >
                    {q.Distribution.map((entry, index) => (
                      <Cell key={index} fill={['#f43f5e', '#fb923c', '#38bdf8', '#22c55e'][index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-400 mt-6 font-black uppercase text-center tracking-[0.2em]">Click a bar to reveal specific evaluators</p>
          </div>
        )) : (
          <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-200">
            <div className="text-slate-300 font-black text-3xl uppercase italic">No Data Found for {evalType}</div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex justify-center items-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-white">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="font-black text-3xl uppercase text-slate-900">Rating: {selectedDetails.label}</h3>
                <p className="text-blue-500 font-bold italic">Detailed Evaluation Breakdown</p>
              </div>
              <button 
                onClick={() => setSelectedDetails(null)} 
                className="bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white px-6 py-3 rounded-2xl font-black transition-all uppercase text-sm tracking-widest"
              >
                Close
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-4 custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-[10px] text-slate-400 uppercase font-black tracking-widest px-4">
                      <th className="pb-4 pl-4">Evaluator (By)</th>
                      <th className="pb-4 text-center italic">Status</th>
                      <th className="pb-4">Evaluatee (To)</th>
                      <th className="pb-4 pr-4">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDetails.students.map((s, i) => (
                      <tr key={i} className="bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group rounded-2xl">
                        <td className="py-5 pl-6 rounded-l-2xl">
                          <div className="font-black text-slate-800 text-base">{s.EvaluatorName}</div>
                          <div className="text-[10px] font-bold text-blue-500 uppercase">ID: {s.EvaluatorID}</div>
                        </td>
                        
                        <td className="py-5 text-center">
                           <span className="text-slate-300 font-light text-2xl group-hover:text-blue-400">→</span>
                        </td>

                        <td className="py-5">
                          <div className="font-black text-slate-800 text-base">{s.EvaluateeName}</div>
                          <div className="text-[10px] font-bold text-green-500 uppercase">Target: {s.EvaluateeID}</div>
                        </td>

                        <td className="py-5 pr-6 rounded-r-2xl">
                          <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-tighter ${s.Role === 'Student' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                            {s.Role}
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