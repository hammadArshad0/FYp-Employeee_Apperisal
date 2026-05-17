import React, { useState, useEffect } from "react";
import DataService from "../../../services/axios";
import db from "../../../db"; // Local Dexie Instance Link

const blendWithDexie = (apiScore, dexieRecs, maxDexie = 4, weight = 0.3) => {
  if (!dexieRecs || dexieRecs.length === 0) return apiScore;
  const totalRaw = dexieRecs.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
  const avgRaw = totalRaw / dexieRecs.length;
  const dexieNormalized = Math.min(100, (avgRaw / maxDexie) * 100);
  const blended = apiScore * (1 - weight) + dexieNormalized * weight;
  return Math.round(blended * 10) / 10;
};

const KPIBaseComparison = () => {
  // --- Core Lists States ---
  const [sessions, setSessions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [subKpis, setSubKpis] = useState([]);

  // --- Dropdown Selection States ---
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTeacher1, setSelectedTeacher1] = useState("");
  const [selectedTeacher2, setSelectedTeacher2] = useState("");
  const [selectedKpi, setSelectedKpi] = useState("");
  const [selectedSubKpi, setSelectedSubKpi] = useState("");

  // --- Dexie Confidential Buffers ---
  const [t1ConfidentialRecs, setT1ConfidentialRecs] = useState([]);
  const [t2ConfidentialRecs, setT2ConfidentialRecs] = useState([]);

  // --- Execution & Render States ---
  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  // 1. Initial Load: Academic Sessions Fetch
  useEffect(() => {
    const fetchInitialSessions = async () => {
      try {
        const res = await DataService.get("/KPIBasePerformance/GetSessions");
        setSessions(res.data || []);
      } catch (err) {
        console.error("Sessions endpoint dynamic breakdown failure:", err);
      }
    };
    fetchInitialSessions();
  }, []);

  // 2. Event Handler: Session Change
  const handleSessionChange = async (e) => {
    const sessionId = e.target.value;
    setSelectedSession(sessionId);
    setSelectedTeacher1("");
    setSelectedTeacher2("");
    setSelectedKpi("");
    setSelectedSubKpi("");
    setTeachers([]);
    setKpis([]);
    setSubKpis([]);
    setT1ConfidentialRecs([]);
    setT2ConfidentialRecs([]);
    setComparisonResult(null);
    setHasCalculated(false);

    if (sessionId) {
      setLoading(true);
      try {
        const [teacherRes, kpiRes] = await Promise.all([
          DataService.get(`/KpiBaseComparision/GetTeachersBySession/${sessionId}`),
          DataService.get(`/KPIBasePerformance/GetKPIsBySession/${sessionId}`)
        ]);
        setTeachers(teacherRes.data || []);
        setKpis(kpiRes.data || []);
      } catch (err) {
        console.error("Layer 1 cascading pipeline failed to initialize:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  // 3. Event Handler: Main KPI Change
  const handleKpiChange = async (e) => {
    const kpiId = e.target.value;
    setSelectedKpi(kpiId);
    setSelectedSubKpi("");
    setSubKpis([]);
    setComparisonResult(null);
    setHasCalculated(false);

    if (kpiId) {
      setLoading(true);
      try {
        const subKpiRes = await DataService.get(`/KPIBasePerformance/GetSubKPIsByKPIAndSession/${kpiId}/${selectedSession}`);
        setSubKpis(subKpiRes.data || []);
      } catch (err) {
        console.error("Layer 2 cascading pipeline failed to cross-join:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  // 4. Event Handler: Sub-KPI Change
  const handleSubKpiChange = (e) => {
    setSelectedSubKpi(e.target.value);
    setComparisonResult(null);
    setHasCalculated(false);
  };

  // 5. ON BUTTON CLICK: Run Vector Metrics & Blend Encryption Engine
  const handleComparePerformances = async () => {
    if (!selectedSession || !selectedTeacher1 || !selectedTeacher2) {
      alert("Please configure Session, Teacher 1, and Teacher 2 parameters before generating reports.");
      return;
    }
    if (selectedTeacher1 === selectedTeacher2) {
      alert("Validation Error: Please select two distinct instructors for logical matrix analysis.");
      return;
    }

    setLoading(true);
    setHasCalculated(true);

    try {
      // Step A: Server Core Engine Fetch
      let url = `/KpiBaseComparision/GetTeacherComparison?sessionId=${selectedSession}&teacher1Id=${selectedTeacher1}&teacher2Id=${selectedTeacher2}`;
      if (selectedKpi) url += `&kpiId=${selectedKpi}`;
      if (selectedSubKpi) url += `&subKpiId=${selectedSubKpi}`;

      const res = await DataService.get(url);

      // Step B: Dexie Offline Cache Sync Processing
      const [dexieT1, dexieT2] = await Promise.all([
        db.evaluations.where("sessionId").equals(String(selectedSession)).and(r => String(r.teacherId) === String(selectedTeacher1)).toArray(),
        db.evaluations.where("sessionId").equals(String(selectedSession)).and(r => String(r.teacherId) === String(selectedTeacher2)).toArray()
      ]);

      setT1ConfidentialRecs(dexieT1 || []);
      setT2ConfidentialRecs(dexieT2 || []);
      setComparisonResult(res.data);
    } catch (err) {
      console.error("Comparison execution context halted on server exception:", err);
    } finally {
      setLoading(false);
    }
  };

  // UI Colors Configurator
  const getConditionColorClass = (pct) => {
    if (pct < 40) return { bg: "bg-rose-500", text: "text-rose-600", fill: "bg-rose-50 border-rose-200" };
    if (pct < 70) return { bg: "bg-amber-500", text: "text-amber-600", fill: "bg-amber-50 border-amber-200" };
    if (pct < 85) return { bg: "bg-blue-500", text: "text-blue-600", fill: "bg-blue-50 border-blue-200" };
    return { bg: "bg-emerald-500", text: "text-emerald-600", fill: "bg-emerald-50 border-emerald-200" };
  };

  // --- FIXED: DETERMINING CONDITIONAL LOG DISPLAY CRITERIA ---
  const currentKpiObj = kpis.find(k => String(k.id) === String(selectedKpi));
  const currentSubKpiObj = subKpis.find(s => String(s.id) === String(selectedSubKpi));

  const isKpiConfidential = currentKpiObj?.name?.toLowerCase().includes("confidential");
  const isSubKpiConfidential = currentSubKpiObj?.name?.toLowerCase().includes("confidential");

  // FIX: Explicitly evaluates to true when selectedKpi is empty (Overall Mode) OR if selections match confidential text
  const shouldShowConfidentialData = selectedSession && (selectedKpi === "" || selectedKpi === null || isKpiConfidential || isSubKpiConfidential);

  // Compile Dynamic Blended Scores based on active display parameters
  const rawT1 = comparisonResult?.Teacher1;
  const rawT2 = comparisonResult?.Teacher2;

  const t1 = rawT1 ? {
    ...rawT1,
    OriginalAPIPercentage: rawT1.OverallPercentage,
    OverallPercentage: shouldShowConfidentialData ? blendWithDexie(rawT1.OverallPercentage, t1ConfidentialRecs, 4, 0.30) : rawT1.OverallPercentage,
    hasConfidential: shouldShowConfidentialData && t1ConfidentialRecs.length > 0,
    confidentialRecords: t1ConfidentialRecs
  } : null;

  const t2 = rawT2 ? {
    ...rawT2,
    OriginalAPIPercentage: rawT2.OverallPercentage,
    OverallPercentage: shouldShowConfidentialData ? blendWithDexie(rawT2.OverallPercentage, t2ConfidentialRecs, 4, 0.30) : rawT2.OverallPercentage,
    hasConfidential: shouldShowConfidentialData && t2ConfidentialRecs.length > 0,
    confidentialRecords: t2ConfidentialRecs
  } : null;

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">
      
      {/* Header Grid Section */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">KPI-Based Teacher Comparison</h1>
          <p className="text-sm text-slate-500">Cross-examine granular analytics, total weights, and obtained points side-by-side</p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-200 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            Analyzing Multi-Layer Metrics...
          </div>
        )}
      </div>

      {/* Configuration Selection UI Control Box */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">1. Select Academic Session</label>
            <select value={selectedSession} onChange={handleSessionChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">-- Choose Session --</option>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">2. Select Main KPI Scope</label>
            <select value={selectedKpi} disabled={!selectedSession} onChange={handleKpiChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50">
              <option value="">-- Overall Assessment (All KPIs) --</option>
              {kpis.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">3. Select Sub-KPI / Component Filter</label>
            <select value={selectedSubKpi} disabled={!selectedKpi} onChange={handleSubKpiChange} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50">
              <option value="">-- All Sub-KPI System Metrics --</option>
              {subKpis.map((sk) => <option key={sk.id} value={sk.id}>{sk.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">Primary Instructor (Teacher 1)</label>
            <select value={selectedTeacher1} disabled={!selectedSession} onChange={(e) => { setSelectedTeacher1(e.target.value); setHasCalculated(false); }} className="w-full bg-blue-50/40 border border-blue-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50">
              <option value="">-- Choose Instructor 1 --</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name} [{t.department}]</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2">Comparison Instructor (Teacher 2)</label>
            <select value={selectedTeacher2} disabled={!selectedSession} onChange={(e) => { setSelectedTeacher2(e.target.value); setHasCalculated(false); }} className="w-full bg-indigo-50/40 border border-indigo-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50">
              <option value="">-- Choose Instructor 2 --</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name} [{t.department}]</option>)}
            </select>
          </div>

          <div>
            <button
              onClick={handleComparePerformances}
              disabled={loading || !selectedTeacher1 || !selectedTeacher2}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-all shadow-sm flex justify-center items-center gap-2 disabled:cursor-not-allowed focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
            >
              <span>⚡</span> Run Compare Review
            </button>
          </div>
        </div>
      </div>

      {/* Main Comparative Result Output Node */}
      {hasCalculated && comparisonResult && (t1 || t2) ? (
        <div className="space-y-6">
          
          {/* BAR GRAPH METRICS CONTAINER */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Visual Performance Ratio Compare</h3>
            <p className="text-xs text-slate-400 mb-6">
              {shouldShowConfidentialData ? "Confidential logs blended representation chart scale" : "Standard API tracking metrics graph representation"}
            </p>
            
            <div className="flex h-64 items-end border-b-2 border-l-2 border-slate-300 pl-4 pb-2 relative max-w-md mx-auto">
              <div className="absolute left-[-45px] top-0 bottom-0 flex flex-col justify-between text-[10px] font-bold text-slate-400 pb-2">
                <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
              </div>
              
              <div className="w-full flex justify-around items-end h-full pt-4">
                {/* Bar 1 */}
                {t1 && (
                  <div className="flex flex-col items-center flex-1 mx-4 h-full justify-end relative">
                    <div className={`w-full rounded-t-lg transition-all duration-1000 ease-out flex justify-center items-start pt-2 ${getConditionColorClass(t1.OverallPercentage).bg} ring-2 ring-blue-300 ring-offset-1`} style={{ height: `${t1.OverallPercentage}%` }}>
                      <span className="text-xs font-black text-white font-mono">{t1.OverallPercentage}%</span>
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 mt-2 truncate w-full text-center">{t1.TeacherName.split(" ")[0]}</span>
                  </div>
                )}
                {/* Bar 2 */}
                {t2 && (
                  <div className="flex flex-col items-center flex-1 mx-4 h-full justify-end relative">
                    <div className={`w-full rounded-t-lg transition-all duration-1000 ease-out flex justify-center items-start pt-2 ${getConditionColorClass(t2.OverallPercentage).bg} ring-2 ring-indigo-300 ring-offset-1`} style={{ height: `${t2.OverallPercentage}%` }}>
                      <span className="text-xs font-black text-white font-mono">{t2.OverallPercentage}%</span>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 mt-2 truncate w-full text-center">{t2.TeacherName.split(" ")[0]}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side-by-Side Overall Score Cards Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Instructor 1 Panel Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
              <span className="text-[9px] font-black uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded absolute top-4 right-4">Primary Target</span>
              <h2 className="text-lg font-black text-slate-900">{t1 ? t1.TeacherName : "Data Missing"}</h2>
              <p className="text-xs text-slate-400 font-medium mb-4">{t1 ? `${t1.TeacherID} • ${t1.Designation} [${t1.Department}]` : "N/A"}</p>
              
              {t1 && (
                <div className="grid grid-cols-3 gap-3 items-center">
                  <div className="text-center bg-slate-50 border p-2 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Obtained</span>
                    <span className="text-lg font-black text-slate-800 font-mono">{t1.TotalObtainedWeight}</span>
                  </div>
                  <div className="text-center bg-slate-50 border p-2 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Total weight</span>
                    <span className="text-lg font-black text-slate-600 font-mono">{t1.TotalSessionWeight}</span>
                  </div>
                  <div className={`text-center border p-2 rounded-lg ${getConditionColorClass(t1.OverallPercentage).fill}`}>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                      {shouldShowConfidentialData ? "Blended %" : "Progress %"}
                    </span>
                    <span className={`text-lg font-black font-mono ${getConditionColorClass(t1.OverallPercentage).text}`}>{t1.OverallPercentage}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Instructor 2 Panel Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
              <span className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded absolute top-4 right-4">Comparison Target</span>
              <h2 className="text-lg font-black text-slate-900">{t2 ? t2.TeacherName : "Data Missing"}</h2>
              <p className="text-xs text-slate-400 font-medium mb-4">{t2 ? `${t2.TeacherID} • ${t2.Designation} [${t2.Department}]` : "N/A"}</p>
              
              {t2 && (
                <div className="grid grid-cols-3 gap-3 items-center">
                  <div className="text-center bg-slate-50 border p-2 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Obtained</span>
                    <span className="text-lg font-black text-slate-800 font-mono">{t2.TotalObtainedWeight}</span>
                  </div>
                  <div className="text-center bg-slate-50 border p-2 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Total weight</span>
                    <span className="text-lg font-black text-slate-600 font-mono">{t2.TotalSessionWeight}</span>
                  </div>
                  <div className={`text-center border p-2 rounded-lg ${getConditionColorClass(t2.OverallPercentage).fill}`}>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                      {shouldShowConfidentialData ? "Blended %" : "Progress %"}
                    </span>
                    <span className={`text-lg font-black font-mono ${getConditionColorClass(t2.OverallPercentage).text}`}>{t2.OverallPercentage}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DUAL CONFIDENTIAL EVALUATION SECURE LOGS - Renders beautifully in Overall Assessment */}
          {shouldShowConfidentialData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* T1 Confidential Review */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">🔒 Teacher 1 Confidential Logs (Dexie DB)</h4>
                {t1?.hasConfidential ? (
                  <div className="overflow-x-auto max-h-48 overflow-y-auto border rounded-lg">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-blue-50 text-blue-900 font-bold border-b">
                          <th className="p-2">Course</th><th className="p-2">Question Context</th><th className="p-2 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-600">
                        {t1.confidentialRecords.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-slate-900">{r.courseCode}</td>
                            <td className="p-2 italic max-w-[150px] truncate" title={r.questionText}>{r.questionText}</td>
                            <td className="p-2 text-right font-black text-blue-600 font-mono">{r.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-xs text-slate-400 italic p-2">No local secure logs cached for this primary target in this session.</p>}
              </div>

              {/* T2 Confidential Review */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-3">🔒 Teacher 2 Confidential Logs (Dexie DB)</h4>
                {t2?.hasConfidential ? (
                  <div className="overflow-x-auto max-h-48 overflow-y-auto border rounded-lg">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-indigo-50 text-indigo-900 font-bold border-b">
                          <th className="p-2">Course</th><th className="p-2">Question Context</th><th className="p-2 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-600">
                        {t2.confidentialRecords.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-slate-900">{r.courseCode}</td>
                            <td className="p-2 italic max-w-[150px] truncate" title={r.questionText}>{r.questionText}</td>
                            <td className="p-2 text-right font-black text-indigo-600 font-mono">{r.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-xs text-slate-400 italic p-2">No local secure logs cached for this comparison target in this session.</p>}
              </div>
            </div>
          )}

          {/* Granular Component Matrix Cross Table Grid */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Granular Performance Component Breakdown</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3">Evaluated Sub-KPI Component</th>
                    <th className="p-3">Domain Category</th>
                    <th className="p-3 text-center bg-blue-50 text-blue-900 font-black border-x border-slate-200">T1 Normalized Progress</th>
                    <th className="p-3 text-center bg-blue-50 text-blue-900 font-black border-r border-slate-200">T1 Score Achieved</th>
                    <th className="p-3 text-center bg-indigo-50 text-indigo-900 font-black border-r border-slate-200">T2 Normalized Progress</th>
                    <th className="p-3 text-center bg-indigo-50 text-indigo-900 font-black border-r border-slate-200">T2 Score Achieved</th>
                    <th className="p-3 text-right">Max Weight Pool</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const t1Breakdown = t1?.Breakdown || [];
                    const t2Breakdown = t2?.Breakdown || [];
                    const allSubKpisSuperset = Array.from(new Set([
                      ...t1Breakdown.map(b => b.SubKPI),
                      ...t2Breakdown.map(b => b.SubKPI)
                    ]));

                    return allSubKpisSuperset.map((subKpiName) => {
                      const match1 = t1Breakdown.find(b => b.SubKPI === subKpiName);
                      const match2 = t2Breakdown.find(b => b.SubKPI === subKpiName);
                      const categoryLabel = match1?.Category || match2?.Category || "General";
                      const subKpiWeight = match1?.SubKPITotalWeight || match2?.SubKPITotalWeight || 100;

                      return (
                        <tr key={subKpiName} className="hover:bg-slate-50/70 font-medium text-slate-700 transition-colors">
                          <td className="p-3 font-bold text-slate-900 max-w-xs">{subKpiName}</td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold border rounded px-2 py-0.5 bg-slate-50 uppercase tracking-wide text-slate-500">
                              {categoryLabel}
                            </span>
                          </td>
                          <td className="p-3 text-center bg-blue-50/10 font-mono text-blue-600 font-bold border-x border-slate-100">{match1 ? `${match1.NormalizedScore}%` : "—"}</td>
                          <td className="p-3 text-center bg-blue-50/10 font-mono font-black text-slate-900 border-r border-slate-100">{match1 ? match1.SubKPIObtainedWeight : "0"}</td>
                          <td className="p-3 text-center bg-indigo-50/10 font-mono text-indigo-600 font-bold border-r border-slate-100">{match2 ? `${match2.NormalizedScore}%` : "—"}</td>
                          <td className="p-3 text-center bg-indigo-50/10 font-mono font-black text-slate-900 border-r border-slate-100">{match2 ? match2.SubKPIObtainedWeight : "0"}</td>
                          <td className="p-3 text-right font-mono font-black text-slate-400">{subKpiWeight}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : hasCalculated ? (
        <div className="bg-white border border-dashed border-rose-300 rounded-xl p-14 text-center text-slate-500 font-medium shadow-sm">
          ⚠️ Evaluation parameters matched zero metrics inside the specified database configuration.
        </div>
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-14 text-center text-slate-400 font-medium shadow-sm">
          📊 Dropdowns select karke <b>"Run Compare Review"</b> button click karein taaki instructors ka comparison report and graph structure generate ho sake.
        </div>
      )}
    </div>
  );
};

export default KPIBaseComparison;