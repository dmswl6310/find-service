import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseSemanticColors } from "@/lib/semanticColors";

describe("서버 생성 자산의 시맨틱 색상", () => {
  it("globals.css의 승인된 20개 색상 토큰을 단일 원본으로 읽는다", () => {
    const css = readFileSync(resolve("app/globals.css"), "utf8");

    expect(parseSemanticColors(css)).toEqual({
      canvas: "#f3f6f5",
      surface: "#ffffff",
      surfaceRaised: "#fbfdfc",
      text: "#172625",
      textMuted: "#647774",
      border: "#d7e1df",
      borderStrong: "#b9c9c6",
      action: "#173f42",
      actionHover: "#0f3335",
      actionForeground: "#ffffff",
      origin: "#397c8a",
      originSoft: "#e6f0f2",
      candidate: "#b9604b",
      candidateSoft: "#f7ebe7",
      balance: "#95651d",
      balanceSoft: "#f8f1e4",
      success: "#2f6b56",
      warning: "#8a651e",
      danger: "#a44f48",
      info: "#397c8a",
    });
  });

  it("필수 토큰이 빠진 CSS를 조용히 대체하지 않는다", () => {
    expect(() => parseSemanticColors(":root { --canvas: white; }")).toThrow("--surface");
  });
});
