import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 48,
            height: 48,
            borderRadius: 16,
            background: "rgba(255,255,255,0.92)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0F766E",
            fontSize: 34,
            fontWeight: 900,
            fontFamily: "sans-serif",
          }}
        >
          M
        </div>
      </div>
    ),
    size
  );
}
