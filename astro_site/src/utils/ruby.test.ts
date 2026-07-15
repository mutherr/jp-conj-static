import { describe, expect, it } from "vitest";

import { toRuby } from "./ruby";

describe("toRuby", () => {
  it("aligns kanji while preserving shared kana", () => {
    expect(toRuby("食べた", "たべた")).toBe("<ruby>食<rt>た</rt></ruby>べた");
  });

  it("returns matching kana without ruby markup", () => {
    expect(toRuby("たべる", "たべる")).toBe("たべる");
  });

  it("escapes untrusted characters", () => {
    expect(toRuby("<食>", "た")).toContain("&lt;");
    expect(toRuby("<食>", "た")).toContain("&gt;");
  });

  it("splits repeated-kana compounds instead of swallowing a kanji's reading", () => {
    expect(toRuby("引き切る", "ひききる")).toBe(
      "<ruby>引<rt>ひ</rt></ruby>き<ruby>切<rt>き</rt></ruby>る",
    );
  });
});
