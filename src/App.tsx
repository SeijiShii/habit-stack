import { useEffect, type ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Routes,
  Route,
  useNavigate,
  useParams,
  useLocation,
  Link,
  Navigate,
} from "react-router-dom";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
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
import { SummaryOverviewPage } from "./features/streak-summary/SummaryOverviewPage.js";
import { AccountPage } from "./features/account/AccountPage.js";
import { purgeAllData } from "./services/auth/selfDelete.js";
import { localDateOf } from "./services/time/localDate.js";
import { asOwnerId } from "./types/domain.js";
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
  // 計時中（進行中）セッションの有無を取得（owner グローバル単一）。
  const inProgress = useQuery({
    queryKey: ["in-progress-session"],
    queryFn: () => repos.execution.findInProgress(),
  });
  const ipSetId = inProgress.data ? String(inProgress.data.setId) : null;
  return (
    <SetListPage
      repo={repos.sets}
      inProgressSetId={ipSetId}
      // 進行中セットを選んだら活動画面（/run）へ戻す。それ以外は通常どおり詳細へ。
      onOpenSet={(id) =>
        navigate(id === ipSetId ? `/run/${id}` : `/sets/${id}`)
      }
    />
  );
}

function SetDetailRoute({ repos }: { repos: Repos }) {
  const navigate = useNavigate();
  return (
    <WithSet repos={repos}>
      {(set) => (
        <>
          <SetEditPage repo={repos.sets} set={set} />
          <nav aria-label="セット操作">
            {/* 中間ページを挟まず、押下で活動画面へ遷移し自動で計時開始する（R20260614-001）。 */}
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                navigate(`/run/${set.id}`, { state: { autoStart: true } })
              }
            >
              開始
            </button>
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
  const { state } = useLocation();
  const autoStart =
    (state as { autoStart?: boolean } | null)?.autoStart === true;
  const items = useQuery({
    queryKey: ["activity-items", setId],
    queryFn: () => repos.sets.listItems(setId),
  });
  // 進行中（owner グローバル単一）セッションの有無 + セット名解決用。
  const inProgress = useQuery({
    queryKey: ["in-progress-session"],
    queryFn: () => repos.execution.findInProgress(),
  });
  const sets = useQuery({
    queryKey: ["activity-sets"],
    queryFn: () => repos.sets.listSets(),
  });
  if (items.isLoading || inProgress.isLoading) return <Loading />;

  // 別のセットが計時中なら二重開始させず、計時中のセットへ誘導する（幽霊セッション根絶、R20260614-001）。
  const ip = inProgress.data;
  if (ip && String(ip.setId) !== setId) {
    const ipName =
      sets.data?.find((s) => s.id === String(ip.setId))?.name ?? "別のセット";
    return (
      <main aria-labelledby="run-busy-title">
        <h1 id="run-busy-title">{setName}</h1>
        <p>「{String(ipName)}」が計時中です。先にそちらを終えてください。</p>
        <Link to={`/run/${ip.setId}`}>計時中のセットへ</Link>
        <Link to="/sets">セット一覧へ</Link>
      </main>
    );
  }

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
  const sessionLocalId = `sess-${setId}-${localDateOf(new Date())}`;
  return (
    <>
      <ExecutionPage
        repo={repos.execution}
        setId={setId}
        setName={setName}
        items={list}
        sessionLocalId={sessionLocalId}
        ownerId={repos.ownerId}
        autoStart={autoStart}
      />
      <nav aria-label="実行後">
        <Link to={`/summary/${setId}`}>継続を見る</Link>
        <Link to="/sets">セット一覧へ</Link>
      </nav>
    </>
  );
}

function SummaryOverviewRoute({ repos }: { repos: Repos }) {
  const navigate = useNavigate();
  return (
    <SummaryOverviewPage
      setsRepo={repos.sets}
      onSelectSet={(id) => navigate(`/summary/${id}`)}
    />
  );
}

function SummaryRoute({ repos }: { repos: Repos }) {
  const navigate = useNavigate();
  return (
    <WithSet repos={repos}>
      {(set) => (
        <SummaryPage
          repo={repos.summary}
          setsRepo={repos.sets}
          setId={set.id}
          setName={set.name}
          onSelectSet={(id) => navigate(`/summary/${id}`)}
        />
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

/**
 * Google OAuth サインインの戻り先（C20260614-002）。Clerk が OAuth コールバックを処理して
 * セッションを確立し /account へ。Clerk キー未設定（keyless/オフライン）では OAuth 自体が
 * 起きないため /account へリダイレクトするだけ（Clerk コンポーネントを描画しない）。
 */
function SsoCallbackRoute() {
  const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!hasClerk) return <Navigate to="/account" replace />;
  return (
    <AuthenticateWithRedirectCallback
      signInForceRedirectUrl="/account"
      signUpForceRedirectUrl="/account"
    />
  );
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
          element={gate((r) => (
            <SummaryOverviewRoute repos={r} />
          ))}
        />
        <Route
          path="/summary/:setId"
          element={gate((r) => (
            <SummaryRoute repos={r} />
          ))}
        />
        <Route
          path="/account"
          element={
            <AccountPage
              onDeleteAllData={
                repos
                  ? () =>
                      purgeAllData({
                        store: repos.store,
                        ownerId: asOwnerId(repos.ownerId),
                      }).then(() => undefined)
                  : undefined
              }
            />
          }
        />
        <Route path="/sso-callback" element={<SsoCallbackRoute />} />
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
