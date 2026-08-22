import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { imageResponseCalls, ogFontData, readFileSpy } = vi.hoisted(() => ({
  imageResponseCalls: [] as Array<[ReactElement, Record<string, unknown>]>,
  ogFontData: Uint8Array.from([0x4f, 0x54, 0x54, 0x4f, 0x50, 0x72, 0x65, 0x74]),
  readFileSpy: vi.fn(),
}));

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises") & { default?: object }>();
  const readFile = readFileSpy.mockResolvedValue(ogFontData);

  return {
    ...actual,
    default: { ...actual.default, readFile },
    readFile,
  };
});

vi.mock("next/og", () => ({
  ImageResponse: class ImageResponse {
    constructor(element: ReactElement, options: Record<string, unknown>) {
      imageResponseCalls.push([element, options]);
    }
  },
}));

import opengraphImage from "@/app/opengraph-image";
import twitterImage from "@/app/twitter-image";
import { size as appleIconSize } from "@/app/apple-icon";
import manifest from "@/app/manifest";

describe("소셜 메타데이터 이미지", () => {
  beforeEach(() => {
    imageResponseCalls.length = 0;
    readFileSpy.mockClear();
  });

  it("Pretendard 원본 바이너리를 한글 렌더링 글꼴로 임베드한다", async () => {
    await opengraphImage();

    expect(imageResponseCalls).toHaveLength(1);
    const [element, options] = imageResponseCalls[0];
    const fonts = options.fonts as Array<{
      name: string;
      data: ArrayBuffer;
      weight: number;
      style: string;
    }>;

    expect(options).toMatchObject({ width: 1200, height: 630 });
    expect(fonts).toHaveLength(1);
    expect(fonts[0]).toMatchObject({
      name: "Pretendard",
      weight: 400,
      style: "normal",
    });
    expect(readFileSpy).toHaveBeenCalledWith(resolve("app/fonts/Pretendard-Regular.otf"));
    expect(fonts[0].data).toBeInstanceOf(ArrayBuffer);
    expect(Buffer.from(fonts[0].data).equals(Buffer.from(ogFontData))).toBe(true);
    expect(element.props.style).toMatchObject({ fontFamily: "Pretendard" });
    expect(JSON.stringify(element)).not.toContain("sans-serif");
  });

  it("고정 버전의 공식 OTF와 SIL OFL 출처를 보존한다", () => {
    const font = readFileSync(resolve("app/fonts/Pretendard-Regular.otf"));
    const license = readFileSync(resolve("app/fonts/OFL.txt"), "utf8");
    const provenance = readFileSync(resolve("app/fonts/README.md"), "utf8");

    expect(font).toHaveLength(1_574_352);
    expect(createHash("sha256").update(font).digest("hex")).toBe(
      "3ffbacde6ab8411f1d2db54bb9b1f0b3ee2a738932033722cf0388c06aed1c93",
    );
    expect(license).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(provenance).toContain("Pretendard v1.3.9");
    expect(provenance).toContain("3FFBACDE6AB8411F1D2DB54BB9B1F0B3EE2A738932033722CF0388C06AED1C93");
    expect(provenance).toContain(
      "https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/packages/pretendard/dist/public/static/Pretendard-Regular.otf",
    );
  });

  it("Twitter 이미지가 검증된 OG 이미지 생성기를 그대로 재사용한다", () => {
    expect(twitterImage).toBe(opengraphImage);
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
