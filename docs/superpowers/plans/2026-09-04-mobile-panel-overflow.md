# 모바일 패널 및 푸터 경계 수정 구현 계획

> **작업 에이전트 필수 사항:** 이 계획은 `superpowers:subagent-driven-development`를 사용해 작업별로 구현한다. 각 단계는 체크박스(`- [ ]`)로 관리한다.

**목표:** 푸터 바로 위에서 비교 패널과 지도가 잘리는 문제를 없애고, 동작하지 않는 드래그 손잡이를 제거해 고정 패널의 역할을 명확하게 만든다.

**아키텍처:** `ComparisonWorkspaceShell`의 데스크톱 grid 행을 부모 높이에 고정하고 자식의 최소 높이와 세로 스크롤 계약을 명시한다. `BottomSheet`는 열기·닫기·드래그 상태를 소유하지 않는 정적 표면이므로 상호작용을 암시하는 손잡이를 렌더링하지 않는다.

**기술 스택:** Next.js 16.2.4 App Router, React 19.2.4, Tailwind CSS 4, Vitest, React Testing Library, Playwright.

**Spec:** `docs/design-system.md`

## 전역 제약

- 기존 `calc(100svh - 4rem)` 작업공간 높이와 모바일 `72svh` 내부 스크롤 구조는 유지한다.
- 768px 이상에서 패널과 지도 하단은 작업공간 하단을 넘어가지 않아야 한다.
- 내용이 작업공간보다 길면 패널 내부에서 세로 스크롤할 수 있어야 한다.
- 드래그·닫기 기능을 새로 만들지 않으며, 그런 기능을 암시하는 손잡이를 제거한다.
- production 컴포넌트에서는 의미 기반 디자인 토큰만 사용한다.
- 동작을 보호하는 테스트와 구현은 같은 작은 커밋에 포함하고 `.superpowers/`는 커밋하지 않는다.
- 사용자에게 보이는 계획과 커밋 설명은 한국어로 작성한다.

---

### Task 1: 비교 작업공간 경계와 정적 패널 표현 수정

**Files:**
- Modify: `components/layout/ComparisonWorkspaceShell.tsx`
- Modify: `components/ui/BottomSheet.tsx`
- Modify: `tests/e2e/calm-transit.spec.ts`
- Modify: `tests/unit/ui/feedback.test.tsx`
- Modify: `docs/design-system.md`
- Update: `tests/e2e/design-lab.visual.spec.ts-snapshots/*.png` 중 손잡이 제거로 실제 변경된 기준 이미지

**Interfaces:**
- Consumes: `ComparisonWorkspaceShellProps`, `BottomSheetProps`의 기존 공개 시그니처.
- Produces: 768px 이상에서 부모 높이를 넘지 않고 내부 스크롤하는 비교 패널, 상호작용 손잡이가 없는 정적 `BottomSheet` 표면.

- [ ] **Step 1: 푸터 경계 회귀 E2E 테스트 작성**

`tests/e2e/calm-transit.spec.ts`에 768×844 뷰포트로 홈을 열고 다음을 실제 DOM rect와 computed style로 검증하는 테스트를 추가한다.

```ts
test("데스크톱 비교 패널과 지도는 푸터 위 작업공간 안에서 스크롤된다", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 844 });
  await page.goto("/");

  const metrics = await page.evaluate(() => {
    const workspace = document.querySelector<HTMLElement>("[aria-label='장소 비교 작업공간']");
    const panel = document.querySelector<HTMLElement>("[aria-label='비교 패널']");
    const map = document.querySelector<HTMLElement>("[aria-label='출발지와 후보지 지도']");
    if (!workspace || !panel || !map) throw new Error("비교 작업공간을 찾지 못했습니다.");
    const workspaceBox = workspace.getBoundingClientRect();
    const panelBox = panel.getBoundingClientRect();
    const mapBox = map.getBoundingClientRect();
    return {
      workspaceBottom: workspaceBox.bottom,
      panelBottom: panelBox.bottom,
      mapBottom: mapBox.bottom,
      panelClientHeight: panel.clientHeight,
      panelScrollHeight: panel.scrollHeight,
      panelOverflowY: getComputedStyle(panel).overflowY,
    };
  });

  expect(metrics.panelBottom).toBeLessThanOrEqual(metrics.workspaceBottom + 1);
  expect(metrics.mapBottom).toBeLessThanOrEqual(metrics.workspaceBottom + 1);
  expect(metrics.panelScrollHeight).toBeGreaterThan(metrics.panelClientHeight);
  expect(metrics.panelOverflowY).toBe("auto");
});
```

- [ ] **Step 2: 정적 패널 손잡이 부재 테스트 작성**

`tests/unit/ui/feedback.test.tsx`의 기존 `BottomSheet` 테스트 이름을 `이름이 있는 피드백·정적 시트 영역을 렌더링한다`로 바꾸고, 손잡이 기대를 다음처럼 변경한다.

```ts
expect(sheet.querySelector('[aria-hidden="true"]')).toBeNull();
```

- [ ] **Step 3: RED 확인**

실행:

```bash
npm run test:unit -- tests/unit/ui/feedback.test.tsx
npx playwright test tests/e2e/calm-transit.spec.ts --grep "데스크톱 비교 패널과 지도"
```

예상 결과: 단위 테스트는 기존 손잡이가 남아 있어 실패하고, E2E는 패널/지도가 작업공간 하단을 넘거나 패널에 내부 스크롤이 없어 실패한다.

- [ ] **Step 4: 최소 구현**

`ComparisonWorkspaceShell`의 grid에 데스크톱 행 `md:grid-rows-[minmax(0,1fr)]`를 추가한다. 데스크톱 `aside`에 `md:min-h-0`를 추가하고, `BottomSheet`에는 `md:overflow-y-auto`를 명시해 고정된 행 안에서 내용이 스크롤되게 한다. 지도 영역도 데스크톱에서 `md:min-h-0`를 유지한다.

`BottomSheet`에서 `aria-hidden` 손잡이 `span`만 제거한다. 닫기 버튼, 드래그 이벤트, 새로운 상태는 추가하지 않는다.

- [ ] **Step 5: 디자인 문서 정정**

`docs/design-system.md`의 `BottomSheet` 및 공유 셸 설명에 다음 계약을 기록한다.

- 비교 패널은 닫기·드래그 상태가 없는 고정 표면이며 손잡이를 표시하지 않는다.
- 데스크톱 grid 행은 작업공간 높이를 넘지 않고, 긴 내용은 패널 내부에서 스크롤한다.

- [ ] **Step 6: GREEN 및 시각 회귀 확인**

실행:

```bash
npm run test:unit -- tests/unit/ui/feedback.test.tsx
npx playwright test tests/e2e/calm-transit.spec.ts --grep "데스크톱 비교 패널과 지도"
npm run test:visual -- --update-snapshots
npm run test:visual
npm run lint:colors
npm run lint
npm run test:unit
npm run test:e2e
npm run build
```

예상 결과: 모든 명령이 종료 코드 0을 반환한다. 갱신된 스냅샷은 손잡이 제거와 패널 경계 수정 외의 의도치 않은 변화가 없어야 한다.

- [ ] **Step 7: 작은 커밋 작성**

정확한 변경 파일만 스테이징한 뒤 다음 메시지로 커밋한다.

```bash
git commit -m "fix: 푸터 경계와 고정 비교 패널 정정"
```
