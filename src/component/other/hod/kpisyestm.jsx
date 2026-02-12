import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Edit3, Folder, AlertCircle } from 'lucide-react';

const KPISystem = () => {
  const [showSubKpiSection, setShowSubKpiSection] = useState(false);
  const [categories, setCategories] = useState([
    { id: 1, name: 'Teacher-CS', kpis: [] },
    { id: 2, name: 'Teacher-Non CS', kpis: [] }
  ]);

  const [categoryType, setCategoryType] = useState('');
  const [kpiName, setKpiName] = useState('');
  const [kpiWeight, setKpiWeight] = useState('');
  const [subKpiName, setSubKpiName] = useState('');
  const [subKpiWeight, setSubKpiWeight] = useState('');
  const [tempSubKpis, setTempSubKpis] = useState([]);
  
  // States for Accordion
  const [openCategoryId, setOpenCategoryId] = useState(null);
  const [openKpiIndex, setOpenKpiIndex] = useState(null);

  // Error State for Validation
  const [error, setError] = useState('');

  const handleAddSubKpi = () => {
    if (!subKpiName || !subKpiWeight) return;
    const newSubKpi = { name: subKpiName, weight: parseFloat(subKpiWeight) };
    const updatedList = [...tempSubKpis, newSubKpi];
    const totalInputWeight = updatedList.reduce((sum, item) => sum + item.weight, 0);
    const adjustedList = updatedList.map(item => ({
      ...item,
      percent: ((item.weight / totalInputWeight) * 100).toFixed(1)
    }));
    setTempSubKpis(adjustedList);
    setSubKpiName('');
    setSubKpiWeight('');
  };

  const handleSaveKPI = () => {
    // 1. Basic Validation
    if (!categoryType || !kpiName || !kpiWeight || tempSubKpis.length === 0) {
      setError("Please fill all fields and add sub-KPIs.");
      return;
    }

    const currentWeight = parseFloat(kpiWeight);

    // 2. Logic: Check Category Total Weight
    const targetCategory = categories.find(cat => cat.name === categoryType);
    const existingTotal = targetCategory.kpis.reduce((sum, k) => sum + parseFloat(k.weight), 0);

    if (existingTotal + currentWeight > 100) {
      const remaining = 100 - existingTotal;
      setError(`Weight Limit Exceeded! Current total in ${categoryType} is ${existingTotal}%. You can only add up to ${remaining}% more.`);
      return;
    }

    // 3. Save if valid
    const newKpiEntry = { name: kpiName, weight: currentWeight, subKpis: tempSubKpis };
    setCategories(prev => prev.map(cat => 
      cat.name === categoryType ? { ...cat, kpis: [...cat.kpis, newKpiEntry] } : cat
    ));

    // Reset Form
    setError('');
    setCategoryType(''); setKpiName(''); setKpiWeight(''); setTempSubKpis([]); setShowSubKpiSection(false);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-700">
      
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-10 max-w-6xl mx-auto">
        <h2 className="text-lg font-medium mb-6">Create New KPI</h2>
        
        {/* Error Message Box */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2 text-sm font-medium">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <select 
                value={categoryType} 
                onChange={(e) => {setCategoryType(e.target.value); setError('');}} 
                className="w-full p-3 border border-green-200 rounded-lg outline-none bg-white"
            >
              <option value="">Select category type</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <input type="text" placeholder="KPI Name" value={kpiName} onChange={(e) => setKpiName(e.target.value)} className="w-full p-3 border border-green-200 rounded-lg outline-none"/>
            <input type="number" placeholder="KPI Weight (%)" value={kpiWeight} onChange={(e) => {setKpiWeight(e.target.value); setError('');}} className="w-full p-3 border border-green-200 rounded-lg outline-none"/>
          </div>

          {!showSubKpiSection ? (
            <button onClick={() => setShowSubKpiSection(true)} className="w-full bg-[#00AB41] text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition">
              Next: Add Sub-KPIs
            </button>
          ) : (
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-md font-semibold mb-4 text-gray-800">Add Sub-KPIs</h3>
              <div className="space-y-4">
                <input type="text" placeholder="Sub-KPI Name" value={subKpiName} onChange={(e) => setSubKpiName(e.target.value)} className="w-full p-3 border border-green-200 rounded-lg outline-none"/>
                <input type="number" placeholder="Weight (%)" value={subKpiWeight} onChange={(e) => setSubKpiWeight(e.target.value)} className="w-full p-3 border border-green-200 rounded-lg outline-none"/>
                <button onClick={handleAddSubKpi} className="w-full border-2 border-green-500 text-green-600 py-2 rounded-lg font-bold flex items-center justify-center gap-2">
                  <Plus size={18} /> Add Sub-KPI
                </button>
                {tempSubKpis.length > 0 && (
                  <div className="bg-[#F8FFF9] p-4 rounded-lg border border-green-100">
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                      <span>Sub-KPIs Preview</span> <span className="text-green-600">Total: 100%</span>
                    </div>
                    {tempSubKpis.map((sk, i) => (
                      <div key={i} className="flex justify-between bg-white p-2 rounded mb-1 text-sm border border-gray-100">
                        <span>{sk.name}</span> <span className="text-gray-400">{sk.percent}%</span>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={handleSaveKPI} className="w-full bg-[#00AB41] text-white py-3 rounded-lg font-semibold">Save KPI</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- LIST VIEW --- */}
      <div className="max-w-6xl mx-auto space-y-4">
        {categories.map((cat) => {
          const totalWeight = cat.kpis.reduce((s, k) => s + k.weight, 0);
          return (
            <div key={cat.id} className="bg-[#EEFBF3] border border-green-100 rounded-xl overflow-hidden shadow-sm">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => { setOpenCategoryId(openCategoryId === cat.id ? null : cat.id); setOpenKpiIndex(null); }}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#00AB41] p-2 rounded-lg text-white"><Folder size={20} /></div>
                  <div>
                    <h3 className="font-bold text-gray-800">{cat.name}</h3>
                    <p className="text-xs text-gray-500">{cat.kpis.length} KPI • Total Used: {totalWeight}%</p>
                  </div>
                </div>
                {openCategoryId === cat.id ? <ChevronUp className="text-green-600" /> : <ChevronDown className="text-green-600" />}
              </div>

              {openCategoryId === cat.id && (
                <div className="px-4 pb-4 space-y-3">
                  {cat.kpis.map((kpi, kIdx) => (
                    <div key={kIdx} className="bg-white border border-green-50 rounded-xl overflow-hidden">
                      <div 
                        className="flex justify-between items-center p-4 cursor-pointer"
                        onClick={() => setOpenKpiIndex(openKpiIndex === kIdx ? null : kIdx)}
                      >
                        <div>
                          <h4 className="font-bold text-gray-700">{kpi.name}</h4>
                          <p className="text-xs text-gray-400">{kpi.weight}% Weightage</p>
                        </div>
                        {openKpiIndex === kIdx ? <ChevronUp size={18} className="text-green-500" /> : <ChevronDown size={18} className="text-green-500" />}
                      </div>

                      {openKpiIndex === kIdx && (
                        <div className="bg-[#F8FFF9] p-4 border-t border-green-50">
                           {kpi.subKpis.map((sk, skIdx) => (
                             <div key={skIdx} className="flex justify-between items-center bg-white p-3 mb-2 rounded-lg border border-gray-100 shadow-sm">
                                <span className="text-sm font-medium">{sk.name} <span className="text-gray-400 font-normal">— {sk.percent}%</span></span>
                                <div className="flex gap-4"><Edit3 size={16} className="text-green-500"/><Trash2 size={16} className="text-red-400"/></div>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KPISystem;