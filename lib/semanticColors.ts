import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const COLOR_TOKENS = {
  canvas: "canvas",
  surface: "surface",
  surfaceRaised: "surface-raised",
  text: "text",
  textMuted: "text-muted",
  border: "border",
  borderStrong: "border-strong",
  action: "action",
  actionHover: "action-hover",
  actionForeground: "action-foreground",
  origin: "origin",
  originSoft: "origin-soft",
  candidate: "candidate",
  candidateSoft: "candidate-soft",
  balance: "balance",
  balanceSoft: "balance-soft",
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
} as const;

type SemanticColors = { [Key in keyof typeof COLOR_TOKENS]: string };

export function parseSemanticColors(css: string): SemanticColors {
  return Object.fromEntries(
    Object.entries(COLOR_TOKENS).map(([property, token]) => {
      const match = css.match(new RegExp(`(?:^|[;{])\\s*--${token}:\\s*([^;]+);`, "m"));
      if (!match) throw new Error(`app/globals.css에 필수 색상 토큰 --${token}이 없습니다.`);
      return [property, match[1].trim()];
    }),
  ) as SemanticColors;
}

export const semanticColors = parseSemanticColors(
  readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8"),
);
