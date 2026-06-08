export interface Versioned {
  updatedAt: string;
}

/**
 * last-write-wins 競合解決（updated_at 比較）。
 * 新しい方を採用。同値はサーバ採用（決定的、SPEC B1）。
 */
export function resolveConflict<T extends Versioned>(local: T, server: T): T {
  return local.updatedAt > server.updatedAt ? local : server;
}
