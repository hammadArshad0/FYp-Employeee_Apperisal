import React, { useState, useEffect } from 'react';
import { Mail, Trash2, Plus, CheckCircle, ArrowLeft, Edit2, Save, X } from 'lucide-react';
import DataService from '../../../services/axios';

const EmailSettings = () => {
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editPassword, setEditPassword] = useState("");

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const res = await DataService.get('/email/getall');
      setEmails(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ ADD EMAIL
  const handleAddEmail = async () => {
    if (!newEmail || !newPassword) {
      return alert("Enter email & password");
    }

    try {
      await DataService.post('/email/add', {
        mail: newEmail,
        password: newPassword
      });

      setNewEmail("");
      setNewPassword("");
      fetchEmails();
    } catch (err) {
      alert("Error adding email");
    }
  };

  // ✅ START EDIT
  const startEdit = (email) => {
    setEditingId(email.id);
    setEditValue(email.mail);
    setEditPassword(""); // security ke liye blank rakho
  };

  // ✅ UPDATE EMAIL + PASSWORD
  const handleUpdate = async (id) => {
    if (!editValue || !editPassword) {
      return alert("Email & password required");
    }

    try {
      await DataService.put(`/email/edit/${id}`, {
        mail: editValue,
        password: editPassword
      });

      setEditingId(null);
      fetchEmails();
    } catch (err) {
      alert("Error updating email");
    }
  };

  // ✅ ACTIVATE
  const handleActivate = async (id) => {
    try {
      await DataService.put(`/email/activate/${id}`);
      fetchEmails();
    } catch (err) {
      alert("Error activating email");
    }
  };

  // ✅ DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this email?")) return;

    try {
      await DataService.delete(`/email/delete/${id}`);
      fetchEmails();
    } catch (err) {
      alert("Error deleting email");
    }
  };

  const activeEmail = emails.find(e => e.isActive);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button className="p-2 bg-white rounded-lg border shadow-sm">
          <ArrowLeft size={20}/>
        </button>
        <div>
          <h2 className="text-xl font-bold">Email Settings</h2>
          <p className="text-xs text-gray-500">Confidential Evaluations</p>
        </div>
      </div>

      {/* ACTIVE EMAIL */}
      {activeEmail && (
        <div className="bg-white border-2 border-green-500 rounded-3xl p-6 mb-8 flex items-start gap-4 shadow-sm">
          <div className="bg-green-600 p-2 rounded-xl text-white">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-xs font-bold uppercase">🔐 Current Active</div>
            <p className="text-green-700 font-bold">{activeEmail.mail}</p>
          </div>
        </div>
      )}

      {/* ADD SECTION */}
      <div className="bg-white border rounded-3xl p-8 mb-10 shadow-sm">
        <div className="flex items-center gap-2 font-bold mb-6">
          <Plus size={20} /> Add New Email
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="example@gmail.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full bg-gray-100 rounded-xl p-4"
          />

          <input
            type="password"
            placeholder="App Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-gray-100 rounded-xl p-4"
          />

          <button
            onClick={handleAddEmail}
            className="w-full bg-green-600 text-white py-3 rounded-xl flex justify-center gap-2"
          >
            <Mail size={18}/> Add Email
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        <div className="font-bold text-sm">
          Emails ({emails.length})
        </div>

        {emails.map((email) => (
          <div key={email.id} className={`bg-white p-5 rounded-xl flex justify-between ${email.isActive ? 'ring-2 ring-green-500' : ''}`}>
            
            <div className="flex gap-4 flex-1">
              <input
                type="radio"
                checked={email.isActive}
                onChange={() => handleActivate(email.id)}
              />

              {editingId === email.id ? (
                <div className="w-full space-y-2">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full border-b"
                  />
                  <input
                    type="password"
                    placeholder="New App Password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full border-b"
                  />
                </div>
              ) : (
                <div>
                  <p className="font-bold">{email.mail}</p>
                  {email.isActive && <span className="text-green-600 text-xs">Active</span>}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {editingId === email.id ? (
                <>
                  <button onClick={() => handleUpdate(email.id)}>
                    <Save size={18}/>
                  </button>
                  <button onClick={() => setEditingId(null)}>
                    <X size={18}/>
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(email)}>
                    <Edit2 size={18}/>
                  </button>
                  <button onClick={() => handleDelete(email.id)}>
                    <Trash2 size={18}/>
                  </button>
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