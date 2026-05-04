import React, { useEffect, useState } from 'react';
import {
  ClipboardCheck, Loader2, Calendar, Eye, ArrowLeft,
  Star, Building2, Clock, Pencil, Save, X, Trash2
} from 'lucide-react';
import DataService from '../../../services/axios';

const calcScore = (lateIn = 0, leftEarly = 0) => {
  const total = lateIn + leftEarly;
  if (total >= 10) return 0;
  if (total >= 6)  return 3;
  if (total >= 1)  return 4;
  return 5;
};

const computeStatus = (lateIn = 0, leftEarly = 0, original = '') => {
  const total = lateIn + leftEarly;
  if (total >= 10) return 'Cancelled';
  return original || 'Present';
};

const formatDate = (val) => {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (val) => {
  if (!val) return '';
  return new Date(val).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const ScorePill = ({ score }) => {
  const map = { 5: ['#d1fae5', '#065f46'], 4: ['#dbeafe', '#1e40af'], 3: ['#fef3c7', '#92400e'], 0: ['#fee2e2', '#991b1b'] };
  const [bg, fg] = map[score] ?? map[0];
  return (
    <span style={{ background: bg, color: fg, borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Star size={10} fill={fg} /> {score}/5
    </span>
  );
};

const StatusPill = ({ status }) => {
  const cancelled = status === 'Cancelled';
  return (
    <span style={{ background: cancelled ? '#fee2e2' : '#f0fdf4', color: cancelled ? '#991b1b' : '#065f46', borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
      {status}
    </span>
  );
};

const Th = ({ ch, center }) => (
  <th style={{ padding: '11px 14px', textAlign: center ? 'center' : 'left', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
    {ch}
  </th>
);

// ══════════════════════════════════════════════════════════════════════
// Confirm Dialog
// ══════════════════════════════════════════════════════════════════════
const ConfirmDialog = ({ message, onConfirm, onCancel, loading }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
    <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 8, display: 'flex' }}>
          <Trash2 size={20} color="#fff" />
        </div>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>Confirm Delete</p>
      </div>
      <div style={{ padding: '1.5rem' }}>
        <p style={{ margin: '0 0 1.5rem', fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '11px 0', fontWeight: 700, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ flex: 1, background: loading ? '#fca5a5' : '#dc2626', border: 'none', borderRadius: 8, padding: '11px 0', fontWeight: 700, fontSize: 13, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : <><Trash2 size={14} /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════
// Edit Modal
// ══════════════════════════════════════════════════════════════════════
const EditModal = ({ row, onClose, onSaved }) => {
  const [lateIn,    setLateIn]    = useState(row.LateIn    ?? 0);
  const [leftEarly, setLeftEarly] = useState(row.LeftEarly ?? 0);
  const [remarks,   setRemarks]   = useState(row.Remarks   || '');
  const [saving,    setSaving]    = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await DataService.put(`/CHR/EditRow/${row.id}`, { LateIn: lateIn, LeftEarly: leftEarly, Remarks: remarks });
      onSaved({ ...row, LateIn: lateIn, LeftEarly: leftEarly, Remarks: remarks });
      onClose();
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.Message || 'Server Error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>Edit Record</p>
            <p style={{ margin: 0, fontSize: 12, color: '#bbf7d0', marginTop: 2 }}>{row.TeacherName} — {row.CourseCode}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex' }}>
            <X size={18} color="#fff" />
          </button>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>Late In (minutes)</label>
            <input type="number" min="0" value={lateIn} onChange={e => setLateIn(Number(e.target.value))}
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontWeight: 700, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ marginTop: 8, background: '#f8fafc', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Preview:</span>
              <ScorePill score={calcScore(lateIn, leftEarly)} />
              <StatusPill status={computeStatus(lateIn, leftEarly)} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>Left Early (minutes)</label>
            <input type="number" min="0" value={leftEarly} onChange={e => setLeftEarly(Number(e.target.value))}
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontWeight: 700, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>Remarks</label>
            <textarea rows={3} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Enter remarks..."
              style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: '#0f172a', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '11px 0', fontWeight: 700, fontSize: 13, color: '#475569', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 2, background: saving ? '#86efac' : '#16a34a', border: 'none', borderRadius: 8, padding: '11px 0', fontWeight: 700, fontSize: 13, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════
const CHRManagement = () => {
  const [reports,       setReports]       = useState([]);
  const [details,       setDetails]       = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeId,      setActiveId]      = useState(null);
  const [editRow,       setEditRow]       = useState(null);

  // ── Session state ──────────────────────────────────────────────────
  const [sessions,        setSessions]        = useState([]);
  const [selectedSession, setSelectedSession] = useState('');

  // ── Delete state ───────────────────────────────────────────────────
  const [confirm,  setConfirm]  = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Sessions fetch ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await DataService.get('session/list');
        setSessions(res.data || []);
      } catch (err) {
        console.error('Sessions fetch error', err);
      }
    };
    fetchSessions();
  }, []);

  // ── Dashboard fetch ────────────────────────────────────────────────
  const fetchSummary = async (sessionId = '') => {
    setLoading(true);
    setDetails(null);
    try {
      const url = sessionId
        ? `/CHR/GetHODDashboard?sessionID=${sessionId}`
        : '/CHR/GetHODDashboard';
      const res = await DataService.get(url);
      setReports(res.data || []);
    } catch (err) {
      console.error('Dashboard error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const handleSessionChange = (e) => {
    const val = e.target.value;
    setSelectedSession(val);
    fetchSummary(val);
  };

  // ── View detail ────────────────────────────────────────────────────
  const handleView = async (reportId) => {
    setActiveId(reportId);
    setDetailLoading(true);
    try {
      const res  = await DataService.get(`/CHR/GetReportById/${reportId}`);
      const data = Array.isArray(res.data) ? res.data : [res.data];
      if (data.length === 0) { alert('no record .'); return; }
      setDetails(data);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.Message || 'Server Error'));
    } finally {
      setActiveId(null);
      setDetailLoading(false);
    }
  };

  const handleBack  = () => setDetails(null);
  const handleSaved = (updated) => setDetails(prev => prev.map(d => d.id === updated.id ? updated : d));

  // ── Delete handlers ────────────────────────────────────────────────
  const askDeleteBatch = (reportId, date) => {
    setConfirm({ type: 'batch', id: reportId, message: `"${formatDate(date)}"  report delete ` });
  };

  const askDeleteRow = (row) => {
    setConfirm({ type: 'row', id: row.id, message: `${row.TeacherName} (${row.CourseCode}) record will be delete.` });
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (confirm.type === 'batch') {
        await DataService.delete(`/CHR/DeleteBatch/${confirm.id}`);
        setReports(prev => prev.filter(r => r.ReportId !== confirm.id));
        setDetails(null);
      } else {
        await DataService.delete(`/CHR/DeleteRow/${confirm.id}`);
        setDetails(prev => {
          const updated = prev.filter(d => d.id !== confirm.id);
          return updated.length > 0 ? updated : null;
        });
      }
      setConfirm(null);
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.Message || 'Server Error'));
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Confirm Dialog */}
      {confirm && (
        <ConfirmDialog message={confirm.message} loading={deleting} onConfirm={handleConfirmDelete} onCancel={() => setConfirm(null)} />
      )}

      {/* Edit Modal */}
      {editRow && (
        <EditModal row={editRow} onClose={() => setEditRow(null)} onSaved={handleSaved} />
      )}

      {/* ── Header ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 4, height: 44, background: 'linear-gradient(180deg,#16a34a,#15803d)', borderRadius: 4 }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>CHR Management</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 500 }}>
              HOD Dashboard — {details ? 'Detailed Report' : 'Attendance Reports'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>

          {/* ── Session Dropdown ── */}
          <select
            value={selectedSession}
            onChange={handleSessionChange}
            style={{ border: '1.5px solid #bbf7d0', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, color: '#15803d', background: '#f0fdf4', cursor: 'pointer', outline: 'none', minWidth: 180 }}
          >
            <option value="">All Sessions</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Date badge */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color="#16a34a" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {details && (
            <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e2e8f0', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
              <ArrowLeft size={14} /> Back to Reports
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6rem', color: '#16a34a' }}>
          <Loader2 size={38} className="animate-spin" />
          <p style={{ marginTop: 10, fontWeight: 700 }}>Loading Reports...</p>
        </div>
      )}

      {/* ════════ SCREEN 1 — Cards ════════ */}
      {!loading && !details && (
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {reports.length > 0 ? reports.map((r, i) => (
            <div key={r.ReportId ?? i}
              style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,.04)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'box-shadow .2s, transform .2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ height: 5, background: 'linear-gradient(90deg,#16a34a,#4ade80)' }} />

              <div style={{ padding: '1.4rem 1.3rem 1.1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Icon + Batch Delete */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: '#f0fdf4', padding: 10, borderRadius: 12, display: 'flex' }}>
                      <ClipboardCheck size={22} color="#16a34a" />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>CHR Report</span>
                  </div>
                  <button
                    onClick={() => askDeleteBatch(r.ReportId, r.ReportDate)}
                    // style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#e11d48', transition: 'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#e11d48'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#e11d48'; }}
                    title="Delete entire report"
                  >
                    {/* <Trash2 size={13} /> */}
                  </button>
                </div>

                {/* Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 14px' }}>
                  <Calendar size={18} color="#16a34a" />
                  <div>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#86efac', textTransform: 'uppercase' }}>Date</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#15803d' }}>{formatDate(r.ReportDate)}</p>
                  </div>
                </div>

                {/* Session Name badge */}
                {r.SessionName && r.SessionName !== 'N/A' && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>
                    📅 {r.SessionName}
                  </div>
                )}

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Total',     val: r.TotalClasses,     color: '#0f172a', bg: '#f8fafc' },
                    { label: 'Cancelled', val: r.CancelledClasses, color: r.CancelledClasses > 0 ? '#dc2626' : '#0f172a', bg: r.CancelledClasses > 0 ? '#fff8f8' : '#f8fafc' },
                    { label: 'Late',      val: r.LateTeachers,     color: '#f59e0b', bg: '#f8fafc' },
                    { label: 'Avg Score', val: r.AvgScore?.toFixed(1), color: '#16a34a', bg: '#f8fafc' },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</p>
                      <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* View Button */}
              <button
                onClick={() => handleView(r.ReportId)}
                disabled={activeId === r.ReportId}
                style={{ width: '100%', background: activeId === r.ReportId ? '#dcfce7' : '#16a34a', color: activeId === r.ReportId ? '#16a34a' : '#fff', border: 'none', padding: '14px 0', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: activeId === r.ReportId ? 'not-allowed' : 'pointer', transition: 'background .2s' }}
                onMouseEnter={e => { if (activeId !== r.ReportId) e.currentTarget.style.background = '#15803d'; }}
                onMouseLeave={e => { if (activeId !== r.ReportId) e.currentTarget.style.background = '#16a34a'; }}
              >
                {activeId === r.ReportId ? <><Loader2 size={15} className="animate-spin" /> Loading...</> : <><Eye size={15} /> View Details</>}
              </button>
            </div>
          )) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
              <ClipboardCheck size={36} color="#cbd5e1" style={{ marginBottom: 12 }} />
              <p style={{ color: '#94a3b8', fontWeight: 700, margin: 0 }}>
                {selectedSession ? 'Is session mein koi CHR report nahi mili.' : 'No CHR Reports found.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ════════ SCREEN 2 — Detail Table ════════ */}
      {!loading && details && (
        detailLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6rem', color: '#16a34a' }}>
            <Loader2 size={38} className="animate-spin" />
            <p style={{ marginTop: 10, fontWeight: 700 }}>Loading Details...</p>
          </div>
        ) : (
          <div style={{ maxWidth: 1200, margin: '0 auto', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,.04)', overflow: 'hidden' }}>

            {/* Table top bar */}
            <div style={{ padding: '1rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Detailed Attendance Report</h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
                  {formatDate(details[0]?.ClassDate)} — {formatTime(details[0]?.ClassDate)}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ background: '#f1f5f9', padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, color: '#64748b' }}>
                  {details.length} records
                </span>
                {details.filter(d => (d.LateIn + (d.LeftEarly ?? 0)) >= 10).length > 0 && (
                  <span style={{ background: '#fee2e2', padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, color: '#991b1b' }}>
                    {details.filter(d => (d.LateIn + (d.LeftEarly ?? 0)) >= 10).length} cancelled
                  </span>
                )}
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <Th ch="Teacher" />
                    <Th ch="Course / Venue" />
                    <Th ch="Late In (m)" center />
                    <Th ch="Left Early (m)" center />
                    <Th ch="Score" center />
                    <Th ch="Status" />
                    <Th ch="Remarks" />
                    {/* <Th ch="Actions" center /> */}
                  </tr>
                </thead>
                <tbody>
                  {details.map((d, i) => {
                    const score  = calcScore(d.LateIn, d.LeftEarly);
                    const status = computeStatus(d.LateIn, d.LeftEarly, d.Status);
                    return (
                      <tr key={i}
                        style={{ borderTop: '1px solid #f1f5f9', background: status === 'Cancelled' ? '#fff8f8' : i % 2 === 0 ? '#fff' : '#fafafa', transition: 'background .15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = status === 'Cancelled' ? '#fff8f8' : i % 2 === 0 ? '#fff' : '#fafafa'; }}
                      >
                        <td style={{ padding: '11px 14px', fontWeight: 700, color: '#0f172a' }}>
                          <div>{d.TeacherName}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{d.TeacherID}</div>
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#16a34a', display: 'block' }}>{d.CourseCode}</span>
                          <span style={{ color: '#64748b', fontSize: 11 }}>{d.Venue}</span>
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                          <span style={{ background: d.LateIn > 0 ? '#fee2e2' : '#f0fdf4', color: d.LateIn > 0 ? '#991b1b' : '#065f46', padding: '3px 12px', borderRadius: 6, fontWeight: 800 }}>
                            {d.LateIn}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                          <span style={{ background: d.LeftEarly > 0 ? '#fffbeb' : '#f8fafc', color: d.LeftEarly > 0 ? '#92400e' : '#94a3b8', padding: '3px 12px', borderRadius: 6, fontWeight: 800 }}>
                            {d.LeftEarly}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'center' }}><ScorePill score={score} /></td>
                        <td style={{ padding: '11px 14px' }}><StatusPill status={status} /></td>
                        <td style={{ padding: '11px 14px', color: d.Remarks ? 'black' : '#94a3b8', fontSize: d.Remarks ? '14px' : '12px', fontStyle: d.Remarks ? 'normal' : 'italic', fontWeight: d.Remarks ? 'bold' : 'normal', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.Remarks || 'No remarks'}
                        </td>

                        {/* ── Actions: Edit + Delete ── */}
                        <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            {/* <button
                              onClick={() => setEditRow(d)}
                              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#2563eb', transition: 'all .15s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#fff'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; }}
                            >
                              <Pencil size={12} /> Edit
                            </button> */}
                            <button
                              onClick={() => askDeleteRow(d)}
                              style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#e11d48', transition: 'all .15s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#e11d48'; e.currentTarget.style.color = '#fff'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#e11d48'; }}
                            >
                              <Trash2 size={12} /> Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default CHRManagement;