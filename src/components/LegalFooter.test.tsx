// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalFooter } from "./LegalFooter.js";
import { SHOWCASE_URL } from "../config/showcase.js";

describe("LegalFooter", () => {
  it("U1/U2/U3: 「他のアプリ」リンクが showcase URL を新規タブで指す", () => {
    render(<LegalFooter />);
    const link = screen.getByRole("link", { name: "他のアプリ" });
    expect(link.getAttribute("href")).toBe(SHOWCASE_URL);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("U4: 既存の法務リンク 3 つは従来どおり残る", () => {
    render(<LegalFooter />);
    expect(screen.getByRole("link", { name: "プライバシーポリシー" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "利用規約" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "特定商取引法に基づく表記" }),
    ).toBeTruthy();
  });
});
