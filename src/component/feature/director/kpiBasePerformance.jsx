import React, { useState, useEffect } from "react";
import DataService from "../../../services/axios";
import db from "../../../db";

const blendWithDexie = (apiScore, dexieRecs, maxDexie = 4, weight = 0.3) => {
  if (!dexieRecs || dexieRecs.length === 0) return apiScore;
  const totalRaw = dexieRecs.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
  const avgRaw = totalRaw / dexieRecs.length;
  const dexieNormalized = Math.min(100, (avgRaw / maxDexie) * 100);
  const blended = apiScore * (1 - weight) + dexieNormalized * weight;
  return Math.round(blended * 10) / 10;
};

const KPIBasePerformance = () => {
  const [sessions, setSessions] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [subKpis, setSubKpis] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [localEvaluations, setLocalEvaluations] = useState([]);

  const [selectedSession, setSelectedSession] = useState("");
  const [selectedKpi, setSelectedKpi] = useState("");
  const [selectedSubKpi, setSelectedSubKpi] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTeacher, setExpandedTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Initial sessions load
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await DataService.get("/KPIBasePerformance/GetSessions");
        setSessions(res.data || []);
      } catch (err) {
        console.error("Sessions fetch failed:", err);
      }
    };
    fetchSessions();
  }, []);

  // Sync IndexedDB Dexie cache on session toggle
  useEffect(() => {
    if (!selectedSession) {
      setLocalEvaluations([]);
      return;
    }
    const fetchDexie = async () => {
      try {
        const data = await db.evaluations
          .where("sessionId")
          .equals(String(selectedSession))
          .toArray();
        setLocalEvaluations(data || []);
      } catch (err) {
        console.error("Dexie store lookup runtime error:", err);
      }
    };
    fetchDexie();
  }, [selectedSession]);

  // ON-CLICK: Fetch ranking payload explicitly
  const handleFetchRankings = async () => {
    if (!selectedSession) {
      alert("Please select an academic session.");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setExpandedTeacher(null);

    try {
      let url = `/KPIBasePerformance/GetTeacherRankingV2?sessionId=${selectedSession}`;
      if (selectedKpi) url += `&kpiId=${selectedKpi}`;
      if (selectedSubKpi) url += `&subKpiId=${selectedSubKpi}`;

      const res = await DataService.get(url);
      setPerformers(res.data || []);
    } catch (err) {
      console.error("Data tracking process crash:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionChange = async (e) => {
    const sessionId = e.target.value;
    setSelectedSession(sessionId);
    setSelectedKpi("");
    setSelectedSubKpi("");
    setKpis([]);
    setSubKpis([]);
    setPerformers([]);
    setHasSearched(false);

    if (sessionId) {
      setLoading(true);
      try {
        const kpiRes = await DataService.get(`/KPIBasePerformance/GetKPIsBySession/${sessionId}`);
        setKpis(kpiRes.data || []);
      } catch (err) {
        console.error("Cascading error at layer 1:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKpiChange = async (e) => {
    const kpiId = e.target.value;
    setSelectedKpi(kpiId);
    setSelectedSubKpi("");
    setSubKpis([]);
    setPerformers([]);
    setHasSearched(false);

    if (kpiId) {
      setLoading(true);
      try {
        const subKpiRes = await DataService.get(`/KPIBasePerformance/GetSubKPIsByKPIAndSession/${kpiId}/${selectedSession}`);
        setSubKpis(subKpiRes.data || []);
      } catch (err) {
        console.error("Cascading error at layer 2:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubKpiChange = (e) => {
    setSelectedSubKpi(e.target.value);
    setPerformers([]);
    setHasSearched(false);
  };

  // Compile runtime evaluation calculations
  const filteredPerformers = performers.filter((teacher) => {
    const q = searchQuery.toLowerCase();
    return (
      teacher.TeacherName?.toLowerCase().includes(q) ||
      String(teacher.TeacherID)?.toLowerCase().includes(q) ||
      teacher.Department?.toLowerCase().includes(q)
    );
  });

  const mergedPerformers = filteredPerformers.map((teacher) => {
    const dexieRecs = localEvaluations.filter(
      (ev) => String(ev.teacherId) === String(teacher.TeacherID)
    );
    const hasConfidentialData = dexieRecs.length > 0;
    const blendedOverall = blendWithDexie(
      teacher.OverallPercentage,
      dexieRecs,
      4,
      0.30
    );

    return {
      ...teacher,
      OriginalAPIPercentage: teacher.OverallPercentage,
      OverallPercentage: blendedOverall,
      hasConfidentialData,
      confidentialRecords: dexieRecs,
    };
  });

  const displayPerformers = [...mergedPerformers].sort((a, b) => b.OverallPercentage - a.OverallPercentage);

  const getConditionColorClass = (pct) => {
    if (pct < 40) return { bg: "bg-rose-500", text: "text-rose-600", lightBg: "bg-rose-50" };
    if (pct < 70) return { bg: "bg-amber-500", text: "text-amber-600", lightBg: "bg-amber-50" };
    if (pct < 85) return { bg: "bg-blue-500", text: "text-blue-600", lightBg: "bg-blue-50" };
    return { bg: "bg-emerald-500", text: "text-emerald-600", lightBg: "bg-emerald-50" };
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">
      
      {/* Header Panel */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teacher Performance Rankings</h1>
          <p className="text-sm text-slate-500">Real-time normalized analytics — total & obtained weight metrics configured</p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            Compiling Live Matrix...
          </div>
        )}
      </div>

      {/* Cascading Search Filters Dropdown Container */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Select Session</label>
            <select value={selectedSession} onChange={handleSessionChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">-- Choose Session --</option>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Select Main KPI</label>
            <select value={selectedKpi} disabled={!selectedSession} onChange={handleKpiChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50">
              <option value="">-- Overall (All KPIs) --</option>
              {kpis.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Select Sub-KPI / Society</label>
            <select value={selectedSubKpi} disabled={!selectedKpi} onChange={handleSubKpiChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50">
              <option value="">-- All Sub-KPIs --</option>
              {subKpis.map((sk) => <option key={sk.id} value={sk.id}>{sk.name}</option>)}
            </select>
          </div>

          {/* Explicit Generate Trigger Button */}
          <div>
            <button
              onClick={handleFetchRankings}
              disabled={!selectedSession || loading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-all shadow-sm flex justify-center items-center gap-2 disabled:cursor-not-allowed focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
            >
              <span>📊</span> Generate Rankings
            </button>
          </div>

        </div>
      </div>

      {/* Main Reporting Output Render Engine */}
      {hasSearched && displayPerformers.length > 0 ? (
        <>
          {/* Performance Chart Component */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="flex h-72 items-end border-b-2 border-l-2 border-slate-300 pl-2 pb-1 relative">
              <div className="w-full flex justify-around items-end h-full pt-4">
                {displayPerformers.map((teacher, index) => {
                  const colorConfig = getConditionColorClass(teacher.OverallPercentage);
                  return (
                    <div key={`col-${teacher.TeacherID}`} className="flex flex-col items-center flex-1 max-w-[60px] mx-1 h-full justify-end group relative">
                      <div className={`w-full rounded-t-md transition-all duration-500 flex justify-center items-start pt-1.5 ${colorConfig.bg} ${teacher.hasConfidentialData ? "ring-2 ring-indigo-400 ring-offset-1" : ""}`} style={{ height: `${teacher.OverallPercentage}%` }}>
                        <span className="text-[10px] font-black text-white">{teacher.OverallPercentage}%</span>
                      </div>
                      <div className="absolute bottom-[-24px] text-[10px] font-bold text-slate-600 truncate w-full text-center">
                        {index + 1}. {teacher.TeacherName.split(" ")[0]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="h-6" />
          </div>

          {/* Quick Realtime String Match Filter */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <input type="text" placeholder="Filter processed records by properties..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full sm:max-w-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-xs text-slate-400">
              Showing {displayPerformers.length} compilation cards {localEvaluations.length > 0 && <span className="ml-3 text-indigo-500 font-semibold">🔒 Blended encryption models verified</span>}
            </span>
          </div>

          {/* Main Loop Profiles Dashboard List */}
          <div className="space-y-3">
            {displayPerformers.map((teacher, index) => {
              const isExpanded = expandedTeacher === teacher.TeacherID;
              const colorConfig = getConditionColorClass(teacher.OverallPercentage);
              return (
                <div key={teacher.TeacherID} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
                  <div onClick={() => setExpandedTeacher(isExpanded ? null : teacher.TeacherID)} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 select-none">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 flex items-center justify-center rounded-full font-extrabold text-sm bg-slate-100 text-slate-700 shadow-inner">{index + 1}</div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                          {teacher.TeacherName}
                          {teacher.hasConfidentialData && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">🔒 SECURE COMBINED MATRIX</span>}
                        </h3>
                        <p className="text-xs text-slate-400">{teacher.TeacherID} • {teacher.Department}</p>
                      </div>
                    </div>

                    {/* Weight and Obtained Summary Badges */}
                    <div className="flex items-center gap-3 text-xs">
                      <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-center">
                        <span className="text-slate-400 block font-medium uppercase text-[9px]">Obtained Marks</span>
                        <span className="font-bold text-slate-800 font-mono text-sm">{teacher.TotalObtainedWeight}</span>
                      </div>
                      <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-center">
                        <span className="text-slate-400 block font-medium uppercase text-[9px]">Total Weight</span>
                        <span className="font-bold text-slate-600 font-mono text-sm">{teacher.TotalSessionWeight}</span>
                      </div>
                    </div>

                    <div className="flex-1 max-w-xs mx-0 md:mx-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 font-medium">Performance Ratio</span>
                        <span className={`font-bold ${colorConfig.text}`}>{teacher.OverallPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${colorConfig.bg}`} style={{ width: `${teacher.OverallPercentage}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Components Details Layout Panels */}
                  {isExpanded && (
                    <div className={`${colorConfig.lightBg} border-t border-slate-100 p-4 space-y-4`}>
                      
                      {/* Local DB Blend Data Mapping Frame */}
                      {teacher.hasConfidentialData && (
                        <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm">
                          <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">🔒 Secure Local Evaluation Insights (Dexie Sync)</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-indigo-50 text-indigo-900 font-bold border-b border-indigo-100">
                                  <th className="p-2">Course Code</th>
                                  <th className="p-2">Student Info</th>
                                  <th className="p-2">Question Context</th>
                                  <th className="p-2 text-right">Score (1-4)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {teacher.confidentialRecords.map((item, idx) => (
                                  <tr key={idx} className="border-b border-slate-100 text-slate-700">
                                    <td className="p-2 font-mono font-bold">{item.courseCode}</td>
                                    <td className="p-2">{item.studentName || "Anonymous"}</td>
                                    <td className="p-2 italic text-slate-600">{item.questionText || "Confidential Review"}</td>
                                    <td className="p-2 text-right font-bold text-indigo-600">{item.score}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Normalized SubKPI Weight/Obtained Score Reporting Table */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Server Core Analytics Components</h4>
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                              <th className="p-2">Sub-KPI Component</th>
                              <th className="p-2">Category</th>
                              <th className="p-2 text-center">Raw Evaluation</th>
                              <th className="p-2 text-center">Normalized Progress</th>
                              <th className="p-2 text-center">Obtained Marks</th>
                              <th className="p-2 text-right">Total Assigned Weight</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teacher.Breakdown?.map((b, idx) => (
                              <tr key={idx} className="border-b border-slate-100 text-slate-700 font-medium">
                                <td className="p-2 font-semibold text-slate-900">{b.SubKPI}</td>
                                <td className="p-2">
                                  <span className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-bold uppercase text-slate-500">
                                    {b.Category}
                                  </span>
                                </td>
                                <td className="p-2 text-center font-mono">{b.RawScore}</td>
                                <td className="p-2 text-center font-semibold text-blue-600">{b.NormalizedScore}%</td>
                                <td className="p-2 text-center font-bold text-emerald-600 font-mono">{b.SubKPIObtainedWeight}</td>
                                <td className="p-2 text-right text-slate-500 font-bold font-mono">{b.SubKPITotalWeight}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : hasSearched ? (
        <div className="bg-white border border-dashed border-rose-300 rounded-xl p-14 text-center text-slate-500">
          ⚠️ Selected criteria combinations did not output any valid metrics on the evaluation database.
        </div>
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-14 text-center text-slate-400">
          📊 Configuration filters lock karein aur live performance reports process karne ke liye <b>"Generate Rankings"</b> button par click karein.
        </div>
      )}
    </div>
  );
};

export default KPIBasePerformance;