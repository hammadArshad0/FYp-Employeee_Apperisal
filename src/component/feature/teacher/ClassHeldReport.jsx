import React, { useEffect, useState } from 'react';
import {
  ClipboardList, Loader2, Star, Clock, CheckCircle,
  XCircle, TrendingUp, AlertTriangle, User, Calendar, Layers
} from 'lucide-react';
import DataService from '../../../services/axios';

// ── Score logic ─────────────────────────────────────────────────────
const calcScore = (lateIn = 0) => {
  if (lateIn >= 10) return 0;
  if (lateIn >= 6)  return 3;
  if (lateIn >= 1)  return 4;
  return 5;
};

const computeStatus = (lateIn = 0, original = '') => {
  if (lateIn >= 10) return 'Cancelled';
  return original || 'Present';
};

// ── UI Components (ScoreBar, StatusBadge, SCard) ─────────────────────
const ScoreBar = ({ score }) => {
  const pct = (score / 5) * 100;
  const color = score === 5 ? '#16a34a' : score >= 3 ? '#d97706' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .4s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color, minWidth: 28 }}>{score}/5</span>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    'Present':   ['#f0fdf4', '#065f46'],
    'Cancelled': ['#fee2e2', '#991b1b'],
    'Late':      ['#fffbeb', '#92400e'],
  };
  const [bg, fg] = map[status] ?? ['#f1f5f9', '#475569'];
  return (
    <span style={{ background: bg, color: fg, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
      {status}
    </span>
  );
};

const SCard = ({ icon, label, value, bg, fg }) => (
  <div style={{ background: bg, borderRadius: 14, padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: 6, border: `1px solid ${fg}22` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: fg }}>
      {icon}
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
    </div>
    <span style={{ fontSize: 26, fontWeight: 800, color: fg, lineHeight: 1 }}>{value}</span>
  </div>
);

// ════════════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════════════
const ClassHeldReport = () => {
  const [records, setRecords]     = useState([]);
  const [sessions, setSessions]   = useState([]);
  const [selectedSession, setSelectedSession] = useState(localStorage.getItem('sessionId') || '');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const teacherId = localStorage.getItem('userId') || '';
  const teacherName = (() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.name || teacherId || 'Teacher';
    } catch { return teacherId || 'Teacher'; }
  })();

  // 1. Fetch Sessions List
  const fetchSessions = async () => {
    try {
      const res = await DataService.get('/Session/list');
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Sessions fetch error", err);
    }
  };

  // 2. Fetch Report (Teacher + Session based)
  const fetchReport = async () => {
    if (!teacherId) { setError('Teacher ID not found.'); return; }
    if (!selectedSession) { setError('Please select a session.'); return; }

    setLoading(true);
    setError('');
    try {
      // API call with teacherId and sessionId
      const res = await DataService.get(`/CHR/GetTeacherReport?teacherId=${teacherId}&sessionId=${selectedSession}`);
      const data = Array.isArray(res.data) ? res.data : [res.data];
      setRecords(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setRecords([]);
      } else {
        setError('Error loading report: ' + (err.response?.data?.Message || 'Server Error'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchReport();
    }
  }, [selectedSession]);

  // ── Computed stats ───────────────────────────────────────────────
  const total     = records.length;
  const avgScore  = total ? (records.reduce((s, r) => s + calcScore(r.LateIn), 0) / total).toFixed(1) : '—';
  const lateCount = records.filter(r => r.LateIn > 0 && r.LateIn < 10).length;
  const cancelled = records.filter(r => r.LateIn >= 10).length;
  const onTime    = records.filter(r => r.LateIn === 0).length;

  return (
    <div style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── Header & Filters ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto 1.75rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 4, height: 44, background: 'linear-gradient(180deg,#2563eb,#1d4ed8)', borderRadius: 4 }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px' }}>Class Held Performance</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <User size={12} color="#64748b" />
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>{teacherName}</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Session Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '2px 10px' }}>
            <Layers size={14} color="#64748b" style={{ marginRight: 8 }} />
            <select 
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              style={{ border: 'none', outline: 'none', padding: '8px 4px', fontSize: 13, fontWeight: 600, color: '#1e293b', background: 'transparent', cursor: 'pointer' }}
            >
              <option value="">Select Session</option>
              {sessions.map(s => (
                <option key={s.SessionID} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={13} color="#2563eb" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ maxWidth: 1100, margin: '0 auto 1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} color="#dc2626" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>{error}</span>
        </div>
      )}

      {/* ── Summary Cards ── */}
      {!loading && (
        <div style={{ maxWidth: 1100, margin: '0 auto 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <SCard icon={<ClipboardList size={15} />} label="Total Classes" value={total}    bg="#eff6ff" fg="#1d4ed8" />
          <SCard icon={<Star size={15} />}          label="Avg Score"     value={avgScore === '—' ? '—' : `${avgScore}/5`} bg="#f0fdf4" fg="#16a34a" />
          <SCard icon={<CheckCircle size={15} />}   label="On Time"       value={onTime}   bg="#ecfdf5" fg="#059669" />
          <SCard icon={<Clock size={15} />}         label="Late"          value={lateCount} bg="#fffbeb" fg="#d97706" />
          <SCard icon={<XCircle size={15} />}       label="Cancelled"     value={cancelled} bg="#fef2f2" fg="#dc2626" />
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,.04)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Attendance Detail</h2>
          {loading && <Loader2 size={18} className="animate-spin" color="#2563eb" />}
          {!loading && (
             <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: 8 }}>
             {total} records
           </span>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Date', 'Course', 'Venue', 'Late In (m)', 'Left Early (m)', 'Score', 'Status', 'Remarks'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94a3b8', borderBottom: '1px solid #f1f5f9', textAlign: ['Late In (m)', 'Left Early (m)', 'Score'].includes(h) ? 'center' : 'left' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((d, i) => {
                const score  = calcScore(d.LateIn);
                const status = computeStatus(d.LateIn, d.Status);
                return (
                  <tr key={i} style={{ background: status === 'Cancelled' ? '#fff8f8' : '#fff', borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '11px 14px', fontWeight: 700, color: '#0f172a' }}>
                      {new Date(d.ClassDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8' }}>{d.CourseCode}</span>
                    </td>
                    <td style={{ padding: '11px 14px', color: '#64748b' }}>{d.Venue || '—'}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                      <span style={{ background: d.LateIn > 0 ? '#fee2e2' : '#f0fdf4', color: d.LateIn > 0 ? '#991b1b' : '#065f46', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                        {d.LateIn}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                      <span style={{ background: d.LeftEarly > 0 ? '#fffbeb' : '#f8fafc', color: d.LeftEarly > 0 ? '#92400e' : '#94a3b8', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                        {d.LeftEarly}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px', minWidth: 110 }}>
                      <ScoreBar score={score} />
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <StatusBadge status={status} />
                    </td>
                    <td style={{ padding: '11px 14px', color: 'black',fontWeight:'bold', fontStyle: 'italic', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.Remarks}>
                      {d.Remarks || 'No remarks'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {!loading && records.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <TrendingUp size={30} color="#cbd5e1" style={{ marginBottom: 10 }} />
              <p style={{ color: '#94a3b8', fontWeight: 600 }}>No records for this session.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassHeldReport;