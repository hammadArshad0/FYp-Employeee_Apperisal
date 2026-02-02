import React, { useState, useEffect } from "react";
import { Trash2, Plus, ChevronDown, ChevronUp, PlusCircle } from "lucide-react";
import DataService from "../../../services/axios";

const AddKPI = () => {
  const [kpis, setKpis] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sessionId, setSessionId] = useState("");
  const [newKpiName, setNewKpiName] = useState("");
  const [employeeTypeID, setEmployeeTypeID] = useState("");
  const [weight, setWeight] = useState("");
  const [subKPIs, setSubKPIs] = useState([{ Name: "", Weight: "" }]);
  const [expandedKpi, setExpandedKpi] = useState(null);

  // ---------------- Fetch sessions & employee types ----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sessionRes, empTypeRes] = await Promise.all([
          DataService.get("session/list"),
          DataService.get("employeetype/list"),
        ]);
        setSessions(sessionRes.data);
        setEmployeeTypes(empTypeRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ---------------- Fetch KPIs per session ----------------
  useEffect(() => {
    if (!sessionId) return setKpis([]);
    const fetchKpis = async () => {
      try {
        setLoading(true);
        const res = await DataService.get(`kpi/viewkpisubkpiweight/${sessionId}`);
        const normalized = res.data.map(k => ({
          id: k.id,
          name: k.name,
          KPIWeight: k.KPIWeight ?? 0,
          SubKPIs: (k.SubKPIs || []).map(sub => ({
            id: sub.id,
            name: sub.name,
            Weight: sub.SubWeight ?? 0
          }))
        }));
        setKpis(normalized);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchKpis();
  }, [sessionId]);

  // ---------------- Add KPI + SubKPIs ----------------
  const handleAddKPI = async () => {
    if (!newKpiName || !employeeTypeID || !weight) return alert("All fields are required!");
    if (subKPIs.some(s => !s.Name || !s.Weight)) return alert("All SubKPI fields are required!");

    try {
      await DataService.post("kpi/create-with-weight", {
        SessionId: parseInt(sessionId),
        KPIName: newKpiName,
        RequestedKPIWeight: parseInt(weight),
        EmployeeTypeID: parseInt(employeeTypeID),
        SubKPIs: subKPIs.map(s => ({ Name: s.Name, Weight: parseInt(s.Weight) }))
      });

      // reset form
      setNewKpiName(""); 
      setEmployeeTypeID(""); 
      setWeight(""); 
      setSubKPIs([{ Name: "", Weight: "" }]);
      
      // refresh KPI list
      const res = await DataService.get(`kpi/viewkpisubkpiweight/${sessionId}`);
      const normalized = res.data.map(k => ({
        id: k.id,
        name: k.name,
        KPIWeight: k.KPIWeight ?? 0,
        SubKPIs: (k.SubKPIs || []).map(sub => ({
          id: sub.id,
          name: sub.name,
          Weight: sub.SubWeight ?? 0
        }))
      }));
      setKpis(normalized);
    } catch (err) {
      console.error(err);
      alert("Failed to add KPI. Check console.");
    }
  };

  // ---------------- SubKPI handlers ----------------
  const handleSubKPIChange = (index, field, value) => {
    const copy = [...subKPIs];
    copy[index][field] = value;
    setSubKPIs(copy);
  };
  const addSubKPIField = () => setSubKPIs([...subKPIs, { Name: "", Weight: "" }]);
  const removeSubKPIField = (index) => setSubKPIs(subKPIs.filter((_, i) => i !== index));

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 space-y-8">

        {/* Session Selector */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
          <label className="font-bold">Select Session:</label>
          <select
            className="border p-2 rounded"
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
          >
            <option value="">-- Select Session --</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Create KPI Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 bg-green-600">
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <PlusCircle size={20} /> Create New KPI
            </h2>
          </div>
          <div className="p-6 space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label>KPI Name</label>
                <input
                  className="w-full border p-3 rounded"
                  placeholder="e.g. Research Work"
                  value={newKpiName}
                  onChange={e => setNewKpiName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label>Employee type</label>
                <select
                  className="w-full border p-3 rounded"
                  value={employeeTypeID}
                  onChange={e => setEmployeeTypeID(e.target.value)}
                >
                  <option value="">Choose Type</option>
                  {employeeTypes.map(et => <option key={et.id} value={et.id}>{et.type}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label>Weightage (%)</label>
                <input
                  type="number"
                  className="w-full border p-3 rounded"
                  placeholder="0-100"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                />
              </div>
            </div>

            {/* SubKPIs */}
            <div className="space-y-2">
              <label>SubKPIs</label>
              {subKPIs.map((s, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    placeholder="SubKPI Name"
                    className="border p-2 flex-1 rounded"
                    value={s.Name}
                    onChange={e => handleSubKPIChange(idx, "Name", e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Weight"
                    className="border p-2 w-24 rounded"
                    value={s.Weight}
                    onChange={e => handleSubKPIChange(idx, "Weight", e.target.value)}
                  />
                  <button type="button" onClick={() => removeSubKPIField(idx)} className="text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addSubKPIField} className="flex items-center gap-1 text-green-600 mt-2 font-bold">
                <Plus size={16} /> Add SubKPI
              </button>
            </div>
          </div>
          <div className="p-6 bg-gray-50 border-t flex justify-end">
            <button
              onClick={handleAddKPI}
              className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700"
            >
              Save KPI
            </button>
          </div>
        </div>

        {/* List KPIs */}
        <div className="space-y-4">
          <h3 className="text-xl font-black text-gray-800 px-2">Existing KPIs</h3>
          {loading ? <p>Loading...</p> : kpis.map(kpi => (
            <div key={kpi.id} className="bg-white rounded-2xl border shadow-sm">
              <div className="p-5 flex justify-between cursor-pointer" onClick={() => setExpandedKpi(expandedKpi === kpi.id ? null : kpi.id)}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded flex items-center justify-center text-green-700 font-bold">
                    {kpi.KPIWeight}%
                  </div>
                  <div>
                    <h4>{kpi.name}</h4>
                    <p>Total Sub-KPIs: {kpi.SubKPIs.length}</p>
                  </div>
                </div>
                <button>{expandedKpi === kpi.id ? <ChevronUp /> : <ChevronDown />}</button>
              </div>

              {expandedKpi === kpi.id && (
                <div className="p-5 border-t space-y-2">
                  {kpi.SubKPIs.map(sub => (
                    <div key={sub.id} className="flex justify-between bg-gray-50 p-2 rounded border">
                      <span>{sub.Name || sub.name}</span>
                      <span className="font-bold text-green-600">{sub.Weight}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddKPI;
