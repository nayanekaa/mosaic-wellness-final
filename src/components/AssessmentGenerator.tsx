import { useState, useRef } from 'react';
import { api } from '../lib/api';
import { Sparkles, Upload, Check, Copy, ChevronRight, X, Loader2 } from 'lucide-react';

interface Props { onClose: () => void; onCreated: () => void; }

export default function AssessmentGenerator({ onClose, onCreated }: Props) {
  const [step, setStep]         = useState<'input'|'parsing'|'review-jd'|'generating'|'review-questions'|'done'>('input');
  const [jdText, setJdText]     = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedJD, setParsedJD] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [editingQ, setEditingQ] = useState<string | null>(null);
  const [error, setError]       = useState('');
  const [assessLink, setAssessLink] = useState('');
  const [copied, setCopied]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseJD = async () => {
    if (!jdText.trim()) { setError('Please provide a job description.'); return; }
    setError(''); setStep('parsing');
    try {
      const result = await api.parseJD(jdText);
      if (result.error) throw new Error(result.error);
      setParsedJD(result); setStep('review-jd');
    } catch (e: any) { setError(e.message || 'Failed to parse JD.'); setStep('input'); }
  };

  const generateQuestions = async () => {
    setStep('generating');
    try {
      const qs = await api.generateQuestions(parsedJD);
      if (qs.error) throw new Error(qs.error);
      setQuestions(qs); setStep('review-questions');
    } catch (e: any) { setError(e.message || 'Failed to generate questions.'); setStep('review-jd'); }
  };

  const publish = async () => {
    const jobId   = `job-${Date.now()}`;
    const assessId = `assess-${Date.now()}`;
    await api.createJob({ id: jobId, title: parsedJD.roleTitle, description: jdText.slice(0, 500), parsed_data: parsedJD });
    await api.createAssessment({ id: assessId, job_id: jobId, questions });
    setAssessLink(`${window.location.origin}?assess=${assessId}`);
    setStep('done');
    onCreated();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(assessLink).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const stepIndex = { input:0, parsing:0, 'review-jd':1, generating:2, 'review-questions':2, done:3 }[step];
  const stepLabels = ['Input JD', 'Review JD', 'Questions', 'Publish'];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(148,163,184,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={18} color="#10b981" />
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>New Assessment</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
        </div>

        {/* Step indicators */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(148,163,184,0.08)', display: 'flex', gap: 0 }}>
          {stepLabels.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: i <= stepIndex ? '#059669' : '#334155', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                  {i < stepIndex ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 12, color: i <= stepIndex ? '#10b981' : '#64748b', fontWeight: i === stepIndex ? 600 : 400 }}>{s}</span>
              </div>
              {i < stepLabels.length - 1 && <div style={{ flex: 1, height: 1, background: i < stepIndex ? '#059669' : '#334155', margin: '0 8px' }} />}
            </div>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          {/* Input */}
          {step === 'input' && (
            <div>
              <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>Paste a job description below. Our AI will parse it and generate a tailored assessment.</p>
              <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed #334155', borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer', marginBottom: 16, transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#059669')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#334155')}>
                <Upload size={24} color="#475569" />
                <p style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>{fileName || 'Click to upload a file (TXT, PDF, DOCX)'}</p>
                <input ref={fileRef} type="file" accept=".txt,.pdf,.doc,.docx" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setFileName(f.name); const r = new FileReader(); r.onload = ev => setJdText(ev.target?.result as string); r.readAsText(f); } }} />
              </div>
              <p style={{ color: '#64748b', fontSize: 12, textAlign: 'center', marginBottom: 12 }}>— or paste text below —</p>
              <textarea className="textarea-field" style={{ minHeight: 200 }} placeholder="Paste job description here..." value={jdText} onChange={e => setJdText(e.target.value)} />
              <button onClick={parseJD} className="btn-primary" style={{ marginTop: 16, width: '100%', justifyContent: 'center', padding: 12 }}>
                <Sparkles size={16} /> Parse with AI
              </button>
            </div>
          )}

          {/* Parsing */}
          {step === 'parsing' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Loader2 size={40} color="#059669" style={{ animation: 'spin 1s linear infinite' }} />
              <h3 style={{ color: '#f1f5f9', marginTop: 16, marginBottom: 8 }}>Parsing Job Description...</h3>
              <p style={{ color: '#64748b', fontSize: 14 }}>AI is extracting skills, competencies, and Bloom's taxonomy levels.</p>
            </div>
          )}

          {/* Review JD */}
          {step === 'review-jd' && parsedJD && (
            <div>
              <div style={{ padding: '16px 18px', background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.15)', borderRadius: 10, marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{parsedJD.roleTitle}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{parsedJD.department} · {parsedJD.seniority} · {parsedJD.yearsOfExperience} exp</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {parsedJD.keySkills?.slice(0, 8).map((s: any, i: number) => (
                    <span key={i} className="badge badge-green" style={{ fontSize: 11 }}>{s.skill}</span>
                  ))}
                </div>
              </div>
              <h4 style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Core Responsibilities</h4>
              {parsedJD.coreResponsibilities?.slice(0, 5).map((r: string, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>
                  <span style={{ color: '#059669' }}>▸</span> {r}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setStep('input')} className="btn-secondary">← Back</button>
                <button onClick={generateQuestions} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  <Sparkles size={16} /> Generate 11 Questions
                </button>
              </div>
            </div>
          )}

          {/* Generating */}
          {step === 'generating' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Loader2 size={40} color="#059669" style={{ animation: 'spin 1s linear infinite' }} />
              <h3 style={{ color: '#f1f5f9', marginTop: 16, marginBottom: 8 }}>Generating Questions...</h3>
              <p style={{ color: '#64748b', fontSize: 14 }}>Creating MCQ, short answer, and scenario questions tailored to {parsedJD?.roleTitle}.</p>
            </div>
          )}

          {/* Review questions */}
          {step === 'review-questions' && (
            <div>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>{questions.length} questions generated. Click any to edit.</p>
              <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {questions.map((q, i) => (
                  <div key={q.id} style={{ padding: '12px 14px', background: '#0f172a', borderRadius: 10, border: editingQ === q.id ? '1px solid #059669' : '1px solid #1e293b', cursor: 'pointer' }}
                    onClick={() => setEditingQ(editingQ === q.id ? null : q.id)}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span className={`badge ${q.type === 'mcq' ? 'badge-blue' : q.type === 'scenario' ? 'badge-yellow' : 'badge-slate'}`} style={{ fontSize: 10, flexShrink: 0 }}>{q.type}</span>
                      <span style={{ fontSize: 13, color: '#e2e8f0' }}>{q.text}</span>
                    </div>
                    {editingQ === q.id && (
                      <div style={{ marginTop: 10 }} onClick={e => e.stopPropagation()}>
                        <textarea className="textarea-field" style={{ minHeight: 60, fontSize: 13 }} value={q.text}
                          onChange={e => setQuestions(qs => qs.map(x => x.id === q.id ? { ...x, text: e.target.value } : x))} />
                        {q.options && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Options (select correct answer)</div>
                            {q.options.map((opt: string, oi: number) => (
                              <div key={oi} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
                                <input type="radio" name={`correct-${q.id}`} checked={q.correctAnswer === opt}
                                  onChange={() => setQuestions(qs => qs.map(x => x.id === q.id ? { ...x, correctAnswer: opt } : x))}
                                  style={{ accentColor: '#059669' }} />
                                <input className="input-field" style={{ padding: '5px 10px', fontSize: 12 }} value={opt}
                                  onChange={e => setQuestions(qs => qs.map(x => x.id === q.id ? { ...x, options: x.options.map((o: string, ii: number) => ii === oi ? e.target.value : o) } : x))} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={() => setStep('review-jd')} className="btn-secondary">← Back</button>
                <button onClick={publish} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Publish Assessment <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(5,150,105,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid rgba(5,150,105,0.3)' }}>
                <Check size={28} color="#10b981" />
              </div>
              <h3 style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Assessment Published!</h3>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Share this link with candidates</p>
              <div style={{ padding: '12px 14px', background: '#0f172a', borderRadius: 10, border: '1px solid #334155', marginBottom: 16, textAlign: 'left', wordBreak: 'break-all', fontSize: 13, color: '#94a3b8' }}>
                {assessLink}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={copyLink} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  {copied ? <><Check size={14} color="#10b981" /> Copied!</> : <><Copy size={14} /> Copy Link</>}
                </button>
                <button onClick={onClose} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
