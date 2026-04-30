import { ImageResponse } from "next/og";

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
          background: "linear-gradient(135deg, #F8FAFC 0%, #E0F2FE 48%, #D1FAE5 100%)",
          color: "#0F172A",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -120,
            width: 420,
            height: 420,
            borderRadius: 999,
            background: "rgba(14, 165, 233, 0.22)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -90,
            bottom: -120,
            width: 420,
            height: 420,
            borderRadius: 999,
            background: "rgba(16, 185, 129, 0.24)",
          }}
        />
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
            border: "2px solid rgba(15, 23, 42, 0.08)",
            borderRadius: 44,
            background: "rgba(255, 255, 255, 0.78)",
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
                  background: "#0F766E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 42,
                  fontWeight: 900,
                }}
              >
                M
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1 }}>모두스팟</div>
                <div style={{ fontSize: 20, color: "#0F766E", fontWeight: 700 }}>MODUSPOT</div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                padding: "12px 20px",
                borderRadius: 999,
                background: "#ECFDF5",
                color: "#047857",
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              대중교통 약속 장소 비교
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", fontSize: 72, lineHeight: 1.08, fontWeight: 900, letterSpacing: -3 }}>
              여러 출발지에서 가장 공정한 중간 장소를 찾으세요
            </div>
            <div style={{ display: "flex", fontSize: 30, lineHeight: 1.45, color: "#475569", fontWeight: 600 }}>
              출발지와 목적지 후보를 다대다로 계산해 이동시간, 요금, 경로를 한눈에 비교합니다.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24, fontWeight: 800, color: "#0369A1" }}>
              <span style={{ width: 18, height: 18, borderRadius: 999, background: "#0EA5E9" }} /> 출발지
            </div>
            <div style={{ width: 80, height: 4, borderRadius: 999, background: "#94A3B8" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24, fontWeight: 800, color: "#047857" }}>
              <span style={{ width: 18, height: 18, borderRadius: 999, background: "#10B981" }} /> 목적지 후보
            </div>
            <div style={{ marginLeft: "auto", fontSize: 24, color: "#64748B", fontWeight: 700 }}>moduspot.vercel.app</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
