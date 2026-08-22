import { ImageResponse } from "next/og";
import { semanticColors } from "@/lib/semanticColors";

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
          background: semanticColors.action,
          borderRadius: 14,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 48,
            height: 48,
            borderRadius: 16,
            background: semanticColors.surfaceRaised,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: semanticColors.action,
            fontSize: 34,
            fontWeight: 600,
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
