import { useState, useEffect } from 'react';
import RecruiterDashboard from './pages/RecruiterDashboard';
import CandidatePage from './pages/CandidatePage';

export default function App() {
  const [view, setView] = useState<'recruiter' | 'candidate'>('recruiter');
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const aid = params.get('assess');
    if (aid) {
      setAssessmentId(aid);
      setView('candidate');
    }
  }, []);

  if (view === 'candidate' && assessmentId) {
    return <CandidatePage assessmentId={assessmentId} />;
  }

  return <RecruiterDashboard />;
}
