import React, { useState, useEffect } from "react";
import { Trash2, Plus, ChevronDown, ChevronUp, PlusCircle } from "lucide-react";
import DataService from "../../../services/axios";

const AddKPI1 = () => {
  const [kpis, setKpis] = useState([]);
  const [subKpis, setSubKpis] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newKpiName, setNewKpiName] = useState("");
  const [employeeTypeID, setEmployeeTypeID] = useState("");
  const [weight, setWeight] = useState("");
  const [newSubKpiName, setNewSubKpiName] = useState("");
  const [expandedKpi, setExpandedKpi] = useState(null);
  const [activeKpiIdForSub, setActiveKpiIdForSub] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpiRes, subRes, empTypeRes] = await Promise.all([
        DataService.get('kpi/list'),
        DataService.get('subkpi/list'),
        DataService.get('employeetype/list'),
      ]);
      setKpis(kpiRes.data);
      setSubKpis(subRes.data);
      setEmployeeTypes(empTypeRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddKPI = async () => {
    if (!newKpiName || !employeeTypeID || !weight) return alert("Please fill all fields");
    await DataService.post('kpi/create', { name: newKpiName, EmployeeTypeID: employeeTypeID, weight });
    setNewKpiName(""); setEmployeeTypeID(""); setWeight("");
    fetchData();
  };

  const handleAddSubKpi = async (kpiId) => {
    if (!newSubKpiName) return;
    await DataService.post('subkpi/create', { KPIID: kpiId, name: newSubKpiName });
    setNewSubKpiName(""); setActiveKpiIdForSub(null);
    fetchData();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">KPI Management</h1>
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">Total: {kpis.length}</span>
      </div>

      {/* Input Form */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className="border-2 border-gray-100 p-3 rounded-lg focus:border-green-500 outline-none transition-all" 
            placeholder="KPI Name" value={newKpiName} onChange={e => setNewKpiName(e.target.value)} />
          
          <select className="border-2 border-gray-100 p-3 rounded-lg focus:border-green-500 outline-none bg-white" 
            value={employeeTypeID} onChange={e => setEmployeeTypeID(e.target.value)}>
            <option value="">Select Employee Type</option>
            {employeeTypes.map(et => <option key={et.id} value={et.id}>{et.type}</option>)}
          </select>

          <input type="number" className="border-2 border-gray-100 p-3 rounded-lg focus:border-green-500 outline-none" 
            placeholder="Weight (%)" value={weight} onChange={e => setWeight(e.target.value)} />
        </div>
        <button onClick={handleAddKPI} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
          <PlusCircle size={20} /> Create New KPI
        </button>
      </div>

      {/* KPI List */}
      <div className="space-y-3">
        {loading ? <p className="text-center py-10 text-gray-500">Loading KPIs...</p> : 
          kpis.map(kpi => {
            const children = subKpis.filter(s => s.KPIID === kpi.id);
            const isOpen = expandedKpi === kpi.id;
            return (
              <div key={kpi.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <div className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${isOpen ? 'bg-green-50' : 'hover:bg-gray-50'}`} 
                  onClick={() => setExpandedKpi(isOpen ? null : kpi.id)}>
                  <div>
                    <h3 className="font-bold text-gray-800">{kpi.name} <span className="text-green-600 ml-2">({kpi.weight}%)</span></h3>
                    <p className="text-xs text-gray-500 font-medium">{children.length} Metrics Defined</p>
                  </div>
                  {isOpen ? <ChevronUp className="text-green-600" /> : <ChevronDown className="text-gray-400" />}
                </div>

                {isOpen && (
                  <div className="p-4 bg-white border-t border-gray-50 space-y-3">
                    {children.map(sub => (
                      <div key={sub.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg group">
                        <span className="text-gray-700 font-medium">{sub.name}</span>
                        <button onClick={() => DataService.delete(`subkpi/delete/${sub.id}`).then(fetchData)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <input className="flex-1 border-2 border-gray-100 p-2 rounded-lg text-sm focus:border-green-500 outline-none" 
                        placeholder="Add sub-indicator..." value={activeKpiIdForSub === kpi.id ? newSubKpiName : ""}
                        onChange={e => { setActiveKpiIdForSub(kpi.id); setNewSubKpiName(e.target.value); }} />
                      <button onClick={() => handleAddSubKpi(kpi.id)} className="bg-green-600 text-white px-4 rounded-lg hover:bg-green-700"><Plus size={18} /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        }
      </div>
    </div>
  );
};

export default AddKPI1;