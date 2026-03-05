import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ── Database setup ────────────────────────────────────────────────────────
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'mosaic_talent.db');
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    parsed_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    questions TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    assessment_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    score REAL,
    evaluation TEXT,
    ai_probability REAL,
    fairness_score REAL,
    answers TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    user_email TEXT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

try {
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_cand_email_assess ON candidates(email, assessment_id);`);
} catch (_) { /* already exists */ }

// ── Seed data ─────────────────────────────────────────────────────────────
const jobCount = (db.prepare('SELECT COUNT(*) as c FROM jobs').get() as any).c;
if (jobCount === 0) {
  const jid = 'seed-job-1', aid = 'seed-assess-1';

  db.prepare('INSERT INTO jobs (id, title, description, parsed_data) VALUES (?, ?, ?, ?)').run(
    jid, 'Senior Product Designer',
    'Join Mosaic Wellness as a Senior Product Designer.',
    JSON.stringify({
      roleTitle: 'Senior Product Designer', seniority: 'Senior',
      department: 'Design', domain: 'Wellness Tech',
      keySkills: [
        { skill: 'UI Design', bloomLevel: 'Create' },
        { skill: 'User Research', bloomLevel: 'Analyze' },
        { skill: 'Figma', bloomLevel: 'Applying' },
        { skill: 'Design Systems', bloomLevel: 'Create' },
      ],
      yearsOfExperience: '5+',
      coreResponsibilities: ['Lead design projects', 'Conduct user research', 'Build design systems'],
    })
  );

  db.prepare('INSERT INTO assessments (id, job_id, questions) VALUES (?, ?, ?)').run(
    aid, jid, JSON.stringify([
      { id: 'q1', type: 'mcq', text: 'What is the primary goal of a design system?', options: ['Consistency', 'Speed', 'Cost reduction', 'Developer preference'], correctAnswer: 'Consistency', competency: 'Design Systems' },
      { id: 'q2', type: 'mcq', text: 'Which is a core principle of User-Centered Design?', options: ['Iterative design', 'System-first', 'Developer convenience', 'Marketing priority'], correctAnswer: 'Iterative design', competency: 'UX Principles' },
      { id: 'q3', type: 'mcq', text: 'What does Accessibility in design mean?', options: ['Designing for everyone', 'Fast loading', 'Mobile-only', 'Color selection only'], correctAnswer: 'Designing for everyone', competency: 'Accessibility' },
      { id: 'q4', type: 'mcq', text: 'Most common tool for high-fidelity prototyping?', options: ['Figma', 'Photoshop', 'Dreamweaver', 'MS Paint'], correctAnswer: 'Figma', competency: 'Tools' },
      { id: 'q5', type: 'mcq', text: 'Purpose of a User Persona?', options: ['Representing user needs', 'Fake profiles', 'Marketing avatars', 'Internal roles'], correctAnswer: 'Representing user needs', competency: 'User Research' },
      { id: 'q6', type: 'short', text: 'Explain the difference between UX and UI design.', competency: 'Design Fundamentals' },
      { id: 'q7', type: 'short', text: 'How do you handle conflicting feedback from stakeholders?', competency: 'Communication' },
      { id: 'q8', type: 'short', text: 'Describe your process for conducting a usability test.', competency: 'User Research' },
      { id: 'q9', type: 'short', text: 'How do you measure the success of a design decision?', competency: 'Data-Driven Design' },
      { id: 'q10', type: 'scenario', text: 'A developer says your design is too complex to build. How do you respond?', competency: 'Collaboration' },
      { id: 'q11', type: 'scenario', text: 'Analytics show users drop off at checkout. What are your next steps?', competency: 'Problem Solving' },
    ])
  );

  db.prepare(`INSERT INTO candidates
    (id, name, email, assessment_id, status, score, evaluation, ai_probability, fairness_score, answers)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    'seed-c1', 'Alex Rivera', 'alex@example.com', aid, 'completed', 84,
    JSON.stringify({
      scores: { accuracy: 88, relevance: 85, reasoning: 82, competency: 84, culture: 80 },
      totalScore: 84,
      reasoning: 'Alex demonstrated strong understanding of design principles and user-centric thinking.',
      strengths: ['Strong grasp of design systems', 'Excellent communication of UX concepts', 'Data-driven mindset'],
      weaknesses: ['Could elaborate on technical constraints', 'Accessibility depth could improve', 'Measurement frameworks need refinement'],
      recommendation: 'Advance',
      aiProbability: 0.12, fairnessConfidence: 0.95,
      competencyBreakdown: { 'Design Systems': 90, 'User Research': 85, 'Communication': 80, 'Problem Solving': 82 },
      mosaicFitScore: 88,
      mosaicFitReasoning: 'Alex shows strong alignment with Mosaic Wellness values, particularly Customer Empathy and Data-Driven Decisions.',
    }),
    0.12, 0.95,
    JSON.stringify({
      q1: 'Consistency', q2: 'Iterative design', q3: 'Designing for everyone', q4: 'Figma', q5: 'Representing user needs',
      q6: 'UX focuses on the overall experience and journey while UI deals with visual elements. UX is strategic, UI is tactical.',
      q7: 'I prioritize based on user data and project goals, facilitating alignment meetings when needed.',
      q8: 'I define goals, recruit representative users, prepare scenarios, observe without interfering, then synthesize insights.',
      q9: 'I use task completion rates, time-on-task, error rates, and NPS combined with qualitative feedback.',
      q10: 'I would collaborate to understand constraints then iterate to find solutions maintaining UX quality.',
      q11: 'I would analyze heatmaps and session recordings, conduct user interviews to identify friction points.',
    })
  );

  db.prepare('INSERT INTO logs (event_type, user_email, details) VALUES (?, ?, ?)').run('SYSTEM_INIT', 'system', 'Database seeded successfully');
  console.log('✅ Database seeded with sample data');
}

// ── AI helpers ────────────────────────────────────────────────────────────
function extractJson(text: string): string {
  let c = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const s = c.search(/[\[{]/);
  if (s === -1) throw new Error('No JSON found in AI response');
  c = c.slice(s);
  const e = Math.max(c.lastIndexOf('}'), c.lastIndexOf(']'));
  if (e === -1) throw new Error('Malformed JSON in AI response');
  return c.slice(0, e + 1);
}

async function parseJDAI(jdText: string) {
  const result = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{
      role: 'user', parts: [{ text: `You are an expert HR analyst. Parse this job description and return ONLY valid JSON, no markdown, no explanation.

JD: ${jdText.slice(0, 4000)}

Return exactly this structure:
{"roleTitle":"string","seniority":"Junior|Mid|Senior|Lead|Principal","department":"string","domain":"string","keySkills":[{"skill":"string","bloomLevel":"Remembering|Understanding|Applying|Analyzing|Evaluating|Creating"}],"yearsOfExperience":"string","coreResponsibilities":["string"]}` }]
    }],
  });
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return JSON.parse(extractJson(text));
}

async function generateQuestionsAI(parsedJD: any) {
  const result = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{
      role: 'user', parts: [{ text: `Generate exactly 11 assessment questions for a ${parsedJD.roleTitle} (${parsedJD.seniority}) at a wellness tech company. Return ONLY a JSON array, no markdown.

Skills: ${parsedJD.keySkills?.map((s: any) => s.skill).join(', ')}
Responsibilities: ${parsedJD.coreResponsibilities?.slice(0, 3).join('; ')}
Values to probe: Customer Empathy, Data-Driven Decisions, High Ownership, Wellness-First Mindset

Generate: 5 MCQ (type:"mcq"), 4 short answer (type:"short"), 2 scenario (type:"scenario")

Return ONLY this array:
[{"id":"q1","type":"mcq","text":"...","options":["A","B","C","D"],"correctAnswer":"A","competency":"..."},{"id":"q2","type":"short","text":"...","competency":"..."}]` }]
    }],
  });
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const qs = JSON.parse(extractJson(text));
  return qs.slice(0, 11).map((q: any, i: number) => ({ ...q, id: `q${i + 1}` }));
}

async function evaluateCandidateAI(candidate: any, questions: any[], answers: Record<string, string>, parsedJD: any) {
  const qaPairs = questions.map((q: any) => ({
    q: q.text, type: q.type, correct: q.correctAnswer,
    ans: answers[q.id] || '(no answer)', comp: q.competency,
  }));

  const result = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{
      role: 'user', parts: [{ text: `Evaluate this candidate for ${parsedJD.roleTitle} at Mosaic Wellness. Return ONLY valid JSON, no markdown.

CANDIDATE: ${candidate.name}
SKILLS REQUIRED: ${parsedJD.keySkills?.map((s: any) => s.skill).join(', ')}
MOSAIC VALUES: Customer Empathy, Data-Driven Decisions, High Ownership, Wellness-First Mindset

Q&A:
${qaPairs.map((p: any, i: number) => `Q${i + 1}[${p.comp}](${p.type}): ${p.q}\n${p.correct ? `Correct: ${p.correct}\n` : ''}Answer: ${p.ans}`).join('\n\n')}

Return ONLY this JSON:
{"scores":{"accuracy":0-100,"relevance":0-100,"reasoning":0-100,"competency":0-100,"culture":0-100},"totalScore":0-100,"reasoning":"2-3 sentences","strengths":["s1","s2","s3"],"weaknesses":["w1","w2","w3"],"recommendation":"Advance|Consider|Decline","aiProbability":0.0-1.0,"fairnessConfidence":0.0-1.0,"competencyBreakdown":{"name":0-100},"mosaicFitScore":0-100,"mosaicFitReasoning":"2-3 sentences on Mosaic Wellness culture fit"}` }]
    }],
  });
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return JSON.parse(extractJson(text));
}

// ── Express app ───────────────────────────────────────────────────────────
async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '10mb' }));

  // Health check (Railway uses this)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── AI Routes ────────────────────────────────────────────────────────────
  app.post('/api/ai/parse-jd', async (req, res) => {
    try {
      const { jdText } = req.body;
      if (!jdText?.trim()) return res.status(400).json({ error: 'No JD text provided' });
      const result = await parseJDAI(jdText);
      db.prepare('INSERT INTO logs (event_type, user_email, details) VALUES (?, ?, ?)').run('JD_PARSED', 'recruiter', `Parsed: ${result.roleTitle}`);
      res.json(result);
    } catch (e: any) {
      console.error('Parse JD error:', e.message);
      res.status(500).json({ error: e.message || 'Failed to parse JD' });
    }
  });

  app.post('/api/ai/generate-questions', async (req, res) => {
    try {
      const { parsedJD } = req.body;
      if (!parsedJD) return res.status(400).json({ error: 'No parsed JD provided' });
      const questions = await generateQuestionsAI(parsedJD);
      db.prepare('INSERT INTO logs (event_type, user_email, details) VALUES (?, ?, ?)').run('QUESTIONS_GENERATED', 'recruiter', `Generated ${questions.length} questions for ${parsedJD.roleTitle}`);
      res.json(questions);
    } catch (e: any) {
      console.error('Generate questions error:', e.message);
      res.status(500).json({ error: e.message || 'Failed to generate questions' });
    }
  });

  app.post('/api/evaluate', async (req, res) => {
    try {
      const { candidateId, assessmentId, answers } = req.body;

      const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidateId) as any;
      if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

      const assessment = db.prepare(`
        SELECT a.*, j.parsed_data FROM assessments a
        JOIN jobs j ON a.job_id = j.id WHERE a.id = ?
      `).get(assessmentId) as any;
      if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

      const questions = JSON.parse(assessment.questions);
      const parsedJD = JSON.parse(assessment.parsed_data);

      const evaluation = await evaluateCandidateAI(candidate, questions, answers, parsedJD);
      const score = Math.round(evaluation.totalScore);

      db.transaction(() => {
        db.prepare(`
          UPDATE candidates
          SET status = 'completed', score = ?, evaluation = ?,
              ai_probability = ?, fairness_score = ?, answers = ?
          WHERE id = ?
        `).run(score, JSON.stringify(evaluation), evaluation.aiProbability, evaluation.fairnessConfidence, JSON.stringify(answers), candidateId);

        db.prepare('INSERT INTO logs (event_type, user_email, details) VALUES (?, ?, ?)').run(
          'TEST_SUBMITTED', candidate.email, `Score: ${score}% | ${evaluation.recommendation}`
        );
      })();

      res.json({ success: true, score, evaluation });
    } catch (e: any) {
      console.error('Evaluate error:', e.message);
      res.status(500).json({ error: e.message || 'Evaluation failed' });
    }
  });

  // ── Stats ────────────────────────────────────────────────────────────────
  app.get('/api/stats', (_req, res) => {
    res.json({
      active: (db.prepare('SELECT COUNT(*) as c FROM assessments').get() as any).c,
      candidates: (db.prepare('SELECT COUNT(*) as c FROM candidates').get() as any).c,
      avgScore: Math.round((db.prepare('SELECT AVG(score) as a FROM candidates WHERE score IS NOT NULL').get() as any).a || 0),
      recentActivity: db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 8').all(),
    });
  });

  // ── Jobs ─────────────────────────────────────────────────────────────────
  app.get('/api/jobs', (_req, res) => {
    const jobs = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all() as any[];
    res.json(jobs.map(j => ({ ...j, parsed_data: JSON.parse(j.parsed_data) })));
  });

  app.post('/api/jobs', (req, res) => {
    const { id, title, description, parsed_data } = req.body;
    db.prepare('INSERT OR REPLACE INTO jobs (id, title, description, parsed_data) VALUES (?, ?, ?, ?)').run(
      id, title, description || '', JSON.stringify(parsed_data)
    );
    res.json({ success: true });
  });

  // ── Assessments ──────────────────────────────────────────────────────────
  app.get('/api/assessments/by-job/:jobId', (req, res) => {
    const a = db.prepare('SELECT id FROM assessments WHERE job_id = ? ORDER BY created_at DESC LIMIT 1').get(req.params.jobId);
    res.json(a || null);
  });

  app.get('/api/assessments/:id', (req, res) => {
    const a = db.prepare(`
      SELECT a.*, j.title as job_title, j.parsed_data
      FROM assessments a JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
    `).get(req.params.id) as any;
    if (a) res.json({ ...a, questions: JSON.parse(a.questions), parsed_data: JSON.parse(a.parsed_data) });
    else res.status(404).json({ error: 'Not found' });
  });

  app.post('/api/assessments', (req, res) => {
    const { id, job_id, questions } = req.body;
    db.prepare('INSERT OR REPLACE INTO assessments (id, job_id, questions) VALUES (?, ?, ?)').run(
      id, job_id, JSON.stringify(questions)
    );
    db.prepare('INSERT INTO logs (event_type, user_email, details) VALUES (?, ?, ?)').run('ASSESSMENT_PUBLISHED', 'recruiter', `Published assessment ${id}`);
    res.json({ success: true });
  });

  // ── Candidates ───────────────────────────────────────────────────────────
  app.get('/api/candidates', (_req, res) => {
    const rows = db.prepare(`
      SELECT c.*, j.title as job_title
      FROM candidates c
      JOIN assessments a ON c.assessment_id = a.id
      JOIN jobs j ON a.job_id = j.id
      ORDER BY c.score DESC NULLS LAST, c.created_at DESC
    `).all() as any[];
    res.json(rows.map(c => ({
      ...c,
      evaluation: c.evaluation ? JSON.parse(c.evaluation) : null,
      answers: c.answers ? JSON.parse(c.answers) : null,
    })));
  });

  app.get('/api/candidates/:id', (req, res) => {
    const c = db.prepare(`
      SELECT c.*, j.title as job_title, a.questions, j.parsed_data
      FROM candidates c
      JOIN assessments a ON c.assessment_id = a.id
      JOIN jobs j ON a.job_id = j.id
      WHERE c.id = ?
    `).get(req.params.id) as any;
    if (c) res.json({
      ...c,
      evaluation: c.evaluation ? JSON.parse(c.evaluation) : null,
      answers: c.answers ? JSON.parse(c.answers) : null,
      questions: JSON.parse(c.questions),
    });
    else res.status(404).json({ error: 'Not found' });
  });

  app.post('/api/candidates', (req, res) => {
    const { id, name, email, assessment_id } = req.body;
    try {
      db.prepare('INSERT OR IGNORE INTO candidates (id, name, email, assessment_id) VALUES (?, ?, ?, ?)').run(id, name, email, assessment_id);
      const c = db.prepare('SELECT id FROM candidates WHERE email = ? AND assessment_id = ?').get(email, assessment_id) as any;
      db.prepare('INSERT INTO logs (event_type, user_email, details) VALUES (?, ?, ?)').run('CANDIDATE_REGISTERED', email, `Registered for assessment ${assessment_id}`);
      res.json({ success: true, id: c.id });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to register candidate' });
    }
  });

  app.delete('/api/candidates/:id', (req, res) => {
    db.prepare('DELETE FROM candidates WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // ── Logs ─────────────────────────────────────────────────────────────────
  app.get('/api/logs', (_req, res) => {
    res.json(db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100').all());
  });

  // ── Serve frontend ───────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Mosaic Talent running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Gemini API  : ${GEMINI_API_KEY ? '✓ Connected' : '✗ MISSING KEY!'}`);
    console.log(`   Database    : ${DB_PATH}\n`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
