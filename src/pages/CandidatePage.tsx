import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Clock, ChevronRight, ChevronLeft, Send, AlertTriangle, CheckCircle, Loader2, Shield } from 'lucide-react';

interface Props { assessmentId: string; }
type Stage = 'loading' | 'not-found' | 'onboarding' | 'test' | 'submitting' | 'submitted' | 'error';
const TOTAL_TIME = 45 * 60;

export default function CandidatePage({ assessmentId }: Props) {
  const [stage, setStage]           = useState<Stage>('loading');
  const [assessment, setAssessment] = useState<any>(null);
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [currentQ, setCurrentQ]     = useState(0);
  const [answers, setAnswers]       = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft]     = useState(TOTAL_TIME);
  const [honorCode, setHonorCode]   = useState(false);
  const [formError, setFormError]   = useState('');
  const [submitError, setSubmitError] = useState('');
  const timerRef = useRef<any>(null);

  useEffect(() => {
    api.getAssessment(assessmentId)
      .then(data => {
        if (data?.questions) { setAssessment(data); setStage('onboarding'); }
        else setStage('not-found');
      })
      .catch(() => setStage('not-found'));
  }, [assessmentId]);

  useEffect(() => {
    if (stage === 'test') {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [stage]);

  const startTest = async () => {
    if (!name.trim())                          { setFormError('Please enter your full name.'); return; }
    if (!email.trim() || !email.includes('@')) { setFormError('Please enter a valid email.'); return; }
    if (!honorCode)                            { setFormError('Please agree to the Honor Code.'); return; }
    setFormError('');
    try {
      const res = await api.createCandidate({
        id: `cand-${Date.now()}`, name, email, assessment_id: assessmentId,
      });
      setCandidateId(res.id);
      setStage('test');
    } catch { setFormError('Failed to register. Please try again.'); }
  };

  const handleSubmit = async (auto = false) => {
    if (stage === 'submitting' || stage === 'submitted') return;
    clearInterval(timerRef.current);
    setStage('submitting');
    try {
      const res = await api.evaluate({ candidateId, assessmentId, answers });
      if (!res.success) throw new Error(res.error || 'Evaluation failed');
      setStage('submitted');
    } catch (e: any) {
      console.error(e);
      setSubmitError(e.message || 'Submission failed. Please try again.');
      setStage('test');
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const questions     = assessment?.questions || [];
  const totalQ        = questions.length;
  const answeredCount = Object.keys(answers).filter(k => answers[k]?.trim()).length;
  const currentQ_obj  = questions[currentQ];
  const isWarning     = timeLeft < 300;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (stage === 'loading') return (
    <div className="candidate-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={40} color="#059669" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );

  // ── Not found ─────────────────────────────────────────────────────────────
  if (stage === 'not-found') return (
    <div className="candidate-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 40 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
        <h2 style={{ color: '#f1f5f9', marginBottom: 8 }}>Assessment Not Found</h2>
        <p style={{ color: '#64748b' }}>This link is invalid or has expired. Please contact your recruiter.</p>
      </div>
    </div>
  );

  // ── Submitted ─────────────────────────────────────────────────────────────
  if (stage === 'submitted') return (
    <div className="candidate-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-fade-in" style={{
        textAlign: 'center', maxWidth: 480, padding: 44,
        background: '#1e293b', borderRadius: 20,
        border: '1px solid rgba(5,150,105,0.25)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 22px',
          background: 'linear-gradient(135deg,rgba(5,150,105,0.15),rgba(16,185,129,0.08))',
          border: '2px solid rgba(5,150,105,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle size={38} color="#10b981" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>
          Thanks for submitting!
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, marginBottom: 10 }}>
          We'll get back to you shortly.
        </p>
        <p style={{ color: '#64748b', fontSize: 13 }}>
          Our team at <span style={{ color: '#10b981' }}>Mosaic Wellness</span> will review your responses and be in touch within 3–5 business days.
        </p>
        <div style={{ marginTop: 24, padding: '12px 16px', background: '#0f172a', borderRadius: 10, fontSize: 13, color: '#475569' }}>
          ✓ Your answers have been securely submitted
        </div>
      </div>
    </div>
  );

  // ── Onboarding ────────────────────────────────────────────────────────────
  if (stage === 'onboarding') return (
    <div className="candidate-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="animate-fade-in" style={{
        maxWidth: 520, width: '100%', padding: 36,
        background: '#1e293b', borderRadius: 20,
        border: '1px solid rgba(148,163,184,0.1)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 12px',
            background: 'linear-gradient(135deg,#059669,#10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, boxShadow: '0 8px 24px rgba(5,150,105,0.4)',
          }}>⬡</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Mosaic Talent</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Skills Assessment Portal</p>
        </div>

        <div style={{ padding: '14px 16px', background: '#0f172a', borderRadius: 10, border: '1px solid #1e293b', marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>You are applying for</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>{assessment?.job_title || 'Skills Assessment'}</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: '#64748b' }}>
            <span>📝 {totalQ} questions</span>
            <span>⏱️ 45 minutes</span>
            <span>🤖 AI evaluated</span>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>Full Name</label>
          <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane Smith" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>Email Address</label>
          <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. jane@example.com" />
        </div>

        <div style={{ padding: '14px 16px', background: 'rgba(245,158,11,0.05)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.15)', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <AlertTriangle size={14} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
              <strong style={{ color: '#fbbf24' }}>Honor Code:</strong> All answers must be your own work. AI-generated responses are detected and will affect your evaluation.
            </p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={honorCode} onChange={e => setHonorCode(e.target.checked)} style={{ accentColor: '#059669', width: 14, height: 14 }} />
            <span style={{ fontSize: 13, color: '#94a3b8' }}>I agree to the Honor Code</span>
          </label>
        </div>

        {formError && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, color: '#f87171', fontSize: 13, marginBottom: 12 }}>
            {formError}
          </div>
        )}

        <button onClick={startTest} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 15 }}>
          Begin Assessment <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  // ── Submitting ────────────────────────────────────────────────────────────
  if (stage === 'submitting') return (
    <div className="candidate-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={44} color="#059669" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
        <h3 style={{ color: '#f1f5f9', fontSize: 18, marginBottom: 8 }}>Evaluating your responses...</h3>
        <p style={{ color: '#64748b', fontSize: 14 }}>Our AI is analysing your answers. This takes about 30 seconds.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
          {['Scoring answers', 'Competency mapping', 'Integrity check', 'Culture fit'].map(s => (
            <span key={s} className="badge badge-slate" style={{ fontSize: 12 }}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Test ──────────────────────────────────────────────────────────────────
  if (stage === 'test' && currentQ_obj) return (
    <div className="candidate-bg" style={{ padding: '20px 16px', minHeight: '100vh' }}>
      {/* Top bar */}
      <div style={{
        maxWidth: 700, margin: '0 auto 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 16px', background: '#1e293b', borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>⬡</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
            {name} · Q{currentQ + 1}/{totalQ}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>{answeredCount}/{totalQ} answered</span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
            background: isWarning ? 'rgba(239,68,68,0.1)' : 'rgba(5,150,105,0.1)',
            borderRadius: 20, border: `1px solid ${isWarning ? 'rgba(239,68,68,0.2)' : 'rgba(5,150,105,0.2)'}`,
          }}>
            <Clock size={12} color={isWarning ? '#f87171' : '#10b981'} />
            <span style={{ fontSize: 13, fontWeight: 700, color: isWarning ? '#f87171' : '#10b981' }}>
              {fmt(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ maxWidth: 700, margin: '0 auto 20px' }}>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((currentQ + 1) / totalQ) * 100}%` }} />
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {questions.map((_: any, i: number) => (
            <button key={i} onClick={() => setCurrentQ(i)} style={{
              width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
              background: i === currentQ ? '#059669' : answers[questions[i].id]?.trim() ? 'rgba(5,150,105,0.2)' : '#1e293b',
              color: i === currentQ ? 'white' : answers[questions[i].id]?.trim() ? '#10b981' : '#64748b',
              outline: `1px solid ${i === currentQ ? '#059669' : answers[questions[i].id]?.trim() ? 'rgba(5,150,105,0.3)' : '#334155'}`,
            }}>{i + 1}</button>
          ))}
        </div>
      </div>

      {/* Question card */}
      <div className="question-card animate-fade-in" key={currentQ}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
          <span className={`badge ${currentQ_obj.type === 'mcq' ? 'badge-blue' : currentQ_obj.type === 'scenario' ? 'badge-yellow' : 'badge-slate'}`}>
            {currentQ_obj.type === 'mcq' ? 'Multiple Choice' : currentQ_obj.type === 'scenario' ? 'Scenario' : 'Short Answer'}
          </span>
          <span className="badge badge-slate" style={{ fontSize: 11 }}>{currentQ_obj.competency}</span>
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 600, color: '#f1f5f9', lineHeight: 1.55, marginBottom: 20 }}>
          {currentQ_obj.text}
        </h2>

        {currentQ_obj.type === 'mcq' && currentQ_obj.options && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentQ_obj.options.map((opt: string, i: number) => (
              <button key={i}
                className={`option-btn ${answers[currentQ_obj.id] === opt ? 'selected' : ''}`}
                onClick={() => setAnswers(a => ({ ...a, [currentQ_obj.id]: opt }))}>
                <span style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                  background: answers[currentQ_obj.id] === opt ? 'rgba(5,150,105,0.3)' : '#1e293b',
                  border: `1px solid ${answers[currentQ_obj.id] === opt ? '#059669' : '#334155'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: answers[currentQ_obj.id] === opt ? '#10b981' : '#64748b',
                }}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {(currentQ_obj.type === 'short' || currentQ_obj.type === 'scenario') && (
          <textarea className="textarea-field"
            placeholder="Type your answer here. Be specific and use examples from your experience..."
            value={answers[currentQ_obj.id] || ''}
            onChange={e => setAnswers(a => ({ ...a, [currentQ_obj.id]: e.target.value }))}
            style={{ minHeight: 160 }} />
        )}

        {submitError && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, color: '#f87171', fontSize: 13, marginTop: 12 }}>
            {submitError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22, gap: 10 }}>
          <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
            className="btn-secondary" disabled={currentQ === 0} style={{ opacity: currentQ === 0 ? 0.4 : 1 }}>
            <ChevronLeft size={16} /> Previous
          </button>
          {currentQ < totalQ - 1 ? (
            <button onClick={() => setCurrentQ(q => q + 1)} className="btn-primary">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={() => handleSubmit(false)} className="btn-primary">
              <Send size={15} /> Submit ({answeredCount}/{totalQ} answered)
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '16px auto 0', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
        <Shield size={12} color="#334155" />
        <span style={{ fontSize: 11, color: '#334155' }}>Responses are monitored for AI-generated content</span>
      </div>
    </div>
  );

  return null;
}
