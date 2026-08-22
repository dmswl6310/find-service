import { describe, expect, it } from "vitest";
import { isDesignLabEnabled } from "@/lib/designLab";

describe("Design Lab 환경 접근 제어", () => {
  it("개발 환경에서만 활성화한다", () => {
    expect(isDesignLabEnabled("development")).toBe(true);
    expect(isDesignLabEnabled("production")).toBe(false);
    expect(isDesignLabEnabled("test")).toBe(false);
  });
});
