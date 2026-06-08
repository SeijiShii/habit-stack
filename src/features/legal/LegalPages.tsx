import { PRIVACY, TERMS, SCT } from './content.js';

export function PrivacyPage() {
  return (
    <article aria-labelledby="legal-title">
      <h1 id="legal-title">{PRIVACY.title}</h1>
      <p>最終更新: {PRIVACY.updatedAt}</p>
      {PRIVACY.sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
        </section>
      ))}
    </article>
  );
}

export function TermsPage() {
  return (
    <article aria-labelledby="legal-title">
      <h1 id="legal-title">{TERMS.title}</h1>
      <p>最終更新: {TERMS.updatedAt}</p>
      {TERMS.sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
        </section>
      ))}
    </article>
  );
}

export function SctPage() {
  return (
    <article aria-labelledby="legal-title">
      <h1 id="legal-title">{SCT.title}</h1>
      <p>最終更新: {SCT.updatedAt}</p>
      <dl>
        {SCT.rows.map((r) => (
          <div key={r.label}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
