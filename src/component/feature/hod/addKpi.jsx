import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Edit3, Folder, AlertCircle, Loader2, PlusCircle, X, Check } from 'lucide-react';
import DataService from '../../../services/axios';

const KPISystem = () => {
  // UI States
  const [showSubKpiSection, setShowSubKpiSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [openKpiId, setOpenKpiId] = useState(null);

  // Edit/Dynamic Addition States
  const [editingKpi, setEditingKpi] = useState(null); // { id, name }
  const [editingSubKpi, setEditingSubKpi] = useState(null); // { id, name }
  const [addingSubKpiTo, setAddingSubKpiTo] = useState(null); // kpiId
  const [dynamicSubKpi, setDynamicSubKpi] = useState({ name: '', weight: '' });

  // Data States
  const [sessions, setSessions] = useState([]);
  const [empTypes, setEmpTypes] = useState([]);
  const [kpiList, setKpiList] = useState([]);

  // Form States (New Creation)
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedEmpType, setSelectedEmpType] = useState('');
  const [kpiName, setKpiName] = useState('');
  const [kpiWeight, setKpiWeight] = useState('');
  const [subKpiName, setSubKpiName] = useState('');
  const [subKpiWeight, setSubKpiWeight] = useState('');
  const [tempSubKpis, setTempSubKpis] = useState([]);

  // 1. Initial Load
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [resSessions, resTypes] = await Promise.all([
          DataService.get('/kpi/sessions'),
          DataService.get('/kpi/emptypes')
        ]);
        setSessions(resSessions.data);
        setEmpTypes(resTypes.data);
      } catch (err) { setError("Setup data load nahi ho saka."); }
    };
    fetchDropdowns();
  }, []);

  // 2. Fetch Records
  const fetchExistingKpis = async () => {
    if (!selectedSession || !selectedEmpType) {
      setKpiList([]);
      return;
    }
    try {
      setLoading(true);
      const res = await DataService.get(`/kpi/view-weights/${selectedSession}/${selectedEmpType}`);
      setKpiList(res.data);
    } catch (err) { console.error("List load fail", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExistingKpis(); }, [selectedSession, selectedEmpType]);

  // --- API ACTIONS ---

  const handleDeleteKPI = async (kpiId) => {
    if (!window.confirm("Delete this KPI and all related data? Other weights will adjust to 100%.")) return;
    try {
      setLoading(true);
      await DataService.delete(`/kpi/delete-main-kpi/${selectedSession}/${kpiId}`);
      fetchExistingKpis();
    } catch (err) { alert("Delete failed."); }
    finally { setLoading(false); }
  };

  const handleDeleteSubKpi = async (subId) => {
    if (!window.confirm("Delete this Sub-KPI? Weights within this KPI will re-balance.")) return;
    try {
      setLoading(true);
      await DataService.delete(`/kpi/delete-subkpi/${selectedSession}/${subId}`);
      fetchExistingKpis();
    } catch (err) { alert("Sub-KPI delete failed."); }
    finally { setLoading(false); }
  };

  const handleUpdateKpiName = async () => {
    if (!editingKpi.name) return;
    try {
      setLoading(true);
      await DataService.put(`/kpi/edit-kpi-name/${editingKpi.id}`, `"${editingKpi.name}"`, {
        headers: { 'Content-Type': 'application/json' }
      });
      setEditingKpi(null);
      fetchExistingKpis();
    } catch (err) { alert("Update failed."); }
    finally { setLoading(false); }
  };

  const handleUpdateSubKpiName = async () => {
    if (!editingSubKpi.name) return;
    try {
      setLoading(true);
      await DataService.put(`/kpi/edit-subkpi-name/${editingSubKpi.id}`, `"${editingSubKpi.name}"`, {
        headers: { 'Content-Type': 'application/json' }
      });
      setEditingSubKpi(null);
      fetchExistingKpis();
    } catch (err) { alert("Sub-KPI Update failed."); }
    finally { setLoading(false); }
  };

  const handleSaveDynamicSubKpi = async (kpiId) => {
    if (!dynamicSubKpi.name || !dynamicSubKpi.weight) return;
    const payload = {
      SessionId: parseInt(selectedSession),
      KpiId: kpiId,
      Name: dynamicSubKpi.name,
      NewWeight: parseInt(dynamicSubKpi.weight)
    };

    try {
      setLoading(true);
      await DataService.post("/kpi/add-subkpi-dynamic", payload);
      setAddingSubKpiTo(null);
      setDynamicSubKpi({ name: '', weight: '' });
      fetchExistingKpis();
    } catch (err) { alert(err.response?.data || "Failed to add Sub-KPI"); }
    finally { setLoading(false); }
  };

  const handleSaveKPI = async () => {
    if (!selectedSession || !selectedEmpType || !kpiName || !kpiWeight || tempSubKpis.length === 0) {
      setError("Please fill all fields."); return;
    }
    const payload = {
      SessionId: parseInt(selectedSession),
      EmployeeTypeId: parseInt(selectedEmpType),
      KPIName: kpiName,
      RequestedKPIWeight: parseInt(kpiWeight),
      SubKPIs: tempSubKpis
    };
    try {
      setLoading(true);
      await DataService.post("/kpi/create-with-weight", payload);
      setKpiName(''); setKpiWeight(''); setTempSubKpis([]); setShowSubKpiSection(false);
      fetchExistingKpis();
    } catch (err) { setError(err.response?.data?.Message || "Save failed."); }
    finally { setLoading(false); }
  };

  const selectedTypeName = empTypes.find(t => t.id == selectedEmpType)?.type || "Category";

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-700">
      
      {/* 1. EDIT KPI MODAL */}
      {editingKpi && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit KPI Name</h3>
            <input 
              type="text" 
              value={editingKpi.name} 
              onChange={(e) => setEditingKpi({...editingKpi, name: e.target.value})}
              className="w-full p-3 border-2 border-green-100 rounded-lg focus:border-green-500 outline-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={handleUpdateKpiName} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold">Update</button>
              <button onClick={() => setEditingKpi(null)} className="flex-1 bg-gray-100 py-2 rounded-lg font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT SUB-KPI MODAL */}
      {editingSubKpi && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit Sub-KPI Name</h3>
            <input 
              type="text" 
              value={editingSubKpi.name} 
              onChange={(e) => setEditingSubKpi({...editingSubKpi, name: e.target.value})}
              className="w-full p-3 border-2 border-blue-100 rounded-lg focus:border-blue-500 outline-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={handleUpdateSubKpiName} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold">Update</button>
              <button onClick={() => setEditingSubKpi(null)} className="flex-1 bg-gray-100 py-2 rounded-lg font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* FORM SECTION (KPI Creation) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-10 max-w-6xl mx-auto">
        <h2 className="text-lg font-medium mb-6">Setup Performance KPIs</h2>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm"><AlertCircle size={18}/> {error}</div>}
        
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="w-full p-3 border border-green-200 rounded-lg bg-white outline-none focus:ring-2 ring-green-100">
              <option value="">Select Session</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={selectedEmpType} onChange={(e) => setSelectedEmpType(e.target.value)} className="w-full p-3 border border-green-200 rounded-lg bg-white outline-none focus:ring-2 ring-green-100">
              <option value="">Select Employee Type</option>
              {empTypes.map(t => <option key={t.id} value={t.id}>{t.type}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="KPI Name" value={kpiName} onChange={(e) => setKpiName(e.target.value)} className="w-full p-3 border border-green-200 rounded-lg outline-none focus:border-green-500"/>
            <input type="number" placeholder="Requested Weight (%)" value={kpiWeight} onChange={(e) => setKpiWeight(e.target.value)} className="w-full p-3 border border-green-200 rounded-lg outline-none focus:border-green-500"/>
          </div>

          {!showSubKpiSection ? (
            <button onClick={() => setShowSubKpiSection(true)} className="w-full bg-[#00AB41] hover:bg-[#008a34] text-white py-3 rounded-lg font-semibold shadow-md transition-all">Next: Define Sub-KPIs</button>
          ) : (
            <div className="pt-6 border-t bg-gray-50 p-4 rounded-xl">
              <h3 className="text-sm font-bold mb-4 text-gray-600">ADD INITIAL SUB-KPIS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input type="text" placeholder="Sub-KPI Name" value={subKpiName} onChange={(e) => setSubKpiName(e.target.value)} className="p-3 border rounded-lg bg-white border-green-100 outline-none focus:border-green-500"/>
                  <input type="number" placeholder="Weight/Ratio" value={subKpiWeight} onChange={(e) => setSubKpiWeight(e.target.value)} className="p-3 border rounded-lg bg-white border-green-100 outline-none focus:border-green-500"/>
              </div>
              <button onClick={() => { if(subKpiName && subKpiWeight) { setTempSubKpis([...tempSubKpis, { Name: subKpiName, Weight: parseFloat(subKpiWeight) }]); setSubKpiName(''); setSubKpiWeight(''); } }} className="w-full mb-4 border-2 border-dashed border-green-500 text-green-600 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-50"><Plus size={18} /> Add to List</button>
              {tempSubKpis.map((sk, i) => (
                <div key={i} className="flex justify-between bg-white p-2 rounded mb-1 text-sm border border-green-50 px-4">
                    <span>{sk.Name}</span> 
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-green-600">Ratio: {sk.Weight}</span>
                        <Trash2 size={14} className="text-red-400 cursor-pointer" onClick={() => setTempSubKpis(tempSubKpis.filter((_, idx) => idx !== i))}/>
                    </div>
                </div>
              ))}
              <button disabled={loading} onClick={handleSaveKPI} className="w-full mt-4 bg-[#00AB41] text-white py-3 rounded-lg font-semibold flex justify-center items-center gap-2 shadow-lg disabled:bg-gray-400">
                {loading ? <Loader2 className="animate-spin" /> : <Check size={20}/>} Save Complete KPI
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DISPLAY SECTION */}
      <div className="max-w-6xl mx-auto space-y-4 pb-20">
        {selectedEmpType && (
          <div className="bg-[#EEFBF3] border border-green-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-5 cursor-pointer bg-green-600 text-white" onClick={() => setIsCategoryOpen(!isCategoryOpen)}>
              <div className="flex items-center gap-4"><Folder size={24} /><h3 className="font-bold text-xl uppercase tracking-wider">{selectedTypeName}</h3></div>
              {isCategoryOpen ? <ChevronUp /> : <ChevronDown />}
            </div>

            {isCategoryOpen && (
              <div className="p-4 space-y-4">
                {loading && kpiList.length === 0 ? (
                    <div className="flex justify-center p-10"><Loader2 className="animate-spin text-green-600" size={40} /></div>
                ) : kpiList.length === 0 ? (
                    <p className="text-center py-10 text-gray-400 font-medium">No KPIs created for this category yet.</p>
                ) : (
                  kpiList.map((kpi) => (
                    <div key={kpi.kpiId} className="bg-white border border-green-100 rounded-xl overflow-hidden shadow-sm">
                      <div className="flex justify-between items-center p-4 hover:bg-green-50 transition-colors">
                        <div className="flex-1 cursor-pointer" onClick={() => setOpenKpiId(openKpiId === kpi.kpiId ? null : kpi.kpiId)}>
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-800 text-lg">{kpi.kpiName}</span>
                                <span className="text-xs font-bold text-green-600 uppercase tracking-tighter">Current Weight: {kpi.totalKpiWeight}%</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 mr-4">
                            <PlusCircle 
                              size={22} 
                              className={`cursor-pointer transition ${addingSubKpiTo === kpi.kpiId ? 'text-orange-500' : 'text-green-500 hover:scale-110'}`} 
                              title="Add Sub-KPI" 
                              onClick={() => setAddingSubKpiTo(addingSubKpiTo === kpi.kpiId ? null : kpi.kpiId)}
                            />
                            <Edit3 size={18} className="text-blue-400 cursor-pointer hover:text-blue-600" onClick={() => setEditingKpi({id: kpi.kpiId, name: kpi.kpiName})}/>
                            <Trash2 size={18} className="text-red-300 cursor-pointer hover:text-red-500" onClick={() => handleDeleteKPI(kpi.kpiId)}/>
                        </div>
                        {openKpiId === kpi.kpiId ? <ChevronUp className="text-green-500" /> : <ChevronDown className="text-green-500" />}
                      </div>

                      {/* DYNAMIC ADD SUB-KPI INLINE FORM */}
                      {addingSubKpiTo === kpi.kpiId && (
                        <div className="bg-orange-50 p-4 border-y border-orange-100 flex flex-col md:flex-row gap-3 items-center">
                          <input 
                            type="text" 
                            placeholder="New Sub-KPI Name" 
                            value={dynamicSubKpi.name}
                            onChange={(e) => setDynamicSubKpi({...dynamicSubKpi, name: e.target.value})}
                            className="flex-1 p-2 border border-orange-200 rounded-lg outline-none focus:border-orange-500 text-sm"
                          />
                          <input 
                            type="number" 
                            placeholder="Weight" 
                            value={dynamicSubKpi.weight}
                            onChange={(e) => setDynamicSubKpi({...dynamicSubKpi, weight: e.target.value})}
                            className="w-24 p-2 border border-orange-200 rounded-lg outline-none focus:border-orange-500 text-sm"
                          />
                          <button onClick={() => handleSaveDynamicSubKpi(kpi.kpiId)} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-orange-600">
                            <Check size={16}/> Save
                          </button>
                          <button onClick={() => setAddingSubKpiTo(null)} className="text-gray-400 hover:text-gray-600 px-2">
                            <X size={20}/>
                          </button>
                        </div>
                      )}

                      {openKpiId === kpi.kpiId && (
                        <div className="bg-[#F8FFF9] p-4 border-t border-green-50 space-y-2">
                          {kpi.subKpis.map((sk) => (
                            <div key={sk.subKpiId} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:border-green-300">
                              <span className="text-sm font-semibold text-gray-700">{sk.subKpiName}</span>
                              <div className="flex items-center gap-4">
                                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">{sk.weight}%</span>
                                <Edit3 
                                  size={14} 
                                  className="text-gray-300 hover:text-blue-500 cursor-pointer" 
                                  onClick={() => setEditingSubKpi({id: sk.subKpiId, name: sk.subKpiName})}
                                />
                                <Trash2 
                                  size={14} 
                                  className="text-gray-300 hover:text-red-500 cursor-pointer" 
                                  onClick={() => handleDeleteSubKpi(sk.subKpiId)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KPISystem;