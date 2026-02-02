import React, { useState, useEffect } from "react";
import { Trash2, Plus, UserCheck } from "lucide-react";
import DataService from "../../../services/axios";

const AddPeerEvaluator = () => {
  const [sessions, setSessions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [peerEvaluators, setPeerEvaluators] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [evaluatorId, setEvaluatorId] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessRes, teachRes, peerRes] = await Promise.all([
        DataService.get('session/list'),
        DataService.get('teacher/Teacherlist'),
        DataService.get('peerevaluator/list')
      ]);
      setSessions(sessRes.data);
      setTeachers(teachRes.data);
      setPeerEvaluators(peerRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddPeer = async () => {
    if (!selectedSession || !evaluatorId) return alert("Select session and teacher");
    await DataService.post('peerevaluator/create', { sessionID: selectedSession, teacherID: evaluatorId });
    setEvaluatorId(""); setSelectedSession("");
    fetchData();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <UserCheck className="text-green-600" size={28} />
        <h1 className="text-2xl font-bold text-gray-800">Peer Evaluator Assignment</h1>
      </div>

      {/* Assignment Form */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase">Active Session</label>
          <select className="w-full border-2 border-gray-100 p-3 rounded-lg outline-none focus:border-green-500" 
            value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
            <option value="">Select Session</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase">Select Evaluator</label>
          <select className="w-full border-2 border-gray-100 p-3 rounded-lg outline-none focus:border-green-500" 
            value={evaluatorId} onChange={e => setEvaluatorId(e.target.value)}>
            <option value="">Choose Teacher</option>
            {teachers.map(t => <option key={t.UserID} value={t.UserID}>{t.Name}</option>)}
          </select>
        </div>

        <button onClick={handleAddPeer} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95">
          <Plus size={20} /> Assign Evaluator
        </button>
      </div>

      {/* Evaluators Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Session</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Teacher Name</th>
              <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {peerEvaluators.map(p => (
              <tr key={p.id} className="hover:bg-green-50/30 transition-colors">
                <td className="p-4 font-semibold text-gray-700">{sessions.find(s => s.id === p.sessionID)?.name || p.sessionID}</td>
                <td className="p-4 text-gray-600 font-medium">{teachers.find(t => t.UserID === p.teacherID)?.Name || p.teacherID}</td>
                <td className="p-4 text-right">
                  <button onClick={() => window.confirm("Delete?") && DataService.delete(`peerevaluator/delete/${p.id}`).then(fetchData)} 
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {peerEvaluators.length === 0 && (
              <tr><td colSpan="3" className="p-10 text-center text-gray-400">No evaluators assigned for this session.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AddPeerEvaluator;