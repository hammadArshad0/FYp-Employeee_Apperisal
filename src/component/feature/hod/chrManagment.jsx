import React, { useState } from 'react';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';

const CHRManagement = () => {
  // Initial state with default values
  const [settings, setSettings] = useState([
    { id: 1, label: 'Class Held', description: 'Points awarded when a class is conducted as scheduled', value: 1 },
    { id: 2, label: 'Class Not Held', description: 'Points deducted when a scheduled class is not conducted', value: -1 },
    { id: 3, label: 'Late In', description: 'Points deducted when teacher arrives late to class', value: -1 },
    { id: 4, label: 'Left Early', description: 'Points deducted when teacher leaves class before scheduled time', value: -1 },
    { id: 5, label: 'Held On Time', description: 'Bonus points for conducting class on time without delays', value: 1 },
  ]);

  // Input change handle karne ka function
  const handleInputChange = (id, newValue) => {
    const numericValue = parseInt(newValue) || 0; // String ko number mein convert karna
    setSettings(prevSettings =>
      prevSettings.map(item =>
        item.id === id ? { ...item, value: numericValue } : item
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <h2 className="text-2xl font-black text-gray-800 mb-6 italic">CHR Point System Config</h2>

        {settings.map((item) => {
          // Dynamic check: Agar value 0 se kam hai toh Negative, warna Positive
          const isPositive = item.value >= 0;

          return (
            <div 
              key={item.id} 
              className={`bg-white rounded-2xl border-2 p-6 shadow-sm transition-all duration-300 ${
                isPositive ? 'border-green-100' : 'border-red-100'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-700">{item.label}</h3>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {isPositive ? 'Positive' : 'Negative'}
                </span>
              </div>

              <p className="text-xs text-gray-400 mb-4 italic">{item.description}</p>

              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Adjust Point Value</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={item.value}
                    onChange={(e) => handleInputChange(item.id, e.target.value)}
                    className={`w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 font-black transition-all ${
                      isPositive ? 'ring-green-500 text-green-700' : 'ring-red-500 text-red-700'
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">points</span>
                </div>
              </div>

              {/* Dynamic Bottom Badge */}
              <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-[11px] font-bold transition-colors ${
                isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {isPositive ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
                {item.value > 0 ? `+${item.value}` : item.value} points per occurrence
              </div>
            </div>
          );
        })}

        <button 
          onClick={() => alert('Settings temporary saved in state!')}
          className="w-full bg-green-700 hover:bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98]"
        >
          <Save size={18} />
          Save CHR Points Settings
        </button>
      </div>
    </div>
  );
};

export default CHRManagement;