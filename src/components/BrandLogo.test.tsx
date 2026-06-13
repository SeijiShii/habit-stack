// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BrandLogo } from "./BrandLogo.js";

describe("BrandLogo", () => {
  it("U1: SVG を描画する", () => {
    const { container } = render(<BrandLogo />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("U2: size 指定で width/height が反映される", () => {
    const { container } = render(<BrandLogo size={32} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("32");
    expect(svg.getAttribute("height")).toBe("32");
  });

  it("U6: 装飾要素として aria-hidden=true を持つ", () => {
    const { container } = render(<BrandLogo />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });
});
