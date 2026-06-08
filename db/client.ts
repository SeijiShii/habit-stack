import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema.js';

export type Database = ReturnType<typeof createDb>;

/**
 * Neon (Postgres) への Drizzle クライアントを生成する。
 * 接続は遅延（クエリ実行時）なので、生成自体は副作用なし。
 *
 * @param url DATABASE_URL（必須）
 */
export function createDb(url: string) {
  if (!url) {
    throw new Error('DATABASE_URL が必要です');
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}
