import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, UserX, Loader2, Search, ShieldCheck, ShieldOff
} from 'lucide-react';
import DataService from '../../../services/axios';

// ══════════════════════════════════════════════════════════════════════════
// Status Badge
// ══════════════════════════════════════════════════════════════════════════
const MemberBadge = ({ isMember }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
    background: isMember ? '#f0fdf4' : '#f8fafc',
    color:      isMember ? '#16a34a' : '#94a3b8',
    border:     `1px solid ${isMember ? '#bbf7d0' : '#e2e8f0'}`,
  }}>
    {isMember ? <ShieldCheck size={11} /> : <ShieldOff size={11} />}
    {isMember ? 'Member' : 'Not Member'}
  </span>
);

// ══════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════
const ManageCommittee = () => {
  const [teachers,     setTeachers]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [togglingId,   setTogglingId]   = useState(null);
  const [searchQuery,  setSearchQuery]  = useState('');

  // ── Fetch all teachers ───────────────────────────────────────────────────
  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await DataService.get('/ProjectEvaluation/GetAllTeachers');
      setTeachers(res.data || []);
    } catch (err) {
      console.error('Fetch teachers error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeachers(); }, []);

  // ── Toggle committee status ──────────────────────────────────────────────
  const toggleStatus = async (id, currentStatus) => {
    setTogglingId(id);
    try {
      await DataService.post('/ProjectEvaluation/UpdateCommitteeStatus', {
        UserID:   id,
        IsMember: !currentStatus,
      });
      // Update locally — no need to refetch
      setTeachers(prev =>
        prev.map(t => t.userID === id ? { ...t, IsCommitteeMember: !currentStatus } : t)
      );
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.Message || 'Server Error'));
    } finally {
      setTogglingId(null);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────
  const filtered = teachers.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const memberCount    = teachers.filter(t => t.IsCommitteeMember).length;
  const nonMemberCount = teachers.length - memberCount;

  // ══════════════════════════════════════════════════════════════════════
  // Loading
  // ══════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6rem', color: '#2563eb', fontFamily: "'Segoe UI', sans-serif" }}>
        <Loader2 size={38} className="animate-spin" />
        <p style={{ marginTop: 10, fontWeight: 700 }}>Loading Teachers...</p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 4, height: 44, background: 'linear-gradient(180deg,#2563eb,#1d4ed8)', borderRadius: 4 }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Manage Project Committee</h1>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                {teachers.length} teachers total
              </p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#16a34a' }}>{memberCount}</p>
              <p style={{ margin: 0, fontSize: 10, color: '#16a34a', fontWeight: 700 }}>Members</p>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 16px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#94a3b8' }}>{nonMemberCount}</p>
              <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>Not Members</p>
            </div>
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: 380 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by name or department..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
              border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13,
              fontWeight: 600, color: '#0f172a', outline: 'none',
              background: '#fff', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* ── Table ── */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,.04)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Teacher', 'Department', 'Status', 'Action'].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: '11px 16px', textAlign: i >= 3 ? 'center' : 'left',
                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                        letterSpacing: '.06em', color: '#94a3b8',
                        borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map((t, i) => (
                  <tr
                    key={t.userID}
                    style={{
                      borderTop: '1px solid #f1f5f9',
                      background: i % 2 === 0 ? '#fff' : '#fafafa',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0f9ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'; }}
                  >
                    {/* Row number */}
                    <td style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 700, fontSize: 12 }}>
                      {i + 1}
                    </td>

                    {/* Name + ID */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: t.IsCommitteeMember
                            ? 'linear-gradient(135deg,#16a34a,#22c55e)'
                            : 'linear-gradient(135deg,#94a3b8,#cbd5e1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                            {t.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>{t.name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{t.userID}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>
                      {t.department || '—'}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <MemberBadge isMember={t.IsCommitteeMember} />
                    </td>

                    {/* Toggle button */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleStatus(t.userID, t.IsCommitteeMember)}
                        disabled={togglingId === t.userID}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                          border: 'none', cursor: togglingId === t.userID ? 'not-allowed' : 'pointer',
                          transition: 'all .15s',
                          background: togglingId === t.userID
                            ? '#e2e8f0'
                            : t.IsCommitteeMember ? '#fff1f2' : '#f0fdf4',
                          color: togglingId === t.userID
                            ? '#94a3b8'
                            : t.IsCommitteeMember ? '#e11d48' : '#16a34a',
                        }}
                        onMouseEnter={e => {
                          if (togglingId !== t.userID) {
                            e.currentTarget.style.background = t.IsCommitteeMember ? '#e11d48' : '#16a34a';
                            e.currentTarget.style.color = '#fff';
                          }
                        }}
                        onMouseLeave={e => {
                          if (togglingId !== t.userID) {
                            e.currentTarget.style.background = t.IsCommitteeMember ? '#fff1f2' : '#f0fdf4';
                            e.currentTarget.style.color = t.IsCommitteeMember ? '#e11d48' : '#16a34a';
                          }
                        }}
                      >
                        {togglingId === t.userID ? (
                          <><Loader2 size={13} className="animate-spin" /> Updating...</>
                        ) : t.IsCommitteeMember ? (
                          <><UserX size={13} /> Remove Member</>
                        ) : (
                          <><UserCheck size={13} /> Make Member</>
                        )}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: 700 }}>
                      {searchQuery ? 'No teachers match your search.' : 'No teachers found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManageCommittee;