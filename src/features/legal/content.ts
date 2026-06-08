/**
 * 法務文書の文面（MVP ドラフト、公開前に法務確認）。
 * 文面を差し替えやすいようデータとして分離。
 */

export const PRIVACY = {
  title: 'プライバシーポリシー',
  updatedAt: '2026-06-08',
  sections: [
    {
      heading: '取得する情報',
      body: 'アカウント連携時の Clerk アカウント情報、Google 連携情報、応援（投げ銭）時の Stripe 決済情報、アプリ内で記録した活動データを取得します。',
    },
    {
      heading: '利用目的',
      body: '記録の保存・同期、継続の可視化、作者への応援の処理のために利用します。',
    },
    {
      heading: '第三者提供（委託先）',
      body: '認証は Clerk、決済は Stripe、エラー監視は Sentry、配信は Vercel に委託します。これら以外の第三者提供は行いません。',
    },
    {
      heading: 'データの確認・削除（重要）',
      // O54 / O12×O22: ゲスト/匿名は運営側で本人特定できないため、窓口削除を約束しない。
      body: '匿名（ゲスト）でご利用の場合、運営側ではお客様を個人として特定できません。そのため、データの確認・削除はアプリ内のセルフサービス機能でご自身で行えます（全データ削除はいつでも実行できます）。Google アカウントを連携された後は、お問い合わせ窓口でも対応します。',
    },
    {
      heading: 'Cookie / アナリティクス',
      body: 'アクセス解析は Vercel Web Analytics（cookieless）を利用し、Cookie による追跡は行いません。',
    },
  ],
} as const;

export const TERMS = {
  title: '利用規約',
  updatedAt: '2026-06-08',
  sections: [
    { heading: '免責', body: '本サービスは現状有姿で提供され、記録の正確性・可用性を保証しません。' },
    { heading: '知的財産', body: 'ユーザーが入力した記録の権利はユーザーに帰属します。' },
    { heading: '禁止行為', body: '不正アクセス、他者のデータへの干渉、法令違反行為を禁止します。' },
    { heading: '解約', body: 'アプリ内の全データ削除によりいつでも利用を終了できます。' },
    { heading: '準拠法・管轄', body: '本規約は日本法に準拠し、紛争は運営者所在地を管轄する裁判所を専属的合意管轄とします。' },
  ],
} as const;

export const SCT = {
  title: '特定商取引法に基づく表記',
  updatedAt: '2026-06-08',
  // 投げ銭（tip-jar）公開時に事業形態確定後、販売者情報を差し替え。
  rows: [
    { label: '販売事業者', value: '（公開前に記載）' },
    { label: '運営責任者', value: '（公開前に記載）' },
    { label: '所在地', value: '請求があれば遅滞なく開示します。' },
    { label: '連絡先', value: '（公開前に記載）' },
    {
      label: '対価・性質',
      value: '「作者を応援」は 100 円の任意の応援（投げ銭）であり、対価性のある商品の販売ではありません。返金は行いません。',
    },
    { label: '支払方法・時期', value: 'クレジットカード（Stripe）、決済時にお支払い。' },
  ],
} as const;

export const LEGAL_ROUTES = {
  privacy: '/legal/privacy',
  terms: '/legal/terms',
  sct: '/legal/specified-commercial-transactions',
} as const;
