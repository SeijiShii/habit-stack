// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { scrubPii, scrubObject } from "./model/piiScrub.js";
import { FeedbackClient } from "./model/feedbackClient.js";
import { FeedbackWidget } from "./FeedbackWidget.js";
import { handleFeedback } from "../../../api/feedback.js";

const ctx = () => ({
  route: "/summary",
  appVersion: "1.0.0",
  userAgent: "test",
  at: "2026-06-08T00:00:00Z",
});

describe("scrubPii (SEC-004)", () => {
  it("N1: メールをマスク", () => {
    expect(scrubPii("連絡は a@b.com まで")).toContain("[メール]");
    expect(scrubPii("連絡は a@b.com まで")).not.toContain("a@b.com");
  });
  it("N2: 電話/位置をマスク", () => {
    expect(scrubPii("090-1234-5678")).toContain("[電話]");
    expect(scrubPii("現在地 35.6812, 139.7671")).toContain("[位置]");
  });
  it("B2: 複数メールを全てマスク", () => {
    const out = scrubPii("a@x.com と b@y.com");
    expect(out).not.toContain("@x.com");
    expect(out).not.toContain("@y.com");
  });
  it("scrubObject はネストした文字列も scrub", () => {
    const r = scrubObject({
      note: "mail a@b.com",
      nested: { v: "03-1111-2222" },
    });
    expect(JSON.stringify(r)).not.toContain("a@b.com");
    expect(JSON.stringify(r)).toContain("[電話]");
  });
});

describe("FeedbackClient", () => {
  it("N3: context 付与 → scrub → 送信", async () => {
    const fetcher = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response("{}", { status: 202 }),
    );
    const client = new FeedbackClient(ctx, fetcher as unknown as typeof fetch);
    const r = await client.send({
      reaction: "bad",
      message: "バグ。連絡 me@x.com",
    });
    expect(r.ok).toBe(true);
    const sent = JSON.parse(String(fetcher.mock.calls[0]![1]!.body));
    expect(sent.service).toBe("habit-stack");
    expect(sent.message).not.toContain("me@x.com"); // scrub 済み
  });

  it("E1: 送信失敗で degrade（ok:false、例外なし）", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("network");
    });
    const client = new FeedbackClient(ctx, fetcher as unknown as typeof fetch);
    expect((await client.send({ reaction: "good" })).ok).toBe(false);
  });
});

describe("FeedbackWidget (O40)", () => {
  it("N5: 1 タップで開く → 送信 → ありがとう", async () => {
    const fetcher = vi.fn(async () => new Response("{}", { status: 202 }));
    const client = new FeedbackClient(ctx, fetcher as unknown as typeof fetch);
    const user = userEvent.setup();
    render(<FeedbackWidget client={client} />);
    await user.click(
      screen.getByRole("button", { name: "フィードバックを送る" }),
    );
    await user.click(screen.getByRole("button", { name: "送信" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("ありがとう"),
    );
  });
});

describe("handleFeedback (degrade)", () => {
  afterEach(() => {
    delete process.env.HUB_FEEDBACK_ENDPOINT;
  });
  it("E2: hub env 未設定で 202 受理（degrade）", async () => {
    const res = await handleFeedback(
      new Request("https://app.test/api/feedback", {
        method: "POST",
        body: JSON.stringify({ reaction: "good" }),
      }),
    );
    expect(res.status).toBe(202);
  });
});
