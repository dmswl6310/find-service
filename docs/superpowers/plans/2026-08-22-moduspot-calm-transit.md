# 모두스팟 Calm Transit 구현 계획

## 사용자 검토용 요약

이 문서를 처음부터 끝까지 모두 읽을 필요는 없다. 아래 다섯 가지만 확인하면 된다.

1. 디자인 방향은 승인된 **Calm Transit · 지도 중심 작업공간**을 유지한다.
2. 계산 공식 `최장 이동시간 + 평균 이동시간`, 공유, 지도 선택, C3/S500 요청 제어는 바꾸지 않는다.
3. 구현 순서는 디자인 토큰 → 공통 UI → 장소 입력 → 결과 비교 → 지도 작업공간 → 전체 페이지 → 시각 회귀 검증이다.
4. 모바일 390px·데스크톱 1440px을 기준으로 만들고 320px 가로 오버플로도 검사한다.
5. 아래 13개 작업은 각각 테스트와 함께 작은 커밋 하나로 완료한다.

상세 코드 예시와 명령은 작업 에이전트가 구현 중 따라야 할 절차다. 사용자는 각 작업의 결과 화면과 커밋 단위만 검토하면 된다.

## 에이전트용 상세 실행 절차

> **작업 에이전트 필수 사항:** 이 계획을 작업별로 구현할 때 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans` 스킬을 사용한다. 진행 상황은 체크박스(`- [ ]`)로 관리한다.

**목표:** 경로 계산, 공정성 판정, 공유, 지도 선택 동작을 그대로 유지하면서 모두스팟 비교 경험을 승인된 Calm Transit 기반의 지도 중심 작업공간으로 재구축한다.

**아키텍처:** Zustand와 기존 검색·대중교통 훅을 애플리케이션 상태 및 데이터 계층으로 유지한다. 시맨틱 디자인 기반과 작은 표현 컴포넌트를 추가하고, 안정적인 결과 뷰 모델을 한 번만 파생한 뒤 단일 `ComparisonWorkspace`에서 데스크톱·모바일 레이아웃을 조립한다. 고정 픽스처 기반의 개발 전용 Design Lab으로 컴포넌트를 검토하고 Playwright 시각 기준 이미지를 관리한다.

**기술 스택:** Next.js 16.2.4 App Router, React 19.2.4, TypeScript, Tailwind CSS 4, Zustand 5, Vitest 3, React Testing Library, Playwright 1.56, react-kakao-maps-sdk.

**기준 명세:** `docs/superpowers/specs/2026-08-22-moduspot-calm-transit-design.md`

## 전역 제약

- Next.js 파일을 수정하기 전에 `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`, `11-css.md`, `13-fonts.md`, `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/not-found.md`를 읽는다.
- `utils/fairness.ts`의 `score = max + avg`와 후보 자격 규칙을 변경하지 않는다.
- `hooks/useTransitMatrix.ts`의 C3/S500 대중교통 요청 스케줄러를 유지한다.
- 후보 장소 자동 탐색, 업체 연동, 예약, 쿠폰, 광고, production 테마 전환 기능을 추가하지 않는다.
- 이번에는 라이트 테마 하나만 제공하되, 추후 테마 추가 시 컴포넌트를 다시 작성하지 않도록 시맨틱 토큰을 구성한다.
- Pretendard Variable을 자체 호스팅하고 제품 UI에서는 굵기 400, 500, 600만 사용한다.
- production 컴포넌트에서 `sky-*`, `emerald-*`, `amber-*`, `red-*` 같은 Tailwind 팔레트 클래스를 사용하지 않는다.
- `황금 밸런스` 명칭은 유지하고 왕관 이모지, 장식용 그라디언트, 장식용 UI 이모지는 제거한다.
- 기준 뷰포트는 데스크톱 1440px, 모바일 390px이며 320px에서도 페이지 수준의 가로 오버플로가 없어야 한다.
- Design Lab은 Kakao·검색·대중교통·그래픽 API를 호출하지 않으며 개발 환경 밖에서는 `notFound()`를 반환해야 한다.
- 모든 작업은 범위가 분명한 커밋 하나로 끝낸다. 인접 작업을 합치지 않고 `.superpowers/`를 커밋하지 않는다.
- 동작을 보호하는 테스트는 해당 동작과 같은 커밋에 포함한다.
- 커밋 전에 항상 `git status --short`를 실행하고 해당 작업에 명시된 파일만 정확히 스테이징한다. `git add app`, `git add components`, `git add .`처럼 범위가 넓은 명령은 사용하지 않는다.

---

## 예정 파일 구조

### 디자인 기반과 공통 UI

- `app/fonts/PretendardVariable.woff2`: 공식 Pretendard v1.3.9 가변 폰트 파일.
- `app/globals.css`: 시맨틱 색상, 간격, 모서리, 그림자, 타이포그래피 토큰.
- `components/ui/Button.tsx`: 버튼 변형과 로딩·비활성 상태.
- `components/ui/IconButton.tsx`: 접근성을 갖춘 아이콘 전용 동작.
- `components/ui/Progress.tsx`: 확정형 계산 진행률.
- `components/ui/InlineNotice.tsx`: 정보·경고·위험 안내.
- `components/ui/BottomSheet.tsx`: 반응형 모바일 시트 표면.

### 도메인 컴포넌트

- `components/location/LocationSearch.tsx`: 접근 가능한 Kakao 장소 콤보박스.
- `components/location/LocationGroup.tsx`: 출발지 또는 후보지 그룹 틀.
- `components/location/PlaceRow.tsx`: 선택된 장소 행.
- `components/result/resultModel.ts`: 후보 요약, 순위, 완전성, 경로 조회.
- `components/result/BalanceSummary.tsx`: 황금 밸런스 설명과 지표.
- `components/result/CandidateRankList.tsx`: 순위가 적용된 후보 요약.
- `components/result/CalculationProgress.tsx`: 계산 상태 표현.
- `components/result/PartialFailureNotice.tsx`: 성공 결과를 유지하는 부분 실패 요약.
- `components/result/RouteMatrix.tsx`: 데스크톱 상세 경로 매트릭스.
- `components/result/RouteDetailSheet.tsx`: 접근 가능한 경로 상세 다이얼로그·시트.
- `components/map/mapVisuals.ts`: 시맨틱 마커·경로 시각 상수.
- `components/map/MapWorkspace.tsx`: 실시간 지도, 범례, 선택 경로 요약, 지도 대체 상태.
- `components/map/StaticMapSurface.tsx`: 결정적으로 렌더링되는 Design Lab 지도 표면.

### 페이지 조립과 개발 도구

- `app/home/LocationPanel.tsx`: 제어형 장소 입력 패널.
- `app/home/ResultPanel.tsx`: 제어형 결과 패널.
- `app/home/ComparisonWorkspace.tsx`: 홈 화면의 단일 오케스트레이터.
- `app/design-lab/page.tsx`: 개발 전용 경로 접근 제어.
- `app/design-lab/DesignLabClient.tsx`: 결정적 시나리오 렌더러.
- `components/design-lab/fixtures.ts`: 고정 장소·경로 결과.
- `components/layout/SiteHeader.tsx`: 한 줄 헤더와 모바일 메뉴.
- `components/layout/SiteFooter.tsx`: 토큰 기반 푸터.

### 테스트와 규칙 강제

- `tests/fixtures/transit.ts`: 타입이 지정된 픽스처 빌더.
- `tests/unit/result/resultModel.test.ts`: 순위·부분 실패 모델 테스트.
- `tests/unit/design/designTokens.test.ts`: 토큰·폰트 연결 계약 테스트.
- `tests/unit/ui/controls.test.tsx`: 버튼·아이콘 버튼 동작 테스트.
- `tests/unit/ui/feedback.test.tsx`: 진행률·안내·바텀시트 동작 테스트.
- `tests/unit/location/locationComponents.test.tsx`: 장소 행·그룹·검색 동작 테스트.
- `tests/unit/result/resultComponents.test.tsx`: 요약·순위·진행률·실패 UI 테스트.
- `tests/unit/result/routePresentation.test.tsx`: 매트릭스 선택·상세 시트 접근성 테스트.
- `tests/unit/map/mapVisuals.test.ts`: 시맨틱 마커 이미지 생성 테스트.
- `tests/unit/design/designLab.test.ts`: Design Lab 환경 접근 제어 테스트.
- `tests/e2e/calm-transit.spec.ts`: 반응형 작업공간 동작 테스트.
- `tests/e2e/design-lab.visual.spec.ts`: 고정 상태 스크린숏 테스트.
- `scripts/check-semantic-colors.mjs`: 직접적인 Tailwind 팔레트 사용 검사기.

---

### 작업 1: 후보 결과 뷰 모델 추가

**파일:**
- 생성: `tests/fixtures/transit.ts`
- 생성: `components/result/resultModel.ts`
- 생성: `tests/unit/result/resultModel.test.ts`
- 참고: `utils/fairness.ts`
- 참고: `types/kakao.ts`
- 참고: `types/odsay.ts`

**인터페이스:**
- 입력·의존: `KakaoLocation[]`, `TransitFetchResult[]`, `getFairestEndId(starts, ends, matrixData)`.
- 제공: `CandidateSummary`, `buildCandidateSummaries(starts, ends, matrixData)`, `findRouteResult(matrixData, fromId, toId)`.

- [ ] **1단계: 픽스처 빌더와 실패하는 결과 모델 테스트 작성**

```ts
// tests/fixtures/transit.ts
import type { KakaoLocation } from "@/types/kakao";
import type { TransitFetchResult } from "@/types/odsay";

export function makeLocation(id: string, name: string): KakaoLocation {
  return {
    id,
    place_name: name,
    address_name: "서울",
    road_address_name: "서울",
    x: "127.0",
    y: "37.5",
  };
}

export function makeRoute(fromId: string, toId: string, timeMn: number): TransitFetchResult {
  return { fromId, toId, timeMn, payment: 1400, pathType: 3, transitCount: 1, subPath: [] };
}

export function makeFailedRoute(fromId: string, toId: string): TransitFetchResult {
  return {
    fromId,
    toId,
    timeMn: -1,
    payment: 0,
    pathType: 0,
    error: true,
    errorMessage: "경로 없음",
  };
}
```

```ts
// tests/unit/result/resultModel.test.ts
import { buildCandidateSummaries, findRouteResult } from "@/components/result/resultModel";
import { makeFailedRoute, makeLocation, makeRoute } from "@/tests/fixtures/transit";

describe("buildCandidateSummaries 후보 요약", () => {
  const starts = [makeLocation("s1", "홍대"), makeLocation("s2", "잠실")];
  const ends = [makeLocation("e1", "을지로"), makeLocation("e2", "성수")];

  it("완전한 후보를 최장 시간과 평균의 합으로 정렬하고 황금 밸런스를 표시한다", () => {
    const matrix = [
      makeRoute("s1", "e1", 30), makeRoute("s2", "e1", 50),
      makeRoute("s1", "e2", 20), makeRoute("s2", "e2", 70),
    ];
    const summaries = buildCandidateSummaries(starts, ends, matrix);

    expect(summaries.map((item) => item.id)).toEqual(["e1", "e2"]);
    expect(summaries[0]).toMatchObject({ averageMinutes: 40, maxMinutes: 50, score: 90, isFairest: true });
  });

  it("성공한 셀을 숨기지 않으면서 불완전한 후보를 완전한 후보 뒤에 둔다", () => {
    const matrix = [
      makeRoute("s1", "e1", 30), makeRoute("s2", "e1", 50),
      makeRoute("s1", "e2", 20), makeFailedRoute("s2", "e2"),
    ];
    const summaries = buildCandidateSummaries(starts, ends, matrix);

    expect(summaries[1]).toMatchObject({ id: "e2", isComplete: false, validRoutes: 1, totalRoutes: 2 });
    expect(findRouteResult(matrix, "s1", "e2")?.timeMn).toBe(20);
  });
});
```

- [ ] **2단계: 집중 테스트를 실행해 실패 확인**

실행: `npm run test:unit -- tests/unit/result/resultModel.test.ts`

예상 결과: `@/components/result/resultModel`이 없으므로 실패한다.

- [ ] **3단계: 결과 뷰 모델 구현**

```ts
// components/result/resultModel.ts
import type { KakaoLocation } from "@/types/kakao";
import type { TransitFetchResult } from "@/types/odsay";
import { getFairestEndId } from "@/utils/fairness";

export type CandidateSummary = {
  id: string;
  name: string;
  averageMinutes: number | null;
  maxMinutes: number | null;
  score: number | null;
  isComplete: boolean;
  isFairest: boolean;
  validRoutes: number;
  totalRoutes: number;
  originalIndex: number;
};

export function findRouteResult(matrixData: TransitFetchResult[], fromId: string, toId: string) {
  return matrixData.find((result) => result.fromId === fromId && result.toId === toId);
}

export function buildCandidateSummaries(
  starts: KakaoLocation[],
  ends: KakaoLocation[],
  matrixData: TransitFetchResult[]
): CandidateSummary[] {
  const fairestEndId = getFairestEndId(starts, ends, matrixData);
  return ends
    .map((end, originalIndex) => {
      const results = starts
        .map((start) => findRouteResult(matrixData, start.id, end.id))
        .filter((result): result is TransitFetchResult => Boolean(result));
      const valid = results.filter((result) => !result.error && result.timeMn >= 0);
      const isComplete = starts.length > 0 && valid.length === starts.length;
      const times = valid.map((result) => result.timeMn);
      const averageMinutes = isComplete ? times.reduce((sum, time) => sum + time, 0) / times.length : null;
      const maxMinutes = isComplete ? Math.max(...times) : null;
      return {
        id: end.id,
        name: end.place_name,
        averageMinutes,
        maxMinutes,
        score: averageMinutes !== null && maxMinutes !== null ? averageMinutes + maxMinutes : null,
        isComplete,
        isFairest: end.id === fairestEndId,
        validRoutes: valid.length,
        totalRoutes: starts.length,
        originalIndex,
      };
    })
    .sort((left, right) => {
      if (left.score === null && right.score === null) return left.originalIndex - right.originalIndex;
      if (left.score === null) return 1;
      if (right.score === null) return -1;
      return left.score - right.score || left.originalIndex - right.originalIndex;
    });
}
```

- [ ] **4단계: 결과 모델과 공정성 인접 테스트 실행**

실행: `npm run test:unit -- tests/unit/result/resultModel.test.ts tests/unit/home/useSelectedRouteMapState.test.tsx`

예상 결과: `utils/fairness.ts`를 변경하지 않은 상태로 통과한다.

- [ ] **5단계: 뷰 모델 커밋**

```bash
git add tests/fixtures/transit.ts components/result/resultModel.ts tests/unit/result/resultModel.test.ts
git commit -m "refactor: 후보 결과 뷰 모델 추가"
```

---

### 작업 2: Calm Transit 폰트와 시맨틱 토큰 설치

**파일:**
- 생성: `app/fonts/PretendardVariable.woff2`
- 생성: `tests/unit/design/designTokens.test.ts`
- 수정: `app/layout.tsx`
- 수정: `app/globals.css`

**인터페이스:**
- 입력·의존: 공식 Pretendard v1.3.9 WOFF2 파일.
- 제공: CSS 변수와 Tailwind 테마 이름 `canvas`, `surface`, `surface-raised`, `text`, `text-muted`, `border`, `border-strong`, `action`, `action-hover`, `action-foreground`, `origin`, `origin-soft`, `candidate`, `candidate-soft`, `balance`, `balance-soft`, `success`, `warning`, `danger`, `info`.

- [ ] **1단계: 실패하는 토큰·폰트 계약 테스트 작성**

```ts
// tests/unit/design/designTokens.test.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Calm Transit 디자인 기반", () => {
  it("필수 시맨틱 토큰을 모두 정의한다", () => {
    const css = readFileSync(resolve("app/globals.css"), "utf8");
    for (const token of [
      "--canvas", "--surface", "--surface-raised", "--text", "--text-muted",
      "--border", "--border-strong", "--action", "--action-hover", "--action-foreground",
      "--origin", "--origin-soft", "--candidate", "--candidate-soft",
      "--balance", "--balance-soft", "--success", "--warning", "--danger", "--info",
    ]) expect(css).toContain(token);
  });

  it("next/font/local로 Pretendard를 연결한다", () => {
    const layout = readFileSync(resolve("app/layout.tsx"), "utf8");
    expect(layout).toContain('from "next/font/local"');
    expect(layout).toContain("--font-pretendard");
    expect(layout).not.toContain('from "next/font/google"');
  });
});
```

- [ ] **2단계: 계약 테스트를 실행해 실패 확인**

실행: `npm run test:unit -- tests/unit/design/designTokens.test.ts`

예상 결과: 새 시맨틱 토큰과 로컬 폰트 연결이 없으므로 실패한다.

- [ ] **3단계: 공식 폰트 파일과 로컬 폰트 연결 추가**

PowerShell에서 실행:

```powershell
New-Item -ItemType Directory -Force -Path app/fonts
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2" -OutFile "app/fonts/PretendardVariable.woff2"
```

Next.js 문서에 정의된 로컬 폰트 계약을 사용한다.

```tsx
// app/layout.tsx
import localFont from "next/font/local";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});
```

`<html>` 클래스는 `${pretendard.variable} h-full antialiased`로 설정한다.

- [ ] **4단계: 전역 토큰 블록 교체**

```css
:root {
  --canvas: #f3f6f5;
  --surface: #ffffff;
  --surface-raised: #fbfdfc;
  --text: #172625;
  --text-muted: #647774;
  --border: #d7e1df;
  --border-strong: #b9c9c6;
  --action: #173f42;
  --action-hover: #0f3335;
  --action-foreground: #ffffff;
  --origin: #397c8a;
  --origin-soft: #e6f0f2;
  --candidate: #b9604b;
  --candidate-soft: #f7ebe7;
  --balance: #95651d;
  --balance-soft: #f8f1e4;
  --success: #2f6b56;
  --warning: #8a651e;
  --danger: #a44f48;
  --info: #397c8a;
}

@theme inline {
  --color-canvas: var(--canvas);
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-text: var(--text);
  --color-text-muted: var(--text-muted);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-action: var(--action);
  --color-action-hover: var(--action-hover);
  --color-action-foreground: var(--action-foreground);
  --color-origin: var(--origin);
  --color-origin-soft: var(--origin-soft);
  --color-candidate: var(--candidate);
  --color-candidate-soft: var(--candidate-soft);
  --color-balance: var(--balance);
  --color-balance-soft: var(--balance-soft);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);
  --color-info: var(--info);
  --font-sans: var(--font-pretendard), ui-sans-serif, system-ui, sans-serif;
}
```

호환 별칭 `background`, `foreground`, `primary`는 작업 13에서 마지막 사용처를 제거할 때까지만 유지한다. 승인된 릴리스는 라이트 테마 전용이므로 기존 자동 다크 모드 미디어 쿼리는 유지하지 않는다.

- [ ] **5단계: 디자인 기반 검증 및 커밋**

실행: `npm run test:unit -- tests/unit/design/designTokens.test.ts`

실행: `npm run lint`

예상 결과: 두 명령 모두 종료 코드 0을 반환한다.

```bash
git add app/fonts/PretendardVariable.woff2 app/layout.tsx app/globals.css tests/unit/design/designTokens.test.ts
git commit -m "feat: 디자인 토큰 추가"
```

---

### 작업 3: Button·IconButton 기본 컴포넌트 추가

**파일:**
- 생성: `components/ui/Button.tsx`
- 생성: `components/ui/IconButton.tsx`
- 생성: `tests/unit/ui/controls.test.tsx`

**인터페이스:**
- 제공: `variant: "primary" | "secondary" | "ghost" | "danger"`, `size: "sm" | "md"`, `isLoading?: boolean`을 갖는 `ButtonProps`.
- 제공: `aria-label`을 필수로 요구하고 danger를 제외한 같은 시각 변형을 지원하는 `IconButtonProps`.

- [ ] **1단계: 실패하는 컨트롤 테스트 작성**

```tsx
import { render, screen } from "@testing-library/react";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";

describe("UI 컨트롤", () => {
  it("로딩 중인 주요 버튼의 상태를 알리고 비활성화한다", () => {
    render(<Button isLoading>9개 경로 비교하기</Button>);
    expect(screen.getByRole("button", { name: "9개 경로 비교하기" })).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });

  it("아이콘 버튼 호출부에 접근 가능한 이름을 요구한다", () => {
    render(<IconButton aria-label="장소 제거">×</IconButton>);
    expect(screen.getByRole("button", { name: "장소 제거" })).toBeVisible();
  });
});
```

- [ ] **2단계: 테스트를 실행해 실패 확인**

실행: `npm run test:unit -- tests/unit/ui/controls.test.tsx`

예상 결과: 두 모듈이 없으므로 실패한다.

- [ ] **3단계: 시맨틱 클래스로 두 기본 컴포넌트 구현**

```tsx
// components/ui/Button.tsx
import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  isLoading?: boolean;
};

const variantClasses = {
  primary: "bg-action text-action-foreground hover:bg-action-hover",
  secondary: "border border-border-strong bg-surface text-text hover:bg-canvas",
  ghost: "bg-transparent text-text-muted hover:bg-canvas hover:text-text",
  danger: "bg-danger text-white hover:opacity-90",
};

export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const sizeClass = size === "sm" ? "min-h-9 px-3 text-sm" : "min-h-11 px-4 text-sm";
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 ${sizeClass} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
```

`IconButton`은 `md` 크기에서 동일한 포커스·비활성 동작을 44px 정사각형에 적용하고 모든 네이티브 버튼 속성을 전달한다.

- [ ] **4단계: 컨트롤 검증 및 커밋**

실행: `npm run test:unit -- tests/unit/ui/controls.test.tsx`

실행: `npm run lint`

예상 결과: 두 명령 모두 종료 코드 0을 반환한다.

```bash
git add components/ui/Button.tsx components/ui/IconButton.tsx tests/unit/ui/controls.test.tsx
git commit -m "feat: 시맨틱 버튼 컨트롤 추가"
```

---

### 작업 4: 피드백·바텀시트 기본 컴포넌트 추가

**파일:**
- 생성: `components/ui/Progress.tsx`
- 생성: `components/ui/InlineNotice.tsx`
- 생성: `components/ui/BottomSheet.tsx`
- 생성: `tests/unit/ui/feedback.test.tsx`

**인터페이스:**
- 제공: `Progress({ value, max, label })`.
- 제공: tone이 `info | warning | danger`인 `InlineNotice({ tone, title, children })`.
- 제공: 눈에 보이는 모바일 그랩 핸들과 시맨틱 섹션 레이블을 갖는 `BottomSheet({ title, children, className })`.

- [ ] **1단계: 실패하는 피드백 테스트 작성**

```tsx
import { render, screen } from "@testing-library/react";
import Progress from "@/components/ui/Progress";
import InlineNotice from "@/components/ui/InlineNotice";
import BottomSheet from "@/components/ui/BottomSheet";

it("확정형 진행률을 알린다", () => {
  render(<Progress value={6} max={9} label="경로 계산" />);
  expect(screen.getByRole("progressbar", { name: "경로 계산" })).toHaveAttribute("aria-valuenow", "6");
});

it("이름이 있는 피드백·시트 영역을 렌더링한다", () => {
  render(<><InlineNotice tone="danger" title="일부 경로 실패">성공 결과는 유지됩니다.</InlineNotice><BottomSheet title="비교 결과">결과</BottomSheet></>);
  expect(screen.getByRole("alert")).toHaveTextContent("성공 결과는 유지됩니다.");
  expect(screen.getByRole("region", { name: "비교 결과" })).toBeVisible();
});
```

- [ ] **2단계: 테스트를 실행해 실패 확인**

실행: `npm run test:unit -- tests/unit/ui/feedback.test.tsx`

예상 결과: 피드백 모듈이 없으므로 실패한다.

- [ ] **3단계: 정확한 시맨틱 동작 구현**

`Progress`는 `Math.min(100, Math.max(0, (value / Math.max(max, 1)) * 100))`을 계산하고 중립 트랙 하나와 `bg-action` 막대 하나를 렌더링하며 `aria-valuemin`, `aria-valuemax`, `aria-valuenow`를 제공한다.

`InlineNotice`는 `danger`에서만 `role="alert"`를 사용하고 `info`와 `warning`에는 `role="status"`를 사용한다. 색상만으로 구분하지 않고 각 tone에 눈에 보이는 제목과 왼쪽 테두리를 함께 제공한다.

`BottomSheet`는 다음과 같이 렌더링한다.

```tsx
<section role="region" aria-label={title} className={`rounded-t-xl border-t border-border bg-surface shadow-[0_-12px_34px_rgba(23,38,37,0.12)] ${className}`}>
  <span aria-hidden="true" className="mx-auto mt-2 block h-1 w-8 rounded-full bg-border-strong" />
  {children}
</section>
```

- [ ] **4단계: 피드백 기본 컴포넌트 검증 및 커밋**

실행: `npm run test:unit -- tests/unit/ui/feedback.test.tsx`

실행: `npm run lint`

예상 결과: 두 명령 모두 종료 코드 0을 반환한다.

```bash
git add components/ui/Progress.tsx components/ui/InlineNotice.tsx components/ui/BottomSheet.tsx tests/unit/ui/feedback.test.tsx
git commit -m "feat: 피드백과 바텀시트 기본 컴포넌트 추가"
```

---

### 작업 5: 개발 전용 Design Lab 기반 구축

**파일:**
- 생성: `lib/designLab.ts`
- 생성: `app/design-lab/page.tsx`
- 생성: `app/design-lab/DesignLabClient.tsx`
- 생성: `components/design-lab/fixtures.ts`
- 생성: `tests/unit/design/designLab.test.ts`
- 테스트 추가: `tests/e2e/calm-transit.spec.ts`

**인터페이스:**
- 제공: `isDesignLabEnabled(nodeEnv: string | undefined): boolean`.
- 제공: `NODE_ENV === "development"`일 때만 접근 가능한 `/design-lab?scenario=foundation`.

- [ ] **1단계: 실패하는 환경 접근 제어·경로 테스트 작성**

```ts
// tests/unit/design/designLab.test.ts
import { isDesignLabEnabled } from "@/lib/designLab";

expect(isDesignLabEnabled("development")).toBe(true);
expect(isDesignLabEnabled("production")).toBe(false);
expect(isDesignLabEnabled("test")).toBe(false);
```

```ts
// tests/e2e/calm-transit.spec.ts에 추가
import { expect, test } from "@playwright/test";

test("개발 환경 Design Lab이 고정 기반 컨트롤을 렌더링한다", async ({ page }) => {
  await page.goto("/design-lab?scenario=foundation");
  await expect(page.getByRole("heading", { name: "Design Lab" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Primary action" })).toBeVisible();
});
```

- [ ] **2단계: 두 테스트를 실행해 실패 확인**

실행: `npm run test:unit -- tests/unit/design/designLab.test.ts`

실행: `npm run test:e2e -- tests/e2e/calm-transit.spec.ts`

예상 결과: 단위 테스트는 import 오류로 실패하고 E2E는 404를 확인한다.

- [ ] **3단계: 환경 접근 제어와 경로 구현**

```ts
// lib/designLab.ts
export function isDesignLabEnabled(nodeEnv: string | undefined) {
  return nodeEnv === "development";
}
```

```tsx
// app/design-lab/page.tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import DesignLabClient from "./DesignLabClient";
import { isDesignLabEnabled } from "@/lib/designLab";

export default function DesignLabPage() {
  if (!isDesignLabEnabled(process.env.NODE_ENV)) notFound();
  return <Suspense fallback={null}><DesignLabClient /></Suspense>;
}
```

`DesignLabClient`는 `useSearchParams()`로 `scenario`를 읽는다. 이 작업에서는 `foundation`만 허용하고 승인된 토큰, 두 컨트롤 기본 컴포넌트, Progress, InlineNotice, BottomSheet를 고정 문구와 함께 렌더링한다. `fixtures.ts`는 작업 1의 픽스처 빌더를 이용해 출발지 3개, 후보지 3개, 성공 경로 9개, 부분 실패 매트릭스 1개를 내보낸다.

- [ ] **4단계: Design Lab 기반 검증 및 커밋**

실행: `npm run test:unit -- tests/unit/design/designLab.test.ts`

실행: `npm run test:e2e -- tests/e2e/calm-transit.spec.ts`

예상 결과: 두 명령 모두 통과한다.

```bash
git add lib/designLab.ts app/design-lab/page.tsx app/design-lab/DesignLabClient.tsx components/design-lab/fixtures.ts tests/unit/design/designLab.test.ts tests/e2e/calm-transit.spec.ts
git commit -m "feat: 개발 전용 디자인 랩 추가"
```

---

### 작업 6: 장소 검색·선택 컴포넌트 구축

**파일:**
- 생성: `components/location/LocationSearch.tsx`
- 생성: `components/location/LocationGroup.tsx`
- 생성: `components/location/PlaceRow.tsx`
- 생성: `app/home/LocationPanel.tsx`
- 생성: `tests/unit/location/locationComponents.test.tsx`
- 수정: `components/search/LocationInput.tsx`
- 수정: `app/design-lab/DesignLabClient.tsx`

**인터페이스:**
- `LocationSearchProps`: `label`, `placeholder`, `helperText?`, `onSelect(KakaoLocation)`.
- `PlaceRowProps`: `location`, `kind: "origin" | "candidate"`, `index`, `selected?`, `onSelect()`, `onRemove()`.
- `LocationGroupProps`: `kind`, `title`, `locations`, `onSelectLocation(id)`, `onRemove(id)`, `onAdd(KakaoLocation)`.
- `LocationPanelProps`: 제어형 출발지·후보지 배열과 추가·제거·선택 콜백. store를 직접 import하지 않는다.

- [ ] **1단계: 실패하는 컴포넌트 테스트 작성**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import LocationGroup from "@/components/location/LocationGroup";
import PlaceRow from "@/components/location/PlaceRow";
import { makeLocation } from "@/tests/fixtures/transit";

it("출발지에는 숫자, 후보지에는 문자를 사용한다", () => {
  render(<><PlaceRow location={makeLocation("s1", "홍대")} kind="origin" index={0} onSelect={() => undefined} onRemove={() => undefined} /><PlaceRow location={makeLocation("e1", "성수")} kind="candidate" index={0} onSelect={() => undefined} onRemove={() => undefined} /></>);
  expect(screen.getByText("1")).toBeVisible();
  expect(screen.getByText("A")).toBeVisible();
});

it("이름이 있는 추가·제거 동작을 제공한다", () => {
  const onRemove = vi.fn();
  render(<LocationGroup kind="origin" title="출발지" locations={[makeLocation("s1", "홍대")]} onSelectLocation={() => undefined} onRemove={onRemove} onAdd={() => undefined} />);
  fireEvent.click(screen.getByRole("button", { name: "홍대 제거" }));
  expect(onRemove).toHaveBeenCalledWith("s1");
});
```

- [ ] **2단계: 테스트를 실행해 실패 확인**

실행: `npm run test:unit -- tests/unit/location/locationComponents.test.tsx`

예상 결과: 장소 모듈이 없으므로 실패한다.

- [ ] **3단계: 컴포넌트와 호환 어댑터 구현**

기존 `components/search/LocationInput.tsx`의 콤보박스 키보드 동작을 `LocationSearch.tsx`로 옮긴다. `role="combobox"`, `aria-controls`, `aria-activedescendant`, 위·아래 화살표, Enter, Escape, 결과 없음 문구, 인라인 오류 문구를 유지한다. 직접 팔레트 클래스는 시맨틱 토큰으로 교체한다.

`PlaceRow`는 출발지에 원형 `bg-origin` 인덱스, 후보지에 둥근 사각형 `bg-candidate` 인덱스를 사용한다. 주소, 행 전체 선택 버튼, 별도의 `IconButton aria-label={`${location.place_name} 제거`}`를 렌더링한다.

작업 10까지 기존 import가 동작하도록 유지한다.

```tsx
// components/search/LocationInput.tsx
export { default } from "@/components/location/LocationSearch";
export type { LocationSearchProps as LocationInputProps } from "@/components/location/LocationSearch";
```

`LocationPanel`은 `TimeFilter`, 두 `LocationGroup`, `ShareButton`을 렌더링한다. 두 배열이 비어 있지 않으면 주요 동작의 표시 이름은 `${starts.length * ends.length}개 경로 비교하기`가 된다.

- [ ] **4단계: Design Lab에 장소 예시 추가 후 검증**

`foundation`에 비어 있음, 1개, 3개, 선택됨, 검색 중, 검색 결과 없음, 검색 오류 표현을 추가한다. 고정 픽스처 배열을 사용하고 로딩·오류 예시에서 `useLocationSearch`를 호출하지 않는다.

실행: `npm run test:unit -- tests/unit/location/locationComponents.test.tsx tests/unit/hooks/useLocationSearch.test.tsx`

실행: `npm run test:e2e -- tests/e2e/calm-transit.spec.ts`

예상 결과: 모든 테스트가 통과한다.

- [ ] **5단계: 장소 도메인 UI 커밋**

```bash
git add components/location/LocationSearch.tsx components/location/LocationGroup.tsx components/location/PlaceRow.tsx app/home/LocationPanel.tsx components/search/LocationInput.tsx app/design-lab/DesignLabClient.tsx tests/unit/location/locationComponents.test.tsx
git commit -m "feat: 장소 입력 사용자 인터페이스 추가"
```

---

### 작업 7: 결과 요약·계산 컴포넌트 구축

**파일:**
- 생성: `components/result/BalanceSummary.tsx`
- 생성: `components/result/CandidateRankList.tsx`
- 생성: `components/result/CalculationProgress.tsx`
- 생성: `components/result/PartialFailureNotice.tsx`
- 생성: `app/home/ResultPanel.tsx`
- 생성: `tests/unit/result/resultComponents.test.tsx`
- 수정: `app/design-lab/DesignLabClient.tsx`

**인터페이스:**
- 입력·의존: 작업 1의 `CandidateSummary[]`, `hooks/useTransitMatrix.ts`의 `CalculationProgress`.
- `ResultPanelProps`: `summaries`, `matrixData`, `calculationProgress`, `isCalculating`, `error`, `onEditInputs`, `onRetry`, `onSelectCandidate`, `onOpenMatrix`.

- [ ] **1단계: 실패하는 요약·부분 실패 테스트 작성**

```tsx
import { render, screen } from "@testing-library/react";
import BalanceSummary from "@/components/result/BalanceSummary";
import CalculationProgress from "@/components/result/CalculationProgress";
import PartialFailureNotice from "@/components/result/PartialFailureNotice";
import ResultPanel from "@/app/home/ResultPanel";
import { makeFailedRoute } from "@/tests/fixtures/transit";

it("왕관 없이 평균·최장 시간을 표시한다", () => {
  render(<BalanceSummary name="을지로3가" averageMinutes={43} maxMinutes={58} />);
  expect(screen.getByText("황금 밸런스")).toBeVisible();
  expect(screen.getByText("43분")).toBeVisible();
  expect(screen.getByText("58분")).toBeVisible();
  expect(screen.queryByText(/👑/)).not.toBeInTheDocument();
});

it("유지되는 부분 결과와 정확한 진행률을 알린다", () => {
  render(<><CalculationProgress completed={6} total={9} currentCandidate="성수역" /><PartialFailureNotice failedCount={1} totalCount={9} /></>);
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "6");
  expect(screen.getByRole("alert")).toHaveTextContent("성공한 8개 경로는 그대로 표시합니다");
});

it("모든 경로가 실패해도 입력을 유지한다", () => {
  render(<ResultPanel summaries={[]} matrixData={[makeFailedRoute("s1", "e1")]} calculationProgress={{ completed: 1, total: 1 }} isCalculating={false} error="모든 경로 계산에 실패했습니다." onEditInputs={() => undefined} onRetry={() => undefined} onSelectCandidate={() => undefined} onOpenMatrix={() => undefined} />);
  expect(screen.getByRole("alert")).toHaveTextContent("모든 경로 계산에 실패했습니다");
  expect(screen.getByRole("button", { name: "다시 계산하기" })).toBeVisible();
  expect(screen.getByRole("button", { name: "장소 수정하기" })).toBeVisible();
});
```

- [ ] **2단계: 테스트를 실행해 실패 확인**

실행: `npm run test:unit -- tests/unit/result/resultComponents.test.tsx`

예상 결과: 새 결과 모듈이 없으므로 실패한다.

- [ ] **3단계: 결과 패널 컴포넌트 구현**

`BalanceSummary`는 `border-l-[3px] border-balance bg-balance-soft`, `평균과 최장 이동시간의 합이 가장 낮습니다.` 문구, 동일 비중의 지표 열 2개를 사용한다.

`CandidateRankList`는 완전한 요약을 불완전한 요약보다 먼저 렌더링하고 평균·최장 시간을 함께 표시한다. 불완전한 후보에는 `비교 불가 · {validRoutes}/{totalRoutes} 경로 완료` 레이블을 붙인다.

`CalculationProgress`는 작업 4의 `Progress`를 조립하고 `{completed} / {total}`과 현재 후보를 표시한다.

`PartialFailureNotice`는 전역 오류 문자열을 파싱하지 않고 개수를 전달받는다. `ResultPanel`에서 `matrixData.filter((result) => result.error || result.timeMn < 0).length`로 `failedCount`를 계산한다.

모든 매트릭스 항목이 실패했거나 완전한 후보 요약이 없으면 `ResultPanel`은 danger `InlineNotice`를 렌더링하고 장소 입력을 유지하며 `다시 계산하기`, `장소 수정하기`를 제공한다. 부분 실패에서는 모든 성공 경로를 계속 표시하고 불완전한 후보를 `황금 밸런스`로 올리지 않는다.

- [ ] **4단계: 입력·계산 중·결과·부분 실패 Lab 상태 추가**

허용 시나리오 유니온을 `foundation | empty | input | loading | result | partial-failure | total-failure`로 확장한다. 각 상태는 고정 픽스처를 사용하고 production과 같은 결과 컴포넌트를 렌더링한다.

실행: `npm run test:unit -- tests/unit/result/resultComponents.test.tsx tests/unit/result/resultModel.test.ts`

예상 결과: 통과한다.

- [ ] **5단계: 결과 요약 UI 커밋**

```bash
git add components/result/BalanceSummary.tsx components/result/CandidateRankList.tsx components/result/CalculationProgress.tsx components/result/PartialFailureNotice.tsx app/home/ResultPanel.tsx app/design-lab/DesignLabClient.tsx tests/unit/result/resultComponents.test.tsx
git commit -m "feat: 균형 후보 결과 요약 화면 추가"
```

---

### 작업 8: 경로 매트릭스와 접근 가능한 상세 시트 분리

**파일:**
- 생성: `components/result/RouteMatrix.tsx`
- 생성: `components/result/RouteDetailSheet.tsx`
- 생성: `tests/unit/result/routePresentation.test.tsx`
- 수정: `app/design-lab/DesignLabClient.tsx`
- 임시 유지: `components/result/ResultTable.tsx`
- 임시 유지: `components/result/RouteDetailModal.tsx`

**인터페이스:**
- `RouteMatrixProps`: `starts`, `ends`, `matrixData`, `activeMapRouteId?`, `onSelectRoute(result)`, `onOpenRoute(result, startName, endName)`.
- `RouteDetailSheetProps`: `isOpen`, `onClose`, `result`, `startName`, `endName`.

- [ ] **1단계: 실패하는 매트릭스·다이얼로그 테스트 작성**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import RouteMatrix from "@/components/result/RouteMatrix";
import RouteDetailSheet from "@/components/result/RouteDetailSheet";
import { makeLocation, makeRoute } from "@/tests/fixtures/transit";

it("성공한 매트릭스 경로를 선택하고 실패 경로는 비대화형으로 둔다", () => {
  const onSelectRoute = vi.fn();
  render(<RouteMatrix starts={[makeLocation("s1", "홍대")]} ends={[makeLocation("e1", "성수")]} matrixData={[makeRoute("s1", "e1", 21)]} onSelectRoute={onSelectRoute} onOpenRoute={() => undefined} />);
  fireEvent.click(screen.getByRole("button", { name: "홍대에서 성수까지 21분, 지도에서 보기" }));
  expect(onSelectRoute).toHaveBeenCalledTimes(1);
});

it("Escape로 상세 시트를 닫는다", () => {
  const onClose = vi.fn();
  render(<RouteDetailSheet isOpen onClose={onClose} result={makeRoute("s1", "e1", 21)} startName="홍대" endName="성수" />);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(1);
});
```

- [ ] **2단계: 테스트를 실행해 실패 확인**

실행: `npm run test:unit -- tests/unit/result/routePresentation.test.tsx`

예상 결과: 두 모듈이 없으므로 실패한다.

- [ ] **3단계: 비즈니스 로직 중복 없이 RouteMatrix 구현**

작업 1의 `findRouteResult`를 사용한다. 데스크톱 표 셀은 이동시간, 간결한 대중교통 요약, 요금, 선택 상태, 별도의 `상세 경로 보기` 동작을 표시한다. 실패 셀은 API가 제공한 메시지와 접근 가능한 상세 트리거를 표시한다. 이 컴포넌트 안에서 `getFairestEndId`를 호출하지 않는다.

- [ ] **4단계: 접근성 동작을 유지하며 RouteDetailSheet 구현**

`RouteDetailModal.tsx`에서 초기 포커스 획득, Escape 처리, 포커스 트랩, body 스크롤 잠금, 포커스 복원을 옮긴다. 장식용 교통 이모지는 `도보`, `지하철`, `버스` 텍스트 레이블과 시맨틱 경로 스타일로 교체한다. `sm` 이상에서는 중앙 다이얼로그, `sm` 미만에서는 바텀시트로 렌더링한다.

Design Lab에 고정 도보·지하철·버스 예시를 추가한다.

- [ ] **5단계: 경로 표현 검증 및 커밋**

실행: `npm run test:unit -- tests/unit/result/routePresentation.test.tsx`

실행: `npm run lint`

예상 결과: 두 명령 모두 종료 코드 0을 반환한다.

```bash
git add components/result/RouteMatrix.tsx components/result/RouteDetailSheet.tsx app/design-lab/DesignLabClient.tsx tests/unit/result/routePresentation.test.tsx
git commit -m "refactor: 경로 매트릭스와 상세 시트 분리"
```

---

### 작업 9: 시맨틱 지도 시각 요소 적용 및 MapWorkspace 구축

**파일:**
- 생성: `components/map/mapVisuals.ts`
- 생성: `components/map/MapWorkspace.tsx`
- 생성: `components/map/StaticMapSurface.tsx`
- 생성: `tests/unit/map/mapVisuals.test.ts`
- 수정: `components/map/MiniMap.tsx`
- 수정: `app/design-lab/DesignLabClient.tsx`

**인터페이스:**
- 제공: kind가 `origin | candidate`인 `createMapMarkerImage(kind, order, state)`.
- 제공: `walk | bus | subway`용 `ROUTE_VISUALS`.
- `MapWorkspaceProps`: 실시간 지도 입력, 선택 후보 요약, 선택 경로 이름.

- [ ] **1단계: 실패하는 시맨틱 시각 테스트 작성**

```ts
import { createMapMarkerImage, ROUTE_VISUALS } from "@/components/map/mapVisuals";

it("승인된 도메인 색상과 구분되는 마커 형태를 사용한다", () => {
  const origin = decodeURIComponent(createMapMarkerImage("origin", 1, "default").src);
  const candidate = decodeURIComponent(createMapMarkerImage("candidate", 1, "default").src);
  expect(origin).toContain("#397C8A");
  expect(candidate).toContain("#B9604B");
  expect(origin).not.toEqual(candidate);
});

it("모든 경로 구간 시각 요소를 정의한다", () => {
  expect(Object.keys(ROUTE_VISUALS).sort()).toEqual(["bus", "subway", "walk"]);
});
```

- [ ] **2단계: 테스트를 실행해 실패 확인**

실행: `npm run test:unit -- tests/unit/map/mapVisuals.test.ts`

예상 결과: `mapVisuals.ts`가 없으므로 실패한다.

- [ ] **3단계: 실시간 지도 시각 요소 추출·갱신**

인코딩된 Kakao 마커 데이터 이미지는 페이지 CSS 변수를 상속할 수 없으므로 시맨틱 토큰 계약과 일치하는 대문자 16진수 리터럴을 사용한다.

```ts
export const MAP_DOMAIN_COLORS = {
  origin: { fill: "#397C8A", stroke: "#235965" },
  candidate: { fill: "#B9604B", stroke: "#843E30" },
} as const;

export const ROUTE_VISUALS = {
  walk: { color: "#647774", opacity: 0.8, weight: 4, style: "shortdash" },
  bus: { color: "#2F6B56", opacity: 0.9, weight: 5, style: "solid" },
  subway: { color: "#397C8A", opacity: 0.9, weight: 5, style: "solid" },
} as const;
```

출발지 SVG는 원형, 후보지는 둥근 사각형 핀으로 만든다. 활성·약화 투명도와 선택 동작은 유지한다. `MiniMap`이 팩토리와 경로 시각 요소를 import하도록 바꾸고 직접 팔레트와 sky·emerald 클래스를 제거하며 8초 로딩 대체 상태는 유지한다.

- [ ] **4단계: 실시간·정적 작업공간 표면 구축**

`MapWorkspace`는 `MiniMap`을 동적 import하고 텍스트·형태 범례를 표시하며 지도 실패 문구를 유지한다. 결과가 있을 때만 하단 오버레이에 선택 후보 요약을 표시한다. `StaticMapSurface`는 CSS만으로 결정적인 도로 격자, 숫자·문자 마커, 선택 경로 선을 렌더링하며 Design Lab과 스크린숏 테스트에서만 사용한다.

- [ ] **5단계: 지도 표현 검증 및 커밋**

실행: `npm run test:unit -- tests/unit/map/mapVisuals.test.ts tests/unit/home/useSelectedRouteMapState.test.tsx`

실행: `npm run lint`

예상 결과: 두 명령 모두 종료 코드 0을 반환한다.

```bash
git add components/map/mapVisuals.ts components/map/MapWorkspace.tsx components/map/StaticMapSurface.tsx components/map/MiniMap.tsx app/design-lab/DesignLabClient.tsx tests/unit/map/mapVisuals.test.ts
git commit -m "feat: 시맨틱 지도 작업공간 추가"
```

---

### 작업 10: MainContent를 반응형 ComparisonWorkspace로 교체

**파일:**
- 생성: `app/home/ComparisonWorkspace.tsx`
- 수정: `app/home/HomePageClient.tsx`
- 수정: `tests/e2e/regression.spec.ts`
- 수정: `tests/e2e/calm-transit.spec.ts`
- 삭제: `app/home/MainContent.tsx`
- 삭제: `components/search/LocationInput.tsx`
- 삭제: `components/result/ResultTable.tsx`
- 삭제: `components/result/RouteDetailModal.tsx`

**인터페이스:**
- 입력·의존: 기존 `HomePageClient` 속성 `matrixData`, `isCalculating`, `calculateMatrix`, `error`, `resetMatrix`, `calculationProgress`.
- 소유: store 접근, 선택 경로 지도 상태, 패널 모드, 선택 상세 경로, 콜백.
- 제공: `LocationPanel | ResultPanel`과 `MapWorkspace`를 포함한 `장소 비교 작업공간` 영역 하나.

- [ ] **1단계: 실패하는 데스크톱·모바일 작업공간 E2E 테스트 추가**

```ts
test("Calm Transit 데스크톱 작업공간에서 비교 동작과 지도를 함께 유지한다", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "장소 비교 작업공간" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "어디서 만나는 게 가장 균형 잡힐까요?" })).toBeVisible();
  await expect(page.getByRole("region", { name: "출발지와 후보지 지도" })).toBeVisible();
});

test("모바일은 한 줄 앱 바와 지도 바텀시트를 사용한다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "장소 입력" })).toBeVisible();
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(390);
});

test("비교 작업공간은 320px에서 가로로 넘치지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  const widths = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);
});
```

- [ ] **2단계: E2E 파일을 실행해 실패 확인**

실행: `npm run test:e2e -- tests/e2e/calm-transit.spec.ts`

예상 결과: 이름이 지정된 작업공간과 시트 영역이 없으므로 실패한다.

- [ ] **3단계: 오케스트레이션과 상태 선택 구현**

```ts
const hasLocations = starts.length > 0 || ends.length > 0;
const hasResults = matrixData.length > 0 && !isCalculating;
const panelMode = isCalculating ? "loading" : hasResults ? "result" : hasLocations ? "input" : "empty";
const summaries = buildCandidateSummaries(starts, ends, matrixData);
```

`handleCalculate`는 현재 `MainContent`와 동일하게 날짜·시간을 전달한다. 모든 추가·제거 콜백은 store 변경 전에 `resetMatrix()`를 호출해 기존의 오래된 결과 방지 동작을 유지한다. `useSelectedRouteMapState`는 변경하지 않는다.

- [ ] **4단계: 지도 중심 데스크톱·모바일 조립 구현**

데스크톱은 `grid-template-columns: minmax(320px, 360px) minmax(0, 1fr)`과 뷰포트 높이의 지도 작업공간 하나를 사용한다. 모바일은 같은 지도를 배경으로 사용하고 작업 4의 `BottomSheet` 안에 `LocationPanel`, `CalculationProgress`, `ResultPanel` 중 하나를 표시한다. 시트는 상태를 중복 소유하거나 두 번째 실시간 지도를 렌더링하면 안 된다.

`HomePageClient`에서 최대 너비 카드 페이지 래퍼를 제거하고 `ComparisonWorkspace`를 import한다. 모든 경로 mock과 검증은 유지하면서 기존 회귀 테스트 선택자를 `소요시간 비교하기 🚀`에서 계산된 경로 수 버튼 이름으로 변경한다.

- [ ] **5단계: 집중·전체 회귀 테스트 실행**

실행: `npm run test:unit -- tests/unit/hooks/useTransitMatrix.test.tsx tests/unit/home/useSelectedRouteMapState.test.tsx`

실행: `npm run test:e2e -- tests/e2e/regression.spec.ts tests/e2e/calm-transit.spec.ts`

예상 결과: 공유, C3/S500 스케줄링, 부분 성공, 지도 선택을 포함한 모든 테스트가 통과한다.

- [ ] **6단계: 작업공간 교체 커밋**

```bash
git add app/home/ComparisonWorkspace.tsx app/home/HomePageClient.tsx tests/e2e/regression.spec.ts tests/e2e/calm-transit.spec.ts
git rm app/home/MainContent.tsx components/search/LocationInput.tsx components/result/ResultTable.tsx components/result/RouteDetailModal.tsx
git commit -m "feat: 지도 중심 비교 작업공간 적용"
```

---

### 작업 11: 전역 헤더·푸터 교체 및 보조 페이지 토큰화

**파일:**
- 생성: `components/layout/SiteHeader.tsx`
- 생성: `components/layout/SiteFooter.tsx`
- 수정: `app/layout.tsx`
- 수정: `app/about/page.tsx`
- 수정: `app/contact/page.tsx`
- 수정: `app/middle-point/page.tsx`
- 수정: `app/multi-route/page.tsx`
- 수정: `app/story/page.tsx`
- 수정: `app/tips/page.tsx`
- 수정: `app/privacy/page.tsx`
- 수정: `app/terms/page.tsx`
- 수정: `app/not-found.tsx`
- 수정: `app/contact/ContactForm.tsx`
- 수정: `tests/e2e/calm-transit.spec.ts`

**인터페이스:**
- 제공: 한 줄 데스크톱·모바일 앱 바.
- 이름이 있는 모바일 메뉴와 푸터를 통해 보조 콘텐츠 경로에 계속 접근할 수 있게 한다.

- [ ] **1단계: 실패하는 헤더 레이아웃 검증 추가**

```ts
test("모바일 헤더는 한 줄을 유지하고 보조 내비게이션을 제공한다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const header = page.getByRole("banner");
  expect((await header.boundingBox())?.height).toBeLessThanOrEqual(64);
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await expect(page.getByRole("link", { name: "서비스 소개" })).toBeVisible();
});
```

- [ ] **2단계: E2E 테스트를 실행해 실패 확인**

실행: `npm run test:e2e -- tests/e2e/calm-transit.spec.ts`

예상 결과: 현재 헤더가 줄바꿈되고 메뉴 버튼이 없으므로 실패한다.

- [ ] **3단계: SiteHeader·SiteFooter 구현**

SiteHeader는 데스크톱에서 `장소 비교`, `이용 방법`, `서비스 소개`를 계속 표시한다. 모바일은 브랜드, `장소 비교`, 44px `메뉴 열기` 버튼을 표시하며 메뉴를 열면 기존 모든 경로가 나타난다. 메뉴 상태에만 클라이언트 컴포넌트를 사용하고 경로 선택 후 메뉴를 닫는다.

SiteFooter는 정책·문의 링크를 유지하고 교육용 링크를 `서비스 안내` 그룹 하나로 모은다. 두 컴포넌트 모두 시맨틱 토큰과 굵기 400~600을 사용한다.

- [ ] **4단계: 보조 페이지를 시맨틱 클래스로 이전**

호환 클래스를 `bg-canvas`, `bg-surface`, `text-text`, `text-text-muted`, `border-border`, `text-action`으로 교체한다. 메타데이터, 문구, JSON-LD, 폼, 경로는 변경하지 않는다.

- [ ] **5단계: 전역 프레임 검증 및 커밋**

실행: `npm run test:e2e -- tests/e2e/calm-transit.spec.ts`

실행: `npm run lint`

실행: `npm run build`

예상 결과: 모든 명령이 종료 코드 0을 반환하고 production 빌드에서 `/design-lab`을 사용 가능한 콘텐츠로 노출하지 않는다.

```bash
git add components/layout/SiteHeader.tsx components/layout/SiteFooter.tsx app/layout.tsx app/about/page.tsx app/contact/page.tsx app/contact/ContactForm.tsx app/middle-point/page.tsx app/multi-route/page.tsx app/story/page.tsx app/tips/page.tsx app/privacy/page.tsx app/terms/page.tsx app/not-found.tsx tests/e2e/calm-transit.spec.ts
git commit -m "feat: 사이트 내비게이션과 콘텐츠 스타일 단순화"
```

---

### 작업 12: 결정적 Design Lab 시나리오·시각 회귀 추가

**파일:**
- 수정: `app/design-lab/DesignLabClient.tsx`
- 수정: `components/design-lab/fixtures.ts`
- 생성: `tests/e2e/design-lab.visual.spec.ts`
- 수정: `package.json`

**인터페이스:**
- 입력·의존: 공통 production 컴포넌트와 `StaticMapSurface`.
- 제공: `foundation`, `empty`, `input`, `loading`, `result`, `partial-failure`, `total-failure`의 안정적인 URL.

- [ ] **1단계: 승인된 뷰포트·상태의 실패하는 시각 테스트 작성**

```ts
import { expect, test } from "@playwright/test";

const scenarios = ["empty", "input", "loading", "result", "partial-failure", "total-failure"] as const;

for (const scenario of scenarios) {
  test(`${scenario} 데스크톱 시각 회귀`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/design-lab?scenario=${scenario}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${scenario}-1440.png`, { fullPage: true, animations: "disabled" });
  });

  test(`${scenario} 모바일 시각 회귀`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/design-lab?scenario=${scenario}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${scenario}-390.png`, { fullPage: true, animations: "disabled" });
  });
}
```

- [ ] **2단계: 기준 이미지 생성 전 시각 테스트 실패 확인**

실행: `npm run test:e2e -- tests/e2e/design-lab.visual.spec.ts`

예상 결과: 스크린숏 또는 완성된 시나리오가 없어 실패한다.

- [ ] **3단계: 결정적 시나리오 완성**

모든 시나리오는 고정 픽스처와 `StaticMapSurface`로 `ComparisonWorkspace`의 표현 컴포넌트를 렌더링한다. Zustand 변경, 타이머, 현재 날짜, 네트워크, Kakao SDK를 사용하지 않는다. 알 수 없는 시나리오 값은 `foundation`으로 대체하고 허용된 시나리오 이름을 네이티브 select에 표시한다.

- [ ] **4단계: 시각 테스트 스크립트 추가 및 기준 이미지 확립**

```json
{
  "scripts": {
    "test:visual": "playwright test tests/e2e/design-lab.visual.spec.ts"
  }
}
```

실행: `npm run test:visual -- --update-snapshots`

실행: `npm run test:visual`

예상 결과: 첫 명령은 승인 대상 기준 이미지 12개를 만들고 두 번째 명령은 이를 갱신하지 않은 채 통과한다.

- [ ] **5단계: 시각 시나리오·기준 이미지 커밋**

```bash
git add app/design-lab/DesignLabClient.tsx components/design-lab/fixtures.ts tests/e2e/design-lab.visual.spec.ts tests/e2e/design-lab.visual.spec.ts-snapshots package.json
git commit -m "test: 시각 기준 이미지 추가"
```

---

### 작업 13: 시맨틱 색상 규칙 강제·운영 문서 갱신·전체 검증

**파일:**
- 생성: `scripts/check-semantic-colors.mjs`
- 수정: `package.json`
- 수정: `app/globals.css`
- 수정: `docs/design-system.md`
- 수정: `app/contact/ContactForm.tsx`
- 수정: `components/ads/AdBanner.tsx`

**인터페이스:**
- 제공: production TSX 파일이 직접 Tailwind 팔레트 클래스를 사용하면 0이 아닌 종료 코드를 반환하는 `npm run lint:colors`.
- 마지막 사용처를 이전한 뒤 호환 별칭을 제거한다.

- [ ] **1단계: 색상 검사기를 추가하고 남은 직접 팔레트 클래스에서 실패 확인**

```js
// scripts/check-semantic-colors.mjs
import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const roots = ["app", "components"];
const forbidden = /\b(?:bg|text|border|ring|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d{1,3})?\b/g;
const violations = [];

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await scan(path);
    else if ([".ts", ".tsx"].includes(extname(path))) {
      const source = await readFile(path, "utf8");
      for (const match of source.matchAll(forbidden)) violations.push(`${path}: ${match[0]}`);
    }
  }
}

for (const root of roots) await scan(root);
if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exitCode = 1;
}
```

`package.json`에 `"lint:colors": "node scripts/check-semantic-colors.mjs"`를 추가한다.

실행: `npm run lint:colors`

예상 결과: 실패하면서 남은 직접 팔레트 클래스를 모두 출력한다.

- [ ] **2단계: 보고된 모든 클래스 교체 및 호환 별칭 제거**

계획 작성 전 검사 기준으로 앞선 작업을 마친 뒤에도 남는 production 파일은 `app/contact/ContactForm.tsx`, `components/ads/AdBanner.tsx`다. `docs/design-system.md`에 따라 각 사용처를 `origin`, `candidate`, `balance`, `success`, `warning`, `danger`, `info` 또는 중립 토큰으로 매핑한다. 검사기가 다른 파일을 추가로 보고하면 변경·스테이징 전에 작업 중 새로 들어온 이유를 확인한다. 주석이나 경로 제외로 검사기를 무력화하지 않는다. 위반이 0개가 된 뒤 `rg`로 사용처가 없음을 확인한 경우에만 작업 2에서 추가한 호환 별칭을 `app/globals.css`에서 제거한다.

- [ ] **3단계: 운영 문서를 구현 완료 상태로 갱신**

`docs/design-system.md`의 상태 줄을 `상태: 구현됨`으로 변경한다. 정확한 Design Lab 시나리오 URL과 `npm run lint:colors`, `npm run test:visual` 명령을 추가한다. 승인된 디자인 값은 변경하지 않는다.

- [ ] **4단계: 전체 검증 관문 실행**

실행: `npm run lint:colors`

실행: `npm run lint`

실행: `npm run test:unit`

실행: `npm run test:e2e`

실행: `npm run test:visual`

실행: `npm run build`

예상 결과: 여섯 명령 모두 종료 코드 0을 반환한다. `git status --short`에는 `scripts/check-semantic-colors.mjs`, `package.json`, `app/globals.css`, `app/contact/ContactForm.tsx`, `components/ads/AdBanner.tsx`, `docs/design-system.md`만 표시되어야 한다. Playwright 출력은 무시되거나 이미 커밋된 기준 이미지여야 한다.

- [ ] **5단계: 최종 규칙·문서 커밋**

```bash
git add scripts/check-semantic-colors.mjs package.json app/globals.css app/contact/ContactForm.tsx components/ads/AdBanner.tsx docs/design-system.md
git commit -m "chore: 디자인 계약 검사 적용"
```

---

## 최종 인수 체크리스트

- [ ] `황금 밸런스`는 계속 `utils/fairness.ts`에서만 결정되며 계산식이 바뀌지 않았다.
- [ ] 기존 공유, 요청 스케줄링, 부분 성공, 지도 선택 E2E 테스트가 통과한다.
- [ ] 데스크톱은 입력 또는 결과 옆에 실시간 지도 하나를 계속 유지한다.
- [ ] 모바일은 실시간 지도 하나와 상태 기반 바텀시트 하나를 사용한다.
- [ ] 빈 상태, 입력, 계산 중, 결과, 부분 실패, 전체 실패가 Design Lab에 모두 있다.
- [ ] 390px·1440px 스크린숏이 기준 이미지 갱신 없이 통과한다.
- [ ] 320px에서 페이지 수준의 가로 오버플로가 없다.
- [ ] 390px에서 헤더 높이가 64px 이하다.
- [ ] production TSX 파일에 직접 Tailwind 팔레트 클래스가 남아 있지 않다.
- [ ] 재설계된 비교 UI에 왕관, 장식용 그라디언트, 장식용 이모지가 남아 있지 않다.
- [ ] Pretendard를 자체 호스팅하고 body 폰트가 `--font-pretendard`를 사용한다.
- [ ] production에서 `/design-lab`이 not found를 반환한다.
- [ ] `docs/design-system.md`가 구현된 토큰, 컴포넌트, 시나리오, 명령과 일치한다.
- [ ] 각 작업이 범위가 분명한 별도 커밋이며 `.superpowers/`가 커밋되지 않았다.
