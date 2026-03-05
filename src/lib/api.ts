const BASE = '';

export const api = {
  // Health
  health: () => fetch(`${BASE}/api/health`).then(r => r.json()),

  // Stats
  getStats: () => fetch(`${BASE}/api/stats`).then(r => r.json()),

  // Jobs
  getJobs: () => fetch(`${BASE}/api/jobs`).then(r => r.json()),
  createJob: (data: any) => fetch(`${BASE}/api/jobs`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(r => r.json()),

  // Assessments
  getAssessment: (id: string) => fetch(`${BASE}/api/assessments/${id}`).then(r => r.json()),
  getAssessmentByJob: (jobId: string) => fetch(`${BASE}/api/assessments/by-job/${jobId}`).then(r => r.json()),
  createAssessment: (data: any) => fetch(`${BASE}/api/assessments`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(r => r.json()),

  // Candidates
  getCandidates: () => fetch(`${BASE}/api/candidates`).then(r => r.json()),
  getCandidate: (id: string) => fetch(`${BASE}/api/candidates/${id}`).then(r => r.json()),
  createCandidate: (data: any) => fetch(`${BASE}/api/candidates`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(r => r.json()),
  deleteCandidate: (id: string) => fetch(`${BASE}/api/candidates/${id}`, { method: 'DELETE' }).then(r => r.json()),

  // Evaluate (AI scoring on server)
  evaluate: (data: any) => fetch(`${BASE}/api/evaluate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  }).then(r => r.json()),

  // Logs
  getLogs: () => fetch(`${BASE}/api/logs`).then(r => r.json()),

  // AI (server-side)
  parseJD: (jdText: string) => fetch(`${BASE}/api/ai/parse-jd`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jdText }),
  }).then(r => r.json()),
  generateQuestions: (parsedJD: any) => fetch(`${BASE}/api/ai/generate-questions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parsedJD }),
  }).then(r => r.json()),
};
