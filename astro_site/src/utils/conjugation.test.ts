import { describe, expect, it } from "vitest";

import { conjugate } from "./conjugation";

describe("conjugate", () => {
  it("conjugates ichidan verbs", () => {
    const result = conjugate("食べる", "v1");

    expect(result.negative).toBe("食べない");
    expect(result.past).toBe("食べた");
    expect(result.potential).toBe("食べられる");
    expect(result.causative).toBe("食べさせる");
    expect(result.causativePolite).toBe("食べさせます");
  });

  it("conjugates godan verbs", () => {
    const result = conjugate("書く", "v5k");

    expect(result.negative).toBe("書かない");
    expect(result.past).toBe("書いた");
    expect(result.te).toBe("書いて");
    expect(result.causative).toBe("書かせる");
    expect(result.causativePolite).toBe("書かせます");
  });

  it("handles the iku past and te-form exception", () => {
    const result = conjugate("行く", "v5k-s");

    expect(result.past).toBe("行った");
    expect(result.te).toBe("行って");
  });

  it("conjugates kuru", () => {
    const result = conjugate("来る", "vk");

    expect(result.negative).toBe("こない");
    expect(result.polite).toBe("きます");
    expect(result.imperative).toBe("こい");
    expect(result.causative).toBe("こさせる");
    expect(result.causativePolite).toBe("こさせます");
  });

  it("preserves the stem of suru compounds", () => {
    const result = conjugate("勉強する", "vs");

    expect(result.negative).toBe("勉強しない");
    expect(result.potential).toBe("勉強できる");
    expect(result.volitionalPolite).toBe("勉強しましょう");
    expect(result.causative).toBe("勉強させる");
    expect(result.causativePolite).toBe("勉強させます");
  });

  it("conjugates classical su-verbs tagged as both godan and suru", () => {
    const result = conjugate("供す", "v5 vs");

    expect(result.negative).toBe("供さない");
    expect(result.past).toBe("供した");
    expect(result.te).toBe("供して");
  });
});
