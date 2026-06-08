import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * 想定外例外のフォールバック。Sentry へは PII scrub 済みで送る（SEC-004、本番配線）。
 * 技術詳細は出さず、次の一手を示す（design ボイス）。
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch() {
    // 本番: Sentry.captureException（beforeSend で PII マスク）
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <main role="alert">
            <h1>うまく表示できませんでした</h1>
            <p>少し時間をおいて、もう一度お試しください。記録はローカルに保存されています。</p>
            <button type="button" onClick={() => window.location.reload()}>
              再読み込み
            </button>
          </main>
        )
      );
    }
    return this.props.children;
  }
}
