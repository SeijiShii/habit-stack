import { describe, it, expect, vi } from "vitest";
import type { AuthAdapter } from "../../src/services/auth/owner.js";
import type { SyncRepo } from "../../src/services/sync/syncRepo.js";
import type { SyncEnvelope } from "../../src/types/sync.js";
import { makePushHandler } from "./push.js";
import { makePullHandler } from "./pull.js";

const adapter = (owner: string | null): AuthAdapter => ({
  resolveOwnerId: async () => owner,
});

const mockRepo = () =>
  ({
    upsert: vi.fn(async () => {}),
    softDelete: vi.fn(async () => {}),
    changesSince: vi.fn(
      async (): Promise<SyncEnvelope<Record<string, unknown>>[]> => [],
    ),
  }) satisfies SyncRepo;

describe("makePushHandler", () => {
  it("N6: upsert/delete をルーティング、owner はサーバ強制（payload の owner 無視）", async () => {
    const repo = mockRepo();
    const handler = makePushHandler(adapter("real_owner"), repo);
    const body = [
      {
        entity: "activity_set",
        op: "upsert",
        payload: { id: "s1", ownerId: "attacker" },
        clientLocalId: "c1",
        updatedAt: "t",
      },
      {
        entity: "activity_set",
        op: "delete",
        payload: { id: "s2" },
        clientLocalId: "c2",
        updatedAt: "t",
      },
    ];
    const res = await handler(
      new Request("https://app.test/api/sync/push", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ applied: 2 });
    expect(repo.upsert).toHaveBeenCalledWith(
      "activity_set",
      "real_owner",
      expect.objectContaining({ id: "s1" }),
    );
    expect(repo.softDelete).toHaveBeenCalledWith(
      "activity_set",
      "real_owner",
      "s2",
    );
  });

  it("E5: 未認証は 401", async () => {
    const handler = makePushHandler(adapter(null), mockRepo());
    const res = await handler(
      new Request("https://app.test/api/sync/push", {
        method: "POST",
        body: "[]",
      }),
    );
    expect(res.status).toBe(401);
  });
});

describe("makePullHandler", () => {
  it("owner で changesSince を呼び changes を返す", async () => {
    const repo = mockRepo();
    repo.changesSince.mockResolvedValueOnce([
      {
        entity: "activity_set",
        op: "upsert",
        payload: { id: "s1" },
        clientLocalId: "c1",
        updatedAt: "t",
      },
    ]);
    const handler = makePullHandler(adapter("o1"), repo);
    const res = await handler(
      new Request("https://app.test/api/sync/pull?since=2026-06-08T00:00:00Z"),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { changes: unknown[] };
    expect(body.changes).toHaveLength(1);
    expect(repo.changesSince).toHaveBeenCalledWith(
      "o1",
      "2026-06-08T00:00:00Z",
    );
  });
});
