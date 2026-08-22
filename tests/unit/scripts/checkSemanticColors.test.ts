import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  findSemanticColorViolations,
  formatSemanticColorViolation,
} from "@/scripts/check-semantic-colors.mjs";

function matches(source: string, path = "app/example.tsx") {
  return findSemanticColorViolations(path, source).map((violation) => violation.match);
}

describe("시맨틱 색상 검사기", () => {
  it("색상 유틸리티의 모든 Tailwind 팔레트 계열과 흰색·검정색 투명도를 거부한다", () => {
    const source = `
      <div className="bg-slate-50 text-gray-900 border-zinc-200 ring-neutral-400
        from-stone-100 via-red-200 to-orange-300 fill-amber-400 stroke-yellow-500
        outline-lime-600 decoration-green-700 placeholder-emerald-800 caret-teal-900
        accent-cyan-500 divide-sky-300 shadow-blue-500 ring-offset-indigo-100
        hover:bg-violet-400 focus:text-purple-500 inset-shadow-fuchsia-600
        drop-shadow-pink-700 text-shadow-rose-800 bg-white/80 text-black/[.55]" />
    `;

    expect(matches(source)).toEqual([
      "bg-slate-50",
      "text-gray-900",
      "border-zinc-200",
      "ring-neutral-400",
      "from-stone-100",
      "via-red-200",
      "to-orange-300",
      "fill-amber-400",
      "stroke-yellow-500",
      "outline-lime-600",
      "decoration-green-700",
      "placeholder-emerald-800",
      "caret-teal-900",
      "accent-cyan-500",
      "divide-sky-300",
      "shadow-blue-500",
      "ring-offset-indigo-100",
      "bg-violet-400",
      "text-purple-500",
      "inset-shadow-fuchsia-600",
      "drop-shadow-pink-700",
      "text-shadow-rose-800",
      "bg-white/80",
      "text-black/[.55]",
    ]);
  });

  it("직접 색상 arbitrary 유틸리티는 거부하고 arbitrary 길이는 허용한다", () => {
    const source = `
      <div className="bg-[#fff] text-[rgb(12_34_56)] border-[rgba(1,2,3,0.4)]
        ring-[hsl(30_40%_50%)] fill-[#1234] stroke-[hsla(30,40%,50%,.2)]
        from-[#112233] via-[oklch(60%_0.2_30)] to-[white]
        border-l-[3px] text-[14px] bg-[var(--surface)]" />
    `;

    expect(matches(source)).toEqual([
      "bg-[#fff]",
      "text-[rgb(12_34_56)]",
      "border-[rgba(1,2,3,0.4)]",
      "ring-[hsl(30_40%_50%)]",
      "fill-[#1234]",
      "stroke-[hsla(30,40%,50%,.2)]",
      "from-[#112233]",
      "via-[oklch(60%_0.2_30)]",
      "to-[white]",
    ]);
  });

  it("compound arbitrary 값 안의 직접 색상·theme 팔레트·gradient를 거부한다", () => {
    const source = `
      <div className="bg-[linear-gradient(red,blue)] shadow-[0_0_4px_red]
        text-[color:theme(colors.red.500)] border-[color:rebeccapurple]
        ring-[0_0_0_1px_rgb(1_2_3)]
        from-[linear-gradient(var(--origin),var(--candidate))]
        border-l-[3px] shadow-[0_0_4px_var(--border)]
        text-[rgb(var(--text))] bg-[var(--surface)]" />
    `;

    expect(matches(source)).toEqual([
      "bg-[linear-gradient(red,blue)]",
      "shadow-[0_0_4px_red]",
      "text-[color:theme(colors.red.500)]",
      "border-[color:rebeccapurple]",
      "ring-[0_0_0_1px_rgb(1_2_3)]",
      "from-[linear-gradient(var(--origin),var(--candidate))]",
    ]);
  });

  it("정적으로 계산 가능한 문자열 조합의 직접 색상 클래스도 거부한다", () => {
    const source = `
      const named = "bg-" + "red-500";
      const opacity = (\`text-\${"black"}/50\`);
      const nested = \`border-\${\`blue-\${500}\`}\`;
      const dynamic = "fill-" + markerColor;
      const length = "border-l-" + "[3px]";
    `;

    const violations = findSemanticColorViolations("app/example.tsx", source);

    expect(violations.map((violation) => violation.match)).toEqual([
      "bg-red-500",
      "text-black/50",
      "border-blue-500",
    ]);
    expect(formatSemanticColorViolation(violations[0])).toBe("app/example.tsx:2:bg-red-500");
  });

  it("production TS와 TSX의 raw hex·rgb·rgba·hsl·hsla 리터럴을 거부한다", () => {
    const source = `
      const colors = ["#abc", "#abcd", "#aabbcc", "#aabbccdd"];
      const functions = ["rgb(1 2 3)", "rgba(1, 2, 3, .5)", "hsl(10 20% 30%)", "hsla(10, 20%, 30%, .5)"];
    `;

    expect(matches(source)).toEqual([
      "#abc",
      "#abcd",
      "#aabbcc",
      "#aabbccdd",
      "rgb(1 2 3)",
      "rgba(1, 2, 3, .5)",
      "hsl(10 20% 30%)",
      "hsla(10, 20%, 30%, .5)",
    ]);
  });

  it("Kakao 마커 SVG의 정확한 허용값만 marker data URL 경로에서 허용한다", () => {
    const path = resolve("components/map/mapVisuals.ts");
    const source = readFileSync(path, "utf8");

    expect(findSemanticColorViolations(path, source)).toEqual([]);
    expect(matches(`${source}\nconst copiedColor = "#397C8A";`, path)).toEqual(["#397C8A"]);
    expect(matches(source.replace("encodeURIComponent(svg)", "svg"), path)).toEqual([
      "#397C8A",
      "#235965",
      "#B9604B",
      "#843E30",
    ]);
  });

  it("Kakao 팔레트 참조가 실제 fill·stroke 속성에서 벗어나면 예외를 닫는다", () => {
    const path = resolve("components/map/mapVisuals.ts");
    const source = readFileSync(path, "utf8")
      .replaceAll('fill="${palette.fill}"', 'fill="white" data-contract="${palette.fill}"')
      .replaceAll('stroke="${palette.stroke}"', 'stroke="black" data-contract-stroke="${palette.stroke}"');

    expect(matches(source, path)).toEqual([
      "#397C8A",
      "#235965",
      "#B9604B",
      "#843E30",
    ]);
  });

  it("svg 바인딩이 정확한 kind 조건부 빌더 호출이 아니면 예외를 닫는다", () => {
    const path = resolve("components/map/mapVisuals.ts");
    const source = readFileSync(path, "utf8").replace(
      `const svg = kind === "origin"
    ? buildOriginMarker(order, size.width, size.height, opacity)
    : buildCandidateMarker(order, size.width, size.height, opacity);`,
      `const svg = (
    buildOriginMarker(order, size.width, size.height, opacity),
    buildCandidateMarker(order, size.width, size.height, opacity),
    "<svg/>"
  );`,
    );

    expect(matches(source, path)).toEqual([
      "#397C8A",
      "#235965",
      "#B9604B",
      "#843E30",
    ]);
  });

  it("src가 동일 svg 바인딩의 정확한 encoded data URL이 아니면 예외를 닫는다", () => {
    const path = resolve("components/map/mapVisuals.ts");
    const source = readFileSync(path, "utf8").replace(
      'src: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`',
      'src: kind === "origin" ? `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}` : "/marker.svg"',
    );

    expect(matches(source, path)).toEqual([
      "#397C8A",
      "#235965",
      "#B9604B",
      "#843E30",
    ]);
  });

  it("위반을 file:line:match 형식으로 출력한다", () => {
    const [violation] = findSemanticColorViolations("app/example.tsx", "const ok = true;\n<div className=\"bg-red-500\" />");

    expect(formatSemanticColorViolation(violation)).toBe("app/example.tsx:2:bg-red-500");
  });
});
