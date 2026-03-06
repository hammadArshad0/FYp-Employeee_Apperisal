import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, BookOpen, Loader2, Trash2, User } from 'lucide-react';
import db from '../../../db'; 

const ConfidentialEvaluations = () => {
  const [groupedArray, setGroupedArray] = useState([]);
  const [dexieConfAvg, setDexieConfAvg] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDexieData();
  }, []);

  const fetchDexieData = async () => {
    try {
      setLoading(true);
      const allData = await db.evaluations.toArray();

      const groups = allData.reduce((acc, curr) => {
        const key = `${curr.courseCode}-${curr.studentId}`;
        if (!acc[key]) {
          acc[key] = {
            courseCode: curr.courseCode,
            courseTitle: curr.courseTitle,
            studentId: curr.studentId, // ARID ID
            studentName: curr.studentName, // Student Name
            teacherName: curr.teacherName,
            questions: []
          };
        }
        acc[key].questions.push({
          questionId: curr.questionId,
          questionText: curr.questionText,
          score: curr.score
        });
        return acc;
      }, {});

      const formattedGroups = Object.values(groups);
      setGroupedArray(formattedGroups.reverse());

      if (allData.length > 0) {
        const totalScore = allData.reduce((sum, item) => sum + item.score, 0);
        setDexieConfAvg(totalScore / allData.length);
      }
    } catch (err) {
      console.error("Dexie Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const scoreLabel = (score) => {
    if (score >= 4) return { label: 'Excellent', color: 'bg-green-50 text-green-700 border-green-100' };
    if (score >= 3) return { label: 'Good', color: 'bg-blue-50 text-blue-700 border-blue-100' };
    if (score >= 2) return { label: 'Fair', color: 'bg-orange-50 text-orange-700 border-orange-100' };
    return { label: 'Poor', color: 'bg-red-50 text-red-700 border-red-100' };
  };

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-600" size={40} /></div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
      
      <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-12 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-purple-700 text-white rounded-3xl shadow-lg">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800 uppercase italic leading-none">Confidential Reviews</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-widest italic">
                Local Avg: {dexieConfAvg > 0 ? `${dexieConfAvg.toFixed(2)}/4` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {groupedArray.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-[2rem]">
            <ShieldCheck className="mx-auto text-slate-300 mb-4" size={60} />
            <p className="font-black text-slate-400 uppercase tracking-widest text-sm">No Data Found</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedArray.map((group, gIdx) => {
              const avgScore = (group.questions.reduce((sum, q) => sum + q.score, 0) / group.questions.length).toFixed(1);
              
              return (
                <div key={gIdx} className="border border-slate-100 rounded-[2rem] overflow-hidden hover:shadow-xl transition-all">
                  
                  {/* Card Header */}
                  <div className="bg-slate-900 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-purple-600 p-2.5 rounded-xl">
                        <BookOpen className="text-white" size={20} />
                      </div>
                      <div>
                        <span className="text-purple-400 font-black text-[10px] uppercase tracking-widest">{group.courseCode}</span>
                        <p className="text-white font-black text-base uppercase italic leading-tight">{group.courseTitle}</p>
                        <p className="text-slate-500 text-[10px] font-bold uppercase mt-1">Instructor: {group.teacherName}</p>
                      </div>
                    </div>

                    {/* Student Info & Score Section */}
                    <div className="flex items-center gap-8 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-700 p-2 rounded-lg text-slate-300">
                           <User size={16} />
                        </div>
                        <div className="text-left">
                          <p className="text-[9px] font-black text-purple-400 uppercase leading-none mb-1">Submitted By</p>
                          <p className="text-xs font-black text-white uppercase italic leading-none">{group.studentName}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1">{group.studentId}</p>
                        </div>
                      </div>

                      <div className="text-right border-l border-slate-700 pl-6">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Avg Score</p>
                        <p className="text-2xl font-black text-purple-400 italic leading-none">{avgScore}<span className="text-xs text-slate-400">/4</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="divide-y divide-slate-50">
                    {group.questions.map((q, qIdx) => {
                      const { label, color } = scoreLabel(q.score);
                      return (
                        <div key={qIdx} className="px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <span className="bg-purple-100 text-purple-700 w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                              {qIdx + 1}
                            </span>
                            <p className="text-sm font-bold text-slate-700 uppercase leading-snug">{q.questionText || `Question ${q.questionId}`}</p>
                          </div>
                          <span className={`shrink-0 text-[10px] font-black px-4 py-1.5 rounded-xl border uppercase tracking-widest ${color}`}>
                            {label} ({q.score}/4)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfidentialEvaluations;