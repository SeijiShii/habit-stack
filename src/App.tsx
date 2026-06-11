import { useEffect, type ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Routes,
  Route,
  useNavigate,
  useParams,
  useLocation,
  Link,
} from "react-router-dom";
import { isLoginPath } from "./features/execution/model/recovery.js";
import type { SetRecord } from "./features/activity-sets/model/setsRepo.js";
import { AppLayout } from "./components/AppLayout.js";
import { HomePage } from "./pages/HomePage.js";
import {
  PrivacyPage,
  TermsPage,
  SctPage,
} from "./features/legal/LegalPages.js";
import { SetListPage } from "./features/activity-sets/SetListPage.js";
import { SetEditPage } from "./features/activity-sets/SetEditPage.js";
import { ExecutionPage } from "./features/execution/ExecutionPage.js";
import { SummaryPage } from "./features/streak-summary/SummaryPage.js";
import { AccountPage } from "./features/account/AccountPage.js";
import { useRepos, type Repos } from "./app/repos.js";

function Loading() {
  return (
    <main aria-busy="true">
      <p>読み込み中…</p>
    </main>
  );
}

/** repo から指定セットを読み、子に渡す。 */
function WithSet({
  repos,
  children,
}: {
  repos: Repos;
  children: (set: SetRecord) => ReactElement;
}) {
  const { setId } = useParams();
  const sets = useQuery({
    queryKey: ["activity-sets"],
    queryFn: () => repos.sets.listSets(),
  });
  if (sets.isLoading) return <Loading />;
  const set = sets.data?.find((s) => s.id === setId);
  if (!set)
    return (
      <main>
        <h1>セットが見つかりません</h1>
        <Link to="/sets">セット一覧へ</Link>
      </main>
    );
  return children(set);
}

function SetsRoute({ repos }: { repos: Repos }) {
  const navigate = useNavigate();
  return (
    <SetListPage
      repo={repos.sets}
      onOpenSet={(id) => navigate(`/sets/${id}`)}
    />
  );
}

function SetDetailRoute({ repos }: { repos: Repos }) {
  return (
    <WithSet repos={repos}>
      {(set) => (
        <>
          <SetEditPage repo={repos.sets} set={set} />
          <nav aria-label="セット操作">
            <Link to={`/run/${set.id}`}>実行する</Link>
            <Link to={`/summary/${set.id}`}>継続を見る</Link>
          </nav>
        </>
      )}
    </WithSet>
  );
}

function RunRoute({ repos }: { repos: Repos }) {
  return (
    <WithSet repos={repos}>
      {(set) => <RunInner repos={repos} setId={set.id} setName={set.name} />}
    </WithSet>
  );
}

function RunInner({
  repos,
  setId,
  setName,
}: {
  repos: Repos;
  setId: string;
  setName: string;
}) {
  const items = useQuery({
    queryKey: ["activity-items", setId],
    queryFn: () => repos.sets.listItems(setId),
  });
  if (items.isLoading) return <Loading />;
  const list = (items.data ?? []).map((i) => ({ id: i.id, name: i.name }));
  if (list.length === 0) {
    return (
      <main>
        <h1>{setName}</h1>
        <p>先にアイテムを追加してください。</p>
        <Link to={`/sets/${setId}`}>アイテムを追加</Link>
      </main>
    );
  }
  const sessionLocalId = `sess-${setId}-${new Date().toISOString().slice(0, 10)}`;
  return (
    <>
      <ExecutionPage
        repo={repos.execution}
        setId={setId}
        setName={setName}
        items={list}
        sessionLocalId={sessionLocalId}
        ownerId={repos.ownerId}
      />
      <nav aria-label="実行後">
        <Link to={`/summary/${setId}`}>継続を見る</Link>
        <Link to="/sets">セット一覧へ</Link>
      </nav>
    </>
  );
}

function SummaryRoute({ repos }: { repos: Repos }) {
  return (
    <WithSet repos={repos}>
      {(set) => (
        <SummaryPage repo={repos.summary} setId={set.id} setName={set.name} />
      )}
    </WithSet>
  );
}

/**
 * 計時中にログイン/アカウント画面（/account）へ遷移したら進行中セッションを終了する
 * （UC-EX-LOGIN-END、R20260611-001 論点-001）。ふりかえり/サマリ等への遷移では終了しない。
 * owner 切替はこの画面で起きるため、ログイン前に done 化して owner を跨ぐ進行中セッションを無くす。
 */
function LoginEndGuard({ repos }: { repos: Repos }) {
  const { pathname } = useLocation();
  useEffect(() => {
    if (isLoginPath(pathname)) {
      void repos.execution.endInProgressNow(new Date().toISOString());
    }
  }, [pathname, repos]);
  return null;
}

export function App() {
  const repos = useRepos();
  const gate = (el: (r: Repos) => ReactElement) =>
    repos ? el(repos) : <Loading />;
  return (
    <AppLayout>
      {repos && <LoginEndGuard repos={repos} />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/sets"
          element={gate((r) => (
            <SetsRoute repos={r} />
          ))}
        />
        <Route
          path="/sets/:setId"
          element={gate((r) => (
            <SetDetailRoute repos={r} />
          ))}
        />
        <Route
          path="/run/:setId"
          element={gate((r) => (
            <RunRoute repos={r} />
          ))}
        />
        <Route
          path="/summary"
          element={
            <main>
              <p>セット一覧から選んでください。</p>
            </main>
          }
        />
        <Route
          path="/summary/:setId"
          element={gate((r) => (
            <SummaryRoute repos={r} />
          ))}
        />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/legal/privacy" element={<PrivacyPage />} />
        <Route path="/legal/terms" element={<TermsPage />} />
        <Route
          path="/legal/specified-commercial-transactions"
          element={<SctPage />}
        />
        <Route
          path="*"
          element={
            <main>
              <h1>ページが見つかりません</h1>
            </main>
          }
        />
      </Routes>
    </AppLayout>
  );
}
