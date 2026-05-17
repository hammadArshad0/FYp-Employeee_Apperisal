import React, { useState, useEffect } from "react";
import DataService from "../../../services/axios";
import db from "../../../db";

// ─────────────────────────────────────────────────────────────
// STEP 1: Dexie se confidential avg nikalo (0–4 scale)
// ─────────────────────────────────────────────────────────────
const getDexieConfidentialAvg = (dexieRecs) => {
  if (!dexieRecs || dexieRecs.length === 0) return null;
  const total = dexieRecs.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
  return total / dexieRecs.length; // 0–4 raw avg
};

// ─────────────────────────────────────────────────────────────
// STEP 2: Overall % — confidential KPI ka weight dexie se replace karo
// Baki sab KPIs as-is rakhna
// ─────────────────────────────────────────────────────────────
const computeOverallWithDexie = (teacher, dexieAvgRaw) => {
  const breakdown = teacher.Breakdown || [];
  if (breakdown.length === 0) return teacher.OverallPercentage;

  let totalObtained = 0;
  let totalWeight = 0;

  breakdown.forEach((b) => {
    const isConf = (b.SubKPI || "").toLowerCase().includes("confidential");
    const weight = Number(b.SubKPITotalWeight) || 0;

    if (isConf && dexieAvgRaw !== null) {
      // Dexie avg (0–4) ko normalize karke weight apply karo
      const dexieNorm = Math.min(1, dexieAvgRaw / 4.0);
      totalObtained += dexieNorm * weight;
    } else {
      totalObtained += Number(b.SubKPIObtainedWeight) || 0;
    }
    totalWeight += weight;
  });

  if (totalWeight === 0) return teacher.OverallPercentage;
  return Math.min(100, Math.round((totalObtained / totalWeight) * 100 * 10) / 10);
};

// ─────────────────────────────────────────────────────────────
// STEP 3: Breakdown rows patch karo — confidential row dexie se
// ─────────────────────────────────────────────────────────────
const patchBreakdownWithDexie = (breakdown, dexieAvgRaw) => {
  if (!breakdown) return [];
  return breakdown.map((b) => {
    const isConf = (b.SubKPI || "").toLowerCase().includes("confidential");
    if (!isConf || dexieAvgRaw === null) return b;

    const weight = Number(b.SubKPITotalWeight) || 1;
    const dexieNorm = Math.min(1, dexieAvgRaw / 4.0);
    const dexieObtained = Math.round(dexieNorm * weight * 100) / 100;
    const dexieNormPct = Math.round(dexieNorm * 100);

    return {
      ...b,
      RawScore: `${(dexieAvgRaw).toFixed(2)} (Dexie)`,
      NormalizedScore: dexieNormPct,
      SubKPIObtainedWeight: dexieObtained,
      _fromDexie: true,
    };
  });
};

// ─────────────────────────────────────────────────────────────
// Color helpers
// ─────────────────────────────────────────────────────────────
const getColor = (pct) => {
  if (pct < 40) return { bg: "bg-rose-500", text: "text-rose-600", lightBg: "bg-rose-50", border: "border-rose-200", hex: "#f43f5e" };
  if (pct < 70) return { bg: "bg-amber-500", text: "text-amber-600", lightBg: "bg-amber-50", border: "border-amber-200", hex: "#f59e0b" };
  if (pct < 85) return { bg: "bg-blue-500",  text: "text-blue-600",  lightBg: "bg-blue-50",  border: "border-blue-200",  hex: "#3b82f6" };
  return             { bg: "bg-emerald-500", text: "text-emerald-600", lightBg: "bg-emerald-50", border: "border-emerald-200", hex: "#10b981" };
};

const getLabel = (pct) =>
  pct < 40 ? "Critical" : pct < 70 ? "Average" : pct < 85 ? "Good" : "Excellent";

// ─────────────────────────────────────────────────────────────
// Mini circular ring for overall
// ─────────────────────────────────────────────────────────────
function MiniRing({ value, hex }) {
  const r = 22, circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, value) / 100) * circ;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={hex} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 28 28)" style={{ transition: "stroke-dashoffset 1s ease" }} />
      <text x="28" y="33" textAnchor="middle" fontSize="10" fontWeight="900" fill={hex}>
        {Math.round(value)}%
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// MetricBar
// ─────────────────────────────────────────────────────────────
function MetricBar({ label, value, fromDexie = false }) {
  const safe = Math.min(100, Math.max(0, Math.round(value || 0)));
  const c = getColor(safe);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 px-0.5">
        <div className="flex items-center gap-2">
          <span>{label}</span>
          {fromDexie && (
            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[8px] font-black">
              🔒 Dexie
            </span>
          )}
        </div>
        <span className={`font-black ${c.text}`}>{safe}%</span>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${c.bg}`}
          style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
const KPIBasePerformance = () => {
  const [sessions, setSessions]         = useState([]);
  const [kpis, setKpis]                 = useState([]);
  const [subKpis, setSubKpis]           = useState([]);
  const [performers, setPerformers]     = useState([]);
  const [localEvaluations, setLocalEvaluations] = useState([]);

  const [selectedSession, setSelectedSession] = useState("");
  const [selectedKpi, setSelectedKpi]   = useState("");
  const [selectedSubKpi, setSelectedSubKpi] = useState("");
  const [searchQuery, setSearchQuery]   = useState("");
  const [expandedTeacher, setExpandedTeacher] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [hasSearched, setHasSearched]   = useState(false);

  // Sessions
  useEffect(() => {
    DataService.get("/KPIBasePerformance/GetSessions")
      .then(r => setSessions(r.data || []))
      .catch(e => console.error(e));
  }, []);

  // Dexie sync on session change
  useEffect(() => {
    if (!selectedSession) { setLocalEvaluations([]); return; }
    db.evaluations.where("sessionId").equals(String(selectedSession)).toArray()
      .then(d => setLocalEvaluations(d || []))
      .catch(e => console.error(e));
  }, [selectedSession]);

  const handleSessionChange = async (e) => {
    const id = e.target.value;
    setSelectedSession(id); setSelectedKpi(""); setSelectedSubKpi("");
    setKpis([]); setSubKpis([]); setPerformers([]); setHasSearched(false);
    if (id) {
      setLoading(true);
      try { const r = await DataService.get(`/KPIBasePerformance/GetKPIsBySession/${id}`); setKpis(r.data || []); }
      catch (e) { console.error(e); } finally { setLoading(false); }
    }
  };

  const handleKpiChange = async (e) => {
    const id = e.target.value;
    setSelectedKpi(id); setSelectedSubKpi(""); setSubKpis([]); setPerformers([]); setHasSearched(false);
    if (id) {
      setLoading(true);
      try { const r = await DataService.get(`/KPIBasePerformance/GetSubKPIsByKPIAndSession/${id}/${selectedSession}`); setSubKpis(r.data || []); }
      catch (e) { console.error(e); } finally { setLoading(false); }
    }
  };

  const handleSubKpiChange = (e) => {
    setSelectedSubKpi(e.target.value); setPerformers([]); setHasSearched(false);
  };

  const handleFetchRankings = async () => {
    if (!selectedSession) { alert("Please select an academic session."); return; }
    setLoading(true); setHasSearched(true); setExpandedTeacher(null);
    try {
      let url = `/KPIBasePerformance/GetTeacherRankingV2?sessionId=${selectedSession}`;
      if (selectedKpi) url += `&kpiId=${selectedKpi}`;
      if (selectedSubKpi) url += `&subKpiId=${selectedSubKpi}`;
      const r = await DataService.get(url);
      setPerformers(r.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // ── Merge dexie into each teacher ──
  const mergedPerformers = performers
    .filter(t => {
      const q = searchQuery.toLowerCase();
      return (t.TeacherName?.toLowerCase().includes(q) ||
        String(t.TeacherID).toLowerCase().includes(q) ||
        t.Department?.toLowerCase().includes(q));
    })
    .map(teacher => {
      const dexieRecs = localEvaluations.filter(
        ev => String(ev.teacherId) === String(teacher.TeacherID)
      );
      const dexieAvgRaw      = getDexieConfidentialAvg(dexieRecs);        // null or 0–4
      const hasConf          = dexieAvgRaw !== null;

      // ✅ Overall % — confidential weight dexie se replace hoke compute ho
      const overallPct       = computeOverallWithDexie(teacher, dexieAvgRaw);

      // ✅ Breakdown rows — confidential row dexie values se patch
      const patchedBreakdown = patchBreakdownWithDexie(teacher.Breakdown, dexieAvgRaw);

      // ✅ Academic KPI group — confidential sub-row dexie se
      // Group breakdown by Category for Academic KPI display
      const kpiGroups = {};
      patchedBreakdown.forEach(b => {
        const cat = b.Category || "Other";
        if (!kpiGroups[cat]) kpiGroups[cat] = { items: [], totalW: 0, obtainedW: 0 };
        kpiGroups[cat].items.push(b);
        kpiGroups[cat].totalW   += Number(b.SubKPITotalWeight) || 0;
        kpiGroups[cat].obtainedW += Number(b.SubKPIObtainedWeight) || 0;
      });

      // Per-category percentage
      Object.keys(kpiGroups).forEach(cat => {
        const g = kpiGroups[cat];
        g.pct = g.totalW > 0 ? Math.round((g.obtainedW / g.totalW) * 100) : 0;
      });

      // Confidential % for MetricBar
      const confPct = hasConf
        ? Math.round((dexieAvgRaw / 4.0) * 100)
        : (() => {
            const confRow = (teacher.Breakdown || []).find(b =>
              (b.SubKPI || "").toLowerCase().includes("confidential"));
            return confRow
              ? Math.round(((confRow.SubKPIObtainedWeight || 0) / (confRow.SubKPITotalWeight || 1)) * 100)
              : 0;
          })();

      return {
        ...teacher,
        OverallPercentage: overallPct,
        OriginalOverall:   teacher.OverallPercentage,
        hasConfidentialData: hasConf,
        dexieAvgRaw,
        confidentialRecords: dexieRecs,
        patchedBreakdown,
        kpiGroups,
        confPct,
      };
    })
    .sort((a, b) => b.OverallPercentage - a.OverallPercentage);

  // ─────────────────────────────────────────────
  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">

      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teacher Performance Rankings</h1>
          <p className="text-sm text-slate-500">Real-time analytics — confidential scores blended via Dexie</p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            Compiling Live Matrix...
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Select Session</label>
            <select value={selectedSession} onChange={handleSessionChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">-- Choose Session --</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Main KPI</label>
            <select value={selectedKpi} disabled={!selectedSession} onChange={handleKpiChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50">
              <option value="">-- All KPIs --</option>
              {kpis.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Sub-KPI</label>
            <select value={selectedSubKpi} disabled={!selectedKpi} onChange={handleSubKpiChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50">
              <option value="">-- All Sub-KPIs --</option>
              {subKpis.map(sk => <option key={sk.id} value={sk.id}>{sk.name}</option>)}
            </select>
          </div>
          <button onClick={handleFetchRankings} disabled={!selectedSession || loading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-all shadow-sm flex justify-center items-center gap-2 disabled:cursor-not-allowed">
            <span>📊</span> Generate Rankings
          </button>
        </div>
      </div>

      {/* Results */}
      {hasSearched && mergedPerformers.length > 0 ? (
        <>
          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
              Performance Overview
              {mergedPerformers.some(t => t.hasConfidentialData) && (
                <span className="ml-3 text-indigo-500">🔒 Confidential scores included</span>
              )}
            </h2>
            <div className="flex h-72 items-end border-b-2 border-l-2 border-slate-200 pl-2 pb-1">
              <div className="w-full flex justify-around items-end h-full pt-4">
                {mergedPerformers.map((t, i) => {
                  const c = getColor(t.OverallPercentage);
                  return (
                    <div key={t.TeacherID} className="flex flex-col items-center flex-1 max-w-[60px] mx-1 h-full justify-end group relative">
                      <div
                        className={`w-full rounded-t-md transition-all duration-700 flex justify-center items-start pt-1.5 ${c.bg} ${t.hasConfidentialData ? "ring-2 ring-indigo-400 ring-offset-1" : ""}`}
                        style={{ height: `${t.OverallPercentage}%` }}
                      >
                        <span className="text-[9px] font-black text-white">{t.OverallPercentage}%</span>
                      </div>
                      <div className="absolute bottom-[-24px] text-[10px] font-bold text-slate-600 truncate w-full text-center">
                        {i + 1}. {t.TeacherName.split(" ")[0]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="h-6" />
          </div>

          {/* Search */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <input type="text" placeholder="Filter by name, ID, department..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:max-w-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-xs text-slate-400">
              Showing {mergedPerformers.length} teachers
              {localEvaluations.length > 0 && (
                <span className="ml-3 text-indigo-500 font-semibold">🔒 {localEvaluations.length} confidential records loaded</span>
              )}
            </span>
          </div>

          {/* Teacher Cards */}
          <div className="space-y-3">
            {mergedPerformers.map((teacher, index) => {
              const isExpanded = expandedTeacher === teacher.TeacherID;
              const c = getColor(teacher.OverallPercentage);

              return (
                <div key={teacher.TeacherID} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

                  {/* ── Card Header (clickable) ── */}
                  <div onClick={() => setExpandedTeacher(isExpanded ? null : teacher.TeacherID)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 select-none">

                    <div className="flex items-center gap-4">
                      {/* Rank + Ring */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full font-extrabold text-sm bg-slate-100 text-slate-700">{index + 1}</div>
                      </div>
                      {/* ✅ Overall ring — confidential included */}
                      <MiniRing value={teacher.OverallPercentage} hex={c.hex} />

                      <div>
                        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 flex-wrap">
                          {teacher.TeacherName}
                          {teacher.hasConfidentialData && (
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              🔒 Confidential Merged
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-400">{teacher.TeacherID} • {teacher.Department}</p>
                        {/* ✅ Show original vs blended if dexie exists */}
                        {teacher.hasConfidentialData && (
                          <p className="text-[10px] text-indigo-500 font-bold mt-0.5">
                            API Overall: {teacher.OriginalOverall}% → Dexie-Blended: {teacher.OverallPercentage}%
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Weight badges */}
                    <div className="flex items-center gap-3 text-xs">
                      <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-center">
                        <span className="text-slate-400 block font-medium uppercase text-[9px]">Obtained</span>
                        <span className="font-bold text-slate-800 font-mono text-sm">{teacher.TotalObtainedWeight}</span>
                      </div>
                      <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-center">
                        <span className="text-slate-400 block font-medium uppercase text-[9px]">Total Weight</span>
                        <span className="font-bold text-slate-600 font-mono text-sm">{teacher.TotalSessionWeight}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex-1 max-w-xs">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 font-medium">Overall Performance</span>
                        <span className={`font-black ${c.text}`}>{teacher.OverallPercentage}%
                          <span className="ml-1 text-[10px] font-bold opacity-70">{getLabel(teacher.OverallPercentage)}</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${c.bg}`}
                          style={{ width: `${teacher.OverallPercentage}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* ── Expanded Section ── */}
                  {isExpanded && (
                    <div className={`${c.lightBg} border-t border-slate-100 p-5 space-y-5`}>

                      {/* ✅ SubKPI name bars — har SubKPI apni bar ke saath */}
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                          KPI Breakdown — by Sub-KPI
                        </h4>
                        <div className="space-y-4">
                          {teacher.patchedBreakdown.map((b, idx) => {
                            const subPct = Number(b.SubKPITotalWeight) > 0
                              ? Math.min(100, Math.round((Number(b.SubKPIObtainedWeight) / Number(b.SubKPITotalWeight)) * 100))
                              : 0;
                            return (
                              <div key={idx}>
                                <div className="flex items-center justify-between mb-1 px-0.5">
                                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
                                    {/* ✅ SubKPI name show ho raha hai */}
                                    <span>{b.SubKPI}</span>
                                    {b._fromDexie && (
                                      <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[8px] font-black">
                                        🔒 Dexie
                                      </span>
                                    )}
                                  </div>
                                  <span className={`text-xs font-black ${getColor(subPct).text}`}>{subPct}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-700 ${getColor(subPct).bg}`}
                                    style={{ width: `${subPct}%` }} />
                                </div>
                                <p className="text-[9px] text-slate-400 mt-0.5 px-0.5">
                                  Obtained: {Number(b.SubKPIObtainedWeight).toFixed(2)} / {b.SubKPITotalWeight}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* ✅ Dexie records table */}
                      {teacher.hasConfidentialData && (
                        <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm">
                          <h4 className="text-xs font-black text-indigo-800 uppercase tracking-wider mb-3">
                            🔒 Local Confidential Records (Dexie)
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-indigo-50 text-indigo-900 font-bold border-b border-indigo-100">
                                  <th className="p-2">Course Code</th>
                                  <th className="p-2">Student</th>
                                  <th className="p-2">Question</th>
                                  <th className="p-2 text-right">Score (1–4)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {teacher.confidentialRecords.map((item, idx) => (
                                  <tr key={idx} className="border-b border-slate-100 text-slate-700">
                                    <td className="p-2 font-mono font-bold">{item.courseCode}</td>
                                    <td className="p-2">{item.studentName || "Anonymous"}</td>
                                    <td className="p-2 italic text-slate-500">{item.questionText || "Confidential Review"}</td>
                                    <td className="p-2 text-right font-black text-indigo-600">{item.score}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-indigo-50">
                                  <td colSpan="3" className="p-2 text-right font-black text-indigo-700 uppercase text-[10px]">
                                    Avg Score
                                  </td>
                                  <td className="p-2 text-right font-black text-indigo-700">
                                    {teacher.dexieAvgRaw?.toFixed(2)} / 4.0
                                    <span className="ml-2 text-indigo-500">({teacher.confPct}%)</span>
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* ✅ SubKPI breakdown table — confidential row dexie se patched */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                          Sub-KPI Detail Breakdown
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                <th className="p-2">Sub-KPI</th>
                                <th className="p-2">Category</th>
                                <th className="p-2 text-center">Raw Score</th>
                                <th className="p-2 text-center">Normalized %</th>
                                <th className="p-2 text-center">Obtained Wt.</th>
                                <th className="p-2 text-right">Total Wt.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {teacher.patchedBreakdown.map((b, idx) => (
                                <tr key={idx}
                                  className={`border-b border-slate-100 font-medium ${b._fromDexie ? "bg-indigo-50" : "text-slate-700"}`}>
                                  <td className="p-2 font-semibold text-slate-900 flex items-center gap-1.5">
                                    {b.SubKPI}
                                    {/* ✅ Confidential subKPI row — dexie badge */}
                                    {b._fromDexie && (
                                      <span className="bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded text-[8px] font-black">
                                        🔒 Dexie
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2">
                                    <span className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-bold uppercase text-slate-500">
                                      {b.Category}
                                    </span>
                                  </td>
                                  <td className={`p-2 text-center font-mono ${b._fromDexie ? "text-indigo-700 font-bold" : ""}`}>
                                    {b.RawScore}
                                  </td>
                                  <td className={`p-2 text-center font-semibold ${b._fromDexie ? "text-indigo-600" : "text-blue-600"}`}>
                                    {b.NormalizedScore}%
                                  </td>
                                  <td className={`p-2 text-center font-bold font-mono ${b._fromDexie ? "text-indigo-600" : "text-emerald-600"}`}>
                                    {b.SubKPIObtainedWeight}
                                  </td>
                                  <td className="p-2 text-right text-slate-500 font-bold font-mono">
                                    {b.SubKPITotalWeight}
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
            })}
          </div>
        </>
      ) : hasSearched ? (
        <div className="bg-white border border-dashed border-rose-300 rounded-xl p-14 text-center text-slate-500">
          ⚠️ No valid metrics found for selected criteria.
        </div>
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-14 text-center text-slate-400">
          📊 Filters select karein aur <b>"Generate Rankings"</b> click karein.
        </div>
      )}
    </div>
  );
};

export default KPIBasePerformance;