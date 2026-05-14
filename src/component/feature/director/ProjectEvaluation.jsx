import React, { useState, useEffect } from 'react';
import {
  Users, ChevronLeft, Star, CheckCircle, Loader2,
  ClipboardList, Award, AlertCircle
} from 'lucide-react';
import DataService from '../../../services/axios';

// ── Constants ──────────────────────────────────────────────────────────────
const SESSION_ID   = 1;
const DIRECTOR_ID  = 'Dirctor01';

const SCORE_OPTIONS = [
  { label: 'Excellent', val: 4, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { label: 'Good',      val: 3, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  { label: 'Average',   val: 2, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { label: 'Poor',      val: 1, color: '#dc2626', bg: '#fff1f2', border: '#fecdd3' },
];

// ══════════════════════════════════════════════════════════════════════════
// Score Radio Option
// ══════════════════════════════════════════════════════════════════════════
const ScoreOption = ({ opt, selected, onChange }) => (
  <label
    style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 6, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
      border: `2px solid ${selected ? opt.border : '#e2e8f0'}`,
      background: selected ? opt.bg : '#fafafa',
      transition: 'all .15s',
    }}
  >
    <input
      type="radio"
      name={`q-${opt.name}`}
      value={opt.val}
      checked={selected}
      onChange={onChange}
      style={{ display: 'none' }}
    />
    <span style={{ fontSize: 18, fontWeight: 900, color: selected ? opt.color : '#94a3b8' }}>
      {opt.val}
    </span>
    <span style={{ fontSize: 11, fontWeight: 700, color: selected ? opt.color : '#94a3b8' }}>
      {opt.label}
    </span>
    {selected && (
      <CheckCircle size={14} color={opt.color} />
    )}
  </label>
);

// ══════════════════════════════════════════════════════════════════════════
// Member Card
// ══════════════════════════════════════════════════════════════════════════
const MemberCard = ({ member, onStart }) => (
  <div
    style={{
      background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,.04)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', transition: 'all .2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <div style={{ height: 5, background: 'linear-gradient(90deg,#2563eb,#60a5fa)' }} />
    <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Avatar + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#2563eb,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
            {member.name?.charAt(0)?.toUpperCase()}
          </span>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{member.name}</p>
          <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 500 }}>{member.department}</p>
        </div>
      </div>

      {/* ID badge */}
      <div style={{ background: '#f8fafc', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>
        ID: {member.userID}
      </div>
    </div>

    <button
      onClick={() => onStart(member)}
      style={{
        width: '100%', background: '#2563eb', color: '#fff', border: 'none',
        padding: '13px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'background .2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#2563eb'; }}
    >
      <ClipboardList size={15} /> Start Evaluation
    </button>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════
const ProjectEvaluation = () => {
  const [members,         setMembers]         = useState([]);
  const [questionnaire,   setQuestionnaire]   = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [answers,         setAnswers]         = useState({});
  const [loading,         setLoading]         = useState(false);
  const [fetchLoading,    setFetchLoading]    = useState(true);
  const [submitDone,      setSubmitDone]      = useState(false);

  // ── Fetch on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setFetchLoading(true);
      try {
        const [membersRes, questRes] = await Promise.all([
          DataService.get('/ProjectEvaluation/GetCommitteeMembers'),
          DataService.get('/ProjectEvaluation/GetActiveQuestionnaire/PE'),
        ]);
        setMembers(membersRes.data || []);
        setQuestionnaire(questRes.data || null);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setFetchLoading(false);
      }
    };
    init();
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleScoreChange = (qId, score) => {
    setAnswers(prev => ({ ...prev, [qId]: score }));
  };

  const handleBack = () => {
    setSelectedTeacher(null);
    setAnswers({});
    setSubmitDone(false);
  };

  const answeredCount  = Object.keys(answers).length;
  const totalQuestions = questionnaire?.Questions?.length ?? 0;
  const allAnswered    = answeredCount === totalQuestions && totalQuestions > 0;

  const handleSubmit = async () => {
    if (!allAnswered) {
      alert('Please answer all questions before submitting.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        EvaluatorId: DIRECTOR_ID,
        EvaluateeId: selectedTeacher.userID,
        SessionId:   SESSION_ID,
        Evaluations: Object.entries(answers).map(([qId, score]) => ({
          QuestionId: parseInt(qId),
          Score:      score,
        })),
      };
      await DataService.post('/ProjectEvaluation/SaveProjectEvaluation', payload);
      setSubmitDone(true);
    } catch (err) {
      alert('Submission failed: ' + (err.response?.data?.Message || 'Server Error'));
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // Loading state
  // ══════════════════════════════════════════════════════════════════════
  if (fetchLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6rem', color: '#2563eb', fontFamily: "'Segoe UI', sans-serif" }}>
        <Loader2 size={38} className="animate-spin" />
        <p style={{ marginTop: 10, fontWeight: 700 }}>Loading Evaluation Data...</p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // Success Screen
  // ══════════════════════════════════════════════════════════════════════
  if (submitDone) {
    return (
      <div style={{ padding: '2rem', fontFamily: "'Segoe UI', sans-serif", maxWidth: 520, margin: '4rem auto', textAlign: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '3rem 2rem', border: '1px solid #e2e8f0', boxShadow: '0 8px 32px rgba(0,0,0,.08)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', border: '3px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Award size={36} color="#16a34a" />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Evaluation Submitted!</h2>
          <p style={{ margin: '0 0 2rem', fontSize: 14, color: '#64748b' }}>
            Evaluation for <strong>{selectedTeacher?.name}</strong> has been saved successfully.
          </p>
          <button
            onClick={handleBack}
            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            Evaluate Another Member
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // Evaluation Form Screen
  // ══════════════════════════════════════════════════════════════════════
  if (selectedTeacher) {
    return (
      <div style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.5rem' }}>
            <button
              onClick={handleBack}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, color: '#475569', cursor: 'pointer' }}
            >
              <ChevronLeft size={15} /> Back
            </button>
            <div style={{ width: 3, height: 36, background: 'linear-gradient(180deg,#2563eb,#3b82f6)', borderRadius: 4 }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Project Evaluation</h1>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Evaluating: <strong style={{ color: '#2563eb' }}>{selectedTeacher.name}</strong></p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 18px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 99, height: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`, background: 'linear-gradient(90deg,#2563eb,#60a5fa)', borderRadius: 99, transition: 'width .3s' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', whiteSpace: 'nowrap' }}>
              {answeredCount} / {totalQuestions} answered
            </span>
          </div>

          {/* Questions */}
          {questionnaire?.Questions?.length > 0 ? (
            questionnaire.Questions.map((q, index) => (
              <div
                key={q.QuestionID}
                style={{
                  background: '#fff', borderRadius: 14, border: `1.5px solid ${answers[q.QuestionID] ? '#bfdbfe' : '#e2e8f0'}`,
                  padding: '1.25rem', marginBottom: '1rem',
                  boxShadow: answers[q.QuestionID] ? '0 2px 12px rgba(37,99,235,.08)' : 'none',
                  transition: 'all .2s',
                }}
              >
                <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  <span style={{ color: '#2563eb', marginRight: 8 }}>{index + 1}.</span>
                  {q.QuestionText}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {SCORE_OPTIONS.map(opt => (
                    <ScoreOption
                      key={opt.val}
                      opt={{ ...opt, name: q.QuestionID }}
                      selected={answers[q.QuestionID] === opt.val}
                      onChange={() => handleScoreChange(q.QuestionID, opt.val)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, border: '2px dashed #e2e8f0', padding: '3rem', textAlign: 'center' }}>
              <AlertCircle size={32} color="#cbd5e1" style={{ marginBottom: 10 }} />
              <p style={{ color: '#94a3b8', fontWeight: 700, margin: 0 }}>No questions found in questionnaire.</p>
            </div>
          )}

          {/* Submit */}
          {totalQuestions > 0 && (
            <button
              onClick={handleSubmit}
              disabled={loading || !allAnswered}
              style={{
                width: '100%', marginTop: 8,
                background: loading || !allAnswered ? '#93c5fd' : '#2563eb',
                color: '#fff', border: 'none', borderRadius: 12,
                padding: '15px 0', fontWeight: 700, fontSize: 15,
                cursor: loading || !allAnswered ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'background .2s',
              }}
              onMouseEnter={e => { if (!loading && allAnswered) e.currentTarget.style.background = '#1d4ed8'; }}
              onMouseLeave={e => { if (!loading && allAnswered) e.currentTarget.style.background = '#2563eb'; }}
            >
              {loading
                ? <><Loader2 size={17} className="animate-spin" /> Submitting...</>
                : <><Star size={17} fill={allAnswered ? '#fff' : 'none'} /> Submit Evaluation</>
              }
            </button>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // Members List Screen
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '2rem' }}>
          <div style={{ width: 4, height: 44, background: 'linear-gradient(180deg,#2563eb,#1d4ed8)', borderRadius: 4 }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Project Committee Evaluation</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 500 }}>
              {members.length} committee member{members.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        {members.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 20 }}>
            {members.map(m => (
              <MemberCard key={m.userID} member={m} onStart={setSelectedTeacher} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
            <Users size={36} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <p style={{ color: '#94a3b8', fontWeight: 700, margin: 0 }}>No committee members found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectEvaluation;