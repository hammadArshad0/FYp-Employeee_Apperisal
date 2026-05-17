import React, { useState, useEffect } from "react";
import DataService from "../../../services/axios";
import db from "../../../db";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Dexie avg normalize karo (score 1-4 scale default)
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
// CONFIDENTIAL EVALUATION FORM (Modal)
// Yahan evaluator questions ke answers submit karta hai
// Jo directly Dexie mein save hote hain — server pe nahi jate
// ─────────────────────────────────────────────────────────────────────────────
const ConfidentialEvalModal = ({
  sessionId,
  sessionName,
  teacher,        // { id, name, department }
  onClose,
  onSaved,
}) => {
  // Hardcoded confidential questions — ya API se bhi la sakte hain
  const confidentialQuestions = [
    { id: 1, text: "Teacher course content adequately cover karta hai?",          type: "Confidential", isCritical: false },
    { id: 2, text: "Teacher class mein professional conduct maintain karta hai?", type: "Confidential", isCritical: true  },
    { id: 3, text: "Teacher ne student complaints properly address kiye?",        type: "Confidential", isCritical: true  },
    { id: 4, text: "Teacher time management aur punctuality kaisi hai?",          type: "Confidential", isCritical: false },
    { id: 5, text: "Teacher student engagement aur participation encourage karta hai?", type: "Confidential", isCritical: false },
  ];

  const [answers, setAnswers] = useState({});         // { questionId: score }
  const [courseCode, setCourseCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const allAnswered =
    courseCode.trim() !== "" &&
    confidentialQuestions.every((q) => answers[q.id] !== undefined);

  const handleSave = async () => {
    if (!allAnswered) return;
    setSaving(true);
    try {
      const records = confidentialQuestions.map((q) => ({
        // Student/evaluator info — aap user context se inject karein
        studentId:   "EVALUATOR",
        studentName: "Confidential Evaluator",

        // Teacher + Session
        teacherId:   String(teacher.id),
        teacherName: teacher.name,
        sessionId:   String(sessionId),
        sessionName: sessionName || "",

        // Course
        courseCode: courseCode.trim().toUpperCase(),
        courseTitle: "",

        // Question
        questionId:   q.id,
        questionText: q.text,
        questionType: q.type,
        isCritical:   q.isCritical,

        // Score (1-4 scale)
        score: parseInt(answers[q.id]),

        // Meta
        submittedAt: new Date().toISOString(),
      }));

      await db.evaluations.bulkAdd(records);
      setSaved(true);
      setTimeout(() => {
        onSaved();   // parent ko batao — Dexie refresh kare
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Dexie save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-start justify-between rounded-t-2xl">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              🔒 Confidential Evaluation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {teacher.name} — {teacher.department}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl font-bold leading-none mt-0.5"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Course Code Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Course Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g. CS-301"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
            />
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Evaluation Questions (Score: 1 = Poor, 4 = Excellent)
            </p>
            {confidentialQuestions.map((q) => (
              <div key={q.id} className={`rounded-xl border p-4 ${q.isCritical ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"}`}>
                <p className="text-sm font-semibold text-slate-800 mb-3 flex items-start gap-2">
                  {q.isCritical && (
                    <span className="text-[10px] bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide mt-0.5 shrink-0">
                      Critical
                    </span>
                  )}
                  {q.text}
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((score) => (
                    <button
                      key={score}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: score }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-black border transition-all ${
                        answers[q.id] === score
                          ? score <= 1
                            ? "bg-rose-500 text-white border-rose-500"
                            : score === 2
                            ? "bg-amber-500 text-white border-amber-500"
                            : score === 3
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-emerald-500 text-white border-emerald-500"
                          : "bg-white text-slate-500 border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                  <span>Poor</span><span>Below Avg</span><span>Good</span><span>Excellent</span>
                </div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!allAnswered || saving || saved}
            className={`w-full py-3 rounded-xl font-black text-sm transition-all ${
              saved
                ? "bg-emerald-500 text-white"
                : allAnswered
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {saved ? "✅ Saved to Local DB" : saving ? "Saving..." : "🔒 Save Confidential Evaluation"}
          </button>

          <p className="text-[11px] text-slate-400 text-center">
            Yeh data sirf aapke device par locally save hoga — server pe nahi jayega
          </p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const KPIBaseComparison = () => {

  // Core Lists
  const [sessions, setSessions]   = useState([]);
  const [teachers, setTeachers]   = useState([]);
  const [kpis, setKpis]           = useState([]);
  const [subKpis, setSubKpis]     = useState([]);

  // Selections
  const [selectedSession, setSelectedSession]   = useState("");
  const [selectedTeacher1, setSelectedTeacher1] = useState("");
  const [selectedTeacher2, setSelectedTeacher2] = useState("");
  const [selectedKpi, setSelectedKpi]           = useState("");
  const [selectedSubKpi, setSelectedSubKpi]     = useState("");

  // Dexie buffers
  const [t1ConfidentialRecs, setT1ConfidentialRecs] = useState([]);
  const [t2ConfidentialRecs, setT2ConfidentialRecs] = useState([]);

  // Comparison result + UI state
  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [hasCalculated, setHasCalculated]       = useState(false);

  // Modal state — kaunse teacher ka modal open hai
  const [evalModalTeacher, setEvalModalTeacher] = useState(null); // { id, name, department }

  // Sessions on mount
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

  // ── Dexie refresh — jab modal close ho ya session change ho ────────────────
  const refreshDexieRecords = async (sessionId, t1Id, t2Id) => {
    if (!sessionId) return;
    try {
      const [d1, d2] = await Promise.all([
        t1Id
          ? db.evaluations
              .where("sessionId").equals(String(sessionId))
              .and((r) => String(r.teacherId) === String(t1Id))
              .toArray()
          : Promise.resolve([]),
        t2Id
          ? db.evaluations
              .where("sessionId").equals(String(sessionId))
              .and((r) => String(r.teacherId) === String(t2Id))
              .toArray()
          : Promise.resolve([]),
      ]);
      setT1ConfidentialRecs(d1 || []);
      setT2ConfidentialRecs(d2 || []);
    } catch (err) {
      console.error("Dexie refresh failed:", err);
    }
  };

  // ── Session change ──────────────────────────────────────────────────────────
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
          DataService.get(`/KPIBasePerformance/GetKPIsBySession/${sessionId}`),
        ]);
        setTeachers(teacherRes.data || []);
        setKpis(kpiRes.data || []);
      } catch (err) {
        console.error("Session init failed:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  // ── KPI change ─────────────────────────────────────────────────────────────
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
        const res = await DataService.get(
          `/KPIBasePerformance/GetSubKPIsByKPIAndSession/${kpiId}/${selectedSession}`
        );
        setSubKpis(res.data || []);
      } catch (err) {
        console.error("SubKPI fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubKpiChange = (e) => {
    setSelectedSubKpi(e.target.value);
    setComparisonResult(null);
    setHasCalculated(false);
  };

  // ── Run comparison ──────────────────────────────────────────────────────────
  const handleComparePerformances = async () => {
    if (!selectedSession || !selectedTeacher1 || !selectedTeacher2) {
      alert("Session, Teacher 1 aur Teacher 2 select karein.");
      return;
    }
    if (selectedTeacher1 === selectedTeacher2) {
      alert("Do alag teachers select karein comparison ke liye.");
      return;
    }

    setLoading(true);
    setHasCalculated(true);

    try {
      let url = `/KpiBaseComparision/GetTeacherComparison?sessionId=${selectedSession}&teacher1Id=${selectedTeacher1}&teacher2Id=${selectedTeacher2}`;
      if (selectedKpi)    url += `&kpiId=${selectedKpi}`;
      if (selectedSubKpi) url += `&subKpiId=${selectedSubKpi}`;

      const res = await DataService.get(url);
      setComparisonResult(res.data);

      // Dexie records bhi fresh lo
      await refreshDexieRecords(selectedSession, selectedTeacher1, selectedTeacher2);
    } catch (err) {
      console.error("Comparison failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Color helper ────────────────────────────────────────────────────────────
  const getColor = (pct) => {
    if (pct < 40) return { bg: "bg-rose-500",    text: "text-rose-600",    fill: "bg-rose-50 border-rose-200"    };
    if (pct < 70) return { bg: "bg-amber-500",   text: "text-amber-600",   fill: "bg-amber-50 border-amber-200"  };
    if (pct < 85) return { bg: "bg-blue-500",    text: "text-blue-600",    fill: "bg-blue-50 border-blue-200"    };
    return               { bg: "bg-emerald-500", text: "text-emerald-600", fill: "bg-emerald-50 border-emerald-200" };
  };

  // ── Confidential display logic ──────────────────────────────────────────────
  const currentKpiObj    = kpis.find((k) => String(k.id) === String(selectedKpi));
  const currentSubKpiObj = subKpis.find((s) => String(s.id) === String(selectedSubKpi));
  const isKpiConf        = currentKpiObj?.name?.toLowerCase().includes("confidential");
  const isSubKpiConf     = currentSubKpiObj?.name?.toLowerCase().includes("confidential");
  const shouldShowConfidentialData =
    selectedSession && (selectedKpi === "" || isKpiConf || isSubKpiConf);

  // ── Blended teacher objects ─────────────────────────────────────────────────
  const rawT1 = comparisonResult?.Teacher1;
  const rawT2 = comparisonResult?.Teacher2;

  const t1 = rawT1
    ? {
        ...rawT1,
        OriginalAPIPercentage: rawT1.OverallPercentage,
        OverallPercentage: shouldShowConfidentialData
          ? blendWithDexie(rawT1.OverallPercentage, t1ConfidentialRecs, 4, 0.3)
          : rawT1.OverallPercentage,
        hasConfidential:    shouldShowConfidentialData && t1ConfidentialRecs.length > 0,
        confidentialRecords: t1ConfidentialRecs,
      }
    : null;

  const t2 = rawT2
    ? {
        ...rawT2,
        OriginalAPIPercentage: rawT2.OverallPercentage,
        OverallPercentage: shouldShowConfidentialData
          ? blendWithDexie(rawT2.OverallPercentage, t2ConfidentialRecs, 4, 0.3)
          : rawT2.OverallPercentage,
        hasConfidential:    shouldShowConfidentialData && t2ConfidentialRecs.length > 0,
        confidentialRecords: t2ConfidentialRecs,
      }
    : null;

  // Teacher objects for modal button (before comparison runs)
  const teacher1Obj = teachers.find((t) => String(t.id) === String(selectedTeacher1));
  const teacher2Obj = teachers.find((t) => String(t.id) === String(selectedTeacher2));

  // ─────────────────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">

      {/* ── Confidential Eval Modal ── */}
      {evalModalTeacher && (
        <ConfidentialEvalModal
          sessionId={selectedSession}
          sessionName={sessions.find((s) => String(s.id) === String(selectedSession))?.name || ""}
          teacher={evalModalTeacher}
          onClose={() => setEvalModalTeacher(null)}
          onSaved={() => {
            // Modal close ke baad Dexie refresh + agar comparison chal raha tha to reblend
            refreshDexieRecords(selectedSession, selectedTeacher1, selectedTeacher2);
          }}
        />
      )}

      {/* ── Header ── */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            KPI-Based Teacher Comparison
          </h1>
          <p className="text-sm text-slate-500">
            Side-by-side analytics with confidential evaluation support
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-200 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            Loading...
          </div>
        )}
      </div>

      {/* ── Dropdowns ── */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {/* Session */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              1. Academic Session
            </label>
            <select
              value={selectedSession}
              onChange={handleSessionChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Choose Session --</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* KPI */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              2. Main KPI Scope
            </label>
            <select
              value={selectedKpi}
              disabled={!selectedSession}
              onChange={handleKpiChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">-- Overall (All KPIs) --</option>
              {kpis.map((k) => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
          </div>

          {/* Sub-KPI */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              3. Sub-KPI Filter
            </label>
            <select
              value={selectedSubKpi}
              disabled={!selectedKpi}
              onChange={handleSubKpiChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">-- All Sub-KPIs --</option>
              {subKpis.map((sk) => (
                <option key={sk.id} value={sk.id}>{sk.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Teacher selection + Confidential buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-4 border-t border-slate-100">

          {/* Teacher 1 */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
              Primary Instructor (T1)
            </label>
            <select
              value={selectedTeacher1}
              disabled={!selectedSession}
              onChange={(e) => {
                setSelectedTeacher1(e.target.value);
                setHasCalculated(false);
              }}
              className="w-full bg-blue-50/40 border border-blue-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">-- Choose Teacher 1 --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name} [{t.department}]</option>
              ))}
            </select>

            {/* Add Confidential Eval button for T1 */}
            {selectedTeacher1 && teacher1Obj && (
              <button
                onClick={() =>
                  setEvalModalTeacher({
                    id: teacher1Obj.id,
                    name: teacher1Obj.name,
                    department: teacher1Obj.department,
                  })
                }
                className="mt-2 w-full text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg py-1.5 flex items-center justify-center gap-1.5 transition-all"
              >
                🔒 Add Confidential Evaluation
                {t1ConfidentialRecs.length > 0 && (
                  <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                    {t1ConfidentialRecs.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Teacher 2 */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2">
              Comparison Instructor (T2)
            </label>
            <select
              value={selectedTeacher2}
              disabled={!selectedSession}
              onChange={(e) => {
                setSelectedTeacher2(e.target.value);
                setHasCalculated(false);
              }}
              className="w-full bg-indigo-50/40 border border-indigo-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">-- Choose Teacher 2 --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name} [{t.department}]</option>
              ))}
            </select>

            {/* Add Confidential Eval button for T2 */}
            {selectedTeacher2 && teacher2Obj && (
              <button
                onClick={() =>
                  setEvalModalTeacher({
                    id: teacher2Obj.id,
                    name: teacher2Obj.name,
                    department: teacher2Obj.department,
                  })
                }
                className="mt-2 w-full text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg py-1.5 flex items-center justify-center gap-1.5 transition-all"
              >
                🔒 Add Confidential Evaluation
                {t2ConfidentialRecs.length > 0 && (
                  <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                    {t2ConfidentialRecs.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Run button */}
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

      {/* ── Results ── */}
      {hasCalculated && comparisonResult && (t1 || t2) ? (
        <div className="space-y-6">

          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
              Visual Performance Ratio
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {shouldShowConfidentialData
                ? "Confidential scores blended (30% Dexie + 70% API)"
                : "Standard API score comparison"}
            </p>

            <div className="flex h-64 items-end border-b-2 border-l-2 border-slate-300 pl-4 pb-2 relative max-w-md mx-auto">
              <div className="absolute left-[-45px] top-0 bottom-0 flex flex-col justify-between text-[10px] font-bold text-slate-400 pb-2">
                <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
              </div>
              <div className="w-full flex justify-around items-end h-full pt-4">
                {t1 && (
                  <div className="flex flex-col items-center flex-1 mx-4 h-full justify-end">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-1000 ease-out flex justify-center items-start pt-2 ${getColor(t1.OverallPercentage).bg} ring-2 ring-blue-300 ring-offset-1`}
                      style={{ height: `${Math.max(t1.OverallPercentage, 4)}%` }}
                    >
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
                    <div
                      className={`w-full rounded-t-lg transition-all duration-1000 ease-out flex justify-center items-start pt-2 ${getColor(t2.OverallPercentage).bg} ring-2 ring-indigo-300 ring-offset-1`}
                      style={{ height: `${Math.max(t2.OverallPercentage, 4)}%` }}
                    >
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
            {/* T1 Card */}
            {t1 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
                <span className="text-[9px] font-black uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded absolute top-4 right-4">
                  Primary
                </span>
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

                {/* Confidential summary for T1 */}
                {t1.hasConfidential && (
                  <div className="mt-3 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                    <span className="text-indigo-700 font-semibold">
                      🔒 {t1.confidentialRecords.length} confidential records blended
                    </span>
                    <span className="font-mono text-indigo-500">
                      API: {t1.OriginalAPIPercentage}%
                    </span>
                  </div>
                )}

                {/* Add eval button inside card too */}
                <button
                  onClick={() =>
                    setEvalModalTeacher({
                      id: teacher1Obj?.id || selectedTeacher1,
                      name: t1.TeacherName,
                      department: t1.Department,
                    })
                  }
                  className="mt-3 w-full text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg py-1.5 flex items-center justify-center gap-1.5 transition-all"
                >
                  🔒 Add / Update Confidential Evaluation
                </button>
              </div>
            )}

            {/* T2 Card */}
            {t2 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                <span className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded absolute top-4 right-4">
                  Comparison
                </span>
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
                  <div className="mt-3 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                    <span className="text-indigo-700 font-semibold">
                      🔒 {t2.confidentialRecords.length} confidential records blended
                    </span>
                    <span className="font-mono text-indigo-500">
                      API: {t2.OriginalAPIPercentage}%
                    </span>
                  </div>
                )}

                <button
                  onClick={() =>
                    setEvalModalTeacher({
                      id: teacher2Obj?.id || selectedTeacher2,
                      name: t2.TeacherName,
                      department: t2.Department,
                    })
                  }
                  className="mt-3 w-full text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg py-1.5 flex items-center justify-center gap-1.5 transition-all"
                >
                  🔒 Add / Update Confidential Evaluation
                </button>
              </div>
            )}
          </div>

          {/* Confidential Logs Tables */}
          {shouldShowConfidentialData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* T1 Confidential Logs */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">
                  🔒 Teacher 1 — Confidential Logs (Dexie DB)
                </h4>
                {t1?.hasConfidential ? (
                  <div className="overflow-x-auto max-h-56 overflow-y-auto border rounded-lg">
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
                            <td className="p-2 italic max-w-[160px] truncate" title={r.questionText}>
                              {r.questionText}
                            </td>
                            <td className="p-2 text-center">
                              {r.isCritical
                                ? <span className="text-rose-600 font-black text-[10px]">Yes</span>
                                : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="p-2 text-right font-black text-blue-600 font-mono">
                              {r.score}/4
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-slate-400 italic mb-2">
                      Koi confidential record nahi mila.
                    </p>
                    <button
                      onClick={() =>
                        teacher1Obj &&
                        setEvalModalTeacher({
                          id: teacher1Obj.id,
                          name: teacher1Obj.name,
                          department: teacher1Obj.department,
                        })
                      }
                      className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg px-3 py-1.5"
                    >
                      🔒 Add Now
                    </button>
                  </div>
                )}
              </div>

              {/* T2 Confidential Logs */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-3">
                  🔒 Teacher 2 — Confidential Logs (Dexie DB)
                </h4>
                {t2?.hasConfidential ? (
                  <div className="overflow-x-auto max-h-56 overflow-y-auto border rounded-lg">
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
                            <td className="p-2 italic max-w-[160px] truncate" title={r.questionText}>
                              {r.questionText}
                            </td>
                            <td className="p-2 text-center">
                              {r.isCritical
                                ? <span className="text-rose-600 font-black text-[10px]">Yes</span>
                                : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="p-2 text-right font-black text-indigo-600 font-mono">
                              {r.score}/4
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-slate-400 italic mb-2">
                      Koi confidential record nahi mila.
                    </p>
                    <button
                      onClick={() =>
                        teacher2Obj &&
                        setEvalModalTeacher({
                          id: teacher2Obj.id,
                          name: teacher2Obj.name,
                          department: teacher2Obj.department,
                        })
                      }
                      className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg px-3 py-1.5"
                    >
                      🔒 Add Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
              Granular Component Breakdown
            </h3>
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
                      new Set([...t1B.map((b) => b.SubKPI), ...t2B.map((b) => b.SubKPI)])
                    );
                    return allNames.map((name) => {
                      const m1  = t1B.find((b) => b.SubKPI === name);
                      const m2  = t2B.find((b) => b.SubKPI === name);
                      const cat = m1?.Category || m2?.Category || "General";
                      const wt  = m1?.SubKPITotalWeight || m2?.SubKPITotalWeight || 100;
                      return (
                        <tr key={name} className="hover:bg-slate-50/70 font-medium text-slate-700">
                          <td className="p-3 font-bold text-slate-900">{name}</td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold border rounded px-2 py-0.5 bg-slate-50 uppercase tracking-wide text-slate-500">
                              {cat}
                            </span>
                          </td>
                          <td className="p-3 text-center bg-blue-50/10 font-mono text-blue-600 font-bold border-x border-slate-100">
                            {m1 ? `${m1.NormalizedScore}%` : "—"}
                          </td>
                          <td className="p-3 text-center bg-blue-50/10 font-mono font-black text-slate-900 border-r border-slate-100">
                            {m1 ? m1.SubKPIObtainedWeight : "0"}
                          </td>
                          <td className="p-3 text-center bg-indigo-50/10 font-mono text-indigo-600 font-bold border-r border-slate-100">
                            {m2 ? `${m2.NormalizedScore}%` : "—"}
                          </td>
                          <td className="p-3 text-center bg-indigo-50/10 font-mono font-black text-slate-900 border-r border-slate-100">
                            {m2 ? m2.SubKPIObtainedWeight : "0"}
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
          <p>
            Teachers select karke{" "}
            <b className="text-slate-600">"Run Compare Review"</b> click karein.
          </p>
          <p className="text-xs mt-2 text-slate-400">
            Pehle 🔒 "Add Confidential Evaluation" se offline data bhi add kar sakte hain
          </p>
        </div>
      )}
    </div>
  );
};

export default KPIBaseComparison;