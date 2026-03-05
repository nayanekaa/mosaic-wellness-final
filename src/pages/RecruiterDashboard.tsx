import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import AssessmentGenerator from '../components/AssessmentGenerator';
import CandidateModal from '../components/CandidateModal';
import {
  LayoutDashboard, Briefcase, Users, ScrollText,
  Plus, RefreshCw, TrendingUp, Activity, ChevronRight,
  Eye, Trash2, Copy, Check,
} from 'lucide-react';

const scoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#fbbf24' : '#f87171';

export default function RecruiterDashboard() {
  const [tab, setTab]                         = useState('dashboard');
  const [jobs, setJobs]                       = useState<any[]>([]);
  const [assessmentMap, setAssessmentMap]     = useState<Record<string, string>>({});
  const [candidates, setCandidates]           = useState<any[]>([]);
  const [logs, setLogs]                       = useState<any[]>([]);
  const [stats, setStats]                     = useState({ active: 0, candidates: 0, avgScore: 0, recentActivity: [] });
  const [showGenerator, setShowGenerator]     = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [copiedId, setCopiedId]               = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [jobsData, candsData, logsData, statsData] = await Promise.all([
        api.getJobs(), api.getCandidates(), api.getLogs(), api.getStats(),
      ]);
      setJobs(jobsData || []);
      setCandidates(candsData || []);
      setLogs(logsData || []);
      setStats(statsData || { active: 0, candidates: 0, avgScore: 0, recentActivity: [] });

      // fetch assessment id per job
      const map: Record<string, string> = {};
      await Promise.all((jobsData || []).map(async (j: any) => {
        const a = await api.getAssessmentByJob(j.id);
        if (a?.id) map[j.id] = a.id;
      }));
      setAssessmentMap(map);
    } catch (e) { console.error('Load error', e); }
  }, []);

  useEffect(() => { loadData(); const t = setInterval(loadData, 10000); return () => clearInterval(t); }, [loadData]);

  const copyLink = (assessId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}?assess=${assessId}`).catch(() => {});
    setCopiedId(assessId); setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteCandidate = async (id: string) => {
    if (!confirm('Delete this candidate?')) return;
    await api.deleteCandidate(id);
    loadData();
  };

  const candidatesByJob = candidates.reduce((acc: any, c: any) => {
    if (!acc[c.job_title]) acc[c.job_title] = [];
    acc[c.job_title].push(c);
    return acc;
  }, {});

  const getRiskBadge = (p: number | null) => {
    if (p == null) return null;
    if (p > 0.7) return <span className="badge badge-red">High Risk</span>;
    if (p > 0.4) return <span className="badge badge-yellow">Medium</span>;
    return <span className="badge badge-green">Low</span>;
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',   Icon: LayoutDashboard },
    { id: 'jobs',      label: 'Assessments', Icon: Briefcase },
    { id: 'candidates',label: 'Candidates',  Icon: Users },
    { id: 'logs',      label: 'Audit Logs',  Icon: ScrollText },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '22px 20px', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 4px 12px rgba(5,150,105,0.4)' }}>⬡</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>Mosaic Talent</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Recruiter Portal</div>
            </div>
          </div>
        </div>
        <nav style={{ padding: '14px 12px', flex: 1 }}>
          {navItems.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 3,
              background: tab === id ? 'rgba(5,150,105,0.12)' : 'transparent',
              color: tab === id ? '#10b981' : '#94a3b8', fontSize: 13, fontWeight: tab === id ? 600 : 400,
            }}>
              <Icon size={15} color={tab === id ? '#10b981' : '#64748b'} /> {label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(148,163,184,0.08)' }}>
          <div style={{ fontSize: 11, color: '#475569', marginBottom: 5 }}>Mosaic Wellness</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#10b981' }}>
            <Activity size={12} /> AI Engine Active
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content" style={{ padding: 28, flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 3 }}>
              {tab === 'dashboard' ? 'Overview' : tab === 'jobs' ? 'Assessment Manager' : tab === 'candidates' ? 'Candidate Leaderboard' : 'Audit Logs'}
            </h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={loadData} className="btn-secondary"><RefreshCw size={13} /> Refresh</button>
            <button onClick={() => setShowGenerator(true)} className="btn-primary"><Plus size={15} /> New Assessment</button>
          </div>
        </div>

        {/* ── Dashboard ── */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Active Assessments', val: stats.active,     Icon: Briefcase,    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                { label: 'Total Candidates',   val: stats.candidates, Icon: Users,        color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                { label: 'Average Score',      val: `${stats.avgScore}%`, Icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
              ].map(st => (
                <div key={st.label} className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <st.Icon size={20} color={st.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9' }}>{st.val}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{st.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div className="card" style={{ padding: 22 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={15} color="#10b981" /> Recent Candidates
                </h3>
                {candidates.slice(0, 6).map(c => (
                  <div key={c.id} onClick={() => setSelectedCandidate(c)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(148,163,184,0.06)', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{c.job_title}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {c.score != null && <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(c.score) }}>{c.score}%</span>}
                      <ChevronRight size={13} color="#475569" />
                    </div>
                  </div>
                ))}
                {candidates.length === 0 && <p style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No candidates yet.</p>}
              </div>

              <div className="card" style={{ padding: 22 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={15} color="#10b981" /> Recent Activity
                </h3>
                {logs.slice(0, 7).map((log: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0, background: log.event_type === 'TEST_SUBMITTED' ? '#10b981' : log.event_type === 'CANDIDATE_REGISTERED' ? '#3b82f6' : '#f59e0b' }} />
                    <div>
                      <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                        <span style={{ fontWeight: 500 }}>{log.event_type?.replace(/_/g, ' ')}</span>
                        {log.user_email && <span style={{ color: '#64748b' }}> — {log.user_email}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#475569' }}>{new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && <p style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No activity yet.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── Jobs ── */}
        {tab === 'jobs' && (
          <div>
            {jobs.length === 0 ? (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <Briefcase size={40} color="#334155" />
                <p style={{ color: '#64748b', fontSize: 14, margin: '16px 0 20px' }}>No assessments yet.</p>
                <button onClick={() => setShowGenerator(true)} className="btn-primary"><Plus size={15} /> Create Assessment</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {jobs.map(job => {
                  const jobCands = candidates.filter(c => c.job_title === job.title);
                  const avg = jobCands.filter(c => c.score != null).length
                    ? Math.round(jobCands.filter(c => c.score != null).reduce((a: number, c: any) => a + c.score, 0) / jobCands.filter(c => c.score != null).length)
                    : null;
                  const aid = assessmentMap[job.id];
                  return (
                    <div key={job.id} className="card" style={{ padding: '18px 22px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{job.title}</h3>
                            <span className="badge badge-green">{job.parsed_data?.seniority || 'Mid'}</span>
                            <span className="badge badge-blue">{job.parsed_data?.department || 'General'}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
                            <span>{jobCands.length} candidates</span>
                            {avg != null && <span>Avg: {avg}%</span>}
                            <span>{new Date(job.created_at).toLocaleDateString()}</span>
                          </div>
                          {job.parsed_data?.keySkills?.length > 0 && (
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
                              {job.parsed_data.keySkills.slice(0, 5).map((s: any, i: number) => (
                                <span key={i} className="badge badge-slate" style={{ fontSize: 10 }}>{s.skill}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        {aid && (
                          <button onClick={() => copyLink(aid)} className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px', marginLeft: 14 }}>
                            {copiedId === aid ? <><Check size={13} color="#10b981" /> Copied!</> : <><Copy size={13} /> Copy Link</>}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Candidates ── */}
        {tab === 'candidates' && (
          <div>
            {Object.keys(candidatesByJob).length === 0 ? (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <Users size={40} color="#334155" />
                <p style={{ color: '#64748b', fontSize: 14, marginTop: 16 }}>No candidates have submitted yet.</p>
              </div>
            ) : Object.entries(candidatesByJob).map(([jobTitle, jobCands]: any) => (
              <div key={jobTitle} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Briefcase size={15} color="#059669" />
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>{jobTitle}</h2>
                  <span className="badge badge-slate">{jobCands.length}</span>
                </div>
                <div className="card" style={{ overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                        {['Rank', 'Candidate', 'Score', 'AI Risk', 'Fairness', 'Status', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {jobCands.map((c: any, i: number) => (
                        <tr key={c.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.05)' }}>
                          <td style={{ padding: '13px 14px' }}>
                            <span style={{ width: 26, height: 26, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: i === 0 ? 'rgba(245,158,11,0.15)' : 'rgba(71,85,105,0.2)', color: i === 0 ? '#f59e0b' : '#64748b' }}>{i + 1}</span>
                          </td>
                          <td style={{ padding: '13px 14px' }}>
                            <button onClick={() => setSelectedCandidate(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: '#10b981', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>{c.name}</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>{c.email}</div>
                            </button>
                          </td>
                          <td style={{ padding: '13px 14px' }}>
                            {c.score != null ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 15, fontWeight: 700, color: scoreColor(c.score) }}>{c.score}%</span>
                                <div className="progress-bar" style={{ width: 50 }}>
                                  <div className="progress-fill" style={{ width: `${c.score}%` }} />
                                </div>
                              </div>
                            ) : <span style={{ color: '#475569', fontSize: 12 }}>Pending</span>}
                          </td>
                          <td style={{ padding: '13px 14px' }}>{getRiskBadge(c.ai_probability)}</td>
                          <td style={{ padding: '13px 14px' }}>
                            {c.fairness_score != null ? <span style={{ fontSize: 12, color: '#94a3b8' }}>{Math.round(c.fairness_score * 100)}%</span> : '—'}
                          </td>
                          <td style={{ padding: '13px 14px' }}>
                            <span className={`badge ${c.status === 'completed' ? 'badge-green' : 'badge-yellow'}`}>
                              {c.status === 'completed' ? 'Completed' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '13px 14px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => setSelectedCandidate(c)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }}>
                                <Eye size={11} /> View
                              </button>
                              <button onClick={() => deleteCandidate(c.id)} style={{ padding: '4px 7px', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Trash2 size={11} color="#f87171" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Logs ── */}
        {tab === 'logs' && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                  {['Time', 'Event', 'User', 'Details'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(148,163,184,0.05)' }}>
                    <td style={{ padding: '11px 14px', fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span className={`badge ${log.event_type === 'TEST_SUBMITTED' ? 'badge-green' : log.event_type === 'CANDIDATE_REGISTERED' ? 'badge-blue' : 'badge-slate'}`}>
                        {log.event_type?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#94a3b8' }}>{log.user_email || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#64748b' }}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>No logs yet.</div>}
          </div>
        )}
      </main>

      {showGenerator && <AssessmentGenerator onClose={() => setShowGenerator(false)} onCreated={loadData} />}
      {selectedCandidate && <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />}
    </div>
  );
}
