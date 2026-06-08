/**
 * 送信前 PII 除去（SEC-004、法令必須）。メール / 電話 / 位置情報を除去する。
 * feedback 本文・自動コンテキストに混入した個人情報を hub 送信前にマスクする。
 */

const EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// 日本の電話番号（ハイフン有無）と一般的な 10-11 桁
const PHONE = /\b0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}\b/g;
// 緯度経度らしき "35.6812, 139.7671"
const GEO = /\b-?\d{1,3}\.\d{4,},\s*-?\d{1,3}\.\d{4,}\b/g;

export function scrubPii(text: string): string {
  return text
    .replace(EMAIL, '[メール]')
    .replace(GEO, '[位置]')
    .replace(PHONE, '[電話]');
}

/** オブジェクトの文字列値を再帰的に scrub する（自動コンテキスト用）。 */
export function scrubObject<T>(obj: T): T {
  if (typeof obj === 'string') return scrubPii(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map(scrubObject) as unknown as T;
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = scrubObject(v);
    return out as T;
  }
  return obj;
}
