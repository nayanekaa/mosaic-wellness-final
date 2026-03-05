import { useState } from 'react';
import { CheckCircle, AlertTriangle, Star, Shield, Heart, ChevronDown, ChevronUp, X } from 'lucide-react';

interface Props { candidate: any; onClose: () => void; }

const scoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#fbbf24' : '#f87171';

export default function CandidateModal({ candidate, onClose }: Props) {
  const [showAnswers, setShowAnswers] = useState(false);
  const ev        = candidate.evaluation;
  const questions = candidate.questions || [];
  const answers   = candidate.answers   || {};

  const scoreBreakdown = ev?.scores ? [
    { label: 'Accuracy',    value: ev.scores.accuracy,    icon: '🎯' },
    { label: 'Relevance',   value: ev.scores.relevance,   icon: '📍' },
    { label: 'Reasoning',   value: ev.scores.reasoning,   icon: '🧠' },
    { label: 'Competency',  value: ev.scores.competency,  icon: '⚡' },
    { label: 'Culture Fit', value: ev.scores.culture,     icon: '🌿' },
  ] : [];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 780 }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(148,163,184,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(135deg,#1e293b,#0f1f35)', borderRadius: '16px 16px 0 0' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 20 }}>
              {candidate.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{candidate.name}</h2>
              <p style={{ fontSize: 13, color: '#64748b' }}>{candidate.email} · {candidate.job_title || 'Assessment'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {candidate.score != null && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor(candidate.score) }}>{candidate.score}%</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Overall Score</div>
              </div>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {!ev ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <p style={{ marginTop: 12 }}>Assessment not yet completed.</p>
            </div>
          ) : (
            <>
              {/* Recommendation */}
              <div style={{
                padding: '14px 18px', borderRadius: 10, marginBottom: 20,
                background: ev.recommendation === 'Advance' ? 'rgba(5,150,105,0.1)' : ev.recommendation === 'Consider' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${ev.recommendation === 'Advance' ? 'rgba(5,150,105,0.25)' : ev.recommendation === 'Consider' ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                {ev.recommendation === 'Advance' ? <CheckCircle size={18} color="#10b981" /> : <AlertTriangle size={18} color={ev.recommendation === 'Consider' ? '#fbbf24' : '#f87171'} />}
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15, color: ev.recommendation === 'Advance' ? '#10b981' : ev.recommendation === 'Consider' ? '#fbbf24' : '#f87171' }}>
                    {ev.recommendation === 'Advance' ? '✓ Advance to Next Round' : ev.recommendation === 'Consider' ? '~ Consider for Review' : '✗ Does Not Meet Requirements'}
                  </span>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, lineHeight: 1.6 }}>{ev.reasoning}</p>
                </div>
              </div>

              {/* Integrity & Fairness */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Integrity Score', sub: 'AI Probability', val: candidate.ai_probability || 0, invert: true,  Icon: Shield },
                  { label: 'Fairness',        sub: 'Eval Confidence', val: candidate.fairness_score  || 0, invert: false, Icon: Heart },
                ].map(item => {
                  const pct   = Math.round(item.val * 100);
                  const color = item.invert ? (pct > 70 ? '#f87171' : pct > 40 ? '#fbbf24' : '#10b981') : '#60a5fa';
                  return (
                    <div key={item.label} style={{ padding: '14px 16px', background: '#0f172a', borderRadius: 10, border: '1px solid #1e293b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <item.Icon size={14} color={color} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#64748b' }}>{item.sub}</span>
                        <span className={`badge ${pct > 70 && item.invert ? 'badge-red' : pct > 40 && item.invert ? 'badge-yellow' : 'badge-blue'}`}>{pct}%</span>
                      </div>
                      <div className="progress-bar" style={{ marginTop: 8 }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}88)` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Score breakdown */}
              {scoreBreakdown.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score Breakdown</h3>
                  {scoreBreakdown.map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span style={{ fontSize: 14 }}>{item.icon}</span>
                      <span style={{ fontSize: 13, color: '#94a3b8', width: 100 }}>{item.label}</span>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${item.value}%` }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: scoreColor(item.value), width: 36, textAlign: 'right' }}>{item.value}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Mosaic Wellness fit */}
              {ev.mosaicFitScore !== undefined && (
                <div style={{ padding: '16px 18px', borderRadius: 10, marginBottom: 20, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>🌿</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#10b981' }}>Mosaic Wellness Fit</span>
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor(ev.mosaicFitScore) }}>{ev.mosaicFitScore}%</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{ev.mosaicFitReasoning}</p>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                {[
                  { title: 'Strengths',        items: ev.strengths  || [], color: '#10b981', Icon: Star },
                  { title: 'Areas for Growth', items: ev.weaknesses || [], color: '#f87171', Icon: AlertTriangle },
                ].map(section => (
                  <div key={section.title} style={{ padding: '14px 16px', background: '#0f172a', borderRadius: 10, border: '1px solid #1e293b' }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: section.color, marginBottom: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <section.Icon size={13} color={section.color} /> {section.title}
                    </h4>
                    {section.items.map((s: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>
                        <span style={{ color: section.color, flexShrink: 0 }}>▸</span> {s}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Answers toggle */}
              {questions.length > 0 && (
                <div>
                  <button onClick={() => setShowAnswers(!showAnswers)} style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, cursor: 'pointer', color: '#94a3b8', fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit' }}>
                    <span style={{ fontWeight: 500 }}>View Candidate Answers ({questions.length})</span>
                    {showAnswers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {showAnswers && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {questions.map((q: any, i: number) => (
                        <div key={q.id} style={{ padding: '14px 16px', background: '#0f172a', borderRadius: 10, border: '1px solid #1e293b' }}>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0 }}>Q{i + 1}</span>
                            <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>{q.text}</span>
                          </div>
                          <div style={{ padding: '10px 12px', background: '#1e293b', borderRadius: 8, fontSize: 13, color: '#94a3b8', borderLeft: '3px solid #059669' }}>
                            {answers[q.id] || <span style={{ color: '#475569', fontStyle: 'italic' }}>No answer provided</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
