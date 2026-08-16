import { describe, it, expect } from "vitest";
import { computeViewportMetrics } from "@/lib/hooks/useVisualViewportHeight";

describe("computeViewportMetrics", () => {
  it("pakai height & offsetTop dari visualViewport kalau tersedia (keyboard tertutup)", () => {
    const result = computeViewportMetrics(
      { height: 800, offsetTop: 0 } as VisualViewport,
      800
    );
    expect(result).toEqual({ height: 800, offsetTop: 0 });
  });

  it("height menyusut & offsetTop bergeser waktu keyboard mobile muncul", () => {
    // Skenario persis kayak bug di screenshot: keyboard buka, visualViewport
    // jadi lebih pendek DAN posisinya (offsetTop) ikut turun sedikit.
    const result = computeViewportMetrics(
      { height: 420, offsetTop: 35 } as VisualViewport,
      800
    );
    expect(result).toEqual({ height: 420, offsetTop: 35 });
  });

  it("fallback ke window.innerHeight & offsetTop 0 kalau visualViewport tidak tersedia (browser lama)", () => {
    const result = computeViewportMetrics(undefined, 812);
    expect(result).toEqual({ height: 812, offsetTop: 0 });
  });

  it("tidak pernah menghasilkan angka negatif walau offsetTop aneh dari browser", () => {
    const result = computeViewportMetrics(
      { height: 400, offsetTop: -5 } as VisualViewport,
      800
    );
    expect(result.offsetTop).toBeGreaterThanOrEqual(0);
  });
});
