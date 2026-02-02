import React, { useState, useEffect } from "react";
import { Trash2, Plus, ChevronDown, ChevronUp, PlusCircle } from "lucide-react";
import DataService from "../../../services/axios";

const KPIAndPeerScreen = () => {
  const [kpis, setKpis] = useState([]);
  const [subKpis, setSubKpis] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [peerEvaluators, setPeerEvaluators] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newKpiName, setNewKpiName] = useState("");
  const [employeeTypeID, setEmployeeTypeID] = useState("");
  const [weight, setWeight] = useState("");

  const [newSubKpiName, setNewSubKpiName] = useState("");
  const [expandedKpi, setExpandedKpi] = useState(null);
  const [activeKpiIdForSub, setActiveKpiIdForSub] = useState(null);

  const [selectedSession, setSelectedSession] = useState("");
  const [evaluatorId, setEvaluatorId] = useState("");
  const [evaluateeId, setEvaluateeId] = useState("");


  const fetchAll = async () => {
    setLoading(true);
    try {
      const [kpiRes, subRes, sessionRes, teacherRes, empTypeRes, peerRes] = await Promise.all([
        DataService.get('kpi/list'),
        DataService.get('subkpi/list'),
        DataService.get('session/list'),
        DataService.get('teacher/Teacherlist'),
        DataService.get('employeetype/list'),
        DataService.get('peerevaluator/list')
      ]);

      setKpis(kpiRes.data);
      setSubKpis(subRes.data);
      setSessions(sessionRes.data);
      setTeachers(teacherRes.data);
      setEmployeeTypes(empTypeRes.data);
      setPeerEvaluators(peerRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const addKPI = async () => {
    if (!newKpiName || !employeeTypeID || !weight) return alert("Fill all fields");
    await DataService.post('kpi/create', {
      name: newKpiName,
      EmployeeTypeID: employeeTypeID,
      weight
    });
    setNewKpiName(""); setEmployeeTypeID(""); setWeight("");
    fetchAll();
  };

  const addSubKpi = async (kpiId) => {
    if (!newSubKpiName) return;
    await DataService.post('subkpi/create', { KPIID: kpiId, name: newSubKpiName });
    setNewSubKpiName(""); setActiveKpiIdForSub(null);
    fetchAll();
  };

  const deleteKpi = async (id) => {
    
    if (!window.confirm("Delete KPI and all sub-KPIs?")) return;
    await DataService.delete(`kpi/delete/${id}`);
    fetchAll();
  };

  const deleteSubKpi = async (id) => {
    await DataService.delete(`subkpi/delete/${id}`);
    fetchAll();
  };

  const addPeerEvaluator = async () => {
    if (!selectedSession || !evaluatorId) return alert("Select session & both teachers");
    // if (evaluatorId === evaluateeId) return alert("Evaluator and Evaluatee cannot be same");

    await DataService.post('peerevaluator/create', {
      sessionID: selectedSession,
      teacherID: evaluatorId,
    
    });

    setEvaluatorId(""); setSelectedSession("");
    fetchAll();
  };

  const deletePeerEvaluator = async (id) => {
    if (!window.confirm("Delete this peer evaluator?")) return;
    await DataService.delete(`peerevaluator/delete/${id}`);
    fetchAll();
  };

  const getTeacherName = (id) => teachers.find(t => t.UserID === id)?.Name || id;
  const getSessionName = (id) => sessions.find(s => s.id === id)?.name || id;


  return (
    <div className="flex min-h-screen bg-gray-100 p-6 justify-center">
      <div className="w-full max-w-4xl space-y-10">
<h1 className="text-2xl font-bold">Hod dashboard</h1>
      
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-2xl font-bold">KPI Management</h2>
          <div className="space-y-3">
            <input className="w-full border p-2 rounded" placeholder="KPI Name" value={newKpiName} onChange={e => setNewKpiName(e.target.value)} />
            <select className="w-full border p-2 rounded" value={employeeTypeID} onChange={e => setEmployeeTypeID(e.target.value)}>
              <option value="">Select Employee Type</option>
              {employeeTypes.map(et => <option key={et.id} value={et.id}>{et.type}</option>)}
            </select>
            <input type="number" className="w-full border p-2 rounded" placeholder="Weight (%)" value={weight} onChange={e => setWeight(e.target.value)} />
            <button onClick={addKPI} className="w-full bg-green-600 text-white py-2 rounded flex justify-center gap-2">
              <PlusCircle size={18} /> Add KPI
            </button>
          </div>

          {loading ? "Loading..." : kpis.map(kpi => {
            const children = subKpis.filter(s => s.KPIID === kpi.id);
            const open = expandedKpi === kpi.id;

            return (
              <div key={kpi.id} className="bg-gray-50 rounded-lg mb-3">
                <div className="p-3 flex justify-between cursor-pointer" onClick={() => setExpandedKpi(open ? null : kpi.id)}>
                  <div>
                    <p className="font-semibold">{kpi.name}</p>
                    <p className="text-xs text-gray-500">{children.length} Sub-KPIs</p>
                  </div>
                  {open ? <ChevronUp /> : <ChevronDown />}
                </div>

                {open && (
                  <div className="p-3 space-y-2">
                    {children.map(sub => (
                      <div key={sub.id} className="flex justify-between border p-2 rounded">
                        {sub.name}
                        <Trash2 size={14} className="text-red-500 cursor-pointer" onClick={() => deleteSubKpi(sub.id)} />
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input className="flex-1 border p-2 rounded" placeholder="New Sub KPI"
                        value={activeKpiIdForSub === kpi.id ? newSubKpiName : ""}
                        onChange={e => { setActiveKpiIdForSub(kpi.id); setNewSubKpiName(e.target.value); }} />
                      <button className="bg-green-600 text-white px-3 rounded" onClick={() => addSubKpi(kpi.id)}><Plus size={16} /></button>
                    </div>
                  </div>
                )}
                <div className="p-2 text-right">
                  <Trash2 size={16} className="text-red-500 cursor-pointer" onClick={() => deleteKpi(kpi.id)} />
                </div>
              </div>
            );
          })}
        </div>

      <h1 className="text-2xl font-bold">Hod dashboard</h1>
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-2xl font-bold">Peer Evaluator </h2>

          <div className="space-y-3">
            <select className="w-full border p-2 rounded" value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
              <option value="">Select Session</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="w-full border p-2 rounded" value={evaluatorId} onChange={e => setEvaluatorId(e.target.value)}>
              <option value="">Evaluator</option>
              {teachers.map(t => <option key={t.UserID} value={t.UserID}>{t.Name}</option>)}
            </select>
          
            <button onClick={addPeerEvaluator} className="w-full bg-green-600 text-white py-2 rounded flex justify-center gap-2">
              <Plus size={16} /> Add Peer Evaluator
            </button>
          </div>

          {peerEvaluators.length === 0 ? (
            <p className="text-gray-400">No peer evaluators added yet.</p>
          ) : (
            peerEvaluators.map(p => (
              <div key={p.id} className="flex justify-between items-center p-3 border rounded mb-2">
                <div>
                  <p className="text-sm">Session: <b>{getSessionName(p.sessionID)}</b></p>
                  <p className="text-sm">{getTeacherName(p.teacherID)} → {getTeacherName(p.evaluateeID)}</p>
                </div>
                <Trash2 size={16} className="text-red-500 cursor-pointer" onClick={() => deletePeerEvaluator(p.id)} />
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default KPIAndPeerScreen;
