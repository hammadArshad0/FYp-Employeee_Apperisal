import React, { useState, useEffect } from 'react';
import { Mail, Trash2, Plus, CheckCircle, ArrowLeft, Edit2, Save, X } from 'lucide-react';
import DataService from '../../../services/axios';

const EmailSettings = () => {
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [editingId, setEditingId] = useState(null); // Track karney ke liye ke kaunsa record edit ho raha hai
  const [editValue, setEditValue] = useState(""); // Edit hotay waqt temporary value

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const res = await DataService.get('/email/getall');
      setEmails(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAddEmail = async () => {
    if (!newEmail) return alert("Enter email");
    try {
      await DataService.post('/email/add', { mail: newEmail });
      setNewEmail("");
      fetchEmails();
    } catch (err) { alert("Error adding email"); }
  };

  // Edit mode on karne ke liye
  const startEdit = (email) => {
    setEditingId(email.id);
    setEditValue(email.mail);
  };

  // Update API call
  const handleUpdate = async (id) => {
    if (!editValue) return alert("Email cannot be empty");
    try {
      await DataService.put(`/email/edit/${id}`, { mail: editValue });
      setEditingId(null);
      fetchEmails();
    } catch (err) { alert("Error updating email"); }
  };

  const handleActivate = async (id) => {
    try {
      await DataService.put(`/email/activate/${id}`);
      fetchEmails();
    } catch (err) { alert("Error activating email"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this email?")) return;
    try {
      await DataService.delete(`/email/delete/${id}`);
      fetchEmails();
    } catch (err) { alert("Error deleting email"); }
  };

  const activeEmail = emails.find(e => e.isActive);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-slate-50 min-h-screen">
      {/* Header aur Banner wahi rahay ga */}
      <div className="flex items-center gap-4 mb-6">
        <button className="p-2 bg-white rounded-lg border shadow-sm"><ArrowLeft size={20}/></button>
        <div>
          <h2 className="text-xl font-bold">Email Settings</h2>
          <p className="text-xs text-gray-500">Confidential Evaluations</p>
        </div>
      </div>

      {/* <div className="bg-green-700 text-white p-3 rounded-xl mb-8 text-center font-bold">
        Current Session: Fall 2025
      </div> */}

      {/* Active Recipient Box Display */}
      {activeEmail && (
        <div className="bg-white border-2 border-green-500 rounded-3xl p-6 mb-8 flex items-start gap-4 shadow-sm">
          <div className="bg-green-600 p-2 rounded-xl text-white"><CheckCircle size={24} /></div>
          <div>
            <div className="flex items-center gap-2 text-gray-800 font-bold uppercase text-xs">🔐 Current Active Recipient</div>
            <p className="text-green-700 font-bold my-1">{activeEmail.mail}</p>
          </div>
        </div>
      )}

      {/* Add New Section */}
      <div className="bg-white border rounded-3xl p-8 mb-10 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-gray-700 mb-6"><Plus size={20} /> Add New Recipient</div>
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="example@university.edu"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full bg-gray-100 border-none rounded-xl p-4 outline-none focus:ring-2 focus:ring-green-600"
          />
          <button onClick={handleAddEmail} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700">
            <Mail size={18} /> Add Email
          </button>
        </div>
      </div>

      {/* List Section with Edit Logic */}
      <div className="space-y-4">
        <div className="font-bold text-gray-600 text-sm mb-4">📩 Saved Recipient Emails ({emails.length})</div>
        
        {emails.map((email) => (
          <div key={email.id} className={`bg-white border rounded-2xl p-5 flex items-center justify-between ${email.isActive ? 'ring-2 ring-green-500' : ''}`}>
            <div className="flex items-center gap-4 flex-1">
              <input type="radio" checked={email.isActive} onChange={() => handleActivate(email.id)} className="w-5 h-5 accent-green-600 cursor-pointer" />
              
              {/* Conditional Rendering: Agar edit ho raha hai to input dikhao, warna text */}
              {editingId === email.id ? (
                <input 
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="border-b-2 border-green-600 outline-none font-bold text-gray-700 text-sm w-full bg-transparent"
                  autoFocus
                />
              ) : (
                <div>
                  <p className="font-bold text-gray-700 text-sm">{email.mail}</p>
                  {email.isActive && <span className="bg-green-600 text-white text-[10px] px-3 py-1 rounded-full font-bold">Active</span>}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {editingId === email.id ? (
                <>
                  <button onClick={() => handleUpdate(email.id)} className="text-green-600 p-2"><Save size={18}/></button>
                  <button onClick={() => setEditingId(null)} className="text-gray-400 p-2"><X size={18}/></button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(email)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg"><Edit2 size={18}/></button>
                  <button onClick={() => handleDelete(email.id)} className="text-red-400 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailSettings;