import { ImageResponse } from "next/og";
import { semanticColors } from "@/lib/semanticColors";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: semanticColors.canvas,
          color: semanticColors.text,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 82,
            top: 80,
            right: 82,
            bottom: 80,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: `2px solid ${semanticColors.border}`,
            borderRadius: 44,
            background: semanticColors.surface,
            padding: 56,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 74,
                  height: 74,
                  borderRadius: 22,
                  background: semanticColors.action,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: semanticColors.actionForeground,
                  fontSize: 42,
                  fontWeight: 600,
                }}
              >
                M
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: -1 }}>모두스팟</div>
                <div style={{ fontSize: 20, color: semanticColors.action, fontWeight: 600 }}>MODUSPOT</div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                padding: "12px 20px",
                borderRadius: 999,
                background: semanticColors.originSoft,
                color: semanticColors.origin,
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              대중교통 약속 장소 비교
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", fontSize: 72, lineHeight: 1.08, fontWeight: 600, letterSpacing: -3 }}>
              여러 출발지에서 가장 공정한 중간 장소를 찾으세요
            </div>
            <div style={{ display: "flex", fontSize: 30, lineHeight: 1.45, color: semanticColors.textMuted, fontWeight: 600 }}>
              출발지와 목적지 후보를 다대다로 계산해 이동시간, 요금, 경로를 한눈에 비교합니다.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24, fontWeight: 600, color: semanticColors.origin }}>
              <span style={{ width: 18, height: 18, borderRadius: 999, background: semanticColors.origin }} /> 출발지
            </div>
            <div style={{ width: 80, height: 4, borderRadius: 999, background: semanticColors.borderStrong }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24, fontWeight: 600, color: semanticColors.candidate }}>
              <span style={{ width: 18, height: 18, borderRadius: 8, background: semanticColors.candidate }} /> 목적지 후보
            </div>
            <div style={{ marginLeft: "auto", fontSize: 24, color: semanticColors.textMuted, fontWeight: 600 }}>moduspot.vercel.app</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
