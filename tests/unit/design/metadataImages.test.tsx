import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { size as appleIconSize } from "@/app/apple-icon";
import manifest from "@/app/manifest";

const APP_DIRECTORY = resolve("app");
const SOCIAL_IMAGE_LIMIT = 500 * 1024;
const OPEN_GRAPH_PLATFORM_LIMIT = 8 * 1024 * 1024;
const TWITTER_PLATFORM_LIMIT = 5 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function readPng(fileName: string) {
  const path = resolve(APP_DIRECTORY, fileName);
  expect(existsSync(path), `${fileName} 정적 파일이 있어야 합니다.`).toBe(true);
  const data = readFileSync(path);

  return {
    data,
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
  };
}

describe("소셜 메타데이터 이미지", () => {
  it("동일한 1200x630 정적 PNG를 플랫폼 및 내부 용량 제한 안에서 제공한다", () => {
    const openGraph = readPng("opengraph-image.png");
    const twitter = readPng("twitter-image.png");

    for (const image of [openGraph, twitter]) {
      expect(image.data.subarray(0, PNG_SIGNATURE.length)).toEqual(PNG_SIGNATURE);
      expect(image).toMatchObject({ width: 1200, height: 630 });
      expect(image.data.byteLength).toBeLessThan(SOCIAL_IMAGE_LIMIT);
    }

    expect(openGraph.data.byteLength).toBeLessThan(OPEN_GRAPH_PLATFORM_LIMIT);
    expect(twitter.data.byteLength).toBeLessThan(TWITTER_PLATFORM_LIMIT);
    expect(openGraph.data.equals(twitter.data)).toBe(true);
  });

  it("두 정적 이미지에 한글 대체 텍스트를 제공한다", () => {
    const expectedAlt = "모두스팟 - 여러 출발지와 목적지 후보의 대중교통 소요시간 비교";

    expect(readFileSync(resolve(APP_DIRECTORY, "opengraph-image.alt.txt"), "utf8").trim()).toBe(
      expectedAlt,
    );
    expect(readFileSync(resolve(APP_DIRECTORY, "twitter-image.alt.txt"), "utf8").trim()).toBe(
      expectedAlt,
    );
  });

  it("동적 이미지 경로와 OG 전용 글꼴 없이 파일 기반 메타데이터만 사용한다", () => {
    const removedFiles = [
      "opengraph-image.tsx",
      "twitter-image.tsx",
      "fonts/Pretendard-Regular.otf",
      "fonts/OFL.txt",
      "fonts/README.md",
    ];

    for (const file of removedFiles) {
      expect(existsSync(resolve(APP_DIRECTORY, file)), `${file}은 없어야 합니다.`).toBe(false);
    }

    const layout = readFileSync(resolve(APP_DIRECTORY, "layout.tsx"), "utf8");
    const storyPage = readFileSync(resolve(APP_DIRECTORY, "story/page.tsx"), "utf8");
    expect(layout).not.toContain('url: "/opengraph-image"');
    expect(layout).not.toContain('images: ["/opengraph-image"]');
    expect(storyPage).not.toContain('images: ["/opengraph-image"]');
    expect(layout).not.toContain("Pretendard-Regular.otf");

    const clientFont = readFileSync(resolve(APP_DIRECTORY, "fonts/PretendardVariable.woff2"));
    expect(createHash("sha256").update(clientFont).digest("hex")).toBe(
      "9599f12fd42fc0bce1cd50b47a0c022e108d7aa64dd0d1bb0ed44f3282d900b4",
    );
  });

  it("manifest의 Apple 아이콘 크기가 실제 생성 자산과 일치한다", () => {
    const appleIcon = manifest().icons?.find((icon) =>
      typeof icon === "string" ? false : icon.src === "/apple-icon"
    );

    expect(appleIconSize).toEqual({ width: 64, height: 64 });
    expect(appleIcon).toMatchObject({
      src: "/apple-icon",
      sizes: `${appleIconSize.width}x${appleIconSize.height}`,
      type: "image/png",
    });
  });
});
