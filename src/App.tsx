import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from './components/AppLayout.js';
import { HomePage } from './pages/HomePage.js';
import { PrivacyPage, TermsPage, SctPage } from './features/legal/LegalPages.js';
import { SetListPage } from './features/activity-sets/SetListPage.js';
import { SummaryPage } from './features/streak-summary/SummaryPage.js';
import { useRepos, type Repos } from './app/repos.js';

function Loading() {
  return <main aria-busy="true"><p>読み込み中…</p></main>;
}

function SetsRoute({ repos }: { repos: Repos }) {
  const navigate = useNavigate();
  return <SetListPage repo={repos.sets} onOpenSet={(id) => navigate(`/summary/${id}`)} />;
}

function SummaryRoute({ repos }: { repos: Repos }) {
  const { setId } = useParams();
  if (!setId) return <main><p>セットを選んでください。</p></main>;
  return <SummaryPage repo={repos.summary} setId={setId} setName="このセット" />;
}

export function App() {
  const repos = useRepos();
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sets" element={repos ? <SetsRoute repos={repos} /> : <Loading />} />
        <Route path="/summary" element={<main><p>セット一覧から選んでください。</p></main>} />
        <Route path="/summary/:setId" element={repos ? <SummaryRoute repos={repos} /> : <Loading />} />
        <Route path="/legal/privacy" element={<PrivacyPage />} />
        <Route path="/legal/terms" element={<TermsPage />} />
        <Route path="/legal/specified-commercial-transactions" element={<SctPage />} />
        <Route path="*" element={<main><h1>ページが見つかりません</h1></main>} />
      </Routes>
    </AppLayout>
  );
}
