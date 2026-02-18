import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { TrendingUp, CheckCircle2, Loader2 } from 'lucide-react';
import DataService from '../../../services/axios';

const SeePerformanceTeacher = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const teacherId = localStorage.getItem('userId');
  const sessionId = 5; // Aapka current session

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const res = await DataService.get(`/Performance/GetTeacherPerformanceAnalytics/${teacherId}/${sessionId}`);
        setData(res.data);
      } catch (err) {
        console.error("Error fetching data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, [teacherId]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-green-700" size={40} /></div>;
  if (!data) return <div className="text-center p-20 font-bold text-red-500">No Data Found for Session {sessionId}</div>;

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      
      {/* 1. Statistics Header */}
      <div className="bg-green-700 rounded-[2rem] p-8 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2 italic uppercase">Performance Analytics</h2>
          <p className="text-green-100 opacity-80 font-medium">Session ID: {data.SessionID} | Teacher: {data.TeacherID}</p>
        </div>
        <div className="z-10 text-right">
          <span className="text-xs font-bold opacity-70 uppercase tracking-tighter">Overall Score</span>
          <div className="text-5xl font-black">{data.OverallPercentage}%</div>
        </div>
        <TrendingUp size={150} className="absolute -right-10 -bottom-10 text-white opacity-10 rotate-12" />
      </div>

      {/* 2. Proper Recharts Graph Card */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-10">
          <CheckCircle2 className="text-green-600" size={28} />
          <h3 className="text-xl font-black text-gray-800 uppercase italic">KPI Weightage vs Achievement</h3>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.GraphData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#6b7280', fontWeight: 700, fontSize: 12}} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9ca3af', fontSize: 12}}
                domain={[0, 'dataMax + 10']}
              />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{paddingBottom: '20px'}} />
              
              {/* Target/Max Weight Bar (Background) */}
              <Bar dataKey="max" name="Target Weight" fill="#e5e7eb" radius={[10, 10, 0, 0]} barSize={50} />
              
              {/* Achieved Score Bar (Foreground) */}
              <Bar dataKey="score" name="Your Score" radius={[10, 10, 0, 0]} barSize={50}>
                {data.GraphData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Detailed Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {data.GraphData.map((kpi, idx) => (
            <div key={idx} className="p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-md transition-all">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{kpi.name}</p>
              <div className="flex justify-between items-end">
                <h4 className="text-2xl font-black text-gray-800">{kpi.score} <span className="text-sm text-gray-400">/ {kpi.max}</span></h4>
                <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                  {Math.round((kpi.score/kpi.max)*100)}%
                </div>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-4">
                <div 
                  className="h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${(kpi.score/kpi.max)*100}%`, backgroundColor: kpi.color }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeePerformanceTeacher;