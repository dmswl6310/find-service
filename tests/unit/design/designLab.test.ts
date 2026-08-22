import { describe, expect, it } from "vitest";
import { isDesignLabScenario } from "@/app/design-lab/DesignLabClient";
import { isDesignLabEnabled } from "@/lib/designLab";

describe("Design Lab 환경 접근 제어", () => {
  it("개발 환경에서만 활성화한다", () => {
    expect(isDesignLabEnabled("development")).toBe(true);
    expect(isDesignLabEnabled("production")).toBe(false);
    expect(isDesignLabEnabled("test")).toBe(false);
  });

  it("고정 결과 상태 7개만 허용한다", () => {
    expect(["foundation", "empty", "input", "loading", "result", "partial-failure", "total-failure"].every(isDesignLabScenario)).toBe(true);
    expect(isDesignLabScenario("unknown")).toBe(false);
  });
});
