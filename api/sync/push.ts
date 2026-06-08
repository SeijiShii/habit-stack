import { withOwner, type AuthAdapter } from '../../src/services/auth/owner.js';
import type { SyncRepo } from '../../src/services/sync/syncRepo.js';
import type { SyncEnvelope } from '../../src/types/sync.js';

/**
 * ローカル変更をサーバへ反映する（withOwner、owner はサーバ強制、SEC-001）。
 * client_local_id ベースで冪等（再送を吸収）。
 */
export function makePushHandler(adapter: AuthAdapter, repo: SyncRepo) {
  return withOwner(adapter, async (req, owner) => {
    const envelopes = (await req.json()) as SyncEnvelope<Record<string, unknown>>[];
    let applied = 0;
    for (const e of envelopes) {
      if (e.op === 'delete') {
        await repo.softDelete(e.entity, owner, String(e.payload.id));
      } else {
        await repo.upsert(e.entity, owner, e.payload);
      }
      applied++;
    }
    return Response.json({ applied, conflicts: 0 });
  });
}
