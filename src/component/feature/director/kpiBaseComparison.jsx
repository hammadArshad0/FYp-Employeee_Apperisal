import React, { useState, useEffect } from "react";
import DataService from "../../../services/axios";
import db from "../../../db";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: API score + Dexie blend
// ─────────────────────────────────────────────────────────────────────────────
const blendWithDexie = (apiScore, dexieRecs, maxDexie = 4, weight = 0.3) => {
  if (!dexieRecs || dexieRecs.length === 0) return apiScore;
  const totalRaw = dexieRecs.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
  const avgRaw = totalRaw / dexieRecs.length;
  const dexieNormalized = Math.min(100, (avgRaw / maxDexie) * 100);
  const blended = apiScore * (1 - weight) + dexieNormalized * weight;
  return Math.round(blended * 10) / 10;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Dexie records se normalized score nikalo (0-100)
// ─────────────────────────────────────────────────────────────────────────────
const getDexieNormalizedScore = (dexieRecs, maxDexie = 4) => {
  if (!dexieRecs || dexieRecs.length === 0) return null;
  const total = dexieRecs.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
  const avg = total / dexieRecs.length;
  return Math.round(Math.min(100, (avg / maxDexie) * 100) * 10) / 10;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Kya yeh SubKPI "Confidential" type ka hai?
// ─────────────────────────────────────────────────────────────────────────────
const isConfidentialRow = (name = "") => {
  const n = name.toLowerCase();
  return n.includes("confidential");
};

const KPIBaseComparison = () => {
  const [sessions, setSessions]   = useState([]);
  const [teachers, setTeachers]   = useState([]);
  const [kpis, setKpis]           = useState([]);
  const [subKpis, setSubKpis]     = useState([]);

  const [selectedSession, setSelectedSession]   = useState("");
  const [selectedTeacher1, setSelectedTeacher1] = useState("");
  const [selectedTeacher2, setSelectedTeacher2] = useState("");
  const [selectedKpi, setSelectedKpi]           = useState("");
  const [selectedSubKpi, setSelectedSubKpi]     = useState("");

  const [t1ConfidentialRecs, setT1ConfidentialRecs] = useState([]);
  const [t2ConfidentialRecs, setT2ConfidentialRecs] = useState([]);

  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [hasCalculated, setHasCalculated]       = useState(false);

  // Sessions on mount
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await DataService.get("/KPIBasePerformance/GetSessions");
        setSessions(res.data || []);
      } catch (err) { console.error(err); }
    };
    fetch();
  }, []);

  const handleSessionChange = async (e) => {
    const sessionId = e.target.value;
    setSelectedSession(sessionId);
    setSelectedTeacher1(""); setSelectedTeacher2("");
    setSelectedKpi(""); setSelectedSubKpi("");
    setTeachers([]); setKpis([]); setSubKpis([]);
    setT1ConfidentialRecs([]); setT2ConfidentialRecs([]);
    setComparisonResult(null); setHasCalculated(false);

    if (sessionId) {
      setLoading(true);
      try {
        const [teacherRes, kpiRes] = await Promise.all([
          DataService.get(`/KpiBaseComparision/GetTeachersBySession/${sessionId}`),
          DataService.get(`/KPIBasePerformance/GetKPIsBySession/${sessionId}`)
        ]);
        setTeachers(teacherRes.data || []);
        setKpis(kpiRes.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
  };

  const handleKpiChange = async (e) => {
    const kpiId = e.target.value;
    setSelectedKpi(kpiId); setSelectedSubKpi(""); setSubKpis([]);
    setComparisonResult(null); setHasCalculated(false);
    if (kpiId) {
      setLoading(true);
      try {
        const res = await DataService.get(`/KPIBasePerformance/GetSubKPIsByKPIAndSession/${kpiId}/${selectedSession}`);
        setSubKpis(res.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
  };

  const handleSubKpiChange = (e) => {
    setSelectedSubKpi(e.target.value);
    setComparisonResult(null); setHasCalculated(false);
  };

  const handleComparePerformances = async () => {
    if (!selectedSession || !selectedTeacher1 || !selectedTeacher2) {
      alert("Session, Teacher 1 aur Teacher 2 select karein."); return;
    }
    if (selectedTeacher1 === selectedTeacher2) {
      alert("Do alag teachers select karein."); return;
    }
    setLoading(true); setHasCalculated(true);
    try {
      let url = `/KpiBaseComparision/GetTeacherComparison?sessionId=${selectedSession}&teacher1Id=${selectedTeacher1}&teacher2Id=${selectedTeacher2}`;
      if (selectedKpi)    url += `&kpiId=${selectedKpi}`;
      if (selectedSubKpi) url += `&subKpiId=${selectedSubKpi}`;

      const res = await DataService.get(url);

      // Dexie se confidential records lo
      const [dexieT1, dexieT2] = await Promise.all([
        db.evaluations
          .where("sessionId").equals(String(selectedSession))
          .and(r => String(r.teacherId) === String(selectedTeacher1))
          .toArray(),
        db.evaluations
          .where("sessionId").equals(String(selectedSession))
          .and(r => String(r.teacherId) === String(selectedTeacher2))
          .toArray()
      ]);

      setT1ConfidentialRecs(dexieT1 || []);
      setT2ConfidentialRecs(dexieT2 || []);
      setComparisonResult(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const getColor = (pct) => {
    if (pct < 40) return { bg: "bg-rose-500",    text: "text-rose-600",    fill: "bg-rose-50 border-rose-200"    };
    if (pct < 70) return { bg: "bg-amber-500",   text: "text-amber-600",   fill: "bg-amber-50 border-amber-200"  };
    if (pct < 85) return { bg: "bg-blue-500",    text: "text-blue-600",    fill: "bg-blue-50 border-blue-200"    };
    return               { bg: "bg-emerald-500", text: "text-emerald-600", fill: "bg-emerald-50 border-emerald-200" };
  };

  // Confidential show logic
  const currentKpiObj    = kpis.find(k => String(k.id) === String(selectedKpi));
  const currentSubKpiObj = subKpis.find(s => String(s.id) === String(selectedSubKpi));
  const isKpiConf        = currentKpiObj?.name?.toLowerCase().includes("confidential");
  const isSubKpiConf     = currentSubKpiObj?.name?.toLowerCase().includes("confidential");
  const shouldShowConfidentialData =
    selectedSession && (!selectedKpi || !selectedKpi.length || isKpiConf || isSubKpiConf);

  // Dexie normalized scores for T1 and T2
  const t1DexieScore = getDexieNormalizedScore(t1ConfidentialRecs, 4);
  const t2DexieScore = getDexieNormalizedScore(t2ConfidentialRecs, 4);

  const rawT1 = comparisonResult?.Teacher1;
  const rawT2 = comparisonResult?.Teacher2;

  // ── KEY FIX: Breakdown mein Confidential row ko Dexie value se replace karo ──
  const patchBreakdownWithDexie = (breakdown, dexieNormalizedScore) => {
    if (!breakdown || dexieNormalizedScore === null) return breakdown || [];
    return breakdown.map(row => {
      if (isConfidentialRow(row.SubKPI || "")) {
        return {
          ...row,
          NormalizedScore:    dexieNormalizedScore,   // Dexie avg (0-100)
          RawScore:           Math.round((dexieNormalizedScore / 100) * 4 * 100) / 100, // back-calculate
          _fromDexie:         true,                   // UI mein badge dikhane ke liye
        };
      }
      return row;
    });
  };

  const t1 = rawT1 ? {
    ...rawT1,
    OriginalAPIPercentage: rawT1.OverallPercentage,
    OverallPercentage: shouldShowConfidentialData
      ? blendWithDexie(rawT1.OverallPercentage, t1ConfidentialRecs, 4, 0.30)
      : rawT1.OverallPercentage,
    hasConfidential:    shouldShowConfidentialData && t1ConfidentialRecs.length > 0,
    confidentialRecords: t1ConfidentialRecs,
    // FIX: Breakdown mein confidential row ko Dexie se patch karo
    Breakdown: patchBreakdownWithDexie(rawT1.Breakdown, t1DexieScore),
  } : null;

  const t2 = rawT2 ? {
    ...rawT2,
    OriginalAPIPercentage: rawT2.OverallPercentage,
    OverallPercentage: shouldShowConfidentialData
      ? blendWithDexie(rawT2.OverallPercentage, t2ConfidentialRecs, 4, 0.30)
      : rawT2.OverallPercentage,
    hasConfidential:    shouldShowConfidentialData && t2ConfidentialRecs.length > 0,
    confidentialRecords: t2ConfidentialRecs,
    // FIX: Breakdown mein confidential row ko Dexie se patch karo
    Breakdown: patchBreakdownWithDexie(rawT2.Breakdown, t2DexieScore),
  } : null;

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">

      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">KPI-Based Teacher Comparison</h1>
          <p className="text-sm text-slate-500">Side-by-side analytics with confidential Dexie scores merged in breakdown</p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-200 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            Analyzing...
          </div>
        )}
      </div>

      {/* Dropdowns */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">1. Academic Session</label>
            <select value={selectedSession} onChange={handleSessionChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">-- Choose Session --</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">2. Main KPI</label>
            <select value={selectedKpi} disabled={!selectedSession} onChange={handleKpiChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50">
              <option value="">-- Overall (All KPIs) --</option>
              {kpis.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">3. Sub-KPI Filter</label>
            <select value={selectedSubKpi} disabled={!selectedKpi} onChange={handleSubKpiChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50">
              <option value="">-- All Sub-KPIs --</option>
              {subKpis.map(sk => <option key={sk.id} value={sk.id}>{sk.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">Primary Instructor (T1)</label>
            <select value={selectedTeacher1} disabled={!selectedSession}
              onChange={e => { setSelectedTeacher1(e.target.value); setHasCalculated(false); }}
              className="w-full bg-blue-50/40 border border-blue-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50">
              <option value="">-- Choose Teacher 1 --</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name} [{t.department}]</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2">Comparison Instructor (T2)</label>
            <select value={selectedTeacher2} disabled={!selectedSession}
              onChange={e => { setSelectedTeacher2(e.target.value); setHasCalculated(false); }}
              className="w-full bg-indigo-50/40 border border-indigo-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50">
              <option value="">-- Choose Teacher 2 --</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name} [{t.department}]</option>)}
            </select>
          </div>
          <div>
            <button onClick={handleComparePerformances}
              disabled={loading || !selectedTeacher1 || !selectedTeacher2}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-all shadow-sm flex justify-center items-center gap-2 disabled:cursor-not-allowed">
              <span>⚡</span> Run Compare Review
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {hasCalculated && comparisonResult && (t1 || t2) ? (
        <div className="space-y-6">

          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Visual Performance Ratio</h3>
            <p className="text-xs text-slate-400 mb-6">
              {shouldShowConfidentialData
                ? "Confidential Dexie scores blended (30%) into overall"
                : "Standard API score comparison"}
            </p>
            <div className="flex h-64 items-end border-b-2 border-l-2 border-slate-300 pl-4 pb-2 relative max-w-md mx-auto">
              <div className="absolute left-[-45px] top-0 bottom-0 flex flex-col justify-between text-[10px] font-bold text-slate-400 pb-2">
                <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
              </div>
              <div className="w-full flex justify-around items-end h-full pt-4">
                {t1 && (
                  <div className="flex flex-col items-center flex-1 mx-4 h-full justify-end">
                    <div className={`w-full rounded-t-lg transition-all duration-1000 ease-out flex justify-center items-start pt-2 ${getColor(t1.OverallPercentage).bg} ring-2 ring-blue-300 ring-offset-1`}
                      style={{ height: `${Math.max(t1.OverallPercentage, 4)}%` }}>
                      <span className="text-xs font-black text-white font-mono">{t1.OverallPercentage}%</span>
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 mt-2 truncate w-full text-center">
                      {t1.TeacherName?.split(" ")[0]}
                      {t1.hasConfidential && " 🔒"}
                    </span>
                  </div>
                )}
                {t2 && (
                  <div className="flex flex-col items-center flex-1 mx-4 h-full justify-end">
                    <div className={`w-full rounded-t-lg transition-all duration-1000 ease-out flex justify-center items-start pt-2 ${getColor(t2.OverallPercentage).bg} ring-2 ring-indigo-300 ring-offset-1`}
                      style={{ height: `${Math.max(t2.OverallPercentage, 4)}%` }}>
                      <span className="text-xs font-black text-white font-mono">{t2.OverallPercentage}%</span>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 mt-2 truncate w-full text-center">
                      {t2.TeacherName?.split(" ")[0]}
                      {t2.hasConfidential && " 🔒"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {t1 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
                <span className="text-[9px] font-black uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded absolute top-4 right-4">Primary</span>
                <h2 className="text-lg font-black text-slate-900 pr-16">{t1.TeacherName}</h2>
                <p className="text-xs text-slate-400 font-medium mb-4">
                  {t1.TeacherID} • {t1.Designation} [{t1.Department}]
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center bg-slate-50 border p-2 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Obtained</span>
                    <span className="text-lg font-black text-slate-800 font-mono">{t1.TotalObtainedWeight}</span>
                  </div>
                  <div className="text-center bg-slate-50 border p-2 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Total Wt</span>
                    <span className="text-lg font-black text-slate-600 font-mono">{t1.TotalSessionWeight}</span>
                  </div>
                  <div className={`text-center border p-2 rounded-lg ${getColor(t1.OverallPercentage).fill}`}>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                      {t1.hasConfidential ? "Blended %" : "Score %"}
                    </span>
                    <span className={`text-lg font-black font-mono ${getColor(t1.OverallPercentage).text}`}>
                      {t1.OverallPercentage}%
                    </span>
                  </div>
                </div>
                {t1.hasConfidential && (
                  <div className="mt-3 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 flex justify-between text-xs">
                    <span className="text-indigo-700 font-semibold">
                      🔒 {t1.confidentialRecords.length} records blended
                    </span>
                    <span className="font-mono text-indigo-500">API: {t1.OriginalAPIPercentage}%</span>
                  </div>
                )}
              </div>
            )}

            {t2 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                <span className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded absolute top-4 right-4">Comparison</span>
                <h2 className="text-lg font-black text-slate-900 pr-16">{t2.TeacherName}</h2>
                <p className="text-xs text-slate-400 font-medium mb-4">
                  {t2.TeacherID} • {t2.Designation} [{t2.Department}]
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center bg-slate-50 border p-2 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Obtained</span>
                    <span className="text-lg font-black text-slate-800 font-mono">{t2.TotalObtainedWeight}</span>
                  </div>
                  <div className="text-center bg-slate-50 border p-2 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Total Wt</span>
                    <span className="text-lg font-black text-slate-600 font-mono">{t2.TotalSessionWeight}</span>
                  </div>
                  <div className={`text-center border p-2 rounded-lg ${getColor(t2.OverallPercentage).fill}`}>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                      {t2.hasConfidential ? "Blended %" : "Score %"}
                    </span>
                    <span className={`text-lg font-black font-mono ${getColor(t2.OverallPercentage).text}`}>
                      {t2.OverallPercentage}%
                    </span>
                  </div>
                </div>
                {t2.hasConfidential && (
                  <div className="mt-3 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 flex justify-between text-xs">
                    <span className="text-indigo-700 font-semibold">
                      🔒 {t2.confidentialRecords.length} records blended
                    </span>
                    <span className="font-mono text-indigo-500">API: {t2.OriginalAPIPercentage}%</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confidential Logs Tables */}
          {shouldShowConfidentialData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">
                  🔒 Teacher 1 — Confidential Logs (Dexie DB)
                </h4>
                {t1?.hasConfidential ? (
                  <div className="overflow-x-auto max-h-48 overflow-y-auto border rounded-lg">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-blue-50 text-blue-900 font-bold border-b sticky top-0">
                          <th className="p-2">Course</th>
                          <th className="p-2">Question</th>
                          <th className="p-2 text-center">Critical</th>
                          <th className="p-2 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-600">
                        {t1.confidentialRecords.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-slate-900">{r.courseCode}</td>
                            <td className="p-2 italic max-w-[150px] truncate" title={r.questionText}>{r.questionText}</td>
                            <td className="p-2 text-center">
                              {r.isCritical
                                ? <span className="text-rose-600 font-black text-[10px]">Yes</span>
                                : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="p-2 text-right font-black text-blue-600 font-mono">{r.score}/4</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic p-2">
                    No confidential logs for Teacher 1 in this session.
                  </p>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-3">
                  🔒 Teacher 2 — Confidential Logs (Dexie DB)
                </h4>
                {t2?.hasConfidential ? (
                  <div className="overflow-x-auto max-h-48 overflow-y-auto border rounded-lg">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-indigo-50 text-indigo-900 font-bold border-b sticky top-0">
                          <th className="p-2">Course</th>
                          <th className="p-2">Question</th>
                          <th className="p-2 text-center">Critical</th>
                          <th className="p-2 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-600">
                        {t2.confidentialRecords.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-slate-900">{r.courseCode}</td>
                            <td className="p-2 italic max-w-[150px] truncate" title={r.questionText}>{r.questionText}</td>
                            <td className="p-2 text-center">
                              {r.isCritical
                                ? <span className="text-rose-600 font-black text-[10px]">Yes</span>
                                : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="p-2 text-right font-black text-indigo-600 font-mono">{r.score}/4</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic p-2">
                    No confidential logs for Teacher 2 in this session.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── CORE FIX: Breakdown Table — Confidential row Dexie se ── */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">
              Granular Component Breakdown
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              🔒 Confidential row — Dexie local scores se replace hoti hai jab available ho
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3">Sub-KPI</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center bg-blue-50 text-blue-900 border-x border-slate-200">T1 Normalized</th>
                    <th className="p-3 text-center bg-blue-50 text-blue-900 border-r border-slate-200">T1 Achieved</th>
                    <th className="p-3 text-center bg-indigo-50 text-indigo-900 border-r border-slate-200">T2 Normalized</th>
                    <th className="p-3 text-center bg-indigo-50 text-indigo-900 border-r border-slate-200">T2 Achieved</th>
                    <th className="p-3 text-right">Max Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const t1B = t1?.Breakdown || [];
                    const t2B = t2?.Breakdown || [];
                    const allNames = Array.from(
                      new Set([...t1B.map(b => b.SubKPI), ...t2B.map(b => b.SubKPI)])
                    );

                    return allNames.map(name => {
                      const m1  = t1B.find(b => b.SubKPI === name);
                      const m2  = t2B.find(b => b.SubKPI === name);
                      const cat = m1?.Category || m2?.Category || "General";
                      const wt  = m1?.SubKPITotalWeight || m2?.SubKPITotalWeight || 100;

                      // Kya yeh row confidential hai?
                      const isConf = isConfidentialRow(name);

                      return (
                        <tr key={name}
                          className={`hover:bg-slate-50/70 font-medium text-slate-700 transition-colors ${
                            isConf ? "bg-indigo-50/30" : ""
                          }`}>
                          {/* Sub-KPI name + Dexie badge agar confidential */}
                          <td className="p-3 font-bold text-slate-900 max-w-xs">
                            <div className="flex items-center gap-2">
                              {name}
                              {isConf && (
                                <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                                  🔒 Dexie
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3">
                            <span className="text-[10px] font-bold border rounded px-2 py-0.5 bg-slate-50 uppercase tracking-wide text-slate-500">
                              {cat}
                            </span>
                          </td>

                          {/* T1 Normalized — Dexie value dikhao agar confidential */}
                          <td className="p-3 text-center bg-blue-50/10 font-mono font-bold border-x border-slate-100">
                            {m1 ? (
                              <span className={isConf && m1._fromDexie ? "text-indigo-600" : "text-blue-600"}>
                                {m1.NormalizedScore}%
                                {isConf && m1._fromDexie && (
                                  <span className="ml-1 text-[9px] text-indigo-400">🔒</span>
                                )}
                              </span>
                            ) : "—"}
                          </td>

                          {/* T1 Achieved */}
                          <td className="p-3 text-center bg-blue-50/10 font-mono font-black text-slate-900 border-r border-slate-100">
                            {m1 ? (
                              isConf && m1._fromDexie
                                ? <span className="text-indigo-600">{m1.RawScore}</span>
                                : m1.SubKPIObtainedWeight
                            ) : "0"}
                          </td>

                          {/* T2 Normalized */}
                          <td className="p-3 text-center bg-indigo-50/10 font-mono font-bold border-r border-slate-100">
                            {m2 ? (
                              <span className={isConf && m2._fromDexie ? "text-indigo-600" : "text-indigo-500"}>
                                {m2.NormalizedScore}%
                                {isConf && m2._fromDexie && (
                                  <span className="ml-1 text-[9px] text-indigo-400">🔒</span>
                                )}
                              </span>
                            ) : "—"}
                          </td>

                          {/* T2 Achieved */}
                          <td className="p-3 text-center bg-indigo-50/10 font-mono font-black text-slate-900 border-r border-slate-100">
                            {m2 ? (
                              isConf && m2._fromDexie
                                ? <span className="text-indigo-600">{m2.RawScore}</span>
                                : m2.SubKPIObtainedWeight
                            ) : "0"}
                          </td>

                          <td className="p-3 text-right font-mono font-black text-slate-400">{wt}</td>
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
          <div className="text-4xl mb-3">⚠️</div>
          <p>Specified parameters ke liye koi data nahi mila.</p>
        </div>
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-14 text-center text-slate-400 font-medium shadow-sm">
          <div className="text-4xl mb-3">📊</div>
          <p>Teachers select karke <b className="text-slate-600">"Run Compare Review"</b> click karein.</p>
        </div>
      )}
    </div>
  );
};

export default KPIBaseComparison;