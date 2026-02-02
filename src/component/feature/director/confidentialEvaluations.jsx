import React, { useState } from 'react';
import { 
  Lock, Search, FileText, Eye, 
  ShieldCheck, Download, Filter, AlertTriangle 
} from 'lucide-react';

const ConfidentialEvaluations = () => {
  // Dummy Data
  const [reports] = useState([
    { id: 1, teacher: "Dr. Ahmed Ali", dept: "Computer Science", rating: "4.8/5", status: "Critical Review", date: "Jan 20, 2026" },
    { id: 2, teacher: "Ms. Sara Khan", dept: "Software Engineering", rating: "3.2/5", status: "Under Observation", date: "Jan 18, 2026" },
    { id: 3, teacher: "Dr. Munir Ahmed", dept: "Mathematics", rating: "4.5/5", status: "Excellent", date: "Jan 15, 2026" },
    { id: 4, teacher: "Prof. Junaid", dept: "Physics", rating: "2.9/5", status: "Action Required", date: "Jan 12, 2026" },
  ]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header Section - Pure Green Theme */}
      <div className="bg-green-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-green-200 mb-2">
              <Lock size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Confidential Access</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight">Confidential Evaluations</h2>
            <p className="text-green-50 font-medium mt-1">Direct access to faculty peer reviews and sensitive performance data.</p>
          </div>
          <button className="bg-white text-green-700 hover:bg-green-50 px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-md">
            <Download size={18} /> Export Reports email
          </button>
        </div>
        <ShieldCheck size={140} className="absolute right-[-20px] bottom-[-30px] text-white opacity-10" />
      </div>

      {/* Filters Area - White Theme */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by faculty name..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-green-600 outline-none font-medium transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select className="px-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm font-bold text-gray-600 outline-none focus:border-green-600">
            <option>All Departments</option>
            <option>CS</option>
            <option>Ai</option>
               <option>Se</option>
          </select>
          <button className="bg-white border border-gray-200 p-4 rounded-2xl text-green-600 hover:bg-green-50 transition-all shadow-sm">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Table Container - White with Green Accents */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Faculty Performance Records</h3>
          <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">Secure Table</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-50">
                <th className="px-8 py-5">Teacher Name</th>
                <th className="px-8 py-5">Department</th>
                <th className="px-8 py-5">Rating</th>
                <th className="px-8 py-5">Security Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-green-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md shadow-green-100">
                        {report.teacher.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-black text-gray-800 text-sm leading-none mb-1">{report.teacher}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{report.date}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-bold text-gray-600 text-sm">{report.dept}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${parseFloat(report.rating) > 4 ? 'bg-green-500' : 'bg-orange-400'}`} 
                          style={{ width: `${(parseFloat(report.rating)/5)*100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-black text-gray-800">{report.rating}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase ${
                      report.status === 'Excellent' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-green-600 hover:bg-green-100 rounded-xl transition-all">
                      <Eye size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      <div className="flex items-start gap-4 p-6 bg-green-50 rounded-2xl border-l-4 border-green-600">
        <AlertTriangle className="text-green-600 mt-1" size={20} />
        <div>
          <p className="text-green-800 font-black text-sm uppercase tracking-tight">Access Logged</p>
          <p className="text-green-700 text-xs font-medium mt-1">
            <b>Note:</b> Your access to this data is being monitored. Please ensure compliance with the University Privacy Policy.
          </p>
        </div>
      </div>

    </div>
  );
};

export default ConfidentialEvaluations;